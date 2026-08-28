import type { Era, Line, QuarterPoint, Volume } from "../types";
import { hexToRgba } from "./color";
import { quarterIndex } from "./timeline";

/**
 * One era's full definition -- label, badge letter, era-bar color, and
 * where it starts. Generic over which collection it belongs to: DC Finest's
 * four eras (DC_ERA_OPTIONS below) are just the shipped, hardcoded instance
 * of this shape, and the Custom tab's user-defined eras (see
 * useCustomCollectionConfig) are another. Everything downstream --
 * EraBar, the era `<select>`/icon-upload UI in LineFormDrawer/
 * VolumeFormDrawer, and the volume badge/icon helpers below -- takes an
 * `EraOption[]` rather than reaching for a DC-specific constant, so the same
 * code renders either.
 *
 * `options` passed to the functions below must be ordered oldest-first: each
 * era runs from its own `startQuarter` up to (but not including) the next
 * one's, and the last one is open-ended. The very first era's `startQuarter`
 * is conventionally `-Infinity` so the range covers all time.
 */
export interface EraOption {
  id: Era;
  label: string;
  /** Prefix letter for the display number, e.g. era "golden" + number "1" -> "G1" */
  letter: string;
  /** A CSS color -- always a literal hex for DC_ERA_OPTIONS, but for the
   * Custom tab's own eras this may be an rgba() string instead (see
   * customEraOptions' opacityPercent) once the era-color-opacity slider in
   * CustomCollectionConfigModal has been touched. Either way it's already
   * render-ready; nothing downstream needs to parse it further. */
  colorHex: string;
  /** Inclusive quarter-index (see quarterIndex) this era begins at. */
  startQuarter: number;
}

// ---- DC Finest's own eras -- fixed, shipped, never user-edited. ----

const eraBoundaryQuarter = (point: QuarterPoint) => quarterIndex(point);

/**
 * DC Finest's four shared-continuity eras. Boundaries: Golden Age through Q4
 * 1952, Silver Age begins Q1 1953, Bronze Age begins Q1 1970, Post-Crisis
 * begins Q4 1986 (Crisis on Infinite Earths / Man of Steel).
 */
export const DC_ERA_OPTIONS: EraOption[] = [
  { id: "golden", label: "Golden Age", letter: "G", colorHex: "#564C16", startQuarter: -Infinity },
  {
    id: "silver",
    label: "Silver Age",
    letter: "S",
    colorHex: "#464646",
    startQuarter: eraBoundaryQuarter({ year: 1953, quarter: 1 }),
  },
  {
    id: "bronze",
    label: "Bronze Age",
    letter: "B",
    colorHex: "#493623",
    startQuarter: eraBoundaryQuarter({ year: 1970, quarter: 1 }),
  },
  {
    id: "post-crisis",
    label: "Post-Crisis",
    letter: "C",
    colorHex: "#1B3547",
    startQuarter: eraBoundaryQuarter({ year: 1986, quarter: 4 }),
  },
];

/** Which era (from an ordered, oldest-first EraOption list) a given quarter
 * falls into -- undefined only when `options` is empty. */
export function eraOptionForQuarterPoint(
  options: EraOption[],
  point: QuarterPoint
): EraOption | undefined {
  if (options.length === 0) return undefined;
  const idx = quarterIndex(point);
  let match = options[0];
  for (const option of options) {
    if (idx >= option.startQuarter) match = option;
  }
  return match;
}

export interface EraBarSegment {
  id: Era;
  label: string;
  colorHex: string;
  /** Inclusive quarter-index bounds (see quarterIndex in lib/timeline). */
  startQuarter: number;
  endQuarter: number;
}

/** Era bar segments clipped to [startQuarter, endQuarter] (inclusive
 * quarter-indexes) -- skips any era with no overlap in that range. */
export function eraOptionSegments(
  options: EraOption[],
  startQuarter: number,
  endQuarter: number
): EraBarSegment[] {
  const segments: EraBarSegment[] = [];
  for (let i = 0; i < options.length; i++) {
    const option = options[i];
    const rangeEnd = i + 1 < options.length ? options[i + 1].startQuarter - 1 : Infinity;
    const clippedStart = Math.max(option.startQuarter, startQuarter);
    const clippedEnd = Math.min(rangeEnd, endQuarter);
    if (clippedStart <= clippedEnd) {
      segments.push({
        id: option.id,
        label: option.label,
        colorHex: option.colorHex,
        startQuarter: clippedStart,
        endQuarter: clippedEnd,
      });
    }
  }
  return segments;
}

