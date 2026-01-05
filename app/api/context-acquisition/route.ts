import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Phase configuration
const PHASES = [
  { id: 'homepage', name: 'Scraping Homepage', weight: 25 },
  { id: 'sitemap', name: 'Fetching Sitemap', weight: 15 },
  { id: 'brand', name: 'Extracting Brand Assets', weight: 20 },
  { id: 'content', name: 'Analyzing Content', weight: 25 },
  { id: 'contact', name: 'Extracting Contact Info', weight: 15 },
];

interface PhaseResult {
  phase: string;
  status: 'success' | 'partial' | 'failed';
  message: string;
  savedFields: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { url, userId, projectId } = await request.json();

    if (!url || !userId || !projectId) {
      return NextResponse.json(
        { error: 'Missing required fields: url, userId, projectId' },
        { status: 400 }
      );
    }

    console.log(`[context-acquisition] Starting acquisition for ${url} (project: ${projectId})`);

    // Use streaming response for real-time progress
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendProgress = (phase: string, progress: number, message: string, data?: any) => {
          const event = JSON.stringify({ phase, progress, message, data });
          controller.enqueue(encoder.encode(`data: ${event}\n\n`));
        };

        const results: PhaseResult[] = [];
        let currentProgress = 0;

        try {
          // === PHASE 1: Scrape Homepage ===
          sendProgress('homepage', 0, 'Connecting to website...');
          
          let homepageData: any = null;
          try {
            homepageData = await scrapeHomepage(url);
            currentProgress = 25;
            sendProgress('homepage', currentProgress, 'Homepage scraped successfully', {
              title: homepageData.metadata?.title,
              hasLogo: !!homepageData.logo?.primary
            });
            results.push({
              phase: 'homepage',
              status: 'success',
              message: 'Homepage scraped',
              savedFields: []
            });
          } catch (error: any) {
            sendProgress('homepage', 10, `Failed to scrape homepage: ${error.message}`);
            results.push({
              phase: 'homepage',
              status: 'failed',
              message: error.message,
              savedFields: []
            });
            // Continue anyway - we might still get sitemap
          }

          // === PHASE 2: Fetch Sitemap ===
          sendProgress('sitemap', currentProgress, 'Fetching sitemap...');
          
          try {
            const origin = new URL(url).origin;
            const sitemapData = await fetchSitemap(origin);
            
            if (sitemapData.found && sitemapData.urls.length > 0) {
              // SAVE IMMEDIATELY
              await saveSiteContext(userId, projectId, 'sitemap', JSON.stringify({
                url: sitemapData.url,
                urls: sitemapData.urls,
                foundAt: new Date().toISOString()
              }));
              
              currentProgress = 40;
              sendProgress('sitemap', currentProgress, `Found ${sitemapData.urls.length} URLs in sitemap`, {
                totalUrls: sitemapData.urls.length
              });
              results.push({
                phase: 'sitemap',
                status: 'success',
                message: `${sitemapData.urls.length} URLs found`,
                savedFields: ['sitemap']
              });
            } else {
              currentProgress = 40;
              sendProgress('sitemap', currentProgress, 'No sitemap found, continuing...');
              results.push({
                phase: 'sitemap',
                status: 'partial',
                message: 'No sitemap found',
                savedFields: []
              });
            }
          } catch (error: any) {
            currentProgress = 40;
            sendProgress('sitemap', currentProgress, `Sitemap error: ${error.message}`);
            results.push({
              phase: 'sitemap',
              status: 'failed',
              message: error.message,
              savedFields: []
            });
          }

          // === PHASE 3: Extract & Save Brand Assets ===
          if (homepageData) {
            sendProgress('brand', currentProgress, 'Extracting brand assets...');
            
            try {
              const savedBrandFields: string[] = [];
              
              // Save logo + colors + fonts (type='logo' is the brand assets type)
              const brandData: any = {
                logo: homepageData.logo?.primary || null,
                logoUrls: homepageData.logo?.urls || [],
                primaryColor: homepageData.colors?.primary || null,
                secondaryColor: homepageData.colors?.secondary || null,
                detectedColors: homepageData.colors?.detected || [],
                headingFont: homepageData.typography?.heading || null,
                bodyFont: homepageData.typography?.body || null,
                googleFonts: homepageData.typography?.googleFonts || [],
                brandName: homepageData.metadata?.title?.split('|')[0]?.split('-')[0]?.trim() || null,
                metaDescription: homepageData.metadata?.description || null,
                ogImage: homepageData.metadata?.ogImage || null,
                favicon: homepageData.metadata?.favicon || null,
                language: homepageData.language?.primary || 'en',
                alternativeLanguages: homepageData.language?.alternatives || [],
              };

              await saveSiteContext(userId, projectId, 'logo', JSON.stringify(brandData), {
                file_url: brandData.logo,
                primary_color: brandData.primaryColor,
                secondary_color: brandData.secondaryColor,
              });
              savedBrandFields.push('logo', 'colors', 'typography', 'metadata');

              currentProgress = 60;
              sendProgress('brand', currentProgress, 'Brand assets saved', {
                logo: !!brandData.logo,
                primaryColor: brandData.primaryColor,
                brandName: brandData.brandName
              });
              results.push({
                phase: 'brand',
                status: 'success',
                message: 'Brand assets extracted',
                savedFields: savedBrandFields
              });
            } catch (error: any) {
              currentProgress = 60;
              sendProgress('brand', currentProgress, `Brand extraction error: ${error.message}`);
              results.push({
                phase: 'brand',
                status: 'failed',
                message: error.message,
                savedFields: []
              });
            }
          } else {
            currentProgress = 60;
            sendProgress('brand', currentProgress, 'Skipping brand extraction (no homepage data)');
          }

          // === PHASE 4: Extract & Save Content (Hero, Key Pages) ===
          if (homepageData) {
            sendProgress('content', currentProgress, 'Analyzing page content...');
            
            try {
              const savedContentFields: string[] = [];

              // Save Hero Section
              if (homepageData.heroSection && (homepageData.heroSection.headline || homepageData.heroSection.fullText)) {
                await saveSiteContext(userId, projectId, 'hero-section', JSON.stringify(homepageData.heroSection));
                savedContentFields.push('hero-section');
              }

              // Extract and classify key pages if we have sitemap
              // For now, just save basic page text for later AI analysis
              if (homepageData.fullPageText) {
                // We don't save fullPageText as a context, but it's available for AI analysis later
              }

              currentProgress = 85;
              sendProgress('content', currentProgress, 'Content analysis complete', {
                hasHero: savedContentFields.includes('hero-section'),
              });
              results.push({
                phase: 'content',
                status: savedContentFields.length > 0 ? 'success' : 'partial',
                message: savedContentFields.length > 0 ? 'Content saved' : 'Limited content found',
                savedFields: savedContentFields
              });
            } catch (error: any) {
              currentProgress = 85;
              sendProgress('content', currentProgress, `Content analysis error: ${error.message}`);
              results.push({
                phase: 'content',
                status: 'failed',
                message: error.message,
                savedFields: []
              });
            }
          } else {
            currentProgress = 85;
            sendProgress('content', currentProgress, 'Skipping content analysis (no homepage data)');
          }

          // === PHASE 5: Extract & Save Contact Info ===
          if (homepageData) {
            sendProgress('contact', currentProgress, 'Extracting contact information...');
            
            try {
              const savedContactFields: string[] = [];
              const contact = homepageData.contact;

              if (contact && (contact.emails?.length > 0 || contact.phones?.length > 0 || Object.keys(contact.social || {}).length > 0)) {
                await saveSiteContext(userId, projectId, 'contact-information', JSON.stringify(contact));
                savedContactFields.push('contact-information');
              }

              currentProgress = 100;
              sendProgress('contact', currentProgress, 'Contact info extracted', {
                emails: contact?.emails?.length || 0,
                phones: contact?.phones?.length || 0,
                social: Object.keys(contact?.social || {}).length
              });
              results.push({
                phase: 'contact',
                status: savedContactFields.length > 0 ? 'success' : 'partial',
                message: savedContactFields.length > 0 ? 'Contact info saved' : 'No contact info found',
                savedFields: savedContactFields
              });
            } catch (error: any) {
              currentProgress = 100;
              sendProgress('contact', currentProgress, `Contact extraction error: ${error.message}`);
              results.push({
                phase: 'contact',
                status: 'failed',
                message: error.message,
                savedFields: []
              });
            }
          } else {
            currentProgress = 100;
            sendProgress('contact', currentProgress, 'Skipping contact extraction (no homepage data)');
          }

          // === FINAL: Send completion event ===
          const allSavedFields = results.flatMap(r => r.savedFields);
          const successCount = results.filter(r => r.status === 'success').length;
          
          sendProgress('complete', 100, 'Context acquisition complete', {
            results,
            savedFields: allSavedFields,
            successRate: `${successCount}/${results.length}`,
            message: allSavedFields.length > 0 
              ? `Successfully saved ${allSavedFields.length} context fields`
              : 'Could not extract context - please check the URL'
          });

        } catch (error: any) {
          sendProgress('error', 0, `Fatal error: ${error.message}`);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('[context-acquisition] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ========== Helper Functions ==========

async function scrapeHomepage(url: string): Promise<any> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();
  
  return {
    metadata: extractMetadata(html),
    colors: extractColors(html),
    typography: extractTypography(html),
    logo: extractLogo(html, url),
    heroSection: extractHeroSection(html),
    contact: extractContactInfo(html),
    fullPageText: extractFullPageText(html),
    language: extractLanguage(html),
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
        const urls = parseSitemapXml(xml);
        return {
          found: true,
          url: sitemapUrl,
          urls
        };
      }
    } catch (e) {
      continue;
    }
  }

