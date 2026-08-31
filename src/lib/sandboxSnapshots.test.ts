import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteSandboxSnapshot,
  getActiveSandboxSnapshotId,
  listSandboxSnapshots,
  loadSandboxSnapshot,
  saveSandboxSnapshot,
  startNewSandbox,
} from "./sandboxSnapshots";

// Same minimal in-memory Storage as resetLineData.test.ts -- no jsdom
// dependency needed just for real localStorage.getItem/setItem calls.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  key(index: number) {
    return [...this.store.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

const SNAPSHOTS_KEY = "epic-timeline:sandbox-snapshots";
const CONFIG_KEY = "epic-timeline:custom-collection-config";
const LINE_OVERRIDES_KEY = "epic-timeline:line-overrides";
const VOLUME_OVERRIDES_KEY = "epic-timeline:volume-overrides";
const OWNERSHIP_KEY = "epic-timeline:ownership-overrides";

// The Sandbox tab has no seed data, ever -- every line/volume there is
// user-created and carries its collectionId/lineId directly on the record
// (see createResolver in collectionScope.ts), so fabricated records with
// those fields set resolve correctly with no need for real seed ids.
const SANDBOX_LINE_ID = "custom-line-1";
const SANDBOX_VOLUME_ID = "custom-vol-1";
// Real Ultimate seed ids (see resetLineData.test.ts) -- used to prove a
// sandbox-scoped operation leaves other collections' data alone.
const OTHER_LINE_ID = "ultimate-spider-man";
const OTHER_VOLUME_ID = "usm-1"; // lineId: ultimate-spider-man

let storage: MemoryStorage;

beforeEach(() => {
  storage = new MemoryStorage();
  vi.stubGlobal("localStorage", storage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** A sandbox line, a volume hanging off it, and that volume's ownership
 * status -- plus one Ultimate seed line/volume, so every test can check the
 * sandbox-only slice actually stays sandbox-only. */
function seedSandboxContent() {
  storage.setItem(
    LINE_OVERRIDES_KEY,
    JSON.stringify({
      [SANDBOX_LINE_ID]: { id: SANDBOX_LINE_ID, collectionId: "custom", name: "My Heroes" },
      [OTHER_LINE_ID]: "deleted",
    })
  );
  storage.setItem(
    VOLUME_OVERRIDES_KEY,
    JSON.stringify({
      [SANDBOX_VOLUME_ID]: { id: SANDBOX_VOLUME_ID, lineId: SANDBOX_LINE_ID, title: "Vol 1" },
    })
  );
  storage.setItem(
    OWNERSHIP_KEY,
    JSON.stringify({ [SANDBOX_VOLUME_ID]: "shelved", [OTHER_VOLUME_ID]: "ordered" })
  );
  storage.setItem(CONFIG_KEY, JSON.stringify({ title: "My Custom Timeline" }));
}

describe("saveSandboxSnapshot", () => {
  it("captures the sandbox's current records (line, volume, and status alike) and the given config under a new id, and marks it active", () => {
    seedSandboxContent();

    const saved = saveSandboxSnapshot("First Save", { title: "First Save Title" });

    expect(saved.name).toBe("First Save");
    expect(saved.config).toEqual({ title: "First Save Title" });
    expect(saved.bundle[LINE_OVERRIDES_KEY]).toEqual({
      [SANDBOX_LINE_ID]: { id: SANDBOX_LINE_ID, collectionId: "custom", name: "My Heroes" },
    });
    expect(saved.bundle[VOLUME_OVERRIDES_KEY]).toEqual({
      [SANDBOX_VOLUME_ID]: { id: SANDBOX_VOLUME_ID, lineId: SANDBOX_LINE_ID, title: "Vol 1" },
    });
    expect(saved.bundle[OWNERSHIP_KEY]).toEqual({ [SANDBOX_VOLUME_ID]: "shelved" });
    // The Ultimate line/volume aren't part of the sandbox's own slice.
    expect(saved.bundle[LINE_OVERRIDES_KEY]).not.toHaveProperty(OTHER_LINE_ID);
    expect(saved.bundle[OWNERSHIP_KEY]).not.toHaveProperty(OTHER_VOLUME_ID);

    expect(getActiveSandboxSnapshotId()).toBe(saved.id);
    expect(listSandboxSnapshots().map((s) => s.id)).toEqual([saved.id]);
  });

  it("creates a config-only snapshot when the sandbox has no lines yet", () => {
    storage.setItem(CONFIG_KEY, JSON.stringify({ title: "Just Branding" }));

    const saved = saveSandboxSnapshot("Empty Sandbox", { title: "Just Branding" });

    expect(saved.bundle).toEqual({});
    expect(saved.config).toEqual({ title: "Just Branding" });
  });

  it("overwrites the same entry in place when passed its own id, rather than creating a second one", () => {
    seedSandboxContent();
    const first = saveSandboxSnapshot("Draft", { title: "Draft" });

    storage.setItem(
      LINE_OVERRIDES_KEY,
      JSON.stringify({
        [SANDBOX_LINE_ID]: { id: SANDBOX_LINE_ID, collectionId: "custom", name: "Renamed" },
      })
    );
    const second = saveSandboxSnapshot("Draft v2", { title: "Draft v2" }, first.id);

    expect(second.id).toBe(first.id);
    const all = listSandboxSnapshots();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe("Draft v2");
    expect(all[0].bundle[LINE_OVERRIDES_KEY]).toEqual({
      [SANDBOX_LINE_ID]: { id: SANDBOX_LINE_ID, collectionId: "custom", name: "Renamed" },
    });
  });
});

describe("listSandboxSnapshots", () => {
  it("returns newest-saved first", () => {
    seedSandboxContent();
    const older = saveSandboxSnapshot("Older", {});
    const newer = saveSandboxSnapshot("Newer", {});

    // Force the timestamps apart rather than trusting real clock ticks
    // between two calls that can run within the same millisecond.
    const snapshots = JSON.parse(storage.getItem(SNAPSHOTS_KEY)!);
    snapshots[older.id].savedAt = "2020-01-01T00:00:00.000Z";
    snapshots[newer.id].savedAt = "2024-01-01T00:00:00.000Z";
    storage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));

    expect(listSandboxSnapshots().map((s) => s.name)).toEqual(["Newer", "Older"]);
  });
});

describe("loadSandboxSnapshot", () => {
  it("replaces the sandbox's records and config with the snapshot's, leaving other collections untouched", () => {
    seedSandboxContent();
    const saved = saveSandboxSnapshot("Saved State", { title: "Saved State" });

    // Diverge live sandbox state from what was saved.
    storage.setItem(
      LINE_OVERRIDES_KEY,
      JSON.stringify({
        [SANDBOX_LINE_ID]: {
          id: SANDBOX_LINE_ID,
          collectionId: "custom",
          name: "Changed since save",
        },
        [OTHER_LINE_ID]: "deleted",
      })
    );
    storage.setItem(OWNERSHIP_KEY, JSON.stringify({ [SANDBOX_VOLUME_ID]: "wishlist" }));
    storage.setItem(CONFIG_KEY, JSON.stringify({ title: "Changed since save" }));

    const ok = loadSandboxSnapshot(saved.id);

    expect(ok).toBe(true);
    const lineOverrides = JSON.parse(storage.getItem(LINE_OVERRIDES_KEY)!);
    expect(lineOverrides[SANDBOX_LINE_ID]).toEqual({
      id: SANDBOX_LINE_ID,
      collectionId: "custom",
      name: "My Heroes",
    });
    // The other collection's tombstone survives -- load only replaces the
    // Sandbox tab's own slice.
    expect(lineOverrides).toHaveProperty(OTHER_LINE_ID);

    expect(JSON.parse(storage.getItem(OWNERSHIP_KEY)!)).toEqual({
      [SANDBOX_VOLUME_ID]: "shelved",
    });
    expect(JSON.parse(storage.getItem(CONFIG_KEY)!)).toEqual({ title: "Saved State" });
    expect(getActiveSandboxSnapshotId()).toBe(saved.id);
  });

  it("returns false and writes nothing for an id that isn't in the library", () => {
    seedSandboxContent();
    const before = storage.getItem(LINE_OVERRIDES_KEY);

    const ok = loadSandboxSnapshot("not-a-real-id");

    expect(ok).toBe(false);
    expect(storage.getItem(LINE_OVERRIDES_KEY)).toBe(before);
    expect(getActiveSandboxSnapshotId()).toBeNull();
  });
});

describe("startNewSandbox", () => {
  it("clears the sandbox's own records and config, leaving other collections and the saved library untouched", () => {
    seedSandboxContent();
    const saved = saveSandboxSnapshot("Will stay saved", { title: "Will stay saved" });

    startNewSandbox();

    const lineOverrides = JSON.parse(storage.getItem(LINE_OVERRIDES_KEY)!);
    expect(lineOverrides).not.toHaveProperty(SANDBOX_LINE_ID);
    expect(lineOverrides).toHaveProperty(OTHER_LINE_ID);

    const ownership = JSON.parse(storage.getItem(OWNERSHIP_KEY)!);
    expect(ownership).not.toHaveProperty(SANDBOX_VOLUME_ID);
    expect(ownership).toHaveProperty(OTHER_VOLUME_ID);

    expect(storage.getItem(CONFIG_KEY)).toBeNull();
    expect(getActiveSandboxSnapshotId()).toBeNull();

    // Only the live tab was cleared -- the library itself is separate.
    expect(listSandboxSnapshots().map((s) => s.id)).toEqual([saved.id]);
  });
});

describe("deleteSandboxSnapshot", () => {
  it("removes the entry from the library without touching the live sandbox content", () => {
    seedSandboxContent();
    const saved = saveSandboxSnapshot("To Delete", { title: "To Delete" });
    const liveLinesBefore = storage.getItem(LINE_OVERRIDES_KEY);

    deleteSandboxSnapshot(saved.id);

    expect(listSandboxSnapshots()).toEqual([]);
    expect(storage.getItem(LINE_OVERRIDES_KEY)).toBe(liveLinesBefore);
  });

  it("clears the active pointer only when the deleted snapshot was the active one", () => {
    seedSandboxContent();
    const first = saveSandboxSnapshot("First", {});
    const second = saveSandboxSnapshot("Second", {});
    expect(getActiveSandboxSnapshotId()).toBe(second.id);

    deleteSandboxSnapshot(first.id);
    expect(getActiveSandboxSnapshotId()).toBe(second.id);

    deleteSandboxSnapshot(second.id);
    expect(getActiveSandboxSnapshotId()).toBeNull();
  });
});
