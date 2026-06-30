import React from 'react';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { HeroSection } from '../components/landing/HeroSection';
import { VisualInfrastructure } from '../components/landing/VisualInfrastructure';
import { PlatformOverviewSection } from '../components/landing/PlatformOverviewSection';
import { WhyMicropsSection } from '../components/landing/WhyMicropsSection';
import { VisualPipelineSection } from '../components/landing/VisualPipelineSection';
import { TerminalScaleSection } from '../components/landing/TerminalScaleSection';
import { AiIntegrationsSection } from '../components/landing/AiIntegrationsSection';
import { EnterpriseLogosSection } from '../components/landing/EnterpriseLogosSection';
import { LandingPricingSection } from '../components/landing/LandingPricingSection';
import { LandingFaqSection } from '../components/landing/LandingFaqSection';
import { LandingFooter } from '../components/landing/LandingFooter';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-[#F5F5F0] flex flex-col font-body-md selection:bg-[#D4AF37] selection:text-[#0E0E0E] overflow-x-hidden">
      {/* Top Navigation - Clean Editorial Storytelling (No Dashboard Navigation / Sidebar) */}
      <LandingNavbar />

      {/* Hero Section */}
      <HeroSection />

      {/* Signature Golden Cloud Animation & Topology */}
      <VisualInfrastructure />

      {/* Architectural Platform Overview */}
      <PlatformOverviewSection />

      {/* Why Elite Teams Migrate to MicrOps */}
      <WhyMicropsSection />

      {/* Visual Pipeline Previews */}
      <VisualPipelineSection />

      {/* Terminal Automation: One Command, Infinite Scale */}
      <TerminalScaleSection />

      {/* Autonomous AI Engine & Cloud Integrations */}
      <AiIntegrationsSection />

      {/* Enterprise Security & Customer Logos */}
      <EnterpriseLogosSection />

      {/* Cinematic Pricing Teasers */}
      <LandingPricingSection />

      {/* Architectural FAQ Accordion */}
      <LandingFaqSection />

      {/* Full-Width Editorial Footer */}
      <LandingFooter />
    </div>
  );
};
