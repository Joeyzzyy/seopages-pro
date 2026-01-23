# 🚀 Alternative 页面生成工作流

## 概述

Alternative 页面（竞争对手对比页面）是一种高转化的营销着陆页，通过对比分析帮助用户了解为什么应该选择你的产品。

本工作流采用**模块化架构**：
1. 每个 Section 独立生成，确保质量控制
2. 每个 Section 工具返回优化的 HTML
3. 组装所有 Section 成完整页面
4. 集成站点 Header/Footer

---

## 执行流程 (6 个阶段)

### Phase 0: PLANNING (强制前置)

| 步骤 | 工具 | 用途 |
|------|------|------|
| 0 | `create_plan` | **必须！** 任何工具调用之前必须先规划 |

> ⚠️ 这是强制规则，没有例外。即使是简单任务也必须先规划。

---

### Phase 1: CONTEXT GATHERING (获取上下文)

| 步骤 | 工具 | 用途 |
|------|------|------|
| 1 | `get_content_item_detail(item_id)` | 获取内容大纲、TDK、关键词 |
| 2 | `get_site_contexts(user_id, projectId, types)` | 获取 Logo、Header、Footer、竞争对手等 |
| 3 | `resolve_page_logos(...)` | **关键！** 解析品牌和竞争对手 Logo |

#### `get_site_contexts` 支持的 types

```typescript
types: [
  'logo',              // Logo URL + 品牌颜色 (primary_color, secondary_color)
  'header',            // 站点 Header HTML
  'footer',            // 站点 Footer HTML
  'competitors',       // 竞争对手列表 JSON
  'about-us',          // 公司信息
  'products-services', // 产品/服务信息
  'meta',              // Meta 标签
  'sitemap',           // 站点地图
  'faq',               // FAQ 内容
  'contact-information' // 联系信息
]
```

#### `resolve_page_logos` 返回值

```typescript
{
  brand: {
    name: string,
    logo_url: string,        // 用于所有品牌 Logo 实例
    logo_source: 'context' | 'favicon' | 'svg',
    primary_color: string,
    secondary_color: string,
  },
  competitor: {
    name: string,
    logo_url: string,        // 用于所有竞争对手 Logo 实例
    logo_source: 'context' | 'favicon' | 'svg',
  },
  brand_logo_html: string,       // 带 fallback 的 HTML
  competitor_logo_html: string,  // 带 fallback 的 HTML
}
```

**Logo 来源优先级：**
1. `site_contexts.logo` (logo_light_url, logo_dark_url, file_url)
2. `site_contexts.competitors` (logo_url in competitor array)
3. Google Favicon API (`https://www.google.com/s2/favicons?domain=xxx&sz=128`)
4. Generated SVG (base64 with initial letter)

---

### Phase 2: PRODUCT RESEARCH (深度研究)

| 步骤 | 工具 | 用途 |
|------|------|------|
| 4 | `web_search(query)` | Tavily 实时网络搜索 |
| 5 | `perplexity_search(query, search_type)` | Perplexity AI 深度搜索 |
| 6 | `capture_website_screenshot(url)` | 捕获网站截图 (可选) |

#### `perplexity_search` 搜索类型

```typescript
search_type: [
  'brand_news',          // 品牌新闻、公告
  'social_sentiment',    // 社交媒体情绪分析 (X/Twitter, Reddit)
  'algorithm_update',    // Google 算法更新分析
  'product_launch',      // 产品发布信息
  'funding_partnership', // 融资、合作信息
  'deep_investigation'   // 360° 深度调查 (默认)
]
```

#### `web_search` 参数

```typescript
{
  query: string,
  search_depth: 'basic' | 'advanced',
  include_domains?: string[],
  exclude_domains?: string[],
}
```

---

### Phase 3: SECTION GENERATION (模块化生成)

#### ⭐ 必须生成的 Section

| 步骤 | 工具 | 用途 |
|------|------|------|
| 7 | `generate_hero_section` | ⭐ VS Logo 对比、主标题、CTA |
| 8 | `generate_verdict_section` | ⭐ 胜者声明、关键指标 |
| 9 | `generate_comparison_table` | ⭐ 功能对比表格 (8-15 功能) |
| 10 | `generate_faq_section` | ⭐ FAQ + Schema.org 标记 |
| 11 | `generate_cta_section` | ⭐ 最终转化 CTA |

