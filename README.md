# MyFinances - PEA Stock Tracker 🚀

Application moderne de suivi de portefeuille PEA, conçue pour être performante et esthétique.

## Fonctionnalités Principales

- **Dashboard Complet** : Vue d'ensemble de la performance (PV/MV, Dividendes, Capital).
- **Suivi de Marché** : Cours en temps réel via Yahoo Finance (gratuit & illimité).
- **Recherche Dynamique** : Ajoutez n'importe quelle action (Actions, ETF, Indices) à votre liste.
- **Favoris Persistants** : Vos actions favorites sont sauvegardées dans une base de données Supabase.
- **Historique des Transactions** : Importez et suivez vos achats/ventes/dividendes.
- **Charts Interactifs** : Graphiques financiers (1J, 5J, 1M, YTD, 1A).

---

## 🛠️ Pré-requis

- **Node.js** (v18+)
- Compte **Supabase** (gratuit) pour la base de données.

---

## 🚀 Installation & Configuration

### 1. Cloner le projet

```bash
git clone <votre-repo-url>
cd myfinances-pea
npm install
```

### 2. Configurer les variables d'environnement

Copiez le fichier d'exemple pour créer votre configuration locale :

```bash
cp .env.example .env.local
```

Ouvrez `.env.local` et remplissez les clés Supabase :

```env
# Supabase (Obligatoire pour les Favs & Transactions)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon-publique

# Alpha Vantage (Optionnel - Backup API)
ALPHA_VANTAGE_KEY=votre-cle-api
```

> **Note**: Yahoo Finance est utilisé par défaut pour les prix en temps réel et ne nécessite pas de clé API.

### 3. Initialiser la Base de Données (Supabase)

Allez dans votre dashboard Supabase > **SQL Editor** et exécutez les scripts suivants (dans l'ordre) :

1.  **Créer les tables (Transactions, Assets)** :
    - Ouvrez et copiez le contenu de `supabase-schema.sql`.
    - Exécutez-le.

2.  **Activer les Favoris (Table simplifiée)** :
    - Ouvrez et copiez le contenu de `supabase-favorites.sql`.
    - Exécutez-le.

3.  **(Optionnel) Importer vos transactions** :
    - Si vous avez des transactions à importer, utilisez le modèle `import-transactions.sql`.

### 4. Lancer l'application

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

---

## 📦 Structure du Projet

- `src/app` : Pages Next.js (Router).
- `src/components` : Composants UI réutilisables.
- `src/lib` : Utilitaires (API calls, calculs financiers).
- `src/app/api` : Routes API backend (Proxy vers Yahoo Finance).

## 🛡️ Technologies

- **Framework** : Next.js 14+ (App Router)
- **Langage** : TypeScript
- **Style** : Tailwind CSS + Lucide React
- **Base de données** : Supabase (PostgreSQL)
- **Data** : Yahoo Finance API (via `yahoo-finance2` ou proxy custom)

---

## 📄 Licence

MIT
