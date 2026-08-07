import { execFileSync } from "node:child_process";
import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";

// Collection id -> its seed data file, relative to the repo root. Kept in
// sync by hand with data/collectionData.ts's own mapping -- there's no
// single source of truth shared between the two since one lives in app
// code and the other in build tooling.
const SEED_DATA_FILES: Record<string, string> = {
  "classic-marvel-epic": "src/data/classic-marvel-epic.ts",
  "dc-finest": "src/data/dc-finest.ts",
  "modern-marvel-epic": "src/data/modern-marvel-epic.ts",
  ultimate: "src/data/ultimate-era.ts",
  "marvel-licensed-epic": "src/data/marvel-licensed-epic.ts",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** ISO "YYYY-MM-DD" -> "Month D, YYYY" -- done by hand in JS rather than
 * via git's own `--date=format:` strftime flags (e.g. the no-leading-zero
 * day, `%-d`) so this doesn't depend on which strftime flavor the git
 * binary running it happens to link against. */
function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

/** When each seed data file was last touched by a commit, per git history --
 * `git log -1 --follow`, one process per file. Returns null for a file with
 * no git history to find (shallow clone, not tracked yet, git unavailable)
 * rather than throwing, so a lookup failure just means that collection's
 * "Last updated" subtitle doesn't render instead of breaking the build. */
function lastUpdatedDates(): Record<string, string | null> {
  const dates: Record<string, string | null> = {};
  for (const [collectionId, file] of Object.entries(SEED_DATA_FILES)) {
    try {
      const iso = execFileSync(
        "git",
        ["log", "-1", "--follow", "--format=%ad", "--date=format:%Y-%m-%d", "--", file],
        { encoding: "utf-8" }
      ).trim();
      dates[collectionId] = iso ? formatDate(iso) : null;
    } catch {
      dates[collectionId] = null;
    }
  }
  return dates;
}

const VIRTUAL_MODULE_ID = "virtual:collection-updated-at";
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;

/**
 * Exposes lastUpdatedDates() as an importable module (see
 * src/lib/collectionUpdatedAt.ts, and src/vite-env.d.ts for the type this
 * needs since TS can't see inside a virtual module on its own) instead of
 * a hand-maintained date map that silently goes stale the next time
 * someone edits a seed data file and forgets to bump it.
 *
 * Runs once at server-start / build-start, not per-request or on file
 * change -- these dates only change when a *commit* touches a seed file,
 * which a dev server restart or a fresh CI build already both naturally
 * happen around. In CI specifically, this needs actions/checkout's default
 * shallow (fetch-depth: 1) clone overridden to full history (fetch-depth:
 * 0) in .github/workflows/deploy.yml, or `git log --follow` has nothing to
 * search and every date comes back null.
 */
function collectionUpdatedAtPlugin(): Plugin {
  return {
    name: "collection-updated-at",
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID;
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_MODULE_ID) return;
      return `export const COLLECTION_DATA_UPDATED_AT = ${JSON.stringify(lastUpdatedDates())};`;
    },
  };
}

// GitHub Pages serves a project site (not a user/org root site) at
// https://<user>.github.io/<repo>/, so built asset URLs need that repo name
// as a base path or they resolve against the domain root and 404. Only
// applied for the GitHub Actions build (see .github/workflows/deploy.yml,
// which sets GITHUB_PAGES=true) -- local dev and `vite preview` keep the
// root path. If the repo is ever renamed, update the string below to match.
export default defineConfig({
  base: process.env.GITHUB_PAGES ? "/epic-timeline/" : "/",
  plugins: [react(), collectionUpdatedAtPlugin()],
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
