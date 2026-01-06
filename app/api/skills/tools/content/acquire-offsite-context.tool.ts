import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { generateText } from 'ai';
import { createAzure } from '@ai-sdk/azure';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const azure = createAzure({
  apiKey: process.env.AZURE_OPENAI_API_KEY || '',
  resourceName: process.env.AZURE_OPENAI_ENDPOINT?.replace('https://', '').replace('.openai.azure.com', '') || '',
});

// ========== Offsite Field Types ==========
type OffsiteFieldType = 
  | 'monitoring-scope'
  | 'owned-presence'
  | 'reviews-listings'
  | 'community'
  | 'media'
  | 'kols'
  | 'all';

interface LinkItem {
  platform: string;
  url: string;
}

interface OffsiteContext {
  // Monitoring Scope
  brand_keywords: string[];
  product_keywords: string[];
  key_persons: string[];
  hashtags: string[];
  required_keywords: string[];
  excluded_keywords: string[];
  regions: string[];
  languages: string[];
  
  // Owned Presence
  official_channels: LinkItem[];
  executive_accounts: LinkItem[];
  
  // Reviews & Listings
  review_platforms: LinkItem[];
  directories: LinkItem[];
  storefronts: LinkItem[];
  
  // Community
  forums: LinkItem[];
  qa_platforms: LinkItem[];
  branded_groups: LinkItem[];
  
  // Media
  media_channels: LinkItem[];
  coverage: LinkItem[];
  events: LinkItem[];
  
  // KOLs
  creators: LinkItem[];
  experts: LinkItem[];
  press_contacts: LinkItem[];
}

// ========== AI Prompts ==========
const EXTRACTION_PROMPTS: Record<string, string> = {
  'monitoring-scope': `Analyze the website and extract monitoring scope information.

Based on the website content, identify:
1. Brand Keywords: The brand name and its variations (e.g., "Acme", "Acme Inc", "AcmeCo", "@acme")
2. Product Keywords: Key product or service related terms (e.g., "SEO tool", "content optimization", "AI writing")
3. Key Persons: Names of founders, executives, or spokespersons mentioned
4. Hashtags: Any branded or commonly used hashtags (e.g., "#acme", "#acmeapp")

Return as JSON:
{
  "brand_keywords": ["keyword1", "keyword2"],
  "product_keywords": ["keyword1", "keyword2"],
  "key_persons": ["Person Name 1", "Person Name 2"],
  "hashtags": ["#hashtag1", "#hashtag2"]
}`,

  'owned-presence': `Analyze the website to find official social media presence and channels.

Look for:
1. Social media links (LinkedIn, Twitter/X, Instagram, Facebook, YouTube, TikTok, etc.)
2. Official company channels
3. Executive/founder personal accounts if mentioned

Return as JSON:
{
  "official_channels": [
    {"platform": "LinkedIn", "url": "https://linkedin.com/company/..."},
    {"platform": "Twitter", "url": "https://twitter.com/..."}
  ],
  "executive_accounts": [
    {"platform": "Twitter", "url": "https://twitter.com/founder_name"}
  ]
}`,

  'reviews-listings': `Analyze the website to find review platforms and directory listings.

Look for:
1. Review platform badges or links (G2, Capterra, Trustpilot, ProductHunt, etc.)
2. Directory listings (industry directories, software directories)
3. App store listings (App Store, Google Play, Chrome Web Store)

Return as JSON:
{
  "review_platforms": [
    {"platform": "G2", "url": "https://g2.com/products/..."},
    {"platform": "Capterra", "url": "https://capterra.com/..."}
  ],
  "directories": [
    {"platform": "ProductHunt", "url": "https://producthunt.com/..."}
  ],
  "storefronts": [
    {"platform": "Chrome Web Store", "url": "https://chrome.google.com/..."}
  ]
}`,

  'community': `Analyze the website to find community engagement channels.

Look for:
1. Forum mentions or links (Reddit, Discourse, etc.)
2. Q&A platforms (Quora, StackOverflow)
3. Community groups (Discord, Slack, Facebook Groups)

Return as JSON:
{
  "forums": [
    {"platform": "Reddit", "url": "https://reddit.com/r/..."}
  ],
  "qa_platforms": [
    {"platform": "Quora", "url": "https://quora.com/..."}
  ],
  "branded_groups": [
    {"platform": "Discord", "url": "https://discord.gg/..."}
  ]
}`,

  'media': `Analyze the website to find media and press information.

Look for:
1. Press page or media mentions
2. Podcast appearances
3. News coverage links
4. Event participation

Return as JSON:
{
  "media_channels": [
    {"platform": "YouTube", "url": "https://youtube.com/..."}
  ],
  "coverage": [
    {"platform": "TechCrunch", "url": "https://techcrunch.com/..."}
  ],
  "events": [
    {"platform": "Conference", "url": "https://event.com/..."}
  ]
}`,

  'kols': `Analyze the website to find KOL (Key Opinion Leader) relationships.

Look for:
1. Influencer partnerships or testimonials
2. Industry expert endorsements
3. Press contacts or PR mentions

Return as JSON:
{
  "creators": [
    {"platform": "YouTube", "url": "https://youtube.com/@creator"}
  ],
  "experts": [
    {"platform": "LinkedIn", "url": "https://linkedin.com/in/expert"}
  ],
  "press_contacts": [
    {"platform": "Email", "url": "press@company.com"}
  ]
}`
};

