# Epic Timeline

A timeline/Gantt-style tracker for Marvel Epic Collection and DC Finest trade
paperback lines. Every collected volume sits on the years it actually covers,
so a character's run reads as a shape -- where it's complete, where it jumps,
and where nothing has been collected at all.

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

Then open the printed local URL. There's no backend to set up -- the app runs
on seed data compiled into the build and keeps everything you change in
`localStorage`.

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check the project references, then build to `dist/` |
| `npm run test` | Vitest, once |
| `npm run lint` | `tsc --noEmit`, then ESLint |

## The collections

Six tabs. Five ship with compiled data; the sixth starts empty on purpose.

| Tab | Lines | Volumes |
| --- | ---: | ---: |
| Epic Collection (Classic Marvel) | 45 | 386 |
| DC Finest | 45 | 100 |
| Modern Era | 28 | 96 |
| Licensed (Conan / Star Wars / Aliens) | 19 | 85 |
| Ultimate | 4 | 10 |
| Sandbox | -- | -- |

677 volumes in total. Nearly all carry a real-world release date, credits
split into writers/pencillers/inkers, and cover art.

**Sandbox** is a blank timeline you build yourself, for anything the other
five don't cover. Same editing as any other tab, plus its own configuration:
title, logo, fonts, colours, and optionally DC Finest-style eras or
Licensed-style swim lanes. Timelines built there can be saved to a named
library and switched between.

Every volume seeds as **Announced**, so a fresh install starts with an empty
shelf and the owned/unowned tile treatments all look alike. To see the app
with a real collection behind it, load `sample-data/ownership-overrides.json`
-- see [`sample-data/README.md`](sample-data/README.md).

## What it does

**Reading the timeline.** Lines are ordered by the character's real-world
debut, not by when their first volume was collected -- these lines release
non-linearly, so the two are often decades apart. Three zoom levels scale the
whole row together. Gaps mark stretches with nothing collected, and a
pre-debut filler marks time before the character existed at all. Licensed
lines can spread overlapping volumes across stacked swim lanes; DC Finest
volumes carry an era (Golden through Post-Crisis) that drives their badge,
their icon, and the era bar above the axis.

**Tracking a collection.** Each volume takes a shelf status (Announced,
Ordered, Shelved, Out of Print, Alt Format), a reading status, a half-star
rating, and your own notes -- all kept separate from the publisher blurb the
seed data ships.

**Finding things.** Search reads line names plus volume titles, credits,
issues collected and descriptions. The filter panel narrows by shelf status,
reading status, rating range and line tags, combined with Any or All. Both
trim the axis to just the matching years rather than leaving you to scroll to
them.

**Editing.** Any line or volume can be added, edited or deleted, including
dragging a tile's edges to re-date it. Covers and line icons can be uploaded,
pasted from the clipboard, and cropped. Edits are stored as overrides on top
of the seed data, so later data work still reaches the volumes you haven't
touched.

**Speculation Mode** (`S`) layers what-if lines and volumes over the real
ones without mixing the two -- for a run you think is coming, or one you'd
like to see. Speculative entries carry notes instead of ownership, and hiding
them never deletes them.

**Keyboard.** `/` search, `F` filters, `N` add a line, `1`-`6` jump to a tab,
`+`/`-` zoom, `S` Speculation Mode, `?` for the full cheat sheet.
Cmd/Ctrl+Enter submits an open form; Escape closes what's on top.

**The gear menu** holds Export and Import (JSON, with the import able to
restore any slice of a backup), Reset line data, Storage debug, the keyboard
cheat sheet, Updates, the Guide, and About.

## Your data

Everything you change lives in `localStorage` on that one browser: shelf
status, reading progress, ratings, notes, line and volume edits, speculative
content, and the Sandbox tab's configuration and saved timelines.

Nothing syncs. **Export** writes the lot to one JSON file and **Import**
reads it back, which is how you move between browsers or keep a backup --
both worth doing before clearing site data.

Writes are guarded, so a full quota degrades to a toast saying the change
won't survive a reload, rather than taking the app down. Storage debug shows
what's using space and how much headroom is left.

## Known gaps

- **No backend.** Per-device by design today; export/import is the migration
  path. A hosted database plus auth would be the step to take if this ever
  needs to sync on its own -- nothing is wired up for one, so that's a clean
  decision rather than a half-built one.
- **"Uncollected" gaps look like publication gaps.** The distinction exists
  in the data (`gapType`), but both render the same dashed placeholder. The
  "nothing coming, ever" case has a finished design; "waiting for a volume"
  doesn't.
- **Credits are uneven.** Volumes rebuilt from issue-by-issue research have a
  true penciller/inker split; the rest still carry a combined credit parked
  in `pencillers`, so an empty `inkers` means "not researched yet" rather
  than "nobody inked it". `docs/` tracks the outstanding research.
- **Some line colours are still placeholders.** Search
  `TODO verify against trade dress` in `src/data/`.

## Stack

Vite + React + TypeScript + Tailwind CSS. No runtime dependencies beyond
React itself; tests run on Vitest. Deployed to GitHub Pages by
`.github/workflows/deploy.yml`, which gates the deploy on lint, tests and a
clean build.

See [CLAUDE.md](CLAUDE.md) for the one repo convention that isn't obvious
from the code: keeping the in-app changelog current.
