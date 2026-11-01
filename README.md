# Smart Student Progress Monitoring Dashboard

**DSA-II PBL Final Report (CCSE0301) · NIET Greater Noida · B.Tech CSE – A**
Author: Ankit Singh (ERP 2501330100075) · Faculty: Mr. Shamshad Ali · SDG 4 – Quality Education

A prototype that turns a class's marks, attendance and assignment scores into a progress score, ranks students by risk, links each at-risk student to a similar and stronger peer, plans study hours and schedules mentoring, using classical, explainable algorithms.

This repository contains:

1. the **C console prototype** (`c/`) and the equivalent **Python prototype** (`python/`) described in the report, and
2. an **interactive website** of the report with live demos of every algorithm (runs in the browser, no server or build step).

## Algorithms (by report module)

| Module | Topics | Used for |
|---|---|---|
| 1. Trees and Heaps | Binary max-heap, heap sort, AVL tree | Risk ranking; sorted view and score-range queries |
| 2. Graphs | Adjacency list, BFS, DFS, components, Dijkstra, Kruskal (Floyd–Warshall as cross-check) | Similarity graph, nearest mentor, clusters, spanning tree |
| 3. Dynamic Programming | 0/1 knapsack, LCS, memoization | Study-hour plan, roll-number typo check, cached semester averages |
| 4. Backtracking / B&B | Graph colouring, branch and bound | Clash-free mentoring slots, shortest mentor round |
| 5. Advanced Trees and Heaps | Red-black, B/B+, binomial, Fibonacci | Design study only (not coded) |

Progress score = 0.5 × marks + 0.3 × attendance + 0.2 × assignments. Students below 55 are at risk. Two students are linked when the Euclidean distance of their normalised (marks, attendance, assignments) vectors is ≤ 0.15. These weights and the threshold are design choices, not official values.

## Project structure

```
index.html                   website (report overview + live demos)
css/style.css                styling (light and dark mode)
js/algorithms.js             all algorithms in JavaScript
js/app.js                    page logic and rendering
js/tests.js                  Node checks against the report's numbers
c/student_dashboard.c        C console prototype + checks (build with make)
c/Makefile                   build and run helper
python/student_dashboard.py  Python console prototype + checks
docs/                        final report PDF
.nojekyll                    tells GitHub Pages to serve files as they are
```

## Run it

```bash
# C prototype (gcc or clang, no libraries besides the math library)
cd c && make run          # or: gcc -O2 -Wall -Wextra -o student_dashboard student_dashboard.c -lm && ./student_dashboard
cd ..

# Python prototype (Python 3.8+, no packages needed)
python python/student_dashboard.py

# JavaScript checks (Node 16+)
node js/tests.js

# Website: just open index.html in a browser
# or serve locally:
python -m http.server 8000     # then visit http://localhost:8000
```

Expected: `17/17 checks passed` for C, `15/15` for Python and `13/13` for Node.

## Publish the website on GitHub Pages

1. Upload all files to your repository (see below).
2. Repository **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, then **Save**.
4. After a minute the site is live at `https://<your-username>.github.io/<repository-name>/`.

### Upload from the browser
Open the repository → **Add file → Upload files** → unzip the downloaded zip on your computer, drag the **contents** of the folder (not the folder itself) into the page → **Commit changes**.

### Upload with git
```bash
git clone https://github.com/ankitsingh87877-rgb/Smart-Student-progressmonitoring-dsahboard.git
cd Smart-Student-progressmonitoring-dsahboard
# copy the unzipped files in here, then:
git add .
git commit -m "Add project website, JS port and tests"
git push
```

## Notes and limits

- All data is synthetic. The results show algorithmic correctness, not educational effectiveness.
- The mentor-round travel times in `TRAVEL` are fixed illustrative values chosen to reproduce the report's 26-minute result.
- The C and Python benchmarks use their own random generators, so edge counts for the 1,500-student benchmark differ slightly from the report. All correctness checks are unaffected.
- Branch and bound counts of explored and pruned partial routes depend on how the root and ordering are counted; this code reports 63 and 18 (the report lists 62 and 17). The optimal 26-minute route is the same.
- Graph building compares every pair of students, O(n²), so it is the bottleneck for very large classes.
- Benchmark times vary by machine.

## References

See the report PDF in `docs/` and the References section of the website.
