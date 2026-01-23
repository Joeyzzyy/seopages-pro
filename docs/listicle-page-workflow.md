# 🚀 Listicle 页面生成工作流

## 概述

Listicle 页面（最佳替代品/Top N 对比页面）是一种高 SEO 价值的营销着陆页，通过对比多个产品帮助用户选择最适合的解决方案。

**与 Alternative 页面的区别：**
- Alternative 页面：1 vs 1 对比（你的品牌 vs 一个竞争对手）
- Listicle 页面：1 vs N 对比（你的品牌 + 多个竞争对手，通常 5-15 个）

本工作流采用**模块化 + 数据库存储架构**：
1. 深度研究每个产品，获取结构化数据
2. 每个 Section 独立生成，自动保存到数据库
3. 从数据库组装所有 Section 成完整页面
4. 集成站点 Header/Footer

---

## 执行流程 (7 个阶段)

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
| 3 | `resolve_page_logos(...)` | **关键！** 解析品牌 Logo |

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
  brand_logo_html: string,   // 带 fallback 的 HTML
}
```

---

### Phase 1.5: DEEP PRODUCT RESEARCH ⭐ 关键阶段

| 步骤 | 工具 | 用途 |
|------|------|------|
| 4 | `research_product_deep(product_name, product_url, feature_names)` | **为每个产品深度爬取！** |

#### `research_product_deep` 参数

```typescript
{
  product_name: string,       // 产品名称
  product_url: string,        // 产品官网 URL
  feature_names: string[],    // 要检查的功能列表 (所有产品使用相同列表)
}
```

#### `research_product_deep` 工作原理

1. **多页面爬取**：访问 5 种页面类型
   - 首页 (`/`)
   - 定价页 (`/pricing`, `/plans`)
   - 功能页 (`/features`, `/capabilities`)
   - 产品页 (`/product`, `/platform`)
   - 关于页 (`/about`, `/company`)

2. **AI 提取**：使用 GPT-4.1 从爬取内容中提取结构化数据

3. **返回完整的产品数据**：
   ```typescript
   {
     success: boolean,
     product_name: string,
     product_url: string,
     crawled_pages: number,
     data: {
       description: string,           // 2-3 句产品描述
       tagline?: string,              // 短标语
       target_audience: string,       // 目标用户群体
       
       // ⭐ 关键！功能状态映射
       features: Record<string, 'yes' | 'partial' | 'no' | 'not_mentioned'>,
       // 例如: { "AI Content Optimization": "yes", "SERP Analysis": "partial", ... }
       
       key_features: string[],        // 4-6 个主要功能
       
       pricing: {
         starting_price?: string,     // "$29/mo"
         free_tier?: boolean,
         pricing_model?: string,      // "Per user/month"
         plans?: Array<{
           name: string,
           price: string,
           features: string[],
         }>,
       },
       
       pros: string[],                // 3-5 个优点
       cons: string[],                // 2-3 个缺点
       
       website_url?: string,
       logo_url?: string,
     }
   }
   ```

#### ⚠️ 关键数据流

**必须保存研究结果，并在后续阶段使用！**

```
research_product_deep 返回的数据
         │
         ├──► generate_listicle_comparison_table
         │    └── products[].features = data.features (Record<string, status>)
         │
         └──► generate_listicle_product_card
              ├── product.features = data.key_features (string[])
              ├── product.pricing = data.pricing
              ├── product.pros = data.pros
              ├── product.cons = data.cons
              └── product.best_for = data.target_audience
