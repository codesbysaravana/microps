import { Queue, Worker } from 'bullmq';
import { runBuildPipeline } from './github-actions.provider';
import { projectsDB, applyProjectFixDB } from '../../repository/project.repository';
import { deployServiceECS } from './deploy.service';
import { runPreflightAnalysis } from '../preflight/engine.service';
import { envStoreCreate } from '../../repository/env.repository';
import { buildBus } from '../../utils/eventBus';
import { EncryptedEnvPayload } from '../../utils/encryptEnv';
import { getSandboxDockerBuildFlags, SANDBOX_CONFIG } from '../../config/build.sandbox';
import { analyzeBuildFailure } from '../diagnostics/diagnostic.engine';
import { emailService } from '../email.service';
import { userRepository } from '../../repository/user.repository';

const MAX_AUTO_RETRIES = 2;

// Safe, deterministic rule IDs that can be auto-applied without user confirmation
const SAFE_AUTO_FIX_RULES = new Set([
  'NPM_PEER_DEPS_CONFLICT',
  'COMMAND_BINARY_MISSING',
  'NODE_ENGINE_MISMATCH',
  'MISSING_BUILD_SCRIPT',
  'MISSING_START_SCRIPT',
  'TS_COMPILATION_ERRORS',
  'VITE_BUILD_FAIL',
  'PORT_BIND_CONFLICT',
  'PERMISSION_DENIED',
  'PYTHON_MODULE_NOT_FOUND',
]);

const AWS_REGION = process.env.AWS_REGION || 'ap-southeast-2';
const ECR_REGISTRY_URL = process.env.ECR_REGISTRY_URL || '688567265418.dkr.ecr.ap-southeast-2.amazonaws.com';
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

// Assuming a standard Redis connection for BullMQ
const redisConnection = { host: REDIS_HOST, port: REDIS_PORT };

const buildQueue = new Queue('tenant-builds', { connection: redisConnection });

export function sanitizeProjectName(name?: string, fallbackUrl?: string): string {
  let rawName = name || '';
  if (!rawName.trim() && fallbackUrl) {
    const parts = fallbackUrl.replace(/\.git$/i, '').split('/');
    rawName = parts[parts.length - 1] || 'app';
  }
  const clean = rawName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return clean || 'app';
}

export const buildInitializer = async (
  userId: number,
  repoUrl: string,
  branch: string,
  buildCommand: string,
  projectName: string,
  encryptedGCM: EncryptedEnvPayload | null,
  customOverrides?: { installCommand?: string; buildCommand?: string; runtime?: string; projectId?: number }
) => {
  const cleanProjectName = sanitizeProjectName(projectName, repoUrl);
  buildBus.emit('build-progress', { userId, message: '<------ Running Pre-Flight Intelligence Scanner ------>' });

  const preflightObj = await runPreflightAnalysis(repoUrl);

  buildBus.emit('build-progress', { userId, message: `Scanner Result: ${preflightObj.success ? 'PASSED' : 'FAILED'}` });

  if (!preflightObj.success) {
    buildBus.emit('build-progress', { userId, message: '❌ Pre-Flight Blockers detected. Deployment halted to save build minutes.' });
    return { status: 'Halted', reason: 'Pre-flight failed' };
  }

  // v2: Auto-apply preflight fixes before burning build minutes
  if (preflightObj.preflightFixes && preflightObj.preflightFixes.length > 0 && !customOverrides?.installCommand && !customOverrides?.buildCommand) {
    for (const fix of preflightObj.preflightFixes) {
      buildBus.emit('build-progress', { userId, message: `[AI Preflight] 🔧 Auto-applying: ${fix.value} (${fix.reason})` });
      if (fix.fix === 'SET_INSTALL_CMD') {
        customOverrides = { ...customOverrides, installCommand: fix.value };
      } else if (fix.fix === 'SET_BUILD_CMD') {
        customOverrides = { ...customOverrides, buildCommand: fix.value };
      }
    }
  }

  buildBus.emit('build-progress', { userId, message: '<------ Starting Build Stage ------>' });

  const language = customOverrides?.runtime || preflightObj.radar.runtime || 'javascript';
  const framework = preflightObj.radar.framework || 'unknown';
  let installCommand = customOverrides?.installCommand || 'npm install';
  if (!customOverrides?.installCommand) {
    if (language === 'Python') installCommand = 'pip install -r requirements.txt';
    else if (language === 'Go') installCommand = 'go mod download';
    else if (language === 'Java') installCommand = 'mvn clean install';
  }
  const finalBuildCommand = customOverrides?.buildCommand !== undefined ? customOverrides.buildCommand : buildCommand;

  let projectId = customOverrides?.projectId;
  if (!projectId) {
    const dbresponse = await projectsDB(userId, repoUrl, branch, language, framework, installCommand, finalBuildCommand, cleanProjectName);
    projectId = dbresponse?.id || 1;
    if (encryptedGCM && projectId) {
      await envStoreCreate(projectId, encryptedGCM);
    }
  }

  const uniqueJobId = `build-${Date.now()}`;

  const job = await buildQueue.add('execute-build', {
    userId,
    repoUrl,
    branch,
    buildCommand: finalBuildCommand,
    projectName: cleanProjectName,
    runtime: language,
    installCommand,
    jobId: uniqueJobId,
    encryptedGCM,
    projectId,
  });

  buildBus.emit('build-progress', { userId, jobId: job.id, message: '<------ Queued for Build Worker ------>' });

  return {
    status: 'queued',
    jobId: job.id,
    projectId: projectId,
    internalId: uniqueJobId,
    message: 'Build is waiting in queue.',
  };
};

