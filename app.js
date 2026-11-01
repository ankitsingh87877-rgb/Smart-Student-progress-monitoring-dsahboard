/* Page logic for the Smart Student Progress Monitoring Dashboard website. */
(function () {
  "use strict";
  const D = window.DSA;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };

  const DEFAULT_CSV = D.SAMPLE.map((r) => r.join(",")).join("\n");
  const TOPICS = [["DSA", 4, 12], ["DBMS", 3, 8], ["OS", 2, 5], ["Maths", 3, 9], ["Project work", 5, 10]];
  const CONFLICTS = [["S05", "S06"], ["S05", "S07"], ["S05", "S10"], ["S06", "S10"], ["S07", "S10"], ["S10", "S11"]];
  const SLOT_NODES = ["S10", "S05", "S06", "S07", "S11"];

  let S = [], byId = {}, selected = "S05";

  /* ---------- CSV ---------- */
  function parseCSV(text) {
    const rows = [], seen = new Set();
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim()) continue;
      const p = line.split(",").map((x) => x.trim());
      if (p.length !== 5) throw new Error("Each line needs 5 values: id,name,marks,attendance,assignments");
      const nums = p.slice(2).map(Number);
      if (nums.some((n) => !isFinite(n) || n < 0 || n > 100)) throw new Error(`Marks, attendance and assignments must be 0–100 (${p[0]})`);
      if (seen.has(p[0])) throw new Error(`Duplicate id ${p[0]}`);
      seen.add(p[0]); rows.push([p[0], p[1], ...nums]);
    }
    if (rows.length < 2) throw new Error("Enter at least 2 students");
    if (rows.length > 60) throw new Error("Please use 60 students or fewer for the live demo");
    return rows;
  }

  function load(text) {
    try {
      S = D.makeRecords(parseCSV(text)); byId = Object.fromEntries(S.map((s) => [s.id, s]));
      $("csvmsg").textContent = `${S.length} students loaded.`; $("csvmsg").className = "sub ok-text";
      if (!byId[selected]) selected = (S.find((s) => s.score < D.AT_RISK) || S[0]).id;
      renderAll();
    } catch (e) { $("csvmsg").textContent = e.message; $("csvmsg").className = "sub bad-text"; }
  }

  /* ---------- tables ---------- */
  function bar(v, cls = "") { return `<div class="bar ${cls}"><i style="width:${Math.max(0, Math.min(100, v))}%"></i></div>`; }
  function status(s) { return s.score < D.AT_RISK ? '<span class="pill bad">At-risk</span>' : '<span class="pill ok">OK</span>'; }

  function renderScores() {
    $("scoreTable").innerHTML = "<tr><th>Roll</th><th>Name</th><th>Marks</th><th>Attend.</th><th>Assign.</th><th>Score</th><th></th><th>Status</th></tr>" +
      S.map((s) => `<tr><td>${esc(s.id)}</td><td>${esc(s.name)}</td><td>${s.marks}</td><td>${s.att}</td><td>${s.asg}</td><td><b>${s.score.toFixed(1)}</b></td><td>${bar(s.score)}</td><td>${status(s)}</td></tr>`).join("");
  }

  function renderRank() {
    const ranked = D.heapSortByRisk(S);
    $("rankTable").innerHTML = "<tr><th>#</th><th>Roll</th><th>Name</th><th>Risk (100 − score)</th><th></th><th>Attendance</th></tr>" +
      ranked.map((s, i) => { const r = D.riskKey(s)[0]; return `<tr><td>${i + 1}</td><td>${esc(s.id)}</td><td>${esc(s.name)}</td><td><b>${r.toFixed(1)}</b></td><td>${bar(r, "risk")}</td><td>${s.att}</td></tr>`; }).join("");
  }

  /* ---------- AVL ---------- */
  function renderAVL() {
    const t = new D.AVL(); S.forEach((s) => t.insert(s.score, s));
    const lo = Number($("lo").value), hi = Number($("hi").value);
    const res = t.range(lo, hi);
    $("avlInfo").textContent = `Tree height ${t.height()}, ${t.rotations} rotations. ${res.length} student(s) with score in [${lo}, ${hi}].`;
    $("avlRange").innerHTML = res.length ? res.map(([k, s]) => `<span class="chip">${esc(s.id)} (${k.toFixed(1)})</span>`).join("") : '<span class="chip">none</span>';
    const svg = $("avlSvg"); svg.innerHTML = "";
    const pos = new Map(); let xi = 0;
    (function place(n, d) { if (!n) return; place(n.l, d + 1); pos.set(n, { x: 30 + xi++ * 62, y: 28 + d * 56 }); place(n.r, d + 1); })(t.root, 0);
    const W = 60 + Math.max(0, xi - 1) * 62, H = 60 + (t.height() - 1) * 56;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.setAttribute("width", Math.max(W, 300)); svg.setAttribute("height", H);
    const inR = (n) => n.key >= lo && n.key <= hi;
    (function edges(n) { if (!n) return; for (const c of [n.l, n.r]) if (c) { el("line", { x1: pos.get(n).x, y1: pos.get(n).y, x2: pos.get(c).x, y2: pos.get(c).y, stroke: "currentColor", "stroke-opacity": .35 }, svg); edges(c); } })(t.root);
    pos.forEach((p, n) => {
      el("circle", { cx: p.x, cy: p.y, r: 21, fill: inR(n) ? "#c8102e" : "#1f4fd8", "fill-opacity": inR(n) ? .92 : .8 }, svg);
      const tx = el("text", { x: p.x, y: p.y + 4, "text-anchor": "middle", fill: "#fff", "font-size": 11, "font-weight": 700 }, svg); tx.setAttribute("style", "fill:#fff"); tx.textContent = n.key.toFixed(1);
    });
  }

  /* ---------- graph ---------- */
  function renderGraph() {
    const thr = Number($("thr").value); $("thrVal").textContent = thr.toFixed(2);
    const { adj, edges } = D.buildGraph(S, thr), comps = D.components(adj), mst = D.kruskal(adj, edges);
    const W = 760, H = 420, pad = 50;
    const mn = (f) => Math.min(...S.map(f)), mx = (f) => Math.max(...S.map(f));
    const sc = (v, a, b, lo, hi) => (b === a ? (lo + hi) / 2 : lo + ((v - a) / (b - a)) * (hi - lo));
    const P = {}; S.forEach((s) => { P[s.id] = { x: sc(s.marks, mn((q) => q.marks), mx((q) => q.marks), pad, W - pad), y: sc(s.att, mn((q) => q.att), mx((q) => q.att), H - pad, pad) }; });
    const sp = D.dijkstra(adj, selected), mentor = D.findMentor(sp.d, byId);
    const pathNodes = mentor ? D.pathTo(sp.prev, mentor[0]) : [], pathSet = new Set();
    for (let i = 0; i + 1 < pathNodes.length; i++) pathSet.add(pathNodes[i] + "|" + pathNodes[i + 1]), pathSet.add(pathNodes[i + 1] + "|" + pathNodes[i]);
    const mstSet = new Set(); mst.mst.forEach(([a, b]) => { mstSet.add(a + "|" + b); mstSet.add(b + "|" + a); });
    const svg = $("graph"); svg.innerHTML = "";
    const t1 = el("text", { x: W / 2, y: H - 8, "text-anchor": "middle" }, svg); t1.textContent = "marks →"; t1.setAttribute("opacity", .6);
    const t2 = el("text", { x: 14, y: H / 2, transform: `rotate(-90 14 ${H / 2})`, "text-anchor": "middle" }, svg); t2.textContent = "attendance →"; t2.setAttribute("opacity", .6);
    edges.forEach(([d, a, b]) => {
      const onPath = pathSet.has(a + "|" + b), inMst = mstSet.has(a + "|" + b);
      el("line", { x1: P[a].x, y1: P[a].y, x2: P[b].x, y2: P[b].y, stroke: onPath ? "#c8102e" : "currentColor", "stroke-width": onPath ? 3.5 : inMst ? 1.8 : 1, "stroke-opacity": onPath ? 1 : inMst ? .6 : .22 }, svg);
    });
    S.forEach((s) => {
      const g = el("g", { style: "cursor:pointer" }, svg); g.addEventListener("click", () => { selected = s.id; $("pick").value = s.id; renderGraph(); });
      const risk = s.score < D.AT_RISK, men = s.score >= D.MENTOR_MIN;
      el("circle", { cx: P[s.id].x, cy: P[s.id].y, r: s.id === selected ? 17 : 13, fill: risk ? "#c8102e" : men ? "#1a7f4b" : "#1f4fd8", "fill-opacity": .88, stroke: s.id === selected ? "currentColor" : "none", "stroke-width": 3 }, g);
      const tx = el("text", { x: P[s.id].x, y: P[s.id].y + 3.5, "text-anchor": "middle", "font-size": 9.5, "font-weight": 700 }, g); tx.setAttribute("style", "fill:#fff"); tx.textContent = s.id.replace(/^S/, "");
      const nm = el("text", { x: P[s.id].x, y: P[s.id].y - 19, "text-anchor": "middle", "font-size": 11 }, g); nm.textContent = s.name;
    });
    $("graphInfo").textContent = `${edges.length} edges · ${comps.length} component(s)` + (comps.some((c) => c.length === 1) ? ` · isolated: ${comps.filter((c) => c.length === 1).map((c) => c[0]).join(", ")}` : "") + ` · Kruskal MST: ${mst.mst.length} edges, weight ${mst.total.toFixed(3)}`;
    // selection box
    const s = byId[selected];
    $("mentorBox").innerHTML = `<b>${esc(s.name)} (${esc(s.id)})</b>, score ${s.score.toFixed(1)} ${status(s)}<br>` +
      (s.score >= D.MENTOR_MIN ? "Already at or above the mentor level (80)." :
        mentor ? `Nearest mentor: <b>${esc(byId[mentor[0]].name)} (${mentor[0]})</b>, score ${byId[mentor[0]].score.toFixed(1)}, path distance <b>${mentor[1].toFixed(3)}</b>, route ${pathNodes.join(" → ")}`
          : '<span class="bad-text">No path to any mentor.</span> This student needs direct staff attention (or raise the threshold).');
    // mentor table
    const risky = S.filter((x) => x.score < D.AT_RISK);
    $("mentorTable").innerHTML = "<tr><th>At-risk</th><th>Score</th><th>Mentor</th><th>Distance</th></tr>" + (risky.length ? risky.map((r) => {
      const m = D.findMentor(D.dijkstra(adj, r.id).d, byId);
      return `<tr><td>${esc(r.id)} (${esc(r.name)})</td><td>${r.score.toFixed(1)}</td><td>${m ? `${m[0]} (${byId[m[0]].score.toFixed(1)})` : "None"}</td><td>${m ? m[1].toFixed(3) : "no path"}</td></tr>`;
    }).join("") : '<tr><td colspan="4">No at-risk students.</td></tr>');
    // traversal
    const b = D.bfs(adj, selected), d = D.dfs(adj, selected);
    $("travInfo").innerHTML = `<p style="margin:6px 0"><b>BFS from ${selected}</b> (${b.length}): ${b.join(", ")}</p><p style="margin:6px 0"><b>DFS from ${selected}</b> (${d.length}): ${d.join(", ")}</p>` +
      `<p style="margin:6px 0"><b>Same reachable set:</b> <span class="${b.length === d.length ? "ok-text" : "bad-text"}">${b.length === d.length ? "yes" : "no"}</span></p>` +
      `<p style="margin:6px 0"><b>MST check:</b> ${mst.mst.length} = V − components = ${S.length} − ${comps.length} → <span class="${mst.mst.length === S.length - comps.length ? "ok-text" : "bad-text"}">${mst.mst.length === S.length - comps.length ? "pass" : "fail"}</span></p>`;
  }

  /* ---------- DP ---------- */
  function renderKnap() {
    const W = Number($("hours").value); $("hoursVal").textContent = W;
    const k = D.knapsack(TOPICS, W), bf = D.knapsackBrute(TOPICS, W), set = new Set(k.chosen);
    $("topicTable").innerHTML = "<tr><th>Topic</th><th>Hours</th><th>Assumed gain</th><th>Chosen</th></tr>" +
      TOPICS.map(([n, h, g]) => `<tr><td>${n}</td><td>${h}</td><td>${g}</td><td>${set.has(n) ? '<span class="pill ok">Yes</span>' : '<span class="pill warn">No</span>'}</td></tr>`).join("");
    const used = TOPICS.filter((t) => set.has(t[0])).reduce((a, t) => a + t[1], 0);
    $("knapInfo").innerHTML = `Plan: <b>${k.chosen.join(", ") || "nothing fits"}</b> · ${used} h used · gain <b>${k.best}</b> · brute force over all 32 subsets: ${bf} → <span class="${k.best === bf ? "ok-text" : "bad-text"}">${k.best === bf ? "match" : "mismatch"}</span>`;
  }
  function renderLCS() {
    const a = $("lcsA").value, b = $("lcsB").value, l = D.lcs(a, b), m = Math.max(a.length, b.length);
    $("lcsOut").innerHTML = `LCS length <b>${l}</b> of ${m} characters` + (a !== b && m && l >= m - 1 ? ' <span class="pill warn">probable typo</span>' : "");
  }

  /* ---------- backtracking ---------- */
  function renderColour() {
    const k = Number($("slots").value), r = D.colourGraph(SLOT_NODES, CONFLICTS, k);
    if (!r.colouring) $("colourOut").innerHTML = `<span class="bad-text">${k} slot(s) are impossible</span> (S05, S06 and S10 conflict pairwise, so at least 3 slots are needed).`;
    else { const by = {}; Object.entries(r.colouring).forEach(([s, c]) => (by[c] = by[c] || []).push(s)); $("colourOut").innerHTML = `<span class="ok-text">${k} slot(s) work:</span> ` + Object.keys(by).sort().map((c) => `slot ${c}: ${by[c].join(" + ")}`).join(" · "); }
    $("colourLog").innerHTML = r.steps.map(esc).join("<br>");
  }
  function renderTSP() {
    $("travelTable").innerHTML = "<tr><th></th>" + D.PLACES.map((p) => `<th>${p}</th>`).join("") + "</tr>" + D.TRAVEL.map((row, i) => `<tr><th>${D.PLACES[i]}</th>${row.map((v) => `<td>${v}</td>`).join("")}</tr>`).join("");
    const r = D.tspBnB(D.TRAVEL), bf = D.tspBrute(D.TRAVEL);
    $("tspOut").innerHTML = `Best round: <b>${r.best} min</b> · ${r.route.map((i) => D.PLACES[i]).join(" → ")}<br>Partial routes explored ${r.stats.explored}, pruned ${r.stats.pruned} (brute force over all 24 orders: ${bf} min → <span class="${r.best === bf ? "ok-text" : "bad-text"}">${r.best === bf ? "match" : "mismatch"}</span>)`;
  }

  /* ---------- tests ---------- */
  const REPORT_TESTS = [
    ["Heap sort ranking", "S10, S07, S05 first; equals built-in sort"], ["AVL in-order traversal", "Sorted by progress score"],
    ["AVL range query, 40–60", "S07, S05, S06 = plain filter"], ["Progress score and risk flag", "S05, S07, S10 below 55"],
    ["BFS vs DFS from S05", "Same set of 11 students"], ["Connected components", "2 clusters; S10 isolated"],
    ["Dijkstra vs Floyd–Warshall", "Equal distances"], ["Kruskal MST", "10 edges = V − components; weight 0.915"],
    ["Mentor search", "S05 → S02, S07 → S02, S10 none"], ["0/1 knapsack, 10 hours", "Gain 29 = brute force"],
    ["LCS and memoization", "LCS check; 72 vs 360 runs"], ["Slot colouring", "2 slots impossible; 3 succeed"], ["Branch and bound round", "26 min = brute-force minimum"]
  ];
  function renderTestTable(results) {
    $("testTable").innerHTML = "<tr><th>Test</th><th>Expected</th><th>Result</th></tr>" + REPORT_TESTS.map(([n, e], i) => {
      const r = results ? results[i] : null;
      return `<tr><td>${n}</td><td>${e}</td><td>${r === null ? "Pass (report)" : r ? "Pass ✓ (live)" : '<span class="bad-text">FAIL</span>'}</td></tr>`;
    }).join("");
  }
  function runTests() {
    const R = D.makeRecords(D.SAMPLE), by = Object.fromEntries(R.map((s) => [s.id, s])), out = [];
    const ranked = D.heapSortByRisk(R).map((s) => s.id);
    const builtin = [...R].sort((a, b) => D.cmpKey(D.riskKey(b), D.riskKey(a)));
    out.push(ranked.slice(0, 3).join() === "S10,S07,S05" && D.heapSortByRisk(R).every((s, i) => D.cmpKey(D.riskKey(s), D.riskKey(builtin[i])) === 0));
    const t = new D.AVL(); R.forEach((s) => t.insert(s.score, s)); const ks = t.inorder().map((x) => x[0]);
    out.push(ks.every((k, i) => !i || ks[i - 1] <= k));
    out.push(t.range(40, 60).map((x) => x[1].id).sort().join() === "S05,S06,S07");
    out.push(R.filter((s) => s.score < 55).map((s) => s.id).join() === "S05,S07,S10");
    const { adj, edges } = D.buildGraph(R), comps = D.components(adj);
    out.push(D.bfs(adj, "S05").length === 11 && D.dfs(adj, "S05").length === 11);
    out.push(comps.length === 2 && comps.some((c) => c.length === 1 && c[0] === "S10"));
    const fw = D.floyd(adj); let ok = true;
    Object.keys(adj).forEach((u) => { const { d } = D.dijkstra(adj, u); Object.keys(adj).forEach((v) => { if (!(d[v] === fw[u][v] || Math.abs(d[v] - fw[u][v]) < 1e-9)) ok = false; }); });
    out.push(ok);
    const k = D.kruskal(adj, edges); out.push(k.mst.length === 10 && Math.abs(k.total - 0.915) < 0.0005);
    const m = (id) => D.findMentor(D.dijkstra(adj, id).d, by);
    out.push(m("S05")[0] === "S02" && m("S07")[0] === "S02" && m("S10") === null);
    const kn = D.knapsack(TOPICS, 10); out.push(kn.best === 29 && kn.best === D.knapsackBrute(TOPICS, 10));
    out.push(D.lcs("S0123", "S0132") === 4);
    out.push(D.colourGraph(SLOT_NODES, CONFLICTS, 2).colouring === null && D.colourGraph(SLOT_NODES, CONFLICTS, 3).colouring !== null);
    const bb = D.tspBnB(D.TRAVEL); out.push(bb.best === 26 && bb.best === D.tspBrute(D.TRAVEL));
    renderTestTable(out);
    const p = out.filter(Boolean).length; $("testSummary").innerHTML = `<b class="${p === out.length ? "ok-text" : "bad-text"}">${p}/${out.length} checks passed</b>`;
  }
  function bench() {
    const n = Number($("benchN").value), thr = n > 2000 ? 0.06 : 0.08; $("benchOut").textContent = "Running…";
    setTimeout(() => {
      const R = D.makeRecords(D.synthetic(n)), t0 = performance.now(), { adj, edges } = D.buildGraph(R, thr), t1 = performance.now();
      const comps = D.components(adj), t2 = performance.now(); D.kruskal(adj, edges); const t3 = performance.now();
      const H = D.makeRecords(D.synthetic(20000)), t4 = performance.now(), hs = D.heapSortByRisk(H), t5 = performance.now();
      const sorted = hs.every((s, i) => !i || D.cmpKey(D.riskKey(hs[i - 1]), D.riskKey(s)) >= 0);
      $("benchOut").innerHTML = `n=${n}, threshold ${thr}: ${edges.length} edges · graph build ${((t1 - t0) / 1000).toFixed(2)} s (O(n²)) · components ${(t2 - t1).toFixed(1)} ms (${comps.length}) · Kruskal ${(t3 - t2).toFixed(1)} ms<br>Heap sort of 20,000 records: ${((t5 - t4) / 1000).toFixed(2)} s, ${sorted ? "correct" : "INCORRECT"}. Times depend on your device; data is synthetic (random, seed 7).`;
    }, 20);
  }

  /* ---------- wiring ---------- */
  function renderAll() {
    renderScores(); renderRank(); renderAVL();
    $("pick").innerHTML = S.map((s) => `<option value="${esc(s.id)}">${esc(s.id)} · ${esc(s.name)}</option>`).join(""); $("pick").value = selected;
    renderGraph();
  }
  $("csv").value = DEFAULT_CSV;
  $("recompute").onclick = () => load($("csv").value);
  $("reset").onclick = () => { $("csv").value = DEFAULT_CSV; selected = "S05"; load(DEFAULT_CSV); };
  ["lo", "hi"].forEach((i) => $(i).addEventListener("input", renderAVL));
  $("thr").addEventListener("input", renderGraph);
  $("pick").addEventListener("change", (e) => { selected = e.target.value; renderGraph(); });
  $("hours").addEventListener("input", renderKnap);
  ["lcsA", "lcsB"].forEach((i) => $(i).addEventListener("input", renderLCS));
  $("slots").addEventListener("change", renderColour);
  $("runTests").onclick = runTests; $("bench").onclick = bench;

  load(DEFAULT_CSV); renderKnap(); renderLCS(); renderColour(); renderTSP(); renderTestTable(null);
})();
