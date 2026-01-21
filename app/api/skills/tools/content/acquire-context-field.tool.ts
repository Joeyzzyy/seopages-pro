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

// ========== Field Configuration ==========
// Each field has its own extraction strategy

interface FieldConfig {
  targetPages: string[];  // Priority pages to check (relative paths)
  extractionMethod: 'regex' | 'ai' | 'structured';
  aiPrompt?: string;
  dbType: string;  // Database type to save as
}

const FIELD_CONFIGS: Record<string, FieldConfig> = {
  // ===== Fast Fields (Regex-based) =====
  'brand-assets': {
    targetPages: ['/'],
    extractionMethod: 'regex',
    dbType: 'logo',
  },
  'hero-section': {
    targetPages: ['/'],
    extractionMethod: 'structured',
    dbType: 'hero-section',
  },
  'contact-info': {
    targetPages: ['/', '/contact', '/contact-us', '/about', '/about-us'],
    extractionMethod: 'regex',
    dbType: 'contact-information',
  },
  'sitemap': {
    targetPages: ['/sitemap.xml', '/sitemap_index.xml'],
    extractionMethod: 'regex',
    dbType: 'sitemap',
  },
  'page-classification': {
    targetPages: ['/'],
    extractionMethod: 'regex',
    dbType: 'multiple', // Saves to key-website-pages, landing-pages, blog-resources
  },
  'header': {
    targetPages: ['/'],
    extractionMethod: 'structured',
    dbType: 'header',
  },
  'footer': {
    targetPages: ['/'],
    extractionMethod: 'structured',
    dbType: 'footer',
  },

  // ===== AI-Analyzed Fields =====
  'tone': {
    targetPages: ['/', '/about', '/about-us'],
    extractionMethod: 'ai',
    aiPrompt: `Analyze the tone and voice of this website's content.

Identify:
1. Communication style (professional, casual, friendly, authoritative, etc.)
2. Language tone (formal, informal, technical, conversational)
3. Brand personality traits
4. Target audience implied by the tone

Return a concise description (1-2 sentences) that can be used to maintain consistent tone in content creation.
Example outputs:
- "Professional and authoritative with technical expertise, targeting B2B decision-makers"
- "Friendly and conversational, using simple language for everyday consumers"
- "Bold and innovative, speaking to tech-savvy early adopters"`,
    dbType: 'logo', // Saved as tone field in logo type
  },
  'problem-statement': {
    targetPages: ['/', '/about', '/about-us', '/why-us', '/solutions'],
    extractionMethod: 'ai',
    aiPrompt: `Extract the PROBLEM STATEMENT from this website.
What pain points or challenges does this product/service address?
Write 2-3 paragraphs (200-400 words) describing:
- The core problem(s) being solved
- Who experiences these problems
- The impact/cost of not solving them
If not explicitly stated, infer from the value proposition and messaging.
Return ONLY the text content, no JSON.`,
    dbType: 'problem-statement',
  },
  'who-we-serve': {
    targetPages: ['/', '/customers', '/for-teams', '/industries', '/solutions', '/about'],
    extractionMethod: 'ai',
    aiPrompt: `Identify WHO THIS PRODUCT/SERVICE SERVES.
Write 1-2 paragraphs (100-200 words) covering:
- Primary target audience/customer segments
- Types of businesses or individuals
- Company sizes (startup, SMB, enterprise)
- Any specific roles or departments
Return ONLY the text content, no JSON.`,
    dbType: 'who-we-serve',
  },
  'use-cases': {
    targetPages: ['/', '/use-cases', '/solutions', '/features', '/how-it-works'],
    extractionMethod: 'ai',
    aiPrompt: `List the main USE CASES for this product/service.
What can customers accomplish? What problems does it solve?

Return as a simple string (NOT JSON) with this format:
- Use Case 1: [Name] - [Brief description]
- Use Case 2: [Name] - [Brief description]
- Use Case 3: [Name] - [Brief description]

Include 5-10 use cases total. Write 1-2 sentences per use case.
Focus on practical scenarios and outcomes.

Return ONLY plain text, no JSON structure.`,
    dbType: 'use-cases',
  },
  'industries': {
    targetPages: ['/', '/industries', '/solutions', '/customers', '/case-studies', '/verticals', '/sectors', '/who-we-serve', '/use-cases', '/for-enterprise', '/for-business'],
    extractionMethod: 'ai',
    aiPrompt: `Identify the INDUSTRIES this product/service targets.
List all mentioned industries/verticals with brief descriptions of how the product applies to each.
Format as a structured list like:
- Healthcare: [how product helps healthcare]
- Finance: [how product helps finance]
- etc.
If no specific industries mentioned, analyze the content to infer likely target industries.
Return ONLY the text content, no JSON.`,
    dbType: 'industries',
  },
  'products-services': {
    targetPages: ['/', '/products', '/services', '/features', '/pricing', '/solutions', '/what-we-do', '/offerings', '/plans', '/packages'],
    extractionMethod: 'ai',
    aiPrompt: `Describe the PRODUCTS and SERVICES offered.
Write 2-4 paragraphs (300-500 words) covering:
- Main product/service offerings
- Key features and capabilities
- Pricing tiers if mentioned
- Differentiators or unique selling points
Return ONLY the text content, no JSON.`,
    dbType: 'products-services',
  },
  'about-us': {
    targetPages: ['/about', '/about-us', '/company', '/our-story', '/'],
    extractionMethod: 'ai',
    aiPrompt: `Extract ABOUT US information from this website.
Look for company background, mission, vision, values, and story.
Return as JSON:
{
  "companyStory": "The company's background and history (2-3 paragraphs)",
  "missionVision": "Mission statement and vision (1-2 paragraphs)",
  "coreValues": "Core values and principles (bullet points or paragraph)"
}`,
    dbType: 'about-us',
  },
  'leadership-team': {
    targetPages: ['/about', '/about-us', '/team', '/our-team', '/leadership', '/company', '/management', '/founders', '/people', '/meet-the-team', '/executive-team', '/who-we-are'],
    extractionMethod: 'ai',
    aiPrompt: `Extract LEADERSHIP TEAM information.
Look for executives, founders, key team members.
Return as JSON array:
[
  {
    "name": "Full Name",
    "title": "Job Title",
    "bio": "Brief biography or description",
    "image": "Image URL if found",
    "linkedin": "LinkedIn URL if found"
  }
]
If no team information found, return empty array: []`,
    dbType: 'leadership-team',
  },
  'faq': {
    targetPages: ['/faq', '/faqs', '/help', '/support', '/frequently-asked-questions', '/', '/help-center', '/knowledge-base', '/questions', '/common-questions'],
    extractionMethod: 'ai',
    aiPrompt: `You are analyzing a webpage to extract FAQ (Frequently Asked Questions).

SEARCH FOR THESE PATTERNS:
1. Section headings: "FAQ", "Frequently Asked Questions", "Common Questions"
2. Question patterns: "What is...", "How do I...", "Can I...", "Why...", "When..."
3. Q&A pairs in any format (collapsible sections, lists, paragraphs)
4. Help center or support content in Q&A format

INSTRUCTIONS:
- Extract ALL question-answer pairs you find
- Questions often start with: What, How, Can, Why, When, Where, Is, Do, Does
- Answers follow the question (may be in collapsed sections)
- Look through the ENTIRE content, including homepage sections

OUTPUT FORMAT - Return ONLY this JSON array, nothing else:
[
  {"question": "Full question text?", "answer": "Complete answer text here."},
  {"question": "Next question?", "answer": "Next answer."}
]

RULES:
- Return 5-30 FAQ items if found
- Keep questions as written (include the "?")
- Keep full answers (1-3 paragraphs each)
- If answer is very long (500+ words), summarize to 200-300 words
- Return [] ONLY if you genuinely find NO FAQ content anywhere
- Do NOT wrap in markdown code blocks like \`\`\`json
- Do NOT add any text before or after the JSON array

Start analyzing now:`,
    dbType: 'faq',
  },
  'social-proof': {
    targetPages: ['/', '/customers', '/testimonials', '/case-studies', '/about', '/reviews', '/clients', '/success-stories', '/wall-of-love'],
    extractionMethod: 'ai',
    aiPrompt: `Extract SOCIAL PROOF elements from this website.
Look for testimonials, customer quotes, statistics, awards, badges, partner logos.
Return as JSON:
{
  "testimonials": [{"quote": "...", "author": "...", "company": "..."}],
  "metrics": "Key statistics like '10,000+ customers' or '99.9% uptime'",
  "awards": "Any awards or recognitions",
  "badges": "Trust badges, certifications, security seals",
  "partners": "Partner company names or logos mentioned"
}`,
    dbType: 'social-proof-trust',
  },
};

// All available context fields
const CONTEXT_FIELDS = Object.keys(FIELD_CONFIGS) as (keyof typeof FIELD_CONFIGS)[];

type ContextFieldType = typeof CONTEXT_FIELDS[number];

