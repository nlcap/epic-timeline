import { hexToRgba, SPECULATION_ACCENT_HEX } from "../lib/color";

/** Switch-style control sitting above the zoom pill, in the same fixed
 * right-edge stack (see App.tsx). Global -- one toggle controls Speculation
 * Mode across every collection tab at once. */
export function SpeculationModeToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label="Speculation Mode"
      title="Speculation Mode"
      data-tour-target="speculation-toggle"
      onClick={onToggle}
      className={`flex h-7 w-12 shrink-0 items-center rounded-full border border-neutral-700 p-0.5 shadow-lg backdrop-blur transition-colors ${
        enabled ? "" : "bg-neutral-900/90"
      }`}
      style={{ backgroundColor: enabled ? hexToRgba(SPECULATION_ACCENT_HEX, 0.8) : undefined }}
    >
      <span
        className={`h-6 w-6 rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
