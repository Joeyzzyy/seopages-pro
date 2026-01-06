-- Create the knowledge storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'knowledge',
  'knowledge',
  false,  -- Private bucket (use signed URLs for access)
  10485760,  -- 10MB limit
  ARRAY[
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
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the knowledge bucket

-- Policy: Users can upload to their own folder
CREATE POLICY "Users can upload knowledge files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'knowledge' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own files
CREATE POLICY "Users can view own knowledge files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'knowledge' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update own knowledge files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'knowledge' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own knowledge files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'knowledge' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

