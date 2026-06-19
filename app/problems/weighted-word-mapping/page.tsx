"use client";

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║              AlgoViz — Weighted Word Mapping                             ║
 * ║                                                                          ║
 * ║  Visualization for LeetCode 3838. Weighted Word Mapping                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Braces, Play, Pause, RotateCcw, StepForward } from "lucide-react";

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 1 — PROBLEM METADATA
// ════════════════════════════════════════════════════════════════════════════

const PROBLEM_TITLE = "Weighted Word Mapping";
const PROBLEM_SUBTITLE = "Array & String Manipulation";
const PROBLEM_BADGE = "Easy • Simulation";
const PROBLEM_STATEMENT = `
  Given an array of strings words and an integer array weights of length 26. 
  The weight of a word is the sum of the weights of its characters. 
  For each word, take its weight modulo 26 and map the result to a lowercase 
  English letter using reverse alphabetical order (0 -> 'z', 1 -> 'y', ..., 25 -> 'a'). 
  Return the concatenated string.
`;

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 2 — SOLUTION DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

const SOLUTIONS = [
  { id: "naive", label: "Step-by-Step", complexity: "O(N)" },
  { id: "optimized", label: "Functional", complexity: "O(N)" },
] as const;

type SolutionId = typeof SOLUTIONS[number]["id"];

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 3 — TEST CASES
// ════════════════════════════════════════════════════════════════════════════

const TEST_CASES = [
  {
    id: "example-1",
    label: "Example 1",
    words: ["abcd", "def", "xyz"],
    weights: [5,3,12,14,1,2,3,2,10,6,6,9,7,8,7,10,8,9,6,9,9,8,3,7,7,2],
    description: "Basic case",
  },
  {
    id: "example-2",
    label: "Example 2",
    words: ["a", "b", "c"],
    weights: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    description: "Edge case: uniform weights",
  },
  {
    id: "example-3",
    label: "Example 3",
    words: ["abcd"],
    weights: [7,5,3,4,3,5,4,9,4,2,2,7,10,2,5,10,6,1,2,2,4,1,3,4,4,5],
    description: "Single word",
  },
  {
    id: "custom",
    label: "Custom",
    words: [],
    weights: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    description: "Enter your own input",
  },
] as const;

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 4 — CODE SNIPPETS
// ════════════════════════════════════════════════════════════════════════════

const NAIVE_CODE: string[] = [
  "def solve(words, weights):",
  "    res = []",
  "    for w in words:",
  "        weight_sum = 0",
  "        for c in w:",
  "            weight_sum += weights[ord(c) - ord('a')]",
  "        mapped_val = weight_sum % 26",
  "        res.append(chr(ord('z') - mapped_val))",
  "    return ''.join(res)",
];

const OPTIMIZED_CODE: string[] = [
  "def solve(words, weights):",
  "    return ''.join(",
  "        chr(ord('z') - sum(weights[ord(c)-97] for c in w) % 26)",
  "        for w in words",
  "    )",
];

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 5 — STEP TYPE
// ════════════════════════════════════════════════════════════════════════════

type Phase = "init" | "process_word" | "process_char" | "map" | "done";

