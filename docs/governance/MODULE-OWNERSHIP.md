# Module Ownership Register — QIROX Platform

**Version:** 1.0  
**Last updated:** Enterprise Governance migration  
**Owner:** CTO

---

## Status Legend

| Status | Meaning |
|---|---|
| `STABLE` | Production-ready; no known architectural issues |
| `MIGRATING` | Active refactoring in progress |
| `LEGACY` | Monolithic; migration planned but not started |
| `EXPERIMENTAL` | New; not yet production-hardened |
| `DEPRECATED` | Scheduled for removal |

## Stability Legend

| Level | Meaning |
|---|---|
| `HIGH` | Rarely changes; well-understood |
| `MEDIUM` | Occasional changes; some complexity |
| `LOW` | Frequent changes; high complexity or flux |

## Risk Legend

| Level | Meaning |
|---|---|
| `LOW` | Failure is contained; rollback is easy |
| `MEDIUM` | Failure affects a feature set; rollback is multi-step |
| `HIGH` | Failure affects core auth, data, or payments |
| `CRITICAL` | Failure causes platform-wide outage |

---

## Domain Modules

### email — Email Domain

| Field | Value |
|---|---|
| **Owner** | Engineering |
| **Location** | `server/domains/email/` |
| **Status** | `MIGRATING` |
| **Stability** | `MEDIUM` |
| **Tech Debt** | TECH-001, TECH-002, TECH-004, TECH-005 |
| **Risk Level** | `HIGH` — transactional email touches payments, auth, orders |
| **Stability Score** | 42 / 100 (see STABILITY-INDEX.md) |
| **Next Migration** | Migration 010 — wire Zod validation |

**Responsibilities:** All outbound transactional email. SMTP config resolution. Template building.  
**README:** `server/domains/email/README.md`

---

### crm — CRM Domain

| Field | Value |
|---|---|
| **Owner** | Engineering |
| **Location** | `server/domains/crm/` |
| **Status** | `MIGRATING` |
| **Stability** | `MEDIUM` |
| **Tech Debt** | TECH-003, TECH-006 |
| **Risk Level** | `MEDIUM` |
| **Stability Score** | 48 / 100 |
| **Next Migration** | Migration 010 — wire Zod validation |

**Responsibilities:** Lead pipeline CRUD. Activity logging. Bulk import. Pipeline stats.  
**README:** `server/domains/crm/README.md`

---

### mail — Mail Domain

| Field | Value |
|---|---|
| **Owner** | Engineering |
| **Location** | `server/domains/mail/` |
| **Status** | `MIGRATING` |
| **Stability** | `MEDIUM` |
| **Tech Debt** | TECH-006, TECH-008 |
| **Risk Level** | `MEDIUM` |
| **Stability Score** | 45 / 100 |
| **Next Migration** | Migration 010 — wire Zod validation |

**Responsibilities:** Mail account management. Inbox cache. Internal messaging.  
**README:** `server/domains/mail/README.md`

---

## Platform Modules (Legacy Monolith)

### auth — Authentication & Session

| Field | Value |
|---|---|
| **Owner** | Engineering |
| **Location** | `server/auth.ts` |
| **Status** | `LEGACY` |
| **Stability** | `HIGH` |
| **Tech Debt** | TECH-006 (no tests) |
| **Risk Level** | `CRITICAL` — all user sessions depend on this |
| **Stability Score** | 55 / 100 |
| **Next Migration** | TBD — extract to `server/domains/auth/` |

**Responsibilities:** Passport Local strategy. Google/GitHub/Apple OAuth. WebAuthn (passkey). Session management. Password hashing (bcrypt). TOTP (speakeasy).

---

### routes — Core Route Handler

| Field | Value |
|---|---|
| **Owner** | Engineering |
| **Location** | `server/routes.ts` |
| **Status** | `LEGACY` |
| **Stability** | `LOW` |
| **Tech Debt** | TECH-005 (email routes not yet extracted) |
| **Risk Level** | `HIGH` — primary API surface |
| **Stability Score** | 28 / 100 |
| **Next Migration** | Ongoing — routes extracted per domain migration |

**Responsibilities:** All HTTP routes not yet extracted to domains. Inline RBAC enforcement. Monolithic ~3000-line file.

---

### qmeet — Video Meeting System

| Field | Value |
|---|---|
| **Owner** | Engineering |
| **Location** | `server/qmeet.ts`, `server/qmeet-db.ts` |
| **Status** | `STABLE` |
| **Stability** | `MEDIUM` |
| **Tech Debt** | TECH-001 (email templates still in legacy) |
| **Risk Level** | `MEDIUM` |
| **Stability Score** | 52 / 100 |
| **Next Migration** | TBD — extract to `server/domains/qmeet/` |

**Responsibilities:** Meeting CRUD. WebRTC signaling (via ws.ts). Smart scheduler. Invite/reminder emails (via legacy email).

---

### ai — AI Integration

| Field | Value |
|---|---|
| **Owner** | Engineering |
| **Location** | `server/ai.ts` |
| **Status** | `STABLE` |
| **Stability** | `MEDIUM` |
| **Tech Debt** | None registered |
| **Risk Level** | `LOW` — isolated; failures degrade gracefully |
| **Stability Score** | 60 / 100 |
| **Next Migration** | TBD — extract to `server/domains/ai/` |

**Responsibilities:** OpenAI GPT-4o (text + vision). Moonshot/Kimi (text). Image generation (flux+enhance). Video proxy. Arabic→English translation for image prompts.

---

