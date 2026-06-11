"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Grid2X2,
  Play,
  Pause,
  RotateCcw,
  StepForward,
  ChevronRight,
} from "lucide-react";

type Phase = "setup" | "transpose" | "reverse" | "final";

type AnimationStep = {
  phase: Phase;
  matrix: number[][];
  stepIndex: number;
  totalSteps: number;
  highlightCells: [number, number][];
  description: string;
  subDescription?: string;
};

const defaultMatrix: number[][] = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

export default function RotateImageProblem() {
  const [matrix, setMatrix] = useState<number[][]>(defaultMatrix);
  const [isEditing, setIsEditing] = useState(false);

  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(700);

  const steps = useMemo(
    () => generateRotateSteps(matrix),
    [matrix]
  );

  const current = steps[step] || steps[0];

  // playback
  useEffect(() => {
  if (!isPlaying) return;
  if (step >= steps.length - 1) return;

  const timer = setTimeout(() => {
    setStep((s) => Math.min(steps.length - 1, s + 1));
  }, speed);

  return () => clearTimeout(timer);
}, [isPlaying, step, steps.length, speed]);

  const handleReset = () => {
    setIsPlaying(false);
    setStep(0);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    try {
      const raw = data.get("matrix") as string;
      const parsed = JSON.parse(raw);
      if (
        !Array.isArray(parsed) ||
        parsed.some(
          (row: unknown) =>
            !Array.isArray(row) ||
            row.some((x: unknown) => typeof x !== "number")
        )
      ) {
        throw new Error();
      }
      // simple square check
      const n = parsed.length;
      if (!parsed.every((row: number[]) => row.length === n)) {
        alert("Matrix must be square (n x n).");
        return;
      }
      setMatrix(parsed);
      setStep(0);
      setIsPlaying(false);
      setIsEditing(false);
    } catch {
      alert("Invalid JSON matrix. Example: [[1,2,3],[4,5,6],[7,8,9]]");
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Header / hero */}
      <section className="border-b border-slate-800 bg-linear-to-b from-slate-950 via-slate-950 to-slate-900/60">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
          <header className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600/90">
              <Grid2X2 className="h-4 w-4 text-white" />
            </div>
            <span className="uppercase tracking-[0.2em]">
              Rotate Image · Matrix
            </span>
          </header>

          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex-1 space-y-4">
              <h1 className="text-3xl sm:text-4xl font-semibold leading-tight text-slate-50">
                Rotate a matrix 90° clockwise
                <span className="block text-blue-400 text-lg sm:text-xl mt-1">
                  See transpose + reverse happen cell by cell.
                </span>
              </h1>
              <p className="max-w-2xl text-sm sm:text-base text-slate-300">
                This visualizer shows the classic in‑place solution: first
                transpose the matrix, then reverse each row. Watch each swap
                and row reversal, and track exactly how the original matrix
                transforms into the rotated one.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setIsPlaying(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition"
                >
                  <Play className="h-4 w-4" />
                  Play Animation
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-900 transition"
                >
                  Edit Matrix
                </button>
              </div>
            </div>

            {/* Small preview card */}
            <div className="mt-6 flex-1 md:mt-0">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl shadow-black/40">
                <div className="flex items-center justify-between mb-2 text-xs text-slate-400">
                  <span className="font-mono tracking-tight">
                    Demo: 3 × 3 matrix
                  </span>
                  <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-blue-300">
                    O(n²) time · O(1) space
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-center text-sm">
                  {defaultMatrix.flat().map((v, idx) => (
                    <div
                      key={idx}
                      className="rounded-md border border-slate-700 bg-slate-900/80 py-2 text-slate-50"
                    >
                      {v}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                  <ChevronRight className="h-3 w-3 text-blue-400" />
                  <span>
                    Animation shows transpose swaps, then row reversals, then
                    final rotated matrix.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Animation + Controls */}
      <section className="mx-auto max-w-5xl px-4 py-10 flex flex-col gap-6 lg:flex-row">
        {/* Left: animation */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Phase indicators */}
          <div className="flex gap-2">
            {["setup", "transpose", "reverse", "final"].map((p) => (
              <div
                key={p}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  current.phase === p
                    ? "bg-blue-600 border-blue-600 text-white shadow-md"
                    : "bg-slate-900 border-slate-700 text-slate-400"
                }`}
              >
                {p.toUpperCase()} Phase
              </div>
            ))}
          </div>

          {/* Matrix card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-4 text-xs text-slate-400">
              <span className="font-mono">
                Matrix size: {matrix.length} × {matrix.length}
              </span>
              <span>
                Step {current.stepIndex + 1} / {current.totalSteps}
              </span>
            </div>

            <div className="inline-block bg-slate-950 border border-slate-800 rounded-xl p-4">
              <MatrixView
                matrix={current.matrix}
                highlightCells={current.highlightCells}
              />
            </div>

            <div className="mt-4 rounded-lg bg-slate-950/80 border border-slate-800 p-3 text-[13px] text-slate-200 font-mono">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 opacity-70 mt-0.5">#</span>
                <div>
                  <p>{current.description}</p>
                  {current.subDescription && (
                    <p className="mt-1 text-slate-400 text-[12px]">
                      {current.subDescription}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: controls / info */}
        <div className="w-full lg:w-72 flex flex-col gap-4">
          {/* Playback controls */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handleReset}
                className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400"
              >
                <RotateCcw size={18} />
              </button>
              <button
                onClick={() => setIsPlaying((p) => !p)}
                className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${
                  isPlaying
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-600 text-white shadow-lg shadow-blue-600/40"
                }`}
              >
                {isPlaying ? (
                  <Pause size={22} />
                ) : (
                  <Play size={22} className="ml-0.5" />
                )}
              </button>
              <button
                onClick={() =>
                  setStep((s) => Math.min(steps.length - 1, s + 1))
                }
                className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400"
              >
                <StepForward size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-2">
                  <span>Speed</span>
                  <span>{speed}ms</span>
                </div>
                <input
                  type="range"
                  min={150}
                  max={2000}
                  step={100}
                  value={speed}
                  onChange={(e) =>
                    setSpeed(parseInt(e.target.value, 10))
                  }
                  className="w-full accent-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-2">
                  <span>Progress</span>
                  <span>
                    {step + 1}/{steps.length}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{
                      width: `${((step + 1) / steps.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Summary card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 text-sm text-slate-300 space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">
              Key idea
            </h3>
            <p>
              1) Transpose across the main diagonal. 2) Reverse every row. That
              combination is exactly a 90° clockwise rotation.
            </p>
            <p className="text-xs text-slate-500">
              A common interview question: implement this in‑place, without
              extra matrices.
            </p>
          </div>
        </div>
      </section>

      {/* Edit modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-50 mb-3">
              Edit matrix
            </h2>
            <p className="text-xs text-slate-400 mb-3">
              Provide a square matrix in JSON format. Example:{" "}
              <span className="font-mono text-[11px]">
                [[1,2,3],[4,5,6],[7,8,9]]
              </span>
            </p>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <textarea
                name="matrix"
                defaultValue={JSON.stringify(matrix)}
                rows={4}
                className="w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-sm font-mono text-slate-100"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

/**
 * Generates a list of animation steps for rotating matrix 90° clockwise
 * using: transpose + reverse each row.
 */
function generateRotateSteps(matrix: number[][]): AnimationStep[] {
  const n = matrix.length;
  const steps: AnimationStep[] = [];

  const clone = (m: number[][]) => m.map((row) => [...row]);

  const current = clone(matrix);

  const pushStep = (phase: Phase, extra: Partial<AnimationStep>) => {
    steps.push({
      phase,
      matrix: clone(current),
      stepIndex: steps.length,
      totalSteps: 0, // fill later
      highlightCells: [],
      description: "",
      ...extra,
    });
  };

  // Setup step
  pushStep("setup", {
    description:
      "Initial matrix. Goal: rotate 90° clockwise using transpose + reverse.",
  });

  // Transpose phase: swap (i, j) with (j, i) for j > i
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      // Highlight before swap
      pushStep("transpose", {
        highlightCells: [
          [i, j],
          [j, i],
        ],
        description: `Transpose step: prepare to swap cell (${i}, ${j}) with (${j}, ${i}).`,
        subDescription: "We are mirroring across the main diagonal.",
      });

      // Swap
      const tmp = current[i][j];
      current[i][j] = current[j][i];
      current[j][i] = tmp;

      pushStep("transpose", {
        highlightCells: [
          [i, j],
          [j, i],
        ],
        description: `Swapped (${i}, ${j}) with (${j}, ${i}).`,
        subDescription:
          "As we finish all such swaps, rows and columns will be interchanged.",
      });
    }
  }

  // After full transpose
  pushStep("transpose", {
    description:
      "Transpose complete. Each element at (r, c) has moved to (c, r). Next: reverse each row.",
  });

  // Reverse each row phase
  for (let r = 0; r < n; r++) {
    let left = 0;
    let right = n - 1;
    while (left < right) {
      pushStep("reverse", {
        highlightCells: [
          [r, left],
          [r, right],
        ],
        description: `Row ${r}: prepare to swap (${r}, ${left}) with (${r}, ${right}).`,
        subDescription: "Row reversal is like mirroring horizontally.",
      });
      const tmp = current[r][left];
      current[r][left] = current[r][right];
      current[r][right] = tmp;

      pushStep("reverse", {
        highlightCells: [
          [r, left],
          [r, right],
        ],
        description: `Row ${r}: swapped (${r}, ${left}) with (${r}, ${right}).`,
      });

      left++;
      right--;
    }
  }

  // Final state
  pushStep("final", {
    description:
      "Final rotated matrix. The original has been rotated 90° clockwise in place.",
  });

  // Fill totalSteps
  const total = steps.length;
  return steps.map((s, idx) => ({
    ...s,
    stepIndex: idx,
    totalSteps: total,
  }));
}

/**
 * Simple matrix view with highlighted cells.
 */
function MatrixView({
  matrix,
  highlightCells,
}: {
  matrix: number[][];
  highlightCells: [number, number][];
}) {
  const highlightSet = new Set(
    highlightCells.map(([r, c]) => `${r},${c}`)
  );

  return (
    <div
      className="grid gap-1"
      style={{
        gridTemplateColumns: `repeat(${matrix.length}, minmax(0, 1fr))`,
      }}
    >
      {matrix.map((row, r) =>
        row.map((val, c) => {
          const key = `${r},${c}`;
          const isHighlight = highlightSet.has(key);
          return (
            <div
              key={key}
              className={[
                "flex items-center justify-center px-4 py-3 rounded-md border text-sm font-medium",
                isHighlight
                  ? "border-blue-400 bg-blue-500/20 text-blue-100 shadow-inner shadow-blue-700/40"
                  : "border-slate-700 bg-slate-900 text-slate-100",
              ].join(" ")}
            >
              {val}
            </div>
          );
        })
      )}
    </div>
  );
}