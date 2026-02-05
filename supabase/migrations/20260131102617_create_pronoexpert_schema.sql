/*
  # PronoExpert Database Schema

  ## Overview
  Complete schema for PronoExpert prediction management system with VIP access control.

  ## New Tables
  
  ### `users`
  Extended user profiles for prediction system
  - `id` (uuid, pk) - References auth.users
  - `email` (text, unique) - User email
  - `is_admin` (boolean) - Admin privileges
  - `is_vip` (boolean) - VIP member access
  - `created_at` (timestamptz) - Account creation timestamp
  
  ### `predictions`
  Main predictions table with betting information
  - `id` (uuid, pk) - Unique prediction identifier
  - `user_id` (uuid, fk) - References users table
  - `type` (text) - 'simple' or 'combined'
  - `stake` (decimal) - Amount wagered
  - `total_odds` (decimal) - Combined odds for prediction
  - `status` (text) - 'pending', 'won', or 'lost'
  - `is_public` (boolean) - Visibility for non-VIP users
  - `profit` (decimal) - Calculated profit/loss, nullable
  - `validated_at` (timestamptz) - When result was validated, nullable
  - `created_at` (timestamptz) - Prediction creation timestamp
  
  ### `matches`
  Individual matches within predictions
  - `id` (uuid, pk) - Unique match identifier
  - `prediction_id` (uuid, fk) - References predictions table
  - `sport` (text) - 'football', 'tennis', or 'basketball'
  - `team1` (text) - First team/player name
  - `team2` (text) - Second team/player name
  - `bet_type` (text) - Type of bet placed
  - `odds` (decimal) - Match odds
  - `result` (text) - Match outcome, nullable
  - `match_date` (timestamptz) - Scheduled match date
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  
  ### Row Level Security (RLS)
  All tables have RLS enabled with the following policies:
  
  #### users table
  - Authenticated users can view all user profiles
  - Users can only update their own profile (non-admin fields)
  - Admins can update any profile
  
  #### predictions table
  - Public predictions visible to all authenticated users
  - VIP predictions only visible to VIP members and admins
  - Only admins can create, update, or delete predictions
  
  #### matches table
  - Matches inherit visibility from their parent prediction
  - Only admins can create, update, or delete matches

  ## Important Notes
  - Default admin account should be created separately with email: admin@prono.com
  - VIP status is manually managed by admins
  - Profit calculations are handled in application logic
  - All timestamps use timezone-aware format
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  is_admin boolean DEFAULT false,
  is_vip boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('simple', 'combined')),
  stake decimal(10, 2) NOT NULL CHECK (stake > 0),
  total_odds decimal(10, 2) NOT NULL CHECK (total_odds > 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost')),
  is_public boolean DEFAULT false,
  profit decimal(10, 2),
  validated_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id uuid REFERENCES predictions(id) ON DELETE CASCADE NOT NULL,
  sport text NOT NULL CHECK (sport IN ('football', 'tennis', 'basketball')),
  team1 text NOT NULL,
  team2 text NOT NULL,
  bet_type text NOT NULL,
  odds decimal(10, 2) NOT NULL CHECK (odds > 0),
  result text,
  match_date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Authenticated users can view all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own non-admin fields"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    is_admin = (SELECT is_admin FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update any profile"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Predictions table policies
CREATE POLICY "Anyone can view public predictions"
  ON predictions FOR SELECT
  TO authenticated
  USING (
    is_public = true OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND (is_vip = true OR is_admin = true)
    )
  );

CREATE POLICY "Admins can insert predictions"
  ON predictions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update predictions"
  ON predictions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete predictions"
  ON predictions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Matches table policies
CREATE POLICY "View matches of accessible predictions"
  ON matches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM predictions p
      WHERE p.id = matches.prediction_id
      AND (
        p.is_public = true OR
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() AND (is_vip = true OR is_admin = true)
        )
      )
    )
  );

CREATE POLICY "Admins can insert matches"
  ON matches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update matches"
  ON matches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete matches"
  ON matches FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_status ON predictions(status);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_prediction_id ON matches(prediction_id);
CREATE INDEX IF NOT EXISTS idx_matches_match_date ON matches(match_date);
