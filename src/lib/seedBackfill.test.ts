import { describe, expect, it } from "vitest";
import { backfillFromSeed } from "./seedBackfill";
import { DC_FINEST_ENTRIES } from "../data/dc-finest";
import type { TimelineEntry } from "../types";

type Volume = Extract<TimelineEntry, { kind: "volume" }>;

/** The volume that surfaced this: eight writers in the seed, none in a
 * snapshot taken before the credit research landed. */
const SEED = DC_FINEST_ENTRIES.find(
  (e): e is Volume => e.kind === "volume" && e.title === "Zen and Violence"
)!;

/** A snapshot of SEED as the form would have saved it before credits existed:
 * `writers`/`pencillers`/`inkers` dropped by JSON, everything else intact. */
function staleSnapshot(overrides: Partial<Volume> = {}): Volume {
  const copy = { ...SEED, ...overrides };
  delete (copy as Partial<Volume>).writers;
  delete (copy as Partial<Volume>).pencillers;
  delete (copy as Partial<Volume>).inkers;
  return copy;
}

describe("backfillFromSeed", () => {
  it("restores credits the seed gained after the snapshot was taken", async () => {
    const { changed, next } = await backfillFromSeed({ [SEED.id]: staleSnapshot() });
    const repaired = next[SEED.id] as Volume;
    expect(changed).toBe(true);
    expect(repaired.writers).toBe(SEED.writers);
    expect(repaired.pencillers).toBe(SEED.pencillers);
    expect(repaired.inkers).toBe(SEED.inkers);
  });

  it("keeps the user's own edits while filling the gaps", async () => {
    const edited = staleSnapshot({ title: "My title", issuesCollected: "My issues" });
    const { next } = await backfillFromSeed({ [SEED.id]: edited });
    const repaired = next[SEED.id] as Volume;
    expect(repaired.title).toBe("My title");
    expect(repaired.issuesCollected).toBe("My issues");
    expect(repaired.writers).toBe(SEED.writers);
  });

  it("never overwrites a field the snapshot already has", async () => {
    const mine = { ...SEED, writers: "Someone Else" };
    const { next } = await backfillFromSeed({ [SEED.id]: mine });
    expect((next[SEED.id] as Volume).writers).toBe("Someone Else");
  });

  it("moves a pre-split `artists` credit into pencillers", async () => {
    const legacy = { ...staleSnapshot(), artists: "Steve Ditko, Denys Cowan" };
    const { next } = await backfillFromSeed({ [SEED.id]: legacy });
    const repaired = next[SEED.id] as Volume & { artists?: string };
    expect(repaired.pencillers).toBe("Steve Ditko, Denys Cowan");
    expect(repaired.artists).toBeUndefined();
  });

  it("leaves a user-created volume alone -- it has no seed to backfill from", async () => {
    const mine = { ...staleSnapshot(), id: "my-own-volume" };
    const { changed, next } = await backfillFromSeed({ "my-own-volume": mine });
    expect(changed).toBe(false);
    expect(next["my-own-volume"]).toEqual(mine);
  });

  it("leaves tombstones alone", async () => {
    const { changed, next } = await backfillFromSeed({ [SEED.id]: "deleted" });
    expect(changed).toBe(false);
    expect(next[SEED.id]).toBe("deleted");
  });

  it("reports no change when every snapshot is already current", async () => {
    const { changed } = await backfillFromSeed({ [SEED.id]: { ...SEED } });
    expect(changed).toBe(false);
  });
});