// ========== Helper: Get Project Domain ==========
async function getProjectDomain(projectId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('seo_projects')
    .select('domain')
    .eq('id', projectId)
    .single();
  
  if (error || !data) {
    console.error('[getProjectDomain] Error:', error);
    return null;
  }
  
  return data.domain;
}

// ========== Main Tool ==========
export const acquireOffsiteContextTool = tool({
  description: `Acquire offsite context information for a project. This tool analyzes the website to extract:
- Monitoring Scope: Brand keywords, product keywords, key persons, hashtags
- Owned Presence: Official social channels, executive accounts
- Reviews & Listings: Review platforms, directories, app stores
- Community: Forums, Q&A platforms, branded groups
- Media: Media channels, press coverage, events
- KOLs: Creators, experts, press contacts

The extracted information is saved to the database for future reference.

**Important**: If websiteUrl is not provided, the tool will automatically fetch the domain from the project settings.`,
  
  parameters: z.object({
    userId: z.string().describe('The user ID'),
    projectId: z.string().describe('The project ID'),
    websiteUrl: z.string().optional().describe('Optional: The website URL to analyze. If not provided, the domain will be fetched from the project settings.'),
    fieldType: z.enum(['monitoring-scope', 'owned-presence', 'reviews-listings', 'community', 'media', 'kols', 'all'])
      .default('all')
      .describe('The type of offsite information to extract'),
  }),

  execute: async ({ userId, projectId, websiteUrl, fieldType }) => {
    // If websiteUrl is not provided, fetch from project
    let targetUrl = websiteUrl;
    if (!targetUrl) {
      const projectDomain = await getProjectDomain(projectId);
      if (!projectDomain) {
        return {
          success: false,
          error: 'No website URL provided and could not fetch domain from project settings. Please provide a website URL or ensure the project has a domain configured.'
        };
      }
      targetUrl = projectDomain.startsWith('http') ? projectDomain : `https://${projectDomain}`;
      console.log(`[acquire-offsite-context] Using project domain: ${targetUrl}`);
    }
    
    console.log(`[acquire-offsite-context] Starting for ${targetUrl}, field: ${fieldType}`);
    
    const results: Record<string, any> = {};
    const errors: string[] = [];
    
    try {
      // Fetch the website content
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch website: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Extract text content for AI analysis
      const textContent = extractTextContent(html);
      const linksContent = extractLinks(html, targetUrl);
      
      // Determine which fields to extract
      const fieldsToExtract: OffsiteFieldType[] = fieldType === 'all' 
        ? ['monitoring-scope', 'owned-presence', 'reviews-listings', 'community', 'media', 'kols']
        : [fieldType];
      
      // Extract each field type
      for (const field of fieldsToExtract) {
        try {
          console.log(`[acquire-offsite-context] Extracting: ${field}`);
          
          const prompt = EXTRACTION_PROMPTS[field];
          const { text } = await generateText({
            model: azure('gpt-4.1'),
            messages: [
              {
                role: 'system',
                content: 'You are an expert at analyzing websites and extracting offsite presence information. Always return valid JSON.'
              },
              {
                role: 'user',
                content: `${prompt}\n\nWebsite URL: ${targetUrl}\n\nWebsite Content:\n${textContent.slice(0, 10000)}\n\nLinks found:\n${linksContent.slice(0, 5000)}`
              }
            ],
            temperature: 0.3,
          });
          
          // Parse the AI response
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            results[field] = parsed;
          }
        } catch (fieldError) {
          console.error(`[acquire-offsite-context] Error extracting ${field}:`, fieldError);
          errors.push(`Failed to extract ${field}: ${fieldError instanceof Error ? fieldError.message : 'Unknown error'}`);
        }
      }
      
      // Merge results into a single context object
      const offsiteContext = mergeResults(results);
      
      // Save to database
      await saveOffsiteContext(userId, projectId, offsiteContext);
      
      return {
        success: true,
        message: `Successfully extracted offsite context for ${targetUrl}`,
        extractedFields: Object.keys(results),
        errors: errors.length > 0 ? errors : undefined,
        data: offsiteContext
      };
      
    } catch (error) {
      console.error('[acquire-offsite-context] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        extractedFields: Object.keys(results),
        errors
      };
    }
  }
});

// ========== Helper Functions ==========

