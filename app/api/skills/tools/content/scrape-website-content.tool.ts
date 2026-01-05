import { tool, generateText } from 'ai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { createAzure } from '@ai-sdk/azure';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const azure = createAzure({
  apiKey: process.env.AZURE_OPENAI_API_KEY || '',
  resourceName: process.env.AZURE_OPENAI_ENDPOINT?.replace('https://', '').replace('.openai.azure.com', '') || '',
});

// =====================================================
// 字段定义：每个字段都有自己的目标页面和提取方式
// =====================================================
interface FieldDefinition {
  type: string;
  name: string;
  targetPaths: string[]; // 优先级从高到低
  method: 'regex' | 'ai' | 'fetch';
  aiPrompt?: string;
}

const FIELD_DEFINITIONS: FieldDefinition[] = [
  // === 正则提取类 (首页 <head> 标签) ===
  { type: 'logo', name: 'Brand Assets', targetPaths: ['homepage'], method: 'regex' },
  
  // === AI 分析类 ===
  { type: 'header', name: 'Header Structure', targetPaths: ['homepage'], method: 'ai',
    aiPrompt: `分析网页的 header/导航区域，提取：
1. navigation: 导航链接数组 [{text, url}]
2. hasSearch: 是否有搜索框
3. hasCTA: 是否有 CTA 按钮
4. ctaText: CTA 按钮文字
返回 JSON 格式。` },
  
  { type: 'footer', name: 'Footer Structure', targetPaths: ['homepage'], method: 'ai',
    aiPrompt: `分析网页的 footer 区域，提取：
1. columns: 链接分组 [{title, links: [{text, url}]}]
2. socialLinks: 社交媒体链接
3. copyright: 版权信息
4. address: 地址信息
返回 JSON 格式。` },
  
  { type: 'hero-section', name: 'Hero Section', targetPaths: ['homepage'], method: 'ai',
    aiPrompt: `分析网页的 hero/banner 区域（通常是页面顶部的大标题区域），提取：
1. headline: 主标题
2. subheadline: 副标题
3. callToAction: CTA 按钮文字
4. secondaryCTA: 次要 CTA 文字
5. metrics: 数字指标数组 [{value, label}] 如 "10K+ users"
6. backgroundType: 背景类型 (image/video/gradient/solid)
返回 JSON 格式。如果找不到明显的 hero section，返回 null。` },
  
  { type: 'social-proof-trust', name: 'Social Proof', targetPaths: ['homepage'], method: 'ai',
    aiPrompt: `分析网页，提取社会证明元素：
1. clientLogos: 客户/合作伙伴 logo 描述或公司名称数组
2. testimonials: 客户评价 [{quote, author, title, company}]
3. stats: 统计数字 [{value, label}] 如 "99% uptime"
4. awards: 获奖/认证信息
5. pressLogos: 媒体报道 logo
返回 JSON 格式。` },

  { type: 'problem-statement', name: 'Problem Statement', targetPaths: ['homepage', '/about', '/about-us'], method: 'ai',
    aiPrompt: `分析页面内容，回答：这家公司/产品解决什么问题？
提取：
1. problem: 核心问题描述
2. painPoints: 痛点列表
3. solution: 解决方案概述
返回 JSON 格式。` },

  { type: 'who-we-serve', name: 'Who We Serve', targetPaths: ['homepage', '/about', '/about-us', '/customers'], method: 'ai',
    aiPrompt: `分析页面内容，提取目标客户信息：
1. segments: 客户群体/细分市场数组
2. personas: 用户画像描述
3. companySize: 目标公司规模 (SMB/Enterprise/etc)
4. targetRoles: 目标用户角色
返回 JSON 格式。` },

  { type: 'about-us', name: 'About Us', targetPaths: ['/about', '/about-us', '/company', '/who-we-are'], method: 'ai',
    aiPrompt: `分析 About 页面，提取：
1. story: 公司故事/历史
2. mission: 使命
3. vision: 愿景
4. values: 核心价值观数组
5. founded: 成立时间
6. headquarters: 总部位置
7. employeeCount: 员工规模
返回 JSON 格式。` },

  { type: 'leadership-team', name: 'Leadership Team', targetPaths: ['/team', '/about/team', '/about-us/team', '/leadership', '/about#team'], method: 'ai',
    aiPrompt: `分析页面，提取领导团队信息：
members: [{
  name: 姓名,
  title: 职位,
  bio: 简介,
  linkedin: LinkedIn URL,
  twitter: Twitter URL,
  imageUrl: 头像 URL
}]
返回 JSON 格式。` },

  { type: 'products-services', name: 'Products & Services', targetPaths: ['/products', '/services', '/solutions', '/platform', '/features'], method: 'ai',
    aiPrompt: `分析页面，提取产品/服务信息：
items: [{
  name: 产品/服务名称,
  description: 描述,
  features: 特性数组,
  pricing: 价格信息（如有）
}]
返回 JSON 格式。` },

  { type: 'use-cases', name: 'Use Cases', targetPaths: ['/use-cases', '/solutions', '/case-studies', '/customers/stories'], method: 'ai',
    aiPrompt: `分析页面，提取使用场景：
useCases: [{
  title: 场景名称,
  description: 描述,
  industry: 相关行业,
  benefits: 收益/好处
}]
返回 JSON 格式。` },

  { type: 'industries', name: 'Industries', targetPaths: ['/industries', '/verticals', '/sectors', 'homepage'], method: 'ai',
    aiPrompt: `分析页面，提取服务的行业：
industries: [{
  name: 行业名称,
  description: 行业相关描述
}]
返回 JSON 格式。` },

  { type: 'faq', name: 'FAQ', targetPaths: ['/faq', '/faqs', '/help', '/support', '/help-center'], method: 'ai',
    aiPrompt: `分析页面，提取 FAQ 问答：
faqs: [{
  question: 问题,
  answer: 答案
}]
返回 JSON 格式。` },
];

