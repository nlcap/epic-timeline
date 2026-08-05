import { useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import type { Line, Volume } from "../types";
import { OWNED_STATUSES } from "../types";
import {
  ownedTileBorderColor,
  speculativeTextColor,
  speculativeTileBackground,
  tileBackground,
} from "../lib/color";
import { AXIS_HEIGHT, quartersBetween, type ZoomLevel } from "../lib/timeline";
import { volumeBadgeText, volumeIconUrl, volumeNumberLabel } from "../lib/era";
import { OWNERSHIP_META } from "../lib/ownership";
import { LineIcon } from "./LineIcon";
import { NAV_HEIGHT } from "./TopNav";
import dragLeftIcon from "../assets/drag_left.svg";
import dragRightIcon from "../assets/drag_right.svg";

// Rough max height of the floating hover preview. The cover (w-20, half its
// old w-40 size) sits beside the title/issues-collected text rather than
// above it now, so the card's height tracks whichever is taller instead of
// summing both -- issues-collected can run long, but it wraps within a
// fixed-width column rather than stretching the card, so this estimate
// stays modest. Combined with the fixed nav bar and sticky timeline axis
// (both stacked above the preview's own z-index), this is how much clear
// space a tile needs above it before the preview will fit without floating
// up behind them.
const PREVIEW_HEIGHT_ESTIMATE = 160;
const PREVIEW_CLEARANCE = NAV_HEIGHT + AXIS_HEIGHT + PREVIEW_HEIGHT_ESTIMATE;

export function VolumeTile({
  volume,
  line,
  focused,
  onClick,
  zoomLevel,
  speculative = false,
  locked = false,
  onResizeStart,
}: {
  volume: Volume;
  line: Line;
  focused: boolean;
  onClick: () => void;
  zoomLevel: ZoomLevel;
  /** Speculation Mode: this volume is speculative -- darkened fill (mixed
   * with black, not opacity-based, so it stays fully opaque), full-opacity
   * line-color border, and title text tinted 50/50 toward white. */
  speculative?: boolean;
  /** Speculation Mode: this is an official (non-speculative) volume while
   * Speculation Mode is on -- reserved styling hook only, no treatment yet. */
  locked?: boolean;
  /** Drag-to-resize: omit to disable the feature entirely (e.g. while
   * locked). Fires on mousedown on either edge handle -- the parent
   * (LineRow's LineTimelineLane) owns the actual drag tracking, since it's
   * the one that knows pxPerQuarter and controls this tile's on-screen
   * position/width. */
  onResizeStart?: (edge: "start" | "end", clientX: number) => void;
}) {
  const owned = OWNED_STATUSES.has(volume.ownershipStatus);
  const background = speculative
    ? speculativeTileBackground(line.colorHex)
    : tileBackground(line.colorHex, owned, focused);
  const singleQuarter = quartersBetween(volume.start, volume.end) === 0;
  // Zoomed out, the tile has less and less room: level 2 drops the
  // issues-collected subtitle first (icon/badge stay, now visibly
  // overflowing the shorter tile -- see the button's overflow below).
  // Level 3 (16px tall) can't fit the icon or title either, but the badge
  // alone (16px) fits exactly, so it's kept as the only content -- still
  // clickable and still showing its cover preview on hover via the
  // title/handlers below.
  const showSubtitle = zoomLevel === 1;
  const showIcon = zoomLevel !== 3;
  const showTitle = zoomLevel !== 3;
  // Single-quarter volumes at level 1-2 render just the icon/badge with no
  // title span next to it -- the button is a flex row with no
  // justify-content set, so with only one child it was hugging the left
  // edge instead of sitting centered in the pill. Center that case instead
  // of the default (title-trailing) left alignment.
  const hasTitleContent = showTitle && !singleQuarter;
  // Level 3 is always icon/badge-only too (showTitle is false there
  // regardless of singleQuarter), but stays flush left on purpose --
  // unlike the level 1-2 single-quarter case, it's not "centering a lone
  // child that used to sit next to a title," it's the tile's only zoom
  // level short enough that centering would visually disconnect the badge
  // from the tile's left edge (where the equivalent single-quarter tiles
  // at other zoom levels still read as anchored).
  const centerIconOnly = !hasTitleContent && zoomLevel !== 3;
  // Level 1-2: fixed width (era badges are two characters, "G1", so need
  // more room than a plain number) -- it sits under the icon there, so a
  // little uneven side-padding around a short number doesn't stand out.
  // Level 3: the badge IS the whole tile's content (see showIcon/showTitle
  // above), so that same fixed width made a single-digit number look oddly
  // padded next to a wider one -- sized to content plus a small fixed gap
  // instead, era and non-era alike.
  const badgeWidthClass = zoomLevel === 3 ? "px-1" : volume.era ? "w-7" : "w-5";
  const badge = (
    <span
      className={`flex h-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold leading-none text-white ${badgeWidthClass} ${
        showIcon ? "absolute bottom-0.5 left-1/2 -translate-x-1/2" : ""
      }`}
      style={{
        backgroundColor: line.colorHex,
        WebkitTextStroke: "1px rgba(0,0,0,0.7)",
        paintOrder: "stroke fill",
      }}
    >
      {volumeBadgeText(volume)}
    </span>
  );
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);
  const [flipBelow, setFlipBelow] = useState(false);
  // Top edge (viewport px) the preview should anchor to -- recomputed
  // explicitly (not read from the ref inline during render) so it can also
  // be refreshed on scroll while hovered, see the effect below.
  const [previewTop, setPreviewTop] = useState(0);
  // Preview follows the cursor's x position (not the tile's own horizontal
  // center) so very long volumes -- whose center can be far off screen --
  // still show their preview near wherever the mouse actually is.
  const [mouseX, setMouseX] = useState(0);

  const updatePreviewPosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const shouldFlipBelow = rect.top < PREVIEW_CLEARANCE;
    setFlipBelow(shouldFlipBelow);
    setPreviewTop(shouldFlipBelow ? rect.bottom : rect.top);
  };

  const handleMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
    updatePreviewPosition();
    setMouseX(e.clientX);
    setHovered(true);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    setMouseX(e.clientX);
  };

  // A tile that's mid-screen when hovered can scroll close to the sticky
  // nav/axis header without the mouse ever moving (wheel/trackpad scroll
  // while still hovering) -- flipBelow was previously decided once on
  // mouseenter and never revisited, so the preview could end up rendered
  // above the tile (and behind/overlapping the sticky header) once that
  // scroll brought the tile close enough to the top. Recompute on every
  // scroll/resize for as long as the tile stays hovered.
  useEffect(() => {
    if (!hovered) return;
    // Cancel-and-reschedule, not a "ticking" boolean only its own rAF
    // callback can clear -- that flavor gets permanently stuck if a single
    // rAF callback is ever dropped (e.g. the tab loses focus/visibility
    // mid-scroll), silently ignoring every scroll event for the rest of
    // this hover. See useVisibleRowRange.ts for the fuller writeup -- same
    // bug class found there.
    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = null;
        updatePreviewPosition();
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [hovered]);

  // Resize handles need to stay visible while the cursor is over either of
  // them, but they're siblings of the button (not descendants -- nesting
  // an interactive drag handle inside the clickable tile risks the
  // mouseup landing back on the button and firing onClick), positioned at
  // its very edges. So hover tracking lives on the shared wrapping div
  // below instead of the button itself -- otherwise moving from the
  // button onto a handle would fire the button's onMouseLeave and hide
  // the handles out from under the cursor mid-reach.
  const canResize = !locked && !!onResizeStart;

  return (
    <div
      className="relative h-full w-full"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={onClick}
        // No overflow-hidden here on purpose -- at level 2 the icon (40px)
        // is taller than the tile (32px) and is meant to visibly overflow
        // it, matching the sidebar icon's overflow treatment. Horizontal
        // containment still works without it: the title/subtitle below
        // truncate themselves (their own non-visible overflow), which gives
        // them an automatic flex min-width of 0 to shrink into.
        data-official-locked={locked ? "" : undefined}
        className={`group flex h-full w-full items-center gap-1 rounded-full border text-left backdrop-blur-sm transition-colors ${
          hasTitleContent ? "pr-2" : centerIconOnly ? "justify-center" : ""
        }`}
        style={{
          backgroundColor: background,
          // Owned (shelved/ordered) gets a subtle ring tinted with the
          // line's own color (see ownedTileBorderColor) -- on the actual
          // border, not a separate inset box-shadow, so it sits flush with
          // the tile's true edge instead of 1px inside it. Focused/
          // speculative's full-color ring takes priority when present;
          // ownership is still visible then via the tile's own higher fill
          // opacity (see TILE_OPACITY).
          borderColor: speculative
            ? line.colorHex
            : focused
            ? line.colorHex
            : owned
            ? ownedTileBorderColor(line.colorHex)
            : "transparent",
        }}
        title={`${line.name} ${volumeNumberLabel(volume)}: ${volume.title}`}
      >
      {showIcon ? (
        // Level 2 only: width matches the icon's own w-7 (28px) exactly,
        // flush against the tile's left edge (that tile is short enough
        // that the old 40px box's dead space read as misaligned). Level 1
        // (the default view) keeps the original w-10 (40px) box, centering
        // the 28px icon with 6px of breathing room on each side -- there's
        // no cramped-edge problem there, so no reason to lose the spacing.
        // Height stays h-10 either way so the badge still has vertical room
        // to sit below the icon.
        <span
          className={`relative flex h-10 shrink-0 items-center justify-center ${
            zoomLevel === 2 ? "w-7" : "w-10"
          }`}
        >
          <span
            className="mb-2 h-7 w-7 overflow-hidden rounded-full border-2"
            style={{ borderColor: line.colorHex }}
          >
            <LineIcon iconUrl={volumeIconUrl(volume, line)} />
          </span>
          {badge}
        </span>
      ) : (
        badge
      )}
      {hasTitleContent && (
        <span className="min-w-0">
          <span
            className={`block truncate text-sm font-semibold ${speculative ? "" : "text-white"}`}
            style={speculative ? { color: speculativeTextColor(line.colorHex) } : undefined}
          >
            {volume.title}
          </span>
          {showSubtitle && (
            <span className="block truncate text-xs italic text-neutral-300">
              {volume.issuesCollected}
            </span>
          )}
        </span>
      )}
      </button>
      {canResize && hovered && (
        <>
          <div
            className="absolute inset-y-0 left-1 z-10 flex w-3 cursor-ew-resize select-none items-center justify-center"
            onMouseDown={(e) => {
              // Otherwise a mousedown-and-drag gesture here also kicks off
              // the browser's own default text-selection drag underneath --
              // it doesn't block our custom drag (that's driven entirely by
              // the window mousemove/mouseup listeners LineTimelineLane
              // attaches on resize start), it just paints an unwanted blue
              // selection highlight sweeping across the row's text while
              // you drag. select-none on this handle covers the handle
              // itself; preventDefault covers the gesture as a whole, since
              // the drag continues out over sibling tiles/labels this
              // element doesn't contain.
              e.preventDefault();
              e.stopPropagation();
              onResizeStart!("start", e.clientX);
            }}
          >
            <img
              src={dragLeftIcon}
              alt=""
              draggable={false}
              // Level 3's tile is only ~16px tall (32px row - the 8px
              // inset-y-2 top/bottom) -- the level 1/2 h-4 (16px) icon left
              // no headroom at all there, so it's sized down to fit.
              className={`pointer-events-none w-auto select-none ${zoomLevel === 3 ? "h-2.5" : "h-4"}`}
            />
          </div>
          <div
            className="absolute inset-y-0 right-1 z-10 flex w-3 cursor-ew-resize select-none items-center justify-center"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onResizeStart!("end", e.clientX);
            }}
          >
            <img
              src={dragRightIcon}
              alt=""
              draggable={false}
              className={`pointer-events-none w-auto select-none ${zoomLevel === 3 ? "h-2.5" : "h-4"}`}
            />
          </div>
        </>
      )}
      {hovered &&
        createPortal(
          <div
            // Fixed to the viewport and driven by the cursor's clientX/Y
            // instead of the tile's own layout position -- a tile-relative
            // (e.g. horizontally centered) preview can land off screen for
            // very long volumes even though the cursor itself is on screen.
            // z-[60] clears the sticky nav (z-40) and timeline axis (z-50) so
            // it's never hidden behind them even if it clips one at the edge.
            // Portaled straight to document.body -- LineRow's own row div
            // always carries a Tailwind translate-y-* class (its enter/exit
            // fade transition), and ANY transform on an ancestor -- even an
            // identity translateY(0) -- makes that ancestor the containing
            // block for descendant `position: fixed` elements per the CSS
            // spec, so without the portal this rendered relative to the row,
            // not the viewport, landing far from the cursor.
            className="pointer-events-none fixed z-[60] flex w-72 items-start overflow-hidden rounded-md border border-neutral-700 bg-neutral-900 shadow-xl"
            style={{
              left: mouseX,
              top: previewTop,
              transform: flipBelow ? "translate(-50%, 8px)" : "translate(-50%, calc(-100% - 8px))",
            }}
          >
            {volume.coverUrl && (
              <div className="shrink-0 p-2.5">
                <img src={volume.coverUrl} alt="" className="w-20" />
              </div>
            )}
            <div className="min-w-0 flex-1 px-3 py-2.5">
              <p className="text-xs font-semibold leading-snug text-white">{volume.title}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-neutral-400">
                {volume.issuesCollected}
              </p>
              {/* Read-only -- same OWNERSHIP_META icon+label as
                  VolumeDetailPanel's status picker, just not clickable here.
                  Speculative volumes don't track ownership (see VolumeTile's
                  owned styling above, which is a no-op for them too), so
                  this is skipped for those the same way the picker is. */}
              {!speculative && (
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-300">
                  <img
                    src={OWNERSHIP_META[volume.ownershipStatus].iconUrl}
                    alt=""
                    className="h-2.5 w-2.5 shrink-0"
                  />
                  {OWNERSHIP_META[volume.ownershipStatus].label}
                </p>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
