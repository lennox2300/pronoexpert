/*
  # Ajout des tables Bankroll et Actualités
  
  ## Description
  Cette migration ajoute les tables nécessaires pour gérer la bankroll du système
  et la section actualités/analyses.
  
  ## Nouvelles Tables
  
  ### `bankroll`
  Table pour gérer le solde et les statistiques globales
  - `id` (uuid, pk) - Identifiant unique
  - `balance` (decimal) - Solde actuel (DEFAULT 5000.00)
  - `total_profit` (decimal) - Profits totaux cumulés
  - `total_loss` (decimal) - Pertes totales cumulées
  - `won_count` (integer) - Nombre de paris gagnés
  - `lost_count` (integer) - Nombre de paris perdus
  - `updated_at` (timestamptz) - Dernière mise à jour
  
  ### `news`
  Table pour les actualités et analyses
  - `id` (uuid, pk) - Identifiant unique
  - `title` (text) - Titre de l'article/analyse
  - `content` (text) - Contenu de l'article
  - `image_url` (text) - URL de l'image (nullable)
  - `is_public` (boolean) - Visible par tous ou VIP uniquement
  - `created_at` (timestamptz) - Date de création
  - `updated_at` (timestamptz) - Date de mise à jour
  
  ## Modifications
  
  ### Table `matches`
  Ajout des nouveaux sports: hockey, rugby, sports_us
  
  ## Sécurité
  
  ### RLS Policies
  - bankroll: Lecture pour tous authentifiés, modification admin uniquement
  - news: Lecture selon is_public et statut VIP, modification admin uniquement
*/

-- Modifier la table matches pour ajouter les nouveaux sports
DO $$
BEGIN
  ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_sport_check;
  ALTER TABLE matches ADD CONSTRAINT matches_sport_check 
    CHECK (sport IN ('football', 'tennis', 'basketball', 'hockey', 'rugby', 'sports_us'));
END $$;

-- Créer la table bankroll
CREATE TABLE IF NOT EXISTS bankroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  balance decimal(10, 2) DEFAULT 5000.00 NOT NULL,
  total_profit decimal(10, 2) DEFAULT 0.00 NOT NULL,
  total_loss decimal(10, 2) DEFAULT 0.00 NOT NULL,
  won_count integer DEFAULT 0 NOT NULL,
  lost_count integer DEFAULT 0 NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bankroll ENABLE ROW LEVEL SECURITY;

-- Créer la table news
CREATE TABLE IF NOT EXISTS news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  image_url text,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Policies pour bankroll
CREATE POLICY "Tous peuvent voir la bankroll"
  ON bankroll FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Seuls les admins peuvent modifier la bankroll"
  ON bankroll FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Policies pour news
CREATE POLICY "Voir actualités publiques"
  ON news FOR SELECT
  TO authenticated
  USING (
    is_public = true OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND (is_vip = true OR is_admin = true)
    )
  );

CREATE POLICY "Admins peuvent créer des actualités"
  ON news FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins peuvent modifier des actualités"
  ON news FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins peuvent supprimer des actualités"
  ON news FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_is_public ON news(is_public);

-- Initialiser la bankroll avec une seule ligne (si elle n'existe pas)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM bankroll LIMIT 1) THEN
    INSERT INTO bankroll (balance, total_profit, total_loss, won_count, lost_count)
    VALUES (5000.00, 0.00, 0.00, 0, 0);
  END IF;
END $$;
