import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { preflightService } from '../services/preflightService';
import type { PreflightReport } from '../services/preflightService';
import { buildService } from '../services/buildService';
import { BASE_URL } from '../lib/api';
import { ProjectsSection } from '../components/ProjectsSection';
import { BillingSection } from '../components/billing/BillingSection';
import { OverviewSection } from '../components/dashboard/OverviewSection';
import { DeploymentControlCenter } from '../components/dashboard/DeploymentControlCenter';
import { SettingsSection } from '../components/settings/SettingsSection';
import { Toast } from '../components/ui/primitives';
import { useNavigate } from 'react-router-dom';

type TabType = 'overview' | 'projects' | 'deploy' | 'billing' | 'settings';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<PreflightReport | null>(null);
  const [error, setError] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [diagnosticReport, setDiagnosticReport] = useState<any>(null);
  const [applyingFix, setApplyingFix] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setToastMessage(`Filtered telemetry for "${searchQuery}". 0 anomalies found.`);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl) return;

    setLoading(true);
    setError('');
    setReport(null);
    setIsDeploying(false);
    setBuildLogs([]);
    setDiagnosticReport(null);

    try {
      const response = await preflightService.analyze(repoUrl);
      setReport(response);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze repository');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFixClick = async () => {
    if (!diagnosticReport?.fixAction || !activeProjectId) return;
    setApplyingFix(true);
    setBuildLogs((prev) => [...prev, '\n⚡ Applying Autonomous One-Click Fix to repository config...']);
    try {
      const res = await fetch(`${BASE_URL}/build/apply-fix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useAuthStore.getState().token}`,
        },
        body: JSON.stringify({
          projectId: activeProjectId,
          actionType: diagnosticReport.fixAction.actionType,
          payload: diagnosticReport.fixAction.payload,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBuildLogs((prev) => [...prev, `✓ Fix successfully applied! Automated pipeline re-initialized (New Job ID: ${data.build?.jobId || 'N/A'})`]);
        setDiagnosticReport(null);
      } else {
        setBuildLogs((prev) => [...prev, `❌ Fix remediation failed: ${data.message}`]);
      }
    } catch (err: any) {
      setBuildLogs((prev) => [...prev, `❌ Fix execution error: ${err.message}`]);
    } finally {
      setApplyingFix(false);
    }
  };

  const handleDeploy = async (options?: { branch?: string; buildCommand?: string; installCommand?: string; runtime?: string; envContent?: string }) => {
    if (!report) return;
    setIsDeploying(true);
    setBuildLogs(['Starting deployment sequence...']);
    setDiagnosticReport(null);

    try {
      const deployResponse = await buildService.deploy({
        repoUrl,
        branch: options?.branch || 'main',
        buildCommand: options?.buildCommand || 'npm run build',
        installCommand: options?.installCommand,
        runtime: options?.runtime,
        envContent: options?.envContent,
        projectName: repoUrl.split('/').pop() || 'app',
      });

      setActiveProjectId((deployResponse as any).projectId || null);
      setBuildLogs((prev) => [...prev, `Pipeline initialized. Job ID: ${deployResponse.jobId}`]);

      const token = useAuthStore.getState().token;
      const eventSource = new EventSource(`${BASE_URL}/build/stream?token=${token}`);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'DIAGNOSTIC_REPORT') {
          setDiagnosticReport(data);
        }
        if (data.message) {
          setBuildLogs((prev) => [...prev, data.message]);
        }
      };

      eventSource.onerror = () => {
        setBuildLogs((prev) => [...prev, 'Live log stream disconnected.']);
        eventSource.close();
      };
    } catch (err: any) {
      setBuildLogs((prev) => [...prev, `Deployment failed: ${err.message}`]);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-ivory selection:bg-gold selection:text-obsidian font-body-md flex">
      {toastMessage && (
        <Toast message={toastMessage} type="info" onDismiss={() => setToastMessage(null)} />
      )}

      {/* Fixed Left Sidebar */}
      <aside className="w-64 bg-obsidian border-r border-border-subtle fixed inset-y-0 left-0 z-50 flex flex-col justify-between p-6 select-none">
        <div>
          {/* Logo Brand */}
          <div
            onClick={() => { setActiveTab('overview'); navigate('/'); }}
            className="cursor-pointer mb-8 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-gold flex items-center justify-center text-obsidian font-bold shadow-[0_0_15px_rgba(201,152,45,0.2)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="font-headline-md text-xl font-bold text-ivory tracking-tight leading-none">MicrOps</div>
              <div className="font-mono text-[10px] text-text-muted mt-1">v2.4.0-stable</div>
            </div>
          </div>

          {/* Primary Action: + New Deploy */}
          <button
            onClick={() => setActiveTab('deploy')}
            className="w-full py-2.5 px-4 bg-gold hover:bg-gold-hover text-obsidian font-mono font-bold text-xs rounded-md shadow-sm mb-6 flex items-center justify-center gap-2 transition-colors uppercase tracking-wider"
          >
            <span className="text-sm font-bold leading-none">+</span>
            <span>New Deploy</span>
          </button>

          {/* Clean 5-Item Navigation */}
          <nav className="space-y-1 font-mono text-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
                activeTab === 'overview'
                  ? 'bg-surface border border-gold/30 text-gold font-medium'
                  : 'text-text-secondary hover:text-ivory hover:bg-surface'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('projects')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
                activeTab === 'projects'
                  ? 'bg-surface border border-gold/30 text-gold font-medium'
                  : 'text-text-secondary hover:text-ivory hover:bg-surface'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span>Projects</span>
            </button>

            <button
              onClick={() => setActiveTab('deploy')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
                activeTab === 'deploy'
                  ? 'bg-surface border border-gold/30 text-gold font-medium'
                  : 'text-text-secondary hover:text-ivory hover:bg-surface'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>Deployments</span>
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
                activeTab === 'billing'
                  ? 'bg-surface border border-gold/30 text-gold font-medium'
                  : 'text-text-secondary hover:text-ivory hover:bg-surface'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span>Billing</span>
            </button>
          </nav>
        </div>

        {/* Bottom Nav */}
        <div className="pt-4 border-t border-border-subtle space-y-1 font-mono text-xs">
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
              activeTab === 'settings'
                ? 'bg-surface border border-gold/30 text-gold font-medium'
                : 'text-text-secondary hover:text-ivory hover:bg-surface'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Container Shell */}
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="h-16 bg-surface border-b border-border-subtle px-8 flex items-center justify-between sticky top-0 z-40 select-none">
          {/* Interactive Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative w-72">
            <svg className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search resources... (Enter)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-obsidian border border-border-subtle rounded-md pl-9 pr-4 py-1.5 text-xs text-ivory placeholder:text-text-muted focus:border-gold focus:outline-none font-mono transition-colors"
            />
          </form>

          {/* Right Action Bar */}
          <div className="flex items-center gap-6 font-mono text-xs text-text-secondary">
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-surface-elevated border border-border-subtle text-[11px]">
              <span className="w-2 h-2 rounded-full bg-success"></span>
              <span>AWS ECS Fargate: Active</span>
            </div>

            {/* Profile Avatar */}
            <div
              onClick={handleLogout}
              title={`Logged in as ${user?.name || 'Operator'} (Click to Logout)`}
              className="w-8 h-8 rounded-full border border-border-subtle bg-surface-tertiary flex items-center justify-center text-ivory font-bold cursor-pointer hover:border-gold transition-colors"
            >
              <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 bg-obsidian p-6 sm:p-8 text-ivory overflow-y-auto">
          {activeTab === 'overview' && (
            <OverviewSection onNewDeploy={() => setActiveTab('deploy')} />
          )}

          {activeTab === 'projects' && (
            <ProjectsSection onNewProject={() => setActiveTab('deploy')} />
          )}

          {activeTab === 'deploy' && (
            <DeploymentControlCenter
              repoUrl={repoUrl}
              setRepoUrl={setRepoUrl}
              loading={loading}
              report={report}
              error={error}
              isDeploying={isDeploying}
              buildLogs={buildLogs}
              diagnosticReport={diagnosticReport}
              applyingFix={applyingFix}
              handleAnalyze={handleAnalyze}
              handleDeploy={handleDeploy}
              handleApplyFixClick={handleApplyFixClick}
            />
          )}

          {activeTab === 'billing' && (
            <BillingSection />
          )}

          {activeTab === 'settings' && (
            <SettingsSection />
          )}
        </main>
      </div>
    </div>
  );
};
