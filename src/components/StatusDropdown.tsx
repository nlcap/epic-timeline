import { useRef, useState, type ReactNode } from "react";

// One option row is py-1.5 padding (12px) + text-sm line height (20px) =
// 32px, plus the list's own py-1 (8px) container padding -- used to guess
// the picker's rendered height before it's actually mounted, so the
// open-above decision (see openAbove below) can be made in the same click
// that opens it instead of flashing open-below-then-correcting.
const OPTION_HEIGHT = 32;

export interface StatusDropdownOption<T extends string> {
  value: T;
  label: string;
  icon: ReactNode;
}

/**
 * Small pill button + option list used for the volume detail panel's status
 * pickers (shelving, reading). Pulled out once a second one of these showed
 * up next to the shelving picker -- same open/close/openAbove behavior,
 * only the icon and option set differ.
 */
export function StatusDropdown<T extends string>({
  icon,
  label,
  options,
  onSelect,
}: {
  icon: ReactNode;
  label: string;
  options: StatusDropdownOption<T>[];
  onSelect: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  // Decided once, when the picker opens (not continuously re-checked while
  // it's open) -- the button's own position doesn't change while the list
  // is up, so there's nothing to react to afterward the way VolumeTile's
  // hover preview needs to for scroll.
  const [openAbove, setOpenAbove] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggle = () => {
    if (!open) {
      const rect = buttonRef.current?.getBoundingClientRect();
      const heightEstimate = options.length * OPTION_HEIGHT + 8;
      setOpenAbove(!!rect && rect.bottom + heightEstimate > window.innerHeight);
    }
    setOpen((o) => !o);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        className="flex items-center gap-2 rounded-full border border-neutral-700 px-3 py-1.5 text-sm text-white"
      >
        {icon}
        {label}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3 w-3 text-neutral-500"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute left-0 z-10 w-44 rounded-md border border-neutral-700 bg-neutral-900 py-1 shadow-lg ${
            openAbove ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onSelect(option.value);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-white hover:bg-neutral-800"
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
