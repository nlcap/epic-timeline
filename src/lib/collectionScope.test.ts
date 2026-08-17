import { describe, expect, it } from "vitest";
import {
  ALL_KINDS,
  ALL_SCOPES,
  countBySlice,
  countRecords,
  fullSelection,
  isFullSelection,
  keysForSelection,
  mergeBundles,
  partitionBundle,
  withReferencedLines,
  type Selection,
  type StoreBundle,
} from "./collectionScope";

// Real seed ids from src/data -- exercising the collection resolution
// against real seed data, not fabricated ids, is the point: a "deleted"
// tombstone and a bare ownership status both carry no collectionId of
// their own, and can only be placed by looking them up in the actual seed
// files.
const ULTIMATE_LINE_ID = "ultimate-spider-man";
const ULTIMATE_VOLUME_ID = "usm-1"; // lineId: ultimate-spider-man
const DC_FINEST_LINE_ID = "batman";
const DC_FINEST_VOLUME_ID = "batman-g1";

const LINE_OVERRIDES = "epic-timeline:line-overrides";
const VOLUME_OVERRIDES = "epic-timeline:volume-overrides";
const OWNERSHIP = "epic-timeline:ownership-overrides";
const READING = "epic-timeline:reading-status-overrides";
const SPEC_LINES = "epic-timeline:speculative-lines";
const SPEC_VOLUMES = "epic-timeline:speculative-volumes";

const sel = (over: Partial<Selection> = {}): Selection => ({
  collectionIds: ["ultimate"],
  scopes: [...ALL_SCOPES],
  kinds: [...ALL_KINDS],
  ...over,
});

describe("keysForSelection", () => {
  it("maps each data kind to just its own main-scope store", () => {
    expect(keysForSelection(sel({ scopes: ["main"], kinds: ["ownership"] }))).toEqual([OWNERSHIP]);
    expect(keysForSelection(sel({ scopes: ["main"], kinds: ["edits"] }))).toEqual([
      LINE_OVERRIDES,
      VOLUME_OVERRIDES,
    ]);
  });

  it("reaches the speculative stores through the same data kinds as main", () => {
    expect(keysForSelection(sel({ scopes: ["speculative"], kinds: ["edits"] }))).toEqual([
      SPEC_LINES,
      SPEC_VOLUMES,
    ]);
    // Notes live only in the speculative volumes store -- no lines, since a
    // line is a container rather than a note.
    expect(keysForSelection(sel({ scopes: ["speculative"], kinds: ["notes"] }))).toEqual([
      SPEC_VOLUMES,
    ]);
  });

  it("names nothing when the selection can't reach any data", () => {
    expect(keysForSelection(sel({ collectionIds: [] }))).toEqual([]);
    expect(keysForSelection(sel({ kinds: [] }))).toEqual([]);
  });
});

