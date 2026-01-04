import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Helper to create authenticated Supabase client
async function createAuthenticatedClient(request: NextRequest) {
  const cookieStore = await cookies();
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

// GET: Fetch all site contexts for the user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAuthenticatedClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: contexts, error } = await supabase
      .from('site_contexts')
      .select('*')
      .eq('user_id', user.id)
      .order('type', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ contexts: contexts || [] });

  } catch (error) {
    console.error('Error fetching site contexts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site contexts' },
      { status: 500 }
    );
  }
}

// POST/PUT: Upsert a site context (create or update)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAuthenticatedClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error in POST:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, content, fileUrl, primaryColor, secondaryColor, headingFont, bodyFont, tone, languages } = body;

    console.log('POST /api/site-contexts - User:', user.id, 'Type:', type);

    if (!type) {
      return NextResponse.json(
        { error: 'Type is required' },
        { status: 400 }
      );
    }

    if (!['logo', 'header', 'footer', 'meta', 'sitemap'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type' },
        { status: 400 }
      );
    }

    // Try to find existing context
    const { data: existing, error: selectError } = await supabase
      .from('site_contexts')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', type)
      .maybeSingle();

    if (selectError) {
      console.error('Error finding existing context:', selectError);
      return NextResponse.json(
        { 
          error: 'Failed to query existing context',
          details: selectError.message 
        },
        { status: 500 }
      );
    }

    console.log('Existing context found:', !!existing);

    let context;

    const updateData: any = {
      content: content || null,
      file_url: fileUrl || null,
      updated_at: new Date().toISOString(),
    };

    // Add brand asset fields if provided
    if (primaryColor !== undefined) updateData.primary_color = primaryColor;
    if (secondaryColor !== undefined) updateData.secondary_color = secondaryColor;
    if (headingFont !== undefined) updateData.heading_font = headingFont;
    if (bodyFont !== undefined) updateData.body_font = bodyFont;
    if (tone !== undefined) updateData.tone = tone;
    if (languages !== undefined) updateData.languages = languages;

    if (existing) {
      // Update existing
      console.log('Updating existing context:', existing.id);
      const { data, error } = await supabase
        .from('site_contexts')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating context:', error);
        return NextResponse.json(
          { 
            error: 'Failed to update context',
            details: error.message 
          },
          { status: 500 }
        );
      }
      context = data;
      console.log('Context updated successfully:', context.id);
    } else {
      // Create new
      console.log('Creating new context for user:', user.id);
      const insertData: any = {
        user_id: user.id,
        type,
        content: content || null,
        file_url: fileUrl || null,
      };

      // Add brand asset fields if provided
      if (primaryColor !== undefined) insertData.primary_color = primaryColor;
      if (secondaryColor !== undefined) insertData.secondary_color = secondaryColor;
      if (headingFont !== undefined) insertData.heading_font = headingFont;
      if (bodyFont !== undefined) insertData.body_font = bodyFont;
      if (tone !== undefined) insertData.tone = tone;
      if (languages !== undefined) insertData.languages = languages;

      const { data, error } = await supabase
        .from('site_contexts')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating context:', error);
        return NextResponse.json(
          { 
            error: 'Failed to create context',
            details: error.message,
            code: error.code 
          },
          { status: 500 }
        );
      }
      context = data;
      console.log('Context created successfully:', context.id);
    }

    return NextResponse.json({ context });

  } catch (error) {
    console.error('Error upserting site context:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save site context',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

