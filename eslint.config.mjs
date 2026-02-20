import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    rules: {
      // ── Code quality ──────────────────────────────────────────────────
      // Disallow console.log in production (warn so CI can flag it)
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // No unused variables (TS already catches this, but ESLint gives better DX)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // No explicit `any` — warn instead of error to not block build
      "@typescript-eslint/no-explicit-any": "warn",

      // ── Security / best-practices ─────────────────────────────────────
      // Prevent direct mutation of function params
      "no-param-reassign": ["warn", { props: false }],
      // Prefer const
      "prefer-const": "error",
      // Nullish coalescing over || for defaults
      "@typescript-eslint/prefer-nullish-coalescing": "off", // needs tsconfig exactOptionalPropertyTypes
      // No floating promises
      "@typescript-eslint/no-floating-promises": "off", // requires parserOptions.project

      // ── Accessibility ─────────────────────────────────────────────────
      // Require alt text on images
      "jsx-a11y/alt-text": "warn",
      // Require aria labels on interactive elements
      "jsx-a11y/aria-proptypes": "warn",
    },
  },
]);

export default eslintConfig;
