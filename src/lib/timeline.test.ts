import { describe, expect, it } from "vitest";
import type { Gap, Volume } from "../types";
import {
  addCellWindowQuarters,
  assignLanes,
  isFutureMonth,
  isValidYear,
  lineHeight,
  quarterBeforeMonthPoint,
  quarterIndex,
  quarterPointFromIndex,
  quartersBetween,
  resizeSpan,
  spanToPx,
  yearsCoveredLabel,
  nearestVolumeByStart,
  rowTopOffset,
  stepperVolumeTargets,
} from "./timeline";

function volume(id: string, start: [number, number], end: [number, number], swimLanePosition?: number): Volume {
  return {
    kind: "volume",
    id,
    lineId: "line-a",
    number: "1",
    title: id,
    start: { year: start[0], quarter: start[1] as 1 | 2 | 3 | 4 },
    end: { year: end[0], quarter: end[1] as 1 | 2 | 3 | 4 },
    issuesCollected: "",
    yearsCovered: "",
    description: "",
    ownershipStatus: "announced",
    swimLanePosition,
  };
}

function gap(id: string, start: [number, number], end: [number, number]): Gap {
  return {
    kind: "gap",
    id,
    lineId: "line-a",
    gapType: "publication",
    start: { year: start[0], quarter: start[1] as 1 | 2 | 3 | 4 },
    end: { year: end[0], quarter: end[1] as 1 | 2 | 3 | 4 },
  };
}

describe("quarterIndex / quartersBetween / quarterPointFromIndex", () => {
  it("round-trips through quarterPointFromIndex", () => {
    const point = { year: 1987, quarter: 3 as const };
    expect(quarterPointFromIndex(quarterIndex(point))).toEqual(point);
  });

  it("counts whole quarters between two points, including across a year boundary", () => {
    expect(quartersBetween({ year: 2000, quarter: 4 }, { year: 2001, quarter: 1 })).toBe(1);
    expect(quartersBetween({ year: 2000, quarter: 1 }, { year: 2001, quarter: 1 })).toBe(4);
    // Order matters -- going backwards is negative, not clamped.
    expect(quartersBetween({ year: 2001, quarter: 1 }, { year: 2000, quarter: 1 })).toBe(-4);
  });
});

describe("resizeSpan", () => {
  const start = { year: 2000, quarter: 1 as const };
  const end = { year: 2000, quarter: 4 as const };

  it("moves the start edge earlier or later by the given delta", () => {
    expect(resizeSpan(start, end, "start", 1)).toEqual({
      start: { year: 2000, quarter: 2 },
      end,
    });
  });

  it("moves the end edge earlier or later by the given delta", () => {
    expect(resizeSpan(start, end, "end", -1)).toEqual({
      start,
      end: { year: 2000, quarter: 3 },
    });
  });

  it("clamps the start edge so it can never pass the end edge", () => {
    // +10 quarters would push start well past end (Q4 2000) -- clamped to
    // land exactly on it instead, preserving the 1-quarter minimum span.
    expect(resizeSpan(start, end, "start", 10)).toEqual({ start: end, end });
  });

  it("clamps the end edge so it can never pass the start edge", () => {
    expect(resizeSpan(start, end, "end", -10)).toEqual({ start, end: start });
  });
});

describe("spanToPx", () => {
  const axisStart = { year: 2000, quarter: 1 as const };

  it("computes left offset from quarters between axisStart and start", () => {
    const { left } = spanToPx(axisStart, { year: 2001, quarter: 1 }, { year: 2001, quarter: 1 }, 10);
    expect(left).toBe(40); // 4 quarters * 10px
  });

  it("treats end as inclusive -- a same-quarter span is one quarter wide", () => {
    const { width } = spanToPx(axisStart, axisStart, axisStart, 10);
    expect(width).toBe(10);
  });

  it("spans flush against the next entry with no gap for adjacent quarters", () => {
    // Q4 2000 - Q3 2001 covers 4 quarters; the next entry starting Q4 2001
    // should sit exactly where this one's left + width ends.
    const first = spanToPx(axisStart, { year: 2000, quarter: 4 }, { year: 2001, quarter: 3 }, 10);
    const second = spanToPx(axisStart, { year: 2001, quarter: 4 }, { year: 2001, quarter: 4 }, 10);
    expect(first.left + first.width).toBe(second.left);
  });

  it("never returns a width smaller than one quarter, even for a backwards span", () => {
    const { width } = spanToPx(axisStart, { year: 2001, quarter: 1 }, { year: 2000, quarter: 1 }, 10);
    expect(width).toBe(10);
  });
});

