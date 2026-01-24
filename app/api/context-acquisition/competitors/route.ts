import { NextRequest, NextResponse } from 'next/server';
import { fetch as undiciFetch, ProxyAgent } from 'undici';
import { createAuthenticatedServerClient } from '@/lib/supabase-server';

// Create proxy agent if configured
function getProxyAgent(): ProxyAgent | undefined {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (proxyUrl) {
    console.log(`[Proxy] Using proxy: ${proxyUrl}`);
    return new ProxyAgent(proxyUrl);
  }
  return undefined;
}

interface Competitor {
  name: string;
  url: string;
  description?: string;
  source?: string;
  logo_url?: string;
  logo_fetch_failed?: boolean; // True if website validation failed
  url_corrected?: boolean; // True if URL was auto-corrected via Perplexity search
}

interface WebsiteAnalysis {
  productName: string;
  productDescription: string;
  industry: string;
  subCategory: string;
  targetAudience: string;
  coreFeatures: string[];
  keywords: string[];
  competitorSearchQueries: string[];
}

// Normalize URL for deduplication
function normalizeUrl(url: string): string {
  try {
    const u = new URL(url.toLowerCase());
    return u.hostname.replace('www.', '');
  } catch {
    return url.toLowerCase().replace(/^https?:\/\//, '').replace('www.', '').split('/')[0];
  }
}

// Merge and deduplicate competitors from multiple sources
function mergeCompetitors(sources: Competitor[][]): Competitor[] {
  const seen = new Map<string, Competitor>();
  
  for (const source of sources) {
    for (const comp of source) {
      const normalizedUrl = normalizeUrl(comp.url);
      if (!seen.has(normalizedUrl)) {
        seen.set(normalizedUrl, comp);
      } else {
        // Merge fields - newer data takes precedence for validation status
        const existing = seen.get(normalizedUrl)!;
        const merged = { ...existing };
        
        // Prefer longer description
        if (comp.description && (!existing.description || comp.description.length > existing.description.length)) {
          merged.description = comp.description;
        }
        
        // Update logo_url and validation status from newer data
        if (comp.logo_url) {
          merged.logo_url = comp.logo_url;
        }
        if (comp.logo_fetch_failed !== undefined) {
          merged.logo_fetch_failed = comp.logo_fetch_failed;
        }
        
        seen.set(normalizedUrl, merged);
      }
    }
  }
  
  return Array.from(seen.values());
}

// =====================================================
// STEP 1: Crawl homepage and analyze industry/positioning
// =====================================================
async function analyzeWebsiteForCompetitors(domain: string): Promise<WebsiteAnalysis> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4.1';

  // Default fallback
  const defaultAnalysis: WebsiteAnalysis = {
    productName: domain.split('.')[0],
    productDescription: '',
    industry: 'technology/SaaS',
    subCategory: 'software',
    targetAudience: 'businesses',
    coreFeatures: [],
    keywords: [domain.split('.')[0]],
    competitorSearchQueries: [
      `${domain.split('.')[0]} alternatives`,
      `${domain.split('.')[0]} competitors`,
      `best ${domain.split('.')[0]} alternatives 2025`,
    ],
  };

  try {
    // Step 1: Fetch homepage
    const fullUrl = `https://${domain}`;
    console.log(`[Website Analysis] Fetching homepage: ${fullUrl}`);
    
    const response = await fetch(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.warn(`[Website Analysis] Failed to fetch ${fullUrl}: HTTP ${response.status}`);
      return defaultAnalysis;
    }

    const html = await response.text();
    console.log(`[Website Analysis] Fetched ${html.length} chars`);

    // Extract key content for analysis
    const extractedContent = extractPageContent(html);
    
    if (!endpoint || !apiKey) {
      console.warn('[Website Analysis] Azure OpenAI not configured');
      return defaultAnalysis;
    }

    // Step 2: Use AI to analyze the website
    const apiUrl = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-04-01-preview`;
    
    const aiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `You are a competitive intelligence expert. Analyze the website content to understand:
1. What product/service they offer
2. Their industry and specific sub-category
3. Target audience
4. Core features and value proposition

Based on this analysis, generate effective search queries to find their competitors.

Return ONLY valid JSON with this exact format:
{
  "productName": "Official product/brand name",
  "productDescription": "One sentence description of what they do",
  "industry": "Main industry category (e.g., SEO Tools, Project Management, CRM, Email Marketing, etc.)",
  "subCategory": "Specific sub-category (e.g., Technical SEO, Agile PM, Sales CRM, etc.)",
  "targetAudience": "Primary target users (e.g., marketers, developers, SMBs, enterprises)",
  "coreFeatures": ["feature1", "feature2", "feature3"],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "competitorSearchQueries": [
    "query 1 for finding competitors",
    "query 2 for finding alternatives",
    "query 3 for industry comparison"
  ]
}

Make the search queries specific and effective for finding real competitors. Include:
- "[productName] alternatives 2025"
- "best [industry] tools"
- "[productName] vs"
- "top [subCategory] software"
- "alternatives to [productName] for [targetAudience]"`
          },
          {
            role: 'user',
            content: `Analyze this website: ${domain}

Title: ${extractedContent.title}

Meta Description: ${extractedContent.metaDescription}

Main Headings:
${extractedContent.headings.join('\n')}

Key Content:
${extractedContent.mainText.substring(0, 3000)}

Based on this information, identify what product/service this is, their industry positioning, and generate search queries to find their competitors.`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!aiResponse.ok) {
      console.error('[Website Analysis] AI API error:', await aiResponse.text());
      return defaultAnalysis;
    }

    const data = await aiResponse.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON response
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    
    const analysis = JSON.parse(jsonStr);
    console.log(`[Website Analysis] Identified: ${analysis.productName} in ${analysis.industry}/${analysis.subCategory}`);
    console.log(`[Website Analysis] Search queries: ${analysis.competitorSearchQueries?.join(', ')}`);
    
    return {
      productName: analysis.productName || defaultAnalysis.productName,
      productDescription: analysis.productDescription || '',
      industry: analysis.industry || defaultAnalysis.industry,
      subCategory: analysis.subCategory || 'software',
      targetAudience: analysis.targetAudience || 'businesses',
      coreFeatures: analysis.coreFeatures || [],
      keywords: analysis.keywords || defaultAnalysis.keywords,
      competitorSearchQueries: analysis.competitorSearchQueries || defaultAnalysis.competitorSearchQueries,
    };
    
  } catch (error) {
    console.error('[Website Analysis] Error:', error);
    return defaultAnalysis;
  }
}

// Extract key content from HTML for analysis
function extractPageContent(html: string): {
  title: string;
  metaDescription: string;
  headings: string[];
  mainText: string;
} {
  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  
  // Meta description
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : '';
  
  // Headings (h1, h2)
  const headings: string[] = [];
  const h1Matches = html.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi);
  const h2Matches = html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi);
  for (const m of h1Matches) headings.push(m[1].trim());
  for (const m of h2Matches) headings.push(m[1].trim());
  
  // Main text - remove scripts, styles, etc.
  let mainText = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return { title, metaDescription, headings: headings.slice(0, 10), mainText };
}

// =====================================================
// STEP 2: Perplexity AI Search - Multiple strategies
// =====================================================
async function discoverFromPerplexity(domain: string, analysis: WebsiteAnalysis): Promise<Competitor[]> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    console.warn('[Perplexity] API key not configured');
    return [];
  }

  console.log(`[Perplexity] Starting multi-strategy search for: ${analysis.productName}`);
  
  // Multiple search strategies - ask in different ways
  const strategies = [
    // Strategy 1: Direct alternatives search
    {
      name: 'alternatives',
      prompt: `List the top 15 direct alternatives and competitors to ${analysis.productName} (${analysis.industry}).

For each competitor, provide:
- Company/Product name
- Website URL
- One sentence description

Focus on actual software products that compete directly with ${analysis.productName}. Include both well-known market leaders and emerging alternatives.`
    },
    // Strategy 2: Industry leaders
    {
      name: 'industry_leaders',
      prompt: `What are the top 15 leading companies and products in the ${analysis.industry} / ${analysis.subCategory} space in 2025?

Exclude ${analysis.productName}. For each company provide:
- Product name
- Website URL  
- What they specialize in

Include market leaders, fast-growing startups, and established players.`
    },
    // Strategy 3: Comparison/vs search
    {
      name: 'comparisons',
      prompt: `I'm evaluating ${analysis.productName} and looking for alternatives. What other ${analysis.subCategory} tools should I compare it against?

List 15 competing products with:
- Name
- Website
- Key differentiator from ${analysis.productName}

Focus on products targeting ${analysis.targetAudience}.`
    },
  ];

  // Run all strategies in parallel
  const searchPromises = strategies.map(strategy => 
    askPerplexity(apiKey, strategy.name, strategy.prompt, analysis)
  );

  try {
    const results = await Promise.allSettled(searchPromises);
    const allCompetitors: Competitor[] = [];
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled') {
        allCompetitors.push(...result.value);
        console.log(`[Perplexity] Strategy "${strategies[i].name}" found ${result.value.length} competitors`);
      } else {
        console.error(`[Perplexity] Strategy "${strategies[i].name}" failed:`, result.reason);
      }
    }
    
    console.log(`[Perplexity] Total from all strategies: ${allCompetitors.length}`);
    return allCompetitors;
  } catch (error) {
    console.error('[Perplexity] Error:', error);
    return [];
  }
}

// Single Perplexity request
async function askPerplexity(apiKey: string, strategyName: string, prompt: string, analysis: WebsiteAnalysis): Promise<Competitor[]> {
  try {
    console.log(`[Perplexity] Running strategy: ${strategyName}`);
    
    // Use undici fetch with proxy support
    const proxyAgent = getProxyAgent();
    const fetchOptions: any = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: `You are a competitive intelligence analyst. Search the web to find real competitors.

CRITICAL RULES:
1. Only include REAL companies with working websites
2. Return accurate company names and URLs
3. Do NOT make up companies or URLs
4. Do NOT include the target company itself (${analysis.productName})
5. Do NOT include review sites (G2, Capterra), news sites, or Wikipedia

Return ONLY a valid JSON array:
[
  {"name": "Company Name", "url": "https://domain.com", "description": "What they do"}
]`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 3000,
        return_citations: true,
        search_recency_filter: 'year',
      }),
    };
    
    // Add proxy dispatcher if available
    if (proxyAgent) {
      fetchOptions.dispatcher = proxyAgent;
    }
    
    // Set timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    fetchOptions.signal = controller.signal;
    
    const response = await undiciFetch('https://api.perplexity.ai/chat/completions', fetchOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Perplexity] API error (${strategyName}):`, response.status, errorText);
      return [];
    }

    const data = await response.json() as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log(`[Perplexity] Full response (${strategyName}):\n${content}\n--- END ---`);
    
    // Try multiple methods to extract JSON
    let competitors: any[] = [];
    
    // Method 1: Try to find a JSON array in the response
    const jsonPatterns = [
      /```json\s*([\s\S]*?)```/,   // Match ```json ... ```
      /```\s*([\s\S]*?)```/,       // Match ``` ... ```
      /\[\s*\{[\s\S]*\}\s*\]/g,    // Match [...] with objects inside (greedy)
    ];
    
    for (const pattern of jsonPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of (Array.isArray(matches) ? matches : [matches[1]])) {
          try {
            let cleanJson = match
              .replace(/```json\s*|\s*```/g, '')  // Remove code fence
              .replace(/\}\s*\[\d+\](\[\d+\])*/g, '}')  // Remove citation markers like [1][3][6] after }
              .replace(/"\s*\[\d+\](\[\d+\])*/g, '"')   // Remove citation markers after strings
              .trim();
            
            const parsed = JSON.parse(cleanJson);
            if (Array.isArray(parsed) && parsed.length > 0) {
              competitors = parsed;
              console.log(`[Perplexity] JSON parse success: ${parsed.length} items`);
              break;
            }
          } catch (e) {
            // Try next pattern
          }
        }
        if (competitors.length > 0) break;
      }
    }
    
    // Method 2: If JSON parsing failed, try to extract from structured text
    if (competitors.length === 0) {
      competitors = extractCompetitorsFromText(content, analysis);
    }
    
    if (competitors.length > 0) {
      const result = competitors
        .filter((c: any) => c.name && c.url && isValidUrl(c.url) && isValidCompetitor(c, analysis))
        .map((c: any) => ({
          name: String(c.name).trim(),
          url: normalizeCompetitorUrl(String(c.url).trim()),
          description: c.description ? String(c.description).trim() : undefined,
          source: 'perplexity',
        }));
      return result;
    }
    
    console.warn(`[Perplexity] Could not extract competitors from response (${strategyName})`);
    return [];
  } catch (error: any) {
    if (error.name === 'TimeoutError' || error.code === 'UND_ERR_CONNECT_TIMEOUT') {
      console.error(`[Perplexity] Timeout (${strategyName}) - check network/proxy settings`);
    } else {
      console.error(`[Perplexity] Error (${strategyName}):`, error.message || error);
    }
  }

  return [];
}

