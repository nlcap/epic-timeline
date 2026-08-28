// Core data model for the Epic Timeline app.
//
// Vocabulary (matches how Nick talks about the collections, not generic CS terms):
//   Collection  -> a top-level page/tab, e.g. "Classic Marvel Epic Collection",
//                  "Modern Era Marvel Epic Collection", "DC Finest",
//                  "Marvel Licensed Epic Collections", "Marvel Ultimate Line".
//   Line        -> a single character/team's numbered run within a Collection,
//                  e.g. "Ultimate Fantastic Four". This is the unit that owns
//                  a color (derived from that line's real-world trade dress).
//   Volume      -> one published or announced book within a Line.
//   Gap         -> a stretch of time within a Line with no volume, either because
//                  no comics existed then (a "publication" gap) or because comics
//                  exist but haven't been collected into a volume yet (an
//                  "uncollected" gap -- visual treatment for this is still TBD).
//   Note        -> Speculation Mode only. A freeform annotation on a speculative
//                  line's timeline, in place of a volume -- e.g. a rumor or a
//                  placeholder for something not yet announced as a real volume.

export type Quarter = 1 | 2 | 3 | 4;

export interface QuarterPoint {
  year: number;
  quarter: Quarter;
}

export interface MonthPoint {
  year: number;
  /** 1-12 */
  month: number;
}

/**
 * Shelved and Ordered both render with the "owned" tile treatment (35%/65%
 * opacity). Out of Print, Announced, and Alt Format render with the "unowned"
 * tile treatment (15%/20% opacity). Every volume seeds as "announced" -- if
 * it's in the system, it's been solicited/listed somewhere (PRH, Amazon,
 * etc), and the seed makes no claim about who owns it. Anything else is a
 * reader's own doing, kept as a localStorage override (useOwnership).
 */
export type OwnershipStatus =
  | "announced"
  | "shelved"
  | "ordered"
  | "out_of_print"
  | "alt_format";

export const OWNED_STATUSES: ReadonlySet<OwnershipStatus> = new Set([
  "shelved",
  "ordered",
]);

/**
 * Tracks reading progress, independent of ownership -- a volume can be
 * Reading before it's Shelved (borrowed, read digitally, etc). No seeded
 * per-volume default the way OwnershipStatus has; every volume starts at
 * "not_started" (see useReadingStatus).
 */
export type ReadingStatus = "not_started" | "reading" | "finished" | "paused" | "dropped";

/**
 * Filter-panel match mode (see FilterPanel.tsx). "any" combines each
 * facet's checked values with OR; "all" requires every checked value at
 * once, which is only possible for a multi-valued field like Line.tags --
 * shelving/reading are single-valued per volume, so "all" restricts those
 * two facets to a single selection instead.
 */
export type FilterMode = "any" | "all";

/**
 * Star-rating filter-panel facet: `[min, max]`, half-star precision.
 * `[RATING_MIN, RATING_MAX]` (see lib/rating.ts's FULL_RATING_RANGE) is the
 * "doesn't restrict anything" default, same convention as an empty Set for
 * the other facets.
 */
export type RatingRange = [number, number];

export interface Collection {
  id: string;
  name: string;
  /** Short line under the wordmark, e.g. "Ultimate Era Epic Collection Timeline" */
  tagline: string;
  /** Publisher wordmark shown in the banner, e.g. "MARVEL" or "DC" */
  publisherWordmark: string;
  /** Accent color for the banner rule/wordmark -- independent of any Line color */
  accentHex: string;
}

export interface Line {
  id: string;
  collectionId: string;
  name: string;
  iconUrl?: string;
  /**
   * DC Finest: one icon per era instead of a single `iconUrl`, since a
   * character's line spans Golden through Post-Crisis. Uploading all four
   * isn't required -- eras with nothing uploaded fall back to the line's
   * default icon (see `defaultIconEra`).
   */
  eraIconUrls?: Partial<Record<Era, string>>;
  /**
   * DC Finest: which uploaded era icon is used for the sidebar/pill icon.
   * Defaults to the earliest era with an icon uploaded.
   */
  defaultIconEra?: Era;
  /** Base hex, informed by that line's real trade dress. Used at 100% for the
   * icon ring/volume badge, and at reduced opacity for tile backgrounds. */
  colorHex: string;
  /**
   * The character/team's real-world debut -- NOT this line's first volume.
   * Epic Collections and DC Finest release non-linearly (e.g. a line whose
   * first collected volume is from the 1980s can still cover a character who
   * debuted decades earlier), so lines are sorted vertically by this date
   * rather than by their earliest volume/gap.
   */
  debutDate: MonthPoint;
  /**
   * How many stacked lanes this line's volumes/gaps can spread across when
   * their date ranges overlap, instead of piling up on top of each other in
   * a single band -- 1-5, undefined means 1 (today's single-lane behavior).
   * Licensed-collection-only for now; see assignLanes/lineHeight in
   * lib/timeline.ts and LineFormDrawer's "Swim lanes" field.
   */
  swimLanes?: number;
  /**
   * Short era/timeframe blurb shown under the line title in the sidebar
   * pill -- e.g. "4000-1000 years before Yavin". Only ever displayed when
   * swimLanes is 2+ (see LineRow.tsx); stored regardless so it's preserved
   * if a line's lane count changes later. Licensed-collection-only for now,
   * same as swimLanes -- see LineFormDrawer's "Description" field.
   */
  description?: string;
  /**
   * Freeform labels set via the Add/Edit Line form's Tags field -- global
   * across the whole app (not scoped to this line's collection), so a tag
   * created here shows up as a suggestion when tagging any other line
   * anywhere. See TagInput.tsx and App.tsx's allTags.
   */
  tags?: string[];
}

