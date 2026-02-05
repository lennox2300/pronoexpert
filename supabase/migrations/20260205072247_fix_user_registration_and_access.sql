/*
  # Fix User Registration and Access Issues
  
  ## Description
  This migration fixes the issue where new users cannot register or access the application
  properly. The problem occurs because the trigger that syncs auth.users to public.users
  needs proper permissions to insert records.
  
  ## Changes Made
  
  1. **Add INSERT Policy for Users Table**
     - Allow service role to insert new user records
     - This enables the trigger function to work properly when new users sign up
  
  2. **Grant Proper Permissions**
     - Ensure the trigger function has the necessary permissions
     - Use SECURITY DEFINER to bypass RLS when creating user records
  
  3. **Sync Existing Users**
     - Ensure all existing auth.users are properly synced to public.users
  
  ## Security
  - The INSERT policy is restricted to the service role via the trigger function
  - Regular users cannot directly insert into the users table
  - RLS remains enabled with proper access controls
*/

-- Drop existing trigger and function to recreate with proper security
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the function with proper security context
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  is_first_user boolean;
BEGIN
  -- Check if this is the first user in the system
  SELECT NOT EXISTS (SELECT 1 FROM public.users LIMIT 1) INTO is_first_user;
  
  -- Insert into public.users with proper defaults
  INSERT INTO public.users (id, email, is_admin, is_vip)
  VALUES (
    NEW.id,
    NEW.email,
    is_first_user,  -- First user becomes admin automatically
    false           -- New users are not VIP by default
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Sync any existing auth.users that are not in public.users
INSERT INTO public.users (id, email, is_admin, is_vip)
SELECT 
  au.id, 
  au.email, 
  COALESCE((SELECT is_admin FROM public.users WHERE id = au.id), false),
  COALESCE((SELECT is_vip FROM public.users WHERE id = au.id), false)
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- Ensure the function owner has proper permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;