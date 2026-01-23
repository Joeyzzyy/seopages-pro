import { tool } from 'ai';
import { z } from 'zod';
import { saveSection } from '@/lib/section-storage';

/**
 * Generate the FAQ section with accordion.
 */
export const generate_faq_section = tool({
  description: `Generate a FAQ section for an alternative page.
  
This section includes:
- Accordion-style FAQ items
- Schema.org FAQPage markup
- Common questions about the comparison

Returns a confirmation that the section was saved. The HTML is stored in the database to avoid token limits.`,
  parameters: z.object({
    content_item_id: z.string().describe('Content item ID (UUID) for storing the section'),
    brand_name: z.string(),
    competitor_name: z.string(),
    faqs: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).min(4).max(10).describe('4-10 FAQ items'),
  }),
  execute: async ({ content_item_id, brand_name, competitor_name, faqs }) => {
    // Generate FAQ items HTML
    const faqItemsHtml = faqs.map((faq, index) => `
          <div class="faq-item border border-gray-200 rounded-xl overflow-hidden">
            <button class="faq-trigger w-full px-4 md:px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors" onclick="this.parentElement.classList.toggle('active')">
              <span class="font-semibold text-gray-900 text-sm md:text-base pr-4">${escapeHtml(faq.question)}</span>
              <svg class="faq-icon w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <div class="faq-content hidden px-4 md:px-6 pb-4">
              <p class="text-sm text-gray-600 leading-relaxed">${escapeHtml(faq.answer)}</p>
            </div>
          </div>`).join('');

    // Generate Schema.org FAQPage JSON-LD
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };

    const html = `
  <!-- FAQ Section -->
  <section id="faq" class="py-12 md:py-20 px-4 md:px-6 bg-gray-50">
    <div class="max-w-3xl mx-auto">
      <div class="text-center mb-8 md:mb-12">
        <span class="inline-block px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 text-xs font-semibold tracking-wide uppercase mb-3 md:mb-4">
          Questions & Answers
        </span>
        <h2 class="font-serif text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 mb-3 md:mb-4">
          Frequently Asked Questions
        </h2>
        <p class="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
          Common questions about ${escapeHtml(brand_name)} vs ${escapeHtml(competitor_name)}.
        </p>
      </div>
      
      <div class="space-y-3">
        ${faqItemsHtml}
      </div>
    </div>
  </section>
  
  <!-- FAQ Schema -->
  <script type="application/ld+json">
  ${JSON.stringify(faqSchema, null, 2)}
  </script>`;

    // Save to database instead of returning HTML
    const sectionId = 'faq';
    const saveResult = await saveSection({
      content_item_id,
      section_id: sectionId,
      section_type: 'faq',
      section_order: 50, // Near the end, before CTA
      section_html: html,
      metadata: {
        brand_name,
        competitor_name,
        faq_count: faqs.length,
      },
    });

    if (!saveResult.success) {
      return {
        success: false,
        error: saveResult.error,
        message: `Failed to save FAQ section`,
      };
    }

    // Return concise info - NO HTML in response to save tokens
    return {
      success: true,
      section_id: sectionId,
      section_saved: true,
      faq_count: faqs.length,
      message: `Saved FAQ section with ${faqs.length} questions`,
    };
  },
});

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
