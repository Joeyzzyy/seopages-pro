import { NextResponse } from 'next/server';
import { createAuthenticatedServerClient } from '@/lib/supabase-server';

// Helper to get user from Authorization header (with proxy support)
async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  const supabase = createAuthenticatedServerClient(authHeader);
  const { data: { user } } = await supabase.auth.getUser();

  return user;
}

// POST: Add a subdirectory to a domain
export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { domainId, path } = body;

    if (!domainId || !path) {
      return NextResponse.json({ error: 'Domain ID and path are required' }, { status: 400 });
    }

    // Normalize path (ensure it starts with / and doesn't end with /)
    let normalizedPath = path.trim();
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = '/' + normalizedPath;
    }
    normalizedPath = normalizedPath.replace(/\/+$/, '');

    const { getServiceSupabase } = await import('@/lib/supabase');
    const serviceSupabase = getServiceSupabase();

    // Verify the domain belongs to the user and is verified
    const { data: domain, error: domainError } = await serviceSupabase
      .from('user_domains')
      .select('*')
      .eq('id', domainId)
      .eq('user_id', user.id)
      .single();

    if (domainError || !domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    if (!domain.verified) {
      return NextResponse.json({ error: 'Domain must be verified before adding subdirectories' }, { status: 400 });
    }

    // Add subdirectory
    const { data, error } = await serviceSupabase
      .from('domain_subdirectories')
      .upsert({
        domain_id: domainId,
        path: normalizedPath,
      }, { onConflict: 'domain_id,path' })
      .select()
      .single();

    if (error) {
      console.error('[Subdirectories POST] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Generate proxy configuration instructions
    const proxyConfig = generateProxyConfig(domain.domain, normalizedPath);

    return NextResponse.json({
      success: true,
      subdirectory: data,
      proxyConfig,
    });
  } catch (error: any) {
    console.error('[Subdirectories POST] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove a subdirectory
export async function DELETE(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subdirectoryId = searchParams.get('id');

    if (!subdirectoryId) {
      return NextResponse.json({ error: 'Subdirectory ID is required' }, { status: 400 });
    }

    const { getServiceSupabase } = await import('@/lib/supabase');
    const serviceSupabase = getServiceSupabase();

    // Verify ownership through domain
    const { data: subdirectory } = await serviceSupabase
      .from('domain_subdirectories')
      .select('*, domain:user_domains(*)')
      .eq('id', subdirectoryId)
      .single();

    if (!subdirectory || subdirectory.domain?.user_id !== user.id) {
      return NextResponse.json({ error: 'Subdirectory not found' }, { status: 404 });
    }

    const { error } = await serviceSupabase
      .from('domain_subdirectories')
      .delete()
      .eq('id', subdirectoryId);

    if (error) {
      console.error('[Subdirectories DELETE] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Subdirectories DELETE] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generateProxyConfig(domain: string, path: string) {
  // Replace with your actual rendering service URL
  const renderingServiceUrl = 'https://render.mini-agent.app';
  
  return {
    vercel: {
      description: 'Add this to your vercel.json file:',
      config: `{
  "rewrites": [
    {
      "source": "${path}/:path*",
      "destination": "${renderingServiceUrl}/${domain}${path}/:path*"
    }
  ]
}`,
    },
    nginx: {
      description: 'Add this to your nginx.conf server block:',
      config: `location ${path}/ {
    proxy_pass ${renderingServiceUrl}/${domain}${path}/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}`,
    },
    cloudflare: {
      description: 'Create a Cloudflare Worker with this code:',
      config: `export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('${path}')) {
      const targetUrl = '${renderingServiceUrl}/${domain}' + url.pathname;
      return fetch(targetUrl, request);
    }
    return fetch(request);
  }
}`,
    },
    nextjs: {
      description: 'Add this to your next.config.js:',
      config: `module.exports = {
  async rewrites() {
    return [
      {
        source: '${path}/:path*',
        destination: '${renderingServiceUrl}/${domain}${path}/:path*',
      },
    ];
  },
};`,
    },
  };
}
