-- Clean up any existing data for mobile number 8390952568
DO $$
DECLARE
  user_uuid uuid;
BEGIN
  -- Find user ID from profiles table
  SELECT id INTO user_uuid FROM public.profiles WHERE mobile_number = '8390952568';
  
  -- Delete from user_roles if exists
  IF user_uuid IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = user_uuid;
    DELETE FROM public.profiles WHERE id = user_uuid;
  END IF;
  
  -- Delete from auth.users (this will cascade)
  DELETE FROM auth.users WHERE email = '8390952568@printapp.local';
END $$;

-- Recreate the trigger to ensure it's working correctly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();