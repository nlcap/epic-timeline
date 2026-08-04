import { useCallback, useEffect, useState } from "react";
import { safeSetItem } from "../lib/storage";

export const DELETED = "deleted" as const;
export type Change<T> = T | typeof DELETED;
export type OverrideMap<T> = Record<string, Change<T>>;

function loadOverrides<T>(key: string): OverrideMap<T> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as OverrideMap<T>) : {};
  } catch {
    return {};
  }
}

/**
 * Shared id-keyed tombstone-map CRUD + localStorage persistence behind
 * useLineOverrides/useVolumeOverrides/useSpeculativeLines/
 * useSpeculativeVolumes -- all four used to reimplement this same
 * load/upsert/delete/persist plumbing individually, differing only in
 * storage key, item type, and (for the two volume stores) a one-time cover
 * migration. Each of those hooks now just layers its own `resolve` merge
 * logic (seed-merge for the two override stores, plain filter for the two
 * speculative ones) on top of what this returns.
 *
 * `migrate`, when passed, runs once against the mount-time snapshot (used
 * by the volume stores to recompress oversized covers saved before
 * compression existed) -- omit it for the two line stores, which have
 * nothing to migrate.
 */
export function useOverrideStore<T extends { id: string }>(
  key: string,
  migrate?: (loaded: OverrideMap<T>) => Promise<{ changed: boolean; next: OverrideMap<T> } | null>
) {
  const [overrides, setOverrides] = useState<OverrideMap<T>>(() => loadOverrides<T>(key));

  useEffect(() => {
    if (!migrate) return;
    // `overrides` here is still the lazy-initializer's mount-time value --
    // reusing it (rather than reading localStorage a second time) keeps
    // this in lockstep with that initial load, same as the pre-refactor
    // hooks feeding the same `loaded` value to both setOverrides and the
    // migration call.
    migrate(overrides).then((result) => {
      if (result?.changed) {
        safeSetItem(key, JSON.stringify(result.next));
        setOverrides(result.next);
      }
    });
    // Deliberately mount-only -- see the comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upsert = useCallback(
    (item: T) => {
      setOverrides((prev) => {
        const next = { ...prev, [item.id]: item };
        safeSetItem(key, JSON.stringify(next));
        return next;
      });
    },
    [key]
  );

  const remove = useCallback(
    (id: string) => {
      setOverrides((prev) => {
        const next = { ...prev, [id]: DELETED };
        safeSetItem(key, JSON.stringify(next));
        return next;
      });
    },
    [key]
  );

  return { overrides, upsert, remove };
}
