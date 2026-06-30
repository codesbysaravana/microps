import React from 'react';

export const AuthFooter: React.FC = () => {
  return (
    <footer className="w-full border-t border-[#2A2A2A]/40 bg-[#131313] shrink-0 select-none">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 py-3 sm:py-4 xl:py-5 flex flex-col md:flex-row justify-between items-center gap-2 sm:gap-4 text-[11px] sm:text-xs font-mono text-neutral-500">
        <div className="flex items-center gap-2 text-center md:text-left">
          <span>© 2024 MicrOps. Surgical Precision in Cloud Deployment.</span>
        </div>
        <div className="flex flex-wrap justify-center gap-5 sm:gap-8">
          <a href="#privacy" className="hover:text-[#F5F5F0] transition-colors duration-200">
            Privacy Policy
          </a>
          <a href="#terms" className="hover:text-[#F5F5F0] transition-colors duration-200">
            Terms of Service
          </a>
          <a href="#security" className="hover:text-[#F5F5F0] transition-colors duration-200">
            Security
          </a>
          <a href="#status" className="hover:text-[#F5F5F0] transition-colors duration-200">
            Status
          </a>
        </div>
      </div>
    </footer>
  );
};
