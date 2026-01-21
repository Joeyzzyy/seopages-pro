import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const merge_html_with_site_contexts = tool({
  description: `Merge the generated HTML content with site-wide contexts (header, footer, head tags).
  
This tool takes:
1. The base HTML document (either via base_html parameter or automatically from DB using item_id)
2. Optional header HTML to insert after <body>
3. Optional footer HTML to insert before </body>
4. Optional head tags to merge into the <head> section

It intelligently merges these components without duplication and SAVES the result back to the database.

IMPORTANT: 
- Call this tool AFTER assemble_html_page
- Provide item_id to automatically fetch the base HTML from the database (RECOMMENDED to save tokens)
- If header/footer are not provided, the tool will AUTOMATICALLY fetch them from site_contexts
- The result is automatically saved to the content item's generated_content field`,
  parameters: z.object({
    item_id: z.string().describe('The ID of the content item to fetch from database'),
    base_html: z.string().optional().describe('Optional base HTML string (if provided, this overrides the database content)'),
    header: z.string().optional().describe('HTML content for the site header/navigation (will be inserted after <body>). If not provided, will auto-fetch from site_contexts.'),
    footer: z.string().optional().describe('HTML content for the site footer (will be inserted before </body>). If not provided, will auto-fetch from site_contexts.'),
    head_tags: z.string().optional().describe('Custom head tags to merge into <head> section (meta tags, scripts, styles, etc.)'),
  }),
  execute: async ({ item_id, base_html, header, footer, head_tags }) => {
    try {
      let htmlToProcess = base_html;
      let headerHtml = header;
      let footerHtml = footer;

      // If base_html is not provided, fetch it from the database using item_id
      if (!htmlToProcess && item_id) {
        console.log(`[merge_html_with_site_contexts] Fetching base HTML from DB for item: ${item_id}`);
        const { data: item, error: fetchError } = await supabase
          .from('content_items')
          .select('generated_content, user_id, project_id')
          .eq('id', item_id)
          .single();
        
        if (fetchError || !item?.generated_content) {
          throw new Error(`Failed to fetch content item or it has no generated content: ${fetchError?.message || 'Empty content'}`);
        }
        htmlToProcess = item.generated_content;

        // AUTO-FETCH header and footer from site_contexts if not provided
        if (!headerHtml || !footerHtml) {
          console.log(`[merge_html_with_site_contexts] Auto-fetching header/footer from site_contexts for user: ${item.user_id}, project: ${item.project_id}`);
          
          let contextQuery = supabase
            .from('site_contexts')
            .select('type, content')
            .eq('user_id', item.user_id)
            .in('type', ['header', 'footer']);
          
          if (item.project_id) {
            contextQuery = contextQuery.eq('project_id', item.project_id);
          } else {
            contextQuery = contextQuery.is('project_id', null);
          }
          
          const { data: contexts, error: contextError } = await contextQuery;
          
          if (!contextError && contexts) {
            const headerContext = contexts.find(c => c.type === 'header');
            const footerContext = contexts.find(c => c.type === 'footer');
            
            if (!headerHtml && headerContext?.content) {
              headerHtml = headerContext.content;
              console.log(`[merge_html_with_site_contexts] Auto-loaded header from site_contexts (${headerContext.content.length} chars)`);
            } else if (!headerHtml) {
              console.log(`[merge_html_with_site_contexts] WARNING: No header found in site_contexts`);
            }
            
            if (!footerHtml && footerContext?.content) {
              footerHtml = footerContext.content;
              console.log(`[merge_html_with_site_contexts] Auto-loaded footer from site_contexts (${footerContext.content.length} chars)`);
            } else if (!footerHtml) {
              console.log(`[merge_html_with_site_contexts] WARNING: No footer found in site_contexts`);
            }
          } else if (contextError) {
            console.error(`[merge_html_with_site_contexts] Error fetching site_contexts:`, contextError);
          }
        }
      }

      if (!htmlToProcess) {
        throw new Error('No base HTML provided or found in database.');
      }

      // Extract head content
      let headContent = '';
      const headMatch = htmlToProcess.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
      if (headMatch) {
        headContent = headMatch[1];
      }

      // Extract body content
      let bodyContent = '';
      const bodyMatch = htmlToProcess.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        bodyContent = bodyMatch[1];
      }

      // Merge head tags
      let mergedHeadContent = headContent;
      if (head_tags) {
        // Extract content between <head> and </head> tags if present in head_tags
        const customHeadMatch = head_tags.match(/<head[^>]*>([\s\S]*)<\/head>/i);
        const customHeadContent = customHeadMatch ? customHeadMatch[1] : head_tags;

        // Parse existing head to check for duplicate tags
        const hasTitle = /<title>/i.test(headContent);
        const customHasTitle = /<title>/i.test(customHeadContent);
        
        // If both have title, keep the base HTML's title (page-specific)
        let customToAdd = customHeadContent;
        if (hasTitle && customHasTitle) {
          // Remove title from custom head tags
          customToAdd = customHeadContent.replace(/<title>[\s\S]*?<\/title>/gi, '');
        }

        // Extract base description
        const baseDescMatch = headContent.match(/<meta[^>]+name=["']description["'][^>]*>/i);
        const customDescMatch = customToAdd.match(/<meta[^>]+name=["']description["'][^>]*>/i);
        
        // If both have description, keep base (page-specific)
        if (baseDescMatch && customDescMatch) {
          customToAdd = customToAdd.replace(/<meta[^>]+name=["']description["'][^>]*>/gi, '');
        }

        // Merge: base head content + custom tags
        mergedHeadContent = headContent.trim() + '\n' + customToAdd.trim();
      }

      // Ensure Tailwind CSS is ALWAYS present
      if (!/<script[^>]+src=["']https:\/\/cdn\.tailwindcss\.com["'][^>]*>/i.test(mergedHeadContent)) {
        mergedHeadContent = mergedHeadContent.replace('</title>', '</title>\n  <script src="https://cdn.tailwindcss.com"></script>');
      }

      // Merge body with header and footer
      let mergedBodyContent = bodyContent.trim();
      
      // Insert header after opening body tag
      if (headerHtml) {
        // Check if body starts with whitespace
        const leadingWhitespace = mergedBodyContent.match(/^\s*/)?.[0] || '';
        mergedBodyContent = leadingWhitespace + headerHtml.trim() + '\n' + mergedBodyContent.replace(/^\s*/, '');
      }

      // Insert footer before closing body tag
      if (footerHtml) {
        // Check if body ends with whitespace
        const trailingWhitespace = mergedBodyContent.match(/\s*$/)?.[0] || '';
        mergedBodyContent = mergedBodyContent.replace(/\s*$/, '') + '\n' + footerHtml.trim() + trailingWhitespace;
      }

      // Rebuild complete HTML document
      const mergedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
${mergedHeadContent}
</head>
<body>
${mergedBodyContent}
</body>
</html>`;

      // Save the merged HTML back to the database
      if (item_id) {
        console.log(`[merge_html_with_site_contexts] Saving merged HTML to database for item: ${item_id}`);
        await supabase
          .from('content_items')
          .update({
            generated_content: mergedHtml,
            status: 'in_production',
            updated_at: new Date().toISOString()
          })
          .eq('id', item_id);
      }

      return {
        success: true,
        item_id,
        merged_html: mergedHtml.length > 5000 ? mergedHtml.substring(0, 5000) + '... (truncated)' : mergedHtml,
        full_html_length: mergedHtml.length,
        has_header: !!headerHtml,
        has_footer: !!footerHtml,
        has_custom_head: !!head_tags,
        header_source: header ? 'provided' : (headerHtml ? 'auto-fetched from site_contexts' : 'none'),
        footer_source: footer ? 'provided' : (footerHtml ? 'auto-fetched from site_contexts' : 'none'),
        message: `HTML merged successfully and saved to database. Header: ${headerHtml ? 'YES' : 'NO'}, Footer: ${footerHtml ? 'YES' : 'NO'}. The next step (fix style conflicts) will read the content from the database using the item_id.`,
      };
    } catch (error: any) {
      console.error('[merge_html_with_site_contexts] Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
});

