"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  Braces,
  Play,
  Pause,
  RotateCcw,
  StepForward,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Solution = "sliding-window" | "brute-force" | "optimized";

interface Step {
  windowStart: number;
  windowEnd: number;
  currentPos: number;
  wordMap: Record<string, number>;
  seen: Record<string, number>;
  matched: number;
  valid: boolean;
  found: boolean;
  message: string;
  highlights: { index: number; color: string }[];
  matchedIndices: number[];
  phase: "init" | "check" | "match" | "fail" | "found" | "done";
}

interface EdgeCase {
  id: string;
  label: string;
  s: string;
  words: string[];
  description: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SOLUTIONS: { id: Solution; label: string; tag: string }[] = [
  { id: "brute-force", label: "Brute Force", tag: "O(n·m·w)" },
  { id: "sliding-window", label: "Sliding Window", tag: "O(n·w)" },
  { id: "optimized", label: "Optimized SW", tag: "O(n)" },
];

const EDGE_CASES: EdgeCase[] = [
  {
    id: "basic",
    label: "Basic",
    s: "barfoothefoobarman",
    words: ["foo", "bar"],
    description: "Classic example — two words, multiple valid windows.",
  },
  {
    id: "overlapping",
    label: "Overlapping",
    s: "aaa",
    words: ["a", "a"],
    description: "Duplicate words in array — word counts must be respected.",
  },
  {
    id: "no-match",
    label: "No Match",
    s: "wordgoodgoodgoodbestword",
    words: ["word", "good", "best", "word"],
    description: "Not enough 'word' occurrences — returns empty.",
  },
  {
    id: "single",
    label: "Single Word",
    s: "foobar",
    words: ["foo"],
    description: "Single word — degenerates to substring search.",
  },
  {
    id: "whole-string",
    label: "Whole String",
    s: "lingmindraboofooowingdingbarrwingman",
    words: ["fooo", "barr", "wing", "ding", "wing"],
    description: "Larger, scattered — tests window reset logic.",
  },
];

// ─── Algorithm implementations ─────────────────────────────────────────────
function buildWordMap(words: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const w of words) map[w] = (map[w] || 0) + 1;
  return map;
}

function bruteForceSteps(s: string, words: string[]): Step[] {
  const steps: Step[] = [];
  const wLen = words[0]?.length ?? 0;
  const totalLen = wLen * words.length;
  const wordMap = buildWordMap(words);
  const results: number[] = [];

  if (!wLen || totalLen > s.length) {
    steps.push({
      windowStart: 0,
      windowEnd: 0,
      currentPos: 0,
      wordMap,
      seen: {},
      matched: 0,
      valid: false,
      found: false,
      message: "String too short or empty words — no results.",
      highlights: [],
      matchedIndices: [],
      phase: "done",
    });
    return steps;
  }

  for (let i = 0; i <= s.length - totalLen; i++) {
    const sub = s.slice(i, i + totalLen);
    const seen: Record<string, number> = {};
    let matched = 0;
    let valid = true;

    steps.push({
      windowStart: i,
      windowEnd: i + totalLen - 1,
      currentPos: i,
      wordMap,
      seen: { ...seen },
      matched,
      valid: false,
      found: false,
      message: `Checking window starting at index ${i}: "${sub}"`,
      highlights: [{ index: i, color: "blue" }],
      matchedIndices: [...results],
      phase: "check",
    });

    for (let j = 0; j < totalLen; j += wLen) {
      const word = sub.slice(j, j + wLen);
      seen[word] = (seen[word] || 0) + 1;
      if (!wordMap[word] || seen[word] > wordMap[word]) {
        valid = false;
        steps.push({
          windowStart: i,
          windowEnd: i + totalLen - 1,
          currentPos: i + j,
          wordMap,
          seen: { ...seen },
          matched,
          valid: false,
          found: false,
          message: `"${word}" ${
            !wordMap[word] ? "not in words" : "appears too many times"
          } — window fails`,
          highlights: [{ index: i, color: "red" }],
          matchedIndices: [...results],
          phase: "fail",
        });
        break;
      }
      matched++;
      steps.push({
        windowStart: i,
        windowEnd: i + totalLen - 1,
        currentPos: i + j,
        wordMap,
        seen: { ...seen },
        matched,
        valid: false,
        found: false,
        message: `Matched "${word}" (${matched}/${words.length})`,
        highlights: [{ index: i, color: "amber" }],
        matchedIndices: [...results],
        phase: "match",
      });
    }

    if (valid) {
      results.push(i);
      steps.push({
        windowStart: i,
        windowEnd: i + totalLen - 1,
        currentPos: i,
        wordMap,
        seen: { ...seen },
        matched,
        valid: true,
        found: true,
        message: `✓ Valid concatenation at index ${i}!`,
        highlights: [{ index: i, color: "green" }],
        matchedIndices: [...results],
        phase: "found",
      });
    }
  }

  steps.push({
    windowStart: -1,
    windowEnd: -1,
    currentPos: -1,
    wordMap,
    seen: {},
    matched: 0,
    valid: false,
    found: false,
    message: results.length
      ? `Done! Found ${results.length} valid starting ${
          results.length === 1 ? "index" : "indices"
        }: [${results.join(", ")}]`
      : "Done! No valid concatenated substrings found.",
    highlights: [],
    matchedIndices: [...results],
    phase: "done",
  });

  return steps;
}

