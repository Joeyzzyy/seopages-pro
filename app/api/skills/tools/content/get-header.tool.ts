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

export const get_header = tool({
  description: `Retrieve the user's saved site header HTML.
  
This tool fetches the custom header/navigation HTML that should be inserted at the top of generated pages.

Returns:
- success: boolean
- header: string (the HTML content) or null if not set
- message: status message

Use this tool BEFORE merging the final HTML to get the header component.`,
  parameters: z.object({
    user_id: z.string().describe('The user ID to fetch header for'),
  }),
  execute: async ({ user_id }) => {
    try {
      const { data, error } = await getSupabase()
        .from('site_contexts')
        .select('content')
        .eq('user_id', user_id)
        .eq('type', 'header')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return {
            success: true,
            header: null,
            message: 'No header configured for this user'
          };
        }
        throw error;
      }

      return {
        success: true,
        header: data?.content || null,
        message: data?.content ? 'Header found' : 'Header is empty'
      };
    } catch (error: any) {
      console.error('[get_header] Error:', error);
      return {
        success: false,
        header: null,
        error: error.message
      };
    }
  },
});

