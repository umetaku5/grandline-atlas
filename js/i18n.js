// 言語切替: 英語モードでは (1) データに英訳を重ね、(2) 描画された UI 文言を辞書で置き換える。
// 日本語モードでは何もしない。core.js より前に読み込む。
(function () {
  const OP = (window.OP = window.OP || {});
  let lang = "ja";
  try {
    const q = new URLSearchParams(location.search).get("lang");
    const saved = localStorage.getItem("op-lang");
    lang = q || saved || (/^ja\b/i.test(navigator.language || "ja") ? "ja" : "en");
  } catch (e) {}
  if (lang !== "en") lang = "ja";
  OP.lang = lang;
  document.documentElement.lang = lang;
  const EN = lang === "en";
  OP.SEP = EN ? " · " : "・"; // 文中の区切り
  const DICT = OP.I18N_EN || {};
  const PATTERNS = (OP.I18N_EN_PATTERNS || []).map(([re, rep]) => [new RegExp("^" + re + "$"), rep]);

  // 文字列1つを訳す(完全一致 → パターン → そのまま)
  OP.t = (s) => {
    if (!EN || s == null) return s;
    const key = String(s).trim();
    if (!key) return s;
    if (Object.prototype.hasOwnProperty.call(DICT, key)) return String(s).replace(key, DICT[key]);
    for (const [re, rep] of PATTERNS) if (re.test(key)) return String(s).replace(key, key.replace(re, (...m) => rep.replace(/\$(\d)/g, (_, i) => OP.t(m[+i]))));
    return s;
  };

  // ---- データに英訳を重ねる ----
  function overlay() {
    const en = OP.en || {};
    const pick = (e) => ({ name: e.name, alias: e.alias, term: e.term, title: e.title });
    for (const kind in en) {
      if (kind === "relations") continue;
      const list = OP[kind] || [];
      for (const item of list) {
        const tr = en[kind][item.id];
        if (!tr) continue;
        item._ja = pick(item);
        for (const f in tr) {
          if (f === "holders") (item.holders || []).forEach((h, i) => tr.holders[i] && Object.assign(h, tr.holders[i]));
          else if (f === "members") (item.members || []).forEach((m) => tr.members[m.key] && Object.assign(m, tr.members[m.key]));
          else if (f === "fruitName") { if (item.fruit) item.fruit = { ...item.fruit, name: tr.fruitName }; }
          else item[f] = tr[f];
        }
      }
    }
    const rl = en.relations || {};
    (OP.relations || []).forEach((r) => { const tr = rl[OP.relKey(r)]; if (tr && tr.label) r.label = tr.label; });
  }
  if (EN) overlay();

  // ---- 描画された UI 文言の置き換え ----
  const JA = /[぀-ヿ㐀-鿿]/;
  const ATTRS = ["title", "placeholder", "aria-label"];
  function trText(node) {
    const v = node.nodeValue;
    if (!JA.test(v)) return;
    const out = OP.t(v);
    if (out !== v) node.nodeValue = out;
  }
  function trEl(el) {
    for (const a of ATTRS) {
      const v = el.getAttribute && el.getAttribute(a);
      if (v && JA.test(v)) { const out = OP.t(v); if (out !== v) el.setAttribute(a, out); }
    }
  }
  function trTree(root) {
    if (root.nodeType === 3) return trText(root);
    if (root.nodeType !== 1) return;
    trEl(root);
    root.querySelectorAll("[title],[placeholder],[aria-label]").forEach(trEl);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) trText(n);
  }
  OP.translateDom = trTree;
  if (EN) {
    trTree(document.body);
    new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === "characterData") trText(m.target);
        else if (m.type === "attributes") trEl(m.target);
        else m.addedNodes.forEach(trTree);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    document.title = "Grand Line Atlas";
    const md = document.querySelector('meta[name="description"]');
    if (md) md.content = "An unofficial guide to the world of One Piece: an interactive map, relationship chart, factions and timeline.";
  }

  // ---- 切替ボタン(表示中の画面と物語の現在地は保ったまま再読み込み) ----
  const btn = document.getElementById("lang-toggle");
  if (btn) {
    btn.textContent = EN ? "日本語" : "EN";
    btn.setAttribute("aria-label", EN ? "日本語に切り替え" : "Switch to English");
    btn.setAttribute("lang", EN ? "ja" : "en");
    btn.addEventListener("click", () => {
      try {
        localStorage.setItem("op-lang", EN ? "ja" : "en");
        sessionStorage.setItem("op-time", OP.time == null ? "" : String(OP.time));
      } catch (e) {}
      // ?lang= は保存した設定より優先されるので外してから再読み込み(ハッシュだけの変更では再読み込みされない)
      const u = new URL(location.href);
      u.searchParams.delete("lang");
      history.replaceState(null, "", u.toString());
      location.reload();
    });
  }
  try { const t = sessionStorage.getItem("op-time"); if (t) OP.restoreTime = +t; sessionStorage.removeItem("op-time"); } catch (e) {}
})();
