/* Smart Student Progress Monitoring Dashboard - algorithms (browser + Node)
   Mirrors python/student_dashboard.py so the website demos match the report. */
(function (root) {
  "use strict";

  const THRESHOLD = 0.15, AT_RISK = 55, MENTOR_MIN = 80;

  const SAMPLE = [
    ["S01","Aarav",88,94,90],["S02","Bhavna",82,90,85],["S03","Chirag",76,85,80],
    ["S04","Divya",91,96,93],["S05","Esha",45,60,50],["S06","Farhan",52,66,48],
    ["S07","Gauri",38,55,42],["S08","Harsh",70,80,72],["S09","Isha",64,75,66],
    ["S10","Jatin",30,40,35],["S11","Kavya",58,70,60],["S12","Lakshya",85,88,87]
  ];

  const r1 = (x) => Math.round(x * 10) / 10;
  const score = (m, a, s) => r1(0.5 * m + 0.3 * a + 0.2 * s);
  const makeRecords = (rows) => rows.map(([id, name, marks, att, asg]) =>
    ({ id, name, marks, att, asg, score: score(marks, att, asg) }));
  const riskKey = (s) => [r1(100 - s.score), -s.att];
  const cmpKey = (a, b) => (a[0] - b[0]) || (a[1] - b[1]);

  /* ---------- Module 1: max-heap ---------- */
  class MaxHeap {
    constructor() { this.a = []; }
    get size() { return this.a.length; }
    push(key, item) {
      const a = this.a; a.push([key, item]);
      let i = a.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (cmpKey(a[p][0], a[i][0]) < 0) { [a[p], a[i]] = [a[i], a[p]]; i = p; } else break;
      }
    }
    pop() {
      const a = this.a, top = a[0], last = a.pop();
      if (a.length) {
        a[0] = last; let i = 0; const n = a.length;
        for (;;) {
          const l = 2 * i + 1, r = l + 1; let m = i;
          if (l < n && cmpKey(a[l][0], a[m][0]) > 0) m = l;
          if (r < n && cmpKey(a[r][0], a[m][0]) > 0) m = r;
          if (m === i) break;
          [a[i], a[m]] = [a[m], a[i]]; i = m;
        }
      }
      return top;
    }
  }
  function heapSortByRisk(students) {
    const h = new MaxHeap();
    students.forEach((s) => h.push(riskKey(s), s));
    const out = []; while (h.size) out.push(h.pop()[1]);
    return out;
  }

  /* ---------- Module 1: AVL ---------- */
  class AVL {
    constructor() { this.root = null; this.rotations = 0; }
    h(n) { return n ? n.h : 0; }
    upd(n) { n.h = 1 + Math.max(this.h(n.l), this.h(n.r)); }
    rotR(y) { const x = y.l; y.l = x.r; x.r = y; this.upd(y); this.upd(x); this.rotations++; return x; }
    rotL(x) { const y = x.r; x.r = y.l; y.l = x; this.upd(x); this.upd(y); this.rotations++; return y; }
    ins(n, key, item) {
      if (!n) return { key, item, l: null, r: null, h: 1 };
      if (key < n.key) n.l = this.ins(n.l, key, item); else n.r = this.ins(n.r, key, item);
      this.upd(n);
      const bal = this.h(n.l) - this.h(n.r);
      if (bal > 1) { if (key >= n.l.key) n.l = this.rotL(n.l); return this.rotR(n); }
      if (bal < -1) { if (key < n.r.key) n.r = this.rotR(n.r); return this.rotL(n); }
      return n;
    }
    insert(key, item) { this.root = this.ins(this.root, key, item); }
    inorder() { const o = []; const go = (n) => { if (n) { go(n.l); o.push([n.key, n.item]); go(n.r); } }; go(this.root); return o; }
    range(lo, hi) {
      const o = [];
      const go = (n) => { if (!n) return; if (lo < n.key) go(n.l); if (n.key >= lo && n.key <= hi) o.push([n.key, n.item]); if (n.key < hi) go(n.r); };
      go(this.root); return o;
    }
    height() { return this.h(this.root); }
  }

  /* ---------- Module 2: graph ---------- */
  const vec = (s) => [s.marks / 100, s.att / 100, s.asg / 100];
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

  function buildGraph(students, thr = THRESHOLD) {
    const adj = {}; students.forEach((s) => (adj[s.id] = []));
    const edges = [];
    for (let i = 0; i < students.length; i++)
      for (let j = i + 1; j < students.length; j++) {
        const d = dist(vec(students[i]), vec(students[j]));
        if (d <= thr) {
          const a = students[i].id, b = students[j].id;
          adj[a].push([b, d]); adj[b].push([a, d]); edges.push([d, a, b]);
        }
      }
    return { adj, edges };
  }
  function bfs(adj, s) {
    const seen = new Set([s]), q = [s], order = [];
    while (q.length) { const u = q.shift(); order.push(u); for (const [v] of adj[u]) if (!seen.has(v)) { seen.add(v); q.push(v); } }
    return order;
  }
  function dfs(adj, s) {
    const seen = new Set(), order = [];
    const go = (u) => { seen.add(u); order.push(u); for (const [v] of adj[u]) if (!seen.has(v)) go(v); };
    go(s); return order;
  }
  function components(adj) {
    const seen = new Set(), comps = [];
    for (const u of Object.keys(adj)) if (!seen.has(u)) { const c = bfs(adj, u); c.forEach((x) => seen.add(x)); comps.push(c); }
    return comps;
  }
  function dijkstra(adj, s) {
    const d = {}, prev = {}; Object.keys(adj).forEach((u) => (d[u] = Infinity)); d[s] = 0;
    const done = new Set();
    for (;;) {                       // simple O(V^2) selection, fine for demo sizes
      let u = null;
      for (const k of Object.keys(d)) if (!done.has(k) && (u === null || d[k] < d[u])) u = k;
      if (u === null || d[u] === Infinity) break;
      done.add(u);
      for (const [v, w] of adj[u]) if (d[u] + w < d[v]) { d[v] = d[u] + w; prev[v] = u; }
    }
    return { d, prev };
  }
  function floyd(adj) {
    const nodes = Object.keys(adj), D = {};
    nodes.forEach((u) => { D[u] = {}; nodes.forEach((v) => (D[u][v] = u === v ? 0 : Infinity)); });
    nodes.forEach((u) => adj[u].forEach(([v, w]) => (D[u][v] = Math.min(D[u][v], w))));
    for (const k of nodes) for (const i of nodes) for (const j of nodes) if (D[i][k] + D[k][j] < D[i][j]) D[i][j] = D[i][k] + D[k][j];
    return D;
  }
  function kruskal(adj, edges) {
    const p = {}; Object.keys(adj).forEach((u) => (p[u] = u));
    const find = (x) => { while (p[x] !== x) { p[x] = p[p[x]]; x = p[x]; } return x; };
    const mst = []; let total = 0;
    [...edges].sort((a, b) => a[0] - b[0]).forEach(([d, a, b]) => {
      const ra = find(a), rb = find(b);
      if (ra !== rb) { p[ra] = rb; mst.push([a, b, d]); total += d; }
    });
    return { mst, total };
  }
  function findMentor(d, byId) {
    let best = null;
    for (const [sid, dd] of Object.entries(d))
      if (byId[sid].score >= MENTOR_MIN && dd < Infinity && (best === null || dd < best[1])) best = [sid, dd];
    return best;
  }
  function pathTo(prev, t) { const p = [t]; while (prev[t]) { t = prev[t]; p.unshift(t); } return p; }

  /* ---------- Module 3: DP ---------- */
  function knapsack(items, W) {
    const n = items.length, dp = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0));
    for (let i = 1; i <= n; i++) { const [, h, g] = items[i - 1];
      for (let w = 0; w <= W; w++) { dp[i][w] = dp[i - 1][w]; if (h <= w) dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - h] + g); } }
    const chosen = []; let w = W;
    for (let i = n; i > 0; i--) if (dp[i][w] !== dp[i - 1][w]) { chosen.unshift(items[i - 1][0]); w -= items[i - 1][1]; }
    return { best: dp[n][W], chosen, table: dp };
  }
  function knapsackBrute(items, W) {
    let best = 0;
    for (let m = 0; m < 1 << items.length; m++) {
      let h = 0, g = 0; items.forEach((it, i) => { if (m >> i & 1) { h += it[1]; g += it[2]; } });
      if (h <= W) best = Math.max(best, g);
    }
    return best;
  }
  function lcs(a, b) {
    const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    return dp[a.length][b.length];
  }

  /* ---------- Module 4: backtracking + B&B ---------- */
  function colourGraph(nodes, conflicts, k) {
    const adj = {}; nodes.forEach((n) => (adj[n] = new Set()));
    conflicts.forEach(([a, b]) => { adj[a].add(b); adj[b].add(a); });
    const col = {}, steps = [];
    const ok = (n, c) => [...adj[n]].every((m) => col[m] !== c);
    const go = (i) => {
      if (i === nodes.length) return true;
      const n = nodes[i];
      for (let c = 1; c <= k; c++) {
        if (ok(n, c)) { col[n] = c; steps.push(`${n} → slot ${c}`); if (go(i + 1)) return true; delete col[n]; steps.push(`undo ${n}`); }
        else steps.push(`${n} ✗ slot ${c} (clash)`);
      }
      return false;
    };
    return { colouring: go(0) ? { ...col } : null, steps };
  }
  const PLACES = ["Office", "Block A", "Block B", "Block C", "Library"];
  const TRAVEL = [[0,5,9,10,6],[5,0,4,8,9],[9,4,0,5,8],[10,8,5,0,6],[6,9,8,6,0]];
  function tspBnB(t) {
    const n = t.length; let best = Infinity, route = null; const st = { explored: 0, pruned: 0 };
    const go = (path, cost, left) => {
      st.explored++;
      if (cost >= best) { st.pruned++; return; }
      if (!left.length) { const tot = cost + t[path[path.length - 1]][0]; if (tot < best) { best = tot; route = [...path, 0]; } return; }
      [...left].sort((a, b) => t[path[path.length - 1]][a] - t[path[path.length - 1]][b])
        .forEach((v) => go([...path, v], cost + t[path[path.length - 1]][v], left.filter((x) => x !== v)));
    };
    go([0], 0, [...Array(n).keys()].slice(1));
    return { best, route, stats: st };
  }
  function tspBrute(t) {
    const n = t.length, idx = [...Array(n).keys()].slice(1); let best = Infinity;
    const perm = (a, k = 0) => { if (k === a.length) { let c = 0, p = 0; a.forEach((v) => { c += t[p][v]; p = v; }); best = Math.min(best, c + t[p][0]); return; }
      for (let i = k; i < a.length; i++) { [a[k], a[i]] = [a[i], a[k]]; perm(a, k + 1); [a[k], a[i]] = [a[i], a[k]]; } };
    perm(idx); return best;
  }

  /* ---------- helpers ---------- */
  function mulberry(seed) { return function () { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function synthetic(n, seed = 7) {
    const rnd = mulberry(seed), ri = (a, b) => a + Math.floor(rnd() * (b - a + 1)), rows = [];
    for (let i = 0; i < n; i++) rows.push(["R" + String(i).padStart(5, "0"), "N" + i, ri(25, 98), ri(35, 99), ri(25, 98)]);
    return rows;
  }

  const API = { THRESHOLD, AT_RISK, MENTOR_MIN, SAMPLE, score, makeRecords, riskKey, cmpKey, MaxHeap, heapSortByRisk, AVL,
    buildGraph, bfs, dfs, components, dijkstra, floyd, kruskal, findMentor, pathTo, knapsack, knapsackBrute, lcs,
    colourGraph, PLACES, TRAVEL, tspBnB, tspBrute, synthetic };
  if (typeof module !== "undefined" && module.exports) module.exports = API; else root.DSA = API;
})(typeof window !== "undefined" ? window : globalThis);
