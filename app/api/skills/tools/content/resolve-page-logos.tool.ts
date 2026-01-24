import { tool } from 'ai';
import { z } from 'zod';
import { createServerSupabaseAdmin } from '@/lib/supabase-server';

/**
 * Resolve all logos needed for page generation.
 * This tool ensures every logo placeholder has an actual image URL.
 * 
 * Logo Sources (in priority order):
 * 1. Site Context (logo type) - brand logos
 * 2. Competitors Context - competitor logos
 * 3. Google Favicon API - fallback for any URL
 * 4. Generated SVG - ultimate fallback with initial letter
 */
export const resolve_page_logos = tool({
  description: `Resolve and validate all logos needed for page generation.

This tool:
1. Fetches brand logo from site_contexts (logo type)
2. Fetches competitor logos from site_contexts (competitors type)
3. Falls back to Google Favicon API if logo_url is missing
4. Generates SVG fallback as last resort

ALWAYS call this tool before generating page sections to ensure all logos are available.

Returns a structured object with all resolved logo URLs.`,
  parameters: z.object({
    user_id: z.string().describe('User ID to fetch contexts'),
    project_id: z.string().describe('Project ID'),
    brand_name: z.string().describe('Brand name for fallback generation'),
    brand_domain: z.string().optional().describe('Brand domain for favicon fallback'),
    competitor_name: z.string().describe('Competitor name'),
    competitor_url: z.string().optional().describe('Competitor URL for favicon fallback'),
  }),
  execute: async ({ user_id, project_id, brand_name, brand_domain, competitor_name, competitor_url }) => {
    const supabase = createServerSupabaseAdmin();
    
    // Initialize results
    const result = {
      success: true,
      brand: {
        name: brand_name,
        logo_url: null as string | null,
        logo_source: 'none' as 'context' | 'favicon' | 'svg' | 'none',
        primary_color: '#0ea5e9',
        secondary_color: '#8b5cf6',
      },
      competitor: {
        name: competitor_name,
        logo_url: null as string | null,
        logo_source: 'none' as 'context' | 'favicon' | 'svg' | 'none',
      },
      warnings: [] as string[],
    };
    
    try {
      // 1. Fetch site contexts for logo and competitors
      const { data: contexts, error } = await supabase
        .from('site_contexts')
        .select('*')
        .eq('user_id', user_id)
        .eq('project_id', project_id)
        .in('type', ['logo', 'competitors']);
      
      if (error) {
        result.warnings.push(`Failed to fetch contexts: ${error.message}`);
      }
      
      // 2. Process logo context
      const logoContext = contexts?.find(c => c.type === 'logo');
      if (logoContext) {
        // Brand logo from context
        if (logoContext.logo_light_url) {
          result.brand.logo_url = logoContext.logo_light_url;
          result.brand.logo_source = 'context';
        } else if (logoContext.logo_dark_url) {
          result.brand.logo_url = logoContext.logo_dark_url;
          result.brand.logo_source = 'context';
        } else if (logoContext.file_url) {
          result.brand.logo_url = logoContext.file_url;
          result.brand.logo_source = 'context';
        }
        
        // Brand colors
        if (logoContext.primary_color) {
          result.brand.primary_color = logoContext.primary_color;
        }
        if (logoContext.secondary_color) {
          result.brand.secondary_color = logoContext.secondary_color;
        }
      }
      
      // 3. Process competitors context
      const competitorsContext = contexts?.find(c => c.type === 'competitors');
      if (competitorsContext?.content) {
        try {
          const competitors = JSON.parse(competitorsContext.content);
          // Find matching competitor
          const matchedCompetitor = competitors.find((c: any) => 
            c.name?.toLowerCase() === competitor_name.toLowerCase() ||
            c.url?.includes(competitor_name.toLowerCase().replace(/\s+/g, ''))
          );
          
          if (matchedCompetitor?.logo_url) {
            result.competitor.logo_url = matchedCompetitor.logo_url;
            result.competitor.logo_source = 'context';
          }
        } catch (e) {
          result.warnings.push('Failed to parse competitors context');
        }
      }
      
      // 4. Fallback to Google Favicon API for brand
      if (!result.brand.logo_url && brand_domain) {
        const domain = brand_domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        result.brand.logo_url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        result.brand.logo_source = 'favicon';
        result.warnings.push(`Using favicon fallback for ${brand_name}`);
      }
      
      // 5. Fallback to Google Favicon API for competitor
      if (!result.competitor.logo_url && competitor_url) {
        const domain = competitor_url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        result.competitor.logo_url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        result.competitor.logo_source = 'favicon';
        result.warnings.push(`Using favicon fallback for ${competitor_name}`);
      }
      
      // 6. Generate SVG fallbacks as last resort
      if (!result.brand.logo_url) {
        result.brand.logo_url = generateSvgLogo(brand_name, result.brand.primary_color);
        result.brand.logo_source = 'svg';
        result.warnings.push(`Generated SVG fallback for ${brand_name}`);
      }
      
      if (!result.competitor.logo_url) {
        result.competitor.logo_url = generateSvgLogo(competitor_name, '#6b7280');
        result.competitor.logo_source = 'svg';
        result.warnings.push(`Generated SVG fallback for ${competitor_name}`);
      }
      
      return {
        ...result,
        message: `Resolved logos: brand (${result.brand.logo_source}), competitor (${result.competitor.logo_source})`,
        // Convenience HTML snippets
        brand_logo_html: generateLogoHtml(result.brand.name, result.brand.logo_url!, result.brand.primary_color),
        competitor_logo_html: generateLogoHtml(result.competitor.name, result.competitor.logo_url!, '#6b7280'),
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        brand: result.brand,
        competitor: result.competitor,
        warnings: [...result.warnings, error.message],
      };
    }
  },
});

/**
 * Generate a base64 SVG logo with initial letter
 */
function generateSvgLogo(name: string, color: string): string {
  const initial = name.charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <rect width="128" height="128" rx="24" fill="${color}"/>
    <text x="64" y="80" font-family="Inter, system-ui, sans-serif" font-size="64" font-weight="700" fill="white" text-anchor="middle">${initial}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * Generate logo HTML with proper fallback chain
 */
function generateLogoHtml(name: string, logoUrl: string, fallbackColor: string): string {
  const initial = name.charAt(0).toUpperCase();
  const fallbackSvg = generateSvgLogo(name, fallbackColor);
  
  return `<img 
    src="${logoUrl}" 
    alt="${name}" 
    class="w-full h-full object-contain rounded-xl"
    onerror="this.onerror=null; this.src='${fallbackSvg}'"
  >`;
}
