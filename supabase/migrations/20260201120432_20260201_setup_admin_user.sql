/*
  # Setup Admin User

  This migration creates the admin user profile for the existing auth user admin@prono.com.
  The auth user must already exist in auth.users before this migration runs.
*/

-- Insert admin user profile if it doesn't exist
INSERT INTO users (id, email, is_admin, is_vip)
SELECT id, email, true, false
FROM auth.users
WHERE email = 'admin@prono.com'
ON CONFLICT (email) DO UPDATE SET is_admin = true;
