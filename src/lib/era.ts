import type { Era, Line, QuarterPoint, Volume } from "../types";
import { quarterIndex } from "./timeline";

export interface EraMeta {
  label: string;
  /** Prefix letter for the display number, e.g. era "golden" + number "1" -> "G1" */
  letter: string;
}

export const ERA_META: Record<Era, EraMeta> = {
  golden: { label: "Golden Age", letter: "G" },
  silver: { label: "Silver Age", letter: "S" },
  bronze: { label: "Bronze Age", letter: "B" },
  "post-crisis": { label: "Post-Crisis", letter: "C" },
};

export const ERA_ORDER: Era[] = ["golden", "silver", "bronze", "post-crisis"];

/**
 * Quarter-precision boundaries for the shared DC continuity eras
 * (independent of any single line/volume's own `era` tag, which can vary
 * character to character). Golden Age through Q4 1952, Silver Age begins
 * Q1 1953, Bronze Age begins Q1 1970, Post-Crisis begins Q4 1986 (Crisis
 * on Infinite Earths / Man of Steel). First and last eras are open-ended.
 */
const eraBoundaryQuarter = (point: QuarterPoint) => quarterIndex(point);
const ERA_QUARTER_RANGE: Record<Era, { start: number; end: number }> = {
  golden: { start: -Infinity, end: eraBoundaryQuarter({ year: 1952, quarter: 4 }) },
  silver: {
    start: eraBoundaryQuarter({ year: 1953, quarter: 1 }),
    end: eraBoundaryQuarter({ year: 1969, quarter: 4 }),
  },
  bronze: {
    start: eraBoundaryQuarter({ year: 1970, quarter: 1 }),
    end: eraBoundaryQuarter({ year: 1986, quarter: 3 }),
  },
  "post-crisis": { start: eraBoundaryQuarter({ year: 1986, quarter: 4 }), end: Infinity },
};

/** Which shared DC era a given quarter falls into -- the ranges above are
 * contiguous and cover -Infinity..Infinity between them, so this always
 * finds a match. */
export function eraForQuarterPoint(point: QuarterPoint): Era {
  const idx = quarterIndex(point);
  return ERA_ORDER.find((era) => idx >= ERA_QUARTER_RANGE[era].start && idx <= ERA_QUARTER_RANGE[era].end)!;
}

// Muted bar background per era -- approximated from the Figma reference,
// refine with exact values later. Also doubles as each era's label text
// color (see EraBar.tsx): the label itself sits on a #1E1E1E chip, not
// directly on this background, so reusing the same hex for both is what
// ties the label back to its segment.
export const ERA_BAR_COLOR: Record<Era, string> = {
  golden: "#564C16",
  silver: "#464646",
  bronze: "#493623",
  "post-crisis": "#1B3547",
};

export interface EraSegment {
  era: Era;
  /** Inclusive quarter-index bounds (see `quarterIndex` in lib/timeline). */
  startQuarter: number;
  endQuarter: number;
}

/** Era bar segments clipped to [startQuarter, endQuarter] (inclusive
 * quarter-indexes) -- skips any era with no overlap in that range. */
export function eraSegmentsForQuarterRange(
  startQuarter: number,
  endQuarter: number
): EraSegment[] {
  const segments: EraSegment[] = [];
  for (const era of ERA_ORDER) {
    const range = ERA_QUARTER_RANGE[era];
    const clippedStart = Math.max(range.start, startQuarter);
    const clippedEnd = Math.min(range.end, endQuarter);
    if (clippedStart <= clippedEnd) {
      segments.push({ era, startQuarter: clippedStart, endQuarter: clippedEnd });
    }
  }
  return segments;
}

/** Bare display label: "G1"/"Sa" for era volumes, plain "1" otherwise. */
export function volumeBadgeText(volume: Volume): string {
  return volume.era ? `${ERA_META[volume.era].letter}${volume.number}` : volume.number;
}

/** Same as volumeBadgeText, but with a "#" prefix for non-era volumes -- for
 * use in prose/tooltips (era volumes are never written with a "#"). */
export function volumeNumberLabel(volume: Volume): string {
  return volume.era ? volumeBadgeText(volume) : `#${volume.number}`;
}

/** The earliest era (Golden first) that has an icon uploaded, if any. */
export function earliestEraWithIcon(
  eraIconUrls: Partial<Record<Era, string>> | undefined
): Era | undefined {
  if (!eraIconUrls) return undefined;
  return ERA_ORDER.find((era) => eraIconUrls[era]);
}

/** Effective sidebar/pill icon for a line: its chosen default era icon, else
 * the earliest era icon uploaded, else the plain `iconUrl`. */
export function lineIconUrl(line: Line): string | undefined {
  const era = line.defaultIconEra ?? earliestEraWithIcon(line.eraIconUrls);
  return (era && line.eraIconUrls?.[era]) ?? line.iconUrl;
}

/** Effective icon for a volume tile: the icon for the volume's own era if
 * one was uploaded, else the line's default icon. */
export function volumeIconUrl(volume: Volume, line: Line): string | undefined {
  return (volume.era && line.eraIconUrls?.[volume.era]) ?? lineIconUrl(line);
}
