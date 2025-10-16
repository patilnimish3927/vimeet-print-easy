-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table linked to auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mobile_number TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS on new tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Update print_jobs RLS policies
DROP POLICY IF EXISTS "Users can create print jobs" ON public.print_jobs;
DROP POLICY IF EXISTS "Users can read own print jobs" ON public.print_jobs;
DROP POLICY IF EXISTS "Admins can read all print jobs" ON public.print_jobs;
DROP POLICY IF EXISTS "Admins can update print jobs" ON public.print_jobs;

CREATE POLICY "Users can create print jobs"
  ON public.print_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own print jobs"
  ON public.print_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all print jobs"
  ON public.print_jobs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update print jobs"
  ON public.print_jobs FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Update job_files RLS policies
DROP POLICY IF EXISTS "Users can create job files" ON public.job_files;
DROP POLICY IF EXISTS "Users can read own job files" ON public.job_files;
DROP POLICY IF EXISTS "Admins can read all job files" ON public.job_files;

CREATE POLICY "Users can create job files"
  ON public.job_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM print_jobs
      WHERE print_jobs.id = job_files.job_id
      AND print_jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read own job files"
  ON public.job_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM print_jobs
      WHERE print_jobs.id = job_files.job_id
      AND print_jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all job files"
  ON public.job_files FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Update app_settings RLS policies
DROP POLICY IF EXISTS "Admins can update app settings" ON public.app_settings;

CREATE POLICY "Admins can update app settings"
  ON public.app_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Update storage policies
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own folder" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read all folders" ON storage.objects;

CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'print-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read own folder"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'print-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can read all folders"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'print-files' AND
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'print-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can delete all files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'print-files' AND
    public.has_role(auth.uid(), 'admin')
  );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, mobile_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'mobile_number', '')
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Disable the old users table RLS (we'll keep it for reference but not use it)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;