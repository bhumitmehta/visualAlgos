"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Braces, Play, Pause, RotateCcw, StepForward, Zap, TrendingUp } from "lucide-react";

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 1 — PROBLEM METADATA
// ════════════════════════════════════════════════════════════════════════════

const PROBLEM_TITLE    = "Number of ZigZag Arrays I";
const PROBLEM_SUBTITLE = "DP + Prefix/Suffix Sum Optimization";
const PROBLEM_BADGE    = "Hard • Dynamic Programming";

const PROBLEM_STATEMENT =
`Count arrays of length n with values in [l, r] where:
  • No two adjacent elements are equal
  • No three consecutive elements are all-increasing or all-decreasing

In other words: after every UP move the next must be DOWN, and vice versa.
The sequence must alternate direction at every step.`;

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 2 — SOLUTION DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

const SOLUTIONS = [
  { id: "naive",     label: "Naive",     complexity: "O(n·m²)" },
  { id: "optimized", label: "Optimized", complexity: "O(n·m)"  },
] as const;
type SolutionId = typeof SOLUTIONS[number]["id"];

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 3 — TEST CASES
// ════════════════════════════════════════════════════════════════════════════

const TEST_CASES = [
  { id: "ex1", label: "n=3 [4,5]", n: 3, l: 4, r: 5, expected: 2,  description: "m=2 values → 2 zigzag arrays: [4,5,4] and [5,4,5]" },
  { id: "ex2", label: "n=3 [1,3]", n: 3, l: 1, r: 3, expected: 10, description: "m=3 values → 10 zigzag arrays of length 3" },
  { id: "ex3", label: "n=4 [1,3]", n: 4, l: 1, r: 3, expected: 14, description: "m=3 values, length 4" },
  { id: "ex4", label: "n=5 [1,4]", n: 5, l: 1, r: 4, expected: 0,  description: "m=4 values, length 5" },
  { id: "custom", label: "Custom", n: 3, l: 1, r: 3, expected: -1, description: "Enter your own" },
] as const;

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 4 — CODE SNIPPETS
// ════════════════════════════════════════════════════════════════════════════

const NAIVE_CODE: string[] = [
  "int countZigZag(int n, int l, int r) {",
  "  int m = r - l + 1;",
  "  const int MOD = 1e9 + 7;",
  "  // dp_dn[v]: seqs ending at v, last move was ↑ (next MUST ↓)",
  "  // dp_up[v]: seqs ending at v, last move was ↓ (next MUST ↑)",
  "  vector<long long> dp_dn(m,0), dp_up(m,0);",
  "  for (int a=0;a<m;a++) for (int b=0;b<m;b++)",
  "    if (a!=b) (b>a ? dp_dn[b] : dp_up[b])++;",
  "  for (int len=3; len<=n; len++) {",
  "    vector<long long> nd(m,0), nu(m,0);",
  "    for (int y=0;y<m;y++)",
  "      for (int x=0;x<m;x++) {",
  "        if (x < y) nd[y]=(nd[y]+dp_up[x])%MOD;  // x→y is ↑, prev was ↓",
  "        if (x > y) nu[y]=(nu[y]+dp_dn[x])%MOD;  // x→y is ↓, prev was ↑",
  "      }",
  "    dp_dn=nd; dp_up=nu;",
  "  }",
  "  long long ans=0;",
  "  for (int v=0;v<m;v++) ans=(ans+dp_dn[v]+dp_up[v])%MOD;",
  "  return ans;",
  "}",
];

const OPTIMIZED_CODE: string[] = [
  "int countZigZag(int n, int l, int r) {",
  "  int m = r - l + 1;",
  "  const int MOD = 1e9 + 7;",
  "  vector<long long> dp_dn(m,0), dp_up(m,0);",
  "  for (int a=0;a<m;a++) for (int b=0;b<m;b++)",
  "    if (a!=b) (b>a ? dp_dn[b] : dp_up[b])++;",
  "  for (int len=3; len<=n; len++) {",
  "    vector<long long> nd(m,0), nu(m,0);",
  "    // nd[y] = Σ dp_up[x] for x < y  ← PREFIX SUM of dp_up",
  "    long long pref=0;",
  "    for (int y=0;y<m;y++) { nd[y]=pref; pref=(pref+dp_up[y])%MOD; }",
  "    // nu[y] = Σ dp_dn[x] for x > y  ← SUFFIX SUM of dp_dn",
  "    long long suff=0;",
  "    for (int y=m-1;y>=0;y--) { nu[y]=suff; suff=(suff+dp_dn[y])%MOD; }",
  "    dp_dn=nd; dp_up=nu;",
  "  }",
  "  long long ans=0;",
  "  for (int v=0;v<m;v++) ans=(ans+dp_dn[v]+dp_up[v])%MOD;",
  "  return ans;",
  "}",
];

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 5 — STEP TYPE
// ════════════════════════════════════════════════════════════════════════════

type Phase = "init" | "base" | "transition" | "prefix" | "suffix" | "update" | "done";

