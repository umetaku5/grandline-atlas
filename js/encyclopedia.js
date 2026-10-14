// 悪魔の実図鑑 と 謎・伏線トラッカー
(function () {
  const esc = OP.esc;

  // ---- 悪魔の実図鑑 ----
  let fEl, fType = "", fQ = "", fInherit = false;
  const holderHtml = (h) => (h.char ? OP.chip(h.char) : `<span class="chip plain">${esc(h.name)}</span>`);
  function renderFruits() {
    const q = fQ.trim();
    const items = OP.fruits.filter((f) =>
      (!fType || f.type === fType || f.subtype === fType) &&
      (!fInherit || (f.holders || []).length > 1) &&
      (!q || (f.name + f.desc + (f.holders || []).map((h) => (h.char ? OP.nameOf(h.char) : h.name)).join("")).includes(q)));
    fEl.querySelector(".fr-count").textContent = `${items.length}件`;
    fEl.querySelector(".fr-grid").innerHTML = items.map((f) => `
      <div class="card fr-card" data-open="${f.id}" tabindex="0" role="button" style="--c:${OP.FRUIT_COLOR[f.type]}">
        <div><span class="fr-type">${esc(f.type)}</span>${f.subtype ? ` <span class="tag dim">${esc(f.subtype)}</span>` : ""}</div>
        <h3>${esc(f.name)}</h3>
        <div class="fr-holders">${(f.holders || []).map(holderHtml).join('<span class="arrow">→</span>')}</div>
        <p>${esc(f.desc)}</p>
      </div>`).join("") || '<p class="muted">該当する実がありません。</p>';
  }
  OP.views.fruits = {
    nav: "glossary",
    mount(el) {
      fEl = el;
      const cnt = (t) => OP.fruits.filter((f) => f.type === t || f.subtype === t).length;
      const types = ["超人系", "動物系", "幻獣種", "古代種", "自然系"];
      el.innerHTML = `<div class="wrap">
        ${OP.subtabs("fruits", [["glossary", "用語集"], ["fruits", "悪魔の実図鑑"]])}
        <div class="view-head"><h1>悪魔の実図鑑</h1><p>食べると能力を得る代わりに泳げなくなる実。能力者が死ぬと実は世界のどこかに再び実るため、受け継がれてきた実もあります。</p></div>
        <div class="toolbar"><div class="tabs" id="fr-types"><button class="active" data-t="">すべて (${OP.fruits.length})</button>${types.map((t) => `<button data-t="${t}">${t} (${cnt(t)})</button>`).join("")}</div></div>
        <div class="toolbar">
          <input id="fr-q" type="search" class="inline-search" placeholder="実・能力者で絞り込み">
          <button class="toggle" id="fr-inherit" aria-pressed="false">継承された実だけ</button>
          <span class="muted fr-count" style="font-size:13px"></span>
        </div>
        <div class="fr-grid"></div>
      </div>`;
      el.querySelector("#fr-types").addEventListener("click", (ev) => {
        const b = ev.target.closest("button"); if (!b) return;
        fType = b.dataset.t;
        el.querySelectorAll("#fr-types button").forEach((x) => x.classList.toggle("active", x === b));
        renderFruits();
      });
      el.querySelector("#fr-q").addEventListener("input", (e) => { fQ = e.target.value; renderFruits(); });
      el.querySelector("#fr-inherit").addEventListener("click", (e) => { fInherit = !fInherit; e.currentTarget.setAttribute("aria-pressed", String(fInherit)); renderFruits(); });
      el.addEventListener("keydown", (ev) => { if (ev.key === "Enter" && ev.target.matches(".fr-card")) OP.open(ev.target.dataset.open); });
      renderFruits();
    }
  };

  // ---- 謎・伏線トラッカー ----
  OP.views.mysteries = {
    mount(el) {
      const cols = ["unsolved", "partial", "solved"];
      const card = (m) => `<div class="card mys-card ${m.status}" data-open="${m.id}" tabindex="0" role="button">
        <h3>${esc(m.title)}</h3>
        <p>${esc(m.summary)}</p>
        <div class="mys-meta"><span>判明 ${(m.known || []).length}</span><span>手がかり ${(m.clues || []).length}</span>${m.arc && OP.arc(m.arc) ? `<span>${esc(OP.arc(m.arc).name)}から</span>` : ""}</div>
      </div>`;
      el.innerHTML = `<div class="wrap">
        <div class="view-head"><h1>謎・伏線トラッカー</h1><p>物語に散りばめられた謎を、解決の度合いで分けました。作中で描かれた事実と手がかりだけを載せ、ファンの考察は含めていません。</p></div>
        <div class="mys-board">${cols.map((s) => {
          const ms = OP.mysteries.filter((m) => m.status === s).sort((a, b) => OP.arcOrder(a.arc) - OP.arcOrder(b.arc));
          return `<section class="mys-col"><h2><span class="mys-status ${s}">${OP.MYS_STATUS[s]}</span> <span class="muted">${ms.length}</span></h2>${ms.map(card).join("")}</section>`;
        }).join("")}</div>
      </div>`;
      el.addEventListener("keydown", (ev) => { if (ev.key === "Enter" && ev.target.matches(".mys-card")) OP.open(ev.target.dataset.open); });
    }
  };
})();