interface Step {
  phase: Phase;
  message: string;
  wordIndex: number | null;
  charIndex: number | null;
  currentSum: number;
  mappedChar: string | null;
  resultString: string;
  highlightedWeightIdx: number | null;
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 6 — SIMULATION FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

function makeStep(partial: Partial<Step> & Pick<Step, "phase" | "message">): Step {
  return {
    wordIndex: null,
    charIndex: null,
    currentSum: 0,
    mappedChar: null,
    resultString: "",
    highlightedWeightIdx: null,
    ...partial,
  };
}

function buildNaiveSteps(words: string[], weights: number[]): Step[] {
  const steps: Step[] = [];
  
  steps.push(makeStep({
    phase: "init",
    message: "Initialize: We will process each word, calculate its weight, and map it to a character.",
  }));

  let resultString = "";

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let currentSum = 0;
    
    steps.push(makeStep({
      phase: "process_word",
      message: `Starting to process word ${i + 1}: "${word}"`,
      wordIndex: i,
      currentSum: 0,
      resultString,
    }));

    for (let j = 0; j < word.length; j++) {
      const char = word[j];
      const weightIdx = char.charCodeAt(0) - 'a'.charCodeAt(0);
      const weight = weights[weightIdx];
      currentSum += weight;
      
      steps.push(makeStep({
        phase: "process_char",
        message: `Character '${char}' has weight ${weight}. Running sum = ${currentSum}.`,
        wordIndex: i,
        charIndex: j,
        currentSum,
        resultString,
        highlightedWeightIdx: weightIdx,
      }));
    }

    const mappedVal = currentSum % 26;
    const mappedChar = String.fromCharCode('z'.charCodeAt(0) - mappedVal);
    resultString += mappedChar;

    steps.push(makeStep({
      phase: "map",
      message: `Word "${word}" total weight = ${currentSum}. ${currentSum} % 26 = ${mappedVal}. Maps to '${mappedChar}'.`,
      wordIndex: i,
      currentSum,
      mappedChar,
      resultString,
    }));
  }

  steps.push(makeStep({
    phase: "done",
    message: `Done! Final result string: "${resultString}"`,
    resultString,
  }));

  return steps;
}

