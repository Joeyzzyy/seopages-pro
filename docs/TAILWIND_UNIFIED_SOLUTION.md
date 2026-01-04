# Tailwind 统一样式方案

## 🎯 目标

解决样式冲突问题，通过**统一使用 Tailwind CSS** 实现零冲突的页面生成。

---

## ✅ 方案概述

### 核心思路
1. Header/Footer/Content **全部使用 Tailwind CSS**
2. 用户只需提供：Logo + 站点名称 + 基本配置
3. 系统自动生成专业的、样式统一的页面

### 优势
- ✅ **零样式冲突** - 都是 Tailwind utility classes
- ✅ **用户友好** - 不需要写 CSS/HTML
- ✅ **专业设计** - 预设模板已经很美观
- ✅ **易于维护** - 只有一个 CSS 框架
- ✅ **性能好** - Tailwind CDN，自动 purge

---

## 📦 已创建的文件

### 1. `/lib/templates/default-header.ts`

**功能**：根据配置生成 Tailwind Header

**配置项**：
```typescript
{
  siteName: string,
  logo?: string,
  navigation: Array<{ label, url }>,
  ctaButton?: { label, url },
  theme: 'light' | 'dark'
}
```

**生成的 HTML**：
- 响应式导航栏
- Logo 或站点名称
- 导航链接
- CTA 按钮
- 移动端菜单按钮
- 完全使用 Tailwind classes

---

### 2. `/lib/templates/default-footer.ts`

**功能**：根据配置生成 Tailwind Footer

**配置项**：
```typescript
{
  companyName: string,
  tagline?: string,
  logo?: string,
  columns: Array<{ title, links }>,
  socialMedia?: Array<{ platform, url }>,
  copyright?: string,
  theme: 'light' | 'dark'
}
```

**生成的 HTML**：
- 多列链接布局
- 社交媒体图标
- 版权信息
- 响应式设计
- 完全使用 Tailwind classes

---

### 3. `/lib/templates/page-content-tailwind.ts`

**功能**：为页面内容添加 Tailwind 样式

**核心函数**：
- `generatePageContentHTML()` - 生成完整页面骨架
- `wrapMarkdownWithTailwind()` - 为 Markdown HTML 添加 Tailwind classes

**样式覆盖**：
- 标题 (h1-h4)
- 段落 (p)
- 列表 (ul, ol, li)
- 链接 (a)
- 图片 (img)
- 表格 (table)
- 强调 (strong)

---

### 4. `/app/api/skills/tools/content/initialize-site-branding.tool.ts`

**功能**：一键初始化站点 Header 和 Footer

**参数**：
```typescript
{
  user_id: string,
  site_name: string,
  logo_url?: string,
  navigation?: Array<{ label, url }>,
  theme?: 'light' | 'dark'
}
```

**执行流程**：
1. 根据配置生成 Header HTML
2. 根据配置生成 Footer HTML
3. 生成 Tailwind head tags
4. 保存到 `site_contexts` 表

**返回**：
```typescript
{
  success: true,
  message: "Site branding initialized...",
  uses_tailwind: true,
  theme: 'light'
}
```

---

## 🚀 使用流程

### Step 1: 用户初始化站点品牌

**用户操作**：
1. 上传 Logo 图片
2. 输入站点名称 (如 "My Awesome Company")
3. （可选）自定义导航链接
4. 选择主题 (light/dark)

**AI 调用**：
```typescript
initialize_site_branding({
  user_id: "xxx",
  site_name: "My Awesome Company",
  logo_url: "https://storage.supabase.co/xxx/logo.png",
  theme: "light"
})
```

**结果**：
- Header HTML 已生成并保存
- Footer HTML 已生成并保存
- Head tags (Tailwind CDN) 已保存

---

### Step 2: 生成页面内容

**原有流程不变**，但使用 Tailwind 样式：

```
1. Draft sections (Markdown)
2. Generate images
3. Assemble HTML (使用 Tailwind classes)
4. Merge with header/footer (都是 Tailwind，零冲突)
5. Save
```

**关键变化**：
- `assemble_html_page` 改用 Tailwind classes
- 不再需要 `fix_style_conflicts`（因为没有冲突）

---

## 📐 HTML 结构

