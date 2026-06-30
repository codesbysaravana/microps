import React from 'react';
import { AuthHeader } from '../components/auth/AuthHeader';
import { SignupForm } from '../components/auth/SignupForm';
import { SignupVisualPanel } from '../components/auth/SignupVisualPanel';
import { AuthFooter } from '../components/auth/AuthFooter';

export const Signup: React.FC = () => {
  return (
    <div className="bg-[#131313] text-[#F5F5F0] font-body-md h-screen max-h-screen flex flex-col overflow-y-auto md:overflow-hidden selection:bg-[#D4AF37] selection:text-[#131313]">
      {/* Brand Header */}
      <AuthHeader />

      {/* Main 2-Column Split Content */}
      <main className="flex-1 flex flex-col md:flex-row max-w-[1440px] mx-auto w-full min-h-0 overflow-y-auto md:overflow-hidden">
        <SignupForm />
        <SignupVisualPanel />
      </main>

      {/* Page Footer */}
      <AuthFooter />
    </div>
  );
};
