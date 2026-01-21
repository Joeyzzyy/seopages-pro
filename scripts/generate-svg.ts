/**
 * SVG Generator Tool
 * Generates professional SVG illustrations for SEO content pages
 */

import * as fs from 'fs';
import * as path from 'path';

interface SVGConfig {
  type: 'hero' | 'feature' | 'comparison' | 'process' | 'checklist' | 'stats';
  title: string;
  subtitle?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

// Brand colors from seopages.pro
const BRAND_COLORS = {
  primary: '#9A8FEA',    // Purple
  secondary: '#65B4FF',  // Blue
  accent: '#FFAF40',     // Orange
  dark: '#0A0A0A',
  gray: '#374151',
  lightGray: '#9CA3AF',
};

function generateHeroSVG(config: SVGConfig): string {
  const primary = config.primaryColor || BRAND_COLORS.primary;
  const secondary = config.secondaryColor || BRAND_COLORS.secondary;
  const accent = config.accentColor || BRAND_COLORS.accent;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" fill="none">
  <defs>
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0A0A0A"/>
      <stop offset="100%" style="stop-color:#1A1A2E"/>
    </linearGradient>
    <linearGradient id="accent-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${accent}"/>
      <stop offset="50%" style="stop-color:${primary}"/>
      <stop offset="100%" style="stop-color:${secondary}"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="20" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg-gradient)"/>
  
  <!-- Decorative circles -->
  <circle cx="200" cy="100" r="300" fill="${primary}" opacity="0.1" filter="url(#glow)"/>
  <circle cx="1000" cy="500" r="250" fill="${secondary}" opacity="0.1" filter="url(#glow)"/>
  <circle cx="600" cy="315" r="150" fill="${accent}" opacity="0.05" filter="url(#glow)"/>
  
  <!-- Grid pattern -->
  <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
    <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" stroke-width="0.5" opacity="0.05"/>
  </pattern>
  <rect width="1200" height="630" fill="url(#grid)"/>
  
  <!-- Main illustration: Browser window -->
  <g transform="translate(700, 150)">
    <!-- Browser chrome -->
    <rect x="0" y="0" width="400" height="330" rx="12" fill="#1A1A1A" stroke="white" stroke-opacity="0.1"/>
    <rect x="0" y="0" width="400" height="40" rx="12" fill="#252525"/>
    <circle cx="20" cy="20" r="6" fill="#FF5F57"/>
    <circle cx="40" cy="20" r="6" fill="#FFBD2E"/>
    <circle cx="60" cy="20" r="6" fill="#28CA42"/>
    
    <!-- URL bar -->
    <rect x="100" y="12" width="200" height="16" rx="4" fill="#1A1A1A"/>
    <text x="110" y="24" font-family="Inter, sans-serif" font-size="10" fill="#6B7280">seopages.pro</text>
    
    <!-- Content area -->
    <rect x="20" y="60" width="160" height="20" rx="4" fill="url(#accent-gradient)"/>
    <rect x="20" y="90" width="360" height="8" rx="2" fill="white" opacity="0.1"/>
    <rect x="20" y="105" width="320" height="8" rx="2" fill="white" opacity="0.1"/>
    <rect x="20" y="120" width="280" height="8" rx="2" fill="white" opacity="0.05"/>
    
    <!-- Feature boxes -->
    <rect x="20" y="150" width="110" height="80" rx="8" fill="white" opacity="0.05"/>
    <rect x="145" y="150" width="110" height="80" rx="8" fill="white" opacity="0.05"/>
    <rect x="270" y="150" width="110" height="80" rx="8" fill="white" opacity="0.05"/>
    
    <!-- Checkmarks -->
    <circle cx="75" cy="180" r="12" fill="${primary}" opacity="0.3"/>
    <path d="M70 180 L73 183 L80 176" stroke="white" stroke-width="2" fill="none"/>
    <circle cx="200" cy="180" r="12" fill="${secondary}" opacity="0.3"/>
    <path d="M195 180 L198 183 L205 176" stroke="white" stroke-width="2" fill="none"/>
    <circle cx="325" cy="180" r="12" fill="${accent}" opacity="0.3"/>
    <path d="M320 180 L323 183 L330 176" stroke="white" stroke-width="2" fill="none"/>
    
    <!-- CTA button -->
    <rect x="20" y="260" width="120" height="40" rx="8" fill="url(#accent-gradient)"/>
    <text x="45" y="285" font-family="Inter, sans-serif" font-size="12" font-weight="600" fill="white">Generate</text>
  </g>
  
