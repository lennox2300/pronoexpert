
CREATE TABLE IF NOT EXISTS monetisation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_mode_enabled BOOLEAN NOT NULL DEFAULT false,
  plans JSONB NOT NULL DEFAULT '[
    {"id":"1month","label":"1 mois","days":30,"price":29.90,"savings":"","popular":false,"active":true},
    {"id":"3months","label":"3 mois","days":90,"price":69.90,"savings":"Economisez 22%","popular":false,"active":true},
    {"id":"6months","label":"6 mois","days":180,"price":119.90,"savings":"Economisez 33%","popular":true,"active":true},
    {"id":"12months","label":"1 an","days":365,"price":199.90,"savings":"Economisez 44%","popular":false,"active":true}
  ]'::jsonb,
  stripe_public_key TEXT DEFAULT '',
  stripe_secret_key TEXT DEFAULT '',
  stripe_webhook_secret TEXT DEFAULT '',
  stripe_test_mode BOOLEAN NOT NULL DEFAULT true,
  paypal_client_id TEXT DEFAULT '',
  paypal_client_secret TEXT DEFAULT '',
  paypal_sandbox_mode BOOLEAN NOT NULL DEFAULT true,
  ads_config JSONB NOT NULL DEFAULT '{
    "banners":{"enabled":false,"position":"both","size":"adaptive","admob":"","appnext":"","startio":"","unity_game":"","unity_placement":"","ironsource":"","wortise_app":"","wortise_unit":"","monetag":""},
    "native_profile":{"enabled":false,"admob":"","appnext":"","startio":"","unity_game":"","unity_placement":"","ironsource":"","wortise_app":"","wortise_unit":"","monetag":""},
    "native_menus":{"enabled":false,"admob":"","appnext":"","startio":"","unity_game":"","unity_placement":"","ironsource":"","wortise_app":"","wortise_unit":"","monetag":""},
    "instream":{"enabled":false,"appnext":"","startio":"","first_after":4,"then_every":10},
    "rewarded":{"enabled":false,"admob":"","appnext":"","startio":"","unity_game":"","unity_placement":"","ironsource":"","wortise_app":"","wortise_unit":"","monetag":"","interval":"always","message":""},
    "interstitial":{"enabled":false,"admob":"","appnext":"","startio":"","unity_game":"","unity_placement":"","ironsource":"","wortise_app":"","wortise_unit":"","monetag":"","freq_pages":3,"freq_messages":10,"show_on_launch":false,"launch_type":"interstitial","launch_admob":""}
  }'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE monetisation_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_monetisation" ON monetisation_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_insert_monetisation" ON monetisation_config FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "admin_update_monetisation" ON monetisation_config FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
) WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);

-- Allow anon to read public config (payment_mode_enabled + plans for the subscription page)
CREATE POLICY "anon_select_monetisation" ON monetisation_config FOR SELECT TO anon USING (true);

-- Seed one row
INSERT INTO monetisation_config (id) VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;
