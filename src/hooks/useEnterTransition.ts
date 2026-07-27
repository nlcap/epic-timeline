import { useEffect, useState } from "react";

/**
 * False on first render, true one animation frame after mount -- pair with
 * a CSS transition on opacity/transform driven by this flag so a freshly
 * mounted element settles into place instead of popping straight into its
 * final state. Used for LineRow (a newly visible line -- e.g. a speculative
 * one revealed by the Speculation Mode toggle, or any line on a freshly
 * switched collection tab -- fades and rises in rather than appearing
 * instantly); see useSlidePanel for the drawer/panel equivalent that also
 * needs an animated close, which this alone doesn't cover.
 */
export function useEnterTransition(): boolean {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return entered;
}
