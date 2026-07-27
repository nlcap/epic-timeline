import { useEffect, useRef, useState } from "react";
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
 */
export function useExitingLines(lines: Line[], exitDurationMs = 500): ExitableLine[] {
  const [display, setDisplay] = useState<ExitableLine[]>(() =>
    lines.map((line) => ({ line, exiting: false }))
  );
  const prevDisplayRef = useRef(display);

  useEffect(() => {
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
  }, [lines, exitDurationMs]);

  return display;
}
