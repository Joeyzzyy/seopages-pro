import { tool } from 'ai';
import { z } from 'zod';

/**
 * Generate the Pros & Cons comparison section.
 * 
 * MINIMALIST COLOR SYSTEM:
 * - Brand color ONLY for: brand checkmarks
 * - Competitor uses gray
 * - Cons use gray (not red) for both
 * - All backgrounds white/gray only
 */
export const generate_pros_cons_section = tool({
  description: `Generate a Pros & Cons section for an alternative page.
  
This section includes:
- Side-by-side pros and cons lists for both products
- Brand and competitor logos
- Clean visual indicators

COLOR RULES:
- Brand pros checkmarks: brand color
- Competitor pros checkmarks: gray
- Cons X marks: gray for both (not red)
- All backgrounds: white and gray-50 only
- NO colored badges, NO rose/red/green headers

Returns HTML that can be assembled into the full page.`,
  parameters: z.object({
    brand: z.object({
      name: z.string(),
      logo_url: z.string().optional().describe('URL to the brand logo image'),
      pros: z.array(z.string()).min(3).max(7).describe('3-7 advantages'),
      cons: z.array(z.string()).min(2).max(5).describe('2-5 disadvantages'),
    }),
    competitor: z.object({
      name: z.string(),
      logo_url: z.string().optional().describe('URL to the competitor logo image'),
      pros: z.array(z.string()).min(3).max(7),
      cons: z.array(z.string()).min(2).max(5),
    }),
  }),
  execute: async ({ brand, competitor }) => {
    const brandInitial = brand.name.charAt(0).toUpperCase();
    const competitorInitial = competitor.name.charAt(0).toUpperCase();

    // Brand logo - uses brand color for fallback
    const brandLogoHtml = brand.logo_url 
      ? `<img src="${escapeHtml(brand.logo_url)}" alt="${escapeHtml(brand.name)}" class="w-10 h-10 rounded-xl object-contain bg-white shadow-sm" onerror="this.outerHTML='<div class=\\'w-10 h-10 rounded-xl bg-brand-icon flex items-center justify-center shadow-sm\\'><span class=\\'text-lg font-bold text-white\\'>${brandInitial}</span></div>'">`
      : `<div class="w-10 h-10 rounded-xl bg-brand-icon flex items-center justify-center shadow-sm"><span class="text-lg font-bold text-white">${brandInitial}</span></div>`;
    
    // Competitor logo - uses gray for fallback
    const competitorLogoHtml = competitor.logo_url
      ? `<img src="${escapeHtml(competitor.logo_url)}" alt="${escapeHtml(competitor.name)}" class="w-10 h-10 rounded-xl object-contain bg-white shadow-sm" onerror="this.outerHTML='<div class=\\'w-10 h-10 rounded-xl bg-gray-600 flex items-center justify-center shadow-sm\\'><span class=\\'text-lg font-bold text-white\\'>${competitorInitial}</span></div>'">`
      : `<div class="w-10 h-10 rounded-xl bg-gray-600 flex items-center justify-center shadow-sm"><span class="text-lg font-bold text-white">${competitorInitial}</span></div>`;

    // Brand card - brand color checkmarks for pros
    const brandCardHtml = `
          <div class="bg-gray-50 rounded-xl p-5 md:p-6 shadow-md">
            <div class="flex items-center gap-3 mb-5">
              ${brandLogoHtml}
              <h3 class="font-bold text-gray-900 text-lg">${escapeHtml(brand.name)}</h3>
            </div>
            
            <!-- Pros -->
            <div class="mb-5">
              <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <svg class="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
                </svg>
                Pros
              </h4>
              <ul class="space-y-2.5">
                ${brand.pros.map(p => `
                <li class="flex items-start gap-2">
                  <svg class="w-4 h-4 text-brand mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  <span class="text-sm text-gray-700">${escapeHtml(p)}</span>
                </li>`).join('')}
              </ul>
            </div>
            
            <!-- Cons -->
            <div>
              <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"/>
                </svg>
                Cons
              </h4>
              <ul class="space-y-2.5">
                ${brand.cons.map(c => `
                <li class="flex items-start gap-2">
                  <svg class="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                  <span class="text-sm text-gray-700">${escapeHtml(c)}</span>
                </li>`).join('')}
              </ul>
            </div>
          </div>`;

    // Competitor card - gray checkmarks for pros
    const competitorCardHtml = `
          <div class="bg-gray-50 rounded-xl p-5 md:p-6 shadow-md">
            <div class="flex items-center gap-3 mb-5">
              ${competitorLogoHtml}
              <h3 class="font-bold text-gray-900 text-lg">${escapeHtml(competitor.name)}</h3>
            </div>
            
            <!-- Pros -->
            <div class="mb-5">
              <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
                </svg>
                Pros
              </h4>
              <ul class="space-y-2.5">
                ${competitor.pros.map(p => `
                <li class="flex items-start gap-2">
                  <svg class="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  <span class="text-sm text-gray-700">${escapeHtml(p)}</span>
                </li>`).join('')}
              </ul>
            </div>
            
            <!-- Cons -->
            <div>
              <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"/>
                </svg>
                Cons
              </h4>
              <ul class="space-y-2.5">
                ${competitor.cons.map(c => `
                <li class="flex items-start gap-2">
                  <svg class="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                  <span class="text-sm text-gray-700">${escapeHtml(c)}</span>
                </li>`).join('')}
              </ul>
            </div>
          </div>`;

    const html = `
  <!-- Pros & Cons Section -->
  <section id="pros-cons" class="py-12 md:py-20 px-4 md:px-6 bg-white">
    <div class="max-w-5xl mx-auto">
      <div class="text-center mb-8 md:mb-12">
        <span class="badge mb-3 md:mb-4">
          Honest Assessment
        </span>
        <h2 class="font-serif text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 mb-3 md:mb-4">
          Pros & Cons
        </h2>
        <p class="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
          An honest look at what each platform does well and where they could improve.
        </p>
      </div>
      
      <div class="grid md:grid-cols-2 gap-6 md:gap-8">
        ${brandCardHtml}
        ${competitorCardHtml}
      </div>
    </div>
  </section>`;

    return {
      success: true,
      section_id: 'pros-cons',
      section_name: 'Pros & Cons Section',
      html,
      message: `Generated pros/cons comparison for ${brand.name} vs ${competitor.name}`,
    };
  },
});

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
