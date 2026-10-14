const D = __DATA__;
const T = __TEXT__;
const stage = document.querySelector(".sn-stage");
const backSvg = stage.querySelector("svg");
const frontSvg = stage.querySelector(".sn-front");
const root = frontSvg.querySelector("[data-ship-root]");
const puffLayer = backSvg.querySelector("[data-puffs]");
const shadow = backSvg.querySelector(".sn-shadow");
const fbAir = backSvg.querySelector(".sn-fb-air");
const fbGaon = frontSvg.querySelector(".sn-fb-gaon");
const fbCore = frontSvg.querySelector(".sn-fb-core");
const fbMouth = frontSvg.querySelector(".sn-fb-mouth");
const gaonBtn = document.querySelector("[data-gaon]");
const detailGroups = [...document.querySelectorAll("[data-detail]")];
const detailReadout = document.querySelector("[data-detail-readout]");
const detailSpin = document.querySelector("[data-dspin]");
const LIGHT = document.body.dataset.theme === "light" ? 1 : 0;
const readout = document.querySelector("[data-readout]");
const liveEl = document.querySelector("[data-live]");
const captionEl = document.querySelector("[data-caption]");
const chButtons = [...document.querySelectorAll(".sn-ch")];
const partButtons = [...document.querySelectorAll(".sn-part")];
const fireBtn = document.querySelector("[data-fire]");
const refillBtn = document.querySelector("[data-refill]");
const closeBtn = document.querySelector("[data-close]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const fmt = (s, v = {}) => s.replace(/\{(\w+)\}/g, (_, key) => (key in v ? v[key] : ""));
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const items = [...root.children].filter((el) => el.classList.contains("it"));
const shipItems = items.filter((el) => el.hasAttribute("data-ship"));
const partItems = {};
for (const el of items) {
  const id = el.dataset.part;
  if (!id) continue;
  (partItems[id] = partItems[id] || []).push(el);
}

// ---------- mechanism state ----------
const glide = () => ({ x: 0, v: 0 });
// critically damped follow: velocity stays continuous, no overshoot
function follow(s, target, dt, tau, calm) {
  if (calm) {
    s.x = target;
    s.v = 0;
    return false;
  }
  const w = 1 / tau;
  for (let i = 0; i < 4; i++) {
    const h = dt / 4;
    s.v += (w * w * (target - s.x) - 2 * w * s.v) * h;
    s.x += s.v * h;
  }
  if (Math.abs(target - s.x) < 1e-3 && Math.abs(s.v) < 1e-3) {
    s.x = target;
    s.v = 0;
    return false;
  }
  return true;
}

const bays = [0, 1, 2, 3, 4, 5].map((c) => {
  const el = c === 0 ? root.querySelector('[data-name="paddle"]') : root.querySelector(`[data-veh="${c}"]`);
  const mark = document.createComment(`bay ${c}`);
  el.before(mark);
  return {
    c,
    el,
    mark,
    front: false,
    door: glide(),
    veh: glide(),
    slide: c === 0 ? el.querySelector('[data-slide="paddle"]') : el.querySelector(`[data-slide="veh${c}"]`),
    rail: c === 0 ? null : el.querySelector(`[data-slide="rail${c}"]`),
    doorEl: c === 0 ? null : root.querySelector(`[data-slide="door${c}"]`),
    spinEl: c === 0 ? el.querySelector("[data-spin]") : null,
    shown: "",
  };
});
const dialEl = root.querySelector("[data-dial]");
const HOME = -150;
const dial = { x: HOME, v: 0 };
let channel = null;
let spin = 0;

const barrelEls = [...root.querySelectorAll("[data-barrel]")].sort((a, b) => a.dataset.barrel - b.dataset.barrel);
const MAX = barrelEls.length;
const used = new Set();
const cola = () => MAX - used.size;

let coupState = null; // { phase, t, take: [] }
let gaon = null; // { phase, t, take: [] }
const GAON_COST = 2; // the model's own gauge: barrels one Gaon shot draws from the rack
let stillFx = null; // reduced motion: one representative frame, held briefly
let lift = 0;
let liftShown = -1;

const PUFFS = 8;
const puffEls = Array.from({ length: PUFFS }, () => {
  const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  c.setAttribute("class", "sn-puff");
  c.setAttribute("r", "0");
  c.style.opacity = "0";
  puffLayer.appendChild(c);
  return c;
});

// ---------- words ----------
let mechText = "";
let pinned = null; // part chosen from the legend or by a click
let hovered = null;
let auto = null; // part lit by the tour or by a coupState
let lastLive = "";
function say(text) {
  if (readout.textContent !== text) readout.textContent = text;
}
function announce(text) {
  if (text && text !== lastLive) {
    lastLive = text;
    liveEl.textContent = text;
  }
}
function setMech(text) {
  mechText = text;
  refreshWords();
}
function captionFor() {
  const part = hovered || pinned || auto;
  if (part) return T.parts[part].caption;
  if (coupState) return T.parts.coup.caption;
  if (gaon) return T.parts.gaon.caption;
  if (channel !== null) return T.channels[channel].caption;
  return T.caption;
}
function refreshWords() {
  const part = hovered || pinned || auto;
  if (part && !(coupState && part === "coup") && !(gaon && part === "gaon")) say(fmt(T.read.part, { n: D.parts.indexOf(part) + 1, name: T.parts[part].name }));
  else say(mechText);
  const caption = captionFor();
  if (captionEl.textContent !== caption) captionEl.textContent = caption;
}
function idleText() {
  if (channel !== null) return fmt(T.read.channel, { c: channel, name: T.channels[channel].name });
  return fmt(T.read.idle, { cola: cola(), max: MAX });
}

// ---------- selection: one lit part ----------
let litShown = null;
function paintSelection() {
  const id = hovered || pinned || auto;
  if (id === litShown) return;
  litShown = id;
  for (const el of items) {
    if (id && el.dataset.part === id) el.setAttribute("data-on", "");
    else el.removeAttribute("data-on");
  }
  if (id) stage.setAttribute("data-focus", "");
  else stage.removeAttribute("data-focus");
  for (const b of partButtons) b.setAttribute("aria-pressed", String(b.dataset.part === (pinned || auto) && !!(pinned || auto)));
}
function choose() {
  paintSelection();
  refreshWords();
}

// ---------- actions ----------
function setChannel(c) {
  if (coupState || gaon) return;
  channel = c;
  chButtons.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.ch) === c)));
  if (c === null) {
    setMech(fmt(T.read.idle, { cola: cola(), max: MAX }));
    announce(T.live.closed);
  } else {
    setMech(fmt(T.read.channel, { c, name: T.channels[c].name }));
    announce(fmt(T.live.open, { c, name: T.channels[c].name }));
  }
  run();
}
function fire() {
  if (coupState || gaon) return;
  if (cola() < 3) {
    setMech(T.read.empty);
    announce(T.live.empty);
    return;
  }
  setChannel(null);
  coupState = { phase: "arm", t: 0, take: [] };
  auto = "coup";
  setMech(T.read.arming);
  choose();
  run();
}
function fireGaon() {
  if (coupState || gaon) return;
  if (cola() < GAON_COST) {
    setMech(T.read.empty);
    announce(T.live.empty);
    return;
  }
  gaon = { phase: "charge", t: 0, take: [...Array(MAX).keys()].filter((i) => !used.has(i)).slice(0, GAON_COST) };
  auto = "gaon";
  setMech(fmt(T.read.gaonLoading, { n: 0, cost: GAON_COST }));
  choose();
  run();
}
function refill() {
  if (coupState || gaon) return;
  used.clear();
  for (const el of barrelEls) {
    el.removeAttribute("data-empty");
    el.removeAttribute("data-draining");
  }
  setMech(fmt(T.read.refilled, { cola: cola(), max: MAX }));
  announce(T.live.refilled);
  syncButtons();
}
function syncButtons() {
  fireBtn.toggleAttribute("disabled", cola() < 3);
  gaonBtn.toggleAttribute("disabled", cola() < GAON_COST);
}

