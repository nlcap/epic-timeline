import { safeSetItem } from "./storage";
import {
  ALL_KINDS,
  ALL_SCOPES,
  keysForSelection,
  mergeBundles,
  partitionBundle,
  readBundleFromStorage,
  type Selection,
  type StoreBundle,
} from "./collectionScope";
import { CUSTOM_COLLECTION_CONFIG_KEY, CUSTOM_COLLECTION_ID } from "./overrideKeys";
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
 * further.
 */
const SANDBOX_SNAPSHOTS_KEY = "epic-timeline:sandbox-snapshots";

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

const SANDBOX_SELECTION: Selection = {
  collectionIds: [CUSTOM_COLLECTION_ID],
  scopes: [...ALL_SCOPES],
  kinds: [...ALL_KINDS],
};

function loadSnapshots(): Record<string, SandboxSnapshot> {
  try {
    const raw = localStorage.getItem(SANDBOX_SNAPSHOTS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, SandboxSnapshot>) : {};
  } catch {
    return {};
  }
}

function writeSnapshots(snapshots: Record<string, SandboxSnapshot>): void {
  safeSetItem(SANDBOX_SNAPSHOTS_KEY, JSON.stringify(snapshots));
}

/** Newest-saved first -- the one just saved (or most recently touched) is
 * the one most likely wanted again. */
export function listSandboxSnapshots(): SandboxSnapshot[] {
  return Object.values(loadSnapshots()).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function getActiveSandboxSnapshotId(): string | null {
  return localStorage.getItem(ACTIVE_SNAPSHOT_KEY);
}

function setActiveSandboxSnapshotId(id: string | null): void {
  if (id) safeSetItem(ACTIVE_SNAPSHOT_KEY, id);
  else localStorage.removeItem(ACTIVE_SNAPSHOT_KEY);
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
 */
export function saveSandboxSnapshot(
  name: string,
  config: CustomCollectionConfig,
  id?: string
): SandboxSnapshot {
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
  writeSnapshots(snapshots);
  setActiveSandboxSnapshotId(snapshotId);
  return snapshot;
}

/** Removes a saved snapshot from the library. Leaves the live Sandbox tab
 * untouched -- if it was the active one, it just stops being tied to a
 * saved slot rather than being cleared. */
export function deleteSandboxSnapshot(id: string): void {
  const snapshots = loadSnapshots();
  delete snapshots[id];
  writeSnapshots(snapshots);
  if (getActiveSandboxSnapshotId() === id) setActiveSandboxSnapshotId(null);
}

/**
 * Replaces the live Sandbox tab's timeline and appearance with a saved
 * snapshot's, and marks it active. Returns false and writes nothing if
 * `id` doesn't name a saved snapshot.
 *
 * The override stores this writes to are only ever read once, at mount
 * (see useOverrideStore) -- the caller must reload the page afterward for
 * the change to actually show up, same as ImportDataButton/
 * ResetLineDataButton.
 */
export function loadSandboxSnapshot(id: string): boolean {
  const snapshot = loadSnapshots()[id];
  if (!snapshot) return false;

  const { outside } = partitionBundle(readBundleFromStorage(), SANDBOX_SELECTION);
  const merged = mergeBundles(outside, snapshot.bundle);
  for (const key of keysForSelection(SANDBOX_SELECTION)) {
    safeSetItem(key, JSON.stringify(merged[key] ?? {}));
  }
  safeSetItem(CUSTOM_COLLECTION_CONFIG_KEY, JSON.stringify(snapshot.config));
  setActiveSandboxSnapshotId(id);
  return true;
}

/**
 * Clears the live Sandbox tab back to a blank slate -- no lines or
 * volumes, default appearance, no active snapshot. The library itself is
 * untouched. Same reload requirement as loadSandboxSnapshot.
 */
export function startNewSandbox(): void {
  const { outside } = partitionBundle(readBundleFromStorage(), SANDBOX_SELECTION);
  for (const key of keysForSelection(SANDBOX_SELECTION)) {
    safeSetItem(key, JSON.stringify(outside[key] ?? {}));
  }
  localStorage.removeItem(CUSTOM_COLLECTION_CONFIG_KEY);
  setActiveSandboxSnapshotId(null);
}
