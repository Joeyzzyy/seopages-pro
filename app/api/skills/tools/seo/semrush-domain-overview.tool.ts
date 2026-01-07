import { tool } from 'ai';
import { z } from 'zod';

/**
 * Semrush Domain Overview (Standard API)
 * 获取域名的 SEO/PPC 流量估算 - 使用 Standard API，不需要 Trends API 权限
 * 
 * 端点: https://api.semrush.com/?type=domain_ranks
 * 
 * 这是 Trends API 的备选方案，当 Trends API 不可用时使用
 */
export const get_domain_overview = tool({
  description: 'Get domain SEO metrics: organic traffic, paid traffic, organic keywords count, backlinks. Uses Standard API (no Trends subscription required). Good for estimating SEO vs PPC traffic split.',
  parameters: z.object({
    domain: z.string().describe('The domain to analyze (e.g., example.com)'),
    database: z.string().optional().default('us').describe('Regional database (e.g., us, uk, ca, de)'),
  }),
  execute: async ({ domain, database }) => {
    console.log(`[get_domain_overview] Analyzing domain: ${domain}, database: ${database}`);
    
    try {
      const apiKey = process.env.SEMRUSH_API_KEY;
      if (!apiKey) {
        throw new Error('SEMRUSH_API_KEY is not configured');
      }

      // Domain Ranks API - Standard API
      // 文档: https://developer.semrush.com/api/v3/analytics/overview-reports/domain-overview-one-database/
      const url = `https://api.semrush.com/?type=domain_ranks&key=${apiKey}&domain=${encodeURIComponent(domain)}&database=${database}&export_columns=Dn,Rk,Or,Ot,Oc,Ad,At,Ac`;

      console.log(`[get_domain_overview] Calling: ${url.replace(apiKey, 'KEY_HIDDEN')}`);

      const response = await fetch(url);
      const text = await response.text();
      console.log(`[get_domain_overview] Response:`, text.substring(0, 500));

      if (text.startsWith('ERROR')) {
        if (text.includes('NOTHING FOUND') || text.includes('ERROR 50')) {
          return {
            success: true,
            no_data: true,
            message: `No data found for domain "${domain}" in ${database} database.`,
            domain,
            database
          };
        }
        throw new Error(`Semrush API Error: ${text}`);
      }

      const lines = text.trim().split('\n');
      if (lines.length < 2) {
        return {
          success: true,
          no_data: true,
          message: `No data available for domain "${domain}".`,
          domain,
          database
        };
      }

      // 解析: Domain;Rank;Organic Keywords;Organic Traffic;Organic Cost;Paid Keywords;Paid Traffic;Paid Cost
      const values = lines[1].split(';');
      const organicTraffic = parseInt(values[3]) || 0;
      const paidTraffic = parseInt(values[5]) || 0;
      const totalEstimatedTraffic = organicTraffic + paidTraffic;

      const result = {
        success: true,
        domain: values[0],
        database,
        semrush_rank: parseInt(values[1]) || 0,
        // Organic (SEO) metrics
        organic: {
          keywords: parseInt(values[2]) || 0,
          traffic: organicTraffic,
          traffic_cost: parseFloat(values[4]) || 0,
        },
        // Paid (PPC) metrics  
        paid: {
          keywords: parseInt(values[5]) || 0,
          traffic: paidTraffic,
          traffic_cost: parseFloat(values[7]) || 0,
        },
        // Traffic split analysis
        traffic_split: {
          total_estimated: totalEstimatedTraffic,
          organic_share: totalEstimatedTraffic > 0 
            ? ((organicTraffic / totalEstimatedTraffic) * 100).toFixed(1) + '%'
            : 'N/A',
          paid_share: totalEstimatedTraffic > 0
            ? ((paidTraffic / totalEstimatedTraffic) * 100).toFixed(1) + '%'
            : 'N/A',
          is_seo_dominant: organicTraffic > paidTraffic,
          organic_vs_paid_ratio: paidTraffic > 0
            ? (organicTraffic / paidTraffic).toFixed(2)
            : organicTraffic > 0 ? 'Infinite (no paid)' : 'N/A',
        },
        note: 'This data is from Semrush Standard API (Domain Overview). For more accurate traffic source breakdown (Direct, Social, Referral), Trends API subscription is required.'
      };

      console.log(`[get_domain_overview] Successfully analyzed ${domain}:`, {
        organic_traffic: organicTraffic,
        paid_traffic: paidTraffic,
        organic_share: result.traffic_split.organic_share
      });

      return result;
    } catch (error: any) {
      console.error(`[get_domain_overview] ERROR:`, error.message);
      return {
        success: false,
        error: error.message,
        domain,
        database
      };
    }
  },
});

