# Smart Student Progress Monitoring Dashboard (DSA-II)

[![Course: CCSE0301](https://img.shields.io/badge/Course-CCSE0301%20Data%20Structures%20%26%20Algorithms%20II-blue)](https://www.niet.co.in)
[![Institution: NIET Greater Noida](https://img.shields.io/badge/Institution-NIET%20Greater%20Noida-orange)](https://www.niet.co.in)
[![Language: C](https://img.shields.io/badge/Language-C%20(ISO%20C99)-green)](https://en.wikipedia.org/wiki/C_(programming_language))

## Project Overview
An advanced, modular console application built for academic progress tracking, early at-risk student detection, optimal peer-support networking, and personalized study-hour optimization. This project implements core concepts from **Unit 2 (Graphs)** and **Unit 3 (Dynamic Programming)** in pure C programming language.

---

## Student & Course Details
* **Student Name:** Ankit Singh
* **Roll / Enrollment No:** 2501330100075
* **Course Code & Name:** CCSE0301 - Data Structures and Algorithms - II
* **Faculty Name:** Mr. Shamshad Ali
* **Institution:** Noida Institute of Engineering and Technology (NIET), Greater Noida

---

## System Architecture & DSA Mapping

| Module / Feature | Applied DSA Concept | Unit Reference | Time Complexity | Space Complexity |
| :--- | :--- | :--- | :--- | :--- |
| **Student-Subject Graph** | Adjacency List | Unit 2 (Graphs) | $O(V + E)$ | $O(V + E)$ |
| **Cluster Analysis** | Breadth-First Search (BFS) / DFS | Unit 2 (Graphs) | $O(V + E)$ | $O(V)$ |
| **Isolated Student Detection** | Connected Components | Unit 2 (Graphs) | $O(V + E)$ | $O(V)$ |
| **Optimal Peer-Support Network** | Kruskal’s MST | Unit 2 (Graphs) | $O(E \log E)$ | $O(V + E)$ |
| **Mentor / Peer Recommendation** | Dijkstra’s Algorithm | Unit 2 (Graphs) | $O((V + E) \log V)$ | $O(V)$ |
| **Personalized Study Plan** | 0/1 Knapsack | Unit 3 (Dynamic Programming) | $O(n \cdot W)$ | $O(n \cdot W)$ |
| **Trend & ID String Similarity** | Longest Common Subsequence (LCS) | Unit 3 (Dynamic Programming) | $O(m \cdot n)$ | $O(m \cdot n)$ |
| **Cumulative SGPA Aggregates** | Top-Down Memoization | Unit 3 (Dynamic Programming) | $O(N)$ | $O(N)$ |

---

## Repository File Structure
- `student_dashboard.h` — Header file defining global data structures (`Student`, `Graph`, `Vertex`, `Edge`) and function prototypes.
- `graph_module.c` — Implementation of graph operations, BFS/DFS traversals, Connected Components, Kruskal's Algorithm, and Dijkstra's Algorithm.
- `dp_module.c` — Implementation of 0/1 Knapsack study planner, LCS trend checker, and Memoized SGPA calculation.
- `main.c` — Interactive driver program initializing sample datasets and executing core workflows.
- `dataset.csv` — External sample student dataset records.
- `Makefile` — Build automation configuration file.

---

## Compilation & Execution Guide

### Using Make (Recommended)
```bash
make          # Compiles the program
make run      # Executes the compiled dashboard
make clean    # Removes binary and object files
```

### Manual Compilation using GCC
```bash
gcc main.c graph_module.c dp_module.c -o student_dashboard -lm
./student_dashboard
```
