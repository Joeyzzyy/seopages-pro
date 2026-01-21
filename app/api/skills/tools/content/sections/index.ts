/**
 * Alternative Page Section Generators
 * 
 * These tools generate individual HTML sections for alternative pages.
 * Each tool returns a self-contained HTML snippet that can be assembled
 * into a complete page.
 * 
 * Usage:
 * 1. Call each section generator with the relevant data
 * 2. Use assemble_alternative_page_v2 to combine all sections
 */

export { generate_hero_section } from './generate-hero-section.tool';
export { generate_toc_section } from './generate-toc-section.tool';
export { generate_verdict_section } from './generate-verdict-section.tool';
export { generate_comparison_table } from './generate-comparison-table.tool';
export { generate_pricing_section } from './generate-pricing-section.tool';
export { generate_pros_cons_section } from './generate-pros-cons-section.tool';
export { generate_use_cases_section } from './generate-use-cases-section.tool';
export { generate_faq_section } from './generate-faq-section.tool';
export { generate_cta_section } from './generate-cta-section.tool';
export { generate_screenshots_section } from './generate-screenshots-section.tool';