"use client";

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║              AlgoViz — Edit Distance (Levenshtein)                      ║
 * ║                                                                          ║
 * ║  Visualization for LeetCode 72                                           ║
 * ║  Core visual: DP table filling cell-by-cell with operation arrows        ║
 * ║  dp[i][j] = min ops to convert word1[0..i-1] → word2[0..j-1]           ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Table2, Play, Pause, RotateCcw, StepForward } from "lucide-react";

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 1 — PROBLEM METADATA
// ════════════════════════════════════════════════════════════════════════════

const PROBLEM_TITLE    = "Edit Distance";
const PROBLEM_SUBTITLE = "Dynamic Programming · Levenshtein Distance";
const PROBLEM_BADGE    = "Medium • DP";
const PROBLEM_STATEMENT =
`Convert word1 → word2 using the fewest Insert / Delete / Replace operations.

Intuition: dp[i][j] = min ops to convert word1[0..i-1] to word2[0..j-1].

  If word1[i-1] == word2[j-1]:  dp[i][j] = dp[i-1][j-1]      (chars match, free)
  Else take the best of 3 ops:
    Replace → dp[i-1][j-1] + 1   (swap the mismatched chars)
    Delete  → dp[i-1][j]   + 1   (remove word1[i-1])
    Insert  → dp[i][j-1]   + 1   (insert word2[j-1] into word1)`;

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 2 — SOLUTION DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

const SOLUTIONS = [
  { id: "dp",      label: "DP Table",    complexity: "O(m·n)" },
  { id: "space",   label: "Space-Opt",   complexity: "O(n)"   },
] as const;

type SolutionId = typeof SOLUTIONS[number]["id"];

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 3 — TEST CASES
// ════════════════════════════════════════════════════════════════════════════

const TEST_CASES = [
  { id: "ex1",    label: "Ex 1",     word1: "horse",     word2: "ros",       expected: 3, description: "horse → ros in 3 ops (replace, delete, delete)" },
  { id: "ex2",    label: "Ex 2",     word1: "intention", word2: "execution", expected: 5, description: "intention → execution in 5 ops" },
  { id: "same",   label: "Same",     word1: "abc",       word2: "abc",       expected: 0, description: "Identical strings — 0 ops" },
  { id: "empty1", label: "→ word2",  word1: "",          word2: "cat",       expected: 3, description: "Empty word1 — just insert everything" },
  { id: "empty2", label: "word1 →",  word1: "cat",       word2: "",          expected: 3, description: "Empty word2 — just delete everything" },
  { id: "one",    label: "1 char",   word1: "a",         word2: "b",         expected: 1, description: "Single replace" },
  { id: "custom", label: "Custom",   word1: "horse",     word2: "ros",       expected: -1, description: "Enter your own" },
] as const;

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 4 — CODE SNIPPETS
// ════════════════════════════════════════════════════════════════════════════

const DP_CODE: string[] = [
  "int minDistance(string w1, string w2) {",
  "  int m = w1.size(), n = w2.size();",
  "  // dp[i][j] = min ops: w1[0..i-1] → w2[0..j-1]",
  "  vector<vector<int>> dp(m+1, vector<int>(n+1));",
  "",
  "  // base cases: convert to/from empty string",
  "  for (int i = 0; i <= m; i++) dp[i][0] = i;  // delete all",
  "  for (int j = 0; j <= n; j++) dp[0][j] = j;  // insert all",
  "",
  "  for (int i = 1; i <= m; i++) {",
  "    for (int j = 1; j <= n; j++) {",
  "      if (w1[i-1] == w2[j-1]) {",
  "        dp[i][j] = dp[i-1][j-1];        // match — free",
  "      } else {",
  "        dp[i][j] = 1 + min({",
  "          dp[i-1][j-1],  // replace",
  "          dp[i-1][j],    // delete",
  "          dp[i][j-1]     // insert",
  "        });",
  "      }",
  "    }",
  "  }",
  "  return dp[m][n];",
  "}",
];

const SPACE_CODE: string[] = [
  "int minDistance(string w1, string w2) {",
  "  int m = w1.size(), n = w2.size();",
  "  vector<int> prev(n+1), curr(n+1);",
  "",
  "  for (int j = 0; j <= n; j++) prev[j] = j;",
  "",
  "  for (int i = 1; i <= m; i++) {",
  "    curr[0] = i;",
  "    for (int j = 1; j <= n; j++) {",
  "      if (w1[i-1] == w2[j-1]) {",
  "        curr[j] = prev[j-1];            // match",
  "      } else {",
  "        curr[j] = 1 + min({",
  "          prev[j-1],  // replace",
  "          prev[j],    // delete",
  "          curr[j-1]   // insert",
  "        });",
  "      }",
  "    }",
  "    swap(prev, curr);",
  "  }",
  "  return prev[n];",
  "}",
];

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 5 — STEP TYPE
// ════════════════════════════════════════════════════════════════════════════

type Operation = "match" | "replace" | "delete" | "insert" | "base";
type Phase     = "init" | "base_row" | "base_col" | "fill_match" | "fill_op" | "done";

interface Step {
  phase:   Phase;
  message: string;

  // template compat
  l: number | null;
  r: number | null;
  picks: { l: number; r: number; value: number }[];
  total: number;

