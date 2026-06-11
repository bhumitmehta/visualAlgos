'use client';

import React, {
  useState, useEffect, useMemo, useRef, useCallback
} from 'react';
import {
  Play, Pause, RotateCcw, StepForward, StepBack,
  Settings2, AlertTriangle, Terminal, Braces,
  ListTree, Info, CheckCircle2
} from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type Description = [number, number, 0 | 1];
type Phase = 'init' | 'nodes' | 'attach' | 'root' | 'done' | 'error';

interface StepState {
  phase: Phase;
  descriptionIndex: number;
  parentVal?: number;
  childVal?: number;
  isLeft?: 0 | 1;
  existingNodes: number[];
  edges: { parent: number; child: number; isLeft: 0 | 1 }[];
  childSet: number[];
  rootVal?: number;
  message: string;
  isEdgeCase?: boolean;
  edgeCaseNote?: string;
}

interface TreeNodeVis {
  val: number;
  left?: TreeNodeVis;
  right?: TreeNodeVis;
}

interface PositionedNode {
  val: number;
  x: number;
  y: number;
}

interface PositionedEdge {
  x1: number; y1: number;
  x2: number; y2: number;
  isLeft: boolean;
}

interface TestCase {
  label: string;
  description: string;
  isEdgeCase?: boolean;
  descriptions: Description[];
}

// ════════════════════════════════════════════════════════════════════════════
// TEST CASES
// ════════════════════════════════════════════════════════════════════════════

const TEST_CASES: TestCase[] = [
  {
    label: 'Example 1',
    description: 'Standard balanced-ish tree from problem statement.',
    descriptions: [[20,15,1],[20,17,0],[50,20,1],[50,80,0],[80,19,1]],
  },
  {
    label: 'Chain',
    description: 'Skewed tree — like a linked list.',
    descriptions: [[1,2,1],[2,3,0],[3,4,1]],
  },
  {
    label: 'Only Left',
    description: 'Edge: all edges are left children.',
    isEdgeCase: true,
    descriptions: [[10,5,1],[5,2,1],[2,1,1]],
  },
  {
    label: 'Only Right',
    description: 'Edge: all edges are right children.',
    isEdgeCase: true,
    descriptions: [[7,9,0],[9,11,0],[11,13,0]],
  },
  {
    label: 'Mixed',
    description: 'Small balanced tree, multiple levels.',
    descriptions: [[5,3,1],[5,8,0],[3,1,1],[3,4,0],[8,7,1]],
  },
  {
    label: 'Single Node',
    description: 'Edge: only one description — minimal tree.',
    isEdgeCase: true,
    descriptions: [[1,2,1]],
  },
  {
    label: 'Wide Tree',
    description: 'Root with 4 grandchildren.',
    descriptions: [[10,5,1],[10,15,0],[5,3,1],[5,7,0],[15,13,1],[15,17,0]],
  },
];

// ════════════════════════════════════════════════════════════════════════════
// STEP GENERATOR  (pure function)
// ════════════════════════════════════════════════════════════════════════════

