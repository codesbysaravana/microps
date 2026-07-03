import React, { useState } from 'react';

export const VisualInfrastructure: React.FC = () => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  return (
    <section id="overview" className="py-20 px-6 sm:px-12 max-w-6xl mx-auto select-none">
      {/* Section Storytelling Header - Visual Source of Truth */}
      <div className="text-center mb-12 space-y-2">
        <h2 className="font-headline-md text-3xl sm:text-4xl font-semibold text-[#F5F5F0]">
          Visual Infrastructure
        </h2>
        <p className="font-body-md text-sm sm:text-base text-neutral-400 max-w-xl mx-auto">
          Real-time topology of your active nodes, elegantly displayed.
        </p>
      </div>

      {/* Signature Golden Cloud Animation Container */}
      <div className="bg-[#131313] border border-[#2A2A2A] rounded-2xl p-8 sm:p-14 lg:p-20 relative overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]">
        {/* Subtle Architectural Dot Grid Background */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#D4AF37 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        ></div>

        {/* Ambient Gold Nebula */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[300px] bg-[#D4AF37]/[0.05] rounded-full blur-[100px] pointer-events-none animate-pulse duration-1000"></div>

        {/* 60 FPS Living Cloud Graph Topology */}
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-8 sm:gap-14 my-6">
          
          {/* Node 1: API GATEWAY */}
          <div
            onMouseEnter={() => setHoveredNode('gateway')}
            onMouseLeave={() => setHoveredNode(null)}
            className={`bg-[#1A1A1A] border rounded-xl p-5 w-48 flex flex-col items-center gap-3 transition-all duration-500 cursor-pointer ${
              hoveredNode === 'gateway'
                ? 'border-[#7C3AED] shadow-[0_0_30px_rgba(124,58,237,0.35)] -translate-y-1'
                : 'border-[#7C3AED]/60 shadow-lg'
            }`}
          >
            <div className="w-11 h-11 rounded-lg bg-[#7C3AED]/15 border border-[#7C3AED]/35 flex items-center justify-center text-[#7C3AED] relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              {/* Subtle activity light */}
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-neutral-400 animate-pulse"></span>
            </div>
            <span className="font-mono text-xs text-neutral-200 tracking-wider font-bold">
              API GATEWAY
            </span>
            <span className="font-mono text-[10px] text-neutral-500">
              ingress.mesh.v1
            </span>
          </div>

          {/* Golden Animated Connection Highway 1 */}
          <div className="hidden lg:flex items-center justify-center relative w-24">
            <div className="w-full h-0.5 bg-gradient-to-r from-[#7C3AED] to-[#D4AF37] relative overflow-hidden">
              {/* Animated Packet Pulse 1 */}
              <div className="absolute top-0 left-0 w-8 h-full bg-[#D4AF37] shadow-[0_0_12px_#D4AF37] animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
            </div>
            {/* Packet traveler indicator */}
            <div className="absolute w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_10px_#D4AF37] animate-pulse"></div>
          </div>

          {/* Node 2: CORE ORCHESTRATOR (Centerpiece) */}
          <div
            onMouseEnter={() => setHoveredNode('orchestrator')}
            onMouseLeave={() => setHoveredNode(null)}
            className={`bg-[#1C1B1B] border-2 border-[#D4AF37] rounded-2xl p-7 w-56 flex flex-col items-center gap-3.5 transition-all duration-500 cursor-pointer relative z-10 ${
              hoveredNode === 'orchestrator'
                ? 'shadow-[0_0_50px_rgba(212,175,55,0.45)] scale-105'
                : 'shadow-[0_0_30px_rgba(212,175,55,0.2)]'
            }`}
          >
            {/* Shimmering Top Badge */}
            <span className="absolute -top-3 bg-[#D4AF37] text-[#131313] font-mono text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider shadow">
              NEURAL ENGINE
            </span>

            <div className="w-14 h-14 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] relative mt-1">
              <svg className="w-8 h-8 animate-[spin_12s_linear_infinite]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <div className="absolute inset-0 rounded-xl bg-[#D4AF37]/10 animate-ping duration-1000"></div>
            </div>
            <span className="font-mono text-xs text-[#D4AF37] tracking-wider font-bold">
              CORE ORCHESTRATOR
            </span>
            <span className="font-mono text-[10px] text-neutral-400">
              auto-scaler • 64 shards
            </span>
          </div>

          {/* Golden Animated Connection Highway 2 (Branching to DB & Cache) */}
          <div className="hidden lg:flex flex-col justify-between h-32 relative w-20">
            {/* Top branch line */}
            <div className="w-full h-0.5 bg-gradient-to-r from-[#D4AF37] to-neutral-500 self-start mt-6 relative">
              <div className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37] animate-pulse"></div>
            </div>
            {/* Bottom branch line */}
            <div className="w-full h-0.5 bg-gradient-to-r from-[#D4AF37] to-neutral-500 self-start mb-6 relative">
              <div className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37] animate-pulse"></div>
            </div>
          </div>

          {/* Nodes 3 & 4: PRIMARY DB & REDIS CACHE */}
          <div className="flex flex-col gap-6 w-48">
            {/* PRIMARY DB */}
            <div
              onMouseEnter={() => setHoveredNode('db')}
              onMouseLeave={() => setHoveredNode(null)}
              className={`bg-[#1A1A1A] border rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-300 cursor-pointer ${
                hoveredNode === 'db'
                  ? 'border-neutral-300 bg-neutral-900 shadow-[0_0_20px_rgba(255,255,255,0.15)] -translate-y-1'
                  : 'border-[#2A2A2A]'
              }`}
            >
              <div className="w-9 h-9 rounded bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              <span className="font-mono text-[11px] text-neutral-200 tracking-wider font-bold">
                PRIMARY DB
              </span>
              <span className="font-mono text-[9px] text-neutral-400">
                Multi-AZ Replica
              </span>
            </div>

            {/* REDIS CACHE */}
            <div
              onMouseEnter={() => setHoveredNode('redis')}
              onMouseLeave={() => setHoveredNode(null)}
              className={`bg-[#1A1A1A] border rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-300 cursor-pointer ${
                hoveredNode === 'redis'
                  ? 'border-neutral-300 bg-neutral-900 shadow-[0_0_20px_rgba(255,255,255,0.15)] -translate-y-1'
                  : 'border-[#2A2A2A]'
              }`}
            >
              <div className="w-9 h-9 rounded bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-mono text-[11px] text-neutral-200 tracking-wider font-bold">
                REDIS CACHE
              </span>
              <span className="font-mono text-[9px] text-[#D4AF37]">
                0.4ms Hit Rate
              </span>
            </div>
          </div>

        </div>

        {/* Live Telemetry Status Bar */}
        <div className="mt-10 pt-6 border-t border-[#2A2A2A] flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-neutral-400 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neutral-400"></span>
            <span>Mesh Topology: Active & Synchronized</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Throughput: <strong className="text-white">1.48M req/s</strong></span>
            <span>Latency: <strong className="text-[#D4AF37]">1.2ms</strong></span>
            <span>Nodes: <strong className="text-white">64 Active</strong></span>
          </div>
        </div>
      </div>
    </section>
  );
};
