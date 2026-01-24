import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedServerClient } from '@/lib/supabase-server';

// GET: Fetch all site contexts for the user, optionally filtered by domainId
export async function GET(request: NextRequest) {
  try {
    const supabase = createAuthenticatedServerClient(request.headers.get('Authorization'));
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    let query = supabase
      .from('site_contexts')
      .select('*')
      .eq('user_id', user.id);
    
    if (projectId) {
      query = query.eq('project_id', projectId);
    } else {
      query = query.is('project_id', null);
    }

    const { data: rawContexts, error } = await query.order('type', { ascending: true });

    if (error) throw error;

    // Transform data: only return relevant fields per type
    const contexts = (rawContexts || []).map((ctx: any) => {
      // Base fields every type needs
      const base = {
        id: ctx.id,
        user_id: ctx.user_id,
        type: ctx.type,
        content: ctx.content,
        project_id: ctx.project_id,
        created_at: ctx.created_at,
        updated_at: ctx.updated_at,
      };

      // 'logo' type stores brand settings (simplified)
      if (ctx.type === 'logo') {
        return {
          ...base,
          // Simplified fields (prefer new fields, fallback to legacy)
          logo_url: ctx.logo_url || ctx.logo_light_url || ctx.file_url,
          favicon_url: ctx.favicon_url || ctx.favicon_light_url,
          // Legacy fields for backward compatibility
          file_url: ctx.file_url,
          logo_light_url: ctx.logo_light_url,
          domain_name: ctx.domain_name,
          og_image: ctx.og_image,
          primary_color: ctx.primary_color,
          secondary_color: ctx.secondary_color,
          heading_font: ctx.heading_font,
          body_font: ctx.body_font,
          languages: ctx.languages,
        };
      }

      // Header/footer types need the html field
      if (ctx.type === 'header' || ctx.type === 'footer') {
        return {
          ...base,
          html: ctx.html,
        };
      }

      // competitors type just needs content (JSON array)
      return base;
    });

    return NextResponse.json({ contexts });

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
    const supabase = createAuthenticatedServerClient(request.headers.get('Authorization'));
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error in POST:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      type, content, fileUrl, projectId, html,
      logoUrl, faviconUrl, // Simplified fields
      domainName, ogImage, primaryColor, secondaryColor, 
      headingFont, bodyFont, languages 
    } = body;

    console.log('POST /api/site-contexts - User:', user.id, 'Type:', type, 'Project:', projectId);

    if (!type) {
      return NextResponse.json(
        { error: 'Type is required' },
        { status: 400 }
      );
    }

    const validTypes = ['logo', 'header', 'footer', 'competitors'];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type' },
        { status: 400 }
      );
    }

    // Try to find existing context
    let query = supabase
      .from('site_contexts')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', type);
    
    if (projectId) {
      query = query.eq('project_id', projectId);
    } else {
      query = query.is('project_id', null);
    }

    const { data: existing, error: selectError } = await query.maybeSingle();

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

    // Helper to convert empty strings to null
    const toNullIfEmpty = (val: string | undefined): string | null => {
      if (val === undefined) return undefined as any;
      return val && val.trim() ? val.trim() : null;
    };

    const updateData: any = {
      content: content || null,
      file_url: fileUrl || null,
      project_id: projectId || null,
      updated_at: new Date().toISOString(),
    };

    // Add html field if provided (for header/footer)
    if (html !== undefined) updateData.html = html || null;

    // Add brand settings if provided (for logo type)
    // Convert empty strings to null for cleaner data
    // Simplified: single logo_url and favicon_url fields
    if (logoUrl !== undefined) {
      const url = toNullIfEmpty(logoUrl);
      updateData.logo_url = url;
      updateData.logo_light_url = url; // Also set legacy field for compatibility
    }
    if (faviconUrl !== undefined) {
      const url = toNullIfEmpty(faviconUrl);
      updateData.favicon_url = url;
      updateData.favicon_light_url = url; // Also set legacy field for compatibility
    }
    if (domainName !== undefined) updateData.domain_name = toNullIfEmpty(domainName);
    if (ogImage !== undefined) updateData.og_image = toNullIfEmpty(ogImage);
    if (primaryColor !== undefined) updateData.primary_color = toNullIfEmpty(primaryColor);
    if (secondaryColor !== undefined) updateData.secondary_color = toNullIfEmpty(secondaryColor);
    if (headingFont !== undefined) updateData.heading_font = toNullIfEmpty(headingFont);
    if (bodyFont !== undefined) updateData.body_font = toNullIfEmpty(bodyFont);
    if (languages !== undefined) updateData.languages = toNullIfEmpty(languages);

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
      console.log('Creating new context for user:', user.id, 'Project:', projectId);
      const insertData: any = {
        user_id: user.id,
        type,
        content: content || null,
        file_url: fileUrl || null,
        project_id: projectId || null,
      };

      // Add html field if provided (for header/footer)
      if (html !== undefined) insertData.html = html || null;

      // Add brand settings if provided (for logo type)
      // Convert empty strings to null for cleaner data
      // Simplified: single logo_url and favicon_url fields
      if (logoUrl !== undefined) {
        const url = toNullIfEmpty(logoUrl);
        insertData.logo_url = url;
        insertData.logo_light_url = url; // Also set legacy field for compatibility
      }
      if (faviconUrl !== undefined) {
        const url = toNullIfEmpty(faviconUrl);
        insertData.favicon_url = url;
        insertData.favicon_light_url = url; // Also set legacy field for compatibility
      }
      if (domainName !== undefined) insertData.domain_name = toNullIfEmpty(domainName);
      if (ogImage !== undefined) insertData.og_image = toNullIfEmpty(ogImage);
      if (primaryColor !== undefined) insertData.primary_color = toNullIfEmpty(primaryColor);
      if (secondaryColor !== undefined) insertData.secondary_color = toNullIfEmpty(secondaryColor);
      if (headingFont !== undefined) insertData.heading_font = toNullIfEmpty(headingFont);
      if (bodyFont !== undefined) insertData.body_font = toNullIfEmpty(bodyFont);
      if (languages !== undefined) insertData.languages = toNullIfEmpty(languages);

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

