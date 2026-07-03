import React, { useEffect, useState } from 'react';
import { BillingHeader } from './BillingHeader';
import { CurrentSubscriptionCard } from './CurrentSubscriptionCard';
import { PricingPlansGrid } from './PricingPlansGrid';
import { BillingHistoryInvoices } from './BillingHistoryInvoices';
import { billingService } from '../../services/billingService';
import type { BillingOverview } from '../../services/billingService';
import { Toast } from '../ui/primitives';

export const BillingSection: React.FC = () => {
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [_loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
      setToastMessage('Initiating Stripe Checkout securely...');
      const res = await billingService.createCheckoutSession(tier);
      if (res && res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        // Fallback or immediate transition
        await fetchOverview();
        setToastMessage(`Successfully transitioned organization plan to ${tier}!`);
      }
    } catch (err: any) {
      setToastMessage(err.message || 'Error initializing Stripe Checkout session.');
    } finally {
      setLoading(false);
    }
  };

  const handleManagePortal = async () => {
    try {
      setLoading(true);
      setToastMessage('Redirecting to Stripe Customer Portal...');
      const res = await billingService.createPortalSession();
      if (res && res.portalUrl) {
        window.location.href = res.portalUrl;
      }
    } catch (err: any) {
      setToastMessage(err.message || 'Error opening Stripe Customer Portal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fadeIn selection:bg-gold selection:text-obsidian relative">
      {toastMessage && (
        <Toast message={toastMessage} type="info" onDismiss={() => setToastMessage(null)} />
      )}

      {/* Visual Source of Truth Header */}
      <BillingHeader />

      {/* Authenticated Dashboard Context Card */}
      <CurrentSubscriptionCard overview={overview} onUpgradeClick={handleScrollToPro} onManagePortalClick={handleManagePortal} />

      {/* Visual Source of Truth 3-Tier Grid with Interactive Telemetry Sliders */}
      <PricingPlansGrid onSelectTier={handleSelectTier} />

      {/* Payment Instruments & Audit Ledger Table */}
      <BillingHistoryInvoices invoices={overview?.invoices} />
    </div>
  );
};
