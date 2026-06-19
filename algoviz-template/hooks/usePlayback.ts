"use client";

// ════════════════════════════════════════════════════════════════════════════
// hooks/usePlayback.ts — Animation playback state and controls
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from "react";
import type { Step } from "../types";

interface UsePlaybackReturn {
  currentStepIndex: number;
  setCurrentStepIndex: React.Dispatch<React.SetStateAction<number>>;
  playing: boolean;
  setPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  speed: number;
  setSpeed: React.Dispatch<React.SetStateAction<number>>;
}

export function usePlayback(steps: Step[]): UsePlaybackReturn {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(700);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Advance one step per interval tick while playing
  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= steps.length - 1) return prev;
        return prev + 1;
      });
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, speed, steps.length]);

  // Auto-stop at end
  useEffect(() => {
    if (playing && currentStepIndex >= steps.length - 1) {
      setPlaying(false);
    }
  }, [currentStepIndex, steps.length, playing]);

  return {
    currentStepIndex,
    setCurrentStepIndex,
    playing,
    setPlaying,
    speed,
    setSpeed,
  };
}
