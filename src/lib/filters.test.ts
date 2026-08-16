import { describe, expect, it } from "vitest";
import type { Line, OwnershipStatus, ReadingStatus, Volume } from "../types";
import {
  filterLines,
  lineMatchesTagFilter,
  matchingLineIds,
  searchMatches,
  volumeMatchesSearch,
  volumeMatchesStatusFilters,
  volumeVisibleUnderSearch,
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

/** A volume carrying searchable text, on top of the status-only `volume`. */
function textVolume(id: string, lineId: string, fields: Partial<Volume>): Volume {
  return { ...volume(id, lineId, "announced"), ...fields };
}

describe("volumeMatchesSearch", () => {
  const v = textVolume("v", "l", {
    title: "Great Power",
    writers: "Stan Lee",
    artists: "Steve Ditko",
    issuesCollected: "Amazing Spider-Man #1-17",
    description: "The foundation of the Marvel Universe.",
  });

  it("matches on every searchable field", () => {
    for (const q of ["great power", "stan lee", "ditko", "#1-17", "foundation"]) {
      expect(volumeMatchesSearch(v, q)).toBe(true);
    }
  });

  it("does not match text absent from every field", () => {
    expect(volumeMatchesSearch(v, "kirby")).toBe(false);
  });

  it("tolerates volumes missing the optional credit fields", () => {
    const bare = textVolume("b", "l", { writers: undefined, artists: undefined });
    expect(() => volumeMatchesSearch(bare, "lee")).not.toThrow();
    expect(volumeMatchesSearch(bare, "lee")).toBe(false);
  });
});

describe("searchMatches", () => {
  const lines = [line("a", "Amazing Spider-Man"), line("b", "Fantastic Four")];
  const entries = [
    textVolume("a1", "a", { title: "Great Power", writers: "Stan Lee" }),
    textVolume("a2", "a", { title: "Great Responsibility", writers: "Stan Lee" }),
    textVolume("b1", "b", { title: "The Coming of Galactus", artists: "Jack Kirby" }),
  ];

  it("returns null for an empty or whitespace query", () => {
    expect(searchMatches({ query: "", lines, entries })).toBeNull();
    expect(searchMatches({ query: "   ", lines, entries })).toBeNull();
  });

  it("matches lines by name and keeps them whole", () => {
    const m = searchMatches({ query: "spider-man", lines, entries })!;
    expect([...m.lineIds]).toEqual(["a"]);
    expect([...m.nameMatchedLineIds]).toEqual(["a"]);
    // No volume of it needs to have matched for the line to stay whole.
    expect(m.volumeIds.size).toBe(0);
  });

  it("surfaces a line through its volumes' text", () => {
    const m = searchMatches({ query: "kirby", lines, entries })!;
    expect([...m.lineIds]).toEqual(["b"]);
    expect(m.nameMatchedLineIds.size).toBe(0);
    expect([...m.volumeIds]).toEqual(["b1"]);
  });

  it("unions the two routes when a query hits both", () => {
    const m = searchMatches({ query: "great", lines, entries })!;
    expect([...m.volumeIds]).toEqual(["a1", "a2"]);
    expect([...m.lineIds]).toEqual(["a"]);
  });
});

describe("volumeVisibleUnderSearch", () => {
  const lines = [line("a", "Amazing Spider-Man")];
  const entries = [
    textVolume("a1", "a", { title: "Great Power", writers: "Stan Lee" }),
    textVolume("a2", "a", { title: "Nothing Alike", writers: "Gerry Conway" }),
  ];

  it("keeps every volume with no search running", () => {
    expect(volumeVisibleUnderSearch(entries[0], null)).toBe(true);
    expect(volumeVisibleUnderSearch(entries[1], null)).toBe(true);
  });

  it("keeps every volume of a line that matched by name", () => {
    const m = searchMatches({ query: "spider-man", lines, entries })!;
    expect(volumeVisibleUnderSearch(entries[0], m)).toBe(true);
    expect(volumeVisibleUnderSearch(entries[1], m)).toBe(true);
  });

  it("keeps only the matching volumes when the line itself did not match", () => {
    const m = searchMatches({ query: "stan lee", lines, entries })!;
    expect(volumeVisibleUnderSearch(entries[0], m)).toBe(true);
    expect(volumeVisibleUnderSearch(entries[1], m)).toBe(false);
  });
});

describe("filterLines", () => {
  const lines = [line("a", "Ultimate Spider-Man"), line("b", "Ultimate X-Men"), line("c", "Thor")];
  const search = (query: string) => searchMatches({ query, lines, entries: [] });

  it("returns the same array reference when nothing filters", () => {
    expect(filterLines(lines, null, null)).toBe(lines);
    expect(filterLines(lines, search("   "), null)).toBe(lines);
  });

  it("matches the search query case-insensitively anywhere in the title", () => {
    expect(filterLines(lines, search("ULTIMATE"), null).map((l) => l.id)).toEqual(["a", "b"]);
    expect(filterLines(lines, search("x-men"), null).map((l) => l.id)).toEqual(["b"]);
  });

  it("intersects the search query with the facet-matched ids", () => {
    expect(filterLines(lines, search("ultimate"), new Set(["b", "c"])).map((l) => l.id)).toEqual([
      "b",
    ]);
  });
});
