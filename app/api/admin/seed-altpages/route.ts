import { NextResponse } from 'next/server';
import { createServerSupabaseAdmin } from '@/lib/supabase-server';

const supabase = createServerSupabaseAdmin();

// 38 个竞品
const COMPETITORS = [
  // AI 内容 & SEO 写作工具
  { name: 'Jasper AI', slug: 'jasper-ai', category: 'AI Writing' },
  { name: 'Copy.ai', slug: 'copy-ai', category: 'AI Writing' },
  { name: 'Writesonic', slug: 'writesonic', category: 'AI Writing' },
  { name: 'Surfer SEO', slug: 'surfer-seo', category: 'SEO Content' },
  { name: 'Frase', slug: 'frase', category: 'SEO Content' },
  { name: 'MarketMuse', slug: 'marketmuse', category: 'Content Strategy' },
  { name: 'Clearscope', slug: 'clearscope', category: 'Content Optimization' },
  { name: 'NeuronWriter', slug: 'neuronwriter', category: 'SEO Writing' },
  { name: 'GrowthBar', slug: 'growthbar', category: 'SEO Tools' },
  { name: 'Scalenut', slug: 'scalenut', category: 'AI Content' },
  { name: 'ContentShake AI', slug: 'contentshake-ai', category: 'AI Content' },
  { name: 'Koala AI', slug: 'koala-ai', category: 'AI Writing' },
  { name: 'Article Forge', slug: 'article-forge', category: 'AI Writing' },
  { name: 'Rytr', slug: 'rytr', category: 'AI Writing' },
  { name: 'Anyword', slug: 'anyword', category: 'AI Copywriting' },
  
  // 综合 SEO 平台
  { name: 'Ahrefs', slug: 'ahrefs', category: 'SEO Suite' },
  { name: 'SEMrush', slug: 'semrush', category: 'SEO Suite' },
  { name: 'Moz Pro', slug: 'moz-pro', category: 'SEO Suite' },
  { name: 'Ubersuggest', slug: 'ubersuggest', category: 'SEO Tools' },
  { name: 'Serpstat', slug: 'serpstat', category: 'SEO Platform' },
  { name: 'SE Ranking', slug: 'se-ranking', category: 'SEO Platform' },
  { name: 'SpyFu', slug: 'spyfu', category: 'Competitor Analysis' },
  { name: 'Mangools', slug: 'mangools', category: 'SEO Tools' },
  { name: 'Raven Tools', slug: 'raven-tools', category: 'SEO Reporting' },
  
  // Landing Page 构建器
  { name: 'Unbounce', slug: 'unbounce', category: 'Landing Pages' },
  { name: 'Instapage', slug: 'instapage', category: 'Landing Pages' },
  { name: 'Leadpages', slug: 'leadpages', category: 'Landing Pages' },
  { name: 'ClickFunnels', slug: 'clickfunnels', category: 'Sales Funnels' },
  { name: 'Carrd', slug: 'carrd', category: 'Simple Pages' },
  
  // WordPress SEO & 其他工具
  { name: 'Rank Math', slug: 'rank-math', category: 'WordPress SEO' },
  { name: 'Yoast SEO', slug: 'yoast-seo', category: 'WordPress SEO' },
  { name: 'All in One SEO', slug: 'all-in-one-seo', category: 'WordPress SEO' },
  { name: 'Screaming Frog', slug: 'screaming-frog', category: 'Technical SEO' },
  { name: 'Sitebulb', slug: 'sitebulb', category: 'Technical SEO' },
  { name: 'Page Optimizer Pro', slug: 'page-optimizer-pro', category: 'On-Page SEO' },
  { name: 'SurgeGraph', slug: 'surgegraph', category: 'AI Content' },
  { name: 'WordLift', slug: 'wordlift', category: 'AI SEO' },
  { name: 'Outranking', slug: 'outranking', category: 'AI SEO' },
];

