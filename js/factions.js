// 勢力図: 円充填(入れ子構造とメンバー数) + 階層ツリー
(function () {
  const esc = OP.esc;
  const S = 800;
  let el, svg, gZoom, zoom, k = 1, root, selId = null, dirty = false;
  const TABS = [["factions", "組織の入れ子"], ["pyramid", "ピラミッド"], ["seats", "役職の変遷"]];

  function hierarchy() {
    const make = (f) => {
      const kids = OP.factionChildren(f.id).map(make);
      const members = OP.characters.filter((c) => OP.charVisibleAt(c) && OP.factionsAt(c)[0] === f.id).map((c) => ({ id: c.id, char: c }));
      return { id: f.id, fac: f, children: kids.concat(members) };
    };
    return { id: "root", children: OP.factions.filter((f) => !f.parent).map(make) };
  }
  const countMembers = (id) => {
    const ds = OP.factionDescendants(id);
    return OP.characters.filter((c) => (c.factions || []).some((x) => ds.includes(x))).length;
  };

  function tree() {
    const walk = (parent) => {
      const fs = OP.factions.filter((f) => (f.parent || "") === parent);
      if (!fs.length) return "";
      return `<ul>${fs.map((f) => `<li><a data-fac="${f.id}"><span class="dot" style="--c:${OP.factionColor(f.id)}"></span>${esc(f.name)} <span class="count">${countMembers(f.id)}</span></a>${walk(f.id)}</li>`).join("")}</ul>`;
    };
    return walk("");
  }

  function draw() {
    gZoom.selectAll("*").remove();
    root = d3.pack().size([S, S]).padding((d) => (d.depth === 0 ? 14 : 5))(
      d3.hierarchy(hierarchy()).sum((d) => (d.char ? 1 : d.children && d.children.length ? 0 : .6)).sort((a, b) => b.value - a.value)
    );
    const nodes = root.descendants().slice(1);
    const g = gZoom.selectAll("g.pk").data(nodes, (d) => d.data.id).enter().append("g").attr("class", "pk")
      .attr("transform", (d) => `translate(${d.x},${d.y})`).style("cursor", "pointer")
      .on("click", (ev, d) => { ev.stopPropagation(); OP.open(d.data.id); });
    g.append("circle").attr("r", (d) => d.r)
      .attr("fill", (d) => (d.data.char ? OP.factionColor(d.parent.data.id) : OP.factionColor(d.data.id)))
      .attr("fill-opacity", (d) => (d.data.char ? .95 : d.data.fac.kind === "category" ? .07 : .16))
      .attr("stroke", (d) => (d.data.char ? "none" : OP.factionColor(d.data.id)))
      .attr("stroke-opacity", .6);
    g.append("title").text((d) => (d.data.char ? d.data.char.name : `${d.data.fac.name}(${countMembers(d.data.id)}人)`));
    g.filter((d) => d.data.char).append("text").attr("class", "ini").attr("text-anchor", "middle").attr("dy", ".35em")
      .style("fill", "#fff").style("font-family", "var(--display)").style("pointer-events", "none")
      .attr("font-size", (d) => d.r * .95).text((d) => OP.initial(d.data.char.name));
    g.filter((d) => d.data.char).append("text").attr("class", "pk-name").attr("text-anchor", "middle")
      .style("fill", "var(--ink)").style("font-weight", 700).style("pointer-events", "none").style("paint-order", "stroke").style("stroke", "var(--surface)")
      .text((d) => OP.short(d.data.char.name));
    // 勢力名ラベル(円の上端)
    gZoom.selectAll("text.pack-label").data(nodes.filter((d) => !d.data.char), (d) => d.data.id).enter().append("text")
      .attr("class", "pack-label").attr("x", (d) => d.x).attr("y", (d) => d.y - d.r + 12).text((d) => d.data.fac.name);
    labels();
  }

  function labels() {
    gZoom.selectAll("text.pack-label")
      .attr("display", (d) => (d.r * k > 38 ? null : "none"))
      .style("font-size", `${12 / k}px`).style("stroke-width", `${3 / k}px`)
      .attr("y", (d) => d.y - d.r + 13 / k);
    gZoom.selectAll("g.pk text.ini").attr("display", (d) => (d.r * k > 6 ? null : "none"));
    gZoom.selectAll("g.pk text.pk-name").attr("display", (d) => (d.r * k > 20 ? null : "none"))
      .style("font-size", `${11 / k}px`).style("stroke-width", `${3 / k}px`).attr("y", (d) => d.r + 11 / k);
  }

  function focusNode(id) {
    const n = root && root.descendants().find((d) => d.data.id === id);
    gZoom.selectAll("g.pk circle").attr("stroke-width", (d) => (d.data.id === id ? 3 / k : 1 / k)).attr("stroke", (d) => (d.data.id === id ? "var(--accent)" : d.data.char ? "none" : OP.factionColor(d.data.id)));
    el.querySelectorAll(".fac-tree a").forEach((a) => a.classList.toggle("sel", a.dataset.fac === id));
    if (!n) return;
    const target = n.data.char ? n.parent : n;
    const kk = Math.min(12, S / (target.r * 2.2));
    svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity.translate(S / 2 - target.x * kk, S / 2 - target.y * kk).scale(kk));
    const a = el.querySelector(`.fac-tree a[data-fac="${id}"]`);
    if (a) a.scrollIntoView({ block: "nearest" });
  }

  OP.views.factions = {
    mount(r) {
      el = r;
      el.innerHTML = `<div class="wrap">
        ${OP.subtabs("factions", TABS)}
        <div class="view-head"><h1>勢力図</h1><p>円の入れ子が組織の上下関係、小さな丸がメンバーです。円をクリックするとその組織に寄り、詳細が開きます。「物語の現在地」を動かすと、その時点の所属で並び替わります。</p></div>
        <div class="toolbar">${OP.timeSlider()}</div>
        <div class="fac-layout">
          <div class="stage"><svg viewBox="0 0 ${S} ${S}" preserveAspectRatio="xMidYMid meet" aria-label="勢力の円充填図"></svg><div class="stage-hint">背景クリックで全体表示</div></div>
          <div class="card fac-tree">${tree()}</div>
        </div>
      </div>`;
      svg = d3.select(el.querySelector("svg"));
      gZoom = svg.append("g");
      zoom = d3.zoom().scaleExtent([1, 14]).on("zoom", (ev) => { k = ev.transform.k; gZoom.attr("transform", ev.transform); labels(); });
      svg.call(zoom).on("dblclick.zoom", null);
      svg.on("click", () => { OP.go("factions"); svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity); });
      el.querySelector(".fac-tree").addEventListener("click", (ev) => { const a = ev.target.closest("[data-fac]"); if (a) OP.open(a.dataset.fac); });
      draw();
      window.addEventListener("op-time", () => { if (OP.current() === "factions") { draw(); focusNode(selId); } else dirty = true; });
    },
    show() { if (dirty) { dirty = false; draw(); } },
    focus(id) {
      selId = id;
      if (id && OP.get(id) && ["faction", "character"].includes(OP.get(id).type)) focusNode(id);
      else focusNode(null);
    }
  };

  // ---- ピラミッド: 海賊は懸賞金、世界政府は役職で階層化(強さの序列ではない) ----
  const PIRATE_TIERS = [[3e9, "30億〜"], [1e9, "10億〜"], [5e8, "5億〜"], [1e8, "1億〜"], [0, "1億未満"]];
  const GOV_TIERS = [["imu", "最高権力者"], ["elder", "五老星"], ["knight", "神の騎士団"], ["fleet-admiral", "元帥"], ["admiral", "大将"], ["vice-admiral", "中将"], ["officer|agent", "海兵・諜報員"]];
  function pyramidHtml(title, note, tiers) {
    const n = tiers.length;
    return `<div class="pyr"><h2>${title}</h2><p class="muted">${note}</p>${tiers.map(([label, chars], i) => `
      <div class="tier" style="--w:${48 + (52 * i) / Math.max(1, n - 1)}%">
        <div class="tier-label">${esc(label)} <span class="count">${chars.length}</span></div>
        <div class="tier-body">${chars.map((c) => `<a class="chip" data-open="${c.id}" href="#" title="${esc(c.name)}">${OP.avatar(c.id)}${esc(OP.short(c.name))}</a>`).join("") || '<span class="muted" style="font-size:12px">該当なし</span>'}</div>
      </div>`).join("")}</div>`;
  }
  let pyrEl;
  function renderPyramid() {
    const piratesF = OP.factionDescendants("pirates");
    const pirates = OP.characters.filter((c) => OP.charVisibleAt(c) && OP.factionsAt(c).some((f) => piratesF.includes(f)))
      .map((c) => ({ c, b: OP.bountyAt(c) })).filter((x) => x.b != null).sort((a, b) => b.b - a.b);
    const pt = PIRATE_TIERS.map(([min, label], i) => [label, pirates.filter((x) => x.b >= min && (i === 0 || x.b < PIRATE_TIERS[i - 1][0])).map((x) => x.c)]);
    const gov = OP.characters.filter((c) => c.rank && OP.charVisibleAt(c));
    const gt = GOV_TIERS.map(([r, label]) => [label, gov.filter((c) => r.split("|").includes(c.rank))]);
    pyrEl.innerHTML = pyramidHtml("海賊", "判明している懸賞金額で階層化。懸賞金不明の人物は含みません。", pt) +
      pyramidHtml("世界政府", "役職の上下で階層化。", gt);
  }
  OP.views.pyramid = {
    nav: "factions",
    mount(r) {
      r.innerHTML = `<div class="wrap">
        ${OP.subtabs("pyramid", TABS)}
        <div class="view-head"><h1>二つのピラミッド</h1><p>海賊は懸賞金、世界政府は役職で並べた権力構造の図です。作中に公式の「強さランキング」はないため、強さの序列ではありません。「物語の現在地」を動かすと、その時点で判明していた懸賞金に変わります。</p></div>
        <div class="toolbar">${OP.timeSlider()}</div>
        <div class="pyr-wrap"></div>
      </div>`;
      pyrEl = r.querySelector(".pyr-wrap");
      renderPyramid();
      window.addEventListener("op-time", () => pyrEl && renderPyramid());
    }
  };

  // ---- 役職の変遷: 編を横軸にした席表 ----
  let seatsEl;
  function renderSeats() {
    const COL = 26, LW = 150, RH = 26, HEAD = 46;
    const cols = OP.arcs.length + 1; // 先頭列 = 物語開始前
    const W = LW + cols * COL + 10;
    const rows = [];
    OP.positions.forEach((p) => {
      rows.push({ head: p });
      (p.holders || []).slice().sort((a, b) => (a.since ? OP.arcOrder(a.since) : 0) - (b.since ? OP.arcOrder(b.since) : 0)).forEach((h) => rows.push({ h, p }));
    });
    const H = HEAD + rows.length * RH + 10;
    const x = (order) => LW + order * COL; // order 0 = 開始前
    let out = `<svg class="seats" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="役職の変遷">`;
    // サーガの帯
    d3.groups(OP.arcs, (a) => a.saga).forEach(([saga, arcs], i) => {
      const x0 = x(arcs[0].order), x1 = x(arcs[arcs.length - 1].order + 1);
      out += `<rect x="${x0}" y="0" width="${x1 - x0}" height="${H}" fill="${i % 2 ? "var(--surface-2)" : "transparent"}"/>
        ${OP.fitLabel(OP.stripArc(saga), x1 - x0, 10) ? `<text x="${(x0 + x1) / 2}" y="16" text-anchor="middle" class="seat-saga">${esc(OP.fitLabel(OP.stripArc(saga), x1 - x0, 10))}</text>` : ""}`;
    });
    out += `<text x="${x(0) + COL / 2}" y="16" text-anchor="middle" class="seat-saga">以前</text>`;
    OP.arcs.forEach((a) => { out += `<rect x="${x(a.order)}" y="24" width="${COL - 2}" height="14" rx="2" fill="var(--line)"><title>${esc(a.name)}</title></rect>`; });
    if (OP.time != null) out += `<line x1="${x(OP.time) + COL / 2}" x2="${x(OP.time) + COL / 2}" y1="22" y2="${H}" stroke="var(--accent)" stroke-width="2"/>`;
    rows.forEach((r, i) => {
      const y = HEAD + i * RH;
      if (r.head) { out += `<text x="4" y="${y + 18}" class="seat-head">${esc(r.head.name)}</text><line x1="0" x2="${W}" y1="${y + 2}" y2="${y + 2}" stroke="var(--line-strong)"/>`; return; }
      const c = OP.get(r.h.char).e;
      const s = r.h.since ? OP.arcOrder(r.h.since) : 0, e = r.h.until ? OP.arcOrder(r.h.until) : OP.arcs.length;
      const active = OP.time == null || (s <= OP.time && e >= OP.time);
      out += `<g class="seat-row${active ? "" : " dim"}" data-open="${c.id}" style="cursor:pointer">
        <text x="14" y="${y + 17}" class="seat-name">${esc(OP.short(c.name))}</text>
        <rect x="${x(s) + 1}" y="${y + 5}" width="${Math.max(COL - 2, x(e + 1) - x(s) - 2)}" height="${RH - 10}" rx="4" fill="${OP.charColor(c, null)}"><title>${esc(c.name)}: ${esc(r.p.name)} ${esc(OP.periodLabel(r.h.since, r.h.until) || OP.t("物語開始前〜"))}${r.h.note ? "(" + esc(r.h.note) + ")" : ""}</title></rect>
      </g>`;
    });
    seatsEl.innerHTML = out + "</svg>";
  }
  OP.views.seats = {
    nav: "factions",
    mount(r) {
      r.innerHTML = `<div class="wrap">
        ${OP.subtabs("seats", TABS)}
        <div class="view-head"><h1>役職の変遷</h1><p>四皇・王下七武海・海軍大将などの顔ぶれが、どの編で入れ替わったかを示します。横軸は編(読者が知った順)、左端は物語開始前からの在任です。</p></div>
        <div class="toolbar">${OP.timeSlider()}</div>
        <div class="card seats-scroll"></div>
      </div>`;
      seatsEl = r.querySelector(".seats-scroll");
      renderSeats();
      window.addEventListener("op-time", () => seatsEl && renderSeats());
    }
  };
})();
