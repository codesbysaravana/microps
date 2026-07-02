import React, { useState, useEffect } from 'react';
import type { PreflightReport } from '../../services/preflightService';
import { DeployHeader } from '../deploy/DeployHeader';
import { RepoInput } from '../deploy/RepoInput';
import { PreflightResults } from '../deploy/PreflightResults';
import { ConfigPanel } from '../deploy/ConfigPanel';
import { DiagnosticBanner } from '../deploy/DiagnosticBanner';
import { PipelineView } from '../deploy/PipelineView';
import { LogConsole } from '../deploy/LogConsole';
import { InfraTimeline } from '../deploy/InfraTimeline';
import { HealthSummary } from '../deploy/HealthSummary';

interface DeploymentControlCenterProps {
  repoUrl: string;
  setRepoUrl: (url: string) => void;
  loading: boolean;
  report: PreflightReport | null;
  error: string;
  isDeploying: boolean;
  buildLogs: string[];
  diagnosticReport: any;
  applyingFix: boolean;
  handleAnalyze: (e: React.FormEvent) => void;
  handleDeploy: (options?: { branch?: string; buildCommand?: string; installCommand?: string; runtime?: string }) => void;
  handleApplyFixClick: () => void;
}

export const DeploymentControlCenter: React.FC<DeploymentControlCenterProps> = ({
  repoUrl,
  setRepoUrl,
  loading,
  report,
  error,
  isDeploying,
  buildLogs,
  diagnosticReport,
  applyingFix,
  handleAnalyze,
  handleDeploy,
  handleApplyFixClick,
}) => {
  // Mode: 'config' vs 'execution'
  const [viewMode, setViewMode] = useState<'config' | 'execution'>(
    isDeploying || buildLogs.length > 0 || diagnosticReport ? 'execution' : 'config'
  );

  // Sync viewMode when deployment starts or logs appear
  useEffect(() => {
    if (isDeploying || buildLogs.length > 0 || diagnosticReport) {
      setViewMode('execution');
    }
  }, [isDeploying, buildLogs, diagnosticReport]);

  const onExecuteDeploy = (options?: { branch?: string; buildCommand?: string; installCommand?: string; runtime?: string }) => {
    setViewMode('execution');
    handleDeploy(options);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <DeployHeader
        repoUrl={repoUrl}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isDeploying={isDeploying}
        diagnosticReport={diagnosticReport}
      />

      {viewMode === 'config' ? (
        <div className="space-y-8">
          <RepoInput
            repoUrl={repoUrl}
            setRepoUrl={setRepoUrl}
            loading={loading}
            error={error}
            handleAnalyze={handleAnalyze}
          />

          {report && <PreflightResults report={report} />}

          <ConfigPanel
            onDeploy={onExecuteDeploy}
            isDeploying={isDeploying}
            repoUrl={repoUrl}
          />
        </div>
      ) : (
        <div className="space-y-8">
          <DiagnosticBanner
            diagnosticReport={diagnosticReport}
            applyingFix={applyingFix}
            handleApplyFixClick={handleApplyFixClick}
          />

          <PipelineView
            isDeploying={isDeploying}
            diagnosticReport={diagnosticReport}
          />

          <LogConsole buildLogs={buildLogs} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InfraTimeline />
            <HealthSummary />
          </div>
        </div>
      )}
    </div>
  );
};
