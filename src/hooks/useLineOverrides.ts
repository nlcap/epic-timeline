import { useCallback, useEffect, useState } from "react";
import type { Line } from "../types";
import { safeSetItem } from "../lib/storage";

const STORAGE_KEY = "epic-timeline:line-overrides";
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
 * Lines added or edited via the sidebar's Add/Edit Line form, on top of the
 * seeded data files. A single map keyed by line id: a `Line` value adds a new
 * line or overrides a seeded one's fields; `"deleted"` hides a seeded line
 * (it can't be removed from the source file at runtime, so this is a
 * tombstone) or drops a previously-added custom line entirely. Persists to
 * localStorage today, same as ownership overrides -- swaps over to a real
 * table once a backend is wired up.
 */
export function useLineOverrides() {
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

  /** Applies overrides/deletions/additions for one collection's seed lines. */
  const resolveLines = useCallback(
    (collectionId: string, seedLines: Line[]): Line[] => {
      const seedIds = new Set(seedLines.map((l) => l.id));
      const resolved: Line[] = [];

      for (const line of seedLines) {
        const change = overrides[line.id];
        if (change === DELETED) continue;
        resolved.push(change ?? line);
      }
      for (const [id, change] of Object.entries(overrides)) {
        if (change !== DELETED && !seedIds.has(id) && change.collectionId === collectionId) {
          resolved.push(change);
        }
      }
      return resolved;
    },
    [overrides]
  );

  return { upsertLine, deleteLine, resolveLines };
}