/** Bare display label: "G1"/"Sa" for era volumes, plain "1" otherwise. */
export function volumeBadgeText(volume: Volume, eraOptions: EraOption[]): string {
  const option = volume.era ? eraOptions.find((o) => o.id === volume.era) : undefined;
  return option ? `${option.letter}${volume.number}` : volume.number;
}

/** Same as volumeBadgeText, but with a "#" prefix for non-era volumes -- for
 * use in prose/tooltips (era volumes are never written with a "#"). */
export function volumeNumberLabel(volume: Volume, eraOptions: EraOption[]): string {
  return volume.era ? volumeBadgeText(volume, eraOptions) : `#${volume.number}`;
}

/** The earliest era (per `eraOptions`' own oldest-first order) that has an
 * icon uploaded, if any. */
export function earliestEraWithIcon(
  eraIconUrls: Partial<Record<Era, string>> | undefined,
  eraOptions: EraOption[]
): Era | undefined {
  if (!eraIconUrls) return undefined;
  return eraOptions.find((option) => eraIconUrls[option.id])?.id;
}

/** Effective sidebar/pill icon for a line: its chosen default era icon, else
 * the earliest era icon uploaded, else the plain `iconUrl`. */
export function lineIconUrl(line: Line, eraOptions: EraOption[]): string | undefined {
  const era = line.defaultIconEra ?? earliestEraWithIcon(line.eraIconUrls, eraOptions);
  return (era && line.eraIconUrls?.[era]) ?? line.iconUrl;
}

/** Effective icon for a volume tile: the icon for the volume's own era if
 * one was uploaded, else the line's default icon. */
export function volumeIconUrl(volume: Volume, line: Line, eraOptions: EraOption[]): string | undefined {
  return (volume.era && line.eraIconUrls?.[volume.era]) ?? lineIconUrl(line, eraOptions);
}

// ---- The Custom tab's own user-defined eras. ----

/** One era the Custom tab's own user has defined -- see
 * useCustomCollectionConfig. Only a start YEAR (not a full QuarterPoint,
 * unlike DC's own boundaries): quarter-precision boundaries aren't worth the
 * extra field for eras someone is naming themselves. Stored oldest-first;
 * see customEraOptions for how the first one's start is treated. */
export interface CustomEraDef {
  id: string;
  label: string;
  letter: string;
  colorHex: string;
  startYear: number;
}

/** Converts an ordered (oldest-first) CustomEraDef list into the same
 * EraOption[] shape DC_ERA_OPTIONS uses, so every function above works
 * identically for either. The first era's startQuarter is always forced to
 * -Infinity regardless of its stored startYear -- same convention as DC's
 * own Golden Age -- so the era bar and era-lookup always cover every date,
 * including whatever a line/volume predates the oldest defined era.
 * Whichever era currently sorts first just has its own startYear field go
 * unused until something is reordered or added before it.
 *
 * `opacityPercent` (0-100, defaults to 100 -- fully opaque) applies
 * uniformly to every era's own color, not per-era -- CustomCollectionConfig's
 * one Era color opacity slider, not a control on each era row. Folded in
 * here (rather than left for EraBar to apply) since this is already the
 * one place a CustomEraDef's stored hex becomes the render-ready color
 * every downstream consumer just treats as CSS, opaque or not. */
export function customEraOptions(eras: CustomEraDef[], opacityPercent?: number): EraOption[] {
  const opacity = (opacityPercent ?? 100) / 100;
  const options: EraOption[] = eras.map((era) => ({
    id: era.id,
    label: era.label,
    letter: era.letter,
    colorHex: hexToRgba(era.colorHex, opacity),
    startQuarter: quarterIndex({ year: era.startYear, quarter: 1 }),
  }));
  if (options.length > 0) options[0] = { ...options[0], startQuarter: -Infinity };
  return options;
}
