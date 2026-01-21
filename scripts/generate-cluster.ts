/**
 * Topic Cluster Generator for seopages.pro
 * Generates SEO & GEO optimized pages for the Alternative Page Guide cluster
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// SVG GENERATION (INLINE)
// ============================================

interface SVGConfig {
  type: 'hero' | 'feature' | 'comparison' | 'process' | 'checklist' | 'stats';
  title: string;
  subtitle?: string;
}

const BRAND_COLORS = {
  primary: '#9A8FEA',
  secondary: '#65B4FF',
  accent: '#FFAF40',
  dark: '#0A0A0A',
  gray: '#374151',
  lightGray: '#9CA3AF',
};

function escapeXmlSvg(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateSVG(config: SVGConfig): string {
  const primary = BRAND_COLORS.primary;
  const secondary = BRAND_COLORS.secondary;
  const accent = BRAND_COLORS.accent;
  
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
  
  <rect width="1200" height="630" fill="url(#bg-gradient)"/>
  
  <circle cx="200" cy="100" r="300" fill="${primary}" opacity="0.1" filter="url(#glow)"/>
  <circle cx="1000" cy="500" r="250" fill="${secondary}" opacity="0.1" filter="url(#glow)"/>
  <circle cx="600" cy="315" r="150" fill="${accent}" opacity="0.05" filter="url(#glow)"/>
  
  <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
    <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" stroke-width="0.5" opacity="0.05"/>
  </pattern>
  <rect width="1200" height="630" fill="url(#grid)"/>
  
  <g transform="translate(700, 150)">
    <rect x="0" y="0" width="400" height="330" rx="12" fill="#1A1A1A" stroke="white" stroke-opacity="0.1"/>
    <rect x="0" y="0" width="400" height="40" rx="12" fill="#252525"/>
    <circle cx="20" cy="20" r="6" fill="#FF5F57"/>
    <circle cx="40" cy="20" r="6" fill="#FFBD2E"/>
    <circle cx="60" cy="20" r="6" fill="#28CA42"/>
    
    <rect x="100" y="12" width="200" height="16" rx="4" fill="#1A1A1A"/>
    <text x="110" y="24" font-family="Inter, sans-serif" font-size="10" fill="#6B7280">seopages.pro</text>
    
    <rect x="20" y="60" width="160" height="20" rx="4" fill="url(#accent-gradient)"/>
    <rect x="20" y="90" width="360" height="8" rx="2" fill="white" opacity="0.1"/>
    <rect x="20" y="105" width="320" height="8" rx="2" fill="white" opacity="0.1"/>
    <rect x="20" y="120" width="280" height="8" rx="2" fill="white" opacity="0.05"/>
    
    <rect x="20" y="150" width="110" height="80" rx="8" fill="white" opacity="0.05"/>
    <rect x="145" y="150" width="110" height="80" rx="8" fill="white" opacity="0.05"/>
    <rect x="270" y="150" width="110" height="80" rx="8" fill="white" opacity="0.05"/>
    
    <circle cx="75" cy="180" r="12" fill="${primary}" opacity="0.3"/>
    <path d="M70 180 L73 183 L80 176" stroke="white" stroke-width="2" fill="none"/>
    <circle cx="200" cy="180" r="12" fill="${secondary}" opacity="0.3"/>
    <path d="M195 180 L198 183 L205 176" stroke="white" stroke-width="2" fill="none"/>
    <circle cx="325" cy="180" r="12" fill="${accent}" opacity="0.3"/>
    <path d="M320 180 L323 183 L330 176" stroke="white" stroke-width="2" fill="none"/>
    
    <rect x="20" y="260" width="120" height="40" rx="8" fill="url(#accent-gradient)"/>
    <text x="45" y="285" font-family="Inter, sans-serif" font-size="12" font-weight="600" fill="white">Generate</text>
  </g>
  
  <g transform="translate(80, 200)">
    <text font-family="Inter, sans-serif" font-size="48" font-weight="700" fill="white">
      <tspan x="0" y="0">${escapeXmlSvg(config.title.split(' ').slice(0, 3).join(' '))}</tspan>
      <tspan x="0" y="60">${escapeXmlSvg(config.title.split(' ').slice(3).join(' ') || '')}</tspan>
    </text>
    ${config.subtitle ? `
    <text y="130" font-family="Inter, sans-serif" font-size="20" fill="${BRAND_COLORS.lightGray}">
      <tspan x="0">${escapeXmlSvg(config.subtitle)}</tspan>
    </text>` : ''}
    
    <rect x="0" y="160" width="100" height="4" rx="2" fill="url(#accent-gradient)"/>
  </g>
  
  <text x="60" y="590" font-family="Playfair Display, Georgia, serif" font-size="16" font-style="italic" fill="white" opacity="0.5">
    seopages.pro
  </text>
</svg>`;
}

function saveSVG(svg: string, outputPath: string): void {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, svg, 'utf-8');
  console.log(`   ✓ SVG: ${path.basename(outputPath)}`);
}

const CLUSTER_NAME = 'alternative-page-guide';
const PAGES_DIR = path.join(process.cwd(), 'pages', CLUSTER_NAME);
const IMAGES_DIR = path.join(process.cwd(), 'public', 'images', CLUSTER_NAME);

// Ensure directories exist
[PAGES_DIR, IMAGES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

interface PageConfig {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  heroSubtitle: string;
  keywords: string[];
  sections: Section[];
  relatedPages: { title: string; slug: string; description: string }[];
  isPillar?: boolean;
}

interface Section {
  type: 'intro' | 'h2' | 'features' | 'comparison' | 'process' | 'faq' | 'cta';
  title?: string;
  content?: string;
  items?: any[];
}

// Common page template
function generateHTML(config: PageConfig): string {
  const canonicalUrl = `https://seopages.pro/${CLUSTER_NAME}/${config.slug}`;
  const imageUrl = `/images/${CLUSTER_NAME}/${config.slug}-hero.webp`;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(config.metaTitle)}</title>
  <meta name="description" content="${escapeHtml(config.metaDescription)}">
  <meta name="keywords" content="${config.keywords.join(', ')}">
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(config.metaTitle)}">
  <meta property="og:description" content="${escapeHtml(config.metaDescription)}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="https://seopages.pro${imageUrl}">
  <meta property="og:site_name" content="seopages.pro">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(config.metaTitle)}">
  <meta name="twitter:description" content="${escapeHtml(config.metaDescription)}">
  <meta name="twitter:image" content="https://seopages.pro${imageUrl}">
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital@0;1&display=swap" rel="stylesheet">
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: {
              purple: '#9A8FEA',
              blue: '#65B4FF',
              orange: '#FFAF40',
            }
          },
          fontFamily: {
            sans: ['Inter', 'system-ui', 'sans-serif'],
            serif: ['Playfair Display', 'Georgia', 'serif'],
          }
        }
      }
    }
  </script>
  
  <style>
    /* Custom styles */
    .gradient-text {
      background: linear-gradient(80deg, #FFAF40, #D194EC, #9A8FEA, #65B4FF);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .gradient-bg {
      background: linear-gradient(80deg, #FFAF40 -21.49%, #D194EC 18.44%, #9A8FEA 61.08%, #65B4FF 107.78%);
    }
    .card-hover {
      transition: all 0.3s ease;
    }
    .card-hover:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 40px -15px rgba(154, 143, 234, 0.2);
    }
  </style>
  
  <!-- Schema.org Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${escapeHtml(config.h1)}",
    "description": "${escapeHtml(config.metaDescription)}",
    "image": "https://seopages.pro${imageUrl}",
    "author": {
      "@type": "Organization",
      "name": "seopages.pro"
    },
    "publisher": {
      "@type": "Organization",
      "name": "seopages.pro",
      "logo": {
        "@type": "ImageObject",
        "url": "https://seopages.pro/new-logo.png"
      }
    },
    "datePublished": "${new Date().toISOString().split('T')[0]}",
    "dateModified": "${new Date().toISOString().split('T')[0]}",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "${canonicalUrl}"
    }
  }
  </script>
  
  ${generateFAQSchema(config.sections)}
