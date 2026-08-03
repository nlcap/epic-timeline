import { COLLECTION_DATA } from "../data/collectionData";
import type { Line, TimelineEntry } from "../types";
import { safeSetItem } from "./storage";

const LINE_OVERRIDES_KEY = "epic-timeline:line-overrides";
const VOLUME_OVERRIDES_KEY = "epic-timeline:volume-overrides";
const OWNERSHIP_OVERRIDES_KEY = "epic-timeline:ownership-overrides";
const SPECULATIVE_LINES_KEY = "epic-timeline:speculative-lines";
const SPECULATIVE_VOLUMES_KEY = "epic-timeline:speculative-volumes";

export type TimelineScope = "main" | "speculative";

const DELETED = "deleted" as const;
type LineChange = Line | typeof DELETED;
type EntryChange = TimelineEntry | typeof DELETED;

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

// Seed lineId -> collectionId and seed entryId -> lineId, across every
// seeded collection. A tombstone ("deleted") in an override store carries
// no collectionId/lineId of its own, so this is how a deleted seed line or
// volume still gets scoped to the right collection during a reset. A
// tombstone for a custom line/volume that was added and then deleted has no
// seed counterpart to look up -- those are left alone (unresolvable, and
// harmless either way since nothing renders them).
const SEED_LINE_COLLECTION: Record<string, string> = {};
const SEED_ENTRY_LINE: Record<string, string> = {};
for (const [collectionId, { lines, entries }] of Object.entries(COLLECTION_DATA)) {
  for (const line of lines) SEED_LINE_COLLECTION[line.id] = collectionId;
  for (const entry of entries) SEED_ENTRY_LINE[entry.id] = entry.lineId;
}

/** Removes every entry belonging to one of `collectionIds` from a
 * lineId-keyed override store (line-overrides or speculative-lines). */
function filterLineStore(
  store: Record<string, LineChange>,
  collectionIds: Set<string>
): Record<string, LineChange> {
  const kept: Record<string, LineChange> = {};
  for (const [id, change] of Object.entries(store)) {
    const collectionId = change === DELETED ? SEED_LINE_COLLECTION[id] : change.collectionId;
    if (collectionId !== undefined && collectionIds.has(collectionId)) continue;
    kept[id] = change;
  }
  return kept;
}

/**
 * Wipes local overrides/additions back to the shipped seed data, scoped to
 * whichever collections and timeline layers the caller asks for. E.g.
 * `{ collectionIds: ["ultimate", "marvel-licensed-epic"], scopes: ["main"] }`
 * clears line/volume/ownership overrides for just those two collections,
 * leaving every other collection and any speculative data untouched.
 *
 * Ownership overrides are only ever scoped by "main" -- speculative
 * volumes never carry an ownership status (see useOwnership/App.tsx).
 *
 * Reads and writes localStorage directly rather than going through the
 * override hooks (useLineOverrides etc.), since those only load their
 * state once on mount -- callers should reload the page afterward to get
 * every hook to re-read the now-reset stores, same as ImportDataButton.
 */
export function resetLineData({
  collectionIds,
  scopes,
}: {
  collectionIds: string[];
  scopes: TimelineScope[];
}): void {
  const targets = new Set(collectionIds);
  const scopeSet = new Set(scopes);

  if (scopeSet.has("main")) {
    const lineOverrides = readJson<Record<string, LineChange>>(LINE_OVERRIDES_KEY) ?? {};

    // Every current lineId that belongs to a target collection, resolved
    // up front (before line-overrides is filtered) so volume/ownership
    // scoping below stays correct regardless of order.
    const lineIds = new Set<string>();
    for (const [collectionId, { lines }] of Object.entries(COLLECTION_DATA)) {
      if (!targets.has(collectionId)) continue;
      for (const line of lines) lineIds.add(line.id);
    }
    for (const [id, change] of Object.entries(lineOverrides)) {
      if (change !== DELETED && targets.has(change.collectionId)) lineIds.add(id);
    }

    safeSetItem(
      LINE_OVERRIDES_KEY,
      JSON.stringify(filterLineStore(lineOverrides, targets))
    );

    const volumeOverrides = readJson<Record<string, EntryChange>>(VOLUME_OVERRIDES_KEY) ?? {};
    const keptVolumes: Record<string, EntryChange> = {};
    for (const [id, change] of Object.entries(volumeOverrides)) {
      const lineId = change === DELETED ? SEED_ENTRY_LINE[id] : change.lineId;
      if (lineId !== undefined && lineIds.has(lineId)) continue;
      keptVolumes[id] = change;
    }
    safeSetItem(VOLUME_OVERRIDES_KEY, JSON.stringify(keptVolumes));

    const ownershipOverrides = readJson<Record<string, string>>(OWNERSHIP_OVERRIDES_KEY) ?? {};
    const keptOwnership: Record<string, string> = {};
    for (const [volumeId, status] of Object.entries(ownershipOverrides)) {
      const change = volumeOverrides[volumeId];
      const lineId = change && change !== DELETED ? change.lineId : SEED_ENTRY_LINE[volumeId];
      if (lineId !== undefined && lineIds.has(lineId)) continue;
      keptOwnership[volumeId] = status;
    }
    safeSetItem(OWNERSHIP_OVERRIDES_KEY, JSON.stringify(keptOwnership));
  }

  if (scopeSet.has("speculative")) {
    const speculativeLines = readJson<Record<string, LineChange>>(SPECULATIVE_LINES_KEY) ?? {};

    const speculativeLineIds = new Set<string>();
    for (const [id, change] of Object.entries(speculativeLines)) {
      if (change !== DELETED && targets.has(change.collectionId)) speculativeLineIds.add(id);
    }

    safeSetItem(
      SPECULATIVE_LINES_KEY,
      JSON.stringify(filterLineStore(speculativeLines, targets))
    );

    const speculativeVolumes =
      readJson<Record<string, EntryChange>>(SPECULATIVE_VOLUMES_KEY) ?? {};
    const keptSpeculativeVolumes: Record<string, EntryChange> = {};
    for (const [id, change] of Object.entries(speculativeVolumes)) {
      const lineId = change === DELETED ? undefined : change.lineId;
      if (lineId !== undefined && speculativeLineIds.has(lineId)) continue;
      keptSpeculativeVolumes[id] = change;
    }
    safeSetItem(SPECULATIVE_VOLUMES_KEY, JSON.stringify(keptSpeculativeVolumes));
  }
}
