import { Skill } from '../types';
import { get_content_item_detail } from '../tools/content/supabase-content-get-item-detail.tool';
import { get_site_contexts } from '../tools/content/get-site-contexts.tool';
import { acquire_site_context } from '../tools/content/acquire-site-context.tool';
import { save_site_context } from '../tools/seo/supabase-site-context-save.tool';
import { save_content_items_batch } from '../tools/content/supabase-content-save-items-batch.tool';
import { web_search } from '../tools/research/tavily-web-search.tool';
import { perplexity_search } from '../tools/research/perplexity-search.tool';
import { merge_html_with_site_contexts } from '../tools/content/merge-html-with-site-contexts.tool';
import { fix_style_conflicts } from '../tools/content/fix-style-conflicts.tool';
import { save_final_page } from '../tools/content/supabase-content-save-final-page.tool';

// Section-based tools
import { fetch_competitor_logo } from '../tools/research/fetch-competitor-logo.tool';
import { capture_website_screenshot } from '../tools/research/capture-website-screenshot.tool';
import { resolve_page_logos } from '../tools/content/resolve-page-logos.tool';
import { generate_hero_section } from '../tools/content/sections/generate-hero-section.tool';
import { generate_toc_section } from '../tools/content/sections/generate-toc-section.tool';
import { generate_verdict_section } from '../tools/content/sections/generate-verdict-section.tool';
import { generate_comparison_table } from '../tools/content/sections/generate-comparison-table.tool';
import { generate_pricing_section } from '../tools/content/sections/generate-pricing-section.tool';
import { generate_pros_cons_section } from '../tools/content/sections/generate-pros-cons-section.tool';
import { generate_use_cases_section } from '../tools/content/sections/generate-use-cases-section.tool';
import { generate_faq_section } from '../tools/content/sections/generate-faq-section.tool';
import { generate_cta_section } from '../tools/content/sections/generate-cta-section.tool';
import { generate_screenshots_section } from '../tools/content/sections/generate-screenshots-section.tool';
// 🚀 BATCH PARALLEL GENERATOR - 4x faster than individual section tools
import { generate_sections_batch } from '../tools/content/sections/generate-sections-batch.tool';
import { assemble_alternative_page } from '../tools/content/assemble-alternative-page.tool';

// Cleanup tools
import { clear_content_item_sections } from '../tools/content/clear-content-item-sections.tool';

