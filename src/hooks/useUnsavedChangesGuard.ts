import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The "are you sure you want to lose that?" routing shared by every form
 * that can be dismissed with edits still in it -- LineFormDrawer,
 * VolumeFormDrawer and CustomCollectionConfigModal, which each carried
 * their own near-identical copy of it (the two drawers differed only in
 * that one of them also had to stand down for the crop modal).
 *
 * Two dismiss paths converge here. A backdrop click or Close ✕ calls
 * `requestClose`; Escape is picked up by this hook's own listener. Both ask
 * the same question -- is there anything to lose? -- and either open the
 * prompt or close outright.
 *
 * Escape can't just go through `useEscapeToClose` the way an ordinary panel
 * does, which is why that hook isn't used here: it takes closing as a given
 * and only lets a caller suppress it wholesale, while `closeThen` commits
 * to the exit animation the instant it's called, with no way to redirect
 * that into "open a modal and leave the form alone" after the fact. The
 * drawers used to express this as *both* -- useEscapeToClose gated to the
 * clean case, plus a hand-rolled keydown listener for the dirty one, each
 * carrying half the condition. One listener that branches is the same
 * behaviour with one place to read it.
 *
 * The explicit Cancel button deliberately does NOT come through here: a
 * button labelled "Cancel" is already a considered "throw this away" (see
 * UnsavedChangesModal's own docblock).
 */
export function useUnsavedChangesGuard({
  active,
  close,
  suppressed = false,
  ownsEscape = true,
}: {
  /** Whether there is anything worth protecting right now. The drawers pass
   * `isEditing && isDirty` -- a half-filled *new* entry has nothing to
   * restore to, so it closes without ceremony -- while the Sandbox config
   * modal, which only ever edits, passes `isDirty` alone. */
  active: boolean;
  /** What closing actually means. The drawers pass a closure over
   * `closeThen(onClose)` so the panel plays its exit animation; the config
   * modal passes `onClose` directly. Read through a ref, so passing an
   * inline arrow doesn't re-register the Escape listener every render. */
  close: () => void;
  /** Something layered on top owns Escape for now -- LineFormDrawer passes
   * `!!pendingCrop` so Escape cancels the crop modal rather than skipping
   * past it to close the whole drawer. */
  suppressed?: boolean;
  /** False when a parent already routes Escape into `requestClose` for us.
   * SettingsModal funnels backdrop, Close ✕ and Escape through one
   * `onClose`, so the config modal covers all three by intercepting there
   * and would otherwise race its own prompt (itself a SettingsModal, with
   * its own window-level Escape handler) for the same keypress. */
  ownsEscape?: boolean;
}) {
  const [prompting, setPrompting] = useState(false);
  const closeRef = useRef(close);
  closeRef.current = close;

  /** Backdrop click and Close ✕. Ignored while the prompt is already up, so
   * the form underneath can't reopen it out from under itself. */
  const requestClose = useCallback(() => {
    if (prompting) return;
    if (active) setPrompting(true);
    else closeRef.current();
  }, [active, prompting]);

  /** Leaves the form exactly as it was -- "Keep editing", and the first
   * half of "Save" (which then submits). */
  const dismissPrompt = useCallback(() => setPrompting(false), []);

  /** "Discard" -- close for real, edits and all. */
  const discardAndClose = useCallback(() => {
    setPrompting(false);
    closeRef.current();
  }, []);

  useEffect(() => {
    if (!ownsEscape || suppressed || prompting) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // No typing-target guard, same as useEscapeToClose: Escape-to-cancel
      // is expected to work with a field inside the form focused, and it
      // never inserts a character for it to interfere with.
      if (active) setPrompting(true);
      else closeRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [ownsEscape, suppressed, prompting, active]);

  return { prompting, requestClose, dismissPrompt, discardAndClose };
}
