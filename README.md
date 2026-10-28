# Smart Student Progress Monitoring Dashboard (DSA-II)

Individual Project Assignment for **Data Structures and Algorithms - II (CCSE0301)** at **NIET Greater Noida**.  
**Student Name:** Ankit Singh  
**Roll No / Enrollment No:** 2501330100075  
**Course:** B.Tech Computer Science and Engineering  

---

## Project Overview
The **Smart Student Progress Monitoring Dashboard** is a C-based system that uses core Data Structures and Algorithms from **Unit 2 (Graphs)** and **Unit 3 (Dynamic Programming)** to track academic progress, identify at-risk students, cluster student performance metrics, compute optimal peer-support networks, and generate personalized study schedules.

---

## DSA Concepts Implemented
1. **Graphs (Unit 2):**
   - **Adjacency List Representation:** Efficient storage $O(V + E)$ for students, subjects, and performance metrics.
   - **BFS & DFS:** Level-wise and depth-wise search traversals for student cluster analysis.
   - **Connected Components:** Identifies isolated student groups and at-risk clusters.
   - **Kruskal's Algorithm:** Computes the Minimum Spanning Tree ($O(E \log E)$) for optimal peer-support link structures.
   - **Dijkstra's Algorithm:** Finds the shortest distance path ($O((V + E) \log V)$) to recommend mentors and study partners.

2. **Dynamic Programming (Unit 3):**
   - **0/1 Knapsack:** Selects the optimal combination of study modules to maximize marks gain within limited weekly study hours ($O(n \cdot W)$).
   - **Longest Common Subsequence (LCS):** Compares student performance trend sequences and checks string similarities ($O(m \cdot n)$).
   - **Memoization:** Caches repeated semester aggregate SGPA calculations to optimize performance.

---

## Repository File Structure
- `student_dashboard.h` — Header file containing structures, enums, and function prototypes.
- `graph_module.c` — Implementation of graph construction, BFS, DFS, Connected Components, Kruskal's MST, and Dijkstra's algorithm.
- `dp_module.c` — Implementation of 0/1 Knapsack, LCS, and Memoized SGPA calculation.
- `main.c` — Interactive console driver program executing all modules with sample test data.

---

## How to Compile and Run
You can compile and run the project using `gcc`:
```bash
gcc main.c graph_module.c dp_module.c -o student_dashboard -lm
./student_dashboard
```
