# GEO-Lens Pro: EEAT 检测规则

**版本**: v1.0  
**最后更新**: 2025-12-03  
**适用模式**: Pro 模式（AI 增强检测）

---

## 文档概览

本文档定义了 GEO-Lens Pro 版本的 EEAT（Experience, Expertise, Authoritativeness, Trustworthiness）检测规则。Pro 模式通过 AI 分析页面内容，自动判断页面类型和内容类型，并基于 Google EEAT 标准进行全面检测。

### 核心特性

- ✅ **智能类型识别**：自动识别页面类型（Blog/Product/Landing/News）和内容类型（Review/Guide/Tutorial/Comparison）
- ✅ **动态检测重点**：根据不同类型动态调整检测重点和权重
- ✅ **20 个 EEAT 检查项**：覆盖 Experience、Expertise、Authority、Trust 四个维度
- ✅ **语义级别分析**：不仅检查 DOM 结构，还分析内容语义和质量
- ✅ **详细评分算法**：每个检查项都有明确的打分规则（权重分配和加减分规则）

### 检查项概览

| 维度 | 检查项数量 | 检查项 ID |
|------|-----------|----------|
| **E - Experience** | 5 项 | E01-E05 |
| **E - Expertise** | 5 项 | E01-E05 |
| **A - Authority** | 4 项 | A01-A04 |
| **T - Trust** | 6 项 | T01-T06 |
| **总计** | **20 项** | - |

### 与 Lite 模式的关系

| 模式 | 基础检查项 | EEAT 检查项 | 说明 |
|------|-----------|------------|------|
| **Lite** | ✅ 执行 | ❌ 不生成 | 只显示基础检查项（Meta、标题、链接、图片等） |
| **Pro** | ✅ 执行 | ✅ 通过 AI 生成 | 基础检查项 + AI 生成的 20 个 EEAT 检查项 |

**说明**：
- Pro 模式在基础检查项（与 Lite 相同）的基础上，通过 AI 分析生成 20 个详细的 EEAT 检查项
- AI 分析通过发送请求到 AI API（Azure OpenAI 或 Gemini）完成
- 所有检查项都包含状态（pass/partial/fail）、消息、建议和优先级

---

## 1. 核心设计理念

### 1.1 智能类型识别

AI 需要自动判断：
- **页面类型**：Blog Post, Landing Page, Product Page, News Article, Other
- **内容类型**：
  - Product Review（产品评测）
  - How-to Guide（教程指南）
  - Comparison（对比文章）
  - Tutorial（教程）
  - News/Article（新闻/文章）
  - Listicle（列表文章）
  - Other（其他）

### 1.2 动态检测重点

不同类型的页面，EEAT 检测的重点不同：

#### Product Review（产品评测）
- **Experience (E)**：最重要 - 需要真实使用体验、第一人称叙述、感官描述、缺点分析
- **Expertise (E)**：重要 - 需要专业背景、产品知识
- **Authority (A)**：中等 - 需要引用权威来源
- **Trust (T)**：重要 - 需要透明度声明（特别是 Affiliate 链接）

#### How-to Guide / Tutorial（教程指南）
- **Expertise (E)**：最重要 - 需要专业知识和详细步骤
  - **关键检测项**：E03 (词汇深度)、E04 (内容深度) - 评估框架完整性、行业共识对齐、外部参考质量
  - **降低权重**：E01 (作者身份)、E02 (资质证明) - 内容质量比作者信号更重要
- **Experience (E)**：较低优先级 - 不需要个人体验叙述
  - **降低权重**：E01-E04 (第一人称、感官细节、原生图片、独家数据) - 对 Guide 不适用
  - **重要检测项**：E05 (批判性分析) - 应包含局限性、常见错误、风险提示
- **Organization (O)**：重要 - 需要清晰的结构和步骤
- **Trust (T)**：中等 - 需要作者资质证明
  - **重要检测项**：T06 (透明度) - 应检测风险警告、质量控制声明、方法论透明度

#### Comparison（对比文章）
- **Expertise (E)**：最重要 - 需要深度专业知识
- **Organization (O)**：重要 - 需要表格和结构化对比
- **Reliability (R)**：重要 - 需要数据来源和证据
- **Authority (A)**：重要 - 需要权威引用

#### News/Article（新闻/文章）
- **Authority (A)**：最重要 - 需要权威来源和引用
- **Reliability (R)**：重要 - 需要事实核查和时间戳
- **Expertise (E)**：中等 - 需要作者资质
- **Trust (T)**：重要 - 需要透明度

#### Landing Page（落地页）
- **Trust (T)**：最重要 - 需要法律条款、联系方式、安全证书
- **Authority (A)**：重要 - 需要品牌实体和社会证明
- **Organization (O)**：重要 - 需要清晰的结构
- **Experience (E)**：较低 - 通常不需要个人体验