```

---

### Phase 2: SECTION GENERATION (模块化生成)

每个 Section 工具**自动保存到数据库**，不返回 HTML 到 response。

#### ⭐ 必须生成的 Section

| 步骤 | 工具 | 用途 |
|------|------|------|
| 5 | `generate_listicle_hero_section` | ⭐ 页面标题、描述、CTA |
| 6 | `generate_listicle_comparison_table` | ⭐ 快速对比表格 (所有产品) |
| 7 | `generate_listicle_product_card` × N | ⭐ 每个产品的详细卡片 |
| 8 | `generate_faq_section` | ⭐ FAQ + Schema.org 标记 |
| 9 | `generate_cta_section` | ⭐ 最终转化 CTA |

---

#### 1. `generate_listicle_hero_section`

```typescript
{
  content_item_id: string,      // ⭐ 必须！内容项 UUID
  brand: {
    name: string,
    logo_url?: string,
    primary_color?: string,     // 默认 #0ea5e9
  },
  title: string,                // "Top 10 Best Writesonic Alternatives in 2025"
  description: string,          // 详细描述读者将学到什么
  total_alternatives: number,   // 对比的产品数量
  cta_primary?: {
    text: string,               // "Try [Brand] Free"
    url: string,
  },
  site_url?: string,            // 用于生成 "XXX Team" 作者名
  author?: {
    name: string,
    role?: string,
  },
  last_updated?: string,        // ISO 日期格式
}
```

**返回值：**
```typescript
{
  success: true,
  section_id: 'listicle-hero',
  section_saved: true,
  message: 'Saved listicle hero section: ...',
}
```

---

#### 2. `generate_listicle_comparison_table` ⭐ 关键

```typescript
{
  content_item_id: string,      // ⭐ 必须！内容项 UUID
  title: string,                // "Quick Comparison"
  brand_name: string,           // 你的品牌名（用于高亮）
  
  // ⭐ 产品列表 - features 必须来自 research_product_deep！
  products: Array<{
    rank: number,               // 排名位置
    name: string,               // 产品名称
    logo_url?: string,
    starting_price?: string,    // "$29/mo"
    has_free_tier?: boolean,
    rating?: number,            // 0-5
    
    // ⭐ 关键！必须传递 research_product_deep 返回的 features
    features: Record<string, 'yes' | 'partial' | 'no' | 'not_mentioned'>,
    // 例如: { "AI Content Optimization": "yes", "SERP Analysis": "partial", ... }
  }>,
  
  feature_names: string[],      // 表头的功能名称列表
}
```

**表格状态显示：**
| 状态 | 图标 | 含义 |
|------|------|------|
| `yes` | ✓ (绿色) | 完全支持 |
| `partial` | ! (黄色) | 部分支持 |
| `no` | ✗ (灰色) | 不支持 |
| `not_mentioned` | — (破折号) | 未在网站上找到信息 |

---

#### 3. `generate_listicle_product_card` ⭐ 为每个产品调用！

```typescript
{
  content_item_id: string,      // ⭐ 必须！内容项 UUID
  rank: number,                 // 1 = 你的品牌（第一名）, 2-N = 竞争对手
  is_brand: boolean,            // rank === 1 时为 true
  
  product: {
    name: string,
    logo_url?: string,
    tagline?: string,
    website_url?: string,
    description: string,        // 2-3 句详细描述
    
    features: string[],         // 4-6 个主要功能 (来自 key_features)
    
    pricing?: {
      starting_price?: string,
      free_tier?: boolean,
      pricing_model?: string,
    },
    
    pros: string[],             // 3-5 个优点
    cons: string[],             // 2-3 个缺点
    best_for: string,           // 最适合的用户群体
    rating?: number,            // 0-5
  },
  
  brand_primary_color?: string, // 默认 #0ea5e9
}
```

**⚠️ 关键注意事项：**
- **必须为所有产品调用**，包括 #1（你的品牌）！
- 常见错误：AI 跳过 rank=1 的卡片生成
- CTA 按钮只在 `is_brand=true` 时显示

---

#### 4. `generate_faq_section`

```typescript
{
  content_item_id: string,      // ⭐ 必须！内容项 UUID
  brand_name: string,
  competitor_name: string,      // 对于 listicle 可以是 "Semrush" 等主题
  faqs: Array<{
    question: string,
    answer: string,             // 支持 Markdown
  }>,
}
```

自动生成 FAQ Schema.org 标记。

---

#### 5. `generate_cta_section`

```typescript
{
  content_item_id: string,      // ⭐ 必须！内容项 UUID
  brand_name: string,
  headline: string,             // "Ready to Future-Proof Your SEO?"
  description: string,
  primary_cta: {
    text: string,               // "Try [Brand] Free"
    url: string,
  },
  secondary_cta?: {
    text: string,
    url: string,
  },
  trust_badges?: string[],      // ["Free trial", "No credit card required"]
}
```

---

### Phase 3: PAGE ASSEMBLY (页面组装)

| 步骤 | 工具 | 用途 |
|------|------|------|
| 10 | `assemble_page_from_sections(content_item_id, ...)` | 从数据库读取所有 section 并组装 |

#### `assemble_page_from_sections` 参数

```typescript
{
  content_item_id: string,      // 内容项 ID
  page_type: 'alternative' | 'listicle',  // 指定 'listicle'
  page_title: string,
  seo: {
    meta_description: string,   // 最大 160 字符
    keywords?: string[],
    canonical_url?: string,
    og_image?: string,
  },
  brand_color?: string,         // 品牌主色
}
```

#### 组装逻辑 (listicle 页面)

```
读取数据库中所有 section
        │
        ▼
  Section 排序:
  1. hero (order: 0)
  2. comparison_table (order: 5)
  3. product_cards (order: 11-18, 按 rank 排序)
  4. faq (order: 50)
  5. cta (order: 60)
        │
        ▼
  产品卡片特殊处理:
  - 包裹在 grid 容器中
  - 响应式布局: 1 列 (mobile) / 2 列 (desktop)
        │
        ▼
  生成完整 HTML
