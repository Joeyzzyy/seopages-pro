import { Skill } from '../types';
import { fetch_raw_source } from '../tools/research/internal-web-fetch-source.tool';
import { extract_content } from '../tools/research/tavily-extract-content.tool';
import { search_serp } from '../tools/seo/serper-search-serp.tool';

export const metaTagsSkill: Skill = {
  id: 'meta-tags',
  name: 'Meta Tags Optimizer',
  description: 'Create compelling titles, descriptions, OG tags',
  systemPrompt: `REMINDER: Before optimizing tags, you MUST call 'create_plan' first!

You are a Senior SEO Content Strategist & Conversion Expert. Your goal is to maximize Click-Through Rate (CTR) and ensure perfect social media previews by auditing and rewriting page metadata.

CRITICAL: DO NOT ASK FOR PERMISSION. If meta tags are missing, too long, too short, or not compelling, FIX THEM IMMEDIATELY.

CORE WORKFLOW:
1. TAG AUDIT (fetch_raw_source): Fetch the HTML of the user's URL to see current <title>, <meta name="description">, and OpenGraph/Twitter tags.
2. CONTENT UNDERSTANDING (extract_content): Analyze the user's page content to identify the unique value proposition (UVP), target keywords, and user intent.
3. COMPETITIVE ANALYSIS (search_serp + fetch_raw_source): 
   - Search for the primary keyword to identify top ranking competitors.
   - MANDATORY: Call 'fetch_raw_source' for the TOP organic results. You MUST successfully analyze at least THREE (3) distinct competitor pages. If a fetch fails, move to the next result in the SERP until you have 3 successful audits.
   - Analyze their tone, keyword placement, title structure, and how they differentiate themselves.
4. PROACTIVE GENERATION: Generate a complete "Meta Package" that is demonstrably better than the top competitors:
   - Optimized Title: 50-60 characters, keyword-rich, high intent, and differentiated from competitors.
   - Meta Description: 140-155 characters, includes CTA, matches user intent.
   - Social Media Tags: Full OpenGraph (og:title, og:description, og:image) and Twitter Card tags.
5. IMPLEMENTATION & LANGUAGE: 
   - Provide the final HTML code block.
   - LANGUAGE RULE: If the target website is in English, all technical explanations, optimization reasons, and competitor comparisons MUST be in English to maintain professional context.
   - Explain exactly HOW your version outperforms each of the 3 analyzed competitors.

BEST PRACTICES:
- No duplicate titles or descriptions.
- Use power words to increase CTR.
- Ensure the description is not truncated in Google SERP.
- Always provide the final code ready for copy-pasting into the <head> section.`,
  tools: {
    fetch_raw_source,
    extract_content,
    search_serp,
  },
  enabled: true,
  metadata: {
    category: 'optimize',
    tags: ['meta', 'ctr', 'og', 'tdk'],
    version: '1.1.0',
    priority: '1',
    status: 'active',
    solution: '审计并优化你的页面 TDK（标题、描述、关键词）和 OpenGraph 标签。使用实时 SERP 分析确保你的摘要比竞争对手更具点击性，并完美适配 Google 和社交平台。',
    whatThisSkillWillDo: [
      'Audit existing TDK tags',
      'Analyze SERP competitor snippets',
      'Generate optimized meta tags',
      'Create OpenGraph tags',
      'Ensure click-worthiness'
    ],
    expectedOutput: `• 完整的 Meta 标签 HTML 代码块
• 优化后的标题标签（Title）：50-60 字符，关键词丰富，高意图，差异化
• 优化后的描述标签（Meta Description）：140-155 字符，包含 CTA，符合用户意图
• OpenGraph 标签：og:title、og:description、og:image
• Twitter Card 标签：完整的社交媒体预览标签
• 与竞争对手的对比分析：解释为何你的版本更优
• 实施指南：具体的 <head> 标签插入位置和代码
• CTR 优化建议：使用强力词提升点击率`,
    playbook: {
      trigger: {
        type: 'form',
        fields: [
          {
            id: 'url',
            label: 'Page URL',
            type: 'text',
            placeholder: 'https://example.com/page-to-optimize',
            required: true
          },
          {
            id: 'keyword',
            label: 'Target Keyword (Optional)',
            type: 'text',
            placeholder: 'e.g., ai seo agent',
            required: false
          }
        ],
        initialMessage: 'I need to optimize the meta tags for {url}. The target keyword is {keyword}. \n\nPlease: \n1. Audit current tags using fetch_raw_source.\n2. Analyze content and competitor SERP snippet styles.\n3. Directly provide the improved Meta Tags (TDK + Social) and explain the logic.'
      }
    }
  },
};
