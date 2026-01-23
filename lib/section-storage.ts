/**
 * Section Storage Utilities
 * 
 * Provides functions to save and retrieve generated HTML sections.
 * This enables incremental page building to avoid token limits.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role for server-side operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface SectionData {
  content_item_id: string;
  section_id: string;
  section_type: string;
  section_order: number;
  section_html: string;
  metadata?: Record<string, unknown>;
}

export interface SavedSection {
  id: string;
  content_item_id: string;
  section_id: string;
  section_type: string;
  section_order: number;
  section_html: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Save a generated section to the database
 */
export async function saveSection(data: SectionData): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('content_item_sections')
      .upsert({
        content_item_id: data.content_item_id,
        section_id: data.section_id,
        section_type: data.section_type,
        section_order: data.section_order,
        section_html: data.section_html,
        metadata: data.metadata || {},
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'content_item_id,section_id',
      });

    if (error) {
      console.error('[Section Storage] Save error:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Section Storage] Saved section: ${data.section_id} for content item ${data.content_item_id}`);
    return { success: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Section Storage] Save exception:', err);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get all sections for a content item, ordered by section_order
 */
export async function getSections(contentItemId: string): Promise<SavedSection[]> {
  try {
    const { data, error } = await supabase
      .from('content_item_sections')
      .select('*')
      .eq('content_item_id', contentItemId)
      .order('section_order', { ascending: true });

    if (error) {
      console.error('[Section Storage] Get sections error:', error);
      return [];
    }

    console.log(`[Section Storage] Retrieved ${data?.length || 0} sections for content item ${contentItemId}`);
    return data || [];
  } catch (err) {
    console.error('[Section Storage] Get sections exception:', err);
    return [];
  }
}

/**
 * Get a specific section by ID
 */
export async function getSection(contentItemId: string, sectionId: string): Promise<SavedSection | null> {
  try {
    const { data, error } = await supabase
      .from('content_item_sections')
      .select('*')
      .eq('content_item_id', contentItemId)
      .eq('section_id', sectionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      console.error('[Section Storage] Get section error:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[Section Storage] Get section exception:', err);
    return null;
  }
}

/**
 * Delete all sections for a content item (cleanup after assembly)
 */
export async function clearSections(contentItemId: string): Promise<{ success: boolean; deleted: number }> {
  try {
    const { data, error } = await supabase
      .from('content_item_sections')
      .delete()
      .eq('content_item_id', contentItemId)
      .select('id');

    if (error) {
      console.error('[Section Storage] Clear sections error:', error);
      return { success: false, deleted: 0 };
    }

    const deletedCount = data?.length || 0;
    console.log(`[Section Storage] Cleared ${deletedCount} sections for content item ${contentItemId}`);
    return { success: true, deleted: deletedCount };
  } catch (err) {
    console.error('[Section Storage] Clear sections exception:', err);
    return { success: false, deleted: 0 };
  }
}

/**
 * Get section count for a content item
 */
export async function getSectionCount(contentItemId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('content_item_sections')
      .select('id', { count: 'exact', head: true })
      .eq('content_item_id', contentItemId);

    if (error) {
      console.error('[Section Storage] Count error:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('[Section Storage] Count exception:', err);
    return 0;
  }
}

/**
 * Assemble all sections into a single HTML string
 */
export async function assembleSectionsHtml(contentItemId: string): Promise<string> {
  const sections = await getSections(contentItemId);
  
  if (sections.length === 0) {
    console.warn(`[Section Storage] No sections found for content item ${contentItemId}`);
    return '';
  }

  // Concatenate all section HTML in order
  const assembledHtml = sections
    .map(s => s.section_html)
    .join('\n\n');

  console.log(`[Section Storage] Assembled ${sections.length} sections (${assembledHtml.length} chars) for content item ${contentItemId}`);
  return assembledHtml;
}

// ========================================
// Product Research Storage
// ========================================

export interface ProductResearchData {
  product_name: string;
  product_url: string;
  description?: string;
  tagline?: string;
  target_audience?: string;
  features: Record<string, 'yes' | 'partial' | 'no' | 'not_mentioned'>;
  key_features?: string[];
  pricing?: {
    starting_price?: string;
    free_tier?: boolean;
    pricing_model?: string;
    plans?: Array<{ name: string; price: string; features?: string[] }>;
  };
  pros?: string[];
  cons?: string[];
  best_for?: string;
  logo_url?: string | null;
  screenshot_url?: string | null; // Homepage screenshot URL
  researched_at: string;
}

/**
 * Save product research data for a content item
 */
export async function saveProductResearch(
  contentItemId: string,
  productName: string,
  data: Omit<ProductResearchData, 'researched_at'>
): Promise<{ success: boolean; error?: string }> {
  const sectionId = `product-research-${productName.toLowerCase().replace(/\s+/g, '-')}`;
  
  return saveSection({
    content_item_id: contentItemId,
    section_id: sectionId,
    section_type: 'product_research',
    section_order: 0, // Research comes before any section
    section_html: '', // No HTML for research data
    metadata: {
      ...data,
      researched_at: new Date().toISOString(),
    } as Record<string, unknown>,
  });
}

/**
 * Get all product research data for a content item
 */
export async function getProductResearchList(contentItemId: string): Promise<ProductResearchData[]> {
  try {
    const { data, error } = await supabase
      .from('content_item_sections')
      .select('*')
      .eq('content_item_id', contentItemId)
      .eq('section_type', 'product_research')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Section Storage] Get product research error:', error);
      return [];
    }

    // Extract metadata as ProductResearchData
    const results = (data || []).map(row => row.metadata as ProductResearchData);
    console.log(`[Section Storage] Retrieved ${results.length} product research entries for content item ${contentItemId}`);
    return results;
  } catch (err) {
    console.error('[Section Storage] Get product research exception:', err);
    return [];
  }
}

/**
 * Get product research for a specific product
 */
export async function getProductResearch(contentItemId: string, productName: string): Promise<ProductResearchData | null> {
  const sectionId = `product-research-${productName.toLowerCase().replace(/\s+/g, '-')}`;
  const section = await getSection(contentItemId, sectionId);
  
  if (!section) return null;
  return section.metadata as unknown as ProductResearchData;
}