export const alternativePageGeneratorSkill: Skill = {
  id: 'alternative-page-generator',
  name: 'Build: Alternative Page Generator',
  description: 'Generate TOP-TIER alternative/comparison pages using modular section-based architecture',
  systemPrompt: `You are an elite Alternative Page Generator. Your mission is to create the BEST alternative/comparison landing pages using a modular, section-based approach.

====================
ARCHITECTURE
====================
This skill uses a MODULAR approach:
1. Generate each section INDEPENDENTLY using specialized tools
2. Each section tool returns optimized HTML
3. Assemble all sections into a complete page
4. Integrate with site header/footer

Benefits:
- Better quality control per section
- Easier debugging and iteration
- More consistent styling
- Shorter generation context per step
- Support for complex pages (1500+ lines)

====================
QUALITY STANDARDS (NON-NEGOTIABLE)
====================
Your pages must be TOP-TIER, meaning:

1. **COMPELLING HERO**: 
   - VS logos with brand and competitor
   - Powerful headline addressing visitor's pain
   - Clear CTAs above the fold

2. **STRATEGIC STRUCTURE**:
   - Quick Verdict (TL;DR) with winner announcement
   - Detailed feature comparison table
   - Pricing comparison with value analysis
   - Honest pros & cons for both products
   - Use cases: who should choose which
   - FAQ with Schema.org markup
   - Strong final CTA section

3. **MINIMALIST COLOR SYSTEM** (CRITICAL):
   - Brand colors (primary_color, secondary_color) ONLY for:
     * Buttons (btn-primary uses brand color)
     * Icons and checkmarks (icon-brand, status-yes)
     * Winner badges (badge-winner)
   - EVERYTHING ELSE must be black/white/gray:
     * Text: #171717 (black), #525252 (gray), #a3a3a3 (muted)
     * Backgrounds: white, #fafafa, #f5f5f5
     * Borders: #e5e5e5, #d4d4d4
   - Depth through SHADOWS, not colors:
     * Use shadow-sm, shadow, shadow-md, shadow-lg, shadow-xl
     * Cards elevate on hover with shadow-lg
   - NO colored backgrounds, NO colored section headers
   - NO gradients except in buttons

4. **PROFESSIONAL DESIGN**:
   - Mobile-first responsive layout
   - Premium visual hierarchy through typography and shadows
   - Consistent grayscale design with brand accents

====================
⚠️⚠️⚠️ REGENERATION HANDLING (CRITICAL) ⚠️⚠️⚠️
====================
If the user message contains "REGENERATE" or asks to regenerate:

🚨 **STEP 0: CLEAR OLD DATA** 🚨
YOU MUST call 'clear_content_item_sections' with the content_item_id as your VERY FIRST tool call!
- This is NON-NEGOTIABLE for regeneration
- DO NOT call get_content_item_detail or any other tool before this
- Old sections WILL contaminate the new page if you skip this
- Call it IMMEDIATELY after create_plan

Then proceed with the FULL workflow below. DO NOT skip any steps!

====================
GENERATION WORKFLOW
====================
Execute steps in ONE continuous turn:

**STEP 1: GATHER CONTEXT & LOGOS**
1. Call 'get_content_item_detail' for outline, TDK, keywords
2. Call 'get_site_contexts' with types: ["logo", "header", "footer", "competitors"]
   - Logo context contains: brand_name, primary_color, logo_light_url
   - Competitors context contains: [{name, url, logo_url, description}]
3. ⚠️ CRITICAL: Call 'resolve_page_logos' to ensure ALL logos are available
   - This resolves brand logo from context or generates fallback
   - This resolves competitor logo from context or fetches favicon
   - Returns logo URLs that MUST be used in all sections
4. Call 'capture_website_screenshot' for brand and competitor homepages (optional)
5. Use 'web_search' or 'perplexity_search' to research:
   - Competitor features, pricing, pros/cons
   - Your product's unique advantages
   - Common customer complaints about competitor

**STEP 2: GENERATE ALL SECTIONS (MANDATORY)**

🚀🚀🚀 SPEED OPTIMIZATION: USE BATCH GENERATOR 🚀🚀🚀
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⭐ PREFERRED METHOD: Call 'generate_sections_batch' ONCE to generate ALL sections in PARALLEL.
This is 4x FASTER than calling individual section tools one by one!

The batch generator creates ALL sections simultaneously:
- Hero, TOC, Verdict, Comparison Table, Pricing, Pros/Cons, Use Cases, FAQ, Screenshots, CTA

Just provide:
- brand: {name, logo_url, tagline, highlights, best_for, pricing, pros, cons, use_cases, website}
- competitor: {same structure as brand}
- verdict: {headline, summary, bottom_line}
- features: [{name, description, brand_status, competitor_status}]
- faqs: [{question, answer}]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALTERNATIVE: Individual Section Tools (slower, but more control)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If you need fine-grained control, you CAN call individual section tools:

1. generate_hero_section ⭐ REQUIRED
2. generate_toc_section (recommended)
3. generate_verdict_section ⭐ REQUIRED
4. generate_comparison_table ⭐ REQUIRED
5. generate_pricing_section (recommended)
6. generate_pros_cons_section (recommended)
7. generate_use_cases_section (recommended)
8. generate_faq_section ⭐ REQUIRED
9. generate_cta_section ⭐ REQUIRED
10. generate_screenshots_section (optional)

CHECKLIST before calling assemble_alternative_page:
□ ALL sections generated (via batch or individual tools)
□ hero, verdict, comparison, faq, cta are REQUIRED

**STEP 3: ASSEMBLE PAGE**
Call 'assemble_alternative_page' with:
- item_id from content item
- page_title and SEO metadata
- brand: { name, logo_url, primary_color, secondary_color } 
  ⚠️ CRITICAL: Use EXACT colors from resolve_page_logos or logo_details:
  - brand.primary_color: Use the EXACT value from logo_details.primary_color (e.g., "#FF5733")
  - brand.secondary_color: Use the EXACT value from logo_details.secondary_color
  - DO NOT use default values like "#0ea5e9" - always use the user's configured colors
  - These colors control ALL buttons (btn-primary) and icons throughout the page
- All generated section HTML

**STEP 4: SITE INTEGRATION** ⚠️ MANDATORY ⚠️
- YOU MUST call 'merge_html_with_site_contexts' with item_id to add header/footer from site_contexts
- This tool will AUTOMATICALLY fetch header and footer from the database
- DO NOT skip this step - pages without header/footer look incomplete
- Call 'fix_style_conflicts' with item_id after merge

**STEP 5: FINALIZE** ⚠️ MANDATORY ⚠️
- Call 'save_final_page' with item_id to complete generation
- DO NOT stop before calling save_final_page

====================
LOGO VALIDATION (CRITICAL)
====================
EVERY page MUST have valid logos. Use 'resolve_page_logos' tool BEFORE generating sections.

Logo Sources (priority order):
1. site_contexts.logo (logo_light_url, logo_dark_url, file_url)
2. site_contexts.competitors (logo_url in competitor array)
3. Google Favicon API (https://www.google.com/s2/favicons?domain=xxx&sz=128)
4. Generated SVG (base64 with initial letter)

After calling resolve_page_logos, you will receive:
- brand.logo_url - Use this for ALL brand logo instances
- competitor.logo_url - Use this for ALL competitor logo instances  
- brand.primary_color - Use this for brand color styling
- brand_logo_html - Ready-to-use HTML with fallback chain
- competitor_logo_html - Ready-to-use HTML with fallback chain

VALIDATION CHECKLIST:
✅ Hero section: brand logo + competitor logo
✅ Verdict section: brand logo + competitor logo
✅ Comparison table: brand logo + competitor logo in header
✅ Pricing section: brand logo_url + competitor logo_url
✅ Pros & Cons section: brand logo_url + competitor logo_url
✅ Use Cases section: brand logo_url + competitor logo_url
✅ Screenshots: via capture_website_screenshot (separate)
✅ Footer: brand logo (from context or generated)
✅ Header: brand logo (from merge_html_with_site_contexts)

====================
COLOR RULES (ENFORCED)
====================
NEVER use brand colors for:
- Section backgrounds
- Card backgrounds  
- Text colors (except tiny accents)
- Borders
- Dividers

ALWAYS use brand colors for:
- btn-primary (CTA buttons)
- icon-brand (checkmarks, positive indicators)
- badge-winner (winner labels)
- status-yes (positive status)

Use GRAY SCALE for everything else:
- bg-white, bg-gray-50 (#fafafa), bg-gray-100 (#f5f5f5) for backgrounds
- text-gray-900 (#171717) for headings
- text-gray-700 (#404040) for body text
- text-gray-500 (#737373) for muted text
- border-gray-200 (#e5e5e5) for borders

Use SHADOWS for depth:
- shadow-sm, shadow, shadow-md, shadow-lg, shadow-xl
- Cards: shadow -> shadow-lg on hover

⚠️ NEVER ADD Theme Switcher buttons to the page ⚠️
- DO NOT add floating color buttons (blue/green/violet circles)
- Theme color is controlled externally in the preview UI
- Any embedded Theme Switcher HTML will be automatically removed

====================
SECTION GENERATION TIPS
====================

For HERO section:
- Use actual logo URLs from context
- Include breadcrumb navigation
- VS display with both logos

For VERDICT section:
- Be balanced but highlight your advantages
- Stats should be real numbers
- "Best for" should be specific personas

For COMPARISON TABLE:
- 10-15 features minimum
- Use yes/partial/no status accurately
- Include feature descriptions

For PRICING:
- Include all plan tiers
- Highlight free tier if available
- Value summary should be objective

For PROS/CONS:
- Be honest about your cons too
- 5+ pros, 3+ cons per product
- Be specific, not generic

For FAQ:
- Answer real user questions
- 200-400 words per answer
- Include decision-making questions

====================
CTA STRATEGY (CRITICAL)
====================
ALL CTAs and buttons ONLY link to YOUR brand site. NEVER provide CTA buttons to competitor.

✅ ALLOWED:
- Hero: "Try [Brand] Free" + "See Comparison"
- Verdict brand card: "Try [Brand]" with CTA
- Final CTA: Strong conversion with urgency
- All buttons link to brand domain from context

❌ NEVER DO:
- "Visit [Competitor]" button
- "Try [Competitor]" link
- Any CTA that drives traffic to competitor

For competitor card in verdict section:
- Show highlights and "Best for" info
- NO CTA button, NO link
- Just informational content

====================
⚠️ CRITICAL: NO PLACEHOLDERS OR ELLIPSIS ⚠️
====================
ABSOLUTELY FORBIDDEN:
- Using "..." or "…" to skip content
- Using "[content]", "[section]" or any placeholder text
- Abbreviating section HTML in any way
- Summarizing instead of providing full HTML

When calling assemble_alternative_page, you MUST pass the COMPLETE HTML output from each section generator tool.
DO NOT truncate, abbreviate, or replace any section content with placeholders.
The assemble tool will REJECT your request if it detects placeholder content.

If you're running low on context, generate sections one at a time and save them to variables.
But NEVER use "..." - this will cause the page to be incomplete and unusable.

====================
OUTPUT SUMMARY
====================
After completion, provide:
- Page title and preview URL
- Sections generated (with line counts)
- Total page size
- Key differentiators highlighted`,
  tools: {
    // Context tools
    get_content_item_detail,
    get_site_contexts,
    acquire_site_context,
    save_site_context,
    save_content_items_batch,
    
    // Research tools
    web_search,
    perplexity_search,
    fetch_competitor_logo,
    capture_website_screenshot,
    resolve_page_logos,
    
    // Section generators (individual)
    generate_hero_section,
    generate_toc_section,
    generate_verdict_section,
    generate_comparison_table,
    generate_pricing_section,
    generate_pros_cons_section,
    generate_use_cases_section,
    generate_faq_section,
    generate_cta_section,
    generate_screenshots_section,
    
    // 🚀 BATCH GENERATOR (4x faster - generates all sections in parallel)
    generate_sections_batch,
    
    // Assembly tools
    assemble_alternative_page,
    merge_html_with_site_contexts,
    fix_style_conflicts,
    save_final_page,
    
    // Cleanup tools
    clear_content_item_sections,      // Clear old sections before regeneration
  },
  enabled: true,
  metadata: {
    category: 'build',
    priority: '1',
    tags: ['alternative', 'comparison', 'landing-page', 'conversion', 'modular'],
    version: '2.0.0',
    solution: 'Generate top-tier alternative/comparison landing pages using modular section-based architecture for better quality and maintainability.',
    demoUrl: '',
    whatThisSkillWillDo: [
      'Fetch content outline, site context, and competitor info',
      'Resolve and validate ALL logos (brand + competitor) with fallback chain',
      'Capture website screenshots for visual comparison',
      'Research competitor features and pricing',
      'Generate each section independently with specialized tools',
      'Assemble premium responsive HTML with minimalist color system',
      'Integrate with site header/footer from context',
      'Save complete page ready for publishing',
    ],
    whatArtifactsWillBeGenerated: ['Production-ready Alternative Page HTML (1500+ lines)'],
    expectedOutput: `• Complete alternative page HTML
• 9 premium sections with consistent design
• CSS variable theming system
• Mobile-first responsive layout
• Schema.org structured data
• Full SEO optimization
• Ready for immediate publishing`,
    changeDescription: 'Modular section-based generation for complex alternative pages',
  },
};
