import { useCallback } from "react";
import type { Line } from "../types";
import { DELETED, useOverrideStore } from "./useOverrideStore";
import { STORAGE_KEYS } from "../lib/overrideKeys";

const STORAGE_KEY = STORAGE_KEYS.lineOverrides;

/**
 * Lines added or edited via the sidebar's Add/Edit Line form, on top of the
 * seeded data files. A single map keyed by line id: a `Line` value adds a new
 * line or overrides a seeded one's fields; `"deleted"` hides a seeded line
 * (it can't be removed from the source file at runtime, so this is a
 * tombstone) or drops a previously-added custom line entirely. See
 * useOverrideStore for the shared load/upsert/delete/persist plumbing this
 * and the other three override stores build on. Persists to localStorage
 * today, same as ownership overrides -- swaps over to a real table once a
 * backend is wired up.
 */
export function useLineOverrides() {
  const { overrides, upsert, remove } = useOverrideStore<Line>(STORAGE_KEY);

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

  return { upsertLine: upsert, deleteLine: remove, resolveLines };
}
