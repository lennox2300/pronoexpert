/*
  # Fix News RLS Policy

  1. Changes
    - Drop incorrect news policy checking for 'published' status
    - Add correct policy checking for is_public field
    
  2. Security
    - Anonymous and authenticated users can read public news (is_public = true)
    - Admins can do everything
*/

DROP POLICY IF EXISTS "allow_anon_read_published_news" ON news;

CREATE POLICY "allow_anon_read_public_news"
  ON news
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true);
