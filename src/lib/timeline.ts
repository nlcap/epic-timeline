import type { MonthPoint, Quarter, QuarterPoint } from "../types";

export const SIDEBAR_MIN_WIDTH = 180;
export const SIDEBAR_MAX_WIDTH = 320;
export const SIDEBAR_COLLAPSE_RANGE = 160;
export const AXIS_HEIGHT = 32;

/**
 * Discrete vertical zoom levels: 1 is the default/max-zoomed-in view, 3 is
 * the max zoomed-out view. Each level drives the whole row (not just the
 * volume tile) so zooming out fits more lines on screen -- the sidebar pill
 * and its icon shrink in lockstep, keeping the same visual relationship
 * (tile/pill height = row height minus a fixed 16px inset; icon = pill + 8px
 * at levels 1-2, so it keeps overflowing the pill by a constant 4px per
 * side). Level 3 breaks from that formula for its icon size -- see
 * SIDEBAR_ICON_SIZE_BY_ZOOM below.
 */
export type ZoomLevel = 1 | 2 | 3;
export const MIN_ZOOM_LEVEL: ZoomLevel = 1;
export const MAX_ZOOM_LEVEL: ZoomLevel = 3;
export const DEFAULT_ZOOM_LEVEL: ZoomLevel = 1;
export const ROW_HEIGHT_BY_ZOOM: Record<ZoomLevel, number> = { 1: 64, 2: 48, 3: 32 };
// Level 3's pill breaks from the "row height - 16px inset" formula the other
// two levels use (which would give 16px, too short to fit the line-name
// label's text-sm line height of 20px) -- 22px is just enough for that text
// to render without clipping, both in the default expanded state and when
// re-expanded on hover after the horizontal scroll-collapse.
export const SIDEBAR_PILL_HEIGHT_BY_ZOOM: Record<ZoomLevel, number> = { 1: 48, 2: 32, 3: 22 };
// Level 3 breaks from the "icon = pill + 8px" relationship the other two
// levels use: since each icon sits centered within its own ROW_HEIGHT slot
// regardless of pill size, the vertical gap between one row's icon and the
// next is exactly ROW_HEIGHT_BY_ZOOM[3] - SIDEBAR_ICON_SIZE_BY_ZOOM[3] (32 -
// 30 = 2px here) -- sized up from the formulaic 24px so adjacent icons in
// the collapsed sidebar list sit close together instead of leaving a big
// gap. 2px (not 1) keeps the split even (32 is even), avoiding a fractional
// per-side centering offset that could round asymmetrically.
export const SIDEBAR_ICON_SIZE_BY_ZOOM: Record<ZoomLevel, number> = { 1: 56, 2: 40, 3: 30 };
// Matches the icon border thinner at level 3 so it doesn't overwhelm the
// now much-larger icon relative to its 16px pill.
export const SIDEBAR_ICON_BORDER_BY_ZOOM: Record<ZoomLevel, number> = { 1: 3, 2: 3, 3: 2 };
// Horizontal scale compresses harder than ROW_HEIGHT_BY_ZOOM's 0.75x/0.5x --
// squaring those ratios (0.75^2 = 0.5625x, 0.5^2 = 0.25x of the level-1
// value) so a zoomed-out screen reveals more calendar time than it does
// additional lines, rather than compressing both axes by the same amount.
export const PX_PER_QUARTER_BY_ZOOM: Record<ZoomLevel, number> = { 1: 55, 2: 31, 3: 14 };
// Gap between the sidebar column and the timeline lanes -- same 0.75x/0.5x
// compression as the rest of the zoom-scaled values above.
export const SIDEBAR_GAP_BY_ZOOM: Record<ZoomLevel, number> = { 1: 24, 2: 18, 3: 12 };
// The hover "add volume" circle shown over an empty quarter segment (see
// AddVolumeCell.tsx) -- shrinks with the row so it never overflows the
// shorter tile area at zoomed-out levels.
export const ADD_CELL_ICON_SIZE_BY_ZOOM: Record<ZoomLevel, number> = { 1: 24, 2: 20, 3: 14 };
// Hover "add volume" cells are windowed around the current scroll position
// (LineRow.tsx) rather than rendered across the whole axis width -- a wide
// collection can be tens of thousands of px across, and even with rendering
// memoized away on scroll, that many extra DOM nodes has its own paint/
// layout/hit-testing cost that shows up even when React itself never
// re-renders them (confirmed: at zoom level 3 with ~80 lines, cutting the
// per-row cell count roughly 4x cut measured scroll frame time by roughly
// the same factor). A flat per-zoom-independent quarter count was tried
// first (see addCellWindowQuarters below for why that doesn't work) but a
// fixed count sized generously enough to cover a full viewport at zoomed-out
// levels (small pxPerQuarter, so many quarters per px) is wildly oversized
// at zoomed-in levels -- that oversized, mostly off-screen DOM was the
// actual remaining cost after LineTimelineLane's memo boundary and the
// entries/onResizeStart reference-stability fixes.
// ADD_CELL_SCROLL_BUCKET_PX coarsens scrollLeft before it's used as a memo
// dependency, so the window only recomputes every so often instead of on
// every pixel of scroll -- addCellWindowQuarters below bakes in a margin of
// twice this much (on top of the viewport itself) so the window can't run
// dry between recomputes. Kept deliberately small (not the 500px it was
// when the window was a flat constant): the margin turns directly into
// rendered DOM nodes now, and recomputing emptyQuarterIndexes more often is
// cheap (a plain array scan over the window), so there's no real cost to
// recomputing frequently -- only a benefit to keeping the margin (and thus
// the DOM) small.
export const ADD_CELL_SCROLL_BUCKET_PX = 150;

