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
 */
export function useEraBarCollapseProgress(anchorRef: RefObject<HTMLDivElement>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const el = anchorRef.current;
      if (!el) return;
      const naturalTop = el.getBoundingClientRect().top + window.scrollY;
      const stickyThreshold = naturalTop - NAV_HEIGHT;
      const raw = (window.scrollY - stickyThreshold) / ERA_BAR_SCROLL_COLLAPSE_RANGE;
      setProgress(Math.min(1, Math.max(0, raw)));
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [anchorRef]);

  return progress;
}
