// components/Footer.tsx
// Static footer — no client directive needed.

import Link from "next/link";
import { BookOpen, Github, Heart } from "lucide-react";
import type { FooterProps } from "./types";

export default function Footer({ sections, copyrightYear }: FooterProps) {
  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

        {/* Top grid: logo + link columns */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">

          {/* Brand column */}
          <div className="col-span-2 sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                <BookOpen className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-display text-base font-semibold text-gray-900">
                Visu<span className="text-indigo-600">Pedia</span>
              </span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              An open-source library of interactive visualizations for learners who want intuition, not just definitions.
            </p>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              <Github className="w-4 h-4" />
              Star on GitHub
            </a>
          </div>

          {/* Link sections */}
          {sections.map((section) => (
            <div key={section.heading}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                {section.heading}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => {
                  const isExternal = link.href.startsWith("http");
                  return (
                    <li key={link.href}>
                      {isExternal ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <p>© {copyrightYear} VisuPedia. Open-source under the MIT License.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3 h-3 text-red-400 fill-red-400 mx-0.5" /> using Next.js &amp; Tailwind CSS.
          </p>
        </div>

      </div>
    </footer>
  );
}