  <!-- Text content -->
  <g transform="translate(80, 200)">
    <text font-family="Inter, sans-serif" font-size="48" font-weight="700" fill="white">
      <tspan x="0" y="0">${escapeXml(config.title.split(' ').slice(0, 3).join(' '))}</tspan>
      <tspan x="0" y="60">${escapeXml(config.title.split(' ').slice(3).join(' ') || '')}</tspan>
    </text>
    ${config.subtitle ? `
    <text y="130" font-family="Inter, sans-serif" font-size="20" fill="${BRAND_COLORS.lightGray}">
      <tspan x="0">${escapeXml(config.subtitle)}</tspan>
    </text>` : ''}
    
    <!-- Accent line -->
    <rect x="0" y="160" width="100" height="4" rx="2" fill="url(#accent-gradient)"/>
  </g>
  
  <!-- Logo watermark -->
  <text x="60" y="590" font-family="Playfair Display, Georgia, serif" font-size="16" font-style="italic" fill="white" opacity="0.5">
    seopages.pro
  </text>
</svg>`;
}

function generateFeatureSVG(config: SVGConfig): string {
  const primary = config.primaryColor || BRAND_COLORS.primary;
  const secondary = config.secondaryColor || BRAND_COLORS.secondary;
  const accent = config.accentColor || BRAND_COLORS.accent;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" fill="none">
  <defs>
    <linearGradient id="feature-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0A0A0A"/>
      <stop offset="100%" style="stop-color:#111827"/>
    </linearGradient>
    <linearGradient id="feature-accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${accent}"/>
      <stop offset="50%" style="stop-color:${primary}"/>
      <stop offset="100%" style="stop-color:${secondary}"/>
    </linearGradient>
  </defs>
  
  <rect width="800" height="500" fill="url(#feature-bg)"/>
  
  <!-- Decorative elements -->
  <circle cx="700" cy="100" r="200" fill="${primary}" opacity="0.08"/>
  <circle cx="100" cy="400" r="150" fill="${secondary}" opacity="0.08"/>
  
  <!-- Central icon container -->
  <g transform="translate(400, 200)">
    <circle r="80" fill="url(#feature-accent)" opacity="0.2"/>
    <circle r="60" fill="${BRAND_COLORS.dark}" stroke="url(#feature-accent)" stroke-width="3"/>
    
    <!-- Icon: Document with checkmark -->
    <path d="M-20 -25 L20 -25 L20 25 L-20 25 Z" fill="none" stroke="white" stroke-width="2"/>
    <path d="M-10 -15 L10 -15" stroke="white" stroke-width="2" opacity="0.5"/>
    <path d="M-10 -5 L10 -5" stroke="white" stroke-width="2" opacity="0.5"/>
    <path d="M-10 5 L5 5" stroke="white" stroke-width="2" opacity="0.5"/>
    <path d="M-5 15 L0 20 L10 10" stroke="${accent}" stroke-width="3" fill="none"/>
  </g>
  
  <!-- Title -->
  <text x="400" y="340" text-anchor="middle" font-family="Inter, sans-serif" font-size="28" font-weight="700" fill="white">${escapeXml(config.title)}</text>
  ${config.subtitle ? `<text x="400" y="375" text-anchor="middle" font-family="Inter, sans-serif" font-size="16" fill="${BRAND_COLORS.lightGray}">${escapeXml(config.subtitle)}</text>` : ''}
  
  <!-- Decorative dots -->
  <g fill="${primary}" opacity="0.3">
    <circle cx="150" cy="150" r="4"/>
    <circle cx="650" cy="350" r="4"/>
    <circle cx="200" cy="300" r="3"/>
    <circle cx="600" cy="150" r="3"/>
  </g>
</svg>`;
}

