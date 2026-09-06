import { describe, expect, it } from "vitest";
import { buildExportPayload } from "./exportPayload";
import { fullSelection, type Selection, type StoreBundle } from "./collectionScope";

// Real seed ids (see resetLineData.test.ts) -- the collection each record
// belongs to is resolved through the actual seed data, so fabricated ids
// wouldn't scope correctly.
const ULTIMATE_LINE_ID = "ultimate-spider-man";
const ULTIMATE_VOLUME_ID = "usm-1"; // lineId: ultimate-spider-man
const DC_LINE_ID = "batman";

const LINE_OVERRIDES = "epic-timeline:line-overrides";
const VOLUME_OVERRIDES = "epic-timeline:volume-overrides";
const OWNERSHIP = "epic-timeline:ownership-overrides";
const RATING = "epic-timeline:rating-overrides";
const SPECULATIVE_LINES = "epic-timeline:speculative-lines";

/** One edit and one personal-status record on Ultimate, plus an edit on a
 * second collection and a speculative line -- so a slice can be checked for
 * what it leaves behind as well as what it takes. */
const BUNDLE: StoreBundle = {
  [LINE_OVERRIDES]: {
    [ULTIMATE_LINE_ID]: { id: ULTIMATE_LINE_ID, name: "Renamed by hand" },
    [DC_LINE_ID]: { id: DC_LINE_ID, name: "A DC edit" },
  },
  [VOLUME_OVERRIDES]: {
    [ULTIMATE_VOLUME_ID]: { id: ULTIMATE_VOLUME_ID, title: "Corrected title" },
  },
  [OWNERSHIP]: { [ULTIMATE_VOLUME_ID]: "shelved" },
  [RATING]: { [ULTIMATE_VOLUME_ID]: 4 },
  [SPECULATIVE_LINES]: {
    "ultimate-what-if": { id: "ultimate-what-if", collectionId: "ultimate", name: "What if" },
  },
};

/** The slice CopyCorrectionsButton pins -- see correctionsSelection there. */
const corrections: Selection = {
  collectionIds: ["ultimate"],
  parts: ["edits"],
};

describe("buildExportPayload", () => {
  it("carries only the named collection's line and volume edits for a corrections slice", () => {
    const { payload, recordCount } = buildExportPayload(BUNDLE, corrections);

    expect(payload[LINE_OVERRIDES]).toEqual({
      [ULTIMATE_LINE_ID]: { id: ULTIMATE_LINE_ID, name: "Renamed by hand" },
    });
    expect(payload[VOLUME_OVERRIDES]).toEqual({
      [ULTIMATE_VOLUME_ID]: { id: ULTIMATE_VOLUME_ID, title: "Corrected title" },
    });
    expect(recordCount).toBe(2);
  });

  it("leaves personal status and speculation out of a corrections slice, since neither belongs in shipped seed data", () => {
    const { payload } = buildExportPayload(BUNDLE, corrections);

    expect(payload).not.toHaveProperty(OWNERSHIP);
    expect(payload).not.toHaveProperty(RATING);
    expect(payload).not.toHaveProperty(SPECULATIVE_LINES);
  });

  it("leaves other collections out of a corrections slice", () => {
    const { payload } = buildExportPayload(BUNDLE, corrections);

    expect(payload[LINE_OVERRIDES]).not.toHaveProperty(DC_LINE_ID);
  });

  it("names the slice in the meta block, so the import picker can pre-select what the file covers", () => {
    const { payload } = buildExportPayload(BUNDLE, corrections);

    expect(payload.__meta).toMatchObject({
      version: 1,
      collections: ["ultimate"],
      parts: ["edits"],
    });
  });

  it("keeps every store for a full selection, so a whole backup round-trips exactly", () => {
    const { payload, recordCount } = buildExportPayload(BUNDLE, fullSelection());

    for (const key of [LINE_OVERRIDES, VOLUME_OVERRIDES, OWNERSHIP, RATING, SPECULATIVE_LINES]) {
      expect(payload).toHaveProperty(key);
    }
    expect(recordCount).toBe(6);
  });
});
