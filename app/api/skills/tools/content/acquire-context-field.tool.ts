import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { generateText } from 'ai';
import { createAzure } from '@ai-sdk/azure';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const azure = createAzure({
  apiKey: process.env.AZURE_OPENAI_API_KEY || '',
  resourceName: process.env.AZURE_OPENAI_ENDPOINT?.replace('https://', '').replace('.openai.azure.com', '') || '',
});

// ========== Field Configuration ==========
// Each field has its own extraction strategy

interface FieldConfig {
  targetPages: string[];  // Priority pages to check (relative paths)
  extractionMethod: 'regex' | 'ai' | 'structured';
  aiPrompt?: string;
  dbType: string;  // Database type to save as
}

const FIELD_CONFIGS: Record<string, FieldConfig> = {
  // ===== Fast Fields (Regex-based) =====
  'brand-assets': {
    targetPages: ['/'],
    extractionMethod: 'regex',
    dbType: 'logo',
  },
  'hero-section': {
    targetPages: ['/'],
    extractionMethod: 'structured',
    dbType: 'hero-section',
  },
  'contact-info': {
    targetPages: ['/', '/contact', '/contact-us', '/about', '/about-us'],
    extractionMethod: 'regex',
    dbType: 'contact-information',
  },
  'sitemap': {
    targetPages: ['/sitemap.xml', '/sitemap_index.xml'],
    extractionMethod: 'regex',
    dbType: 'sitemap',
  },
  'page-classification': {
    targetPages: ['/'],
    extractionMethod: 'regex',
    dbType: 'multiple', // Saves to key-website-pages, landing-pages, blog-resources
  },
  'header': {
    targetPages: ['/'],
    extractionMethod: 'structured',
    dbType: 'header',
  },
  'footer': {
    targetPages: ['/'],
    extractionMethod: 'structured',
    dbType: 'footer',
  },

  // ===== AI-Analyzed Fields =====
  'tone': {
    targetPages: ['/', '/about', '/about-us'],
    extractionMethod: 'ai',
    aiPrompt: `Analyze the tone and voice of this website's content.

Identify:
1. Communication style (professional, casual, friendly, authoritative, etc.)
2. Language tone (formal, informal, technical, conversational)
3. Brand personality traits
4. Target audience implied by the tone

Return a concise description (1-2 sentences) that can be used to maintain consistent tone in content creation.
Example outputs:
- "Professional and authoritative with technical expertise, targeting B2B decision-makers"
- "Friendly and conversational, using simple language for everyday consumers"
- "Bold and innovative, speaking to tech-savvy early adopters"`,
    dbType: 'logo', // Saved as tone field in logo type
  },
  'problem-statement': {
    targetPages: ['/', '/about', '/about-us', '/why-us', '/solutions'],
    extractionMethod: 'ai',
    aiPrompt: `Extract the PROBLEM STATEMENT from this website.
What pain points or challenges does this product/service address?
Write 2-3 paragraphs (200-400 words) describing:
- The core problem(s) being solved
- Who experiences these problems
- The impact/cost of not solving them
If not explicitly stated, infer from the value proposition and messaging.
Return ONLY the text content, no JSON.`,
    dbType: 'problem-statement',
  },
  'who-we-serve': {
    targetPages: ['/', '/customers', '/for-teams', '/industries', '/solutions', '/about'],
    extractionMethod: 'ai',
    aiPrompt: `Identify WHO THIS PRODUCT/SERVICE SERVES.
Write 1-2 paragraphs (100-200 words) covering:
- Primary target audience/customer segments
- Types of businesses or individuals
- Company sizes (startup, SMB, enterprise)
- Any specific roles or departments
Return ONLY the text content, no JSON.`,
    dbType: 'who-we-serve',
  },
  'use-cases': {
    targetPages: ['/', '/use-cases', '/solutions', '/features', '/how-it-works'],
    extractionMethod: 'ai',
    aiPrompt: `List the main USE CASES for this product/service.
What can customers accomplish? What problems does it solve?
Write 2-3 paragraphs or a detailed bullet list (200-400 words).
Include specific scenarios and outcomes if mentioned.
Return ONLY the text content, no JSON.`,
    dbType: 'use-cases',
  },
  'industries': {
    targetPages: ['/', '/industries', '/solutions', '/customers', '/case-studies'],
    extractionMethod: 'ai',
    aiPrompt: `Identify the INDUSTRIES this product/service targets.
List all mentioned industries/verticals with brief descriptions of how the product applies to each.
Format as a structured list like:
- Healthcare: [how product helps healthcare]
- Finance: [how product helps finance]
- etc.
If no specific industries mentioned, analyze the content to infer likely target industries.
Return ONLY the text content, no JSON.`,
    dbType: 'industries',
  },
  'products-services': {
    targetPages: ['/', '/products', '/services', '/features', '/pricing', '/solutions'],
    extractionMethod: 'ai',
    aiPrompt: `Describe the PRODUCTS and SERVICES offered.
Write 2-4 paragraphs (300-500 words) covering:
- Main product/service offerings
- Key features and capabilities
- Pricing tiers if mentioned
- Differentiators or unique selling points
Return ONLY the text content, no JSON.`,
    dbType: 'products-services',
  },
  'about-us': {
    targetPages: ['/about', '/about-us', '/company', '/our-story', '/'],
    extractionMethod: 'ai',
    aiPrompt: `Extract ABOUT US information from this website.
Look for company background, mission, vision, values, and story.
Return as JSON:
{
  "companyStory": "The company's background and history (2-3 paragraphs)",
  "missionVision": "Mission statement and vision (1-2 paragraphs)",
  "coreValues": "Core values and principles (bullet points or paragraph)"
}`,
    dbType: 'about-us',
  },
  'leadership-team': {
    targetPages: ['/about', '/about-us', '/team', '/our-team', '/leadership', '/company'],
    extractionMethod: 'ai',
    aiPrompt: `Extract LEADERSHIP TEAM information.
Look for executives, founders, key team members.
Return as JSON array:
[
  {
    "name": "Full Name",
    "title": "Job Title",
    "bio": "Brief biography or description",
    "image": "Image URL if found",
    "linkedin": "LinkedIn URL if found"
  }
]
If no team information found, return empty array: []`,
    dbType: 'leadership-team',
  },
  'faq': {
    targetPages: ['/faq', '/faqs', '/help', '/support', '/frequently-asked-questions', '/'],
    extractionMethod: 'ai',
    aiPrompt: `Extract FAQ (Frequently Asked Questions) from this content.
Look for Q&A sections, FAQ pages, or common questions answered.
Return as JSON array:
[
  {"question": "The question text", "answer": "The answer text"}
]
If no FAQs found, return empty array: []`,
    dbType: 'faq',
  },
  'social-proof': {
    targetPages: ['/', '/customers', '/testimonials', '/case-studies', '/about'],
    extractionMethod: 'ai',
    aiPrompt: `Extract SOCIAL PROOF elements from this website.
Look for testimonials, customer quotes, statistics, awards, badges, partner logos.
Return as JSON:
{
  "testimonials": [{"quote": "...", "author": "...", "company": "..."}],
  "metrics": "Key statistics like '10,000+ customers' or '99.9% uptime'",
  "awards": "Any awards or recognitions",
  "badges": "Trust badges, certifications, security seals",
  "partners": "Partner company names or logos mentioned"
}`,
    dbType: 'social-proof-trust',
  },
};

