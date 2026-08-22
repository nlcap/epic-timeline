import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";

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

export interface StatusDropdownHandle {
  /** Opens the list (idempotent if already open) and moves real DOM focus
   * to the trigger button -- lets a keyboard shortcut elsewhere (see
   * VolumeDetailPanel's "s"/"r") jump straight into a SPECIFIC picker
   * instead of just this component's own click handler being reachable.
   * `.focus()` without `preventScroll` also scrolls the trigger into view
   * for free if the panel's been scrolled past it. */
  open: () => void;
  /** Closes the list without selecting anything -- doesn't touch focus
   * itself (unlike `open` above); the caller (VolumeDetailPanel's own "s"/
   * "r" pressed again, to close) moves focus back to the panel afterward,
   * since "back to the panel" isn't this component's to know about. */
  close: () => void;
}

/**
 * Small pill button + option list used for the volume detail panel's status
 * pickers (shelving, reading). Pulled out once a second one of these showed
 * up next to the shelving picker -- same open/close/openAbove behavior,
 * only the icon and option set differ.
 *
 * forwardRef + a cast on the exported name below (rather than a plain
 * function) only because this component is itself generic over T --
 * forwardRef's own type doesn't carry a generic through, so the ref-typed
 * export has to be reconstructed by hand underneath.
 */
function StatusDropdownInner<T extends string>(
  {
    icon,
    label,
    options,
    onSelect,
    onOpenChange,
  }: {
    icon: ReactNode;
    label: string;
    options: StatusDropdownOption<T>[];
    onSelect: (value: T) => void;
    /** Fired on every open/close (toggle, a selection, Enter below) -- lets
     * a container that ALSO listens for arrow keys at a wider scope
     * (VolumeDetailPanel's own Up/Down volume stepper) know to stand down
     * while this list has its own, narrower claim on those same keys. See
     * VolumeDetailPanel.tsx's dropdownOpen. */
    onOpenChange?: (open: boolean) => void;
  },
  ref: Ref<StatusDropdownHandle>
) {
  const [open, setOpen] = useState(false);
  // Decided once, when the picker opens (not continuously re-checked while
  // it's open) -- the button's own position doesn't change while the list
  // is up, so there's nothing to react to afterward the way VolumeTile's
  // hover preview needs to for scroll.
  const [openAbove, setOpenAbove] = useState(false);
  // Which option Up/Down is currently pointed at -- a plain highlight, not
  // real DOM focus (Enter below is handled by this component's own keydown
  // effect, not by relying on a focused option button's native Enter-click,
  // so there's no accessibility reason the options need actual focus for
  // this to work). Reset to the first option every time the list opens
  // fresh, rather than persisted across opens, since there's no strong
  // reason a REOPENED list should remember where it was left last time.
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Wraps the trigger AND the option list, so the outside-pointerdown
  // dismissal below can tell "clicked somewhere else" from "clicked my own
  // trigger/an option" -- same shape as the settings menu's own guard (see
  // SettingsMenu in TopNav.tsx).
  const containerRef = useRef<HTMLDivElement>(null);

  // Shared by both the trigger button's own click (toggle, below) and the
  // imperative handle -- computes openAbove/highlightedIndex the same way
  // regardless of which one is opening it.
  const openList = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    const heightEstimate = options.length * OPTION_HEIGHT + 8;
    setOpenAbove(!!rect && rect.bottom + heightEstimate > window.innerHeight);
    setHighlightedIndex(0);
    setOpen(true);
    onOpenChange?.(true);
  };

  const close = () => {
    setOpen(false);
    onOpenChange?.(false);
  };

  const toggle = () => {
    if (open) close();
    else openList();
  };

  useImperativeHandle(ref, () => ({
    open: () => {
      openList();
      buttonRef.current?.focus();
    },
    close,
  }));

  // Up/Down move the highlight, Enter selects it -- a window-level listener
  // (matching every other keyboard shortcut in this app) gated on `open`,
  // so it's only ever live while the list is actually showing.
  // preventDefault here only stops the browser's OWN default for these keys
  // (e.g. arrows scrolling the page); it does NOT stop VolumeDetailPanel's
  // own window-level Up/Down listener (its volume stepper) from ALSO
  // firing for the same keydown -- two listeners on the same target both
  // run regardless of what either does to the event, and which one runs
  // first depends on registration order, which isn't something to rely on
  // here (the panel's own effect re-attaches on every render, since its
  // onStepUp/onStepDown props are fresh inline closures each time). The
  // actual fix is `onOpenChange` above: the panel checks that flag itself
  // and bails BEFORE calling its own step handler, regardless of which
  // listener happens to run first -- see VolumeDetailPanel.tsx's
  // dropdownOpen.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((i) => Math.min(options.length - 1, i + 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((i) => Math.max(0, i - 1));
          break;
        case "Enter":
          e.preventDefault();
          onSelect(options[highlightedIndex].value);
          close();
          break;
        // Dismisses just this list, leaving whatever it's layered over
        // alone. The containing panel suppresses its OWN Escape handler
        // while a picker is open (see VolumeDetailPanel's dropdownOpen) --
        // both listeners sit on window, so neither can intercept the other
        // by stopping propagation, and which one runs first depends on
        // registration order. Without that pairing, one press closed the
        // picker and the whole panel out from under it at once.
        case "Escape":
          e.preventDefault();
          close();
          break;
      }
    };
    // Clicking anywhere outside closes without selecting -- every other
    // dismissible popup in the app does this (the settings menu via the
    // same pointerdown check, the tag autocomplete via onBlur), and
    // without it this one just hung open until it was toggled or picked
    // from.
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) close();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, options, highlightedIndex, onSelect]);

  return (
    <div className="relative" ref={containerRef}>
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
          {options.map((option, i) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onSelect(option.value);
                close();
              }}
              // Mouse hover moves the keyboard highlight to match wherever
              // the cursor actually is -- without this, hovering option 3
              // then pressing Enter would select whatever Up/Down had left
              // highlighted instead of the one visibly under the cursor.
              onMouseEnter={() => setHighlightedIndex(i)}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-white ${
                i === highlightedIndex ? "bg-neutral-800" : ""
              }`}
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

export const StatusDropdown = forwardRef(StatusDropdownInner) as <T extends string>(
  props: {
    icon: ReactNode;
    label: string;
    options: StatusDropdownOption<T>[];
    onSelect: (value: T) => void;
    onOpenChange?: (open: boolean) => void;
  } & { ref?: Ref<StatusDropdownHandle> }
) => ReturnType<typeof StatusDropdownInner>;