### 1.3 不穷举类型，让 AI 自主判断

规则文档不列出所有可能的文章类型，而是：
- 提供核心检测框架
- 让 AI 根据内容特征自主判断类型
- 根据判断结果动态调整检测重点

---

## 2. EEAT 检测项完整清单

### 2.1 E - Experience (真实体验)

#### E01: Narrative (主观视角)
- **检测点**：第一人称叙述 + 实操动词
- **示例**：`I tested`, `We analyzed`, `I tried`, `In my experience`
- **评分标准**：
  - Pass: 有第一人称 + 实操动词组合
  - Partial: 只有第一人称或只有实操动词；或对于 Guide 类型，框架体现实践知识（即使无第一人称）
  - Fail: 完全没有
- **内容类型调整**：
  - **Product Review**：必需，高权重
  - **Guide/Tutorial**：低优先级，不要求第一人称体验叙述

#### E02: Sensory Details (感官细节)
- **检测点**：感官描述词汇（视觉/听觉/触觉）
- **示例**：`smooth`, `heavy`, `bright`, `clicky`, `sturdy`, `grainy`
- **评分标准**：
  - Pass: ≥10 个感官词汇
  - Partial: 5-9 个
  - Fail: <5 个
- **内容类型调整**：
  - **Product Review**：重要
  - **Guide/Tutorial**：低优先级，不要求

#### E03: Visual Evidence (视觉证据)
- **检测点**：原生图片、截图、实拍图
- **评分标准**：
  - Pass: ≥2 张疑似原生图（Alt 包含 `my photo`, `screenshot`, `taken by` 等）
  - Partial: 1 张；或对于 Guide，有展示流程的截图/图表
  - Fail: 无原生图
- **内容类型调整**：
  - **Product Review**：重要
  - **Guide/Tutorial**：有帮助但非必需，展示流程的截图/图表有价值

#### E04: Exclusive Data Points (独家数据)
- **检测点**：精确到小数点的实测数据
- **示例**：`12.5ms`, `3.2kg`, `45.7fps`
- **评分标准**：
  - Pass: ≥3 处精确数据
  - Partial: 1-2 处
  - Fail: 无精确数据
- **内容类型调整**：
  - **Product Review**：重要
  - **Guide/Tutorial**：不要求，框架完整性比独家数据更重要

#### E05: Critique & Downsides (负面体验)
- **检测点**：缺点、问题、局限性分析
- **示例**：`Cons`, `Downsides`, `What I didn't like`, `Issues`, `Drawbacks`, `Pitfalls`, `Common mistakes`, `Limitations`, `Risks`
- **评分标准**：
  - Pass: 有明确的缺点分析、局限性或常见错误讨论
  - Partial: 有轻微提及但不够深入
  - Fail: 全是优点（软文嫌疑）
- **内容类型调整**：
  - **Product Review**：必需
  - **Guide/Tutorial**：重要 - 应包含局限性、常见错误、风险提示章节（如 "Common Pitfalls", "What to Avoid"）

---

### 2.2 E - Expertise (专业知识)

#### E01: Author Identity (作者身份)
- **检测点**：
  - Schema Person 标记
  - Byline（作者署名）
  - Bio（作者简介，>30 词）
- **评分标准**：
  - Pass: 三项全有
  - Partial: 1-2 项；或对于 Guide，内容通过结构和参考体现深度专业知识（即使无作者信号）
  - Fail: 无作者信息
- **内容类型调整**：
  - **Product Review**：重要
  - **Guide/Tutorial**：较低优先级 - 内容质量和框架完整性比作者身份更重要

#### E02: Credentials (资质证明)
- **检测点**：专业头衔、学历、认证
- **示例**：`Ph.D`, `MD`, `Engineer`, `Certified`, `Years of experience`
- **评分标准**：
  - Pass: 有资质证明
  - Partial: 无明确资质但内容体现专业水平
  - Fail: 无资质证明且内容质量低
- **内容类型调整**：
  - **Product Review**：重要
  - **Guide/Tutorial**：较低优先级 - 通过内容质量评估专业知识，而非仅看资质

#### E03: Vocabulary Depth (术语深度)
- **检测点**：专业术语、长词占比
- **评分标准**：
  - Pass: 平均词长 > 5.5 字符，长词（>6字符）占比高
  - Partial: 中等专业度
  - Fail: 词汇过于简单

#### E04: Content Depth (内容深度)
- **检测点**：全面评估
  - 字数（>1200 词为佳，>2000 词对 Guide 为优秀）
  - 引用密度（每 500 词 ≥1 个外链）
  - 标题层级深度（≥3 层显示结构）
  - **框架完整性**：指南是否全面覆盖主题？是否涵盖所有关键方面？
  - **行业共识对齐**：内容是否与既定最佳实践和行业标准对齐？
  - **外部参考质量**：参考是否来自可靠来源（即使不是 .gov/.edu）？
