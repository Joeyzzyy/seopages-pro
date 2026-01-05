# Site Context 字段获取策略完整文档

## 版本信息
- **版本**: 8.0.0
- **更新日期**: 2026-01-05
- **总字段数**: 17 个

## 概览

Site Context Acquisition 系统采用智能化、多层次的字段提取策略，针对不同类型的数据使用不同的提取方法：

- **Fast Fields (快速字段)**: 5 个 - 使用正则表达式，瞬间完成
- **Structured Fields (结构化字段)**: 2 个 - AI 增强的 DOM 解析
- **AI-Analyzed Fields (AI 分析字段)**: 10 个 - 深度内容理解

---

## 一、Fast Fields (快速字段) - 5 个

### 1. brand-assets (品牌资产)

**提取方法**: `regex` (正则表达式)  
**数据库类型**: `logo`  
**执行时间**: < 100ms

**目标页面**:
- `/` (首页)

**提取内容**:
- Logo (亮色/暗色变体)
- Favicon (亮色/暗色变体)
- 主色调 / 次要色调
- 标题字体 / 正文字体
- 品牌名称
- Meta 描述 / OG 图片
- 网站语言

**提取策略**:
1. **Logo**: 匹配多种模式
   - `<img class="*logo*" src="..."`
   - `<a class="*logo*"><img src="..."`
   - Header 中的第一个图片
   - 检测亮色/暗色变体 (`data-dark-src`, `logo-dark`)

2. **Favicon**: 优先级顺序
   - `<link rel="icon">`
   - `<link rel="shortcut icon">`
   - `<link rel="apple-touch-icon">`
   - Fallback: `/favicon.ico`

3. **颜色**: CSS 变量优先
   - `--primary-color`, `--brand-color`
   - `--secondary-color`, `--accent-color`
   - Fallback: 提取 Hex 颜色并过滤中性色

4. **字体**: 
   - Google Fonts API 链接
   - CSS `font-family` 声明

5. **Tone (语气)**: AI 分析（额外步骤）
   - 使用 GPT-4.1 分析前 3000 字符
   - 返回 2-5 词短语

**特殊处理**:
- HTML 实体解码 (`&amp;` → `&`)
- URL 规范化（相对路径 → 绝对路径）
- 去重和过滤无效数据

---

### 2. hero-section (首屏区域)

**提取方法**: `structured` (结构化 + AI fallback)  
**数据库类型**: `hero-section`  
**执行时间**: < 500ms (regex) / ~2s (AI)

**目标页面**:
- `/` (首页)

**提取内容**:
- Headline (主标题)
- Subheadline (副标题)
- Call-to-Action (CTA 按钮)
- Metrics (数据指标)

**提取策略**:
1. **正则提取** (优先):
   - 查找 `<section class="*hero*">` 或 `<div class="*hero*">`
   - Fallback: Header 后的第一个 section
   - 提取 `<h1>`, `<h2>`, `<p>`, CTA 按钮
   - 查找数字指标 (如 "10,000+ users")

2. **AI Fallback** (正则失败时):
   - 使用 GPT-4.1 分析前 4000 字符
   - 识别首屏区域的语义结构
   - 返回 JSON: `{headline, subheadline, callToAction, metrics}`

**验证**:
- 如果 headline、subheadline、CTA 全为空，触发 AI fallback

---

### 3. contact-info (联系信息)

**提取方法**: `regex` + 智能页面发现  
**数据库类型**: `contact-information`  
**执行时间**: < 1s

**目标页面** (优先级顺序):
- `/`
- `/contact`
- `/contact-us`
- `/about`
- `/about-us`

**智能页面发现关键词**:
- `contact`, `get-in-touch`, `reach-us`, `reach-out`, `connect`, `office`, `location`

**提取内容**:
- Emails (最多 5 个)
- Phones (最多 3 个)
- Address (地址)
- Social Links (Twitter, LinkedIn, Facebook, Instagram, YouTube, GitHub)

