import React from 'react';

export const LoginAtmosphere: React.FC = () => {
  return (
    <>
      {/* Decorative Top Gradient Line */}
      <div className="fixed top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent z-20 pointer-events-none"></div>

      {/* Subtle Radial Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-radial from-[#D4AF37]/[0.06] to-transparent rounded-full blur-3xl"></div>
      </div>

      {/* Floating Atmosphere Telemetry Elements (Bottom Left HUD) */}
      <div className="fixed bottom-8 left-10 z-0 opacity-40 pointer-events-none hidden md:block select-none">
        <div className="font-mono text-xs text-[#D4AF37] space-y-1.5 tracking-wider">
          <p>LOC_SYST: [STABLE]</p>
          <p>LAT_ENTR: 0.042ms</p>
          <p>ENC_TYPE: AES-GCM-256</p>
        </div>
      </div>
    </>
  );
};
