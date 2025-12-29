import { tool } from 'ai';
import { z } from 'zod';

/**
 * Semrush Domain Gap Tool
 * Compares keywords between multiple domains to find gaps.
 * Documentation: https://developer.semrush.com/api/basics/api-tutorials/analytics-api/#analyze-keyword-gaps-among-competitors/
 */
export const domain_gap_analysis = tool({
  description: 'Compare keyword rankings between your domain and competitors to find missing content opportunities (Gaps).',
  parameters: z.object({
    my_domain: z.string().describe('Your domain (e.g., example.com)'),
    competitors: z.array(z.string()).describe('List of competitor domains (max 2 recommended)'),
    database: z.string().optional().default('us').describe('Regional database (e.g., us, uk, ca)'),
    limit: z.number().optional().default(20).describe('Max number of gap keywords to return'),
    min_volume: z.number().optional().default(100).describe('Minimum monthly search volume'),
    max_difficulty: z.number().optional().default(70).describe('Maximum keyword difficulty (0-100)'),
  }),
  execute: async ({ my_domain, competitors, database, limit, min_volume, max_difficulty }) => {
    console.log(`[domain_gap_analysis] Starting analysis:`, {
      my_domain,
      competitors,
      database,
      limit,
      min_volume,
      max_difficulty
    });
    
    try {
      const apiKey = process.env.SEMRUSH_API_KEY;
      if (!apiKey) {
        console.error('[domain_gap_analysis] ERROR: SEMRUSH_API_KEY is not configured in environment variables');
        throw new Error('SEMRUSH_API_KEY is not configured');
      }

      /**
       * Construct the domains parameter for Domain vs Domain API
       * Documentation format: *|or|competitor1.com|+|or|competitor2.com|-|or|mybrand.com
       * * : primary competitor (P0)
       * + : secondary competitor (P1)
       * - : your brand (P2)
       */
      const domainsParam = [
        `*|or|${competitors[0]}`,
        ...(competitors[1] ? [`+|or|${competitors[1]}`] : []),
        `-|or|${my_domain}`
      ].join('|');

      // Construct filter: Volume > min_volume AND KD < max_difficulty
      const filter = `+|Nq|Gt|${min_volume}|+|Kd|Lt|${max_difficulty}`;

      const url = new URL('https://api.semrush.com/');
      url.searchParams.append('type', 'domain_domains');
      url.searchParams.append('key', apiKey);
      url.searchParams.append('database', database || 'us');
      url.searchParams.append('domains', domainsParam);
      url.searchParams.append('display_sort', 'nq_desc');
      url.searchParams.append('display_filter', filter);
      url.searchParams.append('export_columns', 'Ph,P0,P1,P2,Nq,Kd,Cp');
      url.searchParams.append('display_limit', String(limit));

      console.log(`[domain_gap_analysis] Calling Semrush API: ${url.toString().replace(apiKey, 'KEY_HIDDEN')}`);
      console.log(`[domain_gap_analysis] Domains parameter: ${domainsParam}`);
      console.log(`[domain_gap_analysis] Filter: ${filter}`);

      const response = await fetch(url.toString());
      console.log(`[domain_gap_analysis] Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[domain_gap_analysis] API request failed with status ${response.status}:`, errorText);
        throw new Error(`Semrush Domain Gap API request failed (${response.status}): ${errorText}`);
      }

      const text = await response.text();
      console.log(`[domain_gap_analysis] Raw response (first 500 chars):`, text.substring(0, 500));
      
      // Check for Semrush error messages
      if (text.startsWith('ERROR')) {
        console.warn(`[domain_gap_analysis] Semrush returned:`, text);
        
        // ERROR 50 :: NOTHING FOUND means no data, not a real error
        if (text.includes('NOTHING FOUND') || text.includes('ERROR 50')) {
          console.log(`[domain_gap_analysis] No data found - this is not an error, returning suggestions`);
          return {
            success: true,
            no_data: true,
            message: `No keyword gaps found with current filters (min_volume: ${min_volume}, max_difficulty: ${max_difficulty}). This could mean:
• The domain is too new and Semrush has limited data
• The filter criteria are too strict
• The competitors chosen don't have overlapping keywords

**Suggestions for retry:**
1. Lower min_volume to 50 or even 10
2. Increase max_difficulty to 85 or 100
3. Try different/more established competitors
4. Use a different regional database`,
            gaps: [],
            my_domain,
            competitors,
            database,
            filters_used: { min_volume, max_difficulty },
            retry_suggestion: {
              min_volume: Math.max(10, min_volume - 50),
              max_difficulty: Math.min(100, max_difficulty + 15)
            }
          };
        }
        
        // Other errors (e.g., NOT ENOUGH UNITS, WRONG KEY) are real errors
        console.error(`[domain_gap_analysis] Real Semrush error:`, text);
        throw new Error(`Semrush API Error: ${text}`);
      }

      const lines = text.trim().split('\n');
      console.log(`[domain_gap_analysis] Response has ${lines.length} lines`);
      
      if (lines.length < 2) {
        console.warn(`[domain_gap_analysis] No keyword gaps found. Response preview:`, text.substring(0, 100));
        return {
          success: true,
          message: 'No keyword gaps found matching your criteria. This might be due to strict filters (Volume > 200, Difficulty < 65) or the site being too new for Semrush data.',
          gaps: [],
          raw_response_preview: text.substring(0, 100) // Helpful for debugging
        };
      }

      // Parse CSV response
      const header = lines[0].split(';');
      const gaps = lines.slice(1).map(line => {
        const values = line.split(';');
        return {
          keyword: values[0],
          competitor1_pos: values[1],
          competitor2_pos: values[2] || 'N/A',
          my_pos: values[3] || 'Not Ranking',
          searchVolume: parseInt(values[4]),
          difficulty: parseInt(values[5]),
          cpc: parseFloat(values[6])
        };
      });

      console.log(`[domain_gap_analysis] Successfully found ${gaps.length} keyword gaps`);
      console.log(`[domain_gap_analysis] Top 3 gaps:`, gaps.slice(0, 3).map(g => ({ keyword: g.keyword, volume: g.searchVolume, kd: g.difficulty })));

      return {
        success: true,
        my_domain,
        competitors,
        database,
        gaps
      };
    } catch (error: any) {
      console.error(`[domain_gap_analysis] ERROR:`, {
        message: error.message,
        stack: error.stack,
        name: error.name,
        my_domain,
        competitors
      });
      return { 
        success: false, 
        error: error.message,
        my_domain,
        competitors,
        database
      };
    }
  },
});

(domain_gap_analysis as any).metadata = {
  name: 'Domain Gap Analysis',
  provider: 'Semrush'
};