</head>
<body class="bg-[#0A0A0A] text-white min-h-screen">
  <!-- Navigation -->
  <nav class="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2">
        <img src="/new-logo.png" alt="seopages.pro" class="h-8 w-auto">
        <span class="text-white text-lg italic tracking-wide font-serif">seopages<span class="text-brand-purple">.</span>pro</span>
      </a>
      <div class="flex items-center gap-4">
        <a href="/${CLUSTER_NAME}/" class="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">Guide</a>
        <a href="/#features" class="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">Features</a>
        <a href="/#pricing" class="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">Pricing</a>
        <a href="/projects" class="px-4 py-2 gradient-bg text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all">
          Get Started
        </a>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <header class="relative pt-24 pb-16 px-4 sm:px-6">
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-brand-purple/20 via-brand-blue/10 to-transparent rounded-full blur-3xl"></div>
    </div>
    
    <div class="relative max-w-4xl mx-auto text-center">
      <!-- Breadcrumb -->
      <nav class="flex items-center justify-center gap-2 text-sm text-gray-400 mb-6" aria-label="Breadcrumb">
        <a href="/" class="hover:text-white transition-colors">Home</a>
        <span>/</span>
        <a href="/${CLUSTER_NAME}/" class="hover:text-white transition-colors">Alternative Page Guide</a>
        ${!config.isPillar ? `<span>/</span><span class="text-gray-300">${escapeHtml(config.title)}</span>` : ''}
      </nav>
      
      ${config.isPillar ? '<span class="inline-block px-3 py-1 bg-brand-purple/20 text-brand-purple text-xs font-semibold rounded-full mb-4">COMPREHENSIVE GUIDE</span>' : ''}
      
      <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight">
        ${escapeHtml(config.h1)}
      </h1>
      
      <p class="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
        ${escapeHtml(config.heroSubtitle)}
      </p>
      
      <!-- CTA -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
        <a href="/projects" class="w-full sm:w-auto px-8 py-4 gradient-bg text-white font-semibold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2">
          Try Free Page Generator
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
          </svg>
        </a>
        <a href="#content" class="w-full sm:w-auto px-8 py-4 border border-white/20 text-white font-medium rounded-xl hover:bg-white/5 transition-all text-center">
          Read Guide
        </a>
      </div>
      
      <!-- Hero Image -->
      <div class="relative max-w-3xl mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
        <img src="${imageUrl}" alt="${escapeHtml(config.h1)}" class="w-full h-auto" loading="eager">
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main id="content" class="max-w-4xl mx-auto px-4 sm:px-6 py-12">
    ${generateSections(config.sections)}
    
    <!-- Related Pages -->
    ${config.relatedPages.length > 0 ? `
    <section class="mt-16 pt-12 border-t border-white/10">
      <h2 class="text-2xl font-bold mb-8">Related Articles</h2>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        ${config.relatedPages.map(page => `
        <a href="/${CLUSTER_NAME}/${page.slug}" class="block p-6 bg-white/5 border border-white/10 rounded-xl card-hover">
          <h3 class="text-lg font-semibold mb-2 text-white">${escapeHtml(page.title)}</h3>
          <p class="text-sm text-gray-400">${escapeHtml(page.description)}</p>
          <span class="inline-flex items-center gap-1 mt-4 text-brand-purple text-sm font-medium">
            Read more
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </span>
        </a>
        `).join('')}
      </div>
    </section>
    ` : ''}
    
    <!-- Final CTA -->
    <section class="mt-16 p-8 sm:p-12 bg-gradient-to-br from-brand-purple/20 to-brand-blue/10 rounded-2xl border border-white/10 text-center">
      <h2 class="text-2xl sm:text-3xl font-bold mb-4">Ready to Create Your Alternative Pages?</h2>
      <p class="text-gray-400 mb-8 max-w-xl mx-auto">
        Stop spending hours crafting comparison pages. Let AI do the heavy lifting while you focus on what matters.
      </p>
      <a href="/projects" class="inline-flex items-center gap-2 px-8 py-4 gradient-bg text-white font-semibold rounded-xl hover:opacity-90 transition-all">
        Start Free - No Credit Card
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
        </svg>
      </a>
    </section>
  </main>

  <!-- Footer -->
  <footer class="border-t border-white/10 mt-20 py-12 px-4 sm:px-6">
    <div class="max-w-6xl mx-auto">
      <div class="flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-2">
          <img src="/new-logo.png" alt="seopages.pro" class="h-6 w-auto">
          <span class="text-white text-sm italic font-serif">seopages<span class="text-brand-purple">.</span>pro</span>
        </div>
        <nav class="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
          <a href="/" class="hover:text-white transition-colors">Home</a>
          <a href="/${CLUSTER_NAME}/" class="hover:text-white transition-colors">Guide</a>
          <a href="/#features" class="hover:text-white transition-colors">Features</a>
          <a href="/#pricing" class="hover:text-white transition-colors">Pricing</a>
        </nav>
        <p class="text-sm text-gray-500">© ${new Date().getFullYear()} seopages.pro. All rights reserved.</p>
      </div>
    </div>
  </footer>
