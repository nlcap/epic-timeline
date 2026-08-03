import { useCallback, useEffect, useState } from "react";
import type { TimelineEntry } from "../types";
import { recompressStoredCovers } from "../lib/imageCompression";
import { safeSetItem } from "../lib/storage";

const STORAGE_KEY = "epic-timeline:volume-overrides";
const DELETED = "deleted" as const;

type EntryChange = TimelineEntry | typeof DELETED;
type OverrideMap = Record<string, EntryChange>;

function loadOverrides(): OverrideMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OverrideMap) : {};
  } catch {
    return {};
  }
}

/**
 * Volumes and gaps added or deleted via the "Add Volume" form and the volume
 * detail panel, on top of the seeded entries. Same tombstone-map pattern as
 * useLineOverrides. Persists to localStorage until a backend exists.
 */
export function useVolumeOverrides() {
  const [overrides, setOverrides] = useState<OverrideMap>({});

  useEffect(() => {
    const loaded = loadOverrides();
    setOverrides(loaded);

    // Covers saved before compression existed (or saved from a browser with
    // a looser localStorage quota than Firefox's) can still be oversized --
    // shrink them once so they stop eating into quota headroom on the next
    // save. No-op once every cover is already under the threshold.
    recompressStoredCovers(loaded).then(({ changed, next }) => {
      if (changed) {
        safeSetItem(STORAGE_KEY, JSON.stringify(next));
        setOverrides(next);
      }
    });
  }, []);

  const upsertVolume = useCallback((entry: TimelineEntry) => {
    setOverrides((prev) => {
      const next = { ...prev, [entry.id]: entry };
      safeSetItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteVolume = useCallback((entryId: string) => {
    setOverrides((prev) => {
      const next = { ...prev, [entryId]: DELETED };
      safeSetItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  /** Applies overrides/deletions/additions on top of one collection's seed entries. */
  const resolveEntries = useCallback(
    (seedEntries: TimelineEntry[], lineIds: Set<string>): TimelineEntry[] => {
      const seedIds = new Set(seedEntries.map((e) => e.id));
      const resolved: TimelineEntry[] = [];

      for (const entry of seedEntries) {
        const change = overrides[entry.id];
        if (change === DELETED) continue;
        resolved.push(change ?? entry);
      }
      for (const [id, change] of Object.entries(overrides)) {
        if (change !== DELETED && !seedIds.has(id) && lineIds.has(change.lineId)) {
          resolved.push(change);
        }
      }
      return resolved;
    },
    [overrides]
  );

  return { upsertVolume, deleteVolume, resolveEntries };
}