/**
 * DC Finest spans a single line per character across all four eras (Golden
 * through Post-Crisis), so a volume's era can't be inferred from its Line --
 * it's a manual per-volume choice, independent of `start`/`end`. Marvel/
 * Ultimate/Licensed volumes never set this.
 *
 * A plain string (not the old fixed "golden"|"silver"|"bronze"|"post-crisis"
 * union) since the Custom tab can define its own era ids too -- see
 * EraOption in lib/era.ts, which is what actually defines a given id's
 * label/letter/color/boundary for whichever collection is active.
 */
export type Era = string;

export interface Volume {
  kind: "volume";
  id: string;
  lineId: string;
  /**
   * Display label only -- placement on the timeline is entirely governed by
   * `start`/`end`. For most lines this is a plain sequential number ("1",
   * "2"). DC Finest volumes pair this with `era`: it's just the position
   * within that era, numeric when known ("1", "12") or a lowercase letter
   * ("a", "b", "c"...) when the exact numeric slot isn't known yet -- the
   * era's letter prefix is derived separately, not stored here.
   */
  number: string;
  /** DC Finest only -- see `number`. Undefined for every other collection. */
  era?: Era;
  title: string;
  start: QuarterPoint;
  end: QuarterPoint;
  /** e.g. "Fantastic Four #1-18" */
  issuesCollected: string;
  /** e.g. "1961-1963" -- shown in the detail panel */
  yearsCovered: string;
  /**
   * When the trade paperback itself hit shelves -- the real-world publish
   * date, NOT the story-time span that start/end/yearsCovered track. Month
   * precision, since solicitations rarely give an exact day. Undefined
   * wherever it hasn't been sourced yet, same known-gap treatment as
   * coverUrl.
   */
  releaseDate?: MonthPoint;
  /**
   * Credits, split by role. Any of these can be undefined where the source
   * had nothing usable -- notably the Star Wars (Legends) sub-lines, whose
   * Wikipedia tables carry no creator columns at all. Undefined means "not
   * known", so the detail panel omits that line rather than showing a
   * placeholder; don't store "TBC"/"various" here.
   *
   * These replaced a single combined `creators` string (e.g. "Lee, Kirby"),
   * and `artists` was later split into `pencillers`/`inkers` so a volume can
   * say who drew it and who inked it separately.
   *
   * Caveat on `pencillers`: only volumes rebuilt from issue-by-issue research
   * have a true penciller/inker split. Everything else still holds the older
   * combined credit -- a mix of both roles -- parked in `pencillers` by the
   * `artists` migration, with `inkers` left undefined. So an undefined
   * `inkers` means "not researched yet", not "nobody inked it".
   */
  writers?: string;
  pencillers?: string;
  inkers?: string;
  description: string;
  /**
   * A reader's own freeform notes on this volume -- distinct from
   * `description` (the publisher blurb): never seeded, blank for every
   * volume until someone writes one via the edit form. Not to be confused
   * with `Note.notes` below, which is Speculation Mode's own primary text
   * field for an entirely different timeline-entry kind.
   */
  notes?: string;
  coverUrl?: string;
  ownershipStatus: OwnershipStatus;
  /**
   * Resolved (override-applied) reading status, stamped onto each volume by
   * App.tsx's resolvedEntries the same way ownershipStatus is -- unlike
   * ownershipStatus there's no seeded value underneath, so this is only
   * ever set at render time, never in seed data or VolumeFormDrawer.
   * Undefined for speculative volumes (see resolvedEntries/App.tsx), which
   * don't track reading progress any more than they track ownership.
   */
  readingStatus?: ReadingStatus;
  /**
   * Resolved (override-applied) personal star rating -- 0.5-5 in half-star
   * steps, stamped onto each volume by App.tsx's resolvedEntries the same
   * way readingStatus is: no seeded value, only ever set at render time,
   * never in seed data or VolumeFormDrawer. Set/cleared via StarRating.tsx
   * in the detail panel. Undefined for speculative volumes, same as
   * ownershipStatus/readingStatus.
   */
  rating?: number;
  /**
   * Deliberate 1-based swim-lane pin (1-5), from the "Swim lane position"
   * field on the Licensed-collection volume form -- undefined means "let
   * assignLanes place it automatically" (the default for every volume,
   * and the only behavior outside Licensed). See assignLanes in
   * lib/timeline.ts for how a pinned volume takes priority over the
   * greedy auto-placement pass.
   */
  swimLanePosition?: number;
}

export type GapType = "publication" | "uncollected";

export interface Gap {
  kind: "gap";
  id: string;
  lineId: string;
  gapType: GapType;
  start: QuarterPoint;
  end: QuarterPoint;
  /** Optional note, e.g. "No issues published in this window" */
  label?: string;
}

/**
 * Speculation Mode only -- replaces "New Gap" as the second option when
 * adding/editing an entry on a speculative line. Modeled on Volume's fields
 * (see VolumeFormDrawer) but without ownership/credits/swim-lane-position,
 * and `number` isn't required the way Volume's is.
 */
export interface Note {
  kind: "note";
  id: string;
  lineId: string;
  coverUrl?: string;
  /** Form label: "Note Title". */
  title: string;
  /** DC Finest only -- see Volume.era. */
  era?: Era;
  /** Form label: "Number", paired with era same as Volume -- unlike
   * Volume.number, may be left blank. */
  number: string;
  /** Form label: "Note Summary" (Volume's analogous field is issuesCollected). */
  summary: string;
  start: QuarterPoint;
  end: QuarterPoint;
  /** Form label: "Notes" (Volume's analogous field is description). */
  notes: string;
}

export type TimelineEntry = Volume | Gap | Note;
