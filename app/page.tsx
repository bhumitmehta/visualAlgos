"use client";


import { useState, useMemo, useEffect, useRef } from "react";
import {
  Network, PlayCircle, PauseCircle, Sparkles, Code2,
  ArrowRight, ChevronRight, BookOpen, Zap, GitBranch, Braces, ArrowUpRight,
  Search, X, SlidersHorizontal, Clock, Tag,
} from "lucide-react";
import SearchBar from "@/components/search/SearchBar";
import Navbar                from "@/components/Navbar";
import type {
  NavLink,
  
} from "@/components/types";

import Footer from "@/components/Homepage/Footer/Footer";



// ─── Types ────────────────────────────────────────────────────────────────────
type Difficulty = "Easy" | "Medium" | "Hard";
type IconName = "network" | "braces" | "branch" | "default";

interface ProblemConfig {
  id: string;
  title: string;
  slug: string;
  pattern: string;
  patternCategory: string;         // e.g. "Sliding Window", "Union-Find", "Hash Map"
  difficulty: Difficulty;
  description: string;
  heroTagline: string;
  accent: string;
  accentMuted: string;
  accentText: string;
  icon: IconName;
  tags: string[];                  // Topics: Arrays, Strings, Trees, etc.
  badges: string[];                // Pattern badges shown on card
  watchMinutes: number;            // Estimated visualizer watch time
  number: string;
}

// ─── Problem data ─────────────────────────────────────────────────────────────
// Add a new object here → it automatically participates in search, filters,
// pattern browser, footer index, and hero preview.
const PROBLEMS: ProblemConfig[] = [
  {
    id: "hamming", slug: "hamming", number: "#01",
    title: "Min Hamming Distance with Swaps",
    pattern: "DSU + Hashing", patternCategory: "Union-Find",
    difficulty: "Medium",
    description: "Rearrange elements within connected components to minimize Hamming distance.",
    heroTagline: "Watch DSU unions form components, then frequency maps resolve mismatches.",
    accent: "#3B82F6", accentMuted: "rgba(59,130,246,0.12)", accentText: "#93C5FD",
    icon: "network",
    tags: ["Arrays", "Union-Find", "Frequency Map"],
    badges: ["Arrays", "Union-Find", "Frequency Map"],
    watchMinutes: 6,
  },
  {
    id: "substring", slug: "substring", number: "#02",
    title: "Substring Concatenation of All Words",
    pattern: "Sliding Window + Map", patternCategory: "Sliding Window",
    difficulty: "Hard",
    description: "Find all starting indices where a window is a permutation of all given words.",
    heroTagline: "Watch each word-count window expand, shrink, and snap into place.",
    accent: "#F59E0B", accentMuted: "rgba(245,158,11,0.12)", accentText: "#FCD34D",
    icon: "braces",
    tags: ["Strings", "Sliding Window", "Hash Map"],
    badges: ["Strings", "Sliding Window", "Hash Map"],
    watchMinutes: 8,
  },
  {
    id: "create-binary-tree", slug: "create-binary-tree", number: "#03",
    title: "Create Binary Tree From Descriptions",
    pattern: "Hash Map + Set", patternCategory: "Trees",
    difficulty: "Medium",
    description: "Build a binary tree from parent-child relations and detect the root.",
    heroTagline: "See nodes created, edges attached, and the lone root singled out.",
    accent: "#10B981", accentMuted: "rgba(16,185,129,0.12)", accentText: "#6EE7B7",
    icon: "branch",
    tags: ["Trees", "Hash Map", "Graph to Tree"],
    badges: ["Trees", "Hash Map", "Graph to Tree"],
    watchMinutes: 5,
  },
  {
    id: "two-sum", slug: "two-sum", number: "#04",
    title: "Two Sum",
    pattern: "Hash Map", patternCategory: "Hash Map",
    difficulty: "Easy",
    description: "Pick two numbers whose sum equals the target using a single pass.",
    heroTagline: "Trace complement lookups as they appear and get matched in one sweep.",
    accent: "#A855F7", accentMuted: "rgba(168,85,247,0.12)", accentText: "#D8B4FE",
    icon: "default",
    tags: ["Arrays", "Hash Map"],
    badges: ["Arrays", "Hash Map"],
    watchMinutes: 3,
  },
];
const NAV_LINKS: NavLink[] = [
  { label: "Home",       href: "/"           },
  { label: "Problems", href: "/problems" },
  { label: "Contribute", href: "https://github.com/bhumitmehta/visualAlgos" },
];
// ─── Derived filter sets (auto-built from PROBLEMS) ───────────────────────────
const ALL_DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];
const ALL_PATTERNS = [...new Set(PROBLEMS.map(p => p.patternCategory))].sort();
const ALL_TAGS     = [...new Set(PROBLEMS.flatMap(p => p.tags))].sort();

