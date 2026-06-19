// ════════════════════════════════════════════════════════════════════════════
// simulation/index.ts — Step builders for each solution approach
// ════════════════════════════════════════════════════════════════════════════

import type { Step, Phase } from "../types";

// ── Helper ────────────────────────────────────────────────────────────────

/**
 * Build a typed Step with sensible defaults so you don't repeat every field
 * at every call site.
 */
export function makeStep(
  partial: Partial<Step> & Pick<Step, "phase" | "message">
): Step {
  return {
    l: null,
    r: null,
    picks: [],
    total: 0,
    ...partial,
  };
}

// ── Naive simulation ──────────────────────────────────────────────────────

/**
 * Push Step objects into an array as you walk through the naive algorithm.
 * The visualizer replays them one by one.
 */
export function buildNaiveSteps(nums: number[], k: number): Step[] {
  const steps: Step[] = [];

  steps.push(makeStep({
    phase: "init",
    message: "Initialize: describe what the naive approach will do.",
  }));

  // ── TODO: add your naive algorithm logic here, emitting steps ──────────
  //
  // Example pattern:
  //   for (let l = 0; l < nums.length; l++) {
  //     for (let r = l; r < nums.length; r++) {
  //       const value = /* compute something */;
  //       steps.push(makeStep({
  //         phase: "process",
  //         message: `Processing [${l}, ${r}]: value = ${value}.`,
  //         l, r,
  //       }));
  //     }
  //   }

  steps.push(makeStep({
    phase: "done",
    message: "Done! Result = 0.", // replace with real result
  }));

  return steps;
}

// ── Optimized simulation ──────────────────────────────────────────────────

/**
 * Same shape as above, but for your better approach.
 */
export function buildOptimizedSteps(nums: number[], k: number): Step[] {
  const steps: Step[] = [];

  steps.push(makeStep({
    phase: "init",
    message: "Initialize: describe what the optimized approach will do.",
  }));

  // ── TODO: add your optimized algorithm logic here ───────────────────────

  steps.push(makeStep({
    phase: "done",
    message: "Done! Result = 0.",
  }));

  return steps;
}
