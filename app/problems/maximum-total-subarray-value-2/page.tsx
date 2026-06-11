"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  Braces,
  Play,
  Pause,
  RotateCcw,
  StepForward,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────

type Phase = string;

interface SegNode {
  max: number;
  min: number;
  low: number;
  high: number;
}

type SegmentTree = (SegNode | null)[];

interface Edge {
  parent: number;
  child: number;
}

interface SubarrayCandidate {
  id: number;
  l: number;
  r: number;
  max: number;
  min: number;
  value: number;
}

interface Step {
  phase: Phase;
  message: string;

  l: number | null;
  r: number | null;

  treeIndex: number | null;
  treeRange: { low: number; high: number } | null;
  visibleTreeNodes: number[];

  heapArray: number[];
  heapTopId: number | null;

  picks: { l: number; r: number; value: number }[];
  total: number;
}

// ─── Constants ──────────────────────────────────────────────────────────

const SOLUTIONS = [
  { id: 'brute-force', label: 'Brute Force (Generate & Sort)', complexity: 'O(n² log n)' },
  { id: 'optimized', label: 'Optimized (SegTree + Heap)', complexity: 'O(n log n + k log n)' }
];

const EDGE_CASES = [
  { id: 'example-1', label: 'Example 1', nums: [1, 3, 2], k: 2, description: 'Basic case with overlapping subarrays' },
  { id: 'example-2', label: 'Uniform Array', nums: [5, 5, 5, 5], k: 3, description: 'All elements same, value is always 0' },
  { id: 'example-3', label: 'Descending', nums: [5, 4, 3, 2, 1], k: 2, description: 'Strictly decreasing array' },
  { id: 'custom', label: 'Custom', nums: [], k: 0, description: 'Enter custom input' }
];

const BF_CODE_LINES: string[] = [
  "long long maxTotalValue(vector<int>& nums, int k) {",
  "  int n = nums.size();",
  "  vector<tuple<long long, int, int>> subarrays;",
  "",
  "  // 1. Generate all subarrays and calculate value",
  "  for (int l = 0; l < n; l++) {",
  "    for (int r = l; r < n; r++) {",
  "      int mx = *max_element(nums.begin()+l, nums.begin()+r+1);",
  "      int mn = *min_element(nums.begin()+l, nums.begin()+r+1);",
  "      subarrays.push_back({mx - mn, l, r});",
  "    }",
  "  }",
  "",
  "  // 2. Sort by value descending",
  "  sort(subarrays.rbegin(), subarrays.rend());",
  "",
  "  // 3. Sum the top k values",
  "  long long ans = 0;",
  "  for (int i = 0; i < k; i++) {",
  "    ans += get<0>(subarrays[i]);",
  "  }",
  "  return ans;",
  "}",
];

const OPT_CODE_LINES: string[] = [
  "struct Node { int mx, mn; };",
  "vector<Node> seg;",
  "",
  "void build(vector<int>& a, int idx, int l, int r) {",
  "  if (l == r) { seg[idx] = {a[l], a[l]}; return; }",
  "  int mid = (l + r) / 2;",
  "  build(a, idx*2, l, mid);",
  "  build(a, idx*2+1, mid+1, r);",
  "  seg[idx].mx = max(seg[idx*2].mx, seg[idx*2+1].mx);",
  "  seg[idx].mn = min(seg[idx*2].mn, seg[idx*2+1].mn);",
  "}",
  "",
  "Node query(int idx, int l, int r, int ql, int qr) {",
  "  if (r < ql || l > qr) return {-INF, INF};",
  "  if (ql <= l && r <= qr) return seg[idx];",
  "  int mid = (l + r) / 2;",
  "  return { max(query(2*idx, l, mid, ql, qr).mx,",
  "               query(2*idx+1, mid+1, r, ql, qr).mx),",
  "             min(query(2*idx, l, mid, ql, qr).mn,",
  "               query(2*idx+1, mid+1, r, ql, qr).mn) };",
  "}",
  "",
  "long long maxTotalValue(vector<int>& nums, int k) {",
  "  int n = nums.size();",
  "  seg.assign(4*n, {0,0});",
  "  build(nums, 1, 0, n-1);",
  "  priority_queue<tuple<long long, int, int>> pq;",
  "",
  "  // 1. Initialize heap with [l, n-1] for all l",
  "  for (int l = 0; l < n; l++) {",
  "    Node res = query(1, 0, n-1, l, n-1);",
  "    pq.push({res.mx - res.mn, l, n-1});",
  "  }",
  "",
  "  long long ans = 0;",
  "  // 2. Extract top k elements",
  "  while (k--) {",
  "    auto [val, l, r] = pq.top(); pq.pop();",
  "    ans += val;",
  "    if (r > l) {",
  "      Node nextRes = query(1, 0, n-1, l, r-1);",
  "      pq.push({nextRes.mx - nextRes.mn, l, r-1});",
  "    }",
  "  }",
  "  return ans;",
  "}",
];

