// データ整合性チェック: node tools/validate.js
// スキーマ違反・重複ID・存在しないIDへの参照を検出し、件数を報告する。
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const dataDir = path.join(__dirname, "..", "js", "data");
const ctx = { window: {} };
ctx.OP = ctx.window.OP = {};
vm.createContext(ctx);
for (const f of ["arcs", "factions", "characters", "relations", "places", "timeline", "glossary", "fruits", "mysteries", "families", "positions", "bounties"]) {
  const p = path.join(dataDir, f + ".js");
  if (!fs.existsSync(p)) { console.log(`(skip) ${f}.js がありません`); continue; }
  vm.runInContext(fs.readFileSync(p, "utf8"), ctx, { filename: p });
}
const OP = ctx.window.OP;
const errors = [];
const warn = [];
const err = (m) => errors.push(m);

const arcs = OP.arcs || [], factions = OP.factions || [], chars = OP.characters || [],
  rels = OP.relations || [], places = OP.places || [], timeline = OP.timeline || [], glossary = OP.glossary || [],
  fruits = OP.fruits || [], mysteries = OP.mysteries || [], families = OP.families || [], positions = OP.positions || [], bounties = OP.bounties || [];

const arcIds = new Set(arcs.map((a) => a.id));
const ids = new Map(); // 全エンティティ共通のID空間
function reg(list, type) {
  for (const e of list) {
    if (!e.id || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.id)) err(`${type}: 不正なID "${e.id}"`);
    if (ids.has(e.id)) err(`重複ID "${e.id}" (${ids.get(e.id)} と ${type})`);
    ids.set(e.id, type);
  }
}
reg(factions, "faction"); reg(chars, "character"); reg(places, "place"); reg(glossary, "glossary"); reg(timeline, "timeline");
reg(fruits, "fruit"); reg(mysteries, "mystery"); reg(families, "family"); reg(positions, "position");
const arcOrder = new Map(arcs.map((a) => [a.id, a.order]));
// 期間 since/until (arc ID, null 可) の検証
const checkPeriod = (o, x) => {
  for (const f of ["since", "until"]) if (x[f] != null && !arcIds.has(x[f])) err(`${o}.${f}: 存在しない arc "${x[f]}"`);
  if (x.since && x.until && arcOrder.get(x.since) > arcOrder.get(x.until)) err(`${o}: since が until より後`);
};
const isType = (id, t) => ids.get(id) === t;
const checkRefs = (owner, list, type, field) => {
  if (list == null) return;
  if (!Array.isArray(list)) return err(`${owner}.${field} は配列であること`);
  for (const r of list) {
    const anyOk = ids.has(r) || (String(r).startsWith("arc:") && arcIds.has(r.slice(4)));
    if (type === "arc" ? !arcIds.has(r) : type === "any" ? !anyOk : !isType(r, type))
      err(`${owner}.${field}: 存在しない${type} "${r}"`);
  }
};
const need = (owner, e, fields) => fields.forEach((f) => { if (e[f] == null || e[f] === "") err(`${owner}: 必須項目 ${f} がありません`); });

for (const f of factions) {
  need(`faction ${f.id}`, f, ["name", "kind", "desc"]);
  if (f.parent && !isType(f.parent, "faction")) err(`faction ${f.id}.parent: 存在しない "${f.parent}"`);
}

const FRUIT_TYPES = ["超人系", "動物系", "自然系"];
const HAKI = ["見聞色", "武装色", "覇王色"];
const STATUS = ["alive", "dead", "unknown"];
const RANKS = ["imu", "elder", "knight", "fleet-admiral", "admiral", "vice-admiral", "officer", "agent"];
for (const c of chars) {
  const o = `character ${c.id}`;
  need(o, c, ["name", "factions", "status", "firstArc", "desc"]);
  checkRefs(o, c.factions, "faction", "factions");
  checkRefs(o, c.formerFactions, "faction", "formerFactions");
  if (c.firstArc && !arcIds.has(c.firstArc)) err(`${o}.firstArc: 存在しない arc "${c.firstArc}"`);
  checkRefs(o, c.arcs, "arc", "arcs");
  if (!STATUS.includes(c.status)) err(`${o}.status は ${STATUS.join("/")} のいずれか`);
  if (c.bounty != null && typeof c.bounty !== "number") err(`${o}.bounty は数値(ベリー)か null`);
  if (c.fruit && (!c.fruit.name || !FRUIT_TYPES.includes(c.fruit.type))) err(`${o}.fruit は {name, type: ${FRUIT_TYPES.join("/")}}`);
  if (c.haki && c.haki.some((h) => !HAKI.includes(h))) err(`${o}.haki は ${HAKI.join("/")} の配列`);
  (c.memberships || []).forEach((m, i) => {
    if (!isType(m.faction, "faction")) err(`${o}.memberships[${i}]: 存在しない faction "${m.faction}"`);
    checkPeriod(`${o}.memberships[${i}]`, m);
  });
  if (c.rank != null && !RANKS.includes(c.rank)) err(`${o}.rank は ${RANKS.join("/")}`);
}

