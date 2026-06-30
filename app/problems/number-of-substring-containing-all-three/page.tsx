"use client";

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║   Number of Substrings Containing All Three Characters (LC 1358)        ║
 * ║                                                                          ║
 * ║   Three approaches:                                                      ║
 * ║   1. Naive O(n²)        — check every substring, scan its chars         ║
 * ║   2. Sliding Window O(n)— "last seen" trick, count via left bound       ║
 * ║   3. Fixed-window Two Pointer O(n) — shrink-from-left variant           ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Braces, Play, Pause, RotateCcw, StepForward } from "lucide-react";

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 1 — PROBLEM METADATA
// ════════════════════════════════════════════════════════════════════════════

const PROBLEM_TITLE    = "Number of Substrings Containing All Three Characters";
const PROBLEM_SUBTITLE = "Sliding Window · Last-Seen Trick";
const PROBLEM_BADGE    = "Medium • Two Pointers";
const PROBLEM_STATEMENT = `
  Given a string s of only 'a', 'b', 'c', count substrings that contain
  AT LEAST one of each character.

  Key insight: if s[l..r] is valid (has all 3), then EVERY substring
  s[l'..r] with l' ≤ l is also valid (shrinking the right doesn't change
  this — extending the LEFT boundary backward keeps all 3 present).
  So for each r, count = (number of valid starting points l).
`;

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 2 — SOLUTION DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

const SOLUTIONS = [
  { id: "naive",      label: "Naive",            complexity: "O(n²)" },
  { id: "lastseen",   label: "Last-Seen Trick",  complexity: "O(n)"  },
  { id: "twopointer", label: "Shrinking Window", complexity: "O(n)"  },
] as const;

type SolutionId = typeof SOLUTIONS[number]["id"];

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 3 — TEST CASES
// ════════════════════════════════════════════════════════════════════════════

const TEST_CASES = [
  { id: "ex1",    label: "Ex 1", s: "abcabc",  expected: 10, description: '"abcabc" → 10 valid substrings' },
  { id: "ex2",    label: "Ex 2", s: "aaacb",   expected: 3,  description: '"aaacb" → 3 valid substrings' },
  { id: "ex3",    label: "Ex 3", s: "abc",     expected: 1,  description: '"abc" → exactly 1 (itself)' },
  { id: "tricky", label: "Tricky", s: "cbaabc",expected: 7,  description: "Mixed order, repeats" },
  { id: "long",   label: "Longer", s: "abcabcabc", expected: 28, description: "Repeating pattern" },
  { id: "custom", label: "Custom", s: "abcabc", expected: -1, description: "Enter your own" },
] as const;

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 4 — CODE SNIPPETS
// ════════════════════════════════════════════════════════════════════════════

const NAIVE_CODE: string[] = [
  "int numberOfSubstrings(string s) {",
  "  int n = s.size(), count = 0;",
  "  for (int l = 0; l < n; l++) {        // O(n)",
  "    int freq[3] = {0,0,0};",
  "    for (int r = l; r < n; r++) {      // O(n)",
  "      freq[s[r]-'a']++;",
  "      if (freq[0] && freq[1] && freq[2])",
  "        count++;                       // valid from here on",
  "    }",
  "  }",
  "  return count;                        // Total: O(n²)",
  "}",
];

const LASTSEEN_CODE: string[] = [
  "int numberOfSubstrings(string s) {",
  "  int n = s.size();",
  "  long long count = 0;",
  "  int last[3] = {-1, -1, -1};  // last seen index of a,b,c",
  "  for (int r = 0; r < n; r++) {",
  "    last[s[r] - 'a'] = r;",
  "    // valid l range: [0 .. min(last[0],last[1],last[2])]",
  "    int minLast = min({last[0], last[1], last[2]});",
  "    if (minLast >= 0)",
  "      count += minLast + 1;  // # of valid left endpoints",
  "  }",
  "  return count;                        // Total: O(n)",
  "}",
];

