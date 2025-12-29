import { Skill } from '../types';
import { fetch_sitemap_urls } from '../tools/seo/seo-sitemap-fetcher.tool';
import { extract_content } from '../tools/research/tavily-extract-content.tool';
import { suggest_internal_links } from '../tools/content/suggest-internal-links.tool';

export const linkOptimizerSkill: Skill = {
  id: 'link-optimizer',
  name: 'Internal Linking Optimizer',
  description: 'Analyze site architecture and content to suggest strategic internal links.',
  systemPrompt: `REMINDER: Before optimizing links, you MUST call 'create_plan' first!

You are a Senior SEO Content Architect specializing in "Link Equity" distribution and "Topic Clusters".

CRITICAL PRE-CONDITION:
- To suggest internal links, you MUST have a mapping of the site's URLs.
- If the "On-Site Context" (URL list) is empty or missing, you MUST first call 'fetch_sitemap_urls' to acquire the site's architecture.

CORE WORKFLOW:
1. ACQUIRE CONTEXT (fetch_sitemap_urls): 
   - If you don't already have the site's URL list, fetch the sitemap.xml.
   - Limit: If the sitemap has > 500 URLs, stop and inform the user.
2. ANALYZE TARGET CONTENT (extract_content):
   - Extract the content of the page you want to optimize links FOR.
3. STRATEGIC MAPPING (suggest_internal_links):
   - Call 'suggest_internal_links' using the target page's keywords and URL.
   - This tool will automatically scan your Sitemap Context and Content Library.
4. SUGGESTION REPORT:
   - Provide a table of recommended internal links:
     | Target Keyword | Link To (URL) | Reason / Semantic Connection | Context Snippet |
   - Suggest specific insertion points within the text by quoting a small snippet of the original content.

BEST PRACTICES:
- Links should be natural and helpful to the user, not just for SEO.
- Prioritize linking to high-value pillar pages.
- Avoid "Over-optimization" (too many links on one page).`,
  tools: {
    fetch_sitemap_urls,
    extract_content,
    suggest_internal_links,
  },
  enabled: true,
  metadata: {
    category: 'optimize',
    tags: ['internal-links', 'architecture', 'seo'],
    version: '1.1.0',
    priority: '1',
    status: 'active',
    solution: '链接权益管理的精准工具。首先通过 sitemap.xml 映射你的站点，然后分析页面内容以找到语义缺口和锚文本机会，确保你的主题集群紧密连接以获得最大的搜索权威。',
    whatThisSkillWillDo: [
      'Parse sitemap.xml',
      'Map site architecture',
      'Analyze page content',
      'Find internal linking gaps',
      'Suggest anchor text opportunities'
    ],
    expectedOutput: `• 站点架构映射：通过 sitemap.xml 获取的 URL 清单（上限 500 个）
• 目标页面内容分析：提取页面主题和关键词
• 内部链接建议表格：包含目标关键词、链接目标 URL、语义关联原因、上下文片段
• 具体插入位置：引用原文内容片段，标注最佳插入点
• 链接权益分布策略：优先链接到高价值支柱页面的建议
• 自然度评估：避免过度优化的链接密度建议`,
    playbook: {
      trigger: {
        type: 'form',
        fields: [
          {
            id: 'page_url',
            label: 'Page to Optimize (URL)',
            type: 'text',
            placeholder: 'e.g., https://example.com/blog/my-post',
            required: true
          },
          {
            id: 'site_root',
            label: 'Site Homepage (for Sitemap)',
            type: 'text',
            placeholder: 'e.g., https://example.com',
            required: true
          }
        ],
        initialMessage: 'I want to optimize internal linking for {page_url}. Please use the sitemap from {site_root} to find relevant internal link opportunities.'
      }
    }
  },
};


