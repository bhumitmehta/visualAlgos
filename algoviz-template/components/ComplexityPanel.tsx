"use client";

// ════════════════════════════════════════════════════════════════════════════
// components/ComplexityPanel.tsx — Time / space complexity card
// ════════════════════════════════════════════════════════════════════════════

import { COMPLEXITY } from "../constants/phases";
import type { SolutionId } from "../types";

interface ComplexityPanelProps {
  solution: SolutionId;
}

export function ComplexityPanel({ solution }: ComplexityPanelProps) {
  const { time, space, note } = COMPLEXITY[solution];

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
      <p className="text-xs text-slate-500 font-medium mb-2">Complexity Analysis</p>

      <div className="flex flex-col gap-3 mb-1.5">
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wide">Time</span>
          <p className="font-mono text-sm text-slate-900">{time}</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wide">Space</span>
          <p className="font-mono text-sm text-slate-900">{space}</p>
        </div>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed mt-2">{note}</p>
    </div>
  );
}
