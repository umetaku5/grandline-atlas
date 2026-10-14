// Curved surfaces from a grid of world points (hull planking, sail cloth).
// Every grid triangle is clipped to the side that faces the viewer, then split
// along the kit's four light bands with interpolated vertex normals, so tone
// boundaries run as smooth curves instead of a facet staircase. The outline is
// the interpolated limb (where the surface turns away) plus the grid border.
// Runs in Node (build) and in the page (the sail breathes), so it only needs
// `iso` and `pathOf`, which the kit provides in both places.
import { iso, pathOf, cameraOf } from "../anatomy/kit/iso-kit.mjs";

const SHELL_BANDS = [0, 0.2, 0.42, 0.62];
const sv = {
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  unit: (a) => {
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  },
};

export function shellCamera(P) {
  const { sinA, cosA, sinE, cosE } = cameraOf(P);
  return { V: [cosA * cosE, sinA * cosE, sinE], L: sv.unit([-sinA, cosA, 1.2]) };
}

function lerpVert(a, b, t) {
  return { p: [a.p[0] + (b.p[0] - a.p[0]) * t, a.p[1] + (b.p[1] - a.p[1]) * t, a.p[2] + (b.p[2] - a.p[2]) * t], f: a.f + (b.f - a.f) * t, s: a.s + (b.s - a.s) * t };
}

function clipPoly(poly, key, bound, keepAbove) {
  const out = [];
  const inside = (v) => (keepAbove ? v[key] >= bound : v[key] < bound);
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ia = inside(a);
    const ib = inside(b);
    if (ia) out.push(a);
    if (ia !== ib) {
      const t = (bound - a[key]) / (b[key] - a[key]);
      out.push(lerpVert(a, b, Math.min(1, Math.max(0, t))));
    }
  }
  return out;
}

// grid[i][j]: world points. normalSign flips the grid's own orientation so the
// normal points out of the face you want to show. Returns kit SolidPaths.
export function shellPaths(grid, P, { normalSign = 1, edges = "all", normals = null } = {}) {
  const { V, L } = shellCamera(P);
  const ni = grid.length;
  const nj = grid[0].length;
  const at = (i, j) => grid[Math.max(0, Math.min(ni - 1, i))][Math.max(0, Math.min(nj - 1, j))];
  const normalAt = (i, j) => {
    if (normals) return normals[i][j];
    const du = sv.sub(at(i + 1, j), at(i - 1, j));
    const dv = sv.sub(at(i, j + 1), at(i, j - 1));
    const n = sv.unit(sv.cross(du, dv));
    return [n[0] * normalSign, n[1] * normalSign, n[2] * normalSign];
  };
  const verts = grid.map((row, i) => row.map((p, j) => {
    const n = normalAt(i, j);
    return { p, f: sv.dot(n, V), s: sv.dot(n, L) };
  }));
  const bands = [[], [], [], [], []];
  const limb = [];
  const flat = (v) => iso(v.p, P);
  const tri = (a, b, c) => {
    if (a.f < 0 && b.f < 0 && c.f < 0) return;
    let poly = [a, b, c];
    if (a.f < 0 || b.f < 0 || c.f < 0) {
      poly = clipPoly(poly, "f", 0, true);
      const cross = [];
      const loop = [a, b, c];
      for (let k = 0; k < 3; k++) {
        const u = loop[k];
        const w = loop[(k + 1) % 3];
        if ((u.f >= 0) !== (w.f >= 0)) cross.push(lerpVert(u, w, u.f / (u.f - w.f)));
      }
      if (cross.length === 2) limb.push([flat(cross[0]), flat(cross[1])]);
    }
    if (poly.length < 3) return;
    for (let band = 0; band < 5; band++) {
      let piece = poly;
      if (band > 0) piece = clipPoly(piece, "s", SHELL_BANDS[band - 1], true);
      if (piece.length >= 3 && band < 4) piece = clipPoly(piece, "s", SHELL_BANDS[band], false);
      if (piece.length >= 3) bands[band].push(pathOf(piece.map(flat), true));
    }
  };
  for (let i = 0; i < ni - 1; i++) {
    for (let j = 0; j < nj - 1; j++) {
      tri(verts[i][j], verts[i + 1][j], verts[i + 1][j + 1]);
      tri(verts[i][j], verts[i + 1][j + 1], verts[i][j + 1]);
    }
  }
  // Border: the four grid edges, kept only where they face the viewer.
  const border = [];
  const run = (list) => {
    let current = [];
    for (let k = 0; k < list.length - 1; k++) {
      const a = list[k];
      const b = list[k + 1];
      if (a.f >= 0 && b.f >= 0) {
        if (!current.length) current.push(flat(a));
        current.push(flat(b));
      } else if (a.f >= 0 || b.f >= 0) {
        const m = lerpVert(a, b, a.f / (a.f - b.f));
        if (a.f >= 0) {
          if (!current.length) current.push(flat(a));
          current.push(flat(m));
          border.push(current);
          current = [];
        } else current = [flat(m), flat(b)];
      } else if (current.length) {
        border.push(current);
        current = [];
      }
    }
    if (current.length > 1) border.push(current);
  };
  const want = edges === "all" ? ["i0", "i1", "j0", "j1"] : edges;
  if (want.includes("j0")) run(verts.map((row) => row[0]));
  if (want.includes("j1")) run(verts.map((row) => row[nj - 1]));
  if (want.includes("i0")) run(verts[0]);
  if (want.includes("i1")) run(verts[ni - 1]);
  const outline = [...joinSegments(limb), ...border].map((points) => pathOf(points)).join("");
  return { fill: "", outline, crease: "", top: bands[4].join(""), shades: bands.slice(0, 4).map((list) => list.join("")), seamless: true };
}

