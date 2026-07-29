import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Line } from "../types";

export interface ExitableLine {
  line: Line;
  exiting: boolean;
}

/**
 * Mirrors `lines` but keeps a just-removed line around for `exitDurationMs`
 * (marked `exiting: true`) instead of dropping it instantly, so LineRow can
 * play its fade-out transition before actually disappearing -- e.g. a
 * speculative line when Speculation Mode toggles off. `exitDurationMs`
 * should match the duration LineRow's own transition uses, or the row will
 * either get yanked away mid-fade or linger invisible after it's done.
 *
 * Present/new lines pass straight through in the current (correctly
 * sorted) order; a just-removed line is spliced back in at roughly its old
 * position for the duration of its exit animation, then dropped for real.
 *
 * `resetKey` opts out of all of that for a specific kind of change: when it
 * changes (App.tsx passes `activeCollectionId`), every previously-displayed
 * line is dropped and replaced with `lines` immediately, no fade-out
 * retention and no interleaving. A collection switch isn't "these lines got
 * removed" the way toggling Speculation Mode off is -- the whole line list
 * is being replaced with an unrelated collection's, so animating the old
 * ones out while splicing them in among the new collection's differently-
 * ordered, differently-id-spaced lines produced exactly the "lines end up
 * in the wrong place" symptom this exists to avoid.
 *
 * The reset runs in a `useLayoutEffect`, not synchronously during render.
 * An earlier version adjusted state directly in the render body (a
 * generally-sanctioned React pattern) to land the swap in the exact same
 * render as the rest of App's collection-scoped data -- but that update
 * belongs to *App*, and this hook is called from App's own render, so nothing
 * about calling setState there should reach into any other component. In
 * practice it still tripped React's "Cannot update a component while
 * rendering a different component" warning around LineTimelineLane, and
 * measurably wrecked drag-to-resize performance app-wide (a single resize
 * commit went from single-digit milliseconds to several *seconds*) --
 * something about that render-phase update was interacting badly with
 * LineTimelineLane's own render deeper in the tree, not worth chasing
 * further given useLayoutEffect gives the same practical guarantee more
 * simply: it still runs (and can update state, forcing a second render)
 * *before* the browser paints, so there's still no visible flash of the old
 * line list against the new collection's data -- just without the
 * cross-component risk.
 *
 * Returns `[lines, justReset]` -- `justReset` is true for the one render
 * right after a `resetKey` change lands, so App.tsx can tell that render's
 * fresh batch of LineRows to skip their own mount-in animation (see
 * skipEnterTransition). It's cleared on a trailing plain `useEffect` (timing
 * doesn't matter there -- it only needs to still read true by the time a
 * freshly-mounted row's own useState initializer runs, which already
 * happened by the time this hook's effects fire).
 */
export function useExitingLines(
  lines: Line[],
  exitDurationMs = 500,
  resetKey?: unknown
): [ExitableLine[], boolean] {
  const [display, setDisplay] = useState<ExitableLine[]>(() =>
    lines.map((line) => ({ line, exiting: false }))
  );
  const [justReset, setJustReset] = useState(false);
  const prevDisplayRef = useRef(display);
  const prevResetKeyRef = useRef(resetKey);

  useLayoutEffect(() => {
    if (resetKey !== prevResetKeyRef.current) {
      prevResetKeyRef.current = resetKey;
      const next = lines.map((line) => ({ line, exiting: false }));
      prevDisplayRef.current = next;
      setDisplay(next);
      setJustReset(true);
      return;
    }

    const currentIds = new Set(lines.map((l) => l.id));
    const prevDisplay = prevDisplayRef.current;
    const next: ExitableLine[] = lines.map((line) => ({ line, exiting: false }));

    prevDisplay.forEach((entry, idx) => {
      if (currentIds.has(entry.line.id)) return;
      next.splice(Math.min(idx, next.length), 0, { line: entry.line, exiting: true });
      if (!entry.exiting) {
        const lineId = entry.line.id;
        setTimeout(() => {
          setDisplay((cur) => cur.filter((d) => d.line.id !== lineId));
        }, exitDurationMs);
      }
    });

    prevDisplayRef.current = next;
    setDisplay(next);
  }, [lines, exitDurationMs, resetKey]);

  useEffect(() => {
    if (justReset) setJustReset(false);
  }, [justReset]);

  return [display, justReset];
}
