import React, { useEffect, useState } from 'react';
import { projectService, type Project } from '../services/projectService';
import { useAuthStore } from '../store/useAuthStore';
import { BASE_URL } from '../lib/api';
import { Toast, EmptyState, ConfirmModal } from './ui/primitives';

export interface ProjectsSectionProps {
  onNewProject?: () => void;
}

const timeAgo = (dateString: string) => {
  try {
    const diff = (Date.now() - new Date(dateString).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return 'Recently';
  }
};

const getProjectIcon = (name: string, index: number) => {
  const n = name.toLowerCase();
  if (n.includes('api') || n.includes('gateway') || index === 0) {
    return (
      <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    );
  }
  if (n.includes('db') || n.includes('graph') || n.includes('data') || index === 1) {
    return (
      <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  );
};

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({ onNewProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ msg: string; type: 'info' | 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<{ id: number; name: string } | null>(null);
  const [editForm, setEditForm] = useState({ branch: '', buildCommand: '', installCommand: '' });
  const [saving, setSaving] = useState(false);

  // Link Repo BYOC Modal States
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [linkingRepo, setLinkingRepo] = useState(false);
  const [linkForm, setLinkForm] = useState({ projectId: '', repoFullName: '' });
  const [fetchReposError, setFetchReposError] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await projectService.getProjects();
      if (res.success) {
        setProjects(res.projects || []);
      } else {
        setError('Failed to load projects.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchGithubRepos = async () => {
    setFetchReposError('');
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`${BASE_URL}/github/repos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.repos) {
        setGithubRepos(data.repos);
      } else {
        setFetchReposError(data.message || 'Failed to fetch repositories.');
      }
    } catch (err: any) {
      setFetchReposError(err.message || 'Failed to connect to GitHub.');
    }
  };

  const handleOpenLinkModal = () => {
    setIsLinkModalOpen(true);
    if (githubRepos.length === 0) {
      fetchGithubRepos();
    }
  };

  const handleLinkRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkForm.projectId || !linkForm.repoFullName) return;
    setLinkingRepo(true);

    const repoDetails = githubRepos.find(r => r.full_name === linkForm.repoFullName);

    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`${BASE_URL}/github/repos/install-runner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: Number(linkForm.projectId),
          owner: repoDetails.owner,
          repoName: repoDetails.name
        })
      });

      const data = await res.json();
      if (res.ok) {
        setToastMessage({ msg: 'Successfully injected BYOC Workflow!', type: 'success' });
        setIsLinkModalOpen(false);
      } else {
        throw new Error(data.message || 'Failed to inject workflow');
      }
    } catch (err: any) {
      setToastMessage({ msg: err.message, type: 'error' });
    } finally {
      setLinkingRepo(false);
    }
  };

  const handleOpenEdit = (p: Project) => {
    setEditingProject(p);
    setEditForm({
      branch: p.branch || 'main',
      buildCommand: p.build_command || '',
      installCommand: p.install_command || '',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    setSaving(true);
    try {
      await projectService.updateProject(editingProject.id, editForm);
      setEditingProject(null);
      setToastMessage({ msg: 'Project configuration updated successfully.', type: 'success' });
      fetchProjects();
    } catch (err: any) {
      setToastMessage({ msg: err.message || 'Failed to update project', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: number, name: string) => {
    setProjectToDelete({ id, name });
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    const { id, name } = projectToDelete;
    try {
      await projectService.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setToastMessage({ msg: `Project "${name}" deleted.`, type: 'info' });
    } catch (err: any) {
      setToastMessage({ msg: err.message || 'Failed to delete project', type: 'error' });
    } finally {
      setProjectToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
        <p className="text-text-secondary font-mono text-xs">Loading active projects topology...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-error/10 border border-error/40 rounded-xl text-center font-mono text-xs">
        <p className="text-error font-medium">{error}</p>
        <button
          onClick={fetchProjects}
          className="mt-4 px-4 py-2 bg-obsidian hover:bg-surface-elevated text-ivory border border-border-subtle rounded-lg text-xs font-medium transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.repo_url?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {toastMessage && (
        <Toast message={toastMessage.msg} type={toastMessage.type} onDismiss={() => setToastMessage(null)} />
      )}

      <ConfirmModal
        isOpen={projectToDelete !== null}
        title="Delete Project"
        message={`Are you sure you want to delete "${projectToDelete?.name}"? This action cannot be undone and will permanently remove all associated resources.`}
        confirmText="Delete Project"
        onConfirm={confirmDelete}
        onCancel={() => setProjectToDelete(null)}
        variant="danger"
      />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border-subtle/40">
        <div>
          <h1 className="font-headline-md text-3xl sm:text-4xl font-bold text-ivory tracking-tight">
            Projects
          </h1>
          <p className="text-sm sm:text-base text-text-secondary mt-1 font-body-md">
            Manage your distributed microservices and AWS ECS Fargate workloads.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-44 sm:w-56 bg-obsidian border border-border-subtle rounded-lg pl-8 pr-3 py-2 text-xs text-ivory placeholder:text-text-muted focus:border-gold focus:outline-none font-mono"
            />
            <svg className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Link BYOC Button */}
          <button
            onClick={handleOpenLinkModal}
            className="px-4 py-2 bg-surface-tertiary hover:bg-surface-elevated text-ivory border border-border-subtle hover:border-gold/30 font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shrink-0"
          >
            <svg className="w-3.5 h-3.5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span>Link GitHub BYOC</span>
          </button>

          {/* New Project Button */}
          <button
            onClick={onNewProject}
            className="px-4 py-2 bg-gold hover:bg-gold-hover text-obsidian font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shrink-0 shadow-[0_0_15px_rgba(201,152,45,0.2)]"
          >
            <span className="text-sm leading-none">+</span>
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Projects Grid or Honest Empty State */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          title={searchQuery ? 'No matching projects found' : 'No projects deployed yet'}
          description={
            searchQuery
              ? 'Try adjusting your search criteria or filter terms.'
              : 'Connect your GitHub repository and launch your first AWS ECS Fargate microservice.'
          }
          action={
            <button
              onClick={onNewProject}
              className="px-4 py-2 bg-gold hover:bg-gold-hover text-obsidian font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
            >
              + Launch Microservice
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => {
            const isProd = !project.branch || project.branch === 'main' || project.branch === 'production' || project.branch === 'prod';
            const displayId = `prj-${project.id.toString().slice(0, 6).padEnd(6, 'a')}`;

            return (
              <div
                key={project.id}
                className="group bg-surface hover:bg-surface-elevated border border-border-subtle hover:border-gold/40 rounded-xl p-6 transition-all duration-300 flex flex-col justify-between shadow-sm min-h-[220px]"
              >
                <div>
                  {/* Top Row: Icon + Title + Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-lg bg-obsidian border border-border-subtle flex items-center justify-center text-ivory shrink-0 shadow-inner group-hover:border-gold/30 transition-colors">
                        {getProjectIcon(project.name, index)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-headline-md font-semibold text-lg text-ivory truncate group-hover:text-gold transition-colors">
                          {project.name}
                        </h3>
                        <div className="font-mono text-[11px] text-text-muted mt-0.5 truncate">
                          ID: {displayId}
                        </div>
                      </div>
                    </div>

                    {/* Subtle Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Open Live Production URL"
                          className="p-1.5 rounded-lg bg-surface-tertiary hover:bg-gold/20 text-text-secondary hover:text-gold border border-border-subtle transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                      <button
                        onClick={() => handleOpenEdit(project)}
                        title="Configure Settings"
                        className="p-1.5 rounded-lg bg-surface-tertiary hover:bg-gold/20 text-text-secondary hover:text-gold border border-border-subtle transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(project.id, project.name)}
                        title="Delete Project"
                        className="p-1.5 rounded-lg bg-error/10 hover:bg-error/20 text-error/80 hover:text-error border border-error/30 transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Middle Row: 2 Columns (Environment & Orchestration) */}
                  <div className="grid grid-cols-2 gap-4 my-6 py-4 border-y border-border-subtle/50">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted font-medium mb-1.5">
                        ENVIRONMENT
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isProd ? 'bg-success shadow-[0_0_6px_#34C759]' : 'bg-info shadow-[0_0_6px_#5E8BFF]'}`}></span>
                        <span className="text-xs font-mono text-ivory">
                          {isProd ? 'Production' : 'Staging'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted font-medium mb-1.5">
                        ORCHESTRATION
                      </div>
                      <div className="text-xs font-mono text-ivory">
                        1 task (Fargate)
                      </div>
                    </div>
                  </div>

                  {/* Live Endpoint Banner */}
                  {project.liveUrl && (
                    <div className="mb-5">
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-obsidian/80 border border-gold/40 hover:border-gold hover:bg-gold/10 text-ivory transition-all group/link shadow-inner"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0 shadow-[0_0_8px_#34C759]"></span>
                          <span className="font-mono text-xs font-semibold text-gold truncate group-hover/link:underline">
                            {project.liveUrl.replace(/^https?:\/\//, '')}
                          </span>
                        </div>
                        <svg className="w-3.5 h-3.5 text-text-muted group-hover/link:text-gold shrink-0 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>

                {/* Bottom Row: Footer */}
                <div className="flex items-center justify-between font-mono text-xs pt-1">
                  <span className="text-text-muted text-[11px]">
                    Last updated {timeAgo(project.created_at)}
                  </span>
                  <button
                    onClick={() => handleOpenEdit(project)}
                    className="text-gold hover:text-gold-hover font-medium flex items-center gap-1 transition-all group-hover:translate-x-0.5 duration-200"
                  >
                    <span>View details</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Configuration Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border-subtle rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <h3 className="text-lg font-headline-md font-bold text-ivory">Configure {editingProject.name}</h3>
              <button
                onClick={() => setEditingProject(null)}
                className="text-text-secondary hover:text-ivory transition p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Production Branch
                </label>
                <input
                  type="text"
                  value={editForm.branch}
                  onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
                  placeholder="main"
                  className="w-full bg-obsidian border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-ivory focus:outline-none focus:border-gold font-mono transition"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Install Command
                </label>
                <input
                  type="text"
                  value={editForm.installCommand}
                  onChange={(e) => setEditForm({ ...editForm, installCommand: e.target.value })}
                  placeholder="npm install"
                  className="w-full bg-obsidian border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-ivory focus:outline-none focus:border-gold font-mono transition"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Build Command
                </label>
                <input
                  type="text"
                  value={editForm.buildCommand}
                  onChange={(e) => setEditForm({ ...editForm, buildCommand: e.target.value })}
                  placeholder="npm run build"
                  className="w-full bg-obsidian border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-ivory focus:outline-none focus:border-gold font-mono transition"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 rounded-xl bg-surface-tertiary hover:bg-surface-elevated text-text-secondary hover:text-ivory text-xs font-mono transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-gold hover:bg-gold-hover disabled:opacity-50 text-obsidian font-mono font-bold text-xs transition shadow-lg shadow-gold/20"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Repo BYOC Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border-subtle rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <h3 className="text-lg font-headline-md font-bold text-ivory">Link GitHub BYOC</h3>
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className="text-text-secondary hover:text-ivory transition p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-text-secondary font-mono leading-relaxed">
              Link a GitHub repository to automatically inject the MicrOps OIDC BYOC workflow. Every time you push to main, GitHub Actions will securely deploy the container to your AWS account.
            </p>

            {fetchReposError ? (
              <div className="p-3 bg-error/10 border border-error/40 rounded-lg text-xs font-mono text-error">
                {fetchReposError}
                <div className="mt-2 text-text-muted">You must connect your GitHub account via the Integrations page or login with GitHub OAuth first.</div>
              </div>
            ) : (
              <form onSubmit={handleLinkRepo} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    Select Project
                  </label>
                  <select
                    value={linkForm.projectId}
                    onChange={(e) => setLinkForm({ ...linkForm, projectId: e.target.value })}
                    className="w-full bg-obsidian border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-ivory focus:outline-none focus:border-gold font-mono transition"
                    required
                  >
                    <option value="" disabled>-- Select a project --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    Select Repository
                  </label>
                  <select
                    value={linkForm.repoFullName}
                    onChange={(e) => setLinkForm({ ...linkForm, repoFullName: e.target.value })}
                    className="w-full bg-obsidian border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-ivory focus:outline-none focus:border-gold font-mono transition"
                    required
                  >
                    <option value="" disabled>-- Select a repository --</option>
                    {githubRepos.map((r) => (
                      <option key={r.id} value={r.full_name}>{r.full_name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsLinkModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-surface-tertiary hover:bg-surface-elevated text-text-secondary hover:text-ivory text-xs font-mono transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={linkingRepo || githubRepos.length === 0}
                    className="px-5 py-2 rounded-xl bg-gold hover:bg-gold-hover disabled:opacity-50 text-obsidian font-mono font-bold text-xs transition shadow-lg shadow-gold/20 flex items-center gap-2"
                  >
                    {linkingRepo ? 'Injecting Workflow...' : 'Inject BYOC Action'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
