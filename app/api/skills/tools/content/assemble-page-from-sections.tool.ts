import { tool } from 'ai';
import { z } from 'zod';
import { getSections, clearSections } from '@/lib/section-storage';
import { createServerSupabaseAdmin } from '@/lib/supabase-server';

/**
 * Assemble a complete HTML page from previously saved sections.
 * 
 * This tool reads all sections from the database that were saved during
 * the page generation process, combines them with page template, and
 * saves the complete page.
 * 
 * Benefits:
 * - Avoids token limit issues by not keeping HTML in context
 * - Each section was generated and saved independently
 * - Final assembly is a simple concatenation operation
 */

const supabase = createServerSupabaseAdmin();

export const assemble_page_from_sections = tool({
  description: `Assemble a complete HTML page from previously saved sections.
  
This tool:
1. Reads all sections saved for a content item from the database
2. Orders them by section_order
3. Combines them into a complete HTML page with proper structure
4. Saves the assembled page to the database

Use this after all individual sections have been generated and saved.
The sections are automatically ordered and combined.

Returns the assembled page info (not the full HTML, to save tokens).`,
  parameters: z.object({
    content_item_id: z.string().describe('Content item ID (UUID)'),
    page_title: z.string().describe('The main page title for SEO'),
    page_type: z.enum(['listicle', 'alternative']).default('listicle').describe('Page type for styling'),
    seo_title: z.string().optional().describe('SEO title (defaults to page_title)'),
    seo_description: z.string().optional().describe('Meta description for SEO'),
    seo_keywords: z.string().optional().describe('Meta keywords (comma-separated)'),
    brand_color: z.string().optional().default('#0ea5e9').describe('Brand primary color (hex)'),
    site_url: z.string().optional().describe('Site URL for canonical tag'),
  }),
  execute: async ({ content_item_id, page_title, page_type, seo_title, seo_description, seo_keywords, brand_color, site_url }) => {
    console.log(`[assemble_page_from_sections] Starting assembly for content item: ${content_item_id}`);
    
    // 1. Read all saved sections from database
    const sections = await getSections(content_item_id);
    
    if (sections.length === 0) {
      return {
        success: false,
        error: 'No sections found. Generate sections first using the section generation tools.',
        content_item_id,
      };
    }
    
    console.log(`[assemble_page_from_sections] Found ${sections.length} sections`);
    
    // 2. Combine section HTML in order
    // For listicle pages, wrap product cards in a grid container
    let sectionsHtml: string;
    
    if (page_type === 'listicle') {
      // Separate sections by type for correct ordering
      const productCards = sections.filter(s => s.section_type === 'product_card');
      const otherSections = sections.filter(s => s.section_type !== 'product_card');
      
      // Define section order by type (not by section_order number which can be buggy)
      // Correct order: Hero → Comparison Table → Product Cards → FAQ → CTA
      const beforeProductTypes = ['hero', 'comparison_table'];
      const afterProductTypes = ['faq', 'cta'];
      
      // Build sections BEFORE products (hero, comparison table)
      const beforeProductsSections = otherSections
        .filter(s => beforeProductTypes.includes(s.section_type))
        .sort((a, b) => a.section_order - b.section_order)
        .map(s => s.section_html)
        .join('\n\n');
      
      // Wrap product cards in container
      const productCardsHtml = productCards.length > 0 
        ? `
  <!-- Product Cards Section -->
  <section id="products-list" class="py-16 md:py-20 px-4 md:px-6 bg-gray-50">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">Detailed Reviews</h2>
      <div class="space-y-6 md:space-y-8">
        ${productCards.map(s => s.section_html).join('\n')}
      </div>
    </div>
  </section>`
        : '';
      
      // Build sections AFTER products (FAQ, CTA) - these should come at the end!
      const afterProductsSections = otherSections
        .filter(s => afterProductTypes.includes(s.section_type))
        .sort((a, b) => a.section_order - b.section_order)
        .map(s => s.section_html)
        .join('\n\n');
      
      // Correct order: before → products → after (FAQ, CTA)
      sectionsHtml = [beforeProductsSections, productCardsHtml, afterProductsSections]
        .filter(Boolean)
        .join('\n\n');
    } else {
      // For other page types, just concatenate
      sectionsHtml = sections
        .map(s => s.section_html)
        .join('\n\n');
    }
    
    // 3. Build complete page HTML
    const html = buildPageHtml({
      page_title,
      page_type,
      seo_title: seo_title || page_title,
      seo_description,
      seo_keywords,
      brand_color: brand_color || '#0ea5e9',
      site_url,
      sectionsHtml,
    });
    
    console.log(`[assemble_page_from_sections] Page assembled: ${html.length} bytes`);
    
    // 4. Save to database
    const { error: updateError } = await supabase
      .from('content_items')
      .update({
        generated_content: html,
        status: 'in_production',
        updated_at: new Date().toISOString(),
      })
      .eq('id', content_item_id);
    
    if (updateError) {
      console.error('[assemble_page_from_sections] Failed to save:', updateError);
      return {
        success: false,
        error: `Failed to save assembled page: ${updateError.message}`,
        content_item_id,
      };
    }
    
    // 5. Optionally clear the temporary sections (keep them for now for debugging)
    // await clearSections(content_item_id);
    
    return {
      success: true,
      content_item_id,
      sections_assembled: sections.length,
      section_types: sections.map(s => s.section_type),
      html_size: html.length,
      message: `Successfully assembled page from ${sections.length} sections (${Math.round(html.length / 1024)}KB). Page saved to database.

NEXT STEPS - You MUST continue with:
1. Call 'merge_html_with_site_contexts' with item_id: "${content_item_id}" to add site header/footer
2. Call 'fix_style_conflicts' with item_id: "${content_item_id}" to isolate styles
3. Call 'save_final_page' with item_id: "${content_item_id}" to finalize and save
DO NOT STOP until 'save_final_page' returns success.`,
    };
  },
});

