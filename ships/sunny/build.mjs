// Thousand Sunny, a Hero anatomy figure: a working model of the ship on a display stand.
// node ships/sunny/build.mjs            writes sunny-{ja,en}{,-light}.html next to this file
// node ships/sunny/build.mjs --audit    also proves the geometry (kit/audit.mjs)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../anatomy/kit/iso-kit.mjs";
import * as G from "../anatomy/kit/lathe.mjs";
import { tubePieces, tubeSvg } from "../anatomy/kit/tube.mjs";
import * as A from "../anatomy/kit/audit.mjs";
import { kitScript } from "../anatomy/scripts/inline-kit.mjs";
import { TEXT, PART_ORDER } from "./text.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const WIDTH = 760;
const HEIGHT = 620;
const AZIMUTH = 58;
const ELEVATION = 26;

// ---------- world: the model (x stern -> bow, y port -> starboard, z up) ----------
const W = 55; // half beam amidships
const Z = { keel: 26, b1: 33, b2: 40, l: 47, floor: 52, m2: 80, u: 88, g: 96, deck: 99 };
const PLATE = { x: -176, y: -66, w: 374, d: 162, r: 10 };
const PLATE_H = 12;
const FOOT_H = 5;
const LIFT = 46; // Coup de Burst leap height in the model's units

// Half-beam of the hull plan at x, grown outward by `grow` (for the gunwale).
function beam(x, grow = 0) {
  const stern = -150 - grow;
  const bowTip = 165 + grow;
  const half = W + grow;
  const corner = 20 + grow;
  if (x < stern || x > bowTip) return 0;
  if (x < stern + corner) {
    const t = (x - (stern + corner)) / corner;
    return half - corner + corner * Math.sqrt(Math.max(0, 1 - t * t));
  }
  if (x > 100) {
    const t = (x - 100) / (bowTip - 100);
    return half * Math.sqrt(Math.max(0, 1 - t * t));
  }
  return half;
}
// A convex piece of the hull plan between x0 and x1 at y-scale s, capped on the starboard side.
function hullRing(x0, x1, { s = 1, cap = Infinity, grow = 0 } = {}) {
  const xs = [];
  const step = 2.5;
  for (let x = x0; x < x1 - 1e-6; x += step) xs.push(x);
  xs.push(x1);
  const breaks = [-150 - grow + 20 + grow, 100];
  for (const b of breaks) if (b > x0 && b < x1 && !xs.some((x) => Math.abs(x - b) < 0.3)) xs.push(b);
  xs.sort((a, b) => a - b);
  const up = xs.map((x) => [x, Math.min(s * beam(x, grow), cap)]);
  const down = [...xs].reverse().map((x) => [x, -s * beam(x, grow)]);
  const ring = [...up, ...down];
  return ring.filter((p, i) => {
    const q = ring[(i + 1) % ring.length];
    return Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.05;
  });
}

const BAYS = [1, 2, 3, 4, 5].map((c, i) => ({ c, x0: -44 + i * 20, x1: -28 + i * 20 }));
const BAY_DEPTH = 26;
const NICHE = { x0: -92, x1: -66, depth: 10 };
const ENERGY = { x0: -146, x1: -100 };
const AQUA = { x0: 60, x1: 96 };
const DIAL = { x: -55, z: 68, r: 8 };
const MAST = { x: 20, y: 0 };
const OUT = 34; // how far a vehicle tray slides out
const RAIL_OUT = 17;
const PADDLE = { x: -79, z: 68, r: 11.5, y0: W - 7, y1: W - 3, out: 13 };

const fitPoints = [
  ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
  [MAST.x, 0, 300],
  [MAST.x, -54, 220],
  [MAST.x, 54, 220],
  [182, 0, 160],
  [-150, 0, 160],
  [-190, 14, 70],
  [0, W + OUT + 2, 52],
];
const P = k.fitProjection(fitPoints, WIDTH, HEIGHT, { pad: 22, azimuth: AZIMUTH, elevation: ELEVATION });
const V = G.viewOf(P);
const KS = G.scaleOf(P);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const Dots = (points, style) => k.dotsSvg(points, style);
const path3 = (points, closed = false) => k.pathOf(points.map(at), closed);
const f2 = (v) => Math.round(v * 100) / 100;
function planeMatrix(o, ex, ey) {
  const p0 = at(o);
  const px = at(G.add3(o, ex));
  const py = at(G.add3(o, ey));
  const v = (x) => x.toFixed(4);
  return `matrix(${v(px[0] - p0[0])} ${v(px[1] - p0[1])} ${v(py[0] - p0[0])} ${v(py[1] - p0[1])} ${p0[0].toFixed(2)} ${p0[1].toFixed(2)})`;
}
const hullOf2 = (pts) => {
  const sorted = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
};

// ---------- recorder and drawing helpers ----------
const R = A.recorder(P);
const record = R.solid;
function put(name, ref, svg, shapes = [], { bias = 0, part = "", ship = true, attrs = "", ...rest } = {}) {
  const extra = `${part ? ` data-part="${part}"` : ""}${ship ? " data-ship" : ""}${attrs}`;
  return R.put({ name, at: ref, bias, svg, shapes, piece: ship ? "ship" : "stand", attrs: extra, ...rest });
}
function box(name, [x0, y0, z0], [x1, y1, z1], style = {}, { r = 0.4, steps = 2, bevel = 0, extra = "", inner = "", bias = 0, part = "", ship = true, owner } = {}) {
  const plan = { x: x0, y: y0, w: x1 - x0, d: y1 - y0, r };
  const shape = record(A.slab(plan, z0, z1 - z0, { name, owner, ground: name.startsWith("stand.") }, steps));
  put(name, [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], S(k.slabOf(plan, z0, z1 - z0, P, steps, bevel), { tone: "mid", ...style, inner }) + extra, [shape], { bias, part, ship });
  return shape;
}
function slab(name, ring, z0, z1, style = {}, { extra = "", inner = "", bias = 0, part = "", ship = true, owner, bevel = 0 } = {}) {
  const shape = record(A.extruded(ring, z0, z1 - z0, { name, owner }));
  const cx = ring.reduce((a, p) => a + p[0], 0) / ring.length;
  const cy = ring.reduce((a, p) => a + p[1], 0) / ring.length;
  put(name, [cx, cy, (z0 + z1) / 2], S(k.extrude(ring, z0, z1 - z0, P, { convex: true, bevel }), { tone: "mid", ...style, inner }) + extra, [shape], { bias, part, ship });
  return shape;
}
function cyl(name, cx, cy, r, z0, z1, style = {}, { extra = "", inner = "", bias = 0, part = "", ship = true, owner, steps = 28, bevel = 0 } = {}) {
  const shape = record(A.cylinder(cx, cy, r, z0, z1 - z0, { name, owner }));
  put(name, [cx, cy, (z0 + z1) / 2], S(k.cylinder(cx, cy, r, z0, z1 - z0, P, steps, bevel), { tone: "mid", ...style, inner }) + extra, [shape], { bias, part, ship });
  return shape;
}
function turned(name, F, profile, style = {}, { extra = "", inner = "", bias = 0, part = "", ship = true, owner, smooth, steps, rims } = {}) {
  const opts = { ...(smooth !== undefined ? { smooth } : {}), ...(steps ? { steps } : {}), ...(rims ? { rims } : {}) };
  const paths = G.solidOf(profile, F, P, opts);
  const mid = (profile[0][0] + profile[profile.length - 1][0]) / 2;
  const shape = record(A.solid(F, profile, { name, owner, radius: smooth && smooth.radius ? smooth.radius : null }));
  put(name, G.add3(F.o, G.mul3(F.a, mid)), S(paths, { tone: "mid", ...style, inner }) + extra, [shape], { bias, part, ship });
  return shape;
}
const disc = (name, F, s0, s1, r, style, options) => turned(name, F, [[s0, r], [s1, r]], style, options);
function ball(name, c, r, style = {}, { bias = 0, extra = "", part = "", owner, ship = true } = {}) {
  const shape = record(A.ball(c, r, { name, owner }));
  put(name, c, S(G.sphereOf(c, r, P, { steps: 32 }), { tone: "mid", ...style }) + extra, [shape], { bias, part, ship });
  return shape;
}
function prism(name, F, poly, s0, s1, style = {}, { extra = "", inner = "", bias = 0, part = "", owner, ship = true } = {}) {
  const shape = record(A.prism(F, poly, s0, s1, { name, owner }));
  const cx = poly.reduce((a, p) => a + p[0], 0) / poly.length;
  const cy = poly.reduce((a, p) => a + p[1], 0) / poly.length;
  const centre = G.add3(G.add3(G.add3(F.o, G.mul3(F.a, (s0 + s1) / 2)), G.mul3(F.u, cx)), G.mul3(F.v, cy));
  put(name, centre, S(G.prismOf(F, poly, s0, s1, P), { tone: "mid", ...style, inner }) + extra, [shape], { bias, part, ship });
  return shape;
}
function line(name, points, r, { part = "", tone = "mid", bias = 0.05 } = {}) {
  const route = points;
  R.route(name, route, r, { limp: true, piece: "ship" });
  tubePieces(route, r, P, { maxLength: 18, spacing: 0.6 }).forEach((piece, index) =>
    put(`${name}:${index}`, piece.mid, tubeSvg(piece, { tone }), [A.tube(piece.points, piece.radii)], { bias, part, route: name, chunk: index }),
  );
  [0, 1].forEach((i) => {
    const end = i ? route[route.length - 1] : route[0];
    const size = 0.7;
    put(`${name}.end${i}`, end, Dots([at(end)], { size, tone: "hi" }), [A.ball(end, size / KS, { name: `${name}.end${i}`, owner: name })], { bias: bias + 0.15, part });
  });
}

