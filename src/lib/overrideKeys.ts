/**
 * Every localStorage key holding user data, written out exactly once.
 *
 * These strings are the app's persistence contract: whatever is already
 * sitting in a returning visitor's browser is keyed by them, so renaming
 * one silently orphans real records rather than failing loudly. They used
 * to be spelled out in three separate places -- the arrays below, the six
 * per-store consts in lib/collectionScope.ts, and a private STORAGE_KEY in
 * each of the six hooks that owns a store -- which meant a rename had to
 * land in all three with nothing to catch a miss. Everything now reads
 * them from here.
 *
 * Two other keys deliberately aren't in this map: the active collection
 * tab (App.tsx) and the last-seen changelog release (useWhatsNew). Both
 * are single-use UI bookkeeping rather than user data, neither is
 * duplicated anywhere, and neither belongs in an export -- keeping them
 * out is what makes "everything in STORAGE_KEYS travels in the bundle"
 * true by construction.
 */
export const STORAGE_KEYS = {
  lineOverrides: "epic-timeline:line-overrides",
  volumeOverrides: "epic-timeline:volume-overrides",
  ownershipOverrides: "epic-timeline:ownership-overrides",
  readingStatusOverrides: "epic-timeline:reading-status-overrides",
  speculativeLines: "epic-timeline:speculative-lines",
  speculativeVolumes: "epic-timeline:speculative-volumes",
} as const;

// The three "real correction" override stores -- line edits, volume
// edits/resizes, and ownership status -- plus reading status, a per-volume
// tracking value with the same override-map shape but no seed counterpart
// to correct. Unlike the other three, baking a reading status into the
// shipped seed data as a new default would never make sense (it's Nick's
// personal progress, not a fact about the volume) -- it's grouped here
// anyway since export/import/reset all treat every key in this list the
// same way regardless of what it means.
/** True once any real user data exists -- any of the six keys above, not
 * `active-collection` or `updates-last-seen`/`onboarding-seen` (deliberately
 * excluded per the file-level comment: single-use UI bookkeeping, not data).
 * The single source for "is this visitor genuinely new" -- both
 * useWhatsNew's silent-catch-up split and useOnboarding's first-visit gate
 * read this instead of each keeping their own ad-hoc exclude-list, which
 * would otherwise need updating every time a new bookkeeping key is added. */
export function hasStoredUserData(): boolean {
  try {
    return Object.values(STORAGE_KEYS).some((key) => localStorage.getItem(key) !== null);
  } catch {
    return false;
  }
}

export const OVERRIDE_KEYS = [
  STORAGE_KEYS.lineOverrides,
  STORAGE_KEYS.volumeOverrides,
  STORAGE_KEYS.ownershipOverrides,
  STORAGE_KEYS.readingStatusOverrides,
] as const;

// Speculation Mode's sandbox layer -- lines/volumes that are an intentional
// what-if, not a correction to the real data. Never bake these into the
// shipped defaults, but still worth including in a user's own
// export/import so a browser-to-browser backup doesn't lose them.
export const SPECULATIVE_KEYS = [
  STORAGE_KEYS.speculativeLines,
  STORAGE_KEYS.speculativeVolumes,
] as const;

// Everything ExportDataButton/ImportDataButton read and write.
export const EXPORT_KEYS = [...OVERRIDE_KEYS, ...SPECULATIVE_KEYS] as const;

export type ExportKey = (typeof EXPORT_KEYS)[number];

// Describes which slice of the data an export file holds (see Selection in
// lib/collectionScope.ts), so the import picker can pre-select what the
// file actually covers instead of inferring it from record counts alone.
// Double-underscored so it can never collide with a store key, and ignored
// by anything that only looks for EXPORT_KEYS -- which is what makes the
// format compatible in both directions with exports made before it existed.
export const EXPORT_META_KEY = "__meta";
export const EXPORT_FORMAT_VERSION = 1;

// The two override stores keyed by line id (Record<lineId, Line | "deleted">).
// Line carries iconUrl/eraIconUrls, which don't survive an export/import
// round-trip: a seeded line's icon is a build-hashed asset path that can
// break on a different build/deploy, and a user-uploaded icon is a huge
// inline base64 string. Both cases render as a broken image after import,
// so icon fields are stripped on both the way out and the way back in --
// see stripIconsFromPayload. Lines just fall back to their default icon.
const LINE_KEYED_STORES = [STORAGE_KEYS.lineOverrides, STORAGE_KEYS.speculativeLines] as const;

function stripLineIcons(value: unknown): unknown {
  if (typeof value !== "object" || value === null) return value;
  const result: Record<string, unknown> = {};
  for (const [id, change] of Object.entries(value as Record<string, unknown>)) {
    if (typeof change !== "object" || change === null) {
      result[id] = change;
      continue;
    }
    const { iconUrl: _iconUrl, eraIconUrls: _eraIconUrls, ...rest } = change as Record<
      string,
      unknown
    >;
    result[id] = rest;
  }
  return result;
}

/** Strips icon image data from a parsed EXPORT_KEYS payload -- applied both
 * when building an export and when reading an import, so old exports that
 * still carry icons get sanitized too. */
export function stripIconsFromPayload<T extends Record<string, unknown>>(payload: T): T {
  const result = { ...payload };
  for (const key of LINE_KEYED_STORES) {
    if (key in result) result[key as keyof T] = stripLineIcons(result[key as keyof T]) as T[keyof T];
  }
  return result;
}
