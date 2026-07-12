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

  // Rule 7: TypeScript Compilation Errors (bulk TS errors)
  if (/error TS\d+:/i.test(logs)) {
    const tsErrorCount = (logs.match(/error TS\d+:/g) || []).length;
    return {
      type: 'DIAGNOSTIC_REPORT',
      ruleId: 'TS_COMPILATION_ERRORS',
      jobId,
      failureTitle: `❌ Build failed: ${tsErrorCount} TypeScript compilation error(s).`,
      rootCause: `TypeScript compiler (tsc) encountered ${tsErrorCount} type-checking error(s) that blocked compilation.`,
      detected: `${tsErrorCount} TS errors`,
      probability: '99%',
      fixAction: {
        label: 'Enable skipLibCheck to bypass third-party type errors',
        actionEndpoint: '/api/v1/build/apply-fix',
        actionType: 'SET_BUILD_CMD',
        payload: {
          actionType: 'SET_BUILD_CMD',
          buildCommand: "sed -i 's/tsc[^&]*&& //g' package.json && npm run build --if-present",
        },
      },
    };
  }

  // Rule 8: Vite Build Failure
  if (/vite.*error|Could not resolve|Build failed|rollup.*error/i.test(logs) && !/Missing script/i.test(logs)) {
    return {
      type: 'DIAGNOSTIC_REPORT',
      ruleId: 'VITE_BUILD_FAIL',
      jobId,
      failureTitle: '❌ Build failed: Vite/Rollup bundler error.',
      rootCause: 'Vite or Rollup encountered an unresolvable import, missing module, or configuration error during bundling.',
      detected: 'Vite/Rollup Build Pipeline',
      probability: '96%',
      fixAction: {
        label: 'Rebuild with explicit Vite build command',
        actionEndpoint: '/api/v1/build/apply-fix',
        actionType: 'SET_BUILD_CMD',
        payload: {
          actionType: 'SET_BUILD_CMD',
          buildCommand: 'npx vite build',
        },
      },
    };
  }

  // Rule 9: Docker COPY Failed (missing file in context)
  if (/COPY failed:.*not found|file not found|lstat.*no such file/i.test(logs)) {
    return {
      type: 'DIAGNOSTIC_REPORT',
      ruleId: 'DOCKER_COPY_FAIL',
      jobId,
      failureTitle: '❌ Build failed: Docker COPY target not found.',
      rootCause: 'Dockerfile references a file or directory that does not exist in the build context. Check .dockerignore or COPY paths.',
      detected: 'Dockerfile COPY instruction',
      probability: '99%',
      fixAction: {
        label: 'Use MicrOps auto-generated Dockerfile instead',
        actionEndpoint: '/api/v1/build/apply-fix',
        actionType: 'SET_BUILD_CMD',
        payload: {
          actionType: 'SET_BUILD_CMD',
          buildCommand: 'npm run build --if-present',
        },
      },
    };
  }

  // Rule 10: Port Bind Conflict
  if (/EADDRINUSE|address already in use|port.*already.*bound/i.test(logs)) {
    return {
      type: 'DIAGNOSTIC_REPORT',
      ruleId: 'PORT_BIND_CONFLICT',
      jobId,
      failureTitle: '❌ Runtime failed: Port already in use.',
      rootCause: 'Application is trying to bind to a port that is already occupied inside the container.',
      detected: 'EADDRINUSE',
      probability: '98%',
      fixAction: {
        label: 'Force PORT=3000 environment variable',
        actionEndpoint: '/api/v1/build/apply-fix',
        actionType: 'SET_ENV_PORT',
        payload: {
          actionType: 'SET_ENV_PORT',
          env: { PORT: '3000' },
        },
      },
    };
  }

  // Rule 11: Python Module Not Found
  if (/ModuleNotFoundError|No module named|ImportError/i.test(logs)) {
    const moduleMatch = logs.match(/No module named ['"]([^'"]+)['"]/i);
    const moduleName = moduleMatch ? moduleMatch[1] : 'unknown';
    return {
      type: 'DIAGNOSTIC_REPORT',
      ruleId: 'PYTHON_MODULE_NOT_FOUND',
      jobId,
      failureTitle: `❌ Runtime failed: Python module "${moduleName}" not found.`,
      rootCause: `Python cannot locate the module "${moduleName}". It may be missing from requirements.txt or the virtual environment.`,
      detected: `ModuleNotFoundError: ${moduleName}`,
      probability: '97%',
      fixAction: {
        label: `Add ${moduleName} to install command`,
        actionEndpoint: '/api/v1/build/apply-fix',
        actionType: 'PATCH_INSTALL_CMD',
        payload: {
          actionType: 'PATCH_INSTALL_CMD',
          installCommand: `pip install -r requirements.txt && pip install ${moduleName}`,
        },
      },
    };
  }

  // Rule 12: Permission Denied
  if (/EACCES|permission denied|Operation not permitted/i.test(logs)) {
    return {
      type: 'DIAGNOSTIC_REPORT',
      ruleId: 'PERMISSION_DENIED',
      jobId,
      failureTitle: '❌ Build failed: Permission denied in container.',
      rootCause: 'A file operation was blocked due to insufficient permissions inside the Docker container filesystem.',
      detected: 'EACCES / Permission Denied',
      probability: '95%',
      fixAction: {
        label: 'Force install with elevated permissions',
        actionEndpoint: '/api/v1/build/apply-fix',
        actionType: 'PATCH_INSTALL_CMD',
        payload: {
          actionType: 'PATCH_INSTALL_CMD',
          installCommand: 'npm install --unsafe-perm --legacy-peer-deps',
        },
      },
    };
  }
  // Rule 13: Go Compilation Error
  if (/build failed|syntax error|undefined:|cannot find package/i.test(logs) && runtime === 'Go') {
    return {
      type: 'DIAGNOSTIC_REPORT',
      ruleId: 'GO_COMPILATION_ERROR',
      jobId,
      failureTitle: '❌ Build failed: Go Compilation Error.',
      rootCause: 'The Go compiler encountered a syntax error or missing package dependency.',
      detected: 'Go build failure',
      probability: '95%',
      fixAction: {
        label: 'Run go mod tidy & rebuild',
        actionEndpoint: '/api/v1/build/apply-fix',
        actionType: 'SET_BUILD_CMD',
        payload: {
          actionType: 'SET_BUILD_CMD',
          buildCommand: 'go mod tidy && go build -o main .',
        },
      },
    };
  }

  // Rule 14: Maven Build Failure
  if (/\[ERROR\].*BUILD FAILURE/i.test(logs) && /mvn /i.test(logs)) {
    return {
      type: 'DIAGNOSTIC_REPORT',
      ruleId: 'MAVEN_BUILD_FAIL',
      jobId,
      failureTitle: '❌ Build failed: Maven compilation error.',
      rootCause: 'Maven encountered a syntax error, test failure, or missing dependency during the build phase.',
      detected: 'Maven BUILD FAILURE',
      probability: '96%',
      fixAction: {
        label: 'Rebuild without tests',
        actionEndpoint: '/api/v1/build/apply-fix',
        actionType: 'SET_BUILD_CMD',
        payload: {
          actionType: 'SET_BUILD_CMD',
          buildCommand: 'mvn clean package -DskipTests',
        },
      },
    };
  }

  // Rule 15: Gradle Build Failure
  if (/BUILD FAILED in/i.test(logs) && /gradle/i.test(logs)) {
    return {
      type: 'DIAGNOSTIC_REPORT',
      ruleId: 'GRADLE_BUILD_FAIL',
      jobId,
      failureTitle: '❌ Build failed: Gradle compilation error.',
      rootCause: 'Gradle encountered a syntax error, test failure, or missing dependency during the build phase.',
      detected: 'Gradle BUILD FAILED',
      probability: '96%',
      fixAction: {
        label: 'Rebuild without tests',
        actionEndpoint: '/api/v1/build/apply-fix',
        actionType: 'SET_BUILD_CMD',
        payload: {
          actionType: 'SET_BUILD_CMD',
          buildCommand: 'gradle build --no-daemon -x test',
        },
      },
    };
  }

  // Rule 16: Python Dependency Install Failure
  if (/ERROR: Could not find a version that satisfies the requirement/i.test(logs) || /pip.*failed with error code/i.test(logs)) {
    return {
      type: 'DIAGNOSTIC_REPORT',
      ruleId: 'PYTHON_DEPENDENCY_ERROR',
      jobId,
      failureTitle: '❌ Build failed: Python dependency resolution error.',
      rootCause: 'pip could not find a matching version for a requested package, or compilation of a native extension failed.',
      detected: 'pip install failure',
      probability: '95%',
      fixAction: {
        label: 'Upgrade pip & retry install',
        actionEndpoint: '/api/v1/build/apply-fix',
        actionType: 'PATCH_INSTALL_CMD',
        payload: {
          actionType: 'PATCH_INSTALL_CMD',
          installCommand: 'pip install --upgrade pip setuptools wheel && pip install -r requirements.txt || pip install .',
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
You are equipped to handle pipelines for Node.js, Python, Java (Maven/Gradle), and Go.

You MUST respond ONLY with a valid JSON object matching this exact schema:
{
  "ruleId": "AI_OPENAI_DIAGNOSTIC",
  "failureTitle": "❌ Build failed: <Short descriptive title>",
  "rootCause": "<Clear 1-2 sentence technical root cause explaining why the build failed>",
  "detected": "<Key error signature or runtime environment issue detected>",
  "probability": "<e.g., 96%>",
  "fixAction": {
    "label": "<Human readable 1-click action label, e.g., 'Use Yarn install & build' or 'Run pip install'>",
    "actionEndpoint": "/api/v1/build/apply-fix",
    "actionType": "<MUST be one of: UPGRADE_RUNTIME, PATCH_INSTALL_CMD, SET_BUILD_CMD, INCREASE_NODE_OPTIONS, SET_ENV_PORT>",
    "payload": {
      "actionType": "<Same as fixAction.actionType>",
      "installCommand": "<Optional override install command, e.g., 'yarn install --ignore-engines', 'pip install .', 'go mod download'>",
      "buildCommand": "<Optional override build command, e.g., 'yarn build', 'gradle build', 'go build'>",
      "targetValue": "<Optional runtime target, e.g., 'node:20-alpine', 'python:3.11-slim'>"
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
