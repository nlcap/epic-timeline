import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // Hand-picked rather than spreading eslint-plugin-react-hooks'
      // `configs.recommended` -- v7+ of that plugin bundles a much larger
      // React Compiler-oriented rule set (purity/immutability/set-state-in-
      // effect/etc) alongside these two, aimed at codebases opted into the
      // compiler. This app isn't, and that bundle is a much bigger,
      // separate decision than "catch stale hook dependencies," so it's
      // deliberately left out here -- just the two classic rules.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // This codebase deliberately keeps unused function params/locals
      // (see tsconfig's noUnusedLocals/noUnusedParameters: false, e.g. for
      // documenting a callback's full signature even when a param isn't
      // used) -- narrowed to only flag genuinely orphaned bindings instead
      // of matching tsconfig's fully-off stance.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  }
);