  return { found: false, url: null, urls: [] };
}

function parseSitemapXml(xml: string): string[] {
  const urls: string[] = [];
  const locRegex = /<loc>([^<]+)<\/loc>/gi;
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    const loc = match[1].trim();
    if (!loc.endsWith('.xml')) {
      urls.push(loc);
    }
  }
  return urls;
}

async function saveSiteContext(
  userId: string, 
  projectId: string, 
  type: string, 
  content: string,
  extras?: { file_url?: string; primary_color?: string; secondary_color?: string }
): Promise<void> {
  const upsertData: any = {
    user_id: userId,
    project_id: projectId,
    type,
    content,
    updated_at: new Date().toISOString()
  };

  if (extras?.file_url) upsertData.file_url = extras.file_url;
  if (extras?.primary_color) upsertData.primary_color = extras.primary_color;
  if (extras?.secondary_color) upsertData.secondary_color = extras.secondary_color;

  const { error } = await supabase
    .from('site_contexts')
    .upsert(upsertData, {
      onConflict: 'user_id,project_id,type'
    });

  if (error) {
    console.error(`[saveSiteContext] Error saving ${type}:`, error);
    throw error;
  }
  
  console.log(`[saveSiteContext] Saved ${type} for project ${projectId}`);
}

// ========== Extraction Functions ==========