// ─── Code Panel ────────────────────────────────────────────────────────

function CodePanel({ solution }: { solution: string }) {
  const lines = solution === 'brute-force' ? BF_CODE_LINES : OPT_CODE_LINES;
  const filename = solution === 'brute-force' ? 'brute_force.cpp' : 'segtree_heap_optimized.cpp';

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

// ─── Array Cell ────────────────────────────────────────────────────────

function ArrayCell({
  value,
  index,
  step,
}: {
  value: number;
  index: number;
  step: Step;
}) {
  const inRange =
    step.l != null && step.r != null && index >= step.l && index <= step.r;

  let bg = "bg-slate-800";
  let border = "border-slate-600";
  let textColor = "text-slate-50";

  if (inRange) {
    if (step.phase === "heap-pop" || step.phase === "update" || step.phase === "select") {
      bg = "bg-emerald-50";
      border = "border-emerald-500";
      textColor = "text-emerald-800";
    } else if (step.phase === "query-range" || step.phase === "generate") {
      bg = "bg-sky-50";
      border = "border-sky-500";
      textColor = "text-sky-800";
    } else {
      bg = "bg-amber-50";
      border = "border-amber-500";
      textColor = "text-amber-800";
    }
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] text-slate-400 font-mono leading-none">{index}</span>
      <div
        className={`
          w-10 h-10 flex items-center justify-center
          font-mono text-sm font-medium
          border rounded-md transition-all duration-200
          ${bg} ${border} ${textColor}
        `}
      >
        {value}
      </div>
    </div>
  );
}

// ─── Tree Layout helpers ───────────────────────────────────────────────

interface PositionedNode {
  index: number;
  x: number;
  y: number;
}

function computeTreePositions(
  indices: number[],
  maxDepth = 4
): PositionedNode[] {
  const result: PositionedNode[] = [];
  const byIndex = new Map<number, { depth: number; offset: number }>();
  indices.forEach((idx) => {
    const depth = Math.floor(Math.log2(idx));
    const firstAtDepth = 1 << depth;
    const offset = idx - firstAtDepth;
    byIndex.set(idx, { depth, offset });
  });

  const depthCounts: Record<number, number> = {};
  indices.forEach((idx) => {
    const d = Math.floor(Math.log2(idx));
    depthCounts[d] = (depthCounts[d] || 0) + 1;
  });

  indices.forEach((idx) => {
    const meta = byIndex.get(idx)!;
    const depth = meta.depth;
    if (depth >= maxDepth) return;
    const total = depthCounts[depth] || 1;
    const x = (meta.offset + 0.5) / total;
    const y = depth / (maxDepth - 1 || 1);
    result.push({ index: idx, x, y });
  });

  return result;
}

// ─── Segment Tree Diagram ─────────────────────────────────────────────

function SegmentTreeDiagram({
  tree,
  edges,
  step,
}: {
  tree: SegmentTree;
  edges: Edge[];
  step: Step;
}) {
  const visibleSet = new Set(step.visibleTreeNodes);
  const visibleIndices = tree
    .map((node, idx) => (node && visibleSet.has(idx) ? idx : -1))
    .filter((idx) => idx > 0);

  const positioned = computeTreePositions(visibleIndices, 5);

  const posByIdx = new Map<number, { x: number; y: number }>();
  positioned.forEach((p) => posByIdx.set(p.index, { x: p.x, y: p.y }));

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
        <p className="text-xs text-slate-500 font-medium mb-2"> Segment Tree (Range Max/Min Queries) </p>
    <div className="relative w-full h-64 bg-slate-50 rounded-md border border-slate-200 overflow-hidden">
  <svg viewBox="0 0 100 100" className="w-full h-full text-slate-700">
    {edges.map((e, i) => {
      if (!visibleSet.has(e.parent) || !visibleSet.has(e.child)) {
        return null;
      }

      const p = posByIdx.get(e.parent);
      const c = posByIdx.get(e.child);

      if (!p || !c) return null;

      // add 10% margin on all sides
      const px = 10 + p.x * 80;
      const py = 10 + p.y * 80;
      const cx = 10 + c.x * 80;
      const cy = 10 + c.y * 80;

      return (
        
        <line
          key={i}
          x1={px}
          y1={py}
          x2={cx}
          y2={cy}
          stroke="#cbd5f5"
          strokeWidth={1.2}
        />
      );
    })}

    {positioned.map((p) => {
      const node = tree[p.index];
      if (!node) return null;

      const isActive = step.treeIndex === p.index;

      const fill = isActive ? "#38bdf8" : "#e5e7eb";
      const stroke = isActive ? "#0ea5e9" : "#9ca3af";

      // add 10% margin on all sides
      const x = 10 + p.x * 80;
      const y = 10 + p.y * 80;

      return (
        
            <g key={p.index}>
        <circle
            cx={x}
            cy={y}
            r={6}
            fill={fill}
            stroke={stroke}
            strokeWidth={1}
        />

        <text
            x={x}
            y={y + 1}
            fontSize={4}
            textAnchor="middle"
            fill="#6a6afa"
            fontWeight="bold"
        >
            {node.max}|{node.min}
        </text>

        <text
            x={x}
            y={y + 11}
            fontSize={4}
            textAnchor="middle"
            fill="#6b7280"
        >
            [{node.low},{node.high}]
        </text>
        </g>
      );
    })}
  </svg>
</div>
</div>
  );
}

