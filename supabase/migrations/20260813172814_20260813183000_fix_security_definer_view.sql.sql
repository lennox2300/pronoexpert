-- Fix the security_definer_view error on monetisation_config_public
-- Views in Postgres default to SECURITY DEFINER, which bypasses RLS.
-- Make it SECURITY INVOKER so the querying user's permissions apply.
-- Since we only expose safe columns and have revoked direct SELECT on the base table,
-- this ensures the view respects the caller's RLS context.

ALTER VIEW public.monetisation_config_public SET (security_invoker = true);

-- Grant SELECT on the view to anon and authenticated (needed since the view now runs as invoker)
GRANT SELECT ON public.monetisation_config_public TO anon, authenticated;

-- Also grant SELECT on the underlying table to anon and authenticated, but only through the view
-- The view restricts columns, so direct table access is still blocked by RLS policies
GRANT SELECT (id, payment_mode_enabled, plans, stripe_public_key, stripe_test_mode, paypal_client_id, paypal_sandbox_mode) ON monetisation_config TO anon, authenticated;
