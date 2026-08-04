import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Gap, Line, QuarterPoint, TimelineEntry } from "../types";
import {
  ADD_CELL_ICON_SIZE_BY_ZOOM,
  ADD_CELL_SCROLL_BUCKET_PX,
  assignLanes,
  lineHeight,
  quarterBeforeMonthPoint,
  quarterIndex,
  quarterPointFromIndex,
  quartersBetween,
  resizeSpan,
  spanToPx,
  type ZoomLevel,
} from "../lib/timeline";
import { useSidebarPillMetrics } from "../hooks/useSidebarPillMetrics";
import { useEnterTransition } from "../hooks/useEnterTransition";
import { lineIconUrl } from "../lib/era";
import { speculativeTextColor } from "../lib/color";
import { formatLineBreaks } from "../lib/text";
import { VolumeTile } from "./VolumeTile";
import { GapSegment } from "./GapSegment";
import { LineIcon } from "./LineIcon";
import { PreDebutFiller } from "./PreDebutFiller";
import { AddVolumeCell } from "./AddVolumeCell";

// Stable reference for out-of-viewport rows' empty quarter list -- a fresh
// `[]` here would be a new array every render, defeating AddVolumeCellsLayer's
// own memo for every off-screen row the same way `?? []` did for `entries`
// in App.tsx (see EMPTY_ENTRIES there).
const EMPTY_INDEXES: number[] = [];

