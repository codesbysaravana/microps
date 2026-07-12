import React from 'react';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { LandingFooter } from '../components/landing/LandingFooter';

export const Policy: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-[#F5F5F0] flex flex-col font-body-md selection:bg-[#D4AF37] selection:text-[#0E0E0E]">
      <LandingNavbar />
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 sm:px-12 py-20">
        <div className="space-y-4 mb-12 border-b border-[#2A2A2A] pb-8">
          <h1 className="font-headline-lg text-4xl font-bold tracking-tight text-[#F5F5F0]">
            Privacy Policy & Terms of Service
          </h1>
          <p className="text-neutral-400 font-mono text-sm">
            Last Updated: July 2026
          </p>
        </div>

        <div className="space-y-12 text-neutral-300">
          <section className="space-y-4">
            <h2 className="text-2xl font-headline-lg font-bold text-white">1. Data Collection and Usage</h2>
            <p>
              MicrOps collects telemetry and deployment metadata to orchestrate infrastructure across your enterprise environments. 
              We strictly adhere to SOC2 compliance standards and do not inspect the source code contents of your BYOC (Bring Your Own Code) repositories beyond what is necessary to build the Docker image.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-headline-lg font-bold text-white">2. Platform Security</h2>
            <p>
              Security is our highest priority. All API traffic is routed through our global edge network and TLS-encrypted. 
              Enterprise customers benefit from isolated VPC deployments, ensuring zero cross-tenant contamination.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-headline-lg font-bold text-white">3. Acceptable Use Policy</h2>
            <p>
              Users are prohibited from deploying malicious workloads, cryptominers, or participating in network abuse (DDoS) via MicrOps managed infrastructure. 
              Violation of this policy will result in immediate suspension of your organization's workspace and billing account.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-headline-lg font-bold text-white">4. Subscriptions and Billing</h2>
            <p>
              MicrOps operates on a usage-based billing model in addition to a flat platform fee based on your subscription tier (Developer, Pro, Enterprise). 
              Usage metrics are strictly calculated based on vCPU-hours and egress bandwidth. 
              Invoices are issued monthly via Stripe.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-headline-lg font-bold text-white">5. Contact Information</h2>
            <p>
              For legal inquiries, DPA requests, or SOC2 audit reports, please contact our compliance team at 
              <a href="mailto:legal@microps.in" className="text-[#D4AF37] hover:underline ml-1">legal@microps.in</a>.
            </p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};
