# FAQ 提取增强

## 更新日期
2026-01-05

## 问题
之前的 FAQ 提取存在以下问题：
1. **内容截断**：只提取 8000 字符，FAQ 页面内容可能更长
2. **Token 限制**：maxTokens 1500 不足以返回完整的 FAQ 列表（10-30 条）
3. **格式验证不足**：没有验证返回的 JSON 格式是否正确
4. **错误处理弱**：解析失败时没有适当的降级处理

## 典型案例

以 NoteLM.ai 为例，FAQ 数据格式：
```json
[
  {
    "question": "What is NoteLM.ai and what free YouTube tools does it offer?",
    "answer": "NoteLM.ai provides 5 free YouTube AI tools: (1) YouTube Video Summarizer..."
  },
  {
    "question": "Is NoteLM.ai really 100% free to use?",
    "answer": "Yes, all NoteLM.ai tools are completely free..."
  }
]
```

特点：
- 10-30 条 FAQ
- 每条 answer 可能很长（100-500 字）
- 总字符数可能超过 15000
- 需要 2000-3000 tokens 来返回完整 JSON

## 解决方案

### 1. 增加处理容量

**提升 Token 限制**
```typescript
{
  maxTokens: 3000,        // 从 1500 提升到 3000
  maxContentChars: 15000  // 从 8000 提升到 15000
}
```

**原因**：
- 1 条 FAQ 平均需要 80-120 tokens
- 20 条 FAQ 需要约 1600-2400 tokens
- 加上 JSON 结构开销，3000 tokens 更安全

### 2. 优化 AI Prompt

**新 Prompt**：
```
Extract FAQ (Frequently Asked Questions) from this content.
Look for Q&A sections, FAQ pages, or common questions answered.

IMPORTANT: Return ONLY a valid JSON array with this exact structure:
[
  {"question": "Question text here", "answer": "Complete answer text here"}
]

Rules:
- Extract ALL FAQs found on the page (aim for 10-30 items)
- Keep question text concise but complete
- Include full answer text (can be multiple paragraphs)
- If answer is very long (500+ words), summarize key points
- Maintain the original order if possible
- If no FAQs found, return: []

Do NOT include any text before or after the JSON array.
```

**改进点**：
- 明确要求提取所有 FAQ（10-30 条）
- 指导如何处理长答案（摘要关键点）
- 强调返回纯 JSON，无额外文本

### 3. 增强数据验证

**多层验证机制**：

```typescript
// 1. 类型验证
if (!Array.isArray(extractedData)) {
  // 处理错误、字符串等情况
}

// 2. 结构验证
extractedData = extractedData.filter(item => 
  item && 
  typeof item === 'object' && 
  item.question && 
  item.answer &&
  typeof item.question === 'string' &&
  typeof item.answer === 'string'
);

// 3. 记录日志
console.log(`Validated ${extractedData.length} FAQ items`);
```

**处理情况**：
- ✅ 正常数组：直接验证每项结构
- ✅ 错误对象：`{error: "..."}`，返回空数组
- ✅ JSON 字符串：尝试解析为数组
- ✅ 无效数据：过滤掉格式错误的项

### 4. 错误降级策略

**情况 1：AI 返回错误**
```typescript
if (extractedData.error) {
  console.log('[FAQ] Extraction error:', extractedData.error);
  extractedData = [];
}
```

**情况 2：返回非数组**
```typescript
if (typeof extractedData === 'string') {
  try {
    extractedData = JSON.parse(extractedData);
  } catch (e) {
    extractedData = [];
  }
}
```

**情况 3：数组项格式错误**
```typescript
// 过滤掉缺少 question/answer 或类型错误的项
extractedData = extractedData.filter(item => 
  item.question && item.answer &&
  typeof item.question === 'string' &&
  typeof item.answer === 'string'
);
```

### 5. 灵活的 AI 配置

**analyzeWithAI 函数增强**：
```typescript
interface AnalyzeOptions {
  maxTokens?: number;
  maxContentChars?: number;
}

async function analyzeWithAI(
  prompt: string, 
  pageText: string, 
  url: string,
  options: AnalyzeOptions = {}
): Promise<any>
```

**不同字段使用不同配置**：
- **FAQ**: `{maxTokens: 3000, maxContentChars: 15000}`
- **about-us**: `{maxTokens: 1500, maxContentChars: 8000}` (默认)
- **testimonials**: `{maxTokens: 2000, maxContentChars: 10000}`

## 数据质量保证

### 完整性检查

```typescript
// 数量检查
if (extractedData.length === 0) {
  console.warn('[FAQ] No FAQs extracted');
}

if (extractedData.length < 5 && faqBestPageData.text.length > 5000) {
  console.warn('[FAQ] Suspiciously few FAQs extracted from large page');
}
```

### 内容质量检查

```typescript
// 检查是否有截断的答案
const truncatedAnswers = extractedData.filter(item => 
  item.answer.length < 20 || 
  !item.answer.endsWith('.') && !item.answer.endsWith('。')
);

if (truncatedAnswers.length > 0) {
  console.warn('[FAQ] Found potentially truncated answers:', truncatedAnswers.length);
}
```

## 使用示例

### 标准 FAQ 页面
```typescript
// NoteLM.ai 的 /faq 页面
// 页面内容：15000 字符
// 包含 20 条 FAQ
// 结果：成功提取 20 条，无截断
```

### 长答案 FAQ 页面
```typescript
// 每条 answer 300-500 字
// 系统会自动摘要关键点
// 保持问题的完整性和答案的可读性
```

### 多页面 FAQ
```typescript
// /faq, /help, /support 都包含 FAQ
// 系统选择内容最丰富的页面
// 通过字符数比较选择最佳来源
```

## 性能优化

### 1. 智能内容截取
- 保留前 15000 字符（vs 8000）
- 大多数 FAQ 页面在此范围内
- 避免不必要的长内容处理

### 2. Token 预算管理
- 3000 tokens 足够 20-30 条 FAQ
- 避免过度使用导致成本增加
- 如需更多，考虑分批提取

### 3. 缓存利用
- 页面内容缓存 5 分钟
- 避免重复抓取同一页面
- 提升多字段提取效率

## 未来改进

1. **分批提取**：对超长 FAQ 页面（50+ 条），分批提取并合并
2. **结构化解析**：使用 DOM 解析而非 AI，提高准确性
3. **去重机制**：检测和移除重复的 FAQ 项
4. **多语言支持**：针对不同语言优化 prompt
5. **FAQ 分类**：自动识别 FAQ 类别（技术、账户、定价等）

## 兼容的数据格式

系统现在能正确处理以下格式：

✅ **标准格式**
```json
[
  {"question": "...", "answer": "..."}
]
```

✅ **嵌套格式**（自动提取）
```json
{
  "faqs": [
    {"question": "...", "answer": "..."}
  ]
}
```

✅ **字符串格式**（自动解析）
```json
"[{\"question\":\"...\",\"answer\":\"...\"}]"
```

✅ **不完整格式**（自动修复）
```json
[
  {"question": "...", "answer": "..."},
  {"question": "..."}  // ← 会被过滤掉
]
```

## 测试建议

1. **小型 FAQ**（5-10 条）：验证基础功能
2. **中型 FAQ**（10-20 条）：验证完整性
3. **大型 FAQ**（20-30 条）：验证 token 限制
4. **超长答案**：验证摘要功能
5. **多页面**：验证页面选择逻辑

