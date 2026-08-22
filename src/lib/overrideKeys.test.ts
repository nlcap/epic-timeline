import { describe, expect, it } from "vitest";
import { EXPORT_KEYS, OVERRIDE_KEYS, SPECULATIVE_KEYS, STORAGE_KEYS } from "./overrideKeys";

/**
 * Pins the persistence contract. These exact strings key data already
 * sitting in returning visitors' browsers, so a rename doesn't fail
 * loudly -- it silently orphans real records (edits, shelving, reading
 * progress, whole speculative timelines). Spelling them out a second time
 * here is the point: it's the assertion that the values didn't move, so
 * the indirection through STORAGE_KEYS can be refactored freely without
 * anyone having to remember what the strings used to be.
 */
describe("storage keys", () => {
  it("resolve to the literals real stored data is keyed by", () => {
    expect(STORAGE_KEYS).toEqual({
      lineOverrides: "epic-timeline:line-overrides",
      volumeOverrides: "epic-timeline:volume-overrides",
      ownershipOverrides: "epic-timeline:ownership-overrides",
      readingStatusOverrides: "epic-timeline:reading-status-overrides",
      speculativeLines: "epic-timeline:speculative-lines",
      speculativeVolumes: "epic-timeline:speculative-volumes",
    });
  });

  it("groups them into the bundles export/import/reset iterate", () => {
    expect([...OVERRIDE_KEYS]).toEqual([
      "epic-timeline:line-overrides",
      "epic-timeline:volume-overrides",
      "epic-timeline:ownership-overrides",
      "epic-timeline:reading-status-overrides",
    ]);
    expect([...SPECULATIVE_KEYS]).toEqual([
      "epic-timeline:speculative-lines",
      "epic-timeline:speculative-volumes",
    ]);
    expect([...EXPORT_KEYS]).toEqual([...OVERRIDE_KEYS, ...SPECULATIVE_KEYS]);
  });

  it("covers every store exactly once, with no duplicates", () => {
    expect(new Set(EXPORT_KEYS).size).toBe(EXPORT_KEYS.length);
    expect([...EXPORT_KEYS].sort()).toEqual(Object.values(STORAGE_KEYS).sort());
  });
});