function generateComparisonSVG(config: SVGConfig): string {
  const primary = config.primaryColor || BRAND_COLORS.primary;
  const secondary = config.secondaryColor || BRAND_COLORS.secondary;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" fill="none">
  <defs>
    <linearGradient id="comp-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0A0A0A"/>
      <stop offset="100%" style="stop-color:#111827"/>
    </linearGradient>
  </defs>
  
  <rect width="800" height="500" fill="url(#comp-bg)"/>
  
  <!-- Left card -->
  <g transform="translate(120, 100)">
    <rect width="250" height="300" rx="16" fill="#1A1A1A" stroke="${primary}" stroke-width="2"/>
    <rect x="20" y="20" width="80" height="30" rx="6" fill="${primary}" opacity="0.2"/>
    <text x="35" y="40" font-family="Inter, sans-serif" font-size="12" font-weight="600" fill="${primary}">Option A</text>
    
    <!-- Features list -->
    <g transform="translate(20, 80)">
      <circle cx="10" cy="10" r="8" fill="${primary}" opacity="0.3"/>
      <path d="M7 10 L9 12 L13 8" stroke="white" stroke-width="1.5" fill="none"/>
      <rect x="30" y="6" width="150" height="8" rx="2" fill="white" opacity="0.1"/>
      
      <circle cx="10" cy="50" r="8" fill="${primary}" opacity="0.3"/>
      <path d="M7 50 L9 52 L13 48" stroke="white" stroke-width="1.5" fill="none"/>
      <rect x="30" y="46" width="130" height="8" rx="2" fill="white" opacity="0.1"/>
      
      <circle cx="10" cy="90" r="8" fill="${primary}" opacity="0.3"/>
      <path d="M7 90 L9 92 L13 88" stroke="white" stroke-width="1.5" fill="none"/>
      <rect x="30" y="86" width="160" height="8" rx="2" fill="white" opacity="0.1"/>
      
      <circle cx="10" cy="130" r="8" fill="white" opacity="0.1"/>
      <path d="M7 127 L13 133 M13 127 L7 133" stroke="white" stroke-width="1.5" opacity="0.3" fill="none"/>
      <rect x="30" y="126" width="120" height="8" rx="2" fill="white" opacity="0.05"/>
    </g>
  </g>
  
  <!-- VS badge -->
  <g transform="translate(400, 250)">
    <circle r="30" fill="${BRAND_COLORS.accent}"/>
    <text y="6" text-anchor="middle" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="white">VS</text>
  </g>
  
  <!-- Right card -->
  <g transform="translate(430, 100)">
    <rect width="250" height="300" rx="16" fill="#1A1A1A" stroke="${secondary}" stroke-width="2"/>
    <rect x="20" y="20" width="80" height="30" rx="6" fill="${secondary}" opacity="0.2"/>
    <text x="35" y="40" font-family="Inter, sans-serif" font-size="12" font-weight="600" fill="${secondary}">Option B</text>
    
    <!-- Features list -->
    <g transform="translate(20, 80)">
      <circle cx="10" cy="10" r="8" fill="${secondary}" opacity="0.3"/>
      <path d="M7 10 L9 12 L13 8" stroke="white" stroke-width="1.5" fill="none"/>
      <rect x="30" y="6" width="140" height="8" rx="2" fill="white" opacity="0.1"/>
      
      <circle cx="10" cy="50" r="8" fill="${secondary}" opacity="0.3"/>
      <path d="M7 50 L9 52 L13 48" stroke="white" stroke-width="1.5" fill="none"/>
      <rect x="30" y="46" width="160" height="8" rx="2" fill="white" opacity="0.1"/>
      
      <circle cx="10" cy="90" r="8" fill="white" opacity="0.1"/>
      <path d="M7 87 L13 93 M13 87 L7 93" stroke="white" stroke-width="1.5" opacity="0.3" fill="none"/>
      <rect x="30" y="86" width="130" height="8" rx="2" fill="white" opacity="0.05"/>
      
      <circle cx="10" cy="130" r="8" fill="${secondary}" opacity="0.3"/>
      <path d="M7 130 L9 132 L13 128" stroke="white" stroke-width="1.5" fill="none"/>
      <rect x="30" y="126" width="150" height="8" rx="2" fill="white" opacity="0.1"/>
    </g>
  </g>
  
  <!-- Title -->
  <text x="400" y="460" text-anchor="middle" font-family="Inter, sans-serif" font-size="20" font-weight="600" fill="white">${escapeXml(config.title)}</text>
</svg>`;
}

function generateProcessSVG(config: SVGConfig): string {
  const primary = config.primaryColor || BRAND_COLORS.primary;
  const secondary = config.secondaryColor || BRAND_COLORS.secondary;
  const accent = config.accentColor || BRAND_COLORS.accent;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" fill="none">
  <defs>
    <linearGradient id="process-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0A0A0A"/>
      <stop offset="100%" style="stop-color:#111827"/>
    </linearGradient>
    <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${accent}"/>
      <stop offset="50%" style="stop-color:${primary}"/>
      <stop offset="100%" style="stop-color:${secondary}"/>
    </linearGradient>
  </defs>
  
  <rect width="800" height="400" fill="url(#process-bg)"/>
  
  <!-- Connecting line -->
  <line x1="150" y1="200" x2="650" y2="200" stroke="url(#line-gradient)" stroke-width="3" stroke-dasharray="8 4"/>
  
  <!-- Step 1 -->
  <g transform="translate(150, 200)">
    <circle r="40" fill="${accent}" opacity="0.2"/>
    <circle r="30" fill="${BRAND_COLORS.dark}" stroke="${accent}" stroke-width="2"/>
    <text y="6" text-anchor="middle" font-family="Inter, sans-serif" font-size="18" font-weight="700" fill="${accent}">1</text>
    <text y="70" text-anchor="middle" font-family="Inter, sans-serif" font-size="14" font-weight="500" fill="white">Research</text>
  </g>
  
  <!-- Step 2 -->
  <g transform="translate(325, 200)">
    <circle r="40" fill="${primary}" opacity="0.2"/>
    <circle r="30" fill="${BRAND_COLORS.dark}" stroke="${primary}" stroke-width="2"/>
    <text y="6" text-anchor="middle" font-family="Inter, sans-serif" font-size="18" font-weight="700" fill="${primary}">2</text>
    <text y="70" text-anchor="middle" font-family="Inter, sans-serif" font-size="14" font-weight="500" fill="white">Generate</text>
  </g>
  
  <!-- Step 3 -->
  <g transform="translate(500, 200)">
    <circle r="40" fill="${secondary}" opacity="0.2"/>
    <circle r="30" fill="${BRAND_COLORS.dark}" stroke="${secondary}" stroke-width="2"/>
    <text y="6" text-anchor="middle" font-family="Inter, sans-serif" font-size="18" font-weight="700" fill="${secondary}">3</text>
    <text y="70" text-anchor="middle" font-family="Inter, sans-serif" font-size="14" font-weight="500" fill="white">Optimize</text>
  </g>
  
  <!-- Step 4 -->
  <g transform="translate(675, 200)">
    <circle r="40" fill="#10B981" opacity="0.2"/>
    <circle r="30" fill="${BRAND_COLORS.dark}" stroke="#10B981" stroke-width="2"/>
    <text y="6" text-anchor="middle" font-family="Inter, sans-serif" font-size="18" font-weight="700" fill="#10B981">4</text>
    <text y="70" text-anchor="middle" font-family="Inter, sans-serif" font-size="14" font-weight="500" fill="white">Deploy</text>
  </g>
  
  <!-- Title -->
  <text x="400" y="50" text-anchor="middle" font-family="Inter, sans-serif" font-size="24" font-weight="700" fill="white">${escapeXml(config.title)}</text>
</svg>`;
}

