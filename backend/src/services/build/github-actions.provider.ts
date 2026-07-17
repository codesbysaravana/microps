import { buildBus } from '../../utils/eventBus';
import { analyzeBuildFailure } from '../diagnostics/diagnostic.engine';

const getOwner = () => process.env.GITHUB_OWNER || 'codesbysaravana';
const getRepo = () => process.env.GITHUB_REPO || 'microps-runner-vault';
const getWorkflowId = () => process.env.GITHUB_WORKFLOW_ID || 'builder.yml';

const getHeaders = () => ({
  'Accept': 'application/vnd.github+json',
  'Authorization': `Bearer ${process.env.GITHUB_PAT}`,
  'X-GitHub-Api-Version': '2022-11-28',
  'Content-Type': 'application/json',
  'User-Agent': 'MicrOps-Orchestrator',
});

async function triggerGitHubWorkflow(tenantScript: string, correlationId: string) {
  const url = `https://api.github.com/repos/${getOwner()}/${getRepo()}/actions/workflows/${getWorkflowId()}/dispatches`;

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      ref: 'main',
      inputs: {
        tenantScript: tenantScript,
        correlationId: correlationId,
      },
    }),
  });

  if (response.status !== 204) {
    const errText = await response.text();
    throw new Error(`GitHub Actions rejected Trigger with (${response.status}): ${errText}`);
  }

  console.log(`[PROVIDER] Successfully dispatched workflow with correlationId=${correlationId}`);
}

// FIX #3 (v2): Match runs by correlationId via step logs (concurrency-safe)
async function getLatestWorkflowRun(correlationId: string, maxRetries = 5) {
  const dispatchTime = parseInt(correlationId.split('-').pop() || '0');

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    await new Promise((r) => setTimeout(r, 3000));

    const url = `https://api.github.com/repos/${getOwner()}/${getRepo()}/actions/workflows/${getWorkflowId()}/runs?event=workflow_dispatch&per_page=20`;

    const response = await fetch(url, {
      headers: getHeaders(),
    });
    const data = await response.json();

    if (data.workflow_runs && data.workflow_runs.length > 0) {
      // Check each recent run's job logs for the correlationId
      for (const run of data.workflow_runs) {
        const createdAt = new Date(run.created_at).getTime();

        // Pre-filter: only check runs created within 30s of dispatch (avoid old runs)
        if (Math.abs(createdAt - dispatchTime) > 30000) continue;

        try {
          const jobsUrl = `https://api.github.com/repos/${getOwner()}/${getRepo()}/actions/runs/${run.id}/jobs`;
          const jobsRes = await fetch(jobsUrl, { headers: getHeaders() });
          const jobsData = await jobsRes.json();

          if (jobsData.jobs && jobsData.jobs.length > 0) {
            const job = jobsData.jobs[0];

            // Check if the job has started (steps are available)
            if (job.steps && job.steps.length > 0) {
              // Fetch the job logs to check for our correlationId
              try {
                const logUrl = `https://api.github.com/repos/${getOwner()}/${getRepo()}/actions/jobs/${job.id}/logs`;
                const logRes = await fetch(logUrl, { headers: getHeaders() });

                if (logRes.ok) {
                  const logs = await logRes.text();
                  // Check if our correlationId appears in the logs (echoed by the workflow)
                  if (logs.includes(correlationId)) {
                    console.log(`[PROVIDER] ✅ Matched run #${run.run_number} via correlationId in logs`);
                    return run;
                  }
                }
              } catch (logErr) {
                // Logs might not be ready yet
              }
            }
          }
        } catch (err) {
          // Jobs API might not be ready yet, continue
        }
      }

      // Fallback: if no log match found and this is the last attempt, use timestamp heuristic
      if (attempt === maxRetries - 1) {
        const fallbackRun = data.workflow_runs.find((run: any) => {
          const createdAt = new Date(run.created_at).getTime();
          return Math.abs(createdAt - dispatchTime) < 10000;
        });

        if (fallbackRun) {
          console.warn(`[PROVIDER] ⚠️ Falling back to timestamp match for run #${fallbackRun.run_number} (logs not available)`);
          return fallbackRun;
        }
      }

      console.log(`[PROVIDER] No matching run for correlationId=${correlationId}, retrying... (${attempt + 1}/${maxRetries})`);
    }
  }

  console.error(`[PROVIDER] ❌ Failed to locate workflow run for correlationId=${correlationId} after ${maxRetries} attempts`);
  return null;
}

function cleanLogLines(rawLogs: string, startIndex: number): { cleanedChunk: string; nextIndex: number } {
  const lines = rawLogs.split('\n');
  if (lines.length <= startIndex) return { cleanedChunk: '', nextIndex: startIndex };

  const newLines = lines.slice(startIndex);
  const cleaned = newLines
    .map((line) => line.replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z\s*/, '').trimEnd())
    .filter((line) => {
      if (!line) return false;
      if (line.startsWith('##[group]') || line.startsWith('##[endgroup]')) return false;
      if (line.includes('Prepare workflow') || line.includes('Set up job')) return false;
      return true;
    });

  return {
    cleanedChunk: cleaned.join('\n'),
    nextIndex: lines.length,
  };
}

// FIX #7 (v2): Widened poll interval to 4s (150 × 4s = 10 min) to stay under GitHub API rate limit
// At concurrency=5: 150 polls/build × 5 builds = 750 calls/10min = 4,500 calls/hr (under 5,000/hr limit)
const MAX_POLL_ATTEMPTS = 150;

