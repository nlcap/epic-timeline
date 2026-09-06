import {
  ALL_KINDS,
  keysForSelection,
  partitionBundle,
  partsForScopesAndKinds,
  readBundleFromStorage,
  type DataKind,
  type TimelineScope,
} from "./collectionScope";
import { safeSetItem } from "./storage";

export type { TimelineScope };

/**
 * Wipes local overrides/additions back to the shipped seed data, scoped to
 * whichever collections, timeline layers, and data kinds the caller asks
 * for. E.g. `{ collectionIds: ["ultimate", "marvel-licensed-epic"], scopes:
 * ["main"], kinds: ["edits"] }` clears just the line/volume overrides for
 * those two collections' main timelines, leaving ownership and reading
 * status (and every other collection, and any speculative data) untouched.
 *
 * Keeps this two-axis {scopes, kinds} shape as its own public signature
 * rather than taking the flat SelectionPart[] every other caller of
 * lib/collectionScope.ts uses now (see Selection there): the reset dialog's
 * "Timeline" and "What to reset" controls are deliberately two independent
 * choices, not one list, so this translates them via
 * partsForScopesAndKinds rather than exposing the flat shape and asking
 * ResetLineDataButton to reassemble it. `kinds` defaults to every kind, so
 * a caller that doesn't care about the axis (existing tests, anything
 * calling this before the reset dialog grew its "what to reset" choice)
 * still gets the old wholesale-reset behavior.
 *
 * A reset is the "keep the other half" case of the shared split in
 * lib/collectionScope.ts -- partition the stores by the selection, then
 * write back only what fell outside it.
 *
 * Reads and writes localStorage directly rather than going through the
 * override hooks (useLineOverrides etc.), since those only load their
 * state once on mount -- callers should reload the page afterward to get
 * every hook to re-read the now-reset stores, same as ImportDataButton.
 */
export function resetLineData({
  collectionIds,
  scopes,
  kinds = [...ALL_KINDS],
}: {
  collectionIds: string[];
  scopes: TimelineScope[];
  kinds?: DataKind[];
}): void {
  const selection = { collectionIds, parts: partsForScopesAndKinds(scopes, kinds) };
  const { outside } = partitionBundle(readBundleFromStorage(), selection);

  // Only the stores this selection actually targets get written -- the
  // rest of `outside` is untouched passthrough, and rewriting it would be
  // pointless churn. Absent stores are written back as `{}`, which is what
  // this has always done.
  for (const key of keysForSelection(selection)) {
    safeSetItem(key, JSON.stringify(outside[key] ?? {}));
  }
}
