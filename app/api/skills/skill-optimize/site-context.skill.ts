import { Skill } from '../types';
import { fetch_sitemap_urls } from '../tools/seo/seo-sitemap-fetcher.tool';
import { save_site_context } from '../tools/seo/supabase-site-context-save.tool';
import { detect_site_topics } from '../tools/content/detect-site-topics.tool';

export const siteContextSkill: Skill = {
  id: 'site-context',
  name: 'Site Context Acquisition',
  description: 'Fetch, organize, and SAVE site architecture (URLs from sitemap) as context. Also manages brand assets (colors, typography, tone, languages).',
  systemPrompt: `REMINDER: Before fetching site context, you MUST call 'create_plan' first!

You are a Technical SEO Architect. Your role is to crawl, map, and PERMANENTLY STORE the architecture of a website to provide the necessary context for optimization tasks.

CORE WORKFLOW:
1. IDENTIFY SITEMAP (fetch_sitemap_urls):
   - Fetch the sitemap.xml of the provided domain.
   - If a specific sitemap URL isn't provided, try the root domain first.
2. ANALYZE & FILTER:
   - Review the categorized URLs (Blog, Product, Case Study, etc.).
   - If there are more than 500 URLs, warn the user and stop processing.
3. PERSIST CONTEXT (save_site_context):
   - You MUST call 'save_site_context' to store the results.
   - Use the 'userId' found in your 'CURRENT CONTEXT'.
   - Set 'type' to 'sitemap'.
   - Set 'content' to a JSON-stringified OBJECT containing both the flat 'urls' array AND the 'categorizedUrls' object from the tool result.
   - Example content: JSON.stringify({ urls: [...], categorizedUrls: {...} })
4. DETECT TOPIC HUBS (detect_site_topics) - MANDATORY:
   - IMMEDIATELY after saving sitemap, call 'detect_site_topics'
   - Pass the sitemap data (urls and categorizedUrls) to the tool
   - This will analyze and organize content into topic hubs
   - The enhanced data will be automatically saved back to database
   - This step is CRITICAL - it ensures users see organized, categorized sitemap data
5. ESTABLISH ON-SITE CONTEXT:
   - Once completed, the enhanced sitemap data (with topic hubs) will be visible in "On Site Context" sidebar
   - Data is now ready for other skills like 'Internal Linking Optimizer', 'Topic Brainstorm', 'Page Planner'

BRAND ASSETS MANAGEMENT:
- Users can also configure brand assets through the Context Wizard UI:
  * Brand colors (primary, secondary)
  * Typography (heading and body fonts)
  * Tone and voice guidelines
  * Supported languages
- These assets are stored in the site_contexts table and accessible via get_site_contexts tool
- When generating content, ALWAYS retrieve these brand assets to maintain consistency

KEY RULES:
- If 'fetch_sitemap_urls' returns a sitemap index (multiple .xml files), inform the user and ask which specific sitemap they want to analyze.
- ALWAYS call 'save_site_context' after a successful fetch.
- ALWAYS call 'detect_site_topics' after saving sitemap - this is NOT optional.
- The workflow must be: fetch → save → detect → report to user.`,
  tools: {
    fetch_sitemap_urls,
    save_site_context,
    detect_site_topics,
  },
  enabled: true,
  metadata: {
    category: 'system',
    priority: '1',
    version: '1.0.0',
    status: 'active',
    solution: '通过解析 sitemap.xml 自动映射站点架构。这为内部链接优化和全站审计提供了必要的 URL 清单，并为大型站点内置了安全限制。',
    expectedOutput: `• Sitemap 解析结果：成功获取的 URL 数量
• URL 分类清单：按类型分组的页面列表（博客、产品、案例研究等）
• 站点架构可视化：URL 结构的分层展示
• 持久化存储确认：数据已保存到"站点上下文"侧边栏
• 上下文就绪通知：其他 skill（如内部链接优化器）现可使用该数据
• 容量警告：如果 URL 数量超过 500，会提示并停止处理`,
    expectedOutputEn: `• Sitemap parsing results: number of successfully retrieved URLs
• URL classification list: page list grouped by type (blog, product, case studies, etc.)
• Site architecture visualization: hierarchical display of URL structure
• Persistent storage confirmation: data saved to "Site Context" sidebar
• Context ready notification: other skills (such as internal link optimizer) can now use this data
• Capacity warning: if URL count exceeds 500, will prompt and stop processing`,
  },
};

