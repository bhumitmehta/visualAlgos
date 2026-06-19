"use client";

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║              AlgoViz — Process String with Special Operations II         ║
 * ║                                                                          ║
 * ║  Visualization for LeetCode 3614                                         ║
 * ║  Two-phase backward tracing: forward pass computes length,               ║
 * ║  backward pass traces the k-th character without materializing string.   ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { FileText, Play, Pause, RotateCcw, StepForward } from "lucide-react";

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 1 — PROBLEM METADATA
// ════════════════════════════════════════════════════════════════════════════

const PROBLEM_TITLE    = "Process String with Special Operations II";
const PROBLEM_SUBTITLE = "String Simulation · Backward Tracing";
const PROBLEM_BADGE    = "Hard • Reverse Tracking";
const PROBLEM_STATEMENT = `Given a string s of lowercase letters and special characters *, #, %:
  • Lowercase letter → append to result
  • '*' → remove last character (if any)
  • '#' → duplicate result (append result to itself)
  • '%' → reverse result

The result length can reach 10¹⁵, so materializing it is impossible.
The key insight: run a forward pass to compute the final length, then trace
backwards through s to find which original character is at position k.`;

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 2 — SOLUTION DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

const SOLUTIONS = [
  { id: "backward", label: "Backward Trace", complexity: "O(n)" },
  { id: "naive",    label: "Naive (small n)", complexity: "O(n²)" },
] as const;

type SolutionId = typeof SOLUTIONS[number]["id"];

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 3 — TEST CASES
// ════════════════════════════════════════════════════════════════════════════

const TEST_CASES = [
  { id: "ex1", label: "Example 1", s: "a#b%*",  k: 1,  expected: "a", description: "append, dup, append, rev, del → 'ba'" },
  { id: "ex2", label: "Example 2", s: "cd%#*#", k: 3,  expected: "d", description: "builds 'dcddcd', index 3 → 'd'" },
  { id: "ex3", label: "Example 3", s: "z*#",    k: 0,  expected: ".", description: "result empty after ops → '.'" },
  { id: "ex4", label: "Big #",     s: "ab###",  k: 5,  expected: "b", description: "doubles three times → length 16" },
  { id: "ex5", label: "Only *",    s: "***",    k: 0,  expected: ".", description: "nothing to delete → '.'" },
  { id: "custom", label: "Custom", s: "a#b%*",  k: 0,  expected: "",  description: "Enter your own input" },
] as const;

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 4 — CODE SNIPPETS
// ════════════════════════════════════════════════════════════════════════════

const BACKWARD_CODE: string[] = [
  "char processStr(string s, long long k) {",
  "  // Forward pass: compute final length",
  "  long long len = 0;",
  "  for (auto c : s) {",
  "    if      (c == '*') { if (len) len--; }",
  "    else if (c == '#') { len *= 2; }",
  "    else if (c == '%') { /* no length change */ }",
  "    else               { len++; }",
  "  }",
  "  if (k + 1 > len) return '.';",
  "  // Backward pass: trace k through operations in reverse",
  "  for (int i = s.size()-1; i >= 0; i--) {",
  "    if      (s[i] == '*') { len++; }",
  "    else if (s[i] == '#') {",
  "      if (k + 1 > (len+1)/2) k -= len/2;",
  "      len = (len+1)/2;",
  "    }",
  "    else if (s[i] == '%') { k = len - k - 1; }",
  "    else {",
  "      if (k + 1 == len) return s[i];",
  "      else              len--;",
  "    }",
  "  }",
  "  return '.';",
  "}",
];

const NAIVE_CODE: string[] = [
  "char processStr(string s, long long k) {",
  "  string res = \"\";",
  "  for (char c : s) {",
  "    if (c == '*') {",
  "      if (!res.empty()) res.pop_back();",
  "    } else if (c == '#') {",
  "      res += res;  // duplicate — O(n) copy",
  "    } else if (c == '%') {",
  "      reverse(res.begin(), res.end());",
  "    } else {",
  "      res += c;",
  "    }",
  "  }",
  "  if (k >= res.size()) return '.';",
  "  return res[k];",
  "}",
];

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 5 — STEP TYPES
// ════════════════════════════════════════════════════════════════════════════