const TWOPOINTER_CODE: string[] = [
  "int numberOfSubstrings(string s) {",
  "  int n = s.size();",
  "  long long count = 0;",
  "  int freq[3] = {0,0,0};",
  "  int l = 0;",
  "  for (int r = 0; r < n; r++) {",
  "    freq[s[r]-'a']++;",
  "    // shrink left while window still has all 3",
  "    while (freq[0] && freq[1] && freq[2]) {",
  "      freq[s[l]-'a']--;",
  "      l++;",
  "    }",
  "    // l is now 1 past the last valid left start",
  "    count += l;                        // # valid starts = l",
  "  }",
  "  return count;                        // Total: O(n)",
  "}",
];

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 5 — STEP TYPE
// ════════════════════════════════════════════════════════════════════════════

type Phase =
  | "init"
  | "outer_l"      // naive: new left start
  | "inner_r"      // naive: extending right
  | "valid_found"  // naive: window became valid
  | "scan_r"       // last-seen / two-pointer: processing position r
  | "update_last"  // last-seen: updating last[char]
  | "compute_min"  // last-seen: computing min(last)
  | "shrink"       // two-pointer: shrinking left while valid
  | "count_add"    // adding to running count
  | "done";

interface Step {
  phase: Phase;
  message: string;

  l: number | null;
  r: number | null;

  picks: { l: number; r: number; value: number }[];
  total: number;

