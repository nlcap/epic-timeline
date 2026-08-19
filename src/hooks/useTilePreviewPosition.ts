import { useEffect, useRef, useState, type MouseEvent } from "react";
import { NAV_HEIGHT } from "../components/TopNav";
import { AXIS_HEIGHT } from "../lib/timeline";
import { PREVIEW_CARD_WIDTH_PX } from "../components/TilePreviewCard";

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
 *
 * @param autoPreview Volume stepper (see VolumeStepper.tsx/LineRow.tsx):
 * true the instant a chevron click picks this tile as its target, standing
 * in for a real hover the cursor -- parked on the stepper panel, not the
 * tile -- never actually makes. Purely additive: doesn't touch `hovered`
 * (real mouse hover, still the only thing driving the resize handles
 * below), only widens `previewVisible`, and the effect that measures a
 * position for it only runs when there's no genuine hover already
 * supplying one.
 * @param suppressHover True for the duration of a chevron-triggered smooth
 * scroll (same `stepScrolling` flag gating the sidebar pill's own hover
 * elsewhere -- see LineRow.tsx). The scroll moves every tile under a
 * cursor that never itself moved, which the browser reads as a genuine
 * mouseenter/mouseleave sequence on whatever tile happens to pass under
 * it -- without this, that phantom hover could pop a real preview card for
 * some tile that was never intentionally hovered, or race the destination
 * tile's own autoPreview once it lands. Blocks new real hovers from
 * opening AND force-clears one already open the instant this turns true,
 * so the whole scroll -- start to landing -- shows no real hover, leaving
 * the field clear for the destination's autoPreview, which is already
 * showing by then.
 * @param autoPreviewDelta Paired with autoPreview: how many px the timeline
 * is about to scroll by (positive = content moving left on screen). Lets
 * the auto-preview effect below compute this tile's FINAL resting spot --
 * its current (pre-scroll) rect.left minus this delta -- instead of
 * waiting for the scroll to actually get there, so the card can show the
 * instant the chevron is clicked, already positioned correctly, with the
 * tile gliding into place under/beside it rather than the card lagging
 * behind the tile's own landing.
 * @param onHoverStart Called when a GENUINE mouse hover of this tile begins
 * -- not when autoPreview opens one, and not while suppressHover is gating
 * hovers during a step's own scroll. App.tsx uses it to retire a lingering
 * auto-preview anywhere on the timeline, so moving onto a different volume
 * swaps the panel over instead of leaving two on screen.
 */
export function useTilePreviewPosition(
  autoPreview: boolean = false,
  suppressHover: boolean = false,
  autoPreviewDelta: number = 0,
  onHoverStart?: () => void
) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);
  const [flipBelow, setFlipBelow] = useState(false);
  // Top edge (viewport px) the preview should anchor to -- recomputed
  // explicitly (not read from the ref inline during render) so it can also
  // be refreshed on scroll while hovered, see the effect below.
  const [previewTop, setPreviewTop] = useState(0);
  // Preview follows the cursor's x position (not the tile's own horizontal
  // center) so very long volumes -- whose center can be far off screen --
  // still show their preview near wherever the mouse actually is. During
  // auto-preview there's no cursor to follow, so this holds the tile's own
  // horizontal center instead (set below).
  const [mouseX, setMouseX] = useState(0);

  // Real hover OR a forced auto-preview -- gates the preview card itself
  // (see VolumeTile.tsx). Kept separate from `hovered` so auto-preview
  // never also reveals the resize handles, which should still need a
  // genuine hover.
  const previewVisible = hovered || autoPreview;

  const updatePreviewPosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const shouldFlipBelow = rect.top < PREVIEW_CLEARANCE;
    setFlipBelow(shouldFlipBelow);
    setPreviewTop(shouldFlipBelow ? rect.bottom : rect.top);
  };

  const handleMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
    if (suppressHover) return;
    updatePreviewPosition();
    setMouseX(e.clientX);
    setHovered(true);
    // After the position is set, so the tile this hover belongs to is already
    // rendering its own card by the time a lingering auto-preview elsewhere
    // is torn down -- the swap reads as one panel replacing another rather
    // than a gap with nothing showing. Harmless when the hovered tile IS the
    // auto-previewed one: `hovered` above already keeps the card visible (see
    // previewVisible), so clearing autoPreview just hands positioning over to
    // the cursor instead of the tile's left edge.
    onHoverStart?.();
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    setMouseX(e.clientX);
  };

  const handleMouseLeave = () => setHovered(false);

  // suppressHover turning on: clears a real hover that was already open the
  // instant a chevron click starts a scroll, rather than waiting for a
  // mouseleave that -- with the cursor sitting still on the stepper panel,
  // not drifting off the tile itself -- may never actually fire.
  useEffect(() => {
    if (suppressHover) setHovered(false);
  }, [suppressHover]);

  // Auto-preview turning on: measure a position immediately, at CLICK time
  // -- there's no cursor position to use instead, the same way a real
  // mouseenter would via handleMouseEnter above, except the tile hasn't
  // necessarily scrolled anywhere yet. Skipped while a genuine hover is
  // already in progress -- that hover's own position should win, not get
  // clobbered by this.
  //
  // autoPreviewDelta is what makes showing this early safe: rather than
  // reading the tile's CURRENT rect.left (correct only once the scroll has
  // actually settled), it's read now and adjusted by how far the timeline
  // is about to scroll, landing on the tile's FINAL resting spot from the
  // very first frame. That's what lets this fire the instant the chevron
  // is clicked (Nick wanted zero lag) instead of waiting out the scroll --
  // a single measurement here is enough, no need to keep tracking the
  // whole animation the way a moving cursor would.
  //
  // Anchored to the tile's LEFT edge (the volume's start), not its center
  // like a real cursor-driven hover -- there's no cursor to center under
  // here, and the left edge reads as "this is the volume that was stepped
  // to" more clearly than a centered card would for long volumes whose
  // start can be far from their midpoint. The card itself always centers
  // on `left` (see TilePreviewCard's translate(-50%, ...)), so its own
  // half-width has to be added back on top of the rect's true left edge to
  // land the card's rendered left edge flush with it instead.
  useEffect(() => {
    if (!autoPreview || hovered) return;
    updatePreviewPosition();
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setMouseX(rect.left - autoPreviewDelta + PREVIEW_CARD_WIDTH_PX / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPreview]);

  // A tile that's mid-screen when hovered can scroll close to the sticky
  // nav/axis header without the mouse ever moving (wheel/trackpad scroll
  // while still hovering) -- flipBelow was previously decided once on
  // mouseenter and never revisited, so the preview could end up rendered
  // above the tile (and behind/overlapping the sticky header) once that
  // scroll brought the tile close enough to the top. Recompute on every
  // scroll/resize for as long as the preview stays visible (real hover or
  // auto-preview alike).
  useEffect(() => {
    if (!previewVisible) return;
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
  }, [previewVisible]);

  return {
    buttonRef,
    hovered,
    previewVisible,
    flipBelow,
    previewTop,
    mouseX,
    handleMouseEnter,
    handleMouseMove,
    handleMouseLeave,
  };
}
