import { describe, expect, it } from "vitest";
import type { Line, OwnershipStatus, ReadingStatus, Volume } from "../types";
import {
  filterLines,
  lineMatchesTagFilter,
  matchingLineIds,
  volumeMatchesStatusFilters,
} from "./filters";

function line(id: string, name: string, tags?: string[]): Line {
  return {
    id,
    collectionId: "test",
    name,
    colorHex: "#FF00D9",
    debutDate: { year: 2000, month: 1 },
    ...(tags ? { tags } : {}),
  };
}

function volume(
  id: string,
  lineId: string,
  ownershipStatus: OwnershipStatus,
  readingStatus?: ReadingStatus
): Volume {
  return {
    kind: "volume",
    id,
    lineId,
    number: "1",
    title: id,
    start: { year: 2000, quarter: 1 },
    end: { year: 2001, quarter: 1 },
    issuesCollected: "",
    yearsCovered: "2000",
    creators: "",
    description: "",
    ownershipStatus,
    ...(readingStatus ? { readingStatus } : {}),
  };
}

const NONE_OWNERSHIP: ReadonlySet<OwnershipStatus> = new Set();
const NONE_READING: ReadonlySet<ReadingStatus> = new Set();
const NO_TAGS: ReadonlySet<string> = new Set();
const NO_SPECULATIVE: ReadonlySet<string> = new Set();

describe("volumeMatchesStatusFilters", () => {
  it("passes everything when neither facet has a selection", () => {
    expect(
      volumeMatchesStatusFilters(volume("v", "l", "announced"), NONE_OWNERSHIP, NONE_READING)
    ).toBe(true);
  });

  it("treats multiple values within a facet as OR", () => {
    const shelving: ReadonlySet<OwnershipStatus> = new Set(["ordered", "shelved"]);
    expect(volumeMatchesStatusFilters(volume("v", "l", "shelved"), shelving, NONE_READING)).toBe(
      true
    );
    expect(
      volumeMatchesStatusFilters(volume("v", "l", "announced"), shelving, NONE_READING)
    ).toBe(false);
  });

  it("requires one volume to satisfy shelving AND reading at once", () => {
    const shelving: ReadonlySet<OwnershipStatus> = new Set(["ordered"]);
    const reading: ReadonlySet<ReadingStatus> = new Set(["finished"]);
    expect(volumeMatchesStatusFilters(volume("v", "l", "ordered", "finished"), shelving, reading))
      .toBe(true);
    expect(volumeMatchesStatusFilters(volume("v", "l", "ordered", "reading"), shelving, reading))
      .toBe(false);
    expect(volumeMatchesStatusFilters(volume("v", "l", "shelved", "finished"), shelving, reading))
      .toBe(false);
  });

  it("fails a reading filter on a volume carrying no reading status", () => {
    const reading: ReadonlySet<ReadingStatus> = new Set(["finished"]);
    expect(volumeMatchesStatusFilters(volume("v", "l", "ordered"), NONE_OWNERSHIP, reading)).toBe(
      false
    );
  });
});

describe("lineMatchesTagFilter", () => {
  const tagged = line("l", "Batman", ["Bat Family", "Gotham"]);

  it("any mode needs just one of the checked tags", () => {
    expect(lineMatchesTagFilter(tagged, new Set(["Gotham", "Cosmic"]), "any")).toBe(true);
    expect(lineMatchesTagFilter(tagged, new Set(["Cosmic"]), "any")).toBe(false);
  });

  it("all mode needs every checked tag", () => {
    expect(lineMatchesTagFilter(tagged, new Set(["Bat Family", "Gotham"]), "all")).toBe(true);
    expect(lineMatchesTagFilter(tagged, new Set(["Bat Family", "Cosmic"]), "all")).toBe(false);
  });

  it("never matches an untagged line", () => {
    expect(lineMatchesTagFilter(line("u", "Untagged"), new Set(["Gotham"]), "any")).toBe(false);
    expect(lineMatchesTagFilter(line("u", "Untagged"), new Set(["Gotham"]), "all")).toBe(false);
  });
});

describe("matchingLineIds", () => {
  const lines = [
    line("a", "Alpha", ["Bat Family"]),
    line("b", "Beta", ["Cosmic"]),
    line("c", "Gamma"),
  ];
  const entries = [
    volume("a1", "a", "shelved", "finished"),
    volume("b1", "b", "announced", "not_started"),
    volume("c1", "c", "ordered", "reading"),
  ];

  const base = {
    entries,
    lines,
    shelvingFilter: NONE_OWNERSHIP,
    readingFilter: NONE_READING,
    tagFilter: NO_TAGS,
    filterMode: "any" as const,
    speculativeLineIds: NO_SPECULATIVE,
  };

  it("returns null when no facet is active", () => {
    expect(matchingLineIds(base)).toBeNull();
  });

  it("matches lines by their volumes' shelving status", () => {
    const result = matchingLineIds({ ...base, shelvingFilter: new Set(["shelved", "ordered"]) });
    expect([...result!].sort()).toEqual(["a", "c"]);
  });

  it("ANDs the tag facet with the status facet", () => {
    // "a" passes both; "c" passes shelving but carries no tags.
    const result = matchingLineIds({
      ...base,
      shelvingFilter: new Set(["shelved", "ordered"]),
      tagFilter: new Set(["Bat Family"]),
    });
    expect([...result!]).toEqual(["a"]);
  });

  it("exempts speculative lines from the status facet but not the tag facet", () => {
    const speculative = line("s", "Spec", ["Cosmic"]);
    const withSpec = { ...base, lines: [...lines, speculative], speculativeLineIds: new Set(["s"]) };

    // Status only: the speculative line survives despite having no official
    // volume to match on -- this is the regression that hid the whole
    // Speculation Mode layer behind any status filter.
    const statusOnly = matchingLineIds({ ...withSpec, shelvingFilter: new Set(["shelved"]) });
    expect([...statusOnly!].sort()).toEqual(["a", "s"]);

    // Tags still apply to it normally.
    const withTag = matchingLineIds({
      ...withSpec,
      shelvingFilter: new Set(["shelved"]),
      tagFilter: new Set(["Bat Family"]),
    });
    expect([...withTag!]).toEqual(["a"]);
  });
});

describe("filterLines", () => {
  const lines = [line("a", "Ultimate Spider-Man"), line("b", "Ultimate X-Men"), line("c", "Thor")];

  it("returns the same array reference when nothing filters", () => {
    expect(filterLines(lines, "", null)).toBe(lines);
    expect(filterLines(lines, "   ", null)).toBe(lines);
  });

  it("matches the search query case-insensitively anywhere in the title", () => {
    expect(filterLines(lines, "ULTIMATE", null).map((l) => l.id)).toEqual(["a", "b"]);
    expect(filterLines(lines, "x-men", null).map((l) => l.id)).toEqual(["b"]);
  });

  it("intersects the search query with the facet-matched ids", () => {
    expect(filterLines(lines, "ultimate", new Set(["b", "c"])).map((l) => l.id)).toEqual(["b"]);
  });
});
