/*
  # Créer le trigger de synchronisation auth → public.users

  1. Fonction trigger
    - Synchronise automatiquement auth.users vers public.users
    - Assigne automatiquement is_admin = true au premier compte créé
  
  2. Trigger
    - Se déclenche après chaque inscription (INSERT dans auth.users)
*/

-- Créer la fonction trigger pour synchroniser auth.users → public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  is_first_user boolean;
BEGIN
  -- Vérifier si c'est le premier utilisateur
  SELECT NOT EXISTS (SELECT 1 FROM public.users LIMIT 1) INTO is_first_user;
  
  -- Insérer dans public.users
  INSERT INTO public.users (id, email, is_admin, is_vip)
  VALUES (
    NEW.id,
    NEW.email,
    is_first_user,  -- Premier utilisateur = admin automatiquement
    false
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  
  RETURN NEW;
END;
$$;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();