function dockClosed() {
  return bays.every((b) => b.door.x < 0.002 && b.veh.x < 0.002) && Math.abs(dial.x - HOME) < 1.5;
}

// ---------- the frame loop ----------
let frame = 0;
let last = 0;
let visible = true;
let touring = !still.matches;
let tourAt = 0;
let tourWait = 1.4;
let idleTimer = 0;

function stepBays(dt, calm) {
  let moving = false;
  const target = channel === null || coupState ? HOME : D.dial[channel];
  moving = follow(dial, target, dt, 0.16, calm) || moving;
  const arrived = Math.abs(dial.x - target) < 1.5;
  for (const b of bays) {
    const want = !coupState && channel === b.c && arrived;
    if (b.c === 0) {
      moving = follow(b.veh, want ? 1 : 0, dt, 0.22, calm) || moving;
    } else if (want) {
      moving = follow(b.door, 1, dt, 0.14, calm) || moving;
      moving = follow(b.veh, b.door.x > 0.97 ? 1 : 0, dt, 0.2, calm) || moving;
    } else {
      moving = follow(b.veh, 0, dt, 0.16, calm) || moving;
      moving = follow(b.door, b.veh.x < 0.02 ? 0 : 1, dt, 0.12, calm) || moving;
    }
  }
  return moving;
}

