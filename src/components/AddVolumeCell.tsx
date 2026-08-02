// Shared with useAddVolumeCellHover, which delegates pointerover/pointerout
// off the row container instead of relying on per-cell CSS `:hover` -- see
// that hook for why. ATTR marks a cell as a delegation target; HOVER_CLASS
// is what the hook toggles to drive the icon's opacity (see index.css).
export const ADD_VOLUME_CELL_ATTR = "data-add-volume-cell";
export const ADD_VOLUME_CELL_HOVER_CLASS = "add-volume-cell--hovered";

/**
 * One quarter-wide hover target over an empty stretch of a line's row --
 * rendered only for quarters not already covered by a volume or gap tile
 * (see LineRow.tsx, which skips generating one anywhere an entry already
 * sits). Shows a plus-in-circle affordance on hover, driven by
 * useAddVolumeCellHover's event delegation (no per-cell React state or
 * listeners) since a row can have hundreds of these across a long
 * timeline. Clicking anywhere in the cell is a shortcut to "New Volume"
 * for this line, with the start quarter pre-filled to whichever quarter
 * was clicked.
 */
export function AddVolumeCell({
  onClick,
  iconSize,
}: {
  onClick: () => void;
  iconSize: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Add volume starting this quarter"
      {...{ [ADD_VOLUME_CELL_ATTR]: "" }}
      className="flex h-full w-full items-center justify-center"
    >
      <span
        className="add-volume-cell-icon flex items-center justify-center rounded-full border border-neutral-500 bg-neutral-900/80 text-neutral-200 transition-opacity duration-100 ease-out"
        style={{ height: iconSize, width: iconSize }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          className="h-1/2 w-1/2"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>
    </button>
  );
}
