import { COLLECTIONS } from "../data/collections";
import { COLLECTION_DATA } from "../data/collectionData";
import { EXPORT_KEYS, type ExportKey } from "./overrideKeys";

/**
 * The one place that knows how to slice the six override stores by
 * collection, timeline layer, and data type. Reset, export, and import are
 * all the same operation over the same selection -- they just keep
 * different halves of the split:
 *
 *   reset            -> write back `outside` (discard the selection)
 *   export           -> serialize `inside`
 *   import (replace) -> local `outside` + file `inside`
 *   import (merge)   -> whole local bundle + file `inside` layered on top
 *
 * so all three go through partitionBundle rather than each reimplementing
 * the (genuinely fiddly) "which collection does this record belong to?"
 * resolution below.
 */

export type TimelineScope = "main" | "speculative";

/** What kind of thing a record is, independent of which timeline layer it
 * lives on. "edits" and "notes" exist on both layers; ownership and
 * reading progress are main-only, since speculative entries never carry
 * either (see useOwnership/useReadingStatus and App.tsx). */
export type DataKind = "edits" | "notes" | "ownership" | "reading";

export type Selection = {
  collectionIds: string[];
  scopes: TimelineScope[];
  kinds: DataKind[];
};

/** Every store as a parsed map, keyed by its localStorage key. Sourced
 * either from localStorage (export, reset) or from an uploaded/pasted
 * export file (import) -- the resolution below deliberately reads its
 * context out of the bundle it's given rather than always from
 * localStorage, so an imported file that defines its own custom lines can
 * still be scoped correctly. */
export type StoreBundle = Partial<Record<ExportKey, Record<string, unknown>>>;

const LINE_OVERRIDES_KEY = "epic-timeline:line-overrides";
const VOLUME_OVERRIDES_KEY = "epic-timeline:volume-overrides";
const OWNERSHIP_OVERRIDES_KEY = "epic-timeline:ownership-overrides";
const READING_STATUS_OVERRIDES_KEY = "epic-timeline:reading-status-overrides";
const SPECULATIVE_LINES_KEY = "epic-timeline:speculative-lines";
const SPECULATIVE_VOLUMES_KEY = "epic-timeline:speculative-volumes";

// No DELETED constant needed here: a "deleted" tombstone is a bare string,
// so asRecord below rejects it and the lookup falls through to the seed
// maps -- which is exactly the handling a tombstone needs anyway.

/** Stores keyed by lineId. */
const LINE_STORES = [LINE_OVERRIDES_KEY, SPECULATIVE_LINES_KEY] as const;
/** Stores keyed by volumeId whose records carry a lineId of their own. */
const VOLUME_STORES = [VOLUME_OVERRIDES_KEY, SPECULATIVE_VOLUMES_KEY] as const;
/** Stores keyed by volumeId whose records are a bare status string. */
const STATUS_STORES = [OWNERSHIP_OVERRIDES_KEY, READING_STATUS_OVERRIDES_KEY] as const;

const SCOPE_OF_KEY: Record<ExportKey, TimelineScope> = {
  [LINE_OVERRIDES_KEY]: "main",
  [VOLUME_OVERRIDES_KEY]: "main",
  [OWNERSHIP_OVERRIDES_KEY]: "main",
  [READING_STATUS_OVERRIDES_KEY]: "main",
  [SPECULATIVE_LINES_KEY]: "speculative",
  [SPECULATIVE_VOLUMES_KEY]: "speculative",
};

/**
 * Which data-type buckets each store can hold. All but one hold a single
 * kind, so the store itself decides; the speculative volumes store is the
 * exception -- notes share it with volumes and gaps (see `Note` in
 * types/index.ts, a speculation-only entry with no main-timeline
 * counterpart), so records there are bucketed individually by
 * kindOfRecord. Speculative *lines* count as "edits": a line is the
 * container an entry hangs off, not a note in its own right.
 */
const KINDS_IN_KEY: Record<ExportKey, DataKind[]> = {
  [LINE_OVERRIDES_KEY]: ["edits"],
  [VOLUME_OVERRIDES_KEY]: ["edits"],
  [OWNERSHIP_OVERRIDES_KEY]: ["ownership"],
  [READING_STATUS_OVERRIDES_KEY]: ["reading"],
  [SPECULATIVE_LINES_KEY]: ["edits"],
  [SPECULATIVE_VOLUMES_KEY]: ["edits", "notes"],
};

