// app/problems/data.ts
import fs from 'fs';
import path from 'path';

// Define the type here so it can be shared
export type Problem = {
  slug: string;
  number: string;
  title: string;
  description: string;
  heroTagline: string;
  difficulty: "Easy" | "Medium" | "Hard";
  patternCategory: string;
  patterns: string[];
  tags: string[];
  watchMinutes: number;
  accent: string;
  accentMuted: string;
  accentText: string;
  icon: "network" | "braces" | "branch" | "layers" | "table" | "building" | "default";
  lcNumber: number;
};

// Path to the problems directory
const PROBLEMS_DIR = path.join(process.cwd(), 'app', 'problems');

export async function getProblems(): Promise<Problem[]> {
  try {
    // Read all directories in app/problems
    const entries = fs.readdirSync(PROBLEMS_DIR, { withFileTypes: true });
    
    const problems: Problem[] = [];

    for (const entry of entries) {
      // Only process directories (each problem is a folder)
      if (entry.isDirectory() && entry.name !== '[slug]') { // Exclude dynamic routes if any
        const slug = entry.name;
        const problemPath = path.join(PROBLEMS_DIR, slug);
        
        // Look for a metadata file, e.g., metadata.json or config.ts
        // For this example, let's assume each folder has a 'metadata.json'
        const metadataPath = path.join(problemPath, 'metadata.json');
        
        if (fs.existsSync(metadataPath)) {
          const metadataContent = fs.readFileSync(metadataPath, 'utf-8');
          const metadata = JSON.parse(metadataContent);
          
          problems.push({
            slug,
            ...metadata,
          });
        } else {
          // Fallback: Generate basic metadata from folder name if no metadata.json exists
          // This is optional, but helps if you forget to add metadata.json
          problems.push({
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
          });
        }
      }
    }

    return problems.sort((a, b) => a.title.localeCompare(b.title));
  } catch (error) {
    console.error("Error reading problems directory:", error);
    return [];
  }
}