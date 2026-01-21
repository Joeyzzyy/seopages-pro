import { tool } from 'ai';
import { z } from 'zod';

/**
 * Generate the Table of Contents navigation section.
 */
export const generate_toc_section = tool({
  description: `Generate a Table of Contents navigation section for an alternative page.
  
This section includes:
- Horizontal scrollable navigation on mobile
- Links to all page sections
- Sticky positioning option

Returns HTML that can be assembled into the full page.`,
  parameters: z.object({
    sections: z.array(z.object({
      id: z.string().describe('Section ID for anchor link'),
      label: z.string().describe('Display label'),
      emoji: z.string().optional().describe('Optional emoji icon'),
    })).min(3).max(10).describe('List of sections to include in TOC'),
    sticky: z.boolean().optional().default(true).describe('Whether TOC should be sticky'),
  }),
  execute: async ({ sections, sticky }) => {
    const tocItemsHtml = sections.map(section => `
          <a href="#${escapeHtml(section.id)}" class="toc-link flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm text-gray-600 hover:text-brand-600 whitespace-nowrap rounded-lg hover:bg-brand-50 transition-all">
            ${section.emoji ? `<span>${escapeHtml(section.emoji)}</span>` : ''}
            <span>${escapeHtml(section.label)}</span>
          </a>`).join('');

    const stickyClass = sticky ? 'sticky top-0 z-40' : '';

    const html = `
  <!-- Table of Contents -->
  <nav id="toc" class="${stickyClass} bg-white/95 backdrop-blur-sm border-b border-gray-100 py-3 px-4 md:px-6">
    <div class="max-w-5xl mx-auto">
      <div class="flex items-center gap-1 overflow-x-auto scrollbar-hide -mx-2 px-2">
        ${tocItemsHtml}
      </div>
    </div>
  </nav>`;

    return {
      success: true,
      section_id: 'toc',
      section_name: 'Table of Contents',
      html,
      section_count: sections.length,
      message: `Generated TOC with ${sections.length} sections`,
    };
  },
});

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
