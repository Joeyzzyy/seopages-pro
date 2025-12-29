import { Skill } from '../types';
import { extract_content } from '../tools/research/tavily-extract-content.tool';
import { fetch_raw_source } from '../tools/research/internal-web-fetch-source.tool';
import { geo_audit } from '../tools/seo/geo-audit.tool';

export const geoAuditorSkill: Skill = {
  id: 'geo-auditor',
  name: 'Optimize: GEO Auditor',
  description: 'Analyze and audit pages for Generative Engine Optimization (GEO) to improve visibility in AI Search (SearchGPT, Perplexity).',
  systemPrompt: `You are a specialist in Generative Engine Optimization (GEO) using the GEO CORE model (Context, Organization, Reliability, Exclusivity).

# GEO CORE Analysis Framework
Identify page type (Blog, Product, or Landing) and evaluate these 16 items:

## C - Context (Adaptive)
- Blog: Direct Answer Intro (first 200 words), Intent-Rich Headings, FAQ Module, Semantic Wrap-up.
- Product: Value Prop, Feature Highlights, Comparison Context, Decision Framework.
- Landing: Clear CTA, Value Prop, Use Case Clarity, Social Proof Context.

## O - Organization (Adaptive)
- Blog: Summary Box (TL;DR), Data Tables, List Density (>0.1 per paragraph), Heading Hierarchy.
- Product: Specs Table, Visual Hierarchy (images/charts), Tabbed Info, Structured Sections.
- Landing: Hero Section, Feature Grid, Social Proof Section, CTA Flow.

## R - Reliability (Adaptive)
- Blog: 3+ Authority Citations, Author Credentials, Freshness (<1yr), Data Precision (statistics).
- Product: Technical Specs, Vendor Info, Pricing Transparency, Trust Badges.
- Landing: Testimonials/Case Studies, Contact Info, Security Indicators, Brand Credibility.

## E - Exclusivity (Adaptive)
- Blog: Original Insights ("I tested"), Visual Depth (3+ diagrams), Content Depth (1200+ words), Unique Data.
- Product: Unique Selling Points, Detailed Documentation, Visual Product Demo, Success Stories.
- Landing: Unique Value Prop, Visual Storytelling, Specific Quantified Benefits, Use Case Examples.

# Execution
1. Use extract_content to retrieve page data.
2. Evaluate based on the page-type specific criteria above.
3. Call 'geo_audit' with dimension scores (0-100) and the 16-item geo_core_checks array.
4. Report summarizing AI Perception Analysis and Citation Strength.`,
  tools: {
    extract_content,
    fetch_raw_source,
    geo_audit,
  },
  enabled: true,
  metadata: {
    category: 'optimize',
    tags: ['geo', 'ai-search', 'optimization'],
    version: '1.2.0',
    status: 'active',
    solution: '针对 AI 搜索引擎（例如 SearchGPT、Perplexity）的深度 GEO 审计。分析内容可读性、引用价值和语义丰富度，为 AI 可见性提供优化建议。',
    whatThisSkillWillDo: [
      'Evaluate GEO CORE dimensions',
      'Analyze AI citation probability',
      'Check content readability',
      'Assess semantic richness',
      'Generate optimization tips'
    ],
    expectedOutput: `• GEO CORE 四维评分（Context, Organization, Reliability, Exclusivity）：0-100 分
• 16 项 GEO 检测清单（根据页面类型：Blog / Product / Landing）
• AI 感知分析：内容如何被 AI 搜索引擎理解和引用
• 引用强度评估：权威信号、事实密度、语义清晰度
• 优化建议：如何提高在 SearchGPT/Perplexity 中的可见性`,
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
        initialMessage: 'Please perform a comprehensive GEO CORE audit for this URL: {url}. Analyze how AI search engines perceive this content and provide recommendations to increase its citation probability in AI responses.'
      }
    }
  },
};

