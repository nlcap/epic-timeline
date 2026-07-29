import { useEffect, useState } from "react";

/**
 * False on first render, true one animation frame after mount -- pair with
 * a CSS transition on opacity/transform driven by this flag so a freshly
 * mounted element settles into place instead of popping straight into its
 * final state. Used for LineRow (a newly visible line -- e.g. a speculative
 * one revealed by the Speculation Mode toggle -- fades and rises in rather
 * than appearing instantly); see useSlidePanel for the drawer/panel
 * equivalent that also needs an animated close, which this alone doesn't
 * cover.
 *
 * `skipAnimation` (App.tsx passes true only on the exact render a
 * collection tab switch mounts a fresh batch of rows) starts `entered`
 * already true instead of animating up to it -- switching tabs replaces
 * the entire line list with an unrelated collection's, so every row on the
 * new tab would otherwise fade/rise in at once, reading as a stall rather
 * than a transition. Since useState's initializer only runs once at mount,
 * this only matters at the moment a row is first created -- a row that's
 * already mounted and animating in when `skipAnimation` flips doesn't jump.
 */
export function useEnterTransition(skipAnimation = false): boolean {
  const [entered, setEntered] = useState(skipAnimation);

  useEffect(() => {
    if (skipAnimation) return;
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
    // Only the mount-time value matters (see the initializer above), so
    // this deliberately doesn't re-run if skipAnimation changes later.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return entered;
}
