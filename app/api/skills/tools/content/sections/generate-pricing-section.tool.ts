import { tool } from 'ai';
import { z } from 'zod';

/**
 * Generate the Pricing Comparison section.
 * 
 * MINIMALIST COLOR SYSTEM:
 * - Brand color ONLY for: brand checkmarks, recommended badge (brand only)
 * - Competitor uses gray (neutral)
 * - All backgrounds white/gray only
 * - Depth through shadows, not colors
 */
export const generate_pricing_section = tool({
  description: `Generate a Pricing Comparison section for an alternative page.
  
This section includes:
- Side-by-side pricing cards with clean design
- Plan details and features
- Value analysis summary

COLOR RULES:
- Brand checkmarks: brand color
- Competitor checkmarks: gray
- All backgrounds: white and gray-50 only
- Price text: gray-900 (black) for both
- Recommended badge: brand color for brand, gray for competitor
- NO colored backgrounds, NO violet/purple/green

Returns HTML that can be assembled into the full page.`,
  parameters: z.object({
    brand: z.object({
      name: z.string(),
      logo_url: z.string().optional().describe('URL to the brand logo image'),
      pricing: z.object({
        free_tier: z.boolean().default(false),
        starting_price: z.string().describe('e.g., "$19/mo" or "Contact Sales"'),
        billing_note: z.string().optional().describe('e.g., "billed annually"'),
        plans: z.array(z.object({
          name: z.string(),
          price: z.string(),
          description: z.string(),
          features: z.array(z.string()),
          is_recommended: z.boolean().optional().default(false),
        })).min(1).max(4),
      }),
    }),
    competitor: z.object({
      name: z.string(),
      logo_url: z.string().optional().describe('URL to the competitor logo image'),
      pricing: z.object({
        free_tier: z.boolean().default(false),
        starting_price: z.string(),
        billing_note: z.string().optional(),
        plans: z.array(z.object({
          name: z.string(),
          price: z.string(),
          description: z.string(),
          features: z.array(z.string()),
          is_recommended: z.boolean().optional().default(false),
        })).min(1).max(4),
      }),
    }),
    value_summary: z.string().describe('Summary paragraph about pricing value comparison'),
  }),
  execute: async ({ brand, competitor, value_summary }) => {
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

    // Generate pricing card HTML - Brand uses brand checkmarks, competitor uses gray
    const generateBrandPlanCard = (plan: { name: string; price: string; description: string; features: string[]; is_recommended?: boolean }) => {
      return `
              <div class="bg-white rounded-xl border ${plan.is_recommended ? 'border-gray-300 border-2 shadow-md' : 'border-gray-200'} p-4 md:p-5 relative">
                ${plan.is_recommended ? `<span class="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-brand text-white text-xs font-semibold rounded-full">Recommended</span>` : ''}
                <div class="text-center mb-4">
                  <h4 class="font-semibold text-gray-900 text-sm md:text-base">${escapeHtml(plan.name)}</h4>
                  <div class="text-xl md:text-2xl font-bold text-gray-900 mt-1">${escapeHtml(plan.price)}</div>
                  <p class="text-xs text-gray-500 mt-1">${escapeHtml(plan.description)}</p>
                </div>
                <ul class="space-y-2 text-xs md:text-sm text-gray-600">
                  ${plan.features.map(f => `
                  <li class="flex items-start gap-2">
                    <svg class="w-4 h-4 text-brand mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    <span>${escapeHtml(f)}</span>
                  </li>`).join('')}
                </ul>
              </div>`;
    };

    const generateCompetitorPlanCard = (plan: { name: string; price: string; description: string; features: string[]; is_recommended?: boolean }) => {
      return `
              <div class="bg-white rounded-xl border ${plan.is_recommended ? 'border-gray-300 border-2 shadow-md' : 'border-gray-200'} p-4 md:p-5 relative">
                ${plan.is_recommended ? `<span class="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gray-500 text-white text-xs font-semibold rounded-full">Popular</span>` : ''}
                <div class="text-center mb-4">
                  <h4 class="font-semibold text-gray-900 text-sm md:text-base">${escapeHtml(plan.name)}</h4>
                  <div class="text-xl md:text-2xl font-bold text-gray-900 mt-1">${escapeHtml(plan.price)}</div>
                  <p class="text-xs text-gray-500 mt-1">${escapeHtml(plan.description)}</p>
                </div>
                <ul class="space-y-2 text-xs md:text-sm text-gray-600">
                  ${plan.features.map(f => `
                  <li class="flex items-start gap-2">
                    <svg class="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    <span>${escapeHtml(f)}</span>
                  </li>`).join('')}
                </ul>
              </div>`;
    };

    const brandPlansHtml = brand.pricing.plans.map(p => generateBrandPlanCard(p)).join('');
    const competitorPlansHtml = competitor.pricing.plans.map(p => generateCompetitorPlanCard(p)).join('');

    const html = `
  <!-- Pricing Comparison Section -->
  <section id="pricing" class="py-12 md:py-20 px-4 md:px-6 bg-white">
    <div class="max-w-5xl mx-auto">
      <div class="text-center mb-8 md:mb-12">
        <span class="badge mb-3 md:mb-4">
          Value Analysis
        </span>
        <h2 class="font-serif text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 mb-3 md:mb-4">
          Pricing Comparison
        </h2>
        <p class="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
          Understanding the cost and value each platform offers.
        </p>
      </div>
      
      <div class="grid md:grid-cols-2 gap-6 md:gap-8">
        <!-- Brand Pricing -->
        <div class="bg-gray-50 rounded-2xl p-5 md:p-6 shadow-md">
          <div class="flex items-center gap-3 mb-5">
            ${brandLogoHtml}
            <div class="flex-1 min-w-0">
              <h3 class="font-bold text-gray-900">${escapeHtml(brand.name)}</h3>
              <p class="text-xs text-gray-500">Starting from ${escapeHtml(brand.pricing.starting_price)}${brand.pricing.billing_note ? ` • ${escapeHtml(brand.pricing.billing_note)}` : ''}</p>
            </div>
            ${brand.pricing.free_tier ? `<span class="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded">Free Tier</span>` : ''}
          </div>
          
          <div class="space-y-4">
            ${brandPlansHtml}
          </div>
        </div>
        
        <!-- Competitor Pricing -->
        <div class="bg-gray-50 rounded-2xl p-5 md:p-6 shadow-md">
          <div class="flex items-center gap-3 mb-5">
            ${competitorLogoHtml}
            <div class="flex-1 min-w-0">
              <h3 class="font-bold text-gray-900">${escapeHtml(competitor.name)}</h3>
              <p class="text-xs text-gray-500">Starting from ${escapeHtml(competitor.pricing.starting_price)}${competitor.pricing.billing_note ? ` • ${escapeHtml(competitor.pricing.billing_note)}` : ''}</p>
            </div>
            ${competitor.pricing.free_tier ? `<span class="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded">Free Tier</span>` : ''}
          </div>
          
          <div class="space-y-4">
            ${competitorPlansHtml}
          </div>
        </div>
      </div>
      
      <!-- Value Summary -->
      <div class="mt-6 md:mt-8 p-5 md:p-6 bg-gray-50 rounded-xl shadow-md">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <h4 class="font-semibold text-gray-900 mb-2">Value Analysis</h4>
            <p class="text-sm text-gray-700 leading-relaxed">${escapeHtml(value_summary)}</p>
          </div>
        </div>
      </div>
    </div>
  </section>`;

    return {
      success: true,
      section_id: 'pricing',
      section_name: 'Pricing Comparison Section',
      html,
      message: `Generated pricing comparison between ${brand.name} and ${competitor.name}`,
    };
  },
});

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
