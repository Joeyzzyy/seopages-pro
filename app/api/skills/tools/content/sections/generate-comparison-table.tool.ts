import { tool } from 'ai';
import { z } from 'zod';

/**
 * Generate the Feature Comparison Table section.
 * 
 * MINIMALIST COLOR SYSTEM:
 * - Brand color ONLY for: brand checkmarks, brand name accent
 * - Competitor uses gray (neutral)
 * - No colored backgrounds for summary cards
 * - All CTA links point to brand only
 */
export const generate_comparison_table = tool({
  description: `Generate a Feature Comparison Table section for an alternative page.
  
This section includes:
- Detailed feature-by-feature comparison table
- Visual indicators (checkmarks, badges) for each feature
- Summary cards showing where each product wins (gray backgrounds, no colors)

COLOR RULES:
- Brand checkmarks: brand color (status-yes/icon-brand)
- Competitor checkmarks: gray
- Table backgrounds: white and gray-50 only
- Summary cards: white with gray borders, no colored backgrounds
- NO CTA links to competitors

Returns HTML that can be assembled into the full page.`,
  parameters: z.object({
    brand: z.object({
      name: z.string(),
      logo_url: z.string().optional(),
    }),
    competitor: z.object({
      name: z.string(),
      logo_url: z.string().optional(),
    }),
    features: z.array(z.object({
      name: z.string().describe('Feature name'),
      description: z.string().optional().describe('Feature description (shown on desktop)'),
      brand_value: z.string().describe('Brand support level or value'),
      brand_status: z.enum(['yes', 'partial', 'no', 'badge']).describe('yes=brand check, partial=gray, no=gray x, badge=text'),
      competitor_value: z.string().describe('Competitor support level or value'),
      competitor_status: z.enum(['yes', 'partial', 'no', 'badge']),
    })).min(4).max(15).describe('Feature comparison rows'),
    brand_wins: z.array(z.string()).min(3).max(8).describe('Features where brand wins'),
    competitor_wins: z.array(z.string()).min(3).max(8).describe('Features where competitor wins'),
  }),
  execute: async ({ brand, competitor, features, brand_wins, competitor_wins }) => {
    const brandInitial = brand.name.charAt(0).toUpperCase();
    const competitorInitial = competitor.name.charAt(0).toUpperCase();
    
    // Brand logo uses brand color, competitor uses gray
    const brandLogoHtml = brand.logo_url 
      ? `<img src="${escapeHtml(brand.logo_url)}" alt="${escapeHtml(brand.name)}" class="w-6 h-6 rounded object-contain bg-white" onerror="this.outerHTML='<div class=\\'w-6 h-6 rounded bg-brand-icon flex items-center justify-center\\'><span class=\\'text-xs font-bold text-white\\'>${brandInitial}</span></div>'">`
      : `<div class="w-6 h-6 rounded bg-brand-icon flex items-center justify-center"><span class="text-xs font-bold text-white">${brandInitial}</span></div>`;
    
    const competitorLogoHtml = competitor.logo_url
      ? `<img src="${escapeHtml(competitor.logo_url)}" alt="${escapeHtml(competitor.name)}" class="w-6 h-6 rounded object-contain bg-white" onerror="this.outerHTML='<div class=\\'w-6 h-6 rounded bg-gray-600 flex items-center justify-center\\'><span class=\\'text-xs font-bold text-white\\'>${competitorInitial}</span></div>'">`
      : `<div class="w-6 h-6 rounded bg-gray-600 flex items-center justify-center"><span class="text-xs font-bold text-white">${competitorInitial}</span></div>`;
    
    // Status cell - Brand uses brand color, everything else is gray
    const getBrandStatusHtml = (value: string, status: string) => {
      switch (status) {
        case 'yes':
          return `<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-900 text-xs font-medium">
                    <svg class="w-3 h-3 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    ${escapeHtml(value)}
                  </span>`;
        case 'partial':
          return `<span class="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                    ${escapeHtml(value)}
                  </span>`;
        case 'no':
          return `<span class="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-400 text-xs font-medium">
                    ${escapeHtml(value)}
                  </span>`;
        case 'badge':
        default:
          return `<span class="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                    ${escapeHtml(value)}
                  </span>`;
      }
    };
    
    // Competitor status - All gray
    const getCompetitorStatusHtml = (value: string, status: string) => {
      switch (status) {
        case 'yes':
          return `<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                    <svg class="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    ${escapeHtml(value)}
                  </span>`;
        case 'partial':
          return `<span class="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                    ${escapeHtml(value)}
                  </span>`;
        case 'no':
          return `<span class="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-400 text-xs font-medium">
                    ${escapeHtml(value)}
                  </span>`;
        case 'badge':
        default:
          return `<span class="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                    ${escapeHtml(value)}
                  </span>`;
      }
    };

    // Generate table rows
    const tableRowsHtml = features.map(feature => `
            <tr class="table-row-alt border-b border-gray-100">
              <td class="px-3 md:px-5 py-3 md:py-4">
                <div class="font-medium text-gray-900 text-xs md:text-sm">${escapeHtml(feature.name)}</div>
                ${feature.description ? `<div class="text-xs text-gray-500 mt-0.5 hidden md:block">${escapeHtml(feature.description)}</div>` : ''}
              </td>
              <td class="px-2 md:px-4 py-3 md:py-4 text-center">
                ${getBrandStatusHtml(feature.brand_value, feature.brand_status)}
              </td>
              <td class="px-2 md:px-4 py-3 md:py-4 text-center">
                ${getCompetitorStatusHtml(feature.competitor_value, feature.competitor_status)}
              </td>
            </tr>`).join('');

    // Generate wins list - Brand uses brand color checkmark, competitor uses gray
    const brandWinsHtml = brand_wins.map(w => `
              <li class="flex items-start gap-2">
                <svg class="w-4 h-4 text-brand mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>${escapeHtml(w)}</span>
              </li>`).join('');
    const competitorWinsHtml = competitor_wins.map(w => `
              <li class="flex items-start gap-2">
                <svg class="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>${escapeHtml(w)}</span>
              </li>`).join('');

    const html = `
  <!-- Feature Comparison Table -->
  <section id="comparison" class="py-12 md:py-20 px-4 md:px-6 bg-white">
    <div class="max-w-5xl mx-auto">
      <div class="text-center mb-8 md:mb-12">
        <span class="badge mb-3 md:mb-4">
          Detailed Analysis
        </span>
        <h2 class="font-serif text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 mb-3 md:mb-4">
          Feature-by-Feature Comparison
        </h2>
        <p class="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
          How ${escapeHtml(brand.name)} and ${escapeHtml(competitor.name)} compare across key capabilities.
        </p>
      </div>
      
      <!-- Comparison Table -->
      <div class="overflow-x-auto rounded-xl border border-gray-200 shadow-md -mx-4 md:mx-0">
        <table class="w-full min-w-[500px]">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200">
              <th class="text-left px-3 md:px-5 py-3 md:py-4 font-semibold text-gray-900 text-xs md:text-sm w-2/5">Feature</th>
              <th class="text-center px-2 md:px-4 py-3 md:py-4 w-[30%]">
                <div class="flex items-center justify-center gap-2">
                  ${brandLogoHtml}
                  <span class="font-semibold text-gray-900 text-xs md:text-sm">${escapeHtml(brand.name)}</span>
                </div>
              </th>
              <th class="text-center px-2 md:px-4 py-3 md:py-4 w-[30%]">
                <div class="flex items-center justify-center gap-2">
                  ${competitorLogoHtml}
                  <span class="font-semibold text-gray-600 text-xs md:text-sm">${escapeHtml(competitor.name)}</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </div>
      
      <!-- Feature Comparison Summary - White cards with borders only -->
      <div class="mt-6 md:mt-8 grid md:grid-cols-2 gap-4 md:gap-6">
        <div class="p-4 md:p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
          <h4 class="font-semibold text-gray-900 mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
            <div class="w-6 h-6 flex-shrink-0">${brandLogoHtml}</div>
            ${escapeHtml(brand.name)} Advantages
          </h4>
          <ul class="space-y-1.5 text-xs md:text-sm text-gray-700">
            ${brandWinsHtml}
          </ul>
        </div>
        <div class="p-4 md:p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
          <h4 class="font-semibold text-gray-700 mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
            <div class="w-6 h-6 flex-shrink-0">${competitorLogoHtml}</div>
            ${escapeHtml(competitor.name)} Advantages
          </h4>
          <ul class="space-y-1.5 text-xs md:text-sm text-gray-600">
            ${competitorWinsHtml}
          </ul>
        </div>
      </div>
    </div>
  </section>`;

    return {
      success: true,
      section_id: 'comparison',
      section_name: 'Feature Comparison Table',
      html,
      feature_count: features.length,
      message: `Generated comparison table with ${features.length} features`,
    };
  },
});

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
