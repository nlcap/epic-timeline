/**
 * The app's changelog, newest first.
 *
 * Written by hand rather than generated from `git log`: a commit is a unit
 * of work, not a unit of news. A day's worth of them often adds up to one
 * thing worth telling a reader about (the four dedupe commits on 15 August
 * are one "four dedupes" entry), while a single commit can carry two
 * unrelated ones (63cd5b0 landed export/import *and* pinned the Add Line
 * button). The commit messages are still the source — this is a reading of
 * them, not a replacement.
 *
 * Descriptions are kept to 1-2 sentences -- the headline fact and the one
 * detail that makes it concrete, not the full story from the commit.
 *
 * Ordering is enforced by a test rather than by care: see updates.test.ts.
 */

/** What kind of change an entry is, which decides its badge. Deliberately
 * coarse — five kinds a reader can scan, not a taxonomy. `internal` covers
 * refactors, tests and tooling: things with no visible surface, kept in
 * because "why did nothing change this week" is a fair question.
 *
 * `new` vs `data` is the one pair worth getting right: `new` is a
 * capability the app didn't have before -- a control, a field, a way to
 * see or do something that wasn't possible last release (adding
 * writers/artists to the volume model, splitting credits into pencillers
 * and inkers). `data` is that same capability applied to more or better
 * content -- researching, correcting or backfilling the records behind a
 * field that already existed, no matter how large the effort (rebuilding
 * DC Finest's credits, fixing 43 titles). A big data effort doesn't
 * become `new` for being big. */
export type UpdateKind = "new" | "improved" | "fixed" | "data" | "internal";

export interface UpdateEntry {
  kind: UpdateKind;
  title: string;
  description: string;
  /** True for a day's slice of a multi-day effort that hasn't wrapped up
   * yet — e.g. the DC Finest/Licensed credit research, which lands a few
   * volumes at a time across many commits. The public page (see
   * UpdatesModal) hides these individually rather than reporting the same
   * project in installments; once the effort is done, replace its
   * `inProgress` entries with one consolidated entry telling the whole
   * story and drop the flag. The record stays complete either way — this
   * only controls what's shown, not what's kept. */
  inProgress?: boolean;
}

export interface UpdateRelease {
  /** ISO `yyyy-mm-dd`, matching the commit date it was drawn from. Parsed
   * field-by-field for display (see formatUpdateDate) rather than through
   * `new Date(iso)`, which reads a bare date string as UTC midnight and so
   * renders as the day before anywhere west of Greenwich. */
  date: string;
  entries: UpdateEntry[];
}

