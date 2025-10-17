-- Update the handle_new_user function to auto-assign admin role for specific mobile number
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_mobile text;
BEGIN
  -- Extract mobile number from metadata
  user_mobile := COALESCE(NEW.raw_user_meta_data->>'mobile_number', '');
  
  -- Insert profile
  INSERT INTO public.profiles (id, name, mobile_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    user_mobile
  );
  
  -- Assign role based on mobile number
  IF user_mobile = '8390952568' THEN
    -- Assign admin role for the default admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- Assign user role for everyone else
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;