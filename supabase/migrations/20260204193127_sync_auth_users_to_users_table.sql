/*
  # Synchroniser automatiquement les utilisateurs auth avec la table users
  
  ## Description
  Cette migration résout le problème où les utilisateurs qui s'inscrivent via Supabase Auth
  ne sont pas automatiquement ajoutés à la table users. Cela empêchait les utilisateurs VIP
  de voir les prédictions VIP car les politiques RLS vérifient la table users.
  
  ## Modifications
  1. Créer une fonction trigger qui ajoute automatiquement les nouveaux utilisateurs à la table users
  2. Créer le trigger sur auth.users pour appeler cette fonction
  3. Synchroniser les utilisateurs existants qui n'ont pas d'entrée dans users
  
  ## Sécurité
  - Les nouveaux utilisateurs sont créés avec is_admin = false et is_vip = false par défaut
  - Les admins doivent manuellement activer le statut VIP
*/

-- Fonction pour créer automatiquement une entrée dans users lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, is_admin, is_vip)
  VALUES (NEW.id, NEW.email, false, false)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur auth.users pour appeler cette fonction
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Synchroniser les utilisateurs existants qui n'ont pas d'entrée dans users
INSERT INTO public.users (id, email, is_admin, is_vip)
SELECT id, email, false, false
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;
