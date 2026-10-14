// 英語データの受け皿。各ファイルは OP.addEn(コレクション名, { id: { フィールド: 値 } }) で追記する。
// 同じ項目に複数のファイルから書いてよい(配列は要素ごと、オブジェクトはキーごとに深くマージする)。
window.OP = window.OP || {};
OP.en = OP.en || {};
(function () {
  const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
  function merge(dst, src) {
    if (Array.isArray(src)) {
      const out = Array.isArray(dst) ? dst : [];
      src.forEach((v, i) => { if (v != null) out[i] = isObj(v) || Array.isArray(v) ? merge(out[i], v) : v; });
      return out;
    }
    if (isObj(src)) {
      const out = isObj(dst) ? dst : {};
      for (const k in src) out[k] = isObj(src[k]) || Array.isArray(src[k]) ? merge(out[k], src[k]) : src[k];
      return out;
    }
    return src;
  }
  OP.addEn = function (kind, entries) {
    OP.en[kind] = merge(OP.en[kind], entries);
  };
})();
// 関係には ID がないため、この形式のキーで参照する
OP.relKey = (r) => `${r.from}>${r.to}>${r.type}${r.since ? "@" + r.since : ""}`;
