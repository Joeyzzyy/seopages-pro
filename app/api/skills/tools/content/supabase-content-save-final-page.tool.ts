import { tool } from 'ai';
import { z } from 'zod';
import { createServerSupabaseAdmin } from '@/lib/supabase-server';

// Use a server-side client with SERVICE_ROLE_KEY and proxy support
const supabase = createServerSupabaseAdmin();

export const save_final_page = tool({
  description: 'Save the complete generated content to the library and update status to "generated". This also generates a downloadable HTML file.',
  parameters: z.object({
    item_id: z.string().describe('The ID of the content item to update'),
    full_content: z.string().optional().describe('Optional full generated content (HTML5 document). If not provided, will read from database.'),
  }),
  execute: async ({ item_id, full_content }) => {
    try {
      let contentToSave = full_content;

      // If full_content is not provided, fetch it from the database using item_id
      // IMPORTANT: Retry mechanism to handle race condition with merge_html_with_site_contexts
      if (!contentToSave && item_id) {
        console.log(`[save_final_page] Fetching final HTML from DB for item: ${item_id}`);
        
        const maxRetries = 3;
        const retryDelay = 800; // ms
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          const { data: item, error: fetchError } = await supabase
            .from('content_items')
            .select('generated_content')
            .eq('id', item_id)
            .single();
          
          if (fetchError || !item?.generated_content) {
            throw new Error(`Failed to fetch content item or it has no generated content: ${fetchError?.message || 'Empty content'}`);
          }
          
          contentToSave = item.generated_content as string;
          
          // Check if header/footer are present (merge may still be running)
          const hasHeader = /<header[\s\S]*?<\/header>/i.test(contentToSave);
          const hasFooter = /<footer[\s\S]*?<\/footer>/i.test(contentToSave);
          
          if (hasHeader && hasFooter) {
            console.log(`[save_final_page] ✅ Found header/footer on attempt ${attempt}`);
            break;
          } else if (attempt < maxRetries) {
            console.log(`[save_final_page] ⚠️ Attempt ${attempt}/${maxRetries}: Missing header (${hasHeader}) or footer (${hasFooter}), waiting ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          } else {
            console.log(`[save_final_page] ⚠️ Max retries reached, proceeding with current content (header: ${hasHeader}, footer: ${hasFooter})`);
          }
        }
      }

      if (!contentToSave) {
        throw new Error('No content provided or found in database.');
      }

      // 🔧 FIX: Clean null characters (\u0000) that PostgreSQL text type doesn't support
      const nullCharCount = (contentToSave.match(/\u0000/g) || []).length;
      if (nullCharCount > 0) {
        console.log(`[save_final_page] ⚠️ Found ${nullCharCount} null characters (\\u0000), cleaning...`);
        contentToSave = contentToSave.replace(/\u0000/g, '');
      }

      // 🔍 DEBUG: Check for header/footer in content to save
      const hasHeader = /<header[\s\S]*?<\/header>/i.test(contentToSave);
      const hasFooter = /<footer[\s\S]*?<\/footer>/i.test(contentToSave);
      console.log(`[save_final_page] 🔍 Content length: ${contentToSave.length} chars`);
      console.log(`[save_final_page] 🔍 Has <header>: ${hasHeader}`);
      console.log(`[save_final_page] 🔍 Has <footer>: ${hasFooter}`);
      console.log(`[save_final_page] 🔍 Content starts with: ${contentToSave.substring(0, 300)}`);

      // Update content item and get user info
      const { data: item, error } = await supabase
        .from('content_items')
        .update({
          generated_content: contentToSave,
          status: 'generated',
          updated_at: new Date().toISOString()
        })
        .eq('id', item_id)
        .select('user_id')
        .single();

      if (error) throw error;
      if (!item) throw new Error('Content item not found');

      // Consume 1 credit for successful page generation
      let creditConsumed = false;
      try {
        const { data: creditResult, error: creditError } = await supabase
          .rpc('consume_credit', { user_id: item.user_id });
        
        if (creditError) {
          console.error('[save_final_page] Failed to consume credit:', creditError);
        } else {
          creditConsumed = creditResult === true;
          console.log(`[save_final_page] Credit consumed: ${creditConsumed}`);
        }
      } catch (creditErr) {
        console.error('[save_final_page] Error calling consume_credit:', creditErr);
      }

      // Upload HTML file to storage (Using server-side direct upload to bypass RLS)
      const timestamp = Date.now();
      const filename = `page-${item_id}-${timestamp}.html`;
      
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('files')
          .upload(`${item.user_id}/${timestamp}-${filename}`, contentToSave, {
            contentType: 'text/html; charset=utf-8',
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('files')
          .getPublicUrl(`${item.user_id}/${timestamp}-${filename}`);

        // Insert file record (conversation_id is null since content_items no longer links to conversations)
        await supabase.from('files').insert({
          user_id: item.user_id,
          conversation_id: null,
          filename: filename,
          original_filename: filename,
          file_type: 'txt',
          mime_type: 'text/html',
          file_size: contentToSave.length,
          storage_path: `${item.user_id}/${timestamp}-${filename}`,
          public_url: urlData.publicUrl
        });

        const previewUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/preview/${item_id}`;

        return { 
          success: true, 
          item_id,
          filename,
          publicUrl: urlData.publicUrl,
          public_url: urlData.publicUrl,
          previewUrl,
          preview_url: previewUrl,
          mimeType: 'text/html',
          fileSize: contentToSave.length,
          creditConsumed,
          message: `Page saved and HTML file generated. Online preview available.${creditConsumed ? ' 1 credit consumed.' : ''}`
        };
      } catch (uploadError: any) {
        // Even if upload fails, the content is saved in DB
        console.error('Failed to upload HTML file:', uploadError);
        const previewUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/preview/${item_id}`;
        return { 
          success: true, 
          item_id,
          previewUrl,
          preview_url: previewUrl,
          creditConsumed,
          warning: 'Content saved but file upload failed',
          uploadError: uploadError.message
        };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});