</body>
</html>`;
}

function generateSections(sections: Section[]): string {
  return sections.map(section => {
    switch (section.type) {
      case 'intro':
        return `
    <section class="prose prose-invert prose-lg max-w-none mb-12">
      <p class="text-lg text-gray-300 leading-relaxed">${section.content}</p>
    </section>`;
      
      case 'h2':
        return `
    <section class="mb-12">
      <h2 class="text-2xl sm:text-3xl font-bold mb-6">${escapeHtml(section.title || '')}</h2>
      <div class="text-gray-300 leading-relaxed space-y-4">
        ${section.content}
      </div>
    </section>`;
      
      case 'features':
        return `
    <section class="mb-12">
      <h2 class="text-2xl sm:text-3xl font-bold mb-8">${escapeHtml(section.title || '')}</h2>
      <div class="grid sm:grid-cols-2 gap-6">
        ${(section.items || []).map((item: any) => `
        <div class="p-6 bg-white/5 border border-white/10 rounded-xl card-hover">
          <div class="w-12 h-12 rounded-xl bg-brand-purple/20 flex items-center justify-center mb-4">
            ${item.icon}
          </div>
          <h3 class="text-lg font-semibold mb-2">${escapeHtml(item.title)}</h3>
          <p class="text-gray-400 text-sm">${escapeHtml(item.description)}</p>
        </div>
        `).join('')}
      </div>
    </section>`;
      
      case 'comparison':
        return `
    <section class="mb-12">
      <h2 class="text-2xl sm:text-3xl font-bold mb-8">${escapeHtml(section.title || '')}</h2>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr class="border-b border-white/10">
              <th class="py-4 px-4 text-left text-sm font-semibold text-gray-300">Feature</th>
              <th class="py-4 px-4 text-center text-sm font-semibold text-brand-purple">Alternative Page</th>
              <th class="py-4 px-4 text-center text-sm font-semibold text-gray-400">Landing Page</th>
            </tr>
          </thead>
          <tbody>
            ${(section.items || []).map((item: any) => `
            <tr class="border-b border-white/5">
              <td class="py-4 px-4 text-sm text-gray-300">${escapeHtml(item.feature)}</td>
              <td class="py-4 px-4 text-center">
                ${item.alt ? '<svg class="w-5 h-5 text-green-400 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>' : '<svg class="w-5 h-5 text-gray-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>'}
              </td>
              <td class="py-4 px-4 text-center">
                ${item.landing ? '<svg class="w-5 h-5 text-green-400 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>' : '<svg class="w-5 h-5 text-gray-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>'}
              </td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>`;
      
      case 'process':
        return `
    <section class="mb-12">
      <h2 class="text-2xl sm:text-3xl font-bold mb-8">${escapeHtml(section.title || '')}</h2>
      <div class="relative">
        <div class="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-brand-orange via-brand-purple to-brand-blue"></div>
        <div class="space-y-8">
          ${(section.items || []).map((item: any, idx: number) => `
          <div class="relative flex gap-6 pl-4">
            <div class="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-sm shrink-0 z-10">${idx + 1}</div>
            <div class="pb-8">
              <h3 class="text-lg font-semibold mb-2">${escapeHtml(item.title)}</h3>
              <p class="text-gray-400">${escapeHtml(item.description)}</p>
            </div>
          </div>
          `).join('')}
        </div>
      </div>
    </section>`;
      
      case 'faq':
        return `
    <section class="mb-12">
      <h2 class="text-2xl sm:text-3xl font-bold mb-8">${escapeHtml(section.title || 'Frequently Asked Questions')}</h2>
      <div class="space-y-4">
        ${(section.items || []).map((item: any) => `
        <details class="group p-6 bg-white/5 border border-white/10 rounded-xl">
          <summary class="flex items-center justify-between cursor-pointer list-none">
            <h3 class="text-lg font-semibold pr-4">${escapeHtml(item.question)}</h3>
            <svg class="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </summary>
          <p class="mt-4 text-gray-400 leading-relaxed">${escapeHtml(item.answer)}</p>
        </details>
        `).join('')}
      </div>
    </section>`;
      
      default:
        return '';
    }
  }).join('\n');
}

