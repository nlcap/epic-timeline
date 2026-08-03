import { useCallback, useEffect, useState } from "react";
import type { TimelineEntry } from "../types";
import { recompressStoredCovers } from "../lib/imageCompression";
import { safeSetItem } from "../lib/storage";

const STORAGE_KEY = "epic-timeline:speculative-volumes";
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
 * Volumes (and gaps) added under a speculative line via the "New
 * Speculation" flow. Same tombstone-map shape as useVolumeOverrides, but
 * entirely separate storage/state -- speculative volumes never mix with
 * official ones, so toggling Speculation Mode off can hide this store's
 * contents without touching the official one at all. Every entry is a pure
 * addition, so resolution is just a per-lineId filter, no seed merge.
 */
export function useSpeculativeVolumes() {
  const [overrides, setOverrides] = useState<OverrideMap>({});

  useEffect(() => {
    const loaded = loadOverrides();
    setOverrides(loaded);

    // See useVolumeOverrides -- shrinks any covers saved before compression
    // existed so they stop eating into quota headroom on the next save.
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

  const resolveEntries = useCallback(
    (lineIds: Set<string>): TimelineEntry[] => {
      return Object.values(overrides).filter(
        (change): change is TimelineEntry => change !== DELETED && lineIds.has(change.lineId)
      );
    },
    [overrides]
  );

  return { upsertVolume, deleteVolume, resolveEntries };
}
