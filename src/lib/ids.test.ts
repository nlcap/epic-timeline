import { describe, expect, it } from "vitest";
import { newId } from "./ids";

describe("newId", () => {
  it("keeps the caller's prefix readable", () => {
    expect(newId("ultimate-spider-man-vol")).toMatch(/^ultimate-spider-man-vol-[0-9a-f]{8}$/);
  });

  it("doesn't collide within the same millisecond", () => {
    // The whole point: Date.now().toString(36) returned the same suffix for
    // every id created inside one tick, and an id collision in an override
    // store means the second record overwrites the first.
    const ids = new Set(Array.from({ length: 1000 }, () => newId("line")));
    expect(ids.size).toBe(1000);
  });
});
