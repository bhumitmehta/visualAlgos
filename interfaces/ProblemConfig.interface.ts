type Difficulty = "Easy" | "Medium" | "Hard";
type IconName = "network" | "braces" | "branch" | "default";


export interface ProblemConfig {
  id: string;
  title: string;
  slug: string;
  pattern: string;
  patternCategory: string;         // e.g. "Sliding Window", "Union-Find", "Hash Map"
  difficulty: Difficulty;
  description: string;
  heroTagline: string;
  accent: string;
  accentMuted: string;
  accentText: string;
  icon: IconName;
  tags: string[];                  // Topics: Arrays, Strings, Trees, etc.
  badges: string[];                // Pattern badges shown on card
  watchMinutes: number;            // Estimated visualizer watch time
  number: string;
}