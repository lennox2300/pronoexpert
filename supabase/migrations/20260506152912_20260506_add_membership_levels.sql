/*
  # Add membership levels system

  1. Changes to users table
    - Add `membership_level` column with values 'simple' or 'vip'
    - Default value is 'simple' for new registrations
  2. Notes
    - Existing users will be set to 'simple' membership
    - Admins remain as they are, but can have membership levels
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'membership_level'
  ) THEN
    ALTER TABLE users ADD COLUMN membership_level text DEFAULT 'simple' CHECK (membership_level IN ('simple', 'vip'));
  END IF;
END $$;