"use client";

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║              AlgoViz — Maximum Building Height (LC 1840)                 ║
 * ║                                                                          ║
 * ║  Algorithm:                                                              ║
 * ║  1. Sort restrictions + add sentinels [1,0] and [n, n-1]                ║
 * ║  2. Left→Right pass: cap each restriction by reachable height from left  ║
 * ║  3. Right→Left pass: cap each restriction by reachable height from right ║
 * ║  4. Between each adjacent pair, peak = (h[i] + h[j] + dist) / 2        ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Building2, Play, Pause, RotateCcw, StepForward } from "lucide-react";

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 1 — PROBLEM METADATA
// ════════════════════════════════════════════════════════════════════════════

const PROBLEM_TITLE    = "Maximum Building Height";
const PROBLEM_SUBTITLE = "Greedy · Constraint Propagation";
const PROBLEM_BADGE    = "Hard • Greedy";
const PROBLEM_STATEMENT =
`Build n buildings (1..n). Rules:
  • Building 1 height = 0
  • Adjacent heights differ by at most 1
  • Certain buildings have a max height cap

Goal: find the tallest possible building.

Algorithm (3 passes):
  1. Sort restrictions. Add sentinels [1,0] and [n, n-1] (uncapped end).
  2. Left → Right: h[i] = min(h[i], h[i-1] + dist)   — clamp by left neighbour
  3. Right → Left: h[i] = min(h[i], h[i+1] + dist)   — clamp by right neighbour
  4. Between each adjacent pair (i,j):
       peak = (h[i] + h[j] + gap) / 2   (floor)
     Answer = max of all peaks.`;

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 2 — SOLUTION DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

const SOLUTIONS = [
  { id: "greedy", label: "3-Pass Greedy", complexity: "O(r log r)" },
] as const;
type SolutionId = typeof SOLUTIONS[number]["id"];

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 3 — TEST CASES
// ════════════════════════════════════════════════════════════════════════════

const TEST_CASES = [
  { id: "ex1",    label: "Ex 1",   n: 5,  restrictions: [[2,1],[4,1]],              expected: 2, description: "Heights [0,1,2,1,2] — peak at pos 3 or 5" },
  { id: "ex2",    label: "Ex 2",   n: 6,  restrictions: [],                          expected: 5, description: "No restrictions — tallest = n-1 = 5" },
  { id: "ex3",    label: "Ex 3",   n: 10, restrictions: [[5,3],[2,5],[7,4],[10,3]], expected: 5, description: "Multiple constraints — answer 5" },
  { id: "tight",  label: "Tight",  n: 8,  restrictions: [[3,1],[6,1]],              expected: 3, description: "Two tight caps — peak between gaps" },
  { id: "single", label: "1 cap",  n: 7,  restrictions: [[4,0]],                    expected: 3, description: "Single zero-cap in the middle" },
  { id: "custom", label: "Custom", n: 5,  restrictions: [[2,1],[4,1]],              expected: -1, description: "Enter your own" },
] as const;

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 4 — CODE SNIPPETS
// ════════════════════════════════════════════════════════════════════════════

const GREEDY_CODE: string[] = [
  "int maxBuilding(int n, vector<vector<int>>& R) {",
  "  // 1. Add sentinels and sort",
  "  R.push_back({1, 0});",
  "  R.push_back({n, n - 1});",
  "  sort(R.begin(), R.end());",
  "",
  "  // 2. Left → Right pass",
  "  for (int i = 1; i < R.size(); i++) {",
  "    int dist = R[i][0] - R[i-1][0];",
  "    R[i][1] = min(R[i][1], R[i-1][1] + dist);",
  "  }",
  "",
  "  // 3. Right → Left pass",
  "  for (int i = R.size()-2; i >= 0; i--) {",
  "    int dist = R[i+1][0] - R[i][0];",
  "    R[i][1] = min(R[i][1], R[i+1][1] + dist);",
  "  }",
  "",
  "  // 4. Peak between each adjacent pair",
  "  int ans = 0;",
  "  for (int i = 0; i+1 < R.size(); i++) {",
  "    int gap  = R[i+1][0] - R[i][0];",
  "    int peak = (R[i][1] + R[i+1][1] + gap) / 2;",
  "    ans = max(ans, peak);",
  "  }",
  "  return ans;",
  "}",
];

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 5 — STEP TYPE
// ════════════════════════════════════════════════════════════════════════════