- **评分标准**：
  - Pass: 字数、引用、层级都达标，且框架完整、行业对齐
  - Partial: 1-2 项达标，或框架基本完整但缺少某些方面
  - Fail: 都不达标或框架不完整
- **内容类型调整**：
  - **Guide/Tutorial**：这是最关键的检测项 - 高权重评估框架完整性和行业对齐

#### E05: Editorial Process (编辑流程)
- **检测点**：审校标记
- **示例**：`Reviewed by`, `Fact checked by`, `Edited by`
- **评分标准**：
  - Pass: 有编辑流程标记
  - Fail: 无编辑流程

---

### 2.3 A - Authoritativeness (权威性)

#### A01: Citation Quality (引用质量)
- **检测点**：分层评估引用质量
  - **Tier 1 (最高)**：.gov, .edu, .org 域名，Wikipedia, PubMed，学术来源
  - **Tier 2 (高)**：行业权威站点（如 Moz, Ahrefs, Search Engine Journal, HubSpot, TechCrunch, Forbes 等，根据主题相关）
  - **Tier 3 (中)**：知名行业博客和成熟出版物
  - **Tier 4 (低/负面)**：短链（bit.ly）、Affiliate 链接（amzn.to）、垃圾域名
  - **对于 Guide/Tutorial**：Tier 2 行业权威来源非常有价值，应给予高权重
  - **评估维度**：引用的相关性、时效性、是否支持内容主张
- **评分标准**：
  - Pass: ≥3 个 Tier 1-2 链接，无 Tier 4 链接
  - Partial: 1-2 个 Tier 1-2 链接，或多个 Tier 3 链接
  - Fail: 无权威引用或有多 Tier 4 链接

#### A02: Entity Signals (实体信号)
- **检测点**：
  - Organization Schema（完整的组织结构化数据）
  - Social Proof（Verified 社交媒体链接）
- **评分标准**：
  - Pass: 有 Organization Schema 或 Social Proof
  - Fail: 无实体信号

#### A03: Press Mentions (媒体提及)
- **检测点**：媒体 Logo、信任条
- **示例**：`Featured in`, `As seen on`, Forbes, TechCrunch 等
- **评分标准**：
  - Pass: 有媒体提及
  - Fail: 无媒体提及

#### A04: Site Structure (站点结构)
- **检测点**：面包屑导航、内链结构
- **评分标准**：
  - Pass: 有面包屑或清晰的内链结构
  - Fail: 孤立页面（无内链结构）

---

### 2.4 T - Trustworthiness (信任度)

#### T01: Legal Compliance (法律合规)
- **检测点**：
  - 必需项：Privacy Policy, Terms of Service
  - 加分项：Cookie Policy, GDPR, Affiliate Disclosure
- **评分标准**：
  - Pass: 必需项齐全，有加分项
  - Partial: 必需项齐全
  - Fail: 缺少必需项

#### T02: Contact Information (联系方式)
- **检测点**：
  - 物理地址
  - Email (mailto:)
  - 电话 (tel:)
  - Contact Us 页面
- **评分标准**：
  - Pass: 有物理地址或多种联系方式
  - Partial: 只有 Email
  - Fail: 无联系方式

#### T03: Security (安全技术)
- **检测点**：HTTPS
- **评分标准**：
  - Pass: 使用 HTTPS
  - Fail: 使用 HTTP

#### T04: Ad Density (广告密度)
- **检测点**：广告元素占比、全屏弹窗
- **评分标准**：
  - Pass: 广告占比 < 30%，无全屏弹窗
  - Partial: 广告占比 30-50%
  - Fail: 广告占比 > 50% 或有全屏弹窗

#### T05: Content Maintenance (内容维护)
- **检测点**：
  - Last Updated 日期（1 年内）
  - 空链接数量
- **评分标准**：
  - Pass: 1 年内更新，无空链接
  - Partial: 1-3 年更新，少量空链接
  - Fail: >3 年未更新或大量空链接

#### T06: Disclosure & Transparency (透明度)
- **检测点**：评估内容层面的信任信号
  - **Affiliate 链接声明**：如果有 Affiliate 链接必须有声明（一票否决）
  - **风险警告和局限性**：内容是否承认缺陷、局限性或风险？（如 "Pitfall 1: Over-Reliance on AI", "Common mistakes to avoid"）
  - **质量控制声明**：内容是否强调质量而非数量、人工监督等？
  - **方法论透明度**：内容是否解释结论是如何得出的？
  - **对于 Guide**：风险警告和质量控制声明是强信任信号