// ─── Heap Diagram ─────────────────────────────────────────────────────

function HeapDiagram({
  heapArray,
  candidates,
  step,
}: {
  heapArray: number[];
  candidates: SubarrayCandidate[];
  step: Step;
}) {
  const indices = heapArray.map((_, idx) => idx + 1);
  const positioned = computeTreePositions(indices, 5);
  const posByHeapIdx = new Map<number, { x: number; y: number }>();
  positioned.forEach((p) => posByHeapIdx.set(p.index, { x: p.x, y: p.y }));

  const edges: Edge[] = [];
  indices.forEach((idx) => {
    const parent = Math.floor(idx / 2);
    if (parent >= 1 && indices.includes(parent)) {
      edges.push({ parent, child: idx });
    }
  });

        return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-2">
            Max-Heap (Current State)
            </p>

            <div className="relative w-full h-64 bg-slate-50 rounded-md border border-slate-200 overflow-hidden">
            <svg viewBox="0 0 100 100" className="w-full h-full text-slate-700">
                {edges.map((e, i) => {
                const p = posByHeapIdx.get(e.parent);
                const c = posByHeapIdx.get(e.child);

                if (!p || !c) return null;

                // reserve 10% margin on every side
                const px = 10 + p.x * 80;
                const py = 10 + p.y * 80;

                const cx = 10 + c.x * 80;
                const cy = 10 + c.y * 80;

                return (
                    <line
                    key={i}
                    x1={px}
                    y1={py}
                    x2={cx}
                    y2={cy}
                    stroke="#facc15"
                    strokeWidth={1.2}
                    />
                );
                })}

                {positioned.map((p) => {
                const cId = heapArray[p.index - 1];
                const c = candidates[cId];

                if (!c) return null;

                const isTop = step.heapTopId === c.id;

                let fill = "#e5e7eb";
                let stroke = "#9ca3af";

                if (isTop) {
                    fill = "#bfdbfe";
                    stroke = "#3b82f6";
                }

                // reserve 10% margin on every side
                const x = 10 + p.x * 80;
                const y = 10 + p.y * 80;

                return (
                    <g key={p.index}>
                    <circle
                        cx={x}
                        cy={y}
                        r={4}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* heap value */}
                    <text
                        x={x}
                        y={y}
                        fontSize={2.8}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#1e293b"
                        fontWeight="700"
                    >
                        {c.value}
                    </text>

                    {/* represented interval */}
                    <text
                        x={x}
                        y={y + 8}
                        fontSize={3}
                        textAnchor="middle"
                        fill="#475569"
                    >
                        [{c.l},{c.r}]
                    </text>
                    </g>
                );
                })}
            </svg>
            </div>
        </div>
        );
}

// ─── Step Stack ────────────────────────────────────────────────────────

