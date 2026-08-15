import dragLeftIcon from "../assets/drag_left.svg";
import dragRightIcon from "../assets/drag_right.svg";
import type { ZoomLevel } from "../lib/timeline";

/**
 * Shared hover-revealed edge drag handles behind VolumeTile/NoteTile/
 * GapSegment -- identical hit area, icons, and cursor across all three tile
 * kinds, since a resize drag works the same way regardless of what's being
 * resized (see LineTimelineLane in LineRow.tsx, which owns the actual drag
 * tracking for all of them). Siblings of the tile's own clickable button
 * (not descendants -- nesting an interactive drag handle inside the
 * clickable tile risks the mouseup landing back on the button and firing
 * its onClick).
 *
 * Renders nothing when `locked`, `onResizeStart` is omitted (resizing
 * disabled entirely), or `visible` is false (not currently hovered) -- so
 * callers can render this unconditionally instead of each repeating the
 * same `!locked && onResizeStart && hovered` gate.
 */
export function TileResizeHandles({
  visible,
  locked = false,
  zoomLevel,
  onResizeStart,
}: {
  /** Whether the tile is currently hovered -- handles only show then. */
  visible: boolean;
  locked?: boolean;
  zoomLevel: ZoomLevel;
  onResizeStart?: (edge: "start" | "end", clientX: number) => void;
}) {
  if (locked || !onResizeStart || !visible) return null;

  // Level 3's tile is only ~16px tall (32px row - the 8px inset-y-2 top/
  // bottom) -- the level 1/2 h-4 (16px) icon left no headroom at all there,
  // so it's sized down to fit.
  //
  // drop-shadow (not box-shadow) so the shadow traces the icon's two bars
  // themselves -- it follows the rendered alpha shape of the img, not its
  // square bounding box -- since tile fill colors are arbitrary and light
  // fills would otherwise wash the light-gray bars out.
  const iconClassName = `pointer-events-none w-auto select-none drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.6)] ${
    zoomLevel === 3 ? "h-2.5" : "h-4"
  }`;

  return (
    <>
      <div
        className="absolute inset-y-0 left-1 z-10 flex w-3 cursor-ew-resize select-none items-center justify-center"
        onMouseDown={(e) => {
          // Otherwise a mousedown-and-drag gesture here also kicks off the
          // browser's own default text-selection drag underneath -- it
          // doesn't block our custom drag (that's driven entirely by the
          // window mousemove/mouseup listeners LineTimelineLane attaches on
          // resize start), it just paints an unwanted blue selection
          // highlight sweeping across the row's text while you drag.
          // select-none on this handle covers the handle itself;
          // preventDefault covers the gesture as a whole, since the drag
          // continues out over sibling tiles/labels this element doesn't
          // contain.
          e.preventDefault();
          e.stopPropagation();
          onResizeStart("start", e.clientX);
        }}
      >
        <img src={dragLeftIcon} alt="" draggable={false} className={iconClassName} />
      </div>
      <div
        className="absolute inset-y-0 right-1 z-10 flex w-3 cursor-ew-resize select-none items-center justify-center"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onResizeStart("end", e.clientX);
        }}
      >
        <img src={dragRightIcon} alt="" draggable={false} className={iconClassName} />
      </div>
    </>
  );
}
