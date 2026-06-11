// content/graph/dijkstra/metadata.ts
import type { VisualizationMeta } from "@/lib/metadata/types";

const meta: VisualizationMeta = {
  slug: "dijkstra",
  title: "Dijkstra's Shortest Path",
  description:
    "Find the shortest path from a source node to all other nodes in a weighted graph using a priority queue.",
  tagline: "Watch the priority queue greedily relax edges until every node is settled.",

  difficulty: "Medium",
  patternCategory: "Graphs",
  patterns: ["Graphs", "Greedy", "Heap"],
  topics: ["Graphs", "Arrays"],

  keywords: [
    "shortest path",
    "weighted graph",
    "minimum distance",
    "dijkstra",
    "priority queue",
    "single source shortest path",
    "graph traversal",
    "sssp",
    "relaxation",
    "greedy graph",
    "cheapest route",
    "minimum cost path",
    "network delay",
    "flight routes",
    "road map shortest",
  ],

  concepts: [
    "edge relaxation",
    "greedy selection",
    "settled nodes",
    "min-heap priority queue",
    "adjacency list",
    "non-negative weights",
    "optimal substructure",
  ],

  problemSignals: [
    "find the shortest path between two nodes",
    "minimum time to reach all nodes",
    "cheapest way to travel",
    "network delay time",
    "minimum cost to connect",
    "find shortest route",
    "all nodes reachable with minimum distance",
  ],

  companies: ["Google", "Amazon", "Meta", "Microsoft", "Uber", "Lyft", "Grab"],

  relatedProblems: [
    { id: 743,  title: "Network Delay Time",                  slug: "network-delay-time",                  difficulty: "Medium", url: "https://leetcode.com/problems/network-delay-time/" },
    { id: 787,  title: "Cheapest Flights Within K Stops",     slug: "cheapest-flights-within-k-stops",     difficulty: "Medium", url: "https://leetcode.com/problems/cheapest-flights-within-k-stops/" },
    { id: 1631, title: "Path With Minimum Effort",            slug: "path-with-minimum-effort",            difficulty: "Medium", url: "https://leetcode.com/problems/path-with-minimum-effort/" },
    { id: 1514, title: "Path with Maximum Probability",       slug: "path-with-maximum-probability",       difficulty: "Medium", url: "https://leetcode.com/problems/path-with-maximum-probability/" },
    { id: 2642, title: "Design Graph With Shortest Path Calculator", slug: "design-graph-with-shortest-path-calculator", difficulty: "Hard", url: "https://leetcode.com/problems/design-graph-with-shortest-path-calculator/" },
  ],

  accentColor: "#3B82F6",
  watchMinutes: 9,
  icon: "network",

  timeComplexity: "O((V + E) log V)",
  spaceComplexity: "O(V)",

  addedAt: "2024-03-01",
  version: "1.0.0",
};

export default meta;