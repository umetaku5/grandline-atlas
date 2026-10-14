// The square sail as a surface that fills with wind, and the jolly roger painted
// on it. Shared by the build (rest pose) and the page (it breathes).
import { iso, pathOf } from "../anatomy/kit/iso-kit.mjs";
import { shellPaths } from "./shell.mjs";

export const SAIL = { x: 16.5, top: 187, drop: 95, half0: 60, half1: 64, cols: 14, rows: 12 };

export function sailPoint(u, v, bulge) {
  const g = Math.sin(Math.PI * 0.62 * v) / Math.sin(Math.PI * 0.62);
  return [SAIL.x + bulge * (1 - u * u) * g, u * (SAIL.half0 + (SAIL.half1 - SAIL.half0) * v), SAIL.top - SAIL.drop * v];
}

// Emblem shapes in sail units: a across (world units from the centre line),
// b down from the head of the sail. All filled shapes, so no line ends.
const emRing = (cx, cy, rx, ry, n = 28, from = 0, to = Math.PI * 2) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = from + ((to - from) * i) / n;
    return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)];
  });
const emBone = (angle) => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const L = 25;
  const w = 2.4;
  const at = (a, b) => [a * c - b * s, 52 + a * s + b * c];
  return { bar: [at(-L, -w), at(L, -w), at(L, w), at(-L, w)], knobs: [at(-L, -2.8), at(-L, 2.8), at(L, -2.8), at(L, 2.8)] };
};
export const EMBLEM = (() => {
  const bones = [emBone(0.62), emBone(-0.62)];
  return {
    bones: bones.map((b) => b.bar),
    knobs: bones.flatMap((b) => b.knobs.map(([a, bb]) => emRing(a, bb, 3.4, 3.4, 14))),
    skull: [...emRing(0, 46, 14, 13, 30, Math.PI * 0.82, Math.PI * 2.18), [7.5, 60], [7.5, 63], [-7.5, 63], [-7.5, 60]],
    holes: [emRing(-5.4, 48, 3.6, 4, 16), emRing(5.4, 48, 3.6, 4, 16), [[0, 53], [2, 56.4], [-2, 56.4]]],
    crown: [[-11, 37], ...emRing(0, 37, 11, 9, 20, Math.PI, Math.PI * 2).slice(1, -1), [11, 37]],
    band: [[-11.2, 34.4], [11.2, 34.4], [11.4, 37.2], [-11.4, 37.2]],
    brim: emRing(0, 37.6, 21, 3.6, 30),
  };
})();

export function sailParts(bulge, P) {
  const grid = [];
  for (let i = 0; i <= SAIL.cols; i++) {
    const u = -1 + (2 * i) / SAIL.cols;
    const row = [];
    for (let j = 0; j <= SAIL.rows; j++) row.push(sailPoint(u, j / SAIL.rows, bulge));
    grid.push(row);
  }
  const paths = shellPaths(grid, P, { normalSign: -1 });
  const toScreen = ([a, b]) => {
    const v = b / SAIL.drop;
    const half = SAIL.half0 + (SAIL.half1 - SAIL.half0) * v;
    return iso(sailPoint(a / half, v, bulge), P);
  };
  const shape = (points) => pathOf(points.map(toScreen), true);
  const seams = [-0.72, -0.43, -0.14, 0.14, 0.43, 0.72].map((u) => pathOf(Array.from({ length: SAIL.rows + 1 }, (_, j) => iso(sailPoint(u, j / SAIL.rows, bulge), P)))).join("");
  return {
    paths,
    seams,
    bones: EMBLEM.bones.map(shape).join("") + EMBLEM.knobs.map(shape).join(""),
    skull: shape(EMBLEM.skull),
    holes: EMBLEM.holes.map(shape).join(""),
    crown: shape(EMBLEM.crown),
    band: shape(EMBLEM.band),
    brim: shape(EMBLEM.brim),
  };
}
