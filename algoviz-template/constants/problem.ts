// ════════════════════════════════════════════════════════════════════════════
// constants/problem.ts — Problem metadata, test cases, code snippets
// ════════════════════════════════════════════════════════════════════════════

// ── Problem metadata ─────────────────────────────────────────────────────

export const PROBLEM_TITLE    = "Problem Title Here";
export const PROBLEM_SUBTITLE = "Approach 1 / Approach 2";
export const PROBLEM_BADGE    = "Medium • Dynamic Programming";
export const PROBLEM_STATEMENT = `
  Describe the problem here. Keep it concise but precise enough that someone
  arriving fresh can understand what they're watching without opening LeetCode.
  You can reference code variables inline like nums[l..r] and explain the goal.
`;

// ── Solution tabs ────────────────────────────────────────────────────────

export const SOLUTIONS = [
  { id: "naive",     label: "Naive Approach",     complexity: "O(n²)"      },
  { id: "optimized", label: "Optimized Approach",  complexity: "O(n log n)" },
] as const;

// ── Test cases ───────────────────────────────────────────────────────────

export const TEST_CASES = [
  {
    id: "example-1",
    label: "Example 1",
    nums: [1, 3, 2],
    k: 2,
    description: "Basic case",
  },
  {
    id: "example-2",
    label: "All Equal",
    nums: [5, 5, 5, 5],
    k: 3,
    description: "Edge case: uniform array",
  },
  {
    id: "custom",
    label: "Custom",
    nums: [],
    k: 0,
    description: "Enter your own input",
  },
] as const;

// ── Code snippets ────────────────────────────────────────────────────────

export const NAIVE_CODE: string[] = [
  "// Paste / write your naive solution here",
  "void solve(vector<int>& nums, int k) {",
  "  // ...",
  "}",
];

export const OPTIMIZED_CODE: string[] = [
  "// Paste / write your optimized solution here",
  "void solve(vector<int>& nums, int k) {",
  "  // ...",
  "}",
];
