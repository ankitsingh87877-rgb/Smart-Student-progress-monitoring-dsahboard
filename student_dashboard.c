/*
 * Smart Student Progress Monitoring Dashboard  (C implementation)
 * DSA-II PBL (CCSE0301) - NIET Greater Noida
 * Author: Ankit Singh (2501330100075)
 *
 * Build:  gcc -O2 -Wall -Wextra -o student_dashboard student_dashboard.c -lm
 * Run:    ./student_dashboard
 *
 * Every algorithm is cross-checked against an independent (brute-force) result.
 *
 * Note: progress score = 0.5*marks + 0.3*attendance + 0.2*assignments.
 * Multiplying by 10 gives the exact integer 5*m + 3*a + 2*s, so all ranking
 * and AVL comparisons use integers ("score10") and avoid floating-point ties.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <time.h>

#define MAXN 20000   /* large enough for the 20,000-record benchmark */
#define THRESHOLD 0.15
#define AT_RISK10 550     /* score < 55.0  */
#define MENTOR10  800     /* score >= 80.0 */
#define INF 1e18

/* ------------------------------------------------------------ data */
typedef struct {
    char id[8], name[16];
    int marks, att, asg;
    int score10;                 /* 10 * progress score (exact integer) */
} Student;

static Student S[MAXN];
static int N = 0;

static void add_student(const char *id, const char *name, int m, int a, int s) {
    Student *p = &S[N++];
    snprintf(p->id, sizeof p->id, "%s", id);
    snprintf(p->name, sizeof p->name, "%s", name);
    p->marks = m; p->att = a; p->asg = s;
    p->score10 = 5 * m + 3 * a + 2 * s;
}

static void load_sample(void) {
    N = 0;
    add_student("S01", "Aarav", 88, 94, 90);  add_student("S02", "Bhavna", 82, 90, 85);
    add_student("S03", "Chirag", 76, 85, 80); add_student("S04", "Divya", 91, 96, 93);
    add_student("S05", "Esha", 45, 60, 50);   add_student("S06", "Farhan", 52, 66, 48);
    add_student("S07", "Gauri", 38, 55, 42);  add_student("S08", "Harsh", 70, 80, 72);
    add_student("S09", "Isha", 64, 75, 66);   add_student("S10", "Jatin", 30, 40, 35);
    add_student("S11", "Kavya", 58, 70, 60);  add_student("S12", "Lakshya", 85, 88, 87);
}

static int find_id(const char *id) {
    for (int i = 0; i < N; i++) if (strcmp(S[i].id, id) == 0) return i;
    return -1;
}

/* risk key: higher risk first; ties -> lower attendance first.
   Returns >0 if a is "more at risk" than b. */
static int risk_cmp(int a, int b) {
    int ra = 1000 - S[a].score10, rb = 1000 - S[b].score10;
    if (ra != rb) return ra > rb ? 1 : -1;
    if (S[a].att != S[b].att) return S[a].att < S[b].att ? 1 : -1;
    return 0;
}

/* ------------------------------------------------------------ module 1: max-heap */
typedef struct { int a[MAXN]; int n; } Heap;   /* stores student indices */

static void heap_push(Heap *h, int v) {
    int i = h->n++;
    h->a[i] = v;
    while (i > 0) {
        int p = (i - 1) / 2;
        if (risk_cmp(h->a[p], h->a[i]) < 0) { int t = h->a[p]; h->a[p] = h->a[i]; h->a[i] = t; i = p; }
        else break;
    }
}

static int heap_pop(Heap *h) {
    int top = h->a[0];
    h->a[0] = h->a[--h->n];
    int i = 0;
    for (;;) {
        int l = 2 * i + 1, r = l + 1, m = i;
        if (l < h->n && risk_cmp(h->a[l], h->a[m]) > 0) m = l;
        if (r < h->n && risk_cmp(h->a[r], h->a[m]) > 0) m = r;
        if (m == i) break;
        int t = h->a[i]; h->a[i] = h->a[m]; h->a[m] = t; i = m;
    }
    return top;
}

