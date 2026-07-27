import { useCallback, useEffect, useState } from "react";
import type { TimelineEntry } from "../types";

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
    setOverrides(loadOverrides());
  }, []);

  const upsertVolume = useCallback((entry: TimelineEntry) => {
    setOverrides((prev) => {
      const next = { ...prev, [entry.id]: entry };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteVolume = useCallback((entryId: string) => {
    setOverrides((prev) => {
      const next = { ...prev, [entryId]: DELETED };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
