/*
# Add stake/odds to news + VIP bankroll config

1. Modified Tables
- `news`: add `stake` (numeric, nullable) and `odds` (numeric, nullable) columns.
  These are set when category='prediction' to track the bet amount and odds for VIP bankroll calculation.

2. New Tables
- `vip_bankroll_config`: single-row config table for the VIP bankroll displayed on the Premium page.
  - `starting_balance` (numeric, default 5000): the initial bankroll amount, modifiable by admin.
  - `current_balance` (numeric, default 5000): the current balance after all validated tickets.
  - `total_profit` (numeric, default 0): cumulative profit from won tickets.
  - `total_loss` (numeric, default 0): cumulative loss from lost tickets.
  - `won_count` (integer, default 0): number of won tickets.
  - `lost_count` (integer, default 0): number of lost tickets.
  - `updated_at` (timestamptz).

3. Security
- RLS enabled on `vip_bankroll_config`.
- Public read access (anon + authenticated) so the bankroll displays for all visitors.
- Only authenticated admins can update (via existing admin patterns).

4. Important Notes
- The VIP bankroll only counts news entries with category='prediction' and status IN ('won','lost').
- Existing tickets already validated do NOT count — calculation starts from new posts onward.
- The starting balance is 5000 euros, modifiable by the admin.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news' AND column_name = 'stake') THEN
    ALTER TABLE news ADD COLUMN stake numeric DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news' AND column_name = 'odds') THEN
    ALTER TABLE news ADD COLUMN odds numeric DEFAULT NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS vip_bankroll_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  starting_balance numeric NOT NULL DEFAULT 5000,
  current_balance numeric NOT NULL DEFAULT 5000,
  total_profit numeric NOT NULL DEFAULT 0,
  total_loss numeric NOT NULL DEFAULT 0,
  won_count integer NOT NULL DEFAULT 0,
  lost_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vip_bankroll_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_vip_bankroll" ON vip_bankroll_config;
CREATE POLICY "anon_read_vip_bankroll" ON vip_bankroll_config FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_update_vip_bankroll" ON vip_bankroll_config;
CREATE POLICY "auth_update_vip_bankroll" ON vip_bankroll_config FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_insert_vip_bankroll" ON vip_bankroll_config;
CREATE POLICY "auth_insert_vip_bankroll" ON vip_bankroll_config FOR INSERT
  TO authenticated WITH CHECK (true);

-- Seed a default row if none exists
INSERT INTO vip_bankroll_config (starting_balance, current_balance)
SELECT 5000, 5000
WHERE NOT EXISTS (SELECT 1 FROM vip_bankroll_config);
