# MicrOps Production Deployment & Debugging Error Log

This document is the exhaustive chronological error and debugging log for the live production deployment of MicrOps on AWS (`http://13.238.226.195`). Every debugging command executed, root cause identified, and resolution applied is documented below.

---

## 📊 Comprehensive Log Entries Table

| Timestamp | Step Executed | Component / Service | Exact Command Executed | Error / Observation | Root Cause Analysis | Resolution Applied | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `2026-06-30T15:05:00Z` | Frontend API Client Auditing | Frontend (`api.ts`) | Code Inspection | Hardcoded `http://localhost:8000/api/v1` | Frontend build lacked dynamic environment variable support for production Elastic IP domains. | Updated `frontend/src/lib/api.ts` to use `import.meta.env.VITE_API_URL || 'http://13.238.226.195/api/v1'`. | Fully Resolved |
| `2026-06-30T15:20:00Z` | Reverse Proxy Setup | Nginx on EC2 | `sudo nano /etc/nginx/sites-available/default`<br>`sudo nginx -t && sudo systemctl reload nginx` | Direct port access required (3000/8000) | SPA and API were exposed on separate ports without unified HTTP routing. | Configured Nginx reverse proxy on Port 80: served React build from `/var/www/microps-frontend` and proxied `/api/` to PM2 port 8000. | Fully Resolved |
| `2026-06-30T15:45:00Z` | Frontend Deployment Execution | Web Dashboard (`Dashboard.tsx`) | User Clicked "Deploy" for `https://github.com/codesbysaravana/portfolio` | `Live log stream disconnected.` immediately upon deployment initialization. | `EventSource` URL in `Dashboard.tsx` line 66 was hardcoded to `http://localhost:8000/api/v1/build/stream?token=...`, failing in external browsers. | Replaced hardcoded localhost string with dynamic `${BASE_URL}/build/stream?token=${token}`. Rebuilt SPA (`npm run build`) and re-deployed to EC2 and S3. | Fully Resolved |
| `2026-06-30T15:57:00Z` | Live Telemetry Streaming Audit | Frontend Source (`Dashboard.tsx`) | `grep_search` query: `Live log stream disconnected` | Line 76 triggered `eventSource.onerror` | Investigation confirmed `EventSource` attempted local loopback connection instead of production Elastic IP. | Exported `BASE_URL` from `lib/api.ts` and imported into `Dashboard.tsx`. | Fully Resolved |
| `2026-06-30T15:58:00Z` | Frontend Artifact Sync | Terminal / AWS CLI | `tar -czvf frontend-deploy.tar.gz -C dist .`<br>`aws s3 sync dist s3://microps-client --delete`<br>`scp -i microps.pem frontend-deploy.tar.gz ubuntu@13.238.226.195:/home/ubuntu/` | Syncing updated build artifact | Frontend build needed propagation across EC2 Nginx web root and S3 hosting bucket. | Transferred tarball and extracted directly into `/var/www/microps-frontend/` via SSH. | Fully Resolved |
| `2026-06-30T15:59:00Z` | Backend API Pipeline Verification | Node.js Test Script via SSH/HTTP | `node -e "fetch('http://13.238.226.195/api/v1/auth/signup', ...)"` | `401 Unauthorized: Invalid or expired token` | The signup endpoint returns user metadata only; JWT generation occurs strictly on `/api/v1/auth/login`. | Chained authentication workflow: execute `POST /auth/signup` followed by `POST /auth/login` to extract `data.token`. | Fully Resolved |
| `2026-06-30T16:01:00Z` | BullMQ Worker Queue Audit | Redis on EC2 | `ssh ... "redis-cli keys '*'"`<br>`ssh ... "redis-cli zrange bull:tenant-builds:failed 0 -1"` | Job 7 failed with `Cloud Container Build Failed with status: FAILURE` | Job dispatched to GitHub Actions runner failed during build execution step. | Investigated GitHub Actions workflow run logs via backend API payload inspection. | Root Cause Found |
| `2026-06-30T16:03:00Z` | GitHub Runner Step Failure Analysis | EC2 Node Script | `node /tmp/check_runner.js` querying GitHub API `/actions/runs` | `FAILED STEP: Execute Tenant Build Script`<br>`sh: 1: next: not found`<br>`Exit code 127` | The runner executed an outdated build script (`npm run build` / `next build`) on the host runner VM rather than inside our container builder. | Investigated worker process concurrency on EC2 server to see why outdated script was generated. | Root Cause Found |
| `2026-06-30T16:04:00Z` | Concurrency & Process Collision Audit | Docker & Node Processes on EC2 | `ssh ... "docker ps -a && ps aux | grep -E 'node|pm2|worker'"` | Legacy container `8d256649522e` (`microps-backend:latest`) running for 25 hours alongside PM2. | A zombie legacy Docker container running an old version of `BuildService.js` was connected to Redis queue `tenant-builds` and stealing jobs before PM2 could process them. | Executed `docker stop 8d256649522e && docker rm 8d256649522e`. Restarted PM2 cluster (`pm2 restart microps-backend`). | Fully Resolved |
| `2026-06-30T16:06:00Z` | End-to-End Live Verification | Live Portfolio Deployment | Node Verification Harness triggering Job ID `8` (`build-1782835599963`) | Complete SSE Telemetry Streaming | Clean PM2 worker processed job, generated modern container build script, dispatched VM Run #21 (`SUCCESS`), and pushed image to ECR. | Monitored full lifecycle to container deployment completion. | Fully Resolved |
| `2026-06-30T16:09:00Z` | ECS Serverless Container Validation | AWS ECS Fargate | `aws ecs describe-tasks --cluster microps-tenant-cluster --region ap-southeast-2` | Task `a039ae25e3d7474ba618f680125ea643` in `RUNNING` state | Live verification confirmed ECR image `tenant-12-portfolio-build-1782835599963` deployed successfully as a running Fargate task. | Production SaaS pipeline verified end-to-end. | Fully Resolved |
| `2026-07-01T13:40:00Z` | Autonomous Diagnostic Engine Implementation | Backend & Frontend (`diagnostic.engine.ts`, `Dashboard.tsx`) | `npm run build` across backend & frontend | Build failures dumped unparsed terminal output (`Exit code 1`), requiring manual googling. | Created heuristic root-cause diagnostic engine (`analyzeBuildFailure`), added One-Click Fix API (`POST /api/v1/build/apply-fix`), and rendered glowing UI remediation card. | Deployed updated backend to PM2 cluster and frontend SPA to AWS S3 & Nginx web root. | Fully Resolved |
| `2026-07-02T04:13:00Z` | Container Multi-Stage Build Failure | Frontend (`ConfigPanel.tsx`) & Build Worker | Runner logs: `11 | >>> RUN npm start`<br>`process "/bin/sh -c npm start" did not complete successfully: exit code: 127` | UI Deployment Config Panel passed input field labeled "Start Command" (`npm start`) as `installCommand`. The auto-healing script replaced `RUN npm ci` in tenant Dockerfile with `RUN npm start`, causing execution before node modules were installed or built. | Added dedicated `installCommand` state & form field (`npm install --legacy-peer-deps`) in `ConfigPanel.tsx`. Verified One-Click Fix (`⚡ Apply Fix`) successfully re-dispatched Job #49 and completed Fargate container deployment. | Fully Resolved |
| `2026-07-02T04:30:00Z` | AWS ALB Routing 404 Error | AWS Application Load Balancer (`microps-tenant-alb`) | Browser access to `http://tenant-19-portfolio.microps.in` | ALB default listener returned `MicrOps Deployment Not Found` despite ECS Fargate service reporting 1 Running healthy task. | Initial service creation (`!serviceExists`) registered ALB Listener Rule with condition `Host is "tenant-19-portfolio.localhost"`. Subsequent updates (`else` branch) ran `UpdateServiceCommand` on ECS but did not modify the ALB Listener Rule condition when `BASE_DOMAIN` changed to `microps.in`. | Updated `deploy.service.ts` to inspect and update existing ALB Listener Rules (`ModifyRuleCommand`) during service updates or recreate stale routing rules. | Fully Resolved |
| `2026-07-03T08:40:00Z` | AWS ALB Rule Shadowing & 503 Error | AWS Application Load Balancer (`microps-tenant-alb`) | Browser access to `http://tenant-7-portfolio.microps.in` | ALB returned `503 Service Temporarily Unavailable` even though ECS task `dda72c119fcd49e3` was active and healthy on Target Group `tg-u7-portfolio-713125`. | ALB Listener evaluated rules in order of Priority. Rule Priority 101 matched host `tenant-7-portfolio.microps.in` and forwarded to legacy empty target group `tg-u7-portfolio-034791` (`Targets: []`). Because Rule 101 matched an empty target group, ALB returned 503 before evaluating Rule Priority 109 where the active healthy task resided. | Executed `DeleteRuleCommand` on ALB Listener to eliminate stale Priority 101 rule. Verified `HTTP/1.1 200 OK` return code on live endpoint. | Fully Resolved |
| `2026-07-03T09:05:00Z` | Container Crash Exit Code 1 (`Missing script: "start"`) | AWS ECS Fargate & Fallback Dockerpack (`builder.service.ts`) | CloudWatch Logs for `nephele-frontend` container | Container exited immediately with code 1 (`npm error Missing script: "start"`). | Fallback Dockerfile auto-generator hardcoded `CMD ["npm", "start"]`. React/Vite SPAs output static bundles (`dist/`) and lack a `start` script in `package.json`. | Upgraded Node container buildpack to install `serve` globally and run universal runtime entrypoint (`sh -c`) that inspects `package.json` scripts and serves static build folders (`dist/`, `build/`, `out/`) automatically. Added Rule 6 (`MISSING_START_SCRIPT`) to diagnostic engine. | Fully Resolved |
| `2026-07-03T09:35:00Z` | Frontend Environment Variable Vault Bridge | Frontend (`ConfigPanel.tsx`) & API Client | Code & Pipeline Audit | Environment variables entered in UI table did not reach running ECS container. | `ConfigPanel.tsx` line 156 omitted `envVars` state from the `onClick` handler when calling `onDeploy()`, preventing encrypted vault propagation. | Formatted `envVars` into newline-delimited `KEY=VALUE` string inside `onClick` handler and passed `envContent` through `DeploymentControlCenter.tsx` to `buildService.deploy()`. | Fully Resolved |
| `2026-07-03T10:13:00Z` | Container Syntax Crash (`/bin/sh: [sh,: not found`) | AWS ECS Fargate Container Runtime | CloudWatch Logs for `nephele-frontend` | Container stopped immediately with `/bin/sh: [sh,: not found`. | Inline JSON exec array `CMD ["sh", "-c", "if node -e..."]` contained nested escaped quotes inside a shell heredoc, causing Docker to fall back to `/bin/sh -c 'CMD ["sh", ...]'` where `/bin/sh` tried executing `["sh",` as a binary. | Replaced inline JSON command strings with dedicated shell script creation (`RUN echo '#!/bin/sh' > /app/start.sh...`) and clean entrypoint `CMD ["/app/start.sh"]`. | Fully Resolved |
| `2026-07-03T10:22:00Z` | Dockerfile Heredoc Parse Error (`unknown instruction: if`) | GitHub Actions Build Runner | Runner build log: `dockerfile parse error on line 11: unknown instruction: if` | Docker container build failed during build stage. | Standard Dockerfile syntax (without BuildKit `# syntax=docker/dockerfile:1.4` header) does not support multi-line heredocs (`RUN cat << 'EOF' > ...`). Docker parsed line 11 (`if node -e...`) as a top-level Dockerfile instruction. | Replaced heredoc blocks with standard POSIX multi-line commands chained via backslashes (`\`) and `echo` (`RUN echo '#!/bin/sh' > /app/start.sh && echo 'if...' >> /app/start.sh`). | Fully Resolved |
| `2026-07-03T10:33:00Z` | Browser HTTPS Auto-Upgrade (`ERR_CONNECTION_REFUSED`) | Brave Browser Shields & AWS ALB | Browser access to `tenant-19-nephele-frontend.microps.in` | Brave returned `ERR_CONNECTION_REFUSED` while CLI `curl http://...` returned `200 OK`. | Brave Shields / HTTPS-First mode automatically upgraded the typed domain from Port 80 (`http://`) to Port 443 (`https://`). Since ALB only has a Port 80 HTTP listener active, Port 443 connection packets are refused by AWS. | Explicitly protocol-prefixed `http://` in browser bar or disabled Brave Shields HTTPS auto-upgrade for `microps.in`. | Fully Resolved |

---

## 🛠️ Complete Chronological Debugging Command Log

Below is the complete transcript of exact diagnostic and remediation commands executed during the troubleshooting process:

### 1. Codebase Search for Telemetry Disconnects
```powershell
# Searched frontend codebase for disconnected stream error string
grep_search --SearchPath "c:\Users\csara\Downloads\java-backend-mrcooper\microps\production\frontend\src" --Query "Live log stream disconnected"

# Searched for hardcoded localhost URLs across frontend components
grep_search --SearchPath "c:\Users\csara\Downloads\java-backend-mrcooper\microps\production\frontend\src" --Query "localhost:8000"
```

### 2. Frontend Rebuild & Production Propagation
```powershell
# Rebuild Vite SPA
cd c:\Users\csara\Downloads\java-backend-mrcooper\microps\production\frontend
npm run build

# Package distribution bundle
tar -czvf frontend-deploy.tar.gz -C dist .

# Sync to AWS S3 Static Bucket
aws s3 sync dist s3://microps-client --delete

# SCP update to EC2 Production Host
scp -o StrictHostKeyChecking=no -i C:\Users\csara\Downloads\microps.pem frontend-deploy.tar.gz ubuntu@13.238.226.195:/home/ubuntu/frontend-deploy.tar.gz

# Extract across Nginx web root
ssh -o StrictHostKeyChecking=no -i C:\Users\csara\Downloads\microps.pem ubuntu@13.238.226.195 "sudo tar -xvf /home/ubuntu/frontend-deploy.tar.gz -C /var/www/microps-frontend && sudo rm /home/ubuntu/frontend-deploy.tar.gz"
```

### 3. Redis Queue Diagnostic & Inspection on EC2
```bash
# Check all BullMQ keys in Redis
ssh -o StrictHostKeyChecking=no -i microps.pem ubuntu@13.238.226.195 "redis-cli keys '*'"

# Inspect failed job list and specific job details
ssh -o StrictHostKeyChecking=no -i microps.pem ubuntu@13.238.226.195 "redis-cli zrange bull:tenant-builds:failed 0 -1"
ssh -o StrictHostKeyChecking=no -i microps.pem ubuntu@13.238.226.195 "redis-cli hgetall bull:tenant-builds:7"
```

### 4. GitHub Actions Runner Diagnostics on EC2 Host
```bash
# Executed Node script to pull runner execution logs directly from GitHub API
ssh -o StrictHostKeyChecking=no -i microps.pem ubuntu@13.238.226.195 "cat << 'EOF' > /tmp/check_runner.js
const fs = require('fs');
const lines = fs.readFileSync('/home/ubuntu/microps-backend/.env', 'utf8').split('\n');
const env = {};
lines.forEach(l => {
  const parts = l.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});
fetch('https://api.github.com/repos/' + env.GITHUB_OWNER + '/' + env.GITHUB_REPO + '/actions/runs?per_page=1', {
  headers: { 'Authorization': 'Bearer ' + env.GITHUB_PAT, 'User-Agent': 'MicrOps' }
}).then(r => r.json()).then(async d => {
  const run = d.workflow_runs[0];
  console.log('Run ID:', run.id, 'Conclusion:', run.conclusion);
  const jobsRes = await fetch(run.jobs_url, { headers: { 'Authorization': 'Bearer ' + env.GITHUB_PAT, 'User-Agent': 'MicrOps' } });
  const jobsData = await jobsRes.json();
  for (const job of jobsData.jobs || []) {
    const logUrl = 'https://api.github.com/repos/' + env.GITHUB_OWNER + '/' + env.GITHUB_REPO + '/actions/jobs/' + job.id + '/logs';
    const logRes = await fetch(logUrl, { headers: { 'Authorization': 'Bearer ' + env.GITHUB_PAT, 'User-Agent': 'MicrOps' } });
    if (logRes.ok) console.log((await logRes.text()).split('\n').slice(-30).join('\n'));
  }
});
EOF
node /tmp/check_runner.js"
```

### 5. Rogue Process Elimination & PM2 Recovery
```bash
# Identify conflicting processes and Docker containers
ssh -o StrictHostKeyChecking=no -i microps.pem ubuntu@13.238.226.195 "docker ps -a && ps aux | grep -E 'node|pm2|worker'"

# Stop and remove zombie legacy Docker container microps-api
ssh -o StrictHostKeyChecking=no -i microps.pem ubuntu@13.238.226.195 "docker stop 8d256649522e || true; docker rm 8d256649522e || true"

# Restart clean PM2 daemon cluster
ssh -o StrictHostKeyChecking=no -i microps.pem ubuntu@13.238.226.195 "pm2 restart microps-backend && pm2 status"
```

### 6. Production Verification Commands
```bash
# Verify successful BullMQ job processing
ssh -o StrictHostKeyChecking=no -i microps.pem ubuntu@13.238.226.195 "redis-cli hgetall bull:tenant-builds:8"

# Verify active AWS ECS Fargate containers
aws ecs list-tasks --cluster microps-tenant-cluster --region ap-southeast-2
aws ecs describe-tasks --cluster microps-tenant-cluster --tasks arn:aws:ecs:ap-southeast-2:688567265418:task/microps-tenant-cluster/a039ae25e3d7474ba618f680125ea643 --region ap-southeast-2 --query "tasks[0].[taskArn,lastStatus,containers[0].image]"
```

### 7. EC2 Nginx Web Root Synchronization Audit & CI/CD Remediation
```powershell
# Check live asset bundle served by EC2 Nginx Reverse Proxy (13.238.226.195)
curl.exe -s http://13.238.226.195 | Select-String "assets"
# Output showed stale bundle: /assets/index-Bw9pOhno.js

# Check live asset bundle served by S3 Static Website Bucket
curl.exe -s http://microps-client.s3-website-ap-southeast-2.amazonaws.com | Select-String "assets"
# Output showed updated bundle: /assets/index-D9cjdEFa.js

# Remediation applied: Updated .github/workflows/deploy-frontend.yml to SCP/SSH distribution bundle to EC2 Nginx web root
git add .github/workflows/deploy-frontend.yml
git commit -m "fix: deploy compiled frontend SPA to EC2 Nginx web root in GitHub Actions"
git push
```

### 8. Container Multi-Stage Build Failure (`exit code 127`) & Autonomous Remediation
```powershell
# Error Signature observed in live SSE runner logs:
# 11 | >>> RUN npm start
# process "/bin/sh -c npm start" did not complete successfully: exit code: 127

# Root Cause Investigation:
# ConfigPanel.tsx had state startCommand = 'npm start', but mapped it as installCommand: startCommand inside onDeploy().
# When generateTenantScript audited the Dockerfile, sed replaced 'RUN npm ci' with 'RUN npm start'.
# Executing 'npm start' inside 'FROM base AS deps' (before node_modules or Next.js build existed) exited with code 127.

# Remediation Applied:
# Added explicit installCommand state ('npm install --legacy-peer-deps') to ConfigPanel.tsx.
# Verified One-Click Fix ('⚡ Apply Fix') successfully re-dispatched Job #49 and completed ECS Fargate deployment.
```

### 9. AWS ALB Host-Based Routing 404 (`MicrOps Deployment Not Found`)
```powershell
# Observation:
# ECS Cluster showed tenant-19-portfolio-service ACTIVE with 1 healthy task. Target group showed 1 healthy target.
# Opening http://tenant-19-portfolio.microps.in returned ALB default 404 response: "MicrOps Deployment Not Found".

# Root Cause Investigation:
# Initial service creation (!serviceExists) registered an ALB Listener Rule with Host header "tenant-19-portfolio.localhost".
# When BASE_DOMAIN was updated to microps.in and re-deployed, deploy.service.ts ran UpdateServiceCommand on ECS but did not update existing ALB Listener Rules.
# Request for tenant-19-portfolio.microps.in failed ALB rule condition evaluation and fell through to default 404 action.

# Remediation Strategy:
# Updated deployServiceECS in deploy.service.ts to query existing ALB Listener Rules (DescribeRulesCommand) and update conditions (ModifyRuleCommand) or recreate stale rules when service updates occur.
```

### 10. AWS ALB Rule Priority Shadowing (`503 Service Temporarily Unavailable`)
```powershell
# Observation:
# ECS Cluster showed tenant-7-portfolio-service ACTIVE with 1 healthy task (dda72c119fcd49e3). Target group tg-u7-portfolio-713125 showed 1 healthy target.
# Opening http://tenant-7-portfolio.microps.in returned ALB response: "503 Service Temporarily Unavailable".

# Root Cause Investigation:
# AWS Application Load Balancer evaluates routing rules strictly in ascending Priority numerical order.
# Rule Priority 101 matched host tenant-7-portfolio.microps.in and directed traffic to legacy target group tg-u7-portfolio-034791, which had 0 healthy targets (Targets: []).
# Because Rule 101 matched the host header on an empty target group, ALB returned 503 before evaluating Rule Priority 109 where the live healthy task resided.

# Remediation Executed:
# Executed DeleteRuleCommand on ALB Listener to remove stale Priority 101 rule.
# Verified immediate HTTP/1.1 200 OK response with live portfolio HTML bundle.
```

### 11. ECS Fargate Container Exit Code 1 (`npm error Missing script: "start"`)
```powershell
# Observation:
# Fargate container stopped immediately with Exit code 1.
# CloudWatch logs displayed: npm error Missing script: "start"

# Root Cause Investigation:
# Auto-generated buildpack Dockerfile in builder.service.ts hardcoded CMD ["npm", "start"].
# Vite and React static single-page applications (SPAs) compile to dist/ or build/ and do not define a start script in package.json.

# Remediation Executed:
# Upgraded fallback Dockerfile generator in builder.service.ts:
# 1. Added RUN npm install -g serve during build stage.
# 2. Replaced hardcoded CMD with universal runtime shell command that inspects package.json scripts and serves static output directories (dist/, build/, out/) automatically.
# 3. Added Rule 6 MISSING_START_SCRIPT to diagnostic.engine.ts.
```

### 12. End-to-End Environment Variable Vault Bridge
```powershell
# Observation:
# Environment variables entered in the UI table (ConfigPanel.tsx) were not reaching the container runtime.

# Root Cause Investigation:
# While the backend encryption (AES-256-GCM), database persistence (env_store), and ECS Fargate runtime injection (deployServiceECS) were fully constructed and operational, ConfigPanel.tsx line 156 omitted envVars from the onClick handler when calling onDeploy().

# Remediation Executed:
# Formatted envVars into KEY=VALUE newline-delimited strings inside ConfigPanel.tsx onClick handler.
# Propagated envContent field up through DeploymentControlCenter.tsx and Dashboard.tsx into buildService.deploy().
# Verified clean compilation across frontend and backend.
```

### 13. Container Syntax Crash (`/bin/sh: [sh,: not found`)
```powershell
# Observation:
# ECS container crashed during startup with logs displaying: /bin/sh: [sh,: not found

# Root Cause Investigation:
# In builder.service.ts, the generated fallback Dockerfile used inline JSON exec array CMD syntax: CMD ["sh", "-c", "if node -e 'const s=require(\"./package.json\")..."]
# Because the nested command string contained escaped double quotes inside a JSON array inside a shell here-doc, Docker engine failed to parse it as valid JSON exec array and fell back to executing the string via /bin/sh -c 'CMD ["sh", ...]'
# Consequently, /bin/sh attempted to execute the literal word ["sh", as a binary, which caused /bin/sh: [sh,: not found.

# Remediation Executed:
# Replaced inline JSON command strings in builder.service.ts with explicit executable scripts generated during build time: RUN cat << 'EOF' > /app/start.sh
# Set clean execution entrypoint: CMD ["/app/start.sh"]
```

### 14. Dockerfile Heredoc Parse Error (`unknown instruction: if`)
```powershell
# Observation:
# GitHub Actions runner failed docker build with:
# ERROR: failed to solve: dockerfile parse error on line 11: unknown instruction: if

# Root Cause Investigation:
# Standard Dockerfile syntax (without BuildKit # syntax=docker/dockerfile:1.4 header) does not support heredoc blocks inside RUN commands (RUN cat << 'EOF' > ...).
# Consequently, Docker parsed RUN cat << 'EOF' > /app/start.sh on line 9, ignored #!/bin/sh on line 10 as a comment, and treated line 11 (if node -e ...) as a top-level Dockerfile directive. Because if is not a valid Dockerfile instruction, build failed.

# Replaced heredoc RUN blocks in builder.service.ts with standard POSIX multi-line commands chained via backslashes (\): RUN echo '#!/bin/sh' > /app/start.sh && echo 'if ...' >> /app/start.sh && chmod +x /app/start.sh
```

### 15. Browser HTTPS Auto-Upgrade Refusal (`ERR_CONNECTION_REFUSED`)
```powershell
# Observation:
# Command line curl -I http://tenant-19-nephele-frontend.microps.in returned HTTP/1.1 200 OK.
# Opening the exact same host in Brave Browser produced ERR_CONNECTION_REFUSED ("refused to connect").

# Root Cause Investigation:
# Brave Shields and modern Chrome browsers enable HTTPS-First auto-upgrade by default, automatically upgrading bare domain navigation from http:// (Port 80) to https:// (Port 443).
# Because our AWS Application Load Balancer (microps-tenant-alb) currently listens exclusively on Port 80 (HTTP) without a Port 443 HTTPS SSL listener attached, connection requests to Port 443 are dropped/refused by AWS.

# Remediation Executed:
# Verified immediate access by explicitly protocol-prefixing http:// in the address bar or disabling Brave Shields HTTPS auto-upgrade for microps.in.
```

### 16. Python SDK Top-Level Import Crash (`Missing credentials`)
```powershell
# Observation:
# ECS container nephele-backend crashed immediately on startup with Exit Code 1.
# CloudWatch logs output: openai.OpenAIError: Missing credentials. Please pass an `api_key` ... or set the `OPENAI_API_KEY` environment variable.

# Root Cause Investigation:
# In /app/teaching.py line 42, the application instantiates client = OpenAI(api_key=os.getenv("OPENAI_API_KEY")) at the top-level module scope during Uvicorn import.
# Because OPENAI_API_KEY was either missing or empty in the ECS task environment variables, the OpenAI Python client constructor threw an OpenAIError exception before the web server could start listening on Port 3000.

# Remediation Executed:
# Enter OPENAI_API_KEY along with its valid secret key in the MicrOps Deployment Config Panel (Environment Variables table) before initiating deployment, or wrap top-level client instantiations inside request handler functions / lazy constructors with fallback error handling.
```

### 17. ECS Deployment Failure on Inactive/Draining Service (`ServiceNotActiveException`)
```powershell
# Observation:
# Deployment pipeline failed at final ECS deployment step with:
# ERROR: FAILED DEPLOYMENT ServiceNotActiveException: Service was not ACTIVE.

# Root Cause Investigation:
# When an ECS service is manually deleted or stops its last task, AWS transitions its status from ACTIVE to DRAINING or INACTIVE.
# In deploy.service.ts, our logic previously checked `describe.services[0].status !== 'INACTIVE'`, which evaluated to true when a service was in `DRAINING` state. Consequently, the CD engine attempted `UpdateServiceCommand` on a DRAINING service, causing AWS ECS to reject the API call with ServiceNotActiveException.

# Remediation Executed:
# Upgraded deploy.service.ts to explicitly check for `status === 'ACTIVE'` and automatically catch `ServiceNotActiveException` during updates, falling back to deleting stale/draining services and calling `CreateServiceCommand` to self-heal deployments.
```

### 18. Tenant Dockerfile Port Mismatch Causing ALB 502 Bad Gateway
```powershell
# Observation:
# ECS Fargate container logs reported successful startup: INFO: Uvicorn running on http://0.0.0.0:8000.
# However, navigating to the live URL returned HTTP 502 Bad Gateway.

# Root Cause Investigation:
# Our AWS Application Load Balancer Target Group and ECS Task Definition forward traffic specifically to containerPort 3000.
# Because the tenant's repository contained a custom Dockerfile hardcoded to start Uvicorn on Port 8000, ALB health checks failed with Connection Refused on Port 3000, causing AWS ELB to return 502 Bad Gateway.

# Remediation Executed:
# Upgraded builder.service.ts to automatically audit custom Dockerfiles and rewrite non-standard port declarations (8000, 8080, 5000) to standard Port 3000. Additionally injected default `PORT=3000` and `SERVER_PORT=3000` into `deploy.service.ts` environment variables.
```

### 19. GitHub Actions 422 Rejection on Undeclared Workflow Inputs
```powershell
# Observation:
# Workflow dispatch request failed with HTTP 422 Unprocessable Entity:
# {"message":"Unexpected inputs provided: [\"correlationId\"]","documentation_url":"...","status":"422"}

# Root Cause Investigation:
# GitHub REST API `POST /actions/workflows/{workflow_id}/dispatches` strictly validates the keys inside the `inputs` JSON object against the parameters explicitly defined under `on.workflow_dispatch.inputs` in the remote repository's workflow YAML file. Passing an extra key (`correlationId`) not defined in remote `builder.yml` causes immediate API rejection.

# Remediation Executed:
# Removed undeclared input keys from `github-actions.provider.ts` dispatch payload, ensuring only `{ tenantScript: tenantScript }` is sent. Maintained race condition protection by correlating runs via timestamp window matching (`created_at >= dispatchedAfter`).
```

---

## 💡 Findings & Interesting Caveats

| Finding / Caveat Category | Component / Area | Observation & Technical Caveat | Architectural Takeaway & Best Practice |
| :--- | :--- | :--- | :--- |
| **Browser Protocol Shadowing** | Client Browsers vs. ALB Listeners | Browsers with aggressive privacy/security shields (e.g., Brave Shields, Chrome HTTPS-First) automatically rewrite `http://` domain requests to `https://`. If ALB lacks a Port 443 listener, users see misleading `ERR_CONNECTION_REFUSED` errors even when container health checks pass 100% on Port 80. | Always render explicit clickable `http://` anchor tags in web dashboards or provision AWS ACM Wildcard SSL certificates (`*.microps.in`) on Port 443 with redirect rules from Port 80. |
| **Dockerfile Instruction Parsing** | Build Engine (`docker build`) | Without explicit BuildKit headers (`# syntax=docker/dockerfile:1.4`), multi-line shell heredocs (`RUN cat << 'EOF'`) inside Dockerfiles break syntax parsing. Docker treats subsequent lines as top-level directives (e.g., failing on `if` or `elif`). | Construct multi-line build artifacts using universal POSIX shell chaining (`RUN echo "..." > /app/file && echo "..." >> /app/file`) with trailing line continuation (`\`). |
| **JSON Exec Array Quote Escaping** | Container Entrypoint (`CMD`) | Using JSON exec arrays for complex inline shell logic (`CMD ["sh", "-c", "if node -e 'require(\"./package.json\")...'"]`) introduces nested escape hazards (`\"`). If parsing fails, Docker executes the array text in shell form, causing `/bin/sh: [sh,: not found`. | Decouple build-time logic from runtime commands: generate dedicated executable scripts (`/app/start.sh`) during `RUN` stages and execute them cleanly via `CMD ["/app/start.sh"]`. |
| **SPA Framework Fallbacks** | SPA Runtime (`serve`) | Single-page applications (Vite, React, Vue) output static build bundles (`dist/`, `build/`, `out/`) rather than running Node web servers. Hardcoded `npm start` commands crash with `Missing script: "start"`. | Universal container buildpacks must inspect `package.json` dynamically and fall back to serving static build folders (`serve -s dist -l 3000`) when start scripts are absent. |
| **SDK Top-Level Module Evaluation** | Python Backend Runtime | Python web servers execute top-level statements in imported modules (e.g., `client = OpenAI(...)`) at server boot time before opening sockets. Missing environment variables cause instant container crashes (`Exit Code 1`). | Always input required SDK keys into the UI Environment Variables vault before deployment, or design SDK client initialization lazily inside dependency injectors/route handlers. |
| **ECS Draining State Rejection** | AWS ECS Control Plane | When an ECS service transitions to `DRAINING` or `INACTIVE`, calling `UpdateServiceCommand` throws `ServiceNotActiveException: Service was not ACTIVE`. | Orchestrators must inspect `status === 'ACTIVE'` before updating and autonomously catch inactive states to execute a clean service re-creation (`CreateServiceCommand`). |
| **Container Port Routing Mismatch** | ALB vs. Fargate Containers | If a tenant Dockerfile binds web servers to custom ports (e.g., `8000` or `8080`) while ALB routes to `containerPort: 3000`, health checks fail and ALB returns `502 Bad Gateway`. | Buildpacks should inject default `PORT=3000` variables and normalize custom Dockerfile port declarations (`sed -i 's/8000/3000/g'`) during pre-build orchestration. |
| **Workflow Dispatch Input Schema Validation** | GitHub Actions REST API | Passing undeclared keys in `workflow_dispatch.inputs` triggers an immediate `422 Unprocessable Entity` error from GitHub API. | Orchestrators must send only the exact input keys declared in remote `.github/workflows/*.yml`. Perform run correlation via API metadata (timestamps/run names) instead of custom input parameters. |