**提取策略**:
1. **从 Sitemap 和导航自动发现**包含 contact 关键词的页面
2. **比较多个页面**，选择联系信息最多的页面
3. **正则匹配**:
   - Email: `[a-z0-9._-]+@[a-z0-9._-]+\.[a-z0-9_-]+`
   - Phone: 支持多种格式，长度 10-20 字符
   - Address: `<address>` 标签或包含 "address|location" 的容器
   - Social: 匹配各平台的 URL 模式

4. **过滤**:
   - 排除 example.com、wixpress、sentry 等无效 email
   - 验证电话号码长度

**返回结构**:
```json
{
  "emails": ["email1", "email2"],
  "phones": ["phone1"],
  "address": "Full address",
  "social": {
    "twitter": "url",
    "linkedin": "url"
  },
  "primaryEmail": "first email",
  "primaryPhone": "first phone"
}
```

---

### 4. sitemap (网站地图)

**提取方法**: `regex`  
**数据库类型**: `sitemap`  
**执行时间**: < 2s

**目标页面** (尝试顺序):
- `/sitemap.xml`
- `/sitemap_index.xml`
- `/sitemap-index.xml`

**提取策略**:
1. 依次尝试上述 URL
2. 解析 XML，提取所有 `<loc>` 标签
3. 过滤掉 `.xml` 结尾的 URL (子 sitemap)
4. 限制最多 500 个 URL

**返回结构**:
```json
{
  "found": true,
  "url": "https://example.com/sitemap.xml",
  "urls": ["url1", "url2", ...],
  "count": 150
}
```

---

### 5. page-classification (页面分类)

**提取方法**: `regex` (基于 URL 模式)  
**数据库类型**: `multiple` (3 个类型)  
**执行时间**: < 100ms

**数据源**: Sitemap 中的所有 URL

**分类规则**:

**Key Pages (关键页面)**:
- 模式: `/`, `/about`, `/pricing`, `/features`, `/contact`, `/faq`, `/team`, `/careers`, `/products`, `/services`
- 或: pathname 深度 ≤ 1

**Blog Pages (博客资源)**:
- 模式: `/blog`, `/news`, `/articles`, `/posts`, `/resources`

**Landing Pages (着陆页)**:
- 模式: `/lp/`, `/vs/`, `/alternative`, `/for-`, `/compare`

**保存**:
- `key-website-pages`: 最多 30 个
- `landing-pages`: 最多 30 个
- `blog-resources`: 最多 30 个

---

## 二、Structured Fields (结构化字段) - 2 个

### 6. header (网站头部)

**提取方法**: `structured` (AI 增强 + Regex fallback)  
**数据库类型**: `header`  
**执行时间**: ~2-3s (AI) / < 500ms (regex)

**目标页面**:
- `/` (首页)

**提取内容**:
- Navigation links (导航链接)
- hasSearch (是否有搜索)
- hasCTA (是否有 CTA 按钮)
- ctaText (CTA 按钮文字)

**提取策略**:

**AI 增强提取** (优先，当 HTML > 100 字符):
1. 使用 GPT-4.1 分析 `<header>` 或 `<nav>` HTML
2. 提取前 4000 字符
3. 返回结构化 JSON
4. Temperature: 0 (确保一致性)

**Regex Fallback** (AI 失败时):
1. 匹配 `<header>` 或 `<nav>` 标签
2. 提取所有 `<a href="...">` 链接
3. 过滤掉 `#` 和 `javascript:` 链接
4. 按 label 去重（保留最多 15 个）
5. 检测 search、CTA 特征

**返回结构**:
```json
{
  "navigation": [
    {"text": "Products", "url": "/products"},
    {"text": "Pricing", "url": "/pricing"}
  ],
  "hasSearch": true,
  "hasCTA": true,
  "ctaText": "Sign Up"
}
```

---

### 7. footer (网站底部)

**提取方法**: `structured` (AI 增强 + Regex fallback)  
**数据库类型**: `footer`  
**执行时间**: ~2-3s (AI) / < 500ms (regex)

