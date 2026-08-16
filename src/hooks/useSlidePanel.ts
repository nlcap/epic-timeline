import { useCallback, useEffect, useState } from "react";
import { useOverlay } from "./useOverlay";

/**
 * Drives the open/close transition for a side-drawer / detail-panel overlay
 * (LineFormDrawer, VolumeFormDrawer, VolumeDetailPanel). These mount and
 * unmount via plain conditional rendering in App.tsx -- fine for popping in
 * instantly, but an unmount can't animate on its own since the element is
 * just gone the next render. So instead:
 *   - `visible` starts false and flips true one animation frame after
 *     mount, giving a CSS transition an actual "from" state to animate out
 *     of instead of snapping straight to its resting state.
 *   - `closeThen(action)` flips `visible` back to false (so the panel can
 *     transition back to its hidden state) and only calls `action` --
 *     the real onClose/onSave/onDelete/onAddVolume -- once that transition
 *     has had time to finish, so the panel is actually gone from the DOM
 *     only after it's visibly slid/faded away.
 */
export function useSlidePanel(durationMs = 200) {
  const [visible, setVisible] = useState(false);

  // Every side panel goes through this hook, so this is the one place that
  // needs to tell useGlobalShortcuts to stand down while one is up.
  useOverlay();

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const closeThen = useCallback(
    (action: () => void) => {
      setVisible(false);
      setTimeout(action, durationMs);
    },
    [durationMs]
  );

  return { visible, closeThen };
}
