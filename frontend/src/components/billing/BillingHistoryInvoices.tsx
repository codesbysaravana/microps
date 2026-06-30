import React from 'react';
import type { Invoice } from '../../services/billingService';

interface BillingHistoryInvoicesProps {
  invoices?: Invoice[];
}

export const BillingHistoryInvoices: React.FC<BillingHistoryInvoicesProps> = ({ invoices }) => {
  const displayInvoices = (invoices && invoices.length > 0)
    ? invoices.map(inv => ({
        id: inv.invoice_number,
        date: new Date(inv.created_at).toLocaleDateString() || inv.billing_period,
        amount: `$${(inv.amount_paid_cents / 100).toFixed(2)}`,
        status: inv.status,
        tier: `${inv.billing_period} Allocation`,
      }))
    : [
        { id: 'INV-2026-007', date: 'July 1, 2026', amount: '$0.00', status: 'Paid', tier: 'Hobby Tier Allocation' },
        { id: 'INV-2026-006', date: 'June 1, 2026', amount: '$0.00', status: 'Paid', tier: 'Hobby Tier Allocation' },
        { id: 'INV-2026-005', date: 'May 1, 2026', amount: '$0.00', status: 'Paid', tier: 'Hobby Tier Allocation' },
      ];

  return (
    <div className="space-y-12 max-w-6xl mx-auto mb-16">
      {/* Grid: Payment Method & Support CTA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Payment Instrument */}
        <div className="bg-[#131313] border border-[#2A2A2A] rounded-lg p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <h3 className="font-headline-md text-xl font-semibold text-[#F5F5F0] mb-2">
              Payment Instruments
            </h3>
            <p className="font-body-md text-xs sm:text-sm text-neutral-400 mb-6">
              Manage credit cards, ACH billing setups, and automated invoice delivery.
            </p>

            <div className="bg-[#1C1B1B] border border-[#2A2A2A] rounded p-4 flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-6 bg-[#2A2A2A] rounded flex items-center justify-center font-bold text-neutral-300 text-[10px]">
                  FREE
                </div>
                <div>
                  <div className="text-[#F5F5F0] font-medium">No Active Payment Card Required</div>
                  <div className="text-neutral-500 text-[11px]">Add credit card when upgrading above Hobby limit</div>
                </div>
              </div>
              <span className="text-emerald-400 font-bold text-[11px]">VERIFIED</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => alert('Secure Stripe billing portal session initialized.')}
            className="w-full sm:w-auto self-start mt-6 px-4 py-2 bg-transparent border border-[#2A2A2A] hover:border-[#D4AF37] text-neutral-300 hover:text-[#D4AF37] font-mono text-xs uppercase tracking-wider rounded transition-all"
          >
            + Add Payment Method
          </button>
        </div>

        {/* Enterprise Architecture Support CTA */}
        <div className="bg-[#131313] border border-[#2A2A2A] rounded-lg p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-[#D4AF37]/5 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#D4AF37]/15 text-[#D4AF37] mb-3">
              ENTERPRISE ORCHESTRATION
            </div>
            <h3 className="font-headline-md text-xl font-semibold text-[#F5F5F0] mb-2">
              Need custom multi-cloud topology?
            </h3>
            <p className="font-body-md text-xs sm:text-sm text-neutral-400 mb-6">
              Our infrastructure architects design dedicated Kubernetes clusters, VPC peering bridges, and custom billing terms.
            </p>
          </div>

          <button
            type="button"
            onClick={() => alert('Opening direct priority channel with MicrOps Solutions Architect.')}
            className="w-full sm:w-auto self-start mt-6 px-5 py-2.5 bg-[#D4AF37] hover:bg-[#e2bd44] text-[#131313] font-mono text-xs font-bold uppercase tracking-wider rounded transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)]"
          >
            Schedule Architecture Review
          </button>
        </div>
      </div>

      {/* Invoice Ledger Table */}
      <div className="bg-[#131313] border border-[#2A2A2A] rounded-lg overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-[#2A2A2A] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-headline-md text-xl font-semibold text-[#F5F5F0]">
              Billing Ledger & Invoices
            </h3>
            <p className="font-body-md text-xs sm:text-sm text-neutral-400">
              Complete audit history of monthly platform allocations and charges.
            </p>
          </div>
          <button
            type="button"
            onClick={() => alert('Exporting complete CSV billing ledger archive.')}
            className="px-3.5 py-1.5 border border-[#2A2A2A] rounded font-mono text-xs text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors"
          >
            Download CSV Ledger
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="bg-[#1C1B1B] text-neutral-400 uppercase tracking-wider border-b border-[#2A2A2A]">
                <th className="py-3.5 px-6 font-semibold">Invoice ID</th>
                <th className="py-3.5 px-6 font-semibold">Billing Date</th>
                <th className="py-3.5 px-6 font-semibold">Description</th>
                <th className="py-3.5 px-6 font-semibold">Total Amount</th>
                <th className="py-3.5 px-6 font-semibold">Status</th>
                <th className="py-3.5 px-6 font-semibold text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]/60 text-neutral-300">
              {displayInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#1C1B1B]/50 transition-colors">
                  <td className="py-4 px-6 font-bold text-[#F5F5F0]">{inv.id}</td>
                  <td className="py-4 px-6 text-neutral-400">{inv.date}</td>
                  <td className="py-4 px-6">{inv.tier}</td>
                  <td className="py-4 px-6 font-bold text-[#F5F5F0]">{inv.amount}</td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      type="button"
                      onClick={() => alert(`Downloading PDF receipt for ${inv.id}`)}
                      className="text-[#D4AF37] hover:underline font-semibold"
                    >
                      PDF Receipt ↓
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
