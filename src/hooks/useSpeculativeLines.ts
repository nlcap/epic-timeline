import { useCallback, useEffect, useState } from "react";
import type { Line } from "../types";
import { safeSetItem } from "../lib/storage";

const STORAGE_KEY = "epic-timeline:speculative-lines";
const DELETED = "deleted" as const;

type LineChange = Line | typeof DELETED;
type OverrideMap = Record<string, LineChange>;

function loadOverrides(): OverrideMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OverrideMap) : {};
  } catch {
    return {};
  }
}

/**
 * Lines added via the "Add Speculative Line" flow -- a sandbox layer that's
 * entirely separate from the seeded data and from useLineOverrides (which
 * only ever touches official lines). Every entry here is a pure addition
 * (no seed counterpart to merge against), so unlike useLineOverrides'
 * resolveLines there's no seed-list argument -- just a per-collection
 * filter. Persists to localStorage, independent of Speculation Mode's
 * on/off toggle, so hiding speculative content never deletes it.
 */
export function useSpeculativeLines() {
  const [overrides, setOverrides] = useState<OverrideMap>({});

  useEffect(() => {
    setOverrides(loadOverrides());
  }, []);

  const upsertLine = useCallback((line: Line) => {
    setOverrides((prev) => {
      const next = { ...prev, [line.id]: line };
      safeSetItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteLine = useCallback((lineId: string) => {
    setOverrides((prev) => {
      const next = { ...prev, [lineId]: DELETED };
      safeSetItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resolveLines = useCallback(
    (collectionId: string): Line[] => {
      return Object.values(overrides).filter(
        (change): change is Line => change !== DELETED && change.collectionId === collectionId
      );
    },
    [overrides]
  );

  return { upsertLine, deleteLine, resolveLines };
}