type Phase =
  | "init"
  | "forward_letter"
  | "forward_star"
  | "forward_hash"
  | "forward_percent"
  | "forward_done"
  | "bounds_check"
  | "backward_star"
  | "backward_hash_stay"
  | "backward_hash_shift"
  | "backward_percent"
  | "backward_letter_found"
  | "backward_letter_skip"
  | "done";

interface Step {
  phase:          Phase;
  message:        string;
  passLabel:      "forward" | "backward" | "result";
  // forward pass state
  fwdIndex:       number;          // current char index in s during forward
  fwdLen:         bigint;
  // backward pass state
  bwdIndex:       number;          // current char index during backward (right→left)
  bwdLen:         bigint;
  bwdK:           bigint;
  // result
  answer:         string | null;
  // naive-only materialized string (capped at 64 chars for display)
  naiveResult:    string;
  // which index in s is the active one for highlighting
  activeCharIdx:  number;
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 6 — SIMULATION — BACKWARD TRACE
// ════════════════════════════════════════════════════════════════════════════

function buildBackwardSteps(s: string, kRaw: bigint): Step[] {
  const steps: Step[] = [];
  const n = s.length;

  const blank = (): Omit<Step, "phase" | "message" | "passLabel"> => ({
    fwdIndex: 0, fwdLen: 0n,
    bwdIndex: n - 1, bwdLen: 0n, bwdK: kRaw,
    answer: null, naiveResult: "", activeCharIdx: -1,
  });

  steps.push({ ...blank(), phase: "init", passLabel: "forward",
    message: "Forward pass: track how each operation changes the string length (no string built).",
    fwdIndex: -1,
  });

  // ── Forward pass ──
  let len = 0n;
  for (let i = 0; i < n; i++) {
    const c = s[i];
    const prevLen = len;
    if      (c === "*") { if (len > 0n) len--; }
    else if (c === "#") { len *= 2n; }
    else if (c === "%") { /* no change */ }
    else                { len++; }

    const phaseMap: Record<string, Phase> = {
      "*": "forward_star", "#": "forward_hash",
      "%": "forward_percent",
    };
    const phase: Phase = phaseMap[c] ?? "forward_letter";
    const opDesc = c === "*"   ? `'*' removes last char. len ${prevLen} → ${len}`
                 : c === "#"   ? `'#' doubles. len ${prevLen} → ${len}`
                 : c === "%"   ? `'%' reverses (length unchanged). len = ${len}`
                 : `'${c}' appended. len ${prevLen} → ${len}`;

    steps.push({ ...blank(), phase, passLabel: "forward",
      message: `[i=${i}] ${opDesc}`,
      fwdIndex: i, fwdLen: len, activeCharIdx: i,
    });
  }

  steps.push({ ...blank(), phase: "forward_done", passLabel: "forward",
    message: `Forward pass done. Final length = ${len}.`,
    fwdIndex: n, fwdLen: len,
  });

  // ── Bounds check ──
  if (kRaw + 1n > len) {
    steps.push({ ...blank(), phase: "bounds_check", passLabel: "result",
      message: `k=${kRaw} is out of bounds (length=${len}). Return '.'.`,
      fwdLen: len, answer: ".",
    });
    steps.push({ ...blank(), phase: "done", passLabel: "result",
      message: `Answer: '.'`, fwdLen: len, answer: ".",
    });
    return steps;
  }

  steps.push({ ...blank(), phase: "bounds_check", passLabel: "backward",
    message: `k=${kRaw} is within bounds (length=${len}). Start backward pass to trace position.`,
    fwdLen: len, bwdLen: len, bwdK: kRaw,
  });

  // ── Backward pass ──
  let bLen = len;
  let k    = kRaw;

  for (let i = n - 1; i >= 0; i--) {
    const c = s[i];
    const prevBLen = bLen;
    const prevK    = k;

    if (c === "*") {
      bLen++;
      steps.push({ ...blank(), phase: "backward_star", passLabel: "backward",
        message: `[i=${i}] Reverse '*': undo deletion, restore one char. len ${prevBLen} → ${bLen}. k stays ${k}.`,
        fwdLen: len, bwdIndex: i, bwdLen: bLen, bwdK: k, activeCharIdx: i,
      });
    } else if (c === "#") {
      if (k + 1n > (bLen + 1n) / 2n) {
        k -= bLen / 2n;
        bLen = (bLen + 1n) / 2n;
        steps.push({ ...blank(), phase: "backward_hash_shift", passLabel: "backward",
          message: `[i=${i}] Reverse '#': k=${prevK} was in the second half. Shift k → ${k}. len → ${bLen}.`,
          fwdLen: len, bwdIndex: i, bwdLen: bLen, bwdK: k, activeCharIdx: i,
        });
      } else {
        bLen = (bLen + 1n) / 2n;
        steps.push({ ...blank(), phase: "backward_hash_stay", passLabel: "backward",
          message: `[i=${i}] Reverse '#': k=${k} is in first half. k unchanged. len → ${bLen}.`,
          fwdLen: len, bwdIndex: i, bwdLen: bLen, bwdK: k, activeCharIdx: i,
        });
      }
    } else if (c === "%") {
      k = bLen - k - 1n;
      steps.push({ ...blank(), phase: "backward_percent", passLabel: "backward",
        message: `[i=${i}] Reverse '%': mirror k. k ${prevK} → ${k} (= ${bLen}-${prevK}-1).`,
        fwdLen: len, bwdIndex: i, bwdLen: bLen, bwdK: k, activeCharIdx: i,
      });
    } else {
      // letter
      if (k + 1n === bLen) {
        steps.push({ ...blank(), phase: "backward_letter_found", passLabel: "backward",
          message: `[i=${i}] '${c}' was at position ${bLen-1n}. k+1=${k+1n} == len=${bLen}. FOUND! Answer = '${c}'.`,
          fwdLen: len, bwdIndex: i, bwdLen: bLen, bwdK: k, answer: c, activeCharIdx: i,
        });
        steps.push({ ...blank(), phase: "done", passLabel: "result",
          message: `Answer: '${c}'`, fwdLen: len, answer: c,
        });
        return steps;
      } else {
        bLen--;
        steps.push({ ...blank(), phase: "backward_letter_skip", passLabel: "backward",
          message: `[i=${i}] '${c}' not our target (k+1=${k+1n} ≠ len=${prevBLen}). Skip. len → ${bLen}.`,
          fwdLen: len, bwdIndex: i, bwdLen: bLen, bwdK: k, activeCharIdx: i,
        });
      }
    }
  }

  steps.push({ ...blank(), phase: "done", passLabel: "result",
    message: "Answer: '.' (not found after full backward pass)", fwdLen: len, answer: ".",
  });
  return steps;
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 6b — SIMULATION — NAIVE (materialized, small inputs only)
// ════════════════════════════════════════════════════════════════════════════

const CAP = 64; // display cap

function buildNaiveSteps(s: string, kRaw: bigint): Step[] {
  const steps: Step[] = [];
  const n = s.length;

  const blank = (): Omit<Step, "phase" | "message" | "passLabel"> => ({
    fwdIndex: -1, fwdLen: 0n,
    bwdIndex: -1, bwdLen: 0n, bwdK: kRaw,
    answer: null, naiveResult: "", activeCharIdx: -1,
  });

  let res = "";
  steps.push({ ...blank(), phase: "init", passLabel: "forward",
    message: "Naive: materialize the string step by step (only feasible for small inputs).",
    naiveResult: "",
  });

  for (let i = 0; i < n; i++) {
    const c = s[i];
    if      (c === "*") { if (res.length) res = res.slice(0, -1); }
    else if (c === "#") { res = res + res; }
    else if (c === "%") { res = res.split("").reverse().join(""); }
    else                { res += c; }

    const op = c === "*"   ? `'*' → delete last → "${res.slice(0,CAP)}${res.length>CAP?"…":""}"`
             : c === "#"   ? `'#' → duplicate → length ${res.length}`
             : c === "%"   ? `'%' → reverse → "${res.slice(0,CAP)}${res.length>CAP?"…":""}"`
             : `'${c}' → append → "${res.slice(0,CAP)}${res.length>CAP?"…":""}"`;

    const phaseMap: Record<string, Phase> = {
      "*": "forward_star", "#": "forward_hash", "%": "forward_percent",
    };
    steps.push({ ...blank(), phase: phaseMap[c] ?? "forward_letter", passLabel: "forward",
      message: `[i=${i}] ${op}`,
      fwdIndex: i, fwdLen: BigInt(res.length),
      naiveResult: res.slice(0, CAP),
      activeCharIdx: i,
    });
  }

  const k = Number(kRaw);
  const answer = k >= res.length ? "." : res[k];
  steps.push({ ...blank(), phase: "done", passLabel: "result",
    message: `Done! result="${res.slice(0,CAP)}${res.length>CAP?"…":""}". result[${k}] = '${answer}'.`,
    fwdLen: BigInt(res.length), naiveResult: res.slice(0, CAP), answer,
  });
  return steps;
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 7 — COMPLEXITY INFO
// ════════════════════════════════════════════════════════════════════════════

const COMPLEXITY: Record<SolutionId, { time: string; space: string; note: string }> = {
  backward: {
    time:  "O(n)",
    space: "O(1)",
    note:  "Two linear scans of s. No string is ever materialized. Works even when result length exceeds 10¹⁵.",
  },
  naive: {
    time:  "O(n · L)",
    space: "O(L)",
    note:  "L = final string length. '#' copies the whole string each time, making this infeasible for large inputs.",
  },
};

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 8 — PHASE DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

const PHASE_META: Record<Phase, { borderColor: string; bgColor: string; icon: string; label: string }> = {
  init:                    { borderColor: "border-l-slate-400",   bgColor: "bg-slate-50",     icon: "→", label: "Init"         },
  forward_letter:          { borderColor: "border-l-blue-400",    bgColor: "bg-blue-50",      icon: "+", label: "Fwd: letter"  },
  forward_star:            { borderColor: "border-l-rose-400",    bgColor: "bg-rose-50",      icon: "−", label: "Fwd: *"       },
  forward_hash:            { borderColor: "border-l-violet-400",  bgColor: "bg-violet-50",    icon: "×", label: "Fwd: #"       },
  forward_percent:         { borderColor: "border-l-amber-400",   bgColor: "bg-amber-50",     icon: "↔", label: "Fwd: %"       },
  forward_done:            { borderColor: "border-l-emerald-400", bgColor: "bg-emerald-50",   icon: "✓", label: "Fwd done"     },
  bounds_check:            { borderColor: "border-l-slate-400",   bgColor: "bg-slate-50",     icon: "?", label: "Bounds"       },
  backward_star:           { borderColor: "border-l-rose-500",    bgColor: "bg-rose-50",      icon: "↺", label: "Bwd: *"       },
  backward_hash_stay:      { borderColor: "border-l-violet-500",  bgColor: "bg-violet-50",    icon: "◁", label: "Bwd: # stay"  },
  backward_hash_shift:     { borderColor: "border-l-violet-600",  bgColor: "bg-violet-100",   icon: "▷", label: "Bwd: # shift" },
  backward_percent:        { borderColor: "border-l-amber-500",   bgColor: "bg-amber-50",     icon: "↩", label: "Bwd: %"       },
  backward_letter_found:   { borderColor: "border-l-emerald-600", bgColor: "bg-emerald-100",  icon: "★", label: "Found!"       },
  backward_letter_skip:    { borderColor: "border-l-slate-400",   bgColor: "bg-slate-50",     icon: "↓", label: "Bwd: skip"    },
  done:                    { borderColor: "border-l-emerald-600", bgColor: "bg-emerald-100",  icon: "■", label: "Done"         },
};

const PHASES_BY_SOLUTION: Record<SolutionId, Phase[]> = {
  backward: ["init","forward_letter","forward_star","forward_hash","forward_percent",
             "forward_done","bounds_check","backward_star","backward_hash_stay",
             "backward_hash_shift","backward_percent","backward_letter_found",
             "backward_letter_skip","done"],
  naive:    ["init","forward_letter","forward_star","forward_hash","forward_percent","done"],
};

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 9 — REUSABLE UI COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

function CodePanel({ solution }: { solution: SolutionId }) {
  const lines    = solution === "backward" ? BACKWARD_CODE : NAIVE_CODE;
  const filename = solution === "backward" ? "backward_trace.cpp" : "naive.cpp";
  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden bg-white mt-4">
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

/** Shows the input string s with each char highlighted based on phase */
function StringPanel({ s, step, solution }: { s: string; step: Step; solution: SolutionId }) {
  const isForward  = step.passLabel === "forward";
  const isBackward = step.passLabel === "backward";

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-slate-500 font-medium">Input string s</p>
        <div className="flex gap-2 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-100 border border-blue-400 inline-block" /> letter
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-100 border border-rose-400 inline-block" /> *
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-violet-100 border border-violet-400 inline-block" /> #
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-100 border border-amber-400 inline-block" /> %
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {s.split("").map((c, i) => {
          const isActive = step.activeCharIdx === i;
          const isFwdDone = isForward && step.fwdIndex > i && step.fwdIndex >= 0;
          const isBwdDone = isBackward && step.bwdIndex < i;

          const baseColor =
            c === "*" ? "bg-rose-50 border-rose-200 text-rose-700"
            : c === "#" ? "bg-violet-50 border-violet-200 text-violet-700"
            : c === "%" ? "bg-amber-50 border-amber-200 text-amber-700"
            : "bg-blue-50 border-blue-200 text-blue-700";

          const activeColor =
            c === "*" ? "bg-rose-200 border-rose-500 text-rose-900 scale-110 shadow-md"
            : c === "#" ? "bg-violet-200 border-violet-500 text-violet-900 scale-110 shadow-md"
            : c === "%" ? "bg-amber-200 border-amber-500 text-amber-900 scale-110 shadow-md"
            : "bg-blue-200 border-blue-500 text-blue-900 scale-110 shadow-md";

          const doneColor = "bg-slate-100 border-slate-200 text-slate-400";

          return (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] text-slate-400 font-mono">{i}</span>
              <div className={`w-8 h-8 flex items-center justify-center font-mono text-sm font-bold rounded border transition-all duration-150
                ${isActive ? activeColor : isFwdDone || isBwdDone ? doneColor : baseColor}`}>
                {c}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pass indicator */}
      <div className="mt-3 flex gap-2">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition-all
          ${step.passLabel === "forward" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}>
          ← Forward pass
        </span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition-all
          ${step.passLabel === "backward" ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-400"}`}>
          → Backward pass
        </span>
      </div>
    </div>
  );
}

/** Forward pass length tracker */
function LengthPanel({ step }: { step: Step }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
      <p className="text-xs text-slate-500 font-medium mb-3">Length tracker</p>
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-slate-400 uppercase tracking-wide">Forward len</span>
          <span className={`text-2xl font-mono font-bold mt-1 transition-all
            ${step.passLabel === "forward" ? "text-blue-700" : "text-slate-400"}`}>
            {step.fwdLen.toString()}
          </span>
        </div>
        {step.passLabel === "backward" || step.passLabel === "result" ? (
          <>
            <div className="w-px h-10 bg-slate-200" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">Backward len</span>
              <span className="text-2xl font-mono font-bold text-violet-700 mt-1">{step.bwdLen.toString()}</span>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">k (target pos)</span>
              <span className="text-2xl font-mono font-bold text-amber-700 mt-1">{step.bwdK.toString()}</span>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

/** Operation explainer — visual diagram of what each op does to len/k */
function OperationDiagram({ step }: { step: Step }) {
  const diagrams: Partial<Record<Phase, { label: string; visual: React.ReactNode }>> = {
    forward_letter:       { label: "Append letter",  visual: <span className="font-mono text-blue-700">len + 1</span> },
    forward_star:         { label: "Delete last",    visual: <span className="font-mono text-rose-700">len − 1</span> },
    forward_hash:         { label: "Duplicate",      visual: <span className="font-mono text-violet-700">len × 2</span> },
    forward_percent:      { label: "Reverse",        visual: <span className="font-mono text-amber-700">len unchanged</span> },
    backward_star:        { label: "Undo delete",    visual: <span className="font-mono text-rose-700">len + 1 (restore slot)</span> },
    backward_hash_stay:   { label: "k in 1st half",  visual: <span className="font-mono text-violet-700">len = ⌈len/2⌉, k same</span> },
    backward_hash_shift:  { label: "k in 2nd half",  visual: <span className="font-mono text-violet-800">k -= len/2, len = ⌈len/2⌉</span> },
    backward_percent:     { label: "Mirror k",        visual: <span className="font-mono text-amber-700">k = len − k − 1</span> },
    backward_letter_found:{ label: "Character found", visual: <span className="font-mono text-emerald-700">k+1 == len → return s[i]</span> },
    backward_letter_skip: { label: "Not our char",   visual: <span className="font-mono text-slate-600">len − 1 (remove slot)</span> },
  };

  const d = diagrams[step.phase];
  if (!d) return null;

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
      <p className="text-xs text-slate-500 font-medium mb-2">Current operation</p>
      <div className="flex items-center gap-3">
        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide
          ${PHASE_META[step.phase].bgColor} ${PHASE_META[step.phase].borderColor.replace("border-l-","text-")}`}>
          {PHASE_META[step.phase].label}
        </span>
        <span className="text-slate-400">→</span>
        <span className="text-sm">{d.visual}</span>
      </div>
    </div>
  );
}

/** Naive materialized string display */
function NaiveStringPanel({ step }: { step: Step }) {
  if (!step.naiveResult && step.phase === "init") {
    return (
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
        <p className="text-xs text-slate-500 font-medium mb-2">Materialized result</p>
        <span className="text-xs text-slate-400 italic">empty</span>
      </div>
    );
  }
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-500 font-medium">Materialized result</p>
        <span className="text-[10px] text-slate-400 font-mono">len={step.fwdLen.toString()}</span>
      </div>
      <div className="flex flex-wrap gap-1 min-h-[32px] items-center">
        {step.naiveResult.split("").map((c, i) => (
          <span key={i} className="w-7 h-7 flex items-center justify-center bg-blue-100 text-blue-800 font-bold font-mono text-xs rounded border border-blue-300">
            {c}
          </span>
        ))}
        {step.fwdLen > BigInt(step.naiveResult.length) && (
          <span className="text-xs text-slate-400 ml-1">… ({step.fwdLen.toString()} total)</span>
        )}
        {!step.naiveResult && <span className="text-xs text-slate-400 italic">empty</span>}
      </div>
    </div>
  );
}

/** Answer display */
function AnswerPanel({ step }: { step: Step }) {
  if (!step.answer) return null;
  return (
    <div className={`p-5 rounded-xl shadow-sm border transition-all ${
      step.answer === "." ? "bg-rose-50 border-rose-200" : "bg-emerald-50 border-emerald-200"
    }`}>
      <p className="text-xs font-medium mb-2" style={{ color: step.answer === "." ? "#be123c" : "#065f46" }}>
        Answer
      </p>
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 flex items-center justify-center text-3xl font-bold rounded-xl border-2 font-mono
          ${step.answer === "." ? "bg-rose-100 border-rose-400 text-rose-700" : "bg-emerald-100 border-emerald-500 text-emerald-800"}`}>
          '{step.answer}'
        </div>
        <span className="text-sm text-slate-600">
          {step.answer === "." ? "k is out of bounds" : `Character at position k`}
        </span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 11 — MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function ProcessStringViz() {
  const [activeSolution, setActiveSolution] = useState<SolutionId>("backward");
  const [activeTestCase, setActiveTestCase] = useState<string>("ex1");

  const [sInput, setSInput]     = useState("a#b%*");
  const [kInput, setKInput]     = useState("1");

  const [steps, setSteps]                 = useState<Step[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [playing, setPlaying]             = useState(false);
  const [speed, setSpeed]                 = useState(700);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const rebuild = useCallback(() => {
    const kVal = BigInt(kInput.trim() || "0");
    const newSteps = activeSolution === "backward"
      ? buildBackwardSteps(sInput, kVal)
      : buildNaiveSteps(sInput, kVal);
    setSteps(newSteps);
    setCurrentStepIndex(0);
    setPlaying(false);
  }, [sInput, kInput, activeSolution]);

  useEffect(() => { rebuild(); }, [rebuild]);

  useEffect(() => {
    if (!playing) { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev >= steps.length - 1) return prev;
        return prev + 1;
      });
    }, speed);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, speed, steps.length]);

  useEffect(() => {
    if (playing && currentStepIndex >= steps.length - 1) setPlaying(false);
  }, [currentStepIndex, steps.length, playing]);

  const currentStep = steps[currentStepIndex] ?? steps[0];
  const complexity  = COMPLEXITY[activeSolution];
  const phases      = PHASES_BY_SOLUTION[activeSolution];

  if (!currentStep) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-6 overflow-hidden">

      {/* ── Header ── */}
      <header className="flex justify-between items-center mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-600 rounded-lg text-white shadow-lg">
            <FileText size={24} />
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

      {/* ── Solution tabs ── */}
      <div className="flex gap-2 mb-4 shrink-0 bg-slate-200/50 p-1 rounded-xl w-fit">
        {SOLUTIONS.map(sol => (
          <button key={sol.id} onClick={() => setActiveSolution(sol.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2
              ${activeSolution === sol.id ? "bg-white text-violet-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
            {sol.label}
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-mono">
              {sol.complexity}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 overflow-hidden">

        {/* ── Left column ── */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{PROBLEM_STATEMENT}</p>
          </div>

          {/* Phase chips */}
          <div className="flex gap-1.5 flex-wrap">
            {phases.map(p => (
              <div key={p}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all
                  ${currentStep.phase === p
                    ? "bg-violet-600 border-violet-600 text-white shadow-md"
                    : "bg-white border-slate-200 text-slate-400"}`}>
                {PHASE_META[p].icon} {PHASE_META[p].label}
              </div>
            ))}
          </div>

          <StringPanel s={sInput} step={currentStep} solution={activeSolution} />
          <LengthPanel step={currentStep} />
          <OperationDiagram step={currentStep} />

          {activeSolution === "naive"
            ? <NaiveStringPanel step={currentStep} />
            : null}

          <AnswerPanel step={currentStep} />

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-2">Step log</p>
            <StepLog steps={steps} currentIndex={currentStepIndex} />
          </div>

          <CodePanel solution={activeSolution} />
        </div>

        {/* ── Right column ── */}
        <div className="w-full lg:w-80 flex flex-col gap-4 overflow-y-auto">

          {/* Test cases */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-3">
            <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-medium">Test Cases</p>
            <div className="flex flex-wrap gap-2">
              {TEST_CASES.map(tc => (
                <button key={tc.id}
                  onClick={() => {
                    setActiveTestCase(tc.id);
                    if (tc.id !== "custom") {
                      setSInput(tc.s);
                      setKInput(tc.k.toString());
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                    ${activeTestCase === tc.id ? "bg-violet-600 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                  {tc.label}
                </button>
              ))}
            </div>
            {activeTestCase !== "custom" && (
              <p className="text-[10px] text-slate-500 italic">
                {TEST_CASES.find(tc => tc.id === activeTestCase)?.description}
              </p>
            )}
            {activeTestCase !== "custom" && (
              <p className="text-[10px] font-mono text-emerald-700">
                Expected: '{TEST_CASES.find(tc => tc.id === activeTestCase)?.expected}'
              </p>
            )}
          </div>

          {/* Input config */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-2">
            <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-medium">Input Configuration</p>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 uppercase tracking-wide">
                s (letters + *, #, %)
              </label>
              <input type="text" value={sInput}
                onChange={e => { setSInput(e.target.value); setActiveTestCase("custom"); }}
                className="font-mono text-xs px-2 py-1.5 rounded border border-slate-200 bg-slate-50 text-slate-900" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 uppercase tracking-wide">k (0-indexed)</label>
              <input type="number" value={kInput} min={0}
                onChange={e => { setKInput(e.target.value); setActiveTestCase("custom"); }}
                className="font-mono text-xs px-2 py-1.5 rounded border border-slate-200 bg-slate-50 text-slate-900 w-32" />
            </div>
            <button onClick={rebuild}
              className="mt-1 px-3 py-1.5 rounded border border-slate-300 text-xs text-slate-800 hover:bg-slate-100 transition-colors">
              Rebuild steps
            </button>
            {activeSolution === "naive" && BigInt(kInput || "0") > 1000n && (
              <p className="text-[10px] text-amber-600">⚠ Naive mode: large k may be slow. Use Backward Trace for big inputs.</p>
            )}
          </div>

          {/* Controls */}
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
              <input type="range" min={100} max={1200} step={100}
                value={1300 - speed}
                onChange={e => setSpeed(1300 - Number(e.target.value))}
                className="w-24 accent-violet-600" />
              <span className="text-xs font-mono text-slate-500">{speed}ms</span>
            </div>
            <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 transition-all duration-200"
                style={{ width: steps.length ? `${((currentStepIndex + 1) / steps.length) * 100}%` : "0%" }} />
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

          {/* Key insight */}
          <div className="bg-violet-50 p-5 rounded-xl border border-violet-100">
            <p className="text-xs font-semibold text-violet-700 mb-2">Key insight</p>
            <p className="text-xs text-violet-600 leading-relaxed">
              The result can be up to 10¹⁵ characters — you can never build it.
              Instead: forward pass tracks only the <strong>length</strong>.
              Backward pass reverses each operation on <strong>k</strong>
              until it lands on an original appended character.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}