**目标页面**:
- `/` (首页)

**提取内容**:
- Columns (分栏链接组)
- Social links (社交链接)
- Copyright (版权信息)
- Address (地址)

**提取策略**:

**AI 增强提取** (优先):
1. 分析 `<footer>` HTML (前 4000 字符)
2. 识别栏目结构和层级
3. 提取社交链接和元信息

**Regex Fallback**:
1. 查找 `<footer>` 标签
2. 匹配 column/section 容器
3. 提取每栏的标题 (`<h3-6>`, `<strong>`)
4. 提取链接（最多 10 个/栏）
5. 提取版权、社交链接

**返回结构**:
```json
{
  "columns": [
    {
      "title": "Products",
      "links": [{"text": "Feature 1", "url": "/feature1"}]
    }
  ],
  "socialLinks": [{"platform": "twitter", "url": "..."}],
  "copyright": "© 2026 Company",
  "address": "123 Main St"
}
```

---

## 三、AI-Analyzed Fields (AI 分析字段) - 10 个

### 8. tone (品牌语气)

**提取方法**: `ai`  
**数据库类型**: `logo` (tone 字段)  
**执行时间**: ~1-2s

**目标页面**:
- `/`
- `/about`
- `/about-us`

**AI Prompt**:
```
Analyze the tone and voice of this website's content.
Return ONLY a short phrase (2-5 words) like:
- "Professional and authoritative"
- "Friendly and conversational"
```

**配置**:
- Model: GPT-4.1
- Max Tokens: 50
- Content Length: 前 3000 字符

**保存方式**:
更新 `logo` 类型记录的 `tone` 字段

---

### 9. problem-statement (问题陈述)

**提取方法**: `ai`  
**数据库类型**: `problem-statement`  
**执行时间**: ~3-5s

**目标页面** (优先级顺序):
- `/`
- `/about`
- `/about-us`
- `/why-us`
- `/solutions`

**AI Prompt**:
```
Extract the PROBLEM STATEMENT from this website.
Write 2-3 paragraphs (200-400 words) describing:
- The core problem(s) being solved
- Who experiences these problems
- The impact/cost of not solving them
```

**配置**:
- Model: GPT-4.1
- Max Tokens: 1500
- Content Length: 前 8000 字符

**返回**: 纯文本（非 JSON）

---

### 10. who-we-serve (目标用户)

**提取方法**: `ai` + 智能页面发现  
**数据库类型**: `who-we-serve`  
**执行时间**: ~3-5s

**目标页面**:
- `/`, `/customers`, `/for-teams`, `/industries`, `/solutions`, `/about`

**智能页面发现关键词**:
- `customers`, `industries`, `for-`, `solutions`, `who-we-serve`, `target`

**AI Prompt**:
```
Identify WHO THIS PRODUCT/SERVICE SERVES.
Write 1-2 paragraphs (100-200 words) covering:
- Primary target audience/customer segments
- Types of businesses or individuals
- Company sizes (startup, SMB, enterprise)
- Any specific roles or departments
```

**策略**:
1. 从 Sitemap 和导航发现相关页面
2. 选择内容最丰富的页面
3. AI 分析提取

**返回**: 纯文本

---

### 11. use-cases (使用场景)

**提取方法**: `ai` + 智能页面发现  
**数据库类型**: `use-cases`  
**执行时间**: ~3-5s

**目标页面**:
- `/`, `/use-cases`, `/solutions`, `/features`, `/how-it-works`

**智能页面发现关键词**:
- `use-cases`, `solutions`, `examples`, `customers`, `case-studies`, `applications`

**AI Prompt**:
```
List the main USE CASES for this product/service.
Return as a simple string (NOT JSON) with this format:
- Use Case 1: [Name] - [Brief description]
- Use Case 2: [Name] - [Brief description]
...
Include 5-10 use cases total.
```

**策略**:
1. 智能发现相关页面
2. 选择内容最长的页面
3. AI 提取并格式化为列表

