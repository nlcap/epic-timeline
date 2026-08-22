import { useCallback, useEffect, useRef, useState } from "react";

/** How long a stepped-to volume keeps showing its preview before it
 * quietly retires itself. Long enough to read the card, short enough that
 * a forgotten one doesn't sit on the timeline indefinitely. */
const AUTO_PREVIEW_MS = 8000;

/**
 * The volume stepper's stand-in for a hover (see VolumeStepper.tsx /
 * LineRow.tsx): clicking a chevron pops the destination volume's preview
 * card as though the cursor were on it, even though it's actually parked
 * on the stepper panel and the tile hasn't finished scrolling into place.
 *
 * Owned app-wide rather than per-LineRow, even though only one row's tile
 * ever uses it, because every rule about it is global: at most one exists
 * across the whole timeline at a time, a step on one line has to retire
 * whatever a previous step left showing on another (each row's own timer
 * used to keep running independently, which is how a Daredevil panel
 * outlived several Black Widow steps), and any genuine hover anywhere
 * retires it too. One piece of state makes all three structural -- setting
 * it replaces the previous one, so there's nothing to coordinate between
 * rows.
 */
export function useStepperAutoPreview() {
  const [volumeId, setVolumeId] = useState<string | null>(null);
  // How far the timeline is about to scroll (target minus current), so the
  // destination tile can derive its FINAL on-screen position from its
  // pre-scroll rect and show the card immediately rather than waiting out
  // the animation. See useTilePreviewPosition.
  const [delta, setDelta] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  const clearPending = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  /** Retires whatever is showing. Shared by every path that ends one -- a
   * new step, a real hover, unmount -- so a pending timer can never
   * outlive the card it was started for and clear a LATER one out from
   * under itself. */
  const clear = useCallback(() => {
    clearPending();
    setVolumeId(null);
  }, [clearPending]);

  /** Called as the chevron's scroll STARTS, not once it settles, so the
   * card appears with no lag behind the click. */
  const begin = useCallback(
    (targetVolumeId: string, scrollDelta: number) => {
      clearPending();
      setVolumeId(targetVolumeId);
      setDelta(scrollDelta);
      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null;
        setVolumeId(null);
      }, AUTO_PREVIEW_MS);
    },
    [clearPending]
  );

  useEffect(() => clearPending, [clearPending]);

  return { volumeId, delta, begin, clear };
}
