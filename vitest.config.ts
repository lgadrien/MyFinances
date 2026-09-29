import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      // Reporters : terminal + JSON pour CI + HTML pour consultation locale
      reporter: ["text", "json", "json-summary", "html"],
      reportsDirectory: "./coverage",
      // Inclure uniquement le code source métier
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        // Pages et composants UI (nécessitent un environnement browser complet)
        "src/app/**",
        "src/components/**",
        // Hooks React (dépendent du DOM / contexte React — testables via @testing-library)
        "src/hooks/**",
        // Middleware Next.js (Edge runtime)
        "src/middleware.ts",
        // Fichiers de config / types purs / données statiques
        "src/lib/types.ts",
        "src/lib/french-instruments.ts",
        "src/lib/supabase.ts",
        // Couche data (requêtes Supabase — nécessitent un mock DB)
        "src/lib/data.ts",
        // Stores Zustand (état UI)
        "src/stores/**",
        // PDF generation (dépend de jsPDF, difficile à tester unitairement)
        "src/lib/pdf-report.ts",
        // Utilitaires UI (formatters avec hooks Zustand)
        "src/lib/utils.tsx",
      ],
      // Seuils sur le périmètre logique métier pur (calculations, risk, technical-analysis, etc.)
      // Ces seuils servent de filet de régression — ils échouent le CI si la couverture chute.
      // À augmenter progressivement au fil de l'ajout de tests.
      thresholds: {
        lines: 80,
        functions: 78,
        branches: 55,
        statements: 78,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
