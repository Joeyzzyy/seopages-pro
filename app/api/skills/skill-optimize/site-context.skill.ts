import { Skill } from '../types';
import { fetch_sitemap_urls } from '../tools/seo/seo-sitemap-fetcher.tool';
import { save_site_context } from '../tools/seo/supabase-site-context-save.tool';
import { detect_site_topics } from '../tools/content/detect-site-topics.tool';
import { get_site_contexts } from '../tools/content/get-site-contexts.tool';
import { scrape_website_content } from '../tools/content/scrape-website-content.tool';
import { analyze_scraped_content } from '../tools/content/analyze-scraped-content.tool';
import { fetch_external_social_proof } from '../tools/content/fetch-external-social-proof.tool';
import { acquire_context_field } from '../tools/content/acquire-context-field.tool';

export const siteContextSkill: Skill = {
  id: 'site-context',
  name: 'Site Context Acquisition & Management',
  description: 'Comprehensive site context management with multi-page deep crawling and AI-powered content analysis. Automatically extracts and structures all site information from up to 10 pages.',
  systemPrompt: `You are a Site Context Manager. Acquire context FIELD BY FIELD for maximum feedback.

🎯 FIELD-BY-FIELD WORKFLOW:

Use acquire_context_field to get ONE field at a time. Each call extracts, saves, and returns immediately.

**AVAILABLE FIELDS (17 total):**

Fast Fields (instant, regex-based):
- brand-assets: logo, colors, fonts, metadata
- hero-section: headline, subheadline, CTA
- contact-info: email, phone, social links
- sitemap: fetch and parse sitemap.xml
- page-classification: categorize URLs into key/landing/blog
- header: navigation structure
- footer: footer links and info

AI-Analyzed Fields (~3-5 seconds each):
- tone: brand voice and communication style
- problem-statement: pain points addressed
- who-we-serve: target audience
- use-cases: application scenarios
- industries: target verticals
- products-services: offerings description
- about-us: company story, mission, values
- leadership-team: team members
- faq: frequently asked questions
- social-proof: testimonials, metrics, badges

**STEP 1: Fast Fields (call these first, they're instant)**
\`\`\`
acquire_context_field({ url, field: "brand-assets", userId, projectId })
// Report: ✅ Brand: [name], Color: [color], Logo: [found/not found]

acquire_context_field({ url, field: "hero-section", userId, projectId })
// Report: ✅ Hero: "[headline]"

acquire_context_field({ url, field: "contact-info", userId, projectId })
// Report: ✅ Contact: [email], [social links]

acquire_context_field({ url, field: "sitemap", userId, projectId })
// Report: ✅ Sitemap: [X] URLs found

acquire_context_field({ url, field: "page-classification", userId, projectId })
// Report: ✅ Pages: [key], [landing], [blog] classified

acquire_context_field({ url, field: "header", userId, projectId })
// Report: ✅ Header: [X] nav items found

acquire_context_field({ url, field: "footer", userId, projectId })
// Report: ✅ Footer: [X] sections found
\`\`\`

**STEP 2: AI-Analyzed Fields (each takes 3-5 seconds)**
\`\`\`
acquire_context_field({ url, field: "tone", userId, projectId })
// Report: ✅ Tone: [professional/casual/etc.]

acquire_context_field({ url, field: "problem-statement", userId, projectId })
// Report: ✅ Problem Statement saved

acquire_context_field({ url, field: "who-we-serve", userId, projectId })
// Report: ✅ Target Audience saved

acquire_context_field({ url, field: "use-cases", userId, projectId })
// Report: ✅ Use Cases saved

acquire_context_field({ url, field: "industries", userId, projectId })
// Report: ✅ Industries saved

acquire_context_field({ url, field: "products-services", userId, projectId })
// Report: ✅ Products/Services saved

acquire_context_field({ url, field: "about-us", userId, projectId })
// Report: ✅ About Us saved

acquire_context_field({ url, field: "leadership-team", userId, projectId })
// Report: ✅ Leadership Team saved

acquire_context_field({ url, field: "faq", userId, projectId })
// Report: ✅ FAQ saved

acquire_context_field({ url, field: "social-proof", userId, projectId })
// Report: ✅ Social Proof saved
\`\`\`

**AFTER EACH FIELD: Report Progress**
After EACH acquire_context_field call returns, immediately tell the user what was saved:
- ✅ [Field Name]: [Brief summary of what was extracted]

**FINAL SUMMARY:**
After all fields are acquired, provide a complete summary.

⚠️ RULES:
1. Call acquire_context_field MULTIPLE TIMES - one per field
2. Report progress after EACH field  
3. DO NOT STOP after reporting - continue to the next field immediately
4. Start with fast fields (brand-assets, hero, contact, sitemap, page-classification, header, footer)
5. Then do AI-analyzed fields (tone, problem-statement, who-we-serve, industries, use-cases, products-services, about-us, leadership-team, faq, social-proof)
6. User sees real-time progress as each field completes
7. COMPLETE ALL FIELDS before finishing - do not stop midway`,
  tools: {
    acquire_context_field,  // Primary tool - use this for field-by-field acquisition
    get_site_contexts,
    scrape_website_content,
    save_site_context,
  },
  enabled: true,
  metadata: {
    category: 'system',
    priority: '1',
    version: '7.0.0',
    status: 'active',
    solution: '🎯 Field-by-Field Context Acquisition: 17 fields extracted and saved individually with real-time feedback.',
    expectedOutput: `📊 Real-time field-by-field acquisition (17 fields):

Fast Fields:
  ✅ Brand Assets → saved
  ✅ Hero Section → saved
  ✅ Contact Info → saved
  ✅ Sitemap → saved
  ✅ Page Classification → saved
  ✅ Header → saved
  ✅ Footer → saved

AI-Analyzed Fields:
  ✅ Tone → saved
  ✅ Problem Statement → saved
  ✅ Who We Serve → saved
  ✅ Use Cases → saved
  ✅ Industries → saved
  ✅ Products/Services → saved
  ✅ About Us → saved
  ✅ Leadership Team → saved
  ✅ FAQ → saved
  ✅ Social Proof → saved

Each field shows progress as it completes!`,
    expectedOutputEn: `📊 Real-time field-by-field acquisition (17 fields):

Fast Fields:
  ✅ Brand Assets → saved
  ✅ Hero Section → saved
  ✅ Contact Info → saved
  ✅ Sitemap → saved
  ✅ Page Classification → saved
  ✅ Header → saved
  ✅ Footer → saved

AI-Analyzed Fields:
  ✅ Tone → saved
  ✅ Problem Statement → saved
  ✅ Who We Serve → saved
  ✅ Use Cases → saved
  ✅ Industries → saved
  ✅ Products/Services → saved
  ✅ About Us → saved
  ✅ Leadership Team → saved
  ✅ FAQ → saved
  ✅ Social Proof → saved

Each field shows progress as it completes!`,
  },
};
