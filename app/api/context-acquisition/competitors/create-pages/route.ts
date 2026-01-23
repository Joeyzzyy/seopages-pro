import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Competitor {
  name: string;
  url: string;
  description?: string;
  logo_url?: string;
}

// Generate a default outline for alternative page (1v1 comparison)
function generateAlternativePageOutline(brandName: string, competitorName: string) {
  return {
    h1: `${brandName} vs ${competitorName}: Complete Comparison`,
    sections: [
      { h2: 'Quick Verdict', word_count: 300 },
      { h2: `What is ${brandName}?`, word_count: 400 },
      { h2: `What is ${competitorName}?`, word_count: 400 },
      { h2: 'Feature Comparison', word_count: 600 },
      { h2: 'Pricing Comparison', word_count: 400 },
      { h2: `${brandName} Pros & Cons`, word_count: 300 },
      { h2: `${competitorName} Pros & Cons`, word_count: 300 },
      { h2: 'Who Should Use Which?', word_count: 400 },
      { h2: 'Frequently Asked Questions', word_count: 500 },
      { h2: 'Final Verdict', word_count: 300 },
    ],
  };
}

// Generate outline for listicle page with specific products
function generateListiclePageOutline(
  title: string,
  brandName: string, 
  productNames: string[],
  includesBrand: boolean = true
) {
  const sections = [
    { h2: 'Quick Summary', word_count: 300 },
    { h2: 'How We Evaluated', word_count: 200 },
    { h2: 'Quick Comparison Table', word_count: 400 },
  ];
  
  // Add section for each product with actual names
  productNames.forEach((name, index) => {
    const rank = index + 1;
    const isBrand = name.toLowerCase() === brandName.toLowerCase();
    const suffix = isBrand ? ' (Our Pick)' : '';
    sections.push({ 
      h2: `#${rank}: ${name}${suffix}`, 
      word_count: isBrand ? 500 : 400 
    });
  });
  
  sections.push({ h2: 'Frequently Asked Questions', word_count: 500 });
  sections.push({ h2: 'Final Recommendation', word_count: 300 });
  
  return { h1: title, sections };
}

// Listicle page templates for different angles
interface ListicleTemplate {
  titleTemplate: string;
  slugTemplate: string;
  keywordTemplate: string;
  descTemplate: string;
  minCompetitors: number;
  maxProducts: number;
  includeBrand: boolean;
  selectProducts: (brandName: string, competitors: Competitor[]) => string[];
}

