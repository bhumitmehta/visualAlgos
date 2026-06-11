"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import type { HeroProps } from "./types";

// ─── BFS Canvas Animation ─────────────────────────────────────────────────────
// Draws a small graph and runs a BFS wave animation on loop.
// Respects prefers-reduced-motion: if set, draws static graph only.

interface GNode { x: number; y: number; visited: boolean; active: boolean; }
interface GEdge { a: number; b: number; lit: boolean; }

function useGraphCanvas(canvasRef: React.RefObject<HTMLCanvasElement>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width  = canvas.offsetWidth  * devicePixelRatio;
    const H = canvas.height = canvas.offsetHeight * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    // Fixed node positions (normalised 0-1, scaled to canvas)
    const nodePos = [
      [0.50, 0.20], [0.25, 0.42], [0.75, 0.42],
      [0.12, 0.68], [0.42, 0.68], [0.58, 0.68], [0.88, 0.68],
      [0.30, 0.88], [0.70, 0.88],
    ];
    const edgeDefs: [number,number][] = [
      [0,1],[0,2],[1,3],[1,4],[2,5],[2,6],[4,7],[5,8],
    ];

    const nodes: GNode[] = nodePos.map(([nx,ny]) => ({
      x: nx * w, y: ny * h, visited: false, active: false,
    }));
    const edges: GEdge[] = edgeDefs.map(([a,b]) => ({ a, b, lit: false }));

    function reset() {
      nodes.forEach(n => { n.visited = false; n.active = false; });
      edges.forEach(e => { e.lit = false; });
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      // Edges
      edges.forEach(e => {
        const a = nodes[e.a], b = nodes[e.b];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = e.lit ? "rgba(99,102,241,0.6)" : "rgba(200,200,220,0.5)";
        ctx.lineWidth   = e.lit ? 2 : 1.5;
        ctx.stroke();
      });

      // Nodes
      nodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.active ? 9 : 7, 0, Math.PI * 2);
        ctx.fillStyle = n.active
          ? "#4F46E5"
          : n.visited
          ? "rgba(99,102,241,0.35)"
          : "rgba(220,220,240,0.7)";
        ctx.fill();
        if (n.active) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, 14, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(99,102,241,0.2)";
          ctx.lineWidth   = 2;
          ctx.stroke();
        }
      });
    }

    if (reduced) { draw(); return; }

    // BFS simulation
    const adj: number[][] = nodePos.map(() => []);
    edgeDefs.forEach(([a,b]) => { adj[a].push(b); adj[b].push(a); });

    let queue: number[] = [0];
    let stepTimer: ReturnType<typeof setTimeout>;
    let restartTimer: ReturnType<typeof setTimeout>;

    function step() {
      if (queue.length === 0) {
        restartTimer = setTimeout(() => { reset(); queue = [0]; nodes[0].active = true; step(); }, 1200);
        return;
      }
      const cur = queue.shift()!;
      nodes[cur].visited = true;
      nodes[cur].active  = false;

      for (const nb of adj[cur]) {
        if (!nodes[nb].visited && !queue.includes(nb)) {
          queue.push(nb);
          nodes[nb].active = true;
          const e = edges.find(e =>
            (e.a === cur && e.b === nb) || (e.a === nb && e.b === cur)
          );
          if (e) e.lit = true;
        }
      }
      draw();
      stepTimer = setTimeout(step, 480);
    }

    nodes[0].active = true;
    draw();
    stepTimer = setTimeout(step, 600);

    return () => {
      clearTimeout(stepTimer);
      clearTimeout(restartTimer);
    };
  }, [canvasRef]);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function HeroSection({
  tagline, subtagline, ctaLabel, ctaHref,
  totalVisualizations, totalDomains,
}: HeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useGraphCanvas(canvasRef);

  return (
    <section className="relative overflow-hidden bg-white border-b border-gray-100">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#6366f1 1px,transparent 1px),linear-gradient(to right,#6366f1 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Text column */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 mb-6">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs font-semibold text-indigo-600 tracking-wide uppercase">
                Interactive Library
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-gray-900 leading-[1.08] tracking-tight mb-5">
              {tagline}
            </h1>

            <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-lg">
              {subtagline}
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href={ctaHref}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 transition-all duration-150"
              >
                {ctaLabel}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/categories"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all duration-150"
              >
                Browse domains
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-10 flex gap-8">
              <div>
                <p className="text-3xl font-bold text-gray-900 tabular-nums">{totalVisualizations}</p>
                <p className="text-sm text-gray-400 mt-0.5">visualizations</p>
              </div>
              <div className="w-px bg-gray-100" />
              <div>
                <p className="text-3xl font-bold text-gray-900 tabular-nums">{totalDomains}</p>
                <p className="text-sm text-gray-400 mt-0.5">domains</p>
              </div>
              <div className="w-px bg-gray-100" />
              <div>
                <p className="text-3xl font-bold text-gray-900">Free</p>
                <p className="text-sm text-gray-400 mt-0.5">forever</p>
              </div>
            </div>
          </div>

          {/* Canvas column — live BFS animation */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm">
              {/* Card frame */}
              <div className="rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden">
                {/* Fake browser bar */}
                <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-300" />
                  <div className="flex-1 mx-3 rounded bg-white border border-gray-200 text-[10px] text-gray-400 px-2 py-1 text-center">
                    visupedia.io/cs/bfs
                  </div>
                </div>

                {/* Canvas */}
                <div className="relative bg-gray-50/50 p-2">
                  <canvas
                    ref={canvasRef}
                    className="w-full"
                    style={{ height: "240px" }}
                    aria-label="Live BFS animation — nodes being visited level by level"
                  />
                </div>

                {/* Label */}
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-700">Breadth-First Search</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Computer Science · Interactive</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-medium text-indigo-600">
                    Live demo
                  </span>
                </div>
              </div>

              {/* Decorative blur circles */}
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-indigo-100 blur-2xl opacity-60 -z-10" />
              <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-violet-100 blur-2xl opacity-50 -z-10" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}