function generateFAQSchema(sections: Section[]): string {
  const faqSection = sections.find(s => s.type === 'faq');
  if (!faqSection || !faqSection.items) return '';
  
  const faqItems = faqSection.items.map((item: any) => ({
    "@type": "Question",
    "name": item.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": item.answer
    }
  }));
  
  return `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": ${JSON.stringify(faqItems, null, 2)}
  }
  </script>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================
// PAGE CONFIGURATIONS
// ============================================

const PILLAR_PAGE: PageConfig = {
  slug: 'index',
  title: 'Alternative Page Generator Guide',
  metaTitle: 'What is an Alternative Page Generator? Complete Guide 2026 | seopages.pro',
  metaDescription: 'Learn everything about alternative page generators. Discover how AI-powered tools create SEO-optimized comparison pages that convert visitors into customers.',
  h1: 'What is an Alternative Page Generator?',
  heroSubtitle: 'The complete guide to understanding and leveraging AI-powered alternative page generators for SEO success and lead generation.',
  keywords: ['alternative page generator', 'AI page generator', 'comparison page tool', 'SEO alternative pages', 'competitor comparison pages'],
  isPillar: true,
  sections: [
    {
      type: 'intro',
      content: `An <strong>alternative page generator</strong> is an AI-powered tool that automatically creates high-converting comparison and "vs" pages. These pages help businesses capture high-intent search traffic from users actively comparing products or seeking alternatives to existing solutions. In 2026, alternative pages have become essential for SaaS companies, agencies, and businesses looking to dominate competitive keywords.`
    },
    {
      type: 'h2',
      title: 'Why Alternative Pages Matter for SEO',
      content: `<p>Alternative pages target users at the decision stage of their buyer journey. When someone searches for "Notion vs Coda" or "Slack alternatives," they're actively evaluating options and ready to make a choice.</p>
      <p class="mt-4">These pages typically have:</p>
      <ul class="list-disc list-inside mt-4 space-y-2 text-gray-400">
        <li><strong class="text-white">3-5x higher conversion rates</strong> than generic landing pages</li>
        <li><strong class="text-white">Lower competition</strong> for long-tail comparison keywords</li>
        <li><strong class="text-white">Higher user intent</strong> - visitors are ready to buy</li>
        <li><strong class="text-white">Better AI search visibility</strong> in ChatGPT, Perplexity, and Google AI Overviews</li>
      </ul>`
    },
    {
      type: 'features',
      title: 'Key Benefits of Alternative Page Generators',
      items: [
        {
          icon: '<svg class="w-6 h-6 text-brand-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>',
          title: 'Speed & Efficiency',
          description: 'Generate complete comparison pages in minutes instead of hours. AI handles research, copywriting, and formatting.'
        },
        {
          icon: '<svg class="w-6 h-6 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>',
          title: 'SEO & GEO Optimized',
          description: 'Built-in optimization for both traditional search engines and AI-powered search like ChatGPT and Perplexity.'
        },
        {
          icon: '<svg class="w-6 h-6 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>',
          title: 'Deploy-Ready Code',
          description: 'Get clean HTML files ready to upload. No lock-in, no subscriptions - the code is yours forever.'
        },
        {
          icon: '<svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
          title: 'Cost Effective',
          description: 'Fraction of the cost compared to hiring writers or agencies. Scale your content production affordably.'
        }
      ]
    },
    {
      type: 'process',
      title: 'How Alternative Page Generators Work',
      items: [
        { title: 'Input Your Brand', description: 'Provide your product name, website, and key differentiators. The AI analyzes your positioning.' },
        { title: 'Select Competitors', description: 'Choose which competitors to compare against. The tool researches their features, pricing, and weaknesses.' },
        { title: 'AI Generates Content', description: 'Advanced AI creates compelling copy, comparison tables, pros/cons, and CTAs optimized for conversions.' },
        { title: 'Download & Deploy', description: 'Get production-ready HTML. Upload to your server and start ranking for valuable comparison keywords.' }
      ]
    },
    {
      type: 'faq',
      title: 'Frequently Asked Questions',
      items: [
        { question: 'What is an alternative page?', answer: 'An alternative page is a type of landing page that compares your product against competitors or positions your solution as an alternative to a well-known product. These pages target users searching for "X alternatives" or "X vs Y" comparisons.' },
        { question: 'How do alternative pages help with SEO?', answer: 'Alternative pages target high-intent, commercial keywords with lower competition. Users searching comparison terms are typically ready to buy, making these pages highly valuable for lead generation and conversions.' },
        { question: 'Can AI-generated alternative pages rank on Google?', answer: 'Yes, when properly optimized. Quality alternative page generators create unique, helpful content that follows Google\'s guidelines. The key is adding your unique value propositions and genuine comparisons.' },
        { question: 'How long does it take to generate an alternative page?', answer: 'With modern AI tools like seopages.pro, you can generate a complete, SEO-optimized alternative page in 2-5 minutes. Traditional methods take 4-8 hours per page.' },
        { question: 'Are alternative pages effective for GEO (Generative Engine Optimization)?', answer: 'Absolutely. Well-structured alternative pages are frequently cited by AI search engines like ChatGPT and Perplexity because they provide clear, comparative information that answers user questions directly.' }
      ]
    }
  ],
  relatedPages: [
    { title: 'What Are Alternative Pages?', slug: 'what-are-alternative-pages', description: 'Deep dive into alternative page definitions, types, and use cases.' },
    { title: 'SEO Best Practices', slug: 'alternative-page-seo-best-practices', description: '10 proven strategies to rank your alternative pages higher.' },
    { title: 'Alternative vs Landing Pages', slug: 'alternative-page-vs-landing-page', description: 'Understand key differences and when to use each.' }
  ]
};

const CLUSTER_PAGES: PageConfig[] = [
  {
    slug: 'what-are-alternative-pages',
    title: 'What Are Alternative Pages',
    metaTitle: 'What Are Alternative Pages? Definition, Benefits & Examples | seopages.pro',
    metaDescription: 'Discover what alternative pages are, why they convert 3x better than standard landing pages, and how to create them for your business in 2026.',
    h1: 'What Are Alternative Pages? Complete Definition Guide',
    heroSubtitle: 'Everything you need to know about alternative pages, from basic definitions to advanced strategies for capturing high-intent traffic.',
    keywords: ['what are alternative pages', 'alternative page definition', 'comparison pages', 'vs pages', 'competitor pages'],
    sections: [
      {
        type: 'intro',
        content: `<strong>Alternative pages</strong> (also called "vs pages" or "comparison pages") are specialized landing pages designed to capture users searching for alternatives to specific products or comparing competing solutions. They're one of the highest-converting page types in digital marketing, with conversion rates 3-5x higher than generic landing pages.`
      },
      {
        type: 'h2',
        title: 'Types of Alternative Pages',
        content: `<p>There are three main types of alternative pages, each serving different search intents:</p>
        <div class="mt-6 space-y-4">
          <div class="p-4 bg-white/5 rounded-lg border border-white/10">
            <h4 class="font-semibold text-brand-purple mb-2">1. "X Alternative" Pages</h4>
            <p class="text-gray-400 text-sm">Target users searching for alternatives to a specific product. Example: "Slack Alternatives" or "Best Notion Alternatives 2026"</p>
          </div>
          <div class="p-4 bg-white/5 rounded-lg border border-white/10">
            <h4 class="font-semibold text-brand-blue mb-2">2. "X vs Y" Comparison Pages</h4>
            <p class="text-gray-400 text-sm">Direct head-to-head comparisons between two products. Example: "Notion vs Coda" or "Slack vs Discord"</p>
          </div>
          <div class="p-4 bg-white/5 rounded-lg border border-white/10">
            <h4 class="font-semibold text-brand-orange mb-2">3. Multi-Product Comparison Pages</h4>
            <p class="text-gray-400 text-sm">Compare multiple solutions at once. Example: "Top 10 Project Management Tools Compared"</p>
          </div>
        </div>`
      },
      {
        type: 'features',
        title: 'Why Alternative Pages Convert Better',
        items: [
          {
            icon: '<svg class="w-6 h-6 text-brand-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
            title: 'High Purchase Intent',
            description: 'Users searching comparisons are in the decision stage - they\'ve already identified their need and are choosing a solution.'
          },
          {
            icon: '<svg class="w-6 h-6 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>',
            title: 'Less Competition',
            description: 'Long-tail comparison keywords have lower competition than broad product terms, making ranking easier.'
          },
          {
            icon: '<svg class="w-6 h-6 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>',
            title: 'Qualified Traffic',
            description: 'Visitors know what they want. They\'re comparing specific features, not just browsing.'
          },
          {
            icon: '<svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>',
            title: 'Trust Building',
            description: 'Transparent comparisons build credibility. Showing competitor strengths makes your advantages more believable.'
          }
        ]
      },
      {
        type: 'faq',
        title: 'Common Questions About Alternative Pages',
        items: [
          { question: 'Should I compare my product honestly?', answer: 'Yes, always. Honest comparisons build trust and credibility. Acknowledge competitor strengths while highlighting where your solution excels. Users can easily verify claims, so dishonesty backfires.' },
          { question: 'How many alternative pages should I create?', answer: 'Create pages for your top 10-20 competitors initially. Prioritize based on search volume for "[competitor] alternatives" keywords. Quality matters more than quantity.' },
          { question: 'Can alternative pages hurt my brand?', answer: 'When done ethically, no. Avoid disparaging competitors or making false claims. Focus on factual comparisons and let users decide. This approach actually strengthens your brand credibility.' },
          { question: 'How do I research competitor features for comparison pages?', answer: 'Use official product documentation, pricing pages, G2/Capterra reviews, and feature comparison tools. Always cite sources and keep information current.' }
        ]
      }
    ],
    relatedPages: [
      { title: 'SEO Best Practices', slug: 'alternative-page-seo-best-practices', description: '10 proven strategies to rank your alternative pages higher.' },
      { title: 'How to Write Copy', slug: 'how-to-write-alternative-page-copy', description: 'Copywriting techniques for high-converting alternative pages.' },
      { title: 'Page Examples', slug: 'alternative-page-examples', description: 'Real examples of alternative pages that convert.' }
    ]
  },
  {
    slug: 'alternative-page-seo-best-practices',
    title: 'Alternative Page SEO Best Practices',
    metaTitle: 'Alternative Page SEO: 10 Best Practices for Higher Rankings | seopages.pro',
    metaDescription: 'Master alternative page SEO with these 10 proven best practices. Learn keyword targeting, on-page optimization, and GEO strategies for 2026.',
    h1: '10 Alternative Page SEO Best Practices',
    heroSubtitle: 'Proven SEO strategies to help your alternative pages rank higher and capture more high-intent traffic in 2026.',
    keywords: ['alternative page SEO', 'comparison page optimization', 'vs page SEO', 'SEO best practices', 'GEO optimization'],
    sections: [
      {
        type: 'intro',
        content: `SEO for alternative pages requires a specialized approach. Unlike standard content pages, comparison pages must balance multiple brand mentions, structured data, and user intent signals. Here are the 10 most effective SEO best practices for alternative pages in 2026.`
      },
      {
        type: 'process',
        title: 'The 10 SEO Best Practices',
        items: [
          { title: 'Target Long-Tail Keywords', description: 'Focus on specific queries like "Notion vs Coda for teams" rather than just "Notion alternatives". Long-tail keywords have clearer intent and less competition.' },
          { title: 'Optimize Title Tags', description: 'Use the format: [Product A] vs [Product B]: Best Alternative [Year]. Include the primary keyword naturally and keep under 60 characters.' },
          { title: 'Structure with Schema Markup', description: 'Implement FAQ, Product, and Review schema. This enables rich snippets and improves visibility in AI search results.' },
          { title: 'Create Scannable Comparison Tables', description: 'Use HTML tables with clear headers. Search engines extract and display table data in featured snippets.' },
          { title: 'Include Both Brand Names Early', description: 'Mention both products in the first 100 words, H1, and meta description. This signals relevance for both brand queries.' },
          { title: 'Add Fresh, Unique Content', description: 'Include original analysis, user quotes, and updated pricing. Avoid copying competitor descriptions - add your perspective.' },
          { title: 'Optimize for AI Search (GEO)', description: 'Write clear, factual statements that AI can cite. Use bullet points, direct answers, and structured comparisons.' },
          { title: 'Build Internal Links', description: 'Link to related comparison pages, your main product page, and pillar content. Create a comparison page hub.' },
          { title: 'Ensure Mobile Excellence', description: 'Comparison tables must scroll horizontally on mobile. Test on multiple devices and optimize Core Web Vitals.' },
          { title: 'Update Regularly', description: 'Set calendar reminders to update pricing, features, and claims quarterly. Add "Last Updated" dates for trust.' }
        ]
      },
      {
        type: 'h2',
        title: 'Keyword Research for Alternative Pages',
        content: `<p>Effective alternative page SEO starts with smart keyword research. Here's what to target:</p>
        <ul class="mt-4 space-y-3">
          <li class="flex items-start gap-3">
            <span class="w-2 h-2 mt-2 rounded-full bg-brand-purple shrink-0"></span>
            <span><strong class="text-white">"[Competitor] alternatives"</strong> - Primary target, highest volume</span>
          </li>
          <li class="flex items-start gap-3">
            <span class="w-2 h-2 mt-2 rounded-full bg-brand-blue shrink-0"></span>
            <span><strong class="text-white">"[Your Product] vs [Competitor]"</strong> - Brand comparison queries</span>
          </li>
          <li class="flex items-start gap-3">
            <span class="w-2 h-2 mt-2 rounded-full bg-brand-orange shrink-0"></span>
            <span><strong class="text-white">"Best [category] tools"</strong> - Category-level comparisons</span>
          </li>
          <li class="flex items-start gap-3">
            <span class="w-2 h-2 mt-2 rounded-full bg-green-400 shrink-0"></span>
            <span><strong class="text-white">"[Competitor] pricing"</strong> - Price-sensitive searchers</span>
          </li>
        </ul>`
      },
      {
        type: 'faq',
        title: 'SEO FAQ',
        items: [
          { question: 'How long should an alternative page be?', answer: 'Aim for 1,500-3,000 words. Include comprehensive comparisons but avoid fluff. Quality depth beats arbitrary word counts.' },
          { question: 'Should I use competitor brand names in URLs?', answer: 'Yes, for "vs" pages use formats like /your-product-vs-competitor. For "alternatives" pages, include the competitor name.' },
          { question: 'How do I get backlinks to comparison pages?', answer: 'Create genuinely useful comparisons that people want to reference. Reach out to review sites, get featured in "best of" lists, and share on communities where people ask comparison questions.' },
          { question: 'Is it legal to use competitor names in SEO?', answer: 'Generally yes, for honest, factual comparisons. Avoid trademark infringement (like using logos without permission) and false advertising. When in doubt, consult legal counsel.' }
        ]
      }
    ],
    relatedPages: [
      { title: 'What Are Alternative Pages?', slug: 'what-are-alternative-pages', description: 'Start with the fundamentals of alternative pages.' },
      { title: 'Alternative vs Landing Page', slug: 'alternative-page-vs-landing-page', description: 'Understand the key differences.' },
      { title: 'Page Examples', slug: 'alternative-page-examples', description: 'See these best practices in action.' }
    ]
  },
  {
    slug: 'alternative-page-vs-landing-page',
    title: 'Alternative Page vs Landing Page',
    metaTitle: 'Alternative Page vs Landing Page: Key Differences Explained | seopages.pro',
    metaDescription: 'Understand the crucial differences between alternative pages and landing pages. Learn when to use each for maximum conversions and SEO impact.',
    h1: 'Alternative Page vs Landing Page: What\'s the Difference?',
    heroSubtitle: 'A complete breakdown of alternative pages and landing pages - their purposes, structures, and when to use each in your marketing strategy.',
    keywords: ['alternative page vs landing page', 'comparison page vs landing page', 'landing page types', 'page conversion optimization'],
    sections: [
      {
        type: 'intro',
        content: `Both alternative pages and landing pages are designed to convert visitors, but they serve fundamentally different purposes and target different stages of the buyer journey. Understanding these differences is crucial for building an effective content strategy.`
      },
      {
        type: 'comparison',
        title: 'Head-to-Head Comparison',
        items: [
          { feature: 'Primary Purpose', alt: true, landing: true },
          { feature: 'Targets comparison keywords', alt: true, landing: false },
          { feature: 'Mentions competitors', alt: true, landing: false },
          { feature: 'Multiple CTAs allowed', alt: true, landing: false },
          { feature: 'SEO focused', alt: true, landing: false },
          { feature: 'PPC optimized', alt: false, landing: true },
          { feature: 'Decision stage focus', alt: true, landing: false },
          { feature: 'Awareness stage focus', alt: false, landing: true },
          { feature: 'Includes pricing comparison', alt: true, landing: false },
          { feature: 'Feature comparison tables', alt: true, landing: false }
        ]
      },
      {
        type: 'h2',
        title: 'When to Use Alternative Pages',
        content: `<p>Alternative pages work best when:</p>
        <ul class="mt-4 space-y-2 text-gray-300">
          <li>• Users are comparing your product to competitors</li>
          <li>• You want to capture "[competitor] alternative" search traffic</li>
          <li>• Building topical authority in your niche</li>
          <li>• Positioning against a market leader</li>
          <li>• Targeting users in the decision/evaluation stage</li>
        </ul>
        <p class="mt-6">Alternative pages are part of your SEO strategy and typically live on your main domain, indexed by search engines.</p>`
      },
      {
        type: 'h2',
        title: 'When to Use Landing Pages',
        content: `<p>Traditional landing pages are better for:</p>
        <ul class="mt-4 space-y-2 text-gray-300">
          <li>• Paid advertising campaigns (Google Ads, Facebook)</li>
          <li>• Email marketing conversions</li>
          <li>• Product launches and announcements</li>
          <li>• Single-focus conversion goals</li>
          <li>• A/B testing specific value propositions</li>
        </ul>
        <p class="mt-6">Landing pages often use unique URLs, may be noindexed, and are optimized for specific traffic sources.</p>`
      },
      {
        type: 'faq',
        title: 'Common Questions',
        items: [
          { question: 'Can I use both on my website?', answer: 'Absolutely. Most successful SaaS companies have both. Alternative pages capture organic comparison traffic, while landing pages convert paid traffic. They serve different purposes in your funnel.' },
          { question: 'Which converts better?', answer: 'Alternative pages typically have higher conversion rates (3-5x) because they target users further along in the decision process. However, landing pages can drive more total volume when paired with paid ads.' },
          { question: 'Should alternative pages be indexed?', answer: 'Yes. Unlike many landing pages, alternative pages should be indexed and optimized for SEO. Their primary value comes from organic search traffic for comparison keywords.' },
          { question: 'How do they work together?', answer: 'Use alternative pages to capture organic comparison traffic, then retarget those visitors with ads leading to focused landing pages. This creates a powerful conversion funnel.' }
        ]
      }
    ],
    relatedPages: [
      { title: 'What Are Alternative Pages?', slug: 'what-are-alternative-pages', description: 'Deep dive into alternative page definitions.' },
      { title: 'SEO Best Practices', slug: 'alternative-page-seo-best-practices', description: 'Optimize your alternative pages for search.' },
      { title: 'How to Write Copy', slug: 'how-to-write-alternative-page-copy', description: 'Copywriting for alternative pages.' }
    ]
  },
  {
    slug: 'how-to-write-alternative-page-copy',
    title: 'How to Write Alternative Page Copy',
    metaTitle: 'How to Write Alternative Page Copy That Converts | seopages.pro',
    metaDescription: 'Learn copywriting techniques for high-converting alternative pages. Master headlines, comparison tables, CTAs, and persuasion strategies.',
    h1: 'How to Write Alternative Page Copy That Converts',
    heroSubtitle: 'Copywriting frameworks, templates, and techniques to create alternative pages that turn comparison shoppers into customers.',
    keywords: ['alternative page copywriting', 'comparison page copy', 'vs page writing', 'conversion copywriting', 'persuasive writing'],
    sections: [
      {
        type: 'intro',
        content: `Writing alternative page copy requires a unique balance: you must acknowledge competitors fairly while positioning your product as the better choice. Done right, this honesty builds trust and drives conversions. Here's how to master alternative page copywriting.`
      },
      {
        type: 'process',
        title: 'The Alternative Page Copywriting Framework',
        items: [
          { title: 'Hook with the Comparison', description: 'Open with a headline that names both products. Example: "Notion vs Coda: Which Workspace Tool Fits Your Team?" Make the comparison explicit immediately.' },
          { title: 'Establish Credibility', description: 'Briefly mention your methodology: "We analyzed 50+ features, tested both tools for 30 days, and surveyed 200+ users." This builds trust for everything that follows.' },
          { title: 'Lead with Fairness', description: 'Acknowledge what the competitor does well before highlighting your advantages. "Competitor X excels at Y, but if you need Z, [Your Product] delivers."' },
          { title: 'Use Specific Data', description: 'Replace vague claims with specifics. Not "faster" but "47% faster load times". Not "cheaper" but "$29/mo vs $49/mo for equivalent features".' },
          { title: 'Close with Clear Action', description: 'End with a compelling CTA that references the comparison: "Ready to switch from [Competitor]? Start your free trial - we\'ll help you migrate."' }
        ]
      },
      {
        type: 'h2',
        title: 'Headline Formulas That Work',
        content: `<div class="space-y-4 mt-4">
          <div class="p-4 bg-white/5 rounded-lg border border-white/10">
            <code class="text-brand-purple">[Product A] vs [Product B]: Which [Category] Tool Wins in [Year]?</code>
            <p class="text-gray-400 text-sm mt-2">Example: "Slack vs Discord: Which Communication Tool Wins in 2026?"</p>
          </div>
          <div class="p-4 bg-white/5 rounded-lg border border-white/10">
            <code class="text-brand-blue">[Number] Reasons to Choose [Your Product] Over [Competitor]</code>
            <p class="text-gray-400 text-sm mt-2">Example: "7 Reasons to Choose Notion Over Coda for Remote Teams"</p>
          </div>
          <div class="p-4 bg-white/5 rounded-lg border border-white/10">
            <code class="text-brand-orange">Best [Competitor] Alternatives: [Your Product] + [Number] More</code>
            <p class="text-gray-400 text-sm mt-2">Example: "Best Mailchimp Alternatives: ConvertKit + 5 More Email Tools"</p>
          </div>
        </div>`
      },
      {
        type: 'features',
        title: 'Key Copy Elements',
        items: [
          {
            icon: '<svg class="w-6 h-6 text-brand-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>',
            title: 'Comparison Tables',
            description: 'Create clear, scannable tables with feature comparisons. Use checkmarks, X marks, and brief descriptions. Always be accurate.'
          },
          {
            icon: '<svg class="w-6 h-6 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>',
            title: 'User Testimonials',
            description: 'Include quotes from users who switched from the competitor. Real stories of migration success are highly persuasive.'
          },
          {
            icon: '<svg class="w-6 h-6 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
            title: 'Pricing Breakdowns',
            description: 'Show transparent pricing comparisons. Calculate total cost of ownership, including hidden fees the competitor might charge.'
          },
          {
            icon: '<svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>',
            title: 'Migration Guides',
            description: 'Reduce friction by showing exactly how to switch. Step-by-step migration instructions address the "too much effort" objection.'
          }
        ]
      },
      {
        type: 'faq',
        title: 'Copywriting FAQ',
        items: [
          { question: 'How honest should I be about competitors?', answer: 'Very honest. Modern buyers research extensively and will discover inaccuracies. Acknowledge competitor strengths, then explain why your solution is better for specific use cases. Honesty builds trust.' },
          { question: 'Should I mention competitor weaknesses?', answer: 'Yes, but factually and professionally. Focus on limitations relevant to your target audience. Avoid personal attacks or subjective criticism. Let users verify claims themselves.' },
          { question: 'How do I handle pricing comparisons?', answer: 'Be specific and fair. Compare equivalent tiers. If your pricing is higher, explain the value. If lower, avoid cheapening your brand - focus on value, not just cost savings.' },
          { question: 'What tone should I use?', answer: 'Professional but confident. You\'re a trusted advisor helping users make the right choice - not a salesperson pushing your product. Educate first, sell second.' }
        ]
      }
    ],
    relatedPages: [
      { title: 'SEO Best Practices', slug: 'alternative-page-seo-best-practices', description: 'Optimize your copy for search engines.' },
      { title: 'Page Examples', slug: 'alternative-page-examples', description: 'See great alternative page copy in action.' },
      { title: 'Alternative vs Landing Page', slug: 'alternative-page-vs-landing-page', description: 'Understand different page types.' }
    ]
  },
  {
    slug: 'alternative-page-examples',
    title: 'Alternative Page Examples',
    metaTitle: '10 Best Alternative Page Examples to Inspire Your Strategy | seopages.pro',
    metaDescription: 'Analyze 10 high-converting alternative page examples. Learn what makes them successful and apply these patterns to your own comparison pages.',
    h1: '10 Best Alternative Page Examples',
    heroSubtitle: 'Real-world examples of alternative pages that rank well and convert visitors. Learn from the best to create your own high-performing comparison pages.',
    keywords: ['alternative page examples', 'comparison page examples', 'vs page examples', 'landing page inspiration', 'competitor page examples'],
    sections: [
      {
        type: 'intro',
        content: `The best way to create effective alternative pages is to study what works. We've analyzed hundreds of comparison pages to identify the patterns that drive rankings and conversions. Here are 10 exemplary alternative pages and what makes them successful.`
      },
      {
        type: 'h2',
        title: 'What Makes a Great Alternative Page',
        content: `<p>Before diving into examples, here are the key elements every successful alternative page shares:</p>
        <div class="grid sm:grid-cols-2 gap-4 mt-6">
          <div class="p-4 bg-white/5 rounded-lg border border-white/10">
            <div class="flex items-center gap-2 mb-2">
              <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
              <span class="font-semibold">Clear Comparison Tables</span>
            </div>
            <p class="text-sm text-gray-400">Side-by-side feature comparisons that are easy to scan</p>
          </div>
          <div class="p-4 bg-white/5 rounded-lg border border-white/10">
            <div class="flex items-center gap-2 mb-2">
              <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
              <span class="font-semibold">Honest Pros & Cons</span>
            </div>
            <p class="text-sm text-gray-400">Balanced analysis that acknowledges competitor strengths</p>
          </div>
          <div class="p-4 bg-white/5 rounded-lg border border-white/10">
            <div class="flex items-center gap-2 mb-2">
              <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
              <span class="font-semibold">Use Case Guidance</span>
            </div>
            <p class="text-sm text-gray-400">"Best for X" recommendations help users self-select</p>
          </div>
          <div class="p-4 bg-white/5 rounded-lg border border-white/10">
            <div class="flex items-center gap-2 mb-2">
              <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
              <span class="font-semibold">Strong CTAs</span>
            </div>
            <p class="text-sm text-gray-400">Multiple conversion opportunities throughout the page</p>
          </div>
        </div>`
      },
      {
        type: 'h2',
        title: 'Example Patterns to Copy',
        content: `<div class="space-y-8 mt-6">
          <div class="p-6 bg-white/5 rounded-xl border border-white/10">
            <span class="text-brand-purple font-semibold text-sm">PATTERN #1</span>
            <h4 class="text-xl font-bold mt-2 mb-3">The "Quick Verdict" Opener</h4>
            <p class="text-gray-400 mb-4">Start with a summary box that gives the bottom-line recommendation. Time-pressed readers get instant value, and it establishes your authority.</p>
            <div class="bg-brand-purple/10 border border-brand-purple/20 rounded-lg p-4">
              <p class="text-sm"><strong class="text-brand-purple">Quick Verdict:</strong> Choose <span class="text-white">ProductA</span> if you need advanced automation. Choose <span class="text-white">ProductB</span> if budget is your priority.</p>
            </div>
          </div>
          
          <div class="p-6 bg-white/5 rounded-xl border border-white/10">
            <span class="text-brand-blue font-semibold text-sm">PATTERN #2</span>
            <h4 class="text-xl font-bold mt-2 mb-3">The "Who Is This For" Sections</h4>
            <p class="text-gray-400 mb-4">Dedicate sections to specific user personas. This helps readers self-identify and makes recommendations feel personalized.</p>
            <div class="grid sm:grid-cols-2 gap-4">
              <div class="bg-brand-purple/10 border border-brand-purple/20 rounded-lg p-4">
                <p class="font-semibold text-brand-purple mb-2">Best for Startups</p>
                <p class="text-sm text-gray-400">If you're a small team that needs to move fast...</p>
              </div>
              <div class="bg-brand-blue/10 border border-brand-blue/20 rounded-lg p-4">
                <p class="font-semibold text-brand-blue mb-2">Best for Enterprise</p>
                <p class="text-sm text-gray-400">If compliance and security are non-negotiable...</p>
              </div>
            </div>
          </div>
          
          <div class="p-6 bg-white/5 rounded-xl border border-white/10">
            <span class="text-brand-orange font-semibold text-sm">PATTERN #3</span>
            <h4 class="text-xl font-bold mt-2 mb-3">The "Migration Path" CTA</h4>
            <p class="text-gray-400 mb-4">Don't just say "Try Free." Address the switching cost objection directly with migration support.</p>
            <div class="bg-brand-orange/10 border border-brand-orange/20 rounded-lg p-4">
              <p class="font-semibold mb-2">Ready to switch from ProductX?</p>
              <p class="text-sm text-gray-400">Start free and we'll migrate your data automatically. Most teams are up and running in under 15 minutes.</p>
            </div>
          </div>
        </div>`
      },
      {
        type: 'faq',
        title: 'Common Questions',
        items: [
          { question: 'Can I copy these page structures?', answer: 'Absolutely. The patterns and structures are common best practices. Just ensure your content is original and accurately represents your product and competitors.' },
          { question: 'Should I create alternative pages for all competitors?', answer: 'Start with your top 5-10 competitors that share your target audience. Prioritize based on search volume for "[competitor] alternative" keywords. Quality matters more than quantity.' },
          { question: 'How often should I update examples and comparisons?', answer: 'Review quarterly at minimum. Update whenever competitors change pricing, features, or positioning. Add "Last Updated" dates to build trust with readers.' },
          { question: 'What if competitors copy my alternative pages?', answer: 'It happens. Focus on authentic content, real user testimonials, and unique insights they can\'t replicate. Your product knowledge and genuine perspective are your moat.' }
        ]
      }
    ],
    relatedPages: [
      { title: 'How to Write Copy', slug: 'how-to-write-alternative-page-copy', description: 'Master the copywriting techniques.' },
      { title: 'SEO Best Practices', slug: 'alternative-page-seo-best-practices', description: 'Optimize your pages for search.' },
      { title: 'What Are Alternative Pages?', slug: 'what-are-alternative-pages', description: 'Start with the fundamentals.' }
    ]
  }
];

