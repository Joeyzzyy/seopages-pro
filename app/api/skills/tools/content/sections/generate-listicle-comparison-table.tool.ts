import { tool } from 'ai';
import { z } from 'zod';

/**
 * Generate a comparison table for all products in a listicle page.
 * 
 * This is a quick-reference table showing key features across all alternatives.
 */
export const generate_listicle_comparison_table = tool({
  description: `Generate a comprehensive comparison table for a listicle page.
  
The comparison table includes:
- All products listed with logos
- Key comparison criteria (features, pricing, rating)
- Visual indicators for feature availability
- Scrollable on mobile

COLOR RULES:
- Brand color ONLY for: your brand row highlighting, checkmarks on brand features
- Everything else: black/white/gray palette

Returns HTML for the comparison table section.`,
  parameters: z.object({
    title: z.string().default('Quick Comparison').describe('Section title'),
    brand_name: z.string().describe('Your brand name (to highlight in table)'),
    products: z.array(z.object({
      rank: z.number().describe('Ranking position'),
      name: z.string().describe('Product name'),
      logo_url: z.string().optional().describe('Product logo URL'),
      starting_price: z.string().optional().describe('Starting price'),
      has_free_tier: z.boolean().optional().describe('Has free tier'),
      rating: z.number().optional().describe('Rating out of 5'),
      features: z.record(z.enum(['yes', 'partial', 'no'])).describe('Feature availability map'),
    })).describe('List of products to compare'),
    feature_names: z.array(z.string()).describe('List of feature names to compare (column headers)'),
  }),
  execute: async ({ title, brand_name, products, feature_names }) => {
    // Generate table headers
    const headerCells = feature_names.map(name => 
      `<th class="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide whitespace-nowrap">${escapeHtml(name)}</th>`
    ).join('');

    // Generate table rows
    const rows = products.map(product => {
      const isBrand = product.name.toLowerCase() === brand_name.toLowerCase();
      const rowClass = isBrand ? 'bg-brand-bg' : '';
      const initial = product.name.charAt(0).toUpperCase();
      
      // Logo
      const logoHtml = product.logo_url 
        ? `<img src="${product.logo_url}" alt="${product.name}" class="w-8 h-8 rounded-lg object-contain bg-white shadow-sm" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><rect fill=%22%23${isBrand ? '0ea5e9' : '6b7280'}%22 width=%2240%22 height=%2240%22 rx=%228%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22central%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2218%22 font-weight=%22bold%22>${initial}</text></svg>'">`
        : `<div class="w-8 h-8 rounded-lg ${isBrand ? 'bg-brand-icon' : 'bg-gray-500'} flex items-center justify-center shadow-sm"><span class="text-sm font-bold text-white">${initial}</span></div>`;
      
      // Rank badge
      const rankBadge = product.rank === 1 
        ? `<span class="ml-2 badge-winner px-1.5 py-0.5 text-[10px] font-bold rounded">#1</span>`
        : `<span class="ml-2 text-xs text-gray-400">#${product.rank}</span>`;
      
      // Rating stars (simplified)
      const rating = product.rating || 4.0;
      const ratingHtml = `
        <div class="flex items-center gap-1">
          <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <span class="text-sm font-medium text-gray-700">${rating.toFixed(1)}</span>
        </div>
      `;
      
      // Feature cells
      const featureCells = feature_names.map(featureName => {
        const status = product.features[featureName] || 'no';
        let statusHtml = '';
        if (status === 'yes') {
          statusHtml = `<svg class="w-5 h-5 ${isBrand ? 'text-brand-icon' : 'text-green-500'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>`;
        } else if (status === 'partial') {
          statusHtml = `<svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01"/></svg>`;
        } else {
          statusHtml = `<svg class="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`;
        }
        return `<td class="px-3 py-3">${statusHtml}</td>`;
      }).join('');

      return `
        <tr class="${rowClass} border-b border-gray-100 hover:bg-gray-50 transition-colors">
          <td class="px-3 py-3 sticky left-0 bg-white ${rowClass}">
            <div class="flex items-center gap-2">
              ${logoHtml}
              <span class="font-medium text-gray-900 whitespace-nowrap">${escapeHtml(product.name)}</span>
              ${rankBadge}
            </div>
          </td>
          <td class="px-3 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
            ${product.starting_price || '—'}
            ${product.has_free_tier ? '<span class="ml-1 text-xs text-green-600">Free tier</span>' : ''}
          </td>
          <td class="px-3 py-3">${ratingHtml}</td>
          ${featureCells}
        </tr>
      `;
    }).join('');

    const html = `
  <!-- Comparison Table Section -->
  <section id="comparison-table" class="py-16 md:py-20 px-4 md:px-6 bg-gray-50">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4">${escapeHtml(title)}</h2>
      <p class="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
        Compare all ${products.length} alternatives at a glance. Scroll horizontally to see all features.
      </p>
      
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[800px]">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200">
                <th class="px-3 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide sticky left-0 bg-gray-50">
                  Product
                </th>
                <th class="px-3 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide whitespace-nowrap">
                  Starting Price
                </th>
                <th class="px-3 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Rating
                </th>
                ${headerCells}
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Legend -->
      <div class="flex flex-wrap items-center justify-center gap-6 mt-6 text-sm text-gray-600">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
          <span>Full support</span>
        </div>
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01"/></svg>
          <span>Partial/Limited</span>
        </div>
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          <span>Not available</span>
        </div>
      </div>
    </div>
  </section>`;

    return {
      success: true,
      section_id: 'comparison-table',
      section_name: 'Comparison Table',
      html,
      message: `Generated comparison table with ${products.length} products and ${feature_names.length} features`,
    };
  },
});

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
