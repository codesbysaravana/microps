import React from 'react';
import { Link } from 'react-router-dom';

export const LandingPricingSection: React.FC = () => {
  return (
    <section id="pricing" className="py-24 px-6 sm:px-12 max-w-6xl mx-auto select-none border-t border-[#1C1B1B]">
      <div className="text-center mb-16 space-y-3">
        <div className="inline-block px-3 py-1 rounded bg-[#D4AF37]/10 text-[#D4AF37] font-mono text-xs uppercase tracking-widest font-bold">
          Transparent Billing
        </div>
        <h2 className="font-headline-md text-3xl sm:text-5xl font-semibold text-[#F5F5F0]">
          Pay only for what you compute.
        </h2>
        <p className="font-body-md text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto">
          No hidden bandwidth fees. No opaque egress charges. Predictable scaling designed for production workloads.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {/* Hobby */}
        <div className="bg-[#131313] border border-[#2A2A2A] rounded-2xl p-8 flex flex-col justify-between">
          <div>
            <h3 className="font-headline-md text-2xl font-semibold text-[#F5F5F0] mb-2">Hobby</h3>
            <div className="flex items-baseline gap-1 my-4">
              <span className="font-headline-lg text-4xl font-bold text-white">$0</span>
              <span className="font-mono text-xs text-neutral-500">/mo</span>
            </div>
            <p className="font-body-md text-sm text-neutral-400 mb-6">For personal experiments and exploration.</p>
            <ul className="space-y-3 font-mono text-xs text-neutral-300 mb-8">
              <li>✓ 100 Build Minutes</li>
              <li>✓ 50GB Egress Bandwidth</li>
              <li>✓ Community Support</li>
            </ul>
          </div>
          <Link
            to="/signup"
            className="w-full text-center py-3.5 bg-transparent border border-[#2A2A2A] hover:border-[#D4AF37] text-white hover:text-[#D4AF37] font-mono text-xs font-bold uppercase tracking-wider rounded transition-all"
          >
            START FREE
          </Link>
        </div>

        {/* Pro */}
        <div className="bg-[#131313] border-2 border-[#D4AF37] rounded-2xl p-8 flex flex-col justify-between relative shadow-[0_0_40px_rgba(212,175,55,0.15)]">
          <span className="absolute -top-3 right-6 bg-[#D4AF37] text-[#131313] font-mono text-[10px] font-bold px-3 py-1 rounded uppercase tracking-wider">
            Most Popular
          </span>
          <div>
            <h3 className="font-headline-md text-2xl font-semibold text-[#F5F5F0] mb-2 flex items-center gap-2">
              <span>Pro</span>
              <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
            </h3>
            <div className="flex items-baseline gap-1 my-4">
              <span className="font-headline-lg text-4xl font-bold text-white">$29</span>
              <span className="font-mono text-xs text-neutral-400">/mo usage est.</span>
            </div>
            <p className="font-body-md text-sm text-neutral-400 mb-6">Autonomous scaling for production engineering.</p>
            <ul className="space-y-3 font-mono text-xs text-neutral-200 mb-8">
              <li>✓ Auto-scaling cluster infrastructure</li>
              <li>✓ Neural cost predictive modeling</li>
              <li>✓ Priority 24/7 technical support</li>
            </ul>
          </div>
          <Link
            to="/signup"
            className="w-full text-center py-3.5 bg-[#D4AF37] hover:bg-[#e2bd44] text-[#131313] font-mono text-xs font-bold uppercase tracking-wider rounded transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)]"
          >
            DEPLOY PRO
          </Link>
        </div>

        {/* Enterprise */}
        <div className="bg-[#131313] border border-[#2A2A2A] rounded-2xl p-8 flex flex-col justify-between">
          <div>
            <h3 className="font-headline-md text-2xl font-semibold text-[#F5F5F0] mb-2">Enterprise</h3>
            <div className="flex items-baseline gap-1 my-4">
              <span className="font-headline-lg text-4xl font-bold text-white">Custom</span>
            </div>
            <p className="font-body-md text-sm text-neutral-400 mb-6">Dedicated infrastructure and strict compliance.</p>
            <ul className="space-y-3 font-mono text-xs text-neutral-300 mb-8">
              <li>✓ Single-tenant bare-metal clusters</li>
              <li>✓ Custom SLAs & escalation channels</li>
              <li>✓ Dedicated Solutions Architect</li>
            </ul>
          </div>
          <Link
            to="/signup"
            className="w-full text-center py-3.5 bg-transparent border border-[#2A2A2A] hover:border-[#D4AF37] text-white hover:text-[#D4AF37] font-mono text-xs font-bold uppercase tracking-wider rounded transition-all"
          >
            CONTACT SALES
          </Link>
        </div>
      </div>
    </section>
  );
};