export const UPDATE_KIND_META: Record<UpdateKind, { label: string; className: string }> = {
  new: { label: "New", className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" },
  improved: { label: "Improved", className: "border-sky-500/40 bg-sky-500/10 text-sky-300" },
  fixed: { label: "Fixed", className: "border-amber-500/40 bg-amber-500/10 text-amber-300" },
  data: { label: "Data", className: "border-violet-500/40 bg-violet-500/10 text-violet-300" },
  internal: { label: "Under the hood", className: "border-neutral-600 bg-neutral-800 text-neutral-400" },
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2026-08-18" -> "18 August 2026". */
export function formatUpdateDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

export const UPDATES: UpdateRelease[] = [
  {
    date: "2026-08-31",
    entries: [
      {
        kind: "new",
        title: "Save and load named Sandbox timelines",
        description:
          "Configure's new Saved sandboxes picker lets you save the tab's current lines, volumes and appearance under a name, switch to another one you've already saved, or start a blank timeline -- so the one Sandbox tab can hold as many alternate builds as you want, one loaded at a time.",
      },
    ],
  },
  {
    date: "2026-08-28",
    entries: [
      {
        kind: "new",
        title: "Export and import now carry the Sandbox tab's setup",
        description:
          "Its title, colors, logo, font and era definitions travel with the file, so restoring on another browser brings back the tab as you built it rather than just the lines inside it. Files exported before this still import fine -- they simply don't carry it.",
      },
    ],
  },
  {
    date: "2026-08-27",
    entries: [
      {
        kind: "new",
        title: "Configure the Custom tab's own title, color, and logo",
        description:
          "A gear icon on the Custom tab's masthead opens a form to set its own title, rule color, and logo image -- each falls back to the default whenever you leave it blank.",
      },
      {
        kind: "new",
        title: "Bring DC Finest's eras and Licensed's swim lanes to the Custom tab",
        description:
          "The same Configure form now has two independent switches -- Eras (your own named eras, each with a color and start year, plus per-era line icons and era-relative volume numbers) and Swim lanes (stack a line's volumes across overlapping lanes) -- and they can both be on at once.",
      },
      {
        kind: "new",
        title: "Pick a font and weight for the Custom tab's title",
        description:
          "Configure now has a Font and Weight picker with a live preview -- a dozen Google Fonts from clean sans faces to comic-style display type, each showing its own weight options since not every font ships the same range.",
      },
      {
        kind: "improved",
        title: "Renamed the Custom tab to Sandbox",
        description: "Same tab, same data -- just a new name in the nav.",
      },
      {
        kind: "new",
        title: "Opacity sliders for the Sandbox tab's title, rule, and era colors",
        description:
          "Three independent 0-100% dials in Configure -- Title opacity, Rule opacity, and one Era color opacity that applies to every defined era at once, not per era.",
      },
    ],
  },
  {
    date: "2026-08-26",
    entries: [
      {
        kind: "new",
        title: "A Custom tab for timelines of your own",
        description:
          "A new Custom tab starts out completely blank -- add any lines and volumes you want, outside Epic Collections or DC Finest, with the same editing, zoom, and Speculation Mode as every other tab.",
      },
    ],
  },
  {
    date: "2026-08-24",
    entries: [
      {
        kind: "new",
        title: "A guided tour for first-time visitors, and a reference guide for anyone",
        description:
          "A new visitor now gets a short welcome and an optional guided tour pointing out the nav, search, Speculation Mode, zoom, and Add Line, before a few notes on what isn't visible on screen. The tour and a more detailed reference guide are both available anytime from Settings -> Guide.",
      },
      {
        kind: "new",
        title: "A Notes field for your own thoughts on a volume",
        description:
          "Every volume can now hold a private note, kept separate from its publisher description -- shown in its own section of the detail panel and editable from the volume's edit form, right under Description.",
      },
      {
        kind: "new",
        title: "Rate your volumes with stars",
        description:
          "Sweep across the five-star row under a volume's cover to rate it in half-star steps -- no confirmation needed, and clicking your current rating again clears it. A smaller read-only version shows on the hover-preview card too, once you've rated something.",
      },
      {
        kind: "new",
        title: "Filter the timeline by star rating",
        description:
          "The Filters panel now has a two-handle star rating slider, half-star steps from 0 to 5, alongside shelving and reading status. Narrowing it hides unrated volumes too, the same way an unset reading status already does.",
      },
    ],
  },
  {
    date: "2026-08-23",
    entries: [
      {
        kind: "new",
        title: "A warning before losing unsaved edits",
        description:
          "Closing an edit form with unsaved changes -- clicking outside it, Esc, or the X -- now asks whether to save or discard instead of silently dropping them. S saves, D or C discards. The explicit Cancel button still discards immediately, since clicking it is already a deliberate choice.",
      },
      {
        kind: "improved",
        title: "Filters apply as you check them",
        description:
          "The Filters panel no longer needs an Apply click -- checking a box re-filters the timeline immediately, and closing the panel never has anything left to discard.",
      },
    ],
  },
  {
    date: "2026-08-20",
    entries: [
      {
        kind: "new",
        title: "Canceling an edit returns to the volume, not the timeline",
        description:
          "Cancel, the X, or Esc while editing a volume now lands back on that volume's own detail view instead of closing the whole panel. Adding a brand-new volume, or editing a gap or note (neither has a detail view to return to), still closes all the way out.",
      },
      {
        kind: "new",
        title: "Keyboard shortcuts for the shelving and reading pickers",
        description:
          "With a volume's panel open, S opens the shelving picker and R opens the reading picker -- arrow keys move through the list, Enter picks one, and pressing S or R again closes back out to the panel.",
      },
      {
        kind: "new",
        title: "Space pages through a long volume's details",
        description:
          "With a volume's panel open, Space scrolls down about half a screen at a time -- handy for a volume with a long description or a big credits list -- and wraps back to the top once you reach the end.",
      },
      {
        kind: "new",
        title: "Step through the timeline without leaving the volume panel",
        description:
          "Chevrons beside the cover -- or the arrow keys, or , and . -- move to the next or previous volume on that line, scrolling the timeline behind the panel the same way the sidebar's own stepper does, but keeping the panel open on wherever you land. Up and down arrows jump to the nearest volume on the line above or below instead.",
      },
    ],
  },
  {
    date: "2026-08-19",
    entries: [
      {
        kind: "data",
        title: "The Classic Epic Collection's issue lists are rebuilt from Wikipedia",
        description:
          "All 386 volumes' \"Collects\" field now matches the Marvel Epic Collection Wikipedia page directly, replacing years of inconsistent formatting. Six volumes with no issue list at all -- including both missing Punisher and Fantastic Four entries -- are filled in for the first time.",
      },
      {
        kind: "new",
        title: "Stepping to a volume pops its preview",
        description:
          "The next/previous chevrons on a line now open the volume's cover preview the instant you click, rather than once the timeline finishes gliding there — the same card hovering gives you, lined up with the volume's start. It clears itself after a few seconds, or the moment you step again or hover something else.",
      },
      {
        kind: "data",
        title: "Every collection is credited from the issues themselves",
        description:
          "571 volumes across the four Marvel collections now list writers, pencillers and inkers read from the issues each book collects, joining DC Finest to cover 671 of the 677 volumes on the shelf. Rom Vol. 5 alone credits eleven inkers where it previously named none.",
      },
      {
        kind: "new",
        title: "Reset can be scoped to just metadata or just your shelf",
        description:
          "Reset line data now asks what to wipe — Volume metadata, Shelving & reading status, or Both — so undoing a title correction no longer means losing every Owned/Wishlist and reading-progress mark on that collection too.",
      },
    ],
  },
  {
    date: "2026-08-18",
    entries: [
      {
        kind: "new",
        title: "Pencillers and inkers are credited separately",
        description:
          "A volume can now say who drew it and who inked it, instead of folding both into one list. Where the two match — every Golden Age book — it still collapses back to a single \"Art by\" line.",
      },
      {
        kind: "data",
        title: "Every DC Finest volume is credited from the issues themselves",
        description:
          "All 100 volumes now carry credits built by reading the issues they collect, story by story, against the DC Database — 2,365 credits naming 682 people, replacing the abbreviated marketing copy the seed data shipped with. Anthology and reprint issues are filtered to the stories actually collected, and duplicate name spellings are settled to one consistent form.",
      },
      {
        kind: "internal",
        title: "The open credit questions are written down",
        description:
          "A new gaps document collects what's still unresolved — sources with no usable wiki page, ambiguous credits, and judgment calls worth a second opinion.",
      },
    ],
  },
  {
    date: "2026-08-17",
    entries: [
      {
        kind: "new",
        title: "Export and import can move one slice of your data",
        description:
          "Export, import and reset now share one checklist across collection, timeline layer and data type, so you can move just one slice of your data instead of all of it. On upload, the picker is built from the file itself and shows per-slice record counts.",
      },
      {
        kind: "improved",
        title: "Credit labels read as labels",
        description:
          "\"Written by\" and \"Art by\" are now bolded and spaced apart instead of running into the names after them.",
      },
    ],
  },
  {
    date: "2026-08-16",
    entries: [
      {
        kind: "new",
        title: "Search looks inside volumes, not just line names",
        description:
          "The nav search box now also matches a volume's title, writers, artists, issues collected and description. Speculative entries are searchable too when Speculation Mode is on.",
      },
      {
        kind: "new",
        title: "Release dates, writers and artists on every volume",
        description:
          "New fields on the volume model, backfilled from Wikipedia: release dates on 675 of 677 volumes, writers on 617, artists on 616. A date still in the future reads \"Releases\" rather than \"Released\".",
      },
      {
        kind: "data",
        title: "43 volume titles corrected and the Punisher renumbered",
        description:
          "43 volume titles corrected against Wikipedia, mostly misspellings plus a few outright wrong ones — Amazing Spider-Man Vol. 1 had a Moon Knight title pasted onto it. The Punisher's issue lists were also shifted back into their correct volumes.",
      },
      {
        kind: "improved",
        title: "The volume panel is washed in its own cover",
        description:
          "The volume panel now shows a blown-up, blurred wash of its own cover behind the real one, product-page style.",
      },
      {
        kind: "data",
        title: "A fresh install starts with an empty shelf",
        description:
          "All 677 volumes now seed as \"announced\" instead of shipping one person's real shelving to every install. Existing tracking is untouched, and the old collection lives on as an anonymous sample dataset.",
      },
      {
        kind: "fixed",
        title: "Gaps step aside while a filter is on",
        description:
          "A gap no longer claims a hole exists across volumes that a search or filter has simply hidden.",
      },
      {
        kind: "fixed",
        title: "The Tags filter section stays when a timeline has no tags",
        description:
          "The Tags section now stays visible with an empty state instead of disappearing when nothing's tagged yet.",
      },
      {
        kind: "data",
        title: "Cover and content fixes",
        description:
          "Filled in the two missing John Byrne Fantastic Four volumes, fixed a wrong Silver Surfer cover, and corrected a Namor title's capitalization.",
      },
    ],
  },
  {
    date: "2026-08-15",
    entries: [
      {
        kind: "new",
        title: "Keyboard shortcuts",
        description:
          "App-wide bare-key shortcuts — \"/\" for search, \"f\" for filters, \"n\" to add a line, \"1\"-\"5\" to jump collections, and more — that stand down while typing in a text field. \"?\" opens a cheat sheet of the full list.",
      },
      {
        kind: "new",
        title: "A filter panel for shelving and reading status",
        description:
          "A slide-out filter panel narrows the timeline by shelving and reading status, draft-then-apply like the other drawers. A blue dot on the filter icon shows when a filter is active.",
      },
      {
        kind: "new",
        title: "Tags on lines",
        description:
          "Lines can now carry tags, with autocomplete, shared as one pool across every collection. The filter panel gets a matching Tags section for the current collection.",
      },
      {
        kind: "new",
        title: "Reading status alongside shelving status",
        description:
          "A per-volume reading status — Not Started, Reading, Finished, Paused, Dropped — sits next to the existing shelving picker.",
      },
      {
        kind: "new",
        title: "Any/All match mode in the filter panel",
        description:
          "Filters can now require all selected criteria to match instead of just any; switching modes clears your current picks.",
      },
      {
        kind: "fixed",
        title: "Three filter and shortcut bugs",
        description:
          "Fixed shortcuts firing through open dialogs, speculative lines disappearing under status filters, and settings dialogs not closing on Escape.",
      },
      {
        kind: "internal",
        title: "The filter rules moved out of App.tsx, with tests",
        description:
          "Extracted ~70 lines of inline filter logic out of App.tsx into tested, standalone functions.",
      },
      {
        kind: "internal",
        title: "Four dedupes",
        description:
          "Four internal cleanups — the shortcut cheat sheet, settings menu items, filter facets, and the ownership/reading-status hooks — each collapsed from two copies into one.",
      },
    ],
  },
  {
    date: "2026-08-10",
    entries: [
      {
        kind: "data",
        title: "DC Finest corrections baked in, five new lines",
        description:
          "Merged ~70 volumes' worth of local corrections into the shipped seed data, and added five new lines — Hitman, Romance, The Atom, The Question and Warlord.",
      },
      {
        kind: "new",
        title: "Deleting a cover or icon asks first",
        description:
          "Deleting a cover or line icon now requires a confirmation step instead of removing it on the first click.",
      },
      {
        kind: "improved",
        title: "Bundle down from 3.45MB to ~730KB",
        description:
          "Converted a handful of inline base64 images left over from an earlier data pass into real asset files.",
      },
      {
        kind: "improved",
        title: "Issues collected is a textarea",
        description: "Switched to a textarea instead of a single-line input, since entries often run long.",
      },
      {
        kind: "internal",
        title: "Three shared shells extracted",
        description:
          "Three duplicated UI patterns — settings dialogs, tile hover previews, and the era bar's scroll handler — were consolidated into shared implementations.",
      },
    ],
  },
  {
    date: "2026-08-09",
    entries: [
      {
        kind: "new",
        title: "Speculative Notes",
        description:
          "Speculative volumes can now be added as a lightweight Note instead of a full gap, rendering as a distinct square-cornered tile.",
      },
      {
        kind: "new",
        title: "A volume stepper on the sidebar line icons",
        description:
          "Chevrons on a line's collapsed sidebar icon step the timeline through its volumes one at a time, without opening the drawer.",
      },
      {
        kind: "improved",
        title: "The Add Line button restyled",
        description:
          "A translucent, blurred background and a pill shape when collapsed, expanding to fit its own label on hover.",
      },
    ],
  },
  {
    date: "2026-08-07",
    entries: [
      {
        kind: "new",
        title: "Paste a cover or icon straight from the clipboard",
        description:
          "Pasting an image into the volume or line drawer now fills in the cover or icon directly, with an era picker for DC Finest's per-era icon slots.",
      },
      {
        kind: "new",
        title: "The active collection tab survives a refresh",
        description:
          "The active collection tab is now remembered across refreshes instead of always resetting to the first one.",
      },
      {
        kind: "new",
        title: "The reset dialog shows how fresh each collection's data is",
        description:
          "The reset dialog now shows a \"Last updated\" date per collection, computed from git history, so you know how current the seed data is before wiping to it.",
      },
      {
        kind: "improved",
        title: "Two panel refinements",
        description:
          "The nav search box stays transparent until focused, and volume descriptions now render as real paragraphs with proper spacing.",
      },
    ],
  },
  {
    date: "2026-08-05",
    entries: [
      {
        kind: "improved",
        title: "The year axis trims to what's on screen",
        description:
          "Searching now scopes the year axis to just the matching lines' range and resets scroll to the start, cutting down on scrolling to reach a result.",
      },
    ],
  },
  {
    date: "2026-08-04",
    entries: [
      {
        kind: "new",
        title: "Swim lanes, and the Licensed collection",
        description:
          "Licensed lines can stack up to five swim lanes so overlapping volumes render side by side, launching alongside real data for Conan, Star Wars, Planet of the Apes and more — 19 lines and 85 volumes.",
      },
      {
        kind: "new",
        title: "A search box in the nav",
        description:
          "A first search box in the nav narrows visible lines by title, on both desktop and mobile.",
      },
      {
        kind: "new",
        title: "A localStorage debug panel",
        description:
          "A new settings-menu panel shows per-key and total localStorage usage, for diagnosing quota issues.",
      },
      {
        kind: "data",
        title: "Covers moved to a faster CDN, 29 more filled in",
        description:
          "All 255 cover images moved from Penguin Random House to Amazon's faster CDN, and 29 previously uncovered volumes were filled in.",
      },
      {
        kind: "internal",
        title: "Tests, linting, and a gated deploy",
        description:
          "Added Vitest coverage for the timeline math and filtering logic, ESLint, and gated the CI deploy on both passing.",
      },
      {
        kind: "internal",
        title: "Override stores share one implementation",
        description:
          "The four line/volume override hooks now share one implementation instead of four copies of the same load/persist logic.",
      },
    ],
  },
  {
    date: "2026-08-03",
    entries: [
      {
        kind: "fixed",
        title: "Uploaded covers are compressed, and a failed save can't take the app down",
        description:
          "Uploaded covers are now compressed before storage, and a failed localStorage write surfaces a toast instead of crashing the app.",
      },
    ],
  },
  {
    date: "2026-08-02",
    entries: [
      {
        kind: "fixed",
        title: "Safari sizing on the debut month and shelf status dropdowns",
        description:
          "Fixed two dropdowns rendering at the wrong size in Safari by drawing their own chevron instead of relying on native select styling.",
      },
      {
        kind: "improved",
        title: "Padding around the volume tile cover image",
        description: "Added padding around the cover image instead of letting it sit flush against the tile's edge.",
      },
    ],
  },
  {
    date: "2026-08-01",
    entries: [
      {
        kind: "new",
        title: "Data export and import",
        description:
          "Export your corrections and additions as JSON — copy or download — and re-import a previous export, including Speculation Mode data.",
      },
      {
        kind: "new",
        title: "Reset line data",
        description:
          "A new Reset line data option wipes local overrides back to the shipped seed data, scoped to any combination of collections and timeline layers.",
      },
      {
        kind: "new",
        title: "A gear-icon settings menu",
        description: "A gear-icon settings menu replaces the old disabled account avatar in the nav.",
      },
      {
        kind: "fixed",
        title: "Two Safari bugs",
        description:
          "Fixed a stuck hover state on Add Volume cells and chunky Retina rendering on the banner logos, both Safari-specific.",
      },
      {
        kind: "improved",
        title: "Add Line is pinned to the viewport",
        description:
          "The Add Line button is now pinned to the bottom-left of the viewport instead of scrolling away with the sidebar list.",
      },
    ],
  },
  {
    date: "2026-07-28",
    entries: [
      {
        kind: "new",
        title: "Speculation Mode, ownership tracking, and a live deploy",
        description:
          "Launched Speculation Mode's sandbox layer, per-volume shelving status tracking, panel transitions, and a live GitHub Pages deploy.",
      },
    ],
  },
  {
    date: "2026-07-26",
    entries: [
      {
        kind: "internal",
        title: "Where the history starts",
        description:
          "A baseline snapshot taken after fixing Speculation Mode's scroll and drag lag, from ~140ms down to ~17ms per frame. This is where the repository's history begins.",
      },
    ],
  },
];

/** This changelog is public-facing and feature-focused, so bug fixes,
 * polish and invisible-to-a-reader refactors/tooling sit out of the public
 * view -- UPDATES above keeps every entry regardless, this is purely a
 * display filter. A release with nothing left after filtering drops out
 * entirely rather than showing an empty day. Shared by UpdatesModal (the
 * full history) and useWhatsNew (just what's landed since a visitor's last
 * visit), so both agree on what counts as public. */
const HIDDEN_KINDS: ReadonlySet<UpdateKind> = new Set(["fixed", "internal", "improved"]);

/** `UPDATES`, filtered down to what the public page shows: the hidden
 * kinds above, plus `inProgress` entries -- daily slices of a still-running
 * effort like the DC Finest/Licensed credit research -- sit out too; see
 * `UpdateEntry`'s own doc for why. Still newest-first, same as `UPDATES`. */
export const PUBLIC_RELEASES: UpdateRelease[] = UPDATES.map((release) => ({
  ...release,
  entries: release.entries.filter((entry) => !HIDDEN_KINDS.has(entry.kind) && !entry.inProgress),
})).filter((release) => release.entries.length > 0);