- **评分标准**：
  - Pass: 有 Affiliate 链接且有声明，或无 Affiliate 链接；且有风险警告/质量控制声明
  - Partial: 无 Affiliate 链接，但缺少风险警告或透明度声明
  - Fail: 有 Affiliate 链接但无声明（一票否决，扣 50 分）

---

## 3. EEAT 评分算法详细规则

### 3.0 评分依据说明

**EEAT 概念来源**：
- **Google Search Quality Rater Guidelines**：EEAT（Experience, Expertise, Authoritativeness, Trustworthiness）是 Google 官方发布的内容质量评估框架
- **官方文档**：https://developers.google.com/search/docs/fundamentals/creating-helpful-content

**打分体系设计**：
- **概念框架**：基于 Google 的 EEAT 官方指南
- **具体分数分配**：项目根据行业实践和 SEO 专家经验设计，**非 Google 官方标准**
- **优化建议**：可以基于以下资料进一步优化：
  - Google Search Quality Rater Guidelines（最新版本）
  - Google Search Central 的 EEAT 最佳实践
  - 行业案例研究和 SEO 专家分析

**Pro 模式的智能评分**：
- Pro 模式中，**AI 会根据检测到的页面类型和内容类型，动态调整打分权重**
- AI 会参考 Google 对不同内容类型的 EEAT 要求，给出更有指向性的分数
- 例如：Guide/Tutorial 类型会降低 Experience 维度中个人体验叙述的权重，提高 Expertise 维度中框架完整性的权重

---

Pro 模式中，EEAT 评分有两种方式：

1. **Lite 模式**：使用代码中的 `eeat-ultimate-scoring.ts` 固定打分规则
2. **Pro 模式**：**优先使用 AI 根据页面类型动态调整的分数**（如果 AI 分析可用）

以下是 Lite 模式的详细打分规则（Pro 模式中 AI 会参考这些规则，但会根据页面类型调整权重）：

### 3.1 评分公式

```
Overall Score = (GEO Score + EEAT Score) / 2

EEAT Score = (Experience + Expertise + Authority + Trust) / 4
```

每个维度的分数范围：**0-100 分**

### 3.2 E - Experience (体验) 评分规则

**总分**: 100 分

#### E01: Narrative (主观视角) - 20 分

**打分逻辑**：
```typescript
if (hasFirstPersonWithAction) {
  score += 20; // 有第一人称 + 实操动词组合
} else if (firstPersonDensity >= 0.005) {
  score += 5;  // 只有第一人称代词，得 5 分
}
```

**分数分配**：
- **Pass**: 20 分（有第一人称 + 实操动词）
- **Partial**: 5 分（只有第一人称代词）
- **Fail**: 0 分

---

#### E02: Sensory Details (感官细节) - 最多 20 分

**打分逻辑**：
```typescript
const sensoryScore = Math.min(20, sensoryWordCount * 2);
score += sensoryScore;
```

**分数分配**：
- 每个感官词 = 2 分
- 上限 = 20 分
- 示例：10 个感官词 = 20 分，5 个感官词 = 10 分

---

#### E03: Visual Evidence (视觉证据) - 15 分

**打分逻辑**：
```typescript
if (nativeImageCount >= 2) {
  score += 15;
}
```

**分数分配**：
- **Pass**: 15 分（≥2 张原生图）
- **Fail**: 0 分

---

#### E04: Exclusive Data Points (独家数据) - 15 分

**打分逻辑**：
```typescript
if (exclusiveDataPointCount >= 3) {
  score += 15;
}
```

**分数分配**：
- **Pass**: 15 分（≥3 处精确数据点）
- **Fail**: 0 分

**对于 Comparison 类型的特殊考虑**：
- 对于 Comparison 类型，应该识别"具体实测信号"作为 Experience 信号：
  - 研究周期（如 "6个月研究"）
  - 样本规模（如 "847页"）
  - 分阶段流程说明
  - 可复现性指标（可下载数据、样本页、实验细节）
- 这些信号虽然不是"独家数据点"，但体现了实际测试经验，应该给予部分 Experience 分数（5-10 分）

---

#### E05: Critique & Downsides (负面体验) - 30 分或 -10 分

**打分逻辑**：
```typescript
if (hasCritique) {
  score += 30; // 有缺点分析
} else {
  score -= 10; // 全是优点（软文嫌疑），扣 10 分
}
```

**分数分配**：
- **Pass**: +30 分（有明确的缺点分析）
- **Fail**: -10 分（全是优点，软文嫌疑）

---

### 3.3 E - Expertise (专业性) 评分规则

**总分**: 100 分

#### E01: Author Identity (作者身份) - 30 分

**打分逻辑**：
```typescript
let identityScore = 0;
if (hasSchemaAuthor) identityScore += 10;
if (hasByline) identityScore += 10;
if (hasBio) identityScore += 10;
score += identityScore;
```