(get_domain_overview as any).metadata = {
  name: 'Domain Overview',
  provider: 'Semrush Standard'
};


/**
 * Batch Domain Overview - 批量获取多个域名的 SEO/PPC 数据
 */
export const get_domain_overview_batch = tool({
  description: 'Get SEO/PPC traffic estimates for multiple domains. Uses Standard API. Returns organic vs paid traffic split for each domain, sorted by organic traffic.',
  parameters: z.object({
    domains: z.array(z.string()).describe('List of domains to analyze (max 10)'),
    database: z.string().optional().default('us').describe('Regional database'),
  }),
  execute: async ({ domains, database }) => {
    console.log(`[get_domain_overview_batch] Analyzing ${domains.length} domains`);
    
    try {
      const apiKey = process.env.SEMRUSH_API_KEY;
      if (!apiKey) {
        throw new Error('SEMRUSH_API_KEY is not configured');
      }

      const domainList = domains.slice(0, 10);
      
      const results = await Promise.all(
        domainList.map(async (domain) => {
          try {
            const url = `https://api.semrush.com/?type=domain_ranks&key=${apiKey}&domain=${encodeURIComponent(domain)}&database=${database}&export_columns=Dn,Rk,Or,Ot,Oc,Ad,At,Ac`;

            const response = await fetch(url);
            const text = await response.text();

            if (text.startsWith('ERROR') || !response.ok) {
              return { domain, success: false, error: text };
            }

            const lines = text.trim().split('\n');
            if (lines.length < 2) {
              return { domain, success: true, no_data: true };
            }

            const values = lines[1].split(';');
            const organicTraffic = parseInt(values[3]) || 0;
            const paidTraffic = parseInt(values[5]) || 0;
            const total = organicTraffic + paidTraffic;

            return {
              domain,
              success: true,
              semrush_rank: parseInt(values[1]) || 0,
              organic_keywords: parseInt(values[2]) || 0,
              organic_traffic: organicTraffic,
              paid_traffic: paidTraffic,
              total_traffic: total,
              organic_share: total > 0 ? ((organicTraffic / total) * 100).toFixed(1) : '0',
              is_seo_dominant: organicTraffic > paidTraffic,
            };
          } catch (err: any) {
            return { domain, success: false, error: err.message };
          }
        })
      );

      // Sort by organic traffic descending
      const validResults = results
        .filter((r): r is typeof r & { organic_traffic: number } => r.success && !('no_data' in r))
        .sort((a, b) => (b.organic_traffic || 0) - (a.organic_traffic || 0));

      const topSeoPerformers = validResults.slice(0, 3).map(r => ({
        domain: r.domain,
        organic_traffic: r.organic_traffic,
        organic_share: r.organic_share + '%',
        is_seo_dominant: r.is_seo_dominant,
      }));

      console.log(`[get_domain_overview_batch] Completed. Top SEO performers:`, topSeoPerformers);

      return {
        success: true,
        database,
        total_domains: domainList.length,
        successful_queries: validResults.length,
        results,
        top_seo_performers: topSeoPerformers,
        summary: {
          avg_organic_traffic: validResults.length > 0
            ? Math.round(validResults.reduce((sum, r) => sum + r.organic_traffic, 0) / validResults.length)
            : 0,
          domains_seo_dominant: validResults.filter(r => r.is_seo_dominant).length,
        },
        note: 'This analysis uses Semrush Standard API. For complete traffic source breakdown (Direct, Social, Referral), Trends API is required.'
      };
    } catch (error: any) {
      console.error(`[get_domain_overview_batch] ERROR:`, error.message);
      return {
        success: false,
        error: error.message,
        domains
      };
    }
  },
});

