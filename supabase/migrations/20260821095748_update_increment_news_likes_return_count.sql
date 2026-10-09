-- Updated function: returns the new likes_count so the client can use it
DROP FUNCTION IF EXISTS increment_news_likes(uuid);
CREATE OR REPLACE FUNCTION increment_news_likes(p_news_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE news
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = p_news_id AND is_public = true
  RETURNING likes_count INTO new_count;
  
  RETURN COALESCE(new_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION increment_news_likes(uuid) TO anon, authenticated;