**分数分配**：
- Schema Person 标记：10 分
- Byline（作者署名）：10 分
- Bio（作者简介，>30 词）：10 分
- **满分**: 30 分（三项全有）

---

#### E02: Credentials (资质证明) - 20 分

**打分逻辑**：
```typescript
if (hasCredentials) {
  score += 20;
}
```

**分数分配**：
- **Pass**: 20 分（有资质证明）
- **Fail**: 0 分

---

#### E03: Vocabulary Depth (术语深度) - 15 分

**打分逻辑**：
```typescript
if (avgWordLength > 5.5) {
  score += 15;
}
```

**分数分配**：
- **Pass**: 15 分（平均词长 > 5.5 字符）
- **Fail**: 0 分

---

#### E04: Content Depth (内容深度) - 20 分

**打分逻辑**：
```typescript
if (wordCount < 500) {
  return 0; // 字数不足 500 词直接 0 分
}

let depthScore = 0;
// 字数检查
if (wordCount > 1200) {
  depthScore += 8;
} else if (wordCount > 500) {
  depthScore += 4;
}

// 引用密度检查（每 500 词 ≥1 个外链）
if (citationDensity >= 0.002) {
  depthScore += 6;
}

// 标题层级深度（≥3 层）
if (headingDepth >= 3) {
  depthScore += 6;
}

score += depthScore;
```

**分数分配**：
- 字数 > 1200 词：8 分
- 字数 500-1200 词：4 分
- 字数 < 500 词：**整个维度 0 分**（一票否决）
- 引用密度达标：6 分
- 标题层级深度 ≥3：6 分
- **满分**: 20 分

---

#### E05: Editorial Process (编辑流程) - 15 分

**打分逻辑**：
```typescript
if (hasEditorial) {
  score += 15;
}
```

**分数分配**：
- **Pass**: 15 分（有编辑流程标记）
- **Fail**: 0 分

---

### 3.4 A - Authority (权威性) 评分规则

**总分**: 100 分

#### A01: Citation Quality (引用质量) - 40 基础分 + 30 加分 - 扣分

**打分逻辑**：
```typescript
score += 40; // 基础分

// 白名单加分（每链接 10 分，上限 30 分）
const whiteListBonus = Math.min(30, whiteListLinkCount * 10);
score += whiteListBonus;

// 黑名单扣分（每链接 10 分）
score -= blackListLinkCount * 10;

// 识别"站内自引"问题（重要！）
// 如果外部引用中站内自引占比过高（>50%），应该扣分
const selfCitationRatio = selfCitationCount / totalCitationCount;
if (selfCitationRatio > 0.5) {
  score -= 15; // 站内自引过多，扣 15 分
}

// 识别"不可访问链接"（chrome-extension://, file:// 等）
const inaccessibleLinkCount = countInaccessibleLinks(citations);
score -= inaccessibleLinkCount * 5; // 每个不可访问链接扣 5 分
```

**分数分配**：
- 基础分：40 分
- 白名单链接（.gov, .edu, .org, Wikipedia, PubMed 等）：每链接 +10 分，上限 +30 分
- 黑名单链接（bit.ly, amzn.to 等）：每链接 -10 分
- **站内自引过多**（>50%）：-15 分
- **不可访问链接**（chrome-extension://, file:// 等）：每链接 -5 分
- **理论最高分**: 70 分（40 + 30）
- **理论最低分**: 0 分（扣分后）

**重要说明**：
- 对于 Comparison 类型（特别是厂商自研报告），应该识别"站内自引"问题
- 如果外部引用中站内自引占比过高，说明缺乏第三方权威背书，应该相应扣分
- 不可访问的链接（如 chrome-extension://）影响可信度，应该识别并扣分

---

#### A02: Entity Signals (实体信号) - 30 分

**打分逻辑**：
```typescript
if (hasOrganizationSchema || hasSocialProof) {
  score += 30;
}
```

**分数分配**：
- **Pass**: 30 分（有 Organization Schema 或 Social Proof）
- **Fail**: 0 分

---

#### A03: Press Mentions (媒体提及) - 20 分

**打分逻辑**：
```typescript
if (hasPressMention) {
  score += 20;
}
```

**分数分配**：
- **Pass**: 20 分（有媒体提及）
- **Fail**: 0 分

---

#### A04: Site Structure (站点结构) - 10 分或 -10 分

**打分逻辑**：
```typescript
if (hasBreadcrumbs) {
  score += 10;
} else {
  score -= 10; // 无面包屑扣 10 分
}
```

**分数分配**：
- **Pass**: +10 分（有面包屑）
- **Fail**: -10 分（无面包屑）

---

### 3.5 T - Trust (信任度) 评分规则

**总分**: 100 分

#### T01: Legal Compliance (法律合规) - 30 分