function generateSteps(descriptions: Description[]): StepState[] {
  const s: StepState[] = [];
  const nodes = new Set<number>();
  const childSet = new Set<number>();
  const edges: StepState['edges'] = [];

  s.push({
    phase: 'init',
    descriptionIndex: -1,
    existingNodes: [],
    edges: [],
    childSet: [],
    message: 'Start: empty node map and child set. We will scan each description once.',
  });

  descriptions.forEach(([parent, child, isLeft], idx) => {
    // Edge case: duplicate child
    const isDupChild = childSet.has(child);

    s.push({
      phase: 'nodes',
      descriptionIndex: idx,
      parentVal: parent,
      childVal: child,
      isLeft,
      existingNodes: Array.from(nodes),
      edges: [...edges],
      childSet: Array.from(childSet),
      message: `Description ${idx + 1}/${descriptions.length}: parent=${parent}, child=${child}, isLeft=${isLeft}.`,
      isEdgeCase: isDupChild,
      edgeCaseNote: isDupChild
        ? `Node ${child} already appears as a child — a valid binary tree has at most one parent per node.`
        : undefined,
    });

    nodes.add(parent);
    nodes.add(child);
    edges.push({ parent, child, isLeft });
    childSet.add(child);

    s.push({
      phase: 'attach',
      descriptionIndex: idx,
      parentVal: parent,
      childVal: child,
      isLeft,
      existingNodes: Array.from(nodes),
      edges: [...edges],
      childSet: Array.from(childSet),
      message: isLeft === 1
        ? `Attach ${child} as LEFT child of ${parent}. Add ${child} to child set.`
        : `Attach ${child} as RIGHT child of ${parent}. Add ${child} to child set.`,
    });
  });

  // Find root = node in nodes but NOT in childSet
  const allNodes = Array.from(nodes);
  const candidates = allNodes.filter(v => !childSet.has(v));
  const rootVal = candidates[0];
  const multipleRoots = candidates.length > 1;

  s.push({
    phase: 'root',
    descriptionIndex: -1,
    existingNodes: allNodes,
    edges: [...edges],
    childSet: Array.from(childSet),
    rootVal,
    isEdgeCase: multipleRoots,
    edgeCaseNote: multipleRoots
      ? `Multiple candidates (${candidates.join(', ')}) — the descriptions may describe a forest, not a single tree.`
      : undefined,
    message: rootVal !== undefined
      ? `Node ${rootVal} never appears as a child → it is the root.${multipleRoots ? ` (Warning: ${candidates.length} root candidates found.)` : ''}`
      : 'No root found — invalid input.',
  });

  s.push({
    phase: 'done',
    descriptionIndex: -1,
    existingNodes: allNodes,
    edges: [...edges],
    childSet: Array.from(childSet),
    rootVal,
    message: rootVal !== undefined
      ? `Tree construction complete. Root = ${rootVal}.`
      : 'Tree could not be constructed.',
  });

  return s;
}

// ════════════════════════════════════════════════════════════════════════════
// TREE LAYOUT  (compute x/y positions + edges in one pass)
// ════════════════════════════════════════════════════════════════════════════

function buildTreeFromEdges(
  rootVal: number,
  edges: StepState['edges']
): TreeNodeVis | undefined {
  if (rootVal === undefined) return undefined;
  const map = new Map<number, TreeNodeVis>();
  edges.forEach(e => {
    if (!map.has(e.parent)) map.set(e.parent, { val: e.parent });
    if (!map.has(e.child))  map.set(e.child,  { val: e.child });
  });
  edges.forEach(e => {
    const p = map.get(e.parent)!;
    const c = map.get(e.child)!;
    if (e.isLeft === 1) p.left = c; else p.right = c;
  });
  return map.get(rootVal);
}

