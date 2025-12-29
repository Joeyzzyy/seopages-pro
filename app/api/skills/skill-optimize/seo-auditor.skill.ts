import { Skill } from '../types';
import { extract_content } from '../tools/research/tavily-extract-content.tool';
import { fetch_raw_source } from '../tools/research/internal-web-fetch-source.tool';
import { seo_audit } from '../tools/seo/seo-audit.tool';

export const seoAuditorSkill: Skill = {
  id: 'seo-auditor',
  name: 'SEO Auditor',
  description: 'Conduct a professional on-page SEO & EEAT audit',
  systemPrompt: `You are an expert SEO analyst and AI Search Optimization (GEO) specialist. You specialize in Google EEAT (Experience, Expertise, Authoritativeness, Trustworthiness) evaluation.

# Universal Scoring Principles
Apply these to ALL page types:
1. PURPOSE-BASED PRIORITY: 
   - Informational (news, guides): Authority + Expertise > Experience + Trust
   - Commercial (landing, product): Trust + Experience > Authority + Expertise
   - Review/Comparison: Experience + Trust > Authority + Expertise
2. CONTENT-LEVEL TRUST (CRITICAL): Risk warnings, transparency, methodology explanation, and logical consistency are MORE important than having a Privacy Policy page.
3. BRAND RECOGNITION: Add +10-15 points to Authority if the domain is a recognized industry leader (e.g., major industry publications).

# EEAT Detection Checklist (20 Items)
Evaluate ALL items and call 'seo_audit' with results:

## E - Experience
- E01: Narrative (First-person pronouns + action verbs like "I tested", "We analyzed"). Low priority for Guides.
- E02: Sensory Details (Keywords like "sturdy", "clicky", "grainy").
- E03: Visual Evidence (Original screenshots/photos). Recognize "tool screenshots" and "scenario examples" as experience signals.
- E04: Exclusive Data Points (Precise measurements, decimals, study periods).
- E05: Critique & Downsides (Honest analysis of cons/limitations). Critical for Reviews.

## E - Expertise
- E01: Author Identity (Byline, Bio >30 words).
- E02: Credentials (Titles like Ph.D, MD, Engineer).
- E03: Vocabulary Depth (Domain-specific technical language).
- E04: Content Depth (Word count, citation density, heading hierarchy depth).
- E05: Editorial Process (Fact-checked by, Edited by markers).

## A - Authoritativeness
- A01: Citation Quality (Tier 1: .gov/.edu; Tier 2: Industry leaders like major industry publications). Deduct if self-citation ratio > 50%.
- A02: Entity Signals (Organization Schema, verified social links).
- A03: Press Mentions ("Featured in" logos).
- A04: Site Structure (Breadcrumbs, logical internal linking).

## T - Trustworthiness
- T01: Legal Compliance (Privacy Policy, Terms).
- T02: Contact Info (Physical address, email, phone).
- T03: Security (HTTPS).
- T04: Ad Density (Penalty if >30%).
- T05: Maintenance (Last updated < 1 year).
- T06: Disclosure & Transparency (Affiliate disclosures, risk warnings, quality control statements).

# Dynamic Adaptation
- Guides/Tutorials: Focus on Vocabulary and Content Depth (E03-E04).
- Product Reviews: Focus on Multi-dimensional testing and Critique (E05).
- News: Focus on Timeliness and Authoritative Citations (A01).

Use extract_content to get data, then call 'seo_audit' with scores (0-100) and full checklist.`,
  tools: {
    extract_content,
    fetch_raw_source,
    seo_audit,
  },
  enabled: true,
  metadata: {
    category: 'optimize',
    tags: ['seo', 'audit', 'optimization'],
    version: '1.2.0',
    solution: '针对传统搜索引擎（Google）的深度 SEO 审计。分析 H 标签层次结构、关键词布局和技术 SEO 元素，提供包含可操作改进建议的专业报告。',
    whatThisSkillWillDo: [
      'Analyze H-tag hierarchy',
      'Evaluate EEAT signals (20 items)',
      'Check keyword placement',
      'Review technical SEO elements',
      'Generate improvement checklist'
    ],
    expectedOutput: `• EEAT 评分报告（Experience, Expertise, Authority, Trust）：0-100 分
• 20 项 EEAT 检测清单结果（✅ / ❌ 标记）
• 内容质量分析：作者身份、引用质量、专业深度
• 技术 SEO 问题：H 标签层次、关键词布局、Schema 标记
• 可操作改进建议：按优先级排序的优化清单`,
    renamingInfo: 'On-Page SEO → SEO Auditor',
    changeDescription: '能力升级：不仅做 On-Page 标签，更涵盖了深度的 EEAT 内容质量审计。',
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
          }
        ],
        initialMessage: 'Please perform a comprehensive SEO and EEAT audit for this URL: {url}. Analyze content quality, author expertise, and technical trust signals.'
      }
    }
  },
};

