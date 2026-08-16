import { useEffect, useRef } from "react";
import { isTypingTarget } from "../lib/keyboard";

/**
 * The cheat sheet's "Anywhere" rows (see KeyboardShortcutsModal), built from
 * the same collection count the "1".."N" handler below uses.
 *
 * Lives here, next to the switch it documents, because it's a hand-written
 * mirror of it: as two separate lists they could drift silently, and did --
 * "=" as an alias for zoom-in was never listed, and the range was hardcoded
 * to "1 - 5" so a sixth collection would have shipped an undocumented
 * (and, before this, entirely dead) key.
 */
export function globalShortcutHelp(collectionCount: number): { keys: string; label: string }[] {
  return [
    { keys: "/", label: "Focus the search box" },
    { keys: "F", label: "Open filters" },
    { keys: "N", label: "Add a line" },
    { keys: `1 – ${collectionCount}`, label: "Jump to a collection tab" },
    { keys: "+ / =", label: "Zoom in" },
    { keys: "-", label: "Zoom out" },
    { keys: "S", label: "Toggle Speculation Mode" },
    { keys: "?", label: "Show this cheat sheet" },
  ];
}

interface GlobalShortcutHandlers {
  onFocusSearch: () => void;
  onOpenFilters: () => void;
  onAddLine: () => void;
  /** 1-indexed, matching the number keys to the nav's collection order left
   * to right -- App.tsx maps this to COLLECTIONS[index - 1]. */
  onSelectCollection: (oneBasedIndex: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleSpeculationMode: () => void;
  onShowShortcuts: () => void;
}

/**
 * App-wide bare-key shortcuts -- no Cmd/Ctrl/Alt, Gmail/GitHub/Linear-style,
 * chosen specifically so none of them can collide with an OS or browser
 * shortcut. Three things enforce that:
 *   - Bails immediately if any modifier is held, so e.g. the browser's own
 *     Cmd+F (find in page) or Cmd+1..8 (tab switching) are never shadowed
 *     by this app's own "f" or "1".."5".
 *   - Bails if focus is inside a text input/textarea/select/contenteditable,
 *     so typing "s" into the Line title field never toggles Speculation
 *     Mode out from under you.
 *   - Bails while `enabled` is false -- App.tsx passes "no overlay is open"
 *     (see useOverlay). These are *timeline* shortcuts; with a drawer or
 *     dialog layered over it they were still firing underneath, so "n" with
 *     the cheat sheet up opened the Add Line drawer behind the modal's own
 *     backdrop, and "1".."5" with the filter panel up switched collections
 *     under it.
 *
 * Escape and Cmd/Ctrl+Enter are deliberately NOT handled here -- which
 * panel closes, or which form submits, depends on which panel is actually
 * open, so those live locally in that panel instead (see useEscapeToClose
 * and each form drawer/FilterPanel's own submit-on-Cmd+Enter listener).
 */
export function useGlobalShortcuts(
  handlers: GlobalShortcutHandlers,
  /** How many number keys map to collection tabs -- App passes
   * COLLECTIONS.length so adding a sixth collection wires up "6" and
   * relabels the cheat sheet without touching this file. */
  collectionCount: number,
  enabled = true
) {
  // Every handler App.tsx passes is an inline arrow, so the old
  // eight-entry dependency array changed identity on literally every
  // render -- tearing down and re-adding the window listener each time,
  // which is exactly what listing them was supposed to avoid. Reading them
  // through a ref that's kept current instead means the listener is
  // attached once and only re-attached when `enabled` actually flips.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      const h = handlersRef.current;

      // Number.isInteger rather than a "1" <= key <= "9" string comparison,
      // so this can't be fooled by a multi-character key name that happens
      // to sort into the range.
      const digit = Number(e.key);
      if (Number.isInteger(digit) && digit >= 1 && digit <= collectionCount) {
        e.preventDefault();
        h.onSelectCollection(digit);
        return;
      }

      switch (e.key) {
        case "/":
          e.preventDefault();
          h.onFocusSearch();
          break;
        case "f":
          e.preventDefault();
          h.onOpenFilters();
          break;
        case "n":
          e.preventDefault();
          h.onAddLine();
          break;
        case "+":
        case "=":
          e.preventDefault();
          h.onZoomIn();
          break;
        case "-":
          e.preventDefault();
          h.onZoomOut();
          break;
        case "s":
          e.preventDefault();
          h.onToggleSpeculationMode();
          break;
        case "?":
          e.preventDefault();
          h.onShowShortcuts();
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, collectionCount]);
}