// Cache for scraped data
const scrapedDataCache: Map<string, { html: string; text: string; timestamp: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache for discovered navigation links
const navigationCache: Map<string, { links: string[]; timestamp: number }> = new Map();

// Cache for sitemap URLs
const sitemapCache: Map<string, { urls: string[]; timestamp: number }> = new Map();

export const acquire_context_field = tool({
  description: `Acquire a SINGLE context field from a website and save it to database.

Each field has its own intelligent extraction strategy:
- Targets specific pages for each field type
- Falls back to homepage if specific pages unavailable
- Discovers secondary pages from navigation automatically

Fast fields (instant, regex-based):
- brand-assets: logo, colors, fonts, metadata
- hero-section: headline, subheadline, CTA
- contact-info: email, phone, social links
- sitemap: fetch and parse sitemap.xml
- page-classification: categorize URLs
- header: navigation structure
- footer: footer links and info

AI-analyzed fields (~3-5 seconds each):
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

Returns extracted data and saves to database automatically.`,

  parameters: z.object({
    url: z.string().describe('Website base URL to analyze'),
    field: z.enum(CONTEXT_FIELDS as [string, ...string[]]).describe('Which field to extract'),
    userId: z.string().describe('User ID for database save'),
    projectId: z.string().describe('Project ID for database save'),
  }),

  execute: async ({ url, field, userId, projectId }) => {
    const startTime = Date.now();
    console.log(`[acquire_context_field] 🎯 Acquiring field: ${field} from ${url}`);

    try {
      // Verify project exists
      const { data: project, error: projectError } = await supabase
        .from('seo_projects')
        .select('id')
        .eq('id', projectId)
        .single();
      
      if (projectError || !project) {
        return {
          success: false,
          field,
          error: `Project not found: ${projectId}`,
          message: `❌ Project does not exist. Please create a new one.`
        };
      }

      // Normalize URL
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      const origin = new URL(fullUrl).origin;
      const config = FIELD_CONFIGS[field];

      if (!config) {
        return { success: false, field, error: `Unknown field: ${field}` };
      }

      let extractedData: any = null;

      // Try target pages in order
      let pageData: { html: string; text: string } | null = null;
      let usedPage = '/';

      for (const targetPath of config.targetPages) {
        const targetUrl = targetPath.startsWith('/sitemap') 
          ? origin + targetPath 
          : origin + targetPath;
        
        const result = await getPageData(targetUrl);
        if (result.success && result.html) {
          pageData = { html: result.html, text: result.text || '' };
          usedPage = targetPath;
          console.log(`[acquire_context_field] ✅ Found content at ${targetPath}`);
          break;
        }
      }

      // Fallback to homepage if no target page worked
      if (!pageData) {
        const result = await getPageData(origin);
        if (result.success) {
          pageData = { html: result.html!, text: result.text! };
          usedPage = '/';
        } else {
          return { success: false, field, error: `Failed to fetch any page: ${result.error}` };
        }
      }

      // Extract based on field type
      switch (field) {
        case 'brand-assets':
          extractedData = extractBrandAssets(pageData.html, origin);
          
          // Also analyze tone with AI
          const tonePrompt = `Analyze the tone and voice of this website content.
Return ONLY a short phrase (2-5 words) describing the brand tone, such as:
- "Professional and authoritative"
- "Friendly and conversational"  
- "Technical and expert"
- "Bold and innovative"
- "Warm and supportive"
- "Playful and casual"

Website content (first 3000 chars):
${pageData.text.substring(0, 3000)}

Return ONLY the tone phrase, nothing else.`;
          
          try {
            const { text: toneResult } = await generateText({
              model: azure(process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1'),
              prompt: tonePrompt,
              maxTokens: 50,
            });
            extractedData.tone = toneResult?.trim() || 'Professional';
          } catch (e) {
            console.log('[acquire_context_field] Tone analysis failed, using default');
            extractedData.tone = 'Professional';
          }
          
          await saveToDatabase(userId, projectId, config.dbType, JSON.stringify(extractedData), extractedData);
          break;

        case 'hero-section':
          // Use AI to analyze hero section
          console.log('[acquire_context_field] Using AI to analyze hero section');
          const heroPrompt = `Analyze this website's homepage content and extract the HERO SECTION information.

The hero section is usually the first prominent section visitors see, typically containing:
- A main headline (H1 or large text)
- A subheadline or value proposition  
- A call-to-action button
- Sometimes metrics or stats

Return as JSON:
{
  "headline": "The main headline text",
  "subheadline": "The supporting text or value proposition",
  "callToAction": "The primary CTA button text",
  "metrics": "Any stats like '10,000+ users' or '99.9% uptime'"
}

Website content (first 4000 chars):
${pageData.text.substring(0, 4000)}

Return ONLY valid JSON, no explanation.`;

          try {
            const { text: heroResult } = await generateText({
              model: azure(process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1'),
              prompt: heroPrompt,
              maxTokens: 500,
            });
            
            // Try to parse JSON
            const trimmed = heroResult?.trim() || '{}';
            try {
              const parsed = JSON.parse(trimmed.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
              extractedData = {
                headline: parsed.headline || '',
                subheadline: parsed.subheadline || '',
                callToAction: parsed.callToAction || '',
                metrics: parsed.metrics || '',
              };
            } catch (e) {
              console.log('[acquire_context_field] Failed to parse hero AI response');
              extractedData = {
                headline: '',
                subheadline: '',
                callToAction: '',
                metrics: '',
              };
            }
          } catch (e) {
            console.log('[acquire_context_field] Hero AI analysis failed');
            extractedData = {
              headline: '',
              subheadline: '',
              callToAction: '',
              metrics: '',
            };
          }
          
          await saveToDatabase(userId, projectId, config.dbType, JSON.stringify(extractedData));
          break;

        case 'contact-info':
          // 智能发现联系方式相关页面
          const contactDiscoveredPages = await discoverRelevantPages('contact-info', origin, pageData.html);
          console.log(`[acquire_context_field] Discovered ${contactDiscoveredPages.length} pages for contact-info:`, contactDiscoveredPages);
          
          let contactHtml = pageData.html;
          let contactBestResult = extractContactInfo(pageData.html);
          
          // 尝试每个发现的页面，选择联系信息最多的
          for (const discoveredPage of contactDiscoveredPages) {
            const result = await getPageData(discoveredPage);
            if (result.success && result.html) {
              const tempContact = extractContactInfo(result.html);
              // 比较哪个页面有更多联系信息
              const currentCount = (contactBestResult.emails?.length || 0) + (contactBestResult.phones?.length || 0) + Object.keys(contactBestResult.social || {}).length;
              const newCount = (tempContact.emails?.length || 0) + (tempContact.phones?.length || 0) + Object.keys(tempContact.social || {}).length;
              if (newCount > currentCount) {
                contactHtml = result.html;
                contactBestResult = tempContact;
                console.log(`[acquire_context_field] Found better contact info at ${discoveredPage}`);
              }
            }
          }
          
          extractedData = contactBestResult;
          await saveToDatabase(userId, projectId, config.dbType, JSON.stringify(extractedData));
          break;

        case 'sitemap':
          extractedData = await fetchSitemap(origin);
          await saveToDatabase(userId, projectId, config.dbType, JSON.stringify(extractedData));
          break;

        case 'page-classification':
          const sitemap = await fetchSitemap(origin);
          extractedData = classifyPages(sitemap.urls || [], origin);
          await saveToDatabase(userId, projectId, 'key-website-pages', JSON.stringify(extractedData.keyPages));
          await saveToDatabase(userId, projectId, 'landing-pages', JSON.stringify(extractedData.landingPages));
          await saveToDatabase(userId, projectId, 'blog-resources', JSON.stringify(extractedData.blogPages));
          break;

        case 'header':
          extractedData = await extractHeader(pageData.html, origin, true); // 使用AI增强
          await saveToDatabase(userId, projectId, config.dbType, JSON.stringify(extractedData));
          break;

        case 'footer':
          extractedData = await extractFooter(pageData.html, origin); 
          await saveToDatabase(userId, projectId, config.dbType, JSON.stringify(extractedData));
          break;

        case 'tone':
          // Analyze tone and save to logo type
          extractedData = await analyzeWithAI(config.aiPrompt!, pageData.text, origin);
          // Update logo type with tone
          await supabase
            .from('site_contexts')
            .update({ tone: extractedData, updated_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('project_id', projectId)
            .eq('type', 'logo');
          break;

        // AI-analyzed fields with smart page discovery
        case 'about-us':
        case 'leadership-team':
          // 智能发现相关页面
          const aboutDiscoveredPages = await discoverRelevantPages(field, origin, pageData.html);
          console.log(`[acquire_context_field] Discovered ${aboutDiscoveredPages.length} pages for ${field}:`, aboutDiscoveredPages);
          
          let aboutBestPageData = pageData;
          let aboutPageUsed = '/';
          
          // 尝试每个发现的页面，选择内容最丰富的
          for (const discoveredPage of aboutDiscoveredPages) {
            const result = await getPageData(discoveredPage);
            if (result.success && result.text && result.text.length > aboutBestPageData.text.length) {
              aboutBestPageData = { html: result.html!, text: result.text };
              aboutPageUsed = discoveredPage;
              console.log(`[acquire_context_field] Using ${discoveredPage} for ${field} (${result.text.length} chars)`);
            }
          }
          
          extractedData = await analyzeWithAI(config.aiPrompt!, aboutBestPageData.text, origin);
          
          // 如果是空结果且有多个页面，尝试合并多个页面的内容再分析
          if (field === 'leadership-team' && Array.isArray(extractedData) && extractedData.length === 0 && aboutDiscoveredPages.length > 1) {
            console.log(`[acquire_context_field] Empty result, trying multiple pages for ${field}`);
            let combinedText = aboutBestPageData.text;
            for (let i = 1; i < Math.min(3, aboutDiscoveredPages.length); i++) {
              const extraResult = await getPageData(aboutDiscoveredPages[i]);
              if (extraResult.success && extraResult.text) {
                combinedText += '\n\n--- Page ' + (i+1) + ' ---\n\n' + extraResult.text.substring(0, 3000);
              }
            }
            extractedData = await analyzeWithAI(config.aiPrompt!, combinedText.substring(0, 12000), origin);
          }
          
          await saveToDatabase(userId, projectId, config.dbType, 
            typeof extractedData === 'string' ? extractedData : JSON.stringify(extractedData));
          break;

        case 'faq':
          // 智能发现FAQ相关页面
          const faqDiscoveredPages = await discoverRelevantPages('faq', origin, pageData.html);
          console.log(`[acquire_context_field] Discovered ${faqDiscoveredPages.length} pages for FAQ:`, faqDiscoveredPages);
          
          // 尝试多个页面并聚合 FAQ 内容
          let faqPageTexts: string[] = [];
          let faqSourcePage = '/';
          
          // 首先尝试首页（很多网站在首页有 FAQ 区域）
          faqPageTexts.push(pageData.text.substring(0, 30000));
          console.log(`[acquire_context_field] Including homepage for FAQ (${pageData.text.length} chars)`);
          
          // 然后尝试每个发现的 FAQ 页面
          for (const discoveredPage of faqDiscoveredPages.slice(0, 3)) {
            const result = await getPageData(discoveredPage);
            if (result.success && result.text) {
              faqPageTexts.push(result.text.substring(0, 20000));
              console.log(`[acquire_context_field] Added ${discoveredPage} for FAQ (${result.text.length} chars)`);
              if (result.text.length > pageData.text.length) {
                faqSourcePage = new URL(discoveredPage).pathname;
              }
            }
          }
          
          // 合并所有页面的文本
          const combinedFaqText = faqPageTexts.join('\n\n--- NEXT PAGE ---\n\n').substring(0, 50000);
          console.log(`[acquire_context_field] Combined FAQ text length: ${combinedFaqText.length} chars from ${faqPageTexts.length} pages`);
          
          // === 两步提取法 ===
          try {
            console.log('[acquire_context_field] FAQ Step 1/2: 自由提取所有 Q&A 对...');
            
            // STEP 1: 自由提取原始 Q&A 内容
            const faqStep1Prompt = `分析以下网页内容，提取**所有**问答对（Q&A）。

不要限制格式，记录你找到的所有问题和答案，包括：
- 标准 FAQ 区块
- 帮助中心问答
- 产品说明中的 Q&A
- 任何"问题-答案"格式的内容

返回纯 JSON：
{
  "qaItems": [
    {
      "q": "问题文字（任何格式）",
      "a": "答案文字（任何格式）",
      "category": "分类（如果有）",
      "context": "额外的上下文信息（如果有）"
    }
  ],
  "faqSections": [
    {
      "sectionTitle": "FAQ 区块标题（如果有）",
      "items": [{"q": "问题", "a": "答案"}]
    }
  ],
  "totalFound": 数字
}

要求：
1. 提取所有找到的 Q&A，不要遗漏
2. 问题可能以各种形式出现（How、What、Can、Why 等）
3. 答案可能很长，完整保留
4. 如果没找到任何 Q&A，返回空数组但保留结构
5. 只返回 JSON，不要解释

网页内容：
${combinedFaqText.substring(0, 40000)}`;

            const faqStep1Response = await generateText({
              model: azure(process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1'),
              messages: [
                {
                  role: 'system',
                  content: 'You are an expert at extracting Q&A content from web pages. Find all question-answer pairs regardless of format. Return valid JSON only.',
                },
                {
                  role: 'user',
                  content: faqStep1Prompt,
                },
              ],
              temperature: 0,
              maxTokens: 6000,
            });

            let rawFaqData = faqStep1Response.text.trim();
            if (rawFaqData.startsWith('```json')) {
              rawFaqData = rawFaqData.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
            } else if (rawFaqData.startsWith('```')) {
              rawFaqData = rawFaqData.replace(/```\n?/g, '');
            }

            const extractedRawFaq = JSON.parse(rawFaqData);
            console.log(`[acquire_context_field] ✅ FAQ Step 1 完成: 提取到 ${extractedRawFaq.totalFound || 0} 个原始 Q&A`);
            console.log(`[acquire_context_field] FAQ 原始数据预览:`, JSON.stringify(extractedRawFaq).substring(0, 300));

            // STEP 2: 转换成标准格式
            console.log('[acquire_context_field] FAQ Step 2/2: 转换成标准格式...');
            
            const faqStep2Prompt = `将以下原始 FAQ 数据转换成标准格式。

原始数据：
${JSON.stringify(extractedRawFaq, null, 2)}

转换成标准格式的纯 JSON 数组：
[
  {
    "question": "完整的问题文字（保留问号）",
    "answer": "完整的答案文字（如果太长，总结为 200-300 字）"
  }
]

转换规则：
1. 合并 qaItems 和 faqSections 中的所有问答对
2. 统一字段名：q/question → question, a/answer → answer
3. 确保每个问题以问号结尾
4. 如果答案超过 500 字，精简为 200-300 字的核心内容
5. 去重：如果有重复的问题，保留最详细的答案
6. 按逻辑顺序排列（通用问题在前，具体问题在后）
7. 如果没有任何 Q&A，返回空数组 []
8. 只返回 JSON 数组，不要解释

开始转换：`;

            const faqStep2Response = await generateText({
              model: azure(process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1'),
              messages: [
                {
                  role: 'system',
                  content: 'You are a data transformer. Convert raw FAQ data into clean, standardized format. Return valid JSON array only.',
                },
                {
                  role: 'user',
                  content: faqStep2Prompt,
                },
              ],
              temperature: 0,
              maxTokens: 6000,
            });

            let standardFaqData = faqStep2Response.text.trim();
            if (standardFaqData.startsWith('```json')) {
              standardFaqData = standardFaqData.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
            } else if (standardFaqData.startsWith('```')) {
              standardFaqData = standardFaqData.replace(/```\n?/g, '');
            }

            extractedData = JSON.parse(standardFaqData);
            
            // 验证是数组
            if (!Array.isArray(extractedData)) {
              console.log('[acquire_context_field] FAQ Step 2 返回的不是数组，设为空数组');
              extractedData = [];
            }
            
            // 验证每个项的结构
            extractedData = extractedData.filter((item: any) => 
              item && 
              typeof item === 'object' && 
              item.question && 
              item.answer &&
              typeof item.question === 'string' &&
              typeof item.answer === 'string' &&
              item.question.trim().length > 0 &&
              item.answer.trim().length > 0
            );
            
            console.log(`[acquire_context_field] ✅ FAQ Step 2 完成: 最终得到 ${extractedData.length} 个标准 FAQ 项`);
            
          } catch (err) {
            console.error('[acquire_context_field] FAQ 两步提取失败:', err);
            extractedData = [];
          }
          
          await saveToDatabase(userId, projectId, config.dbType, JSON.stringify(extractedData));
          break;

        case 'industries':
        case 'use-cases':
        case 'who-we-serve':
          // 智能发现相关页面
          const industryDiscoveredPages = await discoverRelevantPages(field, origin, pageData.html);
          console.log(`[acquire_context_field] Discovered ${industryDiscoveredPages.length} pages for ${field}:`, industryDiscoveredPages);
          
          let industryBestPageData = pageData;
          
          // 尝试每个发现的页面，选择内容最丰富的
          for (const discoveredPage of industryDiscoveredPages) {
            const result = await getPageData(discoveredPage);
            if (result.success && result.text && result.text.length > industryBestPageData.text.length) {
              industryBestPageData = { html: result.html!, text: result.text };
              console.log(`[acquire_context_field] Using ${discoveredPage} for ${field}`);
            }
          }
          
          extractedData = await analyzeWithAI(config.aiPrompt!, industryBestPageData.text, origin);
          
          // 确保保存的是字符串格式
          const contentToSave = typeof extractedData === 'string' 
            ? extractedData 
            : JSON.stringify(extractedData);
          
          await saveToDatabase(userId, projectId, config.dbType, contentToSave);
          break;

        case 'products-services':
          // 智能发现产品/服务相关页面
          const productDiscoveredPages = await discoverRelevantPages('products-services', origin, pageData.html);
          console.log(`[acquire_context_field] Discovered ${productDiscoveredPages.length} pages for products-services:`, productDiscoveredPages);
          
          let productBestPageData = pageData;
          
          // 尝试每个发现的页面
          for (const discoveredPage of productDiscoveredPages) {
            const result = await getPageData(discoveredPage);
            if (result.success && result.text && result.text.length > productBestPageData.text.length) {
              productBestPageData = { html: result.html!, text: result.text };
              console.log(`[acquire_context_field] Using ${discoveredPage} for products-services`);
            }
          }
          
          extractedData = await analyzeWithAI(config.aiPrompt!, productBestPageData.text, origin);
          
          // 确保保存的是字符串格式
          const productContentToSave = typeof extractedData === 'string' 
            ? extractedData 
            : JSON.stringify(extractedData);
          
          await saveToDatabase(userId, projectId, config.dbType, productContentToSave);
          break;

        case 'social-proof':
          // 智能发现social proof相关页面
          const socialDiscoveredPages = await discoverRelevantPages('social-proof', origin, pageData.html);
          console.log(`[acquire_context_field] Discovered ${socialDiscoveredPages.length} pages for social-proof:`, socialDiscoveredPages);
          
          // 收集多个页面的内容来提取social proof
          let socialProofTexts = [pageData.text.substring(0, 4000)];
          for (const discoveredPage of socialDiscoveredPages.slice(0, 3)) {
            const result = await getPageData(discoveredPage);
            if (result.success && result.text) {
              socialProofTexts.push(result.text.substring(0, 3000));
              console.log(`[acquire_context_field] Added content from ${discoveredPage}`);
            }
          }
          
          const combinedSocialText = socialProofTexts.join('\n\n--- Next Page ---\n\n').substring(0, 12000);
          
          // First, analyze the website itself for social proof
          console.log('[acquire_context_field] Extracting social proof from website...');
          const websiteSocialProof = await analyzeWithAI(config.aiPrompt!, combinedSocialText, origin);
          
          // Parse the result if it's a string
          let socialProofData: any;
          try {
            socialProofData = typeof websiteSocialProof === 'string' 
              ? JSON.parse(websiteSocialProof.replace(/```json\n?/g, '').replace(/```\n?/g, ''))
              : websiteSocialProof;
          } catch (e) {
            socialProofData = {
              testimonials: [],
              metrics: '',
              awards: '',
              badges: '',
              partners: ''
            };
          }

          // Now try to fetch external platform reviews with enhanced search
          console.log('[acquire_context_field] Fetching external platform reviews with enhanced search...');
          const companyDomain = new URL(origin).hostname.replace('www.', '');
          const companyName = socialProofData.companyName || companyDomain.split('.')[0];
          
          // 生成多个名称变体以提高匹配率
          const nameVariants = [
            companyDomain.replace(/\./g, '-'),        // seopage-ai
            companyDomain.replace(/\./g, ''),         // seopageai
            companyName,                               // seopage
            companyName + '-ai',                       // seopage-ai (如果 companyName 是 seopage)
          ];
          // 去重
          const uniqueVariants = [...new Set(nameVariants)];
          console.log(`[acquire_context_field] Trying name variants:`, uniqueVariants);
          
          const externalReviews: any[] = [];
          
          // Enhanced platform URLs with multiple attempts
          const platforms = [
            { 
              name: 'producthunt', 
              attempts: uniqueVariants.flatMap(variant => [
                `https://www.producthunt.com/products/${variant.toLowerCase()}`,
                `https://www.producthunt.com/posts/${variant.toLowerCase()}`,
              ])
            },
            { 
              name: 'trustpilot', 
              attempts: [
                `https://www.trustpilot.com/review/${companyDomain}`,
                `https://www.trustpilot.com/review/www.${companyDomain}`,
              ]
            },
            { 
              name: 'g2', 
              attempts: uniqueVariants.map(variant => 
                `https://www.g2.com/products/${variant.toLowerCase()}/reviews`
              )
            },
            { 
              name: 'capterra', 
              attempts: uniqueVariants.map(variant => 
                `https://www.capterra.com/p/${variant.toLowerCase()}/`
              )
            },
          ];

          for (const platform of platforms) {
            let platformFound = false;
            
            for (const urlToTry of platform.attempts) {
              if (platformFound) break;
              
              try {
                console.log(`[acquire_context_field] Trying ${platform.name}: ${urlToTry}`);
                
                const platformResult = await getPageData(urlToTry);
                if (platformResult.success && platformResult.text && platformResult.html) {
                  const text = platformResult.text.toLowerCase();
                  const html = platformResult.html;
                  const domainLower = companyDomain.toLowerCase();
                  const nameLower = companyName.toLowerCase();
                  
                  // Check if page is valid (not 404 or empty search results)
                  const isValidPage = text.includes(nameLower) || 
                                     text.includes(domainLower.replace(/\./g, '')) ||
                                     html.includes(companyDomain);
                  
                  if (isValidPage && !text.includes('no results found') && !text.includes('page not found')) {
                    // Extract rating (multiple patterns)
                    let rating = null;
                    const ratingPatterns = [
                      /(\d+\.?\d*)\s*(?:out of|\/)\s*5/i,
                      /★\s*(\d+\.?\d*)/i,
                      /rating[:\s]+(\d+\.?\d*)/i,
                      /score[:\s]+(\d+\.?\d*)/i,
                      /"ratingValue":\s*"?(\d+\.?\d*)"?/i,
                    ];
                    for (const pattern of ratingPatterns) {
                      const match = html.match(pattern);
                      if (match) {
                        rating = match[1];
                        break;
                      }
                    }
                    
                    // Extract review count (multiple patterns)
                    let reviewCount = null;
                    const reviewPatterns = [
                      /(\d+[\d,]*)\s*(?:reviews?|ratings?)/i,
                      /"reviewCount":\s*"?(\d+[\d,]*)"?/i,
                      /based on\s+(\d+[\d,]*)\s+reviews/i,
                    ];
                    for (const pattern of reviewPatterns) {
                      const match = html.match(pattern);
                      if (match) {
                        reviewCount = match[1].replace(/,/g, '');
                        break;
                      }
                    }
                    
                    // Look for awards (especially ProductHunt badges)
                    const awards: string[] = [];
                    if (platform.name === 'producthunt') {
                      if (text.includes('product of the day')) awards.push('Product of the Day');
                      if (text.includes('product of the week')) awards.push('Product of the Week');
                      if (text.includes('product of the month')) awards.push('Product of the Month');
                      if (text.includes('golden kitty')) awards.push('Golden Kitty Award');
                      if (html.match(/#\d+\s+product of the day/i)) {
                        const rank = html.match(/#(\d+)\s+product of the day/i)?.[1];
                        if (rank) awards.push(`#${rank} Product of the Day`);
                      }
                    }
                    
                    // Try to extract upvotes/likes for ProductHunt
                    let upvotes = null;
                    if (platform.name === 'producthunt') {
                      const upvoteMatch = html.match(/(\d+)\s*upvotes?/i);
                      if (upvoteMatch) upvotes = upvoteMatch[1];
                    }
                    
                    externalReviews.push({
                      platform: platform.name,
                      rating: rating,
                      reviewCount: reviewCount,
                      upvotes: upvotes,
                      url: urlToTry,
                      awards: awards.length > 0 ? awards : undefined,
                      found: true
                    });
                    
                    platformFound = true;
                    console.log(`[acquire_context_field] ✅ Found ${platform.name} listing: rating=${rating}, reviews=${reviewCount}`);
                  }
                }
              } catch (e: any) {
                console.log(`[acquire_context_field] Could not fetch ${platform.name} (${urlToTry}): ${e.message}`);
              }
            }
            
            // If not found, still provide the search URL
            if (!platformFound) {
              const searchUrl = platform.name === 'producthunt' 
                ? `https://www.producthunt.com/search?q=${encodeURIComponent(companyName)}`
                : platform.name === 'trustpilot'
                ? `https://www.trustpilot.com/search?query=${encodeURIComponent(companyName)}`
                : platform.name === 'g2'
                ? `https://www.g2.com/search?query=${encodeURIComponent(companyName)}`
                : `https://www.capterra.com/search/?search=${encodeURIComponent(companyName)}`;
              
              externalReviews.push({
                platform: platform.name,
                found: false,
                searchUrl: searchUrl,
                message: `自动抓取失败，请手动访问：${searchUrl}`
              });
            }
          }

          // Merge external reviews with website data
          socialProofData.externalReviews = externalReviews;
          socialProofData.companyName = companyName;
          socialProofData.companyDomain = companyDomain;
          
          await saveToDatabase(userId, projectId, config.dbType, JSON.stringify(socialProofData));
          extractedData = socialProofData;
          break;

        default:
          // Generic AI analysis
          extractedData = await analyzeWithAI(config.aiPrompt!, pageData.text, origin);
          await saveToDatabase(userId, projectId, config.dbType,
            typeof extractedData === 'string' ? extractedData : JSON.stringify(extractedData));
      }

      const duration = Date.now() - startTime;
      console.log(`[acquire_context_field] ✅ ${field} acquired in ${duration}ms from ${usedPage}`);

      return {
        success: true,
        field,
        data: extractedData,
        savedAs: config.dbType,
        sourcePage: usedPage,
        duration: `${duration}ms`,
        message: `✅ ${field} extracted and saved`
      };

    } catch (error: any) {
      console.error(`[acquire_context_field] ❌ Error acquiring ${field}:`, error);
      return {
        success: false,
        field,
        error: error.message,
        message: `❌ Failed to acquire ${field}: ${error.message}`
      };
    }
  }
});

// ========== Page Fetching ==========

async function getPageData(url: string): Promise<{ success: boolean; html?: string; text?: string; error?: string }> {
  const cached = scrapedDataCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[getPageData] Using cached data for ${url}`);
    return { success: true, html: cached.html, text: cached.text };
  }

  try {
    console.log(`[getPageData] Fetching ${url}...`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const html = await response.text();
    const text = cleanText(html);

    scrapedDataCache.set(url, { html, text, timestamp: Date.now() });

    return { success: true, html, text };
  } catch (error: any) {
    console.log(`[getPageData] Failed to fetch ${url}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ========== Intelligent Page Discovery ==========

/**
 * 智能页面发现：根据字段类型从sitemap和导航中找到最相关的页面
 */
async function discoverRelevantPages(field: string, origin: string, homePageHtml: string): Promise<string[]> {
  const discovered: string[] = [];
  
  // 定义每个字段的关键词模式
  const fieldKeywords: Record<string, string[]> = {
    'leadership-team': ['team', 'leadership', 'about', 'management', 'founders', 'people', 'executive', 'who-we-are'],
    'industries': ['industries', 'verticals', 'sectors', 'solutions', 'customers', 'case-studies', 'use-cases'],
    'products-services': ['products', 'services', 'pricing', 'features', 'solutions', 'offerings', 'plans'],
    'faq': ['faq', 'help', 'support', 'questions', 'knowledge', 'docs'],
    'about-us': ['about', 'company', 'story', 'mission', 'values', 'who-we-are'],
    'use-cases': ['use-cases', 'solutions', 'examples', 'customers', 'case-studies', 'applications'],
    'who-we-serve': ['customers', 'industries', 'for-', 'solutions', 'who-we-serve', 'target'],
    'contact-info': ['contact', 'get-in-touch', 'reach-us', 'reach-out', 'connect', 'office', 'location'],
    'social-proof': ['testimonials', 'reviews', 'customers', 'case-studies', 'success', 'clients', 'wall-of-love'],
  };
  
  const keywords = fieldKeywords[field] || [];
  if (keywords.length === 0) return [];
  
  // 1. 从sitemap中查找相关页面
  try {
    const cached = sitemapCache.get(origin);
    let sitemapUrls: string[] = [];
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      sitemapUrls = cached.urls;
    } else {
      const sitemapResult = await fetchSitemap(origin);
      if (sitemapResult.found && sitemapResult.urls) {
        sitemapUrls = sitemapResult.urls;
        sitemapCache.set(origin, { urls: sitemapUrls, timestamp: Date.now() });
      }
    }
    
    // 根据关键词过滤sitemap URLs
    for (const url of sitemapUrls) {
      try {
        const pathname = new URL(url).pathname.toLowerCase();
        // 检查路径是否包含任何关键词
        if (keywords.some(kw => pathname.includes(kw.toLowerCase()))) {
          discovered.push(url);
        }
      } catch (e) {
        continue;
      }
    }
  } catch (e) {
    console.log(`[discoverRelevantPages] Sitemap search failed: ${e}`);
  }
  
  // 2. 从导航链接中查找
  const navLinks = extractNavigationLinks(homePageHtml, origin);
  for (const link of navLinks) {
    try {
      const pathname = new URL(link).pathname.toLowerCase();
      if (keywords.some(kw => pathname.includes(kw.toLowerCase()))) {
        discovered.push(link);
      }
    } catch (e) {
      continue;
    }
  }
  
  // 3. 去重并限制数量
  const unique = [...new Set(discovered)];
  console.log(`[discoverRelevantPages] Found ${unique.length} relevant pages for ${field}`);
  
  // 按关键词相关性排序（包含更多关键词的页面排在前面）
  unique.sort((a, b) => {
    const aScore = keywords.filter(kw => a.toLowerCase().includes(kw.toLowerCase())).length;
    const bScore = keywords.filter(kw => b.toLowerCase().includes(kw.toLowerCase())).length;
    return bScore - aScore;
  });
  
  return unique.slice(0, 5); // 最多返回5个相关页面
}

// ========== Navigation Discovery ==========

function extractNavigationLinks(html: string, origin: string): string[] {
  const cached = navigationCache.get(origin);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.links;
  }

  const links: Set<string> = new Set();
  
  // Find links in header/nav
  const navPatterns = [
    /<header[^>]*>([\s\S]*?)<\/header>/gi,
    /<nav[^>]*>([\s\S]*?)<\/nav>/gi,
  ];

  let navHtml = '';
  for (const pattern of navPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      navHtml += match[1];
    }
  }

  // Extract href values
  const hrefPattern = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = hrefPattern.exec(navHtml)) !== null) {
    const href = match[1];
    if (href.startsWith('/') && !href.startsWith('//')) {
      links.add(origin + href);
    } else if (href.startsWith(origin)) {
      links.add(href);
    }
  }

  const linkArray = Array.from(links);
  navigationCache.set(origin, { links: linkArray, timestamp: Date.now() });
  
  return linkArray;
}

// ========== Database Save ==========

async function saveToDatabase(
  userId: string, 
  projectId: string, 
  type: string, 
  content: string,
  extras?: any
): Promise<void> {
  const upsertData: any = {
    user_id: userId,
    project_id: projectId,
    type,
    content,
    updated_at: new Date().toISOString()
  };

  // Add brand asset fields if provided
  if (extras) {
    // Logo & Favicon (use correct DB column names!)
    if (extras.logo) upsertData.file_url = extras.logo;
    if (extras.logoLightUrl || extras.logo) upsertData.logo_light = extras.logoLightUrl || extras.logo;
    if (extras.logoDarkUrl) upsertData.logo_dark = extras.logoDarkUrl;
    if (extras.faviconLightUrl || extras.favicon) upsertData.icon_light = extras.faviconLightUrl || extras.favicon;
    if (extras.faviconDarkUrl) upsertData.icon_dark = extras.faviconDarkUrl;
    if (extras.favicon) upsertData.favicon = extras.favicon;
    
    // Colors
    if (extras.primaryColor) upsertData.primary_color = extras.primaryColor;
    if (extras.secondaryColor) upsertData.secondary_color = extras.secondaryColor;
    
    // Typography
    if (extras.headingFont || extras.fonts?.[0]) upsertData.heading_font = extras.headingFont || extras.fonts?.[0];
    if (extras.bodyFont || extras.fonts?.[1] || extras.fonts?.[0]) {
      upsertData.body_font = extras.bodyFont || extras.fonts?.[1] || extras.fonts?.[0];
    }
    
    // Brand Info
    if (extras.brandName) upsertData.brand_name = extras.brandName;
    if (extras.metaDescription) upsertData.meta_description = extras.metaDescription;
    if (extras.ogImage) upsertData.og_image = extras.ogImage;
    if (extras.tone) upsertData.tone = extras.tone;
    if (extras.languages || extras.language) upsertData.languages = extras.languages || extras.language;
  }

  const { error } = await supabase
    .from('site_contexts')
    .upsert(upsertData, { onConflict: 'user_id,project_id,type' });

  if (error) {
    console.error(`[saveToDatabase] Error saving ${type}:`, error);
    throw error;
  }
  
  console.log(`[saveToDatabase] ✅ Saved ${type}`, 
    Object.keys(upsertData).filter(k => !['user_id', 'project_id', 'type', 'content', 'updated_at'].includes(k)));
}

// ========== Regex Extractors ==========

function extractBrandAssets(html: string, origin: string): any {
  // Decode HTML entities in URLs (e.g., &amp; -> &)
  const decodeHtmlEntities = (str: string): string => {
    if (!str) return str;
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/');
  };

  const resolveUrl = (url: string) => {
    if (!url) return null;
    // First decode HTML entities
    url = decodeHtmlEntities(url);
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('/')) return origin + url;
    if (url.startsWith('http')) return url;
    return origin + '/' + url;
  };
  
  // Logo - multiple patterns
  const logoPatterns = [
    /<img[^>]*class="[^"]*logo[^"]*"[^>]*src=["']([^"']+)["']/gi,
    /<img[^>]*src=["']([^"']+)["'][^>]*class="[^"]*logo[^"]*"/gi,
    /<a[^>]*class="[^"]*logo[^"]*"[^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/gi,
    /<img[^>]*alt="[^"]*logo[^"]*"[^>]*src=["']([^"']+)["']/gi,
    /<header[^>]*>[\s\S]*?<a[^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/gi,
  ];
  let logoLight = null;
  for (const pattern of logoPatterns) {
    const match = pattern.exec(html);
    if (match?.[1] && !match[1].includes('data:image')) {
      logoLight = resolveUrl(match[1]);
      break;
    }
  }
  
  // Dark logo variant
  const darkLogoMatch = html.match(/data-dark-src=["']([^"']+)["']/i) ||
                        html.match(/class="[^"]*logo[^"]*dark[^"]*"[^>]*src=["']([^"']+)["']/i);
  const logoDark = darkLogoMatch ? resolveUrl(darkLogoMatch[1]) : null;

  // Favicon - multiple patterns with priority
  const faviconPatterns = [
    /<link[^>]*rel=["']icon["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*rel=["']shortcut icon["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']icon["']/i,
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']shortcut icon["']/i,
    /<link[^>]*rel=["']apple-touch-icon[^"]*["'][^>]*href=["']([^"']+)["']/i,
  ];
  let faviconLight = null;
  for (const p of faviconPatterns) {
    const m = html.match(p);
    if (m?.[1]) {
      faviconLight = resolveUrl(m[1]);
      break;
    }
  }
  // Default fallback
  if (!faviconLight) faviconLight = origin + '/favicon.ico';

  // Colors - CSS variables and hex
  let primaryColor = null;
  let secondaryColor = null;
  
  // Check CSS variables first (most reliable)
  const primaryVarPatterns = [
    /--(?:primary|brand|main|theme)[-_]?(?:color)?\s*:\s*(#[0-9A-Fa-f]{3,6}|rgb[a]?\([^)]+\))/i,
    /--color[-_]?(?:primary|brand|main)\s*:\s*(#[0-9A-Fa-f]{3,6}|rgb[a]?\([^)]+\))/i,
  ];
  const secondaryVarPatterns = [
    /--(?:secondary|accent)[-_]?(?:color)?\s*:\s*(#[0-9A-Fa-f]{3,6}|rgb[a]?\([^)]+\))/i,
    /--color[-_]?(?:secondary|accent)\s*:\s*(#[0-9A-Fa-f]{3,6}|rgb[a]?\([^)]+\))/i,
  ];
  
  for (const p of primaryVarPatterns) {
    const m = html.match(p);
    if (m) { primaryColor = m[1]; break; }
  }
  for (const p of secondaryVarPatterns) {
    const m = html.match(p);
    if (m) { secondaryColor = m[1]; break; }
  }
  
  // Fallback to finding common hex colors
  if (!primaryColor || !secondaryColor) {
    const colorMatches = html.match(/#([0-9A-Fa-f]{6})\b/g) || [];
    const neutrals = new Set([
      '#FFFFFF', '#000000', '#EEEEEE', '#F5F5F5', '#FAFAFA', '#F9FAFB',
      '#333333', '#666666', '#999999', '#CCCCCC', '#E5E5E5', '#E5E7EB',
      '#111827', '#374151', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB',
    ].map(c => c.toUpperCase()));
    
    const brandColors = [...new Set(colorMatches.map(c => c.toUpperCase()))]
      .filter(c => !neutrals.has(c));
    
    if (!primaryColor && brandColors.length > 0) primaryColor = brandColors[0];
    if (!secondaryColor && brandColors.length > 1) secondaryColor = brandColors[1];
  }

  // Fonts - 区分标题字体和正文字体
  console.log('[extractBrandAssets] Starting font extraction...');
  
  // 1. 从 Google Fonts 提取
  const fontMatches = html.match(/fonts\.googleapis\.com\/css2?\?family=([^"'&\s]+)/gi) || [];
  const googleFonts = fontMatches.map(m => {
    const family = m.match(/family=([^"'&\s:]+)/)?.[1] || '';
    return decodeURIComponent(family).replace(/\+/g, ' ');
  }).filter(f => f.length > 0);
  const uniqueGoogleFonts = [...new Set(googleFonts)];
  console.log(`[extractBrandAssets] Found ${uniqueGoogleFonts.length} Google Fonts:`, uniqueGoogleFonts);

  // 2. 从 CSS 中提取特定选择器的字体
  let headingFont = null;
  let bodyFont = null;
  
  // 尝试匹配标题字体 (h1, h2, h3, heading)
  const headingFontPatterns = [
    /h1[^{]*\{[^}]*font-family:\s*["']?([^;,"'\}]+)/is,
    /h2[^{]*\{[^}]*font-family:\s*["']?([^;,"'\}]+)/is,
    /h3[^{]*\{[^}]*font-family:\s*["']?([^;,"'\}]+)/is,
    /\.heading[^{]*\{[^}]*font-family:\s*["']?([^;,"'\}]+)/is,
    /\.title[^{]*\{[^}]*font-family:\s*["']?([^;,"'\}]+)/is,
    /--font-heading:\s*["']?([^;,"'\}]+)/i,
    /--heading-font:\s*["']?([^;,"'\}]+)/i,
  ];
  
  for (const pattern of headingFontPatterns) {
    const match = html.match(pattern);
    if (match) {
      const font = match[1].trim().split(',')[0].replace(/["']/g, '').trim();
      if (!font.includes('system') && !font.includes('sans-serif') && !font.includes('serif') && !font.includes('monospace')) {
        headingFont = font;
        console.log(`[extractBrandAssets] Found heading font from CSS: ${font}`);
        break;
      }
    }
  }
  
  // 尝试匹配正文字体 (body, p, base, root)
  const bodyFontPatterns = [
    /body[^{]*\{[^}]*font-family:\s*["']?([^;,"'\}]+)/is,
    /:root[^{]*\{[^}]*font-family:\s*["']?([^;,"'\}]+)/is,
    /\*[^{]*\{[^}]*font-family:\s*["']?([^;,"'\}]+)/is,
    /html[^{]*\{[^}]*font-family:\s*["']?([^;,"'\}]+)/is,
    /p[^{]*\{[^}]*font-family:\s*["']?([^;,"'\}]+)/is,
    /\.text[^{]*\{[^}]*font-family:\s*["']?([^;,"'\}]+)/is,
    /--font-body:\s*["']?([^;,"'\}]+)/i,
    /--body-font:\s*["']?([^;,"'\}]+)/i,
    /--font-sans:\s*["']?([^;,"'\}]+)/i,
  ];
  
  for (const pattern of bodyFontPatterns) {
    const match = html.match(pattern);
    if (match) {
      const font = match[1].trim().split(',')[0].replace(/["']/g, '').trim();
      if (!font.includes('system') && !font.includes('sans-serif') && !font.includes('serif') && !font.includes('monospace')) {
        bodyFont = font;
        console.log(`[extractBrandAssets] Found body font from CSS: ${font}`);
        break;
      }
    }
  }
  
  // 3. 如果从 CSS 没找到，使用 Google Fonts 列表推断
  if (!headingFont && uniqueGoogleFonts.length > 0) {
    headingFont = uniqueGoogleFonts[0];
    console.log(`[extractBrandAssets] Using first Google Font for heading: ${headingFont}`);
  }
  if (!bodyFont && uniqueGoogleFonts.length > 1) {
    bodyFont = uniqueGoogleFonts[1];
    console.log(`[extractBrandAssets] Using second Google Font for body: ${bodyFont}`);
  } else if (!bodyFont && uniqueGoogleFonts.length > 0) {
    // 如果只有一个字体，标题和正文可能用同一个
    bodyFont = uniqueGoogleFonts[0];
    console.log(`[extractBrandAssets] Using same Google Font for both: ${bodyFont}`);
  }
  
  // 4. 最后的 fallback：从全局 font-family 提取
  if (!headingFont && !bodyFont) {
    const fontFamilyMatch = html.match(/font-family:\s*["']?([^;,"']+)/i);
    if (fontFamilyMatch) {
      const font = fontFamilyMatch[1].trim().split(',')[0].replace(/["']/g, '').trim();
      if (!font.includes('system-ui')) {
        bodyFont = font;
        headingFont = font;
        console.log(`[extractBrandAssets] Using global font-family: ${font}`);
      }
    }
  }
  
  console.log(`[extractBrandAssets] Final fonts - Heading: ${headingFont || 'null'}, Body: ${bodyFont || 'null'}`);

  // Metadata
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaTitle = titleMatch?.[1]?.trim() || null;
  
  const metaDescPatterns = [
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i,
  ];
  let metaDescription = null;
  for (const p of metaDescPatterns) {
    const m = html.match(p);
    if (m) { metaDescription = decodeHtmlEntities(m[1]); break; }
  }
  
  // Meta Keywords
  const metaKeywordsPatterns = [
    /<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']keywords["']/i,
  ];
  let metaKeywords = null;
  for (const p of metaKeywordsPatterns) {
    const m = html.match(p);
    if (m) { metaKeywords = decodeHtmlEntities(m[1]); break; }
  }
  
  // OG Image
  const ogImagePatterns = [
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
  ];
  let ogImage = null;
  for (const p of ogImagePatterns) {
    const m = html.match(p);
    if (m) { ogImage = resolveUrl(m[1]); break; }
  }
  
  // Language
  const langMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i);
  const language = langMatch ? langMatch[1] : 'en';

  // Brand name from title (first part before | - etc)
  const brandName = metaTitle?.split(/[\|–—-]/)[0]?.trim() || null;

  return {
    logo: logoLight,
    logoLightUrl: logoLight,
    logoDarkUrl: logoDark,
    faviconLightUrl: faviconLight,
    faviconDarkUrl: null,
    favicon: faviconLight,
    primaryColor,
    secondaryColor,
    metaTitle,      // Full <title> tag content
    metaKeywords,   // Meta keywords
    // tone will be added by AI analysis in brand-assets case
    headingFont,    // 标题字体（从 h1/h2 或第一个 Google Font）
    bodyFont,       // 正文字体（从 body/p 或第二个 Google Font）
    fonts: uniqueGoogleFonts,  // 所有 Google Fonts
    brandName,
    metaDescription,
    ogImage,
    language,
  };
}

function extractHeroSection(html: string): any {
  // Find hero section
  const heroPatterns = [
    /<section[^>]*(?:class|id)="[^"]*hero[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
    /<div[^>]*(?:class|id)="[^"]*hero[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<section[^>]*(?:class|id)="[^"]*banner[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
  ];

  let heroHtml = '';
  for (const pattern of heroPatterns) {
    const match = html.match(pattern);
    if (match) {
      heroHtml = match[1];
      break;
    }
  }

  // Fallback: content after header
  if (!heroHtml) {
    const afterHeader = html.match(/<\/header>[\s\S]*?(<section[^>]*>[\s\S]{200,2000}?<\/section>)/i);
    if (afterHeader) heroHtml = afterHeader[1];
  }

  // Extract components
  const h1Match = heroHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h2Match = heroHtml.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  const pMatch = heroHtml.match(/<p[^>]*class="[^"]*(?:sub|desc|lead)[^"]*"[^>]*>([\s\S]*?)<\/p>/i) ||
                 heroHtml.match(/<h1[^>]*>[\s\S]*?<\/h1>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
  
  const ctaPatterns = [
    /<(?:a|button)[^>]*class="[^"]*(?:btn|button|cta)[^"]*"[^>]*>([\s\S]*?)<\/(?:a|button)>/gi,
    /<a[^>]*href[^>]*class="[^"]*(?:primary|main)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi,
  ];
  let cta = '';
  for (const p of ctaPatterns) {
    const m = p.exec(heroHtml);
    if (m) { cta = cleanText(m[1]); break; }
  }

  // Look for metrics/stats
  const metricsPattern = /(\d+(?:,\d{3})*(?:\.\d+)?[%+]?\s*(?:customers?|users?|companies?|downloads?|reviews?|rating|stars?))/gi;
  const metrics = [...heroHtml.matchAll(metricsPattern)].map(m => m[1]).slice(0, 5);

  return {
    headline: cleanText(h1Match?.[1] || ''),
    subheadline: cleanText(pMatch?.[1] || h2Match?.[1] || ''),
    callToAction: cta,
    metrics: metrics.join(', '),
    fullText: cleanText(heroHtml).substring(0, 500),
  };
}

function extractContactInfo(html: string): any {
  // Email
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const emails = [...new Set([...html.matchAll(emailRegex)].map(m => m[1]))]
    .filter(e => !e.includes('example.com') && !e.includes('wixpress') && !e.includes('sentry'));

  // Phone
  const phoneRegex = /(?:\+?[\d]{1,3}[-.\s]?)?\(?[\d]{3}\)?[-.\s]?[\d]{3}[-.\s]?[\d]{4,6}/g;
  const phones = [...new Set([...html.matchAll(phoneRegex)].map(m => m[0].trim()))]
    .filter(p => p.length >= 10 && p.length <= 20);

  // Address
  const addressPatterns = [
    /<address[^>]*>([\s\S]*?)<\/address>/i,
    /(?:address|location|office)[^>]*>[\s\S]*?<(?:p|div)[^>]*>([\s\S]*?)<\/(?:p|div)>/i,
  ];
  let address = '';
  for (const p of addressPatterns) {
    const m = html.match(p);
    if (m) { address = cleanText(m[1]); break; }
  }

  // Social links
  const social: Record<string, string> = {};
  const socialPatterns = [
    { name: 'twitter', pattern: /href="(https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^"]+)"/i },
    { name: 'linkedin', pattern: /href="(https?:\/\/(?:www\.)?linkedin\.com\/[^"]+)"/i },
    { name: 'facebook', pattern: /href="(https?:\/\/(?:www\.)?facebook\.com\/[^"]+)"/i },
    { name: 'instagram', pattern: /href="(https?:\/\/(?:www\.)?instagram\.com\/[^"]+)"/i },
    { name: 'youtube', pattern: /href="(https?:\/\/(?:www\.)?youtube\.com\/[^"]+)"/i },
    { name: 'github', pattern: /href="(https?:\/\/(?:www\.)?github\.com\/[^"]+)"/i },
  ];
  for (const { name, pattern } of socialPatterns) {
    const match = html.match(pattern);
    if (match) social[name] = match[1];
  }

  return {
    emails: emails.slice(0, 5),
    phones: phones.slice(0, 3),
    address: address.substring(0, 200),
    social,
    primaryEmail: emails[0] || null,
    primaryPhone: phones[0] || null,
  };
}

/**
 * Clean URL by removing .html suffix for cleaner SEO-friendly URLs
 */
function cleanNavigationUrl(url: string): string {
  if (!url) return url;
  // Remove .html or .htm suffix (but keep external URLs with these as-is if they're truly needed)
  // Only clean internal paths
  if (url.startsWith('/') || !url.includes('://')) {
    return url.replace(/\.html?$/i, '');
  }
  // For full URLs, also clean the path portion
  try {
    const urlObj = new URL(url);
    urlObj.pathname = urlObj.pathname.replace(/\.html?$/i, '');
    return urlObj.toString();
  } catch {
    // If URL parsing fails, do simple replacement
    return url.replace(/\.html?$/i, '');
  }
}

async function extractHeader(html: string, origin: string, useAI: boolean = true): Promise<any> {
  const headerMatch = html.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
  const navMatch = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i);
  
  const headerHtml = headerMatch?.[1] || navMatch?.[1] || '';
  
  if (!headerHtml) {
    return {
      navigation: [],
      hasSearch: false,
      hasCTA: false,
      error: 'No header/nav found',
    };
  }

  // 如果启用AI且HTML较长，使用AI分析
  if (useAI && headerHtml.length > 100) {
    try {
      const aiPrompt = `分析以下网站 header HTML，提取导航结构。返回纯 JSON：
{
  "navigation": [{"text": "链接文字", "url": "链接地址"}],
  "hasSearch": true/false,
  "hasCTA": true/false,
  "ctaText": "CTA按钮文字（如果有）"
}

重要：URL 不要包含 .html 后缀，使用 SEO 友好的 URL 格式。

Header HTML:
${headerHtml.substring(0, 4000)}`;

      const { text } = await generateText({
        model: azure(process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1'),
        messages: [
          {
            role: 'system',
            content: 'Extract navigation structure from HTML. Return valid JSON only. URLs should NOT have .html suffix - use clean SEO-friendly paths.',
          },
          {
            role: 'user',
            content: aiPrompt,
          },
        ],
        temperature: 0,
      });

      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/g, '');
      }

      const aiResult = JSON.parse(cleanedText);
      
      // Clean URLs in navigation (in case AI still returns .html URLs)
      if (aiResult.navigation && Array.isArray(aiResult.navigation)) {
        aiResult.navigation = aiResult.navigation.map((item: any) => ({
          ...item,
          url: cleanNavigationUrl(item.url),
        }));
      }
      
      console.log('[extractHeader] ✅ AI 分析成功');
      return aiResult;
    } catch (err) {
      console.error('[extractHeader] AI 分析失败，使用正则 fallback:', err);
      // Fall through to regex extraction
    }
  }

  // Regex fallback
  const navItems: Array<{ text: string; url: string }> = [];
  const linkPattern = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  
  let match;
  while ((match = linkPattern.exec(headerHtml)) !== null) {
    const href = match[1];
    const label = cleanText(match[2]);
    if (label && !href.startsWith('#') && !href.includes('javascript:')) {
      // Clean the URL by removing .html suffix
      const cleanedHref = cleanNavigationUrl(href);
      navItems.push({
        text: label,
        url: cleanedHref.startsWith('/') ? origin + cleanedHref : cleanedHref,
      });
    }
  }

  // Dedupe by label
  const seen = new Set();
  const uniqueItems = navItems.filter(item => {
    if (seen.has(item.text.toLowerCase())) return false;
    seen.add(item.text.toLowerCase());
    return true;
  });

  return {
    navigation: uniqueItems.slice(0, 15),
    hasSearch: /search|搜索/i.test(headerHtml),
    hasCTA: /sign.?up|get.?started|try|demo|contact/i.test(headerHtml),
  };
}

async function extractFooter(html: string, origin: string): Promise<any> {
  // 1. 尝试寻找 <footer> 标签（首页的 footer 通常在这里）
  const footerMatch = html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i);
  let footerHtml = footerMatch ? footerMatch[0] : '';

  // 2. 如果没找到 <footer> 标签，寻找 class 包含 footer 的 div 作为兜底
  if (!footerHtml) {
    const footerDivMatch = html.match(/<div[^>]*class="[^"]*footer[^"]*"[^>]*>([\s\S]*?)<\/div>(?:\s*<\/body>|\s*<\/html>|$)/i);
    if (footerDivMatch) {
      footerHtml = footerDivMatch[0];
    }
  }

  // 3. 如果还是没找到，取页面最后 8000 字符（通常 footer 在这里）
  if (!footerHtml || footerHtml.length < 100) {
    const bodyEnd = html.toLowerCase().lastIndexOf('</body>');
    const start = Math.max(0, (bodyEnd > 0 ? bodyEnd : html.length) - 8000);
    footerHtml = html.substring(start, bodyEnd > 0 ? bodyEnd : html.length);
  }

  try {
    console.log(`[extractFooter] Step 1/2: 自由提取原始结构 (${footerHtml.length} chars)...`);
    
    // === STEP 1: 自由提取原始结构 ===
    const step1Prompt = `分析以下网站底部（Footer）区域的 HTML，提取**所有**信息，保留原始结构。

⚠️ 重要提示：Footer 通常包含多个导航列（如 "Products"、"Company"、"Resources" 等），
每一列下面有多个链接。请**仔细查找**所有这些导航列和链接，不要遗漏！

返回纯 JSON：
{
  "companyInfo": {
    "name": "公司名称（如果有）",
    "tagline": "标语或简介（如果有）",
    "description": "公司描述（如果有）"
  },
  "navigationColumns": [
    {
      "title": "列标题（如 'Products', 'Company', 'Support' 等）",
      "links": [{"text": "链接文字", "url": "完整链接地址"}]
    }
  ],
  "statsOrMetrics": [
    {
      "label": "统计标签（如 'Happy Users'）",
      "value": "数值（如 '50,000+'）"
    }
  ],
  "socialMedia": [
    {"platform": "平台名（如 twitter/facebook/linkedin/github/instagram）", "url": "链接"}
  ],
  "newsletter": {
    "exists": true/false,
    "heading": "Newsletter 标题",
    "description": "描述文字",
    "iframe": "iframe URL（如果有）"
  },
  "cta": [
    {"text": "CTA 按钮文字", "url": "链接地址"}
  ],
  "legalLinks": [
    {"text": "底部法律链接（如 Privacy, Terms）", "url": "链接"}
  ],
  "copyright": "版权信息"
}

要求：
1. **navigationColumns 是重点**：仔细查找所有导航列和链接，通常在 footer 中部
2. 相对路径补全 origin: ${origin}
3. 只返回 JSON，不要解释文字
4. 如果某个区块不存在，设为 null 或空数组

HTML Content:
${footerHtml.substring(0, 15000)}`;  // 增加到 15000 字符

    const step1Response = await generateText({
      model: azure(process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1'),
      messages: [
        {
          role: 'system',
          content: 'You are a professional web content analyzer. Extract all information from the footer HTML. Return valid JSON only.',
        },
        {
          role: 'user',
          content: step1Prompt,
        },
      ],
      temperature: 0,
    });

    let rawData = step1Response.text.trim();
    if (rawData.startsWith('```json')) {
      rawData = rawData.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (rawData.startsWith('```')) {
      rawData = rawData.replace(/```\n?/g, '');
    }

    const extractedRaw = JSON.parse(rawData);
    console.log('[extractFooter] ✅ Step 1 完成: 原始数据提取成功');

    // === STEP 2: 转换成标准格式 ===
    console.log('[extractFooter] Step 2/2: 转换成标准格式...');
    
    const step2Prompt = `将以下 footer 原始数据转换成标准格式。

原始数据：
${JSON.stringify(extractedRaw, null, 2)}

转换成以下格式的纯 JSON：
{
  "companyName": "公司名称",
  "tagline": "标语或简介",
  "columns": [
    {
      "title": "列标题",
      "links": [{"label": "链接文字", "url": "链接地址"}]
    }
  ],
  "socialMedia": [
    {"platform": "twitter/facebook/linkedin/github/instagram", "url": "链接地址"}
  ],
  "copyright": "版权信息"
}

转换规则：
1. **将 navigationColumns 转换成 columns**（这是重点！）
2. links 字段中的 "text" → "label"
3. platform 必须是标准名称（twitter/facebook/linkedin/github/instagram）
4. 如果 companyName 为空，用域名或品牌名
5. 如果原始数据中有 statsOrMetrics 或 newsletter，忽略它们（这些不适合标准格式）
6. legalLinks 可以作为单独的一列添加到 columns 末尾（标题为 "Legal" 或 "Company"）
7. 只返回 JSON，不要解释

开始转换：`;

    const step2Response = await generateText({
      model: azure(process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1'),
      messages: [
        {
          role: 'system',
          content: 'You are a data transformer. Convert the raw footer data into standard format. Return valid JSON only.',
        },
        {
          role: 'user',
          content: step2Prompt,
        },
      ],
      temperature: 0,
    });

    let standardData = step2Response.text.trim();
    if (standardData.startsWith('```json')) {
      standardData = standardData.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (standardData.startsWith('```')) {
      standardData = standardData.replace(/```\n?/g, '');
    }

    const result = JSON.parse(standardData);
    console.log('[extractFooter] ✅ Step 2 完成: 标准格式转换成功');
    
    // 附加原始数据（可选，供调试或高级用户使用）
    result._raw = extractedRaw;
    
    return result;
  } catch (err) {
    console.error('[extractFooter] 两步提取失败:', err);
    return {
      companyName: '',
      columns: [],
      socialMedia: [],
      copyright: '',
      error: `Two-step extraction failed: ${err instanceof Error ? err.message : String(err)}`
    };
  }
}

async function fetchSitemap(origin: string): Promise<any> {
  const sitemapUrls = [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap-index.xml`,
  ];

  for (const sitemapUrl of sitemapUrls) {
    try {
      const response = await fetch(sitemapUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        const xml = await response.text();
        const urls: string[] = [];
        const locRegex = /<loc>([^<]+)<\/loc>/gi;
        let match;
        while ((match = locRegex.exec(xml)) !== null) {
          const loc = match[1].trim();
          if (!loc.endsWith('.xml')) {
            urls.push(loc);
          }
        }
        
        return { 
          found: true, 
          url: sitemapUrl, 
          urls: urls.slice(0, 500),
          count: urls.length 
        };
      }
    } catch (e) {
      continue;
    }
  }
  
  return { found: false, urls: [], count: 0 };
}

function classifyPages(urls: string[], origin: string): any {
  const keyPages: string[] = [];
  const landingPages: string[] = [];
  const blogPages: string[] = [];

  const keyPatterns = [
    /^\/?$/, /^\/about/i, /^\/pricing/i, /^\/features/i, /^\/contact/i, 
    /^\/faq/i, /^\/team/i, /^\/careers/i, /^\/products?$/i, /^\/services?$/i,
  ];
  const blogPatterns = [/^\/blog/i, /^\/news/i, /^\/articles?/i, /^\/posts?/i, /^\/resources/i];
  const landingPatterns = [/^\/lp\//i, /\/vs\//i, /\/alternative/i, /\/for-/i, /\/compare/i];

  for (const url of urls) {
    try {
      // Ensure we have a full URL
      let fullUrl: string;
      if (url.startsWith('http://') || url.startsWith('https://')) {
        fullUrl = url;
      } else {
        // Relative path, prepend origin
        fullUrl = origin + (url.startsWith('/') ? url : '/' + url);
      }
      
      const pathname = new URL(fullUrl).pathname;
      if (blogPatterns.some(p => p.test(pathname))) {
        blogPages.push(fullUrl);
      } else if (landingPatterns.some(p => p.test(pathname))) {
        landingPages.push(fullUrl);
      } else if (keyPatterns.some(p => p.test(pathname)) || pathname.split('/').filter(Boolean).length <= 1) {
        keyPages.push(fullUrl);
      }
    } catch (e) {
      continue;
    }
  }

  return {
    keyPages: keyPages.slice(0, 30),
    landingPages: landingPages.slice(0, 30),
    blogPages: blogPages.slice(0, 30),
    counts: {
      key: keyPages.length,
      landing: landingPages.length,
      blog: blogPages.length,
    }
  };
}

// ========== AI Analysis ==========

interface AnalyzeOptions {
  maxTokens?: number;
  maxContentChars?: number;
}

async function analyzeWithAI(
  prompt: string, 
  pageText: string, 
  url: string,
  options: AnalyzeOptions = {}
): Promise<any> {
  const maxContentChars = options.maxContentChars || 8000;
  const maxTokens = options.maxTokens || 1500;
  
  const fullPrompt = `Website: ${url}

Content (truncated to ${maxContentChars} chars):
${pageText.substring(0, maxContentChars)}

${prompt}

IMPORTANT: Return ONLY valid JSON. Do not include any explanation, notes, or text outside the JSON structure.`;

  try {
    const { text } = await generateText({
      model: azure(process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1'),
      prompt: fullPrompt,
      maxTokens: maxTokens,
    });

    // Try to extract JSON from the response
    let trimmed = text.trim();
    
    // Remove markdown code blocks if present
    trimmed = trimmed.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Try to extract JSON object or array from content with extra text
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      const isArray = trimmed.startsWith('[');
      const openChar = isArray ? '[' : '{';
      const closeChar = isArray ? ']' : '}';
      
      // Find the matching closing bracket/brace
      let depth = 0;
      let endIndex = -1;
      let inString = false;
      let prevChar = '';
      
      for (let i = 0; i < trimmed.length; i++) {
        const char = trimmed[i];
        
        // Handle string escaping
        if (char === '"' && prevChar !== '\\') {
          inString = !inString;
        }
        
        if (!inString) {
          if (char === openChar) depth++;
          if (char === closeChar) depth--;
          if (depth === 0) {
            endIndex = i + 1;
            break;
          }
        }
        prevChar = char;
      }
      
      if (endIndex > 0) {
        const jsonPart = trimmed.substring(0, endIndex);
        try {
          return JSON.parse(jsonPart);
        } catch (e) {
          console.log('[analyzeWithAI] Failed to parse extracted JSON:', jsonPart.substring(0, 100));
        }
      }
    }

    // Fallback: try to parse as-is
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  } catch (error: any) {
    console.error(`[analyzeWithAI] Error:`, error);
    return { error: error.message };
  }
}

// ========== Utilities ==========

function cleanText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