function place() {
  dialEl.setAttribute("transform", `rotate(${dial.x.toFixed(2)})`);
  for (const b of bays) {
    const out = b.veh.x;
    const front = out > 0.001;
    if (front !== b.front) {
      b.front = front;
      if (front) root.appendChild(b.el);
      else b.mark.after(b.el);
    }
    const dist = (b.c === 0 ? D.PADDLE_OUT : D.OUT) * out;
    const dx = D.out[0] * dist;
    const dy = D.out[1] * dist;
    const text = out ? `translate(${dx.toFixed(2)} ${dy.toFixed(2)})` : "";
    if (text !== b.shown) {
      b.shown = text;
      if (text) b.slide.setAttribute("transform", text);
      else b.slide.removeAttribute("transform");
      if (b.c === 0) holdStill(b.slide, [Number(dx.toFixed(2)), Number(dy.toFixed(2))]);
      if (b.rail) {
        const r = D.RAIL_OUT * out;
        b.rail.setAttribute("transform", `translate(${(D.out[0] * r).toFixed(2)} ${(D.out[1] * r).toFixed(2)})`);
      }
    }
    if (b.doorEl) {
      const up = D.SHUTTER * b.door.x;
      if (up > 0.001) b.doorEl.setAttribute("transform", `translate(${(D.up[0] * up).toFixed(2)} ${(D.up[1] * up).toFixed(2)})`);
      else b.doorEl.removeAttribute("transform");
    }
    if (b.spinEl) b.spinEl.setAttribute("transform", `rotate(${spin.toFixed(1)})`);
  }
  if (Math.abs(lift - liftShown) > 0.004) {
    liftShown = lift;
    const text = lift > 0.004 ? `translate(${(D.up[0] * lift).toFixed(2)} ${(D.up[1] * lift).toFixed(2)})` : "";
    for (const el of shipItems) {
      if (text) el.setAttribute("transform", text);
      else el.removeAttribute("transform");
    }
    shadow.style.opacity = String(1 - 0.75 * (lift / D.LIFT));
  }
}

const liftAt = (t) => D.LIFT * smooth(0, 0.8, t) * (1 - smooth(1.7, 3.9, t));
function stepBurst(dt, calm) {
  if (!coupState) return false;
  coupState.t += dt;
  if (coupState.phase === "arm") {
    if (dockClosed()) {
      coupState.phase = "load";
      coupState.t = 0;
      coupState.take = [...Array(MAX).keys()].filter((i) => !used.has(i)).slice(0, 3);
    }
    return true;
  }
  if (coupState.phase === "load") {
    const step = calm ? 0 : 0.32;
    const n = calm ? 3 : Math.min(3, Math.floor(coupState.t / step));
    coupState.take.forEach((i, k) => {
      const el = barrelEls[i];
      if (k < n) {
        el.removeAttribute("data-draining");
        el.setAttribute("data-empty", "");
        used.add(i);
      } else if (k === n) el.setAttribute("data-draining", "");
    });
    setMech(fmt(T.read.loading, { n: Math.min(3, n) }));
    if (n >= 3 && coupState.t >= (calm ? 0 : 3 * step + 0.2)) {
      coupState.phase = "fly";
      coupState.t = 0;
      auto = null;
      choose();
      setMech(fmt(T.read.fired, { cola: cola(), max: MAX }));
      announce(fmt(T.live.fired, { cola: cola() }));
      syncButtons();
    }
    return true;
  }
  if (coupState.phase === "fly") {
    const t = coupState.t;
    lift = calm ? 0 : liftAt(t);
    drawPuffs(calm ? -1 : t);
    if (t > 4.1 || calm) {
      if (calm) stillFx = { kind: "air", left: 1.8 };
      lift = 0;
      drawPuffs(-1);
      coupState = null;
      auto = null;
      setMech(fmt(T.read.landed, { cola: cola(), max: MAX }));
      choose();
      return false;
    }
    return true;
  }
  return false;
}

