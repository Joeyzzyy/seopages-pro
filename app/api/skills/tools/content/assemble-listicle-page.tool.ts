import { tool } from 'ai';
import { z } from 'zod';
import { createServerSupabaseAdmin } from '@/lib/supabase-server';

/**
 * Assemble a complete listicle/best-of page from individual section HTML snippets.
 * Uses pre-generated sections for better quality control and consistency.
 * 
 * COLOR PHILOSOPHY:
 * - Brand colors ONLY for buttons and icons
 * - Everything else: pure black/white/gray
 * - Depth created through shadows, not colors
 */
export const assemble_listicle_page = tool({
  description: `Assemble a complete listicle/best-of page from individual HTML section snippets.

This tool combines pre-generated section HTML into a complete, polished page with:
- Proper HTML document structure
- SEO meta tags and Open Graph
- Schema.org structured data (ItemList for rankings)
- MINIMALIST COLOR SYSTEM: Brand colors ONLY for buttons & icons
- Shadow-based depth and visual hierarchy
- Mobile-responsive styles
- Interactive features (scroll-to-top, FAQ accordion)

IMPORTANT: Call the individual section generators first and pass their HTML outputs to this tool.

Workflow:
1. Generate sections: listicle-hero, comparison-table, product-cards (multiple), faq, cta
2. Call this tool with all section HTML
3. Optionally call merge_html_with_site_contexts to add header/footer`,
  parameters: z.object({
    item_id: z.string().describe('Content item ID to save the page to'),
    page_title: z.string().describe('Full page title for SEO, e.g., "Top 10 Best Writesonic Alternatives in 2025"'),
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
    total_alternatives: z.number().describe('Total number of alternatives in the list'),
    sections: z.object({
      hero: z.string().describe('HTML from generate_listicle_hero_section'),
      intro: z.string().optional().describe('Introduction section explaining selection criteria'),
      comparison_table: z.string().optional().describe('HTML from generate_listicle_comparison_table'),
      product_cards: z.array(z.string()).describe('Array of HTML from generate_listicle_product_card for each product'),
      faq: z.string().optional().describe('HTML from generate_faq_section'),
      cta: z.string().optional().describe('HTML from generate_cta_section'),
      custom: z.array(z.string()).optional().describe('Additional custom section HTML'),
    }),
  }),
  execute: async ({ item_id, page_title, seo, brand, total_alternatives, sections }) => {
    // ========================================
    // CRITICAL: Validate required sections
    // ========================================
    const missingSections: string[] = [];
    const invalidSections: string[] = [];
    
    // Helper to check if content is valid
    const isValidSectionContent = (content: string | undefined): boolean => {
      if (!content) return false;
      const trimmed = content.trim();
      if (/^\.{2,}$/.test(trimmed)) return false;
      if (/^\[.*\]$/.test(trimmed)) return false;
      if (trimmed.length < 50) return false;
      if (!trimmed.includes('<')) return false;
      return true;
    };
    
    // Check hero section
    if (!sections.hero) {
      missingSections.push('hero');
    } else if (!isValidSectionContent(sections.hero)) {
      invalidSections.push('hero');
    }
    
    // Check product cards
    if (!sections.product_cards || sections.product_cards.length === 0) {
      missingSections.push('product_cards');
    } else {
      sections.product_cards.forEach((card, index) => {
        if (!isValidSectionContent(card)) {
          invalidSections.push(`product_card_${index + 1}`);
        }
      });
    }
    
    // BLOCK execution if sections contain invalid placeholder content
    if (invalidSections.length > 0) {
      const errorMsg = `INVALID SECTION CONTENT DETECTED: ${invalidSections.join(', ')}

These sections contain placeholder text ("...", "[content]", etc.) instead of actual HTML content.
This is NOT acceptable - you MUST provide the FULL HTML content for each section.

Go back and generate the COMPLETE HTML for each section, then call this tool again.`;
      
      console.error(`[assemble_listicle_page] ERROR: ${errorMsg}`);
      
      return {
        success: false,
        error: errorMsg,
        invalid_sections: invalidSections,
      };
    }
    
    // BLOCK execution if required sections are missing
    if (missingSections.length > 0) {
      const errorMsg = `MISSING REQUIRED SECTIONS: ${missingSections.join(', ')}

You MUST generate these sections before calling assemble_listicle_page.
Current sections provided: ${Object.entries(sections).filter(([_, v]) => v && (Array.isArray(v) ? v.length > 0 : true)).map(([k]) => k).join(', ') || 'none'}`;
      
      console.error(`[assemble_listicle_page] ERROR: ${errorMsg}`);
      
      return {
        success: false,
        error: errorMsg,
        missing_required: missingSections,
      };
    }
    
    // Generate CSS color variables from brand colors
    const primaryColor = brand.primary_color && brand.primary_color.trim() && brand.primary_color.startsWith('#') 
      ? brand.primary_color 
      : '#0ea5e9';
    const secondaryColor = brand.secondary_color && brand.secondary_color.trim() && brand.secondary_color.startsWith('#')
      ? brand.secondary_color 
      : '#8b5cf6';
    
    const primaryHsl = hexToHsl(primaryColor);
    const secondaryHsl = hexToHsl(secondaryColor);
    
    // Build table of contents items
    const tocItems = sections.product_cards.map((_, index) => 
      `<a href="#product-${index + 1}" class="toc-link block py-2 px-3 rounded-lg text-sm">${index + 1}. Product ${index + 1}</a>`
    ).join('\n');
    
    // Generate TOC section
    const tocSection = `
  <!-- Quick Navigation -->
  <section class="py-8 px-4 md:px-6 bg-white border-b border-gray-100">
    <div class="max-w-5xl mx-auto">
      <h2 class="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Jump to:</h2>
      <div class="flex flex-wrap gap-2">
        <a href="#comparison-table" class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors">Quick Comparison</a>
        ${sections.product_cards.map((_, index) => 
          `<a href="#product-${index + 1}" class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors">#${index + 1}</a>`
        ).join('\n        ')}
        ${sections.faq ? '<a href="#faq" class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors">FAQ</a>' : ''}
      </div>
    </div>
  </section>`;

    // Assemble all section HTML in order
    const sectionOrder = [
      sections.hero,
      tocSection,
      sections.intro,
      sections.comparison_table,
      // Wrap product cards in a container - centered with max-width for each card
      `<section id="products-list" class="py-16 md:py-20 px-4 md:px-6 bg-gray-50">
        <div class="max-w-6xl mx-auto">
          <h2 class="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">Detailed Reviews</h2>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            ${sections.product_cards.join('\n')}
          </div>
        </div>
      </section>`,
      sections.faq,
      sections.cta,
      ...(sections.custom || []),
    ].filter(Boolean).join('\n');

    // Generate Schema.org structured data
    const schemaMarkup = generateListicleSchemaMarkup(page_title, seo.meta_description, brand.name, total_alternatives, seo.canonical_url);

    // Build the complete HTML document
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
      /* Primary Brand Color - ONLY for buttons & icons */
      --brand-500: hsl(${primaryHsl.h}, ${primaryHsl.s}%, 50%);
      --brand-600: hsl(${primaryHsl.h}, ${primaryHsl.s}%, 45%);
      --brand-700: hsl(${primaryHsl.h}, ${primaryHsl.s}%, 38%);
      
      /* Secondary Brand Color - ONLY for accent icons */
      --secondary-500: hsl(${secondaryHsl.h}, ${secondaryHsl.s}%, 50%);
      --secondary-600: hsl(${secondaryHsl.h}, ${secondaryHsl.s}%, 45%);
      
      /* Shadow System */
      --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
      --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
      --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    }
    
    body {
      font-family: 'Inter', system-ui, sans-serif;
      color: #171717;
      background-color: white;
    }
    .font-serif {
      font-family: 'Playfair Display', Georgia, serif;
    }
    
    /* Primary Button - with border for better definition */
    .btn-primary {
      background: var(--brand-500);
      color: white;
      font-weight: 600;
      padding: 12px 24px;
      border-radius: 8px;
      border: 2px solid var(--brand-600);
      transition: all 0.2s ease;
      box-shadow: var(--shadow-md);
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .btn-primary:hover {
      background: var(--brand-600);
      border-color: var(--brand-700);
      box-shadow: var(--shadow-lg);
      transform: translateY(-1px);
    }
    
    /* Secondary Button */
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
    
    /* Icon colors */
    .icon-brand { color: var(--brand-500); }
    .icon-secondary { color: var(--secondary-500); }
    .icon-gray { color: #737373; }
    
    /* Brand text */
    .text-brand { color: var(--brand-500); }
    
    /* Brand background - for icons */
    .bg-brand-icon { background: var(--brand-500); color: white; }
    .bg-brand-bg { background: hsl(${primaryHsl.h}, ${primaryHsl.s}%, 97%); }
    
    /* Card */
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
    
    /* Winner badge - Gold/amber for visibility on any brand color */
    .badge-winner {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      color: #92400e;
      border: 1px solid #f59e0b;
      font-weight: 700;
    }
    
    /* FAQ Accordion */
    .faq-item.active .faq-content { display: block; }
    .faq-item.active .faq-icon { transform: rotate(180deg); }
    
    /* TOC Link */
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
    
    /* Status indicators */
    .status-yes { color: var(--brand-500); }
    .status-no { color: #a3a3a3; }
    .status-partial { color: #737373; }
    
    /* Scroll to Top Button */
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
    
    /* Ring for #1 product */
    .ring-brand-icon {
      --tw-ring-color: var(--brand-500);
    }
  </style>
  
  <!-- Schema.org Structured Data -->
  ${schemaMarkup}
</head>
<body class="bg-white text-gray-900 antialiased">
  ${sectionOrder}
  
  <!-- Footer will be added by merge_html_with_site_contexts -->
  
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
  </script>
</body>
</html>`;

    // Save to database
    try {
      const supabase = createServerSupabaseAdmin();
      
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
        product_cards_count: sections.product_cards.length,
        message: `Successfully assembled listicle page with ${sections.product_cards.length} products (${html.length} chars, ${html.split('\n').length} lines)`,
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

// Helper: Generate Schema.org markup for listicle
function generateListicleSchemaMarkup(title: string, description: string, brand: string, totalItems: number, url?: string): string {
  const currentDate = new Date().toISOString().split('T')[0];
  
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": description,
      "articleSection": "Product Reviews",
      "datePublished": currentDate,
      "dateModified": currentDate,
      "author": {
        "@type": "Organization",
        "name": brand,
        "url": url || "/",
      },
      "publisher": {
        "@type": "Organization",
        "name": brand,
        "url": url || "/",
      },
      "isAccessibleForFree": true,
      "inLanguage": "en-US",
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": title,
      "description": description,
      "numberOfItems": totalItems,
      "itemListOrder": "https://schema.org/ItemListOrderDescending",
      "itemListElement": Array.from({ length: totalItems }, (_, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "url": `#product-${i + 1}`
      }))
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "/" },
        { "@type": "ListItem", "position": 2, "name": "Alternatives", "item": "/alternatives" },
        { "@type": "ListItem", "position": 3, "name": "Best Of" }
      ]
    }
  ];
  
  return schemas.map(s => `<script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n</script>`).join('\n  ');
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
