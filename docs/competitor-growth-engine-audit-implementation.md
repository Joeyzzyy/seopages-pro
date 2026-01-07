# Competitor Growth Engine Audit - 后端实现说明文档

## 🎯 功能概述
通过Semrush Standard API深度分析竞争对手的SEO增长引擎，识别流量激增/下降的根因，发现可复制的增长策略。

## 🏗️ 系统架构设计

### 1. 数据流架构
```
用户输入 → 参数验证 → 并行API调用 → 数据聚合 → 根因分析 → 报告生成 → 多格式输出
```

### 2. 核心模块划分
- **数据获取层**: Semrush API调用
- **分析引擎**: 趋势检测与根因推断
- **报告生成器**: Markdown/HTML/DOCX
- **缓存系统**: 减少API调用成本

## 📋 详细实现步骤

### 步骤1: 输入参数处理
```typescript
interface AuditParams {
  competitor_domains: string[];  // 必填，最多5个域名
  my_domain?: string;           // 选填，用于差距分析
  country: string;              // 必填，地区代码(us/uk/de等)
  report_language: 'zh' | 'en'; // 必填，报告语言
}
```

**参数验证规则**:
- 域名格式验证: `^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$`
- 去重处理: 移除重复域名
- 数量限制: 最多5个竞争对手

### 步骤2: 批量域名概览分析
**API调用**: `get_domain_overview_batch`
```typescript
const batchParams = {
  domains: competitor_domains,
  database: country,
  display_date: 'latest'
}
```

**数据处理逻辑**:
1. **SEO vs PPC 分析公式**:
   ```
   seo_ratio = organic_traffic / (organic_traffic + paid_traffic)
   如果 seo_ratio > 0.7 → "SEO主导"
   如果 seo_ratio < 0.3 → "PPC主导"
   否则 → "混合策略"
   ```

2. **Top 3 选择算法**:
   ```typescript
   const top3 = domains
     .sort((a, b) => b.organic_traffic - a.organic_traffic)
     .slice(0, 3);
   ```

### 步骤3: 历史趋势分析（关键步骤）
**API调用**: `get_domain_history`
```typescript
const historyParams = {
  domain: domain,
  database: country,
  display_date: 'latest',
  months: 6
}
```

**趋势检测算法**:
1. **波动检测阈值**:
   - 激增: MoM增长 > 20%
   - 下降: MoM下降 > 15%
   - 关键词变化: ±10%

2. **根因标记系统**:
   ```typescript
   interface FluctuationEvent {
     month: string;
     change_percentage: number;
     traffic_before: number;
     traffic_after: number;
     keywords_before: number;
     keywords_after: number;
     requires_investigation: boolean;
     investigation_tasks: string[];
     root_cause?: 'content_launch' | 'algorithm_update' | 'backlink_spike' | 'ranking_change' | 'seasonality';
     evidence_urls?: string[];
     evidence_keywords?: string[];
   }
   ```

### 步骤4: 根因调查引擎（核心创新）
**当检测到波动时启动**：

#### 4.1 页面级分析
**API调用**: `get_domain_organic_pages`
```typescript
const pagesParams = {
  domain: domain,
  database: country,
  limit: 20,
  display_date: 'latest'
}
```

**PSEO模式检测**:
```typescript
function detectPSEOPattern(urls: string[]): PSEOPattern {
  const patterns = {
    programmatic: /\/(tool|calculator|template|generator)\//,
    blog_cluster: /\/blog\/.*-/,
    location_pages: /\/(locations?|cities)\//,
    comparison_pages: /\/vs-|\/alternatives\//
  };
  
  return {
    type: detectMostCommonPattern(urls, patterns),
    confidence: calculatePatternConfidence(urls, patterns),
    example_urls: getRepresentativeUrls(urls, patterns)
  };
}
```

#### 4.2 外部事件调查
**API调用**: `web_search`
```typescript
const searchQueries = [
  `${competitor_name} ${month} ${year} launch`,
  `${competitor_name} new feature ${year}`,
  `Google algorithm update ${month} ${year}`,
  `${industry_keyword} market trends ${year}`
];
```

#### 4.3 根因决策树
```typescript
function determineRootCause(evidence: InvestigationEvidence): RootCause {
  if (evidence.newPages.length > 10) {
    return {
      category: 'content_launch',
      confidence: 'high',
      details: `新增${evidence.newPages.length}个页面`,
      evidence_urls: evidence.newPages.slice(0, 5)
    };
  }
  
  if (evidence.algorithmUpdate) {
    return {
      category: 'algorithm_update',
      confidence: 'medium',
      details: evidence.algorithmUpdate.description,
      evidence_urls: [evidence.algorithmUpdate.source]
    };
  }
  
  // 更多决策规则...
}
```

### 步骤5: 关键词策略分析
**API调用**: `get_domain_organic_keywords`
```typescript
const keywordsParams = {
  domain: domain,
  database: country,
  limit: 20,
  display_date: 'latest'
}
```

**关键词分类算法**:
```typescript
function classifyKeywords(keywords: Keyword[]): KeywordAnalysis {
  const branded = keywords.filter(k => k.keyword.includes(brand_name));
  const commercial = keywords.filter(k => isCommercialIntent(k.keyword));
  const informational = keywords.filter(k => isInformationalIntent(k.keyword));
  
  return {
    branded_ratio: branded.length / keywords.length,
    commercial_ratio: commercial.length / keywords.length,
    informational_ratio: informational.length / keywords.length,
    avg_keyword_difficulty: calculateAvgDifficulty(keywords),
    traffic_concentration: calculateTrafficConcentration(keywords)
  };
}
```

