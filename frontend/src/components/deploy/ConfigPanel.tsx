import React, { useState } from 'react';
import { Card, FormField, Input, Select } from '../ui/primitives';

interface ConfigPanelProps {
  onDeploy: (options?: { branch?: string; buildCommand?: string; installCommand?: string; runtime?: string }) => void;
  isDeploying: boolean;
  repoUrl: string;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ onDeploy, isDeploying, repoUrl }) => {
  const [branch, setBranch] = useState('main');
  const [installCommand, setInstallCommand] = useState('npm install --legacy-peer-deps');
  const [buildCommand, setBuildCommand] = useState('npm run build');
  const [startCommand, setStartCommand] = useState('npm start');
  const [environment, setEnvironment] = useState('Production');
  const [containerImage, setContainerImage] = useState('node:20-alpine');
  const [computeSpec, setComputeSpec] = useState('0.25 vCPU / 512MB');
  const [replicas, setReplicas] = useState(3);
  const [envVars, setEnvVars] = useState([
    { key: 'NODE_ENV', value: 'production' },
    { key: 'PORT', value: '8000' },
  ]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source & Build */}
        <Card>
          <h3 className="font-headline-md text-base text-ivory font-semibold mb-1">Source & Build</h3>
          <p className="text-xs text-text-secondary font-mono mb-5">Git tracking and build instructions</p>

          <div className="space-y-4">
            <FormField label="Branch">
              <Select value={branch} onChange={(e) => setBranch(e.target.value)}>
                <option value="main">main</option>
                <option value="staging">staging</option>
                <option value="development">development</option>
              </Select>
            </FormField>

            <FormField label="Install Command">
              <Input value={installCommand} onChange={(e) => setInstallCommand(e.target.value)} />
            </FormField>

            <FormField label="Build Command">
              <Input value={buildCommand} onChange={(e) => setBuildCommand(e.target.value)} />
            </FormField>

            <FormField label="Start Command">
              <Input value={startCommand} onChange={(e) => setStartCommand(e.target.value)} />
            </FormField>
          </div>
        </Card>

        {/* Infrastructure */}
        <Card>
          <h3 className="font-headline-md text-base text-ivory font-semibold mb-1">Infrastructure</h3>
          <p className="text-xs text-text-secondary font-mono mb-5">Container and compute allocation</p>

          <div className="space-y-4">
            <FormField label="Environment">
              <Select value={environment} onChange={(e) => setEnvironment(e.target.value)}>
                <option value="Production">Production (High Availability)</option>
                <option value="Staging">Staging (Pre-release)</option>
                <option value="Development">Development (Spot)</option>
              </Select>
            </FormField>

            <FormField label="Container Image">
              <Select value={containerImage} onChange={(e) => setContainerImage(e.target.value)}>
                <option value="node:20-alpine">Node.js 20 Alpine</option>
                <option value="node:22-alpine">Node.js 22 Alpine</option>
                <option value="python:3.11-slim">Python 3.11 Slim</option>
                <option value="dockerfile">Custom Dockerfile</option>
              </Select>
            </FormField>

            <FormField label="Compute">
              <Select value={computeSpec} onChange={(e) => setComputeSpec(e.target.value)}>
                <option value="0.25 vCPU / 512MB">0.25 vCPU / 512MB — $14.68/mo</option>
                <option value="0.5 vCPU / 1GB">0.5 vCPU / 1GB — $29/mo</option>
                <option value="1.0 vCPU / 2GB">1.0 vCPU / 2GB — $58/mo</option>
              </Select>
            </FormField>

            <FormField label={`Replicas — ${replicas}`}>
              <input
                type="range" min="1" max="10" value={replicas}
                onChange={(e) => setReplicas(Number(e.target.value))}
                className="w-full accent-gold cursor-pointer"
              />
            </FormField>
          </div>
        </Card>
      </div>

      {/* Environment Variables */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-headline-md text-base text-ivory font-semibold">Environment Variables</h3>
            <p className="text-xs text-text-secondary font-mono">Injected at runtime via encrypted vault</p>
          </div>
          <button
            type="button"
            onClick={() => setEnvVars([...envVars, { key: '', value: '' }])}
            className="px-3 py-1.5 bg-surface-elevated border border-border-subtle text-gold hover:border-gold rounded text-[11px] font-mono transition-colors"
          >
            + Add
          </button>
        </div>

        <div className="space-y-2">
          {envVars.map((ev, idx) => (
            <div key={idx} className="flex gap-2 font-mono text-xs">
              <Input
                placeholder="KEY"
                value={ev.key}
                onChange={(e) => {
                  const copy = [...envVars];
                  copy[idx].key = e.target.value;
                  setEnvVars(copy);
                }}
                className="w-1/3"
              />
              <Input
                placeholder="VALUE"
                value={ev.value}
                onChange={(e) => {
                  const copy = [...envVars];
                  copy[idx].value = e.target.value;
                  setEnvVars(copy);
                }}
              />
              <button
                type="button"
                onClick={() => setEnvVars(envVars.filter((_, i) => i !== idx))}
                className="px-3 bg-obsidian border border-border-subtle text-error hover:border-error rounded transition-colors"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Deploy Action Bar */}
      <div className="bg-surface-elevated border border-gold/30 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-base text-ivory font-semibold">Ready to Deploy</h4>
          <p className="text-xs font-mono text-text-secondary mt-0.5">
            Pipeline will stream logs upon launch.
          </p>
        </div>
        <button
          onClick={() => onDeploy({ branch, buildCommand, installCommand, runtime: containerImage })}
          disabled={isDeploying || !repoUrl}
          className="w-full sm:w-auto px-8 py-3.5 bg-gold hover:bg-gold-hover text-obsidian font-mono text-sm font-bold uppercase tracking-wider rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          🚀 Execute Deployment
        </button>
      </div>
    </div>
  );
};