#### 📦 推荐生成的 Section

| 工具 | 用途 |
|------|------|
| `generate_toc_section` | 目录导航 |
| `generate_pricing_section` | 定价对比 |
| `generate_pros_cons_section` | 优缺点对比 |
| `generate_use_cases_section` | 使用场景分析 |
| `generate_screenshots_section` | 产品截图对比 |

#### Section 工具参数示例

**`generate_hero_section`**
```typescript
{
  brand: {
    name: string,
    logo_url?: string,
    tagline?: string,
    primary_color?: string,  // 默认 #0ea5e9
  },
  competitor: {
    name: string,
    logo_url?: string,
  },
  seo_description?: string,
  cta_primary?: { text: string, url: string },
  author?: { name: string, role?: string },
  last_updated?: string,
}
```

**`generate_comparison_table`**
```typescript
{
  brand: { name: string, logo_url?: string },
  competitor: { name: string, logo_url?: string },
  features: [{
    name: string,
    description?: string,
    brand_value: string,
    brand_status: 'yes' | 'partial' | 'no' | 'badge',
    competitor_value: string,
    competitor_status: 'yes' | 'partial' | 'no' | 'badge',
  }],
  brand_wins: string[],      // 品牌优势列表
  competitor_wins: string[], // 竞争对手优势列表
}
```

**`generate_faq_section`**
```typescript
{
  brand_name: string,
  competitor_name: string,
  faqs: [{
    question: string,
    answer: string,  // 支持 Markdown
  }],
}
```

---

### Phase 4: PAGE ASSEMBLY (页面组装)

| 步骤 | 工具 | 用途 |
|------|------|------|
| 12 | `assemble_alternative_page(...)` | 组装所有 section 为完整 HTML |

#### 完整参数

```typescript
assemble_alternative_page({
  item_id: string,           // 内容项 ID
  page_title: string,        // 页面标题
  seo: {
    meta_description: string, // 最大 160 字符
    keywords?: string[],
    canonical_url?: string,
    og_image?: string,
  },
  brand: {
    name: string,
    logo_url?: string,
    primary_color?: string,   // 仅用于按钮和图标
    secondary_color?: string,
  },
  competitor_name: string,
  sections: {
    hero: string,       // ⭐ 必须
    verdict: string,    // ⭐ 必须
    comparison: string, // ⭐ 必须
    faq: string,        // ⭐ 必须
    cta: string,        // ⭐ 必须
    toc?: string,
    pricing?: string,
    screenshots?: string,
    pros_cons?: string,
    use_cases?: string,
    custom?: string[],  // 自定义 section
  }
})
```

#### 验证规则

工具会**拒绝执行**如果：
- 缺少必须的 section (hero, verdict, comparison, faq, cta)
- section 内容包含占位符 ("...", "[content]" 等)
- section 内容少于 50 字符
- section 内容不包含 HTML 标签

---

### Phase 5: SITE INTEGRATION (站点集成)

| 步骤 | 工具 | 用途 |
|------|------|------|
| 13 | `merge_html_with_site_contexts(item_id)` | **必须！** 合并 Header/Footer |
| 14 | `fix_style_conflicts(item_id)` | 修复 CSS 样式冲突 |

#### `merge_html_with_site_contexts`

- 自动从 `site_contexts` 表获取 header 和 footer
- 将相对 URL 转换为绝对 URL
- 如果没有 footer，会生成一个符合 EEAT 的默认 footer
- 结果自动保存到数据库

#### `fix_style_conflicts`

- CSS 作用域隔离，防止 header/footer 样式冲突
- 移除嵌入的 Theme Switcher HTML
- 清理 null 字符
- 结果自动保存到数据库

---

### Phase 6: FINALIZE (完成保存)

| 步骤 | 工具 | 用途 |
|------|------|------|
| 15 | `save_final_page(item_id)` | **必须！** 最终保存 |

#### 执行内容

