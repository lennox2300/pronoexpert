# PronoExpert - Application de Prédictions Sportives VIP

Application web moderne pour la gestion et publication de prédictions sportives avec système VIP.

## Fonctionnalités

### Pour tous les utilisateurs
- Consultation des prédictions publiques
- Historique complet avec filtres (Tout / En attente / Gagnés / Perdus)
- Statistiques détaillées de performance
- Interface responsive et moderne

### Pour les membres VIP
- Accès à toutes les prédictions exclusives
- Historique complet VIP
- Support prioritaire

### Pour les administrateurs
- Publication de prédictions simples ou combinées
- Support multi-sports (Football, Tennis, Basketball)
- Calcul automatique des cotes totales
- Validation des résultats (Gagné/Perdu)
- Calcul automatique des profits/pertes

## Configuration

### 1. Créer un compte Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Les migrations sont déjà appliquées

### 2. Créer le compte admin

Dans le dashboard Supabase, allez dans Authentication > Users et créez un utilisateur avec:
- Email: admin@prono.com
- Mot de passe: (choisissez un mot de passe sécurisé)

Ensuite, dans SQL Editor, exécutez:

```sql
UPDATE users
SET is_admin = true
WHERE email = 'admin@prono.com';
```

### 3. Variables d'environnement

Le fichier `.env` contient déjà les valeurs Supabase:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Installation

```bash
npm install
npm run dev
```

## Structure de la base de données

### Table `users`
- Profils utilisateurs étendus
- Gestion des rôles (admin, VIP)

### Table `predictions`
- Prédictions sportives
- Types: simple ou combiné
- Statuts: pending, won, lost
- Visibilité: public ou VIP uniquement

### Table `matches`
- Matchs individuels liés aux prédictions
- Support multi-sports
- Détails des paris et cotes

## Utilisation

### Connexion Admin
1. Cliquez sur "Connexion"
2. Utilisez les identifiants admin (admin@prono.com)
3. Accédez au panel Admin via le menu

### Créer une prédiction
1. Dans le panel Admin, cliquez sur "Nouvelle prédiction"
2. Choisissez le type (simple/combiné)
3. Ajoutez les matchs avec leurs détails
4. Définissez la mise et la visibilité (public/VIP)
5. La cote totale est calculée automatiquement

### Valider une prédiction
1. Dans le panel Admin, trouvez les prédictions "En attente"
2. Cliquez sur "Gagné" ou "Perdu"
3. Le profit/perte est calculé automatiquement

### Devenir membre VIP
1. Cliquez sur "Devenir membre" dans la navigation
2. Contactez l'admin via Telegram: @oraclebetsports
3. Attendez l'activation manuelle de votre compte

## Déploiement

### Netlify (recommandé)

1. Poussez votre code sur GitHub
2. Connectez votre repository à Netlify
3. Configurez les variables d'environnement
4. Déployez

Les variables d'environnement à configurer sur Netlify:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Design

L'application utilise une charte graphique moderne:
- Fond: noir profond (gray-950) et gris anthracite
- Accents: vert vif pour les succès, jaune-or pour les highlights
- Cartes avec bordures subtiles et ombres légères
- Interface responsive optimisée mobile et desktop

## Technologies

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Supabase (backend + auth + database)
- Lucide React (icons)

## Support

Pour toute question ou demande d'activation VIP:
- Telegram: @oraclebetsports

<!-- Deploy: 2026-02-05 -->
