import { tool } from 'ai';
import { z } from 'zod';

/**
 * Generate the Interface Screenshots comparison section.
 * 
 * MINIMALIST COLOR SYSTEM:
 * - Brand screenshot has CTA overlay linking to brand site
 * - Competitor screenshot has NO CTA
 * - White backgrounds, gray borders
 * - No colored badge backgrounds
 */
export const generate_screenshots_section = tool({
  description: `Generate an Interface Screenshots section for an alternative page.
  
This section displays side-by-side screenshots of both products' interfaces,
allowing users to visually compare the UI/UX.

Requires screenshot URLs from the capture_website_screenshot tool.

COLOR RULES:
- Card backgrounds: white only
- Section background: gray-50
- Badge: gray, not colored
- Brand screenshot: has CTA overlay to brand site
- Competitor screenshot: NO CTA overlay, informational only

Returns HTML that can be assembled into the full page.`,
  parameters: z.object({
    brand: z.object({
      name: z.string(),
      screenshot_url: z.string().describe('Screenshot URL from capture_website_screenshot'),
      caption: z.string().optional().describe('Caption describing the interface'),
      cta_url: z.string().optional().describe('CTA URL - defaults to brand domain'),
    }),
    competitor: z.object({
      name: z.string(),
      screenshot_url: z.string().describe('Screenshot URL from capture_website_screenshot'),
      caption: z.string().optional().describe('Caption describing the interface'),
    }),
    section_title: z.string().optional().default('Interface Comparison'),
    section_description: z.string().optional().describe('Description text for the section'),
  }),
  execute: async ({ brand, competitor, section_title, section_description }) => {
    const defaultDescription = `See how ${brand.name} and ${competitor.name} compare visually. The interface design reflects each product's approach to user experience.`;
    const brandCtaUrl = brand.cta_url || '/';
    
    const html = `
  <!-- Interface Screenshots Section -->
  <section id="screenshots" class="py-12 md:py-20 px-4 md:px-6 bg-gray-50">
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-8 md:mb-12">
        <span class="badge mb-3 md:mb-4">
          Visual Comparison
        </span>
        <h2 class="font-serif text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 mb-3 md:mb-4">
          ${escapeHtml(section_title || 'Interface Comparison')}
        </h2>
        <p class="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
          ${escapeHtml(section_description || defaultDescription)}
        </p>
      </div>
      
      <div class="grid md:grid-cols-2 gap-6 md:gap-8">
        <!-- Brand Screenshot - With CTA -->
        <div class="group">
          <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
            <!-- Browser Chrome -->
            <div class="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-3">
              <div class="flex gap-1.5">
                <div class="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                <div class="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                <div class="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
              </div>
              <div class="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-500 font-mono truncate">
                ${escapeHtml(brand.name.toLowerCase().replace(/\s+/g, ''))}.com
              </div>
            </div>
            
            <!-- Screenshot -->
            <div class="relative aspect-video bg-gray-100 overflow-hidden">
              <img 
                src="${escapeHtml(brand.screenshot_url)}" 
                alt="${escapeHtml(brand.name)} interface screenshot"
                class="w-full h-full object-cover object-top"
                loading="lazy"
                onerror="this.parentElement.innerHTML='<div class=\\'flex items-center justify-center h-full text-gray-400\\'><span>Screenshot unavailable</span></div>'"
              >
              <!-- Hover Overlay - CTA to brand site only -->
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <a href="${escapeHtml(brandCtaUrl)}" class="btn-primary px-4 py-2 rounded-lg text-sm">
                  Try ${escapeHtml(brand.name)}
                  <svg class="w-4 h-4 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <!-- Caption -->
          <div class="mt-4 text-center">
            <h3 class="font-semibold text-gray-900 mb-1">${escapeHtml(brand.name)}</h3>
            ${brand.caption ? `<p class="text-sm text-gray-600">${escapeHtml(brand.caption)}</p>` : ''}
          </div>
        </div>
        
        <!-- Competitor Screenshot - NO CTA -->
        <div class="group">
          <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
            <!-- Browser Chrome -->
            <div class="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-3">
              <div class="flex gap-1.5">
                <div class="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                <div class="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                <div class="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
              </div>
              <div class="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-500 font-mono truncate">
                ${escapeHtml(competitor.name.toLowerCase().replace(/\s+/g, ''))}.com
              </div>
            </div>
            
            <!-- Screenshot - NO hover CTA -->
            <div class="relative aspect-video bg-gray-100 overflow-hidden">
              <img 
                src="${escapeHtml(competitor.screenshot_url)}" 
                alt="${escapeHtml(competitor.name)} interface screenshot"
                class="w-full h-full object-cover object-top"
                loading="lazy"
                onerror="this.parentElement.innerHTML='<div class=\\'flex items-center justify-center h-full text-gray-400\\'><span>Screenshot unavailable</span></div>'"
              >
            </div>
          </div>
          
          <!-- Caption - Informational only, no link -->
          <div class="mt-4 text-center">
            <h3 class="font-semibold text-gray-700 mb-1">${escapeHtml(competitor.name)}</h3>
            ${competitor.caption ? `<p class="text-sm text-gray-500">${escapeHtml(competitor.caption)}</p>` : ''}
          </div>
        </div>
      </div>
      
      <!-- Visual Differences Summary - White card -->
      <div class="mt-8 md:mt-12 p-5 md:p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </div>
          <div>
            <h4 class="font-semibold text-gray-900 mb-1">Visual Design Philosophy</h4>
            <p class="text-sm text-gray-600 leading-relaxed">
              ${escapeHtml(brand.name)}'s interface emphasizes ${brand.caption || 'a clean, modern design approach'}. 
              Meanwhile, ${escapeHtml(competitor.name)} ${competitor.caption || 'takes a different visual approach'}. 
              Both tools have invested in their user experience, but the design choices reflect their target audiences.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>`;

    return {
      success: true,
      section_id: 'screenshots',
      section_name: 'Interface Screenshots Section',
      html,
      message: `Generated screenshots comparison section for ${brand.name} vs ${competitor.name}`,
    };
  },
});

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
