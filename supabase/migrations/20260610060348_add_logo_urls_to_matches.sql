ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS team1_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS team2_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS competition_logo_url TEXT;
