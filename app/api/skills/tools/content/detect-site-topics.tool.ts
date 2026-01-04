import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const detect_site_topics = tool({
  description: `Analyze sitemap and existing content library to detect topic hubs, categories, and content structure.

This tool automatically organizes website content into:
- Topic hubs (main content categories like "SEO", "Content Marketing")
- URL patterns (structural organization)
- Coverage analysis (how much content exists per topic)

WHEN TO USE:
- Automatically called after fetch_sitemap_urls
- Before topic brainstorming to understand existing coverage
- Before content planning to avoid duplication

OUTPUT:
- Organized topic hubs with URL counts
- Content structure analysis
- Coverage gaps and opportunities`,

  parameters: z.object({
    user_id: z.string().describe('The user ID'),
    sitemap_data: z.object({
      urls: z.array(z.string()),
      categorizedUrls: z.record(z.array(z.string())).optional()
    }).optional().describe('Optional sitemap data. If not provided, will fetch from database'),
  }),

  execute: async ({ user_id, sitemap_data }) => {
    try {
      let urls: string[] = [];
      let categorizedUrls: Record<string, string[]> = {};

      // Get sitemap data from database if not provided
      if (!sitemap_data) {
        const { data: sitemapContext } = await supabase
          .from('site_contexts')
          .select('content')
          .eq('user_id', user_id)
          .eq('type', 'sitemap')
          .maybeSingle();

        if (!sitemapContext?.content) {
          return {
            success: false,
            error: 'No sitemap data found. Please run Site Context Acquisition first.',
            topicHubs: []
          };
        }

        const parsed = JSON.parse(sitemapContext.content);
        urls = parsed.urls || [];
        categorizedUrls = parsed.categorizedUrls || {};
      } else {
        urls = sitemap_data.urls;
        categorizedUrls = sitemap_data.categorizedUrls || {};
      }

      // Get existing content items from library
      const { data: contentItems } = await supabase
        .from('content_items')
        .select('title, slug, target_keyword, page_type')
        .eq('user_id', user_id);

      // Analyze URL patterns and extract topics
      const topicHubs: Record<string, {
        urlCount: number;
        urls: string[];
        keywords: string[];
        urlPatterns: string[];
      }> = {};

      // Process sitemap URLs - categorize by first-level directory
      urls.forEach(url => {
        try {
          const urlObj = new URL(url);
          const pathSegments = urlObj.pathname.split('/').filter(Boolean);
          
          // Extract category from first-level directory
          // e.g., /alternatives/seo-ai-alternatives -> category = "Alternatives"
          // e.g., /pseo/automated-seo-guide -> category = "Pseo"
          let category = 'Home';
          
          if (pathSegments.length >= 1) {
            const firstSegment = pathSegments[0];
            if (firstSegment && firstSegment.length > 0) {
              // Convert to title case and handle special cases
              category = firstSegment
                .replace(/-/g, ' ')
                .replace(/_/g, ' ')
                .split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
            }
          }

          if (!topicHubs[category]) {
            topicHubs[category] = {
              urlCount: 0,
              urls: [],
              keywords: [],
              urlPatterns: []
            };
          }

          topicHubs[category].urlCount++;
          topicHubs[category].urls.push(url);

          // Track URL pattern (first-level directory)
          const pattern = pathSegments[0];
          if (pattern && !topicHubs[category].urlPatterns.includes(pattern)) {
            topicHubs[category].urlPatterns.push(pattern);
          }
        } catch (e) {
          // Skip invalid URLs
        }
      });

      // Merge with categorized URLs from sitemap fetcher
      Object.entries(categorizedUrls).forEach(([category, categoryUrls]) => {
        if (!topicHubs[category]) {
          topicHubs[category] = {
            urlCount: categoryUrls.length,
            urls: categoryUrls,
            keywords: [],
            urlPatterns: []
          };
        } else {
          // Merge if category already exists
          topicHubs[category].urlCount = Math.max(topicHubs[category].urlCount, categoryUrls.length);
        }
      });

      // Add content library data
      if (contentItems && contentItems.length > 0) {
        contentItems.forEach(item => {
          // Try to match with existing hubs or create new
          const itemTopic = item.page_type || 'Generated Content';
          
          if (!topicHubs[itemTopic]) {
            topicHubs[itemTopic] = {
              urlCount: 0,
              urls: [],
              keywords: [],
              urlPatterns: []
            };
          }

          if (item.target_keyword) {
            topicHubs[itemTopic].keywords.push(item.target_keyword);
          }
        });
      }

      // Sort hubs by URL count (descending)
      const sortedHubs = Object.entries(topicHubs)
        .sort(([, a], [, b]) => b.urlCount - a.urlCount)
        .map(([name, data]) => ({
          name,
          urlCount: data.urlCount,
          sampleUrls: data.urls.slice(0, 50), // Store up to 50 sample URLs for display
          allUrls: data.urls, // Store all URLs for reference
          urlPatterns: data.urlPatterns,
          keywords: [...new Set(data.keywords)].slice(0, 10), // Top 10 unique keywords
          coverage: data.urlCount >= 10 ? 'Strong' : data.urlCount >= 5 ? 'Moderate' : 'Weak'
        }));

      // Calculate statistics
      const totalUrls = urls.length;
      const totalHubs = sortedHubs.length;
      const avgUrlsPerHub = totalHubs > 0 ? Math.round(totalUrls / totalHubs) : 0;
      const strongHubs = sortedHubs.filter(h => h.coverage === 'Strong').length;
      const weakHubs = sortedHubs.filter(h => h.coverage === 'Weak').length;

      // Save enhanced sitemap data back to database
      const enhancedSitemapData = {
        urls,
        categorizedUrls,
        topicHubs: sortedHubs,
        analysis: {
          totalUrls,
          totalHubs,
          avgUrlsPerHub,
          strongHubs,
          weakHubs,
          analyzedAt: new Date().toISOString()
        }
      };

      await supabase
        .from('site_contexts')
        .upsert({
          user_id,
          type: 'sitemap',
          content: JSON.stringify(enhancedSitemapData),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,type'
        });

      return {
        success: true,
        topicHubs: sortedHubs,
        analysis: {
          totalUrls,
          totalHubs,
          avgUrlsPerHub,
          strongHubs,
          moderateHubs: totalHubs - strongHubs - weakHubs,
          weakHubs,
          contentLibrarySize: contentItems?.length || 0
        },
        message: `Detected ${totalHubs} topic hubs from ${totalUrls} URLs. Enhanced sitemap data saved to database.`,
        recommendations: [
          strongHubs > 0 ? `${strongHubs} strong topic hub(s) identified - good topical authority` : 'No strong topic hubs found - consider building focused content clusters',
          weakHubs > 3 ? `${weakHubs} weak hub(s) detected - opportunity to expand or consolidate` : null,
          avgUrlsPerHub < 5 ? 'Consider creating more supporting content for each topic' : null
        ].filter(Boolean)
      };

    } catch (error: any) {
      console.error('[detect_site_topics] Error:', error);
      return {
        success: false,
        error: error.message,
        topicHubs: []
      };
    }
  }
});