  // current cell being computed
  activeI: number;  // row index in dp
  activeJ: number;  // col index in dp

  // which cells fed into the current cell
  fromI: number;    // row of source cell
  fromJ: number;    // col of source cell

  // full dp table snapshot (only filled cells)
  dpTable: (number | null)[][];

  // what operation was chosen for this cell
  operation: Operation | null;

  // traceback path (once done)
  tracebackPath: { i: number; j: number }[];

  // the three candidate values shown during fill
  candidates: { replace: number; del: number; ins: number } | null;

  // Space-optimized specific
  prevRow?: number[];
  currRow?: number[];
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 6 — SIMULATION FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

function makeStep(partial: Partial<Step> & Pick<Step, "phase" | "message">): Step {
  return {
    l: null, r: null, picks: [], total: 0,
    activeI: -1, activeJ: -1, fromI: -1, fromJ: -1,
    dpTable: [], operation: null,
    tracebackPath: [], candidates: null,
    prevRow: [], currRow: [],
    ...partial,
  };
}

function buildDPTable(w1: string, w2: string): number[][] {
  const m = w1.length, n = w2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = w1[i-1] === w2[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]);
  return dp;
}

function buildTraceback(dp: number[][], w1: string, w2: string): { i: number; j: number; op: Operation }[] {
  const path: { i: number; j: number; op: Operation }[] = [];
  let i = w1.length, j = w2.length;
  while (i > 0 || j > 0) {
    path.push({ i, j, op: "match" }); // placeholder
    if (i === 0)      { j--; path[path.length-1].op = "insert"; }
    else if (j === 0) { i--; path[path.length-1].op = "delete"; }
    else if (w1[i-1] === w2[j-1]) { i--; j--; path[path.length-1].op = "match"; }
    else {
      const r = dp[i-1][j-1], d = dp[i-1][j], ins = dp[i][j-1];
      const best = Math.min(r, d, ins);
      if (best === r)   { i--; j--; path[path.length-1].op = "replace"; }
      else if (best === d) { i--;       path[path.length-1].op = "delete";  }
      else              {       j--; path[path.length-1].op = "insert";  }
    }
  }
  path.push({ i: 0, j: 0, op: "match" });
  return path;
}

function buildDPSteps(w1: string, w2: string): Step[] {
  const steps: Step[] = [];
  const m = w1.length, n = w2.length;

  // Allocate table with nulls
  const table: (number | null)[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(null));

  const snap = (): (number | null)[][] => table.map(row => [...row]);

  steps.push(makeStep({
    phase: "init", dpTable: snap(), activeI: -1, activeJ: -1,
    message: `Build a (${m+1}) × (${n+1}) DP table. dp[i][j] = min ops to convert "${w1.slice(0,4)}${w1.length>4?"…":""}"[0..i-1] → "${w2.slice(0,4)}${w2.length>4?"…":""}"[0..j-1].`,
  }));

  // Base cases — column 0
  for (let i = 0; i <= m; i++) {
    table[i][0] = i;
    steps.push(makeStep({
      phase: "base_col", dpTable: snap(), activeI: i, activeJ: 0, operation: "base",
      message: i === 0
        ? `dp[0][0] = 0: empty → empty needs 0 ops.`
        : `dp[${i}][0] = ${i}: delete all ${i} char${i>1?"s":""} of "${w1.slice(0,i)}" to reach empty.`,
    }));
  }

  // Base cases — row 0
  for (let j = 1; j <= n; j++) {
    table[0][j] = j;
    steps.push(makeStep({
      phase: "base_row", dpTable: snap(), activeI: 0, activeJ: j, operation: "base",
      message: `dp[0][${j}] = ${j}: insert ${j} char${j>1?"s":""} to build "${w2.slice(0,j)}" from empty.`,
    }));
  }

  // Fill cells
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const c1 = w1[i - 1], c2 = w2[j - 1];
      const match = c1 === c2;

      if (match) {
        table[i][j] = table[i-1][j-1]!;
        steps.push(makeStep({
          phase: "fill_match", dpTable: snap(),
          activeI: i, activeJ: j, fromI: i-1, fromJ: j-1,
          operation: "match",
          message: `dp[${i}][${j}]: '${c1}'=='${c2}' ✓ match → inherit dp[${i-1}][${j-1}] = ${table[i][j]} (no cost).`,
        }));
      } else {
        const rep = table[i-1][j-1]!;
        const del = table[i-1][j]!;
        const ins = table[i][j-1]!;
        const best = 1 + Math.min(rep, del, ins);
        table[i][j] = best;

        let op: Operation = "replace";
        let fromI = i-1, fromJ = j-1;
        if (del < rep && del <= ins)  { op = "delete";  fromI = i-1; fromJ = j; }
        else if (ins < rep && ins < del) { op = "insert"; fromI = i;   fromJ = j-1; }

        steps.push(makeStep({
          phase: "fill_op", dpTable: snap(),
          activeI: i, activeJ: j, fromI, fromJ,
          operation: op,
          candidates: { replace: rep, del, ins },
          message: `dp[${i}][${j}]: '${c1}'≠'${c2}'. replace=${rep}+1, delete=${del}+1, insert=${ins}+1 → best=${best} (${op}).`,
        }));
      }
    }
  }

  // Traceback
  const fullDp = buildDPTable(w1, w2);
  const tbRaw  = buildTraceback(fullDp, w1, w2);
  const tbPath = tbRaw.map(p => ({ i: p.i, j: p.j }));

  steps.push(makeStep({
    phase: "done", dpTable: snap(),
    activeI: m, activeJ: n,
    tracebackPath: tbPath, total: fullDp[m][n],
    message: `Done! dp[${m}][${n}] = ${fullDp[m][n]}. Traceback shown in gold — the actual sequence of operations.`,
  }));

  return steps;
}