/* heap sort: ranked[] receives student indices, most at-risk first. O(n log n) */
static void heap_sort_by_risk(int *ranked) {
    Heap *h = calloc(1, sizeof *h);
    for (int i = 0; i < N; i++) heap_push(h, i);
    for (int i = 0; !(h->n == 0); i++) ranked[i] = heap_pop(h);
    free(h);
}

/* ------------------------------------------------------------ module 1: AVL */
typedef struct AvlNode { int key, idx, h; struct AvlNode *l, *r; } AvlNode;
static int rotations = 0;

static int hgt(AvlNode *n) { return n ? n->h : 0; }
static void upd(AvlNode *n) { int a = hgt(n->l), b = hgt(n->r); n->h = 1 + (a > b ? a : b); }
static AvlNode *rot_r(AvlNode *y) { AvlNode *x = y->l; y->l = x->r; x->r = y; upd(y); upd(x); rotations++; return x; }
static AvlNode *rot_l(AvlNode *x) { AvlNode *y = x->r; x->r = y->l; y->l = x; upd(x); upd(y); rotations++; return y; }

static AvlNode *avl_insert(AvlNode *n, int key, int idx) {
    if (!n) { AvlNode *t = calloc(1, sizeof *t); t->key = key; t->idx = idx; t->h = 1; return t; }
    if (key < n->key) n->l = avl_insert(n->l, key, idx); else n->r = avl_insert(n->r, key, idx);
    upd(n);
    int bal = hgt(n->l) - hgt(n->r);
    if (bal > 1)  { if (key >= n->l->key) n->l = rot_l(n->l); return rot_r(n); }
    if (bal < -1) { if (key <  n->r->key) n->r = rot_r(n->r); return rot_l(n); }
    return n;
}

static void avl_inorder(AvlNode *n, int *out, int *cnt) {
    if (!n) return;
    avl_inorder(n->l, out, cnt); out[(*cnt)++] = n->key; avl_inorder(n->r, out, cnt);
}

/* range query [lo,hi] in O(log n + k); results in out[] (student indices) */
static void avl_range(AvlNode *n, int lo, int hi, int *out, int *cnt) {
    if (!n) return;
    if (lo < n->key) avl_range(n->l, lo, hi, out, cnt);
    if (n->key >= lo && n->key <= hi) out[(*cnt)++] = n->idx;
    if (n->key < hi) avl_range(n->r, lo, hi, out, cnt);
}

static void avl_free(AvlNode *n) { if (n) { avl_free(n->l); avl_free(n->r); free(n); } }

/* ------------------------------------------------------------ module 2: graph */
typedef struct Edge { int to; double w; struct Edge *next; } Edge;     /* adjacency list */
typedef struct { int u, v; double w; } EdgeRec;

static Edge *adj[MAXN];
static EdgeRec *edges = NULL;
static int E = 0, Ecap = 0;

static double sdist(int a, int b) {
    double dm = (S[a].marks - S[b].marks) / 100.0, da = (S[a].att - S[b].att) / 100.0, ds = (S[a].asg - S[b].asg) / 100.0;
    return sqrt(dm * dm + da * da + ds * ds);
}

static void add_edge(int u, int v, double w) {
    Edge *e = malloc(sizeof *e); e->to = v; e->w = w; e->next = adj[u]; adj[u] = e;
    e = malloc(sizeof *e); e->to = u; e->w = w; e->next = adj[v]; adj[v] = e;
    if (E == Ecap) { Ecap = Ecap ? Ecap * 2 : 64; edges = realloc(edges, Ecap * sizeof *edges); }
    edges[E++] = (EdgeRec){u, v, w};
}

