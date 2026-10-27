export type MasonryPlacement = { left: number; top: number };

/** Place each complete card into the shortest column, retaining source order. */
export function layoutCaseMasonry(
  heights: readonly number[],
  columns: number,
  columnWidth: number,
  gap: number,
) {
  if (
    !Number.isInteger(columns) ||
    columns < 1 ||
    !Number.isFinite(columnWidth) ||
    columnWidth <= 0 ||
    !Number.isFinite(gap) ||
    gap < 0 ||
    heights.some((height) => !Number.isFinite(height) || height < 0)
  ) {
    throw new Error("Invalid masonry dimensions");
  }

  const bottoms = Array<number>(columns).fill(0);
  const positions = heights.map((height): MasonryPlacement => {
    const column = bottoms.indexOf(Math.min(...bottoms));
    const position = {
      left: column * (columnWidth + gap),
      top: bottoms[column],
    };
    bottoms[column] += height + gap;
    return position;
  });

  return {
    positions,
    height: heights.length ? Math.max(...bottoms) - gap : 0,
  };
}
