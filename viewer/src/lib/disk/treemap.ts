export type Box = { x: number; y: number; w: number; h: number };

/**
 * Squarified treemap in a width×height box. Area is proportional to `value`.
 * Coordinates start at 0,0 of the box you pass (use 100×100 for percentages).
 */
export function treemapLayout<T extends { value: number }>(
  items: T[],
  width = 100,
  height = 100,
): Array<T & Box> {
  const positive = items.filter((item) => item.value > 0 && Number.isFinite(item.value));
  const total = positive.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0 || width <= 0 || height <= 0) return [];
  const sorted = [...positive].sort((a, b) => b.value - a.value);
  const out: Array<T & Box> = [];
  layoutStrip(sorted, { x: 0, y: 0, w: width, h: height }, (width * height) / total, out);
  return out;
}

function worst(row: { value: number }[], sum: number, side: number, scale: number): number {
  if (row.length === 0 || sum <= 0 || side <= 0) return Infinity;
  const thickness = (sum * scale) / side;
  if (thickness <= 0) return Infinity;
  let worstRatio = 0;
  for (const item of row) {
    const length = (item.value * scale) / thickness;
    const ratio = Math.max(length / thickness, thickness / length);
    if (ratio > worstRatio) worstRatio = ratio;
  }
  return worstRatio;
}

function layoutStrip<T extends { value: number }>(
  items: T[],
  box: Box,
  scale: number,
  out: Array<T & Box>,
): void {
  if (items.length === 0 || box.w <= 0 || box.h <= 0) return;
  if (items.length === 1) {
    out.push({ ...items[0], x: box.x, y: box.y, w: box.w, h: box.h });
    return;
  }

  const horizontal = box.w >= box.h;
  const side = horizontal ? box.h : box.w;
  const row: T[] = [];
  let rowSum = 0;
  let index = 0;
  for (; index < items.length; index += 1) {
    const candidate = items[index];
    const nextSum = rowSum + candidate.value;
    const nextRow = row.concat(candidate);
    if (
      row.length === 0 ||
      worst(nextRow, nextSum, side, scale) <= worst(row, rowSum, side, scale)
    ) {
      row.push(candidate);
      rowSum = nextSum;
    } else {
      break;
    }
  }

  const thickness = Math.min((rowSum * scale) / side, horizontal ? box.w : box.h);
  let cursor = 0;
  for (const item of row) {
    const length = rowSum > 0 ? (item.value / rowSum) * side : 0;
    if (horizontal) {
      out.push({
        ...item,
        x: box.x,
        y: box.y + cursor,
        w: thickness,
        h: length,
      });
    } else {
      out.push({
        ...item,
        x: box.x + cursor,
        y: box.y,
        w: length,
        h: thickness,
      });
    }
    cursor += length;
  }

  const rest = items.slice(row.length);
  if (rest.length === 0) return;
  if (horizontal) {
    layoutStrip(rest, { x: box.x + thickness, y: box.y, w: box.w - thickness, h: box.h }, scale, out);
  } else {
    layoutStrip(rest, { x: box.x, y: box.y + thickness, w: box.w, h: box.h - thickness }, scale, out);
  }
}