function StepStack({
  steps,
  currentIndex,
}: {
  steps: Step[];
  currentIndex: number;
}) {
  const stackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stackRef.current) {
      stackRef.current.scrollTop = stackRef.current.scrollHeight;
    }
  }, [currentIndex]);

  const visible = steps.slice(0, currentIndex + 1);

  const phaseColor = (phase: string) => {
    switch (phase) {
      case "init": return "border-l-slate-400 bg-slate-100";
      case "generate": return "border-l-indigo-500 bg-indigo-50";
      case "sort": return "border-l-purple-500 bg-purple-50";
      case "select": return "border-l-emerald-500 bg-emerald-50";
      case "build-segtree": return "border-l-indigo-500 bg-indigo-50";
      case "query-range": return "border-l-blue-500 bg-blue-50";
      case "heap-init": return "border-l-purple-500 bg-purple-50";
      case "heap-push": return "border-l-amber-500 bg-amber-50";
      case "heap-pop": return "border-l-emerald-500 bg-emerald-50";
      case "update": return "border-l-rose-500 bg-rose-50";
      case "done": return "border-l-emerald-600 bg-emerald-100";
      default: return "border-l-slate-400 bg-slate-100";
    }
  };

  const phaseIcon = (phase: string) => {
    switch (phase) {
      case "init": return "→";
      case "generate": return "G";
      case "sort": return "S";
      case "select": return "★";
      case "build-segtree": return "B";
      case "query-range": return "Q";
      case "heap-init": return "H";
      case "heap-push": return "+";
      case "heap-pop": return "★";
      case "update": return "Σ";
      case "done": return "■";
      default: return "·";
    }
  };

  return (
    <div
      ref={stackRef}
      className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1"
      style={{ scrollbarWidth: "thin" }}
    >
      {visible.map((step, i) => (
        <div
          key={i}
          className={`
            flex items-start gap-2 px-2 py-1.5 rounded-r border-l-2 text-xs
            transition-all duration-200
            ${phaseColor(step.phase)}
            ${i === currentIndex ? "opacity-100" : "opacity-70"}
          `}
        >
          <span className="font-mono font-bold text-slate-500 shrink-0 w-4">
            {phaseIcon(step.phase)}
          </span>
          <span className="text-slate-700 leading-snug">{step.message}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Max-Heap Implementation ───────────────────────────────────────────

class MaxHeap {
  private heap: { id: number; value: number }[] = [];

  push(id: number, value: number) {
    this.heap.push({ id, value });
    this.bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) return null;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  getArray() {
    return this.heap.map((x) => x.id);
  }

  private bubbleUp(i: number) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent].value < this.heap[i].value) {
        [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
        i = parent;
      } else break;
    }
  }

  private sinkDown(i: number) {
    const n = this.heap.length;
    while (true) {
      let largest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.heap[left].value > this.heap[largest].value)
        largest = left;
      if (right < n && this.heap[right].value > this.heap[largest].value)
        largest = right;
      if (largest !== i) {
        [this.heap[largest], this.heap[i]] = [this.heap[i], this.heap[largest]];
        i = largest;
      } else break;
    }
  }
}

// ─── Segment tree build + query with steps ─────────────────────────────

function buildSegmentTreeWithSteps(nums: number[]): {
  tree: SegmentTree;
  edges: Edge[];
  steps: Step[];
} {
  const n = nums.length;
  const tree: SegmentTree = Array(4 * n).fill(null);
  const edges: Edge[] = [];
  const steps: Step[] = [];
  const visibleNodes = new Set<number>();

  if (n === 0) return { tree, edges, steps };

  function build(
    index: number,
    low: number,
    high: number,
    parent: number | null
  ) {
    if (parent !== null) {
      edges.push({ parent, child: index });
    }
    visibleNodes.add(index);

    steps.push({
      phase: "build-segtree",
      message: `Building node ${index} for [${low}, ${high}].`,
      l: null, r: null, treeIndex: index, treeRange: { low, high },
      visibleTreeNodes: Array.from(visibleNodes), heapArray: [], heapTopId: null, picks: [], total: 0,
    });

    if (low === high) {
      tree[index] = { max: nums[low], min: nums[low], low, high };
      steps.push({
        phase: "build-segtree",
        message: `Leaf: nums[${low}] = ${nums[low]} → max = min = ${nums[low]}.`,
        l: low, r: low, treeIndex: index, treeRange: { low, high },
        visibleTreeNodes: Array.from(visibleNodes), heapArray: [], heapTopId: null, picks: [], total: 0,
      });
      return;
    }

    const mid = Math.floor((low + high) / 2);
    build(index * 2, low, mid, index);
    build(index * 2 + 1, mid + 1, high, index);

    const left = tree[index * 2]!;
    const right = tree[index * 2 + 1]!;
    tree[index] = {
      max: Math.max(left.max, right.max),
      min: Math.min(left.min, right.min),
      low, high,
    };

    steps.push({
      phase: "build-segtree",
      message: `Internal node: max = ${tree[index]!.max}, min = ${tree[index]!.min}.`,
      l: low, r: high, treeIndex: index, treeRange: { low, high },
      visibleTreeNodes: Array.from(visibleNodes), heapArray: [], heapTopId: null, picks: [], total: 0,
    });
  }

  build(1, 0, n - 1, null);
  return { tree, edges, steps };
}

