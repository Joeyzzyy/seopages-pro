import { tool } from 'ai';
import { z } from 'zod';
import { saveSection } from '@/lib/section-storage';

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

Returns a confirmation that the section was saved. The HTML is stored in the database to avoid token limits.`,
  parameters: z.object({
    content_item_id: z.string().describe('Content item ID (UUID) for storing the section'),
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
    site_url: z.string().optional().describe('Site URL for generating team name from domain'),
    last_updated: z.string().optional().describe('Last updated date in ISO format'),
  }),
  execute: async ({ content_item_id, brand, title, description, total_alternatives, cta_primary, author, site_url, last_updated }) => {
    const primaryCta = cta_primary || { text: `Try ${brand.name} Free`, url: '/' };
    
    // Generate author name from site_url domain (e.g., seenos.ai -> "Seenos Team")
    let authorName = 'Editorial Team';
    if (site_url) {
      try {
        const url = new URL(site_url);
        const domain = url.hostname.replace(/^www\./, '');
        const domainName = domain.split('.')[0]; // Get first part before TLD
        authorName = domainName.charAt(0).toUpperCase() + domainName.slice(1) + ' Team';
      } catch {
        authorName = brand.name + ' Team';
      }
    } else {
      authorName = brand.name + ' Team';
    }
    
    const authorInfo = author || { name: authorName, role: 'Product Research' };
    const updateDate = last_updated || new Date().toISOString().split('T')[0];
    
    // Generate fallback SVG logo
    const brandInitial = brand.name.charAt(0).toUpperCase();
    
    const brandLogoHtml = brand.logo_url 
      ? `<img src="${brand.logo_url}" alt="${brand.name}" class="w-12 h-12 rounded-xl shadow-md object-contain bg-white" onerror="this.parentElement.innerHTML='<div class=\\'w-12 h-12 rounded-xl bg-brand-icon flex items-center justify-center shadow-md\\'><span class=\\'text-xl font-bold text-white\\'>${brandInitial}</span></div>'">`
      : `<div class="w-12 h-12 rounded-xl bg-brand-icon flex items-center justify-center shadow-md"><span class="text-xl font-bold text-white">${brandInitial}</span></div>`;

    const html = `
  <!-- Listicle Hero Section - Premium Design -->
  <section class="relative overflow-hidden pt-8 md:pt-12 pb-20 md:pb-28 px-4 md:px-6 bg-gradient-to-b from-gray-50 via-white to-white">
    <!-- Premium Background Effects -->
    <div class="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.02)_1px,transparent_1px)] bg-[size:48px_48px]"></div>
    <div class="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-brand-color/5 to-transparent rounded-full blur-3xl"></div>
    <div class="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-tl from-gray-200/30 to-transparent rounded-full blur-3xl"></div>
    
    <div class="relative max-w-5xl mx-auto">
      <!-- Breadcrumb - Premium styling -->
      <nav class="flex items-center gap-2 text-xs md:text-sm text-gray-500 mb-8 md:mb-10" aria-label="Breadcrumb">
        <a href="/" class="hover:text-gray-900 transition-colors font-medium">Home</a>
        <svg class="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        <a href="/alternatives" class="hover:text-gray-900 transition-colors font-medium">Alternatives</a>
        <svg class="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        <span class="text-gray-900 font-semibold">Best Of</span>
      </nav>
      
      <!-- Title - Serif font for premium feel -->
      <h1 class="text-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6 md:mb-8 font-serif">
        ${escapeHtml(title)}
      </h1>
      
      <!-- Description - Better typography -->
      <p class="text-center text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto mb-10 md:mb-12 leading-relaxed">
        ${escapeHtml(description)}
      </p>
      
      <!-- CTA Button - Single primary CTA (no icon) -->
      <div class="flex items-center justify-center mb-10 md:mb-12">
        <a href="${escapeHtml(primaryCta.url)}" class="btn-primary px-10 py-4 rounded-2xl text-base font-semibold shadow-lg" style="background: linear-gradient(135deg, var(--brand-color, ${brand.primary_color || '#0ea5e9'}), var(--brand-color-dark, ${brand.primary_color || '#0ea5e9'})); color: white;">
          ${escapeHtml(primaryCta.text)}
        </a>
      </div>
      
      <!-- Quick Stats - Card style -->
      <div class="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-10 md:mb-12">
        <div class="flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-xl shadow-sm border border-gray-100 text-sm text-gray-700">
          <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span class="font-medium">Hands-on testing</span>
        </div>
        <div class="flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-xl shadow-sm border border-gray-100 text-sm text-gray-700">
          <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span class="font-medium">Pricing compared</span>
        </div>
        <div class="flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-xl shadow-sm border border-gray-100 text-sm text-gray-700">
          <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
          </svg>
          <span class="font-medium">Fair & unbiased</span>
        </div>
      </div>
      
      <!-- Author & Update Info - Premium card -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100 max-w-xl mx-auto">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <div class="text-left">
            <span class="text-sm font-semibold text-gray-900 block">${escapeHtml(authorInfo.name)}</span>
            ${authorInfo.role ? `<span class="text-xs text-gray-500">${escapeHtml(authorInfo.role)}</span>` : ''}
          </div>
        </div>
        <div class="hidden sm:block w-px h-8 bg-gray-200"></div>
        <div class="flex items-center gap-2 text-sm">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span class="text-gray-600">Updated <time datetime="${updateDate}" class="font-semibold text-gray-900">${new Date(updateDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</time></span>
        </div>
      </div>
    </div>
  </section>`;

    // Save to database instead of returning HTML
    const sectionId = 'listicle-hero';
    const saveResult = await saveSection({
      content_item_id,
      section_id: sectionId,
      section_type: 'hero',
      section_order: 0, // Hero is always first
      section_html: html,
      metadata: {
        title,
        brand_name: brand.name,
        total_alternatives,
      },
    });

    if (!saveResult.success) {
      return {
        success: false,
        error: saveResult.error,
        message: `Failed to save hero section`,
      };
    }

    // Return concise info - NO HTML in response to save tokens
    return {
      success: true,
      section_id: sectionId,
      section_saved: true,
      title,
      message: `Saved listicle hero section: ${title}`,
    };
  },
});

function escapeHtml(text: string | undefined | null): string {
  if (!text) return '';
  const map: { [key: string]: string } = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
