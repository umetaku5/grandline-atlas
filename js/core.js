// 共通基盤: データ索引、物語の時間、ルーティング、詳細パネル、検索、足あと、ホバー表示
(function () {
  const OP = (window.OP = window.OP || {});
  for (const k of ["arcs", "factions", "characters", "relations", "places", "timeline", "glossary", "fruits", "mysteries", "families", "positions", "bounties"]) OP[k] = OP[k] || [];

  const TYPE_LABEL = { character: "人物", faction: "勢力", place: "場所", glossary: "用語", timeline: "出来事", arc: "編", fruit: "悪魔の実", mystery: "謎" };
  const REL = {
    family: { label: "家族", color: "#e0a526" },
    crew: { label: "仲間", color: "#3aa76d" },
    ally: { label: "同盟・協力", color: "#3b8fd9" },
    mentor: { label: "師弟・恩人", color: "#9b59b6" },
    enemy: { label: "敵対", color: "#e0452f", dash: true },
    rival: { label: "ライバル", color: "#e67e22", dash: true },
    love: { label: "恋慕", color: "#e84393" },
    other: { label: "その他", color: "#8a9bb0" }
  };
  const GL_CAT = { fruit: "悪魔の実", haki: "覇気", history: "歴史・謎", organization: "組織", geography: "地理", culture: "文化・種族", weapon: "兵器・武器", other: "その他" };
  const SEA = { "east-blue": "東の海(イーストブルー)", "west-blue": "西の海(ウエストブルー)", "north-blue": "北の海(ノースブルー)", "south-blue": "南の海(サウスブルー)", paradise: "偉大なる航路 前半(楽園)", "new-world": "偉大なる航路 後半(新世界)", "red-line": "赤い土の大陸(レッドライン)", "calm-belt": "凪の帯(カームベルト)", sky: "空島", undersea: "海底", other: "その他" };
  const FRUIT_COLOR = { 超人系: "#8e44ad", 動物系: "#c0612b", 自然系: "#2a78d6" };
  const MYS_STATUS = { unsolved: "未解決", partial: "一部判明", solved: "解決済み" };
  const RANK = { imu: "最高権力者", elder: "五老星", knight: "神の騎士団", "fleet-admiral": "元帥", admiral: "大将", "vice-admiral": "中将", officer: "海兵", agent: "諜報員・職員" };
  Object.assign(OP, { TYPE_LABEL, REL, GL_CAT, SEA, FRUIT_COLOR, MYS_STATUS, RANK });

  // ---- 索引 ----
  // 編は場所とIDが重なるため "arc:<id>" で登録する
  const byId = new Map();
  const add = (list, type, key = (e) => e.id) => list.forEach((e) => byId.set(key(e), { type, e }));
  add(OP.factions, "faction"); add(OP.characters, "character"); add(OP.places, "place"); add(OP.glossary, "glossary"); add(OP.timeline, "timeline");
  add(OP.arcs, "arc", (a) => "arc:" + a.id); add(OP.fruits, "fruit"); add(OP.mysteries, "mystery");
  const arcById = new Map(OP.arcs.map((a) => [a.id, a]));
  OP.get = (id) => byId.get(id);
  OP.arc = (id) => arcById.get(id);
  OP.arcOrder = (id) => (arcById.get(id) || { order: 99 }).order;
  OP.arcByOrder = (n) => OP.arcs.find((a) => a.order === n);

  const facById = new Map(OP.factions.map((f) => [f.id, f]));
  OP.faction = (id) => facById.get(id);
  OP.factionColor = (id) => {
    for (let f = facById.get(id); f; f = facById.get(f.parent)) if (f.color) return f.color;
    return "#7f8c8d";
  };
  OP.factionChildren = (id) => OP.factions.filter((f) => f.parent === id);
  OP.factionDescendants = (id) => {
    const out = [id];
    for (let i = 0; i < out.length; i++) OP.factionChildren(out[i]).forEach((c) => out.push(c.id));
    return out;
  };
  OP.initial = (name) => {
    const parts = String(name).split(/[・\s]/).filter(Boolean);
    const last = parts[parts.length - 1] || name;
    return last.replace(/^[“"「(（]/, "").charAt(0);
  };

  // ---- 物語の時間(タイムスライダー) ----
  // OP.time: null = 全期間 / 数値 = その編(order)まで読んだ時点
  OP.time = null;
  const ord = (id, fallback) => (id ? OP.arcOrder(id) : fallback);
  OP.charVisibleAt = (c, t = OP.time) => t == null || OP.arcOrder(c.firstArc) <= t;
  OP.relSince = (r) => {
    if (r.since) return OP.arcOrder(r.since);
    const a = byId.get(r.from), b = byId.get(r.to);
    return Math.max(a ? OP.arcOrder(a.e.firstArc) : 0, b ? OP.arcOrder(b.e.firstArc) : 0);
  };
  // 全期間ではすべての関係を、時点指定ではその時点で成り立つ関係だけを返す
  OP.relActive = (r, t = OP.time) => t == null || (OP.relSince(r) <= t && ord(r.until, Infinity) >= t);
  OP.factionsAt = (c, t = OP.time) => {
    if (t == null || !c.memberships || !c.memberships.length) return c.factions || [];
    const act = c.memberships.filter((m) => ord(m.since, OP.arcOrder(c.firstArc)) <= t && ord(m.until, Infinity) >= t).map((m) => m.faction);
    return act.length ? act : [c.memberships[0].faction];
  };
  OP.charColor = (c, t = OP.time) => OP.factionColor(OP.factionsAt(c, t)[0]);
  OP.setTime = (t) => {
    OP.time = t == null ? null : +t;
    window.dispatchEvent(new Event("op-time"));
  };
  OP.timeLabel = (t = OP.time) => (t == null ? "全期間" : (OP.arcByOrder(t) || {}).name || "");
  OP.periodLabel = (since, until) => {
    if (!since && !until) return "";
    const n = (id) => (OP.arc(id) ? OP.arc(id).name.replace(/編$/, "") : "");
    return `${since ? n(since) : ""}〜${until ? n(until) : ""}`;
  };
  // スライダーUI: どのビューに置いても同じ OP.time を共有する
  let playTimer = null;
  OP.timeSlider = () => `<div class="tslider" data-tslider>
      <span class="tslider-k">物語の現在地</span>
      <button class="btn tplay" type="button" aria-label="編を順に再生">▶</button>
      <input type="range" min="1" max="${OP.arcs.length + 1}" step="1" aria-label="物語の現在地">
      <span class="tlabel"></span>
    </div>`;
  function syncSliders() {
    document.querySelectorAll("[data-tslider]").forEach((el) => {
      el.querySelector("input").value = OP.time == null ? OP.arcs.length + 1 : OP.time;
      el.querySelector(".tlabel").textContent = OP.timeLabel();
      el.querySelector(".tplay").textContent = playTimer ? "■" : "▶";
      el.classList.toggle("on", OP.time != null);
    });
  }
  OP.bindTimeSliders = (root) => {
    root.querySelectorAll("[data-tslider]").forEach((el) => {
      el.querySelector("input").addEventListener("input", (ev) => {
        stopPlay();
        const v = +ev.target.value;
        OP.setTime(v > OP.arcs.length ? null : v);
      });
      el.querySelector(".tplay").addEventListener("click", () => (playTimer ? stopPlay() : startPlay()));
    });
    syncSliders();
  };
  function startPlay() {
    let t = OP.time == null || OP.time >= OP.arcs.length ? 1 : OP.time + 1;
    OP.setTime(t);
    playTimer = setInterval(() => {
      if (t >= OP.arcs.length) return stopPlay();
      OP.setTime(++t);
    }, 1600);
    syncSliders();
  }
  function stopPlay() { if (playTimer) clearInterval(playTimer); playTimer = null; syncSliders(); }
  window.addEventListener("op-time", syncSliders);

  // ---- 色・名前 ----
  OP.colorOf = (id) => {
    const r = byId.get(id);
    if (!r) return "#7f8c8d";
    if (r.type === "character") return OP.charColor(r.e, null);
    if (r.type === "faction") return OP.factionColor(id);
    if (r.type === "place") return "#2f80ed";
    if (r.type === "fruit") return FRUIT_COLOR[r.e.type] || "#8e44ad";
    if (r.type === "mystery") return "#5b4b8a";
    return "#a9761f";
  };
  OP.nameOf = (id) => {
    const r = byId.get(id);
    if (!r) return id;
    return r.e.name || r.e.term || r.e.title || id;
  };

  // 関係の索引
  const relsOf = new Map();
  OP.relations.forEach((r) => {
    [r.from, r.to].forEach((id) => { if (!relsOf.has(id)) relsOf.set(id, []); relsOf.get(id).push(r); });
  });
  OP.relsOf = (id) => relsOf.get(id) || [];
  OP.fruitsOf = (charId) => OP.fruits.filter((f) => (f.holders || []).some((h) => h.char === charId));
  OP.familiesOf = (charId) => OP.families.filter((f) => f.members.some((m) => m.char === charId));
  OP.bountyOf = (charId) => OP.bounties.find((b) => b.char === charId);
  OP.battles = OP.relations.filter((r) => r.winner);
  // その時点で判明していた懸賞金(全期間なら最新値)
  OP.bountyAt = (c, t = OP.time) => {
    if (t == null) return c.bounty;
    const b = OP.bountyOf(c.id);
    if (!b) return OP.arcOrder(c.firstArc) <= t ? c.bounty : null;
    const known = b.history.filter((h) => OP.arcOrder(h.arc) <= t);
    return known.length ? known[known.length - 1].value : null;
  };

  // ---- 表示ヘルパー ----
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  OP.esc = esc;
  OP.avatar = (id, cls = "") => {
    const r = byId.get(id);
    const name = OP.nameOf(id);
    const sq = r && r.type !== "character" ? " sq" : "";
    const ini = sq ? String(name).replace(/^聖地/, "").charAt(0) : OP.initial(name);
    return `<span class="avatar${sq} ${cls}" style="--c:${OP.colorOf(id)}" aria-hidden="true">${esc(ini)}</span>`;
  };
  OP.chip = (id, extra = "") => {
    if (!byId.has(id)) return "";
    return `<a class="chip" data-open="${esc(id)}" href="#">${OP.avatar(id)}${esc(OP.nameOf(id))}${extra}</a>`;
  };
  OP.chips = (ids) => [...new Set(ids || [])].filter((id) => byId.has(id)).map((id) => OP.chip(id)).join("");
  OP.arcChip = (id) => (arcById.has(id) ? `<a class="chip plain" data-open="arc:${id}" href="#">${esc(arcById.get(id).name)}</a>` : "");
  OP.formatBounty = (n) => {
    if (n == null) return "";
    if (n === 0) return "0ベリー";
    const oku = Math.floor(n / 1e8), man = Math.floor((n % 1e8) / 1e4), rest = n % 1e4;
    return (oku ? oku + "億" : "") + (man ? man + "万" : "") + (rest ? rest : "") + "ベリー";
  };
  OP.statusLabel = { alive: "生存", dead: "死亡", unknown: "不明" };
  // 幅に収まる長さまでラベルを縮める(収まらなければ空)
  OP.fitLabel = (text, width, px) => {
    const n = Math.floor(width / px);
    if (n >= text.length) return text;
    return n >= 3 ? text.slice(0, n - 1) + "…" : "";
  };
  // サブタブ(同じナビ項目に属するビューの切替)
  OP.subtabs = (active, items) => `<div class="subtabs" role="tablist">${items.map(([v, label]) =>
    `<a href="#/${v}" role="tab" aria-selected="${v === active}" class="${v === active ? "active" : ""}">${label}</a>`).join("")}</div>`;

  // ---- ルーティング ----
  OP.views = {};
  const mounted = new Set();
  let current = null;
  function parseHash() {
    const h = location.hash.replace(/^#\/?/, "");
    const [path, q] = h.split("?");
    const params = new URLSearchParams(q || "");
    return { view: path || "home", e: params.get("e") };
  }
  OP.go = (view, e) => { location.hash = `#/${view}${e ? "?e=" + encodeURIComponent(e) : ""}`; };
  OP.current = () => current;
  function route() {
    let { view, e } = parseHash();
    if (!OP.views[view]) view = "home";
    const nav = OP.views[view].nav || view;
    document.querySelectorAll(".view").forEach((s) => s.classList.toggle("active", s.dataset.view === view));
    document.querySelectorAll(".nav a").forEach((a) => a.classList.toggle("active", a.dataset.view === nav));
    const el = document.getElementById("view-" + view);
    if (!mounted.has(view)) { mounted.add(view); OP.views[view].mount(el); OP.bindTimeSliders(el); }
    if (current !== view) { current = view; window.scrollTo(0, 0); OP.views[view].show && OP.views[view].show(); }
    if (e && byId.has(e)) { renderPanel(e); OP.views[view].focus && OP.views[view].focus(e); }
    else { closePanelUI(); OP.views[view].focus && OP.views[view].focus(e || null); }
  }
  // エンティティを開く: 今のビューのまま詳細を表示
  OP.open = (id) => OP.go(current || "home", id);

  // ---- 詳細パネル ----
  const panel = document.getElementById("panel");
  const body = panel.querySelector(".panel-body");
  function closePanelUI() { panel.hidden = true; document.body.classList.remove("panel-open"); }
  panel.querySelector(".panel-close").addEventListener("click", () => OP.go(current));
  document.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && !panel.hidden) OP.go(current); });

  const sec = (title, html) => (html && html.trim() ? `<div class="p-sec"><h3>${title}</h3>${html}</div>` : "");
  const facts = (rows) => {
    const r = rows.filter(([, v]) => v);
    return r.length ? `<dl class="p-facts">${r.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>` : "";
  };
  const head = (id, kind, title, alias, latest) => `
    <div class="p-head">${OP.avatar(id, "lg")}<div>
      <div class="p-kind">${kind}${latest ? ' <span class="tag">最新情報</span>' : ""}</div>
      <h2>${esc(title)}</h2>${alias ? `<div class="p-alias">${esc(alias)}</div>` : ""}
    </div></div>`;
  const viewBtn = (view, id, label) => `<a class="btn" href="#/${view}?e=${encodeURIComponent(id)}">${label}</a>`;
  const backlinks = (id, list, field) => list.filter((x) => (x[field] || []).includes(id)).map((x) => x.id);
  const tlLinks = (ids) => ids.map((tid) => { const t = byId.get(tid).e; return `<div class="rel-row"><span class="rel-label">${esc(t.when)}</span><a class="chip plain" data-open="${tid}" href="#">${esc(t.title)}</a></div>`; }).join("");
  const period = (x) => { const p = OP.periodLabel(x.since, x.until); return p ? ` <span class="period">${esc(p)}</span>` : ""; };
  const list = (items) => (items && items.length ? `<ul class="p-list">${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "");
  const battleRow = (r, me) => {
    const other = r.from === me ? r.to : r.from;
    const res = r.winner === "draw" ? "引き分け" : r.winner === "none" ? "決着なし" : (r.winner === "from") === (r.from === me) ? "勝ち" : "負け";
    const cls = { 勝ち: "win", 負け: "lose" }[res] || "draw";
    return `<div class="rel-row"><span class="result ${cls}">${res}</span>${OP.chip(other)}<span class="rel-label">${esc(r.label)}${r.arc && OP.arc(r.arc) ? "・" + esc(OP.arc(r.arc).name) : ""}</span></div>`;
  };
  OP.battleRow = battleRow;
  // 懸賞金推移の小さな折れ線
  function sparkline(hist) {
    if (!hist || hist.length < 2) return "";
    const W = 300, H = 60, P = 6;
    const ys = hist.map((h) => Math.log10(h.value));
    const y0 = Math.min(...ys), y1 = Math.max(...ys);
    const pts = hist.map((h, i) => [P + (i * (W - 2 * P)) / (hist.length - 1), H - P - ((Math.log10(h.value) - y0) / (y1 - y0 || 1)) * (H - 2 * P)]);
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" role="img" aria-label="懸賞金の推移"><polyline fill="none" stroke="var(--accent)" stroke-width="2" points="${pts.map((p) => p.join(",")).join(" ")}"/>${pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/>`).join("")}</svg>`;
  }

  function renderCharacter(c) {
    const rels = OP.relsOf(c.id).slice().sort((a, b) => Object.keys(REL).indexOf(a.type) - Object.keys(REL).indexOf(b.type));
    const relHtml = rels.map((r) => {
      const other = r.from === c.id ? r.to : r.from;
      const t = REL[r.type] || REL.other;
      return `<div class="rel-row"><span class="dot" style="--c:${t.color}" title="${t.label}"></span>${OP.chip(other)}<span class="rel-label">${esc(r.label)}${period(r)}</span></div>`;
    }).join("");
    const fruits = OP.fruitsOf(c.id);
    const fruit = fruits.length ? OP.chips(fruits.map((f) => f.id)) : c.fruit ? `${esc(c.fruit.name)} <span class="muted">(${esc(c.fruit.type)})</span>` : "";
    const arcs = (c.arcs || []).slice().sort((a, b) => OP.arcOrder(a) - OP.arcOrder(b)).map(OP.arcChip).join("");
    const battles = OP.battles.filter((r) => r.from === c.id || r.to === c.id);
    const wins = battles.filter((r) => (r.winner === "from" && r.from === c.id) || (r.winner === "to" && r.to === c.id)).length;
    const losses = battles.filter((r) => (r.winner === "from" && r.to === c.id) || (r.winner === "to" && r.from === c.id)).length;
    const b = OP.bountyOf(c.id);
    const bountyHist = b ? sparkline(b.history) + `<div class="b-hist">${b.history.map((h) => `<span>${esc(OP.formatBounty(h.value))}<small>${h.arc && OP.arc(h.arc) ? esc(OP.arc(h.arc).name) : ""}</small></span>`).join("")}</div>` : "";
    const memberships = (c.memberships || []).map((m) => `<div class="rel-row">${OP.chip(m.faction)}<span class="rel-label">${esc(OP.periodLabel(m.since || c.firstArc, m.until) || "")}</span></div>`).join("");
    const posts = OP.positions.flatMap((p) => (p.holders || []).filter((h) => h.char === c.id).map((h) => `<div class="rel-row"><span class="chip plain">${esc(p.name)}</span><span class="rel-label">${esc(OP.periodLabel(h.since, h.until) || "物語開始前〜")}${h.note ? "・" + esc(h.note) : ""}</span></div>`)).join("");
    const fams = OP.familiesOf(c.id);
    return head(c.id, "人物", c.name, c.alias, c.latest) +
      facts([
        ["所属", OP.chips(c.factions)],
        ["元所属", OP.chips(c.formerFactions)],
        ["役職", esc(c.role || "") + (c.rank ? ` <span class="muted">(${esc(RANK[c.rank])})</span>` : "")],
        ["懸賞金", c.bounty != null ? `<span class="bounty">${OP.formatBounty(c.bounty)}</span>` : ""],
        ["悪魔の実", fruit],
        ["覇気", (c.haki || []).join("・")],
        ["状態", OP.statusLabel[c.status] || ""],
        ["初登場", OP.arcChip(c.firstArc)],
        ["戦績", battles.length ? `${wins}勝 ${losses}敗${battles.length - wins - losses ? ` ${battles.length - wins - losses}分・決着なし` : ""}` : ""]
      ]) +
      `<p class="p-desc">${esc(c.desc)}</p>` +
      `<div class="p-actions">${viewBtn("graph", c.id, "相関図で見る")}${viewBtn("factions", (c.factions || [])[0] || "", "勢力図で見る")}${fams.map((f) => viewBtn("family", f.id + "|" + c.id, "家系図: " + esc(f.name))).join("")}</div>` +
      sec("懸賞金の推移", bountyHist) +
      sec("所属の変遷", memberships) +
      sec("就いた役職", posts) +
      sec(`関係 (${rels.length})`, relHtml) +
      sec(`戦い (${battles.length})`, battles.map((r) => battleRow(r, c.id)).join("")) +
      sec("主な登場編", arcs) +
      sec("ゆかりの場所", OP.chips(backlinks(c.id, OP.places, "characters"))) +
      sec("関連する出来事", tlLinks(backlinks(c.id, OP.timeline, "characters"))) +
      sec("関連する謎", OP.chips(backlinks(c.id, OP.mysteries, "related"))) +
      sec("関連用語", OP.chips(backlinks(c.id, OP.glossary, "related")));
  }
  function renderFaction(f) {
    const desc = OP.factionDescendants(f.id);
    const members = OP.characters.filter((c) => (c.factions || []).some((x) => desc.includes(x)));
    const former = OP.characters.filter((c) => (c.formerFactions || []).includes(f.id) && !members.includes(c));
    const chain = [];
    for (let p = facById.get(f.parent); p; p = facById.get(p.parent)) chain.unshift(p.id);
    return head(f.id, "勢力", f.name) +
      (chain.length ? `<div>${OP.chips(chain)}</div>` : "") +
      `<p class="p-desc">${esc(f.desc)}</p>` +
      `<div class="p-actions">${viewBtn("factions", f.id, "勢力図で見る")}${viewBtn("graph", "fac:" + f.id, "メンバーの相関図")}</div>` +
      sec("下部組織", OP.chips(OP.factionChildren(f.id).map((x) => x.id))) +
      sec(`メンバー (${members.length})`, OP.chips(members.map((c) => c.id))) +
      sec("元メンバー", OP.chips(former.map((c) => c.id))) +
      sec("拠点・支配地", OP.chips(backlinks(f.id, OP.places, "factions"))) +
      sec("関連する出来事", tlLinks(backlinks(f.id, OP.timeline, "factions"))) +
      sec("関連用語", OP.chips(backlinks(f.id, OP.glossary, "related")));
  }
  function renderPlace(p) {
    return head(p.id, "場所", p.name) +
      facts([["海域", esc(SEA[p.sea] || p.sea)], ["航路", p.route ? `麦わらの一味の ${p.route} 番目の寄港地` : ""]]) +
      `<p class="p-desc">${esc(p.desc)}</p>` +
      `<div class="p-actions">${viewBtn("map", p.id, "地図で見る")}</div>` +
      sec("舞台になった編", (p.arcs || []).map(OP.arcChip).join("")) +
      sec("支配・拠点の勢力", OP.chips(p.factions)) +
      sec("ゆかりの人物", OP.chips(p.characters)) +
      sec("ここで起きた出来事", tlLinks(backlinks(p.id, OP.timeline, "places")));
  }
  function renderGlossary(g) {
    const back = [...OP.glossary, ...OP.mysteries].filter((x) => x.id !== g.id && (x.related || []).includes(g.id)).map((x) => x.id);
    return head(g.id, "用語 / " + (GL_CAT[g.category] || ""), g.term, g.reading) +
      `<p class="p-desc">${esc(g.desc)}</p>` +
      sec("関連", OP.chips(g.related)) +
      sec("この用語に触れている項目", OP.chips(back));
  }
  function renderTimeline(t) {
    return head(t.id, "出来事 / " + esc(t.when), t.title, "", t.latest) +
      facts([["時期", esc(t.when)], ["編", OP.arcChip(t.arc)]]) +
      `<p class="p-desc">${esc(t.desc)}</p>` +
      `<div class="p-actions">${viewBtn("timeline", t.id, "年表で見る")}</div>` +
      sec("人物", OP.chips(t.characters)) + sec("場所", OP.chips(t.places)) + sec("勢力", OP.chips(t.factions));
  }
  function renderArc(a) {
    const id = "arc:" + a.id;
    const cast = OP.characters.filter((c) => (c.arcs || []).includes(a.id) || c.firstArc === a.id)
      .sort((x, y) => (y.major ? 1 : 0) - (x.major ? 1 : 0));
    const debut = OP.characters.filter((c) => c.firstArc === a.id);
    const prev = OP.arcByOrder(a.order - 1), next = OP.arcByOrder(a.order + 1);
    const bounties = OP.bounties.flatMap((b) => b.history.filter((h) => h.arc === a.id).map((h) => `<div class="rel-row">${OP.chip(b.char)}<span class="bounty">${OP.formatBounty(h.value)}</span></div>`)).join("");
    const fruits = OP.fruits.filter((f) => (f.holders || []).some((h) => h.since === a.id)).map((f) => f.id);
    return head(id, `編 / ${esc(a.saga)}`, a.name, "", a.latest) +
      `<p class="p-desc">${esc(a.summary || "")}</p>` +
      `<div class="p-actions">${viewBtn("graph", id, "この編の相関図")}${viewBtn("map", id, "地図で見る")}${viewBtn("timeline", id, "年表で見る")}</div>` +
      `<div class="p-actions">${prev ? `<a class="btn" data-open="arc:${prev.id}" href="#">← ${esc(prev.name)}</a>` : ""}${next ? `<a class="btn" data-open="arc:${next.id}" href="#">${esc(next.name)} →</a>` : ""}</div>` +
      sec("舞台", OP.chips(a.places || [])) +
      sec(`この編で初登場 (${debut.length})`, OP.chips(debut.map((c) => c.id))) +
      sec(`主な登場人物 (${cast.length})`, OP.chips(cast.map((c) => c.id))) +
      sec("出来事", tlLinks(OP.timeline.filter((t) => t.arc === a.id).sort((x, y) => x.sort - y.sort).map((t) => t.id))) +
      sec("この編の戦い", OP.battles.filter((r) => r.arc === a.id).map((r) => battleRow(r, r.from)).join("")) +
      sec("懸賞金の更新", bounties) +
      sec("能力を得た者", OP.chips(fruits)) +
      sec("この編で提示された謎", OP.chips(OP.mysteries.filter((m) => m.arc === a.id).map((m) => m.id)));
  }
  function renderFruit(f) {
    const holders = (f.holders || []).map((h, i) => `<div class="rel-row"><span class="rel-label">${i + 1}代目</span>${h.char ? OP.chip(h.char) : `<span class="chip plain">${esc(h.name)}</span>`}<span class="rel-label">${esc(OP.periodLabel(h.since, h.until))}${h.note ? "・" + esc(h.note) : ""}</span></div>`).join("");
    const back = [...OP.glossary, ...OP.mysteries].filter((x) => (x.related || []).includes(f.id)).map((x) => x.id);
    return head(f.id, "悪魔の実", f.name, f.type + (f.subtype ? "・" + f.subtype : "")) +
      `<p class="p-desc">${esc(f.desc)}</p>` +
      `<div class="p-actions">${viewBtn("fruits", f.id, "悪魔の実図鑑で見る")}</div>` +
      sec("能力者の履歴", holders) + sec("関連項目", OP.chips(back));
  }
  function renderMystery(m) {
    return head(m.id, `謎 / ${MYS_STATUS[m.status]}`, m.title) +
      facts([["状態", `<span class="mys-status ${m.status}">${MYS_STATUS[m.status]}</span>`], ["提示された編", OP.arcChip(m.arc)]]) +
      `<p class="p-desc">${esc(m.summary)}</p>` +
      sec("判明していること", list(m.known)) +
      sec("作中の手がかり", list(m.clues)) +
      sec("関連", OP.chips(m.related)) +
      `<p class="muted" style="font-size:12px">ファンの考察は載せず、作中で描かれた事実だけをまとめています。</p>`;
  }

  // ---- 足あと(パネルでたどった履歴) ----
  let trail = [];
  function pushTrail(id) {
    const i = trail.indexOf(id);
    if (i >= 0) trail = trail.slice(0, i + 1);
    else trail.push(id);
    if (trail.length > 8) trail = trail.slice(-8);
  }
  const trailHtml = () => (trail.length > 1 ? `<nav class="trail" aria-label="たどった道">${trail.map((id, i) =>
    i === trail.length - 1 ? `<span aria-current="page">${esc(OP.nameOf(id))}</span>` : `<a data-open="${esc(id)}" href="#">${esc(OP.nameOf(id))}</a>`).join('<span class="sep">›</span>')}</nav>` : "");

  function renderPanel(id) {
    const { type, e } = byId.get(id);
    const fn = { character: renderCharacter, faction: renderFaction, place: renderPlace, glossary: renderGlossary, timeline: renderTimeline, arc: renderArc, fruit: renderFruit, mystery: renderMystery }[type];
    pushTrail(id);
    body.innerHTML = trailHtml() + fn(e);
    panel.hidden = false;
    document.body.classList.add("panel-open");
    panel.scrollTop = 0;
  }

  // data-open 属性を持つ要素のクリックでエンティティを開く
  document.addEventListener("click", (ev) => {
    const a = ev.target.closest("[data-open]");
    if (!a) return;
    ev.preventDefault();
    hideHover();
    OP.open(a.dataset.open);
  });

  // ---- ホバー表示(マウス操作の端末のみ) ----
  const hover = document.createElement("div");
  hover.className = "hovercard";
  hover.hidden = true;
  document.body.appendChild(hover);
  let hoverTimer = null, hoverEl = null;
  function hideHover() { clearTimeout(hoverTimer); hover.hidden = true; hoverEl = null; }
  if (matchMedia("(hover: hover)").matches) {
    document.addEventListener("mouseover", (ev) => {
      const a = ev.target.closest("[data-open]");
      if (a === hoverEl) return;
      hideHover();
      if (!a || a.closest(".trail") || !byId.has(a.dataset.open)) return;
      hoverEl = a;
      hoverTimer = setTimeout(() => {
        const { type, e } = byId.get(a.dataset.open);
        const text = e.desc || e.summary || "";
        hover.innerHTML = `<div class="hc-head">${OP.avatar(a.dataset.open)}<div><div class="hc-kind">${TYPE_LABEL[type]}</div><b>${esc(OP.nameOf(a.dataset.open))}</b>${e.alias ? `<div class="hc-alias">${esc(e.alias)}</div>` : ""}</div></div>${text ? `<p>${esc(text.slice(0, 90))}${text.length > 90 ? "…" : ""}</p>` : ""}`;
        hover.hidden = false;
        const r = a.getBoundingClientRect(), hr = hover.getBoundingClientRect();
        let x = Math.min(r.left, innerWidth - hr.width - 12), y = r.bottom + 8;
        if (y + hr.height > innerHeight - 8) y = r.top - hr.height - 8;
        hover.style.left = Math.max(8, x) + "px";
        hover.style.top = Math.max(8, y) + "px";
      }, 350);
    });
    window.addEventListener("scroll", hideHover, { passive: true });
  }

  // ---- 検索 ----
  const searchIndex = [];
  byId.forEach(({ type, e }, id) => {
    const keys = [e.name, e.alias, e.term, e.reading, e.title].filter(Boolean).join(" ");
    searchIndex.push({ id, type, keys: keys.toLowerCase(), name: OP.nameOf(id) });
  });
  const kata = (s) => s.replace(/[ぁ-ゖ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60));
  OP.search = (q) => {
    q = q.trim().toLowerCase();
    if (!q) return [];
    const qs = [q, kata(q)];
    const typeRank = { character: 0, faction: 1, place: 2, arc: 3, fruit: 4, glossary: 5, mystery: 6, timeline: 7 };
    return searchIndex
      .map((s) => {
        const k = kata(s.keys);
        const i = Math.min(...qs.map((x) => { const j = k.indexOf(kata(x)); return j < 0 ? 1e9 : j; }));
        // 名前の完全一致 > 語頭一致 > その他
        const exact = qs.some((x) => kata(s.name.toLowerCase()) === kata(x));
        const head = exact ? -1 : i === 0 || /[・\s]/.test(k.charAt(i - 1)) ? 0 : 1;
        return { s, i, head };
      })
      .filter((x) => x.i < 1e9)
      .sort((a, b) => a.head - b.head || typeRank[a.s.type] - typeRank[b.s.type] || a.i - b.i || a.s.name.length - b.s.name.length)
      .slice(0, 20)
      .map((x) => x.s);
  };
  const input = document.getElementById("search-input");
  const results$ = document.getElementById("search-results");
  let sel = 0, results = [];
  function renderResults() {
    results$.hidden = !results.length;
    results$.innerHTML = results.map((r, i) => `<li role="option" aria-selected="${i === sel}" data-id="${esc(r.id)}">${OP.avatar(r.id)}<span>${esc(r.name)}</span><span class="type">${TYPE_LABEL[r.type]}</span></li>`).join("");
  }
  input.addEventListener("input", () => { results = OP.search(input.value); sel = 0; renderResults(); });
  input.addEventListener("keydown", (ev) => {
    if (ev.key === "ArrowDown") { sel = Math.min(sel + 1, results.length - 1); renderResults(); ev.preventDefault(); }
    else if (ev.key === "ArrowUp") { sel = Math.max(sel - 1, 0); renderResults(); ev.preventDefault(); }
    else if (ev.key === "Enter" && results[sel]) pick(results[sel].id);
    else if (ev.key === "Escape") { results = []; renderResults(); }
  });
  results$.addEventListener("mousedown", (ev) => { const li = ev.target.closest("li"); if (li) { ev.preventDefault(); pick(li.dataset.id); } });
  input.addEventListener("blur", () => setTimeout(() => { results$.hidden = true; }, 100));
  input.addEventListener("focus", () => { if (results.length) results$.hidden = false; });
  function pick(id) { results = []; renderResults(); input.value = ""; input.blur(); OP.open(id); }

  // ---- テーマ切替 ----
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("op-theme", root.dataset.theme); } catch (e) {}
    window.dispatchEvent(new Event("op-theme"));
  });

  OP.start = () => { window.addEventListener("hashchange", route); route(); };
})();
