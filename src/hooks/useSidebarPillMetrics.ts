import { useLayoutEffect, useState, type RefObject } from "react";
import { SIDEBAR_COLLAPSE_RANGE } from "../lib/timeline";

/**
 * Shared collapse/hover math for every pill in the sidebar column (line rows
 * and the "Add Line" row) so they all shrink to icon-only at the same scroll
 * position and expand back on hover in lockstep.
 *
 * `collapsedWidth` is caller-supplied (not a shared constant) because each
 * pill's icon is sized differently per zoom level -- a fixed collapsed width
 * left a transparent-but-shadowed dead zone sticking out past the smaller
 * icons at levels 2-3, which was both a visual glitch (a drop shadow with no
 * visible content) and a mis-hover trap (hovering that empty margin
 * re-expanded the pill).
 *
 * `measureRef` is optional -- pass the pill's own button ref to have it
 * re-expand on hover to only as wide as its content needs (while scrolled);
 * omit it (e.g. the "Add Line" row) to keep the old behavior of always
 * re-expanding to the full sidebar column width.
 */
export function useSidebarPillMetrics(
  scrollLeft: number,
  sidebarWidth: number,
  collapsedWidth: number,
  measureRef?: RefObject<HTMLElement | null>
) {
  const [hovered, setHovered] = useState(false);
  const [hoverWidth, setHoverWidth] = useState(sidebarWidth);
  const collapseProgress = Math.min(1, Math.max(0, scrollLeft / SIDEBAR_COLLAPSE_RANGE));

  // Measured by momentarily letting the real element size to its content
  // (max-content), reading the result, then putting the explicit width back
  // -- all inside a layout effect, so it happens before the browser paints
  // and never flashes. Only bothers measuring while actually scrolled/
  // collapsed, since that's the only state this affects -- in the default
  // view every pill already sits at the full sidebarWidth regardless.
  useLayoutEffect(() => {
    if (!hovered || !measureRef?.current || collapseProgress === 0) return;
    const el = measureRef.current;
    const prevWidth = el.style.width;
    el.style.width = "max-content";
    const natural = el.getBoundingClientRect().width;
    el.style.width = prevWidth;
    setHoverWidth(Math.min(natural, sidebarWidth));
  }, [hovered, collapseProgress, sidebarWidth, measureRef]);

  const expandedWidth = measureRef && collapseProgress > 0 ? hoverWidth : sidebarWidth;
  const pillWidth = hovered
    ? expandedWidth
    : sidebarWidth - collapseProgress * (sidebarWidth - collapsedWidth);
  const labelOpacity = hovered ? 1 : 1 - collapseProgress;

  return { hovered, setHovered, pillWidth, labelOpacity, collapseProgress };
}
