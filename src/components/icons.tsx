/**
 * The handful of inline SVG glyphs that were being pasted into component
 * after component -- the select chevron alone appeared six times across
 * three files, each one a dozen identical lines of markup around a single
 * `d` attribute.
 *
 * Every icon takes a `className` (that's the only thing call sites ever
 * varied) and inherits its colour from `currentColor`, so they restyle
 * with the text around them exactly as the inlined copies did.
 *
 * Deliberately narrow: this is for glyphs that genuinely repeat. One-off
 * icons stay inline in the component that owns them, where they're easier
 * to read than an indirection would be.
 */

/** Chevron pointing down -- select-box affordance, dropdown triggers. */
export function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/** Trash can -- the two hover-revealed image reset overlays. */
export function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

/** Plus -- every "add a thing" affordance (Add Line, Add Volume, the
 * timeline's per-quarter hover cells).
 *
 * `strokeWidth` is a prop rather than fixed because the timeline's hover
 * cell draws its plus heavier (2) than the buttons do (1.75) -- it sits on
 * a busy background at small sizes and needs the extra weight to read. */
export function PlusIcon({
  className,
  strokeWidth = 1.75,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      className={className}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
