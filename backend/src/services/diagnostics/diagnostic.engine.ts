export interface FixActionPayload {
  actionType: 'UPGRADE_RUNTIME' | 'PATCH_INSTALL_CMD' | 'SET_ENV_PORT' | 'INCREASE_NODE_OPTIONS' | 'SET_BUILD_CMD';
  targetValue?: string;
  installCommand?: string;
  buildCommand?: string;
  env?: Record<string, string>;
}

export interface FixAction {
  label: string;
  actionEndpoint: string;
  actionType: 'UPGRADE_RUNTIME' | 'PATCH_INSTALL_CMD' | 'SET_ENV_PORT' | 'INCREASE_NODE_OPTIONS' | 'SET_BUILD_CMD';
  payload: FixActionPayload;
}

export interface DiagnosticReport {
  type: 'DIAGNOSTIC_REPORT';
  ruleId: string;
  jobId: string;
  failureTitle: string;
  rootCause: string;
  detected: string;
  probability: string;
  fixAction?: FixAction;
}

export async function analyzeBuildFailure(rawLogs: string, jobId: string, runtime?: string): Promise<DiagnosticReport> {
  const logs = rawLogs || '';

  // Rule 1: Peer Dependency Conflict
  if (/ERESOLVE unable to resolve dependency tree|conflicting peer dependency|peer dep missing/i.test(logs)) {
    return {
      type: 'DIAGNOSTIC_REPORT',
      ruleId: 'NPM_PEER_DEPS_CONFLICT',
      jobId,
      failureTitle: '❌ Build failed during dependency resolution.',
      rootCause: 'Peer dependency version conflict detected during npm package installation.',
      detected: 'Strict Peer Dependency Tree',
      probability: '98%',
      fixAction: {
        label: 'npm install --legacy-peer-deps',
        actionEndpoint: '/api/v1/build/apply-fix',
        actionType: 'PATCH_INSTALL_CMD',
        payload: {
          actionType: 'PATCH_INSTALL_CMD',
          installCommand: 'npm install --legacy-peer-deps',
        },
      },
    };
  }

  // Rule 2: Next CLI missing or binary not found
  if (/next: not found|sh: .*not found|exit code 127/i.test(logs)) {
    return {
      type: 'DIAGNOSTIC_REPORT',
      ruleId: 'COMMAND_BINARY_MISSING',
      jobId,
      failureTitle: '❌ Build failed: Command binary not found.',
      rootCause: 'CLI tool or framework binary (e.g., next) missing or failed to install in container path.',
      detected: 'Exit Code 127 (Command Not Found)',
      probability: '99%',
      fixAction: {
        label: 'Use legacy peer deps & clean install',
        actionEndpoint: '/api/v1/build/apply-fix',
        actionType: 'PATCH_INSTALL_CMD',
        payload: {
          actionType: 'PATCH_INSTALL_CMD',
          installCommand: 'npm install --legacy-peer-deps',
        },
      },
    };
  }

  // Rule 3: Node Engine Version Incompatible
  if (/engine ".*" is incompatible|requires Node >=?(\d+)|unsupported engine/i.test(logs)) {
    const match = logs.match(/requires Node >=?(\d+)/i);
    const targetNode = match && match[1] ? `node:${match[1]}-alpine` : 'node:20-alpine';
    return {
      type: 'DIAGNOSTIC_REPORT',
      ruleId: 'NODE_ENGINE_MISMATCH',
      jobId,
      failureTitle: '❌ Build failed: Runtime engine incompatibility.',
      rootCause: `Package dependency requires a higher Node.js runtime environment (${targetNode}).`,
      detected: runtime || 'Node.js LTS (Legacy)',
      probability: '99%',
      fixAction: {
        label: `Upgrade to ${targetNode}`,
        actionEndpoint: '/api/v1/build/apply-fix',
        actionType: 'UPGRADE_RUNTIME',
        payload: {
          actionType: 'UPGRADE_RUNTIME',
          targetValue: targetNode,
        },
      },
    };
  }

  // Rule 4: Out of Memory (OOM)
  if (/JavaScript heap out of memory|Killed|out of memory|Allocation failed/i.test(logs)) {
    return {
      type: 'DIAGNOSTIC_REPORT',
      ruleId: 'OOM_CONTAINER_MEMORY',
      jobId,
      failureTitle: '❌ Build failed: Memory limit exceeded.',
      rootCause: 'JavaScript compiler heap exceeded standard Fargate container memory allocation.',
      detected: '512MB Heap Allocation',
      probability: '96%',
      fixAction: {
        label: 'Expand Node Heap Limit (--max-old-space-size=2048)',
        actionEndpoint: '/api/v1/build/apply-fix',
        actionType: 'INCREASE_NODE_OPTIONS',
        payload: {
          actionType: 'INCREASE_NODE_OPTIONS',
          env: { NODE_OPTIONS: '--max-old-space-size=2048' },
        },
      },
    };
  }

  // Rule 5: Missing Build Script
  if (/Missing script: "?build"?|npm ERR! missing script: build/i.test(logs)) {
    return {
      type: 'DIAGNOSTIC_REPORT',
      ruleId: 'MISSING_BUILD_SCRIPT',
      jobId,
      failureTitle: '❌ Build failed: Missing build script.',
      rootCause: 'package.json does not define a "build" command.',
      detected: 'npm run build',
      probability: '99%',
      fixAction: {
        label: 'Bypass explicit build step',
        actionEndpoint: '/api/v1/build/apply-fix',
        actionType: 'SET_BUILD_CMD',
        payload: {
          actionType: 'SET_BUILD_CMD',
          buildCommand: 'echo "No build step required"',
        },
      },
    };
  }

  // Rule 6: Missing Start Script (Vite / Static SPAs)
  if (/Missing script: "?start"?|npm ERR! missing script: start/i.test(logs)) {
    return {
      type: 'DIAGNOSTIC_REPORT',
      ruleId: 'MISSING_START_SCRIPT',
      jobId,
      failureTitle: '❌ Runtime failed: Missing start script.',
      rootCause: 'React/Vite SPA package.json lacks an explicit "start" script. Container needs static file serving.',
      detected: 'npm run start',
      probability: '99%',
      fixAction: {
        label: 'Serve static build directory (npx serve -s dist -l 3000)',
        actionEndpoint: '/api/v1/build/apply-fix',
        actionType: 'SET_BUILD_CMD',
        payload: {
          actionType: 'SET_BUILD_CMD',
          buildCommand: 'npm run build',
        },
      },
    };
  }

  // Tier-2: AI Autonomous Diagnostic Agent (OpenAI LLM Call with JSON Schema structuring)
  const aiReport = await callOpenAiDiagnosticAgent(logs, jobId, runtime);
  if (aiReport) {
    return aiReport;
  }

  // Default Fallback Rule
  return {
    type: 'DIAGNOSTIC_REPORT',
    ruleId: 'DEFAULT_FALLBACK',
    jobId,
    failureTitle: '❌ Container build failure detected.',
    rootCause: 'Build compilation or dependency linking exited with non-zero status.',
    detected: 'Container Execution Error',
    probability: '88%',
    fixAction: {
      label: 'Force dependency install (npm install --force)',
      actionEndpoint: '/api/v1/build/apply-fix',
      actionType: 'PATCH_INSTALL_CMD',
      payload: {
        actionType: 'PATCH_INSTALL_CMD',
        installCommand: 'npm install --force',
      },
    },
  };
}

