// ─────────────────────────────────────────────────────────────────────────────
// lib/types.ts
//
// The single source of truth for what a visualization metadata file looks like.
// Every content/*/metadata.ts must export a value satisfying VisualizationMeta.
// The build script reads these and emits generated/search-index.json.
// ─────────────────────────────────────────────────────────────────────────────

export type Difficulty = "Easy" | "Medium" | "Hard";

export type PatternCategory =
  | "Sliding Window"
  | "Two Pointers"
  | "Hash Map"
  | "Union-Find"
  | "BFS"
  | "DFS"
  | "Dynamic Programming"
  | "Greedy"
  | "Binary Search"
  | "Trees"
  | "Graphs"
  | "Trie"
  | "Heap"
  | "Backtracking"
  | "Monotonic Stack"
  | "Segment Tree"
  | "Topological Sort"
  | "String Matching"
  | string; // allow custom patterns without breaking the type

export type TopicTag =
  | "Arrays"
  | "Strings"
  | "Trees"
  | "Graphs"
  | "Hash Map"
  | "Dynamic Programming"
  | "Sorting"
  | "Math"
  | "Bit Manipulation"
  | "Intervals"
  | "Linked List"
  | "Stack"
  | "Queue"
  | "Heap"
  | "Matrix"
  | "Geometry"
  | string;

export interface RelatedProblem {
  /** LeetCode problem number */
  id: number;
  title: string;
  slug: string;             // LeetCode slug, e.g. "two-sum"
  difficulty: Difficulty;
  url: string;
}

export interface VisualizationMeta {
  // ── Identity ───────────────────────────────────────────────────────────────
  /** Unique slug — must match the folder name under content/ */
  slug: string;
  /** Full display title */
  title: string;
  /** One-sentence description shown in cards and search results */
  description: string;
  /** Short tagline shown in hero preview */
  tagline: string;

  // ── Classification ─────────────────────────────────────────────────────────
  difficulty: Difficulty;
  /** Primary pattern category (used for filter chips) */
  patternCategory: PatternCategory;
  /** All patterns this visualization demonstrates */
  patterns: PatternCategory[];
  /** Topic tags (e.g. Arrays, Strings, Trees) */
  topics: TopicTag[];

  // ── Search corpus ──────────────────────────────────────────────────────────
  /**
   * Natural-language keywords a user might type when looking for this.
   * Think: "how do I find the shortest path?", "connected components", etc.
   * The more the better — these are the primary search signal.
   */
  keywords: string[];

  /**
   * Conceptual ideas the algorithm embodies.
   * E.g. ["connectivity", "graph traversal", "weight relaxation"]
   */
  concepts: string[];

  /**
   * Problem "signals" — phrases in a problem statement that should trigger
   * thinking about this algorithm.
   * E.g. ["find shortest path", "minimum cost to reach", "all nodes reachable"]
   */
  problemSignals: string[];

  // ── Discovery ──────────────────────────────────────────────────────────────
  /** Companies known to ask problems requiring this algorithm */
  companies: string[];

  /** LeetCode problems solvable with this algorithm */
  relatedProblems: RelatedProblem[];

  // ── Display ────────────────────────────────────────────────────────────────
  /** Accent hex color for this card (#RRGGBB) */
  accentColor: string;

  /** Estimated watch time in minutes */
  watchMinutes: number;

  /** Icon name (maps to Lucide icon in the UI) */
  icon: "network" | "braces" | "branch" | "zap" | "layers" | "git-merge" | "default";

  // ── Complexity ─────────────────────────────────────────────────────────────
  timeComplexity: string;   // e.g. "O((V + E) log V)"
  spaceComplexity: string;  // e.g. "O(V)"

  // ── Meta ───────────────────────────────────────────────────────────────────
  /** ISO date string, e.g. "2024-03-15" */
  addedAt: string;
  /** Version bump when animation changes significantly */
  version: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Search index types (emitted by build script, consumed by search lib)
// ─────────────────────────────────────────────────────────────────────────────

/** Lightweight record stored in search-index.json — no animation code */
export interface SearchIndexEntry {
  slug: string;
  title: string;
  description: string;
  tagline: string;
  difficulty: Difficulty;
  patternCategory: PatternCategory;
  patterns: PatternCategory[];
  topics: TopicTag[];
  keywords: string[];
  concepts: string[];
  problemSignals: string[];
  companies: string[];
  relatedProblems: RelatedProblem[];
  accentColor: string;
  watchMinutes: number;
  icon: VisualizationMeta["icon"];
  timeComplexity: string;
  spaceComplexity: string;
  /** Pre-built search corpus: all searchable text joined and lowercased */
  _corpus: string;
  /** TF-IDF-style term frequency map built at index time */
  _termFreq: Record<string, number>;
}

export interface SearchIndex {
  version: string;
  builtAt: string;
  totalEntries: number;
  entries: SearchIndexEntry[];
}