// Space-optimised: specifically track prev and curr rows
function buildSpaceSteps(w1: string, w2: string): Step[] {
  const steps: Step[] = [];
  const m = w1.length, n = w2.length;

  const fullDp = buildDPTable(w1, w2);
  const tbRaw  = buildTraceback(fullDp, w1, w2);
  const tbPath = tbRaw.map(p => ({ i: p.i, j: p.j }));

  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  let curr = new Array(n + 1).fill(0);

  steps.push(makeStep({
    phase: "init", dpTable: [], activeI: -1, activeJ: -1,
    prevRow: [...prev], currRow: [...curr],
    message: `Initialize 'prev' array with base cases (inserting into empty string). 'curr' will be built row by row.`,
  }));

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    steps.push(makeStep({
      phase: "base_col", dpTable: [], activeI: i, activeJ: 0,
      prevRow: [...prev], currRow: [...curr], operation: "base",
      message: `Start row ${i}. curr[0] = ${i} (deleting ${i} chars from word1).`,
    }));

    for (let j = 1; j <= n; j++) {
      const c1 = w1[i - 1], c2 = w2[j - 1];
      const match = c1 === c2;

      if (match) {
        curr[j] = prev[j - 1];
        steps.push(makeStep({
          phase: "fill_match", dpTable: [],
          activeI: i, activeJ: j, fromI: i - 1, fromJ: j - 1,
          prevRow: [...prev], currRow: [...curr],
          operation: "match",
          message: `dp[${i}][${j}]: '${c1}'=='${c2}' ✓ → curr[${j}] = prev[${j-1}] = ${curr[j]}.`,
        }));
      } else {
        const rep = prev[j - 1];
        const del = prev[j];
        const ins = curr[j - 1];
        const best = 1 + Math.min(rep, del, ins);
        curr[j] = best;

        let op: Operation = "replace";
        let fromI = i - 1, fromJ = j - 1;
        if (del < rep && del <= ins)  { op = "delete";  fromI = i - 1; fromJ = j; }
        else if (ins < rep && ins < del) { op = "insert"; fromI = i;     fromJ = j - 1; }

        steps.push(makeStep({
          phase: "fill_op", dpTable: [],
          activeI: i, activeJ: j, fromI, fromJ,
          prevRow: [...prev], currRow: [...curr],
          operation: op,
          candidates: { replace: rep, del, ins },
          message: `dp[${i}][${j}]: '${c1}'≠'${c2}'. min(prev[${j-1}], prev[${j}], curr[${j-1}]) + 1 → ${best} (${op}).`,
        }));
      }
    }
    
    // Swap arrays for next iteration
    const temp = prev;
    prev = curr;
    curr = temp;
    
    steps.push(makeStep({
      phase: "fill_match", 
      dpTable: [], activeI: i, activeJ: n,
      prevRow: [...prev], currRow: [...curr],
      operation: "base",
      message: `Row ${i} complete. Swap 'prev' and 'curr' to prepare for row ${i + 1}.`,
    }));
  }

  steps.push(makeStep({
    phase: "done", dpTable: [],
    activeI: m, activeJ: n,
    prevRow: [...prev], currRow: [...curr],
    tracebackPath: tbPath, total: fullDp[m][n],
    message: `Done! The answer is prev[${n}] = ${fullDp[m][n]}. Traceback shown in gold.`,
  }));

  return steps;
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 7 — COMPLEXITY INFO
// ════════════════════════════════════════════════════════════════════════════

const COMPLEXITY: Record<SolutionId, { time: string; space: string; note: string }> = {
  dp: {
    time:  "O(m · n)",
    space: "O(m · n)",
    note:  "Fill every cell of the (m+1)×(n+1) table exactly once. Space stores the whole grid.",
  },
  space: {
    time:  "O(m · n)",
    space: "O(n)",
    note:  "Same time, but only two rows kept at a time (prev + curr). Space reduced from O(m·n) to O(n).",
  },
};

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 8 — PHASE DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

const PHASE_META: Record<Phase, { color: string; borderColor: string; bgColor: string; icon: string }> = {
  init:       { color: "text-slate-500",   borderColor: "border-l-slate-400",   bgColor: "bg-slate-100",   icon: "→" },
  base_col:   { color: "text-rose-700",    borderColor: "border-l-rose-400",    bgColor: "bg-rose-50",     icon: "D" },
  base_row:   { color: "text-sky-700",     borderColor: "border-l-sky-400",     bgColor: "bg-sky-50",      icon: "I" },
  fill_match: { color: "text-emerald-700", borderColor: "border-l-emerald-500", bgColor: "bg-emerald-50",  icon: "=" },
  fill_op:    { color: "text-violet-700",  borderColor: "border-l-violet-500",  bgColor: "bg-violet-50",   icon: "✎" },
  done:       { color: "text-amber-700",   borderColor: "border-l-amber-500",   bgColor: "bg-amber-50",    icon: "★" },
};

