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

interface Competitor {
  name: string;
  url: string;
  description?: string;
  source?: string;
}

// Normalize URL for deduplication
function normalizeUrl(url: string): string {
  try {
    const u = new URL(url.toLowerCase());
    return u.hostname.replace('www.', '');
  } catch {
    return url.toLowerCase().replace(/^https?:\/\//, '').replace('www.', '').split('/')[0];
  }
}

// Merge and deduplicate competitors from multiple sources
function mergeCompetitors(sources: Competitor[][]): Competitor[] {
  const seen = new Map<string, Competitor>();
  
  for (const source of sources) {
    for (const comp of source) {
      const normalizedUrl = normalizeUrl(comp.url);
      if (!seen.has(normalizedUrl)) {
        seen.set(normalizedUrl, comp);
      } else {
        // Merge descriptions if the existing one is shorter
        const existing = seen.get(normalizedUrl)!;
        if (comp.description && (!existing.description || comp.description.length > existing.description.length)) {
          seen.set(normalizedUrl, { ...existing, description: comp.description });
        }
      }
    }
  }
  
  return Array.from(seen.values());
}

// METHOD 1: GPT-4 Knowledge Base - Fast, comprehensive for well-known competitors
async function discoverFromKnowledgeBase(domain: string, industry: string): Promise<Competitor[]> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4.1';

  if (!endpoint || !apiKey) {
    console.warn('[Knowledge Base] Azure OpenAI not configured');
    return [];
  }

  const apiUrl = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-04-01-preview`;

  try {
    console.log(`[Knowledge Base] Discovering competitors for: ${domain}`);
    
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
            content: `You are a competitive analysis expert. When given a website domain, identify AT LEAST 15-20 direct competitors in the same industry/niche. Be thorough and comprehensive.
          
Return ONLY a valid JSON array with this exact format, no other text:
[
  {"name": "Competitor Name", "url": "https://competitor.com", "description": "Brief description of what they do"}
]

Requirements:
- Find AT LEAST 15 competitors, preferably 20+
- Include direct competitors offering similar products/services
- Include well-known industry leaders
- Include emerging alternatives and newer players
- Include both larger enterprises and similar-sized competitors
- Include international alternatives if relevant
- Make sure all URLs are accurate`
          },
          {
            role: 'user',
            content: `Find competitors for: ${domain}

This website appears to be in the ${industry} space. List at least 15-20 main competitors with accurate URLs. Be comprehensive and include:
1. Direct competitors (same product category)
2. Industry leaders
3. Emerging alternatives
4. Enterprise solutions
5. Budget-friendly options
6. International alternatives`
          }
        ],
        temperature: 0.5,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      console.error('[Knowledge Base] API error:', await response.text());
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';

    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    
    const competitors = JSON.parse(jsonStr);
    
    if (Array.isArray(competitors)) {
      const result = competitors
        .filter((c: any) => c.name && c.url)
        .map((c: any) => ({
          name: String(c.name).trim(),
          url: String(c.url).trim(),
          description: c.description ? String(c.description).trim() : undefined,
          source: 'knowledge_base',
        }));
      console.log(`[Knowledge Base] Found ${result.length} competitors`);
      return result;
    }
  } catch (error) {
    console.error('[Knowledge Base] Error:', error);
  }

  return [];
}

// METHOD 2: Perplexity Web Search - Real-time, discovers newer/smaller competitors
async function discoverFromWebSearch(domain: string, industry: string): Promise<Competitor[]> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    console.warn('[Web Search] Perplexity API key not configured');
    return [];
  }

  try {
    console.log(`[Web Search] Searching competitors for: ${domain}`);
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: `You are a competitive analysis expert. Search the web to find competitors of the given company.

Return ONLY a valid JSON array with this exact format, no other text:
[
  {"name": "Competitor Name", "url": "https://competitor.com", "description": "Brief description"}
]

Focus on:
- Direct competitors mentioned in review sites (G2, Capterra, TrustRadius)
- Alternatives mentioned in "vs" comparison articles
- Companies mentioned in "best alternatives to X" listicles
- Newer players and emerging alternatives
- Include accurate website URLs`
          },
          {
            role: 'user',
            content: `Search for all competitors and alternatives to ${domain} in the ${industry} space.

Look for:
1. "Best ${domain.split('.')[0]} alternatives 2024/2025"
2. "${domain.split('.')[0]} competitors"
3. "Tools like ${domain.split('.')[0]}"
4. Reviews and comparisons on G2, Capterra, Product Hunt

Return at least 10-15 competitors with accurate URLs.`
          }
        ],
        temperature: 0.2,
        max_tokens: 3000,
        return_citations: true,
        search_recency_filter: 'year',
      }),
    });

    if (!response.ok) {
      console.error('[Web Search] API error:', response.status);
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Extract JSON from response
    let jsonStr = content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    
    try {
      const competitors = JSON.parse(jsonStr);
      
      if (Array.isArray(competitors)) {
        const result = competitors
          .filter((c: any) => c.name && c.url)
          .map((c: any) => ({
            name: String(c.name).trim(),
            url: String(c.url).trim(),
            description: c.description ? String(c.description).trim() : undefined,
            source: 'web_search',
          }));
        console.log(`[Web Search] Found ${result.length} competitors`);
        return result;
      }
    } catch (parseError) {
      console.error('[Web Search] Failed to parse JSON from response');
    }
  } catch (error) {
    console.error('[Web Search] Error:', error);
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

    // Extract domain
    let domain: string;
    try {
      const urlObj = new URL(url);
      domain = urlObj.hostname.replace('www.', '');
    } catch {
      domain = url.replace(/^https?:\/\//, '').replace('www.', '').split('/')[0];
    }
    
    const industry = guessIndustry(domain);
    console.log(`[Competitors Discovery] Starting for: ${domain} (${industry}), User: ${user.id}`);

    // Run BOTH methods in parallel for speed
    const [knowledgeBaseResults, webSearchResults] = await Promise.all([
      discoverFromKnowledgeBase(domain, industry),
      discoverFromWebSearch(domain, industry),
    ]);

    console.log(`[Competitors Discovery] Knowledge Base: ${knowledgeBaseResults.length}, Web Search: ${webSearchResults.length}`);

    // Merge and deduplicate
    const competitors = mergeCompetitors([knowledgeBaseResults, webSearchResults]);
    
    // Remove the target domain itself from competitors
    const filteredCompetitors = competitors.filter(c => !normalizeUrl(c.url).includes(domain.split('.')[0]));

    console.log(`[Competitors Discovery] Total unique: ${filteredCompetitors.length} (after merge & dedup)`);

    // Save to database
    if (filteredCompetitors.length > 0 && projectId) {
      // Get existing competitors
      const { data: existing } = await supabase
        .from('site_contexts')
        .select('content')
        .eq('user_id', user.id)
        .eq('project_id', projectId)
        .eq('type', 'competitors')
        .maybeSingle();

      let existingCompetitors: Competitor[] = [];
      if (existing?.content) {
        try {
          existingCompetitors = JSON.parse(existing.content);
        } catch {}
      }

      // Merge with existing (avoid duplicates)
      const allCompetitors = mergeCompetitors([existingCompetitors, filteredCompetitors]);

      // Upsert to database
      await supabase
        .from('site_contexts')
        .upsert({
          user_id: user.id,
          project_id: projectId,
          type: 'competitors',
          content: JSON.stringify(allCompetitors),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,project_id,type',
        });
      
      console.log(`[Competitors Discovery] Saved ${allCompetitors.length} total competitors to database`);
    }

    return NextResponse.json({
      success: true,
      competitors: filteredCompetitors,
      sources: {
        knowledge_base: knowledgeBaseResults.length,
        web_search: webSearchResults.length,
        total_unique: filteredCompetitors.length,
      },
      message: `Found ${filteredCompetitors.length} unique competitors (${knowledgeBaseResults.length} from AI + ${webSearchResults.length} from web search)`,
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
