import { describe, expect, it } from "vitest";
import { FULL_RATING_RANGE, isRatingFilterActive, RATING_MAX, RATING_MIN } from "./rating";

describe("isRatingFilterActive", () => {
  it("is inactive at the full span", () => {
    expect(isRatingFilterActive(FULL_RATING_RANGE)).toBe(false);
    expect(isRatingFilterActive([RATING_MIN, RATING_MAX])).toBe(false);
  });

  it("is active once either end moves inward", () => {
    expect(isRatingFilterActive([0.5, RATING_MAX])).toBe(true);
    expect(isRatingFilterActive([RATING_MIN, 4.5])).toBe(true);
    expect(isRatingFilterActive([2, 3])).toBe(true);
  });

  it("treats a zero-width range at either end as active", () => {
    // "exactly unrated" and "exactly five stars" both restrict, even
    // though one end still sits on its own bound.
    expect(isRatingFilterActive([RATING_MIN, RATING_MIN])).toBe(true);
    expect(isRatingFilterActive([RATING_MAX, RATING_MAX])).toBe(true);
  });
});
