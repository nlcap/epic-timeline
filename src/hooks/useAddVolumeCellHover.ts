import { useEffect } from "react";
import { ADD_VOLUME_CELL_ATTR, ADD_VOLUME_CELL_HOVER_CLASS } from "../components/AddVolumeCell";

const ICON_SELECTOR = ".add-volume-cell-icon";

/**
 * Drives AddVolumeCell's hover affordance ourselves instead of relying on
 * native CSS `:hover`, which Safari/WebKit can leave visibly stuck on a
 * cell that's no longer under the pointer.
 *
 * Second attempt (first is in git history): delegated pointerover/
 * pointerout off the row container -- i.e. still trusted the browser to
 * correctly pair up "entered this element" / "left this element" events,
 * just via a different API than `:hover`. Confirmed by hand that this
 * only made the bug less frequent, not gone: it still recurred
 * specifically after the pointer rested on a cell for more than a couple
 * of seconds before moving away, not for quick movements.
 *
 * Third attempt: dropped paired enter/leave events entirely. On every raw
 * `pointermove`, hit-test the actual DOM at the cursor's current
 * coordinates (`elementFromPoint`) and set the hovered class from that,
 * full stop. Confirmed by hand (a diagnostic logging cursor position vs.
 * every classed-as-hovered element's rect) that this hit-testing is never
 * wrong -- the class only ever sat on a cell the cursor was still
 * genuinely over.
 *
 * And yet the stuck icon was still reported. Checked the DOM directly
 * (Safari's own element inspector) on a stuck icon: the hover class was
 * genuinely absent. That's conclusive -- this was never a tracking bug.
 * Safari is failing to *repaint* the element after a correct, timely
 * class removal, full stop. A follow-up guess -- periodically forcing a
 * bare `getComputedStyle` read, on the theory that reading computed style
 * flushes pending style work -- didn't fix it either, which narrows this
 * further: a style-recalculation flush alone isn't enough. Something has
 * to force an actual paint/compositing update on the specific element.
 *
 * Fourth attempt (current): the moment a cell's hover state changes
 * either way, force one by nudging a real paint-affecting property --
 * `transform` -- on that exact element and reverting it one frame later.
 * `transform` doesn't affect layout flow or hit-testing, so even if the
 * revert is ever delayed, a lingering no-op transform is inert; nothing
 * here can block a click the way the very first attempt's `pointer-events`
 * toggle could.
 */
// Nick kept fat-fingering the add-volume "+" right next to the pinned
// sidebar icon/stepper -- LineRow.tsx already excludes the lane's leading
// quarter *indexes* from ever getting a cell there (see
// addCellLeadingBlockedQuarters in lib/timeline.ts), but that exclusion is
// necessarily approximate: it's derived from scrollBucket, scrollLeft
// coarsened to avoid re-rendering the (expensive, memoized)
// LineTimelineLane on every scroll pixel, which can lag the *true*,
// continuously-updating pinned position during active/fast scrolling by
// more than that fix's own safety margin accounts for -- confirmed live by
// Nick still seeing the "+" appear right at the icon after that fix
// shipped. This hook already does its own real-time, per-pointermove DOM
// hit-testing (see the doc comment above), completely decoupled from
// React's render cycle -- so unlike the quarter-index exclusion, a check
// added here can measure the sidebar's actual current position directly,
// with no coarsening or render-lag error at all, and gate BOTH the hover
// reveal and the click itself from that single live measurement.
const SIDEBAR_PILL_SELECTOR = "button.z-20";
// Buffer added past the sidebar column's own measured right edge, covering
// sidebarGap (max 24px across zoom levels) plus real cursor-precision
// slack -- generous on purpose, since over-blocking here only costs a
// little extra rightward cursor travel to reach a real add-cell, while
// under-blocking is the exact bug being fixed.
const LANE_START_BUFFER_PX = 80;

