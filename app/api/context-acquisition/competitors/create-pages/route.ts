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

// Listicle page templates - TARGET COMPETITOR KEYWORDS, recommend OUR BRAND
// Strategy: When users search "[Competitor] alternatives", they find our page
// and we recommend OUR brand as the #1 choice
interface ListicleTemplate {
  id: string;
  // {competitor} = the competitor name we're targeting
  // {brand} = OUR brand name (to be recommended)
  // {count} = number of products in the list
  titleTemplate: string;
  slugTemplate: string;
  keywordTemplate: string;
  descTemplate: string;
  minCompetitors: number;
  maxProducts: number;
}

// Generate listicle pages for EACH major competitor
// This creates pages like "Top 10 Jasper Alternatives" where WE are ranked #1
function generateListiclePagesForCompetitors(
  brandName: string, 
  competitors: Competitor[], 
  currentYear: number
): Array<{
  title: string;
  slug: string;
  keyword: string;
  description: string;
  products: string[];
  targetCompetitor: string;
}> {
  const pages: Array<{
    title: string;
    slug: string;
    keyword: string;
    description: string;
    products: string[];
    targetCompetitor: string;
  }> = [];

  // For each major competitor, create a listicle targeting their name
  // e.g., "Top 10 Jasper Alternatives" - with OUR brand as #1
  competitors.slice(0, 8).forEach((competitor, idx) => {
    const compName = competitor.name;
    const compSlug = compName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Select other competitors (excluding the target) + our brand as #1
    const otherCompetitors = competitors
      .filter(c => c.name !== compName)
      .slice(0, 7)
      .map(c => c.name);
    
    // Our brand is ALWAYS #1 in the list
    const products = [brandName, ...otherCompetitors];

    pages.push({
      title: `Top ${products.length} Best ${compName} Alternatives in ${currentYear}`,
      slug: `best-${compSlug}-alternatives`,
      keyword: `best ${compName.toLowerCase()} alternatives`,
      description: `Looking for ${compName} alternatives? We tested and ranked the ${products.length} best options. ${brandName} leads as the top choice.`,
      products,
      targetCompetitor: compName,
    });
  });

  // Also create some category-based listicles
  if (competitors.length >= 5) {
    const topProducts = [brandName, ...competitors.slice(0, 9).map(c => c.name)];
    
    // "Best [Industry] Tools" style page
    pages.push({
      title: `Top ${topProducts.length} Best Tools in ${currentYear} (Expert Picks)`,
      slug: `best-tools-${currentYear}`,
      keyword: `best tools ${currentYear}`,
      description: `Looking for the best tools in ${currentYear}? We tested ${topProducts.length} options. ${brandName} tops our list.`,
      products: topProducts,
      targetCompetitor: 'category',
    });
  }

  return pages;
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
      .eq('seo_project_id', projectId)
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

    // 2. Create LISTICLE pages - TARGET competitor keywords, recommend OUR brand
    // Strategy: "Top 10 [Competitor] Alternatives" → users searching for competitor alternatives find our page
    // → we rank OUR brand as #1 in the list
    
    // Get existing listicle slugs to avoid duplicates
    const existingListicleSlugs = new Set<string>();
    (existingItems || []).forEach((item: any) => {
      if (item.page_type === 'listicle') {
        const keyword = (item.target_keyword || '').toLowerCase();
        existingListicleSlugs.add(keyword);
      }
    });

    // Generate listicle pages targeting each competitor's name
    const listiclePages = generateListiclePagesForCompetitors(brandName, competitors, currentYear);
    let listiclesCreated = 0;
    
    for (const page of listiclePages) {
      // Skip if similar listicle already exists
      if (existingListicleSlugs.has(page.keyword)) {
        console.log(`[Create Pages] Skipping listicle (exists): ${page.keyword}`);
        continue;
      }
      
      // Generate outline with actual product names (OUR brand is #1)
      const outline = generateListiclePageOutline(page.title, brandName, page.products, true);
      const estimatedWordCount = outline.sections.reduce((sum, s) => sum + s.word_count, 0);
      
      itemsToCreate.push({
        user_id: user.id,
        seo_project_id: projectId,
        project_id: alternativesProject?.id || null,
        title: page.title,
        slug: generateSlug(page.slug),
        target_keyword: page.keyword,
        page_type: 'listicle',
        status: 'planned',
        outline,
        estimated_word_count: estimatedWordCount,
        seo_title: `${page.title} | Honest Reviews & Comparison`,
        seo_description: page.description,
        notes: `Targeting: ${page.targetCompetitor} | Products: ${page.products.join(', ')}`,
      });
      
      listiclesCreated++;
      console.log(`[Create Pages] Will create listicle targeting "${page.targetCompetitor}": ${page.title}`);
    }
    
    console.log(`[Create Pages] Will create ${listiclesCreated} listicle pages targeting competitor keywords`);

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
