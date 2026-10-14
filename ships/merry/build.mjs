// Going Merry, isometric cutaway. `node ships/merry/build.mjs` writes four pages
// next to this file: merry-ja(.html|-light.html) and merry-en(.html|-light.html).
//
// The object: the ship herself with the near half cut away (hull, deck, floor and
// cabin, from x = XC0 to XC1), so the rooms below deck and the keel along the
// bottom show. The keel is the explanation: every rib rises from it, and it is
// the part that could not be repaired at Water 7.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../anatomy/kit/iso-kit.mjs";
import * as G from "../anatomy/kit/lathe.mjs";
import { tubePieces, tubeSvg } from "../anatomy/kit/tube.mjs";
import { kitScript } from "../anatomy/scripts/inline-kit.mjs";
import { shellPaths, visibleRuns } from "./shell.mjs";
import { sailParts, SAIL } from "./sail.mjs";
import { TEXT, ORDER } from "./text.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

// ---------- camera ----------
const W = 760;
const H = 580;
const AZ = 62;
const EL = 26;

// ---------- hull model (world units, x to the bow, y to the near side, z up) ----------
const T = 2.5; // planking
const ZD = 50; // main deck top
const ZF = 12; // hold floor top
const XC0 = -128; // cutaway from here ...
const XC1 = 130; // ... to here
const YC = 8; // near half removed beyond this y inside the cut
const XBOW = 149.4;
const MX = 10; // main mast
const XSTERN = -150;

const zk = (x) => (x >= 90 ? 60 - Math.sqrt(Math.max(0, 3600 - (x - 90) ** 2)) : x <= -110 ? 12 * ((-110 - x) / 40) ** 2 : 0);
const zg = (x) => 60 + 10 * Math.max(0, x / 150) ** 2 + (x < -100 ? 4 * ((-100 - x) / 50) ** 2 : 0);
const B = (x) => (x >= -10 ? 50 * Math.sqrt(Math.max(0, 1 - ((x + 10) / 160) ** 2)) : 50 - 16 * ((-10 - x) / 140) ** 2);
const Sf = (u) => Math.sin(1.08 * (Math.PI / 2) * Math.pow(Math.max(0, u), 0.75));
const hull = (x, u, side, inset = 0) => [x, side * Math.max(0, B(x) - inset) * Sf(u), zk(x) + (zg(x) - zk(x)) * u];
const uAt = (x, z) => (z - zk(x)) / (zg(x) - zk(x));
const halfAt = (x, z, inset = T) => {
  const u = uAt(x, z);
  if (u <= 0) return 0;
  return Math.max(0, B(x) - inset) * Sf(Math.min(1, u));
};
function hullNormal(x, u, side, inset = 0) {
  const e = 0.01;
  const du = G.sub3(hull(x + e, u, side, inset), hull(x - e, u, side, inset));
  const dv = G.sub3(hull(x, Math.min(1, u + e), side, inset), hull(x, Math.max(0.0005, u - e), side, inset));
  return G.mul3(G.unit3(G.cross3(du, dv)), -side); // outward
}

const P = k.fitProjection(
  [
    ...k.boxCorners({ x: -205, y: -90, w: 405, d: 180, r: 14 }, -26, -18),
    [10, 0, 268],
    [16, -66, 192],
    [16, 66, 192],
    [176, 0, 92],
  ],
  W,
  H,
  { pad: 16, azimuth: AZ, elevation: EL },
);
const V = G.viewOf(P);
const KS = G.scaleOf(P);
const at = (p) => k.iso(p, P);
const path3 = (pts, closed = false) => k.pathOf(pts.map(at), closed);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const Dots = (pts, style) => k.dotsSvg(pts, style);
const depth = (p) => G.dot3(p, V);
const box = (x0, y0, z0, x1, y1, z1, r = 0.5, steps = 2, bevel = 0) => k.slabOf({ x: x0, y: y0, w: x1 - x0, d: y1 - y0, r }, z0, z1 - z0, P, steps, bevel);
let PARTS = 0;
const count = (n = 1) => (PARTS += n);
const it = (svg, p) => `<g class="it"${p ? ` data-p="${p}"` : ""}>${svg}</g>`;

// ---------- general prism (from the arcade cabinet example) ----------
const signed = (poly) => poly.reduce((a, [x, y], i) => {
  const [x2, y2] = poly[(i + 1) % poly.length];
  return a + x * y2 - x2 * y;
}, 0);
const screenOriented = (pts) => (signed(pts) < 0 ? [...pts].reverse() : pts);
function runsOf(flags, want) {
  const n = flags.length;
  const runs = [];
  const start = flags.findIndex((flag, index) => flag !== flags[(index + n - 1) % n]);
  if (start < 0) return flags[0] === want ? [Array.from({ length: n + 1 }, (_, index) => index % n)] : [];
  let run = null;
  for (let step = 0; step < n; step++) {
    const index = (start + step) % n;
    if (flags[index] === want) {
      if (!run) run = [index];
      run.push((index + 1) % n);
    } else if (run) {
      runs.push(run);
      run = null;
    }
  }
  if (run) runs.push(run);
  return runs;
}
function prismPaths(F, poly, s0, s1) {
  const ring = signed(poly) > 0 ? poly : [...poly].reverse();
  const n = ring.length;
  const W3 = (s, [x, y]) => [F.o[0] + F.a[0] * s + F.u[0] * x + F.v[0] * y, F.o[1] + F.a[1] * s + F.u[1] * x + F.v[1] * y, F.o[2] + F.a[2] * s + F.u[2] * x + F.v[2] * y];
  const capNear = G.dot3(F.a, V) > 0;
  const [nearS, farS] = capNear ? [s1, s0] : [s0, s1];
  const near = ring.map((p) => at(W3(nearS, p)));
  const far = ring.map((p) => at(W3(farS, p)));
  const normals = ring.map(([x0, y0], i) => {
    const [x1, y1] = ring[(i + 1) % n];
    return G.unit3(G.add3(G.mul3(F.u, y1 - y0), G.mul3(F.v, -(x1 - x0))));
  });
  const facing = normals.map((m) => G.dot3(m, V) > 1e-9);
  const outline = [];
  const crease = [];
  for (const run of runsOf(facing, false)) outline.push(k.pathOf(run.map((i) => near[i])));
  for (const run of runsOf(facing, true)) {
    crease.push(k.pathOf(run.map((i) => near[i])));
    outline.push(k.pathOf(run.map((i) => far[i])));
  }
  for (let i = 0; i < n; i++) if (facing[(i + n - 1) % n] !== facing[i]) outline.push(k.pathOf([near[i], far[i]]));
  const parts = [k.pathOf(screenOriented(near), true), k.pathOf(screenOriented(far), true)];
  const buckets = [[], [], [], [], []];
  for (let i = 0; i < n; i++) {
    if (!facing[i]) continue;
    const quad = screenOriented([near[i], near[(i + 1) % n], far[(i + 1) % n], far[i]]);
    parts.push(k.pathOf(quad, true));
    buckets[G.toneOf(normals[i], P)].push(k.pathOf(quad, true));
  }
  const capTone = G.toneOf(capNear ? F.a : G.mul3(F.a, -1), P);
  buckets[capTone].push(k.pathOf(screenOriented(near), true));
  return { fill: parts.join(""), outline: outline.join(""), crease: crease.join(""), top: buckets[4].join(""), shades: buckets.slice(0, 4).map((b) => b.join("")) };
}
const FX = G.frameOf([0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]); // polygon (y, z), along x
const FY = G.frameOf([0, 0, 0], [0, -1, 0], [1, 0, 0], [0, 0, 1]); // polygon (x, z), along -y
const sideSolid = (poly, y0, y1, style) => S(prismPaths(FY, poly, -y1, -y0), style);
const crossSolid = (poly, x0, x1, style) => S(prismPaths(FX, poly, x0, x1), style);

// A flat face given by world points, shaded by its normal.
function face(points, normal) {
  const d = path3(points, true);
  const tone = G.toneOf(normal, P);
  const shades = ["", "", "", ""];
  let top = "";
  if (tone === 4) top = d;
  else shades[tone] = d;
  return { fill: d, outline: d, crease: "", top, shades };
}

