import { useCallback } from "react";
import { useStatusOverrides } from "./useStatusOverrides";
import { STORAGE_KEYS } from "../lib/overrideKeys";

const STORAGE_KEY = STORAGE_KEYS.ratingOverrides;

/**
 * Tracks per-volume personal star rating -- 0.5-5 in half-star steps, or
 * undefined for unrated. No seeded value the way ownership has one, same
 * spirit as reading status (see useReadingStatus). See StarRating.tsx for
 * the sweep-to-preview/click-to-commit interaction that sets it, including
 * clicking the current value again to clear it back to undefined --
 * setRating(id, undefined) already does exactly that (see
 * useStatusOverrides' own doc comment for why no separate clear method is
 * needed).
 */
export function useRating() {
  const { getStatus, setStatus } = useStatusOverrides<number | undefined>(STORAGE_KEY);
  return {
    getRating: useCallback((volumeId: string) => getStatus(volumeId, undefined), [getStatus]),
    setRating: setStatus,
  };
}
