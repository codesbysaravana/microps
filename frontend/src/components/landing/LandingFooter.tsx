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
            <li><Link to="/" className="hover:text-neutral-300 transition-colors block">Platform</Link></li>
            <li><Link to="/integrations" className="hover:text-neutral-300 transition-colors block">Integrations</Link></li>
            <li><a href="/#pricing" className="hover:text-neutral-300 transition-colors block">Pricing</a></li>
            <li><Link to="/reviews" className="hover:text-neutral-300 transition-colors block">Customers</Link></li>
          </ul>
        </div>

        {/* RESOURCES */}
        <div className="space-y-4">
          <div className="font-mono text-[11px] uppercase tracking-widest text-neutral-400 font-bold">
            RESOURCES
          </div>
          <ul className="space-y-2.5 text-xs text-neutral-500 font-mono">
            <li><Link to="/docs" className="hover:text-neutral-300 transition-colors block">Documentation</Link></li>
            <li><Link to="/docs" className="hover:text-neutral-300 transition-colors block">API Reference</Link></li>
            <li><Link to="/" className="hover:text-neutral-300 transition-colors block">Community</Link></li>
            <li><Link to="/" className="hover:text-neutral-300 transition-colors block">Status</Link></li>
          </ul>
        </div>

        {/* COMPANY */}
        <div className="space-y-4">
          <div className="font-mono text-[11px] uppercase tracking-widest text-neutral-400 font-bold">
            COMPANY
          </div>
          <ul className="space-y-2.5 text-xs text-neutral-500 font-mono">
            <li><Link to="/" className="hover:text-neutral-300 transition-colors block">About Us</Link></li>
            <li><Link to="/" className="hover:text-neutral-300 transition-colors block">Careers</Link></li>
            <li><Link to="/" className="hover:text-neutral-300 transition-colors block">Blog</Link></li>
            <li><a href="mailto:contact@microps.in" className="hover:text-neutral-300 transition-colors block">Contact</a></li>
          </ul>
        </div>
      </div>

      {/* Copyright & Compliance Links */}
      <div className="mt-16 pt-8 border-t border-[#1C1B1B] flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-neutral-600 gap-4">
        <div>© 2026 MicrOps Inc. All rights reserved.</div>
        <div className="flex items-center gap-6">
          <Link to="/policy" className="hover:text-neutral-400 transition-colors">Privacy Policy</Link>
          <Link to="/policy" className="hover:text-neutral-400 transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
};