type Phase =
  | "init"
  | "sort"
  | "sentinel"
  | "ltr"          // left-to-right propagation step
  | "rtl"          // right-to-left propagation step
  | "peak"         // computing peak between pair
  | "best_peak"    // new best found
  | "done";

interface Restriction { id: number; h: number; original: number; }

interface Step {
  phase:   Phase;
  message: string;

  // template compat
  l: number | null;
  r: number | null;
  picks: { l: number; r: number; value: number }[];
  total: number;

  // current state of restrictions array
  restr:         Restriction[];
  // which indices are highlighted
  activeIdx:     number;
  compareIdx:    number;
  // current best answer
  bestAnswer:    number;
  bestPeakLeft:  number;
  bestPeakRight: number;
  // current segment being analysed
  segLeft:       number;  // index into restr
  segRight:      number;
  peakValue:     number;
  // skyline for rendering (array of {pos, height} for display)
  skylinePoints: { pos: number; height: number }[];
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 6 — SIMULATION FUNCTION
// ════════════════════════════════════════════════════════════════════════════

function makeStep(p: Partial<Step> & Pick<Step, "phase" | "message">): Step {
  return {
    l: null, r: null, picks: [], total: 0,
    restr: [], activeIdx: -1, compareIdx: -1,
    bestAnswer: 0, bestPeakLeft: -1, bestPeakRight: -1,
    segLeft: -1, segRight: -1, peakValue: 0,
    skylinePoints: [],
    ...p,
  };
}

/** Build a visual skyline from the restrictions array */
function makeSkyline(restr: Restriction[]): { pos: number; height: number }[] {
  if (restr.length === 0) return [];
  const pts: { pos: number; height: number }[] = [];
  for (let i = 0; i < restr.length; i++) {
    pts.push({ pos: restr[i].id, height: restr[i].h });
  }
  return pts;
}

function buildGreedySteps(nRaw: number, restrictionsRaw: [number, number][]): Step[] {
  const steps: Step[] = [];

  // Work with a mutable copy
  let restr: Restriction[] = restrictionsRaw.map(([id, h]) => ({ id, h, original: h }));

  steps.push(makeStep({
    phase: "init", restr: restr.map(r => ({ ...r })),
    message: `n=${nRaw}, ${restr.length} restriction${restr.length !== 1 ? "s" : ""}. Three passes: sort → left→right → right→left → compute peaks.`,
  }));

  // Sort
  restr.sort((a, b) => a.id - b.id);

  steps.push(makeStep({
    phase: "sort", restr: restr.map(r => ({ ...r })),
    message: `Sorted restrictions by building id: [${restr.map(r => `(${r.id},${r.h})`).join(", ")}].`,
  }));

  // Add sentinels
  restr = [
    { id: 1, h: 0, original: 0 },
    ...restr,
    { id: nRaw, h: nRaw - 1, original: nRaw - 1 },
  ];

  steps.push(makeStep({
    phase: "sentinel", restr: restr.map(r => ({ ...r })),
    message: `Added sentinels: [1,0] (building 1 must be 0) and [${nRaw},${nRaw-1}] (uncapped last building).`,
    activeIdx: 0, compareIdx: restr.length - 1,
  }));

  // ── Left → Right ──
  for (let i = 1; i < restr.length; i++) {
    const dist = restr[i].id - restr[i - 1].id;
    const capped = restr[i - 1].h + dist;
    const before = restr[i].h;
    restr[i].h = Math.min(restr[i].h, capped);
    steps.push(makeStep({
      phase: "ltr", restr: restr.map(r => ({ ...r })),
      activeIdx: i, compareIdx: i - 1,
      message: `L→R [${i}]: building ${restr[i].id}, dist=${dist} from building ${restr[i-1].id}. ` +
               `max reachable from left = ${restr[i-1].h}+${dist}=${capped}. ` +
               (restr[i].h < before
                 ? `Capped ${before} → ${restr[i].h}.`
                 : `Already ok (${before} ≤ ${capped}).`),
      skylinePoints: makeSkyline(restr),
    }));
  }

  // ── Right → Left ──
  for (let i = restr.length - 2; i >= 0; i--) {
    const dist = restr[i + 1].id - restr[i].id;
    const capped = restr[i + 1].h + dist;
    const before = restr[i].h;
    restr[i].h = Math.min(restr[i].h, capped);
    steps.push(makeStep({
      phase: "rtl", restr: restr.map(r => ({ ...r })),
      activeIdx: i, compareIdx: i + 1,
      message: `R→L [${i}]: building ${restr[i].id}, dist=${dist} from building ${restr[i+1].id}. ` +
               `max reachable from right = ${restr[i+1].h}+${dist}=${capped}. ` +
               (restr[i].h < before
                 ? `Capped ${before} → ${restr[i].h}.`
                 : `Already ok (${before} ≤ ${capped}).`),
      skylinePoints: makeSkyline(restr),
    }));
  }

  // ── Peak pass ──
  let best = 0, bestL = -1, bestR = -1;

  for (let i = 0; i + 1 < restr.length; i++) {
    const gap  = restr[i + 1].id - restr[i].id;
    const peak = Math.floor((restr[i].h + restr[i + 1].h + gap) / 2);
    const isNew = peak > best;
    if (isNew) { best = peak; bestL = i; bestR = i + 1; }

    steps.push(makeStep({
      phase: isNew ? "best_peak" : "peak",
      restr: restr.map(r => ({ ...r })),
      activeIdx: i, compareIdx: i + 1,
      segLeft: i, segRight: i + 1,
      peakValue: peak,
      bestAnswer: best, bestPeakLeft: bestL, bestPeakRight: bestR,
      skylinePoints: makeSkyline(restr),
      message: `Gap [${restr[i].id}…${restr[i+1].id}]: h=${restr[i].h}, h=${restr[i+1].h}, gap=${gap}. ` +
               `peak = (${restr[i].h}+${restr[i+1].h}+${gap})/2 = ${peak}.` +
               (isNew ? ` ★ New best!` : ""),
    }));
  }

  steps.push(makeStep({
    phase: "done",
    restr: restr.map(r => ({ ...r })),
    bestAnswer: best, bestPeakLeft: bestL, bestPeakRight: bestR,
    skylinePoints: makeSkyline(restr),
    total: best,
    message: `Done! Maximum building height = ${best}.`,
  }));

  return steps;
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 7 — COMPLEXITY INFO
// ════════════════════════════════════════════════════════════════════════════

const COMPLEXITY: Record<SolutionId, { time: string; space: string; note: string }> = {
  greedy: {
    time:  "O(r log r)",
    space: "O(r)",
    note:  "r = number of restrictions. Sort dominates. Three O(r) passes after sorting.",
  },
};

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 8 — PHASE DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

const PHASE_META: Record<Phase, { color: string; borderColor: string; bgColor: string; icon: string }> = {
  init:      { color: "text-slate-500",   borderColor: "border-l-slate-400",   bgColor: "bg-slate-100",   icon: "→" },
  sort:      { color: "text-blue-700",    borderColor: "border-l-blue-400",    bgColor: "bg-blue-50",     icon: "↕" },
  sentinel:  { color: "text-slate-600",   borderColor: "border-l-slate-400",   bgColor: "bg-slate-50",    icon: "S" },
  ltr:       { color: "text-sky-700",     borderColor: "border-l-sky-500",     bgColor: "bg-sky-50",      icon: "→" },
  rtl:       { color: "text-violet-700",  borderColor: "border-l-violet-500",  bgColor: "bg-violet-50",   icon: "←" },
  peak:      { color: "text-amber-700",   borderColor: "border-l-amber-400",   bgColor: "bg-amber-50",    icon: "△" },
  best_peak: { color: "text-emerald-700", borderColor: "border-l-emerald-500", bgColor: "bg-emerald-50",  icon: "★" },
  done:      { color: "text-emerald-800", borderColor: "border-l-emerald-600", bgColor: "bg-emerald-100", icon: "■" },
};

const PHASES_BY_SOLUTION: Record<SolutionId, Phase[]> = {
  greedy: ["init", "sort", "sentinel", "ltr", "rtl", "peak", "best_peak", "done"],
};

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 9 — REUSABLE UI COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

function CodePanel({ phase }: { phase: Phase }) {
  const lines = GREEDY_CODE;
  const highlight: Partial<Record<Phase, number[]>> = {
    sort:      [2, 3, 4],
    sentinel:  [2, 3],
    ltr:       [7, 8, 9, 10],
    rtl:       [13, 14, 15, 16],
    peak:      [20, 21, 22, 23],
    best_peak: [20, 21, 22, 23],
    done:      [25],
  };
  const hLines = new Set(highlight[phase] ?? []);
  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden bg-white mt-4">
      <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        <span className="ml-2 text-xs text-slate-500 font-mono">max_building.cpp</span>
      </div>
      <div className="overflow-auto max-h-72 bg-slate-950/95">
        <table className="w-full text-xs font-mono">
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} style={{ background: hLines.has(i) ? "rgba(139,92,246,0.18)" : "transparent" }} className="text-slate-100">
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

// ── Skyline SVG ───────────────────────────────────────────────────────────

function SkylinePanel({
  step, n, phase,
}: { step: Step; n: number; phase: Phase }) {
  const W = 560, H = 220, PAD_L = 36, PAD_R = 20, PAD_T = 24, PAD_B = 32;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const pts = step.skylinePoints;
  if (pts.length === 0) {
    return (
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
        <p className="text-xs text-slate-400 italic text-center py-8">Skyline appears after sorting…</p>
      </div>
    );
  }

  const maxH = Math.max(...pts.map(p => p.height), 1);
  const toX = (pos: number) => PAD_L + ((pos - 1) / (n - 1)) * plotW;
  const toY = (h: number)   => PAD_T + plotH - (h / maxH) * plotH;

  // Build the roof-line polyline through all restriction points
  // Between two consecutive points, the height follows a tent shape
  const roofPoints: { x: number; y: number }[] = [];
  for (let i = 0; i < pts.length; i++) {
    if (i === 0) {
      roofPoints.push({ x: toX(pts[i].pos), y: toY(pts[i].height) });
      continue;
    }
    // Optional: show the peak triangle between pts[i-1] and pts[i]
    const gap  = pts[i].pos - pts[i - 1].pos;
    const peak = Math.floor((pts[i - 1].height + pts[i].height + gap) / 2);
    const peakPos = pts[i - 1].pos + Math.floor((pts[i].pos - pts[i-1].pos + pts[i-1].height - pts[i].height) / 2 + 0.5);
    const clampedPeakPos = Math.min(Math.max(peakPos, pts[i-1].pos), pts[i].pos);
    roofPoints.push({ x: toX(clampedPeakPos), y: toY(peak) });
    roofPoints.push({ x: toX(pts[i].pos),     y: toY(pts[i].height) });
  }

  const polyline = roofPoints.map(p => `${p.x},${p.y}`).join(" ");
  // Fill area under the roof
  const fillPoly = [
    `${toX(pts[0].pos)},${PAD_T + plotH}`,
    ...roofPoints.map(p => `${p.x},${p.y}`),
    `${toX(pts[pts.length-1].pos)},${PAD_T + plotH}`,
  ].join(" ");

  // Best peak marker
  const showBest = (phase === "best_peak" || phase === "done" || phase === "peak") && step.bestPeakLeft >= 0;
  const bestLeft  = showBest ? pts[step.bestPeakLeft]  : null;
  const bestRight = showBest ? pts[step.bestPeakRight] : null;
  const bestGap   = bestLeft && bestRight ? bestRight.pos - bestLeft.pos : 0;
  const bestPeak  = bestLeft && bestRight ? Math.floor((bestLeft.height + bestRight.height + bestGap) / 2) : 0;
  const bestPeakPos = bestLeft && bestRight
    ? bestLeft.pos + Math.floor((bestRight.pos - bestLeft.pos + bestLeft.height - bestRight.height) / 2 + 0.5)
    : 0;

  // Currently active segment
  const segL = step.segLeft  >= 0 && step.segLeft  < pts.length ? pts[step.segLeft]  : null;
  const segR = step.segRight >= 0 && step.segRight < pts.length ? pts[step.segRight] : null;

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <p className="text-xs text-slate-500 font-medium">Skyline</p>
        <div className="flex gap-3 text-[10px] flex-wrap">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-sky-200 border border-sky-400 inline-block"/>L→R pass</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-violet-200 border border-violet-400 inline-block"/>R→L pass</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-200 border border-emerald-400 inline-block"/>Best peak</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg width={W} height={H} className="block mx-auto">
          {/* Grid lines */}
          {Array.from({ length: 5 }, (_, gi) => {
            const hVal = Math.round((maxH / 4) * gi);
            const y = toY(hVal);
            return (
              <g key={gi}>
                <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                <text x={PAD_L - 4} y={y} textAnchor="end" dominantBaseline="central" fontSize="9" fill="#94a3b8">{hVal}</text>
              </g>
            );
          })}
          {/* X axis */}
          <line x1={PAD_L} y1={PAD_T + plotH} x2={W - PAD_R} y2={PAD_T + plotH} stroke="#e2e8f0" strokeWidth="1.5" />

          {/* Filled skyline area */}
          <polygon points={fillPoly} fill="rgba(99,102,241,0.08)" />
          <polyline points={polyline} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" />

          {/* Active segment highlight */}
          {segL && segR && (
            <>
              <rect
                x={toX(segL.pos)} y={PAD_T}
                width={toX(segR.pos) - toX(segL.pos)} height={plotH}
                fill={phase === "best_peak" ? "rgba(16,185,129,0.07)" : "rgba(251,191,36,0.07)"}
              />
              {/* Peak triangle */}
              {(() => {
                const g   = segR.pos - segL.pos;
                const pk  = Math.floor((segL.height + segR.height + g) / 2);
                const pkP = segL.pos + Math.floor((segR.pos - segL.pos + segL.height - segR.height) / 2 + 0.5);
                const clPkP = Math.min(Math.max(pkP, segL.pos), segR.pos);
                return (
                  <>
                    <line x1={toX(segL.pos)} y1={toY(segL.height)} x2={toX(clPkP)} y2={toY(pk)}
                      stroke={phase === "best_peak" ? "#10b981" : "#f59e0b"}
                      strokeWidth="1.5" strokeDasharray="4 3" />
                    <line x1={toX(clPkP)} y1={toY(pk)} x2={toX(segR.pos)} y2={toY(segR.height)}
                      stroke={phase === "best_peak" ? "#10b981" : "#f59e0b"}
                      strokeWidth="1.5" strokeDasharray="4 3" />
                    <circle cx={toX(clPkP)} cy={toY(pk)} r={5}
                      fill={phase === "best_peak" ? "#10b981" : "#f59e0b"} />
                    <text x={toX(clPkP)} y={toY(pk) - 10}
                      textAnchor="middle" fontSize="10" fontWeight="700"
                      fill={phase === "best_peak" ? "#065f46" : "#92400e"}>
                      {pk}
                    </text>
                  </>
                );
              })()}
            </>
          )}

          {/* Best peak marker (persistent after found) */}
          {showBest && bestLeft && bestRight && phase === "done" && (
            <>
              <line x1={toX(bestPeakPos)} y1={toY(bestPeak)} x2={toX(bestPeakPos)} y2={PAD_T + plotH}
                stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 3" />
              <circle cx={toX(bestPeakPos)} cy={toY(bestPeak)} r={6} fill="#10b981" />
              <text x={toX(bestPeakPos)} y={toY(bestPeak) - 12}
                textAnchor="middle" fontSize="11" fontWeight="800" fill="#065f46">
                {step.bestAnswer}
              </text>
            </>
          )}

          {/* Restriction points */}
          {pts.map((pt, pi) => {
            const isActive  = pi === step.activeIdx;
            const isCompare = pi === step.compareIdx;
            const isSentinel = pt.pos === 1 || (pt.pos === n && step.restr.length > 0 && step.restr[step.restr.length-1]?.id === n);
            return (
              <g key={pi}>
                {/* Vertical guide */}
                <line x1={toX(pt.pos)} y1={PAD_T} x2={toX(pt.pos)} y2={PAD_T + plotH}
                  stroke={isActive ? "#6366f1" : isCompare ? "#8b5cf6" : "#f1f5f9"} strokeWidth={isActive ? 1.5 : 1} />
                {/* Dot */}
                <circle
                  cx={toX(pt.pos)} cy={toY(pt.height)} r={isActive ? 7 : 5}
                  fill={isActive
                    ? (phase === "ltr" ? "#0ea5e9" : phase === "rtl" ? "#8b5cf6" : "#6366f1")
                    : isCompare
                    ? (phase === "ltr" ? "#bae6fd" : "#ddd6fe")
                    : isSentinel ? "#94a3b8" : "#6366f1"}
                  stroke="white" strokeWidth="2"
                />
                {/* Building ID */}
                <text x={toX(pt.pos)} y={PAD_T + plotH + 14}
                  textAnchor="middle" fontSize="9" fill={isActive ? "#4f46e5" : "#94a3b8"} fontWeight={isActive ? "700" : "400"}>
                  {pt.pos}
                </text>
                {/* Height label */}
                {(isActive || isCompare) && (
                  <text x={toX(pt.pos)} y={toY(pt.height) - 11}
                    textAnchor="middle" fontSize="10" fontWeight="700"
                    fill={phase === "ltr" ? "#0369a1" : phase === "rtl" ? "#6d28d9" : "#4f46e5"}>
                    h={pt.height}
                  </text>
                )}
              </g>
            );
          })}

          {/* Axis labels */}
          <text x={PAD_L - 4} y={PAD_T} textAnchor="end" fontSize="9" fill="#94a3b8">h</text>
          <text x={W - PAD_R} y={PAD_T + plotH + 14} textAnchor="middle" fontSize="9" fill="#94a3b8">building</text>
        </svg>
      </div>
    </div>
  );
}

// ── Restrictions table ────────────────────────────────────────────────────
function RestrictionsTable({ step, phase }: { step: Step; phase: Phase }) {
  const { restr, activeIdx, compareIdx } = step;
  if (restr.length === 0) return null;

  const passColor = {
    ltr:  { active: "bg-sky-100 border-sky-400 text-sky-800",     compare: "bg-sky-50 border-sky-200 text-sky-600" },
    rtl:  { active: "bg-violet-100 border-violet-400 text-violet-800", compare: "bg-violet-50 border-violet-200 text-violet-600" },
    peak: { active: "bg-amber-100 border-amber-400 text-amber-800",    compare: "bg-amber-50 border-amber-200 text-amber-600" },
    best_peak: { active: "bg-emerald-100 border-emerald-400 text-emerald-800", compare: "bg-emerald-50 border-emerald-200 text-emerald-600" },
  }[phase] ?? { active: "bg-indigo-100 border-indigo-400 text-indigo-800", compare: "bg-slate-50 border-slate-200 text-slate-600" };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-slate-500 font-medium">Restrictions array</p>
        <div className="flex gap-2 text-[10px]">
          <span className="px-2 py-0.5 rounded bg-sky-50 border border-sky-200 text-sky-700">→ L→R active</span>
          <span className="px-2 py-0.5 rounded bg-violet-50 border border-violet-200 text-violet-700">← R→L active</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {restr.map((r, i) => {
          const isActive  = i === activeIdx;
          const isCompare = i === compareIdx;
          const isSentinel = r.id === 1 || (i === 0 || i === restr.length - 1);
          const wasCapped = r.h < r.original;
          return (
            <div key={i}
              className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all duration-200 min-w-[52px]
                ${isActive  ? passColor.active
                : isCompare ? passColor.compare
                : isSentinel ? "bg-slate-50 border-slate-200"
                : "bg-white border-slate-100"}`}>
              <span className="text-[9px] font-bold uppercase tracking-wider"
                style={{ color: isSentinel ? "#94a3b8" : "#6366f1" }}>
                {isSentinel && (i === 0 ? "start" : i === restr.length-1 ? "end" : "") || ""}
                bld {r.id}
              </span>
              <span className={`text-lg font-bold font-mono mt-0.5
                ${isActive ? "text-current" : wasCapped ? "text-rose-600" : "text-slate-700"}`}>
                {r.h}
              </span>
              {wasCapped && (
                <span className="text-[9px] text-slate-400 line-through font-mono">{r.original}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Peak formula breakdown ────────────────────────────────────────────────
function PeakPanel({ step, phase }: { step: Step; phase: Phase }) {
  if (phase !== "peak" && phase !== "best_peak" && phase !== "done") return null;
  if (step.segLeft < 0 || step.segRight < 0) return null;
  const pts = step.skylinePoints;
  if (!pts[step.segLeft] || !pts[step.segRight]) return null;

  const l    = pts[step.segLeft];
  const r    = pts[step.segRight];
  const gap  = r.pos - l.pos;
  const peak = Math.floor((l.height + r.height + gap) / 2);
  const isBest = phase === "best_peak";

  return (
    <div className={`p-5 rounded-xl border transition-all ${isBest ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-100"}`}>
      <p className={`text-xs font-bold mb-3 uppercase tracking-wide ${isBest ? "text-emerald-700" : "text-amber-700"}`}>
        {isBest ? "★ New best peak" : "Peak formula"}
      </p>
      <div className="flex flex-col gap-2">
        {[
          { label: `h[left] (bld ${l.pos})`,  value: l.height,  color: "text-indigo-700" },
          { label: `h[right] (bld ${r.pos})`, value: r.height,  color: "text-indigo-700" },
          { label: `gap = ${r.pos} - ${l.pos}`, value: gap,     color: "text-slate-600"  },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between text-xs">
            <span className="text-slate-500">{row.label}</span>
            <span className={`font-mono font-bold ${row.color}`}>{row.value}</span>
          </div>
        ))}
        <div className="border-t border-amber-200 pt-2 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">⌊(h_l + h_r + gap) / 2⌋</span>
          <span className={`text-lg font-bold font-mono ${isBest ? "text-emerald-700" : "text-amber-700"}`}>= {peak}</span>
        </div>
        {isBest && (
          <div className="text-[10px] text-emerald-600 font-medium">
            This beats previous best ({step.bestAnswer === peak ? "same as" : "was"} {step.bestAnswer})
          </div>
        )}
      </div>
    </div>
  );
}

// ── Answer banner ─────────────────────────────────────────────────────────
function AnswerBanner({ step, phase }: { step: Step; phase: Phase }) {
  if (phase !== "done") return null;
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-center justify-between">
      <div>
        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Maximum building height</p>
        <p className="text-xs text-emerald-600 mt-0.5">
          Tallest possible building respecting all constraints
        </p>
      </div>
      <div className="text-4xl font-bold font-mono text-emerald-700">{step.bestAnswer}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 11 — MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function AlgoVizTemplate() {
  const [activeSolution] = useState<SolutionId>("greedy");
  const [activeTestCase, setActiveTestCase] = useState<string>("ex1");

  const [nInput, setNInput]   = useState("5");
  const [rInput, setRInput]   = useState("[[2,1],[4,1]]");
  const [inputError, setInputError] = useState("");

  const [steps, setSteps]                       = useState<Step[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [playing, setPlaying]                   = useState(false);
  const [speed, setSpeed]                       = useState(600);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentStep = steps[currentStepIndex] ?? steps[0];

  const rebuild = useCallback(() => {
    const n = parseInt(nInput);
    if (isNaN(n) || n < 2) { setInputError("n must be ≥ 2"); return; }
    let restrictions: [number, number][] = [];
    try {
      restrictions = JSON.parse(rInput || "[]");
      if (!Array.isArray(restrictions)) throw new Error();
    } catch { setInputError("Restrictions must be valid JSON like [[2,1],[4,1]]"); return; }
    setInputError("");
    const s = buildGreedySteps(n, restrictions.map(r => [r[0], r[1]] as [number, number]));
    setSteps(s);
    setCurrentStepIndex(0);
    setPlaying(false);
  }, [nInput, rInput]);

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
  const n          = parseInt(nInput) || 5;

  if (!currentStep) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-6 overflow-hidden">

      {/* Header */}
      <header className="flex justify-between items-center mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg">
            <Building2 size={24} />
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

      {/* No solution tabs — single approach */}

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
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                    : "bg-white border-slate-200 text-slate-400"}`}>
                {PHASE_META[p].icon} {p.replace(/_/g, " ")}
              </div>
            ))}
          </div>

          {/* THE SKYLINE — main visualization */}
          <SkylinePanel step={currentStep} n={n} phase={currentStep.phase} />

          {/* Restrictions table */}
          <RestrictionsTable step={currentStep} phase={currentStep.phase} />

          {/* Peak breakdown */}
          <PeakPanel step={currentStep} phase={currentStep.phase} />

          {/* Answer banner */}
          <AnswerBanner step={currentStep} phase={currentStep.phase} />

          {/* Step log */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-2">Step log</p>
            <StepLog steps={steps} currentIndex={currentStepIndex} />
          </div>

          {/* Code panel */}
          <CodePanel phase={currentStep.phase} />
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
                    if (tc.id !== "custom") {
                      setNInput(String(tc.n));
                      setRInput(JSON.stringify(tc.restrictions));
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                    ${activeTestCase === tc.id ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
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
                    <p className="text-[10px] font-mono text-emerald-700">Expected: {tc.expected}</p>
                  )}
                </>
              ) : null;
            })()}
          </div>

          {/* Input configuration */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-2">
            <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-medium">Input Configuration</p>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 uppercase tracking-wide">n (number of buildings)</label>
              <input type="number" min={2} value={nInput}
                onChange={e => { setNInput(e.target.value); setActiveTestCase("custom"); }}
                className="font-mono text-xs px-2 py-1.5 rounded border border-slate-200 bg-slate-50 text-slate-900 w-32" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 uppercase tracking-wide">restrictions (JSON)</label>
              <textarea value={rInput}
                onChange={e => { setRInput(e.target.value); setActiveTestCase("custom"); }}
                className="font-mono text-xs px-2 py-1.5 rounded border border-slate-200 bg-slate-50 text-slate-900 h-20 resize-none"
                placeholder="[[2,1],[4,1]]" />
            </div>
            {inputError && <p className="text-[10px] text-rose-600">{inputError}</p>}
            <button onClick={rebuild}
              className="mt-1 w-full px-3 py-1.5 rounded border border-slate-300 text-xs text-slate-800 hover:bg-slate-100 transition-colors">
              Rebuild steps
            </button>
            <p className="text-[10px] text-slate-400">Keep n ≤ 50 for readable skyline.</p>
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
                  ${playing ? "bg-amber-50 text-amber-800 border-amber-300" : "bg-indigo-600 text-white border-indigo-600 shadow-md"}`}>
                {playing ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Play</>}
              </button>
              <button onClick={() => setCurrentStepIndex(p => Math.min(steps.length - 1, p + 1))} disabled={currentStepIndex >= steps.length - 1}
                className="p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30">
                <StepForward size={16} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Speed</span>
              <input type="range" min={100} max={1200} step={100} value={1300 - speed}
                onChange={e => setSpeed(1300 - Number(e.target.value))}
                className="w-24 accent-indigo-600" />
              <span className="text-xs font-mono text-slate-500">{speed}ms</span>
            </div>
            <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 transition-all duration-200"
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
          <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100">
            <p className="text-xs font-bold text-indigo-700 mb-2 uppercase tracking-wide">Key insight</p>
            <p className="text-xs text-indigo-700 leading-relaxed">
              Between two fixed points at positions <em>l</em> and <em>r</em> with capped heights
              <em> h_l</em> and <em>h_r</em>, the tallest tent you can raise is
              <code className="bg-indigo-100 px-1 rounded mx-1">⌊(h_l + h_r + gap) / 2⌋</code>
              where <code className="bg-indigo-100 px-1 rounded">gap = r − l</code>.
              The two passes ensure every cap is tight before you apply this formula.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}