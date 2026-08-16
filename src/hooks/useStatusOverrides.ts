import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { safeSetItem } from "../lib/storage";

type StatusMap<T extends string> = Record<string, T>;

function loadLocalOverrides<T extends string>(key: string): StatusMap<T> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as StatusMap<T>) : {};
  } catch {
    return {};
  }
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
 */
export function useStatusOverrides<T extends string>(key: string) {
  const [overrides, setOverrides] = useState<StatusMap<T>>({});

  useEffect(() => {
    // Loaded from localStorage today. Once a Supabase project + auth
    // session exist this becomes a real fetch (`volume_ownership` /
    // `volume_reading_status`, keyed by user_id + volume_id) with the local
    // read as the offline fallback.
    setOverrides(loadLocalOverrides<T>(key));
  }, [key]);

  const setStatus = useCallback(
    (volumeId: string, status: T) => {
      setOverrides((prev) => {
        const next = { ...prev, [volumeId]: status };
        safeSetItem(key, JSON.stringify(next));
        return next;
      });
      if (isSupabaseConfigured && supabase) {
        // TODO: upsert the matching row (volume_id, user_id, status).
      }
    },
    [key]
  );

  const getStatus = useCallback(
    (volumeId: string, fallback: T): T => overrides[volumeId] ?? fallback,
    [overrides]
  );

  return { getStatus, setStatus };
}