interface Step {
  phase:           Phase;
  message:         string;
  insight:         string;   
  current_length:  number;
  dp_dn:           number[];
  dp_up:           number[];
  new_dp_dn:       number[];
  new_dp_up:       number[];
  active_y:        number;   
  active_x:        number;   
  sweep_idx:       number;   
  sweep_running:   number;   
  sweep_dir:       "prefix" | "suffix" | "none";
  example_arrays:  number[][];
  total:           number;
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 6 — SIMULATION FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

function blankStep(over: Partial<Step> & Pick<Step,"phase"|"message">): Step {
  return {
    insight: "", current_length: 0,
    dp_dn: [], dp_up: [], new_dp_dn: [], new_dp_up: [],
    active_y: -1, active_x: -1,
    sweep_idx: -1, sweep_running: 0, sweep_dir: "none",
    example_arrays: [], total: 0,
    ...over,
  };
}

function isZigzag(arr: number[]): boolean {
  for (let i = 1; i < arr.length; i++) if (arr[i] === arr[i-1]) return false;
  for (let i = 2; i < arr.length; i++) {
    const up1 = arr[i-1] > arr[i-2], up2 = arr[i] > arr[i-1];
    if (up1 === up2) return false;
  }
  return true;
}

function sampleZigzags(len: number, l: number, r: number, limit = 6): number[][] {
  const results: number[][] = [];
  function gen(cur: number[]) {
    if (results.length >= limit) return;
    if (cur.length === len) { if (isZigzag(cur)) results.push([...cur]); return; }
    for (let v = l; v <= r; v++) gen([...cur, v]);
  }
  gen([]);
  return results;
}

const MOD = 1_000_000_007;

function buildNaiveSteps(n: number, l: number, r: number): Step[] {
  const steps: Step[] = [];
  const m = r - l + 1;

  let dp_dn = new Array(m).fill(0);
  let dp_up = new Array(m).fill(0);

  steps.push(blankStep({
    phase: "init", current_length: 2,
    dp_dn: [...dp_dn], dp_up: [...dp_up],
    new_dp_dn: [...dp_dn], new_dp_up: [...dp_up],
    example_arrays: sampleZigzags(n, l, r),
    message: `Setup: m = r−l+1 = ${m} possible values. Two DP arrays indexed by value.`,
    insight: `dp_dn[v] = sequences ending at v, last move ↑ (so next MUST ↓)\ndp_up[v] = sequences ending at v, last move ↓ (so next MUST ↑)\n\nThe zigzag rule means we track which direction we came FROM — that determines which direction we MUST go next.`,
  }));

  for (let a = 0; a < m; a++)
    for (let b = 0; b < m; b++)
      if (a !== b) b > a ? dp_dn[b]++ : dp_up[b]++;

  steps.push(blankStep({
    phase: "base", current_length: 2,
    dp_dn: [...dp_dn], dp_up: [...dp_up],
    new_dp_dn: [...dp_dn], new_dp_up: [...dp_up],
    total: dp_dn.reduce((a,b)=>a+b,0) + dp_up.reduce((a,b)=>a+b,0),
    example_arrays: sampleZigzags(2, l, r),
    message: `Base case (length 2): enumerate all m(m−1) = ${m*(m-1)} distinct pairs.`,
    insight: `For length 2: any pair (a,b) with a≠b works.\n• If b > a → move was ↑ → dp_dn[b]++  (next must ↓)\n• If b < a → move was ↓ → dp_up[b]++  (next must ↑)\n\ndp_dn[v] = v  (v values below v can precede it going up)\ndp_up[v] = m−1−v  (m−1−v values above v can precede it going down)`,
  }));

  for (let len = 3; len <= n; len++) {
    const nd = new Array(m).fill(0);
    const nu = new Array(m).fill(0);

    steps.push(blankStep({
      phase: "transition", current_length: len,
      dp_dn: [...dp_dn], dp_up: [...dp_up],
      new_dp_dn: [...nd], new_dp_up: [...nu],
      message: `Length ${len}: O(m²) — for each target y, sum over all valid sources x.`,
      insight: `For each target value y:\n  nd[y] = Σ dp_up[x] for x < y\n         (x→y goes ↑, need prev move ↓ → from dp_up)\n  nu[y] = Σ dp_dn[x] for x > y\n         (x→y goes ↓, need prev move ↑ → from dp_dn)\n\nThis nested loop is O(m²) per length — the bottleneck!`,
    }));

    for (let y = 0; y < m; y++) {
      for (let x = 0; x < m; x++) {
        if (x === y) continue;
        if (x < y) { nd[y] = (nd[y] + dp_up[x]) % MOD; }
        else        { nu[y] = (nu[y] + dp_dn[x]) % MOD; }
        steps.push(blankStep({
          phase: "transition", current_length: len,
          dp_dn: [...dp_dn], dp_up: [...dp_up],
          new_dp_dn: [...nd], new_dp_up: [...nu],
          active_y: y, active_x: x,
          message: x < y
            ? `nd[${y}] += dp_up[${x}] = ${dp_up[x]}  (${l+x}→${l+y} is ↑, prev ↓)`
            : `nu[${y}] += dp_dn[${x}] = ${dp_dn[x]}  (${l+x}→${l+y} is ↓, prev ↑)`,
          insight: x < y
            ? `Source x=${l+x} < target y=${l+y}: move ↑\nMust have come from dp_up (previous move was ↓)\nAdd dp_up[${x}]=${dp_up[x]} → nd[${y}] is now ${nd[y]}`
            : `Source x=${l+x} > target y=${l+y}: move ↓\nMust have come from dp_dn (previous move was ↑)\nAdd dp_dn[${x}]=${dp_dn[x]} → nu[${y}] is now ${nu[y]}`,
        }));
      }
    }

    dp_dn = nd; dp_up = nu;
    const tot = dp_dn.reduce((a,b)=>a+b,0) + dp_up.reduce((a,b)=>a+b,0);
    steps.push(blankStep({
      phase: "update", current_length: len,
      dp_dn: [...dp_dn], dp_up: [...dp_up],
      new_dp_dn: [...dp_dn], new_dp_up: [...dp_up],
      total: tot,
      example_arrays: sampleZigzags(len, l, r),
      message: `Length ${len} done. Total valid sequences = ${tot}.`,
      insight: `After length ${len}: we've counted all valid zigzag arrays.\n\nKey observation ready for optimization:\n  nd[y] = dp_up[0]+…+dp_up[y−1]  ← this is a PREFIX SUM!\n  nu[y] = dp_dn[y+1]+…+dp_dn[m−1] ← this is a SUFFIX SUM!\n\nInstead of O(m²) per length, we can compute both in O(m)!`,
    }));
  }

  const total = (dp_dn.reduce((a,b)=>a+b,0) + dp_up.reduce((a,b)=>a+b,0)) % MOD;
  steps.push(blankStep({
    phase: "done", current_length: n,
    dp_dn: [...dp_dn], dp_up: [...dp_up],
    new_dp_dn: [...dp_dn], new_dp_up: [...dp_up],
    total, example_arrays: sampleZigzags(n, l, r),
    message: `Answer = Σ (dp_dn[v] + dp_up[v]) = ${total} (mod 10⁹+7)`,
    insight: `Sum all dp_dn[v] + dp_up[v] to count every valid zigzag array of length ${n}.\n\nTime complexity: O(n·m²)\n→ Switch to Optimized tab to see the O(n·m) improvement!`,
  }));

  return steps;
}

function buildOptimizedSteps(n: number, l: number, r: number): Step[] {
  const steps: Step[] = [];
  const m = r - l + 1;
  let dp_dn = new Array(m).fill(0);
  let dp_up = new Array(m).fill(0);

  steps.push(blankStep({
    phase: "init", current_length: 2,
    dp_dn: [...dp_dn], dp_up: [...dp_up],
    new_dp_dn: [...dp_dn], new_dp_up: [...dp_up],
    example_arrays: sampleZigzags(n, l, r),
    message: `Optimized: same DP, but use prefix/suffix sums for O(m) transitions.`,
    insight: `Key insight: look at the naive transition:\n  nd[y] = Σ_{x<y} dp_up[x]\n  nu[y] = Σ_{x>y} dp_dn[x]\n\nnd[y] is EXACTLY the prefix sum of dp_up up to index y−1.\nnu[y] is EXACTLY the suffix sum of dp_dn from index y+1.\n\nCompute each with one linear scan instead of a nested loop.\nO(m²) → O(m) per length. Total: O(n·m).`,
  }));

  for (let a = 0; a < m; a++)
    for (let b = 0; b < m; b++)
      if (a !== b) b > a ? dp_dn[b]++ : dp_up[b]++;

  steps.push(blankStep({
    phase: "base", current_length: 2,
    dp_dn: [...dp_dn], dp_up: [...dp_up],
    new_dp_dn: [...dp_dn], new_dp_up: [...dp_up],
    total: dp_dn.reduce((a,b)=>a+b,0) + dp_up.reduce((a,b)=>a+b,0),
    example_arrays: sampleZigzags(2, l, r),
    message: `Base case (length 2): same as naive — m(m−1) = ${m*(m-1)} pairs.`,
    insight: `dp_dn[v] = v  (values 0..v−1 can rise into v)\ndp_up[v] = m−1−v  (values v+1..m−1 can fall into v)\n\nThis is identical to the naive approach — the optimization\nonly kicks in for the transition step at length ≥ 3.`,
  }));

  for (let len = 3; len <= n; len++) {
    const nd = new Array(m).fill(0);
    const nu = new Array(m).fill(0);

    steps.push(blankStep({
      phase: "transition", current_length: len,
      dp_dn: [...dp_dn], dp_up: [...dp_up],
      new_dp_dn: [...nd], new_dp_up: [...nu],
      sweep_dir: "prefix",
      message: `Length ${len}: LEFT→RIGHT prefix sweep of dp_up[] to fill nd[].`,
      insight: `nd[y] = Σ_{x<y} dp_up[x] = running sum of dp_up\n\nScan left→right, maintain pref = sum so far:\n  nd[0] = 0  (no x < 0)\n  nd[1] = dp_up[0]\n  nd[2] = dp_up[0] + dp_up[1]\n  ...\n\nEach nd[y] gets the prefix sum BEFORE adding dp_up[y].`,
    }));

    let pref = 0;
    for (let y = 0; y < m; y++) {
      nd[y] = pref;
      steps.push(blankStep({
        phase: "prefix", current_length: len,
        dp_dn: [...dp_dn], dp_up: [...dp_up],
        new_dp_dn: [...nd], new_dp_up: [...nu],
        active_y: y, sweep_idx: y, sweep_running: pref,
        sweep_dir: "prefix",
        message: `nd[${y}] = pref = ${pref}  ← count of seqs from all x<${y} going ↑ to ${l+y}`,
        insight: `nd[${y}] = ${pref}\n= Σ dp_up[x] for x in 0..${y-1}\n${y > 0 ? `= ${Array.from({length:y},(_,i)=>`dp_up[${i}]=${dp_up[i]}`).join(" + ")}\n` : "(no terms — first element)\n"}\nThen pref += dp_up[${y}] = ${dp_up[y]} → pref becomes ${(pref+dp_up[y])%MOD}`,
      }));
      pref = (pref + dp_up[y]) % MOD;
    }

    steps.push(blankStep({
      phase: "transition", current_length: len,
      dp_dn: [...dp_dn], dp_up: [...dp_up],
      new_dp_dn: [...nd], new_dp_up: [...nu],
      sweep_dir: "suffix",
      message: `Length ${len}: RIGHT→LEFT suffix sweep of dp_dn[] to fill nu[].`,
      insight: `nu[y] = Σ_{x>y} dp_dn[x] = running sum of dp_dn from right\n\nScan right→left, maintain suff = sum so far:\n  nu[m−1] = 0  (no x > m−1)\n  nu[m−2] = dp_dn[m−1]\n  nu[m−3] = dp_dn[m−1] + dp_dn[m−2]\n  ...\n\nEach nu[y] gets the suffix sum BEFORE adding dp_dn[y].`,
    }));

    let suff = 0;
    for (let y = m - 1; y >= 0; y--) {
      nu[y] = suff;
      steps.push(blankStep({
        phase: "suffix", current_length: len,
        dp_dn: [...dp_dn], dp_up: [...dp_up],
        new_dp_dn: [...nd], new_dp_up: [...nu],
        active_y: y, sweep_idx: y, sweep_running: suff,
        sweep_dir: "suffix",
        message: `nu[${y}] = suff = ${suff}  ← seqs from all x>${y} falling ↓ to ${l+y}`,
        insight: `nu[${y}] = ${suff}\n= Σ dp_dn[x] for x in ${y+1}..${m-1}\n${y < m-1 ? `= ${Array.from({length:m-1-y},(_,i)=>`dp_dn[${y+1+i}]=${dp_dn[y+1+i]}`).join(" + ")}\n` : "(no terms — last element)\n"}\nThen suff += dp_dn[${y}] = ${dp_dn[y]} → suff becomes ${(suff+dp_dn[y])%MOD}`,
      }));
      suff = (suff + dp_dn[y]) % MOD;
    }

    dp_dn = nd; dp_up = nu;
    const tot = dp_dn.reduce((a,b)=>a+b,0) + dp_up.reduce((a,b)=>a+b,0);
    steps.push(blankStep({
      phase: "update", current_length: len,
      dp_dn: [...dp_dn], dp_up: [...dp_up],
      new_dp_dn: [...dp_dn], new_dp_up: [...dp_up],
      total: tot, example_arrays: sampleZigzags(len, l, r),
      message: `Length ${len} done in O(m). Total valid sequences = ${tot}.`,
      insight: `Both passes took O(m) each → O(m) per length step.\n\nCompare: naive was O(m²) per step.\nFor m=100: 10,000 ops → 200 ops. 50× faster!\n\nThe dp arrays are now ready for the next length.`,
    }));
  }

  const total = (dp_dn.reduce((a,b)=>a+b,0) + dp_up.reduce((a,b)=>a+b,0)) % MOD;
  steps.push(blankStep({
    phase: "done", current_length: n,
    dp_dn: [...dp_dn], dp_up: [...dp_up],
    new_dp_dn: [...dp_dn], new_dp_up: [...dp_up],
    total, example_arrays: sampleZigzags(n, l, r),
    message: `Answer = ${total} (mod 10⁹+7)`,
    insight: `Final answer: sum all dp_dn[v] + dp_up[v].\n\nTime:  O(n·m)  — two O(m) passes per length\nSpace: O(m)    — only two arrays kept at a time\n\nVs naive: O(n·m²) time — the prefix/suffix trick saves\none factor of m from the transition.`,
  }));

  return steps;
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 7 — COMPLEXITY
// ════════════════════════════════════════════════════════════════════════════

const COMPLEXITY: Record<SolutionId, { time: string; space: string; note: string }> = {
  naive: {
    time:  "O(n·m²)",
    space: "O(m)",
    note:  "Nested loop over all (x,y) pairs for each length. m = r−l+1.",
  },
  optimized: {
    time:  "O(n·m)",
    space: "O(m)",
    note:  "Replace nested loop with one prefix scan + one suffix scan, each O(m).",
  },
};

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 8 — PHASE DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

const PHASE_META: Record<Phase, { borderColor: string; bgColor: string; icon: string; label: string }> = {
  init:       { borderColor: "border-l-slate-400",   bgColor: "bg-slate-50",     icon: "→", label: "Init"       },
  base:       { borderColor: "border-l-blue-400",    bgColor: "bg-blue-50",      icon: "₂", label: "Base"       },
  transition: { borderColor: "border-l-amber-400",   bgColor: "bg-amber-50",     icon: "↕", label: "Transition" },
  prefix:     { borderColor: "border-l-emerald-500", bgColor: "bg-emerald-50",   icon: "→", label: "Prefix →"   },
  suffix:     { borderColor: "border-l-purple-500",  bgColor: "bg-purple-50",    icon: "←", label: "Suffix ←"   },
  update:     { borderColor: "border-l-sky-500",     bgColor: "bg-sky-50",       icon: "✓", label: "Update"     },
  done:       { borderColor: "border-l-emerald-600", bgColor: "bg-emerald-100",  icon: "■", label: "Done"       },
};

const PHASES_BY_SOLUTION: Record<SolutionId, Phase[]> = {
  naive:     ["init","base","transition","update","done"],
  optimized: ["init","base","transition","prefix","suffix","update","done"],
};

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 9 — REUSABLE UI COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

function CodePanel({ solution, phase }: { solution: SolutionId; phase: Phase }) {
  const lines = solution === "naive" ? NAIVE_CODE : OPTIMIZED_CODE;
  const hl: Partial<Record<Phase, number[]>> = {
    naive: {
      base:       [6,7],
      transition: [10,11,12,13,14],
      update:     [15],
      done:       [17,18,19],
    },
    optimized: {
      base:       [4,5],
      transition: [8,9,11,12],
      prefix:     [9,10],
      suffix:     [12,13],
      update:     [14],
      done:       [16,17,18],
    },
  }[solution] ?? {};
  const hLines = new Set(hl[phase] ?? []);

  return (
    <div className="rounded-lg border border-slate-200  bg-white mt-4">
      <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-400"/><span className="w-2.5 h-2.5 rounded-full bg-amber-400"/>
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"/>
        <span className="ml-2 text-xs text-slate-500 font-mono">{solution === "naive" ? "naive.cpp" : "optimized.cpp"}</span>
      </div>
      <div className="overflow-auto max-h-64 bg-slate-950/95">
        <table className="w-full text-xs font-mono">
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} style={{ background: hLines.has(i) ? "rgba(139,92,246,0.18)" : "transparent" }} className="text-slate-100">
                <td className="select-none w-8 text-right pr-3 pl-2 py-0.5 border-r border-slate-800"
                  style={{ color: hLines.has(i) ? "#c4b5fd" : "#64748b" }}>{i+1}</td>
                <td className="pl-3 py-0.5 whitespace-pre" style={{ color: hLines.has(i) ? "#e9d5ff" : undefined }}>{line||" "}</td>
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
    <div ref={ref} className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1" style={{scrollbarWidth:"thin"}}>
      {steps.slice(0, currentIndex+1).map((s,i)=>{
        const m = PHASE_META[s.phase];
        return (
          <div key={i} className={`flex items-start gap-2 px-2 py-1.5 rounded-r border-l-2 text-xs ${m.borderColor} ${m.bgColor} ${i===currentIndex?"opacity-100":"opacity-55"}`}>
            <span className="font-mono font-bold text-slate-500 shrink-0 w-4">{m.icon}</span>
            <span className="text-slate-700 leading-snug">{s.message}</span>
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 10 — CUSTOM VISUAL PANELS (REDESIGNED)
// ════════════════════════════════════════════════════════════════════════════

// ── Zigzag example arrays panel ───────────────────────────────────────────
function ZigzagExamplesPanel({ arrays, l }: { arrays: number[][]; l: number }) {
  if (!arrays.length) return null;
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
      <p className="text-xs text-slate-500 font-medium mb-3">
        Valid zigzag arrays (current length, sample)
      </p>
      <div className="flex flex-col gap-2">
        {arrays.slice(0,6).map((arr, ai) => (
          <div key={ai} className="flex items-center gap-1">
            {arr.map((v, vi) => {
              const prev = arr[vi-1];
              const isUp   = prev !== undefined && v > prev;
              const isDown = prev !== undefined && v < prev;
              return (
                <div key={vi} className="flex items-center gap-0.5">
                  {vi > 0 && (
                    <span className={`text-xs font-bold w-4 text-center
                      ${isUp ? "text-emerald-500" : "text-rose-500"}`}>
                      {isUp ? "↑" : "↓"}
                    </span>
                  )}
                  <div className={`w-7 h-7 flex items-center justify-center rounded-lg font-mono text-xs font-bold border transition-all
                    ${isUp   ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : isDown ? "bg-rose-50 border-rose-300 text-rose-800"
                    : "bg-slate-50 border-slate-200 text-slate-700"}`}>
                    {v}
                  </div>
                </div>
              );
            })}
            <span className="ml-1 text-[10px] text-slate-400">✓</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── NEW: Heatmap DP Grid ──────────────────────────────────────────────────
function DPStateGrid({ step, l }: { step: Step; l: number }) {
  const m = step.dp_dn.length;
  if (!m) return null;

  const maxVal = Math.max(1, ...step.dp_dn, ...step.dp_up, ...step.new_dp_dn, ...step.new_dp_up);

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
          DP State at length {step.current_length}
        </p>
        <div className="flex gap-3 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-sky-500"/> dp_dn (next ↓)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500"/> dp_up (next ↑)
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-xs text-slate-400 font-normal text-left">Value (v)</th>
              {Array.from({ length: m }, (_, i) => (
                <th key={i} className="p-2 text-xs font-bold text-slate-700 w-12">{l + i}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 text-[10px] text-slate-500 font-mono text-left align-middle">
                {["transition", "prefix", "suffix"].includes(step.phase) ? "Prev" : "Curr"} dp_dn
              </td>
              {step.dp_dn.map((val, i) => {
                const isActive = i === step.active_x || i === step.active_y;
                const intensity = val / maxVal;
                return (
                  <td key={i} className="p-1">
                    <div 
                      className={`h-10 rounded flex items-center justify-center font-mono text-xs font-bold transition-all
                        ${isActive ? "ring-2 ring-amber-400 scale-110 z-10" : ""}`}
                      style={{ 
                        backgroundColor: `rgba(14, 165, 233, ${0.1 + intensity * 0.6})`,
                        color: intensity > 0.5 ? "white" : "#0369a1"
                      }}
                    >
                      {val}
                    </div>
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="p-2 text-[10px] text-slate-500 font-mono text-left align-middle">
                {["transition", "prefix", "suffix"].includes(step.phase) ? "Prev" : "Curr"} dp_up
              </td>
              {step.dp_up.map((val, i) => {
                const isActive = i === step.active_x || i === step.active_y;
                const intensity = val / maxVal;
                return (
                  <td key={i} className="p-1">
                    <div 
                      className={`h-10 rounded flex items-center justify-center font-mono text-xs font-bold transition-all
                        ${isActive ? "ring-2 ring-amber-400 scale-110 z-10" : ""}`}
                      style={{ 
                        backgroundColor: `rgba(16, 185, 129, ${0.1 + intensity * 0.6})`,
                        color: intensity > 0.5 ? "white" : "#047857"
                      }}
                    >
                      {val}
                    </div>
                  </td>
                );
              })}
            </tr>

            {["transition", "prefix", "suffix"].includes(step.phase) && (
              <>
                <tr className="border-t-2 border-dashed border-slate-200">
                  <td className="p-2 text-[10px] text-amber-600 font-mono text-left align-middle font-bold">
                    New dp_dn
                  </td>
                  {step.new_dp_dn.map((val, i) => {
                    const isActive = i === step.active_y;
                    const intensity = val / maxVal;
                    return (
                      <td key={i} className="p-1">
                        <div 
                          className={`h-10 rounded flex items-center justify-center font-mono text-xs font-bold border-2 border-dashed transition-all
                            ${isActive ? "border-amber-400 bg-amber-50 scale-110 z-10" : "border-slate-200"}`}
                          style={{ 
                            backgroundColor: val > 0 ? `rgba(14, 165, 233, ${0.05 + intensity * 0.4})` : "transparent",
                            color: intensity > 0.5 ? "white" : "#0369a1"
                          }}
                        >
                          {val || "·"}
                        </div>
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="p-2 text-[10px] text-amber-600 font-mono text-left align-middle font-bold">
                    New dp_up
                  </td>
                  {step.new_dp_up.map((val, i) => {
                    const isActive = i === step.active_y;
                    const intensity = val / maxVal;
                    return (
                      <td key={i} className="p-1">
                        <div 
                          className={`h-10 rounded flex items-center justify-center font-mono text-xs font-bold border-2 border-dashed transition-all
                            ${isActive ? "border-amber-400 bg-amber-50 scale-110 z-10" : "border-slate-200"}`}
                          style={{ 
                            backgroundColor: val > 0 ? `rgba(16, 185, 129, ${0.05 + intensity * 0.4})` : "transparent",
                            color: intensity > 0.5 ? "white" : "#047857"
                          }}
                        >
                          {val || "·"}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── NEW: The Accumulator Tank (Prefix/Suffix Visualizer) ──────────────────
function AccumulatorTank({ step, l }: { step: Step; l: number }) {
  if (step.phase !== "prefix" && step.phase !== "suffix") return null;

  const isPrefix = step.phase === "prefix";
  const m = step.dp_dn.length;
  const src = isPrefix ? step.dp_up : step.dp_dn;
  const dst = isPrefix ? step.new_dp_dn : step.new_dp_up;
  
  const maxSum = Math.max(1, src.reduce((a, b) => a + b, 0));

  return (
    <div className={`p-6 rounded-xl border-2 ${
      isPrefix ? "bg-emerald-50 border-emerald-200" : "bg-purple-50 border-purple-200"
    }`}>
      <div className="flex items-center gap-2 mb-4">
        <span className={`text-sm font-bold ${isPrefix ? "text-emerald-700" : "text-purple-700"}`}>
          {isPrefix ? "→ Prefix Sweep: The Accumulator in Action" : "← Suffix Sweep: The Accumulator in Action"}
        </span>
      </div>
      
      <div className="flex gap-6 items-end justify-center overflow-x-auto pb-4">
        {Array.from({ length: m }, (_, i) => {
          const isCur = i === step.sweep_idx;
          const isPast = isPrefix ? i < step.sweep_idx : i > step.sweep_idx;
          
          let poured = 0;
          let absorbed = 0;

          if (isCur) {
            poured = step.sweep_running;
            absorbed = src[i];
          } else if (isPast) {
            poured = dst[i]; 
            absorbed = src[i];
          }
          
          const totalTank = poured + absorbed;
          const greenHeight = maxSum > 0 ? (poured / maxSum) * 100 : 0;
          const blueHeight = maxSum > 0 ? (absorbed / maxSum) * 100 : 0;
          
          const dstVal = dst[i];
          const isActive = isCur || isPast;

          return (
            <div key={i} className={`flex flex-col items-center gap-2 transition-all duration-500 ${isCur ? "scale-110" : isPast ? "opacity-80" : "opacity-40"}`}>
              {/* Source */}
              <div className={`w-14 h-10 flex items-center justify-center rounded-lg font-mono text-sm font-bold border-2 transition-all
                ${isCur ? "bg-white border-amber-400 text-amber-800 shadow-lg ring-2 ring-amber-200" 
                : isActive ? "bg-white border-slate-300 text-slate-600" 
                : "bg-slate-50 border-slate-200 text-slate-400"}`}>
                {src[i]}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">src[{i}]</div>

              {/* Arrow down */}
              <div className={`text-xl transition-all ${isCur ? "text-amber-500 animate-bounce" : "text-slate-300"}`}>↓</div>

              {/* The Tank */}
              <div className="relative w-14 h-24 border-2 border-slate-400 rounded-b-xl bg-slate-50 overflow-hidden shadow-inner">
                {/* Blue part (just absorbed) */}
                <div 
                  className="absolute w-full transition-all duration-700 ease-out"
                  style={{ 
                    height: `${blueHeight}%`,
                    backgroundColor: isPrefix ? "#3b82f6" : "#a855f7",
                    bottom: `${greenHeight}%` 
                  }}
                />
                {/* Green part (poured into dst) */}
                <div 
                  className="absolute bottom-0 w-full transition-all duration-700 ease-out"
                  style={{ 
                    height: `${greenHeight}%`,
                    backgroundColor: isPrefix ? "#10b981" : "#c084fc",
                  }}
                />
                {/* Tank label */}
                {totalTank > 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-[10px] font-bold text-white z-10 drop-shadow-md">
                    <div>{totalTank}</div>
                  </div>
                )}
              </div>
              <div className="text-[10px] font-semibold text-slate-600">Tank</div>

              {/* Arrow down */}
              <div className={`text-xl transition-all ${isCur ? "text-emerald-500 animate-pulse" : "text-slate-300"}`}>↓</div>

              {/* Destination */}
              <div className={`w-14 h-12 flex items-center justify-center rounded-lg font-mono text-sm font-bold border-2 transition-all
                ${isCur ? "bg-emerald-100 border-emerald-500 text-emerald-800 shadow-lg ring-2 ring-emerald-200" 
                : isActive ? "bg-white border-emerald-300 text-emerald-700 border-dashed" 
                : "bg-slate-50 border-slate-200 text-slate-400 border-dashed"}`}>
                {isActive ? dstVal : "·"}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">dst[{i}]</div>
              
              {/* Index */}
              <div className={`mt-1 text-xs font-bold ${isCur ? "text-amber-600" : "text-slate-400"}`}>
                v = {l + i}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-xs bg-white p-3 rounded-lg shadow-sm border border-slate-100">
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded ${isPrefix ? "bg-emerald-500" : "bg-purple-400"}`}></div>
          <span className="text-slate-700 font-medium">Running sum (poured into dst)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded ${isPrefix ? "bg-blue-500" : "bg-purple-600"}`}></div>
          <span className="text-slate-700 font-medium">Newly absorbed from src</span>
        </div>
      </div>
      
      <div className="mt-4 text-center text-sm font-mono font-bold text-slate-800 bg-white p-3 rounded-lg shadow-sm border border-slate-200">
        {step.sweep_idx !== -1 ? (
          <>
            Step {step.sweep_idx}: Pouring <span className="text-emerald-600">{step.sweep_running}</span> into dst[{step.sweep_idx}], 
            then absorbing <span className={isPrefix ? "text-blue-600" : "text-purple-600"}>{src[step.sweep_idx]}</span> into tank.
          </>
        ) : "Sweep complete!"}
      </div>
    </div>
  );
}

// ── Insight box ───────────────────────────────────────────────────────────
function InsightBox({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1.5">
        Key insight
      </p>
      <p className="text-xs text-indigo-800 leading-relaxed whitespace-pre-line font-mono">
        {text}
      </p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 11 — MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function ZigZagVisualizer() {
  const [activeSolution, setActiveSolution] = useState<SolutionId>("optimized");
  const [activeTestCase, setActiveTestCase] = useState("ex2");

  const [nInput, setNInput] = useState("3");
  const [lInput, setLInput] = useState("1");
  const [rInput, setRInput] = useState("3");

  const [steps, setSteps]                       = useState<Step[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [playing, setPlaying]                   = useState(false);
  const [speed, setSpeed]                       = useState(700);
  const intervalRef = useRef<ReturnType<typeof setInterval>|null>(null);

  const currentStep = steps[currentStepIndex] ?? steps[0];

  const rebuild = useCallback(() => {
    const n = parseInt(nInput)||3, l = parseInt(lInput)||1, r = parseInt(rInput)||3;
    if (n < 2 || l >= r || r-l > 10) return;
    const s = activeSolution === "naive"
      ? buildNaiveSteps(n, l, r)
      : buildOptimizedSteps(n, l, r);
    setSteps(s);
    setCurrentStepIndex(0);
    setPlaying(false);
  }, [nInput, lInput, rInput, activeSolution]);

  useEffect(() => { rebuild(); }, [rebuild]);

  useEffect(() => {
    if (!playing) { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setCurrentStepIndex(p => p >= steps.length-1 ? p : p+1);
    }, speed);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, speed, steps.length]);

  useEffect(() => {
    if (playing && currentStepIndex >= steps.length-1) setPlaying(false);
  }, [currentStepIndex, steps.length, playing]);

  const complexity = COMPLEXITY[activeSolution];
  const phases     = PHASES_BY_SOLUTION[activeSolution];
  if (!currentStep) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-6 overflow-hidden">

      {/* Header */}
      <header className="flex justify-between items-center mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg">
            <Braces size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-none">{PROBLEM_TITLE}</h1>
            <p className="text-slate-500 text-xs mt-1 italic">{PROBLEM_SUBTITLE}</p>
          </div>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded border border-rose-300 text-rose-700 bg-rose-50">
          {PROBLEM_BADGE}
        </span>
      </header>

      {/* Solution tabs */}
      <div className="flex gap-2 mb-4 shrink-0 bg-slate-200/50 p-1 rounded-xl w-fit">
        {SOLUTIONS.map(sol => (
          <button key={sol.id} onClick={() => setActiveSolution(sol.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2
              ${activeSolution === sol.id ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
            {sol.id === "naive" ? <TrendingUp size={14}/> : <Zap size={14}/>}
            {sol.label}
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-mono">
              {sol.complexity}
            </span>
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
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all
                  ${currentStep.phase === p
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                    : "bg-white border-slate-200 text-slate-400"}`}>
                {PHASE_META[p].icon} {PHASE_META[p].label}
              </div>
            ))}
          </div>

          {/* Key insight — compact, always visible */}
          <InsightBox text={currentStep.insight} />

          {/* Zigzag examples */}
          {currentStep.example_arrays.length > 0 && (
            <ZigzagExamplesPanel arrays={currentStep.example_arrays} l={parseInt(lInput)||1} />
          )}

          {/* NEW: DP State Grid */}
          <DPStateGrid step={currentStep} l={parseInt(lInput)||1} />

          {/* NEW: Accumulator Tank for Prefix/Suffix */}
          <AccumulatorTank step={currentStep} l={parseInt(lInput)||1} />

          {/* Answer / running total */}
          {(currentStep.total > 0 || currentStep.phase === "done") && (
            <div className={`p-4 rounded-xl border flex items-center justify-between
              ${currentStep.phase === "done"
                ? "bg-emerald-50 border-emerald-200"
                : "bg-white border-slate-100 shadow-sm"}`}>
              <span className="text-xs font-medium text-slate-500">
                {currentStep.phase === "done" ? "Final answer (mod 10⁹+7)" : `Valid arrays of length ${currentStep.current_length}`}
              </span>
              <span className={`text-2xl font-bold font-mono ${currentStep.phase==="done" ? "text-emerald-700" : "text-slate-800"}`}>
                {currentStep.total}
              </span>
            </div>
          )}

          {/* Step log */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-2">Step log</p>
            <StepLog steps={steps} currentIndex={currentStepIndex} />
          </div>

          {/* Code */}
          <CodePanel solution={activeSolution} phase={currentStep.phase} />
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
                    if (tc.id !== "custom") { setNInput(String(tc.n)); setLInput(String(tc.l)); setRInput(String(tc.r)); }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                    ${activeTestCase === tc.id ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                  {tc.label}
                </button>
              ))}
            </div>
            {activeTestCase !== "custom" && (() => {
              const tc = TEST_CASES.find(t=>t.id===activeTestCase);
              return tc ? (
                <>
                  <p className="text-[10px] text-slate-500 italic">{tc.description}</p>
                  {tc.expected >= 0 && <p className="text-[10px] font-mono text-emerald-700">Expected: {tc.expected}</p>}
                </>
              ) : null;
            })()}
          </div>

          {/* Input */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-2">
            <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-medium">Input</p>
            {[
              {label:"n (length)", val:nInput, set:setNInput, type:"number", min:2, max:8},
              {label:"l (lower)",  val:lInput, set:setLInput, type:"number", min:0},
              {label:"r (upper)",  val:rInput, set:setRInput, type:"number", min:1},
            ].map(({label,val,set,type,min,max})=>(
              <div key={label} className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</label>
                <input type={type} value={val} min={min} max={max}
                  onChange={e=>{set(e.target.value);setActiveTestCase("custom");}}
                  className="font-mono text-xs px-2 py-1.5 rounded border border-slate-200 bg-slate-50 text-slate-900 w-28"/>
              </div>
            ))}
            <button onClick={rebuild}
              className="mt-1 w-full px-3 py-1.5 rounded border border-slate-300 text-xs text-slate-800 hover:bg-slate-100 transition-colors">
              Rebuild steps
            </button>
            <p className="text-[10px] text-slate-400">Keep r−l ≤ 10 for readability. n ≤ 8 for naive.</p>
          </div>

          {/* Animation controls */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-2">Animation Controls</p>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <button onClick={()=>setCurrentStepIndex(0)} disabled={currentStepIndex===0}
                className="p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30">
                <RotateCcw size={16}/>
              </button>
              <button onClick={()=>setCurrentStepIndex(p=>Math.max(0,p-1))} disabled={currentStepIndex===0}
                className="p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30">←</button>
              <button onClick={()=>setPlaying(p=>!p)} disabled={currentStepIndex>=steps.length-1}
                className={`px-4 py-1.5 text-xs rounded-full border font-medium flex items-center gap-1
                  ${playing?"bg-amber-50 text-amber-800 border-amber-300":"bg-indigo-600 text-white border-indigo-600 shadow-md"}`}>
                {playing?<><Pause size={14}/>Pause</>:<><Play size={14}/>Play</>}
              </button>
              <button onClick={()=>setCurrentStepIndex(p=>Math.min(steps.length-1,p+1))} disabled={currentStepIndex>=steps.length-1}
                className="p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30">
                <StepForward size={16}/>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Speed</span>
              <input type="range" min={100} max={1200} step={100} value={1300-speed}
                onChange={e=>setSpeed(1300-Number(e.target.value))} className="w-24 accent-indigo-600"/>
              <span className="text-xs font-mono text-slate-500">{speed}ms</span>
            </div>
            <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 transition-all duration-200"
                style={{width:steps.length?`${((currentStepIndex+1)/steps.length)*100}%`:"0%"}}/>
            </div>
            <span className="mt-1 block text-right text-xs text-slate-500 font-mono">
              {steps.length?`${currentStepIndex+1}/${steps.length}`:"0/0"}
            </span>
          </div>

          {/* Complexity */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-2">Complexity</p>
            <div className="flex flex-col gap-3 mb-2">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide">Time</span>
                <p className="font-mono text-sm text-slate-900">{complexity.time}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide">Space</span>
                <p className="font-mono text-sm text-slate-900">{complexity.space}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{complexity.note}</p>
          </div>

          {/* Comparison card — only when on optimized */}
          {activeSolution === "optimized" && (
            <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100">
              <p className="text-xs font-bold text-indigo-700 mb-2 uppercase tracking-wide">Why O(m) works</p>
              <div className="space-y-2 text-xs text-indigo-700">
                <div className="flex items-start gap-2">
                  <span className="font-mono font-bold text-emerald-600 shrink-0">nd[y]</span>
                  <span>= sum of dp_up[x] for x &lt; y<br/>
                    <span className="opacity-70">= prefix sum — scan left→right once</span></span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono font-bold text-purple-600 shrink-0">nu[y]</span>
                  <span>= sum of dp_dn[x] for x &gt; y<br/>
                    <span className="opacity-70">= suffix sum — scan right→left once</span></span>
                </div>
                <div className="pt-2 border-t border-indigo-100 font-semibold">
                  2 × O(m) passes vs 1 × O(m²) loop<br/>
                  <span className="font-normal opacity-70">For m=100: 200 ops vs 10,000 ops</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}