// Extract competitors from plain text (fallback if JSON parsing fails)
function extractCompetitorsFromText(text: string, analysis: WebsiteAnalysis): Competitor[] {
  const competitors: Competitor[] = [];
  const seen = new Set<string>();
  
  // Multiple patterns to match different formats
  const patterns = [
    // Pattern 1: **Name** - https://url.com or **Name** (https://url.com)
    /\*\*([A-Z][A-Za-z0-9\s.]+?)\*\*[^\n]*?(https?:\/\/[^\s\)\]]+)/gi,
    // Pattern 2: 1. Name - https://url.com
    /(?:^|\n)\s*\d+\.\s*\*?\*?([A-Z][A-Za-z0-9\s.]+?)\*?\*?\s*[-–:]?\s*(https?:\/\/[^\s\)\]]+)/gm,
    // Pattern 3: - Name (https://url.com)
    /(?:^|\n)\s*[-•*]\s*\*?\*?([A-Z][A-Za-z0-9\s.]+?)\*?\*?\s*[-–:]?\s*\(?(https?:\/\/[^\s\)\]]+)/gm,
    // Pattern 4: Name: https://url.com
    /([A-Z][A-Za-z0-9\s.]{2,30}?):\s*(https?:\/\/[^\s\)\]]+)/gm,
    // Pattern 5: [Name](https://url.com) markdown links
    /\[([A-Z][A-Za-z0-9\s.]+?)\]\((https?:\/\/[^\s\)]+)\)/gi,
  ];
  
  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      let name = match[1]?.trim();
      let url = match[2]?.trim();
      
      if (!name || !url) continue;
      
      // Clean up the name
      name = name.replace(/^\*+|\*+$/g, '').trim();
      
      // Clean up the URL
      url = url.replace(/[\)\]\.,;:]+$/, '');
      
      const normalizedUrl = normalizeUrl(url);
      
      if (name && url && !seen.has(normalizedUrl) && isValidUrl(url) && isValidCompetitor({ name, url }, analysis)) {
        seen.add(normalizedUrl);
        competitors.push({
          name,
          url: normalizeCompetitorUrl(url),
          source: 'perplexity',
        });
      }
    }
  }
  
  console.log(`[Perplexity] Extracted ${competitors.length} competitors from text`);
  return competitors;
}