static void graph_free(void) {
    for (int i = 0; i < N; i++) { Edge *e = adj[i]; while (e) { Edge *t = e->next; free(e); e = t; } adj[i] = NULL; }
    free(edges); edges = NULL; E = Ecap = 0;
}

/* O(n^2) pairwise comparison */
static void build_graph(double thr) {
    graph_free();
    for (int i = 0; i < N; i++)
        for (int j = i + 1; j < N; j++) { double d = sdist(i, j); if (d <= thr) add_edge(i, j, d); }
}

static int bfs(int s, int *order) {
    int q[MAXN], head = 0, tail = 0, seen[MAXN] = {0}, cnt = 0;
    q[tail++] = s; seen[s] = 1;
    while (head < tail) {
        int u = q[head++]; order[cnt++] = u;
        for (Edge *e = adj[u]; e; e = e->next) if (!seen[e->to]) { seen[e->to] = 1; q[tail++] = e->to; }
    }
    return cnt;
}

static void dfs_rec(int u, int *seen, int *order, int *cnt) {
    seen[u] = 1; order[(*cnt)++] = u;
    for (Edge *e = adj[u]; e; e = e->next) if (!seen[e->to]) dfs_rec(e->to, seen, order, cnt);
}
static int dfs(int s, int *order) { int seen[MAXN] = {0}, cnt = 0; dfs_rec(s, seen, order, &cnt); return cnt; }

static int components(int *comp) {            /* comp[i] = component id; returns count */
    int seen[MAXN] = {0}, order[MAXN], nc = 0;
    for (int i = 0; i < N; i++) if (!seen[i]) {
        int c = bfs(i, order);
        for (int k = 0; k < c; k++) { seen[order[k]] = 1; comp[order[k]] = nc; }
        nc++;
    }
    return nc;
}

/* Dijkstra (non-negative weights): O(V^2) selection, fine for class-sized graphs */
static void dijkstra(int s, double *d, int *prev) {
    int done[MAXN] = {0};
    for (int i = 0; i < N; i++) { d[i] = INF; prev[i] = -1; }
    d[s] = 0;
    for (;;) {
        int u = -1;
        for (int i = 0; i < N; i++) if (!done[i] && (u < 0 || d[i] < d[u])) u = i;
        if (u < 0 || d[u] >= INF) break;
        done[u] = 1;
        for (Edge *e = adj[u]; e; e = e->next) if (d[u] + e->w < d[e->to]) { d[e->to] = d[u] + e->w; prev[e->to] = u; }
    }
}

/* Floyd-Warshall, used only to cross-check Dijkstra */
static double *FWm = NULL;                       /* N x N matrix, allocated per call */
#define FW(i, j) FWm[(size_t)(i) * N + (j)]
static void floyd(void) {
    free(FWm); FWm = malloc((size_t)N * N * sizeof *FWm);
    for (int i = 0; i < N; i++) for (int j = 0; j < N; j++) FW(i, j) = (i == j) ? 0 : INF;
    for (int i = 0; i < N; i++) for (Edge *e = adj[i]; e; e = e->next) if (e->w < FW(i, e->to)) FW(i, e->to) = e->w;
    for (int k = 0; k < N; k++) for (int i = 0; i < N; i++) for (int j = 0; j < N; j++)
        if (FW(i, k) + FW(k, j) < FW(i, j)) FW(i, j) = FW(i, k) + FW(k, j);
}

static int cmp_edge(const void *a, const void *b) {
    double x = ((const EdgeRec *)a)->w, y = ((const EdgeRec *)b)->w;
    return (x > y) - (x < y);
}
static int uf_find(int *p, int x) { while (p[x] != x) { p[x] = p[p[x]]; x = p[x]; } return x; }

