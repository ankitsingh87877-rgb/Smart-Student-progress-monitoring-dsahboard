#ifndef STUDENT_DASHBOARD_H
#define STUDENT_DASHBOARD_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

#define MAX_NAME_LEN 50
#define MAX_NODES 100
#define INF 999999.0

// Node Types in the Heterogeneous Graph
typedef enum {
    NODE_STUDENT,
    NODE_SUBJECT,
    NODE_ASSESSMENT
} NodeType;

// Student Structure
typedef struct {
    int rollNo;
    char name[MAX_NAME_LEN];
    float marks;
    float attendance;
    float assignmentScore;
    float progressScore;
    int isAtRisk; // Flag: 1 if at-risk, 0 otherwise
} Student;

// Graph Edge Structure (Adjacency List)
typedef struct Edge {
    int dest;          // Destination vertex index
    float weight;      // Distance / cost weight
    struct Edge* next;
} Edge;

// Graph Vertex Structure
typedef struct {
    int id;
    NodeType type;
    char label[MAX_NAME_LEN];
    Edge* head;
} Vertex;

// Graph Structure
typedef struct {
    int V; // Total vertices
    Vertex vertices[MAX_NODES];
} Graph;

// Edge structure for Kruskal's Algorithm
typedef struct {
    int src, dest;
    float weight;
} GraphEdge;

// Subset structure for Disjoint Set (Kruskal's)
typedef struct {
    int parent;
    int rank;
} Subset;

// Function Prototypes - Graph Module (Unit 2)
void initGraph(Graph* g);
int addVertex(Graph* g, int id, NodeType type, const char* label);
void addEdge(Graph* g, int src, int dest, float weight);
void computeProgressAndRisk(Student students[], int count);
void BFS(Graph* g, int startVertex, int visited[]);
void DFS(Graph* g, int vertex, int visited[]);
void findConnectedComponents(Graph* g);
void kruskalMST(Graph* g);
void dijkstra(Graph* g, int src);

// Function Prototypes - Dynamic Programming Module (Unit 3)
int knapsackStudyPlan(int weights[], int values[], int n, int capacity);
int longestCommonSubsequence(char* seq1, char* seq2, int m, int n);
float memoizeSemesterAggregate(int semester, float sgpaRecords[], int memoTable[]);

#endif