// ─── Helpers ──────────────────────────────────────────────────────────────────
function DifficultyPill({ diff }: { diff: Difficulty }) {
  const colors = {
    Easy:   { bg: "rgba(16,185,129,0.1)",  text: "#6EE7B7", dot: "#10B981" },
    Medium: { bg: "rgba(245,158,11,0.1)",  text: "#FCD34D", dot: "#F59E0B" },
    Hard:   { bg: "rgba(239,68,68,0.1)",   text: "#FCA5A5", dot: "#EF4444" },
  }[diff];
  return (
    <span style={{ background: colors.bg, color: colors.text }}
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest">
      <span style={{ background: colors.dot }} className="w-1.5 h-1.5 rounded-full" />
      {diff}
    </span>
  );
}

function ProblemIcon({ icon, accent }: { icon: IconName; accent: string }) {
  const I = icon === "network" ? Network : icon === "braces" ? Braces : icon === "branch" ? GitBranch : Sparkles;
  return <I className="h-3.5 w-3.5" style={{ color: accent }} />;
}

// ─── Ticker ───────────────────────────────────────────────────────────────────
function Ticker() {
  const items = ["Sliding Window","Union-Find","Two Pointers","Binary Search","Segment Tree","Trie","Topological Sort","Dijkstra","DP on Trees","Monotonic Stack"];
  return (
    <div className="overflow-hidden flex whitespace-nowrap">
      {[...items,...items].map((item,i)=>(
        <span key={i} className="inline-flex items-center gap-3 px-4 text-[11px] uppercase tracking-[0.15em] text-zinc-500 shrink-0">
          <span className="w-1 h-1 rounded-full bg-zinc-700 inline-block" />{item}
        </span>
      ))}
    </div>
  );
}

