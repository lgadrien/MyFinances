# MyFinances — PEA Portfolio Tracker 🚀

Application moderne de suivi et d'analyse de portefeuille boursier PEA, construite avec Next.js 16, Supabase (PostgreSQL), et l'API Yahoo Finance (temps réel, gratuite et sans clé).

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwind-css)
![Vitest](https://img.shields.io/badge/Vitest-Coverage_%3E80%25-green?logo=vitest)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?logo=githubactions)

---

## ✨ Fonctionnalités

| Module | Description |
|---|---|
| **Dashboard** | Synthèse financière complète : capital investi, valeur temps réel, plus-values, liquidités, dividendes projetés, jauge d'objectif PEA |
| **Portefeuille** | Calculs précis du PRU, plus-values latentes, allocation sectorielle interactive, outil de rééquilibrage de portefeuille |
| **Transactions** | CRUD complet (Achats, Ventes, Dividendes), imports et exports CSV, filtrage et tri dynamiques |
| **Marché & Watchlist** | Suivi live des cours (Yahoo Finance), système de favoris persistants, catalogue de 150+ actions & ETF éligibles PEA |
| **Analyse Technique** | Indicateurs techniques (RSI, MACD, Bandes de Bollinger, SMA 20/50, ATR) avec score composite et niveau de confiance |
| **Historique & Cron** | Instantané quotidien automatique de la valeur du portefeuille via Vercel Cron (`/api/cron/snapshot`) |

---

## 🛠️ Prérequis

- **Node.js** v18 ou supérieur
- Un compte **Supabase** gratuit → [supabase.com](https://supabase.com)
- _(Optionnel)_ Un compte **Vercel** pour le déploiement en production et l'exécution du cron quotidien

---

## 🚀 Installation rapide

```bash
# 1. Cloner le dépôt et installer les dépendances
git clone https://github.com/lgadrien/MyFinances.git
cd MyFinances
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos identifiants Supabase et mots de passe

# 3. Initialiser la base de données Supabase
# Ouvrez Supabase Dashboard → SQL Editor → exécuter database/supabase-setup.sql

# 4. Lancer la suite de tests et vérifier la couverture
npm test
npm run test:coverage

# 5. Démarrer le serveur de développement
npm run dev
# L'application est accessible sur http://localhost:3000
```

---

## 🔑 Variables d'environnement

Fichier local : `.env.local` (jamais versionné sur Git, basé sur `.env.example`).

```env
# ── Supabase (Obligatoire) ────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Service Role Key (Obligatoire côté serveur — NE JAMAIS PRÉFIXER PAR NEXT_PUBLIC_)
# Récupérer dans : Supabase Dashboard → Settings → API → service_role key
# Utilisé exclusivement par les API routes Next.js pour exécuter les opérations DB sécurisées
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ── Sécurité applicative (Obligatoire) ─────────────────────────────────────────
# Mot de passe d'accès à l'application (minimum 16 caractères recommandé)
ACCESS_PASSWORD=un-mot-de-passe-tres-robuste

# Secret d'authentification du Cron Vercel (Obligatoire en production)
# Générer avec : openssl rand -hex 32
CRON_SECRET=238f46cc0500cb4578e5910119191e992f5ff8fcff7b37689e02538d90ea2c66
```

---

## 🗄️ Base de données & Sécurité RLS

### Architecture « Zero-Anon »
Par mesure de sécurité renforcée :
- **Aucune requête client directe vers Supabase** : Le navigateur n'interagit jamais directement avec la base de données. Tous les formulaires et hooks passent par des routes d'API internes Next.js (`/api/transactions`, `/api/settings`, `/api/favorites`, etc.).
- **Row Level Security (RLS) hermétique** : Les politiques permissives accordées au rôle public `anon` sont entièrement révoquées. Même si la clé publique `anon` venait à fuiter, aucune donnée ne peut être lue ou modifiée depuis l'extérieur.
- **Service Role sécurisé côté serveur** : Les routes API serveur exécutent les requêtes via `supabaseAdmin` (`SUPABASE_SERVICE_ROLE_KEY`), ce qui contourne la RLS de façon maîtrisée et sécurisée côté serveur.

### Initialisation
1. Ouvrez votre projet Supabase → **SQL Editor** → **New query**.
2. Copiez-collez le contenu de **`database/supabase-setup.sql`**.
3. Cliquez sur **Run**.

### Migration RLS (pour les bases existantes)
Si votre base de données utilisait l'ancien modèle avec des politiques anonymes ouvertes :
1. Exécutez le script **`database/supabase-rls-lockdown.sql`** dans le SQL Editor Supabase.
2. Ce script révoque les anciennes règles `anon_all_*` et verrouille hermétiquement les tables.

---

## 🏗️ Architecture du projet

```
MyFinances/
├── .github/
│   └── workflows/
│       └── ci.yml              # Pipeline CI/CD GitHub Actions (typecheck, tests, coverage)
│
├── database/
│   ├── supabase-setup.sql      # Schéma complet de la base de données
│   └── supabase-rls-lockdown.sql # Migration de verrouillage RLS (Zero-Anon)
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Dashboard principal
│   │   ├── transactions/       # Page transactions (CRUD & CSV)
│   │   ├── portefeuille/       # Page portefeuille (positions & rééquilibrage)
│   │   ├── marche/             # Page marché (cours live & favoris)
│   │   ├── login/              # Interface d'authentification
│   │   ├── error.tsx           # Page d'erreur personnalisée
│   │   ├── not-found.tsx       # Page 404
│   │   └── api/                # API Routes (Serveur sécurisé)
│   │       ├── auth/login/     # Authentification & rate limiting
│   │       ├── cron/snapshot/  # Cron Vercel (snapshot quotidien avec CRON_SECRET)
│   │       ├── favorites/      # CRUD favoris (Supabase Admin)
│   │       ├── portfolio/history/ # Historique de valeur du portefeuille
│   │       ├── settings/       # GET/PUT solde espèces & objectif capital
│   │       ├── stock/          # Cours live d'un ticker (avec validation TICKER_RE)
│   │       ├── stock/batch/    # Cours live groupés (requête multi-tickers optimisée)
│   │       ├── stock/history/  # Historique de cours OHLCV
│   │       └── transactions/   # CRUD transactions (GET, POST, PUT, DELETE par [id])
│   │
│   ├── components/
│   │   ├── layout/             # Sidebar, BottomNav, ResponsiveLayout
│   │   ├── ui/                 # Composants visuels réutilisables
│   │   ├── widgets/            # TaxSimulator, BenchmarkChart
│   │   └── StockChart.tsx      # Graphiques interactifs
│   │
│   ├── hooks/                  # Hooks React métiers
│   │   ├── useDashboard.ts     # Données Dashboard (avec batch stock quotes)
│   │   ├── usePortfolio.ts     # Données Portefeuille (avec batch stock quotes)
│   │   └── useTransactions.ts  # Gestion des transactions & mutations
│   │
│   ├── lib/                    # Logique métier & utilitaires
│   │   ├── auth.ts             # Gestion des sessions & cookies auth
│   │   ├── calculations.ts     # Calculs financiers (PRU, plus-values, dividendes)
│   │   ├── data.ts             # Passerelle client vers les API routes internes
│   │   ├── dca-calculator.ts   # Simulateur DCA
│   │   ├── french-instruments.ts # Catalogue statique 150+ actifs PEA
│   │   ├── risk-metrics.ts     # Volatilité, Sharpe, Max Drawdown
│   │   ├── stocks.ts           # Client Yahoo Finance & cache mémoire
│   │   ├── supabase-server.ts  # ⭐ Client Supabase Admin côté serveur (service_role)
│   │   ├── technical-analysis.ts # Indicateurs techniques (RSI, MACD, Bollinger)
│   │   ├── types.ts            # Définitions TypeScript centralisées
│   │   ├── utils.ts            # Fonctions de formatage financier & dates
│   │   └── validation.ts       # ⭐ Sanitisation et validation stricte (TICKER_RE)
│   │
│   └── proxy.ts                # Protection des routes (Next.js 16)
│
├── tests/                      # Suite de tests unitaires (Vitest)
│   ├── auth.test.ts
│   ├── calculations.test.ts
│   ├── dca.test.ts
│   ├── risk-metrics.test.ts
│   ├── tax.test.ts
│   ├── technical-analysis.test.ts
│   └── validation.test.ts
│
├── vitest.config.ts            # Configuration des tests et seuils de couverture
├── vercel.json                 # Planification du cron quotidien
└── package.json
```

### 🧭 Guide d'orientation rapide

| Pour faire quoi ? | Consulter / Modifier |
|---|---|
| Ajouter un type de données | [types.ts](file:///Users/lgadrien/Desktop/Projets%20Perso/MyFinances/src/lib/types.ts) |
| Modifier la validation des tickers | [validation.ts](file:///Users/lgadrien/Desktop/Projets%20Perso/MyFinances/src/lib/validation.ts) |
| Modifier les calculs financiers (PRU, P&L) | [calculations.ts](file:///Users/lgadrien/Desktop/Projets%20Perso/MyFinances/src/lib/calculations.ts) |
| Modifier les appels de données côté client | [data.ts](file:///Users/lgadrien/Desktop/Projets%20Perso/MyFinances/src/lib/data.ts) |
| Modifier les endpoints sécurisés de base de données | [src/app/api/](file:///Users/lgadrien/Desktop/Projets%20Perso/MyFinances/src/app/api/) |
| Configurer le client Supabase serveur | [supabase-server.ts](file:///Users/lgadrien/Desktop/Projets%20Perso/MyFinances/src/lib/supabase-server.ts) |
| Schéma de base de données et RLS | [database/supabase-setup.sql](file:///Users/lgadrien/Desktop/Projets%20Perso/MyFinances/database/supabase-setup.sql) |

---

## ☁️ Déploiement sur Vercel

1. Poussez votre code sur GitHub :
   ```bash
   git push origin main
   ```
2. Importez le dépôt sur [vercel.com](https://vercel.com).
3. Renseignez les variables d'environnement dans **Settings → Environment Variables** :

| Clé | Environnement | Utilité |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview | URL de l'instance Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview | Clé publique Supabase (non utilisée pour les données) |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | Clé secrète d'administration serveur |
| `ACCESS_PASSWORD` | Production, Preview | Mot de passe pour déverrouiller l'application |
| `CRON_SECRET` | Production | Clé secrète autorisant le déclenchement du snapshot |

4. Déployez ! Le snapshot automatique quotidien s'exécutera chaque jour à minuit UTC grâce à la directive configurée dans `vercel.json`.

---

## 🔒 Sécurité & Robustesse

- **Isolation Zero-Anon & RLS stricte** : Aucune interaction directe navigateur ↔ Supabase. Toutes les requêtes en base transitent par les API Routes Next.js avec `SUPABASE_SERVICE_ROLE_KEY`.
- **Validation stricte des tickers** : Expression régulière stricte `^[A-Z0-9^.=-]{1,12}$` appliquée systématiquement sur `/api/stock`, `/api/stock/batch` et `/api/favorites` pour éliminer tout risque d'injection.
- **Protection anti-bruteforce** : Rate limiting en mémoire (5 tentatives par tranche de 15 minutes par IP) sur `/api/auth/login`.
- **Authentification par cookie HTTP-Only** : Protection contre les attaques XSS sur la session utilisateur.
- **Headers HTTP durcis** : Content Security Policy (CSP), X-Frame-Options, X-Content-Type-Options configurés dans `next.config.ts`.
- **Protection obligatoire du Cron** : L'endpoint `/api/cron/snapshot` rejette systématiquement les requêtes si `CRON_SECRET` n'est pas configuré (503 Service Misconfigured) ou si le Bearer token est absent/invalide (401 Unauthorized).
- **Assurance qualité & CI** : Pipeline GitHub Actions automatisé exécutant le linter, le contrôle de types TypeScript et la suite de tests Vitest avec couverture minimale garantie (> 80%).

---

## 📄 Licence

MIT — Projet personnel libre d'utilisation et d'adaptation.
