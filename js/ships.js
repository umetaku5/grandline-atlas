// 船: anatomy スキルで作った解剖図(ships/<id>/ の単体ページ)を iframe で埋め込む
(function () {
  const esc = OP.esc;
  const SHIPS = [
    { id: "merry", ja: ["ゴーイングメリー号", "シロップ村でカヤから贈られた、一味最初の船。羊の船首とみかんの木が目印。竜骨が修復できないほど傷み、エニエス・ロビーの後に海で見送られた。"],
      en: ["Going Merry", "The crew's first ship, a gift from Kaya at Syrup Village, known for its sheep figurehead and tangerine trees. Its keel was damaged beyond repair, and the crew gave it a send-off at sea after Enies Lobby."] },
    { id: "sunny", ja: ["サウザンドサニー号", "フランキーが宝樹アダムで造った二隻目の船。ソルジャードックシステムやクー・ド・バーストなどの仕掛けを積む。"],
      en: ["Thousand Sunny", "The second ship, built by Franky from the wood of the Treasure Tree Adam. It carries mechanisms such as the Soldier Dock System and the Coup de Burst."] }
  ];
  const theme = () => {
    const t = document.documentElement.dataset.theme;
    return t || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  };
  const src = (id) => `ships/${id}/${id}-${OP.lang === "en" ? "en" : "ja"}${theme() === "light" ? "-light" : ""}.html`;
  let el;

  OP.views.ships = {
    nav: "glossary",
    mount(root) {
      el = root;
      const L = (s) => (OP.lang === "en" ? s.en : s.ja);
      el.innerHTML = `<div class="wrap">
        ${OP.subtabs("ships", [["glossary", "用語集"], ["fruits", "悪魔の実図鑑"], ["ships", "船"]])}
        <div class="view-head"><h1>${OP.lang === "en" ? "The ships" : "船の解剖図"}</h1><p>${OP.lang === "en"
          ? "Cutaway figures of the Straw Hats' two ships. Hover or click a part, or use its numbered button, to see what it is."
          : "麦わらの一味の2隻を、断面図で見られます。部品にマウスを乗せるかクリックするか、番号のボタンを押すと説明が出ます。"}</p></div>
        ${SHIPS.map((s) => `<section class="ship" id="ship-${s.id}">
          <h2>${esc(L(s)[0])}</h2><p class="muted">${esc(L(s)[1])}</p>
          <iframe class="ship-frame" data-ship="${s.id}" title="${esc(L(s)[0])}" src="${src(s.id)}"></iframe>
        </section>`).join("")}
        <p class="disclaimer">${OP.lang === "en"
          ? "Original isometric drawings made for this site with the anatomy skill (MIT License). They are not official artwork."
          : "anatomy スキル(MIT License)で描いた、このサイト独自の等角投影図です。公式の設定画ではありません。"}</p>
      </div>`;
      // 埋め込みページから届く高さに合わせる
      window.addEventListener("message", (ev) => {
        const d = ev.data;
        if (!d || d.type !== "anatomy-height") return;
        const f = el.querySelector(`.ship-frame[data-ship="${d.id}"]`);
        if (f && d.height > 100) f.style.height = Math.ceil(d.height) + "px";
      });
      window.addEventListener("op-theme", () => el.querySelectorAll(".ship-frame").forEach((f) => { f.src = src(f.dataset.ship); }));
    },
    focus(id) {
      const s = id && el.querySelector(`#ship-${CSS.escape(id)}`);
      if (s) s.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
})();
