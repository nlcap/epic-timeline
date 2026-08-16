import { useCallback } from "react";
import type { ReadingStatus } from "../types";
import { DEFAULT_READING_STATUS } from "../lib/readingStatus";
import { useStatusOverrides } from "./useStatusOverrides";

const STORAGE_KEY = "epic-timeline:reading-status-overrides";

/**
 * Tracks per-volume reading status. Same override map as useOwnership, but
 * there's no seeded per-volume value to fall back to -- every volume starts
 * at DEFAULT_READING_STATUS until overridden here, so the shared hook's
 * per-call fallback is closed over rather than exposed to callers.
 */
export function useReadingStatus() {
  const { getStatus, setStatus } = useStatusOverrides<ReadingStatus>(STORAGE_KEY);
  return {
    getStatus: useCallback(
      (volumeId: string) => getStatus(volumeId, DEFAULT_READING_STATUS),
      [getStatus]
    ),
    setStatus,
  };
}
