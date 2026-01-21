import { tool } from 'ai';
import { z } from 'zod';

/**
 * Generate the Quick Verdict section for an alternative page.
 * 
 * MINIMALIST COLOR SYSTEM:
 * - Brand color ONLY in: checkmarks, CTA links, winner badge
 * - Everything else: pure black/white/gray
 * - Depth through shadows, not colored backgrounds
 */
export const generate_verdict_section = tool({
  description: `Generate a Quick Verdict / TL;DR section for an alternative page.
  
This section includes:
- Winner announcement or neutral recommendation
- Key comparison stats (3-4 metrics)
- Side-by-side product cards with highlights
- Bottom line summary

COLOR RULES:
- Brand color ONLY for: checkmarks, CTA links/buttons, winner badge
- Card backgrounds: white only
- Section background: white or gray-50 only
- Use shadows for card depth

Returns HTML that can be assembled into the full page.`,
  parameters: z.object({
    brand: z.object({
      name: z.string(),
      logo_url: z.string().optional(),
      tagline: z.string().optional().describe('Short description like "SEO + GEO Workstation"'),
      highlights: z.array(z.string()).describe('4-5 key advantages'),
      best_for: z.string().describe('Target audience description'),
      cta_url: z.string().optional().default('/'),
    }),
    competitor: z.object({
      name: z.string(),
      logo_url: z.string().optional(),
      tagline: z.string().optional(),
      highlights: z.array(z.string()).describe('4-5 key features'),
      best_for: z.string(),
    }),
    verdict: z.object({
      headline: z.string().describe('e.g., "It depends on your needs" or "Brand wins for X"'),
      summary: z.string().describe('2-3 sentence summary of who should use which'),
    }),
    stats: z.array(z.object({
      value: z.string().describe('e.g., "Beta", "$16+", "65+"'),
      label: z.string().describe('e.g., "Status", "Price/mo", "Templates"'),
    })).min(2).max(4).describe('2-4 key comparison metrics'),
    bottom_line: z.string().describe('Final recommendation paragraph'),
  }),
  execute: async ({ brand, competitor, verdict, stats, bottom_line }) => {
    const brandInitial = brand.name.charAt(0).toUpperCase();
    const competitorInitial = competitor.name.charAt(0).toUpperCase();
    
    // Logo with brand color only for brand fallback
    const brandLogoHtml = brand.logo_url 
      ? `<img src="${brand.logo_url}" alt="${brand.name}" class="w-11 h-11 rounded-xl shadow-sm object-contain bg-white" onerror="this.outerHTML='<div class=\\'w-11 h-11 rounded-xl bg-brand-icon flex items-center justify-center shadow-sm\\'><span class=\\'text-lg font-bold text-white\\'>${brandInitial}</span></div>'">`
      : `<div class="w-11 h-11 rounded-xl bg-brand-icon flex items-center justify-center shadow-sm"><span class="text-lg font-bold text-white">${brandInitial}</span></div>`;
    
    // Competitor uses gray
    const competitorLogoHtml = competitor.logo_url
      ? `<img src="${competitor.logo_url}" alt="${competitor.name}" class="w-11 h-11 rounded-xl shadow-sm object-contain bg-white" onerror="this.outerHTML='<div class=\\'w-11 h-11 rounded-xl bg-gray-700 flex items-center justify-center shadow-sm\\'><span class=\\'text-lg font-bold text-white\\'>${competitorInitial}</span></div>'">`
      : `<div class="w-11 h-11 rounded-xl bg-gray-700 flex items-center justify-center shadow-sm"><span class="text-lg font-bold text-white">${competitorInitial}</span></div>`;

    // Stats - Gray text, bold black values
    const statsHtml = stats.map(stat => `
          <div class="bg-white rounded-xl p-3 md:p-5 text-center shadow-md">
            <div class="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 md:mb-2">${escapeHtml(stat.value)}</div>
            <div class="text-xs md:text-sm text-gray-500">${escapeHtml(stat.label)}</div>
          </div>`).join('');

    // Brand highlights - Brand color ONLY for checkmark icon
    const brandHighlightsHtml = brand.highlights.map(h => `
            <div class="flex items-start gap-2 md:gap-3">
              <svg class="w-4 h-4 md:w-5 md:h-5 text-brand mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="text-sm text-gray-700">${escapeHtml(h)}</span>
            </div>`).join('');

    // Competitor highlights - Gray checkmarks
    const competitorHighlightsHtml = competitor.highlights.map(h => `
            <div class="flex items-start gap-2 md:gap-3">
              <svg class="w-4 h-4 md:w-5 md:h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="text-sm text-gray-700">${escapeHtml(h)}</span>
            </div>`).join('');

    const html = `
  <!-- Quick Verdict Section -->
  <section id="verdict" class="py-12 md:py-20 px-4 md:px-6 bg-gray-50">
    <div class="max-w-5xl mx-auto">
      <div class="text-center mb-8 md:mb-12">
        <span class="badge mb-3 md:mb-4">
          TL;DR Summary
        </span>
        <h2 class="font-serif text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 mb-3 md:mb-4">
          Quick Verdict
        </h2>
        <p class="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
          A 60-second summary to help you decide.
        </p>
      </div>
      
      <!-- Winner Announcement - White card with shadow -->
      <div class="bg-white rounded-2xl p-5 md:p-8 lg:p-10 mb-8 md:mb-12 shadow-lg">
        <div class="text-center mb-6 md:mb-8">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 font-semibold text-xs md:text-sm mb-3 md:mb-4">
            <svg class="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Our Recommendation
          </div>
          <h3 class="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 md:mb-4">
            ${escapeHtml(verdict.headline)}
          </h3>
          <p class="text-sm md:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
            ${escapeHtml(verdict.summary)}
          </p>
        </div>
        
        <!-- Stats Grid - White cards with shadow -->
        <div class="grid grid-cols-2 md:grid-cols-${stats.length} gap-3 md:gap-4">
          ${statsHtml}
        </div>
      </div>
      
      <!-- Side by Side Cards -->
      <div class="grid md:grid-cols-2 gap-4 md:gap-6">
        <!-- Brand Card - White with gray border, brand accent only in CTA -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 md:p-6 shadow-md hover:shadow-lg transition-shadow">
          <div class="flex items-center gap-3 mb-4 md:mb-5">
            ${brandLogoHtml}
            <div>
              <h3 class="text-lg md:text-xl font-bold text-gray-900">${escapeHtml(brand.name)}</h3>
              ${brand.tagline ? `<p class="text-xs md:text-sm text-gray-500">${escapeHtml(brand.tagline)}</p>` : ''}
            </div>
          </div>
          
          <div class="space-y-3 mb-6">
            ${brandHighlightsHtml}
          </div>
          
          <div class="pt-4 border-t border-gray-100">
            <p class="text-sm text-gray-600 mb-4">
              <strong class="text-gray-900">Best for:</strong> ${escapeHtml(brand.best_for)}
            </p>
            <a href="${escapeHtml(brand.cta_url || '/')}" class="inline-flex items-center gap-2 text-brand font-semibold hover:opacity-80 transition-opacity">
              Try ${escapeHtml(brand.name)}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </a>
          </div>
        </div>
        
        <!-- Competitor Card - White with gray border, NO CTA to competitor -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 md:p-6 shadow-md hover:shadow-lg transition-shadow">
          <div class="flex items-center gap-3 mb-4 md:mb-5">
            ${competitorLogoHtml}
            <div>
              <h3 class="text-lg md:text-xl font-bold text-gray-900">${escapeHtml(competitor.name)}</h3>
              ${competitor.tagline ? `<p class="text-xs md:text-sm text-gray-500">${escapeHtml(competitor.tagline)}</p>` : ''}
            </div>
          </div>
          
          <div class="space-y-3 mb-6">
            ${competitorHighlightsHtml}
          </div>
          
          <div class="pt-4 border-t border-gray-100">
            <p class="text-sm text-gray-600">
              <strong class="text-gray-900">Best for:</strong> ${escapeHtml(competitor.best_for)}
            </p>
          </div>
        </div>
      </div>
      
      <!-- Bottom Line Summary - White card -->
      <div class="mt-8 md:mt-12 p-5 md:p-8 rounded-2xl bg-white border border-gray-200 shadow-md">
        <div class="flex flex-col md:flex-row items-start gap-4">
          <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <h4 class="font-semibold text-gray-900 mb-2 text-lg">The Bottom Line</h4>
            <p class="text-gray-700 leading-relaxed">
              ${escapeHtml(bottom_line)}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>`;

    return {
      success: true,
      section_id: 'verdict',
      section_name: 'Quick Verdict Section',
      html,
      message: `Generated verdict section comparing ${brand.name} vs ${competitor.name}`,
    };
  },
});

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
