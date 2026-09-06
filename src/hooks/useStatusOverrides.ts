import { useCallback, useState } from "react";
import { safeGetJson, safeSetItem } from "../lib/storage";

type StatusMap<T> = Record<string, T>;

function loadLocalOverrides<T>(key: string): StatusMap<T> {
  return safeGetJson<StatusMap<T>>(key, {});
}

/**
 * Shared volumeId -> status map + localStorage persistence behind
 * useOwnership and useReadingStatus. The two were byte-for-byte the same
 * hook apart from the storage key, the status type, and whether getStatus
 * takes a per-call fallback -- same duplication useOverrideStore already
 * collapsed for the four line/volume stores, just on the simpler
 * no-tombstones shape these two need (a status is always overwritten, never
 * deleted).
 *
 * getStatus takes its fallback per call rather than baking one in, because
 * ownership's default is the volume's own seeded status (different for every
 * volume) while reading status has a single flat default -- see
 * useReadingStatus, which just closes over DEFAULT_READING_STATUS.
 *
 * `T` is unconstrained (not `T extends string`) so useRating can back a
 * numeric rating the same way -- nothing in the body actually depends on
 * string-ness, it's just JSON round-tripping and object spreads. useRating
 * also leans on `setStatus(id, undefined)` to *clear* a value: since a
 * status here is "always overwritten, never deleted," there's no separate
 * delete path, but `{...prev, [id]: undefined}` followed by
 * `JSON.stringify` (which drops `undefined` properties) round-trips
 * exactly like the id was never set -- so passing `undefined` through this
 * same setStatus already behaves as a clear, no extra method needed.
 */
export function useStatusOverrides<T>(key: string) {
  // A lazy initializer, not an empty map filled in by an effect -- the same
  // shape useOverrideStore uses for the other four stores, and for the same
  // reason. An effect runs after the first paint, so the opening frame
  // rendered every volume at its seeded "announced" status with no rating
  // and no reading progress, then repainted with the real values a frame
  // later: a visible flash of the wrong shelf on every load for anyone with
  // data. Reading synchronously here means the first paint is already
  // correct. (`key` is a module constant at every call site, so there is no
  // later key change to reload for.)
  const [overrides, setOverrides] = useState<StatusMap<T>>(() =>
    loadLocalOverrides<T>(key)
  );

  const setStatus = useCallback(
    (volumeId: string, status: T) => {
      setOverrides((prev) => {
        const next = { ...prev, [volumeId]: status };
        safeSetItem(key, JSON.stringify(next));
        return next;
      });
    },
    [key]
  );

  const getStatus = useCallback(
    (volumeId: string, fallback: T): T => overrides[volumeId] ?? fallback,
    [overrides]
  );

  return { getStatus, setStatus };
}
