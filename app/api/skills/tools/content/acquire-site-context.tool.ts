import { tool } from 'ai';
import { z } from 'zod';
import { generateText } from 'ai';
import { createAzure } from '@ai-sdk/azure';
import { generateHeaderHTML, HeaderConfig } from '@/lib/templates/default-header';
import { generateFooterHTML, FooterConfig } from '@/lib/templates/default-footer';
import { createServerSupabaseAdmin } from '@/lib/supabase-server';

const supabase = createServerSupabaseAdmin();

const azure = createAzure({
  apiKey: process.env.AZURE_OPENAI_API_KEY || '',
  resourceName: process.env.AZURE_OPENAI_ENDPOINT?.replace('https://', '').replace('.openai.azure.com', '') || '',
});

// Simplified field types
type ContextField = 'brand-assets' | 'header' | 'footer' | 'all';

// Cache for scraped data
const scrapedDataCache: Map<string, { html: string; text: string; timestamp: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Simplified Site Context Acquisition Tool
 * 
 * Only extracts what's needed for page generation:
 * - brand-assets: domain, logo, favicon, colors, fonts, og-image, languages
 * - header: navigation structure + generated HTML
 * - footer: footer structure + generated HTML
 */
export const acquire_site_context = tool({
  description: `Crawl a website and extract site context for page generation.

Extracts these fields:
- **brand-assets**: domain_name, og_image, logo (light/dark), favicon (light/dark), colors (primary/secondary), fonts (heading/body), languages
- **header**: Navigation structure and generates header HTML
- **footer**: Footer structure and generates footer HTML
- **all**: Extract all of the above in one call (recommended)

The tool will:
1. Fetch the homepage HTML using web scraping
2. Extract relevant data using regex + AI analysis
3. Save to database with both JSON config and generated HTML (for header/footer)

Use this BEFORE page generation to ensure site contexts are available.`,

  parameters: z.object({
    url: z.string().describe('Website URL to crawl (e.g., https://example.com)'),
    field: z.enum(['brand-assets', 'header', 'footer', 'all']).describe('Which field(s) to extract. Use "all" to get everything.'),
    userId: z.string().describe('User ID for database save'),
    projectId: z.string().describe('Project ID for database save'),
  }),

  execute: async ({ url, field, userId, projectId }) => {
    const startTime = Date.now();
    console.log(`[acquire_site_context] 🎯 Acquiring ${field} from ${url}`);

    try {
      // Normalize URL
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      const origin = new URL(fullUrl).origin;
      const domainName = new URL(fullUrl).hostname.replace('www.', '');

      // Fetch homepage HTML
      const pageData = await getPageData(origin);
      if (!pageData.success || !pageData.html) {
        return {
          success: false,
          error: `Failed to fetch ${origin}: ${pageData.error}`,
          message: `❌ Could not access the website. Please check the URL.`
        };
      }

      const results: Record<string, any> = {};
      const fieldsToProcess = field === 'all' 
        ? ['brand-assets', 'header', 'footer'] 
        : [field];

      for (const f of fieldsToProcess) {
        console.log(`[acquire_site_context] Processing: ${f}`);
        
        switch (f) {
          case 'brand-assets':
            results['brand-assets'] = await extractAndSaveBrandAssets(
              pageData.html, origin, domainName, userId, projectId
            );
            break;
          case 'header':
            results['header'] = await extractAndSaveHeader(
              pageData.html, origin, userId, projectId
            );
            break;
          case 'footer':
            results['footer'] = await extractAndSaveFooter(
              pageData.html, origin, userId, projectId
            );
            break;
        }
      }

      const duration = Date.now() - startTime;
      console.log(`[acquire_site_context] ✅ Completed in ${duration}ms`);

      return {
        success: true,
        url: origin,
        fields: fieldsToProcess,
        results,
        duration: `${duration}ms`,
        message: `✅ Successfully extracted ${fieldsToProcess.join(', ')} from ${domainName}`
      };

    } catch (error: any) {
      console.error(`[acquire_site_context] ❌ Error:`, error);
      return {
        success: false,
        error: error.message,
        message: `❌ Failed to acquire context: ${error.message}`
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

// ========== Brand Assets Extraction ==========

async function extractAndSaveBrandAssets(
  html: string, 
  origin: string, 
  domainName: string,
  userId: string, 
  projectId: string
): Promise<any> {
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
    url = decodeHtmlEntities(url);
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('/')) return origin + url;
    if (url.startsWith('http')) return url;
    return origin + '/' + url;
  };

  // === Logo Extraction ===
  const logoPatterns = [
    /<img[^>]*class="[^"]*logo[^"]*"[^>]*src=["']([^"']+)["']/gi,
    /<img[^>]*src=["']([^"']+)["'][^>]*class="[^"]*logo[^"]*"/gi,
    /<a[^>]*class="[^"]*logo[^"]*"[^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/gi,
    /<img[^>]*alt="[^"]*logo[^"]*"[^>]*src=["']([^"']+)["']/gi,
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

  // Dark logo variant
  const darkLogoMatch = html.match(/data-dark-src=["']([^"']+)["']/i) ||
                        html.match(/class="[^"]*logo[^"]*dark[^"]*"[^>]*src=["']([^"']+)["']/i);
  const logoDarkUrl = darkLogoMatch ? resolveUrl(darkLogoMatch[1]) : null;

  // === Favicon Extraction ===
  const faviconPatterns = [
    /<link[^>]*rel=["']icon["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*rel=["']shortcut icon["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']icon["']/i,
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

  // === Colors Extraction ===
  let primaryColor = null;
  let secondaryColor = null;
  
  // CSS variables first
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
  
  // Fallback to common hex colors
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

  // === Font Extraction (Multiple Methods) ===
  let headingFont: string | null = null;
  let bodyFont: string | null = null;
  
  const isGenericFont = (font: string) => {
    const generics = ['system-ui', 'sans-serif', 'serif', 'monospace', 'inherit', 'ui-sans-serif', 'cursive', 'fantasy'];
    return generics.includes(font.toLowerCase());
  };
  
  // Method 1: Google Fonts URL
  const googleFontMatches = html.match(/fonts\.googleapis\.com\/css2?\?[^"']+/gi) || [];
  const googleFonts: string[] = [];
  for (const url of googleFontMatches) {
    const familyMatches = url.matchAll(/family=([^&:]+)/gi);
    for (const m of familyMatches) {
      const font = decodeURIComponent(m[1]).replace(/\+/g, ' ');
      if (font && !googleFonts.includes(font)) {
        googleFonts.push(font);
      }
    }
  }
  console.log(`[acquire_site_context] Google Fonts: ${googleFonts.join(', ') || 'none'}`);
  
  // Method 2: CSS Variables
  const fontVarPatterns = [
    { pattern: /--font-(?:heading|title|display|h1):\s*["']?([^;,"'\}]+)/i, type: 'heading' },
    { pattern: /--heading-font:\s*["']?([^;,"'\}]+)/i, type: 'heading' },
    { pattern: /--font-(?:body|text|base|sans):\s*["']?([^;,"'\}]+)/i, type: 'body' },
    { pattern: /--body-font:\s*["']?([^;,"'\}]+)/i, type: 'body' },
  ];
  
  for (const { pattern, type } of fontVarPatterns) {
    const match = html.match(pattern);
    if (match) {
      const font = match[1].trim().split(',')[0].replace(/["']/g, '').trim();
      if (!isGenericFont(font) && font.length > 0) {
        if (type === 'heading' && !headingFont) headingFont = font;
        if (type === 'body' && !bodyFont) bodyFont = font;
      }
    }
  }
  
  // Method 3: CSS rules in <style> tags
  const styleTagMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
  const allStyles = styleTagMatch.join('\n');
  
  // Heading fonts from h1/h2/h3
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
      if (!isGenericFont(font) && font.length > 0) {
        headingFont = font;
      }
    }
  }
  
  // Body fonts from body/html/:root
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
      if (!isGenericFont(font) && font.length > 0) {
        bodyFont = font;
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
  
  // Fallbacks
  if (!headingFont && googleFonts.length > 0) headingFont = googleFonts[0];
  if (!bodyFont && googleFonts.length > 1) bodyFont = googleFonts[1];
  else if (!bodyFont && googleFonts.length > 0) bodyFont = googleFonts[0];
  
  if (!headingFont && fontFaceFonts.length > 0) headingFont = fontFaceFonts[0];
  if (!bodyFont && fontFaceFonts.length > 0) bodyFont = fontFaceFonts[fontFaceFonts.length > 1 ? 1 : 0];
  
  console.log(`[acquire_site_context] Final fonts - Heading: ${headingFont || 'none'}, Body: ${bodyFont || 'none'}`);

  // === OG Image ===
  const ogImagePatterns = [
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
  ];
  let ogImage = null;
  for (const p of ogImagePatterns) {
    const m = html.match(p);
    if (m) { ogImage = resolveUrl(m[1]); break; }
  }

  // === Language ===
  const langMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i);
  const languages = langMatch ? langMatch[1] : 'en';

  // === Save to Database ===
  const brandAssets = {
    domain_name: domainName,
    og_image: ogImage,
    logo_light_url: logoLightUrl,
    logo_dark_url: logoDarkUrl,
    favicon_light_url: faviconLightUrl,
    favicon_dark_url: null,
    primary_color: primaryColor,
    secondary_color: secondaryColor,
    heading_font: headingFont,
    body_font: bodyFont,
    languages,
  };

  await saveBrandAssetsToDb(userId, projectId, brandAssets);
  
  return {
    success: true,
    ...brandAssets,
    message: `✅ Brand assets extracted: logo, favicon, colors, fonts`
  };
}

async function saveBrandAssetsToDb(userId: string, projectId: string, data: any): Promise<void> {
  const upsertData = {
    user_id: userId,
    project_id: projectId,
    type: 'logo',
    domain_name: data.domain_name || null,
    og_image: data.og_image || null,
    logo_light_url: data.logo_light_url || null,
    logo_dark_url: data.logo_dark_url || null,
    favicon_light_url: data.favicon_light_url || null,
    favicon_dark_url: data.favicon_dark_url || null,
    primary_color: data.primary_color || null,
    secondary_color: data.secondary_color || null,
    heading_font: data.heading_font || null,
    body_font: data.body_font || null,
    languages: data.languages || 'en',
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('site_contexts')
    .upsert(upsertData, { onConflict: 'user_id,project_id,type' });

  if (error) {
    console.error(`[saveBrandAssetsToDb] Error:`, error);
    throw error;
  }
  
  console.log(`[saveBrandAssetsToDb] ✅ Saved brand assets`);
}

// ========== Header Extraction ==========

async function extractAndSaveHeader(
  html: string, 
  origin: string, 
  userId: string, 
  projectId: string
): Promise<any> {
  const headerMatch = html.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
  const navMatch = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i);
  const headerHtml = headerMatch?.[1] || navMatch?.[1] || '';

  if (!headerHtml || headerHtml.length < 50) {
    return { success: false, error: 'No header/nav found', navigation: [] };
  }

  try {
    // Use AI to analyze header structure with nested dropdown support
    const aiPrompt = `Analyze this website header HTML and extract the COMPLETE navigation structure, including dropdowns.

Return ONLY valid JSON:
{
  "siteName": "Site name (from logo alt or text)",
  "logo": "Logo image URL (if found)",
  "navigation": [
    {"label": "Simple Link", "url": "/path"},
    {"label": "Dropdown Menu", "url": "#", "children": [
      {"label": "Sub Item 1", "url": "/sub-1"},
      {"label": "Sub Item 2", "url": "/sub-2"}
    ]}
  ],
  "ctaButton": {"label": "CTA text", "url": "CTA URL", "color": "#hex or null"}
}

CRITICAL RULES:
- Preserve the EXACT menu structure from the original site
- If a nav item has a dropdown/submenu, include "children" array with sub-items
- If a nav item is a simple link (no dropdown), don't include "children"
- URLs should NOT have .html suffix - use clean paths
- Relative URLs should start with /
- Skip anchor links (#) and javascript: links for leaf items
- Maximum 8 top-level navigation items, max 10 children per dropdown

Header HTML:
${headerHtml.substring(0, 5000)}`;

    const { text } = await generateText({
      model: azure(process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1'),
      messages: [
        { role: 'system', content: 'Extract complete navigation structure from HTML, preserving dropdown menus. Return valid JSON only.' },
        { role: 'user', content: aiPrompt },
      ],
      temperature: 0,
    });

    let parsed = JSON.parse(
      text.trim()
        .replace(/```json\n?/g, '')
        .replace(/```\n?$/g, '')
    );

    // Clean URLs recursively (supports nested children)
    const cleanNavItem = (item: any): any => {
      const cleaned: any = {
        label: item.label || item.text,
        url: cleanUrl(item.url),
      };
      if (item.children && Array.isArray(item.children) && item.children.length > 0) {
        cleaned.children = item.children.map(cleanNavItem).slice(0, 10);
      }
      return cleaned;
    };
    
    if (parsed.navigation) {
      parsed.navigation = parsed.navigation.map(cleanNavItem).slice(0, 8);
    }

    // Build header config
    const headerConfig: HeaderConfig = {
      siteName: parsed.siteName || '',
      logo: parsed.logo || '',
      navigation: parsed.navigation || [],
      ctaButton: parsed.ctaButton ? {
        label: parsed.ctaButton.label || 'Get Started',
        url: parsed.ctaButton.url || '#',
        color: parsed.ctaButton.color || '#3B82F6',
      } : undefined,
    };

    // Generate HTML
    const generatedHtml = generateHeaderHTML(headerConfig);

    // Save to database
    await saveHeaderFooterToDb(userId, projectId, 'header', headerConfig, generatedHtml);

    return {
      success: true,
      config: headerConfig,
      htmlLength: generatedHtml.length,
      message: `✅ Header extracted: ${parsed.navigation?.length || 0} nav items`
    };

  } catch (err: any) {
    console.error('[extractAndSaveHeader] AI analysis failed:', err);
    return { success: false, error: err.message, navigation: [] };
  }
}

// ========== Footer Extraction ==========

async function extractAndSaveFooter(
  html: string, 
  origin: string, 
  userId: string, 
  projectId: string
): Promise<any> {
  // Find footer content
  const footerMatch = html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i);
  let footerHtml = footerMatch ? footerMatch[0] : '';

  if (!footerHtml) {
    const footerDivMatch = html.match(/<div[^>]*class="[^"]*footer[^"]*"[^>]*>([\s\S]*?)<\/div>(?:\s*<\/body>|\s*<\/html>|$)/i);
    if (footerDivMatch) footerHtml = footerDivMatch[0];
  }

  if (!footerHtml || footerHtml.length < 100) {
    // Take last 8000 chars as fallback
    const bodyEnd = html.toLowerCase().lastIndexOf('</body>');
    const start = Math.max(0, (bodyEnd > 0 ? bodyEnd : html.length) - 8000);
    footerHtml = html.substring(start, bodyEnd > 0 ? bodyEnd : html.length);
  }

  try {
    // Use AI to analyze footer structure including background color
    const aiPrompt = `Analyze this website footer HTML and extract the structure.

Return ONLY valid JSON:
{
  "companyName": "Company name",
  "tagline": "Company tagline/description",
  "logo": "Logo URL if found",
  "columns": [
    {
      "title": "Column title (e.g., Products, Company, Resources)",
      "links": [{"label": "Link text", "url": "Link URL"}]
    }
  ],
  "socialMedia": [
    {"platform": "twitter|facebook|linkedin|github|instagram", "url": "URL"}
  ],
  "copyright": "Copyright text",
  "backgroundColor": "CSS background color from footer styles (e.g., #1a1a1a, rgb(26,26,26), or white)",
  "textColor": "CSS text color from footer styles (e.g., #ffffff, #e5e7eb)"
}

Rules:
- Extract ALL navigation columns (most footers have 3-4 columns)
- URLs should NOT have .html suffix
- platform must be one of: twitter, facebook, linkedin, github, instagram
- Keep copyright exactly as shown
- Look for background-color in inline styles, class names like bg-*, or style blocks
- If footer has dark background, use appropriate dark color (#111827, #1f2937, etc.)
- If footer has light background, use white or appropriate light color
- Extract text color to ensure contrast

Footer HTML:
${footerHtml.substring(0, 8000)}`;

    const { text } = await generateText({
      model: azure(process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1'),
      messages: [
        { role: 'system', content: 'Extract footer structure from HTML. Return valid JSON only.' },
        { role: 'user', content: aiPrompt },
      ],
      temperature: 0,
    });

    let parsed = JSON.parse(
      text.trim()
        .replace(/```json\n?/g, '')
        .replace(/```\n?$/g, '')
    );

    // Clean URLs in columns
    if (parsed.columns) {
      parsed.columns = parsed.columns.map((col: any) => ({
        title: col.title,
        links: (col.links || []).map((link: any) => ({
          label: link.label || link.text,
          url: cleanUrl(link.url),
        })),
      }));
    }

    // Build footer config with background color
    const footerConfig: FooterConfig = {
      companyName: parsed.companyName || '',
      tagline: parsed.tagline || '',
      logo: parsed.logo || '',
      columns: parsed.columns || [],
      socialMedia: (parsed.socialMedia || []).filter((s: any) => 
        ['twitter', 'facebook', 'linkedin', 'github', 'instagram'].includes(s.platform)
      ),
      copyright: parsed.copyright || '',
      backgroundColor: parsed.backgroundColor || undefined, // Let template use default if not found
      textColor: parsed.textColor || undefined,
    };

    // Generate HTML
    const generatedHtml = generateFooterHTML(footerConfig);

    // Save to database
    await saveHeaderFooterToDb(userId, projectId, 'footer', footerConfig, generatedHtml);

    return {
      success: true,
      config: footerConfig,
      columnsCount: footerConfig.columns.length,
      htmlLength: generatedHtml.length,
      message: `✅ Footer extracted: ${footerConfig.columns.length} columns, ${footerConfig.socialMedia?.length || 0} social links`
    };

  } catch (err: any) {
    console.error('[extractAndSaveFooter] AI analysis failed:', err);
    return { success: false, error: err.message, columns: [] };
  }
}

async function saveHeaderFooterToDb(
  userId: string, 
  projectId: string, 
  type: 'header' | 'footer',
  config: HeaderConfig | FooterConfig,
  html: string
): Promise<void> {
  const upsertData = {
    user_id: userId,
    project_id: projectId,
    type,
    content: JSON.stringify(config),
    html,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('site_contexts')
    .upsert(upsertData, { onConflict: 'user_id,project_id,type' });

  if (error) {
    console.error(`[saveHeaderFooterToDb] Error saving ${type}:`, error);
    throw error;
  }
  
  console.log(`[saveHeaderFooterToDb] ✅ Saved ${type} (config + HTML)`);
}

// ========== Utilities ==========

function cleanUrl(url: string): string {
  if (!url) return url;
  // Remove .html suffix
  url = url.replace(/\.html?$/i, '');
  // Ensure starts with / for relative URLs
  if (!url.startsWith('http') && !url.startsWith('/') && !url.startsWith('#')) {
    url = '/' + url;
  }
  return url;
}

function cleanText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
