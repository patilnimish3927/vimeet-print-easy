-- Add SELECT policies for storage bucket to allow file downloads

-- Allow admins to download all files from print-files bucket
CREATE POLICY "Admins can download all files"
  ON storage.objects 
  FOR SELECT
  USING (
    bucket_id = 'print-files' AND 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Allow users to download their own uploaded files
CREATE POLICY "Users can download own files"
  ON storage.objects 
  FOR SELECT
  USING (
    bucket_id = 'print-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );