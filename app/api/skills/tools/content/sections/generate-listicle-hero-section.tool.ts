import { tool } from 'ai';
import { z } from 'zod';

/**
 * Generate the Hero section for a listicle/best-of page.
 * 
 * MINIMALIST COLOR SYSTEM:
 * - Brand color ONLY in: primary CTA button, brand highlight
 * - Everything else: pure black/white/gray
 * - Depth through shadows, not colored backgrounds
 */
export const generate_listicle_hero_section = tool({
  description: `Generate a premium Hero section for a listicle/best-of page.
  
The hero section includes:
- Clean white/gray background with subtle grid pattern
- Main H1 title (e.g., "Top 10 Best Writesonic Alternatives in 2025")
- Compelling description explaining selection criteria
- Number badge showing how many alternatives
- Primary CTA button
- Author and last updated info for EEAT

COLOR RULES:
- Brand color ONLY for: btn-primary button, brand name text accent
- Everything else: black/white/gray palette
- Use shadows for depth, not colored backgrounds

Returns HTML that can be assembled into the full page.`,
  parameters: z.object({
    brand: z.object({
      name: z.string().describe('Your brand name (the main product being compared)'),
      logo_url: z.string().optional().describe('Your brand logo URL'),
      primary_color: z.string().optional().default('#0ea5e9').describe('Primary brand color (hex) - ONLY for buttons'),
    }),
    title: z.string().describe('Page title, e.g., "Top 10 Best Writesonic Alternatives in 2025"'),
    description: z.string().describe('Compelling description explaining what readers will learn'),
    total_alternatives: z.number().describe('Total number of alternatives being compared'),
    cta_primary: z.object({
      text: z.string().default('Try #1 Pick Free'),
      url: z.string().default('/'),
    }).optional(),
    author: z.object({
      name: z.string().default('Editorial Team').describe('Author or team name'),
      role: z.string().optional().describe('Author role, e.g., "Product Research Team"'),
    }).optional(),
    last_updated: z.string().optional().describe('Last updated date in ISO format'),
  }),
  execute: async ({ brand, title, description, total_alternatives, cta_primary, author, last_updated }) => {
    const primaryCta = cta_primary || { text: `Try ${brand.name} Free`, url: '/' };
    const authorInfo = author || { name: 'Editorial Team', role: 'Product Research' };
    const updateDate = last_updated || new Date().toISOString().split('T')[0];
    
    // Generate fallback SVG logo
    const brandInitial = brand.name.charAt(0).toUpperCase();
    
    const brandLogoHtml = brand.logo_url 
      ? `<img src="${brand.logo_url}" alt="${brand.name}" class="w-12 h-12 rounded-xl shadow-md object-contain bg-white" onerror="this.parentElement.innerHTML='<div class=\\'w-12 h-12 rounded-xl bg-brand-icon flex items-center justify-center shadow-md\\'><span class=\\'text-xl font-bold text-white\\'>${brandInitial}</span></div>'">`
      : `<div class="w-12 h-12 rounded-xl bg-brand-icon flex items-center justify-center shadow-md"><span class="text-xl font-bold text-white">${brandInitial}</span></div>`;

    const html = `
  <!-- Listicle Hero Section -->
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
        <span class="text-gray-700 font-medium">Best Of</span>
      </nav>
      
      <!-- Badge + Logo Row -->
      <div class="flex items-center justify-center gap-4 mb-8 md:mb-10">
        <div class="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-full shadow-sm border border-gray-100">
          <span class="flex items-center justify-center w-8 h-8 bg-brand-icon text-white rounded-full text-sm font-bold">${total_alternatives}</span>
          <span class="text-sm font-medium text-gray-700">Alternatives Compared</span>
        </div>
      </div>
      
      <!-- Title -->
      <h1 class="text-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4 md:mb-6">
        ${escapeHtml(title)}
      </h1>
      
      <!-- Description - Gray text -->
      <p class="text-center text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto mb-8 md:mb-10 leading-relaxed">
        ${escapeHtml(description)}
      </p>
      
      <!-- CTA - Brand color for primary button -->
      <div class="flex items-center justify-center mb-6 md:mb-8">
        <a href="${escapeHtml(primaryCta.url)}" class="btn-primary px-6 md:px-8 py-3 md:py-4 rounded-xl text-sm md:text-base text-center">
          ${escapeHtml(primaryCta.text)}
        </a>
      </div>
      
      <!-- Quick Stats -->
      <div class="flex flex-wrap items-center justify-center gap-4 md:gap-8 mb-6 md:mb-8">
        <div class="flex items-center gap-2 text-sm text-gray-600">
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>Hands-on testing</span>
        </div>
        <div class="flex items-center gap-2 text-sm text-gray-600">
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>Pricing compared</span>
        </div>
        <div class="flex items-center gap-2 text-sm text-gray-600">
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
          </svg>
          <span>Fair & unbiased</span>
        </div>
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
      section_id: 'listicle-hero',
      section_name: 'Listicle Hero Section',
      html,
      message: `Generated listicle hero section: ${title}`,
    };
  },
});

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
