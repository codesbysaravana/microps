import React from 'react';

export const SignupVisualPanel: React.FC = () => {
  return (
    <div className="hidden md:flex w-1/2 bg-[#161616] border-l border-[#2A2A2A]/40 flex-col justify-center p-6 sm:p-8 lg:p-12 xl:p-16 relative overflow-hidden select-none my-auto">
      {/* Subtle background glow */}
      <div className="absolute top-1/3 right-0 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-lg w-full mx-auto space-y-6 sm:space-y-8 xl:space-y-10">
        {/* Value Proposition Header */}
        <div className="space-y-1.5 sm:space-y-2.5">
          <h2 className="font-headline-md text-xl sm:text-2xl xl:text-3xl font-semibold text-[#D4AF37] tracking-tight">
            Surgical Precision in DevOps.
          </h2>
          <p className="font-body-lg text-xs sm:text-sm xl:text-base text-neutral-300 leading-relaxed">
            Step into a new era of infrastructure management. MicrOps provides the elite tools necessary for high-stakes cloud operations.
          </p>
        </div>

        {/* Features Stack */}
        <div className="space-y-4 sm:space-y-5 xl:space-y-7">
          {/* Feature 1: Deploy in seconds */}
          <div className="flex items-start gap-3.5 sm:gap-4 group">
            <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 xl:w-12 xl:h-12 rounded bg-[#1C1B1B] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shadow-inner group-hover:border-[#D4AF37] transition-colors duration-300">
              <svg className="w-5 h-5 xl:w-6 xl:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-mono text-xs sm:text-sm xl:text-base font-medium text-white mb-0.5 sm:mb-1 group-hover:text-[#D4AF37] transition-colors duration-300">
                Deploy in seconds
              </h3>
              <p className="font-body-md text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Global infrastructure orchestrated with zero-latency synchronization.
              </p>
            </div>
          </div>

          {/* Feature 2: Visual Infrastructure */}
          <div className="flex items-start gap-3.5 sm:gap-4 group">
            <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 xl:w-12 xl:h-12 rounded bg-[#1C1B1B] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shadow-inner group-hover:border-[#D4AF37] transition-colors duration-300">
              <svg className="w-5 h-5 xl:w-6 xl:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div>
              <h3 className="font-mono text-xs sm:text-sm xl:text-base font-medium text-white mb-0.5 sm:mb-1 group-hover:text-[#D4AF37] transition-colors duration-300">
                Visual Infrastructure
              </h3>
              <p className="font-body-md text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Architecture as a living canvas. Manipulate nodes with tactile feedback.
              </p>
            </div>
          </div>

          {/* Feature 3: AI-Assisted DevOps */}
          <div className="flex items-start gap-3.5 sm:gap-4 group">
            <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 xl:w-12 xl:h-12 rounded bg-[#1C1B1B] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shadow-inner group-hover:border-[#D4AF37] transition-colors duration-300">
              <svg className="w-5 h-5 xl:w-6 xl:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="font-mono text-xs sm:text-sm xl:text-base font-medium text-white mb-0.5 sm:mb-1 group-hover:text-[#D4AF37] transition-colors duration-300">
                AI-Assisted DevOps
              </h3>
              <p className="font-body-md text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Predictive scaling and automated remediation via neural-link processing.
              </p>
            </div>
          </div>
        </div>

        {/* Testimonial Section */}
        <div className="pt-4 sm:pt-6 xl:pt-8 border-t border-[#2A2A2A]/60">
          <div className="flex items-center gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 xl:w-10 xl:h-10 overflow-hidden rounded bg-[#2A2A2A] border border-[#2A2A2A] shrink-0 flex items-center justify-center text-xs font-mono text-neutral-400 font-bold">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                alt="Elias Thorne"
                className="w-full h-full object-cover grayscale opacity-80"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="absolute">ET</span>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-white font-bold leading-none mb-1">
                ELIAS THORNE
              </p>
              <p className="font-mono text-[10px] sm:text-[11px] text-neutral-500 tracking-wider">
                CTO, VECTOR DYNAMICS
              </p>
            </div>
          </div>
          <blockquote className="font-body-md italic text-neutral-300 border-l-2 border-[#D4AF37]/60 pl-3 sm:pl-4 text-xs sm:text-sm xl:text-base leading-relaxed">
            "MicrOps isn't just a platform; it's a competitive advantage. The precision of their deployment engine is unmatched in the industry."
          </blockquote>
        </div>
      </div>
    </div>
  );
};
