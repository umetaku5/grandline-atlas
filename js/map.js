// 世界地図: 平面の模式図 (viewBox 0 0 1200 700) と 地球儀 (正射図法) の切替
(function () {
  const esc = OP.esc;
  const W = 1200, H = 700, G = 700;
  const SEA_COLOR = { "east-blue": "#2f80ed", "west-blue": "#16a085", "north-blue": "#5b6fa8", "south-blue": "#e67e22", paradise: "#d4ac0d", "new-world": "#d63a24", "red-line": "#8e1b1b", "calm-belt": "#7f8c8d", sky: "#7fb3d5", undersea: "#1abc9c", other: "#95a5a6" };
  const SEA_LABELS = [["NORTH BLUE", "北の海", 300, 150], ["EAST BLUE", "東の海", 300, 560], ["WEST BLUE", "西の海", 900, 150], ["SOUTH BLUE", "南の海", 900, 560]];
  let el, svg, gZoom, zoom, caption, playing = null, arcFilter = "", mode = "flat", selId = null, shipAt = null;
  const route = () => OP.places.filter((p) => p.route != null).sort((a, b) => a.route - b.route);
  // その場所が物語の現在地までに登場しているか
  const reached = (p) => OP.time == null || !(p.arcs || []).length || Math.min(...p.arcs.map(OP.arcOrder)) <= OP.time;
  const isDim = (p) => (arcFilter && !(p.arcs || []).includes(arcFilter)) || !reached(p);

  // ========== 平面 ==========
  function baseMap(g) {
    const defs = svg.append("defs");
    defs.append("pattern").attr("id", "calm-hatch").attr("width", 8).attr("height", 8).attr("patternUnits", "userSpaceOnUse").attr("patternTransform", "rotate(45)")
      .append("rect").attr("width", 2).attr("height", 8).attr("fill", "var(--sea-ink)").attr("opacity", .45);
    g.append("rect").attr("class", "m-sea").attr("width", W).attr("height", H);
    for (let x = 0; x <= W; x += 50) g.append("line").attr("class", "m-grid").attr("x1", x).attr("x2", x).attr("y1", 0).attr("y2", H);
    for (let y = 0; y <= H; y += 50) g.append("line").attr("class", "m-grid").attr("x1", 0).attr("x2", W).attr("y1", y).attr("y2", y);
    SEA_LABELS.forEach(([en, ja, x, y]) => {
      g.append("text").attr("class", "m-sealabel").attr("x", x).attr("y", y).attr("text-anchor", "middle").text(en);
      g.append("text").attr("class", "m-zone").attr("x", x).attr("y", y + 26).attr("text-anchor", "middle").text(ja);
    });
    g.append("rect").attr("class", "m-calm").attr("x", 0).attr("y", 290).attr("width", W).attr("height", 30);
    g.append("rect").attr("class", "m-calm").attr("x", 0).attr("y", 380).attr("width", W).attr("height", 30);
    g.append("rect").attr("class", "m-gl").attr("x", 0).attr("y", 320).attr("width", W).attr("height", 60);
    // レッドライン(中央と両端。両端は地球の裏側でつながっている)
    g.append("rect").attr("class", "m-red").attr("x", 585).attr("y", 0).attr("width", 30).attr("height", H);
    g.append("rect").attr("class", "m-red").attr("x", 0).attr("y", 0).attr("width", 15).attr("height", H);
    g.append("rect").attr("class", "m-red").attr("x", 1185).attr("y", 0).attr("width", 15).attr("height", H);
    g.append("text").attr("class", "m-zone").attr("transform", "translate(604,150) rotate(90)").attr("text-anchor", "middle").style("fill", "#fff").text("RED LINE 赤い土の大陸");
    g.append("text").attr("class", "m-zone").attr("x", 310).attr("y", 312).attr("text-anchor", "middle").text("偉大なる航路 前半「楽園」→");
    g.append("text").attr("class", "m-zone").attr("x", 900).attr("y", 312).attr("text-anchor", "middle").text("後半「新世界」→");
    g.append("text").attr("class", "m-zone").attr("x", 1100).attr("y", 300).attr("text-anchor", "middle").style("font-size", "11px").text("凪の帯");
    g.append("text").attr("class", "m-zone").attr("x", 1100).attr("y", 400).attr("text-anchor", "middle").style("font-size", "11px").text("凪の帯");
  }
  function drawPlaces(g) {
    g.append("path").attr("class", "m-route");
    const sel = g.append("g").selectAll("g").data(OP.places, (d) => d.id).enter().append("g")
      .attr("class", "m-place").attr("transform", (d) => `translate(${d.x},${d.y})`)
      .on("click", (ev, d) => { ev.stopPropagation(); OP.open(d.id); });
    sel.append("circle").attr("r", (d) => (d.route ? 5.5 : 4.2)).attr("fill", (d) => SEA_COLOR[d.sea] || "#999");
    sel.append("text").attr("y", -8).attr("text-anchor", "middle").text((d) => d.name);
    sel.append("title").text((d) => `${d.name} — ${OP.SEA[d.sea] || ""}`);
    g.append("path").attr("class", "m-ship").attr("d", "M-7 3 L7 3 L4 7 L-4 7 Z M0 -9 L0 3 M0 -9 L6 0 L0 0").attr("stroke", "var(--accent)").attr("stroke-width", 1.5).attr("display", "none");
  }
  function updateFlat() {
    const r = route().filter(reached);
    gZoom.select(".m-route").attr("d", r.length > 1 ? d3.line().curve(d3.curveCatmullRom.alpha(.5))(r.map((p) => [p.x, p.y])) : null);
    gZoom.selectAll(".m-place").classed("dim", isDim).classed("sel", (d) => d.id === selId);
  }
  // d3.zoom は viewBox 座標で動くので、そのまま中心を合わせる
  const zoomTo = (x, y, k) => svg.transition().duration(700).call(zoom.transform, d3.zoomIdentity.translate(W / 2 - x * k, H / 2 - y * k).scale(k));

  // ========== 地球儀 ==========
  // 模式図の座標を経緯度に: 中央のレッドラインが経度0、偉大なる航路が赤道
  const toLL = (x, y) => [(x / W) * 360 - 180, 90 - (y / H) * 180];
  const latOf = (y) => 90 - (y / H) * 180;
  let gsvg, proj, path, gGlobe, baseScale = 300;
  function band(lon0, lon1, lat0, lat1) {
    const ring = [];
    for (let l = lon0; l <= lon1; l += 2) ring.push([l, lat1]);
    ring.push([lon1, lat1]);
    for (let l = lon1; l >= lon0; l -= 2) ring.push([l, lat0]);
    ring.push([lon0, lat0], ring[0]);
    const f = { type: "Polygon", coordinates: [ring] };
    if (d3.geoArea(f) > 2 * Math.PI) ring.reverse(); // 巻き方向が逆なら補集合になるので反転
    return f;
  }
  const quarters = (lat0, lat1) => [-180, -90, 0, 90].map((l) => band(l, l + 90, lat0, lat1));
  function mountGlobe(stage) {
    gsvg = d3.select(stage).append("svg").attr("class", "globe").attr("viewBox", `0 0 ${G} ${G}`).attr("preserveAspectRatio", "xMidYMid meet").attr("aria-label", "地球儀").style("display", "none");
    proj = d3.geoOrthographic().scale(baseScale).translate([G / 2, G / 2]).clipAngle(90).rotate([95, -12]);
    path = d3.geoPath(proj);
    gGlobe = gsvg.append("g");
    gGlobe.append("path").datum({ type: "Sphere" }).attr("class", "gl-sphere");
    gGlobe.append("path").datum(d3.geoGraticule10()).attr("class", "gl-grat");
    const feats = [
      ...quarters(latOf(320), latOf(290)).map((f) => ["gl-calm", f]), ...quarters(latOf(410), latOf(380)).map((f) => ["gl-calm", f]),
      ...quarters(latOf(380), latOf(320)).map((f) => ["gl-gl", f]),
      ["gl-red", band(-4.5, 4.5, -89, 89)], ["gl-red", band(175.5, 180, -89, 89)], ["gl-red", band(-180, -175.5, -89, 89)]
    ];
    gGlobe.selectAll("path.band").data(feats).enter().append("path").attr("class", (d) => "band " + d[0]);
    gGlobe.append("path").attr("class", "gl-route");
    gGlobe.selectAll("text.gl-sea").data(SEA_LABELS).enter().append("text").attr("class", "gl-sea").attr("text-anchor", "middle").text((d) => d[1]);
    const pl = gGlobe.selectAll("g.m-place").data(OP.places, (d) => d.id).enter().append("g").attr("class", "m-place")
      .on("click", (ev, d) => { ev.stopPropagation(); OP.open(d.id); });
    pl.append("circle").attr("r", (d) => (d.route ? 5 : 4)).attr("fill", (d) => SEA_COLOR[d.sea] || "#999");
    pl.append("text").attr("y", -8).attr("text-anchor", "middle").text((d) => d.name);
    pl.append("title").text((d) => d.name);
    gGlobe.append("text").attr("class", "m-ship-g").attr("text-anchor", "middle").text("⛵").attr("display", "none");
    // ドラッグで回転、ホイールで拡大
    let start;
    gsvg.call(d3.drag()
      .on("start", (ev) => { start = { x: ev.x, y: ev.y, r: proj.rotate() }; })
      .on("drag", (ev) => {
        const s = 70 / proj.scale();
        proj.rotate([start.r[0] + (ev.x - start.x) * s, Math.max(-80, Math.min(80, start.r[1] - (ev.y - start.y) * s))]);
        renderGlobe();
      }));
    gsvg.on("wheel", (ev) => { ev.preventDefault(); proj.scale(Math.max(220, Math.min(1600, proj.scale() * (ev.deltaY < 0 ? 1.12 : 0.89)))); renderGlobe(); }, { passive: false });
    gsvg.on("click", (ev) => { if (ev.defaultPrevented) return; });
  }
  function renderGlobe() {
    if (!gsvg) return;
    const center = [-proj.rotate()[0], -proj.rotate()[1]];
    const visible = (ll) => d3.geoDistance(ll, center) < Math.PI / 2 - 0.02;
    gGlobe.select(".gl-sphere").attr("d", path);
    gGlobe.select(".gl-grat").attr("d", path);
    gGlobe.selectAll("path.band").attr("d", (d) => path(d[1]));
    const r = route().filter(reached);
    gGlobe.select(".gl-route").attr("d", r.length > 1 ? path({ type: "LineString", coordinates: r.map((p) => toLL(p.x, p.y)) }) : null);
    gGlobe.selectAll("text.gl-sea").each(function (d) {
      const ll = toLL(d[2], d[3]);
      const p = proj(ll);
      d3.select(this).attr("x", p[0]).attr("y", p[1]).attr("display", visible(ll) ? null : "none");
    });
    const showAll = proj.scale() > 520;
    gGlobe.selectAll("g.m-place").each(function (d) {
      const ll = toLL(d.x, d.y), p = proj(ll);
      const g = d3.select(this).attr("transform", `translate(${p[0]},${p[1]})`).attr("display", visible(ll) ? null : "none");
      g.classed("dim", isDim(d)).classed("sel", d.id === selId);
      g.select("text").attr("display", d.route || showAll || d.id === selId ? null : "none");
    });
    const ship = gGlobe.select(".m-ship-g");
    if (shipAt) { const ll = toLL(shipAt.x, shipAt.y), p = proj(ll); ship.attr("x", p[0]).attr("y", p[1] - 12).attr("display", visible(ll) ? null : "none"); }
    else ship.attr("display", "none");
  }
  function rotateTo(x, y, scale) {
    const [lon, lat] = toLL(x, y);
    const r0 = proj.rotate(), s0 = proj.scale();
    let target = -lon;
    while (target - r0[0] > 180) target -= 360; // 近い向きに回す
    while (target - r0[0] < -180) target += 360;
    const ir = d3.interpolate([r0[0], r0[1]], [target, -lat * 0.8]);
    const is = d3.interpolate(s0, scale || s0);
    gsvg.transition().duration(900).tween("rotate", () => (t) => { proj.rotate(ir(t)).scale(is(t)); renderGlobe(); });
  }

  // ========== 共通 ==========
  function update() { updateFlat(); renderGlobe(); }
  function focusPoint(x, y, k) { if (mode === "flat") zoomTo(x, y, k); else rotateTo(x, y, baseScale * Math.max(1.4, k * 0.8)); }
  function setMode(m) {
    mode = m;
    svg.style("display", m === "flat" ? null : "none");
    gsvg.style("display", m === "globe" ? null : "none");
    el.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === m)));
    el.querySelector(".map-note").textContent = m === "flat"
      ? "平面の模式図です。左から右へ進むほど物語も進みます。左右の端はレッドラインで、地球の裏側でつながっています。"
      : "地球儀にすると、レッドラインと偉大なる航路が直角に交わる2本の大円で、世界が4つの海に分かれていることがわかります。ドラッグで回転、ホイールで拡大。";
    renderGlobe();
  }
  function stopRoute() {
    if (playing) clearTimeout(playing);
    playing = null;
    shipAt = null;
    caption.hidden = true;
    gZoom.select(".m-ship").attr("display", "none");
    renderGlobe();
    el.querySelector("#m-play").textContent = "▶ 麦わらの一味の航路を再生";
  }
  function playRoute() {
    if (playing) return stopRoute();
    const r = route().filter(reached);
    if (!r.length) return;
    el.querySelector("#m-play").textContent = "■ 停止";
    const ship = gZoom.select(".m-ship").attr("display", null);
    let i = 0;
    const step = () => {
      const p = r[i];
      shipAt = p;
      ship.transition().duration(700).attr("transform", `translate(${p.x},${p.y - 14})`);
      selId = p.id;
      focusPoint(p.x, p.y, 2.2);
      update();
      const arcs = (p.arcs || []).map((a) => OP.arc(a) && OP.arc(a).name).filter(Boolean).join("・");
      caption.hidden = false;
      caption.innerHTML = `<b>${p.route}. ${esc(p.name)}</b> <span class="muted">${esc(arcs)}</span><br><span style="font-size:13px">${esc(p.desc)}</span> <a href="#" data-open="${p.id}">詳しく</a>`;
      i++;
      playing = i < r.length ? setTimeout(step, 3200) : setTimeout(() => { stopRoute(); if (mode === "flat") svg.transition().duration(700).call(zoom.transform, d3.zoomIdentity); }, 4000);
    };
    step();
  }
  function filterArc(id) {
    arcFilter = id;
    el.querySelector("#m-arc").value = id;
    update();
    const ps = OP.places.filter((p) => (p.arcs || []).includes(id));
    if (ps.length) focusPoint(d3.mean(ps, (p) => p.x), d3.mean(ps, (p) => p.y), ps.length > 3 ? 1.5 : 2.5);
  }

  OP.views.map = {
    mount(root) {
      el = root;
      const arcOpts = OP.arcs.map((a) => `<option value="${a.id}">${esc(a.name)}</option>`).join("");
      const legend = Object.entries(SEA_COLOR).filter(([s]) => OP.places.some((p) => p.sea === s))
        .map(([s, c]) => `<span><span class="dot" style="--c:${c}"></span>${esc(OP.SEA[s])}</span>`).join("");
      el.innerHTML = `<div class="wrap">
        <div class="view-head"><h1>世界地図</h1><p class="map-note"></p></div>
        <div class="toolbar">
          <button class="toggle" data-mode="flat" aria-pressed="true">平面</button>
          <button class="toggle" data-mode="globe" aria-pressed="false">地球儀</button>
          <button class="btn primary" id="m-play">▶ 麦わらの一味の航路を再生</button>
          <label for="m-arc">編で絞る</label><select id="m-arc"><option value="">すべて</option>${arcOpts}</select>
          <button class="btn" id="m-reset">全体表示</button>
        </div>
        <div class="toolbar">${OP.timeSlider()}</div>
        <div class="stage"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-label="世界地図"></svg><div class="route-caption" hidden></div><div class="stage-hint">島をクリックで詳細</div></div>
        <div class="legend">${legend}<span><span class="swatch dash" style="--c:var(--accent)"></span>麦わらの一味の航路</span></div>
      </div>`;
      caption = el.querySelector(".route-caption");
      svg = d3.select(el.querySelector(".stage svg"));
      gZoom = svg.append("g");
      zoom = d3.zoom().scaleExtent([1, 8]).translateExtent([[0, 0], [W, H]]).on("zoom", (ev) => {
        gZoom.attr("transform", ev.transform);
        gZoom.selectAll(".m-place text").style("font-size", `${Math.max(5, 9.5 / Math.sqrt(ev.transform.k))}px`)
          .attr("display", (d) => (d.route || ev.transform.k >= 1.6 || d.id === selId ? null : "none"));
        gZoom.selectAll(".m-place circle").attr("transform", `scale(${1 / Math.sqrt(ev.transform.k)})`);
      });
      svg.call(zoom).on("dblclick.zoom", null);
      svg.on("click", () => OP.go("map"));
      baseMap(gZoom);
      drawPlaces(gZoom);
      svg.call(zoom.transform, d3.zoomIdentity);
      mountGlobe(el.querySelector(".stage"));
      setMode("flat");
      update();
      el.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
      el.querySelector("#m-play").addEventListener("click", playRoute);
      el.querySelector("#m-arc").addEventListener("change", (e) => filterArc(e.target.value));
      el.querySelector("#m-reset").addEventListener("click", () => {
        stopRoute(); arcFilter = ""; selId = null; el.querySelector("#m-arc").value = ""; update();
        svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity);
        proj.scale(baseScale); rotateTo(600 - 95 / 360 * W, H / 2 - 12 / 180 * H);
      });
      window.addEventListener("op-time", update);
    },
    focus(id) {
      const r = id && OP.get(id);
      if (r && r.type === "arc") return filterArc(r.e.id);
      if (playing) return;
      selId = r && r.type === "place" ? id : null;
      if (selId) focusPoint(r.e.x, r.e.y, 2.5);
      update();
    }
  };
})();