describe("lineHeight", () => {
  it("returns rowHeight unchanged for a single-lane line", () => {
    expect(lineHeight(64, undefined)).toBe(64);
    expect(lineHeight(64, 1)).toBe(64);
  });

  it("stacks lanes with an 8px gap between them, not a flat multiple of rowHeight", () => {
    // tileHeight = 64 - 16 = 48; 2 lanes = 2*48 + 1*8 + 16 = 120
    expect(lineHeight(64, 2)).toBe(120);
  });

  it("clamps swimLanes into the supported 1-5 range", () => {
    expect(lineHeight(64, 0)).toBe(lineHeight(64, 1));
    expect(lineHeight(64, 99)).toBe(lineHeight(64, 5));
  });
});

describe("assignLanes", () => {
  it("puts non-overlapping entries in the same lane", () => {
    const entries = [volume("a", [2000, 1], [2000, 2]), volume("b", [2000, 3], [2000, 4])];
    const lanes = assignLanes(entries, 2);
    expect(lanes.get("a")).toBe(0);
    expect(lanes.get("b")).toBe(0);
  });

  it("splits overlapping entries into separate lanes", () => {
    const entries = [volume("a", [2000, 1], [2000, 4]), volume("b", [2000, 2], [2000, 3])];
    const lanes = assignLanes(entries, 2);
    expect(lanes.get("a")).not.toBe(lanes.get("b"));
  });

  it("doubles up in whichever lane frees soonest once every lane is occupied", () => {
    // Three entries all overlapping, only 2 lanes -- the third has to share
    // with whichever of the first two ends earliest (b, ending Q2).
    const entries = [
      volume("a", [2000, 1], [2000, 4]),
      volume("b", [2000, 1], [2000, 2]),
      volume("c", [2000, 1], [2000, 3]),
    ];
    const lanes = assignLanes(entries, 2);
    expect(lanes.get("c")).toBe(lanes.get("b"));
  });

  it("gives a pinned swimLanePosition priority over auto-placement, even out of order", () => {
    const entries = [
      volume("auto", [2000, 1], [2000, 4]),
      volume("pinned", [2000, 1], [2000, 4], 2),
    ];
    const lanes = assignLanes(entries, 2);
    expect(lanes.get("pinned")).toBe(1); // 1-based position 2 -> 0-based lane 1
    expect(lanes.get("auto")).toBe(0); // the only lane the pin left free
  });

  it("ignores an out-of-range swimLanePosition and auto-places instead", () => {
    const entries = [volume("a", [2000, 1], [2000, 4], 99)];
    const lanes = assignLanes(entries, 2);
    expect(lanes.get("a")).toBe(0);
  });

  it("clamps the lane count into the supported 1-5 range", () => {
    const entries = [volume("a", [2000, 1], [2000, 4]), volume("b", [2000, 1], [2000, 4])];
    // laneCount 0 should behave like laneCount 1 -- both entries share lane 0.
    const lanes = assignLanes(entries, 0);
    expect(lanes.get("a")).toBe(0);
    expect(lanes.get("b")).toBe(0);
  });

  it("treats gaps exactly like volumes for lane assignment", () => {
    const entries = [volume("a", [2000, 1], [2000, 4]), gap("g", [2000, 2], [2000, 3])];
    const lanes = assignLanes(entries, 2);
    expect(lanes.get("a")).not.toBe(lanes.get("g"));
  });
});