const CHARGE = 1.0;
function stepGaon(dt, calm) {
  if (!gaon) return false;
  gaon.t += dt;
  const n = calm ? GAON_COST : Math.min(GAON_COST, Math.floor((gaon.t / CHARGE) * (GAON_COST + 0.6)));
  gaon.take.forEach((i, k) => {
    const el = barrelEls[i];
    if (k < n) {
      el.removeAttribute("data-draining");
      el.setAttribute("data-empty", "");
      used.add(i);
    } else if (k === n) el.setAttribute("data-draining", "");
  });
  if (gaon.phase === "charge") {
    setMech(fmt(T.read.gaonLoading, { n, cost: GAON_COST }));
    if (gaon.t >= CHARGE || calm) {
      gaon.phase = "fire";
      gaon.t = calm ? 0 : gaon.t - CHARGE;
      setMech(fmt(T.read.gaonFired, { cola: cola(), max: MAX }));
      announce(fmt(T.live.gaon, { cola: cola() }));
      syncButtons();
    }
    return true;
  }
  if (gaon.t > 2.6 || calm) {
    if (calm) stillFx = { kind: "gaon", left: 1.8 };
    gaon = null;
    auto = null;
    choose();
    return false;
  }
  return true;
}

// ---------- effect envelopes: every uniform rides an attack and a decay ----------
function airAt(age) {
  if (age < 0) return null;
  return {
    uAge: age,
    uJet: burst_(age, 0.07, 0.55),
    uLen: 120 * (1 - Math.exp(-age / 0.18)),
    uRing: burst_(age, 0.05, 0.28),
    uRingR: 5 + 62 * (1 - Math.exp(-age / 0.35)),
    uRingS: 5 + 34 * (1 - Math.exp(-age / 0.3)),
    uMist: burst_(age - 0.05, 0.3, 1.0) * 1.6,
    uMistS: 18 + 46 * (1 - Math.exp(-age / 0.8)),
    uMistR: 14 + 30 * (1 - Math.exp(-age / 0.9)),
  };
}
function gaonAt(phase, t) {
  if (phase === "charge") return { uCharge: smooth(0, CHARGE, t), uBeam: 0, uLen: 0, uFlash: 0 };
  const age = t;
  return {
    uCharge: 1 - smooth(0, 0.35, age),
    uBeam: burst_(age, 0.07, 0.5),
    uLen: 110 * (1 - Math.exp(-age / 0.12)),
    uFlash: burst_(age, 0.04, 0.13),
  };
}
function burst_(age, rise, fall) {
  return burst(age, rise, fall);
}

function drawPuffs(t) {
  puffEls.forEach((el, i) => {
    const born = i * 0.075;
    const a = t - born;
    if (t < 0 || a < 0 || a > 1.8) {
      if (el.style.opacity !== "0") el.style.opacity = "0";
      return;
    }
    const dist = 8 + a * 70 + i * 2.5;
    const side = (i % 3) - 1;
    const z = liftAt(born) + a * 7;
    const x = D.puff.from[0] + D.puff.back[0] * dist + D.out[0] * side * 4 * a + D.up[0] * z;
    const y = D.puff.from[1] + D.puff.back[1] * dist + D.out[1] * side * 4 * a + D.up[1] * z;
    const r = (3 + a * 15) * D.scale;
    const o = smooth(0, 0.08, a) * Math.exp(-a / 0.55);
    el.setAttribute("cx", x.toFixed(1));
    el.setAttribute("cy", y.toFixed(1));
    el.setAttribute("r", r.toFixed(1));
    el.style.opacity = o.toFixed(3);
  });
}


