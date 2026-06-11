'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Play, Pause, RotateCcw, StepForward,
  Navigation, GitBranch, Zap, CheckCircle2, Circle, ArrowRight
} from 'lucide-react';

// ─── Graph Definition ────────────────────────────────────────────────────────

const DEFAULT_NODES = [
  { id: 0, label: 'A', x: 180, y: 80  },
  { id: 1, label: 'B', x: 380, y: 60  },
  { id: 2, label: 'C', x: 520, y: 180 },
  { id: 3, label: 'D', x: 400, y: 300 },
  { id: 4, label: 'E', x: 200, y: 300 },
  { id: 5, label: 'F', x: 80,  y: 200 },
];

const DEFAULT_EDGES = [
  { u: 0, v: 1, w: 4  },
  { u: 0, v: 5, w: 2  },
  { u: 1, v: 2, w: 5  },
  { u: 1, v: 3, w: 10 },
  { u: 2, v: 3, w: 3  },
  { u: 3, v: 4, w: 4  },
  { u: 4, v: 5, w: 1  },
  { u: 0, v: 4, w: 7  },
  { u: 5, v: 1, w: 8  },
];

const DEFAULT_SOURCE = 0;

// ─── Animation Step Type (inline for single-file) ─────────────────────────────
interface DijkstraNode { id: number; label: string; x: number; y: number; }
interface DijkstraEdge { u: number; v: number; w: number; }
interface DijkstraStep {
  dist: number[];
  prev: number[];
  visited: boolean[];
  activeNode: number;
  activeEdge: { u: number; v: number } | null;
  relaxedEdge: { u: number; v: number } | null;
  phase: string;
  message: string;
}
// phase: 'init' | 'pick' | 'relax' | 'settled' | 'final'

// ─── Step Generator ───────────────────────────────────────────────────────────

