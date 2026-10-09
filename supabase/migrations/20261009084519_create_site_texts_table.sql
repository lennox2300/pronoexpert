/*
# Create site_texts table for editable site content

## Purpose
Store all user-facing text content (SEO paragraphs, VIP zone descriptions, join VIP page texts,
footer descriptions, etc.) so the admin can modify them without touching code.

## New Tables
- `site_texts` — key/value store for editable text blocks
  - `key` (text, primary key) — unique identifier like 'home_seo_title', 'footer_seo_text', etc.
  - `label` (text) — human-readable label shown in admin panel
  - `content` (text) — the actual text content
  - `category` (text) — grouping: 'public' (visible to all), 'guest' (visible only to non-connected users)
  - `is_rich` (boolean, default false) — whether the text supports multi-line/paragraph content
  - `updated_at` (timestamptz)

## Security
- RLS enabled.
- SELECT: public (anon + authenticated) — all visitors need to read site text.
- INSERT/UPDATE/DELETE: authenticated only (admins will manage via UI; RLS on users table enforces admin check at app level).

## Public RPC function
- `get_site_texts()` returns all rows as JSONB, SECURITY DEFINER, granted to anon + authenticated.
  This avoids RLS complexity for the public read path.

## Seed data
- Inserts default text for all known editable text blocks.
*/