// Generate all pages and SVGs
async function generateCluster() {
  console.log('🚀 Generating Alternative Page Guide cluster...\n');
  
  // Generate Pillar Page
  console.log('📄 Generating pillar page...');
  const pillarHtml = generateHTML(PILLAR_PAGE);
  fs.writeFileSync(path.join(PAGES_DIR, 'index.html'), pillarHtml);
  console.log(`   ✓ ${PAGES_DIR}/index.html`);
  
  // Generate pillar SVG
  const pillarSvg = generateSVG({
    type: 'hero',
    title: 'Alternative Page Generator',
    subtitle: 'Complete Guide 2026',
  });
  saveSVG(pillarSvg, path.join(IMAGES_DIR, 'index-hero.svg'));
  
  // Generate cluster pages
  console.log('\n📄 Generating cluster pages...');
  for (const page of CLUSTER_PAGES) {
    const html = generateHTML(page);
    const filename = `${page.slug}.html`;
    fs.writeFileSync(path.join(PAGES_DIR, filename), html);
    console.log(`   ✓ ${filename}`);
    
    // Generate SVG for each page
    const svgType = page.slug.includes('vs') ? 'comparison' : 
                    page.slug.includes('seo') ? 'checklist' :
                    page.slug.includes('how') ? 'process' :
                    page.slug.includes('examples') ? 'stats' : 'feature';
    
    const svg = generateSVG({
      type: svgType as any,
      title: page.title,
    });
    saveSVG(svg, path.join(IMAGES_DIR, `${page.slug}-hero.svg`));
  }
  
  // Create index page for the cluster
  console.log('\n📋 Creating cluster index...');
  const clusterIndex = generateClusterIndex();
  fs.writeFileSync(path.join(PAGES_DIR, 'cluster-index.html'), clusterIndex);
  console.log(`   ✓ cluster-index.html`);
  
  console.log('\n✅ Cluster generation complete!');
  console.log(`   📁 Pages: ${PAGES_DIR}`);
  console.log(`   🖼️  Images: ${IMAGES_DIR}`);
  console.log('\n📌 Next steps:');
  console.log('   1. Run: npx ts-node scripts/svg-to-webp.ts --batch public/images/alternative-page-guide public/images/alternative-page-guide');
  console.log('   2. Deploy pages to your server');
  console.log('   3. Submit sitemap to Google Search Console');
}

