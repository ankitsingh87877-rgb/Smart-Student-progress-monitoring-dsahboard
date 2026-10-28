// UI layer: builds graphs from the student data and calls the DSA modules.
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const state = { students: STUDENTS.map(s => ({ ...s, marks: { ...s.marks }, results: [...s.results] })), threshold: 0.25, tab: 'overview', sel: '101', mst: false, hours: 8, a: '101', b: '102', subject: 'DSA' };
state.q = ''; state.dims = '30,35,15,5,10,20,25';
const PREREQ = [['MATHS', 'DSA'], ['DSA', 'DBMS'], ['DSA', 'OS']];   // subject prerequisite DAG
try { const saved = JSON.parse(localStorage.getItem('ssd-students')); if (Array.isArray(saved) && saved.length) state.students = saved; } catch (e) {}
const save = () => { try { localStorage.setItem('ssd-students', JSON.stringify(state.students)); } catch (e) {} };

// ---- progress score and risk level (weights: marks 50%, attendance 30%, assignments 20%) ----
const avgMarks = s => { const v = Object.values(s.marks); return v.reduce((a, b) => a + b, 0) / v.length; };
const score = s => 0.5 * avgMarks(s) + 0.3 * s.attendance + 0.2 * s.assignment;
const risk = s => (score(s) < 50 || s.attendance < 60) ? 'at-risk' : score(s) < 65 ? 'watch' : 'on-track';
const vec = s => [avgMarks(s) / 100, s.attendance / 100, s.assignment / 100];
// Edge weight = Euclidean distance between normalized vectors, so it is never negative.
const dist = (a, b) => { const x = vec(a), y = vec(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); };
const byRoll = r => state.students.find(s => s.roll === r);
const chip = s => `<span class="chip ${risk(s)}">${risk(s)}</span>`;
const f1 = x => x.toFixed(1);
const weak = s => SUBJECTS.filter(u => s.marks[u.id] < 50).map(u => u.id);

// ---- graph construction ----
function buildSimilarity() { return buildFor(state.students, state.threshold); }
function buildFor(st, th) {   // O(n^2) pair checks, adjacency list stores only edges under the threshold
  const g = new Graph();
  st.forEach(s => g.addNode(s.roll));
  for (let i = 0; i < st.length; i++) for (let j = i + 1; j < st.length; j++) {
    const d = dist(st[i], st[j]);
    if (d <= th) g.addEdge(st[i].roll, st[j].roll, d);
  }
  return g;
}
function buildEnrollment() {   // Student - Subject edges for subjects where the student is weak (<50)
  const g = new Graph();
  state.students.forEach(s => { g.addNode(s.roll); weak(s).forEach(id => g.addEdge(s.roll, 'SUB:' + id, 1)); });
  SUBJECTS.forEach(u => g.addNode('SUB:' + u.id));
  return g;
}
const pills = (list, cls = '') => list.map(x => `<span class="pill ${cls}">${esc(x)}</span>`).join('') || '<span class="note">none</span>';
const nm = r => byRoll(r) ? byRoll(r).name : r;
const opts = (sel, withName = true) => state.students.map(s => `<option value="${s.roll}" ${s.roll === sel ? 'selected' : ''}>${esc(s.roll)} ${withName ? esc(s.name) : ''}</option>`).join('');

