import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createAzure } from '@ai-sdk/azure';
import { generateHeaderHTML, HeaderConfig } from '@/lib/templates/default-header';
import { generateFooterHTML, FooterConfig } from '@/lib/templates/default-footer';
import { createServerSupabaseAdmin } from '@/lib/supabase-server';

// Initialize clients
const supabase = createServerSupabaseAdmin();

const azure = createAzure({
  apiKey: process.env.AZURE_OPENAI_API_KEY || '',
  resourceName: process.env.AZURE_OPENAI_ENDPOINT?.replace('https://', '').replace('.openai.azure.com', '') || '',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, userId, projectId, mode = 'incremental' } = body;
    // mode: 'incremental' = only empty fields, 'full' = all fields

    if (!url || !userId) {
      return NextResponse.json({ error: 'Missing required fields: url, userId' }, { status: 400 });
    }

    // Normalize URL
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    const origin = new URL(fullUrl).origin;
    const domainName = new URL(fullUrl).hostname.replace('www.', '');

    console.log(`[crawl-context] Starting ${mode} crawl for ${origin}`);

    // Fetch existing contexts to check which fields need updating
    let existingContexts: any[] = [];
    if (mode === 'incremental') {
      const query = supabase
        .from('site_contexts')
        .select('*')
        .eq('user_id', userId);
      
      if (projectId) {
        query.eq('seo_project_id', projectId);
      }
      
      const { data } = await query;
      existingContexts = data || [];
    }

    const logoContext = existingContexts.find(c => c.type === 'logo') || {};
    const headerContext = existingContexts.find(c => c.type === 'header') || {};
    const footerContext = existingContexts.find(c => c.type === 'footer') || {};

    // Determine which fields to crawl
    const shouldCrawlBrandAssets = mode === 'full' || !hasBrandAssets(logoContext);
    const shouldCrawlHeader = mode === 'full' || !hasHeaderContent(headerContext);
    const shouldCrawlFooter = mode === 'full' || !hasFooterContent(footerContext);

    // Fetch homepage HTML
    console.log(`[crawl-context] Fetching ${origin}...`);
    const response = await fetch(origin, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch website: HTTP ${response.status}` }, { status: 400 });
    }

    const html = await response.text();
    console.log(`[crawl-context] Fetched ${html.length} chars`);

    const results: any = {
      url: origin,
      mode,
      fields: {},
    };

    // === CRAWL BRAND ASSETS (always first to get logo for header/footer) ===
    let brandAssets: any = null;
    if (shouldCrawlBrandAssets) {
      console.log(`[crawl-context] Extracting brand assets...`);
      brandAssets = extractBrandAssets(html, origin, domainName);
      
      // Save to database
      await saveBrandAssets(userId, projectId, brandAssets, mode, logoContext);
      results.fields['brand-assets'] = {
        success: true,
        extracted: Object.keys(brandAssets).filter(k => brandAssets[k]).length,
        data: brandAssets,
      };
    } else {
      // Use existing logo for header/footer
      brandAssets = {
        logo_url: logoContext.logo_url || logoContext.logo_light_url || logoContext.file_url,
        domain_name: logoContext.domain_name || domainName,
      };
      results.fields['brand-assets'] = { skipped: true, reason: 'Already has values' };
    }

    // Get logo URL for header/footer generation
    const logoUrl = brandAssets?.logo_url || null;
    const siteName = brandAssets?.domain_name || domainName;
    console.log(`[crawl-context] Using logo for header/footer: ${logoUrl || 'none'}`);

    // === CRAWL HEADER ===
    let headerExtractedAssets: any = {};
    if (shouldCrawlHeader) {
      console.log(`[crawl-context] Extracting header...`);
      const headerResult = await extractHeader(html, origin, logoUrl, siteName);
      
      if (headerResult.success) {
        await saveHeaderFooter(userId, projectId, 'header', headerResult.config, headerResult.html);
        results.fields['header'] = {
          success: true,
          navItems: headerResult.config.navigation?.length || 0,
        };
        headerExtractedAssets = headerResult.extractedAssets || {};
      } else {
        results.fields['header'] = { success: false, error: headerResult.error };
      }
    } else {
      results.fields['header'] = { skipped: true, reason: 'Already has values' };
    }

    // === CRAWL FOOTER ===
    let footerExtractedAssets: any = {};
    if (shouldCrawlFooter) {
      console.log(`[crawl-context] Extracting footer...`);
      const footerResult = await extractFooter(html, origin, logoUrl, siteName);
      
      if (footerResult.success) {
        await saveHeaderFooter(userId, projectId, 'footer', footerResult.config, footerResult.html);
        results.fields['footer'] = {
          success: true,
          columns: footerResult.config.columns?.length || 0,
        };
        footerExtractedAssets = footerResult.extractedAssets || {};
      } else {
        results.fields['footer'] = { success: false, error: footerResult.error };
      }
    } else {
      results.fields['footer'] = { skipped: true, reason: 'Already has values' };
    }

    // Note: primary_color, secondary_color, heading_font, body_font columns removed from DB

    console.log(`[crawl-context] Completed:`, results);

    return NextResponse.json({
      success: true,
      ...results,
      message: `Context crawled successfully from ${domainName}`,
    });

  } catch (error: any) {
    console.error('[crawl-context] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Crawl failed' 
    }, { status: 500 });
  }
}

// ========== Helper Functions ==========

function hasBrandAssets(ctx: any): boolean {
  return !!(
    ctx.logo_url ||
    ctx.logo_light_url ||
    ctx.file_url ||
    ctx.favicon_url ||
    ctx.favicon_light_url ||
    ctx.domain_name
  );
}

function hasHeaderContent(ctx: any): boolean {
  return !!(ctx.html || ctx.content);
}

function hasFooterContent(ctx: any): boolean {
  return !!(ctx.html || ctx.content);
}

function extractBrandAssets(html: string, origin: string, domainName: string): any {
  const decodeHtmlEntities = (str: string): string => {
    if (!str) return str;
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  };

  const resolveUrl = (url: string) => {
    if (!url) return null;
    url = decodeHtmlEntities(url);
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('/')) return origin + url;
    if (url.startsWith('http')) return url;
    return origin + '/' + url;
  };

  // Logo
  const logoPatterns = [
    /<img[^>]*class="[^"]*logo[^"]*"[^>]*src=["']([^"']+)["']/gi,
    /<img[^>]*src=["']([^"']+)["'][^>]*class="[^"]*logo[^"]*"/gi,
    /<a[^>]*class="[^"]*logo[^"]*"[^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/gi,
    /<header[^>]*>[\s\S]*?<a[^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/gi,
  ];
  let logoLightUrl = null;
  for (const pattern of logoPatterns) {
    const match = pattern.exec(html);
    if (match?.[1] && !match[1].includes('data:image')) {
      logoLightUrl = resolveUrl(match[1]);
      break;
    }
  }

  // Favicon
  const faviconPatterns = [
    /<link[^>]*rel=["']icon["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*rel=["']shortcut icon["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*rel=["']apple-touch-icon[^"]*["'][^>]*href=["']([^"']+)["']/i,
  ];
  let faviconLightUrl = null;
  for (const p of faviconPatterns) {
    const m = html.match(p);
    if (m?.[1]) {
      faviconLightUrl = resolveUrl(m[1]);
      break;
    }
  }
  if (!faviconLightUrl) faviconLightUrl = origin + '/favicon.ico';

  // Colors - Multiple extraction methods
  let primaryColor = null;
  let secondaryColor = null;
  
  // Method 1: Meta theme-color
  const themeColorMatch = html.match(/<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i) ||
                          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']theme-color["']/i);
  if (themeColorMatch?.[1] && themeColorMatch[1].startsWith('#')) {
    primaryColor = themeColorMatch[1];
    console.log(`[extractBrandAssets] Theme color: ${primaryColor}`);
  }
  
  // Method 2: CSS Variables
  if (!primaryColor) {
    const primaryVarPatterns = [
      /--(?:primary|brand|main|theme)[-_]?(?:color)?\s*:\s*(#[0-9A-Fa-f]{3,6})/i,
      /--color[-_]?(?:primary|brand|main)\s*:\s*(#[0-9A-Fa-f]{3,6})/i,
    ];
    for (const p of primaryVarPatterns) {
      const m = html.match(p);
      if (m) { primaryColor = m[1]; break; }
    }
  }
  
  const secondaryVarPatterns = [
    /--(?:secondary|accent)[-_]?(?:color)?\s*:\s*(#[0-9A-Fa-f]{3,6})/i,
  ];
  for (const p of secondaryVarPatterns) {
    const m = html.match(p);
    if (m) { secondaryColor = m[1]; break; }
  }
  
  // Method 3: Button/CTA background colors
  if (!primaryColor) {
    // Look for button styles
    const buttonColorPatterns = [
      /\.btn[^{]*\{[^}]*background(?:-color)?:\s*(#[0-9A-Fa-f]{3,6})/is,
      /button[^{]*\{[^}]*background(?:-color)?:\s*(#[0-9A-Fa-f]{3,6})/is,
      /\.cta[^{]*\{[^}]*background(?:-color)?:\s*(#[0-9A-Fa-f]{3,6})/is,
      /style=["'][^"']*background(?:-color)?:\s*(#[0-9A-Fa-f]{3,6})/i,
    ];
    for (const p of buttonColorPatterns) {
      const m = html.match(p);
      if (m?.[1]) { 
        primaryColor = m[1]; 
        console.log(`[extractBrandAssets] Button color: ${primaryColor}`);
        break; 
      }
    }
  }
  
  // Method 4: Tailwind color classes (common brand colors)
  if (!primaryColor) {
    const tailwindColors: { [key: string]: string } = {
      'blue-500': '#3B82F6', 'blue-600': '#2563EB',
      'indigo-500': '#6366F1', 'indigo-600': '#4F46E5',
      'purple-500': '#A855F7', 'purple-600': '#9333EA',
      'green-500': '#22C55E', 'green-600': '#16A34A',
      'red-500': '#EF4444', 'red-600': '#DC2626',
      'orange-500': '#F97316', 'orange-600': '#EA580C',
      'yellow-500': '#EAB308', 'yellow-600': '#CA8A04',
      'pink-500': '#EC4899', 'pink-600': '#DB2777',
      'teal-500': '#14B8A6', 'teal-600': '#0D9488',
    };
    for (const [className, hex] of Object.entries(tailwindColors)) {
      if (html.includes(`bg-${className}`) || html.includes(`text-${className}`)) {
        primaryColor = hex;
        console.log(`[extractBrandAssets] Tailwind color: ${className} -> ${hex}`);
        break;
      }
    }
  }
  
  // Method 5: Fallback to common hex colors in HTML
  if (!primaryColor || !secondaryColor) {
    const colorMatches = html.match(/#([0-9A-Fa-f]{6})\b/g) || [];
    const neutrals = new Set([
      '#FFFFFF', '#000000', '#EEEEEE', '#F5F5F5', '#FAFAFA', '#F9FAFB',
      '#333333', '#666666', '#999999', '#CCCCCC', '#E5E5E5', '#E5E7EB',
      '#111827', '#374151', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB',
      '#F3F4F6', '#E5E7EB', '#D1D5DB', '#1F2937', '#030712',
    ].map(c => c.toUpperCase()));
    
    const brandColors = [...new Set(colorMatches.map(c => c.toUpperCase()))]
      .filter(c => !neutrals.has(c));
    
    if (!primaryColor && brandColors.length > 0) primaryColor = brandColors[0];
    if (!secondaryColor && brandColors.length > 1) secondaryColor = brandColors[1];
  }
  
  console.log(`[extractBrandAssets] Colors - Primary: ${primaryColor || 'none'}, Secondary: ${secondaryColor || 'none'}`);

  // Fonts - Multiple extraction methods
  let headingFont: string | null = null;
  let bodyFont: string | null = null;
  
  // Method 1: Google Fonts URL
  const googleFontMatches = html.match(/fonts\.googleapis\.com\/css2?\?[^"']+/gi) || [];
  const googleFonts: string[] = [];
  for (const url of googleFontMatches) {
    // Extract all family= parameters (can have multiple)
    const familyMatches = url.matchAll(/family=([^&:]+)/gi);
    for (const m of familyMatches) {
      const font = decodeURIComponent(m[1]).replace(/\+/g, ' ');
      if (font && !googleFonts.includes(font)) {
        googleFonts.push(font);
      }
    }
  }
  console.log(`[extractBrandAssets] Google Fonts found: ${googleFonts.join(', ') || 'none'}`);
  
  // Method 2: CSS Variables for fonts
  const fontVarPatterns = [
    /--font-(?:heading|title|display|h1):\s*["']?([^;,"'\}]+)/i,
    /--heading-font:\s*["']?([^;,"'\}]+)/i,
    /--font-(?:body|text|base|sans):\s*["']?([^;,"'\}]+)/i,
    /--body-font:\s*["']?([^;,"'\}]+)/i,
  ];
  
  for (const pattern of fontVarPatterns) {
    const match = html.match(pattern);
    if (match) {
      const font = match[1].trim().split(',')[0].replace(/["']/g, '').trim();
      const isGeneric = ['system-ui', 'sans-serif', 'serif', 'monospace', 'inherit', 'ui-sans-serif'].includes(font.toLowerCase());
      if (!isGeneric && font.length > 0) {
        if (pattern.source.includes('heading') || pattern.source.includes('title') || pattern.source.includes('display') || pattern.source.includes('h1')) {
          if (!headingFont) headingFont = font;
        } else {
          if (!bodyFont) bodyFont = font;
        }
        console.log(`[extractBrandAssets] CSS var font: ${font}`);
      }
    }
  }
  
  // Method 3: font-family in style tags for body/html/h1
  const styleTagMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
  const allStyles = styleTagMatch.join('\n');
  
  // Look for h1/h2/h3 font
  const headingStylePatterns = [
    /h1[^{]*\{[^}]*font-family:\s*["']?([^;,"'\}]+)/is,
    /h2[^{]*\{[^}]*font-family:\s*["']?([^;,"'\}]+)/is,
    /\.heading[^{]*\{[^}]*font-family:\s*["']?([^;,"'\}]+)/is,
  ];
  for (const pattern of headingStylePatterns) {
    if (headingFont) break;
    const match = allStyles.match(pattern);
    if (match) {
      const font = match[1].trim().split(',')[0].replace(/["']/g, '').trim();
      const isGeneric = ['system-ui', 'sans-serif', 'serif', 'monospace', 'inherit'].includes(font.toLowerCase());
      if (!isGeneric && font.length > 0) {
        headingFont = font;
        console.log(`[extractBrandAssets] Heading style font: ${font}`);
      }
    }
  }
  
  // Look for body/html font
  const bodyStylePatterns = [
    /body[^{]*\{[^}]*font-family:\s*["']?([^;,"'\}]+)/is,
    /html[^{]*\{[^}]*font-family:\s*["']?([^;,"'\}]+)/is,
    /:root[^{]*\{[^}]*font-family:\s*["']?([^;,"'\}]+)/is,
  ];
  for (const pattern of bodyStylePatterns) {
    if (bodyFont) break;
    const match = allStyles.match(pattern);
    if (match) {
      const font = match[1].trim().split(',')[0].replace(/["']/g, '').trim();
      const isGeneric = ['system-ui', 'sans-serif', 'serif', 'monospace', 'inherit'].includes(font.toLowerCase());
      if (!isGeneric && font.length > 0) {
        bodyFont = font;
        console.log(`[extractBrandAssets] Body style font: ${font}`);
      }
    }
  }
  
  // Method 4: @font-face declarations
  const fontFaceMatches = html.matchAll(/@font-face\s*\{[^}]*font-family:\s*["']?([^;,"'\}]+)/gi);
  const fontFaceFonts: string[] = [];
  for (const m of fontFaceMatches) {
    const font = m[1].trim().replace(/["']/g, '');
    if (font && !fontFaceFonts.includes(font)) {
      fontFaceFonts.push(font);
    }
  }
  if (fontFaceFonts.length > 0) {
    console.log(`[extractBrandAssets] @font-face fonts: ${fontFaceFonts.join(', ')}`);
  }
  
  // Method 5: Tailwind font classes in common patterns
  const tailwindFontMatch = html.match(/font-\[['"]?([^'"\]]+)['"]?\]/);
  if (tailwindFontMatch) {
    const font = tailwindFontMatch[1].replace(/_/g, ' ');
    if (!bodyFont) bodyFont = font;
    console.log(`[extractBrandAssets] Tailwind font: ${font}`);
  }
  
  // Fallback to Google Fonts if no specific fonts found
  if (!headingFont && googleFonts.length > 0) {
    headingFont = googleFonts[0];
    console.log(`[extractBrandAssets] Using Google Font for heading: ${headingFont}`);
  }
  if (!bodyFont && googleFonts.length > 1) {
    bodyFont = googleFonts[1];
    console.log(`[extractBrandAssets] Using Google Font for body: ${bodyFont}`);
  } else if (!bodyFont && googleFonts.length > 0) {
    bodyFont = googleFonts[0];
  }
  
  // Last resort: @font-face fonts
  if (!headingFont && fontFaceFonts.length > 0) {
    headingFont = fontFaceFonts[0];
  }
  if (!bodyFont && fontFaceFonts.length > 0) {
    bodyFont = fontFaceFonts[fontFaceFonts.length > 1 ? 1 : 0];
  }
  
  console.log(`[extractBrandAssets] Final fonts - Heading: ${headingFont || 'none'}, Body: ${bodyFont || 'none'}`);

  // OG Image
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  const ogImage = ogImageMatch ? resolveUrl(ogImageMatch[1]) : null;

  // Language
  const langMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i);
  const languages = langMatch ? langMatch[1] : 'en';

  console.log(`[extractBrandAssets] domain_name: ${domainName}, logo: ${logoLightUrl || 'none'}, favicon: ${faviconLightUrl || 'none'}`);
  
  // Note: primary_color, secondary_color, heading_font, body_font removed from DB
  return {
    domain_name: domainName,
    og_image: ogImage,
    logo_url: logoLightUrl,  // Simplified: single logo field
    favicon_url: faviconLightUrl,  // Simplified: single favicon field
    languages,
  };
}

/**
 * Extract header HTML using multiple strategies
 * Handles both traditional HTML and SPA frameworks (React, Next.js, Vue)
 */
function extractHeaderHtmlContent(html: string): string {
  // Strategy 1: Match <header> tag with greedy matching for nested content
  const headerRegex = /<header[^>]*>[\s\S]*?<\/header>/gi;
  const headerMatches = html.match(headerRegex);
  
  if (headerMatches && headerMatches.length > 0) {
    // Find the longest header match (likely the main header)
    const longestHeader = headerMatches.reduce((a, b) => a.length > b.length ? a : b);
    if (longestHeader.length > 100) {
      console.log(`[extractHeaderHtmlContent] Found header tag: ${longestHeader.length} chars`);
      return longestHeader;
    }
  }
  
  // Strategy 2: Look for nav inside a container with header-like attributes
  const navContainerRegex = /<(?:div|section)[^>]*(?:class|id)="[^"]*(?:header|navbar|nav-bar|top-bar)[^"]*"[^>]*>[\s\S]*?<nav[^>]*>[\s\S]*?<\/nav>[\s\S]*?<\/(?:div|section)>/gi;
  const navContainerMatches = html.match(navContainerRegex);
  
  if (navContainerMatches && navContainerMatches.length > 0) {
    const longestNavContainer = navContainerMatches.reduce((a, b) => a.length > b.length ? a : b);
    if (longestNavContainer.length > 100) {
      console.log(`[extractHeaderHtmlContent] Found nav container: ${longestNavContainer.length} chars`);
      return longestNavContainer;
    }
  }
  
  // Strategy 3: Match standalone <nav> tag
  const navRegex = /<nav[^>]*>[\s\S]*?<\/nav>/gi;
  const navMatches = html.match(navRegex);
  
  if (navMatches && navMatches.length > 0) {
    // Find the nav with most links (likely the main navigation)
    const navWithMostLinks = navMatches.reduce((best, current) => {
      const currentLinks = (current.match(/<a[^>]*>/gi) || []).length;
      const bestLinks = (best.match(/<a[^>]*>/gi) || []).length;
      return currentLinks > bestLinks ? current : best;
    });
    if (navWithMostLinks.length > 50) {
      console.log(`[extractHeaderHtmlContent] Found nav tag: ${navWithMostLinks.length} chars`);
      return navWithMostLinks;
    }
  }
  
  // Strategy 4: Look for role="banner" (ARIA landmark for header)
  const bannerRegex = /<[^>]*role=["']banner["'][^>]*>[\s\S]*?<\/[^>]+>/gi;
  const bannerMatches = html.match(bannerRegex);
  
  if (bannerMatches && bannerMatches.length > 0) {
    const longestBanner = bannerMatches.reduce((a, b) => a.length > b.length ? a : b);
    if (longestBanner.length > 100) {
      console.log(`[extractHeaderHtmlContent] Found banner role: ${longestBanner.length} chars`);
      return longestBanner;
    }
  }
  
  // Strategy 5: Look for navigation role (ARIA)
  const navRoleRegex = /<[^>]*role=["']navigation["'][^>]*>[\s\S]*?<\/[^>]+>/gi;
  const navRoleMatches = html.match(navRoleRegex);
  
  if (navRoleMatches && navRoleMatches.length > 0) {
    const navWithMostLinks = navRoleMatches.reduce((best, current) => {
      const currentLinks = (current.match(/<a[^>]*>/gi) || []).length;
      const bestLinks = (best.match(/<a[^>]*>/gi) || []).length;
      return currentLinks > bestLinks ? current : best;
    });
    if (navWithMostLinks.length > 50) {
      console.log(`[extractHeaderHtmlContent] Found navigation role: ${navWithMostLinks.length} chars`);
      return navWithMostLinks;
    }
  }
  
  // Strategy 6: Look for common header class patterns (for SPA without semantic tags)
  const headerClassPatterns = [
    /class="[^"]*(?:site-header|main-header|page-header|top-header|fixed-header|sticky-header)[^"]*"/i,
    /class="[^"]*(?:navbar|nav-wrapper|navigation-wrapper|menu-wrapper)[^"]*"/i,
  ];
  
  for (const pattern of headerClassPatterns) {
    const match = html.match(pattern);
    if (match) {
      // Find the containing element
      const matchIndex = html.indexOf(match[0]);
      // Look backwards for the opening tag
      let tagStart = matchIndex;
      while (tagStart > 0 && html[tagStart] !== '<') {
        tagStart--;
      }
      // Extract a reasonable chunk around this element (up to 5000 chars)
      const chunk = html.substring(tagStart, tagStart + 5000);
      const linksInChunk = (chunk.match(/<a[^>]*href[^>]*>/gi) || []).length;
      if (linksInChunk >= 3) {
        console.log(`[extractHeaderHtmlContent] Found header class pattern: ${chunk.length} chars, ${linksInChunk} links`);
        return chunk;
      }
    }
  }
  
  // Strategy 7: Extract navigation links from page top (first section with multiple internal links)
  // This handles SPAs that don't use semantic HTML
  const bodyStart = html.toLowerCase().indexOf('<body');
  if (bodyStart !== -1) {
    const bodyContent = html.substring(bodyStart);
    
    // Find internal links (href starting with / or #, not http)
    const internalLinkRegex = /<a[^>]*href=["'](?:\/[^"']*|#[^"']*)["'][^>]*>[^<]*<\/a>/gi;
    const allInternalLinks = bodyContent.match(internalLinkRegex) || [];
    
    if (allInternalLinks.length >= 3) {
      // Find the first cluster of links (likely the navigation)
      const firstLink = bodyContent.indexOf(allInternalLinks[0]!);
      const fifthLink = allInternalLinks.length >= 5 
        ? bodyContent.indexOf(allInternalLinks[4]!) 
        : bodyContent.indexOf(allInternalLinks[allInternalLinks.length - 1]!);
      
      // Extract the section containing these links (with some padding)
      const startIndex = Math.max(0, firstLink - 500);
      const endIndex = Math.min(bodyContent.length, fifthLink + 1000);
      const navSection = bodyContent.substring(startIndex, endIndex);
      
      console.log(`[extractHeaderHtmlContent] Found internal link cluster: ${navSection.length} chars, ${allInternalLinks.length} links`);
      return navSection;
    }
  }
  
  // Strategy 8: Extract from top portion of body (first 15000 chars after <body>)
  if (bodyStart !== -1) {
    const bodyContent = html.substring(bodyStart, bodyStart + 15000);
    const linksInTop = (bodyContent.match(/<a[^>]*href[^>]*>/gi) || []).length;
    if (linksInTop > 3) {
      console.log(`[extractHeaderHtmlContent] Using top body section: ${bodyContent.length} chars, ${linksInTop} links`);
      return bodyContent;
    }
  }
  
  console.log(`[extractHeaderHtmlContent] No header found`);
  return '';
}

async function extractHeader(html: string, origin: string, logoUrl?: string | null, siteName?: string): Promise<any> {
  const headerHtml = extractHeaderHtmlContent(html);

  if (!headerHtml || headerHtml.length < 50) {
    return { success: false, error: 'No header/nav found' };
  }
  
  console.log(`[extractHeader] Processing header HTML: ${headerHtml.length} chars`);

  try {
    const aiPrompt = `Analyze this website header HTML and extract the navigation structure.

IMPORTANT: 
- For dropdown menus, use the parent link URL or the first child's URL. Never return null for URL.
- Only include top-level navigation items (flatten dropdowns to their parent).
- Extract the CTA button (usually styled differently, like "Get Started", "Sign Up", "Try Free").

Return ONLY valid JSON:
{
  "siteName": "Site name (use "${siteName || 'Site'}" if not found)",
  "navigation": [{"label": "Link text", "url": "/valid-url"}],
  "ctaButton": {"label": "CTA text", "url": "CTA URL", "color": "#hex"} or null,
  "primaryColor": "#hex color from the header/CTA button" or null,
  "headingFont": "Font family name" or null
}

Header HTML:
${headerHtml.substring(0, 4000)}`;

    const { text } = await generateText({
      model: azure(process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1'),
      messages: [
        { role: 'system', content: 'Extract navigation structure from HTML. Return valid JSON only. Never return null for URL - use "#" if no URL found.' },
        { role: 'user', content: aiPrompt },
      ],
      temperature: 0,
    });

    const parsed = JSON.parse(
      text.trim().replace(/```json\n?/g, '').replace(/```\n?$/g, '')
    );

    // Filter out navigation items with null/empty URLs, and flatten any with children
    const cleanNavigation = (parsed.navigation || [])
      .map((item: any) => {
        // If item has children but no URL, use first child's URL or "#"
        if (!item.url && item.children?.length > 0) {
          return { label: item.label, url: item.children[0].url || '#' };
        }
        return { label: item.label, url: item.url || '#' };
      })
      .filter((item: any) => item.label && item.url)
      .slice(0, 10);

    // Use passed logoUrl and siteName, fallback to AI-extracted values
    const headerConfig: HeaderConfig = {
      siteName: siteName || parsed.siteName || '',
      logo: logoUrl || '',  // Use the logo we already extracted
      navigation: cleanNavigation,
      ctaButton: parsed.ctaButton,
    };

    console.log(`[extractHeader] Using logo: ${headerConfig.logo || 'none'}, siteName: ${headerConfig.siteName}, nav items: ${cleanNavigation.length}`);
    const generatedHtml = generateHeaderHTML(headerConfig);

    return {
      success: true,
      config: headerConfig,
      html: generatedHtml,
      // Return extracted colors/fonts for brand assets
      extractedAssets: {
        primaryColor: parsed.primaryColor,
        headingFont: parsed.headingFont,
      },
    };
  } catch (err: any) {
    console.error('[extractHeader] AI analysis failed:', err);
    return { success: false, error: err.message };
  }
}

async function extractFooter(html: string, origin: string, logoUrl?: string | null, siteName?: string): Promise<any> {
  const footerMatch = html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i);
  let footerHtml = footerMatch ? footerMatch[0] : '';

  if (!footerHtml || footerHtml.length < 100) {
    const bodyEnd = html.toLowerCase().lastIndexOf('</body>');
    const start = Math.max(0, (bodyEnd > 0 ? bodyEnd : html.length) - 8000);
    footerHtml = html.substring(start, bodyEnd > 0 ? bodyEnd : html.length);
  }

  try {
    const aiPrompt = `Analyze this website footer HTML and extract the structure.

IMPORTANT:
- All URLs must be valid (not null). Use "#" if a URL is missing.
- Extract background color and text color from the footer styles.

Return ONLY valid JSON:
{
  "companyName": "Company name",
  "tagline": "Tagline or description",
  "columns": [
    {
      "title": "Column title",
      "links": [{"label": "Link text", "url": "/valid-url"}]
    }
  ],
  "socialMedia": [
    {"platform": "twitter|facebook|linkedin|github|instagram", "url": "URL"}
  ],
  "copyright": "Copyright text",
  "backgroundColor": "#hex background color" or null,
  "textColor": "#hex text color" or null
}

Footer HTML:
${footerHtml.substring(0, 8000)}`;

    const { text } = await generateText({
      model: azure(process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1'),
      messages: [
        { role: 'system', content: 'Extract footer structure from HTML. Return valid JSON only. Never return null for URL - use "#" if no URL found.' },
        { role: 'user', content: aiPrompt },
      ],
      temperature: 0,
    });

    const parsed = JSON.parse(
      text.trim().replace(/```json\n?/g, '').replace(/```\n?$/g, '')
    );

    // Clean up columns - ensure all links have valid URLs
    const cleanColumns = (parsed.columns || []).map((col: any) => ({
      title: col.title || '',
      links: (col.links || [])
        .map((link: any) => ({ label: link.label || '', url: link.url || '#' }))
        .filter((link: any) => link.label),
    })).filter((col: any) => col.title && col.links.length > 0);

    // Use passed logoUrl and siteName, fallback to AI-extracted values
    const footerConfig: FooterConfig = {
      companyName: siteName || parsed.companyName || '',
      tagline: parsed.tagline || '',
      logo: logoUrl || '',  // Use the logo we already extracted
      columns: cleanColumns,
      socialMedia: (parsed.socialMedia || []).filter((s: any) => 
        s.platform && s.url && ['twitter', 'facebook', 'linkedin', 'github', 'instagram'].includes(s.platform)
      ),
      copyright: parsed.copyright || '',
    };

    console.log(`[extractFooter] Using logo: ${footerConfig.logo || 'none'}, companyName: ${footerConfig.companyName}, columns: ${cleanColumns.length}`);
    const generatedHtml = generateFooterHTML(footerConfig);

    return {
      success: true,
      config: footerConfig,
      html: generatedHtml,
      // Return extracted colors for brand assets
      extractedAssets: {
        backgroundColor: parsed.backgroundColor,
        textColor: parsed.textColor,
      },
    };
  } catch (err: any) {
    console.error('[extractFooter] AI analysis failed:', err);
    return { success: false, error: err.message };
  }
}

async function saveBrandAssets(
  userId: string, 
  projectId: string | undefined, 
  data: any, 
  mode: string, 
  existing: any
): Promise<void> {
  const updateData: any = {
    user_id: userId,
    seo_project_id: projectId || null,
    type: 'logo',
    updated_at: new Date().toISOString(),
  };

  // For incremental mode, only update empty fields
  // For full mode, update all fields
  const shouldUpdate = (key: string) => {
    if (mode === 'full') return true;
    // Check both new and legacy field names
    const legacyKey = key.replace('_url', '_light_url');
    return !existing[key] && !existing[legacyKey] && (key !== 'logo_url' || !existing['file_url']);
  };

  // Simplified fields (single logo_url and favicon_url)
  if (shouldUpdate('domain_name') && data.domain_name) {
    updateData.domain_name = data.domain_name;
    console.log(`[saveBrandAssets] Setting domain_name: ${data.domain_name}`);
  }
  if (shouldUpdate('og_image') && data.og_image) {
    updateData.og_image = data.og_image;
  }
  if (shouldUpdate('logo_url') && data.logo_url) {
    updateData.logo_url = data.logo_url;
    // Also update legacy fields for compatibility
    updateData.logo_light_url = data.logo_url;
    console.log(`[saveBrandAssets] Setting logo_url: ${data.logo_url}`);
  }
  if (shouldUpdate('favicon_url') && data.favicon_url) {
    updateData.favicon_url = data.favicon_url;
    // Also update legacy fields for compatibility
    updateData.favicon_light_url = data.favicon_url;
  }
  // Note: primary_color, secondary_color, heading_font, body_font columns removed from DB
  if (shouldUpdate('languages') && data.languages) {
    updateData.languages = data.languages;
  }

  console.log(`[saveBrandAssets] Saving:`, Object.keys(updateData).filter(k => !['user_id', 'seo_project_id', 'type', 'updated_at'].includes(k)));

  const { error } = await supabase
    .from('site_contexts')
    .upsert(updateData, { onConflict: 'user_id,seo_project_id,type' });

  if (error) {
    console.error('[saveBrandAssets] Error:', error);
    throw error;
  }
}

async function saveHeaderFooter(
  userId: string, 
  projectId: string | undefined, 
  type: 'header' | 'footer',
  config: any,
  html: string
): Promise<void> {
  const upsertData = {
    user_id: userId,
    seo_project_id: projectId || null,
    type,
    content: JSON.stringify(config),
    html,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('site_contexts')
    .upsert(upsertData, { onConflict: 'user_id,seo_project_id,type' });

  if (error) {
    console.error(`[saveHeaderFooter] Error saving ${type}:`, error);
    throw error;
  }
}
