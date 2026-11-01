"""
Smart Student Progress Monitoring Dashboard
DSA-II PBL (CCSE0301) - NIET Greater Noida
Author: Ankit Singh (2501330100075)

Console prototype: python student_dashboard.py
Every algorithm is cross-checked against an independent (brute-force / built-in) result.
"""
import heapq
import itertools
import math
import random
from collections import deque
from functools import lru_cache

# ---------------------------------------------------------------- data
STUDENTS = [
    ("S01", "Aarav", 88, 94, 90), ("S02", "Bhavna", 82, 90, 85),
    ("S03", "Chirag", 76, 85, 80), ("S04", "Divya", 91, 96, 93),
    ("S05", "Esha", 45, 60, 50), ("S06", "Farhan", 52, 66, 48),
    ("S07", "Gauri", 38, 55, 42), ("S08", "Harsh", 70, 80, 72),
    ("S09", "Isha", 64, 75, 66), ("S10", "Jatin", 30, 40, 35),
    ("S11", "Kavya", 58, 70, 60), ("S12", "Lakshya", 85, 88, 87),
]
THRESHOLD = 0.15     # similarity distance threshold (design choice)
AT_RISK = 55         # score below this = at risk
MENTOR_MIN = 80      # mentor must score at least this


def score(m, a, s):
    """Progress score = 0.5*marks + 0.3*attendance + 0.2*assignments."""
    return round(0.5 * m + 0.3 * a + 0.2 * s, 1)


def build_records(rows):
    return [{"id": r, "name": n, "marks": m, "att": a, "asg": s,
             "score": score(m, a, s)} for r, n, m, a, s in rows]


def risk_key(st):
    """Max-heap key: higher risk first; ties -> lower attendance first."""
    return (round(100 - st["score"], 1), -st["att"])


