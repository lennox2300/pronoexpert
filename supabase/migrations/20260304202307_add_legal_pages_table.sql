/*
  # Create Legal Pages Table

  1. New Tables
    - `legal_pages`
      - `id` (uuid, primary key)
      - `slug` (text, unique) - URL identifier (faq, privacy, terms, about, contact)
      - `title` (text) - Page title
      - `content` (text) - Page content in markdown/HTML
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `legal_pages` table
    - Add policy for public read access
    - Add policy for admin write access

  3. Initial Data
    - Insert default pages for FAQ, Privacy Policy, Terms of Use, About Us, Contact Us
*/

CREATE TABLE IF NOT EXISTS legal_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE legal_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view legal pages"
  ON legal_pages
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can insert legal pages"
  ON legal_pages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can update legal pages"
  ON legal_pages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can delete legal pages"
  ON legal_pages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

INSERT INTO legal_pages (slug, title, content) VALUES
  ('faq', 'FAQs', '# Questions Fréquentes

## Comment rejoindre le programme VIP ?
Contactez-nous sur Telegram pour découvrir nos offres VIP.

## Quels sports couvrez-vous ?
Nous couvrons le football, tennis, basketball, hockey, rugby et les sports américains.

## Quel est votre taux de réussite ?
Nous affichons un taux de réussite supérieur à 85% sur nos prédictions VIP.'),

  ('privacy', 'Privacy Policy', '# Politique de Confidentialité

## Collecte des données
Nous collectons uniquement les données nécessaires au fonctionnement de notre service.

## Utilisation des données
Vos données sont utilisées exclusivement pour améliorer votre expérience sur notre plateforme.

## Protection des données
Nous utilisons des mesures de sécurité avancées pour protéger vos informations personnelles.'),

  ('terms', 'Terms of Use', '# Conditions d''Utilisation

## Acceptation des conditions
En utilisant ce service, vous acceptez nos conditions d''utilisation.

## Utilisation responsable
Vous devez utiliser ce service de manière responsable et conformément aux lois applicables.

## Limitation de responsabilité
Les prédictions sont fournies à titre informatif uniquement. Nous ne sommes pas responsables des pertes financières.'),

  ('about', 'About Us', '# À Propos de Nous

## Notre Mission
PRONO EXPERT est votre partenaire de confiance pour des prédictions sportives de qualité.

## Notre Expertise
Notre équipe d''experts analyse chaque match avec précision pour vous offrir les meilleures prédictions.

## Notre Engagement
Nous nous engageons à fournir des analyses transparentes et des statistiques précises.'),

  ('contact', 'Contact Us', '# Contactez-Nous

## Telegram
Rejoignez notre canal Telegram : [t.me/oraclebetsports](https://t.me/oraclebetsports)

## Support VIP
Les membres VIP bénéficient d''un support prioritaire.

## Horaires
Nous sommes disponibles 7j/7 pour répondre à vos questions.')
ON CONFLICT (slug) DO NOTHING;
