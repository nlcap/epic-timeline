// The three "real correction" override stores -- line edits, volume
// edits/resizes, and ownership status. These are the ones that make sense
// to bake into the shipped seed data in src/data/*.ts as new defaults.
export const OVERRIDE_KEYS = [
  "epic-timeline:line-overrides",
  "epic-timeline:volume-overrides",
  "epic-timeline:ownership-overrides",
] as const;

// Speculation Mode's sandbox layer -- lines/volumes that are an intentional
// what-if, not a correction to the real data. Never bake these into the
// shipped defaults, but still worth including in a user's own
// export/import so a browser-to-browser backup doesn't lose them.
export const SPECULATIVE_KEYS = [
  "epic-timeline:speculative-lines",
  "epic-timeline:speculative-volumes",
] as const;

// Everything ExportDataButton/ImportDataButton read and write.
export const EXPORT_KEYS = [...OVERRIDE_KEYS, ...SPECULATIVE_KEYS] as const;

// The two override stores keyed by line id (Record<lineId, Line | "deleted">).
// Line carries iconUrl/eraIconUrls, which don't survive an export/import
// round-trip: a seeded line's icon is a build-hashed asset path that can
// break on a different build/deploy, and a user-uploaded icon is a huge
// inline base64 string. Both cases render as a broken image after import,
// so icon fields are stripped on both the way out and the way back in --
// see stripIconsFromPayload. Lines just fall back to their default icon.
const LINE_KEYED_STORES = ["epic-timeline:line-overrides", "epic-timeline:speculative-lines"] as const;

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
