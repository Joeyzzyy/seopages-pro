# 🔧 工具类型验证错误修复

## 问题
AI 在尝试保存新的内容类型（如 `faq`、`leadership-team`）时，遇到 Zod 验证错误：

```
Invalid enum value. Expected 'logo' | 'header' | 'footer' | 'meta' | 'sitemap', received 'faq'
```

## 根本原因
`save_site_context` 工具的 Zod 参数验证模式没有更新，仅包含 5 个旧类型，但数据库和其他部分已支持 19 个类型。

## 修复内容

### ✅ 已修复的文件

**`app/api/skills/tools/seo/supabase-site-context-save.tool.ts`**

**修复前:**
```typescript
type: z.enum(['logo', 'header', 'footer', 'meta', 'sitemap'])
```

**修复后:**
```typescript
type: z.enum([
  'logo', 'header', 'footer', 'meta', 'sitemap',
  'key-website-pages', 'landing-pages', 'blog-resources',
  'hero-section', 'problem-statement', 'who-we-serve',
  'use-cases', 'industries', 'products-services',
  'social-proof-trust', 'leadership-team', 'about-us',
  'faq', 'contact-information'
])
```

### ✅ 已确认正确的文件

**`app/api/skills/tools/content/get-site-contexts.tool.ts`**
- 已包含所有 19 个类型 ✓
- 描述文档完整 ✓
- 无需修改

## 验证
✅ 无 TypeScript 错误
✅ 无 Linter 错误  
✅ Zod 验证现在支持所有 19 个上下文类型

## 测试步骤
1. 重启开发服务器（如果需要）
2. 触发 Site Context skill
3. AI 应该能够成功保存所有新的内容类型，包括：
   - FAQ
   - Leadership Team
   - About Us
   - Contact Information
   - 等所有新类型

## 相关文件
- ✅ `/app/api/skills/tools/seo/supabase-site-context-save.tool.ts` (已修复)
- ✅ `/app/api/skills/tools/content/get-site-contexts.tool.ts` (已验证正确)
- ✅ `/lib/supabase.ts` (已更新)
- ✅ `/app/api/site-contexts/route.ts` (已更新)

---

**状态**: ✅ 完全修复！AI 现在可以保存所有 19 种上下文类型。

