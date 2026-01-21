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
    cta_secondary: z.object({
      text: z.string().default('See Comparison'),
      url: z.string().default('#comparison'),
    }).optional(),
  }),
  execute: async ({ brand, competitor, seo_description, cta_primary, cta_secondary }) => {
    const primaryCta = cta_primary || { text: `Try ${brand.name}`, url: '/' };
    const secondaryCta = cta_secondary || { text: 'See Comparison', url: '#comparison' };
    
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
  <section class="relative overflow-hidden pt-20 md:pt-28 pb-16 md:pb-24 px-4 md:px-6 bg-white">
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
      
      <!-- CTAs - Brand color ONLY for primary button -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
        <a href="${escapeHtml(primaryCta.url)}" class="w-full sm:w-auto btn-primary px-6 md:px-8 py-3 md:py-4 rounded-xl text-sm md:text-base text-center">
          ${escapeHtml(primaryCta.text)}
        </a>
        <a href="${escapeHtml(secondaryCta.url)}" class="w-full sm:w-auto btn-secondary px-6 md:px-8 py-3 md:py-4 rounded-xl text-sm md:text-base text-center">
          ${escapeHtml(secondaryCta.text)}
        </a>
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

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
