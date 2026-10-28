#include "student_dashboard.h"

int main() {
    printf("=========================================================\n");
    printf("    SMART STUDENT PROGRESS MONITORING DASHBOARD (DSA-II)\n");
    printf("    Institution: NIET Greater Noida | Roll No: 2501330100075\n");
    printf("=========================================================\n\n");

    // Sample Student Records dataset initialization
    Student students[3] = {
        {101, "Ankit Singh", 85.5f, 90.0f, 88.0f, 0.0f, 0},
        {102, "Aman Verma", 45.0f, 60.0f, 48.0f, 0.0f, 0},
        {103, "Sanjit Kumar", 78.0f, 82.0f, 80.0f, 0.0f, 0}
    };

    computeProgressAndRisk(students, 3);

    printf("--- Student Progress & At-Risk Status ---\n");
    for (int i = 0; i < 3; i++) {
        printf("Roll: %d | Name: %s | Progress Score: %.2f | Status: %s\n",
               students[i].rollNo, students[i].name, students[i].progressScore,
               students[i].isAtRisk ? "[AT-RISK]" : "[SAFE / ON-TRACK]");
    }

    // Graph Construction (Unit 2)
    Graph g;
    initGraph(&g);
    
    int v0 = addVertex(&g, 101, NODE_STUDENT, "Ankit_Singh");
    int v1 = addVertex(&g, 102, NODE_STUDENT, "Aman_Verma");
    int v2 = addVertex(&g, 103, NODE_STUDENT, "Sanjit_Kumar");
    int v3 = addVertex(&g, 201, NODE_SUBJECT, "Operating_Systems");
    int v4 = addVertex(&g, 202, NODE_SUBJECT, "Data_Structures");

    // Add edges with similarity/distance weights
    addEdge(&g, v0, v3, 1.2f);
    addEdge(&g, v1, v4, 3.5f);
    addEdge(&g, v2, v3, 1.5f);
    addEdge(&g, v0, v2, 0.8f); // Peer similarity link

    // Run Graph Algorithms
    findConnectedComponents(&g);
    kruskalMST(&g);
    dijkstra(&g, v0);

    // Run Dynamic Programming Modules (Unit 3)
    printf("\n=== Dynamic Programming: Optimal Study Plan (0/1 Knapsack) ===\n");
    int weights[] = {2, 3, 4, 5}; // Hours required per module
    int values[] = {30, 50, 70, 80}; // Expected marks gain
    int capacity = 6; // Max available study hours
    int maxGain = knapsackStudyPlan(weights, values, 4, capacity);
    printf("Maximum Expected Marks Gain in %d study hours: %d marks\n", capacity, maxGain);

    // LCS Execution
    char studentPatternA[] = "A-B-B-A"; // Performance trend sequence 
    char studentPatternB[] = "A-C-B-A";
    int lcsLen = longestCommonSubsequence(studentPatternA, studentPatternB, 7, 7);
    printf("\n=== Dynamic Programming: Trend Similarity (LCS) ===\n");
    printf("Performance Trend Similarity Score (LCS Length): %d\n", lcsLen);

    // Memoization Execution
    float sgpaRecords[] = {7.5f, 8.1f, 7.9f};
    int memoTable[10];
    for(int i=0; i<10; i++) memoTable[i] = -1;
    float agg = memoizeSemesterAggregate(3, sgpaRecords, memoTable);
    printf("\n=== Dynamic Programming: Memoized Semester Aggregate SGPA ===\n");
    printf("Optimized Cumulative SGPA Aggregate: %.2f\n", agg);

    printf("\nExecution Completed Successfully for GitHub Repository.\n");
    return 0;
}
