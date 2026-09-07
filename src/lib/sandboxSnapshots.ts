import { safeGetItem, safeGetJson, safeRemoveItem, safeSetItem } from "./storage";
import {
  ALL_PARTS,
  keysForSelection,
  mergeBundles,
  partitionBundle,
  readBundleFromStorage,
  type Selection,
  type StoreBundle,
} from "./collectionScope";
import {
  CUSTOM_COLLECTION_CONFIG_KEY,
  CUSTOM_COLLECTION_ID,
  stripIconsFromPayload,
} from "./overrideKeys";
import type { CustomCollectionConfig } from "../hooks/useCustomCollectionConfig";

/**
 * A user's library of saved Sandbox timelines, kept separate from the live
 * Sandbox tab's own data (the seven override stores plus
 * CUSTOM_COLLECTION_CONFIG_KEY, both scoped to collection id "custom"),
 * which only ever holds *one* timeline at a time. Each entry here is a
 * frozen copy of that live state under a name, so switching the live tab to
 * a different saved timeline -- or a blank one -- doesn't lose whatever
 * else is in the library.
 *
 * Deliberately kept outside EXPORT_KEYS/lib/collectionScope.ts's partition
 * machinery, the same way CUSTOM_COLLECTION_CONFIG_KEY already is: an entry
 * here is a whole saved bundle+config pair keyed by its own id, not a
 * per-line/per-volume record the collection/scope/kind axes could slice
 * further. It still travels in an export as its own top-level payload key,
 * whenever the Sandbox tab is part of the selection (see
 * ExportDataPanel/ImportDataPanel), and always merges by id on the way
 * back in regardless of import mode -- see mergeSandboxSnapshots.
 */
export const SANDBOX_SNAPSHOTS_KEY = "epic-timeline:sandbox-snapshots";

/** Which saved snapshot (if any) the live Sandbox tab currently matches --
 * single-use UI bookkeeping like active-collection/updates-last-seen (see
 * the file comment on STORAGE_KEYS in overrideKeys.ts), not user data in
 * its own right, so it lives outside the snapshots map itself. */
const ACTIVE_SNAPSHOT_KEY = "epic-timeline:sandbox-active-snapshot";

export type SandboxSnapshot = {
  id: string;
  name: string;
  savedAt: string;
  config: CustomCollectionConfig;
  bundle: StoreBundle;
};

/**
 * How an operation that rewrites the live Sandbox tab's stores finished.
 *
 * "partial" is the one that matters: these operations write seven stores in
 * a loop, and a quota failure part-way through leaves the tab half-applied
 * with no way to roll back (localStorage has no transaction). Callers must
 * not reload as though it worked -- same reasoning, and the same answer, as
 * ImportDataPanel's own part-way-through guard.
 */
export type SandboxApplyResult = "ok" | "not-found" | "partial";

const SANDBOX_SELECTION: Selection = {
  collectionIds: [CUSTOM_COLLECTION_ID],
  parts: [...ALL_PARTS],
};

function loadSnapshots(): Record<string, SandboxSnapshot> {
  return safeGetJson<Record<string, SandboxSnapshot>>(SANDBOX_SNAPSHOTS_KEY, {});
}

function writeSnapshots(snapshots: Record<string, SandboxSnapshot>): boolean {
  return safeSetItem(SANDBOX_SNAPSHOTS_KEY, JSON.stringify(snapshots));
}

/** Newest-saved first -- the one just saved (or most recently touched) is
 * the one most likely wanted again. */
