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

## 🚀 Installation rapide

```bash
# 1. Cloner & installer les dépendances
git clone https://github.com/lgadrien/MyFinances.git
cd MyFinances
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env.local
# → Éditez .env.local (voir section Variables d'environnement)

# 3. Initialiser Supabase
# → Ouvrez Supabase SQL Editor et exécutez database/supabase-setup.sql

# 4. Démarrer en développement
npm run dev
# → http://localhost:3000
```

---

## 🔑 Variables d'environnement

Fichier : `.env.local` (copié depuis `.env.example`)

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

---

## 🗄️ Base de données

1. Ouvrez votre projet Supabase → **SQL Editor** → **New query**
2. Copiez-collez le contenu de **`database/supabase-setup.sql`**
3. Cliquez **Run**

Ce fichier unique crée toutes les tables, index, politiques RLS, et insère la ligne de settings initiale.

> 💡 Pour tester avec des données de démonstration, décommentez la section `OPTIONAL: sample data` en bas du fichier SQL.

---

## 🏗️ Architecture du projet

```
MyFinances/
├── database/
│   └── supabase-setup.sql      # Schéma complet (tables, RLS, index)
│
├── src/
│   ├── app/                    # Pages (Next.js App Router)
│   │   ├── page.tsx            # Dashboard principal
│   │   ├── transactions/       # Page transactions (CRUD + import/export CSV)
│   │   ├── portefeuille/       # Page portefeuille (positions + rééquilibrage)
│   │   ├── marche/             # Page marché & watchlist
│   │   ├── login/              # Authentification
│   │   ├── error.tsx           # Page d'erreur globale
│   │   ├── not-found.tsx       # Page 404
│   │   └── api/
│   │       ├── auth/login/     # Authentification + rate limiting
│   │       ├── stock/          # Prix live Yahoo Finance
│   │       ├── stock/history/  # Historique OHLCV (graphiques)
│   │       ├── stock/search/   # Recherche de tickers
│   │       ├── favorites/      # CRUD favoris (Supabase)
│   │       ├── search/         # Recherche globale
│   │       ├── portfolio/      # Historique valeur portefeuille
│   │       └── cron/snapshot/  # Snapshot quotidien (Vercel Cron)
│   │
│   ├── components/
│   │   ├── StockChart.tsx      # Graphique interactif + analyse technique
│   │   ├── QueryProvider.tsx   # TanStack Query provider
│   │   ├── ThemeProvider.tsx   # Thème dark/light
│   │   ├── layout/             # Sidebar, BottomNav (mobile), ResponsiveLayout
│   │   ├── ui/                 # Badge, Modal, Skeleton, StatsCard, ThemeToggle
│   │   └── widgets/            # BenchmarkChart, TaxSimulator
│   │
│   ├── hooks/                  # Custom React hooks (logique extraite des pages)
│   │   ├── useDashboard.ts     # Logique de chargement du Dashboard
│   │   └── usePortfolio.ts     # Logique de chargement du Portefeuille
│   │
│   ├── lib/                    # Utilitaires & services
│   │   ├── types.ts            # ⭐ Types TypeScript centralisés (importer ici)
│   │   ├── utils.ts            # ⭐ Formatters (formatEUR, formatPrice, %) + couleurs graphiques
│   │   ├── calculations.ts     # Calculs PRU, dividendes, positions
│   │   ├── data.ts             # Fonctions d'accès Supabase (CRUD)
│   │   ├── stocks.ts           # Fetch Yahoo Finance + cache
│   │   ├── supabase.ts         # Client Supabase (singleton)
│   │   ├── technical-analysis.ts # RSI, MACD, Bollinger, SMA, ATR
│   │   └── french-instruments.ts # Liste statique des 150+ instruments PEA
│   │
│   └── proxy.ts                # Auth proxy (remplace middleware Next.js 16)
│
├── public/                     # Assets statiques
├── .env.example                # Template des variables d'environnement
├── .env.local                  # Variables locales (ignoré par git)
├── next.config.ts              # Configuration Next.js
├── vercel.json                 # Config Vercel (cron quotidien 00:00 UTC)
└── package.json
```

### 🧭 Où trouver quoi ?

| Besoin                               | Fichier                                    |
| ------------------------------------ | ------------------------------------------ |
| Ajouter un type TypeScript           | `src/lib/types.ts`                         |
| Ajouter un formateur de nombre       | `src/lib/utils.ts`                         |
| Modifier les couleurs des graphiques | `src/lib/utils.ts` → `CHART_COLORS`        |
| Modifier les calculs financiers      | `src/lib/calculations.ts`                  |
| Appels base de données               | `src/lib/data.ts`                          |
| Liste des actions PEA                | `src/lib/french-instruments.ts`            |
| Logique du Dashboard                 | `src/hooks/useDashboard.ts`                |
| Logique du Portefeuille              | `src/hooks/usePortfolio.ts`                |
| Schéma base de données               | `database/supabase-setup.sql`              |
| Authentification                     | `src/proxy.ts` + `src/app/api/auth/login/` |
| Navigation (sidebar/mobile)          | `src/components/layout/`                   |

---

## ☁️ Déploiement sur Vercel

```bash
# 1. Push sur GitHub
git push origin main

# 2. Importez le repo sur vercel.com
# 3. Ajoutez les variables d'env dans Settings → Environment Variables
# 4. Deploy !
```

Variables à ajouter sur Vercel :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ACCESS_PASSWORD`
- `CRON_SECRET`

> Le cron snapshot quotidien est configuré dans `vercel.json` — requiert le plan Hobby ou supérieur.

---

## 🔒 Sécurité

- Authentification par **cookie HTTP-only** + mot de passe (env var)
- **Rate limiting** sur le login : 5 tentatives / 15 min / IP
- **En-têtes de sécurité HTTP** : CSP, X-Frame-Options, X-Content-Type-Options
- **Validation serveur** sur toutes les routes API
- **Proxy Next.js 16** protège toutes les routes (sauf `/login` et `/api/auth/login`)

---

## 🧰 Stack technique

| Catégorie             | Technologie                                  |
| --------------------- | -------------------------------------------- |
| Framework             | Next.js 16 (App Router, Turbopack)           |
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