```

---

### Phase 4: SITE INTEGRATION (站点集成)

| 步骤 | 工具 | 用途 |
|------|------|------|
| 11 | `merge_html_with_site_contexts(item_id)` | **必须！** 合并 Header/Footer |
| 12 | `fix_style_conflicts(item_id)` | 修复 CSS 样式冲突 |

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

### Phase 5: FINALIZE (完成保存)

| 步骤 | 工具 | 用途 |
|------|------|------|
| 13 | `save_final_page(item_id)` | **必须！** 最终保存 |

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
│  Phase 1.5: DEEP PRODUCT RESEARCH ⭐ 关键阶段                    │
│                                                                  │
│  对每个产品 (包括你的品牌) 调用:                                  │
│  └── research_product_deep(product_name, url, feature_names)     │
│                                                                  │
│  返回: features, pricing, pros, cons, target_audience            │
│  ⚠️ 保存这些数据，后续阶段会用到！                                │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 2: SECTION GENERATION (保存到数据库)                      │
│                                                                  │
│  ⭐ REQUIRED:                                                    │
│  ├── generate_listicle_hero_section                              │
│  ├── generate_listicle_comparison_table                          │
│  │   └── ⚠️ 传递 research 的 features 数据！                     │
│  ├── generate_listicle_product_card × N                          │
│  │   └── ⚠️ 必须包括 #1 (你的品牌)！                             │
│  ├── generate_faq_section                                        │
│  └── generate_cta_section                                        │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 3: PAGE ASSEMBLY                                          │
│  └── assemble_page_from_sections(page_type: 'listicle')          │
│      └── 从数据库读取所有 section，按顺序组装                      │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 4: SITE INTEGRATION                                       │
│  ├── merge_html_with_site_contexts                               │
│  └── fix_style_conflicts                                         │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 5: FINALIZE                                               │
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
| Tavily | `TAVILY_API_KEY` | 网页爬取 (`research_product_deep`) |
| Azure OpenAI | 相关配置 | AI 数据提取 |

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
  
  /* 品牌背景色 (用于 #1 产品高亮) */
  --brand-color: #0ea5e9;
  --brand-color-dark: #007fc3;
  --brand-color-light: #f3ffff;
  
  /* 阴影系统 */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
```

### 使用规则