// The measured boundary (viewport clientX) left of which add-volume-cell
// hover/click is suppressed -- null until the first successful measurement
// (e.g. before any row has mounted). Recomputed from the live DOM on every
// pointer move rather than cached indefinitely, since it depends on zoom
// level (sidebarColumnWidth) and horizontal scroll of the sidebar's own
// row, both of which can change without unmounting this hook (it's mounted
// once, for the app's lifetime).
//
// Measures the pill BUTTON itself, not its wrapping div (LineRow.tsx's
// outer sidebar-cell container) -- confirmed by hand that the wrapper is
// NOT pinned: only the button (and the stepper panel) apply their own
// `transform: translateX(scrollLeft)` individually to stay visually fixed
// as the page scrolls, while the wrapper is a normal-flow element that
// scrolls away with everything else (its rect reads far off-screen to the
// left at any real scroll position). Measuring it instead of the button
// silently made this whole fix a no-op -- the button's own rect is the one
// that actually reflects where the icon currently, visually sits.
function protectedZoneRight(): number | null {
  const pill = document.querySelector(SIDEBAR_PILL_SELECTOR);
  if (!pill) return null;
  return pill.getBoundingClientRect().right + LANE_START_BUFFER_PX;
}

export function useAddVolumeCellHover() {
  useEffect(() => {
    let hovered: Element | null = null;
    let lastX = -1;
    let lastY = -1;

    const forceRepaint = (cell: Element) => {
      const icon = cell.querySelector<HTMLElement>(ICON_SELECTOR);
      if (!icon) return;
      icon.style.transform = "translateZ(0.01px)";
      requestAnimationFrame(() => {
        icon.style.transform = "";
      });
    };

    const setHovered = (next: Element | null) => {
      if (next === hovered) return;
      if (hovered) {
        hovered.classList.remove(ADD_VOLUME_CELL_HOVER_CLASS);
        forceRepaint(hovered);
      }
      hovered = next;
      if (hovered) {
        hovered.classList.add(ADD_VOLUME_CELL_HOVER_CLASS);
        forceRepaint(hovered);
      }
    };

    const recompute = () => {
      if (lastX < 0 && lastY < 0) return;
      const protectedRight = protectedZoneRight();
      if (protectedRight !== null && lastX < protectedRight) {
        setHovered(null);
        return;
      }
      const el = document.elementFromPoint(lastX, lastY);
      setHovered(el?.closest(`[${ADD_VOLUME_CELL_ATTR}]`) ?? null);
    };

    const handlePointerMove = (e: PointerEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      recompute();
    };

    // The pointer leaving the viewport entirely doesn't fire a pointermove
    // to "nowhere" -- pointerleave on the document itself is what catches
    // that (unlike pointerout, this one isn't part of the per-element
    // enter/leave pairing this fix is specifically avoiding relying on).
    const handleWindowLeave = () => setHovered(null);

    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(recompute, 50);
    };

    // Capture-phase click guard: the hover class above only ever gates the
    // *visible* "+" affordance, not the underlying <button>'s own onClick
    // -- a click can still land and fire even on a cell that's never shown
    // as hovered (hover and click aren't sequenced), so the protected zone
    // has to be enforced here too, not just in recompute above. Capture
    // (not bubble) so this runs before AddVolumeCell's own onClick.
    const handleClickCapture = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const cell = target?.closest(`[${ADD_VOLUME_CELL_ATTR}]`);
      if (!cell) return;
      const protectedRight = protectedZoneRight();
      if (protectedRight !== null && e.clientX < protectedRight) {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", handleWindowLeave);
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    window.addEventListener("click", handleClickCapture, { capture: true });

    return () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      window.removeEventListener("pointermove", handlePointerMove);
      document.documentElement.removeEventListener("pointerleave", handleWindowLeave);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("click", handleClickCapture, true);
      hovered?.classList.remove(ADD_VOLUME_CELL_HOVER_CLASS);
    };
  }, []);
}
