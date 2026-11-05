# Architecture Diagram — Domain Interaction

**Version:** 1.0  
**Last updated:** Enterprise Governance migration

---

## Domain Layer Architecture

```mermaid
graph TB
    subgraph External["External Callers (not yet migrated to domain imports)"]
        RT["server/routes.ts"]
        AUTH["server/auth.ts"]
        QM["server/qmeet.ts"]
        EM["server/email-marketing.ts"]
        CRON["server/cron.ts"]
        PAY["server/paypal.ts"]
    end

    subgraph EmailDomain["📧 Email Domain\n(server/domains/email/)"]
        EI["index.ts\n(public barrel)"]
        ES["service.ts\n(orchestration)"]
        ED["domain.ts\n(template builders)"]
        ER["repository.ts\n(DB reads)"]
        EInfra["infrastructure/\nlegacy-email-adapter.ts"]
        ELeg["server/email.ts\n(legacy — TECH-001)"]
    end

    subgraph CRMDomain["👥 CRM Domain\n(server/domains/crm/)"]
        CI["index.ts"]
        CS["service.ts"]
        CD["domain.ts"]
        CR["repository.ts"]
    end

    subgraph MailDomain["📬 Mail Domain\n(server/domains/mail/)"]
        MI["index.ts"]
        MS["service.ts"]
        MD["domain.ts"]
        MR["repository.ts"]
    end

    subgraph DB["Data Layer"]
        PrimaryDB[("MongoDB Primary")]
    end

    subgraph LegacyEmail["Legacy Email (still production path)"]
        ELeg
    end

    %% External callers still use legacy path
    RT -->|"sendWelcomeEmail etc.\n(legacy import)"| ELeg
    AUTH -->|"sendOtpEmail etc.\n(legacy import)"| ELeg
    QM -->|"sendQMeetInviteEmail\n(legacy import)"| ELeg
    EM -->|"bulk send\n(legacy import)"| ELeg
    CRON -->|"weekly report\n(legacy import)"| ELeg

    %% Domain internal flow
    EI --> ES
    ES --> ED
    ES --> ER
    ES --> EInfra
    EInfra -->|"static import"| ELeg
    ER --> PrimaryDB

    CI --> CS
    CS --> CD
    CS --> CR
    CR --> PrimaryDB

    MI --> MS
    MS --> MD
    MS --> MR
    MR --> PrimaryDB
```

---

## Domain Internal Layer Rules (ADR-001)

```mermaid
graph LR
    subgraph Allowed["✅ Allowed Dependency Direction"]
        R["routes.ts"] --> CTL["controller.ts"]
        CTL --> SVC["service.ts"]
        SVC --> DOM["domain.ts"]
        SVC --> REPO["repository.ts"]
        SVC --> INF["infrastructure/"]
        SVC --> MAP["mapper.ts"]
        SVC --> TYP["types.ts"]
        DOM --> TYP
        REPO --> TYP
        MAP --> TYP
    end
```

```mermaid
graph LR
    subgraph Forbidden["❌ Forbidden Patterns"]
        DOM2["domain.ts"] -. "NO DB calls" .-> DB2[("MongoDB")]
        DOM3["domain.ts"] -. "NO dynamic import" .-> LEG["legacy modules"]
        CTL2["controller.ts"] -. "NO business logic" .-> BL["business rules"]
        REPO2["repository.ts"] -. "NO req/res" .-> HTTP["Express req/res"]
        SVC2["service.ts"] -. "NO dynamic import" .-> LEG2["legacy modules"]
    end
```

---

## Cross-Domain Communication Rule

Domains **do not import from each other directly**.
Cross-domain coordination is handled at the service layer via the calling route handler,
or via shared utility functions in `server/utils.ts`.

```mermaid
graph LR
    A["Route Handler"] --> ED["Email Domain"]
    A --> CD["CRM Domain"]
    A --> MD["Mail Domain"]
    ED -. "❌ Direct cross-domain import" .-> CD
    CD -. "❌ Direct cross-domain import" .-> ED
```
