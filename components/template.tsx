"use client";

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║              AlgoViz — Visualization Template                           ║
 * ║                                                                          ║
 * ║  HOW TO USE:                                                             ║
 * ║  1. Replace PROBLEM_* constants with your problem details               ║
 * ║  2. Define your Step type fields (what state to track per step)         ║
 * ║  3. Write simulation functions (one per solution approach)              ║
 * ║  4. Build your visual panels (ArrayPanel, TreePanel, GraphPanel, etc.)  ║
 * ║  5. Wire everything up in the main component at the bottom              ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Braces, Play, Pause, RotateCcw, StepForward } from "lucide-react";

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 1 — PROBLEM METADATA  (EDIT THIS)
// ════════════════════════════════════════════════════════════════════════════

/** Replace with your problem name */
const PROBLEM_TITLE = "Problem Title Here";

/** Replace with one-line subtitle, e.g. which technique is used */
const PROBLEM_SUBTITLE = "Approach 1 / Approach 2";

/** Replace with difficulty + relevant tags */
const PROBLEM_BADGE = "Medium • Dynamic Programming";

/** Short problem statement shown at the top of the visualizer */
const PROBLEM_STATEMENT = `
  Describe the problem here. Keep it concise but precise enough that someone
  arriving fresh can understand what they're watching without opening LeetCode.
  You can reference code variables inline like nums[l..r] and explain the goal.
`;

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 2 — SOLUTION DEFINITIONS  (EDIT THIS)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Define the approaches you want to compare.
 * id:         unique key, used to switch simulation logic
 * label:      button label
 * complexity: shown on the tab chip
 */
const SOLUTIONS = [
  { id: "naive",     label: "Naive Approach",     complexity: "O(n²)"      },
  { id: "optimized", label: "Optimized Approach",  complexity: "O(n log n)" },
] as const;

type SolutionId = typeof SOLUTIONS[number]["id"];

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 3 — TEST CASES  (EDIT THIS)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Preset test cases shown as quick-select buttons.
 * nums / k are example fields — rename to whatever your problem needs.
 */
const TEST_CASES = [
  {
    id: "example-1",
    label: "Example 1",
    // ↓ Replace these fields with whatever inputs your problem takes
    nums: [1, 3, 2],
    k: 2,
    description: "Basic case",
  },
  {
    id: "example-2",
    label: "All Equal",
    nums: [5, 5, 5, 5],
    k: 3,
    description: "Edge case: uniform array",
  },
  {
    id: "custom",
    label: "Custom",
    nums: [],
    k: 0,
    description: "Enter your own input",
  },
] as const;

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 4 — CODE SNIPPETS  (EDIT THIS)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Source code lines for the code panel.
 * Each string becomes one line; use "" for blank lines.
 */
const NAIVE_CODE: string[] = [
  "// Paste / write your naive solution here",
  "void solve(vector<int>& nums, int k) {",
  "  // ...",
  "}",
];

const OPTIMIZED_CODE: string[] = [
  "// Paste / write your optimized solution here",
  "void solve(vector<int>& nums, int k) {",
  "  // ...",
  "}",
];

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 5 — STEP TYPE  (EDIT THIS)
// ════════════════════════════════════════════════════════════════════════════

/**
 * A Step represents a single logical moment in the algorithm.
 * Every visual update is driven by emitting Step objects from your simulation.
 *
 * FIELDS YOU ALMOST ALWAYS WANT:
 *   phase   — which logical stage we're in (drives phase chips + log colors)
 *   message — human-readable explanation for the step log
 *
 * FIELDS TO ADD/REMOVE based on your problem:
 *   l, r              — currently highlighted array range
 *   highlightedNodes  — nodes lit up in a tree/graph
 *   dpTable           — snapshot of a 2-D DP grid
 *   picks             — chosen elements so far
 *   total             — running answer
 *   ... anything else your visualizer needs
 */
type Phase =
  | "init"
  | "process"   // replace with your actual phase names
  | "select"
  | "done";

interface Step {
  phase: Phase;
  message: string;

  // ── Array highlighting ──────────────────────────────────────────
  /** Index of the leftmost highlighted cell, or null */
  l: number | null;
  /** Index of the rightmost highlighted cell, or null */
  r: number | null;

  // ── Chosen items so far ─────────────────────────────────────────
  picks: { l: number; r: number; value: number }[];
  /** Running answer value */
  total: number;

