

import type { LucideIcon } from "lucide-react";
// ─── Navbar ───────────────────────────────────────────────────────────────────
export interface NavLink {
  label: string;
  href: string;
}
 
export interface NavbarProps {
  links: NavLink[];
  onSearch?: (query: string) => void;
}
 
// ─── HeroSection ─────────────────────────────────────────────────────────────
export interface HeroProps {
  tagline: string;
  subtagline: string;
  ctaLabel: string;
  ctaHref: string;
  /** Total number of visualizations in the library — shown as a stat */
  totalVisualizations: number;
  /** Total number of domains/categories */
  totalDomains: number;
}
 
// ─── CategoryGrid ────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  slug: string;
  label: string;
  description: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Number of visualizations in this category */
  count: number;
  /** Accent color for the icon background */
  accentColor: string;
  /** Text color for the icon */
  iconColor: string;
}
 
export interface CategoryGridProps {
  categories: Category[];
}
 
// ─── FeaturedVisualization ───────────────────────────────────────────────────
export interface FeaturedViz {
  id: string;
  slug: string;
  title: string;
  description: string;
  domain: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  /** How long to understand the core concept */
  readMinutes: number;
  /** Tags such as ["Graph", "BFS", "Shortest Path"] */
  tags: string[];
}
 
export interface FeaturedVisualizationProps {
  visualization: FeaturedViz;
}
 
// ─── Footer ──────────────────────────────────────────────────────────────────
export interface FooterLink {
  label: string;
  href: string;
}
 
export interface FooterSection {
  heading: string;
  links: FooterLink[];
}
 
export interface FooterProps {
  sections: FooterSection[];
  copyrightYear: number;
}
 