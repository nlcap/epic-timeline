import { describe, expect, it } from "vitest";
import { fieldChanged, hasChanges } from "./dirty";

describe("fieldChanged", () => {
  it("treats equal primitives as unchanged", () => {
    expect(fieldChanged("Batman", "Batman")).toBe(false);
    expect(fieldChanged(3, 3)).toBe(false);
    expect(fieldChanged(false, false)).toBe(false);
    expect(fieldChanged(undefined, undefined)).toBe(false);
  });

  it("catches an edited primitive", () => {
    expect(fieldChanged("Batman", "Batgirl")).toBe(true);
    expect(fieldChanged("1985", "")).toBe(true);
    // A cleared optional field: the form writes undefined, the snapshot
    // held a value.
    expect(fieldChanged(undefined, "Jack Kirby")).toBe(true);
  });

  it("compares objects and arrays by value, not identity", () => {
    // The whole reason this isn't a bare !== : tags and the per-era icon
    // map are rebuilt on every render, so identity always differs.
    expect(fieldChanged(["a", "b"], ["a", "b"])).toBe(false);
    expect(fieldChanged({ golden: "x" }, { golden: "x" })).toBe(false);
    expect(fieldChanged([], [])).toBe(false);
  });

  it("catches a real edit inside an object or array", () => {
    expect(fieldChanged(["a", "b"], ["a"])).toBe(true);
    expect(fieldChanged({ golden: "x" }, { golden: "y" })).toBe(true);
    expect(fieldChanged([{ id: "1" }], [{ id: "2" }])).toBe(true);
  });

  it("counts a change of kind as a change", () => {
    // Only one side is an object, so there's nothing to compare by value.
    expect(fieldChanged([], undefined)).toBe(true);
    expect(fieldChanged(undefined, [])).toBe(true);
    expect(fieldChanged({}, "")).toBe(true);
  });

  it("treats null as its own value rather than an object", () => {
    expect(fieldChanged(null, null)).toBe(false);
    expect(fieldChanged(null, {})).toBe(true);
    expect(fieldChanged({}, null)).toBe(true);
  });
});

describe("hasChanges", () => {
  const initial = {
    title: "The Galactus Trilogy",
    number: "4",
    swimLanePosition: undefined,
    tags: ["cosmic"],
  };

  it("is false for an untouched form", () => {
    expect(hasChanges({ ...initial }, initial)).toBe(false);
  });

  it("is false when only an array's identity changed", () => {
    expect(hasChanges({ ...initial, tags: ["cosmic"] }, initial)).toBe(false);
  });

  it("is true as soon as any one field moves", () => {
    expect(hasChanges({ ...initial, title: "The Coming of Galactus" }, initial)).toBe(true);
    expect(hasChanges({ ...initial, swimLanePosition: 2 }, initial)).toBe(true);
    expect(hasChanges({ ...initial, tags: ["cosmic", "kirby"] }, initial)).toBe(true);
  });

  it("is false for an empty field set", () => {
    expect(hasChanges({}, {})).toBe(false);
  });
});
