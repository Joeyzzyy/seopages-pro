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

/**
 * Supabase Site Context Save Tool (Simplified)
 * 
 * Saves site-wide context with simplified schema:
 * - logo: brand assets (domain, colors, fonts, images)
 * - header: navigation config + generated HTML
 * - footer: footer config + generated HTML
 * - competitors: competitor list
 */
export const save_site_context = tool({
  description: `Save or update site-wide context in the database (site_contexts table).
  
Available types:
- **logo**: Brand assets (domain_name, colors, fonts, logos, favicons, og_image, languages)
- **header**: Navigation structure (JSON config + HTML)
- **footer**: Footer structure (JSON config + HTML)
- **competitors**: Competitor list (JSON array: [{"name": "Name", "url": "https://..."}])

IMPORTANT: This saves to site_contexts table, NOT to content_items.`,

  parameters: z.object({
    userId: z.string().describe('The ID of the user'),
    projectId: z.string().describe('The ID of the SEO project'),
    type: z.enum(['logo', 'header', 'footer', 'competitors'])
      .describe('Type of context: logo (brand assets), header, footer, or competitors'),
    
    // Content field (for header/footer JSON config, or competitors list)
    content: z.string().optional().describe('JSON content (navigation config for header/footer, or competitor list for competitors)'),
    
    // HTML field (for header/footer generated HTML)
    html: z.string().nullish().describe('Generated HTML (for header/footer)'),
    
    // Brand asset fields (for type=logo)
    domainName: z.string().optional().describe('Website domain name (only for type=logo)'),
    ogImage: z.string().optional().describe('Open Graph image URL (only for type=logo)'),
    logoLightUrl: z.string().optional().describe('Light theme logo URL (only for type=logo)'),
    logoDarkUrl: z.string().optional().describe('Dark theme logo URL (only for type=logo)'),
    faviconLightUrl: z.string().optional().describe('Light theme favicon URL (only for type=logo)'),
    faviconDarkUrl: z.string().optional().describe('Dark theme favicon URL (only for type=logo)'),
    primaryColor: z.string().optional().describe('Primary brand color hex (only for type=logo)'),
    secondaryColor: z.string().optional().describe('Secondary brand color hex (only for type=logo)'),
    headingFont: z.string().optional().describe('Heading font family (only for type=logo)'),
    bodyFont: z.string().optional().describe('Body font family (only for type=logo)'),
    languages: z.string().optional().describe('Supported languages (only for type=logo)'),
  }),

  execute: async ({ 
    userId, projectId, type, content, html,
    domainName, ogImage, logoLightUrl, logoDarkUrl, 
    faviconLightUrl, faviconDarkUrl,
    primaryColor, secondaryColor, headingFont, bodyFont, languages
  }) => {
    try {
      console.log(`[save_site_context] Saving ${type} for user ${userId}, project ${projectId}`);
      
      // Check for existing record
      const { data: existing, error: fetchError } = await getSupabase()
        .from('site_contexts')
        .select('id')
        .eq('user_id', userId)
        .eq('seo_project_id', projectId)
        .eq('type', type)
        .maybeSingle();

      if (fetchError) throw fetchError;

      // Prepare data based on type
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Common fields
      if (content !== undefined) updateData.content = content || null;
      if (html !== undefined) updateData.html = html || null;

      // Logo-specific fields
      if (type === 'logo') {
        if (domainName !== undefined) updateData.domain_name = domainName || null;
        if (ogImage !== undefined) updateData.og_image = ogImage || null;
        if (logoLightUrl !== undefined) updateData.logo_light_url = logoLightUrl || null;
        if (logoDarkUrl !== undefined) updateData.logo_dark_url = logoDarkUrl || null;
        if (faviconLightUrl !== undefined) updateData.favicon_light_url = faviconLightUrl || null;
        if (faviconDarkUrl !== undefined) updateData.favicon_dark_url = faviconDarkUrl || null;
        // Note: primary_color, secondary_color, heading_font, body_font columns removed from DB
        if (languages !== undefined) updateData.languages = languages || null;
      }

      let result;

      if (existing) {
        // Update existing
        const { data, error } = await getSupabase()
          .from('site_contexts')
          .update(updateData)
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
        console.log(`[save_site_context] ✅ Updated ${type} context`);
      } else {
        // Create new
        const insertData = {
          user_id: userId,
          seo_project_id: projectId,
          type,
          ...updateData,
        };
        
        const { data, error } = await getSupabase()
          .from('site_contexts')
          .insert(insertData)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
        console.log(`[save_site_context] ✅ Created ${type} context`);
      }

      return {
        success: true,
        message: `Successfully saved ${type} context.`,
        contextId: result.id
      };
    } catch (error: any) {
      console.error('[save_site_context] Error:', error);
      return { 
        success: false, 
        error: error.message,
      };
    }
  },
});