interface PageBuildOptions {
  page_title: string;
  page_type: 'listicle' | 'alternative';
  seo_title: string;
  seo_description?: string;
  seo_keywords?: string;
  brand_color: string;
  site_url?: string;
  sectionsHtml: string;
}

function buildPageHtml(options: PageBuildOptions): string {
  const { page_title, page_type, seo_title, seo_description, seo_keywords, brand_color, site_url, sectionsHtml } = options;
  
  // Generate CSS custom properties for brand color
  const brandStyles = generateBrandStyles(brand_color);
  
  // Build meta tags
  const metaTags = [
    `<meta charset="UTF-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1.0">`,
    `<title>${escapeHtml(seo_title)}</title>`,
    seo_description ? `<meta name="description" content="${escapeHtml(seo_description)}">` : '',
    seo_keywords ? `<meta name="keywords" content="${escapeHtml(seo_keywords)}">` : '',
    `<meta property="og:title" content="${escapeHtml(seo_title)}">`,
    seo_description ? `<meta property="og:description" content="${escapeHtml(seo_description)}">` : '',
    `<meta property="og:type" content="article">`,
    site_url ? `<meta property="og:url" content="${escapeHtml(site_url)}">` : '',
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(seo_title)}">`,
    seo_description ? `<meta name="twitter:description" content="${escapeHtml(seo_description)}">` : '',
    site_url ? `<link rel="canonical" href="${escapeHtml(site_url)}">` : '',
  ].filter(Boolean).join('\n    ');

  // Page-specific styles
  const pageStyles = page_type === 'listicle' ? listicleStyles : alternativeStyles;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    ${metaTags}
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              brand: '${brand_color}',
            }
          }
        }
      }
    </script>
    <style>
      ${brandStyles}
      ${pageStyles}
    </style>
</head>
<body class="antialiased text-gray-900 bg-white">
    <!-- Page Content - All sections assembled -->
    <main>
    ${sectionsHtml}
    </main>
    
    <!-- Scroll to Top Button -->
    <button id="scrollTop" class="scroll-top-btn fixed bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center z-50" onclick="window.scrollTo({top:0,behavior:'smooth'})" aria-label="Scroll to top">
      <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
      </svg>
    </button>
    
    <script>
      // Scroll to Top Button visibility
      const scrollBtn = document.getElementById('scrollTop');
      window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
          scrollBtn.classList.add('visible');
        } else {
          scrollBtn.classList.remove('visible');
        }
      });
    </script>
