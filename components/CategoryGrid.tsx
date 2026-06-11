"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CategoryGridProps } from "./types";

export default function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {categories.map((cat) => {
        const Icon = cat.icon;
        return (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug}`}
            className="group relative flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-5 shadow-sm
              hover:shadow-md hover:-translate-y-0.5 hover:border-gray-200
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500
              transition-all duration-200 cursor-pointer"
          >
            {/* Icon square */}
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cat.accentColor} shrink-0`}>
              <Icon className={`w-5 h-5 ${cat.iconColor}`} />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-indigo-700 transition-colors">
                {cat.label}
              </h3>
              <p className="mt-1 text-xs text-gray-500 leading-relaxed line-clamp-2">
                {cat.description}
              </p>
            </div>

            {/* Footer row */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
              <span className="text-[11px] font-medium text-gray-400">
                {cat.count} visualizations
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all duration-150" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}