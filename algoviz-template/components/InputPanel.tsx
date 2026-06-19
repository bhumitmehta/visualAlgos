"use client";

// ════════════════════════════════════════════════════════════════════════════
// components/InputPanel.tsx — Test-case selector + input configuration
// ════════════════════════════════════════════════════════════════════════════

import { TEST_CASES } from "../constants/problem";

interface InputPanelProps {
  activeTestCase: string;
  setActiveTestCase: (id: string) => void;
  numsInput: string;
  setNumsInput: (v: string) => void;
  k: number;
  setK: (v: number) => void;
  onRebuild: () => void;
}

export function InputPanel({
  activeTestCase,
  setActiveTestCase,
  numsInput,
  setNumsInput,
  k,
  setK,
  onRebuild,
}: InputPanelProps) {
  return (
    <>
      {/* Test Cases */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-3">
        <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-medium">
          Test Cases
        </p>
        <div className="flex flex-wrap gap-2">
          {TEST_CASES.map((tc) => (
            <button
              key={tc.id}
              onClick={() => {
                setActiveTestCase(tc.id);
                if (tc.id !== "custom" && tc.nums.length) {
                  setNumsInput((tc.nums as readonly number[]).join(", "));
                  // @ts-ignore — k may not exist on all cases
                  if (tc.k) setK(tc.k);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTestCase === tc.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tc.label}
            </button>
          ))}
        </div>
        {activeTestCase !== "custom" && (
          <p className="text-[10px] text-slate-500 italic">
            {TEST_CASES.find((tc) => tc.id === activeTestCase)?.description}
          </p>
        )}
      </div>

      {/* Input Configuration */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-2">
        <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-medium">
          Input Configuration
        </p>
        <div className="flex flex-col gap-2">

          {/* nums */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 uppercase tracking-wide">
              nums (comma-separated)
            </label>
            <input
              type="text"
              value={numsInput}
              onChange={(e) => {
                setNumsInput(e.target.value);
                setActiveTestCase("custom");
              }}
              className="font-mono text-xs px-2 py-1.5 rounded border border-slate-200 bg-slate-50 text-slate-900"
            />
          </div>

          {/* k */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 uppercase tracking-wide">k</label>
            <input
              type="number"
              min={1}
              value={k}
              onChange={(e) => {
                setK(Number(e.target.value) || 1);
                setActiveTestCase("custom");
              }}
              className="font-mono text-xs px-2 py-1.5 rounded border border-slate-200 bg-slate-50 text-slate-900 w-24"
            />
          </div>

          <button
            onClick={onRebuild}
            className="mt-1 px-3 py-1.5 rounded border border-slate-300 text-xs text-slate-800 hover:bg-slate-100 transition-colors"
          >
            Rebuild steps
          </button>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">Keep n ≤ 10 so diagrams stay readable.</p>
      </div>
    </>
  );
}