  // freq counts for a/b/c
  freq: [number, number, number];
  // last-seen indices
  lastSeen: [number, number, number];
  // which char index is highlighted right now
  activeIdx: number | null;
  // count added in this exact step (for visual feedback)
  countDelta: number;
  // is window currently valid (contains all 3)?
  isValid: boolean;
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 6 — SIMULATION FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

function makeStep(partial: Partial<Step> & Pick<Step, "phase" | "message">): Step {
  return {
    l: null, r: null, picks: [], total: 0,
    freq: [0, 0, 0], lastSeen: [-1, -1, -1],
    activeIdx: null, countDelta: 0, isValid: false,
    ...partial,
  };
}

function ci(c: string): number { return c.charCodeAt(0) - 97; }

// ── NAIVE O(n²) ──
function buildNaiveSteps(s: string): Step[] {
  const steps: Step[] = [];
  const n = s.length;
  let count = 0;

  steps.push(makeStep({
    phase: "init",
    message: `Naive: try every starting point l, extend r until window has all 3 chars, then every r beyond that also counts.`,
  }));

  for (let l = 0; l < n; l++) {
    const freq: [number, number, number] = [0, 0, 0];
    let becameValidAt = -1;

    steps.push(makeStep({
      phase: "outer_l", l, r: l - 1, freq: [...freq], total: count,
      message: `New left boundary l=${l}. Reset frequency counts.`,
    }));

    for (let r = l; r < n; r++) {
      freq[ci(s[r])]++;
      const isValid = freq[0] > 0 && freq[1] > 0 && freq[2] > 0;
      if (isValid && becameValidAt === -1) becameValidAt = r;

      if (isValid) count++;

      steps.push(makeStep({
        phase: isValid && becameValidAt === r ? "valid_found" : "inner_r",
        l, r, freq: [...freq], total: count,
        activeIdx: r, isValid,
        countDelta: isValid ? 1 : 0,
        message: isValid
          ? (becameValidAt === r
            ? `r=${r}: added '${s[r]}'. Window [${l}..${r}] NOW has all 3! +1 → count=${count}`
            : `r=${r}: window still valid (has all 3). +1 → count=${count}`)
          : `r=${r}: added '${s[r]}'. freq=[a:${freq[0]}, b:${freq[1]}, c:${freq[2]}] — missing a char.`,
      }));
    }
  }

  steps.push(makeStep({
    phase: "done", total: count,
    message: `Done! Total substrings with all 3 chars = ${count}.`,
  }));

  return steps;
}

// ── LAST-SEEN TRICK O(n) ──
function buildLastSeenSteps(s: string): Step[] {
  const steps: Step[] = [];
  const n = s.length;
  let count = 0;
  const last: [number, number, number] = [-1, -1, -1];

  steps.push(makeStep({
    phase: "init", lastSeen: [...last],
    message: `Last-seen trick: track the most recent index of each char. For position r, valid left starts l are [0..min(last[a],last[b],last[c])].`,
  }));

  for (let r = 0; r < n; r++) {
    const idx = ci(s[r]);
    last[idx] = r;

    steps.push(makeStep({
      phase: "scan_r", r, l: 0, lastSeen: [...last],
      activeIdx: r, total: count,
      message: `r=${r}: char '${s[r]}' → update last[${"abc"[idx]}] = ${r}.`,
    }));

    const minLast = Math.min(last[0], last[1], last[2]);
    const delta = minLast >= 0 ? minLast + 1 : 0;
    count += delta;

    steps.push(makeStep({
      phase: "compute_min", r, l: minLast >= 0 ? 0 : null,
      lastSeen: [...last], total: count, countDelta: delta,
      isValid: minLast >= 0,
      message: minLast >= 0
        ? `min(last) = min(${last[0]},${last[1]},${last[2]}) = ${minLast}. Valid left starts: l ∈ [0..${minLast}] → +${delta}. count=${count}`
        : `min(last) = -1 (one char hasn't appeared yet). No valid substrings ending at r=${r}.`,
    }));
  }

  steps.push(makeStep({
    phase: "done", total: count,
    message: `Done! Total = ${count}. Each r contributes (minLast+1) valid left starts.`,
  }));

  return steps;
}

// ── TWO POINTER / SHRINKING WINDOW O(n) ──
function buildTwoPointerSteps(s: string): Step[] {
  const steps: Step[] = [];
  const n = s.length;
  let count = 0;
  const freq: [number, number, number] = [0, 0, 0];
  let l = 0;

  steps.push(makeStep({
    phase: "init", l: 0, freq: [...freq],
    message: `Two-pointer: grow r, then shrink l while window still contains all 3. Once l can't shrink further, every start ≤ l-1 is "exhausted" — count += l.`,
  }));

  for (let r = 0; r < n; r++) {
    freq[ci(s[r])]++;

    steps.push(makeStep({
      phase: "scan_r", l, r, freq: [...freq], total: count,
      activeIdx: r,
      message: `r=${r}: add '${s[r]}' → freq=[a:${freq[0]}, b:${freq[1]}, c:${freq[2]}]`,
    }));

    while (freq[0] > 0 && freq[1] > 0 && freq[2] > 0) {
      steps.push(makeStep({
        phase: "shrink", l, r, freq: [...freq], total: count,
        activeIdx: l, isValid: true,
        message: `Window [${l}..${r}] has all 3 → shrink: remove '${s[l]}' at l=${l}, then l++.`,
      }));
      freq[ci(s[l])]--;
      l++;
    }

    count += l;

    steps.push(makeStep({
      phase: "count_add", l, r, freq: [...freq], total: count,
      countDelta: l,
      message: `l is now ${l} (first index where window breaks). All starts in [0..${l - 1}] are valid → count += ${l} = ${count}.`,
    }));
  }

  steps.push(makeStep({
    phase: "done", total: count,
    message: `Done! Total = ${count}.`,
  }));

  return steps;
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 7 — COMPLEXITY INFO
// ════════════════════════════════════════════════════════════════════════════

const COMPLEXITY: Record<SolutionId, { time: string; space: string; note: string }> = {
  naive: {
    time: "O(n²)",
    space: "O(1)",
    note: "For each left boundary, scan rightward until window is valid, then count remaining positions. n=5×10⁴ → 2.5×10⁹ ops, too slow.",
  },
  lastseen: {
    time: "O(n)",
    space: "O(1)",
    note: "Track only the last index where each char appeared. min(last) directly gives the count of valid left starts for this r — single pass, no inner loop.",
  },
  twopointer: {
    time: "O(n)",
    space: "O(1)",
    note: "Classic shrinking window. l only ever moves forward, so total shrink operations are bounded by n — amortized O(n) overall.",
  },
};

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 8 — PHASE DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

const PHASE_META: Record<Phase, { color: string; borderColor: string; bgColor: string; icon: string }> = {
  init:         { color: "text-slate-500",   borderColor: "border-l-slate-400",   bgColor: "bg-slate-100",   icon: "→" },
  outer_l:      { color: "text-violet-700",  borderColor: "border-l-violet-500",  bgColor: "bg-violet-50",   icon: "L" },
  inner_r:      { color: "text-sky-700",     borderColor: "border-l-sky-500",     bgColor: "bg-sky-50",      icon: "R" },
  valid_found:  { color: "text-emerald-700", borderColor: "border-l-emerald-500", bgColor: "bg-emerald-50",  icon: "★" },
  scan_r:       { color: "text-sky-700",     borderColor: "border-l-sky-500",     bgColor: "bg-sky-50",      icon: "→" },
  update_last:  { color: "text-amber-700",   borderColor: "border-l-amber-500",   bgColor: "bg-amber-50",    icon: "U" },
  compute_min:  { color: "text-emerald-700", borderColor: "border-l-emerald-500", bgColor: "bg-emerald-50",  icon: "Σ" },
  shrink:       { color: "text-rose-700",    borderColor: "border-l-rose-500",    bgColor: "bg-rose-50",     icon: "←" },
  count_add:    { color: "text-emerald-700", borderColor: "border-l-emerald-500", bgColor: "bg-emerald-50",  icon: "+" },
  done:         { color: "text-emerald-800", borderColor: "border-l-emerald-600", bgColor: "bg-emerald-100", icon: "■" },
};

const PHASES_BY_SOLUTION: Record<SolutionId, Phase[]> = {
  naive:      ["init", "outer_l", "inner_r", "valid_found", "done"],
  lastseen:   ["init", "scan_r", "update_last", "compute_min", "done"],
  twopointer: ["init", "scan_r", "shrink", "count_add", "done"],
};

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 9 — REUSABLE UI COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

function CodePanel({ solution }: { solution: SolutionId }) {
  const lines = solution === "naive" ? NAIVE_CODE : solution === "lastseen" ? LASTSEEN_CODE : TWOPOINTER_CODE;
  const filename = solution === "naive" ? "naive.cpp" : solution === "lastseen" ? "last_seen.cpp" : "two_pointer.cpp";

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

function CharCell({ char, index, step }: { char: string; index: number; step: Step }) {
  const inRange = step.l != null && step.r != null && index >= step.l && index <= step.r;
  const isActive = step.activeIdx === index;

  function getColors() {
    if (isActive) {
      if (step.phase === "shrink") return "bg-rose-400 border-rose-600 text-white scale-110 shadow-md";
      if (step.phase === "valid_found" || step.phase === "compute_min") return "bg-emerald-400 border-emerald-600 text-white scale-110 shadow-md";
      return "bg-amber-300 border-amber-500 text-amber-900 scale-110 shadow-md";
    }
    if (!inRange) return "bg-slate-50 border-slate-200 text-slate-400";
    if (step.isValid) return "bg-emerald-50 border-emerald-300 text-emerald-800";
    return "bg-sky-50 border-sky-300 text-sky-800";
  }

  const charColor: Record<string, string> = {
    a: "text-blue-600", b: "text-violet-600", c: "text-rose-600",
  };

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] text-slate-400 font-mono leading-none">{index}</span>
      <div className={`w-9 h-9 flex items-center justify-center font-mono text-sm font-bold border-2 rounded-md transition-all duration-200 ${getColors()}`}>
        <span className={isActive ? "" : charColor[char]}>{char}</span>
      </div>
    </div>
  );
}

function StepLog({ steps, currentIndex }: { steps: Step[]; currentIndex: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [currentIndex]);
  const visible = steps.slice(0, currentIndex + 1);

  return (
    <div ref={ref} className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
      {visible.map((step, i) => {
        const meta = PHASE_META[step.phase];
        return (
          <div key={i} className={`flex items-start gap-2 px-2 py-1.5 rounded-r border-l-2 text-xs transition-all duration-200 ${meta.borderColor} ${meta.bgColor} ${i === currentIndex ? "opacity-100" : "opacity-60"}`}>
            <span className="font-mono font-bold text-slate-500 shrink-0 w-4">{meta.icon}</span>
            <span className="text-slate-700 leading-snug">{step.message}</span>
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 10 — CUSTOM VISUAL PANELS
// ════════════════════════════════════════════════════════════════════════════

// ── Frequency / Last-seen panel ──
function FreqPanel({ step, solution }: { step: Step; solution: SolutionId }) {
  const labels = ["a", "b", "c"];
  const colors = ["#3b82f6", "#8b5cf6", "#ef4444"];

  if (solution === "lastseen") {
    return (
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
        <p className="text-xs text-slate-500 font-medium mb-3">Last-seen index per character</p>
        <div className="flex gap-4">
          {labels.map((c, i) => (
            <div key={c} className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-lg border"
              style={{ borderColor: `${colors[i]}40`, background: `${colors[i]}08` }}>
              <span className="text-xs font-bold" style={{ color: colors[i] }}>'{c}'</span>
              <span className="text-2xl font-mono font-bold" style={{ color: colors[i] }}>
                {step.lastSeen[i] === -1 ? "—" : step.lastSeen[i]}
              </span>
              <span className="text-[10px] text-slate-400">last index</span>
            </div>
          ))}
        </div>
        {step.lastSeen.every(v => v >= 0) && (
          <div className="mt-3 text-center text-xs text-slate-600 font-mono">
            min({step.lastSeen.join(", ")}) = <span className="font-bold text-emerald-700">{Math.min(...step.lastSeen)}</span>
          </div>
        )}
      </div>
    );
  }

  // freq panel for naive / two-pointer
  const maxFreq = Math.max(1, ...step.freq);
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
      <p className="text-xs text-slate-500 font-medium mb-3">Character frequency in window</p>
      <div className="flex gap-4 items-end h-24">
        {labels.map((c, i) => (
          <div key={c} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            <span className="text-xs font-mono font-bold" style={{ color: colors[i] }}>{step.freq[i]}</span>
            <div className="w-full rounded-t transition-all duration-300" style={{
              height: `${Math.max(8, (step.freq[i] / maxFreq) * 70)}px`,
              background: step.freq[i] > 0 ? colors[i] : "#e2e8f0",
            }} />
            <span className="text-xs font-bold" style={{ color: colors[i] }}>'{c}'</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-2">
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${step.isValid ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
          {step.isValid ? "✓ Window has all 3" : "✗ Missing a character"}
        </span>
      </div>
    </div>
  );
}

// ── Running count tracker ──
function CountPanel({ step }: { step: Step }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 font-medium">Running count</p>
        {step.countDelta > 0 && (
          <span className="text-xs font-mono font-bold text-emerald-600 animate-pulse">
            +{step.countDelta}
          </span>
        )}
      </div>
      <div className="mt-2 text-3xl font-bold font-mono text-emerald-600">
        {step.total}
      </div>
    </div>
  );
}

// ── Valid-starts visual (for last-seen and two-pointer) ──
function ValidStartsPanel({ step, s, solution }: { step: Step; s: string; solution: SolutionId }) {
  if (step.r == null) return null;
  const validUpTo = solution === "lastseen"
    ? (step.lastSeen.every(v => v >= 0) ? Math.min(...step.lastSeen) : -1)
    : step.l != null ? step.l - 1 : -1;

  if (validUpTo < 0) return null;

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
      <p className="text-xs text-slate-500 font-medium mb-3">
        Valid left-start positions for r={step.r}
      </p>
      <div className="flex flex-wrap gap-1">
        {s.split("").map((c, i) => {
          const isValidStart = i <= validUpTo;
          const isBeyondR = step.r != null && i > step.r;
          return (
            <div key={i} className={`w-7 h-7 flex items-center justify-center text-xs font-mono font-bold rounded border transition-all
              ${isBeyondR ? "bg-slate-50 border-slate-100 text-slate-200"
                : isValidStart ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                : "bg-slate-50 border-slate-200 text-slate-300"}`}>
              {c}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Substrings s[l..{step.r}] are valid for l = 0..{validUpTo} →{" "}
        <span className="font-bold text-emerald-700">{validUpTo + 1} substrings</span>
      </p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 11 — MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function AlgoVizTemplate() {
  const [activeSolution, setActiveSolution] = useState<SolutionId>("lastseen");
  const [activeTestCase, setActiveTestCase]  = useState<string>("ex1");

  const [sInput, setSInput] = useState("abcabc");

  const [steps, setSteps]                       = useState<Step[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [playing, setPlaying]                   = useState(false);
  const [speed, setSpeed]                       = useState(500);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentStep = steps[currentStepIndex] ?? steps[0];

  const rebuild = useCallback(() => {
    const s = sInput.toLowerCase().replace(/[^abc]/g, "");
    if (!s.length) return;
    const newSteps =
      activeSolution === "naive" ? buildNaiveSteps(s)
      : activeSolution === "lastseen" ? buildLastSeenSteps(s)
      : buildTwoPointerSteps(s);

    setSteps(newSteps);
    setCurrentStepIndex(0);
    setPlaying(false);
  }, [sInput, activeSolution]);

  useEffect(() => { rebuild(); }, [rebuild]);

  useEffect(() => {
    if (!playing) { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setCurrentStepIndex(p => p >= steps.length - 1 ? p : p + 1);
    }, speed);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, speed, steps.length]);

  useEffect(() => {
    if (playing && currentStepIndex >= steps.length - 1) setPlaying(false);
  }, [currentStepIndex, steps.length, playing]);

  const s = sInput.toLowerCase().replace(/[^abc]/g, "");
  const complexity = COMPLEXITY[activeSolution];
  const phases     = PHASES_BY_SOLUTION[activeSolution];

  if (!currentStep) return null;

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
            <p className="text-slate-500 text-xs mt-1 italic">{PROBLEM_SUBTITLE}</p>
          </div>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded border border-rose-300 text-rose-700 bg-rose-50">
          {PROBLEM_BADGE}
        </span>
      </header>

      {/* Solution Tabs */}
      <div className="flex gap-2 mb-4 shrink-0 bg-slate-200/50 p-1 rounded-xl w-fit flex-wrap">
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
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{PROBLEM_STATEMENT}</p>
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
                {p.replace(/_/g, " ")}
              </div>
            ))}
          </div>

          {/* String Display */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-500 font-medium">String s</p>
              <div className="flex gap-3 text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-sky-50 border border-sky-300 inline-block" />
                  In window
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-emerald-50 border border-emerald-300 inline-block" />
                  Window valid
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {s.split("").map((c, i) => (
                <CharCell key={i} char={c} index={i} step={currentStep} />
              ))}
            </div>
            {currentStep.l != null && currentStep.r != null && (
              <div className="mt-2 text-xs text-slate-600 font-mono">
                Window: <span className="text-slate-900">[{currentStep.l}…{currentStep.r}]</span>
                {" → \""}{s.slice(currentStep.l, currentStep.r + 1)}{"\""}
              </div>
            )}
          </div>

          {/* Frequency / Last-seen panel */}
          <FreqPanel step={currentStep} solution={activeSolution} />

          {/* Valid starts visual (lastseen + twopointer only) */}
          {activeSolution !== "naive" && (
            <ValidStartsPanel step={currentStep} s={s} solution={activeSolution} />
          )}

          {/* Running count */}
          <CountPanel step={currentStep} />

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
                    if (tc.id !== "custom") setSInput(tc.s);
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
            {activeTestCase !== "custom" && (() => {
              const tc = TEST_CASES.find((t) => t.id === activeTestCase);
              return tc ? (
                <>
                  <p className="text-[10px] text-slate-500 italic">{tc.description}</p>
                  {tc.expected >= 0 && (
                    <p className="text-[10px] font-mono text-emerald-700">Expected: {tc.expected}</p>
                  )}
                </>
              ) : null;
            })()}
          </div>

          {/* Input Configuration */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-2">
            <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-medium">
              Input Configuration
            </p>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 uppercase tracking-wide">
                s (only a, b, c)
              </label>
              <input
                type="text"
                value={sInput}
                onChange={(e) => { setSInput(e.target.value); setActiveTestCase("custom"); }}
                className="font-mono text-xs px-2 py-1.5 rounded border border-slate-200 bg-slate-50 text-slate-900"
                maxLength={20}
              />
            </div>
            <button
              onClick={rebuild}
              className="mt-1 w-full px-3 py-1.5 rounded border border-slate-300 text-xs text-slate-800 hover:bg-slate-100 transition-colors"
            >
              Rebuild steps
            </button>
            <p className="text-[10px] text-slate-500 mt-1">Keep length ≤ 20 for readability.</p>
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
                min={80}
                max={1200}
                step={80}
                value={1280 - speed}
                onChange={(e) => setSpeed(1280 - Number(e.target.value))}
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

          {/* Key Insight */}
          <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100">
            <p className="text-xs font-bold text-indigo-700 mb-2 uppercase tracking-wide">Key insight</p>
            <p className="text-xs text-indigo-700 leading-relaxed">
              If s[l..r] contains all 3 chars, so does s[l'..r] for any l' &lt; l —
              shrinking the right doesn't matter, but every smaller left start
              still keeps all 3 chars in range. So for each r, the valid left
              starts form a prefix [0..bound], and we just need to find that bound.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}