import { tool } from 'ai';
import { z } from 'zod';
import { saveSection } from '@/lib/section-storage';

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

Returns a confirmation that the section was saved. The HTML is stored in the database to avoid token limits.`,
  parameters: z.object({
    content_item_id: z.string().describe('Content item ID (UUID) for storing the section'),
    rank: z.number().describe('Ranking position (1 = best/your brand)'),
    is_brand: z.boolean().describe('Whether this is your brand (the product you are promoting)'),
    product: z.object({
      name: z.string().describe('Product name'),
      logo_url: z.string().nullish().describe('Product logo URL'),
      screenshot_url: z.string().nullish().describe('Homepage screenshot URL (from research_product_deep)'),
      tagline: z.string().nullish().describe('Short tagline or description'),
      website_url: z.string().nullish().describe('Product website URL'),
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
  execute: async ({ content_item_id, rank, is_brand, product, brand_primary_color }) => {
    const initial = product.name.charAt(0).toUpperCase();
    
    // Logo HTML with fallback
    const logoHtml = product.logo_url 
      ? `<img src="${product.logo_url}" alt="${product.name}" class="w-14 h-14 rounded-xl shadow-md object-contain bg-white" onerror="this.parentElement.innerHTML='<div class=\\'w-14 h-14 rounded-xl ${is_brand ? 'bg-brand-icon' : 'bg-gray-600'} flex items-center justify-center shadow-md\\'><span class=\\'text-xl font-bold text-white\\'>${initial}</span></div>'">`
      : `<div class="w-14 h-14 rounded-xl ${is_brand ? 'bg-brand-icon' : 'bg-gray-600'} flex items-center justify-center shadow-md"><span class="text-xl font-bold text-white">${initial}</span></div>`;
    
    // Rank badge styling - use inline style for #1 to ensure visibility
    const rankBadgeClass = rank === 1 
      ? 'text-white' 
      : 'bg-gray-200 text-gray-700';
    const rankBadgeStyle = rank === 1 
      ? `style="background: var(--brand-500, ${brand_primary_color}); color: white;"` 
      : '';
    
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

    // Card border/styling based on rank - Premium styling
    const cardBorderClass = rank === 1 
      ? 'ring-2 ring-brand-icon ring-offset-4 shadow-2xl' 
      : 'border border-gray-100 shadow-lg hover:shadow-xl';
    
    // Special background for winner
    const cardBgClass = rank === 1 
      ? 'bg-gradient-to-br from-white to-gray-50/50' 
      : 'bg-white';

    const html = `
  <!-- Product Card #${rank}: ${product.name} -->
  <article id="product-${rank}" class="${cardBgClass} rounded-3xl ${cardBorderClass} transition-all duration-300 p-6 md:p-8 relative overflow-hidden">
    ${rank === 1 ? `
    <!-- Winner accent decoration -->
    <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100/50 to-transparent rounded-bl-full pointer-events-none"></div>
    ` : ''}
    
    <!-- Header -->
    <div class="flex items-start gap-4 mb-6 relative">
      <!-- Rank Badge - Premium styling -->
      <div class="flex-shrink-0 w-12 h-12 ${rankBadgeClass} rounded-2xl flex items-center justify-center font-bold text-lg shadow-md ${rank === 1 ? 'shadow-brand-icon/20' : ''}" ${rankBadgeStyle}>
        ${rank}
      </div>
      
      <!-- Logo & Title -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-3 mb-2">
          ${logoHtml}
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-xl md:text-2xl font-bold text-gray-900">${escapeHtml(product.name)}</h3>
              ${winnerBadge}
            </div>
            ${product.tagline ? `<p class="text-sm text-gray-500 mt-0.5">${escapeHtml(product.tagline)}</p>` : ''}
          </div>
        </div>
        
        <!-- Rating - Enhanced -->
        <div class="flex items-center gap-2 mt-2">
          <div class="flex items-center gap-0.5">${starsHtml}</div>
          <span class="text-sm font-semibold text-gray-700">${rating.toFixed(1)}</span>
          <span class="text-xs text-gray-400">/ 5.0</span>
        </div>
      </div>
    </div>
    
    <!-- Description - Better typography -->
    <p class="text-gray-600 mb-6 leading-relaxed text-base">
      ${escapeHtml(product.description)}
    </p>
    
    ${product.screenshot_url ? `
    <!-- Homepage Screenshot -->
    <div class="mb-8 rounded-xl overflow-hidden border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
      <div class="bg-gray-100 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
        <div class="flex gap-1.5">
          <div class="w-3 h-3 rounded-full bg-red-400"></div>
          <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
          <div class="w-3 h-3 rounded-full bg-green-400"></div>
        </div>
        <span class="text-xs text-gray-500 truncate ml-2">${product.website_url || product.name}</span>
      </div>
      <img 
        src="${product.screenshot_url}" 
        alt="${escapeHtml(product.name)} homepage screenshot" 
        class="w-full h-auto"
        loading="lazy"
        onerror="this.parentElement.style.display='none'"
      >
    </div>
    ` : ''}
    
    <!-- Key Features - Grid with icons -->
    <div class="mb-8">
      <h4 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        Key Features
      </h4>
      <ul class="grid grid-cols-1 md:grid-cols-2 gap-3">
        ${featuresHtml}
      </ul>
    </div>
    
    <!-- Pricing - Card style -->
    <div class="mb-8 p-5 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border border-gray-100">
      <h4 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        Pricing
      </h4>
      ${pricingHtml}
    </div>
    
    <!-- Pros & Cons - Side by side cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <div class="p-4 bg-green-50/50 rounded-2xl border border-green-100">
        <h4 class="text-xs font-bold text-green-700 uppercase tracking-widest mb-3 flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/></svg>
          Pros
        </h4>
        <ul class="space-y-2">${prosHtml}</ul>
      </div>
      <div class="p-4 bg-red-50/30 rounded-2xl border border-red-100/50">
        <h4 class="text-xs font-bold text-red-600 uppercase tracking-widest mb-3 flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"/></svg>
          Cons
        </h4>
        <ul class="space-y-2">${consHtml}</ul>
      </div>
    </div>
    
    <!-- Best For - Highlighted -->
    <div class="p-5 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 rounded-2xl border border-blue-100/50 mb-6">
      <h4 class="text-xs font-bold text-blue-700 uppercase tracking-widest mb-2 flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
        Best For
      </h4>
      <p class="text-sm text-gray-700 font-medium">${escapeHtml(product.best_for)}</p>
    </div>
    
    <!-- CTA -->
    ${ctaHtml}
  </article>`;

    // Save to database instead of returning HTML
    const sectionId = `product-card-${rank}`;
    const saveResult = await saveSection({
      content_item_id,
      section_id: sectionId,
      section_type: 'product_card',
      section_order: 10 + rank, // Hero=0, ComparisonTable=5, ProductCards=11-18, FAQ=50, CTA=60
      section_html: html,
      metadata: {
        rank,
        is_brand,
        product_name: product.name,
        rating: product.rating,
      },
    });

    if (!saveResult.success) {
      return {
        success: false,
        error: saveResult.error,
        message: `Failed to save product card for ${product.name}`,
      };
    }

    // Return concise info - NO HTML in response to save tokens
    return {
      success: true,
      section_id: sectionId,
      section_saved: true,
      product_name: product.name,
      rank,
      is_brand,
      message: `Saved product card for ${product.name} (rank #${rank})`,
    };
  },
});

function escapeHtml(text: string | undefined | null): string {
  if (!text) return '';
  const map: { [key: string]: string } = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