// Check if competitor is valid (not a review site, not the target)
function isValidCompetitor(c: any, analysis: WebsiteAnalysis): boolean {
  const url = String(c.url).toLowerCase();
  const name = String(c.name).toLowerCase();
  
  // Exclude review/aggregator sites
  const excludedDomains = [
    'g2.com', 'capterra.com', 'trustradius.com', 'getapp.com', 'softwareadvice.com',
    'producthunt.com', 'alternativeto.net', 'wikipedia.org', 'medium.com',
    'youtube.com', 'linkedin.com', 'twitter.com', 'facebook.com',
    'sourceforge.net', 'github.com', 'reddit.com',
  ];
  
  for (const excluded of excludedDomains) {
    if (url.includes(excluded)) return false;
  }
  
  // Exclude the target product itself
  const targetName = analysis.productName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const compName = name.replace(/[^a-z0-9]/g, '');
  if (compName === targetName || compName.includes(targetName)) return false;
  
  return true;
}

// Normalize competitor URL to just the domain
function normalizeCompetitorUrl(url: string): string {
  try {
    const u = new URL(url);
    return `https://${u.hostname.replace('www.', '')}`;
  } catch {
    return url;
  }
}

// Validate URL format
function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

// =====================================================
// SUSPICIOUS WEBSITE DETECTION PATTERNS
// =====================================================
const SUSPICIOUS_PATTERNS = [
  // Domain parking / for sale
  /domain.*for sale/i,
  /buy this domain/i,
  /this domain is for sale/i,
  /domain is parked/i,
  /parked free/i,
  /hugedomains/i,
  /godaddy.*auction/i,
  /sedo\.com/i,
  /dan\.com/i,
  /afternic/i,
  
  // Under construction / placeholder
  /under construction/i,
  /coming soon/i,
  /website unavailable/i,
  /page not found/i,
  /site currently unavailable/i,
  
  // Generic hosting pages
  /welcome to nginx/i,
  /apache.*test page/i,
  /it works!/i,
  /default web site page/i,
  
  // Completely different business (needs brand check)
  /marketresearch\.com/i, // Example: profound.com is actually MarketResearch
];