(get_domain_overview_batch as any).metadata = {
  name: 'Batch Domain Overview',
  provider: 'Semrush Standard'
};


/**
 * Domain Organic Keywords - 获取域名的有机关键词列表
 * 
 * ⚠️ 成本警告: 按返回行数计费！
 * 默认只返回 20 行以控制成本
 * 最大限制 50 行以防止意外超支
 */
export const get_domain_organic_keywords = tool({
  description: 'Get top organic keywords for a domain. ⚠️ Cost: ~1 unit per row. Default 20 keywords. Shows what keywords drive organic traffic.',
  parameters: z.object({
    domain: z.string().describe('The domain to analyze'),
    database: z.string().optional().default('us').describe('Regional database'),
    limit: z.number().optional().default(20).describe('Number of keywords to return. Default 20 (costs ~20 units). Max 50 to prevent overspending.'),
  }),
  execute: async ({ domain, database, limit }) => {
    // ⚠️ 严格限制行数以控制成本
    const safeLimit = Math.min(limit || 20, 50);
    console.log(`[get_domain_organic_keywords] Getting top ${safeLimit} keywords for: ${domain} (cost: ~${safeLimit} units)`);
    
    try {
      const apiKey = process.env.SEMRUSH_API_KEY;
      if (!apiKey) {
        throw new Error('SEMRUSH_API_KEY is not configured');
      }

      // Domain Organic Search Keywords API
      // ⚠️ 成本: 每行约 1 unit
      const url = `https://api.semrush.com/?type=domain_organic&key=${apiKey}&domain=${encodeURIComponent(domain)}&database=${database}&display_limit=${safeLimit}&export_columns=Ph,Po,Nq,Cp,Ur,Tr,Tc,Kd&display_sort=tr_desc`;

      console.log(`[get_domain_organic_keywords] Calling: ${url.replace(apiKey, 'KEY_HIDDEN')}`);

      const response = await fetch(url);
      const text = await response.text();

      if (text.startsWith('ERROR')) {
        if (text.includes('NOTHING FOUND') || text.includes('ERROR 50')) {
          return {
            success: true,
            no_data: true,
            message: `No organic keywords found for "${domain}".`,
            domain,
            database
          };
        }
        throw new Error(`Semrush API Error: ${text}`);
      }

      const lines = text.trim().split('\n');
      if (lines.length < 2) {
        return {
          success: true,
          no_data: true,
          message: `No organic keywords found for "${domain}".`,
          domain,
          database,
          keywords: []
        };
      }

      // 解析: Keyword;Position;Search Volume;CPC;URL;Traffic %;Traffic Cost;Keyword Difficulty
      const keywords = lines.slice(1).map(line => {
        const values = line.split(';');
        return {
          keyword: values[0],
          position: parseInt(values[1]) || 0,
          search_volume: parseInt(values[2]) || 0,
          cpc: parseFloat(values[3]) || 0,
          url: values[4],
          traffic_percent: parseFloat(values[5]) || 0,
          traffic_cost: parseFloat(values[6]) || 0,
          difficulty: parseInt(values[7]) || 0,
        };
      });

      // Calculate top traffic drivers
      const topTrafficDrivers = keywords
        .slice(0, 5)
        .map(k => `"${k.keyword}" (${k.traffic_percent.toFixed(1)}% traffic, pos #${k.position})`);

      return {
        success: true,
        domain,
        database,
        total_keywords: keywords.length,
        keywords,
        insights: {
          top_traffic_drivers: topTrafficDrivers,
          avg_position: keywords.length > 0
            ? (keywords.reduce((sum, k) => sum + k.position, 0) / keywords.length).toFixed(1)
            : 'N/A',
          total_traffic_share: keywords.reduce((sum, k) => sum + k.traffic_percent, 0).toFixed(1) + '%',
        }
      };
    } catch (error: any) {
      console.error(`[get_domain_organic_keywords] ERROR:`, error.message);
      return {
        success: false,
        error: error.message,
        domain,
        database
      };
    }
  },
});

