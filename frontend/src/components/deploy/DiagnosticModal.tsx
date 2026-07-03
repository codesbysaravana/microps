import React from 'react';

interface DiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagnosticReport: any;
  buildLogs?: string[];
}

export const DiagnosticModal: React.FC<DiagnosticModalProps> = ({
  isOpen,
  onClose,
  diagnosticReport,
  buildLogs = [],
}) => {
  if (!isOpen || !diagnosticReport) return null;

  // Extract critical error lines from logs if available
  const errorSnippets = buildLogs.filter(
    (log) =>
      log.toLowerCase().includes('error') ||
      log.includes('TS') ||
      log.includes('ERR!') ||
      log.includes('exit code') ||
      log.includes('failed to solve')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-surface-elevated border border-error/50 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.25)] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-6 bg-error/10 border-b border-error/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-error/20 flex items-center justify-center text-error border border-error/40 shadow-inner">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-headline-md font-bold text-ivory">
                {diagnosticReport.failureTitle || 'Pipeline Execution Failure Audit'}
              </h3>
              <p className="text-xs font-mono text-error">
                Confidence Score: {diagnosticReport.probability || '95%'} • Rule ID: {diagnosticReport.ruleId || 'AI_DIAGNOSTIC'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-ivory rounded-lg hover:bg-surface transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Root Cause Box */}
          <div className="p-4 rounded-xl bg-surface border border-border/80">
            <h4 className="text-xs font-mono font-bold text-gold uppercase tracking-wider mb-2 flex items-center gap-2">
              <span>🎯 AI Detected Root Cause</span>
            </h4>
            <p className="text-sm font-sans text-ivory/90 leading-relaxed">
              {diagnosticReport.rootCause || 'The build pipeline encountered an unrecoverable compilation or dependency resolution exception.'}
            </p>
          </div>

          {/* Architectural Distinction Box */}
          <div className="p-4 rounded-xl bg-gold/5 border border-gold/30">
            <h4 className="text-xs font-mono font-bold text-gold uppercase tracking-wider mb-2 flex items-center gap-2">
              <span>⚡ Why Auto-Fix Layer vs Codebase Distinction</span>
            </h4>
            <p className="text-xs font-mono text-ivory/80 leading-relaxed space-y-2">
              <span className="block">
                • <strong className="text-gold">Configuration Remediation:</strong> The 1-Click Auto-Fix automatically heals pipeline buildpack commands, package manager flags (<code className="text-gold">--legacy-peer-deps</code>), and port bindings.
              </span>
              <span className="block">
                • <strong className="text-error">Source Code Exceptions:</strong> If the failure originates from TypeScript type checking (<code className="text-error">tsc -b</code>), syntax bugs, or missing imports inside your Git repository files (<code className="text-ivory">.tsx / .ts</code>), code commits must be pushed to GitHub to resolve compiler rejections.
              </span>
            </p>
          </div>

          {/* Extracted Error Log Console */}
          <div>
            <h4 className="text-xs font-mono font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Terminal Failure Trace</span>
              <span className="text-[10px] text-error">Showing Extracted Rejections</span>
            </h4>
            <div className="bg-obsidian rounded-xl p-4 border border-border/60 font-mono text-xs max-h-56 overflow-y-auto space-y-1.5 shadow-inner">
              {errorSnippets.length > 0 ? (
                errorSnippets.map((log, index) => (
                  <div key={index} className="text-error/90 break-all leading-relaxed hover:bg-error/10 px-2 py-0.5 rounded transition-colors">
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-text-secondary italic">
                  No explicit compiler trace captured. Review full build console logs below.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-surface border-t border-border/80 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-surface-elevated hover:bg-border text-ivory font-mono text-xs font-bold rounded-lg transition-colors border border-border"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
