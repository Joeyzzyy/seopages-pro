import { tool } from 'ai';
import { z } from 'zod';

/**
 * Generate the Hero section for an alternative page.
 * 
 * MINIMALIST COLOR SYSTEM:
 * - Brand color ONLY in: primary CTA button, brand name in title
 * - Everything else: pure black/white/gray
 * - Depth through shadows, not colored backgrounds
 */
export const generate_hero_section = tool({
  description: `Generate a premium Hero section for an alternative page.
  
The hero section includes:
- Clean white/gray background with subtle grid pattern
- Main H1 title (e.g., "Seenos.ai vs Writesonic")
- Compelling description
- VS logos display (brand uses brand color only in logo container)
- Primary CTA (brand color) and secondary CTA (white/gray)

COLOR RULES:
- Brand color ONLY for: btn-primary button, brand name text accent
- Everything else: black/white/gray palette
- Use shadows for depth, not colored backgrounds

Returns HTML that can be assembled into the full page.`,
  parameters: z.object({
    brand: z.object({
      name: z.string().describe('Your brand name'),
      logo_url: z.string().optional().describe('Your brand logo URL'),
      tagline: z.string().optional().describe('Brand tagline'),
      primary_color: z.string().optional().default('#0ea5e9').describe('Primary brand color (hex) - ONLY for buttons'),
    }),
    competitor: z.object({
      name: z.string().describe('Competitor name'),
      logo_url: z.string().optional().describe('Competitor logo URL'),
    }),
    seo_description: z.string().optional().describe('Page meta description to show in hero'),
    cta_primary: z.object({
      text: z.string().default('Get Started'),
      url: z.string().default('/'),
    }).optional(),
    // EEAT E01/T05: Author and update info for trust signals
    author: z.object({
      name: z.string().default('Editorial Team').describe('Author or team name'),
      role: z.string().optional().describe('Author role, e.g., "Product Research Team"'),
    }).optional(),
    last_updated: z.string().optional().describe('Last updated date in ISO format'),
  }),
  execute: async ({ brand, competitor, seo_description, cta_primary, author, last_updated }) => {
    const primaryCta = cta_primary || { text: `Try ${brand.name}`, url: '/' };
    const authorInfo = author || { name: 'Editorial Team', role: 'Product Research' };
    const updateDate = last_updated || new Date().toISOString().split('T')[0];
    
    // Generate fallback SVG logos
    const brandInitial = brand.name.charAt(0).toUpperCase();
    const competitorInitial = competitor.name.charAt(0).toUpperCase();
    
    // Logo with brand color ONLY for brand, gray for competitor
    const brandLogoHtml = brand.logo_url 
      ? `<img src="${brand.logo_url}" alt="${brand.name}" class="w-16 h-16 md:w-20 md:h-20 rounded-2xl shadow-lg object-contain bg-white" onerror="this.parentElement.innerHTML='<div class=\\'w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-brand-icon flex items-center justify-center shadow-lg\\'><span class=\\'text-2xl md:text-3xl font-bold text-white\\'>${brandInitial}</span></div>'">`
      : `<div class="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-brand-icon flex items-center justify-center shadow-lg"><span class="text-2xl md:text-3xl font-bold text-white">${brandInitial}</span></div>`;
    
    // Competitor uses neutral gray
    const competitorLogoHtml = competitor.logo_url
      ? `<img src="${competitor.logo_url}" alt="${competitor.name}" class="w-16 h-16 md:w-20 md:h-20 rounded-2xl shadow-lg object-contain bg-white" onerror="this.parentElement.innerHTML='<div class=\\'w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gray-700 flex items-center justify-center shadow-lg\\'><span class=\\'text-2xl md:text-3xl font-bold text-white\\'>${competitorInitial}</span></div>'">`
      : `<div class="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gray-700 flex items-center justify-center shadow-lg"><span class="text-2xl md:text-3xl font-bold text-white">${competitorInitial}</span></div>`;

    const html = `
  <!-- Hero Section -->
  <section class="relative overflow-hidden pt-8 md:pt-12 pb-16 md:pb-24 px-4 md:px-6 bg-white">
    <!-- Subtle Grid Pattern - Grayscale only -->
    <div class="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
    <!-- Top fade for depth -->
    <div class="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-gray-50 to-transparent"></div>
    
    <div class="relative max-w-5xl mx-auto">
      <!-- Breadcrumb - Gray text -->
      <nav class="flex items-center gap-2 text-xs md:text-sm text-gray-500 mb-6 md:mb-8" aria-label="Breadcrumb">
        <a href="/" class="hover:text-gray-900 transition-colors">Home</a>
        <svg class="w-3 h-3 md:w-4 md:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        <a href="/alternatives" class="hover:text-gray-900 transition-colors">Alternatives</a>
        <svg class="w-3 h-3 md:w-4 md:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        <span class="text-gray-700 font-medium">vs ${escapeHtml(competitor.name)}</span>
      </nav>
      
      <!-- VS Logos -->
      <div class="flex items-center justify-center gap-4 md:gap-6 mb-8 md:mb-10">
        <div class="flex flex-col items-center">
          ${brandLogoHtml}
          <span class="mt-2 text-sm font-semibold text-gray-900">${escapeHtml(brand.name)}</span>
        </div>
        <div class="flex flex-col items-center">
          <span class="text-2xl md:text-3xl font-bold text-gray-300">VS</span>
        </div>
        <div class="flex flex-col items-center">
          ${competitorLogoHtml}
          <span class="mt-2 text-sm font-semibold text-gray-700">${escapeHtml(competitor.name)}</span>
        </div>
      </div>
      
      <!-- Title - Brand color ONLY for brand name -->
      <h1 class="text-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4 md:mb-6">
        <span class="text-brand">${escapeHtml(brand.name)}</span> vs ${escapeHtml(competitor.name)}
      </h1>
      
      <!-- Description - Gray text -->
      ${seo_description ? `
      <p class="text-center text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto mb-8 md:mb-10 leading-relaxed">
        ${escapeHtml(seo_description)}
      </p>
      ` : ''}
      
      <!-- CTA - Brand color for primary button -->
      <div class="flex items-center justify-center mb-6 md:mb-8">
        <a href="${escapeHtml(primaryCta.url)}" class="btn-primary px-6 md:px-8 py-3 md:py-4 rounded-xl text-sm md:text-base text-center" style="background: linear-gradient(135deg, var(--brand-color, ${brand.primary_color || '#0ea5e9'}), var(--brand-color-dark, ${brand.primary_color || '#0ea5e9'})); color: white;">
          ${escapeHtml(primaryCta.text)}
        </a>
      </div>
      
      <!-- EEAT E01/T05: Author & Update Info for Trust Signals -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-500">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          <span>By <strong class="text-gray-700">${escapeHtml(authorInfo.name)}</strong>${authorInfo.role ? `, ${escapeHtml(authorInfo.role)}` : ''}</span>
        </div>
        <div class="hidden sm:block w-1 h-1 rounded-full bg-gray-300"></div>
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span>Updated <time datetime="${updateDate}">${new Date(updateDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</time></span>
        </div>
      </div>
    </div>
  </section>`;

    return {
      success: true,
      section_id: 'hero',
      section_name: 'Hero Section',
      html,
      message: `Generated hero section for ${brand.name} vs ${competitor.name}`,
    };
  },
});

function escapeHtml(text: string | undefined | null): string {
  if (!text) return '';
  const map: { [key: string]: string } = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
