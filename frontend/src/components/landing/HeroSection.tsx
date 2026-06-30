import React from 'react';
import { Link } from 'react-router-dom';
import { Plasma } from '../ui/Plasma';
import { ShinyText } from '../ui/ShinyText';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative w-full pt-24 pb-28 sm:pt-32 sm:pb-36 px-6 sm:px-12 text-center flex flex-col items-center justify-center select-none overflow-hidden">
      {/* Background & Ambient Living Cloud Infrastructure Plasma Layer */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <Plasma
          color="#C9982D"
          speed={0.2}
          direction="forward"
          scale={1.6}
          opacity={0.12}
          mouseInteractive={false}
        />
        {/* Soft radial mask and overlay so Plasma fades naturally into obsidian background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(14,14,14,0.68)_55%,#0E0E0E_92%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0E0E0E] via-transparent to-[#0E0E0E]" />
      </div>

      {/* Ambient Breathing Gold & Obsidian Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#D4AF37]/[0.06] rounded-full blur-[120px] pointer-events-none animate-pulse duration-1000 z-0"></div>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-900/[0.04] rounded-full blur-[90px] pointer-events-none z-0"></div>

      {/* Hero Content Wrapper */}
      <div className="relative z-10 max-w-6xl mx-auto flex flex-col items-center justify-center">
        {/* Hero Massive Typography - Visual Source of Truth */}
        <div className="space-y-2 mb-8 max-w-5xl">
          <h1 className="font-headline-lg text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.12] animate-in fade-in slide-in-from-bottom-6 duration-700">
            <span className="block text-[#F5F5F0]">
              <ShinyText text="The Operating System" color="#F5F5F0" shineColor="#ffffff" speed={6} delay={10} spread={100} />
            </span>
            <span className="block text-[#D4AF37] drop-shadow-[0_0_25px_rgba(212,175,55,0.25)]">
              for Cloud
            </span>
            <span className="block text-[#D4AF37] drop-shadow-[0_0_25px_rgba(212,175,55,0.25)]">
              Deployments.
            </span>
          </h1>
        </div>

        {/* Subtitle Storytelling */}
        <p className="font-body-md text-base sm:text-lg lg:text-xl text-neutral-400 max-w-2xl leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
          Invisible complexity, total control. Architect, scale, and secure your infrastructure with surgical precision.
        </p>

        {/* Premium Cinematic CTA */}
        <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
          <Link
            to="/signup"
            className="inline-flex items-center gap-3 px-9 py-4 rounded bg-[#D4AF37] hover:bg-[#e2bd44] text-[#131313] font-mono text-xs sm:text-sm font-bold tracking-widest uppercase shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:shadow-[0_0_45px_rgba(212,175,55,0.55)] transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0"
          >
            <span>START DEPLOYING</span>
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>

        {/* Architectural Telemetry Hint */}
        <div className="mt-16 pt-8 border-t border-[#2A2A2A]/40 w-full flex flex-wrap items-center justify-center gap-8 text-neutral-500 font-mono text-xs uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>99.999% SLA Guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
            <span>Sub-10ms Cold Starts</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span>Multi-Cloud Mesh</span>
          </div>
        </div>
      </div>
    </section>
  );
};