// ---- tabs ----
function overview() {
  const st = state.students, n = k => st.filter(s => risk(s) === k).length;
  const comps = buildSimilarity().components(), cl = {};
  comps.forEach((c, i) => c.forEach(r => cl[r] = c.length === 1 ? 'isolated' : 'C' + (i + 1)));
  const q = state.q.toLowerCase(), rows = st.filter(s => (s.name + s.roll).toLowerCase().includes(q)).sort((a, b) => score(a) - score(b)).map(s =>
    `<tr><td>${esc(s.roll)}</td><td>${esc(s.name)}</td><td>${f1(avgMarks(s))}</td><td>${s.attendance}</td><td>${s.assignment}</td><td><b>${f1(score(s))}</b></td><td>${chip(s)}</td><td>${esc(weak(s).join(', ') || '-')}</td><td>${cl[s.roll]}</td></tr>`).join('');
  return `<div class="grid g4">
    <div class="card stat"><b>${st.length}</b><span>students</span></div>
    <div class="card stat"><b style="color:var(--red)">${n('at-risk')}</b><span>at risk</span></div>
    <div class="card stat"><b style="color:var(--amber)">${n('watch')}</b><span>on watch</span></div>
    <div class="card stat"><b style="color:var(--green)">${n('on-track')}</b><span>on track</span></div></div>
  <div class="card" style="margin-top:16px"><h2>Progress score</h2>
    <p class="note">Score = 50% average marks + 30% attendance + 20% assignments. At risk: score below 50 or attendance below 60. Watch: score below 65. Cluster comes from connected components of the similarity graph; "isolated" means no similar peer.</p>
    <div class="row"><label>Search <input type="text" id="q" value="${esc(state.q)}" placeholder="name or roll"></label>
      <button class="act" id="csvOut" type="button">Export CSV</button><label>Import CSV <input type="file" id="csvIn" accept=".csv"></label>
      <button class="act" id="gen" type="button">Load 200 test students</button><button class="act" id="reset" type="button">Reset sample data</button></div>
    <div class="wrap"><table><tr><th>Roll</th><th>Name</th><th>Avg marks</th><th>Attend.</th><th>Assign.</th><th>Score</th><th>Risk</th><th>Weak subjects</th><th>Cluster</th></tr>${rows}</table></div></div>
  <div class="card" style="margin-top:16px"><h2>Add a student</h2>
    <p class="note">Checks run before saving: required fields, 0-100 range, duplicate roll number, and name similarity using LCS.</p>
    <form class="add" id="addForm" novalidate>
      <label>Roll no.<input type="text" name="roll"></label><label>Name<input type="text" name="name"></label>
      ${SUBJECTS.map(u => `<label>${u.id} marks<input type="number" name="${u.id}"></label>`).join('')}
      <label>Attendance %<input type="number" name="att"></label><label>Assignment %<input type="number" name="asg"></label>
      <label>Past results (e.g. 60,64)<input type="text" name="res"></label>
      <label>&nbsp;<button class="act" type="submit">Add student</button></label></form>
    <div id="msg" class="msg"></div></div>`;
}

