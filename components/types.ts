// components/types.ts
// Shared prop interfaces for all VisuPedia components.

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
  totalVisualizations: number;
  totalDomains: number;
}

// ─── CategoryGrid ────────────────────────────────────────────────────────────
/**
 * Plain string keys that map to Lucide icons INSIDE CategoryGrid (client component).
 * Never pass a Lucide component object as a prop from a Server Component —
 * it can't be serialized. Pass this string key instead; CategoryGrid resolves it.
 * To add a new icon: add the key here + add it to ICON_MAP in CategoryGrid.tsx.
 */
export type CategoryIconKey =
  | "Cpu"
  | "BrainCircuit"
  | "TrendingUp"
  | "FlaskConical"
  | "Network"
  | "BarChart3"
  | "Waves"
  | "Atom";

export interface Category {
  id: string;
  slug: string;
  label: string;
  description: string;
  /**
   * Icon name string — resolved to a Lucide component inside CategoryGrid.
   * Must be a plain string so it serializes across the server/client boundary.
   */
  icon: CategoryIconKey;
  count: number;
  accentColor: string;
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
  readMinutes: number;
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