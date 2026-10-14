// ホーム: 入口、世界の基本、データから自動生成するクイズ
(function () {
  const esc = OP.esc;
  const icon = {
    graph: '<svg viewBox="0 0 100 100"><g fill="none" stroke="currentColor" stroke-width="4"><circle cx="25" cy="30" r="10"/><circle cx="72" cy="22" r="8"/><circle cx="60" cy="72" r="14"/><path d="M33 35l18 28M34 28l30-5M70 30l-6 28"/></g></svg>',
    map: '<svg viewBox="0 0 100 100"><g fill="none" stroke="currentColor" stroke-width="4"><rect x="8" y="8" width="84" height="84" rx="6"/><path d="M8 50h84M50 8v84"/><circle cx="72" cy="50" r="6" fill="currentColor"/></g></svg>',
    factions: '<svg viewBox="0 0 100 100"><g fill="none" stroke="currentColor" stroke-width="4"><circle cx="50" cy="50" r="40"/><circle cx="35" cy="45" r="16"/><circle cx="65" cy="58" r="12"/><circle cx="60" cy="30" r="7"/></g></svg>',
    timeline: '<svg viewBox="0 0 100 100"><g fill="none" stroke="currentColor" stroke-width="4"><path d="M20 10v80"/><circle cx="20" cy="25" r="6"/><circle cx="20" cy="55" r="6"/><circle cx="20" cy="80" r="6"/><path d="M34 25h50M34 55h40M34 80h46"/></g></svg>',
    arcs: '<svg viewBox="0 0 100 100"><g fill="none" stroke="currentColor" stroke-width="4"><rect x="10" y="30" width="18" height="40"/><rect x="34" y="30" width="18" height="40"/><rect x="58" y="30" width="18" height="40"/><path d="M80 50h12"/></g></svg>',
    mysteries: '<svg viewBox="0 0 100 100"><g fill="none" stroke="currentColor" stroke-width="5"><path d="M35 35q0-18 15-18t15 15q0 12-15 16v10"/><circle cx="50" cy="78" r="3" fill="currentColor"/></g></svg>',
    bounties: '<svg viewBox="0 0 100 100"><g fill="none" stroke="currentColor" stroke-width="4"><path d="M12 85h76M18 75l20-20 16 10 30-40"/></g></svg>',
    glossary: '<svg viewBox="0 0 100 100"><g fill="none" stroke="currentColor" stroke-width="4"><path d="M15 15h30q5 0 5 5v70q0-5-5-5H15zM85 15H55q-5 0-5 5v70q0-5 5-5h30z"/></g></svg>'
  };
  const entries = [
    ["graph", "人物相関図", "誰と誰がどう繋がっているか。家族・仲間・敵対・師弟を線でたどる。"],
    ["map", "世界地図", "四つの海、偉大なる航路、レッドライン。麦わらの一味の航路を再生できる。"],
    ["factions", "勢力図", "世界政府、四皇、革命軍。組織の入れ子構造とメンバーを一望する。"],
    ["timeline", "年表", "空白の100年からロジャーの処刑、そして現在まで。"],
    ["glossary", "用語集・悪魔の実", "覇気、Dの意志、古代兵器、112種の悪魔の実と能力者の継承。"],
    ["arcs", "編で読む", "32の編それぞれのあらすじ、初登場人物、戦い、懸賞金の更新。"],
    ["mysteries", "謎・伏線", "未解決・一部判明・解決済みに分けた、物語の大きな謎。"],
    ["bounties", "懸賞金・戦績", "懸賞金の推移とランキング、誰が誰に勝ったか。"]
  ];

  // 用語名からエンティティへのリンク(見つからなければただの文字)
  const L = (text, query) => {
    const hit = OP.search(query || text)[0];
    return hit ? `<a data-open="${hit.id}" href="#">${esc(text)}</a>` : esc(text);
  };

  function primer() {
    if (OP.lang === "en") return `<ol>
      <li>The world is split into ${L("four seas", "四つの海")} by a single continent, the ${L("Red Line", "レッドライン")}, and by the ${L("Grand Line", "グランドライン")}, which crosses it at a right angle. Both sides of the Grand Line are bordered by the ${L("Calm Belt", "カームベルト")}, where giant Sea Kings nest.</li>
      <li>The Grand Line has two halves, ${L("Paradise", "楽園")} and the ${L("New World", "新世界")}. Where they meet are the ${L("Sabaody Archipelago", "シャボンディ諸島")} and ${L("Fish-Man Island", "魚人島")}, with the ${L("Holy Land of Mary Geoise", "マリージョア")} on the Red Line above them.</li>
      <li>About 800 years ago, twenty kingdoms founded the ${L("World Government", "世界政府")}, and their descendants became the ${L("Celestial Dragons", "天竜人")}. The hundred years before that are the ${L("Void Century", "空白の100年")}, and even researching them is forbidden.</li>
      <li>Just before his execution, ${L("Gol D. Roger", "ロジャー")} told the world to go and find his treasure, which started the ${L("Great Pirate Era", "大海賊時代")}. The treasure, the ${L("One Piece", "ワンピース")}, is said to be on the last island, ${L("Laugh Tale", "ラフテル")}.</li>
      <li>The seas were kept in balance by the ${L("Four Emperors", "四皇")}, the ${L("Navy", "海軍")} and the ${L("Seven Warlords of the Sea", "王下七武海")}. This setup is called the "Three Great Powers", and it breaks down in the later part of the story.</li>
      <li>Fights run on ${L("Devil Fruits", "悪魔の実")}, which grant strange powers, and ${L("Haki", "覇気")}, the power of willpower. People with a "D" in their name carry a mystery known as the ${L("Will of D.", "Dの意志")}</li>
    </ol>`;
    return `<ol>
      <li>世界は${L("レッドライン")}という一本の大陸と、それに直交する${L("偉大なる航路", "グランドライン")}によって${L("四つの海")}に分けられている。航路の両脇には大型海王類の巣、${L("凪の帯", "カームベルト")}が広がる。</li>
      <li>偉大なる航路は前半の${L("楽園")}と後半の${L("新世界")}に分かれ、その境目に${L("シャボンディ諸島")}と${L("魚人島")}、真上に${L("聖地マリージョア", "マリージョア")}がある。</li>
      <li>約800年前に20の王国が${L("世界政府")}を作り、その末裔が${L("天竜人")}となった。それ以前の約100年は${L("空白の100年")}と呼ばれ、研究すら禁じられている。</li>
      <li>${L("ゴール・D・ロジャー", "ロジャー")}が処刑の間際に「財宝を探せ」と言い残したことで${L("大海賊時代")}が始まった。財宝${L("ワンピース")}は最後の島${L("ラフテル")}にあるとされる。</li>
      <li>海には${L("四皇")}と呼ばれる大海賊が君臨し、${L("海軍")}と${L("王下七武海")}がその均衡を保っていた。これが「三大勢力」の構図で、物語の後半で大きく崩れる。</li>
      <li>不思議な力を与える${L("悪魔の実")}と、意志の力${L("覇気")}が戦いの基本ルール。名前に「D」を持つ者たちには${L("Dの意志")}と呼ばれる謎が受け継がれている。</li>
    </ol>`;
  }

  // ---- クイズ ----
  const pickN = (arr, n) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };
  const one = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const uniqBy = (arr, f) => { const s = new Set(); return arr.filter((x) => { const k = f(x); if (s.has(k)) return false; s.add(k); return true; }); };
  const gens = [
    () => { // 異名
      const pool = OP.characters.filter((c) => c.alias && c.alias.length > 1);
      const c = one(pool);
      const opts = uniqBy([c, ...pickN(pool.filter((x) => x.id !== c.id), 3)], (x) => x.name);
      return { q: OP.lang === "en" ? `Who is known as "${c.alias}"?` : `「${c.alias}」と呼ばれるのは誰?`, opts: opts.map((x) => [x.id, x.name]), ans: c.id, open: c.id };
    },
    () => { // 悪魔の実
      const pool = OP.characters.filter((c) => c.fruit);
      const c = one(pool);
      const others = pickN(pool.filter((x) => x.fruit.name !== c.fruit.name), 3);
      return { q: OP.lang === "en" ? `Who ate the ${(OP.fruitsOf(c.id)[0] || c.fruit).name}?` : `${c.fruit.name}の能力者は誰?`, opts: [c, ...others].map((x) => [x.id, x.name]), ans: c.id, open: c.id };
    },
    () => { // 所属
      const pool = OP.characters.filter((c) => c.factions && c.factions.length && OP.faction(c.factions[0]).kind === "group");
      const c = one(pool);
      const right = c.factions[0];
      const others = pickN(OP.factions.filter((f) => f.kind === "group" && !c.factions.includes(f.id)), 3);
      return { q: OP.lang === "en" ? `Which group does ${c.name} belong to now?` : `${c.name}が現在所属しているのは?`, opts: [[right, OP.faction(right).name], ...others.map((f) => [f.id, f.name])], ans: right, open: c.id };
    },
    () => { // 用語
      const g = one(OP.glossary.filter((x) => x.desc.length > 30));
      const masked = g.desc.split(g.term).join(OP.lang === "en" ? "____" : "〇〇");
      const same = OP.glossary.filter((x) => x.id !== g.id && x.category === g.category);
      const others = pickN(same.length >= 3 ? same : OP.glossary.filter((x) => x.id !== g.id), 3);
      return { q: `${OP.lang === "en" ? "Which term matches this description?" : "次の説明にあてはまる用語は?"}<br><span class="muted" style="font-weight:400">${esc(masked.slice(0, 120))}${masked.length > 120 ? "…" : ""}</span>`, html: true, opts: [g, ...others].map((x) => [x.id, x.term]), ans: g.id, open: g.id };
    },
    () => { // 場所の海域
      const p = one(OP.places.filter((x) => x.sea !== "other"));
      const seas = pickN(Object.keys(OP.SEA).filter((s) => s !== p.sea && s !== "other"), 3);
      return { q: OP.lang === "en" ? `Where is ${p.name}?` : `${p.name}があるのは?`, opts: [[p.sea, OP.SEA[p.sea]], ...seas.map((s) => [s, OP.SEA[s]])], ans: p.sea, open: p.id };
    }
  ];
  let score = 0, total = 0;
  function nextQuiz(box) {
    const usable = gens.filter((g, i) => [OP.characters.length, OP.characters.length, OP.characters.length, OP.glossary.length, OP.places.length][i] >= 4);
    if (!usable.length) { box.innerHTML = "<p class=muted>データ読み込み後に出題されます。</p>"; return; }
    let q;
    for (let t = 0; t < 10 && !(q && q.opts.length === 4); t++) q = one(usable)();
    const opts = pickN(q.opts, q.opts.length);
    box.innerHTML = `<div class="quiz-q">${q.html ? q.q : esc(q.q)}</div>
      <div class="quiz-opts">${opts.map(([v, label]) => `<button data-v="${esc(v)}">${esc(label)}</button>`).join("")}</div>
      <div class="quiz-foot"><span class="muted">正解 ${score} / ${total}</span><span class="quiz-after"></span></div>`;
    box.querySelectorAll(".quiz-opts button").forEach((b) => b.addEventListener("click", () => {
      if (box.dataset.done === "1") return;
      box.dataset.done = "1"; total++;
      const ok = b.dataset.v === q.ans;
      if (ok) score++;
      box.querySelectorAll(".quiz-opts button").forEach((x) => { if (x.dataset.v === q.ans) x.classList.add("ok"); else if (x === b) x.classList.add("ng"); });
      box.querySelector(".quiz-foot .muted").textContent = `正解 ${score} / ${total}`;
      box.querySelector(".quiz-after").innerHTML = `<a class="btn" data-open="${q.open}" href="#">解説を見る</a> <button class="btn primary next">次の問題</button>`;
      box.querySelector(".next").addEventListener("click", () => { box.dataset.done = "0"; nextQuiz(box); });
    }));
  }

  OP.views.home = {
    mount(el) {
      const stats = [["人物", OP.characters.length], ["関係", OP.relations.length], ["勢力", OP.factions.length], ["場所", OP.places.length], ["出来事", OP.timeline.length], ["用語", OP.glossary.length], ["悪魔の実", OP.fruits.length], ["謎", OP.mysteries.length]];
      if (OP.lang === "en") ["People", "Relationships", "Factions", "Places", "Events", "Terms", "Devil Fruits", "Mysteries"].forEach((k, i) => stats[i] && (stats[i][0] = k));
      el.innerHTML = `<div class="wrap">
        <div class="hero">
          <svg class="hero-compass" viewBox="0 0 200 200" aria-hidden="true"><g fill="none" stroke="currentColor"><circle cx="100" cy="100" r="96" stroke-width="2"/><circle cx="100" cy="100" r="80" stroke-dasharray="2 6"/><circle cx="100" cy="100" r="40"/></g><path d="M100 8l12 92-12 92-12-92z" fill="currentColor" opacity=".6"/><path d="M8 100l92-12 92 12-92 12z" fill="currentColor" opacity=".35"/></svg>
          <h1>${OP.lang === "en" ? "The world of One Piece,<br><em>mapped and connected.</em>" : "ひとつなぎの世界を、<br><em>地図と線</em>で読み解く。"}</h1>
          <p class="lead">ワンピースの人物関係・勢力・地理・歴史をつなげて学べる非公式の図鑑です。どの項目からでも、関係するすべてへ飛べます。</p>
        </div>
        <div class="stats">${stats.map(([k, v]) => `<div class="stat"><b>${v}</b><span>${k}</span></div>`).join("")}</div>
        <div class="entry-grid">${entries.map(([v, t, d]) => `<a class="entry" href="#/${v}"><h2>${t}</h2><p>${d}</p>${icon[v]}</a>`).join("")}</div>
        <div class="home-cols">
          <div class="card primer"><h2>まず押さえる6つの基本</h2>${primer()}</div>
          <div class="card quiz"><h2>腕試しクイズ</h2><div class="quiz-box"></div></div>
        </div>
        <p class="disclaimer">非公式のファン向け学習サイトです。内容は2026年半ば時点の原作(エルバフ編途中まで)の知識に基づき、最新話の展開や細かな数値に誤りや欠落がある可能性があります。「最新情報」タグの項目は特に変わりやすい情報です。</p>
      </div>`;
      nextQuiz(el.querySelector(".quiz-box"));
    }
  };
})();
