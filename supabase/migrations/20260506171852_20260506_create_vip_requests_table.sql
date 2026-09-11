/*
  # Create VIP requests table

  1. New Tables
    - `vip_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `status` (text: pending, approved, rejected)
      - `created_at` (timestamptz)
      - `processed_at` (timestamptz, nullable)
  
  2. Security
    - Enable RLS on `vip_requests` table
    - Authenticated users can insert their own requests
    - Authenticated users can view their own requests
    - Admins can view and update all requests
*/

CREATE TABLE IF NOT EXISTS vip_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE vip_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own VIP requests"
  ON vip_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own VIP requests"
  ON vip_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all VIP requests"
  ON vip_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can update VIP requests"
  ON vip_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );