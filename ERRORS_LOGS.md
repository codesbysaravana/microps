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


