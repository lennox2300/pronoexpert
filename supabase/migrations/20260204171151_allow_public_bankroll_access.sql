/*
  # Autoriser l'accès public à la bankroll
  
  ## Description
  Cette migration permet aux utilisateurs non authentifiés de voir les statistiques
  de la bankroll (balance, profits, pertes, etc.).
  
  ## Modifications
  - Ajout policy pour permettre à tous (anon) de voir la bankroll
  
  ## Sécurité
  - Les utilisateurs non authentifiés ne peuvent que LIRE, pas modifier
  - Seuls les admins peuvent modifier la bankroll (policy existante)
*/

-- Permettre aux utilisateurs non authentifiés de voir la bankroll
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'bankroll' 
    AND policyname = 'Tous peuvent voir la bankroll publiquement'
  ) THEN
    CREATE POLICY "Tous peuvent voir la bankroll publiquement"
      ON bankroll FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;
