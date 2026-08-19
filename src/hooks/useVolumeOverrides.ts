import { useCallback } from "react";
import type { TimelineEntry } from "../types";
import { recompressStoredCovers } from "../lib/imageCompression";
import { backfillFromSeed } from "../lib/seedBackfill";
import { DELETED, useOverrideStore, type OverrideMap } from "./useOverrideStore";

const STORAGE_KEY = "epic-timeline:volume-overrides";

/**
 * Volumes and gaps added or deleted via the "Add Volume" form and the volume
 * detail panel, on top of the seeded entries. Same tombstone-map pattern as
 * useLineOverrides (see useOverrideStore), plus two one-time migrations.
 * The first recompresses any covers saved before compression existed (or
 * saved from a browser with a looser localStorage quota than Firefox's), a
 * no-op once every cover is under the threshold. The second repairs snapshots
 * taken before a seed change -- see backfillFromSeed for why an absolute
 * override goes stale. Persists to localStorage until a backend exists.
 */
/** Both one-time repairs, run as one pass so a load that needs each of them
 * writes localStorage once rather than twice. `changed` is the union: either
 * migration having touched anything is enough to persist the result. */
async function migrateStoredVolumes(loaded: OverrideMap<TimelineEntry>) {
  const covers = await recompressStoredCovers(loaded);
  const backfilled = await backfillFromSeed(covers.next);
  return { changed: covers.changed || backfilled.changed, next: backfilled.next };
}

export function useVolumeOverrides() {
  const { overrides, upsert, remove } = useOverrideStore<TimelineEntry>(
    STORAGE_KEY,
    migrateStoredVolumes
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
