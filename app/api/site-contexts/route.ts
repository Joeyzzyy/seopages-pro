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

// GET: Fetch all site contexts for the user, optionally filtered by domainId
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAuthenticatedClient(request);
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

      // Only 'logo' type needs the brand asset columns
      if (ctx.type === 'logo') {
        return {
          ...base,
          file_url: ctx.file_url,
          brand_name: ctx.brand_name,
          subtitle: ctx.subtitle,
          meta_description: ctx.meta_description,
          og_image: ctx.og_image,
          favicon: ctx.favicon,
          logo_light: ctx.logo_light,
          logo_dark: ctx.logo_dark,
          icon_light: ctx.icon_light,
          icon_dark: ctx.icon_dark,
          primary_color: ctx.primary_color,
          secondary_color: ctx.secondary_color,
          heading_font: ctx.heading_font,
          body_font: ctx.body_font,
          tone: ctx.tone,
          languages: ctx.languages,
        };
      }

      // Other types just need content
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
    const supabase = await createAuthenticatedClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error in POST:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      type, content, fileUrl, projectId,
      brandName, subtitle, metaDescription, ogImage, favicon,
      logoLight, logoDark, iconLight, iconDark,
      primaryColor, secondaryColor, headingFont, bodyFont, tone, languages 
    } = body;

    console.log('POST /api/site-contexts - User:', user.id, 'Type:', type, 'Project:', projectId);

    if (!type) {
      return NextResponse.json(
        { error: 'Type is required' },
        { status: 400 }
      );
    }

    const validTypes = [
      'logo', 'header', 'footer', 'meta', 'sitemap',
      'key-website-pages', 'landing-pages', 'blog-resources',
      'hero-section', 'problem-statement', 'who-we-serve',
      'use-cases', 'industries', 'products-services',
      'social-proof-trust', 'leadership-team', 'about-us',
      'faq', 'contact-information'
    ];

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

    const updateData: any = {
      content: content || null,
      file_url: fileUrl || null,
      project_id: projectId || null,
      updated_at: new Date().toISOString(),
    };

    // Add brand asset fields if provided
    if (brandName !== undefined) updateData.brand_name = brandName;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (metaDescription !== undefined) updateData.meta_description = metaDescription;
    if (ogImage !== undefined) updateData.og_image = ogImage;
    if (favicon !== undefined) updateData.favicon = favicon;
    if (logoLight !== undefined) updateData.logo_light = logoLight;
    if (logoDark !== undefined) updateData.logo_dark = logoDark;
    if (iconLight !== undefined) updateData.icon_light = iconLight;
    if (iconDark !== undefined) updateData.icon_dark = iconDark;
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
      console.log('Creating new context for user:', user.id, 'Project:', projectId);
      const insertData: any = {
        user_id: user.id,
        type,
        content: content || null,
        file_url: fileUrl || null,
        project_id: projectId || null,
      };

      // Add brand asset fields if provided
      if (brandName !== undefined) insertData.brand_name = brandName;
      if (subtitle !== undefined) insertData.subtitle = subtitle;
      if (metaDescription !== undefined) insertData.meta_description = metaDescription;
      if (ogImage !== undefined) insertData.og_image = ogImage;
      if (favicon !== undefined) insertData.favicon = favicon;
      if (logoLight !== undefined) insertData.logo_light = logoLight;
      if (logoDark !== undefined) insertData.logo_dark = logoDark;
      if (iconLight !== undefined) insertData.icon_light = iconLight;
      if (iconDark !== undefined) insertData.icon_dark = iconDark;
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

