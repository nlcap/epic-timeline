import type { OwnershipStatus } from "../types";
import { useStatusOverrides } from "./useStatusOverrides";

const STORAGE_KEY = "epic-timeline:ownership-overrides";

/**
 * Tracks per-volume ownership status overrides on top of each volume's
 * default (seeded) status -- hence the per-call fallback on getStatus, which
 * callers pass the volume's own seeded ownershipStatus.
 */
export function useOwnership() {
  return useStatusOverrides<OwnershipStatus>(STORAGE_KEY);
}
