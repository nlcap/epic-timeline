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
  // Pending fade-out timers, keyed by the line each one is waiting to drop.
  // Kept (rather than fired and forgotten) so a timer can be cancelled when
  // the thing it was going to do stops making sense -- see both call sites
  // below.
  const exitTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useLayoutEffect(() => {
    const timers = exitTimersRef.current;

    if (resetKey !== prevResetKeyRef.current) {
      prevResetKeyRef.current = resetKey;
      // A collection switch replaces the list outright, so anything still
      // mid-fade belongs to the tab being left. Its timer would fire into
      // the *new* tab's list a few hundred ms later, filtering for an id
      // that isn't there -- which allocates a fresh array regardless, so
      // it re-rendered every row to arrive at exactly the same content.
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
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
      if (entry.exiting || timers.has(entry.line.id)) return;
      const lineId = entry.line.id;
      timers.set(
        lineId,
        setTimeout(() => {
          timers.delete(lineId);
          // Keep prevDisplayRef in lockstep with the state update it's
          // driving -- it's read by the *next* effect run to decide what
          // still needs to fade out. Left stale (state updated, ref not),
          // a later effect run (e.g. toggling Speculation Mode again
          // before this fires, then again after) reads the ref, still
          // finds this already-exiting entry, and splices it back into
          // `next` -- but since it's already `exiting`, the check above
          // never re-arms a timer for it, so it's stuck forever:
          // invisible, but still holding its row's height (the sidebar gap
          // this was fixed for).
          setDisplay((cur) => {
            const trimmed = cur.filter((d) => d.line.id !== lineId);
            // Hand back the same array when there was nothing to drop --
            // filter always allocates, and a new reference on its own is
            // enough to re-render every row for no change at all.
            if (trimmed.length === cur.length) return cur;
            prevDisplayRef.current = trimmed;
            return trimmed;
          });
        }, exitDurationMs)
      );
    });

    prevDisplayRef.current = next;
    setDisplay(next);
  }, [lines, exitDurationMs, resetKey]);

  useEffect(() => {
    if (justReset) setJustReset(false);
  }, [justReset]);

  // Unmount only. A pending timer firing into a torn-down hook is pure
  // waste, and it would still mutate prevDisplayRef on the way past.
  // `timers` is captured at setup rather than read off the ref in the
  // cleanup, since a ref's contents are free to change in between.
  useEffect(() => {
    const timers = exitTimersRef.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    };
  }, []);

  return [display, justReset];
}
