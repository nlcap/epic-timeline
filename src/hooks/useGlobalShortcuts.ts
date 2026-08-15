import { useEffect } from "react";
import { isTypingTarget } from "../lib/keyboard";

/**
 * App-wide bare-key shortcuts -- no Cmd/Ctrl/Alt, Gmail/GitHub/Linear-style,
 * chosen specifically so none of them can collide with an OS or browser
 * shortcut. Two things enforce that:
 *   - Bails immediately if any modifier is held, so e.g. the browser's own
 *     Cmd+F (find in page) or Cmd+1..8 (tab switching) are never shadowed
 *     by this app's own "f" or "1".."5".
 *   - Bails if focus is inside a text input/textarea/select/contenteditable,
 *     so typing "s" into the Line title field never toggles Speculation
 *     Mode out from under you.
 *
 * Escape and Cmd/Ctrl+Enter are deliberately NOT handled here -- which
 * panel closes, or which form submits, depends on which panel is actually
 * open, so those live locally in that panel instead (see useEscapeToClose
 * and each form drawer/FilterPanel's own submit-on-Cmd+Enter listener).
 */
export function useGlobalShortcuts({
  onFocusSearch,
  onOpenFilters,
  onAddLine,
  onSelectCollection,
  onZoomIn,
  onZoomOut,
  onToggleSpeculationMode,
  onShowShortcuts,
}: {
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
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      if (e.key >= "1" && e.key <= "5") {
        e.preventDefault();
        onSelectCollection(Number(e.key));
        return;
      }

      switch (e.key) {
        case "/":
          e.preventDefault();
          onFocusSearch();
          break;
        case "f":
          e.preventDefault();
          onOpenFilters();
          break;
        case "n":
          e.preventDefault();
          onAddLine();
          break;
        case "+":
        case "=":
          e.preventDefault();
          onZoomIn();
          break;
        case "-":
          e.preventDefault();
          onZoomOut();
          break;
        case "s":
          e.preventDefault();
          onToggleSpeculationMode();
          break;
        case "?":
          e.preventDefault();
          onShowShortcuts();
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    onFocusSearch,
    onOpenFilters,
    onAddLine,
    onSelectCollection,
    onZoomIn,
    onZoomOut,
    onToggleSpeculationMode,
    onShowShortcuts,
  ]);
}
