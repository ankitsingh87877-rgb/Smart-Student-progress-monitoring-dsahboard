# Smart Student Progress Monitoring Dashboard

DSA-II PBL (CCSE0301), B.Tech CSE-A, NIET Greater Noida. SDG 4: Quality Education.
Author: Ankit Singh (Roll No. 2501330100075). Faculty: Mr. Shamshad Ali.

A browser-based dashboard that flags at-risk students, finds similar peers and mentors, and builds a study plan. Every algorithm is implemented from scratch in plain JavaScript (no libraries), using Unit 2 (Graphs) and Unit 3 (Dynamic Programming).

## Features for all users
- Class overview for faculty: sortable risk table, search, add-student form with validation, CSV import and export.
- My report for students: pick your roll number to see your score, mentor, study plan, subject order and trend.
- Algorithm lab: cross-checks (Prim vs Kruskal, Bellman-Ford vs Dijkstra), Floyd-Warshall, matrix chain calculator, and a scale benchmark.
- Data is saved in the browser (localStorage). Use Export CSV to share it, and Reset to return to the sample data.
- Works on phones, supports keyboard use, light and dark themes, and printing.
- CSV columns: `roll,name,sem,DSA,DBMS,OS,MATHS,attendance,assignment,results` (results separated by `;`).
- The data never leaves the browser. Do not upload real student records to a public repository.

## Run it
Open `index.html` in a browser. No install or server needed.
Run all tests with `npm test` (24 tests: unit, property checks on random graphs, and edge cases).
Online: enable GitHub Pages with source "GitHub Actions"; `.github/workflows/pages.yml` runs the tests and deploys on every push to `main`.

## Graph model
- Nodes: Student, Subject (Assessment data is folded into each student's marks, attendance and assignment scores).
- Student-Subject edge: the student scored below 50 in that subject (weight 1).
- Student-Student edge: Euclidean distance between normalized (average marks, attendance, assignment) vectors, kept only if it is at most the threshold (default 0.25, adjustable). Distances are never negative, so Dijkstra is valid.
- Storage: adjacency list, O(V+E) space.

## DSA used and where
| Concept | Unit | Complexity | Where in the dashboard | File |
|---|---|---|---|---|
| Adjacency list | 2 | O(V+E) space | Both graphs | `js/graph.js` |
| BFS | 2 | O(V+E) | Weak-subject explorer (remedial groups) | `js/graph.js` |
| DFS | 2 | O(V+E) | Growing clusters of similar students | `js/graph.js` |
| Connected components | 2 | O(V+E) | Clusters and isolated at-risk students | `js/graph.js` |
| Kruskal MST (union-find) | 2 | O(E log E) | Minimum-cost link structure | `js/graph.js` |
| Dijkstra (binary heap) | 2 | O((V+E) log V) | Closest on-track mentor | `js/graph.js` |
| Memoization | 3 | O(states x transition) | Cumulative semester averages | `js/dp.js` |
| 0/1 Knapsack | 3 | O(n*W) | Study-hour plan | `js/dp.js` |
| LCS | 3 | O(m*n) | Trend comparison, duplicate-name check | `js/dp.js` |
| Prim MST | 2 | O(E log V) | Algorithm lab: cross-checks Kruskal | `js/extras.js` |
| Bellman-Ford | 2 | O(V*E) | Algorithm lab: cross-checks Dijkstra, detects negative cycles | `js/extras.js` |
| Floyd-Warshall | 2 | O(V^3) | Algorithm lab: closest pair of students | `js/extras.js` |
| Topological sort | 2 | O(V+E) | Suggested subject order from prerequisites (Maths, DSA, then DBMS/OS) | `js/extras.js` |
| Matrix chain mult. | 3 | O(n^3) | Algorithm lab: chain-order calculator | `js/extras.js` |
| Resource allocation DP | 3 | O(n*B^2) | Flexible study-hour split with diminishing returns | `js/extras.js` |

The Review 2 report marked the last six rows as study only. They are implemented here as verification tools and extra planners, so every Unit 2 and Unit 3 topic in the report is covered.

## Progress score
`score = 0.5 * average marks + 0.3 * attendance + 0.2 * assignments`
At risk: score below 50 or attendance below 60. Watch: score below 65. On track: otherwise.

## Project structure
```
index.html          page
css/style.css       styles
js/data.js          sample dataset
js/graph.js         Graph, MinHeap, BFS, DFS, components, Kruskal, Dijkstra
js/dp.js            Knapsack, LCS, similarity, memoization
js/extras.js        Prim, Bellman-Ford, Floyd-Warshall, topo sort, matrix chain, allocation DP, test data generator
js/app.js           dashboard UI
tests/               run-tests.js and extras.test.js
.github/workflows/  tests and GitHub Pages deployment
```

## References
1. Albreiki, Habuza, Zaki (2023). Extracting topological features to identify at-risk students using machine learning and graph convolutional network models. Int. J. Educ. Technol. High. Educ., 20, 23.
2. Trask, Lytle, Boyle, Joyner, Mubarak (2024). A comparative analysis of student performance predictions in online courses using heterogeneous knowledge graphs. arXiv:2407.12153.
