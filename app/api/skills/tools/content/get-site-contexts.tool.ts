import { tool } from 'ai';
import { z } from 'zod';
import { createServerSupabaseAdmin } from '@/lib/supabase-server';

// Initialize Supabase client with proxy support for server-side operations
const supabase = createServerSupabaseAdmin();

export const get_site_contexts = tool({
  description: `Retrieve saved site contexts for page generation. 

VALID TYPES (use these exact values in the 'types' array):
- "logo" - Logo URL + brand assets (primary_color, secondary_color, heading_font, body_font, tone)
- "header" - Site header HTML
- "footer" - Site footer HTML  
- "meta" - Head tags and meta content
- "competitors" - Competitor list JSON
- "about-us" - Company information
- "products-services" - Products/services info

Other valid types: "sitemap", "key-website-pages", "landing-pages", "blog-resources", "hero-section", "problem-statement", "who-we-serve", "use-cases", "industries", "social-proof-trust", "leadership-team", "faq", "contact-information"

NOTE: Brand colors and fonts are stored WITHIN the "logo" type record, NOT as separate types.

Example: types: ["logo", "header", "footer", "competitors"]`,
  parameters: z.object({
    user_id: z.string().describe('The user ID to fetch contexts for'),
    projectId: z.string().optional().describe('The SEO project ID to scope this request to'),
    types: z.array(z.enum([
      'logo', 'header', 'footer', 'meta', 'sitemap',
      'key-website-pages', 'landing-pages', 'blog-resources',
      'hero-section', 'problem-statement', 'who-we-serve',
      'use-cases', 'industries', 'products-services',
      'social-proof-trust', 'leadership-team', 'about-us',
      'faq', 'contact-information', 'competitors'
    ])).optional().describe('Specific context types to fetch. If not provided, fetches all types.')
  }),
  execute: async ({ user_id, projectId, types }) => {
    try {
      let query = supabase
        .from('site_contexts')
        .select('*')
        .eq('user_id', user_id);

      if (projectId) {
        query = query.eq('project_id', projectId);
      } else {
        query = query.is('project_id', null);
      }

      // Filter by specific types if provided
      if (types && types.length > 0) {
        query = query.in('type', types);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[get_site_contexts] Error fetching contexts:', error);
        return {
          success: false,
          error: `Failed to fetch site contexts: ${error.message}`,
          contexts: []
        };
      }

      // Transform data into a more usable format
      const contexts: Record<string, { content?: string; html?: string; fileUrl?: string; updatedAt: string }> = {};
      
      if (data) {
        data.forEach((item: any) => {
          contexts[item.type] = {
            content: item.content || undefined,
            html: item.html || undefined,  // Include HTML field for header/footer
            fileUrl: item.file_url || undefined,
            updatedAt: item.updated_at
          };
        });
      }

      // Extract logo details from logo context
      const logoContext = data?.find((item: any) => item.type === 'logo');
      
      // Build site_url from domain_name
      const domainName = logoContext?.domain_name || null;
      const siteUrl = domainName ? `https://${domainName.replace(/^https?:\/\//, '')}` : null;
      
      const logoDetails = {
        logo_url: logoContext?.logo_url || logoContext?.logo_light_url || logoContext?.logo_dark_url || logoContext?.file_url || null,
        logo_light_url: logoContext?.logo_light_url || null,
        logo_dark_url: logoContext?.logo_dark_url || null,
        favicon_url: logoContext?.favicon_url || null,
        file_url: logoContext?.file_url || null,
        brand_name: logoContext?.brand_name || null,
        domain_name: domainName,
        site_url: siteUrl,  // Full URL for CTA buttons (e.g., "https://example.com")
        primary_color: logoContext?.primary_color || '#0ea5e9',
        secondary_color: logoContext?.secondary_color || '#8b5cf6',
        heading_font: logoContext?.heading_font || null,
        body_font: logoContext?.body_font || null,
      };
      
      // Parse competitors if available
      const competitorsContext = data?.find((item: any) => item.type === 'competitors');
      let competitors: Array<{ name: string; url: string; logo_url?: string; description?: string }> = [];
      if (competitorsContext?.content) {
        try {
          competitors = JSON.parse(competitorsContext.content);
        } catch (e) {
          console.error('[get_site_contexts] Failed to parse competitors:', e);
        }
      }
      
      // Extract header/footer HTML and config
      const headerContext = data?.find((item: any) => item.type === 'header');
      const footerContext = data?.find((item: any) => item.type === 'footer');
      
      // Parse header/footer config from content field
      let headerConfig = null;
      let footerConfig = null;
      try {
        if (headerContext?.content) headerConfig = JSON.parse(headerContext.content);
      } catch (e) { /* ignore parse errors */ }
      try {
        if (footerContext?.content) footerConfig = JSON.parse(footerContext.content);
      } catch (e) { /* ignore parse errors */ }
      
      return {
        success: true,
        contexts,
        message: `Found ${data?.length || 0} site context(s) for user`,
        // Provide convenient access to specific contexts
        logo: logoDetails.logo_url || null,
        logo_details: logoDetails,
        // Site URL for CTA buttons - links to product website for conversion
        site_url: siteUrl,
        brand_name: logoDetails.brand_name,
        // IMPORTANT: Return HTML (not content/config) for header and footer
        // The HTML is the rendered, ready-to-use code for page integration
        header: headerContext?.html || null,
        header_config: headerConfig,  // JSON config for reference
        footer: footerContext?.html || null,
        footer_config: footerConfig,  // JSON config for reference
        head: contexts.meta?.content || null,
        competitors,
      };
    } catch (error: any) {
      console.error('[get_site_contexts] Unexpected error:', error);
      return {
        success: false,
        error: `Unexpected error: ${error.message}`,
        contexts: {}
      };
    }
  },
});

