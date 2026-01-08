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
 * Convert Markdown reports to interactive HTML pages
 * Features:
 * - Auto-detect tables and convert to Chart.js charts (when enabled)
 * - Modern light theme design
 * - Responsive layout
 * - Print-friendly
 */

// Parse markdown table to data structure
function parseMarkdownTable(tableText: string): { headers: string[]; rows: string[][] } | null {
  const lines = tableText.trim().split('\n').filter(line => line.trim());
  if (lines.length < 2) return null;

  // Parse header row
  const headerLine = lines[0];
  const headers = headerLine.split('|').map(h => h.trim()).filter(Boolean);
  
  // Skip separator row (second row |---|---|)
  // Parse data rows
  const rows: string[][] = [];
  for (let i = 2; i < lines.length; i++) {
    const cells = lines[i].split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length > 0) {
      rows.push(cells);
    }
  }

  return { headers, rows };
}

// Detect if table is suitable for chart conversion
// Note: Chart generation is disabled by default unless explicitly enabled
function detectChartType(headers: string[], rows: string[][], enableCharts: boolean = false): 'line' | 'bar' | 'pie' | 'none' {
  // Do not generate charts by default
  if (!enableCharts) {
    return 'none';
  }
  
  const headerLower = headers.map(h => h.toLowerCase());
  
  // Time series data -> line chart
  if (headerLower.some(h => 
    h.includes('month') || h.includes('date') || h.includes('period') || h.includes('mom')
  )) {
    return 'line';
  }
  
  // Percentage distribution -> pie chart
  if (headerLower.some(h => h.includes('%') || h.includes('share') || h.includes('ratio'))) {
    return 'pie';
  }
  
  // Numeric data -> bar chart (broader detection)
  if (headerLower.some(h => 
    h.includes('traffic') || h.includes('keywords') || h.includes('volume') ||
    h.includes('visits') || h.includes('count') || h.includes('score') ||
    h.includes('rank') || h.includes('backlink') || h.includes('domain')
  )) {
    return 'bar';
  }
  
  // Check for any numeric columns (at least 2 rows with numeric data)
  if (rows.length >= 2) {
    const hasNumericData = headers.some((_, colIndex) => {
      if (colIndex === 0) return false; // Skip first column (usually labels)
      const numericCount = rows.filter(row => {
        const val = row[colIndex];
        // Must contain at least one digit
        if (!val || !/\d/.test(val)) return false;
        const cleaned = val.replace(/[^\d.-]/g, '');
        const num = parseFloat(cleaned);
        return !isNaN(num) && isFinite(num);
      }).length;
      return numericCount >= rows.length * 0.5; // At least 50% of rows have numeric values
    });
    if (hasNumericData) {
      return 'bar';
    }
  }
  
  return 'none';
}

// Extract numeric value from string
function extractNumber(value: string): number {
  const cleaned = value.replace(/[^\d.-]/g, '');
  return parseFloat(cleaned) || 0;
}

// Check if string contains valid number
function hasValidNumber(value: string): boolean {
  if (!value) return false;
  // Must contain at least one digit
  if (!/\d/.test(value)) return false;
  const cleaned = value.replace(/[^\d.-]/g, '');
  const num = parseFloat(cleaned);
  return !isNaN(num) && isFinite(num);
}

