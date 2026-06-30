"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Search, X, SlidersHorizontal, Clock, Tag,
  ChevronRight, Network, Braces, GitBranch, Sparkles,
  Layers, Table2, Building2, ArrowUpRight, BookOpen,
} from "lucide-react";

// Import types from data.ts
import { Problem, IconName } from './data';
import { useRouter } from "next/navigation";

// ─── Icon resolver (client-side only, avoids RSC serialisation error) ─────────

const ICON_MAP: Record<IconName, React.ElementType> = {
  network:  Network,
  braces:   Braces,
  branch:   GitBranch,
  layers:   Layers,
  table:    Table2,
  building: Building2,
  default:  Sparkles,
};

function ProblemIcon({ icon, accent }: { icon: IconName; accent: string }) {
  const I = ICON_MAP[icon];
  
  // Fallback to default icon if the provided icon doesn't exist
  const IconComponent = I || ICON_MAP.default;
  
  return <IconComponent className="h-3.5 w-3.5" style={{ color: accent }} />;
}

// ─── Difficulty pill ──────────────────────────────────────────────────────────

function DifficultyPill({ diff }: { diff: "Easy" | "Medium" | "Hard" }) {
  const cfg = {
    Easy:   { bg: "rgba(16,185,129,0.1)",  text: "#6EE7B7", dot: "#10B981" },
    Medium: { bg: "rgba(245,158,11,0.1)",  text: "#FCD34D", dot: "#F59E0B" },
    Hard:   { bg: "rgba(239,68,68,0.1)",   text: "#FCA5A5", dot: "#EF4444" },
  }[diff];
  return (
    <span style={{ background: cfg.bg, color: cfg.text }}
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest">
      <span style={{ background: cfg.dot }} className="w-1.5 h-1.5 rounded-full" />
      {diff}
    </span>
  );
}

// ─── Filter chip ──────────────────────────────────────────────────────────────

function Chip({ label, active, accent, onClick, onRemove }: {
  label: string; active: boolean; accent?: string;
  onClick: () => void; onRemove?: () => void;
}) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full text-[10px] uppercase tracking-widest px-3 py-1.5 transition-all"
      style={{
        border:     `1px solid ${active ? (accent ?? "rgba(255,255,255,0.5)") : "rgba(255,255,255,0.08)"}`,
        background: active ? `${accent ?? "rgba(255,255,255,0.15)"}20` : "transparent",
        color:      active ? "#fff" : "rgba(255,255,255,0.35)",
      }}>
      {label}
      {active && onRemove && (
        <span onClick={e => { e.stopPropagation(); onRemove(); }}
          className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity">
          <X className="w-2.5 h-2.5" />
        </span>
      )}
    </button>
  );
}

// ─── Problem card ─────────────────────────────────────────────────────────────