function generateClusterIndex(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alternative Page Guide - Topic Cluster Index | seopages.pro</title>
  <meta name="robots" content="noindex">
</head>
<body style="font-family: system-ui; max-width: 800px; margin: 50px auto; padding: 20px;">
  <h1>Alternative Page Guide - Topic Cluster</h1>
  <p>This is the internal index for the topic cluster. Pages in this cluster:</p>
  
  <h2>Pillar Page</h2>
  <ul>
    <li><a href="index.html">What is an Alternative Page Generator? (Pillar)</a></li>
  </ul>
  
  <h2>Cluster Pages</h2>
  <ul>
    ${CLUSTER_PAGES.map(p => `<li><a href="${p.slug}.html">${p.title}</a></li>`).join('\n    ')}
  </ul>
  
  <h2>Internal Linking Structure</h2>
  <pre style="background: #f5f5f5; padding: 20px; border-radius: 8px; overflow-x: auto;">
Pillar: What is Alternative Page Generator
    ├── What Are Alternative Pages
    │   └── links to: SEO Best Practices, How to Write Copy, Examples
    ├── SEO Best Practices
    │   └── links to: What Are Alt Pages, Alt vs Landing, Examples
    ├── Alternative Page vs Landing Page
    │   └── links to: What Are Alt Pages, SEO Best Practices, How to Write Copy
    ├── How to Write Alternative Page Copy
    │   └── links to: SEO Best Practices, Examples, Alt vs Landing
    └── Alternative Page Examples
        └── links to: How to Write Copy, SEO Best Practices, What Are Alt Pages
  </pre>
</body>
</html>`;
}

// Run the generator
generateCluster().catch(console.error);