export function listSandboxSnapshots(): SandboxSnapshot[] {
  return Object.values(loadSnapshots()).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function getActiveSandboxSnapshotId(): string | null {
  return safeGetItem(ACTIVE_SNAPSHOT_KEY);
}

function setActiveSandboxSnapshotId(id: string | null): void {
  if (id) safeSetItem(ACTIVE_SNAPSHOT_KEY, id);
  else safeRemoveItem(ACTIVE_SNAPSHOT_KEY);
}

/**
 * Saves the Sandbox tab's current timeline (lines, volumes, ownership,
 * reading progress, ratings and notes, both layers) plus the given
 * appearance config into the library under `name`. Updates the entry at
 * `id` in place when given (creating one new to `id` counts as an update
 * too, so a rename-and-save doesn't fork a duplicate); omitted, it always
 * creates a new entry. Either way the result becomes the active snapshot,
 * so a follow-up save with the same id lands on the same entry instead of
 * piling up copies.
 *
 * Takes `config` as a parameter rather than reading
 * CUSTOM_COLLECTION_CONFIG_KEY itself, so the caller can snapshot
 * in-progress field edits that haven't been committed with the form's own
 * Save yet.
 *
 * Returns null when the write failed (see safeSetItem) -- the active
 * pointer is deliberately left alone in that case, since pointing it at an
 * id the library doesn't contain would leave the picker showing a
 * selection that doesn't exist.
 */
export function saveSandboxSnapshot(
  name: string,
  config: CustomCollectionConfig,
  id?: string
): SandboxSnapshot | null {
  const snapshots = loadSnapshots();
  const snapshotId = id ?? crypto.randomUUID();
  const snapshot: SandboxSnapshot = {
    id: snapshotId,
    name,
    savedAt: new Date().toISOString(),
    config,
    bundle: partitionBundle(readBundleFromStorage(), SANDBOX_SELECTION).inside,
  };
  snapshots[snapshotId] = snapshot;
  if (!writeSnapshots(snapshots)) return null;
  setActiveSandboxSnapshotId(snapshotId);
  return snapshot;
}

/** Removes a saved snapshot from the library, returning false if the write
 * failed. Leaves the live Sandbox tab untouched -- if it was the active
 * one, it just stops being tied to a saved slot rather than being cleared. */
export function deleteSandboxSnapshot(id: string): boolean {
  const snapshots = loadSnapshots();
  delete snapshots[id];
  if (!writeSnapshots(snapshots)) return false;
  if (getActiveSandboxSnapshotId() === id) setActiveSandboxSnapshotId(null);
  return true;
}

/**
 * Applies the same icon stripping every other exported store already gets
 * to the line records nested inside each snapshot's own bundle.
 *
 * stripIconsFromPayload only reaches stores sitting at the top level of a
 * payload, so a snapshot -- which carries its whole bundle one level down
 * -- slipped past it in both directions: an uploaded line icon is a base64
 * data URL (see compressImageFile), and a library of them rode out into
 * export files and back in again, which is exactly what that stripping
 * exists to prevent (see LINE_KEYED_STORES in overrideKeys.ts).
 *
 * Deliberately applied only at the export/import boundary, not in
 * saveSandboxSnapshot: a snapshot saved and reloaded in the same browser
 * keeps its icons, since the reasons for stripping (file bloat, and
 * build-hashed asset paths that don't survive a different deploy) are both
 * about leaving this browser.
 */
export function stripIconsFromSnapshots(
  snapshots: Record<string, SandboxSnapshot>
): Record<string, SandboxSnapshot> {
  const result: Record<string, SandboxSnapshot> = {};
  for (const [id, snapshot] of Object.entries(snapshots)) {
    result[id] = { ...snapshot, bundle: stripIconsFromPayload({ ...snapshot.bundle }) };
  }
  return result;
}

/** Merges an imported library of snapshots into the local one, the
 * incoming copy winning only on an id collision -- called from
 * ImportDataPanel, which always merges this key regardless of which
 * import mode ("replace"/"merge") the user picked for the rest of the
 * file. That toggle governs the *live* Sandbox tab's content; applying
 * "replace" here too would silently delete every other saved sandbox in
 * the library over a choice that was never about the library at all.
 * Returns false if the write failed (see safeSetItem). */
export function mergeSandboxSnapshots(incoming: Record<string, SandboxSnapshot>): boolean {
  return writeSnapshots({ ...loadSnapshots(), ...incoming });
}

/**
 * Replaces the live Sandbox tab's timeline and appearance with a saved
 * snapshot's, and marks it active. Writes nothing and reports "not-found"
 * if `id` doesn't name a saved snapshot.
 *
 * The override stores this writes to are only ever read once, at mount
 * (see useOverrideStore) -- on "ok" the caller must reload the page for the
 * change to actually show up, same as ImportDataPanel/ResetLineDataPanel.
 * On "partial" it must *not*: see SandboxApplyResult.
 */
export function loadSandboxSnapshot(id: string): SandboxApplyResult {
  const snapshot = loadSnapshots()[id];
  if (!snapshot) return "not-found";

  const { outside } = partitionBundle(readBundleFromStorage(), SANDBOX_SELECTION);
  const merged = mergeBundles(outside, snapshot.bundle);
  let written = true;
  for (const key of keysForSelection(SANDBOX_SELECTION)) {
    if (!safeSetItem(key, JSON.stringify(merged[key] ?? {}))) written = false;
  }
  if (!safeSetItem(CUSTOM_COLLECTION_CONFIG_KEY, JSON.stringify(snapshot.config))) written = false;
  // Only claim the tab is this snapshot once all of it actually landed --
  // otherwise a later Save would overwrite the snapshot with the
  // half-applied state it was supposed to restore.
  if (!written) return "partial";
  setActiveSandboxSnapshotId(id);
  return "ok";
}

/**
 * Clears the live Sandbox tab back to a blank slate -- no lines or
 * volumes, default appearance, no active snapshot. The library itself is
 * untouched. Same reload requirement as loadSandboxSnapshot.
 */
export function startNewSandbox(): SandboxApplyResult {
  const { outside } = partitionBundle(readBundleFromStorage(), SANDBOX_SELECTION);
  let written = true;
  for (const key of keysForSelection(SANDBOX_SELECTION)) {
    if (!safeSetItem(key, JSON.stringify(outside[key] ?? {}))) written = false;
  }
  safeRemoveItem(CUSTOM_COLLECTION_CONFIG_KEY);
  // Cleared unconditionally, unlike loadSandboxSnapshot's: a half-cleared
  // tab doesn't match the previously active snapshot either, so leaving the
  // pointer on it would aim the next Save at overwriting that snapshot with
  // the wreckage. Untying it means the next Save starts a new entry.
  setActiveSandboxSnapshotId(null);
  return written ? "ok" : "partial";
}