### 完整页面结构

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Title</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <!-- Header (Tailwind) -->
  <header class="bg-white border-b sticky top-0 z-50">
    <div class="container mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
        <a href="/"><img src="logo.png" class="h-10" /></a>
        <nav class="flex space-x-8">
          <a href="/about" class="hover:text-blue-600">About</a>
          ...
        </nav>
      </div>
    </div>
  </header>
  
  <!-- Content (Tailwind) -->
  <main class="container mx-auto px-4 py-8">
    <article class="bg-white rounded-lg shadow-lg p-12">
      <h1 class="text-5xl font-bold mb-8">Page Title</h1>
      
      <section class="mb-12">
        <h2 class="text-3xl font-bold mb-6">Section 1</h2>
        <p class="text-gray-700 mb-6">Content...</p>
      </section>
      
      ...
    </article>
  </main>
  
  <!-- Footer (Tailwind) -->
  <footer class="bg-gray-900 text-gray-300">
    <div class="container mx-auto px-4 py-12">
      <div class="grid grid-cols-4 gap-8">
        <div>
          <h3 class="text-white mb-4">Company</h3>
          <ul class="space-y-3">
            <li><a href="/about">About</a></li>
            ...
          </ul>
        </div>
        ...
      </div>
    </div>
  </footer>
</body>
</html>
```

**关键点**：
- ✅ 全部 Tailwind classes
- ✅ 零自定义 CSS
- ✅ 零冲突

---

## 🎨 设计示例

### Light Theme Header
```
┌────────────────────────────────────────────────┐
│ [Logo]  My Site      Home About Services       │
│                                    [Get Started]│
└────────────────────────────────────────────────┘
```

### Dark Theme Footer
```
┌────────────────────────────────────────────────┐
│  My Company                                     │
│  Building the future...                         │
│                                                 │
│  Product    Company    Support                  │
│  Features   About      Help                     │
│  Pricing    Blog       Contact                  │
│                                                 │
│  [Twitter] [LinkedIn]                           │
│                                                 │
│  © 2024 My Company. All rights reserved.        │
└────────────────────────────────────────────────┘
```

---

## 🔄 迁移策略

### Phase 1: 新用户（立即生效）
- 新注册用户初始化时，自动调用 `initialize_site_branding`
- 所有新生成的页面都使用 Tailwind

### Phase 2: 现有用户（平滑过渡）
- 保留现有的 `site_contexts` 数据
- 提供"升级到 Tailwind 模板"按钮
- 用户点击后，调用 `initialize_site_branding` 覆盖旧数据

### Phase 3: 完全迁移
- 所有用户都使用 Tailwind
- 移除 `fix_style_conflicts` 工具（不再需要）
- 简化工作流为 6 步（去掉 Step 6）

---

## 💡 未来扩展

### 1. 多套模板

```typescript
interface TemplateStyle {
  id: 'modern' | 'classic' | 'minimal' | 'bold',
  colors: ColorScheme,
  typography: TypographyScheme,
}
```

用户可选择不同风格：
- **Modern**: 圆角、阴影、渐变
- **Classic**: 衬线字体、传统布局
- **Minimal**: 极简、黑白、大字体
- **Bold**: 鲜艳色彩、大胆设计

### 2. 可视化编辑器

未来可以提供拖拉拽界面：
```
[ Logo 位置 ] [ 导航链接 ] [ CTA 按钮 ]
  ↓             ↓            ↓
  拖动         编辑文字      改颜色
```

### 3. AI 识图还原

用户上传 Header 截图 → AI 识别风格 → 生成对应的 Tailwind 配置

---

## 📝 TODO

### 立即任务
1. ✅ 创建 Header 模板
2. ✅ 创建 Footer 模板
3. ✅ 创建 Content 模板
4. ✅ 创建初始化工具
5. ⏳ 修改 `assemble_html_page` 使用 Tailwind
6. ⏳ 更新 `content-production.skill.ts` 工作流
7. ⏳ 添加到技能工具列表

### 后续任务
- 创建用户 UI 界面（上传 Logo、配置站点）
- 集成到 onboarding 流程
- 创建模板库（多套风格）
- 添加预览功能

---

## ✅ 预期效果

### 用户体验
1. 用户上传 Logo："logo.png"
2. 用户输入站点名："TechVision"
3. 系统生成 Header + Footer（1秒内）
4. 用户生成页面："生成关于 AI 的文章"
5. **完美的页面** - Header/Footer/Content 样式完全统一

### 技术收益
- ❌ 删除 `fix_style_conflicts` 工具
- ❌ 删除 CSS scoping 逻辑
- ❌ 删除冲突检测代码
- ✅ 工作流简化：7 步 → 6 步
- ✅ 代码量减少 ~30%
- ✅ 维护成本降低 ~50%

---

**状态**: ✅ 核心代码已实现，待集成到工作流

**下一步**: 修改 `assemble_html_page` 和 `content-production.skill.ts`



