import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Assemble a complete alternative page from individual section HTML snippets.
 * This is the V2 approach that uses pre-generated sections instead of
 * generating the entire page in one go.
 * 
 * COLOR PHILOSOPHY:
 * - Brand colors ONLY for buttons and icons
 * - Everything else: pure black/white/gray
 * - Depth created through shadows, not colors
 */
export const assemble_alternative_page_v2 = tool({
  description: `Assemble a complete alternative page from individual HTML section snippets.

This tool combines pre-generated section HTML into a complete, polished page with:
- Proper HTML document structure
- SEO meta tags and Open Graph
- Schema.org structured data
- MINIMALIST COLOR SYSTEM: Brand colors ONLY for buttons & icons, everything else black/white/gray
- Shadow-based depth and visual hierarchy
- Mobile-responsive styles
- Interactive features (scroll-to-top, FAQ accordion)

IMPORTANT: Call the individual section generators first (generate_hero_section, 
generate_verdict_section, etc.) and pass their HTML outputs to this tool.

Workflow:
1. Call capture_website_screenshot for brand and competitor homepages
2. Generate sections: hero, toc, verdict, comparison, pricing, screenshots, pros_cons, use_cases, faq, cta
3. Call this tool with all section HTML
4. Optionally call merge_html_with_site_contexts to add header/footer`,
  parameters: z.object({
    item_id: z.string().describe('Content item ID to save the page to'),
    page_title: z.string().describe('Full page title for SEO'),
    seo: z.object({
      meta_description: z.string().max(160),
      keywords: z.array(z.string()).optional(),
      canonical_url: z.string().optional(),
      og_image: z.string().optional(),
    }),
    brand: z.object({
      name: z.string(),
      logo_url: z.string().optional().describe('Brand logo URL from resolve_page_logos'),
      primary_color: z.string().optional().default('#0ea5e9').describe('Brand primary color - ONLY for buttons & icons'),
      secondary_color: z.string().optional().default('#8b5cf6').describe('Brand secondary color - ONLY for accent icons'),
    }),
    competitor_name: z.string(),
    sections: z.object({
      hero: z.string().describe('HTML from generate_hero_section'),
      toc: z.string().optional().describe('HTML from generate_toc_section'),
      verdict: z.string().optional().describe('HTML from generate_verdict_section'),
      comparison: z.string().optional().describe('HTML from generate_comparison_table'),
      pricing: z.string().optional().describe('HTML from generate_pricing_section'),
      screenshots: z.string().optional().describe('HTML from generate_screenshots_section'),
      pros_cons: z.string().optional().describe('HTML from generate_pros_cons_section'),
      use_cases: z.string().optional().describe('HTML from generate_use_cases_section'),
      faq: z.string().optional().describe('HTML from generate_faq_section'),
      cta: z.string().optional().describe('HTML from generate_cta_section'),
      custom: z.array(z.string()).optional().describe('Additional custom section HTML'),
    }),
    theme_switcher: z.boolean().optional().default(false).describe('Include theme color switcher in header'),
    footer_html: z.string().optional().describe('Custom footer HTML'),
  }),
  execute: async ({ item_id, page_title, seo, brand, competitor_name, sections, theme_switcher, footer_html }) => {
    // ========================================
    // CRITICAL: Validate required sections
    // ========================================
    const requiredSections = ['hero', 'verdict', 'comparison', 'faq', 'cta'] as const;
    const recommendedSections = ['toc', 'pricing', 'pros_cons', 'use_cases'] as const;
    
    const missingSections: string[] = [];
    const missingRecommended: string[] = [];
    
    for (const section of requiredSections) {
      if (!sections[section]) {
        missingSections.push(section);
      }
    }
    
    for (const section of recommendedSections) {
      if (!sections[section]) {
        missingRecommended.push(section);
      }
    }
    
    // BLOCK execution if required sections are missing
    if (missingSections.length > 0) {
      const errorMsg = `MISSING REQUIRED SECTIONS: ${missingSections.join(', ')}

You MUST generate these sections before calling assemble_alternative_page_v2:
${missingSections.map(s => `- generate_${s === 'cta' ? 'cta_section' : s === 'comparison' ? 'comparison_table' : s + '_section'}`).join('\n')}

Current sections provided: ${Object.entries(sections).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'none'}

DO NOT skip sections. Go back and generate the missing sections, then call this tool again.`;
      
      console.error(`[assemble_alternative_page_v2] ERROR: ${errorMsg}`);
      
      return {
        success: false,
        error: errorMsg,
        missing_required: missingSections,
        missing_recommended: missingRecommended,
        sections_provided: Object.entries(sections).filter(([_, v]) => v).map(([k]) => k),
      };
    }
    
    // Warn about missing recommended sections but continue
    if (missingRecommended.length > 0) {
      console.warn(`[assemble_alternative_page_v2] WARNING: Missing recommended sections: ${missingRecommended.join(', ')}`);
    }
    
    // Generate CSS color variables from brand colors
    const primaryHsl = hexToHsl(brand.primary_color || '#0ea5e9');
    const secondaryHsl = hexToHsl(brand.secondary_color || '#8b5cf6');
    
    // Assemble all section HTML in order
    // Screenshots moved up after verdict for better visual impact
    const sectionOrder = [
      sections.hero,
      sections.toc,
      sections.verdict,
      sections.screenshots,  // Moved up - visual comparison early
      sections.comparison,
      sections.pricing,
      sections.pros_cons,
      sections.use_cases,
      sections.faq,
      sections.cta,
      ...(sections.custom || []),
    ].filter(Boolean).join('\n');

    // Generate theme switcher HTML if enabled
    const themeSwitcherHtml = theme_switcher ? `
      <!-- Theme Switcher -->
      <div class="fixed top-4 right-4 z-50 flex gap-2">
        <button onclick="setTheme('blue')" class="w-8 h-8 rounded-full bg-sky-500 shadow-lg hover:scale-110 transition-transform border-2 border-white" title="Ocean Blue"></button>
        <button onclick="setTheme('emerald')" class="w-8 h-8 rounded-full bg-emerald-500 shadow-lg hover:scale-110 transition-transform border-2 border-white" title="Emerald Green"></button>
        <button onclick="setTheme('violet')" class="w-8 h-8 rounded-full bg-violet-500 shadow-lg hover:scale-110 transition-transform border-2 border-white" title="Violet Purple"></button>
      </div>` : '';

    // Generate footer if not provided - Minimalist black/white with brand logo
    const brandInitial = brand.name.charAt(0).toUpperCase();
    const footerLogoHtml = brand.logo_url 
      ? `<img src="${escapeHtml(brand.logo_url)}" alt="${escapeHtml(brand.name)}" class="w-8 h-8 rounded-lg object-contain" onerror="this.outerHTML='<div class=\\'w-8 h-8 rounded-lg bg-brand-icon flex items-center justify-center\\'><span class=\\'text-sm font-bold text-white\\'>${brandInitial}</span></div>'">`
      : `<div class="w-8 h-8 rounded-lg bg-brand-icon flex items-center justify-center"><span class="text-sm font-bold text-white">${brandInitial}</span></div>`;
    
    const finalFooterHtml = footer_html || `
    <!-- Footer - White background, brand color for links -->
    <footer class="bg-white border-t border-gray-200 py-12 px-4 md:px-6">
      <div class="max-w-5xl mx-auto">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            ${footerLogoHtml}
            <span class="font-semibold text-gray-900">${escapeHtml(brand.name)}</span>
          </div>
          <p class="text-sm text-gray-500">© ${new Date().getFullYear()} ${escapeHtml(brand.name)}. All rights reserved.</p>
        </div>
      </div>
    </footer>`;

    // Generate Schema.org structured data
    const schemaMarkup = generateSchemaMarkup(page_title, seo.meta_description, brand.name, competitor_name, seo.canonical_url);

    // Build the complete HTML document with MINIMALIST color system
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(page_title)}</title>
  <meta name="description" content="${escapeHtml(seo.meta_description)}">
  ${seo.keywords?.length ? `<meta name="keywords" content="${escapeHtml(seo.keywords.join(', '))}">` : ''}
  ${seo.canonical_url ? `<link rel="canonical" href="${escapeHtml(seo.canonical_url)}">` : ''}
  
  <!-- Open Graph -->
  <meta property="og:title" content="${escapeHtml(page_title)}">
  <meta property="og:description" content="${escapeHtml(seo.meta_description)}">
  <meta property="og:type" content="article">
  ${seo.og_image ? `<meta property="og:image" content="${escapeHtml(seo.og_image)}">` : ''}
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(page_title)}">
  <meta name="twitter:description" content="${escapeHtml(seo.meta_description)}">
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <style>
    :root {
      /*
       * MINIMALIST COLOR SYSTEM
       * ========================
       * Brand colors ONLY for: buttons, icons, interactive highlights
       * Everything else: pure black/white/gray
       * Depth created through shadows, not colors
       */
      
      /* Primary Brand Color - ONLY for buttons & icons */
      --brand-500: hsl(${primaryHsl.h}, ${primaryHsl.s}%, 50%);
      --brand-600: hsl(${primaryHsl.h}, ${primaryHsl.s}%, 45%);
      --brand-700: hsl(${primaryHsl.h}, ${primaryHsl.s}%, 38%);
      
      /* Secondary Brand Color - ONLY for accent icons */
      --secondary-500: hsl(${secondaryHsl.h}, ${secondaryHsl.s}%, 50%);
      --secondary-600: hsl(${secondaryHsl.h}, ${secondaryHsl.s}%, 45%);
      
      /* Shadow System - For depth & visual hierarchy */
      --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
      --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
      --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    
    /* Font Families */
    body {
      font-family: 'Inter', system-ui, sans-serif;
      color: #171717;
      background-color: white;
    }
    .font-serif {
      font-family: 'Playfair Display', Georgia, serif;
    }
    
    /*
     * ===========================================
     * BRAND COLORS - ONLY FOR BUTTONS & ICONS
     * ===========================================
     */
    
    /* Primary Button - Main CTA with brand color */
    .btn-primary {
      background: var(--brand-500);
      color: white;
      font-weight: 600;
      padding: 12px 24px;
      border-radius: 8px;
      transition: all 0.2s ease;
      box-shadow: var(--shadow-md);
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .btn-primary:hover {
      background: var(--brand-600);
      box-shadow: var(--shadow-lg);
      transform: translateY(-1px);
    }
    
    /* Secondary Button - White with gray border */
    .btn-secondary {
      background: white;
      color: #404040;
      font-weight: 600;
      padding: 12px 24px;
      border-radius: 8px;
      border: 1px solid #e5e5e5;
      transition: all 0.2s ease;
      box-shadow: var(--shadow-sm);
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .btn-secondary:hover {
      border-color: #d4d4d4;
      box-shadow: var(--shadow-md);
    }
    
    /* Icon colors - Brand for checkmarks/positive, gray for others */
    .icon-brand { color: var(--brand-500); }
    .icon-secondary { color: var(--secondary-500); }
    .icon-gray { color: #737373; }
    
    /* Brand text - ONLY for small accents like checkmarks */
    .text-brand { color: var(--brand-500); }
    
    /* Brand background - ONLY for icon containers */
    .bg-brand-icon {
      background: var(--brand-500);
      color: white;
    }
    
    /*
     * ===========================================
     * GRAYSCALE DESIGN SYSTEM
     * ===========================================
     */
    
    /* Card with shadow depth */
    .card {
      background: white;
      border: 1px solid #e5e5e5;
      border-radius: 12px;
      box-shadow: var(--shadow);
      transition: box-shadow 0.2s ease, transform 0.2s ease;
    }
    .card:hover {
      box-shadow: var(--shadow-lg);
      transform: translateY(-2px);
    }
    
    /* Card elevated - More prominent shadow */
    .card-elevated {
      background: white;
      border-radius: 16px;
      box-shadow: var(--shadow-xl);
    }
    
    /* Legacy card-hover support */
    .card-hover {
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .card-hover:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
    
    /* Badge - Gray by default */
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: #f5f5f5;
      color: #525252;
    }
    
    /* Winner badge - Exception with brand color */
    .badge-winner {
      background: var(--brand-500);
      color: white;
    }
    
    /* Table */
    .table-row-alt:nth-child(even) {
      background-color: #fafafa;
    }
    
    /* FAQ Accordion */
    .faq-item.active .faq-content { display: block; }
    .faq-item.active .faq-icon { transform: rotate(180deg); }
    
    /* TOC Link - Gray, no brand colors */
    .toc-link {
      color: #525252;
      transition: all 0.2s;
    }
    .toc-link:hover {
      color: #171717;
    }
    .toc-link.active {
      color: #171717;
      background-color: #f5f5f5;
      font-weight: 600;
    }
    
    /* Status indicators - Brand for positive only */
    .status-yes { color: var(--brand-500); }
    .status-no { color: #a3a3a3; }
    .status-partial { color: #737373; }
    
    /* Hide Scrollbar */
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    
    /* Scroll to Top Button - White with shadow */
    .scroll-top-btn {
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s ease;
      background: white;
      box-shadow: var(--shadow-lg);
    }
    .scroll-top-btn.visible {
      opacity: 1;
      pointer-events: auto;
    }
    .scroll-top-btn:hover {
      box-shadow: var(--shadow-xl);
      transform: scale(1.05);
    }
    
    /* Section backgrounds - Only white and subtle gray */
    .section-white { background: white; }
    .section-gray { background: #fafafa; }
  </style>
  
  <!-- Schema.org Structured Data -->
  ${schemaMarkup}
</head>
<body class="bg-white text-gray-900 antialiased">
  ${themeSwitcherHtml}
  
  ${sectionOrder}
  
  ${finalFooterHtml}
  
  <!-- Scroll to Top Button -->
  <button id="scrollTop" class="scroll-top-btn fixed bottom-6 right-6 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all z-50" onclick="window.scrollTo({top:0,behavior:'smooth'})">
    <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
    </svg>
  </button>
  
  <script>
    // Scroll to top button visibility
    window.addEventListener('scroll', () => {
      document.getElementById('scrollTop').classList.toggle('visible', window.scrollY > 300);
    });
    
    // TOC active link highlighting
    const tocLinks = document.querySelectorAll('.toc-link');
    const sections = document.querySelectorAll('section[id]');
    
    window.addEventListener('scroll', () => {
      let current = '';
      sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (scrollY >= sectionTop) current = section.getAttribute('id');
      });
      tocLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) link.classList.add('active');
      });
    });
    
    ${theme_switcher ? `
    // Theme Switcher
    const themes = {
      blue: { h: 199, s: 89 },
      emerald: { h: 160, s: 84 },
      violet: { h: 263, s: 70 }
    };
    
    function setTheme(name) {
      const theme = themes[name];
      if (!theme) return;
      
      const root = document.documentElement;
      root.style.setProperty('--brand-500', \`hsl(\${theme.h}, \${theme.s}%, 50%)\`);
      root.style.setProperty('--brand-600', \`hsl(\${theme.h}, \${theme.s}%, 45%)\`);
      root.style.setProperty('--brand-700', \`hsl(\${theme.h}, \${theme.s}%, 38%)\`);
      
      localStorage.setItem('theme', name);
    }
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setTheme(savedTheme);
    ` : ''}
  </script>
</body>
</html>`;

    // Save to database
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { error } = await supabase
        .from('content_items')
        .update({ 
          generated_content: html,
          status: 'generated',
          updated_at: new Date().toISOString()
        })
        .eq('id', item_id);

      if (error) {
        return {
          success: false,
          error: `Failed to save page: ${error.message}`,
          html_length: html.length,
        };
      }

      return {
        success: true,
        item_id,
        html_length: html.length,
        line_count: html.split('\n').length,
        sections_included: Object.entries(sections).filter(([_, v]) => v).map(([k]) => k),
        message: `Successfully assembled alternative page (${html.length} chars, ${html.split('\n').length} lines)`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        html,
      };
    }
  },
});

// Helper: Convert hex to HSL
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let r = 0, g = 0, b = 0;
  
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Helper: Generate Schema.org markup
function generateSchemaMarkup(title: string, description: string, brand: string, competitor: string, url?: string): string {
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": description,
      "articleSection": "Product Comparison",
      "datePublished": new Date().toISOString().split('T')[0],
      "dateModified": new Date().toISOString().split('T')[0],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": `${brand} vs ${competitor} Comparison`,
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": brand },
        { "@type": "ListItem", "position": 2, "name": competitor }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "/" },
        { "@type": "ListItem", "position": 2, "name": "Alternatives", "item": "/alternatives" },
        { "@type": "ListItem", "position": 3, "name": `vs ${competitor}` }
      ]
    }
  ];
  
  return schemas.map(s => `<script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n</script>`).join('\n  ');
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
