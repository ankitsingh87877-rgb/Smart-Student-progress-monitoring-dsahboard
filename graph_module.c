#include "student_dashboard.h"

void initGraph(Graph* g) {
    g->V = 0;
    for (int i = 0; i < MAX_NODES; i++) {
        g->vertices[i].id = -1;
        g->vertices[i].head = NULL;
    }
}

int addVertex(Graph* g, int id, NodeType type, const char* label) {
    if (g->V >= MAX_NODES) return -1;
    int idx = g->V++;
    g->vertices[idx].id = id;
    g->vertices[idx].type = type;
    strcpy(g->vertices[idx].label, label);
    g->vertices[idx].head = NULL;
    return idx;
}

void addEdge(Graph* g, int src, int dest, float weight) {
    // Add edge from src to dest
    Edge* newEdge1 = (Edge*)malloc(sizeof(Edge));
    newEdge1->dest = dest;
    newEdge1->weight = weight;
    newEdge1->next = g->vertices[src].head;
    g->vertices[src].head = newEdge1;

    // Add edge from dest to src (Undirected Graph)
    Edge* newEdge2 = (Edge*)malloc(sizeof(Edge));
    newEdge2->dest = src;
    newEdge2->weight = weight;
    newEdge2->next = g->vertices[dest].head;
    g->vertices[dest].head = newEdge2;
}

// Compute normalized progress score and flag at-risk students
void computeProgressAndRisk(Student students[], int count) {
    for (int i = 0; i < count; i++) {
        // Normalization formula: Marks (out of 100), Attendance (%), Assignments (out of 100)
        students[i].progressScore = (students[i].marks * 0.4f) + 
                                    (students[i].attendance * 0.3f) + 
                                    (students[i].assignmentScore * 0.3f);
        
        // Threshold for At-Risk flag: Progress score < 50.0
        if (students[i].progressScore < 50.0f) {
            students[i].isAtRisk = 1;
        } else {
            students[i].isAtRisk = 0;
        }
    }
}

// Breadth-First Search (BFS) - O(V + E)
void BFS(Graph* g, int startVertex, int visited[]) {
    int queue[MAX_NODES];
    int front = 0, rear = 0;

    visited[startVertex] = 1;
    queue[rear++] = startVertex;

    while (front < rear) {
        int curr = queue[front++];
        printf(" -> %s (ID: %d)", g->vertices[curr].label, g->vertices[curr].id);

        Edge* temp = g->vertices[curr].head;
        while (temp != NULL) {
            int adjVertex = temp->dest;
            if (!visited[adjVertex]) {
                visited[adjVertex] = 1;
                queue[rear++] = adjVertex;
            }
            temp = temp->next;
        }
    }
}

// Depth-First Search (DFS) - O(V + E)
void DFS(Graph* g, int vertex, int visited[]) {
    visited[vertex] = 1;
    printf(" -> %s (ID: %d)", g->vertices[vertex].label, g->vertices[vertex].id);

    Edge* temp = g->vertices[vertex].head;
    while (temp != NULL) {
        int adjVertex = temp->dest;
        if (!visited[adjVertex]) {
            DFS(g, adjVertex, visited);
        }
        temp = temp->next;
    }
}

// Connected Components to find isolated student clusters - O(V + E)
void findConnectedComponents(Graph* g) {
    int visited[MAX_NODES] = {0};
    int componentCount = 0;

    printf("\n=== Connected Components (Student Clusters) ===\n");
    for (int i = 0; i < g->V; i++) {
        if (!visited[i]) {
            componentCount++;
            printf("Cluster %d: ", componentCount);
            BFS(g, i, visited);
            printf("\n");
        }
    }
    printf("Total Independent Student/Subject Clusters Found: %d\n", componentCount);
}

// Helper for Kruskal's MST Disjoint Set Find
int findRoot(Subset subsets[], int i) {
    if (subsets[i].parent != i)
        subsets[i].parent = findRoot(subsets, subsets[i].parent);
    return subsets[i].parent;
}

