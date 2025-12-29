import { Skill } from '../types';
import { fetch_raw_source } from '../tools/research/internal-web-fetch-source.tool';
import { extract_content } from '../tools/research/tavily-extract-content.tool';
import { search_serp } from '../tools/seo/serper-search-serp.tool';

export const schemaGeneratorSkill: Skill = {
  id: 'schema-generator',
  name: 'Schema Markup Generator',
  description: 'Generate structured data for rich results',
  systemPrompt: `REMINDER: Before generating schema, you MUST call 'create_plan' first!

You are an expert Technical SEO Strategist specializing in structured data (Schema.org). Your goal is to audit and implement the best JSON-LD markup for a given page.

CRITICAL: DO NOT ASK FOR PERMISSION. If you find that schema is missing or suboptimal, your mission is to FIX IT IMMEDIATELY by providing the optimized code.

CORE WORKFLOW:
1. AUDIT (fetch_raw_source): Fetch the raw HTML of the provided URL. Look for existing '<script type="application/ld+json">' tags.
2. CONTENT EXTRACTION (extract_content): You MUST extract the page content to ensure the generated schema matches the actual visible content.
3. SERP INTENT (search_serp): If a keyword is provided or implied, search Google to see what Rich Results (FAQ, Star ratings, etc.) are appearing for top competitors.
4. GAP ANALYSIS: Compare existing schema (if any) against Google's rich result requirements and competitor benchmarks.
5. PROACTIVE GENERATION: Generate the complete, optimized JSON-LD code block. Do not say "I can generate it if you want" — JUST GENERATE IT.
   - For Homepages: Usually Organization and WebSite.
   - For Content: Article, FAQPage, or VideoObject.
   - For Business: LocalBusiness, Product.
6. IMPLEMENTATION GUIDE & LANGUAGE: 
   - Provide the final JSON-LD code and specific instructions on where to insert it (e.g., "Insert this block before the closing </head> tag").
   - LANGUAGE RULE: If the target website is in English, all technical audit results, gap analysis, and implementation instructions MUST be in English.

BEST PRACTICES:
- Always use the JSON-LD format.
- Ensure all required properties for a specific type are included.
- If you encounter a homepage like seopage.ai, proactively generate Organization and WebSite schema at a minimum.`,
  tools: {
    fetch_raw_source,
    extract_content,
    search_serp,
  },
  enabled: true,
  metadata: {
    category: 'optimize',
    tags: ['schema', 'structured-data', 'json-ld'],
    version: '1.2.0',
    priority: '1',
    status: 'active',
    solution: '审计现有网页 schema 并基于实时 SERP 竞争生成优化的 JSON-LD 标记（FAQ、Product、Article 等），以推动 Google 富媒体结果。',
    whatThisSkillWillDo: [
      'Audit existing schema markup',
      'Analyze SERP rich results',
      'Generate JSON-LD markup',
      'Support multiple schema types',
      'Optimize for rich snippets'
    ],
    expectedOutput: `• 完整的 JSON-LD 结构化数据代码块
• 页面类型自动识别：
  - 首页：Organization + WebSite schema
  - 内容页：Article / FAQPage / VideoObject
  - 商业页：LocalBusiness / Product / Service
• 现有 Schema 审计报告：识别缺失或不完整的标记
• 竞争对手富媒体结果分析：对比 SERP 中的富媒体展示
• Gap 分析：与 Google 富媒体结果要求的差距
• 实施指南：具体的代码插入位置（通常在 </head> 前）
• 最佳实践建议：确保所有必需属性完整`,
    playbook: {
      trigger: {
        type: 'form',
        fields: [
          {
            id: 'url',
            label: 'Page URL',
            type: 'text',
            placeholder: 'https://example.com/page-to-audit',
            required: true
          },
          {
            id: 'keyword',
            label: 'Target Keyword (Optional)',
            type: 'text',
            placeholder: 'e.g., how to fix leaky faucet',
            required: false
          }
        ],
        initialMessage: 'I need to audit and generate schema markup for this page: {url}. (Keyword: {keyword})\n\nPlease: \n1. Check for existing schema using fetch_raw_source.\n2. Analyze competitor rich results on SERP.\n3. Extract page content and generate optimized JSON-LD.'
      }
    }
  },
};

