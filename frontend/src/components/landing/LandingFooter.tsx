import React from 'react';
import { Link } from 'react-router-dom';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="border-t border-[#1C1B1B] bg-[#0E0E0E] py-20 px-6 sm:px-12 max-w-6xl mx-auto select-none">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12">
        {/* Brand Column */}
        <div className="lg:col-span-2 space-y-4">
          <Link to="/" className="inline-block font-headline-lg text-3xl font-bold text-[#F5F5F0] tracking-tight hover:text-[#D4AF37] transition-colors">
            MicrOps
          </Link>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-sm leading-relaxed font-body-md">
            Precision infrastructure orchestration for modern cloud native teams. Architected for scale.
          </p>
        </div>

        {/* PRODUCT */}
        <div className="space-y-4">
          <div className="font-mono text-[11px] uppercase tracking-widest text-neutral-400 font-bold">
            PRODUCT
          </div>
          <ul className="space-y-2.5 text-xs text-neutral-500 font-mono">
            <li><a href="#overview" className="hover:text-[#D4AF37] transition-colors block">Platform</a></li>
            <li><a href="#features" className="hover:text-[#D4AF37] transition-colors block">Features</a></li>
            <li><a href="#ai" className="hover:text-[#D4AF37] transition-colors block">Integrations</a></li>
            <li><a href="#pricing" className="hover:text-[#D4AF37] transition-colors block">Pricing</a></li>
          </ul>
        </div>

        {/* RESOURCES */}
        <div className="space-y-4">
          <div className="font-mono text-[11px] uppercase tracking-widest text-neutral-400 font-bold">
            RESOURCES
          </div>
          <ul className="space-y-2.5 text-xs text-neutral-500 font-mono">
            <li><a href="#faq" className="hover:text-[#D4AF37] transition-colors block">Documentation</a></li>
            <li><a href="#faq" className="hover:text-[#D4AF37] transition-colors block">API Reference</a></li>
            <li><a href="#faq" className="hover:text-[#D4AF37] transition-colors block">Community</a></li>
            <li><a href="#faq" className="hover:text-[#D4AF37] transition-colors block">Status</a></li>
          </ul>
        </div>

        {/* COMPANY */}
        <div className="space-y-4">
          <div className="font-mono text-[11px] uppercase tracking-widest text-neutral-400 font-bold">
            COMPANY
          </div>
          <ul className="space-y-2.5 text-xs text-neutral-500 font-mono">
            <li><a href="#overview" className="hover:text-[#D4AF37] transition-colors block">About Us</a></li>
            <li><a href="#overview" className="hover:text-[#D4AF37] transition-colors block">Careers</a></li>
            <li><a href="#overview" className="hover:text-[#D4AF37] transition-colors block">Blog</a></li>
            <li><a href="#overview" className="hover:text-[#D4AF37] transition-colors block">Contact</a></li>
          </ul>
        </div>
      </div>

      {/* Copyright & Compliance Links */}
      <div className="mt-16 pt-8 border-t border-[#1C1B1B] flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-neutral-600 gap-4">
        <div>© 2024 MicrOps Inc. All rights reserved.</div>
        <div className="flex items-center gap-6">
          <a href="#overview" className="hover:text-neutral-400 transition-colors">Privacy Policy</a>
          <a href="#overview" className="hover:text-neutral-400 transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};
