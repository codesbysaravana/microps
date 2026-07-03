import React, { useMemo } from 'react';
import { Card } from '../ui/primitives';

interface InfraTimelineProps {
  buildLogs?: string[];
  isDeploying?: boolean;
}

export const InfraTimeline: React.FC<InfraTimelineProps> = ({ buildLogs = [], isDeploying }) => {
  const timelineEvents = useMemo(() => {
    if (!buildLogs || buildLogs.length === 0) {
      if (!isDeploying) {
        return [
          { time: 'Ready', evt: 'AWS ECS Cluster Standby — Waiting for trigger', status: 'pending' },
        ];
      }
      return [
        { time: 'Live', evt: 'Initializing Cloud Deployment Pipeline...', status: 'active' },
      ];
    }

    // Filter significant infrastructure and build events from live buildLogs
    const significantLogs = buildLogs.filter((log) => {
      const lower = log.toLowerCase();
      return (
        lower.includes('orchestrator') ||
        lower.includes('pre-flight') ||
        lower.includes('scanner') ||
        lower.includes('build stage') ||
        lower.includes('queued') ||
        lower.includes('docker') ||
        lower.includes('ecr') ||
        lower.includes('tagging') ||
        lower.includes('pushing') ||
        lower.includes('ecs deployment') ||
        lower.includes('cd engine') ||
        lower.includes('network routing') ||
        lower.includes('error') ||
        lower.includes('failed') ||
        lower.includes('completed successfully') ||
        lower.includes('starting deployment')
      );
    });

    const eventsToDisplay = significantLogs.length > 0 ? significantLogs : buildLogs;

    return eventsToDisplay.slice(-8).map((rawLog, idx, arr) => {
      // Clean prefix clutter
      let cleanText = rawLog
        .replace(/<------\s*|\s*------>/g, '')
        .replace(/======\s*MicrOps Orchestrator:\s*|\s*======/g, '')
        .replace(/\[CD Engine\]\s*/g, '')
        .trim();

      const isLatest = idx === arr.length - 1 && isDeploying;
      const isErr = cleanText.toLowerCase().includes('error') || cleanText.toLowerCase().includes('failed') || cleanText.includes('❌');

      // Generate a clean pseudo-timestamp based on index if log doesn't embed timestamp
      const now = new Date();
      now.setSeconds(now.getSeconds() - (arr.length - 1 - idx) * 3);
      const timeStr = now.toLocaleTimeString('en-GB', { hour12: false });

      return {
        time: timeStr,
        evt: cleanText || 'Processing step...',
        status: isErr ? 'error' : isLatest ? 'active' : 'done',
      };
    });
  }, [buildLogs, isDeploying]);

  return (
    <Card className="transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-headline-md text-base text-ivory font-semibold">
          Infrastructure Lifecycle Events
        </h3>
        {isDeploying && (
          <span className="text-[10px] font-mono text-gold flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-gold animate-ping" />
            REAL-TIME EVENTS
          </span>
        )}
      </div>

      <div className="relative border-l border-border-subtle ml-2 pl-6 space-y-3.5 font-mono text-xs">
        {timelineEvents.map((item, idx) => (
          <div
            key={idx}
            className="relative flex items-start justify-between gap-4 py-1 group transition-colors duration-200"
          >
            {/* Timeline node */}
            <span
              className={`absolute -left-[29px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-obsidian transition-all ${
                item.status === 'active'
                  ? 'bg-gold ring-gold/20 scale-125'
                  : item.status === 'error'
                  ? 'bg-error ring-error/20'
                  : item.status === 'done'
                  ? 'bg-success'
                  : 'bg-border-subtle'
              }`}
            />

            <div className="flex-1 min-w-0">
              <p
                className={`font-semibold leading-relaxed truncate transition-colors ${
                  item.status === 'active'
                    ? 'text-gold'
                    : item.status === 'error'
                    ? 'text-error'
                    : 'text-ivory group-hover:text-gold/90'
                }`}
              >
                {item.evt}
              </p>
            </div>

            <span className="text-text-muted text-[10px] shrink-0 font-medium">
              {item.time}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};