// All available context fields
const CONTEXT_FIELDS = Object.keys(FIELD_CONFIGS) as (keyof typeof FIELD_CONFIGS)[];

type ContextFieldType = typeof CONTEXT_FIELDS[number];

// Cache for scraped data
const scrapedDataCache: Map<string, { html: string; text: string; timestamp: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache for discovered navigation links
const navigationCache: Map<string, { links: string[]; timestamp: number }> = new Map();

export const acquire_context_field = tool({
  description: `Acquire a SINGLE context field from a website and save it to database.

Each field has its own intelligent extraction strategy:
- Targets specific pages for each field type
- Falls back to homepage if specific pages unavailable
- Discovers secondary pages from navigation automatically

Fast fields (instant, regex-based):
- brand-assets: logo, colors, fonts, metadata
- hero-section: headline, subheadline, CTA
- contact-info: email, phone, social links
- sitemap: fetch and parse sitemap.xml
- page-classification: categorize URLs
- header: navigation structure
- footer: footer links and info

AI-analyzed fields (~3-5 seconds each):
- tone: brand voice and communication style
- problem-statement: pain points addressed
- who-we-serve: target audience
- use-cases: application scenarios
- industries: target verticals
- products-services: offerings description
- about-us: company story, mission, values
- leadership-team: team members
- faq: frequently asked questions
- social-proof: testimonials, metrics, badges

Returns extracted data and saves to database automatically.`,

  parameters: z.object({
    url: z.string().describe('Website base URL to analyze'),
    field: z.enum(CONTEXT_FIELDS as [string, ...string[]]).describe('Which field to extract'),
    userId: z.string().describe('User ID for database save'),
    projectId: z.string().describe('Project ID for database save'),
  }),

  execute: async ({ url, field, userId, projectId }) => {
    const startTime = Date.now();
    console.log(`[acquire_context_field] 🎯 Acquiring field: ${field} from ${url}`);

    try {
      // Verify project exists
      const { data: project, error: projectError } = await supabase
        .from('seo_projects')
        .select('id')
        .eq('id', projectId)
        .single();
      
      if (projectError || !project) {
        return {
          success: false,
          field,
          error: `Project not found: ${projectId}`,
          message: `❌ Project does not exist. Please create a new one.`
        };
      }

      // Normalize URL
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      const origin = new URL(fullUrl).origin;
      const config = FIELD_CONFIGS[field];

      if (!config) {
        return { success: false, field, error: `Unknown field: ${field}` };
      }

      let extractedData: any = null;

      // Try target pages in order
      let pageData: { html: string; text: string } | null = null;
      let usedPage = '/';

      for (const targetPath of config.targetPages) {
        const targetUrl = targetPath.startsWith('/sitemap') 
          ? origin + targetPath 
          : origin + targetPath;
        
        const result = await getPageData(targetUrl);
        if (result.success && result.html) {
          pageData = { html: result.html, text: result.text || '' };
          usedPage = targetPath;
          console.log(`[acquire_context_field] ✅ Found content at ${targetPath}`);
          break;
        }
      }

      // Fallback to homepage if no target page worked
      if (!pageData) {
        const result = await getPageData(origin);
        if (result.success) {
          pageData = { html: result.html!, text: result.text! };
          usedPage = '/';
        } else {
          return { success: false, field, error: `Failed to fetch any page: ${result.error}` };
        }
      }

      // Extract based on field type
      switch (field) {
        case 'brand-assets':
          extractedData = extractBrandAssets(pageData.html, origin);
          
          // Also analyze tone with AI
          const tonePrompt = `Analyze the tone and voice of this website content.
Return ONLY a short phrase (2-5 words) describing the brand tone, such as:
- "Professional and authoritative"
- "Friendly and conversational"  
- "Technical and expert"
- "Bold and innovative"
- "Warm and supportive"
- "Playful and casual"

Website content (first 3000 chars):
${pageData.text.substring(0, 3000)}

Return ONLY the tone phrase, nothing else.`;
          
          try {
            const { text: toneResult } = await generateText({
              model: azure(process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1'),
              prompt: tonePrompt,
              maxTokens: 50,
            });
            extractedData.tone = toneResult?.trim() || 'Professional';
          } catch (e) {
            console.log('[acquire_context_field] Tone analysis failed, using default');
            extractedData.tone = 'Professional';
          }
          
          await saveToDatabase(userId, projectId, config.dbType, JSON.stringify(extractedData), extractedData);
          break;

        case 'hero-section':
          // Try regex first
          extractedData = extractHeroSection(pageData.html);
          
          // If regex extraction failed (all empty), use AI
          const hasContent = extractedData.headline || extractedData.subheadline || extractedData.callToAction;
          if (!hasContent) {
            console.log('[acquire_context_field] Hero regex failed, using AI analysis');
            const heroPrompt = `Analyze this website's homepage content and extract the HERO SECTION information.

The hero section is usually the first prominent section visitors see, typically containing:
- A main headline (H1 or large text)
- A subheadline or value proposition  
- A call-to-action button
- Sometimes metrics or stats

Return as JSON:
{
  "headline": "The main headline text",
  "subheadline": "The supporting text or value proposition",
  "callToAction": "The primary CTA button text",
  "metrics": "Any stats like '10,000+ users' or '99.9% uptime'"
}

Website content (first 4000 chars):
${pageData.text.substring(0, 4000)}

Return ONLY valid JSON, no explanation.`;

            try {
              const { text: heroResult } = await generateText({
                model: azure(process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1'),
                prompt: heroPrompt,
                maxTokens: 500,
              });
              
              // Try to parse JSON
              const trimmed = heroResult?.trim() || '{}';
              try {
                const parsed = JSON.parse(trimmed.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
                extractedData = {
                  headline: parsed.headline || '',
                  subheadline: parsed.subheadline || '',
                  callToAction: parsed.callToAction || '',
                  metrics: parsed.metrics || '',
                  fullText: '',
                };
              } catch (e) {
                console.log('[acquire_context_field] Failed to parse hero AI response');
              }
            } catch (e) {
              console.log('[acquire_context_field] Hero AI analysis failed');
            }
          }
          
          await saveToDatabase(userId, projectId, config.dbType, JSON.stringify(extractedData));
          break;

        case 'contact-info':
          // Try to find contact page first
          let contactHtml = pageData.html;
          const navLinks = extractNavigationLinks(pageData.html, origin);
          const contactPage = navLinks.find(l => /contact|get-in-touch|reach-us/i.test(l));
          if (contactPage) {
            const contactResult = await getPageData(contactPage);
            if (contactResult.success) {
              contactHtml = contactResult.html!;
              console.log(`[acquire_context_field] Found contact page: ${contactPage}`);
            }
          }
          extractedData = extractContactInfo(contactHtml);
          await saveToDatabase(userId, projectId, config.dbType, JSON.stringify(extractedData));
          break;

        case 'sitemap':
          extractedData = await fetchSitemap(origin);
          await saveToDatabase(userId, projectId, config.dbType, JSON.stringify(extractedData));
          break;

        case 'page-classification':
          const sitemap = await fetchSitemap(origin);
          extractedData = classifyPages(sitemap.urls || [], origin);
          await saveToDatabase(userId, projectId, 'key-website-pages', JSON.stringify(extractedData.keyPages));
          await saveToDatabase(userId, projectId, 'landing-pages', JSON.stringify(extractedData.landingPages));
          await saveToDatabase(userId, projectId, 'blog-resources', JSON.stringify(extractedData.blogPages));
          break;

        case 'header':
          extractedData = extractHeader(pageData.html, origin);
          await saveToDatabase(userId, projectId, config.dbType, JSON.stringify(extractedData));
          break;

        case 'footer':
          extractedData = extractFooter(pageData.html, origin);
          await saveToDatabase(userId, projectId, config.dbType, JSON.stringify(extractedData));
          break;

        case 'tone':
          // Analyze tone and save to logo type
          extractedData = await analyzeWithAI(config.aiPrompt!, pageData.text, origin);
          // Update logo type with tone
          await supabase
            .from('site_contexts')
            .update({ tone: extractedData, updated_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('project_id', projectId)
            .eq('type', 'logo');
          break;

        // AI-analyzed fields with smart page discovery
        case 'about-us':
        case 'leadership-team':
          // Try to find about/team page
          const aboutLinks = extractNavigationLinks(pageData.html, origin);
          const aboutPage = aboutLinks.find(l => /about|team|leadership|company|our-story/i.test(l));
          let aboutPageData = pageData;
          if (aboutPage) {
            const aboutResult = await getPageData(aboutPage);
            if (aboutResult.success) {
              aboutPageData = { html: aboutResult.html!, text: aboutResult.text! };
              console.log(`[acquire_context_field] Using ${aboutPage} for ${field}`);
            }
          }
          extractedData = await analyzeWithAI(config.aiPrompt!, aboutPageData.text, origin);
          await saveToDatabase(userId, projectId, config.dbType, 
            typeof extractedData === 'string' ? extractedData : JSON.stringify(extractedData));
          break;

        case 'faq':
          // Try to find FAQ page
          const faqLinks = extractNavigationLinks(pageData.html, origin);
          const faqPage = faqLinks.find(l => /faq|help|support|questions/i.test(l));
          let faqPageData = pageData;
          if (faqPage) {
            const faqResult = await getPageData(faqPage);
            if (faqResult.success) {
              faqPageData = { html: faqResult.html!, text: faqResult.text! };
              console.log(`[acquire_context_field] Using ${faqPage} for FAQ`);
            }
          }
          extractedData = await analyzeWithAI(config.aiPrompt!, faqPageData.text, origin);
          await saveToDatabase(userId, projectId, config.dbType,
            typeof extractedData === 'string' ? extractedData : JSON.stringify(extractedData));
          break;

        case 'industries':
        case 'use-cases':
        case 'who-we-serve':
          // Try to find solutions/industries page
          const industryLinks = extractNavigationLinks(pageData.html, origin);
          const industryPage = industryLinks.find(l => 
            /industries|solutions|customers|use-cases|for-/i.test(l));
          let industryPageData = pageData;
          if (industryPage) {
            const industryResult = await getPageData(industryPage);
            if (industryResult.success) {
              industryPageData = { html: industryResult.html!, text: industryResult.text! };
              console.log(`[acquire_context_field] Using ${industryPage} for ${field}`);
            }
          }
          extractedData = await analyzeWithAI(config.aiPrompt!, industryPageData.text, origin);
          await saveToDatabase(userId, projectId, config.dbType, extractedData);
          break;

        case 'products-services':
          // Try to find products/pricing page
          const productLinks = extractNavigationLinks(pageData.html, origin);
          const productPage = productLinks.find(l => 
            /products|services|features|pricing|solutions/i.test(l));
          let productPageData = pageData;
          if (productPage) {
            const productResult = await getPageData(productPage);
            if (productResult.success) {
              productPageData = { html: productResult.html!, text: productResult.text! };
              console.log(`[acquire_context_field] Using ${productPage} for products-services`);
            }
          }
          extractedData = await analyzeWithAI(config.aiPrompt!, productPageData.text, origin);
          await saveToDatabase(userId, projectId, config.dbType, extractedData);
          break;

        case 'social-proof-trust':
          // First, analyze the website itself for social proof
          console.log('[acquire_context_field] Extracting social proof from website...');
          const websiteSocialProof = await analyzeWithAI(config.aiPrompt!, pageData.text, origin);
          
          // Parse the result if it's a string
          let socialProofData: any;
          try {
            socialProofData = typeof websiteSocialProof === 'string' 
              ? JSON.parse(websiteSocialProof.replace(/```json\n?/g, '').replace(/```\n?/g, ''))
              : websiteSocialProof;
          } catch (e) {
            socialProofData = {
              testimonials: [],
              metrics: '',
              awards: '',
              badges: '',
              partners: ''
            };
          }

          // Now try to fetch external platform reviews
          console.log('[acquire_context_field] Fetching external platform reviews...');
          const companyDomain = new URL(origin).hostname.replace('www.', '');
          const companyName = socialProofData.companyName || companyDomain.split('.')[0];
          
          const externalReviews: any[] = [];
          
          // Try each platform
          const platforms = [
            { name: 'producthunt', searchUrl: `https://www.producthunt.com/search?q=${encodeURIComponent(companyName)}`, directUrl: `https://www.producthunt.com/products/${companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')}` },
            { name: 'trustpilot', searchUrl: `https://www.trustpilot.com/search?query=${encodeURIComponent(companyName)}`, directUrl: `https://www.trustpilot.com/review/${companyDomain}` },
            { name: 'g2', searchUrl: `https://www.g2.com/search?query=${encodeURIComponent(companyName)}`, directUrl: `https://www.g2.com/products/${companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')}/reviews` },
            { name: 'capterra', searchUrl: `https://www.capterra.com/search/?search=${encodeURIComponent(companyName)}`, directUrl: null },
          ];

          for (const platform of platforms) {
            try {
              // Try to fetch the direct URL if available
              const urlToTry = platform.directUrl || platform.searchUrl;
              console.log(`[acquire_context_field] Trying ${platform.name}: ${urlToTry}`);
              
              const platformResult = await getPageData(urlToTry);
              if (platformResult.success && platformResult.text) {
                // Check if this is actually the right page (not a 404 or search results)
                const text = platformResult.text.toLowerCase();
                const domainLower = companyDomain.toLowerCase();
                const nameLower = companyName.toLowerCase();
                
                if (text.includes(domainLower) || text.includes(nameLower)) {
                  // Extract rating if present
                  const ratingMatch = platformResult.html?.match(/(\d+\.?\d*)\s*(?:out of|\/)\s*5|★\s*(\d+\.?\d*)/i);
                  const reviewCountMatch = platformResult.html?.match(/(\d+[\d,]*)\s*(?:reviews?|ratings?)/i);
                  
                  // Look for awards (especially ProductHunt badges)
                  const awards: string[] = [];
                  if (platform.name === 'producthunt') {
                    if (text.includes('product of the day')) awards.push('Product of the Day');
                    if (text.includes('product of the week')) awards.push('Product of the Week');
                    if (text.includes('product of the month')) awards.push('Product of the Month');
                    if (text.includes('golden kitty')) awards.push('Golden Kitty Award');
                  }
                  
                  externalReviews.push({
                    platform: platform.name,
                    rating: ratingMatch?.[1] || ratingMatch?.[2] || null,
                    reviewCount: reviewCountMatch?.[1]?.replace(',', '') || null,
                    url: urlToTry,
                    awards: awards.length > 0 ? awards : undefined,
                    found: true
                  });
                  
                  console.log(`[acquire_context_field] ✅ Found ${platform.name} listing for ${companyName}`);
                }
              }
            } catch (e: any) {
              console.log(`[acquire_context_field] Could not fetch ${platform.name}: ${e.message}`);
            }
          }

          // Merge external reviews with website data
          socialProofData.externalReviews = externalReviews.filter(r => r.found);
          socialProofData.platformSearchUrls = platforms.map(p => ({
            platform: p.name,
            url: p.searchUrl
          }));
          
          await saveToDatabase(userId, projectId, config.dbType, JSON.stringify(socialProofData));
          extractedData = socialProofData;
          break;

        default:
          // Generic AI analysis
          extractedData = await analyzeWithAI(config.aiPrompt!, pageData.text, origin);
          await saveToDatabase(userId, projectId, config.dbType,
            typeof extractedData === 'string' ? extractedData : JSON.stringify(extractedData));
      }

      const duration = Date.now() - startTime;
      console.log(`[acquire_context_field] ✅ ${field} acquired in ${duration}ms from ${usedPage}`);

      return {
        success: true,
        field,
        data: extractedData,
        savedAs: config.dbType,
        sourcePage: usedPage,
        duration: `${duration}ms`,
        message: `✅ ${field} extracted and saved`
      };

    } catch (error: any) {
      console.error(`[acquire_context_field] ❌ Error acquiring ${field}:`, error);
      return {
        success: false,
        field,
        error: error.message,
        message: `❌ Failed to acquire ${field}: ${error.message}`
      };
    }
  }
});

// ========== Page Fetching ==========

async function getPageData(url: string): Promise<{ success: boolean; html?: string; text?: string; error?: string }> {
  const cached = scrapedDataCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[getPageData] Using cached data for ${url}`);
    return { success: true, html: cached.html, text: cached.text };
  }

  try {
    console.log(`[getPageData] Fetching ${url}...`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const html = await response.text();
    const text = cleanText(html);

    scrapedDataCache.set(url, { html, text, timestamp: Date.now() });

    return { success: true, html, text };
  } catch (error: any) {
    console.log(`[getPageData] Failed to fetch ${url}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ========== Navigation Discovery ==========

function extractNavigationLinks(html: string, origin: string): string[] {
  const cached = navigationCache.get(origin);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.links;
  }

  const links: Set<string> = new Set();
  
  // Find links in header/nav
  const navPatterns = [
    /<header[^>]*>([\s\S]*?)<\/header>/gi,
    /<nav[^>]*>([\s\S]*?)<\/nav>/gi,
  ];

  let navHtml = '';
  for (const pattern of navPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      navHtml += match[1];
    }
  }

  // Extract href values
  const hrefPattern = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = hrefPattern.exec(navHtml)) !== null) {
    const href = match[1];
    if (href.startsWith('/') && !href.startsWith('//')) {
      links.add(origin + href);
    } else if (href.startsWith(origin)) {
      links.add(href);
    }
  }

  const linkArray = Array.from(links);
  navigationCache.set(origin, { links: linkArray, timestamp: Date.now() });
  
  return linkArray;
}

// ========== Database Save ==========

async function saveToDatabase(
  userId: string, 
  projectId: string, 
  type: string, 
  content: string,
  extras?: any
): Promise<void> {
  const upsertData: any = {
    user_id: userId,
    project_id: projectId,
    type,
    content,
    updated_at: new Date().toISOString()
  };

  // Add brand asset fields if provided
  if (extras) {
    // Logo & Favicon (use correct DB column names!)
    if (extras.logo) upsertData.file_url = extras.logo;
    if (extras.logoLightUrl || extras.logo) upsertData.logo_light = extras.logoLightUrl || extras.logo;
    if (extras.logoDarkUrl) upsertData.logo_dark = extras.logoDarkUrl;
    if (extras.faviconLightUrl || extras.favicon) upsertData.icon_light = extras.faviconLightUrl || extras.favicon;
    if (extras.faviconDarkUrl) upsertData.icon_dark = extras.faviconDarkUrl;
    if (extras.favicon) upsertData.favicon = extras.favicon;
    
    // Colors
    if (extras.primaryColor) upsertData.primary_color = extras.primaryColor;
    if (extras.secondaryColor) upsertData.secondary_color = extras.secondaryColor;
    
    // Typography
    if (extras.headingFont || extras.fonts?.[0]) upsertData.heading_font = extras.headingFont || extras.fonts?.[0];
    if (extras.bodyFont || extras.fonts?.[1] || extras.fonts?.[0]) {
      upsertData.body_font = extras.bodyFont || extras.fonts?.[1] || extras.fonts?.[0];
    }
    
    // Brand Info
    if (extras.brandName) upsertData.brand_name = extras.brandName;
    if (extras.metaDescription) upsertData.meta_description = extras.metaDescription;
    if (extras.ogImage) upsertData.og_image = extras.ogImage;
    if (extras.tone) upsertData.tone = extras.tone;
    if (extras.languages || extras.language) upsertData.languages = extras.languages || extras.language;
  }

  const { error } = await supabase
    .from('site_contexts')
    .upsert(upsertData, { onConflict: 'user_id,project_id,type' });

  if (error) {
    console.error(`[saveToDatabase] Error saving ${type}:`, error);
    throw error;
  }
  
  console.log(`[saveToDatabase] ✅ Saved ${type}`, 
    Object.keys(upsertData).filter(k => !['user_id', 'project_id', 'type', 'content', 'updated_at'].includes(k)));
}

// ========== Regex Extractors ==========

function extractBrandAssets(html: string, origin: string): any {
  // Decode HTML entities in URLs (e.g., &amp; -> &)
  const decodeHtmlEntities = (str: string): string => {
    if (!str) return str;
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/');
  };

  const resolveUrl = (url: string) => {
    if (!url) return null;
    // First decode HTML entities
    url = decodeHtmlEntities(url);
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('/')) return origin + url;
    if (url.startsWith('http')) return url;
    return origin + '/' + url;
  };
  
  // Logo - multiple patterns
  const logoPatterns = [
    /<img[^>]*class="[^"]*logo[^"]*"[^>]*src=["']([^"']+)["']/gi,
    /<img[^>]*src=["']([^"']+)["'][^>]*class="[^"]*logo[^"]*"/gi,
    /<a[^>]*class="[^"]*logo[^"]*"[^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/gi,
    /<img[^>]*alt="[^"]*logo[^"]*"[^>]*src=["']([^"']+)["']/gi,
    /<header[^>]*>[\s\S]*?<a[^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/gi,
  ];
  let logoLight = null;
  for (const pattern of logoPatterns) {
    const match = pattern.exec(html);
    if (match?.[1] && !match[1].includes('data:image')) {
      logoLight = resolveUrl(match[1]);
      break;
    }
  }
  
  // Dark logo variant
  const darkLogoMatch = html.match(/data-dark-src=["']([^"']+)["']/i) ||
                        html.match(/class="[^"]*logo[^"]*dark[^"]*"[^>]*src=["']([^"']+)["']/i);
  const logoDark = darkLogoMatch ? resolveUrl(darkLogoMatch[1]) : null;

  // Favicon - multiple patterns with priority
  const faviconPatterns = [
    /<link[^>]*rel=["']icon["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*rel=["']shortcut icon["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']icon["']/i,
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']shortcut icon["']/i,
    /<link[^>]*rel=["']apple-touch-icon[^"]*["'][^>]*href=["']([^"']+)["']/i,
  ];
  let faviconLight = null;
  for (const p of faviconPatterns) {
    const m = html.match(p);
    if (m?.[1]) {
      faviconLight = resolveUrl(m[1]);
      break;
    }
  }
  // Default fallback
  if (!faviconLight) faviconLight = origin + '/favicon.ico';

  // Colors - CSS variables and hex
  let primaryColor = null;
  let secondaryColor = null;
  
  // Check CSS variables first (most reliable)
  const primaryVarPatterns = [
    /--(?:primary|brand|main|theme)[-_]?(?:color)?\s*:\s*(#[0-9A-Fa-f]{3,6}|rgb[a]?\([^)]+\))/i,
    /--color[-_]?(?:primary|brand|main)\s*:\s*(#[0-9A-Fa-f]{3,6}|rgb[a]?\([^)]+\))/i,
  ];
  const secondaryVarPatterns = [
    /--(?:secondary|accent)[-_]?(?:color)?\s*:\s*(#[0-9A-Fa-f]{3,6}|rgb[a]?\([^)]+\))/i,
    /--color[-_]?(?:secondary|accent)\s*:\s*(#[0-9A-Fa-f]{3,6}|rgb[a]?\([^)]+\))/i,
  ];
  
  for (const p of primaryVarPatterns) {
    const m = html.match(p);
    if (m) { primaryColor = m[1]; break; }
  }
  for (const p of secondaryVarPatterns) {
    const m = html.match(p);
    if (m) { secondaryColor = m[1]; break; }
  }
  
  // Fallback to finding common hex colors
  if (!primaryColor || !secondaryColor) {
    const colorMatches = html.match(/#([0-9A-Fa-f]{6})\b/g) || [];
    const neutrals = new Set([
      '#FFFFFF', '#000000', '#EEEEEE', '#F5F5F5', '#FAFAFA', '#F9FAFB',
      '#333333', '#666666', '#999999', '#CCCCCC', '#E5E5E5', '#E5E7EB',
      '#111827', '#374151', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB',
    ].map(c => c.toUpperCase()));
    
    const brandColors = [...new Set(colorMatches.map(c => c.toUpperCase()))]
      .filter(c => !neutrals.has(c));
    
    if (!primaryColor && brandColors.length > 0) primaryColor = brandColors[0];
    if (!secondaryColor && brandColors.length > 1) secondaryColor = brandColors[1];
  }

  // Fonts - Google Fonts & system fonts
  const fontMatches = html.match(/fonts\.googleapis\.com\/css2?\?family=([^"'&\s]+)/gi) || [];
  const fonts = fontMatches.map(m => {
    const family = m.match(/family=([^"'&\s:]+)/)?.[1] || '';
    return decodeURIComponent(family).replace(/\+/g, ' ');
  }).filter(f => f.length > 0);
  const uniqueFonts = [...new Set(fonts)];

  // Also check for font-family in CSS
  if (uniqueFonts.length === 0) {
    const fontFamilyMatch = html.match(/font-family:\s*["']?([^;,"']+)/i);
    if (fontFamilyMatch) {
      uniqueFonts.push(fontFamilyMatch[1].trim());
    }
  }

  // Metadata
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaTitle = titleMatch?.[1]?.trim() || null;
  
  const metaDescPatterns = [
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i,
  ];
  let metaDescription = null;
  for (const p of metaDescPatterns) {
    const m = html.match(p);
    if (m) { metaDescription = decodeHtmlEntities(m[1]); break; }
  }
  
  // Meta Keywords
  const metaKeywordsPatterns = [
    /<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']keywords["']/i,
  ];
  let metaKeywords = null;
  for (const p of metaKeywordsPatterns) {
    const m = html.match(p);
    if (m) { metaKeywords = decodeHtmlEntities(m[1]); break; }
  }
  
  // OG Image
  const ogImagePatterns = [
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
  ];
  let ogImage = null;
  for (const p of ogImagePatterns) {
    const m = html.match(p);
    if (m) { ogImage = resolveUrl(m[1]); break; }
  }
  
  // Language
  const langMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i);
  const language = langMatch ? langMatch[1] : 'en';

  // Brand name from title (first part before | - etc)
  const brandName = metaTitle?.split(/[\|–—-]/)[0]?.trim() || null;

  return {
    logo: logoLight,
    logoLightUrl: logoLight,
    logoDarkUrl: logoDark,
    faviconLightUrl: faviconLight,
    faviconDarkUrl: null,
    favicon: faviconLight,
    primaryColor,
    secondaryColor,
    metaTitle,      // Full <title> tag content
    metaKeywords,   // Meta keywords
    // tone will be added by AI analysis in brand-assets case
    headingFont: uniqueFonts[0] || null,
    bodyFont: uniqueFonts[1] || uniqueFonts[0] || null,
    fonts: uniqueFonts,
    brandName,
    metaDescription,
    ogImage,
    language,
  };
}

function extractHeroSection(html: string): any {
  // Find hero section
  const heroPatterns = [
    /<section[^>]*(?:class|id)="[^"]*hero[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
    /<div[^>]*(?:class|id)="[^"]*hero[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<section[^>]*(?:class|id)="[^"]*banner[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
  ];

  let heroHtml = '';
  for (const pattern of heroPatterns) {
    const match = html.match(pattern);
    if (match) {
      heroHtml = match[1];
      break;
    }
  }

  // Fallback: content after header
  if (!heroHtml) {
    const afterHeader = html.match(/<\/header>[\s\S]*?(<section[^>]*>[\s\S]{200,2000}?<\/section>)/i);
    if (afterHeader) heroHtml = afterHeader[1];
  }

  // Extract components
  const h1Match = heroHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h2Match = heroHtml.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  const pMatch = heroHtml.match(/<p[^>]*class="[^"]*(?:sub|desc|lead)[^"]*"[^>]*>([\s\S]*?)<\/p>/i) ||
                 heroHtml.match(/<h1[^>]*>[\s\S]*?<\/h1>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
  
  const ctaPatterns = [
    /<(?:a|button)[^>]*class="[^"]*(?:btn|button|cta)[^"]*"[^>]*>([\s\S]*?)<\/(?:a|button)>/gi,
    /<a[^>]*href[^>]*class="[^"]*(?:primary|main)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi,
  ];
  let cta = '';
  for (const p of ctaPatterns) {
    const m = p.exec(heroHtml);
    if (m) { cta = cleanText(m[1]); break; }
  }

  // Look for metrics/stats
  const metricsPattern = /(\d+(?:,\d{3})*(?:\.\d+)?[%+]?\s*(?:customers?|users?|companies?|downloads?|reviews?|rating|stars?))/gi;
  const metrics = [...heroHtml.matchAll(metricsPattern)].map(m => m[1]).slice(0, 5);

  return {
    headline: cleanText(h1Match?.[1] || ''),
    subheadline: cleanText(pMatch?.[1] || h2Match?.[1] || ''),
    callToAction: cta,
    metrics: metrics.join(', '),
    fullText: cleanText(heroHtml).substring(0, 500),
  };
}

function extractContactInfo(html: string): any {
  // Email
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const emails = [...new Set([...html.matchAll(emailRegex)].map(m => m[1]))]
    .filter(e => !e.includes('example.com') && !e.includes('wixpress') && !e.includes('sentry'));

  // Phone
  const phoneRegex = /(?:\+?[\d]{1,3}[-.\s]?)?\(?[\d]{3}\)?[-.\s]?[\d]{3}[-.\s]?[\d]{4,6}/g;
  const phones = [...new Set([...html.matchAll(phoneRegex)].map(m => m[0].trim()))]
    .filter(p => p.length >= 10 && p.length <= 20);

  // Address
  const addressPatterns = [
    /<address[^>]*>([\s\S]*?)<\/address>/i,
    /(?:address|location|office)[^>]*>[\s\S]*?<(?:p|div)[^>]*>([\s\S]*?)<\/(?:p|div)>/i,
  ];
  let address = '';
  for (const p of addressPatterns) {
    const m = html.match(p);
    if (m) { address = cleanText(m[1]); break; }
  }

  // Social links
  const social: Record<string, string> = {};
  const socialPatterns = [
    { name: 'twitter', pattern: /href="(https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^"]+)"/i },
    { name: 'linkedin', pattern: /href="(https?:\/\/(?:www\.)?linkedin\.com\/[^"]+)"/i },
    { name: 'facebook', pattern: /href="(https?:\/\/(?:www\.)?facebook\.com\/[^"]+)"/i },
    { name: 'instagram', pattern: /href="(https?:\/\/(?:www\.)?instagram\.com\/[^"]+)"/i },
    { name: 'youtube', pattern: /href="(https?:\/\/(?:www\.)?youtube\.com\/[^"]+)"/i },
    { name: 'github', pattern: /href="(https?:\/\/(?:www\.)?github\.com\/[^"]+)"/i },
  ];
  for (const { name, pattern } of socialPatterns) {
    const match = html.match(pattern);
    if (match) social[name] = match[1];
  }

  return {
    emails: emails.slice(0, 5),
    phones: phones.slice(0, 3),
    address: address.substring(0, 200),
    social,
    primaryEmail: emails[0] || null,
    primaryPhone: phones[0] || null,
  };
}

function extractHeader(html: string, origin: string): any {
  const headerMatch = html.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
  const navMatch = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i);
  
  const headerHtml = headerMatch?.[1] || navMatch?.[1] || '';
  
  // Extract navigation items
  const navItems: Array<{ label: string; href: string; children?: any[] }> = [];
  const linkPattern = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  
  let match;
  while ((match = linkPattern.exec(headerHtml)) !== null) {
    const href = match[1];
    const label = cleanText(match[2]);
    if (label && !href.startsWith('#') && !href.includes('javascript:')) {
      navItems.push({
        label,
        href: href.startsWith('/') ? origin + href : href,
      });
    }
  }

  // Dedupe by label
  const seen = new Set();
  const uniqueItems = navItems.filter(item => {
    if (seen.has(item.label.toLowerCase())) return false;
    seen.add(item.label.toLowerCase());
    return true;
  });

  return {
    navigation: uniqueItems.slice(0, 15),
    hasSearch: /search|搜索/i.test(headerHtml),
    hasCTA: /sign.?up|get.?started|try|demo|contact/i.test(headerHtml),
  };
}

function extractFooter(html: string, origin: string): any {
  const footerMatch = html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i);
  const footerHtml = footerMatch?.[1] || '';

  // Extract footer links grouped by section
  const sections: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [];
  
  // Find column/section patterns
  const columnPatterns = [
    /<div[^>]*class="[^"]*(?:col|column|footer-section|footer-menu)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<ul[^>]*class="[^"]*footer[^"]*"[^>]*>([\s\S]*?)<\/ul>/gi,
  ];

  for (const pattern of columnPatterns) {
    let colMatch;
    while ((colMatch = pattern.exec(footerHtml)) !== null) {
      const columnHtml = colMatch[1];
      const titleMatch = columnHtml.match(/<(?:h[3-6]|strong|b)[^>]*>([\s\S]*?)<\/(?:h[3-6]|strong|b)>/i);
      const title = titleMatch ? cleanText(titleMatch[1]) : '';
      
      const links: Array<{ label: string; href: string }> = [];
      const linkPattern = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      
      let linkMatch;
      while ((linkMatch = linkPattern.exec(columnHtml)) !== null) {
        const href = linkMatch[1];
        const label = cleanText(linkMatch[2]);
        if (label && label.length < 50) {
          links.push({
            label,
            href: href.startsWith('/') ? origin + href : href,
          });
        }
      }

      if (links.length > 0) {
        sections.push({ title, links: links.slice(0, 10) });
      }
    }
  }

  // Copyright
  const copyrightMatch = footerHtml.match(/(?:©|copyright|&copy;)\s*(\d{4})?[^<]*/i);
  const copyright = copyrightMatch ? cleanText(copyrightMatch[0]) : '';

  return {
    sections: sections.slice(0, 6),
    copyright,
    hasSocialLinks: /twitter|linkedin|facebook|instagram|youtube/i.test(footerHtml),
    hasNewsletter: /newsletter|subscribe|email/i.test(footerHtml),
  };
}

async function fetchSitemap(origin: string): Promise<any> {
  const sitemapUrls = [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap-index.xml`,
  ];

  for (const sitemapUrl of sitemapUrls) {
    try {
      const response = await fetch(sitemapUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        const xml = await response.text();
        const urls: string[] = [];
        const locRegex = /<loc>([^<]+)<\/loc>/gi;
        let match;
        while ((match = locRegex.exec(xml)) !== null) {
          const loc = match[1].trim();
          if (!loc.endsWith('.xml')) {
            urls.push(loc);
          }
        }
        
        return { 
          found: true, 
          url: sitemapUrl, 
          urls: urls.slice(0, 500),
          count: urls.length 
        };
      }
    } catch (e) {
      continue;
    }
  }
  
  return { found: false, urls: [], count: 0 };
}

function classifyPages(urls: string[], origin: string): any {
  const keyPages: string[] = [];
  const landingPages: string[] = [];
  const blogPages: string[] = [];

  const keyPatterns = [
    /^\/?$/, /^\/about/i, /^\/pricing/i, /^\/features/i, /^\/contact/i, 
    /^\/faq/i, /^\/team/i, /^\/careers/i, /^\/products?$/i, /^\/services?$/i,
  ];
  const blogPatterns = [/^\/blog/i, /^\/news/i, /^\/articles?/i, /^\/posts?/i, /^\/resources/i];
  const landingPatterns = [/^\/lp\//i, /\/vs\//i, /\/alternative/i, /\/for-/i, /\/compare/i];

  for (const url of urls) {
    try {
      const pathname = new URL(url).pathname;
      if (blogPatterns.some(p => p.test(pathname))) {
        blogPages.push(url);
      } else if (landingPatterns.some(p => p.test(pathname))) {
        landingPages.push(url);
      } else if (keyPatterns.some(p => p.test(pathname)) || pathname.split('/').filter(Boolean).length <= 1) {
        keyPages.push(url);
      }
    } catch (e) {
      continue;
    }
  }

  return {
    keyPages: keyPages.slice(0, 30),
    landingPages: landingPages.slice(0, 30),
    blogPages: blogPages.slice(0, 30),
    counts: {
      key: keyPages.length,
      landing: landingPages.length,
      blog: blogPages.length,
    }
  };
}

// ========== AI Analysis ==========

async function analyzeWithAI(prompt: string, pageText: string, url: string): Promise<any> {
  const fullPrompt = `Website: ${url}

Content (truncated to 8000 chars):
${pageText.substring(0, 8000)}

${prompt}

IMPORTANT: Return ONLY valid JSON. Do not include any explanation, notes, or text outside the JSON structure.`;

  try {
    const { text } = await generateText({
      model: azure(process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1'),
      prompt: fullPrompt,
      maxTokens: 1500,
    });

    // Try to extract JSON from the response
    let trimmed = text.trim();
    
    // Remove markdown code blocks if present
    trimmed = trimmed.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Try to extract JSON object or array from content with extra text
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      const isArray = trimmed.startsWith('[');
      const openChar = isArray ? '[' : '{';
      const closeChar = isArray ? ']' : '}';
      
      // Find the matching closing bracket/brace
      let depth = 0;
      let endIndex = -1;
      let inString = false;
      let prevChar = '';
      
      for (let i = 0; i < trimmed.length; i++) {
        const char = trimmed[i];
        
        // Handle string escaping
        if (char === '"' && prevChar !== '\\') {
          inString = !inString;
        }
        
        if (!inString) {
          if (char === openChar) depth++;
          if (char === closeChar) depth--;
          if (depth === 0) {
            endIndex = i + 1;
            break;
          }
        }
        prevChar = char;
      }
      
      if (endIndex > 0) {
        const jsonPart = trimmed.substring(0, endIndex);
        try {
          return JSON.parse(jsonPart);
        } catch (e) {
          console.log('[analyzeWithAI] Failed to parse extracted JSON:', jsonPart.substring(0, 100));
        }
      }
    }

    // Fallback: try to parse as-is
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  } catch (error: any) {
    console.error(`[analyzeWithAI] Error:`, error);
    return { error: error.message };
  }
}

// ========== Utilities ==========

function cleanText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