| 元素 | 允许使用品牌颜色 | 应该使用的颜色 |
|------|------------------|----------------|
| `.btn-primary` | ✅ | 品牌主色 |
| `.badge-winner` | ✅ | 金色渐变 |
| `#1 产品卡边框` | ✅ | 品牌主色 ring |
| `#1 排名徽章` | ✅ | 品牌主色背景 |
| 品牌功能勾选 | ✅ | 品牌主色 |
| Section 背景 | ❌ | white, #fafafa, bg-gray-50 |
| Card 背景 | ❌ | white |
| 文字 | ❌ | #171717, #525252, #a3a3a3 |
| 边框 | ❌ | #e5e5e5, #d4d4d4, gray-100 |

---

## 📄 输出 Schema

```json
{
  "success": true,
  "item_id": "uuid",
  "html_length": 60000,
  "line_count": 2000,
  "sections_included": ["hero", "comparison_table", "product_card_1", "product_card_2", "...", "faq", "cta"],
  "preview_url": "/api/preview/{item_id}",
  "public_url": "https://storage.supabase.co/..."
}
```

---

## ⚠️ 关键注意事项

### 常见错误

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| 表格全是 "—" | 没有传递 features 数据 | 将 `research_product_deep` 返回的 `features` 传给 comparison table |
| 缺少 #1 产品卡 | AI 跳过了品牌卡片 | 明确调用 `generate_listicle_product_card` for rank=1 |
| 数据不准确 | 没有使用 research 数据 | 确保所有卡片数据来自 `research_product_deep` |

### 禁止事项

1. **绝不使用占位符**
   - ❌ `"..."`
   - ❌ `"[content]"`
   - ❌ `"[section]"`

2. **绝不为竞争对手提供 CTA 按钮**
   - ❌ "Visit [Competitor]" 按钮
   - ❌ "Try [Competitor]" 按钮
   - ✅ 只能使用 "Visit Website →" 文字链接

3. **绝不跳过产品**
   - ❌ 跳过 #1（品牌）产品卡
   - ✅ 必须为所有产品生成卡片

### CTA 策略

所有 CTA 只链接到**品牌站点**：

```markdown
✅ 允许:
- Hero: "Try [Brand] Free" 按钮
- #1 产品卡: "Try [Brand] Free" 按钮
- Final CTA: 强转化按钮

❌ 禁止:
- 竞争对手卡片的 CTA 按钮
- 任何指向竞争对手的按钮链接

⚠️ 竞争对手卡片只能显示:
- "Visit Website →" 文字链接
- rel="nofollow noopener" 属性
```

---

## 📄 输出示例参考

### 示例页面结构 (Top 8 Best Semrush Alternatives)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- SEO Meta Tags -->
  <title>Top 8 Best Semrush Alternatives in 2026 | Honest Reviews & Comparison</title>
  <meta name="description" content="Looking for Semrush alternatives?...">
  <meta name="keywords" content="best semrush alternatives, seo tools 2026...">
  <link rel="canonical" href="https://brand.com/alternatives/...">
  
  <!-- Open Graph -->
  <meta property="og:title" content="...">
  <meta property="og:description" content="...">
  
  <!-- Tailwind CSS + Custom Styles -->
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    :root {
      --brand-color: #0ea5e9;
      --brand-color-dark: #007fc3;
      /* ... */
    }
    .btn-primary { ... }
    .badge-winner { ... }
    /* ... */
  </style>
