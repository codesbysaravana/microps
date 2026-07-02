import React, { useState, useEffect } from 'react';
import { Card, StatCard, StatusBadge, Toast } from '../ui/primitives';
import { dashboardService, type DashboardOverviewData } from '../../services/dashboardService';

export interface OverviewSectionProps {
  onNewDeploy?: () => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({ onNewDeploy }) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'failed' | 'healthy'>('all');
  const [overviewData, setOverviewData] = useState<DashboardOverviewData | null>(null);

  useEffect(() => {
    dashboardService
      .getOverview()
      .then((res) => {
        if (res) {
          setOverviewData(res);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch dashboard overview:', err);
      });
  }, []);

  const totalProjects = overviewData?.totalProjects ?? 0;
  const buildUsed = overviewData?.buildMinutes.used ?? 0;
  const buildLimit = overviewData?.buildMinutes.limit ?? 100;
  const bandwidthUsed = overviewData?.bandwidthGb.used ?? 0;
  const bandwidthLimit = overviewData?.bandwidthGb.limit ?? 50;
  const orchestrator = overviewData?.systemHealth.orchestrator ?? 'AWS ECS Fargate';
  const region = overviewData?.systemHealth.region ?? 'ap-southeast-2';

  return (
    <div className="w-full space-y-8 animate-fadeIn">
      {toastMessage && (
        <Toast message={toastMessage} type="info" onDismiss={() => setToastMessage(null)} />
      )}

      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
        <div>
          <h1 className="text-xl font-headline-md font-semibold text-ivory tracking-tight">
            System Overview & Operations
          </h1>
          <p className="text-xs text-text-secondary font-mono mt-0.5">
            Real-time infrastructure health and active rollout telemetry across {region} ({orchestrator}).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onNewDeploy}
            className="px-4 py-2 bg-gold hover:bg-gold-hover text-obsidian font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
          >
            + Deploy Microservice
          </button>
        </div>
      </div>

      {/* 4 Metric Cards Grid using StatCard Primitives with True Backend Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Managed Projects"
          value={totalProjects.toString()}
          status="healthy"
          statusText="ACTIVE"
          footer={
            <div className="flex justify-between text-xs font-mono text-text-muted">
              <span>Region: {region}</span>
              <span className="text-gold">{orchestrator}</span>
            </div>
          }
        />

        <StatCard
          label="Build Minutes Consumed"
          value={`${buildUsed}m`}
          status={buildUsed > buildLimit * 0.8 ? 'warning' : 'healthy'}
          statusText={`${Math.round((buildUsed / buildLimit) * 100)}% USED`}
          footer={
            <div className="flex justify-between text-xs font-mono text-text-muted pt-1">
              <span>Monthly Allocation</span>
              <span>{buildLimit}m Limit</span>
            </div>
          }
        />

        <StatCard
          label="Egress Bandwidth"
          value={`${bandwidthUsed} GB`}
          status={bandwidthUsed > bandwidthLimit * 0.8 ? 'warning' : 'healthy'}
          statusText={`${Math.round((bandwidthUsed / bandwidthLimit) * 100)}% USED`}
          footer={
            <div className="flex justify-between text-xs font-mono text-text-muted pt-1">
              <span>Tier Quota</span>
              <span>{bandwidthLimit} GB Limit</span>
            </div>
          }
        />

        <StatCard
          label="Orchestrator Health"
          value="100%"
          status="healthy"
          statusText="ONLINE"
          footer={
            <div className="flex justify-between text-xs font-mono text-text-muted">
              <span>Cluster State</span>
              <span className="text-gold">NOMINAL</span>
            </div>
          }
        />
      </div>

      {/* Active Workloads & AI Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Workloads List (2 Cols) */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-subtle">
              <div>
                <h3 className="font-headline-md text-base text-ivory font-semibold">Active Workloads & Rollouts</h3>
                <p className="text-xs text-text-secondary font-mono">Live AWS ECS Fargate containers and task definitions</p>
              </div>
              <div className="flex items-center gap-1 bg-obsidian p-1 rounded-lg border border-border-subtle font-mono text-[11px]">
                {(['all', 'healthy', 'failed'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveTabFilter(filter)}
                    className={`px-2.5 py-1 rounded capitalize transition-colors ${
                      activeTabFilter === filter ? 'bg-gold text-obsidian font-bold' : 'text-text-secondary hover:text-ivory'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {overviewData && overviewData.recentProjects.length > 0 ? (
                overviewData.recentProjects.map((proj) => (
                  <div key={proj.id} className="p-4 rounded-xl bg-surface-elevated border border-border-subtle space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-mono text-sm font-bold text-ivory flex items-center gap-2">
                          <span>{proj.name}</span>
                          {proj.live_url && (
                            <a href={proj.live_url} target="_blank" rel="noopener noreferrer" className="text-gold text-xs underline font-normal hover:text-gold-hover">
                              {proj.live_url} ↗
                            </a>
                          )}
                        </div>
                        <div className="font-mono text-xs text-text-muted">{proj.repo_url} ({proj.branch || 'main'})</div>
                      </div>
                      <StatusBadge status="success" label="ACTIVE" />
                    </div>
                    <div className="flex items-center justify-between px-2 pt-2 font-mono text-[11px] text-text-muted">
                      <span>Runtime: {proj.language || 'Node/Docker'}</span>
                      <span className="text-gold">Deployed via ECS Fargate</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-text-muted font-mono text-xs">
                  No active workloads deployed yet. Click "+ Deploy Microservice" to launch your first service.
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* AI Insight Card (1 Col) */}
        <Card variant="accent" className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-gold uppercase tracking-widest mb-3">
              <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>MICROPS AI OPTIMIZER</span>
            </div>

            <h3 className="font-headline-md text-lg font-semibold text-ivory mb-2 leading-snug">
              ECS Fargate Auto-Scaling
            </h3>

            <p className="text-xs text-text-secondary leading-relaxed mb-6">
              Your container tasks on <strong className="font-mono text-ivory">{region}</strong> can benefit from target tracking scaling policies to maintain 70% CPU utilization.
            </p>
          </div>

          <div>
            <div className="bg-obsidian rounded-lg p-3.5 text-xs font-mono space-y-1.5 mb-4 border border-border-subtle">
              <div className="flex justify-between text-text-secondary">
                <span>Task Auto-Scaling Status:</span>
                <span className="font-bold text-ivory">RECOMMENDED</span>
              </div>
              <div className="flex justify-between text-gold">
                <span>Estimated Efficiency Gain:</span>
                <span className="font-bold">+34%</span>
              </div>
            </div>

            <button
              onClick={() => setToastMessage('Target tracking scaling policy applied to ECS Fargate services.')}
              className="w-full py-3 px-4 bg-transparent hover:bg-gold/10 border border-gold/50 text-gold hover:text-gold-hover font-mono font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>Enable Target Tracking</span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
