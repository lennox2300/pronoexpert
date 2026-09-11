-- Allow any visitor to like (update only likes_count) public news entries.
-- Revoke broad UPDATE, grant only on likes_count column.
REVOKE UPDATE ON news FROM anon, authenticated;
GRANT UPDATE (likes_count) ON news TO anon, authenticated;

-- Policy: anon + authenticated may update likes_count only on public news
CREATE POLICY "allow_public_like_news"
  ON news FOR UPDATE
  TO anon, authenticated
  USING (is_public = true)
  WITH CHECK (is_public = true);