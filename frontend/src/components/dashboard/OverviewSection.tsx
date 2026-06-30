import React from 'react';

export interface OverviewSectionProps {
  onNewDeploy?: () => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({ onNewDeploy: _onNewDeploy }) => {
  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <h1 className="text-lg sm:text-xl font-normal text-text-secondary tracking-tight">
          Global infrastructure overview and active operations.
        </h1>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="w-24 sm:w-32 h-9 border border-border-subtle rounded-md bg-surface"></div>
          <button className="flex items-center gap-2 px-3.5 py-2 border border-border-subtle rounded-md bg-surface hover:bg-surface-elevated text-ivory text-xs font-medium transition-colors">
            <svg className="w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Top Grid: Uptime Chart & Active Deployments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Global Health Uptime */}
        <div className="lg:col-span-2 bg-surface border border-border-subtle rounded-xl p-6 sm:p-8 text-ivory flex flex-col justify-between relative overflow-hidden shadow-sm min-h-[340px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs uppercase tracking-wider text-text-muted font-medium">
                GLOBAL HEALTH UPTIME
              </span>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-surface-elevated border border-success/30 text-success font-mono text-xs">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>SLA Met</span>
              </div>
            </div>

            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-5xl sm:text-6xl font-semibold tracking-tight text-ivory font-headline-md">
                99.99
              </span>
              <span className="text-2xl sm:text-3xl font-semibold text-success font-mono">
                %
              </span>
            </div>
          </div>

          {/* Smooth SVG Wave Chart */}
          <div className="relative my-6 h-32 w-full flex items-end">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 600 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="waveGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34C759" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#34C759" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Fill area */}
              <path
                d="M0,90 C80,95 120,95 160,85 C210,72 240,45 280,45 C320,45 350,68 390,75 C430,82 460,25 510,18 C550,12 580,50 600,55 L600,120 L0,120 Z"
                fill="url(#waveGlow)"
              />
              {/* Glowing stroke */}
              <path
                d="M0,90 C80,95 120,95 160,85 C210,72 240,45 280,45 C320,45 350,68 390,75 C430,82 460,25 510,18 C550,12 580,50 600,55"
                fill="none"
                stroke="#34C759"
                strokeWidth="4"
                strokeLinecap="round"
                className="drop-shadow-[0_0_10px_rgba(52,199,89,0.5)]"
              />
              {/* Data points */}
              <circle cx="160" cy="85" r="5.5" fill="#34C759" className="drop-shadow-[0_0_6px_#34C759]" />
              <circle cx="280" cy="45" r="5.5" fill="#34C759" className="drop-shadow-[0_0_6px_#34C759]" />
              <circle cx="390" cy="75" r="5.5" fill="#34C759" className="drop-shadow-[0_0_6px_#34C759]" />
              <circle cx="510" cy="18" r="5.5" fill="#34C759" className="drop-shadow-[0_0_6px_#34C759]" />
              <circle cx="600" cy="55" r="5.5" fill="#34C759" className="drop-shadow-[0_0_6px_#34C759]" />
            </svg>
          </div>

          <div className="flex items-center justify-between font-mono text-xs text-text-muted pt-2 border-t border-border-subtle">
            <span>Last 30 Days</span>
            <span>Avg Resp: 42ms</span>
          </div>
        </div>

        {/* Right 1 Col: Active Deployments */}
        <div className="bg-surface border border-border-subtle rounded-xl p-6 text-ivory flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-subtle">
            <span className="font-mono text-xs uppercase tracking-wider text-text-muted font-medium">
              ACTIVE DEPLOYMENTS
            </span>
            <span className="bg-surface-elevated px-2 py-0.5 rounded text-xs font-mono text-ivory border border-border-subtle">
              3
            </span>
          </div>

          <div className="space-y-4 flex-grow flex flex-col justify-around">
            {/* Deployment 1 */}
            <div className="p-3.5 rounded-lg bg-surface-elevated border border-border-subtle space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs font-bold text-ivory">prod-eu-west-1</div>
                  <div className="font-mono text-[10px] text-text-muted">api-gateway:v3.2.1-rc</div>
                </div>
                <span className="font-mono text-[10px] text-success font-bold uppercase tracking-wider">
                  DEPLOYING
                </span>
              </div>
              {/* Stepper */}
              <div className="flex items-center justify-between px-2 pt-1 font-mono text-[9px] text-text-muted relative">
                <div className="absolute top-2.5 left-5 right-5 h-[1.5px] bg-border-subtle -z-0"></div>
                <div className="flex flex-col items-center gap-1 z-10">
                  <div className="w-3 h-3 rounded-full bg-success shadow-[0_0_6px_#34C759]"></div>
                  <span className="text-text-secondary">Build</span>
                </div>
                <div className="flex flex-col items-center gap-1 z-10">
                  <div className="w-3 h-3 rounded-full bg-success shadow-[0_0_6px_#34C759]"></div>
                  <span className="text-text-secondary">Test</span>
                </div>
                <div className="flex flex-col items-center gap-1 z-10">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-success bg-obsidian shadow-[0_0_10px_#34C759] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                  </div>
                  <span className="text-ivory font-bold">Deploy</span>
                </div>
                <div className="flex flex-col items-center gap-1 z-10">
                  <div className="w-3 h-3 rounded-full border border-border-subtle bg-obsidian"></div>
                  <span className="text-text-muted">Verify</span>
                </div>
              </div>
            </div>

            {/* Deployment 2 */}
            <div className="p-3.5 rounded-lg bg-surface-elevated border border-border-subtle space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs font-bold text-ivory">staging-k8s-cluster</div>
                  <div className="font-mono text-[10px] text-text-muted">auth-service:v1.9.0-beta</div>
                </div>
                <span className="font-mono text-[10px] text-info font-bold uppercase tracking-wider">
                  TESTING
                </span>
              </div>
              {/* Stepper */}
              <div className="flex items-center justify-between px-2 pt-1 font-mono text-[9px] text-text-muted relative">
                <div className="absolute top-2.5 left-5 right-5 h-[1.5px] bg-border-subtle -z-0"></div>
                <div className="flex flex-col items-center gap-1 z-10">
                  <div className="w-3 h-3 rounded-full bg-info shadow-[0_0_6px_#5E8BFF]"></div>
                  <span className="text-text-secondary">Build</span>
                </div>
                <div className="flex flex-col items-center gap-1 z-10">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-info bg-obsidian shadow-[0_0_10px_#5E8BFF] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-info"></div>
                  </div>
                  <span className="text-ivory font-bold">Test</span>
                </div>
                <div className="flex flex-col items-center gap-1 z-10">
                  <div className="w-3 h-3 rounded-full border border-border-subtle bg-obsidian"></div>
                  <span className="text-text-muted">Deploy</span>
                </div>
                <div className="flex flex-col items-center gap-1 z-10">
                  <div className="w-3 h-3 rounded-full border border-border-subtle bg-obsidian"></div>
                  <span className="text-text-muted">Verify</span>
                </div>
              </div>
            </div>

            {/* Deployment 3 */}
            <div className="p-3.5 rounded-lg bg-surface-elevated border border-error/40 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs font-bold text-ivory">dev-data-pipeline</div>
                  <div className="font-mono text-[10px] text-text-muted">worker-node:v2.1.0</div>
                </div>
                <span className="font-mono text-[10px] text-error font-bold uppercase tracking-wider">
                  FAILED
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-error pt-1">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>DOMKilled during Build phase</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Subtitle */}
      <div className="pt-4">
        <h2 className="text-sm font-medium text-text-secondary tracking-tight">
          Real-time metrics across all active regions.
        </h2>
      </div>

      {/* Bottom Grid: 3 Metric Cards + 1 AI Insight Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: CPU Load */}
        <div className="bg-surface border border-border-subtle rounded-xl p-5 text-ivory flex flex-col justify-between shadow-sm min-h-[220px]">
          <div className="flex items-center justify-between">
            <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 3v2m6-2v2M9 19v2m6-2v2M3 9h2m-2 6h2m14-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <span className="font-mono text-xs text-success font-medium">Healthy</span>
          </div>

          <div className="my-4">
            <div className="text-3xl sm:text-4xl font-semibold font-headline-md tracking-tight">42%</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted mt-1">
              GLOBAL CPU LOAD
            </div>
          </div>

          <div className="grid grid-cols-5 gap-1.5 pt-3 border-t border-border-subtle">
            <div className="h-2 rounded-sm bg-surface-elevated"></div>
            <div className="h-2 rounded-sm bg-surface-elevated"></div>
            <div className="h-2 rounded-sm bg-surface-elevated"></div>
            <div className="h-2 rounded-sm bg-surface-elevated"></div>
            <div className="h-2 rounded-sm bg-success shadow-[0_0_8px_#34C759]"></div>
          </div>
        </div>

        {/* Card 2: Memory Usage */}
        <div className="bg-surface border border-border-subtle rounded-xl p-5 text-ivory flex flex-col justify-between shadow-sm min-h-[220px]">
          <div className="flex items-center justify-between">
            <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span className="font-mono text-xs text-warning font-medium">Elevated</span>
          </div>

          <div className="my-4">
            <div className="text-3xl sm:text-4xl font-semibold font-headline-md tracking-tight">78%</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted mt-1">
              MEMORY USAGE
            </div>
          </div>

          <div className="grid grid-cols-5 gap-1.5 pt-3 border-t border-border-subtle">
            <div className="h-2 rounded-sm bg-surface-elevated"></div>
            <div className="h-2 rounded-sm bg-surface-elevated"></div>
            <div className="h-2 rounded-sm bg-surface-elevated"></div>
            <div className="h-2 rounded-sm bg-surface-elevated"></div>
            <div className="h-2 rounded-sm bg-warning shadow-[0_0_8px_#F4B740]"></div>
          </div>
        </div>

        {/* Card 3: Latency */}
        <div className="bg-surface border border-border-subtle rounded-xl p-5 text-ivory flex flex-col justify-between shadow-sm min-h-[220px]">
          <div className="flex items-center justify-between">
            <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="font-mono text-xs text-success font-medium">Healthy</span>
          </div>

          <div className="my-4">
            <div className="text-3xl sm:text-4xl font-semibold font-headline-md tracking-tight">12ms</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted mt-1">
              AVG LATENCY
            </div>
          </div>

          <div className="grid grid-cols-5 gap-1.5 pt-3 border-t border-border-subtle">
            <div className="h-2 rounded-sm bg-surface-elevated"></div>
            <div className="h-2 rounded-sm bg-surface-elevated"></div>
            <div className="h-2 rounded-sm bg-surface-elevated"></div>
            <div className="h-2 rounded-sm bg-surface-elevated"></div>
            <div className="h-2 rounded-sm bg-success shadow-[0_0_8px_#34C759]"></div>
          </div>
        </div>

        {/* Card 4: MicrOps AI Insight */}
        <div className="bg-surface-elevated border border-gold/40 rounded-xl p-5 text-ivory flex flex-col justify-between shadow-sm min-h-[220px]">
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-gold uppercase tracking-widest mb-2">
              <svg className="w-3.5 h-3.5 text-gold" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>MICROPS AI INSIGHT</span>
            </div>

            <h3 className="font-serif text-lg sm:text-xl font-semibold text-ivory mb-1.5 leading-snug">
              Cost Optimization Opportunity
            </h3>

            <p className="text-xs text-text-secondary leading-relaxed mb-4">
              Analysis indicates that <strong className="font-mono text-ivory">k8s-worker-pool-b</strong> is underutilized by 64% during off-peak hours (02:00 - 06:00 UTC).
            </p>
          </div>

          <div>
            <div className="bg-obsidian text-ivory rounded-lg p-3 text-xs font-mono space-y-1 mb-4 shadow-inner border border-border-subtle">
              <div className="flex justify-between text-text-secondary">
                <span>Current monthly run rate:</span>
                <span className="font-bold">$4,250</span>
              </div>
              <div className="flex justify-between text-success">
                <span>Projected after scaling tweak:</span>
                <span className="font-bold">$3,120</span>
              </div>
            </div>

            <button
              onClick={() => alert('Auto-scaling rules applied successfully to k8s-worker-pool-b.')}
              className="w-full py-2.5 px-3 bg-transparent hover:bg-gold/10 border border-gold/50 text-gold hover:text-gold-hover font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Apply Auto-Scaling Rules</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
