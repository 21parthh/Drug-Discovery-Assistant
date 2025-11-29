-- Create user approval and admin system

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create enum for user status
CREATE TYPE public.user_status AS ENUM ('pending', 'approved', 'rejected');

-- Add approval status and role to profiles table
ALTER TABLE public.profiles 
ADD COLUMN status public.user_status DEFAULT 'pending',
ADD COLUMN role public.app_role DEFAULT 'user';

-- Create function to check if user has specific role (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is approved
CREATE OR REPLACE FUNCTION public.is_user_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND status = 'approved'
  )
$$;

-- Update handle_new_user function to set admin role for parth.deore@atomicmail.io
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, status, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
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

-- Create RLS policies for admin access
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user status and roles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create table for user analytics and metrics
CREATE TABLE public.user_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  login_count integer DEFAULT 0,
  last_login_at timestamp with time zone DEFAULT now(),
  reports_generated integer DEFAULT 0,
  compounds_analyzed integer DEFAULT 0,
  targets_discovered integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on analytics table
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics
CREATE POLICY "Users can view their own analytics"
ON public.user_analytics
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all analytics"
ON public.user_analytics
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for analytics table timestamps
CREATE TRIGGER update_user_analytics_updated_at
BEFORE UPDATE ON public.user_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update user analytics
CREATE OR REPLACE FUNCTION public.update_user_analytics(
  _user_id uuid,
  _login_increment integer DEFAULT 0,
  _reports_increment integer DEFAULT 0,
  _compounds_increment integer DEFAULT 0,
  _targets_increment integer DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_analytics (
    user_id, 
    login_count, 
    reports_generated, 
    compounds_analyzed, 
    targets_discovered,
    last_login_at
  ) VALUES (
    _user_id,
    _login_increment,
    _reports_increment,
    _compounds_increment,
    _targets_increment,
    CASE WHEN _login_increment > 0 THEN now() ELSE NULL END
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    login_count = user_analytics.login_count + _login_increment,
    reports_generated = user_analytics.reports_generated + _reports_increment,
    compounds_analyzed = user_analytics.compounds_analyzed + _compounds_increment,
    targets_discovered = user_analytics.targets_discovered + _targets_increment,
    last_login_at = CASE 
      WHEN _login_increment > 0 THEN now() 
      ELSE user_analytics.last_login_at 
    END,
    updated_at = now();
END;
$$;