/**
 * The bucket a single record falls in. Only the speculative volumes store
 * needs to look at the record at all.
 *
 * A tombstone there can't be told apart from any other -- "deleted" says
 * nothing about what was deleted -- so it's filed under "edits". Harmless
 * either way: speculative entries are always user-created, so a tombstone
 * for one has no seed counterpart to resolve against and never travels in
 * anything but a full export.
 */
function kindOfRecord(key: ExportKey, change: unknown): DataKind {
  if (key === SPECULATIVE_VOLUMES_KEY) {
    return readString(asRecord(change), "kind") === "note" ? "notes" : "edits";
  }
  return KINDS_IN_KEY[key][0];
}

// Seed lineId -> collectionId and seed entryId -> lineId, across every
// seeded collection. A tombstone ("deleted") carries no collectionId or
// lineId of its own, so this is how a deleted seed line or volume still
// gets scoped to the right collection. A tombstone for a custom line or
// volume that was added and then deleted has no seed counterpart -- those
// stay unresolvable, and are left alone everywhere here.
const SEED_LINE_COLLECTION: Record<string, string> = {};
const SEED_ENTRY_LINE: Record<string, string> = {};
for (const [collectionId, { lines, entries }] of Object.entries(COLLECTION_DATA)) {
  for (const line of lines) SEED_LINE_COLLECTION[line.id] = collectionId;
  for (const entry of entries) SEED_ENTRY_LINE[entry.id] = entry.lineId;
}