const STAND = [];
const stand = (svg) => STAND.push(svg);
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

// ---------- the display stand (drawn first, never moves) ----------
stand(`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`);
for (const [x, y] of byDepth(k.corners(PLATE, 24))) {
  stand(S(k.cylinder(x, y, 8, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
  stand(S(k.cylinder(x, y, 6.2, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
}
stand(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid", inner: Ln(k.sideSeam(PLATE, -5, P, 8), { tone: "faint" }) }));
record(A.slab(PLATE, -PLATE_H, PLATE_H, { name: "stand.plate", ground: true }, 8));
stand(Ln(k.planOutline(k.insetPlan(PLATE, 6), 0, P), { tone: "lo" }));
{
  const screws = k.corners(PLATE, 12);
  stand(Ln(screws.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 16)).join(""), { tone: "lo" }));
  stand(Dots(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  const STRIP = { x: PLATE.x + 66, y: PLATE.y + PLATE.d - 13, w: PLATE.w - 84, d: 6, r: 1 };
  stand(S(k.slabOf(STRIP, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(STRIP.x + 4, STRIP.x + STRIP.w - 4, 5, 5, STRIP.y, 0.6, [1.8, 3.4], P);
  stand(Ln(ticks.minor, { tone: "lo" }), Ln(ticks.major, { tone: "mid" }));
  const LABEL = { x: PLATE.x + 14, y: PLATE.y + PLATE.d - 34, w: 44, d: 22, r: 1.4 };
  stand(S(k.slabOf(LABEL, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
  stand(Ln(k.planOutline(k.insetPlan(LABEL, 1.6), 0.8, P, 3), { tone: "faint" }));
  stand(Ln([30, 20, 26, 14].map((w, i) => k.lineOnTop([LABEL.x + 5, LABEL.y + 4.6 + i * 3.6], [LABEL.x + 5 + w, LABEL.y + 4.6 + i * 3.6], 0.8, P)).join(""), { tone: "lo", free: true }));
  stand(Dots([at([LABEL.x + LABEL.w - 3, LABEL.y + 3, 0.8]), at([LABEL.x + LABEL.w - 3, LABEL.y + LABEL.d - 3, 0.8])], { size: 0.45 }));
}
// soft shadow of the hull on the plate (fades while the ship is in the air)
stand(`<path class="iso-halo sn-shadow" d="${k.extrude(hullRing(-140, 150, { s: 0.62 }), 0, 0.1, P).fill}"/>`);

// cradles under the keel
for (const X of [-60, 80]) {
  const kw = 0.42 * W;
  box("stand.cradle.pad", [X - 12, -32, 0], [X + 12, 32, 3], { tone: "lo" }, { ship: false, r: 1.2, steps: 3, bevel: 0.4, extra: Dots([[X - 9, -29], [X + 9, -29], [X - 9, 29], [X + 9, 29]].map(([x, y]) => at([x, y, 3])), { size: 0.45 }) });
  box("stand.cradle.post", [X - 4, -7, 3], [X + 4, 7, 20], { tone: "mid" }, { ship: false, r: 0.8, steps: 2, inner: Ln(k.sideSeam({ x: X - 4, y: -7, w: 8, d: 14, r: 0.8 }, 9, P, 2), { tone: "faint" }) });
  box("stand.cradle.saddle", [X - 7, -kw - 4, 20], [X + 7, kw + 4, Z.keel], { tone: "mid" }, { ship: false, r: 1, steps: 2, bevel: 0.4 });
  for (const sy of [-1, 1]) {
    const y0 = sy > 0 ? kw : -kw - 4;
    box("stand.cradle.arm", [X - 6, y0, Z.keel], [X + 6, y0 + 4, Z.keel + 6], { tone: "lo" }, { ship: false, r: 0.6, steps: 2, extra: sy > 0 ? Dots([at([X - 3, kw + 4, Z.keel + 3]), at([X + 3, kw + 4, Z.keel + 3])], { size: 0.45 }) : "" });
  }
}

// ---------- hull: stepped strakes of Adam wood ----------
const plank = (ring, zs) => Ln(zs.map((z) => k.ringSeam(ring, z, P)).join(""), { tone: "faint" });
{
  const KR = hullRing(-138, 150, { s: 0.42 });
  slab("hull.keel", KR, Z.keel, Z.b1, { tone: "lo" }, { part: "hull" });
  const B1 = hullRing(-146, 158, { s: 0.66 });
  slab("hull.bilge1", B1, Z.b1, Z.b2, { tone: "mid" }, { part: "hull", inner: plank(B1, [36.5]) });
  const B2 = hullRing(-150, 165, { s: 0.86 });
  slab("hull.bilge2", B2, Z.b2, Z.l, { tone: "mid" }, { part: "hull", inner: plank(B2, [43.5]) });
  const LR = hullRing(-150, 165);
  slab("hull.wale", LR, Z.l, Z.floor, { tone: "mid" }, { part: "hull" });
}
// band M1 (floor .. 80) split at every bay, niche and cutaway so each piece sorts on its own
const M1 = [
  { x0: -150, x1: ENERGY.x0 },
  { x0: ENERGY.x0, x1: ENERGY.x1, cap: 0, role: "energy" },
  { x0: ENERGY.x1, x1: NICHE.x0 },
  { x0: NICHE.x0, x1: NICHE.x1, cap: W - NICHE.depth, role: "niche" },
  { x0: NICHE.x1, x1: BAYS[0].x0 },
  ...BAYS.flatMap((b, i) => [
    { x0: b.x0, x1: b.x1, cap: W - BAY_DEPTH, role: "bay" },
    { x0: b.x1, x1: i < 4 ? BAYS[i + 1].x0 : AQUA.x0 },
  ]),
  { x0: AQUA.x0, x1: AQUA.x1, cap: 0, role: "aqua" },
  { x0: AQUA.x1, x1: 165 },
];
for (const seg of M1) {
  const ring = hullRing(seg.x0, seg.x1, { cap: seg.cap ?? Infinity });
  const seams = seg.role === "bay" || seg.role === "niche" ? "" : plank(ring, [59, 66, 73]);
  slab(`hull.side`, ring, Z.floor, Z.m2, { tone: seg.role === "bay" || seg.role === "niche" ? "lo" : "mid" }, { part: "hull", inner: seams });
}
const M2 = [
  { x0: -150, x1: ENERGY.x0 },
  { x0: ENERGY.x0, x1: ENERGY.x1, cap: 0 },
  { x0: ENERGY.x1, x1: AQUA.x0 },
  { x0: AQUA.x0, x1: AQUA.x1, cap: 0 },
  { x0: AQUA.x1, x1: 165 },
];
for (const seg of M2) {
  const ring = hullRing(seg.x0, seg.x1, { cap: seg.cap ?? Infinity });
  slab(`hull.side2`, ring, Z.m2, Z.u, { tone: "mid" }, { part: "hull", inner: plank(ring, [84]) });
}
{
  const UR = hullRing(-150, 165);
  slab("hull.upper", UR, Z.u, Z.g, { tone: "mid" }, { part: "hull", inner: plank(UR, [92]) });
  const GR = hullRing(-151.4, 166.4, { grow: 1.4 });
  slab("hull.gunwale", GR, Z.g, Z.deck, { tone: "hi" }, { part: "hull", bevel: 0.5 });
}

// ---------- Soldier Dock System: bays, shutters, trays and vehicles ----------
const CLIPS = [];
function mouthClip(id, x0, x1, z0, z1, y = W) {
  const pts = [];
  for (const x of [x0, x1]) for (const z of [z0, z1]) for (const yy of [y, y + 140]) pts.push(at([x, yy, z]));
  CLIPS.push(`<clipPath id="${id}"><path d="${k.pathOf(hullOf2(pts), true)}"/></clipPath>`);
  return `url(#${id})`;
}
const VEH = {};
// Each vehicle is a list of parts drawn back to front inside one item.
function vehicleParts(c, cx) {
  const y0 = W - 24;
  const z0 = 54.5;
  const parts = [];
  const add = (svg, shape, ref) => parts.push({ svg, shape, ref });
  const owner = `veh${c}`;
  const wheel = (y, r, tone = "mid") => {
    const F = G.frameAlong([cx - 2, y, z0 + r], [1, 0, 0]);
    add(S(G.disc(0, 4, r, F, P, { steps: 36 }), { tone }) + Dots([at([cx + 2, y, z0 + r])], { size: 0.5, tone: "hi" }), A.disc(F, 0, 4, r, { name: `${owner}.wheel`, owner }), [cx, y, z0 + r]);
  };
  const blk = (x0, x1, ya, yb, za, zb, tone = "mid", r = 0.8, extra = "") => {
    const plan = { x: x0, y: ya, w: x1 - x0, d: yb - ya, r };
    add(S(k.slabOf(plan, za, zb - za, P, 3, 0.3), { tone }) + extra, A.slab(plan, za, zb - za, { name: `${owner}.body`, owner }, 3), [(x0 + x1) / 2, (ya + yb) / 2, (za + zb) / 2]);
  };
  const sph = (c3, r, tone = "hi") => add(S(G.sphereOf(c3, r, P, { steps: 28 }), { tone }), A.ball(c3, r, { name: `${owner}.ball`, owner }), c3);
  if (c === 1) {
    // Shiro Mokuba I: a white horse on two wheels
    wheel(y0 + 4.5, 4.5);
    wheel(y0 + 17.5, 4.5);
    blk(cx - 2.6, cx + 2.6, y0 + 3, y0 + 19, z0 + 6.5, z0 + 10.5, "hi", 1.6);
    blk(cx - 2.2, cx + 2.2, y0 + 5, y0 + 11, z0 + 10.5, z0 + 12, "mid", 0.8);
    blk(cx - 2, cx + 2, y0 + 15, y0 + 21, z0 + 10.5, z0 + 17, "hi", 1.4, Dots([at([cx + 2, y0 + 19.6, z0 + 15])], { size: 0.5, tone: "hi" }));
    blk(cx - 5, cx + 5, y0 + 14, y0 + 15.2, z0 + 12, z0 + 13, "mid", 0.4);
  } else if (c === 2) {
    // Mini Merry II: a small paddle boat with a sheep's head
    blk(cx - 5.5, cx + 5.5, y0 + 1, y0 + 22, z0, z0 + 6, "mid", 4, Ln(k.sideSeam({ x: cx - 5.5, y: y0 + 1, w: 11, d: 21, r: 4 }, z0 + 4.4, P, 3), { tone: "faint" }));
    blk(cx - 3.8, cx + 3.8, y0 + 4, y0 + 13, z0 + 6, z0 + 11, "hi", 1.2);
    blk(cx - 4.4, cx + 4.4, y0 + 3.4, y0 + 13.6, z0 + 11, z0 + 12, "mid", 1.2);
    sph([cx, y0 + 18, z0 + 9.6], 3.6, "hi");
    sph([cx - 3.4, y0 + 17.6, z0 + 10.6], 1.5, "mid");
    sph([cx + 3.4, y0 + 17.6, z0 + 10.6], 1.5, "mid");
  } else if (c === 3) {
    // Shark Submerge III: a shark-shaped submarine
    blk(cx - 3, cx + 3, y0 + 6, y0 + 16, z0, z0 + 1.6, "lo", 0.6);
    const F = G.frameOf([cx, y0, z0 + 6.6], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
    const L = 22;
    const radius = (s) => 5.2 * (1 - Math.pow((s - 10) / 11.2, 2));
    const slope = (s) => (-5.2 * 2 * (s - 10)) / (11.2 * 11.2);
    const profile = Array.from({ length: 23 }, (_, i) => {
      const s = (i / 22) * L * 0.95;
      return [s, radius(s), 1];
    });
    add(S(G.solidOf(profile, F, P, { smooth: { slope, radius } }), { tone: "hi" }) + Dots([at([cx + 3.6, y0 + 17.4, z0 + 8.2])], { size: 0.55, tone: "lo" }), A.solid(F, profile, { name: `${owner}.body`, owner, radius }), [cx, y0 + 10, z0 + 6.6]);
    const fin = G.frameOf([cx, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
    add(S(G.prismOf(fin, [[y0 + 8, z0 + 10.8], [y0 + 13, z0 + 11.4], [y0 + 9, z0 + 16.5]], -0.6, 0.6, P), { tone: "mid" }), A.prism(fin, [[y0 + 8, z0 + 10.8], [y0 + 13, z0 + 11.4], [y0 + 9, z0 + 16.5]], -0.6, 0.6, { name: `${owner}.fin`, owner }), [cx, y0 + 10, z0 + 12]);
    add(S(G.prismOf(fin, [[y0 + 0.6, z0 + 6], [y0 + 2.4, z0 + 7], [y0 - 1.4, z0 + 13], [y0 - 1.6, z0 + 11.4]], -0.6, 0.6, P), { tone: "mid" }), A.prism(fin, [[y0 + 0.6, z0 + 6], [y0 + 2.4, z0 + 7], [y0 - 1.4, z0 + 13], [y0 - 1.6, z0 + 11.4]], -0.6, 0.6, { name: `${owner}.tail`, owner }), [cx, y0, z0 + 9]);
  } else if (c === 4) {
    // Kurosai FR-U IV: a black rhino on two wheels
    wheel(y0 + 4.5, 4.5, "lo");
    wheel(y0 + 18, 4.5, "lo");
    blk(cx - 3, cx + 3, y0 + 2.4, y0 + 18.4, z0 + 5.6, z0 + 11, "lo", 1.8);
    blk(cx - 2.4, cx + 2.4, y0 + 5, y0 + 11, z0 + 11, z0 + 12.4, "mid", 0.8);
    blk(cx - 2.8, cx + 2.8, y0 + 15, y0 + 21.4, z0 + 8, z0 + 14, "lo", 1.6, Dots([at([cx + 2.8, y0 + 19.6, z0 + 12.2])], { size: 0.5, tone: "hi" }));
    const H = G.frameOf([cx, y0 + 19.4, z0 + 14], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
    add(S(G.solidOf([[0, 1.8], [5.4, 0.1]], H, P), { tone: "hi" }), A.solid(H, [[0, 1.8], [5.4, 0.1]], { name: `${owner}.horn`, owner }), [cx, y0 + 19.4, z0 + 16]);
  } else if (c === 5) {
    // Brachio Tank V: a long-necked tank on tracks
    for (const sx of [-1, 1]) blk(sx > 0 ? cx + 3 : cx - 6, sx > 0 ? cx + 6 : cx - 3, y0 + 1, y0 + 22, z0, z0 + 4.4, "lo", 2.2, Ln(k.sideSeam({ x: sx > 0 ? cx + 3 : cx - 6, y: y0 + 1, w: 3, d: 21, r: 2.2 }, z0 + 2.2, P, 3), { tone: "faint" }));
    blk(cx - 5, cx + 5, y0 + 3, y0 + 19, z0 + 4.4, z0 + 9.4, "mid", 1.6);
    blk(cx - 3.4, cx + 3.4, y0 + 5, y0 + 13, z0 + 9.4, z0 + 11.4, "hi", 1.2);
    const axis = G.unit3([0, 0.42, 0.91]);
    const N = G.frameAlong([cx, y0 + 13, z0 + 9.4], axis);
    add(S(G.disc(0, 11.2, 1.6, N, P, { steps: 24 }), { tone: "hi" }), A.disc(N, 0, 11.2, 1.6, { name: `${owner}.neck`, owner }), G.add3([cx, y0 + 13, z0 + 9.4], G.mul3(axis, 5.6)));
    sph(G.add3([cx, y0 + 13, z0 + 9.4], G.mul3(axis, 12.6)), 2.4, "hi");
  }
  return parts;
}

for (const b of BAYS) {
  const cx = (b.x0 + b.x1) / 2;
  const clip = mouthClip(`sn-bay${b.c}`, b.x0, b.x1, Z.floor, Z.m2);
  // rail and tray (two telescopic stages) plus the vehicle
  const railPlan = { x: cx - 4.5, y: W - 25, w: 9, d: 23, r: 0.6 };
  const trayPlan = { x: cx - 6.6, y: W - 25, w: 13.2, d: 23, r: 1 };
  const parts = vehicleParts(b.c, cx).sort((p, q) => G.dot3(p.ref, V) - G.dot3(q.ref, V));
  const rail = S(k.slabOf(railPlan, Z.floor, 1, P, 2), { tone: "lo" });
  const tray = S(k.slabOf(trayPlan, Z.floor + 1, 1.5, P, 3, 0.3), { tone: "mid" }) + Dots([at([cx - 4.6, W - 2.4, Z.floor + 2.5]), at([cx + 4.6, W - 2.4, Z.floor + 2.5])], { size: 0.4 });
  const svg = `<g clip-path="${clip}"><g data-slide="rail${b.c}">${rail}</g><g data-slide="veh${b.c}">${tray}${parts.map((p) => p.svg).join("")}</g></g>`;
  const shapes = [
    record(A.slab(railPlan, Z.floor, 1, { name: `veh${b.c}.rail`, owner: `veh${b.c}` }, 2)),
    record(A.slab(trayPlan, Z.floor + 1, 1.5, { name: `veh${b.c}.tray`, owner: `veh${b.c}` }, 3)),
    ...parts.map((p) => record(p.shape)),
  ];
  put(`veh${b.c}`, [cx, W - 14, 60], svg, shapes, { part: "dock", attrs: ` data-veh="${b.c}"` });
  // the roll-up shutter in the bay mouth, with one rivet per channel number
  const shutterPlan = { x: b.x0 + 0.4, y: W - 1.6, w: b.x1 - b.x0 - 0.8, d: 1, r: 0.3 };
  const slats = [56, 60, 64, 68, 72, 76].map((z) => k.sideSeam(shutterPlan, z, P, 2)).join("");
  const rivets = Array.from({ length: b.c }, (_, i) => at([cx + (i - (b.c - 1) / 2) * 2.2, W - 0.6, 78.2]));
  const shutter = S(k.slabOf(shutterPlan, Z.floor, Z.m2 - Z.floor, P, 2), { tone: "hi", inner: Ln(slats, { tone: "lo" }) }) + Dots(rivets, { size: 0.55, tone: "hi" });
  put(`shutter${b.c}`, [cx, W - 1.1, 66], `<g clip-path="${clip}"><g data-slide="door${b.c}">${shutter}</g></g>`, [record(A.slab(shutterPlan, Z.floor, Z.m2 - Z.floor, { name: `shutter${b.c}` }, 2))], { part: "dock", bias: 0.2 });
}

// channel 0: a paddle wheel on an axle that slides out of the niche
{
  const clip = mouthClip("sn-niche", NICHE.x0, NICHE.x1, Z.floor, Z.m2);
  const F = G.frameOf([PADDLE.x, 0, PADDLE.z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  const gland = W - NICHE.depth;
  const ROD = G.rodOut(F, gland, PADDLE.y0, 1.8, P, { stroke: PADDLE.out, steps: 24 });
  const wheel = S(G.disc(PADDLE.y0, PADDLE.y1, PADDLE.r, F, P, { steps: 64 }), { tone: "mid", inner: Ln(G.arcOf(F, PADDLE.y1 - 1, PADDLE.r, P), { tone: "faint" }) });
  const face = planeMatrix([PADDLE.x, PADDLE.y1, PADDLE.z], [1, 0, 0], [0, 0, -1]);
  const blades = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const pt = (r, t) => `${f2(r * c - t * s)} ${f2(r * s + t * c)}`;
    return `M${pt(3, -0.5)}L${pt(PADDLE.r - 0.6, -0.5)}L${pt(PADDLE.r - 0.6, 0.5)}L${pt(3, 0.5)}Z M${pt(6.5, -1.6)}L${pt(PADDLE.r - 0.6, -1.6)}L${pt(PADDLE.r - 0.6, 1.6)}L${pt(6.5, 1.6)}Z`;
  }).join("");
  const spin = `<g transform="${face}"><g data-spin><path class="sn-blade" d="${blades}"/><circle class="sn-hub" r="3.2"/><circle class="sn-hubdot" r="0.9"/></g><circle class="sn-rim" r="${PADDLE.r - 0.6}"/></g>`;
  const rodSvg = `<clipPath id="sn-axle"><path data-hold d="${ROD.clip}"/></clipPath><g clip-path="url(#sn-axle)">${S(ROD.paths, { tone: "hi" })}</g>`;
  const seal = Ln(G.circleOf(F, gland + 0.02, 2.3, P, 40), { tone: "faint" });
  put("paddle", [PADDLE.x, W - 5, PADDLE.z], `${seal}<g clip-path="${clip}"><g data-slide="paddle">${rodSvg}${wheel}${spin}</g></g>`, [record(A.slide(F, gland, PADDLE.y0, 1.8, { name: "paddle.axle", owner: "paddle" })), record(A.disc(F, PADDLE.y0, PADDLE.y1, PADDLE.r, { name: "paddle.wheel", owner: "paddle" }))], { part: "dock" });
}

// the channel selector dial on the hull side
const DIAL_ANGLES = [-120, -72, -24, 24, 72, 120];
{
  const F = G.frameOf([DIAL.x, W, DIAL.z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  const face = planeMatrix([DIAL.x, W + 2, DIAL.z], [1, 0, 0], [0, 0, -1]);
  const rad = (d) => (d * Math.PI) / 180;
  const tick = DIAL_ANGLES.map((d, i) => {
    const s = Math.sin(rad(d));
    const c = -Math.cos(rad(d));
    const r0 = i === 0 ? 4.6 : 5.4;
    return `M${f2(s * 6.8)} ${f2(c * 6.8)}L${f2(s * r0)} ${f2(c * r0)}`;
  }).join("");
  const marks = DIAL_ANGLES.map((d) => [f2(Math.sin(rad(d)) * 7.6), f2(-Math.cos(rad(d)) * 7.6)]);
  const dial = [
    S(G.disc(0, 1.2, DIAL.r + 1.4, F, P, { steps: 48 }), { tone: "lo" }),
    S(G.disc(1.2, 2, DIAL.r, F, P, { steps: 48 }), { tone: "hi" }),
    `<g transform="${face}">`,
    `<circle class="iso-line sn-ring" data-tone="lo" r="6.8"/>`,
    `<path class="iso-line" data-tone="mid" d="${tick}"/>`,
    marks.map(([x, y], i) => `<circle class="sn-mark" cx="${x}" cy="${y}" r="${i === 0 ? 0.55 : 0.4}"/>`).join(""),
    `<g data-dial transform="rotate(-150)">${Ln("M0 1.8L0 -5.8", { tone: "lit", free: true, className: "sn-needle" })}</g>`,
    `<circle class="sn-hubdot" r="1"/>`,
    `</g>`,
  ].join("");
  put("dial", [DIAL.x, W + 1, DIAL.z], dial, [record(A.disc(F, 0, 1.2, DIAL.r + 1.4, { name: "dial.base", owner: "dial" })), record(A.disc(F, 1.2, 2, DIAL.r, { name: "dial.face", owner: "dial" }))], { part: "dock" });
}

// ---------- energy room (stern cutaway): cola barrels, compressor tank, Coup de Burst ----------
const BARRELS = [];
{
  const tray = { x: -144, y: 30.6, w: 42.6, d: 18.2, r: 1 };
  box("energy.tray", [tray.x, tray.y, Z.floor], [tray.x + tray.w, tray.y + tray.d, Z.floor + 0.8], { tone: "lo" }, { part: "energy", r: 1, steps: 3 });
  const xs = [-140.5, -133.1, -125.7, -118.3, -110.9, -103.5];
  const ys = [44.6, 35.2];
  let n = 0;
  const list = [];
  for (const y of ys) for (const x of xs) list.push([x, y]);
  // consumption order: front row from the stern side first
  for (const [x, y] of list) {
    const z0 = Z.floor + 0.8;
    const h = 9;
    const inner = Ln([z0 + 1.6, z0 + h - 1.6].map((z) => k.sideArc(x, y, 3.6, z, P, 20)).join(""), { tone: "lo" });
    const top = Ln(k.ring(x, y, 1, z0 + h, P, 12), { tone: "lo" });
    const shape = record(A.cylinder(x, y, 3.6, z0, h, { name: "barrel" }));
    put("barrel", [x, y, z0 + h / 2], S(k.cylinder(x, y, 3.6, z0, h, P, 28, 0.3), { tone: "hi", inner }) + top, [shape], { part: "energy", attrs: ` data-barrel="${n}"` });
    BARRELS.push(n++);
  }
  // compressor tank and the Coup de Burst barrel along the stern axis
  cyl("energy.tank", -104.5, 13, 4.4, Z.floor, 78, { tone: "mid" }, { part: "energy", inner: Ln([58, 70].map((z) => k.sideArc(-104.5, 13, 4.4, z, P, 24)).join(""), { tone: "faint" }), extra: Ln(k.ring(-104.5, 13, 2, 78, P, 16), { tone: "lo" }) });
  const C = G.frameOf([ENERGY.x0, 13, 61], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  box("coup.mount", [-127, 6, Z.floor], [-117, 20, Z.floor + 1.5], { tone: "lo" }, { part: "coup" });
  disc("coup.barrel", C, 0, 9, 5.6, { tone: "hi" }, { part: "coup", owner: "coup", inner: Ln(G.arcOf(C, 4, 5.6, P), { tone: "faint" }) });
  disc("coup.barrel", C, 11, 22, 5.6, { tone: "hi" }, { part: "coup", owner: "coup", inner: Ln(G.arcOf(C, 17, 5.6, P), { tone: "faint" }) });
  disc("coup.band", C, 9, 11, 6.4, { tone: "mid" }, { part: "coup", owner: "coup" });
  disc("coup.breech", C, 22, 28, 7.5, { tone: "mid" }, { part: "coup", owner: "coup", extra: Dots(G.dotsOf(C, 28, 5.6, 10, P, { fade: [0.04, 0.42] }), { size: 0.45, tone: "hi" }) });
  disc("coup.duct", C, 28, 37.2, 2, { tone: "mid" }, { part: "coup", owner: "coup" });
}

// ---------- aquarium bar (cutaway near the bow) ----------
{
  const tank = { x: 66, y: 30, w: 24, d: 16, r: 1.2 };
  box("aqua.tank.base", [65, 29, Z.floor], [91, 47, Z.floor + 3], { tone: "lo" }, { part: "aquarium", r: 1.4, steps: 3, bevel: 0.3 });
  const glass = S(k.slabOf(tank, Z.floor + 3, 20, P, 3, 0.4), { tone: "hi", inner: Ln(k.sideSeam(tank, Z.floor + 19, P, 3), { tone: "lo" }) });
  // fish and bubbles drawn in the plane of the tank's front glass (y = 46)
  const face = planeMatrix([0, tank.y + tank.d + 0.02, 0], [1, 0, 0], [0, 0, -1]);
  const fish = (x, z, s, flip = 1) => {
    const p = (u, v) => `${f2(x + u * s * flip)} ${f2(-(z + v * s))}`;
    return `M${p(-3, 0)}Q${p(-1, 1.6)} ${p(1.6, 0.6)}L${p(3, 1.4)}L${p(3, -1.4)}L${p(1.6, -0.6)}Q${p(-1, -1.6)} ${p(-3, 0)}Z`;
  };
  const fishes = [fish(72, 61, 1.3), fish(83, 66, 1.1, -1), fish(76, 70, 0.9, -1), fish(86, 59.5, 0.9)].join("");
  const bubbles = [[80, 63, 0.6], [80.6, 66, 0.45], [79.6, 69, 0.5], [70, 66, 0.4], [70.6, 69, 0.35]];
  const weed = `M69 ${-(Z.floor + 3)}Q67.6 -62 69.4 -66Q70.8 -60 69 ${-(Z.floor + 3)}ZM88 ${-(Z.floor + 3)}Q86.6 -61 88.4 -64Q89.8 -59 88 ${-(Z.floor + 3)}Z`;
  const tankFace = `<g transform="${face}"><path class="sn-water" d="M${tank.x + 1} ${-(Z.floor + 18)}H${tank.x + tank.w - 1}V${-(Z.floor + 3.6)}H${tank.x + 1}Z"/><path class="sn-fish" d="${weed}"/><path class="sn-fish" d="${fishes}"/>${bubbles.map(([x, z, r]) => `<circle class="sn-bubble" cx="${x}" cy="${-z}" r="${r}"/>`).join("")}</g>`;
  put("aqua.tank", [78, 38, 65], glass + tankFace, [record(A.slab(tank, Z.floor + 3, 20, { name: "aqua.tank" }, 3))], { part: "aquarium" });
  box("aqua.counter", [66, 4, Z.floor], [90, 12, Z.floor + 9], { tone: "mid" }, { part: "aquarium", r: 1.4, steps: 3 });
  box("aqua.counter.top", [65, 3, Z.floor + 9], [91, 13, Z.floor + 10.6], { tone: "hi" }, { part: "aquarium", r: 1.8, steps: 3, bevel: 0.3 });
  for (const x of [63.2, 93]) {
    cyl("aqua.stool.post", x, 40, 0.9, Z.floor, Z.floor + 6, { tone: "lo" }, { part: "aquarium", owner: `stool${x}`, steps: 14 });
    cyl("aqua.stool.seat", x, 40, 2.6, Z.floor + 6, Z.floor + 7.2, { tone: "hi" }, { part: "aquarium", owner: `stool${x}`, steps: 24 });
  }
}

// ---------- deck: lawn, railings, bow pedestal ----------
const LAWN = { x: -84, y: -44, w: 178, d: 88, r: 18 };
{
  const pts = [];
  for (let x = LAWN.x + 4; x < LAWN.x + LAWN.w - 3; x += 4.2)
    for (let y = LAWN.y + 3; y < LAWN.y + LAWN.d - 2; y += 4.2) {
      const jx = x + ((Math.sin(x * 12.9 + y * 78.2) * 43758.5) % 1) * 1.2;
      const jy = y + ((Math.sin(x * 39.3 + y * 11.1) * 24634.6) % 1) * 1.2;
      const inside = (() => {
        const px = Math.min(Math.max(jx, LAWN.x + LAWN.r), LAWN.x + LAWN.w - LAWN.r);
        const py = Math.min(Math.max(jy, LAWN.y + LAWN.r), LAWN.y + LAWN.d - LAWN.r);
        return Math.hypot(jx - px, jy - py) < LAWN.r - 1.6;
      })();
      if (inside && Math.hypot(jx - MAST.x, jy - MAST.y) > 12) pts.push(at([jx, jy, Z.deck + 0.05]));
    }
  const svg = `<path class="sn-lawn" d="${k.extrude(k.ringOf(LAWN, 8), Z.deck, 0.05, P).top}"/>` + Ln(k.planOutline(LAWN, Z.deck + 0.05, P, 8), { tone: "lo" }) + Dots(pts, { size: 0.42, tone: "lo" });
  put("lawn", [LAWN.x + LAWN.w / 2, 0, Z.deck + 0.03], svg, [record(A.slab(LAWN, Z.deck, 0.05, { name: "lawn" }))], { part: "lawn", bias: -0.5 });
}
// railings: posts plus a cap rail on each side, ending at the stern cabin and at the bow pedestal
const RAIL_Z = [Z.deck, Z.deck + 8];
{
  const xs = [];
  for (let x = -88; x <= 148; x += 15.7) xs.push(x);
  const inset = 1.6;
  for (const side of [1, -1]) {
    for (const x of xs) {
      const y = side * (beam(x) - inset);
      cyl("rail.post", x, y, 0.8, RAIL_Z[0], RAIL_Z[1], { tone: "mid" }, { part: "", steps: 12, owner: `rail${side}` });
    }
    const outer = [];
    const inner = [];
    for (let x = -88; x <= 148.01; x += 2.5) {
      outer.push([x, side * (beam(x) - inset + 0.9)]);
      inner.push([x, side * (beam(x) - inset - 0.9)]);
    }
    // the cap rail is cut into short convex pieces so the far rail sorts behind the mast
    for (let i = 0; i < outer.length - 1; i += 6) {
      const j = Math.min(outer.length - 1, i + 6);
      const piece = [...outer.slice(i, j + 1), ...inner.slice(i, j + 1).reverse()];
      slab("rail.cap", piece, RAIL_Z[1], RAIL_Z[1] + 1.2, { tone: "hi" }, { owner: `rail${side}` });
    }
  }
}
// bow pedestal and the lion figurehead (Sunny-kun)
{
  box("lion.pedestal", [148, -8, Z.deck], [162, 8, 121], { tone: "mid" }, { part: "lion", owner: "lion", r: 2, steps: 3, bevel: 0.4, inner: Ln(k.sideSeam({ x: 148, y: -8, w: 14, d: 16, r: 2 }, 110, P, 3), { tone: "faint" }) });
  const C = [162, 0, 132];
  const F = G.frameOf(C, [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  disc("lion.mane", F, 0, 6, 22, { tone: "hi" }, { part: "lion", owner: "lion", inner: Ln(G.arcOf(F, 3, 22, P), { tone: "faint" }) });
  for (let i = 0; i < 14; i++) {
    const a = ((i + 0.5) / 14) * Math.PI * 2;
    const c3 = G.add3(C, [6, 27.3 * Math.cos(a), 27.3 * Math.sin(a)]);
    ball("lion.petal", c3, 5.2, { tone: "hi" }, { part: "lion", owner: "lion" });
  }
  disc("lion.face", F, 6, 9, 15.5, { tone: "hi" }, { part: "lion", owner: "lion" });
  const faceM = planeMatrix([171.02, 0, 132], [0, 1, 0], [0, 0, -1]);
  const eyes = `<g transform="${faceM}"><circle class="sn-eye" cx="-5.8" cy="-5.2" r="1.2"/><circle class="sn-eye" cx="5.8" cy="-5.2" r="1.2"/></g>`;
  put("lion.eyes", [171.1, 0, 135], eyes, [record(A.box([171, -9, 128], [171.1, 9, 141], { name: "lion.eyes", owner: "lion" }))], { part: "lion", bias: 0.1 });
  const MZ = [176, 0, 128.6];
  ball("lion.muzzle", MZ, 5, { tone: "hi" }, { part: "lion", owner: "lion" });
  ball("lion.nose", G.add3(MZ, G.mul3(G.unit3([0.5, 0, 0.866]), 6.8)), 1.8, { tone: "mid" }, { part: "lion", owner: "lion" });
  // the Gaon Cannon muzzle in the lion's mouth
  const M = G.frameOf(MZ, [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const s0 = Math.sqrt(25 - 2.4 * 2.4);
  disc("gaon.muzzle", M, s0, s0 + 2, 2.4, { tone: "mid" }, { part: "gaon", owner: "lion", extra: `<path class="sn-bore" d="${G.circleOf(M, s0 + 2, 1.5, P, 32)}"/>` });
}

// ---------- main mast, sail and crow's nest ----------
{
  const mx = MAST.x;
  cyl("mast.bench", mx, 0, 10, Z.deck, Z.deck + 4, { tone: "mid" }, { part: "mast", owner: "mast", steps: 48, bevel: 0.4 });
  cyl("mast.foot", mx, 0, 6.4, Z.deck + 4, Z.deck + 8, { tone: "lo" }, { part: "mast", owner: "mast", steps: 32 });
  cyl("mast", mx, 0, 4.5, Z.deck + 8, 213, { tone: "hi" }, { part: "mast", owner: "mast", steps: 32, inner: Ln([130, 170, 200].map((z) => k.sideArc(mx, 0, 4.5, z, P, 20)).join(""), { tone: "faint" }) });
  cyl("mast.upper", mx, 0, 4.5, 219, 232, { tone: "hi" }, { part: "mast", owner: "mast", steps: 32 });
  cyl("mast.collar", mx, 0, 5.6, 213, 219, { tone: "mid" }, { part: "sail", owner: "mast", steps: 28 });
  const YF = G.frameOf([mx + 7.6, -58, 217], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  disc("sail.yard", YF, 0, 116, 2.1, { tone: "mid" }, { part: "sail", owner: "mast", extra: "" });
  for (const s of [0, 116]) disc("sail.yardarm", YF, s === 0 ? -2.4 : 116, s === 0 ? 0 : 118.4, 1.2, { tone: "lo" }, { part: "sail", owner: "mast" });
  // the sail hangs from the yard; the jolly roger is drawn in its plane
  const SF = G.frameOf([mx + 7.6, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const sailPoly = [[-52, 214.9], [52, 214.9], [55, 160], [52, 138], [36, 132], [0, 129], [-36, 132], [-52, 138], [-55, 160]];
  const roger = (() => {
    const m = planeMatrix([mx + 8.82, 0, 175], [0, 1, 0], [0, 0, -1]);
    return `<g transform="${m}" class="sn-roger">
<path class="sn-bone" d="M-17 -11L17 13M-17 13L17 -11"/>
<circle class="sn-knob" cx="-18.2" cy="-12.6" r="1.6"/><circle class="sn-knob" cx="-15.6" cy="-13.6" r="1.6"/>
<circle class="sn-knob" cx="18.2" cy="-12.6" r="1.6"/><circle class="sn-knob" cx="15.6" cy="-13.6" r="1.6"/>
<circle class="sn-knob" cx="-18.2" cy="14.6" r="1.6"/><circle class="sn-knob" cx="-15.6" cy="15.6" r="1.6"/>
<circle class="sn-knob" cx="18.2" cy="14.6" r="1.6"/><circle class="sn-knob" cx="15.6" cy="15.6" r="1.6"/>
<path class="sn-skull" d="M-10 2C-10 -9 10 -9 10 2C10 6 7 7.6 6 8.4L6 11.6L-6 11.6L-6 8.4C-7 7.6 -10 6 -10 2Z"/>
<circle class="sn-socket" cx="-4" cy="2" r="2.4"/><circle class="sn-socket" cx="4" cy="2" r="2.4"/>
<path class="sn-hat" d="M-16 -4.4C-16 -7.4 16 -7.4 16 -4.4C16 -1.6 -16 -1.6 -16 -4.4Z"/>
<path class="sn-crown" d="M-9 -5.6C-9 -15 9 -15 9 -5.6Z"/>
<path class="iso-line" data-tone="lit" d="M-9 -7.4C-3 -6.4 3 -6.4 9 -7.4"/>
</g>`;
  })();
  prism("sail", SF, sailPoly, 0, 1.2, { tone: "hi" }, { part: "sail", owner: "mast", extra: roger });
  cyl("nest.floor", mx, 0, 18.5, 232, 235, { tone: "lo" }, { part: "mast", owner: "mast", steps: 56, bevel: 0.4 });
  const winLines = k.knurl(mx, 0, 15, 239, 249.5, 18, P, 0.2);
  cyl("nest", mx, 0, 15, 235, 254, { tone: "hi" }, { part: "mast", owner: "mast", steps: 56, inner: Ln(k.sideArc(mx, 0, 15, 239, P, 40) + k.sideArc(mx, 0, 15, 249.5, P, 40), { tone: "lo" }) + Ln(winLines, { tone: "lo" }) });
  const RF = G.frameOf([mx, 0, 254], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  const domeR = (s) => 16.5 * Math.sqrt(Math.max(0, 1 - Math.pow(s / 11, 2)));
  const domeS = (s) => (s >= 10.99 ? -40 : (-16.5 * (s / 121)) / Math.sqrt(Math.max(1e-4, 1 - Math.pow(s / 11, 2))));
  const dome = Array.from({ length: 24 }, (_, i) => {
    const s = (i / 23) * 10.6;
    return [s, domeR(s), 1];
  });
  turned("nest.roof", RF, dome, { tone: "mid" }, { part: "mast", owner: "mast", smooth: { slope: domeS, radius: domeR } });
  cyl("mast.top", mx, 0, 1.5, 254 + 10.6, 290, { tone: "mid" }, { part: "mast", owner: "mast", steps: 16 });
  const FF = G.frameOf([mx, 0, 0], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  prism("mast.pennant", FF, [[1.4, 289], [16, 285], [1.4, 281]], -0.3, 0.3, { tone: "hi" }, { part: "mast", owner: "mast" });
  // shrouds from the nest floor down to the deck
  for (const side of [-1, 1]) {
    line(`shroud${side}a`, [[mx - 4, side * 15, 232], [mx - 14, side * 40, Z.deck + 0.05]], 0.45, { part: "mast", tone: "mid" });
    line(`shroud${side}b`, [[mx - 9, side * 12.5, 232], [mx - 33, side * 31, Z.deck + 0.05]], 0.45, { part: "mast", tone: "mid" });
  }
}

// ---------- stern cabin: kitchen/dining below, library/navigation room above, tangerine trees ----------
{
  const LOW = hullRing(-146, -92, { s: 0.9 });
  const faceY = 0.9 * W;
  const side = planeMatrix([0, faceY + 0.02, 0], [1, 0, 0], [0, 0, -1]);
  const front = planeMatrix([-91.98, 0, 0], [0, 1, 0], [0, 0, -1]);
  const portholes = [-126, -114, -102].map((x) => `<circle class="sn-port" cx="${x}" cy="-114" r="3.4"/><circle class="iso-line" data-tone="lo" cx="${x}" cy="-114" r="4.4"/>`).join("");
  const frontFace = `<g transform="${front}"><path class="sn-door" d="M-6 -${Z.deck}V-117Q-6 -121 -2 -121H2Q6 -121 6 -117V-${Z.deck}Z"/><circle class="sn-knobdot" cx="3.6" cy="-108" r="0.7"/>${[-30, -18, 18, 30].map((y) => `<circle class="sn-port" cx="${y}" cy="-115" r="3.4"/><circle class="iso-line" data-tone="lo" cx="${y}" cy="-115" r="4.4"/>`).join("")}</g>`;
  slab("cabin.lower", LOW, Z.deck, 129, { tone: "mid" }, { part: "kitchen", bevel: 0.5, inner: plank(LOW, [104]), extra: `<g transform="${side}">${portholes}</g>${frontFace}` });
  const UP = { x: -144, y: -32, w: 30, d: 64, r: 4 };
  const uside = planeMatrix([0, 32.02, 0], [1, 0, 0], [0, 0, -1]);
  const ufront = planeMatrix([-113.98, 0, 0], [0, 1, 0], [0, 0, -1]);
  const win = (u, z) => `<path class="sn-port" d="M${u - 3.6} ${-z - 4}H${u + 3.6}V${-z + 4}H${u - 3.6}Z"/><path class="iso-line" data-tone="lo" d="M${u - 3.6} ${-z - 4}H${u + 3.6}V${-z + 4}H${u - 3.6}ZM${u} ${-z - 4}V${-z + 4}M${u - 3.6} ${-z}H${u + 3.6}"/>`;
  box("cabin.upper", [UP.x, UP.y, 129], [UP.x + UP.w, UP.y + UP.d, 148], { tone: "mid" }, { part: "library", r: 4, steps: 4, bevel: 0.4, extra: `<g transform="${uside}">${win(-136, 138)}${win(-124, 138)}</g><g transform="${ufront}">${win(-18, 138)}${win(0, 138)}${win(18, 138)}</g>` });
  box("cabin.roof", [UP.x - 2, UP.y - 2, 148], [UP.x + UP.w + 2, UP.y + UP.d + 2, 151], { tone: "hi" }, { part: "library", r: 5, steps: 4, bevel: 0.5 });
  box("cabin.vent", [-134, -6, 151], [-124, 6, 154], { tone: "lo" }, { part: "library", r: 1, steps: 2 });
  // tangerine trees in a planter on the cabin roof
  box("mikan.planter", [-110, -34, 129], [-98, 34, 133], { tone: "mid" }, { part: "mikan", r: 2, steps: 3, bevel: 0.3, inner: Ln(k.sideSeam({ x: -110, y: -34, w: 12, d: 68, r: 2 }, 131, P, 3), { tone: "faint" }) });
  for (const y of [-21, 0, 21]) {
    cyl("mikan.trunk", -104, y, 1.3, 133, 139.4, { tone: "lo" }, { part: "mikan", owner: `tree${y}`, steps: 12 });
    const c = [-104, y, 145];
    const fruit = [[-1.4, 4.6, 2.4], [3.6, 3.2, -0.8], [0.6, 5.2, -3.4], [-3.8, 3.4, 1.4]].map(([dx, dy, dz]) => at([c[0] + dx, c[1] + dy, c[2] + dz]));
    ball("mikan.crown", c, 6, { tone: "mid" }, { part: "mikan", owner: `tree${y}`, extra: Dots(fruit, { size: 0.85, tone: "hi" }) });
  }
}

// ---------- settle the painter's order ----------
A.settle(R, P);
R.items.sort((a, b) => a.key - b.key);

const groups = R.items.map((item, index) => `<g class="it" data-i="${index}" data-name="${item.name}"${item.attrs ?? ""}>${item.svg}</g>`);
const svgBody = [`<defs>${CLIPS.join("")}</defs>`, ...STAND, `<g class="sn-puffs" data-puffs></g>`, `<g class="sn-ship" data-ship-root>${groups.join("")}</g>`];

// ---------- page data shared with the live script ----------
const muzzle = [ENERGY.x0 - 6, 13, 61];
const DATA = {
  P,
  lift: k.axisVector(P, [0, 0, 1]),
  out: k.axisVector(P, [0, 1, 0]),
  up: k.axisVector(P, [0, 0, 1]),
  LIFT,
  scale: KS,
  OUT,
  RAIL_OUT,
  SHUTTER: Z.m2 - Z.floor,
  PADDLE_OUT: PADDLE.out,
  dial: DIAL_ANGLES,
  barrels: BARRELS.length,
  puff: { at: muzzle, back: k.axisVector(P, [-1, 0, 0]), from: at(muzzle) },
  parts: PART_ORDER,
};

const CSS = readFileSync(join(HERE, "sunny.css"), "utf8");
const LIVE = readFileSync(join(HERE, "live.js"), "utf8");

function pageFor(lang, theme) {
  const T = TEXT[lang];
  const svg = k.figureSvg({ width: WIDTH, height: HEIGHT, label: T.svgLabel, body: svgBody });
  const channels = T.channels
    .map((ch, c) => `<button type="button" class="sn-ch" data-ch="${c}" aria-pressed="false"><span class="sn-num">${c}</span>${escapeHtml(ch.name)}</button>`)
    .join("");
  const legend = PART_ORDER.map((id, i) => `<button type="button" class="sn-part" data-part="${id}" aria-pressed="false"><span class="sn-num">${String(i + 1).padStart(2, "0")}</span>${escapeHtml(T.parts[id].name)}</button>`).join("");
  const plate = `<figure class="iso-figure sn-figure"><div class="iso-plate"><div class="iso-plate-corners" aria-hidden="true"><span class="iso-plate-corner" data-corner="fig">${T.fig}</span><span class="iso-plate-corner" data-corner="title">${escapeHtml(T.title)}</span><span class="iso-plate-corner" data-corner="hint">${escapeHtml(T.hint)}</span><span class="iso-plate-corner" data-corner="readout" data-readout></span></div><div class="iso-stage sn-stage" tabindex="0" role="group" aria-label="${escapeHtml(T.stageLabel)}">${svg}</div><span class="sn-sr" role="status" aria-live="polite" data-live></span></div>
<figcaption class="iso-legend sn-legend">
<div class="sn-controls"><div class="sn-row" role="group" aria-label="${escapeHtml(T.channelsLabel)}">${channels}</div><div class="sn-row"><button type="button" class="sn-act" data-fire><span>${escapeHtml(T.fire)}</span><kbd>${T.fireKey}</kbd></button><button type="button" class="sn-act" data-refill><span>${escapeHtml(T.refill)}</span><kbd>${T.refillKey}</kbd></button><button type="button" class="sn-act" data-close><span>${escapeHtml(T.close)}</span><kbd>${T.closeKey}</kbd></button></div></div>
<div class="sn-parts" role="group" aria-label="${escapeHtml(T.partsLabel)}">${legend}</div>
<p class="iso-caption sn-caption" data-caption>${escapeHtml(T.caption)}</p>
</figcaption></figure>`;
  const live = LIVE.replace("__DATA__", JSON.stringify(DATA)).replace("__TEXT__", JSON.stringify(T));
  let html = k.pageHtml({ title: T.pageTitle, theme, body: `<style>${CSS}</style>${plate}`, script: kitScript() + live, width: 900 });
  html = html.replace('<html lang="en">', `<html lang="${lang}">`);
  return html;
}
function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

for (const lang of ["ja", "en"]) {
  for (const theme of ["dark", "light"]) {
    const name = `sunny-${lang}${theme === "light" ? "-light" : ""}.html`;
    const html = pageFor(lang, theme);
    writeFileSync(join(HERE, name), html);
    console.log("wrote", name, `${(html.length / 1024).toFixed(0)} KB`);
  }
}
console.log(`${R.items.length} items · ${R.solids.length} solids · scale ${KS.toFixed(3)}`);

A.auditOrExit(R, P, {});
