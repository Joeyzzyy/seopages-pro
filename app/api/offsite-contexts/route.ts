import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createAuthenticatedClient(request: NextRequest) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: request.headers.get('Authorization') || '',
        },
      },
    }
  );
}

// GET: Fetch offsite context for a project
export async function GET(request: NextRequest) {
  try {
    const authClient = await createAuthenticatedClient(request);
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('offsite_contexts')
      .select('*')
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found - return empty context
        return NextResponse.json({ data: null });
      }
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[offsite-contexts GET] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST: Create or update offsite context
export async function POST(request: NextRequest) {
  try {
    const authClient = await createAuthenticatedClient(request);
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, ...contextData } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const upsertData = {
      user_id: user.id,
      project_id: projectId,
      ...contextData,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('offsite_contexts')
      .upsert(upsertData, { onConflict: 'user_id,project_id' })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[offsite-contexts POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PATCH: Update specific fields in offsite context
export async function PATCH(request: NextRequest) {
  try {
    const authClient = await createAuthenticatedClient(request);
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, ...updates } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('offsite_contexts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[offsite-contexts PATCH] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

