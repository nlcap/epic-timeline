import { useCallback } from "react";
import type { TimelineEntry } from "../types";
import { recompressStoredCovers } from "../lib/imageCompression";
import { DELETED, useOverrideStore } from "./useOverrideStore";

const STORAGE_KEY = "epic-timeline:speculative-volumes";

/**
 * Volumes (and gaps) added under a speculative line via the "New
 * Speculation" flow. Same tombstone-map shape as useVolumeOverrides (see
 * useOverrideStore), including the one-time oversized-cover migration, but
 * entirely separate storage/state -- speculative volumes never mix with
 * official ones, so toggling Speculation Mode off can hide this store's
 * contents without touching the official one at all. Every entry is a pure
 * addition, so resolution is just a per-lineId filter, no seed merge.
 */
export function useSpeculativeVolumes() {
  const { overrides, upsert, remove } = useOverrideStore<TimelineEntry>(
    STORAGE_KEY,
    recompressStoredCovers
  );

  const resolveEntries = useCallback(
    (lineIds: Set<string>): TimelineEntry[] => {
      return Object.values(overrides).filter(
        (change): change is TimelineEntry => change !== DELETED && lineIds.has(change.lineId)
      );
    },
    [overrides]
  );

  return { upsertVolume: upsert, deleteVolume: remove, resolveEntries };
}
