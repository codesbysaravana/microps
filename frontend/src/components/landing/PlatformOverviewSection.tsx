import React from 'react';
import { ShinyText } from '../ui/ShinyText';

export const PlatformOverviewSection: React.FC = () => {
  return (
    <section id="features" className="py-24 px-6 sm:px-12 max-w-6xl mx-auto select-none border-t border-[#1C1B1B]">
      <div className="text-center mb-16 space-y-3">
        <div className="inline-block px-3 py-1 rounded bg-[#D4AF37]/10 text-[#D4AF37] font-mono text-xs uppercase tracking-widest font-bold">
          Architectural Superiority
        </div>
        <h2 className="font-headline-md text-3xl sm:text-5xl font-semibold text-[#F5F5F0]">
          <ShinyText text="Built for surgical precision." color="#F5F5F0" shineColor="#ffffff" speed={6} delay={12} spread={100} />
        </h2>
        <p className="font-body-md text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto">
          Every primitive in MicrOps is engineered from first principles to eliminate infrastructure friction.
        </p>
      </div>

      {/* Editorial Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Card 1 */}
        <div className="bg-[#131313] border border-[#2A2A2A] hover:border-[#D4AF37]/60 rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(212,175,55,0.12)] group">
          <div className="w-12 h-12 rounded-xl bg-[#1C1B1B] border border-[#2A2A2A] group-hover:border-[#D4AF37] flex items-center justify-center text-[#D4AF37] mb-6 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h3 className="font-headline-md text-2xl font-semibold text-[#F5F5F0] mb-3">
              Declarative Mesh
            </h3>
            <p className="font-body-md text-sm text-neutral-400 leading-relaxed">
              Define complete Kubernetes topologies, VPC bridges, and ingress routes in a clean, unified declarative specification.
            </p>
          </div>
          <div className="mt-8 pt-4 border-t border-[#2A2A2A]/60 font-mono text-xs text-[#D4AF37] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>Explore Specification</span>
            <span>→</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#131313] border border-[#2A2A2A] hover:border-[#D4AF37]/60 rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(212,175,55,0.12)] group">
          <div className="w-12 h-12 rounded-xl bg-[#1C1B1B] border border-[#2A2A2A] group-hover:border-[#D4AF37] flex items-center justify-center text-[#D4AF37] mb-6 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-headline-md text-2xl font-semibold text-[#F5F5F0] mb-3">
              Instant Failover
            </h3>
            <p className="font-body-md text-sm text-neutral-400 leading-relaxed">
              Global multi-region synchronizers automatically reroute traffic around network partitions in under 4 milliseconds.
            </p>
          </div>
          <div className="mt-8 pt-4 border-t border-[#2A2A2A]/60 font-mono text-xs text-[#D4AF37] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>View Routing Telemetry</span>
            <span>→</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-[#131313] border border-[#2A2A2A] hover:border-[#D4AF37]/60 rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(212,175,55,0.12)] group">
          <div className="w-12 h-12 rounded-xl bg-[#1C1B1B] border border-[#2A2A2A] group-hover:border-[#D4AF37] flex items-center justify-center text-[#D4AF37] mb-6 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h3 className="font-headline-md text-2xl font-semibold text-[#F5F5F0] mb-3">
              Zero-Trust Core
            </h3>
            <p className="font-body-md text-sm text-neutral-400 leading-relaxed">
              Automated mTLS encryption across pod-to-pod channels with continuous cryptographic verification.
            </p>
          </div>
          <div className="mt-8 pt-4 border-t border-[#2A2A2A]/60 font-mono text-xs text-[#D4AF37] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>Security Architecture</span>
            <span>→</span>
          </div>
        </div>
      </div>
    </section>
  );
};