export function LineRow({
  line,
  entries,
  axisStart,
  focusedId,
  onSelect,
  onEdit,
  onEditGap,
  scrollLeft,
  sidebarWidth,
  rowHeight,
  pillHeight,
  pillIconSize,
  pillIconBorder,
  zoomLevel,
  pxPerQuarter,
  sidebarGap,
  axisWidth,
  scrollBucket,
  addCellWindowQuarters,
  inViewport,
  onAddVolumeAt,
  speculative = false,
  locked = false,
  speculativeVolumeIds,
  exiting = false,
  skipEnterTransition = false,
  onResizeEntry,
}: {
  line: Line;
  entries: TimelineEntry[];
  axisStart: QuarterPoint;
  focusedId: string | null;
  onSelect: (volumeId: string) => void;
  onEdit: (line: Line) => void;
  onEditGap: (gap: Gap) => void;
  scrollLeft: number;
  sidebarWidth: number;
  rowHeight: number;
  pillHeight: number;
  pillIconSize: number;
  pillIconBorder: number;
  zoomLevel: ZoomLevel;
  pxPerQuarter: number;
  sidebarGap: number;
  /** Full rendered width (px) of the timeline lanes -- same value used to
   * size TimelineGrid/TimelineAxis, so the hover "add volume" cells cover
   * exactly the visible quarter range and stay pixel-aligned with them. */
  axisWidth: number;
  /** scrollLeft coarsened into ADD_CELL_SCROLL_BUCKET_PX-wide buckets --
   * used only to window which quarters get hover "add volume" cells, so it
   * only changes (and only re-renders the memoized lane below) every so
   * often instead of on every pixel of scroll. */
  scrollBucket: number;
  /** How many quarters (centered on scroll position) get hover "add volume"
   * cells -- computed in App.tsx from the timeline scroll container's
   * actual measured width (see addCellWindowQuarters in lib/timeline.ts),
   * not a flat constant, since the quarter count needed to cover a given
   * viewport is zoom-dependent. */
  addCellWindowQuarters: number;
  /** Whether this row is on screen (± a small buffer), from
   * useVisibleRowRange in App.tsx -- when false, LineTimelineLane skips
   * building its hover "add volume" cell layer entirely (by far the
   * dominant DOM cost per row, see lib/timeline.ts), since it's invisible
   * and unreachable anyway. Only gates that layer, not the row itself or
   * its pill -- this component (and its enter/exit fade transition) stays
   * mounted regardless, so scrolling a row in and out of view can never
   * replay or interrupt its animation. */
  inViewport: boolean;
  /** Shortcut to add a volume on this line starting at a specific quarter
   * -- fired by clicking an empty quarter's hover cell. */
  onAddVolumeAt: (line: Line, start: QuarterPoint) => void;
  /** Speculation Mode: this line itself was created via "Add Speculative
   * Line" -- placeholder neutral-500 border on the pill. Independent of
   * which individual volumes on it are speculative (an official line can
   * host speculative volumes too -- see speculativeVolumeIds). */
  speculative?: boolean;
  /** Speculation Mode: this is an official line while Speculation Mode is
   * on -- reserves a styling hook, no treatment yet. Editing still opens
   * (clicking the pill always works, so "Add Volume" stays reachable to
   * speculate a new volume onto this official line); LineFormDrawer is the
   * one that actually locks the editable fields. */
  locked?: boolean;
  /** Ids of volumes/gaps that are speculative, regardless of which line
   * they're attached to -- an official line can host newly-speculated
   * volumes alongside its untouched official ones. */
  speculativeVolumeIds?: Set<string>;
  /** This line is being removed (e.g. Speculation Mode just toggled off)
   * but is being kept mounted a little longer by useExitingLines so it can
   * play the reverse of its entrance transition instead of vanishing
   * instantly. */
  exiting?: boolean;
  /** True only on the render a collection tab switch first mounts this
   * row -- skips the enter fade/rise entirely (see useEnterTransition) so
   * an unrelated collection's lines appear instantly instead of all
   * animating in at once, which read as a stall rather than a transition. */
  skipEnterTransition?: boolean;
  /** Drag-to-resize commit: called once, on mouseup, with the entry's new
   * start/end after dragging one of its edge handles (see VolumeTile.tsx /
   * GapSegment.tsx -- both volumes and gaps resize the same way). Omit to
   * disable resizing entirely. */
  onResizeEntry?: (entry: TimelineEntry, start: QuarterPoint, end: QuarterPoint) => void;
}) {
  // Collapsed width matches the icon exactly (not padded) -- the icon
  // already overflows the pill by a fixed 4px on the left via -ml-3 below,
  // so a width equal to the icon leaves it sitting flush against the
  // collapsed pill's right edge with no dead space hanging off past it.
  const pillRef = useRef<HTMLButtonElement>(null);
  const { hovered, setHovered, pillWidth, labelOpacity, collapseProgress } = useSidebarPillMetrics(
    scrollLeft,
    sidebarWidth,
    pillIconSize,
    pillRef
  );
  // Tile background fades out as the pill collapses to icon-only on scroll,
  // going fully transparent once collapsed -- hovering always shows the same
  // solid neutral-800 it always has, just crossfading into it instead of
  // snapping (background-color is already in the transition list below).
  const pillBackground = hovered
    ? "rgb(38, 38, 38)"
    : `rgba(23, 23, 23, ${1 - collapseProgress})`;
  // Speculative line pill's neutral-500 outline fades out in lockstep with
  // the background/label above -- otherwise it's the one piece left
  // floating around the bare icon once everything else has collapsed away.
  const pillBorderColor = `rgba(115, 115, 115, ${hovered ? .3 : .3 - collapseProgress})`;

  // Freshly-mounted rows (e.g. a speculative line the toggle just revealed)
  // fade and rise into place instead of popping straight in -- an already-
  // mounted row never remounts just because Speculation Mode toggles or the
  // array reorders (React matches on key), so this only ever plays for
  // genuinely new rows. `skipEnterTransition` opts a row out of this for
  // one specific case: every row mounting because the user just switched
  // collection tabs (see useEnterTransition) -- those should appear
  // instantly, not all animate in together. `exiting` (set by
  // useExitingLines once this line drops out of the visible list, e.g.
  // Speculation Mode toggling off) forces the same hidden state back on,
  // reusing the entrance transition in reverse -- the duration here must
  // match the exitDurationMs passed to useExitingLines in App.tsx, or the
  // row gets cut off mid-fade.
  const entered = useEnterTransition(skipEnterTransition);
  const visible = entered && !exiting;

  // A 2+ swim-lane line (Licensed collection only, see LineFormDrawer's
  // "Swim lanes" field) gets a pill that expands to cover the full stacked
  // height instead of staying pinned to the single-lane pillHeight, with
  // its optional description shown below the title -- see the Figma
  // reference this was built from. A single-lane line (every line outside
  // Licensed, and any Licensed line that doesn't opt into extra lanes)
  // keeps today's fixed-height, title-only pill untouched.
  const isMultiLane = (line.swimLanes ?? 1) >= 2;
  const effectivePillHeight = isMultiLane
    ? lineHeight(rowHeight, line.swimLanes) - 16
    : pillHeight;
  // Licensed multi-lane pills fade their background to transparent behind
  // the icon instead of a flat fill (see the Figma reference) -- solid
  // pillBackground from the right edge until just past the icon's own box,
  // then an even fade to fully transparent at the pill's left edge, where
  // the icon (offset -ml-3 below) overflows past the pill's own background
  // entirely. Fade width matches pillIconSize exactly, in px rather than %,
  // so it always lands on the icon regardless of the pill's own width.
  // Single-lane pills (every line outside Licensed, and any Licensed line
  // that doesn't opt into extra lanes) keep today's flat fill untouched.
  const useIconFadeGradient = line.collectionId === "marvel-licensed-epic" && isMultiLane;

  return (
    <div
      className={`flex transition-[opacity,transform] duration-500 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
      }`}
      style={{ gap: sidebarGap }}
    >
      <div
        className="relative flex shrink-0 items-center"
        style={{ width: sidebarWidth, height: lineHeight(rowHeight, line.swimLanes) }}
      >
        <button
          ref={pillRef}
          type="button"
          onClick={() => onEdit(line)}
          data-official-locked={locked ? "" : undefined}
          // No overflow set here on purpose -- `overflow-x-hidden` alone would
          // force overflow-y to compute as `auto` (an overflow spec quirk when
          // only one axis is non-visible), clipping the icon's vertical
          // overflow. Horizontal clipping during the width-collapse animation
          // comes from the label's own `truncate` below instead: an element
          // with its own non-visible overflow gets an automatic flex
          // min-width of 0, so it shrinks and ellipsizes without the parent
          // needing to clip anything.
          className={`relative z-20 flex items-center rounded-lg px-2 text-left transition-[width,background-color,border-color,box-shadow] duration-150 ease-out ${
            speculative ? "border" : ""
          }`}
          style={{
            width: pillWidth,
            height: effectivePillHeight,
            // Gap collapses with the label instead of staying reserved --
            // otherwise the icon-only pill overflows its own width and gets
            // clipped asymmetrically by `overflow-hidden`.
            gap: 12 * labelOpacity,
            transform: `translateX(${scrollLeft}px)`,
            // Tied to hover, not collapseProgress -- the pill's background
            // already fades to fully transparent on scroll (see
            // pillBackground above), so a shadow that scaled with
            // collapseProgress instead just left a shadow with no visible
            // box under it once collapsed. The icon below carries its own
            // small always-on shadow instead, so collapsed (icon-only)
            // pills still read as sitting above the timeline.
            boxShadow: hovered ? "0 6px 24px 4px rgba(0, 0, 0, 0.2)" : "none",
            backgroundColor: useIconFadeGradient ? undefined : pillBackground,
            backgroundImage: useIconFadeGradient
              ? `linear-gradient(to left, ${pillBackground}, ${pillBackground} calc(100% - ${pillIconSize}px), transparent 100%)`
              : undefined,
            borderColor: speculative ? pillBorderColor : undefined,
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <span
            // Sized to overflow the pill top/bottom (a constant 4px per side
            // at levels 1-2, since icon = pill + 8px there; level 3 instead
            // maximizes icon size to close the gap between stacked sidebar
            // icons -- see SIDEBAR_ICON_SIZE_BY_ZOOM). The negative left
            // margin pulls it past the button's px-2 padding for a fixed
            // 4px overflow on the left edge at every level, independent of
            // icon size (it's a flat offset, not derived from the icon/pill
            // difference).
            className="-ml-3 flex shrink-0 items-center justify-center overflow-hidden rounded-full text-white"
            style={{
              height: pillIconSize,
              width: pillIconSize,
              borderWidth: pillIconBorder,
              borderColor: line.colorHex,
              borderStyle: "solid",
              // Always on (not tied to hover/collapse like the pill's own
              // shadow above) -- the icon is the one thing still visible
              // once a pill collapses to icon-only on scroll, so it needs
              // its own separation from the timeline regardless of hover
              // state.
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.5)",
            }}
          >
            <LineIcon iconUrl={lineIconUrl(line)} />
          </span>
          {isMultiLane && line.description ? (
            <span
              className="flex min-w-0 flex-col justify-center gap-0.5 transition-opacity duration-150 ease-out"
              style={{ opacity: labelOpacity }}
            >
              <span
                className={`truncate text-sm font-semibold ${speculative ? "" : "text-white"}`}
                style={{ color: speculative ? speculativeTextColor(line.colorHex) : undefined }}
              >
                {line.name}
              </span>
              <span className="line-clamp-2 whitespace-pre-line text-xs italic leading-snug text-neutral-400">
                {formatLineBreaks(line.description)}
              </span>
            </span>
          ) : (
            <span
              className={`truncate text-sm font-semibold transition-opacity duration-150 ease-out ${
                speculative ? "" : "text-white"
              }`}
              style={{
                opacity: labelOpacity,
                color: speculative ? speculativeTextColor(line.colorHex) : undefined,
              }}
            >
              {line.name}
            </span>
          )}
        </button>
      </div>
      <LineTimelineLane
        line={line}
        entries={entries}
        axisStart={axisStart}
        axisWidth={axisWidth}
        pxPerQuarter={pxPerQuarter}
        zoomLevel={zoomLevel}
        rowHeight={rowHeight}
        focusedId={focusedId}
        onSelect={onSelect}
        onEditGap={onEditGap}
        onAddVolumeAt={onAddVolumeAt}
        locked={locked}
        speculativeVolumeIds={speculativeVolumeIds}
        scrollBucket={scrollBucket}
        addCellWindowQuarters={addCellWindowQuarters}
        inViewport={inViewport}
        onResizeEntry={onResizeEntry}
      />
    </div>
  );
}

/**
 * Everything in a line's row except the sidebar pill, split out and memoized
 * so it doesn't re-render on scroll -- unlike the pill (which needs
 * scrollLeft for its translateX compensation), nothing else here depends on
 * scroll position, but a row can carry hundreds of hover "add volume" cells
 * (see AddVolumeCell.tsx), and re-reconciling that many elements on every
 * scroll tick across every row was the actual source of scroll lag. The
 * cells are additionally windowed around scrollBucket (a coarsened
 * scrollLeft, changing only every ADD_CELL_SCROLL_BUCKET_PX) rather than
 * spanning the full axis width, since a wide collection's worth of extra
 * DOM nodes has its own paint/layout cost even when React itself isn't
 * re-rendering them. Callers must pass stable references for object/
 * function props (axisStart, onAddVolumeAt) or this memo does nothing --
 * see the comment in App.tsx where they're created.
 */
const LineTimelineLane = memo(function LineTimelineLane({
  line,
  entries,
  axisStart,
  axisWidth,
  pxPerQuarter,
  zoomLevel,
  rowHeight,
  focusedId,
  onSelect,
  onEditGap,
  onAddVolumeAt,
  locked,
  speculativeVolumeIds,
  scrollBucket,
  addCellWindowQuarters,
  inViewport,
  onResizeEntry,
}: {
  line: Line;
  entries: TimelineEntry[];
  axisStart: QuarterPoint;
  axisWidth: number;
  pxPerQuarter: number;
  zoomLevel: ZoomLevel;
  rowHeight: number;
  focusedId: string | null;
  onSelect: (volumeId: string) => void;
  onEditGap: (gap: Gap) => void;
  onAddVolumeAt: (line: Line, start: QuarterPoint) => void;
  locked: boolean;
  speculativeVolumeIds?: Set<string>;
  scrollBucket: number;
  addCellWindowQuarters: number;
  inViewport: boolean;
  onResizeEntry?: (entry: TimelineEntry, start: QuarterPoint, end: QuarterPoint) => void;
}) {
  // Drag-to-resize (see VolumeTile.tsx's edge handles): dragStartXRef holds
  // the mousedown clientX so mousemove can compute a running pixel delta
  // without needing to reset the window listeners on every tick; the delta
  // is only turned into whole quarters (and pushed into resizeDrag, the
  // piece that actually drives re-renders) once it crosses a quarter's
  // width, which is also what the live preview below renders from.
  const [resizeDrag, setResizeDrag] = useState<{
    entryId: string;
    edge: "start" | "end";
    deltaQuarters: number;
  } | null>(null);
  const dragStartXRef = useRef(0);
  const isResizing = resizeDrag !== null;

  // Takes entryId (not the Volume itself) and no closed-over per-entry
  // state, so this stays a single stable reference passed unchanged to
  // every TimelineEntryTile below -- if it captured `entry` per iteration
  // instead, every entry's onResizeStart prop would be a fresh function on
  // every render, defeating that component's memo for the whole row.
  const handleResizeStart = useCallback((entryId: string, edge: "start" | "end", clientX: number) => {
    dragStartXRef.current = clientX;
    setResizeDrag({ entryId, edge, deltaQuarters: 0 });
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const deltaQuarters = Math.round((e.clientX - dragStartXRef.current) / pxPerQuarter);
      setResizeDrag((prev) => (prev ? { ...prev, deltaQuarters } : prev));
    };
    const handleMouseUp = () => {
      setResizeDrag((prev) => {
        if (prev && onResizeEntry) {
          // Gaps resize exactly like volumes -- same live-preview math, same
          // commit shape, entry.kind just decides what App.tsx updates.
          const entry = entries.find((e) => e.id === prev.entryId);
          if (entry && prev.deltaQuarters !== 0) {
            const { start, end } = resizeSpan(entry.start, entry.end, prev.edge, prev.deltaQuarters);
            onResizeEntry(entry, start, end);
          }
        }
        return null;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "ew-resize";
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
    };
  }, [isResizing, pxPerQuarter, entries, onResizeEntry]);
  // Pre-debut filler: not stored data, just derived every render from the
  // line's own debutDate vs. the visible timeline's start -- spans
  // [axisStart, the quarter before the debut quarter]. Skipped when the
  // line already existed at or before axisStart (nothing to fill).
  const preDebutEnd = quarterBeforeMonthPoint(line.debutDate);
  const showPreDebutFiller = quartersBetween(axisStart, preDebutEnd) >= 0;

  // Which lane (0-based) each entry renders in -- see assignLanes for the
  // greedy interval-partitioning that keeps overlapping entries apart.
  // `entries` is already sorted by start quarter (see entriesByLine in
  // App.tsx), which the algorithm requires. A no-op (every entry lands in
  // lane 0) for the swimLanes-undefined/1 case, i.e. every line outside the
  // Licensed collection today.
  const laneAssignment = useMemo(
    () => assignLanes(entries, line.swimLanes ?? 1),
    [entries, line.swimLanes]
  );
  const totalHeight = lineHeight(rowHeight, line.swimLanes);

  // Hover "add volume" cells: one per empty quarter within a window
  // centered on the current scroll position (not the whole axis width --
  // a wide collection can be tens of thousands of px across, and rendering
  // a cell for every one of its quarters on every row adds up), skipping
  // any quarter a volume or gap tile already covers -- a real tile's own
  // click/hover always takes priority over these, and they never render
  // where one already sits.
  const addCellIconSize = ADD_CELL_ICON_SIZE_BY_ZOOM[zoomLevel];
  const emptyQuarterIndexes = useMemo(() => {
    // Row is scrolled out of view (± a small buffer -- see
    // useVisibleRowRange): skip building the list entirely. These cells
    // are invisible until hovered and a user can't hover an off-screen
    // row, so there's nothing to compute for it.
    if (!inViewport) return EMPTY_INDEXES;

    const axisStartIdx = quarterIndex(axisStart);
    const totalQuarters = Math.round(axisWidth / pxPerQuarter);
    const axisEndIdxExclusive = axisStartIdx + totalQuarters;

    // Window width in quarters is sized from the actual measured viewport
    // (see addCellWindowQuarters in lib/timeline.ts), not a flat constant --
    // a pixel-wide window would pack in far more cells at zoomed-out levels,
    // and a flat quarter count sized for zoomed-out coverage is wastefully
    // oversized at zoomed-in levels (see App.tsx for the measurement).
    const centerQuarterIdx =
      axisStartIdx + Math.round((scrollBucket * ADD_CELL_SCROLL_BUCKET_PX) / pxPerQuarter);
    const windowStartIdx = Math.max(
      axisStartIdx,
      centerQuarterIdx - Math.floor(addCellWindowQuarters / 2)
    );
    const windowEndIdxExclusive = Math.min(
      axisEndIdxExclusive,
      centerQuarterIdx + Math.ceil(addCellWindowQuarters / 2)
    );

    const occupied = entries.map((entry) => [
      quarterIndex(entry.start),
      quarterIndex(entry.end),
    ]);
    const indexes: number[] = [];
    for (let q = windowStartIdx; q < windowEndIdxExclusive; q++) {
      if (!occupied.some(([start, end]) => q >= start && q <= end)) {
        indexes.push(q);
      }
    }
    return indexes;
  }, [axisStart, axisWidth, pxPerQuarter, entries, scrollBucket, addCellWindowQuarters, inViewport]);

  return (
    <div className="relative flex-1" style={{ height: totalHeight }}>
      {showPreDebutFiller && (() => {
        const { left, width } = spanToPx(axisStart, axisStart, preDebutEnd, pxPerQuarter);
        return (
          <div
            className="absolute"
            style={{
              left: left + 1,
              width: Math.max(width - 1, 0),
              top: 8,
              height: totalHeight - 16,
            }}
          >
            <PreDebutFiller />
          </div>
        );
      })()}
      {entries.map((entry) => {
        // While this entry's handle is being dragged, render from a live
        // override span instead of its stored start/end -- resizeSpan is
        // the same clamp math the mouseup commit uses, so the box the user
        // sees mid-drag matches exactly what gets saved when they let go.
        // For every OTHER entry, renderStart/renderEnd are just entry.start/
        // entry.end themselves (same object references, not copies) -- that
        // reference stability is what lets TimelineEntryTile's memo bail out
        // for the rest of the row while only the dragged tile re-renders.
        const isBeingResized = resizeDrag?.entryId === entry.id;
        const { start: renderStart, end: renderEnd } = isBeingResized
          ? resizeSpan(entry.start, entry.end, resizeDrag!.edge, resizeDrag!.deltaQuarters)
          : entry;
        const entryLocked = locked && !speculativeVolumeIds?.has(entry.id);
        return (
          <TimelineEntryTile
            key={entry.id}
            entry={entry}
            line={line}
            axisStart={axisStart}
            pxPerQuarter={pxPerQuarter}
            rowHeight={rowHeight}
            laneIndex={laneAssignment.get(entry.id) ?? 0}
            zoomLevel={zoomLevel}
            focused={focusedId === entry.id}
            onSelect={onSelect}
            onEditGap={onEditGap}
            speculative={speculativeVolumeIds?.has(entry.id) ?? false}
            locked={entryLocked}
            onResizeStart={entryLocked || !onResizeEntry ? undefined : handleResizeStart}
            renderStart={renderStart}
            renderEnd={renderEnd}
          />
        );
      })}
      <AddVolumeCellsLayer
        line={line}
        axisStart={axisStart}
        pxPerQuarter={pxPerQuarter}
        indexes={emptyQuarterIndexes}
        iconSize={addCellIconSize}
        onAddVolumeAt={onAddVolumeAt}
      />
    </div>
  );
});

/**
 * One volume/gap tile, memoized so a resize drag (which changes state on
 * every mousemove) only re-renders the ONE entry actually being dragged --
 * without this boundary, every entry in the row would reconcile on every
 * tick just because its sibling's box moved, which was the actual source of
 * drag lag on rows with a lot of content. `onResizeStart` takes entryId as
 * an argument (see LineRow's handleResizeStart) rather than closing over a
 * specific entry, so the SAME stable function reference passes unchanged to
 * every tile -- a fresh per-entry closure here would defeat this memo for
 * the whole row on every render, the same trap the callback avoids.
 */
const TimelineEntryTile = memo(function TimelineEntryTile({
  entry,
  line,
  axisStart,
  pxPerQuarter,
  rowHeight,
  laneIndex,
  zoomLevel,
  focused,
  onSelect,
  onEditGap,
  speculative,
  locked,
  onResizeStart,
  renderStart,
  renderEnd,
}: {
  entry: TimelineEntry;
  line: Line;
  axisStart: QuarterPoint;
  pxPerQuarter: number;
  /** Single-lane row height (per zoom level) -- one lane's worth, not the
   * line's total (possibly multi-lane) height. */
  rowHeight: number;
  /** 0-based lane this entry renders in -- see assignLanes in
   * lib/timeline.ts. Always 0 for a single-lane line. */
  laneIndex: number;
  zoomLevel: ZoomLevel;
  focused: boolean;
  onSelect: (volumeId: string) => void;
  onEditGap: (gap: Gap) => void;
  speculative: boolean;
  locked: boolean;
  onResizeStart?: (entryId: string, edge: "start" | "end", clientX: number) => void;
  renderStart: QuarterPoint;
  renderEnd: QuarterPoint;
}) {
  const { left, width } = spanToPx(axisStart, renderStart, renderEnd, pxPerQuarter);
  // Every lane's tile is the same fixed height as a single-lane tile at
  // this zoom level (rowHeight - 16) no matter how many lanes the line
  // has -- lineHeight in lib/timeline.ts sizes the line's total row to
  // match this exactly (an 8px margin above the first lane, 8px below the
  // last, 8px between each pair of lanes), so there's no leftover space to
  // stretch tiles into. laneIndex === 0 (every single-lane line) reduces to
  // top: 8, pixel-identical to before swim lanes existed.
  const tileHeight = rowHeight - 16;
  const top = 8 + laneIndex * (tileHeight + 8);
  return (
    <div
      className="absolute"
      style={{
        left: left + 1,
        width: Math.max(width - 1, 0),
        top,
        height: tileHeight,
      }}
    >
      {entry.kind === "volume" ? (
        <VolumeTile
          volume={entry}
          line={line}
          focused={focused}
          onClick={() => onSelect(entry.id)}
          zoomLevel={zoomLevel}
          speculative={speculative}
          locked={locked}
          onResizeStart={
            onResizeStart ? (edge, clientX) => onResizeStart(entry.id, edge, clientX) : undefined
          }
        />
      ) : (
        <GapSegment
          gap={entry}
          line={line}
          zoomLevel={zoomLevel}
          locked={locked}
          onClick={() => onEditGap(entry)}
          onResizeStart={
            onResizeStart ? (edge, clientX) => onResizeStart(entry.id, edge, clientX) : undefined
          }
        />
      )}
    </div>
  );
});

/**
 * All of a row's hover "add volume" cells, memoized as one group and
 * separate from TimelineEntryTile above -- none of its props ever change
 * during a resize drag (emptyQuarterIndexes only depends on scrollBucket/
 * entries/etc., never on drag state), so this whole layer -- easily the
 * bulk of a row's DOM nodes at zoomed-out levels -- correctly bails out of
 * re-rendering entirely while a tile elsewhere in the row is being dragged.
 */
const AddVolumeCellsLayer = memo(function AddVolumeCellsLayer({
  line,
  axisStart,
  pxPerQuarter,
  indexes,
  iconSize,
  onAddVolumeAt,
}: {
  line: Line;
  axisStart: QuarterPoint;
  pxPerQuarter: number;
  indexes: number[];
  iconSize: number;
  onAddVolumeAt: (line: Line, start: QuarterPoint) => void;
}) {
  const axisStartIdx = quarterIndex(axisStart);
  return (
    <>
      {indexes.map((q) => (
        <div
          key={q}
          className="absolute inset-y-2"
          style={{
            left: (q - axisStartIdx) * pxPerQuarter + 1,
            width: Math.max(pxPerQuarter - 1, 0),
          }}
        >
          <AddVolumeCell
            iconSize={iconSize}
            onClick={() => onAddVolumeAt(line, quarterPointFromIndex(q))}
          />
        </div>
      ))}
    </>
  );
});
