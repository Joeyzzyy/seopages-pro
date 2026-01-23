import { tool } from 'ai';
import { z } from 'zod';
import { fetch as undiciFetch, ProxyAgent } from 'undici';

// Create proxy agent if configured
function getProxyAgent(): ProxyAgent | undefined {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (proxyUrl) {
    return new ProxyAgent(proxyUrl);
  }
  return undefined;
}

/**
 * Perplexity Deep Search Tool
 * 
 * Deep web search using Perplexity API, ideal for:
 * - Brand news and event investigation (360 degree coverage)
 * - Competitor activity tracking
 * - Traffic fluctuation root cause analysis
 * - Social media sentiment (X/Twitter, Reddit, Quora)
 * 
 * Results include citation links for credibility
 */

// System prompts for different search scenarios
const SEARCH_PROMPTS: Record<string, string> = {
  brand_news: `You are an investigative business journalist. Your task is to find ALL significant events about this company/brand in the specified time period.

Search thoroughly across:
- Official company announcements and press releases
- Tech news sites (TechCrunch, VentureBeat, The Verge, Wired)
- Industry publications and blogs
- Product Hunt launches
- Company blog posts

For EACH event found, provide:
1. Exact date (or approximate if unknown)
2. What happened (specific details)
3. Why it matters (business impact)
4. Source URL

Be exhaustive - list EVERY relevant event, not just the top one.`,

  social_sentiment: `You are a social media analyst. Search for discussions, opinions, and user feedback about this company/product.

Search across:
- X/Twitter: Look for viral tweets, complaints, praise, trending discussions
- Reddit: Check r/SEO, r/marketing, r/SaaS, r/startups, and product-specific subreddits
- Quora: Find Q&A about the product
- Product Hunt: Check reviews and comments
- G2, Capterra, TrustRadius: Look for review trends

For EACH significant discussion found:
1. Platform and link
2. Summary of sentiment (positive/negative/mixed)
3. Key points users are making
4. Engagement level (viral? niche?)

Look for patterns: What are users consistently praising or complaining about?`,

  algorithm_update: `You are an SEO expert analyst. Research the Google algorithm update and its impact on websites.

Search across:
- Google Search Central Blog (official announcements)
- Search Engine Journal, Search Engine Land, Moz Blog
- Twitter/X from Google Search Liaison (@searchliaison)
- SEO community discussions on Reddit (r/SEO, r/bigseo)
- Barry Schwartz / Search Engine Roundtable

Provide:
1. Official update name and date
2. What the update targeted
3. Which types of sites were affected (positively/negatively)
4. Timeline of rollout
5. Recovery strategies discussed
6. Specific examples of affected sites if mentioned`,

  product_launch: `You are a product analyst. Find detailed information about product launches, updates, and feature releases.

Search across:
- Product Hunt launches and rankings
- Company blog and changelog
- Tech news coverage
- YouTube product demos and reviews
- User discussions on Reddit and Twitter

Provide:
1. Exact launch/update date
2. What was launched (features, pricing, positioning)
3. How it was received (user reactions, reviews)
4. Competitive context (how it compares to alternatives)
5. Marketing activities around the launch`,

  funding_partnership: `You are a business analyst researching corporate developments.

Search across:
- Crunchbase, PitchBook data
- TechCrunch, Forbes, Business Insider funding news
- LinkedIn announcements
- Press releases
- Industry newsletters

Provide:
1. Funding round details (amount, investors, valuation)
2. Partnership announcements
3. Acquisitions or exits
4. Key executive hires or departures
5. Strategic pivots or expansions`,

  deep_investigation: `You are a world-class investigative researcher. Your mission is to uncover the COMPLETE story behind this query.

Search EXHAUSTIVELY across ALL available sources:
- News sites and press releases
- Social media (X/Twitter, Reddit, Quora, LinkedIn)
- Forums and community discussions
- Review sites and user feedback
- Company blogs and changelogs
- YouTube videos and podcasts
- Industry reports and analyses

For your response:
1. Start with a timeline of key events
2. Provide context and background
3. Include multiple perspectives (company, users, competitors, analysts)
4. Note any controversies or debates
5. Cite EVERY source with URLs

Be thorough - this research will be used in a professional report. Leave no stone unturned.`
};

export const perplexity_search = tool({
  description: `Deep AI-powered web search using Perplexity. Searches across news, social media (X/Twitter, Reddit, Quora), forums, and the entire web. Returns comprehensive answers with source citations. 

Use different search_type for different purposes:
- brand_news: Company announcements, press releases, product launches
- social_sentiment: User discussions on X, Reddit, Quora, reviews
- algorithm_update: Google updates and SEO impact analysis
- product_launch: Feature releases and product updates
- funding_partnership: Funding, acquisitions, partnerships
- deep_investigation: Exhaustive 360° research across ALL sources`,

  parameters: z.object({
    query: z.string().describe('The search query - include brand name, time period (e.g., "October 2024"), and specific topic'),
    search_type: z.enum([
      'brand_news',
      'social_sentiment', 
      'algorithm_update',
      'product_launch',
      'funding_partnership',
      'deep_investigation'
    ]).optional().default('deep_investigation')
      .describe('Type of search to perform - determines which sources and perspectives to prioritize'),
  }),
  execute: async ({ query, search_type }) => {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    
    if (!apiKey) {
      return { 
        success: false, 
        error: 'PERPLEXITY_API_KEY not configured in environment variables' 
      };
    }

    const systemPrompt = SEARCH_PROMPTS[search_type || 'deep_investigation'];

    try {
      console.log(`[perplexity_search] Deep search: "${query}" type: ${search_type}`);
      
      // Use undici fetch with proxy support
      const proxyAgent = getProxyAgent();
      if (proxyAgent) {
        console.log(`[perplexity_search] Using proxy`);
      }
      
      const fetchOptions: any = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar-pro', // Use pro model for deeper research
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: query
            }
          ],
          temperature: 0.1, // Lower temperature for more factual responses
          max_tokens: 4000, // More tokens for comprehensive answers
          return_citations: true,
          search_recency_filter: 'year', // Focus on recent content
        }),
      };
      
      // Add proxy dispatcher if available
      if (proxyAgent) {
        fetchOptions.dispatcher = proxyAgent;
      }
      
      // Set timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      fetchOptions.signal = controller.signal;
      
      const response = await undiciFetch('https://api.perplexity.ai/chat/completions', fetchOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[perplexity_search] API error: ${response.status} - ${errorText}`);
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json() as { choices?: { message?: { content?: string } }[]; citations?: string[]; model?: string; usage?: unknown };
      
      const answer = data.choices?.[0]?.message?.content || '';
      const citations = data.citations || [];
      
      console.log(`[perplexity_search] Got comprehensive answer with ${citations.length} citations`);

      return {
        success: true,
        query,
        search_type,
        answer,
        citations: citations.map((url: string, idx: number) => ({
          index: idx + 1,
          url
        })),
        citations_count: citations.length,
        model: data.model,
        usage: data.usage,
        tip: 'Include all citation URLs in your report to enhance credibility'
      };
    } catch (error: any) {
      console.error('[perplexity_search] Error:', error);
      return { 
        success: false, 
        error: error.message,
        query 
      };
    }
  },
});

(perplexity_search as any).metadata = {
  name: 'Perplexity Deep Search',
  provider: 'Perplexity AI'
};

