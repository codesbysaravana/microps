# MicrOps Current Architecture (v2)

This document outlines the most up-to-date architecture for the MicrOps platform, including the new **Bring Your Own Cloud (BYOC) OIDC** pipeline and the autonomous **AI Diagnostic Engine**.

---

## 1. High-Level System Topology

MicrOps acts as the central nervous system connecting the user's codebase (GitHub) to the cloud (AWS), providing both hosted deployments (MicrOps Native Cloud) and decentralized deployments (Bring Your Own Cloud).

```mermaid
graph TD
    %% User Interfaces
    User((User / Developer))
    WebUI[MicrOps Dashboard<br/>React + Vite]
    CLI[MicrOps CLI<br/>microps-cli]

    %% External SaaS
    GitHub[GitHub API / OAuth]
    Stripe[Stripe Billing]
    OpenAI[OpenAI Diagnostics]
    NeonDB[(Neon PostgreSQL)]
    Redis[(Redis Cache / BullMQ)]

    %% MicrOps Core Backend
    subgraph MicrOpsCore ["MicrOps Backend (EC2)"]
        API[Express API Gateway]
        AuthSvc[Auth Service]
        ProjSvc[Project Service]
        DiagSvc[AI Diagnostic Engine]
        BuildWorker[BullMQ Build Worker]
    end

    %% AWS Native Infrastructure (MicrOps Hosted)
    subgraph MicrOpsCloud ["MicrOps AWS Account"]
        ECR[Amazon ECR<br/>microps-hq]
        ALB[Application Load Balancer]
        ECS[ECS Fargate Cluster<br/>microps-tenant-cluster]
    end

    %% Connections
    User -->|Uses| WebUI
    User -->|Uses| CLI
    WebUI <-->|REST API / SSE| API
    CLI <-->|REST API| API

    API <--> AuthSvc
    API <--> ProjSvc
    API <--> BuildWorker
    API <--> DiagSvc

    AuthSvc <--> GitHub
    ProjSvc <--> NeonDB
    BuildWorker <--> Redis
    BuildWorker <--> OpenAI
    ProjSvc <--> Stripe

    BuildWorker -->|1. Build & Push| ECR
    BuildWorker -->|2. Provision Task| ECS
    ALB -->|Routes Traffic| ECS
```

---

## 2. Dual-Mode Deployment Architecture

MicrOps now supports two distinct deployment models: **Native Cloud** (hosted by MicrOps) and **BYOC** (deployed to the user's AWS account securely via OIDC).

### Mode A: MicrOps Native Deployment (BullMQ Worker)
This is the default flow when a user clicks "Deploy" in the dashboard. The entire build process is orchestrated internally by the MicrOps backend.

```mermaid
sequenceDiagram
    participant Dashboard
    participant API as MicrOps API
    participant Worker as BullMQ Worker
    participant AI as Diagnostic Engine
    participant AWS as MicrOps AWS (ECR/ECS)

    Dashboard->>API: POST /build/deploy (repoUrl)
    API->>Worker: Enqueue Build Job
    Worker->>API: Stream SSE Logs (Preflight)
    Worker->>Worker: Analyze Repo (Runtime/Framework)
    
    alt Preflight Fails
        Worker->>AI: Send failure telemetry
        AI-->>Worker: Return auto-fix patch
        Worker->>Dashboard: Suggest/Apply Fix
    else Preflight Passes
        Worker->>AWS: Build Docker Image & Push to ECR
        Worker->>AWS: Update ECS Service & Attach ALB
        Worker->>Dashboard: Stream SSE (Success + Live URL)
    end
```

### Mode B: Bring Your Own Cloud (Zero-Trust OIDC)
This flow allows enterprise users to host their workloads on their own AWS infrastructure without ever sharing AWS Access Keys with MicrOps.

```mermaid
sequenceDiagram
    participant User
    participant CLI as MicrOps CLI / Web UI
    participant API as MicrOps API
    participant GH as GitHub Repository
    participant GHA as GitHub Actions
    participant UAേഷ as User's AWS Account

    User->>CLI: Run `microps link` (or Web UI)
    CLI->>API: POST /github/repos/install-runner
    API->>GH: Inject `.github/workflows/microps-deploy.yml`
    Note over GH,API: Workflow uses `sts:AssumeRoleWithWebIdentity`

    User->>GH: Push to `main` branch
    GH->>GHA: Trigger CI/CD Pipeline
    
    GHA->>GH: Request GitHub OIDC Token
    GH-->>GHA: Return Signed JWT
    
    GHA->>UAേഷ: sts:AssumeRole (Validate JWT)
    UAേഷ-->>GHA: Return Temporary AWS Credentials
    
    GHA->>UAേഷ: Build Image & Push to User's ECR
    GHA->>UAേഷ: Deploy Task to User's ECS Fargate
    
    GHA->>API: Webhook: Deployment Success + Live URL
    API->>User: Dashboard Updated
```

---

## 3. The AI Self-Healing Engine (v2)

MicrOps sets itself apart by actively repairing broken deployments instead of just reporting them.

```mermaid
flowchart TD
    Start[User Triggers Deploy] --> Preflight{Preflight Scanner}
    
    Preflight -->|Valid| Build[Docker Build Step]
    Preflight -->|Missing Config| Fix[Auto-Apply Best Practice Fixes]
    Fix --> Build

    Build -->|Success| ECR[Push to ECR]
    Build -->|Fails| Diag[Diagnostic Engine]

    Diag --> RegExp{Known Regex Rule?}
    RegExp -->|Yes: e.g. Port Conflict| ApplyFix[Apply Deterministic Fix]
    RegExp -->|No| LLM[OpenAI GPT-4o-mini Analysis]

    LLM --> Parse[Generate Actionable JSON Patch]
    Parse --> DashboardPrompt{User Approval Required?}
    
    DashboardPrompt -->|Safe Rule| ApplyFix
    DashboardPrompt -->|Destructive| UserWait[Wait for User 'Apply Fix' Click]
    UserWait -->|Clicked| ApplyFix

    ApplyFix --> Retry[Enqueue Retry Build]
    Retry --> Preflight
```

---

## 4. Security & Network Isolation Boundary

```mermaid
graph LR
    subgraph External
        Internet((Public Internet))
        GitHubOIDC[GitHub OIDC Provider]
    end

    subgraph UserAWS ["User's AWS Account (BYOC)"]
        IAMRole[IAM Role for GitHub Actions]
        UserECR[Private ECR]
        UserECS[ECS Cluster]
        
        IAMRole -. trusts .-> GitHubOIDC
        IAMRole -->|Grants Access| UserECR
        IAMRole -->|Grants Access| UserECS
    end

    subgraph MicrOpsAWS ["MicrOps AWS Account (Native)"]
        Nginx[EC2 Nginx Proxy]
        NodeAPI[Node.js Backend]
        MicrOpsECR[Internal ECR]
        
        Internet -->|HTTPS :443| Nginx
        Nginx -->|Proxy :8000| NodeAPI
        NodeAPI -->|Builds| MicrOpsECR
    end

    %% The defining feature: No hardcoded credentials cross the boundary
    NodeAPI -.-x|NO DIRECT ACCESS| User AWS
```
