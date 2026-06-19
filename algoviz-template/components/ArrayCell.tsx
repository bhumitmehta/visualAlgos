"use client";

// ════════════════════════════════════════════════════════════════════════════
// components/ArrayCell.tsx — Single highlighted array element
// ════════════════════════════════════════════════════════════════════════════

import type { Step } from "../types";

interface ArrayCellProps {
  value: number;
  index: number;
  step: Step;
}

/** Returns the Tailwind color string based on highlight state + phase */
function getColors(inRange: boolean, phase: Step["phase"]): string {
  if (!inRange) return "bg-slate-800 border-slate-600 text-slate-50";
  switch (phase) {
    case "select":  return "bg-emerald-50 border-emerald-500 text-emerald-800";
    case "process": return "bg-sky-50 border-sky-500 text-sky-800";
    default:        return "bg-amber-50 border-amber-500 text-amber-800";
  }
}

export function ArrayCell({ value, index, step }: ArrayCellProps) {
  const inRange =
    step.l != null && step.r != null && index >= step.l && index <= step.r;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] text-slate-400 font-mono leading-none">{index}</span>
      <div
        className={`w-10 h-10 flex items-center justify-center font-mono text-sm font-medium
          border rounded-md transition-all duration-200 ${getColors(inRange, step.phase)}`}
      >
        {value}
      </div>
    </div>
  );
}
