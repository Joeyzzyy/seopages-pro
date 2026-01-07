import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Markdown to HTML Report Tool
 * 
 * 将 Markdown 报告转换为带交互式图表的 HTML 页面
 * 特性：
 * - 自动识别表格并转换为 Chart.js 图表
 * - 现代化深色主题设计
 * - 响应式布局
 * - 支持打印
 */

// 解析 markdown 表格为数据
function parseMarkdownTable(tableText: string): { headers: string[]; rows: string[][] } | null {
  const lines = tableText.trim().split('\n').filter(line => line.trim());
  if (lines.length < 2) return null;

  // 解析表头
  const headerLine = lines[0];
  const headers = headerLine.split('|').map(h => h.trim()).filter(Boolean);
  
  // 跳过分隔行 (第二行 |---|---|)
  // 解析数据行
  const rows: string[][] = [];
  for (let i = 2; i < lines.length; i++) {
    const cells = lines[i].split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length > 0) {
      rows.push(cells);
    }
  }

  return { headers, rows };
}

// 检测表格是否适合转换为图表
function detectChartType(headers: string[], rows: string[][]): 'line' | 'bar' | 'pie' | 'none' {
  const headerLower = headers.map(h => h.toLowerCase());
  
  // 时间序列数据 -> 折线图
  if (headerLower.some(h => 
    h.includes('month') || h.includes('date') || h.includes('period') || 
    h.includes('月份') || h.includes('时间') || h.includes('mom')
  )) {
    return 'line';
  }
  
  // 百分比分布 -> 饼图
  if (headerLower.some(h => h.includes('%') || h.includes('share') || h.includes('ratio') || h.includes('占比'))) {
    return 'pie';
  }
  
  // 有数值数据 -> 柱状图（更宽泛的检测）
  if (headerLower.some(h => 
    h.includes('traffic') || h.includes('keywords') || h.includes('volume') ||
    h.includes('visits') || h.includes('count') || h.includes('score') ||
    h.includes('rank') || h.includes('backlink') || h.includes('domain') ||
    h.includes('流量') || h.includes('关键词') || h.includes('搜索量') ||
    h.includes('排名') || h.includes('得分')
  )) {
    return 'bar';
  }
  
  // 检查是否有任何数值列（至少2行数据，且有数值）
  if (rows.length >= 2) {
    const hasNumericData = headers.some((_, colIndex) => {
      if (colIndex === 0) return false; // 跳过第一列（通常是标签）
      const numericCount = rows.filter(row => {
        const val = row[colIndex];
        return val && !isNaN(parseFloat(val.replace(/[^\d.-]/g, '')));
      }).length;
      return numericCount >= rows.length * 0.5; // 至少50%的行有数值
    });
    if (hasNumericData) {
      return 'bar';
    }
  }
  
  return 'none';
}

// 提取数字值
function extractNumber(value: string): number {
  const cleaned = value.replace(/[^\d.-]/g, '');
  return parseFloat(cleaned) || 0;
}