export const scrape_website_content = tool({
  description: `精细化网站内容爬取工具。

工作流程：
1. 首先爬取首页，提取确定性信息（TDK、OG、Logo、Colors、Fonts 等）
2. 分析首页导航，发现二级页面 URL
3. 根据每个字段的目标页面，按需爬取并用 AI 分析

每个字段都有独立的提取策略，确保数据精准。`,

  parameters: z.object({
    url: z.string().describe('The website URL to scrape (e.g., https://example.com)'),
    userId: z.string().optional().describe('The user ID to save data directly to database'),
    projectId: z.string().optional().describe('The SEO project ID to scope the saved data'),
    fields: z.array(z.string()).optional().describe('Specific fields to extract. If empty, extracts all.'),
    skipAI: z.boolean().optional().describe('Skip AI analysis, only do regex extraction'),
  }),

  execute: async ({ url, userId, projectId, fields, skipAI = false }) => {
    const savedFields: string[] = [];
    const errors: string[] = [];
    const startTime = Date.now();
    
    // =====================================================
    // Helper: Save context to database
    // =====================================================
    const saveContext = async (type: string, content: string, extras?: any): Promise<boolean> => {
      if (!userId || !projectId) return false;
      try {
        const upsertData: any = {
          user_id: userId,
          project_id: projectId,
          type,
          content,
          updated_at: new Date().toISOString(),
          ...extras,
        };
        await supabase.from('site_contexts').upsert(upsertData, {
          onConflict: 'user_id,project_id,type',
        });
        savedFields.push(type);
        console.log(`[scraper] ✅ Saved: ${type}`);
        return true;
      } catch (err) {
        console.error(`[scraper] ❌ Failed to save ${type}:`, err);
        errors.push(`Failed to save ${type}`);
        return false;
      }
    };

    // =====================================================
    // Helper: Fetch a page
    // =====================================================
    const fetchPage = async (pageUrl: string): Promise<string | null> => {
      try {
        console.log(`[scraper] 📄 Fetching: ${pageUrl}`);
        const response = await fetch(pageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) return null;
        return await response.text();
      } catch (err) {
        console.log(`[scraper] ⚠️ Failed to fetch: ${pageUrl}`);
        return null;
      }
    };

    // =====================================================
    // Helper: AI Analysis (using Azure OpenAI)
    // =====================================================
    const analyzeWithAI = async (text: string, prompt: string): Promise<any> => {
      try {
        const fullPrompt = `你是一个网页内容分析专家。分析给定的网页文本，按要求提取结构化信息。
只返回 JSON 格式，不要添加任何解释。如果信息不存在，对应字段返回 null 或空数组。

${prompt}

---
网页内容：
${text.substring(0, 8000)}`;

        const { text: responseText } = await generateText({
          model: azure(process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1'),
          prompt: fullPrompt,
          maxTokens: 2000,
        });

        if (!responseText) return null;
        
        // Try to parse as JSON
        try {
          // Extract JSON from response if wrapped in markdown code blocks
          const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) || 
                           [null, responseText];
          return JSON.parse(jsonMatch[1] || responseText);
        } catch {
          // If not valid JSON, return as text
          return { text: responseText };
        }
      } catch (err) {
        console.error('[scraper] AI analysis error:', err);
        return null;
      }
    };

    try {
      console.log(`[scraper] 🚀 Starting fine-grained scrape: ${url}`);
      const baseUrl = new URL(url);
      const origin = baseUrl.origin;

      // =====================================================
      // PHASE 1: Scrape Homepage + Extract Regex-based Fields
      // =====================================================
      console.log(`[scraper] === PHASE 1: Homepage Scraping ===`);
      const homepageHtml = await fetchPage(url);
      if (!homepageHtml) {
        return { success: false, error: 'Failed to fetch homepage', url };
      }

      // --- Extract Meta Info (TDK, OG) ---
      const metaInfo = extractMetaInfo(homepageHtml);
      console.log(`[scraper] 📝 Extracted meta info:`, metaInfo);

      // --- Extract Logo & Favicon ---
      const logoFavicon = extractLogoFavicon(homepageHtml, origin);
      console.log(`[scraper] 🖼️ Extracted logo/favicon:`, logoFavicon);

      // --- Extract Colors ---
      const colors = extractColors(homepageHtml);
      console.log(`[scraper] 🎨 Extracted colors:`, colors);

      // --- Extract Typography ---
      const typography = extractTypography(homepageHtml);
      console.log(`[scraper] 🔤 Extracted typography:`, typography);

      // --- Extract Languages ---
      const languages = extractLanguages(homepageHtml);
      console.log(`[scraper] 🌐 Extracted languages:`, languages);

      // --- Extract Contact Info ---
      const contactInfo = extractContactInfo(homepageHtml);
      console.log(`[scraper] 📞 Extracted contact:`, contactInfo);

      // --- Combine and Save Brand Assets (logo type) ---
      const brandAssets = {
        // Meta
        metaTitle: metaInfo.title,
        metaDescription: metaInfo.description,
        metaKeywords: metaInfo.keywords,
        ogImage: metaInfo.ogImage,
        canonical: metaInfo.canonical,
        // Logo & Favicon
        logoLightUrl: logoFavicon.logoLight,
        logoDarkUrl: logoFavicon.logoDark,
        faviconLightUrl: logoFavicon.faviconLight,
        faviconDarkUrl: logoFavicon.faviconDark,
        allLogos: logoFavicon.allLogos,
        // Colors
        primaryColor: colors.primary,
        secondaryColor: colors.secondary,
        allColors: colors.all,
        // Typography
        headingFont: typography.heading,
        bodyFont: typography.body,
        allFonts: typography.all,
        // Languages
        language: languages.primary,
        alternativeLanguages: languages.alternatives,
        // Brand Name (from title)
        brandName: metaInfo.title?.split('|')[0]?.split('-')[0]?.split('–')[0]?.trim() || null,
      };

      // NOTE: Database columns are: logo_light, logo_dark, icon_light, icon_dark, favicon (NOT _url suffix!)
      await saveContext('logo', JSON.stringify(brandAssets), {
        file_url: brandAssets.logoLightUrl,
        logo_light: brandAssets.logoLightUrl,
        logo_dark: brandAssets.logoDarkUrl,
        icon_light: brandAssets.faviconLightUrl,
        icon_dark: brandAssets.faviconDarkUrl,
        favicon: brandAssets.faviconLightUrl,
        primary_color: brandAssets.primaryColor,
        secondary_color: brandAssets.secondaryColor,
        heading_font: brandAssets.headingFont,
        body_font: brandAssets.bodyFont,
        meta_description: brandAssets.metaDescription,
        og_image: brandAssets.ogImage,
        brand_name: brandAssets.brandName,
        languages: brandAssets.language,
      });

      // --- Save Contact Info ---
      if (contactInfo.emails?.length > 0 || contactInfo.phones?.length > 0 || Object.keys(contactInfo.social || {}).length > 0) {
        await saveContext('contact-information', JSON.stringify(contactInfo));
      }

      // =====================================================
      // PHASE 2: Discover Navigation Links (二级页面发现)
      // =====================================================
      console.log(`[scraper] === PHASE 2: Discovering Secondary Pages ===`);
      const navLinks = extractNavigationLinks(homepageHtml, origin);
      console.log(`[scraper] 🔗 Found ${navLinks.length} navigation links`);

      // Build page map for quick lookup
      const pageMap = buildPageMap(navLinks, origin);
      console.log(`[scraper] 📍 Page map:`, Object.keys(pageMap));

      // =====================================================
      // PHASE 3: Fetch Sitemap
      // =====================================================
      console.log(`[scraper] === PHASE 3: Fetching Sitemap ===`);
      const sitemapData = await fetchSitemap(origin);
      if (sitemapData.found) {
        await saveContext('sitemap', JSON.stringify({
          url: sitemapData.url,
          urls: sitemapData.urls.slice(0, 100), // Max 100 URLs
          totalCount: sitemapData.urls.length,
        }));
        
        // Classify pages
        const classified = classifyPages(sitemapData.urls, origin);
        if (classified.keyPages.length > 0) {
          await saveContext('key-website-pages', JSON.stringify({
            count: classified.keyPages.length,
            urls: classified.keyPages.slice(0, 30),
          }));
        }
        if (classified.landingPages.length > 0) {
          await saveContext('landing-pages', JSON.stringify({
            count: classified.landingPages.length,
            urls: classified.landingPages.slice(0, 30),
          }));
        }
        if (classified.blogPages.length > 0) {
          await saveContext('blog-resources', JSON.stringify({
            count: classified.blogPages.length,
            urls: classified.blogPages.slice(0, 30),
          }));
        }
      }

      // =====================================================
      // PHASE 4: AI Analysis for Each Field (按需爬取 + 分析)
      // =====================================================
      if (!skipAI) {
        console.log(`[scraper] === PHASE 4: AI Analysis per Field ===`);
        
        // Prepare homepage text for AI analysis
        const homepageText = extractCleanText(homepageHtml);
        
        // Determine which fields to process
        const fieldsToProcess = fields && fields.length > 0
          ? FIELD_DEFINITIONS.filter(f => fields.includes(f.type))
          : FIELD_DEFINITIONS.filter(f => f.method === 'ai');

        // Cache for fetched pages to avoid refetching
        const pageCache: Record<string, string> = {
          'homepage': homepageText,
        };

        for (const fieldDef of fieldsToProcess) {
          console.log(`[scraper] 🔍 Processing: ${fieldDef.name} (${fieldDef.type})`);
          
          let textToAnalyze: string | null = null;
          let sourceUrl = 'homepage';

          // Find the best available page for this field
          for (const targetPath of fieldDef.targetPaths) {
            if (targetPath === 'homepage') {
              textToAnalyze = homepageText;
              sourceUrl = url;
              break;
            }
            
            // Check if we have this page in pageMap
            const matchedUrl = pageMap[targetPath] || findMatchingUrl(targetPath, navLinks, origin);
            
            if (matchedUrl) {
              // Check cache first
              if (pageCache[matchedUrl]) {
                textToAnalyze = pageCache[matchedUrl];
                sourceUrl = matchedUrl;
                break;
              }
              
              // Fetch the page
              const pageHtml = await fetchPage(matchedUrl);
              if (pageHtml) {
                const pageText = extractCleanText(pageHtml);
                pageCache[matchedUrl] = pageText;
                textToAnalyze = pageText;
                sourceUrl = matchedUrl;
                break;
              }
            }
            
            // Try direct URL construction
            const directUrl = origin + targetPath;
            if (!pageCache[directUrl]) {
              const pageHtml = await fetchPage(directUrl);
              if (pageHtml) {
                const pageText = extractCleanText(pageHtml);
                pageCache[directUrl] = pageText;
                textToAnalyze = pageText;
                sourceUrl = directUrl;
                break;
              }
            }
          }

          if (!textToAnalyze) {
            console.log(`[scraper] ⚠️ No page found for ${fieldDef.type}, using homepage`);
            textToAnalyze = homepageText;
            sourceUrl = url;
          }

          // AI Analysis
          if (fieldDef.aiPrompt) {
            const result = await analyzeWithAI(textToAnalyze, fieldDef.aiPrompt);
            if (result && Object.keys(result).length > 0) {
              await saveContext(fieldDef.type, JSON.stringify({
                ...result,
                sourceUrl,
                extractedAt: new Date().toISOString(),
              }));
            }
          }
        }

        // === Special: Tone Analysis ===
        console.log(`[scraper] 🎭 Analyzing brand tone...`);
        const toneResult = await analyzeWithAI(homepageText, `分析这个网站的品牌语调和风格，返回：
{
  "tone": "主要语调 (如: Professional, Friendly, Casual, Formal, Playful, Authoritative)",
  "characteristics": ["特征1", "特征2", "特征3"],
  "targetAudience": "推断的目标受众"
}`);
        if (toneResult?.tone) {
          // Update the logo context with tone
          await supabase.from('site_contexts')
            .update({ tone: toneResult.tone })
            .eq('user_id', userId)
            .eq('project_id', projectId)
            .eq('type', 'logo');
          savedFields.push('tone');
        }
      }

      // =====================================================
      // DONE
      // =====================================================
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[scraper] ✅ Complete in ${duration}s. Saved: ${savedFields.join(', ')}`);

      return {
        success: true,
        url,
        duration: `${duration}s`,
        savedToDatabase: savedFields,
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          brandName: brandAssets.brandName,
          primaryColor: brandAssets.primaryColor,
          fonts: typography.all?.slice(0, 2),
          logo: brandAssets.logoLightUrl,
          pagesDiscovered: navLinks.length,
          sitemapUrls: sitemapData.urls?.length || 0,
        },
        message: `精细化爬取完成，共保存 ${savedFields.length} 个字段：${savedFields.join(', ')}`,
      };

    } catch (error: any) {
      console.error('[scraper] Error:', error);
      return {
        success: false,
        error: error.message,
        url,
        savedToDatabase: savedFields,
        message: savedFields.length > 0
          ? `部分成功：已保存 ${savedFields.join(', ')}`
          : '爬取失败',
      };
    }
  },
});

// =====================================================
// EXTRACTION FUNCTIONS
// =====================================================

function extractMetaInfo(html: string): {
  title: string | null;
  description: string | null;
  keywords: string | null;
  ogImage: string | null;
  canonical: string | null;
} {
  const result: any = {};

  // Title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  result.title = titleMatch ? cleanText(titleMatch[1]) : null;

  // Description
  const descPatterns = [
    /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i,
    /<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i,
  ];
  for (const p of descPatterns) {
    const m = html.match(p);
    if (m) { result.description = m[1]; break; }
  }

  // Keywords
  const kwPatterns = [
    /<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i,
    /<meta\s+content=["']([^"']+)["']\s+name=["']keywords["']/i,
  ];
  for (const p of kwPatterns) {
    const m = html.match(p);
    if (m) { result.keywords = m[1]; break; }
  }

  // OG Image
  const ogPatterns = [
    /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
    /<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i,
  ];
  for (const p of ogPatterns) {
    const m = html.match(p);
    if (m) { result.ogImage = m[1]; break; }
  }

  // Canonical
  const canonicalMatch = html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  result.canonical = canonicalMatch ? canonicalMatch[1] : null;

  return result;
}

function extractLogoFavicon(html: string, origin: string): {
  logoLight: string | null;
  logoDark: string | null;
  faviconLight: string | null;
  faviconDark: string | null;
  allLogos: string[];
} {
  const logos: string[] = [];
  
  // Logo patterns - look in header/nav area
  const logoPatterns = [
    /<img[^>]*class="[^"]*logo[^"]*"[^>]*src=["']([^"']+)["']/gi,
    /<img[^>]*src=["']([^"']+)["'][^>]*class="[^"]*logo[^"]*"/gi,
    /<img[^>]*alt="[^"]*logo[^"]*"[^>]*src=["']([^"']+)["']/gi,
    /<a[^>]*class="[^"]*logo[^"]*"[^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/gi,
    /<header[^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/i,
    /<nav[^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/i,
  ];

  for (const pattern of logoPatterns) {
    const matches = [...html.matchAll(pattern)];
    for (const m of matches) {
      if (m[1]) {
        const logoUrl = resolveUrl(m[1], origin);
        if (!logos.includes(logoUrl)) logos.push(logoUrl);
      }
    }
  }

  // Favicon patterns
  const faviconPatterns = [
    /<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:icon|shortcut icon)["']/i,
    /<link[^>]*rel=["']apple-touch-icon[^"]*["'][^>]*href=["']([^"']+)["']/i,
  ];

  let favicon: string | null = null;
  for (const p of faviconPatterns) {
    const m = html.match(p);
    if (m) {
      favicon = resolveUrl(m[1], origin);
      break;
    }
  }

  // Check for dark mode variants
  const darkLogoMatch = html.match(/data-dark-src=["']([^"']+)["']/i) ||
                        html.match(/class="[^"]*logo[^"]*dark[^"]*"[^>]*src=["']([^"']+)["']/i);
  
  return {
    logoLight: logos[0] || null,
    logoDark: darkLogoMatch ? resolveUrl(darkLogoMatch[1], origin) : null,
    faviconLight: favicon,
    faviconDark: null, // Usually same favicon
    allLogos: logos.slice(0, 5),
  };
}

function extractColors(html: string): {
  primary: string | null;
  secondary: string | null;
  all: string[];
} {
  const colors: { primary: string | null; secondary: string | null; all: string[] } = {
    primary: null,
    secondary: null,
    all: [],
  };

  // 1. CSS Variables (most reliable)
  const cssVarPatterns = [
    /--(?:primary|brand|main|theme)[-_]?color\s*:\s*(#[0-9A-Fa-f]{3,6}|rgb[a]?\([^)]+\))/gi,
    /--(?:secondary|accent)[-_]?color\s*:\s*(#[0-9A-Fa-f]{3,6}|rgb[a]?\([^)]+\))/gi,
  ];

  const primaryVarMatch = html.match(cssVarPatterns[0]);
  const secondaryVarMatch = html.match(cssVarPatterns[1]);
  
  if (primaryVarMatch) colors.primary = primaryVarMatch[1];
  if (secondaryVarMatch) colors.secondary = secondaryVarMatch[1];

  // 2. Tailwind config colors
  const tailwindMatch = html.match(/primary['"]\s*:\s*['"]?(#[0-9A-Fa-f]{3,6})['"]?/i);
  if (tailwindMatch && !colors.primary) colors.primary = tailwindMatch[1];

  // 3. Collect all hex colors
  const hexRegex = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g;
  const matches = html.match(hexRegex) || [];
  const uniqueColors = [...new Set(matches.map(c => c.toUpperCase()))];
  
  // Filter out common neutrals
  const neutrals = new Set(['#FFFFFF', '#FFF', '#000000', '#000', '#EEEEEE', '#EEE', 
    '#F5F5F5', '#FAFAFA', '#333333', '#333', '#666666', '#666', '#999999', '#999',
    '#CCCCCC', '#CCC', '#E5E5E5', '#D4D4D4', '#A3A3A3', '#737373', '#525252',
    '#404040', '#262626', '#171717']);
  
  const brandColors = uniqueColors.filter(c => !neutrals.has(c));
  colors.all = brandColors.slice(0, 10);

  if (!colors.primary && brandColors.length > 0) colors.primary = brandColors[0];
  if (!colors.secondary && brandColors.length > 1) colors.secondary = brandColors[1];

  return colors;
}

function extractTypography(html: string): {
  heading: string | null;
  body: string | null;
  all: string[];
} {
  const fonts: string[] = [];

  // 1. Google Fonts
  const googleFontsRegex = /fonts\.googleapis\.com\/css2?\?family=([^"'&\s]+)/gi;
  let match;
  while ((match = googleFontsRegex.exec(html)) !== null) {
    const fontParam = decodeURIComponent(match[1]);
    const fontNames = fontParam.split('|').map(f => f.split(':')[0].replace(/\+/g, ' '));
    fonts.push(...fontNames);
  }

  // 2. Font-family in CSS
  const fontFamilyRegex = /font-family\s*:\s*["']?([^;"']+)/gi;
  while ((match = fontFamilyRegex.exec(html)) !== null) {
    const families = match[1].split(',').map(f => f.trim().replace(/["']/g, ''));
    // Filter out generic families
    const genericFonts = new Set(['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-sans-serif', 'ui-serif']);
    fonts.push(...families.filter(f => !genericFonts.has(f.toLowerCase())));
  }

  // 3. Adobe Fonts / Typekit
  const typekitMatch = html.match(/use\.typekit\.net\/([^.]+)\.css/i);
  if (typekitMatch) {
    // Can't directly extract font names, but note it exists
  }

  const uniqueFonts = [...new Set(fonts)].filter(f => f.length > 0);

  return {
    heading: uniqueFonts[0] || null,
    body: uniqueFonts[1] || uniqueFonts[0] || null,
    all: uniqueFonts.slice(0, 5),
  };
}

function extractLanguages(html: string): {
  primary: string;
  alternatives: string[];
} {
  let primary = 'en';
  const alternatives: string[] = [];

  // HTML lang attribute
  const langMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i);
  if (langMatch) {
    primary = langMatch[1].split('-')[0].toLowerCase();
  }

  // Hreflang tags
  const hreflangRegex = /hreflang=["']([^"']+)["']/gi;
  let match;
  while ((match = hreflangRegex.exec(html)) !== null) {
    const lang = match[1].split('-')[0].toLowerCase();
    if (lang !== primary && !alternatives.includes(lang) && lang !== 'x-default') {
      alternatives.push(lang);
    }
  }

  // Language switcher
  const langSwitcherRegex = /data-lang=["']([^"']+)["']|\/([a-z]{2})\/|lang=["']([^"']+)["']/gi;
  while ((match = langSwitcherRegex.exec(html)) !== null) {
    const lang = (match[1] || match[2] || match[3])?.split('-')[0]?.toLowerCase();
    if (lang && lang.length === 2 && lang !== primary && !alternatives.includes(lang)) {
      alternatives.push(lang);
    }
  }

  return { primary, alternatives: [...new Set(alternatives)].slice(0, 10) };
}

function extractContactInfo(html: string): {
  emails: string[];
  phones: string[];
  social: Record<string, string>;
  address: string | null;
} {
  const result: any = { emails: [], phones: [], social: {}, address: null };

  // Emails
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const emails = [...new Set([...html.matchAll(emailRegex)].map(m => m[1]))];
  result.emails = emails.filter(e => 
    !e.includes('example.com') && 
    !e.includes('wixpress') && 
    !e.includes('sentry') &&
    !e.includes('@2x') &&
    !e.includes('.png') &&
    !e.includes('.jpg')
  ).slice(0, 5);

  // Phones
  const phoneRegex = /(?:\+?[\d]{1,3}[-.\s]?)?\(?[\d]{2,3}\)?[-.\s]?[\d]{3,4}[-.\s]?[\d]{3,4}/g;
  const phones = [...html.matchAll(phoneRegex)].map(m => m[0].trim());
  result.phones = [...new Set(phones.filter(p => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(p)) return false; // Date
    if (p.length < 7) return false;
    return true;
  }))].slice(0, 3);

  // Social Links
  const socialPatterns = [
    { name: 'twitter', pattern: /href=["'](https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^"']+)["']/i },
    { name: 'linkedin', pattern: /href=["'](https?:\/\/(?:www\.)?linkedin\.com\/[^"']+)["']/i },
    { name: 'facebook', pattern: /href=["'](https?:\/\/(?:www\.)?facebook\.com\/[^"']+)["']/i },
    { name: 'instagram', pattern: /href=["'](https?:\/\/(?:www\.)?instagram\.com\/[^"']+)["']/i },
    { name: 'youtube', pattern: /href=["'](https?:\/\/(?:www\.)?youtube\.com\/[^"']+)["']/i },
    { name: 'github', pattern: /href=["'](https?:\/\/(?:www\.)?github\.com\/[^"']+)["']/i },
    { name: 'tiktok', pattern: /href=["'](https?:\/\/(?:www\.)?tiktok\.com\/[^"']+)["']/i },
  ];

  for (const { name, pattern } of socialPatterns) {
    const match = html.match(pattern);
    if (match) result.social[name] = match[1];
  }

  // Address - look in footer or contact sections
  const addressMatch = html.match(/<address[^>]*>([\s\S]*?)<\/address>/i);
  if (addressMatch) {
    result.address = cleanText(addressMatch[1]).substring(0, 200);
  }

  return result;
}

function extractNavigationLinks(html: string, origin: string): Array<{ text: string; url: string; path: string }> {
  const links: Array<{ text: string; url: string; path: string }> = [];
  
  // Find header/nav sections
  const navSections = [
    ...html.matchAll(/<header[^>]*>([\s\S]*?)<\/header>/gi),
    ...html.matchAll(/<nav[^>]*>([\s\S]*?)<\/nav>/gi),
  ];

  for (const section of navSections) {
    const navHtml = section[1];
    const linkRegex = /<a[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match;

    while ((match = linkRegex.exec(navHtml)) !== null) {
      let href = match[1];
      const text = cleanText(match[2]).trim();

      if (!text || text.length < 2 || text.length > 50) continue;
      if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;

      // Resolve URL
      if (href.startsWith('/')) {
        href = origin + href;
      } else if (!href.startsWith('http')) {
        continue;
      }

      // Only include same-origin links
      if (href.startsWith(origin)) {
        const path = new URL(href).pathname;
        if (!links.some(l => l.path === path)) {
          links.push({ text, url: href, path });
        }
      }
    }
  }

  return links.slice(0, 30);
}

function buildPageMap(navLinks: Array<{ text: string; url: string; path: string }>, origin: string): Record<string, string> {
  const map: Record<string, string> = {};
  
  // Common path patterns for each page type
  const patterns: Record<string, RegExp[]> = {
    '/about': [/^\/about/i, /^\/company/i, /^\/who-we-are/i],
    '/team': [/^\/team/i, /^\/about.*team/i, /^\/leadership/i, /^\/people/i],
    '/products': [/^\/products?/i, /^\/solutions?/i, /^\/platform/i],
    '/services': [/^\/services?/i],
    '/pricing': [/^\/pricing/i, /^\/plans/i],
    '/faq': [/^\/faq/i, /^\/faqs/i, /^\/help/i, /^\/support/i],
    '/contact': [/^\/contact/i],
    '/blog': [/^\/blog/i, /^\/news/i, /^\/articles/i, /^\/resources/i],
    '/use-cases': [/^\/use-cases?/i, /^\/case-studies/i, /^\/customers.*stories/i],
    '/industries': [/^\/industries/i, /^\/verticals/i, /^\/sectors/i],
    '/features': [/^\/features?/i],
    '/customers': [/^\/customers?/i, /^\/clients?/i],
  };

  for (const link of navLinks) {
    for (const [key, regexes] of Object.entries(patterns)) {
      if (regexes.some(r => r.test(link.path))) {
        if (!map[key]) {
          map[key] = link.url;
        }
      }
    }
  }

  return map;
}

function findMatchingUrl(targetPath: string, navLinks: Array<{ text: string; url: string; path: string }>, origin: string): string | null {
  // Direct path match
  const directMatch = navLinks.find(l => l.path.toLowerCase() === targetPath.toLowerCase());
  if (directMatch) return directMatch.url;

  // Partial match
  const partialMatch = navLinks.find(l => l.path.toLowerCase().includes(targetPath.replace('/', '').toLowerCase()));
  if (partialMatch) return partialMatch.url;

  return null;
}

async function fetchSitemap(origin: string): Promise<{ found: boolean; url: string | null; urls: string[] }> {
  const sitemapUrls = [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap-index.xml`,
  ];

  for (const sitemapUrl of sitemapUrls) {
    try {
      const response = await fetch(sitemapUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const xml = await response.text();
        const urls = parseSitemapXml(xml);
        return { found: true, url: sitemapUrl, urls };
      }
    } catch (e) {
      continue;
    }
  }

  return { found: false, url: null, urls: [] };
}

function parseSitemapXml(xml: string): string[] {
  const urls: string[] = [];
  const locRegex = /<loc>([^<]+)<\/loc>/gi;
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    const loc = match[1].trim();
    if (!loc.endsWith('.xml')) {
      urls.push(loc);
    }
  }
  return urls;
}

function classifyPages(urls: string[], origin: string): {
  keyPages: string[];
  landingPages: string[];
  blogPages: string[];
} {
  const keyPages: string[] = [];
  const landingPages: string[] = [];
  const blogPages: string[] = [];

  const keyPatterns = [/^\/$/, /^\/about/i, /^\/pricing/i, /^\/features/i, /^\/contact/i, /^\/faq/i, /^\/team/i];
  const blogPatterns = [/^\/blog/i, /^\/news/i, /^\/articles/i, /^\/posts/i];
  const landingPatterns = [/^\/lp\//i, /^\/landing/i, /\/vs\//i, /\/alternative/i, /\/for-/i];

  for (const url of urls) {
    try {
      const pathname = new URL(url).pathname;
      if (blogPatterns.some(p => p.test(pathname))) {
        blogPages.push(url);
      } else if (landingPatterns.some(p => p.test(pathname))) {
        landingPages.push(url);
      } else if (keyPatterns.some(p => p.test(pathname)) || pathname.split('/').filter(Boolean).length <= 1) {
        keyPages.push(url);
      }
    } catch (e) {
      continue;
    }
  }

  return { keyPages, landingPages, blogPages };
}

function extractCleanText(html: string): string {
  // Get body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const content = bodyMatch ? bodyMatch[1] : html;

  return content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 15000); // Limit for AI
}

function cleanText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveUrl(url: string, origin: string): string {
  if (url.startsWith('//')) return 'https:' + url;
  if (url.startsWith('/')) return origin + url;
  if (url.startsWith('http')) return url;
  return origin + '/' + url;
}
