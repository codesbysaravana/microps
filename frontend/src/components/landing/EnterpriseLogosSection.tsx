import React from 'react';

export const EnterpriseLogosSection: React.FC = () => {
  return (
    <section id="enterprise" className="py-24 px-6 sm:px-12 max-w-6xl mx-auto select-none border-t border-[#1C1B1B]">
      {/* Enterprise Features */}
      <div className="text-center mb-16 space-y-3">
        <div className="inline-block px-3 py-1 rounded bg-[#D4AF37]/10 text-[#D4AF37] font-mono text-xs uppercase tracking-widest font-bold">
          Defense-Grade Compliance
        </div>
        <h2 className="font-headline-md text-3xl sm:text-5xl font-semibold text-[#F5F5F0]">
          Architected for enterprise security.
        </h2>
        <p className="font-body-md text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto">
          Single-tenant dedicated clusters, hardware security modules, and strict compliance attestations built in from day one.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
        <div className="bg-[#131313] border border-[#2A2A2A] p-8 rounded-2xl">
          <span className="font-mono text-xs text-neutral-400 font-bold block mb-3">CERTIFIED</span>
          <h3 className="font-headline-md text-xl font-semibold text-[#F5F5F0] mb-2">SOC2 Type II & ISO 27001</h3>
          <p className="font-body-md text-sm text-neutral-400">Continuous cryptographic logging with automated compliance reporting and tamper-proof audit rails.</p>
        </div>
        <div className="bg-[#131313] border border-[#2A2A2A] p-8 rounded-2xl">
          <span className="font-mono text-xs text-[#D4AF37] font-bold block mb-3">ISOLATED</span>
          <h3 className="font-headline-md text-xl font-semibold text-[#F5F5F0] mb-2">Single-Tenant Bare Metal</h3>
          <p className="font-body-md text-sm text-neutral-400">Deploy your infrastructure on dedicated bare-metal nodes with zero shared kernel resources.</p>
        </div>
        <div className="bg-[#131313] border border-[#2A2A2A] p-8 rounded-2xl">
          <span className="font-mono text-xs text-purple-400 font-bold block mb-3">CUSTOM SLAs</span>
          <h3 className="font-headline-md text-xl font-semibold text-[#F5F5F0] mb-2">99.999% Guaranteed SLA</h3>
          <p className="font-body-md text-sm text-neutral-400">Backed by custom engineering escalation contracts and dedicated 24/7 solutions architects.</p>
        </div>
      </div>

      {/* Customer Logos Bar */}
      <div className="text-center pt-12 border-t border-[#2A2A2A]/40 space-y-6">
        <span className="font-mono text-xs uppercase tracking-widest text-neutral-500 font-semibold">
          TRUSTED BY ARCHITECTS AT THE WORLD'S MOST ELITE ENGINEERING TEAMS
        </span>
        <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all font-headline-md text-lg sm:text-2xl font-bold tracking-tight text-neutral-300">
          <div className="hover:text-white transition-colors">VECTOR DYNAMICS</div>
          <div className="hover:text-white transition-colors">QUANTUM LABS</div>
          <div className="hover:text-white transition-colors">APEX CLOUD</div>
          <div className="hover:text-white transition-colors">CYBERCORE SYSTEM</div>
        </div>
      </div>
    </section>
  );
};
