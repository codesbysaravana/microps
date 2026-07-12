import React from 'react';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { LandingFooter } from '../components/landing/LandingFooter';

export const Integrations: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-[#F5F5F0] flex flex-col font-body-md selection:bg-[#D4AF37] selection:text-[#0E0E0E]">
      <LandingNavbar />
      
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 sm:px-12 py-20">
        <div className="space-y-6 text-center mb-16">
          <h1 className="font-headline-lg text-4xl sm:text-5xl font-bold tracking-tight text-[#F5F5F0]">
            AI & Integrations Ecosystem
          </h1>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto font-mono">
            MicrOps acts as the central nervous system for your cloud. Connect your favorite tools and let our AI engine orchestrate the rest.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: 'GitHub BYOC',
              badge: 'CI/CD',
              desc: 'Native integration with GitHub repositories. We automatically build, containerize, and deploy every time you push to main.',
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              )
            },
            {
              title: 'AWS Auto-Scaling',
              badge: 'Infrastructure',
              desc: 'Seamlessly provision EC2 clusters, ALBs, and scale-to-zero serverless environments based on real-time traffic metrics.',
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              )
            },
            {
              title: 'Stripe Billing',
              badge: 'FinOps',
              desc: 'Automated usage-based billing and tenant-level invoicing tied directly to infrastructure consumption.',
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              )
            },
            {
              title: 'OpenAI Diagnostics',
              badge: 'AI Engine',
              desc: 'When a build or container crashes, our integrated LLM agent reads the logs and recommends instant code patches.',
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              )
            },
            {
              title: 'Slack / Discord',
              badge: 'Alerting',
              desc: 'Get deployment status, pipeline failures, and traffic spike alerts directly in your team\'s chat channels.',
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              )
            },
            {
              title: 'Resend',
              badge: 'Communications',
              desc: 'Transactional emails for organization invitations, billing notices, and deployment status updates.',
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )
            }
          ].map((item, idx) => (
            <div key={idx} className="p-6 bg-[#131313] border border-[#2A2A2A] rounded flex flex-col gap-4 group hover:border-[#D4AF37] transition-colors">
              <div className="flex justify-between items-start">
                <div className="text-[#D4AF37] p-2 bg-[#D4AF37]/10 rounded">
                  {item.icon}
                </div>
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest bg-[#1C1B1B] px-2 py-1 rounded">
                  {item.badge}
                </span>
              </div>
              <div>
                <h3 className="font-headline-lg font-bold text-xl text-white mb-2 group-hover:text-[#D4AF37] transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-neutral-400 font-mono">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};
