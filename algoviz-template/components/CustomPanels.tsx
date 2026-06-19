"use client";

// ════════════════════════════════════════════════════════════════════════════
// components/CustomPanels.tsx — Problem-specific diagram panels
//
// Add your own panels here:
//   • SegmentTreeDiagram  — SVG tree built from an array-backed segment tree
//   • HeapDiagram         — SVG tree from a 0-indexed heap array
//   • DPTablePanel        — 2-D grid with cell highlighting
//   • StackPanel          — vertical stack with push/pop animation
//   • GraphPanel          — adjacency-list graph with BFS/DFS frontier coloring
//   • TwoPointerPanel     — array with two pointer arrows
//   • SortBarsPanel       — bar chart for sorting algorithms
//
// Each panel should receive the current Step (and any extra data it needs)
// as props. Keep them pure: derive everything from props, no internal state.
// ════════════════════════════════════════════════════════════════════════════

import type { Step } from "../types";

interface ExampleCustomPanelProps {
  step: Step;
}

/**
 * Placeholder — delete this and add your own panels below.
 */
export function ExampleCustomPanel({ step }: ExampleCustomPanelProps) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
      <p className="text-xs text-slate-500 font-medium mb-2">Your Custom Panel</p>
      <div className="h-40 flex items-center justify-center bg-slate-50 rounded border border-dashed border-slate-300">
        <span className="text-xs text-slate-400 italic">
          Replace this with your diagram (tree / DP table / graph / bars…)
        </span>
      </div>
    </div>
  );
}
