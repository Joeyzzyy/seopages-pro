import { tool } from 'ai';
import { z } from 'zod';
import { createAzure } from '@ai-sdk/azure';
import { generateObject } from 'ai';
import { saveProductResearch } from '@/lib/section-storage';

const azure = createAzure({
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME!,
});

/**
 * Deep research tool for individual products.
 * 
 * Crawls a product's website (multiple pages) to extract comprehensive
 * information for listicle/comparison pages.
 */
export const research_product_deep = tool({
  description: `Deep research a product's website to extract comprehensive information.

This tool performs MULTI-PAGE crawling to gather:
- Features (with yes/partial/no/not_mentioned status)
- Pricing plans and tiers
- Pros and cons (inferred from features and limitations)
- Best use cases
- Target audience
- Product description

The tool will:
1. Crawl the homepage for overview
2. Crawl pricing page (if exists)
3. Crawl features page (if exists)
4. Use AI to extract structured data

Use this BEFORE generating product cards and comparison tables to ensure accurate data.
If information cannot be found after deep crawling, returns "not_mentioned" instead of assuming "no".`,

  parameters: z.object({
    content_item_id: z.string().describe('Content item ID to save research data (required for auto-loading in table generation)'),
    product_name: z.string().describe('The name of the product to research'),
    product_url: z.string().describe('The main URL of the product website'),
    feature_names: z.array(z.string()).describe('List of specific features to check for (from comparison table columns)'),
  }),

  execute: async ({ content_item_id, product_name, product_url, feature_names }) => {
    const startTime = Date.now();
    console.log(`[research_product_deep] 🔍 Researching ${product_name} at ${product_url}`);

    try {
      // Normalize URL
      const baseUrl = product_url.startsWith('http') ? product_url : `https://${product_url}`;
      const origin = new URL(baseUrl).origin;

      // Pages to crawl (expanded for deeper research)
      const pagesToCrawl = [
        { path: '/', name: 'homepage' },
        { path: '/pricing', name: 'pricing' },
        { path: '/features', name: 'features' },
        { path: '/product', name: 'product' },
        { path: '/about', name: 'about' },
        { path: '/integrations', name: 'integrations' },
        { path: '/enterprise', name: 'enterprise' },
        { path: '/security', name: 'security' },
        { path: '/why-us', name: 'why-us' },
        { path: '/compare', name: 'compare' },
      ];

      // Alternative pricing paths (try more variations)
      const pricingPaths = ['/pricing', '/plans', '/price', '/packages', '/buy', '/subscribe', '/pro'];
      // Alternative features paths (try more variations)
      const featurePaths = ['/features', '/product', '/solutions', '/capabilities', '/platform', '/tools', '/suite'];

      // Crawl multiple pages using Tavily
      const crawledPages: Array<{ name: string; content: string; url: string }> = [];

      for (const page of pagesToCrawl) {
        try {
          const pageUrl = origin + page.path;
          const result = await tavilyCrawl(pageUrl);
          if (result.success && result.content) {
            crawledPages.push({
              name: page.name,
              url: pageUrl,
              content: result.content.slice(0, 15000), // Limit content per page
            });
            console.log(`[research_product_deep] ✅ Crawled ${page.name}: ${result.content.length} chars`);
          }
        } catch (e) {
          console.log(`[research_product_deep] ⚠️ Failed to crawl ${page.name}`);
        }
      }

      // If we didn't get enough pages, try alternative paths
      if (!crawledPages.some(p => p.name === 'pricing')) {
        for (const path of pricingPaths) {
          try {
            const result = await tavilyCrawl(origin + path);
            if (result.success && result.content) {
              crawledPages.push({ name: 'pricing', url: origin + path, content: result.content.slice(0, 15000) });
              break;
            }
          } catch (e) { /* continue */ }
        }
      }

      if (!crawledPages.some(p => p.name === 'features')) {
        for (const path of featurePaths) {
          try {
            const result = await tavilyCrawl(origin + path);
            if (result.success && result.content) {
              crawledPages.push({ name: 'features', url: origin + path, content: result.content.slice(0, 15000) });
              break;
            }
          } catch (e) { /* continue */ }
        }
      }

      if (crawledPages.length === 0) {
        return {
          success: false,
          product_name,
          error: `Could not crawl any pages from ${origin}`,
          message: `❌ Failed to access ${product_name}'s website`,
        };
      }

      // Combine all crawled content for AI analysis
      const combinedContent = crawledPages
        .map(p => `=== ${p.name.toUpperCase()} PAGE (${p.url}) ===\n${p.content}`)
        .join('\n\n');

      // Use AI to extract structured data
      console.log(`[research_product_deep] 🤖 Analyzing ${crawledPages.length} pages with AI...`);
      
      // Build the features list for the prompt
      const featuresListStr = feature_names.length > 0 
        ? feature_names.map(f => `- "${f}"`).join('\n')
        : '(No specific features to check)';

      const { object: extractedData } = await generateObject({
        model: azure(process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1'),
        schema: z.object({
          description: z.string().describe('2-3 sentence product description'),
          tagline: z.string().optional().describe('Short tagline if found'),
          target_audience: z.string().describe('Who this product is best for'),
          
          // Feature availability map - MUST be an object with feature names as keys
          features: z.record(z.enum(['yes', 'partial', 'no', 'not_mentioned'])).default({}).describe('Feature availability map - keys are feature names, values are yes/partial/no/not_mentioned'),
          key_features: z.array(z.string()).describe('4-6 main features/capabilities'),
          
          pricing: z.object({
            starting_price: z.string().optional().describe('Starting price (e.g., "$29/mo")'),
            free_tier: z.boolean().optional().describe('Whether free tier exists'),
            pricing_model: z.string().optional().describe('Pricing model (per user, flat rate, etc.)'),
            plans: z.array(z.object({
              name: z.string(),
              price: z.string(),
              features: z.array(z.string()).optional(),
            })).optional().describe('Available pricing plans'),
          }),
          
          pros: z.array(z.string()).describe('3-5 advantages based on features and positioning'),
          cons: z.array(z.string()).describe('2-3 limitations or disadvantages'),
          
          best_for: z.string().describe('Ideal use case in one sentence'),
          
          website_url: z.string().nullable().optional().describe('Official website URL'),
          logo_url: z.string().nullable().optional().describe('Logo URL if found, or null if not found'),
        }),
        prompt: `Analyze these crawled pages from ${product_name}'s website and extract comprehensive product information.

CRAWLED CONTENT:
${combinedContent}

==== CRITICAL: FEATURES MAP ====
You MUST return a "features" object (NOT an array) where:
- Keys are the EXACT feature names from the list below
- Values are one of: "yes", "partial", "no", "not_mentioned"

SPECIFIC FEATURES TO CHECK (use these EXACT names as keys):
${featuresListStr}

Example of correct "features" format:
{
  "Content Optimization": "yes",
  "AI Content Analysis": "partial",
  "SERP Tracking": "not_mentioned"
}

EXTRACTION RULES:
1. For EACH feature in the list above, add an entry to the "features" object:
   - "yes" = Explicitly mentioned as supported/included
   - "partial" = Limited support or available only in certain plans
   - "no" = Explicitly stated as NOT supported or unavailable
   - "not_mentioned" = Not found in the crawled content (DON'T assume "no")

2. For pricing: Extract exact prices if found, otherwise note "Contact for pricing" or "Not mentioned"

3. For pros/cons: Infer from the features and positioning, be fair and balanced

4. For key_features: List 4-6 main capabilities as an array of strings

5. Be accurate - only include information you can verify from the crawled content

Product name: ${product_name}
Website: ${origin}`,
      });

      const duration = Date.now() - startTime;
      console.log(`[research_product_deep] ✅ Completed in ${duration}ms`);

      // ========================================
      // CAPTURE HOMEPAGE SCREENSHOT
      // ========================================
      let screenshotUrl: string | null = null;
      try {
        const SCREENSHOT_API_KEY = process.env.SCREENSHOTMACHINE_API_KEY || '7cec4c';
        const screenshotParams = new URLSearchParams({
          key: SCREENSHOT_API_KEY,
          url: origin,
          dimension: '1366x768',
          device: 'desktop',
          format: 'png',
          cacheLimit: '86400', // Cache for 24 hours
          delay: '2000',
          zoom: '100',
        });
        screenshotUrl = `https://api.screenshotmachine.com?${screenshotParams.toString()}`;
        console.log(`[research_product_deep] 📸 Generated screenshot URL for ${product_name}`);
      } catch (e) {
        console.log(`[research_product_deep] ⚠️ Failed to generate screenshot URL`);
      }

      // ========================================
      // ENSURE ALL FEATURES HAVE VALUES
      // If AI didn't return a feature, set it to "not_mentioned"
      // ========================================
      const completeFeatures: Record<string, 'yes' | 'partial' | 'no' | 'not_mentioned'> = {};
      for (const featureName of feature_names) {
        const aiValue = extractedData.features?.[featureName];
        if (aiValue && ['yes', 'partial', 'no', 'not_mentioned'].includes(aiValue)) {
          completeFeatures[featureName] = aiValue;
        } else {
          completeFeatures[featureName] = 'not_mentioned';
        }
      }
      
      // Log feature completeness
      const featureStats = {
        total: feature_names.length,
        yes: Object.values(completeFeatures).filter(v => v === 'yes').length,
        partial: Object.values(completeFeatures).filter(v => v === 'partial').length,
        no: Object.values(completeFeatures).filter(v => v === 'no').length,
        not_mentioned: Object.values(completeFeatures).filter(v => v === 'not_mentioned').length,
      };
      console.log(`[research_product_deep] 📊 Features extracted for ${product_name}:`, featureStats);

      // ========================================
      // SAVE RESEARCH DATA TO DATABASE
      // This allows generate_listicle_comparison_table to auto-load features
      // ========================================
      if (content_item_id) {
        const saveResult = await saveProductResearch(content_item_id, product_name, {
          product_name,
          product_url: origin,
          description: extractedData.description,
          tagline: extractedData.tagline,
          target_audience: extractedData.target_audience,
          features: completeFeatures, // Use the complete features map
          key_features: extractedData.key_features,
          pricing: extractedData.pricing,
          pros: extractedData.pros,
          cons: extractedData.cons,
          best_for: extractedData.best_for,
          logo_url: extractedData.logo_url,
          screenshot_url: screenshotUrl, // Homepage screenshot
        });
        
        if (saveResult.success) {
          console.log(`[research_product_deep] 💾 Saved research data for ${product_name} to database`);
        } else {
          console.warn(`[research_product_deep] ⚠️ Failed to save research data: ${saveResult.error}`);
        }
      }

      return {
        success: true,
        product_name,
        product_url: origin,
        pages_crawled: crawledPages.length,
        pages: crawledPages.map(p => p.name),
        data: {
          ...extractedData,
          features: completeFeatures, // Return complete features map instead of AI's partial one
          screenshot_url: screenshotUrl, // Homepage screenshot URL
        },
        data_saved: !!content_item_id,
        duration: `${duration}ms`,
        message: `✅ Deep research completed for ${product_name}: ${crawledPages.length} pages analyzed${content_item_id ? ' (data saved to DB)' : ''}`,
      };

    } catch (error: any) {
      console.error(`[research_product_deep] ❌ Error:`, error);
      return {
        success: false,
        product_name,
        error: error.message,
        message: `❌ Failed to research ${product_name}: ${error.message}`,
      };
    }
  },
});

/**
 * Crawl a single URL using Tavily's extract API
 */
async function tavilyCrawl(url: string): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'TAVILY_API_KEY not configured' };
    }

    // Use Tavily's extract endpoint for more content
    const response = await fetch('https://api.tavily.com/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        urls: [url],
      }),
    });

    if (!response.ok) {
      // Fallback to search with domain filter
      const searchResponse = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          query: `site:${new URL(url).hostname}`,
          search_depth: 'advanced',
          include_raw_content: true,
          max_results: 3,
        }),
      });

      if (!searchResponse.ok) {
        return { success: false, error: 'Tavily API error' };
      }

      const searchData = await searchResponse.json();
      const content = searchData.results
        ?.map((r: any) => r.raw_content || r.content)
        .join('\n\n');
      
      return { success: !!content, content };
    }

    const data = await response.json();
    const content = data.results?.[0]?.raw_content || data.results?.[0]?.content;
    
    return { success: !!content, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

(research_product_deep as any).metadata = {
  name: 'Deep Product Research',
  provider: 'Tavily + Azure OpenAI',
};
