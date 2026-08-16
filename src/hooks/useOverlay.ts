import { useEffect, useSyncExternalStore } from "react";

/**
 * A count of how many overlays (drawers, detail panels, settings dialogs,
 * the crop modal) are mounted right now.
 *
 * This exists so the app-wide bare-key shortcuts (see useGlobalShortcuts)
 * can stand down while something is layered over the timeline. Without it
 * they fire straight through an open overlay: pressing "n" with the
 * keyboard-shortcuts cheat sheet up opened the Add Line drawer *underneath*
 * it (z-65 vs the modal's z-70), dimmed by the modal's own backdrop and
 * unreachable; pressing "1".."5" with the filter panel open switched
 * collections behind it, resetting the applied filters while the panel kept
 * a draft seeded from the collection the user had actually opened it for.
 *
 * A module-level counter rather than prop-threading or lifted state,
 * because the overlays don't share an owner: App.tsx owns the drawers and
 * the filter panel, but TopNav deliberately keeps its four settings dialogs
 * to itself (see SettingsMenu's docblock), and ImageCropModal is nested
 * inside LineFormDrawer. Registering happens in the two shared pieces every
 * overlay already goes through -- useSlidePanel for the side panels,
 * SettingsModal for the centered dialogs -- so a new overlay built on
 * either one is covered without touching this file.
 */
let openCount = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return openCount;
}

/** Registers the calling component as an open overlay for as long as it's
 * mounted. Panels that animate themselves out (see useSlidePanel's
 * closeThen) stay registered for the duration of that transition, which is
 * what we want -- a panel mid-fade is still covering the timeline. */
export function useOverlay() {
  useEffect(() => {
    openCount += 1;
    emit();
    return () => {
      openCount -= 1;
      emit();
    };
  }, []);
}

/** True while any overlay registered via useOverlay is mounted. */
export function useOverlaysOpen(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot) > 0;
}
