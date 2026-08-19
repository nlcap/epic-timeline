import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetLineData } from "./resetLineData";

// Minimal in-memory Storage so resetLineData's real localStorage.getItem/
// setItem calls have something to read/write -- no jsdom dependency needed
// just for this.
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

// Real seed ids from src/data (see e.g. "ultimate-spider-man" in
// ultimate-era.ts) -- exercising resetLineData against real seed data,
// not fabricated ids, is the point: the collection/line resolution for a
// tombstone entry only works by looking these up in the actual seed files.
const ULTIMATE_LINE_ID = "ultimate-spider-man";
const ULTIMATE_VOLUME_ID = "usm-1"; // lineId: ultimate-spider-man
const DC_FINEST_LINE_ID = "batman";

let storage: MemoryStorage;

beforeEach(() => {
  storage = new MemoryStorage();
  vi.stubGlobal("localStorage", storage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("resetLineData", () => {
  it("clears main-scope overrides for the targeted collection only, leaving other collections and speculative data untouched", () => {
    storage.setItem(
      "epic-timeline:line-overrides",
      JSON.stringify({
        [ULTIMATE_LINE_ID]: "deleted",
        [DC_FINEST_LINE_ID]: "deleted",
      })
    );
    storage.setItem(
      "epic-timeline:volume-overrides",
      JSON.stringify({ [ULTIMATE_VOLUME_ID]: "deleted" })
    );
    storage.setItem(
      "epic-timeline:ownership-overrides",
      JSON.stringify({ [ULTIMATE_VOLUME_ID]: "shelved" })
    );
    storage.setItem(
      "epic-timeline:speculative-lines",
      JSON.stringify({
        "ultimate-my-custom": { id: "ultimate-my-custom", collectionId: "ultimate", name: "Custom" },
      })
    );

    resetLineData({ collectionIds: ["ultimate"], scopes: ["main"] });

    const lineOverrides = JSON.parse(storage.getItem("epic-timeline:line-overrides")!);
    expect(lineOverrides).not.toHaveProperty(ULTIMATE_LINE_ID);
    expect(lineOverrides).toHaveProperty(DC_FINEST_LINE_ID);

    const volumeOverrides = JSON.parse(storage.getItem("epic-timeline:volume-overrides")!);
    expect(volumeOverrides).not.toHaveProperty(ULTIMATE_VOLUME_ID);

    const ownershipOverrides = JSON.parse(storage.getItem("epic-timeline:ownership-overrides")!);
    expect(ownershipOverrides).not.toHaveProperty(ULTIMATE_VOLUME_ID);

    // scopes: ["main"] -- speculative data for the same collection must
    // survive untouched.
    const speculativeLines = JSON.parse(storage.getItem("epic-timeline:speculative-lines")!);
    expect(speculativeLines).toHaveProperty("ultimate-my-custom");
  });

  it("clears speculative-scope data for the targeted collection only, leaving main-scope overrides untouched", () => {
    storage.setItem(
      "epic-timeline:line-overrides",
      JSON.stringify({ [ULTIMATE_LINE_ID]: "deleted" })
    );
    storage.setItem(
      "epic-timeline:speculative-lines",
      JSON.stringify({
        "ultimate-my-custom": { id: "ultimate-my-custom", collectionId: "ultimate", name: "Custom" },
        "dc-finest-my-custom": { id: "dc-finest-my-custom", collectionId: "dc-finest", name: "Custom" },
      })
    );
    storage.setItem(
      "epic-timeline:speculative-volumes",
      JSON.stringify({
        "spec-vol": { kind: "volume", id: "spec-vol", lineId: "ultimate-my-custom" },
      })
    );

    resetLineData({ collectionIds: ["ultimate"], scopes: ["speculative"] });

    const speculativeLines = JSON.parse(storage.getItem("epic-timeline:speculative-lines")!);
    expect(speculativeLines).not.toHaveProperty("ultimate-my-custom");
    expect(speculativeLines).toHaveProperty("dc-finest-my-custom");

    const speculativeVolumes = JSON.parse(storage.getItem("epic-timeline:speculative-volumes")!);
    expect(speculativeVolumes).not.toHaveProperty("spec-vol");

    // scopes: ["speculative"] -- main-scope overrides for the same
    // collection must survive untouched.
    const lineOverrides = JSON.parse(storage.getItem("epic-timeline:line-overrides")!);
    expect(lineOverrides).toHaveProperty(ULTIMATE_LINE_ID);
  });

  it("resets both scopes at once when both are requested", () => {
    storage.setItem(
      "epic-timeline:line-overrides",
      JSON.stringify({ [ULTIMATE_LINE_ID]: "deleted" })
    );
    storage.setItem(
      "epic-timeline:speculative-lines",
      JSON.stringify({
        "ultimate-my-custom": { id: "ultimate-my-custom", collectionId: "ultimate", name: "Custom" },
      })
    );

    resetLineData({ collectionIds: ["ultimate"], scopes: ["main", "speculative"] });

    expect(JSON.parse(storage.getItem("epic-timeline:line-overrides")!)).not.toHaveProperty(
      ULTIMATE_LINE_ID
    );
    expect(JSON.parse(storage.getItem("epic-timeline:speculative-lines")!)).not.toHaveProperty(
      "ultimate-my-custom"
    );
  });

  // Ownership and reading status are the same volumeId -> status shape and
  // now go through one shared helper (resetStatusStore), so this pins down
  // that both are actually scoped -- reading status was added later and had
  // no coverage of its own.
  it("clears ownership and reading status alike, for targeted lines only", () => {
    const OTHER_COLLECTION_VOLUME_ID = "batman-g1"; // a DC Finest seed volume
    storage.setItem(
      "epic-timeline:ownership-overrides",
      JSON.stringify({
        [ULTIMATE_VOLUME_ID]: "shelved",
        [OTHER_COLLECTION_VOLUME_ID]: "ordered",
      })
    );
    storage.setItem(
      "epic-timeline:reading-status-overrides",
      JSON.stringify({
        [ULTIMATE_VOLUME_ID]: "finished",
        [OTHER_COLLECTION_VOLUME_ID]: "reading",
      })
    );

    resetLineData({ collectionIds: ["ultimate"], scopes: ["main"] });

    const ownership = JSON.parse(storage.getItem("epic-timeline:ownership-overrides")!);
    expect(ownership).not.toHaveProperty(ULTIMATE_VOLUME_ID);
    expect(ownership).toHaveProperty(OTHER_COLLECTION_VOLUME_ID);

    const reading = JSON.parse(storage.getItem("epic-timeline:reading-status-overrides")!);
    expect(reading).not.toHaveProperty(ULTIMATE_VOLUME_ID);
    expect(reading).toHaveProperty(OTHER_COLLECTION_VOLUME_ID);
  });

  it("is a no-op for stores that don't exist in localStorage yet", () => {
    expect(() => resetLineData({ collectionIds: ["ultimate"], scopes: ["main", "speculative"] })).not.toThrow();
  });

  // The reset dialog's "what to reset" choice narrows kinds to just one
  // bucket at a time -- these two pin down that narrowing actually keeps
  // the other bucket's data untouched, which is the whole point of it.
  it("resetting kinds: ['edits'] clears line/volume overrides but leaves ownership and reading status alone", () => {
    storage.setItem(
      "epic-timeline:line-overrides",
      JSON.stringify({ [ULTIMATE_LINE_ID]: "deleted" })
    );
    storage.setItem(
      "epic-timeline:volume-overrides",
      JSON.stringify({ [ULTIMATE_VOLUME_ID]: "deleted" })
    );
    storage.setItem(
      "epic-timeline:ownership-overrides",
      JSON.stringify({ [ULTIMATE_VOLUME_ID]: "shelved" })
    );
    storage.setItem(
      "epic-timeline:reading-status-overrides",
      JSON.stringify({ [ULTIMATE_VOLUME_ID]: "finished" })
    );

    resetLineData({ collectionIds: ["ultimate"], scopes: ["main"], kinds: ["edits"] });

    expect(
      JSON.parse(storage.getItem("epic-timeline:line-overrides")!)
    ).not.toHaveProperty(ULTIMATE_LINE_ID);
    expect(
      JSON.parse(storage.getItem("epic-timeline:volume-overrides")!)
    ).not.toHaveProperty(ULTIMATE_VOLUME_ID);
    expect(
      JSON.parse(storage.getItem("epic-timeline:ownership-overrides")!)
    ).toHaveProperty(ULTIMATE_VOLUME_ID);
    expect(
      JSON.parse(storage.getItem("epic-timeline:reading-status-overrides")!)
    ).toHaveProperty(ULTIMATE_VOLUME_ID);
  });

  it("resetting kinds: ['ownership', 'reading'] clears shelving/reading status but leaves line/volume overrides alone", () => {
    storage.setItem(
      "epic-timeline:line-overrides",
      JSON.stringify({ [ULTIMATE_LINE_ID]: "deleted" })
    );
    storage.setItem(
      "epic-timeline:volume-overrides",
      JSON.stringify({ [ULTIMATE_VOLUME_ID]: "deleted" })
    );
    storage.setItem(
      "epic-timeline:ownership-overrides",
      JSON.stringify({ [ULTIMATE_VOLUME_ID]: "shelved" })
    );
    storage.setItem(
      "epic-timeline:reading-status-overrides",
      JSON.stringify({ [ULTIMATE_VOLUME_ID]: "finished" })
    );

    resetLineData({
      collectionIds: ["ultimate"],
      scopes: ["main"],
      kinds: ["ownership", "reading"],
    });

    expect(
      JSON.parse(storage.getItem("epic-timeline:ownership-overrides")!)
    ).not.toHaveProperty(ULTIMATE_VOLUME_ID);
    expect(
      JSON.parse(storage.getItem("epic-timeline:reading-status-overrides")!)
    ).not.toHaveProperty(ULTIMATE_VOLUME_ID);
    expect(
      JSON.parse(storage.getItem("epic-timeline:line-overrides")!)
    ).toHaveProperty(ULTIMATE_LINE_ID);
    expect(
      JSON.parse(storage.getItem("epic-timeline:volume-overrides")!)
    ).toHaveProperty(ULTIMATE_VOLUME_ID);
  });

  it("defaults kinds to every kind when the caller doesn't specify one, matching the old wholesale-reset behavior", () => {
    storage.setItem(
      "epic-timeline:line-overrides",
      JSON.stringify({ [ULTIMATE_LINE_ID]: "deleted" })
    );
    storage.setItem(
      "epic-timeline:ownership-overrides",
      JSON.stringify({ [ULTIMATE_VOLUME_ID]: "shelved" })
    );

    resetLineData({ collectionIds: ["ultimate"], scopes: ["main"] });

    expect(
      JSON.parse(storage.getItem("epic-timeline:line-overrides")!)
    ).not.toHaveProperty(ULTIMATE_LINE_ID);
    expect(
      JSON.parse(storage.getItem("epic-timeline:ownership-overrides")!)
    ).not.toHaveProperty(ULTIMATE_VOLUME_ID);
  });
});
