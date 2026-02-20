# MyFinances — PEA Portfolio Tracker 🚀

Application de suivi de portefeuille boursier PEA, construite avec Next.js 16, Supabase et l'API Yahoo Finance (gratuite, sans clé).

![Stack](https://img.shields.io/badge/Next.js-16-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase) ![Tailwind](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwind-css)

---

## ✨ Fonctionnalités

| Module                | Description                                                                           |
| --------------------- | ------------------------------------------------------------------------------------- |
| **Dashboard**         | Vue d'ensemble : capital, liquidités, plus-values, dividendes projetés, objectif PEA  |
| **Transactions**      | CRUD complet (achat / vente / dividende), import/export CSV, filtre & tri             |
| **Portefeuille**      | PRU, plus-values, répartition sectorielle, outil de rééquilibrage                     |
| **Marché**            | Watchlist live (Yahoo Finance), favoris persistants, 150+ actions éligibles PEA       |
| **Analyse technique** | RSI, MACD, Bollinger Bands, SMA 20/50, ATR — score composite avec niveau de confiance |
| **Historique**        | Snapshot quotidien automatique (Vercel Cron) de la valeur du portefeuille             |

---

## 🛠️ Prérequis

- **Node.js** v18 ou supérieur
- Un compte **Supabase** gratuit → [supabase.com](https://supabase.com)
- _(Optionnel)_ Un compte **Vercel** pour le déploiement et le cron quotidien

---

## 🚀 Installation

### 1. Cloner & installer

```bash
git clone https://github.com/votre-username/myfinances.git
cd myfinances
npm install
```

### 2. Variables d'environnement

```bash
cp .env.example .env.local
```

Remplissez `.env.local` :

```env
# Supabase (obligatoire)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Mot de passe d'accès à l'application (obligatoire)
ACCESS_PASSWORD=un-mot-de-passe-fort

# Secret pour le cron Vercel (optionnel — recommandé en production)
CRON_SECRET=un-secret-aleatoire-long
```

> **Yahoo Finance** est utilisé pour les prix en temps réel — gratuit, sans clé API.

### 3. Initialiser la base de données Supabase

1. Ouvrez votre projet Supabase → **SQL Editor** → **New query**
2. Copiez-collez le contenu de **`supabase-setup.sql`** (fichier à la racine du projet)
3. Cliquez **Run**

Ce fichier unique crée toutes les tables, les index, les politiques RLS, et insère la ligne de settings initiale.

> 💡 Pour tester l'app avec des données de démonstration, décommentez la section `OPTIONAL: sample data` en bas du fichier SQL avant de l'exécuter.

### 4. Lancer en développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) → connectez-vous avec le mot de passe défini dans `ACCESS_PASSWORD`.

---

## 🏗️ Structure du projet

```
src/
├── app/
│   ├── page.tsx               # Dashboard principal
│   ├── transactions/          # Page transactions
│   ├── portefeuille/          # Page portefeuille
│   ├── marche/                # Page marché & watchlist
│   ├── login/                 # Page d'authentification
│   ├── error.tsx              # Page d'erreur globale
│   ├── not-found.tsx          # Page 404
│   └── api/
│       ├── auth/login/        # Authentification + rate limiting
│       ├── stock/             # Prix live Yahoo Finance
│       ├── stock/history/     # Historique OHLCV pour les graphiques
│       ├── stock/search/      # Recherche de tickers
│       ├── favorites/         # CRUD favoris
│       ├── search/            # Recherche globale
│       ├── portfolio/history/ # Lecture historique portefeuille
│       └── cron/snapshot/     # Snapshot quotidien (Vercel Cron)
├── components/
│   ├── StockChart.tsx         # Graphique interactif + analyse technique
│   ├── layout/                # Sidebar, BottomNav, ResponsiveLayout
│   └── ui/                    # Badge, Modal, StatsCard
└── lib/
    ├── types.ts               # Types TypeScript centralisés
    ├── calculations.ts        # Calculs PRU, dividendes, positions
    ├── data.ts                # Fonctions d'accès Supabase
    ├── stocks.ts              # Fetch Yahoo Finance + cache
    ├── supabase.ts            # Client Supabase
    ├── technical-analysis.ts  # RSI, MACD, Bollinger, SMA, ATR
    └── french-instruments.ts  # Liste des 150+ instruments PEA
```

---

## ☁️ Déploiement sur Vercel

### 1. Push sur GitHub, puis importer sur Vercel

### 2. Variables d'environnement Vercel

Dans `Settings → Environment Variables` de votre projet Vercel, ajoutez :

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
ACCESS_PASSWORD
CRON_SECRET
```

### 3. Cron job (snapshot quotidien)

Le fichier `vercel.json` configure automatiquement un cron à **minuit UTC** :

```json
{
  "crons": [{ "path": "/api/cron/snapshot", "schedule": "0 0 * * *" }]
}
```

> Requiert le **plan Hobby** Vercel ou supérieur pour les crons.

---

## 🔒 Sécurité

- Authentification par **cookie HTTP-only** + mot de passe (env var)
- **Rate limiting** sur le login : 5 tentatives / 15 min / IP
- **En-têtes de sécurité HTTP** : CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **Validation serveur** sur toutes les routes API (ticker regex, types)
- **Middleware Next.js** protège toutes les routes (sauf `/login` et `/api/auth/login`)

---

## 🧰 Stack technique

| Catégorie             | Technologie                                  |
| --------------------- | -------------------------------------------- |
| Framework             | Next.js 16 (App Router)                      |
| Langage               | TypeScript 5 (strict mode)                   |
| Style                 | Tailwind CSS v4                              |
| Base de données       | Supabase (PostgreSQL)                        |
| State / Data fetching | TanStack Query v5                            |
| Graphiques            | Recharts                                     |
| Icônes                | Lucide React                                 |
| Notifications         | React Hot Toast                              |
| Prix marché           | Yahoo Finance (API non officielle, gratuite) |
| Déploiement           | Vercel                                       |

---

## 📄 Licence

MIT — libre d'utilisation, de modification et de distribution.
