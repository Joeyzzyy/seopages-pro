import { tool } from 'ai';
import { z } from 'zod';

/**
 * Capture website screenshot using ScreenshotMachine API
 * https://www.screenshotmachine.com/
 */
export const capture_website_screenshot = tool({
  description: `Capture a screenshot of a website homepage using ScreenshotMachine API.
  
Returns a URL that can be used directly in <img> tags. The URL is the API endpoint
that returns the screenshot image.

Use this to capture:
- Your brand's homepage
- Competitor's homepage
- Any product page for visual comparison

The screenshots are cached for performance.`,
  parameters: z.object({
    url: z.string().describe('Full URL of the website to screenshot (e.g., https://example.com)'),
    dimension: z.enum(['1366x768', '1920x1080', '1366xfull', '1920xfull']).optional().default('1366x768').describe('Screenshot dimensions. Use "xfull" for full page'),
    device: z.enum(['desktop', 'tablet', 'mobile']).optional().default('desktop').describe('Device type for viewport'),
    delay: z.number().optional().default(2000).describe('Delay in ms before capture (for JS rendering)'),
  }),
  execute: async ({ url, dimension, device, delay }) => {
    try {
      const CUSTOMER_KEY = process.env.SCREENSHOTMACHINE_API_KEY || '7cec4c';
      
      // Build the screenshot URL (this URL returns the image directly)
      const params = new URLSearchParams({
        key: CUSTOMER_KEY,
        url: url,
        dimension: dimension || '1366x768',
        device: device || 'desktop',
        format: 'png',
        cacheLimit: '86400', // Cache for 24 hours
        delay: String(delay || 2000),
        zoom: '100',
      });
      
      const screenshotUrl = `https://api.screenshotmachine.com?${params.toString()}`;
      
      // Extract domain for display
      let domain = '';
      try {
        domain = new URL(url).hostname;
      } catch {
        domain = url;
      }
      
      return {
        success: true,
        url: url,
        domain: domain,
        screenshot_url: screenshotUrl,
        dimension: dimension || '1366x768',
        device: device || 'desktop',
        
        // Ready-to-use HTML
        html_snippet: `<img src="${screenshotUrl}" alt="${domain} screenshot" class="w-full rounded-lg shadow-lg" loading="lazy">`,
        
        message: `Screenshot URL generated for ${domain}. Use screenshot_url in <img src="...">`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        screenshot_url: null,
      };
    }
  },
});
