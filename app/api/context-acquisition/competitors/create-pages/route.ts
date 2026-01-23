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

// Generate a default outline for listicle page (multiple products)
function generateListiclePageOutline(brandName: string, competitorCount: number) {
  const sections = [
    { h2: 'Quick Summary', word_count: 300 },
    { h2: 'How We Tested', word_count: 200 },
    { h2: 'Quick Comparison Table', word_count: 400 },
  ];
  
  // Add section for each product (brand + competitors)
  sections.push({ h2: `#1: ${brandName} (Our Pick)`, word_count: 500 });
  for (let i = 2; i <= competitorCount + 1; i++) {
    sections.push({ h2: `#${i}: Competitor`, word_count: 400 });
  }
  
  sections.push({ h2: 'Frequently Asked Questions', word_count: 500 });
  sections.push({ h2: 'Final Recommendation', word_count: 300 });
  
  return {
    h1: `Top ${competitorCount + 1} Best ${brandName} Alternatives in ${new Date().getFullYear()}`,
    sections,
  };
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
    let hasListiclePage = false;
    
    (existingItems || []).forEach((item: any) => {
      // Check if listicle page exists
      if (item.page_type === 'listicle') {
        hasListiclePage = true;
        return;
      }
      
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

    console.log(`[Create Pages] Found ${existingCompetitorNames.size} existing competitor pages, hasListiclePage: ${hasListiclePage}`);

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

    // 2. Create LISTICLE page (if doesn't exist and we have enough competitors)
    const totalCompetitors = competitors.length;
    let listicleCreated = false;
    
    if (!hasListiclePage && totalCompetitors >= 3) {
      const listCount = Math.min(totalCompetitors + 1, 15); // Brand + competitors, max 15
      const listicleTitle = `Top ${listCount} Best ${brandName} Alternatives in ${currentYear}`;
      const listicleOutline = generateListiclePageOutline(brandName, totalCompetitors);
      const estimatedWordCount = listicleOutline.sections.reduce((sum, s) => sum + s.word_count, 0);
      
      itemsToCreate.push({
        user_id: user.id,
        seo_project_id: projectId,
        project_id: alternativesProject?.id || null,
        title: listicleTitle,
        slug: generateSlug(`best-${brandName.toLowerCase()}-alternatives`),
        target_keyword: `best ${brandName.toLowerCase()} alternatives`,
        page_type: 'listicle',
        status: 'planned',
        outline: listicleOutline,
        estimated_word_count: estimatedWordCount,
        seo_title: `${listCount} Best ${brandName} Alternatives in ${currentYear} (Honest Reviews)`,
        seo_description: `Looking for ${brandName} alternatives? We tested and ranked the ${listCount} best options. Compare features, pricing, and find the perfect solution for your needs.`,
        notes: `Listicle page comparing ${brandName} with ${totalCompetitors} alternatives: ${competitors.slice(0, 5).map(c => c.name).join(', ')}${totalCompetitors > 5 ? '...' : ''}`,
      });
      
      listicleCreated = true;
      console.log(`[Create Pages] Will create listicle page: ${listicleTitle}`);
    }

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
