// Unit 2 (Graphs): adjacency list, BFS, DFS, connected components, Kruskal MST, Dijkstra.

// Binary min-heap used by Dijkstra. push/pop are O(log n).
class MinHeap {
  constructor() { this.a = []; }
  get size() { return this.a.length; }
  push(key, val) {
    const a = this.a; a.push([key, val]);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p][0] <= a[i][0]) break;
      [a[p], a[i]] = [a[i], a[p]]; i = p;
    }
  }
  pop() {
    const a = this.a; if (!a.length) return null;
    const top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last; let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]]; i = m;
      }
    }
    return top;
  }
}

// Undirected weighted graph stored as an adjacency list: O(V+E) space.
class Graph {
  constructor() { this.adj = new Map(); }
  addNode(n) { if (!this.adj.has(n)) this.adj.set(n, []); }
  addEdge(u, v, w = 1) {
    this.addNode(u); this.addNode(v);
    this.adj.get(u).push({ to: v, w });
    this.adj.get(v).push({ to: u, w });
  }
  nodes() { return [...this.adj.keys()]; }
  edges() {
    const out = [], seen = new Set();
    for (const [u, list] of this.adj) for (const { to, w } of list) {
      const k = u < to ? u + '|' + to : to + '|' + u;
      if (!seen.has(k)) { seen.add(k); out.push({ u, v: to, w }); }
    }
    return out;
  }
  // BFS, O(V+E): returns visit order and the level (hop count) of every reachable node.
  bfs(start) {
    const level = new Map([[start, 0]]), q = [start], order = [];
    for (let h = 0; h < q.length; h++) {
      const u = q[h]; order.push(u);
      for (const { to } of this.adj.get(u)) if (!level.has(to)) { level.set(to, level.get(u) + 1); q.push(to); }
    }
    return { order, level };
  }
  // Iterative DFS, O(V+E): returns visit order. `seen` can be shared across calls.
  dfs(start, seen = new Set()) {
    const order = [], stack = [start];
    while (stack.length) {
      const u = stack.pop();
      if (seen.has(u)) continue;
      seen.add(u); order.push(u);
      const list = this.adj.get(u);
      for (let i = list.length - 1; i >= 0; i--) if (!seen.has(list[i].to)) stack.push(list[i].to);
    }
    return order;
  }
  // Connected components via repeated DFS, O(V+E). Size-1 components are isolated nodes.
  components() {
    const seen = new Set(), result = [];
    for (const n of this.adj.keys()) if (!seen.has(n)) result.push(this.dfs(n, seen));
    return result;
  }
  // Kruskal minimum spanning forest, O(E log E), with union-find (path compression).
  kruskal() {
    const parent = new Map(this.nodes().map(n => [n, n]));
    const find = x => { while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x); } return x; };
    const sorted = this.edges().sort((a, b) => a.w - b.w);
    const tree = []; let total = 0;
    for (const e of sorted) {
      const a = find(e.u), b = find(e.v);
      if (a !== b) { parent.set(a, b); tree.push(e); total += e.w; }
    }
    return { tree, total };
  }
  // Dijkstra with a binary heap, O((V+E) log V). Weights must be >= 0 (they are distances).
  // If `goal(node)` is given, stops at the first (closest) node that satisfies it.
  dijkstra(src, goal) {
    const dist = new Map([[src, 0]]), prev = new Map(), done = new Set(), heap = new MinHeap();
    heap.push(0, src);
    while (heap.size) {
      const [d, u] = heap.pop();
      if (done.has(u)) continue;
      done.add(u);
      if (goal && goal(u)) return { dist, prev, found: u };
      for (const { to, w } of this.adj.get(u)) {
        const nd = d + w;
        if (nd < (dist.has(to) ? dist.get(to) : Infinity)) { dist.set(to, nd); prev.set(to, u); heap.push(nd, to); }
      }
    }
    return { dist, prev, found: null };
  }
  static path(prev, target) {
    const p = [target];
    while (prev.has(p[0])) p.unshift(prev.get(p[0]));
    return p;
  }
}
if (typeof module !== 'undefined') module.exports = { Graph, MinHeap };
