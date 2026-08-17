/**
 * One checkbox row in a settings dialog's scoping checklist -- shared by
 * the reset dialog and the export/import pickers (see
 * DataSelectionPicker), which all offer the same collection/timeline
 * checkboxes and should look identical doing it.
 */
export function CheckRow({
  label,
  subtitle,
  count,
  checked,
  disabled = false,
  onToggle,
}: {
  label: string;
  /** e.g. "Last updated: August 4, 2026" on the reset dialog's collection
   * rows, so a user considering a reset can see how stale the seed data
   * they'd fall back to is before wiping their own edits. */
  subtitle?: string;
  /** Record count for this slice, shown right-aligned -- the import picker
   * uses it to say how much of each collection a file actually holds. */
  count?: number;
  checked: boolean;
  /** For a slice the source has nothing for: still listed (so the set of
   * options doesn't shift around between files) but not selectable. */
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm text-neutral-300 transition-colors hover:enabled:bg-neutral-800 hover:enabled:text-white disabled:cursor-not-allowed disabled:text-neutral-600"
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
          checked ? "border-white bg-white" : disabled ? "border-neutral-800" : "border-neutral-600"
        }`}
      >
        {checked && (
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="black"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3 w-3"
          >
            <path d="M3.5 8.5l3 3 6-7" />
          </svg>
        )}
      </span>
      <span className="flex flex-col">
        {label}
        {subtitle && <span className="text-xs italic text-neutral-500">{subtitle}</span>}
      </span>
      {count !== undefined && (
        <span className="ml-auto shrink-0 pl-3 text-xs tabular-nums text-neutral-500">
          {count === 0 ? "none" : `${count} record${count === 1 ? "" : "s"}`}
        </span>
      )}
    </button>
  );
}