**返回**: 纯文本列表（易于前端显示）

---

### 12. industries (目标行业)

**提取方法**: `ai` + 智能页面发现  
**数据库类型**: `industries`  
**执行时间**: ~3-5s

**目标页面** (扩展列表):
- `/`, `/industries`, `/solutions`, `/customers`, `/case-studies`
- `/verticals`, `/sectors`, `/who-we-serve`, `/use-cases`
- `/for-enterprise`, `/for-business`

**智能页面发现关键词**:
- `industries`, `verticals`, `sectors`, `solutions`, `customers`, `case-studies`, `use-cases`

**AI Prompt**:
```
Identify the INDUSTRIES this product/service targets.
Format as a structured list like:
- Healthcare: [how product helps healthcare]
- Finance: [how product helps finance]
...
```

**策略**:
1. 扩展的目标页面列表（10 个）
2. 智能发现并比较页面
3. AI 提取行业信息

**返回**: 纯文本列表

---

### 13. products-services (产品服务)

**提取方法**: `ai` + 智能页面发现  
**数据库类型**: `products-services`  
**执行时间**: ~3-5s

**目标页面** (扩展列表):
- `/`, `/products`, `/services`, `/features`, `/pricing`
- `/solutions`, `/what-we-do`, `/offerings`, `/plans`, `/packages`

**智能页面发现关键词**:
- `products`, `services`, `pricing`, `features`, `solutions`, `offerings`, `plans`

**AI Prompt**:
```
Describe the PRODUCTS and SERVICES offered.
Write 2-4 paragraphs (300-500 words) covering:
- Main product/service offerings
- Key features and capabilities
- Pricing tiers if mentioned
- Differentiators or unique selling points
```

**策略**:
1. 智能发现产品/定价页面
2. 选择最详细的页面
3. AI 提取完整描述

**返回**: 纯文本

---

### 14. about-us (关于我们)

**提取方法**: `ai` + 智能页面发现 + 多页面聚合  
**数据库类型**: `about-us`  
**执行时间**: ~5-8s

**目标页面**:
- `/about`, `/about-us`, `/company`, `/our-story`, `/`

**智能页面发现关键词**:
- `about`, `company`, `story`, `mission`, `values`, `who-we-are`

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

**策略**:
1. 智能发现 about 相关页面
2. 选择内容最丰富的页面
3. AI 提取结构化信息

**返回**: JSON 对象

---

### 15. leadership-team (领导团队)

**提取方法**: `ai` + 智能页面发现 + 多页面聚合  
**数据库类型**: `leadership-team`  
**执行时间**: ~5-10s

**目标页面** (扩展列表):
- `/about`, `/about-us`, `/team`, `/our-team`, `/leadership`
- `/company`, `/management`, `/founders`, `/people`
- `/meet-the-team`, `/executive-team`, `/who-we-are`

**智能页面发现关键词**:
- `team`, `leadership`, `about`, `management`, `founders`, `people`, `executive`, `who-we-are`

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

**策略**:
1. 智能发现团队相关页面（多达 5 个）
2. 选择内容最长的页面
3. **特殊处理**: 如果结果为空数组且有多个页面，合并前 3 个页面内容（最多 12000 字符）重新分析
4. AI 提取团队成员信息

**返回**: JSON 数组

---

### 16. faq (常见问题)

**提取方法**: `ai` + 智能页面发现  
**数据库类型**: `faq`  
**执行时间**: ~5-8s

**目标页面** (扩展列表):
- `/faq`, `/faqs`, `/help`, `/support`, `/frequently-asked-questions`
- `/`, `/help-center`, `/knowledge-base`, `/questions`, `/common-questions`

