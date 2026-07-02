import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Card, FormField, Input, Toast } from '../ui/primitives';
import { authService } from '../../services/authService';

export const SettingsSection: React.FC = () => {
  const { user, token, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name || 'Enterprise Operator');
  const [email] = useState(user?.email || 'admin@microps.in');
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ msg: string; type: 'info' | 'success' | 'error' } | null>(null);

  const activeToken = token || 'jwt_session_token_active';

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authService.updateProfile(name);
      updateUser({ name });
      setToastMessage({ msg: 'Account profile updated successfully.', type: 'success' });
    } catch (err: any) {
      setToastMessage({ msg: err.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(activeToken);
    setToastMessage({ msg: 'Authentication Token copied to clipboard.', type: 'info' });
  };

  return (
    <div className="max-w-4xl space-y-8 animate-fadeIn">
      {toastMessage && (
        <Toast message={toastMessage.msg} type={toastMessage.type} onDismiss={() => setToastMessage(null)} />
      )}

      <div className="pb-4 border-b border-border-subtle">
        <h1 className="text-xl font-headline-md font-semibold text-ivory tracking-tight">
          Organization & Account Settings
        </h1>
        <p className="text-xs text-text-secondary font-mono mt-0.5">
          Manage operator identity, JWT session credentials, and security policies.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <Card>
          <h3 className="font-headline-md text-base text-ivory font-semibold mb-1">Operator Identity</h3>
          <p className="text-xs text-text-secondary font-mono mb-6">Personal details and authenticated role</p>

          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
            <FormField label="Full Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </FormField>

            <FormField label="Email Address">
              <Input type="email" value={email} disabled />
            </FormField>

            <FormField label="Assigned Role">
              <Input value="Root Operator (Full AWS ECS Fargate & Vault Access)" disabled />
            </FormField>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-gold hover:bg-gold-hover disabled:opacity-50 text-obsidian font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </Card>

        {/* API Tokens Card */}
        <Card>
          <h3 className="font-headline-md text-base text-ivory font-semibold mb-1">Session JWT Token</h3>
          <p className="text-xs text-text-secondary font-mono mb-6">Use bearer token for CLI or API communication</p>

          <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
            <input
              type="password"
              value={activeToken}
              readOnly
              className="flex-1 bg-obsidian border border-border-subtle rounded-lg px-4 py-2.5 text-ivory font-mono text-sm select-all"
            />
            <button
              onClick={handleCopyKey}
              className="px-5 py-2.5 bg-surface-elevated border border-border-subtle hover:border-gold text-ivory font-mono text-xs rounded-lg transition-colors shrink-0"
            >
              Copy Token
            </button>
          </div>
        </Card>

        {/* Security / Audit Card */}
        <Card>
          <h3 className="font-headline-md text-base text-ivory font-semibold mb-1">Security & Telemetry Policy</h3>
          <p className="text-xs text-text-secondary font-mono mb-4">Real-time session and telemetry verification</p>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between p-3 bg-surface-elevated rounded-lg border border-border-subtle">
              <div>
                <span className="text-ivory font-semibold block">JWT Bearer Authentication</span>
                <span className="text-[11px] text-text-muted">Enforced 24h session expiration & bcrypt password hashing</span>
              </div>
              <span className="px-2.5 py-1 bg-success/10 text-success rounded font-bold">ENABLED</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-surface-elevated rounded-lg border border-border-subtle">
              <div>
                <span className="text-ivory font-semibold block">Build Telemetry & Event Stream</span>
                <span className="text-[11px] text-text-muted">Live SSE container logs recorded in PostgreSQL</span>
              </div>
              <span className="px-2.5 py-1 bg-success/10 text-success rounded font-bold">ACTIVE</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