/* Kruskal: O(E log E). Returns number of MST edges; total weight in *total */
static int kruskal(double *total) {
    EdgeRec *sorted = malloc((E ? E : 1) * sizeof *sorted);
    memcpy(sorted, edges, E * sizeof *sorted);
    qsort(sorted, E, sizeof *sorted, cmp_edge);
    int p[MAXN], cnt = 0;
    for (int i = 0; i < N; i++) p[i] = i;
    *total = 0;
    for (int i = 0; i < E; i++) {
        int a = uf_find(p, sorted[i].u), b = uf_find(p, sorted[i].v);
        if (a != b) { p[a] = b; cnt++; *total += sorted[i].w; }
    }
    free(sorted);
    return cnt;
}

/* nearest student (by path distance) whose score >= 80; returns index or -1 */
static int find_mentor(const double *d, double *dist_out) {
    int best = -1;
    for (int i = 0; i < N; i++)
        if (S[i].score10 >= MENTOR10 && d[i] < INF && (best < 0 || d[i] < d[best])) best = i;
    if (best >= 0) *dist_out = d[best];
    return best;
}

/* ------------------------------------------------------------ module 3: DP */
typedef struct { const char *name; int hours, gain; } Topic;

static int knapsack(const Topic *t, int n, int W, int *chosen) {
    int (*dp)[64] = calloc(n + 1, sizeof *dp);
    for (int i = 1; i <= n; i++)
        for (int w = 0; w <= W; w++) {
            dp[i][w] = dp[i - 1][w];
            if (t[i - 1].hours <= w && dp[i - 1][w - t[i - 1].hours] + t[i - 1].gain > dp[i][w])
                dp[i][w] = dp[i - 1][w - t[i - 1].hours] + t[i - 1].gain;
        }
    int w = W;
    for (int i = n; i > 0; i--) {
        chosen[i - 1] = (dp[i][w] != dp[i - 1][w]);
        if (chosen[i - 1]) w -= t[i - 1].hours;
    }
    int best = dp[n][W];
    free(dp);
    return best;
}

static int knapsack_brute(const Topic *t, int n, int W) {
    int best = 0;
    for (int m = 0; m < (1 << n); m++) {
        int h = 0, g = 0;
        for (int i = 0; i < n; i++) if (m >> i & 1) { h += t[i].hours; g += t[i].gain; }
        if (h <= W && g > best) best = g;
    }
    return best;
}

static int lcs(const char *a, const char *b) {
    int la = (int)strlen(a), lb = (int)strlen(b);
    int dp[64][64] = {{0}};
    for (int i = 1; i <= la; i++) for (int j = 1; j <= lb; j++)
        dp[i][j] = (a[i - 1] == b[j - 1]) ? dp[i - 1][j - 1] + 1 : (dp[i - 1][j] > dp[i][j - 1] ? dp[i - 1][j] : dp[i][j - 1]);
    return dp[la][lb];
}

static int lcs_brute(const char *a, const char *b) {
    int la = (int)strlen(a), lb = (int)strlen(b), best = 0;
    for (int m = 0; m < (1 << la); m++) {
        int j = 0, len = 0;
        for (int i = 0; i < la; i++) if (m >> i & 1) {
            while (j < lb && b[j] != a[i]) j++;
            if (j == lb) { len = -1; break; }
            j++; len++;
        }
        if (len > best) best = len;
    }
    return best;
}

/* memoised semester averages: avg(student, sem) = mean of first `sem` semester marks */
static int sem_marks[MAXN][6];
static double memo_val[MAXN][7];
static int memo_has[MAXN][7], memo_computed = 0;
static double sem_avg(int s, int sem, int use_memo) {
    if (use_memo && memo_has[s][sem]) return memo_val[s][sem];
    memo_computed++;
    double sum = 0;
    for (int k = 0; k < sem; k++) sum += sem_marks[s][k];
    double v = sum / sem;
    if (use_memo) { memo_has[s][sem] = 1; memo_val[s][sem] = v; }
    return v;
}

