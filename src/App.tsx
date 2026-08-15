import { useCallback, useEffect, useMemo, useRef, useState, type UIEvent } from "react";
import { COLLECTIONS } from "./data/collections";
import { COLLECTION_DATA } from "./data/collectionData";
import type { Line, QuarterPoint, TimelineEntry, Volume } from "./types";
import { CollectionBanner } from "./components/CollectionBanner";
import { TopNav, NAV_HEIGHT } from "./components/TopNav";
import { TimelineAxis } from "./components/TimelineAxis";
import { EraBar, ERA_BAR_COLLAPSED_HEIGHT, ERA_BAR_HEIGHT } from "./components/EraBar";
import { TimelineGrid } from "./components/TimelineGrid";
import { LineRow } from "./components/LineRow";
import { AddLineButton } from "./components/AddLineButton";
import { LineFormDrawer } from "./components/LineFormDrawer";
import { VolumeFormDrawer } from "./components/VolumeFormDrawer";
import { VolumeDetailPanel } from "./components/VolumeDetailPanel";
import { ZoomControl } from "./components/ZoomControl";
import { SpeculationModeToggle } from "./components/SpeculationModeToggle";
import { useOwnership } from "./hooks/useOwnership";
import { useReadingStatus } from "./hooks/useReadingStatus";
import { useSidebarWidth } from "./hooks/useSidebarWidth";
import { useLineOverrides } from "./hooks/useLineOverrides";
import { useVolumeOverrides } from "./hooks/useVolumeOverrides";
import { useSpeculativeLines } from "./hooks/useSpeculativeLines";
import { useSpeculativeVolumes } from "./hooks/useSpeculativeVolumes";
import { useExitingLines } from "./hooks/useExitingLines";
import { useVisibleRowRange } from "./hooks/useVisibleRowRange";
import { useAddVolumeCellHover } from "./hooks/useAddVolumeCellHover";
import { hexToRgba, SPECULATION_ACCENT_HEX } from "./lib/color";
import { safeSetItem } from "./lib/storage";
import { useEraBarCollapseProgress } from "./hooks/useEraBarCollapseProgress";
import {
  ADD_CELL_SCROLL_BUCKET_PX,
  addCellWindowQuarters,
  AXIS_HEIGHT,
  DEFAULT_ZOOM_LEVEL,
  MAX_ZOOM_LEVEL,
  MIN_ZOOM_LEVEL,
  PX_PER_QUARTER_BY_ZOOM,
  lineHeight,
  ROW_HEIGHT_BY_ZOOM,
  SIDEBAR_GAP_BY_ZOOM,
  SIDEBAR_ICON_BORDER_BY_ZOOM,
  SIDEBAR_ICON_SIZE_BY_ZOOM,
  SIDEBAR_PILL_HEIGHT_BY_ZOOM,
  monthIndex,
  stepperReservePx,
  yearsCoveredLabel,
  type ZoomLevel,
} from "./lib/timeline";

// Stable fallback for lines with no entries -- `entriesByLine.get(id) ?? []`
// would otherwise create a brand-new array every render for any such line,
// silently defeating LineTimelineLane's memo (a new array is a new prop
// reference as far as React.memo's shallow comparison is concerned) and
// forcing that line's full row -- including every hover "add volume" cell
// in it -- to re-render on every scroll tick, not just when its own data
// actually changes. A line-heavy Speculation Mode session (many freshly
// added lines with no volumes yet) makes this the dominant cost.
const EMPTY_ENTRIES: TimelineEntry[] = [];

const ACTIVE_COLLECTION_STORAGE_KEY = "epic-timeline:active-collection";

// Reads back whichever tab the user was last on, so a refresh keeps them
// there instead of bouncing to the first tab. Falls back to COLLECTIONS[0]
// whenever the stored id doesn't match a real collection -- unset,
// corrupted, or (if a collection is ever renamed/removed) stale from an
// older build.
function loadStoredCollectionId(): string {
  try {
    const stored = localStorage.getItem(ACTIVE_COLLECTION_STORAGE_KEY);
    if (stored && COLLECTIONS.some((c) => c.id === stored)) {
      return stored;
    }
  } catch {
    // Storage unavailable (e.g. private browsing) -- fall through to default.
  }
  return COLLECTIONS[0].id;
}

