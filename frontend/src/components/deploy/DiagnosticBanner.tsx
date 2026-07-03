import React, { useState } from 'react';
import { DiagnosticModal } from './DiagnosticModal';

export interface DiagnosticBannerProps {
  diagnosticReport: any;
  applyingFix: boolean;
  handleApplyFixClick: () => void;
  buildLogs?: string[];
}

export const DiagnosticBanner: React.FC<DiagnosticBannerProps> = ({
  diagnosticReport,
  applyingFix,
  handleApplyFixClick,
  buildLogs = [],
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!diagnosticReport) return null;

  return (
    <>
      <div className="bg-surface-elevated border-b-2 border-error/60 p-5 shrink-0 animate-fadeIn">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="font-headline-md text-lg text-error font-bold flex items-center gap-2">
              <span>{diagnosticReport.failureTitle || '❌ Container build failure detected.'}</span>
            </h4>
            <p className="font-mono text-xs text-ivory mt-1">
              <strong className="text-gold">Root Cause:</strong> {diagnosticReport.rootCause}
            </p>
            <p className="font-mono text-[11px] text-text-secondary mt-0.5">
              Confidence: <span className="text-success font-bold">{diagnosticReport.probability}</span> | Rule: {diagnosticReport.ruleId}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-3 bg-surface hover:bg-border/60 text-ivory font-mono text-xs font-bold uppercase tracking-wider rounded-lg border border-error/40 shadow hover:border-error transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Inspect Exact Failure</span>
            </button>

            {diagnosticReport.fixAction && (
              <>
                <div className="text-right hidden xl:block">
                  <span className="text-[10px] font-mono text-gold uppercase block">Recommended Action</span>
                  <span className="font-mono text-xs text-ivory font-bold">{diagnosticReport.fixAction.label}</span>
                </div>
                <button
                  onClick={handleApplyFixClick}
                  disabled={applyingFix}
                  className="px-6 py-3 bg-gradient-to-r from-gold to-gold-hover text-obsidian font-mono text-xs font-bold uppercase tracking-wider rounded-lg shadow-[0_0_20px_rgba(201,152,45,0.4)] hover:brightness-110 flex items-center gap-2"
                >
                  {applyingFix ? (
                    <>
                      <span className="w-4 h-4 border-2 border-obsidian border-t-transparent rounded-full animate-spin"></span>
                      <span>Applying Fix...</span>
                    </>
                  ) : (
                    <span>⚡ Apply Fix</span>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <DiagnosticModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        diagnosticReport={diagnosticReport}
        buildLogs={buildLogs}
      />
    </>
  );
};