function sanitizeCommand(cmd: string) {
  return cmd.replace(/[;&|$><`\n]/g, '');
}

function generateTenantScript(repoUrl: string, branch: string, buildCommand: string, projectName: string, uniqueJobId: string, userId: number, installCommand?: string, runtime?: string) {
  const nodeRuntime = runtime || 'node:20-alpine';
  const nodeInstall = installCommand || 'npm install --legacy-peer-deps';
  const nodeBuild = buildCommand || 'npm run build --if-present';

  return `#!/bin/bash
set -e

echo "====== MicrOps Orchestrator: Initializing Workspace ======"
WORKSPACE_DIR="tenant-workspace-${uniqueJobId}"
git clone --branch ${branch} ${repoUrl} $WORKSPACE_DIR 2>/dev/null || git clone ${repoUrl} $WORKSPACE_DIR
cd $WORKSPACE_DIR

if [ ! -f Dockerfile ]; then
  echo "====== MicrOps Orchestrator: No Dockerfile found. Generating Standard Buildpack Container ======"
  if [ -f package.json ]; then
    cat << 'DOCKEREOF' > Dockerfile
FROM ${nodeRuntime}
WORKDIR /app
RUN npm install -g serve
COPY package*.json ./
RUN ${nodeInstall}
COPY . .
RUN ${nodeBuild}
EXPOSE 3000
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'if node -e "const s=require(\"./package.json\").scripts||{}; process.exit(s.start?0:1)" 2>/dev/null; then exec npm start; elif node -e "const s=require(\"./package.json\").scripts||{}; process.exit(s.preview?0:1)" 2>/dev/null; then exec npm run preview -- --host 0.0.0.0 --port 3000; elif [ -d dist ]; then exec serve -s dist -l 3000; elif [ -d build ]; then exec serve -s build -l 3000; elif [ -d out ]; then exec serve -s out -l 3000; elif node -e "const s=require(\"./package.json\").scripts||{}; process.exit(s.dev?0:1)" 2>/dev/null; then exec npm run dev -- --host 0.0.0.0 --port 3000; elif [ -f server.js ]; then exec node server.js; elif [ -f index.js ]; then exec node index.js; else echo "Falling back to static root serving (Vercel-style)..."; exec serve -s . -l 3000; fi' >> /app/start.sh && \
    chmod +x /app/start.sh
CMD ["/app/start.sh"]
DOCKEREOF
  elif [ -f requirements.txt ]; then
    cat << 'DOCKEREOF' > Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV PORT=3000
EXPOSE 3000
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'if [ -f main.py ]; then exec uvicorn main:app --host 0.0.0.0 --port 3000; elif [ -f app.py ]; then exec uvicorn app:app --host 0.0.0.0 --port 3000; elif [ -f manage.py ]; then exec python manage.py runserver 0.0.0.0:3000; else exec python -m http.server 3000; fi' >> /app/start.sh && \
    chmod +x /app/start.sh
CMD ["/app/start.sh"]
DOCKEREOF
  elif [ -f pyproject.toml ]; then
    cat << 'DOCKEREOF' > Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN pip install --no-cache-dir .
ENV PORT=3000
EXPOSE 3000
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'if [ -f main.py ]; then exec uvicorn main:app --host 0.0.0.0 --port 3000; elif [ -f app.py ]; then exec uvicorn app:app --host 0.0.0.0 --port 3000; elif [ -f manage.py ]; then exec python manage.py runserver 0.0.0.0:3000; else exec python -m http.server 3000; fi' >> /app/start.sh && \
    chmod +x /app/start.sh
CMD ["/app/start.sh"]
DOCKEREOF
  elif [ -f Pipfile ]; then
    cat << 'DOCKEREOF' > Dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN pip install pipenv
COPY Pipfile Pipfile.lock* ./
RUN pipenv install --system --deploy
COPY . .
ENV PORT=3000
EXPOSE 3000
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'if [ -f main.py ]; then exec uvicorn main:app --host 0.0.0.0 --port 3000; elif [ -f app.py ]; then exec uvicorn app:app --host 0.0.0.0 --port 3000; elif [ -f manage.py ]; then exec python manage.py runserver 0.0.0.0:3000; else exec python -m http.server 3000; fi' >> /app/start.sh && \
    chmod +x /app/start.sh
CMD ["/app/start.sh"]
DOCKEREOF
  elif [ -f go.mod ]; then
    cat << 'DOCKEREOF' > Dockerfile
FROM golang:1.21-alpine AS build
WORKDIR /app
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN go build -o main .

FROM alpine:latest
WORKDIR /app
COPY --from=build /app/main .
ENV PORT=3000
EXPOSE 3000
CMD ["./main"]
DOCKEREOF
  elif [ -f pom.xml ]; then
    cat << 'DOCKEREOF' > Dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B 2>/dev/null || true
COPY src ./src
RUN mvn package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENV SERVER_PORT=3000
EXPOSE 3000
ENTRYPOINT ["java", "-Dserver.port=3000", "-jar", "app.jar"]
DOCKEREOF
  elif [ -f build.gradle ] || [ -f build.gradle.kts ]; then
    cat << 'DOCKEREOF' > Dockerfile
FROM gradle:8.2-jdk17 AS build
WORKDIR /app
COPY . .
RUN gradle build --no-daemon -x test

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
ENV SERVER_PORT=3000
EXPOSE 3000
ENTRYPOINT ["java", "-Dserver.port=3000", "-jar", "app.jar"]
DOCKEREOF
  else
    cat << 'DOCKEREOF' > Dockerfile
FROM ubuntu:latest
WORKDIR /app
COPY . .
CMD ["echo", "Container running"]
DOCKEREOF
  fi
else
  echo "====== MicrOps Orchestrator: Auditing & Auto-Healing Tenant Dockerfile ======"
  # Automatically patch fragile 'npm ci' commands with resilient install command
  sed -i 's/RUN npm ci.*/RUN ${nodeInstall}/g' Dockerfile 2>/dev/null || true
  sed -i 's/RUN npm install.*/RUN ${nodeInstall}/g' Dockerfile 2>/dev/null || true
  sed -i 's/npm ci.*/${nodeInstall}/g' Dockerfile 2>/dev/null || true

  # FIX #1: Targeted port normalization — rewrite EXPOSE, --port, -p declarations, and quoted exec arrays
  # This avoids corrupting arbitrary strings while catching CMD ["--port", "8000"]
  for OLD_PORT in 8000 8080 5000 4000 9000; do
    sed -i "s/EXPOSE $OLD_PORT/EXPOSE 3000/g" Dockerfile 2>/dev/null || true
    sed -i "s/--port[= \"]*$OLD_PORT/--port 3000/g" Dockerfile 2>/dev/null || true
    sed -i "s/-p[= \"]*$OLD_PORT/-p 3000/g" Dockerfile 2>/dev/null || true
    sed -i "s/:$OLD_PORT/:3000/g" Dockerfile 2>/dev/null || true
    sed -i "s/\"$OLD_PORT\"/\"3000\"/g" Dockerfile 2>/dev/null || true
  done
fi

echo "====== MicrOps Orchestrator: Building Docker Image (Sandboxed) ======"
# Sandbox: resource-limited build to prevent tenant code from exhausting host
timeout ${SANDBOX_CONFIG.BUILD_TIMEOUT_SECONDS}s docker build --pull ${getSandboxDockerBuildFlags()} -t microps-registry/${projectName}:${uniqueJobId} .

echo "====== MicrOps Orchestrator: Logging into AWS ECR ======"
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY_URL}

echo "====== MicrOps Orchestrator: Tagging Image ======"
docker tag microps-registry/${projectName}:${uniqueJobId} ${ECR_REGISTRY_URL}/microps-hq:tenant-${userId}-${projectName}-${uniqueJobId}

echo "====== MicrOps Orchestrator: Pushing Image ======"
docker push ${ECR_REGISTRY_URL}/microps-hq:tenant-${userId}-${projectName}-${uniqueJobId}

echo "====== MicrOps Orchestrator: Cleaning Up ======"
docker image rm ${ECR_REGISTRY_URL}/microps-hq:tenant-${userId}-${projectName}-${uniqueJobId} || true
docker image rm microps-registry/${projectName}:${uniqueJobId} || true

cd ..
rm -rf $WORKSPACE_DIR
echo "Build & Push completed successfully!"
`;
}

export const buildWorker = new Worker('tenant-builds', async (job) => {
  const { repoUrl, branch, buildCommand, projectName, jobId, userId, encryptedGCM, installCommand, runtime, projectId } = job.data;
  const attempt = job.data.attempt || 1;
  const cleanProjectName = sanitizeProjectName(projectName, repoUrl);

  try {
    const tenantScript = generateTenantScript(repoUrl, branch, buildCommand, cleanProjectName, jobId, userId, installCommand, runtime);
    buildBus.emit('build-progress', { userId, jobId, message: `<------ Build running started by the worker (attempt ${attempt} of ${MAX_AUTO_RETRIES + 1}) ------>` });
    
    const finalStatus = await runBuildPipeline(tenantScript, jobId, userId);

    if (finalStatus.result === 'SUCCESS') {
      buildBus.emit('build-progress', { userId, jobId, message: '<------ Build Successful by the worker ------>' });

      const imageURI = `${ECR_REGISTRY_URL}/microps-hq:tenant-${userId}-${cleanProjectName}-${jobId}`;
      await deployServiceECS(userId, cleanProjectName, imageURI, encryptedGCM, projectId);
      return finalStatus;
    } else {
      const err: any = new Error(`Cloud Container Build Failed with status: ${finalStatus.result}`);
      err.diagnosticReport = (finalStatus as any).diagnosticReport;
      err.rawLogs = (finalStatus as any).rawLogs;
      throw err;
    }
  } catch (error: any) {
    console.error(`[WORKER] Error processing job ${jobId} (attempt ${attempt}):`, error.message);

    // --- Autonomous Self-Healing Retry Loop ---
    if (attempt <= MAX_AUTO_RETRIES) {
      try {
        // Analyze what went wrong using the pre-computed diagnostic report, or fallback to real raw logs
        let diagnostic = error.diagnosticReport;
        if (!diagnostic) {
          diagnostic = await analyzeBuildFailure(error.rawLogs || error.message || '', jobId, runtime);
        }

        // Only auto-apply safe, deterministic fixes (not probabilistic AI suggestions)
        if (diagnostic.fixAction && SAFE_AUTO_FIX_RULES.has(diagnostic.ruleId)) {
          buildBus.emit('build-progress', {
            userId,
            jobId,
            message: `[AI Agent] 🔍 Diagnosed: ${diagnostic.failureTitle}`,
          });
          buildBus.emit('build-progress', {
            userId,
            jobId,
            message: `[AI Agent] 🔧 Auto-applying fix: ${diagnostic.fixAction.label}`,
          });

          // Persist the fix to the project database record
          const fixPayload = diagnostic.fixAction.payload;
          const updates: { installCommand?: string; buildCommand?: string; language?: string } = {};
          if (fixPayload.installCommand) updates.installCommand = fixPayload.installCommand;
          if (fixPayload.buildCommand) updates.buildCommand = fixPayload.buildCommand;
          if (fixPayload.targetValue) updates.language = fixPayload.targetValue;

          if (projectId && Object.keys(updates).length > 0) {
            await applyProjectFixDB(userId, projectId, updates);
          }

          // Re-queue the build with the patched config
          const retryJobId = `build-retry-${attempt}-${Date.now()}`;
          buildBus.emit('build-progress', {
            userId,
            jobId,
            message: `[AI Agent] 🔄 Retrying build (attempt ${attempt + 1} of ${MAX_AUTO_RETRIES + 1})...`,
          });

          await buildQueue.add('execute-build', {
            userId,
            repoUrl,
            branch,
            buildCommand: fixPayload.buildCommand || buildCommand,
            projectName: cleanProjectName,
            runtime: fixPayload.targetValue || runtime,
            installCommand: fixPayload.installCommand || installCommand,
            jobId: retryJobId,
            encryptedGCM,
            projectId,
            attempt: attempt + 1,
          });

          return; // Exit this worker cleanly — the retry job will handle the rest
        }
      } catch (retryErr: any) {
        console.error(`[WORKER] Self-healing retry failed:`, retryErr.message);
      }
    }

    // If we exhausted retries or the fix isn't safe to auto-apply, show the error
    buildBus.emit('build-progress', { userId, jobId, message: `❌ WORKER FAILED: ${error.message}` });
    if (attempt > MAX_AUTO_RETRIES) {
      buildBus.emit('build-progress', {
        userId,
        jobId,
        message: `[AI Agent] ⚠️ All ${MAX_AUTO_RETRIES + 1} attempts exhausted. Manual intervention required — use the "Apply Fix" button above.`,
      });

      // Notify user via email that their build failed
      userRepository.findById(userId).then(user => {
        if (user?.email && !user.email.includes('noreply.github.com')) {
          emailService.sendDeploymentFailedEmail(user.email, projectName, error.message).catch(console.error);
        }
      }).catch(console.error);
    }
    throw error;
  }
}, { connection: redisConnection, concurrency: 5 });