function graphTab() {
  const g = buildSimilarity(), comps = g.components(), mst = g.kruskal(), st = state.students;
  const col = ['#0f766e', '#b45309', '#4338ca', '#be185d', '#15803d', '#9a3412'], cidx = {};
  comps.forEach((c, i) => c.forEach(r => cidx[r] = i));
  if (!byRoll(state.sel)) state.sel = st[0].roll;
  const m = dijkstraMentor(g, state.sel);
  const pathPairs = new Set(); if (m.path) for (let i = 1; i < m.path.length; i++) pathPairs.add([m.path[i - 1], m.path[i]].sort().join('|'));
  const mstSet = new Set(mst.tree.map(e => [e.u, e.v].sort().join('|')));
  const Wd = 640, H = 400, P = 46;
  const px = s => P + (Math.min(100, Math.max(20, avgMarks(s))) - 20) / 80 * (Wd - 2 * P);
  const py = s => H - P - (Math.min(100, Math.max(30, s.attendance)) - 30) / 70 * (H - 2 * P);
  const allE = g.edges(), dense = allE.length > 1200;   // dense graphs: draw only MST and mentor path
  const lines = (dense ? allE.filter(e => { const k = [e.u, e.v].sort().join('|'); return mstSet.has(k) || pathPairs.has(k); }) : allE).map(e => {
    const a = byRoll(e.u), b = byRoll(e.v), k = [e.u, e.v].sort().join('|');
    const onPath = pathPairs.has(k), onMst = (state.mst || dense) && mstSet.has(k);
    return `<line x1="${px(a)}" y1="${py(a)}" x2="${px(b)}" y2="${py(b)}" stroke="${onPath ? '#d97706' : onMst ? '#0f766e' : '#b8c6c4'}" stroke-width="${onPath ? 4 : onMst ? 2.5 : 1}"/>`;
  }).join('');
  const dots = st.map(s => `<g class="n" data-roll="${s.roll}" tabindex="0"><circle cx="${px(s)}" cy="${py(s)}" r="${s.roll === state.sel ? 11 : 8}" fill="${comps[cidx[s.roll]].length === 1 ? '#fff' : col[cidx[s.roll] % col.length]}" stroke="${risk(s) === 'at-risk' ? '#b91c1c' : '#12302e'}" stroke-width="${risk(s) === 'at-risk' ? 3 : 1.2}"/>${st.length <= 40 ? `<text x="${px(s) + 12}" y="${py(s) + 4}">${esc(s.name.split(' ')[0])}</text>` : ''}</g>`).join('');
  return `<div class="row">
    <label>Similarity threshold <input type="range" id="thr" min="0.05" max="0.8" step="0.01" value="${state.threshold}"> <b>${state.threshold.toFixed(2)}</b></label>
    <label><input type="checkbox" id="mst" ${state.mst ? 'checked' : ''}> show Kruskal MST</label>
    <label>Student <select id="sel">${opts(state.sel)}</select></label></div>
  <div class="grid g2"><div><svg viewBox="0 0 ${Wd} ${H}" role="img" aria-label="Student similarity graph">
      <text class="ax" x="${Wd / 2 - 50}" y="${H - 8}">average marks (low to high)</text><text class="ax" x="6" y="16">attendance % (higher is up)</text>${lines}${dots}</svg>
    <p class="note">Each dot is a student; a line joins two students whose Euclidean distance is within the threshold. Red outline = at risk, hollow dot = isolated. Click a dot to select it.${dense ? ' This graph has ' + allE.length + ' edges, so only the MST and mentor path are drawn. Lower the threshold to see every edge.' : ''}</p></div>
  <div class="grid">
    <div class="card"><h2>Graph summary</h2><p class="note">Adjacency list, O(V+E). Components by DFS, MST by Kruskal O(E log E).</p>
      <p><b>${g.nodes().length}</b> nodes, <b>${g.edges().length}</b> edges, <b>${comps.length}</b> components, <b>${comps.filter(c => c.length === 1).length}</b> isolated. MST weight <b>${mst.total.toFixed(3)}</b> over ${mst.tree.length} edges.</p></div>
    <div class="card"><h2>Closest mentor for ${esc(nm(state.sel))}</h2><p class="note">Dijkstra O((V+E) log V) to the nearest on-track student.</p>${m.html}</div>
    <div class="card"><h2>Clusters (DFS order)</h2>${comps.map((c, i) => `<p class="lvl"><b>${c.length === 1 ? 'Isolated' : 'Cluster ' + (i + 1)}</b>${pills(c.map(nm))}</p>`).join('')}</div></div></div>`;
}
function dijkstraMentor(g, roll) {
  const r = g.dijkstra(roll, n => n !== roll && risk(byRoll(n)) === 'on-track');
  if (!r.found) return { path: null, html: risk(byRoll(roll)) === 'on-track' && g.adj.get(roll).length === 0 ? '<p>This student is on track and has no similar peer yet.</p>' : '<p><b>No mentor reachable.</b> No on-track student is connected at this threshold. Assign a faculty mentor or raise the threshold.</p>' };
  const path = Graph.path(r.prev, r.found);
  return { path, html: `<p><b>${esc(nm(r.found))}</b> (distance ${r.dist.get(r.found).toFixed(3)})</p><p class="note">Path: ${esc(path.map(nm).join(' > '))}</p>` };
}

function subjectTab() {
  const g = buildEnrollment(), start = 'SUB:' + state.subject, { level } = g.bfs(start), groups = {};
  level.forEach((l, node) => (groups[l] = groups[l] || []).push(node));
  const label = ['Subject', 'Students weak in it (remedial group)', 'Other weak subjects of those students', 'More students sharing those subjects'];
  const lv = Object.keys(groups).filter(l => l > 0).map(l => `<p class="lvl"><b>Level ${l}: ${label[l] || 'Further links'}</b>${pills(groups[l].map(x => x.startsWith('SUB:') ? x.slice(4) : nm(x)))}</p>`).join('');
  return `<div class="row"><label>Subject <select id="subj">${SUBJECTS.map(u => `<option ${u.id === state.subject ? 'selected' : ''}>${u.id}</option>`).join('')}</select></label></div>
  <div class="card"><h2>Weak-subject explorer (BFS)</h2><p class="note">Student-Subject graph, edge = student scored below 50. BFS from the subject node walks outward level by level, O(V+E).</p>${lv || '<p>No student is weak in this subject.</p>'}</div>`;
}

