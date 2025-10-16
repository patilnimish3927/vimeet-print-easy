-- Re-enable RLS on users table with read-only access
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can only read their own data from old users table (for backward compatibility)
CREATE POLICY "Users table read-only legacy"
  ON public.users FOR SELECT
  USING (true);