// ---------- grids ----------
const spread = (a, b, n, bias = 1) => Array.from({ length: n + 1 }, (_, i) => a + (b - a) * Math.pow(i / n, bias));
function stationsBetween(x0, x1) {
  const out = [];
  let x = x0;
  while (x < x1 - 1e-6) {
    out.push(x);
    x += x > 128 ? 1.6 : x > 100 ? 3 : 6;
  }
  out.push(x1);
  return out;
}
function hullGrid(xs, us, side, inset) {
  const grid = xs.map((x) => us.map((u) => hull(x, u, side, inset)));
  const normals = xs.map((x) => us.map((u) => {
    const n = hullNormal(x, Math.max(0.002, u), side, inset);
    return inset > 0 ? G.mul3(n, -1) : n; // inner faces look into the hull
  }));
  return { grid, normals };
}
const US = spread(0, 1, 16, 1.25);

// ---------- layers ----------
const sea = [];
const back = [];
const bilge = [];
const hold = [];
const deck = [];
const top = [];
const front = [];

// ---------- sea tile ----------
const TILE = { x: -205, y: -90, w: 405, d: 180, r: 14 };
sea.push(S(k.slabOf(TILE, -26, 8, P, 8, 1.6), { tone: "lo", inner: Ln(k.sideSeam(TILE, -22, P, 8), { tone: "faint" }) }));
sea.push(Ln(k.planOutline(k.insetPlan(TILE, 5), -18, P), { tone: "faint" }));
const tileScrews = k.corners(TILE, 11);
sea.push(Ln(tileScrews.map(([x, y]) => k.ring(x, y, 2.2, -18, P, 16)).join(""), { tone: "lo" }));
sea.push(Dots(tileScrews.map(([x, y]) => at([x, y, -18])), { size: 0.5 }));
count(5);
const CRESTS = [[-178, -60, 34], [-120, -74, 40], [-40, -70, 30], [40, -76, 36], [120, -66, 44], [168, -40, 22], [-180, 44, 26], [-130, 62, 44], [-60, 70, 30], [10, 62, 40], [90, 70, 34], [150, 58, 30], [184, 20, 14], [-190, -10, 12]];
sea.push(Ln(CRESTS.map(([x, y, w]) => k.planOutline({ x: x - w / 2, y: y - 1.2, w, d: 2.4, r: 1.2 }, -18, P, 4)).join(""), { tone: "faint" }));
const STRIP = { x: -150, y: TILE.y + TILE.d - 12, w: 300, d: 6, r: 1 };
sea.push(S(k.slabOf(STRIP, -18, 0.6, P, 3), { tone: "lo", crease: "none" }));
const ticks = k.topTicks(STRIP.x + 4, STRIP.x + STRIP.w - 4, 5, 5, STRIP.y, -17.4, [1.8, 3.4], P);
sea.push(Ln(ticks.minor, { tone: "lo" }), Ln(ticks.major, { tone: "mid" }));
const LABEL = { x: -196, y: TILE.y + TILE.d - 26, w: 34, d: 14, r: 1.2 };
sea.push(S(k.slabOf(LABEL, -18, 0.8, P, 3), { tone: "lo", crease: "none" }));
sea.push(Ln(k.planOutline(k.insetPlan(LABEL, 1.4), -17.2, P, 3), { tone: "faint" }));
sea.push(Ln([22, 15, 18].map((w, i) => k.lineOnTop([LABEL.x + 4, LABEL.y + 3.6 + i * 3.2], [LABEL.x + 4 + w, LABEL.y + 3.6 + i * 3.2], -17.2, P)).join(""), { tone: "lo", free: true }));
sea.push(Dots([at([LABEL.x + LABEL.w - 3, LABEL.y + 3, -17.2]), at([LABEL.x + LABEL.w - 3, LABEL.y + LABEL.d - 3, -17.2])], { size: 0.45 }));
count(4);
const HALO = `<path class="iso-halo mr-halo" d="${k.haloOf({ x: -165, y: -46, w: 330, d: 92, r: 44 }, -18, 3, P)}"/>`;

// ---------- far side, seen from inside ----------
const XS_ALL = stationsBetween(XSTERN, XBOW);
{
  const { grid, normals } = hullGrid(XS_ALL, US, -1, T);
  back.push(S(shellPaths(grid, P, { normals }), { tone: "mid" }));
  count();
}
// gunwale caps: far side runs the whole length, near side only on the bow and stern pieces
function capGrids(side, x0, x1) {
  const xs = stationsBetween(x0, x1);
  const hw = (x, inset) => Math.max(0, B(x) - inset) * Sf(1);
  const topGrid = xs.map((x) => [[x, side * hw(x, -0.8), zg(x) + 1.6], [x, side * hw(x, T + 0.6), zg(x) + 1.6]]);
  const faceInset = side > 0 ? -0.8 : T + 0.6;
  const faceGrid = xs.map((x) => [[x, side * hw(x, faceInset), zg(x)], [x, side * hw(x, faceInset), zg(x) + 1.6]]);
  const up = xs.map(() => [[0, 0, 1], [0, 0, 1]]);
  const out = xs.map((x) => {
    const n = hullNormal(x, 1, side, 0);
    const m = side > 0 ? n : G.mul3(n, -1);
    return [m, m];
  });
  return S(shellPaths(topGrid, P, { normals: up }), { tone: "mid" }) + S(shellPaths(faceGrid, P, { normals: out }), { tone: "mid" });
}
back.push(capGrids(-1, XSTERN, 146));
count();

// gun ports cut in the far bulwark
const PORTS = [-35, 35];
for (const px of PORTS) {
  const corner = (x, z) => hull(x, uAt(x, z), -1, T - 0.05);
  const quad = [corner(px - 4.5, 52.5), corner(px + 4.5, 52.5), corner(px + 4.5, 59), corner(px - 4.5, 59)];
  back.push(`<path class="mr-void" d="${path3(quad, true)}"/>` + Ln(path3(quad, true), { tone: "lo" }));
  count();
}

// ribs (frames) along the far side, from the floor timbers to the gunwale
const RIBS = Array.from({ length: 21 }, (_, i) => -140 + i * 14);
for (const x of RIBS) {
  const us = spread(Math.max(0.004, uAt(x, 6.5)), 0.985, 14, 1.2);
  const innerAt = (xx, u) => hull(xx, u, -1, T);
  const inN = (xx, u) => G.mul3(hullNormal(xx, Math.max(0.004, u), -1, T), -1);
  const frontGrid = [x - 1.6, x + 1.6].map((xx) => us.map((u) => G.add3(innerAt(xx, u), G.mul3(inN(xx, u), 2.6))));
  const frontN = [x - 1.6, x + 1.6].map((xx) => us.map((u) => inN(xx, u)));
  const sideGrid = us.map((u) => [innerAt(x + 1.6, u), G.add3(innerAt(x + 1.6, u), G.mul3(inN(x + 1.6, u), 2.6))]);
  const sideN = us.map(() => [[1, 0, 0], [1, 0, 0]]);
  bilge.push({ d: depth(hull(x, 0.5, -1, T)), svg: it(S(shellPaths(frontGrid, P, { normals: frontN }), { tone: "mid" }) + S(shellPaths(sideGrid, P, { normals: sideN }), { tone: "mid" }), "keel") });
  count();
}

