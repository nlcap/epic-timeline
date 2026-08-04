import { useCallback } from "react";
import type { TimelineEntry } from "../types";
import { recompressStoredCovers } from "../lib/imageCompression";
import { DELETED, useOverrideStore } from "./useOverrideStore";

const STORAGE_KEY = "epic-timeline:volume-overrides";

/**
 * Volumes and gaps added or deleted via the "Add Volume" form and the volume
 * detail panel, on top of the seeded entries. Same tombstone-map pattern as
 * useLineOverrides (see useOverrideStore), plus a one-time migration that
 * recompresses any covers saved before compression existed (or saved from a
 * browser with a looser localStorage quota than Firefox's) -- shrinks them
 * once so they stop eating into quota headroom on the next save, a no-op
 * once every cover is already under the threshold. Persists to localStorage
 * until a backend exists.
 */
export function useVolumeOverrides() {
  const { overrides, upsert, remove } = useOverrideStore<TimelineEntry>(
    STORAGE_KEY,
    recompressStoredCovers
  );

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

  return { upsertVolume: upsert, deleteVolume: remove, resolveEntries };
}
