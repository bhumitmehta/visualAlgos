"use client";

import Link from "next/link";
import { ArrowRight, Clock, Tag, BarChart2 } from "lucide-react";
import type { FeaturedVisualizationProps } from "./types";

const DIFFICULTY_STYLES = {
  Beginner:     { chip: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  Intermediate: { chip: "bg-amber-50  text-amber-700  border-amber-100",    dot: "bg-amber-500"  },
  Advanced:     { chip: "bg-red-50    text-red-700    border-red-100",       dot: "bg-red-500"    },
};

export default function FeaturedVisualization({ visualization: viz }: FeaturedVisualizationProps) {
  const style = DIFFICULTY_STYLES[viz.difficulty];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

      {/* Left — text */}
      <div>
        {/* Domain badge */}
        <span className="inline-block rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 mb-4">
          {viz.domain}
        </span>

        <h3 className="font-display text-2xl sm:text-3xl text-gray-900 leading-tight mb-3">
          {viz.title}
        </h3>

        <p className="text-gray-500 text-sm leading-relaxed mb-5 max-w-lg">
          {viz.description}
        </p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 mb-6 text-xs text-gray-500">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium ${style.chip}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            {viz.difficulty}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            ~{viz.readMinutes} min to understand
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5 text-gray-400" />
            Interactive
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-7">
          {viz.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600"
            >
              <Tag className="w-3 h-3 text-gray-400" />
              {tag}
            </span>
          ))}
        </div>

        <Link
          href={`/visualizations/${viz.slug}`}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition-all duration-150"
        >
          Open visualization
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Right — preview iframe */}
      <div className="relative">
        <div className="rounded-2xl border border-indigo-100 bg-white shadow-xl overflow-hidden">
          {/* Fake browser chrome */}
          <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-50 border-b border-gray-100">
            <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-300" />
            <div className="flex-1 mx-3 rounded bg-white border border-gray-200 text-[10px] text-gray-400 px-2 py-1 text-center truncate">
              visupedia.io/visualizations/{viz.slug}
            </div>
          </div>

          {/* Sandboxed preview iframe */}
          <div className="relative bg-gray-50 overflow-hidden" style={{ height: "280px" }}>
            <iframe
              src={`/visualizations/${viz.slug}?preview=1`}
              sandbox="allow-scripts allow-same-origin"
              className="w-full h-full border-0 pointer-events-none"
              title={`Preview of ${viz.title}`}
              loading="lazy"
              aria-label={`Non-interactive preview of ${viz.title}`}
            />
            {/* Click overlay — directs to full page */}
            <Link
              href={`/visualizations/${viz.slug}`}
              className="absolute inset-0 flex items-end justify-end p-4"
              aria-label={`Open full ${viz.title} visualization`}
            >
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 backdrop-blur-sm border border-gray-100 shadow px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-white transition-colors">
                Open interactive version
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>
        </div>

        {/* Decorative */}
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-indigo-100 blur-2xl opacity-70 -z-10" />
        <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-violet-100 blur-2xl opacity-50 -z-10" />
      </div>

    </div>
  );
}