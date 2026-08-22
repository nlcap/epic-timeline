import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A destructive control that arms on first interaction and only acts on
 * the second, backing itself out again if left alone -- the forgiving
 * shape both image-reset overlays use (see IconResetOverlay in
 * LineFormDrawer and ImageResetOverlay in VolumeFormDrawer).
 *
 * Only the timer state machine is shared. The two present it very
 * differently on purpose: the line icon is a 48-64px circle with no room
 * for a text confirmation, so it swaps the scrim red and waits for a
 * second click on the same spot, while the cover image is big enough to
 * hold a real "Remove this cover?" prompt with Cancel/Remove buttons.
 * Those renderings stay in their own components; this just tracks whether
 * the thing is currently armed, and makes sure the pending timer is
 * cleared on unmount rather than firing into a component that's gone.
 */
export function useArmedConfirm(timeoutMs: number) {
  const [confirming, setConfirming] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPending = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  /** Backs out of the armed state, cancelling the auto-disarm. */
  const disarm = useCallback(() => {
    clearPending();
    setConfirming(false);
  }, [clearPending]);

  /** Arms it, and schedules it to quietly disarm itself if nothing
   * follows -- so a half-finished interaction doesn't stay a trap for a
   * later, unrelated click. Re-arming restarts the clock. */
  const arm = useCallback(() => {
    clearPending();
    setConfirming(true);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      setConfirming(false);
    }, timeoutMs);
  }, [clearPending, timeoutMs]);

  useEffect(() => clearPending, [clearPending]);

  return { confirming, arm, disarm };
}