function ProblemCard({ p, hovered, onHover, onLeave, searchQuery }: {
  p: Problem; hovered: boolean;
  onHover: () => void; onLeave: () => void;
  searchQuery: string;
}) {
  const router = useRouter();

  function Highlight({ text }: { text: string }) {
    if (!searchQuery) return <>{text}</>;
    const idx = text.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (idx === -1) return <>{text}</>;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: "rgba(251,191,36,0.25)", color: "#FCD34D", borderRadius: "2px" }}>
          {text.slice(idx, idx + searchQuery.length)}
        </mark>
        {text.slice(idx + searchQuery.length)}
      </>
    );
  }

  return (
    <div
      onClick={() => router.push(`/problems/${p.slug}`)}
      onMouseEnter={onHover} 
      onMouseLeave={onLeave}
      className="group relative block rounded-xl overflow-hidden transition-all duration-200 cursor-pointer"
      style={{
        border:     `1px solid ${hovered ? p.accent + "40" : "rgba(255,255,255,0.06)"}`,
        background: hovered ? p.accentMuted : "rgba(255,255,255,0.015)",
        transform:  hovered ? "translateY(-2px)" : "none",
      }}>

      {/* Watermark number */}
      <div className="syne absolute top-4 right-5 text-5xl select-none pointer-events-none"
        style={{ color: "rgba(255,255,255,0.03)", lineHeight: 1, fontWeight: 800 }}>
        {p.number}
      </div>

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: p.accentMuted, border: `1px solid ${p.accent}30` }}>
              <ProblemIcon icon={p.icon} accent={p.accent} />
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.2em] mb-0.5"
                style={{ color: "rgba(255,255,255,0.25)" }}>
                <Highlight text={p.patternCategory} />
              </div>
              <DifficultyPill diff={p.difficulty} />
            </div>
          </div>
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1"
            style={{ color: "rgba(255,255,255,0.2)" }} />
        </div>

        {/* Title */}
        <h3 className="syne font-bold text-base mb-1.5 leading-snug transition-colors"
          style={{ color: hovered ? "#fff" : "rgba(255,255,255,0.8)", letterSpacing: "-0.01em" }}>
          <Highlight text={p.title} />
        </h3>

        <p className="text-xs leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>
          {p.description}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-3 mb-4 text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            ~{p.watchMinutes} min
          </span>
          <span className="inline-flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {p.tags.slice(0, 2).join(", ")}
          </span>
          <span className="inline-flex items-center gap-1 ml-auto">
            <a href={`https://leetcode.com/problems/${p.slug}/`}
              target="_blank" rel="noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-0.5 hover:opacity-80 transition-opacity"
              style={{ color: "rgba(255,255,255,0.2)" }}>
              LC {p.lcNumber} <ArrowUpRight className="w-3 h-3" />
            </a>
          </span>
        </div>

        {/* Badges */}
        <div className="flex gap-1.5 flex-wrap">
          {p.patterns.map(b => (
            <span key={b} className="text-[10px] px-2 py-0.5 rounded-full transition-all"
              style={{
                background: hovered ? `${p.accent}20` : "rgba(255,255,255,0.04)",
                color:      hovered ? p.accentText    : "rgba(255,255,255,0.25)",
                border:     `1px solid ${hovered ? p.accent + "30" : "transparent"}`,
              }}>
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* Accent bottom line */}
      <div className="h-0.5 transition-all duration-300"
        style={{ background: hovered ? p.accent : "transparent" }} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProblemsClient({ initialProblems }: { initialProblems: Problem[] }) {
  const [searchQuery,      setSearchQuery]      = useState("");
  const [activeDifficulty, setActiveDifficulty] = useState<"Easy" | "Medium" | "Hard" | null>(null);
  const [activePattern,    setActivePattern]    = useState<string | null>(null);
  const [activeTag,        setActiveTag]        = useState<string | null>(null);
  const [showFilters,      setShowFilters]      = useState(false);
  const [hovered,          setHovered]          = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const PROBLEMS = initialProblems;

  // ─── Derived filter sets (auto-built, never hand-edited) ──────────────────────

  const ALL_DIFFICULTIES: ("Easy" | "Medium" | "Hard")[] = ["Easy", "Medium", "Hard"];
  const ALL_PATTERNS: string[] = [...new Set(PROBLEMS.map(p => p.patternCategory))].sort();
  const ALL_TAGS: string[] = [...new Set(PROBLEMS.flatMap(p => p.tags))].sort();

  // ── Filtered list ──
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return PROBLEMS.filter(p => {
      if (activeDifficulty && p.difficulty !== activeDifficulty) return false;
      if (activePattern    && p.patternCategory !== activePattern) return false;
      if (activeTag        && !p.tags.includes(activeTag))         return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q)           ||
        p.patternCategory.toLowerCase().includes(q) ||
        p.patterns.some(pt => pt.toLowerCase().includes(q)) ||
        p.tags.some(t => t.toLowerCase().includes(q))       ||
        p.difficulty.toLowerCase().includes(q)              ||
        String(p.lcNumber).includes(q)
      );
    });
  }, [searchQuery, activeDifficulty, activePattern, activeTag, PROBLEMS]);

  const activeFilterCount = [activeDifficulty, activePattern, activeTag].filter(Boolean).length;

  function clearAll() {
    setSearchQuery(""); 
    setActiveDifficulty(null); 
    setActivePattern(null); 
    setActiveTag(null);
  }

  const alphabetical = [...PROBLEMS].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <main className="min-h-screen" style={{ background: "#0A0A0B", fontFamily: "'DM Mono','Fira Code',monospace", color: "#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Syne:wght@600;700;800&display=swap');
        * { box-sizing: border-box; }
        .syne { font-family: 'Syne', sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 2px; }
        input[type=search]::-webkit-search-cancel-button { display: none; }
      `}</style>

      {/* ── Nav ── */}
      <nav className="border-b sticky top-0 z-50"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(10,10,11,0.85)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Network className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="syne text-sm font-bold text-white tracking-wide">AlgoViz</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}>
              BETA
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-[11px] uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.4)" }}>Home</Link>
            <Link href="/problems" className="text-[11px] uppercase tracking-widest text-white">Problems</Link>
            <a href="https://github.com/bhumitmehta/visualAlgos" target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.4)" }}>
              GitHub <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </nav>

      {/* ── Page header ── */}
      <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-white opacity-20" />
            <span className="text-[10px] uppercase tracking-[0.25em]"
              style={{ color: "rgba(255,255,255,0.3)" }}>
              {PROBLEMS.length} visualizations
            </span>
          </div>
          <h1 className="syne text-4xl sm:text-5xl font-extrabold leading-tight mb-4"
            style={{ letterSpacing: "-0.02em" }}>
            Problem library.
          </h1>
          <p className="text-sm max-w-lg leading-relaxed"
            style={{ color: "rgba(255,255,255,0.4)" }}>
            Every problem is a purpose-built interactive animation — not a generic step-through.
            Search, filter by pattern, or just browse.
          </p>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                style={{ color: "rgba(255,255,255,0.3)" }} />
              <input
                ref={searchRef}
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by title, pattern, tag, LC number…"
                className="w-full rounded-xl pl-10 pr-10 py-3 text-sm outline-none transition-all"
                style={{
                  background:  "rgba(255,255,255,0.05)",
                  border:      `1px solid ${searchQuery ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`,
                  color:       "rgba(255,255,255,0.85)",
                  fontFamily:  "'DM Mono',monospace",
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-80 transition-opacity">
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              )}
            </div>

            {/* Filters toggle */}
            <button onClick={() => setShowFilters(f => !f)}
              className="flex items-center gap-1.5 rounded-xl px-4 py-3 text-xs transition-all"
              style={{
                border:     `1px solid ${showFilters || activeFilterCount > 0 ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)"}`,
                background: showFilters ? "rgba(255,255,255,0.08)" : "transparent",
                color:      activeFilterCount > 0 ? "#fff" : "rgba(255,255,255,0.4)",
              }}>
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold"
                  style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>
                  {activeFilterCount}
                </span>
              )}
            </button>

            {(activeFilterCount > 0 || searchQuery) && (
              <button onClick={clearAll}
                className="text-[10px] uppercase tracking-widest transition-opacity hover:opacity-80"
                style={{ color: "rgba(255,255,255,0.3)" }}>
                Clear all
              </button>
            )}
          </div>

          {/* Expandable filter panel */}
          {showFilters && (
            <div className="mt-4 rounded-xl p-4 space-y-4"
              style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>

              <div>
                <div className="text-[9px] uppercase tracking-[0.2em] mb-2"
                  style={{ color: "rgba(255,255,255,0.25)" }}>Difficulty</div>
                <div className="flex gap-2 flex-wrap">
                  {ALL_DIFFICULTIES.map(d => (
                    <Chip key={d} label={d} active={activeDifficulty === d}
                      accent={d === "Easy" ? "#10B981" : d === "Medium" ? "#F59E0B" : "#EF4444"}
                      onClick={() => setActiveDifficulty(activeDifficulty === d ? null : d)}
                      onRemove={() => setActiveDifficulty(null)} />
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[9px] uppercase tracking-[0.2em] mb-2"
                  style={{ color: "rgba(255,255,255,0.25)" }}>Pattern</div>
                <div className="flex gap-2 flex-wrap">
                  {ALL_PATTERNS.map(pat => (
                    <Chip key={pat} label={pat} active={activePattern === pat}
                      onClick={() => setActivePattern(activePattern === pat ? null : pat)}
                      onRemove={() => setActivePattern(null)} />
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[9px] uppercase tracking-[0.2em] mb-2"
                  style={{ color: "rgba(255,255,255,0.25)" }}>Topics</div>
                <div className="flex gap-2 flex-wrap">
                  {ALL_TAGS.map(tag => (
                    <Chip key={tag} label={tag} active={activeTag === tag}
                      onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                      onRemove={() => setActiveTag(null)} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Collapsed active chips */}
          {!showFilters && activeFilterCount > 0 && (
            <div className="flex gap-2 flex-wrap mt-3">
              {activeDifficulty && (
                <Chip label={activeDifficulty} active accent="#fff"
                  onClick={() => setActiveDifficulty(null)} onRemove={() => setActiveDifficulty(null)} />
              )}
              {activePattern && (
                <Chip label={activePattern} active accent="#fff"
                  onClick={() => setActivePattern(null)} onRemove={() => setActivePattern(null)} />
              )}
              {activeTag && (
                <Chip label={activeTag} active accent="#fff"
                  onClick={() => setActiveTag(null)} onRemove={() => setActiveTag(null)} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Pattern browser ── */}
      <section className="border-b py-8" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-5 bg-white opacity-20" />
            <span className="text-[10px] uppercase tracking-[0.25em]"
              style={{ color: "rgba(255,255,255,0.3)" }}>Browse by pattern</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_PATTERNS.map(pat => {
              const count  = PROBLEMS.filter(p => p.patternCategory === pat).length;
              const active = activePattern === pat;
              return (
                <button key={pat}
                  onClick={() => setActivePattern(active ? null : pat)}
                  className="inline-flex items-center gap-2 rounded-full text-[11px] px-4 py-2 transition-all"
                  style={{
                    border:     `1px solid ${active ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.08)"}`,
                    background: active ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.02)",
                    color:      active ? "#fff" : "rgba(255,255,255,0.4)",
                  }}>
                  {pat}
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                    style={{
                      background: active ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)",
                      color:      active ? "#fff" : "rgba(255,255,255,0.3)",
                    }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tag cloud */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {ALL_TAGS.map(tag => {
              const active = activeTag === tag;
              return (
                <button key={tag}
                  onClick={() => setActiveTag(active ? null : tag)}
                  className="text-[10px] px-2.5 py-1 rounded-full transition-all"
                  style={{
                    border:     `1px solid ${active ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.06)"}`,
                    background: active ? "rgba(255,255,255,0.08)" : "transparent",
                    color:      active ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.25)",
                  }}>
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Problem grid ── */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <h2 className="syne text-2xl font-extrabold" style={{ letterSpacing: "-0.02em" }}>
              {searchQuery || activeFilterCount > 0 ? "Results" : "All problems"}
            </h2>
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>
              {filtered.length} of {PROBLEMS.length}
            </span>
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(p => (
                <ProblemCard
                  key={p.slug} p={p}
                  hovered={hovered === p.slug}
                  onHover={() => setHovered(p.slug)}
                  onLeave={() => setHovered(null)}
                  searchQuery={searchQuery}
                />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <div className="text-4xl mb-4 opacity-20">∅</div>
              <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>
                No problems match your filters.
              </p>
              <button onClick={clearAll}
                className="text-xs underline transition-opacity hover:opacity-80"
                style={{ color: "rgba(255,255,255,0.3)" }}>
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Alphabetical index ── */}
      <section className="py-16 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-px w-5 bg-white opacity-20" />
            <span className="text-[10px] uppercase tracking-[0.25em]"
              style={{ color: "rgba(255,255,255,0.3)" }}>Problem index</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1">
            {alphabetical.map((p, i) => (
              <Link key={p.slug} href={`/problems/${p.slug}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg group transition-all hover:bg-white/[0.03]">
                <span className="text-[9px] font-mono w-5 tabular-nums"
                  style={{ color: "rgba(255,255,255,0.15)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: p.accent }} />
                <span className="text-xs flex-1 min-w-0 truncate transition-colors group-hover:text-white"
                  style={{ color: "rgba(255,255,255,0.45)" }}>
                  {p.title}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[9px] uppercase tracking-widest"
                    style={{ color: "rgba(255,255,255,0.2)" }}>
                    ~{p.watchMinutes}m
                  </span>
                  <DifficultyPill diff={p.difficulty} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Open-source CTA ── */}
      <section className="py-20 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="rounded-2xl relative overflow-hidden p-10 sm:p-14 text-center"
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              background: "linear-gradient(135deg,rgba(255,255,255,0.03) 0%,rgba(255,255,255,0.01) 100%)",
            }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 50% 60% at 50% 100%,rgba(99,102,241,0.08) 0%,transparent 70%)" }} />
            <div className="relative">
              <div className="text-[10px] uppercase tracking-[0.25em] mb-4"
                style={{ color: "rgba(255,255,255,0.25)" }}>Open Source</div>
              <h2 className="syne text-3xl font-extrabold text-white mb-4"
                style={{ letterSpacing: "-0.02em" }}>
                Missing a problem?<br />Add the animation.
              </h2>
              <p className="text-sm mb-8 max-w-md mx-auto"
                style={{ color: "rgba(255,255,255,0.35)" }}>
                Each visualization is self-contained. Drop your component in the right folder,
                add one entry to <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded">PROBLEMS</code> above, and open a PR.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <a href="https://github.com" target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-xs uppercase tracking-widest font-medium"
                  style={{ background: "#fff", color: "#000" }}>
                  <BookOpen className="w-3.5 h-3.5" />
                  Contribution guide
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
                <Link href="/"
                  className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-xs uppercase tracking-widest font-medium"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                  Back to home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.06)" }}>
              <Network className="w-3 h-3 text-white opacity-60" />
            </div>
            <span className="syne text-sm font-semibold text-white opacity-60">AlgoViz</span>
          </div>
          <p className="text-[10px] text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
            Independent educational project. Not affiliated with LeetCode or Codeforces.
          </p>
          <div className="flex gap-5">
            {["Privacy", "Terms", "GitHub"].map(l => (
              <a key={l} href="#"
                className="text-[10px] uppercase tracking-widest transition-opacity hover:opacity-80"
                style={{ color: "rgba(255,255,255,0.2)" }}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}