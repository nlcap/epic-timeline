# Epic Timeline

A timeline/Gantt-style tracker for Marvel Epic Collection and DC Finest trade
paperback lines.

## Disclaimer

Epic Timeline is an unofficial, non-commercial fan project. It is not
affiliated with, endorsed by, or sponsored by Marvel Entertainment, DC
Comics, or their respective parent companies. All character names,
titles, cover art, and related content referenced in this app are
trademarks and copyrights of their respective owners, used here for
reference and cataloging purposes only.

The original source code, UI, and application design in this repository
are licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE) --
free to use, study, and modify for personal and other noncommercial
purposes, but not for commercial use. See [LICENSE](LICENSE) for the full
terms and for how that license relates to the third-party comic content
the app displays.

## Setup

```bash
npm install
npm run dev
```

Then open the printed local URL. No Supabase project is required to try it
out -- the app runs on local seed data and stores your ownership-status
changes in `localStorage` until a backend is wired up.

Every volume seeds as "announced", so a fresh install starts with an empty
shelf. To see the timeline with a collection behind it, load
`sample-data/ownership-overrides.json` -- see `sample-data/README.md` for the
one-liner.

To connect Supabase later: create a project, copy `.env.example` to
`.env.local`, fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, and
replace the `TODO`s in `src/hooks/useOwnership.ts` with real reads/writes
against a `volume_ownership` table.

## What's here right now

- **"Marvel Ultimate Line" tab** -- fully seeded from the reference timeline
  image: Ultimate Spider-Man, Ultimate X-Men, The Ultimates, Ultimate
  Fantastic Four, including the real publication gap in The Ultimates.
- **"Classic Marvel Epic Collection" tab** -- a couple of Fantastic Four
  volumes seeded from the detail-panel reference image, mainly to prove more
  than one collection/line works end to end.
- The other three tabs (Modern Era, DC Finest, Licensed) render an empty
  state -- same situation as the Amazing Spider-Man Epic Collection pilot
  spreadsheet: the data needs to be compiled before it can be seeded here.

## Known gaps / next decisions

- **Colors are placeholders except Fantastic Four's `#00ADEF`.** Search
  `TODO verify against trade dress` in `src/data/` for the rest.
- **"Uncollected" gap treatment is a plain dashed placeholder.** The
  "publication" gap (nothing coming, ever) uses the confirmed fade-gradient
  design; the "waiting for a volume" gap still needs a real visual.
- **Cover images aren't wired up** -- the detail panel shows a gray
  placeholder box. Needs a source for cover art (upload, or a covers API).
- **No real backend yet.** Ownership status persists locally in your
  browser only, per-device. Supabase auth + a real `volume_ownership` table
  is the next step once you want status to sync across devices.

## Stack

Vite + React + TypeScript + Tailwind CSS, with `@supabase/supabase-js`
installed but idle until env vars are set.

## A note on this environment

This project was hand-scaffolded (not run through `npm create vite`) because
the sandbox this was built in has no access to the npm registry. It hasn't
been through an actual `npm install && npm run build` yet -- do that first
thing after downloading, and let me know what errors (if any) come up so we
can fix them together.