function slidingWindowSteps(s: string, words: string[]): Step[] {
  const steps: Step[] = [];
  const wLen = words[0]?.length ?? 0;
  const totalLen = wLen * words.length;
  const wordMap = buildWordMap(words);
  const results: number[] = [];

  if (!wLen || totalLen > s.length) {
    steps.push({
      windowStart: 0,
      windowEnd: 0,
      currentPos: 0,
      wordMap,
      seen: {},
      matched: 0,
      valid: false,
      found: false,
      message: "String too short — no results.",
      highlights: [],
      matchedIndices: [],
      phase: "done",
    });
    return steps;
  }

  for (let i = 0; i < wLen; i++) {
    let left = i,
      matched = 0;
    const seen: Record<string, number> = {};

    steps.push({
      windowStart: i,
      windowEnd: i,
      currentPos: i,
      wordMap,
      seen: { ...seen },
      matched,
      valid: false,
      found: false,
      message: `Starting offset ${i}: sliding every ${wLen} chars`,
      highlights: [],
      matchedIndices: [...results],
      phase: "init",
    });

    for (let j = i; j <= s.length - wLen; j += wLen) {
      const word = s.slice(j, j + wLen);
      if (wordMap[word] !== undefined) {
        seen[word] = (seen[word] || 0) + 1;
        matched++;
        steps.push({
          windowStart: left,
          windowEnd: j + wLen - 1,
          currentPos: j,
          wordMap,
          seen: { ...seen },
          matched,
          valid: false,
          found: false,
          message: `Added "${word}" at ${j} — window [${left}…${j + wLen - 1}]`,
          highlights: [{ index: j, color: "blue" }],
          matchedIndices: [...results],
          phase: "check",
        });

        while (seen[word] > wordMap[word]) {
          const leftWord = s.slice(left, left + wLen);
          seen[leftWord]--;
          matched--;
          left += wLen;
          steps.push({
            windowStart: left,
            windowEnd: j + wLen - 1,
            currentPos: left,
            wordMap,
            seen: { ...seen },
            matched,
            valid: false,
            found: false,
            message: `Too many "${word}" — shrinking left to ${left}`,
            highlights: [{ index: left, color: "amber" }],
            matchedIndices: [...results],
            phase: "fail",
          });
        }

        if (matched === words.length) {
          results.push(left);
          steps.push({
            windowStart: left,
            windowEnd: j + wLen - 1,
            currentPos: left,
            wordMap,
            seen: { ...seen },
            matched,
            valid: true,
            found: true,
            message: `✓ All ${words.length} words matched — index ${left}!`,
            highlights: [{ index: left, color: "green" }],
            matchedIndices: [...results],
            phase: "found",
          });
          const leftWord = s.slice(left, left + wLen);
          seen[leftWord]--;
          matched--;
          left += wLen;
        }
      } else {
        steps.push({
          windowStart: left,
          windowEnd: j + wLen - 1,
          currentPos: j,
          wordMap,
          seen: { ...seen },
          matched,
          valid: false,
          found: false,
          message: `"${word}" not in words list — reset window`,
          highlights: [{ index: j, color: "red" }],
          matchedIndices: [...results],
          phase: "fail",
        });
        Object.keys(seen).forEach((k) => delete seen[k]);
        matched = 0;
        left = j + wLen;
      }
    }
  }

  steps.push({
    windowStart: -1,
    windowEnd: -1,
    currentPos: -1,
    wordMap,
    seen: {},
    matched: 0,
    valid: false,
    found: false,
    message: results.length
      ? `Done! Found indices: [${results.join(", ")}]`
      : "Done! No valid concatenated substrings found.",
    highlights: [],
    matchedIndices: [...results],
    phase: "done",
  });

  return steps;
}

