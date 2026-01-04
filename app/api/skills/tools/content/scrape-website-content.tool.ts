import { tool } from 'ai';
import { z } from 'zod';

export const scrape_website_content = tool({
  description: `Scrape and analyze website content to extract comprehensive site context information.
  
This tool fetches a website's HTML and extracts:
- Brand colors (from CSS and inline styles)
- Logo URLs (from img tags and CSS backgrounds)
- Hero section content (headline, subheadline, CTA)
- Product/service descriptions
- Company information (About Us, Mission, Values)
- Social proof (testimonials, case studies, awards)
- Contact information (email, phone, address)
- FAQ content
- Team/leadership information

Use this to automatically populate site context for content generation.`,
  parameters: z.object({
    url: z.string().describe('The website URL to scrape (e.g., https://example.com)'),
    sections: z.array(z.enum([
      'all',
      'brand-colors',
      'logo',
      'hero',
      'products',
      'about',
      'social-proof',
      'contact',
      'faq',
      'team'
    ])).optional().describe('Specific sections to extract. If not provided or "all", extracts everything.')
  }),
  execute: async ({ url, sections = ['all'] }) => {
    try {
      console.log(`[scrape_website_content] Scraping ${url}...`);
      
      // Fetch the webpage
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to fetch website: ${response.status} ${response.statusText}`,
          url
        };
      }

      const html = await response.text();
      
      // STRATEGY: 
      // 1. Extract structured data from <head> with regex (meta tags, title, etc.)
      // 2. Extract full page text from <body> for AI analysis
      
      const extractedData: any = {
        url,
        scrapedAt: new Date().toISOString()
      };

      // === REGEX EXTRACTION: Only for <head> structured data ===
      extractedData.metadata = extractMetadata(html);
      extractedData.colors = extractColors(html);
      extractedData.logo = extractLogo(html, url);
      extractedData.contact = extractContactInfo(html); // Email/phone are simple regex

      // === FULL PAGE TEXT for AI ===
      // Extract and clean the entire page text for AI to analyze
      extractedData.fullPageText = extractFullPageText(html);

      return {
        success: true,
        url,
        data: extractedData,
        message: `Successfully scraped ${url}. Ready for AI analysis.`,
        extractedSections: ['metadata', 'colors', 'logo', 'contact', 'fullPageText']
      };

    } catch (error: any) {
      console.error('[scrape_website_content] Error:', error);
      return {
        success: false,
        error: `Scraping error: ${error.message}`,
        url
      };
    }
  }
});

// Helper functions for extraction

// === METADATA EXTRACTION (from <head>) ===
function extractMetadata(html: string): any {
  const metadata: any = {};

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    metadata.title = cleanText(titleMatch[1]);
  }

  // Extract meta description
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  if (descMatch) {
    metadata.description = descMatch[1];
  }

  // Extract OG tags
  const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
  if (ogTitleMatch) {
    metadata.ogTitle = ogTitleMatch[1];
  }

  const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
  if (ogDescMatch) {
    metadata.ogDescription = ogDescMatch[1];
  }

  const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
  if (ogImageMatch) {
    metadata.ogImage = ogImageMatch[1];
  }

  // Extract favicon
  const faviconMatch = html.match(/<link\s+rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i);
  if (faviconMatch) {
    metadata.favicon = faviconMatch[1];
  }

  return metadata;
}

function extractColors(html: string): any {
  const colors: any = {
    primary: null,
    secondary: null,
    detected: []
  };

  // Extract hex colors from CSS and inline styles
  const hexColorRegex = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g;
  const matches = html.match(hexColorRegex);
  
  if (matches) {
    // Deduplicate and normalize
    const uniqueColors = [...new Set(matches)].map(c => c.toUpperCase());
    colors.detected = uniqueColors.slice(0, 10); // Top 10 colors
    
    // Try to identify primary (most common non-white/black)
    const filtered = uniqueColors.filter(c => 
      c !== '#FFFFFF' && c !== '#FFF' && 
      c !== '#000000' && c !== '#000' &&
      c !== '#EEEEEE' && c !== '#EEE'
    );
    
    if (filtered.length > 0) {
      colors.primary = filtered[0];
      if (filtered.length > 1) {
        colors.secondary = filtered[1];
      }
    }
  }

  return colors;
}

function extractLogo(html: string, baseUrl: string): any {
  const logos: string[] = [];
  
  // Look for common logo patterns
  const logoPatterns = [
    /<img[^>]*class="[^"]*logo[^"]*"[^>]*src="([^"]+)"/gi,
    /<img[^>]*src="([^"]+)"[^>]*class="[^"]*logo[^"]*"/gi,
    /<img[^>]*alt="[^"]*logo[^"]*"[^>]*src="([^"]+)"/gi,
    /<img[^>]*src="([^"]+)"[^>]*alt="[^"]*logo[^"]*"/gi,
  ];

  for (const pattern of logoPatterns) {
    const matches = [...html.matchAll(pattern)];
    for (const match of matches) {
      let logoUrl = match[1];
      // Convert relative URLs to absolute
      if (logoUrl.startsWith('/')) {
        const url = new URL(baseUrl);
        logoUrl = `${url.protocol}//${url.host}${logoUrl}`;
      } else if (!logoUrl.startsWith('http')) {
        logoUrl = new URL(logoUrl, baseUrl).href;
      }
      logos.push(logoUrl);
    }
  }

  return {
    urls: [...new Set(logos)],
    primary: logos[0] || null
  };
}

function extractContactInfo(html: string): any {
  const contact: any = {};

  // Extract email
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const emails = [...new Set([...html.matchAll(emailRegex)].map(m => m[1]))];
  if (emails.length > 0) {
    contact.email = emails.filter(e => !e.includes('example.com'))[0] || emails[0];
  }

  // Extract phone
  const phoneRegex = /(?:tel:|phone:?\s*)?(\+?[\d\s\-\(\)]{10,20})/gi;
  const phones = [...html.matchAll(phoneRegex)].map(m => m[1].trim());
  if (phones.length > 0) {
    contact.phone = phones[0];
  }

  return contact;
}

// === FULL PAGE TEXT EXTRACTION (for AI) ===
function extractFullPageText(html: string): string {
  // Extract body content only (skip head, scripts, styles)
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyHtml = bodyMatch ? bodyMatch[1] : html;

  // Clean and extract text
  const cleaned = cleanText(bodyHtml);

  // Return first 8000 characters (enough for comprehensive AI analysis)
  // This gives AI full context of the page
  return cleaned.substring(0, 8000);
}

function cleanText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
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

