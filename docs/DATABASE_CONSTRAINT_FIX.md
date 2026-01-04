# 🔧 数据库约束和工具参数修复

## 问题分析

### 问题 1: AI 使用错误的 type 值
AI 尝试使用 `type: "secondary_color"` 保存品牌颜色，但这不是有效的类型。品牌资产（颜色、字体等）应该作为 `type: "logo"` 记录的字段，而不是独立的类型。

```javascript
// ❌ 错误的做法
await save_site_context({
  userId,
  type: 'secondary_color',  // 无效的 type
  content: '#336FFF'
});

// ✅ 正确的做法
await save_site_context({
  userId,
  type: 'logo',             // 使用 logo type
  secondaryColor: '#336FFF' // 作为字段传递
});
```

### 问题 2: 数据库 CHECK 约束限制
数据库有一个 `site_contexts_type_check` 约束，只允许旧的 5 个类型，拒绝新增的 14 个内容类型。

错误信息：
```
new row for relation "site_contexts" violates check constraint "site_contexts_type_check"
```

## 修复内容

### 1. ✅ 数据库约束修复

**文件**: `/supabase/migrations/fix_site_contexts_type_constraint.sql` (新建)

删除旧约束并添加包含所有 19 个类型的新约束：

```sql
-- Drop old constraint
ALTER TABLE site_contexts 
  DROP CONSTRAINT IF EXISTS site_contexts_type_check;

-- Add new constraint with all 19 types
ALTER TABLE site_contexts
  ADD CONSTRAINT site_contexts_type_check 
  CHECK (type IN (
    'logo', 'header', 'footer', 'meta', 'sitemap',
    'key-website-pages', 'landing-pages', 'blog-resources',
    'hero-section', 'problem-statement', 'who-we-serve',
    'use-cases', 'industries', 'products-services',
    'social-proof-trust', 'leadership-team', 'about-us',
    'faq', 'contact-information'
  ));
```

### 2. ✅ 工具参数扩展

**文件**: `/app/api/skills/tools/seo/supabase-site-context-save.tool.ts`

添加了所有品牌资产字段作为可选参数：

```typescript
parameters: z.object({
  userId: z.string(),
  type: z.enum([...19个类型]),
  content: z.string().optional(),
  fileUrl: z.string().optional(),
  // 新增的品牌资产字段（仅用于 type='logo'）
  brandName: z.string().optional(),
  subtitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogImage: z.string().optional(),
  favicon: z.string().optional(),
  logoLight: z.string().optional(),
  logoDark: z.string().optional(),
  iconLight: z.string().optional(),
  iconDark: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  headingFont: z.string().optional(),
  bodyFont: z.string().optional(),
  tone: z.string().optional(),
  languages: z.string().optional(),
})
```

工具现在正确处理所有品牌资产字段的插入和更新。

### 3. ✅ Skill 说明更新

**文件**: `/app/api/skills/skill-optimize/site-context.skill.ts`

添加了清晰的说明，告诉 AI 正确的保存方式：

```typescript
// Brand assets (colors, fonts) - save with type='logo'
await save_site_context({
  userId,
  type: 'logo',
  primaryColor: analyzed.brandColors.primary,      // NOT type: 'primary_color'
  secondaryColor: analyzed.brandColors.secondary,  // NOT type: 'secondary_color'
  ...
});
```

## 必须执行的数据库迁移

⚠️ **重要**: 在 Supabase SQL Editor 中运行以下两个脚本：

### 1. 添加品牌资产字段
```bash
/supabase/migrations/add_brand_assets_fields.sql
```

### 2. 修复类型约束
```bash
/supabase/migrations/fix_site_contexts_type_constraint.sql
```

## 验证步骤

### 1. 运行迁移后验证
```sql
-- 检查新字段
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'site_contexts'
  AND column_name IN ('brand_name', 'logo_light', 'primary_color');

-- 检查约束
SELECT pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'site_contexts'::regclass 
  AND conname = 'site_contexts_type_check';
```

### 2. 测试保存操作
```javascript
// 测试保存品牌资产
await save_site_context({
  userId: 'test-user-id',
  type: 'logo',
  primaryColor: '#336FFF',
  secondaryColor: '#111827',
  brandName: 'Test Brand'
});

// 测试保存内容部分
await save_site_context({
  userId: 'test-user-id',
  type: 'hero-section',
  content: JSON.stringify({ headline: 'Test' })
});
```

## 相关文件

### 修改的文件
- ✅ `/app/api/skills/tools/seo/supabase-site-context-save.tool.ts` - 添加品牌资产参数
- ✅ `/app/api/skills/skill-optimize/site-context.skill.ts` - 更新说明

### 新建的文件
- ✅ `/supabase/migrations/fix_site_contexts_type_constraint.sql` - 约束修复

### 之前创建的文件
- `/supabase/migrations/add_brand_assets_fields.sql` - 添加新字段
- `/supabase/migrations/create_site_contexts_table.sql` - 基础表定义

## 状态

- ✅ 代码已修复
- ✅ 工具参数已扩展
- ✅ Skill 说明已更新
- ✅ 迁移脚本已创建
- ⚠️ **需要运行数据库迁移**

## 后续步骤

1. 在 Supabase SQL Editor 中运行两个迁移脚本
2. 重启开发服务器（如果需要）
3. 测试 AI 是否能正确保存所有类型的数据
4. 验证品牌资产字段是否正确存储

---

**完成后，AI 将能够：**
- ✅ 正确保存品牌颜色到 `type='logo'` 记录
- ✅ 保存所有 19 种上下文类型
- ✅ 自动填充品牌资产信息
- ✅ 正确结构化内容部分