/* ------------------------------------------------------------ module 4: backtracking + B&B */
#define SN 5
static const char *slot_names[SN] = {"S10", "S05", "S06", "S07", "S11"};
static int slot_idx[SN];
static int conf[SN][SN];
static const char *conflict_pairs[][2] = {{"S05","S06"},{"S05","S07"},{"S05","S10"},{"S06","S10"},{"S07","S10"},{"S10","S11"}};
static int slot_of[SN];

static void init_conflicts(void) {
    memset(conf, 0, sizeof conf);
    for (int i = 0; i < SN; i++) slot_idx[i] = i;
    for (size_t k = 0; k < sizeof conflict_pairs / sizeof conflict_pairs[0]; k++) {
        int a = -1, b = -1;
        for (int i = 0; i < SN; i++) {
            if (!strcmp(slot_names[i], conflict_pairs[k][0])) a = i;
            if (!strcmp(slot_names[i], conflict_pairs[k][1])) b = i;
        }
        conf[a][b] = conf[b][a] = 1;
    }
}

static int colour_ok(int n, int c) { for (int m = 0; m < n; m++) if (conf[n][m] && slot_of[m] == c) return 0; return 1; }
static int colour_bt(int n, int k) {                     /* backtracking */
    if (n == SN) return 1;
    for (int c = 1; c <= k; c++)
        if (colour_ok(n, c)) { slot_of[n] = c; if (colour_bt(n + 1, k)) return 1; slot_of[n] = 0; }   /* undo */
    return 0;
}
static int colour_brute(int k) {                         /* try every assignment */
    int total = 1; for (int i = 0; i < SN; i++) total *= k;
    for (int code = 0; code < total; code++) {
        int c[SN], x = code, ok = 1;
        for (int i = 0; i < SN; i++) { c[i] = x % k; x /= k; }
        for (int i = 0; i < SN && ok; i++) for (int j = i + 1; j < SN; j++) if (conf[i][j] && c[i] == c[j]) { ok = 0; break; }
        if (ok) return 1;
    }
    return 0;
}

#define PN 5
static const char *place[PN] = {"Office", "Block A", "Block B", "Block C", "Library"};
static const int TRAVEL[PN][PN] = {          /* fixed synthetic minutes (symmetric) */
    {0, 5, 9, 10, 6}, {5, 0, 4, 8, 9}, {9, 4, 0, 5, 8}, {10, 8, 5, 0, 6}, {6, 9, 8, 6, 0}};
static int bb_best, bb_route[PN + 1], bb_explored, bb_pruned;

static void bb_go(int *path, int len, int cost, int used) {
    bb_explored++;
    if (cost >= bb_best) { bb_pruned++; return; }        /* bound: cannot beat best */
    if (len == PN) {
        int tot = cost + TRAVEL[path[len - 1]][0];
        if (tot < bb_best) { bb_best = tot; memcpy(bb_route, path, len * sizeof(int)); bb_route[len] = 0; }
        return;
    }
    for (int v = 1; v < PN; v++) if (!(used >> v & 1)) {
        path[len] = v;
        bb_go(path, len + 1, cost + TRAVEL[path[len - 1]][v], used | 1 << v);
    }
}
static void tsp_bb(void) { int path[PN + 1] = {0}; bb_best = 1 << 30; bb_explored = bb_pruned = 0; bb_go(path, 1, 0, 1); }

static int brute_best;
static void brute_go(int *path, int len, int cost, int used) {
    if (len == PN) { int t = cost + TRAVEL[path[len - 1]][0]; if (t < brute_best) brute_best = t; return; }
    for (int v = 1; v < PN; v++) if (!(used >> v & 1)) { path[len] = v; brute_go(path, len + 1, cost + TRAVEL[path[len - 1]][v], used | 1 << v); }
}
static int tsp_brute(void) { int path[PN] = {0}; brute_best = 1 << 30; brute_go(path, 1, 0, 1); return brute_best; }