function planTab() {
  const s = byRoll(state.sel) || state.students[0];
  const items = planItems(s);
  const r = knapsack(items, state.hours), pick = new Set(r.chosen.map(x => x.name));
  return `<div class="row"><label>Student <select id="sel">${opts(s.roll)}</select></label>
    <label>Study hours per week <input type="range" id="hrs" min="1" max="30" value="${state.hours}"> <b>${state.hours}</b></label></div>
  <div class="card"><h2>Study plan (0/1 Knapsack)</h2>
    <p class="note">Each subject below 70 marks is an item: cost = hours needed (gap / 5, rounded up), value = expected marks gain (gap x credits / 3). The DP table has ${items.length + 1} x ${state.hours + 1} cells, O(n*W).</p>
    ${items.length ? `<div class="wrap"><table><tr><th>Subject</th><th>Marks</th><th>Hours</th><th>Expected gain</th><th>In plan</th></tr>${items.map(i => `<tr><td>${i.name}</td><td>${s.marks[i.name]}</td><td>${i.w}</td><td>${i.v}</td><td>${pick.has(i.name) ? '<span class="pill pick">study</span>' : '-'}</td></tr>`).join('')}</table></div>
    <p><b>${r.hours}</b> of ${state.hours} hours used. Total expected gain: <b>${r.best}</b>.</p>` : '<p>Every subject is at 70 or above. No plan needed.</p>'}</div>`;
}

function trendTab() {
  const A = byRoll(state.a) || state.students[0], B = byRoll(state.b) || state.students[1] || A;
  const ta = trendSequence(A.results), tb = trendSequence(B.results), L = lcs(ta, tb);
  const agg = makeAggregator();
  const cumRows = A.results.map((_, i) => `<td>${agg.cum(A.roll, A.results, i + 1).toFixed(1)}</td>`).join('');
  A.results.forEach((_, i) => agg.cum(A.roll, A.results, i + 1));   // second pass is answered from the cache
  return `<div class="row"><label>Student A <select id="ta">${opts(A.roll)}</select></label><label>Student B <select id="tb">${opts(B.roll)}</select></label></div>
  <div class="grid g2"><div class="card"><h2>Trend comparison (LCS)</h2><p class="note">Results become a sequence of U (up), D (down), S (same). LCS finds their longest shared pattern, O(m*n).</p>
    <p>${esc(A.name)}: ${pills(ta)}</p><p>${esc(B.name)}: ${pills(tb)}</p>
    <p>Shared pattern: ${pills(L.seq)} length <b>${L.length}</b> of ${Math.max(ta.length, tb.length)}</p></div>
  <div class="card"><h2>Semester aggregates (memoization)</h2><p class="note">Cumulative average for ${esc(A.name)}, each state is computed once and then read from the cache.</p>
    <div class="wrap"><table><tr>${A.results.map((_, i) => `<th>Up to sem ${i + 1}</th>`).join('')}</tr><tr>${cumRows}</tr></table></div>
    <p class="note">Cache: ${agg.size()} states stored, ${agg.stats.calls} calls, ${agg.stats.hits} answered from the cache.</p></div></div>`;
}

// ---- add-student validation ----
function addStudent(form) {
  const v = n => form.elements[n].value.trim(), errs = [];
  const roll = v('roll'), name = v('name');
  if (!roll || !name) errs.push('Roll number and name are required.');
  if (state.students.some(s => s.roll === roll)) errs.push('Roll number ' + roll + ' already exists.');
  const dup = state.students.find(s => similarity(s.name, name) >= 0.85);
  if (name && dup) errs.push('Name looks like a duplicate of "' + dup.name + '" (similarity ' + similarity(dup.name, name).toFixed(2) + ').');
  const marks = {}, nums = {};
  [...SUBJECTS.map(u => u.id), 'att', 'asg'].forEach(k => {
    const x = Number(v(k));
    if (v(k) === '' || isNaN(x) || x < 0 || x > 100) errs.push(k + ' must be a number from 0 to 100.');
    else if (SUBJECTS.some(u => u.id === k)) marks[k] = x; else nums[k] = x;
  });
  const res = v('res') ? v('res').split(',').map(Number) : [];
  if (res.some(x => isNaN(x) || x < 0 || x > 100)) errs.push('Past results must be comma-separated numbers from 0 to 100.');
  const msg = $('#msg');
  if (errs.length) { msg.className = 'msg err'; msg.innerHTML = errs.map(esc).join('<br>'); return; }
  state.students.push({ roll, name, sem: 3, marks, attendance: nums.att, assignment: nums.asg, results: res }); save();
  render(); $('#msg').className = 'msg ok'; $('#msg').textContent = name + ' added.';
}