function computeLayout(
  root: TreeNodeVis | undefined,
  svgW: number,
  nodeR: number
): { nodes: PositionedNode[]; edges: PositionedEdge[] } {
  if (!root) return { nodes: [], edges: [] };

  const NODE_GAP_Y = 70;
  const nodes: PositionedNode[] = [];
  const edges: PositionedEdge[] = [];

  // BFS to figure out positions using min-gap approach
  // Assign x via in-order traversal counter
  let counter = 0;
  const xMap = new Map<number, number>();

  function inorder(node: TreeNodeVis) {
    if (node.left) inorder(node.left);
    xMap.set(node.val, counter++);
    if (node.right) inorder(node.right);
  }
  inorder(root);

  const total = counter;
  const levelMap = new Map<number, number>(); // val → level

  const queue: { node: TreeNodeVis; level: number }[] = [{ node: root, level: 0 }];
  while (queue.length) {
    const { node, level } = queue.shift()!;
    levelMap.set(node.val, level);
    if (node.left)  queue.push({ node: node.left,  level: level + 1 });
    if (node.right) queue.push({ node: node.right, level: level + 1 });
  }

  const cellW = total > 1 ? (svgW - nodeR * 2) / (total - 1) : svgW / 2;

  const getX = (val: number) => {
    const idx = xMap.get(val) ?? 0;
    return total === 1 ? svgW / 2 : nodeR + idx * cellW;
  };
  const getY = (val: number) => {
    return nodeR + (levelMap.get(val) ?? 0) * NODE_GAP_Y;
  };

  // Build positioned nodes
  for (const [val] of xMap) {
    nodes.push({ val, x: getX(val), y: getY(val) });
  }

  // Build edges
  const visited = new Set<number>();
  function edgeDFS(node: TreeNodeVis) {
    if (visited.has(node.val)) return;
    visited.add(node.val);
    const px = getX(node.val), py = getY(node.val);
    if (node.left) {
      edges.push({ x1: px, y1: py, x2: getX(node.left.val), y2: getY(node.left.val), isLeft: true });
      edgeDFS(node.left);
    }
    if (node.right) {
      edges.push({ x1: px, y1: py, x2: getX(node.right.val), y2: getY(node.right.val), isLeft: false });
      edgeDFS(node.right);
    }
  }
  edgeDFS(root);

  return { nodes, edges };
}

// ════════════════════════════════════════════════════════════════════════════
// TREE CANVAS
// ════════════════════════════════════════════════════════════════════════════

const NODE_R = 22;

