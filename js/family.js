// 家系図: 世代ごとに横一列に並べる木構造
(function () {
  const esc = OP.esc;
  const GX = 128, GY = 120;
  let el, svg, gZoom, zoom, famId = null, selChar = null;

  function layout(f) {
    const byKey = new Map(f.members.map((m) => [m.key, { ...m }]));
    const gens = d3.groups([...byKey.values()], (m) => m.gen).sort((a, b) => a[0] - b[0]);
    const xOf = new Map();
    const place = (row) => row.forEach((m, i) => xOf.set(m.key, (i - (row.length - 1) / 2) * GX));
    // 親の位置の平均で並べ替え、配偶者は隣に寄せる
    for (let pass = 0; pass < 3; pass++) {
      gens.forEach(([, row]) => {
        row.forEach((m, i) => {
          const ps = (m.parents || []).filter((p) => xOf.has(p));
          m._x = ps.length ? d3.mean(ps, (p) => xOf.get(p)) : xOf.has(m.key) ? xOf.get(m.key) : i * GX;
        });
        row.sort((a, b) => a._x - b._x);
        row.slice().forEach((m) => {
          const partner = m.spouse && row.find((x) => x.key === m.spouse);
          if (!partner) return;
          row.splice(row.indexOf(m), 1);
          row.splice(row.indexOf(partner) + 1, 0, m);
        });
        place(row);
      });
    }
    const nodes = [...byKey.values()].map((m) => ({ ...m, x: xOf.get(m.key), y: m.gen * GY }));
    return { nodes, byKey: new Map(nodes.map((n) => [n.key, n])) };
  }

  function draw() {
    const f = OP.families.find((x) => x.id === famId);
    gZoom.selectAll("*").remove();
    el.querySelector(".fam-desc").textContent = f ? f.desc || "" : "";
    if (!f) return;
    const { nodes, byKey } = layout(f);
    const gLink = gZoom.append("g");
    // 配偶者線
    nodes.filter((n) => n.spouse && byKey.has(n.spouse)).forEach((n) => {
      const s = byKey.get(n.spouse);
      if (n.key > s.key && s.spouse === n.key) return; // 二重に描かない
      gLink.append("line").attr("x1", n.x).attr("y1", n.y).attr("x2", s.x).attr("y2", s.y)
        .attr("stroke", "#e0a526").attr("stroke-width", 2).attr("stroke-dasharray", "2 3");
    });
    // 親子線(親が2人なら中点から)
    nodes.filter((n) => (n.parents || []).length).forEach((n) => {
      const ps = n.parents.map((p) => byKey.get(p)).filter(Boolean);
      const px = d3.mean(ps, (p) => p.x), py = d3.max(ps, (p) => p.y) + 24, my = (py + n.y - 24) / 2;
      gLink.append("path").attr("d", `M${px},${py} V${my} H${n.x} V${n.y - 24}`)
        .attr("fill", "none").attr("stroke", "var(--line-strong)").attr("stroke-width", 1.6)
        .attr("stroke-dasharray", /義|養|クローン|示唆/.test(n.note || "") ? "5 4" : null);
    });
    // 義兄弟: 家系内に親がいない場合、同じ世代の血縁者と点線の弧で結ぶ
    nodes.filter((n) => /義兄弟/.test(n.note || "") && !(n.parents || []).some((p) => byKey.has(p))).forEach((n) => {
      const kin = nodes.filter((m) => m.gen === n.gen && !/義兄弟/.test(m.note || "")).sort((a, b) => Math.abs(a.x - n.x) - Math.abs(b.x - n.x))[0];
      if (!kin) return;
      const mx = (n.x + kin.x) / 2, top = n.y - 24 - Math.min(40, Math.abs(n.x - kin.x) / 4);
      gLink.append("path").attr("d", `M${kin.x},${kin.y - 24} Q${mx},${top - 20} ${n.x},${n.y - 24}`)
        .attr("fill", "none").attr("stroke", "#e0a526").attr("stroke-width", 1.6).attr("stroke-dasharray", "4 4");
    });
    const g = gZoom.append("g").selectAll("g").data(nodes).enter().append("g")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .attr("class", (d) => "fam-node" + (d.char ? " is-char" : "") + (d.char && d.char === selChar ? " sel" : ""))
      .style("cursor", (d) => (d.char ? "pointer" : "default"))
      .on("click", (ev, d) => { if (d.char) OP.open(d.char); });
    g.append("circle").attr("r", 22)
      .attr("fill", (d) => (d.char ? OP.charColor(OP.get(d.char).e, null) : "var(--surface-2)"))
      .attr("stroke", (d) => (d.char ? "var(--surface)" : "var(--line-strong)"))
      .attr("stroke-width", 2).attr("stroke-dasharray", (d) => (d.char ? null : "3 3"));
    g.append("text").attr("text-anchor", "middle").attr("dy", ".36em")
      .style("font-family", "var(--display)").style("font-size", "18px")
      .style("fill", (d) => (d.char ? "#fff" : "var(--muted)"))
      .text((d) => OP.initial(d.char ? OP.get(d.char).e.name : d.name));
    g.append("text").attr("class", "fam-name").attr("text-anchor", "middle").attr("y", 40)
      .text((d) => (d.char ? OP.get(d.char).e.name : d.name).split("・").pop());
    g.filter((d) => d.note).append("text").attr("class", "fam-note").attr("text-anchor", "middle").attr("y", 55).text((d) => d.note);
    g.append("title").text((d) => (d.char ? OP.get(d.char).e.name : d.name) + (d.note ? `(${d.note})` : ""));
    fit(nodes);
  }

  function fit(nodes) {
    const st = el.querySelector(".stage");
    const w = st.clientWidth, h = st.clientHeight;
    const x0 = d3.min(nodes, (n) => n.x) - 80, x1 = d3.max(nodes, (n) => n.x) + 80;
    const y0 = d3.min(nodes, (n) => n.y) - 50, y1 = d3.max(nodes, (n) => n.y) + 80;
    const k = Math.min(1.3, w / (x1 - x0), h / (y1 - y0));
    svg.call(zoom.transform, d3.zoomIdentity.translate(w / 2 - ((x0 + x1) / 2) * k, h / 2 - ((y0 + y1) / 2) * k).scale(k));
  }

  function select(id) {
    famId = id;
    el.querySelectorAll("[data-fam]").forEach((b) => b.classList.toggle("active", b.dataset.fam === id));
    draw();
  }

  OP.views.family = {
    nav: "graph",
    mount(root) {
      el = root;
      el.innerHTML = `<div class="wrap">
        ${OP.subtabs("family", [["graph", "ネットワーク"], ["family", "家系図"]])}
        <div class="view-head"><h1>家系図</h1><p>上が古い世代です。点線の円は図鑑に個別項目のない人物です。点線のつながりは、義兄弟・養子・作中で示唆されただけの関係を表します(金色の点線は配偶者・義兄弟)。</p></div>
        <div class="toolbar"><div class="tabs">${OP.families.map((f) => `<button data-fam="${f.id}">${esc(f.name)}</button>`).join("")}</div></div>
        <p class="muted fam-desc" style="margin:0 0 10px;font-size:14px"></p>
        <div class="stage"><svg aria-label="家系図"></svg><div class="stage-hint">人物をクリックで詳細。ドラッグで移動、ホイールで拡大</div></div>
      </div>`;
      svg = d3.select(el.querySelector("svg"));
      gZoom = svg.append("g");
      zoom = d3.zoom().scaleExtent([.3, 3]).on("zoom", (ev) => gZoom.attr("transform", ev.transform));
      svg.call(zoom).on("dblclick.zoom", null);
      el.querySelector(".tabs").addEventListener("click", (ev) => { const b = ev.target.closest("[data-fam]"); if (b) select(b.dataset.fam); });
      if (OP.families.length) requestAnimationFrame(() => { if (!famId) select(OP.families[0].id); });
    },
    focus(id) {
      if (!id) { selChar = null; if (famId) draw(); return; }
      let [fam, ch] = id.includes("|") ? id.split("|") : [null, id];
      if (!fam && OP.get(ch) && OP.get(ch).type === "character") {
        const cur = OP.families.find((f) => f.id === famId);
        fam = cur && cur.members.some((m) => m.char === ch) ? famId : (OP.familiesOf(ch)[0] || {}).id;
      }
      selChar = ch;
      if (fam) requestAnimationFrame(() => select(fam));
    }
  };
})();
