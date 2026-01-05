import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// Use a private service role client for backend tools to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Supabase Site Context Save Tool
 * Saves or updates site-wide context (like sitemap, logo, header, footer, and all content sections) in the database.
 * 
 * IMPORTANT: Brand assets (colors, fonts, etc.) should be saved with type='logo', not as separate types.
 */
export const save_site_context = tool({
  description: `Save or update site-wide context in the database.
  
  For brand assets (colors, fonts, tone), use type='logo' and include the optional fields.
  For content sections, use their specific types (hero-section, about-us, etc.) with content as JSON string.`,
  parameters: z.object({
    userId: z.string().describe('The ID of the user (pass your Current User ID here)'),
    projectId: z.string().optional().describe('The ID of the SEO project to scope this context to'),
    type: z.enum([
      'logo', 'header', 'footer', 'meta', 'sitemap',
      'key-website-pages', 'landing-pages', 'blog-resources',
      'hero-section', 'problem-statement', 'who-we-serve',
      'use-cases', 'industries', 'products-services',
      'social-proof-trust', 'leadership-team', 'about-us',
      'faq', 'contact-information'
    ]).describe('Type of context being saved. Use "logo" for brand assets (colors, fonts).'),
    content: z.string().optional().describe('Text content (e.g., sitemap URLs as JSON string, code snippets, or structured content as JSON)'),
    fileUrl: z.string().optional().describe('URL to a file (e.g., logo image URL)'),
    // Brand asset fields (only for type='logo')
    brandName: z.string().optional().describe('Brand name (only for type=logo)'),
    subtitle: z.string().optional().describe('Brand subtitle (only for type=logo)'),
    metaDescription: z.string().optional().describe('Meta description (only for type=logo)'),
    ogImage: z.string().optional().describe('Open Graph image URL (only for type=logo)'),
    favicon: z.string().optional().describe('Favicon URL (only for type=logo)'),
    logoLight: z.string().optional().describe('Light theme logo URL (only for type=logo)'),
    logoDark: z.string().optional().describe('Dark theme logo URL (only for type=logo)'),
    iconLight: z.string().optional().describe('Light theme icon URL (only for type=logo)'),
    iconDark: z.string().optional().describe('Dark theme icon URL (only for type=logo)'),
    primaryColor: z.string().optional().describe('Primary brand color hex (only for type=logo)'),
    secondaryColor: z.string().optional().describe('Secondary brand color hex (only for type=logo)'),
    headingFont: z.string().optional().describe('Heading font family (only for type=logo)'),
    bodyFont: z.string().optional().describe('Body font family (only for type=logo)'),
    tone: z.string().optional().describe('Brand tone and voice (only for type=logo)'),
    languages: z.string().optional().describe('Supported languages (only for type=logo)'),
  }),
  execute: async ({ 
    userId, projectId, type, content, fileUrl,
    brandName, subtitle, metaDescription, ogImage, favicon,
    logoLight, logoDark, iconLight, iconDark,
    primaryColor, secondaryColor, headingFont, bodyFont, tone, languages
  }) => {
    try {
      console.log(`[save_site_context] Saving ${type} for user ${userId} ${projectId ? `for project ${projectId}` : ''}`);
      
      // First try to get existing record
      let query = supabase
        .from('site_contexts')
        .select('id')
        .eq('user_id', userId)
        .eq('type', type);
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      } else {
        query = query.is('project_id', null);
      }

      const { data: existing, error: fetchError } = await query.maybeSingle();

      if (fetchError) throw fetchError;

      let result;
      
      // Prepare update data
      const updateData: any = {
        content: content || null,
        file_url: fileUrl || null,
        project_id: projectId || null,
        updated_at: new Date().toISOString(),
      };
      
      // Add brand asset fields if provided (typically for type='logo')
      if (brandName !== undefined) updateData.brand_name = brandName;
      if (subtitle !== undefined) updateData.subtitle = subtitle;
      if (metaDescription !== undefined) updateData.meta_description = metaDescription;
      if (ogImage !== undefined) updateData.og_image = ogImage;
      if (favicon !== undefined) updateData.favicon = favicon;
      if (logoLight !== undefined) updateData.logo_light = logoLight;
      if (logoDark !== undefined) updateData.logo_dark = logoDark;
      if (iconLight !== undefined) updateData.icon_light = iconLight;
      if (iconDark !== undefined) updateData.icon_dark = iconDark;
      if (primaryColor !== undefined) updateData.primary_color = primaryColor;
      if (secondaryColor !== undefined) updateData.secondary_color = secondaryColor;
      if (headingFont !== undefined) updateData.heading_font = headingFont;
      if (bodyFont !== undefined) updateData.body_font = bodyFont;
      if (tone !== undefined) updateData.tone = tone;
      if (languages !== undefined) updateData.languages = languages;

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('site_contexts')
          .update(updateData)
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Create new - prepare insert data
        const insertData: any = {
          user_id: userId,
          type,
          content: content || null,
          file_url: fileUrl || null,
          project_id: projectId || null,
        };
        
        // Add brand asset fields if provided
        if (brandName !== undefined) insertData.brand_name = brandName;
        if (subtitle !== undefined) insertData.subtitle = subtitle;
        if (metaDescription !== undefined) insertData.meta_description = metaDescription;
        if (ogImage !== undefined) insertData.og_image = ogImage;
        if (favicon !== undefined) insertData.favicon = favicon;
        if (logoLight !== undefined) insertData.logo_light = logoLight;
        if (logoDark !== undefined) insertData.logo_dark = logoDark;
        if (iconLight !== undefined) insertData.icon_light = iconLight;
        if (iconDark !== undefined) insertData.icon_dark = iconDark;
        if (primaryColor !== undefined) insertData.primary_color = primaryColor;
        if (secondaryColor !== undefined) insertData.secondary_color = secondaryColor;
        if (headingFont !== undefined) insertData.heading_font = headingFont;
        if (bodyFont !== undefined) insertData.body_font = bodyFont;
        if (tone !== undefined) insertData.tone = tone;
        if (languages !== undefined) insertData.languages = languages;
        
        const { data, error } = await supabase
          .from('site_contexts')
          .insert(insertData)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
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
        details: 'If you see a constraint error, please ensure the database update script has been run.'
      };
    }
  },
});