describe("partitionBundle", () => {
  it("splits a store by collection, resolving tombstones through the seed data", () => {
    const bundle: StoreBundle = {
      [LINE_OVERRIDES]: { [ULTIMATE_LINE_ID]: "deleted", [DC_FINEST_LINE_ID]: "deleted" },
    };

    const { inside, outside } = partitionBundle(bundle, sel({ collectionIds: ["ultimate"] }));

    expect(inside[LINE_OVERRIDES]).toEqual({ [ULTIMATE_LINE_ID]: "deleted" });
    expect(outside[LINE_OVERRIDES]).toEqual({ [DC_FINEST_LINE_ID]: "deleted" });
  });

  it("scopes volumes and bare status records through their owning line", () => {
    const bundle: StoreBundle = {
      [VOLUME_OVERRIDES]: { [ULTIMATE_VOLUME_ID]: "deleted", [DC_FINEST_VOLUME_ID]: "deleted" },
      [OWNERSHIP]: { [ULTIMATE_VOLUME_ID]: "shelved", [DC_FINEST_VOLUME_ID]: "ordered" },
      [READING]: { [ULTIMATE_VOLUME_ID]: "finished" },
    };

    const { inside, outside } = partitionBundle(bundle, sel({ collectionIds: ["ultimate"] }));

    expect(inside[VOLUME_OVERRIDES]).toEqual({ [ULTIMATE_VOLUME_ID]: "deleted" });
    expect(inside[OWNERSHIP]).toEqual({ [ULTIMATE_VOLUME_ID]: "shelved" });
    expect(inside[READING]).toEqual({ [ULTIMATE_VOLUME_ID]: "finished" });
    expect(outside[OWNERSHIP]).toEqual({ [DC_FINEST_VOLUME_ID]: "ordered" });
  });

  it("leaves stores the data-type axis excludes wholly outside the selection", () => {
    const bundle: StoreBundle = {
      [LINE_OVERRIDES]: { [ULTIMATE_LINE_ID]: "deleted" },
      [OWNERSHIP]: { [ULTIMATE_VOLUME_ID]: "shelved" },
      [READING]: { [ULTIMATE_VOLUME_ID]: "finished" },
    };

    const { inside, outside } = partitionBundle(
      bundle,
      sel({ scopes: ["main"], kinds: ["edits"] })
    );

    expect(inside[LINE_OVERRIDES]).toEqual({ [ULTIMATE_LINE_ID]: "deleted" });
    // Ownership and reading progress weren't asked for, so they aren't in
    // the export half at all -- not merely empty there.
    expect(inside).not.toHaveProperty(OWNERSHIP);
    expect(inside).not.toHaveProperty(READING);
    expect(outside[OWNERSHIP]).toEqual({ [ULTIMATE_VOLUME_ID]: "shelved" });
  });

  it("leaves the other timeline layer alone", () => {
    const bundle: StoreBundle = {
      [LINE_OVERRIDES]: { [ULTIMATE_LINE_ID]: "deleted" },
      [SPEC_LINES]: {
        "ultimate-custom": { id: "ultimate-custom", collectionId: "ultimate", name: "Custom" },
      },
    };

    const { inside, outside } = partitionBundle(bundle, sel({ scopes: ["speculative"] }));

    expect(inside[SPEC_LINES]).toHaveProperty("ultimate-custom");
    expect(inside).not.toHaveProperty(LINE_OVERRIDES);
    expect(outside[LINE_OVERRIDES]).toEqual({ [ULTIMATE_LINE_ID]: "deleted" });
  });

  // The bug this shared resolver exists to fix: a speculative volume is
  // allowed to hang off an *official* line (see allLineIds in App.tsx), and
  // resetLineData used to resolve speculative volumes against the
  // speculative line store alone -- so these were silently missed.
  it("scopes a speculative volume attached to an official line", () => {
    const bundle: StoreBundle = {
      [SPEC_VOLUMES]: {
        "spec-on-official": {
          kind: "volume",
          id: "spec-on-official",
          lineId: ULTIMATE_LINE_ID, // a seeded Ultimate line, not a custom one
        },
        "spec-on-dc": { kind: "volume", id: "spec-on-dc", lineId: DC_FINEST_LINE_ID },
      },
    };

    const { inside, outside } = partitionBundle(bundle, sel({ collectionIds: ["ultimate"] }));

    expect(inside[SPEC_VOLUMES]).toHaveProperty("spec-on-official");
    expect(inside[SPEC_VOLUMES]).not.toHaveProperty("spec-on-dc");
    expect(outside[SPEC_VOLUMES]).toHaveProperty("spec-on-dc");
  });

  // Notes are speculation-only and share the speculative-volumes store with
  // volumes and gaps (see Note in types/index.ts). They carry a lineId like
  // any other entry, so they scope by exactly the same chain -- worth
  // pinning down, since a note is the one entry kind with no main-timeline
  // counterpart to fall back on.
  it("scopes notes alongside speculative volumes, on custom and official lines alike", () => {
    const bundle: StoreBundle = {
      [SPEC_LINES]: {
        "ultimate-custom": { id: "ultimate-custom", collectionId: "ultimate", name: "Custom" },
      },
      [SPEC_VOLUMES]: {
        "spec-vol": { kind: "volume", id: "spec-vol", lineId: "ultimate-custom" },
        "note-on-custom": { kind: "note", id: "note-on-custom", lineId: "ultimate-custom" },
        "note-on-official": { kind: "note", id: "note-on-official", lineId: ULTIMATE_LINE_ID },
        "note-on-dc": { kind: "note", id: "note-on-dc", lineId: DC_FINEST_LINE_ID },
      },
    };

    const { inside, outside } = partitionBundle(bundle, sel({ collectionIds: ["ultimate"] }));

    expect(Object.keys(inside[SPEC_VOLUMES]!).sort()).toEqual([
      "note-on-custom",
      "note-on-official",
      "spec-vol",
    ]);
    expect(outside[SPEC_VOLUMES]).toHaveProperty("note-on-dc");
  });

  // The reason the data-type axis has to be applied per record rather than
  // per store: notes and speculative volumes share one store, so these two
  // selections have to be able to split it between them.
  it("separates notes from speculative volumes within their shared store", () => {
    const bundle: StoreBundle = {
      [SPEC_LINES]: {
        "ultimate-custom": { id: "ultimate-custom", collectionId: "ultimate", name: "Custom" },
      },
      [SPEC_VOLUMES]: {
        "spec-vol": { kind: "volume", id: "spec-vol", lineId: "ultimate-custom" },
        "spec-gap": { kind: "gap", id: "spec-gap", lineId: "ultimate-custom" },
        "spec-note": { kind: "note", id: "spec-note", lineId: "ultimate-custom" },
      },
    };

    const notesOnly = partitionBundle(bundle, sel({ scopes: ["speculative"], kinds: ["notes"] }));
    expect(notesOnly.inside[SPEC_VOLUMES]).toEqual({
      "spec-note": { kind: "note", id: "spec-note", lineId: "ultimate-custom" },
    });
    // The lines store isn't reachable from "notes" at all, so it stays put.
    expect(notesOnly.inside).not.toHaveProperty(SPEC_LINES);
    expect(notesOnly.outside[SPEC_LINES]).toHaveProperty("ultimate-custom");

    const entriesOnly = partitionBundle(bundle, sel({ scopes: ["speculative"], kinds: ["edits"] }));
    expect(Object.keys(entriesOnly.inside[SPEC_VOLUMES]!).sort()).toEqual(["spec-gap", "spec-vol"]);
    expect(entriesOnly.inside[SPEC_LINES]).toHaveProperty("ultimate-custom");
    expect(entriesOnly.outside[SPEC_VOLUMES]).toEqual({
      "spec-note": { kind: "note", id: "spec-note", lineId: "ultimate-custom" },
    });
  });

  it("resolves a record against custom lines defined in the same bundle", () => {
    // Nothing here exists in the seed data -- the volume can only be placed
    // by reading the line out of the bundle itself, which is what makes
    // slicing an uploaded file work.
    const bundle: StoreBundle = {
      [SPEC_LINES]: {
        "custom-line": { id: "custom-line", collectionId: "ultimate", name: "Custom" },
      },
      [SPEC_VOLUMES]: {
        "custom-vol": { kind: "volume", id: "custom-vol", lineId: "custom-line" },
      },
    };

    const { inside } = partitionBundle(bundle, sel({ collectionIds: ["ultimate"] }));

    expect(inside[SPEC_VOLUMES]).toHaveProperty("custom-vol");
  });

  // A notes-only export file holds notes but not the custom speculative
  // lines they hang off, so on its own it can't place them. The local
  // stores, passed as context, supply the missing definitions -- without
  // which exactly the records the user asked to import would be skipped.
  it("falls back to the context bundle for lines the bundle itself doesn't define", () => {
    const file: StoreBundle = {
      [SPEC_VOLUMES]: {
        "note-on-custom": { kind: "note", id: "note-on-custom", lineId: "ultimate-custom" },
      },
    };
    const local: StoreBundle = {
      [SPEC_LINES]: {
        "ultimate-custom": { id: "ultimate-custom", collectionId: "ultimate", name: "Custom" },
      },
    };
    const selection = sel({ collectionIds: ["ultimate"] });

    // Without context the note can't be placed at all...
    expect(partitionBundle(file, selection).inside[SPEC_VOLUMES]).toEqual({});
    expect(countBySlice(file).unresolved).toBe(1);

    // ...and with it, it lands in Ultimate.
    expect(partitionBundle(file, selection, local).inside[SPEC_VOLUMES]).toHaveProperty(
      "note-on-custom"
    );
    expect(countBySlice(file, local).byCollection).toEqual({ ultimate: 1 });
  });

  it("keeps records that resolve to no collection out of a narrowed slice", () => {
    const bundle: StoreBundle = {
      [SPEC_VOLUMES]: { orphan: "deleted" }, // a custom volume added then deleted
    };

    const { inside, outside } = partitionBundle(bundle, sel({ collectionIds: ["ultimate"] }));

    expect(inside[SPEC_VOLUMES]).toEqual({});
    expect(outside[SPEC_VOLUMES]).toEqual({ orphan: "deleted" });
  });

  it("passes the whole bundle through untouched for a full selection, orphans included", () => {
    const bundle: StoreBundle = {
      [LINE_OVERRIDES]: { [ULTIMATE_LINE_ID]: "deleted" },
      [SPEC_VOLUMES]: { orphan: "deleted" },
    };

    const { inside, outside } = partitionBundle(bundle, fullSelection());

    expect(inside).toEqual(bundle);
    expect(outside).toEqual({});
    expect(isFullSelection(fullSelection())).toBe(true);
  });

  it("splits every record into exactly one half", () => {
    const bundle: StoreBundle = {
      [LINE_OVERRIDES]: { [ULTIMATE_LINE_ID]: "deleted", [DC_FINEST_LINE_ID]: "deleted" },
      [OWNERSHIP]: { [ULTIMATE_VOLUME_ID]: "shelved", [DC_FINEST_VOLUME_ID]: "ordered" },
      [SPEC_VOLUMES]: { orphan: "deleted" },
    };
    const selection = sel({ collectionIds: ["ultimate"] });

    const { inside, outside } = partitionBundle(bundle, selection);

    expect(countRecords(inside) + countRecords(outside)).toBe(countRecords(bundle));
    // ...and putting them back together reconstructs the original exactly,
    // which is what makes "replace" (outside + someone else's inside) a
    // safe operation.
    expect(mergeBundles(outside, inside)).toEqual(bundle);
  });
});