// ---------- WebGL: the air blast behind the ship, the Gaon blast in front of it ----------
const DITHER = `
vec4 over(vec4 a,vec4 b){return a+b*(1.-a.a);}
float edgeFade(vec2 vb){return smoothstep(2.,18.,vb.x)*smoothstep(2.,18.,uView.x-vb.x)*smoothstep(2.,18.,vb.y)*smoothstep(2.,18.,uView.y-vb.y);}
vec4 finish(vec4 ink){
  float n=(hash12(gl_FragCoord.xy+fract(uTime*.61)*91.)+hash12(gl_FragCoord.yx*1.37+fract(uTime*.37)*57.)-1.)/255.;
  ink=max(ink+n*smoothstep(0.,1.5/255.,ink.a),0.);
  ink.a=min(ink.a,1.);
  ink.rgb=min(ink.rgb,vec3(ink.a));
  return ink;
}
// closest approach of this pixel's ray to the axis O + s*D: returns (s along the axis, distance, t along the ray)
vec3 axisHit(vec3 p0,vec3 V,vec3 O,vec3 D){
  vec3 w0=p0-O;
  float b=dot(V,D),d=dot(V,w0),e=dot(D,w0);
  float den=max(1.-b*b,1e-4);
  float s=(e-b*d)/den;
  float t=(b*e-d)/den;
  return vec3(s,length(O+s*D-(p0+t*V)),t);
}`;
const AIR = `
uniform float uJet,uLen,uRing,uRingR,uRingS,uMist,uMistS,uMistR,uAge,uLift,uLight;
uniform vec3 uMuzzle;
${DITHER}
void main(){
  if(uJet+uRing+uMist<.0004){gl_FragColor=vec4(0.);return;}
  vec2 vb=viewOf(gl_FragCoord.xy);
  vec3 V=towardViewer();
  vec3 p0=rayOf(vb);
  vec3 M=uMuzzle+vec3(0.,0.,uLift);
  vec3 D=vec3(-1.,0.,0.);
  vec3 h=axisHit(p0,V,M,D);
  float s=h.x,r=h.y;
  vec3 pr=p0+h.z*V;
  float sig=3.+.2*max(s,0.);
  float along=smoothstep(-1.5,3.,s)*(1.-smoothstep(uLen-26.,uLen,s))*exp(-max(s,0.)/100.);
  float turb=.55+.9*fbm3(pr*.09+vec3(uAge*2.4,0.,0.));
  float jet=uJet*along*exp(-r*r/(sig*sig))*(9./sig)*turb;
  vec3 C=M+D*uMistS+vec3(0.,0.,uAge*5.);
  float tc=dot(C-p0,V);
  vec3 nearC=p0+tc*V;
  float dm=length(nearC-C);
  float mist=uMist*exp(-dm*dm/(uMistR*uMistR))*(.4+.9*fbm3(nearC*.06+vec3(uAge*.8,0.,uAge*.5)));
  float tr=(M.x-uRingS-p0.x)/V.x;
  vec3 qr=p0+tr*V;
  float rr=length(qr.yz-M.yz);
  float wr=1.3+uRingR*.05;
  float ring=uRing*exp(-pow((rr-uRingR)/wr,2.));
  float dens=jet+mist;
  float a=(1.-exp(-dens*1.2))*mix(1.,1.15,uLight);
  float ra=.8*(1.-exp(-ring*1.6));
  float body=smoothstep(.3,1.6,jet);
  vec3 haze=mix(mix(vec3(.46,.49,.53),vec3(.84,.87,.9),body),mix(vec3(.72,.77,.83),vec3(.56,.62,.7),body),uLight);
  vec3 ringC=mix(vec3(.9,.93,.96),vec3(.46,.52,.6),uLight);
  gl_FragColor=finish(over(vec4(ringC*ra,ra),vec4(haze*a,a))*edgeFade(vb));
}`;
const GAON_GL = `
uniform float uCharge,uBeam,uLen,uFlash,uLight;
uniform vec3 uStart;
${DITHER}
vec4 inkFor(vec3 seen,float cover){vec3 ab=1.-seen;float a=max(max(ab.r,max(ab.g,ab.b)),cover);return vec4(vec3(a)-ab,a);}
void main(){
  if(uCharge+uBeam+uFlash<.0004){gl_FragColor=vec4(0.);return;}
  vec2 vb=viewOf(gl_FragCoord.xy);
  vec3 V=towardViewer();
  vec3 p0=rayOf(vb);
  vec3 S=uStart;
  vec3 h=axisHit(p0,V,S,vec3(1.,0.,0.));
  float s=h.x,r=h.y;
  float rho=1.3+.03*max(s,0.)+.7*uBeam;
  float along=smoothstep(-1.,4.,s)*(1.-smoothstep(uLen-18.,uLen,s))*exp(-max(s,0.)/170.);
  float flick=.85+.3*noise3(vec3(s*.12-uTime*9.,r*.4,uTime*3.));
  float core=uBeam*along*exp(-r*r/(rho*rho))*flick;
  float halo=uBeam*along*exp(-r*r/(9.*rho*rho))*.35;
  float tc=dot(S-p0,V);
  float dc=length(p0+tc*V-S);
  float rb=1.4+3.4*uCharge;
  float ball=uCharge*exp(-dc*dc/(rb*rb))*1.3;
  float flash=uFlash*exp(-dc*dc/25.)*1.3;
  float en=core*1.6+ball+flash;
  vec3 col=tonemap(vec3(1.,.5,.14)*(en+halo)+vec3(1.,.92,.75)*en*en*.5,1.25);
  vec4 dark=vec4(col,max(col.r,max(col.g,col.b)));
  float e2=1.-exp(-1.5*en);
  vec3 seen=mix(vec3(1.),vec3(.97,.5,.1),smoothstep(.04,.5,e2));
  seen=mix(seen,vec3(1.,.86,.55),smoothstep(.55,.85,e2));seen=mix(seen,vec3(1.,.96,.84),smoothstep(.86,.99,e2));
  vec4 light=inkFor(seen,.92*smoothstep(.6,.92,e2));
  gl_FragColor=finish(mix(dark,light,uLight)*edgeFade(vb));
}`;
const airLayer = glLayer({ canvas: stage.querySelector(".sn-gl-air"), fragment: AIR, view: [D.W, D.H], camera: D.camera, uniforms: ["uJet", "uLen", "uRing", "uRingR", "uRingS", "uMist", "uMistS", "uMistR", "uAge", "uLift"], fixed: { uLight: LIGHT, uMuzzle: D.muzzle } });
const gaonLayer = glLayer({ canvas: stage.querySelector(".sn-gl-gaon"), fragment: GAON_GL, view: [D.W, D.H], camera: D.camera, uniforms: ["uCharge", "uBeam", "uLen", "uFlash"], fixed: { uLight: LIGHT, uStart: D.gaon } });
if (airLayer) stage.setAttribute("data-gl-air", "");
if (gaonLayer) stage.setAttribute("data-gl-gaon", "");
let airDrawn = false;
let gaonDrawn = false;
let fxClock = 0;