**打分逻辑**：
```typescript
let legalScore = 0;

// 必需项检查
if (hasPrivacyPolicy) legalScore += 7.5;
else legalScore -= 15;

if (hasTermsOfService) legalScore += 7.5;
else legalScore -= 15;

// 加分项
if (hasCookiePolicy || hasGDPR) legalScore += 5;
if (hasAffiliateDisclosure) legalScore += 5;

score += Math.max(0, legalScore);
```

**分数分配**：
- Privacy Policy：+7.5 分（缺失则 -15 分）
- Terms of Service：+7.5 分（缺失则 -15 分）
- Cookie Policy 或 GDPR：+5 分
- Affiliate Disclosure：+5 分
- **满分**: 25 分（必需项 15 分 + 加分项 10 分）
- **最低分**: 0 分（扣分后取 0）

---

#### T02: Contact Information (联系方式) - 20 分

**打分逻辑**：
```typescript
if (hasPhysicalAddress) {
  score += 20; // 有物理地址得满分
} else if (hasEmail) {
  score += 10; // 只有 Email 得 10 分
}
```

**分数分配**：
- **Pass**: 20 分（有物理地址）
- **Partial**: 10 分（只有 Email）
- **Fail**: 0 分

---

#### T03: Security (安全技术) - 10 分（一票否决）

**打分逻辑**：
```typescript
if (hasHttps) {
  score += 10;
} else {
  return 0; // HTTP 直接本项 0 分
}
```

**分数分配**：
- **Pass**: 10 分（使用 HTTPS）
- **Fail**: 0 分（使用 HTTP，且可能影响总分）

---

#### T04: Ad Density (广告密度) - 最多扣 30 分

**打分逻辑**：
```typescript
if (adDensity > 0.3) {
  const adPenalty = Math.min(30, (adDensity - 0.3) * 100);
  score -= adPenalty;
}
if (hasFullscreenPopup) {
  score -= 20; // 全屏弹窗直接扣 20 分
}
```

**分数分配**：
- 广告密度 > 30%：扣分 = (adDensity - 0.3) * 100，最多扣 30 分
- 全屏弹窗：直接扣 20 分
- **示例**：广告密度 40% = 扣 10 分，50% = 扣 20 分，60% = 扣 30 分

---

#### T05: Content Maintenance (内容维护) - 20 分基础分 - 扣分

**打分逻辑**：
```typescript
score += 20; // 基础分
// 空链接扣分
score -= Math.min(20, emptyLinkCount * 5);
```

**分数分配**：
- 基础分：20 分
- 空链接扣分：每链接 -5 分，最多扣 20 分
- **最低分**: 0 分

---

#### T06: Disclosure (透明度) - 一票否决，扣 50 分 + 内容层面信任信号加分

**打分逻辑**：
```typescript
// 基础扣分（一票否决）
if (hasAffiliateLinks && !hasDisclosureStatement) {
  score -= 50; // 有推广链接但无声明，扣 50 分
}

// 内容层面信任信号加分（重要！）
// 这些信号对于 Guide/Comparison 类型特别重要
if (hasRiskWarnings) {
  score += 15; // 风险警告和局限性说明
}
if (hasQualityControlStatements) {
  score += 10; // 质量控制声明（如 "human-in-the-loop", "quality control"）
}
if (hasMethodologyTransparency) {
  score += 10; // 方法论透明度（解释结论如何得出）
}

// 对于 Guide 类型：如果内容质量高且有风险警告，即使缺少法律页面，Trust 也应该 70-85 分
```

**分数分配**：
- **Fail**: -50 分（有 Affiliate 链接但无声明，一票否决）
- **Pass**: 0 分（无 Affiliate 链接或有声明）
- **加分项**：
  - 风险警告和局限性说明：+15 分
  - 质量控制声明：+10 分
  - 方法论透明度：+10 分
  - **最高加分**: +35 分

**重要说明**：
- 对于 Guide/Tutorial 类型，**内容层面的信任信号（风险警告、质量控制声明）比法律页面更重要**
- 一个高质量的 Guide，即使缺少 Privacy Policy/Terms，如果有强风险警告和质量控制声明，Trust 应该达到 70-85 分
- 这些信号体现了内容的诚实性和透明度，是 Google EEAT 中 Trust 的核心要素

---

### 3.6 Pro 模式：AI 根据页面类型的动态评分调整

在 Pro 模式中，AI 会根据检测到的页面类型和内容类型，动态调整打分权重和优先级。以下是不同内容类型的评分调整策略：

#### Product Review（产品评测）

**优先级调整**：
- **Experience (E)**：最重要
- **Trust (T)**：重要（特别是 Affiliate 链接披露）

**打分调整**：
- E01-E04（Narrative, Sensory, Visuals, Data Points）：**必需**，高权重
- E05（Critique）：**必需**，必须有缺点分析
- 如果缺少 E01-E04，Experience 分数会显著降低