/* ------------------------------------------------------------ test harness */
static int passed = 0, total_checks = 0;
static void check(const char *name, int ok) {
    total_checks++; passed += ok;
    printf("[%s] %s\n", ok ? "PASS" : "FAIL", name);
}

static int is_perm_equal_keys(const int *ranked) {      /* heap order vs built-in qsort order, comparing keys */
    int ref[MAXN];
    for (int i = 0; i < N; i++) ref[i] = i;
    for (int i = 1; i < N; i++) {                         /* insertion sort, independent of the heap */
        int x = ref[i], j = i - 1;
        while (j >= 0 && risk_cmp(ref[j], x) < 0) { ref[j + 1] = ref[j]; j--; }
        ref[j + 1] = x;
    }
    for (int i = 0; i < N; i++) if (risk_cmp(ranked[i], ref[i]) != 0) return 0;
    return 1;
}

static void print_list(const int *idx, int n) { for (int i = 0; i < n; i++) printf("%s%s", i ? ", " : "", S[idx[i]].id); }

/* synthetic data (simple LCG so results are repeatable on every compiler) */
static unsigned long long rng = 7;
static int rnd(int lo, int hi) { rng = rng * 6364136223846793005ULL + 1442695040888963407ULL; return lo + (int)((rng >> 33) % (unsigned)(hi - lo + 1)); }

