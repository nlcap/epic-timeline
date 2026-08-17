import type { MonthPoint, Quarter, QuarterPoint, TimelineEntry } from "../types";

export const MIN_SWIM_LANES = 1;
export const MAX_SWIM_LANES = 5;

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
// Volume stepper (see VolumeStepper.tsx): gap between the pill's own current
// trailing edge and the panel, and again between the panel and the pill's
// true (reserved) right edge -- see stepperReservePx below.
export const STEPPER_PANEL_GAP_PX = 4;
// Each chevron button's own hit area -- larger than its 16px icon glyph on
// purpose (3px of clickable padding per side instead of dead panel padding/
// gap; started at 2px, widened another 1px per side per Nick's request).
// Panel width/height is exactly two of these with zero gap between them.
export const STEPPER_BUTTON_SIZE_PX = 22;
// Two STEPPER_BUTTON_SIZE_PX buttons, stacked with zero gap either
// direction -- vertical stack at zoom 1-2 keeps the single-button width;
// horizontal at zoom 3 doubles it instead.
export function panelFootprintPx(zoomLevel: ZoomLevel): number {
  return zoomLevel === 3 ? STEPPER_BUTTON_SIZE_PX * 2 : STEPPER_BUTTON_SIZE_PX;
}
// How much wider LineRow should render the sidebar pill than its own label/
// icon content needs, so the stepper panel has a guaranteed home inset
// within the pill's own background (not floating past it over empty space)
// without ever covering the label text -- gap, panel, gap. LineRow scales
// this by labelOpacity so it collapses to zero once the pill is fully
// icon-only, matching the existing "no dead space past the collapsed icon"
// rule (see LineRow.tsx's own collapsed-width comment) rather than
// reserving room for a panel that, in that state, sits directly after the
// icon anyway.
export function stepperReservePx(zoomLevel: ZoomLevel): number {
  return STEPPER_PANEL_GAP_PX + panelFootprintPx(zoomLevel) + STEPPER_PANEL_GAP_PX;
}
// Volume stepper landing (see VolumeStepper.tsx): how far the pill's icon
// is pulled in past the quarter gridline immediately before a stepped-to
// volume, so it overlaps that line instead of stopping exactly on it (the
// original one-full-quarter-of-clearance behavior). Per-zoom because Nick
// is giving direction one level at a time -- only level 1 has a value so
// far; 2 and 3 stay at 0 (i.e. unchanged, full-quarter clearance) until he
// specifies theirs.
export const STEPPER_ICON_OVERLAP_PX_BY_ZOOM: Record<ZoomLevel, number> = { 1: 12, 2: 0, 3: 0 };
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
// No "add volume" hover cell renders within this many px of the timeline
// lane's own leftmost-visible edge -- that edge sits directly under the
// pinned sidebar icon/stepper (see LineRow.tsx), and Nick found himself
// fat-fingering the add-volume "+" there when he meant to hit the stepper
// chevrons instead. Deliberately a leading-edge exclusion of specific
// quarter indexes, not a blocking overlay laid on top of the lane: an
// overlay would have to sit above both the add-cell layer AND real volume/
// gap tiles (they share the same DOM region), so it would just as happily
// swallow clicks on a genuine tile that happens to start in that zone --
// excluding quarter indexes up front only ever removes the add-cell
// affordance itself, never a real tile's own.
//
// Expressed in px, not a flat quarter count, and deliberately set equal to
// ADD_CELL_SCROLL_BUCKET_PX rather than some independent number: the
// leading edge itself is only known approximately (derived from the same
// scrollBucket-coarsened position the cell window already uses, to avoid
// re-rendering LineTimelineLane on every scroll pixel -- see
// [[epic-timeline-scroll-perf-fix]]), which can be off from the true
// current position by up to half a bucket in either direction. A flat
// quarter count picked to be safe at zoom 1 (55px/quarter) turned out to
// still be short of that worst-case drift at zoom 2/3 (31px, 14px/quarter)
// -- reported live by Nick as the "+" still appearing right next to a
// collapsed icon. Matching this to ADD_CELL_SCROLL_BUCKET_PX guarantees the
// blocked zone extends at least a full bucket-width past the approximated
// edge, which by construction always reaches (and clears, with margin) the
// true edge regardless of which direction the approximation drifted.
export const ADD_CELL_LEADING_BLOCKED_PX = ADD_CELL_SCROLL_BUCKET_PX;
// Quarters-to-block scales inversely with pxPerQuarter so the px guarantee
// above holds at every zoom level, not just the one it was tuned against.
export function addCellLeadingBlockedQuarters(pxPerQuarter: number): number {
  return Math.ceil(ADD_CELL_LEADING_BLOCKED_PX / pxPerQuarter);
}

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
 * A line's total row height given its swim-lane count -- the one place the
 * 1-5 clamp and the stacked-lanes formula live. `swimLanes` undefined/1
 * (every collection except Licensed, and Licensed lines that don't opt in)
 * returns `rowHeight` unchanged, so single-lane rows are pixel-identical to
 * before this existed.
 *
 * Every lane's own tile is a FIXED height (rowHeight - 16, the same as a
 * single-lane tile at this zoom level -- see TimelineEntryTile in
 * LineRow.tsx) regardless of laneCount, with an 8px margin above the first
 * lane, 8px below the last, and an 8px gap between each pair of lanes
 * (half the 16px gap between two different lines' rows). This is the sum
 * of that fixed layout, not `rowHeight * lanes` -- that simpler formula
 * padded each tile out to fill an even rowHeight-tall slice, which made
 * multi-lane tiles taller than a single-lane tile at the same zoom level.
 */
export function lineHeight(rowHeight: number, swimLanes: number | undefined): number {
  const lanes = Math.min(MAX_SWIM_LANES, Math.max(MIN_SWIM_LANES, swimLanes ?? 1));
  const tileHeight = rowHeight - 16;
  return lanes * tileHeight + (lanes - 1) * 8 + 16;
}

/**
 * Assigns each entry to a lane index (0-based, < laneCount) so overlapping
 * volumes/gaps land in separate stacked lanes instead of piling on top of
 * each other. Entries must already be sorted by start quarter (true of
 * `entriesByLine` in App.tsx, which every caller here sources from).
 *
 * Two passes:
 * 1. Volumes with a deliberate `swimLanePosition` (see the Licensed volume
 *    form's "Swim lane position" field) are pinned to that lane outright,
 *    in whatever order they appear -- a manual pin always wins regardless
 *    of start time. Two volumes deliberately pinned to the same lane will
 *    still visually overlap if their dates overlap; that's the point of
 *    "deliberate" -- this function doesn't second-guess it.
 * 2. Every other entry (the common case -- nothing outside Licensed ever
 *    sets swimLanePosition) is greedily interval-partitioned into whatever
 *    lanes the pins left free: lowest-indexed lane whose last-placed entry
 *    ends before this one starts, or -- if every lane is currently
 *    occupied, i.e. more concurrent entries than the line's lane budget --
 *    whichever lane's occupant ends soonest. That entry will visually
 *    overlap, an explicit tradeoff of the lane count chosen rather than a
 *    hard cap enforced on the data.
 */
export function assignLanes(entries: TimelineEntry[], laneCount: number): Map<string, number> {
  const lanes = Math.min(MAX_SWIM_LANES, Math.max(MIN_SWIM_LANES, laneCount));
  // Last-occupied quarter index (inclusive) per lane, so far.
  const laneEnds: number[] = new Array(lanes).fill(-Infinity);
  const assignment = new Map<string, number>();

  const pinned: TimelineEntry[] = [];
  const auto: TimelineEntry[] = [];
  for (const entry of entries) {
    const position = entry.kind === "volume" ? entry.swimLanePosition : undefined;
    (position && position >= 1 && position <= lanes ? pinned : auto).push(entry);
  }

  for (const entry of pinned) {
    const lane = (entry as Extract<TimelineEntry, { kind: "volume" }>).swimLanePosition! - 1;
    assignment.set(entry.id, lane);
    laneEnds[lane] = Math.max(laneEnds[lane], quarterIndex(entry.end));
  }

  for (const entry of auto) {
    const startIdx = quarterIndex(entry.start);
    const endIdx = quarterIndex(entry.end);

    let target = laneEnds.findIndex((end) => end < startIdx);
    if (target === -1) {
      // No free lane -- double up on whichever lane frees up soonest.
      target = laneEnds.indexOf(Math.min(...laneEnds));
    }

    assignment.set(entry.id, target);
    laneEnds[target] = Math.max(laneEnds[target], endIdx);
  }

  return assignment;
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

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** e.g. "March 2020" -- for a volume's releaseDate in the detail panel. */
export function formatMonthPoint(point: MonthPoint): string {
  return `${MONTH_NAMES[point.month - 1]} ${point.year}`;
}

/**
 * Whether a release month is still ahead of us -- the detail panel says
 * "Releases March 2027" rather than "Released" for announced volumes that
 * haven't shipped yet. A releaseDate only carries a month, so the current
 * month counts as released: a volume dated this month is as likely to be on
 * shelves already as not, and "Released" is the safer read of the two once
 * the month has started. `now` is injectable for the tests.
 */
export function isFutureMonth(point: MonthPoint, now: Date = new Date()): boolean {
  const current = { year: now.getFullYear(), month: now.getMonth() + 1 };
  return monthIndex(point) > monthIndex(current);
}

/** e.g. "1962-1963", or just "1962" when start/end fall in the same year --
 * shared between VolumeFormDrawer's own submit and the timeline's drag-to-
 * resize handles (see VolumeTile.tsx), so both keep a volume's stored
 * `yearsCovered` label in sync with its actual start/end. */
export function yearsCoveredLabel(startYear: number, endYear: number): string {
  return startYear === endYear ? String(startYear) : `${startYear}-${endYear}`;
}
