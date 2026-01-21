import { tool } from 'ai';
import { z } from 'zod';

/**
 * Generate the final CTA section.
 * 
 * MINIMALIST COLOR SYSTEM:
 * - Dark gray background (not colored)
 * - Primary CTA button uses brand color
 * - Secondary CTA is white/transparent
 * - Trust badges use brand color for checkmarks
 */
export const generate_cta_section = tool({
  description: `Generate a Call-to-Action section for an alternative page.
  
This section includes:
- Compelling headline and description
- Primary CTA button (brand color) and secondary button (white)
- Dark gray background with subtle grid pattern
- Trust badges with brand-colored checkmarks

COLOR RULES:
- Background: dark gray (#111827) - NOT colored
- Primary CTA button: brand color (btn-primary)
- Secondary CTA: white border, transparent
- Checkmarks: brand color

Returns HTML that can be assembled into the full page.`,
  parameters: z.object({
    brand_name: z.string(),
    headline: z.string().describe('Main CTA headline'),
    description: z.string().describe('Supporting description'),
    primary_cta: z.object({
      text: z.string(),
      url: z.string(),
    }),
    secondary_cta: z.object({
      text: z.string(),
      url: z.string(),
    }).optional(),
    trust_badges: z.array(z.string()).optional().describe('e.g., "Free trial", "No credit card"'),
  }),
  execute: async ({ brand_name, headline, description, primary_cta, secondary_cta, trust_badges }) => {
    // Trust badges with brand-colored checkmarks
    const trustBadgesHtml = trust_badges?.map(badge => `
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span>${escapeHtml(badge)}</span>
            </div>`).join('') || '';

    const html = `
  <!-- Final CTA Section -->
  <section id="cta" class="py-16 md:py-24 px-4 md:px-6 bg-gray-900 relative overflow-hidden">
    <!-- Subtle Grid Pattern - White lines on dark -->
    <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
    
    <div class="relative max-w-3xl mx-auto text-center">
      <h2 class="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 md:mb-6 leading-tight">
        ${escapeHtml(headline)}
      </h2>
      <p class="text-base md:text-lg text-gray-400 mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed">
        ${escapeHtml(description)}
      </p>
      
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-6">
        <!-- Primary CTA - Brand color button -->
        <a href="${escapeHtml(primary_cta.url)}" class="w-full sm:w-auto btn-primary px-6 md:px-8 py-3 md:py-4 rounded-xl text-sm md:text-base text-center">
          ${escapeHtml(primary_cta.text)}
        </a>
        ${secondary_cta ? `
        <!-- Secondary CTA - White border, transparent -->
        <a href="${escapeHtml(secondary_cta.url)}" class="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-transparent text-white font-semibold rounded-xl text-sm md:text-base border border-white/20 hover:bg-white/10 transition-all duration-200 text-center">
          ${escapeHtml(secondary_cta.text)}
        </a>
        ` : ''}
      </div>
      
      ${trustBadgesHtml ? `
      <div class="flex flex-wrap items-center justify-center gap-4 text-xs md:text-sm text-gray-400">
        ${trustBadgesHtml}
      </div>
      ` : ''}
    </div>
  </section>`;

    return {
      success: true,
      section_id: 'cta',
      section_name: 'CTA Section',
      html,
      message: `Generated CTA section for ${brand_name}`,
    };
  },
});

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