function extractMetadata(html: string): any {
  const metadata: any = {};
  
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) metadata.title = cleanText(titleMatch[1]);

  const descMatch = html.match(/<meta\s+(?:name=["']description["']\s+content=["']([^"']+)["']|content=["']([^"']+)["']\s+name=["']description["'])/i);
  if (descMatch) metadata.description = descMatch[1] || descMatch[2];

  const ogPatterns = [
    { key: 'ogTitle', pattern: /property=["']og:title["']\s+content=["']([^"']+)["']/i },
    { key: 'ogDescription', pattern: /property=["']og:description["']\s+content=["']([^"']+)["']/i },
    { key: 'ogImage', pattern: /property=["']og:image["']\s+content=["']([^"']+)["']/i },
  ];
  
  for (const { key, pattern } of ogPatterns) {
    const match = html.match(pattern);
    if (match) metadata[key] = match[1];
  }

  const faviconMatch = html.match(/<link\s+[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i);
  if (faviconMatch) metadata.favicon = faviconMatch[1];

  return metadata;
}

function extractColors(html: string): any {
  const colors: any = {
    primary: null,
    secondary: null,
    detected: []
  };

  // CSS variables
  const cssVarPatterns = [
    /--(?:primary|brand|main)[-_]?color\s*:\s*(#[0-9A-Fa-f]{3,6}|rgb[a]?\([^)]+\))/gi,
    /--(?:secondary|accent)[-_]?color\s*:\s*(#[0-9A-Fa-f]{3,6}|rgb[a]?\([^)]+\))/gi,
  ];
  
  for (const pattern of cssVarPatterns) {
    const matches = [...html.matchAll(pattern)];
    for (const match of matches) {
      const varName = match[0].split(':')[0].trim();
      if (varName.includes('primary') || varName.includes('brand') || varName.includes('main')) {
        colors.primary = colors.primary || match[1];
      }
      if (varName.includes('secondary') || varName.includes('accent')) {
        colors.secondary = colors.secondary || match[1];
      }
    }
  }

  // Hex colors
  const hexColorRegex = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g;
  const matches = html.match(hexColorRegex) || [];
  const uniqueColors = [...new Set(matches)].map(c => c.toUpperCase());
  
  const neutrals = ['#FFFFFF', '#FFF', '#000000', '#000', '#EEEEEE', '#EEE', '#F5F5F5', '#FAFAFA', '#333333', '#333', '#666666', '#666', '#999999', '#999'];
  const brandColors = uniqueColors.filter(c => !neutrals.includes(c));
  
  colors.detected = brandColors.slice(0, 10);
  
  if (!colors.primary && brandColors.length > 0) colors.primary = brandColors[0];
  if (!colors.secondary && brandColors.length > 1) colors.secondary = brandColors[1];

  return colors;
}

function extractTypography(html: string): any {
  const typography: any = {
    googleFonts: [],
    heading: null,
    body: null
  };

  const googleFontsRegex = /fonts\.googleapis\.com\/css2?\?family=([^"'&]+)/gi;
  let match;
  while ((match = googleFontsRegex.exec(html)) !== null) {
    const fontParam = decodeURIComponent(match[1]);
    const fonts = fontParam.split('|').map(f => f.split(':')[0].replace(/\+/g, ' '));
    typography.googleFonts.push(...fonts);
  }

  typography.googleFonts = [...new Set(typography.googleFonts)];

  if (typography.googleFonts.length >= 2) {
    typography.heading = typography.googleFonts[0];
    typography.body = typography.googleFonts[1];
  } else if (typography.googleFonts.length === 1) {
    typography.heading = typography.googleFonts[0];
    typography.body = typography.googleFonts[0];
  }

  return typography;
}

function extractLogo(html: string, baseUrl: string): any {
  const logos: string[] = [];
  const origin = new URL(baseUrl).origin;
  
  const patterns = [
    /<img[^>]*class="[^"]*(?:logo|brand-logo|navbar-brand)[^"]*"[^>]*src="([^"]+)"/gi,
    /<img[^>]*src="([^"]+)"[^>]*class="[^"]*(?:logo|brand-logo|navbar-brand)[^"]*"/gi,
    /<img[^>]*alt="[^"]*(?:logo|brand)[^"]*"[^>]*src="([^"]+)"/gi,
    /<img[^>]*src="([^"]+)"[^>]*alt="[^"]*(?:logo|brand)[^"]*"/gi,
    /<header[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"/gi,
    /<nav[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"/gi,
  ];

  for (const pattern of patterns) {
    const matches = [...html.matchAll(pattern)];
    for (const match of matches) {
      if (match[1]) {
        let logoUrl = match[1];
        if (logoUrl.startsWith('/')) {
          logoUrl = origin + logoUrl;
        } else if (!logoUrl.startsWith('http')) {
          logoUrl = new URL(logoUrl, baseUrl).href;
        }
        if (!logos.includes(logoUrl)) {
          logos.push(logoUrl);
        }
      }
    }
  }

  return {
    urls: logos.slice(0, 5),
    primary: logos[0] || null
  };
}

function extractHeroSection(html: string): any {
  const hero: any = {};
  
  const heroPatterns = [
    /<section[^>]*class="[^"]*(?:hero|banner|masthead|jumbotron|homepage-hero|main-hero)[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
    /<div[^>]*class="[^"]*(?:hero|banner|masthead|jumbotron|homepage-hero|main-hero)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<main[^>]*>[\s\S]*?<section[^>]*>([\s\S]*?)<\/section>/i,
  ];

  let heroHtml = '';
  for (const pattern of heroPatterns) {
    const match = html.match(pattern);
    if (match) {
      heroHtml = match[1];
      break;
    }
  }

  if (!heroHtml) {
    const afterHeader = html.match(/<\/header>([\s\S]{500,2000})/i);
    if (afterHeader) heroHtml = afterHeader[1];
  }

  if (heroHtml) {
    const h1Match = heroHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1Match) hero.headline = cleanText(h1Match[1]);

    const subMatch = heroHtml.match(/<(?:p|h2)[^>]*class="[^"]*(?:sub|desc|tagline)[^"]*"[^>]*>([\s\S]*?)<\/(?:p|h2)>/i) ||
                     heroHtml.match(/<h1[^>]*>[\s\S]*?<\/h1>[\s\S]*?<(?:p|h2)[^>]*>([\s\S]*?)<\/(?:p|h2)>/i);
    if (subMatch) hero.subheadline = cleanText(subMatch[1]);

    const ctaMatch = heroHtml.match(/<(?:a|button)[^>]*class="[^"]*(?:btn|button|cta)[^"]*"[^>]*>([\s\S]*?)<\/(?:a|button)>/i);
    if (ctaMatch) hero.callToAction = cleanText(ctaMatch[1]);

    hero.fullText = cleanText(heroHtml).substring(0, 800);
  }

  return hero;
}

function extractContactInfo(html: string): any {
  const contact: any = { emails: [], phones: [], social: {} };

  // Email
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const emails = [...new Set([...html.matchAll(emailRegex)].map(m => m[1]))];
  contact.emails = emails.filter(e => !e.includes('example.com') && !e.includes('wixpress')).slice(0, 5);

  // Phone
  const phoneRegex = /(?:\+?[\d]{1,3}[-.\s]?)?\(?[\d]{3}\)?[-.\s]?[\d]{3}[-.\s]?[\d]{4,6}/g;
  const phones = [...html.matchAll(phoneRegex)].map(m => m[0].trim());
  contact.phones = [...new Set(phones.filter(p => p.length >= 7 && !/^\d{4}-\d{2}-\d{2}$/.test(p)))].slice(0, 5);

  // Social
  const socialPatterns = [
    { name: 'twitter', pattern: /href="(https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^"]+)"/i },
    { name: 'linkedin', pattern: /href="(https?:\/\/(?:www\.)?linkedin\.com\/[^"]+)"/i },
    { name: 'facebook', pattern: /href="(https?:\/\/(?:www\.)?facebook\.com\/[^"]+)"/i },
    { name: 'instagram', pattern: /href="(https?:\/\/(?:www\.)?instagram\.com\/[^"]+)"/i },
    { name: 'youtube', pattern: /href="(https?:\/\/(?:www\.)?youtube\.com\/[^"]+)"/i },
  ];
  
  for (const { name, pattern } of socialPatterns) {
    const match = html.match(pattern);
    if (match) contact.social[name] = match[1];
  }

  return contact;
}

function extractLanguage(html: string): any {
  const language: any = { primary: 'en', alternatives: [] };

  const langMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i);
  if (langMatch) {
    language.primary = langMatch[1].split('-')[0];
  }

  const hreflangPattern = /hreflang=["']([^"']+)["']/gi;
  let match;
  while ((match = hreflangPattern.exec(html)) !== null) {
    const lang = match[1].split('-')[0];
    if (!language.alternatives.includes(lang) && lang !== language.primary) {
      language.alternatives.push(lang);
    }
  }

  return language;
}

function extractFullPageText(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyHtml = bodyMatch ? bodyMatch[1] : html;
  return cleanText(bodyHtml).substring(0, 8000);
}

function cleanText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
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

