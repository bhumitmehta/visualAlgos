"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Braces,
  ChartNoAxesColumn,
  ChevronDown,
  ChevronUp,
  FileCode2,
  Home,
  ListChecks,
  Menu,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  StepForward,
  Zap,
} from "lucide-react";

// ════════════════════════════════════════════════════════════════════════════
// SECTION 1 — PROBLEM METADATA
// ════════════════════════════════════════════════════════════════════════════

const PROBLEM_TITLE = "Problem Title Here";
const PROBLEM_SUBTITLE = "Approach 1 / Approach 2";
const PROBLEM_BADGE = "Medium • Dynamic Programming";
const PROBLEM_STATEMENT = `
  Describe the problem here. Keep it concise but precise enough that someone
  arriving fresh can understand what they're watching without opening LeetCode.
  You can reference code variables inline like nums[l..r] and explain the goal.
`;

// ════════════════════════════════════════════════════════════════════════════
// SECTION 2 — SOLUTION DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

const SOLUTIONS = [
  { id: "naive", label: "Naive Approach", complexity: "O(n²)" },
  { id: "optimized", label: "Optimized Approach", complexity: "O(n log n)" },
] as const;

type SolutionId = (typeof SOLUTIONS)[number]["id"];

// ════════════════════════════════════════════════════════════════════════════
// SECTION 3 — TEST CASES
// ════════════════════════════════════════════════════════════════════════════

