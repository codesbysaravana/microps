import React, { useState } from 'react';
import { Toast } from '../ui/primitives';

interface PricingPlansGridProps {
  onSelectTier?: (tier: string) => void;
}

export const PricingPlansGrid: React.FC<PricingPlansGridProps> = ({ onSelectTier }) => {
  const [buildMinutes, setBuildMinutes] = useState(5000);
  const [bandwidth, setBandwidth] = useState(500);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Calculate dynamic price estimation based on interactive slider telemetry
  const basePrice = 29;
  const extraMinutesCost = Math.max(0, (buildMinutes - 5000) / 1000) * 5;
  const extraBandwidthCost = Math.max(0, (bandwidth - 500) / 100) * 8;
  const estimatedMonthly = Math.round(basePrice + extraMinutesCost + extraBandwidthCost);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch select-none mb-16 relative">
      {toastMessage && (
        <Toast message={toastMessage} type="info" onDismiss={() => setToastMessage(null)} />
      )}

      {/* Card 1: Hobby */}
      <div className="bg-[#131313] border border-[#2A2A2A] rounded-lg p-6 sm:p-8 flex flex-col justify-between hover:border-[#2A2A2A]/80 transition-all">
        <div>
          <h3 className="font-headline-md text-2xl sm:text-3xl font-semibold text-[#F5F5F0] mb-2">
            Hobby
          </h3>
          <div className="flex items-baseline gap-1 my-3">
            <span className="font-headline-lg text-4xl sm:text-5xl font-bold text-[#F5F5F0]">$0</span>
            <span className="font-mono text-xs text-neutral-500">/mo</span>
          </div>
          <p className="font-body-md text-xs sm:text-sm text-neutral-400 mt-2 mb-8">
            For personal projects and exploration.
          </p>

          <div className="space-y-4 my-8 font-mono text-xs sm:text-sm text-neutral-200">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-[#D4AF37] mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>100 Build Minutes</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-[#D4AF37] mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>50GB Bandwidth</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-[#D4AF37] mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Community Support</span>
            </div>
            <div className="flex items-center text-neutral-500">
              <span className="w-4 text-center mr-3 shrink-0 font-bold">—</span>
              <span>SLA Guarantee</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSelectTier ? onSelectTier('FREE') : setToastMessage('You are currently active on the Hobby tier.')}
          className="w-full py-3.5 bg-transparent border border-[#2A2A2A] hover:border-[#D4AF37] text-[#F5F5F0] hover:text-[#D4AF37] font-mono text-xs font-bold uppercase tracking-wider rounded transition-all mt-8"
        >
          START FREE
        </button>
      </div>

      {/* Card 2: Pro (Featured) */}
      <div className="bg-[#131313] border-2 border-[#D4AF37] rounded-lg p-6 sm:p-8 flex flex-col justify-between relative shadow-[0_0_35px_rgba(212,175,55,0.12)]">
        <span className="absolute -top-3.5 right-6 bg-[#D4AF37] text-[#131313] font-mono text-xs font-bold px-3 py-1 rounded shadow-md uppercase tracking-wider">
          Most Popular
        </span>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-headline-md text-2xl sm:text-3xl font-semibold text-[#F5F5F0]">
              Pro
            </h3>
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]"></span>
          </div>

          <div className="flex items-baseline gap-1 my-3">
            <span className="font-headline-lg text-4xl sm:text-5xl font-bold text-[#F5F5F0]">${estimatedMonthly}</span>
            <span className="font-mono text-xs text-neutral-400">/mo est.</span>
          </div>
          <p className="font-body-md text-xs sm:text-sm text-neutral-400 mt-2 mb-6">
            Usage-based pricing for production workloads.
          </p>

          {/* Interactive Sliders Container */}
          <div className="bg-[#1C1B1B] border border-[#2A2A2A] rounded p-4 sm:p-5 my-6 space-y-5 font-mono text-xs">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-neutral-300">
                <span>Build Minutes</span>
                <span className="text-[#D4AF37] font-bold text-sm">{buildMinutes.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="15000"
                step="500"
                value={buildMinutes}
                onChange={(e) => setBuildMinutes(Number(e.target.value))}
                aria-label="Adjust Build Minutes"
                className="w-full accent-[#D4AF37] cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-neutral-300">
                <span>Bandwidth (GB)</span>
                <span className="text-[#D4AF37] font-bold text-sm">{bandwidth.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="100"
                max="2000"
                step="100"
                value={bandwidth}
                onChange={(e) => setBandwidth(Number(e.target.value))}
                aria-label="Adjust Bandwidth in GB"
                className="w-full accent-[#D4AF37] cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-4 my-6 font-mono text-xs sm:text-sm text-neutral-200">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-[#D4AF37] mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Auto-scaling AWS ECS Fargate</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-[#D4AF37] mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Real-time SSE logging</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-[#D4AF37] mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Priority enterprise support</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSelectTier ? onSelectTier('PRO') : setToastMessage(`Selected Pro tier (${buildMinutes.toLocaleString()} min / ${bandwidth.toLocaleString()} GB). Checkout initiated.`)}
          className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#e2bd44] text-[#131313] font-mono text-xs font-bold uppercase tracking-wider rounded transition-all mt-8 shadow-[0_0_15px_rgba(212,175,55,0.25)] active:scale-[0.99]"
        >
          DEPLOY PRO
        </button>
      </div>

      {/* Card 3: Enterprise */}
      <div className="bg-[#131313] border border-[#2A2A2A] rounded-lg p-6 sm:p-8 flex flex-col justify-between hover:border-[#2A2A2A]/80 transition-all">
        <div>
          <h3 className="font-headline-md text-2xl sm:text-3xl font-semibold text-[#F5F5F0] mb-2">
            Enterprise
          </h3>
          <div className="flex items-baseline gap-1 my-3">
            <span className="font-headline-lg text-4xl sm:text-5xl font-bold text-[#F5F5F0]">Custom</span>
          </div>
          <p className="font-body-md text-xs sm:text-sm text-neutral-400 mt-2 mb-8">
            Dedicated AWS ECS Fargate clusters and SLAs.
          </p>

          <div className="space-y-4 my-8 font-mono text-xs sm:text-sm text-neutral-200">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-[#D4AF37] mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Single-tenant ECS Fargate pools</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-[#D4AF37] mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Custom SLAs & Contracts</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-[#D4AF37] mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Dedicated Platform Engineer</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-[#D4AF37] mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>24/7 Phone Support</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSelectTier ? onSelectTier('ENTERPRISE') : setToastMessage('Connected with Enterprise Solutions team.')}
          className="w-full py-3.5 bg-transparent border border-[#2A2A2A] hover:border-[#D4AF37] text-[#F5F5F0] hover:text-[#D4AF37] font-mono text-xs font-bold uppercase tracking-wider rounded transition-all mt-8"
        >
          CONTACT SALES
        </button>
      </div>
    </div>
  );
};
