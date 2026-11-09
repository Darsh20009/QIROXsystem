# Architecture Diagram — Deployment Flow

**Version:** 1.0  
**Last updated:** Enterprise Governance migration

---

## Build & Serve Architecture

```mermaid
graph LR
    subgraph Dev["Development (Replit)"]
        SRC["Source\n(TypeScript + React)"]
        TSX["tsx runtime\n(server/index.ts)"]
        DIST["dist/public/\n(pre-built Vite bundle)"]
        SRC -->|"npm run dev\n(tsx server/index.ts)"| TSX
        TSX -->|"serves static"| DIST
    end

    subgraph Build["Build Step (npm run build)"]
        VBUILD["Vite\n(client bundle)"]
        ESBUILD["esbuild\n(server bundle → dist/index.cjs)"]
        SRC -->|"client/"| VBUILD
        VBUILD -->|"→ dist/public/"| DIST
        SRC -->|"server/"| ESBUILD
        ESBUILD -->|"→ dist/index.cjs"| CJSOUT["dist/index.cjs\n(production server)"]
    end

    subgraph Prod["Production"]
        CJSOUT -->|"node dist/index.cjs"| PSERVER["Production Express\n(port 5000)"]
        PSERVER --> DISTPUB["Serves dist/public/\n(static + API)"]
    end
```

> ⚠️ **Environment Note:** Vite HMR is disabled in this Replit environment due to a SIGBUS crash.
> The dev workflow serves a **pre-built** `dist/public/` bundle instead of running Vite live.
> See: `.agents/memory/vite-sigbus-crash.md`

---

## Release Deployment Flow

```mermaid
flowchart TD
    DEV["🛠 Development\n(feature branch / Replit env)"]
    GATE1{"Gate 1\nRFC Approved?"}
    GATE2{"Gate 2\nDoD Passed?"}
    GATE3{"Gate 3\nTech Debt Updated?"}
    GATE4{"Gate 4\nADR Accurate?"}
    GATE5{"Gate 5\nZero Downtime Verified?"}
    GATE6{"Gate 6\nREADME Updated?"}
    GATE7{"Gate 7\nCTO Sign-off?"}

    MERGE["🔀 Merge to main branch"]
    BUILD["🔨 npm run build"]
    SMOKE["💨 Smoke Test\n(login + core flow)"]
    MONITOR["📊 Monitor 30 min\n(logs + errors)"]
    DONE["✅ Production Release"]
    ROLLBACK["⏪ Rollback\n(restore import / checkpoint)"]

    DEV --> GATE1
    GATE1 -->|"No"| DEV
    GATE1 -->|"Yes"| GATE2
    GATE2 -->|"No"| DEV
    GATE2 -->|"Yes"| GATE3
    GATE3 -->|"No"| DEV
    GATE3 -->|"Yes"| GATE4
    GATE4 -->|"No"| DEV
    GATE4 -->|"Yes"| GATE5
    GATE5 -->|"No"| DEV
    GATE5 -->|"Yes"| GATE6
    GATE6 -->|"No"| DEV
    GATE6 -->|"Yes"| GATE7
    GATE7 -->|"No"| DEV
    GATE7 -->|"Yes"| MERGE
    MERGE --> BUILD
    BUILD -->|"Build fails"| ROLLBACK
    BUILD --> SMOKE
    SMOKE -->|"Regression found"| ROLLBACK
    SMOKE --> MONITOR
    MONITOR -->|"Incident detected"| ROLLBACK
    MONITOR --> DONE
```

---

## Rollback Strategy by Scenario

```mermaid
flowchart LR
    INC["🚨 Incident Detected"]

    INC --> S1{"Single module\nimport change?"}
    S1 -->|"Yes"| R1["Restore original import\nin affected file\nRestart workflow\n⏱ <5 min"]

    INC --> S2{"Frontend\nregression?"}
    S2 -->|"Yes"| R2["Re-serve previous\ndist/public build\nRestart workflow\n⏱ <10 min"]

    INC --> S3{"Dependency\nbreakage?"}
    S3 -->|"Yes"| R3["Restore package.json\nnpm install\nRestart\n⏱ <15 min"]

    INC --> S4{"DB data\ncorruption?"}
    S4 -->|"Yes"| R4["MongoDB Atlas\npoint-in-time restore\n⏱ <60 min"]

    INC --> S5{"Full build\nfailure?"}
    S5 -->|"Yes"| R5["Replit Checkpoint\nrollback\n⏱ <5 min"]
```

---

## Environment Variable / Secrets Architecture

```mermaid
graph TB
    subgraph Replit["Replit Secrets Manager"]
        S1["MONGODB_URI"]
        S2["SESSION_SECRET"]
        S3["OPENAI_API_KEY\n(not yet set — TECH pending)"]
        S4["PAYPAL_CLIENT_ID / SECRET\n(not yet set)"]
        S5["VAPID_PUBLIC / PRIVATE KEY\n(not yet set)"]
        S6["SMTP2GO_API_KEY\n(not yet set)"]
    end

    subgraph Server["server/index.ts"]
        ENV["process.env.*"]
        SYS["SystemSettings\n(DB-stored config)\noverrides env where applicable"]
    end

    Replit --> ENV
    ENV --> SYS
    SYS -->|"SMTP host/port/user/pass"| EMAIL["nodemailer transport"]
    SYS -->|"senderName, siteUrl, logoUrl"| EmailDomain["email domain"]
```

---

## DeploymentCloud Sub-System

```mermaid
sequenceDiagram
    actor U as Employee
    participant FE as /employee/deployment-cloud
    participant API as /api/deploy/*
    participant GH as GitHub API
    participant DC as deployment-cloud.ts
    participant SG as simple-git
    participant FS as Server Filesystem

    U->>FE: Open DeploymentCloud
    FE->>API: GET /api/deploy/projects
    API->>DC: List user's deployment projects

    U->>FE: Connect GitHub repo
    FE->>API: GET /api/deploy/github/oauth/start
    API->>GH: Redirect to GitHub OAuth
    GH-->>API: Callback with token
    API->>DB: Store githubDeployToken on UserModel

    U->>FE: Deploy project
    FE->>API: POST /api/deploy/projects/:id/deploy
    API->>DC: Run deployment
    DC->>SG: git clone / git pull (repo URL)
    SG->>FS: Write to sandbox-projects/
    DC-->>FE: Deployment status (Simulation mode)
```