// Helper for Kruskal's MST Disjoint Set Union
void UnionSets(Subset subsets[], int x, int y) {
    int rootX = findRoot(subsets, x);
    int rootY = findRoot(subsets, y);

    if (subsets[rootX].rank < subsets[rootY].rank)
        subsets[rootX].parent = rootY;
    else if (subsets[rootX].rank > subsets[rootY].rank)
        subsets[rootY].parent = rootX;
    else {
        subsets[rootY].parent = rootX;
        subsets[rootX].rank++;
    }
}

// Kruskal's Minimum Spanning Tree - O(E log E)
void kruskalMST(Graph* g) {
    GraphEdge edges[MAX_NODES * 2];
    int edgeCount = 0;

    // Extract all edges from adjacency list
    int visitedEdges[MAX_NODES][MAX_NODES] = {0};
    for (int i = 0; i < g->V; i++) {
        Edge* temp = g->vertices[i].head;
        while (temp != NULL) {
            if (!visitedEdges[temp->dest][i]) {
                edges[edgeCount].src = i;
                edges[edgeCount].dest = temp->dest;
                edges[edgeCount].weight = temp->weight;
                edgeCount++;
                visitedEdges[i][temp->dest] = 1;
            }
            temp = temp->next;
        }
    }

    // Sort edges by weight (Bubble sort for simplicity)
    for (int i = 0; i < edgeCount - 1; i++) {
        for (int j = 0; j < edgeCount - i - 1; j++) {
            if (edges[j].weight > edges[j + 1].weight) {
                GraphEdge temp = edges[j];
                edges[j] = edges[j + 1];
                edges[j + 1] = temp;
            }
        }
    }

    Subset* subsets = (Subset*)malloc(g->V * sizeof(Subset));
    for (int v = 0; v < g->V; v++) {
        subsets[v].parent = v;
        subsets[v].rank = 0;
    }

    printf("\n=== Minimum Spanning Tree (Kruskal's Optimal Peer-Support Links) ===\n");
    float totalWeight = 0;
    int mstEdges = 0;

    for (int i = 0; i < edgeCount && mstEdges < g->V - 1; i++) {
        int rootX = findRoot(subsets, edges[i].src);
        int rootY = findRoot(subsets, edges[i].dest);

        if (rootX != rootY) {
            printf("Link: %s <---> %s | Similarity Cost: %.2f\n", 
                   g->vertices[edges[i].src].label, 
                   g->vertices[edges[i].dest].label, 
                   edges[i].weight);
            totalWeight += edges[i].weight;
            UnionSets(subsets, rootX, rootY);
            mstEdges++;
        }
    }
    printf("Total Optimal Network Cost: %.2f\n", totalWeight);
    free(subsets);
}

// Dijkstra's Algorithm for Closest Peer/Mentor Match - O((V + E) log V)
void dijkstra(Graph* g, int src) {
    float dist[MAX_NODES];
    int visited[MAX_NODES] = {0};

    for (int i = 0; i < g->V; i++) dist[i] = INF;
    dist[src] = 0;

    for (int count = 0; count < g->V - 1; count++) {
        float min = INF;
        int u = -1;

        for (int v = 0; v < g->V; v++) {
            if (!visited[v] && dist[v] < min) {
                min = dist[v];
                u = v;
            }
        }

        if (u == -1) break;
        visited[u] = 1;

        Edge* temp = g->vertices[u].head;
        while (temp != NULL) {
            int v = temp->dest;
            if (!visited[v] && dist[u] != INF && (dist[u] + temp->weight < dist[v])) {
                dist[v] = dist[u] + temp->weight;
            }
            temp = temp->next;
        }
    }

    printf("\n=== Dijkstra's Shortest Mentor/Peer Path from [%s] ===\n", g->vertices[src].label);
    for (int i = 0; i < g->V; i++) {
        if (i != src && dist[i] != INF) {
            printf("To Node %s -> Optimal Distance Score: %.2f\n", g->vertices[i].label, dist[i]);
        }
    }
}
