import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const get_site_contexts = tool({
  description: `Retrieve saved site-wide HTML components, brand assets, and site settings for the current user. 
  
This tool fetches the user's saved site context elements that can be used to create consistent, branded web pages.

Available context types:
- "logo": The uploaded logo image URL
- "header": HTML code for the site header/navigation
- "footer": HTML code for the site footer
- "meta": Complete <head> tag content including meta tags, stylesheets, scripts, etc.

Brand asset fields (stored with logo type):
- "primary_color": Brand primary color (hex code)
- "secondary_color": Brand secondary color (hex code)
- "heading_font": Font family for headings
- "body_font": Font family for body text
- "tone": Brand tone and voice guidelines
- "languages": Supported languages

Use this tool BEFORE generating HTML pages to ensure the generated pages include the user's branding and layout.`,
  parameters: z.object({
    user_id: z.string().describe('The user ID to fetch contexts for'),
    types: z.array(z.enum(['logo', 'header', 'footer', 'meta', 'sitemap'])).optional().describe('Specific context types to fetch. If not provided, fetches all types.')
  }),
  execute: async ({ user_id, types }) => {
    try {
      let query = supabase
        .from('site_contexts')
        .select('*')
        .eq('user_id', user_id);

      // Filter by specific types if provided
      if (types && types.length > 0) {
        query = query.in('type', types);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[get_site_contexts] Error fetching contexts:', error);
        return {
          success: false,
          error: `Failed to fetch site contexts: ${error.message}`,
          contexts: []
        };
      }

      // Transform data into a more usable format
      const contexts: Record<string, { content?: string; fileUrl?: string; updatedAt: string }> = {};
      
      if (data) {
        data.forEach((item: any) => {
          contexts[item.type] = {
            content: item.content || undefined,
            fileUrl: item.file_url || undefined,
            updatedAt: item.updated_at
          };
        });
      }

      return {
        success: true,
        contexts,
        message: `Found ${data?.length || 0} site context(s) for user`,
        // Provide convenient access to specific contexts
        logo: contexts.logo?.fileUrl || null,
        header: contexts.header?.content || null,
        footer: contexts.footer?.content || null,
        head: contexts.meta?.content || null,
      };
    } catch (error: any) {
      console.error('[get_site_contexts] Unexpected error:', error);
      return {
        success: false,
        error: `Unexpected error: ${error.message}`,
        contexts: {}
      };
    }
  },
});

