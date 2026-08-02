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

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", handleWindowLeave);
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });

    return () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      window.removeEventListener("pointermove", handlePointerMove);
      document.documentElement.removeEventListener("pointerleave", handleWindowLeave);
      window.removeEventListener("scroll", handleScroll, true);
      hovered?.classList.remove(ADD_VOLUME_CELL_HOVER_CLASS);
    };
  }, []);
}
