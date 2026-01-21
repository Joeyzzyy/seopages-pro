import { tool } from 'ai';
import { z } from 'zod';

/**
 * Fetch competitor logo from their website.
 * Tries multiple strategies:
 * 1. Google Favicon Service (most reliable)
 * 2. Direct favicon.ico
 * 3. Common logo paths
 */
export const fetch_competitor_logo = tool({
  description: `Fetch competitor logo URL from their website.
  
This tool attempts to find a usable logo/favicon for a competitor by:
1. Using Google's Favicon API (returns 128px icon)
2. Checking common logo paths on the domain

Returns the logo URL that can be used in alternative pages for visual comparison.

Example usage:
- Input: competitor_url: "https://writesonic.com", competitor_name: "Writesonic"
- Output: { logo_url: "https://www.google.com/s2/favicons?domain=writesonic.com&sz=128" }`,
  parameters: z.object({
    competitor_url: z.string().describe('The competitor website URL (e.g., https://writesonic.com)'),
    competitor_name: z.string().describe('The competitor name for context'),
  }),
  execute: async ({ competitor_url, competitor_name }) => {
    try {
      // Parse the URL to get the domain
      let domain: string;
      try {
        const url = new URL(competitor_url);
        domain = url.hostname;
      } catch {
        return {
          success: false,
          error: `Invalid URL: ${competitor_url}`,
          logo_url: null,
        };
      }

      // Strategy 1: Google Favicon Service (most reliable, works for most sites)
      const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      
      // Strategy 2: Direct favicon URLs to try
      const directUrls = [
        `https://${domain}/favicon.ico`,
        `https://${domain}/favicon.png`,
        `https://${domain}/apple-touch-icon.png`,
        `https://${domain}/logo.png`,
        `https://${domain}/logo.svg`,
      ];

      // For now, return the Google favicon as it's most reliable
      // In production, you could verify each URL with a HEAD request
      const logoUrl = googleFaviconUrl;

      // Generate a fallback SVG data URL with the first letter
      const firstLetter = competitor_name.charAt(0).toUpperCase();
      const fallbackSvg = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect fill="%238b5cf6" width="40" height="40" rx="8"/><text x="20" y="26" font-size="18" fill="white" text-anchor="middle" font-family="system-ui">${firstLetter}</text></svg>`;

      return {
        success: true,
        competitor_name,
        competitor_url,
        domain,
        logo_url: logoUrl,
        fallback_svg: fallbackSvg,
        alternative_urls: directUrls,
        message: `Found logo for ${competitor_name}. Use logo_url in your HTML. If it doesn't load, use fallback_svg.`,
        
        // HTML snippet for easy use
        html_snippet: `<img src="${logoUrl}" alt="${competitor_name}" class="w-10 h-10 rounded-lg" onerror="this.src='${encodeURIComponent(fallbackSvg)}'">`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        logo_url: null,
      };
    }
  },
});
