// Unit 3 (Dynamic Programming): 0/1 Knapsack, LCS, memoization.

// 0/1 Knapsack, O(n*W) time and space. items: [{name, w, v}], capacity W (integer hours).
function knapsack(items, W) {
  const n = items.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    const { w, v } = items[i - 1];
    for (let c = 0; c <= W; c++) {
      dp[i][c] = dp[i - 1][c];
      if (w <= c && dp[i - 1][c - w] + v > dp[i][c]) dp[i][c] = dp[i - 1][c - w] + v;
    }
  }
  const chosen = []; let c = W;
  for (let i = n; i >= 1; i--) if (dp[i][c] !== dp[i - 1][c]) { chosen.push(items[i - 1]); c -= items[i - 1].w; }
  return { best: dp[n][W], chosen: chosen.reverse(), hours: chosen.reduce((s, x) => s + x.w, 0) };
}

// Longest Common Subsequence, O(m*n). Works on strings or arrays.
function lcs(a, b) {
  const m = a.length, n = b.length;
  const t = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    t[i][j] = a[i - 1] === b[j - 1] ? t[i - 1][j - 1] + 1 : Math.max(t[i - 1][j], t[i][j - 1]);
  const seq = []; let i = m, j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) { seq.unshift(a[i - 1]); i--; j--; }
    else if (t[i - 1][j] >= t[i][j - 1]) i--; else j--;
  }
  return { length: t[m][n], seq };
}

// Name / ID similarity in [0,1] from LCS: 2*LCS / (len a + len b). Used for duplicate-record checks.
function similarity(a, b) {
  const x = String(a).toLowerCase().replace(/\s+/g, ''), y = String(b).toLowerCase().replace(/\s+/g, '');
  if (!x.length && !y.length) return 1;
  return (2 * lcs(x, y).length) / (x.length + y.length);
}

// Trend sequence of semester results: U (up), D (down), S (about the same, within 2 points).
function trendSequence(results) {
  const s = [];
  for (let i = 1; i < results.length; i++) {
    const d = results[i] - results[i - 1];
    s.push(d > 2 ? 'U' : d < -2 ? 'D' : 'S');
  }
  return s;
}

// Memoization (top-down DP): cumulative average of the first k semesters.
// cum(k) = (cum(k-1)*(k-1) + result[k]) / k, each (student, k) state is computed once.
function makeAggregator() {
  const memo = new Map(), stats = { calls: 0, hits: 0 };
  function cum(key, results, k) {
    stats.calls++;
    const id = key + '#' + k;
    if (memo.has(id)) { stats.hits++; return memo.get(id); }
    const val = k === 1 ? results[0] : (cum(key, results, k - 1) * (k - 1) + results[k - 1]) / k;
    memo.set(id, val);
    return val;
  }
  return { cum, stats, size: () => memo.size };
}
if (typeof module !== 'undefined') module.exports = { knapsack, lcs, similarity, trendSequence, makeAggregator };
