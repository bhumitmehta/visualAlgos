"use client";

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║   AlgoViz — Number of ZigZag Arrays II  (LC 3700)                       ║
 * ║                                                                          ║
 * ║   n up to 10⁹ → can't loop n times → Matrix Exponentiation              ║
 * ║                                                                          ║
 * ║   Algorithm:                                                             ║
 * ║   1. Compress values: m = r−l+1  (≤ 75)                                 ║
 * ║   2. DP state vector  v  of size 2m:                                    ║
 * ║        v[v]     = seqs ending at value v, last move was ↑ (dp_dn)       ║
 * ║        v[m+v]   = seqs ending at value v, last move was ↓ (dp_up)       ║
 * ║   3. Build 2m×2m transition matrix T                                    ║
 * ║   4. Answer = sum( T^(n−2) · base_vector )                              ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Braces, Play, Pause, RotateCcw, StepForward, Zap } from "lucide-react";

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 1 — PROBLEM METADATA
// ════════════════════════════════════════════════════════════════════════════

const PROBLEM_TITLE    = "Number of ZigZag Arrays II";
const PROBLEM_SUBTITLE = "Matrix Exponentiation · O(m³ log n)";
const PROBLEM_BADGE    = "Hard • Matrix Expo";
const PROBLEM_STATEMENT =
`Count arrays of length n with values in [l, r] where:
  • No two adjacent elements are equal
  • No three consecutive elements are all-increasing or all-decreasing

Constraint: n can be up to 10⁹ — a simple O(n·m) loop would time out.

Key insight: the DP transition is LINEAR (matrix multiply).
Represent it as a (2m)×(2m) matrix T, then:

  answer = sum( T^(n−2) × base_vector )

Compute T^(n−2) via repeated squaring in O(m³ log n).`;

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 2 — SOLUTION DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

const SOLUTIONS = [
  { id: "matexp", label: "Matrix Expo", complexity: "O(m³ log n)" },
  { id: "dp",     label: "Iterative DP (small n)", complexity: "O(n·m)" },
] as const;
type SolutionId = typeof SOLUTIONS[number]["id"];

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 3 — TEST CASES
// ════════════════════════════════════════════════════════════════════════════

const TEST_CASES = [
  { id: "ex1",   label: "Ex 1",     n: 3,         l: 4, r: 5,  expected: 2,          desc: "n=3, m=2 → 2 arrays: [4,5,4] and [5,4,5]" },
  { id: "ex2",   label: "Ex 2",     n: 3,         l: 1, r: 3,  expected: 10,         desc: "n=3, m=3 → 10 arrays" },
  { id: "ex3",   label: "n=5 m=3",  n: 5,         l: 1, r: 3,  expected: 14,         desc: "n=5, m=3" },
  { id: "big",   label: "n=10⁹",    n: 1000000000,l: 1, r: 2,  expected: 2,          desc: "n=10⁹, m=2 — only 2 arrays exist (alternating)" },
  { id: "mid",   label: "n=100 m=5",n: 100,       l: 1, r: 5,  expected: -1,         desc: "n=100, m=5 — stress test matrix expo" },
  { id: "custom",label: "Custom",   n: 3,         l: 1, r: 3,  expected: -1,         desc: "Enter your own" },
] as const;

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 4 — CODE SNIPPETS
// ════════════════════════════════════════════════════════════════════════════

const MATEXP_CODE: string[] = [
  "const long long MOD = 1e9 + 7;",
  "typedef vector<vector<long long>> Mat;",
  "",
  "Mat matMul(const Mat& A, const Mat& B, int sz) {",
  "  Mat C(sz, vector<long long>(sz, 0));",
  "  for (int i=0;i<sz;i++) for (int k=0;k<sz;k++) if (A[i][k])",
  "    for (int j=0;j<sz;j++) C[i][j]=(C[i][j]+A[i][k]*B[k][j])%MOD;",
  "  return C;",
  "}",
  "",
  "Mat matPow(Mat M, long long p, int sz) {",
  "  Mat R(sz, vector<long long>(sz, 0));",
  "  for (int i=0;i<sz;i++) R[i][i]=1; // identity",
  "  while (p > 0) {",
  "    if (p & 1) R = matMul(R, M, sz); // bit is set → multiply",
  "    M = matMul(M, M, sz);            // square the matrix",
  "    p >>= 1;                         // shift to next bit",
  "  }",
  "  return R;",
  "}",
  "",
  "int countZigZag(long long n, int l, int r) {",
  "  int m = r - l + 1;",
  "  int sz = 2 * m; // state: [0..m-1]=dn, [m..2m-1]=up",
  "",
  "  // Build base vector (length-2 sequences)",
  "  vector<long long> base(sz, 0);",
  "  for (int a=0;a<m;a++) for (int b=0;b<m;b++) if (a!=b)",
  "    (b>a ? base[b] : base[m+b])++;",
  "",
  "  if (n == 2) { long long ans=0; for (auto x:base) ans=(ans+x)%MOD; return ans; }",
  "",
  "  // Build transition matrix T",
  "  Mat T(sz, vector<long long>(sz, 0));",
  "  for (int y=0;y<m;y++) {",
  "    for (int x=0;x<m;x++) {",
  "      if (x < y) T[y][m+x] = 1;   // up[x] → dn[y]  (x<y, move ↑)",
  "      if (x > y) T[m+y][x] = 1;   // dn[x] → up[y]  (x>y, move ↓)",
  "    }",
  "  }",
  "",
  "  // Raise T to power (n-2)",
  "  Mat Tp = matPow(T, n-2, sz);",
  "",
  "  // Multiply Tp × base, sum result",
  "  long long ans = 0;",
  "  for (int i=0;i<sz;i++) {",
  "    long long s=0;",
  "    for (int j=0;j<sz;j++) s=(s+Tp[i][j]*base[j])%MOD;",
  "    ans = (ans + s) % MOD;",
  "  }",
  "  return ans;",
  "}",
];

const DP_CODE: string[] = [
  "// Iterative DP — only works for small n",
  "int countZigZag(int n, int l, int r) {",
  "  int m = r - l + 1;",
  "  const int MOD = 1e9 + 7;",
  "  vector<long long> dp_dn(m,0), dp_up(m,0);",
  "  // Base: length 2",
  "  for (int a=0;a<m;a++) for (int b=0;b<m;b++) if (a!=b)",
  "    (b>a ? dp_dn[b] : dp_up[b])++;",
  "  // Extend step by step",
  "  for (int len=3; len<=n; len++) {",
  "    vector<long long> nd(m,0), nu(m,0);",
  "    long long pref=0;",
  "    for (int y=0;y<m;y++) { nd[y]=pref; pref=(pref+dp_up[y])%MOD; }",
  "    long long suff=0;",
  "    for (int y=m-1;y>=0;y--) { nu[y]=suff; suff=(suff+dp_dn[y])%MOD; }",
  "    dp_dn=nd; dp_up=nu;",
  "  }",
  "  long long ans=0;",
  "  for (int v=0;v<m;v++) ans=(ans+dp_dn[v]+dp_up[v])%MOD;",
  "  return ans;",
  "}",
];

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 5 — STEP TYPE
// ════════════════════════════════════════════════════════════════════════════

