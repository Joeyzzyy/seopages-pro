# Social Proof 提取增强

## 更新日期
2026-01-05

## 问题
之前的 social-proof 提取功能存在以下问题：
1. 仅从首页提取，遗漏了专门的 testimonials/reviews/customers 页面
2. 外部平台（ProductHunt、Trustpilot、G2、Capterra）抓取成功率低
3. URL 构建策略单一，无法适应不同的命名规则
4. 缺少详细的评分、评论数、奖项等信息提取

## 解决方案

### 1. 网站内容提取增强

**智能页面发现**
- 从 sitemap 和导航中自动发现相关页面
- 目标页面关键词：`testimonials`, `reviews`, `customers`, `case-studies`, `success`, `clients`, `wall-of-love`
- 合并多个页面的内容（最多3个页面，共12000字符）进行分析

**扩展目标页面列表**
```typescript
targetPages: [
  '/', 
  '/customers', 
  '/testimonials', 
  '/case-studies', 
  '/about', 
  '/reviews', 
  '/clients', 
  '/success-stories', 
  '/wall-of-love'
]
```

### 2. 外部平台抓取增强

**多重URL尝试策略**

每个平台尝试多个URL格式，提高匹配成功率：

#### ProductHunt
```
1. /products/{name-with-dots}     // seopage-ai
2. /products/{name-clean}          // seopageai
3. /posts/{name-clean}             // 旧格式
```

#### Trustpilot
```
1. /review/{domain}                // seopage.ai
2. /review/www.{domain}            // www.seopage.ai
```

#### G2
```
1. /products/{name-with-dashes}/reviews
2. /products/{name}/reviews
```

#### Capterra
```
1. /p/{name-with-dashes}/
```

**增强信息提取**

使用多种正则模式提取：

1. **评分 (Rating)**
   - `X out of 5`
   - `★ X`
   - `rating: X`
   - `"ratingValue": "X"` (JSON-LD)

2. **评论数 (Review Count)**
   - `X reviews`
   - `"reviewCount": "X"` (JSON-LD)
   - `based on X reviews`

3. **ProductHunt 特有信息**
   - 奖项：Product of the Day/Week/Month, Golden Kitty
   - 排名：`#X Product of the Day`
   - Upvotes：点赞数

4. **页面验证**
   - 检查是否包含公司名称或域名
   - 排除 404 和空搜索结果页面

**失败降级**

如果自动抓取失败，提供手动搜索链接：
```json
{
  "platform": "producthunt",
  "found": false,
  "searchUrl": "https://www.producthunt.com/search?q=seopage",
  "message": "自动抓取失败，请手动访问：..."
}
```

### 3. 返回数据结构

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
      "url": "https://www.producthunt.com/products/seopage-ai",
      "awards": ["#3 Product of the Day"],
      "found": true
    },
    {
      "platform": "trustpilot",
      "rating": "4.5",
      "reviewCount": "89",
      "url": "https://www.trustpilot.com/review/seopage.ai",
      "found": true
    }
  ]
}
```

## 示例：seopage.ai

对于 `seopage.ai`，系统会：

1. **网站内容**：搜索并分析以下页面
   - 首页
   - sitemap 中包含 customers/reviews/testimonials 的页面

2. **外部平台**：尝试以下 URLs
   - ProductHunt: 
     - `https://www.producthunt.com/products/seopage-ai`
     - `https://www.producthunt.com/products/seopageai`
     - `https://www.producthunt.com/posts/seopage-ai`
   - Trustpilot:
     - `https://www.trustpilot.com/review/seopage.ai`
     - `https://www.trustpilot.com/review/www.seopage.ai`
   - G2:
     - `https://www.g2.com/products/seopage-ai/reviews`
     - `https://www.g2.com/products/seopageai/reviews`
   - Capterra:
     - `https://www.capterra.com/p/seopage-ai/`

## 技术细节

### 缓存机制
- Sitemap 缓存 5 分钟
- 页面内容缓存 5 分钟
- 减少重复请求，提高性能

### 容错处理
- 每个平台独立尝试，互不影响
- 网络错误自动重试下一个 URL
- 提供详细的日志输出用于调试

### 性能优化
- 并行处理不相关的页面抓取
- 限制页面数量和内容长度
- 使用 AbortSignal.timeout(15000) 防止长时间等待

## 使用建议

1. **首次运行**：完整执行获取所有数据
2. **定期更新**：每月更新一次外部评论数据
3. **手动补充**：如果某些平台抓取失败，使用提供的 searchUrl 手动查找
4. **数据验证**：检查返回的 rating 和 reviewCount 是否合理

## 未来改进

1. 支持更多评论平台（如 Capterra, Software Advice, Gartner）
2. 使用 API 而非爬虫（如果平台提供）
3. 添加情感分析对评论内容进行总结
4. 自动截图保存评论页面作为证据

