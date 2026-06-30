import React from 'react';
import { Link } from 'react-router-dom';
import { LoginAtmosphere } from '../components/auth/LoginAtmosphere';
import { LoginHeader } from '../components/auth/LoginHeader';
import { LoginFormCard } from '../components/auth/LoginFormCard';

export const Login: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F0] flex flex-col justify-center items-center py-10 px-4 sm:px-6 relative overflow-x-hidden selection:bg-[#D4AF37] selection:text-[#050505] font-body-md">
      {/* Background Atmosphere & Telemetry HUD */}
      <LoginAtmosphere />

      {/* Main Login Shell */}
      <main className="relative z-10 w-full max-w-[440px] flex flex-col items-center my-auto">
        {/* Brand Logo & Tagline */}
        <LoginHeader />

        {/* Form Card */}
        <LoginFormCard />

        {/* Footer Links */}
        <div className="mt-8 flex flex-col items-center gap-3 select-none">
          <p className="font-body-md text-sm sm:text-base text-neutral-400">
            New to the platform?{' '}
            <Link to="/signup" className="text-[#D4AF37] font-bold hover:underline ml-1 font-mono">
              Sign up
            </Link>
          </p>
          <div className="flex items-center gap-3 mt-1 text-[11px] font-mono text-neutral-500">
            <a href="#privacy" className="hover:text-neutral-300 transition-colors">
              Privacy Policy
            </a>
            <span className="text-neutral-700">•</span>
            <a href="#terms" className="hover:text-neutral-300 transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};