// Check if page content indicates a suspicious/wrong website
function detectSuspiciousContent(html: string, productName: string): { suspicious: boolean; reason?: string } {
  const lowerHtml = html.toLowerCase();
  const lowerName = productName.toLowerCase();
  
  // Check for parking/sale patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(html)) {
      return { suspicious: true, reason: `Detected: ${pattern.source}` };
    }
  }
  
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].toLowerCase() : '';
  
  // Brand name should appear in title for legitimate product sites
  // Exception: very short names (3 chars or less) might have false positives
  if (lowerName.length > 3 && title && !title.includes(lowerName)) {
    // Check if it's a completely different brand
    const commonWords = ['home', 'welcome', 'official', 'site', 'page', 'web'];
    const titleWords = title.split(/\s+/).filter(w => w.length > 3 && !commonWords.includes(w));
    
    if (titleWords.length > 0 && !titleWords.some(w => lowerName.includes(w) || w.includes(lowerName))) {
      return { suspicious: true, reason: `Brand mismatch: title="${title}" but looking for "${productName}"` };
    }
  }
  
  return { suspicious: false };
}

// Use Perplexity to find the real product URL
async function findRealProductUrl(productName: string, currentUrl: string): Promise<string | null> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    console.log(`[URL Correction] No Perplexity API key, skipping correction`);
    return null;
  }
  
  try {
    console.log(`[URL Correction] 🔍 Searching for real URL of "${productName}"...`);
    
    const proxyAgent = getProxyAgent();
    const fetchOptions: any = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that finds official product websites.
Return ONLY the official website URL, nothing else. No explanation, just the URL.
If you can't find it, return "NOT_FOUND".`
          },
          {
            role: 'user',
            content: `What is the official website URL for the software/SaaS product called "${productName}"?

Context: The URL ${currentUrl} seems incorrect or is a different product.
Common patterns for SaaS products: try{name}.com, get{name}.com, {name}.ai, {name}.io, {name}app.com, {name}hq.com

Return ONLY the correct URL (e.g., https://example.com), nothing else.`
          }
        ],
        temperature: 0.1,
        max_tokens: 100,
      }),
    };
    
    if (proxyAgent) {
      fetchOptions.dispatcher = proxyAgent;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    fetchOptions.signal = controller.signal;
    
    const response = await undiciFetch('https://api.perplexity.ai/chat/completions', fetchOptions);
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.log(`[URL Correction] Perplexity API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json() as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content?.trim() || '';
    
    // Extract URL from response
    const urlMatch = content.match(/https?:\/\/[^\s"'<>]+/);
    if (urlMatch && urlMatch[0] !== 'NOT_FOUND') {
      const correctedUrl = urlMatch[0].replace(/[.,;:]+$/, ''); // Clean trailing punctuation
      console.log(`[URL Correction] ✅ Found real URL: ${correctedUrl}`);
      return correctedUrl;
    }
    
    console.log(`[URL Correction] ❌ Could not find real URL for "${productName}"`);
    return null;
    
  } catch (error: any) {
    console.log(`[URL Correction] Error: ${error.message}`);
    return null;
  }
}

// =====================================================
// WEBSITE VALIDATION - Check if competitor website is accessible and correct
// =====================================================
async function validateCompetitorWebsite(competitor: Competitor): Promise<Competitor> {
  const domain = normalizeUrl(competitor.url);
  const websiteUrl = competitor.url.startsWith('http') ? competitor.url : `https://${competitor.url}`;
  
  try {
    // Use GET to fetch content for analysis (not just HEAD)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(websiteUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    clearTimeout(timeoutId);
    
    if (!response.ok && response.status !== 403 && response.status !== 401) {
      // Site unreachable or error
      console.log(`[Website Validation] ❌ ${competitor.name} (${domain}) - HTTP ${response.status}`);
      
      // Try to find the real URL
      const realUrl = await findRealProductUrl(competitor.name, websiteUrl);
      if (realUrl && realUrl !== websiteUrl) {
        const correctedDomain = normalizeUrl(realUrl);
        console.log(`[Website Validation] 🔄 Corrected ${competitor.name}: ${domain} → ${correctedDomain}`);
        return {
          ...competitor,
          url: realUrl,
          logo_url: `https://www.google.com/s2/favicons?domain=${correctedDomain}&sz=128`,
          logo_fetch_failed: false,
          url_corrected: true,
        } as Competitor;
      }
      
      return {
        ...competitor,
        logo_url: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
        logo_fetch_failed: true,
      };
    }
    
    // Get page content for analysis
    const html = await response.text();
    const { suspicious, reason } = detectSuspiciousContent(html, competitor.name);
    
    if (suspicious) {
      console.log(`[Website Validation] ⚠️ ${competitor.name} (${domain}) - SUSPICIOUS: ${reason}`);
      
      // Try to find the real URL
      const realUrl = await findRealProductUrl(competitor.name, websiteUrl);
      if (realUrl && normalizeUrl(realUrl) !== domain) {
        const correctedDomain = normalizeUrl(realUrl);
        console.log(`[Website Validation] 🔄 Corrected ${competitor.name}: ${domain} → ${correctedDomain}`);
        return {
          ...competitor,
          url: realUrl,
          logo_url: `https://www.google.com/s2/favicons?domain=${correctedDomain}&sz=128`,
          logo_fetch_failed: false,
          url_corrected: true,
        } as Competitor;
      }
      
      // Couldn't correct, mark as suspicious
      return {
        ...competitor,
        logo_url: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
        logo_fetch_failed: true, // Mark as failed since URL might be wrong
      };
    }
    
    // All good
    console.log(`[Website Validation] ✅ ${competitor.name} (${domain}) - verified`);
    return {
      ...competitor,
      logo_url: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      logo_fetch_failed: false,
    };
    
  } catch (error: any) {
    const errorType = error.name === 'AbortError' ? 'timeout' : error.code || error.message;
    console.log(`[Website Validation] ❌ ${competitor.name} (${domain}) - ${errorType}`);
    
    // Try to find the real URL
    const realUrl = await findRealProductUrl(competitor.name, websiteUrl);
    if (realUrl && realUrl !== websiteUrl) {
      const correctedDomain = normalizeUrl(realUrl);
      console.log(`[Website Validation] 🔄 Corrected ${competitor.name}: ${domain} → ${correctedDomain}`);
      return {
        ...competitor,
        url: realUrl,
        logo_url: `https://www.google.com/s2/favicons?domain=${correctedDomain}&sz=128`,
        logo_fetch_failed: false,
        url_corrected: true,
      } as Competitor;
    }
    
    return {
      ...competitor,
      logo_url: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      logo_fetch_failed: true,
    };
  }
}

// Validate multiple competitors in parallel (with concurrency limit)
async function validateCompetitors(competitors: Competitor[]): Promise<Competitor[]> {
  console.log(`[Website Validation] Validating ${competitors.length} competitor websites...`);
  
  // Process in batches of 3 to avoid overwhelming the network
  const batchSize = 3;
  const results: Competitor[] = [];
  
  for (let i = 0; i < competitors.length; i += batchSize) {
    const batch = competitors.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(validateCompetitorWebsite));
    results.push(...batchResults);
  }
  
  const failedCount = results.filter(c => c.logo_fetch_failed).length;
  console.log(`[Website Validation] Complete: ${failedCount}/${results.length} competitors may have invalid URLs`);
  
  return results;
}