function generateDijkstraSteps(nodes: DijkstraNode[], edges: DijkstraEdge[], sourceId: number): DijkstraStep[] {
  const n = nodes.length;
  const INF = Infinity;
  const steps = [];

  // Build adjacency list
  const adj: Array<Array<{ to: number; w: number }>> = Array.from({ length: n }, () => []);
  edges.forEach(({ u, v, w }: DijkstraEdge) => {
    adj[u].push({ to: v, w });
    adj[v].push({ to: u, w });
  });

  const dist    = Array(n).fill(INF);
  const prev    = Array(n).fill(-1);
  const visited = Array(n).fill(false);

  dist[sourceId] = 0;

  const snap = (extra: Partial<DijkstraStep> = {}): DijkstraStep => ({
    dist:           [...dist],
    prev:           [...prev],
    visited:        [...visited],
    activeNode:     -1,
    activeEdge:     null,   // { u, v }
    relaxedEdge:    null,   // { u, v } — edge that just improved
    phase:          'init',
    message:        '',
    ...extra,
  });

  // INIT
  steps.push(snap({
    phase:   'init',
    message: `Initialising: distance to source node ${nodes[sourceId].label} = 0. All others = ∞.`,
  }));

  for (let iter = 0; iter < n; iter++) {
    // Pick the unvisited node with smallest distance (min-priority-queue step)
    let u = -1;
    for (let i = 0; i < n; i++) {
      if (!visited[i] && dist[i] < INF) {
        if (u === -1 || dist[i] < dist[u]) u = i;
      }
    }
    if (u === -1) break; // remaining nodes unreachable

    // Announce pick
    steps.push(snap({
      phase:      'pick',
      activeNode: u,
      message:    `Picking node ${nodes[u].label} — smallest known distance: ${dist[u]}.`,
    }));

    // Mark visited
    visited[u] = true;

    steps.push(snap({
      phase:      'settled',
      activeNode: u,
      message:    `Node ${nodes[u].label} is now settled. Its shortest distance (${dist[u]}) is finalised.`,
    }));

    // Relax neighbours
    for (const { to: v, w } of adj[u]) {
      if (visited[v]) continue;

      const newDist = dist[u] + w;

      // Show we're examining this edge
      steps.push(snap({
        phase:      'relax',
        activeNode: u,
        activeEdge: { u, v },
        message:    `Examining edge ${nodes[u].label} → ${nodes[v].label} (weight ${w}). Current dist[${nodes[v].label}] = ${dist[v] === INF ? '∞' : dist[v]}, candidate = ${dist[u]} + ${w} = ${newDist}.`,
      }));

      if (newDist < dist[v]) {
        const oldDist = dist[v];
        dist[v] = newDist;
        prev[v] = u;

        steps.push(snap({
          phase:       'relax',
          activeNode:  u,
          activeEdge:  { u, v },
          relaxedEdge: { u, v },
          message:     `Improved! dist[${nodes[v].label}] updated ${oldDist === INF ? '∞' : oldDist} → ${newDist} via ${nodes[u].label}.`,
        }));
      } else {
        steps.push(snap({
          phase:      'relax',
          activeNode: u,
          activeEdge: { u, v },
          message:    `No improvement. dist[${nodes[v].label}] stays at ${dist[v]}.`,
        }));
      }
    }
  }

  // Final
  steps.push(snap({
    phase:   'final',
    message: `Done! Shortest distances from ${nodes[sourceId].label}: ${nodes.map((nd: DijkstraNode, i: number) => `${nd.label}=${dist[i] === INF ? '∞' : dist[i]}`).join(', ')}.`,
  }));

  return steps;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function reconstructPath(prev: number[], target: number): number[] {
  const path = [];
  let cur = target;
  while (cur !== -1) { path.unshift(cur); cur = prev[cur]; }
  return path.length > 1 || path[0] === target ? path : [];
}

function edgeKey(u: number, v: number): string { return u < v ? `${u}-${v}` : `${v}-${u}`; }

// ─── SVG Graph ────────────────────────────────────────────────────────────────

function GraphCanvas({ nodes, edges, current, sourceId, hoveredTarget }: {
  nodes: DijkstraNode[];
  edges: DijkstraEdge[];
  current: DijkstraStep;
  sourceId: number;
  hoveredTarget: number | null;
}) {
  const { dist, prev, visited, activeNode, activeEdge, relaxedEdge } = current;

  // Build shortest-path tree edges from prev[]
  const treeEdgeKeys = new Set<string>();
  prev.forEach((p: number, i: number) => { if (p !== -1) treeEdgeKeys.add(edgeKey(p, i)); });

  // Path to hovered target
  const pathNodes = new Set();
  const pathEdgeKeys = new Set();
  if (hoveredTarget !== null && hoveredTarget !== undefined) {
    const path = reconstructPath(prev, hoveredTarget);
    path.forEach(n => pathNodes.add(n));
    for (let i = 0; i + 1 < path.length; i++) pathEdgeKeys.add(edgeKey(path[i], path[i + 1]));
  }

  const activeEdgeKey = activeEdge ? edgeKey(activeEdge.u, activeEdge.v) : null;
  const relaxedEdgeKey = relaxedEdge ? edgeKey(relaxedEdge.u, relaxedEdge.v) : null;

  return (
    <svg viewBox="0 0 620 380" className="w-full h-full" style={{ fontFamily: 'monospace' }}>
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#64748b" />
        </marker>
        <marker id="arrow-active" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#f59e0b" />
        </marker>
        <marker id="arrow-relaxed" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#10b981" />
        </marker>
        <marker id="arrow-path" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#6366f1" />
        </marker>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Edges */}
      {edges.map((e: DijkstraEdge, idx: number) => {
        const key = edgeKey(e.u, e.v);
        const n1 = nodes[e.u], n2 = nodes[e.v];
        const mx = (n1.x + n2.x) / 2;
        const my = (n1.y + n2.y) / 2;

        const isActive  = key === activeEdgeKey;
        const isRelaxed = key === relaxedEdgeKey;
        const isTree    = treeEdgeKeys.has(key) && current.phase !== 'init';
        const isPath    = pathEdgeKeys.has(key);

        let stroke = '#e2e8f0';
        let strokeW = 2;
        let opacity = 0.6;
        if (isPath)    { stroke = '#6366f1'; strokeW = 3.5; opacity = 1; }
        else if (isRelaxed) { stroke = '#10b981'; strokeW = 3; opacity = 1; }
        else if (isActive)  { stroke = '#f59e0b'; strokeW = 3; opacity = 1; }
        else if (isTree)    { stroke = '#94a3b8'; strokeW = 2.5; opacity = 0.8; }

        return (
          <g key={idx}>
            <line
              x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y}
              stroke={stroke} strokeWidth={strokeW} opacity={opacity}
              style={{ transition: 'all 0.3s' }}
              filter={isRelaxed || isPath ? 'url(#glow)' : undefined}
            />
            {/* Weight label */}
            <rect x={mx - 11} y={my - 10} width={22} height={18} rx={4}
              fill={isActive || isRelaxed ? (isRelaxed ? '#d1fae5' : '#fef3c7') : '#f8fafc'}
              stroke={isActive || isRelaxed ? (isRelaxed ? '#10b981' : '#f59e0b') : '#e2e8f0'}
              strokeWidth={1}
            />
            <text x={mx} y={my + 4} textAnchor="middle" fontSize={11}
              fill={isRelaxed ? '#065f46' : isActive ? '#92400e' : '#64748b'}
              fontWeight={isActive || isRelaxed ? 'bold' : 'normal'}
            >
              {e.w}
            </text>
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map((node: DijkstraNode) => {
        const isSource   = node.id === sourceId;
        const isActive   = node.id === activeNode;
        const isVisited  = visited[node.id];
        const isPath     = pathNodes.has(node.id);
        const d          = dist[node.id];

        let fill = '#f8fafc';
        let stroke = '#cbd5e1';
        let strokeW = 2;
        if (isPath)    { fill = '#eef2ff'; stroke = '#6366f1'; strokeW = 3; }
        else if (isActive)  { fill = '#fef3c7'; stroke = '#f59e0b'; strokeW = 3; }
        else if (isVisited) { fill = '#f0fdf4'; stroke = '#22c55e'; strokeW = 2; }
        else if (isSource)  { fill = '#eff6ff'; stroke = '#3b82f6'; strokeW = 2.5; }

        return (
          <g key={node.id} style={{ transition: 'all 0.3s' }}
            filter={isActive || isPath ? 'url(#glow)' : undefined}
          >
            <circle cx={node.x} cy={node.y} r={28}
              fill={fill} stroke={stroke} strokeWidth={strokeW}
              style={{ transition: 'all 0.3s' }}
            />
            {/* Node label */}
            <text x={node.x} y={node.y - 2} textAnchor="middle" fontSize={16}
              fontWeight="900" fill={isActive ? '#92400e' : isVisited ? '#166534' : '#1e293b'}
            >
              {node.label}
            </text>
            {/* Distance badge */}
            <text x={node.x} y={node.y + 13} textAnchor="middle" fontSize={9}
              fill={isActive ? '#d97706' : isVisited ? '#16a34a' : '#64748b'}
              fontWeight="bold"
            >
              {d === Infinity ? '∞' : d}
            </text>
            {/* Settled checkmark */}
            {isVisited && !isActive && (
              <text x={node.x + 18} y={node.y - 16} fontSize={12} fill="#22c55e">✓</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Distance Table ───────────────────────────────────────────────────────────

function DistanceTable({ nodes, current, sourceId, onHoverTarget, hoveredTarget }: {
  nodes: DijkstraNode[];
  current: DijkstraStep;
  sourceId: number;
  onHoverTarget: (id: number | null) => void;
  hoveredTarget: number | null;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
        <Navigation size={13} className="text-slate-400" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Distance Table</span>
      </div>
      <div className="divide-y divide-slate-50">
        {nodes.map((node: DijkstraNode) => {
          const d = current.dist[node.id];
          const p = current.prev[node.id];
          const isSettled = current.visited[node.id];
          const isActive  = current.activeNode === node.id;
          const isSource  = node.id === sourceId;
          const isHovered = hoveredTarget === node.id;

          return (
            <div
              key={node.id}
              className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-all ${
                isHovered  ? 'bg-indigo-50' :
                isActive   ? 'bg-amber-50' :
                isSettled  ? 'bg-emerald-50/50' : 'hover:bg-slate-50'
              }`}
              onMouseEnter={() => !isSource && onHoverTarget(node.id)}
              onMouseLeave={() => onHoverTarget(null)}
            >
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black border ${
                  isActive  ? 'bg-amber-100 border-amber-300 text-amber-700' :
                  isSettled ? 'bg-emerald-100 border-emerald-300 text-emerald-700' :
                  isSource  ? 'bg-blue-100 border-blue-300 text-blue-700' :
                              'bg-slate-100 border-slate-200 text-slate-600'
                }`}>
                  {node.label}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  via {p !== -1 ? nodes[p].label : '—'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-black tabular-nums ${
                  d === Infinity ? 'text-slate-300' :
                  isActive       ? 'text-amber-600' :
                  isSettled      ? 'text-emerald-600' : 'text-slate-700'
                }`}>
                  {d === Infinity ? '∞' : d}
                </span>
                {isSettled && <CheckCircle2 size={13} className="text-emerald-500" />}
                {!isSettled && d !== Infinity && <Circle size={13} className="text-slate-300" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Phase Badge ──────────────────────────────────────────────────────────────

function PhaseBadge({ phase }: { phase: string }) {
  const configs = {
    init:    { label: 'Initialise',   color: 'bg-slate-100 text-slate-500 border-slate-200' },
    pick:    { label: 'Pick Min',     color: 'bg-amber-100 text-amber-700 border-amber-300' },
    relax:   { label: 'Relax Edges', color: 'bg-sky-100 text-sky-700 border-sky-300' },
    settled: { label: 'Settled',      color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    final:   { label: 'Complete',     color: 'bg-indigo-100 text-indigo-700 border-indigo-300' },
  };
  const cfg = configs[phase as keyof typeof configs] || configs.init;
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ─── Test Case Editor (Modal) ────────────────────────────────────────────────

function TestCaseEditor({ isOpen, onClose, edges, onEdgesChange, onReset }: {
  isOpen: boolean;
  onClose: () => void;
  edges: DijkstraEdge[];
  onEdgesChange: (e: DijkstraEdge[]) => void;
  onReset: () => void;
}) {
  const [newEdgeU, setNewEdgeU] = useState('');
  const [newEdgeV, setNewEdgeV] = useState('');
  const [newEdgeW, setNewEdgeW] = useState('1');
  const [editingEdges, setEditingEdges] = useState(edges);
  const [edgeListInput, setEdgeListInput] = useState('');
  const [parseError, setParseError] = useState('');

  // Sync edges when prop changes or modal opens
  useEffect(() => {
    setEditingEdges(edges);
    setEdgeListInput('');
    setParseError('');
  }, [edges, isOpen]);

  const handleAddEdge = () => {
    if (!newEdgeU.trim() || !newEdgeV.trim() || newEdgeU === newEdgeV) return;
    const u = parseInt(newEdgeU);
    const v = parseInt(newEdgeV);
    if (isNaN(u) || isNaN(v)) return;
    const w = Math.max(1, parseInt(newEdgeW) || 1);
    
    // Check if edge already exists
    const edgeExists = editingEdges.some(e => (e.u === u && e.v === v) || (e.u === v && e.v === u));
    if (edgeExists) return;

    setEditingEdges([...editingEdges, { u, v, w }]);
    setNewEdgeU('');
    setNewEdgeV('');
    setNewEdgeW('1');
  };

  const handleRemoveEdge = (idx: number) => {
    setEditingEdges(editingEdges.filter((_, i) => i !== idx));
  };

  const handleParseEdgeList = () => {
    setParseError('');
    if (!edgeListInput.trim()) {
      setParseError('Please paste an edge list');
      return;
    }

    try {
      const lines = edgeListInput
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));

      const parsedEdges: DijkstraEdge[] = [];

      for (const line of lines) {
        const parts = line.split(/[\s,\t]+/).filter(p => p);
        
        if (parts.length !== 3) {
          throw new Error(`Invalid format: "${line}" should be "FromNode ToNode Weight"`);
        }

        const u = parseInt(parts[0]);
        const v = parseInt(parts[1]);
        const w = parseInt(parts[2]);

        if (isNaN(u) || isNaN(v) || isNaN(w)) {
          throw new Error(`Invalid format: "${line}" - nodes and weight must be numbers`);
        }

        if (w < 1) {
          throw new Error(`Invalid weight in "${line}" - weight must be >= 1`);
        }

        if (u === v) {
          throw new Error(`Invalid edge: "${line}" - nodes cannot be the same`);
        }

        // Check for duplicates
        const edgeExists = parsedEdges.some(e => (e.u === u && e.v === v) || (e.u === v && e.v === u));
        if (!edgeExists) {
          parsedEdges.push({ u, v, w });
        }
      }

      if (parsedEdges.length === 0) {
        throw new Error('No valid edges found');
      }

      setEditingEdges(parsedEdges);
      setEdgeListInput('');
      setParseError('');
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Parse error');
    }
  };

  const handleApply = () => {
    onEdgesChange(editingEdges);
    onClose();
  };

  const nodeLabels = DEFAULT_NODES.map(n => ({ id: n.id, label: n.label }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl p-6 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Edit Graph</h2>
          <button onClick={onReset} className="text-xs font-bold text-slate-500 hover:text-slate-700 px-3 py-1 rounded hover:bg-slate-100 transition">
            Reset Defaults
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Left Column: Manual Add */}
          <div className="space-y-4">
            {/* Add New Edge */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="text-sm font-bold text-slate-700 mb-3">Add Edge Manually</h3>
              <div className="space-y-2 mb-3">
                <div className="flex gap-2">
                  <select
                    value={newEdgeU}
                    onChange={(e) => setNewEdgeU(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">From node...</option>
                    {nodeLabels.map(n => (
                      <option key={n.id} value={n.id}>{n.label}</option>
                    ))}
                  </select>
                  <select
                    value={newEdgeV}
                    onChange={(e) => setNewEdgeV(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">To node...</option>
                    {nodeLabels.map(n => (
                      <option key={n.id} value={n.id}>{n.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Weight"
                    min="1"
                    value={newEdgeW}
                    onChange={(e) => setNewEdgeW(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm text-center focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                  />
                  <button
                    onClick={handleAddEdge}
                    disabled={!newEdgeU || !newEdgeV || newEdgeU === newEdgeV}
                    className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Edge List */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-3">Edges ({editingEdges.length})</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {editingEdges.length === 0 ? (
                  <div className="text-sm text-slate-400 italic p-3 bg-slate-50 rounded">No edges. Add one above.</div>
                ) : (
                  editingEdges.map((edge: DijkstraEdge, idx: number) => {
                    const uLabel = nodeLabels.find(n => n.id === edge.u)?.label || edge.u;
                    const vLabel = nodeLabels.find(n => n.id === edge.v)?.label || edge.v;
                    return (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200 hover:border-slate-300">
                        <span className="text-sm font-mono text-slate-600 flex-1">{uLabel} → {vLabel}</span>
                        <input
                          type="number"
                          min="1"
                          value={edge.w}
                          onChange={(e) => {
                            const newEdges = [...editingEdges];
                            newEdges[idx].w = Math.max(1, parseInt(e.target.value) || 1);
                            setEditingEdges(newEdges);
                          }}
                          className="w-16 px-2 py-1 border border-slate-300 rounded text-center text-xs font-mono focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                        />
                        <button
                          onClick={() => handleRemoveEdge(idx)}
                          className="px-3 py-1 text-red-600 hover:bg-red-50 rounded text-sm font-bold transition"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Paste Edge List */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col">
            <h3 className="text-sm font-bold text-slate-700 mb-2">Paste Edge List</h3>
            <p className="text-xs text-slate-500 mb-2">Format: one edge per line<br/>Example: <code className="bg-white px-1 py-0.5 rounded">0 1 4</code></p>
            <textarea
              value={edgeListInput}
              onChange={(e) => {
                setEdgeListInput(e.target.value);
                setParseError('');
              }}
              placeholder="0 1 4
0 5 2
1 2 5
1 3 10
2 3 3
3 4 4
4 5 1
0 4 7
5 1 8"
              className="flex-1 px-3 py-2 border border-slate-300 rounded text-xs font-mono focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200 mb-2 resize-none"
            />
            {parseError && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded mb-2">
                {parseError}
              </div>
            )}
            <button
              onClick={handleParseEdgeList}
              disabled={!edgeListInput.trim()}
              className="w-full px-3 py-2 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Parse & Replace
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={handleApply}
            className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            Apply Changes
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-slate-100 text-slate-600 font-bold py-2 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DijkstraPage() {
  const [nodes, setNodes] = useState(DEFAULT_NODES);
  const [edges, setEdges] = useState(DEFAULT_EDGES);
  const [sourceId, setSourceId] = useState(DEFAULT_SOURCE);
  const [showTestEditor, setShowTestEditor] = useState(false);

  const [step, setStep]         = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed]       = useState(900);
  const [hoveredTarget, setHoveredTarget] = useState<number | null>(null);

  const animationSteps = useMemo(
    () => generateDijkstraSteps(nodes, edges, sourceId),
    [nodes, edges, sourceId]
  );

  const handleReset = () => {
    setNodes(DEFAULT_NODES);
    setEdges(DEFAULT_EDGES);
    setSourceId(DEFAULT_SOURCE);
    setStep(0);
    setIsPlaying(false);
    setShowTestEditor(false);
  };

  const handleEdgesChange = (newEdges: DijkstraEdge[]) => {
    setEdges(newEdges);
    setStep(0);
    setIsPlaying(false);
  };

  const handleSourceChange = (id: number) => {
    setSourceId(id);
    setStep(0);
    setIsPlaying(false);
  };

  // Playback
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isPlaying && step < animationSteps.length - 1) {
      timer = setTimeout(() => setStep(s => s + 1), speed);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isPlaying, step, animationSteps.length, speed]);

  useEffect(() => {
    if (isPlaying && step >= animationSteps.length - 1) {
      Promise.resolve().then(() => setIsPlaying(false));
    }
  }, [step, isPlaying, animationSteps.length]);

  const current = animationSteps[step] as DijkstraStep || (animationSteps[0] as DijkstraStep);

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-6 overflow-hidden">

      {/* ── Header ── */}
      <header className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-600 rounded-lg text-white shadow-lg">
            <GitBranch size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-none">
              Dijkstra&apos;s Shortest Path
            </h1>
            <p className="text-slate-500 text-xs mt-1 italic">
              Step-by-step greedy relaxation on a weighted graph
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PhaseBadge phase={current.phase} />
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 h-full overflow-hidden">

        {/* ── Main: Graph Canvas ── */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">

          {/* Graph */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 relative" style={{ minHeight: 380 }}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Zap size={13} /> Graph Traversal
              </h3>
              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold">
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-400 inline-block rounded"></span> Active</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-400 inline-block rounded"></span> Relaxed</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-indigo-400 inline-block rounded"></span> Shortest path</span>
              </div>
            </div>
            <div className="h-72 md:h-80">
              <GraphCanvas
                nodes={nodes}
                edges={edges}
                current={current}
                sourceId={sourceId}
                hoveredTarget={hoveredTarget}
              />
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-1 italic">
              Hover a node in the distance table to highlight its shortest path
            </p>
          </div>

          {/* Priority Queue Snapshot */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <ArrowRight size={13} /> Priority Queue (unvisited nodes, sorted by dist)
            </h3>
            <div className="flex flex-wrap gap-2">
              {nodes
                .filter(nd => !current.visited[nd.id])
                .sort((a, b) => current.dist[a.id] - current.dist[b.id])
                .map(nd => {
                  const d = current.dist[nd.id];
                  const isNext = !current.visited[nd.id] && nd.id === current.activeNode;
                  return (
                    <div key={nd.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-bold transition-all ${
                      isNext
                        ? 'border-amber-400 bg-amber-50 text-amber-700 scale-105 shadow-md'
                        : d === Infinity
                        ? 'border-slate-100 bg-slate-50 text-slate-300'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}>
                      <span>{nd.label}</span>
                      <span className={`text-xs font-mono ${isNext ? 'text-amber-500' : 'text-slate-400'}`}>
                        {d === Infinity ? '∞' : d}
                      </span>
                      {isNext && <Zap size={12} className="text-amber-500" />}
                    </div>
                  );
                })}
              {nodes.every(nd => current.visited[nd.id]) && (
                <div className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 size={14} /> All nodes settled!
                </div>
              )}
            </div>
          </div>

          {/* Terminal Log */}
          <div className="bg-slate-900 text-slate-100 p-5 rounded-xl shadow-inner mt-auto min-h-20 flex items-center border-l-4 border-emerald-500">
            <p className="text-sm font-medium leading-relaxed font-mono">
              <span className="text-emerald-400 mr-2 opacity-50">#</span>
              {current.message}
            </p>
          </div>
        </div>

        {/* ── Right Sidebar ── */}
        <div className="w-full lg:w-72 flex flex-col gap-4 overflow-y-auto">

          {/* Controls */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => { setStep(0); setIsPlaying(false); }}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <RotateCcw size={18} />
              </button>
              <button
                onClick={() => setIsPlaying(p => !p)}
                className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${
                  isPlaying ? 'bg-amber-100 text-amber-600' : 'bg-emerald-600 text-white shadow-lg'
                }`}
              >
                {isPlaying
                  ? <Pause size={24} fill="currentColor" />
                  : <Play size={24} fill="currentColor" className="ml-1" />}
              </button>
              <button
                onClick={() => setStep(s => Math.min(animationSteps.length - 1, s + 1))}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <StepForward size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-2">
                  <span>Speed</span><span>{speed}ms</span>
                </div>
                <input type="range" min="200" max="2000" step="100" value={speed}
                  onChange={e => setSpeed(parseInt(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>
              <div className="pt-4 border-t border-slate-50">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-2">
                  <span>Progress</span><span>{step + 1}/{animationSteps.length}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${((step + 1) / animationSteps.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowTestEditor(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md hover:bg-slate-50 text-sm font-medium shadow-sm"
            >
              Edit Test Case
            </button>
          </div>

          {/* Test Case Editor Modal */}
          <TestCaseEditor
            isOpen={showTestEditor}
            onClose={() => setShowTestEditor(false)}
            edges={edges}
            onEdgesChange={handleEdgesChange}
            onReset={handleReset}
          />

          {/* Live Stats */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-3">Live Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Settled</div>
                <div className="text-2xl font-black text-emerald-600">
                  {current.visited.filter(Boolean).length}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Remaining</div>
                <div className="text-2xl font-black text-amber-500">
                  {current.visited.filter(v => !v).length}
                </div>
              </div>
            </div>
          </div>

          {/* Distance Table */}
          <DistanceTable
            nodes={nodes}
            current={current}
            sourceId={sourceId}
            onHoverTarget={setHoveredTarget}
            hoveredTarget={hoveredTarget}
          />

          {/* Objective Card */}
          <div className="bg-emerald-700 p-5 rounded-xl text-white shadow-xl">
            <div className="text-[10px] font-bold text-emerald-200 uppercase mb-2">Algorithm</div>
            <div className="text-sm font-medium">
              Dijkstra&apos;s finds the shortest path from a source to all nodes in O((V + E) log V).
            </div>
            <div className="mt-3 p-2 bg-emerald-600/50 rounded text-[10px] border border-emerald-500 font-mono">
              Always pick the unvisited node with smallest known distance.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}