function generateOutline(competitor: typeof COMPETITORS[0]) {
  return {
    h1: `SEOPages.pro vs ${competitor.name}: Best Alternative Page Generator in 2026`,
    sections: [
      {
        h2: `Why Choose SEOPages.pro Over ${competitor.name}?`,
        key_points: [
          'Specialized in alternative page generation - we do one thing and do it best',
          'AI-powered competitive analysis built-in',
          'More affordable pricing with transparent plans',
          'Better conversion-focused templates designed for comparison pages'
        ],
        word_count: 300
      },
      {
        h2: `${competitor.name} Overview`,
        h3s: [`What is ${competitor.name}?`, `${competitor.name} Key Features`, `${competitor.name} Pricing`],
        key_points: [`${competitor.category} tool overview`, 'Their main features and capabilities', 'Pricing structure comparison'],
        word_count: 400
      },
      {
        h2: 'SEOPages.pro Overview',
        h3s: ['What is SEOPages.pro?', 'Our Key Features', 'Pricing Plans'],
        key_points: ['AI-powered alternative page generator', 'Specialized for competitor comparison pages', 'Affordable, transparent pricing', 'High-converting templates'],
        word_count: 400
      },
      {
        h2: `Feature Comparison: SEOPages.pro vs ${competitor.name}`,
        h3s: ['Alternative Page Generation', 'AI Content Quality', 'Ease of Use', 'Value for Money'],
        key_points: ['Direct feature-by-feature comparison', 'Our strengths in altpage generation', 'Specialized vs generalist approach'],
        word_count: 500
      },
      {
        h2: `When to Choose SEOPages.pro Over ${competitor.name}`,
        key_points: ['You need high-quality alternative/comparison pages', 'You want a specialized tool', 'Budget-conscious but quality-focused', 'Fast turnaround needed'],
        word_count: 300
      },
      {
        h2: `When ${competitor.name} Might Be Better`,
        key_points: ['Honest assessment of their strengths', 'Use cases where they excel', 'Building trust through transparency'],
        word_count: 200
      },
      {
        h2: 'Verdict: SEOPages.pro is the Best Choice for Alternative Pages',
        key_points: ['Summary of key advantages', 'Clear recommendation', 'Call to action'],
        word_count: 200
      },
      {
        h2: 'FAQ',
        h3s: [`Is SEOPages.pro really better than ${competitor.name}?`, 'How much does SEOPages.pro cost?', `Can I migrate from ${competitor.name}?`, 'Do you offer a free trial?'],
        word_count: 300
      }
    ]
  };
}

/**
 * POST /api/admin/seed-altpages
 * 
 * Body: { user_id: string, seo_project_id: string }
 * 
 * Creates the "SEOPages.pro vs SEO Tools" topic cluster with 38 competitor pages
 */
export async function POST(req: Request) {
  try {
    const { user_id, seo_project_id } = await req.json();

    if (!user_id || !seo_project_id) {
      return NextResponse.json({ error: 'user_id and seo_project_id are required' }, { status: 400 });
    }

    const CLUSTER_NAME = 'SEOPages.pro vs SEO Tools';
    const CLUSTER_DESCRIPTION = 'Alternative pages comparing SEOPages.pro against all major SEO tools and AI content platforms.';

    // 1. Create or find Topic Cluster
    let projectId: string;
    
    const { data: existingProject } = await supabase
      .from('content_projects')
      .select('id')
      .eq('user_id', user_id)
      .eq('seo_project_id', seo_project_id)
      .ilike('name', CLUSTER_NAME)
      .single();

    if (existingProject) {
      projectId = existingProject.id;
    } else {
      const { data: newProject, error } = await supabase
        .from('content_projects')
        .insert({
          user_id,
          seo_project_id,
          name: CLUSTER_NAME,
          description: CLUSTER_DESCRIPTION,
        })
        .select('id')
        .single();

      if (error) throw error;
      projectId = newProject.id;
    }

    // 2. Create content items
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const competitor of COMPETITORS) {
      const slug = `seopages-pro-vs-${competitor.slug}-alternative`;
      const outline = generateOutline(competitor);

      // Check if exists
      const { data: existing } = await supabase
        .from('content_items')
        .select('id')
        .eq('user_id', user_id)
        .eq('slug', slug)
        .single();

      if (existing) {
        skipped++;
        continue;
      }

      const { error } = await supabase.from('content_items').insert({
        user_id,
        seo_project_id,
        project_id: projectId,
        title: outline.h1,
        slug,
        page_type: 'alternative',
        target_keyword: `seopages.pro vs ${competitor.name}`.toLowerCase(),
        seo_title: `SEOPages.pro vs ${competitor.name} (2026) - Best Alternative Page Generator`,
        seo_description: `Compare SEOPages.pro vs ${competitor.name}. See why SEOPages.pro is the best choice for generating high-converting alternative pages.`,
        outline,
        keyword_data: { category: competitor.category },
        status: 'ready',
        priority: (competitor.category === 'AI Writing' || competitor.category === 'SEO Content') ? 1 : 2,
        estimated_word_count: 2600,
        notes: `Competitor: ${competitor.name} (${competitor.category})`,
      });

      if (error) {
        errors.push(`${competitor.name}: ${error.message}`);
      } else {
        created++;
      }
    }

    return NextResponse.json({
      success: true,
      cluster_id: projectId,
      cluster_name: CLUSTER_NAME,
      created,
      skipped,
      total: COMPETITORS.length,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error('[seed-altpages] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
