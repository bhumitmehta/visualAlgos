
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Play, Pause, RotateCcw, StepForward, Settings2, Calculator, Network, Search, Link as LinkIcon, CheckCircle2, XCircle } from 'lucide-react';

interface SnapshotState {
  parent: number[];
  rank: number[];
  activeIndices: number[];
  highlightIndices: number[];
  groups: Record<number, number[]>;
  groupCounts: Record<number, Record<number, number>>;
  message: string;
  currentHamming: number;
  index: number;
  phase: string;
  matched?: boolean;
  root?: number;
  targetVal?: number;
}
 
const Hamming = () => {
  // --- Initial State ---
  const [source, setSource] = useState([1, 2, 3, 4]);
  const [target, setTarget] = useState([2, 1, 4, 5]);
  const [allowedSwaps, setAllowedSwaps] = useState([[0, 1], [2, 3]]);
  const [isEditing, setIsEditing] = useState(false);
  
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);
 
  // --- Granular Animation Logic ---
  const animationSteps = useMemo(() => {
    const n = source.length;
    const steps: SnapshotState[] = [];
    
    const parent = Array.from({ length: n }, (_, i) => i);
    const rank = new Array(n).fill(0);
    
    const find = (i: number, currParent: number[]): number => {
      if (currParent[i] === i) return i;
      return find(currParent[i], currParent);
    };

    const getSnapshot = (extra: Partial<SnapshotState> = {}): SnapshotState => ({
      parent: [...parent],
      rank: [...rank],
      activeIndices: [] as number[],
      highlightIndices: [] as number[],
      groups: {} as Record<number, number[]>,
      groupCounts: {} as Record<number, Record<number, number>>,
      message: "",
      currentHamming: 0,
      index: -1,
      matched: false,
      root: -1,
      phase: 'init',
      ...extra
    });
 
    // 1. INIT
    steps.push(getSnapshot({ 
      phase: 'setup',
      message: "Start: Every index is initially its own parent." 
    }));
 
    // 2. UNION PHASE (Granular)
    allowedSwaps.forEach(([u, v], swapIdx) => {
      steps.push(getSnapshot({
        phase: 'dsu',
        activeIndices: [u, v],
        message: `Step ${swapIdx + 1}: Examining allowed swap between index ${u} and ${v}.`
      }));
 
      const rootU = find(u, parent);
      const rootV = find(v, parent);
 
      steps.push(getSnapshot({
        phase: 'dsu',
        activeIndices: [u, v],
        highlightIndices: [rootU, rootV],
        message: `Finding roots: Index ${u} belongs to component ${rootU}. Index ${v} belongs to component ${rootV}.`
      }));
 
      if (rootU !== rootV) {
        if (rank[rootU] < rank[rootV]) {
          parent[rootU] = rootV;
        } else if (rank[rootU] > rank[rootV]) {
          parent[rootV] = rootU;
        } else {
          parent[rootV] = rootU;
          rank[rootU]++;
        }
        steps.push(getSnapshot({
          phase: 'dsu',
          activeIndices: [rootU, rootV],
          message: `Merging components: ${rootU} and ${rootV} are now connected.`
        }));
      } else {
        steps.push(getSnapshot({
          phase: 'dsu',
          activeIndices: [u, v],
          message: `Indices ${u} and ${v} are already in the same component. No action needed.`
        }));
      }
    });
 
    // 3. GROUPING
    const finalGroups: Record<number, number[]> = {};
    for(let i = 0; i < n; i++) {
      const root = find(i, parent);
      if(!finalGroups[root]) finalGroups[root] = [];
      finalGroups[root].push(i);
    }
    
    steps.push(getSnapshot({ 
      phase: 'grouping',
      groups: { ...finalGroups },
      message: "DSU Complete. We now have the final connected components." 
    }));
 
    // 4. MATCHING PHASE
    let totalHamming = 0;
    const currentGroupCounts: Record<number, Record<number, number>> = {};
    Object.keys(finalGroups).forEach(rootKey => {
      const root = parseInt(rootKey);
      currentGroupCounts[root] = {};
      finalGroups[root].forEach((idx: number) => {
        const val = source[idx];
        currentGroupCounts[root][val] = (currentGroupCounts[root][val] || 0) + 1;
      });
    });
 
    steps.push(getSnapshot({ 
      phase: 'matching',
      groups: { ...finalGroups },
      groupCounts: JSON.parse(JSON.stringify(currentGroupCounts)),
      message: "Mapping source values to their component 'bags'. Numbers can be freely moved within their component." 
    }));
 
    for(let i = 0; i < n; i++) {
      const root = find(i, parent);
      const targetVal = target[i];
      
      steps.push(getSnapshot({
        phase: 'matching',
        index: i,
        root,
        groups: { ...finalGroups },
        groupCounts: JSON.parse(JSON.stringify(currentGroupCounts)),
        currentHamming: totalHamming,
        message: `Checking index ${i}: Need a '${targetVal}' for this position.`
      }));
 
      let matched = false;
      if (currentGroupCounts[root][targetVal] > 0) {
        currentGroupCounts[root][targetVal]--;
        matched = true;
      } else {
        totalHamming++;
      }
      
      steps.push(getSnapshot({ 
        phase: 'matching',
        index: i, 
        root, 
        targetVal, 
        matched, 
        currentHamming: totalHamming, 
        groups: { ...finalGroups },
        groupCounts: JSON.parse(JSON.stringify(currentGroupCounts)),
        message: matched 
          ? `Found '${targetVal}' in Component ${root}'s bag! Hamming distance stays same.` 
          : `Component ${root} does not contain '${targetVal}'. Hamming distance +1.`
      }));
    }
 
    steps.push(getSnapshot({ 
      phase: 'final', 
      groups: { ...finalGroups },
      groupCounts: JSON.parse(JSON.stringify(currentGroupCounts)),
      currentHamming: totalHamming,
      message: `Final Minimum Hamming Distance: ${totalHamming}` 
    }));
    
    return steps;
  }, [source, target, allowedSwaps]);
 
  // --- Playback Logic ---
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
      // Use microtask to defer state update
      Promise.resolve().then(() => setIsPlaying(false));
    }
  }, [step, isPlaying, animationSteps.length]);
 
  const current = animationSteps[step] as SnapshotState || animationSteps[0] as SnapshotState;
 
  const handleUpdateInputs = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const s = JSON.parse(String(formData.get('source')));
      const t = JSON.parse(String(formData.get('target')));
      const a = JSON.parse(String(formData.get('swaps')));
      setSource(s); setTarget(t); setAllowedSwaps(a);
      setIsEditing(false); setStep(0); setIsPlaying(false);
    } catch { alert("Invalid JSON format"); }
  };
 
  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-6 overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg">
            <Network size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-none">Hamming Distance Visualizer</h1>
            <p className="text-slate-500 text-xs mt-1 italic">Step-by-step DSU & Frequency Matching</p>
          </div>
        </div>
        <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md hover:bg-slate-50 text-sm font-medium shadow-sm">
          <Settings2 size={16} /> Edit Case
        </button>
      </header>
 
      <div className="flex flex-col lg:flex-row gap-4 h-full overflow-hidden">
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
          
          {/* Phase Indicators */}
          <div className="flex gap-2">
            {['DSU', 'Grouping', 'Matching'].map((p) => (
              <div key={p} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                current.phase.includes(p.toLowerCase()) ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'
              }`}>
                {p} Phase
              </div>
            ))}
          </div>
 
          {/* DSU Visualization Card */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Network size={14} /> Index Connectivity (DSU)
              </h3>
              {current.phase === 'dsu' && <div className="animate-pulse flex items-center gap-1 text-amber-500 text-[10px] font-bold"><LinkIcon size={12}/> UNION IN PROGRESS</div>}
            </div>
 
            <div className="flex flex-wrap gap-4 justify-center py-4">
              {source.map((val, i) => (
                <div key={i} className="relative group">
                  <div className={`
                    w-16 h-20 rounded-xl border-2 flex flex-col items-center justify-between p-2 transition-all duration-300
                    ${current.activeIndices.includes(i) ? 'border-amber-400 bg-amber-50 scale-110 z-10 shadow-lg' : ''}
                    ${current.highlightIndices.includes(i) ? 'border-blue-500 bg-blue-50 scale-105 shadow-md' : 'border-slate-100 bg-slate-50'}
                    ${current.index === i ? 'border-indigo-600 bg-indigo-50 scale-110 z-10' : ''}
                  `}>
                    <span className="text-[10px] font-bold text-slate-400">IDX {i}</span>
                    <span className="text-xl font-black text-slate-700">{val}</span>
                    <div className="w-full h-px bg-slate-200 mt-1"></div>
                    <span className="text-[9px] font-mono text-slate-500">Root: {current.parent[i]}</span>
                  </div>
                  {current.parent[i] !== i && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-blue-400 animate-bounce">
                      <div className="w-0.5 h-3 bg-blue-400 mx-auto"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
 
          {/* Matching Phase Card */}
          {(current.phase === 'matching' || current.phase === 'final') && (
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 animate-in slide-in-from-bottom-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Search size={14} /> Value Matching (Hamming Check)
              </h3>
              
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-3 justify-center">
                  {target.map((val, i) => (
                    <div key={i} className={`
                      w-14 h-14 rounded-lg flex items-center justify-center font-bold text-lg border-2 transition-all
                      ${current.index === i ? 'scale-110 z-10 shadow-lg' : 'opacity-30'}
                      ${current.index === i ? (current.matched ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-rose-500 bg-rose-50 text-rose-700') : 'border-slate-100'}
                    `}>
                      {val}
                      {current.index === i && (
                        <div className="absolute -bottom-2 translate-y-full">
                          {current.matched ? <CheckCircle2 size={20} className="text-emerald-500" /> : <XCircle size={20} className="text-rose-500" />}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
 
          {/* Bag Status */}
          {(current.phase === 'matching' || current.phase === 'final' || current.phase === 'grouping') && (
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Calculator size={14} /> Component &quot;Bags&quot; (Available Values)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(current.groups as Record<string, number[]>).map(([root, indices]) => (
                  <div key={root} className={`p-3 rounded-lg border-2 transition-all ${current.root === parseInt(root) ? 'border-blue-400 bg-blue-50' : 'border-slate-50 bg-slate-50/50'}`}>
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-2">
                      <span>ROOT: {root}</span>
                      <span>INCLUDES: [{indices.join(', ')}]</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries((current.groupCounts as Record<string, Record<string, number>>)[root] || {}).map(([val, count]) => (
                        <div key={val} className={`px-2 py-1 rounded border text-xs font-bold flex items-center gap-1.5 ${count > 0 ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-100 text-slate-300 opacity-50'}`}>
                          <span className="text-blue-600">{val}</span>
                          <span className="text-[10px] text-slate-400">x{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
 
          {/* Terminal Log */}
          <div className="bg-slate-900 text-slate-100 p-5 rounded-xl shadow-inner mt-auto min-h-22.5 flex items-center border-l-4 border-blue-500">
            <p className="text-base font-medium leading-relaxed font-mono">
              <span className="text-blue-400 mr-2 opacity-50">#</span>
              {current.message}
            </p>
          </div>
        </div>
 
        {/* Control Panel (Right) */}
        <div className="w-full lg:w-72 flex flex-col gap-4">
          
          {/* Controls */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
             <div className="flex justify-between items-center mb-6">
                <button onClick={() => { setStep(0); setIsPlaying(false); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><RotateCcw size={18} /></button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${isPlaying ? 'bg-amber-100 text-amber-600' : 'bg-blue-600 text-white shadow-lg'}`}
                >
                  {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                </button>
                <button onClick={() => setStep(s => Math.min(animationSteps.length - 1, s + 1))} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><StepForward size={18} /></button>
             </div>
             
             <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-2"><span>Speed</span><span>{speed}ms</span></div>
                  <input type="range" min="100" max="2000" step="100" value={speed} onChange={(e) => setSpeed(parseInt(e.target.value))} className="w-full accent-blue-600" />
                </div>
                <div className="pt-4 border-t border-slate-50">
                   <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-2"><span>Progress</span><span>{step + 1}/{animationSteps.length}</span></div>
                   <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${((step + 1) / animationSteps.length) * 100}%` }}></div>
                   </div>
                </div>
             </div>
          </div>
 
          {/* Real-time Stats */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
             <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-4">Live Statistics</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                   <div className="text-[10px] font-bold text-slate-400 uppercase">Hamming</div>
                   <div className="text-2xl font-black text-rose-500">{current.currentHamming}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                   <div className="text-[10px] font-bold text-slate-400 uppercase">Groups</div>
                   <div className="text-2xl font-black text-blue-600">{Object.keys(current.groups).length || 0}</div>
                </div>
             </div>
          </div>
 
          {/* Score Board */}
          <div className="bg-indigo-600 p-5 rounded-xl text-white shadow-xl">
             <div className="text-[10px] font-bold text-indigo-200 uppercase mb-2">Final Objective</div>
             <div className="text-sm font-medium">Minimize mismatches between Source and Target.</div>
             <div className="mt-4 p-2 bg-indigo-500/50 rounded text-[10px] border border-indigo-400">
                Any element can move to any index within its connected component.
             </div>
          </div>
        </div>
      </div>
 
      {/* Editor Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Configure Scenario</h2>
            <form onSubmit={handleUpdateInputs} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Source Array</label>
                <input name="source" defaultValue={JSON.stringify(source)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded font-mono text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Array</label>
                <input name="target" defaultValue={JSON.stringify(target)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded font-mono text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Allowed Swaps</label>
                <textarea name="swaps" defaultValue={JSON.stringify(allowedSwaps)} rows={3} className="w-full p-2 bg-slate-50 border border-slate-200 rounded font-mono text-sm" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition-shadow shadow-md">Run Simulation</button>
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-2 rounded-lg hover:bg-slate-200">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
 
export default Hamming;
 




