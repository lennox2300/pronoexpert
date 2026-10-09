-- Add social_links JSONB column to monetisation_config
ALTER TABLE monetisation_config
  ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;

-- Update get_site_branding to also return social_links
CREATE OR REPLACE FUNCTION get_site_branding()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'site_name', COALESCE(site_name, 'PRONO EXPERT'),
    'site_logo_url', COALESCE(site_logo_url, ''),
    'social_links', COALESCE(social_links, '{}'::jsonb)
  )
  FROM monetisation_config
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_site_branding() TO anon, authenticated;