// 生成图表配置
function generateChartConfig(
  headers: string[], 
  rows: string[][], 
  chartType: 'line' | 'bar' | 'pie',
  chartId: string
): string {
  const labels = rows.map(row => row[0]);
  
  if (chartType === 'line' || chartType === 'bar') {
    // 找数值列
    const numericColumns: number[] = [];
    headers.forEach((h, i) => {
      if (i > 0) {
        const hasNumbers = rows.some(row => !isNaN(extractNumber(row[i] || '')));
        if (hasNumbers) numericColumns.push(i);
      }
    });

    const datasets = numericColumns.slice(0, 3).map((colIndex, idx) => {
      // Gradient blue-teal-purple palette
      const colors = [
        { bg: 'rgba(99, 102, 241, 0.6)', border: 'rgb(99, 102, 241)' },     // Indigo/Blue
        { bg: 'rgba(20, 184, 166, 0.6)', border: 'rgb(20, 184, 166)' },     // Teal
        { bg: 'rgba(139, 92, 246, 0.6)', border: 'rgb(139, 92, 246)' }      // Purple
      ];
      const color = colors[idx % colors.length];
      
      return `{
        label: '${headers[colIndex]}',
        data: [${rows.map(row => extractNumber(row[colIndex] || '0')).join(', ')}],
        backgroundColor: '${color.bg}',
        borderColor: '${color.border}',
        borderWidth: 2,
        tension: 0.3,
        fill: ${chartType === 'line' ? 'true' : 'false'}
      }`;
    });

    return `
      new Chart(document.getElementById('${chartId}'), {
        type: '${chartType}',
        data: {
          labels: [${labels.map(l => `'${l.replace(/'/g, "\\'")}'`).join(', ')}],
          datasets: [${datasets.join(', ')}]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#374151', font: { size: 12 } }
            }
          },
          scales: {
            x: {
              ticks: { color: '#6b7280' },
              grid: { color: 'rgba(229, 231, 235, 0.8)' }
            },
            y: {
              ticks: { color: '#6b7280' },
              grid: { color: 'rgba(229, 231, 235, 0.8)' }
            }
          }
        }
      });
    `;
  }
  
  if (chartType === 'pie') {
    // 找第一个数值列
    let valueColIndex = 1;
    for (let i = 1; i < headers.length; i++) {
      if (rows.some(row => !isNaN(extractNumber(row[i] || '')))) {
        valueColIndex = i;
        break;
      }
    }
    
    const values = rows.map(row => extractNumber(row[valueColIndex] || '0'));
    // Gradient blue-teal-purple palette for pie charts
    const colors = [
      'rgba(99, 102, 241, 0.85)',    // Indigo/Blue
      'rgba(20, 184, 166, 0.85)',    // Teal
      'rgba(139, 92, 246, 0.85)',    // Purple
      'rgba(129, 140, 248, 0.85)',   // Light indigo
      'rgba(45, 212, 191, 0.85)',    // Light teal
      'rgba(167, 139, 250, 0.85)'    // Light purple
    ];
    
    return `
      new Chart(document.getElementById('${chartId}'), {
        type: 'doughnut',
        data: {
          labels: [${labels.map(l => `'${l.replace(/'/g, "\\'")}'`).join(', ')}],
          datasets: [{
            data: [${values.join(', ')}],
            backgroundColor: [${colors.slice(0, values.length).map(c => `'${c}'`).join(', ')}],
            borderColor: '#ffffff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: { color: '#374151', font: { size: 12 }, padding: 20 }
            }
          }
        }
      });
    `;
  }
  
  return '';
}

// 解析 Markdown 并生成 HTML
function markdownToHtmlWithCharts(markdown: string, title: string): { html: string; chartScripts: string[] } {
  let html = markdown;
  const chartScripts: string[] = [];
  let chartCounter = 0;

  // 移除开头的 h1 标题（避免与 content-header 重复）
  html = html.replace(/^#\s+[^\n]+\n+/, '');

  // 查找所有表格并处理
  // 更宽松的正则：支持行末有或没有 |，支持最后一行没有换行
  const tableRegex = /\|[^\n]+\|?\n\|[-:\s|]+\|?\n(\|[^\n]+\|?\n?)+/g;
  
  html = html.replace(tableRegex, (tableMatch) => {
    const parsed = parseMarkdownTable(tableMatch);
    if (!parsed) return tableMatch;
    
    const chartType = detectChartType(parsed.headers, parsed.rows);
    const chartId = `chart-${chartCounter++}`;
    
    // 生成 HTML 表格
    let tableHtml = '<div class="table-container"><table class="data-table">';
    tableHtml += '<thead><tr>';
    parsed.headers.forEach(h => {
      tableHtml += `<th>${h}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';
    parsed.rows.forEach(row => {
      tableHtml += '<tr>';
      row.forEach((cell, idx) => {
        // 高亮特定内容
        let cellHtml = cell;
        if (cell.includes('✅')) cellHtml = `<span class="badge success">${cell}</span>`;
        else if (cell.includes('❌')) cellHtml = `<span class="badge danger">${cell}</span>`;
        else if (cell.includes('↑')) cellHtml = `<span class="trend up">${cell}</span>`;
        else if (cell.includes('↓')) cellHtml = `<span class="trend down">${cell}</span>`;
        tableHtml += `<td>${cellHtml}</td>`;
      });
      tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table></div>';
    
    // 如果可以生成图表
    if (chartType !== 'none' && parsed.rows.length >= 2) {
      const chartConfig = generateChartConfig(parsed.headers, parsed.rows, chartType, chartId);
      chartScripts.push(chartConfig);
      
      return `
        <div class="chart-section">
          <div class="chart-container">
            <canvas id="${chartId}"></canvas>
          </div>
        </div>
        ${tableHtml}
      `;
    }
    
    return tableHtml;
  });

  // 转换其他 Markdown 元素
  // 标题
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // 粗体和斜体
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // 列表
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  
  // 数字列表
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  
  // 分割线
  html = html.replace(/^---$/gm, '<hr>');
  
  // 代码块
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // 段落（双换行）
  html = html.replace(/\n\n/g, '</p><p>');
  html = `<p>${html}</p>`;
  
  // 清理空段落
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p>(<h[1-6]>)/g, '$1');
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<div)/g, '$1');
  html = html.replace(/(<\/div>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ul>)/g, '$1');
  html = html.replace(/(<\/ul>)<\/p>/g, '$1');
  html = html.replace(/<p>(<hr>)<\/p>/g, '$1');

  return { html, chartScripts };
}

