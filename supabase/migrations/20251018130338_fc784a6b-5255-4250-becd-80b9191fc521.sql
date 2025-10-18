-- Drop the old foreign key constraint that points to the wrong users table
ALTER TABLE print_jobs DROP CONSTRAINT IF EXISTS print_jobs_user_id_fkey;

-- Add the correct foreign key constraint pointing to profiles
ALTER TABLE print_jobs 
ADD CONSTRAINT print_jobs_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Drop the incorrect storage policy that references the old users table
DROP POLICY IF EXISTS "Admins can read all files" ON storage.objects;

-- Create the correct storage policy using the role check function
CREATE POLICY "Admins can read all files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'print-files' AND has_role(auth.uid(), 'admin'::app_role));