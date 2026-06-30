import React from 'react';
import { Link } from 'react-router-dom';

export const AuthHeader: React.FC = () => {
  return (
    <header className="w-full flex justify-between items-center max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 py-3.5 sm:py-4 xl:py-6 border-b border-[#2A2A2A]/40 select-none shrink-0">
      <Link to="/" className="font-headline-md text-xl sm:text-2xl font-semibold text-[#D4AF37] tracking-tight hover:opacity-90 transition-opacity">
        MicrOps
      </Link>
      <Link
        to="/login"
        className="font-mono text-xs sm:text-sm text-neutral-400 hover:text-[#D4AF37] transition-colors duration-200"
      >
        Sign in
      </Link>
    </header>
  );
};