// 将内容按 h2 分割成 tabs
function splitContentIntoTabs(content: string): { tabs: { id: string; title: string; content: string }[]; header: string } {
  // 提取标题和头部信息（h1 之前或第一个 h2 之前的内容）
  const h2Regex = /<h2>(.+?)<\/h2>/g;
  const matches = [...content.matchAll(h2Regex)];
  
  if (matches.length === 0) {
    return { tabs: [{ id: 'main', title: '报告内容', content }], header: '' };
  }
  
  // 找到第一个 h2 之前的内容作为 header
  const firstH2Index = content.indexOf('<h2>');
  const header = firstH2Index > 0 ? content.substring(0, firstH2Index) : '';
  
  const tabs: { id: string; title: string; content: string }[] = [];
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const title = match[1].replace(/<[^>]+>/g, '').trim(); // 移除 HTML 标签
    const startIndex = match.index!;
    const endIndex = i < matches.length - 1 ? matches[i + 1].index! : content.length;
    const tabContent = content.substring(startIndex, endIndex);
    
    // 生成 tab ID
    const id = `tab-${i}`;
    
    tabs.push({ id, title, content: tabContent });
  }
  
  return { tabs, header };
}

// 生成完整 HTML 页面
function generateHtmlPage(content: string, chartScripts: string[], title: string): string {
  const { tabs, header } = splitContentIntoTabs(content);
  
  // 生成侧边栏导航项
  const navItems = tabs.map((tab, i) => 
    `<a href="#${tab.id}" class="nav-item ${i === 0 ? 'active' : ''}" data-section="${tab.id}">
      <span class="nav-dot"></span>
      <span class="nav-text">${tab.title}</span>
    </a>`
  ).join('');
  
  // 生成内容区域（所有内容连续显示，通过滚动定位）
  const sections = tabs.map((tab) => 
    `<section class="content-section" id="${tab.id}">${tab.content}</section>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    :root {
      --bg-primary: #fafbfc;
      --bg-secondary: #ffffff;
      --bg-sidebar: #f8f9fb;
      --text-primary: #1f2937;
      --text-secondary: #6b7280;
      --text-muted: #9ca3af;
      --border-color: #e5e7eb;
      --border-light: #f3f4f6;
      
      /* Subtle accent colors */
      --accent-blue: #6366f1;
      --accent-teal: #14b8a6;
      --accent-purple: #8b5cf6;
      --accent-blue-light: #eef2ff;
      --accent-teal-light: #f0fdfa;
      --accent-purple-light: #f5f3ff;
      
      --success: #10b981;
      --danger: #ef4444;
      --warning: #f59e0b;
      
      --sidebar-width: 240px;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    html {
      scroll-behavior: smooth;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.7;
      font-size: 14px;
    }
    
    /* Layout */
    .layout {
      display: flex;
      min-height: 100vh;
    }
    
    /* Sidebar Navigation */
    .sidebar {
      width: var(--sidebar-width);
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border-color);
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      overflow-y: auto;
      padding: 24px 0;
      z-index: 100;
    }
    
    .sidebar-header {
      padding: 0 20px 20px;
      border-bottom: 1px solid var(--border-light);
      margin-bottom: 16px;
    }
    
    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border-light);
    }
    
    .brand-icon {
      font-size: 1.1rem;
      background: linear-gradient(135deg, var(--accent-blue), var(--accent-teal), var(--accent-purple));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .brand-text {
      font-size: 0.85rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.3px;
    }
    
    .sidebar-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
    }
    
    .sidebar-subtitle {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    
    .nav-section {
      padding: 0 12px;
    }
    
    .nav-label {
      font-size: 0.65rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 12px 8px 8px;
    }
    
    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.85rem;
      border-radius: 6px;
      margin-bottom: 2px;
      transition: all 0.15s ease;
    }
    
    .nav-item:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }
    
    .nav-item.active {
      background: linear-gradient(135deg, var(--accent-blue-light), var(--accent-purple-light));
      color: var(--accent-blue);
      font-weight: 500;
    }
    
    .nav-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--border-color);
      flex-shrink: 0;
    }
    
    .nav-item.active .nav-dot {
      background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
    }
    
    .nav-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    /* Main Content */
    .main-content {
      flex: 1;
      margin-left: var(--sidebar-width);
      min-height: 100vh;
    }
    
    .content-header {
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
      padding: 32px 48px;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    
    .content-header h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 8px;
    }
    
    .content-header-meta {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    
    .content-body {
      padding: 32px 48px;
      max-width: 1000px;
    }
    
    .intro-section {
      background: linear-gradient(135deg, var(--accent-blue-light) 0%, var(--accent-teal-light) 50%, var(--accent-purple-light) 100%);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
      border: 1px solid var(--border-light);
    }
    
    .content-section {
      margin-bottom: 16px;
    }
    
    .section-divider {
      border: none;
      border-top: 1px solid var(--border-light);
      margin: 40px 0;
    }
    
    /* Typography */
    h2 {
      font-size: 1.15rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-top: 32px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid transparent;
      border-image: linear-gradient(90deg, var(--accent-blue), var(--accent-teal), var(--accent-purple)) 1;
    }
    
    h2:first-child {
      margin-top: 0;
    }
    
    h3 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-top: 28px;
      margin-bottom: 12px;
    }
    
    h4 {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-secondary);
      margin-top: 20px;
      margin-bottom: 10px;
    }
    
    p {
      color: var(--text-secondary);
      margin-bottom: 12px;
    }
    
    strong {
      color: var(--text-primary);
      font-weight: 600;
    }
    
    hr {
      border: none;
      border-top: 1px solid var(--border-light);
      margin: 24px 0;
    }
    
    ul, ol {
      margin: 12px 0;
      padding-left: 20px;
    }
    
    li {
      color: var(--text-secondary);
      margin-bottom: 6px;
    }
    
    code {
      background: var(--accent-purple-light);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 0.85em;
      color: var(--accent-purple);
    }
    
    blockquote {
      border-left: 3px solid;
      border-image: linear-gradient(180deg, var(--accent-blue), var(--accent-purple)) 1;
      padding: 16px 20px;
      margin: 16px 0;
      background: linear-gradient(135deg, var(--accent-blue-light), var(--accent-purple-light));
      border-radius: 0 8px 8px 0;
      color: var(--text-secondary);
    }
    
    /* Charts */
    .chart-section {
      background: var(--bg-secondary);
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
      border: 1px solid var(--border-light);
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    
    .chart-container {
      position: relative;
      height: 300px;
      width: 100%;
    }
    
    /* Tables */
    .table-container {
      overflow-x: auto;
      margin: 16px 0;
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
      background: var(--bg-primary);
      font-size: 0.85rem;
    }
    
    .data-table th {
      background: var(--bg-secondary);
      color: var(--text-primary);
      font-weight: 600;
      text-align: left;
      padding: 10px 12px;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid var(--border-color);
    }
    
    .data-table td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--border-light);
      color: var(--text-secondary);
    }
    
    .data-table tr:hover td {
      background: var(--bg-secondary);
    }
    
    .data-table tr:last-child td {
      border-bottom: none;
    }
    
    /* Badges */
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    
    .badge.success {
      background: #e6f4ea;
      color: var(--success);
    }
    
    .badge.danger {
      background: #fde8e8;
      color: var(--danger);
    }
    
    .trend {
      font-weight: 600;
    }
    
    .trend.up {
      color: var(--success);
    }
    
    .trend.down {
      color: var(--danger);
    }
    
    /* Print styles */
    @media print {
      .sidebar {
        display: none;
      }
      
      .main-content {
        margin-left: 0;
      }
      
      .content-section {
        page-break-before: always;
      }
    }
    
    /* Responsive */
    @media (max-width: 900px) {
      .sidebar {
        width: 200px;
      }
      
      :root {
        --sidebar-width: 200px;
      }
      
      .content-body {
        padding: 24px;
      }
    }
    
    @media (max-width: 768px) {
      .sidebar {
        display: none;
      }
      
      .main-content {
        margin-left: 0;
      }
    }
  </style>
</head>
<body>
  <div class="layout">
    <!-- Sidebar Navigation -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-brand">
          <span class="brand-icon">✦</span>
          <span class="brand-text">SeeNOS.ai</span>
        </div>
        <div class="sidebar-title">报告目录</div>
        <div class="sidebar-subtitle">共 ${tabs.length} 个章节</div>
      </div>
      <nav class="nav-section">
        <div class="nav-label">章节导航</div>
        ${navItems}
      </nav>
    </aside>
    
    <!-- Main Content -->
    <main class="main-content">
      <header class="content-header">
        <h1>${title}</h1>
        <div class="content-header-meta">包含 ${chartScripts.length} 个交互式图表</div>
      </header>
      
      <div class="content-body">
        ${header ? `<div class="intro-section">${header}</div>` : ''}
        ${sections}
      </div>
    </main>
  </div>
  
  <script>
    // Sidebar navigation - highlight current section on scroll
    document.addEventListener('DOMContentLoaded', function() {
      const navItems = document.querySelectorAll('.nav-item');
      const sections = document.querySelectorAll('.content-section');
      
      // Click to scroll
      navItems.forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const targetId = item.getAttribute('href').substring(1);
          const target = document.getElementById(targetId);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      });
      
      // Highlight on scroll
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            navItems.forEach(item => {
              item.classList.toggle('active', item.getAttribute('data-section') === id);
            });
          }
        });
      }, { threshold: 0.3, rootMargin: '-100px 0px -50% 0px' });
      
      sections.forEach(section => observer.observe(section));
      
      // Chart.js setup
      Chart.defaults.color = '#6b7280';
      Chart.defaults.borderColor = 'rgba(0, 0, 0, 0.06)';
      Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      
      ${chartScripts.join('\n\n')}
    });
  </script>
</body>
</html>`;
}


export const markdown_to_html_report = tool({
  description: 'Convert a Markdown report to a beautiful HTML page with interactive charts. Tables are automatically converted to Chart.js visualizations. Perfect for SEO reports, analytics dashboards, and data presentations.',
  parameters: z.object({
    markdown_content: z.string().describe('The Markdown content to convert'),
    title: z.string().describe('The title of the report'),
    filename: z.string().optional().describe('Output filename (without extension). Defaults to report-{timestamp}'),
    user_id: z.string().optional().describe('User ID for file storage'),
    conversation_id: z.string().optional().describe('Conversation ID for file association'),
  }),
  execute: async ({ markdown_content, title, filename, user_id, conversation_id }) => {
    console.log(`[markdown_to_html_report] Converting markdown to HTML report: ${title}`);
    
    try {
      const { html: contentHtml, chartScripts } = markdownToHtmlWithCharts(markdown_content, title);
      const fullHtml = generateHtmlPage(contentHtml, chartScripts, title);
      
      const safeFilename = filename || `seo-report-${Date.now()}`;
      const htmlFilename = `${safeFilename}.html`;
      
      // 转换为 Buffer
      const htmlBuffer = Buffer.from(fullHtml, 'utf-8');
      
      console.log(`[markdown_to_html_report] HTML report created: ${htmlFilename}, size: ${htmlBuffer.length} bytes, charts: ${chartScripts.length}`);

      // 直接上传到 Supabase Storage（像 generate_images 那样）
      let publicUrl = '';
      let fileId = '';
      
      if (user_id) {
        try {
          const timestamp = Date.now();
          const storagePath = `${user_id}/${timestamp}-${htmlFilename}`;
          
          console.log(`[markdown_to_html_report] Uploading to Supabase: ${storagePath}`);
          
          const { error: uploadError } = await supabase.storage
            .from('files')
            .upload(storagePath, htmlBuffer, {
              contentType: 'text/html;charset=utf-8',
              upsert: false,
            });
          
          if (uploadError) {
            console.error('[markdown_to_html_report] Upload error:', uploadError);
            // 继续执行，返回 base64 content 作为备选
          } else {
            const { data: { publicUrl: url } } = supabase.storage
              .from('files')
              .getPublicUrl(storagePath);
            
            publicUrl = url;
            console.log(`[markdown_to_html_report] Uploaded to: ${publicUrl}`);
            
            // 保存文件记录到数据库
            const { data: fileRecord, error: dbError } = await supabase
              .from('files')
              .insert({
                user_id: user_id,
                conversation_id: conversation_id || null,
                filename: htmlFilename,
                original_filename: htmlFilename,
                file_type: 'report',
                mime_type: 'text/html',
                file_size: htmlBuffer.length,
                storage_path: storagePath,
                public_url: publicUrl,
                metadata: {
                  title,
                  charts_count: chartScripts.length,
                  generated_at: new Date().toISOString(),
                  type: 'seo_report'
                }
              })
              .select()
              .single();
            
            if (dbError) {
              console.error('[markdown_to_html_report] Database error:', dbError);
            } else {
              fileId = fileRecord.id;
              console.log(`[markdown_to_html_report] File record saved: ${fileId}`);
            }
          }
        } catch (uploadErr: any) {
          console.error('[markdown_to_html_report] Upload failed:', uploadErr);
        }
      }

      // 返回结果
      return {
        success: true,
        filename: htmlFilename,
        content: htmlBuffer.toString('base64'), // 仍然返回 base64 用于预览
        size: htmlBuffer.length,
        mimeType: 'text/html',
        publicUrl: publicUrl || undefined,
        public_url: publicUrl || undefined,
        fileId: fileId || undefined,
        needsUpload: !publicUrl, // 如果已上传则不需要
        charts_generated: chartScripts.length,
        message: publicUrl 
          ? `✅ HTML report generated and saved with ${chartScripts.length} interactive charts!`
          : `✅ HTML report generated with ${chartScripts.length} interactive charts!`,
        metadata: {
          title,
          charts_count: chartScripts.length,
          generated_at: new Date().toISOString(),
          features: [
            'Sidebar navigation for long reports',
            'Blue-teal-purple gradient color scheme',
            'Interactive Chart.js visualizations',
            'Sticky header with section tracking',
            'Responsive layout',
            'Print-friendly styles'
          ]
        }
      };
    } catch (error: any) {
      console.error('[markdown_to_html_report] Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
});

(markdown_to_html_report as any).metadata = {
  name: 'Markdown to HTML Report',
  provider: 'Internal'
};


