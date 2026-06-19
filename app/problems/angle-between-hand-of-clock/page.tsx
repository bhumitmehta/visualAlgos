"use client";

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║              AlgoViz — Angle Between Hands of a Clock                   ║
 * ║                                                                          ║
 * ║  Visualization for LeetCode 1344                                         ║
 * ║  Formula: minute_angle = 6 * m                                          ║
 * ║           hour_angle   = 30 * h + 0.5 * m                              ║
 * ║           answer       = min(|diff|, 360 - |diff|)                     ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Clock, Play, Pause, RotateCcw, StepForward } from "lucide-react";

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 1 — PROBLEM METADATA
// ════════════════════════════════════════════════════════════════════════════

const PROBLEM_TITLE    = "Angle Between Hands of a Clock";
const PROBLEM_SUBTITLE = "Geometry · Direct Formula";
const PROBLEM_BADGE    = "Medium • Math";
const PROBLEM_STATEMENT = `Given hour (1–12) and minutes (0–59), return the smaller
angle (in degrees) between the hour and minute hands.

Key observations:
  • Minute hand moves 6° per minute  (360° / 60)
  • Hour hand moves 0.5° per minute  (360° / 720)
  • Hour hand angle = 30° × hour + 0.5° × minutes
  • Minute hand angle = 6° × minutes
  • Raw diff = |hour_angle − minute_angle|
  • Answer = min(diff, 360 − diff)`;

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 2 — SOLUTION DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

const SOLUTIONS = [
  { id: "formula", label: "Direct Formula", complexity: "O(1)" },
  { id: "step",    label: "Step Through",   complexity: "O(1)" },
] as const;

type SolutionId = typeof SOLUTIONS[number]["id"];

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 3 — TEST CASES
// ════════════════════════════════════════════════════════════════════════════

const TEST_CASES = [
  { id: "ex1", label: "Ex 1",    hour: 12, minutes: 30, expected: 165,  description: "12:30 — classic large angle" },
  { id: "ex2", label: "Ex 2",    hour: 3,  minutes: 30, expected: 75,   description: "3:30 — hands on opposite sides" },
  { id: "ex3", label: "Ex 3",    hour: 3,  minutes: 15, expected: 7.5,  description: "3:15 — fractional result" },
  { id: "ex4", label: "12:00",   hour: 12, minutes: 0,  expected: 0,    description: "Both hands at top — angle = 0" },
  { id: "ex5", label: "6:00",    hour: 6,  minutes: 0,  expected: 180,  description: "Straight line — max angle 180°" },
  { id: "ex6", label: "9:00",    hour: 9,  minutes: 0,  expected: 90,   description: "Right angle" },
  { id: "custom", label: "Custom", hour: 12, minutes: 30, expected: 165, description: "Enter your own input" },
] as const;

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 4 — CODE SNIPPETS
// ════════════════════════════════════════════════════════════════════════════

const FORMULA_CODE: string[] = [
  "double angleClock(int hour, int minutes) {",
  "    // minute hand: 6° per minute",
  "    double minute_angle = 6.0 * minutes;",
  "",
  "    // hour hand: 30° per hour + 0.5° per minute",
  "    double hour_angle = 30.0 * (hour % 12) + 0.5 * minutes;",
  "",
  "    // absolute difference",
  "    double diff = abs(hour_angle - minute_angle);",
  "",
  "    // return the smaller angle",
  "    return min(diff, 360.0 - diff);",
  "}",
];

const STEP_CODE: string[] = [
  "// Same formula, broken into named constants",
  "double angleClock(int hour, int minutes) {",
  "    const double DEG_PER_MIN_HAND  = 360.0 / 60;   // 6°",
  "    const double DEG_PER_HOUR_TICK = 360.0 / 12;   // 30°",
  "    const double DEG_PER_MIN_ON_HOUR = 0.5;         // 30°/60",
  "",
  "    double m_angle = DEG_PER_MIN_HAND * minutes;",
  "    double h_angle = DEG_PER_HOUR_TICK * (hour % 12)",
  "                   + DEG_PER_MIN_ON_HOUR * minutes;",
  "",
  "    double diff = abs(h_angle - m_angle);",
  "    return min(diff, 360.0 - diff);",
  "}",
];

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 5 — STEP TYPE
// ════════════════════════════════════════════════════════════════════════════

