import { Skill } from '../types';
import { extract_content } from '../tools/research/tavily-extract-content.tool';
import { fetch_raw_source } from '../tools/research/internal-web-fetch-source.tool';
import { tech_audit } from '../tools/seo/tech-audit.tool';
import { gsc_inspect_url } from '../tools/seo/gsc-inspect-url.tool';
import { check_http_status } from '../tools/seo/check-http-status.tool';
import { pagespeed_audit } from '../tools/seo/pagespeed-audit.tool';

export const techCheckerSkill: Skill = {
  id: 'technical-seo',
  name: 'Optimize: Technical SEO Checker',
  description: 'Pro-grade technical infrastructure audit covering Speed, Crawlability, Core Web Vitals, and Link Health.',
  systemPrompt: `You are a Lead Technical SEO Engineer. Your standard of execution is "Extreme Thoroughness." You provide the kind of technical audit that developers can use as a Jira ticket backlog.

# Mandatory Technical Workflow (NO SHORTCUTS)
Even if the user's prompt is brief, you MUST execute these steps:

1. **Infrastructure & Source Audit**: 
   - Call 'fetch_raw_source' to get the real code.
   - Use 'tech_audit' to analyze robots, sitemaps, canonicals, and script bloat.
2. **Core Web Vitals (CWV) Audit**:
   - Call 'pagespeed_audit' for BOTH mobile and desktop.
   - Report LCP, CLS, and FID.
3. **Link Health Audit**:
   - Extract up to 15 internal/external links from the page.
   - Call 'check_http_status' to find 404s, 500s, or slow redirect chains.
4. **Indexing Truth**:
   - Call 'gsc_inspect_url' to verify exactly what Google's bot recorded.

# The "Technical Blueprint" Report
Your final output must be structured as a Technical Specification:
- **Core Web Vitals Status**: A visual-like summary of performance scores.
- **Link Health Report**: List any broken links found and their impact.
- **Infrastructure Checklist**: (HTTPS, Canonical, Hreflang, Robots consistency).
- **The "Fix-It" List**: Provide the EXACT code snippets or server-side instructions for optimization (e.g., "Add defer to script X", "Change redirect from 302 to 301").

# Language & Professionalism
- If the target site is in English, the technical analysis MUST be in English.
- Use precise technical terminology (e.g., "DOM Size", "Render-blocking resources", "Cumulative Layout Shift").

# Mandatory Logic
- ALWAYS use 'userId' and 'conversationId' for GSC tools.
- Never suggest content changes. Stick to the code and performance.`,
  tools: {
    extract_content,
    fetch_raw_source,
    tech_audit,
    gsc_inspect_url,
    check_http_status,
    pagespeed_audit,
  },
  enabled: true,
  metadata: {
    category: 'optimize',
    priority: '1',
    tags: ['technical', 'crawl', 'speed', 'gsc'],
    version: '2.0.0',
    solution: 'SEO 的"DevOps"。执行深度基础设施审计，专注于加载速度、可抓取性和技术合规性，确保网站完美构建以适配搜索引擎爬虫。',
    whatThisSkillWillDo: [
      'Audit loading speed',
      'Check crawlability',
      'Verify technical compliance',
      'Test mobile-friendliness',
      'Analyze Core Web Vitals'
    ],
    whatArtifactsWillBeGenerated: [
      'Markdown Report',
      'Excel Checklist'
    ],
    expectedOutput: `• Core Web Vitals 状态：移动端和桌面端的 LCP、CLS、FID 性能评分
• 链接健康报告：发现的所有 404、500 错误及缓慢重定向链
• 基础设施检查清单：HTTPS、Canonical、Hreflang、Robots 一致性验证
• GSC 索引真相：Google 爬虫实际记录的内容状态
• 源码级审计：DOM 大小、阻塞渲染资源、脚本膨胀分析
• "修复清单"：包含具体代码片段或服务器端指令的优化方案（如"为脚本 X 添加 defer 属性"）`,
    changeDescription: '能力定义：集成 PageSpeed Insights (Core Web Vitals)、HTTP 状态码检测及源码级基建审计。专注解决抓取瓶颈、加载性能及 404/重定向等硬技术问题。',
    playbook: {
      trigger: {
        type: 'form',
        fields: [
          {
            id: 'url',
            label: 'Target URL',
            type: 'text',
            placeholder: 'https://example.com/page-to-check',
            required: true
          }
        ],
        initialMessage: 'I need a deep technical SEO health check for {url}. Please audit the infrastructure, crawlability, and performance signals.'
      }
    }
  },
};