// ─── Character Cell ───────────────────────────────────────────────────────────
function CharCell({
  char,
  index,
  step,
  wLen,
  totalLen,
}: {
  char: string;
  index: number;
  step: Step;
  wLen: number;
  totalLen: number;
}) {
  const { windowStart, windowEnd, matchedIndices, phase } = step;
  const inWindow =
    windowStart >= 0 && index >= windowStart && index <= windowEnd;
  const isMatchedStart = matchedIndices.includes(index);
  const isAnyMatchedWindow = matchedIndices.some(
    (mi) => index >= mi && index < mi + totalLen
  );

  let bg = "bg-transparent";
  let border = "border-transparent";
  let textColor = "text-slate-900";
  let ring = "";

  if (phase === "done" && isAnyMatchedWindow) {
    bg = "bg-emerald-50";
    textColor = "text-emerald-700";
    border = "border-emerald-400";
  } else if (inWindow) {
    if (phase === "found") {
      bg = "bg-emerald-50";
      textColor = "text-emerald-700";
      border = "border-emerald-500";
    } else if (phase === "fail") {
      bg = "bg-rose-50";
      textColor = "text-rose-700";
      border = "border-rose-500";
    } else if (phase === "match") {
      bg = "bg-amber-50";
      textColor = "text-amber-700";
      border = "border-amber-500";
    } else {
      bg = "bg-sky-50";
      textColor = "text-sky-700";
      border = "border-sky-400";
    }
  }

  if (isMatchedStart && phase !== "done") {
    ring = "ring-2 ring-emerald-500 ring-offset-1";
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] text-slate-400 font-mono leading-none">
        {index}
      </span>
      <div
        className={`
          w-7 h-8 flex items-center justify-center
          font-mono text-sm font-medium
          border rounded transition-all duration-200
          ${bg} ${border} ${textColor} ${ring}
        `}
      >
        {char}
      </div>
    </div>
  );
}

