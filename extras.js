// Remaining Unit 2 / Unit 3 topics from the report, used as verification tools and extra planners.
(function (G, H) {
  // Prim MST (min-heap), O(E log V). Runs over every component, so it returns a forest like Kruskal.
  G.prototype.prim = function () {
    const seen = new Set(), tree = []; let total = 0;
    for (const s of this.adj.keys()) {
      if (seen.has(s)) continue;
      seen.add(s); const h = new H();
      for (const { to, w } of this.adj.get(s)) h.push(w, [s, to]);
      while (h.size) {
        const [w, [u, v]] = h.pop();
        if (seen.has(v)) continue;
        seen.add(v); tree.push({ u, v, w }); total += w;
        for (const e of this.adj.get(v)) if (!seen.has(e.to)) h.push(e.w, [v, e.to]);
      }
    }
    return { tree, total };
  };
  // Bellman-Ford, O(V*E). Handles negative weights and reports a negative cycle.
  G.prototype.bellmanFord = function (src) {
    const dist = new Map(this.nodes().map(n => [n, Infinity])); dist.set(src, 0);
    const E = []; for (const [u, l] of this.adj) for (const { to, w } of l) E.push([u, to, w]);
    for (let i = 0; i < dist.size - 1; i++) {
      let changed = false;
      for (const [u, v, w] of E) if (dist.get(u) + w < dist.get(v)) { dist.set(v, dist.get(u) + w); changed = true; }
      if (!changed) break;
    }
    return { dist, negCycle: E.some(([u, v, w]) => dist.get(u) + w < dist.get(v)) };
  };
  // Floyd-Warshall all-pairs shortest paths, O(V^3).
  G.prototype.floydWarshall = function () {
    const N = this.nodes(), ix = new Map(N.map((n, i) => [n, i])), n = N.length;
    const d = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? 0 : Infinity));
    for (const [u, l] of this.adj) for (const { to, w } of l) { const a = ix.get(u), b = ix.get(to); d[a][b] = Math.min(d[a][b], w); }
    for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) {
      const dik = d[i][k]; if (dik === Infinity) continue;
      for (let j = 0; j < n; j++) if (dik + d[k][j] < d[i][j]) d[i][j] = dik + d[k][j];
    }
    return { nodes: N, d };
  };
})(Graph, MinHeap);

// Topological sort (Kahn), O(V+E). edges: [before, after]. cycle = true if no valid order exists.
function topoSort(nodes, edges) {
  const indeg = new Map(nodes.map(n => [n, 0])), adj = new Map(nodes.map(n => [n, []]));
  for (const [a, b] of edges) { adj.get(a).push(b); indeg.set(b, indeg.get(b) + 1); }
  const q = nodes.filter(n => indeg.get(n) === 0), order = [];
  for (let h = 0; h < q.length; h++) {
    const u = q[h]; order.push(u);
    for (const v of adj.get(u)) { indeg.set(v, indeg.get(v) - 1); if (indeg.get(v) === 0) q.push(v); }
  }
  return { order, cycle: order.length !== nodes.length };
}

// Matrix chain multiplication, O(n^3). p = dimension list, matrix i is p[i] x p[i+1].
function matrixChain(p) {
  const n = p.length - 1; if (n < 1) return { cost: 0, paren: '' };
  const m = Array.from({ length: n }, () => new Array(n).fill(0)), s = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let L = 2; L <= n; L++) for (let i = 0; i + L - 1 < n; i++) {
    const j = i + L - 1; m[i][j] = Infinity;
    for (let k = i; k < j; k++) { const c = m[i][k] + m[k + 1][j] + p[i] * p[k + 1] * p[j + 1]; if (c < m[i][j]) { m[i][j] = c; s[i][j] = k; } }
  }
  const f = (i, j) => i === j ? 'A' + (i + 1) : '(' + f(i, s[i][j]) + ' x ' + f(s[i][j] + 1, j) + ')';
  return { cost: m[0][n - 1], paren: f(0, n - 1) };
}

// Resource allocation DP, O(n*B^2): share B study hours among subjects. Each extra hour in a subject
// gains less than the last: gain(x) = v * (1 - 0.75^x). items: [{name, v}].
function allocateHours(items, B) {
  const n = items.length, g = (it, x) => it.v * (1 - Math.pow(0.75, x));
  const dp = Array.from({ length: n + 1 }, () => new Array(B + 1).fill(0)), pick = Array.from({ length: n + 1 }, () => new Array(B + 1).fill(0));
  for (let i = 1; i <= n; i++) for (let b = 0; b <= B; b++) {
    let best = -1, bx = 0;
    for (let x = 0; x <= b; x++) { const val = dp[i - 1][b - x] + g(items[i - 1], x); if (val > best + 1e-12) { best = val; bx = x; } }
    dp[i][b] = best; pick[i][b] = bx;
  }
  const alloc = {}; let b = B;
  for (let i = n; i >= 1; i--) { alloc[items[i - 1].name] = pick[i][b]; b -= pick[i][b]; }
  return { best: n ? dp[n][B] : 0, alloc };
}

// Seeded generator for large / edge-case test data (same seed gives the same students).
function makeStudents(n, seed = 7, subjects = typeof SUBJECTS !== 'undefined' ? SUBJECTS : []) {
  let a = seed;
  const r = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const c = x => Math.max(0, Math.min(100, Math.round(x))), out = [];
  for (let i = 0; i < n; i++) {
    const base = 20 + r() * 75, marks = {};
    subjects.forEach(u => marks[u.id] = c(base + (r() - 0.5) * 16));
    out.push({ roll: String(1000 + i), name: 'Student ' + (i + 1), sem: 3, marks, attendance: c(base * 0.6 + 35 + (r() - 0.5) * 30), assignment: c(base + (r() - 0.5) * 30),
      results: [c(base - 6 + (r() - 0.5) * 10), c(base - 3 + (r() - 0.5) * 10), c(base + (r() - 0.5) * 10)] });
  }
  return out;
}
if (typeof module !== 'undefined') module.exports = { topoSort, matrixChain, allocateHours, makeStudents };