### 步骤6: 外链档案分析
**API调用**: `get_backlink_overview`
```typescript
const backlinkParams = {
  domains: [domain],
  display_date: 'latest'
}
```

**权威度评估**:
```typescript
function assessAuthority(backlinks: BacklinkData): AuthorityScore {
  return {
    score: backlinks.authority_score,
    level: categorizeAuthority(backlinks.authority_score),
    referring_domains: backlinks.referring_domains,
    risk_assessment: assessLinkRisk(backlinks)
  };
}
```

### 步骤7: 差距分析（可选）
**仅当用户提供自身域名时**:
**API调用**: `domain_gap_analysis`
```typescript
const gapParams = {
  domains: [my_domain, ...competitor_domains],
  database: country,
  limit: 20,
  min_volume: 100,
  max_difficulty: 60
}
```

### 步骤8: 报告生成系统

#### 8.1 数据结构设计
```typescript
interface CompetitorAuditReport {
  metadata: {
    analysis_date: string;
    target_market: string;
    domains_analyzed: string[];
    data_sources: string[];
  };
  
  executive_summary: {
    top_performer: string;
    winning_strategy: string;
    market_insights: string[];
  };
  
  seo_overview: {
    domains: DomainOverview[];
    market_benchmarks: MarketBenchmarks;
  };
  
  fluctuation_analysis: {
    [domain: string]: FluctuationTimeline[];
  };
  
  keyword_insights: {
    [domain: string]: KeywordStrategy;
  };
  
  backlink_profiles: {
    [domain: string]: BacklinkAnalysis;
  };
  
  recommendations: StrategyRecommendation[];
}
```

#### 8.2 报告模板系统
**Markdown模板引擎**:
```typescript
const reportTemplate = `
# Competitor SEO Growth Engine Audit Report

## Executive Summary
${executiveSummary}

## SEO vs PPC Overview (${market})
${generateSEOPPCOverview(domains)}

## 📊 Deep Traffic Fluctuation Analysis (${market})
${generateFluctuationAnalysis(fluctuations)}

## Strategic Insights
${generateStrategicInsights(insights)}

## Recommendations
${generateRecommendations(recommendations)}
`;
```

#### 8.3 多格式输出
1. **HTML报告**: 使用Chart.js生成交互式图表
2. **DOCX报告**: 标准Word文档格式
3. **数据导出**: CSV格式的原始数据

### 步骤9: 缓存和成本优化

#### 9.1 智能缓存策略
```typescript
interface CacheConfig {
  domain_overview: '1d',      // 域名概览缓存1天
  keywords: '3d',             // 关键词数据缓存3天
  history: '7d',              // 历史数据缓存7天
  backlink: '1d'              // 外链数据缓存1天
}
```

#### 9.2 API成本控制
```typescript
const costLimits = {
  max_competitors: 5,
  max_keywords_per_domain: 20,
  max_pages_per_domain: 20,
  max_history_months: 12,
  estimated_total_cost: 150  // API单位
};
```

### 步骤10: 错误处理和降级策略

#### 10.1 数据可用性处理
```typescript
function handleDataAvailability(domain: string, data: any): AnalysisStatus {
  if (!data.organic_traffic) {
    return {
      status: 'insufficient_data',
      message: `${domain}数据不足，可能为新站点或非主要市场`,
      fallback_analysis: '基于公开信息推断'
    };
  }
  
  if (data.organic_traffic < 1000) {
    return {
      status: 'low_traffic',
      message: `${domain}流量较低，分析受限`,
      confidence: 'low'
    };
  }
  
  return { status: 'complete', confidence: 'high' };
}
```

#### 10.2 降级分析策略
当API不可用时：
1. 使用缓存数据
2. 基于公开信息推断
3. 提供数据收集建议

## 🚀 后端实现要点

### 1. 并发处理
```typescript
// 并行处理所有域名
const results = await Promise.allSettled([
  batchDomainOverview(domains),
  ...domains.map(domain => analyzeSingleDomain(domain))
]);
```

### 2. 错误边界
```typescript
class AuditErrorHandler {
  async executeWithFallback<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      logger.error('Audit operation failed', error);
      return fallback;
    }
  }
}
```

### 3. 性能监控
```typescript
interface PerformanceMetrics {
  api_calls: number;
  total_cost: number;
  processing_time: number;
  cache_hit_rate: number;
  success_rate: number;
}
```

## 📊 输出格式规范

### 标准报告结构
1. **执行摘要** (2-3句)
2. **SEO vs PPC对比表**
3. **流量波动根因分析** (核心)
4. **关键词策略洞察**
5. **外链档案评估**
6. **可执行建议**

### 数据质量保证
- 所有数值包含单位
- 时间序列数据完整
- 根因分析有证据支撑
- 建议具体可执行

## 🔧 技术实现检查清单

### 核心功能验证
- [ ] 参数验证和清洗
- [ ] 并发API调用处理
- [ ] 波动检测算法
- [ ] 根因调查引擎
- [ ] 多格式报告生成
- [ ] 缓存机制
- [ ] 错误处理
- [ ] 性能监控

### 数据质量验证
- [ ] 数值单位标准化
- [ ] 时间格式统一
- [ ] 证据链完整性
- [ ] 建议可操作性

### 用户体验优化
- [ ] 加载状态提示
- [ ] 错误友好提示
- [ ] 进度可视化
- [ ] 结果缓存复用

---

**文档版本**: v2.0.0  
**最后更新**: 2026-01-07  
**适用项目**: Mini Seenos Competitor Growth Engine Audit