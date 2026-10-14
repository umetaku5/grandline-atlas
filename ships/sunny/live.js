const D = __DATA__;
const T = __TEXT__;
const stage = document.querySelector(".sn-stage");
const svg = stage.querySelector("svg");
const root = svg.querySelector("[data-ship-root]");
const puffLayer = svg.querySelector("[data-puffs]");
const shadow = svg.querySelector(".sn-shadow");
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
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

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

let burst = null; // { phase, t, take: [] }
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
let auto = null; // part lit by the tour or by a burst
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
  if (burst) return T.parts.coup.caption;
  if (channel !== null) return T.channels[channel].caption;
  return T.caption;
}
function refreshWords() {
  const part = hovered || pinned || auto;
  if (part && !(burst && part === "coup")) say(fmt(T.read.part, { n: D.parts.indexOf(part) + 1, name: T.parts[part].name }));
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
  if (burst) return;
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
  if (burst) return;
  if (cola() < 3) {
    setMech(T.read.empty);
    announce(T.live.empty);
    return;
  }
  setChannel(null);
  burst = { phase: "arm", t: 0, take: [] };
  auto = "coup";
  setMech(T.read.arming);
  choose();
  run();
}
function refill() {
  if (burst) return;
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
  const target = channel === null || burst ? HOME : D.dial[channel];
  moving = follow(dial, target, dt, 0.16, calm) || moving;
  const arrived = Math.abs(dial.x - target) < 1.5;
  for (const b of bays) {
    const want = !burst && channel === b.c && arrived;
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
  if (!burst) return false;
  burst.t += dt;
  if (burst.phase === "arm") {
    if (dockClosed()) {
      burst.phase = "load";
      burst.t = 0;
      burst.take = [...Array(MAX).keys()].filter((i) => !used.has(i)).slice(0, 3);
    }
    return true;
  }
  if (burst.phase === "load") {
    const step = calm ? 0 : 0.32;
    const n = calm ? 3 : Math.min(3, Math.floor(burst.t / step));
    burst.take.forEach((i, k) => {
      const el = barrelEls[i];
      if (k < n) {
        el.removeAttribute("data-draining");
        el.setAttribute("data-empty", "");
        used.add(i);
      } else if (k === n) el.setAttribute("data-draining", "");
    });
    setMech(fmt(T.read.loading, { n: Math.min(3, n) }));
    if (n >= 3 && burst.t >= (calm ? 0 : 3 * step + 0.2)) {
      burst.phase = "fly";
      burst.t = 0;
      auto = null;
      choose();
      setMech(fmt(T.read.fired, { cola: cola(), max: MAX }));
      announce(fmt(T.live.fired, { cola: cola() }));
      syncButtons();
    }
    return true;
  }
  if (burst.phase === "fly") {
    const t = burst.t;
    lift = calm ? 0 : liftAt(t);
    drawPuffs(calm ? -1 : t);
    if (t > 4.1 || calm) {
      lift = 0;
      drawPuffs(-1);
      burst = null;
      auto = null;
      setMech(fmt(T.read.landed, { cola: cola(), max: MAX }));
      choose();
      return false;
    }
    return true;
  }
  return false;
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
  if (tourWait <= 0 && !burst) {
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
    if (!burst) auto = null;
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
  busy = stepBays(dt, calm) || busy;
  const paddle = bays[0].veh.x;
  if (paddle > 0.5 && !calm) {
    spin = (spin + dt * 150 * smooth(0.5, 1, paddle)) % 360;
    busy = true;
  }
  place();
  frame = visible && busy ? requestAnimationFrame(tick) : 0;
}
function run() {
  if (!frame && visible) {
    last = 0;
    frame = requestAnimationFrame(tick);
  }
}

// ---------- input ----------
svg.addEventListener("pointerover", (e) => {
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
svg.addEventListener("click", (e) => {
  const el = e.target.closest(".it[data-part]");
  if (!el) return;
  takeOver();
  const name = el.dataset.name || "";
  if (el.dataset.veh) return setChannel(channel === Number(el.dataset.veh) ? null : Number(el.dataset.veh));
  if (name.startsWith("shutter")) return setChannel(channel === Number(name.slice(7)) ? null : Number(name.slice(7)));
  if (name === "paddle") return setChannel(channel === 0 ? null : 0);
  if (el.dataset.part === "coup") return fire();
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
if ("ResizeObserver" in window) new ResizeObserver(postHeight).observe(pageEl);

mechText = idleText();
syncButtons();
choose();
place();
postHeight();
if (still.matches) touring = false;
run();
