import { describe, expect, it } from "vitest";

import { layoutCaseMasonry } from "@/lib/cases/masonry";

describe("case wall masonry placement", () => {
  it("distributes 25 square cards as 9/8/8 rather than 9/9/7", () => {
    const layout = layoutCaseMasonry(Array(25).fill(440), 3, 370, 20);
    const counts = [0, 390, 780].map(
      (left) => layout.positions.filter((item) => item.left === left).length,
    );
    expect(counts).toEqual([9, 8, 8]);
    expect(layout.height).toBe(4120);
  });

  it("fills the shortest actual column for mixed image and caption heights", () => {
    const heights = [500, 200, 350, 100, 400, 250];
    const layout = layoutCaseMasonry(heights, 3, 300, 20);
    expect(layout.positions[3]).toEqual({ left: 320, top: 220 });
    expect(layout.positions[4]).toEqual({ left: 320, top: 340 });
    expect(layout.positions[5]).toEqual({ left: 640, top: 370 });
    expect(layout.height).toBe(740);
  });

  it("keeps existing cards in place when loading more, and adapts to two columns", () => {
    const first = layoutCaseMasonry(Array(24).fill(440), 3, 370, 20);
    const more = layoutCaseMasonry(Array(25).fill(440), 3, 370, 20);
    expect(more.positions.slice(0, 24)).toEqual(first.positions);
    const mobile = layoutCaseMasonry(Array(25).fill(230), 2, 167, 16);
    expect(mobile.positions.filter((item) => item.left === 0)).toHaveLength(13);
    expect(mobile.positions.filter((item) => item.left === 183)).toHaveLength(
      12,
    );
  });

  it("handles an empty result and rejects invalid measurements", () => {
    expect(layoutCaseMasonry([], 3, 300, 20)).toEqual({
      positions: [],
      height: 0,
    });
    expect(() => layoutCaseMasonry([100], 0, 300, 20)).toThrow();
    expect(() => layoutCaseMasonry([NaN], 3, 300, 20)).toThrow();
    expect(() => layoutCaseMasonry([100], 3, 0, 20)).toThrow();
  });
});