// a tapered beam in screen space between two world points, for the no-WebGL fallback
function beamPath(a, b, r0, r1) {
  const A0 = iso(a, D.P);
  const B0 = iso(b, D.P);
  const dx = B0[0] - A0[0];
  const dy = B0[1] - A0[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const k = D.scale;
  const p = (P0, r, sgn) => `${(P0[0] + nx * r * k * sgn).toFixed(1)} ${(P0[1] + ny * r * k * sgn).toFixed(1)}`;
  return `M${p(A0, r0, 1)}L${p(B0, r1, 1)}Q${(B0[0] + (dx / len) * r1 * k).toFixed(1)} ${(B0[1] + (dy / len) * r1 * k).toFixed(1)} ${p(B0, r1, -1)}L${p(A0, r0, -1)}Z`;
}
function drawAir(u) {
  if (airLayer) {
    if (u) {
      airLayer.draw({ ...u, uLift: lift }, fxClock);
      airDrawn = true;
    } else if (airDrawn) {
      airLayer.clear();
      airDrawn = false;
    }
    return;
  }
  if (!u) {
    fbAir.setAttribute("d", "");
    return;
  }
  const M = [D.muzzle[0], D.muzzle[1], D.muzzle[2] + lift];
  const len = Math.max(1, u.uLen * 0.8);
  fbAir.setAttribute("d", beamPath(M, [M[0] - len, M[1], M[2]], 2.2, 2.2 + 0.17 * len));
  fbAir.style.opacity = (0.8 * u.uJet).toFixed(3);
}
function drawGaon(u) {
  if (gaonLayer) {
    if (u) {
      gaonLayer.draw(u, fxClock);
      gaonDrawn = true;
    } else if (gaonDrawn) {
      gaonLayer.clear();
      gaonDrawn = false;
    }
    return;
  }
  if (!u) {
    fbGaon.setAttribute("d", "");
    fbCore.setAttribute("d", "");
    fbMouth.setAttribute("r", "0");
    return;
  }
  const S0 = D.gaon;
  const len = Math.max(0.5, u.uLen * 0.85);
  fbGaon.setAttribute("d", u.uBeam > 0.002 ? beamPath(S0, [S0[0] + len, S0[1], S0[2]], 1.8, 1.8 + 0.035 * len) : "");
  fbGaon.style.opacity = Math.min(1, u.uBeam * 1.1).toFixed(3);
  fbCore.setAttribute("d", u.uBeam > 0.002 ? beamPath(S0, [S0[0] + len * 0.8, S0[1], S0[2]], 0.6, 0.6 + 0.012 * len) : "");
  fbCore.style.opacity = Math.min(1, u.uBeam * 1.1).toFixed(3);
  const m = iso(S0, D.P);
  const glow = Math.max(u.uCharge, u.uFlash);
  fbMouth.setAttribute("cx", m[0].toFixed(1));
  fbMouth.setAttribute("cy", m[1].toFixed(1));
  fbMouth.setAttribute("r", ((1.4 + 3.4 * glow) * D.scale).toFixed(2));
  fbMouth.style.opacity = Math.min(1, glow).toFixed(3);
}
function stepEffects(dt, calm) {
  fxClock += calm ? 0 : dt;
  let air = null;
  let gl2 = null;
  if (coupState && coupState.phase === "fly" && !calm) air = airAt(coupState.t);
  if (gaon && !calm) gl2 = gaonAt(gaon.phase, gaon.t);
  if (stillFx) {
    stillFx.left -= dt;
    if (stillFx.kind === "air") air = airAt(0.35);
    else gl2 = gaonAt("fire", 0.25);
    if (stillFx.left <= 0) {
      stillFx = null;
      air = null;
      gl2 = null;
    }
  }
  if (air && air.uJet + air.uRing + air.uMist < 1e-3 && coupState && coupState.t > 1) air = null;
  if (gl2 && gl2.uCharge + gl2.uBeam + gl2.uFlash < 1e-3 && gaon && gaon.phase === "fire" && gaon.t > 0.5) gl2 = null;
  drawAir(air);
  drawGaon(gl2);
  return Boolean(air || gl2 || stillFx);
}
addEventListener("resize", () => run());

// ---------- Fig 2b: the selected channel's vehicle ----------
let shownDetail = 1;
let detailText = "";
function syncDetail() {
  const c = channel === null ? shownDetail : channel;
  if (c !== shownDetail || !detailText) {
    shownDetail = c;
    for (const g of detailGroups) {
      if (Number(g.dataset.detail) === c) g.removeAttribute("data-off");
      else g.setAttribute("data-off", "");
    }
  }
  const text = fmt(T.read.channel, { c, name: T.channels[c].name });
  if (text !== detailText) {
    detailText = text;
    detailReadout.textContent = text;
  }
}

// ---------- idle tour ----------
const TOUR = [
  [() => setChannel(1), 2.8],
  [() => setChannel(2), 2.8],
  [() => setChannel(3), 2.8],
  [() => setChannel(4), 2.8],
  [() => setChannel(5), 2.8],
  [() => setChannel(0), 3.4],
  [() => setChannel(null), 1.6],
  [() => {
    if (cola() < 3) refill();
    fire();
  }, 6.4],
  [() => {
    if (cola() < GAON_COST) refill();
    fireGaon();
  }, 4.2],
  ...D.parts.map((id) => [() => {
    auto = id;
    choose();
  }, 1.8]),
  [() => {
    auto = null;
    choose();
    setMech(idleText());
  }, 1.2],
];
function stepTour(dt) {
  if (!touring) return false;
  tourWait -= dt;
  if (tourWait <= 0 && !coupState && !gaon) {
    const [act, wait] = TOUR[tourAt % TOUR.length];
    tourAt++;
    act();
    tourWait = wait;
  }
  return true;
}
function takeOver() {
  if (touring) {
    touring = false;
    if (!coupState) auto = null;
    choose();
  }
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (still.matches) return;
    touring = true;
    tourAt = 0;
    tourWait = 0.8;
    run();
  }, 9000);
}

