import React from 'react';
import { Link } from 'react-router-dom';

export const LoginHeader: React.FC = () => {
  return (
    <div className="mb-8 sm:mb-10 text-center select-none shrink-0">
      <Link
        to="/"
        className="inline-block font-headline-lg text-4xl sm:text-5xl font-semibold text-[#F5F5F0] mb-2 tracking-tight hover:opacity-90 transition-opacity"
      >
        MicrOps
      </Link>
      <p className="font-mono text-[11px] sm:text-xs text-[#D4AF37] uppercase tracking-[0.2em] font-bold">
        Surgical Precision in Cloud Deployment
      </p>
    </div>
  );
};