const REL_TYPES = ["family", "crew", "enemy", "mentor", "ally", "rival", "love", "other"];
const relKeys = new Set();
rels.forEach((r, i) => {
  const o = `relation[${i}] ${r.from}->${r.to}`;
  need(o, r, ["from", "to", "type", "label"]);
  if (!isType(r.from, "character")) err(`${o}: from が存在しないキャラ`);
  if (!isType(r.to, "character")) err(`${o}: to が存在しないキャラ`);
  if (r.from === r.to) err(`${o}: 自己参照`);
  if (!REL_TYPES.includes(r.type)) err(`${o}: type は ${REL_TYPES.join("/")}`);
  if (r.arc && !arcIds.has(r.arc)) err(`${o}.arc: 存在しない arc "${r.arc}"`);
  checkPeriod(o, r);
  if (r.winner != null && !["from", "to", "draw", "none"].includes(r.winner)) err(`${o}.winner は from/to/draw/none`);
  const k = [r.from, r.to].sort().join("|") + "|" + r.type;
  if (relKeys.has(k)) warn.push(`${o}: 同じ組・同じ種別の関係が重複`);
  relKeys.add(k);
});

const SEAS = ["east-blue", "west-blue", "north-blue", "south-blue", "paradise", "new-world", "red-line", "calm-belt", "sky", "undersea", "other"];
const routeNums = new Map();
for (const p of places) {
  const o = `place ${p.id}`;
  need(o, p, ["name", "sea", "x", "y", "desc"]);
  if (!SEAS.includes(p.sea)) err(`${o}.sea は ${SEAS.join("/")}`);
  if (!(p.x >= 0 && p.x <= 1200 && p.y >= 0 && p.y <= 700)) err(`${o}: 座標が 0-1200 x 0-700 の範囲外`);
  checkRefs(o, p.arcs, "arc", "arcs");
  checkRefs(o, p.factions, "faction", "factions");
  checkRefs(o, p.characters, "character", "characters");
  if (p.route != null) {
    if (routeNums.has(p.route)) err(`${o}.route ${p.route} が ${routeNums.get(p.route)} と重複`);
    routeNums.set(p.route, p.id);
  }
}

for (const t of timeline) {
  const o = `timeline ${t.id}`;
  need(o, t, ["sort", "when", "title", "desc"]);
  if (typeof t.sort !== "number") err(`${o}.sort は数値`);
  if (t.arc && !arcIds.has(t.arc)) err(`${o}.arc: 存在しない arc "${t.arc}"`);
  checkRefs(o, t.characters, "character", "characters");
  checkRefs(o, t.places, "place", "places");
  checkRefs(o, t.factions, "faction", "factions");
}

const CATS = ["fruit", "haki", "history", "organization", "geography", "culture", "weapon", "other"];
for (const g of glossary) {
  const o = `glossary ${g.id}`;
  need(o, g, ["term", "category", "desc"]);
  if (!CATS.includes(g.category)) err(`${o}.category は ${CATS.join("/")}`);
  checkRefs(o, g.related, "any", "related");
}

