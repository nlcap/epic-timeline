import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Gap, Line, Note, QuarterPoint, TimelineEntry, Volume } from "../types";
import {
  ADD_CELL_ICON_SIZE_BY_ZOOM,
  ADD_CELL_SCROLL_BUCKET_PX,
  addCellLeadingBlockedQuarters,
  assignLanes,
  lineHeight,
  quarterBeforeMonthPoint,
  quarterIndex,
  quarterPointFromIndex,
  quartersBetween,
  resizeSpan,
  spanToPx,
  stepperReservePx,
  type ZoomLevel,
} from "../lib/timeline";
import { useSidebarPillMetrics } from "../hooks/useSidebarPillMetrics";
import { useEnterTransition } from "../hooks/useEnterTransition";
import { lineIconUrl, type EraOption } from "../lib/era";
import { speculativeTextColor } from "../lib/color";
import { formatLineBreaks } from "../lib/text";
import { VolumeTile } from "./VolumeTile";
import { GapSegment } from "./GapSegment";
import { NoteTile } from "./NoteTile";
import { LineIcon } from "./LineIcon";
import { PreDebutFiller } from "./PreDebutFiller";
import { AddVolumeCell } from "./AddVolumeCell";
import { VolumeStepper } from "./VolumeStepper";

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
  onEditEntry,
  scrollLeft,
  sidebarWidth,
  sidebarColumnWidth,
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
  onStepScroll,
  stepScrolling,
  autoPreviewVolumeId,
  autoPreviewDelta,
  onVolumeHover,
  eraOptions,
}: {
  line: Line;
  entries: TimelineEntry[];
  axisStart: QuarterPoint;
  /** The active collection's era definitions (DC_ERA_OPTIONS, the Custom
   * tab's own user-defined eras, or [] otherwise) -- see lib/era.ts.
   * Forwarded to VolumeTile/NoteTile for era badges/icons. */
  eraOptions: EraOption[];
  focusedId: string | null;
  onSelect: (volumeId: string) => void;
  onEdit: (line: Line) => void;
  /** Gaps and notes have no detail panel, so a click on either opens
   * VolumeFormDrawer directly, pre-filled for editing (see App.tsx's
   * setEditingEntry). */
  onEditEntry: (entry: Gap | Note) => void;
  scrollLeft: number;
  /** Raw content-fit width (from useSidebarWidth) -- feeds
   * useSidebarPillMetrics' own pillWidth-at-rest math. NOT the same as
   * sidebarColumnWidth below; using that here would double-count the
   * stepper reserve for the default (unscrolled) pill state. */
  sidebarWidth: number;
  /** The sidebar column's actual allocated width -- sidebarWidth plus the
   * volume stepper's reserve (see stepperReservePx in lib/timeline.ts), so
   * the pill's own outer wrapping div, and everything downstream that needs
   * to align with its right edge (VolumeStepper's scroll math), has enough
   * room without the pill bleeding into the timeline grid. App.tsx computes
   * this once and also feeds it to TimelineGrid/the axis header/AddLineButton,
   * so all four stay in lockstep. */
  sidebarColumnWidth: number;
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
  /** Volume stepper (see VolumeStepper.tsx): called with the scroll
   * container's target scrollLeft, plus the volume being stepped to, after a
   * chevron click picks the next/previous volume -- LineRow itself has no ref
   * to the actual scroll container (that lives in App.tsx), so it just reports
   * both back up. App.tsx drives the scroll and owns the auto-preview state
   * the volume id feeds (see autoPreviewVolumeId below). */
  onStepScroll: (targetScrollLeft: number, targetVolumeId: string) => void;
  /** Volume stepper auto-preview: the one volume in the whole timeline (if
   * any) currently showing its hover preview because a chevron stepped to it.
   * Owned by App.tsx, not per-row -- see its comment there for why. Compared
   * against each `entry.id` below rather than forwarded raw, so the memoized
   * tiles only re-render where the derived boolean actually flips. */
  autoPreviewVolumeId: string | null;
  /** Paired with autoPreviewVolumeId -- how far the timeline is about to
   * scroll, so the stepped-to tile can position its preview at its final
   * resting spot immediately instead of waiting out the animation. */
  autoPreviewDelta: number;
  /** Fired on a genuine mouse hover of any volume/note tile in this row --
   * retires the stepper's auto-preview so a lingering panel gives way to
   * whatever the user actually moved onto. */
  onVolumeHover: () => void;
  /** True for the duration of a chevron-triggered smooth scroll (see
   * handleStepScroll in App.tsx). Does two things: gates the pill's hover
   * handlers below so the pinning transform's own frame-to-frame jitter
   * during that animation can't sweep the icon under a stationary cursor
   * and trigger a spurious expand/collapse, and (passed straight through as
   * useSidebarPillMetrics' suppressHover) forces the pill to collapse-with-
   * scroll normally for the animation's duration even if it was genuinely
   * hovered/expanded at click time -- so stepping from an expanded tile
   * (its default rest state, or hover-expanded while scrolled) shows it
   * shrinking down on the way to the destination instead of staying puffed
   * open the whole glide. */
  stepScrolling: boolean;
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
    pillRef,
    stepScrolling
  );
  // A chevron-triggered scroll ending clears `hovered` outright rather than
  // letting it carry over from before the click. Without this, a stepper
  // click made from an expanded tile (Change #14) leaves `hovered` frozen
  // true (per Bug #11) for the animation's whole duration, and the outer
  // sidebar cell's hoverable box below is a fixed sidebarColumnWidth
  // regardless of the pill's current (possibly now-collapsed) visual size
  // -- needed for grid/Add-Line alignment (Bug #6), but it means a cursor
  // that's sitting anywhere in that box, including empty space the label/
  // panel used to occupy before collapsing, still reads as "inside" and
  // never fires a real leave. The moment stepScrolling clears, that stale
  // `true` reasserts itself and re-expands the pill even though the cursor
  // never got anywhere near its now-smaller, collapsed self -- reported by
  // Nick as the icon puffing open while he was still moving toward it, not
  // yet over it. Resetting unconditionally here means every landing starts
  // from a clean slate and needs a genuine fresh hover (on the pill itself,
  // or the panel's own independent CSS-hover reveal) to expand/reveal
  // anything again, matching what he actually expects to happen.
  // The volume detail panel is open on something, somewhere -- App.tsx
  // passes selectedVolumeId down as focusedId, so a non-null value means
  // exactly that. Derived rather than passed as its own prop since the
  // value is already here. Drives the sidebar's z-index/dimming below.
  const panelOpen = focusedId !== null;
  // True when the panel's open volume belongs to THIS line -- lets the
  // sidebar cell below skip its own dimming for that one line, matching the
  // undimmed z-[62] treatment its tile gets in TimelineEntryTile, so the
  // pill and the tile it belongs to read as one highlighted unit.
  const lineHasFocusedVolume = entries.some((e) => e.id === focusedId);
  const wasStepScrolling = useRef(stepScrolling);
  useEffect(() => {
    if (wasStepScrolling.current && !stepScrolling) {
      setHovered(false);
    }
    wasStepScrolling.current = stepScrolling;
  }, [stepScrolling, setHovered]);
  // Volume stepper (see VolumeStepper.tsx): the volume-only subset of this
  // line's entries, gaps excluded -- VolumeStepper derives its forward/
  // backward targets fresh from this list plus the live scroll position on
  // every render, not from any state kept here.
  const volumesOnly = useMemo(
    () => entries.filter((e): e is Volume => e.kind === "volume"),
    [entries]
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
      // The settled state carries NO transform class (not even
      // `translate-y-0`), on purpose. Any non-none transform makes this row
      // a stacking context, which would trap the selected volume's tile
      // inside it and stop it rising above the detail panel's scrim -- see
      // TimelineEntryTile's zIndex below. Animating to no-transform instead
      // of to translate-y-0 is visually identical: browsers interpolate
      // `none` as the identity matrix, so the enter/exit slide still runs.
      // (A row mid-animation IS briefly a stacking context, which is fine --
      // that only happens on collection switches, never while a panel is
      // open on a settled row.)
      className={`flex transition-[opacity,transform] duration-500 ease-out ${
        visible ? "opacity-100" : "opacity-0 -translate-y-1"
      }`}
      style={{ gap: sidebarGap }}
    >
      <div
        className="relative flex shrink-0 items-center"
        style={{
          width: sidebarColumnWidth,
          height: lineHeight(rowHeight, line.swimLanes),
          // While the detail panel is open, the selected volume's tile is
          // lifted to z-[62] (see TimelineEntryTile below) so it can clear
          // that panel's scrim. Left alone, that tile would then also paint
          // over this pinned pill as it scrolls past -- pills normally win
          // (z-20 vs the tiles' z-auto) and tiles are meant to scroll
          // BEHIND them. So the whole sidebar cell goes above it too.
          //
          // Which then puts the cell above the scrim (z-[61]) as well, so
          // it has to reproduce the dimming itself. brightness(0.4) is not
          // an approximation of the scrim: compositing bg-black/60 over a
          // colour C yields 0.4*C exactly, which is what this filter
          // computes, so a dimmed-by-filter pill and a dimmed-by-scrim one
          // land on the same pixels. Skipped for the line that owns the
          // open volume (lineHasFocusedVolume) so its pill stays bright
          // along with its tile -- the zIndex boost still applies
          // unconditionally though, since every line's pill needs it to
          // avoid being covered by its own tile, focused or not.
          zIndex: panelOpen ? 63 : undefined,
          filter: panelOpen && !lineHasFocusedVolume ? "brightness(0.4)" : undefined,
        }}
        // onMouseLeave (only) lives here, not on the pill button below,
        // because the stepper panel is a SIBLING of that button (has to be
        // -- it can't be nested inside the button, or a chevron's mouseup
        // would land on the button and fire its onClick), and once hovered,
        // visually overlaps the button's own rendered box (Bug #6: the
        // button deliberately renders wider than its content to give the
        // panel a home inset within it). If leaving fired on the button
        // itself, the cursor crossing from the button onto that overlapping
        // panel -- painted on top, later in DOM order, same z-20 -- would
        // intercept the pointer and fire the button's own onMouseLeave even
        // though the cursor never left this div's box. That flipped
        // `hovered` false, which shrinks pillWidth, which moves the panel
        // (its own `left` isn't transitioned, so it jumps instantly) out
        // from under the cursor, re-exposing the button and re-triggering
        // hover -- a feedback loop Nick saw as a rapid flicker between
        // expanded/collapsed and what looked like two overlapping steppers
        // in a photo (motion blur across that oscillation, not two real
        // instances). Leaving via this shared ancestor instead means moving
        // from the button onto the panel never crosses OUT of the hovered
        // subtree, so `hovered` -- and therefore pillWidth and the panel's
        // position -- stays stable the whole time. Same fix shape as
        // VolumeTile.tsx's resize handles, which document the identical
        // class of bug; wasn't reachable here until Bug #6 widened this div
        // to actually contain both children in every state.
        //
        // onMouseEnter, by contrast, stays on the button ITSELF below, not
        // here -- deliberately asymmetric. While the pill is collapsed to
        // icon-only, the panel sits OUTSIDE the button's box entirely (not
        // overlapping -- that only starts once the pill has a label to
        // inset next to), so this div's box is wider than the icon alone.
        // An enter handler here would fire the instant the cursor reaches
        // the panel's own hover area even before it ever touches the icon,
        // expanding the pill from a hover that never touched it -- exactly
        // what Nick reported after the fix above first shipped: hovering
        // the collapsed-state stepper (which floats past the icon on its
        // own, unhovered) was incorrectly puffing the icon out into a full
        // label pill. Scoping enter to the button means only a genuine
        // icon/label hover starts the expansion; leave stays on this wider
        // div purely so an *already-expanded* pill doesn't collapse out
        // from under a cursor crossing onto its own inset panel.
        //
        // Both handlers additionally no-op while stepScrolling -- see its
        // doc comment in the props above. A chevron click's own smooth
        // scroll can jitter the pinned icon under a cursor that never
        // moved, and without this guard that reads as a real hover,
        // expanding (or collapsing) the pill mid-animation for no reason
        // the user's mouse actually did.
        onMouseLeave={() => {
          if (!stepScrolling) setHovered(false);
        }}
      >
        <button
          ref={pillRef}
          type="button"
          onClick={() => onEdit(line)}
          onMouseEnter={() => {
            if (!stepScrolling) setHovered(true);
          }}
          data-official-locked={locked ? "" : undefined}
          // No overflow set here on purpose -- `overflow-x-hidden` alone would
          // force overflow-y to compute as `auto` (an overflow spec quirk when
          // only one axis is non-visible), clipping the icon's vertical
          // overflow. Horizontal clipping during the width-collapse animation
          // comes from the label's own `truncate` below instead: an element
          // with its own non-visible overflow gets an automatic flex
          // min-width of 0, so it shrinks and ellipsizes without the parent
          // needing to clip anything.
          // shrink-0 -- the outer div is a fixed-width flex container, and
          // this button's own requested width can now exceed it once the
          // stepper reserve is added (pillWidth alone never could, it was
          // always <= sidebarWidth). Without shrink-0 here, flexbox silently
          // compresses the button back down to fit its parent regardless of
          // the inline width style, defeating the reserve entirely -- the
          // outer div's own overflow is unset (visible), so the wider button
          // just overflows past it instead, same as everything else here.
          className={`relative z-20 flex shrink-0 items-center rounded-lg px-2 text-left transition-[width,background-color,border-color,box-shadow] duration-150 ease-out ${
            speculative ? "border" : ""
          }`}
          style={{
            // Rendered a little wider than the pill's own label/icon content
            // needs (see VolumeStepper.tsx's stepperReservePx) so the
            // chevron stepper has a guaranteed home inset within the pill's
            // own background, just past the label, instead of floating past
            // it over empty space -- scaled by labelOpacity so the reserve
            // collapses to zero once the pill is fully icon-only, matching
            // the "no dead space past the collapsed icon" rule below.
            width: pillWidth + stepperReservePx(zoomLevel) * labelOpacity,
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
            <LineIcon iconUrl={lineIconUrl(line, eraOptions)} />
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
              <span
                className={`line-clamp-2 whitespace-pre-line italic text-neutral-400 ${
                  zoomLevel === 3 ? "" : "text-xs leading-snug"
                }`}
                style={zoomLevel === 3 ? { fontSize: "0.5rem", lineHeight: 1 } : undefined}
              >
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
        <VolumeStepper
          volumes={volumesOnly}
          axisStart={axisStart}
          pxPerQuarter={pxPerQuarter}
          sidebarWidth={sidebarWidth}
          sidebarColumnWidth={sidebarColumnWidth}
          sidebarGap={sidebarGap}
          pillWidth={pillWidth}
          pillIconSize={pillIconSize}
          labelOpacity={labelOpacity}
          scrollLeft={scrollLeft}
          zoomLevel={zoomLevel}
          onStepScroll={onStepScroll}
        />
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
        onEditEntry={onEditEntry}
        onAddVolumeAt={onAddVolumeAt}
        locked={locked}
        speculativeVolumeIds={speculativeVolumeIds}
        scrollBucket={scrollBucket}
        addCellWindowQuarters={addCellWindowQuarters}
        inViewport={inViewport}
        onResizeEntry={onResizeEntry}
        autoPreviewVolumeId={autoPreviewVolumeId}
        autoPreviewDelta={autoPreviewDelta}
        onVolumeHover={onVolumeHover}
        stepScrolling={stepScrolling}
        eraOptions={eraOptions}
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
  onEditEntry,
  onAddVolumeAt,
  locked,
  speculativeVolumeIds,
  scrollBucket,
  addCellWindowQuarters,
  inViewport,
  onResizeEntry,
  autoPreviewVolumeId,
  autoPreviewDelta,
  onVolumeHover,
  stepScrolling,
  eraOptions,
}: {
  line: Line;
  entries: TimelineEntry[];
  axisStart: QuarterPoint;
  axisWidth: number;
  pxPerQuarter: number;
  zoomLevel: ZoomLevel;
  rowHeight: number;
  /** See LineRow's identical prop -- forwarded to each entry's tile via
   * TimelineEntryTile. */
  eraOptions: EraOption[];
  focusedId: string | null;
  onSelect: (volumeId: string) => void;
  onEditEntry: (entry: Gap | Note) => void;
  onAddVolumeAt: (line: Line, start: QuarterPoint) => void;
  locked: boolean;
  speculativeVolumeIds?: Set<string>;
  scrollBucket: number;
  addCellWindowQuarters: number;
  inViewport: boolean;
  onResizeEntry?: (entry: TimelineEntry, start: QuarterPoint, end: QuarterPoint) => void;
  /** Volume stepper (see VolumeStepper.tsx): id of the volume, if any, that
   * a chevron click is currently stepping to -- set the instant the click
   * happens (see LineRow's own doc comment on this state), passed through
   * to that one entry's VolumeTile as `autoPreview` to pop its hover
   * preview open immediately. Compared against `entry.id` per-entry below
   * (not forwarded as the raw id) so TimelineEntryTile's own memo only
   * re-renders the (at most two) tiles whose derived boolean actually
   * flips, not every entry in the row. */
  autoPreviewVolumeId: string | null;
  /** Paired with autoPreviewVolumeId -- how many px the timeline is about
   * to scroll by, so the one tile with autoPreview=true can compute its
   * OWN final on-screen position from its current (pre-scroll) rect
   * instead of waiting for the scroll to actually get there. Same value
   * for every entry (only the matching tile ever uses it). */
  autoPreviewDelta: number;
  /** Fired on a genuine mouse hover of any tile here -- retires the stepper's
   * auto-preview. Stable (a useCallback in App.tsx), so handing it to every
   * memoized tile below costs nothing. */
  onVolumeHover: () => void;
  /** True for the duration of a chevron-triggered smooth scroll -- passed
   * straight through to every entry's tile (VolumeTile/NoteTile) to
   * suppress any REAL hover preview it would otherwise open as the scroll
   * sweeps it under a stationary cursor. Unlike autoPreviewVolumeId (which
   * only touches the one landing tile), this is the same value for every
   * entry -- see LineRow's own doc comment on this prop for why threading
   * it here (a value that only changes twice per click) doesn't fight this
   * component's scroll-position memo boundary. */
  stepScrolling: boolean;
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
    // centerQuarterIdx doubles as the lane's own leftmost-visible quarter:
    // its local coordinate origin sits at full-page content-x
    // sidebarColumnWidth + sidebarGap (same as VolumeStepper's contentXOf),
    // a constant that cancels out of "which local-x is at the viewport's
    // left edge" -- leaving just scrollLeft itself, approximated here via
    // the already-coarsened scrollBucket.
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
    // No add-cell for the leading edge of the visible lane -- see
    // addCellLeadingBlockedQuarters in lib/timeline.ts for why (it sits
    // directly under the pinned sidebar icon/stepper, prone to fat-finger
    // clicks meant for the stepper instead) and why this is a px-based
    // margin converted to quarters per zoom level, not a flat count.
    const blockedEndIdxExclusive = centerQuarterIdx + addCellLeadingBlockedQuarters(pxPerQuarter);

    const occupied = entries.map((entry) => [
      quarterIndex(entry.start),
      quarterIndex(entry.end),
    ]);
    const indexes: number[] = [];
    for (let q = windowStartIdx; q < windowEndIdxExclusive; q++) {
      if (q >= centerQuarterIdx && q < blockedEndIdxExclusive) continue;
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
            onEditEntry={onEditEntry}
            speculative={speculativeVolumeIds?.has(entry.id) ?? false}
            locked={entryLocked}
            onResizeStart={entryLocked || !onResizeEntry ? undefined : handleResizeStart}
            renderStart={renderStart}
            renderEnd={renderEnd}
            autoPreview={entry.id === autoPreviewVolumeId}
            autoPreviewDelta={autoPreviewDelta}
            onVolumeHover={onVolumeHover}
            stepScrolling={stepScrolling}
            eraOptions={eraOptions}
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
  onEditEntry,
  speculative,
  locked,
  onResizeStart,
  renderStart,
  renderEnd,
  autoPreview,
  autoPreviewDelta,
  onVolumeHover,
  stepScrolling,
  eraOptions,
}: {
  entry: TimelineEntry;
  line: Line;
  axisStart: QuarterPoint;
  /** See LineRow's identical prop -- forwarded to VolumeTile/NoteTile. */
  eraOptions: EraOption[];
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
  onEditEntry: (entry: Gap | Note) => void;
  speculative: boolean;
  locked: boolean;
  onResizeStart?: (entryId: string, edge: "start" | "end", clientX: number) => void;
  renderStart: QuarterPoint;
  renderEnd: QuarterPoint;
  /** Volume stepper: true only for the one entry (if any) a chevron click
   * is currently stepping to -- see LineTimelineLane's own doc comment
   * above. No-op for gap/note entries, which VolumeStepper never targets. */
  autoPreview: boolean;
  /** Paired with autoPreview -- see LineTimelineLane's own doc comment. */
  autoPreviewDelta: number;
  /** Fired on a genuine mouse hover of this tile -- see LineTimelineLane's
   * own doc comment. Forwarded to VolumeTile/NoteTile (not GapSegment, which
   * has no preview of its own to swap in). */
  onVolumeHover: () => void;
  /** True for the duration of a chevron-triggered smooth scroll -- see
   * LineTimelineLane's own doc comment above. Forwarded to VolumeTile/
   * NoteTile (not GapSegment, which has no hover preview to suppress). */
  stepScrolling: boolean;
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
        // `focused` means exactly "the volume detail panel is open on this
        // entry" (App.tsx passes selectedVolumeId as focusedId), so this
        // lifts the selected tile above that panel's scrim (z-[61]) while
        // leaving it comfortably below the drawer itself (z-[65]). Every
        // other tile stays at z-auto, under the scrim, and so reads as
        // dimmed -- which is the whole effect, achieved without a scrim of
        // our own and without cloning anything.
        //
        // This only reaches the app's root stacking context because neither
        // the rows container (App.tsx) nor this row (LineRow's root) creates
        // one any more -- both carry comments saying so. Reintroducing a
        // z-index or a transform on either would silently re-trap this and
        // the highlight would go back to being dimmed with everything else.
        zIndex: focused ? 62 : undefined,
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
          autoPreview={autoPreview}
          autoPreviewDelta={autoPreviewDelta}
          onHoverStart={onVolumeHover}
          stepScrolling={stepScrolling}
          eraOptions={eraOptions}
        />
      ) : entry.kind === "gap" ? (
        <GapSegment
          gap={entry}
          line={line}
          zoomLevel={zoomLevel}
          locked={locked}
          onClick={() => onEditEntry(entry)}
          onResizeStart={
            onResizeStart ? (edge, clientX) => onResizeStart(entry.id, edge, clientX) : undefined
          }
        />
      ) : (
        <NoteTile
          note={entry}
          line={line}
          zoomLevel={zoomLevel}
          locked={locked}
          onClick={() => onEditEntry(entry)}
          onResizeStart={
            onResizeStart ? (edge, clientX) => onResizeStart(entry.id, edge, clientX) : undefined
          }
          onHoverStart={onVolumeHover}
          stepScrolling={stepScrolling}
          eraOptions={eraOptions}
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
