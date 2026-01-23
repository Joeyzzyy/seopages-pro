import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper to create authenticated Supabase client
async function createAuthenticatedClient(request: NextRequest) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: request.headers.get('Authorization') || '',
        },
      },
    }
  );
}

// Simple competitor discovery using web search simulation
async function discoverCompetitors(url: string): Promise<Array<{ name: string; url: string; description?: string }>> {
  // Extract domain info
  let domain: string;
  try {
    const urlObj = new URL(url);
    domain = urlObj.hostname.replace('www.', '');
  } catch {
    domain = url.replace(/^https?:\/\//, '').replace('www.', '').split('/')[0];
  }

  // Use Azure OpenAI to discover competitors
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4.1';

  if (!endpoint || !apiKey) {
    throw new Error('Azure OpenAI configuration missing');
  }

  const apiUrl = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-04-01-preview`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'system',
          content: `You are a competitive analysis expert. When given a website domain, identify AT LEAST 12-15 direct competitors in the same industry/niche. Be thorough and comprehensive.
          
Return ONLY a valid JSON array with this exact format, no other text:
[
  {"name": "Competitor Name", "url": "https://competitor.com", "description": "Brief description of what they do"}
]

Requirements:
- Find AT LEAST 12 competitors, preferably 15+
- Include direct competitors offering similar products/services
- Include well-known industry leaders
- Include emerging alternatives and newer players
- Include both larger enterprises and similar-sized competitors
- Include international alternatives if relevant
- Make sure all URLs are accurate and working`
        },
        {
          role: 'user',
          content: `Find competitors for: ${domain}

This website appears to be in the ${guessIndustry(domain)} space. List at least 12-15 main competitors with accurate URLs. Be comprehensive and include both well-known players and emerging alternatives.`
        }
      ],
      temperature: 0.5,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Azure OpenAI error:', errorText);
    throw new Error('Failed to discover competitors');
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '[]';

  try {
    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    
    const competitors = JSON.parse(jsonStr);
    
    // Validate and clean the response
    if (Array.isArray(competitors)) {
      return competitors
        .filter((c: any) => c.name && c.url)
        .map((c: any) => ({
          name: String(c.name).trim(),
          url: String(c.url).trim(),
          description: c.description ? String(c.description).trim() : undefined,
        }));
    }
  } catch (parseError) {
    console.error('Failed to parse competitors JSON:', content);
  }

  return [];
}

// Helper to guess industry from domain
function guessIndustry(domain: string): string {
  const lowerDomain = domain.toLowerCase();
  
  if (lowerDomain.includes('seo') || lowerDomain.includes('search')) return 'SEO/Search Marketing';
  if (lowerDomain.includes('ai') || lowerDomain.includes('ml')) return 'AI/Machine Learning';
  if (lowerDomain.includes('crm') || lowerDomain.includes('sales')) return 'CRM/Sales';
  if (lowerDomain.includes('hr') || lowerDomain.includes('recruit')) return 'HR/Recruiting';
  if (lowerDomain.includes('finance') || lowerDomain.includes('pay')) return 'Finance/Payments';
  if (lowerDomain.includes('health') || lowerDomain.includes('med')) return 'Healthcare';
  if (lowerDomain.includes('edu') || lowerDomain.includes('learn')) return 'Education/EdTech';
  if (lowerDomain.includes('shop') || lowerDomain.includes('store') || lowerDomain.includes('commerce')) return 'E-commerce';
  if (lowerDomain.includes('market')) return 'Marketing';
  if (lowerDomain.includes('design') || lowerDomain.includes('creative')) return 'Design/Creative';
  if (lowerDomain.includes('dev') || lowerDomain.includes('code')) return 'Developer Tools';
  if (lowerDomain.includes('cloud') || lowerDomain.includes('host')) return 'Cloud/Hosting';
  
  return 'technology/SaaS';
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAuthenticatedClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url, projectId } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log(`[Competitors Discovery] Starting for URL: ${url}, User: ${user.id}`);

    // Discover competitors using AI
    const competitors = await discoverCompetitors(url);

    console.log(`[Competitors Discovery] Found ${competitors.length} competitors`);

    // Optionally save to database
    if (competitors.length > 0 && projectId) {
      // Get existing competitors
      const { data: existing } = await supabase
        .from('site_contexts')
        .select('content')
        .eq('user_id', user.id)
        .eq('project_id', projectId)
        .eq('type', 'competitors')
        .maybeSingle();

      let existingCompetitors: any[] = [];
      if (existing?.content) {
        try {
          existingCompetitors = JSON.parse(existing.content);
        } catch {}
      }

      // Merge (avoid duplicates by URL)
      const existingUrls = new Set(existingCompetitors.map((c: any) => c.url?.toLowerCase()));
      const newCompetitors = competitors.filter(c => !existingUrls.has(c.url?.toLowerCase()));
      const merged = [...existingCompetitors, ...newCompetitors];

      // Upsert to database
      await supabase
        .from('site_contexts')
        .upsert({
          user_id: user.id,
          project_id: projectId,
          type: 'competitors',
          content: JSON.stringify(merged),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,project_id,type',
        });
    }

    return NextResponse.json({
      success: true,
      competitors,
      message: `Found ${competitors.length} competitors`,
    });

  } catch (error: any) {
    console.error('[Competitors Discovery] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to discover competitors',
      },
      { status: 500 }
    );
  }
}
