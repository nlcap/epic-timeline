import { useCallback, useEffect, useState } from "react";
import type { OwnershipStatus } from "../types";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const STORAGE_KEY = "epic-timeline:ownership-overrides";

type OverrideMap = Record<string, OwnershipStatus>;

function loadLocalOverrides(): OverrideMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OverrideMap) : {};
  } catch {
    return {};
  }
}

/**
 * Tracks per-volume ownership status overrides on top of each volume's
 * default (seeded) status. Persists to localStorage today; once a Supabase
 * project is wired up (see .env.example), this is where reads/writes swap
 * over to a `volume_ownership` table keyed by (user_id, volume_id).
 */
export function useOwnership() {
  const [overrides, setOverrides] = useState<OverrideMap>({});

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // TODO: replace with a real fetch from `volume_ownership` once a
      // Supabase project + auth session exist.
      // const { data } = await supabase.from("volume_ownership").select("*");
      setOverrides(loadLocalOverrides());
    } else {
      setOverrides(loadLocalOverrides());
    }
  }, []);

  const setStatus = useCallback((volumeId: string, status: OwnershipStatus) => {
    setOverrides((prev) => {
      const next = { ...prev, [volumeId]: status };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    if (isSupabaseConfigured && supabase) {
      // TODO: upsert into `volume_ownership` (volume_id, user_id, status).
    }
  }, []);

  const getStatus = useCallback(
    (volumeId: string, fallback: OwnershipStatus): OwnershipStatus =>
      overrides[volumeId] ?? fallback,
    [overrides]
  );

  return { getStatus, setStatus };
}
