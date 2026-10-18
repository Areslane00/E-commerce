# 🛍️ NOVA Store — Application E-Commerce Moderne & Complète

Application e-commerce complète, performante et responsive, prête pour le déploiement sur **Vercel** avec **Supabase** comme backend (Base de données PostgreSQL, Authentification, Stockage d'images et Realtime).

---

## 🚀 Fonctionnalités Principales

### 🌐 Partie Client (Publique)
- **Catalogue interactif** : Grille de produits fluide avec recherche instantanée, filtres par catégories et tri (prix, stock, nouveautés).
- **Badges de stock en direct** :
  - 🟢 Badge vert **"Disponible"** si stock > 0.
  - 🔴 Badge rouge **"Terminé"** si stock = 0 (avec bouton d'ajout désactivé et carte grisée).
  - 🟠 Badge d'alerte orange si stock < 5 ("Plus que X exemplaires").
- **Fiche produit détaillée** : Grande image, description, prix, statut du stock et sélecteur de quantité borné au stock réel disponible.
- **Panier d'achat interactif** :
  - Drawer latéral coulissant (ou page dédiée `/cart`) accessible en un clic.
  - Modification des quantités, suppression d'articles, total dynamique calculé en temps réel.
  - Persistance automatique dans le `localStorage` via **Zustand**.
  - Badge avec compteur d'articles dans le header sticky.
- **Tunnel de commande (Checkout)** :
  - Formulaire de commande validé avec **Zod** et **React Hook Form** (Nom, téléphone, email, adresse, ville, consignes livreur).
  - **Paiement à la livraison** (espèces lors de la remise du colis).
  - Validation transactionnelle côté serveur via **Fonction SQL / RPC Supabase (`create_order`)** avec verrouillage de lignes (`FOR UPDATE`) pour éviter tout dépassement de stock ou condition de course (race condition).
  - Vidage automatique du panier et redirection vers la page de confirmation.
- **Page de confirmation de commande** : Affichage du numéro de commande unique (ex: `CMD-261018-AB12`), rappel du montant exact à régler et animation festive de confettis.

---

### 🛡️ Espace Administration (`/admin`, Sécurisé)
- **Authentification & Sécurité** :
  - Authentification par email/mot de passe via **Supabase Auth**.
  - Table `profiles` avec contrôle de rôle (`role: 'admin'`).
  - **Middleware Next.js** bloquant tout accès non autorisé à `/admin` et redirigeant vers `/login`.
- **Tableau de bord Analytics** :
  - Cartes KPI : Chiffre d'affaires net, Nombre de commandes, Panier moyen, Commandes du jour, Produits en rupture.
  - Graphiques dynamiques **Recharts** :
    - 📈 Courbe des revenus par jour (filtre 7 ou 30 derniers jours).
    - 📊 Barres des Top 5 produits les plus vendus.
    - 🥧 Camembert de répartition des commandes par statut.
  - Aperçu des dernières commandes passées.
- **Gestion des Commandes** :
  - Tableau complet : N° de commande, nom du client, téléphone, ville, total, date et statut.
  - Sélecteur de statut en direct : *En attente*, *Confirmée*, *Expédiée*, *Livrée*, *Annulée*.
  - **Restauration automatique du stock** : Si une commande passe à *Annulée*, les articles sont réintégrés instantanément dans les stocks.
  - Modal de détails complets avec coordonnées de livraison et liste des articles commandés.
  - **Mises à jour en direct (Supabase Realtime)** : Notification visuelle (Toast) dès qu'une nouvelle commande arrive.
- **Gestion des Produits & Stocks** :
  - Tableau de l'inventaire avec visuel, nom, prix, catégorie, stock et statut automatique.
  - **Ajustement rapide du stock** directement dans le tableau avec les boutons `+` et `-`.
  - Création et modification de produits via modal.
  - Téléversement direct de photographies vers le bucket **Supabase Storage** (`product-images`).
  - Suppression sécurisée avec boîte de dialogue de confirmation.

---

## 🛠️ Stack Technique

- **Framework** : [Next.js 14+ (App Router)](https://nextjs.org/) + TypeScript
- **Styles & UI** : [Tailwind CSS](https://tailwindcss.com/) + Icônes [Lucide React](https://lucide.dev/)
- **Backend & Base de données** : [Supabase](https://supabase.com/) (PostgreSQL 15+, Auth, Storage, Realtime, RLS)
- **Gestion d'état** : [Zustand](https://github.com/pmndrs/zustand) (panier persisté)
- **Visualisation de données** : [Recharts](https://recharts.org/)
- **Validation** : [Zod](https://zod.dev/) + [React Hook Form](https://react-hook-form.com/)

---

## 📦 Installation & Configuration Locale

### 1. Cloner et installer les dépendances

```bash
npm install
```

### 2. Configurer Supabase

1. Rendez-vous sur [Supabase](https://supabase.com) et créez un nouveau projet (ex: `nova-ecommerce`).
2. Dans le menu de gauche, ouvrez **SQL Editor**.
3. Ouvrez le fichier local [`supabase/schema.sql`](./supabase/schema.sql), copiez l'intégralité de son contenu et exécutez-le dans le SQL Editor de Supabase.
   > Ce script va créer les tables (`products`, `orders`, `order_items`, `profiles`), les fonctions RPC (`create_order`, `get_dashboard_analytics`), les triggers de stock, les politiques de sécurité Row Level Security (RLS), le bucket de stockage `product-images`, et insérer des produits de démonstration.

### 3. Créer le premier compte Administrateur

1. Dans Supabase, allez dans **Authentication > Users** et cliquez sur **Add user > Create user** :
   - Email : `admin@votredomaine.com`
   - Mot de passe : *votre mot de passe sécurisé*
   - Cochez **Auto Confirm User?** pour valider directement l'email.
2. Retournez dans **SQL Editor** et exécutez la requête suivante pour accorder les droits administrateur :

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@votredomaine.com';
```

3. Vérifiez la promotion :
```sql
SELECT id, email, role FROM public.profiles WHERE role = 'admin';
```

### 4. Configurer les variables d'environnement

Copiez le fichier `.env.example` en `.env.local` :

```bash
cp .env.example .env.local
```

Renseignez vos clés Supabase (disponibles dans Supabase sous **Project Settings > API**) :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 5. Démarrer le serveur de développement

```bash
npm run dev
```

L'application est disponible sur :
- **Boutique publique** : [http://localhost:3000](http://localhost:3000)
- **Espace Administrateur** : [http://localhost:3000/admin](http://localhost:3000/admin) (connexion sur [http://localhost:3000/login](http://localhost:3000/login))

---

## 🚢 Déploiement pas à pas sur Vercel

### Étape 1 : Publier le code sur GitHub

Initialisez votre dépôt Git et poussez-le sur GitHub :

```bash
git init
git add .
git commit -m "feat: initialisation ecommerce next.js + supabase"
git branch -M main
git remote add origin https://github.com/votre-compte/e-commerce.git
git push -u origin main
```

### Étape 2 : Importer le projet dans Vercel

1. Connectez-vous sur [Vercel](https://vercel.com).
2. Cliquez sur **Add New... > Project**.
3. Importez votre dépôt GitHub `e-commerce`.
4. Dans les paramètres de configuration :
   - **Framework Preset** : `Next.js` (détecté automatiquement).
   - **Root Directory** : `./`

### Étape 3 : Définir les variables d'environnement sur Vercel

Dans la section **Environment Variables**, ajoutez les 4 variables suivantes :

| Clé | Valeur |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | L'URL de votre projet Supabase (`https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | La clé publique Anon de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | La clé secrète Service Role de Supabase |
| `NEXT_PUBLIC_SITE_URL` | L'URL de production Vercel (ex: `https://votre-app.vercel.app`) |

Cliquez ensuite sur **Deploy**. En moins de 2 minutes, votre application est en ligne !

### Étape 4 : Configurer les URLs de redirection dans Supabase

Pour que l'authentification et les redirections fonctionnent parfaitement en production :

1. Ouvrez votre projet sur **Supabase**.
2. Rendez-vous dans **Authentication > URL Configuration**.
3. Modifiez les champs suivants :
   - **Site URL** : Renseignez votre URL de production Vercel (ex: `https://votre-app.vercel.app`).
   - **Redirect URLs** : Ajoutez :
     - `https://votre-app.vercel.app/**`
     - `https://votre-app.vercel.app/auth/callback`
     - `http://localhost:3000/**` (pour continuer à tester en local)
4. Cliquez sur **Save**.

---

## 🧪 Tests & Validation

| Scénario | Résultat attendu | Validé |
|---|---|:---:|
| **Parcours d'achat** | Ajout au panier, mise à jour des quantités, saisie du formulaire de livraison et confirmation de commande. | ✅ |
| **Décrémentation du stock** | À la validation d'une commande, le stock est décrémenté atomiquement via la RPC `create_order`. | ✅ |
| **Stock épuisé (0)** | Le produit affiche le badge rouge "Terminé", la carte est grisée et l'ajout au panier est désactivé. | ✅ |
| **Notifications temps réel** | Toute nouvelle commande s'affiche instantanément sur le tableau de bord de l'administrateur sans recharger la page. | ✅ |
| **Annulation de commande** | Si le statut d'une commande passe à "Annulée", les articles sont immédiatement réintégrés dans l'inventaire. | ✅ |
| **Sécurité d'accès** | Les routes sous `/admin` sont inaccessibles aux utilisateurs non authentifiés ou non-admin. | ✅ |
| **Compilation Vercel** | `npm run build` passe avec 0 erreur TypeScript et 0 warning bloquant. | ✅ |

---

## 📄 Licence

Ce projet est sous licence MIT.
