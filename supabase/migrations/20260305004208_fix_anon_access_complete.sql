/*
  # Fix Anonymous Access - Complete Solution

  1. Security Changes
    - Drop all existing restrictive policies
    - Create new permissive policies for anon role
    - Grant explicit SELECT permissions to anon role
    - Ensure public data is accessible without authentication

  2. Tables Affected
    - predictions (public predictions only)
    - matches (all matches)
    - bankroll (read-only)
    - news (published news only)
    - legal_pages (all pages)
*/

-- Drop existing policies that might be restrictive
DROP POLICY IF EXISTS "public_read_predictions" ON predictions;
DROP POLICY IF EXISTS "public_read_matches" ON matches;
DROP POLICY IF EXISTS "public_read_bankroll" ON bankroll;
DROP POLICY IF EXISTS "public_read_news" ON news;
DROP POLICY IF EXISTS "public_read_legal" ON legal_pages;

-- Grant SELECT to anon role explicitly
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON predictions TO anon;
GRANT SELECT ON matches TO anon;
GRANT SELECT ON bankroll TO anon;
GRANT SELECT ON news TO anon;
GRANT SELECT ON legal_pages TO anon;

-- Create new policies with proper anon access
CREATE POLICY "allow_anon_read_public_predictions"
  ON predictions FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

CREATE POLICY "allow_anon_read_all_matches"
  ON matches FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "allow_anon_read_bankroll"
  ON bankroll FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "allow_anon_read_published_news"
  ON news FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "allow_anon_read_legal_pages"
  ON legal_pages FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin policies for authenticated users
CREATE POLICY "allow_admin_all_predictions"
  ON predictions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "allow_admin_all_matches"
  ON matches FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "allow_admin_all_bankroll"
  ON bankroll FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "allow_admin_all_news"
  ON news FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "allow_admin_all_legal_pages"
  ON legal_pages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );