import { tool } from 'ai';
import { z } from 'zod';

/**
 * Generate a single product card for a listicle/best-of page.
 * 
 * Each card shows detailed information about one alternative product.
 * The brand product (rank #1) gets special styling highlighting.
 */
export const generate_listicle_product_card = tool({
  description: `Generate a detailed product card for a listicle page.
  
Each product card includes:
- Rank badge (with special styling for #1)
- Product logo and name
- Brief description
- Key features (4-6 highlights)
- Pricing information
- Pros and cons
- Best for use cases
- CTA button (only for your brand)

COLOR RULES:
- Brand color ONLY for: CTA button on your brand's card, rank #1 badge
- Everything else: black/white/gray palette
- Use shadows for depth and hierarchy

Returns HTML for a single product card.`,
  parameters: z.object({
    rank: z.number().describe('Ranking position (1 = best/your brand)'),
    is_brand: z.boolean().describe('Whether this is your brand (the product you are promoting)'),
    product: z.object({
      name: z.string().describe('Product name'),
      logo_url: z.string().optional().describe('Product logo URL'),
      tagline: z.string().optional().describe('Short tagline or description'),
      website_url: z.string().optional().describe('Product website URL'),
      description: z.string().describe('Detailed description (2-3 sentences)'),
      features: z.array(z.string()).describe('Key features (4-6 items)'),
      pricing: z.object({
        starting_price: z.string().optional().describe('Starting price, e.g., "$29/mo"'),
        free_tier: z.boolean().optional().describe('Whether free tier is available'),
        pricing_model: z.string().optional().describe('e.g., "Per user/month", "Flat rate"'),
      }).optional(),
      pros: z.array(z.string()).describe('Advantages (3-5 items)'),
      cons: z.array(z.string()).describe('Disadvantages (2-3 items)'),
      best_for: z.string().describe('Who should use this product'),
      rating: z.number().optional().describe('Rating out of 5'),
    }),
    brand_primary_color: z.string().optional().default('#0ea5e9').describe('Brand primary color for CTA buttons'),
  }),
  execute: async ({ rank, is_brand, product, brand_primary_color }) => {
    const initial = product.name.charAt(0).toUpperCase();
    
    // Logo HTML with fallback
    const logoHtml = product.logo_url 
      ? `<img src="${product.logo_url}" alt="${product.name}" class="w-14 h-14 rounded-xl shadow-md object-contain bg-white" onerror="this.parentElement.innerHTML='<div class=\\'w-14 h-14 rounded-xl ${is_brand ? 'bg-brand-icon' : 'bg-gray-600'} flex items-center justify-center shadow-md\\'><span class=\\'text-xl font-bold text-white\\'>${initial}</span></div>'">`
      : `<div class="w-14 h-14 rounded-xl ${is_brand ? 'bg-brand-icon' : 'bg-gray-600'} flex items-center justify-center shadow-md"><span class="text-xl font-bold text-white">${initial}</span></div>`;
    
    // Rank badge styling
    const rankBadgeClass = rank === 1 
      ? 'bg-brand-icon text-white' 
      : 'bg-gray-200 text-gray-700';
    
    // Winner badge for #1
    const winnerBadge = rank === 1 
      ? `<span class="badge-winner px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">Top Pick</span>` 
      : '';
    
    // Rating stars
    const rating = product.rating || 4.5;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const starsHtml = Array(5).fill(0).map((_, i) => {
      if (i < fullStars) return `<svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`;
      if (i === fullStars && hasHalfStar) return `<svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><defs><linearGradient id="half-${rank}"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="#D1D5DB"/></linearGradient></defs><path fill="url(#half-${rank})" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`;
      return `<svg class="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`;
    }).join('');

    // Features list
    const featuresHtml = product.features.slice(0, 6).map(feature => `
      <li class="flex items-start gap-2 text-sm text-gray-600">
        <svg class="w-5 h-5 ${is_brand ? 'text-brand-icon' : 'text-gray-400'} mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        <span>${escapeHtml(feature)}</span>
      </li>
    `).join('');

    // Pros list
    const prosHtml = product.pros.slice(0, 4).map(pro => `
      <li class="flex items-start gap-2 text-sm text-gray-600">
        <svg class="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        <span>${escapeHtml(pro)}</span>
      </li>
    `).join('');

    // Cons list
    const consHtml = product.cons.slice(0, 3).map(con => `
      <li class="flex items-start gap-2 text-sm text-gray-600">
        <svg class="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
        <span>${escapeHtml(con)}</span>
      </li>
    `).join('');

    // CTA button - only for brand product
    const ctaHtml = is_brand 
      ? `<a href="${product.website_url || '/'}" class="btn-primary w-full py-3 rounded-xl text-sm font-semibold text-center mt-4">
          Try ${escapeHtml(product.name)} Free
        </a>`
      : `<div class="w-full py-3 text-center text-sm text-gray-500 mt-4">
          <a href="${product.website_url || '#'}" target="_blank" rel="nofollow noopener" class="hover:text-gray-700 transition-colors">
            Visit Website →
          </a>
        </div>`;

    // Pricing display
    const pricingHtml = product.pricing ? `
      <div class="flex items-center gap-2 text-sm">
        <span class="font-semibold text-gray-900">${product.pricing.starting_price || 'Contact'}</span>
        ${product.pricing.free_tier ? '<span class="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Free tier</span>' : ''}
        ${product.pricing.pricing_model ? `<span class="text-gray-500">${product.pricing.pricing_model}</span>` : ''}
      </div>
    ` : '';

    // Card border/styling based on rank
    const cardBorderClass = rank === 1 
      ? 'ring-2 ring-brand-icon ring-offset-2' 
      : 'border border-gray-200';

    const html = `
  <!-- Product Card #${rank}: ${product.name} -->
  <article id="product-${rank}" class="bg-white rounded-2xl ${cardBorderClass} shadow-lg hover:shadow-xl transition-shadow p-6 md:p-8">
    <!-- Header -->
    <div class="flex items-start gap-4 mb-6">
      <!-- Rank Badge -->
      <div class="flex-shrink-0 w-10 h-10 ${rankBadgeClass} rounded-full flex items-center justify-center font-bold text-lg shadow-sm">
        ${rank}
      </div>
      
      <!-- Logo & Title -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-3 mb-2">
          ${logoHtml}
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-xl font-bold text-gray-900">${escapeHtml(product.name)}</h3>
              ${winnerBadge}
            </div>
            ${product.tagline ? `<p class="text-sm text-gray-500">${escapeHtml(product.tagline)}</p>` : ''}
          </div>
        </div>
        
        <!-- Rating -->
        <div class="flex items-center gap-2">
          <div class="flex items-center">${starsHtml}</div>
          <span class="text-sm text-gray-600 font-medium">${rating.toFixed(1)}</span>
        </div>
      </div>
    </div>
    
    <!-- Description -->
    <p class="text-gray-600 mb-6 leading-relaxed">
      ${escapeHtml(product.description)}
    </p>
    
    <!-- Key Features -->
    <div class="mb-6">
      <h4 class="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Key Features</h4>
      <ul class="grid grid-cols-1 md:grid-cols-2 gap-2">
        ${featuresHtml}
      </ul>
    </div>
    
    <!-- Pricing -->
    <div class="mb-6 p-4 bg-gray-50 rounded-xl">
      <h4 class="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">Pricing</h4>
      ${pricingHtml}
    </div>
    
    <!-- Pros & Cons -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div>
        <h4 class="text-sm font-semibold text-green-700 uppercase tracking-wide mb-3">Pros</h4>
        <ul class="space-y-2">${prosHtml}</ul>
      </div>
      <div>
        <h4 class="text-sm font-semibold text-red-600 uppercase tracking-wide mb-3">Cons</h4>
        <ul class="space-y-2">${consHtml}</ul>
      </div>
    </div>
    
    <!-- Best For -->
    <div class="p-4 bg-gray-50 rounded-xl mb-4">
      <h4 class="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">Best For</h4>
      <p class="text-sm text-gray-600">${escapeHtml(product.best_for)}</p>
    </div>
    
    <!-- CTA -->
    ${ctaHtml}
  </article>`;

    return {
      success: true,
      section_id: `product-card-${rank}`,
      section_name: `Product Card #${rank}: ${product.name}`,
      html,
      message: `Generated product card for ${product.name} (rank #${rank})`,
    };
  },
});

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
