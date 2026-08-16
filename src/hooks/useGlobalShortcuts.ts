import { useEffect, useRef } from "react";
import { isTypingTarget } from "../lib/keyboard";

interface GlobalShortcutHandlers {
  onFocusSearch: () => void;
  onOpenFilters: () => void;
  onAddLine: () => void;
  /** 1-indexed, matching the "1".."5" keys to the nav's collection order
   * left to right -- App.tsx maps this to COLLECTIONS[index - 1]. */
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
export function useGlobalShortcuts(handlers: GlobalShortcutHandlers, enabled = true) {
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

      if (e.key >= "1" && e.key <= "5") {
        e.preventDefault();
        h.onSelectCollection(Number(e.key));
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
  }, [enabled]);
}
