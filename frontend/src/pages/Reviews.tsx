import React from 'react';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { LandingFooter } from '../components/landing/LandingFooter';

export const Reviews: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-[#F5F5F0] flex flex-col font-body-md selection:bg-[#D4AF37] selection:text-[#0E0E0E]">
      <LandingNavbar />
      
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 sm:px-12 py-20">
        <div className="space-y-6 text-center mb-16">
          <h1 className="font-headline-lg text-4xl sm:text-5xl font-bold tracking-tight text-[#F5F5F0]">
            Trusted by Elite Engineering Teams
          </h1>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto font-mono">
            See how top-tier organizations are using MicrOps to orchestrate their infrastructure at scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              quote: "MicrOps reduced our deployment times from 45 minutes to under 3 minutes. The declarative infrastructure is a game-changer.",
              author: "Sarah Jenkins",
              role: "VP of Engineering, Stellar Quantum"
            },
            {
              quote: "The built-in multi-tenant isolation out of the box saved us 6 months of engineering time. Unbelievable platform.",
              author: "David Chen",
              role: "CTO, Nexus Dynamics"
            },
            {
              quote: "Finally, a deployment orchestration tool that understands modern CI/CD pipelines natively. The GitHub BYOC integration is flawless.",
              author: "Marcus Vance",
              role: "Lead DevOps, Vertex AI"
            },
            {
              quote: "We scaled from 10 to 1,000 containers seamlessly. The autoscaler handles traffic spikes beautifully without breaking a sweat.",
              author: "Elena Rodriguez",
              role: "Infrastructure Lead, OmniCloud"
            },
            {
              quote: "The analytics and telemetry HUD gives us unprecedented visibility into our fleet. I can't imagine going back to AWS Console.",
              author: "James Thorne",
              role: "Systems Architect, Cipher Systems"
            },
            {
              quote: "From zero to production in a single command. MicrOps is exactly what the cloud-native ecosystem has been missing.",
              author: "Anita Patel",
              role: "Founder, Quantum Logic"
            }
          ].map((review, idx) => (
            <div key={idx} className="p-8 border border-[#2A2A2A] bg-[#131313] rounded flex flex-col justify-between">
              <p className="text-neutral-300 italic mb-6">"{review.quote}"</p>
              <div>
                <p className="font-bold text-[#F5F5F0] font-headline-lg">{review.author}</p>
                <p className="text-xs text-[#D4AF37] font-mono mt-1">{review.role}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};