const PHASES_BY_SOLUTION: Record<SolutionId, Phase[]> = {
  dp:    ["init", "base_col", "base_row", "fill_match", "fill_op", "done"],
  space: ["init", "base_col", "base_row", "fill_match", "fill_op", "done"],
};

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 9 — REUSABLE UI COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

function CodePanel({ solution, step }: { solution: SolutionId; step: Step }) {
  const lines    = solution === "dp" ? DP_CODE : SPACE_CODE;
  const filename = solution === "dp" ? "dp_table.cpp" : "space_opt.cpp";

  const highlightDP: Partial<Record<Phase, number[]>> = {
    base_col:   [6],
    base_row:   [7],
    fill_match: [11, 12],
    fill_op:    [14, 15, 16, 17, 18],
    done:       [22],
  };

  const highlightSpace: Partial<Record<Phase, number[]>> = {
    init:       [4],
    base_col:   [7],
    fill_match: [9, 10],
    fill_op:    [12, 13, 14, 15, 16],
    done:       [21],
  };

  const highlight = solution === "dp" ? highlightDP : highlightSpace;
  const hLines = new Set(highlight[step.phase] ?? []);

  // Special highlight for the swap step in space-optimized
  if (solution === "space" && step.phase === "fill_match" && step.operation === "base" && step.activeI > 0) {
    hLines.clear();
    hLines.add(19); // swap(prev, curr);
  }

  return (
    <div className="rounded-lg border border-slate-200  bg-white mt-4">
      <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        <span className="ml-2 text-xs text-slate-500 font-mono">{filename}</span>
      </div>
      <div className="overflow-auto max-h-72 bg-slate-950/95">
        <table className="w-full text-xs font-mono">
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} style={{ background: hLines.has(i) ? "rgba(139,92,246,0.18)" : "transparent" }}
                className="text-slate-100">
                <td className="select-none w-8 text-right pr-3 pl-2 py-0.5 border-r border-slate-800"
                  style={{ color: hLines.has(i) ? "#c4b5fd" : "#64748b" }}>{i + 1}</td>
                <td className="pl-3 py-0.5 whitespace-pre"
                  style={{ color: hLines.has(i) ? "#e9d5ff" : undefined }}>{line || " "}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StepLog({ steps, currentIndex }: { steps: Step[]; currentIndex: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [currentIndex]);
  return (
    <div ref={ref} className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
      {steps.slice(0, currentIndex + 1).map((s, i) => {
        const meta = PHASE_META[s.phase];
        return (
          <div key={i} className={`flex items-start gap-2 px-2 py-1.5 rounded-r border-l-2 text-xs
            ${meta.borderColor} ${meta.bgColor} ${i === currentIndex ? "opacity-100" : "opacity-55"}`}>
            <span className="font-mono font-bold text-slate-500 shrink-0 w-4">{meta.icon}</span>
            <span className="text-slate-700 leading-snug">{s.message}</span>
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 10 — CUSTOM VISUAL PANELS
// ════════════════════════════════════════════════════════════════════════════

// ── DP Table ─────────────────────────────────────────────────────────────

const OP_COLORS: Record<Operation, { bg: string; border: string; text: string; label: string }> = {
  match:   { bg: "bg-emerald-100", border: "border-emerald-400", text: "text-emerald-800", label: "=" },
  replace: { bg: "bg-violet-100",  border: "border-violet-400",  text: "text-violet-800",  label: "R" },
  delete:  { bg: "bg-rose-100",    border: "border-rose-400",    text: "text-rose-800",    label: "D" },
  insert:  { bg: "bg-sky-100",     border: "border-sky-400",     text: "text-sky-800",     label: "I" },
  base:    { bg: "bg-slate-100",   border: "border-slate-300",   text: "text-slate-600",   label: "—" },
};

function SpaceOptPanel({ step, word1, word2 }: { step: Step; word1: string; word2: string }) {
  const n = word2.length;
  const prev = step.prevRow || [];
  const curr = step.currRow || [];
  
  const tbSet = new Set(step.tracebackPath.map(p => `${p.i},${p.j}`));

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="text-xs text-slate-500 font-medium">Space-Optimized View — O(n) Space</p>
        <div className="flex gap-2 flex-wrap text-[10px]">
          {(["match","replace","delete","insert"] as Operation[]).map(op => (
            <span key={op} className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${OP_COLORS[op].bg} ${OP_COLORS[op].border} ${OP_COLORS[op].text}`}>
              <span className="font-bold">{OP_COLORS[op].label}</span> {op}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse text-center font-mono text-xs select-none">
          <thead>
            <tr>
              <td className="w-16 h-8" />
              <td className="w-8 h-8 text-slate-400 font-bold text-[10px]">ε</td>
              {Array.from({ length: n }, (_, j) => (
                <td key={j} className="w-8 h-8">
                  <div className={`w-7 h-7 mx-auto flex items-center justify-center rounded font-bold text-xs
                    ${step.activeJ === j + 1 ? "bg-sky-100 text-sky-700 ring-2 ring-sky-400" : "text-slate-500"}`}>
                    {word2[j]}
                  </div>
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Prev Row */}
            <tr>
              <td className="w-16 h-8 text-right pr-2 text-[10px] font-bold text-slate-500">
                prev <br/> <span className="text-slate-400 font-normal">(row {step.phase === "done" ? step.activeI : step.activeI - 1})</span>
              </td>
              {Array.from({ length: n + 1 }, (_, j) => {
                const val = prev[j];
                const isFrom = step.fromI === step.activeI - 1 && step.fromJ === j;
                const isTraceback = tbSet.has(`${step.activeI - 1},${j}`);
                
                let innerClass = "w-7 h-7 mx-auto flex items-center justify-center rounded text-xs font-bold transition-all duration-200 ";
                if (isTraceback) innerClass += "bg-amber-100 border-2 border-amber-400 text-amber-800 font-black";
                else if (isFrom) innerClass += "ring-2 ring-blue-400 bg-blue-50 text-blue-800";
                else innerClass += "bg-slate-100 text-slate-600";

                return (
                  <td key={j} className="w-8 h-8 border border-slate-100">
                    <div className={innerClass}>{val !== undefined ? val : "·"}</div>
                  </td>
                );
              })}
            </tr>
            {/* Curr Row */}
            <tr>
              <td className="w-16 h-8 text-right pr-2 text-[10px] font-bold text-violet-600">
                curr <br/> <span className="text-violet-400 font-normal">(row {step.activeI})</span>
              </td>
              {Array.from({ length: n + 1 }, (_, j) => {
                const val = curr[j];
                const isActive = step.activeJ === j;
                const isFrom = step.fromI === step.activeI && step.fromJ === j;
                const isTraceback = tbSet.has(`${step.activeI},${j}`);
                
                let innerClass = "w-7 h-7 mx-auto flex items-center justify-center rounded text-xs font-bold transition-all duration-200 ";
                if (isActive && step.phase !== "done") innerClass += "ring-2 ring-offset-1 ring-violet-500 bg-violet-200 text-violet-900 scale-110 shadow-md";
                else if (isTraceback) innerClass += "bg-amber-100 border-2 border-amber-400 text-amber-800 font-black";
                else if (isFrom) innerClass += "ring-2 ring-blue-400 bg-blue-50 text-blue-800";
                else innerClass += "bg-white border border-slate-200 text-slate-700";

                return (
                  <td key={j} className="w-8 h-8 border border-slate-100">
                    <div className={innerClass}>{val !== undefined ? val : "·"}</div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-slate-500 mt-3 italic">
        Notice how we only keep two rows in memory. After finishing a row, we swap <code className="bg-slate-100 px-1 rounded">prev</code> and <code className="bg-slate-100 px-1 rounded">curr</code>.
      </p>
    </div>
  );
}

function DPTablePanel({ step, word1, word2, solution }: { step: Step; word1: string; word2: string; solution: SolutionId }) {
  if (solution === "space") {
    return <SpaceOptPanel step={step} word1={word1} word2={word2} />;
  }

  const m = word1.length, n = word2.length;
  // Clamp display for large strings
  const MAX_DISPLAY = 10;
  const displayM = Math.min(m, MAX_DISPLAY);
  const displayN = Math.min(n, MAX_DISPLAY);
  const truncated = m > MAX_DISPLAY || n > MAX_DISPLAY;

  // Build an operation map from traceback
  const tbSet = new Set(step.tracebackPath.map(p => `${p.i},${p.j}`));

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="text-xs text-slate-500 font-medium">DP Table — dp[i][j]</p>
        {/* Legend */}
        <div className="flex gap-2 flex-wrap text-[10px]">
          {(["match","replace","delete","insert"] as Operation[]).map(op => (
            <span key={op} className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${OP_COLORS[op].bg} ${OP_COLORS[op].border} ${OP_COLORS[op].text}`}>
              <span className="font-bold">{OP_COLORS[op].label}</span> {op}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse text-center font-mono text-xs select-none">
          <thead>
            <tr>
              {/* top-left corner */}
              <td className="w-8 h-8" />
              {/* empty string column header */}
              <td className="w-8 h-8 text-slate-400 font-bold text-[10px]">ε</td>
              {/* word2 chars */}
              {Array.from({ length: displayN }, (_, j) => (
                <td key={j} className="w-8 h-8">
                  <div className={`w-7 h-7 mx-auto flex items-center justify-center rounded font-bold text-xs
                    ${step.activeJ === j + 1 ? "bg-sky-100 text-sky-700 ring-2 ring-sky-400" : "text-slate-500"}`}>
                    {word2[j]}
                  </div>
                </td>
              ))}
              {truncated && <td className="w-6 text-slate-300 text-xs">…</td>}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: displayM + 1 }, (_, i) => (
              <tr key={i}>
                {/* row header: word1 char or ε */}
                <td className="w-8 h-8">
                  <div className={`w-7 h-7 mx-auto flex items-center justify-center rounded font-bold text-xs
                    ${step.activeI === i ? "bg-rose-100 text-rose-700 ring-2 ring-rose-400" : "text-slate-500"}`}>
                    {i === 0 ? "ε" : word1[i - 1]}
                  </div>
                </td>
                {Array.from({ length: displayN + 1 }, (_, j) => {
                  const val = step.dpTable[i]?.[j];
                  const isActive   = step.activeI === i && step.activeJ === j;
                  const isFrom     = step.fromI === i && step.fromJ === j;
                  const isTraceback = tbSet.has(`${i},${j}`);
                  const isEmpty    = val === null || val === undefined;

                  // Determine cell coloring
                  let cellClass = "w-8 h-8 border border-slate-100 transition-all duration-200";
                  let innerClass = "w-7 h-7 mx-auto flex items-center justify-center rounded text-xs font-bold transition-all duration-200 ";

                  if (isActive) {
                    innerClass += "ring-2 ring-offset-1 ring-violet-500 bg-violet-200 text-violet-900 scale-110 shadow-md";
                  } else if (isTraceback && !isEmpty) {
                    innerClass += "bg-amber-100 border-2 border-amber-400 text-amber-800 font-black";
                  } else if (isFrom) {
                    innerClass += "ring-2 ring-blue-400 bg-blue-50 text-blue-800";
                  } else if (i === 0 || j === 0) {
                    innerClass += "bg-slate-100 text-slate-500";
                  } else if (isEmpty) {
                    innerClass += "bg-slate-50 text-slate-200";
                  } else {
                    innerClass += "bg-white text-slate-700";
                  }

                  return (
                    <td key={j} className={cellClass}>
                      <div className={innerClass}>
                        {isEmpty ? "·" : val}
                      </div>
                    </td>
                  );
                })}
                {truncated && <td className="text-slate-300 text-xs">…</td>}
              </tr>
            ))}
            {truncated && (
              <tr>
                <td className="text-slate-300 text-xs text-center" colSpan={displayN + 3}>⋮</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {truncated && (
        <p className="text-[10px] text-amber-600 mt-2">
          ⚠ Table truncated to {MAX_DISPLAY}×{MAX_DISPLAY} for display. Full computation runs on complete strings.
        </p>
      )}
    </div>
  );
}

// ── Current cell breakdown ────────────────────────────────────────────────
function CellBreakdownPanel({
  step, word1, word2, solution
}: { step: Step; word1: string; word2: string; solution: SolutionId }) {
  if (step.phase === "init" || step.phase === "done") return null;
  const { activeI: i, activeJ: j, operation, candidates } = step;
  const c1 = i > 0 ? word1[i - 1] : "ε";
  const c2 = j > 0 ? word2[j - 1] : "ε";
  
  let val: number | null | undefined = null;
  if (solution === "space") {
    val = step.currRow?.[j];
  } else {
    val = step.dpTable[i]?.[j];
  }

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
      <p className="text-xs text-slate-500 font-medium mb-3">
        Current cell — dp[{i}][{j}]
        <span className="ml-2 font-mono text-slate-400">
          ("{c1}" vs "{c2}")
        </span>
      </p>

      {operation === "base" && j === word2.length && i > 0 ? (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 border border-slate-300 text-lg font-bold font-mono text-slate-700">
            ↻
          </div>
          <span className="text-xs text-slate-500">
            Row {i} complete. Swapping <code className="bg-slate-100 px-1 rounded">prev</code> and <code className="bg-slate-100 px-1 rounded">curr</code> arrays.
          </span>
        </div>
      ) : operation === "base" ? (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 border border-slate-300 text-lg font-bold font-mono text-slate-700">
            {val}
          </div>
          <span className="text-xs text-slate-500">
            {i === 0 ? `Insert ${j} chars to build "${word2.slice(0, j)}"` : `Delete ${i} chars from "${word1.slice(0, i)}"`}
          </span>
        </div>
      ) : operation === "match" ? (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-emerald-100 border-2 border-emerald-400 text-lg font-bold font-mono text-emerald-800">
            {val}
          </div>
          <div className="text-xs text-emerald-700">
            <span className="font-bold">Match!</span> '{c1}' == '{c2}' → inherit dp[{i-1}][{j-1}] = {val} for free.
          </div>
        </div>
      ) : candidates ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span className="font-bold text-slate-700">'{c1}' ≠ '{c2}'</span> — pick best of 3 operations:
          </div>
          {([
            { label: "Replace", op: "replace" as Operation, val: candidates.replace, desc: `swap '${c1}' → '${c2}'`, from: `dp[${i-1}][${j-1}]` },
            { label: "Delete",  op: "delete"  as Operation, val: candidates.del,     desc: `remove '${c1}'`,         from: `dp[${i-1}][${j}]` },
            { label: "Insert",  op: "insert"  as Operation, val: candidates.ins,     desc: `insert '${c2}'`,         from: `dp[${i}][${j-1}]` },
          ]).map(row => {
            const chosen = row.op === operation;
            const col = OP_COLORS[row.op];
            return (
              <div key={row.op}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all
                  ${chosen ? `${col.bg} ${col.border} ring-1 ring-offset-1 ${col.border.replace("border-","ring-")}` : "border-slate-100 bg-slate-50"}`}>
                <div className={`w-8 h-8 flex items-center justify-center rounded font-bold text-sm font-mono
                  ${chosen ? `${col.bg} ${col.text}` : "bg-white text-slate-500"}`}>
                  {row.val + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold ${chosen ? col.text : "text-slate-400"}`}>
                    {row.label} ({row.desc})
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">{row.from} + 1 = {row.val + 1}</p>
                </div>
                {chosen && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${col.bg} ${col.text}`}>chosen</span>}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

// ── String alignment display ──────────────────────────────────────────────
function StringsPanel({ word1, word2, step }: { word1: string; word2: string; step: Step }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
      <p className="text-xs text-slate-500 font-medium mb-3">Strings</p>
      <div className="flex flex-col gap-3">
        {[{ label: "word1 (rows)", word: word1, activeIdx: step.activeI - 1, color: "rose" },
          { label: "word2 (cols)", word: word2, activeIdx: step.activeJ - 1, color: "sky" }].map(({ label, word, activeIdx, color }) => (
          <div key={label}>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">{label}</p>
            <div className="flex gap-1 flex-wrap items-center">
              {/* ε cell */}
              <div className="w-7 h-7 flex items-center justify-center text-xs font-bold text-slate-300 border border-slate-100 rounded bg-slate-50">ε</div>
              {word.split("").map((c, i) => (
                <div key={i}
                  className={`w-7 h-7 flex items-center justify-center text-xs font-bold rounded border transition-all
                    ${activeIdx === i
                      ? color === "rose"
                        ? "bg-rose-200 border-rose-400 text-rose-800 scale-110 shadow"
                        : "bg-sky-200 border-sky-400 text-sky-800 scale-110 shadow"
                      : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                  {c}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Traceback operations list ────────────────────────────────────────────
function TracebackPanel({ step, word1, word2 }: { step: Step; word1: string; word2: string }) {
  if (step.phase !== "done" || !step.tracebackPath.length) return null;

  // Re-derive operations from traceback path
  const dp = buildDPTable(word1, word2);
  const ops = buildTraceback(dp, word1, word2).reverse();

  return (
    <div className="bg-amber-50 p-5 rounded-xl border border-amber-100">
      <p className="text-xs font-bold text-amber-700 mb-3 uppercase tracking-wide">Traceback — actual operations</p>
      <div className="flex flex-col gap-1.5">
        {ops.filter(o => o.op !== "match" || (word1[o.i-1] !== word2[o.j-1])).slice(0, 12).map((o, idx) => {
          const col = OP_COLORS[o.op];
          const desc = o.op === "match"
            ? `Keep '${word1[o.i-1]}' (match)`
            : o.op === "replace"
            ? `Replace '${word1[o.i-1]}' → '${word2[o.j-1]}'`
            : o.op === "delete"
            ? `Delete '${word1[o.i-1]}'`
            : `Insert '${word2[o.j-1]}'`;
          return (
            <div key={idx} className={`flex items-center gap-2 px-2 py-1.5 rounded border text-xs ${col.bg} ${col.border}`}>
              <span className={`font-bold w-4 text-center ${col.text}`}>{col.label}</span>
              <span className={col.text}>{desc}</span>
              <span className="ml-auto font-mono text-[10px] text-slate-400">dp[{o.i}][{o.j}]</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-amber-700">Total operations</span>
        <span className="text-xl font-bold font-mono text-amber-700">{step.total}</span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 11 — MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function AlgoVizTemplate() {
  const [activeSolution, setActiveSolution] = useState<SolutionId>("dp");
  const [activeTestCase, setActiveTestCase]  = useState<string>("ex1");

  const [word1Input, setWord1Input] = useState("horse");
  const [word2Input, setWord2Input] = useState("ros");

  const [steps, setSteps]                       = useState<Step[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [playing, setPlaying]                   = useState(false);
  const [speed, setSpeed]                       = useState(400);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentStep = steps[currentStepIndex] ?? steps[0];

  const rebuild = useCallback(() => {
    if (word1Input.length > 14 || word2Input.length > 14) return;
    const s = activeSolution === "dp"
      ? buildDPSteps(word1Input, word2Input)
      : buildSpaceSteps(word1Input, word2Input);
    setSteps(s);
    setCurrentStepIndex(0);
    setPlaying(false);
  }, [word1Input, word2Input, activeSolution]);

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

  const complexity = COMPLEXITY[activeSolution];
  const phases     = PHASES_BY_SOLUTION[activeSolution];
  if (!currentStep) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-6 overflow-hidden">

      {/* Header */}
      <header className="flex justify-between items-center mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-600 rounded-lg text-white shadow-lg">
            <Table2 size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-none">{PROBLEM_TITLE}</h1>
            <p className="text-slate-500 text-xs mt-1 italic">{PROBLEM_SUBTITLE}</p>
          </div>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded border border-violet-300 text-violet-700 bg-violet-50">
          {PROBLEM_BADGE}
        </span>
      </header>

      {/* Solution tabs */}
      <div className="flex gap-2 mb-4 shrink-0 bg-slate-200/50 p-1 rounded-xl w-fit">
        {SOLUTIONS.map(sol => (
          <button key={sol.id} onClick={() => setActiveSolution(sol.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2
              ${activeSolution === sol.id ? "bg-white text-violet-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
            {sol.label}
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-mono">{sol.complexity}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 overflow-hidden">

        {/* ── LEFT COLUMN ───────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">

          {/* Problem statement */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{PROBLEM_STATEMENT}</p>
          </div>

          {/* Phase chips */}
          <div className="flex gap-1.5 flex-wrap">
            {phases.map(p => (
              <div key={p}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all
                  ${currentStep.phase === p
                    ? "bg-violet-600 border-violet-600 text-white shadow-md"
                    : "bg-white border-slate-200 text-slate-400"}`}>
                {PHASE_META[p].icon} {p.replace(/_/g, " ")}
              </div>
            ))}
          </div>

          {/* Strings display */}
          <StringsPanel word1={word1Input} word2={word2Input} step={currentStep} />

          {/* THE DP TABLE — core visualization */}
          <DPTablePanel step={currentStep} word1={word1Input} word2={word2Input} solution={activeSolution} />

          {/* Current cell breakdown */}
          <CellBreakdownPanel step={currentStep} word1={word1Input} word2={word2Input} solution={activeSolution} />

          {/* Traceback (shown when done) */}
          <TracebackPanel step={currentStep} word1={word1Input} word2={word2Input} />

          {/* Step log */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-2">Step log</p>
            <StepLog steps={steps} currentIndex={currentStepIndex} />
          </div>

          {/* Code panel */}
          <CodePanel solution={activeSolution} step={currentStep} />
        </div>

        {/* ── RIGHT COLUMN ──────────────────────────────────────────── */}
        <div className="w-full lg:w-80 flex flex-col gap-4 overflow-y-auto">

          {/* Test cases */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-3">
            <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-medium">Test Cases</p>
            <div className="flex flex-wrap gap-2">
              {TEST_CASES.map(tc => (
                <button key={tc.id}
                  onClick={() => {
                    setActiveTestCase(tc.id);
                    if (tc.id !== "custom") { setWord1Input(tc.word1); setWord2Input(tc.word2); }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                    ${activeTestCase === tc.id ? "bg-violet-600 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                  {tc.label}
                </button>
              ))}
            </div>
            {activeTestCase !== "custom" && (() => {
              const tc = TEST_CASES.find(t => t.id === activeTestCase);
              return tc ? (
                <>
                  <p className="text-[10px] text-slate-500 italic">{tc.description}</p>
                  {tc.expected >= 0 && (
                    <p className="text-[10px] font-mono text-emerald-700">Expected: {tc.expected} operations</p>
                  )}
                </>
              ) : null;
            })()}
          </div>

          {/* Input configuration */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-2">
            <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-medium">Input Configuration</p>
            {[
              { label: "word1", val: word1Input, set: setWord1Input },
              { label: "word2", val: word2Input, set: setWord2Input },
            ].map(({ label, val, set }) => (
              <div key={label} className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</label>
                <input type="text" value={val}
                  onChange={e => { set(e.target.value.toLowerCase().replace(/[^a-z]/g,"")); setActiveTestCase("custom"); }}
                  className="font-mono text-xs px-2 py-1.5 rounded border border-slate-200 bg-slate-50 text-slate-900"
                  maxLength={14} />
              </div>
            ))}
            <button onClick={rebuild}
              className="mt-1 w-full px-3 py-1.5 rounded border border-slate-300 text-xs text-slate-800 hover:bg-slate-100 transition-colors">
              Rebuild steps
            </button>
            <p className="text-[10px] text-slate-400">Max 14 chars each for readable table.</p>
          </div>

          {/* Animation controls */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-2">Animation Controls</p>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <button onClick={() => setCurrentStepIndex(0)} disabled={currentStepIndex === 0}
                className="p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30">
                <RotateCcw size={16} />
              </button>
              <button onClick={() => setCurrentStepIndex(p => Math.max(0, p - 1))} disabled={currentStepIndex === 0}
                className="p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30">
                ←
              </button>
              <button onClick={() => setPlaying(p => !p)} disabled={currentStepIndex >= steps.length - 1}
                className={`px-4 py-1.5 text-xs rounded-full border font-medium flex items-center gap-1
                  ${playing ? "bg-amber-50 text-amber-800 border-amber-300" : "bg-violet-600 text-white border-violet-600 shadow-md"}`}>
                {playing ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Play</>}
              </button>
              <button onClick={() => setCurrentStepIndex(p => Math.min(steps.length - 1, p + 1))} disabled={currentStepIndex >= steps.length - 1}
                className="p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30">
                <StepForward size={16} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Speed</span>
              <input type="range" min={80} max={1200} step={80} value={1280 - speed}
                onChange={e => setSpeed(1280 - Number(e.target.value))}
                className="w-24 accent-violet-600" />
              <span className="text-xs font-mono text-slate-500">{speed}ms</span>
            </div>
            <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 transition-all duration-200"
                style={{ width: steps.length ? `${((currentStepIndex+1)/steps.length)*100}%` : "0%" }} />
            </div>
            <span className="mt-1 block text-right text-xs text-slate-500 font-mono">
              {steps.length ? `${currentStepIndex+1}/${steps.length}` : "0/0"}
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

          {/* Key insight */}
          <div className="bg-violet-50 p-5 rounded-xl border border-violet-100">
            <p className="text-xs font-bold text-violet-700 mb-2 uppercase tracking-wide">Key insight</p>
            <p className="text-xs text-violet-700 leading-relaxed">
              Each cell <code className="bg-violet-100 px-1 rounded">dp[i][j]</code> only needs
              its <strong>top-left</strong> (replace), <strong>top</strong> (delete), and <strong>left</strong> (insert)
              neighbours. You can solve a huge problem by trusting that every smaller subproblem is already solved.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}