import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const get_site_contexts = tool({
  description: `Retrieve saved site-wide HTML components, brand assets, content sections, and site settings for the current user. 
  
This tool fetches the user's saved site context elements that can be used to create consistent, branded web pages.

Available context types:

**Site Elements:**
- "logo": The uploaded logo image URL
- "header": HTML code for the site header/navigation
- "footer": HTML code for the site footer
- "meta": Complete <head> tag content including meta tags, stylesheets, scripts, etc.
- "sitemap": Website sitemap data

**Brand Assets** (stored with logo type):
- "primary_color": Brand primary color (hex code)
- "secondary_color": Brand secondary color (hex code)
- "heading_font": Font family for headings
- "body_font": Font family for body text
- "tone": Brand tone and voice guidelines
- "languages": Supported languages

**Content Sections:**
- "key-website-pages": Key pages of the website
- "landing-pages": Landing pages information
- "blog-resources": Blog and resource content
- "hero-section": Hero section content (headline, subheadline, CTA, media, metrics)
- "problem-statement": Problem/pain points being addressed
- "who-we-serve": Target audience and customer personas
- "use-cases": Common use cases and scenarios
- "industries": Industries served
- "products-services": Products and services offerings
- "social-proof-trust": Testimonials, case studies, badges, awards, guarantees, integrations
- "leadership-team": Team members and leadership
- "about-us": Company story, mission & vision, core values
- "faq": Frequently asked questions
- "contact-information": Contact details (primary contact, location, hours, support channels)

Use this tool BEFORE generating HTML pages to ensure the generated pages include the user's branding, layout, and relevant content.`,
  parameters: z.object({
    user_id: z.string().describe('The user ID to fetch contexts for'),
    projectId: z.string().optional().describe('The SEO project ID to scope this request to'),
    types: z.array(z.enum([
      'logo', 'header', 'footer', 'meta', 'sitemap',
      'key-website-pages', 'landing-pages', 'blog-resources',
      'hero-section', 'problem-statement', 'who-we-serve',
      'use-cases', 'industries', 'products-services',
      'social-proof-trust', 'leadership-team', 'about-us',
      'faq', 'contact-information'
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
      const contexts: Record<string, { content?: string; fileUrl?: string; updatedAt: string }> = {};
      
      if (data) {
        data.forEach((item: any) => {
          contexts[item.type] = {
            content: item.content || undefined,
            fileUrl: item.file_url || undefined,
            updatedAt: item.updated_at
          };
        });
      }

      return {
        success: true,
        contexts,
        message: `Found ${data?.length || 0} site context(s) for user`,
        // Provide convenient access to specific contexts
        logo: contexts.logo?.fileUrl || null,
        header: contexts.header?.content || null,
        footer: contexts.footer?.content || null,
        head: contexts.meta?.content || null,
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

