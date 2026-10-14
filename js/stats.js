// データ: 懸賞金(推移と順位) と 戦績
(function () {
  const esc = OP.esc;
  const TABS = [["bounties", "懸賞金"], ["battles", "戦績"]];
  const SLOTS = 6; // 同時に比べられる人数。色は選んだ人物に固定で付く(順位では塗り直さない)
  const fmtShort = (n) => OP.lang === "en"
    ? (n >= 1e9 ? `${+(n / 1e9).toFixed(1)}B` : `${Math.round(n / 1e6)}M`)
    : (n >= 1e8 ? `${+(n / 1e8).toFixed(n >= 1e9 ? 0 : 1)}億` : `${Math.round(n / 1e4)}万`);

  // ---- 懸賞金の推移 ----
  let bEl, picked = new Map(); // charId -> slot(1..6)
  function freeSlot() { for (let i = 1; i <= SLOTS; i++) if (![...picked.values()].includes(i)) return i; return 0; }
  function togglePick(id) {
    if (picked.has(id)) picked.delete(id);
    else { const s = freeSlot(); if (!s) { bEl.querySelector(".b-msg").textContent = `比べられるのは${SLOTS}人までです。どれかを外してください。`; return; } picked.set(id, s); }
    bEl.querySelector(".b-msg").textContent = "";
    renderPicker(); renderLines();
  }
  function renderPicker() {
    bEl.querySelector(".b-picker").innerHTML = OP.bounties.map((b) => {
      const s = picked.get(b.char);
      return `<button class="toggle pick" data-pick="${b.char}" aria-pressed="${!!s}">${s ? `<span class="swatch" style="--c:var(--s${s})"></span>` : ""}${esc(OP.short(OP.nameOf(b.char)))}</button>`;
    }).join("");
  }
  function renderLines() {
    const box = bEl.querySelector(".b-chart");
    const W = Math.max(320, box.clientWidth), H = 340, M = { l: 54, r: 92, t: 14, b: 40 };
    const n = OP.arcs.length;
    const x = d3.scaleLinear().domain([1, n]).range([M.l, W - M.r]);
    const y = d3.scaleLog().domain([1e6, 6e9]).range([H - M.b, M.t]).clamp(true);
    const series = [...picked].map(([id, slot]) => ({ id, slot, hist: OP.bountyOf(id).history.filter((h) => h.arc).map((h) => ({ o: OP.arcOrder(h.arc), v: h.value })).sort((a, b) => a.o - b.o) }));
    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="懸賞金の推移">`;
    [1e6, 1e7, 1e8, 1e9].forEach((v) => {
      s += `<line x1="${M.l}" x2="${W - M.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${M.l - 6}" y="${y(v) + 4}" text-anchor="end" class="ax-tick">${fmtShort(v)}</text>`;
    });
    d3.groups(OP.arcs, (a) => a.saga).forEach(([saga, arcs], i) => {
      const x0 = x(arcs[0].order) - 4, x1 = x(arcs[arcs.length - 1].order) + 4;
      if (i % 2) s += `<rect x="${x0}" y="${M.t}" width="${x1 - x0}" height="${H - M.t - M.b}" fill="var(--surface-2)" opacity=".6"/>`;
      const lb = OP.fitLabel(OP.stripArc(saga), x1 - x0, 10);
      if (lb) s += `<text x="${(x0 + x1) / 2}" y="${H - M.b + 18}" text-anchor="middle" class="ax-saga">${esc(lb)}</text>`;
    });
    const labels = [];
    series.forEach((sr) => {
      if (!sr.hist.length) return;
      // 判明した編から次の更新まで同じ額が続く階段状の線
      const pts = [];
      sr.hist.forEach((h, i) => { if (i) pts.push([x(h.o), y(sr.hist[i - 1].v)]); pts.push([x(h.o), y(h.v)]); });
      const last = sr.hist[sr.hist.length - 1];
      pts.push([x(n), y(last.v)]);
      s += `<polyline fill="none" stroke="var(--s${sr.slot})" stroke-width="2" stroke-linejoin="round" points="${pts.map((p) => p.join(",")).join(" ")}"/>`;
      sr.hist.forEach((h) => { s += `<circle cx="${x(h.o)}" cy="${y(h.v)}" r="4" fill="var(--s${sr.slot})" stroke="var(--surface)" stroke-width="2"/>`; });
      labels.push({ y: y(last.v), text: OP.short(OP.nameOf(sr.id)), slot: sr.slot });
    });
    // 線の右端に直接ラベル(重なりは上下にずらす)
    labels.sort((a, b) => a.y - b.y).forEach((l, i, arr) => { if (i && l.y - arr[i - 1].y < 13) l.y = arr[i - 1].y + 13; });
    labels.forEach((l) => { s += `<circle cx="${W - M.r + 8}" cy="${l.y}" r="4" fill="var(--s${l.slot})"/><text x="${W - M.r + 16}" y="${l.y + 4}" class="ax-label">${esc(l.text)}</text>`; });
    s += `<line class="xhair" x1="0" x2="0" y1="${M.t}" y2="${H - M.b}" stroke="var(--muted)" stroke-dasharray="3 3" display="none"/>`;
    s += `<rect class="hit" x="${M.l}" y="${M.t}" width="${W - M.l - M.r}" height="${H - M.t - M.b}" fill="transparent"/></svg>`;
    box.innerHTML = s + `<div class="chart-tip" hidden></div>`;
    // ホバー: 縦線と、その編の時点での各人の懸賞金
    const svgEl = box.querySelector("svg"), tip = box.querySelector(".chart-tip"), xh = box.querySelector(".xhair");
    svgEl.querySelector(".hit").addEventListener("mousemove", (ev) => {
      const pt = svgEl.getBoundingClientRect();
      const o = Math.round(x.invert(((ev.clientX - pt.left) / pt.width) * W));
      const arc = OP.arcByOrder(Math.max(1, Math.min(n, o)));
      if (!arc) return;
      xh.setAttribute("x1", x(arc.order)); xh.setAttribute("x2", x(arc.order)); xh.removeAttribute("display");
      const rows = series.map((sr) => { const k = sr.hist.filter((h) => h.o <= arc.order).pop(); return { sr, v: k ? k.v : null }; }).sort((a, b) => (b.v || 0) - (a.v || 0));
      tip.innerHTML = `<b>${esc(arc.name)}</b>${rows.map((r) => `<div><span class="swatch" style="--c:var(--s${r.sr.slot})"></span>${esc(OP.short(OP.nameOf(r.sr.id)))} <span class="tv">${r.v ? esc(OP.formatBounty(r.v)) : "—"}</span></div>`).join("")}`;
      tip.hidden = false;
      const left = ((x(arc.order) / W) * pt.width);
      tip.style.left = Math.min(left + 12, pt.width - tip.offsetWidth - 4) + "px";
      tip.style.top = "10px";
    });
    svgEl.querySelector(".hit").addEventListener("mouseleave", () => { tip.hidden = true; xh.setAttribute("display", "none"); });
    // 表で見る
    bEl.querySelector(".b-table").innerHTML = `<table class="data-table"><thead><tr><th>人物</th><th>編</th><th>懸賞金</th></tr></thead><tbody>${series.flatMap((sr) => sr.hist.map((h) => `<tr><td>${esc(OP.nameOf(sr.id))}</td><td>${esc(OP.arcByOrder(h.o).name)}</td><td>${esc(OP.formatBounty(h.v))}</td></tr>`)).join("")}</tbody></table>`;
  }
  // 懸賞金の順位(現在地の時点で判明している額)
  function renderRank() {
    const group = bEl.querySelector("#b-group").value;
    const piratesF = OP.factionDescendants("pirates");
    const rows = OP.characters.filter((c) => OP.charVisibleAt(c))
      .map((c) => ({ c, v: OP.bountyAt(c) })).filter((r) => r.v)
      .filter((r) => !group || (group === "pirates") === OP.factionsAt(r.c).some((f) => piratesF.includes(f)))
      .sort((a, b) => b.v - a.v).slice(0, 30);
    const max = d3.max(rows, (r) => r.v) || 1;
    bEl.querySelector(".b-rank").innerHTML = rows.map((r, i) => `
      <a class="rank-row" data-open="${r.c.id}" href="#">
        <span class="rk">${i + 1}</span>${OP.avatar(r.c.id)}<span class="rn">${esc(r.c.name)}</span>
        <span class="rb-track"><span class="rb-bar" style="width:${Math.max(.5, (r.v / max) * 100)}%"></span></span>
        <span class="rv">${esc(OP.formatBounty(r.v))}</span>
      </a>`).join("") || '<p class="muted">この時点で判明している懸賞金はありません。</p>';
    bEl.querySelector(".rank-when").textContent = OP.time == null ? "最新の懸賞金" : `${OP.timeLabel()}の時点で判明している懸賞金`;
  }
  OP.views.bounties = {
    nav: "bounties",
    mount(el) {
      bEl = el;
      ["luffy", "zoro", "sanji", "law", "kid"].forEach((id) => { if (OP.bountyOf(id)) picked.set(id, freeSlot()); });
      el.innerHTML = `<div class="wrap">
        ${OP.subtabs("bounties", TABS)}
        <div class="view-head"><h1>懸賞金</h1><p>手配書の額は、政府がその人物をどれだけ危険視しているかの指標です。強さそのものではありません。</p></div>
        <div class="card">
          <h2 class="card-h">推移をくらべる</h2>
          <p class="muted" style="margin:0 0 8px;font-size:13px">最大${SLOTS}人まで選べます。縦軸は対数目盛り、横軸は編の順です。</p>
          <div class="b-picker"></div><p class="b-msg muted" style="font-size:13px;margin:4px 0"></p>
          <div class="b-chart chart-box"></div>
          <details class="more"><summary>表で見る</summary><div class="b-table"></div></details>
        </div>
        <div class="card" style="margin-top:14px">
          <h2 class="card-h">懸賞金ランキング <span class="muted rank-when" style="font-size:13px;font-family:var(--body)"></span></h2>
          <div class="toolbar">${OP.timeSlider()}<select id="b-group" aria-label="対象"><option value="">全員</option><option value="pirates">海賊のみ</option><option value="others">海賊以外</option></select></div>
          <div class="b-rank"></div>
        </div>
      </div>`;
      el.querySelector(".b-picker").addEventListener("click", (ev) => { const b = ev.target.closest("[data-pick]"); if (b) togglePick(b.dataset.pick); });
      el.querySelector("#b-group").addEventListener("change", renderRank);
      window.addEventListener("op-time", renderRank);
      window.addEventListener("resize", () => { if (OP.current() === "bounties") renderLines(); });
      renderPicker(); renderRank();
      requestAnimationFrame(renderLines);
    }
  };

  // ---- 戦績 ----
  let wEl;
  function record(id) {
    const bs = OP.battles.filter((r) => r.from === id || r.to === id);
    const w = bs.filter((r) => (r.winner === "from" && r.from === id) || (r.winner === "to" && r.to === id)).length;
    const l = bs.filter((r) => (r.winner === "from" && r.to === id) || (r.winner === "to" && r.from === id)).length;
    return { w, l, d: bs.length - w - l, n: bs.length };
  }
  function renderBattles() {
    const who = wEl.querySelector("#w-who").value, arc = wEl.querySelector("#w-arc").value;
    const list = OP.battles.filter((r) => (!who || r.from === who || r.to === who) && (!arc || r.arc === arc))
      .sort((a, b) => OP.arcOrder(a.arc) - OP.arcOrder(b.arc));
    const vs = (r) => {
      const win = r.winner === "from" ? r.from : r.winner === "to" ? r.to : null;
      const side = (id) => `<span class="vs-side${win === id ? " won" : win ? " lost" : ""}">${OP.chip(id)}${win === id ? '<span class="result win">勝ち</span>' : ""}</span>`;
      return `<div class="vs-row">${side(r.from)}<span class="vs">vs</span>${side(r.to)}<span class="rel-label">${win ? "" : `<span class="result draw">${r.winner === "draw" ? "引き分け" : "決着なし"}</span> `}${esc(r.label)}</span></div>`;
    };
    const groups = d3.groups(list, (r) => r.arc || "");
    wEl.querySelector(".w-list").innerHTML = groups.map(([a, rs]) => `<div class="w-arc"><h3>${a && OP.arc(a) ? OP.arcChip(a) : "時期不明"}</h3>${rs.map(vs).join("")}</div>`).join("") || '<p class="muted">該当する戦いがありません。</p>';
  }
  OP.views.battles = {
    nav: "bounties",
    mount(el) {
      wEl = el;
      const fighters = [...new Set(OP.battles.flatMap((r) => [r.from, r.to]))].filter((id) => OP.get(id));
      const board = fighters.map((id) => ({ id, ...record(id) })).sort((a, b) => b.w - a.w || a.l - b.l).slice(0, 15);
      const arcs = OP.arcs.filter((a) => OP.battles.some((r) => r.arc === a.id));
      el.innerHTML = `<div class="wrap">
        ${OP.subtabs("battles", TABS)}
        <div class="view-head"><h1>戦績</h1><p>作中で決着が描かれた戦いの記録です。複数人での戦いは、主に戦った相手との組で数えています。</p></div>
        <div class="w-layout">
          <div class="card"><h2 class="card-h">勝利数の多い人物</h2>
            <table class="data-table"><thead><tr><th>人物</th><th>勝</th><th>敗</th><th>他</th></tr></thead><tbody>
            ${board.map((b) => `<tr><td>${OP.chip(b.id)}</td><td>${b.w}</td><td>${b.l}</td><td>${b.d}</td></tr>`).join("")}</tbody></table>
          </div>
          <div class="card"><h2 class="card-h">戦いの記録 <span class="muted" style="font-size:13px;font-family:var(--body)">${OP.battles.length}件</span></h2>
            <div class="toolbar">
              <select id="w-who" aria-label="人物"><option value="">全員</option>${fighters.sort((a, b) => record(b).n - record(a).n).map((id) => `<option value="${id}">${esc(OP.nameOf(id))} (${record(id).n})</option>`).join("")}</select>
              <select id="w-arc" aria-label="編"><option value="">すべての編</option>${arcs.map((a) => `<option value="${a.id}">${esc(a.name)}</option>`).join("")}</select>
            </div>
            <div class="w-list"></div>
          </div>
        </div>
      </div>`;
      el.querySelector("#w-who").addEventListener("change", renderBattles);
      el.querySelector("#w-arc").addEventListener("change", renderBattles);
      renderBattles();
    },
    focus(id) {
      if (id && OP.get(id) && OP.get(id).type === "character" && wEl.querySelector(`#w-who option[value="${id}"]`)) {
        wEl.querySelector("#w-who").value = id; renderBattles();
      }
    }
  };
})();