type Phase =
  | "init"
  | "minute_angle"
  | "hour_angle"
  | "raw_diff"
  | "final_answer"
  | "done";

interface Step {
  phase:   Phase;
  message: string;

  // template compat
  l: number | null;
  r: number | null;
  picks: { l: number; r: number; value: number }[];
  total: number;

  // clock state revealed progressively
  showMinuteHand: boolean;
  showHourHand:   boolean;
  showArc:        boolean;
  showComplement: boolean;

  minuteAngle:   number;
  hourAngle:     number;
  rawDiff:       number;
  answer:        number | null;

  // which formula line to highlight
  highlightLine: number | null;
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 6 — SIMULATION FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

function makeStep(partial: Partial<Step> & Pick<Step, "phase" | "message">): Step {
  return {
    l: null, r: null, picks: [], total: 0,
    showMinuteHand: false, showHourHand: false,
    showArc: false, showComplement: false,
    minuteAngle: 0, hourAngle: 0, rawDiff: 0,
    answer: null, highlightLine: null,
    ...partial,
  };
}

function buildSteps(hour: number, minutes: number): Step[] {
  const steps: Step[] = [];

  const minuteAngle = 6 * minutes;
  const hourAngle   = 30 * (hour % 12) + 0.5 * minutes;
  const rawDiff     = Math.abs(hourAngle - minuteAngle);
  const answer      = Math.min(rawDiff, 360 - rawDiff);

  steps.push(makeStep({
    phase: "init",
    message: `Input: ${hour}:${String(minutes).padStart(2,"0")}. We'll compute each hand's angle from 12 o'clock (clockwise).`,
    highlightLine: 0,
  }));

  steps.push(makeStep({
    phase: "minute_angle",
    message: `Minute hand: 360° ÷ 60 = 6° per minute. ${minutes} min × 6° = ${minuteAngle}°.`,
    showMinuteHand: true,
    minuteAngle, hourAngle, rawDiff,
    highlightLine: 2,
  }));

  steps.push(makeStep({
    phase: "hour_angle",
    message: `Hour hand: 30° per hour + 0.5° per minute. ${hour % 12} × 30° + ${minutes} × 0.5° = ${hourAngle}°.`,
    showMinuteHand: true, showHourHand: true,
    minuteAngle, hourAngle, rawDiff,
    highlightLine: 5,
  }));

  steps.push(makeStep({
    phase: "raw_diff",
    message: `Raw difference: |${hourAngle}° − ${minuteAngle}°| = ${rawDiff}°.`,
    showMinuteHand: true, showHourHand: true, showArc: true,
    minuteAngle, hourAngle, rawDiff,
    highlightLine: 8,
  }));

  const takesComplement = rawDiff > 180;
  steps.push(makeStep({
    phase: "final_answer",
    message: rawDiff <= 180
      ? `${rawDiff}° ≤ 180°, so the smaller angle is already ${answer}°.`
      : `${rawDiff}° > 180°, take complement: 360° − ${rawDiff}° = ${answer}°.`,
    showMinuteHand: true, showHourHand: true,
    showArc: !takesComplement, showComplement: takesComplement,
    minuteAngle, hourAngle, rawDiff, answer,
    highlightLine: 11,
  }));

  steps.push(makeStep({
    phase: "done",
    message: `Answer: ${answer}°`,
    showMinuteHand: true, showHourHand: true,
    showArc: !takesComplement, showComplement: takesComplement,
    minuteAngle, hourAngle, rawDiff, answer,
    highlightLine: 11,
  }));

  return steps;
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 7 — COMPLEXITY INFO
// ════════════════════════════════════════════════════════════════════════════

const COMPLEXITY: Record<SolutionId, { time: string; space: string; note: string }> = {
  formula: {
    time:  "O(1)",
    space: "O(1)",
    note:  "Three arithmetic operations. No loops, no data structures.",
  },
  step: {
    time:  "O(1)",
    space: "O(1)",
    note:  "Same O(1) formula with named constants for readability.",
  },
};

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 8 — PHASE DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

const PHASE_META: Record<Phase, { color: string; borderColor: string; bgColor: string; icon: string }> = {
  init:          { color: "text-slate-500",   borderColor: "border-l-slate-400",   bgColor: "bg-slate-100",   icon: "→" },
  minute_angle:  { color: "text-blue-700",    borderColor: "border-l-blue-500",    bgColor: "bg-blue-50",     icon: "M" },
  hour_angle:    { color: "text-amber-700",   borderColor: "border-l-amber-500",   bgColor: "bg-amber-50",    icon: "H" },
  raw_diff:      { color: "text-violet-700",  borderColor: "border-l-violet-500",  bgColor: "bg-violet-50",   icon: "Δ" },
  final_answer:  { color: "text-emerald-700", borderColor: "border-l-emerald-500", bgColor: "bg-emerald-50",  icon: "✓" },
  done:          { color: "text-emerald-800", borderColor: "border-l-emerald-600", bgColor: "bg-emerald-100", icon: "■" },
};

const PHASES_BY_SOLUTION: Record<SolutionId, Phase[]> = {
  formula: ["init", "minute_angle", "hour_angle", "raw_diff", "final_answer", "done"],
  step:    ["init", "minute_angle", "hour_angle", "raw_diff", "final_answer", "done"],
};

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 9 — REUSABLE UI COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

function CodePanel({ solution }: { solution: SolutionId }) {
  const lines    = solution === "formula" ? FORMULA_CODE : STEP_CODE;
  const filename = solution === "formula" ? "formula.cpp" : "step_by_step.cpp";
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
                <td className="select-none w-8 text-right pr-3 pl-2 py-0.5 text-slate-500 border-r border-slate-800">{i + 1}</td>
                <td className="pl-3 py-0.5 whitespace-pre">{line || " "}</td>
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
      {visible.map((s, i) => {
        const meta = PHASE_META[s.phase];
        return (
          <div key={i} className={`flex items-start gap-2 px-2 py-1.5 rounded-r border-l-2 text-xs
            transition-all duration-200 ${meta.borderColor} ${meta.bgColor}
            ${i === currentIndex ? "opacity-100" : "opacity-60"}`}>
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

// ── SVG Clock face ────────────────────────────────────────────────────────

function polarToXY(angleDeg: number, r: number, cx: number, cy: number) {
  // 0° = 12 o'clock, clockwise
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/**
 * Draws a filled pie-slice arc.
 * sweepDeg is always positive and is the actual angular size we want to fill.
 * direction: 1 = clockwise from startDeg, -1 = counter-clockwise from startDeg.
 */
function describeArc(
  cx: number, cy: number, r: number,
  startDeg: number, sweepDeg: number,
  clockwise: boolean = true,
): string {
  const endDeg = clockwise ? startDeg + sweepDeg : startDeg - sweepDeg;
  const s = polarToXY(startDeg, r, cx, cy);
  const e = polarToXY(endDeg,   r, cx, cy);
  const largeArc = sweepDeg > 180 ? 1 : 0;
  const sweepFlag = clockwise ? 1 : 0;
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} ${sweepFlag} ${e.x} ${e.y} Z`;
}

function ClockFace({ step, hour, minutes }: { step: Step; hour: number; minutes: number }) {
  const CX = 150, CY = 150, R = 120;
  const ticks = Array.from({ length: 60 }, (_, i) => i);
  const hourLabels = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  const mAngle = step.minuteAngle;
  const hAngle = step.hourAngle;

  // Compute BOTH possible clockwise sweeps between the two hands:
  //   cwSweep  = going clockwise from hAngle to mAngle
  //   ccwSweep = going counter-clockwise from hAngle to mAngle (= 360 - cwSweep)
  let cwSweep = mAngle - hAngle;
  if (cwSweep < 0) cwSweep += 360;
  const ccwSweep = 360 - cwSweep;

  // The SMALLER sweep is the one we highlight as the answer.
  const smallerSweep   = Math.min(cwSweep, ccwSweep);
  const largerSweep    = 360 - smallerSweep;
  // The smaller arc goes clockwise only if cwSweep is the small one.
  const smallerIsCW    = cwSweep <= ccwSweep;

  // Label positions — midpoint angle of each arc
  const smallMidAngle = smallerIsCW
    ? hAngle + smallerSweep / 2
    : hAngle - smallerSweep / 2;
  const largeMidAngle = smallerIsCW
    ? hAngle - largerSweep / 2
    : hAngle + largerSweep / 2;

  const labelR = R * 0.52;
  const smallLabelPos = polarToXY(smallMidAngle, labelR, CX, CY);
  const largeLabelPos = polarToXY(largeMidAngle, labelR, CX, CY);

  const minuteEnd = polarToXY(mAngle, R * 0.88, CX, CY);
  const hourEnd   = polarToXY(hAngle, R * 0.65, CX, CY);

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-xs mx-auto">
      {/* Clock background */}
      <circle cx={CX} cy={CY} r={R} fill="white" stroke="#e2e8f0" strokeWidth="2" />
      <circle cx={CX} cy={CY} r={R - 2} fill="white" stroke="#f1f5f9" strokeWidth="1" />

      {/* Tick marks */}
      {ticks.map(i => {
        const a = i * 6;
        const isMajor = i % 5 === 0;
        const inner = polarToXY(a, isMajor ? R - 14 : R - 9, CX, CY);
        const outer = polarToXY(a, R - 3, CX, CY);
        return (
          <line key={i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
            stroke={isMajor ? "#94a3b8" : "#e2e8f0"}
            strokeWidth={isMajor ? 2 : 1} />
        );
      })}

      {/* Hour numbers */}
      {hourLabels.map((label, i) => {
        const pos = polarToXY(i * 30, R - 28, CX, CY);
        return (
          <text key={label} x={pos.x} y={pos.y}
            textAnchor="middle" dominantBaseline="central"
            fontSize="11" fontWeight="600" fill="#475569" fontFamily="system-ui">
            {label}
          </text>
        );
      })}

      {/* ── showArc: rawDiff ≤ 180 — just draw the smaller arc ── */}
      {step.showArc && (
        <>
          <path
            d={describeArc(CX, CY, R * 0.42, hAngle, smallerSweep, smallerIsCW)}
            fill="rgba(139,92,246,0.18)"
            stroke="#8b5cf6"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {step.answer !== null && (
            <text x={smallLabelPos.x} y={smallLabelPos.y}
              textAnchor="middle" dominantBaseline="central"
              fontSize="10" fontWeight="700" fill="#7c3aed" fontFamily="monospace">
              {step.answer}°
            </text>
          )}
        </>
      )}

      {/* ── showComplement: rawDiff > 180 — show big (dashed red) + small (violet) ── */}
      {step.showComplement && (
        <>
          {/* Large arc — NOT the answer, shown dashed red */}
          <path
            d={describeArc(CX, CY, R * 0.42, hAngle, largerSweep, !smallerIsCW)}
            fill="rgba(239,68,68,0.08)"
            stroke="#ef4444"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
          {/* Small arc — THE answer, shown solid violet */}
          <path
            d={describeArc(CX, CY, R * 0.42, hAngle, smallerSweep, smallerIsCW)}
            fill="rgba(139,92,246,0.2)"
            stroke="#8b5cf6"
            strokeWidth="1.5"
          />
          {/* Label on the large (raw diff) arc */}
          <text x={largeLabelPos.x} y={largeLabelPos.y}
            textAnchor="middle" dominantBaseline="central"
            fontSize="10" fontWeight="700" fill="#ef4444" fontFamily="monospace">
            {step.rawDiff}°
          </text>
          {/* Label on the small (answer) arc */}
          {step.answer !== null && (
            <text x={smallLabelPos.x} y={smallLabelPos.y}
              textAnchor="middle" dominantBaseline="central"
              fontSize="10" fontWeight="700" fill="#7c3aed" fontFamily="monospace">
              {step.answer}°
            </text>
          )}
        </>
      )}

      {/* Minute hand */}
      {step.showMinuteHand && (
        <>
          <line x1={CX} y1={CY}
            x2={minuteEnd.x} y2={minuteEnd.y}
            stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
          {/* angle label near tip */}
          <text
            x={polarToXY(mAngle, R * 0.96, CX, CY).x}
            y={polarToXY(mAngle, R * 0.96, CX, CY).y}
            textAnchor="middle" dominantBaseline="central"
            fontSize="9" fill="#2563eb" fontWeight="700" fontFamily="monospace">
            {mAngle}°
          </text>
        </>
      )}

      {/* Hour hand */}
      {step.showHourHand && (
        <>
          <line x1={CX} y1={CY}
            x2={hourEnd.x} y2={hourEnd.y}
            stroke="#d97706" strokeWidth="4.5" strokeLinecap="round" />
          <text
            x={polarToXY(hAngle, R * 0.76, CX, CY).x}
            y={polarToXY(hAngle, R * 0.76, CX, CY).y}
            textAnchor="middle" dominantBaseline="central"
            fontSize="9" fill="#d97706" fontWeight="700" fontFamily="monospace">
            {hAngle}°
          </text>
        </>
      )}

      {/* 12 o'clock reference dot */}
      {(step.showMinuteHand || step.showHourHand) && (
        <>
          <line x1={CX} y1={CY} x2={CX} y2={CY - R * 0.25}
            stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 2" />
          <text x={CX} y={CY - R * 0.28}
            textAnchor="middle" dominantBaseline="central"
            fontSize="8" fill="#94a3b8" fontFamily="monospace">0°</text>
        </>
      )}

      {/* Center dot */}
      <circle cx={CX} cy={CY} r={5} fill="#334155" />
      <circle cx={CX} cy={CY} r={2.5} fill="white" />
    </svg>
  );
}

// ── Formula breakdown table ───────────────────────────────────────────────
function FormulaPanel({ step, hour, minutes }: { step: Step; hour: number; minutes: number }) {
  const rows: { label: string; formula: string; value: string; active: boolean; color: string }[] = [
    {
      label:   "Minute hand angle",
      formula: `6° × ${minutes}`,
      value:   `${step.minuteAngle}°`,
      active:  step.phase === "minute_angle",
      color:   "text-blue-700",
    },
    {
      label:   "Hour hand angle",
      formula: `30° × ${hour % 12} + 0.5° × ${minutes}`,
      value:   `${step.hourAngle}°`,
      active:  step.phase === "hour_angle",
      color:   "text-amber-700",
    },
    {
      label:   "Raw difference",
      formula: `|${step.hourAngle}° − ${step.minuteAngle}°|`,
      value:   `${step.rawDiff}°`,
      active:  step.phase === "raw_diff",
      color:   "text-violet-700",
    },
    {
      label:   "Final answer",
      formula: `min(${step.rawDiff}°, ${360 - step.rawDiff}°)`,
      value:   step.answer !== null ? `${step.answer}°` : "—",
      active:  step.phase === "final_answer" || step.phase === "done",
      color:   "text-emerald-700",
    },
  ];

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
      <p className="text-xs text-slate-500 font-medium mb-3">Formula breakdown</p>
      <div className="flex flex-col divide-y divide-slate-50">
        {rows.map(row => (
          <div key={row.label}
            className={`flex items-center justify-between py-2.5 transition-all duration-200 rounded px-2
              ${row.active ? "bg-slate-50" : ""}`}>
            <div>
              <p className={`text-xs font-semibold ${row.active ? row.color : "text-slate-400"}`}>
                {row.label}
              </p>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">{row.formula}</p>
            </div>
            <div className={`text-lg font-bold font-mono transition-all
              ${row.active ? row.color : "text-slate-300"}`}>
              {row.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Interactive clock slider ──────────────────────────────────────────────
function ClockSlider({
  hour, minutes, onHourChange, onMinutesChange,
}: {
  hour: number; minutes: number;
  onHourChange: (h: number) => void;
  onMinutesChange: (m: number) => void;
}) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-4">
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Live clock controls</p>
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-[10px] text-slate-400 uppercase tracking-wide">Hour</label>
          <span className="text-sm font-mono font-bold text-amber-700">{hour}</span>
        </div>
        <input type="range" min={1} max={12} value={hour}
          onChange={e => onHourChange(Number(e.target.value))}
          className="w-full accent-amber-500" />
        <div className="flex justify-between text-[9px] text-slate-300 mt-0.5">
          <span>1</span><span>12</span>
        </div>
      </div>
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-[10px] text-slate-400 uppercase tracking-wide">Minutes</label>
          <span className="text-sm font-mono font-bold text-blue-700">{String(minutes).padStart(2,"0")}</span>
        </div>
        <input type="range" min={0} max={59} value={minutes}
          onChange={e => onMinutesChange(Number(e.target.value))}
          className="w-full accent-blue-500" />
        <div className="flex justify-between text-[9px] text-slate-300 mt-0.5">
          <span>0</span><span>59</span>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 11 — MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function AlgoVizTemplate() {
  const [activeSolution, setActiveSolution] = useState<SolutionId>("formula");
  const [activeTestCase, setActiveTestCase]  = useState<string>("ex1");

  const [hour,    setHour]    = useState(12);
  const [minutes, setMinutes] = useState(30);

  const [steps, setSteps]                       = useState<Step[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [playing, setPlaying]                   = useState(false);
  const [speed,   setSpeed]                     = useState(900);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentStep = steps[currentStepIndex] ?? steps[0];

  const rebuild = useCallback(() => {
    const s = buildSteps(hour, minutes);
    setSteps(s);
    setCurrentStepIndex(0);
    setPlaying(false);
  }, [hour, minutes]);

  useEffect(() => { rebuild(); }, [rebuild]);

  useEffect(() => {
    if (!playing) { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setCurrentStepIndex(prev => prev >= steps.length - 1 ? prev : prev + 1);
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
          <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg">
            <Clock size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-none">{PROBLEM_TITLE}</h1>
            <p className="text-slate-500 text-xs mt-1 italic">{PROBLEM_SUBTITLE}</p>
          </div>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded border border-blue-300 text-blue-700 bg-blue-50">
          {PROBLEM_BADGE}
        </span>
      </header>

      {/* Solution tabs */}
      <div className="flex gap-2 mb-4 shrink-0 bg-slate-200/50 p-1 rounded-xl w-fit">
        {SOLUTIONS.map(sol => (
          <button key={sol.id} onClick={() => setActiveSolution(sol.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2
              ${activeSolution === sol.id ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
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
          <div className="flex gap-2 flex-wrap">
            {phases.map(p => (
              <div key={p}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all
                  ${currentStep.phase === p
                    ? "bg-blue-600 border-blue-600 text-white shadow-md"
                    : "bg-white border-slate-200 text-slate-400"}`}>
                {PHASE_META[p].icon} {p.replace(/_/g, " ")}
              </div>
            ))}
          </div>

          {/* ── THE CLOCK — the main visualization ── */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-500 font-medium">
                Clock — {hour}:{String(minutes).padStart(2, "0")}
              </p>
              <div className="flex gap-3 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="w-4 h-1 rounded bg-blue-500 inline-block" />
                  Minute hand
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-1.5 rounded bg-amber-500 inline-block" />
                  Hour hand
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-violet-100 border border-violet-400 inline-block" />
                  Angle arc
                </span>
              </div>
            </div>
            <ClockFace step={currentStep} hour={hour} minutes={minutes} />

            {/* Answer callout */}
            {currentStep.answer !== null && (
              <div className="mt-3 flex justify-center">
                <div className="inline-flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3">
                  <span className="text-xs text-emerald-700 font-medium">Smaller angle</span>
                  <span className="text-2xl font-bold font-mono text-emerald-700">{currentStep.answer}°</span>
                </div>
              </div>
            )}
          </div>

          {/* Formula breakdown */}
          <FormulaPanel step={currentStep} hour={hour} minutes={minutes} />

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

          {/* Test cases */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-3">
            <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-medium">Test Cases</p>
            <div className="flex flex-wrap gap-2">
              {TEST_CASES.map(tc => (
                <button key={tc.id}
                  onClick={() => {
                    setActiveTestCase(tc.id);
                    if (tc.id !== "custom") { setHour(tc.hour); setMinutes(tc.minutes); }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                    ${activeTestCase === tc.id ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                  {tc.label}
                </button>
              ))}
            </div>
            {activeTestCase !== "custom" && (() => {
              const tc = TEST_CASES.find(t => t.id === activeTestCase);
              return tc ? (
                <>
                  <p className="text-[10px] text-slate-500 italic">{tc.description}</p>
                  <p className="text-[10px] font-mono text-emerald-700">Expected: {tc.expected}°</p>
                </>
              ) : null;
            })()}
          </div>

          {/* Live sliders */}
          <ClockSlider
            hour={hour} minutes={minutes}
            onHourChange={h => { setHour(h); setActiveTestCase("custom"); }}
            onMinutesChange={m => { setMinutes(m); setActiveTestCase("custom"); }}
          />

          {/* Manual input */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-2">
            <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-medium">Input Configuration</p>
            <div className="flex gap-3">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wide">Hour (1–12)</label>
                <input type="number" min={1} max={12} value={hour}
                  onChange={e => { setHour(Math.min(12, Math.max(1, Number(e.target.value)))); setActiveTestCase("custom"); }}
                  className="font-mono text-xs px-2 py-1.5 rounded border border-slate-200 bg-slate-50 text-slate-900" />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wide">Minutes (0–59)</label>
                <input type="number" min={0} max={59} value={minutes}
                  onChange={e => { setMinutes(Math.min(59, Math.max(0, Number(e.target.value)))); setActiveTestCase("custom"); }}
                  className="font-mono text-xs px-2 py-1.5 rounded border border-slate-200 bg-slate-50 text-slate-900" />
              </div>
            </div>
            <button onClick={rebuild}
              className="mt-1 w-full px-3 py-1.5 rounded border border-slate-300 text-xs text-slate-800 hover:bg-slate-100 transition-colors">
              Rebuild steps
            </button>
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
                  ${playing ? "bg-amber-50 text-amber-800 border-amber-300" : "bg-blue-600 text-white border-blue-600 shadow-md"}`}>
                {playing ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Play</>}
              </button>
              <button onClick={() => setCurrentStepIndex(p => Math.min(steps.length - 1, p + 1))} disabled={currentStepIndex >= steps.length - 1}
                className="p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30">
                <StepForward size={16} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Speed</span>
              <input type="range" min={100} max={1500} step={100} value={1600 - speed}
                onChange={e => setSpeed(1600 - Number(e.target.value))}
                className="w-24 accent-blue-600" />
              <span className="text-xs font-mono text-slate-500">{speed}ms</span>
            </div>
            <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-200"
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
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
            <p className="text-xs font-bold text-blue-700 mb-2 uppercase tracking-wide">Key insight</p>
            <p className="text-xs text-blue-600 leading-relaxed">
              The hour hand never sits exactly on a number — it drifts continuously.
              At <strong>3:30</strong> it is halfway between 3 and 4,
              so its angle is <strong>105°</strong>, not 90°.
              The <code className="bg-blue-100 px-1 rounded">0.5 × minutes</code> term captures this drift.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}