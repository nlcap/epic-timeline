import {
  countRecords,
  isFullSelection,
  partitionBundle,
  withReferencedLines,
  type Selection,
  type StoreBundle,
} from "./collectionScope";
import { EXPORT_FORMAT_VERSION, EXPORT_KEYS, EXPORT_META_KEY } from "./overrideKeys";

/**
 * Assembles the export file format -- a `__meta` block naming the slice,
 * plus one entry per store that slice covers -- from a bundle and a
 * selection.
 *
 * Shared by the two dialogs that hand data out, which differ only in how
 * the selection is arrived at: ExportDataPanel always passes
 * fullSelection(), while CopyCorrectionsButton pins one fixed narrow
 * slice. Both produce the same format, so a corrections copy is still a
 * valid import file rather than a second, subtly different shape.
 *
 * Deliberately doesn't strip icons or add the Sandbox tab's own extras --
 * both are the caller's business (only the full export carries the extras,
 * and stripping is applied once over the finished payload). See
 * stripIconsFromPayload and CUSTOM_COLLECTION_CONFIG_KEY.
 */
export function buildExportPayload(
  bundle: StoreBundle,
  selection: Selection
): {
  payload: Record<string, unknown>;
  /** Records the selection actually names. */
  recordCount: number;
  /** Line definitions pulled in on top of those, so the file stands alone
   * elsewhere -- see withReferencedLines. */
  carriedLines: number;
} {
  const { inside: selected } = partitionBundle(bundle, selection);
  // Entries need the lines they hang off to be readable anywhere else --
  // most visibly for a notes-only export, whose notes are otherwise
  // orphaned on the way back in. See withReferencedLines.
  const inside = withReferencedLines(selected, bundle);
  const everything = isFullSelection(selection);

  const payload: Record<string, unknown> = {
    [EXPORT_META_KEY]: {
      version: EXPORT_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      collections: selection.collectionIds,
      parts: selection.parts,
    },
  };
  for (const key of EXPORT_KEYS) {
    const store = inside[key];
    if (!store) continue;
    // A narrowed export drops stores that ended up with nothing in them, so
    // the file only contains what was actually asked for. A full export
    // keeps whatever localStorage held, empty stores included, so a whole
    // backup round-trips exactly.
    if (!everything && Object.keys(store).length === 0) continue;
    payload[key] = store;
  }

  return {
    payload,
    recordCount: countRecords(selected),
    carriedLines: countRecords(inside) - countRecords(selected),
  };
}
