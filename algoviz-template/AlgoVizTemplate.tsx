"use client";

// ════════════════════════════════════════════════════════════════════════════
// AlgoVizTemplate.tsx — Root component (orchestrator only)
//
// HOW TO USE:
//  1. Edit constants/problem.ts  → problem title, test cases, code snippets
//  2. Edit types/index.ts        → Step fields for your algorithm
//  3. Edit simulation/index.ts   → buildNaiveSteps / buildOptimizedSteps
//  4. Edit constants/phases.ts   → phase colors + complexity info
//  5. Edit components/CustomPanels.tsx → your diagram(s)
//  6. Wire new panels in here under "CUSTOM VISUAL PANELS"
// ════════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect } from "react";
import { Braces } from "lucide-react";

import {
  PROBLEM_TITLE,
  PROBLEM_SUBTITLE,
  PROBLEM_BADGE,
  PROBLEM_STATEMENT,
  SOLUTIONS,
} from "./constants/problem";
import { PHASES_BY_SOLUTION } from "./constants/phases";
import { buildNaiveSteps, buildOptimizedSteps } from "./simulation";
import { usePlayback } from "./hooks/usePlayback";

import { ArrayCell }        from "./components/ArrayCell";
import { CodePanel }        from "./components/CodePanel";
import { ComplexityPanel }  from "./components/ComplexityPanel";
import { InputPanel }       from "./components/InputPanel";
import { PlaybackControls } from "./components/PlaybackControls";
import { StepLog }          from "./components/StepLog";
import { ExampleCustomPanel } from "./components/CustomPanels";  // ← swap for your own

import type { SolutionId } from "./types";

export default function AlgoVizTemplate() {
  // ── Solution + test-case selection ────────────────────────────────────
  const [activeSolution, setActiveSolution] = useState<SolutionId>("optimized");
  const [activeTestCase, setActiveTestCase]  = useState<string>("example-1");

  // ── Input state ────────────────────────────────────────────────────────
  const [numsInput, setNumsInput] = useState("1,3,2");
  const [nums, setNums]           = useState<number[]>([1, 3, 2]);
  const [k, setK]                 = useState(2);

  // ── Steps ──────────────────────────────────────────────────────────────
  const [steps, setSteps] = useState(() => buildOptimizedSteps([1, 3, 2], 2));

  const { currentStepIndex, setCurrentStepIndex, playing, setPlaying, speed, setSpeed } =
    usePlayback(steps);

  const currentStep = steps[currentStepIndex] ?? steps[0];

  // ── Rebuild steps when any input changes ──────────────────────────────
  const rebuild = useCallback(() => {
    const parsed = numsInput
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .map(Number);

    if (!parsed.length || parsed.some(isNaN)) return;

    setNums(parsed);

    const newSteps =
      activeSolution === "naive"
        ? buildNaiveSteps(parsed, k)
        : buildOptimizedSteps(parsed, k);

    setSteps(newSteps);
    setCurrentStepIndex(0);
    setPlaying(false);
  }, [numsInput, k, activeSolution, setCurrentStepIndex, setPlaying]);

  useEffect(() => { rebuild(); }, [rebuild]);

  const phases = PHASES_BY_SOLUTION[activeSolution];

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-6 overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="flex justify-between items-center mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-600 rounded-lg text-white shadow-lg">
            <Braces size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-none">{PROBLEM_TITLE}</h1>
            <p className="text-slate-500 text-xs mt-1 italic">
              {activeSolution === "naive" ? SOLUTIONS[0].label : SOLUTIONS[1].label}
            </p>
          </div>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded border border-rose-300 text-rose-700 bg-rose-50">
          {PROBLEM_BADGE}
        </span>
      </header>

      {/* ── Solution Tabs ──────────────────────────────────────────── */}
      <div className="flex gap-2 mb-4 shrink-0 bg-slate-200/50 p-1 rounded-xl w-fit">
        {SOLUTIONS.map((sol) => (
          <button
            key={sol.id}
            onClick={() => setActiveSolution(sol.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeSolution === sol.id
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {sol.label}
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-mono">
              {sol.complexity}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 overflow-hidden">

        {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">

          {/* Problem statement */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-sm text-slate-600 leading-relaxed">{PROBLEM_STATEMENT}</p>
          </div>

          {/* Phase chips */}
          <div className="flex gap-2 flex-wrap">
            {phases.map((p) => (
              <div
                key={p}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  currentStep.phase === p
                    ? "bg-blue-600 border-blue-600 text-white shadow-md"
                    : "bg-white border-slate-200 text-slate-400"
                }`}
              >
                {p}
              </div>
            ))}
          </div>

          {/* Array display */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-500 font-medium">Input Array</p>
              <div className="flex gap-3 text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-sky-50 border border-sky-400 inline-block" />
                  Processing
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-emerald-50 border border-emerald-500 inline-block" />
                  Selected
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {nums.map((v, i) => (
                <ArrayCell key={i} value={v} index={i} step={currentStep} />
              ))}
            </div>
            {currentStep.l != null && currentStep.r != null && (
              <div className="mt-2 text-xs text-slate-600 font-mono">
                Range:{" "}
                <span className="text-slate-900">[{currentStep.l}…{currentStep.r}]</span>
                {" → ["}
                {nums.slice(currentStep.l, currentStep.r + 1).join(", ")}
                {"]"}
              </div>
            )}
          </div>

          {/* ── CUSTOM VISUAL PANELS ───────────────────────────────────
           *  Replace <ExampleCustomPanel /> with your own from CustomPanels.tsx.
           *  Render panels conditionally per solution if needed, e.g.:
           *
           *    {activeSolution === "optimized" && (
           *      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
           *        <SegmentTreeDiagram step={currentStep} nums={nums} />
           *        <HeapDiagram step={currentStep} heap={heap} />
           *      </div>
           *    )}
           */}
          <ExampleCustomPanel step={currentStep} />

          {/* Selected items */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-2">
              Selected Items ({currentStep.picks.length}/{k})
            </p>
            <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
              {currentStep.picks.map((p, i) => (
                <div
                  key={i}
                  className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-mono rounded border border-emerald-200"
                >
                  [{p.l},{p.r}] = {p.value}
                </div>
              ))}
              {currentStep.picks.length === 0 && (
                <span className="text-xs text-slate-400 italic">None yet</span>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-medium">Result:</span>
              <span className="text-lg font-bold font-mono text-emerald-600">{currentStep.total}</span>
            </div>
          </div>

          {/* Step log */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-2">Step log</p>
            <StepLog steps={steps} currentIndex={currentStepIndex} />
          </div>

          {/* Code panel */}
          <CodePanel solution={activeSolution} />
        </div>

        {/* ── RIGHT COLUMN ──────────────────────────────────────────── */}
        <div className="w-full lg:w-80 flex flex-col gap-4 overflow-y-auto">
          <InputPanel
            activeTestCase={activeTestCase}
            setActiveTestCase={setActiveTestCase}
            numsInput={numsInput}
            setNumsInput={setNumsInput}
            k={k}
            setK={setK}
            onRebuild={rebuild}
          />
          <PlaybackControls
            steps={steps}
            currentStepIndex={currentStepIndex}
            setCurrentStepIndex={setCurrentStepIndex}
            playing={playing}
            setPlaying={setPlaying}
            speed={speed}
            setSpeed={setSpeed}
          />
          <ComplexityPanel solution={activeSolution} />
        </div>

      </div>
    </div>
  );
}
