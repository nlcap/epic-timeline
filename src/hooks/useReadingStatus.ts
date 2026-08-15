import { useCallback, useEffect, useState } from "react";
import type { ReadingStatus } from "../types";
import { DEFAULT_READING_STATUS } from "../lib/readingStatus";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { safeSetItem } from "../lib/storage";

const STORAGE_KEY = "epic-timeline:reading-status-overrides";

type OverrideMap = Record<string, ReadingStatus>;

function loadLocalOverrides(): OverrideMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OverrideMap) : {};
  } catch {
    return {};
  }
}

/**
 * Tracks per-volume reading status. Same override-map-in-localStorage shape
 * as useOwnership, but there's no seeded per-volume value to fall back to --
 * every volume starts at DEFAULT_READING_STATUS until overridden here.
 */
export function useReadingStatus() {
  const [overrides, setOverrides] = useState<OverrideMap>({});

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // TODO: replace with a real fetch from a `volume_reading_status`
      // table once a Supabase project + auth session exist.
      // const { data } = await supabase.from("volume_reading_status").select("*");
      setOverrides(loadLocalOverrides());
    } else {
      setOverrides(loadLocalOverrides());
    }
  }, []);

  const setStatus = useCallback((volumeId: string, status: ReadingStatus) => {
    setOverrides((prev) => {
      const next = { ...prev, [volumeId]: status };
      safeSetItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    if (isSupabaseConfigured && supabase) {
      // TODO: upsert into `volume_reading_status` (volume_id, user_id, status).
    }
  }, []);

  const getStatus = useCallback(
    (volumeId: string): ReadingStatus => overrides[volumeId] ?? DEFAULT_READING_STATUS,
    [overrides]
  );

  return { getStatus, setStatus };
}