function queryMaxMinWithSteps(
  tree: SegmentTree,
  nums: number[],
  ql: number,
  qr: number,
  visibleTreeNodes: Set<number>,
  currentHeapArray: number[],
  currentPicks: { l: number; r: number; value: number }[],
  currentTotal: number
): { max: number; min: number; steps: Step[] } {
  const steps: Step[] = [];
  const n = nums.length;
  if (n === 0) return { max: 0, min: 0, steps };

  function query(
    index: number,
    low: number,
    high: number
  ): { max: number; min: number } {
    if (high < ql || low > qr) {
      steps.push({
        phase: "query-range",
        message: `Node ${index} [${low}, ${high}] outside query [${ql}, ${qr}] — ignore.`,
        l: ql, r: qr, treeIndex: index, treeRange: { low, high },
        visibleTreeNodes: Array.from(visibleTreeNodes), heapArray: [...currentHeapArray], heapTopId: null, picks: [...currentPicks], total: currentTotal,
      });
      return { max: Number.NEGATIVE_INFINITY, min: Number.POSITIVE_INFINITY };
    }

    const node = tree[index]!;
    if (ql <= low && high <= qr) {
      steps.push({
        phase: "query-range",
        message: `Node ${index} [${low}, ${high}] fully in query → max = ${node.max}, min = ${node.min}.`,
        l: ql, r: qr, treeIndex: index, treeRange: { low, high },
        visibleTreeNodes: Array.from(visibleTreeNodes), heapArray: [...currentHeapArray], heapTopId: null, picks: [...currentPicks], total: currentTotal,
      });
      return { max: node.max, min: node.min };
    }

    steps.push({
      phase: "query-range",
      message: `Node ${index} [${low}, ${high}] partially overlaps query [${ql}, ${qr}] — split.`,
      l: ql, r: qr, treeIndex: index, treeRange: { low, high },
      visibleTreeNodes: Array.from(visibleTreeNodes), heapArray: [...currentHeapArray], heapTopId: null, picks: [...currentPicks], total: currentTotal,
    });

    const mid = Math.floor((low + high) / 2);
    const left = query(index * 2, low, mid);
    const right = query(index * 2 + 1, mid + 1, high);
    return { max: Math.max(left.max, right.max), min: Math.min(left.min, right.min) };
  }

  const res = query(1, 0, nums.length - 1);
  return { ...res, steps };
}

// ─── Brute Force Simulation ────────────────────────────────────────────

function buildBruteForceSteps(nums: number[], k: number) {
  const steps: Step[] = [];
  const n = nums.length;
  
  steps.push({
    phase: 'init',
    message: 'Initialize: We will generate all possible subarrays, calculate their values, and sort them.',
    l: null, r: null, treeIndex: null, treeRange: null, visibleTreeNodes: [], heapArray: [], heapTopId: null, picks: [], total: 0
  });

  const candidates: SubarrayCandidate[] = [];
  let id = 0;

  for (let l = 0; l < n; l++) {
    for (let r = l; r < n; r++) {
      let max = -Infinity, min = Infinity;
      for (let i = l; i <= r; i++) {
        max = Math.max(max, nums[i]);
        min = Math.min(min, nums[i]);
      }
      const value = max - min;
      candidates.push({ id: id++, l, r, max, min, value });
      
      steps.push({
        phase: 'generate',
        message: `Generate subarray [${l}, ${r}]: max=${max}, min=${min}, value=${value}.`,
        l, r, treeIndex: null, treeRange: null, visibleTreeNodes: [], heapArray: [], heapTopId: null, picks: [], total: 0
      });
    }
  }

  candidates.sort((a, b) => b.value - a.value);
  steps.push({
    phase: 'sort',
    message: `Sort all ${candidates.length} subarrays by value in descending order.`,
    l: null, r: null, treeIndex: null, treeRange: null, visibleTreeNodes: [], heapArray: [], heapTopId: null, picks: [], total: 0
  });

  let total = 0;
  const picks: { l: number; r: number; value: number }[] = [];
  const limit = Math.min(k, candidates.length);

  for (let i = 0; i < limit; i++) {
    const c = candidates[i];
    total += c.value;
    picks.push({ l: c.l, r: c.r, value: c.value });
    steps.push({
      phase: 'select',
      message: `Select [${c.l}, ${c.r}] with value ${c.value}. New total = ${total}.`,
      l: c.l, r: c.r, treeIndex: null, treeRange: null, visibleTreeNodes: [], heapArray: [], heapTopId: null, picks: [...picks], total
    });
  }

  steps.push({
    phase: 'done',
    message: `Done! Selected ${picks.length} subarrays. Maximum total value = ${total}.`,
    l: null, r: null, treeIndex: null, treeRange: null, visibleTreeNodes: [], heapArray: [], heapTopId: null, picks, total
  });

  return { steps, tree: [] as SegmentTree, edges: [] as Edge[], candidates };
}

// ─── Optimized Simulation ──────────────────────────────────────────────

