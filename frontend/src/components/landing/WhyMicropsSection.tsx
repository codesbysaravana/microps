import React from 'react';

export const WhyMicropsSection: React.FC = () => {
  return (
    <section className="py-24 px-6 sm:px-12 max-w-6xl mx-auto select-none border-t border-[#1C1B1B]">
      <div className="text-center mb-16 space-y-3">
        <h2 className="font-headline-md text-3xl sm:text-5xl font-semibold text-[#F5F5F0]">
          Why elite teams migrate to MicrOps.
        </h2>
        <p className="font-body-md text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto">
          Replace brittle Terraform spaghetti and manual bash patching with automated infrastructure intelligence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* Legacy Cloud Sprawl */}
        <div className="bg-[#131313]/60 border border-red-900/40 rounded-2xl p-8 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 text-red-400 font-mono text-xs uppercase tracking-widest font-bold mb-6">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span>Legacy Infrastructure Sprawl</span>
            </div>
            <h3 className="font-headline-md text-2xl text-neutral-300 mb-6">
              Manual provisioning & unmanaged state drift
            </h3>
            <ul className="space-y-4 font-mono text-xs text-neutral-400">
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-bold">✕</span>
                <span>Hours wasted writing boilerplate AWS IAM roles and VPC configurations</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-bold">✕</span>
                <span>Unexpected cloud egress spikes and opaque bandwidth penalties</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-bold">✕</span>
                <span>Manual failover runs requiring late-night engineering interventions</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-bold">✕</span>
                <span>Fragmented logs split across 10 disjointed monitoring dashboards</span>
              </li>
            </ul>
          </div>
        </div>

        {/* MicrOps Surgical Precision */}
        <div className="bg-[#131313] border-2 border-[#D4AF37] rounded-2xl p-8 sm:p-10 flex flex-col justify-between shadow-[0_0_40px_rgba(212,175,55,0.15)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none"></div>
          <div>
            <div className="flex items-center gap-3 text-[#D4AF37] font-mono text-xs uppercase tracking-widest font-bold mb-6">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]"></span>
              <span>The MicrOps Operating System</span>
            </div>
            <h3 className="font-headline-md text-2xl text-[#F5F5F0] mb-6">
              Surgical automation & autonomous scaling
            </h3>
            <ul className="space-y-4 font-mono text-xs text-neutral-200">
              <li className="flex items-start gap-3">
                <span className="text-[#D4AF37] font-bold">✓</span>
                <span>Sub-second deployment verification directly from `microps deploy`</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#D4AF37] font-bold">✓</span>
                <span>Transparent pay-for-compute billing with zero hidden networking fees</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#D4AF37] font-bold">✓</span>
                <span>Autonomous multi-region failover and self-healing cluster orchestration</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#D4AF37] font-bold">✓</span>
                <span>Unified real-time telemetry mesh with AI anomaly detection</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