function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  let busy = stepTour(dt);
  busy = stepBurst(dt, calm) || busy;
  busy = stepGaon(dt, calm) || busy;
  busy = stepEffects(dt, calm) || busy;
  busy = stepBays(dt, calm) || busy;
  const paddle = bays[0].veh.x;
  if (paddle > 0.5 && !calm) {
    spin = (spin + dt * 150 * smooth(0.5, 1, paddle)) % 360;
    busy = true;
  }
  place();
  syncDetail();
  if (detailSpin) detailSpin.setAttribute("transform", `rotate(${spin.toFixed(1)})`);
  frame = visible && busy ? requestAnimationFrame(tick) : 0;
}
function run() {
  if (!frame && visible) {
    last = 0;
    frame = requestAnimationFrame(tick);
  }
}

// ---------- input ----------
stage.addEventListener("pointerover", (e) => {
  const el = e.target.closest(".it[data-part]");
  const id = el ? el.dataset.part : null;
  if (id !== hovered) {
    hovered = id;
    choose();
  }
});
stage.addEventListener("pointerleave", () => {
  if (hovered) {
    hovered = null;
    choose();
  }
});
stage.addEventListener("click", (e) => {
  const el = e.target.closest(".it[data-part]");
  if (!el) return;
  takeOver();
  const name = el.dataset.name || "";
  if (el.dataset.veh) return setChannel(channel === Number(el.dataset.veh) ? null : Number(el.dataset.veh));
  if (name.startsWith("shutter")) return setChannel(channel === Number(name.slice(7)) ? null : Number(name.slice(7)));
  if (name === "paddle") return setChannel(channel === 0 ? null : 0);
  if (el.dataset.part === "coup") return fire();
  if (el.dataset.part === "gaon") return fireGaon();
  pinned = pinned === el.dataset.part ? null : el.dataset.part;
  choose();
});
chButtons.forEach((b) =>
  b.addEventListener("click", () => {
    takeOver();
    const c = Number(b.dataset.ch);
    setChannel(channel === c ? null : c);
  }),
);
partButtons.forEach((b) =>
  b.addEventListener("click", () => {
    takeOver();
    auto = null;
    pinned = pinned === b.dataset.part ? null : b.dataset.part;
    choose();
  }),
);
fireBtn.addEventListener("click", () => {
  takeOver();
  fire();
});
gaonBtn.addEventListener("click", () => {
  takeOver();
  fireGaon();
});
refillBtn.addEventListener("click", () => {
  takeOver();
  refill();
});
closeBtn.addEventListener("click", () => {
  takeOver();
  setChannel(null);
});
window.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const onButton = e.target instanceof HTMLElement && e.target.closest("button");
  if (/^[0-5]$/.test(e.key)) {
    takeOver();
    const c = Number(e.key);
    setChannel(channel === c ? null : c);
    e.preventDefault();
  } else if (e.key === " " && !onButton) {
    takeOver();
    fire();
    e.preventDefault();
  } else if (e.key === "g" || e.key === "G") {
    takeOver();
    fireGaon();
  } else if (e.key === "r" || e.key === "R") {
    takeOver();
    refill();
  } else if (e.key === "Escape") {
    takeOver();
    pinned = null;
    auto = null;
    setChannel(null);
    choose();
  } else if ((e.key === "ArrowRight" || e.key === "ArrowLeft") && !onButton) {
    takeOver();
    const list = D.parts;
    const now = pinned ? list.indexOf(pinned) : -1;
    const next = e.key === "ArrowRight" ? (now + 1) % list.length : (now - 1 + list.length) % list.length;
    pinned = list[next];
    auto = null;
    choose();
    e.preventDefault();
  }
});
stage.addEventListener("focus", () => announce(mechText));