function buildOptimizedSteps(nums: number[], k: number) {
  const { tree, edges, steps: buildSteps } = buildSegmentTreeWithSteps(nums);

  const steps: Step[] = [];
  steps.push({
    phase: "init",
    message: "Initialize: We use a Segment Tree for O(log n) range max/min queries and a Max-Heap to efficiently find the top k subarrays.",
    l: null, r: null, treeIndex: null, treeRange: null, visibleTreeNodes: [], heapArray: [], heapTopId: null, picks: [], total: 0,
  });

  steps.push(...buildSteps);

  const visibleTreeNodes = new Set(
    buildSteps.length ? buildSteps[buildSteps.length - 1].visibleTreeNodes : []
  );

  const candidates: SubarrayCandidate[] = [];
  let idCounter = 0;
  const heap = new MaxHeap();
  
  let total = 0;
  const picks: { l: number; r: number; value: number }[] = [];

  function queryTree(ql: number, qr: number) {
    const { max, min, steps: qSteps } = queryMaxMinWithSteps(
      tree, nums, ql, qr, visibleTreeNodes, heap.getArray(), picks, total
    );
    steps.push(...qSteps);
    return { max, min };
  }

  steps.push({
    phase: "heap-init",
    message: `Heap Init: For each left endpoint l, the max value is at r = n-1. We query the Segment Tree and push to heap.`,
    l: null, r: null, treeIndex: null, treeRange: null,
    visibleTreeNodes: Array.from(visibleTreeNodes), heapArray: [], heapTopId: null, picks: [], total: 0,
  });

  for (let l = 0; l < nums.length; l++) {
    const { max, min } = queryTree(l, nums.length - 1);
    const value = max - min;
    const cand = { id: idCounter++, l, r: nums.length - 1, max, min, value };
    candidates.push(cand);
    heap.push(cand.id, value);

    steps.push({
      phase: "heap-push",
      message: `Push [${l}, ${nums.length - 1}] with value ${value} to heap.`,
      l, r: nums.length - 1, treeIndex: null, treeRange: null,
      visibleTreeNodes: Array.from(visibleTreeNodes), heapArray: heap.getArray(), heapTopId: null, picks: [], total: 0,
    });
  }

  for (let i = 0; i < k; i++) {
    const top = heap.pop();
    if (!top) break;
    const c = candidates[top.id];

    const visualHeapArray = [c.id, ...heap.getArray()];
    
    // Add to picks immediately for better UX
    const newPick = { l: c.l, r: c.r, value: c.value };
    const newPicks = [...picks, newPick];
    const newTotal = total + c.value;

    steps.push({
      phase: "heap-pop",
      message: `Pop best candidate [${c.l}, ${c.r}] with value ${c.value} from heap.`,
      l: c.l, r: c.r, treeIndex: null, treeRange: null,
      visibleTreeNodes: Array.from(visibleTreeNodes), heapArray: visualHeapArray, heapTopId: c.id, picks: newPicks, total: newTotal,
    });

    total = newTotal;
    picks.push(newPick);

    steps.push({
      phase: "update",
      message: `Add ${c.value} to total. New total = ${total}.`,
      l: c.l, r: c.r, treeIndex: null, treeRange: null,
      visibleTreeNodes: Array.from(visibleTreeNodes), heapArray: visualHeapArray, heapTopId: c.id, picks: [...picks], total,
    });

    if (c.r > c.l) {
      const { max, min } = queryTree(c.l, c.r - 1);
      const newValue = max - min;
      const newCand = { id: idCounter++, l: c.l, r: c.r - 1, max, min, value: newValue };
      candidates.push(newCand);
      heap.push(newCand.id, newValue);

      steps.push({
        phase: "heap-push",
        message: `Since r > l, query [${c.l}, ${c.r - 1}] and push new candidate with value ${newValue} to heap.`,
        l: c.l, r: c.r - 1, treeIndex: null, treeRange: null,
        visibleTreeNodes: Array.from(visibleTreeNodes), heapArray: heap.getArray(), heapTopId: null, picks: [...picks], total,
      });
    }
  }

  steps.push({
    phase: "done",
    message: `Done! Selected ${picks.length} subarrays. Maximum total value = ${total}.`,
    l: null, r: null, treeIndex: null, treeRange: null,
    visibleTreeNodes: Array.from(visibleTreeNodes), heapArray: [], heapTopId: null, picks, total,
  });

  return { steps, tree, edges, candidates };
}

// ─── Main Component ────────────────────────────────────────────────────

