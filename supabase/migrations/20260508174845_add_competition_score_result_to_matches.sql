/*
  # Ajout competition, score et resultat individuel aux matchs

  1. Colonnes ajoutees a `matches`
    - `competition` (text) - Nom de la competition (Liga, Serie A, Ligue 1, etc.)
    - `score` (text) - Score final du match (ex: 2-1)
    - `result` mis a jour pour accepter 'won', 'lost', 'pending'

  2. Notes
    - Le champ `result` existait deja mais etait rarement utilise
    - On ajoute une valeur par defaut 'pending'
    - `competition` et `score` sont optionnels (nullable)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'competition'
  ) THEN
    ALTER TABLE matches ADD COLUMN competition text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'score'
  ) THEN
    ALTER TABLE matches ADD COLUMN score text DEFAULT '';
  END IF;
END $$;

UPDATE matches SET result = 'pending' WHERE result IS NULL;
