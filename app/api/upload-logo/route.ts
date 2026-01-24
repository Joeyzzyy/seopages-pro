import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAdmin, createAuthenticatedServerClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    // Use service role to allow uploads from this API route (with proxy support)
    // This allows authenticated users to upload site logos
    const supabase = createServerSupabaseAdmin();

    // Try to get the current user for organization, but don't block if not found
    const authHeader = request.headers.get('Authorization');
    let userId = 'public';
    
    if (authHeader) {
      const authClient = createAuthenticatedServerClient(authHeader);
      const { data: { user } } = await authClient.auth.getUser();
      
      if (user) userId = user.id;
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split('.').pop();
    const filename = `${userId}/${timestamp}-${randomString}.${fileExt}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('logos')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      
      // Check if it's a bucket not found error
      if (uploadError.message?.includes('not found') || uploadError.message?.includes('bucket')) {
        return NextResponse.json(
          { 
            error: 'Storage bucket not configured',
            details: 'Please create the "logos" bucket in Supabase Dashboard. See docs/SETUP_LOGOS_BUCKET.md for instructions.',
            supabaseError: uploadError.message
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to upload file',
          details: uploadError.message 
        },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(filename);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: file.name,
    });

  } catch (error) {
    console.error('Logo upload error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

