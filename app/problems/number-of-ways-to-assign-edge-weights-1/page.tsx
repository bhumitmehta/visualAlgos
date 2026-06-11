'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Play, Pause, RotateCcw, StepForward, StepBack,
  Settings2, AlertTriangle, Terminal, GitBranch,
  CheckCircle2, XCircle, Zap, Binary,
  TreePine, Search, Hash
} from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type Phase =
  | 'init'
  | 'build'
  | 'dfs'
  | 'path'
  | 'parity'
  | 'fastpow'
  | 'done'
  | 'error';

interface StepState {
  phase: Phase;
  message: string;
  isEdgeCase?: boolean;
  edgeCaseNote?: string;

  // tree state
  visitedNodes: number[];
  visitedEdges: [number, number][];
  currentNode?: number;
  depthMap: Record<number, number>;
  maxDepth: number;
  deepestNode?: number;
  highlightedPath: number[];   // final root→deepest path (node ids)

  // parity table
  parityRows: { weights: number[]; sum: number; odd: boolean }[];
  parityRevealCount: number;   // how many rows revealed so far

  // fast power
  fpSteps: { b: number; a: number; res: number; bitUsed: boolean }[];
  fpRevealCount: number;

  // answer
  answer?: number;
}

interface TestCase {
  label: string;
  description: string;
  isEdgeCase?: boolean;
  edges: [number, number][];
  k?: number;
}

// ════════════════════════════════════════════════════════════════════════════
// TEST CASES
// ════════════════════════════════════════════════════════════════════════════

const TEST_CASES: TestCase[] = [
  {
    label: 'Example 1',
    description: 'd=1 → answer=1. Only one odd assignment: weight=1.',
    edges: [[1, 2]],
  },
  {
    label: 'Linear Chain',
    description: 'd=3 → answer=4. Easy to see parity split.',
    edges: [[1, 2], [2, 3], [3, 4]],
  },
  {
    label: 'Balanced Binary',
    description: 'Multiple branches, deepest node at d=2.',
    edges: [[1, 2], [1, 3], [2, 4], [2, 5]],
  },
  {
    label: 'Deep Skew',
    description: 'd=4 → answer=8. Parity table has 16 rows.',
    isEdgeCase: true,
    edges: [[1, 2], [2, 3], [3, 4], [4, 5]],
  },
  {
    label: 'Wide Shallow',
    description: 'Edge: d=1 for all leaves, answer=1.',
    isEdgeCase: true,
    edges: [[1, 2], [1, 3], [1, 4], [1, 5]],
  },
  {
    label: 'Star + Deep Branch',
    description: 'Star from 1, but node 2 has deeper child at d=3.',
    edges: [[1, 2], [1, 3], [2, 4], [4, 5]],
  },
  {
    label: 'Single Node',
    description: 'Edge: no edges → answer=0.',
    isEdgeCase: true,
    edges: [],
  },
];

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

const MOD = 1_000_000_007;

function modpow(base: number, exp: number): number {
  let res = 1n;
  let a = BigInt(base) % BigInt(MOD);
  let b = BigInt(exp);
  while (b > 0n) {
    if (b & 1n) res = (res * a) % BigInt(MOD);
    a = (a * a) % BigInt(MOD);
    b >>= 1n;
  }
  return Number(res);
}

function modpowSteps(base: number, exp: number): { b: number; a: number; res: number; bitUsed: boolean }[] {
  const steps: { b: number; a: number; res: number; bitUsed: boolean }[] = [];
  let res = 1;
  let a = base % MOD;
  let b = exp;
  while (b > 0) {
    const bitUsed = (b & 1) === 1;
    steps.push({ b, a, res, bitUsed });
    if (bitUsed) res = (res * a) % MOD;
    a = (a * a) % MOD;
    b >>= 1;
  }
  return steps;
}

function buildAdjList(edges: [number, number][], n: number): number[][] {
  const g: number[][] = Array.from({ length: n + 1 }, () => []);
  for (const [u, v] of edges) {
    g[u].push(v);
    g[v].push(u);
  }
  return g;
}

function computeDepths(g: number[][], root: number, n: number): Record<number, number> {
  const depth: Record<number, number> = {};
  const queue: [number, number][] = [[root, 0]];
  while (queue.length) {
    const [node, d] = queue.shift()!;
    if (depth[node] !== undefined) continue;
    depth[node] = d;
    for (const nb of g[node]) {
      if (depth[nb] === undefined) queue.push([nb, d + 1]);
    }
  }
  return depth;
}

function pathToNode(g: number[][], root: number, target: number): number[] {
  const parent: Record<number, number> = { [root]: -1 };
  const queue = [root];
  while (queue.length) {
    const u = queue.shift()!;
    if (u === target) break;
    for (const v of g[u]) {
      if (parent[v] === undefined) { parent[v] = u; queue.push(v); }
    }
  }
  const path: number[] = [];
  let cur = target;
  while (cur !== -1) { path.unshift(cur); cur = parent[cur] ?? -1; }
  return path;
}

function buildParityTable(d: number): { weights: number[]; sum: number; odd: boolean }[] {
  const cap = Math.min(d, 5); // cap at 2^5 = 32 rows for display
  const rows: { weights: number[]; sum: number; odd: boolean }[] = [];
  const total = 1 << cap;
  for (let mask = 0; mask < total; mask++) {
    const weights: number[] = [];
    let sum = 0;
    for (let bit = cap - 1; bit >= 0; bit--) {
      const w = (mask >> bit) & 1 ? 2 : 1;
      weights.push(w);
      sum += w;
    }
    rows.push({ weights, sum, odd: sum % 2 === 1 });
  }
  return rows;
}

// ════════════════════════════════════════════════════════════════════════════
// STEP GENERATOR
// ════════════════════════════════════════════════════════════════════════════

