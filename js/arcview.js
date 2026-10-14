// 編の一覧: サーガごとにカードを並べ、クリックで編の詳細パネルを開く
(function () {
  const esc = OP.esc;
  const SAGA_COLOR = ["#2f80ed", "#d4ac0d", "#7fb3d5", "#16a085", "#5d6d7e", "#c0392b", "#1abc9c", "#e84393", "#7d3c98", "#cf6a00"];

  OP.views.arcs = {
    mount(el) {
      const sagas = d3.groups(OP.arcs.slice().sort((a, b) => a.order - b.order), (a) => a.saga);
      const color = new Map(sagas.map(([s], i) => [s, SAGA_COLOR[i % SAGA_COLOR.length]]));
      const ribbon = OP.arcs.map((a) => `<a class="rb" data-open="arc:${a.id}" href="#" style="--c:${color.get(a.saga)}" title="${esc(a.name)}"></a>`).join("");
      const card = (a) => {
        const debut = OP.characters.filter((c) => c.firstArc === a.id).length;
        const events = OP.timeline.filter((t) => t.arc === a.id).length;
        const fights = OP.battles.filter((r) => r.arc === a.id).length;
        return `<div class="card arc-card" data-open="arc:${a.id}" tabindex="0" role="button" style="--c:${color.get(a.saga)}">
          <div class="arc-no">第${a.order}編${a.latest ? ' <span class="tag">最新</span>' : ""}</div>
          <h3>${esc(a.name)}</h3>
          <p>${esc(a.summary || "")}</p>
          <div class="arc-meta"><span>初登場 ${debut}人</span><span>出来事 ${events}</span><span>戦い ${fights}</span></div>
        </div>`;
      };
      el.innerHTML = `<div class="wrap">
        <div class="view-head"><h1>編で読む</h1><p>物語を32の編に分けています。編を開くと、あらすじ・舞台・初登場人物・出来事・戦い・懸賞金の更新がまとまり、その時点の相関図や地図へ移れます。</p></div>
        <div class="ribbon" aria-label="編の流れ">${ribbon}</div>
        ${sagas.map(([saga, arcs]) => `<section class="saga"><h2><span class="dot" style="--c:${color.get(saga)}"></span>${esc(saga)}</h2>
          <div class="arc-grid">${arcs.map(card).join("")}</div></section>`).join("")}
      </div>`;
      el.addEventListener("keydown", (ev) => { if (ev.key === "Enter" && ev.target.matches(".arc-card")) OP.open(ev.target.dataset.open); });
    },
    focus(id) {
      const card = id && document.querySelector(`#view-arcs [data-open="${CSS.escape(id)}"].arc-card`);
      document.querySelectorAll("#view-arcs .arc-card").forEach((c) => c.classList.toggle("sel", c === card));
      if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };
})();
