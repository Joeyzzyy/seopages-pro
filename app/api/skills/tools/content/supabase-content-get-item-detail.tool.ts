import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const get_content_item_detail = tool({
  description: 'Fetch the full details of a planned content item, including its outline and SEO data. You can use either the UUID item_id or the slug.',
  parameters: z.object({
    item_id: z.string().describe('The ID (UUID) or slug of the content item'),
  }),
  execute: async ({ item_id }) => {
    try {
      // Check if item_id looks like a UUID or a slug
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item_id);
      
      let data, error;
      
      if (isUuid) {
        // Query by UUID
        const result = await supabase
          .from('content_items')
          .select('*')
          .eq('id', item_id)
          .single();
        data = result.data;
        error = result.error;
      } else {
        // Query by slug (case-insensitive)
        const result = await supabase
          .from('content_items')
          .select('*')
          .ilike('slug', item_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        data = result.data;
        error = result.error;
      }
      
      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});