function readJson(key: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** Snapshots every store that currently exists in localStorage. Keys with
 * no entry (or unparseable content) are simply absent, same as the export
 * payload has always treated them. */
export function readBundleFromStorage(): StoreBundle {
  const bundle: StoreBundle = {};
  for (const key of EXPORT_KEYS) {
    const parsed = readJson(key);
    if (parsed) bundle[key] = parsed;
  }
  return bundle;
}

/** A record that isn't a tombstone, narrowed to something field-readable. */
function asRecord(change: unknown): Record<string, unknown> | null {
  return typeof change === "object" && change !== null
    ? (change as Record<string, unknown>)
    : null;
}

function readString(source: Record<string, unknown> | null, field: string): string | undefined {
  const value = source?.[field];
  return typeof value === "string" ? value : undefined;
}

/**
 * Resolves records to collections, reading its context out of `bundle`
 * first and then `context`.
 *
 * The chains, all of which can dead-end at `undefined`:
 *   line     -> record.collectionId, else the seed map
 *   volume   -> record.lineId, else the seed map -> then the line chain
 *   status   -> the volume it's attached to -> then the volume chain
 *
 * Note the line lookup checks *both* line stores. A speculative volume is
 * allowed to hang off an official line (see `allLineIds` in App.tsx), so
 * resolving speculative records against the speculative line store alone
 * would silently miss them -- which is exactly what resetLineData used to
 * do before this moved here.
 *
 * `context` covers the case where a bundle isn't self-contained: a
 * notes-only export file holds notes but not the custom speculative lines
 * they hang off, so on import the local stores have to supply the missing
 * definitions. Without it those notes would resolve to no collection and be
 * quietly skipped -- exactly the records the user asked to import.
 */
function createResolver(bundle: StoreBundle, context?: StoreBundle) {
  const sources = context ? [bundle, context] : [bundle];

  const lineCollection = (lineId: string): string | undefined => {
    for (const source of sources) {
      for (const key of LINE_STORES) {
        const collectionId = readString(asRecord(source[key]?.[lineId]), "collectionId");
        if (collectionId !== undefined) return collectionId;
      }
    }
    return SEED_LINE_COLLECTION[lineId];
  };

  const volumeLine = (volumeId: string): string | undefined => {
    for (const source of sources) {
      for (const key of VOLUME_STORES) {
        const lineId = readString(asRecord(source[key]?.[volumeId]), "lineId");
        if (lineId !== undefined) return lineId;
      }
    }
    return SEED_ENTRY_LINE[volumeId];
  };

  /** The collection a single store record belongs to, or undefined when
   * nothing in the bundle or the seed data can place it. */
  return (key: ExportKey, id: string): string | undefined => {
    if ((LINE_STORES as readonly string[]).includes(key)) return lineCollection(id);

    // Volume and status stores share the rest of the chain: both are keyed
    // by volumeId, and a status override carries nothing but a status
    // string, so its owning volume has to be found in the volume stores
    // (or the seed map) either way.
    if (
      (VOLUME_STORES as readonly string[]).includes(key) ||
      (STATUS_STORES as readonly string[]).includes(key)
    ) {
      const lineId = volumeLine(id);
      return lineId === undefined ? undefined : lineCollection(lineId);
    }
    return undefined;
  };
}

/** The stores a selection touches -- those on a selected layer holding at
 * least one selected data type. Empty when the selection can't name any
 * data at all (no collections, no scopes, or no data types). Note that a
 * store being listed doesn't mean all of it is selected: the speculative
 * volumes store qualifies on either "edits" or "notes", and partitioning
 * then sorts its records out one by one. */
export function keysForSelection(selection: Selection): ExportKey[] {
  if (selection.collectionIds.length === 0) return [];
  const scopes = new Set(selection.scopes);
  const kinds = new Set(selection.kinds);
  return EXPORT_KEYS.filter(
    (key) => scopes.has(SCOPE_OF_KEY[key]) && KINDS_IN_KEY[key].some((kind) => kinds.has(kind))
  );
}

/** True when a selection covers everything there is to cover -- the
 * whole-backup case, which partitionBundle short-circuits (see there) and
 * which the export dialog labels differently. */
export function isFullSelection(selection: Selection): boolean {
  const collections = new Set(selection.collectionIds);
  return (
    COLLECTIONS.every((c) => collections.has(c.id)) &&
    new Set(selection.scopes).size === ALL_SCOPES.length &&
    new Set(selection.kinds).size === ALL_KINDS.length
  );
}

/**
 * Splits a bundle into the records a selection names (`inside`) and
 * everything else (`outside`).
 *
 * Key presence is preserved: a store that exists in `bundle` and is
 * covered by the selection appears in both halves (either can be empty),
 * so callers can write results back without having to guess whether a
 * store was there to begin with. A store the selection doesn't cover at
 * all is passed through to `outside` untouched and is absent from
 * `inside`.
 *
 * Records that resolve to no collection stay in `outside` -- unresolvable
 * records are left alone by every caller, which is how reset has always
 * treated them.
 */
export function partitionBundle(
  bundle: StoreBundle,
  selection: Selection,
  /** Extra line/volume definitions used only to resolve records to
   * collections -- never partitioned or returned. See createResolver. */
  context?: StoreBundle
): { inside: StoreBundle; outside: StoreBundle } {
  // A full selection is the identity split. Worth special-casing so a
  // whole-backup export stays byte-for-byte what it was before any of
  // this scoping existed -- including records that resolve to no
  // collection, which a narrowed selection deliberately leaves behind.
  if (isFullSelection(selection)) return { inside: { ...bundle }, outside: {} };

  const selectedKeys = new Set<ExportKey>(keysForSelection(selection));
  const targets = new Set(selection.collectionIds);
  const kinds = new Set(selection.kinds);
  const collectionOf = createResolver(bundle, context);

  const inside: StoreBundle = {};
  const outside: StoreBundle = {};

  for (const key of EXPORT_KEYS) {
    const store = bundle[key];
    if (!store) continue;
    if (!selectedKeys.has(key)) {
      outside[key] = store;
      continue;
    }
    const kept: Record<string, unknown> = {};
    const dropped: Record<string, unknown> = {};
    for (const [id, change] of Object.entries(store)) {
      // Both axes are checked per record, not per store, because the
      // speculative volumes store mixes notes in with volumes and gaps --
      // so "Ultimate notes only" has to be able to take part of a store
      // and leave the rest.
      const collectionId = collectionOf(key, id);
      const matches =
        collectionId !== undefined &&
        targets.has(collectionId) &&
        kinds.has(kindOfRecord(key, change));
      if (matches) kept[id] = change;
      else dropped[id] = change;
    }
    inside[key] = kept;
    outside[key] = dropped;
  }

  return { inside, outside };
}

/**
 * Adds back the line records that `slice`'s entries hang off, taken from
 * `source`, so a slice can stand on its own in a browser that has never
 * seen those lines.
 *
 * This is what makes a notes-only export usable. Notes count as their own
 * data type while the speculative lines they sit on count as "lines &
 * volumes", so picking Notes alone produces entries with nothing to attach
 * to -- they'd resolve to no collection on the way back in and be skipped.
 * Pulling their lines along closes that gap without muddying what the
 * checkboxes mean.
 *
 * Only ever *adds*, and only lines the source actually defines: an entry on
 * a seeded line needs nothing (the seed data supplies it), and a slice that
 * already includes its lines gets back an unchanged copy. Deliberately not
 * folded into partitionBundle -- that function's two halves have to stay a
 * clean partition, since reset writes `outside` back and would delete any
 * line that quietly migrated to `inside`.
 */
export function withReferencedLines(slice: StoreBundle, source: StoreBundle): StoreBundle {
  const result: StoreBundle = { ...slice };

  for (const volumeKey of VOLUME_STORES) {
    for (const change of Object.values(slice[volumeKey] ?? {})) {
      const lineId = readString(asRecord(change), "lineId");
      if (lineId === undefined) continue;
      // Already carried by this slice? Then there's nothing to add.
      if (LINE_STORES.some((key) => result[key]?.[lineId] !== undefined)) continue;

      for (const lineKey of LINE_STORES) {
        // Tombstones are skipped -- "deleted" carries no definition to
        // attach anything to, so it would be dead weight in the file.
        const line = asRecord(source[lineKey]?.[lineId]);
        if (!line) continue;
        result[lineKey] = { ...result[lineKey], [lineId]: line };
        break;
      }
    }
  }
  return result;
}

export type SliceCounts = {
  byCollection: Record<string, number>;
  byScope: Record<TimelineScope, number>;
  byKind: Record<DataKind, number>;
  /** Records that resolve to no collection -- a custom line or volume
   * added and then deleted, or one belonging to a collection this build
   * doesn't ship. Only a full selection carries them. */
  unresolved: number;
  total: number;
};

/**
 * Tallies a bundle's records along all three axes at once, so the import
 * picker can show per-slice counts and grey out what a file has nothing
 * for. Every record lands in exactly one bucket per axis, so each axis's
 * counts sum to `total`.
 */
export function countBySlice(bundle: StoreBundle, context?: StoreBundle): SliceCounts {
  const collectionOf = createResolver(bundle, context);
  const counts: SliceCounts = {
    byCollection: {},
    byScope: { main: 0, speculative: 0 },
    byKind: { edits: 0, notes: 0, ownership: 0, reading: 0 },
    unresolved: 0,
    total: 0,
  };

  for (const key of EXPORT_KEYS) {
    const store = bundle[key];
    if (!store) continue;
    for (const [id, change] of Object.entries(store)) {
      counts.total += 1;
      counts.byScope[SCOPE_OF_KEY[key]] += 1;
      counts.byKind[kindOfRecord(key, change)] += 1;

      const collectionId = collectionOf(key, id);
      if (collectionId === undefined) counts.unresolved += 1;
      else counts.byCollection[collectionId] = (counts.byCollection[collectionId] ?? 0) + 1;
    }
  }
  return counts;
}

/** Total records across a bundle -- the honest "how much is in here?"
 * number, as opposed to counting stores. */
export function countRecords(bundle: StoreBundle): number {
  let total = 0;
  for (const key of EXPORT_KEYS) total += Object.keys(bundle[key] ?? {}).length;
  return total;
}

/**
 * Layers `overlay` on top of `base` store by store, record by record --
 * `overlay` wins on an id collision, and any store or record `overlay`
 * doesn't mention survives from `base`. Backs both import modes: replace
 * passes the local `outside` half as the base, merge passes the whole
 * local bundle.
 */
export function mergeBundles(base: StoreBundle, overlay: StoreBundle): StoreBundle {
  const result: StoreBundle = {};
  for (const key of EXPORT_KEYS) {
    const from = base[key];
    const over = overlay[key];
    if (!from && !over) continue;
    result[key] = { ...from, ...over };
  }
  return result;
}

export const ALL_COLLECTION_IDS = COLLECTIONS.map((c) => c.id);
export const ALL_SCOPES: TimelineScope[] = ["main", "speculative"];
export const ALL_KINDS: DataKind[] = ["edits", "notes", "ownership", "reading"];

/** Everything selected -- the default for an export, and the widest
 * possible import. */
export function fullSelection(): Selection {
  return { collectionIds: [...ALL_COLLECTION_IDS], scopes: [...ALL_SCOPES], kinds: [...ALL_KINDS] };
}
