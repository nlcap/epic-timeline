import {
  ALL_KINDS,
  keysForSelection,
  partitionBundle,
  readBundleFromStorage,
  type TimelineScope,
} from "./collectionScope";
import { safeSetItem } from "./storage";

export type { TimelineScope };

/**
 * Wipes local overrides/additions back to the shipped seed data, scoped to
 * whichever collections and timeline layers the caller asks for. E.g.
 * `{ collectionIds: ["ultimate", "marvel-licensed-epic"], scopes: ["main"] }`
 * clears line/volume/ownership overrides for just those two collections,
 * leaving every other collection and any speculative data untouched.
 *
 * A reset is the "keep the other half" case of the shared split in
 * lib/collectionScope.ts -- partition the stores by the selection, then
 * write back only what fell outside it. All three data kinds are passed
 * through, since the reset dialog resets a collection's main timeline
 * wholesale (ownership and reading progress included) rather than offering
 * the data-type axis that export/import do.
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
  const selection = { collectionIds, scopes, kinds: [...ALL_KINDS] };
  const { outside } = partitionBundle(readBundleFromStorage(), selection);

  // Only the stores this selection actually targets get written -- the
  // rest of `outside` is untouched passthrough, and rewriting it would be
  // pointless churn. Absent stores are written back as `{}`, which is what
  // this has always done.
  for (const key of keysForSelection(selection)) {
    safeSetItem(key, JSON.stringify(outside[key] ?? {}));
  }
}
