import React, { useEffect, useState } from 'react';
import { BillingHeader } from './BillingHeader';
import { CurrentSubscriptionCard } from './CurrentSubscriptionCard';
import { PricingPlansGrid } from './PricingPlansGrid';
import { BillingHistoryInvoices } from './BillingHistoryInvoices';
import { billingService } from '../../services/billingService';
import type { BillingOverview } from '../../services/billingService';

export const BillingSection: React.FC = () => {
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [_loading, setLoading] = useState<boolean>(true);

  const fetchOverview = async () => {
    try {
      const res = await billingService.getOverview();
      if (res) {
        setOverview(res);
      }
    } catch (err) {
      console.error('Failed to fetch billing overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleScrollToPro = () => {
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handleSelectTier = async (tier: string) => {
    try {
      setLoading(true);
      const res = await billingService.upgradePlan(tier);
      if (res) {
        setOverview(res);
        alert(`Successfully upgraded organization plan to ${tier}!`);
      }
    } catch (err: any) {
      alert(err.message || 'Error updating subscription tier.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-in fade-in duration-300 selection:bg-[#D4AF37] selection:text-[#131313]">
      {/* Visual Source of Truth Header */}
      <BillingHeader />

      {/* Authenticated Dashboard Context Card */}
      <CurrentSubscriptionCard overview={overview} onUpgradeClick={handleScrollToPro} />

      {/* Visual Source of Truth 3-Tier Grid with Interactive Telemetry Sliders */}
      <PricingPlansGrid onSelectTier={handleSelectTier} />

      {/* Payment Instruments & Audit Ledger Table */}
      <BillingHistoryInvoices invoices={overview?.invoices} />
    </div>
  );
};