// =====================================================
// MAIN API HANDLER
// =====================================================
export async function POST(request: NextRequest) {
  try {
    const supabase = createAuthenticatedServerClient(request.headers.get('Authorization'));
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url, projectId } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Extract domain
    let domain: string;
    try {
      const urlObj = new URL(url);
      domain = urlObj.hostname.replace('www.', '');
    } catch {
      domain = url.replace(/^https?:\/\//, '').replace('www.', '').split('/')[0];
    }
    
    console.log(`[Competitors Discovery] Starting enhanced discovery for: ${domain}, User: ${user.id}`);

    // =====================================================
    // STEP 1: Analyze website to understand product/industry
    // =====================================================
    console.log(`[Competitors Discovery] Step 1: Analyzing website...`);
    const websiteAnalysis = await analyzeWebsiteForCompetitors(domain);
    
    console.log(`[Competitors Discovery] Analysis complete:`);
    console.log(`  - Product: ${websiteAnalysis.productName}`);
    console.log(`  - Industry: ${websiteAnalysis.industry} / ${websiteAnalysis.subCategory}`);
    console.log(`  - Target: ${websiteAnalysis.targetAudience}`);
    console.log(`  - Keywords: ${websiteAnalysis.keywords.join(', ')}`);
    console.log(`  - Search queries: ${websiteAnalysis.competitorSearchQueries.length}`);

    // =====================================================
    // STEP 2: Discover competitors via Perplexity AI
    // =====================================================
    console.log(`[Competitors Discovery] Step 2: Running Perplexity AI search...`);
    
    const perplexityResults = await discoverFromPerplexity(domain, websiteAnalysis);
    
    console.log(`[Competitors Discovery] Perplexity found: ${perplexityResults.length} competitors`);

    // =====================================================
    // STEP 3: Deduplicate and validate
    // =====================================================
    const competitors = mergeCompetitors([perplexityResults]);
    
    // Remove the target domain itself and any invalid entries
    const domainBase = domain.split('.')[0].toLowerCase();
    const filteredCompetitors = competitors.filter(c => {
      const normalizedCompUrl = normalizeUrl(c.url).toLowerCase();
      // Don't include the target itself
      if (normalizedCompUrl.includes(domainBase)) return false;
      // Must have both name and valid URL
      if (!c.name || !c.url) return false;
      return true;
    });

    console.log(`[Competitors Discovery] Total unique after filtering: ${filteredCompetitors.length}`);

    // Ensure we have at least 10 competitors
    if (filteredCompetitors.length < 10) {
      console.warn(`[Competitors Discovery] Only found ${filteredCompetitors.length} competitors, less than target of 10`);
    }

    // =====================================================
    // STEP 4: Validate competitors (check website accessibility)
    // =====================================================
    console.log(`[Competitors Discovery] Step 4: Validating competitor websites...`);
    const validatedCompetitors = await validateCompetitors(filteredCompetitors);
    
    const invalidCount = validatedCompetitors.filter(c => c.logo_fetch_failed).length;
    if (invalidCount > 0) {
      console.warn(`[Competitors Discovery] ⚠️ ${invalidCount} competitors may have invalid URLs (logo fetch failed)`);
    }

    // =====================================================
    // STEP 5: Save to database
    // =====================================================
    if (validatedCompetitors.length > 0 && projectId) {
      // Get existing competitors
      const { data: existing } = await supabase
        .from('site_contexts')
        .select('content')
        .eq('user_id', user.id)
        .eq('project_id', projectId)
        .eq('type', 'competitors')
        .maybeSingle();

      let existingCompetitors: Competitor[] = [];
      if (existing?.content) {
        try {
          existingCompetitors = JSON.parse(existing.content);
        } catch {}
      }

      // Find existing competitors that need validation:
      // 1. Never validated (logo_fetch_failed === undefined)
      // 2. Previously failed and missing logo_url (need retry)
      const needsValidation = existingCompetitors.filter(c => 
        c.logo_fetch_failed === undefined || 
        (c.logo_fetch_failed === true && !c.logo_url) ||
        !c.logo_url // No logo URL at all
      );
      
      if (needsValidation.length > 0) {
        console.log(`[Competitors Discovery] Validating ${needsValidation.length} existing competitors (missing logo or failed before)...`);
        const validatedExisting = await validateCompetitors(needsValidation);
        
        // Update existing competitors with validation results
        existingCompetitors = existingCompetitors.map(c => {
          const validated = validatedExisting.find(v => normalizeUrl(v.url) === normalizeUrl(c.url));
          if (validated) {
            return { 
              ...c, 
              logo_url: validated.logo_url, 
              logo_fetch_failed: validated.logo_fetch_failed 
            };
          }
          return c;
        });
      }

      // Merge with existing (avoid duplicates) - keep validation status from new data
      const allCompetitors = mergeCompetitors([existingCompetitors, validatedCompetitors]);

      // Upsert to database
      await supabase
        .from('site_contexts')
        .upsert({
          user_id: user.id,
          project_id: projectId,
          type: 'competitors',
          content: JSON.stringify(allCompetitors),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,project_id,type',
        });
      
      // Count total failures (new + existing)
      const totalFailedCount = allCompetitors.filter(c => c.logo_fetch_failed).length;
      
      console.log(`[Competitors Discovery] Saved ${allCompetitors.length} total competitors to database (${totalFailedCount} may have invalid URLs)`);
      
      return NextResponse.json({
        success: true,
        competitors: allCompetitors, // Return ALL competitors (existing + new) with validation status
        analysis: {
          productName: websiteAnalysis.productName,
          industry: websiteAnalysis.industry,
          subCategory: websiteAnalysis.subCategory,
          targetAudience: websiteAnalysis.targetAudience,
          keywords: websiteAnalysis.keywords,
        },
        sources: {
          perplexity: perplexityResults.length,
          new_competitors: validatedCompetitors.length,
          total_competitors: allCompetitors.length,
          validation_failed: totalFailedCount,
        },
        message: `Found ${validatedCompetitors.length} new competitors, total ${allCompetitors.length} competitors${totalFailedCount > 0 ? ` (${totalFailedCount} may have invalid URLs)` : ''}`,
      });
    }

    return NextResponse.json({
      success: true,
      competitors: validatedCompetitors,
      analysis: {
        productName: websiteAnalysis.productName,
        industry: websiteAnalysis.industry,
        subCategory: websiteAnalysis.subCategory,
        targetAudience: websiteAnalysis.targetAudience,
        keywords: websiteAnalysis.keywords,
      },
      sources: {
        perplexity: perplexityResults.length,
        total_unique: validatedCompetitors.length,
        validation_failed: invalidCount,
      },
      message: `Found ${validatedCompetitors.length} unique competitors for ${websiteAnalysis.productName} (${websiteAnalysis.industry}) via Perplexity AI${invalidCount > 0 ? ` (${invalidCount} may have invalid URLs)` : ''}`,
    });

  } catch (error: any) {
    console.error('[Competitors Discovery] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to discover competitors',
      },
      { status: 500 }
    );
  }
}
