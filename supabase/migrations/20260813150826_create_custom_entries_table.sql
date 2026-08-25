/*
# Create custom_entries table for admin autocomplete

1. Purpose
   Stores custom leagues, teams, and bet types that the admin enters manually
   when creating predictions (via the "Autre" league option). This allows
   autocomplete suggestions on future entries and auto-fills logo URLs.

2. New Table: custom_entries
   - id (uuid, primary key)
   - entry_type (text): 'league' | 'team' | 'bet_type'
   - name (text): the name of the league, team, or bet type
   - logo_url (text, nullable): URL of the logo (for leagues and teams)
   - competition (text, nullable): for teams, the competition they belong to
   - created_at (timestamptz)

3. Security
   - RLS enabled
   - Any authenticated user can read (autocomplete needs to work for all admins)
   - Any authenticated user can insert/update/delete (admin-only in practice,
     enforced by the frontend admin check)

4. Indexes
   - Index on entry_type for fast filtering
   - Index on name for fast autocomplete lookups
*/

CREATE TABLE IF NOT EXISTS custom_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_type text NOT NULL CHECK (entry_type IN ('league', 'team', 'bet_type')),
  name text NOT NULL,
  logo_url text,
  competition text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE custom_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_custom_entries" ON custom_entries;
CREATE POLICY "read_custom_entries" ON custom_entries FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_custom_entries" ON custom_entries;
CREATE POLICY "insert_custom_entries" ON custom_entries FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_custom_entries" ON custom_entries;
CREATE POLICY "update_custom_entries" ON custom_entries FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_custom_entries" ON custom_entries;
CREATE POLICY "delete_custom_entries" ON custom_entries FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_custom_entries_type ON custom_entries (entry_type);
CREATE INDEX IF NOT EXISTS idx_custom_entries_name ON custom_entries (name);
