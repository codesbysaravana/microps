import React from 'react';
import { Card } from '../ui/primitives';

export const InfraTimeline: React.FC = () => {
  const events = [
    { time: '14:02:11', evt: 'Registering AWS ECS Task Definition & Container Spec', status: 'done' },
    { time: '14:02:13', evt: 'Pulling Image from AWS ECR private repository', status: 'done' },
    { time: '14:02:16', evt: 'Provisioning AWS Fargate Serverless Compute Tasks', status: 'done' },
    { time: '14:02:19', evt: 'Injecting AES-GCM Encrypted Environment Vault Variables', status: 'done' },
    { time: '14:02:22', evt: 'Starting Container Runtime Process inside ECS Fargate', status: 'done' },
    { time: '14:02:25', evt: 'Executing Application Health Probes (/health)', status: 'done' },
  ];

  return (
    <Card className="animate-fadeIn">
      <h3 className="font-headline-md text-lg text-ivory font-semibold mb-4">
        Infrastructure Lifecycle Events
      </h3>
      <div className="relative border-l border-border-subtle ml-2 pl-6 space-y-4 font-mono text-xs">
        {events.map((item, idx) => (
          <div key={idx} className="relative">
            <span className="absolute -left-[29px] top-1.5 w-2.5 h-2.5 rounded-full bg-gold ring-4 ring-obsidian" />
            <div className="flex items-center justify-between">
              <span className="text-ivory font-semibold">{item.evt}</span>
              <span className="text-text-muted text-[10px]">{item.time}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
