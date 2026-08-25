-- Add branding columns to monetisation_config
ALTER TABLE monetisation_config
  ADD COLUMN IF NOT EXISTS site_name text DEFAULT 'PRONO EXPERT',
  ADD COLUMN IF NOT EXISTS site_logo_url text DEFAULT '';

-- Public function to fetch branding (site name + logo)
-- SECURITY DEFINER so anon visitors can read it without RLS issues
CREATE OR REPLACE FUNCTION get_site_branding()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'site_name', COALESCE(site_name, 'PRONO EXPERT'),
    'site_logo_url', COALESCE(site_logo_url, '')
  )
  FROM monetisation_config
  WHERE id = '00000000-0000-0000-0000-000000000001'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_site_branding() TO anon, authenticated;