// Chains short limb segments into polylines so the outline strokes cleanly.
function joinSegments(segments) {
  const key = ([x, y]) => `${Math.round(x * 20)},${Math.round(y * 20)}`;
  const ends = new Map();
  segments.forEach((seg, index) => {
    for (const end of [0, 1]) {
      const k = key(seg[end]);
      if (!ends.has(k)) ends.set(k, []);
      ends.get(k).push([index, end]);
    }
  });
  const used = new Set();
  const lines = [];
  const extend = (line, point) => {
    for (;;) {
      const next = (ends.get(key(point)) || []).find(([index]) => !used.has(index));
      if (!next) return;
      const [index, end] = next;
      used.add(index);
      point = segments[index][1 - end];
      line.push(point);
    }
  };
  segments.forEach((seg, index) => {
    if (used.has(index)) return;
    used.add(index);
    const forward = [seg[0], seg[1]];
    extend(forward, seg[1]);
    const backward = [seg[0]];
    extend(backward, seg[0]);
    lines.push([...backward.reverse(), ...forward.slice(1)]);
  });
  return lines;
}

// Projected visible run of a polyline that lies on a grid surface: keeps the
// samples whose facing value is >= 0 and ends each run on the limb.
export function visibleRuns(points, facing, P) {
  const runs = [];
  let current = [];
  for (let k = 0; k < points.length; k++) {
    const f = facing[k];
    if (f >= 0) {
      if (!current.length && k > 0 && facing[k - 1] < 0) {
        const t = facing[k - 1] / (facing[k - 1] - f);
        current.push(iso(lerp(points[k - 1], points[k], t), P));
      }
      current.push(iso(points[k], P));
    } else if (current.length) {
      const t = facing[k - 1] / (facing[k - 1] - f);
      current.push(iso(lerp(points[k - 1], points[k], t), P));
      runs.push(current);
      current = [];
    }
  }
  if (current.length > 1) runs.push(current);
  return runs;
}
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