function extractTextContent(html: string): string {
  // Remove scripts, styles, and other non-content elements
  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return text;
}

function extractLinks(html: string, baseUrl: string): string {
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)</gi;
  const links: string[] = [];
  let match;
  
  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1];
    const text = match[2].trim();
    
    // Filter for social media and relevant links
    const socialPatterns = [
      /linkedin\.com/i,
      /twitter\.com|x\.com/i,
      /facebook\.com/i,
      /instagram\.com/i,
      /youtube\.com/i,
      /tiktok\.com/i,
      /discord\.(gg|com)/i,
      /slack\.com/i,
      /reddit\.com/i,
      /github\.com/i,
      /g2\.com/i,
      /capterra\.com/i,
      /trustpilot\.com/i,
      /producthunt\.com/i,
      /quora\.com/i,
      /medium\.com/i,
    ];
    
    if (socialPatterns.some(pattern => pattern.test(url))) {
      links.push(`${text}: ${url}`);
    }
  }
  
  return links.join('\n');
}

function mergeResults(results: Record<string, any>): Partial<OffsiteContext> {
  const merged: Partial<OffsiteContext> = {
    brand_keywords: [],
    product_keywords: [],
    key_persons: [],
    hashtags: [],
    required_keywords: [],
    excluded_keywords: [],
    regions: [],
    languages: [],
    official_channels: [],
    executive_accounts: [],
    review_platforms: [],
    directories: [],
    storefronts: [],
    forums: [],
    qa_platforms: [],
    branded_groups: [],
    media_channels: [],
    coverage: [],
    events: [],
    creators: [],
    experts: [],
    press_contacts: [],
  };
  
  // Merge monitoring-scope
  if (results['monitoring-scope']) {
    merged.brand_keywords = results['monitoring-scope'].brand_keywords || [];
    merged.product_keywords = results['monitoring-scope'].product_keywords || [];
    merged.key_persons = results['monitoring-scope'].key_persons || [];
    merged.hashtags = results['monitoring-scope'].hashtags || [];
  }
  
  // Merge owned-presence
  if (results['owned-presence']) {
    merged.official_channels = results['owned-presence'].official_channels || [];
    merged.executive_accounts = results['owned-presence'].executive_accounts || [];
  }
  
  // Merge reviews-listings
  if (results['reviews-listings']) {
    merged.review_platforms = results['reviews-listings'].review_platforms || [];
    merged.directories = results['reviews-listings'].directories || [];
    merged.storefronts = results['reviews-listings'].storefronts || [];
  }
  
  // Merge community
  if (results['community']) {
    merged.forums = results['community'].forums || [];
    merged.qa_platforms = results['community'].qa_platforms || [];
    merged.branded_groups = results['community'].branded_groups || [];
  }
  
  // Merge media
  if (results['media']) {
    merged.media_channels = results['media'].media_channels || [];
    merged.coverage = results['media'].coverage || [];
    merged.events = results['media'].events || [];
  }
  
  // Merge kols
  if (results['kols']) {
    merged.creators = results['kols'].creators || [];
    merged.experts = results['kols'].experts || [];
    merged.press_contacts = results['kols'].press_contacts || [];
  }
  
  return merged;
}

async function saveOffsiteContext(
  userId: string,
  projectId: string,
  context: Partial<OffsiteContext>
): Promise<void> {
  const upsertData = {
    user_id: userId,
    project_id: projectId,
    ...context,
    updated_at: new Date().toISOString()
  };
  
  const { error } = await supabase
    .from('offsite_contexts')
    .upsert(upsertData, { onConflict: 'user_id,project_id' });
  
  if (error) {
    console.error('[saveOffsiteContext] Error:', error);
    throw error;
  }
  
  console.log('[saveOffsiteContext] ✅ Saved offsite context');
}

// ========== Get Offsite Context Tool ==========
export const getOffsiteContextTool = tool({
  description: 'Get the saved offsite context for a project',
  
  parameters: z.object({
    userId: z.string().describe('The user ID'),
    projectId: z.string().describe('The project ID'),
  }),
  
  execute: async ({ userId, projectId }) => {
    const { data, error } = await supabase
      .from('offsite_contexts')
      .select('*')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return { success: true, data: null, message: 'No offsite context found for this project' };
      }
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  }
});

// ========== Update Offsite Context Tool ==========
export const updateOffsiteContextTool = tool({
  description: 'Update specific fields in the offsite context',
  
  parameters: z.object({
    userId: z.string().describe('The user ID'),
    projectId: z.string().describe('The project ID'),
    updates: z.record(z.any()).describe('The fields to update'),
  }),
  
  execute: async ({ userId, projectId, updates }) => {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('offsite_contexts')
      .update(updateData)
      .eq('user_id', userId)
      .eq('project_id', projectId);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, message: 'Offsite context updated successfully' };
  }
});

