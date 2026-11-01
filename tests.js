// Run with: node js/tests.js   (checks the JS port against the report's numbers)
const D = require("./algorithms.js");
let pass = 0, fail = 0;
const t = (name, cond, note = "") => { (cond ? pass++ : fail++); console.log(`[${cond ? "PASS" : "FAIL"}] ${name} ${note}`); };

const S = D.makeRecords(D.SAMPLE), byId = Object.fromEntries(S.map((s) => [s.id, s]));
const atRisk = S.filter((s) => s.score < D.AT_RISK).map((s) => s.id);
t("Risk flag", atRisk.join() === "S05,S07,S10", atRisk);

const ranked = D.heapSortByRisk(S).map((s) => s.id);
t("Heap sort ranking", ranked.slice(0, 5).join() === "S10,S07,S05,S06,S11", ranked.slice(0, 5));

const avl = new D.AVL(); S.forEach((s) => avl.insert(s.score, s));
const keys = avl.inorder().map((x) => x[0]);
t("AVL sorted, height 4, 7 rotations", keys.every((k, i) => !i || keys[i - 1] <= k) && avl.height() === 4 && avl.rotations === 7);
t("AVL range 40-60", avl.range(40, 60).map((x) => x[1].id).sort().join() === "S05,S06,S07");

const { adj, edges } = D.buildGraph(S), comps = D.components(adj);
t("14 edges, 2 components", edges.length === 14 && comps.length === 2 && comps.some((c) => c.length === 1 && c[0] === "S10"));
t("BFS = DFS (11)", D.bfs(adj, "S05").length === 11 && new Set(D.bfs(adj, "S05")).size === new Set([...D.bfs(adj, "S05"), ...D.dfs(adj, "S05")]).size);
const fw = D.floyd(adj); let ok = true;
Object.keys(adj).forEach((u) => { const { d } = D.dijkstra(adj, u); Object.keys(adj).forEach((v) => { if (!(d[v] === fw[u][v] || Math.abs(d[v] - fw[u][v]) < 1e-9)) ok = false; }); });
t("Dijkstra = Floyd-Warshall", ok);
const k = D.kruskal(adj, edges);
t("Kruskal 10 edges, 0.915", k.mst.length === 10 && Math.abs(k.total - 0.915) < 0.0005, k.total.toFixed(3));
const m5 = D.findMentor(D.dijkstra(adj, "S05").d, byId), m7 = D.findMentor(D.dijkstra(adj, "S07").d, byId), m10 = D.findMentor(D.dijkstra(adj, "S10").d, byId);
t("Mentors", m5[0] === "S02" && m7[0] === "S02" && m10 === null, `${m5[1].toFixed(3)} ${m7[1].toFixed(3)}`);

const topics = [["DSA", 4, 12], ["DBMS", 3, 8], ["OS", 2, 5], ["Maths", 3, 9], ["Project work", 5, 10]];
const kn = D.knapsack(topics, 10);
t("Knapsack 29 = brute force", kn.best === 29 && kn.best === D.knapsackBrute(topics, 10) && kn.chosen.join() === "DSA,DBMS,Maths");
t("LCS S0123/S0132 = 4", D.lcs("S0123", "S0132") === 4);

const conf = [["S05","S06"],["S05","S07"],["S05","S10"],["S06","S10"],["S07","S10"],["S10","S11"]], nodes = ["S10","S05","S06","S07","S11"];
t("2 slots impossible, 3 succeed", D.colourGraph(nodes, conf, 2).colouring === null && D.colourGraph(nodes, conf, 3).colouring !== null);
const bb = D.tspBnB(D.TRAVEL);
t("B&B 26 min = brute force", bb.best === 26 && bb.best === D.tspBrute(D.TRAVEL), JSON.stringify(bb.stats));

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