// ---- study-plan items, student self-service report, algorithm lab ----
function planItems(s) {   // subjects below 70: cost = hours (gap/5), value = expected gain (gap x credits / 3)
  return SUBJECTS.filter(u => s.marks[u.id] < 70).map(u => { const gap = 70 - s.marks[u.id]; return { name: u.id, w: Math.ceil(gap / 5), v: Math.round(gap * u.credits / 3), gap }; });
}
function myReport() {
  const s = byRoll(state.sel) || state.students[0], m = dijkstraMentor(buildSimilarity(), s.roll);
  const items = planItems(s), r = knapsack(items, state.hours), pick = new Set(r.chosen.map(x => x.name));
  const order = topoSort(SUBJECTS.map(u => u.id), PREREQ).order.filter(id => s.marks[id] < 70);
  const tips = { 'at-risk': 'You need support soon. Meet your mentor this week and follow the study plan.', 'watch': 'You are close to the safe zone. Focus on the subjects in your plan.', 'on-track': 'You are doing well. Consider helping classmates as a peer mentor.' };
  return `<div class="row"><label>Your student <select id="sel">${opts(s.roll)}</select></label><label>Study hours per week <input type="range" id="hrs" min="1" max="30" value="${state.hours}"> <b>${state.hours}</b></label></div>
  <div class="grid g2"><div class="card"><h2>${esc(s.name)}</h2><p>${chip(s)} Progress score <b>${f1(score(s))}</b> out of 100</p><p>${tips[risk(s)]}</p>
    <p class="note">Average marks ${f1(avgMarks(s))}, attendance ${s.attendance}%, assignments ${s.assignment}%.</p>
    <p>Weak subjects (below 50): ${pills(weak(s))}</p><p>Result trend (U up, D down, S same): ${pills(trendSequence(s.results))}</p></div>
  <div class="card"><h2>Your closest mentor</h2><p class="note">Nearest on-track student by similarity (Dijkstra).</p>${m.html}</div>
  <div class="card"><h2>Your study plan</h2><p class="note">Knapsack picks the best use of ${state.hours} hours.</p>${items.length ? `<p>${pills(r.chosen.map(x => x.name + ' (' + x.w + 'h)'), 'pick')}</p><p>${r.hours} hours used, expected gain ${r.best}.</p>` : '<p>All subjects are at 70 or above.</p>'}</div>
  <div class="card"><h2>Suggested subject order</h2><p class="note">Topological sort of subject prerequisites (Maths, then DSA, then DBMS and OS).</p>${pills(order)}</div></div>`;
}
function labTab() {
  const g = buildSimilarity(), s = byRoll(state.sel) || state.students[0], k = g.kruskal(), p = g.prim();
  const d1 = g.dijkstra(s.roll).dist, bf = g.bellmanFord(s.roll); let diff = 0;
  d1.forEach((v, n) => { diff = Math.max(diff, Math.abs(v - bf.dist.get(n))); });
  const items = planItems(s), kn = knapsack(items, state.hours), al = allocateHours(items.map(i => ({ name: i.name, v: i.v })), state.hours);
  let fw = '<p class="note">Skipped for more than 150 students (O(V^3)).</p>';
  if (state.students.length <= 150) {
    const f = g.floydWarshall(); let best = null, pairs = 0;
    f.d.forEach((row, i) => row.forEach((v, j) => { if (i < j && v > 0 && v < Infinity) { pairs++; if (!best || v < best[0]) best = [v, i, j]; } }));
    fw = best ? `<p>Closest pair: <b>${esc(nm(f.nodes[best[1]]))}</b> and <b>${esc(nm(f.nodes[best[2]]))}</b>, distance ${best[0].toFixed(3)}. ${pairs} connected pairs in total.</p>` : '<p>No connected pairs at this threshold.</p>';
  }
  const dims = state.dims.split(',').map(x => parseInt(x, 10)), ok = dims.length >= 2 && dims.every(x => x > 0), mc = ok ? matrixChain(dims) : null;
  const yes = c => c ? '<b style="color:var(--green)">match</b>' : '<b style="color:var(--red)">mismatch</b>';
  return `<div class="row"><label>Student <select id="sel">${opts(s.roll)}</select></label><label>Hours <input type="range" id="hrs" min="1" max="30" value="${state.hours}"> <b>${state.hours}</b></label></div>
  <p class="note">Every algorithm from Units 2 and 3 is implemented here. The ones the dashboard does not need for its main features are used as cross-checks or small tools.</p>
  <div class="grid g2">
  <div class="card"><h2>Prim vs Kruskal (MST)</h2><p class="note">Prim O(E log V), Kruskal O(E log E).</p><p>Prim ${p.total.toFixed(4)}, Kruskal ${k.total.toFixed(4)}: ${yes(Math.abs(p.total - k.total) < 1e-9)}</p></div>
  <div class="card"><h2>Bellman-Ford vs Dijkstra</h2><p class="note">Bellman-Ford O(V*E) also supports negative weights. Distances from ${esc(s.name)}.</p><p>Largest difference ${diff.toExponential(1)}: ${yes(diff < 1e-9)}. Negative cycle: ${bf.negCycle ? 'yes' : 'no'}.</p></div>
  <div class="card"><h2>Floyd-Warshall (all pairs)</h2><p class="note">O(V^3), all peer-to-peer distances at once.</p>${fw}</div>
  <div class="card"><h2>Knapsack vs flexible allocation</h2><p class="note">0/1 Knapsack O(n*W) studies a subject fully or not at all. Resource allocation DP O(n*B^2) splits hours with diminishing returns.</p>
    <p>Knapsack: ${pills(kn.chosen.map(x => x.name + ' ' + x.w + 'h'))} gain ${kn.best}</p><p>Allocation: ${pills(Object.entries(al.alloc).map(([n, h]) => n + ' ' + h + 'h'))} gain ${al.best.toFixed(1)}</p></div>
  <div class="card"><h2>Matrix chain multiplication</h2><p class="note">O(n^3). Cheapest order to multiply a chain of matrices, for example chained score-weight transforms. Enter dimensions.</p>
    <label>Dimensions <input type="text" id="dims" value="${esc(state.dims)}"></label>${mc ? `<p>Minimum multiplications: <b>${mc.cost}</b></p><p class="note">${esc(mc.paren)}</p>` : '<p class="msg err">Enter two or more positive whole numbers separated by commas.</p>'}</div>
  <div class="card"><h2>Scale test</h2><p class="note">Builds the similarity graph, finds components, MST and a shortest-path tree for generated classes.</p>
    <button class="act" id="bench" type="button">Run benchmark</button><div id="benchOut" class="wrap"></div></div></div>`;
}
function runBench() {
  const rows = [50, 100, 200, 400].map(n => {
    const st = makeStudents(n, 7, SUBJECTS), t0 = performance.now(), g = buildFor(st, 0.12), t1 = performance.now();
    g.components(); g.kruskal(); g.dijkstra(g.nodes()[0]); const t2 = performance.now();
    return `<tr><td>${n}</td><td>${g.edges().length}</td><td>${(t1 - t0).toFixed(1)}</td><td>${(t2 - t1).toFixed(1)}</td></tr>`;
  }).join('');
  $('#benchOut').innerHTML = `<table><tr><th>Students</th><th>Edges</th><th>Build graph (ms)</th><th>Graph algorithms (ms)</th></tr>${rows}</table>`;
}

