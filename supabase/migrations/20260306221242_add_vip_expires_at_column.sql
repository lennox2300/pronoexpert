/*
  # Ajout de la colonne vip_expires_at

  1. Modifications
    - Ajout de la colonne `vip_expires_at` à la table `users`
      - Type: timestamptz (timestamp with time zone)
      - Nullable: true (peut être null si l'utilisateur n'est pas VIP)
      - Utilisé pour gérer l'expiration de l'accès VIP
  
  2. Notes
    - Cette colonne permet de définir une date d'expiration pour l'accès VIP
    - Si la date est dans le passé, l'utilisateur n'est plus VIP
    - Si null, l'accès VIP n'a pas de date d'expiration (ou l'utilisateur n'est pas VIP)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'vip_expires_at'
  ) THEN
    ALTER TABLE users ADD COLUMN vip_expires_at timestamptz;
  END IF;
END $$;