describe("withReferencedLines", () => {
  const CUSTOM_LINE = {
    id: "ultimate-custom",
    collectionId: "ultimate",
    name: "Custom",
  };

  it("pulls in the custom line a notes-only slice hangs off", () => {
    const source: StoreBundle = {
      [SPEC_LINES]: { "ultimate-custom": CUSTOM_LINE },
      [SPEC_VOLUMES]: {
        "spec-note": { kind: "note", id: "spec-note", lineId: "ultimate-custom" },
        "spec-vol": { kind: "volume", id: "spec-vol", lineId: "ultimate-custom" },
      },
    };
    const notesOnly = partitionBundle(source, sel({ scopes: ["speculative"], kinds: ["notes"] }));
    expect(notesOnly.inside).not.toHaveProperty(SPEC_LINES);

    const carried = withReferencedLines(notesOnly.inside, source);

    expect(carried[SPEC_LINES]).toEqual({ "ultimate-custom": CUSTOM_LINE });
    // The volume was never selected and must not be dragged along with it.
    expect(Object.keys(carried[SPEC_VOLUMES]!)).toEqual(["spec-note"]);
  });

  it("adds nothing when the entries sit on seeded lines or the slice already has them", () => {
    const onSeedLine: StoreBundle = {
      [SPEC_VOLUMES]: { note: { kind: "note", id: "note", lineId: ULTIMATE_LINE_ID } },
    };
    // A seeded line needs no carrying -- the seed data supplies it.
    expect(withReferencedLines(onSeedLine, onSeedLine)).toEqual(onSeedLine);

    const selfContained: StoreBundle = {
      [SPEC_LINES]: { "ultimate-custom": CUSTOM_LINE },
      [SPEC_VOLUMES]: { note: { kind: "note", id: "note", lineId: "ultimate-custom" } },
    };
    expect(withReferencedLines(selfContained, selfContained)).toEqual(selfContained);
  });

  it("leaves the source untouched, so reset's half of the split is unaffected", () => {
    const source: StoreBundle = {
      [SPEC_LINES]: { "ultimate-custom": CUSTOM_LINE },
      [SPEC_VOLUMES]: { note: { kind: "note", id: "note", lineId: "ultimate-custom" } },
    };
    const { inside, outside } = partitionBundle(
      source,
      sel({ scopes: ["speculative"], kinds: ["notes"] })
    );
    const before = JSON.stringify(outside);

    withReferencedLines(inside, source);

    // The carried line is a copy handed to the caller, not a move out of
    // `outside` -- reset writes `outside` back, and losing the line there
    // would silently delete it.
    expect(JSON.stringify(outside)).toBe(before);
    expect(outside[SPEC_LINES]).toHaveProperty("ultimate-custom");
  });
});

