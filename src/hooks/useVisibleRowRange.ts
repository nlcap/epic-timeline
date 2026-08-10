import { useEffect, useRef, useState, type RefObject } from "react";

// A row's cells are invisible until hovered, and a user can't hover a row
// that isn't on screen -- so this buffer only needs to be big enough to
// avoid a visible one-frame pop-in as a row crosses into view, not to cover
// any real interaction-correctness gap. Expressed in row *counts*, not px,
// so it scales automatically with rowHeight across zoom levels.
const BUFFER_ROWS = 4;

/**
 * Which row indices (0-based, into a stack of rows stacked starting at
 * `containerRef`'s own top, each `rowHeights[i]` tall -- not necessarily
 * uniform, since a Licensed-collection line with multiple swim lanes is
 * taller than a single-lane one, see lineHeight in lib/timeline.ts) are
 * within the window's visible viewport plus BUFFER_ROWS -- used to skip
 * rendering each row's expensive hover "add volume" cell layer (see
 * LineRow.tsx / AddVolumeCellsLayer) for rows currently scrolled out of
 * view. Vertical scrolling here is the whole page (window scroll), not a
 * fixed-height inner container, so this tracks window.scrollY the same way
 * useEraBarCollapseProgress does -- both rAF-gated, but this one additionally
 * only commits state when the *row range* actually changes (not on every
 * rAF tick), since unlike that hook's continuous float this only needs to
 * change in whole-row steps.
 *
 * Callers must pass a `rowHeights` array that's stable (same reference)
 * across renders where the actual per-row heights haven't changed -- it's
 * a hook dependency, so a fresh array every render would tear down and
 * re-add the scroll/resize listeners on every render instead of only when
 * heights genuinely change (see rowHeights construction in App.tsx).
 */
export function useVisibleRowRange(
  containerRef: RefObject<HTMLDivElement>,
  rowHeights: number[]
): [number, number] {
  const [range, setRange] = useState<[number, number]>([0, rowHeights.length]);
  const rangeRef = useRef(range);
  rangeRef.current = range;

  useEffect(() => {
    // Cumulative top-offset of each row, computed once per rowHeights
    // change (not per scroll tick) -- offsets[i] is row i's own top,
    // relative to the container. rowHeights.length is small (tens to low
    // hundreds of lines even for a big collection), so this and the linear
    // scan in `compute` below are both cheap; a binary search over offsets
    // would shave microseconds nothing here is waiting on.
    const offsets: number[] = new Array(rowHeights.length);
    let cumulative = 0;
    for (let i = 0; i < rowHeights.length; i++) {
      offsets[i] = cumulative;
      cumulative += rowHeights[i];
    }

    // rAF-gated so this doesn't recompute on every scroll pixel -- but
    // gated via a cancel-and-reschedule handle, not a "ticking" boolean
    // that only its own rAF callback can clear. That flavor has a stuck-
    // forever failure mode: if a browser ever drops or indefinitely delays
    // one rAF callback (e.g. the tab loses focus/visibility mid-scroll,
    // which browsers routinely throttle rAF for), nothing else can ever
    // flip the flag back, so every scroll event after that point is
    // silently ignored for the rest of the page's life -- freezing the
    // visible-row range at whatever it was, permanently starving every
    // row outside that stale window of its "add volume" cells until a
    // hard refresh. Canceling and rescheduling instead means each new
    // scroll event recovers on its own regardless of whether the previous
    // rAF ever actually fired.
    let rafId: number | null = null;
    const compute = () => {
      rafId = null;
      const el = containerRef.current;
      if (!el) return;
      const containerTop = el.getBoundingClientRect().top + window.scrollY;
      const viewTop = window.scrollY;
      const viewBottom = window.scrollY + window.innerHeight;

      let start = rowHeights.length;
      let end = 0;
      for (let i = 0; i < rowHeights.length; i++) {
        const rowTop = containerTop + offsets[i];
        const rowBottom = rowTop + rowHeights[i];
        if (rowBottom >= viewTop && rowTop <= viewBottom) {
          if (i < start) start = i;
          end = i + 1;
        }
      }
      // No rows intersect the viewport at all (e.g. an empty collection) --
      // fall back to an empty range instead of the swapped/inverted one the
      // loop above would otherwise leave behind.
      if (start > end) {
        start = 0;
        end = 0;
      } else {
        start = Math.max(0, start - BUFFER_ROWS);
        end = Math.min(rowHeights.length, end + BUFFER_ROWS);
      }

      const [prevStart, prevEnd] = rangeRef.current;
      if (start !== prevStart || end !== prevEnd) {
        setRange([start, end]);
      }
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
  }, [containerRef, rowHeights]);

  return range;
}
