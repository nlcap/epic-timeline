import { useCallback } from "react";
import type { Line } from "../types";
import { DELETED, useOverrideStore } from "./useOverrideStore";

const STORAGE_KEY = "epic-timeline:speculative-lines";

/**
 * Lines added via the "Add Speculative Line" flow -- a sandbox layer that's
 * entirely separate from the seeded data and from useLineOverrides (which
 * only ever touches official lines). Every entry here is a pure addition
 * (no seed counterpart to merge against), so unlike useLineOverrides'
 * resolveLines there's no seed-list argument -- just a per-collection
 * filter. See useOverrideStore for the shared load/upsert/delete/persist
 * plumbing this and the other three override stores build on. Persists to
 * localStorage, independent of Speculation Mode's on/off toggle, so hiding
 * speculative content never deletes it.
 */
export function useSpeculativeLines() {
  const { overrides, upsert, remove } = useOverrideStore<Line>(STORAGE_KEY);

  const resolveLines = useCallback(
    (collectionId: string): Line[] => {
      return Object.values(overrides).filter(
        (change): change is Line => change !== DELETED && change.collectionId === collectionId
      );
    },
    [overrides]
  );

  return { upsertLine: upsert, deleteLine: remove, resolveLines };
}
