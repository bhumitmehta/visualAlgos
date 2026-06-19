"use client";

// ════════════════════════════════════════════════════════════════════════════
// components/StepLog.tsx — Reverse-chronological step history
// ════════════════════════════════════════════════════════════════════════════

import { PHASE_META } from "../constants/phases";
import type { Step } from "../types";

interface StepLogProps {
  steps: Step[];
  currentIndex: number;
}

export function StepLog({ steps, currentIndex }: StepLogProps) {
  const visible = steps.slice(0, currentIndex + 1).reverse();

  return (
    <div
      className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1"
      style={{ scrollbarWidth: "thin" }}
    >
      {visible.map((step, i) => {
        const meta = PHASE_META[step.phase];
        return (
          <div
            key={i}
            className={`
              flex items-start gap-2 px-2 py-1.5 rounded-r border-l-2 text-xs
              transition-all duration-200
              ${meta.borderColor} ${meta.bgColor}
              ${i === 0 ? "opacity-100" : "opacity-70"}
            `}
          >
            <span className="font-mono font-bold text-slate-500 shrink-0 w-4">
              {meta.icon}
            </span>
            <span className="text-slate-700 leading-snug">{step.message}</span>
          </div>
        );
      })}
    </div>
  );
}
