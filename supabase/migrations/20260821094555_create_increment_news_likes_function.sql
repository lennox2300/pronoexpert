-- SECURITY DEFINER function to increment likes_count on public news.
-- Bypasses RLS so anon visitors can like without permission issues.
CREATE OR REPLACE FUNCTION increment_news_likes(p_news_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE news
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = p_news_id AND is_public = true;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_news_likes(uuid) TO anon, authenticated;