function generateSteps(edges: [number, number][]): StepState[] {
  const steps: StepState[] = [];
  const n = edges.length + 1;

  const base: Omit<StepState, 'phase' | 'message'> = {
    visitedNodes: [],
    visitedEdges: [],
    depthMap: {},
    maxDepth: 0,
    highlightedPath: [],
    parityRows: [],
    parityRevealCount: 0,
    fpSteps: [],
    fpRevealCount: 0,
  };

  const snap = (phase: Phase, message: string, extra: Partial<StepState> = {}): StepState => ({
    ...base, ...extra, phase, message,
  });

  // ── EDGE CASE: no edges ──────────────────────────────────────────────────
  if (edges.length === 0) {
    steps.push(snap('error', 'Edge case: single node, no edges. Depth = 0. Answer = 0.', {
      isEdgeCase: true,
      edgeCaseNote: 'Tree has only the root node. No path exists. Answer is 0.',
      answer: 0,
      visitedNodes: [1],
    }));
    return steps;
  }

  // ── PHASE 1: INIT ────────────────────────────────────────────────────────
  steps.push(snap('init', `Tree has ${n} nodes, ${edges.length} edges. Root = 1. We need the max depth from root.`, {
    visitedNodes: [1],
  }));

  // ── PHASE 2: BUILD TREE (edge by edge) ───────────────────────────────────
  const g = buildAdjList(edges, n);
  const vis: number[] = [1];
  const visEdges: [number, number][] = [];

  steps.push(snap('build', 'Starting with root node 1. Reading edges to build adjacency list...', {
    visitedNodes: [1],
    visitedEdges: [],
  }));

  for (let i = 0; i < edges.length; i++) {
    const [u, v] = edges[i];
    if (!vis.includes(u)) vis.push(u);
    if (!vis.includes(v)) vis.push(v);
    visEdges.push([u, v]);

    steps.push(snap('build', `Added edge ${u} — ${v}. Tree now has ${vis.length} nodes, ${visEdges.length} edge${visEdges.length !== 1 ? 's' : ''}.`, {
      visitedNodes: [...vis],
      visitedEdges: [...visEdges],
    }));
  }

  // ── PHASE 3: BFS to find max depth ───────────────────────────────────────
  const depthMap = computeDepths(g, 1, n);

  steps.push(snap('dfs', 'Starting BFS from root node 1. Will discover each node level-by-level and track depth.', {
    visitedNodes: [1],
    visitedEdges: [...visEdges],
    depthMap: { 1: 0 },
    currentNode: 1,
  }));

  // Real BFS traversal for accurate step-by-step node discovery
  const bfsQueue: number[] = [1];
  const bfsVisited: number[] = [1];
  const tempDepthMap: Record<number, number> = { 1: 0 };
  let runningMaxDepth = 0;

  while (bfsQueue.length > 0) {
    const node = bfsQueue.shift()!;
    for (const neighbor of g[node]) {
      if (!bfsVisited.includes(neighbor)) {
        bfsVisited.push(neighbor);
        const newDepth = tempDepthMap[node] + 1;
        tempDepthMap[neighbor] = newDepth;
        runningMaxDepth = Math.max(runningMaxDepth, newDepth);
        const isNewMax = newDepth === runningMaxDepth;
        steps.push(snap('dfs',
          isNewMax
            ? `Visiting node ${neighbor} (from ${node}) at depth ${newDepth} — new maximum depth!`
            : `Visiting node ${neighbor} (from ${node}) at depth ${newDepth}.`,
          {
            visitedNodes: [...bfsVisited],
            visitedEdges: [...visEdges],
            depthMap: { ...tempDepthMap },
            maxDepth: runningMaxDepth,
            currentNode: neighbor,
          }
        ));
        bfsQueue.push(neighbor);
      }
    }
  }

  const maxDepth = runningMaxDepth;
  const deepestCandidates = Object.entries(tempDepthMap)
    .filter(([, d]) => d === maxDepth)
    .map(([v]) => parseInt(v));
  const deepestNodeId = deepestCandidates[0];
  const multipleDeepest = deepestCandidates.length > 1;

  steps.push(snap('dfs',
    multipleDeepest
      ? `Multiple nodes at max depth ${maxDepth}: [${deepestCandidates.join(', ')}]. Any one gives the same answer. Picking node ${deepestNodeId}.`
      : `BFS complete. Max depth = ${maxDepth}. Deepest node = ${deepestNodeId}.`,
    {
      visitedNodes: [...bfsVisited],
      visitedEdges: [...visEdges],
      depthMap: { ...tempDepthMap },
      maxDepth,
      deepestNode: deepestNodeId,
      isEdgeCase: multipleDeepest,
      edgeCaseNote: multipleDeepest
        ? `${deepestCandidates.length} nodes share max depth ${maxDepth}. All give the same path length, so the answer is identical regardless of choice.`
        : undefined,
    }
  ));

  // ── PHASE 4: HIGHLIGHT PATH ───────────────────────────────────────────────
  const rootPath = pathToNode(g, 1, deepestNodeId);

  steps.push(snap('path', `Path from root 1 to deepest node ${deepestNodeId}: [${rootPath.join(' → ')}]. This path has ${rootPath.length - 1} edges (= depth ${maxDepth}).`, {
    visitedNodes: [...bfsVisited],
    visitedEdges: [...visEdges],
    depthMap: { ...tempDepthMap },
    maxDepth,
    deepestNode: deepestNodeId,
    highlightedPath: rootPath,
  }));

  steps.push(snap('path',
    `Only these ${maxDepth} edges matter. We assign each weight 1 or 2. Total assignments = 2^${maxDepth} = ${Math.pow(2, maxDepth)}. We want sum to be odd.`,
    {
      visitedNodes: [...bfsVisited],
      visitedEdges: [...visEdges],
      depthMap: { ...tempDepthMap },
      maxDepth,
      deepestNode: deepestNodeId,
      highlightedPath: rootPath,
    }
  ));

  // ── PHASE 5: PARITY EXPLANATION ──────────────────────────────────────────
  const parityRows = buildParityTable(maxDepth);

  steps.push(snap('parity',
    `Parity insight: listing all 2^${Math.min(maxDepth, 5)} assignments${maxDepth > 5 ? ` (showing first 32 of ${Math.pow(2, maxDepth)})` : ''}. Watch exactly half give an odd sum.`,
    {
      visitedNodes: [...bfsVisited], visitedEdges: [...visEdges],
      depthMap: { ...tempDepthMap }, maxDepth, deepestNode: deepestNodeId,
      highlightedPath: rootPath,
      parityRows,
      parityRevealCount: 0,
    }
  ));

  // Reveal rows one by one (up to 16 for animation)
  const revealCap = Math.min(parityRows.length, 16);
  for (let reveal = 1; reveal <= revealCap; reveal++) {
    const oddSoFar = parityRows.slice(0, reveal).filter(r => r.odd).length;
    steps.push(snap('parity',
      `Row ${reveal}: weights [${parityRows[reveal - 1].weights.join(', ')}] → sum = ${parityRows[reveal - 1].sum} → ${parityRows[reveal - 1].odd ? '✓ ODD' : '✗ EVEN'}. Running odd count: ${oddSoFar}/${reveal}.`,
      {
        visitedNodes: [...bfsVisited], visitedEdges: [...visEdges],
        depthMap: { ...tempDepthMap }, maxDepth, deepestNode: deepestNodeId,
        highlightedPath: rootPath,
        parityRows,
        parityRevealCount: reveal,
      }
    ));
  }

  const oddTotal = parityRows.filter(r => r.odd).length;
  steps.push(snap('parity',
    `Pattern confirmed: exactly ${oddTotal} of ${parityRows.length} assignments give an odd sum = 2^(${maxDepth}-1) = 2^${maxDepth - 1} = ${oddTotal}. This holds for any d because flipping the last edge toggles parity.`,
    {
      visitedNodes: [...bfsVisited], visitedEdges: [...visEdges],
      depthMap: { ...tempDepthMap }, maxDepth, deepestNode: deepestNodeId,
      highlightedPath: rootPath,
      parityRows,
      parityRevealCount: parityRows.length,
    }
  ));

  // ── PHASE 6: FAST POWER ──────────────────────────────────────────────────
  const fpSteps = modpowSteps(2, maxDepth - 1);
  const finalAnswer = modpow(2, maxDepth - 1);

  steps.push(snap('fastpow',
    `Computing 2^${maxDepth - 1} mod 10^9+7 via binary exponentiation. Exponent in binary: ${(maxDepth - 1).toString(2)}.`,
    {
      visitedNodes: [...bfsVisited], visitedEdges: [...visEdges],
      depthMap: { ...tempDepthMap }, maxDepth, deepestNode: deepestNodeId,
      highlightedPath: rootPath,
      parityRows, parityRevealCount: parityRows.length,
      fpSteps, fpRevealCount: 0,
    }
  ));

  for (let i = 0; i < fpSteps.length; i++) {
    const fp = fpSteps[i];
    steps.push(snap('fastpow',
      `Iteration ${i + 1}: b=${fp.b} (binary: ${fp.b.toString(2)}), LSB=${fp.b & 1}. ${fp.bitUsed ? `Bit is 1 → res = ${fp.res} × ${fp.a} = ${(fp.res * fp.a) % MOD}` : `Bit is 0 → res stays ${fp.res}`}. Then a = a² mod MOD.`,
      {
        visitedNodes: [...bfsVisited], visitedEdges: [...visEdges],
        depthMap: { ...tempDepthMap }, maxDepth, deepestNode: deepestNodeId,
        highlightedPath: rootPath,
        parityRows, parityRevealCount: parityRows.length,
        fpSteps, fpRevealCount: i + 1,
      }
    ));
  }

  steps.push(snap('fastpow',
    `Binary exponentiation complete. 2^${maxDepth - 1} mod 10^9+7 = ${finalAnswer}.`,
    {
      visitedNodes: [...bfsVisited], visitedEdges: [...visEdges],
      depthMap: { ...tempDepthMap }, maxDepth, deepestNode: deepestNodeId,
      highlightedPath: rootPath,
      parityRows, parityRevealCount: parityRows.length,
      fpSteps, fpRevealCount: fpSteps.length,
      answer: finalAnswer,
    }
  ));

  // ── PHASE 7: DONE ────────────────────────────────────────────────────────
  steps.push(snap('done',
    `Answer = 2^(${maxDepth}-1) mod 10^9+7 = ${finalAnswer}.`,
    {
      visitedNodes: [...bfsVisited], visitedEdges: [...visEdges],
      depthMap: { ...tempDepthMap }, maxDepth, deepestNode: deepestNodeId,
      highlightedPath: rootPath,
      parityRows, parityRevealCount: parityRows.length,
      fpSteps, fpRevealCount: fpSteps.length,
      answer: finalAnswer,
    }
  ));

  return steps;
}