# ---------------------------------------------------------------- module 1: heap
class MaxHeap:
    def __init__(self):
        self.a = []

    def push(self, key, item):
        self.a.append((key, item))
        i = len(self.a) - 1
        while i > 0 and self.a[(i - 1) // 2][0] < self.a[i][0]:
            p = (i - 1) // 2
            self.a[i], self.a[p] = self.a[p], self.a[i]
            i = p

    def pop(self):
        top = self.a[0]
        last = self.a.pop()
        if self.a:
            self.a[0] = last
            i, n = 0, len(self.a)
            while True:
                l, r, m = 2 * i + 1, 2 * i + 2, i
                if l < n and self.a[l][0] > self.a[m][0]:
                    m = l
                if r < n and self.a[r][0] > self.a[m][0]:
                    m = r
                if m == i:
                    break
                self.a[i], self.a[m] = self.a[m], self.a[i]
                i = m
        return top

    def __len__(self):
        return len(self.a)


def heap_sort_by_risk(students):
    h = MaxHeap()
    for st in students:
        h.push(risk_key(st), st)
    return [h.pop()[1] for _ in range(len(h))]


# ---------------------------------------------------------------- module 1: AVL
class Node:
    __slots__ = ("key", "item", "l", "r", "h")

    def __init__(self, key, item):
        self.key, self.item, self.l, self.r, self.h = key, item, None, None, 1


class AVL:
    def __init__(self):
        self.root = None
        self.rotations = 0

    @staticmethod
    def _h(n):
        return n.h if n else 0

    def _upd(self, n):
        n.h = 1 + max(self._h(n.l), self._h(n.r))

    def _rot_r(self, y):
        x = y.l
        y.l, x.r = x.r, y
        self._upd(y); self._upd(x)
        self.rotations += 1
        return x

    def _rot_l(self, x):
        y = x.r
        x.r, y.l = y.l, x
        self._upd(x); self._upd(y)
        self.rotations += 1
        return y

    def _ins(self, n, key, item):
        if not n:
            return Node(key, item)
        if key < n.key:
            n.l = self._ins(n.l, key, item)
        else:
            n.r = self._ins(n.r, key, item)
        self._upd(n)
        bal = self._h(n.l) - self._h(n.r)
        if bal > 1:
            if key >= n.l.key:
                n.l = self._rot_l(n.l)
            return self._rot_r(n)
        if bal < -1:
            if key < n.r.key:
                n.r = self._rot_r(n.r)
            return self._rot_l(n)
        return n

    def insert(self, key, item):
        self.root = self._ins(self.root, key, item)

    def inorder(self):
        out = []

        def go(n):
            if n:
                go(n.l); out.append((n.key, n.item)); go(n.r)
        go(self.root)
        return out

    def range(self, lo, hi):
        out = []

        def go(n):
            if not n:
                return
            if lo < n.key:
                go(n.l)
            if lo <= n.key <= hi:
                out.append((n.key, n.item))
            if n.key < hi:
                go(n.r)
        go(self.root)
        return out

    def height(self):
        return self._h(self.root)


# ---------------------------------------------------------------- module 2: graph
def vec(st):
    return (st["marks"] / 100, st["att"] / 100, st["asg"] / 100)


def build_graph(students, thr=THRESHOLD):
    """Adjacency list; edge weight = Euclidean distance (never negative)."""
    adj = {s["id"]: [] for s in students}
    edges = []
    for i in range(len(students)):          # O(n^2) pairwise comparison
        for j in range(i + 1, len(students)):
            d = math.dist(vec(students[i]), vec(students[j]))
            if d <= thr:
                a, b = students[i]["id"], students[j]["id"]
                adj[a].append((b, d)); adj[b].append((a, d))
                edges.append((d, a, b))
    return adj, edges


def bfs(adj, s):
    seen, q, order = {s}, deque([s]), []
    while q:
        u = q.popleft(); order.append(u)
        for v, _ in adj[u]:
            if v not in seen:
                seen.add(v); q.append(v)
    return order


def dfs(adj, s):
    seen, order = set(), []

    def go(u):
        seen.add(u); order.append(u)
        for v, _ in adj[u]:
            if v not in seen:
                go(v)
    go(s)
    return order


def components(adj):
    seen, comps = set(), []
    for u in adj:
        if u not in seen:
            c = bfs(adj, u); seen.update(c); comps.append(c)
    return comps


def dijkstra(adj, s):
    dist = {u: math.inf for u in adj}
    dist[s] = 0.0
    prev = {}
    pq = [(0.0, s)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        for v, w in adj[u]:
            if d + w < dist[v]:
                dist[v] = d + w; prev[v] = u
                heapq.heappush(pq, (dist[v], v))
    return dist, prev


def floyd_warshall(adj):
    nodes = list(adj)
    d = {u: {v: (0.0 if u == v else math.inf) for v in nodes} for u in nodes}
    for u in adj:
        for v, w in adj[u]:
            d[u][v] = min(d[u][v], w)
    for k in nodes:
        for i in nodes:
            for j in nodes:
                if d[i][k] + d[k][j] < d[i][j]:
                    d[i][j] = d[i][k] + d[k][j]
    return d


def kruskal(adj, edges):
    parent = {u: u for u in adj}

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]; x = parent[x]
        return x
    mst, total = [], 0.0
    for d, a, b in sorted(edges):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb; mst.append((a, b, d)); total += d
    return mst, total


def find_mentor(adj, dist_from, by_id):
    best = None
    for sid, d in dist_from.items():
        if sid != "" and by_id[sid]["score"] >= MENTOR_MIN and d < math.inf:
            if best is None or d < best[1]:
                best = (sid, d)
    return best


# ---------------------------------------------------------------- module 3: DP
def knapsack(items, W):
    """items = [(name, hours, gain)] -> (best gain, chosen names)."""
    n = len(items)
    dp = [[0] * (W + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        _, h, g = items[i - 1]
        for w in range(W + 1):
            dp[i][w] = dp[i - 1][w]
            if h <= w:
                dp[i][w] = max(dp[i][w], dp[i - 1][w - h] + g)
    chosen, w = [], W
    for i in range(n, 0, -1):
        if dp[i][w] != dp[i - 1][w]:
            chosen.append(items[i - 1][0]); w -= items[i - 1][1]
    return dp[n][W], chosen[::-1]


def knapsack_brute(items, W):
    best = 0
    for mask in range(1 << len(items)):
        h = sum(items[i][1] for i in range(len(items)) if mask >> i & 1)
        g = sum(items[i][2] for i in range(len(items)) if mask >> i & 1)
        if h <= W:
            best = max(best, g)
    return best


def lcs(a, b):
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            dp[i][j] = dp[i - 1][j - 1] + 1 if a[i - 1] == b[j - 1] \
                else max(dp[i - 1][j], dp[i][j - 1])
    return dp[-1][-1]


def lcs_brute(a, b):
    best = 0
    for mask in range(1 << len(a)):
        sub = "".join(a[i] for i in range(len(a)) if mask >> i & 1)
        it = iter(b)
        if all(c in it for c in sub):
            best = max(best, len(sub))
    return best


class SemesterAverages:
    """Memoised semester averages: repeated dashboard refreshes reuse results."""

    def __init__(self, marks):
        self.marks = marks          # {student: [sem1..semN]}
        self.computed = 0
        self.cache = {}

    def avg(self, sid, sem, memo=True):
        if memo and (sid, sem) in self.cache:
            return self.cache[(sid, sem)]
        self.computed += 1
        v = sum(self.marks[sid][:sem]) / sem
        if memo:
            self.cache[(sid, sem)] = v
        return v


# ---------------------------------------------------------------- module 4: backtracking
def colour_graph(nodes, conflicts, k):
    adj = {n: set() for n in nodes}
    for a, b in conflicts:
        adj[a].add(b); adj[b].add(a)
    col = {}

    def ok(n, c):
        return all(col.get(m) != c for m in adj[n])

    def go(i):
        if i == len(nodes):
            return True
        n = nodes[i]
        for c in range(1, k + 1):
            if ok(n, c):
                col[n] = c
                if go(i + 1):
                    return True
                del col[n]          # backtrack
        return False
    return dict(col) if go(0) else None


def colour_brute(nodes, conflicts, k):
    for combo in itertools.product(range(1, k + 1), repeat=len(nodes)):
        c = dict(zip(nodes, combo))
        if all(c[a] != c[b] for a, b in conflicts):
            return c
    return None


PLACES = ["Office", "Block A", "Block B", "Block C", "Library"]
# fixed synthetic travel times (minutes) - symmetric
TRAVEL = [
    [0, 5, 9, 10, 6],
    [5, 0, 4, 8, 9],
    [9, 4, 0, 5, 8],
    [10, 8, 5, 0, 6],
    [6, 9, 8, 6, 0],
]


def tsp_branch_and_bound(t):
    n = len(t)
    best = [math.inf, None]
    stats = {"explored": 0, "pruned": 0}

    def go(path, cost, left):
        stats["explored"] += 1
        if cost >= best[0]:               # bound: cannot beat best
            stats["pruned"] += 1
            return
        if not left:
            total = cost + t[path[-1]][0]
            if total < best[0]:
                best[0], best[1] = total, path + [0]
            return
        for v in sorted(left, key=lambda x: t[path[-1]][x]):
            go(path + [v], cost + t[path[-1]][v], left - {v})
    go([0], 0, set(range(1, n)))
    return best[0], best[1], stats


def tsp_brute(t):
    n = len(t)
    return min(sum(t[a][b] for a, b in zip((0,) + p, p + (0,)))
               for p in itertools.permutations(range(1, n)))


# ---------------------------------------------------------------- benchmark data
def synthetic(n, seed=7):
    rnd = random.Random(seed)
    rows = []
    for i in range(n):
        rows.append((f"R{i:05d}", f"N{i}", rnd.randint(25, 98),
                     rnd.randint(35, 99), rnd.randint(25, 98)))
    return rows


# ---------------------------------------------------------------- run + tests
def main():
    S = build_records(STUDENTS)
    by_id = {s["id"]: s for s in S}
    results = []

    def check(name, cond, note=""):
        results.append(cond)
        print(f"[{'PASS' if cond else 'FAIL'}] {name} {note}")

    print("=== Progress scores ===")
    for s in S:
        flag = "At-risk" if s["score"] < AT_RISK else "OK"
        print(f'{s["id"]} {s["name"]:8} {s["score"]:5.1f} {flag}')
    at_risk = [s["id"] for s in S if s["score"] < AT_RISK]
    check("Progress score and risk flag", set(at_risk) == {"S05", "S07", "S10"}, at_risk)

    print("\n=== Module 1: heap + AVL ===")
    ranked = heap_sort_by_risk(S)
    builtin = sorted(S, key=risk_key, reverse=True)
    check("Heap sort ranking", [r["id"] for r in ranked][:3] == ["S10", "S07", "S05"]
          and [risk_key(r) for r in ranked] == [risk_key(r) for r in builtin],
          [r["id"] for r in ranked][:5])
    t = AVL()
    for s in S:
        t.insert(s["score"], s)
    keys = [k for k, _ in t.inorder()]
    check("AVL in-order traversal", keys == sorted(keys), f"height={t.height()} rotations={t.rotations}")
    rq = [i["id"] for _, i in t.range(40, 60)]
    plain = [s["id"] for s in sorted(S, key=lambda x: x["score"]) if 40 <= s["score"] <= 60]
    check("AVL range query 40-60", sorted(rq) == sorted(plain), rq)

    print("\n=== Module 2: graph ===")
    adj, edges = build_graph(S)
    comps = components(adj)
    print("edges:", len(edges), "components:", [len(c) for c in comps])
    check("Connected components", len(comps) == 2 and ["S10"] in comps)
    check("BFS vs DFS from S05", set(bfs(adj, "S05")) == set(dfs(adj, "S05")) and len(bfs(adj, "S05")) == 11)
    fw = floyd_warshall(adj)
    dj_ok = True
    for u in adj:
        d, _ = dijkstra(adj, u)
        for v in adj:
            if not (d[v] == fw[u][v] or abs(d[v] - fw[u][v]) < 1e-9):
                dj_ok = False
    check("Dijkstra vs Floyd-Warshall", dj_ok)
    mst, total = kruskal(adj, edges)
    check("Kruskal MST", len(mst) == len(S) - len(comps), f"edges={len(mst)} weight={total:.3f}")
    ok = True
    for sid in at_risk:
        d, _ = dijkstra(adj, sid)
        m = find_mentor(adj, d, by_id)
        print(f"mentor for {sid}:", None if not m else f"{m[0]} dist={m[1]:.3f}")
    d5, _ = dijkstra(adj, "S05"); d7, _ = dijkstra(adj, "S07"); d10, _ = dijkstra(adj, "S10")
    ok = (find_mentor(adj, d5, by_id)[0] == "S02" and find_mentor(adj, d7, by_id)[0] == "S02"
          and find_mentor(adj, d10, by_id) is None)
    check("Mentor search", ok)

    print("\n=== Module 3: dynamic programming ===")
    topics = [("DSA", 4, 12), ("DBMS", 3, 8), ("OS", 2, 5), ("Maths", 3, 9), ("Project work", 5, 10)]
    g, chosen = knapsack(topics, 10)
    check("0/1 knapsack, 10 hours", g == knapsack_brute(topics, 10) == 29, chosen)
    a, b = "AGGTABXYZ12", "GXTXAYB12Z"
    check("LCS = brute force", lcs(a, b) == lcs_brute(a, b), lcs(a, b))
    print("LCS S0123 vs S0132:", lcs("S0123", "S0132"), "of 5 (probable typo)")
    marks = {s["id"]: [random.Random(i).randint(40, 95) for i in range(6)] for s in S}
    memo = SemesterAverages(marks)
    for _ in range(5):
        for s in S:
            for sem in range(1, 7):
                memo.avg(s["id"], sem)
    check("Memoization", memo.computed == 72, f"{memo.computed} computations instead of 360")

    print("\n=== Module 4: backtracking + branch and bound ===")
    conflicts = [("S05", "S06"), ("S05", "S07"), ("S05", "S10"), ("S06", "S10"),
                 ("S07", "S10"), ("S10", "S11")]
    nodes = ["S10", "S05", "S06", "S07", "S11"]
    two = colour_graph(nodes, conflicts, 2)
    three = colour_graph(nodes, conflicts, 3)
    check("Slot colouring", two is None and three is not None
          and colour_brute(nodes, conflicts, 2) is None and colour_brute(nodes, conflicts, 3) is not None,
          three)
    best, route, st = tsp_branch_and_bound(TRAVEL)
    check("Branch and bound round", best == tsp_brute(TRAVEL), f"{best} min, {[PLACES[i] for i in route]}, {st}")

    print("\n=== Benchmarks (synthetic, times vary) ===")
    import time
    for n, thr in ((1500, 0.08),):
        R = build_records(synthetic(n))
        t0 = time.perf_counter(); ad, ed = build_graph(R, thr); t1 = time.perf_counter()
        cc = components(ad); t2 = time.perf_counter()
        print(f"n={n} thr={thr}: edges={len(ed)} build={t1 - t0:.2f}s components={len(cc)} ({t2 - t1:.3f}s)")
    R = build_records(synthetic(20000))
    t0 = time.perf_counter(); hs = heap_sort_by_risk(R); t1 = time.perf_counter()
    check("Heap sort on 20,000 records", [risk_key(x) for x in hs] == sorted((risk_key(x) for x in R), reverse=True),
          f"{t1 - t0:.2f}s")

    print(f"\n{sum(results)}/{len(results)} checks passed")
    return all(results)


if __name__ == "__main__":
    raise SystemExit(0 if main() else 1)
