/**
 * One quarter-wide hover target over an empty stretch of a line's row --
 * rendered only for quarters not already covered by a volume or gap tile
 * (see LineRow.tsx, which skips generating one anywhere an entry already
 * sits). Shows a plus-in-circle affordance on hover, purely via CSS
 * (group-hover, no per-cell React state) since a row can have hundreds of
 * these across a long timeline. Clicking anywhere in the cell is a shortcut
 * to "New Volume" for this line, with the start quarter pre-filled to
 * whichever quarter was clicked.
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
      className="group flex h-full w-full items-center justify-center"
    >
      <span
        className="flex items-center justify-center rounded-full border border-neutral-500 bg-neutral-900/80 text-neutral-200 opacity-0 transition-opacity duration-100 ease-out group-hover:opacity-100"
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
