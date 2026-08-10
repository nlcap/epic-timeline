import { useEffect, useRef, useState, type MouseEvent } from "react";
import { NAV_HEIGHT } from "../components/TopNav";
import { AXIS_HEIGHT } from "../lib/timeline";

// Rough max height of the floating hover preview (see TilePreviewCard). The
// cover sits beside the title/subtitle text rather than above it, so the
// card's height tracks whichever is taller instead of summing both --
// subtitle text can run long, but it wraps within a fixed-width column
// rather than stretching the card, so this estimate stays modest. Combined
// with the fixed nav bar and sticky timeline axis (both stacked above the
// preview's own z-index), this is how much clear space a tile needs above
// it before the preview will fit without floating up behind them.
const PREVIEW_HEIGHT_ESTIMATE = 160;
const PREVIEW_CLEARANCE = NAV_HEIGHT + AXIS_HEIGHT + PREVIEW_HEIGHT_ESTIMATE;

/**
 * Shared hover-preview positioning behind VolumeTile/NoteTile's floating
 * cover/title card (see TilePreviewCard) -- both used to reimplement this
 * same hover-tracking/flip/scroll-reposition logic individually. Returns a
 * `buttonRef` for the caller to attach to its own clickable tile button
 * (position is measured from that element's rect, not the wrapping div,
 * whose box also covers the resize handles' hit area) plus mouse handlers
 * meant for that wrapping div.
 */
export function useTilePreviewPosition() {
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

  const handleMouseLeave = () => setHovered(false);

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

  return {
    buttonRef,
    hovered,
    flipBelow,
    previewTop,
    mouseX,
    handleMouseEnter,
    handleMouseMove,
    handleMouseLeave,
  };
}
