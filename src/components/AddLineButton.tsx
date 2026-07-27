import { useSidebarPillMetrics } from "../hooks/useSidebarPillMetrics";

export function AddLineButton({
  scrollLeft,
  sidebarWidth,
  onClick,
  rowHeight,
  pillHeight,
  speculative = false,
}: {
  scrollLeft: number;
  sidebarWidth: number;
  onClick: () => void;
  rowHeight: number;
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
  const { setHovered, pillWidth, labelOpacity } = useSidebarPillMetrics(
    scrollLeft,
    sidebarWidth,
    iconSize + 16
  );

  return (
    <div
      className="relative flex shrink-0 items-center"
      style={{ width: sidebarWidth, height: rowHeight }}
    >
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative z-20 flex items-center overflow-hidden rounded-md border border-dashed border-neutral-700/.1 px-2 text-neutral-400 transition-[width,color,border-color] duration-150 ease-out hover:border-neutral-500 hover:text-white"
        style={{
          width: pillWidth,
          height: pillHeight,
          // Gap collapses with the label instead of staying reserved -- see
          // the matching comment in LineRow.
          gap: 12 * labelOpacity,
          transform: `translateX(${scrollLeft}px)`,
        }}
      >
        <span
          className="flex shrink-0 items-center justify-center rounded-full border-2 border-current"
          style={{ height: iconSize, width: iconSize }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            className="h-4 w-4"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
        <span
          className="whitespace-nowrap text-sm font-semibold transition-opacity duration-150 ease-out"
          style={{ opacity: labelOpacity }}
        >
          {speculative ? "Add Speculative Line" : "Add Line"}
        </span>
      </button>
    </div>
  );
}
