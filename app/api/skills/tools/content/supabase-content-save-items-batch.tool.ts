import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const contentItemSchema = z.object({
  title: z.string().describe('Content title (H1)'),
  target_keyword: z.string().describe('Primary keyword'),
  page_type: z.literal('alternative').default('alternative').describe('Page type - always alternative page'),
  outline: z.object({
    h1: z.string(),
    sections: z.array(z.object({
      h2: z.string(),
      h3s: z.array(z.string()).optional(),
      key_points: z.array(z.string()).optional(),
      word_count: z.number().optional(),
    })),
  }).describe('Complete content outline structure'),
  seo_title: z.string().optional().describe('SEO title'),
  seo_description: z.string().optional().describe('Meta description'),
  keyword_data: z.object({
    volume: z.number().nullish(),
    kd: z.number().nullish(),
    cpc: z.number().nullish(),
    competition: z.number().nullish(),
  }).nullish(),
  serp_insights: z.any().optional(),
  reference_urls: z.array(z.string()).optional(),
  internal_links: z.array(z.object({
    target_page: z.string().describe('Title or Keyword of the page to link to'),
    anchor_text: z.string().describe('The clickable text for the link'),
    reason: z.string().optional().describe('Why this link is important'),
  })).optional().describe('Internal linking plan for this page'),
  estimated_word_count: z.number().optional(),
  priority: z.number().min(1).max(5).optional().default(3),
  notes: z.string().optional(),
});

export const save_content_items_batch = tool({
  description: 'Save multiple content items at once. This is the REQUIRED method for saving lists of pages or topic clusters. It handles project creation automatically and prevents duplicates. ALWAYS use this over save_content_item for batch operations.',
  parameters: z.object({
    user_id: z.string().describe('The current User ID'),
    project_name: z.string().optional().describe('STRONGLY RECOMMENDED: Name of the Topic Cluster (Project) to group ALL these items under. Extract this from the conversation context (e.g., main topic, cluster name, theme, or keyword category). If these items belong to the same topic/cluster, you MUST provide this. The system will automatically reuse existing projects with matching names (case-insensitive). Only omit if items are truly unrelated.'),
    items: z.array(contentItemSchema).describe('List of content items to save'),
    conversation_id: z.string().optional().describe('Conversation ID'),
  }),
  execute: async (params) => {
    try {
      let project_id = null;

      // 1. Resolve Project ID (Once for the whole batch)
      if (params.project_name) {
        const normalizedProjectName = params.project_name.trim();
        
        // Check for existing project with case-insensitive match
        const { data: existingProject } = await supabase
          .from('content_projects')
          .select('id')
          .eq('user_id', params.user_id)
          .ilike('name', normalizedProjectName)
          .maybeSingle();
          
        if (existingProject) {
          project_id = existingProject.id;
        } else {
          // Create new project
          const { data: newProject, error: pErr } = await supabase
            .from('content_projects')
            .insert({ user_id: params.user_id, name: normalizedProjectName })
            .select('id')
            .single();
            
          if (pErr) {
            // Handle race condition (unique violation)
            if (pErr.code === '23505') {
              const { data: retryProject } = await supabase
                .from('content_projects')
                .select('id')
                .eq('user_id', params.user_id)
                .ilike('name', normalizedProjectName)
                .maybeSingle();
              if (retryProject) project_id = retryProject.id;
              else throw pErr;
            } else {
              throw pErr;
            }
          } else {
            project_id = newProject.id;
          }
        }
      }

      // 2. Prepare all items for insertion
      const itemsToInsert = params.items.map(item => {
        const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        return {
          user_id: params.user_id,
          conversation_id: params.conversation_id,
          project_id,
          title: item.title,
          slug,
          page_type: item.page_type,
          target_keyword: item.target_keyword,
          seo_title: item.seo_title || item.title,
          seo_description: item.seo_description,
          keyword_data: item.keyword_data,
          outline: item.outline,
          serp_insights: item.serp_insights,
          reference_urls: item.reference_urls,
          internal_links: item.internal_links,
          estimated_word_count: item.estimated_word_count,
          priority: item.priority,
          notes: item.notes,
          status: 'ready'
        };
      });

      // 3. Bulk Insert
      const { data, error } = await supabase
        .from('content_items')
        .insert(itemsToInsert)
        .select('id');

      if (error) throw error;

      return { 
        success: true, 
        count: data.length, 
        project_id,
        project_name: params.project_name, 
        message: `Successfully saved ${data.length} items to project "${params.project_name || 'Unassigned'}".` 
      };

    } catch (e: any) { 
      return { success: false, error: e.message }; 
    }
  },
});

