import { tool } from 'ai';
import { z } from 'zod';
import { createServerSupabaseAdmin } from '@/lib/supabase-server';

const supabase = createServerSupabaseAdmin();

export const save_content_item = tool({
  description: 'Save a SINGLE planned content item. WARNING: If you are saving multiple items (e.g. a full topic cluster), DO NOT use this tool repeatedly. Use "save_content_items_batch" instead to prevent duplicate projects.',
  parameters: z.object({
    title: z.string().describe('Content title (H1)'),
    target_keyword: z.string().describe('Primary keyword'),
    seo_project_id: z.string().describe('The SEO Project (conversation) ID that this item belongs to'),
    project_name: z.string().optional().describe('Name of the Topic Cluster (Project) to group this under'),
    page_type: z.literal('alternative').default('alternative').describe('Page type - always alternative page'),
    outline: z.object({
      h1: z.string(),
      sections: z.array(z.object({
        h2: z.string(),
        h3s: z.array(z.string()).optional(),
        key_points: z.array(z.string()).optional(),
        word_count: z.number().describe('REQUIRED: Word count for this section (e.g., 300-500 words)'),
      })),
    }).describe('Complete content outline structure. Each section MUST have a word_count.'),
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
    estimated_word_count: z.number().describe('REQUIRED: Estimated total word count for the page. Must be provided based on section word counts.'),
    notes: z.string().optional(),
    user_id: z.string().describe('User ID'),
  }),
  execute: async (params) => {
    try {
      let project_id = null;
      const seoProjectId = params.seo_project_id;
      
      if (params.project_name) {
        const normalizedProjectName = params.project_name.trim();
        
        // Check for existing project with case-insensitive match within the same SEO project
        let existingQuery = supabase
          .from('content_projects')
          .select('id')
          .eq('user_id', params.user_id)
          .ilike('name', normalizedProjectName);
        
        // Scope to SEO project if provided
        if (seoProjectId) {
          existingQuery = existingQuery.eq('seo_project_id', seoProjectId);
        }
        
        const { data: existingProject } = await existingQuery.maybeSingle();
          
        if (existingProject) {
          project_id = existingProject.id;
        } else {
          // Create new project with seo_project_id
          const insertData: any = { 
            user_id: params.user_id, 
            name: normalizedProjectName 
          };
          if (seoProjectId) {
            insertData.seo_project_id = seoProjectId;
          }
          
          const { data: newProject, error: pErr } = await supabase
            .from('content_projects')
            .insert(insertData)
            .select('id')
            .single();
            
          if (pErr) {
            // If we hit a unique constraint violation (race condition), try fetching again
            if (pErr.code === '23505') { // unique_violation
              let retryQuery = supabase
                .from('content_projects')
                .select('id')
                .eq('user_id', params.user_id)
                .ilike('name', normalizedProjectName);
              
              if (seoProjectId) {
                retryQuery = retryQuery.eq('seo_project_id', seoProjectId);
              }
              
              const { data: retryProject } = await retryQuery.maybeSingle();
                
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
        seo_project_id: seoProjectId, // Direct link to SEO project (domain)
        project_id, // Topic Cluster ID 
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

