import { useRef } from "react";
import { useSidebarPillMetrics } from "../hooks/useSidebarPillMetrics";
import { PlusIcon } from "./icons";

/**
 * Fixed to the viewport's bottom-left corner (see the wrapping div in
 * App.tsx) rather than sitting inline as the last row of the sidebar list --
 * that way it's always reachable without scrolling all the way down a long
 * line list, and it can't get scrolled out of view. Still shares the same
 * pill collapse/expand behavior as every other sidebar row (via
 * useSidebarPillMetrics + the caller's scrollLeft) purely for visual
 * consistency with them -- it no longer needs any translateX positioning
 * hack of its own since position:fixed already keeps it put regardless of
 * scrolling.
 */
export function AddLineButton({
  scrollLeft,
  sidebarWidth,
  onClick,
  pillHeight,
  speculative = false,
}: {
  scrollLeft: number;
  sidebarWidth: number;
  onClick: () => void;
  pillHeight: number;
  /** Speculation Mode: swaps the label for "Add Speculative Line". */
  speculative?: boolean;
}) {
  // Icon shrinks with the pill so it never exceeds it -- capped rather than
  // scaled past a comfortable minimum, since (unlike LineRow's line icon)
  // this one isn't meant to overflow its border.
  const iconSize = Math.min(36, pillHeight - 8);
  // Collapsed width includes the button's px-2 padding on both sides (this
  // icon doesn't overflow the pill like LineRow's does, so it needs the
  // padding reserved rather than sitting flush against the edge).
  const pillRef = useRef<HTMLButtonElement>(null);
  const { hovered, setHovered, pillWidth, labelOpacity, collapseProgress } =
    useSidebarPillMetrics(scrollLeft, sidebarWidth, iconSize + 16, pillRef);
  // Only the idle collapsed pill (icon-only, unhovered) goes fully round --
  // hovering back open or sitting unscrolled keeps the rectangular pill
  // shape, same as every other row.
  const isCollapsed = !hovered && collapseProgress > 0;

  return (
    <button
      ref={pillRef}
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`flex items-center overflow-hidden border border-dashed border-neutral-700/60 bg-[#1E1E1E]/60 px-2 text-neutral-400 shadow-lg backdrop-blur-[4px] transition-[width,color,border-color,border-radius,background-color] duration-150 ease-out hover:border-neutral-500 hover:bg-[#1E1E1E]/75 hover:text-white ${
        isCollapsed ? "rounded-[999px]" : "rounded-md"
      }`}
      style={{
        width: pillWidth,
        height: pillHeight,
        // Gap collapses with the label instead of staying reserved -- see
        // the matching comment in LineRow.
        gap: 12 * labelOpacity,
      }}
    >
      <span
        className="flex shrink-0 items-center justify-center rounded-full border-2 border-current"
        style={{ height: iconSize, width: iconSize }}
      >
        <PlusIcon className="h-4 w-4" />
      </span>
      <span
        className="whitespace-nowrap text-sm font-semibold transition-opacity duration-150 ease-out"
        style={{ opacity: labelOpacity }}
      >
        {speculative ? "Add Speculative Line" : "Add Line"}
      </span>
    </button>
  );
}
