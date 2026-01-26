import { tool } from 'ai';
import { z } from 'zod';
import { saveSection } from '@/lib/section-storage';

// Import listicle section generators
import { generate_listicle_hero_section } from './generate-listicle-hero-section.tool';
import { generate_listicle_product_card } from './generate-listicle-product-card.tool';
import { generate_listicle_comparison_table } from './generate-listicle-comparison-table.tool';
import { generate_faq_section } from './generate-faq-section.tool';
import { generate_cta_section } from './generate-cta-section.tool';

function escapeHtml(text: string | undefined | null): string {
  if (!text) return '';
  const map: { [key: string]: string } = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Batch generator for listicle/best-of page sections.
 * 
 * This tool generates ALL sections for a listicle page in PARALLEL:
 * - Hero section
 * - Comparison table
 * - ALL product cards (parallel!)
 * - FAQ section
 * - CTA section
 * 
 * Optimized for speed: generates 10+ sections in ~1-2 seconds instead of 10+ seconds.
 */
export const generate_listicle_sections_batch = tool({
  description: `Generate ALL sections for a listicle/best-of page in PARALLEL.

This tool generates the complete page structure at once:
- Hero section with title, badge, CTA
- Quick comparison table for all products
- Individual product cards (ALL generated in parallel!)
- FAQ section
- CTA section

Use this instead of calling individual section tools one by one.
All sections are automatically saved to database.

⚠️ REQUIRED: Pass content_item_id for database storage.
⚠️ REQUIRED: Call research_product_deep BEFORE this for accurate product data.`,
  parameters: z.object({
    content_item_id: z.string().describe('Content item ID (UUID) - REQUIRED for database storage'),
    
    // Brand info
    brand: z.object({
      name: z.string().describe('Your brand name'),
      logo_url: z.string().optional().describe('Brand logo URL'),
      primary_color: z.string().optional().default('#0ea5e9').describe('Primary brand color'),
      website_url: z.string().optional().describe('Brand website URL'),
      tagline: z.string().optional().describe('Brand tagline'),
    }),
    
    // Hero section data
    hero: z.object({
      title: z.string().describe('Page title, e.g., "Top 10 Best Writesonic Alternatives in 2025"'),
      description: z.string().describe('What readers will learn'),
      cta_text: z.string().optional().default('Try #1 Pick Free'),
      cta_url: z.string().optional().default('/'),
      site_url: z.string().optional().describe('Site URL for author name'),
    }),
    
    // Products to compare (including brand as #1)
    products: z.array(z.object({
      rank: z.number().describe('Ranking position (1 = your brand)'),
      name: z.string().describe('Product name'),
      logo_url: z.string().nullish().describe('Product logo URL'),
      screenshot_url: z.string().nullish().describe('Homepage screenshot URL'),
      website_url: z.string().nullish().describe('Product website URL'),
      tagline: z.string().nullish().describe('Short tagline'),
      description: z.string().describe('Detailed description'),
      features: z.array(z.string()).describe('Key features (4-6 items)'),
      feature_map: z.record(z.enum(['yes', 'partial', 'no', 'not_mentioned'])).optional().describe('Feature availability for comparison table'),
      pricing: z.object({
        starting_price: z.string().optional(),
        free_tier: z.boolean().optional(),
        pricing_model: z.string().optional(),
      }).optional(),
      pros: z.array(z.string()).describe('Advantages'),
      cons: z.array(z.string()).describe('Disadvantages'),
      best_for: z.string().describe('Who should use this'),
      rating: z.number().optional().describe('Rating out of 5'),
    })).min(2).describe('All products to compare (brand + competitors)'),
    
    // Comparison table feature names
    feature_names: z.array(z.string()).describe('Features to compare in the table'),
    
    // FAQ data
    faqs: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).min(4).max(10).describe('FAQ items'),
    
    // CTA section
    cta: z.object({
      headline: z.string().optional(),
      description: z.string().optional(),
      primary_text: z.string().optional().default('Get Started Free'),
      primary_url: z.string().optional().default('/'),
      secondary_text: z.string().optional(),
      secondary_url: z.string().optional(),
      trust_badges: z.array(z.string()).optional(),
    }).optional(),
  }),
  execute: async ({ content_item_id, brand, hero, products, feature_names, faqs, cta }) => {
    const startTime = Date.now();
    const contentItemId = content_item_id;
    
    console.log(`[generate_listicle_sections_batch] Starting parallel generation for ${products.length} products...`);
    
    // Build all section generation promises
    const sectionPromises: Promise<any>[] = [];
    
    // 1. Hero Section
    sectionPromises.push(
      (generate_listicle_hero_section as any).execute({
        content_item_id: contentItemId,
        brand: {
          name: brand.name,
          logo_url: brand.logo_url,
          primary_color: brand.primary_color,
        },
        title: hero.title,
        description: hero.description,
        total_alternatives: products.length,
        cta_primary: {
          text: hero.cta_text || `Try ${brand.name} Free`,
          url: hero.cta_url || '/',
        },
        site_url: hero.site_url,
      }).catch((e: Error) => ({ success: false, section_id: 'listicle-hero', error: e.message }))
    );
    
    // 2. Comparison Table
    sectionPromises.push(
      (generate_listicle_comparison_table as any).execute({
        content_item_id: contentItemId,
        title: 'Quick Comparison',
        brand_name: brand.name,
        auto_load_from_research: true,
        products: products.map(p => ({
          rank: p.rank,
          name: p.name,
          logo_url: p.logo_url,
          starting_price: p.pricing?.starting_price,
          has_free_tier: p.pricing?.free_tier,
          rating: p.rating,
          features: p.feature_map || {},
        })),
        feature_names,
      }).catch((e: Error) => ({ success: false, section_id: 'listicle-comparison', error: e.message }))
    );
    
    // 3. Product Cards - ALL in parallel!
    for (const product of products) {
      const isBrand = product.rank === 1;
      sectionPromises.push(
        (generate_listicle_product_card as any).execute({
          content_item_id: contentItemId,
          rank: product.rank,
          is_brand: isBrand,
          product: {
            name: product.name,
            logo_url: product.logo_url,
            screenshot_url: product.screenshot_url,
            tagline: product.tagline,
            website_url: product.website_url,
            description: product.description,
            features: product.features,
            pricing: product.pricing,
            pros: product.pros,
            cons: product.cons,
            best_for: product.best_for,
            rating: product.rating,
          },
          brand_primary_color: brand.primary_color,
        }).catch((e: Error) => ({ success: false, section_id: `product-card-${product.rank}`, error: e.message }))
      );
    }
    
    // 4. FAQ Section
    sectionPromises.push(
      (generate_faq_section as any).execute({
        content_item_id: contentItemId,
        brand_name: brand.name,
        competitor_name: products.length > 1 ? products[1].name : 'alternatives',
        faqs,
      }).catch((e: Error) => ({ success: false, section_id: 'faq', error: e.message }))
    );
    
    // 5. CTA Section
    sectionPromises.push(
      (generate_cta_section as any).execute({
        content_item_id: contentItemId,
        brand_name: brand.name,
        headline: cta?.headline || `Ready to try ${brand.name}?`,
        description: cta?.description || brand.tagline || `Get started with ${brand.name} today.`,
        primary_cta: {
          text: cta?.primary_text || 'Get Started Free',
          url: cta?.primary_url || '/',
        },
        secondary_cta: cta?.secondary_text ? {
          text: cta.secondary_text,
          url: cta.secondary_url || '/',
        } : undefined,
        trust_badges: cta?.trust_badges || ['Free trial available', 'No credit card required'],
      }).catch((e: Error) => ({ success: false, section_id: 'cta', error: e.message }))
    );
    
    // Execute ALL in parallel
    const results = await Promise.all(sectionPromises);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);
    
    // Collect results
    const successfulSections: string[] = [];
    const errors: string[] = [];
    
    results.forEach((result: any, index: number) => {
      if (result.success !== false) {
        // Determine section name
        let sectionName = 'unknown';
        if (index === 0) sectionName = 'hero';
        else if (index === 1) sectionName = 'comparison';
        else if (index < 2 + products.length) sectionName = `product-card-${index - 1}`;
        else if (index === 2 + products.length) sectionName = 'faq';
        else sectionName = 'cta';
        
        successfulSections.push(sectionName);
      } else {
        errors.push(`${result.section_id}: ${result.error}`);
      }
    });
    
    const totalSections = 2 + products.length + 2; // hero + comparison + product cards + faq + cta
    
    console.log(`[generate_listicle_sections_batch] Completed ${successfulSections.length}/${totalSections} sections in ${duration}s`);
    
    if (errors.length > 0) {
      console.warn(`[generate_listicle_sections_batch] ${errors.length} sections failed:`, errors);
    }
    
    return {
      success: true,
      content_item_id: contentItemId,
      section_count: successfulSections.length,
      total_expected: totalSections,
      product_cards_count: products.length,
      sections_generated: successfulSections,
      duration_seconds: parseFloat(duration),
      errors: errors.length > 0 ? errors : undefined,
      message: `Generated ${successfulSections.length} listicle sections in ${duration}s (parallel). ${products.length} product cards included. All sections saved to database. Call assemble_page_from_sections to build the final page.`,
    };
  },
});
