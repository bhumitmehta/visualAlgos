"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, ArrowRight } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SearchBarProps {
  /** Called on every keystroke with the current query */
  onSearch?: (query: string) => void;
  /** Called when user submits (Enter or click arrow) */
  onSubmit?: (query: string) => void;
  /** Placeholder suggestions that cycle when bar is idle */
  suggestions?: string[];
  /** Milliseconds each suggestion is shown before transitioning (default 2800) */
  cycleInterval?: number;
  /** Autofocus on mount */
  autoFocus?: boolean;
  /** Optional className override for the wrapper */
  className?: string;
}

// ─── Default cycling suggestions ─────────────────────────────────────────────
const DEFAULT_SUGGESTIONS = [
  'Try "sliding window"',
  'Try "union find"',
  'Try "Leetcode question 23"',
  'Try "trees"',
  'Try "Question where a binary tree is given"',
  'Try "two sum"',
  'Try "medium"',
  'Try "binary search"',
  'Try "strings"',
  'Try "arrays"',
];

// ─── Animated placeholder text ────────────────────────────────────────────────
// Renders the suggestion as a typewriter that fades character-by-character.
// phase: "typing" → "hold" → "erasing" → next suggestion
function AnimatedPlaceholder({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"typing" | "hold" | "erasing">("typing");

  useEffect(() => {
    setDisplayed("");
    setPhase("typing");
  }, [text]);

  useEffect(() => {
    if (phase === "typing") {
      if (displayed.length < text.length) {
        const t = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), 45);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setPhase("hold"), 1400);
        return () => clearTimeout(t);
      }
    }
    if (phase === "hold") {
      const t = setTimeout(() => setPhase("erasing"), 400);
      return () => clearTimeout(t);
    }
    if (phase === "erasing") {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(d => d.slice(0, -1)), 28);
        return () => clearTimeout(t);
      }
      // fully erased — parent controls next suggestion via `text` prop change
    }
  }, [phase, displayed, text]);

  return (
    <span className="pointer-events-none select-none flex items-center">
      <span style={{ color: "rgba(255,255,255,0.28)", fontFamily: "'DM Mono','Fira Code',monospace" }}>
        {displayed}
      </span>
      {/* blinking cursor */}
      <span
        className="inline-block w-px h-5 ml-0.5 align-middle"
        style={{
          background: "rgba(255,255,255,0.25)",
          animation: "blink 1s step-end infinite",
        }}
      />
    </span>
  );
}

