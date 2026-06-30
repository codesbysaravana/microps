import React from 'react';

export const BillingHeader: React.FC = () => {
  return (
    <div className="mb-12 max-w-3xl mx-auto text-center select-none shrink-0">
      <h1 className="font-headline-lg text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#F5F5F0] mb-3 sm:mb-4 tracking-tight">
        Transparent scaling for elite engineering.
      </h1>
      <p className="font-body-md text-xs sm:text-sm lg:text-base text-neutral-400 leading-relaxed max-w-2xl mx-auto">
        Pay only for what you compute. No hidden fees, no opaque bandwidth charges. Invisible complexity meets transparent billing.
      </p>
    </div>
  );
};
