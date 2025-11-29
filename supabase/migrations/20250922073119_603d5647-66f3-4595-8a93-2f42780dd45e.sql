-- First, create user analytics records for any existing users that don't have them
INSERT INTO public.user_analytics (user_id, login_count, reports_generated, compounds_analyzed, targets_discovered)
SELECT 
  p.user_id,
  0 as login_count,
  0 as reports_generated,
  0 as compounds_analyzed,
  0 as targets_discovered
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_analytics ua WHERE ua.user_id = p.user_id
);

-- Update the handle_new_user function to also create user analytics
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert profile
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

  -- Initialize user analytics
  INSERT INTO public.user_analytics (user_id, login_count, reports_generated, compounds_analyzed, targets_discovered)
  VALUES (NEW.id, 0, 0, 0, 0);

  RETURN NEW;
END;
$$;

-- Add trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Allow users to update their own analytics (for the update_user_analytics function)
CREATE POLICY "Users can update their own analytics" 
ON public.user_analytics 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow service role to insert analytics
CREATE POLICY "Service role can insert analytics" 
ON public.user_analytics 
FOR INSERT 
WITH CHECK (true);