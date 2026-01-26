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
});

export const save_content_items_batch = tool({
  description: 'Save multiple content items at once. This is the REQUIRED method for saving lists of pages or topic clusters. It handles project creation automatically and prevents duplicates. ALWAYS use this over save_content_item for batch operations.',
  parameters: z.object({
    user_id: z.string().describe('The current User ID'),
    seo_project_id: z.string().describe('The SEO Project ID (domain) that these items belong to'),
    project_name: z.string().optional().describe('STRONGLY RECOMMENDED: Name of the Topic Cluster to group ALL these items under. Extract this from the context (e.g., main topic, cluster name, theme, or keyword category). If these items belong to the same topic/cluster, you MUST provide this. The system will automatically reuse existing projects with matching names (case-insensitive). Only omit if items are truly unrelated.'),
    items: z.array(contentItemSchema).describe('List of content items to save'),
  }),
  execute: async (params) => {
    try {
      let project_id = null;

      // 1. Resolve Project ID (Once for the whole batch)
      // Project is scoped to both user AND seo_project (domain)
      if (params.project_name) {
        const normalizedProjectName = params.project_name.trim();
        const seoProjectId = params.seo_project_id;
        
        // Check for existing project with case-insensitive match within the same SEO project
        let existingQuery = getSupabase()
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
          
          const { data: newProject, error: pErr } = await getSupabase()
            .from('content_projects')
            .insert(insertData)
            .select('id')
            .single();
            
          if (pErr) {
            // Handle race condition (unique violation)
            if (pErr.code === '23505') {
              let retryQuery = getSupabase()
                .from('content_projects')
                .select('id')
                .eq('user_id', params.user_id)
                .ilike('name', normalizedProjectName);
              
              if (seoProjectId) {
                retryQuery = retryQuery.eq('seo_project_id', seoProjectId);
              }
              
              const { data: retryProject } = await retryQuery.maybeSingle();
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
          seo_project_id: params.seo_project_id, // Direct link to SEO project (domain)
          project_id, // Topic Cluster ID
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
          notes: item.notes,
          status: 'ready'
        };
      });

      // 3. Bulk Insert
      const { data, error } = await getSupabase()
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