// ════════════════════════════════════════════════════════════════════════════
// TREE SVG LAYOUT
// ════════════════════════════════════════════════════════════════════════════

interface NodePos { id: number; x: number; y: number }

function computeTreeLayout(
  edges: [number, number][],
  svgW: number
): { nodePos: NodePos[]; edgeList: [number, number][] } {
  if (edges.length === 0) {
    return { nodePos: [{ id: 1, x: svgW / 2, y: 40 }], edgeList: [] };
  }

  const n = edges.length + 1;
  const g = buildAdjList(edges, n);
  const depthMap = computeDepths(g, 1, n);
  const maxD = Math.max(...Object.values(depthMap));

  // Group by depth
  const byDepth: number[][] = Array.from({ length: maxD + 1 }, () => []);
  for (let i = 1; i <= n; i++) byDepth[depthMap[i]].push(i);

  const NODE_R = 22;
  const ROW_H = 70;
  const nodePos: NodePos[] = [];

  for (let d = 0; d <= maxD; d++) {
    const row = byDepth[d];
    const cellW = svgW / (row.length + 1);
    row.forEach((id, idx) => {
      nodePos.push({ id, x: cellW * (idx + 1), y: NODE_R + d * ROW_H });
    });
  }

  return { nodePos, edgeList: edges };
}

// ════════════════════════════════════════════════════════════════════════════
// TREE CANVAS
// ════════════════════════════════════════════════════════════════════════════

