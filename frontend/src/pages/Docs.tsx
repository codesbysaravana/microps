import React from 'react';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { LandingFooter } from '../components/landing/LandingFooter';

export const Docs: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-[#F5F5F0] flex flex-col font-body-md selection:bg-[#D4AF37] selection:text-[#0E0E0E]">
      <LandingNavbar />
      
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 sm:px-12 py-20">
        <div className="space-y-6">
          <h1 className="font-headline-lg text-4xl sm:text-5xl font-bold tracking-tight text-[#F5F5F0]">
            Documentation
          </h1>
          <p className="text-neutral-400 text-lg max-w-2xl font-mono">
            Learn how to deploy, manage, and scale your infrastructure with MicrOps.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Quickstart Guide', desc: 'Deploy your first service in under 5 minutes.' },
            { title: 'API Reference', desc: 'Complete documentation for the MicrOps REST API.' },
            { title: 'CLI Tool', desc: 'Manage your environments directly from the terminal.' },
            { title: 'Environment Variables', desc: 'Securely manage secrets across deployments.' },
            { title: 'Custom Domains', desc: 'Configure custom domains and automatic SSL.' },
            { title: 'Billing & Quotas', desc: 'Understand platform limits and pricing tiers.' }
          ].map((doc, idx) => (
            <div key={idx} className="p-6 border border-[#2A2A2A] bg-[#131313] rounded hover:border-[#D4AF37] transition-colors group cursor-pointer">
              <h3 className="font-headline-lg text-xl font-bold text-[#F5F5F0] group-hover:text-[#D4AF37] transition-colors mb-2">
                {doc.title}
              </h3>
              <p className="text-sm text-neutral-500 font-mono">
                {doc.desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};
