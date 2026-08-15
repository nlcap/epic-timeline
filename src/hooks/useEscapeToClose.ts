import { useEffect } from "react";

/**
 * Closes a slide-out panel/drawer on Escape, routed through the same
 * closeThen (see useSlidePanel) its own Close/Cancel button already calls --
 * so Escape plays the identical slide-out animation instead of yanking the
 * panel out of the DOM instantly. No typing-target guard: Escape-to-cancel
 * is expected to work even while a field inside the panel is focused (it
 * never inserts a character, so there's nothing for it to interfere with).
 *
 * `enabled` (default true) lets a caller suppress this while something else
 * layered on top should get the Escape press instead -- e.g.
 * VolumeFormDrawer/LineFormDrawer pass `!pendingCrop` so Escape closes
 * ImageCropModal first instead of skipping past it to the whole drawer.
 */
export function useEscapeToClose(
  closeThen: (action: () => void) => void,
  onClose: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeThen(onClose);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeThen, onClose, enabled]);
}
