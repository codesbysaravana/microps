import React from 'react';
import type { BillingOverview } from '../../services/billingService';

interface CurrentSubscriptionCardProps {
  overview?: BillingOverview | null;
  onUpgradeClick?: () => void;
  onManagePortalClick?: () => void;
}

export const CurrentSubscriptionCard: React.FC<CurrentSubscriptionCardProps> = ({ overview, onUpgradeClick, onManagePortalClick }) => {
  const planName = overview?.plan?.name || 'Hobby Explorer';
  const planTier = overview?.plan?.tier || 'FREE';
  const buildMinsMetric = overview?.usage?.find(u => u.metricKey === 'build_minutes');
  const egressGbMetric = overview?.usage?.find(u => u.metricKey === 'egress_gb');

  const buildUsed = buildMinsMetric ? buildMinsMetric.used : 42;
  const buildLimit = buildMinsMetric ? buildMinsMetric.limit : 100;
  const buildPct = buildMinsMetric ? buildMinsMetric.percentage : 42;

  const egressUsed = egressGbMetric ? egressGbMetric.used : 18.4;
  const egressLimit = egressGbMetric ? egressGbMetric.limit : 50;
  const egressPct = egressGbMetric ? egressGbMetric.percentage : 36.8;

  return (
    <div className="mb-12 bg-[#131313] border border-[#2A2A2A] rounded-lg p-6 sm:p-8 relative overflow-hidden shadow-xl">
      {/* Subtle ambient highlight */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400 font-bold">
              Current Subscription Status
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse"></span>
              ACTIVE TIER ({planTier})
            </span>
          </div>
          <h2 className="font-headline-md text-2xl sm:text-3xl font-semibold text-[#F5F5F0]">
            {planName} <span className="text-sm font-mono text-neutral-500 font-normal ml-2">({overview?.organization?.name || 'Personal Organization'})</span>
          </h2>
          <p className="font-body-md text-xs sm:text-sm text-neutral-400">
            Billing Cycle: Monthly • Renewal Date: August 1, 2026 • Payment Method: {planTier === 'FREE' ? 'None Required' : 'Verified Stripe Billing'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          {planTier !== 'FREE' && onManagePortalClick && (
            <button
              type="button"
              onClick={onManagePortalClick}
              className="px-5 py-2.5 bg-[#2A2A2A] hover:bg-[#383838] text-[#F5F5F0] border border-[#3A3A3A] font-mono text-xs font-bold uppercase tracking-wider rounded transition-all active:scale-[0.99]"
            >
              Stripe Customer Portal
            </button>
          )}
          <button
            type="button"
            onClick={onUpgradeClick}
            className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#e2bd44] text-[#131313] font-mono text-xs font-bold uppercase tracking-wider rounded transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)] active:scale-[0.99]"
          >
            Upgrade Tier
          </button>
        </div>
      </div>

      {/* Usage Telemetry Bar */}
      <div className="mt-6 pt-6 border-t border-[#2A2A2A] grid grid-cols-1 sm:grid-cols-2 gap-6 font-mono text-xs">
        <div className="space-y-2">
          <div className="flex justify-between text-neutral-300">
            <span>Build Minutes Used</span>
            <span className="text-[#D4AF37] font-bold">{buildUsed} / {buildLimit} min</span>
          </div>
          <div className="w-full h-1.5 bg-[#1C1B1B] rounded-full overflow-hidden border border-[#2A2A2A]">
            <div className="h-full bg-[#D4AF37] transition-all duration-500" style={{ width: `${Math.min(100, buildPct)}%` }}></div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-neutral-300">
            <span>Egress Bandwidth</span>
            <span className="text-[#D4AF37] font-bold">{egressUsed} / {egressLimit} GB</span>
          </div>
          <div className="w-full h-1.5 bg-[#1C1B1B] rounded-full overflow-hidden border border-[#2A2A2A]">
            <div className="h-full bg-[#D4AF37] transition-all duration-500" style={{ width: `${Math.min(100, egressPct)}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};
