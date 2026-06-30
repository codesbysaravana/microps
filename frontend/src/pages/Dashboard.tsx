import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { preflightService } from '../services/preflightService';
import type { PreflightReport } from '../services/preflightService';
import { buildService } from '../services/buildService';
import { ProjectsSection } from '../components/ProjectsSection';
import { BillingSection } from '../components/billing/BillingSection';
import { OverviewSection } from '../components/dashboard/OverviewSection';
import { useNavigate } from 'react-router-dom';

type TabType = 'overview' | 'projects' | 'deploy' | 'infrastructure' | 'ai' | 'billing' | 'settings' | 'support';

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl) return;

    setLoading(true);
    setError('');
    setReport(null);
    setIsDeploying(false);
    setBuildLogs([]);

    try {
      const response = await preflightService.analyze(repoUrl);
      setReport(response);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze repository');
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (!report) return;
    setIsDeploying(true);
    setBuildLogs(['Starting deployment sequence...']);

    try {
      const deployResponse = await buildService.deploy({
        repoUrl,
        branch: 'main',
        buildCommand: 'npm run build',
        projectName: repoUrl.split('/').pop() || 'app',
      });

      setBuildLogs((prev) => [...prev, `Pipeline initialized. Job ID: ${deployResponse.jobId}`]);

      const token = useAuthStore.getState().token;
      const eventSource = new EventSource(`http://localhost:8000/api/v1/build/stream?token=${token}`);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
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

          {/* Big Primary Button: + New Deploy */}
          <button
            onClick={() => setActiveTab('deploy')}
            className="w-full py-2.5 px-4 bg-gold hover:bg-gold-hover text-obsidian font-medium text-xs rounded-md shadow-sm mb-6 flex items-center justify-center gap-2 transition-colors"
          >
            <span className="text-sm font-bold leading-none">+</span>
            <span>New Deploy</span>
          </button>

          {/* Primary Nav */}
          <nav className="space-y-1 font-mono text-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${activeTab === 'overview'
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${activeTab === 'projects'
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${activeTab === 'deploy'
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
              onClick={() => setActiveTab('infrastructure')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${activeTab === 'infrastructure'
                  ? 'bg-surface border border-gold/30 text-gold font-medium'
                  : 'text-text-secondary hover:text-ivory hover:bg-surface'
                }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span>Infrastructure</span>
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${activeTab === 'ai'
                  ? 'bg-surface border border-gold/30 text-gold font-medium'
                  : 'text-text-secondary hover:text-ivory hover:bg-surface'
                }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>AI</span>
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${activeTab === 'billing'
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
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${activeTab === 'settings'
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

          <button
            onClick={() => setActiveTab('support')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${activeTab === 'support'
                ? 'bg-surface border border-gold/30 text-gold font-medium'
                : 'text-text-secondary hover:text-ivory hover:bg-surface'
              }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Support</span>
          </button>
        </div>
      </aside>

      {/* Main Container Shell */}
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="h-16 bg-surface border-b border-border-subtle px-8 flex items-center justify-between sticky top-0 z-40 select-none">
          {/* Search Box */}
          <div className="relative w-72">
            <svg className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search resources..."
              className="w-full bg-obsidian border border-border-subtle rounded-md pl-9 pr-4 py-1.5 text-xs text-ivory placeholder:text-text-muted focus:border-gold focus:outline-none font-mono"
            />
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-6 font-mono text-xs text-text-secondary">
            {/*             <button className="hover:text-ivory transition-colors">Cluster Info</button>
            <button className="hover:text-ivory transition-colors">Audit Logs</button>
 */}
            {/* Health Pill */}
            {/*             <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated border border-success/30 text-success font-medium">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
              <span>System Healthy</span>
            </div>
 */}
            {/* Notification Bell */}
            {/*             <button className="relative p-1 text-text-secondary hover:text-ivory transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
 */}
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

          {(activeTab === 'billing' || activeTab === 'settings') && (
            <BillingSection />
          )}

          {(activeTab === 'deploy' || activeTab === 'infrastructure' || activeTab === 'ai' || activeTab === 'support') && (
            <div className="max-w-5xl mx-auto space-y-8 py-4">
              <div className="bg-surface text-ivory border border-border-subtle rounded-xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-headline-md text-2xl text-ivory font-semibold">Deploy a new microservice</h2>
                  <span className="px-2.5 py-1 rounded bg-surface-elevated border border-gold/30 text-gold font-mono text-xs">Automated Preflight</span>
                </div>
                <p className="font-body-md text-sm text-text-secondary mb-6">Paste a GitHub repository URL to run automated Pre-Flight Intelligence & Cost Oracle check.</p>

                <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-3 font-mono text-xs">
                  <input
                    type="url"
                    placeholder="https://github.com/codesbysaravana/microps-service"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    disabled={loading}
                    className="flex-1 bg-obsidian border border-border-subtle focus:border-gold rounded-lg px-4 py-3.5 text-ivory placeholder:text-text-muted focus:outline-none transition-colors text-sm"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3.5 bg-gold hover:bg-gold-hover text-obsidian font-bold uppercase tracking-wider rounded-lg transition-all disabled:opacity-50 shrink-0 shadow-[0_0_15px_rgba(201,152,45,0.2)] text-xs"
                    disabled={loading || !repoUrl}
                  >
                    {loading ? 'Analyzing...' : 'Run Pre-Flight'}
                  </button>
                </form>
                {error && (
                  <div className="mt-4 p-3 rounded bg-error/10 border border-error/40 text-error font-mono text-xs">
                    {error}
                  </div>
                )}
              </div>

              {loading && (
                <div className="bg-surface border border-border-subtle rounded-xl p-12 text-center font-mono text-sm text-gold animate-pulse">
                  <p>Scanning Repository Topology & Running Cost Oracle...</p>
                </div>
              )}

              {report && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-surface border border-border-subtle rounded-xl p-6 text-ivory">
                    <h3 className="font-headline-md text-lg text-ivory mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gold"></span>
                      <span>Architecture Radar</span>
                    </h3>
                    <div className="font-mono text-xs space-y-2.5 text-text-secondary bg-surface-elevated p-4 rounded-lg border border-border-subtle">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Runtime Detected:</span>
                        <strong className="text-gold">{report.radar.runtime}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Framework:</span>
                        <strong className="text-ivory">{report.radar.framework}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Detected Port:</span>
                        <strong>{report.radar.port}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface border border-border-subtle rounded-xl p-6 text-ivory flex flex-col justify-between">
                    <div>
                      <h3 className="font-headline-md text-lg text-ivory mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-info"></span>
                        <span>Cost Oracle Forecast</span>
                      </h3>
                      <div className="font-mono text-xs space-y-2.5 text-text-secondary bg-surface-elevated p-4 rounded-lg border border-border-subtle">
                        <div className="flex justify-between">
                          <span className="text-text-muted">Total Monthly Forecast:</span>
                          <strong className="text-success font-bold">${report.costOracle.totalMonthly}/mo</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Recommended Spec:</span>
                          <strong className="text-ivory">{report.costOracle.computeSpec}</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleDeploy}
                      disabled={isDeploying}
                      className="mt-6 w-full py-3.5 bg-gold hover:bg-gold-hover text-obsidian font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(201,152,45,0.2)]"
                    >
                      {isDeploying ? 'Pipeline Active...' : 'Execute Deployment Sequence'}
                    </button>
                  </div>
                </div>
              )}

              {buildLogs.length > 0 && (
                <div className="bg-surface border border-border-subtle rounded-xl p-6 font-mono text-xs text-ivory">
                  <h4 className="text-text-secondary mb-3 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                    <span>Live Pipeline Telemetry</span>
                  </h4>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto text-success bg-surface-elevated p-4 rounded-lg border border-border-subtle">
                    {buildLogs.map((log, index) => (
                      <div key={index}>&gt; {log}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
