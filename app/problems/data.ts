import fs from 'fs';
import path from 'path';

// ─── Types ────────────────────────────────────────────────────────────────────

export type IconName = "network" | "braces" | "branch" | "layers" | "table" | "building" | "default";
export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Problem {
  slug: string;
  number: string;
  title: string;
  description: string;
  heroTagline: string;
  difficulty: Difficulty;
  patternCategory: string;
  patterns: string[];
  tags: string[];
  watchMinutes: number;
  accent: string;
  accentMuted: string;
  accentText: string;
  icon: IconName;
  lcNumber: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PROBLEMS_DIR = path.join(process.cwd(), 'app', 'problems');
const VALID_ICONS: IconName[] = ["network", "braces", "branch", "layers", "table", "building", "default"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidIcon(icon: any): icon is IconName {
  return typeof icon === 'string' && VALID_ICONS.includes(icon as IconName);
}

function isValidDifficulty(diff: any): diff is Difficulty {
  return diff === "Easy" || diff === "Medium" || diff === "Hard";
}

function generateFallbackMetadata(slug: string): Problem {
  return {
    slug,
    number: "#???",
    title: slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    description: "No description available.",
    heroTagline: "Check back soon!",
    difficulty: "Medium",
    patternCategory: "Uncategorized",
    patterns: ["Unknown"],
    tags: ["General"],
    watchMinutes: 5,
    accent: "#6366F1",
    accentMuted: "rgba(99,102,241,0.12)",
    accentText: "#A5B4FC",
    icon: "default",
    lcNumber: 0,
  };
}

// ─── Main function ────────────────────────────────────────────────────────────

export function getProblems(): Problem[] {
  const problems: Problem[] = [];

  if (!fs.existsSync(PROBLEMS_DIR)) {
    console.warn('Problems directory does not exist:', PROBLEMS_DIR);
    return problems;
  }

  const entries = fs.readdirSync(PROBLEMS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && entry.name !== '[slug]') {
      const slug = entry.name;
      const problemPath = path.join(PROBLEMS_DIR, slug);
      const metadataPath = path.join(problemPath, 'metadata.json');

      if (fs.existsSync(metadataPath)) {
        try {
          const metadataContent = fs.readFileSync(metadataPath, 'utf-8');

          // Check if file is empty or contains only whitespace
          if (!metadataContent || !metadataContent.trim()) {
            console.warn(`Empty metadata file for ${slug}, using defaults`);
            problems.push(generateFallbackMetadata(slug));
            continue;
          }

          const metadata = JSON.parse(metadataContent);

          // Validate and sanitize fields
          const icon = isValidIcon(metadata.icon) ? metadata.icon : "default";
          const difficulty = isValidDifficulty(metadata.difficulty) ? metadata.difficulty : "Medium";

          problems.push({
            slug,
            number: metadata.number || "#???",
            title: metadata.title || slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            description: metadata.description || "No description available.",
            heroTagline: metadata.heroTagline || "Check back soon!",
            difficulty,
            patternCategory: metadata.patternCategory || "Uncategorized",
            patterns: Array.isArray(metadata.patterns) ? metadata.patterns : ["Unknown"],
            tags: Array.isArray(metadata.tags) ? metadata.tags : ["General"],
            watchMinutes: typeof metadata.watchMinutes === 'number' ? metadata.watchMinutes : 5,
            accent: metadata.accent || "#6366F1",
            accentMuted: metadata.accentMuted || "rgba(99,102,241,0.12)",
            accentText: metadata.accentText || "#A5B4FC",
            icon,
            lcNumber: typeof metadata.lcNumber === 'number' ? metadata.lcNumber : 0,
          });
        } catch (error) {
          console.error(`Error parsing metadata for ${slug}:`, error.message);
          problems.push(generateFallbackMetadata(slug));
        }
      } else {
        // No metadata.json found, use fallback
        problems.push(generateFallbackMetadata(slug));
      }
    }
  }

  return problems;
}