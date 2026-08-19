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
 * Ordering is enforced by a test rather than by care: see updates.test.ts.
 */

/** What kind of change an entry is, which decides its badge. Deliberately
 * coarse — five kinds a reader can scan, not a taxonomy. `internal` covers
 * refactors, tests and tooling: things with no visible surface, kept in
 * because "why did nothing change this week" is a fair question. */
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
    date: "2026-08-18",
    entries: [
      {
        kind: "new",
        title: "Pencillers and inkers are credited separately",
        description:
          "A volume can now say who drew it and who inked it, rather than folding both into one list. Chemical Syndicate reads as Bob Kane on pencils with Jerry Robinson and George Roussos inking; Kryptonite Nevermore as Curt Swan over Murphy Anderson. Where the two lists match — every Golden Age book, whose artists inked their own work — it collapses back to a single \"Art by\" line rather than printing the same names twice.",
      },
      {
        kind: "new",
        title: "Every DC Finest volume is credited from the issues themselves",
        description:
          "All one hundred volumes now carry credits built by reading the issues they collect, story by story, against the DC Database \u2014 2,365 credits naming 682 people, in place of the abbreviated marketing copy the seed data shipped with. The gap was widest wherever a book is an anthology. Horror Vol. 1 went from two names to nineteen writers against twenty-eight pencillers, picking up Bernie Wrightson, Alex Toth, Wally Wood, Neal Adams and Sergio Aragones, none of whom were listed. Batman\u2019s first Golden Age volume credited Bob Kane and left out George Roussos, who inked twenty-seven of its stories. The Killing Joke volume led with Alan Moore and Brian Bolland for their one story out of twenty-three, and Teen Titans finally shows Romeo Tanghal inking nearly all of it. Two things had to be right for the count to mean anything. Anthology issues are filtered to the stories actually collected, using each collected edition\u2019s own contents list where one exists \u2014 forty-five Sgt. Rock stories kept against eighty-three dropped, and forty-eight Tommy Tomorrow, Congo Bill and Vigilante backups dropped from Last Days of Superman. And reprints no longer credit creators who weren\u2019t there: The Stray Superdog listed Otto Binder, Jerry Siegel, Bill Finger and Edmond Hamilton on a book of 1974-77 material, where thirty-nine of its eighty-nine stories are reissues. The seven Events crossovers came last and needed a different approach, since each spans twenty-odd titles and a chapter told from another character\u2019s side can\u2019t be recognised by subject, only by reading the contents list. A closing pass settled the names against the same source, so one person no longer appears twice under two spellings: Dennis \"Denny\" O\u2019Neil reads the same way in all twenty-one of his credits, and the single book he wrote as Jim Owsley credits \"Jim Owsley (Christopher Priest)\" \u2014 the name it was published under, and the name he goes by now.",
      },
      {
        kind: "internal",
        title: "The open credit questions are written down",
        description:
          "A new gaps document collects what's still unresolved: sources with no usable page on the wiki, Who's Who entries that credit dozens of artists without saying who drew which, judgment calls worth a second opinion, and seed data that looks wrong but hasn't been touched. Most \"missing\" sources turn out to be naming mismatches rather than absent data.",
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
          "Reset has always let you scope a wipe by collection and timeline layer, while export dumped all six stores wholesale and import replaced every key it recognised. All three now share one checklist across three axes — collection, timeline layer, and data type (lines & volumes / notes / ownership / reading progress) — so you can hand off just your DC Finest corrections, restore only the Ultimate tab from a backup, or take someone's speculative scenarios without clobbering your own edits. On upload the picker is built from the file itself, showing per-slice record counts and greying out what it has nothing for, and you choose whether to replace the selected slice or merge into it.",
      },
      {
        kind: "data",
        title: "Rise of the Sith gets its credits",
        description:
          "Researched issue by issue from Dark Horse and the Marvel Database, using each collected edition's table of contents to pick out which story from an anthology issue is actually reprinted. Names run in descending order of how many stories each person worked on.",
        inProgress: true,
      },
      {
        kind: "improved",
        title: "Credit labels read as labels",
        description:
          "\"Written by\" and \"Art by\" are bolded so they no longer run into the names after them, and the two lines get a small gap so they don't look like one wrapped paragraph.",
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
          "The nav box now also matches a volume's title, writers, artists, issues collected and description, so \"kirby\" or \"galactus\" finds the books rather than nothing. The two routes to a match mean different things on screen: a line matched by its own name keeps every volume, while a line that only surfaced through its volumes comes back trimmed to just those. Speculative entries are searchable too when Speculation Mode is on.",
      },
      {
        kind: "new",
        title: "Release dates, writers and artists on every volume",
        description:
          "New fields on the volume model, backfilled from the per-volume tables on the Marvel Epic Collection and DC Finest Wikipedia articles: release dates on 675 of 677 volumes, writers on 617, artists on 616. Credits get their own lead-in lines in the detail panel — \"Written by Stan Lee\" / \"Art by Jack Kirby\" — and a date still in the future reads \"Releases\" rather than \"Released\".",
      },
      {
        kind: "data",
        title: "43 volume titles corrected and the Punisher renumbered",
        description:
          "Mostly misspellings (Vengence, Bleeker, Super-Villians, Rememberance, Ressurection), a few wrong outright: Amazing Spider-Man Vol. 1 was carrying a Moon Knight title pasted in by mistake, Captain America Vol. 8's \"Lazarus Project\" is the \"Lazarus Conspiracy\", and X-Men Vol. 11's \"Lifetheft\" is \"Lifedeath\". Punisher also had two Vol. 8s with issue lists shifted a slot.",
      },
      {
        kind: "improved",
        title: "The volume panel is washed in its own cover",
        description:
          "The product-page treatment: the cover again behind the real one, blown up, stretched out of proportion and heavily blurred into a wash of the book's own colours. It bleeds off the top and both sides of the panel and fades into the panel colour on the way down, between the title and the status pills.",
      },
      {
        kind: "data",
        title: "A fresh install starts with an empty shelf",
        description:
          "The seed carried one person's shelving — 397 shelved, 45 alt format, 6 ordered, 2 out of print — which made sense while there was one user but shipped a private collection to everyone opening the app. All 677 volumes now seed as \"announced\", so the seed describes what the publishers have put out rather than who owns it. Nobody's existing tracking is disturbed: statuses are stored as absolute values per volume, not diffs against the seed. The old snapshot lives on under sample-data/ as an anonymous demo collection, since a fresh install is otherwise an empty shelf where the owned and unowned tile treatments look identical.",
      },
      {
        kind: "fixed",
        title: "Gaps step aside while a filter is on",
        description:
          "A gap claims nothing was published across a stretch, which is only true of a line's full run. Once a search or a status facet is trimming tiles, what's left is a subset, so a gap spanning the volumes that got filtered out asserts a hole that isn't there.",
      },
      {
        kind: "fixed",
        title: "The Tags filter section stays when a timeline has no tags",
        description:
          "It used to disappear entirely when nothing was tagged, which reads as \"this timeline doesn't do tags\" rather than \"nobody's added any here yet\" — and no seed line carries tags, so that was every timeline on a fresh install. The heading now stays, with an empty state pointing at where tags come from.",
      },
      {
        kind: "data",
        title: "Cover and content fixes",
        description:
          "The two John Byrne Fantastic Four volumes — the last with no issue list or description — are filled in from their Penguin Random House pages, which also credit co-writers the Wikipedia rows missed. Silver Surfer: Into the Outer Void swaps Amazon's listing image, which was a single-issue cover, for Marvel's own CDN. Namor Vol. 1 capitalises the M in \"Enter The Sub-Mariner\".",
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
          "App-wide bare-key shortcuts, chosen specifically to never collide with an OS or browser one: \"/\" focuses search, \"f\" opens filters, \"n\" adds a line, \"1\"-\"5\" jump between collection tabs, \"+\"/\"-\" zoom, \"s\" toggles Speculation Mode, and \"?\" opens a cheat sheet. Suppressed whenever a modifier is held or focus is in a text field, so typing \"n\" into the Line title box never fires Add Line out from under you. With a panel open: Escape closes it through the same slide-out its Cancel button uses, Cmd/Ctrl+Enter saves or applies filters, and \"e\" edits the open volume.",
      },
      {
        kind: "new",
        title: "A filter panel for shelving and reading status",
        description:
          "The filter-slider icon at the right edge of the search box opens a slide-out panel with checkbox lists for both statuses, draft/apply like the other drawers — nothing takes effect until Apply Filters commits it. Applying narrows the timeline two ways: lines with no matching volume drop out entirely, and within a line that does match, its individual non-matching tiles clear out too. The year axis condenses to the surviving volumes' range, and a blue dot on the icon marks when a filter is actually applied.",
      },
      {
        kind: "new",
        title: "Tags on lines",
        description:
          "A tags field on the Add/Edit Line form, Letterboxd-style: type to filter existing tags case-insensitively, Tab or click accepts the top match, Enter creates a new one or reuses an existing match rather than forking a duplicate. Tags are a single pool shared across every collection, so one created on a DC line immediately suggests itself for a Marvel one. The filter panel gets a matching Tags section offering only the tags actually used in the current collection, ordered by how many lines carry each.",
      },
      {
        kind: "new",
        title: "Reading status alongside shelving status",
        description:
          "A per-volume reading status — Not Started, Reading, Finished, Paused, Dropped — as a second dropdown next to the shelving picker in the volume detail panel, and read-only next to it in the tile hover preview.",
      },
      {
        kind: "new",
        title: "Any/All match mode in the filter panel",
        description:
          "Shelving and Reading switch from checkboxes to radios in All mode, since those fields are single-valued per volume; Tags stays multi-select and matches all-selected instead of any-selected. Switching modes clears the current picks rather than silently collapsing them, and each facet heading gets its own Clear alongside Clear all filters.",
      },
      {
        kind: "fixed",
        title: "Three filter and shortcut bugs",
        description:
          "Shortcuts fired straight through any open overlay — \"n\" with the cheat sheet up opened the Add Line drawer underneath it, unreachable behind the modal's own backdrop. Speculative lines vanished entirely whenever a shelving or reading facet was checked, since they have no official volumes that could ever match, taking the whole Speculation Mode layer with them. And none of the five settings dialogs closed on Escape, including the cheat sheet that lists Escape as closing the open panel.",
      },
      {
        kind: "internal",
        title: "The filter rules moved out of App.tsx, with tests",
        description:
          "Deciding which lines are on screen was ~70 lines of inline useMemo inside a 1000-line component, which is why the rules had no test coverage at all. Behaviour was checked rather than assumed: a temporary harness ran the old inline logic and the extracted version side by side over the real seed data across 8,400 combinations and they agreed on every one, with 14 of those rules now pinned permanently.",
      },
      {
        kind: "internal",
        title: "Four dedupes",
        description:
          "The shortcut cheat sheet is derived from the shortcuts themselves rather than hand-mirrored — the two had already drifted, with \"=\" working as a zoom alias and never being listed. TopNav's settings items render from one list instead of two copies that had to be edited in lockstep. The filter panel's shelving and reading facets share one section component. And useOwnership and useReadingStatus collapse onto a shared hook.",
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
          "Cover URLs, renumbering and content fixes across ~70 volumes merged out of local overrides and into the shipped seed data, plus Hitman, Romance, The Atom, The Question and Warlord as new lines, each with their own icons and first volume.",
      },
      {
        kind: "new",
        title: "Deleting a cover or icon asks first",
        description:
          "Both used to delete on the first click. The cover's wider thumbnail gets a proper \"Remove this cover?\" panel; the 48-64px icon circles have no room for text, so a first click arms it and a second confirms. Both auto-disarm after a few seconds, so an armed control can't become a trap for a later, unrelated click.",
      },
      {
        kind: "improved",
        title: "Bundle down from 3.45MB to ~730KB",
        description:
          "A handful of icons and covers in the Classic Marvel Epic, DC Finest and Ultimate seed data carried raw base64 data URIs instead of imported assets, left over from an earlier bake-in pass that never converted them back to files. They're real asset files now.",
      },
      {
        kind: "improved",
        title: "Issues collected is a textarea",
        description: "Several entries run long enough that a single-line input was fighting them.",
      },
      {
        kind: "internal",
        title: "Three shared shells extracted",
        description:
          "The four settings dialogs each reimplemented the same portal, backdrop and centred card, so that's one SettingsModal now. VolumeTile, NoteTile and GapSegment each had their own copy of the hover-preview positioning and edge drag handles — three copies that had to move in lockstep. And the era bar's scroll handler is rAF-gated like its sibling and skips attaching listeners on the four tabs that never use it.",
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
          "A speculative volume can now be added as a lightweight Note instead of a gap — the same drawer, with Creators dropped, Description relabelled to Notes, and Number no longer required. Notes render as a square-cornered tile at reduced fill and border opacity, distinct from a volume's pill shape. Official add/edit keeps New Gap unchanged.",
      },
      {
        kind: "new",
        title: "A volume stepper on the sidebar line icons",
        description:
          "Forward and back chevrons on a line's collapsed sidebar pill smooth-scroll the timeline to centre each of its volumes in turn, so you can step through a run without opening the drawer. The tile collapses mid-scroll and re-expands on the next real hover.",
      },
      {
        kind: "improved",
        title: "The Add Line button restyled",
        description:
          "A translucent, blurred background and a softer dashed border in place of the flat opaque fill, a fully rounded pill shape in its idle collapsed state, and hovering it while collapsed now expands to fit its own label instead of ballooning out to the full sidebar width.",
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
          "Pasting an image anywhere in the volume or line drawer fills in the cover or line icon, reusing the same compression and crop pipeline the file inputs already feed. For DC Finest's four per-era icon slots a paste doesn't say which era it's for, so the crop modal grows an era picker, pre-selected to the first era still missing an icon. A new DC Finest volume also defaults to whichever era the clicked timeline cell falls into, instead of always Golden Age.",
      },
      {
        kind: "new",
        title: "The active collection tab survives a refresh",
        description:
          "It was plain in-memory state, so every refresh bounced back to the first tab. It's stored now, the same way the app's other preferences are.",
      },
      {
        kind: "new",
        title: "The reset dialog shows how fresh each collection's data is",
        description:
          "A \"Last updated\" line under each collection checkbox, so anyone considering a reset can see how current the seed data they'd fall back to actually is. Computed from git history at build time by a small Vite plugin, rather than a hand-maintained date map that would silently go stale the next time a seed file changed.",
      },
      {
        kind: "improved",
        title: "Two panel refinements",
        description:
          "The nav search box is transparent until focused, so the idle nav reads as one surface instead of a floating input well. And volume description paragraphs render as real paragraphs with their own spacing — each Enter press was already treated as a break, but the panel drew the whole thing as one block, so paragraphs were separated by nothing more than the font's line height.",
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
          "Search now scopes the axis to just the filtered lines' own occupied range instead of the whole collection, and resets scroll to the left edge on every keystroke, which cuts down the horizontal scrolling needed to reach a match. Line descriptions also shrink at the most zoomed-out level so they stop overflowing the row.",
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
          "Licensed lines can opt into one to five stacked swim lanes so overlapping volumes render side by side instead of piling on top of each other, with a per-volume position pin to override auto-placement. Ships alongside real Licensed data — Conan, Planet of the Apes, Star Wars Legends, Micronauts, Rom and Aliens, 19 lines and 85 volumes with per-line icons. Line and volume descriptions also gained line-break support.",
      },
      {
        kind: "new",
        title: "A search box in the nav",
        description:
          "The first version, narrowing the visible lines by title on both desktop and mobile, with a clear button once there's text to clear.",
      },
      {
        kind: "new",
        title: "A localStorage debug panel",
        description:
          "Per-key size and total usage of the app's override stores, readable from the settings menu, for diagnosing quota issues after the storage safety-net work.",
      },
      {
        kind: "data",
        title: "Covers moved to a faster CDN, 29 more filled in",
        description:
          "Amazon benchmarked meaningfully faster than Penguin Random House for cover images, so all 255 PRH-sourced covers point there instead (one kept its PRH cover — no Amazon listing exists for that ISBN). Twenty-nine previously uncovered volumes are filled in by cross-referencing ISBNs; the rest are confirmed unpublished with no ISBN assigned yet, so there's nothing to source.",
      },
      {
        kind: "internal",
        title: "Tests, linting, and a gated deploy",
        description:
          "Vitest over the pure timeline math and the collection/scope filtering — exactly the functions the code's own comments describe taking several iterations to get right, and where a regression wouldn't necessarily be visually obvious. ESLint 9 alongside the existing type check, both now run before the build in CI, so a broken push stops there instead of silently deploying. The first lint run surfaced four real bugs, including an export dialog that tracked copy success and never rendered it.",
      },
      {
        kind: "internal",
        title: "Override stores share one implementation",
        description:
          "The four line/volume override hooks each reimplemented the same id-keyed load, upsert, delete and persist plumbing. As a side effect the initial load is now lazy, so the first render already has your overrides applied instead of flashing seed-only data first. A dead-code sweep also removed an unused component and two unused props.",
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
          "Covers were stored as uncompressed base64 in a single storage blob, which could exceed Firefox's stricter per-origin quota and crash the whole app with nothing to catch it. Uploads are now downscaled and JPEG-compressed (and already-stored oversized covers retroactively shrunk), every write goes through a helper that survives a quota error and surfaces a dismissible toast explaining what failed to save, and a root error boundary catches anything else that still throws.",
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
          "An unstyled select relies on the OS's native control chrome, which Safari sizes to the selected option's text rather than filling its container the way a plain input does. Both now draw their own chevron so they render consistently across browsers.",
      },
      {
        kind: "improved",
        title: "Padding around the volume tile cover image",
        description: "The cover sits in a padded container instead of flush against the tile's edge.",
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
          "Export your corrections and additions as JSON — copy, or download the file — and load a previous export back in. Speculation-mode data is covered too, not just real edits. Import is a paste-or-upload dialog whose Import button stays disabled until the textarea holds recognisable exported JSON, then goes through a confirm step before replacing anything. Icon data is stripped from both directions, since build-hashed asset paths and huge base64 blobs render as broken images after a round trip.",
      },
      {
        kind: "new",
        title: "Reset line data",
        description:
          "Wipes local overrides and additions back to the shipped seed data, scoped to any combination of the five collections and the main and speculative timeline layers — so you can reset Ultimate and Licensed's main timelines while leaving their speculative content and every other collection untouched. Confirms with a warning first.",
      },
      {
        kind: "new",
        title: "A gear-icon settings menu",
        description:
          "Replaces the disabled account avatar in the desktop nav; the mobile drawer lists the same items below its separator rather than duplicating the dropdown.",
      },
      {
        kind: "fixed",
        title: "Two Safari bugs",
        description:
          "The Add Volume \"+\" affordance could be left visibly stuck on a cell no longer under the pointer, so hover is now tracked from raw pointer position and hit-testing rather than trusting paired enter/leave events. And the banner tagline logos looked chunky on Retina screens: Safari rasterises SVG filter content at 1x regardless of display density, so the filter that faked their bevel is baked into flat vector paths instead.",
      },
      {
        kind: "improved",
        title: "Add Line is pinned to the viewport",
        description:
          "Fixed to the bottom-left corner instead of scrolling away as the last row of the sidebar list, so it's always reachable.",
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
          "A per-tab sandbox layer for speculative lines and volumes, per-volume shelving status with its own icon set and crop UI, panel and row transitions, and a workflow that deploys to GitHub Pages on every push to main.",
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
          "A baseline snapshot taken just after fixing Speculation Mode's scroll and drag lag at 80+ lines — three causes: a stale array reference quietly defeating a row's memo, an add-cell window sized for no real viewport, and every row staying mounted regardless of scroll position. Frame times went from ~140ms to ~17ms. This repository begins here; earlier milestones predate version control and can't be reconstructed as real commits.",
      },
    ],
  },
];
