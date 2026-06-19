"use client";

// ════════════════════════════════════════════════════════════════════════════
// components/PlaybackControls.tsx — Play / pause / step / speed controls
// ════════════════════════════════════════════════════════════════════════════

import { Play, Pause, RotateCcw, StepForward } from "lucide-react";
import type { Step } from "../types";

interface PlaybackControlsProps {
  steps: Step[];
  currentStepIndex: number;
  setCurrentStepIndex: React.Dispatch<React.SetStateAction<number>>;
  playing: boolean;
  setPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  speed: number;
  setSpeed: React.Dispatch<React.SetStateAction<number>>;
}

export function PlaybackControls({
  steps,
  currentStepIndex,
  setCurrentStepIndex,
  playing,
  setPlaying,
  speed,
  setSpeed,
}: PlaybackControlsProps) {
  const atStart = currentStepIndex === 0;
  const atEnd   = currentStepIndex >= steps.length - 1;

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
      <p className="text-xs text-slate-500 font-medium mb-2">Animation Controls</p>

      <div className="flex items-center gap-3 flex-wrap mb-2">
        {/* Reset */}
        <button
          onClick={() => setCurrentStepIndex(0)}
          disabled={atStart}
          className="p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
        >
          <RotateCcw size={16} />
        </button>

        {/* Step back */}
        <button
          onClick={() => setCurrentStepIndex((p) => Math.max(0, p - 1))}
          disabled={atStart}
          className="p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
        >
          ←
        </button>

        {/* Play / Pause */}
        <button
          onClick={() => setPlaying((p) => !p)}
          disabled={atEnd}
          className={`px-4 py-1.5 text-xs rounded-full border font-medium flex items-center gap-1 ${
            playing
              ? "bg-amber-50 text-amber-800 border-amber-300"
              : "bg-blue-600 text-white border-blue-600 shadow-md"
          }`}
        >
          {playing ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Play</>}
        </button>

        {/* Step forward */}
        <button
          onClick={() => setCurrentStepIndex((p) => Math.min(steps.length - 1, p + 1))}
          disabled={atEnd}
          className="p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
        >
          <StepForward size={16} />
        </button>
      </div>

      {/* Speed slider */}
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

      {/* Progress bar */}
      <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-200"
          style={{
            width: steps.length
              ? `${((currentStepIndex + 1) / steps.length) * 100}%`
              : "0%",
          }}
        />
      </div>
      <span className="mt-1 block text-right text-xs text-slate-500 font-mono">
        {steps.length ? `${currentStepIndex + 1}/${steps.length}` : "0/0"}
      </span>
    </div>
  );
}
