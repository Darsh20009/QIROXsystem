# Architecture Diagram — Permission Flow

**Version:** 1.0  
**Last updated:** Enterprise Governance migration

---

## Role Hierarchy

```mermaid
graph TD
    Admin["👑 admin\n(full access)"]
    Manager["🏢 manager\n(full access, no system config)"]
    SalesManager["📊 sales_manager"]
    Supervisor["👁 supervisor"]
    Employee["👤 employee"]
    Developer["💻 developer"]
    Designer["🎨 designer"]
    Support["🎧 support"]
    Accountant["💰 accountant"]
    Sales["📞 sales"]
    Marketing["📢 marketing"]
    Client["🙍 client"]

    Admin --> Manager
    Manager --> SalesManager
    Manager --> Supervisor
    Manager --> Employee
    Manager --> Developer
    Manager --> Designer
    Manager --> Support
    Manager --> Accountant
    SalesManager --> Sales
    SalesManager --> Marketing
```

---

## Request Permission Check Flow

```mermaid
flowchart TD
    REQ["Incoming Request"] --> SESS["Session populated?\nreq.user present?"]
    SESS -->|No| PUB{"Public route?"}
    PUB -->|Yes| ALLOW["✅ Allow — no auth needed"]
    PUB -->|No| DENY401["❌ 401 Unauthorised"]
    SESS -->|Yes| ROLECHECK{"Role check\nfor this route"}

    ROLECHECK -->|"admin only"| ADMIN{"user.role === 'admin'?"}
    ADMIN -->|Yes| ALLOW
    ADMIN -->|No| DENY403["❌ 403 Forbidden"]

    ROLECHECK -->|"admin or manager"| ADMGR{"role in\n['admin','manager']?"}
    ADMGR -->|Yes| ALLOW
    ADMGR -->|No| DENY403

    ROLECHECK -->|"employee roles"| EMPROLES{"role in\n['admin','manager',\n'employee','developer',\n'designer','support',\n'accountant','supervisor']?"}
    EMPROLES -->|Yes| ALLOW
    EMPROLES -->|No| DENY403

    ROLECHECK -->|"CRM roles"| CRMROLES{"role in\n['admin','manager',\n'sales','sales_manager',\n'marketing']?"}
    CRMROLES -->|Yes| ALLOW
    CRMROLES -->|No| DENY403

    ROLECHECK -->|"client only"| CLIENTROLE{"user.role === 'client'?"}
    CLIENTROLE -->|Yes| ALLOW
    CLIENTROLE -->|No| DENY403

    ROLECHECK -->|"any authenticated"| ALLOW
```

---

## Route Access Matrix

| Route Group | admin | manager | employee* | sales* | client |
|---|:---:|:---:|:---:|:---:|:---:|
| `/api/admin/*` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/api/employee/*` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `/api/client/*` | ✅ | ✅ | ❌ | ❌ | ✅ |
| `/api/crm/*` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `/api/ai/*` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `/api/qmeet/*` | ✅ | ✅ | ✅ | ❌ | ✅ |
| `/api/public/*` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/auth/*` | ✅ | ✅ | ✅ | ✅ | ✅ |

_*employee includes: developer, designer, support, accountant, supervisor_  
_*sales includes: sales, sales_manager, marketing_

---

## Permission Enforcement Architecture

```mermaid
graph LR
    subgraph Current["Current (Migration 008–009)"]
        direction TB
        RH["Route Handler\n(server/routes.ts)"]
        RH -->|"inline check\nif user.role !== 'admin'"| DENY["403 response"]
        RH -->|"passes"| SVC["Service / Domain"]
    end

    subgraph Future["Target Architecture (planned)"]
        direction TB
        MW2["RBAC Middleware\n(per-route decorator)"]
        CTL2["Controller\n(server/domains/*/controller.ts)"]
        SVC2["Domain Service"]
        MW2 --> CTL2
        CTL2 --> SVC2
    end

    Current -->|"Migration 012+"| Future
```

**Current state:** Role checks are inline inside `server/routes.ts` handlers.  
**Target state:** A reusable `requireRole(...roles)` middleware factory applied at route registration.  
This is an architectural improvement tracked as a future migration (no TECH-ID yet; low risk in current form).

---

## Public Route Whitelist

Routes accessible without authentication:

| Pattern | Purpose |
|---|---|
| `/api/public/*` | Public-facing data (settings, pricing, news) |
| `/api/auth/login` | Login endpoint |
| `/api/auth/register` | Registration |
| `/api/auth/google*` | Google OAuth callbacks |
| `/api/auth/github*` | GitHub OAuth callbacks |
| `/api/auth/apple*` | Apple OAuth callbacks |
| `/api/auth/webauthn*` | Passkey flows |
| `/api/prices` | Pricing page data |
| `/api/news*` | Public news |
| `/api/partners` | Partners list |
| `/api/jobs*` | Job listings |
| `/uploads/*` | Uploaded files (public CDN) |
| `/*` (non-API) | React SPA shell (auth handled client-side) |