(get_domain_organic_keywords as any).metadata = {
  name: 'Domain Organic Keywords',
  provider: 'Semrush Standard'
};


/**
 * Semrush Domain Overview History
 * 获取域名的历史有机流量数据（过去 6 个月）
 * 
 * 端点: type=domain_rank_history
 * 
 * ⚠️ 成本: 约 1 unit per month of data (6 months = ~6 units)
 * 默认限制为 6 个月以控制成本
 */
export const get_domain_history = tool({
  description: 'Get historical organic traffic data for a domain over the past 6 months. Cost: ~6 API units. Essential for identifying traffic growth or decline trends.',
  parameters: z.object({
    domain: z.string().describe('The domain to analyze (e.g., example.com)'),
    database: z.string().optional().default('us').describe('Regional database (e.g., us, uk)'),
    months: z.number().optional().default(6).describe('Number of months to fetch. Default 6, max 12. Each month costs ~1 unit.'),
  }),
  execute: async ({ domain, database, months }) => {
    // 严格限制月数以控制成本
    const safeMonths = Math.min(months || 6, 12);
    console.log(`[get_domain_history] Getting ${safeMonths} months of data for: ${domain}`);
    
    try {
      const apiKey = process.env.SEMRUSH_API_KEY;
      if (!apiKey) {
        throw new Error('SEMRUSH_API_KEY is not configured');
      }

      // Domain Rank History API
      // 文档: https://developer.semrush.com/api/v3/analytics/overview-reports/domain-overview-history/
      // ⚠️ 成本: ~1 unit per row (month)
      const url = `https://api.semrush.com/?type=domain_rank_history&key=${apiKey}&domain=${encodeURIComponent(domain)}&database=${database}&display_limit=${safeMonths}&export_columns=Dt,Rk,Or,Ot,Oc,Ad,At`;

      console.log(`[get_domain_history] Calling: ${url.replace(apiKey, 'KEY_HIDDEN')}`);

      const response = await fetch(url);
      const text = await response.text();
      console.log(`[get_domain_history] Response:`, text.substring(0, 500));

      if (text.startsWith('ERROR')) {
        if (text.includes('NOTHING FOUND') || text.includes('ERROR 50')) {
          return {
            success: true,
            no_data: true,
            message: `No historical data found for "${domain}".`,
            domain,
            database,
            history: []
          };
        }
        throw new Error(`Semrush API Error: ${text}`);
      }

      const lines = text.trim().split('\n');
      if (lines.length < 2) {
        return {
          success: true,
          no_data: true,
          message: `No historical data available for "${domain}".`,
          domain,
          database,
          history: []
        };
      }

      // 解析: Date;Rank;Organic Keywords;Organic Traffic;Organic Cost;Paid Keywords;Paid Traffic
      const history = lines.slice(1).map(line => {
        const values = line.split(';');
        return {
          date: values[0], // Format: YYYYMM15
          semrush_rank: parseInt(values[1]) || 0,
          organic_keywords: parseInt(values[2]) || 0,
          organic_traffic: parseInt(values[3]) || 0,
          organic_cost: parseFloat(values[4]) || 0,
          paid_keywords: parseInt(values[5]) || 0,
          paid_traffic: parseInt(values[6]) || 0,
        };
      }).sort((a, b) => a.date.localeCompare(b.date)); // Sort by date ascending

      if (history.length < 2) {
        return {
          success: true,
          domain,
          database,
          history,
          trend_analysis: null,
          message: 'Not enough historical data for trend analysis'
        };
      }

      // 计算趋势分析
      const firstMonth = history[0];
      const lastMonth = history[history.length - 1];
      const midIndex = Math.floor(history.length / 2);
      const midMonth = history[midIndex];

      // 增长率计算
      const totalGrowth = firstMonth.organic_traffic > 0
        ? ((lastMonth.organic_traffic - firstMonth.organic_traffic) / firstMonth.organic_traffic * 100)
        : 0;
      
      const recentGrowth = midMonth.organic_traffic > 0
        ? ((lastMonth.organic_traffic - midMonth.organic_traffic) / midMonth.organic_traffic * 100)
        : 0;

      // 检测流量激增月份
      const avgTraffic = history.reduce((sum, h) => sum + h.organic_traffic, 0) / history.length;
      const spikes = history.filter(h => h.organic_traffic > avgTraffic * 1.5);
      const drops = history.filter(h => h.organic_traffic < avgTraffic * 0.5);

      // 找出最大增长月份
      let maxGrowthMonth = null;
      let maxGrowthPercent = 0;
      for (let i = 1; i < history.length; i++) {
        const prevTraffic = history[i - 1].organic_traffic;
        const currTraffic = history[i].organic_traffic;
        if (prevTraffic > 0) {
          const growth = ((currTraffic - prevTraffic) / prevTraffic) * 100;
          if (growth > maxGrowthPercent) {
            maxGrowthPercent = growth;
            maxGrowthMonth = {
              date: history[i].date,
              from: prevTraffic,
              to: currTraffic,
              growth_percent: growth.toFixed(1)
            };
          }
        }
      }

      const result = {
        success: true,
        domain,
        database,
        period: {
          start: firstMonth.date,
          end: lastMonth.date,
          months: history.length
        },
        history,
        trend_analysis: {
          start_traffic: firstMonth.organic_traffic,
          end_traffic: lastMonth.organic_traffic,
          total_growth_percent: totalGrowth.toFixed(1),
          recent_growth_percent: recentGrowth.toFixed(1),
          trend_direction: totalGrowth > 15 ? 'growing' 
            : totalGrowth < -15 ? 'declining' 
            : 'stable',
          avg_monthly_traffic: Math.round(avgTraffic),
          // 流量激增分析
          spike_detected: spikes.length > 0,
          spike_months: spikes.map(s => ({
            date: s.date,
            traffic: s.organic_traffic,
            vs_average: ((s.organic_traffic / avgTraffic - 1) * 100).toFixed(1) + '%'
          })),
          // 流量下降分析
          drop_detected: drops.length > 0,
          drop_months: drops.map(d => ({
            date: d.date,
            traffic: d.organic_traffic,
            vs_average: ((d.organic_traffic / avgTraffic - 1) * 100).toFixed(1) + '%'
          })),
          // 最大增长月份
          biggest_growth_month: maxGrowthMonth,
          // 关键词变化
          keyword_growth: lastMonth.organic_keywords - firstMonth.organic_keywords,
          keyword_growth_percent: firstMonth.organic_keywords > 0
            ? ((lastMonth.organic_keywords - firstMonth.organic_keywords) / firstMonth.organic_keywords * 100).toFixed(1)
            : 'N/A'
        }
      };

      console.log(`[get_domain_history] Trend: ${result.trend_analysis.trend_direction}, Growth: ${totalGrowth.toFixed(1)}%`);

      return result;
    } catch (error: any) {
      console.error(`[get_domain_history] ERROR:`, error.message);
      return {
        success: false,
        error: error.message,
        domain,
        database
      };
    }
  },
});

