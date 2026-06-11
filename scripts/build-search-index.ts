#!/usr/bin/env tsx
// scripts/build-search-index.ts
//
// Run: npx tsx scripts/build-search-index.ts
// Or add to package.json:  "prebuild": "tsx scripts/build-search-index.ts"
//
// Walks content/**/metadata.ts, imports each one, validates the shape,
// builds a corpus + term-frequency map for search, then writes:
//   generated/search-index.json

import fs   from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import type {
  VisualizationMeta,
  SearchIndexEntry,
  SearchIndex,
} from "../lib/metadata/types";

// ─── Config ───────────────────────────────────────────────────────────────────
const CONTENT_DIR = path.resolve(process.cwd(), "content");
const OUT_FILE    = path.resolve(process.cwd(), "generated/search-index.json");

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Recursively find every metadata.ts under a directory */
function findMetadataFiles(dir: string): string[] {
  const result: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...findMetadataFiles(full));
    } else if (entry.name === "metadata.ts" || entry.name === "metadata.js") {
      result.push(full);
    }
  }
  return result;
}

/** Normalise text: lowercase, remove punctuation, split to unique tokens */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 1);
}

/** Build a term-frequency map from a list of tokens */
function termFrequency(tokens: string[]): Record<string, number> {
  const freq: Record<string, number> = {};
  for (const t of tokens) freq[t] = (freq[t] ?? 0) + 1;
  return freq;
}

/**
 * Build the searchable corpus string for an entry.
 * Higher-weight fields are repeated to boost their relevance score.
 */
function buildCorpus(meta: VisualizationMeta): string {
  return [
    // weight 4× — most important signals
    ...Array(4).fill(meta.title),
    ...Array(4).fill(meta.keywords.join(" ")),
    ...Array(4).fill(meta.problemSignals.join(" ")),
    // weight 3×
    ...Array(3).fill(meta.concepts.join(" ")),
    ...Array(3).fill(meta.patterns.join(" ")),
    // weight 2×
    ...Array(2).fill(meta.description),
    ...Array(2).fill(meta.tagline),
    ...Array(2).fill(meta.topics.join(" ")),
    ...Array(2).fill(meta.patternCategory),
    // weight 1×
    meta.companies.join(" "),
    meta.difficulty,
    meta.relatedProblems.map(p => p.title).join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

/** Minimal validation so a bad metadata file fails loudly at build time */
function validate(meta: unknown, file: string): meta is VisualizationMeta {
  const m = meta as Record<string, unknown>;
  const required = [
    "slug","title","description","tagline","difficulty","patternCategory",
    "patterns","topics","keywords","concepts","problemSignals","companies",
    "relatedProblems","accentColor","watchMinutes","icon",
    "timeComplexity","spaceComplexity","addedAt","version",
  ];
  for (const key of required) {
    if (m[key] === undefined) {
      throw new Error(`[validate] "${file}" is missing required field: ${key}`);
    }
  }
  if (!["Easy","Medium","Hard"].includes(m.difficulty as string)) {
    throw new Error(`[validate] "${file}" has invalid difficulty: ${m.difficulty}`);
  }
  return true;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🔍  Scanning content directory:", CONTENT_DIR);

  const files = findMetadataFiles(CONTENT_DIR);
  console.log(`📄  Found ${files.length} metadata file(s)`);

  const entries: SearchIndexEntry[] = [];
  const errors: string[] = [];

  for (const file of files) {
    try {
      // Dynamic import works for both .ts (via tsx) and compiled .js
      const mod = await import(pathToFileURL(file).href);
      const meta: VisualizationMeta = mod.default ?? mod;

      validate(meta, file);

      const corpus = buildCorpus(meta);
      const tokens = tokenize(corpus);
      const termFreq = termFrequency(tokens);

      const entry: SearchIndexEntry = {
        slug:            meta.slug,
        title:           meta.title,
        description:     meta.description,
        tagline:         meta.tagline,
        difficulty:      meta.difficulty,
        patternCategory: meta.patternCategory,
        patterns:        meta.patterns,
        topics:          meta.topics,
        keywords:        meta.keywords,
        concepts:        meta.concepts,
        problemSignals:  meta.problemSignals,
        companies:       meta.companies,
        relatedProblems: meta.relatedProblems,
        accentColor:     meta.accentColor,
        watchMinutes:    meta.watchMinutes,
        icon:            meta.icon,
        timeComplexity:  meta.timeComplexity,
        spaceComplexity: meta.spaceComplexity,
        _corpus:         corpus,
        _termFreq:       termFreq,
      };

      entries.push(entry);
      console.log(`  ✓  ${meta.slug} (${meta.difficulty})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${file}: ${msg}`);
      console.error(`  ✗  ${file}\n     ${msg}`);
    }
  }

  if (errors.length > 0) {
    console.error(`\n❌  ${errors.length} error(s) — index NOT written.`);
    process.exit(1);
  }

  // Sort alphabetically by slug for deterministic output
  entries.sort((a, b) => a.slug.localeCompare(b.slug));

  const index: SearchIndex = {
    version:      "1.0.0",
    builtAt:      new Date().toISOString(),
    totalEntries: entries.length,
    entries,
  };

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(index, null, 2), "utf8");

  console.log(`\n✅  Search index written → ${OUT_FILE}`);
  console.log(`   ${entries.length} entries, built at ${index.builtAt}`);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});