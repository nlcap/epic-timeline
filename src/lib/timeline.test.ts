import { describe, expect, it } from "vitest";
import type { Gap, Volume } from "../types";
import {
  addCellWindowQuarters,
  assignLanes,
  lineHeight,
  quarterBeforeMonthPoint,
  quarterIndex,
  quarterPointFromIndex,
  quartersBetween,
  resizeSpan,
  spanToPx,
  yearsCoveredLabel,
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

describe("yearsCoveredLabel", () => {
  it("returns a single year when start and end match", () => {
    expect(yearsCoveredLabel(1962, 1962)).toBe("1962");
  });

  it("returns a range when they differ", () => {
    expect(yearsCoveredLabel(1962, 1963)).toBe("1962-1963");
  });
});