describe("addCellWindowQuarters", () => {
  it("covers the viewport plus a margin on both sides of the scroll bucket", () => {
    // 800px viewport / 50px per quarter = 16 quarters to cover the screen,
    // plus margin for 2x a 150px scroll bucket (2*150/50 = 6) -> 22.
    expect(addCellWindowQuarters(800, 50)).toBe(22);
  });

  it("grows as pxPerQuarter shrinks (more quarters needed per pixel of viewport)", () => {
    expect(addCellWindowQuarters(800, 10)).toBeGreaterThan(addCellWindowQuarters(800, 50));
  });
});

describe("quarterBeforeMonthPoint", () => {
  it("rolls back within the same year for months after Q1", () => {
    expect(quarterBeforeMonthPoint({ year: 2000, month: 7 })).toEqual({ year: 2000, quarter: 2 });
  });

  it("rolls back into Q4 of the prior year for a Q1 month", () => {
    expect(quarterBeforeMonthPoint({ year: 2000, month: 2 })).toEqual({ year: 1999, quarter: 4 });
  });
});

describe("isFutureMonth", () => {
  const now = new Date(2026, 7, 16); // 16 August 2026

  it("is true for a later month in the same year", () => {
    expect(isFutureMonth({ year: 2026, month: 9 }, now)).toBe(true);
  });

  it("is true for any month of a later year", () => {
    expect(isFutureMonth({ year: 2027, month: 1 }, now)).toBe(true);
  });

  it("is false for the current month, part-way through it", () => {
    expect(isFutureMonth({ year: 2026, month: 8 }, now)).toBe(false);
  });

  it("is false for an earlier month in the same year", () => {
    expect(isFutureMonth({ year: 2026, month: 7 }, now)).toBe(false);
  });

  it("is false for December of the prior year", () => {
    expect(isFutureMonth({ year: 2025, month: 12 }, now)).toBe(false);
  });
});

describe("yearsCoveredLabel", () => {
  it("returns a single year when start and end match", () => {
    expect(yearsCoveredLabel(1962, 1962)).toBe("1962");
  });

  it("returns a range when they differ", () => {
    expect(yearsCoveredLabel(1962, 1963)).toBe("1962-1963");
  });
});

describe("nearestVolumeByStart", () => {
  const at = (year: number, quarter: 1 | 2 | 3 | 4) => ({ start: { year, quarter } });

  it("picks the volume whose start is closest, in either direction", () => {
    const volumes = [at(1960, 1), at(1970, 1), at(1980, 1)];
    expect(nearestVolumeByStart(volumes, { year: 1969, quarter: 1 })).toBe(volumes[1]);
    expect(nearestVolumeByStart(volumes, { year: 1971, quarter: 1 })).toBe(volumes[1]);
    expect(nearestVolumeByStart(volumes, { year: 1900, quarter: 1 })).toBe(volumes[0]);
    expect(nearestVolumeByStart(volumes, { year: 2000, quarter: 1 })).toBe(volumes[2]);
  });

  it("breaks an exact tie toward the earlier volume", () => {
    // 1965 sits exactly between them; the first strict minimum wins.
    const volumes = [at(1960, 1), at(1970, 1)];
    expect(nearestVolumeByStart(volumes, { year: 1965, quarter: 1 })).toBe(volumes[0]);
  });

  it("returns null when the adjacent line has no volumes", () => {
    expect(nearestVolumeByStart([], { year: 1970, quarter: 1 })).toBeNull();
  });

  it("matches exactly when a volume shares the reference quarter", () => {
    const volumes = [at(1960, 1), at(1970, 2), at(1980, 1)];
    expect(nearestVolumeByStart(volumes, { year: 1970, quarter: 2 })).toBe(volumes[1]);
  });
});

describe("rowTopOffset", () => {
  it("sums every row above the index, not index * height", () => {
    // Uneven heights are the point -- a multi-swim-lane row is taller.
    const heights = [64, 128, 64, 192];
    expect(rowTopOffset(heights, 0)).toBe(0);
    expect(rowTopOffset(heights, 1)).toBe(64);
    expect(rowTopOffset(heights, 2)).toBe(192);
    expect(rowTopOffset(heights, 3)).toBe(256);
  });

  it("stops at the end of the list rather than reading past it", () => {
    const heights = [10, 20];
    expect(rowTopOffset(heights, 99)).toBe(30);
    expect(rowTopOffset([], 3)).toBe(0);
  });
});

