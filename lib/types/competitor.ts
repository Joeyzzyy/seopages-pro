/**
 * Competitor data structure for Alternative Pages
 * 
 * This type defines the structure for competitor information
 * stored in the `competitors` site context.
 * 
 * The competitors context content field contains a JSON array of Competitor objects.
 * 
 * @example
 * // In site_contexts table (type: 'competitors')
 * content: '[{"name": "Writesonic", "url": "https://writesonic.com", "logo_url": "...", "description": "..."}]'
 */
export interface Competitor {
  /** Competitor name (e.g., "Writesonic") */
  name: string;
  
  /** Competitor website URL */
  url: string;
  
  /** 
   * Competitor logo URL
   * Can be:
   * - Direct logo URL (e.g., https://writesonic.com/logo.png)
   * - Google Favicon URL (e.g., https://www.google.com/s2/favicons?domain=writesonic.com&sz=128)
   * - Data URL for SVG fallback
   */
  logo_url?: string;
  
  /** Brief description of what the competitor does */
  description?: string;
  
  /** Starting price for comparison (e.g., "$29/mo") */
  pricing_start?: string;
  
  /** When was this competitor info last updated */
  last_updated?: string;
}

/**
 * Parse competitors JSON from site context content
 */
export function parseCompetitors(content: string | null): Competitor[] {
  if (!content) return [];
  
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed as Competitor[];
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Stringify competitors array for saving to site context
 */
export function stringifyCompetitors(competitors: Competitor[]): string {
  return JSON.stringify(competitors);
}

/**
 * Get competitor logo URL, with fallback to Google Favicon service
 */
export function getCompetitorLogoUrl(competitor: Competitor): string {
  if (competitor.logo_url) {
    return competitor.logo_url;
  }
  
  try {
    const domain = new URL(competitor.url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch {
    // Generate a fallback SVG
    const initial = competitor.name.charAt(0).toUpperCase();
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect fill="%238b5cf6" width="40" height="40" rx="8"/><text x="20" y="26" font-size="18" fill="white" text-anchor="middle" font-family="system-ui">${initial}</text></svg>`;
  }
}
