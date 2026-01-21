import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const save_content_item = tool({
  description: 'Save a SINGLE planned content item. WARNING: If you are saving multiple items (e.g. a full topic cluster), DO NOT use this tool repeatedly. Use "save_content_items_batch" instead to prevent duplicate projects.',
  parameters: z.object({
    title: z.string().describe('Content title (H1)'),
    target_keyword: z.string().describe('Primary keyword'),
    project_name: z.string().optional().describe('Name of the Topic Cluster (Project) to group this under'),
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
    user_id: z.string().describe('User ID'),
    conversation_id: z.string().optional().describe('Conversation ID'),
  }),
  execute: async (params) => {
    try {
      let project_id = null;
      if (params.project_name) {
        const normalizedProjectName = params.project_name.trim();
        
        // Check for existing project with case-insensitive match
        const { data: existingProject } = await supabase
          .from('content_projects')
          .select('id')
          .eq('user_id', params.user_id)
          .ilike('name', normalizedProjectName) // Use ilike for case-insensitive comparison
          .maybeSingle();
          
        if (existingProject) {
          project_id = existingProject.id;
        } else {
          // Create new project
          // Note: In high concurrency without DB unique constraints, this might still race.
          // Ideally the DB should have a unique index on (user_id, lower(name)).
          const { data: newProject, error: pErr } = await supabase
            .from('content_projects')
            .insert({ user_id: params.user_id, name: normalizedProjectName })
            .select('id')
            .single();
            
          if (pErr) {
            // If we hit a unique constraint violation (race condition), try fetching again
            if (pErr.code === '23505') { // unique_violation
              const { data: retryProject } = await supabase
                .from('content_projects')
                .select('id')
                .eq('user_id', params.user_id)
                .ilike('name', normalizedProjectName)
                .maybeSingle();
                
              if (retryProject) {
                project_id = retryProject.id;
              } else {
                throw pErr;
              }
            } else {
              throw pErr;
            }
          } else {
            project_id = newProject.id;
          }
        }
      }
      const slug = params.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const { data, error } = await supabase.from('content_items').insert({
        user_id: params.user_id, 
        conversation_id: params.conversation_id, 
        project_id, 
        title: params.title, 
        slug, 
        page_type: params.page_type, 
        target_keyword: params.target_keyword, 
        seo_title: params.seo_title || params.title, 
        seo_description: params.seo_description, 
        keyword_data: params.keyword_data, 
        outline: params.outline, 
        serp_insights: params.serp_insights, 
        reference_urls: params.reference_urls, 
        internal_links: params.internal_links,
        estimated_word_count: params.estimated_word_count, 
        priority: params.priority, 
        notes: params.notes, 
        status: 'ready'
      }).select('id').single();
      if (error) throw error;
      return { success: true, item_id: data.id, project_id, message: 'Saved successfully.' };
    } catch (e: any) { return { success: false, error: e.message }; }
  },
});

(save_content_item as any).metadata = {
  name: 'Save Content',
  provider: 'Supabase'
};

