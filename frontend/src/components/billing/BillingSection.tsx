import React from 'react';
import { BillingHeader } from './BillingHeader';
import { CurrentSubscriptionCard } from './CurrentSubscriptionCard';
import { PricingPlansGrid } from './PricingPlansGrid';
import { BillingHistoryInvoices } from './BillingHistoryInvoices';

export const BillingSection: React.FC = () => {
  const handleScrollToPro = () => {
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-in fade-in duration-300 selection:bg-[#D4AF37] selection:text-[#131313]">
      {/* Visual Source of Truth Header */}
      <BillingHeader />

      {/* Authenticated Dashboard Context Card */}
      <CurrentSubscriptionCard onUpgradeClick={handleScrollToPro} />

      {/* Visual Source of Truth 3-Tier Grid with Interactive Telemetry Sliders */}
      <PricingPlansGrid />

      {/* Payment Instruments & Audit Ledger Table */}
      <BillingHistoryInvoices />
    </div>
  );
};