**预期分数范围**：
- Experience: 70-90（有完整体验信号）
- Expertise: 60-80
- Authority: 50-70
- Trust: 60-80（有 Affiliate 披露）

---

#### How-to Guide / Tutorial（教程指南）

**优先级调整**：
- **Expertise (E)**：最重要
- **Organization**：重要
- **Experience (E)**：较低优先级

**打分调整**：
- **E01-E04（Narrative, Sensory, Visuals, Data Points）**：**不适用**，不扣分
- **E05（Critique）**：**重要**，应包含局限性、常见错误、风险提示
- **E03（Vocabulary Depth）**：**关键**，评估专业术语和技术语言
- **E04（Content Depth）**：**最关键**，高权重评估：
  - 框架完整性（是否覆盖所有关键方面）
  - 行业共识对齐（是否遵循最佳实践）
  - 字数（3500+ 词为优秀）
  - 外部参考质量（Moz, Ahrefs 等 Tier 2 权威来源）
- **E01（Author Identity）和 E02（Credentials）**：**低优先级**，如果内容质量高，不严重扣分

**预期分数范围**（高质量指南）：
- Experience: 60-70（不因缺少 E01-E04 扣分，因 E05 加分）
- Expertise: 85-95（框架完整性和行业对齐）
- Authority: 65-75（Tier 2 行业权威来源）
- Trust: 70-85（风险警告、质量控制声明、透明度）
  - **重要**：即使缺少 Privacy Policy/Terms，如果有强风险警告和质量控制声明，Trust 应该达到 70-85 分
  - 内容层面的信任信号（风险警告、质量控制声明）比法律页面更重要

---

#### Comparison（对比文章）

**优先级调整**：
- **Expertise (E)**：最重要
- **Organization**：重要
- **Experience (E)**：中等（识别实测信号）

**打分调整**：
- E04（Content Depth）：**关键**，必须有全面对比
- Organization 检查项：**关键**，必须有结构化对比（表格、清晰章节）
- E01-E03（Experience 检查项）：**低优先级**，但应该识别：
  - **具体实测信号**：研究周期（如 "6个月研究"）、样本规模（如 "847页"）、分阶段流程说明
  - **可复现性指标**：可下载数据、样本页、实验细节
  - **平台一手数据**：如果内容体现对平台功能的深度认知，应该给予部分 Experience 分数（5-10 分）
- **Authority**：需要识别"站内自引"问题，如果自引占比过高（>50%），应该扣分
- **Trust**：对于厂商自研报告，应该识别"利益冲突"并相应调整，但不应过度扣分
  - 如果内容有数据来源标注、时间戳、方法论说明，应该给予部分 Trust 分数
  - 法律页面（Privacy Policy/Terms）对于 Comparison 类型不是最关键的

**预期分数范围**（高质量对比文章）：
- Experience: 60-75（识别实测信号和可复现性）
- Expertise: 75-85（全面对比和结构化分析）
- Authority: 55-70（考虑自引问题，但不应过度扣分）
- Trust: 55-70（数据来源标注、时间戳、方法论说明比法律页面更重要）

---

#### News/Article（新闻/文章）

**优先级调整**：
- **Authority (A)**：最重要
- **Reliability**：重要

**打分调整**：
- A01（Citation Quality）：**关键**，必须有权威来源
- A03（Press Mentions）：**重要**
- E01-E04（Experience 检查项）：**低优先级**

---

#### Landing Page（落地页）

**优先级调整**：
- **Trust (T)**：最重要
- **Authority (A)**：重要

**打分调整**：
- T01（Legal Compliance）：**关键**
- T02（Contact Information）：**关键**
- E01-E04（Experience 检查项）：**不适用**，标记为 "not applicable"

---

### 3.7 分数范围与评级

每个维度的最终分数会被限制在 **0-100 分** 之间：

```typescript
return Math.max(0, Math.min(100, score));
```

**最终评级标准**：

| 分数范围 | 评级 | 含义 |
|---------|------|------|
| **90 - 100** | 🚀 Excellent | 优秀 |
| **75 - 89** | ✅ Good | 良好 |
| **60 - 74** | ⚠️ Medium | 中等 |
| **40 - 59** | ⚠️ Low | 较低 |
| **0 - 39** | ❌ Poor | 差 |

---

## 4. AI 提示词生成规则

### 3.1 提示词结构

1. **角色定义**：SEO 专家 + GEO 专家
2. **任务说明**：分析页面并生成检查项
3. **输入数据**：页面元数据、内容、基础评分
4. **检测框架**：完整的 EEAT 检测项清单
5. **类型判断指导**：如何判断页面类型和内容类型
6. **输出格式**：JSON 格式的检查项列表