1. 更新 `content_items` 状态为 `generated`
2. 上传 HTML 文件到 Supabase Storage
3. 创建文件记录
4. 扣除用户 1 个积分
5. 返回预览 URL 和公开 URL

#### 返回值

```typescript
{
  success: true,
  item_id: string,
  filename: string,
  publicUrl: string,      // Storage 公开 URL
  previewUrl: string,     // /api/preview/{item_id}
  creditConsumed: boolean,
}
```

---

## ⚡ 完整流程图

```
┌─────────────────────────────────────────────────────────────────┐
│  Phase 0: PLANNING                                              │
│  └── create_plan  ← 必须第一步                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 1: CONTEXT GATHERING                                      │
│  ├── get_content_item_detail                                     │
│  ├── get_site_contexts                                           │
│  └── resolve_page_logos  ← Logo 解析                             │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 2: PRODUCT RESEARCH                                       │
│  ├── web_search                                                  │
│  ├── perplexity_search                                           │
│  └── capture_website_screenshot (可选)                           │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 3: SECTION GENERATION                                     │
│                                                                  │
│  ⭐ REQUIRED:                                                    │
│  ├── generate_hero_section                                       │
│  ├── generate_verdict_section                                    │
│  ├── generate_comparison_table                                   │
│  ├── generate_faq_section                                        │
│  └── generate_cta_section                                        │
│                                                                  │
│  📦 RECOMMENDED:                                                 │
│  ├── generate_toc_section                                        │
│  ├── generate_pricing_section                                    │
│  ├── generate_pros_cons_section                                  │
│  ├── generate_use_cases_section                                  │
│  └── generate_screenshots_section                                │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 4: PAGE ASSEMBLY                                          │
│  └── assemble_alternative_page                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 5: SITE INTEGRATION                                       │
│  ├── merge_html_with_site_contexts                               │
│  └── fix_style_conflicts                                         │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 6: FINALIZE                                               │
│  └── save_final_page  ✅                                         │
│      ├── HTML 文件生成                                           │
│      ├── 预览链接                                                │
│      └── 扣除积分                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 API 依赖

| 服务 | 环境变量 | 用途 |
|------|----------|------|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | 数据库存储 |
| Tavily | `TAVILY_API_KEY` | 网络搜索 |
| Perplexity | `PERPLEXITY_API_KEY` | 深度 AI 搜索 |
| ScreenshotMachine | `SCREENSHOTMACHINE_API_KEY` | 网站截图 |
| Azure OpenAI | 相关配置 | AI 内容生成 |

---

## 🎨 颜色系统 (极简主义)

### 原则

- **品牌颜色**仅用于按钮和图标
- **其他一切**使用黑白灰
- **深度**通过阴影实现，不是颜色

### CSS 变量

```css
:root {
  /* 品牌颜色 - 仅用于按钮和图标 */
  --brand-500: hsl(H, S%, 50%);
  --brand-600: hsl(H, S%, 45%);
  --brand-700: hsl(H, S%, 38%);
  
  /* 阴影系统 */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

### 使用规则

| 元素 | 允许使用品牌颜色 | 应该使用的颜色 |
|------|------------------|----------------|
| `.btn-primary` | ✅ | 品牌主色 |
| `.icon-brand` | ✅ | 品牌主色 |
| `.badge-winner` | ✅ | 品牌主色 |
| `.status-yes` | ✅ | 品牌主色 |
| Section 背景 | ❌ | white, #fafafa, #f5f5f5 |
| Card 背景 | ❌ | white |
| 文字 | ❌ | #171717, #525252, #a3a3a3 |
| 边框 | ❌ | #e5e5e5, #d4d4d4 |

---

## 📄 输出 Schema

```json
{
  "success": true,
  "item_id": "uuid",
  "html_length": 45000,
  "line_count": 1500,
  "sections_included": ["hero", "toc", "verdict", "comparison", "pricing", "pros_cons", "use_cases", "faq", "cta"],
  "preview_url": "/api/preview/{item_id}",
  "public_url": "https://storage.supabase.co/..."
}
```

---

## ⚠️ 关键注意事项

### 禁止事项

1. **绝不使用占位符**
   - ❌ `"..."`
   - ❌ `"[content]"`
   - ❌ `"[section]"`

2. **绝不为竞争对手提供 CTA**
   - ❌ "Visit [Competitor]" 按钮
   - ❌ "Try [Competitor]" 链接

3. **绝不跳过步骤**
   - 必须调用 `merge_html_with_site_contexts`
   - 必须调用 `save_final_page`

### CTA 策略

所有 CTA 只链接到**品牌站点**：

```markdown
✅ 允许:
- Hero: "Try [Brand] Free"
- Verdict: "Try [Brand]"
- Final CTA: 强转化 + 紧迫感

❌ 禁止:
- 任何指向竞争对手的链接
```

---

## 📄 输出示例参考

完整的输出示例请参考:
- 源文件: [`output.html`](../output.html)
- 在线预览: [`/demo/seopage-vs-writesonic-example.html`](/demo/seopage-vs-writesonic-example.html)

### 示例页面结构 (SEOPage.ai vs Writesonic)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- SEO Meta Tags -->
  <title>SEOPage.ai vs Writesonic: Which AI Content Platform Wins in 2026?</title>
  <meta name="description" content="Compare SEOPage.ai and Writesonic...">
  <meta name="keywords" content="Writesonic alternative, SEOPage.ai vs Writesonic...">
  <link rel="canonical" href="https://seopage.ai/alternatives/...">
  
  <!-- Open Graph -->
  <meta property="og:title" content="...">
  <meta property="og:description" content="...">
  
  <!-- Schema.org Structured Data -->
  <script type="application/ld+json">{ "@type": "Article", ... }</script>
  <script type="application/ld+json">{ "@type": "ItemList", ... }</script>
  <script type="application/ld+json">{ "@type": "BreadcrumbList", ... }</script>
  
  <!-- Tailwind CSS + Custom Styles -->
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    :root {
      --brand-500: hsl(H, S%, 50%);
      --brand-600: hsl(H, S%, 45%);
      /* ... */
    }
    .btn-primary { ... }
    .card { ... }
    /* ... */
  </style>
</head>
<body>
  <!-- Header (from site_contexts) -->
  <header>...</header>
  
  <!-- Main Content -->
  <div class="page-content-scope">
    <!-- Hero Section -->
    <section class="...">
      <!-- VS Logos -->
      <!-- H1 Title -->
      <!-- Description -->
      <!-- CTA Button -->
    </section>
    
    <!-- Table of Contents -->
    <nav id="toc">...</nav>
    
    <!-- Quick Verdict Section -->
    <section id="verdict">
      <!-- Winner Announcement -->
      <!-- Stats Grid -->
      <!-- Side by Side Cards -->
      <!-- Bottom Line Summary -->
    </section>
    
    <!-- Screenshots Section -->
    <section id="screenshots">...</section>
    
    <!-- Feature Comparison Table -->
    <section id="comparison">
      <!-- Table with brand vs competitor -->
      <!-- Summary Cards -->
    </section>
    
    <!-- Pricing Section -->
    <section id="pricing">...</section>
    
    <!-- Pros & Cons Section -->
    <section id="pros-cons">...</section>
    
    <!-- Use Cases Section -->
    <section id="use-cases">...</section>
    
    <!-- FAQ Section -->
    <section id="faq">
      <!-- FAQ Items -->
      <!-- FAQ Schema.org -->
    </section>
    
    <!-- Final CTA Section -->
    <section id="cta">...</section>
  </div>
  
  <!-- Footer (from site_contexts) -->
  <footer>...</footer>
  
  <!-- Scripts -->
  <script>
    // Scroll to top
    // TOC highlighting
    // FAQ accordion
  </script>
</body>
</html>
```

### 关键 Section 示例

#### Hero Section

```html
<section class="relative overflow-hidden pt-20 md:pt-28 pb-16 md:pb-24 px-4 md:px-6 bg-white">
  <!-- Grid Pattern Background -->
  <div class="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
  
  <div class="relative max-w-5xl mx-auto">
    <!-- Breadcrumb -->
    <nav aria-label="Breadcrumb">
      Home > Alternatives > vs Competitor
    </nav>
    
    <!-- VS Logos -->
    <div class="flex items-center justify-center gap-4 md:gap-6 mb-8">
      <div class="flex flex-col items-center">
        <img src="brand-logo.png" alt="Brand" class="w-16 h-16 md:w-20 md:h-20 rounded-2xl shadow-lg">
        <span class="mt-2 text-sm font-semibold text-gray-900">Brand</span>
      </div>
      <span class="text-2xl md:text-3xl font-bold text-gray-300">VS</span>
      <div class="flex flex-col items-center">
        <img src="competitor-logo.png" alt="Competitor" class="w-16 h-16 md:w-20 md:h-20 rounded-2xl shadow-lg">
        <span class="mt-2 text-sm font-semibold text-gray-700">Competitor</span>
      </div>
    </div>
    
    <!-- Title -->
    <h1 class="text-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900">
      <span class="text-brand">Brand</span> vs Competitor
    </h1>
    
    <!-- Description -->
    <p class="text-center text-base md:text-lg text-gray-600 max-w-3xl mx-auto mb-8">
      SEO description here...
    </p>
    
    <!-- CTA -->
    <div class="flex items-center justify-center">
      <a href="https://brand.com" class="btn-primary px-6 md:px-8 py-3 md:py-4 rounded-xl">
        Try Brand Free
      </a>
    </div>
  </div>
</section>
```

#### Comparison Table Section

```html
<section id="comparison" class="py-12 md:py-20 px-4 md:px-6 bg-white">
  <div class="max-w-5xl mx-auto">
    <!-- Header -->
    <div class="text-center mb-8">
      <span class="badge">Detailed Analysis</span>
      <h2 class="font-serif text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900">
        Feature-by-Feature Comparison
      </h2>
    </div>
    
    <!-- Table -->
    <div class="overflow-x-auto rounded-xl border border-gray-200 shadow-md">
      <table class="w-full min-w-[500px]">
        <thead>
          <tr class="bg-gray-50 border-b border-gray-200">
            <th class="text-left px-3 md:px-5 py-3 md:py-4">Feature</th>
            <th class="text-center px-2 md:px-4 py-3 md:py-4">
              <img src="brand-logo.png"> Brand
            </th>
            <th class="text-center px-2 md:px-4 py-3 md:py-4">
              <img src="competitor-logo.png"> Competitor
            </th>
          </tr>
        </thead>
        <tbody>
          <tr class="table-row-alt border-b border-gray-100">
            <td class="px-3 md:px-5 py-3 md:py-4">
              <div class="font-medium text-gray-900">Feature Name</div>
              <div class="text-xs text-gray-500">Description</div>
            </td>
            <td class="text-center">
              <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-900">
                <svg class="w-3 h-3 text-brand">✓</svg>
                Full support
              </span>
            </td>
            <td class="text-center">
              <span class="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                Partial
              </span>
            </td>
          </tr>
          <!-- More rows... -->
        </tbody>
      </table>
    </div>
    
    <!-- Summary Cards -->
    <div class="mt-6 grid md:grid-cols-2 gap-4">
      <div class="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
        <h4 class="font-semibold text-gray-900 mb-2">Brand Advantages</h4>
        <ul class="space-y-1.5 text-xs text-gray-700">
          <li>✓ Advantage 1</li>
          <li>✓ Advantage 2</li>
        </ul>
      </div>
      <div class="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
        <h4 class="font-semibold text-gray-700 mb-2">Competitor Advantages</h4>
        <ul class="space-y-1.5 text-xs text-gray-600">
          <li>✓ Advantage 1</li>
        </ul>
      </div>
    </div>
  </div>
</section>
```

#### FAQ Section with Schema.org

```html
<section id="faq" class="py-12 md:py-20 px-4 md:px-6 bg-gray-50">
  <div class="max-w-3xl mx-auto">
    <!-- FAQ Items -->
    <div class="space-y-3">
      <div class="faq-item border border-gray-200 rounded-xl overflow-hidden">
        <button class="faq-trigger w-full px-4 md:px-6 py-4 text-left flex items-center justify-between" 
                onclick="this.parentElement.classList.toggle('active')">
          <span class="font-semibold text-gray-900">Question here?</span>
          <svg class="faq-icon w-5 h-5 text-gray-400 transition-transform">▼</svg>
        </button>
        <div class="faq-content hidden px-4 md:px-6 pb-4">
          <p class="text-sm text-gray-600">Answer here...</p>
        </div>
      </div>
      <!-- More FAQ items... -->
    </div>
  </div>
</section>

<!-- FAQ Schema.org -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Question here?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Answer here..."
      }
    }
  ]
}
</script>
```

### CSS 变量系统

```css
:root {
  /* 品牌颜色 - 仅用于按钮和图标 */
  --brand-500: hsl(199, 89%, 50%);
  --brand-600: hsl(199, 89%, 45%);
  --brand-700: hsl(199, 89%, 38%);
  
  /* 阴影系统 */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
}