new IntersectionObserver(
  (entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    if (visible) run();
  },
  { rootMargin: "120px 0px" },
).observe(stage);
still.addEventListener("change", () => {
  if (still.matches) touring = false;
  run();
});

// ---------- tell the page around the iframe how tall we are ----------
const pageEl = document.querySelector(".iso-page");
let postedHeight = 0;
function postHeight() {
  const cs = getComputedStyle(pageEl);
  const height = Math.ceil(pageEl.getBoundingClientRect().height + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom));
  if (height === postedHeight) return;
  postedHeight = height;
  if (window.parent && window.parent !== window) window.parent.postMessage({ type: "anatomy-height", id: "sunny", height }, "*");
}
// keep the caption box as tall as the tallest caption, so the page never jumps during the tour
function fixCaption() {
  const texts = [T.caption, ...T.channels.map((c) => c.caption), ...Object.values(T.parts).map((p) => p.caption)];
  const probe = captionEl.cloneNode(false);
  probe.removeAttribute("data-caption");
  probe.style.cssText = `position:absolute;visibility:hidden;left:0;top:0;min-height:0;width:${captionEl.clientWidth}px`;
  captionEl.parentNode.appendChild(probe);
  let tallest = 0;
  for (const t of texts) {
    probe.textContent = t;
    tallest = Math.max(tallest, probe.getBoundingClientRect().height);
  }
  probe.remove();
  captionEl.style.minHeight = `${Math.ceil(tallest)}px`;
}
fixCaption();
window.addEventListener("resize", fixCaption);
window.addEventListener("load", postHeight);
window.addEventListener("resize", postHeight);
let heightTimer = 0;
const postSoon = () => {
  clearTimeout(heightTimer);
  heightTimer = setTimeout(postHeight, 60);
};
if ("ResizeObserver" in window) new ResizeObserver(postSoon).observe(pageEl);
setInterval(postHeight, 1000);

mechText = idleText();
syncButtons();
choose();
place();
syncDetail();
postHeight();
if (still.matches) touring = false;
run();
