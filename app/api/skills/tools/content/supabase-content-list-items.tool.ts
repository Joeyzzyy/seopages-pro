import { tool } from 'ai';
import { z } from 'zod';
import { createServerSupabaseAdmin } from '@/lib/supabase-server';

const supabase = createServerSupabaseAdmin();

export const list_content_items = tool({
  description: 'List content items in the library with their associated Topic Clusters.',
  parameters: z.object({
    user_id: z.string().describe('The current User ID from context'),
    status: z.string().optional().describe('Filter by status (ready, writing, generated)'),
    project_id: z.string().optional().describe('Filter by specific Topic Cluster ID'),
  }),
  execute: async ({ user_id, status, project_id }) => {
    try {
      // We join with content_projects to get the project name
      let query = supabase
        .from('content_items')
        .select(`
          id, 
          title, 
          status, 
          page_type, 
          target_keyword,
          project_id,
          content_projects (
            id,
            name
          )
        `)
        .eq('user_id', user_id);

      if (status) query = query.eq('status', status);
      if (project_id) query = query.eq('project_id', project_id);

      const { data, error } = await query;
      if (error) throw error;

      return { 
        success: true, 
        count: data.length, 
        items: data.map((item: any) => ({
          id: item.id,
          title: item.title,
          status: item.status,
          page_type: item.page_type,
          target_keyword: item.target_keyword,
          project_id: item.project_id,
          project_name: item.content_projects?.name || 'Unassigned'
        }))
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});