**智能页面发现关键词**:
- `faq`, `help`, `support`, `questions`, `knowledge`, `docs`

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
- Include full answer text (can be multiple paragraphs)
- If answer is very long (500+ words), summarize key points
```

**配置** (特殊 - 最高配额):
- Model: GPT-4.1
- **Max Tokens: 4000** ⬆️ (最高)
- **Content Length: 20000 字符** ⬆️ (最高)

**策略**:
1. 智能发现 FAQ 相关页面
2. 选择最详细的页面
3. AI 提取完整 FAQ 列表
4. **多层验证**:
   - 类型验证（确保是数组）
   - 结构验证（每项有 question 和 answer）
   - 过滤无效项

**返回**: JSON 数组

**为什么需要高配额**:
- 1 条 FAQ 平均 80-120 tokens
- 20 条 FAQ 需要约 2400-3000 tokens
- 加上 JSON 结构，4000 tokens 确保完整性

---

### 17. social-proof (社会证明)

**提取方法**: `ai` + 智能页面发现 + 外部平台抓取  
**数据库类型**: `social-proof-trust`  
**执行时间**: ~10-15s

**目标页面** (扩展列表):
- `/`, `/customers`, `/testimonials`, `/case-studies`, `/about`
- `/reviews`, `/clients`, `/success-stories`, `/wall-of-love`

**智能页面发现关键词**:
- `testimonials`, `reviews`, `customers`, `case-studies`, `success`, `clients`, `wall-of-love`

#### A. 网站内容提取

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

**策略**:
1. 智能发现 testimonials/reviews 页面（最多 3 个）
2. 合并多个页面内容（最多 12000 字符）
3. AI 提取社会证明元素

#### B. 外部平台抓取 (增强)

**支持平台**:
1. **ProductHunt**
2. **Trustpilot**
3. **G2**
4. **Capterra**

**命名变体生成**:
```typescript
// 从 domain "seopage.ai" 生成：
- seopage-ai    // 点号转横线
- seopageai     // 完全清理
- seopage       // 基础名称
- seopage-ai    // 基础 + ai
```

**URL 尝试策略**:

**ProductHunt** (2-4 次尝试):
- `/products/seopage-ai`
- `/products/seopageai`
- `/products/seopage`
- `/posts/seopage-ai`

**Trustpilot** (2 次尝试):
- `/review/seopage.ai`
- `/review/www.seopage.ai`

**G2 & Capterra** (每个 2-4 次尝试):
- 使用所有命名变体

**提取信息**:
- **Rating** (评分): 多种模式匹配
  - `X out of 5`, `★ X`, `rating: X`, `"ratingValue": "X"`
- **Review Count** (评论数)
  - `X reviews`, `"reviewCount": "X"`, `based on X reviews`
- **Upvotes** (ProductHunt)
  - `X upvotes`
- **Awards** (ProductHunt)
  - "Product of the Day/Week/Month"
  - "#X Product of the Day"
  - "Golden Kitty Award"

**页面验证**:
- 检查是否包含公司名或域名
- 排除 404 和空搜索结果
- 验证内容相关性

**失败降级**:
```json
{
  "platform": "producthunt",
  "found": false,
  "searchUrl": "https://www.producthunt.com/search?q=seopage",
  "message": "自动抓取失败，请手动访问：..."
}
```

**返回结构**:
```json
{
  "testimonials": [...],
  "metrics": "...",
  "awards": "...",
  "badges": "...",
  "partners": "...",
  "companyName": "seopage",
  "companyDomain": "seopage.ai",
  "externalReviews": [
    {
      "platform": "producthunt",
      "rating": "4.8",
      "reviewCount": "125",
      "upvotes": "342",
      "awards": ["#3 Product of the Day"],
      "url": "...",
      "found": true
    }
  ]
}
```

---

## 四、智能页面发现系统

### 工作原理

```typescript
async function discoverRelevantPages(field, origin, homePageHtml) {
  // 1. 定义字段关键词
  const keywords = fieldKeywords[field];
  
  // 2. 从 Sitemap 搜索
  const sitemapUrls = await fetchSitemap(origin);
  const fromSitemap = filterByKeywords(sitemapUrls, keywords);
  
  // 3. 从导航搜索
  const navLinks = extractNavigationLinks(homePageHtml, origin);
  const fromNav = filterByKeywords(navLinks, keywords);
  
  // 4. 合并去重
  const discovered = [...new Set([...fromSitemap, ...fromNav])];
  
  // 5. 按相关性排序
  discovered.sort((a, b) => {
    const aScore = countKeywords(a, keywords);
    const bScore = countKeywords(b, keywords);
    return bScore - aScore;
  });
  
  // 6. 返回前 5 个
  return discovered.slice(0, 5);
}
```

### 字段关键词映射

| 字段 | 关键词 |
|------|--------|
| leadership-team | team, leadership, about, management, founders, people, executive, who-we-are |
| industries | industries, verticals, sectors, solutions, customers, case-studies, use-cases |
| products-services | products, services, pricing, features, solutions, offerings, plans |
| faq | faq, help, support, questions, knowledge, docs |
| about-us | about, company, story, mission, values, who-we-are |
| use-cases | use-cases, solutions, examples, customers, case-studies, applications |
| who-we-serve | customers, industries, for-, solutions, who-we-serve, target |
| contact-info | contact, get-in-touch, reach-us, reach-out, connect, office, location |
| social-proof | testimonials, reviews, customers, case-studies, success, clients, wall-of-love |

---

## 五、缓存机制

### 三层缓存

1. **页面内容缓存**
   - TTL: 5 分钟
   - 存储: HTML + 纯文本
   - 避免重复抓取同一页面

2. **Sitemap 缓存**
   - TTL: 5 分钟
   - 存储: URL 列表
   - 智能页面发现时复用

3. **导航链接缓存**
   - TTL: 5 分钟
   - 存储: Header/Nav 中的链接
   - 减少重复解析

### 缓存效果

```typescript
// 17 个字段提取，实际 HTTP 请求数：
// - 无缓存: ~50-80 次
// - 有缓存: ~15-25 次 ✅ (节省 60-70%)
```

---

## 六、性能优化

### Token 预算管理

| 字段类型 | Max Tokens | Content Chars | 说明 |
|---------|-----------|---------------|------|
| FAQ | 4000 | 20000 | 最高配额 |
| 其他 AI 字段 | 1500 | 8000 | 标准配额 |
| Fast Fields | N/A | N/A | 无 AI 调用 |

### 执行时间预估

| 阶段 | 字段数 | 预估时间 |
|------|--------|---------|
| Fast Fields | 5 | 3-5 秒 |
| Structured Fields | 2 | 4-6 秒 |
| AI Fields (简单) | 5 | 15-25 秒 |
| AI Fields (复杂) | 5 | 25-40 秒 |
| **总计** | **17** | **~50-75 秒** |

### 并行优化建议

虽然当前是串行执行，但可以考虑：
- Fast Fields 并行执行
- 同组 AI Fields 批量请求
- 预期总时间可减少到 30-40 秒

---

## 七、错误处理

### 分级容错

1. **Level 1: 页面级**
   - 目标页面不可访问 → 尝试下一个
   - 所有目标页面失败 → Fallback 到首页

2. **Level 2: 提取级**
   - Regex 失败 → AI Fallback (header, footer)
   - AI 返回错误 → 返回空值或默认值

3. **Level 3: 数据级**
   - JSON 解析失败 → 返回原始字符串
   - 数组为空 → 保留空数组
   - 字段缺失 → 标记为未提取

### 日志记录

```typescript
// 每个字段提取完成后：
console.log(`✅ ${field} acquired in ${duration}ms from ${usedPage}`);