async function pollWorkflowRun(runId: string, jobId: string, userId: number) {
  const runUrl = `https://api.github.com/repos/${getOwner()}/${getRepo()}/actions/runs/${runId}`;
  const jobsUrl = `https://api.github.com/repos/${getOwner()}/${getRepo()}/actions/runs/${runId}/jobs`;
  const seenSteps = new Set<string>();
  const stepStartTimes = new Map<string, number>();
  let lastLogLineIndex = 0;
  let attempts = 0;
  let finalDiagnosticReport: any = null;
  let finalRawLogs = '';

  while (attempts < MAX_POLL_ATTEMPTS) {
    attempts++;
    const res = await fetch(runUrl, { headers: getHeaders() });
    const run = await res.json();

    try {
      const jobsRes = await fetch(jobsUrl, { headers: getHeaders() });
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        if (jobsData.jobs && jobsData.jobs.length > 0) {
          const job = jobsData.jobs[0];
          if (job.steps) {
            for (const step of job.steps) {
              const stepKey = step.number.toString();
              
              if (step.status === 'in_progress' && !seenSteps.has('exec_' + stepKey)) {
                seenSteps.add('exec_' + stepKey);
                stepStartTimes.set(stepKey, Date.now());
                buildBus.emit('build-progress', {
                  userId,
                  jobId,
                  message: `[GitHub Runner] ⏳ Executing: ${step.name}...`,
                });
              } else if (step.status === 'completed' && !seenSteps.has(stepKey)) {
                seenSteps.add(stepKey);
                
                const startTime = stepStartTimes.get(stepKey) || new Date(step.started_at).getTime();
                const duration = Math.round((new Date(step.completed_at).getTime() - startTime) / 1000);
                const icon = step.conclusion === 'success' ? '✅' : step.conclusion === 'skipped' ? '⏭️' : '❌';
                
                buildBus.emit('build-progress', {
                  userId,
                  jobId,
                  message: `[GitHub Runner] ${icon} Completed: ${step.name} (took ${duration}s)`,
                });
              }
            }
          }

          let rawLogs = '';
          const logUrl = `https://api.github.com/repos/${getOwner()}/${getRepo()}/actions/jobs/${job.id}/logs`;
          try {
            const logRes = await fetch(logUrl, { headers: getHeaders() });
            if (logRes.ok) {
              rawLogs = await logRes.text();
              const { cleanedChunk, nextIndex } = cleanLogLines(rawLogs, lastLogLineIndex);
              lastLogLineIndex = nextIndex;
              if (cleanedChunk) {
                // Dim/gray the raw stdout if the frontend supports it (or just prefix it)
                buildBus.emit('build-progress', {
                  userId,
                  jobId,
                  message: `\n> ${cleanedChunk.replace(/\n/g, '\n> ')}`,
                });
              }
            }
          } catch (logErr: any) {
            // Logs not streamable yet
          }

          if (run.status === 'completed' && run.conclusion !== 'success') {
            const tailLogs = rawLogs.split('\n').slice(-20).join('\n');
            if (tailLogs) {
              buildBus.emit('build-progress', {
                userId,
                jobId,
                message: `\n\n--- ❌ FATAL RUNNER ERROR: TERMINAL TAIL LOGS ---\n${tailLogs}\n-----------------------------------------------\n`,
              });
            }
            finalRawLogs = rawLogs;
            finalDiagnosticReport = await analyzeBuildFailure(rawLogs, jobId);
            buildBus.emit('build-progress', {
              userId,
              ...finalDiagnosticReport,
            });
          }
        }
      }
    } catch (err: any) {
      console.error('[PROVIDER] Error fetching job logs:', err.message);
    }

    if (run.status === 'completed') {
      // Dump final full success summary
      if (run.conclusion === 'success') {
        buildBus.emit('build-progress', {
          userId,
          jobId,
          message: `\n[GitHub Runner] 🎉 Build Pipeline Successfully Completed in ${Math.round((new Date(run.updated_at).getTime() - new Date(run.created_at).getTime()) / 1000)}s!`,
        });
      }
      return {
        buildNumber: run.run_number,
        result: run.conclusion === 'success' ? 'SUCCESS' : 'FAILURE',
        duration: Math.round((new Date(run.updated_at).getTime() - new Date(run.created_at).getTime()) / 1000),
        url: run.html_url,
        diagnosticReport: finalDiagnosticReport,
        rawLogs: finalRawLogs,
      };
    }

    // Polling every 4 seconds (rate-limit optimized for concurrency=5)
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }

  // FIX #7 (v2): Timeout reached — throw instead of hanging forever
  throw new Error(`Build polling timed out after ${MAX_POLL_ATTEMPTS * 4} seconds. The GitHub Actions run may still be in progress.`);
}

export async function runBuildPipeline(tenantScript: string, jobId: string, userId: number) {
  const correlationId = `microps-${jobId}-${Date.now()}`;

  buildBus.emit('build-progress', { userId, jobId, message: '[GitHub Runner] Dispatching ephemeral container build...' });
  await triggerGitHubWorkflow(tenantScript, correlationId);

  const run = await getLatestWorkflowRun(correlationId);

  if (!run) {
    throw new Error(`Failed to locate triggered GitHub Actions workflow run for correlationId=${correlationId}`);
  }

  buildBus.emit('build-progress', { userId, jobId, message: `[GitHub Runner] Attached to VM Run #${run.run_number}. Streaming step progress...` });

  return await pollWorkflowRun(run.id, jobId, userId);
}