/* 主按钮 - 品牌颜色 */
.btn-primary {
  background: var(--brand-500);
  color: white;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 8px;
  box-shadow: var(--shadow-md);
}
.btn-primary:hover {
  background: var(--brand-600);
  box-shadow: var(--shadow-lg);
  transform: translateY(-1px);
}

/* 次级按钮 - 灰色边框 */
.btn-secondary {
  background: white;
  color: #404040;
  border: 1px solid #e5e5e5;
  box-shadow: var(--shadow-sm);
}

/* 卡片 */
.card {
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  box-shadow: var(--shadow);
}
.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

/* 徽章 */
.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  background: #f5f5f5;
  color: #525252;
}

/* 品牌图标颜色 */
.icon-brand { color: var(--brand-500); }
.text-brand { color: var(--brand-500); }
.bg-brand-icon { background: var(--brand-500); color: white; }

/* 状态指示器 */
.status-yes { color: var(--brand-500); }
.status-no { color: #a3a3a3; }
.status-partial { color: #737373; }
```

### 页面特性清单

生成的 Alternative 页面包含：

- ✅ **SEO 优化**
  - 完整的 meta tags (title, description, keywords)
  - Open Graph 标签
  - Twitter Card 标签
  - Canonical URL
  - Schema.org 结构化数据 (Article, ItemList, BreadcrumbList, FAQPage)

- ✅ **响应式设计**
  - Mobile-first 布局
  - 断点: sm, md, lg, xl
  - 触摸友好的交互

- ✅ **极简颜色系统**
  - 品牌颜色仅用于按钮和图标
  - 黑白灰为主色调
  - 阴影创造层次感

- ✅ **交互功能**
  - FAQ 手风琴
  - TOC 高亮跟随
  - 返回顶部按钮
  - 平滑滚动

- ✅ **转化优化**
  - 多个 CTA 按钮位置
  - 品牌 CTA 链接 (不链接到竞争对手)
  - 信任徽章

---

## 📁 相关文件

```
app/api/skills/
├── index.ts                           # Skill 注册
├── skill-system/
│   └── planning.skill.ts              # Planning Skill
├── skill-build/
│   └── alternative-page-generator.skill.ts  # 主 Skill
└── tools/
    ├── content/
    │   ├── assemble-alternative-page.tool.ts
    │   ├── get-site-contexts.tool.ts
    │   ├── merge-html-with-site-contexts.tool.ts
    │   ├── fix-style-conflicts.tool.ts
    │   ├── resolve-page-logos.tool.ts
    │   ├── supabase-content-get-item-detail.tool.ts
    │   ├── supabase-content-save-final-page.tool.ts
    │   └── sections/
    │       ├── generate-hero-section.tool.ts
    │       ├── generate-verdict-section.tool.ts
    │       ├── generate-comparison-table.tool.ts
    │       ├── generate-pricing-section.tool.ts
    │       ├── generate-pros-cons-section.tool.ts
    │       ├── generate-use-cases-section.tool.ts
    │       ├── generate-faq-section.tool.ts
    │       ├── generate-cta-section.tool.ts
    │       ├── generate-toc-section.tool.ts
    │       └── generate-screenshots-section.tool.ts
    └── research/
        ├── tavily-web-search.tool.ts
        ├── perplexity-search.tool.ts
        ├── capture-website-screenshot.tool.ts
        └── fetch-competitor-logo.tool.ts
```
