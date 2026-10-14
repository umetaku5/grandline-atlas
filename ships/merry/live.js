
const D = __DATA__;
const MP = D.P;
const stage = document.querySelector(".mr-stage");
const svg = stage.querySelector("svg");
const ship = svg.querySelector("[data-ship]");
const sailBody = svg.querySelector("[data-sail-body]");
const emblem = {};
for (const name of ["bone", "skull", "hole", "crown", "band", "brim"]) emblem[name] = svg.querySelector(".mr-" + name);
const readout = document.querySelector("[data-readout]");
const caption = document.querySelector("[data-caption]");
const status = document.querySelector("[data-status]");
const buttons = [...document.querySelectorAll(".mr-part")];
const groups = {};
for (const g of svg.querySelectorAll(".it[data-p]")) (groups[g.dataset.p] ??= []).push(g);
const still = matchMedia("(prefers-reduced-motion: reduce)");
const up = axisVector(MP, [0, 0, 1]);

// ---- height for the embedding page ----
let heightFrame = 0;
function postHeight() {
  if (heightFrame) return;
  // 画面外や背面タブでは rAF が止まるので、タイマーで送る
  heightFrame = setTimeout(() => {
    heightFrame = 0;
    try {
      parent.postMessage({ type: "anatomy-height", id: "merry", height: (() => { const m = document.querySelector(".iso-page"); if (!m) return document.documentElement.scrollHeight; const cs = getComputedStyle(m); return Math.ceil(m.getBoundingClientRect().height + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom)); })() }, "*");
    } catch (error) {}
  });
}
// Keep the caption box as tall as its longest text, so the page height does not
// jump while the tour steps through the parts.
function fitCaption() {
  caption.style.minHeight = "";
  const current = caption.textContent;
  let tallest = 0;
  for (const text of [D.caption, ...D.order.map((id) => D.texts[id])]) {
    caption.textContent = text;
    tallest = Math.max(tallest, caption.getBoundingClientRect().height);
  }
  caption.textContent = current;
  caption.style.minHeight = Math.ceil(tallest) + "px";
  postHeight();
}

// ---- selection ----
let selected = null;
function select(id, announce = false) {
  if (id === selected) return;
  if (selected) for (const g of groups[selected] || []) g.removeAttribute("data-on");
  selected = id;
  for (const b of buttons) b.toggleAttribute("data-on", b.dataset.part === id);
  if (id) {
    for (const g of groups[id] || []) g.setAttribute("data-on", "");
    stage.setAttribute("data-focus", "");
  } else stage.removeAttribute("data-focus");
  const index = D.order.indexOf(id);
  readout.textContent = id ? String(index + 1).padStart(2, "0") + " / " + D.order.length + " · " + D.names[id] : D.idle;
  caption.textContent = id ? D.texts[id] : D.caption;
  if (announce) status.textContent = id ? D.names[id] + ". " + D.texts[id] : "";
}
function step(by) {
  const index = selected ? D.order.indexOf(selected) : by > 0 ? -1 : 0;
  select(D.order[(index + by + D.order.length) % D.order.length], true);
}

// ---- tour and take-over ----
let touring = !still.matches;
let tourClock = -1.4;
let idleTimer = 0;
let hovering = false;
function takeOver() {
  touring = false;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (still.matches || hovering) return;
    touring = true;
    tourClock = 0;
    run();
  }, 6000);
}

// ---- motion: the hull rides a gentle swell, the sail breathes ----
let clock = 0;
let frame = 0;
let last = 0;
let visible = false;
let lastSail = -1;
function sailAt(bulge) {
  const s = sailParts(bulge, MP);
  sailBody.innerHTML = solidSvg(s.paths, { tone: "hi", inner: lineSvg(s.seams, { tone: "faint" }) });
  emblem.bone.setAttribute("d", s.bones);
  emblem.skull.setAttribute("d", s.skull);
  emblem.hole.setAttribute("d", s.holes);
  emblem.crown.setAttribute("d", s.crown);
  emblem.band.setAttribute("d", s.band);
  emblem.brim.setAttribute("d", s.brim);
}
function pose() {
  const calm = still.matches;
  const swell = calm ? 0 : Math.sin((clock * Math.PI * 2) / 6.4);
  const roll = calm ? 0 : Math.sin((clock * Math.PI * 2) / 6.4 + 1.2);
  const lift = 1.3 * swell;
  const dx = up[0] * lift;
  const dy = up[1] * lift;
  ship.setAttribute("transform", calm ? "" : "translate(" + dx.toFixed(2) + " " + dy.toFixed(2) + ") rotate(" + (0.5 * roll).toFixed(3) + " " + D.pivot[0] + " " + D.pivot[1] + ")");
  const bulge = calm ? D.rest : D.rest + 2.4 * Math.sin((clock * Math.PI * 2) / 5.3 + 0.6);
  if (Math.abs(bulge - lastSail) > 0.02) {
    lastSail = bulge;
    sailAt(bulge);
  }
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  clock += dt;
  if (touring) {
    tourClock += dt;
    if (tourClock >= 3.4) {
      tourClock = 0;
      step(1);
    }
  }
  pose();
  frame = visible && !still.matches ? requestAnimationFrame(tick) : 0;
}
function run() {
  if (!frame && visible && !still.matches) {
    last = 0;
    frame = requestAnimationFrame(tick);
  }
}
new IntersectionObserver((entries) => {
  visible = entries[entries.length - 1].isIntersecting;
  if (visible) run();
}, { rootMargin: "120px 0px" }).observe(stage);
still.addEventListener?.("change", () => {
  if (still.matches) touring = false;
  pose();
  run();
});

// ---- input ----
const partOf = (target) => target.closest && target.closest(".it[data-p]");
svg.addEventListener("pointerover", (event) => {
  const g = partOf(event.target);
  if (!g) return;
  takeOver();
  select(g.dataset.p);
});
svg.addEventListener("click", (event) => {
  const g = partOf(event.target);
  takeOver();
  select(g ? g.dataset.p : null, true);
});
stage.addEventListener("pointerenter", () => {
  hovering = true;
});
stage.addEventListener("pointerleave", () => {
  hovering = false;
  takeOver();
});
stage.addEventListener("keydown", (event) => {
  const key = event.key;
  if (key === "ArrowRight" || key === "ArrowDown") step(1);
  else if (key === "ArrowLeft" || key === "ArrowUp") step(-1);
  else if (key === "Home") select(D.order[0], true);
  else if (key === "End") select(D.order[D.order.length - 1], true);
  else if (key === "Escape") select(null, true);
  else return;
  event.preventDefault();
  takeOver();
});
for (const b of buttons) {
  const pick = () => {
    takeOver();
    select(b.dataset.part, true);
  };
  b.addEventListener("pointerenter", pick);
  b.addEventListener("focus", pick);
  b.addEventListener("click", pick);
  b.addEventListener("keydown", (event) => {
    const list = buttons;
    const index = list.indexOf(b);
    let next = -1;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % list.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + list.length) % list.length;
    if (next < 0) return;
    event.preventDefault();
    list[next].focus();
  });
}

pose();
fitCaption();
addEventListener("load", () => {
  fitCaption();
  postHeight();
});
new ResizeObserver(() => fitCaption()).observe(document.body);
