// 年表 と 用語集
(function () {
  const esc = OP.esc;

  // ---- 年表 ----
  // sort: 物語開始(ルフィ出航)を 0 とした年数。負は過去。
  const ERAS = [
    { id: "ancient", name: "古代と空白の100年", test: (s) => s <= -700 },
    { id: "old", name: "世界政府の時代", test: (s) => s > -700 && s <= -40 },
    { id: "roger", name: "ロックスとロジャーの時代", test: (s) => s > -40 && s <= -22 },
    { id: "pirate-age", name: "大海賊時代の幕開け〜本編前夜", test: (s) => s > -22 && s < 0 },
    { id: "story", name: "本編", test: (s) => s >= 0 }
  ];
  const eraOf = (t) => ERAS.find((e) => e.test(t.sort)).id;
  let tlEl, tlFilter = { era: "", arc: "", q: "" };

  function sorted() {
    return OP.timeline.slice().sort((a, b) => a.sort - b.sort || OP.arcOrder(a.arc) - OP.arcOrder(b.arc));
  }
  function renderTimeline() {
    const q = tlFilter.q.trim();
    const items = sorted().filter((t) =>
      (!tlFilter.era || eraOf(t) === tlFilter.era) &&
      (!tlFilter.arc || t.arc === tlFilter.arc) &&
      (!q || (t.title + t.desc + t.when).includes(q)));
    let era = null, html = "";
    for (const t of items) {
      const e = eraOf(t);
      if (e !== era) { era = e; html += `<div class="tl-era">${esc(ERAS.find((x) => x.id === e).name)}</div>`; }
      const refs = OP.chips([...(t.characters || []), ...(t.places || []), ...(t.factions || [])].slice(0, 10));
      html += `<div class="tl-item${t.sort >= 0 ? " story" : ""}" id="tl-${t.id}">
        <div class="tl-when">${esc(t.when)}</div>
        <h3><a href="#" data-open="${t.id}" style="text-decoration:none">${esc(t.title)}</a>${t.latest ? ' <span class="tag">最新情報</span>' : ""}</h3>
        ${t.arc && OP.arc(t.arc) ? `<span class="tag dim">${esc(OP.arc(t.arc).name)}</span>` : ""}
        <p>${esc(t.desc)}</p><div>${refs}</div></div>`;
    }
    tlEl.querySelector(".tl").innerHTML = html || '<p class="muted" style="padding-left:20px">該当する出来事がありません。</p>';
  }

  OP.views.timeline = {
    mount(el) {
      tlEl = el;
      const arcOpts = OP.arcs.filter((a) => OP.timeline.some((t) => t.arc === a.id)).map((a) => `<option value="${a.id}">${esc(a.name)}</option>`).join("");
      el.innerHTML = `<div class="wrap">
        <div class="view-head"><h1>年表</h1><p>ルフィの出航を基準に、約900年前から現在までを並べています。出来事をクリックすると詳細が開きます。</p></div>
        <div class="toolbar">
          <button class="toggle" data-tlmode="axis" aria-pressed="true">時間軸</button>
          <button class="toggle" data-tlmode="list" aria-pressed="false">リスト</button>
        </div>
        <div class="tl-axis-wrap card"><p class="muted" style="margin:0 0 6px;font-size:13px">左側は「何年前か」の対数目盛り、右側の本編は編ごとの等間隔です。点にマウスを乗せると出来事名、クリックで詳細。</p><div class="tl-axis"></div></div>
        <div class="tl-list">
        <div class="toolbar">
          <div class="tabs" id="tl-eras"><button class="active" data-era="">すべて</button>${ERAS.map((e) => `<button data-era="${e.id}">${esc(e.name)}</button>`).join("")}</div>
        </div>
        <div class="toolbar">
          <label for="tl-arc">編</label><select id="tl-arc"><option value="">すべて</option>${arcOpts}</select>
          <input id="tl-q" type="search" placeholder="出来事を絞り込み" style="font:inherit;font-size:13px;padding:6px 10px;border-radius:7px;border:1px solid var(--line-strong);background:var(--surface);color:var(--ink)">
        </div>
        <div class="tl"></div>
        </div>
      </div>`;
      const setMode = (m) => {
        el.querySelectorAll("[data-tlmode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tlmode === m)));
        el.querySelector(".tl-axis-wrap").hidden = m !== "axis";
        el.querySelector(".tl-list").hidden = m !== "list";
        if (m === "axis") renderAxis();
      };
      el.querySelectorAll("[data-tlmode]").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.tlmode)));
      requestAnimationFrame(() => setMode("axis"));
      window.addEventListener("resize", () => { if (!el.querySelector(".tl-axis-wrap").hidden && OP.current() === "timeline") renderAxis(); });
      el.querySelector("#tl-eras").addEventListener("click", (ev) => {
        const b = ev.target.closest("button"); if (!b) return;
        tlFilter.era = b.dataset.era;
        el.querySelectorAll("#tl-eras button").forEach((x) => x.classList.toggle("active", x === b));
        renderTimeline();
      });
      el.querySelector("#tl-arc").addEventListener("change", (e) => { tlFilter.arc = e.target.value; renderTimeline(); });
      el.querySelector("#tl-q").addEventListener("input", (e) => { tlFilter.q = e.target.value; renderTimeline(); });
      renderTimeline();
    },
    focus(id) {
      const r = id && OP.get(id);
      if (r && r.type === "arc") { // 編から来たときはその編で絞り込んだリストを出す
        tlFilter.arc = r.e.id; tlEl.querySelector("#tl-arc").value = r.e.id;
        tlEl.querySelector('[data-tlmode="list"]').click(); renderTimeline(); return;
      }
      if (r && r.type === "timeline") tlEl.querySelector('[data-tlmode="list"]').click();
      tlEl.querySelectorAll(".tl-item").forEach((x) => x.style.outline = "");
      const item = id && tlEl.querySelector(`#tl-${CSS.escape(id)}`);
      if (item) { item.scrollIntoView({ behavior: "smooth", block: "center" }); item.style.outline = "2px solid var(--brass)"; item.style.outlineOffset = "4px"; }
    }
  };


  // ---- 時間軸: 過去は「何年前」の対数、本編は編ごとの等間隔 ----
  function renderAxis() {
    const box = tlEl.querySelector(".tl-axis");
    const W = Math.max(320, box.clientWidth), split = W * 0.55, PAD = 14;
    const past = OP.timeline.filter((t) => t.sort < 0), story = OP.timeline.filter((t) => t.sort >= 0);
    const ago = (t) => 2 - t.sort; // 現在(2年後)から何年前か
    const xPast = d3.scaleLog().domain([1100, 2]).range([PAD, split - 12]).clamp(true);
    const n = OP.arcs.length;
    const xStory = (t) => split + 12 + ((OP.arcOrder(t.arc) - 1) / (n - 1)) * (W - split - 12 - PAD);
    const pts = [...past.map((t) => ({ t, x: xPast(ago(t)) })), ...story.map((t) => ({ t, x: t.arc ? xStory(t) : split + 12 }))];
    // 重なりを避けて縦に積む
    const R = 5, slots = [];
    pts.sort((a, b) => a.x - b.x).forEach((p) => {
      let lvl = 0;
      while (slots[lvl] != null && p.x - slots[lvl] < R * 2 + 1) lvl++;
      slots[lvl] = p.x; p.lvl = lvl;
    });
    const maxL = d3.max(pts, (p) => p.lvl) || 0, base = 40 + (maxL + 1) * (R * 2 + 2), H = base + 70;
    const ERA_COLOR = { ancient: "#7f6a93", old: "#5b6fa8", roger: "#a9761f", "pirate-age": "#c0612b", story: "var(--accent)" };
    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="年表の時間軸">`;
    // 時代の帯
    [[1100, 700, "古代"], [700, 40, "世界政府の時代"], [40, 24, "ロジャー"], [24, 2, "大海賊時代"]].forEach(([a, b, label], i) => {
      const x0 = xPast(a), x1 = xPast(b);
      s += `<rect x="${x0}" y="20" width="${x1 - x0}" height="${base - 14}" fill="${i % 2 ? "var(--surface-2)" : "transparent"}"/><text x="${(x0 + x1) / 2}" y="14" text-anchor="middle" class="ax-era">${label}</text>`;
    });
    d3.groups(OP.arcs, (a) => a.saga).forEach(([saga, arcs], i) => {
      const x0 = xStory({ arc: arcs[0].id }) - 4, x1 = xStory({ arc: arcs[arcs.length - 1].id }) + 4;
      s += `<rect x="${x0}" y="20" width="${x1 - x0}" height="${base - 14}" fill="${i % 2 ? "var(--surface-2)" : "transparent"}"/>`;
      const lb = OP.fitLabel(OP.stripArc(saga), x1 - x0, 10);
      if (lb) s += `<text x="${(x0 + x1) / 2}" y="${base + 40}" text-anchor="middle" class="ax-saga">${esc(lb)}</text>`;
    });
    s += `<line x1="${split}" x2="${split}" y1="8" y2="${base + 8}" stroke="var(--accent)" stroke-dasharray="3 3"/><text x="${split + 4}" y="14" class="ax-era" style="fill:var(--accent)">本編 →</text>`;
    s += `<line x1="${PAD}" x2="${W - PAD}" y1="${base + 6}" y2="${base + 6}" stroke="var(--line-strong)"/>`;
    [1000, 500, 200, 100, 50, 20, 10, 5].forEach((y) => {
      const x = xPast(y);
      s += `<line x1="${x}" x2="${x}" y1="${base + 6}" y2="${base + 11}" stroke="var(--muted)"/><text x="${x}" y="${base + 24}" text-anchor="middle" class="ax-tick">${y}年前</text>`;
    });
    pts.forEach((p) => {
      const e = eraOf(p.t);
      s += `<circle class="ax-dot" cx="${p.x}" cy="${base - p.lvl * (R * 2 + 2)}" r="${R}" fill="${ERA_COLOR[e]}" stroke="var(--surface)" stroke-width="2" data-open="${p.t.id}"><title>${esc(p.t.when)}: ${esc(p.t.title)}</title></circle>`;
    });
    box.innerHTML = s + "</svg>";
  }

  // ---- 用語集 ----
  let glEl, glCat = "", glQ = "";
  function renderGlossary() {
    const q = glQ.trim();
    const items = OP.glossary.filter((g) => (!glCat || g.category === glCat) && (!q || (g.term + (g.reading || "") + g.desc).includes(q)));
    glEl.querySelector(".gl-grid").innerHTML = items.map((g) => `
      <div class="card gl-card" data-open="${g.id}" tabindex="0" role="button">
        <span class="tag dim">${esc(OP.GL_CAT[g.category] || "")}</span>
        <h3>${esc(g.term)}</h3>${g.reading ? `<div class="reading">${esc(g.reading)}</div>` : ""}
        <p>${esc(g.desc)}</p>
      </div>`).join("") || '<p class="muted">該当する用語がありません。</p>';
  }
  OP.views.glossary = {
    mount(el) {
      glEl = el;
      const cats = Object.entries(OP.GL_CAT).filter(([c]) => OP.glossary.some((g) => g.category === c));
      el.innerHTML = `<div class="wrap">
        ${OP.subtabs("glossary", [["glossary", "用語集"], ["fruits", "悪魔の実図鑑"]])}
        <div class="view-head"><h1>用語集</h1><p>この世界のルールと謎。カードをクリックすると、関連する人物や他の用語へたどれます。</p></div>
        <div class="toolbar"><div class="tabs" id="gl-cats"><button class="active" data-cat="">すべて (${OP.glossary.length})</button>${cats.map(([c, n]) => `<button data-cat="${c}">${n} (${OP.glossary.filter((g) => g.category === c).length})</button>`).join("")}</div></div>
        <div class="toolbar"><input id="gl-q" type="search" placeholder="用語を絞り込み" style="font:inherit;font-size:13px;padding:6px 10px;border-radius:7px;border:1px solid var(--line-strong);background:var(--surface);color:var(--ink)"></div>
        <div class="gl-grid"></div>
      </div>`;
      el.querySelector("#gl-cats").addEventListener("click", (ev) => {
        const b = ev.target.closest("button"); if (!b) return;
        glCat = b.dataset.cat;
        el.querySelectorAll("#gl-cats button").forEach((x) => x.classList.toggle("active", x === b));
        renderGlossary();
      });
      el.querySelector("#gl-q").addEventListener("input", (e) => { glQ = e.target.value; renderGlossary(); });
      el.addEventListener("keydown", (ev) => { if (ev.key === "Enter" && ev.target.matches(".gl-card")) OP.open(ev.target.dataset.open); });
      renderGlossary();
    }
  };
})();
