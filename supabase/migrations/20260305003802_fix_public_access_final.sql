/*
  # Accès public complet
*/

DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename
              FROM pg_policies 
              WHERE schemaname = 'public' 
              AND tablename IN ('predictions', 'matches', 'bankroll', 'news', 'legal_pages'))
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

CREATE POLICY "public_read_predictions" ON predictions FOR SELECT TO anon, authenticated USING (is_public = true);
CREATE POLICY "public_read_matches" ON matches FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_bankroll" ON bankroll FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_news" ON news FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_legal" ON legal_pages FOR SELECT TO anon, authenticated USING (true);
