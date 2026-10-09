/*
  # Autoriser l'accès public aux prédictions publiques
  
  ## Description
  Cette migration permet aux utilisateurs non authentifiés de voir les prédictions
  et matchs marqués comme publics.
  
  ## Modifications
  - Ajout policy pour permettre à tous (anon) de voir les prédictions publiques
  - Ajout policy pour permettre à tous (anon) de voir les matchs des prédictions publiques
  
  ## Sécurité
  - Seules les prédictions avec is_public = true sont accessibles
  - Les utilisateurs non authentifiés ne peuvent que LIRE, pas modifier
*/

-- Permettre aux utilisateurs non authentifiés de voir les prédictions publiques
CREATE POLICY "Tous peuvent voir les predictions publiques"
  ON predictions FOR SELECT
  TO anon
  USING (is_public = true);

-- Permettre aux utilisateurs non authentifiés de voir les matchs des prédictions publiques
CREATE POLICY "Tous peuvent voir les matchs des predictions publiques"
  ON matches FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM predictions p
      WHERE p.id = matches.prediction_id
      AND p.is_public = true
    )
  );