type Phase =
  | "init"
  | "base_vector"
  | "build_matrix"
  | "matrix_explain"
  | "expo_start"
  | "expo_bit"
  | "expo_multiply"
  | "expo_square"
  | "final_multiply"
  | "done"
  // DP phases (small-n mode)
  | "dp_base"
  | "dp_prefix"
  | "dp_suffix"
  | "dp_update"
  | "dp_done";

interface Step {
  phase:        Phase;
  message:      string;
  insight:      string;

  // core DP state
  dp_dn:        number[];
  dp_up:        number[];
  new_dp_dn:    number[];
  new_dp_up:    number[];
  current_len:  number;

  // matrix expo state
  m:            number;
  base_vector:  number[];
  trans_matrix: number[][];   // transition matrix (2m × 2m), shown capped at 2m for display
  result_matrix:number[][];   // current result matrix (R after squarings/multiplies)
  power_matrix: number[][];   // M after squarings
  exponent:     number;       // current remaining exponent
  bit_value:    number;       // which power of 2 we're at
  binary_repr:  string;       // binary of original exponent
  bits_done:    number[];     // which bit positions are done

  // highlight
  active_row:   number;
  active_col:   number;

  total:        number;
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 6 — MATRIX MATH
// ════════════════════════════════════════════════════════════════════════════

const MOD = 1_000_000_007n;

function matMul(A: bigint[][], B: bigint[][], sz: number): bigint[][] {
  const C: bigint[][] = Array.from({length:sz},()=>new Array(sz).fill(0n));
  for (let i=0;i<sz;i++) for (let k=0;k<sz;k++) if (A[i][k]) {
    for (let j=0;j<sz;j++) C[i][j]=(C[i][j]+A[i][k]*B[k][j])%MOD;
  }
  return C;
}

function identity(sz: number): bigint[][] {
  const I: bigint[][] = Array.from({length:sz},()=>new Array(sz).fill(0n));
  for (let i=0;i<sz;i++) I[i][i]=1n;
  return I;
}

function toBigMat(m: number[][]): bigint[][] {
  return m.map(row=>row.map(v=>BigInt(v)));
}

function toNumMat(m: bigint[][]): number[][] {
  return m.map(row=>row.map(v=>Number(v%MOD)));
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 6b — SIMULATION: MATRIX EXPO
// ════════════════════════════════════════════════════════════════════════════

function isZigzag(arr: number[]): boolean {
  for (let i=1;i<arr.length;i++) if (arr[i]===arr[i-1]) return false;
  for (let i=2;i<arr.length;i++) {
    if ((arr[i]>arr[i-1]) === (arr[i-1]>arr[i-2])) return false;
  }
  return true;
}
function sampleZigzags(len: number, l: number, r: number, limit=5): number[][] {
  const res: number[][] = [];
  function gen(cur: number[]) {
    if (res.length >= limit) return;
    if (cur.length === len) { if (isZigzag(cur)) res.push([...cur]); return; }
    for (let v=l;v<=r;v++) gen([...cur,v]);
  }
  gen([]);
  return res;
}

function blankStep(over: Partial<Step> & Pick<Step,"phase"|"message">): Step {
  return {
    insight:"", dp_dn:[], dp_up:[], new_dp_dn:[], new_dp_up:[],
    current_len:0, m:0, base_vector:[], trans_matrix:[], result_matrix:[],
    power_matrix:[], exponent:0, bit_value:1, binary_repr:"", bits_done:[],
    active_row:-1, active_col:-1, total:0,
    ...over,
  };
}

/** Cap matrix display to at most `cap` rows/cols */
function capMat(mat: number[][], cap=8): number[][] {
  return mat.slice(0,cap).map(r=>r.slice(0,cap));
}

function buildMatExpSteps(n: number, l: number, r: number): Step[] {
  const steps: Step[] = [];
  const m = r - l + 1;
  const sz = 2 * m;
  const DISP = Math.min(m, 6); // how many values to show in matrices

  // ── INIT ──
  steps.push(blankStep({
    phase:"init", m,
    message:`n=${n}, m=r−l+1=${m}. State size = 2m = ${2*m}. Need T^${n-2}.`,
    insight:`n can be up to 10⁹. An O(n·m) loop would do ${n}×${m} = ${(n*m).toLocaleString()} operations — way too slow.\n\nInstead, we encode one DP step as a (2m)×(2m) matrix T.\nThen "doing n−2 steps" = multiplying by T^(n−2).\n\nMatrix power via repeated squaring: O(m³ log n).\nFor m=75, log(10⁹)≈30: only ~30 matrix multiplications!`,
    dp_dn:new Array(m).fill(0), dp_up:new Array(m).fill(0),
    base_vector:new Array(sz).fill(0), trans_matrix:Array.from({length:sz},()=>new Array(sz).fill(0)),
    result_matrix:Array.from({length:sz},()=>new Array(sz).fill(0)),
    power_matrix:Array.from({length:sz},()=>new Array(sz).fill(0)),
    exponent:n-2,
  }));

  // ── BASE VECTOR ──
  const base = new Array(sz).fill(0);
  for (let a=0;a<m;a++) for (let b=0;b<m;b++) if (a!==b) {
    b>a ? base[b]++ : base[m+b]++;
  }
  const dp_dn_init = base.slice(0,m);
  const dp_up_init = base.slice(m);

  steps.push(blankStep({
    phase:"base_vector", m, dp_dn:dp_dn_init, dp_up:dp_up_init,
    base_vector:[...base],
    trans_matrix:Array.from({length:sz},()=>new Array(sz).fill(0)),
    result_matrix:Array.from({length:sz},()=>new Array(sz).fill(0)),
    power_matrix:Array.from({length:sz},()=>new Array(sz).fill(0)),
    exponent:n-2, current_len:2,
    total:base.reduce((a,b)=>a+b,0),
    message:`Base vector (length-2 sequences): ${base.slice(0,DISP).join(", ")}${m>DISP?"…":""}`,
    insight:`Encode length-2 sequences as a state vector of size 2m:\n  base[v]   = # seqs ending at v with last move ↑  (= dp_dn[v] = v)\n  base[m+v] = # seqs ending at v with last move ↓  (= dp_up[v] = m−1−v)\n\nEach entry counts how many length-2 sequences end at that (value, direction) state.\nTotal = m(m−1) = ${m*(m-1)} distinct pairs.`,
  }));

  // ── BUILD TRANSITION MATRIX ──
  const T: number[][] = Array.from({length:sz},()=>new Array(sz).fill(0));
  for (let y=0;y<m;y++) {
    for (let x=0;x<m;x++) {
      if (x<y) T[y][m+x]=1;    // up[x] → dn[y]
      if (x>y) T[m+y][x]=1;    // dn[x] → up[y]
    }
  }

  steps.push(blankStep({
    phase:"build_matrix", m, dp_dn:dp_dn_init, dp_up:dp_up_init,
    base_vector:[...base], trans_matrix:T,
    result_matrix:Array.from({length:sz},()=>new Array(sz).fill(0)),
    power_matrix:toNumMat(toBigMat(T)),
    exponent:n-2,
    message:`Built ${sz}×${sz} transition matrix T.`,
    insight:`T encodes one DP step. T[dest][src] = 1 if state src can transition to state dest.\n\nState layout:\n  Row/Col 0..m−1   = "dn" states (last move ↑, next must ↓)\n  Row/Col m..2m−1  = "up" states (last move ↓, next must ↑)\n\nT[y][m+x] = 1  if x<y  (up[x] can flow to dn[y], since x→y is ↑ and we needed prev to be ↓)\nT[m+y][x] = 1  if x>y  (dn[x] can flow to up[y], since x→y is ↓ and we needed prev to be ↑)\n\nAll other entries = 0. The matrix is very sparse!`,
  }));

  // ── EXPLAIN MATRIX STRUCTURE ──
  steps.push(blankStep({
    phase:"matrix_explain", m, dp_dn:dp_dn_init, dp_up:dp_up_init,
    base_vector:[...base], trans_matrix:T,
    result_matrix:Array.from({length:sz},()=>new Array(sz).fill(0)),
    power_matrix:toNumMat(toBigMat(T)),
    exponent:n-2,
    message:`T has 4 quadrants: zero, upper-right (dn←up), lower-left (up←dn), zero.`,
    insight:`The ${sz}×${sz} matrix T has a block structure:\n\n  [ 0    | A  ]    top-left:  dn←dn  = impossible (can't go ↑ after ↑)\n  [------+----]    top-right: dn←up  = T[y][m+x]=1 if x<y\n  [ B    | 0  ]    bot-left:  up←dn  = T[m+y][x]=1 if x>y\n                   bot-right: up←up  = impossible (can't go ↓ after ↓)\n\nOnly ~m(m−1)/2 nonzero entries in each block — the zigzag constraint makes T very sparse.`,
  }));

  // ── MATRIX EXPO ──
  const exp = n - 2;
  const binStr = exp.toString(2);

  steps.push(blankStep({
    phase:"expo_start", m, dp_dn:dp_dn_init, dp_up:dp_up_init,
    base_vector:[...base], trans_matrix:T,
    result_matrix:toNumMat(identity(sz)),
    power_matrix:toNumMat(toBigMat(T)),
    exponent:exp, binary_repr:binStr, bits_done:[],
    message:`Start repeated squaring: compute T^${exp} = T^${binStr.split("").map((b,i)=>b==="1"?`2^${binStr.length-1-i}`:"").filter(Boolean).join(" × ")}.`,
    insight:`Repeated squaring (fast exponentiation):\n\nWrite exponent in binary: ${exp} = ${binStr}₂\n\nFor each bit (right to left):\n  • If bit is 1 → multiply result R by current M\n  • Always square M (M = M²)\n\nThis reduces ${exp} multiplications to only ${binStr.split("").filter(b=>b==="1").length} result multiplications + ${binStr.length} squarings.\n\nTotal: ${binStr.length} matrix squarings = O(m³ × ${binStr.length}) operations.`,
  }));

  // Run the actual expo with steps
  let R = identity(sz);
  let M = toBigMat(T);
  let p = BigInt(exp);
  let bitPos = 0;
  const donePos: number[] = [];

  while (p > 0n) {
    if (p & 1n) {
      const prevR = R;
      R = matMul(R, M, sz);
      donePos.push(bitPos);
      steps.push(blankStep({
        phase:"expo_multiply", m, dp_dn:dp_dn_init, dp_up:dp_up_init,
        base_vector:[...base], trans_matrix:T,
        result_matrix:toNumMat(R),
        power_matrix:toNumMat(M),
        exponent:Number(p), binary_repr:binStr,
        bits_done:[...donePos],
        message:`Bit ${bitPos} is SET → R = R × M  (absorbed 2^${bitPos})`,
        insight:`Binary bit ${bitPos} of the exponent is 1.\nR = R × M incorporates this power of 2.\n\nAfter this: R represents T^${donePos.map(b=>`2^${b}`).join(" × ")} = T^${donePos.reduce((acc,b)=>acc+2**b,0)}\n\nRemaining exponent: ${Number(p>>1n)}`,
      }));
    } else {
      steps.push(blankStep({
        phase:"expo_bit", m, dp_dn:dp_dn_init, dp_up:dp_up_init,
        base_vector:[...base], trans_matrix:T,
        result_matrix:toNumMat(R),
        power_matrix:toNumMat(M),
        exponent:Number(p), binary_repr:binStr,
        bits_done:[...donePos],
        message:`Bit ${bitPos} is 0 → skip multiply, just square M.`,
        insight:`Binary bit ${bitPos} of the exponent is 0.\nNo multiply into R needed for this bit position.\nJust square M so it represents the next power of 2.`,
      }));
    }

    M = matMul(M, M, sz);
    p >>= 1n;
    bitPos++;

    if (p > 0n) {
      steps.push(blankStep({
        phase:"expo_square", m, dp_dn:dp_dn_init, dp_up:dp_up_init,
        base_vector:[...base], trans_matrix:T,
        result_matrix:toNumMat(R),
        power_matrix:toNumMat(M),
        exponent:Number(p), binary_repr:binStr,
        bits_done:[...donePos],
        message:`Square M → now M = T^${2**bitPos}. Remaining exponent bits: ${Number(p).toString(2)}.`,
        insight:`M = M × M → M now represents T^(2^${bitPos}).\nNext iteration will examine bit ${bitPos} of the exponent.`,
      }));
    }
  }

  // ── FINAL MULTIPLY ──
  const finalVec = new Array(sz).fill(0);
  const Rnum = toNumMat(R);
  let answer = 0n;
  for (let i=0;i<sz;i++) {
    let s = 0n;
    for (let j=0;j<sz;j++) s=(s+R[i][j]*BigInt(base[j]))%MOD;
    answer=(answer+s)%MOD;
    finalVec[i]=Number(s%MOD);
  }

  steps.push(blankStep({
    phase:"final_multiply", m, dp_dn:dp_dn_init, dp_up:dp_up_init,
    base_vector:[...base], trans_matrix:T,
    result_matrix:Rnum, power_matrix:toNumMat(M),
    exponent:0, binary_repr:binStr, bits_done:[...donePos],
    total:Number(answer),
    message:`Compute result = T^${exp} × base_vector, then sum all entries.`,
    insight:`T^(n−2) × base_vector gives the state vector for length n.\n\nEach entry state_vec[i] = number of length-n zigzag arrays ending in state i.\nSumming all entries gives the total count.\n\nFinal answer = ${answer}`,
  }));

  steps.push(blankStep({
    phase:"done", m, dp_dn:dp_dn_init, dp_up:dp_up_init,
    base_vector:[...base], trans_matrix:T,
    result_matrix:Rnum, power_matrix:toNumMat(M),
    exponent:0, binary_repr:binStr, bits_done:[...donePos],
    total:Number(answer),
    message:`Answer = ${answer} (mod 10⁹+7)`,
    insight:`Total zigzag arrays of length ${n} with values in [${l},${r}]:\n\nAnswer = ${answer}\n\nTime: O(m³ log n) = O(${m}³ × ${binStr.length}) ≈ O(${(m**3*binStr.length).toLocaleString()})\nVs naive O(n·m) = O(${(n*m).toLocaleString()}) — infeasible for large n!`,
  }));

  return steps;
}

// ── DP simulation (small n only) ──
function buildDPSteps(n: number, l: number, r: number): Step[] {
  const steps: Step[] = [];
  const m = r - l + 1;
  let dp_dn = new Array(m).fill(0);
  let dp_up = new Array(m).fill(0);

  steps.push(blankStep({
    phase:"dp_base", m, current_len:2,
    dp_dn:[...dp_dn], dp_up:[...dp_up], new_dp_dn:[], new_dp_up:[],
    base_vector:[], trans_matrix:[], result_matrix:[], power_matrix:[],
    message:`DP base (length 2): enumerate all m(m−1) = ${m*(m-1)} distinct pairs.`,
    insight:`dp_dn[v] = sequences ending at v, last move ↑ (= v)\ndp_up[v] = sequences ending at v, last move ↓ (= m−1−v)\n\nThis is fine for small n. But if n = 10⁹, we can't run this loop n times!\n→ Switch to Matrix Expo tab to see how to handle huge n.`,
  }));

  for (let a=0;a<m;a++) for (let b=0;b<m;b++) if (a!==b) {
    b>a ? dp_dn[b]++ : dp_up[b]++;
  }
  steps.push(blankStep({
    phase:"dp_base", m, current_len:2,
    dp_dn:[...dp_dn], dp_up:[...dp_up], new_dp_dn:[...dp_dn], new_dp_up:[...dp_up],
    base_vector:[], trans_matrix:[], result_matrix:[], power_matrix:[],
    total:dp_dn.reduce((a,b)=>a+b,0)+dp_up.reduce((a,b)=>a+b,0),
    message:`Base done. dp_dn=[${dp_dn.join(",")}], dp_up=[${dp_up.join(",")}]`,
    insight:`dp_dn[v] = v  (v values below v can rise into v)\ndp_up[v] = m−1−v  (m−1−v values above v can fall into v)\n\nTotal length-2 sequences = ${dp_dn.reduce((a,b)=>a+b,0)+dp_up.reduce((a,b)=>a+b,0)} = m(m−1) = ${m*(m-1)}`,
  }));

  for (let len=3;len<=Math.min(n,8);len++) {
    const nd = new Array(m).fill(0);
    const nu = new Array(m).fill(0);
    let pref=0;
    for (let y=0;y<m;y++) {
      nd[y]=pref; pref=(pref+dp_up[y])%MOD_NUM;
      steps.push(blankStep({
        phase:"dp_prefix", m, current_len:len,
        dp_dn:[...dp_dn], dp_up:[...dp_up], new_dp_dn:[...nd], new_dp_up:[...nu],
        base_vector:[], trans_matrix:[], result_matrix:[], power_matrix:[],
        active_col:y, active_row:-1,
        message:`Len ${len} prefix: nd[${y}]=${nd[y]}, pref+=${dp_up[y]}→${pref}`,
        insight:`nd[y] = Σ dp_up[x] for x < y\n       = prefix sum of dp_up (same trick as ZigZag I)\n\nnd[${y}] = ${nd[y]}`,
      }));
    }
    let suff=0;
    for (let y=m-1;y>=0;y--) {
      nu[y]=suff; suff=(suff+dp_dn[y])%MOD_NUM;
      steps.push(blankStep({
        phase:"dp_suffix", m, current_len:len,
        dp_dn:[...dp_dn], dp_up:[...dp_up], new_dp_dn:[...nd], new_dp_up:[...nu],
        base_vector:[], trans_matrix:[], result_matrix:[], power_matrix:[],
        active_col:y, active_row:-1,
        message:`Len ${len} suffix: nu[${y}]=${nu[y]}, suff+=${dp_dn[y]}→${suff}`,
        insight:`nu[y] = Σ dp_dn[x] for x > y\n       = suffix sum of dp_dn\n\nnu[${y}] = ${nu[y]}`,
      }));
    }
    dp_dn=[...nd]; dp_up=[...nu];
    const tot=(dp_dn.reduce((a,b)=>a+b,0)+dp_up.reduce((a,b)=>a+b,0))%MOD_NUM;
    steps.push(blankStep({
      phase:"dp_update", m, current_len:len,
      dp_dn:[...dp_dn], dp_up:[...dp_up], new_dp_dn:[...dp_dn], new_dp_up:[...dp_up],
      base_vector:[], trans_matrix:[], result_matrix:[], power_matrix:[],
      total:tot,
      message:`Length ${len} done. Total = ${tot}.`,
      insight:`After length ${len}: ${tot} valid zigzag arrays.\n\nThis O(m) step is exactly one application of T to the state vector — which is what matrix exponentiation computes in log(n) matrix squarings.`,
    }));
  }

  if (n>8) {
    steps.push(blankStep({
      phase:"dp_done", m, current_len:8,
      dp_dn:[...dp_dn], dp_up:[...dp_up], new_dp_dn:[], new_dp_up:[],
      base_vector:[], trans_matrix:[], result_matrix:[], power_matrix:[],
      message:`n=${n} is too large for iterative DP visualization. Showing first 8 steps.`,
      insight:`For n = ${n}, we'd need ${n-2} more iterations.\nThis is why matrix exponentiation is essential.\n→ Switch to Matrix Expo tab!`,
    }));
  } else {
    const total=(dp_dn.reduce((a,b)=>a+b,0)+dp_up.reduce((a,b)=>a+b,0))%MOD_NUM;
    steps.push(blankStep({
      phase:"dp_done", m, current_len:n,
      dp_dn:[...dp_dn], dp_up:[...dp_up], new_dp_dn:[], new_dp_up:[],
      base_vector:[], trans_matrix:[], result_matrix:[], power_matrix:[],
      total,
      message:`Done. Answer = ${total} (mod 10⁹+7)`,
      insight:`Final answer for n=${n}: ${total}`,
    }));
  }
  return steps;
}

const MOD_NUM = 1_000_000_007;

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 7 — COMPLEXITY
// ════════════════════════════════════════════════════════════════════════════

const COMPLEXITY: Record<SolutionId, { time: string; space: string; note: string }> = {
  matexp: {
    time:  "O(m³ log n)",
    space: "O(m²)",
    note:  "m = r−l+1 ≤ 75. Matrix size = (2m)² ≤ 22,500. log(10⁹) ≈ 30. About 30 matrix multiplications.",
  },
  dp: {
    time:  "O(n·m)",
    space: "O(m)",
    note:  "Only feasible for small n. For n = 10⁹ this would be ~7.5×10¹⁰ ops — too slow.",
  },
};

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 8 — PHASE DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

const PHASE_META: Record<Phase, { borderColor: string; bgColor: string; icon: string; label: string }> = {
  init:            { borderColor:"border-l-slate-400",   bgColor:"bg-slate-50",    icon:"→", label:"Init"         },
  base_vector:     { borderColor:"border-l-blue-400",    bgColor:"bg-blue-50",     icon:"v", label:"Base Vec"     },
  build_matrix:    { borderColor:"border-l-indigo-400",  bgColor:"bg-indigo-50",   icon:"T", label:"Build T"      },
  matrix_explain:  { borderColor:"border-l-indigo-400",  bgColor:"bg-indigo-50",   icon:"?", label:"T Structure"  },
  expo_start:      { borderColor:"border-l-amber-400",   bgColor:"bg-amber-50",    icon:"↑", label:"Expo Start"   },
  expo_bit:        { borderColor:"border-l-slate-400",   bgColor:"bg-slate-50",    icon:"0", label:"Bit = 0"      },
  expo_multiply:   { borderColor:"border-l-emerald-500", bgColor:"bg-emerald-50",  icon:"×", label:"R = R×M"      },
  expo_square:     { borderColor:"border-l-violet-500",  bgColor:"bg-violet-50",   icon:"²", label:"M = M²"       },
  final_multiply:  { borderColor:"border-l-emerald-600", bgColor:"bg-emerald-100", icon:"=", label:"Tⁿ × base"    },
  done:            { borderColor:"border-l-emerald-600", bgColor:"bg-emerald-100", icon:"■", label:"Done"         },
  dp_base:         { borderColor:"border-l-blue-400",    bgColor:"bg-blue-50",     icon:"₂", label:"DP Base"      },
  dp_prefix:       { borderColor:"border-l-emerald-500", bgColor:"bg-emerald-50",  icon:"→", label:"Prefix"       },
  dp_suffix:       { borderColor:"border-l-purple-500",  bgColor:"bg-purple-50",   icon:"←", label:"Suffix"       },
  dp_update:       { borderColor:"border-l-sky-500",     bgColor:"bg-sky-50",      icon:"✓", label:"Update"       },
  dp_done:         { borderColor:"border-l-emerald-600", bgColor:"bg-emerald-100", icon:"■", label:"Done"         },
};

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 9 — REUSABLE UI COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

function CodePanel({ solution, phase }: { solution: SolutionId; phase: Phase }) {
  const lines = solution === "matexp" ? MATEXP_CODE : DP_CODE;
  const hl: Partial<Record<Phase, number[]>> = solution === "matexp" ? {
    base_vector:    [24,25,26,27],
    build_matrix:   [30,31,32,33,34,35],
    expo_start:     [10,11,12],
    expo_bit:       [13,14,15,16],
    expo_multiply:  [14],
    expo_square:    [15],
    final_multiply: [38,39,40,41,42,43],
    done:           [44],
  } : {
    dp_base:   [5,6,7],
    dp_prefix: [10,11],
    dp_suffix: [12,13],
    dp_update: [14],
    dp_done:   [16,17,18],
  };
  const hLines = new Set(hl[phase] ?? []);
  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden bg-white mt-4">
      <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-400"/>
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400"/>
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"/>
        <span className="ml-2 text-xs text-slate-500 font-mono">
          {solution==="matexp"?"matrix_expo.cpp":"dp_iterative.cpp"}
        </span>
      </div>
      <div className="overflow-auto max-h-64 bg-slate-950/95">
        <table className="w-full text-xs font-mono">
          <tbody>
            {lines.map((line,i)=>(
              <tr key={i} style={{background:hLines.has(i)?"rgba(139,92,246,0.18)":"transparent"}} className="text-slate-100">
                <td className="select-none w-8 text-right pr-3 pl-2 py-0.5 border-r border-slate-800"
                  style={{color:hLines.has(i)?"#c4b5fd":"#64748b"}}>{i+1}</td>
                <td className="pl-3 py-0.5 whitespace-pre"
                  style={{color:hLines.has(i)?"#e9d5ff":undefined}}>{line||" "}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StepLog({ steps, currentIndex }: { steps: Step[]; currentIndex: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(()=>{if(ref.current)ref.current.scrollTop=ref.current.scrollHeight;},[currentIndex]);
  return (
    <div ref={ref} className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1" style={{scrollbarWidth:"thin"}}>
      {steps.slice(0,currentIndex+1).map((s,i)=>{
        const meta=PHASE_META[s.phase];
        return (
          <div key={i} className={`flex items-start gap-2 px-2 py-1.5 rounded-r border-l-2 text-xs
            ${meta.borderColor} ${meta.bgColor} ${i===currentIndex?"opacity-100":"opacity-55"}`}>
            <span className="font-mono font-bold text-slate-500 shrink-0 w-4">{meta.icon}</span>
            <span className="text-slate-700 leading-snug">{s.message}</span>
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 10 — CUSTOM VISUAL PANELS
// ════════════════════════════════════════════════════════════════════════════

// ── State vector display ──────────────────────────────────────────────────
function StateVectorPanel({ step, l }: { step: Step; l: number }) {
  const { m, dp_dn, dp_up, base_vector, current_len } = step;
  if (!m || (!dp_dn.length && !base_vector.length)) return null;
  const dn = dp_dn.length ? dp_dn : base_vector.slice(0,m);
  const up = dp_up.length ? dp_up : base_vector.slice(m);
  const maxV = Math.max(1,...dn,...up);

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="text-xs text-slate-500 font-medium">
          State vector {current_len > 0 ? `(length ${current_len})` : "(base)"}
        </p>
        <div className="flex gap-3 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-sky-500 inline-block"/>dp_dn[v] (next ↓)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block"/>dp_up[v] (next ↑)
          </span>
        </div>
      </div>
      <div className="flex items-end gap-1.5 h-28 pb-1 border-b border-slate-100">
        {Array.from({length:m},(_,idx)=>{
          const hd=(dn[idx]/maxV)*100, hu=(up[idx]/maxV)*100;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
              <div className="flex gap-0.5 items-end h-full w-full justify-center">
                <div className="w-3 rounded-t bg-sky-500 transition-all duration-200" style={{height:`${Math.max(2,hd)}%`}} title={`dp_dn[${idx}]=${dn[idx]}`}/>
                <div className="w-3 rounded-t bg-emerald-500 transition-all duration-200" style={{height:`${Math.max(2,hu)}%`}} title={`dp_up[${idx}]=${up[idx]}`}/>
              </div>
              <div className="text-center">
                <div className="text-[9px] text-sky-600 font-mono">{dn[idx]}</div>
                <div className="text-[9px] text-emerald-600 font-mono">{up[idx]}</div>
                <div className="text-[9px] text-slate-400 font-bold">{l+idx}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-xs text-slate-500 font-mono">
        Total: {(dn.reduce((a,b)=>a+b,0)+up.reduce((a,b)=>a+b,0)).toLocaleString()}
      </div>
    </div>
  );
}

// ── Mini matrix display ───────────────────────────────────────────────────
function MatrixPanel({
  mat, label, color, maxDisp=6, highlightDiag=false, activeRow=-1, activeCol=-1
}: {
  mat: number[][]; label: string; color: string;
  maxDisp?: number; highlightDiag?: boolean; activeRow?: number; activeCol?: number;
}) {
  if (!mat.length) return null;
  const sz = mat.length;
  const disp = Math.min(sz, maxDisp);
  const truncated = sz > maxDisp;
  const maxVal = Math.max(1,...mat.slice(0,disp).flatMap(r=>r.slice(0,disp)));

  return (
    <div className="flex-1 min-w-0">
      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-medium">{label}</p>
      <div className="overflow-x-auto">
        <div className="inline-block border border-slate-200 rounded-lg overflow-hidden">
          {mat.slice(0,disp).map((row,ri)=>(
            <div key={ri} className="flex">
              {row.slice(0,disp).map((v,ci)=>{
                const isDiag = ri===ci && highlightDiag;
                const isActive = ri===activeRow || ci===activeCol;
                const isSet = v > 0;
                const intensity = maxVal>0 ? v/maxVal : 0;
                return (
                  <div key={ci}
                    className="w-7 h-7 flex items-center justify-center text-[9px] font-mono font-bold border-r border-b border-slate-100 transition-all duration-150"
                    style={{
                      background: isDiag ? "#fef3c7"
                        : isActive && isSet ? `${color}30`
                        : isSet ? `${color}${Math.round(intensity*40+8).toString(16).padStart(2,"0")}`
                        : ri===activeRow||ci===activeCol ? "rgba(0,0,0,0.02)" : "white",
                      color: isDiag ? "#92400e"
                        : isSet ? color : "#cbd5e1",
                    }}>
                    {v > 99999 ? "…" : v}
                  </div>
                );
              })}
              {truncated && <div className="w-5 h-7 flex items-center justify-center text-[9px] text-slate-300">…</div>}
            </div>
          ))}
          {truncated && (
            <div className="flex">
              {Array.from({length:disp},(_,ci)=>(
                <div key={ci} className="w-7 h-5 flex items-center justify-center text-[9px] text-slate-300 border-r border-t border-slate-100">⋮</div>
              ))}
            </div>
          )}
        </div>
      </div>
      {truncated && <p className="text-[9px] text-slate-400 mt-1">Showing {disp}×{disp} of {sz}×{sz}</p>}
    </div>
  );
}

// ── Binary exponentiation visual ──────────────────────────────────────────
function BinaryExpoPanel({ step }: { step: Step }) {
  const { binary_repr, bits_done, exponent, phase } = step;
  if (!binary_repr || !["expo_start","expo_bit","expo_multiply","expo_square","final_multiply","done"].includes(phase)) return null;

  const bits = binary_repr.split("").reverse(); // LSB first
  const currentBit = bits_done.length > 0 ? Math.max(...bits_done) + 1 : 0;

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
      <p className="text-xs text-slate-500 font-medium mb-3">
        Binary exponentiation: T^{binary_repr.length > 0 ? parseInt(binary_repr,2) : "?"}
      </p>
      <p className="text-[10px] text-slate-400 mb-2">Exponent in binary (LSB → MSB):</p>
      <div className="flex gap-1.5 flex-wrap items-center">
        {bits.map((bit, i) => {
          const isDone    = bits_done.includes(i);
          const isCurrent = i === currentBit && ["expo_bit","expo_multiply","expo_square"].includes(phase);
          const isSetBit  = bit === "1";
          return (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className="text-[9px] text-slate-400 font-mono">2^{i}</div>
              <div className={`w-9 h-9 flex items-center justify-center rounded-lg font-mono text-sm font-bold border-2 transition-all
                ${isCurrent && isSetBit  ? "bg-emerald-100 border-emerald-500 text-emerald-800 scale-110 shadow-md"
                : isCurrent && !isSetBit ? "bg-slate-100 border-slate-400 text-slate-600 scale-110"
                : isDone && isSetBit     ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                : isDone                 ? "bg-slate-50 border-slate-200 text-slate-400"
                : isSetBit               ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-white border-slate-100 text-slate-300"}`}>
                {bit}
              </div>
              {isDone && isSetBit && (
                <div className="text-[9px] text-emerald-600 font-bold">✓ R×M</div>
              )}
              {isDone && !isSetBit && (
                <div className="text-[9px] text-slate-400">skip</div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        <span className="text-slate-500">Bits absorbed into R:</span>
        <span className="font-mono font-bold text-emerald-700">
          {bits_done.filter(b=>bits[b]==="1").map(b=>`2^${b}`).join(" + ") || "none yet"}
        </span>
        {bits_done.length > 0 && (
          <span className="text-slate-400">
            = T^{bits_done.filter(b=>bits[b]==="1").reduce((a,b)=>a+2**b,0)}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Insight box ───────────────────────────────────────────────────────────
function InsightBox({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1.5">Key insight</p>
      <p className="text-xs text-indigo-800 leading-relaxed whitespace-pre-line font-mono">{text}</p>
    </div>
  );
}

// ── Zigzag examples ───────────────────────────────────────────────────────
function ZigzagExamples({ n, l, r }: { n: number; l: number; r: number }) {
  const len = Math.min(n, 5);
  const arrs = sampleZigzags(len, l, r, 5);
  if (!arrs.length) return null;
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
      <p className="text-xs text-slate-500 font-medium mb-3">
        Sample valid arrays (length {len}{len<n?", truncated":""})
      </p>
      <div className="flex flex-col gap-2">
        {arrs.map((arr,ai)=>(
          <div key={ai} className="flex items-center gap-1 flex-wrap">
            {arr.map((v,vi)=>{
              const prev=arr[vi-1];
              const isUp=prev!==undefined&&v>prev, isDown=prev!==undefined&&v<prev;
              return (
                <div key={vi} className="flex items-center gap-0.5">
                  {vi>0&&<span className={`text-xs font-bold w-4 text-center ${isUp?"text-emerald-500":"text-rose-500"}`}>{isUp?"↑":"↓"}</span>}
                  <div className={`w-7 h-7 flex items-center justify-center rounded-lg font-mono text-xs font-bold border
                    ${isUp?"bg-emerald-50 border-emerald-300 text-emerald-800"
                    :isDown?"bg-rose-50 border-rose-300 text-rose-800"
                    :"bg-slate-50 border-slate-200 text-slate-700"}`}>{v}</div>
                </div>
              );
            })}
            <span className="ml-1 text-[10px] text-slate-400">✓</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── DP bars for iterative mode ────────────────────────────────────────────
function DPBarsPanel({ step, l }: { step: Step; l: number }) {
  const { dp_dn, dp_up, new_dp_dn, new_dp_up, phase, m } = step;
  if (!m || !dp_dn.length) return null;
  const showNew = ["dp_prefix","dp_suffix","dp_update"].includes(phase);
  const maxOld = Math.max(1,...dp_dn,...dp_up);
  const maxNew = Math.max(1,...new_dp_dn,...new_dp_up);
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-slate-500 font-medium">DP arrays (length {step.current_len})</p>
        <div className="flex gap-2 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-sky-500 inline-block"/>dn</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block"/>up</span>
        </div>
      </div>
      <div className="flex items-end gap-1 h-24 pb-1 border-b border-slate-100">
        {Array.from({length:m},(_,idx)=>{
          const hd=(dp_dn[idx]/maxOld)*100, hu=(dp_up[idx]/maxOld)*100;
          const isCur=idx===step.active_col;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
              <div className="flex gap-0.5 items-end w-full justify-center h-full">
                <div className={`w-3 rounded-t transition-all ${isCur?"bg-amber-400":"bg-sky-500"}`} style={{height:`${Math.max(2,hd)}%`}}/>
                <div className={`w-3 rounded-t transition-all ${isCur?"bg-amber-300":"bg-emerald-500"}`} style={{height:`${Math.max(2,hu)}%`}}/>
              </div>
              <div className="text-[9px] text-slate-400 font-bold">{l+idx}</div>
            </div>
          );
        })}
      </div>
      {showNew && (
        <div className="mt-3">
          <p className="text-[10px] text-slate-400 mb-1">Building new DP:</p>
          <div className="flex items-end gap-1 h-16 pb-1">
            {Array.from({length:m},(_,idx)=>{
              const hd=(new_dp_dn[idx]/Math.max(1,maxNew))*100;
              const hu=(new_dp_up[idx]/Math.max(1,maxNew))*100;
              const isCur=idx===step.active_col;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
                  <div className="flex gap-0.5 items-end w-full justify-center h-full">
                    <div className={`w-3 rounded-t border transition-all ${isCur?"bg-amber-200 border-amber-400":"bg-sky-200 border-sky-300"}`} style={{height:`${Math.max(2,hd)}%`}}/>
                    <div className={`w-3 rounded-t border transition-all ${isCur?"bg-amber-100 border-amber-300":"bg-emerald-200 border-emerald-300"}`} style={{height:`${Math.max(2,hu)}%`}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ███  SECTION 11 — MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function ZigZag2Visualizer() {
  const [activeSolution, setActiveSolution] = useState<SolutionId>("matexp");
  const [activeTestCase, setActiveTestCase]  = useState("ex2");

  const [nInput, setNInput] = useState("3");
  const [lInput, setLInput] = useState("1");
  const [rInput, setRInput] = useState("3");

  const [steps, setSteps]                       = useState<Step[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [playing, setPlaying]                   = useState(false);
  const [speed, setSpeed]                       = useState(600);
  const intervalRef = useRef<ReturnType<typeof setInterval>|null>(null);

  const currentStep = steps[currentStepIndex] ?? steps[0];

  const rebuild = useCallback(()=>{
    const n=parseInt(nInput)||3, l=parseInt(lInput)||1, r=parseInt(rInput)||3;
    if (n<3||l>=r||r-l>10) return;
    const s = activeSolution==="matexp"
      ? buildMatExpSteps(n,l,r)
      : buildDPSteps(n,l,r);
    setSteps(s);
    setCurrentStepIndex(0);
    setPlaying(false);
  },[nInput,lInput,rInput,activeSolution]);

  useEffect(()=>{rebuild();},[rebuild]);

  useEffect(()=>{
    if(!playing){if(intervalRef.current)clearInterval(intervalRef.current);return;}
    intervalRef.current=setInterval(()=>{
      setCurrentStepIndex(p=>p>=steps.length-1?p:p+1);
    },speed);
    return ()=>{if(intervalRef.current)clearInterval(intervalRef.current);};
  },[playing,speed,steps.length]);

  useEffect(()=>{
    if(playing&&currentStepIndex>=steps.length-1)setPlaying(false);
  },[currentStepIndex,steps.length,playing]);

  const complexity = COMPLEXITY[activeSolution];
  const isMatExp   = activeSolution==="matexp";
  const n=parseInt(nInput)||3, l=parseInt(lInput)||1, r=parseInt(rInput)||3;

  if(!currentStep) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-6 overflow-hidden">

      {/* Header */}
      <header className="flex justify-between items-center mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg"><Braces size={24}/></div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-none">{PROBLEM_TITLE}</h1>
            <p className="text-slate-500 text-xs mt-1 italic">{PROBLEM_SUBTITLE}</p>
          </div>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded border border-rose-300 text-rose-700 bg-rose-50">
          {PROBLEM_BADGE}
        </span>
      </header>

      {/* Solution tabs */}
      <div className="flex gap-2 mb-4 shrink-0 bg-slate-200/50 p-1 rounded-xl w-fit">
        {SOLUTIONS.map(sol=>(
          <button key={sol.id} onClick={()=>setActiveSolution(sol.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2
              ${activeSolution===sol.id?"bg-white text-indigo-700 shadow-sm":"text-slate-600 hover:text-slate-900"}`}>
            <Zap size={14}/>
            {sol.label}
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-mono">{sol.complexity}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 overflow-hidden">

        {/* ── LEFT COLUMN ─────────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">

          {/* Problem statement */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{PROBLEM_STATEMENT}</p>
          </div>

          {/* Phase chips */}
          <div className="flex gap-1.5 flex-wrap">
            {(isMatExp
              ? (["init","base_vector","build_matrix","matrix_explain","expo_start","expo_bit","expo_multiply","expo_square","final_multiply","done"] as Phase[])
              : (["dp_base","dp_prefix","dp_suffix","dp_update","dp_done"] as Phase[])
            ).map(p=>(
              <div key={p}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all
                  ${currentStep.phase===p
                    ?"bg-indigo-600 border-indigo-600 text-white shadow-md"
                    :"bg-white border-slate-200 text-slate-400"}`}>
                {PHASE_META[p].icon} {PHASE_META[p].label}
              </div>
            ))}
          </div>

          {/* Insight */}
          <InsightBox text={currentStep.insight}/>

          {/* Zigzag examples */}
          <ZigzagExamples n={n} l={l} r={r}/>

          {/* State vector */}
          <StateVectorPanel step={currentStep} l={l}/>

          {/* Matrices side by side */}
          {isMatExp && (currentStep.trans_matrix.length>0 || currentStep.result_matrix.length>0) && (
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
              <p className="text-xs text-slate-500 font-medium mb-4">Matrices (showing top-left corner, values mod 10⁹+7)</p>
              <div className="flex gap-4 flex-wrap">
                {currentStep.trans_matrix.length>0 && (
                  <MatrixPanel mat={currentStep.trans_matrix} label="Transition T" color="#6366f1" maxDisp={6} highlightDiag={false}/>
                )}
                {currentStep.result_matrix.length>0 && (
                  <MatrixPanel mat={currentStep.result_matrix} label={currentStep.phase==="final_multiply"?"T^(n−2) [final]":"R (result so far)"} color="#10b981" maxDisp={6} highlightDiag={currentStep.phase==="expo_start"}/>
                )}
                {currentStep.power_matrix.length>0 && ["expo_bit","expo_multiply","expo_square","expo_start"].includes(currentStep.phase) && (
                  <MatrixPanel mat={currentStep.power_matrix} label="M (current power)" color="#f59e0b" maxDisp={6}/>
                )}
              </div>
            </div>
          )}

          {/* Binary expo tracker */}
          {isMatExp && <BinaryExpoPanel step={currentStep}/>}

          {/* DP bars (iterative mode) */}
          {!isMatExp && <DPBarsPanel step={currentStep} l={l}/>}

          {/* Answer */}
          {(currentStep.total > 0 || ["done","dp_done","final_multiply"].includes(currentStep.phase)) && (
            <div className={`p-4 rounded-xl border flex items-center justify-between
              ${["done","dp_done"].includes(currentStep.phase)?"bg-emerald-50 border-emerald-200":"bg-white border-slate-100 shadow-sm"}`}>
              <span className="text-xs font-medium text-slate-500">
                {["done","dp_done"].includes(currentStep.phase)?"Final answer (mod 10⁹+7)":"Running total"}
              </span>
              <span className={`text-2xl font-bold font-mono ${["done","dp_done"].includes(currentStep.phase)?"text-emerald-700":"text-slate-800"}`}>
                {currentStep.total}
              </span>
            </div>
          )}

          {/* Step log */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-2">Step log</p>
            <StepLog steps={steps} currentIndex={currentStepIndex}/>
          </div>

          <CodePanel solution={activeSolution} phase={currentStep.phase}/>
        </div>

        {/* ── RIGHT COLUMN ─────────────────────────────────── */}
        <div className="w-full lg:w-80 flex flex-col gap-4 overflow-y-auto">

          {/* Test cases */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-3">
            <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-medium">Test Cases</p>
            <div className="flex flex-wrap gap-2">
              {TEST_CASES.map(tc=>(
                <button key={tc.id}
                  onClick={()=>{
                    setActiveTestCase(tc.id);
                    if(tc.id!=="custom"){setNInput(String(tc.n));setLInput(String(tc.l));setRInput(String(tc.r));}
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                    ${activeTestCase===tc.id?"bg-indigo-600 text-white shadow-sm":"bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                  {tc.label}
                </button>
              ))}
            </div>
            {activeTestCase!=="custom"&&(()=>{
              const tc=TEST_CASES.find(t=>t.id===activeTestCase);
              return tc?(
                <>
                  <p className="text-[10px] text-slate-500 italic">{tc.desc}</p>
                  {tc.expected>=0&&<p className="text-[10px] font-mono text-emerald-700">Expected: {tc.expected}</p>}
                </>
              ):null;
            })()}
          </div>

          {/* Input */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-2">
            <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-medium">Input</p>
            {[
              {label:"n (array length)",val:nInput,set:setNInput,type:"number",min:3},
              {label:"l (lower bound)", val:lInput,set:setLInput,type:"number",min:1},
              {label:"r (upper bound)", val:rInput,set:setRInput,type:"number",min:2},
            ].map(({label,val,set,type,min})=>(
              <div key={label} className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</label>
                <input type={type} value={val} min={min}
                  onChange={e=>{set(e.target.value);setActiveTestCase("custom");}}
                  className="font-mono text-xs px-2 py-1.5 rounded border border-slate-200 bg-slate-50 text-slate-900 w-36"/>
              </div>
            ))}
            <button onClick={rebuild}
              className="mt-1 w-full px-3 py-1.5 rounded border border-slate-300 text-xs text-slate-800 hover:bg-slate-100 transition-colors">
              Rebuild
            </button>
            <p className="text-[10px] text-slate-400">r−l ≤ 10 for matrix display. n can be huge for mat expo.</p>
          </div>

          {/* Animation controls */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-2">Animation Controls</p>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <button onClick={()=>setCurrentStepIndex(0)} disabled={currentStepIndex===0}
                className="p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30">
                <RotateCcw size={16}/>
              </button>
              <button onClick={()=>setCurrentStepIndex(p=>Math.max(0,p-1))} disabled={currentStepIndex===0}
                className="p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30">←</button>
              <button onClick={()=>setPlaying(p=>!p)} disabled={currentStepIndex>=steps.length-1}
                className={`px-4 py-1.5 text-xs rounded-full border font-medium flex items-center gap-1
                  ${playing?"bg-amber-50 text-amber-800 border-amber-300":"bg-indigo-600 text-white border-indigo-600 shadow-md"}`}>
                {playing?<><Pause size={14}/>Pause</>:<><Play size={14}/>Play</>}
              </button>
              <button onClick={()=>setCurrentStepIndex(p=>Math.min(steps.length-1,p+1))} disabled={currentStepIndex>=steps.length-1}
                className="p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30">
                <StepForward size={16}/>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Speed</span>
              <input type="range" min={100} max={1500} step={100} value={1600-speed}
                onChange={e=>setSpeed(1600-Number(e.target.value))} className="w-24 accent-indigo-600"/>
              <span className="text-xs font-mono text-slate-500">{speed}ms</span>
            </div>
            <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 transition-all duration-200"
                style={{width:steps.length?`${((currentStepIndex+1)/steps.length)*100}%`:"0%"}}/>
            </div>
            <span className="mt-1 block text-right text-xs text-slate-500 font-mono">
              {steps.length?`${currentStepIndex+1}/${steps.length}`:"0/0"}
            </span>
          </div>

          {/* Complexity */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-2">Complexity</p>
            <div className="flex flex-col gap-3 mb-2">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide">Time</span>
                <p className="font-mono text-sm text-slate-900">{complexity.time}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide">Space</span>
                <p className="font-mono text-sm text-slate-900">{isMatExp?"O(m²)":"O(m)"}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{complexity.note}</p>
          </div>

          {/* Why matrix expo card */}
          <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100">
            <p className="text-xs font-bold text-indigo-700 mb-2 uppercase tracking-wide">Why matrix exponentiation?</p>
            <div className="space-y-2 text-xs text-indigo-800">
              <div className="flex gap-2 items-start">
                <span className="font-mono font-bold text-rose-600 shrink-0">n=10⁹</span>
                <span>O(n·m) loop = 7.5×10¹⁰ ops → TLE</span>
              </div>
              <div className="flex gap-2 items-start">
                <span className="font-mono font-bold text-emerald-600 shrink-0">Matrix</span>
                <span>DP step is a linear map → encode as matrix T</span>
              </div>
              <div className="flex gap-2 items-start">
                <span className="font-mono font-bold text-emerald-600 shrink-0">Expo</span>
                <span>T^(n-2) via repeated squaring: only 30 matrix multiplies for n=10⁹</span>
              </div>
              <div className="border-t border-indigo-200 pt-2 font-semibold text-emerald-700">
                O(m³ log n) ≈ O(75³ × 30) ≈ 12M ops ✓
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}