// ---- CSV import / export ----
const COLS = ['roll', 'name', 'sem', ...SUBJECTS.map(u => u.id), 'attendance', 'assignment', 'results'];
function toCSV() { return [COLS.join(','), ...state.students.map(s => [s.roll, '"' + s.name.replace(/"/g, '""') + '"', s.sem, ...SUBJECTS.map(u => s.marks[u.id]), s.attendance, s.assignment, s.results.join(';')].join(','))].join('\n'); }
function splitCSV(line) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true; else if (c === ',') { out.push(cur); cur = ''; } else cur += c;
  }
  return out.concat(cur);
}
function importCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim()), head = splitCSV(lines.shift() || '').map(x => x.trim()), good = [], seen = new Set(); let bad = 0;
  if (COLS.slice(0, -1).some(c => !head.includes(c))) return { good, bad: lines.length, error: 'Missing columns. Expected: ' + COLS.join(', ') };
  lines.forEach(l => {
    const f = splitCSV(l), o = {}; head.forEach((h, i) => o[h] = (f[i] || '').trim());
    const nums = [...SUBJECTS.map(u => u.id), 'attendance', 'assignment'].map(k => o[k] === '' ? NaN : Number(o[k]));
    const res = o.results ? o.results.split(';').map(Number) : [];
    if (!o.roll || !o.name || seen.has(o.roll) || nums.some(x => isNaN(x) || x < 0 || x > 100) || res.some(x => isNaN(x) || x < 0 || x > 100)) { bad++; return; }
    seen.add(o.roll); const marks = {}; SUBJECTS.forEach((u, i) => marks[u.id] = nums[i]);
    good.push({ roll: o.roll, name: o.name, sem: Number(o.sem) || 3, marks, attendance: nums[SUBJECTS.length], assignment: nums[SUBJECTS.length + 1], results: res });
  });
  return { good, bad };
}
function flash(text, err) { const m = $('#msg'); if (m) { m.className = 'msg ' + (err ? 'err' : 'ok'); m.textContent = text; } }

// ---- wiring ----
function render() {
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === state.tab));
  $('#view').innerHTML = { overview, graph: graphTab, subject: subjectTab, plan: planTab, trend: trendTab, me: myReport, lab: labTab }[state.tab]();
  const on = (id, ev, fn) => { const e = $(id); if (e) e.addEventListener(ev, fn); };
  on('#addForm', 'submit', e => { e.preventDefault(); addStudent(e.target); });
  on('#thr', 'input', e => { state.threshold = +e.target.value; render(); });
  on('#mst', 'change', e => { state.mst = e.target.checked; render(); });
  on('#sel', 'change', e => { state.sel = e.target.value; render(); });
  on('#subj', 'change', e => { state.subject = e.target.value; render(); });
  on('#hrs', 'input', e => { state.hours = +e.target.value; render(); });
  on('#ta', 'change', e => { state.a = e.target.value; render(); });
  on('#tb', 'change', e => { state.b = e.target.value; render(); });
  on('#q', 'change', e => { state.q = e.target.value; render(); });
  on('#dims', 'change', e => { state.dims = e.target.value; render(); });
  on('#bench', 'click', runBench);
  on('#csvOut', 'click', () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([toCSV()], { type: 'text/csv' })); a.download = 'students.csv'; a.click(); });
  on('#csvIn', 'change', e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { const r = importCSV(t); if (r.error || !r.good.length) { flash(r.error || 'No valid rows found. Nothing was imported.', true); return; } state.students = r.good; state.sel = r.good[0].roll; save(); render(); flash(r.good.length + ' students imported, ' + r.bad + ' rows skipped.'); }); });
  on('#gen', 'click', () => { state.students = makeStudents(200, 7, SUBJECTS); state.sel = '1000'; save(); render(); flash('200 generated students loaded.'); });
  on('#reset', 'click', () => { state.students = STUDENTS.map(s => ({ ...s, marks: { ...s.marks }, results: [...s.results] })); state.sel = '101'; state.q = ''; save(); render(); flash('Sample data restored.'); });
  document.querySelectorAll('g.n').forEach(n => {
    const pick = () => { state.sel = n.dataset.roll; render(); };
    n.addEventListener('click', pick); n.addEventListener('keydown', e => { if (e.key === 'Enter') pick(); });
  });
}
$('#tabs').addEventListener('click', e => { if (e.target.dataset.tab) { state.tab = e.target.dataset.tab; render(); } });
render();