// ─── SearchBar ────────────────────────────────────────────────────────────────
export default function SearchBar({
  onSearch,
  onSubmit,
  suggestions = DEFAULT_SUGGESTIONS,
  cycleInterval = 2800,
  autoFocus = false,
  className = "",
}: SearchBarProps) {
  const [query, setQuery]           = useState("");
  const [focused, setFocused]       = useState(false);
  const [suggIndex, setSuggIndex]   = useState(0);
  const [mounted, setMounted]       = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Cycle suggestions only when idle (no query, not focused)
  const startCycle = useCallback(() => {
    if (cycleRef.current) clearInterval(cycleRef.current);
    cycleRef.current = setInterval(() => {
      setSuggIndex(i => (i + 1) % suggestions.length);
    }, cycleInterval);
  }, [suggestions.length, cycleInterval]);

  const stopCycle = useCallback(() => {
    if (cycleRef.current) { clearInterval(cycleRef.current); cycleRef.current = null; }
  }, []);

  useEffect(() => {
    if (!focused && !query) { startCycle(); }
    else { stopCycle(); }
    return stopCycle;
  }, [focused, query, startCycle, stopCycle]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    onSearch?.(e.target.value);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { onSubmit?.(query); inputRef.current?.blur(); }
    if (e.key === "Escape") { setQuery(""); onSearch?.(""); inputRef.current?.blur(); }
  }

  function handleClear() {
    setQuery(""); onSearch?.(""); inputRef.current?.focus();
  }

  function handleSubmit() {
    onSubmit?.(query); inputRef.current?.blur();
  }

  const showPlaceholder = !query && !focused && mounted;
  const showStaticPlaceholder = !query && focused;

  return (
    <>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes searchFadeIn {
          from { opacity:0; transform:translateY(-6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .search-bar-wrapper { animation: searchFadeIn 0.4s ease forwards; }

        .search-glow-focus {
          box-shadow: 0 0 0 1px rgba(255,255,255,0.15),
                      0 4px 40px rgba(0,0,0,0.5),
                      0 0 60px rgba(59,130,246,0.08);
        }
        .search-glow-idle {
          box-shadow: 0 4px 32px rgba(0,0,0,0.4),
                      0 0 0 1px rgba(255,255,255,0.06);
        }
      `}</style>

      <div className={`search-bar-wrapper w-full ${className}`}>
        <div
          className={`
            relative flex items-center rounded-2xl transition-all duration-300
            ${focused ? "search-glow-focus" : "search-glow-idle"}
          `}
          style={{
            background: focused
              ? "rgba(255,255,255,0.055)"
              : "rgba(255,255,255,0.035)",
            border: `1px solid ${focused ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)"}`,
            transition: "background 0.25s, border-color 0.25s, box-shadow 0.25s",
          }}
        >
          {/* Search icon */}
          <div className="pl-5 pr-3 shrink-0 flex items-center">
            <Search
              className="w-5 h-5 transition-colors duration-200"
              style={{ color: focused ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)" }}
            />
          </div>

          {/* Input + overlay placeholder */}
          <div className="relative flex-1 flex items-center h-14">
            {/* Actual input */}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="absolute inset-0 w-full h-full bg-transparent outline-none text-base"
              style={{
                color: "#fff",
                fontFamily: "'DM Mono','Fira Code',monospace",
                fontSize: "0.9375rem",
                letterSpacing: "0.01em",
                caretColor: "rgba(255,255,255,0.7)",
              }}
              aria-label="Search problems"
              autoComplete="off"
              spellCheck={false}
            />

            {/* Animated cycling placeholder (idle, no query, no focus) */}
            {showPlaceholder && (
              <div className="absolute inset-0 flex items-center pointer-events-none">
                <AnimatedPlaceholder text={suggestions[suggIndex]} />
              </div>
            )}

            {/* Static placeholder on focus with no query */}
            {showStaticPlaceholder && (
              <div className="absolute inset-0 flex items-center pointer-events-none">
                <span style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'DM Mono','Fira Code',monospace", fontSize: "0.9375rem" }}>
                  Search problems, patterns, topics…
                </span>
              </div>
            )}
          </div>

          {/* Right side — kbd hint / clear / submit */}
          <div className="pr-4 pl-2 flex items-center gap-2 shrink-0">
            {!query && !focused && (
              <kbd
                className="hidden sm:flex items-center gap-1 px-2 py-1 rounded text-[10px] uppercase tracking-widest"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.25)",
                  fontFamily: "system-ui",
                }}
              >
                <span style={{ fontSize: "13px" }}>⌘</span>K
              </kbd>
            )}

            {query && (
              <button
                onClick={handleClear}
                className="flex items-center justify-center w-7 h-7 rounded-full transition-all"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {query && (
              <button
                onClick={handleSubmit}
                className="flex items-center justify-center w-8 h-8 rounded-xl transition-all"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.8)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                aria-label="Submit search"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Suggestion chips below bar (visible when idle) */}
        {!focused && !query && mounted && (
          <div
            className="flex flex-wrap gap-2 mt-3 justify-center"
            style={{ animation: "searchFadeIn 0.3s ease forwards" }}
          >
            {suggestions.slice(0, 6).map((s, i) => {
              const label = s.replace(/^Try "/, "").replace(/"$/, "");
              return (
                <button
                  key={s}
                  onClick={() => {
                    setQuery(label);
                    onSearch?.(label);
                    inputRef.current?.focus();
                  }}
                  className="text-[10px] px-3 py-1.5 rounded-full uppercase tracking-widest transition-all"
                  style={{
                    border: `1px solid ${i === suggIndex ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)"}`,
                    background: i === suggIndex ? "rgba(255,255,255,0.07)" : "transparent",
                    color: i === suggIndex ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.22)",
                    transition: "all 0.3s",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}