(get_domain_history as any).metadata = {
  name: 'Domain History',
  provider: 'Semrush Standard'
};


/**
 * Semrush Domain Organic Pages
 * 获取域名的有机流量页面列表
 * 
 * 使用 domain_organic 端点获取关键词数据，然后按 URL 聚合
 * 这样可以得到该域名自己的页面，而不是竞争对手域名
 * 
 * ⚠️ 成本警告: 按返回行数计费！
 * 默认只返回 50 行关键词以控制成本（约 50 units）
 * 然后按 URL 聚合得到页面列表
 */
export const get_domain_organic_pages = tool({
  description: 'Get top organic pages for a domain by aggregating keyword data. ⚠️ Cost: ~50 units. Shows which URLs drive the most traffic based on keyword rankings.',
  parameters: z.object({
    domain: z.string().describe('The domain to analyze'),
    database: z.string().optional().default('us').describe('Regional database'),
    limit: z.number().optional().default(50).describe('Number of keywords to fetch for aggregation. Default 50 (costs ~50 units). More keywords = more accurate page data.'),
  }),
  execute: async ({ domain, database, limit }) => {
    // ⚠️ 严格限制行数以控制成本
    const safeLimit = Math.min(limit || 50, 100);
    console.log(`[get_domain_organic_pages] Getting organic pages for: ${domain} via keyword aggregation (fetching ${safeLimit} keywords)`);
    
    try {
      const apiKey = process.env.SEMRUSH_API_KEY;
      if (!apiKey) {
        throw new Error('SEMRUSH_API_KEY is not configured');
      }

      // 使用 domain_organic 端点获取关键词数据（包含 URL）
      // 然后按 URL 聚合来得到页面列表
      // 这样可以得到域名自己的页面，而不是竞争对手
      const url = `https://api.semrush.com/?type=domain_organic&key=${apiKey}&domain=${encodeURIComponent(domain)}&database=${database}&display_limit=${safeLimit}&export_columns=Ph,Po,Nq,Cp,Ur,Tr,Tc,Kd&display_sort=tr_desc`;

      console.log(`[get_domain_organic_pages] Calling: ${url.replace(apiKey, 'KEY_HIDDEN')}`);

      const response = await fetch(url);
      const text = await response.text();
      console.log(`[get_domain_organic_pages] Response:`, text.substring(0, 500));

      if (text.startsWith('ERROR')) {
        if (text.includes('NOTHING FOUND') || text.includes('ERROR 50')) {
          return {
            success: true,
            no_data: true,
            message: `No organic pages found for "${domain}".`,
            domain,
            database,
            pages: []
          };
        }
        throw new Error(`Semrush API Error: ${text}`);
      }

      const lines = text.trim().split('\n');
      if (lines.length < 2) {
        return {
          success: true,
          no_data: true,
          message: `No organic pages found for "${domain}".`,
          domain,
          database,
          pages: []
        };
      }

      // 解析关键词数据: Keyword;Position;Search Volume;CPC;URL;Traffic %;Traffic Cost;Keyword Difficulty
      const keywords = lines.slice(1).map(line => {
        const values = line.split(';');
        return {
          keyword: values[0],
          position: parseInt(values[1]) || 0,
          search_volume: parseInt(values[2]) || 0,
          cpc: parseFloat(values[3]) || 0,
          url: values[4],
          traffic_percent: parseFloat(values[5]) || 0,
          traffic_cost: parseFloat(values[6]) || 0,
          difficulty: parseInt(values[7]) || 0,
        };
      });

      // 按 URL 聚合关键词数据
      const pageMap: Record<string, {
        url: string;
        keywords: number;
        total_traffic_percent: number;
        total_traffic_cost: number;
        top_keywords: string[];
        avg_position: number;
        positions: number[];
      }> = {};

      keywords.forEach(kw => {
        if (!kw.url) return;
        
        // 提取相对路径（去掉域名部分）
        let pagePath = kw.url;
        try {
          if (kw.url.startsWith('http')) {
            pagePath = new URL(kw.url).pathname;
          } else if (!kw.url.startsWith('/')) {
            // URL like "example.com/page" - extract path
            const parts = kw.url.split('/');
            pagePath = '/' + parts.slice(1).join('/');
          }
        } catch {
          // Keep original if parsing fails
        }

        if (!pageMap[pagePath]) {
          pageMap[pagePath] = {
            url: pagePath,
            keywords: 0,
            total_traffic_percent: 0,
            total_traffic_cost: 0,
            top_keywords: [],
            avg_position: 0,
            positions: [],
          };
        }

        pageMap[pagePath].keywords++;
        pageMap[pagePath].total_traffic_percent += kw.traffic_percent;
        pageMap[pagePath].total_traffic_cost += kw.traffic_cost;
        pageMap[pagePath].positions.push(kw.position);
        
        if (pageMap[pagePath].top_keywords.length < 3) {
          pageMap[pagePath].top_keywords.push(kw.keyword);
        }
      });

      // 计算平均排名并转换为数组
      const pages = Object.values(pageMap).map(p => ({
        url: p.url,
        keywords: p.keywords,
        traffic_percent: parseFloat(p.total_traffic_percent.toFixed(2)),
        traffic_cost: parseFloat(p.total_traffic_cost.toFixed(2)),
        avg_position: parseFloat((p.positions.reduce((a, b) => a + b, 0) / p.positions.length).toFixed(1)),
        top_keywords: p.top_keywords,
      })).sort((a, b) => b.traffic_percent - a.traffic_percent);

      // 分析页面类型
      const pageTypes = {
        blog: pages.filter(p => p.url.includes('/blog') || p.url.includes('/article') || p.url.includes('/post')).length,
        product: pages.filter(p => p.url.includes('/product') || p.url.includes('/pricing') || p.url.includes('/features')).length,
        landing: pages.filter(p => p.url.split('/').length <= 3 && !p.url.includes('/blog')).length,
        tool: pages.filter(p => p.url.includes('/tool') || p.url.includes('/free') || p.url.includes('/generator') || p.url.includes('/writing-tools')).length,
      };

      // 识别 PSEO 模式（大量相似 URL 结构）
      const urlPatterns: Record<string, number> = {};
      pages.forEach(p => {
        const urlParts = p.url.split('/').filter(Boolean);
        if (urlParts.length >= 2) {
          const pattern = `/${urlParts[0]}/*`;
          urlPatterns[pattern] = (urlPatterns[pattern] || 0) + 1;
        }
      });

      const pseoPatterns = Object.entries(urlPatterns)
        .filter(([_, count]) => count >= 3)
        .map(([pattern, count]) => ({ pattern, count }))
        .sort((a, b) => b.count - a.count);

      const totalTrafficPercent = pages.reduce((sum, p) => sum + p.traffic_percent, 0);
      const top10TrafficPercent = pages.slice(0, 10).reduce((sum, p) => sum + p.traffic_percent, 0);

      return {
        success: true,
        domain,
        database,
        total_pages: pages.length,
        total_keywords_analyzed: keywords.length,
        pages: pages.slice(0, 20), // Return top 20 pages
        analysis: {
          top_10_traffic_share: totalTrafficPercent > 0 ? ((top10TrafficPercent / totalTrafficPercent) * 100).toFixed(1) + '%' : 'N/A',
          page_type_distribution: pageTypes,
          // PSEO 检测
          pseo_detected: pseoPatterns.length > 0,
          pseo_patterns: pseoPatterns.slice(0, 5),
          // 流量集中度
          traffic_concentration: top10TrafficPercent > totalTrafficPercent * 0.8 
            ? 'highly_concentrated' 
            : top10TrafficPercent > totalTrafficPercent * 0.5 
              ? 'moderately_concentrated' 
              : 'diversified',
        },
        insights: {
          top_traffic_pages: pages.slice(0, 5).map(p => `${p.url} (${p.traffic_percent}% traffic, ${p.keywords} keywords, avg pos #${p.avg_position})`),
          content_strategy: pseoPatterns.length > 0 
            ? `Detected PSEO pattern: ${pseoPatterns[0].pattern} with ${pseoPatterns[0].count} pages`
            : pageTypes.blog > pageTypes.product
              ? 'Content marketing focused'
              : pageTypes.tool > 0
                ? 'Free tool strategy detected'
                : 'Product/landing page focused',
        },
        note: 'Pages aggregated from keyword ranking data. Traffic % is the sum of individual keyword traffic shares.'
      };
    } catch (error: any) {
      console.error(`[get_domain_organic_pages] ERROR:`, error.message);
      return {
        success: false,
        error: error.message,
        domain,
        database
      };
    }
  },
});

(get_domain_organic_pages as any).metadata = {
  name: 'Domain Organic Pages',
  provider: 'Semrush Standard'
};

