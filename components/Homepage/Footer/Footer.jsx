import Link from "next/link";
import { Network } from "lucide-react";

const footerLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  {label : "Discord", href:"https://discord.com/"},
  { label: "GitHub", href: "https://github.com/bhumitmehta/visualAlgos/", external: true },
];

export default function Footer() {
  return (
    <footer
      className="py-10 border-t border-white/5"
      aria-label="Site footer"
    >
      <div className="max-w-6xl mx-auto px-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md flex items-center justify-center bg-white/5">
            <Network className="w-3 h-3 text-white/60" />
          </div>
          <span className="text-sm font-semibold text-white/60">AlgoViz</span>
        </div>

        <p className="text-xs text-center text-white/20 max-w-md">
          Independent educational project. Not affiliated with LeetCode or Codeforces.
        </p>
        <address>Created by Bhumit Mehta</address>

        <div className="flex items-center gap-5">
          {footerLinks.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] uppercase tracking-widest text-white/20 hover:text-white/50 transition-colors"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="text-[12px] uppercase tracking-widest text-white/20 hover:text-white/50 transition-colors"
              >
                {link.label}
              </Link>
            )
          )}
        </div>
      </div>
    </footer>
  );
}