export default function MaxTotalSubarrayVisualizer() {
  const [activeSolution, setActiveSolution] = useState<'brute-force' | 'optimized'>('optimized');
  const [activeEdgeCase, setActiveEdgeCase] = useState<string>('example-1');
  const [numsInput, setNumsInput] = useState("1,3,2,5,4");
  const [nums, setNums] = useState<number[]>([1, 3, 2, 5, 4]);
  const [k, setK] = useState(3);

  const [{ steps, tree, edges, candidates }, setSimulation] = useState<{
    steps: Step[];
    tree: SegmentTree;
    edges: Edge[];
    candidates: SubarrayCandidate[];
  }>(() => buildOptimizedSteps([1, 3, 2, 5, 4], 3));

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(700);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentStep = steps[currentStepIndex] ?? steps[0];

  const rebuild = useCallback(() => {
    const parsed = numsInput
      .split(",")
      .map((x) => x.trim())
      .filter((x) => x.length > 0)
      .map((x) => Number(x));

    if (parsed.some((x) => Number.isNaN(x)) || parsed.length === 0) {
      return;
    }

    setNums(parsed);
    const maxSubCount = (parsed.length * (parsed.length + 1)) / 2;
    const kk = Math.max(1, Math.min(k, maxSubCount));
    
    let sim;
    if (activeSolution === 'brute-force') {
      sim = buildBruteForceSteps(parsed, kk);
    } else {
      sim = buildOptimizedSteps(parsed, kk);
    }
    
    setSimulation(sim);
    setCurrentStepIndex(0);
    setPlaying(false);
  }, [numsInput, k, activeSolution]);

  useEffect(() => {
    rebuild();
  }, [rebuild]);

  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    if (!steps.length) return;

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

  useEffect(() => {
    if (playing && currentStepIndex >= steps.length - 1) {
      setPlaying(false);
    }
  }, [currentStepIndex, steps.length, playing]);

  const phases = activeSolution === 'brute-force' 
    ? ['init', 'generate', 'sort', 'select', 'done']
    : ['init', 'build-segtree', 'query-range', 'heap-init', 'heap-push', 'heap-pop', 'update', 'done'];

  const complexityInfo = activeSolution === 'brute-force' 
    ? {
        time: "O(n² log n)",
        space: "O(n²)",
        note: "Generates all n(n+1)/2 subarrays, calculates their value, sorts them, and picks the top k."
      }
    : {
        time: "O(n log n + k log n)",
        space: "O(n)",
        note: "Uses a Segment Tree for O(log n) range max/min queries and a Max-Heap to efficiently find the top k subarrays without enumerating all O(n²) possibilities."
      };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-6 overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-600 rounded-lg text-white shadow-lg">
            <Braces size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-none">
              Maximum Total Subarray Value II
            </h1>
            <p className="text-slate-500 text-xs mt-1 italic">
              {activeSolution === 'brute-force' ? 'Generate & Sort Approach' : 'Segment Tree + Max-Heap Approach'}
            </p>
          </div>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded border border-rose-300 text-rose-700 bg-rose-50">
          Hard • RMQ + Heap
        </span>
      </header>

      {/* Solution Tabs */}
      <div className="flex gap-2 mb-4 shrink-0 bg-slate-200/50 p-1 rounded-xl w-fit">
        {SOLUTIONS.map(sol => (
          <button
            key={sol.id}
            onClick={() => setActiveSolution(sol.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeSolution === sol.id 
                ? 'bg-white text-blue-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {sol.label}
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-mono">
              {sol.complexity}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 overflow-hidden">
        {/* Main left */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
          {/* Problem */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-sm text-slate-600 leading-relaxed">
              {activeSolution === 'brute-force' ? (
                <>
                  This visual generates all possible subarrays, calculates their value{" "}
                  <span className="font-mono text-xs">max(nums[l..r]) - min(nums[l..r])</span>,
                  sorts them, and picks the top{" "}
                  <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">k</code>.
                </>
              ) : (
                <>
                  This visual builds the segment tree node by node, then uses a Max-Heap to efficiently
                  extract the top{" "}
                  <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">k</code>{" "}
                  subarrays by value{" "}
                  <span className="font-mono text-xs">max(nums[l..r]) - min(nums[l..r])</span>{" "}
                  without enumerating all O(n²) possibilities.
                </>
              )}
            </p>
          </div>

          {/* Phase chips */}
          <div className="flex gap-2 flex-wrap">
            {phases.map((p) => (
              <div
                key={p}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  currentStep.phase === p
                    ? "bg-blue-600 border-blue-600 text-white shadow-md"
                    : "bg-white border-slate-200 text-slate-400"
                }`}
              >
                {p.toUpperCase()}
              </div>
            ))}
          </div>

          {/* Array display */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-500 font-medium">Array nums</p>
              <div className="flex gap-3 text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-sky-50 border border-sky-400 inline-block" />
                  {activeSolution === 'brute-force' ? 'Generating' : 'Segment query'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-emerald-50 border border-emerald-500 inline-block" />
                  Chosen
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {nums.map((v, i) => (
                <ArrayCell key={i} value={v} index={i} step={currentStep} />
              ))}
            </div>
            {currentStep.l != null && currentStep.r != null && (
              <div className="mt-2 text-xs text-slate-600 font-mono">
                Subarray:{" "}
                <span className="text-slate-900">
                  [{currentStep.l}…{currentStep.r}]
                </span>{" "}
                → "[{nums.slice(currentStep.l, currentStep.r + 1).join(", ")}]"
              </div>
            )}
          </div>

            {activeSolution === 'optimized' && (
            <div className="rounded-xl border-none bg-white  shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                
                   
                    <SegmentTreeDiagram
                    tree={tree}
                    edges={edges}
                    step={currentStep}
                    />


                
                    <HeapDiagram
                    heapArray={currentStep.heapArray}
                    candidates={candidates}
                    step={currentStep}
                    />
                

                </div>
            </div>
            )}
          {/* Selected Subarrays */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-2">
              Selected Subarrays ({currentStep.picks.length}/{k})
            </p>
            <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
              {currentStep.picks.map((p, i) => (
                <div
                  key={i}
                  className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-mono rounded border border-emerald-200"
                >
                  [{p.l},{p.r}] = {p.value}
                </div>
              ))}
              {currentStep.picks.length === 0 && (
                <span className="text-xs text-slate-400 italic">None yet</span>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-medium">Total Value:</span>
              <span className="text-lg font-bold font-mono text-emerald-600">{currentStep.total}</span>
            </div>
          </div>

          {/* Step log */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-2">Step log</p>
            <StepStack steps={steps} currentIndex={currentStepIndex} />
          </div>

          {/* Code Panel */}
          <CodePanel solution={activeSolution} />
        </div>

        {/* Right side */}
        <div className="w-full lg:w-80 flex flex-col gap-4 overflow-y-auto">
          {/* Test Cases Panel */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-3">
            <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-medium">Test Cases</p>
            <div className="flex flex-wrap gap-2">
              {EDGE_CASES.map(ec => (
                <button
                  key={ec.id}
                  onClick={() => {
                    setActiveEdgeCase(ec.id);
                    if (ec.id !== 'custom') {
                      setNumsInput(ec.nums.join(', '));
                      setK(ec.k);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeEdgeCase === ec.id 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {ec.label}
                </button>
              ))}
            </div>
            {activeEdgeCase !== 'custom' && (
              <p className="text-[10px] text-slate-500 italic">
                {EDGE_CASES.find(ec => ec.id === activeEdgeCase)?.description}
              </p>
            )}
          </div>

          {/* Input */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-2">
            <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-medium">Input Configuration</p>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wide">nums (comma-separated)</label>
                <input
                  type="text"
                  value={numsInput}
                  onChange={(e) => {
                    setNumsInput(e.target.value);
                    setActiveEdgeCase('custom');
                  }}
                  className="font-mono text-xs px-2 py-1.5 rounded border border-slate-200 bg-slate-50 text-slate-900"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wide">k</label>
                <input
                  type="number"
                  min={1}
                  value={k}
                  onChange={(e) => {
                    setK(Number(e.target.value) || 1);
                    setActiveEdgeCase('custom');
                  }}
                  className="font-mono text-xs px-2 py-1.5 rounded border border-slate-200 bg-slate-50 text-slate-900 w-24"
                />
              </div>
              <button
                onClick={rebuild}
                className="mt-1 px-3 py-1.5 rounded border border-slate-300 text-xs text-slate-800 hover:bg-slate-100 transition-colors"
              >
                Rebuild steps
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              For clarity, keep n ≤ 10 so node diagrams stay readable.
            </p>
          </div>

          {/* Controls */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-2">Animation Controls</p>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <button
                onClick={() => setCurrentStepIndex(0)}
                disabled={currentStepIndex === 0}
                className="p-2 text-xs rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => setCurrentStepIndex((p) => Math.max(0, p - 1))}
                disabled={currentStepIndex === 0}
                className="p-2 text-xs rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
              >
                ←
              </button>
              <button
                onClick={() => setPlaying((p) => !p)}
                disabled={currentStepIndex >= steps.length - 1}
                className={`px-4 py-1.5 text-xs rounded-full border border-slate-300 font-medium flex items-center gap-1 ${
                  playing ? "bg-amber-50 text-amber-800" : "bg-blue-600 text-white shadow-md"
                }`}
              >
                {playing ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Play</>}
              </button>
              <button
                onClick={() => setCurrentStepIndex((p) => Math.min(steps.length - 1, p + 1))}
                disabled={currentStepIndex >= steps.length - 1}
                className="p-2 text-xs rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
              >
                <StepForward size={16} />
              </button>
            </div>
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
            <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-200"
                style={{
                  width: steps.length ? `${((currentStepIndex + 1) / steps.length) * 100}%` : "0%",
                }}
              />
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
                <p className="font-mono text-sm text-slate-900">{complexityInfo.time}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide">Space</span>
                <p className="font-mono text-sm text-slate-900">{complexityInfo.space}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mt-2">{complexityInfo.note}</p>
          </div>
        </div>
      </div>
    </div>
  );
}