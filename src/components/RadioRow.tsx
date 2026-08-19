/**
 * One radio row in a settings dialog -- a bordered, selectable block with a
 * label and a description, used wherever a choice is mutually exclusive
 * rather than a set of independent toggles (see CheckRow for that case).
 * Shared by the import dialog's replace/merge choice and the reset
 * dialog's "what to reset" choice, so both look and behave identically.
 */
export function RadioRow({
  label,
  description,
  checked,
  onSelect,
}: {
  label: string;
  description: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={`flex w-full items-start gap-2.5 rounded-md border px-3 py-2.5 text-left transition-colors ${
        checked
          ? "border-neutral-500 bg-neutral-800"
          : "border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/50"
      }`}
    >
      <span
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
          checked ? "border-white" : "border-neutral-600"
        }`}
      >
        {checked && <span className="h-2 w-2 rounded-full bg-white" />}
      </span>
      <span className="flex flex-col">
        <span className="text-sm text-neutral-200">{label}</span>
        <span className="text-xs text-neutral-500">{description}</span>
      </span>
    </button>
  );
}
