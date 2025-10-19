-- Add storage policy for admin uploads
CREATE POLICY "Admins can upload files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'print-files' AND has_role(auth.uid(), 'admin'::app_role));

-- Add storage policy for admin updates
CREATE POLICY "Admins can update files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'print-files' AND has_role(auth.uid(), 'admin'::app_role));