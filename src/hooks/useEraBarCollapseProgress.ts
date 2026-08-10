import { useEffect, useState, type RefObject } from "react";
import { NAV_HEIGHT } from "../components/TopNav";

// How much additional page scroll (after the axis sticks to the top of the
// viewport) it takes for the era bar to fully collapse -- shorter than the
// sidebar's horizontal SIDEBAR_COLLAPSE_RANGE (160px) since this is a
// smaller visual change (a height + label fade, not a full width collapse).
const ERA_BAR_SCROLL_COLLAPSE_RANGE = 96;

/**
 * Continuous 0-1 progress for the era bar's scroll-collapse, same idea as
 * the sidebar pill's horizontal collapseProgress (see
 * useSidebarPillMetrics): 0 once the axis has just stuck to the top of the
 * viewport, ramping to 1 over ERA_BAR_SCROLL_COLLAPSE_RANGE px of further
 * scroll.
 *
 * `anchorRef` must point to a zero-height marker rendered immediately
 * before the sticky axis container (not the sticky container itself) --
 * once an element is actively pinned by `position: sticky`, its own
 * `getBoundingClientRect()` reports the pinned position, not where it would
 * naturally sit, so a non-sticky sibling is needed to measure the "natural"
 * scroll-triggering offset reliably at any scroll position.
 *
 * `enabled` (App.tsx passes `isDcFinest`, the only collection with an era
 * bar) skips attaching the scroll/resize listeners entirely rather than
 * just discarding the result -- App.tsx already zeroes out `eraBarHeight`
 * for every other collection, but without this the listeners (and the
 * setState + re-render they drive on every scroll tick) would still run
 * app-wide regardless of which tab is active, for a value nothing ever
 * looks at there. Re-enabling (switching back to DC Finest) re-attaches and
 * immediately recomputes from the current scroll position, so there's no
 * stale value left over from before it was last disabled.
 */
export function useEraBarCollapseProgress(
  anchorRef: RefObject<HTMLDivElement>,
  enabled: boolean
) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    // rAF-gated so this doesn't recompute on every scroll pixel -- but
    // gated via a cancel-and-reschedule handle, not a "ticking" boolean
    // that only its own rAF callback can clear. See useVisibleRowRange.ts
    // for the fuller writeup of why that flavor has a stuck-forever
    // failure mode (a single dropped rAF callback -- e.g. the tab losing
    // focus/visibility mid-scroll, which browsers routinely throttle rAF
    // for -- permanently freezes it, silently ignoring every scroll event
    // for the rest of the page's life) that canceling and rescheduling
    // instead avoids: each new scroll event recovers on its own regardless
    // of whether the previous rAF ever actually fired.
    let rafId: number | null = null;
    const compute = () => {
      rafId = null;
      const el = anchorRef.current;
      if (!el) return;
      const naturalTop = el.getBoundingClientRect().top + window.scrollY;
      const stickyThreshold = naturalTop - NAV_HEIGHT;
      const raw = (window.scrollY - stickyThreshold) / ERA_BAR_SCROLL_COLLAPSE_RANGE;
      setProgress(Math.min(1, Math.max(0, raw)));
    };
    const handleScroll = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [anchorRef, enabled]);

  return progress;
}
