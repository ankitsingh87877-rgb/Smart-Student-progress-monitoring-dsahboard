#include "student_dashboard.h"

// 0/1 Knapsack: Selects optimal study modules within student's available weekly study hours - O(n * W)
int knapsackStudyPlan(int weights[], int values[], int n, int capacity) {
    int i, w;
    int** K = (int**)malloc((n + 1) * sizeof(int*));
    for (i = 0; i <= n; i++) {
        K[i] = (int*)malloc((capacity + 1) * sizeof(int));
    }

    for (i = 0; i <= n; i++) {
        for (w = 0; w <= capacity; w++) {
            if (i == 0 || w == 0)
                K[i][w] = 0;
            else if (weights[i - 1] <= w)
                K[i][w] = (values[i - 1] + K[i - 1][w - weights[i - 1]] > K[i - 1][w]) ? 
                          (values[i - 1] + K[i - 1][w - weights[i - 1]]) : K[i - 1][w];
            else
                K[i][w] = K[i - 1][w];
        }
    }

    int maxScore = K[n][capacity];

    // Free allocated memory
    for (i = 0; i <= n; i++) {
        free(K[i]);
    }
    free(K);

    return maxScore;
}

// Longest Common Subsequence (LCS): Trend comparison & string matching - O(m * n)
int longestCommonSubsequence(char* seq1, char* seq2, int m, int n) {
    int** L = (int**)malloc((m + 1) * sizeof(int*));
    for (int i = 0; i <= m; i++) {
        L[i] = (int*)malloc((n + 1) * sizeof(int));
    }

    for (int i = 0; i <= m; i++) {
        for (int j = 0; j <= n; j++) {
            if (i == 0 || j == 0)
                L[i][j] = 0;
            else if (seq1[i - 1] == seq2[j - 1])
                L[i][j] = L[i - 1][j - 1] + 1;
            else
                L[i][j] = (L[i - 1][j] > L[i][j - 1]) ? L[i - 1][j] : L[i][j - 1];
        }
    }

    int result = L[m][n];
    for (int i = 0; i <= m; i++) free(L[i]);
    free(L);

    return result;
}

// Memoization (DP): Caches repeated semester aggregate computations
float memoizeSemesterAggregate(int semester, float sgpaRecords[], int memoTable[]) {
    if (semester <= 0) return 0.0f;
    if (memoTable[semester] != -1) {
        return (float)memoTable[semester] / 100.0f; // Return cached SGPA scaled
    }

    // Base calculation or recursive subproblem combination
    float computedAggregate = sgpaRecords[semester - 1];
    if (semester > 1) {
        computedAggregate = (computedAggregate + memoizeSemesterAggregate(semester - 1, sgpaRecords, memoTable)) / 2.0f;
    }

    memoTable[semester] = (int)(computedAggregate * 100.0f); // Store in memo table
    return computedAggregate;
}