function TreeCanvas({ step }: { step: StepState }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgW, setSvgW] = useState(560);

  useEffect(() => {
    const update = () => {
      if (svgRef.current) setSvgW(svgRef.current.clientWidth);
    };
    update();
    const ro = new ResizeObserver(update);
    if (svgRef.current) ro.observe(svgRef.current);
    return () => ro.disconnect();
  }, []);

  const tree = step.rootVal !== undefined
    ? buildTreeFromEdges(step.rootVal, step.edges)
    : undefined;

  const { nodes, edges } = useMemo(
    () => computeLayout(tree, svgW, NODE_R + 8),
    [tree, svgW]
  );

  // Filter edges to only show up to current descriptionIndex
  const visibleEdgeVals = new Set<string>();
  step.edges.forEach((e, idx) => {
    if (step.descriptionIndex < 0 || idx <= step.descriptionIndex) {
      visibleEdgeVals.add(`${e.parent}-${e.child}`);
    }
  });

  const visibleEdges = edges.filter(e => {
    const n1 = nodes.find(n => n.x === e.x1 && n.y === e.y1);
    const n2 = nodes.find(n => n.x === e.x2 && n.y === e.y2);
    if (!n1 || !n2) return true;
    return visibleEdgeVals.has(`${n1.val}-${n2.val}`);
  });

  const maxY = nodes.length > 0 ? Math.max(...nodes.map(n => n.y)) + NODE_R + 16 : 80;
  const svgH = Math.max(maxY, 80);

  if (!tree) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-400 text-xs italic">
        Root not yet determined — tree will appear once root is found.
      </div>
    );
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${svgW} ${svgH}`}
      width="100%"
      height={svgH}
      className="overflow-visible"
    >
      <defs>
        <filter id="glow-amber">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glow-green">
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Edges */}
      {visibleEdges.map((e, i) => (
        <g key={i}>
          <line
            x1={e.x1} y1={e.y1 + NODE_R}
            x2={e.x2} y2={e.y2 - NODE_R}
            stroke={e.isLeft ? '#38bdf8' : '#fbbf24'}
            strokeWidth={2.5}
            strokeLinecap="round"
            opacity={0.85}
          />
          {/* direction label */}
          <text
            x={(e.x1 + e.x2) / 2 + (e.isLeft ? -10 : 10)}
            y={(e.y1 + e.y2) / 2}
            fontSize={9}
            fontFamily="monospace"
            fill={e.isLeft ? '#0369a1' : '#b45309'}
            fontWeight="bold"
            textAnchor="middle"
          >
            {e.isLeft ? 'L' : 'R'}
          </text>
        </g>
      ))}

      {/* Nodes */}
      {nodes.map(n => {
        const isRoot    = n.val === step.rootVal;
        const isParent  = n.val === step.parentVal;
        const isChild   = n.val === step.childVal;
        const inChildSet = step.childSet.includes(n.val);

        let fill = '#f8fafc', stroke = '#cbd5e1', strokeW = 1.5, textColor = '#1e293b';
        let filterAttr: string | undefined;

        if (isRoot && step.phase === 'done') {
          fill = '#ecfdf5'; stroke = '#22c55e'; strokeW = 3; textColor = '#166534';
          filterAttr = 'url(#glow-green)';
        } else if (isParent && (step.phase === 'nodes' || step.phase === 'attach')) {
          fill = '#fef3c7'; stroke = '#f59e0b'; strokeW = 2.5; textColor = '#92400e';
          filterAttr = 'url(#glow-amber)';
        } else if (isChild && (step.phase === 'nodes' || step.phase === 'attach')) {
          fill = '#fff7ed'; stroke = '#fb923c'; strokeW = 2.5; textColor = '#9a3412';
        } else if (isRoot && step.phase === 'root') {
          fill = '#f0fdf4'; stroke = '#4ade80'; strokeW = 2.5; textColor = '#166534';
        } else if (inChildSet) {
          fill = '#fffbeb'; stroke = '#fcd34d'; strokeW = 1.5; textColor = '#78350f';
        }

        return (
          <g key={n.val} style={{ transition: 'all 0.3s' }} filter={filterAttr}>
            <circle
              cx={n.x} cy={n.y} r={NODE_R}
              fill={fill} stroke={stroke} strokeWidth={strokeW}
              style={{ transition: 'all 0.3s' }}
            />
            <text
              x={n.x} y={n.y + 5}
              textAnchor="middle" fontSize={13}
              fontFamily="monospace" fontWeight="700"
              fill={textColor}
            >
              {n.val}
            </text>
            {isRoot && (step.phase === 'root' || step.phase === 'done') && (
              <text
                x={n.x} y={n.y - NODE_R - 5}
                textAnchor="middle" fontSize={9}
                fontFamily="monospace" fontWeight="bold"
                fill="#16a34a"
              >
                ROOT
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PHASE CHIP  colours
// ════════════════════════════════════════════════════════════════════════════

function phaseChip(phase: Phase, isEdgeCase?: boolean) {
  if (isEdgeCase) return 'bg-amber-50 border-amber-300 text-amber-700';
  const m: Record<Phase, string> = {
    init:   'bg-slate-100 border-slate-300 text-slate-600',
    nodes:  'bg-sky-50 border-sky-400 text-sky-700',
    attach: 'bg-amber-50 border-amber-400 text-amber-700',
    root:   'bg-emerald-50 border-emerald-400 text-emerald-700',
    done:   'bg-emerald-100 border-emerald-500 text-emerald-800',
    error:  'bg-rose-50 border-rose-400 text-rose-700',
  };
  return m[phase] ?? 'bg-slate-100 border-slate-300 text-slate-600';
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════

export default function CreateBinaryTreePage() {
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);
  const activeCase = TEST_CASES[activeCaseIdx];

  const [descriptions, setDescriptions] = useState<Description[]>(activeCase.descriptions);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState('');

  const [step, setStep]           = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed]         = useState(850);

  const animationSteps = useMemo(() => generateSteps(descriptions), [descriptions]);

  useEffect(() => { setStep(0); setIsPlaying(false); }, [animationSteps]);

  useEffect(() => {
    if (!isPlaying) return;
    if (step >= animationSteps.length - 1) { setIsPlaying(false); return; }
    const t = setTimeout(() => setStep(s => s + 1), speed);
    return () => clearTimeout(t);
  }, [isPlaying, step, animationSteps.length, speed]);

  const current: StepState = animationSteps[step] ?? animationSteps[0];
  const prevStep: StepState | null = step > 0 ? animationSteps[step - 1] : null;

  const switchCase = (idx: number) => {
    setActiveCaseIdx(idx);
    setDescriptions(TEST_CASES[idx].descriptions);
    setStep(0); setIsPlaying(false);
  };

  const applyEdit = () => {
    try {
      const parsed: number[][] = JSON.parse(editDraft);
      const valid: Description[] = parsed.map(row => {
        if (row.length !== 3) throw new Error();
        const [p, c, l] = row;
        if (l !== 0 && l !== 1) throw new Error();
        return [p, c, l as 0 | 1];
      });
      setDescriptions(valid);
      setIsEditing(false); setStep(0); setIsPlaying(false);
    } catch {
      alert('Invalid JSON. Expected [[parent, child, 0|1], ...]');
    }
  };

  const ACCENT_COLOR = 'bg-amber-600';
  const ACCENT_TEXT  = 'text-amber-600';
  const ACCENT_BORDER = 'border-amber-500';

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">

      {/* ── 1. Header / Tab strip ── */}
      <div className="bg-white border-b border-slate-100 shadow-sm px-4 pt-3 pb-0 flex-shrink-0">
        <div className="flex items-end gap-0">
          <div className={`flex items-center gap-2.5 px-5 py-3 border-b-2 ${ACCENT_BORDER} ${ACCENT_TEXT}`}>
            <Braces size={18} className={ACCENT_TEXT} />
            <div>
              <div className="text-sm font-bold leading-none">Create Binary Tree</div>
              <div className="text-[9px] font-normal mt-0.5 opacity-60">Node map + child set + root detection · LC #2196</div>
            </div>
            <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded border border-amber-300 text-amber-700 bg-amber-50">
              Medium
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. Test case selector ── */}
      <div className="bg-white border-b border-slate-100 px-4 py-2 flex items-center gap-3 flex-shrink-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Cases</span>
        <div className="flex items-center gap-1.5 overflow-x-auto flex-1">
          {TEST_CASES.map((tc, idx) => (
            <button key={idx} onClick={() => switchCase(idx)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
                activeCaseIdx === idx
                  ? `${ACCENT_COLOR} text-white border-transparent shadow-sm`
                  : tc.isEdgeCase
                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {tc.isEdgeCase && activeCaseIdx !== idx && <AlertTriangle size={9} />}
              {tc.label}
              {tc.isEdgeCase && <span className={`text-[8px] ml-0.5 ${activeCaseIdx === idx ? 'opacity-70' : 'text-amber-500'}`}>⚡</span>}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setEditDraft(JSON.stringify(descriptions)); setIsEditing(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100 flex-shrink-0"
        >
          <Settings2 size={11} /> Custom
        </button>
      </div>

      {/* ── 3. Main body ── */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

        {/* Canvas area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

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
            {(['init', 'nodes', 'attach', 'root', 'done'] as Phase[]).map(p => (
              <div key={p} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${phaseChip(p)} ${current.phase === p ? 'shadow-md scale-105' : 'opacity-50'}`}>
                {p}
              </div>
            ))}
          </div>

          {/* Descriptions list */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <ListTree size={13} /> Descriptions  <span className="font-mono font-normal text-slate-300">[[parent, child, isLeft], ...]</span>
            </h3>
            <div className="space-y-1.5">
              {descriptions.map(([p, c, l], i) => {
                const isActive  = current.descriptionIndex === i;
                const isDone    = current.descriptionIndex > i || current.phase === 'root' || current.phase === 'done';
                return (
                  <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all ${
                    isActive ? 'border-amber-400 bg-amber-50 scale-[1.01] shadow-sm' :
                    isDone   ? 'border-emerald-100 bg-emerald-50/50' :
                               'border-slate-100 bg-slate-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                        isActive ? 'bg-amber-500 text-white' : isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                      }`}>{i + 1}</span>
                      <span className="font-mono font-bold text-slate-700">[{p}, {c}, {l}]</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      <span>parent <span className="font-mono font-bold text-slate-600">{p}</span></span>
                      <span>child <span className="font-mono font-bold text-slate-600">{c}</span></span>
                      <span className={`font-bold px-1.5 py-0.5 rounded border ${l === 1 ? 'bg-sky-50 border-sky-300 text-sky-700' : 'bg-amber-50 border-amber-300 text-amber-700'}`}>
                        {l === 1 ? 'LEFT' : 'RIGHT'}
                      </span>
                      {isDone && !isActive && <CheckCircle2 size={12} className="text-emerald-400" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Node map + child set */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Info size={13} /> Node Map &amp; Child Set
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">All Nodes</div>
                <div className="flex flex-wrap gap-1.5">
                  {current.existingNodes.length === 0
                    ? <span className="text-slate-300 italic text-xs">none yet</span>
                    : current.existingNodes.map(v => (
                        <span key={v} className={`px-2 py-1 rounded-lg border font-mono text-xs font-bold transition-all ${
                          v === current.parentVal || v === current.childVal
                            ? 'border-amber-400 bg-amber-50 text-amber-800'
                            : 'border-slate-200 bg-slate-50 text-slate-700'
                        }`}>{v}</span>
                      ))
                  }
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Child Set <span className="text-slate-300 font-normal">(cannot be root)</span></div>
                <div className="flex flex-wrap gap-1.5">
                  {current.childSet.length === 0
                    ? <span className="text-slate-300 italic text-xs">none yet</span>
                    : current.childSet.map(v => (
                        <span key={v} className="px-2 py-1 rounded-lg border font-mono text-xs font-bold border-amber-300 bg-amber-50 text-amber-800">{v}</span>
                      ))
                  }
                </div>
              </div>
            </div>

            {/* Root candidate callout */}
            {(current.phase === 'root' || current.phase === 'done') && current.rootVal !== undefined && (
              <div className="mt-4 flex items-center gap-3 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
                <span className="text-xs text-emerald-700">
                  <span className="font-bold font-mono">{current.rootVal}</span> is not in the child set → it is the root.
                </span>
              </div>
            )}
          </div>

          {/* Tree canvas */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ListTree size={13} /> Tree Preview
              </h3>
              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold">
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-sky-400 inline-block rounded" /> Left child</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-400 inline-block rounded" /> Right child</span>
                {current.phase === 'done' && <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full border-2 border-emerald-500 inline-block" /> Root</span>}
              </div>
            </div>
            <TreeCanvas step={current} />
          </div>

          {/* Complexity */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-3">Complexity</div>
            <div className="flex gap-6 mb-2">
              <div>
                <div className="text-[9px] text-slate-400 uppercase">Time</div>
                <div className="font-mono text-lg font-black text-slate-800">O(n)</div>
              </div>
              <div>
                <div className="text-[9px] text-slate-400 uppercase">Space</div>
                <div className="font-mono text-lg font-black text-slate-800">O(n)</div>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Single pass over descriptions to build node map + child set. Root found in O(n) scan. Total O(n) time, O(n) space for the map.
            </p>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-slate-100 bg-white flex flex-col flex-shrink-0 overflow-y-auto">

          {/* Controller */}
          <div className="p-4 border-b border-slate-50">
            <div className="flex justify-between items-center mb-5">
              <button onClick={() => { setStep(0); setIsPlaying(false); }} title="Reset"
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <RotateCcw size={16} />
              </button>
              <button onClick={() => setStep(s => Math.max(0, s - 1))} title="Step back"
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <StepBack size={16} />
              </button>
              <button onClick={() => setIsPlaying(p => !p)}
                className={`w-11 h-11 flex items-center justify-center rounded-full transition-all shadow-md ${
                  isPlaying ? 'bg-amber-100 text-amber-600' : `${ACCENT_COLOR} text-white`
                }`}>
                {isPlaying
                  ? <Pause size={20} fill="currentColor" />
                  : <Play  size={20} fill="currentColor" className="ml-0.5" />}
              </button>
              <button onClick={() => setStep(s => Math.min(animationSteps.length - 1, s + 1))} title="Step forward"
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <StepForward size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                  <span>Speed</span><span>{speed}ms</span>
                </div>
                <input type="range" min="150" max="2000" step="50" value={speed}
                  onChange={e => setSpeed(parseInt(e.target.value))}
                  className="w-full accent-amber-600" />
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                  <span>Progress</span><span>{step + 1}/{animationSteps.length}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${ACCENT_COLOR} transition-all duration-300`}
                    style={{ width: `${((step + 1) / animationSteps.length) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Step Log */}
          <div className="p-4 border-b border-slate-50">
            <div className="flex items-center gap-2 mb-3">
              <Terminal size={11} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Step Log</span>
            </div>

            {prevStep && (
              <div className="mb-2 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-[9px] font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] border ${phaseChip(prevStep.phase, prevStep.isEdgeCase)}`}>
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

          {/* Live state summary */}
          <div className="p-4 border-b border-slate-50">
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-3">Live State</div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="p-2 bg-slate-50 rounded-lg">
                <div className="text-[8px] font-bold text-slate-400 uppercase">Nodes</div>
                <div className="text-xl font-black text-amber-600">{current.existingNodes.length}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <div className="text-[8px] font-bold text-slate-400 uppercase">Children</div>
                <div className="text-xl font-black text-amber-500">{current.childSet.length}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <div className="text-[8px] font-bold text-slate-400 uppercase">Edges</div>
                <div className="text-xl font-black text-slate-500">{current.edges.length}</div>
              </div>
            </div>

            {/* Current action highlight */}
            {(current.phase === 'nodes' || current.phase === 'attach') && current.parentVal !== undefined && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs">
                <div className="text-[9px] font-bold text-amber-500 uppercase mb-1">
                  {current.phase === 'nodes' ? 'Reading' : 'Attaching'}
                </div>
                <div className="flex items-center gap-2 font-mono font-bold">
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-800">{current.parentVal}</span>
                  <span className="text-slate-400">→</span>
                  <span className={`px-1.5 py-0.5 rounded border font-bold ${current.isLeft === 1 ? 'bg-sky-50 border-sky-300 text-sky-800' : 'bg-amber-100 border-amber-300 text-amber-800'}`}>
                    {current.isLeft === 1 ? 'L' : 'R'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-orange-50 border border-orange-300 text-orange-800">{current.childVal}</span>
                </div>
              </div>
            )}

            {(current.phase === 'root' || current.phase === 'done') && current.rootVal !== undefined && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <div>
                  <div className="text-[9px] font-bold text-emerald-500 uppercase">Root</div>
                  <div className="font-mono font-black text-emerald-700 text-lg">{current.rootVal}</div>
                </div>
              </div>
            )}
          </div>

          {/* Step counter */}
          <div className="p-4">
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Steps</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-slate-50 rounded-lg">
                <div className="text-[8px] font-bold text-slate-400 uppercase">Current</div>
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

      {/* Editor Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-2xl">
            <h2 className="text-lg font-bold mb-1">Custom Descriptions</h2>
            <p className="text-xs text-slate-400 mb-4">JSON array of [parent, child, 0|1] triples.</p>
            <textarea
              rows={6}
              value={editDraft}
              onChange={e => setEditDraft(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm mb-4 resize-none"
              placeholder='[[20,15,1],[20,17,0],[50,20,1]]'
            />
            <div className="flex gap-2">
              <button onClick={applyEdit}
                className={`flex-1 ${ACCENT_COLOR} text-white font-bold py-2 rounded-lg shadow-md hover:opacity-90`}>
                Build Tree
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