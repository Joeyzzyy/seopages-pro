import { tool } from 'ai';
import { z } from 'zod';
import { createServerSupabaseAdmin } from '@/lib/supabase-server';

const supabase = createServerSupabaseAdmin();

export const list_content_projects = tool({
  description: 'List all Topic Clusters (Projects) in the user library.',
  parameters: z.object({
    user_id: z.string().describe('The current User ID from context'),
  }),
  execute: async ({ user_id }) => {
    try {
      const { data, error } = await supabase
        .from('content_projects')
        .select('id, name, description, created_at')
        .eq('user_id', user_id)
        .order('name', { ascending: true });

      if (error) throw error;

      return { 
        success: true, 
        count: data.length, 
        projects: data 
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});