// ─── Mini animated visualizer ─────────────────────────────────────────────────
function MiniViz({ problem, playing }: { problem: ProblemConfig; playing: boolean }) {
  const [tick, setTick] = useState(0);
  useEffect(()=>{
    if(!playing) return;
    const t=setInterval(()=>setTick(p=>(p+1)%8),700);
    return ()=>clearInterval(t);
  },[playing]);

  const cells = problem.id==="substring"  ? ["bar","foo","the","foo","bar","man"]
    : problem.id==="hamming"              ? ["A","B","C","D","A","B"]
    : problem.id==="two-sum"             ? ["2","7","11","15","—","—"]
    :                                      ["P","→","L","→","R","✓"];

  return (
    <div className="grid grid-cols-6 gap-1.5 mb-4">
      {cells.map((cell,i)=>{
        const active=playing && i===tick%6;
        const done  =playing && i< tick%6;
        return (
          <div key={i} style={{
            borderColor: active?problem.accent:done?`${problem.accent}55`:"rgba(255,255,255,0.06)",
            background: active?problem.accentMuted:done?"rgba(255,255,255,0.03)":"transparent",
            color: active?problem.accentText:done?"rgba(255,255,255,0.4)":"rgba(255,255,255,0.2)",
            transition:"all 0.3s ease",
            boxShadow:active?`0 0 12px ${problem.accent}30`:"none",
          }} className="border rounded-lg py-2 flex flex-col items-center gap-0.5 font-mono">
            <span className="text-[9px] opacity-50">{i}</span>
            <span className="text-[11px] font-bold">{cell}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Filter chip ──────────────────────────────────────────────────────────────
function Chip({
  label, active, accent, onClick, onRemove,
}: { label:string; active:boolean; accent?:string; onClick:()=>void; onRemove?:()=>void }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full text-[10px] uppercase tracking-widest px-3 py-1.5 transition-all"
      style={{
        border: `1px solid ${active?(accent||"rgba(255,255,255,0.5)"):"rgba(255,255,255,0.08)"}`,
        background: active?`${accent||"rgba(255,255,255,0.15)"}20`:"transparent",
        color: active?"#fff":"rgba(255,255,255,0.35)",
      }}>
      {label}
      {active && onRemove && (
        <span onClick={e=>{e.stopPropagation();onRemove();}}
          className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity">
          <X className="w-2.5 h-2.5" />
        </span>
      )}
    </button>
  );
}

// ─── Problem card ─────────────────────────────────────────────────────────────
function ProblemCard({
  p, hovered, onHover, onLeave, searchQuery,
}: {
  p: ProblemConfig;
  hovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  searchQuery: string;
}) {
  // Highlight matching text
  function Highlight({ text }: { text: string }) {
    if (!searchQuery) return <>{text}</>;
    const idx = text.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (idx === -1) return <>{text}</>;
    return (
      <>{text.slice(0,idx)}<mark style={{background:"rgba(251,191,36,0.25)",color:"#FCD34D",borderRadius:"2px"}}>{text.slice(idx,idx+searchQuery.length)}</mark>{text.slice(idx+searchQuery.length)}</>
    );
  }

  return (
    <a href={`/problems/${p.slug}`}
      onMouseEnter={onHover} onMouseLeave={onLeave}
      className="group relative block rounded-xl overflow-hidden transition-all duration-200"
      style={{
        border:`1px solid ${hovered?p.accent+"40":"rgba(255,255,255,0.06)"}`,
        background: hovered?p.accentMuted:"rgba(255,255,255,0.015)",
        transform: hovered?"translateY(-2px)":"none",
      }}>
      {/* Watermark */}
      <div className="absolute top-4 right-5 syne text-5xl font-800 select-none pointer-events-none" style={{color:"rgba(255,255,255,0.03)",lineHeight:1}}>
        {p.number}
      </div>

      <div className="p-6">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:p.accentMuted,border:`1px solid ${p.accent}30`}}>
              <ProblemIcon icon={p.icon} accent={p.accent} />
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.2em] mb-0.5" style={{color:"rgba(255,255,255,0.25)"}}>
                <Highlight text={p.patternCategory} />
              </div>
              <DifficultyPill diff={p.difficulty} />
            </div>
          </div>
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" style={{color:"rgba(255,255,255,0.2)"}} />
        </div>

        {/* Title */}
        <h3 className="syne font-700 text-base mb-1.5 leading-snug transition-colors" style={{
          color: hovered?"#fff":"rgba(255,255,255,0.8)", letterSpacing:"-0.01em",
        }}>
          <Highlight text={p.title} />
        </h3>
        <p className="text-xs leading-relaxed mb-4" style={{color:"rgba(255,255,255,0.3)"}}>
          {p.description}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-3 mb-4 text-[10px]" style={{color:"rgba(255,255,255,0.25)"}}>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            ~{p.watchMinutes} min
          </span>
          <span className="inline-flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {p.tags.slice(0,2).join(", ")}
          </span>
        </div>

        {/* Badges */}
        <div className="flex gap-1.5 flex-wrap">
          {p.badges.map(b=>(
            <span key={b} className="text-[10px] px-2 py-0.5 rounded-full transition-all"
              style={{
                background: hovered?`${p.accent}20`:"rgba(255,255,255,0.04)",
                color: hovered?p.accentText:"rgba(255,255,255,0.25)",
                border:`1px solid ${hovered?p.accent+"30":"transparent"}`,
              }}>
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* Accent bottom line */}
      <div className="h-0.5 transition-all duration-300" style={{background:hovered?p.accent:"transparent"}} />
    </a>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [selectedId,  setSelectedId]  = useState(PROBLEMS[0].id);
  const [hovered,     setHovered]     = useState<string|null>(null);
  const [mounted,     setMounted]     = useState(false);

  // Filter state
  const [searchQuery,       setSearchQuery]       = useState("");
  const [activeDifficulty,  setActiveDifficulty]  = useState<Difficulty|null>(null);
  const [activePattern,     setActivePattern]     = useState<string|null>(null);
  const [activeTag,         setActiveTag]         = useState<string|null>(null);
  const [showFilters,       setShowFilters]       = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(()=>{ setMounted(true); },[]);

  const selected = useMemo(()=>PROBLEMS.find(p=>p.id===selectedId)??PROBLEMS[0],[selectedId]);

  // ── Filtered problems ──
  const filtered = useMemo(()=>{
    const q = searchQuery.toLowerCase().trim();
    return PROBLEMS.filter(p=>{
      if(activeDifficulty && p.difficulty !== activeDifficulty) return false;
      if(activePattern    && p.patternCategory !== activePattern) return false;
      if(activeTag        && !p.tags.includes(activeTag)) return false;
      if(!q) return true;
      return (
        p.title.toLowerCase().includes(q)      ||
        p.pattern.toLowerCase().includes(q)    ||
        p.patternCategory.toLowerCase().includes(q) ||
        p.tags.some(t=>t.toLowerCase().includes(q)) ||
        p.difficulty.toLowerCase().includes(q)
      );
    });
  },[searchQuery, activeDifficulty, activePattern, activeTag]);

  const activeFilterCount = [activeDifficulty, activePattern, activeTag].filter(Boolean).length;

  function clearAll() {
    setSearchQuery(""); setActiveDifficulty(null); setActivePattern(null); setActiveTag(null);
  }

  // Alphabetical problem list for footer index
  const alphabetical = [...PROBLEMS].sort((a,b)=>a.title.localeCompare(b.title));

  return (
    <main className="min-h-screen" style={{background:"#0A0A0B",fontFamily:"'DM Mono','Fira Code',monospace"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Syne:wght@600;700;800&display=swap');
        * { box-sizing: border-box; }
        .syne { font-family:'Syne',sans-serif; }
        @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .ticker-track { animation:ticker 25s linear infinite; }
        .ticker-track:hover { animation-play-state:paused; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation:fadeUp 0.6s ease forwards; opacity:0; }
        .delay-1{animation-delay:0.1s} .delay-2{animation-delay:0.2s}
        .delay-3{animation-delay:0.3s} .delay-4{animation-delay:0.4s}
        input[type=search]::-webkit-search-cancel-button { display:none; }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#27272a;border-radius:2px}
      `}</style>

      {/* ── Nav ── */}
   
      <Navbar links={NAV_LINKS} />

      {/* ── Ticker ── */}
      <div className="border-b overflow-hidden" style={{borderColor:"rgba(255,255,255,0.04)",background:"rgba(255,255,255,0.015)"}}>
        <div className="ticker-track flex py-2.5"><Ticker /><Ticker /></div>
      </div>
      
      {/* -- Search -- */}
      <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
        <div className="max-w-2xl mx-auto px-6 py-6">
          <SearchBar
            onSearch={(q) => setSearchQuery(q)}
            onSubmit={(q) => {
              setSearchQuery(q);
              document.getElementById("problems")?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background:`radial-gradient(ellipse 60% 40% at 70% 30%,${selected.accent}14 0%,transparent 70%)`,
          transition:"background 0.8s ease",
        }} />
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <div className={mounted?"fade-up":"opacity-0"}>
              <div className="flex items-center gap-2 mb-8">
                <div className="h-px w-8" style={{background:selected.accent,transition:"background 0.5s"}} />
                <span className="text-[10px] uppercase tracking-[0.25em]" style={{color:"rgba(255,255,255,0.3)"}}>
                  Open source · Built for CP grinders
                </span>
              </div>
              <h1 className="syne leading-[1.05] mb-6" style={{fontSize:"clamp(2.2rem,4.5vw,3.5rem)",fontWeight:800,color:"#fff",letterSpacing:"-0.02em"}}>
                Algorithms you{" "}
                <em className="not-italic" style={{color:selected.accent,transition:"color 0.5s"}}>see</em>,
                <br />not just read.
              </h1>
              <p className="text-sm leading-relaxed mb-10 max-w-md" style={{color:"rgba(255,255,255,0.4)"}}>
                Hand-crafted animations for every classic DSA problem. Each visualization is purpose-built — not a generic step-through. Contribute your own.
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <a href="#problems"
                  className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-medium uppercase tracking-widest"
                  style={{background:selected.accent,color:"#000",transition:"background 0.5s"}}>
                  <PlayCircle className="w-3.5 h-3.5" /> Explore <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <a href="https://github.com/bhumitmehta/visualAlgos" target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-medium uppercase tracking-widest"
                  style={{border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)"}}>
                  <Code2 className="w-3.5 h-3.5" /> Contribute
                </a>
              </div>
              <div className="flex items-center gap-8 mt-12 pt-8" style={{borderTop:"1px solid rgba(255,255,255,0.06)"}}>
                {[
                  [PROBLEMS.length+"+","Problems"],
                  ["3","Approaches each"],
                  ["Open","Source"],
                ].map(([val,label])=>(
                  <div key={label}>
                    <div className="syne text-xl font-700" style={{color:selected.accent,transition:"color 0.5s"}}>{val}</div>
                    <div className="text-[10px] uppercase tracking-widest mt-0.5" style={{color:"rgba(255,255,255,0.25)"}}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right – preview card */}
            <div className={mounted?"fade-up delay-2":"opacity-0"}>
              <div className="flex gap-2 flex-wrap mb-4">
                {PROBLEMS.map(p=>(
                  <button key={p.id} onClick={()=>setSelectedId(p.id)}
                    className="rounded-full text-[10px] uppercase tracking-widest px-3 py-1 transition-all"
                    style={{
                      border:`1px solid ${selectedId===p.id?p.accent:"rgba(255,255,255,0.08)"}`,
                      background:selectedId===p.id?p.accentMuted:"transparent",
                      color:selectedId===p.id?p.accentText:"rgba(255,255,255,0.3)",
                    }}>
                    {p.number}
                  </button>
                ))}
              </div>
              <div className="rounded-2xl overflow-hidden" style={{
                border:`1px solid ${selected.accent}30`,background:"rgba(255,255,255,0.02)",
                boxShadow:`0 0 60px ${selected.accent}15,0 0 0 1px ${selected.accent}15`,
                transition:"border-color 0.5s,box-shadow 0.5s",
              }}>
                <div className="px-5 py-3.5 flex items-center justify-between" style={{borderBottom:"1px solid rgba(255,255,255,0.05)",background:"rgba(255,255,255,0.02)"}}>
                  <div className="flex items-center gap-2.5">
                    <ProblemIcon icon={selected.icon} accent={selected.accent} />
                    <span className="text-[11px] font-medium" style={{color:"rgba(255,255,255,0.7)"}}>{selected.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px]" style={{color:"rgba(255,255,255,0.25)"}}>~{selected.watchMinutes} min</span>
                    <DifficultyPill diff={selected.difficulty} />
                  </div>
                </div>
                <div className="p-5">
                  <div className="text-[10px] uppercase tracking-widest mb-3" style={{color:"rgba(255,255,255,0.2)"}}>
                    {selected.pattern}
                  </div>
                  <MiniViz problem={selected} playing={isPlaying} />
                  <div className="rounded-lg px-3 py-2.5 mb-4 font-mono text-[11px]" style={{
                    background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",
                    color:selected.accentText,transition:"color 0.5s",
                  }}>
                    <span style={{color:"rgba(255,255,255,0.2)",marginRight:"8px"}}>//</span>
                    {selected.heroTagline}
                  </div>
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {selected.tags.map(t=>(
                      <button key={t} onClick={()=>{setActiveTag(t);document.getElementById("problems")?.scrollIntoView({behavior:"smooth"});}}
                        className="text-[10px] px-2 py-0.5 rounded-full transition-all hover:opacity-80"
                        style={{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.3)"}}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 pt-4" style={{borderTop:"1px solid rgba(255,255,255,0.05)"}}>
                    <button onClick={()=>setIsPlaying(p=>!p)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] uppercase tracking-widest transition-all"
                      style={{background:selected.accentMuted,color:selected.accentText,border:`1px solid ${selected.accent}30`}}>
                      {isPlaying?<><PauseCircle className="w-3.5 h-3.5"/>Pause</>:<><PlayCircle className="w-3.5 h-3.5"/>Preview</>}
                    </button>
                    <div className="flex-1 h-0.5 rounded-full" style={{background:"rgba(255,255,255,0.06)"}}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{width:isPlaying?"66%":"15%",background:selected.accent}} />
                    </div>
                    {/* Deep-link open button */}
                    <a href={`/problems/${selected.slug}`}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] uppercase tracking-widest transition-all"
                      style={{background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.5)",border:"1px solid rgba(255,255,255,0.08)"}}>
                      Open <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pattern browser ── */}
      <section id="patterns" className="py-12" style={{borderTop:"1px solid rgba(255,255,255,0.05)"}}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-px w-5 bg-white opacity-20" />
            <span className="text-[10px] uppercase tracking-[0.25em]" style={{color:"rgba(255,255,255,0.3)"}}>Pattern browser</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_PATTERNS.map(pat=>{
              const count = PROBLEMS.filter(p=>p.patternCategory===pat).length;
              const active = activePattern===pat;
              return (
                <button key={pat} onClick={()=>{
                    setActivePattern(active?null:pat);
                    document.getElementById("problems")?.scrollIntoView({behavior:"smooth"});
                  }}
                  className="inline-flex items-center gap-2 rounded-full text-[11px] px-4 py-2 transition-all"
                  style={{
                    border:`1px solid ${active?"rgba(255,255,255,0.4)":"rgba(255,255,255,0.08)"}`,
                    background:active?"rgba(255,255,255,0.1)":"rgba(255,255,255,0.02)",
                    color:active?"#fff":"rgba(255,255,255,0.4)",
                  }}>
                  {pat}
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{
                    background:active?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.06)",
                    color:active?"#fff":"rgba(255,255,255,0.3)",
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tag cloud */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {ALL_TAGS.map(tag=>{
              const active=activeTag===tag;
              return (
                <button key={tag} onClick={()=>{
                    setActiveTag(active?null:tag);
                    document.getElementById("problems")?.scrollIntoView({behavior:"smooth"});
                  }}
                  className="text-[10px] px-2.5 py-1 rounded-full transition-all"
                  style={{
                    border:`1px solid ${active?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.06)"}`,
                    background:active?"rgba(255,255,255,0.08)":"transparent",
                    color:active?"rgba(255,255,255,0.8)":"rgba(255,255,255,0.25)",
                  }}>
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Problems section ── */}
      <section id="problems" className="py-16" style={{borderTop:"1px solid rgba(255,255,255,0.05)"}}>
        <div className="max-w-6xl mx-auto px-6">

          {/* Section header */}
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px w-5 bg-white opacity-20" />
                <span className="text-[10px] uppercase tracking-[0.25em]" style={{color:"rgba(255,255,255,0.3)"}}>Problems</span>
              </div>
              <h2 className="syne text-3xl font-800 text-white" style={{letterSpacing:"-0.02em"}}>
                Start visualizing.
              </h2>
            </div>
            <span className="text-[11px]" style={{color:"rgba(255,255,255,0.2)"}}>
              {filtered.length} of {PROBLEMS.length}
            </span>
          </div>

          {/* ── Search + filter bar ── */}
          <div className="mb-6 space-y-3">
            {/* Search input */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{color:"rgba(255,255,255,0.3)"}} />
                <input ref={searchRef} type="search" value={searchQuery}
                  onChange={e=>setSearchQuery(e.target.value)}
                  placeholder="Search by title, pattern, tag, difficulty…"
                  className="w-full rounded-lg pl-9 pr-9 py-2.5 text-xs outline-none transition-all"
                  style={{
                    background:"rgba(255,255,255,0.04)",
                    border:`1px solid ${searchQuery?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.08)"}`,
                    color:"rgba(255,255,255,0.8)",
                    fontFamily:"'DM Mono',monospace",
                  }}
                />
                {searchQuery && (
                  <button onClick={()=>setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-80 transition-opacity">
                    <X className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>
              <button onClick={()=>setShowFilters(f=>!f)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-xs transition-all"
                style={{
                  border:`1px solid ${showFilters||activeFilterCount>0?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.08)"}`,
                  background:showFilters?"rgba(255,255,255,0.08)":"transparent",
                  color:activeFilterCount>0?"#fff":"rgba(255,255,255,0.4)",
                }}>
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
                {activeFilterCount>0 && (
                  <span className="w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold"
                    style={{background:"rgba(255,255,255,0.2)",color:"#fff"}}>
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {(activeFilterCount>0||searchQuery) && (
                <button onClick={clearAll} className="text-[10px] uppercase tracking-widest transition-opacity hover:opacity-80"
                  style={{color:"rgba(255,255,255,0.3)"}}>
                  Clear all
                </button>
              )}
            </div>

            {/* Expandable filter panel */}
            {showFilters && (
              <div className="rounded-xl p-4 space-y-4" style={{border:"1px solid rgba(255,255,255,0.07)",background:"rgba(255,255,255,0.02)"}}>
                {/* Difficulty */}
                <div>
                  <div className="text-[9px] uppercase tracking-[0.2em] mb-2" style={{color:"rgba(255,255,255,0.25)"}}>Difficulty</div>
                  <div className="flex gap-2 flex-wrap">
                    {ALL_DIFFICULTIES.map(d=>(
                      <Chip key={d} label={d} active={activeDifficulty===d}
                        accent={d==="Easy"?"#10B981":d==="Medium"?"#F59E0B":"#EF4444"}
                        onClick={()=>setActiveDifficulty(activeDifficulty===d?null:d)}
                        onRemove={()=>setActiveDifficulty(null)} />
                    ))}
                  </div>
                </div>
                {/* Pattern */}
                <div>
                  <div className="text-[9px] uppercase tracking-[0.2em] mb-2" style={{color:"rgba(255,255,255,0.25)"}}>Pattern</div>
                  <div className="flex gap-2 flex-wrap">
                    {ALL_PATTERNS.map(pat=>(
                      <Chip key={pat} label={pat} active={activePattern===pat}
                        onClick={()=>setActivePattern(activePattern===pat?null:pat)}
                        onRemove={()=>setActivePattern(null)} />
                    ))}
                  </div>
                </div>
                {/* Tags */}
                <div>
                  <div className="text-[9px] uppercase tracking-[0.2em] mb-2" style={{color:"rgba(255,255,255,0.25)"}}>Topics</div>
                  <div className="flex gap-2 flex-wrap">
                    {ALL_TAGS.map(tag=>(
                      <Chip key={tag} label={tag} active={activeTag===tag}
                        onClick={()=>setActiveTag(activeTag===tag?null:tag)}
                        onRemove={()=>setActiveTag(null)} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Active filter chips summary (collapsed state) */}
            {!showFilters && activeFilterCount>0 && (
              <div className="flex gap-2 flex-wrap">
                {activeDifficulty && (
                  <Chip label={activeDifficulty} active accent="#fff"
                    onClick={()=>setActiveDifficulty(null)} onRemove={()=>setActiveDifficulty(null)} />
                )}
                {activePattern && (
                  <Chip label={activePattern} active accent="#fff"
                    onClick={()=>setActivePattern(null)} onRemove={()=>setActivePattern(null)} />
                )}
                {activeTag && (
                  <Chip label={activeTag} active accent="#fff"
                    onClick={()=>setActiveTag(null)} onRemove={()=>setActiveTag(null)} />
                )}
              </div>
            )}
          </div>

          {/* ── Grid ── */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(p=>(
                <ProblemCard key={p.id} p={p}
                  hovered={hovered===p.id}
                  onHover={()=>{ setHovered(p.id); setSelectedId(p.id); }}
                  onLeave={()=>setHovered(null)}
                  searchQuery={searchQuery} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <div className="text-3xl mb-3 opacity-20">∅</div>
              <p className="text-sm" style={{color:"rgba(255,255,255,0.3)"}}>No problems match your filters.</p>
              <button onClick={clearAll} className="mt-4 text-xs underline" style={{color:"rgba(255,255,255,0.3)"}}>
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20" style={{borderTop:"1px solid rgba(255,255,255,0.05)"}}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{background:"rgba(255,255,255,0.05)",borderRadius:"16px",overflow:"hidden"}}>
            {[
              {icon:Zap,  label:"Interactive Timeline",desc:"Play, pause, and step through each algorithm. Control speed. Jump to any moment.",accent:"#3B82F6"},
              {icon:BookOpen,label:"Learn by Seeing",   desc:"Visualize data structures, state changes, and invariants at every single step.",accent:"#A855F7"},
              {icon:Sparkles,label:"Pattern Mastery",  desc:"Each animation is designed to burn the pattern into memory — not just explain it.",accent:"#10B981"},
            ].map(({icon:Icon,label,desc,accent})=>(
              <div key={label} className="p-8" style={{background:"#0A0A0B"}}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-5"
                  style={{background:`${accent}15`,border:`1px solid ${accent}25`}}>
                  <Icon className="w-4 h-4" style={{color:accent}} />
                </div>
                <h3 className="syne font-700 text-sm text-white mb-2" style={{letterSpacing:"-0.01em"}}>{label}</h3>
                <p className="text-xs leading-relaxed" style={{color:"rgba(255,255,255,0.3)"}}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Open source CTA ── */}
      <section className="py-20" style={{borderTop:"1px solid rgba(255,255,255,0.05)"}}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="rounded-2xl relative overflow-hidden p-12 text-center" style={{
            border:"1px solid rgba(255,255,255,0.08)",
            background:"linear-gradient(135deg,rgba(255,255,255,0.03) 0%,rgba(255,255,255,0.01) 100%)",
          }}>
            <div className="absolute inset-0 pointer-events-none" style={{
              background:"radial-gradient(ellipse 50% 60% at 50% 100%,rgba(59,130,246,0.08) 0%,transparent 70%)",
            }} />
            <div className="relative">
              <div className="text-[10px] uppercase tracking-[0.25em] mb-4" style={{color:"rgba(255,255,255,0.25)"}}>Open Source</div>
              <h2 className="syne text-3xl font-800 text-white mb-4" style={{letterSpacing:"-0.02em"}}>
                Build the animation for<br />your favourite problem.
              </h2>
              <p className="text-sm mb-8 max-w-md mx-auto" style={{color:"rgba(255,255,255,0.35)"}}>
                Each animation is self-contained. Add yours without touching anything else. PR welcome.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <a href="https://github.com" target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-xs uppercase tracking-widest font-medium"
                  style={{background:"#fff",color:"#000"}}>
                  <Code2 className="w-3.5 h-3.5" /> View on GitHub <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
                <a href="#problems"
                  className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-xs uppercase tracking-widest font-medium"
                  style={{border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.5)"}}>
                  Browse Problems
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Problem index (footer) ── */}
      <section className="py-16" style={{borderTop:"1px solid rgba(255,255,255,0.05)"}}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-px w-5 bg-white opacity-20" />
            <span className="text-[10px] uppercase tracking-[0.25em]" style={{color:"rgba(255,255,255,0.3)"}}>Problem index</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1">
            {alphabetical.map((p,i)=>(
              <a key={p.id} href={`/problems/${p.slug}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg group transition-all"
                style={{background:"transparent"}}
                onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.background="rgba(255,255,255,0.03)";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.background="transparent";}}>
                <span className="text-[9px] font-mono w-5" style={{color:"rgba(255,255,255,0.15)"}}>{String(i+1).padStart(2,"0")}</span>
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{background:p.accent}} />
                <span className="text-xs flex-1 min-w-0 truncate transition-colors group-hover:text-white" style={{color:"rgba(255,255,255,0.45)"}}>
                  {p.title}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[9px] uppercase tracking-widest" style={{color:"rgba(255,255,255,0.2)"}}>
                    ~{p.watchMinutes}m
                  </span>
                  <DifficultyPill diff={p.difficulty} />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      
      <Footer/>

    </main>
  );
}