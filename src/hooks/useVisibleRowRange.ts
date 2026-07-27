import { useEffect, useRef, useState, type RefObject } from "react";

// A row's cells are invisible until hovered, and a user can't hover a row
// that isn't on screen -- so this buffer only needs to be big enough to
// avoid a visible one-frame pop-in as a row crosses into view, not to cover
// any real interaction-correctness gap. Expressed in row *counts*, not px,
// so it scales automatically with rowHeight across zoom levels.
const BUFFER_ROWS = 4;

/**
 * Which row indices (0-based, into a stack of `rowCount` rows each
 * `rowHeight` tall, stacked starting at `containerRef`'s own top) are
 * within the window's visible viewport plus BUFFER_ROWS -- used to skip
 * rendering each row's expensive hover "add volume" cell layer (see
 * LineRow.tsx / AddVolumeCellsLayer) for rows currently scrolled out of
 * view. Vertical scrolling here is the whole page (window scroll), not a
 * fixed-height inner container, so this tracks window.scrollY the same way
 * useEraBarCollapseProgress does -- but rAF-gated and only committing state
 * when the *row range* actually changes (not on every scroll pixel), since
 * unlike that hook's continuous float this only needs to change in whole-
 * row steps.
 */
export function useVisibleRowRange(
  containerRef: RefObject<HTMLDivElement>,
  rowHeight: number,
  rowCount: number
): [number, number] {
  const [range, setRange] = useState<[number, number]>([0, rowCount]);
  const rangeRef = useRef(range);
  rangeRef.current = range;

  useEffect(() => {
    let ticking = false;
    const compute = () => {
      ticking = false;
      const el = containerRef.current;
      if (!el) return;
      const containerTop = el.getBoundingClientRect().top + window.scrollY;
      const viewTop = window.scrollY;
      const viewBottom = window.scrollY + window.innerHeight;
      const start = Math.max(
        0,
        Math.floor((viewTop - containerTop) / rowHeight) - BUFFER_ROWS
      );
      const end = Math.min(
        rowCount,
        Math.ceil((viewBottom - containerTop) / rowHeight) + BUFFER_ROWS
      );
      const [prevStart, prevEnd] = rangeRef.current;
      if (start !== prevStart || end !== prevEnd) {
        setRange([start, end]);
      }
    };
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [containerRef, rowHeight, rowCount]);

  return range;
}
