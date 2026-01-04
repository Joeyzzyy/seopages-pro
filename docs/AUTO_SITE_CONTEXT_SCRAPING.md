# 自动站点上下文抓取功能

## 🚀 功能概述

现在，Site Context Skill 具备**完全自动化**的网站内容抓取和分析能力！只需提供网站 URL，系统会自动：

1. ✅ 抓取网站所有可见内容
2. ✅ 使用 AI 分析和结构化内容
3. ✅ 自动保存到数据库
4. ✅ 生成完整报告

**零手动输入，一键完成！** 🎉

## 🎯 使用方法

### 方式 1: 直接触发（推荐）

在对话框中输入：

```
帮我检查和完善我的站点上下文
```

或：

```
Setup my site context automatically
```

```
自动抓取我的网站信息
```

### AI 会这样工作：

**步骤 1**: 检查现有 contexts
```
正在检查您的现有站点上下文...
已找到：Logo、Header、Footer、Meta、Sitemap
缺失：品牌颜色、Hero Section、产品服务等
```

**步骤 2**: 询问网站 URL（如果还没有）
```
请提供您的网站 URL（例如：https://seopage.ai）
```

**步骤 3**: 自动抓取和分析
```
🌐 正在从 https://seopage.ai 抓取内容...
🤖 使用 AI 分析和结构化内容...
💾 自动保存所有提取的信息...
```

**步骤 4**: 完整报告
```
✅ 成功从您的网站自动提取并保存以下信息：

📸 视觉品牌：
  ✅ Logo: https://seopage.ai/logo.png
  ✅ 主色调: #24be58
  ✅ 辅色调: #1a1a1a

🎯 Hero Section：
  ✅ 标题: "AI 驱动的 SEO 内容生成平台"
  ✅ 副标题: "10 分钟生成高质量 SEO 文章"
  ✅ CTA: "免费试用"
  ✅ 关键指标: "10,000+ 企业用户"

📦 产品服务：
  ✅ 已提取 300 字产品描述

🏢 公司信息：
  ✅ 公司故事: 已提取
  ✅ 使命愿景: 已提取
  ✅ 核心价值观: 已提取

⭐ 社会证明：
  ✅ 客户评价: 5 条
  ✅ 案例研究: 3 个
  ✅ 合作伙伴: 已提取

📞 联系方式：
  ✅ 邮箱: contact@seopage.ai
  ✅ 电话: +1-555-0100
  ✅ 地址: 已提取

❓ FAQ：
  ✅ 已提取 8 个常见问题

👥 团队信息：
  ✅ 已提取 5 位团队成员

⚠️ 以下信息无法自动提取，建议手动补充：
  - 标题字体 (Heading Font)
  - 正文字体 (Body Font)
  - 品牌语调 (Tone & Voice)
  - 支持语言

💡 您可以通过左侧边栏的 Context Wizard 补充这些信息。

🎉 站点上下文设置完成！现在可以开始生成高质量内容了！
```

## 🛠️ 技术实现

### 三个核心工具：

1. **scrape_website_content**
   - 抓取网页 HTML
   - 提取颜色、Logo、文本内容
   - 识别页面结构（Hero、About、Contact等）

2. **analyze_scraped_content**
   - 使用 GPT-4o-mini 分析原始内容
   - 智能结构化为标准格式
   - 生成 JSON 对象（Hero、About Us、Social Proof等）

3. **save_site_context**
   - 自动保存所有提取的信息
   - 使用正确的 context 类型
   - 验证并存储到数据库

### 自动提取的内容：

| 内容类型 | Context Type | 格式 | AI 分析 |
|---------|-------------|------|---------|
| Logo | `logo` (file_url) | URL | ❌ |
| 品牌颜色 | `logo` (primary_color, secondary_color) | Hex | ❌ |
| Hero Section | `hero-section` | JSON | ✅ |
| 产品服务 | `products-services` | Text | ✅ |
| 公司信息 | `about-us` | JSON | ✅ |
| 社会证明 | `social-proof-trust` | JSON | ✅ |
| 联系方式 | `contact-information` | JSON | ✅ |
| FAQ | `faq` | Text | ✅ |
| 团队 | `leadership-team` | Text | ✅ |

### 无法自动提取（需手动）：

- 字体选择（需设计决策）
- 品牌语调（需策略决策）
- 支持语言（需明确指定）

## 🎬 实际使用示例

### 示例对话：

**用户**:
```
帮我检查和完善我的站点上下文
```

**AI**:
```
正在检查您的站点上下文...

📊 当前状态：
✅ 已有：Sitemap (150 URLs)
❌ 缺失：大部分品牌和内容信息

为了自动提取信息，请提供您的网站 URL：
```

**用户**:
```
https://seopage.ai
```

**AI**:
```
收到！正在自动处理...

🌐 正在抓取 https://seopage.ai...
🤖 AI 正在分析内容...
💾 正在保存提取的信息...

✅ 完成！已成功提取并保存 9 个内容板块。
(显示详细报告...)
```

## 🔄 工作流程图

```
用户输入: "帮我检查和完善我的站点上下文"
    ↓
检查现有 contexts
    ↓
获取/询问 website URL
    ↓
scrape_website_content(url)
    ↓
analyze_scraped_content(scrapedData)
    ↓
保存所有提取的内容
├─ save_site_context(logo + colors)
├─ save_site_context(hero-section)
├─ save_site_context(products-services)
├─ save_site_context(about-us)
├─ save_site_context(social-proof-trust)
├─ save_site_context(contact-information)
├─ save_site_context(faq)
└─ save_site_context(leadership-team)
    ↓
生成完整报告
    ↓
显示结果 + 建议补充的内容
```

## 💡 提示

1. **URL 格式**: 
   - ✅ `https://example.com`
   - ✅ `https://www.example.com`
   - ❌ `example.com` (需要 https://)

2. **最佳实践**:
   - 首次使用时运行自动抓取
   - 检查自动提取的内容是否准确
   - 手动补充无法自动提取的部分（字体、语调）
   - 定期重新抓取以更新内容

3. **如果抓取失败**:
   - 检查网站是否可访问
   - 确认没有防爬虫限制
   - 可能需要手动提供信息

## 🎉 现在就试试！

在对话框中输入：

```
帮我检查和完善我的站点上下文
```

然后提供您的网站 URL，系统会自动完成剩余所有工作！

---

**版本**: 3.0.0  
**更新时间**: 2026-01-04  
**新功能**: 🚀 全自动网站抓取和 AI 分析

