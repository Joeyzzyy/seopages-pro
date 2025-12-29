import { tool } from 'ai';
import { z } from 'zod';

export const keyword_overview = tool({
  description: 'Get keyword metrics (Volume, KD, CPC) using Semrush-style data.',
  parameters: z.object({
    keyword: z.string().describe('The keyword to analyze'),
    database: z.string().optional().default('us').describe('Regional database (e.g., us, uk, ca)'),
  }),
  execute: async ({ keyword, database }) => {
    console.log(`[keyword_overview] Starting query for keyword: "${keyword}", database: ${database}`);
    
    try {
      const apiKey = process.env.SEMRUSH_API_KEY;
      if (!apiKey) {
        console.error('[keyword_overview] ERROR: SEMRUSH_API_KEY is not configured in environment variables');
        throw new Error('SEMRUSH_API_KEY is not configured');
      }
      
      const url = `https://api.semrush.com/?type=phrase_this&key=${apiKey}&phrase=${encodeURIComponent(keyword)}&database=${database}&export_columns=Ph,Nq,Cp,Co,Kd&display_limit=1`;
      console.log(`[keyword_overview] Calling Semrush API: ${url.replace(apiKey, 'KEY_HIDDEN')}`);
      
      const response = await fetch(url);
      console.log(`[keyword_overview] Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[keyword_overview] API request failed with status ${response.status}:`, errorText);
        throw new Error(`Semrush API request failed (${response.status}): ${errorText}`);
      }
      
      const text = await response.text();
      console.log(`[keyword_overview] Raw response:`, text.substring(0, 500)); // Log first 500 chars
      
      // Check for Semrush error messages
      if (text.startsWith('ERROR')) {
        console.warn(`[keyword_overview] Semrush returned:`, text);
        
        // ERROR 50 :: NOTHING FOUND means no data, not a real error
        if (text.includes('NOTHING FOUND') || text.includes('ERROR 50')) {
          console.log(`[keyword_overview] No data found for keyword "${keyword}" - this is not an error`);
          return {
            success: true,
            no_data: true,
            message: `No Semrush data found for keyword "${keyword}" in ${database} database. This could mean the keyword is too niche, misspelled, or not tracked by Semrush. Try alternative spellings or related terms.`,
            keyword,
            database,
            searchVolume: 0,
            cpc: 0,
            competition: 0,
            keywordDifficulty: 0
          };
        }
        
        // Other errors are real errors
        throw new Error(`Semrush API Error: ${text}`);
      }
      
      const lines = text.trim().split('\n');
      if (lines.length < 2) {
        console.warn(`[keyword_overview] No data rows for keyword "${keyword}". Response lines:`, lines);
        return {
          success: true,
          no_data: true,
          message: `No data available for keyword "${keyword}" in ${database} database. The keyword may be too new or have very low search volume.`,
          keyword,
          database,
          searchVolume: 0,
          cpc: 0,
          competition: 0,
          keywordDifficulty: 0
        };
      }
      
      const values = lines[1].split(';');
      const result = {
        success: true,
        keyword: values[0],
        searchVolume: parseInt(values[1]),
        cpc: parseFloat(values[2]),
        competition: parseFloat(values[3]),
        keywordDifficulty: parseFloat(values[4]),
        database
      };
      
      console.log(`[keyword_overview] Successfully retrieved data for "${keyword}":`, {
        searchVolume: result.searchVolume,
        kd: result.keywordDifficulty,
        cpc: result.cpc
      });
      
      return result;
    } catch (error: any) {
      console.error(`[keyword_overview] ERROR for keyword "${keyword}":`, {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return { 
        success: false, 
        error: error.message,
        keyword,
        database
      };
    }
  },
});

(keyword_overview as any).metadata = {
  name: 'Keyword Overview',
  provider: 'Semrush'
};

