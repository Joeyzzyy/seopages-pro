# 侧边栏字段计数功能

## 更新日期
2026-01-05

## 功能描述
在**系统主左侧边栏**的 "On Site" 部分，每个分类右侧显示该分类下已获取字段的数量统计，格式为 `已获取/总数`。

同时也在 **Context Wizard Modal** 的左侧导航栏中实现了相同功能。

## 视觉效果

```
Brand & Site ►                     [9/9]  ← 全部获取（绿色）
Hero Section ▼                     [1/1]  ← 全部获取（绿色）
Pages ►                            [2/3]  ← 部分获取（蓝色）
Business Context ►                 [3/5]  ← 部分获取（蓝色）
Trust & Company ►                  [0/5]  ← 未获取（灰色）
```

## 实现细节

### 1. 数据结构增强

为每个 `navigationGroup` 添加 `fieldKeys` 数组，用于标识该分类包含的所有字段：

```typescript
const navigationGroups = [
  {
    label: 'Brand & Site',
    icon: <svg>...</svg>,
    expanded: expandedNavBrandAssets,
    setExpanded: setExpandedNavBrandAssets,
    fieldKeys: ['meta-info', 'logo', 'colors', 'typography', 'tone', 'languages', 'header', 'footer', 'sitemap'],  // ← 新增
    children: [...]
  },
  // ... 其他分类
];
```

### 2. 计数函数

添加 `countAcquiredFields` 函数来计算已获取的字段数：

```typescript
// Count acquired fields for each group
const countAcquiredFields = (checkKeys: string[]) => {
  return checkKeys.filter(key => hasContextValue(key)).length;
};
```

### 3. UI 渲染

在导航按钮中添加 badge 显示：

```tsx
{navigationGroups.map((group, index) => {
  const acquiredCount = group.fieldKeys ? countAcquiredFields(group.fieldKeys) : 0;
  const totalCount = group.fieldKeys ? group.fieldKeys.length : 0;
  
  return (
    <div key={index}>
      <button>
        {/* 图标和标签 */}
        {group.icon}
        <span className="flex-1">{group.label}</span>
        
        {/* 字段计数 badge */}
        {totalCount > 0 && (
          <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
            acquiredCount === totalCount 
              ? 'bg-green-100 text-green-700'     // 全部获取
              : acquiredCount > 0 
              ? 'bg-blue-100 text-blue-700'       // 部分获取
              : 'bg-gray-100 text-gray-500'       // 未获取
          }`}>
            {acquiredCount}/{totalCount}
          </span>
        )}
      </button>
    </div>
  );
})}
```

## 分类与字段映射

| 分类 | 字段数 | 包含字段 |
|------|--------|---------|
| **Brand & Site** | 9 | meta-info, logo, colors, typography, tone, languages, header, footer, sitemap |
| **Hero Section** | 1 | hero-section |
| **Pages** | 3 | key-pages, landing-pages, blog-resources |
| **Business Context** | 5 | problem-statement, who-we-serve, use-cases, industries, products-services |
| **Trust & Company** | 5 | social-proof, leadership-team, about-us, faq, contact-info |

**总计**: 23 个显示项（其中 `hero-section` 算作 1 个，虽然有 5 个子项）

## 颜色编码

| 状态 | 条件 | 背景色 | 文字色 | 说明 |
|------|------|--------|--------|------|
| 完成 | 已获取 = 总数 | `bg-green-100` | `text-green-700` | 该分类所有字段都已获取 |
| 进行中 | 0 < 已获取 < 总数 | `bg-blue-100` | `text-blue-700` | 该分类部分字段已获取 |
| 未开始 | 已获取 = 0 | `bg-gray-100` | `text-gray-500` | 该分类尚未获取任何字段 |

## 用户体验优化

### 1. 实时更新
- 当用户通过 AI skill 获取字段后，刷新页面即可看到更新的计数
- 计数基于 `hasContextValue()` 函数判断，确保准确性

### 2. 视觉反馈
- **绿色**：给用户成就感，表示该分类已完成
- **蓝色**：鼓励用户继续完成剩余字段
- **灰色**：提示用户该分类需要关注

### 3. 信息密度
- Badge 使用小字号 (`text-[10px]`)，不占用过多空间
- 圆角设计 (`rounded`) 与整体 UI 风格一致
- 半透明背景，与导航栏融合良好

## 技术实现

### 文件修改

#### 1. 系统主左侧边栏 (主要位置)
- **文件**: `/components/ConversationSidebar.tsx`
- **修改位置**:
  1. Line ~76: 添加 `getFieldCount` 函数计算字段数
  2. Line ~355-395: 重构 "On Site" 子项渲染逻辑，添加字段计数 badge
- **显示位置**: 主界面左侧 → On Site 展开项

#### 2. Context Wizard Modal 左侧导航栏
- **文件**: `/components/ContextModalNew.tsx`
- **修改位置**: 
  1. Line ~456: 添加 `countAcquiredFields` 函数
  2. Line ~460-540: 为 5 个 `navigationGroups` 添加 `fieldKeys`
  3. Line ~580-620: 修改渲染逻辑，添加 badge 显示
- **显示位置**: Context Wizard Modal 打开后的左侧导航

### 依赖
- 使用现有的 `hasContextValue()` 函数判断字段是否已获取
- 使用现有的 Tailwind CSS 类名，无需额外样式

### 兼容性
- 不影响现有功能
- 向后兼容：如果某个 group 没有 `fieldKeys`，则不显示 badge
- 响应式设计：badge 自适应文字宽度

## 示例场景

### 场景 1：新项目初始化
```
Brand & Site ►                     [0/9]  灰色
Hero Section ►                     [0/1]  灰色
Pages ►                            [0/3]  灰色
Business Context ►                 [0/5]  灰色
Trust & Company ►                  [0/5]  灰色
```

### 场景 2：部分字段已获取
```
Brand & Site ►                     [7/9]  蓝色
Hero Section ►                     [1/1]  绿色 ✓
Pages ►                            [3/3]  绿色 ✓
Business Context ►                 [2/5]  蓝色
Trust & Company ►                  [1/5]  蓝色
```

### 场景 3：完整提取完成
```
Brand & Site ►                     [9/9]  绿色 ✓
Hero Section ►                     [1/1]  绿色 ✓
Pages ►                            [3/3]  绿色 ✓
Business Context ►                 [5/5]  绿色 ✓
Trust & Company ►                  [5/5]  绿色 ✓
```

## 与字段提取策略文档的关联

此功能与 `/docs/SITE_CONTEXT_FIELD_STRATEGIES.md` 文档紧密配合：

1. **完整性检查**：用户可以一目了然地知道哪些字段已获取，哪些还未获取
2. **优先级指导**：根据分类的完成度，决定下一步提取哪些字段
3. **质量保证**：确保 17 个字段都被提取（按策略文档定义）

## 总结

此功能通过简洁的视觉设计，为用户提供了：
- ✅ **透明度**：清楚知道数据获取进度
- ✅ **引导性**：明确知道下一步该做什么
- ✅ **成就感**：看到进度条逐渐填满的满足感

代码实现简洁高效，无需额外依赖，完美融入现有系统。