// ---------- keel, stem and sternpost: one timber along the bottom ----------
const KEEL_DEEP = 9;
const KEEL_HALF = 3.5;
const profile = [[XSTERN, 70], [XSTERN, zk(XSTERN)]];
for (let x = XSTERN + 2; x < 148; x += 2) profile.push([x, zk(x)]);
for (let x = 148; x <= XBOW; x += 0.35) profile.push([x, zk(x)]);
profile.push([XBOW + 0.6, 66], [XBOW + 0.6, 78]);
function offsetLine(points, by) {
  return points.map((p, i) => {
    const a = points[Math.max(0, i - 1)];
    const b = points[Math.min(points.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const l = Math.hypot(dx, dz) || 1;
    return [p[0] + (dz / l) * by, p[1] + (-dx / l) * by];
  });
}
const KEEL_POLY = [...offsetLine(profile, KEEL_DEEP), ...offsetLine(profile, -1.2).reverse()];
{
  // scarf joints where the keel timbers meet, each held by four bolts
  const scarfs = [-78, 6, 82];
  const face = KEEL_HALF;
  const seams = scarfs.map((x) => path3([[x - 7, face, -KEEL_DEEP], [x - 7, face, -4.6], [x + 7, face, -3.4], [x + 7, face, 1.2]])).join("");
  const bolts = scarfs.flatMap((x) => [[x - 4, -6.6], [x - 4, -1.4], [x + 4, -6.6], [x + 4, -1.4]].map(([bx, bz]) => at([bx, face, bz])));
  bilge.push({ d: -1e6, svg: it(sideSolid(KEEL_POLY, -KEEL_HALF, KEEL_HALF, { tone: "hi", inner: Ln(seams, { tone: "lo" }) }) + Dots(bolts, { size: 0.5, tone: "mid" }), "keel") });
  count(6);
}
// floor timbers across the keel, the keelson on top of them, the mast step on the keelson
for (const x of RIBS.filter((x) => x > XC0 && x < 112)) {
  bilge.push({ d: depth([x, 0, 3]), svg: it(S(box(x - 1.6, -10, zk(x) + 0.8, x + 1.6, 4.6, 6.6, 0.3, 1), { tone: "mid" }), "keel") });
  count();
}
bilge.push({ d: depth([0, 0, 8]) + 100, svg: it(S(box(-118, -3.2, 6.6, 110, 3.2, 9.6, 0.6, 2, 0.4), { tone: "hi" }) + Dots(RIBS.filter((x) => x > -118 && x < 110).map((x) => at([x, 0, 9.6])), { size: 0.5, tone: "mid" }), "keel") });
count();

// ---------- rudder at the stern ----------
{
  const blade = [[-155.5, 4], [-155.5, 46], [-159.5, 48], [-167.5, 32], [-167.5, 9], [-163.5, 4]];
  let svg = sideSolid(blade, -2, 2, { tone: "hi" });
  for (const z of [12, 26, 40]) svg += S(box(-160, -2.8, z, -151, 2.8, z + 2.2, 0.4, 2), { tone: "mid" }) + Dots([at([-153, 2.8, z + 1.1])], { size: 0.45 });
  svg += S(box(-158.6, -1.6, 48, -155.6, 1.6, 92), { tone: "hi" });
  bilge.push({ d: depth([-160, 0, 30]), svg: it(svg, "rudder") });
  count(5);
}

// ---------- hold: floor, bulkheads, rooms ----------
// A deck or floor outline at height z: the far side runs stern to bow, the near
// side comes back along the hull outside the cutaway and along y = YC inside it.
function closedRing(z, inset, from, to, notches = []) {
  const xs = stationsBetween(from, to).filter((x) => halfAt(x, z, inset) > 0.4);
  const far = xs.map((x) => [x, -halfAt(x, z, inset)]);
  const nearBow = xs.filter((x) => x >= XC1).map((x) => [x, halfAt(x, z, inset)]).reverse();
  const nearStern = xs.filter((x) => x <= XC0).map((x) => [x, halfAt(x, z, inset)]).reverse();
  const join = [];
  if (nearBow.length) join.push(...nearBow, [XC1, YC]);
  for (const [x0, x1, yIn] of [...notches].sort((a, b) => b[0] - a[0])) join.push([x1, YC], [x1, yIn], [x0, yIn], [x0, YC]);
  join.push([XC0, YC]);
  if (nearStern.length) join.push(...nearStern);
  return [...far, ...join];
}
{
  const ring = closedRing(ZF, T, -146, 140, [[MX - 8, MX + 8, -7]]);
  hold.push({ d: -1e6, svg: it(S(k.extrude(ring, ZF - 2, 2, P, { convex: false }), { tone: "lo" })) });
  count();
}
const BULK = [-75, 60];
for (const bx of BULK) {
  const zs = spread(ZF, ZD - 2.5, 10);
  const poly = [...zs.map((z) => [-halfAt(bx, z, T) + 0.2, z]), [YC, ZD - 2.5], [YC, ZF]];
  const panels = [-28, -16, -4].map((y) => {
    const zt = ZD - 2.5;
    const zb = ZF;
    return path3([[bx + 1, y, zb], [bx + 1, y, zt]]);
  }).join("");
  hold.push({ d: depth([bx, 0, 30]) - 30, svg: it(crossSolid(poly, bx - 1, bx + 1, { tone: "mid", inner: Ln(panels, { tone: "faint" }) })) });
  count();
}

const H_ITEMS = [];
const hput = (p, centre, svg, bias = 0) => H_ITEMS.push({ d: depth(centre) + bias, svg: it(svg, p) });

// women's quarters (stern)
hput("women", [-106, -10, 16], S(box(-119, -17, ZF, -94, -3, 18, 0.6, 2, 0.3), { tone: "mid" }) + S(box(-118, -16.4, 18, -95, -3.6, 21, 1.4, 3), { tone: "hi" }) + S(box(-117, -15, 21, -110, -5, 23.4, 1.6, 3), { tone: "hi" }));
hput("women", [-120, -10, 20], S(box(-121, -17, ZF, -119, -3, 27, 0.4, 2, 0.3), { tone: "mid" }), -2);
hput("women", [-104, 2, 12], S(box(-112, -1, ZF, -97, 6.5, ZF + 0.4, 1, 3), { tone: "mid", crease: "none" }) + Ln(k.planOutline({ x: -110.5, y: 0.4, w: 12, d: 4.7, r: 0.6 }, ZF + 0.4, P, 3), { tone: "faint" }), -4);
hput("women", [-85, -11, 18], S(box(-90, -16, ZF, -80, -6, 23, 0.4, 2), { tone: "mid", inner: Ln(k.sideSeam({ x: -90, y: -16, w: 10, d: 10, r: 0.4 }, 17.5, P, 2), { tone: "faint" }) }) + S(box(-91, -17, 23, -79, -5, 24.4, 0.6, 2, 0.3), { tone: "hi" }) + Dots([at([-85, -6, 20.4])], { size: 0.5, tone: "hi" }));
hput("women", [-83, -13, 26], S(k.cylinder(-83, -13, 1.4, 24.4, 3.6, P, 16), { tone: "mid" }) + S(k.cylinder(-83, -13, 2.8, 28, 2.4, P, 24), { tone: "hi" }), 1);
hput("women", [-88, -9, 25], S(box(-90, -11, 24.4, -86, -7, 25.6, 0.3, 2), { tone: "hi" }), 1);
hput("women", [-85, 1, 16], S(box(-88, -2, ZF, -82, 4, 18.5, 0.6, 2), { tone: "mid" }) + S(box(-82.6, -2, 18.5, -82, 4, 27, 0.3, 2), { tone: "mid" }));
hput("women", [-123, -8, 24], S(box(-127, -15, ZF, -121, -2, 36, 0.5, 2, 0.4), { tone: "mid", inner: Ln(k.sideSeam({ x: -127, y: -15, w: 6, d: 13, r: 0.5 }, 24, P, 2), { tone: "faint" }) }) + Dots([at([-121, -6.5, 27]), at([-121, -10.5, 27])], { size: 0.5, tone: "hi" }));
count(12);

// storage hold (amidships) and the mast standing on the keel
function barrel(x, y, z0, h = 14, r = 6) {
  const hoops = [z0 + 2.6, z0 + h - 2.6].map((z) => k.sideArc(x, y, r, z, P, 24)).join("");
  return S(k.cylinder(x, y, r, z0, h, P, 40, 0.4), { tone: "hi", inner: Ln(hoops, { tone: "lo" }) }) + Ln(k.ring(x, y, r - 1.4, z0 + h, P, 32), { tone: "faint" }) + Dots([at([x + 1.4, y + 1.4, z0 + h])], { size: 0.55, tone: "mid" });
}
for (const [x, y] of [[-63, -13], [-50, -13], [-63, 0], [-50, 0]]) hput("hold", [x, y, 18], barrel(x, y, ZF));
hput("hold", [-56.5, -6.5, 33], barrel(-56.5, -6.5, ZF + 14, 12, 5.4), 10);
function crate(x0, y0, z0, s, h) {
  const plan = { x: x0, y: y0, w: s, d: s, r: 0.4 };
  return S(k.slabOf(plan, z0, h, P, 2, 0.4), { tone: "mid", inner: Ln(k.sideSeam(plan, z0 + h / 2, P, 2), { tone: "faint" }) }) + Ln(k.lineOnTop([x0, y0 + s / 2], [x0 + s, y0 + s / 2], z0 + h, P), { tone: "faint" });
}
hput("hold", [-24, -12, 18], crate(-30, -18, ZF, 12, 12));
hput("hold", [-24, -12, 28], crate(-29, -17, ZF + 12, 10, 9), 8);
hput("hold", [-24, 1, 17], crate(-30, -5, ZF, 12, 10));
hput("hold", [-7, -10, 14], S(k.cylinder(-7, -10, 7, ZF, 1.4, P, 40), { tone: "hi" }) + S(k.cylinder(-7, -10, 6.6, ZF + 1.4, 1.4, P, 40), { tone: "hi" }) + S(k.cylinder(-7, -10, 6.2, ZF + 2.8, 1.4, P, 40), { tone: "hi" }) + Ln(k.ring(-7, -10, 4.4, ZF + 4.2, P, 32) + k.ring(-7, -10, 2.4, ZF + 4.2, P, 24), { tone: "lo" }) + `<path class="mr-void" d="${k.pathOf(k.circleRing(-7, -10, 1.6, 16).map(([x, y]) => at([x, y, ZF + 4.2])), true)}"/>`);
hput("hold", [27, -13, 15], S(box(21, -19, ZF, 33, -8, 19, 3.4, 4), { tone: "hi" }) + Ln(k.lineOnTop([23, -13.5], [31, -13.5], 19, P), { tone: "faint" }));
hput("hold", [28, -1, 15], S(box(22, -6, ZF, 34, 4, 18, 3.2, 4), { tone: "hi" }), -1);
count(10);
// mast below deck: foot on the keelson (bilge layer), shaft through the hold
bilge.push({ d: depth([MX, 0, 6]), svg: it(S(box(MX - 7, -5, 9.6, MX + 7, 5, 11.2, 0.6, 2, 0.3), { tone: "mid" }), "mast") });
hput("mast", [MX, 0, 30], S(k.cylinder(MX, 0, 5, 11.2, ZD - 2.5 - 11.2, P, 48), { tone: "hi", inner: Ln(k.sideArc(MX, 0, 5, 30, P, 24), { tone: "faint" }) }), 4);
count(2);
// ladders under the hatches
function ladder(x, y0, y1) {
  let svg = S(box(x - 0.8, y0 - 0.8, ZF, x + 0.8, y0 + 0.8, ZD - 2.5, 0.2, 1), { tone: "mid" });
  for (let z = ZF + 4; z < ZD - 4; z += 5) svg += S(box(x - 0.5, y0 + 0.8, z, x + 0.5, y1 - 0.8, z + 0.9, 0.2, 1), { tone: "mid" });
  svg += S(box(x - 0.8, y1 - 0.8, ZF, x + 0.8, y1 + 0.8, ZD - 2.5, 0.2, 1), { tone: "mid" });
  return svg;
}
hput("hold", [43, -6, 30], ladder(43, -12, -2));
hput("men", [69, 1, 30], ladder(69, -3, 5));
count(2);
// men's quarters (bow)
{
  const posts = [[75, -15], [97, -15], [75, -3], [97, -3]];
  let svg = "";
  const back2 = posts.filter(([, y]) => y < -10);
  const front2 = posts.filter(([, y]) => y > -10);
  for (const [x, y] of back2) svg += S(box(x - 1, y - 1, ZF, x + 1, y + 1, 40, 0.3, 1), { tone: "mid" });
  for (const z of [15, 29]) svg += S(box(75, -15, z, 97, -3, z + 2.6, 0.4, 2), { tone: "mid" }) + S(box(75.6, -14.4, z + 2.6, 96.4, -3.6, z + 5, 1.4, 3), { tone: "hi" }) + S(box(76.4, -13.6, z + 5, 81, -4.4, z + 6.6, 1.4, 3), { tone: "hi" });
  for (const [x, y] of front2) svg += S(box(x - 1, y - 1, ZF, x + 1, y + 1, 40, 0.3, 1), { tone: "mid" });
  svg += S(box(75, -3.6, 37, 97, -2.4, 38.4, 0.3, 1), { tone: "mid" });
  hput("men", [86, -9, 26], svg);
  count(9);
}
{
  // hammock: a cloth slung between two spreader bars, its cords on a post and a stanchion
  const xa = 100;
  const xb = 114;
  const zTop = 34;
  const sag = (t) => zTop - 4.5 * Math.sin(Math.PI * t);
  const ys = [-6.5, -3, 0.5];
  const grid = Array.from({ length: 13 }, (_, i) => {
    const t = i / 12;
    return ys.map((y) => [xa + (xb - xa) * t, y, sag(t) - 0.9 * (1 - ((y + 3) / 3.5) ** 2)]);
  });
  const up = grid.map((row) => row.map(() => [0, 0.25, 1]));
  let svg = S(box(115, -4, ZF, 117, -2, ZD - 2.5, 0.3, 1), { tone: "mid" });
  const hooks = [[98, -3, 38], [115, -3, 38]];
  const cords = [[xa, -6.5, zTop], [xa, 0.5, zTop], [xb, -6.5, zTop], [xb, 0.5, zTop]];
  svg += Ln(path3([hooks[0], cords[0]]) + path3([hooks[0], cords[1]]) + path3([hooks[1], cords[2]]) + path3([hooks[1], cords[3]]), { tone: "mid" });
  svg += S(shellPaths(grid, P, { normals: up }), { tone: "hi" });
  svg += S(box(xa - 0.6, -7, zTop - 0.6, xa + 0.6, 1, zTop + 0.6, 0.2, 1), { tone: "mid" }) + S(box(xb - 0.6, -7, zTop - 0.6, xb + 0.6, 1, zTop + 0.6, 0.2, 1), { tone: "mid" });
  svg += Dots(hooks.map(at), { size: 0.8, tone: "hi" });
  hput("men", [107, -3, 30], svg, 3);
  count(4);
}
hput("men", [106, -1, 16], S(box(101, -6, ZF, 111, 3, 19, 0.5, 2, 0.3), { tone: "mid", inner: Ln(k.sideSeam({ x: 101, y: -6, w: 10, d: 9, r: 0.5 }, 15.5, P, 2), { tone: "faint" }) }) + S(box(101, -6, 19, 111, 3, 21.4, 1.2, 3), { tone: "hi" }) + Dots([at([111, -1.5, 18])], { size: 0.6, tone: "hi" }));
count(2);
H_ITEMS.sort((a, b) => a.d - b.d);
hold.push(...H_ITEMS);

// deck beams: their cut ends show under the deck edge
const BEAMS = Array.from({ length: 17 }, (_, i) => -116 + i * 14).filter((x) => x < XC1 - 2);
for (const x of BEAMS) {
  const hw = halfAt(x, ZD - 4, T);
  hold.push({ d: 1e5, svg: it(S(box(x - 1.5, -hw, ZD - 5.5, x + 1.5, YC, ZD - 2.5, 0.2, 1), { tone: "mid" })) });
}
count(BEAMS.length);

// ---------- main deck ----------
{
  const ring = closedRing(ZD, T, XSTERN, 149.2);
  const seams = [];
  for (const y of [-38, -30, -22, -14, -6, 2, 14, 22, 30]) {
    const xs = stationsBetween(XSTERN, 149.2).filter((x) => halfAt(x, ZD, T) > Math.abs(y) + 0.3);
    if (!xs.length) continue;
    let x0 = xs[0];
    let x1 = xs[xs.length - 1];
    const inCut = y > YC;
    const segs = inCut ? [[Math.max(x0, XC1), x1]] : [[x0, x1]];
    for (const [s0, s1] of segs) {
      if (s1 - s0 < 2) continue;
      // walk the end out to the deck edge
      let e = s1;
      while (halfAt(e + 0.05, ZD, T) > Math.abs(y)) e += 0.05;
      seams.push(path3([[s0, y, ZD], [e, y, ZD]]));
    }
  }
  deck.push(it(S(k.extrude(ring, ZD - 2.5, 2.5, P, { convex: false }), { tone: "mid", inner: "" }) + Ln(seams.join(""), { tone: "faint" })));
  count();
}

// ---------- deck furniture, cabin, rig ----------
const TOP_SORT = [];
const tput = (p, centre, svg, bias = 0) => TOP_SORT.push({ d: depth(centre) + bias, svg: it(svg, p) });

// cannons
function cannon(o, dir) {
  const along = dir === "x" ? [1, 0, 0] : [0, -1, 0];
  const side = dir === "x" ? [0, 1, 0] : [1, 0, 0];
  const plan = dir === "x" ? { x: o[0] - 9, y: o[1] - 6, w: 18, d: 12, r: 1 } : { x: o[0] - 6, y: o[1] - 9, w: 12, d: 18, r: 1 };
  let back3 = "";
  let front3 = "";
  for (const s of [-5.5, 5.5]) {
    for (const t of [-1, 1]) {
      const c = G.add3(G.add3([o[0], o[1], 53], G.mul3(along, s)), G.mul3(side, t * 6.6));
      const F = G.frameAlong(c, side);
      const wheel = S(G.disc(-0.8, 0.8, 3.2, F, P, { steps: 28 }), { tone: "mid" }) + Dots([at(G.add3(c, G.mul3(side, 0.8)))], { size: 0.5, tone: "hi" });
      if (G.dot3(G.mul3(side, t), V) > 0) front3 += wheel;
      else back3 += wheel;
    }
  }
  const carriage = S(k.slabOf(plan, ZD, 5.2, P, 2, 0.4), { tone: "mid" });
  const F = G.frameOf([o[0], o[1], 59], along, side, [0, 0, 1]);
  const barrel = S(G.solidOf([[-8, 2.4], [-6.5, 3.6], [-3, 3.8], [16, 2.9], [16, 3.4], [18.5, 3.4], [18.5, 2.6]], F, P, {}), { tone: "hi", inner: Ln(G.arcOf(F, 4, 3.55, P, { slope: -0.046 }), { tone: "faint" }) });
  const ball = S(G.sphereOf(G.add3([o[0], o[1], 59], G.mul3(along, -9.6)), 1.8, P, { steps: 24 }), { tone: "hi" });
  const facing = G.dot3(along, V) > 0;
  const bore = facing ? `<path class="mr-void" d="${G.circleOf(F, 18.5, 1.6, P, 24)}"/>` : "";
  const tail = G.dot3(G.mul3(along, -1), V) > 0;
  return back3 + carriage + (tail ? barrel + ball : ball + barrel) + bore + front3;
}
tput("cannons", [-35, -30, 55], cannon([-35, -30], "y"));
tput("cannons", [35, -31, 55], cannon([35, -31], "y"));
const BOW_GUN = [104, 0];
count(14);

// capstan on the main deck, and a pin rail along the far bulwark
{
  const CF = G.frameOf([-52, -10, ZD], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  let svg = S(G.disc(0, 2, 8.4, CF, P, {}), { tone: "mid" });
  svg += S(G.solidOf([[2, 5.2], [4, 4.4, 1], [9, 4, 1], [11, 4.6, 1], [12, 5.6], [15, 5.6]], CF, P, {}), { tone: "hi" });
  svg += S(G.disc(15, 16.4, 6.4, CF, P, {}), { tone: "mid" });
  const holes = Array.from({ length: 8 }, (_, i) => G.pointOf(CF, 13.5, 5.6, (i / 8) * Math.PI * 2)).filter((p) => G.dot3(G.sub3(p, [-52, -10, p[2]]), V) > 0.6);
  svg += Dots(holes.map(at), { size: 0.55, tone: "lo" });
  tput(null, [-52, -10, 58], svg);
  count(3);
}
{
  const x0 = -22;
  const x1 = 4;
  const yIn = (x) => -(halfAt(x, 57, T) - 0.2);
  const rail = S(box(x0, yIn(x0) , 56, x1, yIn(x0) + 3, 57.6, 0.3, 1), { tone: "mid" });
  let pins = "";
  for (let x = x0 + 3; x < x1; x += 4) pins += S(k.cylinder(x, yIn(x0) + 1.5, 0.7, 57.6, 3, P, 12), { tone: "hi" }) + S(k.cylinder(x, yIn(x0) + 1.5, 1.1, 60.6, 0.9, P, 12), { tone: "hi" });
  tput(null, [-9, -40, 57], rail + pins);
  count(8);
}

// hatches with gratings
function hatch(x0, y0, x1, y1) {
  const plan = { x: x0, y: y0, w: x1 - x0, d: y1 - y0, r: 0.8 };
  const inner = k.insetPlan(plan, 1.6);
  const bars = [];
  for (let x = inner.x + 2; x < inner.x + inner.w - 1; x += 2.4) bars.push(k.lineOnTop([x, inner.y], [x, inner.y + inner.d], ZD + 2.6, P));
  return S(k.slabOf(plan, ZD, 2.6, P, 2, 0.4), { tone: "mid" }) + `<path class="mr-void" d="${k.planOutline(inner, ZD + 2.6, P, 2)}"/>` + Ln(bars.join("") + k.planOutline(inner, ZD + 2.6, P, 2), { tone: "lo" });
}
tput("hold", [43, -6, 51], hatch(36, -14, 50, 2));
tput("men", [69, 1, 51], hatch(63, -5, 75, 7));
count(2);

// stern cabin: galley and dining room, with the upper rear deck on its roof
const CAB = { x0: -146, x1: -82, y0: -32, y1: 32, z0: ZD, z1: 84 };
const RZ = CAB.z1 + 3; // roof top
const cabin = [];
const cput = (centre, svg, bias = 0) => cabin.push({ d: depth(centre) + bias, svg });
cabin.push({ d: -1e6, svg: S(box(CAB.x0, CAB.y0, ZD, CAB.x0 + 2, CAB.y1, CAB.z1, 0.3, 1), { tone: "mid", inner: Ln([-20, 0, 20].map((y) => path3([[CAB.x0 + 2, y, ZD], [CAB.x0 + 2, y, CAB.z1]])).join(""), { tone: "faint" }) }) });
cabin.push({ d: -1e6 + 1, svg: S(box(CAB.x0 + 2, CAB.y0, ZD, CAB.x1, CAB.y0 + 2, CAB.z1, 0.3, 1), { tone: "mid", inner: Ln([-130, -114, -98].map((x) => path3([[x, CAB.y0 + 2, ZD], [x, CAB.y0 + 2, CAB.z1]])).join(""), { tone: "faint" }) }) });
// counter with a sink, the stove with a pot, a shelf of jars
cput([-129, -26, 57], S(box(-142, -30, ZD, -116, -22, 63, 0.4, 2), { tone: "mid", inner: Ln(k.sideSeam({ x: -142, y: -30, w: 26, d: 8, r: 0.4 }, 58, P, 2), { tone: "faint" }) }) + S(box(-142.6, -30, 63, -115.4, -21.2, 64.6, 0.5, 2, 0.3), { tone: "hi" }) + `<path class="mr-void" d="${k.planOutline({ x: -137, y: -28.4, w: 8, d: 5, r: 1.6 }, 64.6, P, 4)}"/>` + Ln(k.planOutline({ x: -137, y: -28.4, w: 8, d: 5, r: 1.6 }, 64.6, P, 4), { tone: "lo" }) + Dots([at([-133, -24.3, 58]), at([-125, -24.3, 58])], { size: 0.5, tone: "hi" }));
cput([-133, -29, 66], S(k.cylinder(-133, -29.4, 0.8, 64.6, 4, P, 12), { tone: "mid" }) + S(box(-133.8, -29.4, 67.8, -132.2, -26.8, 69, 0.3, 1), { tone: "mid" }), 2);
cput([-106, -25, 56], S(box(-112, -30, ZD, -100, -20, 62, 0.6, 2, 0.4), { tone: "lo", inner: Ln(k.sideSeam({ x: -112, y: -30, w: 12, d: 10, r: 0.6 }, 56, P, 2), { tone: "faint" }) }) + S(box(-111, -20, 52, -101, -19.4, 58, 0.3, 1), { tone: "mid" }) + Dots([at([-102.6, -19.4, 55])], { size: 0.5, tone: "hi" }));
cput([-108, -25, 64], S(k.cylinder(-108, -25, 3.6, 62, 4.6, P, 32, 0.3), { tone: "hi", inner: Ln(k.sideArc(-108, -25, 3.6, 64.4, P, 20), { tone: "faint" }) }) + Ln(k.ring(-108, -25, 2.6, 66.6, P, 24), { tone: "faint" }), 2);
const CHIMNEY = [-103, -27];
cput([-103, -27, 70], S(k.cylinder(CHIMNEY[0], CHIMNEY[1], 1.8, 62, CAB.z1 - 62, P, 20), { tone: "mid" }), 1);
cput([-129, -28, 68], S(box(-141, -30, 67.4, -117, -26, 68.8, 0.3, 1), { tone: "mid" }) + [-138, -134, -130, -126, -121].map((x, i) => S(k.cylinder(x, -28, 1.4, 68.8, 2.6 + (i % 2) * 1.2, P, 16), { tone: "hi" })).join(""), 3);
// round table with stools
cput([-118, -6, 57], S(k.cylinder(-118, -6, 4.2, ZD, 0.8, P, 32), { tone: "lo" }) + S(k.cylinder(-118, -6, 1.4, ZD + 0.8, 11.4, P, 16), { tone: "mid" }) + S(k.cylinder(-118, -6, 9, 62.2, 1.4, P, 56, 0.4), { tone: "hi" }));
for (const [x, y] of [[-127, -11], [-107, -12], [-124, 3], [-110, 2]]) cput([x, y, 54], S(k.cylinder(x, y, 0.9, ZD, 6.6, P, 12), { tone: "mid" }) + S(k.cylinder(x, y, 3.1, 56.6, 1.4, P, 24, 0.3), { tone: "hi" }), y > -6 ? 2 : -2);
// front wall with a door and a round window, cut at the near half
cput([-83, -12, 67], S(box(CAB.x1 - 2, CAB.y0, ZD, CAB.x1, YC, CAB.z1, 0.3, 1), { tone: "mid" }) + S(box(CAB.x1, -14, ZD, CAB.x1 + 0.7, -2, 72, 0.3, 1, 0.2), { tone: "mid" }) + Dots([at([CAB.x1 + 0.7, -3.8, 61])], { size: 0.55, tone: "hi" }) + Ln(k.sideRing([CAB.x1, -22, 72], 3.2, "x", P, 24) + k.sideRing([CAB.x1, -22, 72], 4.4, "x", P, 28), { tone: "lo" }), 60);
// the near wall survives aft of the cut, with a porthole
cput([-137, 31, 67], S(box(CAB.x0 + 2, CAB.y1 - 2, ZD, XC0, CAB.y1, CAB.z1, 0.3, 1), { tone: "mid" }) + Ln(k.sideRing([-137, CAB.y1, 72], 3.2, "y", P, 24) + k.sideRing([-137, CAB.y1, 72], 4.4, "y", P, 28), { tone: "lo" }), 40);
cabin.sort((a, b) => a.d - b.d);
const galleySvg = cabin.map((c) => c.svg).join("");
// roof: the upper rear deck, cut along y = -10 inside the cutaway
const ROOF = [[-148, -34], [-80, -34], [-80, -10], [XC0, -10], [XC0, 34], [-148, 34]];
const roofSvg = S(k.extrude(ROOF, CAB.z1, 3, P, { convex: false }), { tone: "mid" }) + Ln([-30, -22, -14].map((y) => path3([[-148, y, RZ], [-80, y, RZ]])).join("") + [-2, 6, 14, 22, 30].map((y) => path3([[-148, y, RZ], [XC0, y, RZ]])).join(""), { tone: "faint" });
const chimneyTop = S(k.cylinder(CHIMNEY[0], CHIMNEY[1], 1.8, RZ, 7, P, 20), { tone: "mid" }) + S(k.cylinder(CHIMNEY[0], CHIMNEY[1], 2.8, RZ + 7, 1.4, P, 24, 0.3), { tone: "mid" });
count(16);
// stairs up to the upper deck, on the far side
let stairs = "";
for (let i = 0; i < 8; i++) {
  const z0 = ZD + i * 4.6;
  stairs += S(box(CAB.x1, -31, z0, CAB.x1 + (8 - i) * 2.6, -23, z0 + 4.6, 0.3, 1), { tone: i % 2 ? "mid" : "mid" });
}
count();
// railing round the upper deck
function rail() {
  const posts = [];
  const lines = [];
  for (let x = -146; x <= -82; x += 8) posts.push([x, -33]);
  for (let y = -25; y <= 33; y += 8) posts.push([-147, y]);
  for (let y = -25; y <= -12; y += 6.5) posts.push([-81, y]);
  posts.sort((a, b) => depth([a[0], a[1], 0]) - depth([b[0], b[1], 0]));
  const backPosts = posts.filter(([x, y]) => y < -30 || x < -146);
  const frontPosts = posts.filter(([x, y]) => !(y < -30 || x < -146));
  let backSvg = backPosts.map(([x, y]) => S(box(x - 0.6, y - 0.6, RZ, x + 0.6, y + 0.6, RZ + 7, 0.2, 1), { tone: "mid" })).join("");
  backSvg += S(box(-148, -34, RZ + 7, -80, -32, RZ + 8.2, 0.4, 1), { tone: "mid" }) + S(box(-148, -34, RZ + 7, -146, 34, RZ + 8.2, 0.4, 1), { tone: "mid" });
  let frontSvg = frontPosts.map(([x, y]) => S(box(x - 0.6, y - 0.6, RZ, x + 0.6, y + 0.6, RZ + 7, 0.2, 1), { tone: "mid" })).join("");
  frontSvg += S(box(-82, -34, RZ + 7, -80, -10, RZ + 8.2, 0.4, 1), { tone: "mid" });
  void lines;
  return { backSvg, frontSvg };
}
const RAIL = rail();
count(3);
// tangerine trees in planters
function tree(x, y, seed) {
  const plan = { x: x - 5, y: y - 5, w: 10, d: 10, r: 0.8 };
  let svg = S(k.slabOf(plan, RZ, 5, P, 2, 0.4), { tone: "mid", inner: Ln(k.sideSeam(plan, RZ + 2.5, P, 2), { tone: "faint" }) });
  svg += `<path class="mr-soil" d="${k.planOutline(k.insetPlan(plan, 1), RZ + 5, P, 2)}"/>` + Ln(k.planOutline(k.insetPlan(plan, 1), RZ + 5, P, 2), { tone: "lo" });
  svg += S(k.cylinder(x, y, 1.1, RZ + 5, 8, P, 12), { tone: "mid" });
  const blobs = [[-3, -2, 104, 5.4], [3, -1, 105, 5.6], [0, 3, 103.4, 5], [0, -1, 109, 5.2]].map(([dx, dy, z, r]) => ({ c: [x + dx, y + dy, z + (RZ - 87)], r }));
  blobs.sort((a, b) => depth(a.c) - depth(b.c));
  svg += blobs.map((b) => S(G.sphereOf(b.c, b.r, P, { steps: 32 }), { tone: "hi" })).join("");
  const fruit = [];
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (const b of blobs) {
    for (let i = 0; i < 2; i++) {
      const a = rnd() * Math.PI * 2;
      const e = 0.2 + rnd() * 0.6;
      const p = G.add3(b.c, G.mul3(G.unit3([Math.cos(a) * 0.4 + V[0], Math.sin(a) * 0.4 + V[1], e]), b.r * 0.86));
      fruit.push(p);
    }
  }
  fruit.sort((a, b) => depth(a) - depth(b));
  svg += fruit.map((p) => S(G.sphereOf(p, 1.25, P, { steps: 16 }), { tone: "hi" })).join("");
  return svg;
}
const TREES = [[-138, -22, 11], [-117, -22, 23], [-96, -22, 37]];
const treesSvg = TREES.map(([x, y, s]) => tree(x, y, s)).join("");
count(TREES.length * 4);
// tiller on the upper deck, joined to the rudder head
const tillerSvg = S(box(-158, -1, 92, -134, 1, 93.6, 0.6, 2), { tone: "hi" }) + S(k.cylinder(-133, 0, 1.2, 92, 4.4, P, 12), { tone: "hi" });
count();

// mast above deck, crow's nest, yard, flag
const mastF = G.frameOf([MX, 0, ZD], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
const partners = S(k.cylinder(MX, 0, 7.4, ZD, 3, P, 48, 0.4), { tone: "mid" }) + Dots(Array.from({ length: 8 }, (_, i) => at([MX + 6 * Math.cos((i / 8) * Math.PI * 2), 6 * Math.sin((i / 8) * Math.PI * 2), ZD + 3])).filter((_, i) => true), { size: 0.45, tone: "mid" });
const mastLower = S(G.solidOf([[0, 4.6], [150, 3.9]], mastF, P, { rims: "first" }), { tone: "hi", inner: Ln(G.arcOf(mastF, 40, 4.41, P, { slope: -0.0047 }) + G.arcOf(mastF, 110, 4.09, P, { slope: -0.0047 }), { tone: "faint" }) });
const NEST = { z0: 204, z1: 215, r: 11 };
const trestle = S(box(MX - 9, -1.4, NEST.z0 - 3, MX + 9, 1.4, NEST.z0, 0.3, 1), { tone: "mid" }) + S(box(MX - 1.4, -9, NEST.z0 - 3, MX + 1.4, 9, NEST.z0, 0.3, 1), { tone: "mid" });
const band = S(k.cylinder(MX, 0, 4.9, 196, 3, P, 32), { tone: "mid" });
const nestSvg = S(k.cylinder(MX, 0, NEST.r, NEST.z0, NEST.z1 - NEST.z0, P, 64), { tone: "hi", inner: Ln(k.sideArc(MX, 0, NEST.r, NEST.z0 + 3.6, P, 40) + k.sideArc(MX, 0, NEST.r, NEST.z0 + 7.4, P, 40), { tone: "faint" }) }) + S(k.cylinder(MX, 0, NEST.r + 0.9, NEST.z1, 1.4, P, 64, 0.3), { tone: "hi" }) + `<path class="mr-void" d="${k.pathOf(k.circleRing(MX, 0, NEST.r - 1.2, 48).map(([x, y]) => at([x, y, NEST.z1 + 1.4])), true)}"/>` + Ln(k.ring(MX, 0, NEST.r - 1.2, NEST.z1 + 1.4, P, 48), { tone: "lo" });
const mastUpperF = G.frameOf([MX, 0, NEST.z1 + 1.4], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
const mastUpper = S(G.solidOf([[0, 3.3], [34, 2.6]], mastUpperF, P, { rims: "last" }), { tone: "hi" }) + S(k.cylinder(MX, 0, 3.4, NEST.z1 + 35.4, 2.2, P, 24, 0.3), { tone: "mid" });
const FLAGZ = NEST.z1 + 37.6;
const flagSvg = S(k.cylinder(MX, 0, 0.7, FLAGZ, 13, P, 10), { tone: "mid" }) + S(k.cylinder(MX, 0, 1.3, FLAGZ + 13, 1.2, P, 12), { tone: "mid" }) + `<path class="mr-flag" d="${path3([[MX - 0.7, 0, FLAGZ + 12.4], [MX - 15, 0, FLAGZ + 10.6], [MX - 13, 0, FLAGZ + 7.8], [MX - 15.6, 0, FLAGZ + 5.4], [MX - 0.7, 0, FLAGZ + 5.6]], true)}"/>` + Ln(path3([[MX - 0.7, 0, FLAGZ + 12.4], [MX - 15, 0, FLAGZ + 10.6], [MX - 13, 0, FLAGZ + 7.8], [MX - 15.6, 0, FLAGZ + 5.4], [MX - 0.7, 0, FLAGZ + 5.6]], true), { tone: "mid" });
const YARD_Z = 190;
const yardF = G.frameOf([SAIL.x, -66, YARD_Z], [0, 1, 0], [0, 0, 1], [1, 0, 0]);
const yardSvg = S(G.solidOf([[0, 1.3], [6, 2.1, 1], [66, 2.8, 1], [126, 2.1, 1], [132, 1.3]], yardF, P, { smooth: true }), { tone: "hi" });
count(12);

// standing rigging on the far side: shrouds with ratlines, plus fore and back stays
const MAST_AT = (z) => [MX, 0, z];
const chain = [-6, 2, 10].map((x) => [x, -(B(x) + 1.4) * Sf(1), zg(x) + 0.8]);
const SHROUD_TOP = MAST_AT(197);
const shroudLines = chain.map((p) => path3([p, SHROUD_TOP])).join("");
const ratlines = [];
for (let t = 0.12; t < 0.86; t += 0.085) {
  const a = G.lerp3(chain[0], SHROUD_TOP, t);
  const b = G.lerp3(chain[2], SHROUD_TOP, t);
  ratlines.push(path3([a, b]));
}
const farRig = Ln(shroudLines, { tone: "mid" }) + Ln(ratlines.join(""), { tone: "lo" }) + Dots(chain.map(at), { size: 0.85, tone: "hi" });
const backstay = Ln(path3([[MX, 0, 247], [-146, 0, RZ + 8.2]]), { tone: "mid" }) + Dots([at([-146, 0, RZ + 8.2])], { size: 0.8, tone: "hi" });
const STEM_HEAD = [XBOW + 0.6, 0, 78];
const forestay = Ln(path3([[MX, 0, 247], STEM_HEAD]), { tone: "mid" }) + Dots([at([MX, 0, 247]), at(STEM_HEAD)], { size: 0.8, tone: "hi" });
const farClew = [SAIL.x, -SAIL.half1, SAIL.top - SAIL.drop];
const farCleat = [24, -(B(24) + 0.6) * Sf(1), zg(24) + 1.6];
const sheet = Ln(path3([farClew, farCleat]), { tone: "lo" }) + Dots([at(farClew), at(farCleat)], { size: 0.8, tone: "hi" });
count(8);

// sail at rest (the page rebuilds it as it breathes)
const SAIL_REST = 9;
function sailSvg(bulge) {
  const s = sailParts(bulge, P);
  return `<g data-sail-body>${S(s.paths, { tone: "hi", inner: Ln(s.seams, { tone: "faint" }) })}</g><g class="mr-emblem" data-sail-emblem><path class="mr-bone" d="${s.bones}"/><path class="mr-skull" d="${s.skull}"/><path class="mr-hole" d="${s.holes}"/><path class="mr-crown" d="${s.crown}"/><path class="mr-band" d="${s.band}"/><path class="mr-brim" d="${s.brim}"/></g>`;
}
count(3);

// the bow cannon
const bowGun = cannon(BOW_GUN, "x");

// order of the top layer
TOP_SORT.sort((a, b) => a.d - b.d);
top.push(it(backstay, "mast"));
top.push(it(farRig, "mast"));
for (const item of TOP_SORT) top.push(item.svg);
top.push(it(stairs + galleySvg + S(k.cylinder(CHIMNEY[0], CHIMNEY[1], 1.8, CAB.z1, 0.01, P, 4), { tone: "mid" }), "galley"));
top.push(it(roofSvg + RAIL.backSvg, "galley"));
top.push(it(chimneyTop, "galley"));
top.push(it(treesSvg, "trees"));
top.push(it(RAIL.frontSvg, "galley"));
top.push(it(tillerSvg, "rudder"));
top.push(it(partners + mastLower + band, "mast"));
top.push(it(trestle + nestSvg, "nest"));
top.push(it(mastUpper + flagSvg, "mast"));
top.push(it(sheet, "sail"));
top.push(`<g class="it" data-p="sail" data-sail>${sailSvg(SAIL_REST)}</g>`);
top.push(it(yardSvg, "mast"));
top.push(it(bowGun, "cannons"));
top.push(it(forestay, "mast"));

// ---------- near side: the hull pieces that are not cut away ----------
function nearPiece(x0, x1) {
  const xs = stationsBetween(x0, x1);
  const { grid, normals } = hullGrid(xs, US, 1, 0);
  const paths = shellPaths(grid, P, { normals });
  // plank seams on the visible rows, ending on the limb or the piece border
  const rows = US.map((u, j) => j).filter((j) => j > 0 && j < US.length - 1 && j % 2 === 0);
  const seams = [];
  for (const j of rows) {
    const pts = xs.map((x) => hull(x, US[j], 1, 0));
    const f = xs.map((x) => G.dot3(hullNormal(x, US[j], 1, 0), V));
    for (const run of visibleRuns(pts, f, P)) seams.push(k.pathOf(run));
  }
  // the wale: a raised band along the hull
  const wu = [0.74, 0.79];
  const waleFace = xs.map((x) => wu.map((u) => hull(x, u, 1, -1.4)));
  const waleN = xs.map((x) => wu.map((u) => hullNormal(x, u, 1, -1.4)));
  const waleTop = xs.map((x) => [hull(x, wu[1], 1, 0), hull(x, wu[1], 1, -1.4)]);
  const upN = xs.map(() => [[0, 0, 1], [0, 0, 1]]);
  const wl = xs.map((x) => hull(x, 0.36, 1, 0));
  const wf = xs.map((x) => G.dot3(hullNormal(x, 0.36, 1, 0), V));
  const waterline = visibleRuns(wl, wf, P).map((r) => k.pathOf(r)).join("");
  return S(paths, { tone: "mid", inner: Ln(seams.join(""), { tone: "faint" }) + Ln(waterline, { tone: "lo" }) }) + S(shellPaths(waleTop, P, { normals: upN }), { tone: "mid" }) + S(shellPaths(waleFace, P, { normals: waleN }), { tone: "mid" });
}
front.push(it(nearPiece(XSTERN, XC0)));
front.push(it(nearPiece(XC1, XBOW)));
front.push(it(capGrids(1, XSTERN, XC0)));
front.push(it(capGrids(1, XC1, 146)));
count(6);
// the cut face of the planking at the stern end of the cutaway
{
  const us = spread(0, 1, 24, 1.2);
  const outer = us.map((u) => hull(XC0, u, 1, 0));
  const inner = us.map((u) => hull(XC0, u, 1, T)).reverse();
  front.push(it(S(face([...outer, ...inner], [1, 0, 0]), { tone: "mid" })));
  count();
}
// portholes on the bow and the stern
function porthole(x, u) {
  const c = hull(x, u, 1, 0);
  const n = hullNormal(x, u, 1, 0);
  const t1 = G.unit3(G.sub3(hull(x + 0.5, u, 1, 0), hull(x - 0.5, u, 1, 0)));
  const t2 = G.unit3(G.cross3(n, t1));
  const loop = (r) => Array.from({ length: 29 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2;
    return G.add3(G.add3(c, G.mul3(t1, r * Math.cos(a))), G.mul3(t2, r * Math.sin(a)));
  });
  return `<path class="mr-glass" d="${path3(loop(2.6), true)}"/>` + Ln(path3(loop(2.6), true) + path3(loop(3.8), true), { tone: "lo" }) + Dots([0, 1, 2, 3].map((i) => at(G.add3(G.add3(c, G.mul3(t1, 3.2 * Math.cos(i * 1.5708 + 0.785))), G.mul3(t2, 3.2 * Math.sin(i * 1.5708 + 0.785))))), { size: 0.35, tone: "mid" });
}
front.push(it([[138, 0.62], [-140, 0.55]].map(([x, u]) => porthole(x, u)).join("")));
count(3);

// ---------- figurehead: the sheep's head on the stem ----------
{
  const SC = 1.32;
  const O = [XBOW, 0, 76];
  const sc = (p) => [O[0] + (p[0] - O[0]) * SC, O[1] + (p[1] - O[1]) * SC, O[2] + (p[2] - O[2]) * SC];
  const head = sc([160.5, 0, 81.5]);
  const snout = sc([168, 0, 78]);
  const neckF = G.frameAlong([XBOW - 1, 0, 76.5], G.unit3([1, 0, 0.42]));
  let farHorn = "";
  let nearHorn = "";
  for (const side of [-1, 1]) {
    const c = sc([156.6, side * 8.6, 82]);
    const route = [];
    const n = 80;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const a = Math.PI * 0.42 + t * Math.PI * 2.2;
      const r = (8.4 - 5.6 * t) * SC;
      route.push([c[0] + r * Math.cos(a), c[1] + side * 3 * t, c[2] + r * Math.sin(a)]);
    }
    const pieces = tubePieces(route, (t) => (2.9 - 1.7 * t) * SC, P, { maxLength: 7 });
    const svg = pieces.reverse().map((piece) => tubeSvg(piece, { tone: "hi" })).join("");
    if (side > 0) nearHorn = svg;
    else farHorn = svg;
  }
  const wool = [[155.5, -3.8, 89], [160, 0, 90], [155.5, 3.8, 89], [164, -2.4, 88.4], [164, 2.4, 88.4]].map(sc).sort((a, b) => depth(a) - depth(b));
  let svg = farHorn;
  svg += S(G.solidOf([[0, 5.2], [12, 7]], neckF, P, {}), { tone: "hi" });
  svg += S(G.sphereOf(head, 9.4 * SC, P, { steps: 56 }), { tone: "hi" });
  svg += wool.map((p) => S(G.sphereOf(p, 3.1 * SC, P, { steps: 28 }), { tone: "hi" })).join("");
  svg += S(G.sphereOf(snout, 5.4 * SC, P, { steps: 40 }), { tone: "hi" });
  svg += Dots([at(sc([171.2, 2.2, 79.4])), at(sc([171.5, -1.4, 79.4]))], { size: 0.55, tone: "mid" });
  svg += Dots([at(sc([165.8, 6.2, 84.6]))], { size: 1.4, tone: "hi" });
  svg += nearHorn;
  front.push(it(svg, "head"));
  count(11);
}

// ---------- assemble the SVG ----------
bilge.sort((a, b) => a.d - b.d);
const shipBody = [...back, ...bilge.map((b) => b.svg), ...hold.map((h) => h.svg), ...deck, ...top, ...front].join("");
const pivot = at([0, 0, 30]).map((v) => Math.round(v * 10) / 10);

function svgFor(t) {
  return k.figureSvg({
    width: W,
    height: H,
    label: t.label,
    body: [...sea, HALO, `<g class="mr-ship" data-ship>${shipBody}</g>`],
  });
}

// ---------- page ----------
const SHELL_SRC = readFileSync(join(HERE, "shell.mjs"), "utf8").replace(/^import .*$/gm, "").replace(/^export /gm, "");
const SAIL_SRC = readFileSync(join(HERE, "sail.mjs"), "utf8").replace(/^import .*$/gm, "").replace(/^export /gm, "");
const LIVE_SRC = readFileSync(join(HERE, "live.js"), "utf8");
const CSS = readFileSync(join(HERE, "merry.css"), "utf8");

function page(lang, theme) {
  const t = TEXT[lang];
  const keys = ORDER.map((id, i) => `<button type="button" class="mr-part" data-part="${id}"><span class="mr-num">${String(i + 1).padStart(2, "0")}</span>${t.parts[id][0]}</button>`).join("");
  const corner = (name, text, extra = "") => `<span class="iso-plate-corner" data-corner="${name}"${extra}>${text}</span>`;
  const stage = `<div class="iso-stage mr-stage" tabindex="0" role="group" aria-label="${t.stage}">${svgFor(t)}<span class="mr-sr" role="status" aria-live="polite" data-status></span></div>`;
  const body = `<figure class="iso-figure mr"><div class="iso-plate"><div class="iso-plate-corners" aria-hidden="true">${corner("fig", t.fig)}${corner("title", t.title)}${corner("hint", t.hint)}${corner("readout", t.idle, " data-readout")}</div>${stage}</div><figcaption class="iso-legend"><span class="mr-parts">${keys}</span><span class="iso-caption mr-caption" data-caption>${t.caption}</span></figcaption></figure>`;
  const DATA = {
    P,
    order: ORDER,
    names: Object.fromEntries(ORDER.map((id) => [id, t.parts[id][0]])),
    texts: Object.fromEntries(ORDER.map((id) => [id, t.parts[id][1]])),
    idle: t.idle,
    caption: t.caption,
    pivot,
    rest: SAIL_REST,
  };
  const script = kitScript() + SHELL_SRC + SAIL_SRC + LIVE_SRC.replace("__DATA__", JSON.stringify(DATA));
  let html = k.pageHtml({ title: t.pageTitle, theme, body: `<style>${CSS}</style>${body}`, script, width: 900 });
  html = html.replace('<html lang="en">', `<html lang="${t.lang}">`);
  return html;
}

const OUT = [
  ["ja", "dark", "merry-ja.html"],
  ["ja", "light", "merry-ja-light.html"],
  ["en", "dark", "merry-en.html"],
  ["en", "light", "merry-en-light.html"],
];
for (const [lang, theme, name] of OUT) {
  const html = page(lang, theme);
  writeFileSync(join(HERE, name), html);
  console.log("wrote", name, `${(html.length / 1024).toFixed(0)} KB`);
}
console.log(`parts ${PARTS} · scale ${KS.toFixed(3)}`);