int main(void) {
    load_sample();
    printf("=== Progress scores ===\n");
    for (int i = 0; i < N; i++)
        printf("%s %-8s %5.1f %s\n", S[i].id, S[i].name, S[i].score10 / 10.0, S[i].score10 < AT_RISK10 ? "At-risk" : "OK");
    int risky[MAXN], nr = 0;
    for (int i = 0; i < N; i++) if (S[i].score10 < AT_RISK10) risky[nr++] = i;
    check("Progress score and risk flag (S05, S07, S10)", nr == 3 && !strcmp(S[risky[0]].id, "S05") && !strcmp(S[risky[1]].id, "S07") && !strcmp(S[risky[2]].id, "S10"));

    printf("\n=== Module 1: heap + AVL ===\n");
    int ranked[MAXN];
    heap_sort_by_risk(ranked);
    printf("risk ranking: "); print_list(ranked, N); printf("\n");
    check("Heap sort ranking (S10, S07, S05 first; equals independent sort)",
          !strcmp(S[ranked[0]].id, "S10") && !strcmp(S[ranked[1]].id, "S07") && !strcmp(S[ranked[2]].id, "S05") && is_perm_equal_keys(ranked));
    AvlNode *root = NULL;
    for (int i = 0; i < N; i++) root = avl_insert(root, S[i].score10, i);
    int keys[MAXN], kc = 0, sorted_ok = 1;
    avl_inorder(root, keys, &kc);
    for (int i = 1; i < kc; i++) if (keys[i - 1] > keys[i]) sorted_ok = 0;
    printf("AVL height %d, rotations %d\n", hgt(root), rotations);
    check("AVL in-order traversal sorted", sorted_ok && kc == N);
    int rq[MAXN], rc = 0; avl_range(root, 400, 600, rq, &rc);
    printf("range 40-60: "); print_list(rq, rc); printf("\n");
    int plain[MAXN], pc = 0;
    for (int i = 0; i < N; i++) if (S[i].score10 >= 400 && S[i].score10 <= 600) plain[pc++] = i;
    int same = (rc == pc);
    for (int i = 0; i < rc && same; i++) { int f = 0; for (int j = 0; j < pc; j++) if (plain[j] == rq[i]) f = 1; if (!f) same = 0; }
    check("AVL range query 40-60 equals plain filter (S07, S05, S06)", same && rc == 3);
    check("AVL height 4 after 7 rotations", hgt(root) == 4 && rotations == 7);
    avl_free(root);

    printf("\n=== Module 2: graph ===\n");
    build_graph(THRESHOLD);
    int comp[MAXN], nc = components(comp);
    printf("edges: %d, components: %d\n", E, nc);
    check("Connected components: 14 edges, 2 clusters, S10 isolated", E == 14 && nc == 2 && comp[find_id("S10")] != comp[find_id("S05")]);
    int s05 = find_id("S05"), ob[MAXN], od[MAXN];
    int nb = bfs(s05, ob), nd = dfs(s05, od), same_set = (nb == nd);
    for (int i = 0; i < nb && same_set; i++) { int f = 0; for (int j = 0; j < nd; j++) if (od[j] == ob[i]) f = 1; if (!f) same_set = 0; }
    check("BFS vs DFS from S05 reach the same 11 students", same_set && nb == 11);
    floyd();
    int dij_ok = 1;
    for (int u = 0; u < N; u++) {
        double d[MAXN]; int pv[MAXN]; dijkstra(u, d, pv);
        for (int v = 0; v < N; v++) if (!(d[v] == FW(u, v) || fabs(d[v] - FW(u, v)) < 1e-9)) dij_ok = 0;
    }
    check("Dijkstra equals Floyd-Warshall for every node", dij_ok);
    double mst_w; int mst_e = kruskal(&mst_w);
    printf("Kruskal: %d edges, weight %.3f\n", mst_e, mst_w);
    check("Kruskal MST: 10 edges = V - components, weight 0.915", mst_e == N - nc && fabs(mst_w - 0.915) < 0.0005);
    int mentor_ok = 1;
    const char *want[] = {"S02", "S02", NULL}; double want_d[] = {0.636, 0.753, 0};
    printf("%-14s %-6s %-14s %s\n", "At-risk", "Score", "Nearest mentor", "Path dist");
    for (int k = 0; k < nr; k++) {
        double d[MAXN], md = 0; int pv[MAXN]; dijkstra(risky[k], d, pv);
        int m = find_mentor(d, &md);
        if (m >= 0) printf("%s (%-6s) %5.1f  %s (%.1f)        %.3f\n", S[risky[k]].id, S[risky[k]].name, S[risky[k]].score10 / 10.0, S[m].id, S[m].score10 / 10.0, md);
        else        printf("%s (%-6s) %5.1f  None - no path\n", S[risky[k]].id, S[risky[k]].name, S[risky[k]].score10 / 10.0);
        if (want[k]) { if (m < 0 || strcmp(S[m].id, want[k]) || fabs(md - want_d[k]) > 0.0005) mentor_ok = 0; }
        else if (m >= 0) mentor_ok = 0;
    }
    check("Mentor search: S05 -> S02, S07 -> S02, S10 none", mentor_ok);

    printf("\n=== Module 3: dynamic programming ===\n");
    Topic topics[5] = {{"DSA", 4, 12}, {"DBMS", 3, 8}, {"OS", 2, 5}, {"Maths", 3, 9}, {"Project work", 5, 10}};
    int chosen[5], gain = knapsack(topics, 5, 10, chosen);
    printf("10 hours -> gain %d, plan:", gain);
    for (int i = 0; i < 5; i++) if (chosen[i]) printf(" %s", topics[i].name);
    printf("\n");
    check("0/1 knapsack, 10 hours: gain 29 = brute force", gain == 29 && gain == knapsack_brute(topics, 5, 10));
    int l1 = lcs("AGGTABXYZ12", "GXTXAYB12Z");
    check("LCS equals brute force", l1 == lcs_brute("AGGTABXYZ12", "GXTXAYB12Z"));
    printf("LCS(S0123, S0132) = %d of 5 (probable typo)\n", lcs("S0123", "S0132"));
    srand(1);
    for (int s = 0; s < 12; s++) for (int k = 0; k < 6; k++) sem_marks[s][k] = 40 + rand() % 56;
    for (int refresh = 0; refresh < 5; refresh++) for (int s = 0; s < 12; s++) for (int sem = 1; sem <= 6; sem++) sem_avg(s, sem, 1);
    printf("memoization: %d computations instead of %d\n", memo_computed, 5 * 12 * 6);
    check("Memoization: 72 instead of 360 computations", memo_computed == 72);

    printf("\n=== Module 4: backtracking + branch and bound ===\n");
    init_conflicts();
    memset(slot_of, 0, sizeof slot_of);
    int two = colour_bt(0, 2);
    memset(slot_of, 0, sizeof slot_of);
    int three = colour_bt(0, 3);
    if (three) { printf("3-slot schedule:"); for (int c = 1; c <= 3; c++) { printf(" slot%d[", c); int f = 1; for (int i = 0; i < SN; i++) if (slot_of[i] == c) { printf("%s%s", f ? "" : " ", slot_names[i]); f = 0; } printf("]"); } printf("\n"); }
    check("Slot colouring: 2 slots impossible, 3 succeed = brute force", !two && three && !colour_brute(2) && colour_brute(3));
    tsp_bb();
    printf("best round: %d min, ", bb_best);
    for (int i = 0; i <= PN; i++) printf("%s%s", place[bb_route[i]], i < PN ? " -> " : "\n");
    printf("partial routes explored %d, pruned %d\n", bb_explored, bb_pruned);
    check("Branch and bound round: 26 min = brute-force minimum", bb_best == 26 && bb_best == tsp_brute());

    printf("\n=== Benchmarks (synthetic data, seed 7; times vary by machine) ===\n");
    {   /* 1,500 students, threshold 0.08 */
        N = 0; rng = 7;
        for (int i = 0; i < 1500; i++) { char id[8]; snprintf(id, sizeof id, "R%04d", i); add_student(id, "N", rnd(25, 98), rnd(35, 99), rnd(25, 98)); }
        clock_t t0 = clock(); build_graph(0.08); clock_t t1 = clock();
        int *cmp = malloc(N * sizeof *cmp); int ncomp = components(cmp); clock_t t2 = clock();
        double *d = malloc(N * sizeof *d); int *pv = malloc(N * sizeof *pv); dijkstra(0, d, pv); clock_t t3 = clock();
        double w; int me = kruskal(&w); clock_t t4 = clock();
        printf("n=1500, threshold 0.08: %d edges, graph build %.2f s (O(n^2)), components %.3f s (%d), Dijkstra %.3f s, Kruskal %.3f s\n",
               E, (double)(t1 - t0) / CLOCKS_PER_SEC, (double)(t2 - t1) / CLOCKS_PER_SEC, ncomp,
               (double)(t3 - t2) / CLOCKS_PER_SEC, (double)(t4 - t3) / CLOCKS_PER_SEC);
        check("Benchmark: MST edges = V - components", me == N - ncomp);
        free(cmp); free(d); free(pv);
        graph_free();
    }
    {   /* 20,000 records: heap sort */
        N = 0; rng = 7;
        for (int i = 0; i < 20000; i++) { char id[8]; snprintf(id, sizeof id, "R%05d", i); add_student(id, "N", rnd(25, 98), rnd(35, 99), rnd(25, 98)); }
        int *rk = malloc(N * sizeof *rk);
        clock_t t0 = clock(); heap_sort_by_risk(rk); clock_t t1 = clock();
        int ok = 1; for (int i = 1; i < N; i++) if (risk_cmp(rk[i - 1], rk[i]) < 0) ok = 0;
        printf("heap sort of 20,000 records: %.3f s\n", (double)(t1 - t0) / CLOCKS_PER_SEC);
        check("Benchmark: heap sort of 20,000 records is correctly ordered", ok);
        free(rk);
    }

    free(FWm);
    printf("\n%d/%d checks passed\n", passed, total_checks);
    return passed == total_checks ? 0 : 1;
}
