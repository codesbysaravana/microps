import React from 'react';

export const AiIntegrationsSection: React.FC = () => {
  return (
    <section id="ai" className="py-24 px-6 sm:px-12 max-w-6xl mx-auto select-none border-t border-[#1C1B1B]">
      {/* AI Features Sub-section */}
      <div className="mb-24">
        <div className="text-center mb-16 space-y-3">
          <div className="inline-block px-3 py-1 rounded bg-[#D4AF37]/10 text-[#D4AF37] font-mono text-xs uppercase tracking-widest font-bold">
            Autonomous AI Engine
          </div>
          <h2 className="font-headline-md text-3xl sm:text-5xl font-semibold text-[#F5F5F0]">
            Infrastructure that thinks ahead.
          </h2>
          <p className="font-body-md text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto">
            Our embedded AI Cost & Anomaly Oracle continuously forecasts workload saturation before traffic bottlenecks occur.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#131313] border border-[#2A2A2A] rounded-2xl p-8 flex flex-col justify-between">
            <div>
              <span className="font-mono text-xs text-[#D4AF37] uppercase tracking-wider font-bold block mb-2">
                Cost Oracle Telemetry
              </span>
              <h3 className="font-headline-md text-2xl text-[#F5F5F0] mb-4">
                Predictive Resource Sharding
              </h3>
              <p className="font-body-md text-sm text-neutral-400 leading-relaxed mb-6">
                MicrOps analyzes historical traffic gradients and preemptively provisions compute shards right before traffic surges hit, eliminating cold-start latency.
              </p>
            </div>
            <div className="bg-[#1C1B1B] p-4 rounded-xl border border-[#2A2A2A] font-mono text-xs text-neutral-300 flex justify-between items-center">
              <span>Predicted Cost Savings</span>
              <span className="text-emerald-400 font-bold">42.8% Average Efficiency</span>
            </div>
          </div>

          <div className="bg-[#131313] border border-[#2A2A2A] rounded-2xl p-8 flex flex-col justify-between">
            <div>
              <span className="font-mono text-xs text-[#D4AF37] uppercase tracking-wider font-bold block mb-2">
                Autonomous Healing
              </span>
              <h3 className="font-headline-md text-2xl text-[#F5F5F0] mb-4">
                Neural-Link Anomaly Resolution
              </h3>
              <p className="font-body-md text-sm text-neutral-400 leading-relaxed mb-6">
                When memory leak signatures or abnormal HTTP error spikes are detected, the system autonomously isolates compromised pods and deploys clean replicas.
              </p>
            </div>
            <div className="bg-[#1C1B1B] p-4 rounded-xl border border-[#2A2A2A] font-mono text-xs text-neutral-300 flex justify-between items-center">
              <span>Mean Time To Remediation</span>
              <span className="text-[#D4AF37] font-bold">&lt; 180 Milliseconds</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Integrations Sub-section */}
      <div className="text-center space-y-8">
        <h3 className="font-headline-md text-xl sm:text-2xl text-neutral-300">
          Native integration across all major infrastructure providers
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-6 font-mono text-xs font-bold text-neutral-400">
          <div className="bg-[#131313] border border-[#2A2A2A] hover:border-[#D4AF37] p-6 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:text-white">
            <span className="text-lg text-[#D4AF37]">AWS</span>
            <span>Amazon Web Services</span>
          </div>
          <div className="bg-[#131313] border border-[#2A2A2A] hover:border-[#D4AF37] p-6 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:text-white">
            <span className="text-lg text-[#D4AF37]">GCP</span>
            <span>Google Cloud Platform</span>
          </div>
          <div className="bg-[#131313] border border-[#2A2A2A] hover:border-[#D4AF37] p-6 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:text-white">
            <span className="text-lg text-[#D4AF37]">AZURE</span>
            <span>Microsoft Azure</span>
          </div>
          <div className="bg-[#131313] border border-[#2A2A2A] hover:border-[#D4AF37] p-6 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:text-white">
            <span className="text-lg text-[#D4AF37]">K8S</span>
            <span>Kubernetes Native</span>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-[#131313] border border-[#2A2A2A] hover:border-[#D4AF37] p-6 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:text-white">
            <span className="text-lg text-[#D4AF37]">EDGE</span>
            <span>Cloudflare Workers</span>
          </div>
        </div>
      </div>
    </section>
  );
};