</head>
<body>
  <!-- Header (from site_contexts) -->
  <header>...</header>
  
  <!-- Main Content -->
  
  <!-- 1. Hero Section -->
  <section class="hero-section">
    <!-- Breadcrumb -->
    <!-- Title: "Top 8 Best Semrush Alternatives in 2026" -->
    <!-- Description -->
    <!-- Primary CTA -->
    <!-- Quick Stats -->
    <!-- Author & Updated Date -->
  </section>
  
  <!-- 2. Comparison Table Section -->
  <section id="comparison-table" class="bg-gray-50">
    <!-- Table with all products -->
    <!-- Columns: Product, Price, Rating, Feature1, Feature2, ... -->
    <!-- Legend: ✓ Full support, ! Partial, ✗ Not available, — Not mentioned -->
  </section>
  
  <!-- 3. Product Cards (Grid Layout) -->
  <section id="products-list" class="bg-gray-50">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      <!-- Product Card #1 (Brand - Special Styling) -->
      <article class="ring-2 ring-brand-icon shadow-2xl">
        <!-- Winner decoration -->
        <!-- Rank Badge (#1) - Brand color -->
        <!-- Logo, Name, "Top Pick" badge -->
        <!-- Rating (4.9/5.0) -->
        <!-- Description -->
        <!-- Key Features -->
        <!-- Pricing -->
        <!-- Pros & Cons -->
        <!-- Best For -->
        <!-- CTA Button: "Try [Brand] Free" -->
      </article>
      
      <!-- Product Card #2 (Competitor) -->
      <article class="border border-gray-100">
        <!-- Rank Badge (#2) - Gray -->
        <!-- Logo, Name -->
        <!-- Rating -->
        <!-- Description -->
        <!-- Key Features -->
        <!-- Pricing -->
        <!-- Pros & Cons -->
        <!-- Best For -->
        <!-- Text Link: "Visit Website →" -->
      </article>
      
      <!-- More product cards... -->
      
    </div>
  </section>
  
  <!-- 4. FAQ Section -->
  <section id="faq" class="bg-gray-50">
    <!-- FAQ Items with accordion -->
    <!-- FAQ Schema.org -->
  </section>
  
  <!-- 5. Final CTA Section -->
  <section id="cta" class="bg-gray-50">
    <!-- Headline -->
    <!-- Description -->
    <!-- Primary & Secondary CTA buttons -->
    <!-- Trust badges -->
  </section>
  
  <!-- Footer (from site_contexts) -->
  <footer>...</footer>
</body>
</html>
```

### 关键 Section 示例

#### Hero Section

```html
<section class="relative overflow-hidden pt-24 md:pt-32 pb-20 md:pb-28 px-4 md:px-6 bg-gradient-to-b from-gray-50 via-white to-white">
  <!-- Grid Pattern Background -->
  <div class="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.02)_1px,transparent_1px)] bg-[size:48px_48px]"></div>
  
  <div class="relative max-w-5xl mx-auto">
    <!-- Breadcrumb -->
    <nav aria-label="Breadcrumb">
      Home > Alternatives > Best Of
    </nav>
    
    <!-- Title -->
    <h1 class="text-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 font-serif">
      Top 8 Best Semrush Alternatives in 2026
    </h1>
    
    <!-- Description -->
    <p class="text-center text-base md:text-lg text-gray-600 max-w-3xl mx-auto mb-10">
      Looking for the best Semrush alternatives? Our expert team rigorously tested...
    </p>
    
    <!-- CTA (no icon) -->
    <div class="flex items-center justify-center mb-10">
      <a href="https://brand.com" class="btn-primary px-10 py-4 rounded-2xl text-base font-semibold shadow-lg">
        Try Seenos Free
      </a>
    </div>
    
    <!-- Quick Stats -->
    <div class="flex flex-wrap items-center justify-center gap-3">
      <div class="flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-xl shadow-sm border border-gray-100">
        <svg class="w-5 h-5 text-green-500">✓</svg>
        <span>Hands-on testing</span>
      </div>
      <!-- More stats... -->
    </div>
    
    <!-- Author & Update Info -->
    <div class="flex items-center justify-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-2xl">
      <span>By <strong>Seenos Team</strong></span>
      <span>Updated Jan 23, 2026</span>
    </div>
  </div>
</section>
```

#### Comparison Table Section

```html
<section id="comparison-table" class="py-16 md:py-20 px-4 md:px-6 bg-gray-50">
  <div class="max-w-6xl mx-auto">
    <h2 class="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4">
      Quick Comparison Table
    </h2>
    
    <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[800px]">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200">
              <th>Product</th>
              <th>Starting Price</th>
              <th>Rating</th>
              <th>AI Visibility</th>
              <th>Keyword Research</th>
              <!-- More columns... -->
            </tr>
          </thead>
          <tbody>
            <!-- Brand row (highlighted) -->
            <tr class="bg-brand-bg">
              <td>
                <img src="brand-logo.png">
                <span>Seenos</span>
                <span class="badge-winner">#1</span>
              </td>
              <td>$29/mo <span class="text-green-600">Free tier</span></td>
              <td>★ 4.9</td>
              <td><svg class="text-brand-icon">✓</svg></td>
              <td><svg class="text-brand-icon">✓</svg></td>
            </tr>
            
            <!-- Competitor rows -->
            <tr>
              <td>
                <img src="competitor-logo.png">
                <span>Ahrefs</span>
                <span class="text-gray-400">#2</span>
              </td>
              <td>$99/mo</td>
              <td>★ 4.7</td>
              <td><svg class="text-green-500">✓</svg></td>
              <td><span class="text-gray-400">—</span></td>
            </tr>
            <!-- More rows... -->
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Legend -->
    <div class="flex flex-wrap items-center justify-center gap-6 mt-6">
      <div class="flex items-center gap-2">
        <svg class="text-green-500">✓</svg>
        <span>Full support</span>
      </div>
      <div class="flex items-center gap-2">
        <svg class="text-yellow-500">!</svg>
        <span>Partial/Limited</span>
      </div>
      <div class="flex items-center gap-2">
        <svg class="text-gray-300">✗</svg>
        <span>Not available</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-gray-400">—</span>
        <span>Not mentioned</span>
      </div>
    </div>
  </div>
</section>
```

#### Product Card (Brand - #1)

```html
<article class="bg-gradient-to-br from-white to-gray-50/50 rounded-3xl ring-2 ring-brand-icon ring-offset-4 shadow-2xl p-6 md:p-8 relative overflow-hidden">
  <!-- Winner accent decoration -->
  <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100/50 to-transparent rounded-bl-full pointer-events-none"></div>
  
  <!-- Header -->
  <div class="flex items-start gap-4 mb-6">
    <!-- Rank Badge (Brand Color) -->
    <div class="w-12 h-12 bg-brand-icon text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-md">
      1
    </div>
    
    <!-- Logo & Title -->
    <div class="flex-1">
      <div class="flex items-center gap-3">
        <img src="brand-logo.png" class="w-14 h-14 rounded-xl shadow-md">
        <div>
          <h3 class="text-xl md:text-2xl font-bold text-gray-900">Seenos</h3>
          <span class="badge-winner px-2 py-0.5 rounded-full text-[10px] font-bold">Top Pick</span>
          <p class="text-sm text-gray-500">AI Visibility & SEO Workstation</p>
        </div>
      </div>
      
      <!-- Rating -->
      <div class="flex items-center gap-2 mt-2">
        <div class="flex items-center">★★★★★</div>
        <span class="text-sm font-semibold text-gray-700">4.9</span>
        <span class="text-xs text-gray-400">/ 5.0</span>
      </div>
    </div>
  </div>
  
  <!-- Description -->
  <p class="text-gray-600 mb-8 leading-relaxed text-base">
    Seenos is a next-generation SEO and GEO platform designed for the AI era...
  </p>
  
  <!-- Key Features -->
  <div class="mb-8">
    <h4 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
      <svg>✓</svg> Key Features
    </h4>
    <ul class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <li class="flex items-start gap-2 text-sm text-gray-600">
        <svg class="w-5 h-5 text-brand-icon">✓</svg>
        <span>AI Visibility Tracking for Google & ChatGPT</span>
      </li>
      <!-- More features... -->
    </ul>
  </div>
  
  <!-- Pricing -->
  <div class="mb-8 p-5 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border border-gray-100">
    <h4 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
      <svg>$</svg> Pricing
    </h4>
    <div class="flex items-center gap-2 text-sm">
      <span class="font-semibold text-gray-900">$29/mo</span>
      <span class="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Free tier</span>
      <span class="text-gray-500">Per user/month</span>
    </div>
  </div>
  
  <!-- Pros & Cons -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
    <div class="p-4 bg-green-50/50 rounded-2xl border border-green-100">
      <h4 class="text-xs font-bold text-green-700 uppercase tracking-widest mb-3">
        <svg>👍</svg> Pros
      </h4>
      <ul class="space-y-2">
        <li class="flex items-start gap-2 text-sm text-gray-600">
          <svg class="text-green-500">✓</svg>
          <span>Best-in-class AI visibility tracking</span>
        </li>
        <!-- More pros... -->
      </ul>
    </div>
    <div class="p-4 bg-red-50/30 rounded-2xl border border-red-100/50">
      <h4 class="text-xs font-bold text-red-600 uppercase tracking-widest mb-3">
        <svg>👎</svg> Cons
      </h4>
      <ul class="space-y-2">
        <li class="flex items-start gap-2 text-sm text-gray-600">
          <svg class="text-red-400">✗</svg>
          <span>Newer platform (less historical data)</span>
        </li>
      </ul>
    </div>
  </div>
  
  <!-- Best For -->
  <div class="p-5 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 rounded-2xl border border-blue-100/50 mb-6">
    <h4 class="text-xs font-bold text-blue-700 uppercase tracking-widest mb-2">
      <svg>👥</svg> Best For
    </h4>
    <p class="text-sm text-gray-700 font-medium">
      Agencies, in-house SEO teams, and content marketers seeking AI-powered visibility...
    </p>
  </div>
  
  <!-- CTA (Brand only) -->
  <a href="https://brand.com" class="btn-primary w-full py-3 rounded-xl text-sm font-semibold text-center mt-4">
    Try Seenos Free
  </a>
</article>
```

#### Product Card (Competitor)

```html
<article class="bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 p-6 md:p-8">
  <!-- Header -->
  <div class="flex items-start gap-4 mb-6">
    <!-- Rank Badge (Gray) -->
    <div class="w-12 h-12 bg-gray-200 text-gray-700 rounded-2xl flex items-center justify-center font-bold text-lg shadow-md">
      2
    </div>
    
    <!-- Logo & Title -->
    <div class="flex-1">
      <div class="flex items-center gap-3">
        <img src="competitor-logo.png" class="w-14 h-14 rounded-xl shadow-md">
        <div>
          <h3 class="text-xl md:text-2xl font-bold text-gray-900">Ahrefs</h3>
          <p class="text-sm text-gray-500">Backlink & Competitor Research</p>
        </div>
      </div>
      
      <!-- Rating -->
      <div class="flex items-center gap-2 mt-2">
        <div class="flex items-center">★★★★☆</div>
        <span class="text-sm font-semibold text-gray-700">4.7</span>
        <span class="text-xs text-gray-400">/ 5.0</span>
      </div>
    </div>
  </div>
  
  <!-- ... Similar structure as brand card ... -->
  
  <!-- CTA (Text link only, no button) -->
  <div class="w-full py-3 text-center text-sm text-gray-500 mt-4">
    <a href="https://ahrefs.com" target="_blank" rel="nofollow noopener" class="hover:text-gray-700 transition-colors">
      Visit Website →
    </a>
  </div>
</article>
```

### CSS 变量系统

```css
:root {
  /* 品牌颜色 - 仅用于按钮和图标 */
  --brand-color: #0ea5e9;
  --brand-color-dark: #007fc3;
  --brand-color-light: #f3ffff;
  
  /* 阴影系统 */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

/* 主按钮 - 品牌颜色 */
.btn-primary {
  background-color: var(--brand-color);
  color: white;
  font-weight: 600;
  border: 2px solid var(--brand-color-dark);
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.btn-primary:hover {
  background-color: var(--brand-color-dark);
  border-color: var(--brand-color-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* 次级按钮 - 灰色边框 */
.btn-secondary {
  background-color: white;
  color: #374151;
  border: 1px solid #d1d5db;
  font-weight: 600;
  transition: all 0.2s ease;
}
.btn-secondary:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

/* 品牌 Utility Classes */
.bg-brand-icon { background-color: var(--brand-color); }
.bg-brand-bg { background-color: var(--brand-color-light); }
.text-brand { color: var(--brand-color); }
.text-brand-icon { color: var(--brand-color); }
.ring-brand-icon { --tw-ring-color: var(--brand-color); }

/* Winner 徽章 */
.badge-winner {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e;
  border: 1px solid #f59e0b;
}

/* FAQ 手风琴 */
.faq-item.active .faq-content { display: block; }
.faq-item.active .faq-icon { transform: rotate(180deg); }
```

---

## 📄 页面特性清单

生成的 Listicle 页面包含：

- ✅ **SEO 优化**
  - 完整的 meta tags (title, description, keywords)
  - Open Graph 标签
  - Twitter Card 标签
  - Canonical URL
  - FAQ Schema.org 结构化数据

- ✅ **响应式设计**
  - Mobile-first 布局
  - 断点: sm, md, lg, xl
  - 产品卡片网格: 1 列 (mobile) / 2 列 (desktop)
  - 表格水平滚动 (mobile)

- ✅ **极简颜色系统**
  - 品牌颜色仅用于按钮、#1 高亮、品牌功能勾选
  - 黑白灰为主色调
  - 阴影创造层次感

- ✅ **数据完整性**
  - 每个产品深度研究
  - 功能对比准确
  - 定价信息来自官网
  - "Not mentioned" 状态 (而非错误的 "不支持")

- ✅ **转化优化**
  - Hero 区域 CTA
  - #1 产品卡 CTA 按钮
  - Final CTA section
  - 信任徽章
  - 竞争对手只有文字链接 (无按钮)

---

## 📁 相关文件

```
app/api/skills/
├── index.ts                           # Skill 注册
├── skill-system/
│   └── planning.skill.ts              # Planning Skill
├── skill-build/
│   └── listicle-page-generator.skill.ts  # 主 Skill
└── tools/
    ├── content/
    │   ├── assemble-page-from-sections.tool.ts  # 页面组装 (从数据库)
    │   ├── get-site-contexts.tool.ts
    │   ├── merge-html-with-site-contexts.tool.ts
    │   ├── fix-style-conflicts.tool.ts
    │   ├── resolve-page-logos.tool.ts
    │   ├── supabase-content-get-item-detail.tool.ts
    │   ├── supabase-content-save-final-page.tool.ts
    │   └── sections/
    │       ├── generate-listicle-hero-section.tool.ts
    │       ├── generate-listicle-comparison-table.tool.ts
    │       ├── generate-listicle-product-card.tool.ts
    │       ├── generate-faq-section.tool.ts
    │       └── generate-cta-section.tool.ts
    └── research/
        └── research-product-deep.tool.ts    # ⭐ 深度产品研究

lib/
└── section-storage.ts                 # Section 数据库存储

supabase/migrations/
└── add_content_item_sections.sql      # Section 表结构
```

---

## 📊 数据库 Schema

### `content_item_sections` 表

```sql
CREATE TABLE content_item_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  section_id VARCHAR(100) NOT NULL,      -- e.g., 'listicle-hero', 'product-card-1'
  section_type VARCHAR(50) NOT NULL,     -- e.g., 'hero', 'product_card', 'faq'
  section_order INTEGER DEFAULT 0,       -- 排序顺序
  section_html TEXT NOT NULL,            -- HTML 内容
  metadata JSONB,                        -- 额外元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(content_item_id, section_id)
);
```

### Section Order 约定

| Section Type | Order | 备注 |
|--------------|-------|------|
| `hero` | 0 | 始终第一 |
| `comparison_table` | 5 | 表格 |
| `product_card` | 11-18 | 按 rank 排序 (10 + rank) |
| `faq` | 50 | FAQ |
| `cta` | 60 | 最后 CTA |
