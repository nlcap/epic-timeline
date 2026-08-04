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
 * tile treatment (15%/20% opacity). Every volume defaults to "announced" -- if it's in the system,
 * it's been solicited/listed somewhere (PRH, Amazon, etc).
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
}

/**
 * DC Finest spans a single line per character across all four eras (Golden
 * through Post-Crisis), so a volume's era can't be inferred from its Line --
 * it's a manual per-volume choice, independent of `start`/`end`. Marvel/
 * Ultimate/Licensed volumes never set this.
 */
export type Era = "golden" | "silver" | "bronze" | "post-crisis";

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
  /** e.g. "Ultimate Spider-Man (2000) #1-13" */
  issuesCollected: string;
  /** e.g. "1962-1963" -- shown in the detail panel */
  yearsCovered: string;
  /** e.g. "Lee, Kirby" */
  creators: string;
  description: string;
  coverUrl?: string;
  ownershipStatus: OwnershipStatus;
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

export type TimelineEntry = Volume | Gap;