</body>
</html>`;
}

function generateBrandStyles(brandColor: string): string {
  // Generate HSL values for better color manipulation
  const hex = brandColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  const hue = Math.round(h * 360);
  const sat = Math.round(s * 100);

  return `
    :root {
      /* Brand Color Palette - Generated from ${brandColor} */
      --brand-color: ${brandColor};
      --brand-color-dark: ${darkenColor(brandColor, 15)};
      --brand-color-light: ${lightenColor(brandColor, 90)};
      
      /* Extended brand palette using HSL */
      --brand-50: hsl(${hue}, ${sat}%, 97%);
      --brand-100: hsl(${hue}, ${sat}%, 92%);
      --brand-200: hsl(${hue}, ${sat}%, 85%);
      --brand-500: hsl(${hue}, ${sat}%, 50%);
      --brand-600: hsl(${hue}, ${sat}%, 45%);
      --brand-700: hsl(${hue}, ${sat}%, 38%);
    }
    
    /* Brand color utilities */
    .bg-brand-icon { background-color: var(--brand-color); }
    .bg-brand-bg { background-color: var(--brand-color-light); }
    .text-brand { color: var(--brand-color); }
    .text-brand-icon { color: var(--brand-color); }
    .ring-brand-icon { --tw-ring-color: var(--brand-color); }
    .border-brand { border-color: var(--brand-color); }
    
    /* Winner badge - Premium gold gradient */
    .badge-winner {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      color: #92400e;
      border: 1px solid #f59e0b;
      font-weight: 700;
      box-shadow: 0 2px 4px rgba(245, 158, 11, 0.2);
    }
    
    /* Primary button - Premium with shadow */
    .btn-primary {
      background: linear-gradient(135deg, var(--brand-color), var(--brand-color-dark));
      color: white;
      font-weight: 600;
      padding: 12px 24px;
      border-radius: 12px;
      border: none;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
    }
    .btn-primary:hover {
      background: linear-gradient(135deg, var(--brand-color-dark), var(--brand-color-dark));
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    }
    .btn-primary:active {
      transform: translateY(0);
    }
    
    /* Secondary button - Clean with border */
    .btn-secondary {
      background-color: white;
      color: #374151;
      font-weight: 600;
      padding: 12px 24px;
      border-radius: 12px;
      border: 1.5px solid #e5e5e5;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
    }
    .btn-secondary:hover {
      background-color: #fafafa;
      border-color: #d4d4d4;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
      transform: translateY(-1px);
    }
    
    /* FAQ accordion - Smooth animations */
    .faq-item {
      transition: all 0.3s ease;
    }
    .faq-item:hover {
      background-color: #fafafa;
    }
    .faq-item.active .faq-content { 
      display: block;
      animation: fadeIn 0.3s ease;
    }
    .faq-item.active .faq-icon { 
      transform: rotate(180deg); 
    }
    .faq-content {
      display: none;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    /* Status indicators for comparison tables */
    .status-yes { color: var(--brand-color); }
    .status-no { color: #a3a3a3; }
    .status-partial { color: #737373; }
    
    /* Product card hover effect */
    article[id^="product-"] {
      transition: all 0.3s ease;
    }
    article[id^="product-"]:hover {
      transform: translateY(-4px);
    }
  `;
}

// Listicle page styles - Premium design matching alternative pages
const listicleStyles = `
  /* Google Fonts - Inter + Playfair Display for premium feel */
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700&display=swap');
  
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
    color: #171717;
  }
  
  /* Serif font for premium headings */
  .font-serif {
    font-family: 'Playfair Display', Georgia, serif;
  }
  
  /* Smooth scroll */
  html { scroll-behavior: smooth; }
  
  /* Section spacing */
  section + section { margin-top: 0; }
  
  /*
   * ===========================================
   * SHADOW SYSTEM - For depth & visual hierarchy
   * ===========================================
   */
  :root {
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }
  
  /*
   * ===========================================
   * CARD SYSTEM - Premium card components
   * ===========================================
   */
  .card {
    background: white;
    border: 1px solid #e5e5e5;
    border-radius: 16px;
    box-shadow: var(--shadow);
    transition: box-shadow 0.3s ease, transform 0.3s ease;
  }
  .card:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-4px);
  }
  
  .card-elevated {
    background: white;
    border-radius: 20px;
    box-shadow: var(--shadow-xl);
  }
  
  /*
   * ===========================================
   * BADGE SYSTEM - Consistent badge styling
   * ===========================================
   */
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
  
  /*
   * ===========================================
   * TABLE STYLING - Premium comparison tables
   * ===========================================
   */
  .table-row-alt:nth-child(even) {
    background-color: #fafafa;
  }
  
  /*
   * ===========================================
   * SECTION BACKGROUNDS
   * ===========================================
   */
  .section-white { background: white; }
  .section-gray { background: #fafafa; }
  
  /*
   * ===========================================
   * SCROLL TO TOP BUTTON
   * ===========================================
   */
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
  
  /*
   * ===========================================
   * ANIMATIONS
   * ===========================================
   */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in-up {
    animation: fadeInUp 0.6s ease-out forwards;
  }
  
  /* Staggered animation delays for sections */
  section:nth-child(1) { animation-delay: 0s; }
  section:nth-child(2) { animation-delay: 0.1s; }
  section:nth-child(3) { animation-delay: 0.2s; }
  section:nth-child(4) { animation-delay: 0.3s; }
`;

// Alternative page styles (1v1 comparison)
const alternativeStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  
  html { scroll-behavior: smooth; }
`;

// Color manipulation helpers
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max((num >> 16) - amt, 0);
  const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
  const B = Math.max((num & 0x0000FF) - amt, 0);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min((num >> 16) + amt, 255);
  const G = Math.min((num >> 8 & 0x00FF) + amt, 255);
  const B = Math.min((num & 0x0000FF) + amt, 255);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