function TreeCanvas({ step, edges }: { step: StepState; edges: [number, number][] }) {
  const ref = useRef<SVGSVGElement>(null);
  const [svgW, setSvgW] = useState(520);

  useEffect(() => {
    const update = () => { if (ref.current) setSvgW(ref.current.clientWidth); };
    update();
    const ro = new ResizeObserver(update);
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const { nodePos, edgeList } = useMemo(
    () => computeTreeLayout(edges, svgW),
    [edges, svgW]
  );

  const NODE_R = 22;
  const maxY = nodePos.length > 0 ? Math.max(...nodePos.map(p => p.y)) + NODE_R + 16 : 60;
  const svgH = Math.max(maxY, 60);

  const getPos = (id: number) => nodePos.find(p => p.id === id);
  const pathSet = new Set<string>();
  for (let i = 0; i + 1 < step.highlightedPath.length; i++) {
    const a = step.highlightedPath[i], b = step.highlightedPath[i + 1];
    pathSet.add(`${Math.min(a, b)}-${Math.max(a, b)}`);
  }

  const visEdgeSet = new Set(step.visitedEdges.map(([a, b]) => `${Math.min(a,b)}-${Math.max(a,b)}`));

  return (
    <svg ref={ref} viewBox={`0 0 ${svgW} ${svgH}`} width="100%" height={svgH}>
      <defs>
        <filter id="glow-em"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="glow-vi"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>

      {/* Edges */}
      {edgeList.map(([u, v], idx) => {
        const pu = getPos(u), pv = getPos(v);
        if (!pu || !pv) return null;
        const key = `${Math.min(u,v)}-${Math.max(u,v)}`;
        const isPath = pathSet.has(key);
        const isVis  = visEdgeSet.has(key);
        
        return (
          <line key={idx}
            x1={pu.x} y1={pu.y} x2={pv.x} y2={pv.y}
            stroke={isPath ? '#8b5fff' : isVis ? '#94ffff' : '#000000'}
            strokeWidth={isPath ? 3.5 : isVis ? 2 : 1.5}
            strokeDasharray={isVis || isPath ? undefined : '4 3'}
            opacity={isVis || isPath ? 1 : 0.3}
            style={{ transition: 'all 0.35s' }}
            filter={isPath ? 'url(#glow-vi)' : undefined}
          />
        );
      })}

      {/* Path edge labels */}
      {step.highlightedPath.length > 1 && step.highlightedPath.slice(0, -1).map((u, i) => {
        const v = step.highlightedPath[i + 1];
        const pu = getPos(u), pv = getPos(v);
        if (!pu || !pv) return null;
        return (
          <g key={`lbl-${i}`}>
            <rect x={(pu.x + pv.x) / 2 - 10} y={(pu.y + pv.y) / 2 - 9} width={20} height={16} rx={4}
              fill="#ede9fe" stroke="#8b5cf6" strokeWidth={1} />
            <text x={(pu.x + pv.x) / 2} y={(pu.y + pv.y) / 2 + 4}
              textAnchor="middle" fontSize={9} fontFamily="monospace" fontWeight="bold" fill="#6d28d9">
              {i + 1}
            </text>
          </g>
        );
      })}

      {/* Nodes */}
      {nodePos.map(({ id, x, y }) => {
        const depth = step.depthMap[id];
        const isRoot    = id === 1;
        const isCurrent = step.currentNode === id;
        const isDeepest = step.deepestNode === id;
        const isInPath  = step.highlightedPath.includes(id);
        const isVisited = step.visitedNodes.includes(id);

        let fill = '#f8fafc', stroke = '#cbd5e1', sw = 1.5, textColor = '#475569';
        let filterAttr: string | undefined;
        if (isInPath && step.highlightedPath.length > 1) {
          fill = '#ede9fe'; stroke = '#8b5cf6'; sw = 3; textColor = '#5b21b6'; filterAttr = 'url(#glow-vi)';
        } else if (isDeepest && !isInPath) {
          fill = '#ecfdf5'; stroke = '#22c55e'; sw = 2.5; textColor = '#166534'; filterAttr = 'url(#glow-em)';
        } else if (isCurrent) {
          fill = '#fef3c7'; stroke = '#f59e0b'; sw = 2.5; textColor = '#92400e'; filterAttr = 'url(#glow-em)';
        } else if (isVisited) {
          fill = '#f1f5f9'; stroke = '#94a3b8'; sw = 1.5; textColor = '#475569';
        }

        return (
          <g key={id} style={{ transition: 'all 0.35s' }} filter={filterAttr}>
            <circle cx={x} cy={y} r={NODE_R} fill={fill} stroke={stroke} strokeWidth={sw}
              style={{ transition: 'all 0.35s' }} />
            <text x={x} y={y - 2} textAnchor="middle" fontSize={13} fontFamily="monospace"
              fontWeight="800" fill={textColor}>{id}</text>
            {depth !== undefined && (
              <text x={x} y={y + 12} textAnchor="middle" fontSize={8} fontFamily="monospace"
                fill={textColor} opacity={0.7}>d={depth}</text>
            )}
            {isDeepest && (
              <text x={x} y={y - NODE_R - 5} textAnchor="middle" fontSize={10} fill="#16a34a">★</text>
            )}
            {isRoot && (
              <text x={x} y={y - NODE_R - 5} textAnchor="middle" fontSize={8} fontFamily="monospace"
                fontWeight="bold" fill="#6d28d9" opacity={0.7}>root</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PARITY TABLE
// ════════════════════════════════════════════════════════════════════════════

function ParityTable({ step }: { step: StepState }) {
  const { parityRows, parityRevealCount, maxDepth } = step;
  if (!parityRows.length) return (
    <div className="flex items-center justify-center h-24 text-slate-400 text-xs italic">
      Parity table will appear in the parity phase.
    </div>
  );

  const displayD = Math.min(maxDepth, 5);
  const oddCount = parityRows.slice(0, parityRevealCount).filter(r => r.odd).length;
  const evenCount = parityRevealCount - oddCount;
  const isCapped = maxDepth > 5;

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 text-[10px] font-bold">
          {Array.from({ length: displayD }, (_, i) => (
            <div key={i} className="w-8 text-center text-slate-500 uppercase">E{i + 1}</div>
          ))}
          <div className="w-10 text-center text-slate-500">Sum</div>
          <div className="w-14 text-center text-slate-500">Parity</div>
        </div>
        <div className="flex gap-2 text-[10px] font-bold">
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700">
            ODD: {oddCount}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-rose-100 border border-rose-300 text-rose-700">
            EVEN: {evenCount}
          </span>
        </div>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-1 max-h-72 overflow-y-auto pr-1">
        {parityRows.map((row, i) => {
          const revealed = i < parityRevealCount;
          const isLatest = i === parityRevealCount - 1;
          return (
            <div key={i} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border text-xs transition-all duration-300 ${
              !revealed ? 'opacity-0 h-0 overflow-hidden border-transparent py-0' :
              isLatest  ? (row.odd ? 'border-emerald-400 bg-emerald-50 scale-[1.01]' : 'border-rose-400 bg-rose-50 scale-[1.01]') :
              row.odd   ? 'border-emerald-100 bg-emerald-50/50' : 'border-rose-100 bg-rose-50/50'
            }`}>
              <div className="flex gap-2">
                {row.weights.map((w, j) => (
                  <div key={j} className={`w-8 h-6 flex items-center justify-center rounded border font-mono font-bold text-xs ${
                    w === 1 ? 'bg-sky-50 border-sky-300 text-sky-700' : 'bg-amber-50 border-amber-300 text-amber-700'
                  }`}>{w}</div>
                ))}
              </div>
              <div className="w-10 text-center font-mono font-bold text-slate-700">{row.sum}</div>
              <div className={`w-14 flex items-center justify-center gap-1 font-bold text-xs rounded px-1.5 py-0.5 ${
                row.odd ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}>
                {row.odd ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                {row.odd ? 'ODD' : 'EVEN'}
              </div>
            </div>
          );
        })}
        {isCapped && parityRevealCount >= parityRows.length && (
          <div className="text-center text-xs text-slate-400 italic py-2">
            … {Math.pow(2, maxDepth) - parityRows.length} more rows follow the same pattern
          </div>
        )}
      </div>

      {/* Summary callout */}
      {parityRevealCount >= parityRows.length && (
        <div className="mt-2 p-3 rounded-xl bg-violet-50 border border-violet-200">
          <div className="text-xs font-bold text-violet-700 mb-1">Why exactly half are odd</div>
          <p className="text-xs text-violet-600 leading-relaxed">
            For any assignment, flipping the last edge weight between 1 and 2 changes the sum parity.
            This pairs every odd assignment with a unique even one — exactly <strong>2^{maxDepth} / 2 = 2^{maxDepth - 1}</strong> odd assignments.
          </p>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// WHY IT WORKS PANEL
// ════════════════════════════════════════════════════════════════════════════

function WhyItWorks({ step }: { step: StepState }) {
  const { maxDepth } = step;

  return (
    <div className="flex flex-col gap-4 text-xs">

      {/* Formal argument */}
      <div className="p-3 rounded-xl bg-slate-900 border border-slate-700">
        <div className="text-[10px] font-bold text-violet-400 uppercase mb-2 tracking-widest">Formal Argument</div>
        <p className="text-slate-300 leading-relaxed font-mono text-[11px]">
          Let the path have <span className="text-amber-400 font-bold">d</span> edges, each assigned weight <span className="text-sky-400">1</span> or <span className="text-amber-400">2</span>.
        </p>
        <p className="text-slate-300 leading-relaxed font-mono text-[11px] mt-1">
          Total weight S = Σ wᵢ where wᵢ ∈ {'{1, 2}'}.
        </p>
        <p className="text-slate-300 leading-relaxed font-mono text-[11px] mt-1">
          Write wᵢ = 1 + bᵢ where bᵢ ∈ {'{0, 1}'}.
        </p>
        <p className="text-slate-300 leading-relaxed font-mono text-[11px] mt-1">
          Then S = d + Σ bᵢ.
        </p>
        <p className="text-slate-300 leading-relaxed font-mono text-[11px] mt-1">
          S is odd ↔ (d + Σ bᵢ) is odd ↔ Σ bᵢ has parity opposite to d.
        </p>
        <p className="text-slate-300 leading-relaxed font-mono text-[11px] mt-1">
          The number of binary strings b₁…b_d with Σ bᵢ having a fixed parity is always exactly <span className="text-emerald-400 font-bold">2^(d-1)</span>.
        </p>
      </div>

      {/* Pairing argument */}
      <div className="p-3 rounded-xl bg-slate-900 border border-slate-700">
        <div className="text-[10px] font-bold text-emerald-400 uppercase mb-2 tracking-widest">Pairing Argument (Intuitive)</div>
        <div className="flex flex-col gap-2 text-slate-300 text-[11px] font-mono leading-relaxed">
          <p>Take any assignment of d edges. Flip only edge d (last edge): 1↔2.</p>
          <p>This changes the sum by ±1, toggling parity (odd ↔ even).</p>
          <p>Every odd assignment pairs uniquely with exactly one even assignment.</p>
          <p className="text-emerald-400 font-bold">∴ exactly half of 2^d assignments are odd = 2^(d-1).</p>
        </div>
      </div>

      {/* Key insight box */}
      <div className="p-3 rounded-xl bg-slate-900 border border-violet-700">
        <div className="text-[10px] font-bold text-violet-300 uppercase mb-2 tracking-widest">Key Insight</div>
        <p className="text-violet-200 text-[11px] leading-relaxed">
          The answer only depends on the <span className="text-amber-400 font-bold">depth</span> of the deepest node —
          not on the tree structure, branching, or values. Any other edges in the tree are irrelevant.
          {maxDepth > 0 && (
            <span className="block mt-1 text-emerald-300 font-bold">
              This tree: depth = {maxDepth} → answer = 2^{maxDepth - 1} = {modpow(2, maxDepth - 1)}
            </span>
          )}
        </p>
      </div>

      {/* Edge cases */}
      <div className="p-3 rounded-xl bg-slate-900 border border-amber-700">
        <div className="text-[10px] font-bold text-amber-300 uppercase mb-2 tracking-widest">Edge Cases</div>
        <div className="flex flex-col gap-1.5 text-[11px] font-mono">
          <div className="flex items-start gap-2 text-slate-300">
            <span className="text-amber-400 mt-0.5">→</span>
            <span><span className="text-amber-400">d = 0</span>: Only the root, no edges. No valid assignment. Answer = 0.</span>
          </div>
          <div className="flex items-start gap-2 text-slate-300">
            <span className="text-amber-400 mt-0.5">→</span>
            <span><span className="text-amber-400">d = 1</span>: One edge. Only weight=1 gives odd sum. Answer = 1 = 2^0.</span>
          </div>
          <div className="flex items-start gap-2 text-slate-300">
            <span className="text-amber-400 mt-0.5">→</span>
            <span><span className="text-amber-400">Multiple deepest nodes</span>: Same d, same answer — pick any.</span>
          </div>
          <div className="flex items-start gap-2 text-slate-300">
            <span className="text-amber-400 mt-0.5">→</span>
            <span><span className="text-amber-400">Large d</span>: 2^(d-1) can be huge → return mod 10^9+7.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FAST POWER PANEL
// ════════════════════════════════════════════════════════════════════════════

function FastPowerPanel({ step }: { step: StepState }) {
  const { fpSteps, fpRevealCount, maxDepth } = step;
  if (!fpSteps.length) return (
    <div className="flex items-center justify-center h-24 text-slate-400 text-xs italic">
      Fast power computation will appear here.
    </div>
  );

  const exp = maxDepth - 1;
  const binary = exp.toString(2).padStart(Math.max(exp.toString(2).length, 1), '0');
  const finalRes = fpRevealCount > 0
    ? (fpSteps[fpRevealCount - 1].bitUsed
        ? (fpSteps[fpRevealCount - 1].res * fpSteps[fpRevealCount - 1].a) % MOD
        : fpSteps[fpRevealCount - 1].res)
    : 1;

  return (
    <div className="flex flex-col gap-3">
      {/* Goal */}
      <div className="px-3 py-2 bg-slate-900 rounded-lg border border-slate-700">
        <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Computing </span>
        <span className="font-mono text-sm font-bold text-white ml-2">
          2<sup>{exp}</sup> mod 10<sup>9</sup>+7
        </span>
        <span className="ml-3 font-mono text-xs text-slate-400">
          binary({exp}) = <span className="text-amber-400 font-bold">{binary}</span>
        </span>
      </div>

      {/* Bit strip */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase">Bits</span>
        {binary.split('').map((bit, i) => {
          const iterIdx = binary.length - 1 - i;
          const isActive = fpRevealCount > 0 && iterIdx === fpRevealCount - 1;
          const isDone   = iterIdx < fpRevealCount - 1;
          return (
            <div key={i} className={`w-7 h-7 flex items-center justify-center rounded font-mono font-bold text-sm border-2 transition-all ${
              isActive ? 'border-amber-400 bg-amber-50 text-amber-700 scale-110 shadow-md' :
              isDone   ? 'border-slate-200 bg-slate-100 text-slate-500' :
                         'border-slate-100 bg-slate-50 text-slate-300'
            }`}>
              {bit}
            </div>
          );
        })}
        <div className="ml-2 text-[10px] text-slate-400 font-mono">(LSB first in loop)</div>
      </div>

      {/* Iteration table */}
      <div className="flex flex-col gap-1">
        <div className="grid grid-cols-5 text-[10px] font-bold text-slate-400 uppercase px-2 mb-1">
          <span>Iter</span><span>b (bin)</span><span>bit</span><span>a</span><span>res</span>
        </div>
        {fpSteps.map((fp, i) => {
          const revealed = i < fpRevealCount;
          const isLatest = i === fpRevealCount - 1;
          const newRes = fp.bitUsed ? (fp.res * fp.a) % MOD : fp.res;
          return (
            <div key={i} className={`grid grid-cols-5 items-center px-2 py-1.5 rounded-lg border text-[11px] font-mono transition-all duration-300 ${
              !revealed ? 'opacity-0 h-0 overflow-hidden border-transparent py-0' :
              isLatest  ? 'border-amber-300 bg-amber-50' : 'border-slate-100 bg-slate-50'
            }`}>
              <span className="font-bold text-slate-600">{i + 1}</span>
              <span className="text-violet-600">{fp.b.toString(2)}</span>
              <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] w-fit ${
                fp.bitUsed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}>{fp.b & 1}</span>
              <span className="text-sky-700">{fp.a}</span>
              <span className={`font-bold ${isLatest ? 'text-amber-700' : 'text-slate-700'}`}>{fp.bitUsed ? newRes : fp.res}</span>
            </div>
          );
        })}
      </div>

      {/* Final */}
      {fpRevealCount >= fpSteps.length && (
        <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border border-emerald-300 rounded-xl mt-1">
          <span className="text-xs font-bold text-emerald-700">Result</span>
          <span className="font-mono text-2xl font-black text-emerald-700">{finalRes}</span>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FINAL COMPUTATION TABS
// ════════════════════════════════════════════════════════════════════════════

type ComputeTab = 'parity' | 'why' | 'fastpow';

function FinalComputationSection({ step }: { step: StepState }) {
  const [activeTab, setActiveTab] = useState<ComputeTab>('parity');

  // Auto-switch tab when phase changes
  useEffect(() => {
    if (step.phase === 'parity') setActiveTab('parity');
    if (step.phase === 'fastpow') setActiveTab('fastpow');
    if (step.phase === 'done') setActiveTab('why');
  }, [step.phase]);

  const tabs: { id: ComputeTab; label: string; icon: React.ReactNode }[] = [
    { id: 'parity',  label: 'Parity Table',   icon: <Hash size={12} />    },
    { id: 'why',     label: 'Why It Works',   icon: <Zap size={12} />     },
    { id: 'fastpow', label: 'Fast Power',     icon: <Binary size={12} />  },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Tab strip */}
      <div className="flex border-b border-slate-100">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex-1 justify-center ${
              activeTab === t.id
                ? 'border-violet-500 text-violet-600 bg-violet-50/50'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      <div className="p-4">
        {activeTab === 'parity'  && <ParityTable step={step} />}
        {activeTab === 'why'     && <WhyItWorks  step={step} />}
        {activeTab === 'fastpow' && <FastPowerPanel step={step} />}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PHASE CHIP
// ════════════════════════════════════════════════════════════════════════════

function phaseChip(phase: Phase, isEdge?: boolean) {
  if (isEdge) return 'bg-amber-50 border-amber-300 text-amber-700';
  const m: Record<Phase, string> = {
    init:    'bg-slate-100 border-slate-300 text-slate-500',
    build:   'bg-sky-50 border-sky-300 text-sky-700',
    dfs:     'bg-amber-50 border-amber-300 text-amber-700',
    path:    'bg-violet-50 border-violet-300 text-violet-700',
    parity:  'bg-emerald-50 border-emerald-300 text-emerald-700',
    fastpow: 'bg-blue-50 border-blue-300 text-blue-700',
    done:    'bg-emerald-100 border-emerald-400 text-emerald-800',
    error:   'bg-rose-50 border-rose-300 text-rose-700',
  };
  return m[phase] ?? 'bg-slate-100 border-slate-300 text-slate-500';
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════

export default function EdgeWeightsPage() {
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);
  const activeCase = TEST_CASES[activeCaseIdx];
  const [edges, setEdges] = useState<[number, number][]>(activeCase.edges);

  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState('');
  const [step, setStep]           = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed]         = useState(900);

  const animationSteps = useMemo(() => generateSteps(edges), [edges]);
  useEffect(() => { setStep(0); setIsPlaying(false); }, [animationSteps]);
  useEffect(() => {
    if (!isPlaying) return;
    if (step >= animationSteps.length - 1) { setIsPlaying(false); return; }
    const t = setTimeout(() => setStep(s => s + 1), speed);
    return () => clearTimeout(t);
  }, [isPlaying, step, animationSteps.length, speed]);

  const current = animationSteps[step] ?? animationSteps[0];
  const prevStep = step > 0 ? animationSteps[step - 1] : null;

  const switchCase = (idx: number) => {
    setActiveCaseIdx(idx);
    setEdges(TEST_CASES[idx].edges);
    setStep(0); setIsPlaying(false);
  };

  const ACCENT = 'bg-violet-600';
  const ACCENT_TEXT = 'text-violet-600';
  const ACCENT_BORDER = 'border-violet-500';

  return (
    <div className="flex flex-col  bg-slate-50 text-slate-900 font-sans overflow-hidden">

      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-100 shadow-sm px-4 pt-3 pb-0 flex-shrink-0">
        <div className="flex items-end gap-0">
          <div className={`flex items-center gap-2.5 px-5 py-3 border-b-2 ${ACCENT_BORDER} ${ACCENT_TEXT}`}>
            <GitBranch size={18} className={ACCENT_TEXT} />
            <div>
              <div className="text-sm font-bold leading-none">Number of Ways to Assign Edge Weights I</div>
              <div className="text-[9px] font-normal mt-0.5 opacity-60">DFS depth · parity argument · modular fast power · LC #3558</div>
            </div>
            <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded border border-violet-300 text-violet-700 bg-violet-50">Medium</span>
          </div>
        </div>
      </div>

      {/* ── Test case selector ── */}
      <div className="bg-white border-b border-slate-100 px-4 py-2 flex items-center gap-3 flex-shrink-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Cases</span>
        <div className="flex items-center gap-1.5 overflow-x-auto flex-1">
          {TEST_CASES.map((tc, idx) => (
            <button key={idx} onClick={() => switchCase(idx)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
                activeCaseIdx === idx
                  ? `${ACCENT} text-white border-transparent shadow-sm`
                  : tc.isEdgeCase
                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}>
              {tc.isEdgeCase && activeCaseIdx !== idx && <AlertTriangle size={9} />}
              {tc.label}
              {tc.isEdgeCase && <span className={`text-[8px] ml-0.5 ${activeCaseIdx === idx ? 'opacity-70' : 'text-amber-500'}`}>⚡</span>}
            </button>
          ))}
        </div>
        <button onClick={() => { setEditDraft(JSON.stringify(edges)); setIsEditing(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100 flex-shrink-0">
          <Settings2 size={11} /> Custom
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
        
        {/* Canvas */}
        <div className="flex-1 min-h-0 p-4 flex flex-col gap-4 overflow-y-auto">

          {/* Edge case banner */}
          {current.isEdgeCase && (
            <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex-shrink-0">
              <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-amber-700">Edge Case</div>
                <div className="text-xs text-amber-600 mt-0.5">{current.edgeCaseNote}</div>
              </div>
            </div>
          )}

          {/* Phase indicators */}
          <div className="flex gap-2 flex-wrap">
            {(['init','build','dfs','path','parity','fastpow','done'] as Phase[]).map(p => (
              <div key={p} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${phaseChip(p)} ${current.phase === p ? 'shadow-md scale-105' : 'opacity-40'}`}>
                {p}
              </div>
            ))}
          </div>

          {/* Problem description card */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <TreePine size={13} className="text-violet-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Problem</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Undirected tree rooted at node 1. Assign each edge weight <span className="font-mono font-bold text-sky-700">1</span> or <span className="font-mono font-bold text-amber-700">2</span>.
              Find the number of ways to assign weights on the path from root to a <strong>deepest node</strong> such that the path cost is <strong>odd</strong>.
            </p>
            <div className="mt-2 px-3 py-2 bg-violet-50 border border-violet-100 rounded-lg text-xs font-mono text-violet-700">
              Answer = 2<sup>depth−1</sup> mod 10<sup>9</sup>+7
            </div>
          </div>

          {/* Tree canvas */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <GitBranch size={12} /> Tree
              </span>
              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold">
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-violet-500 inline-block rounded"/> Path</span>
                <span className="flex items-center gap-1"><span className="text-emerald-500">★</span> Deepest</span>
                {current.maxDepth > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-600 font-bold">
                    depth = {current.maxDepth}
                  </span>
                )}
              </div>
            </div>
            <TreeCanvas step={current} edges={edges} />
          </div>

          {/* Path edges display */}
          {current.highlightedPath.length > 1 && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Search size={12} /> Path Edges (root → deepest)
                </span>
                <span className="text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                  {current.maxDepth} edges
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {current.highlightedPath.map((nodeId, i) => (
                  <React.Fragment key={nodeId}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-sm border-2 ${
                      i === 0 ? 'border-violet-400 bg-violet-50 text-violet-700' :
                      i === current.highlightedPath.length - 1 ? 'border-emerald-400 bg-emerald-50 text-emerald-700' :
                      'border-slate-300 bg-slate-50 text-slate-700'
                    }`}>{nodeId}</div>
                    {i < current.highlightedPath.length - 1 && (
                      <div className="flex flex-col items-center">
                        <div className="text-[9px] font-bold text-violet-500">e{i+1}</div>
                        <div className="text-slate-400">→</div>
                        <div className="text-[9px] text-slate-400">1 or 2</div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Final computation section with tabs */}
          <FinalComputationSection step={current} />

          {/* Final answer */}
          {current.answer !== undefined && (
            <div className={`flex items-center justify-between px-6 py-4 rounded-xl border-2 transition-all ${
              current.phase === 'done' ? 'border-violet-400 bg-violet-50' : 'border-emerald-300 bg-emerald-50'
            }`}>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Answer</div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  2^{current.maxDepth - 1} mod 10^9+7
                </div>
              </div>
              <div className={`text-4xl font-black font-mono tabular-nums ${
                current.phase === 'done' ? 'text-violet-600' : 'text-emerald-600'
              }`}>
                {current.answer}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="flex-1 min-h-0 w-full lg:w-72 lg:flex-none lg:h-full flex flex-col border-t lg:border-t-0 lg:border-l border-slate-100 bg-white overflow-hidden">

          {/* Controller - ALWAYS VISIBLE */}
          <div className="p-4 border-b border-slate-50 flex-shrink-0 bg-white">
            <div className="flex justify-between items-center mb-5">
              <button onClick={() => { setStep(0); setIsPlaying(false); }} title="Reset"
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><RotateCcw size={16} /></button>
              <button onClick={() => setStep(s => Math.max(0, s - 1))}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><StepBack size={16} /></button>
              <button onClick={() => setIsPlaying(p => !p)}
                className={`w-11 h-11 flex items-center justify-center rounded-full transition-all shadow-md ${isPlaying ? 'bg-amber-100 text-amber-600' : `${ACCENT} text-white`}`}>
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
              </button>
              <button onClick={() => setStep(s => Math.min(animationSteps.length - 1, s + 1))}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><StepForward size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                  <span>Speed</span><span>{speed}ms</span>
                </div>
                <input type="range" min="150" max="2000" step="50" value={speed}
                  onChange={e => setSpeed(parseInt(e.target.value))} className="w-full accent-violet-600" />
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                  <span>Progress</span><span>{step + 1}/{animationSteps.length}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${ACCENT} transition-all duration-300`}
                    style={{ width: `${((step + 1) / animationSteps.length) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable Sidebar Content */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {/* Step Log */}
            <div className="p-4 border-b border-slate-50">
              <div className="flex items-center gap-2 mb-3">
                <Terminal size={11} className="text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Step Log</span>
              </div>
              {prevStep && (
                <div className="mb-2 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-[9px] font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] border ${phaseChip(prevStep.phase, prevStep.isEdgeCase)}`}>
                      {prevStep.phase}
                    </span>
                    PREVIOUS
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono leading-relaxed">{prevStep.message}</p>
                </div>
              )}
              <div className={`px-3 py-2.5 rounded-lg border-l-4 ${ACCENT_BORDER} bg-slate-900`}>
                <div className="text-[9px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] border ${phaseChip(current.phase, current.isEdgeCase)}`}>
                    {current.isEdgeCase && <AlertTriangle size={8} />}
                    {current.phase}
                  </span>
                  NOW
                </div>
                <p className="text-[11px] text-slate-100 font-mono leading-relaxed">{current.message}</p>
              </div>
            </div>

            {/* Live stats */}
            <div className="p-4 border-b border-slate-50">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Live Stats</div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="text-[8px] font-bold text-slate-400 uppercase">Max Depth</div>
                  <div className={`text-2xl font-black ${ACCENT_TEXT}`}>{current.maxDepth}</div>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="text-[8px] font-bold text-slate-400 uppercase">Answer</div>
                  <div className="text-2xl font-black text-emerald-600">
                    {current.answer !== undefined ? current.answer : '?'}
                  </div>
                </div>
              </div>
              {current.deepestNode !== undefined && (
                <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Deepest Node</span>
                  <span className="font-mono font-black text-emerald-700">{current.deepestNode}</span>
                </div>
              )}
            </div>

            {/* Complexity */}
            <div className="p-4 border-b border-slate-50">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Complexity</div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="text-[8px] text-slate-400 uppercase">Time</div>
                  <div className="font-mono text-base font-black text-slate-800">O(n)</div>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="text-[8px] text-slate-400 uppercase">Space</div>
                  <div className="font-mono text-base font-black text-slate-800">O(n)</div>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Single DFS for max depth. Then O(log d) for modular exponentiation.
              </p>
            </div>

            {/* Step counter */}
            <div className="p-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Steps</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="text-[8px] font-bold text-slate-400 uppercase">Now</div>
                  <div className={`text-xl font-black ${ACCENT_TEXT}`}>{step + 1}</div>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="text-[8px] font-bold text-slate-400 uppercase">Total</div>
                  <div className="text-xl font-black text-slate-500">{animationSteps.length}</div>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="text-[8px] font-bold text-slate-400 uppercase">Left</div>
                  <div className="text-xl font-black text-slate-400">{animationSteps.length - step - 1}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-2xl">
            <h2 className="text-lg font-bold mb-1">Custom Tree</h2>
            <p className="text-xs text-slate-400 mb-4">
              JSON array of [u, v] edge pairs. Nodes are 1-indexed. Tree must be connected.
            </p>
            <textarea rows={5} value={editDraft} onChange={e => setEditDraft(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm mb-4 resize-none"
              placeholder='[[1,2],[2,3],[3,4]]' />
            <div className="flex gap-2">
              <button onClick={() => {
                try {
                  const parsed: [number, number][] = JSON.parse(editDraft);
                  setEdges(parsed); setIsEditing(false); setStep(0); setIsPlaying(false);
                } catch { alert('Invalid JSON. Expected [[u,v], ...]'); }
              }} className={`flex-1 ${ACCENT} text-white font-bold py-2 rounded-lg shadow-md hover:opacity-90`}>
                Visualize
              </button>
              <button onClick={() => setIsEditing(false)}
                className="flex-1 bg-slate-100 text-slate-600 font-bold py-2 rounded-lg hover:bg-slate-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}