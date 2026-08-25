/*
# Security fixes: RLS policies, column-level access, SECURITY DEFINER functions

## Problems fixed
1. monetisation_config SELECT policies exposed secret keys to ALL authenticated and anon users
2. users UPDATE policy allowed self-granting is_vip / vip_expires_at / membership_level
3. Admins can update any profile had no WITH CHECK
4. vip_requests had no unique constraint on pending requests (spam)
5. handle_new_user had mutable search_path (advisor warning)

## Changes
1. monetisation_config: column-restricted public view + admin-only SECURITY DEFINER function
2. users: self-update freezes is_admin, is_vip, vip_expires_at, membership_level; admin-update gets WITH CHECK
3. vip_requests: unique index on (user_id) WHERE status='pending'
4. handle_new_user: fixed search_path
*/

-- ─── 1. monetisation_config: replace broad SELECT with column-restricted view + admin function ───

DROP POLICY IF EXISTS "admin_select_monetisation" ON monetisation_config;
DROP POLICY IF EXISTS "anon_select_monetisation" ON monetisation_config;

CREATE OR REPLACE VIEW public.monetisation_config_public AS
SELECT
  id,
  payment_mode_enabled,
  plans,
  stripe_public_key,
  stripe_test_mode,
  paypal_client_id,
  paypal_sandbox_mode
FROM monetisation_config;

GRANT SELECT ON public.monetisation_config_public TO anon, authenticated;
REVOKE SELECT ON monetisation_config FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_monetisation_config_admin()
RETURNS monetisation_config
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row monetisation_config%ROWTYPE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Accès refusé - admin uniquement';
  END IF;
  SELECT * INTO row FROM public.monetisation_config WHERE id = '00000000-0000-0000-0000-000000000001';
  RETURN row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_monetisation_config_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_monetisation_config_admin() TO authenticated;

-- ─── 2. users: fix UPDATE policies to prevent self-granting VIP/admin ───

DROP POLICY IF EXISTS "Users can update own non-admin fields" ON users;
DROP POLICY IF EXISTS "Admins can update any profile" ON users;

CREATE POLICY "Users can update own non-sensitive fields"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND is_admin = (SELECT is_admin FROM users WHERE id = auth.uid())
    AND is_vip = (SELECT is_vip FROM users WHERE id = auth.uid())
    AND vip_expires_at = (SELECT vip_expires_at FROM users WHERE id = auth.uid())
    AND membership_level = (SELECT membership_level FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update any profile"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- ─── 3. vip_requests: unique constraint to prevent spam ───

DELETE FROM vip_requests
WHERE id NOT IN (
  SELECT (array_agg(id ORDER BY created_at))[1] FROM vip_requests WHERE status = 'pending' GROUP BY user_id
)
AND status = 'pending';

CREATE UNIQUE INDEX IF NOT EXISTS idx_vip_requests_one_pending_per_user
  ON vip_requests (user_id)
  WHERE status = 'pending';

-- ─── 4. handle_new_user: fix mutable search_path ───

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, is_admin, is_vip)
  VALUES (NEW.id, NEW.email, false, false)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
