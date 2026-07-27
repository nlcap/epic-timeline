import { useRef, useState, type MouseEvent } from "react";
import type { Line, Volume } from "../types";
import { OWNED_STATUSES } from "../types";
import { speculativeTextColor, speculativeTileBackground, tileBackground } from "../lib/color";
import { AXIS_HEIGHT, quartersBetween, type ZoomLevel } from "../lib/timeline";
import { volumeBadgeText, volumeIconUrl, volumeNumberLabel } from "../lib/era";
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
  const badgeWidthClass = volume.era ? "w-7" : "w-5";
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
  // Preview follows the cursor's x position (not the tile's own horizontal
  // center) so very long volumes -- whose center can be far off screen --
  // still show their preview near wherever the mouse actually is.
  const [mouseX, setMouseX] = useState(0);

  const handleMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
    const top = buttonRef.current?.getBoundingClientRect().top ?? Infinity;
    setFlipBelow(top < PREVIEW_CLEARANCE);
    setMouseX(e.clientX);
    setHovered(true);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    setMouseX(e.clientX);
  };

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
        className="group flex h-full w-full items-center gap-1 rounded-full border pr-2 text-left backdrop-blur-sm transition-colors"
        style={{
          backgroundColor: background,
          borderColor: speculative ? line.colorHex : focused ? line.colorHex : "transparent",
          // Subtle inset ring marking a tile as owned (shelved/ordered) --
          // independent of the borderColor above, which is reserved for
          // the focused/speculative line-color ring.
          boxShadow: owned ? "inset 0 0 0 1px rgba(255, 255, 255, 0.05)" : undefined,
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
      {showTitle && !singleQuarter && (
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
            className="absolute inset-y-0 left-1 z-10 flex w-3 cursor-ew-resize items-center justify-center"
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart!("start", e.clientX);
            }}
          >
            <img src={dragLeftIcon} alt="" className="pointer-events-none h-4 w-auto" />
          </div>
          <div
            className="absolute inset-y-0 right-1 z-10 flex w-3 cursor-ew-resize items-center justify-center"
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart!("end", e.clientX);
            }}
          >
            <img src={dragRightIcon} alt="" className="pointer-events-none h-4 w-auto" />
          </div>
        </>
      )}
      {hovered && (
        <div
          // Fixed to the viewport and driven by the cursor's clientX/Y
          // instead of the tile's own layout position -- a tile-relative
          // (e.g. horizontally centered) preview can land off screen for
          // very long volumes even though the cursor itself is on screen.
          // z-[60] clears the sticky nav (z-40) and timeline axis (z-50) so
          // it's never hidden behind them even if it clips one at the edge.
          className="pointer-events-none fixed z-[60] flex w-72 items-start overflow-hidden rounded-md border border-neutral-700 bg-neutral-900 shadow-xl"
          style={{
            left: mouseX,
            top: buttonRef.current?.getBoundingClientRect()[flipBelow ? "bottom" : "top"],
            transform: flipBelow ? "translate(-50%, 8px)" : "translate(-50%, calc(-100% - 8px))",
          }}
        >
          {volume.coverUrl && (
            <img src={volume.coverUrl} alt="" className="w-20 shrink-0" />
          )}
          <div className="min-w-0 flex-1 px-3 py-2.5">
            <p className="text-xs font-semibold leading-snug text-white">{volume.title}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-neutral-400">
              {volume.issuesCollected}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