// arcs
for (const a of arcs) {
  if (!a.summary) warn.push(`arc ${a.id}: summary がありません`);
  checkRefs(`arc ${a.id}`, a.places, "place", "places");
}
// 悪魔の実
for (const f of fruits) {
  const o = `fruit ${f.id}`;
  need(o, f, ["name", "type", "desc"]);
  if (!FRUIT_TYPES.includes(f.type)) err(`${o}.type は ${FRUIT_TYPES.join("/")}`);
  if (f.subtype != null && !["幻獣種", "古代種"].includes(f.subtype)) err(`${o}.subtype は 幻獣種/古代種/null`);
  (f.holders || []).forEach((h, i) => {
    if (h.char && !isType(h.char, "character")) err(`${o}.holders[${i}]: 存在しないキャラ "${h.char}"`);
    if (!h.char && !h.name) err(`${o}.holders[${i}]: char か name が必要`);
    checkPeriod(`${o}.holders[${i}]`, h);
  });
}
// 謎
for (const m of mysteries) {
  const o = `mystery ${m.id}`;
  need(o, m, ["title", "status", "summary"]);
  if (!["unsolved", "partial", "solved"].includes(m.status)) err(`${o}.status は unsolved/partial/solved`);
  if (m.arc && !arcIds.has(m.arc)) err(`${o}.arc: 存在しない arc "${m.arc}"`);
  checkRefs(o, m.related, "any", "related");
}
// 家系図
for (const f of families) {
  const o = `family ${f.id}`;
  need(o, f, ["name", "members"]);
  const keys = new Set();
  for (const m of f.members || []) {
    if (!m.key) err(`${o}: member に key がありません`);
    if (keys.has(m.key)) err(`${o}: key "${m.key}" が重複`);
    keys.add(m.key);
    if (m.char && !isType(m.char, "character")) err(`${o}.${m.key}: 存在しないキャラ "${m.char}"`);
    if (!m.char && !m.name) err(`${o}.${m.key}: char か name が必要`);
    if (typeof m.gen !== "number") err(`${o}.${m.key}: gen は数値`);
  }
  for (const m of f.members || []) {
    for (const p of m.parents || []) if (!keys.has(p)) err(`${o}.${m.key}.parents: 未定義の key "${p}"`);
    if (m.spouse && !keys.has(m.spouse)) err(`${o}.${m.key}.spouse: 未定義の key "${m.spouse}"`);
  }
}
// 役職の変遷
for (const p of positions) {
  const o = `position ${p.id}`;
  need(o, p, ["name", "holders"]);
  (p.holders || []).forEach((h, i) => {
    if (!isType(h.char, "character")) err(`${o}.holders[${i}]: 存在しないキャラ "${h.char}"`);
    checkPeriod(`${o}.holders[${i}]`, h);
  });
}
// 懸賞金の推移
for (const b of bounties) {
  const o = `bounty ${b.char}`;
  if (!isType(b.char, "character")) err(`${o}: 存在しないキャラ`);
  let prev = -1;
  (b.history || []).forEach((h, i) => {
    if (h.arc != null && !arcIds.has(h.arc)) err(`${o}[${i}]: 存在しない arc "${h.arc}"`);
    if (typeof h.value !== "number") err(`${o}[${i}]: value は数値`);
    if (h.value < prev) warn.push(`${o}: 懸賞金が減少している(${prev} → ${h.value})`);
    prev = h.value;
  });
  const c = chars.find((x) => x.id === b.char);
  const last = (b.history || []).slice(-1)[0];
  if (c && last && c.bounty != null && c.bounty !== last.value) warn.push(`${o}: 最新値 ${last.value} が characters.js の ${c.bounty} と不一致`);
}

const counts = { arcs: arcs.length, factions: factions.length, characters: chars.length, relations: rels.length, places: places.length, timeline: timeline.length, glossary: glossary.length,
  fruits: fruits.length, mysteries: mysteries.length, families: families.length, positions: positions.length, bounties: bounties.length };
const mins = { factions: 25, characters: 150, relations: 250, places: 60, timeline: 80, glossary: 80 };
console.log("件数:", counts);
for (const [k, m] of Object.entries(mins)) if (counts[k] < m) warn.push(`件数不足: ${k} ${counts[k]} < ${m}`);
const isolated = chars.filter((c) => !rels.some((r) => r.from === c.id || r.to === c.id));
if (rels.length && isolated.length) warn.push(`関係が1本もないキャラ ${isolated.length}人: ${isolated.map((c) => c.id).join(", ")}`);
warn.forEach((w) => console.log("WARN", w));
errors.forEach((e) => console.log("ERROR", e));
console.log(errors.length ? `\nエラー ${errors.length}件` : "\nエラー 0件");
process.exit(errors.length ? 1 : 0);
