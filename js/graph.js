// 人物相関図 (D3 force)
(function () {
  const esc = OP.esc;
  const state = { mode: "major", faction: "", arc: "", types: new Set(Object.keys(OP.REL)), extra: new Set(), sel: null, hops: 1 };
  let svg, gZoom, gLinks, gLabels, gNodes, zoom, sim, el, countEl;
  const pos = new Map(); // id -> {x, y} を再描画間で保持
  let curNodes = [], curLinks = [], k = 1, dirty = false;

  function factionOptions() {
    const out = [];
    const walk = (parent, depth) => OP.factions.filter((f) => (f.parent || "") === parent).forEach((f) => {
      out.push(`<option value="${f.id}">${"　".repeat(depth)}${esc(f.name)}</option>`);
      walk(f.id, depth + 1);
    });
    walk("", 0);
    return out.join("");
  }

  function visibleIds() {
    let pool = OP.characters;
    if (!state.faction && !state.arc && state.mode === "major") pool = pool.filter((c) => c.major);
    if (state.faction) {
      const fs = OP.factionDescendants(state.faction);
      pool = pool.filter((c) => (c.factions || []).concat(c.formerFactions || []).some((f) => fs.includes(f)));
    }
    if (state.arc) pool = pool.filter((c) => (c.arcs || []).includes(state.arc) || c.firstArc === state.arc);
    const ids = new Set(pool.map((c) => c.id));
    state.extra.forEach((id) => ids.add(id));
    // 物語の現在地より後に登場する人物は出さない
    ids.forEach((id) => { if (!OP.charVisibleAt(OP.get(id).e)) ids.delete(id); });
    return ids;
  }

  function build() {
    const ids = visibleIds();
    const links = OP.relations
      .filter((r) => ids.has(r.from) && ids.has(r.to) && state.types.has(r.type) && OP.relActive(r))
      .map((r) => ({ source: r.from, target: r.to, r }));
    const deg = new Map();
    links.forEach((l) => { deg.set(l.source, (deg.get(l.source) || 0) + 1); deg.set(l.target, (deg.get(l.target) || 0) + 1); });
    const w = el.querySelector(".stage").clientWidth, h = el.querySelector(".stage").clientHeight;
    const nodes = [...ids].map((id) => {
      const c = OP.get(id).e;
      const p = pos.get(id) || { x: w / 2 + (Math.random() - .5) * 200, y: h / 2 + (Math.random() - .5) * 200 };
      return { id, c, x: p.x, y: p.y, r: (c.major ? 15 : 10) + Math.min(9, (deg.get(id) || 0) * .5) };
    });
    curNodes = nodes; curLinks = links;
    countEl.textContent = `${nodes.length}人 / ${links.length}本の関係` + (OP.time != null ? `(${OP.timeLabel()}時点)` : "");

    if (sim) sim.stop();
    sim = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d) => d.id).distance((l) => (l.r.type === "crew" ? 60 : 90)).strength(.5))
      .force("charge", d3.forceManyBody().strength(nodes.length > 120 ? -160 : -260))
      .force("collide", d3.forceCollide().radius((d) => d.r + 8))
      .force("x", d3.forceX(w / 2).strength(.04))
      .force("y", d3.forceY(h / 2).strength(.05));

    const link = gLinks.selectAll("line").data(links, (d) => d.r.from + d.r.to + d.r.type + (d.r.since || ""));
    link.exit().remove();
    const linkAll = link.enter().append("line").attr("class", "g-link").merge(link)
      .attr("stroke", (d) => (OP.REL[d.r.type] || OP.REL.other).color)
      .attr("stroke-width", (d) => (d.r.type === "family" || d.r.type === "crew" ? 2.2 : 1.6))
      .attr("stroke-dasharray", (d) => ((OP.REL[d.r.type] || {}).dash ? "5 4" : null))
      .attr("stroke-opacity", .7);

    const node = gNodes.selectAll("g.g-node").data(nodes, (d) => d.id);
    node.exit().remove();
    const enter = node.enter().append("g").attr("class", "g-node");
    enter.append("circle");
    enter.append("text").attr("class", "ini").attr("text-anchor", "middle").attr("dy", ".35em");
    enter.append("text").attr("class", "lbl").attr("text-anchor", "middle");
    enter.append("title");
    enter.on("click", (ev, d) => { ev.stopPropagation(); OP.open(d.id); })
      .call(d3.drag()
        .on("start", (ev, d) => { if (!ev.active) sim.alphaTarget(.2).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag", (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
        .on("end", (ev, d) => { if (!ev.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));
    const nodeAll = enter.merge(node);
    nodeAll.select("circle").attr("r", (d) => d.r).attr("fill", (d) => OP.charColor(d.c));
    nodeAll.select(".ini").text((d) => OP.initial(d.c.name)).attr("font-size", (d) => d.r * .9);
    nodeAll.select(".lbl").text((d) => shortName(d.c.name)).attr("dy", (d) => d.r + 13);
    nodeAll.select("title").text((d) => d.c.name + (d.c.alias ? `(${d.c.alias})` : ""));

    sim.on("tick", () => {
      linkAll.attr("x1", (d) => d.source.x).attr("y1", (d) => d.source.y).attr("x2", (d) => d.target.x).attr("y2", (d) => d.target.y);
      nodeAll.attr("transform", (d) => `translate(${d.x},${d.y})`);
      gLabels.selectAll("text").attr("x", (d) => (d.source.x + d.target.x) / 2).attr("y", (d) => (d.source.y + d.target.y) / 2);
      nodes.forEach((n) => pos.set(n.id, { x: n.x, y: n.y }));
    });
    applyLabels();
    highlight();
  }

  const shortName = (n) => { const p = n.split("・"); return p.length > 2 ? p[p.length - 1] : n.length > 9 ? p[p.length - 1] : n; };
  function applyLabels() {
    const many = curNodes.length > 70;
    gNodes.selectAll("g.g-node .lbl").attr("display", (d) => (!many || d.c.major || k > 1.3 || d.id === state.sel ? null : "none"));
  }

  function neighborhood(id) {
    const set = new Set([id]);
    let frontier = [id];
    for (let h = 0; h < state.hops; h++) {
      const next = [];
      curLinks.forEach((l) => {
        const a = l.source.id || l.source, b = l.target.id || l.target;
        if (frontier.includes(a) && !set.has(b)) { set.add(b); next.push(b); }
        if (frontier.includes(b) && !set.has(a)) { set.add(a); next.push(a); }
      });
      frontier = next;
    }
    return set;
  }

  function highlight() {
    const id = state.sel;
    const nb = id ? neighborhood(id) : null;
    gNodes.selectAll("g.g-node").classed("dim", (d) => nb && !nb.has(d.id)).classed("sel", (d) => d.id === id);
    gLinks.selectAll("line").classed("dim", (d) => nb && !(nb.has(d.source.id) && nb.has(d.target.id) && (d.source.id === id || d.target.id === id || state.hops > 1)));
    const direct = id ? curLinks.filter((l) => l.source.id === id || l.target.id === id) : [];
    const lbl = gLabels.selectAll("text").data(direct, (d) => d.r.from + d.r.to + d.r.type + (d.r.since || ""));
    lbl.exit().remove();
    lbl.enter().append("text").attr("text-anchor", "middle").attr("class", "lbl")
      .style("font-size", "10px").style("fill", "var(--muted)").style("paint-order", "stroke").style("stroke", "var(--surface)").style("stroke-width", "3px")
      .merge(lbl).text((d) => d.r.label)
      .attr("x", (d) => (d.source.x + d.target.x) / 2).attr("y", (d) => (d.source.y + d.target.y) / 2);
    applyLabels();
  }

  function centerOn(id) {
    const n = curNodes.find((x) => x.id === id);
    if (!n) return;
    const st = el.querySelector(".stage");
    const kk = Math.max(k, 1.2);
    const go = () => svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity.translate(st.clientWidth / 2 - n.x * kk, st.clientHeight / 2 - n.y * kk).scale(kk));
    setTimeout(go, curNodes.length && sim.alpha() > .3 ? 500 : 0);
  }

  function syncControls() {
    el.querySelector("#g-fac").value = state.faction;
    el.querySelector("#g-arc").value = state.arc;
    el.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === state.mode)));
  }

  OP.views.graph = {
    mount(root) {
      el = root;
      const relBtns = Object.entries(OP.REL).map(([t, v]) =>
        `<button class="toggle" data-type="${t}" aria-pressed="true"><span class="swatch${v.dash ? " dash" : ""}" style="--c:${v.color}"></span>${v.label}</button>`).join("");
      const arcOpts = OP.arcs.map((a) => `<option value="${a.id}">${esc(a.name)}</option>`).join("");
      el.innerHTML = `<div class="wrap">
        ${OP.subtabs("graph", [["graph", "ネットワーク"], ["family", "家系図"]])}
        <div class="view-head"><h1>人物相関図</h1><p>人物をクリックすると、その人の関係だけが浮かび上がります。「物語の現在地」を動かすと、その時点で読者が知っている関係だけが表示され、所属の色も当時のものに変わります。</p></div>
        <div class="toolbar">${OP.timeSlider()}</div>
        <div class="toolbar">
          <button class="toggle" data-mode="major" aria-pressed="true">主要人物</button>
          <button class="toggle" data-mode="all" aria-pressed="false">全員</button>
          <label for="g-fac">勢力</label><select id="g-fac"><option value="">すべて</option>${factionOptions()}</select>
          <label for="g-arc">編</label><select id="g-arc"><option value="">すべて</option>${arcOpts}</select>
          <label for="g-hop">範囲</label><select id="g-hop"><option value="1">直接の関係</option><option value="2">2段階先まで</option></select>
          <button class="btn" id="g-reset">リセット</button>
          <span class="muted" id="g-count" style="font-size:13px"></span>
        </div>
        <div class="toolbar">${relBtns}</div>
        <div class="stage"><svg aria-label="人物相関図"></svg><div class="stage-hint">背景クリックで選択解除</div></div>
      </div>`;
      countEl = el.querySelector("#g-count");
      svg = d3.select(el.querySelector("svg"));
      gZoom = svg.append("g");
      gLinks = gZoom.append("g"); gLabels = gZoom.append("g"); gNodes = gZoom.append("g");
      zoom = d3.zoom().scaleExtent([.2, 4]).on("zoom", (ev) => { k = ev.transform.k; gZoom.attr("transform", ev.transform); applyLabels(); });
      svg.call(zoom).on("dblclick.zoom", null);
      svg.on("click", () => { if (state.sel) OP.go("graph"); });

      el.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => { state.mode = b.dataset.mode; state.extra.clear(); syncControls(); build(); }));
      el.querySelectorAll("[data-type]").forEach((b) => b.addEventListener("click", () => {
        const t = b.dataset.type;
        state.types.has(t) ? state.types.delete(t) : state.types.add(t);
        b.setAttribute("aria-pressed", String(state.types.has(t)));
        build();
      }));
      el.querySelector("#g-fac").addEventListener("change", (e) => { state.faction = e.target.value; state.extra.clear(); build(); });
      el.querySelector("#g-arc").addEventListener("change", (e) => { state.arc = e.target.value; state.extra.clear(); build(); });
      el.querySelector("#g-hop").addEventListener("change", (e) => { state.hops = +e.target.value; highlight(); });
      el.querySelector("#g-reset").addEventListener("click", () => {
        Object.assign(state, { mode: "major", faction: "", arc: "", sel: null }); state.extra.clear();
        state.types = new Set(Object.keys(OP.REL));
        el.querySelectorAll("[data-type]").forEach((b) => b.setAttribute("aria-pressed", "true"));
        syncControls(); build(); svg.transition().call(zoom.transform, d3.zoomIdentity); OP.go("graph");
      });
      window.addEventListener("op-time", () => { if (el.isConnected && OP.current() === "graph") build(); else dirty = true; });
      requestAnimationFrame(build);
    },
    show() { if (dirty) { dirty = false; build(); } },
    focus(id) {
      if (id && id.startsWith("arc:")) { // 編から来たときはその編の登場人物と時点に合わせる
        state.arc = id.slice(4); state.faction = ""; state.extra.clear(); state.sel = null;
        syncControls(); OP.setTime(OP.arcOrder(state.arc)); return;
      }
      if (id && id.startsWith("fac:")) {
        state.faction = id.slice(4); state.arc = ""; state.extra.clear(); state.sel = null;
        syncControls(); build(); return;
      }
      if (id && OP.get(id) && OP.get(id).type !== "character") id = null; // 人物以外は図に影響させない
      state.sel = id;
      // 選んだ人物の直接の関係者は、フィルタ外でも図に加える
      const need = id ? [id, ...OP.relsOf(id).map((r) => (r.from === id ? r.to : r.from))] : [];
      if (need.some((x) => !curNodes.some((n) => n.id === x))) {
        state.extra = new Set(need);
        build();
      } else highlight();
      if (id) centerOn(id);
    }
  };
})();