describe("countBySlice", () => {
  it("tallies every axis, counting notes as their own data kind", () => {
    const bundle: StoreBundle = {
      [LINE_OVERRIDES]: { [ULTIMATE_LINE_ID]: "deleted", [DC_FINEST_LINE_ID]: "deleted" },
      [OWNERSHIP]: { [ULTIMATE_VOLUME_ID]: "shelved" },
      [SPEC_LINES]: {
        "ultimate-custom": { id: "ultimate-custom", collectionId: "ultimate", name: "Custom" },
      },
      [SPEC_VOLUMES]: {
        "spec-note": { kind: "note", id: "spec-note", lineId: "ultimate-custom" },
        orphan: "deleted",
      },
    };

    const counts = countBySlice(bundle);

    expect(counts.total).toBe(6);
    expect(counts.byCollection).toEqual({ ultimate: 4, "dc-finest": 1 });
    expect(counts.byScope).toEqual({ main: 3, speculative: 3 });
    // 2 line overrides + 1 speculative line + the untellable tombstone.
    expect(counts.byKind).toEqual({ edits: 4, notes: 1, ownership: 1, reading: 0 });
    expect(counts.unresolved).toBe(1);
  });
});

describe("mergeBundles", () => {
  it("layers the overlay over the base per record, keeping what the overlay doesn't mention", () => {
    const base: StoreBundle = {
      [LINE_OVERRIDES]: { a: "deleted", b: "mine" },
      [OWNERSHIP]: { v: "shelved" },
    };
    const overlay: StoreBundle = { [LINE_OVERRIDES]: { b: "theirs", c: "new" } };

    expect(mergeBundles(base, overlay)).toEqual({
      [LINE_OVERRIDES]: { a: "deleted", b: "theirs", c: "new" },
      [OWNERSHIP]: { v: "shelved" },
    });
  });
});
