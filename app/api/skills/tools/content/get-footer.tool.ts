import { tool } from 'ai';
import { z } from 'zod';
import { createServerSupabaseAdmin } from '@/lib/supabase-server';

// Lazy-initialize Supabase client to ensure proxy is configured
let _supabase: ReturnType<typeof createServerSupabaseAdmin> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createServerSupabaseAdmin();
  }
  return _supabase;
}

export const get_footer = tool({
  description: `Retrieve the user's saved site footer HTML.
  
This tool fetches the custom footer HTML that should be inserted at the bottom of generated pages.

Returns:
- success: boolean
- footer: string (the HTML content) or null if not set
- message: status message

Use this tool BEFORE merging the final HTML to get the footer component.`,
  parameters: z.object({
    user_id: z.string().describe('The user ID to fetch footer for'),
  }),
  execute: async ({ user_id }) => {
    try {
      const { data, error } = await getSupabase()
        .from('site_contexts')
        .select('content')
        .eq('user_id', user_id)
        .eq('type', 'footer')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return {
            success: true,
            footer: null,
            message: 'No footer configured for this user'
          };
        }
        throw error;
      }

      return {
        success: true,
        footer: data?.content || null,
        message: data?.content ? 'Footer found' : 'Footer is empty'
      };
    } catch (error: any) {
      console.error('[get_footer] Error:', error);
      return {
        success: false,
        footer: null,
        error: error.message
      };
    }
  },
});

