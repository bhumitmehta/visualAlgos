"use client";

// ════════════════════════════════════════════════════════════════════════════
// components/CodePanel.tsx — Syntax-highlighted code viewer
// ════════════════════════════════════════════════════════════════════════════

import { NAIVE_CODE, OPTIMIZED_CODE } from "../constants/problem";
import type { SolutionId } from "../types";

interface CodePanelProps {
  solution: SolutionId;
}

export function CodePanel({ solution }: CodePanelProps) {
  const lines    = solution === "naive" ? NAIVE_CODE : OPTIMIZED_CODE;
  const filename = solution === "naive" ? "naive.cpp" : "optimized.cpp";

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden bg-white mt-4">
      <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        <span className="ml-2 text-xs text-slate-500 font-mono">{filename}</span>
      </div>
      <div className="overflow-auto max-h-64 bg-slate-950/95">
        <table className="w-full text-xs font-mono">
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} className="hover:bg-slate-900 text-slate-100">
                <td className="select-none w-8 text-right pr-3 pl-2 py-0.5 text-slate-500 border-r border-slate-800">
                  {i + 1}
                </td>
                <td className="pl-3 py-0.5 whitespace-pre">{line}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
