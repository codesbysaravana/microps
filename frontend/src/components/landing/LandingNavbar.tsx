import React from 'react';
import { Link } from 'react-router-dom';

export const LandingNavbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 h-20 bg-[#0E0E0E]/80 backdrop-blur-xl border-b border-[#2A2A2A]/40 px-6 sm:px-12 flex items-center justify-between select-none transition-all duration-300">
      {/* Brand Logo */}
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded bg-[#131313] border border-[#2A2A2A] group-hover:border-[#D4AF37] flex items-center justify-center transition-all duration-300 shadow-sm group-hover:shadow-[0_0_15px_rgba(212,175,55,0.25)]">
            <div className="w-3 h-3 rounded-sm bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]"></div>
          </div>
          <span className="font-headline-lg text-2xl font-bold tracking-tight text-[#F5F5F0] group-hover:text-[#D4AF37] transition-colors">
            MicrOps
          </span>
        </Link>
      </div>

      {/* Center Navigation Tabs - Clean Editorial Storytelling */}
      <nav className="hidden lg:flex items-center gap-8 font-mono text-xs tracking-widest uppercase text-stone-300">
        <a href="#overview" className="transition-colors hover:text-[#D4AF37]">
          Platform
        </a>
        <a href="#pipeline" className="transition-colors hover:text-[#D4AF37]">
          Solutions
        </a>
        <a href="#ai" className="transition-colors hover:text-[#D4AF37]">
          AI & Integrations
        </a>
        <a href="#enterprise" className="transition-colors hover:text-[#D4AF37]">
          Enterprise
        </a>
        <a href="#pricing" className="transition-colors hover:text-[#D4AF37]">
          Pricing
        </a>
        <a href="#faq" className="transition-colors hover:text-[#D4AF37]">
          Docs
        </a>
      </nav>

      {/* Right Action Center - Pure Marketing Separation */}
      <div className="flex items-center gap-4 font-mono text-xs uppercase tracking-wider">
        <Link
          to="/login"
          className="text-neutral-300 hover:text-white px-3 py-2 transition-colors font-medium"
        >
          Sign In
        </Link>
        <Link
          to="/signup"
          className="px-5 py-2.5 rounded bg-[#D4AF37] hover:bg-[#e2bd44] text-[#131313] font-bold transition-all shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:shadow-[0_0_30px_rgba(212,175,55,0.45)] transform hover:-translate-y-0.5 active:translate-y-0"
        >
          GET STARTED
        </Link>
      </div>
    </header>
  );
};
