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

// POST: Publish a content item (change status from generated to published)
export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { contentItemId, domainId, subdirectoryPath, slug } = body;

    if (!contentItemId) {
      return NextResponse.json({ error: 'Content item ID is required' }, { status: 400 });
    }

    if (!domainId) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    // Use service role to bypass RLS
    const { getServiceSupabase } = await import('@/lib/supabase');
    const serviceSupabase = getServiceSupabase();

    // Verify the domain belongs to the user and is verified
    const { data: domain, error: domainError } = await serviceSupabase
      .from('user_domains')
      .select('id, domain, verified')
      .eq('id', domainId)
      .eq('user_id', user.id)
      .single();

    if (domainError || !domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    if (!domain.verified) {
      return NextResponse.json({ error: 'Domain must be verified before publishing' }, { status: 400 });
    }

    // First verify ownership and check current status
    const { data: item, error: fetchError } = await serviceSupabase
      .from('content_items')
      .select('id, user_id, status, generated_content, slug')
      .eq('id', contentItemId)
      .single();

    if (fetchError || !item) {
      return NextResponse.json({ error: 'Content item not found' }, { status: 404 });
    }

    if (item.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Only allow publishing from generated status
    if (item.status !== 'generated') {
      return NextResponse.json({ 
        error: `Cannot publish content with status "${item.status}". Content must be in "generated" status.` 
      }, { status: 400 });
    }

    // Check if content exists
    if (!item.generated_content) {
      return NextResponse.json({ 
        error: 'Cannot publish content without generated HTML' 
      }, { status: 400 });
    }

    // Check for slug conflicts on the same domain+path
    const publishedPath = subdirectoryPath === '/' ? '' : subdirectoryPath;
    const { data: existingItem } = await serviceSupabase
      .from('content_items')
      .select('id')
      .eq('published_domain', domain.domain)
      .eq('published_path', publishedPath)
      .eq('slug', slug)
      .eq('status', 'published')
      .neq('id', contentItemId)
      .single();

    if (existingItem) {
      return NextResponse.json({ 
        error: `A page with slug "${slug}" already exists at this path` 
      }, { status: 400 });
    }

    // Update status to published with domain info
    const { data: updatedItem, error: updateError } = await serviceSupabase
      .from('content_items')
      .update({ 
        status: 'published',
        slug: slug,
        published_domain: domain.domain,
        published_path: publishedPath,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', contentItemId)
      .select()
      .single();

    if (updateError) {
      console.error('[Publish] Error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Generate the published URL
    const publishedUrl = `https://${domain.domain}${publishedPath}/${slug}`;

    return NextResponse.json({ 
      success: true, 
      item: updatedItem,
      publishedUrl,
      message: 'Content published successfully'
    });
  } catch (error: any) {
    console.error('[Publish] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Unpublish a content item (change status from published back to generated)
export async function DELETE(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const contentItemId = searchParams.get('id');

    if (!contentItemId) {
      return NextResponse.json({ error: 'Content item ID is required' }, { status: 400 });
    }

    const { getServiceSupabase } = await import('@/lib/supabase');
    const serviceSupabase = getServiceSupabase();

    // Verify ownership
    const { data: item, error: fetchError } = await serviceSupabase
      .from('content_items')
      .select('id, user_id, status')
      .eq('id', contentItemId)
      .single();

    if (fetchError || !item) {
      return NextResponse.json({ error: 'Content item not found' }, { status: 404 });
    }

    if (item.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (item.status !== 'published') {
      return NextResponse.json({ 
        error: `Cannot unpublish content with status "${item.status}". Content must be in "published" status.` 
      }, { status: 400 });
    }

    // Update status back to generated
    const { data: updatedItem, error: updateError } = await serviceSupabase
      .from('content_items')
      .update({ 
        status: 'generated',
        updated_at: new Date().toISOString()
      })
      .eq('id', contentItemId)
      .select()
      .single();

    if (updateError) {
      console.error('[Unpublish] Error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      item: updatedItem,
      message: 'Content unpublished successfully'
    });
  } catch (error: any) {
    console.error('[Unpublish] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

