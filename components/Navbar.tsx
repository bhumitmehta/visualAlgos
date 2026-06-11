"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, X, BookOpen, Menu, ChevronRight } from "lucide-react";
import type { NavbarProps } from "./types";

export default function Navbar({ links, onSearch }: NavbarProps) {
  const [query, setQuery]       = useState("");
  const [focused, setFocused]   = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: ⌘K / Ctrl+K focuses search
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    onSearch?.(e.target.value);
  }

  function handleClear() {
    setQuery("");
    onSearch?.("");
    inputRef.current?.focus();
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm group-hover:bg-indigo-700 transition-colors">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-lg font-semibold text-gray-900 tracking-tight">
              Visu<span className="text-indigo-600">Pedia</span>
            </span>
          </Link>

          {/* Search bar — hidden on mobile, shown md+ */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <div className={`
              flex items-center w-full rounded-lg border transition-all duration-150
              ${focused
                ? "border-indigo-400 ring-2 ring-indigo-100 bg-white"
                : "border-gray-200 bg-gray-50 hover:border-gray-300"
              }
            `}>
              <Search className={`ml-3 w-4 h-4 shrink-0 transition-colors ${focused ? "text-indigo-500" : "text-gray-400"}`} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Search visualizations…"
                className="flex-1 bg-transparent px-2.5 py-2 text-sm text-gray-800 placeholder:text-gray-400 outline-none"
                aria-label="Search visualizations"
              />
              {query ? (
                <button onClick={handleClear} className="mr-2 p-0.5 rounded text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="mr-2.5 hidden lg:flex items-center gap-0.5 text-[10px] text-gray-400 font-sans">
                  <span className="text-xs">⌘</span>K
                </kbd>
              )}
            </div>
          </div>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contribute"
              className="ml-2 px-4 py-2 rounded-lg bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm transition-colors"
            >
              Contribute
            </Link>
          </nav>

          {/* Mobile: hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {/* Mobile search */}
          <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 mb-3">
            <Search className="ml-3 w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={handleChange}
              placeholder="Search visualizations…"
              className="flex-1 bg-transparent px-2.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none"
            />
          </div>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {link.label}
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}