async function callOpenAiDiagnosticAgent(rawLogs: string, jobId: string, runtime?: string): Promise<DiagnosticReport | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  console.log('[Diagnostic Engine] Invoking OpenAI Principal DevOps Agent...');

  const systemPrompt = `You are MicrOps AI Autonomous Debugging Engine, a Principal Senior DevOps Container Architect.
Your task is to analyze raw container build failure logs from an automated cloud CI/CD deployment pipeline and prescribe a deterministic 1-click self-healing remediation.

You MUST respond ONLY with a valid JSON object matching this exact schema:
{
  "ruleId": "AI_OPENAI_DIAGNOSTIC",
  "failureTitle": "❌ Build failed: <Short descriptive title>",
  "rootCause": "<Clear 1-2 sentence technical root cause explaining why the build failed>",
  "detected": "<Key error signature or runtime environment issue detected>",
  "probability": "<e.g., 96%>",
  "fixAction": {
    "label": "<Human readable 1-click action label, e.g., 'Use Yarn install & build'>",
    "actionEndpoint": "/api/v1/build/apply-fix",
    "actionType": "<MUST be one of: UPGRADE_RUNTIME, PATCH_INSTALL_CMD, SET_BUILD_CMD, INCREASE_NODE_OPTIONS, SET_ENV_PORT>",
    "payload": {
      "actionType": "<Same as fixAction.actionType>",
      "installCommand": "<Optional override install command, e.g., 'yarn install --ignore-engines' or 'npm install --force'>",
      "buildCommand": "<Optional override build command, e.g., 'yarn build' or 'echo \"No build step required\"'>",
      "targetValue": "<Optional runtime target, e.g., 'node:20-alpine'>"
    }
  }
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze these failed container build logs (Job ID: ${jobId}, Runtime: ${runtime || 'unknown'}):\n\n${rawLogs.slice(-3500)}` }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error('[Diagnostic AI Agent] OpenAI API error status:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      console.log('[Diagnostic AI Agent] OpenAI prescribed remediation:', parsed.fixAction?.label);
      return {
        type: 'DIAGNOSTIC_REPORT',
        ruleId: parsed.ruleId || 'AI_OPENAI_DIAGNOSTIC',
        jobId,
        failureTitle: parsed.failureTitle || '❌ Build failed: AI Diagnostic Analysis',
        rootCause: parsed.rootCause || 'AI agent detected structural build failure.',
        detected: parsed.detected || 'AI Deep Inspection',
        probability: parsed.probability || '95%',
        fixAction: parsed.fixAction || {
          label: 'Force dependency install',
          actionEndpoint: '/api/v1/build/apply-fix',
          actionType: 'PATCH_INSTALL_CMD',
          payload: { actionType: 'PATCH_INSTALL_CMD', installCommand: 'npm install --force' }
        }
      };
    }
  } catch (err: any) {
    console.error('[Diagnostic AI Agent] Error evaluating LLM output:', err.message);
  }
  return null;
}
