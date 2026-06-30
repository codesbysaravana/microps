import React, { useState } from 'react';

export const VisualPipelineSection: React.FC = () => {
  const [activeStage, setActiveStage] = useState(2);

  const stages = [
    { id: 1, name: 'AST & Syntax Check', status: 'COMPLETE', time: '0.4s' },
    { id: 2, name: 'Neural Security Sandbox', status: 'ACTIVE', time: '1.2s' },
    { id: 3, name: 'Canary Multi-Region Sync', status: 'PENDING', time: '—' },
    { id: 4, name: 'Global Edge Ingress', status: 'PENDING', time: '—' },
  ];

  return (
    <section id="pipeline" className="py-24 px-6 sm:px-12 max-w-6xl mx-auto select-none border-t border-[#1C1B1B]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Storytelling left column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="inline-block px-3 py-1 rounded bg-[#D4AF37]/10 text-[#D4AF37] font-mono text-xs uppercase tracking-widest font-bold">
            Autonomous Pipelines
          </div>
          <h2 className="font-headline-md text-3xl sm:text-4xl font-semibold text-[#F5F5F0]">
            From Git push to global edge in seconds.
          </h2>
          <p className="font-body-md text-sm sm:text-base text-neutral-400 leading-relaxed">
            Watch your build artifacts stream through our zero-trust verification pipeline. Every commit is containerized, scanned for zero-day vulnerabilities, and deployed across 64 global regions simultaneously.
          </p>

          <div className="pt-4 font-mono text-xs text-neutral-300 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Zero build queue waiting time</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Instant rollback capability on failed health checks</span>
            </div>
          </div>
        </div>

        {/* Floating Pipeline Preview Window */}
        <div className="lg:col-span-7 bg-[#131313] border border-[#2A2A2A] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-4 mb-6 font-mono text-xs">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-white font-bold">microps-core/pipeline-stream</span>
            </div>
            <span className="text-neutral-500">Commit #4f8a2c • Production</span>
          </div>

          {/* Interactive Pipeline Stages */}
          <div className="space-y-4">
            {stages.map((stg) => (
              <div
                key={stg.id}
                onClick={() => setActiveStage(stg.id)}
                className={`p-4 rounded-xl border transition-all duration-300 flex items-center justify-between cursor-pointer font-mono text-xs ${
                  activeStage === stg.id
                    ? 'bg-[#1C1B1B] border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.15)] translate-x-1'
                    : 'bg-[#161616] border-[#2A2A2A] hover:border-neutral-600'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] ${
                    stg.status === 'COMPLETE'
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                      : stg.status === 'ACTIVE'
                      ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37] animate-pulse'
                      : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                  }`}>
                    {stg.status === 'COMPLETE' ? '✓' : stg.id}
                  </div>
                  <div>
                    <div className="text-white font-medium">{stg.name}</div>
                    <div className="text-neutral-500 text-[10px]">{stg.status === 'ACTIVE' ? 'Running cryptographic verification...' : 'Pipeline Stage'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    stg.status === 'COMPLETE' ? 'bg-emerald-500/10 text-emerald-400' : stg.status === 'ACTIVE' ? 'bg-[#D4AF37]/15 text-[#D4AF37]' : 'text-neutral-600'
                  }`}>
                    {stg.status}
                  </span>
                  <span className="text-neutral-400 w-10 text-right">{stg.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
