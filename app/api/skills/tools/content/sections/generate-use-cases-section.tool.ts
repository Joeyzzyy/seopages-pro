import { tool } from 'ai';
import { z } from 'zod';

/**
 * Generate the Use Cases / Who Should Choose section.
 * 
 * MINIMALIST COLOR SYSTEM:
 * - Brand checkmarks use brand color
 * - Competitor checkmarks use gray
 * - NO colored backgrounds - white cards only
 * - NO CTA links to competitor
 */
export const generate_use_cases_section = tool({
  description: `Generate a Use Cases section for an alternative page.
  
This section includes:
- Who should choose Brand vs Competitor
- Specific use case scenarios
- Pro tip for decision making (gray card, no colored background)

COLOR RULES:
- Brand checkmarks: brand color icon
- Competitor checkmarks: gray icon
- Card backgrounds: white only
- Section background: gray-50
- Pro tip: white card with gray border, no amber background
- NO CTA links to competitor

Returns HTML that can be assembled into the full page.`,
  parameters: z.object({
    brand: z.object({
      name: z.string(),
      logo_url: z.string().optional().describe('URL to the brand logo image'),
      use_cases: z.array(z.string()).min(3).max(6).describe('Use cases where brand is better'),
    }),
    competitor: z.object({
      name: z.string(),
      logo_url: z.string().optional().describe('URL to the competitor logo image'),
      use_cases: z.array(z.string()).min(3).max(6).describe('Use cases where competitor is better'),
    }),
    pro_tip: z.string().optional().describe('Expert tip for making the decision'),
  }),
  execute: async ({ brand, competitor, pro_tip }) => {
    // Brand use cases with brand-colored checkmarks
    const brandUseCasesHtml = brand.use_cases.map(uc => `
              <li class="flex items-start gap-3">
                <div class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <svg class="w-3.5 h-3.5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <span class="text-sm text-gray-700">${escapeHtml(uc)}</span>
              </li>`).join('');

    // Competitor use cases with gray checkmarks
    const competitorUseCasesHtml = competitor.use_cases.map(uc => `
              <li class="flex items-start gap-3">
                <div class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <svg class="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <span class="text-sm text-gray-700">${escapeHtml(uc)}</span>
              </li>`).join('');

    const html = `
  <!-- Use Cases Section -->
  <section id="use-cases" class="py-12 md:py-20 px-4 md:px-6 bg-gray-50">
    <div class="max-w-5xl mx-auto">
      <div class="text-center mb-8 md:mb-12">
        <span class="badge mb-3 md:mb-4">
          Decision Guide
        </span>
        <h2 class="font-serif text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 mb-3 md:mb-4">
          Who Should Use Which?
        </h2>
        <p class="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
          Find the right tool based on your specific needs and situation.
        </p>
      </div>
      
      <div class="grid md:grid-cols-2 gap-6 md:gap-8">
        <!-- Brand Use Cases - White card with gray border -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 md:p-6 shadow-md">
          <div class="flex items-center gap-3 mb-5">
            ${brand.logo_url 
              ? `<img src="${escapeHtml(brand.logo_url)}" alt="${escapeHtml(brand.name)}" class="w-10 h-10 rounded-xl object-contain bg-white shadow-sm" onerror="this.outerHTML='<div class=\\'w-10 h-10 rounded-xl bg-brand-icon flex items-center justify-center\\'><span class=\\'text-lg font-bold text-white\\'>${brand.name.charAt(0).toUpperCase()}</span></div>'">`
              : `<div class="w-10 h-10 rounded-xl bg-brand-icon flex items-center justify-center"><span class="text-lg font-bold text-white">${brand.name.charAt(0).toUpperCase()}</span></div>`
            }
            <h3 class="font-bold text-gray-900 text-lg">Choose ${escapeHtml(brand.name)} If...</h3>
          </div>
          
          <ul class="space-y-3">
            ${brandUseCasesHtml}
          </ul>
        </div>
        
        <!-- Competitor Use Cases - White card with gray border, NO CTA -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 md:p-6 shadow-md">
          <div class="flex items-center gap-3 mb-5">
            ${competitor.logo_url 
              ? `<img src="${escapeHtml(competitor.logo_url)}" alt="${escapeHtml(competitor.name)}" class="w-10 h-10 rounded-xl object-contain bg-white shadow-sm" onerror="this.outerHTML='<div class=\\'w-10 h-10 rounded-xl bg-gray-600 flex items-center justify-center\\'><span class=\\'text-lg font-bold text-white\\'>${competitor.name.charAt(0).toUpperCase()}</span></div>'">`
              : `<div class="w-10 h-10 rounded-xl bg-gray-600 flex items-center justify-center"><span class="text-lg font-bold text-white">${competitor.name.charAt(0).toUpperCase()}</span></div>`
            }
            <h3 class="font-bold text-gray-900 text-lg">Choose ${escapeHtml(competitor.name)} If...</h3>
          </div>
          
          <ul class="space-y-3">
            ${competitorUseCasesHtml}
          </ul>
        </div>
      </div>
      
      ${pro_tip ? `
      <!-- Pro Tip - White card with gray border, no colored background -->
      <div class="mt-6 md:mt-8 p-5 md:p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
        <div class="flex flex-col md:flex-row items-start gap-4">
          <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
          <div>
            <h4 class="font-semibold text-gray-900 mb-1">Pro Tip</h4>
            <p class="text-sm text-gray-700 leading-relaxed">${escapeHtml(pro_tip)}</p>
          </div>
        </div>
      </div>
      ` : ''}
    </div>
  </section>`;

    return {
      success: true,
      section_id: 'use-cases',
      section_name: 'Use Cases Section',
      html,
      message: `Generated use cases section for ${brand.name} vs ${competitor.name}`,
    };
  },
});

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