function generateChecklistSVG(config: SVGConfig): string {
  const primary = config.primaryColor || BRAND_COLORS.primary;
  const accent = config.accentColor || BRAND_COLORS.accent;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" fill="none">
  <defs>
    <linearGradient id="checklist-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0A0A0A"/>
      <stop offset="100%" style="stop-color:#111827"/>
    </linearGradient>
  </defs>
  
  <rect width="600" height="500" fill="url(#checklist-bg)"/>
  
  <!-- Card -->
  <rect x="100" y="80" width="400" height="340" rx="16" fill="#1A1A1A" stroke="white" stroke-opacity="0.1"/>
  
  <!-- Header -->
  <rect x="100" y="80" width="400" height="60" rx="16" fill="${primary}" opacity="0.1"/>
  <text x="140" y="118" font-family="Inter, sans-serif" font-size="18" font-weight="700" fill="white">${escapeXml(config.title)}</text>
  
  <!-- Checklist items -->
  <g transform="translate(130, 170)">
    ${[0, 1, 2, 3, 4].map((i, idx) => `
    <g transform="translate(0, ${i * 50})">
      <rect x="0" y="0" width="24" height="24" rx="6" fill="${idx < 3 ? primary : 'white'}" opacity="${idx < 3 ? '0.3' : '0.1'}"/>
      ${idx < 3 ? `<path d="M7 12 L10 15 L17 8" stroke="white" stroke-width="2" fill="none"/>` : ''}
      <rect x="40" y="8" width="${180 - (idx * 20)}" height="8" rx="2" fill="white" opacity="${idx < 3 ? '0.2' : '0.1'}"/>
    </g>
    `).join('')}
  </g>
  
  <!-- Progress indicator -->
  <g transform="translate(130, 380)">
    <rect width="340" height="8" rx="4" fill="white" opacity="0.1"/>
    <rect width="204" height="8" rx="4" fill="${accent}"/>
    <text x="350" y="6" font-family="Inter, sans-serif" font-size="12" font-weight="600" fill="${accent}">60%</text>
  </g>
</svg>`;
}

function generateStatsSVG(config: SVGConfig): string {
  const primary = config.primaryColor || BRAND_COLORS.primary;
  const secondary = config.secondaryColor || BRAND_COLORS.secondary;
  const accent = config.accentColor || BRAND_COLORS.accent;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" fill="none">
  <defs>
    <linearGradient id="stats-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0A0A0A"/>
      <stop offset="100%" style="stop-color:#111827"/>
    </linearGradient>
    <linearGradient id="bar-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" style="stop-color:${primary}"/>
      <stop offset="100%" style="stop-color:${secondary}"/>
    </linearGradient>
  </defs>
  
  <rect width="800" height="400" fill="url(#stats-bg)"/>
  
  <!-- Title -->
  <text x="400" y="50" text-anchor="middle" font-family="Inter, sans-serif" font-size="24" font-weight="700" fill="white">${escapeXml(config.title)}</text>
  
  <!-- Chart area -->
  <g transform="translate(100, 100)">
    <!-- Y-axis -->
    <line x1="50" y1="0" x2="50" y2="220" stroke="white" stroke-opacity="0.2"/>
    
    <!-- X-axis -->
    <line x1="50" y1="220" x2="650" y2="220" stroke="white" stroke-opacity="0.2"/>
    
    <!-- Grid lines -->
    <line x1="50" y1="55" x2="650" y2="55" stroke="white" stroke-opacity="0.05"/>
    <line x1="50" y1="110" x2="650" y2="110" stroke="white" stroke-opacity="0.05"/>
    <line x1="50" y1="165" x2="650" y2="165" stroke="white" stroke-opacity="0.05"/>
    
    <!-- Bars -->
    <rect x="100" y="60" width="60" height="160" rx="4" fill="url(#bar-gradient)" opacity="0.8"/>
    <rect x="220" y="100" width="60" height="120" rx="4" fill="url(#bar-gradient)" opacity="0.8"/>
    <rect x="340" y="40" width="60" height="180" rx="4" fill="url(#bar-gradient)" opacity="0.8"/>
    <rect x="460" y="80" width="60" height="140" rx="4" fill="url(#bar-gradient)" opacity="0.8"/>
    <rect x="580" y="20" width="60" height="200" rx="4" fill="${accent}" opacity="0.8"/>
    
    <!-- Labels -->
    <text x="130" y="250" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="${BRAND_COLORS.lightGray}">Q1</text>
    <text x="250" y="250" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="${BRAND_COLORS.lightGray}">Q2</text>
    <text x="370" y="250" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="${BRAND_COLORS.lightGray}">Q3</text>
    <text x="490" y="250" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="${BRAND_COLORS.lightGray}">Q4</text>
    <text x="610" y="250" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="${accent}">Now</text>
  </g>
</svg>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateSVG(config: SVGConfig): string {
  switch (config.type) {
    case 'hero':
      return generateHeroSVG(config);
    case 'feature':
      return generateFeatureSVG(config);
    case 'comparison':
      return generateComparisonSVG(config);
    case 'process':
      return generateProcessSVG(config);
    case 'checklist':
      return generateChecklistSVG(config);
    case 'stats':
      return generateStatsSVG(config);
    default:
      return generateHeroSVG(config);
  }
}

export function saveSVG(svg: string, outputPath: string): void {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, svg, 'utf-8');
  console.log(`✓ SVG saved to: ${outputPath}`);
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('Usage: npx ts-node generate-svg.ts <type> <title> <output-path> [subtitle]');
    console.log('Types: hero, feature, comparison, process, checklist, stats');
    process.exit(1);
  }
  
  const [type, title, outputPath, subtitle] = args;
  
  const config: SVGConfig = {
    type: type as SVGConfig['type'],
    title,
    subtitle,
  };
  
  const svg = generateSVG(config);
  saveSVG(svg, outputPath);
}