export default function App() {
  // First tab in the nav (COLLECTIONS[0], "Epic Collection") rather than a
  // second hardcoded id -- stays correct automatically if that order ever
  // changes instead of silently drifting out of sync with it.
  const [activeCollectionId, setActiveCollectionId] = useState(loadStoredCollectionId);
  const [selectedVolumeId, setSelectedVolumeId] = useState<string | null>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  // Volume stepper (see handleStepScroll below): true for the duration of a
  // chevron-triggered smooth scroll. Every sidebar pill stays pinned during
  // scroll via `transform: translateX(scrollLeft)`, recomputed from React
  // state on each 'scroll' event rather than natively -- during a native
  // smooth-scroll animation that recomputation can lag the browser's own
  // paint by a frame, "bobbing" the pinned pill a few px around its intended
  // position for the animation's duration. If the user's cursor is parked
  // right at the icon/panel boundary (typical right after clicking a
  // chevron, since the panel sits immediately past the icon), that bob is
  // enough to sweep the icon under a cursor that never moved, firing a real
  // browser mouseenter and puffing it open mid-scroll -- reported by Nick
  // scrolling backward on the Joker line. Threading this down to gate
  // LineRow's hover handlers freezes `hovered` at whatever it already was
  // for the animation's duration, so a stationary cursor can't trigger a
  // spurious expand/collapse from the pinning math's own jitter.
  const [stepScrolling, setStepScrolling] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(DEFAULT_ZOOM_LEVEL);
  const [addLineOpen, setAddLineOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<Line | null>(null);
  const [addVolumeForLineId, setAddVolumeForLineId] = useState<string | null>(null);
  // Set alongside addVolumeForLineId only when opened via a quarter's hover
  // "add volume" cell -- pre-fills VolumeFormDrawer's start quarter instead
  // of leaving it blank.
  const [addVolumeDefaultStart, setAddVolumeDefaultStart] = useState<QuarterPoint | null>(
    null
  );
  const [editingEntry, setEditingEntry] = useState<TimelineEntry | null>(null);
  // Global -- one toggle controls Speculation Mode across every collection
  // tab at once (the speculative content it reveals is still scoped per
  // tab via the hooks below).
  const [speculationMode, setSpeculationMode] = useState(false);
  // Global -- nav search box; filters the displayed lines by title (see
  // searchFilteredLines below).
  const [searchQuery, setSearchQuery] = useState("");
  const { getStatus, setStatus } = useOwnership();
  const { getStatus: getReadingStatus, setStatus: setReadingStatus } = useReadingStatus();
  const { upsertLine, deleteLine, resolveLines } = useLineOverrides();
  const { upsertVolume, deleteVolume, resolveEntries } = useVolumeOverrides();
  const {
    upsertLine: upsertSpeculativeLine,
    deleteLine: deleteSpeculativeLine,
    resolveLines: resolveSpeculativeLines,
  } = useSpeculativeLines();
  const {
    upsertVolume: upsertSpeculativeVolume,
    deleteVolume: deleteSpeculativeVolume,
    resolveEntries: resolveSpeculativeEntries,
  } = useSpeculativeVolumes();
  // Only DC Finest has an era bar -- computed here (rather than down by
  // `collection`/`data` below, closer to where it's otherwise used) so it's
  // available to gate useEraBarCollapseProgress, which needs it before that
  // point.
  const isDcFinest = activeCollectionId === "dc-finest";
  const eraBarAnchorRef = useRef<HTMLDivElement>(null);
  const eraBarCollapseProgress = useEraBarCollapseProgress(eraBarAnchorRef, isDcFinest);

  const handleTimelineScroll = (e: UIEvent<HTMLDivElement>) => {
    setScrollLeft(e.currentTarget.scrollLeft);
  };

  // Measures the timeline scroll container's actual on-screen width so the
  // hover "add volume" cell window (see addCellWindowQuarters) can be sized
  // from real viewport coverage instead of a static guess -- see
  // lib/timeline.ts for why a flat quarter count doesn't work across zoom
  // levels. ResizeObserver (not just a mount-time read) so it stays correct
  // if the window itself resizes.
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const [timelineViewportWidth, setTimelineViewportWidth] = useState(0);
  useEffect(() => {
    const el = timelineScrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setTimelineViewportWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Every keystroke can shift the trimmed axis range (see axisStart/axisEnd
  // above), so the old scroll offset would otherwise keep pointing at
  // whatever used to be there -- possibly empty space now that the axis
  // starts somewhere else. Snapping back to the left edge on each change
  // keeps the newly-trimmed match(es) actually in view instead of making
  // the user rescroll after every character.
  useEffect(() => {
    setScrollLeft(0);
    if (timelineScrollRef.current) {
      timelineScrollRef.current.scrollLeft = 0;
    }
  }, [searchQuery]);

  // Functional updates -- guards against stale-closure double-steps if two
  // zoom clicks land in the same render cycle.
  const zoomIn = () =>
    setZoomLevel((l) => (l > MIN_ZOOM_LEVEL ? ((l - 1) as ZoomLevel) : l));
  const zoomOut = () =>
    setZoomLevel((l) => (l < MAX_ZOOM_LEVEL ? ((l + 1) as ZoomLevel) : l));

  const collection = COLLECTIONS.find((c) => c.id === activeCollectionId)!;
  const data = COLLECTION_DATA[activeCollectionId];

  const lines = useMemo(
    () =>
      resolveLines(activeCollectionId, data?.lines ?? []).sort(
        (a, b) => monthIndex(a.debutDate) - monthIndex(b.debutDate)
      ),
    [data, resolveLines, activeCollectionId]
  );

  const speculativeLines = useMemo(
    () =>
      resolveSpeculativeLines(activeCollectionId).sort(
        (a, b) => monthIndex(a.debutDate) - monthIndex(b.debutDate)
      ),
    [resolveSpeculativeLines, activeCollectionId]
  );
  const speculativeLineIdSet = useMemo(
    () => new Set(speculativeLines.map((l) => l.id)),
    [speculativeLines]
  );

  // Official lines stay visible (read-only) while Speculation Mode is on --
  // speculative lines are additional entries merged in, not a replacement.
  const visibleLines = useMemo(() => {
    if (!speculationMode) return lines;
    return [...lines, ...speculativeLines].sort(
      (a, b) => monthIndex(a.debutDate) - monthIndex(b.debutDate)
    );
  }, [speculationMode, lines, speculativeLines]);

  // Search filters by line title only.
  const searchFilteredLines = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length < 1) return visibleLines;
    return visibleLines.filter((l) => l.name.toLowerCase().includes(query));
  }, [visibleLines, searchQuery]);

  const sidebarWidth = useSidebarWidth(searchFilteredLines);
  // Volume stepper (see VolumeStepper.tsx): the sidebar column's actual
  // allocated width -- wider than the pill's own content needs (sidebarWidth
  // above) by stepperReservePx, so the stepper panel has guaranteed room
  // without the (now-wider) line pills bleeding past this column's own
  // boundary into the timeline grid. Everything that needs to stay visually
  // aligned with the pills' right edge -- the grid lines, the sticky axis
  // header, and the "Add Line" button -- uses this, not the raw sidebarWidth.
  // LineRow still receives raw sidebarWidth too (for useSidebarPillMetrics'
  // own pillWidth-at-rest math, which must NOT double-count the reserve).
  const sidebarColumnWidth = sidebarWidth + stepperReservePx(zoomLevel);
  // Keeps a just-hidden line (e.g. a speculative one when the toggle turns
  // off) around a little longer, marked `exiting`, so LineRow can play its
  // fade-out instead of vanishing instantly -- see useExitingLines and the
  // matching duration on LineRow's own transition.
  const [displayLines, isCollectionSwitch] = useExitingLines(
    searchFilteredLines,
    500,
    activeCollectionId
  );

  const resolvedEntries = useMemo(() => {
    const lineIds = new Set(lines.map((l) => l.id));
    return resolveEntries(data?.entries ?? [], lineIds).map((entry): TimelineEntry =>
      entry.kind === "volume"
        ? {
            ...entry,
            ownershipStatus: getStatus(entry.id, entry.ownershipStatus),
            readingStatus: getReadingStatus(entry.id),
          }
        : entry
    );
  }, [data, resolveEntries, lines, getStatus, getReadingStatus]);

  // Speculative volumes can be added to an official line too (speculating
  // about a future volume on an existing line, not just a brand-new one),
  // so this needs every line in the collection, not just speculative ones.
  const allLineIds = useMemo(
    () => new Set([...lines, ...speculativeLines].map((l) => l.id)),
    [lines, speculativeLines]
  );

  // Speculative volumes don't track ownership or reading status -- no
  // getStatus/getReadingStatus overlay.
  const speculativeResolvedEntries = useMemo(
    () => resolveSpeculativeEntries(allLineIds),
    [resolveSpeculativeEntries, allLineIds]
  );
  const speculativeVolumeIds = useMemo(
    () => new Set(speculativeResolvedEntries.map((e) => e.id)),
    [speculativeResolvedEntries]
  );

  const entriesByLine = useMemo(() => {
    const map = new Map<string, TimelineEntry[]>();
    const combined = speculationMode
      ? [...resolvedEntries, ...speculativeResolvedEntries]
      : resolvedEntries;
    for (const entry of combined) {
      const list = map.get(entry.lineId) ?? [];
      list.push(entry);
      map.set(entry.lineId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        const aQ = a.start.year * 4 + a.start.quarter;
        const bQ = b.start.year * 4 + b.start.quarter;
        return aQ - bQ;
      });
    }
    return map;
  }, [resolvedEntries, speculativeResolvedEntries, speculationMode]);

  // Scoped to searchFilteredLines (not every line in the collection) so a
  // nav search trims the axis down to just the matching lines' own
  // occupied years -- unfiltered, searchFilteredLines is every visible
  // line, so this reduces to the old full-collection range for free. Cuts
  // the leading/trailing horizontal scroll needed to reach a match instead
  // of leaving the axis spanning years nothing filtered-in touches.
  const { axisStart, axisEnd } = useMemo(() => {
    const filteredLineIds = new Set(searchFilteredLines.map((l) => l.id));
    const combined = speculationMode
      ? [...resolvedEntries, ...speculativeResolvedEntries]
      : resolvedEntries;
    const relevant = combined.filter((e) => filteredLineIds.has(e.lineId));
    if (relevant.length === 0) {
      const thisYear = new Date().getFullYear();
      return { axisStart: thisYear, axisEnd: thisYear + 1 };
    }
    const years = relevant.flatMap((e) => [e.start.year, e.end.year]);
    return { axisStart: Math.min(...years), axisEnd: Math.max(...years) };
  }, [resolvedEntries, speculativeResolvedEntries, speculationMode, searchFilteredLines]);

  // Stable object/function references for LineRow's memoized timeline lane
  // (see LineRow.tsx) -- an inline `{ year: axisStart, quarter: 1 }` literal
  // or arrow function here would recreate on every scroll-driven re-render
  // (scrollLeft lives in this component), defeating that memo and forcing
  // every add-volume hover cell across every row to reconcile on each
  // scroll tick, which is exactly the lag this is fixing.
  const axisStartPoint = useMemo<QuarterPoint>(
    () => ({ year: axisStart, quarter: 1 }),
    [axisStart]
  );
  const handleAddVolumeAt = useCallback((targetLine: Line, start: QuarterPoint) => {
    setAddVolumeForLineId(targetLine.id);
    setAddVolumeDefaultStart(start);
  }, []);
  // Drag-to-resize commit (see the edge handles in VolumeTile.tsx and
  // GapSegment.tsx -- gaps resize exactly like volumes) -- same official-
  // vs-speculative routing as every other write, just triggered from the
  // timeline directly instead of through the drawer. Volume and Gap don't
  // share every field (yearsCovered is volume-only, recomputed here same as
  // the drawer's own submit does), so the updated object is built per-kind
  // rather than blindly spreading start/end onto whichever shape it is.
  const handleResizeEntry = useCallback(
    (entry: TimelineEntry, start: QuarterPoint, end: QuarterPoint) => {
      const updated: TimelineEntry =
        entry.kind === "volume"
          ? { ...entry, start, end, yearsCovered: yearsCoveredLabel(start.year, end.year) }
          : { ...entry, start, end };
      if (speculativeVolumeIds.has(entry.id)) {
        upsertSpeculativeVolume(updated);
      } else {
        upsertVolume(updated);
      }
    },
    [speculativeVolumeIds, upsertSpeculativeVolume, upsertVolume]
  );
  // Volume stepper (see VolumeStepper.tsx / LineRow.tsx): a chevron click
  // picks the next/previous volume and reports back the scrollLeft that
  // lands it a fixed one-quarter-width clear of the stepper panel -- this is
  // the only thing that actually owns timelineScrollRef, so it's the one
  // place that can drive it. Empty deps: only touches a ref, never stale.
  const handleStepScroll = useCallback((targetScrollLeft: number) => {
    const el = timelineScrollRef.current;
    if (!el) return;
    setStepScrolling(true);
    // Whichever fires first (native scroll settling, or the fallback in
    // case `scrollend` never fires -- e.g. the target was already the
    // current position, so nothing actually scrolls) clears the other and
    // resumes normal hover tracking.
    const finish = () => {
      window.clearTimeout(fallbackId);
      el.removeEventListener("scrollend", finish);
      setStepScrolling(false);
    };
    const fallbackId = window.setTimeout(finish, 1000);
    el.addEventListener("scrollend", finish);
    el.scrollTo({ left: targetScrollLeft, behavior: "smooth" });
  }, []);
  // Coarsened scroll position for windowing the hover "add volume" cells
  // (see LineRow.tsx) -- a plain derived number, not its own state/memo, but
  // that's fine: since it only changes value once every
  // ADD_CELL_SCROLL_BUCKET_PX of scroll, the memoized LineTimelineLane still
  // sees the same primitive across most scroll-driven re-renders and bails
  // out, same as the stable references above.
  const scrollBucket = Math.round(scrollLeft / ADD_CELL_SCROLL_BUCKET_PX);

  const selectedVolume: Volume | null = useMemo(() => {
    if (!selectedVolumeId) return null;
    const official = resolvedEntries.find(
      (e): e is Volume => e.kind === "volume" && e.id === selectedVolumeId
    );
    if (official) return official;
    if (!speculationMode) return null;
    const speculativeMatch = speculativeResolvedEntries.find(
      (e): e is Volume => e.kind === "volume" && e.id === selectedVolumeId
    );
    return speculativeMatch ?? null;
  }, [resolvedEntries, speculativeResolvedEntries, selectedVolumeId, speculationMode]);

  const selectedVolumeIsSpeculative = !!(
    selectedVolume && speculativeVolumeIds.has(selectedVolume.id)
  );

  const selectedLine = selectedVolume
    ? visibleLines.find((l) => l.id === selectedVolume.lineId) ?? null
    : null;

  const rowHeight = ROW_HEIGHT_BY_ZOOM[zoomLevel];
  const pillHeight = SIDEBAR_PILL_HEIGHT_BY_ZOOM[zoomLevel];
  const pillIconSize = SIDEBAR_ICON_SIZE_BY_ZOOM[zoomLevel];
  const pillIconBorder = SIDEBAR_ICON_BORDER_BY_ZOOM[zoomLevel];
  const pxPerQuarter = PX_PER_QUARTER_BY_ZOOM[zoomLevel];
  const sidebarGap = SIDEBAR_GAP_BY_ZOOM[zoomLevel];
  const axisWidth = (axisEnd - axisStart + 2) * 4 * pxPerQuarter;
  const addCellWindowQuartersValue = addCellWindowQuarters(timelineViewportWidth, pxPerQuarter);

  // Each line's own row height -- rowHeight for a single-lane line, a
  // multiple of it for a Licensed-collection line with swimLanes > 1 (see
  // lineHeight in lib/timeline.ts). Memoized so useVisibleRowRange below
  // only tears down/re-adds its scroll listeners when heights actually
  // change (a new array reference every render would do that on every
  // render instead).
  const rowHeights = useMemo(
    () => displayLines.map(({ line }) => lineHeight(rowHeight, line.swimLanes)),
    [displayLines, rowHeight]
  );
  const rowsTotalHeight = rowHeights.reduce((sum, h) => sum + h, 0);

  // Which rows are actually on screen (see useVisibleRowRange) -- lets each
  // LineRow skip building its hover "add volume" cell layer (by far the
  // biggest DOM cost per row, see lib/timeline.ts) when it's scrolled well
  // out of view, without touching the row's own mount lifecycle (so its
  // enter/exit fade transitions, pill hover state, etc. are all untouched
  // and can't replay/glitch just from scrolling past a row).
  const rowsContainerRef = useRef<HTMLDivElement>(null);
  const [visibleRowStart, visibleRowEnd] = useVisibleRowRange(rowsContainerRef, rowHeights);
  // Drives AddVolumeCell's hover affordance from raw pointer position
  // instead of native CSS `:hover` (or even paired enter/leave events),
  // which Safari/WebKit can leave stuck on a cell that's no longer under
  // the pointer -- see useAddVolumeCellHover.ts.
  useAddVolumeCellHover();
  const eraBarHeight = isDcFinest
    ? ERA_BAR_HEIGHT - eraBarCollapseProgress * (ERA_BAR_HEIGHT - ERA_BAR_COLLAPSED_HEIGHT)
    : 0;

  return (
    <div className="min-h-screen bg-[#1E1E1E] font-body">
      {/* Subtle full-viewport reminder that Speculation Mode is on -- color
       * comes from the same SPECULATION_ACCENT_HEX the toggle switch uses
       * (see SpeculationModeToggle.tsx), so the two stay in lockstep if
       * this accent is ever adjusted. Fixed (not part of the scrolling
       * document) so it hugs the actual browser viewport edges rather than
       * the page content; pointer-events-none so it never intercepts
       * clicks. Always mounted (not conditionally rendered) so toggling
       * fades it in/out via transition-opacity instead of popping. */}
      <div
        className={`pointer-events-none fixed inset-0 z-30 transition-opacity duration-500 ease-out ${
          speculationMode ? "opacity-100" : "opacity-0"
        }`}
        style={{ boxShadow: `inset 0 0 24px 0 ${hexToRgba(SPECULATION_ACCENT_HEX, 0.5)}` }}
      />
      <TopNav
        collections={COLLECTIONS}
        activeId={activeCollectionId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelect={(id) => {
          setActiveCollectionId(id);
          safeSetItem(ACTIVE_COLLECTION_STORAGE_KEY, id);
          setSelectedVolumeId(null);
          // Switching collections swaps in a completely different axis
          // range and line list -- carrying over the old tab's scroll
          // position doesn't map to anything meaningful on the new one.
          // The browser silently clamps an out-of-range scrollLeft/scrollY
          // to whatever's valid for the new (usually differently sized)
          // content instead of erroring, so without this the new tab could
          // land scrolled into the middle of its timeline, or past the end
          // of a shorter line list, making lines look missing or
          // mismatched with the visible years until the user scrolls
          // manually. Resetting scrollLeft state alone isn't enough --
          // it's a separate mirror of the DOM's own scroll position (see
          // handleTimelineScroll), not a controlling source of truth for
          // it, so the actual scrollable element needs to be reset too.
          setScrollLeft(0);
          if (timelineScrollRef.current) {
            timelineScrollRef.current.scrollLeft = 0;
          }
          window.scrollTo(0, 0);
        }}
      />
      <div style={{ paddingTop: NAV_HEIGHT }}>
        <CollectionBanner collection={collection} />

        {displayLines.length === 0 ? (
          <div className="px-8 py-16 text-center text-neutral-500">
            <p>No volume data compiled for this collection yet.</p>
            <button
              type="button"
              onClick={() => setAddLineOpen(true)}
              className="mx-auto mt-4 flex items-center gap-2 rounded-md border border-dashed border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:border-neutral-500 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                className="h-4 w-4"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              {speculationMode ? "Add Speculative Line" : "Add Line"}
            </button>
          </div>
        ) : (
          <>
            {/* Zero-height marker for useEraBarCollapseProgress -- sits
             * immediately before the sticky container so its position
             * always reflects where the container would naturally be,
             * even once the container itself is actively pinned by
             * position: sticky (at which point its own
             * getBoundingClientRect() would just report the pinned spot). */}
            <div ref={eraBarAnchorRef} />
            <div
              className="sticky overflow-hidden px-4 backdrop-blur-[4px] transition-[height] duration-150 ease-out"
              style={{
                top: NAV_HEIGHT,
                zIndex: 50,
                height: AXIS_HEIGHT + eraBarHeight,
                backgroundColor: "rgba(30, 30, 30, 0.25)",
              }}
            >
              <div
                style={{
                  width: axisWidth,
                  marginLeft: sidebarColumnWidth + sidebarGap,
                  transform: `translateX(${-scrollLeft}px)`,
                }}
              >
                {isDcFinest && (
                  <EraBar
                    startYear={axisStart}
                    endYear={axisEnd + 1}
                    pxPerQuarter={pxPerQuarter}
                    collapseProgress={eraBarCollapseProgress}
                  />
                )}
                <TimelineAxis
                  startYear={axisStart}
                  endYear={axisEnd + 1}
                  pxPerQuarter={pxPerQuarter}
                  zoomLevel={zoomLevel}
                />
              </div>
            </div>
            <div
              ref={timelineScrollRef}
              className="overflow-x-auto px-4 py-1"
              onScroll={handleTimelineScroll}
            >
              <div
                className="relative inline-block min-w-full"
                style={{
                  // Extra space below the last row so it can be scrolled clear
                  // of the fixed "Add Line" button (bottom-4 + its own
                  // pillHeight) instead of sitting underneath it.
                  height: rowsTotalHeight + pillHeight + 32,
                }}
              >
                <TimelineGrid
                  startYear={axisStart}
                  endYear={axisEnd + 1}
                  sidebarWidth={sidebarColumnWidth}
                  pxPerQuarter={pxPerQuarter}
                  sidebarGap={sidebarGap}
                />
                <div className="relative z-10" ref={rowsContainerRef}>
                {displayLines.map(({ line, exiting }, rowIndex) => {
                  const lineIsSpeculative = speculativeLineIdSet.has(line.id);
                  return (
                    <LineRow
                      key={line.id}
                      line={line}
                      entries={entriesByLine.get(line.id) ?? EMPTY_ENTRIES}
                      axisStart={axisStartPoint}
                      focusedId={selectedVolumeId}
                      onSelect={setSelectedVolumeId}
                      onEdit={setEditingLine}
                      onEditEntry={setEditingEntry}
                      scrollLeft={scrollLeft}
                      sidebarWidth={sidebarWidth}
                      sidebarColumnWidth={sidebarColumnWidth}
                      rowHeight={rowHeight}
                      pillHeight={pillHeight}
                      pillIconSize={pillIconSize}
                      inViewport={rowIndex >= visibleRowStart && rowIndex < visibleRowEnd}
                      pillIconBorder={pillIconBorder}
                      zoomLevel={zoomLevel}
                      pxPerQuarter={pxPerQuarter}
                      sidebarGap={sidebarGap}
                      axisWidth={axisWidth}
                      scrollBucket={scrollBucket}
                      addCellWindowQuarters={addCellWindowQuartersValue}
                      onAddVolumeAt={handleAddVolumeAt}
                      onResizeEntry={handleResizeEntry}
                      onStepScroll={handleStepScroll}
                      stepScrolling={stepScrolling}
                      speculative={lineIsSpeculative}
                      locked={speculationMode && !lineIsSpeculative}
                      speculativeVolumeIds={speculativeVolumeIds}
                      exiting={exiting}
                      skipEnterTransition={isCollectionSwitch}
                    />
                  );
                })}
              </div>
            </div>
            </div>
          </>
        )}
      </div>

      {displayLines.length > 0 && (
        <div className="fixed bottom-4 left-4 z-40">
          <AddLineButton
            scrollLeft={scrollLeft}
            sidebarWidth={sidebarColumnWidth}
            onClick={() => setAddLineOpen(true)}
            pillHeight={pillHeight}
            speculative={speculationMode}
          />
        </div>
      )}

      <div className="fixed right-6 top-1/2 z-40 flex -translate-y-1/2 flex-col items-center gap-3">
        <SpeculationModeToggle
          enabled={speculationMode}
          onToggle={() => {
            setSpeculationMode((on) => !on);
            // Toggling off hides speculative content -- drop any selection/
            // editing state that might be pointing at it so nothing dangles.
            setSelectedVolumeId(null);
            setEditingLine(null);
            setAddVolumeForLineId(null);
            setAddVolumeDefaultStart(null);
            setEditingEntry(null);
          }}
        />
        <ZoomControl level={zoomLevel} onZoomIn={zoomIn} onZoomOut={zoomOut} />
      </div>

      {selectedVolume && selectedLine && (
        <VolumeDetailPanel
          volume={selectedVolume}
          status={getStatus(selectedVolume.id, selectedVolume.ownershipStatus)}
          onStatusChange={(s) => setStatus(selectedVolume.id, s)}
          readingStatus={getReadingStatus(selectedVolume.id)}
          onReadingStatusChange={(s) => setReadingStatus(selectedVolume.id, s)}
          speculative={selectedVolumeIsSpeculative}
          onEdit={
            speculationMode && !selectedVolumeIsSpeculative
              ? undefined
              : (volume) => {
                  setEditingEntry(volume);
                  setSelectedVolumeId(null);
                }
          }
          onDelete={
            speculationMode && !selectedVolumeIsSpeculative
              ? undefined
              : (volumeId) => {
                  if (selectedVolumeIsSpeculative) {
                    deleteSpeculativeVolume(volumeId);
                  } else {
                    deleteVolume(volumeId);
                  }
                  setSelectedVolumeId(null);
                }
          }
          onClose={() => setSelectedVolumeId(null)}
        />
      )}

      {(addLineOpen || editingLine) && (
        <LineFormDrawer
          collectionId={activeCollectionId}
          supportsEra={activeCollectionId === "dc-finest"}
          editingLine={editingLine ?? undefined}
          speculative={editingLine ? speculativeLineIdSet.has(editingLine.id) : speculationMode}
          fieldsLocked={!!(editingLine && speculationMode && !speculativeLineIdSet.has(editingLine.id))}
          onSave={(line) => {
            if (editingLine ? speculativeLineIdSet.has(editingLine.id) : speculationMode) {
              upsertSpeculativeLine(line);
            } else {
              upsertLine(line);
            }
            setAddLineOpen(false);
            setEditingLine(null);
          }}
          onDelete={(lineId) => {
            if (speculativeLineIdSet.has(lineId)) {
              deleteSpeculativeLine(lineId);
            } else {
              deleteLine(lineId);
            }
            setEditingLine(null);
          }}
          onAddVolume={
            editingLine
              ? () => {
                  setAddVolumeForLineId(editingLine.id);
                  setAddVolumeDefaultStart(null);
                  setEditingLine(null);
                }
              : undefined
          }
          onClose={() => {
            setAddLineOpen(false);
            setEditingLine(null);
          }}
        />
      )}

      {(addVolumeForLineId || editingEntry) && (() => {
        // Adding new (no editingEntry): while Speculation Mode is on, "New
        // Volume" doesn't exist -- everything you can add right now is a
        // speculation, whichever line (official or speculative) it lands
        // on. Editing an existing entry: speculative-ness is whatever it
        // already was, independent of the toggle's current position.
        const volumeFormIsSpeculative = editingEntry
          ? speculativeVolumeIds.has(editingEntry.id)
          : speculationMode;
        const targetLineId = editingEntry?.lineId ?? addVolumeForLineId!;
        const targetLine =
          lines.find((l) => l.id === targetLineId) ??
          speculativeLines.find((l) => l.id === targetLineId);
        return (
          <VolumeFormDrawer
            lineId={targetLineId}
            supportsEra={activeCollectionId === "dc-finest"}
            supportsSwimLanePosition={activeCollectionId === "marvel-licensed-epic"}
            lineSwimLanes={targetLine?.swimLanes ?? 1}
            editingEntry={editingEntry ?? undefined}
            speculative={volumeFormIsSpeculative}
            defaultStart={addVolumeDefaultStart ?? undefined}
            onSave={(entry) => {
              if (volumeFormIsSpeculative) {
                upsertSpeculativeVolume(entry);
              } else {
                upsertVolume(entry);
              }
              setAddVolumeForLineId(null);
              setAddVolumeDefaultStart(null);
              setEditingEntry(null);
            }}
            onDelete={(entryId) => {
              if (volumeFormIsSpeculative) {
                deleteSpeculativeVolume(entryId);
              } else {
                deleteVolume(entryId);
              }
              setAddVolumeForLineId(null);
              setAddVolumeDefaultStart(null);
              setEditingEntry(null);
            }}
            onClose={() => {
              setAddVolumeForLineId(null);
              setAddVolumeDefaultStart(null);
              setEditingEntry(null);
            }}
          />
        );
      })()}
    </div>
  );
}
