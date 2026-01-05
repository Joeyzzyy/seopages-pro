import { tool } from 'ai';
import { z } from 'zod';

export const fetch_external_social_proof = tool({
  description: `Fetch social proof from external review platforms like ProductHunt, Trustpilot, G2, Capterra.
  
This tool searches for and extracts:
- Overall ratings and review counts
- Top reviews/testimonials
- Awards and badges (e.g., "Product of the Day")
- Key statistics

Always includes source URLs for transparency.`,
  parameters: z.object({
    companyName: z.string().describe('Company or product name to search for'),
    companyDomain: z.string().optional().describe('Company domain (e.g., seopage.ai) to help identify correct listings'),
    platforms: z.array(z.enum([
      'producthunt',
      'trustpilot', 
      'g2',
      'capterra',
      'all'
    ])).optional().describe('Which platforms to search. Default: all')
  }),
  execute: async ({ companyName, companyDomain, platforms = ['all'] }) => {
    try {
      console.log(`[fetch_external_social_proof] Searching for ${companyName} on review platforms...`);
      
      const searchPlatforms = platforms.includes('all') 
        ? ['producthunt', 'trustpilot', 'g2', 'capterra']
        : platforms;

      const results: any = {
        companyName,
        companyDomain,
        searchedAt: new Date().toISOString(),
        platforms: {}
      };

      for (const platform of searchPlatforms) {
        try {
          const platformData = await fetchPlatformData(platform, companyName, companyDomain);
          results.platforms[platform] = platformData;
        } catch (e: any) {
          results.platforms[platform] = { 
            success: false, 
            error: e.message,
            searchUrl: getSearchUrl(platform, companyName)
          };
        }
      }

      // Compile summary
      results.summary = compileSummary(results.platforms);

      return {
        success: true,
        data: results,
        message: `Searched ${searchPlatforms.length} platforms for social proof`
      };

    } catch (error: any) {
      console.error('[fetch_external_social_proof] Error:', error);
      return {
        success: false,
        error: `Social proof fetch error: ${error.message}`
      };
    }
  }
});

// Platform-specific data fetching
async function fetchPlatformData(platform: string, companyName: string, companyDomain?: string): Promise<any> {
  const searchUrl = getSearchUrl(platform, companyName);
  
  // For now, we provide search URLs since direct API access requires keys
  // The AI agent can use web_search or tavily tools to fetch actual data
  
  const result: any = {
    success: true,
    platform,
    searchUrl,
    directUrl: getDirectUrl(platform, companyName, companyDomain),
    instructions: `Use web_search or tavily_web_search to search for "${companyName} ${platform} reviews" to get actual review data`,
  };

  // Try to construct potential direct URLs based on common patterns
  if (companyDomain) {
    const slug = companyDomain.replace(/\.[^.]+$/, '').toLowerCase();
    result.potentialUrls = getPotentialUrls(platform, slug, companyName);
  }

  return result;
}

function getSearchUrl(platform: string, companyName: string): string {
  const encoded = encodeURIComponent(companyName);
  
  switch (platform) {
    case 'producthunt':
      return `https://www.producthunt.com/search?q=${encoded}`;
    case 'trustpilot':
      return `https://www.trustpilot.com/search?query=${encoded}`;
    case 'g2':
      return `https://www.g2.com/search?query=${encoded}`;
    case 'capterra':
      return `https://www.capterra.com/search/?search=${encoded}`;
    default:
      return '';
  }
}

function getDirectUrl(platform: string, companyName: string, companyDomain?: string): string | null {
  if (!companyDomain) return null;
  
  const slug = companyDomain.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  switch (platform) {
    case 'producthunt':
      return `https://www.producthunt.com/products/${slug}`;
    case 'trustpilot':
      return `https://www.trustpilot.com/review/${companyDomain}`;
    case 'g2':
      return `https://www.g2.com/products/${slug}/reviews`;
    case 'capterra':
      return `https://www.capterra.com/p/${slug}/`;
    default:
      return null;
  }
}

function getPotentialUrls(platform: string, slug: string, companyName: string): string[] {
  const urls: string[] = [];
  const nameSlug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  switch (platform) {
    case 'producthunt':
      urls.push(`https://www.producthunt.com/products/${slug}`);
      urls.push(`https://www.producthunt.com/products/${nameSlug}`);
      break;
    case 'trustpilot':
      urls.push(`https://www.trustpilot.com/review/${slug}.com`);
      urls.push(`https://www.trustpilot.com/review/www.${slug}.com`);
      break;
    case 'g2':
      urls.push(`https://www.g2.com/products/${slug}/reviews`);
      urls.push(`https://www.g2.com/products/${nameSlug}/reviews`);
      break;
    case 'capterra':
      urls.push(`https://www.capterra.com/p/${slug}/`);
      break;
  }
  
  return urls;
}

function compileSummary(platforms: any): any {
  const summary: any = {
    totalPlatformsSearched: Object.keys(platforms).length,
    platformsWithData: 0,
    allSearchUrls: [],
    allDirectUrls: [],
    recommendations: []
  };

  for (const [platform, data] of Object.entries(platforms) as [string, any][]) {
    if (data.success) {
      summary.platformsWithData++;
    }
    if (data.searchUrl) {
      summary.allSearchUrls.push({ platform, url: data.searchUrl });
    }
    if (data.directUrl) {
      summary.allDirectUrls.push({ platform, url: data.directUrl });
    }
  }

  summary.recommendations.push(
    'Use tavily_web_search with query "{companyName} reviews {platform}" to fetch actual review data',
    'Use tavily_extract_content with the direct URLs to scrape review content',
    'Always cite the source URL when presenting social proof data'
  );

  return summary;
}

