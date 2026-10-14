// Fig 2b: each Soldier Dock channel's vehicle drawn large as a little machine on a low stage.
// Local frame per scene: x forward, y toward the near (viewer's) side, z up, stage top at z = 0.
import * as k from "../anatomy/kit/iso-kit.mjs";
import * as G from "../anatomy/kit/lathe.mjs";
import { tubePieces, tubeSvg } from "../anatomy/kit/tube.mjs";
import * as A from "../anatomy/kit/audit.mjs";

const f2 = (v) => Math.round(v * 100) / 100;

// The footprint (x0, x1, y0, y1) and height of each machine, used to fit the camera and size the stage.
const BOX = {
  0: [-13, 13, -9, 9, 24],
  1: [-19, 16, -7.2, 7.2, 24],
  2: [-21, 19, -7.6, 7.6, 19.5],
  3: [-24, 19, -10.4, 10.4, 20],
  4: [-19.5, 17, -7.6, 7.6, 30],
  5: [-15, 17, -8.6, 8.6, 27],
};

export function buildScene(c, { W, H, azimuth, elevation, audit }) {
  const [bx0, bx1, by0, by1, bh] = BOX[c];
  const STAGE = { x: bx0 - 3, y: by0 - 4.2, w: bx1 - bx0 + 6, d: by1 - by0 + 8.4, r: 4 };
  const pts = [...k.boxCorners(STAGE, -2.6, 0), ...k.boxCorners({ x: bx0, y: by0, w: bx1 - bx0, d: by1 - by0, r: 0 }, 0, bh)];
  const P = k.fitProjection(pts, W, H, { pad: 10, azimuth, elevation });
  const KS = G.scaleOf(P);
  const at = (p) => k.iso(p, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const Ln = (d, style) => k.lineSvg(d, style);
  const Dots = (points, style) => k.dotsSvg(points, style);
  const R = A.recorder(P);
  const put = (name, ref, svg, shapes, bias = 0) => R.put({ name, at: ref, bias, svg, shapes: shapes.map((s) => R.solid(s)), piece: "d" });
  const owner = `v${c}`;
  const plane = (o, ex, ey) => {
    const p0 = at(o);
    const px = at(G.add3(o, ex));
    const py = at(G.add3(o, ey));
    return `matrix(${(px[0] - p0[0]).toFixed(4)} ${(px[1] - p0[1]).toFixed(4)} ${(py[0] - p0[0]).toFixed(4)} ${(py[1] - p0[1]).toFixed(4)} ${p0[0].toFixed(2)} ${p0[1].toFixed(2)})`;
  };

  // ---- small builders, each one item with its true shape ----
  const box = (name, [x0, y0, z0], [x1, y1, z1], tone = "mid", { r = 0.3, steps = 2, bevel = 0, inner = "", extra = "", lit = false, bias = 0 } = {}) => {
    const plan = { x: x0, y: y0, w: x1 - x0, d: y1 - y0, r };
    put(name, [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], S(k.slabOf(plan, z0, z1 - z0, P, steps, bevel), { tone, inner, lit }) + extra, [A.slab(plan, z0, z1 - z0, { name, owner }, steps)], bias);
  };
  const disc = (name, F, s0, s1, r, tone = "mid", { inner = "", extra = "", lit = false, bias = 0, steps } = {}) => {
    put(name, G.add3(F.o, G.mul3(F.a, (s0 + s1) / 2)), S(G.disc(s0, s1, r, F, P, steps ? { steps } : {}), { tone, inner, lit }) + extra, [A.disc(F, s0, s1, r, { name, owner })], bias);
  };
  const ball = (name, c3, r, tone = "hi", { extra = "", lit = false, bias = 0 } = {}) => {
    put(name, c3, S(G.sphereOf(c3, r, P, { steps: 40 }), { tone, lit }) + extra, [A.ball(c3, r, { name, owner })], bias);
  };
  const prism = (name, F, poly, s0, s1, tone = "mid", { extra = "", lit = false, bias = 0, inner = "" } = {}) => {
    const cx = poly.reduce((a, p) => a + p[0], 0) / poly.length;
    const cy = poly.reduce((a, p) => a + p[1], 0) / poly.length;
    const ref = G.add3(G.add3(G.add3(F.o, G.mul3(F.a, (s0 + s1) / 2)), G.mul3(F.u, cx)), G.mul3(F.v, cy));
    put(name, ref, S(G.prismOf(F, poly, s0, s1, P), { tone, lit, inner }) + extra, [A.prism(F, poly, s0, s1, { name, owner })], bias);
  };
  const turned = (name, F, profile, tone, { smooth, extra = "", inner = "", lit = false, bias = 0 } = {}) => {
    const mid = (profile[0][0] + profile[profile.length - 1][0]) / 2;
    put(name, G.add3(F.o, G.mul3(F.a, mid)), S(G.solidOf(profile, F, P, smooth ? { smooth } : {}), { tone, inner, lit }) + extra, [A.solid(F, profile, { name, owner, radius: smooth && smooth.radius ? smooth.radius : null })], bias);
  };
  const pipe = (name, points, r, mount) => {
    const route = G.fillet(points, Math.max(1.4, r * 2.6), 10, { P, tube: r });
    R.route(name, route, r, { piece: "d" });
    tubePieces(route, r, P, { maxLength: 10, spacing: 0.5 }).forEach((piece, i) => R.put({ name: `${name}:${i}`, at: piece.mid, bias: 0.05, svg: tubeSvg(piece, { tone: "hi" }), shapes: [A.tube(piece.points, piece.radii)], piece: "d", route: name, chunk: i }));
  };
  // a wheel turning about y: tyre, rim line, spokes, a hub on each face with a bolt circle
  const wheel = (name, x, z, Rr, w, { tyre = "lo", spokes = 8, hub = 1.8 } = {}) => {
    const F = G.frameOf([x, 0, z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
    const near = w / 2;
    const parts = [
      S(G.disc(-near - 0.5, -near, hub, F, P, { steps: 28 }), { tone: "mid" }),
      S(G.disc(-near, near, Rr, F, P, { steps: 72 }), { tone: tyre, inner: Ln(G.arcOf(F, 0, Rr, P), { tone: "faint" }) }),
      Ln(G.circleOf(F, near, Rr - 1.1, P, 64), { tone: "mid" }),
      Ln(G.spokesOf(F, near, hub, Rr - 1.1, spokes, P, { phase: 0.2 }), { tone: "lo" }),
      S(G.disc(near, near + 0.5, hub, F, P, { steps: 28 }), { tone: "hi" }),
      Dots(G.dotsOf(F, near + 0.5, hub * 0.6, 5, P, { all: true }), { size: 0.5, tone: "lo" }),
    ];
    put(name, [x, 0, z], parts.join(""), [A.disc(F, -near, near, Rr, { name, owner }), A.disc(F, -near - 0.5, -near, hub, { name: `${name}.hub0`, owner }), A.disc(F, near, near + 0.5, hub, { name: `${name}.hub1`, owner })]);
    return { F, near: near + 0.5 };
  };

  // ---- the stage: a low plate with a groove, screws and a ruler strip ----
  const stand = [];
  stand.push(`<path class="iso-halo" d="${k.haloOf(STAGE, -2.6, 2.6, P)}"/>`);
  stand.push(S(k.slabOf(STAGE, -2.6, 2.6, P, 6, 0.6), { tone: "mid" }));
  R.solid(A.slab(STAGE, -2.6, 2.6, { name: "stand.stage", ground: true }, 6));
  stand.push(Ln(k.planOutline(k.insetPlan(STAGE, 2.2), 0, P, 6), { tone: "faint" }));
  const screws = k.corners(STAGE, 3.6);
  stand.push(Ln(screws.map(([x, y]) => k.ring(x, y, 0.9, 0, P, 14)).join(""), { tone: "lo" }), Dots(screws.map(([x, y]) => at([x, y, 0])), { size: 0.45 }));
  const STRIP = { x: STAGE.x + 7, y: STAGE.y + STAGE.d - 3.4, w: STAGE.w - 14, d: 1.6, r: 0.4 };
  stand.push(S(k.slabOf(STRIP, 0, 0.3, P, 2), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(STRIP.x + 1, STRIP.x + STRIP.w - 1, 1, 5, STRIP.y, 0.3, [0.5, 0.95], P);
  stand.push(Ln(ticks.minor, { tone: "lo" }), Ln(ticks.major, { tone: "mid" }));

  if (c === 0) paddleUnit();
  else if (c === 1 || c === 4) bike(c === 4);
  else if (c === 2) boat();
  else if (c === 3) shark();
  else tank();

  // ---- channel 0: the paddle wheel unit ----
  function paddleUnit() {
    const Z = 12.4;
    const F = G.frameOf([0, 0, Z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
    box("sole", [-5, -9, 0], [5, 9, 1], "lo", { r: 1, steps: 3, bevel: 0.3, extra: Dots([[-4, -8], [4, -8], [-4, 8], [4, 8]].map(([x, y]) => at([x, y, 1])), { size: 0.45 }) });
    for (const sy of [-1, 1]) {
      const [y0, y1] = sy > 0 ? [5, 7] : [-7, -5];
      box(`bracket${sy}`, [-2.6, y0, 1], [2.6, y1, Z + 2.6], "mid", { r: 0.6, steps: 2, bevel: 0.3, inner: Ln(k.sideSeam({ x: -2.6, y: y0, w: 5.2, d: 2, r: 0.6 }, 4, P, 2), { tone: "faint" }) });
      const [c0, c1] = sy > 0 ? [7, 8] : [-8, -7];
      disc(`cap${sy}`, F, c0, c1, 1.9, "hi", { extra: sy > 0 ? Dots(G.dotsOf(F, 8, 1.3, 4, P, { all: true }), { size: 0.45, tone: "lo" }) : "" });
      const [a0, a1] = sy > 0 ? [3.6, 5] : [-5, -3.6];
      disc(`axle${sy}`, F, a0, a1, 0.9, "hi");
    }
    disc("rim.far", F, -3, -2.4, 11, "mid", { steps: 96 });
    disc("drum", F, -2.4, 2.4, 2.4, "mid");
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.2;
      const u = [Math.cos(a), Math.sin(a)];
      const v = [-u[1], u[0]];
      const q = (r, t) => [u[0] * r + v[0] * t, u[1] * r + v[1] * t];
      prism(`bucket${i}`, F, [q(3.2, -0.5), q(10.6, -0.5), q(10.6, 0.5), q(3.2, 0.5)], -2.4, 2.4, "hi");
    }
    disc("rim.near", F, 2.4, 3, 11, "mid", { steps: 96, extra: Ln(G.circleOf(F, 3, 9.6, P, 72), { tone: "lo" }) + Ln(G.spokesOf(F, 3, 3, 9.6, 8, P, { phase: 0.2 + Math.PI / 8 }), { tone: "lo" }) });
    disc("flange", F, 3, 3.6, 3, "hi", { lit: true, extra: Dots(G.dotsOf(F, 3.6, 2.1, 6, P, { all: true }), { size: 0.5, tone: "lo" }) });
  }

  // ---- channels 1 and 4: a bike, as a white horse or as a black rhino ----
  function bike(rhino) {
    const Rr = rhino ? 6.5 : 6;
    const w = rhino ? 5 : 3;
    const zc = Rr;
    const xr = -12;
    const xf = 12.6;
    const body = rhino ? "lo" : "hi";
    const half = rhino ? 3.6 : 3.1;
    const rear = wheel("wheel.rear", xr, zc, Rr, w, { spokes: rhino ? 6 : 10, hub: rhino ? 2.2 : 1.8 });
    const front = wheel("wheel.front", xf, zc, Rr, w, { spokes: rhino ? 6 : 10, hub: rhino ? 2.2 : 1.8 });
    const hy = rear.near;
    // engine and the pivot the swing arms hang from
    const ex0 = -5;
    const ex1 = 4;
    const ez0 = 3.6;
    const ez1 = 9.8;
    const fins = [-3.5, -2, -0.5, 1, 2.5].map((x) => k.segment([x, 2.2, ez0], [x, 2.2, ez1], P)).join("");
    box("engine", [ex0, -2.2, ez0], [ex1, 2.2, ez1], "mid", { r: 0.6, steps: 2, bevel: 0.3, extra: Ln(fins, { tone: "lo" }) });
    box("pivot", [ex0 - 0.8, -hy - 1.2, 4.6], [ex0, hy + 1.2, 7.6], "lo", { r: 0.3 });
    for (const sy of [-1, 1]) {
      const [y0, y1] = sy > 0 ? [hy, hy + 1.2] : [-hy - 1.2, -hy];
      box(`arm${sy}`, [xr - 0.6, y0, zc - 1], [ex0 - 0.8, y1, zc + 0.8], body === "lo" ? "lo" : "mid", { r: 0.4, extra: sy > 0 ? Dots([at([xr + 2, y1, zc - 0.1]), at([ex0 - 2.4, y1, zc - 0.1])], { size: 0.45, tone: "hi" }) : "" });
      box(`fork${sy}`, [xf - 0.6, y0, zc - 0.6], [xf + 0.6, y1, 16], "mid", { r: 0.4 });
    }
    box("crown", [xf - 1.2, -hy - 1.2, 16], [xf + 1.2, hy + 1.2, 17.4], "mid", { r: 0.4, bevel: 0.2 });
    const LF = G.frameOf([xf + 1.2, 0, rhino ? 15.9 : 16.4], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
    disc("lamp", LF, 0, 1.4, 1.5, "hi", { extra: Ln(G.circleOf(LF, 1.4, 1, P, 32), { tone: "mid" }) });
    // the animal's body is the frame: torso, saddle, tank, neck and head
    const bx0 = -5.6;
    const bx1 = 6.4;
    box("torso", [bx0, -half, ez1], [bx1, half, 15.2], body, { r: 1.6, steps: 4, bevel: 0.4, inner: Ln(k.sideSeam({ x: bx0, y: -half, w: bx1 - bx0, d: half * 2, r: 1.6 }, 12.4, P, 4), { tone: "faint" }), extra: Dots([-3, -1, 1, 3, 5].map((x) => at([x, half, 11.2])), { size: 0.4, tone: rhino ? "hi" : "lo" }) });
    box("saddle", [-4.8, -2.4, 15.2], [1.4, 2.4, 16.8], rhino ? "mid" : "lo", { r: 1.2, steps: 3, inner: Ln(k.sideSeam({ x: -4.8, y: -2.4, w: 6.2, d: 4.8, r: 1.2 }, 16, P, 3), { tone: rhino ? "lo" : "faint" }) });
    box("fueltank", [1.6, -2.2, 15.2], [6, 2.2, 17.6], rhino ? "mid" : "hi", { r: 1.6, steps: 4, bevel: 0.3, extra: Ln(k.planOutline({ x: 3, y: -0.8, w: 1.8, d: 1.6, r: 0.6 }, 17.6, P, 3), { tone: "lo" }) });
    for (const sy of [-1, 1]) {
      const PF = G.frameOf([0.5, 0, 6.6], [0, sy, 0], [1, 0, 0], [0, 0, 1]);
      disc(`peg${sy}`, PF, 2.2, 4.4, 0.45, "hi");
    }
    const neckHalf = rhino ? 2.4 : 1.8;
    box("neck", [bx1, -neckHalf, 12.6], [bx1 + 3, neckHalf, rhino ? 18 : 21], body, { r: 0.8, steps: 3 });
    box("stem", [bx1 + 3, -1, 14.6], [xf - 1.2, 1, 16], "lo", { r: 0.3 });
    if (rhino) {
      box("mane", [bx1 + 0.4, -0.6, 18], [bx1 + 2.6, 0.6, 18.8], "mid", { r: 0.3 });
      const head = { x0: bx1 + 3, x1: bx1 + 9.6, z0: 17.4, z1: 23 };
      box("head", [head.x0, -2.6, head.z0], [head.x1, 2.6, head.z1], "lo", { r: 1.8, steps: 4, bevel: 0.3, extra: Dots([at([head.x1 - 2.6, 2.6, 21.2])], { size: 0.6, tone: "hi" }) });
      for (const sy of [-1, 1]) box(`ear${sy}`, [head.x0 + 0.6, sy > 0 ? 1.2 : -2.2, head.z1], [head.x0 + 1.8, sy > 0 ? 2.2 : -1.2, head.z1 + 1.6], "mid", { r: 0.3 });
      const H = G.frameOf([head.x1 - 1.8, 0, head.z1], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
      turned("horn", H, [[0, 1.7], [6, 0.12]], "hi", { lit: true });
      const H2 = G.frameOf([head.x1 - 4.4, 0, head.z1], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
      turned("horn2", H2, [[0, 1], [2.6, 0.1]], "mid");
      for (const sy of [-1, 1]) {
        const BF = G.frameOf([bx1 + 1.5, 0, 17.2], [0, sy, 0], [1, 0, 0], [0, 0, 1]);
        disc(`bar${sy}`, BF, neckHalf, 5, 0.45, "mid");
        disc(`grip${sy}`, BF, 5, 7, 0.75, "hi");
      }
    } else {
      box("mane", [bx1 + 0.4, -0.6, 21], [bx1 + 2.4, 0.6, 22.6], "mid", { r: 0.3 });
      const head = { x0: bx1 + 3, x1: bx1 + 8.8, z0: 18, z1: 21.6 };
      box("head", [head.x0, -1.6, head.z0], [head.x1, 1.6, head.z1], "hi", { r: 1.2, steps: 4, bevel: 0.3, lit: true, extra: Dots([at([head.x0 + 1.6, 1.6, 20.4]), at([head.x1 - 0.8, 1.6, 19])], { size: 0.55, tone: "lo" }) });
      for (const sy of [-1, 1]) box(`ear${sy}`, [head.x0 + 0.4, sy > 0 ? 0.4 : -1.4, head.z1], [head.x0 + 1.4, sy > 0 ? 1.4 : -0.4, head.z1 + 1.8], "hi", { r: 0.3 });
      for (const sy of [-1, 1]) {
        const BF = G.frameOf([bx1 + 1.5, 0, 19.6], [0, sy, 0], [1, 0, 0], [0, 0, 1]);
        disc(`bar${sy}`, BF, neckHalf, 4.6, 0.4, "mid");
        disc(`grip${sy}`, BF, 4.6, 6.4, 0.7, "lo");
      }
    }
    // exhaust from the engine's near face back past the rear wheel into a silencer
    const yP = hy + 1.2 + 1.3;
    const MF = G.frameOf([xr - 3.5, yP, 4.2], [-1, 0, 0], [0, 1, 0], [0, 0, 1]);
    disc("silencer", MF, 0, 4.5, 1.2, "mid", { extra: Ln(G.circleOf(MF, 4.5, 0.6, P, 20), { tone: "lo" }) });
    pipe("exhaust", [[-2.2, 2.2, 5.2], [-2.2, yP, 5.2], [xr - 3.5, yP, 4.2]], 0.5, "engine");
  }

  // ---- channel 2: a small paddle boat with a sheep's head ----
  function boat() {
    for (const x of [-8, 8]) box(`chock${x}`, [x - 1.5, -3, 0], [x + 1.5, 3, 1.2], "lo", { r: 0.3 });
    const K = { x: -14, y: -4.5, w: 28, d: 9, r: 4 };
    const M = { x: -16, y: -6, w: 32, d: 12, r: 5.5 };
    const T = { x: -17, y: -7, w: 34, d: 14, r: 6.5 };
    box("keel", [K.x, K.y, 1.2], [K.x + K.w, K.y + K.d, 3.2], "lo", { r: K.r, steps: 6, inner: Ln(k.sideSeam(K, 2.2, P, 6), { tone: "faint" }) });
    box("strake", [M.x, M.y, 3.2], [M.x + M.w, M.y + M.d, 5.6], "mid", { r: M.r, steps: 6, inner: Ln(k.sideSeam(M, 4.4, P, 6), { tone: "faint" }) });
    box("gunwale", [T.x, T.y, 5.6], [T.x + T.w, T.y + T.d, 8], "hi", { r: T.r, steps: 6, bevel: 0.4, inner: Ln(k.sideSeam(T, 6.8, P, 6), { tone: "faint" }), extra: Dots([-12, -8, -4, 0, 4, 8, 12].map((x) => at([x, 7, 6.2])), { size: 0.4, tone: "lo" }) });
    const DK = { x: -16, y: -6, w: 32, d: 12, r: 5.5 };
    box("deck", [DK.x, DK.y, 8], [DK.x + DK.w, DK.y + DK.d, 8.5], "mid", { r: DK.r, steps: 6, extra: Ln([-10, -6, -2, 2, 6].map((x) => k.lineOnTop([x, -6], [x, 6], 8.5, P)).join(""), { tone: "faint" }) });
    const win = plane([0, 4, 0], [1, 0, 0], [0, 0, -1]);
    box("cabin", [-9, -4, 8.5], [1, 4, 13.6], "hi", { r: 0.8, steps: 3, bevel: 0.3, extra: `<g transform="${win}">${[-6.4, -2.6].map((x) => `<circle class="sn-port" cx="${x}" cy="-11" r="1.1"/><circle class="iso-line" data-tone="lo" cx="${x}" cy="-11" r="1.5"/>`).join("")}<path class="sn-door" d="M-0.4 -8.5V-12.4H0.6V-8.5Z"/></g>` });
    box("roof", [-9.6, -4.6, 13.6], [1.6, 4.6, 14.4], "mid", { r: 1, steps: 3, bevel: 0.2 });
    box("paddlebox", [-21, -5, 3.4], [-17, 5, 9.4], "mid", { r: 1.4, steps: 3, extra: Ln([4.6, 6, 7.4, 8.8].map((z) => k.planOutline({ x: -20.4, y: 4.98, w: 2.8, d: 0.02, r: 0 }, z, P, 1)).join(""), { tone: "faint" }) + Dots([at([-20, 5, 4.2]), at([-18, 5, 4.2])], { size: 0.45 }) });
    const TP = G.frameOf([-13, 0, 8.5], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
    disc("tiller.post", TP, 0, 2.6, 0.5, "mid");
    box("tiller", [-13.5, -0.35, 11.1], [-9.6, 0.35, 11.7], "lo", { r: 0.2 });
    // the sheep: a wool head of tufts, a face, ears and curled horns
    const Hc = [11, 0, 8.5 + 3.6];
    ball("head", Hc, 3.6, "hi", { lit: true });
    const tuft = [[0, 0, 1], [0.7, 0, 0.71], [-0.7, 0, 0.71], [0, 0.7, 0.71], [0, -0.7, 0.71], [-0.6, 0.55, 0.58], [-0.6, -0.55, 0.58]];
    tuft.forEach((d, i) => ball(`tuft${i}`, G.add3(Hc, G.mul3(G.unit3(d), 5)), 1.4, "hi"));
    const fd = G.unit3([1, 0, -0.3]);
    const face = G.add3(Hc, G.mul3(fd, 5.6));
    ball("face", face, 2, "mid", { extra: Dots([at(G.add3(face, [1.2, 1, 1])), at(G.add3(face, [1.2, -1, 1]))], { size: 0.55, tone: "lo" }) });
    for (const sy of [-1, 1]) {
      ball(`ear${sy}`, G.add3(Hc, G.mul3(G.unit3([0.3, sy, -0.15]), 4.6)), 1, "mid");
      ball(`horn${sy}`, G.add3(Hc, G.mul3(G.unit3([-0.35, sy, 0.15]), 4.9)), 1.3, "lo");
    }
  }

  // ---- channel 3: a shark-shaped submarine ----
  function shark() {
    const L = 36;
    const Kr = 14.3;
    const radius = (s) => {
      const u = Math.min(0.995, Math.max(0.005, s / L));
      return Kr * Math.sqrt(u) * Math.pow(1 - u, 0.8);
    };
    const slope = (s) => {
      const u = Math.min(0.995, Math.max(0.005, s / L));
      return (Kr / L) * (0.5 / Math.sqrt(u) * Math.pow(1 - u, 0.8) - 0.8 * Math.sqrt(u) * Math.pow(1 - u, -0.2));
    };
    const zc = 7;
    const F = G.frameOf([18, 0, zc], [-1, 0, 0], [0, 1, 0], [0, 0, 1]);
    const profile = Array.from({ length: 29 }, (_, i) => {
      const s = 0.4 + (i / 28) * 34.6;
      return [s, radius(s), 1];
    });
    const xOf = (s) => 18 - s;
    for (const x of [6, -8]) {
      const rr = radius(18 - x);
      box(`chock${x}`, [x - 1.4, -2.6, 0], [x + 1.4, 2.6, zc - rr], "lo", { r: 0.3 });
    }
    const port = G.frameOf([9, 0, 8], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
    const ys = Math.sqrt(radius(9) ** 2 - 1);
    const seams = [6, 14, 24].map((s) => G.arcOf(F, s, radius(s), P, { slope: slope(s) })).join("");
    const extra = `<path class="sn-port" d="${G.circleOf(port, ys, 1.5, P, 40)}"/>` + Ln(G.circleOf(port, ys, 1.9, P, 40), { tone: "lo" }) + Dots([at([15.4, 2.2, 8.2])], { size: 0.6, tone: "lo" }) + Dots([3, 1.6, 0.2].map((x) => at([x, Math.sqrt(radius(18 - x) ** 2 - 4), 5])), { size: 0.45, tone: "lo" });
    turned("body", F, profile, "hi", { smooth: { slope, radius }, inner: Ln(seams, { tone: "faint" }), extra });
    const top = (x) => zc + radius(18 - x);
    const DF = G.frameOf([0, 0, 0], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
    const finBase = Math.max(...Array.from({ length: 29 }, (_, i) => top(-1 + i * 0.25)));
    prism("dorsal", DF, [[-1, finBase], [6, finBase], [0.8, finBase + 6.4]], -0.5, 0.5, "mid", { lit: true });
    for (const sy of [-1, 1]) {
      const PF = G.frameOf([0, 0, 0], [0, 0, 1], [1, 0, 0], [0, sy, 0]);
      const yb = Math.sqrt(radius(14) ** 2 - 1) - 0.25;
      prism(`pectoral${sy}`, PF, [[2, yb], [7, yb], [2.6, yb + 4]], 5.6, 6.4, "mid");
    }
    const tip = xOf(35);
    const TF = G.frameOf([0, 0, 0], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
    prism("tail.upper", TF, [[tip, zc], [tip - 6, zc + 6.4], [tip - 4.2, zc]], -0.45, 0.45, "mid");
    prism("tail.lower", TF, [[tip, zc], [tip - 4.2, zc], [tip - 5.6, zc - 4.4]], -0.45, 0.45, "mid");
    const PS = G.frameOf([9, 0, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
    disc("periscope", PS, top(9) - 0.1, top(9) + 3.6, 0.55, "mid");
    box("periscope.head", [8.4, -0.6, top(9) + 3.6], [10.8, 0.6, top(9) + 4.8], "mid", { r: 0.3, extra: Dots([at([10.8, 0, top(9) + 4.2])], { size: 0.5, tone: "lo" }) });
    const HT = G.frameOf([-6.5, 0, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
    disc("hatch", HT, top(-5.1), top(-5.1) + 0.6, 1.4, "mid", { extra: Ln(G.circleOf(HT, top(-5.1) + 0.6, 0.8, P, 24), { tone: "lo" }) });
    // the propeller pod under the tail
    const podTop = zc - radius(29);
    const PZ = podTop - 1.3;
    const PODF = G.frameOf([-11, 0, PZ], [-1, 0, 0], [0, 1, 0], [0, 0, 1]);
    disc("pod", PODF, 0, 6, 1.3, "mid");
    const hubFace = plane([-17.92, 0, PZ], [0, 1, 0], [0, 0, -1]);
    const blades = [0, 1, 2].map((i) => {
      const a = (i / 3) * Math.PI * 2 + 0.4;
      const pt = (r, t) => `${f2(r * Math.cos(a) - t * Math.sin(a))} ${f2(r * Math.sin(a) + t * Math.cos(a))}`;
      return `M${pt(0.6, -0.5)}Q${pt(1.6, -1.1)} ${pt(2.3, -0.4)}L${pt(2.3, 0.4)}Q${pt(1.4, 0.6)} ${pt(0.6, 0.5)}Z`;
    }).join("");
    put("prop", G.add3(PODF.o, G.mul3(PODF.a, 6.45)), S(G.disc(6, 6.9, 0.7, PODF, P), { tone: "hi" }) + `<g transform="${hubFace}"><path class="sn-blade" d="${blades}"/></g>`, [A.disc(PODF, 6, 6.9, 0.7, { name: "prop.hub", owner }), A.disc(PODF, 6.9, 6.95, 2.3, { name: "prop.blades", owner })]);
  }

  // ---- channel 5: a long-necked tank on tracks ----
  function tank() {
    for (const sy of [-1, 1]) {
      const [y0, y1] = sy > 0 ? [4, 8] : [-8, -4];
      const plan = { x: -14, y: y0, w: 28, d: 4, r: 2.6 };
      box(`track${sy}`, [plan.x, y0, 0], [plan.x + plan.w, y1, 5.5], "lo", { r: 2.6, steps: 6, inner: Ln(k.sideSeam(plan, 4.6, P, 6), { tone: "mid" }) });
      box(`fender${sy}`, [-14.4, y0, 5.5], [14.4, y1 + (sy > 0 ? 0.4 : 0), 6.1], "mid", { r: 0.4 });
    }
    const near = (x, z, r, name, tone = "mid", teeth = 0) => {
      const F = G.frameOf([x, 8, z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
      disc(name, F, 0, 0.8, r, tone, { extra: Ln(G.circleOf(F, 0.8, r * 0.5, P, 24), { tone: "lo" }) + (teeth ? Dots(G.dotsOf(F, 0.8, r * 0.82, teeth, P, { all: true }), { size: 0.45, tone: "lo" }) : Dots([at([x, 8.8, z])], { size: 0.4, tone: "lo" })) });
    };
    near(-11.2, 2.8, 2.3, "sprocket.rear", "hi", 9);
    near(11.2, 2.8, 2.3, "sprocket.front", "hi", 9);
    [-6.6, -2.2, 2.2, 6.6].forEach((x, i) => near(x, 2.6, 1.9, `road${i}`));
    box("hull", [-13, -4, 1.4], [13, 4, 7], "mid", { r: 0.8, steps: 2, bevel: 0.3, extra: Dots([at([13, 2.2, 5.6]), at([13, -2.2, 5.6])], { size: 0.6, tone: "hi" }) });
    const U = { x: -11, y: -4.4, w: 20, d: 8.8, r: 1.2 };
    box("upper", [U.x, U.y, 7], [U.x + U.w, U.y + U.d, 10], "hi", { r: 1.2, steps: 3, bevel: 0.4, inner: Ln(k.sideSeam(U, 8.5, P, 3), { tone: "faint" }), extra: Dots([-9, -6, -3, 0, 3, 6].map((x) => at([x, 4.4, 9.2])), { size: 0.4, tone: "lo" }) });
    const HT = G.frameOf([-5, 0, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
    disc("hatch", HT, 10, 10.8, 2.4, "mid", { extra: Ln(G.circleOf(HT, 10.8, 1.5, P, 32), { tone: "lo" }) + Dots(G.dotsOf(HT, 10.8, 1.95, 6, P, { all: true }), { size: 0.4, tone: "lo" }) });
    box("hatch.hinge", [-7.8, -1, 10], [-7.4, 1, 11.2], "lo", { r: 0.2 });
    for (const sy of [-1, 1]) {
      const EF = G.frameOf([-9, sy * 2.6, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
      disc(`stack${sy}`, EF, 10, 13, 0.7, "mid");
      disc(`stack.cap${sy}`, EF, 13, 13.6, 0.95, "lo");
    }
    // the neck: a ball joint and four segments with collars, then the head
    const B = [6, 0, 12];
    ball("neck.joint", B, 2, "mid");
    const axis = G.unit3([0.45, 0, 0.89]);
    const N = G.frameAlong(B, axis);
    const segs = [[1.2, 3.2, 1.6, "hi"], [3.2, 3.8, 1.9, "mid"], [3.8, 5.8, 1.5, "hi"], [5.8, 6.4, 1.8, "mid"], [6.4, 8.4, 1.4, "hi"], [8.4, 9, 1.7, "mid"], [9, 11, 1.3, "hi"]];
    segs.forEach(([s0, s1, r, tone], i) => disc(`neck${i}`, N, s0, s1, r, tone));
    const hs = 11 + Math.sqrt(2.3 * 2.3 - 1.3 * 1.3);
    const head = G.add3(B, G.mul3(axis, hs));
    ball("head", head, 2.3, "hi", { lit: true, extra: Dots([at(G.add3(head, [0.8, 1.9, 0.8]))], { size: 0.6, tone: "lo" }) });
    ball("snout", G.add3(head, [3.6, 0, -0.2]), 1.3, "hi");
  }

  A.settle(R, P);
  R.items.sort((a, b) => a.key - b.key);
  if (audit) {
    console.log(`--- Fig 2b, channel ${c}: ${R.items.length} items, ${R.solids.length} solids`);
    A.auditOrExit(R, P, {});
  }
  return { svg: stand.join("") + `<g${c === 4 ? ' class="sn-black"' : ""}>${R.items.map((item) => item.svg).join("")}</g>`, items: R.items.length };
}
