import { describe, expect, it } from "vitest";
import { formatUpdateDate, UPDATE_KIND_META, UPDATES } from "./updates";

describe("UPDATES", () => {
  it("is ordered newest first", () => {
    const dates = UPDATES.map((r) => r.date);
    // ISO yyyy-mm-dd sorts lexicographically, so no parsing needed.
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("has no duplicate dates", () => {
    const dates = UPDATES.map((r) => r.date);
    expect(new Set(dates).size).toBe(dates.length);
  });

  it("uses ISO yyyy-mm-dd dates", () => {
    for (const release of UPDATES) {
      expect(release.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("gives every release at least one entry", () => {
    for (const release of UPDATES) {
      expect(release.entries.length).toBeGreaterThan(0);
    }
  });

  it("gives every entry a known kind, a title and a description", () => {
    for (const release of UPDATES) {
      for (const entry of release.entries) {
        expect(UPDATE_KIND_META[entry.kind]).toBeDefined();
        expect(entry.title.length).toBeGreaterThan(0);
        expect(entry.description.length).toBeGreaterThan(0);
      }
    }
  });

  // Entries are keyed by title when rendered (see UpdatesModal), so a
  // repeat inside one release would collide.
  it("keeps entry titles unique within a release", () => {
    for (const release of UPDATES) {
      const titles = release.entries.map((e) => e.title);
      expect(new Set(titles).size).toBe(titles.length);
    }
  });
});

describe("formatUpdateDate", () => {
  it("formats a date without shifting it across a timezone", () => {
    // new Date("2026-08-18") is UTC midnight, which renders as the 17th
    // anywhere west of Greenwich -- this parses the fields directly.
    expect(formatUpdateDate("2026-08-18")).toBe("18 August 2026");
    expect(formatUpdateDate("2026-01-01")).toBe("1 January 2026");
    expect(formatUpdateDate("2026-12-31")).toBe("31 December 2026");
  });
});