function getListicleTemplates(brandName: string, currentYear: number): ListicleTemplate[] {
  return [
    // 1. General "Best Alternatives" - Top 10
    {
      titleTemplate: `Top {count} Best {brand} Alternatives in ${currentYear}`,
      slugTemplate: `best-{brand}-alternatives`,
      keywordTemplate: `best {brand} alternatives`,
      descTemplate: `Looking for {brand} alternatives? We tested and ranked the {count} best options with honest reviews.`,
      minCompetitors: 3,
      maxProducts: 10,
      includeBrand: true,
      selectProducts: (brand, comps) => [brand, ...comps.slice(0, 9).map(c => c.name)],
    },
    // 2. Top 5 compact list
    {
      titleTemplate: `Top 5 {brand} Alternatives You Should Consider`,
      slugTemplate: `top-5-{brand}-alternatives`,
      keywordTemplate: `top 5 {brand} alternatives`,
      descTemplate: `Short on time? Here are the 5 best {brand} alternatives, carefully selected and compared.`,
      minCompetitors: 4,
      maxProducts: 5,
      includeBrand: true,
      selectProducts: (brand, comps) => [brand, ...comps.slice(0, 4).map(c => c.name)],
    },
    // 3. Free alternatives
    {
      titleTemplate: `Best Free {brand} Alternatives in ${currentYear}`,
      slugTemplate: `free-{brand}-alternatives`,
      keywordTemplate: `free {brand} alternatives`,
      descTemplate: `Looking for free {brand} alternatives? Discover the best no-cost options that actually work.`,
      minCompetitors: 2,
      maxProducts: 8,
      includeBrand: true,
      selectProducts: (brand, comps) => [brand, ...comps.slice(0, 7).map(c => c.name)],
    },
    // 4. For small business / startups
    {
      titleTemplate: `Best {brand} Alternatives for Small Business (${currentYear})`,
      slugTemplate: `{brand}-alternatives-small-business`,
      keywordTemplate: `{brand} alternatives for small business`,
      descTemplate: `Running a small business? Find the best {brand} alternatives that fit your budget and needs.`,
      minCompetitors: 3,
      maxProducts: 7,
      includeBrand: true,
      selectProducts: (brand, comps) => [brand, ...comps.slice(0, 6).map(c => c.name)],
    },
    // 5. Cheaper alternatives
    {
      titleTemplate: `Cheaper {brand} Alternatives That Actually Work`,
      slugTemplate: `cheaper-{brand}-alternatives`,
      keywordTemplate: `cheaper {brand} alternatives`,
      descTemplate: `{brand} too expensive? Here are budget-friendly alternatives that deliver similar results.`,
      minCompetitors: 3,
      maxProducts: 8,
      includeBrand: false, // Don't include brand as it's positioned as expensive
      selectProducts: (brand, comps) => comps.slice(0, 8).map(c => c.name),
    },
    // 6. For enterprises / teams
    {
      titleTemplate: `Best {brand} Alternatives for Enterprise Teams`,
      slugTemplate: `{brand}-alternatives-enterprise`,
      keywordTemplate: `{brand} alternatives for enterprise`,
      descTemplate: `Need enterprise-grade features? Compare the best {brand} alternatives for large teams.`,
      minCompetitors: 4,
      maxProducts: 6,
      includeBrand: true,
      selectProducts: (brand, comps) => [brand, ...comps.slice(0, 5).map(c => c.name)],
    },
    // 7. "Tools like X"
    {
      titleTemplate: `{count} Tools Like {brand}: Best Similar Options`,
      slugTemplate: `tools-like-{brand}`,
      keywordTemplate: `tools like {brand}`,
      descTemplate: `Looking for tools similar to {brand}? Here are {count} alternatives that offer comparable features.`,
      minCompetitors: 5,
      maxProducts: 10,
      includeBrand: false,
      selectProducts: (brand, comps) => comps.slice(0, 10).map(c => c.name),
    },
    // 8. "X Competitors"
    {
      titleTemplate: `Top {brand} Competitors: Complete Market Analysis`,
      slugTemplate: `{brand}-competitors`,
      keywordTemplate: `{brand} competitors`,
      descTemplate: `Who are {brand}'s main competitors? A comprehensive analysis of the competitive landscape.`,
      minCompetitors: 4,
      maxProducts: 10,
      includeBrand: true,
      selectProducts: (brand, comps) => [brand, ...comps.slice(0, 9).map(c => c.name)],
    },
  ];
}

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user with service role
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, brandName, competitors } = body as {
      projectId: string;
      brandName: string;
      competitors: Competitor[];
    };

    if (!projectId || !brandName || !competitors?.length) {
      return NextResponse.json({ 
        error: 'Missing required fields: projectId, brandName, competitors' 
      }, { status: 400 });
    }

    console.log(`[Create Pages] Creating pages for ${competitors.length} competitors, brand: ${brandName}`);

    // Get ALL existing content items for this project (both alternative and listicle)
    const { data: existingItems, error: fetchError } = await supabase
      .from('content_items')
      .select('title, target_keyword, page_type')
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .in('page_type', ['alternative', 'listicle']);

    if (fetchError) {
      console.error('Error fetching existing items:', fetchError);
      return NextResponse.json({ error: 'Failed to check existing pages' }, { status: 500 });
    }

    // Normalize competitor names for comparison
    const normalizeCompetitorName = (name: string) => name.toLowerCase().trim();
    
    // Build a set of existing competitor names from titles/keywords (for alternative pages)
    const existingCompetitorNames = new Set<string>();
    
    (existingItems || []).forEach((item: any) => {
      // Skip listicle pages for competitor name extraction
      if (item.page_type === 'listicle') return;
      
      const title = (item.title || '').toLowerCase();
      const keyword = (item.target_keyword || '').toLowerCase();
      
      // Extract competitor name patterns from title like "Brand vs Competitor"
      const vsMatch = title.match(/vs\s+([^:]+)/i);
      if (vsMatch) {
        existingCompetitorNames.add(normalizeCompetitorName(vsMatch[1]));
      }
      
      // Also check keyword for "brand vs competitor" pattern
      const keywordVsMatch = keyword.match(/vs\s+([^:]+)/i);
      if (keywordVsMatch) {
        existingCompetitorNames.add(normalizeCompetitorName(keywordVsMatch[1]));
      }
      
      // Check for "alternative" pattern like "competitor alternative"
      const altMatch = keyword.match(/^([^\s]+)\s+alternative/i);
      if (altMatch) {
        existingCompetitorNames.add(normalizeCompetitorName(altMatch[1]));
      }
    });

    console.log(`[Create Pages] Found ${existingCompetitorNames.size} existing competitor pages`);

    // Filter out competitors that already have alternative pages
    const newCompetitors = competitors.filter(
      c => !existingCompetitorNames.has(normalizeCompetitorName(c.name))
    );

    console.log(`[Create Pages] ${newCompetitors.length} new competitors need alternative pages`);

    // Get or create the "Alternatives" content_project for this user
    let alternativesProject: any = null;
    
    // First check if there's an existing "Alternatives" project
    const { data: existingProject } = await supabase
      .from('content_projects')
      .select('*')
      .eq('user_id', user.id)
      .eq('seo_project_id', projectId)
      .ilike('name', '%alternative%')
      .maybeSingle();

    if (existingProject) {
      alternativesProject = existingProject;
    } else {
      // Create new project for alternatives
      const { data: newProject, error: createProjectError } = await supabase
        .from('content_projects')
        .insert({
          user_id: user.id,
          seo_project_id: projectId,
          name: `${brandName} Alternatives`,
        })
        .select()
        .single();

      if (createProjectError) {
        console.error('Error creating project:', createProjectError);
        // Continue without project grouping
      } else {
        alternativesProject = newProject;
      }
    }

    // Prepare all items to create
    const itemsToCreate: any[] = [];
    const currentYear = new Date().getFullYear();

    // 1. Create ALTERNATIVE pages (1v1) for new competitors
    newCompetitors.forEach(competitor => {
      const title = `${brandName} vs ${competitor.name}`;
      const targetKeyword = `${brandName.toLowerCase()} vs ${competitor.name.toLowerCase()}`;
      const outline = generateAlternativePageOutline(brandName, competitor.name);
      const estimatedWordCount = outline.sections.reduce((sum, s) => sum + s.word_count, 0);

      itemsToCreate.push({
        user_id: user.id,
        seo_project_id: projectId,
        project_id: alternativesProject?.id || null,
        title,
        slug: generateSlug(title),
        target_keyword: targetKeyword,
        page_type: 'alternative',
        status: 'planned',
        outline,
        estimated_word_count: estimatedWordCount,
        seo_title: `${brandName} vs ${competitor.name}: Which is Better in ${currentYear}?`,
        seo_description: `Detailed comparison of ${brandName} vs ${competitor.name}. Compare features, pricing, pros & cons to find the best solution for your needs.`,
        notes: competitor.description || `Alternative page comparing ${brandName} with ${competitor.name}`,
      });
    });

    // 2. Create LISTICLE pages from templates (multiple angles)
    const totalCompetitors = competitors.length;
    let listiclesCreated = 0;
    
    // Get existing listicle slugs to avoid duplicates
    const existingListicleSlugs = new Set<string>();
    (existingItems || []).forEach((item: any) => {
      if (item.page_type === 'listicle') {
        // Extract slug pattern from title
        const titleLower = (item.title || '').toLowerCase();
        if (titleLower.includes('top 5')) existingListicleSlugs.add('top-5');
        if (titleLower.includes('free')) existingListicleSlugs.add('free');
        if (titleLower.includes('small business')) existingListicleSlugs.add('small-business');
        if (titleLower.includes('cheaper')) existingListicleSlugs.add('cheaper');
        if (titleLower.includes('enterprise')) existingListicleSlugs.add('enterprise');
        if (titleLower.includes('tools like')) existingListicleSlugs.add('tools-like');
        if (titleLower.includes('competitors')) existingListicleSlugs.add('competitors');
        if (titleLower.includes('best') && titleLower.includes('alternative')) existingListicleSlugs.add('best-alternatives');
      }
    });

    // Get all listicle templates
    const templates = getListicleTemplates(brandName, currentYear);
    const brandNameLower = brandName.toLowerCase();
    
    for (const template of templates) {
      // Check if we have enough competitors for this template
      if (totalCompetitors < template.minCompetitors) continue;
      
      // Generate slug and check if already exists
      const slug = template.slugTemplate.replace(/{brand}/g, brandNameLower);
      const slugKey = slug.replace(brandNameLower, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
      
      // Skip if similar listicle already exists
      if (existingListicleSlugs.has(slugKey) || existingListicleSlugs.has(slug)) continue;
      
      // Select products for this template
      const selectedProducts = template.selectProducts(brandName, competitors);
      const productCount = selectedProducts.length;
      
      // Generate title and other fields
      const title = template.titleTemplate
        .replace(/{brand}/g, brandName)
        .replace(/{count}/g, String(productCount));
      
      const targetKeyword = template.keywordTemplate.replace(/{brand}/g, brandNameLower);
      const seoDescription = template.descTemplate
        .replace(/{brand}/g, brandName)
        .replace(/{count}/g, String(productCount));
      
      // Generate outline with actual product names
      const outline = generateListiclePageOutline(title, brandName, selectedProducts, template.includeBrand);
      const estimatedWordCount = outline.sections.reduce((sum, s) => sum + s.word_count, 0);
      
      itemsToCreate.push({
        user_id: user.id,
        seo_project_id: projectId,
        project_id: alternativesProject?.id || null,
        title,
        slug: generateSlug(slug),
        target_keyword: targetKeyword,
        page_type: 'listicle',
        status: 'planned',
        outline,
        estimated_word_count: estimatedWordCount,
        seo_title: `${title} | Honest Reviews & Comparison`,
        seo_description: seoDescription,
        notes: `Listicle: ${selectedProducts.join(', ')}`,
      });
      
      listiclesCreated++;
      console.log(`[Create Pages] Will create listicle: ${title}`);
    }
    
    console.log(`[Create Pages] Will create ${listiclesCreated} listicle pages from templates`);

    // Insert all items if there are any
    if (itemsToCreate.length === 0) {
      return NextResponse.json({
        success: true,
        created: 0,
        alternativePages: 0,
        listiclePages: 0,
        skipped: competitors.length,
        message: 'All pages already exist',
      });
    }

    const { data: createdItems, error: insertError } = await supabase
      .from('content_items')
      .insert(itemsToCreate)
      .select('id, title, page_type');

    if (insertError) {
      console.error('Error creating content items:', insertError);
      return NextResponse.json({ 
        error: 'Failed to create pages',
        details: insertError.message 
      }, { status: 500 });
    }

    const alternativeCount = createdItems?.filter(i => i.page_type === 'alternative').length || 0;
    const listicleCount = createdItems?.filter(i => i.page_type === 'listicle').length || 0;

    console.log(`[Create Pages] Created ${alternativeCount} alternative pages and ${listicleCount} listicle pages`);

    return NextResponse.json({
      success: true,
      created: createdItems?.length || 0,
      alternativePages: alternativeCount,
      listiclePages: listicleCount,
      skipped: competitors.length - newCompetitors.length,
      pages: createdItems?.map(item => ({ title: item.title, type: item.page_type })) || [],
      message: `Created ${alternativeCount} alternative pages${listicleCount > 0 ? ` and ${listicleCount} listicle page` : ''}`,
    });

  } catch (error: any) {
    console.error('[Create Pages] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to create pages',
      },
      { status: 500 }
    );
  }
}
