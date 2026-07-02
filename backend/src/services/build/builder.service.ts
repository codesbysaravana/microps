import { Queue, Worker } from 'bullmq';
import { runBuildPipeline } from './github-actions.provider';
import { projectsDB } from '../../repository/project.repository';
import { deployServiceECS } from './deploy.service';
import { runPreflightAnalysis } from '../preflight/engine.service';
import { envStoreCreate } from '../../repository/env.repository';
import { buildBus } from '../../utils/eventBus';
import { EncryptedEnvPayload } from '../../utils/encryptEnv';

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
COPY package*.json ./
RUN ${nodeInstall}
COPY . .
RUN ${nodeBuild}
EXPOSE 3000
CMD ["npm", "start"]
DOCKEREOF
  elif [ -f requirements.txt ]; then
    cat << 'DOCKEREOF' > Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "app.py"]
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
fi

echo "====== MicrOps Orchestrator: Building Docker Image ======"
docker build --pull -t microps-registry/${projectName}:${uniqueJobId} .

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
  const cleanProjectName = sanitizeProjectName(projectName, repoUrl);

  try {
    const tenantScript = generateTenantScript(repoUrl, branch, buildCommand, cleanProjectName, jobId, userId, installCommand, runtime);
    buildBus.emit('build-progress', { userId, jobId, message: '<------ Build running started by the worker ------>' });
    
    const finalStatus = await runBuildPipeline(tenantScript, jobId, userId);

    if (finalStatus.result === 'SUCCESS') {
      buildBus.emit('build-progress', { userId, jobId, message: '<------ Build Successful by the worker ------>' });

      const imageURI = `${ECR_REGISTRY_URL}/microps-hq:tenant-${userId}-${cleanProjectName}-${jobId}`;
      await deployServiceECS(userId, cleanProjectName, imageURI, encryptedGCM, projectId);
      return finalStatus;
    } else {
      throw new Error(`Cloud Container Build Failed with status: ${finalStatus.result}`);
    }
  } catch (error: any) {
    console.error(`[WORKER] Error processing job ${jobId}:`, error.message);
    buildBus.emit('build-progress', { userId, jobId, message: `❌ WORKER FAILED: ${error.message}` });
    throw error;
  }
}, { connection: redisConnection });