// 智能页面发现：
console.log(`Discovered ${count} pages for ${field}:`, pages);

// 错误捕获：
console.error(`❌ Error acquiring ${field}:`, error);
```

---

## 八、数据验证

### FAQ 特殊验证

```typescript
// 1. 类型验证
if (!Array.isArray(extractedData)) { /* 修复 */ }

// 2. 结构验证
extractedData = extractedData.filter(item => 
  item && item.question && item.answer &&
  typeof item.question === 'string' &&
  typeof item.answer === 'string'
);

// 3. 记录日志
console.log(`Validated ${extractedData.length} FAQ items`);
```

### 通用验证

- **URL 规范化**: 相对路径 → 绝对路径
- **HTML 实体解码**: `&amp;` → `&`
- **去重**: 基于 label、URL 等
- **长度限制**: 防止过长内容

---

## 九、最佳实践

### 字段提取顺序

**推荐顺序**（Skill 定义）:
1. Fast Fields (1-5)
2. Structured Fields (6-7)
3. AI Fields (8-17)

**原因**:
- 快速字段提供基础信息
- 结构化字段提供导航信息（用于智能发现）
- AI 字段利用前面的信息优化提取

### 重试策略

**不建议频繁重试**:
- 每次完整提取需要 50-75 秒
- Token 成本较高

**建议场景**:
- 初次提取（获取完整数据）
- 网站更新后（刷新数据）
- 单个字段提取失败（按需重跑）

### 数据刷新周期

| 字段类型 | 推荐刷新周期 |
|---------|-------------|
| Fast Fields | 每月 |
| About/Team | 每季度 |
| Products/Pricing | 每月 |
| FAQ | 每月 |
| Social Proof | 每月 |

---

## 十、故障排查

### 常见问题

| 问题 | 可能原因 | 解决方案 |
|------|---------|---------|
| 字段返回空 | 页面无相关内容 | 检查 targetPages 配置 |
| FAQ 被截断 | Token 限制 | 已提升到 4000 tokens |
| 外部平台失败 | URL 命名不匹配 | 检查命名变体 |
| AI 返回格式错误 | Prompt 不够清晰 | 优化 prompt |
| 提取时间过长 | 网站响应慢 | 增加超时设置 |

### Debug 日志

查看控制台输出：
```
[acquire_context_field] 🎯 Acquiring field: faq from https://example.com
[discoverRelevantPages] Found 3 relevant pages for faq
[acquire_context_field] Using https://example.com/faq for faq
[acquire_context_field] Validated 14 FAQ items
[acquire_context_field] ✅ faq acquired in 6234ms from /faq
```

---

## 附录

### A. 数据库字段映射

| Field Name | DB Type | Table Column |
|-----------|---------|--------------|
| brand-assets | logo | file_url, primary_color, tone, etc. |
| hero-section | hero-section | content (JSON) |
| contact-info | contact-information | content (JSON) |
| sitemap | sitemap | content (JSON) |
| page-classification | multiple | 3 separate records |
| header | header | content (JSON) |
| footer | footer | content (JSON) |
| tone | logo | tone field |
| problem-statement | problem-statement | content (text) |
| who-we-serve | who-we-serve | content (text) |
| use-cases | use-cases | content (text) |
| industries | industries | content (text) |
| products-services | products-services | content (text) |
| about-us | about-us | content (JSON) |
| leadership-team | leadership-team | content (JSON array) |
| faq | faq | content (JSON array) |
| social-proof | social-proof-trust | content (JSON) |

### B. 版本历史

- **v8.0.0** (2026-01-05): 
  - 增强 FAQ 提取（4000 tokens）
  - 优化 use-cases 格式（纯文本列表）
  - 修复数据保存格式问题
  - 增强 social-proof 外部平台抓取

- **v7.0.0**: AI 增强 header/footer 提取
- **v6.0.0**: 智能页面发现系统
- **v5.0.0**: 多页面内容聚合

---

## 总结

Site Context Acquisition 系统采用**三层提取策略**：
1. **Fast Fields**: 秒级提取基础信息
2. **Structured Fields**: AI 增强的结构化解析
3. **AI Fields**: 深度内容理解和智能发现

**核心优势**：
- ✅ 完整性：17 个字段覆盖所有关键信息
- ✅ 智能化：自动发现相关页面
- ✅ 可靠性：多层容错和降级机制
- ✅ 高效性：缓存和并行优化

**适用场景**：
- 新网站上线时的完整信息提取
- 定期刷新网站数据
- 竞争对手分析
- 内容创作参考

