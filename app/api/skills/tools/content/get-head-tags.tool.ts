import { tool } from 'ai';
import { z } from 'zod';
import { createServerSupabaseAdmin } from '@/lib/supabase-server';

const supabase = createServerSupabaseAdmin();

export const get_head_tags = tool({
  description: `Retrieve the user's saved custom <head> tags (meta tags, stylesheets, scripts, etc.).
  
This tool fetches the custom head content that should be merged into the <head> section of generated pages.

The content may include:
- Meta tags (og:tags, twitter:card, etc.)
- Stylesheets (<link> or <style> tags)
- Scripts (analytics, fonts, etc.)
- Other head elements

Returns:
- success: boolean
- head_tags: string (the HTML content) or null if not set
- message: status message

Use this tool BEFORE merging the final HTML to get the head tags to merge.`,
  parameters: z.object({
    user_id: z.string().describe('The user ID to fetch head tags for'),
  }),
  execute: async ({ user_id }) => {
    try {
      const { data, error } = await supabase
        .from('site_contexts')
        .select('content')
        .eq('user_id', user_id)
        .eq('type', 'meta')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return {
            success: true,
            head_tags: null,
            message: 'No custom head tags configured for this user'
          };
        }
        throw error;
      }

      return {
        success: true,
        head_tags: data?.content || null,
        message: data?.content ? 'Custom head tags found' : 'Head tags are empty'
      };
    } catch (error: any) {
      console.error('[get_head_tags] Error:', error);
      return {
        success: false,
        head_tags: null,
        error: error.message
      };
    }
  },
});

