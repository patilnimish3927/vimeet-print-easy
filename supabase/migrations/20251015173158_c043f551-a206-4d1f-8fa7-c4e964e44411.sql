-- Create Users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  mobile_number TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  USING (auth.uid()::text = id::text);

-- Create PrintJobs table
CREATE TABLE public.print_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  submission_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  total_pages INTEGER NOT NULL CHECK (total_pages >= 4),
  print_instructions TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on print_jobs table
ALTER TABLE public.print_jobs ENABLE ROW LEVEL SECURITY;

-- Users can read their own print jobs
CREATE POLICY "Users can read own print jobs"
  ON public.print_jobs
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Users can insert their own print jobs
CREATE POLICY "Users can create print jobs"
  ON public.print_jobs
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Admins can read all print jobs
CREATE POLICY "Admins can read all print jobs"
  ON public.print_jobs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id::text = auth.uid()::text AND is_admin = true
    )
  );

-- Admins can update print jobs
CREATE POLICY "Admins can update print jobs"
  ON public.print_jobs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id::text = auth.uid()::text AND is_admin = true
    )
  );

-- Create JobFiles table
CREATE TABLE public.job_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.print_jobs(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on job_files table
ALTER TABLE public.job_files ENABLE ROW LEVEL SECURITY;

-- Users can read files for their own jobs
CREATE POLICY "Users can read own job files"
  ON public.job_files
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.print_jobs
      WHERE print_jobs.id = job_files.job_id
      AND print_jobs.user_id::text = auth.uid()::text
    )
  );

-- Users can insert files for their own jobs
CREATE POLICY "Users can create job files"
  ON public.job_files
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.print_jobs
      WHERE print_jobs.id = job_files.job_id
      AND print_jobs.user_id::text = auth.uid()::text
    )
  );

-- Admins can read all job files
CREATE POLICY "Admins can read all job files"
  ON public.job_files
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id::text = auth.uid()::text AND is_admin = true
    )
  );

-- Create AppSettings table
CREATE TABLE public.app_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on app_settings table
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read app settings
CREATE POLICY "Anyone can read app settings"
  ON public.app_settings
  FOR SELECT
  USING (true);

-- Only admins can update app settings
CREATE POLICY "Admins can update app settings"
  ON public.app_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id::text = auth.uid()::text AND is_admin = true
    )
  );

-- Insert default app settings
INSERT INTO public.app_settings (setting_key, setting_value) VALUES
  ('qr_code_url', ''),
  ('upi_id', ''),
  ('contact_number', '8390952568');

-- Create storage bucket for print files
INSERT INTO storage.buckets (id, name, public) VALUES ('print-files', 'print-files', false);

-- Storage policies for print files
CREATE POLICY "Users can upload their own files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'print-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read their own files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'print-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can read all files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'print-files' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id::text = auth.uid()::text AND is_admin = true
    )
  );