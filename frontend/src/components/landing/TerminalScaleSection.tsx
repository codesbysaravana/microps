import React, { useState, useEffect } from 'react';
import { ShinyText } from '../ui/ShinyText';

export const TerminalScaleSection: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(6);

  const handleCopy = () => {
    navigator.clipboard.writeText('microps deploy --env production');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReplay = () => {
    setStep(1);
  };

  useEffect(() => {
    if (step < 6) {
      const timer = setTimeout(() => {
        setStep((s) => s + 1);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [step]);

  return (
    <section id="deployments" className="py-20 px-6 sm:px-10 max-w-6xl mx-auto border-t border-[#1C1B1B]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Content Column */}
        <div>
          <h2 className="font-headline-md text-3xl font-semibold text-white mb-4">
            <ShinyText text="One Command," color="#FFFFFF" shineColor="#ffffff" speed={6} delay={14} spread={100} /> <br className="hidden sm:block" />
            Infinite Scale
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base leading-relaxed mb-8 font-body-md">
            Deploy complex microservice architectures across multi-cloud environments without leaving the terminal. Configuration as code, executed instantly.
          </p>

          {/* Feature Checklist */}
          <ul className="space-y-4">
            <li className="flex items-center gap-3 text-sm text-neutral-200 font-body-md">
              <div className="w-5 h-5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Declarative YAML definitions</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-neutral-200 font-body-md">
              <div className="w-5 h-5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Automated rollback triggers</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-neutral-200 font-body-md">
              <div className="w-5 h-5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Zero-downtime migrations</span>
            </li>
          </ul>
        </div>

        {/* Right Terminal Simulator Window */}
        <div className="bg-[#0E0E0E] border border-[#2A2A2A] rounded-xl shadow-2xl overflow-hidden font-mono text-xs sm:text-sm">
          {/* Terminal Title Bar */}
          <div className="bg-[#161616] border-b border-[#2A2A2A] px-4 py-3 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
            </div>
            <div className="text-neutral-500 text-xs">operator@microps:~</div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleReplay}
                title="Replay sequence"
                className="text-neutral-500 hover:text-neutral-300 transition-colors text-[11px]"
              >
                Replay
              </button>
              <button
                onClick={handleCopy}
                className="text-neutral-400 hover:text-[#D4AF37] transition-colors text-[11px] flex items-center gap-1"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Terminal Output Body */}
          <div className="p-6 space-y-2.5 leading-relaxed bg-[#0A0A0A] min-h-[220px]">
            <div className="flex items-center gap-2">
              <span className="text-neutral-600">$</span>
              <span className="text-[#D4AF37] font-semibold">microps deploy --env production</span>
            </div>

            {step >= 2 && (
              <div className="text-neutral-500 animate-in fade-in duration-200">
                &gt; Authenticating context...
              </div>
            )}
            {step >= 3 && (
              <div className="text-neutral-500 animate-in fade-in duration-200">
                &gt; Parsing microps.yaml...
              </div>
            )}
            {step >= 4 && (
              <div className="text-neutral-400 animate-in fade-in duration-200">
                &gt; Provisioning 8 API nodes [us-east-1]
              </div>
            )}
            {step >= 5 && (
              <div className="text-[#7C3AED] font-medium animate-in fade-in duration-200">
                &gt; Scaling cache cluster to 50GB
              </div>
            )}
            {step >= 6 && (
              <div className="text-[#D4AF37] font-semibold animate-in fade-in duration-200">
                &gt; Deployment successful. Time: 4.2s
              </div>
            )}

            <div className="pt-1">
              <span className="inline-block w-2 h-4 bg-[#D4AF37] animate-pulse align-middle"></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
