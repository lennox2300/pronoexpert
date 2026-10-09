/*
# Add sport column to custom_entries

1. Purpose
   Permet de classer automatiquement les championnats et équipes personnalisés
   par sport. Quand l'admin sélectionne "Autre" et tape un nom de championnat,
   le sport choisi (football, tennis, basketball, etc.) est sauvegardé avec
   l'entrée. Les suggestions d'équipes sont ensuite filtrées par sport et par
   compétition, et les championnats personnalisés n'apparaissent que pour le
   sport sélectionné.

2. Modified Table: custom_entries
   - Ajout de la colonne `sport` (text, nullable)
     Valeurs possibles: 'football', 'tennis', 'basketball', 'hockey', 'rugby',
     'sports_us', 'boxing', 'mma', 'golf', 'volleyball', 'handball', 'baseball',
     'cycling'. Null pour les anciennes entrées et pour les bet_types.

3. Security
   - Aucun changement: RLS déjà activé, politiques existantes conservées.

4. Index
   - Index sur (entry_type, sport) pour filtrer rapidement les suggestions.
*/

ALTER TABLE custom_entries ADD COLUMN IF NOT EXISTS sport text;

CREATE INDEX IF NOT EXISTS idx_custom_entries_type_sport
  ON custom_entries (entry_type, sport);
