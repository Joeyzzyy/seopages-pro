import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// Use a server-side client with SERVICE_ROLE_KEY to bypass RLS for backups
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const supabase = serviceSupabase; // Use service client for all operations in this tool

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
      if (!contentToSave && item_id) {
        console.log(`[save_final_page] Fetching final HTML from DB for item: ${item_id}`);
        const { data: item, error: fetchError } = await supabase
          .from('content_items')
          .select('generated_content')
          .eq('id', item_id)
          .single();
        
        if (fetchError || !item?.generated_content) {
          throw new Error(`Failed to fetch content item or it has no generated content: ${fetchError?.message || 'Empty content'}`);
        }
        contentToSave = item.generated_content;
      }

      if (!contentToSave) {
        throw new Error('No content provided or found in database.');
      }

      // Update content item and get user/conversation info
      const { data: item, error } = await supabase
        .from('content_items')
        .update({
          generated_content: contentToSave,
          status: 'generated',
          updated_at: new Date().toISOString()
        })
        .eq('id', item_id)
        .select('user_id, conversation_id')
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

        // Insert file record
        await supabase.from('files').insert({
          user_id: item.user_id,
          conversation_id: item.conversation_id,
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