describe("isValidYear", () => {
  it("accepts years across the seeded range and a bit beyond", () => {
    expect(isValidYear(1938)).toBe(true);
    expect(isValidYear(2027)).toBe(true);
    expect(isValidYear(1900)).toBe(true);
    expect(isValidYear(2100)).toBe(true);
  });

  it("rejects what an empty form field parses to", () => {
    // The whole reason this helper exists: a blank <input type="number">
    // reads as "", and Number("") is 0 -- an integer, so a bare
    // Number.isInteger check waves it through and the entry lands at year 0.
    expect(isValidYear(Number(""))).toBe(false);
    expect(isValidYear(Number("   "))).toBe(false);
    expect(isValidYear(0)).toBe(false);
  });

  it("rejects non-numeric and non-integer input", () => {
    expect(isValidYear(Number("abc"))).toBe(false);
    expect(isValidYear(1985.5)).toBe(false);
    expect(isValidYear(Infinity)).toBe(false);
  });

  it("rejects years outside the bounds", () => {
    expect(isValidYear(1899)).toBe(false);
    expect(isValidYear(2101)).toBe(false);
    expect(isValidYear(-1985)).toBe(false);
  });
});

describe("stepperVolumeTargets", () => {
  // The sidebar/pill geometry the chevrons work against. Fixed values so
  // the landing arithmetic below is reproducible.
  const AXIS_START = { year: 2000, quarter: 1 } as const;
  const GEOMETRY = [55, 200, 230, 24, 56] as const; // px/quarter, sidebar, column, gap, icon

  const v1 = volume("v1", [2010, 1], [2010, 4]);
  const v2 = volume("v2", [2020, 1], [2020, 4]);
  const v3 = volume("v3", [2030, 1], [2030, 4]);
  const volumes = [v1, v2, v3];

  const targetsAt = (scrollLeft: number) =>
    stepperVolumeTargets(volumes, AXIS_START, ...GEOMETRY, scrollLeft, 1);

  it("offers the neighbours on either side of the current position", () => {
    const { backwardTarget, forwardTarget } = targetsAt(0);
    expect(backwardTarget).toBeNull();
    expect(forwardTarget?.id).toBe("v1");
  });

  it("never re-offers the volume the last step landed on", () => {
    const landing = targetsAt(0).scrollTargetFor(v2);
    // Exactly on the landing, and at every rounding error a real browser
    // could introduce on the way there -- a smooth scroll settles on
    // whatever scrollLeft it can actually represent, not the float it was
    // handed. Half a pixel the wrong way used to classify v2 as its OWN
    // forward target, so "next" scrolled straight back to where it was.
    for (const drift of [0, -1, -0.5, 0.5, 1]) {
      const { backwardTarget, forwardTarget } = targetsAt(landing + drift);
      expect(forwardTarget?.id, `forward at drift ${drift}`).toBe("v3");
      expect(backwardTarget?.id, `backward at drift ${drift}`).toBe("v1");
    }
  });

  it("still separates volumes that are genuinely far apart", () => {
    // The tolerance must not swallow a real neighbour: parked on v1, v2 is
    // a decade away and has to remain the forward target.
    const landing = targetsAt(0).scrollTargetFor(v1);
    const { backwardTarget, forwardTarget } = targetsAt(landing);
    expect(forwardTarget?.id).toBe("v2");
    expect(backwardTarget).toBeNull();
  });

  it("runs out of targets at the end of the line", () => {
    const landing = targetsAt(0).scrollTargetFor(v3);
    const { backwardTarget, forwardTarget } = targetsAt(landing);
    expect(forwardTarget).toBeNull();
    expect(backwardTarget?.id).toBe("v2");
  });
});
