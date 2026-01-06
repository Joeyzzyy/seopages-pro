# Context Acquisition 完整技术指南

## 版本信息
- **版本**: 1.0.0
- **更新日期**: 2026-01-06
- **适用范围**: 后端开发者复刻 Context 获取能力

---

## 目录

1. [系统概览](#一系统概览)
2. [Onsite Context 获取](#二onsite-context-获取站内信息)
3. [Offsite Context 获取](#三offsite-context-获取站外信息)
4. [数据库结构](#四数据库结构)
5. [API 接口](#五api-接口)

---

## 一、系统概览

Context Acquisition 系统分为两大部分：

| 类型 | 描述 | 数据来源 | 字段数量 |
|------|------|----------|----------|
| **Onsite Context** | 站内信息 | 用户自己的网站 | 17 个字段 |
| **Offsite Context** | 站外信息 | 社交媒体、评论平台等 | 22 个字段 |

### 核心技术栈
- **AI 模型**: Azure OpenAI GPT-4.1
- **数据库**: Supabase (PostgreSQL)
- **网页抓取**: 原生 fetch + 正则 + AI 分析

---

## 二、Onsite Context 获取（站内信息）

### 2.1 字段分类

Onsite Context 共 17 个字段，分为三类提取策略：

| 分类 | 数量 | 提取方法 | 执行时间 |
|------|------|----------|----------|
| Fast Fields | 5 | 正则表达式 | < 100ms |
| Structured Fields | 2 | AI 增强 DOM 解析 | 2-3s |
| AI-Analyzed Fields | 10 | 深度 AI 分析 | 3-10s |

---

### 2.2 Fast Fields（快速字段）- 5 个

#### 2.2.1 brand-assets（品牌资产）

**提取方法**: `regex`  
**目标页面**: `/`  
**数据库类型**: `logo`

**提取内容**:
- Logo (亮色/暗色变体)
- Favicon
- 主色调 / 次要色调
- 标题字体 / 正文字体
- 品牌名称
- Meta 描述 / OG 图片

**提取策略**:

```typescript
// 1. Logo 提取
const logoPatterns = [
  /<img[^>]*class="[^"]*logo[^"]*"[^>]*src="([^"]+)"/i,
  /<a[^>]*class="[^"]*logo[^"]*"[^>]*>.*?<img[^>]*src="([^"]+)"/is,
  /<header[^>]*>.*?<img[^>]*src="([^"]+)"/is  // Header 中第一个图片
];

// 2. Favicon 提取（优先级顺序）
const faviconPatterns = [
  /<link[^>]*rel="icon"[^>]*href="([^"]+)"/i,
  /<link[^>]*rel="shortcut icon"[^>]*href="([^"]+)"/i,
  /<link[^>]*rel="apple-touch-icon"[^>]*href="([^"]+)"/i
];
// Fallback: /favicon.ico

// 3. 颜色提取
const colorPatterns = [
  /--primary-color:\s*([^;]+)/i,
  /--brand-color:\s*([^;]+)/i,
  /--secondary-color:\s*([^;]+)/i,
  /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g  // 提取所有 Hex 颜色
];

// 4. 字体提取
const fontPatterns = [
  /fonts\.googleapis\.com\/css2?\?family=([^"&]+)/i,
  /font-family:\s*["']?([^"';,]+)/i
];
```

**返回结构**:
```json
{
  "logo": "https://example.com/logo.png",
  "logoDark": "https://example.com/logo-dark.png",
  "favicon": "https://example.com/favicon.ico",
  "primaryColor": "#24be58",
  "secondaryColor": "#1a1a1a",
  "headingFont": "Inter",
  "bodyFont": "Roboto",
  "brandName": "Example Corp",
  "metaDescription": "...",
  "ogImage": "https://example.com/og.jpg"
}
```

---

#### 2.2.2 hero-section（首屏区域）

**提取方法**: `structured` (正则优先 + AI fallback)  
**目标页面**: `/`  
**数据库类型**: `hero-section`

**提取策略**:

```typescript
// 1. 正则提取（优先）
const heroPatterns = [
  /<section[^>]*class="[^"]*hero[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
  /<div[^>]*class="[^"]*hero[^"]*"[^>]*>([\s\S]*?)<\/div>/i
];

// 从 Hero 区域提取：
// - <h1> 作为 headline
// - <h2> 或第一个 <p> 作为 subheadline
// - <a class="*btn*"> 或 <button> 作为 CTA
// - 数字 + 文字模式作为 metrics (如 "10,000+ users")

// 2. AI Fallback（正则失败时）
const aiPrompt = `Analyze this HTML and extract the hero section:
{
  "headline": "Main headline text",
  "subheadline": "Supporting text",
  "callToAction": "CTA button text",
  "metrics": "Key statistics if present"
}`;
```

**返回结构**:
```json
{
  "headline": "AI-Powered SEO Platform",
  "subheadline": "Generate content 10x faster",
  "callToAction": "Start Free Trial",
  "metrics": "10,000+ customers"
}
```

---

#### 2.2.3 contact-info（联系信息）

**提取方法**: `regex` + 智能页面发现  
**目标页面**: `/`, `/contact`, `/contact-us`, `/about`, `/about-us`  
**数据库类型**: `contact-information`

**智能页面发现关键词**: `contact`, `get-in-touch`, `reach-us`, `office`, `location`

**提取策略**:

```typescript
// 1. Email 提取
const emailRegex = /[a-z0-9._-]+@[a-z0-9._-]+\.[a-z0-9_-]+/gi;
// 过滤: example.com, wixpress, sentry

// 2. 电话提取
const phoneRegex = /(\+?[0-9]{1,4}[-.\s]?)?(\(?[0-9]{2,4}\)?[-.\s]?)?[0-9]{3,4}[-.\s]?[0-9]{3,4}/g;
// 验证: 长度 10-20 字符

// 3. 地址提取
const addressPatterns = [
  /<address[^>]*>([\s\S]*?)<\/address>/i,
  /<[^>]*class="[^"]*(?:address|location)[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i
];

// 4. 社交链接
const socialPatterns = {
  twitter: /(?:twitter\.com|x\.com)\/([^"'\s]+)/i,
  linkedin: /linkedin\.com\/(?:company|in)\/([^"'\s]+)/i,
  facebook: /facebook\.com\/([^"'\s]+)/i,
  instagram: /instagram\.com\/([^"'\s]+)/i,
  youtube: /youtube\.com\/(?:channel|c|@)\/([^"'\s]+)/i,
  github: /github\.com\/([^"'\s]+)/i
};
```

**返回结构**:
```json
{
  "emails": ["contact@example.com", "support@example.com"],
  "phones": ["+1-555-123-4567"],
  "address": "123 Main Street, San Francisco, CA 94102",
  "social": {
    "twitter": "https://twitter.com/example",
    "linkedin": "https://linkedin.com/company/example"
  },
  "primaryEmail": "contact@example.com",
  "primaryPhone": "+1-555-123-4567"
}
```

---

#### 2.2.4 sitemap（网站地图）

**提取方法**: `regex`  
**目标页面**: `/sitemap.xml`, `/sitemap_index.xml`, `/sitemap-index.xml`  
**数据库类型**: `sitemap`

**提取策略**:

```typescript
// 1. 依次尝试 sitemap URLs
const sitemapUrls = [
  `${origin}/sitemap.xml`,
  `${origin}/sitemap_index.xml`,
  `${origin}/sitemap-index.xml`
];

// 2. 解析 XML
const locRegex = /<loc>([^<]+)<\/loc>/g;

// 3. 过滤子 sitemap (.xml 结尾)
// 4. 限制最多 500 个 URL
```

**返回结构**:
```json
{
  "found": true,
  "url": "https://example.com/sitemap.xml",
  "urls": ["https://example.com/", "https://example.com/about", ...],
  "count": 150
}
```

---

#### 2.2.5 page-classification（页面分类）

**提取方法**: `regex` (基于 URL 模式)  
**数据源**: Sitemap 中的 URLs  
**数据库类型**: 3 个独立类型

**分类规则**:

```typescript
// Key Pages（关键页面）
const keyPagePatterns = [
  /^\/$/,                    // 首页
  /^\/(about|pricing|features|contact|faq|team|careers|products|services)(\/|$)/i
];
// 或: pathname 深度 ≤ 1

// Blog Pages（博客资源）
const blogPatterns = [
  /^\/(blog|news|articles|posts|resources)(\/|$)/i
];

// Landing Pages（着陆页）
const landingPatterns = [
  /\/lp\//i,
  /\/vs\//i,
  /\/alternative/i,
  /\/for-/i,
  /\/compare/i
];
```

**保存**:
- `key-website-pages`: 最多 30 个
- `landing-pages`: 最多 30 个
- `blog-resources`: 最多 30 个

---

### 2.3 Structured Fields（结构化字段）- 2 个

#### 2.3.1 header（网站头部）

**提取方法**: `structured` (AI 增强 + Regex fallback)  
**目标页面**: `/`  
**数据库类型**: `header`

**提取策略**:

```typescript
// 1. 提取 header/nav HTML
const headerPatterns = [
  /<header[^>]*>([\s\S]*?)<\/header>/i,
  /<nav[^>]*>([\s\S]*?)<\/nav>/i
];

// 2. AI 分析（优先，当 HTML > 100 字符）
const aiPrompt = `Extract navigation structure from this HTML.
Return JSON:
{
  "navigation": [{"text": "Link Text", "url": "/path"}],
  "hasSearch": boolean,
  "hasCTA": boolean,
  "ctaText": "CTA button text"
}`;

// 3. Regex Fallback
// 提取 <a href="..."> 链接
// 过滤 # 和 javascript: 链接
// 按 label 去重，最多 15 个
```

**返回结构**:
```json
{
  "navigation": [
    {"text": "Products", "url": "/products"},
    {"text": "Pricing", "url": "/pricing"},
    {"text": "Blog", "url": "/blog"}
  ],
  "hasSearch": true,
  "hasCTA": true,
  "ctaText": "Get Started"
}
```

---

#### 2.3.2 footer（网站底部）

**提取方法**: `structured` (AI 增强 + Regex fallback)  
**目标页面**: `/`  
**数据库类型**: `footer`

**提取策略**:

```typescript
// 1. 提取 footer HTML
const footerPattern = /<footer[^>]*>([\s\S]*?)<\/footer>/i;

// 2. AI 分析
const aiPrompt = `Extract footer structure from this HTML.
Return JSON:
{
  "columns": [
    {
      "title": "Column Title",
      "links": [{"text": "Link", "url": "/path"}]
    }
  ],
  "socialLinks": [{"platform": "twitter", "url": "..."}],
  "copyright": "© 2026 Company Name",
  "address": "Address if present"
}`;

// 3. Regex Fallback
// 查找 column/section 容器
// 提取标题 (<h3-6>, <strong>)
// 提取链接（每栏最多 10 个）
```

**返回结构**:
```json
{
  "columns": [
    {
      "title": "Products",
      "links": [
        {"text": "Feature 1", "url": "/feature1"},
        {"text": "Feature 2", "url": "/feature2"}
      ]
    }
  ],
  "socialLinks": [
    {"platform": "twitter", "url": "https://twitter.com/example"}
  ],
  "copyright": "© 2026 Example Corp",
  "address": "San Francisco, CA"
}
```

---

### 2.4 AI-Analyzed Fields（AI 分析字段）- 10 个

所有 AI 字段的通用配置：
- **Model**: Azure OpenAI GPT-4.1
- **Temperature**: 0 (确保一致性)
- **默认 Max Tokens**: 1500
- **默认 Content Length**: 8000 字符

---

#### 2.4.1 tone（品牌语气）

**目标页面**: `/`, `/about`, `/about-us`  
**数据库类型**: `logo` (tone 字段)

**AI Prompt**:
```
Analyze the tone and voice of this website's content.
Return ONLY a short phrase (2-5 words) like:
- "Professional and authoritative"
- "Friendly and conversational"
- "Bold and innovative"
```

**配置**:
- Max Tokens: 50
- Content Length: 3000 字符

---

#### 2.4.2 problem-statement（问题陈述）

**目标页面**: `/`, `/about`, `/about-us`, `/why-us`, `/solutions`  
**数据库类型**: `problem-statement`

**AI Prompt**:
```
Extract the PROBLEM STATEMENT from this website.
Write 2-3 paragraphs (200-400 words) describing:
- The core problem(s) being solved
- Who experiences these problems
- The impact/cost of not solving them
```

**返回**: 纯文本（非 JSON）

---

#### 2.4.3 who-we-serve（目标用户）

**目标页面**: `/`, `/customers`, `/for-teams`, `/industries`, `/solutions`, `/about`  
**智能页面发现关键词**: `customers`, `industries`, `for-`, `solutions`, `who-we-serve`  
**数据库类型**: `who-we-serve`

**AI Prompt**:
```
Identify WHO THIS PRODUCT/SERVICE SERVES.
Write 1-2 paragraphs (100-200 words) covering:
- Primary target audience/customer segments
- Types of businesses or individuals
- Company sizes (startup, SMB, enterprise)
- Any specific roles or departments
```

---

#### 2.4.4 use-cases（使用场景）

**目标页面**: `/`, `/use-cases`, `/solutions`, `/features`, `/how-it-works`  
**智能页面发现关键词**: `use-cases`, `solutions`, `examples`, `case-studies`, `applications`  
**数据库类型**: `use-cases`

**AI Prompt**:
```
List the main USE CASES for this product/service.
Return as a simple string (NOT JSON) with this format:
- Use Case 1: [Name] - [Brief description]
- Use Case 2: [Name] - [Brief description]
...
Include 5-10 use cases total.
```

---

#### 2.4.5 industries（目标行业）

**目标页面**: `/`, `/industries`, `/solutions`, `/customers`, `/case-studies`, `/verticals`  
**数据库类型**: `industries`

**AI Prompt**:
```
Identify the INDUSTRIES this product/service targets.
Format as a structured list like:
- Healthcare: [how product helps healthcare]
- Finance: [how product helps finance]
```

---

#### 2.4.6 products-services（产品服务）

**目标页面**: `/`, `/products`, `/services`, `/features`, `/pricing`, `/solutions`  
**数据库类型**: `products-services`

**AI Prompt**:
```
Describe the PRODUCTS and SERVICES offered.
Write 2-4 paragraphs (300-500 words) covering:
- Main product/service offerings
- Key features and capabilities
- Pricing tiers if mentioned
- Differentiators or unique selling points
```

---

#### 2.4.7 about-us（关于我们）

**目标页面**: `/about`, `/about-us`, `/company`, `/our-story`, `/`  
**数据库类型**: `about-us`

**AI Prompt**:
```
Extract ABOUT US information.
Return as JSON:
{
  "companyStory": "Background and history (2-3 paragraphs)",
  "missionVision": "Mission statement and vision (1-2 paragraphs)",
  "coreValues": "Core values and principles"
}
```

---

#### 2.4.8 leadership-team（领导团队）

**目标页面**: `/about`, `/team`, `/our-team`, `/leadership`, `/management`, `/founders`  
**数据库类型**: `leadership-team`

**AI Prompt**:
```
Extract LEADERSHIP TEAM information.
Return as JSON array:
[
  {
    "name": "Full Name",
    "title": "Job Title",
    "bio": "Brief biography",
    "image": "Image URL",
    "linkedin": "LinkedIn URL"
  }
]
If no team information found, return: []
```

**特殊处理**: 如果结果为空且有多个页面，合并前 3 个页面内容（最多 12000 字符）重新分析

---

#### 2.4.9 faq（常见问题）

**目标页面**: `/faq`, `/faqs`, `/help`, `/support`, `/frequently-asked-questions`  
**数据库类型**: `faq`

**AI Prompt**:
```
Extract FAQ (Frequently Asked Questions).
Return ONLY a valid JSON array:
[
  {"question": "Question text", "answer": "Complete answer text"}
]

Rules:
- Extract ALL FAQs (aim for 10-30 items)
- Keep questions concise
- Include full answer text
```

**配置（最高配额）**:
- **Max Tokens: 4000**
- **Content Length: 20000 字符**

---

#### 2.4.10 social-proof（社会证明）

**目标页面**: `/`, `/customers`, `/testimonials`, `/case-studies`, `/reviews`  
**数据库类型**: `social-proof-trust`

**A. 网站内容提取**

**AI Prompt**:
```
Extract SOCIAL PROOF elements.
Return as JSON:
{
  "testimonials": [{"quote": "...", "author": "...", "company": "..."}],
  "metrics": "Key statistics like '10,000+ customers'",
  "awards": "Awards or recognitions",
  "badges": "Trust badges, certifications",
  "partners": "Partner company names"
}
```

**B. 外部平台抓取（增强）**

**支持平台**: ProductHunt, Trustpilot, G2, Capterra

**命名变体生成**:
```typescript
// 从 domain "seopage.ai" 生成：
const variants = [
  'seopage-ai',    // 点号转横线
  'seopageai',     // 完全清理
  'seopage',       // 基础名称
];
```

**URL 尝试策略**:

| 平台 | URL 模式 |
|------|----------|
| ProductHunt | `/products/{variant}`, `/posts/{variant}` |
| Trustpilot | `/review/{domain}`, `/review/www.{domain}` |
| G2 | `/products/{variant}` |
| Capterra | `/software/{variant}` |

**提取信息**:
```typescript
// Rating 评分
const ratingPatterns = [
  /(\d+\.?\d*)\s*out of\s*5/i,
  /★\s*(\d+\.?\d*)/,
  /"ratingValue":\s*"?(\d+\.?\d*)"?/
];

// Review Count 评论数
const reviewCountPatterns = [
  /(\d+)\s*reviews?/i,
  /"reviewCount":\s*"?(\d+)"?/
];

// ProductHunt Awards
const awardPatterns = [
  /Product of the (Day|Week|Month)/i,
  /#(\d+)\s*Product of the Day/i,
  /Golden Kitty/i
];
```

---

### 2.5 智能页面发现系统

**工作流程**:

```typescript
async function discoverRelevantPages(field: string, origin: string, homePageHtml: string) {
  // 1. 定义字段关键词
  const keywords = FIELD_KEYWORDS[field];
  
  // 2. 从 Sitemap 搜索
  const sitemapUrls = await fetchSitemap(origin);
  const fromSitemap = sitemapUrls.filter(url => 
    keywords.some(kw => url.toLowerCase().includes(kw))
  );
  
  // 3. 从导航搜索
  const navLinks = extractNavigationLinks(homePageHtml, origin);
  const fromNav = navLinks.filter(url =>
    keywords.some(kw => url.toLowerCase().includes(kw))
  );
  
  // 4. 合并去重并按相关性排序
  const discovered = [...new Set([...fromSitemap, ...fromNav])];
  discovered.sort((a, b) => {
    const aScore = keywords.filter(kw => a.includes(kw)).length;
    const bScore = keywords.filter(kw => b.includes(kw)).length;
    return bScore - aScore;
  });
  
  // 5. 返回前 5 个
  return discovered.slice(0, 5);
}
```

**字段关键词映射**:

| 字段 | 关键词 |
|------|--------|
| leadership-team | team, leadership, about, management, founders, people, executive |
| industries | industries, verticals, sectors, solutions, customers, case-studies |
| products-services | products, services, pricing, features, solutions, offerings |
| faq | faq, help, support, questions, knowledge, docs |
| about-us | about, company, story, mission, values |
| social-proof | testimonials, reviews, customers, case-studies, success, clients |

---

### 2.6 缓存机制

**三层缓存**:

| 缓存类型 | TTL | 用途 |
|---------|-----|------|
| 页面内容缓存 | 5 分钟 | 存储 HTML + 纯文本 |
| Sitemap 缓存 | 5 分钟 | 存储 URL 列表 |
| 导航链接缓存 | 5 分钟 | 存储 Header/Nav 链接 |

**效果**:
- 无缓存: ~50-80 次 HTTP 请求
- 有缓存: ~15-25 次 HTTP 请求（节省 60-70%）

---

## 三、Offsite Context 获取（站外信息）

### 3.1 概述

Offsite Context 获取品牌在外部平台的存在信息，共 6 个类别、22 个字段。

### 3.2 字段类别

| 类别 | 描述 | 字段 |
|------|------|------|
| **Monitoring Scope** | 监控范围 | brand_keywords, product_keywords, key_persons, hashtags, required_keywords, excluded_keywords, regions, languages |
| **Owned Presence** | 自有渠道 | official_channels, executive_accounts |
| **Reviews & Listings** | 评论和目录 | review_platforms, directories, storefronts |
| **Community** | 社区 | forums, qa_platforms, branded_groups |
| **Media** | 媒体 | media_channels, coverage, events |
| **KOLs** | 意见领袖 | creators, experts, press_contacts |

---

### 3.3 提取工具

**核心工具**: `acquireOffsiteContextTool`

**输入参数**:
```typescript
{
  userId: string;           // 用户 ID
  projectId: string;        // 项目 ID
  websiteUrl?: string;      // 可选：网站 URL（不提供则自动获取项目域名）
  fieldType: 'monitoring-scope' | 'owned-presence' | 'reviews-listings' | 
             'community' | 'media' | 'kols' | 'all';
}
```

---

### 3.4 各类别提取策略

#### 3.4.1 Monitoring Scope（监控范围）

**AI Prompt**:
```
Analyze the website and extract monitoring scope information.

Based on the website content, identify:
1. Brand Keywords: The brand name and its variations (e.g., "Acme", "Acme Inc", "@acme")
2. Product Keywords: Key product or service related terms
3. Key Persons: Names of founders, executives, or spokespersons mentioned
4. Hashtags: Any branded or commonly used hashtags (e.g., "#acme")

Return as JSON:
{
  "brand_keywords": ["keyword1", "keyword2"],
  "product_keywords": ["keyword1", "keyword2"],
  "key_persons": ["Person Name 1"],
  "hashtags": ["#hashtag1"]
}
```

---

#### 3.4.2 Owned Presence（自有渠道）

**AI Prompt**:
```
Analyze the website to find official social media presence and channels.

Look for:
1. Social media links (LinkedIn, Twitter/X, Instagram, Facebook, YouTube, TikTok)
2. Official company channels
3. Executive/founder personal accounts if mentioned

Return as JSON:
{
  "official_channels": [
    {"platform": "LinkedIn", "url": "https://linkedin.com/company/..."},
    {"platform": "Twitter", "url": "https://twitter.com/..."}
  ],
  "executive_accounts": [
    {"platform": "Twitter", "url": "https://twitter.com/founder_name"}
  ]
}
```

---

#### 3.4.3 Reviews & Listings（评论和目录）

**AI Prompt**:
```
Analyze the website to find review platforms and directory listings.

Look for:
1. Review platform badges or links (G2, Capterra, Trustpilot, ProductHunt)
2. Directory listings (industry directories, software directories)
3. App store listings (App Store, Google Play, Chrome Web Store)

Return as JSON:
{
  "review_platforms": [
    {"platform": "G2", "url": "https://g2.com/products/..."}
  ],
  "directories": [
    {"platform": "ProductHunt", "url": "https://producthunt.com/..."}
  ],
  "storefronts": [
    {"platform": "Chrome Web Store", "url": "https://chrome.google.com/..."}
  ]
}
```

---

#### 3.4.4 Community（社区）

**AI Prompt**:
```
Analyze the website to find community engagement channels.

Look for:
1. Forum mentions or links (Reddit, Discourse)
2. Q&A platforms (Quora, StackOverflow)
3. Community groups (Discord, Slack, Facebook Groups)

Return as JSON:
{
  "forums": [{"platform": "Reddit", "url": "https://reddit.com/r/..."}],
  "qa_platforms": [{"platform": "Quora", "url": "https://quora.com/..."}],
  "branded_groups": [{"platform": "Discord", "url": "https://discord.gg/..."}]
}
```

---

#### 3.4.5 Media（媒体）

**AI Prompt**:
```
Analyze the website to find media and press information.

Look for:
1. Press page or media mentions
2. Podcast appearances
3. News coverage links
4. Event participation

Return as JSON:
{
  "media_channels": [{"platform": "YouTube", "url": "https://youtube.com/..."}],
  "coverage": [{"platform": "TechCrunch", "url": "https://techcrunch.com/..."}],
  "events": [{"platform": "Conference", "url": "https://event.com/..."}]
}
```

---

#### 3.4.6 KOLs（意见领袖）

**AI Prompt**:
```
Analyze the website to find KOL (Key Opinion Leader) relationships.

Look for:
1. Influencer partnerships or testimonials
2. Industry expert endorsements
3. Press contacts or PR mentions

Return as JSON:
{
  "creators": [{"platform": "YouTube", "url": "https://youtube.com/@creator"}],
  "experts": [{"platform": "LinkedIn", "url": "https://linkedin.com/in/expert"}],
  "press_contacts": [{"platform": "Email", "url": "press@company.com"}]
}
```

---

### 3.5 链接提取辅助

**社交媒体链接正则模式**:

```typescript
const socialPatterns = [
  /linkedin\.com/i,
  /twitter\.com|x\.com/i,
  /facebook\.com/i,
  /instagram\.com/i,
  /youtube\.com/i,
  /tiktok\.com/i,
  /discord\.(gg|com)/i,
  /slack\.com/i,
  /reddit\.com/i,
  /github\.com/i,
  /g2\.com/i,
  /capterra\.com/i,
  /trustpilot\.com/i,
  /producthunt\.com/i,
  /quora\.com/i,
  /medium\.com/i,
];
```

---

## 四、数据库结构

### 4.1 Onsite Context 表 (site_contexts)

```sql
CREATE TABLE site_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES seo_projects(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,  -- 'logo', 'header', 'footer', 'hero-section', etc.
  
  -- Logo type specific fields
  file_url TEXT,
  dark_logo_url TEXT,
  favicon_url TEXT,
  primary_color VARCHAR(20),
  secondary_color VARCHAR(20),
  heading_font VARCHAR(100),
  body_font VARCHAR(100),
  brand_name VARCHAR(200),
  meta_description TEXT,
  og_image TEXT,
  tone TEXT,
  website_language VARCHAR(10),
  
  -- Generic content field (for JSON or text content)
  content JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_project_type UNIQUE (user_id, project_id, type)
);
```

**Type 值对照表**:

| Type | 用途 | Content 格式 |
|------|------|-------------|
| logo | 品牌资产 | N/A (使用专用字段) |
| header | 网站头部 | JSON |
| footer | 网站底部 | JSON |
| hero-section | 首屏区域 | JSON |
| contact-information | 联系信息 | JSON |
| sitemap | 网站地图 | JSON |
| key-website-pages | 关键页面 | JSON Array |
| landing-pages | 着陆页 | JSON Array |
| blog-resources | 博客资源 | JSON Array |
| problem-statement | 问题陈述 | Text |
| who-we-serve | 目标用户 | Text |
| use-cases | 使用场景 | Text |
| industries | 目标行业 | Text |
| products-services | 产品服务 | Text |
| about-us | 关于我们 | JSON |
| leadership-team | 领导团队 | JSON Array |
| faq | 常见问题 | JSON Array |
| social-proof-trust | 社会证明 | JSON |

---

### 4.2 Offsite Context 表 (offsite_contexts)

```sql
CREATE TABLE offsite_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES seo_projects(id) ON DELETE CASCADE NOT NULL,
  
  -- Monitoring Scope
  brand_keywords JSONB DEFAULT '[]'::jsonb,
  product_keywords JSONB DEFAULT '[]'::jsonb,
  key_persons JSONB DEFAULT '[]'::jsonb,
  hashtags JSONB DEFAULT '[]'::jsonb,
  required_keywords JSONB DEFAULT '[]'::jsonb,
  excluded_keywords JSONB DEFAULT '[]'::jsonb,
  regions JSONB DEFAULT '[]'::jsonb,
  languages JSONB DEFAULT '[]'::jsonb,
  
  -- Owned Presence
  official_channels JSONB DEFAULT '[]'::jsonb,  -- [{platform, url}]
  executive_accounts JSONB DEFAULT '[]'::jsonb,
  
  -- Reviews & Listings
  review_platforms JSONB DEFAULT '[]'::jsonb,
  directories JSONB DEFAULT '[]'::jsonb,
  storefronts JSONB DEFAULT '[]'::jsonb,
  
  -- Community
  forums JSONB DEFAULT '[]'::jsonb,
  qa_platforms JSONB DEFAULT '[]'::jsonb,
  branded_groups JSONB DEFAULT '[]'::jsonb,
  
  -- Media
  media_channels JSONB DEFAULT '[]'::jsonb,
  coverage JSONB DEFAULT '[]'::jsonb,
  events JSONB DEFAULT '[]'::jsonb,
  
  -- KOLs
  creators JSONB DEFAULT '[]'::jsonb,
  experts JSONB DEFAULT '[]'::jsonb,
  press_contacts JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_project_offsite UNIQUE (user_id, project_id)
);
```

**LinkItem 结构**:
```typescript
interface LinkItem {
  platform: string;  // 平台名称，如 "LinkedIn", "Twitter", "G2"
  url: string;       // 完整 URL
}
```

---

## 五、API 接口

### 5.1 Onsite Context API

**获取 Site Contexts**:
```
GET /api/site-contexts?projectId={projectId}
```

**更新 Site Context**:
```
PATCH /api/site-contexts
Body: {
  projectId: string,
  type: string,
  updates: Record<string, any>
}
```

---

### 5.2 Offsite Context API

**获取 Offsite Context**:
```
GET /api/offsite-contexts?projectId={projectId}
```

**更新 Offsite Context**:
```
PATCH /api/offsite-contexts
Body: {
  projectId: string,
  updates: Record<string, any>
}
```

---

## 附录 A: 执行时间预估

| 阶段 | 字段数 | 预估时间 |
|------|--------|---------|
| Fast Fields | 5 | 3-5 秒 |
| Structured Fields | 2 | 4-6 秒 |
| AI Fields (简单) | 5 | 15-25 秒 |
| AI Fields (复杂) | 5 | 25-40 秒 |
| **Onsite 总计** | **17** | **~50-75 秒** |
| **Offsite 总计** | **6 类** | **~30-45 秒** |

---

## 附录 B: 错误处理

### 分级容错

1. **页面级容错**:
   - 目标页面不可访问 → 尝试下一个
   - 所有目标页面失败 → Fallback 到首页

2. **提取级容错**:
   - Regex 失败 → AI Fallback
   - AI 返回错误 → 返回空值或默认值

3. **数据级容错**:
   - JSON 解析失败 → 返回原始字符串
   - 数组为空 → 保留空数组

---

## 附录 C: 开发者备注

### 复刻建议

1. **按阶段实现**: 先实现 Fast Fields，再实现 AI Fields
2. **重用页面内容**: 实现缓存避免重复抓取
3. **AI 模型可替换**: Prompt 设计与模型无关，可使用其他 LLM
4. **异步处理**: 考虑将长时间任务放入队列

### 测试建议

1. 选择 3-5 个不同类型的网站测试
2. 记录每个字段的提取成功率
3. 根据失败案例优化正则和 Prompt

---

**文档维护**: 请在修改提取策略后更新此文档