// Generate chart configuration
function generateChartConfig(
  headers: string[], 
  rows: string[][], 
  chartType: 'line' | 'bar' | 'pie',
  chartId: string
): string {
  const labels = rows.map(row => row[0]);
  
  if (chartType === 'line' || chartType === 'bar') {
    // Find numeric columns - ensure column truly contains numbers
    const numericColumns: number[] = [];
    headers.forEach((h, i) => {
      if (i > 0) {
        // At least 50% of rows must have valid numbers in this column
        const validCount = rows.filter(row => hasValidNumber(row[i] || '')).length;
        if (validCount >= rows.length * 0.5) numericColumns.push(i);
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
    // Find first column with valid numeric values (at least 50% valid)
    let valueColIndex = -1;
    for (let i = 1; i < headers.length; i++) {
      const validCount = rows.filter(row => hasValidNumber(row[i] || '')).length;
      if (validCount >= rows.length * 0.5) {
        valueColIndex = i;
        break;
      }
    }
    
    // Skip chart generation if no numeric column found
    if (valueColIndex === -1) {
      return '';
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

// Parse Markdown and generate HTML
function markdownToHtmlWithCharts(markdown: string, title: string, enableCharts: boolean = false): { html: string; chartScripts: string[] } {
  let html = markdown;
  const chartScripts: string[] = [];
  let chartCounter = 0;

  // Remove leading h1 title (avoid duplication with content-header)
  html = html.replace(/^#\s+[^\n]+\n+/, '');

  // Find all tables and process them
  // Flexible regex: supports trailing | or not, supports last row without newline
  const tableRegex = /\|[^\n]+\|?\n\|[-:\s|]+\|?\n(\|[^\n]+\|?\n?)+/g;
  
  html = html.replace(tableRegex, (tableMatch) => {
    const parsed = parseMarkdownTable(tableMatch);
    if (!parsed) return tableMatch;
    
    const chartType = detectChartType(parsed.headers, parsed.rows, enableCharts);
    const chartId = `chart-${chartCounter++}`;
    
    // Generate HTML table
    let tableHtml = '<div class="table-container"><table class="data-table">';
    tableHtml += '<thead><tr>';
    parsed.headers.forEach(h => {
      tableHtml += `<th>${h}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';
    parsed.rows.forEach(row => {
      tableHtml += '<tr>';
      row.forEach((cell, idx) => {
        // Highlight specific content
        let cellHtml = cell;
        if (cell.includes('+')) cellHtml = `<span class="trend up">${cell}</span>`;
        else if (cell.includes('-') && /\d/.test(cell)) cellHtml = `<span class="trend down">${cell}</span>`;
        tableHtml += `<td>${cellHtml}</td>`;
      });
      tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table></div>';
    
    // Generate chart if applicable
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

  // Convert other Markdown elements
  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Links - convert [text](url) to clickable <a> tags
  // Must be done before other processing to avoid conflicts
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="report-link">$1</a>');
  
  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  
  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  
  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');
  
  // Code blocks
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Paragraphs (double newlines)
  html = html.replace(/\n\n/g, '</p><p>');
  html = `<p>${html}</p>`;
  
  // Clean up empty paragraphs
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

// Navigation item type: supports hierarchical structure
interface NavItem {
  id: string;
  title: string;
  content: string;
  level: 'h1' | 'h2';
  children?: NavItem[];
}

// Split content by h1 and h2 into hierarchical navigation
function splitContentIntoTabs(content: string): { tabs: NavItem[]; header: string } {
  // Match h1 and h2 headings
  const headingRegex = /<(h1|h2)>(.+?)<\/\1>/g;
  const matches = [...content.matchAll(headingRegex)];
  
  if (matches.length === 0) {
    return { tabs: [{ id: 'main', title: 'Report Content', content, level: 'h1' }], header: '' };
  }
  
  // Find content before first h1 or h2 as header
  const firstHeadingIndex = Math.min(
    content.indexOf('<h1>') >= 0 ? content.indexOf('<h1>') : Infinity,
    content.indexOf('<h2>') >= 0 ? content.indexOf('<h2>') : Infinity
  );
  const header = firstHeadingIndex > 0 && firstHeadingIndex !== Infinity ? content.substring(0, firstHeadingIndex) : '';
  
  const tabs: NavItem[] = [];
  let currentH1: NavItem | null = null;
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const level = match[1] as 'h1' | 'h2';
    const title = match[2].replace(/<[^>]+>/g, '').trim();
    const startIndex = match.index!;
    const endIndex = i < matches.length - 1 ? matches[i + 1].index! : content.length;
    const tabContent = content.substring(startIndex, endIndex);
    const id = `section-${i}`;
    
    if (level === 'h1') {
      // New parent category
      currentH1 = { id, title, content: tabContent, level, children: [] };
      tabs.push(currentH1);
    } else {
      // h2 child item
      const item: NavItem = { id, title, content: tabContent, level };
      if (currentH1) {
        currentH1.children = currentH1.children || [];
        currentH1.children.push(item);
      } else {
        // No parent h1, add to top level
        tabs.push(item);
      }
    }
  }
  
  return { tabs, header };
}

// Generate complete HTML page
function generateHtmlPage(content: string, chartScripts: string[], title: string): string {
  const { tabs, header } = splitContentIntoTabs(content);
  
  // Generate hierarchical sidebar navigation items
  const generateNavItems = (items: NavItem[], isFirst: boolean = true): string => {
    return items.map((tab, i) => {
      const isActive = isFirst && i === 0;
      const isParent = tab.level === 'h1' && tab.children && tab.children.length > 0;
      
      let html = `<a href="#${tab.id}" class="nav-item ${isActive ? 'active' : ''} ${tab.level === 'h2' ? 'nav-child' : 'nav-parent'}" data-section="${tab.id}">
        <span class="nav-text">${tab.title}</span>
      </a>`;
      
      // If has children, generate recursively
      if (isParent) {
        html += `<div class="nav-children">${generateNavItems(tab.children!, false)}</div>`;
      }
      
      return html;
    }).join('');
  };
  
  const navItems = generateNavItems(tabs);
  
  // Collect all sections (including nested ones)
  const collectSections = (items: NavItem[]): string => {
    return items.map(tab => {
      let html = `<section class="content-section" id="${tab.id}">${tab.content}</section>`;
      if (tab.children && tab.children.length > 0) {
        html += collectSections(tab.children);
      }
      return html;
    }).join('');
  };
  
  const sections = collectSections(tabs);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
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
      font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
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
    
    
    .nav-section {
      padding: 16px 12px;
    }
    
    .nav-item {
      display: flex;
      align-items: center;
      padding: 10px 12px;
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.85rem;
      border-radius: 6px;
      margin-bottom: 2px;
      transition: all 0.15s ease;
    }
    
    /* Parent navigation (h1 categories) */
    .nav-parent {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.9rem;
      margin-top: 12px;
    }
    
    .nav-parent:first-child {
      margin-top: 0;
    }
    
    /* Child navigation (h2 items) */
    .nav-child {
      padding-left: 24px;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
    
    .nav-children {
      margin-left: 0;
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
    
    .nav-child.active {
      font-weight: 500;
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
    
    /* Links - make them clearly clickable */
    a, .report-link {
      color: var(--accent-blue);
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: all 0.15s ease;
      cursor: pointer;
    }
    
    a:hover, .report-link:hover {
      color: var(--accent-purple);
      border-bottom-color: var(--accent-purple);
    }
    
    /* Links in tables */
    .data-table a, .data-table .report-link {
      color: var(--accent-blue);
      font-weight: 500;
    }
    
    .data-table a:hover, .data-table .report-link:hover {
      text-decoration: underline;
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
      <nav class="nav-section">
        ${navItems}
      </nav>
    </aside>
    
    <!-- Main Content -->
    <main class="main-content">
      <header class="content-header">
        <h1>${title}</h1>
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
  description: 'Convert a Markdown report to a beautiful HTML page. Charts are disabled by default - only generates tables. Set enable_charts=true to enable chart generation.',
  parameters: z.object({
    markdown_content: z.string().describe('The Markdown content to convert'),
    title: z.string().describe('The title of the report'),
    filename: z.string().optional().describe('Output filename (without extension). Defaults to report-{timestamp}'),
    user_id: z.string().optional().describe('User ID for file storage'),
    conversation_id: z.string().optional().describe('Conversation ID for file association'),
    enable_charts: z.boolean().optional().default(false).describe('Enable chart generation from tables. Default is false (no charts).'),
  }),
  execute: async ({ markdown_content, title, filename, user_id, conversation_id, enable_charts }) => {
    console.log(`[markdown_to_html_report] Converting markdown to HTML report: ${title}, charts: ${enable_charts ? 'enabled' : 'disabled'}`);
    
    try {
      const { html: contentHtml, chartScripts } = markdownToHtmlWithCharts(markdown_content, title, enable_charts);
      const fullHtml = generateHtmlPage(contentHtml, chartScripts, title);
      
      const safeFilename = filename || `seo-report-${Date.now()}`;
      const htmlFilename = `${safeFilename}.html`;
      
      // Convert to Buffer
      const htmlBuffer = Buffer.from(fullHtml, 'utf-8');
      
      console.log(`[markdown_to_html_report] HTML report created: ${htmlFilename}, size: ${htmlBuffer.length} bytes, charts: ${chartScripts.length}`);

      // Upload directly to Supabase Storage
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
            // Continue execution, return base64 content as fallback
          } else {
            const { data: { publicUrl: url } } = supabase.storage
              .from('files')
              .getPublicUrl(storagePath);
            
            publicUrl = url;
            console.log(`[markdown_to_html_report] Uploaded to: ${publicUrl}`);
            
            // Save file record to database
            const { data: fileRecord, error: dbError } = await supabase
              .from('files')
              .insert({
                user_id: user_id,
                conversation_id: conversation_id || null,
                filename: htmlFilename,
                original_filename: htmlFilename,
                file_type: 'report',
                mime_type: 'text/html;charset=utf-8',
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

      // Return result
      return {
        success: true,
        filename: htmlFilename,
        content: htmlBuffer.toString('base64'), // Still return base64 for preview
        size: htmlBuffer.length,
        mimeType: 'text/html;charset=utf-8',
        publicUrl: publicUrl || undefined,
        public_url: publicUrl || undefined,
        fileId: fileId || undefined,
        needsUpload: !publicUrl, // No upload needed if already uploaded
        charts_generated: chartScripts.length,
        message: publicUrl 
          ? `[OK] HTML report generated and saved with ${chartScripts.length} interactive charts!`
          : `[OK] HTML report generated with ${chartScripts.length} interactive charts!`,
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


