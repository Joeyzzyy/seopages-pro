import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Allowed file types
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'text/markdown',
  'application/json',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
];

// Helper to get authenticated user
async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: authHeader } }
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Helper to get service role client
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false }
    }
  );
}

// GET - List knowledge files for a project
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from('project_knowledge')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching knowledge:', error);
      return NextResponse.json({ error: 'Failed to fetch knowledge files' }, { status: 500 });
    }

    // Generate signed URLs for each file
    const filesWithUrls = await Promise.all(
      (data || []).map(async (file) => {
        const { data: signedUrlData } = await supabase.storage
          .from('knowledge')
          .createSignedUrl(file.storage_path, 3600); // 1 hour expiry

        return {
          ...file,
          url: signedUrlData?.signedUrl || null,
        };
      })
    );

    return NextResponse.json({ files: filesWithUrls });
  } catch (error) {
    console.error('Knowledge GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Upload a new knowledge file
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const description = formData.get('description') as string | null;
    const tagsRaw = formData.get('tags') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed. Supported: PDF, DOC, DOCX, XLS, XLSX, TXT, CSV, MD, JSON, PNG, JPG, GIF, WebP' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('seo_projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    // Generate unique storage path
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split('.').pop() || 'bin';
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${user.id}/${projectId}/${timestamp}-${randomString}-${sanitizedName}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('knowledge')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);

      if (uploadError.message?.includes('not found') || uploadError.message?.includes('bucket')) {
        return NextResponse.json(
          {
            error: 'Storage bucket not configured',
            details: 'Please create the "knowledge" bucket in Supabase Dashboard.',
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to upload file', details: uploadError.message },
        { status: 500 }
      );
    }

    // Parse tags
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

    // Save metadata to database
    const { data: knowledge, error: dbError } = await supabase
      .from('project_knowledge')
      .insert({
        project_id: projectId,
        user_id: user.id,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
        description: description || null,
        tags: tags.length > 0 ? tags : null,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Try to clean up uploaded file
      await supabase.storage.from('knowledge').remove([storagePath]);
      return NextResponse.json(
        { error: 'Failed to save file metadata', details: dbError.message },
        { status: 500 }
      );
    }

    // Get signed URL
    const { data: signedUrlData } = await supabase.storage
      .from('knowledge')
      .createSignedUrl(storagePath, 3600);

    return NextResponse.json({
      success: true,
      file: {
        ...knowledge,
        url: signedUrlData?.signedUrl || null,
      },
    });
  } catch (error) {
    console.error('Knowledge POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a knowledge file
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Get file metadata and verify ownership
    const { data: file, error: fetchError } = await supabase
      .from('project_knowledge')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !file) {
      return NextResponse.json({ error: 'File not found or access denied' }, { status: 404 });
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('knowledge')
      .remove([file.storage_path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
      // Continue to delete metadata even if storage delete fails
    }

    // Delete metadata
    const { error: dbError } = await supabase
      .from('project_knowledge')
      .delete()
      .eq('id', fileId)
      .eq('user_id', user.id);

    if (dbError) {
      console.error('Database delete error:', dbError);
      return NextResponse.json(
        { error: 'Failed to delete file metadata' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, deletedId: fileId });
  } catch (error) {
    console.error('Knowledge DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

