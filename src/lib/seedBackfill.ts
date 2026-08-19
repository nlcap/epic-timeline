import { COLLECTION_DATA } from "../data/collectionData";
import type { TimelineEntry } from "../types";

type EntryChange = TimelineEntry | "deleted";
type OverrideMap = Record<string, EntryChange>;

/**
 * Fields the seed owns and the user doesn't author: publisher facts that get
 * filled in by research passes long after a volume was first shown. Anything
 * the user actually types (title, issuesCollected, description) is left alone
 * -- the form writes those as `""` rather than dropping them, so a cleared one
 * is present-but-empty and never looks absent to the check below.
 */
const SEED_OWNED_FIELDS = ["releaseDate", "writers", "pencillers", "inkers"] as const;

/** Pre-split shape: `artists` became `pencillers`/`inkers` (see TimelineEntry). */
type Volume = Extract<TimelineEntry, { kind: "volume" }>;
type LegacyVolume = Volume & { artists?: string };

function seedIndex(): Map<string, Volume> {
  const byId = new Map<string, Volume>();
  for (const { entries } of Object.values(COLLECTION_DATA)) {
    for (const entry of entries) {
      if (entry.kind === "volume") byId.set(entry.id, entry);
    }
  }
  return byId;
}

/**
 * One-time repair for overrides that predate a seed change.
 *
 * A volume override is an absolute snapshot, not a diff -- resolveEntries
 * takes `change ?? entry`, so the stored copy wins outright. That means every
 * volume the user has ever edited is frozen at the schema and the facts of the
 * day it was saved, and later seed work is invisible on exactly the volumes
 * they cared enough to touch. The DC Finest credit rebuild surfaced this:
 * Zen and Violence showed no creators despite the seed carrying eight writers.
 *
 * Two repairs, both narrow. Pre-split overrides carrying `artists` move it to
 * `pencillers`, matching what the seed migration did. And any seed-owned field
 * missing from the snapshot is copied across from the seed entry.
 *
 * The one thing this can't distinguish: the form saves a cleared credit as
 * `undefined`, which JSON drops, so a field deliberately emptied is
 * byte-for-byte identical to one never set. A cleared credit will come back.
 * That's the right trade at this size -- restoring real credits on every
 * touched volume beats preserving a deletion the user can redo in a keystroke
 * -- but it's the reason this is a migration and not the permanent answer.
 */
export async function backfillFromSeed(
  overrides: OverrideMap
): Promise<{ changed: boolean; next: OverrideMap }> {
  const seeds = seedIndex();
  let changed = false;
  const next: OverrideMap = { ...overrides };

  for (const [id, stored] of Object.entries(overrides)) {
    if (stored === "deleted" || stored.kind !== "volume") continue;
    // No seed counterpart means a user-created volume: nothing to backfill
    // from, and its absolute snapshot is the only copy there is.
    const seed = seeds.get(id);
    if (!seed) continue;

    const legacy = stored as LegacyVolume;
    const patch: Partial<LegacyVolume> = {};

    if (legacy.artists !== undefined && legacy.pencillers === undefined) {
      patch.pencillers = legacy.artists;
    }
    for (const field of SEED_OWNED_FIELDS) {
      // `patch[field]` guards the case above: an `artists` value just moved
      // into `pencillers` is the user's own credit and outranks the seed's,
      // even though the field still reads as absent on `legacy`.
      if (
        legacy[field] === undefined &&
        patch[field] === undefined &&
        seed[field] !== undefined
      ) {
        // Widened because the fields differ in type (string vs MonthPoint);
        // each assignment is still key-matched to the same field on both sides.
        (patch as Record<string, unknown>)[field] = seed[field];
      }
    }
    if (Object.keys(patch).length === 0 && legacy.artists === undefined) continue;

    const merged: LegacyVolume = { ...legacy, ...patch };
    delete merged.artists;
    next[id] = merged;
    changed = true;
  }

  return { changed, next };
}