// ─── Word Map Display ─────────────────────────────────────────────────────────
function WordMapDisplay({
  wordMap,
  seen,
}: {
  wordMap: Record<string, number>;
  seen: Record<string, number>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(wordMap).map(([word, needed]) => {
        const have = seen[word] || 0;
        const ok = have === needed;
        const over = have > needed;
        return (
          <div
            key={word}
            className={`
              px-2 py-1 rounded border text-xs font-mono
              transition-all duration-200
              ${
                over
                  ? "bg-rose-50 border-rose-400 text-rose-700"
                  : ok
                  ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                  : "bg-slate-100 border-slate-300 text-slate-700"
              }
            `}
          >
            &quot;{word}&quot; {have}/{needed}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step Stack ───────────────────────────────────────────────────────────────
function StepStack({
  steps,
  currentIndex,
}: {
  steps: Step[];
  currentIndex: number;
}) {
  const stackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stackRef.current) {
      stackRef.current.scrollTop = stackRef.current.scrollHeight;
    }
  }, [currentIndex]);

  const visible = steps.slice(0, currentIndex + 1);

  const phaseColor = (phase: Step["phase"]) => {
    switch (phase) {
      case "found":
        return "border-l-emerald-500 bg-emerald-50";
      case "fail":
        return "border-l-rose-500 bg-rose-50";
      case "match":
        return "border-l-amber-500 bg-amber-50";
      case "init":
        return "border-l-slate-400 bg-slate-100";
      case "done":
        return "border-l-sky-500 bg-sky-50";
      default:
        return "border-l-sky-500 bg-sky-50";
    }
  };

  const phaseIcon = (phase: Step["phase"]) => {
    switch (phase) {
      case "found":
        return "✓";
      case "fail":
        return "✗";
      case "match":
        return "~";
      case "done":
        return "■";
      case "init":
        return "→";
      default:
        return "·";
    }
  };

  return (
    <div
      ref={stackRef}
      className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1"
      style={{ scrollbarWidth: "thin" }}
    >
      {visible.map((step, i) => (
        <div
          key={i}
          className={`
            flex items-start gap-2 px-2 py-1.5 rounded-r border-l-2 text-xs
            transition-all duration-200
            ${phaseColor(step.phase)}
            ${i === currentIndex ? "opacity-100" : "opacity-70"}
          `}
        >
          <span className="font-mono font-bold text-slate-500 shrink-0 w-4">
            {phaseIcon(step.phase)}
          </span>
          <span className="text-slate-700 leading-snug">
            {step.message}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Code Panel ───────────────────────────────────────────────────────────────
const CODE: Record<Solution, string[]> = {
  "brute-force": [
    "function findSubstring(s, words) {",
    "  const wLen = words[0].length;",
    "  const totalLen = wLen * words.length;",
    "  const wordMap = buildMap(words);",
    "  const result = [];",
    "  for (let i = 0; i <= s.length - totalLen; i++) {",
    "    const seen = {};",
    "    let j = 0;",
    "    for (; j < totalLen; j += wLen) {",
    "      const word = s.slice(i+j, i+j+wLen);",
    "      if (!wordMap[word]) break;",
    "      seen[word] = (seen[word]||0) + 1;",
    "      if (seen[word] > wordMap[word]) break;",
    "    }",
    "    if (j === totalLen) result.push(i);",
    "  }",
    "  return result;",
    "}",
  ],
  "sliding-window": [
    "function findSubstring(s, words) {",
    "  const wLen = words[0].length;",
    "  const wordMap = buildMap(words);",
    "  const result = [];",
    "  for (let i = 0; i < wLen; i++) {",
    "    let left = i, matched = 0;",
    "    const seen = {};",
    "    for (let j = i; j <= s.length-wLen; j += wLen) {",
    "      const word = s.slice(j, j+wLen);",
    "      if (wordMap[word] !== undefined) {",
    "        seen[word] = (seen[word]||0) + 1;",
    "        matched++;",
    "        while (seen[word] > wordMap[word]) {",
    "          const lw = s.slice(left, left+wLen);",
    "          seen[lw]--; matched--; left += wLen;",
    "        }",
    "        if (matched === words.length) {",
    "          result.push(left);",
    "          seen[s.slice(left,left+wLen)]--;",
    "          matched--; left += wLen;",
    "        }",
    "      } else {",
    "        Object.keys(seen).forEach(k=>delete seen[k]);",
    "        matched = 0; left = j + wLen;",
    "      }",
    "    }",
    "  }",
    "  return result;",
    "}",
  ],
  "optimized": [
    "// Same as sliding window but with early exit",
    "function findSubstring(s, words) {",
    "  if (!s || !words.length) return [];",
    "  const wLen = words[0].length;",
    "  const need = words.length;",
    "  const wordMap = buildMap(words);",
    "  const result = [];",
    "  for (let i = 0; i < wLen; i++) {",
    "    let left = i, matched = 0;",
    "    const seen = {};",
    "    for (let j = i; j+wLen <= s.length; j += wLen) {",
    "      const word = s.slice(j, j+wLen);",
    "      if (!(word in wordMap)) {",
    "        Object.keys(seen).forEach(k=>delete seen[k]);",
    "        matched = 0; left = j + wLen; continue;",
    "      }",
    "      seen[word] = (seen[word]||0) + 1; matched++;",
    "      while (seen[word] > wordMap[word]) {",
    "        const lw = s.slice(left, left+wLen);",
    "        seen[lw]--; matched--; left += wLen;",
    "      }",
    "      if (matched === need) {",
    "        result.push(left);",
    "        seen[s.slice(left,left+wLen)]--;",
    "        matched--; left += wLen;",
    "      }",
    "    }",
    "  }",
    "  return result;",
    "}",
  ],
};

function CodePanel({ solution }: { solution: Solution }) {
  const lines = CODE[solution];
  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
      <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        <span className="ml-2 text-xs text-slate-500 font-mono">
          solution.ts
        </span>
      </div>
      <div className="overflow-auto max-h-64 bg-slate-950/95">
        <table className="w-full text-xs font-mono">
          <tbody>
            {lines.map((line, i) => (
              <tr
                key={i}
                className="hover:bg-slate-900 text-slate-100"
              >
                <td className="select-none w-8 text-right pr-3 pl-2 py-0.5 text-slate-500 border-r border-slate-800">
                  {i + 1}
                </td>
                <td className="pl-3 py-0.5 whitespace-pre">
                  {line}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SubstringVisualizer() {
  const [activeSolution, setActiveSolution] =
    useState<Solution>("sliding-window");
  const [activeEdgeCase, setActiveEdgeCase] =
    useState<string>("basic");

  // Custom test case
  const [customS, setCustomS] = useState("barfoothefoobarman");
  const [customWords, setCustomWords] = useState("foo,bar");
  const [useCustom, setUseCustom] = useState(false);

  // Animation state
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(600);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  // Derived inputs
  const activeCase = EDGE_CASES.find(
    (e) => e.id === activeEdgeCase
  )!;
  const s = useCustom ? customS : activeCase.s;
  const words = useCustom
    ? customWords
        .split(",")
        .map((w) => w.trim())
        .filter(Boolean)
    : activeCase.words;
  const wLen = words[0]?.length ?? 0;
  const totalLen = wLen * words.length;

  // Rebuild steps when inputs or solution change
  const buildSteps = useCallback(() => {
    const fn =
      activeSolution === "brute-force"
        ? bruteForceSteps
        : slidingWindowSteps;
    return fn(s, words);
  }, [s, words, activeSolution]);

  useEffect(() => {
    const newSteps = buildSteps();
    setSteps(newSteps);
    setCurrentStep(0);
    setPlaying(false);
  }, [buildSteps]);

  // Playback
  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    if (!steps.length) return;

    intervalRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) return prev;
        return prev + 1;
      });
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, speed, steps.length]);

  useEffect(() => {
    if (playing && currentStep >= steps.length - 1) {
      setPlaying(false);
    }
  }, [currentStep, steps.length, playing]);

  const step = steps[currentStep] ?? steps[0];

  const handleApplyCustom = () => {
    setUseCustom(true);
  };

  const complexityInfo: Record<
    Solution,
    { time: string; space: string; note: string }
  > = {
    "brute-force": {
      time: "O(n · m · w)",
      space: "O(m)",
      note: "n = string length, m = words count, w = word length. Checks every possible window from scratch.",
    },
    "sliding-window": {
      time: "O(n · w)",
      space: "O(m)",
      note: "Runs w passes (one per offset). Each pass is O(n/w) word operations. Avoids recomputing from scratch.",
    },
    "optimized": {
      time: "O(n)",
      space: "O(m)",
      note: "Same sliding window but with early exit on unknown words. Constant factor improvement.",
    },
  };

  const cx = complexityInfo[activeSolution];

  return (
    <>
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-6 overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-600 rounded-lg text-white shadow-lg">
            <Braces size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-none">
              Substring Concatenation Visualizer
            </h1>
            <p className="text-slate-500 text-xs mt-1 italic">
              Step-by-step brute force &amp; sliding window
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 h-full overflow-hidden">
        {/* Main Content Area (Left) */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
          
          

          {/* Problem header + solution tabs */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded border border-rose-300 text-rose-700 bg-rose-50">
                Hard
              </span>
              <span className="text-xs text-slate-400">#30</span>
            </div>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Find all starting indices where a substring is a concatenation
              of every word in{" "}
              <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">
                words
              </code>{" "}
              (in any order, no gaps).
            </p>

            {/* Solution tabs */}
            <div className="mt-4 flex gap-2 flex-wrap">
              {SOLUTIONS.map((sol) => (
                <button
                  key={sol.id}
                  onClick={() => setActiveSolution(sol.id)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                    border transition-all duration-150
                    ${
                      activeSolution === sol.id
                        ? "border-sky-500 bg-sky-50 text-sky-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-100"
                    }
                  `}
                >
                  {sol.label}
                  <span
                    className={`
                      font-mono text-[10px] px-1 py-0.5 rounded
                      ${
                        activeSolution === sol.id
                          ? "bg-white text-sky-700"
                          : "bg-slate-100 text-slate-500"
                      }
                    `}
                  >
                    {sol.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {/* Phase Indicators */}
          {step && (
            <div className="flex gap-2">
              {["init", "check", "match", "fail", "found", "done"].map(
                (p) => (
                  <div
                    key={p}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      step.phase === p
                        ? "bg-blue-600 border-blue-600 text-white shadow-md"
                        : "bg-white border-slate-200 text-slate-400"
                    }`}
                  >
                    {p.toUpperCase()}
                  </div>
                )
              )}
            </div>
          )}

          {/* String display */}
          {step && (
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-500 font-medium">
                  String s
                </p>
                <div className="flex gap-3 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-sky-50 border border-sky-400 inline-block" />
                    Checking
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-amber-50 border border-amber-500 inline-block" />
                    Matching
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-rose-50 border border-rose-500 inline-block" />
                    Failed
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-emerald-50 border border-emerald-500 inline-block" />
                    Found
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {s.split("").map((char, i) => (
                  <CharCell
                    key={i}
                    char={char}
                    index={i}
                    step={step}
                    wLen={wLen}
                    totalLen={totalLen}
                  />
                ))}
              </div>
              {step.windowStart >= 0 && (
                <div className="mt-2 text-xs text-slate-600 font-mono">
                  Window:{" "}
                  <span className="text-slate-900">
                    &quot;
                    {s.slice(step.windowStart, step.windowEnd + 1)}
                    &quot;
                  </span>{" "}
                  <span className="text-slate-400">
                    [{step.windowStart}…{step.windowEnd}]
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Word map tracker */}
          {step && (
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
              <p className="text-xs text-slate-500 font-medium mb-2">
                Word tracker — seen / needed
              </p>
              <WordMapDisplay
                wordMap={step.wordMap}
                seen={step.seen}
              />
              <div className="mt-2 flex items-center gap-3 text-xs">
                <span className="text-slate-500">
                  Matched:{" "}
                  <span className="font-mono text-slate-900">
                    {step.matched}/{words.length}
                  </span>
                </span>
                {step.matchedIndices.length > 0 && (
                  <span className="text-emerald-600">
                    Found at: [{step.matchedIndices.join(", ")}]
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Step stack */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-2">
              Step log — window movement &amp; decisions
            </p>
            {steps.length > 0 && (
              <StepStack
                steps={steps}
                currentIndex={currentStep}
              />
            )}
          </div>
        </div>

        {/* Control Panel (Right) */}
        <div className="w-full lg:w-72 flex flex-col gap-4">
          {/* Test cases */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-medium">
              Test Cases
            </p>
            <div className="flex gap-2 flex-wrap">
              {EDGE_CASES.map((ec) => (
                <button
                  key={ec.id}
                  onClick={() => {
                    setActiveEdgeCase(ec.id);
                    setUseCustom(false);
                  }}
                  className={`
                    px-2.5 py-1 rounded text-xs border transition-all duration-150
                    ${
                      !useCustom && activeEdgeCase === ec.id
                        ? "border-slate-400 bg-slate-100 text-slate-900"
                        : "border-slate-200 text-slate-500 hover:bg-slate-100"
                    }
                  `}
                >
                  {ec.label}
                </button>
              ))}
            </div>
            {!useCustom && (
              <p className="text-xs text-slate-400 mt-1.5 italic">
                {activeCase.description}
              </p>
            )}
          </div>

          {/* Custom test case */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-2">
            <p className="text-xs font-medium text-slate-600">
              Custom test case
            </p>
            <div className="flex gap-2 flex-wrap items-end">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wide">
                  s
                </label>
                <input
                  type="text"
                  value={customS}
                  onChange={(e) => setCustomS(e.target.value)}
                  className="font-mono text-xs px-2 py-1.5 rounded border border-slate-200 bg-slate-50 text-slate-900 w-48"
                  placeholder="barfoothefoobarman"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wide">
                  words (comma separated)
                </label>
                <input
                  type="text"
                  value={customWords}
                  onChange={(e) =>
                    setCustomWords(e.target.value)
                  }
                  className="font-mono text-xs px-2 py-1.5 rounded border border-slate-200 bg-slate-50 text-slate-900 w-40"
                  placeholder="foo,bar"
                />
              </div>
              <button
                onClick={handleApplyCustom}
                className="px-3 py-1.5 rounded border border-slate-300 text-xs text-slate-800 hover:bg-slate-100 transition-colors"
              >
                Apply
              </button>
            </div>
            {useCustom &&
            words.length > 0 &&
            words.every((w) => w.length === wLen) ? (
              <p className="text-[10px] text-emerald-600">
                ✓ wLen={wLen}, totalLen={totalLen}, words=
                {words.length}
              </p>
            ) : useCustom ? (
              <p className="text-[10px] text-rose-600">
                ✗ All words must be the same length
              </p>
            ) : null}
          </div>

          {/* Controls */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-2">
              Animation Controls
            </p>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <button
                onClick={() => setCurrentStep(0)}
                disabled={currentStep === 0}
                className="p-2 text-xs rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() =>
                  setCurrentStep((p) => Math.max(0, p - 1))
                }
                disabled={currentStep === 0}
                className="p-2 text-xs rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
              >
                ←
              </button>
              <button
                onClick={() => setPlaying((p) => !p)}
                disabled={currentStep >= steps.length - 1}
                className={`px-4 py-1.5 text-xs rounded-full border border-slate-300 font-medium flex items-center gap-1 ${
                  playing
                    ? "bg-amber-50 text-amber-800"
                    : "bg-blue-600 text-white shadow-md"
                }`}
              >
                {playing ? (
                  <>
                    <Pause size={14} /> Pause
                  </>
                ) : (
                  <>
                    <Play size={14} /> Play
                  </>
                )}
              </button>
              <button
                onClick={() =>
                  setCurrentStep((p) =>
                    Math.min(steps.length - 1, p + 1)
                  )
                }
                disabled={currentStep >= steps.length - 1}
                className="p-2 text-xs rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
              >
                <StepForward size={16} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                Speed
              </span>
              <input
                type="range"
                min={100}
                max={1200}
                step={100}
                value={1300 - speed}
                onChange={(e) =>
                  setSpeed(1300 - Number(e.target.value))
                }
                className="w-24 accent-blue-600"
              />
              <span className="text-xs font-mono text-slate-500">
                {speed}ms
              </span>
            </div>
            <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-200"
                style={{
                  width: steps.length
                    ? `${
                        ((currentStep + 1) / steps.length) * 100
                      }%`
                    : "0%",
                }}
              />
            </div>
            <span className="mt-1 block text-right text-xs text-slate-500 font-mono">
              {steps.length
                ? `${currentStep + 1}/${steps.length}`
                : "0/0"}
            </span>
          </div>

          {/* Complexity */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-2">
              Complexity
            </p>
            <div className="flex gap-4 mb-1.5">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                  Time
                </span>
                <p className="font-mono text-sm text-slate-900">
                  {cx.time}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                  Space
                </span>
                <p className="font-mono text-sm text-slate-900">
                  {cx.space}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {cx.note}
            </p>
          </div>

          {/* Code */}
          
        </div>
        
      </div>
    
    </div>
      <CodePanel solution={activeSolution} /> </>
  );
}