import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// GitHub Pages serves a project site (not a user/org root site) at
// https://<user>.github.io/<repo>/, so built asset URLs need that repo name
// as a base path or they resolve against the domain root and 404. Only
// applied for the GitHub Actions build (see .github/workflows/deploy.yml,
// which sets GITHUB_PAGES=true) -- local dev and `vite preview` keep the
// root path. If the repo is ever renamed, update the string below to match.
export default defineConfig({
  base: process.env.GITHUB_PAGES ? "/epic-timeline/" : "/",
  plugins: [react()],
  server: {
    port: Number(process.env.PORT) || 5173,
  },
  // `defineConfig` comes from "vitest/config" (a superset of Vite's own)
  // instead of "vite" specifically so this `test` block type-checks --
  // plain Vite's UserConfig type doesn't know about it. Node environment,
  // not jsdom: today's tests are all pure src/lib functions, not component
  // rendering, so there's no DOM to simulate.
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