const TEST_CASES = [
  {
    id: "example-1",
    label: "Example 1",
    nums: [1, 3, 2],
    k: 2,
    description: "Basic case",
  },
  {
    id: "example-2",
    label: "All Equal",
    nums: [5, 5, 5, 5],
    k: 3,
    description: "Uniform array edge case",
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
// SECTION 4 — CODE SNIPPETS
// ════════════════════════════════════════════════════════════════════════════

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
// SECTION 5 — STEP TYPE
// ════════════════════════════════════════════════════════════════════════════

type Phase = "init" | "process" | "select" | "done";

interface Step {
  phase: Phase;
  message: string;
  l: number | null;
  r: number | null;
  picks: { l: number; r: number; value: number }[];
  total: number;
}

function makeStep(partial: Partial<Step> & Pick<Step, "phase" | "message">): Step {
  return {
    l: null,
    r: null,
    picks: [],
    total: 0,
    ...partial,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// SECTION 6 — SIMULATION FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

function buildNaiveSteps(nums: number[], k: number): Step[] {
  const steps: Step[] = [];

  steps.push(
    makeStep({
      phase: "init",
      message: "Initialize the brute-force story: scan every possible range.",
    })
  );

  let best = 0;
  for (let l = 0; l < nums.length; l++) {
    for (let r = l; r < nums.length; r++) {
      const value = nums.slice(l, r + 1).reduce((a, b) => a + b, 0);
      best = Math.max(best, value);
      steps.push(
        makeStep({
          phase: "process",
          message: `Inspect range [${l}, ${r}] — local value = ${value}.`,
          l,
          r,
          total: value,
        })
      );
      steps.push(
        makeStep({
          phase: "select",
          message: `Compare against the best seen so far. Current best = ${best}.`,
          l,
          r,
          picks: [{ l, r, value }],
          total: best,
        })
      );
    }
  }

  steps.push(
    makeStep({
      phase: "done",
      message: `Done — brute force finishes with best = ${best}.`,
      total: best,
    })
  );

  return steps;
}

function buildOptimizedSteps(nums: number[], k: number): Step[] {
  const steps: Step[] = [];

  steps.push(
    makeStep({
      phase: "init",
      message: "Initialize the optimized flow: move once, keep only what matters.",
    })
  );

  let running = 0;
  let best = 0;

  for (let i = 0; i < nums.length; i++) {
    running += nums[i];
    best = Math.max(best, running);

    steps.push(
      makeStep({
        phase: "process",
        message: `Visit index ${i}. Running total becomes ${running}.`,
        l: Math.max(0, i - 1),
        r: i,
        total: running,
      })
    );

    steps.push(
      makeStep({
        phase: "select",
        message: `Keep the stronger state. Best answer now ${best}.`,
        l: Math.max(0, i - 1),
        r: i,
        picks: [{ l: Math.max(0, i - 1), r: i, value: running }],
        total: best,
      })
    );
  }

  steps.push(
    makeStep({
      phase: "done",
      message: `Done — optimized flow settles at ${best}.`,
      total: best,
    })
  );

  return steps;
}

// ════════════════════════════════════════════════════════════════════════════
// SECTION 7 — COMPLEXITY INFO
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
// SECTION 8 — PHASE DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

const PHASE_META: Record<
  Phase,
  { color: string; borderColor: string; bgColor: string; icon: string }
> = {
  init: {
    color: "text-slate-500",
    borderColor: "border-l-slate-400",
    bgColor: "bg-slate-100",
    icon: "→",
  },
  process: {
    color: "text-sky-700",
    borderColor: "border-l-sky-500",
    bgColor: "bg-sky-50",
    icon: "P",
  },
  select: {
    color: "text-emerald-700",
    borderColor: "border-l-emerald-500",
    bgColor: "bg-emerald-50",
    icon: "★",
  },
  done: {
    color: "text-emerald-800",
    borderColor: "border-l-emerald-600",
    bgColor: "bg-emerald-100",
    icon: "■",
  },
};

const PHASES_BY_SOLUTION: Record<SolutionId, Phase[]> = {
  naive: ["init", "process", "select", "done"],
  optimized: ["init", "process", "select", "done"],
};

// ════════════════════════════════════════════════════════════════════════════
// Reusable UI Components
// ════════════════════════════════════════════════════════════════════════════

function CodePanel({ solution }: { solution: SolutionId }) {
  const lines = solution === "naive" ? NAIVE_CODE : OPTIMIZED_CODE;
  const filename = solution === "naive" ? "naive.cpp" : "optimized.cpp";

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
      <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        <span className="ml-2 text-xs text-slate-500 font-mono">{filename}</span>
      </div>
      <div className="overflow-auto max-h-56 sm:max-h-72 bg-slate-950/95">
        <table className="w-full text-[11px] sm:text-xs font-mono">
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} className="hover:bg-slate-900 text-slate-100">
                <td className="select-none w-8 sm:w-10 text-right pr-2 sm:pr-3 pl-2 py-0.5 text-slate-500 border-r border-slate-800">
                  {i + 1}
                </td>
                <td className="pl-2 sm:pl-3 py-0.5 whitespace-pre">{line}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ArrayCell({ value, index, step }: { value: number; index: number; step: Step }) {
  const inRange = step.l != null && step.r != null && index >= step.l && index <= step.r;

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
    <div className="flex flex-col items-center gap-0.5 shrink-0">
      <span className="text-[10px] text-slate-400 font-mono leading-none">{index}</span>
      <div
        className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center font-mono text-xs sm:text-sm font-medium border rounded-md transition-all duration-200 ${getColors()}`}
      >
        {value}
      </div>
    </div>
  );
}

function StepLog({ steps, currentIndex }: { steps: Step[]; currentIndex: number }) {
  const visible = steps.slice(0, currentIndex + 1).reverse();

  return (
    <div className="flex flex-col gap-1 max-h-44 sm:max-h-56 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
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
            <span className="font-mono font-bold text-slate-500 shrink-0 w-4">{meta.icon}</span>
            <span className="text-slate-700 leading-snug">{step.message}</span>
          </div>
        );
      })}
    </div>
  );
}

function MobileSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
      >
        <span className="text-sm font-semibold text-slate-800">{title}</span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function ExampleCustomPanel() {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-500 font-medium">Your Custom Panel</p>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Storyboard</span>
      </div>
      <div className="h-32 sm:h-40 flex items-center justify-center bg-gradient-to-br from-slate-50 to-white rounded-xl border border-dashed border-slate-300">
        <span className="text-xs text-slate-400 italic text-center px-4">
          Replace this with your diagram (tree / DP table / graph / bars…)
        </span>
      </div>
    </div>
  );
}

function MobileDock({
  playing,
  setPlaying,
  setMenuOpen,
  scrollTo,
}: {
  playing: boolean;
  setPlaying: (v: boolean) => void;
  setMenuOpen: (v: boolean) => void;
  scrollTo: (key: SectionKey) => void;
}) {
  return (
    <div className="xl:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-[0_-8px_24px_rgba(15,23,42,0.08)] pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 gap-1 px-2 py-2">
        <button
          onClick={() => scrollTo("hero")}
          className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] text-slate-700 hover:bg-slate-100 active:scale-[0.98]"
        >
          <Home size={16} />
          Home
        </button>

        <button
          onClick={() => scrollTo("cases")}
          className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] text-slate-700 hover:bg-slate-100 active:scale-[0.98]"
        >
          <ListChecks size={16} />
          Cases
        </button>

        <button
          onClick={() => setPlaying(!playing)}
          className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] text-blue-700 font-semibold hover:bg-blue-50 active:scale-[0.98]"
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
          {playing ? "Pause" : "Play"}
        </button>

        <button
          onClick={() => scrollTo("controls")}
          className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] text-slate-700 hover:bg-slate-100 active:scale-[0.98]"
        >
          <Settings2 size={16} />
          Controls
        </button>

        <button
          onClick={() => setMenuOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] text-slate-700 hover:bg-slate-100 active:scale-[0.98]"
        >
          <Menu size={16} />
          Menu
        </button>
      </div>
    </div>
  );
}

type SectionKey =
  | "hero"
  | "array"
  | "story"
  | "log"
  | "code"
  | "cases"
  | "input"
  | "controls"
  | "complexity";

function MobileMenuSheet({
  open,
  close,
  goTo,
}: {
  open: boolean;
  close: () => void;
  goTo: (section: SectionKey) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] xl:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 pb-8 shadow-2xl">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Navigate</h3>
          <span className="text-[10px] uppercase tracking-widest text-slate-400">Quick jump</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => goTo("hero")} className="px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 flex items-center gap-2 justify-center">
            <Home size={16} /> Hero
          </button>
          <button onClick={() => goTo("array")} className="px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 flex items-center gap-2 justify-center">
            <Activity size={16} /> Visualizer
          </button>
          <button onClick={() => goTo("story")} className="px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 flex items-center gap-2 justify-center">
            <Zap size={16} /> Story
          </button>
          <button onClick={() => goTo("cases")} className="px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 flex items-center gap-2 justify-center">
            <ListChecks size={16} /> Cases
          </button>
          <button onClick={() => goTo("input")} className="px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 flex items-center gap-2 justify-center">
            <Settings2 size={16} /> Inputs
          </button>
          <button onClick={() => goTo("controls")} className="px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 flex items-center gap-2 justify-center">
            <ChartNoAxesColumn size={16} /> Controls
          </button>
          <button onClick={() => goTo("complexity")} className="px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 flex items-center gap-2 justify-center">
            <ListChecks size={16} /> Complexity
          </button>
          <button onClick={() => goTo("code")} className="px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 flex items-center gap-2 justify-center">
            <FileCode2 size={16} /> Code
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
  badge,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  badge?: string;
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-semibold text-slate-900 leading-tight">{title}</h2>
          {subtitle ? <p className="text-xs sm:text-sm text-slate-500 mt-1">{subtitle}</p> : null}
        </div>
        {badge ? (
          <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-slate-100 text-slate-500 shrink-0">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="px-4 sm:px-5 pb-4 sm:pb-5">{children}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function AlgoVizTemplate() {
  const [activeSolution, setActiveSolution] = useState<SolutionId>("optimized");
  const [activeTestCase, setActiveTestCase] = useState<string>("example-1");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [numsInput, setNumsInput] = useState("1,3,2");
  const [nums, setNums] = useState<number[]>([1, 3, 2]);
  const [k, setK] = useState(2);

  const [steps, setSteps] = useState<Step[]>(() => buildOptimizedSteps([1, 3, 2], 2));
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(700);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentStep = steps[currentStepIndex] ?? steps[0];

  const sectionRefs = {
    hero: useRef<HTMLDivElement | null>(null),
    array: useRef<HTMLDivElement | null>(null),
    story: useRef<HTMLDivElement | null>(null),
    log: useRef<HTMLDivElement | null>(null),
    code: useRef<HTMLDivElement | null>(null),
    cases: useRef<HTMLDivElement | null>(null),
    input: useRef<HTMLDivElement | null>(null),
    controls: useRef<HTMLDivElement | null>(null),
    complexity: useRef<HTMLDivElement | null>(null),
  } as const;

  type SectionKey = keyof typeof sectionRefs;

  const scrollTo = useCallback((key: SectionKey) => {
    sectionRefs[key].current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileMenuOpen(false);
  }, []);

  const rebuild = useCallback(() => {
    const parsed = numsInput
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .map(Number);

    if (!parsed.length || parsed.some(Number.isNaN)) return;

    setNums(parsed);

    const newSteps = activeSolution === "naive" ? buildNaiveSteps(parsed, k) : buildOptimizedSteps(parsed, k);
    setSteps(newSteps);
    setCurrentStepIndex(0);
    setPlaying(false);
  }, [numsInput, k, activeSolution]);

  useEffect(() => {
    rebuild();
  }, [rebuild]);

  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentStepIndex((prev) => (prev >= steps.length - 1 ? prev : prev + 1));
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, speed, steps.length]);

  useEffect(() => {
    if (playing && currentStepIndex >= steps.length - 1) setPlaying(false);
  }, [currentStepIndex, steps.length, playing]);

  const complexity = COMPLEXITY[activeSolution];
  const phases = PHASES_BY_SOLUTION[activeSolution];
  const progress = steps.length ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

  const activeCase = useMemo(
    () => TEST_CASES.find((tc) => tc.id === activeTestCase),
    [activeTestCase]
  );

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 font-sans">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-5 pb-28 xl:pb-5">
        {/* Hero */}
        <div ref={sectionRefs.hero} className="mb-4 sm:mb-5">
          <div className="bg-gradient-to-br from-white via-white to-slate-50 rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2.5 bg-emerald-600 rounded-2xl text-white shadow-lg shrink-0">
                  <Braces size={22} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">{PROBLEM_TITLE}</h1>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold uppercase tracking-wider">
                      <Zap size={12} /> story-driven
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs sm:text-sm">{PROBLEM_SUBTITLE}</p>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-3xl whitespace-pre-line">
                    {PROBLEM_STATEMENT}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-2">
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-rose-300 text-rose-700 bg-rose-50">
                  {PROBLEM_BADGE}
                </span>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-400">
                  <span>Trace</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span>Visualize</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span>Learn</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Solution Tabs */}
        <div className="overflow-x-auto pb-1 mb-4">
          <div className="inline-flex gap-2 bg-slate-200/60 p-1 rounded-2xl">
            {SOLUTIONS.map((sol) => (
              <button
                key={sol.id}
                onClick={() => setActiveSolution(sol.id)}
                className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap active:scale-[0.99] ${
                  activeSolution === sol.id ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {sol.label}
                <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-mono">
                  {sol.complexity}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4">
          {/* Story lane */}
          <div className="flex flex-col gap-4">
            <SectionCard
              title="The idea"
              subtitle="The algorithm should feel like a sequence of small, readable moments."
              badge="overview"
            >
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

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">Current phase</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 capitalize">{currentStep.phase}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">Progress</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{steps.length ? `${currentStepIndex + 1}/${steps.length}` : "0/0"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">Best result</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-600 font-mono">{currentStep.total}</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Input array" subtitle="Touch-friendly array viewport with range highlighting." badge="visual">
              <div ref={sectionRefs.array}>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-xs text-slate-500 font-medium">Input Array</p>
                  <div className="flex gap-3 text-[10px] text-slate-500 flex-wrap justify-end">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-sm bg-sky-50 border border-sky-400 inline-block" /> Processing
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-sm bg-emerald-50 border border-emerald-500 inline-block" /> Selected
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto pb-1">
                  <div className="flex flex-wrap sm:flex-nowrap gap-2 min-w-max sm:min-w-0">
                    {nums.map((v, i) => (
                      <ArrayCell key={i} value={v} index={i} step={currentStep} />
                    ))}
                  </div>
                </div>

                {currentStep.l != null && currentStep.r != null && (
                  <div className="mt-3 text-xs text-slate-600 font-mono break-words">
                    Range: <span className="text-slate-900">[{currentStep.l}…{currentStep.r}]</span>
                    {" → ["}
                    {nums.slice(currentStep.l, currentStep.r + 1).join(", ")}
                    {"]"}
                  </div>
                )}
              </div>
            </SectionCard>

            <div ref={sectionRefs.story}>
              <ExampleCustomPanel />
            </div>

            <SectionCard title="Selected trail" subtitle="A compact memory of the best states so far." badge="trace">
              <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
                {currentStep.picks.map((p, i) => (
                  <div key={i} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-mono rounded border border-emerald-200">
                    [{p.l},{p.r}] = {p.value}
                  </div>
                ))}
                {currentStep.picks.length === 0 && <span className="text-xs text-slate-400 italic">None yet</span>}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs text-slate-500 font-medium">Result:</span>
                <span className="text-lg font-bold font-mono text-emerald-600">{currentStep.total}</span>
              </div>
            </SectionCard>

            <SectionCard title="Step log" subtitle="The algorithm, told as a sequence of moments." badge="journal">
              <div ref={sectionRefs.log}>
                <StepLog steps={steps} currentIndex={currentStepIndex} />
              </div>
            </SectionCard>

            <div ref={sectionRefs.code}>
              <SectionCard title="Code" subtitle="Keep the implementation aligned with the story above." badge="source">
                <CodePanel solution={activeSolution} />
              </SectionCard>
            </div>
          </div>

          {/* Right column — desktop only */}
          <div className="hidden xl:flex flex-col gap-4">
            <SectionCard title="Test cases" subtitle="Fast presets for exploration." badge="cases">
              <div ref={sectionRefs.cases} className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {TEST_CASES.map((tc) => (
                    <button
                      key={tc.id}
                      onClick={() => {
                        setActiveTestCase(tc.id);
                        if (tc.id !== "custom" && tc.nums.length) {
                          setNumsInput((tc.nums as readonly number[]).join(", "));
                          // @ts-ignore
                          if (tc.k) setK(tc.k);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors active:scale-[0.99] ${
                        activeTestCase === tc.id ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {tc.label}
                    </button>
                  ))}
                </div>
                {activeCase && activeCase.id !== "custom" && (
                  <p className="text-[10px] text-slate-500 italic">{activeCase.description}</p>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Input configuration" subtitle="Adjust the scene quickly." badge="inputs">
              <div ref={sectionRefs.input} className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wide">nums (comma-separated)</label>
                  <input
                    type="text"
                    value={numsInput}
                    onChange={(e) => {
                      setNumsInput(e.target.value);
                      setActiveTestCase("custom");
                    }}
                    className="font-mono text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                  />
                </div>

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
                    className="font-mono text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 w-28"
                  />
                </div>

                <button
                  onClick={rebuild}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 hover:bg-slate-100 transition-colors w-full"
                >
                  Rebuild steps
                </button>

                <p className="text-[10px] text-slate-500">Keep n ≤ 10 so diagrams stay readable.</p>
              </div>
            </SectionCard>

            <SectionCard title="Animation controls" subtitle="Move through the trace like a timeline." badge="motion">
              <div ref={sectionRefs.controls}>
                <div className="flex items-center gap-3 flex-wrap mb-3">
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
                    className={`px-4 py-2 text-xs rounded-full border font-medium flex items-center gap-1 active:scale-[0.99] ${
                      playing ? "bg-amber-50 text-amber-800 border-amber-300" : "bg-blue-600 text-white border-blue-600 shadow-md"
                    }`}
                  >
                    {playing ? (
                      <>
                        <Pause size={14} /> Pause
                      </>
                    ) : (
                      <>
                        <Play size={14} /> Play
                      </>
                    )}
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
                    className="w-28 accent-blue-600"
                  />
                  <span className="text-xs font-mono text-slate-500">{speed}ms</span>
                </div>

                <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="mt-1 block text-right text-xs text-slate-500 font-mono">
                  {steps.length ? `${currentStepIndex + 1}/${steps.length}` : "0/0"}
                </span>
              </div>
            </SectionCard>

            <SectionCard title="Complexity analysis" subtitle="A clean comparison card for quick review." badge="cost">
              <div ref={sectionRefs.complexity} className="space-y-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide">Time</span>
                  <p className="font-mono text-sm text-slate-900">{complexity.time}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide">Space</span>
                  <p className="font-mono text-sm text-slate-900">{complexity.space}</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{complexity.note}</p>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>

      {/* Mobile bottom dock and sheet */}
      <MobileDock
        playing={playing}
        setPlaying={setPlaying}
        setMenuOpen={setMobileMenuOpen}
        scrollTo={scrollTo}
      />
      <MobileMenuSheet
        open={mobileMenuOpen}
        close={() => setMobileMenuOpen(false)}
        goTo={scrollTo}
      />
    </div>
  );
}