  // ── Add more fields below as needed ─────────────────────────────
  // dpTable: number[][];
  // highlightedNodes: number[];
  // stackContents: number[];
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 6 — SIMULATION FUNCTIONS  (EDIT THIS — core logic lives here)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Helper to build a typed step with sensible defaults so you don't have to
 * repeat every field at every call site.
 */
function makeStep(partial: Partial<Step> & Pick<Step, "phase" | "message">): Step {
  return {
    l: null,
    r: null,
    picks: [],
    total: 0,
    ...partial,
  };
}

/**
 * NAIVE SIMULATION
 * ─────────────────
 * Push Step objects into an array as you walk through the algorithm.
 * The visualizer will replay them one by one.
 *
 * @param nums  - your input array (rename as needed)
 * @param k     - your second parameter (rename/remove as needed)
 * @returns     - the full Step[] trace
 */
function buildNaiveSteps(nums: number[], k: number): Step[] {
  const steps: Step[] = [];

  // ── Step 1: init ──────────────────────────────────────────────
  steps.push(makeStep({
    phase: "init",
    message: "Initialize: describe what the naive approach will do.",
  }));

  // ── TODO: Add your algorithm logic here, emitting steps ───────
  //
  // Example pattern:
  //   for (let l = 0; l < nums.length; l++) {
  //     for (let r = l; r < nums.length; r++) {
  //       const value = /* compute something */;
  //       steps.push(makeStep({
  //         phase: "process",
  //         message: `Processing [${l}, ${r}]: value = ${value}.`,
  //         l, r,
  //       }));
  //     }
  //   }

  steps.push(makeStep({
    phase: "done",
    message: "Done! Result = 0.",  // replace with real result
  }));

  return steps;
}

/**
 * OPTIMIZED SIMULATION
 * ─────────────────────
 * Same shape as above, but for your better approach.
 */
function buildOptimizedSteps(nums: number[], k: number): Step[] {
  const steps: Step[] = [];

  steps.push(makeStep({
    phase: "init",
    message: "Initialize: describe what the optimized approach will do.",
  }));

  // ── TODO: Add your optimized algorithm logic here ─────────────

  steps.push(makeStep({
    phase: "done",
    message: "Done! Result = 0.",
  }));

  return steps;
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 7 — COMPLEXITY INFO  (EDIT THIS)
// ════════════════════════════════════════════════════════════════════════════

const COMPLEXITY: Record<SolutionId, { time: string; space: string; note: string }> = {
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

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 8 — PHASE DEFINITIONS  (EDIT THIS)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Phases shown as chip indicators above the array.
 * Map every Phase value to a Tailwind color pair and a short icon/label.
 */
const PHASE_META: Record<
  Phase,
  { color: string; borderColor: string; bgColor: string; icon: string }
> = {
  init:    { color: "text-slate-500",   borderColor: "border-l-slate-400",   bgColor: "bg-slate-100",   icon: "→" },
  process: { color: "text-sky-700",     borderColor: "border-l-sky-500",     bgColor: "bg-sky-50",      icon: "P" },
  select:  { color: "text-emerald-700", borderColor: "border-l-emerald-500", bgColor: "bg-emerald-50",  icon: "★" },
  done:    { color: "text-emerald-800", borderColor: "border-l-emerald-600", bgColor: "bg-emerald-100", icon: "■" },
};

const PHASES_BY_SOLUTION: Record<SolutionId, Phase[]> = {
  naive:     ["init", "process", "select", "done"],
  optimized: ["init", "process", "select", "done"],  // adjust per solution
};

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 9 — REUSABLE UI COMPONENTS  (MOSTLY LEAVE AS-IS)
// ════════════════════════════════════════════════════════════════════════════

// ── Code Panel ────────────────────────────────────────────────────────────

function CodePanel({ solution }: { solution: SolutionId }) {
  const lines   = solution === "naive" ? NAIVE_CODE : OPTIMIZED_CODE;
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

// ── Array Cell ────────────────────────────────────────────────────────────
//
// Highlights cells that fall within [step.l, step.r].
// You can extend `getColors` below to add more highlight semantics.

function ArrayCell({
  value,
  index,
  step,
}: {
  value: number;
  index: number;
  step: Step;
}) {
  const inRange =
    step.l != null && step.r != null && index >= step.l && index <= step.r;

  /** Add more phase → color mappings here as your visualization grows */
  function getColors() {
    if (!inRange) return "bg-slate-800 border-slate-600 text-slate-50";
    switch (step.phase) {
      case "select":
        return "bg-emerald-50 border-emerald-500 text-emerald-800";
      case "process":
        return "bg-sky-50 border-sky-500 text-sky-800";
      default:
        return "bg-amber-50 border-amber-500 text-amber-800";
    }
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] text-slate-400 font-mono leading-none">{index}</span>
      <div
        className={`w-10 h-10 flex items-center justify-center font-mono text-sm font-medium
          border rounded-md transition-all duration-200 ${getColors()}`}
      >
        {value}
      </div>
    </div>
  );
}

// ── Step Log ──────────────────────────────────────────────────────────────

function StepLog({ steps, currentIndex }: { steps: Step[]; currentIndex: number }) {
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

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 10 — CUSTOM VISUAL PANELS  (ADD YOUR OWN HERE)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Add any problem-specific diagram panels below this comment.
 *
 * Examples from the MaxTotalSubarrayVisualizer you can copy-paste and adapt:
 *   • SegmentTreeDiagram  — SVG tree built from an array-backed segment tree
 *   • HeapDiagram         — SVG tree from a 0-indexed heap array
 *   • computeTreePositions — lays out 1-indexed binary tree nodes on a 2-D plane
 *
 * Other patterns you might add:
 *   • DPTablePanel        — 2-D grid with cell highlighting
 *   • StackPanel          — vertical stack of elements with push/pop animation
 *   • GraphPanel          — adjacency-list graph with BFS/DFS frontier coloring
 *   • TwoPointerPanel     — array with two pointer arrows
 *   • SortBarsPanel       — bar chart for sorting algorithms
 *
 * Each panel receives the current Step and whatever data it needs.
 * Keep panels pure: derive everything from props, no internal state.
 */

// ── Example skeleton panel ────────────────────────────────────────────────
// Delete this and replace with your own panel(s).

function ExampleCustomPanel({ step }: { step: Step }) {
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

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 11 — MAIN COMPONENT  (MOSTLY LEAVE AS-IS)
// ════════════════════════════════════════════════════════════════════════════

export default function AlgoVizTemplate() {
  // ── State ────────────────────────────────────────────────────────────────
  const [activeSolution, setActiveSolution] = useState<SolutionId>("optimized");
  const [activeTestCase, setActiveTestCase]  = useState<string>("example-1");

  // Input fields — rename/extend to match your problem's signature
  const [numsInput, setNumsInput] = useState("1,3,2");
  const [nums, setNums]           = useState<number[]>([1, 3, 2]);
  const [k, setK]                 = useState(2);

  const [steps, setSteps]               = useState<Step[]>(() => buildOptimizedSteps([1, 3, 2], 2));
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [playing, setPlaying]           = useState(false);
  const [speed, setSpeed]               = useState(700);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentStep = steps[currentStepIndex] ?? steps[0];

  // ── Rebuild when inputs change ────────────────────────────────────────
  const rebuild = useCallback(() => {
    const parsed = numsInput
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .map(Number);

    if (!parsed.length || parsed.some(isNaN)) return;

    setNums(parsed);

    // Replace / extend the next line when your problem has different params
    const newSteps =
      activeSolution === "naive"
        ? buildNaiveSteps(parsed, k)
        : buildOptimizedSteps(parsed, k);

    setSteps(newSteps);
    setCurrentStepIndex(0);
    setPlaying(false);
  }, [numsInput, k, activeSolution]);

  useEffect(() => { rebuild(); }, [rebuild]);

  // ── Playback ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playing) { if (intervalRef.current) clearInterval(intervalRef.current); return; }

    intervalRef.current = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= steps.length - 1) return prev;
        return prev + 1;
      });
    }, speed);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, speed, steps.length]);

  useEffect(() => {
    if (playing && currentStepIndex >= steps.length - 1) setPlaying(false);
  }, [currentStepIndex, steps.length, playing]);

  const complexity = COMPLEXITY[activeSolution];
  const phases     = PHASES_BY_SOLUTION[activeSolution];

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-6 overflow-hidden">

      {/* Header */}
      <header className="flex justify-between items-center mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-600 rounded-lg text-white shadow-lg">
            <Braces size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-none">
              {PROBLEM_TITLE}
            </h1>
            <p className="text-slate-500 text-xs mt-1 italic">
              {activeSolution === "naive" ? SOLUTIONS[0].label : SOLUTIONS[1].label}
            </p>
          </div>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded border border-rose-300 text-rose-700 bg-rose-50">
          {PROBLEM_BADGE}
        </span>
      </header>

      {/* Solution Tabs */}
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

        {/* ── LEFT COLUMN ─────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">

          {/* Problem Statement */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-sm text-slate-600 leading-relaxed">{PROBLEM_STATEMENT}</p>
          </div>

          {/* Phase Chips */}
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

          {/* Array Display */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-500 font-medium">Input Array</p>
              <div className="flex gap-3 text-[10px] text-slate-500">
                {/* ↓ Update legend labels to match your highlight semantics */}
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

          {/* ── YOUR CUSTOM VISUAL PANELS GO HERE ─────────────────────────
           *  Replace <ExampleCustomPanel /> with whatever you build above.
           *  You can render panels conditionally per solution, e.g.:
           *
           *    {activeSolution === "optimized" && (
           *      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
           *        <SegmentTreeDiagram ... />
           *        <HeapDiagram ... />
           *      </div>
           *    )}
           */}
          <ExampleCustomPanel step={currentStep} />

          {/* Selected Items Panel — remove/rename to fit your problem */}
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

          {/* Step Log */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-2">Step log</p>
            <StepLog steps={steps} currentIndex={currentStepIndex} />
          </div>

          {/* Code Panel */}
          <CodePanel solution={activeSolution} />
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────────────── */}
        <div className="w-full lg:w-80 flex flex-col gap-4 overflow-y-auto">

          {/* Test Cases */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-3">
            <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-medium">Test Cases</p>
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

              {/* ↓ Rename label and variable to match your problem */}
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

              {/* ↓ Rename / remove this field as needed */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wide">k</label>
                <input
                  type="number"
                  min={1}
                  value={k}
                  onChange={(e) => { setK(Number(e.target.value) || 1); setActiveTestCase("custom"); }}
                  className="font-mono text-xs px-2 py-1.5 rounded border border-slate-200 bg-slate-50 text-slate-900 w-24"
                />
              </div>

              <button
                onClick={rebuild}
                className="mt-1 px-3 py-1.5 rounded border border-slate-300 text-xs text-slate-800 hover:bg-slate-100 transition-colors"
              >
                Rebuild steps
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Keep n ≤ 10 so diagrams stay readable.
            </p>
          </div>

          {/* Animation Controls */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-2">Animation Controls</p>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <button
                onClick={() => setCurrentStepIndex(0)}
                disabled={currentStepIndex === 0}
                className="p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => setCurrentStepIndex((p) => Math.max(0, p - 1))}
                disabled={currentStepIndex === 0}
                className="p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
              >
                ←
              </button>
              <button
                onClick={() => setPlaying((p) => !p)}
                disabled={currentStepIndex >= steps.length - 1}
                className={`px-4 py-1.5 text-xs rounded-full border font-medium flex items-center gap-1 ${
                  playing
                    ? "bg-amber-50 text-amber-800 border-amber-300"
                    : "bg-blue-600 text-white border-blue-600 shadow-md"
                }`}
              >
                {playing ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Play</>}
              </button>
              <button
                onClick={() => setCurrentStepIndex((p) => Math.min(steps.length - 1, p + 1))}
                disabled={currentStepIndex >= steps.length - 1}
                className="p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
              >
                <StepForward size={16} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Speed</span>
              <input
                type="range"
                min={100}
                max={1200}
                step={100}
                value={1300 - speed}
                onChange={(e) => setSpeed(1300 - Number(e.target.value))}
                className="w-24 accent-blue-600"
              />
              <span className="text-xs font-mono text-slate-500">{speed}ms</span>
            </div>
            <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-200"
                style={{ width: steps.length ? `${((currentStepIndex + 1) / steps.length) * 100}%` : "0%" }}
              />
            </div>
            <span className="mt-1 block text-right text-xs text-slate-500 font-mono">
              {steps.length ? `${currentStepIndex + 1}/${steps.length}` : "0/0"}
            </span>
          </div>

          {/* Complexity */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-2">Complexity Analysis</p>
            <div className="flex flex-col gap-3 mb-1.5">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide">Time</span>
                <p className="font-mono text-sm text-slate-900">{complexity.time}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide">Space</span>
                <p className="font-mono text-sm text-slate-900">{complexity.space}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mt-2">{complexity.note}</p>
          </div>

        </div>
      </div>
    </div>
  );
}