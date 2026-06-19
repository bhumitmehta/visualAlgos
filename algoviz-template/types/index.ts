// ════════════════════════════════════════════════════════════════════════════
// Types — shared across the whole visualizer
// ════════════════════════════════════════════════════════════════════════════

import { SOLUTIONS } from "../constants/problem";

export type SolutionId = typeof SOLUTIONS[number]["id"];

export type Phase =
  | "init"
  | "process"
  | "select"
  | "done";

export interface Step {
  phase: Phase;
  message: string;

  // Array highlighting
  l: number | null;
  r: number | null;

  // Chosen items so far
  picks: { l: number; r: number; value: number }[];

  // Running answer
  total: number;

  // Add more fields as needed:
  // dpTable: number[][];
  // highlightedNodes: number[];
  // stackContents: number[];
}
