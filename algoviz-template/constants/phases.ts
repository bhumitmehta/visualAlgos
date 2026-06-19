// ════════════════════════════════════════════════════════════════════════════
// constants/phases.ts — Phase styling, complexity info, phase-per-solution
// ════════════════════════════════════════════════════════════════════════════

import type { Phase, SolutionId } from "../types";

// ── Phase display metadata ────────────────────────────────────────────────

export const PHASE_META: Record<
  Phase,
  { color: string; borderColor: string; bgColor: string; icon: string }
> = {
  init:    { color: "text-slate-500",   borderColor: "border-l-slate-400",   bgColor: "bg-slate-100",   icon: "→" },
  process: { color: "text-sky-700",     borderColor: "border-l-sky-500",     bgColor: "bg-sky-50",      icon: "P" },
  select:  { color: "text-emerald-700", borderColor: "border-l-emerald-500", bgColor: "bg-emerald-50",  icon: "★" },
  done:    { color: "text-emerald-800", borderColor: "border-l-emerald-600", bgColor: "bg-emerald-100", icon: "■" },
};

// ── Which phases are active per solution ──────────────────────────────────

export const PHASES_BY_SOLUTION: Record<SolutionId, Phase[]> = {
  naive:     ["init", "process", "select", "done"],
  optimized: ["init", "process", "select", "done"],
};

// ── Complexity info ───────────────────────────────────────────────────────

export const COMPLEXITY: Record<SolutionId, { time: string; space: string; note: string }> = {
  naive: {
    time: "O(n²)",
    space: "O(n²)",
    note: "Enumerate all pairs and compute something for each one.",
  },
  optimized: {
    time: "O(n log n)",
    space: "O(n)",
    note: "Describe why the optimized approach is faster here.",
  },
};
