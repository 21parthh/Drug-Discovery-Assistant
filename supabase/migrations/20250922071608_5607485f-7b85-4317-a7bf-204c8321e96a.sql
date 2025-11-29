-- Update handle_new_user function to include research_focus
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, research_focus, status, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'research_focus',
    CASE 
      WHEN NEW.email = 'parth.deore@atomicmail.io' THEN 'approved'::user_status
      ELSE 'pending'::user_status
    END,
    CASE 
      WHEN NEW.email = 'parth.deore@atomicmail.io' THEN 'admin'::app_role
      ELSE 'user'::app_role
    END
  );
  RETURN NEW;
END;
$$;