/**
 * How many quarters (centered on scroll position) get hover "add volume"
 * cells at once, sized from the ACTUAL measured viewport width -- not a
 * static per-zoom guess -- so the window covers what's on screen plus one
 * ADD_CELL_SCROLL_BUCKET_PX of scroll margin on top, and no more. Needed
 * because "quarters to cover a given px width" is inherently zoom-dependent
 * (smaller pxPerQuarter at zoomed-out levels means more quarters per pixel
 * of viewport), so a flat constant is either too small to cover the screen
 * at some zoom level or wastefully large at another -- there's no single
 * value that's right for all of them the way there is for the sidebar/tile
 * dimensions above.
 */
export function addCellWindowQuarters(viewportWidth: number, pxPerQuarter: number): number {
  const viewportQuarters = Math.ceil(viewportWidth / pxPerQuarter);
  const marginQuarters = Math.ceil((2 * ADD_CELL_SCROLL_BUCKET_PX) / pxPerQuarter);
  return viewportQuarters + marginQuarters;
}

/** Absolute quarter index since year 0, Q1 -- lets us do simple pixel math. */
export function quarterIndex(point: QuarterPoint): number {
  return point.year * 4 + (point.quarter - 1);
}

export function quartersBetween(a: QuarterPoint, b: QuarterPoint): number {
  return quarterIndex(b) - quarterIndex(a);
}

/** Inverse of quarterIndex -- turns an absolute quarter index back into a
 * QuarterPoint. Used by the hover "add volume" cells, which only track
 * which quarter index the user clicked. */
export function quarterPointFromIndex(index: number): QuarterPoint {
  const year = Math.floor(index / 4);
  return { year, quarter: (index - year * 4 + 1) as Quarter };
}

/**
 * Applies a drag-resize delta (in whole quarters, positive = later) to one
 * edge of a span, clamping so start can never pass end -- a span always
 * keeps at least its 1-quarter minimum. Shared between the live drag
 * preview and the final commit for the timeline's resize handles (see
 * VolumeTile.tsx / LineRow.tsx), so both compute the exact same result.
 */
export function resizeSpan(
  start: QuarterPoint,
  end: QuarterPoint,
  edge: "start" | "end",
  deltaQuarters: number
): { start: QuarterPoint; end: QuarterPoint } {
  const startIdx = quarterIndex(start);
  const endIdx = quarterIndex(end);
  if (edge === "start") {
    return { start: quarterPointFromIndex(Math.min(endIdx, startIdx + deltaQuarters)), end };
  }
  return { start, end: quarterPointFromIndex(Math.max(startIdx, endIdx + deltaQuarters)) };
}

/**
 * Left offset (px) and width (px) for a span, relative to axisStart. `end` is
 * inclusive -- it's the last quarter the entry covers, not the quarter after
 * (e.g. start Q4 2000 / end Q3 2001 covers all four quarters, so the next
 * entry starting Q4 2001 sits flush against it with no visual gap).
 */
export function spanToPx(
  axisStart: QuarterPoint,
  start: QuarterPoint,
  end: QuarterPoint,
  pxPerQuarter: number
): { left: number; width: number } {
  const left = quartersBetween(axisStart, start) * pxPerQuarter;
  const width = Math.max(
    (quartersBetween(start, end) + 1) * pxPerQuarter,
    pxPerQuarter
  );
  return { left, width };
}

/**
 * The quarter immediately before a MonthPoint's own quarter -- e.g. March
 * (Q1) rolls back to Q4 of the prior year. Used for the pre-debut filler,
 * which ends the quarter before a line's debut quarter (its debutDate is a
 * MonthPoint, not a QuarterPoint, since it's the character's real-world
 * debut month, not a volume boundary).
 */
export function quarterBeforeMonthPoint(point: MonthPoint): QuarterPoint {
  const quarter = Math.ceil(point.month / 3) as Quarter;
  return quarter === 1
    ? { year: point.year - 1, quarter: 4 }
    : { year: point.year, quarter: (quarter - 1) as Quarter };
}

export function yearRange(startYear: number, endYear: number): number[] {
  const years: number[] = [];
  for (let y = startYear; y <= endYear; y++) years.push(y);
  return years;
}

/** Absolute month index since year 0, January -- used to sort lines by debutDate. */
export function monthIndex(point: MonthPoint): number {
  return point.year * 12 + (point.month - 1);
}

/** e.g. "1962-1963", or just "1962" when start/end fall in the same year --
 * shared between VolumeFormDrawer's own submit and the timeline's drag-to-
 * resize handles (see VolumeTile.tsx), so both keep a volume's stored
 * `yearsCovered` label in sync with its actual start/end. */
export function yearsCoveredLabel(startYear: number, endYear: number): string {
  return startYear === endYear ? String(startYear) : `${startYear}-${endYear}`;
}
