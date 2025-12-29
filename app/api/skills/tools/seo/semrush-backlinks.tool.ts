import { tool } from 'ai';
import { z } from 'zod';

/**
 * Semrush Backlinks Overview Tool
 * Provides a summary of backlinks for a domain or URL.
 * Documentation: https://developer.semrush.com/api/v3/analytics/backlinks/#backlinks-overview/
 */
export const get_backlink_overview = tool({
  description: 'Get a summary of backlinks, referring domains, and authority for a domain or URL.',
  parameters: z.object({
    target: z.string().describe('The domain, root domain or URL to analyze (e.g., example.com)'),
    target_type: z.enum(['root_domain', 'domain', 'url']).optional().default('root_domain').describe('Type of target'),
  }),
  execute: async ({ target, target_type }) => {
    try {
      const apiKey = process.env.SEMRUSH_API_KEY;
      if (!apiKey) throw new Error('SEMRUSH_API_KEY is not configured');

      const url = new URL('https://api.semrush.com/analytics/v1/');
      url.searchParams.append('type', 'backlinks_overview');
      url.searchParams.append('key', apiKey);
      url.searchParams.append('target', target);
      url.searchParams.append('target_type', target_type);
      url.searchParams.append('export_columns', 'total,domains_num,ips_num,follows_num,nofollows_num,score');

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Semrush Backlinks API request failed');

      const text = await response.text();
      if (text.startsWith('ERROR')) {
        // ERROR 50 :: NOTHING FOUND means no data, not a real error
        if (text.includes('NOTHING FOUND') || text.includes('ERROR 50')) {
          return { success: true, no_data: true, message: 'No backlink data found for this target in Semrush database.', data: null };
        }
        throw new Error(`Semrush API Error: ${text}`);
      }

      const lines = text.trim().split('\n');
      if (lines.length < 2) {
        return { success: true, no_data: true, message: 'No backlink data found for this target.', data: null };
      }

      const values = lines[1].split(';');
      return {
        success: true,
        target,
        data: {
          totalBacklinks: parseInt(values[0]),
          referringDomains: parseInt(values[1]),
          referringIPs: parseInt(values[2]),
          doFollow: parseInt(values[3]),
          noFollow: parseInt(values[4]),
          authorityScore: parseInt(values[5]),
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});

/**
 * Semrush Backlinks Historical Tool
 * Returns monthly historical trends of backlinks and referring domains.
 */
export const get_backlink_history = tool({
  description: 'Get monthly historical trends of backlinks and referring domains for a domain. COST: 40 units per month.',
  parameters: z.object({
    target: z.string().describe('The root domain to analyze (e.g., example.com)'),
    limit: z.number().optional().default(6).describe('Number of months to fetch. Default is 6. Max is 12.'),
  }),
  execute: async ({ target, limit }) => {
    try {
      const apiKey = process.env.SEMRUSH_API_KEY;
      if (!apiKey) throw new Error('SEMRUSH_API_KEY is not configured');

      const url = new URL('https://api.semrush.com/analytics/v1/');
      url.searchParams.append('type', 'backlinks_historical');
      url.searchParams.append('key', apiKey);
      url.searchParams.append('target', target);
      url.searchParams.append('target_type', 'root_domain');
      url.searchParams.append('export_columns', 'date,backlinks_num,domains_num');
      url.searchParams.append('display_limit', String(Math.min(limit, 12))); // Strictly limit to max 12

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Semrush Backlinks API request failed');

      const text = await response.text();
      if (text.startsWith('ERROR')) {
        // ERROR 50 :: NOTHING FOUND means no data, not a real error
        if (text.includes('NOTHING FOUND') || text.includes('ERROR 50')) {
          return { success: true, no_data: true, message: 'No historical backlink data found in Semrush database.', history: [] };
        }
        throw new Error(`Semrush API Error: ${text}`);
      }

      const lines = text.trim().split('\n');
      if (lines.length < 2) {
        return { success: true, no_data: true, message: 'No historical backlink data found.', history: [] };
      }

      const history = lines.slice(1).map(line => {
        const values = line.split(';');
        return {
          date: new Date(parseInt(values[0]) * 1000).toISOString().slice(0, 7), // YYYY-MM
          backlinks: parseInt(values[1]),
          domains: parseInt(values[2]),
        };
      });

      return { success: true, target, history };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});