function buildOptimizedSteps(words: string[], weights: number[]): Step[] {
  return buildNaiveSteps(words, weights);
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 7 — COMPLEXITY INFO
// ════════════════════════════════════════════════════════════════════════════

const COMPLEXITY: Record<SolutionId, { time: string; space: string; note: string }> = {
  naive: {
    time: "O(N)",
    space: "O(N)",
    note: "Where N is the total number of characters across all words. We iterate through each character once.",
  },
  optimized: {
    time: "O(N)",
    space: "O(N)",
    note: "Same time complexity, but written in a more concise functional style using generators and join.",
  },
};

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 8 — PHASE DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

const PHASE_META: Record<Phase, { color: string; borderColor: string; bgColor: string; icon: string }> = {
  init:         { color: "text-slate-500",   borderColor: "border-l-slate-400",   bgColor: "bg-slate-100",   icon: "→" },
  process_word: { color: "text-blue-700",    borderColor: "border-l-blue-500",    bgColor: "bg-blue-50",     icon: "W" },
  process_char: { color: "text-sky-700",     borderColor: "border-l-sky-500",     bgColor: "bg-sky-50",      icon: "C" },
  map:          { color: "text-emerald-700", borderColor: "border-l-emerald-500", bgColor: "bg-emerald-50",  icon: "★" },
  done:         { color: "text-emerald-800", borderColor: "border-l-emerald-600", bgColor: "bg-emerald-100", icon: "■" },
};

const PHASES_BY_SOLUTION: Record<SolutionId, Phase[]> = {
  naive: ["init", "process_word", "process_char", "map", "done"],
  optimized: ["init", "process_word", "process_char", "map", "done"],
};

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 9 — REUSABLE UI COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

function CodePanel({ solution }: { solution: SolutionId }) {
  const lines   = solution === "naive" ? NAIVE_CODE : OPTIMIZED_CODE;
  const filename = solution === "naive" ? "naive.py" : "optimized.py";

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden bg-white mt-4">
      <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        <span className="ml-2 text-xs text-slate-500 font-mono">{filename}</span>
      </div>
      <div className="overflow-auto max-h-64 bg-slate-950/95">
        <table className="w-full text-xs font-mono">
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} className="hover:bg-slate-900 text-slate-100">
                <td className="select-none w-8 text-right pr-3 pl-2 py-0.5 text-slate-500 border-r border-slate-800">
                  {i + 1}
                </td>
                <td className="pl-3 py-0.5 whitespace-pre">{line}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StepLog({ steps, currentIndex }: { steps: Step[]; currentIndex: number }) {
  const visible = steps.slice(0, currentIndex + 1).reverse();

  return (
    <div
      className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1"
      style={{ scrollbarWidth: "thin" }}
    >
      {visible.map((step, i) => {
        const meta = PHASE_META[step.phase];
        return (
          <div
            key={i}
            className={`
              flex items-start gap-2 px-2 py-1.5 rounded-r border-l-2 text-xs
              transition-all duration-200
              ${meta.borderColor} ${meta.bgColor}
              ${i === 0 ? "opacity-100" : "opacity-70"}
            `}
          >
            <span className="font-mono font-bold text-slate-500 shrink-0 w-4">
              {meta.icon}
            </span>
            <span className="text-slate-700 leading-snug">{step.message}</span>
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 10 — CUSTOM VISUAL PANELS
// ════════════════════════════════════════════════════════════════════════════

function WordsPanel({ words, step }: { words: string[], step: Step }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
      <p className="text-xs text-slate-500 font-medium mb-3">Words Array</p>
      <div className="flex flex-wrap gap-4">
        {words.map((word, i) => {
          const isCurrentWord = step.wordIndex === i;
          return (
            <div 
              key={i} 
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                isCurrentWord ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 bg-white"
              }`}
            >
              <span className="text-[10px] text-slate-400 font-mono">words[{i}]</span>
              <div className="flex gap-1">
                {word.split("").map((char, j) => {
                  const isCurrentChar = isCurrentWord && step.charIndex === j;
                  return (
                    <div 
                      key={j} 
                      className={`w-8 h-8 flex items-center justify-center font-mono text-sm font-bold rounded border transition-all ${
                        isCurrentChar 
                          ? "bg-emerald-500 text-white border-emerald-600 scale-110 shadow-md" 
                          : "bg-slate-100 text-slate-700 border-slate-300"
                      }`}
                    >
                      {char}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeightsPanel({ weights, step }: { weights: number[], step: Step }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
      <p className="text-xs text-slate-500 font-medium mb-3">Weights Array (a-z)</p>
      <div className="flex flex-wrap gap-1.5">
        {weights.map((w, i) => {
          const isHighlighted = step.highlightedWeightIdx === i;
          const char = String.fromCharCode('a'.charCodeAt(0) + i);
          return (
            <div 
              key={i} 
              className={`flex flex-col items-center p-1.5 rounded border transition-all w-8 ${
                isHighlighted 
                  ? "bg-amber-100 border-amber-500 scale-110 z-10 shadow-md" 
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <span className={`text-[10px] font-bold ${isHighlighted ? "text-amber-700" : "text-slate-500"}`}>
                {char}
              </span>
              <span className={`text-xs font-mono ${isHighlighted ? "text-amber-800 font-bold" : "text-slate-600"}`}>
                {w}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResultPanel({ step }: { step: Step }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
      <p className="text-xs text-slate-500 font-medium mb-3">Mapping & Result</p>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wide">Current Sum</span>
            <span className="text-2xl font-mono font-bold text-slate-800 mt-1">
              {step.phase === "init" || step.phase === "done" ? "-" : step.currentSum}
            </span>
          </div>
          <div className="text-slate-400 text-xl">→</div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wide">Mod 26</span>
            <span className="text-2xl font-mono font-bold text-blue-600 mt-1">
              {step.phase === "init" || step.phase === "done" ? "-" : step.currentSum % 26}
            </span>
          </div>
          <div className="text-slate-400 text-xl">→</div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wide">Mapped Char</span>
            <div className={`w-12 h-12 flex items-center justify-center text-2xl font-bold rounded-lg border-2 mt-1 ${
              step.mappedChar 
                ? "bg-emerald-100 border-emerald-500 text-emerald-800" 
                : "bg-slate-100 border-slate-300 text-slate-400"
            }`}>
              {step.mappedChar || '?'}
            </div>
          </div>
        </div>
        
        <div className="pt-3 border-t border-slate-100">
          <span className="text-[10px] text-slate-400 uppercase tracking-wide">Result String</span>
          <div className="mt-1 flex gap-1 flex-wrap min-h-[32px] items-center">
            {step.resultString ? step.resultString.split("").map((c, i) => (
              <span key={i} className="w-8 h-8 flex items-center justify-center bg-emerald-500 text-white font-bold rounded shadow-sm">
                {c}
              </span>
            )) : (
              <span className="text-xs text-slate-400 italic">Empty</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 11 — MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function AlgoVizTemplate() {
  const [activeSolution, setActiveSolution] = useState<SolutionId>("naive");
  const [activeTestCase, setActiveTestCase] = useState<string>("example-1");

  const [wordsInput, setWordsInput] = useState("abcd,def,xyz");
  const [words, setWords] = useState<string[]>(["abcd", "def", "xyz"]);
  const [weightsInput, setWeightsInput] = useState("5,3,12,14,1,2,3,2,10,6,6,9,7,8,7,10,8,9,6,9,9,8,3,7,7,2");
  const [weights, setWeights] = useState<number[]>([5,3,12,14,1,2,3,2,10,6,6,9,7,8,7,10,8,9,6,9,9,8,3,7,7,2]);

  const [steps, setSteps] = useState<Step[]>(() => buildNaiveSteps(["abcd", "def", "xyz"], [5,3,12,14,1,2,3,2,10,6,6,9,7,8,7,10,8,9,6,9,9,8,3,7,7,2]));
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(700);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentStep = steps[currentStepIndex] ?? steps[0];

  const rebuild = useCallback(() => {
    const parsedWords = wordsInput.split(",").map(w => w.trim()).filter(Boolean);
    const parsedWeights = weightsInput.split(",").map(x => x.trim()).filter(Boolean).map(Number);
    
    if (parsedWeights.length !== 26 || parsedWeights.some(isNaN)) {
      return; 
    }
    
    setWords(parsedWords);
    setWeights(parsedWeights);
    
    const newSteps = activeSolution === "naive" 
      ? buildNaiveSteps(parsedWords, parsedWeights) 
      : buildOptimizedSteps(parsedWords, parsedWeights);
      
    setSteps(newSteps);
    setCurrentStepIndex(0);
    setPlaying(false);
  }, [wordsInput, weightsInput, activeSolution]);

  useEffect(() => { rebuild(); }, [rebuild]);

  useEffect(() => {
    if (!playing) { if (intervalRef.current) clearInterval(intervalRef.current); return; }

    intervalRef.current = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= steps.length - 1) return prev;
        return prev + 1;
      });
    }, speed);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, speed, steps.length]);

  useEffect(() => {
    if (playing && currentStepIndex >= steps.length - 1) setPlaying(false);
  }, [currentStepIndex, steps.length, playing]);

  const complexity = COMPLEXITY[activeSolution];
  const phases     = PHASES_BY_SOLUTION[activeSolution];

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-6 overflow-hidden">
      <header className="flex justify-between items-center mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-600 rounded-lg text-white shadow-lg">
            <Braces size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-none">
              {PROBLEM_TITLE}
            </h1>
            <p className="text-slate-500 text-xs mt-1 italic">
              {activeSolution === "naive" ? SOLUTIONS[0].label : SOLUTIONS[1].label}
            </p>
          </div>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded border border-rose-300 text-rose-700 bg-rose-50">
          {PROBLEM_BADGE}
        </span>
      </header>

      <div className="flex gap-2 mb-4 shrink-0 bg-slate-200/50 p-1 rounded-xl w-fit">
        {SOLUTIONS.map((sol) => (
          <button
            key={sol.id}
            onClick={() => setActiveSolution(sol.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeSolution === sol.id
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {sol.label}
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-mono">
              {sol.complexity}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-sm text-slate-600 leading-relaxed">{PROBLEM_STATEMENT}</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {phases.map((p) => (
              <div
                key={p}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  currentStep.phase === p
                    ? "bg-blue-600 border-blue-600 text-white shadow-md"
                    : "bg-white border-slate-200 text-slate-400"
                }`}
              >
                {p}
              </div>
            ))}
          </div>

          <WordsPanel words={words} step={currentStep} />
          <WeightsPanel weights={weights} step={currentStep} />
          <ResultPanel step={currentStep} />

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-2">Step log</p>
            <StepLog steps={steps} currentIndex={currentStepIndex} />
          </div>

          <CodePanel solution={activeSolution} />
        </div>

        <div className="w-full lg:w-80 flex flex-col gap-4 overflow-y-auto">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-3">
            <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-medium">Test Cases</p>
            <div className="flex flex-wrap gap-2">
              {TEST_CASES.map((tc) => (
                <button
                  key={tc.id}
                  onClick={() => {
                    setActiveTestCase(tc.id);
                    if (tc.id !== "custom") {
                      setWordsInput((tc.words as readonly string[]).join(","));
                      setWeightsInput((tc.weights as readonly number[]).join(","));
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeTestCase === tc.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {tc.label}
                </button>
              ))}
            </div>
            {activeTestCase !== "custom" && (
              <p className="text-[10px] text-slate-500 italic">
                {TEST_CASES.find((tc) => tc.id === activeTestCase)?.description}
              </p>
            )}
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-2">
            <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-medium">
              Input Configuration
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wide">
                  Words (comma-separated)
                </label>
                <input
                  type="text"
                  value={wordsInput}
                  onChange={(e) => { setWordsInput(e.target.value); setActiveTestCase("custom"); }}
                  className="font-mono text-xs px-2 py-1.5 rounded border border-slate-200 bg-slate-50 text-slate-900"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wide">
                  Weights (26 integers, comma-separated)
                </label>
                <textarea
                  value={weightsInput}
                  onChange={(e) => { setWeightsInput(e.target.value); setActiveTestCase("custom"); }}
                  className="font-mono text-xs px-2 py-1.5 rounded border border-slate-200 bg-slate-50 text-slate-900 h-20 resize-none"
                />
              </div>

              <button
                onClick={rebuild}
                className="mt-1 px-3 py-1.5 rounded border border-slate-300 text-xs text-slate-800 hover:bg-slate-100 transition-colors"
              >
                Rebuild steps
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Ensure exactly 26 weights are provided.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-2">Animation Controls</p>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <button
                onClick={() => setCurrentStepIndex(0)}
                disabled={currentStepIndex === 0}
                className="p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => setCurrentStepIndex((p) => Math.max(0, p - 1))}
                disabled={currentStepIndex === 0}
                className="p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
              >
                ←
              </button>
              <button
                onClick={() => setPlaying((p) => !p)}
                disabled={currentStepIndex >= steps.length - 1}
                className={`px-4 py-1.5 text-xs rounded-full border font-medium flex items-center gap-1 ${
                  playing
                    ? "bg-amber-50 text-amber-800 border-amber-300"
                    : "bg-blue-600 text-white border-blue-600 shadow-md"
                }`}
              >
                {playing ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Play</>}
              </button>
              <button
                onClick={() => setCurrentStepIndex((p) => Math.min(steps.length - 1, p + 1))}
                disabled={currentStepIndex >= steps.length - 1}
                className="p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
              >
                <StepForward size={16} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Speed</span>
              <input
                type="range"
                min={100}
                max={1200}
                step={100}
                value={1300 - speed}
                onChange={(e) => setSpeed(1300 - Number(e.target.value))}
                className="w-24 accent-blue-600"
              />
              <span className="text-xs font-mono text-slate-500">{speed}ms</span>
            </div>
            <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-200"
                style={{ width: steps.length ? `${((currentStepIndex + 1) / steps.length) * 100}%` : "0%" }}
              />
            </div>
            <span className="mt-1 block text-right text-xs text-slate-500 font-mono">
              {steps.length ? `${currentStepIndex + 1}/${steps.length}` : "0/0"}
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-2">Complexity Analysis</p>
            <div className="flex flex-col gap-3 mb-1.5">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide">Time</span>
                <p className="font-mono text-sm text-slate-900">{complexity.time}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide">Space</span>
                <p className="font-mono text-sm text-slate-900">{complexity.space}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mt-2">{complexity.note}</p>
          </div>
        </div>
      </div>
    </div>
  );
}