### 3.2 输出格式要求

```json
{
  "pageType": "blog" | "landing" | "product" | "news" | "other",
  "contentType": "product-review" | "guide" | "tutorial" | "comparison" | "news" | "listicle" | "other",
  "eeatChecks": [
    {
      "dimension": "experience" | "expertise" | "authority" | "trust",
      "checkId": "E01" | "E02" | "E03" | "E04" | "E05" | "A01" | "A02" | "A03" | "A04" | "T01" | "T02" | "T03" | "T04" | "T05" | "T06",
      "checkName": "Short check name (max 50 chars)",
      "status": "pass" | "partial" | "fail",
      "message": "Brief status (max 100 chars)",
      "suggestion": "Concise suggestion (max 150 chars)",
      "priority": "high" | "medium" | "low"
    }
  ],
  "scores": {
    "experience": { "score": 0-100, "reasoning": "Brief explanation" },
    "expertise": { "score": 0-100, "reasoning": "Brief explanation" },
    "authority": { "score": 0-100, "reasoning": "Brief explanation" },
    "trust": { "score": 0-100, "reasoning": "Brief explanation" }
  }
}
```

---

## 5. 代码实现位置

### 5.1 AI 提示词生成

**文件**：`src/background/index.ts`

- `generatePrompt()` - 构建包含完整 EEAT 检测项清单的 AI Prompt
  - 包含页面类型检测和优先级调整指导（第 426-470 行）
  - 包含不同内容类型的打分调整策略
  - AI 会根据页面类型动态调整打分权重
- `analyzeWithAI()` - 处理 AI 分析请求，调用 AI API

**关键逻辑**：
- AI 首先识别页面类型和内容类型
- 根据类型调整检查项优先级和打分权重
- 返回的分数会反映这些调整（例如 Guide 类型的 Experience 分数不会因缺少第一人称叙述而降低）

### 5.2 EEAT 评分计算

**文件**：`src/lib/scoring-model.ts`

- `calculateScore()` - 主评分函数
  - **Lite 模式**：使用 `eeat-ultimate-scoring.ts` 的固定打分规则
  - **Pro 模式**：**优先使用 AI 根据页面类型动态调整的分数**（第 30-42 行）
    ```typescript
    if (tier === 'pro' && aiAnalysis?.scores) {
      finalBreakdown = {
        experience: aiAnalysis.scores.experience.score,  // AI 调整后的分数
        expertise: aiAnalysis.scores.expertise.score,
        authority: aiAnalysis.scores.authority.score,
        trust: aiAnalysis.scores.trust.score,
        // ...
      };
    }
    ```

**文件**：`src/lib/scoring/eeat-ultimate-scoring.ts`（仅用于 Lite 模式）

- `calculateExperienceUltimate()` - Experience 维度评分（固定规则）
- `calculateExpertiseUltimate()` - Expertise 维度评分（固定规则）
- `calculateAuthorityUltimate()` - Authority 维度评分（固定规则）
- `calculateTrustUltimate()` - Trust 维度评分（固定规则）

**重要说明**：
- Lite 模式使用固定的打分规则，不区分页面类型
- Pro 模式使用 AI 动态调整的分数，会根据页面类型和内容类型调整权重
- AI 的评分会参考 `eeat-ultimate-scoring.ts` 的规则，但会根据页面类型进行智能调整

### 5.3 Pro SEO 检查生成

**文件**：`src/lib/checks/seo/ProSEOChecks.ts`

- `generate()` - 生成 Pro SEO 检查项（基于 Lite + AI 分析结果）
- `convertAIEEATChecksToCheckIssues()` - 将 AI 检查项转换为 CheckIssue 格式

### 5.4 UI 显示

**文件**：`src/popup/components/ChecksPanel.tsx`

- 在 Pro 模式下显示 AI 生成的 EEAT 检查项
- 按维度分组显示（Experience、Expertise、Authority、Trust）

---

## 6. 更新记录

- **2025-12-03**: 初始版本，定义 Pro 模式的 EEAT AI 检测规则
  - 包含完整的 20 个 EEAT 检查项说明
  - 说明智能类型识别和动态检测重点
  - 定义 AI 提示词生成规则
  - 添加详细的 EEAT 评分算法规则（权重分配和加减分规则）
  - 说明评分依据和参考来源
  - 详细说明 AI 根据页面类型动态调整打分的逻辑
  - **基于行业标杆对比优化**：
    - 增强 T06（透明度）的内容层面信任信号权重（风险警告、质量控制声明）
    - 优化 Comparison 类型的 Experience 评分（识别实测信号和可复现性）
    - 优化 Authority 评分（识别站内自引和不可访问链接）
    - 调整 Trust 评分权重（内容透明度 > 法律页面，特别是对于 Guide/Comparison 类型）