### email-marketing — Campaign System

| Field | Value |
|---|---|
| **Owner** | Engineering |
| **Location** | `server/email-marketing.ts` |
| **Status** | `STABLE` |
| **Stability** | `MEDIUM` |
| **Tech Debt** | None registered |
| **Risk Level** | `MEDIUM` |
| **Stability Score** | 50 / 100 |
| **Next Migration** | TBD — extract to `server/domains/email-marketing/` |

**Responsibilities:** Campaign CRUD. Subscriber lists. Link tracking. Daily/weekly cron dispatch. Unsubscribe handling.

---

### notifications — Notification Hub

| Field | Value |
|---|---|
| **Owner** | Engineering |
| **Location** | `server/notify.ts`, `server/push.ts`, `server/ws.ts` |
| **Status** | `STABLE` |
| **Stability** | `HIGH` |
| **Tech Debt** | None registered |
| **Risk Level** | `MEDIUM` |
| **Stability Score** | 58 / 100 |
| **Next Migration** | TBD |

**Responsibilities:** 3-layer delivery (DB persist → WebSocket → Web Push). VAPID push subscriptions. WebSocket room management. Real-time presence.

---

### payments — PayPal Integration

| Field | Value |
|---|---|
| **Owner** | Engineering |
| **Location** | `server/paypal.ts` |
| **Status** | `STABLE` |
| **Stability** | `HIGH` |
| **Tech Debt** | None registered |
| **Risk Level** | `HIGH` — touches financial transactions |
| **Stability Score** | 55 / 100 |
| **Next Migration** | TBD — extract to `server/domains/payments/` |

**Responsibilities:** PayPal order creation. Capture. Wallet top-up processing. Status callbacks.

---

### deployment-cloud — Cloud Deployment System

| Field | Value |
|---|---|
| **Owner** | Engineering |
| **Location** | `server/deployment-cloud.ts` |
| **Status** | `STABLE` |
| **Stability** | `MEDIUM` |
| **Tech Debt** | None registered |
| **Risk Level** | `MEDIUM` |
| **Stability Score** | 55 / 100 |
| **Next Migration** | TBD |

**Responsibilities:** GitHub OAuth flow. Deployment simulation/orchestration. CloudLayout UI. Subdomain middleware.

---

### sandbox — Code Execution Sandbox

| Field | Value |
|---|---|
| **Owner** | Engineering |
| **Location** | `server/sandbox-*.ts` |
| **Status** | `EXPERIMENTAL` |
| **Stability** | `LOW` |
| **Tech Debt** | None registered |
| **Risk Level** | `HIGH` — executes user code; security boundary |
| **Stability Score** | 35 / 100 |
| **Next Migration** | TBD — security audit required |

**Responsibilities:** Virtual filesystem. Code execution runner. Sandboxed project routes.

---

### cron — Scheduled Jobs

| Field | Value |
|---|---|
| **Owner** | Engineering |
| **Location** | `server/cron.ts` |
| **Status** | `STABLE` |
| **Stability** | `HIGH` |
| **Tech Debt** | None registered |
| **Risk Level** | `LOW` |
| **Stability Score** | 62 / 100 |
| **Next Migration** | TBD |

**Responsibilities:** 27 scheduled jobs. Daily/weekly reports. Backup triggers. Email marketing dispatches.

---

### connection-manager — Database Connection Pool

| Field | Value |
|---|---|
| **Owner** | Engineering |
| **Location** | `server/connection-manager.ts` |
| **Status** | `STABLE` |
| **Stability** | `HIGH` |
| **Tech Debt** | None registered |
| **Risk Level** | `CRITICAL` — all DB-dependent modules depend on this |
| **Stability Score** | 70 / 100 |
| **Next Migration** | None planned |

**Responsibilities:** Primary MongoDB connection. QMeet MongoDB connection. SystemSettings bootstrap connection. SMTP config exposure. Failover logic.

---

### models — Mongoose Model Registry

| Field | Value |
|---|---|
| **Owner** | Engineering |
| **Location** | `server/models.ts` |
| **Status** | `STABLE` |
| **Stability** | `MEDIUM` |
| **Tech Debt** | None registered |
| **Risk Level** | `HIGH` — schema changes affect all modules |
| **Stability Score** | 60 / 100 |
| **Next Migration** | None — schemas evolve in place (additive only) |

**Responsibilities:** All Mongoose model definitions. Schema validation. `toJSON` transforms.

---

## Ownership Summary Table

| Module | Status | Risk | Score | Next Migration |
|---|---|---|---|---|
| email domain | MIGRATING | HIGH | 42 | Migration 010 |
| crm domain | MIGRATING | MEDIUM | 48 | Migration 010 |
| mail domain | MIGRATING | MEDIUM | 45 | Migration 010 |
| auth | LEGACY | CRITICAL | 55 | TBD |
| routes | LEGACY | HIGH | 28 | Ongoing |
| qmeet | STABLE | MEDIUM | 52 | TBD |
| ai | STABLE | LOW | 60 | TBD |
| email-marketing | STABLE | MEDIUM | 50 | TBD |
| notifications | STABLE | MEDIUM | 58 | TBD |
| payments | STABLE | HIGH | 55 | TBD |
| deployment-cloud | STABLE | MEDIUM | 55 | TBD |
| sandbox | EXPERIMENTAL | HIGH | 35 | TBD (security audit) |
| cron | STABLE | LOW | 62 | TBD |
| connection-manager | STABLE | CRITICAL | 70 | None |
| models | STABLE | HIGH | 60 | None |