CREATE TABLE IF NOT EXISTS site_texts (
  key text PRIMARY KEY,
  label text NOT NULL,
  content text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'public',
  is_rich boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_texts ENABLE ROW LEVEL SECURITY;

-- Public read: all visitors can see site text
DROP POLICY IF EXISTS "public_read_site_texts" ON site_texts;
CREATE POLICY "public_read_site_texts"
ON site_texts FOR SELECT
TO anon, authenticated USING (true);

-- Only authenticated users can modify (app-level admin check enforces who)
DROP POLICY IF EXISTS "auth_insert_site_texts" ON site_texts;
CREATE POLICY "auth_insert_site_texts"
ON site_texts FOR INSERT
TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_site_texts" ON site_texts;
CREATE POLICY "auth_update_site_texts"
ON site_texts FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_site_texts" ON site_texts;
CREATE POLICY "auth_delete_site_texts"
ON site_texts FOR DELETE
TO authenticated USING (true);

-- Public RPC function to fetch all site texts
CREATE OR REPLACE FUNCTION get_site_texts()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_object_agg(key, jsonb_build_object(
    'label', label,
    'content', content,
    'category', category,
    'is_rich', is_rich
  ))
  FROM site_texts;
$$;

GRANT EXECUTE ON FUNCTION get_site_texts() TO anon, authenticated;

-- Seed default text values
INSERT INTO site_texts (key, label, content, category, is_rich) VALUES
-- Public texts (visible to all, editable inline by admin)
('home_seo_title', 'Titre SEO page d''accueil', 'Pronostics sportifs gratuits et VIP', 'public', false),
('home_seo_text', 'Texte SEO page d''accueil', 'Suivez nos pronostics sportifs en temps reel avec un historique transparent et verifiable.
Football, tennis, basketball, hockey : chaque pari est suivi de A a Z avec mise, cote et resultat.
Nos pronos du jour sont publies quotidiennement pour la communaute. Rejoignez l''espace VIP pour acceder
a nos meilleures analyses et combined gagnants. Suivi de bankroll complet et statistiques detaillees.', 'public', true),
('footer_responsible_text', 'Footer - Jeu responsable', 'Les jeux d''argent et de hasard sont interdits aux mineurs. Jouez de maniere responsable. Ne misez que des sommes que vous pouvez vous permettre de perdre.', 'public', false),
('footer_warning_text', 'Footer - Avertissement', 'AVERTISSEMENT: LES JEUX D''ARGENT ET DE HASARD PEUVENT ETRE DANGEREUX : PERTES D''ARGENT, CONFLITS FAMILIAUX, ADDICTION...', 'public', false),
('footer_warning_phone', 'Footer - Telephone aide', 'Numero de telephone pour vous aider : 09-74-75-13-13 (appel non surtaxe)', 'public', false),
('footer_seo_text', 'Footer - Description SEO', 'PRONO EXPERT est un service de pronostics sportifs professionnels specialise dans le football, le tennis, le basketball, le hockey et le rugby.
Nous proposons des pronostics gratuits et VIP avec un suivi transparent de bankroll et un historique complet verifiable.
Retrouvez nos analyses et predictions pour la Coupe du Monde 2026, la Ligue des Champions, la Ligue 1, le Top 14 et tous les grands championnats.', 'public', true),
('footer_copyright', 'Footer - Copyright', '© 2026 PRONO EXPERT. All Rights Reserved', 'public', false),

-- Guest texts (visible only to non-connected users, editable in Admin/Monetisation)
('vip_zone_title', 'VIP - Titre zone exclusive', 'Zone VIP Exclusive', 'guest', false),
('vip_zone_subtitle', 'VIP - Sous-titre zone exclusive', 'Cette section est reservee aux membres VIP', 'guest', false),
('vip_zone_advantages_title', 'VIP - Titre avantages', 'Avantages VIP', 'guest', false),
('vip_zone_advantage_1', 'VIP - Avantage 1', 'Acces a toutes les predictions exclusives', 'guest', false),
('vip_zone_advantage_2', 'VIP - Avantage 2', 'Analyses detaillees des matchs', 'guest', false),
('vip_zone_advantage_3', 'VIP - Avantage 3', 'Support prioritaire', 'guest', false),
('vip_zone_cta_button', 'VIP - Bouton CTA', 'Devenir Membre VIP', 'guest', false),

('joinvip_title', 'JoinVIP - Titre', 'Devenir Membre VIP', 'guest', false),
('joinvip_subtitle', 'JoinVIP - Sous-titre', 'Accédez à toutes nos prédictions exclusives', 'guest', false),
('joinvip_advantages_title', 'JoinVIP - Titre avantages', 'Avantages VIP', 'guest', false),
('joinvip_adv1_title', 'JoinVIP - Avantage 1 titre', 'Toutes les prédictions VIP', 'guest', false),
('joinvip_adv1_desc', 'JoinVIP - Avantage 1 desc', 'Analyses approfondies et prédictions exclusives', 'guest', false),
('joinvip_adv2_title', 'JoinVIP - Avantage 2 titre', 'Historique complet', 'guest', false),
('joinvip_adv2_desc', 'JoinVIP - Avantage 2 desc', 'Consultez toutes nos prédictions passées', 'guest', false),
('joinvip_adv3_title', 'JoinVIP - Avantage 3 titre', 'Statistiques détaillées', 'guest', false),
('joinvip_adv3_desc', 'JoinVIP - Avantage 3 desc', 'Suivez nos performances en temps réel', 'guest', false),
('joinvip_adv4_title', 'JoinVIP - Avantage 4 titre', 'Support prioritaire', 'guest', false),
('joinvip_adv4_desc', 'JoinVIP - Avantage 4 desc', 'Contact direct avec nos experts', 'guest', false),
('joinvip_adv5_title', 'JoinVIP - Avantage 5 titre', 'Taux de réussite élevé', 'guest', false),
('joinvip_adv5_desc', 'JoinVIP - Avantage 5 desc', 'Prédictions avec historique prouvé', 'guest', false),
('joinvip_adv6_title', 'JoinVIP - Avantage 6 titre', 'Multi-sports', 'guest', false),
('joinvip_adv6_desc', 'JoinVIP - Avantage 6 desc', 'Football, Tennis, Basketball, Hockey, Rugby...', 'guest', false),

('joinvip_request_title', 'JoinVIP - Titre demande', 'Demande d''accès VIP', 'guest', false),
('joinvip_request_signup_info', 'JoinVIP - Info inscription', 'Inscription obligatoire avec votre email', 'guest', false),
('joinvip_request_signup_detail', 'JoinVIP - Detail inscription', 'Votre adresse email est indispensable pour recevoir la confirmation d''accès et correspondre avec l''admin. Les demandes sans compte valide ne sont pas traitées.', 'guest', true),
('joinvip_step1', 'JoinVIP - Etape 1', 'Inscrivez-vous avec votre email', 'guest', false),
('joinvip_step2', 'JoinVIP - Etape 2', 'Faites votre demande VIP', 'guest', false),
('joinvip_step3', 'JoinVIP - Etape 3', 'L''admin l''examine et vous contacte', 'guest', false),
('joinvip_request_sent_title', 'JoinVIP - Demande envoyee titre', 'Demande envoyée !', 'guest', false),
('joinvip_request_sent_text', 'JoinVIP - Demande envoyee texte', 'Votre demande a bien été reçue dans le panneau d''administration. L''admin vous contactera à votre adresse email pour vous confirmer votre accès.', 'guest', true),
('joinvip_processing_delay', 'JoinVIP - Delai traitement', 'Délai de traitement habituel : sous 24h', 'guest', false),
('joinvip_signup_prompt', 'JoinVIP - Prompt inscription', 'Créez votre compte gratuit avec votre email pour commencer', 'guest', false),
('joinvip_signup_button', 'JoinVIP - Bouton inscription', 'S''inscrire gratuitement', 'guest', false),
('joinvip_community_title', 'JoinVIP - Titre communaute', 'Rejoignez notre communauté de gagnants', 'guest', false),
('joinvip_community_text', 'JoinVIP - Texte communaute', 'Des centaines de membres VIP font confiance à PronoExpert', 'guest', false),

('member_login_title', 'Member - Titre non connecte', 'Espace Membre', 'guest', false),
('member_login_text', 'Member - Texte non connecte', 'Connectez-vous ou créez un compte pour accéder à votre espace personnel.', 'guest', false),
('member_login_button', 'Member - Bouton connexion', 'Se connecter / S''inscrire', 'guest', false),
('member_nonvip_title', 'Member - Titre non-VIP', 'Passer au VIP', 'guest', false),
('member_nonvip_text', 'Member - Texte non-VIP', 'Débloquez l''accès à toutes nos prédictions exclusives avec un taux de réussite prouvé.', 'guest', false),
('member_nonvip_button', 'Member - Bouton non-VIP', 'Demander l''accès VIP', 'guest', false),

('infos_locked_vip_text', 'Infos - Texte verrouille VIP', 'Devenez membre VIP pour accéder à ce contenu exclusif.', 'guest', false),
('infos_locked_guest_text', 'Infos - Texte verrouille non connecte', 'Créez un compte gratuit puis demandez l''accès VIP pour découvrir ce contenu.', 'guest', false),
('infos_locked_vip_button', 'Infos - Bouton verrouille VIP', 'Devenir VIP', 'guest', false),
('infos_locked_guest_button', 'Infos - Bouton verrouille non connecte', 'Créer un compte', 'guest', false)

ON CONFLICT (key) DO NOTHING;
