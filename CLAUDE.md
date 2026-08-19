# Working in this repo

## Keep the Updates page current

The app has a public-facing changelog (`src/data/updates.ts`, rendered by
`src/components/UpdatesModal.tsx`, reachable from the gear-icon settings
menu). **After committing a change that ships a new, significant,
user-facing feature, add an entry for it** at the top of the `UPDATES`
array in `src/data/updates.ts` (newest release first -- `updates.test.ts`
enforces the ordering). Match the existing entries' voice: a short title, a
description written for a reader who never saw the commit message, kept to
1-2 sentences -- the headline fact and the one detail that makes it
concrete, not the full story from the commit.

`kind: "new"` vs `kind: "data"` is worth getting right, not just picking
whichever sounds bigger. `new` is a capability the app didn't have before
-- a control, a field, a way to see or do something that wasn't possible
last release. `data` is that same capability applied to more or better
content -- researching, correcting or backfilling the records behind a
field that already existed, no matter how large the effort (a big credit
rebuild, a source migration, a correction pass across hundreds of
records). Size doesn't move an entry from `data` to `new`; only "did this
add a capability" does. When one commit does both -- adds a field *and*
backfills it -- tag it `new` for the capability, and only split out a
separate `data` entry if the backfill itself is a second, independently
newsworthy effort.

**Don't add an entry for**, since the modal filters these out of the public
view on purpose (see `HIDDEN_KINDS` in `UpdatesModal.tsx`):

- Bug fixes (`kind: "fixed"`)
- Refactors, tests, tooling, CI, dead-code removal -- anything with no
  visible surface (`kind: "internal"`)
- Small visual polish/spacing/copy tweaks that aren't a feature in their
  own right (`kind: "improved"`)

If you do want the full record for one of these anyway (it's sometimes
useful to keep an internal history even though the public page hides it),
it's fine to add the entry with the appropriate kind -- it just won't
render. Don't invent a new kind to work around the filter; the point is
that these categories are meant to stay off the public page.

**If the feature is one slice of a still-running multi-day effort**
(the DC Finest/Licensed credit research is the running example -- see the
`inProgress` entries already in the file), mark the new entry
`inProgress: true` rather than reporting it piecemeal. Once that effort
wraps, replace all of its `inProgress` entries with a single consolidated
entry telling the whole story, and drop the flag.

When in doubt about whether something is "significant" enough to report:
would a reader of this app -- not someone reading the git log -- want to
know about it? A new filter, a new data field surfaced in the UI, a new
collection/line, a meaningfully expanded search/export capability: yes. A
component extraction, a perf fix with no visible symptom, a typo fix: no.
