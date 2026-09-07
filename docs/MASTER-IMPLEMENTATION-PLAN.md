# QIROX Enterprise OS — Master Implementation Plan
## Sprint 006 — Single Source of Truth

**Classification:** Master Implementation Document — Supersedes all prior execution plans  
**Type:** Documentation Only — Zero production changes  
**Date:** 2026-07-11  
**Status:** Active — This document governs all implementation from Sprint 007 onward  
**Input documents merged:** ENTERPRISE-OS-VISION, SPRINT-005-ENTERPRISE-BLUEPRINT, PRODUCT-GAP-ANALYSIS, sprint-001–005 reports, EXECUTION_PLAN, ROADMAP, SECURITY, ARCHITECTURE, DATABASE, API_STANDARDS, PERMISSIONS, RBAC_DESIGN, STABILITY-INDEX, MODULE-OWNERSHIP, DEPENDENCY-REGISTER, tech-debt-register, definition-of-done, all ADRs, all governance docs

---

## 1. Current Progress

### Overall Platform Completion

**Enterprise OS Completion: ~43%**

This figure measures progress toward the complete 23-department Enterprise OS vision defined in Sprint 005. The existing codebase is a strong V3 foundation — 166 pages, 632+ API endpoints, 11 user roles — but most new departments are unbuilt and critical gaps remain in security, architecture, and payment compliance.

### Progress by Layer

| Layer | Completion | Bottleneck |
|---|---|---|
| Security foundation | 25% | 2 CRITICAL + 6 HIGH open issues |
| Architecture foundation | 30% | routes.ts monolith (28/100 stability), no tests |
| Database integrity | 50% | Missing indexes, no soft-delete, wallet not atomic |
| API standardization | 20% | No Zod validation, no consistent response format |
| Frontend architecture | 35% | 166 flat pages, no feature modules, RTL bug |
| SEO & performance | 40% | No SSR, static sitemap, no Core Web Vitals data |
| Client portal | 70% | V2 journey unactivated, delivery/review flow missing |
| Employee portal | 60% | V2 dashboard, internal chat, QR attendance missing |
| QAdmin | 75% | Feature flag UI incomplete, RBAC V2 unbuilt |
| CRM | 40% | V1 exists; V2 + Customer Timeline missing |
| Finance | 60% | ZATCA missing (legal), Stripe missing, milestone payments missing |
| HR | 35% | QR attendance, Apple Wallet, performance reviews missing |
| Operations | 55% | Calendar, announcements, document center missing |
| Sales | 50% | Proposal Builder, Contract Builder missing |
| Marketing | 55% | Email marketing live; campaign tracker, UTM missing |
| Events Platform | 30% | QMeet (video) only; physical events, QR tickets missing |
| WhatsApp Platform | 20% | 6 wa.me templates only; gateway and automation missing |
| AI Platform | 65% | Core AI live; meeting summariser, proposal gen missing |
| Analytics | 35% | Basic admin analytics; KPIs, funnel, cohorts missing |
| Knowledge Base | 0% | Not started |
| SOP Management | 0% | Not started |
| Brand Center | 5% | Docs only, no UI |
| Company Assets | 0% | Not started |
| Media Library | 5% | Uploads exist, no library UI |
| Executive Management | 10% | No unified leadership view |
| Investor Relations | 20% | Basic portal, no presentation center |
| Customer Success V2 | 35% | Sprint 003 architecture exists (feature-flagged off) |
| SEO Platform | 40% | Meta tags live; dashboard, dynamic sitemap missing |

---

## 2. Remaining Work

### Foundation Work (Must Complete Before Feature Work)

| # | Work Item | Severity | Effort |
|---|---|---|---|
| F-01 | Close 2 CRITICAL security vulnerabilities | CRITICAL | 1 day |
| F-02 | Close 6 HIGH security vulnerabilities | HIGH | 3 days |
| F-03 | Fix RTL/LTR direction conflict (G-UX-02) | CRITICAL (UX) | 3 days |
| F-04 | Split routes.ts monolith (stability: 28/100) | HIGH | 1–2 weeks |
| F-05 | Add rate limiting to auth routes | HIGH | 1 day |
| F-06 | Add MIME validation to file uploads | HIGH | 1 day |
| F-07 | Migrate 14 legacy email templates to domain | MEDIUM | 1 week |
| F-08 | Add Zod validation stubs (TECH-004) | MEDIUM | 3 days |
| F-09 | Add missing MongoDB indexes | MEDIUM | 1 day |
| F-10 | Fix wallet balance atomicity | MEDIUM | 1 day |

### Legal/Compliance Work (Cannot Ship Without)

| # | Work Item | Requirement | Effort |
|---|---|---|---|
| L-01 | ZATCA e-invoicing (Saudi legal mandate) | Phase 2 mandatory | 3–4 weeks |
| L-02 | Mada / STC Pay / SADAD payments | Saudi market critical | 2–3 weeks |
| L-03 | GDPR data export / right-to-erasure | Compliance best practice | 1 week |
| L-04 | Revoke Apple Distribution certificate from repo | CRITICAL security | 2 hours |

### Feature Work (Ordered by Priority — See Section 18)

Total remaining feature tasks: **100** (see Section 20 — TOP 100 Tasks)

---

## 3. Remaining Technical Debt

| ID | Title | Risk | Target |
|---|---|---|---|
| TECH-001 | 14 email templates still via legacy adapter | MEDIUM | Sprint 007 |
| TECH-002 | `baseTemplate`/`emailBanner` duplicated in two files | MEDIUM | Sprint 007 |
| TECH-003 | CRM and Mail mappers are pass-throughs (no typed DTOs) | LOW | Sprint 009 |
| TECH-004 | Zod validation schemas are stubs in all domains | LOW | Sprint 007 |
| TECH-005 | Admin email routes still in routes.ts | LOW | Sprint 008 |
| TECH-006 | No unit tests for any domain layer function | MEDIUM | Sprint 010 |
| TECH-007 | server/email.ts is a 1310-line monolith | LOW | Sprint 007 |
| TECH-008 | Mail domain route surface undocumented | LOW | Sprint 008 |
| TECH-009 (new) | routes.ts monolith (16,975 lines, stability 28/100) | HIGH | Sprint 007 |
| TECH-010 (new) | No TypeScript strict mode; `any` casts widespread | MEDIUM | Sprint 009 |
| TECH-011 (new) | No test harness (0% coverage across entire platform) | HIGH | Sprint 010 |
| TECH-012 (new) | SAR→USD conversion hardcoded at 3.75 | LOW | Sprint 008 |
| TECH-013 (new) | PostgreSQL/Drizzle config present but unused | LOW | Sprint 007 |
| TECH-014 (new) | AntiDevTools.tsx is security theater; should be removed | LOW | Sprint 007 |
| TECH-015 (new) | console.log in 29+ production client files | MEDIUM | Sprint 007 |

---

## 4. Remaining Migrations

Migrations follow the zero-downtime additive pattern established in ADR-002.

| Migration | Description | Phase | Dependency |
|---|---|---|---|
| Migration 010 | Wire Zod validation to CRM, Email, Mail domains (TECH-004) | Foundation | Current |
| Migration 011 | Complete email domain migration (TECH-001, TECH-002, TECH-007) | Foundation | Migration 010 |
| Migration 012 | Extract admin email routes from routes.ts (TECH-005, TECH-008) | Foundation | Migration 011 |
| Migration 013 | Add typed DTOs to CRM and Mail mappers (TECH-003) | Foundation | Migration 012 |
| Migration 014 | Split routes.ts — Phase 1 (auth, users, orders) | Architecture | Migration 010 |
| Migration 015 | Split routes.ts — Phase 2 (projects, finance, CRM) | Architecture | Migration 014 |
| Migration 016 | Split routes.ts — Phase 3 (admin, notifications, all remaining) | Architecture | Migration 015 |
| Migration 017 | Add MongoDB indexes + wallet atomicity | Database | Migration 010 |
| Migration 018 | Standardise API response format across all routes | API | Migration 016 |
| Migration 019 | Add rate limiting to all auth + sensitive routes | Security | Migration 014 |
| Migration 020 | Introduce test harness (Vitest); seed domain tests | Testing | Migration 016 |
| Migration 021 | Remove TypeScript @ts-nocheck; fix all type errors | TypeScript | Migration 016 |
| Migration 022 | Extract auth to domain module (server/domains/auth/) | Architecture | Migration 021 |

---

## 5. Remaining Sprints

| Sprint | Theme | Primary Deliverables | Duration |
|---|---|---|---|
| **Sprint 007** | Foundation Hardening | Security fixes, routes.ts split Phase 1, email domain complete, tech debt TECH-001 to 007 | 2 weeks |
| **Sprint 008** | Foundation + Revenue | Routes.ts split Phase 2+3, API standardisation, Proposal Builder, Contract Builder, Executive Dashboard | 2 weeks |
| **Sprint 009** | Client Journey Activation | Customer Dashboard V2 wired (Sprint 003 architecture), Client Progress Center (Sprint 004 design), CRM V2 + Customer Timeline | 2 weeks |
| **Sprint 010** | Payments & Legal | ZATCA e-invoicing, Mada/STC Pay integration, Stripe, order status push notifications, SLA tracking | 3 weeks |
| **Sprint 011** | People & Knowledge | HR QR Attendance, Employee Dashboard V2, Internal Chat, Knowledge Base, Wiki, Brand Center | 2 weeks |
| **Sprint 012** | Data & Intelligence | Analytics V2 (KPIs, funnels, cohorts), Time Tracking, Resource Capacity View, SEO Dashboard | 2 weeks |
| **Sprint 013** | Events & Identity | Events Platform (physical + QR), QR Employee Identity, Apple Wallet cards, Asset Tracking | 2 weeks |
| **Sprint 014** | Advanced Communications | WhatsApp Gateway, WhatsApp Broadcasts, Internal Announcements, Company Calendar, Document Center | 2 weeks |
| **Sprint 015** | Platform Hardening | Test harness (Vitest), RBAC V2, Audit Log V2, SOP Management, Expense Tracking, GDPR tooling | 2 weeks |
| **Sprint 016** | Investor & Presentation | Investor Presentation Center, Client Pitch Builder, Case Studies, Media Library, Brand Center V2 | 2 weeks |
| **Sprint 017** | AI Enhancement | AI Proposal Generation, AI Meeting Summariser, AI Content Writer, Document Analyser | 2 weeks |
| **Sprint 018** | Mobile & App Store | iOS App Store compliance (post Apple cert revocation), native push, QMeet iOS WebRTC fix | 2 weeks |
| **Sprint 019** | SEO & Performance | SSR for public pages, dynamic sitemap, JSON-LD schema markup, Core Web Vitals | 2 weeks |
| **Sprint 020** | QiroxOS V1 Release | Integration testing, performance benchmarking, go-live preparation, production readiness | 1 week |

**Total estimated duration: 29 weeks from Sprint 007 start**

---

## 6. Module Dependency Graph

```
TIER 0 — SECURITY (no dependencies; must be first)
  SEC-CRIT-001 (session secret)
  SEC-CRIT-002 (sandbox exec)
  SEC-HIGH-002 (Apple cert)
  SEC-HIGH-004 (rate limiting on auth)
  SEC-HIGH-006 (MIME validation)
        │
        ▼
TIER 1 — ARCHITECTURE FOUNDATION
  routes.ts split ──────────────────────────────────────────────────────┐
  models.ts verified (already split)                                     │
  Zod validation (TECH-004)                                             │
  Email domain complete (TECH-001, 002, 007)                            │
        │                                                               │
        ▼                                                               │
TIER 2 — DATABASE + API                                                 │
  MongoDB indexes                                                       │
  Wallet atomicity                                                      │
  API response standardisation ◄──────────────────────────────────────┘
  Rate limiting (all routes)
  TypeScript strict (TECH-010)
        │
        ▼
TIER 3 — FEATURE FOUNDATION (gate before client-visible work)
  ┌─────────────────────┐    ┌──────────────────────────┐
  │ Customer Journey V2 │    │ CRM V2 + Customer        │
  │ (Sprint 003 arch)   │    │ Timeline                  │
  │ Feature flag OFF    │    │ Feature flag OFF          │
  └──────────┬──────────┘    └──────────────────────────┘
             │
             ▼
TIER 4 — CLIENT FEATURES                  TIER 4 — INTERNAL FEATURES
  Client Progress Center ──────►          Proposal Builder ──────►
  Delivery Experience                     Contract Builder           Exec Dashboard
  Review Experience                       Time Tracking              Company KPIs
  Onboarding Tour ──────────►            Resource View              Analytics V2
  ZATCA e-invoicing                       Employee Dashboard V2
  Mada / STC Pay                         Internal Chat
  Stripe                                 HR QR Attendance
  WhatsApp Notifications                 Knowledge Base
        │                                       │
        ▼                                       ▼
TIER 5 — ADVANCED FEATURES
  Events Platform ──────────────────────────────────────────────────────►
  Apple Wallet Cards ────────────────────────────────────────────────────►
  WhatsApp Gateway ──────────────────────────────────────────────────────►
  Investor Presentation Center ──────────────────────────────────────────►
  RBAC V2 ───────────────────────────────────────────────────────────────►
        │
        ▼
TIER 6 — PLATFORM INTELLIGENCE
  AI Proposal Generation (depends on: Proposal Builder)
  AI Meeting Summary (depends on: QMeet transcript capture)
  SEO SSR (depends on: Architecture Foundation)
  Test Harness (depends on: TypeScript strict)

TIER 7 — APP STORE & RELEASE
  iOS App Store compliance (depends on: Apple cert revoked)
  Native push notifications
  Go-live preparation
```

---

## 7. Critical Path

The minimum sequence of work that determines the earliest possible go-live date:

```
1. SEC-CRIT-001 + SEC-CRIT-002 (1 day)
   └─► 2. Auth rate limiting + MIME validation (1 day)
         └─► 3. routes.ts split Phase 1 (1 week)
               └─► 4. routes.ts split Phase 2+3 (1 week)
                     └─► 5. API standardisation (1 week)
                           └─► 6. TypeScript strict (1 week)
                                 ├─► 7a. Customer Journey V2 wired (2 weeks) ─────────────────────────┐
                                 └─► 7b. ZATCA e-invoicing (3 weeks) ──────────────────────────────────┤
                                                                                                         │
                                                                                                         ▼
                                                                                                  8. INTEGRATION TEST
                                                                                                     (1 week)
                                                                                                         │
                                                                                                         ▼
                                                                                                  9. GO-LIVE
```

**Critical path duration: ~12 weeks minimum**  
Features not on the critical path (WhatsApp Gateway, Apple Wallet, Events Platform, Investor Center) can be built in parallel.

---

## 8. Parallel Work Opportunities

These workstreams are independent and can be executed by separate teams simultaneously:

| Track A | Track B | Track C |
|---|---|---|
| Foundation hardening (security + architecture) | CRM V2 + Customer Timeline | Brand Center + Media Library |
| ZATCA e-invoicing | HR QR Attendance + Payroll | SEO Platform + Dynamic Sitemap |
| Analytics V2 (KPIs, funnel) | Knowledge Base + Wiki | Events Platform (physical) |
| Proposal Builder + Contract Builder | Employee Dashboard V2 | Investor Presentation Center |
| Stripe integration | Internal Chat | Apple Wallet Cards |
| Client Progress Center (Sprint 004) | SOP Management | AI Proposal Generation |

**Constraint:** All Track A work (Foundation) must complete before any track promotes to production. Tracks B and C can be built behind feature flags in parallel.

---

## 9. High Risk Areas

| # | Area | Risk Description | Severity | Mitigation |
|---|---|---|---|---|
| R-01 | **routes.ts split** (16,975 lines, stability 28/100) | Large refactor; any missed import breaks an endpoint | CRITICAL | Move one domain at a time; test each domain immediately; keep rollback shim |
| R-02 | **ZATCA e-invoicing** | Saudi legal mandate; implementation requires ZATCA API credentials, XML generation, QR codes per invoice | CRITICAL | Engage ZATCA-certified integrator; staged rollout starting with new invoices |
| R-03 | **Apple Distribution cert in repo** | Private key permanently compromised; existing cert must be revoked before App Store resubmission | CRITICAL | Revoke + remove from git history immediately (BFG Repo Cleaner) |
| R-04 | **Wallet balance atomicity** | Concurrent payment requests can produce negative balances | HIGH | MongoDB transactions on all wallet operations; staging load test before prod |
| R-05 | **sessionStorage wizard handoff** (Sprint 004 P-02) | Tab close = lost order; no server-persisted draft | HIGH | Implement draft-orders API (Sprint 009) before activating V2 wizard |
| R-06 | **WhatsApp Business API** (G-NOT-03) | Meta approval process unpredictable; can take 2–8 weeks | HIGH | Apply for API access immediately; build with wa.me fallback |
| R-07 | **Mada / STC Pay integration** | Requires Moyasar or HyperPay merchant account + testing environment | HIGH | Open merchant account application immediately; 2–4 week approval |
| R-08 | **AI tool executor NoSQL injection** (SEC-HIGH-001) | LLM-generated arguments used in Mongoose queries without validation | HIGH | Add Zod schemas to all AI tool arguments; reject `$` operator keys |
| R-09 | **No test coverage (0%)** | Every refactor is untested; regressions only caught manually | HIGH | Introduce Vitest in Sprint 010; domain tests before architecture migrations |
| R-10 | **Email domain migration** (TECH-001, 007) | 14 legacy templates still in legacy adapter; two parallel code paths | MEDIUM | Migrate 2–3 templates per sprint; maintain parity tests |
| R-11 | **QMeet WebRTC on iOS** (APPLE-002) | WebRTC does not work on iOS when served from non-default ports | MEDIUM | Confirm HTTPS + correct ports before App Store resubmission |
| R-12 | **RTL/LTR conflict** (G-UX-02) | Layout.tsx hardcodes `dir="ltr"` despite Arabic being primary | CRITICAL (UX) | Fix in Sprint 007 before any new UI is built |
| R-13 | **Customer Journey V2 activation** | 11-section dashboard with placeholder sections; real API wiring needed | MEDIUM | Sprint 009 wires each section; feature flag prevents premature exposure |
| R-14 | **RBAC V2 implementation** | Touches all 710+ route handlers; incorrect implementation = auth bypass | HIGH | Declarative permission config first; staged rollout by domain |

---

## 10. Rollback Strategy

### Platform-Level Rollback

1. **Feature flags** — every new department/feature has a flag defaulting to `false`. Setting any flag back to `false` immediately restores V1 behaviour. No code change required.
2. **Zero-downtime additive policy** — no existing endpoint modified, no collection field deleted, no schema type changed. Rollback is always possible by reverting the new endpoint registration.
3. **Git checkpoints** — Replit creates checkpoints automatically. Any migration can be reverted to its prior checkpoint.
4. **Architecture rollback** — routes.ts migration keeps original file active until the new domain file is verified. The new file is imported by a thin shim; removing the shim import reverts the domain.

### Per-Migration Rollback

Every migration document must include (per definition-of-done.md):
- A single-file or single-import rollback instruction
- Explicit statement of which checkpoint contains the pre-migration state
- Database: list of additive fields that can be ignored (not deleted) on rollback

### Emergency Rollback

If a critical bug is discovered in production:
1. Set the relevant feature flag to `false` → immediate client-visible rollback
2. If feature flag is insufficient: Replit checkpoint rollback
3. Database: no rollback needed (additive schema changes leave existing docs intact)

---

## 11. Release Strategy

### Release Tiers

| Tier | Audience | Gate |
|---|---|---|
| **Internal Alpha** | QIROX staff only | Feature flag `true` for `role: admin` only |
| **Internal Beta** | All employees | Feature flag `true` for all internal roles |
| **Client Canary** | 10% of new client accounts | Feature flag `true` for canary-flagged users |
| **Full Rollout** | All users | Feature flag `true` globally |
| **V1 Deprecation** | Old experience removed | After 90 days at 100% rollout |

### Release Sequence

```
Sprint 007 → Internal Alpha (foundation fixes only; no client-visible changes)
Sprint 008 → Internal Alpha (proposals, contracts; employees only)
Sprint 009 → Internal Beta (Customer Journey V2 for employees to test)
Sprint 010 → Client Canary (V2 journey live for 10% of new clients; ZATCA on all invoices)
Sprint 011 → Client Canary extended to 25%
Sprint 012 → Client Canary extended to 50%
Sprint 013 → Full Rollout of Customer Journey V2
Sprint 014 → Full Rollout of WhatsApp + Announcements
Sprint 015 → Full Rollout of all Sprint 011–014 features
Sprint 016–019 → Individual feature releases on same canary→full pattern
Sprint 020 → QiroxOS V1 Release
```

---

## 12. Production Readiness Checklist

### Infrastructure
- [ ] `SESSION_SECRET` verified in environment (not hardcoded fallback)
- [ ] `MONGODB_URI` verified connected to production Atlas cluster
- [ ] `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` set for push notifications
- [ ] `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` set (production credentials)
- [ ] `OPENAI_API_KEY` or `MOONSHOT_API_KEY` set
- [ ] `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` set for DeploymentCloud
- [ ] All feature flags verified at intended state (new features: `false` by default)
- [ ] Cron jobs verified running and healthy
- [ ] WebSocket server verified connecting
- [ ] Health endpoints responding: `/health/live`, `/health/ready`, `/health/detailed`

### Security
- [ ] SEC-CRIT-001 resolved (session secret hardcode removed)
- [ ] SEC-CRIT-002 resolved (exec → execFile in sandbox)
- [ ] Apple Distribution private key removed from git history
- [ ] Auth rate limiting active on `/api/login`, `/api/register`, `/api/forgot-password`
- [ ] MIME type validation active on all file upload endpoints
- [ ] Security headers (helmet) active
- [ ] CSRF protection verified
- [ ] 2FA mandatory for `admin` role

### Performance
- [ ] MongoDB indexes in place (per DATABASE.md DB-001 through DB-009)
- [ ] API response times < 300ms for list endpoints (p95)
- [ ] No N+1 query patterns on any page
- [ ] CDN or object storage for uploaded files (not local disk)
- [ ] Image compression pipeline active
- [ ] Lighthouse performance score > 80 on homepage

### Data
- [ ] Wallet balance atomicity verified (MongoDB transactions)
- [ ] Invoice soft-delete active
- [ ] TTL indexes on notifications (30d), activity_logs (90d), OTPs (15m)
- [ ] Database connection pool configured (maxPoolSize: 20)
- [ ] Backup strategy verified (Atlas automated backups)

---

## 13. Security Checklist

| # | Item | Severity | Status |
|---|---|---|---|
| S-01 | Remove SESSION_SECRET hardcoded fallback (SEC-CRIT-001) | CRITICAL | ❌ Open |
| S-02 | Replace exec() with execFile() in sandbox (SEC-CRIT-002) | CRITICAL | ❌ Open |
| S-03 | Revoke + remove Apple Distribution cert from git history (SEC-HIGH-002) | CRITICAL | ❌ Open |
| S-04 | Add Zod schemas to all AI tool executor arguments (SEC-HIGH-001) | HIGH | ❌ Open |
| S-05 | Restrict MongoDB URI switching to approved hostname whitelist (SEC-HIGH-003) | HIGH | ❌ Open |
| S-06 | Add rate limiting to all auth routes (SEC-HIGH-004) | HIGH | ❌ Open |
| S-07 | Add CSRF protection (SEC-HIGH-005) | HIGH | ❌ Open |
| S-08 | Add MIME type validation to all file uploads (SEC-HIGH-006) | HIGH | ❌ Open |
| S-09 | Enforce minimum password complexity (SEC-MED-001) | MEDIUM | ❌ Open |
| S-10 | Add startup env var validation (SEC-MED-002) | MEDIUM | ❌ Open |
| S-11 | Fix silent .catch(() => {}) error swallowing (SEC-MED-003) | MEDIUM | ❌ Open |
| S-12 | Fix execSync pid injection in sandbox-runner.ts (SEC-MED-004) | MEDIUM | ❌ Open |
| S-13 | Remove console.log from 29+ production client files (SEC-MED-005) | MEDIUM | ❌ Open |
| S-14 | Secure Android keystore in CI/CD env vars (SEC-MED-006) | MEDIUM | ❌ Open |
| S-15 | Validate redirect URLs in OAuth callbacks (SEC-MED-007) | MEDIUM | ❌ Open |
| S-16 | Add security headers via helmet (SEC-MED-008) | MEDIUM | ❌ Open |
| S-17 | Enforce mandatory 2FA for admin role (G-ENT-06) | HIGH | ❌ Open |
| S-18 | Add financial audit log (G-ENT-07) | HIGH | ❌ Open |
| S-19 | Add IP allowlist option for admin accounts | MEDIUM | ❌ Open |

---

## 14. Performance Checklist

| # | Item | Target | Status |
|---|---|---|---|
| P-01 | Homepage Lighthouse performance score | > 80 | ❌ Not measured |
| P-02 | API response time p95 (list endpoints) | < 300ms | ❌ Not measured |
| P-03 | MongoDB compound indexes on all high-query collections | Installed | ❌ Missing (DB-002) |
| P-04 | Image optimization pipeline (WebP + srcset) | Active | ❌ Not built |
| P-05 | File uploads to CDN/object storage (not local disk) | Active | ❌ Local disk only |
| P-06 | Connection pool configured (maxPoolSize: 20) | Configured | ❌ Default |
| P-07 | Wallet operations using MongoDB transactions | Atomic | ❌ Not atomic |
| P-08 | Pagination enforced on all list endpoints (max 50) | Enforced | ❌ Some unbounded |
| P-09 | SSR for public pages (LCP < 2.5s) | < 2.5s | ❌ SPA only |
| P-10 | Core Web Vitals measured and baselined | Measured | ❌ No data |
| P-11 | No N+1 query patterns on dashboard pages | Zero | ❌ Unaudited |

---

## 15. QA Checklist

| # | Item | Status |
|---|---|---|
| Q-01 | All 166 pages load without JavaScript errors | ❌ Not systematically tested |
| Q-02 | All 11 user roles can access their permitted pages | ❌ Not systematically tested |
| Q-03 | No user role can access another role's pages | ❌ PERMISSIONS audit has known gaps |
| Q-04 | All forms validate on server-side (not client-side only) | ❌ Zod stubs (TECH-004) |
| Q-05 | All destructive actions require confirmation | ❌ Unaudited |
| Q-06 | All loading states are visible on throttled network | ❌ Unaudited |
| Q-07 | All error states are visible with network disconnected | ❌ Unaudited |
| Q-08 | All empty states are visible on new accounts | ❌ G-UX-05 open |
| Q-09 | Mobile responsiveness verified at 375px viewport | ❌ G-UX-08 open |
| Q-10 | RTL layout correct on all pages | ❌ G-UX-02 open (critical) |
| Q-11 | Push notifications deliver on Chrome, Safari, Firefox | ❌ VAPID config needed |
| Q-12 | PayPal payment flow end-to-end (create → capture → invoice) | ❌ Not systematically tested |
| Q-13 | Wallet top-up and deduction are atomic | ❌ Not atomic currently |
| Q-14 | Session expires correctly after inactivity | ❌ Not tested |
| Q-15 | 2FA enrollment and verification | ❌ Not systematically tested |

---

## 16. Documentation Checklist

| # | Item | Status |
|---|---|---|
| D-01 | All domain modules have README.md | ❌ Mail domain README incomplete (TECH-008) |
| D-02 | All ADRs cover current architectural decisions | ✅ ADR-001 through ADR-004 |
| D-03 | API routes documented (OpenAPI spec) | ❌ Not generated |
| D-04 | RBAC permissions matrix complete | ✅ PERMISSIONS.md + RBAC_DESIGN.md |
| D-05 | Security vulnerabilities tracked | ✅ SECURITY.md |
| D-06 | Technical debt tracked | ✅ tech-debt-register.md (TECH-001 to 015) |
| D-07 | Database schema documented | ✅ DATABASE_BLUEPRINT.md |
| D-08 | All sprint reports written | ✅ Sprint 001–005 reports |
| D-09 | Feature inventory current | ✅ FEATURE_INVENTORY.md |
| D-10 | Page inventory current | ✅ PAGE_INVENTORY.md |
| D-11 | Component inventory current | ✅ COMPONENT_INVENTORY.md |
| D-12 | Dependency register current | ✅ governance/DEPENDENCY-REGISTER.md |
| D-13 | Module ownership register current | ✅ governance/MODULE-OWNERSHIP.md |
| D-14 | Stability index current | ✅ governance/STABILITY-INDEX.md |
| D-15 | Definition of done enforced | ✅ definition-of-done.md |
| D-16 | MASTER-IMPLEMENTATION-PLAN created | ✅ This document |

---

## 17. Go-Live Checklist

| # | Item | Owner |
|---|---|---|
| G-01 | All CRITICAL security issues closed | Engineering |
| G-02 | All HIGH security issues closed | Engineering |
| G-03 | ZATCA e-invoicing live and verified | Engineering + Finance |
| G-04 | Mada / STC Pay processing payments | Engineering + Finance |
| G-05 | Customer Journey V2 at 100% rollout | Engineering + Product |
| G-06 | RTL layout correct on all public pages | Engineering + Design |
| G-07 | Push notifications delivering (VAPID configured) | Engineering |
| G-08 | Apple Distribution cert revoked + new cert in place | Engineering |
| G-09 | All feature flags at intended states | Engineering |
| G-10 | Lighthouse performance > 80 on public pages | Engineering |
| G-11 | MongoDB indexes all in place | Engineering |
| G-12 | Wallet atomicity verified with load test | Engineering |
| G-13 | All domain README files complete | Engineering |
| G-14 | OpenAPI spec generated and published | Engineering |
| G-15 | Mandatory 2FA active for admin role | Engineering |
| G-16 | Rate limiting active on all auth routes | Engineering |
| G-17 | CDN/object storage for file uploads | Engineering |
| G-18 | Analytics baseline captured | Product |
| G-19 | Support team trained on new features | Operations |
| G-20 | Rollback plan rehearsed in staging | Engineering |

---

## 18. Phase-by-Phase Implementation Order

### Phase 0 — Emergency Security (Sprint 007, Week 1)
*All work is additive or removes dangerous code. Zero new features.*

1. Remove SESSION_SECRET hardcoded fallback; add startup guard
2. Replace exec() with execFile() in sandbox-routes.ts
3. Revoke Apple Distribution cert; purge from git history
4. Add helmet middleware (security headers)
5. Add startup environment variable validation
6. Add auth route rate limiting
7. Add MIME type validation to upload endpoints
8. Fix execSync pid injection in sandbox-runner.ts
9. Fix RTL/LTR direction conflict (G-UX-02) — critical UX

### Phase 1 — Architecture Foundation (Sprint 007, Week 2 — Sprint 008, Week 2)
*Split monoliths; do not change behaviour.*

1. Complete email domain migration (TECH-001, 002, 007)
2. Wire Zod validation to CRM, Email, Mail domains (TECH-004)
3. Extract admin email routes from routes.ts (TECH-005)
4. Routes.ts split Phase 1: auth, users, notifications
5. Routes.ts split Phase 2: orders, projects, finance
6. Routes.ts split Phase 3: admin, CRM, all remaining
7. Add typed DTOs to CRM and Mail mappers (TECH-003)
8. Remove TypeScript @ts-nocheck; fix type errors
9. Resolve PostgreSQL/Drizzle config (TECH-013)
10. Remove AntiDevTools.tsx (TECH-014)
11. Remove console.log from client code (TECH-015, SEC-MED-005)

### Phase 2 — Database + API (Sprint 008)
*Non-destructive database and API improvements.*

1. Add MongoDB compound indexes to all high-query collections
2. Add TTL indexes: notifications (30d), activity_logs (90d), OTPs
3. Add soft-delete to Invoice, PayrollRecord, ReceiptVoucher
4. Fix wallet balance atomicity (MongoDB transactions)
5. Add default pagination (max 50) to all list endpoints
6. Standardise API response format `{ success, data }` / `{ success, error }`
7. Apply Zod validation to all endpoints (extend TECH-004 work)
8. Apply rate limiting to all route groups
9. Make SAR→USD rate configurable (TECH-012)

### Phase 3 — Client Journey V2 Activation (Sprint 009)
*Wire Sprint 003 architecture to real APIs; activate behind feature flags.*

1. Implement `/api/v2/draft-orders` CRUD (Sprint 004 API spec)
2. Implement `/api/v2/estimate-price` (Sprint 004 API spec)
3. Wire all 11 DashboardV2 sections to real API data
4. Implement Client Progress Center (`/project/:id`) — Sprint 004 design
5. Implement `GET /api/v2/projects/:id/client-view`
6. Implement `GET /api/v2/projects/:id/updates`
7. Implement `GET /api/v2/projects/:id/client-tasks`
8. Implement `GET /api/v2/projects/:id/shared-files`
9. Implement Digital Agreement (`POST /api/v2/quotations/:id/accept`)
10. Implement Delivery Acceptance (`POST /api/v2/projects/:id/delivery-accept`)
11. Enable `FEATURE_CUSTOMER_JOURNEY_V2=true` for internal alpha
12. Implement client-side guided onboarding tour (G-CJ-01)
13. Implement email verification on registration (G-CJ-02)

### Phase 4 — Payments + Legal (Sprint 010)
*Legal compliance + revenue expansion.*

1. ZATCA e-invoice XML generation + QR encoding
2. ZATCA API integration (Phase 2 mandate)
3. Moyasar SDK integration (Mada, STCPAY, SADAD, Visa/MC)
4. Stripe integration (international cards, recurring billing)
5. Automated order status push notifications (G-ORD-05) — Critical
6. SLA tracking per order type (G-ORD-01)
7. Estimated delivery date visible to client (G-ORD-04)
8. Auto-convert accepted quotation → invoice (G-QUO-04)
9. Quotation expiry notification (G-QUO-03)
10. Payment failure recovery / dunning emails (G-PAY-06)
11. Refund workflow (G-PAY-05)
12. Automated CRM follow-up reminders (G-CRM-06) — Critical

### Phase 5 — People + Knowledge (Sprint 011)
*Internal tooling for employees and management.*

1. HR QR Attendance — daily QR session, scan → clock-in/out
2. Employee Dashboard V2 — personal KPIs, today's tasks, announcements
3. Internal Chat — employee WebSocket messaging (extends ws.ts)
4. Knowledge Base — articles, categories, full-text search
5. Company Wiki — editable pages with version history
6. Brand Center UI — logo library, color palette, typography system
7. SOP Management — library, builder, acknowledgements
8. Performance Reviews — structured quarterly review model
9. Leave Management — self-service leave requests + approvals
10. Employee Onboarding Checklist (G-ONB-04)

### Phase 6 — Analytics + Time Tracking (Sprint 012)
*Business intelligence and project financial accuracy.*

1. Company KPI Dashboard (MRR, ARR, CAC, LTV, NPS, churn)
2. Executive Dashboard — live KPIs from all departments
3. Conversion Funnel Analytics (G-ANL-02, G-ADM-07)
4. Behavioral / Product Analytics — event tracking model (G-ANL-01)
5. Retention / Churn Metrics (G-ANL-03)
6. CRM Pipeline Revenue Forecast (G-CRM-07)
7. Time Tracking per task/project (G-EMP-01)
8. Resource Capacity View (G-EMP-02)
9. SEO Dashboard — keyword tracking, Lighthouse scores
10. Dynamic sitemap from MongoDB (G-SEO-01)

### Phase 7 — Events + Identity (Sprint 013)
*Physical presence and identity.*

1. Events Platform — create events, venues, capacity
2. QR Event Check-in — single-use secure tickets
3. Customer Event Invitations — branded email + WhatsApp
4. QR Employee Identity Card — HMAC-signed QR
5. Apple Wallet PKPass generation for employees
6. Company Assets registry + assignment
7. Equipment requests workflow
8. Software license management

### Phase 8 — Communications (Sprint 014)
*Internal and external communication infrastructure.*

1. WhatsApp Broadcast Manager (approved templates to segments)
2. Internal Announcements — broadcast to all/specific teams
3. Company Calendar — personal + team + company events
4. Document Center — version-controlled project document library
5. Meeting Center — structured agendas, notes, action items
6. CRM → Email campaign integration (G-CRM-08)
7. UTM link builder + lead attribution (G-CRM-04)
8. Duplicate lead detection (G-CRM-03)

### Phase 9 — Hardening + Test Coverage (Sprint 015)
*Platform stability.*

1. Vitest test harness setup
2. Unit tests for all domain layer functions (TECH-006)
3. RBAC V2 declarative permission engine
4. Audit Log V2 — actor, resource, action, scope per request
5. GDPR data export / right-to-erasure tooling (G-ENT-05)
6. Expense tracking + approval workflow (G-EMP-08)
7. Milestone-based payment schedule
8. VAT / ZATCA automation for all new invoices
9. IP allowlist for admin accounts

### Phase 10 — Presentation + AI (Sprints 016–017)
1. Investor Presentation Center + Data Room
2. Client Pitch Builder
3. Case Studies + Portfolio Manager
4. Media Library — organised with categories, tags, usage tracking
5. AI Proposal Generation (from order/wizard data)
6. AI Meeting Summariser (QMeet transcript → summary)
7. AI Content Writer
8. Prompt Management admin panel

### Phase 11 — Mobile + SEO (Sprints 018–019)
1. iOS App Store compliance (new cert, IAP audit)
2. QMeet WebRTC fix on iOS
3. Native push notifications (Capacitor)
4. SSR for all public pages
5. JSON-LD schema markup (Service, Review, FAQ, Organization)
6. Dynamic OG image generation
7. hreflang on all dynamic pages
8. Core Web Vitals optimization

### Phase 12 — Go-Live Preparation (Sprint 020)
1. Full integration test suite
2. Performance benchmarking + optimization
3. Security penetration test
4. Staging → production promotion plan
5. Rollback rehearsal
6. Support team training
7. Monitoring + alerting setup

---

## 19. Estimated Timeline

| Milestone | Sprint | Estimated Date (from Sprint 007 start) |
|---|---|---|
| All CRITICAL security closed | Sprint 007 | Week 1 |
| Architecture foundation stable | Sprint 008 | Week 4 |
| Customer Journey V2 internal alpha | Sprint 009 | Week 6 |
| ZATCA + Mada payments live | Sprint 010 | Week 9 |
| Employee tools live (chat, KB, attendance) | Sprint 011 | Week 11 |
| Company KPIs + analytics live | Sprint 012 | Week 13 |
| Events + Apple Wallet live | Sprint 013 | Week 15 |
| Internal communications live | Sprint 014 | Week 17 |
| Test coverage > 50%; RBAC V2 | Sprint 015 | Week 19 |
| Investor center + AI enhancements | Sprint 016–017 | Week 23 |
| App Store resubmission | Sprint 018 | Week 25 |
| SEO SSR + Core Web Vitals | Sprint 019 | Week 27 |
| **QiroxOS V1 Release** | Sprint 020 | **Week 29** |

---

## 20. Definition of "QIROX 100% Complete"

QIROX is 100% complete when all of the following are true:

**Security**
- Zero CRITICAL or HIGH open security vulnerabilities
- Mandatory 2FA active for all admin-role accounts
- Financial audit log immutable and active

**Legal & Compliance**
- ZATCA Phase 2 e-invoicing live and compliant
- GDPR data export/erasure tooling live
- All contracts have e-signature capability

**Client Experience**
- Customer Journey V2 at 100% rollout (zero feature flags blocking)
- Client Progress Center live for all active projects
- Onboarding tour on first login
- Push, email, and WhatsApp notifications delivering on all order/project events

**Employee Experience**
- Employee Dashboard V2 replacing Employee Hub
- Internal chat live
- QR attendance + Apple Wallet employee cards
- Knowledge Base + SOP Management with acknowledgements
- Time tracking + resource capacity view active
- Performance review system live

**Financial**
- Mada / STC Pay / SADAD live
- Stripe live
- Automated recurring billing for subscriptions
- Milestone-based payment model live
- Refund workflow live
- Revenue forecasting + financial KPI dashboard live

**Intelligence**
- Company KPI dashboard live (MRR, ARR, CAC, LTV, NPS, churn)
- Conversion funnel analytics live
- Behavioral analytics event tracking active
- CRM V2 + Customer Timeline live

**Platform**
- routes.ts fully split (stability > 70 on all modules)
- Test coverage > 70% on all domain modules
- RBAC V2 declarative and active
- TypeScript strict mode; zero `any` casts without TECH-ID
- Lighthouse performance > 80 on all public pages
- SEO score > 95 on all public pages; SSR active
- Dynamic sitemap covering all published content

**Presence**
- Events Platform live (physical + virtual)
- Brand Center live (logos, colors, typography in-system)
- Media Library live (all assets organised)
- Investor Presentation Center live

**Mobile**
- iOS App Store live (new cert, ZATCA, IAP compliance)
- Google Play live
- Native push notifications
- QMeet WebRTC working on iOS

---

## Module Progress Table

| Module | Progress | Remaining | Priority | Risk |
|---|---|---|---|---|
| **Security** | 25% | Close 2 CRITICAL + 6 HIGH | P0 | CRITICAL |
| **routes.ts** | 15% (split) | Full domain extraction | P0 | CRITICAL |
| **Email domain** | 55% | 14 legacy templates, Zod validation | P0 | HIGH |
| **CRM domain** | 60% | Typed DTOs, Zod | P1 | MEDIUM |
| **Mail domain** | 55% | README, Zod | P1 | MEDIUM |
| **Auth module** | 65% | Domain extraction, 2FA enforcement | P0 | CRITICAL |
| **Payments** | 50% | Stripe, Mada, ZATCA, recurring | P0 | HIGH |
| **Sandbox** | 55% (stability 35) | execFile fix, security hardening | P0 | HIGH |
| **Wallet** | 60% | Atomic transactions, load test | P0 | HIGH |
| **Client Portal** | 70% | V2 journey activation, delivery flow | P1 | MEDIUM |
| **Employee Portal** | 60% | V2 dashboard, chat, QR attendance | P1 | MEDIUM |
| **QAdmin** | 75% | Feature flag UI, RBAC V2 | P1 | MEDIUM |
| **Executive Mgmt** | 10% | Full build | P1 | LOW |
| **Operations** | 55% | Calendar, announcements, docs | P2 | LOW |
| **Sales** | 50% | Proposal Builder, Contract Builder | P1 | MEDIUM |
| **CRM V2** | 20% | Customer Timeline, lead scoring | P1 | MEDIUM |
| **Customer Success** | 45% | V2 journey wired, health scores | P1 | MEDIUM |
| **Project Mgmt** | 55% | Milestones, client view, time tracking | P1 | MEDIUM |
| **Finance** | 60% | ZATCA, Stripe, Mada, milestones | P0 | HIGH |
| **HR** | 35% | QR attendance, Apple Wallet, reviews | P2 | MEDIUM |
| **Marketing** | 55% | Campaign tracker, UTM, lead scoring | P2 | LOW |
| **Brand Center** | 5% | Full build | P3 | LOW |
| **Company Presentation** | 20% | Pitch builder, case studies | P3 | LOW |
| **Events Platform** | 30% | Physical events, QR tickets | P2 | MEDIUM |
| **WhatsApp Platform** | 20% | Gateway, broadcasts | P2 | HIGH |
| **Employee Experience** | 40% | Dashboard V2, chat, recognition | P2 | LOW |
| **Investor Relations** | 20% | Presentation center, data room | P3 | LOW |
| **Knowledge Base** | 0% | Full build | P2 | LOW |
| **SOP Management** | 0% | Full build | P2 | LOW |
| **Company Assets** | 0% | Full build | P3 | LOW |
| **Media Library** | 5% | Full build | P2 | LOW |
| **Analytics** | 35% | KPIs, funnel, cohorts, time tracking | P1 | MEDIUM |
| **AI Platform** | 65% | Proposal gen, meeting summary | P2 | LOW |
| **SEO Platform** | 40% | Dashboard, SSR, schema markup | P2 | MEDIUM |
| **QAdmin (System)** | 75% | Feature flag UI V2, RBAC V2 | P1 | HIGH |
| **Notifications** | 60% | WhatsApp, SMS, preferences | P1 | MEDIUM |
| **QMeet** | 65% | iOS WebRTC, meeting notes | P2 | MEDIUM |
| **Database** | 50% | Indexes, atomicity, pagination | P0 | HIGH |
| **Testing** | 0% | Full test harness + coverage | P1 | HIGH |
| **TypeScript** | 40% | Remove @ts-nocheck, strict mode | P1 | MEDIUM |

---

## TOP 100 Remaining Implementation Tasks

*Ordered by dependency. Complete earlier tasks before starting later ones unless explicitly independent.*

---

### FOUNDATION PHASE (Tasks 001–020)

---

**TASK-001**
- **Title:** Remove SESSION_SECRET hardcoded fallback
- **Description:** In `server/auth.ts`, remove the fallback `|| "qirox_super_secret_key_2024"`. Add startup guard: `if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET is required")`.
- **Depends On:** Nothing
- **Estimated Complexity:** Low
- **Estimated Time:** 15 minutes
- **Risk:** LOW — SESSION_SECRET already set in Replit secrets
- **Feature Flag:** None (security fix)
- **Verification:** App starts with SESSION_SECRET set. App throws and refuses to start without it.

---

**TASK-002**
- **Title:** Replace exec() with execFile() in sandbox
- **Description:** In `server/sandbox-routes.ts`, replace all `exec(buildCmd, ...)` calls with `execFile()` + explicit argument arrays. Validate `projectDir` against an allowlist of known sandbox directories before use.
- **Depends On:** Nothing
- **Estimated Complexity:** Medium
- **Estimated Time:** 2 hours
- **Risk:** MEDIUM — must not break existing sandbox build functionality
- **Feature Flag:** None (security fix)
- **Verification:** Sandbox builds existing projects successfully. Injection attempt with `; rm -rf /tmp/test` is blocked.

---

**TASK-003**
- **Title:** Fix execSync pid injection in sandbox-runner.ts
- **Description:** In `server/sandbox-runner.ts`, parse `pid` as an integer with `parseInt()` and validate it is a positive number before use in `execSync`. Replace template-literal shell command with `process.kill(pid, 'SIGTERM')`.
- **Depends On:** Nothing
- **Estimated Complexity:** Low
- **Estimated Time:** 30 minutes
- **Risk:** LOW
- **Feature Flag:** None
- **Verification:** Process termination still works. Negative and zero PIDs are rejected.

---

**TASK-004**
- **Title:** Add startup environment variable validation
- **Description:** In `server/index.ts`, add a startup validation block that checks all required env vars (`SESSION_SECRET`, `MONGODB_URI`) and throws with a clear error message if any are absent. App must not start without them.
- **Depends On:** TASK-001
- **Estimated Complexity:** Low
- **Estimated Time:** 1 hour
- **Risk:** LOW
- **Feature Flag:** None
- **Verification:** App starts with all vars set. App throws clear error for each missing required var.

---

**TASK-005**
- **Title:** Add helmet security headers
- **Description:** Install and configure `helmet` middleware in `server/index.ts`. Set: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`.
- **Depends On:** Nothing
- **Estimated Complexity:** Low
- **Estimated Time:** 30 minutes
- **Risk:** LOW — additive headers; no breaking changes
- **Feature Flag:** None
- **Verification:** Security headers present in HTTP responses. No existing functionality broken.

---

**TASK-006**
- **Title:** Add rate limiting to authentication routes
- **Description:** Apply `express-rate-limit` to `/api/login`, `/api/register`, `/api/forgot-password`, `/api/reset-password`, `/api/verify-otp`. Max 10 requests per 15 minutes per IP. Return 429 with Arabic error message on breach.
- **Depends On:** TASK-005
- **Estimated Complexity:** Low
- **Estimated Time:** 1 hour
- **Risk:** LOW — express-rate-limit already installed
- **Feature Flag:** None
- **Verification:** 11th login attempt within 15 minutes returns 429. Normal login still works.

---

**TASK-007**
- **Title:** Add MIME type validation to file upload endpoints
- **Description:** Add `file-type` library server-side MIME check on all multer upload handlers. Allowlist: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `application/pdf`. Reject all others with 415 error.
- **Depends On:** Nothing
- **Estimated Complexity:** Medium
- **Estimated Time:** 2 hours
- **Risk:** LOW — additive validation; existing valid uploads continue to work
- **Feature Flag:** None
- **Verification:** `.exe`, `.php`, and `.html` uploads rejected. Valid image/PDF uploads succeed.

---

**TASK-008**
- **Title:** Fix RTL/LTR direction conflict
- **Description:** In `client/src/components/Layout.tsx` (or equivalent root layout), remove hardcoded `dir="ltr"`. Set `dir` dynamically based on selected language: `dir={language === 'ar' ? 'rtl' : 'ltr'}`. Audit all pages for RTL-breaking CSS (e.g., `ml-4` should become `ms-4`, `text-left` should become `text-start`).
- **Depends On:** Nothing
- **Estimated Complexity:** Medium
- **Estimated Time:** 3–5 days
- **Risk:** MEDIUM — touches layout of all 166 pages; visual regression possible
- **Feature Flag:** None
- **Verification:** Arabic pages render with correct RTL layout. English pages render LTR. All icon directions correct.

---

**TASK-009**
- **Title:** Add Zod validation schemas to CRM domain
- **Description:** In `server/domains/crm/validation.ts`, replace null stubs with real Zod schemas for all CRM operations (create lead, update lead, log activity, import). Wire validation middleware to CRM routes. Close TECH-004 for CRM.
- **Depends On:** Nothing
- **Estimated Complexity:** Medium
- **Estimated Time:** 1 day
- **Risk:** LOW — additive validation; existing valid requests continue to work
- **Feature Flag:** None
- **Verification:** Invalid lead creation (missing required fields) returns 400 with Arabic error. Valid requests succeed.

---

**TASK-010**
- **Title:** Add Zod validation schemas to Email domain
- **Description:** In `server/domains/email/validation.ts`, replace null stubs with real Zod schemas. Wire validation middleware to email domain routes. Close TECH-004 for Email.
- **Depends On:** Nothing
- **Estimated Complexity:** Medium
- **Estimated Time:** 1 day
- **Risk:** LOW
- **Feature Flag:** None
- **Verification:** Invalid email send requests return 400. Valid requests deliver email.

---

**TASK-011**
- **Title:** Add Zod validation schemas to Mail domain
- **Description:** In `server/domains/mail/validation.ts`, replace null stubs with real Zod schemas. Document Mail domain route surface in README.md. Close TECH-004 and TECH-008 for Mail.
- **Depends On:** Nothing
- **Estimated Complexity:** Medium
- **Estimated Time:** 1 day
- **Risk:** LOW
- **Feature Flag:** None
- **Verification:** Mail domain README lists all routes. Invalid requests return 400.

---

**TASK-012**
- **Title:** Migrate 14 legacy email templates to email domain
- **Description:** Move QMeet, Wallet Pay, Wallet Top-up, Invoice, Receipt, Quotation, Consultation Confirmation, Consultation Notification, Shipment Update, Features Table, Data Request, Call Rating, Weekly Report template builders from `server/email.ts` to `server/domains/email/domain.ts`. Close TECH-001, TECH-002, TECH-007.
- **Depends On:** TASK-010
- **Estimated Complexity:** High
- **Estimated Time:** 1 week
- **Risk:** HIGH — transactional emails affect payments, orders, meetings; regression = silent email failure
- **Feature Flag:** None
- **Verification:** All 14 email types send successfully after migration. No import from `server/email.ts` in domain files.

---

**TASK-013**
- **Title:** Extract admin email routes from routes.ts
- **Description:** Move `POST /api/admin/connection-settings/email` and `POST /api/admin/email/broadcast` from `server/routes.ts` to `server/domains/email/routes.ts`. Close TECH-005.
- **Depends On:** TASK-012
- **Estimated Complexity:** Low
- **Estimated Time:** 2 hours
- **Risk:** LOW — same logic, different file
- **Feature Flag:** None
- **Verification:** Both routes respond identically before and after migration.

---

**TASK-014**
- **Title:** Add typed DTOs to CRM and Mail mappers
- **Description:** In `server/domains/crm/mapper.ts` and `server/domains/mail/mapper.ts`, replace pass-through raw Mongoose document returns with explicit typed DTO objects. No consumer should receive a raw Mongoose document. Close TECH-003.
- **Depends On:** TASK-009, TASK-011
- **Estimated Complexity:** Medium
- **Estimated Time:** 2 days
- **Risk:** LOW — internal API contract change; external API shape unchanged
- **Feature Flag:** None
- **Verification:** CRM and Mail controllers receive typed DTOs. No `toJSON` dependence in mapper output.

---

**TASK-015**
- **Title:** Split routes.ts Phase 1 — Auth, Users, Notifications
- **Description:** Extract auth routes (`/api/login`, `/api/register`, OAuth), user management routes (`/api/users`, `/api/profile`), and notification routes (`/api/notifications`) from `server/routes.ts` into separate domain route files. Maintain 100% API surface compatibility.
- **Depends On:** TASK-006
- **Estimated Complexity:** High
- **Estimated Time:** 1 week
- **Risk:** HIGH — large monolith; any missed import breaks endpoints
- **Feature Flag:** None
- **Verification:** All extracted routes respond identically. TypeScript compiles with no new errors. App starts cleanly.

---

**TASK-016**
- **Title:** Split routes.ts Phase 2 — Orders, Projects, Finance
- **Description:** Extract order routes, project routes (workspace, Kanban), quotation routes, invoice routes, wallet routes from `server/routes.ts` into domain route files.
- **Depends On:** TASK-015
- **Estimated Complexity:** High
- **Estimated Time:** 1 week
- **Risk:** HIGH
- **Feature Flag:** None
- **Verification:** All extracted routes respond identically. No regression in order/payment/project flows.

---

**TASK-017**
- **Title:** Split routes.ts Phase 3 — Admin, CRM, All Remaining
- **Description:** Extract all remaining routes from `server/routes.ts` (admin, CRM, email marketing, events, AI, sandbox, deployment cloud) into domain route files. `server/routes.ts` should be empty or a thin mounting shim.
- **Depends On:** TASK-016
- **Estimated Complexity:** High
- **Estimated Time:** 1 week
- **Risk:** HIGH
- **Feature Flag:** None
- **Verification:** routes.ts stability score improves from 28 to > 60. All 632+ endpoints respond correctly.

---

**TASK-018**
- **Title:** Add MongoDB compound indexes to all high-query collections
- **Description:** Add indexes per DATABASE.md DB-002: `orders` (userId+status, createdAt), `users` (email, role+status), `crm_leads` (assignedTo+status, pipeline), `notifications` (userId+read, createdAt), `projects` (clientId+status), `invoices` (orderId, userId+status), `support_tickets` (userId+status+createdAt).
- **Depends On:** Nothing
- **Estimated Complexity:** Low
- **Estimated Time:** 1 day
- **Risk:** LOW — `background: true` indexes are non-destructive
- **Feature Flag:** None
- **Verification:** Index creation confirmed in MongoDB Atlas. Query explain plans show index usage.

---

**TASK-019**
- **Title:** Fix wallet balance atomicity with MongoDB transactions
- **Description:** Wrap all wallet debit/credit operations in MongoDB session transactions. Ensure no concurrent requests can produce a negative balance. Add a pre-save validator that throws if balance would go below zero.
- **Depends On:** Nothing
- **Estimated Complexity:** High
- **Estimated Time:** 1 day
- **Risk:** MEDIUM — financial data; must be load-tested before production
- **Feature Flag:** None
- **Verification:** Concurrent payment simulation (10 simultaneous requests against same wallet) produces correct final balance with no negative state.

---

**TASK-020**
- **Title:** Standardise API response format
- **Description:** All API responses return `{ success: true, data: ... }` on success and `{ success: false, error: { code, message, field? } }` on failure. Implement a response helper and apply to all route files after Phase 1–3 split is complete.
- **Depends On:** TASK-017
- **Estimated Complexity:** High
- **Estimated Time:** 2–3 days
- **Risk:** MEDIUM — frontend must handle new format; update client API calls in parallel
- **Feature Flag:** None
- **Verification:** All endpoints return consistent shape. Frontend error handling uses `success` field.

---

### CLIENT JOURNEY PHASE (Tasks 021–035)

---

**TASK-021**
- **Title:** Implement draft-orders server-persisted API
- **Description:** Create MongoDB collection `draft_orders` with TTL index (7 days). Implement `POST /api/v2/draft-orders`, `GET /api/v2/draft-orders/:id`, `PATCH /api/v2/draft-orders/:id`, `POST /api/v2/draft-orders/:id/submit`. Replace sessionStorage wizard handoff.
- **Depends On:** TASK-018
- **Estimated Complexity:** Medium
- **Estimated Time:** 2 days
- **Risk:** LOW — new collection, new endpoints; nothing existing modified
- **Feature Flag:** `FEATURE_CUSTOMER_JOURNEY_V2`
- **Verification:** Wizard data persists across tab close. Wizard can be resumed on any device. Expired drafts deleted after 7 days.

---

**TASK-022**
- **Title:** Implement price estimation API
- **Description:** `POST /api/v2/estimate-price` — accepts tier + features + sector, returns estimated price range (SAR) and timeline range (weeks). Configurable price matrix stored in system settings (not hardcoded).
- **Depends On:** TASK-021
- **Estimated Complexity:** Medium
- **Estimated Time:** 1 day
- **Risk:** LOW — new additive endpoint
- **Feature Flag:** `FEATURE_CUSTOMER_JOURNEY_V2`
- **Verification:** Price matrix configurable in admin settings. Returns correct range for each tier/feature combination.

---

**TASK-023**
- **Title:** Wire DashboardV2 — Welcome and Progress sections
- **Description:** Connect `WelcomeExperience.tsx` and `ProgressTimeline.tsx` sections (Sprint 003 components) to real `GET /api/v2/journey/state` data. Replace all placeholder data.
- **Depends On:** TASK-021
- **Estimated Complexity:** Medium
- **Estimated Time:** 1 day
- **Risk:** LOW — behind feature flag
- **Feature Flag:** `FEATURE_DASHBOARD_V2`
- **Verification:** Progress timeline shows real project phase. Welcome shows client's actual name and project.

---

**TASK-024**
- **Title:** Wire DashboardV2 — ActiveProjects, Tasks, Files sections
- **Description:** Connect `ActiveProjects`, `Tasks`, `Files` sections to real API data (`/api/projects`, `/api/tasks`, `/api/files`). Filter to client-visible items only.
- **Depends On:** TASK-023
- **Estimated Complexity:** Medium
- **Estimated Time:** 2 days
- **Risk:** LOW
- **Feature Flag:** `FEATURE_DASHBOARD_V2`
- **Verification:** Sections show real data. Items not marked `clientVisible` do not appear.

---

**TASK-025**
- **Title:** Wire DashboardV2 — Quotations, Invoices, Meetings sections
- **Description:** Connect `Quotations`, `Invoices`, `Meetings` sections to real API data. Link to existing ClientQuotations, ClientInvoices, ClientQMeet pages.
- **Depends On:** TASK-023
- **Estimated Complexity:** Medium
- **Estimated Time:** 1 day
- **Risk:** LOW
- **Feature Flag:** `FEATURE_DASHBOARD_V2`
- **Verification:** Pending quotations, unpaid invoices, upcoming meetings all shown accurately.

---

**TASK-026**
- **Title:** Wire DashboardV2 — Notifications and Support sections
- **Description:** Connect `Notifications` section to notification bell data. Connect `Support` section to open ticket count and last ticket status. Link to support ticket creation in project context.
- **Depends On:** TASK-023
- **Estimated Complexity:** Low
- **Estimated Time:** 1 day
- **Risk:** LOW
- **Feature Flag:** `FEATURE_DASHBOARD_V2`
- **Verification:** Unread notification count correct. Open ticket count correct.

---

**TASK-027**
- **Title:** Implement Client Progress Center pages
- **Description:** Build `/project/:id` client-facing route with `ClientProgressCenter.tsx`, `ProjectStatusBar.tsx`, `UpdatesFeed.tsx`, `ClientTaskList.tsx`, `SharedFilesSection.tsx`, `ProjectChatWidget.tsx` (Sprint 004 component specs). Implement `GET /api/v2/projects/:id/client-view` and related endpoints.
- **Depends On:** TASK-024
- **Estimated Complexity:** High
- **Estimated Time:** 1 week
- **Risk:** MEDIUM — must not expose internal task/file data to clients
- **Feature Flag:** `FEATURE_CUSTOMER_JOURNEY_V2`
- **Verification:** Client sees only `clientVisible` tasks and files. No internal bug statuses visible. Status bar shows correct phase.

---

**TASK-028**
- **Title:** Implement Digital Agreement on quotation acceptance
- **Description:** `POST /api/v2/quotations/:id/accept` — stores `agreementSignedAt`, `agreementText` snapshot, `clientSignature`, `ipAddress` on quotation record. Build `DigitalAgreement.tsx` component. Additive fields on QuotationModel.
- **Depends On:** TASK-020
- **Estimated Complexity:** Medium
- **Estimated Time:** 2 days
- **Risk:** LOW — additive fields; existing accept flow unchanged
- **Feature Flag:** `FEATURE_CUSTOMER_JOURNEY_V2`
- **Verification:** Agreement record stored on acceptance. Stores IP and timestamp. Agreement text frozen at time of signing.

---

**TASK-029**
- **Title:** Implement Delivery Acceptance flow
- **Description:** `POST /api/v2/projects/:id/delivery-accept` — stores `deliveryAcceptedAt` on project record. Build `DeliveryExperience.tsx` and `DeliveryAcceptance.tsx` components. Add `clientVisible` flag to file model.
- **Depends On:** TASK-027
- **Estimated Complexity:** Medium
- **Estimated Time:** 2 days
- **Risk:** LOW
- **Feature Flag:** `FEATURE_CUSTOMER_JOURNEY_V2`
- **Verification:** Delivery accepted state persists. Client notification sent. Admin sees delivery acceptance in project view.

---

**TASK-030**
- **Title:** Implement guided onboarding tour on first login
- **Description:** Add `hasCompletedOnboarding: Boolean` to UserModel (additive, default false). On first login for client role, trigger ClientOnboarding.tsx. Mark complete on final step. Close G-CJ-01.
- **Depends On:** Nothing (independent of V2 journey)
- **Estimated Complexity:** Low
- **Estimated Time:** 1 day
- **Risk:** LOW
- **Feature Flag:** None (improvement to existing V1 flow)
- **Verification:** New client accounts see onboarding on first login. Second login skips it. Existing accounts unaffected.

---

**TASK-031**
- **Title:** Implement email verification on registration
- **Description:** Add `emailVerified: Boolean` and `emailVerificationToken: String` to UserModel. Send verification email on registration. Block login until email is verified (with grace period of 24h). Close G-CJ-02.
- **Depends On:** TASK-012 (email domain migration)
- **Estimated Complexity:** Low
- **Estimated Time:** 1 day
- **Risk:** MEDIUM — blocks login; must have clear resend flow
- **Feature Flag:** `FEATURE_EMAIL_VERIFICATION`
- **Verification:** Registration email sent. Login blocked until verified. Resend works. 24h grace period works.

---

**TASK-032**
- **Title:** Automated order status push notifications
- **Description:** Trigger `notify()` on every order status change (hook in order status update endpoint). Send push + in-app notification with order reference, new status, and next action. Close G-ORD-05 (Critical).
- **Depends On:** TASK-015 (routes split for order routes)
- **Estimated Complexity:** Low
- **Estimated Time:** 1 day
- **Risk:** LOW — uses existing notification infrastructure
- **Feature Flag:** None
- **Verification:** Client receives push notification within 5 seconds of status change. Notification links to correct order.

---

**TASK-033**
- **Title:** Automated CRM follow-up reminders
- **Description:** Add cron job that runs every 30 minutes, checks `CrmLeadModel.followUpDate` for due follow-ups, sends in-app + push notification to assigned sales rep. Close G-CRM-06 (Critical).
- **Depends On:** Nothing
- **Estimated Complexity:** Low
- **Estimated Time:** 1 day
- **Risk:** LOW
- **Feature Flag:** None
- **Verification:** Follow-up notification fires within 30 minutes of `followUpDate`. Notification links to lead record.

---

**TASK-034**
- **Title:** Auto-convert accepted quotation to invoice
- **Description:** In the quotation acceptance handler (`PATCH /api/quotations/:id/status`), when status is set to `accepted`, automatically trigger invoice creation using the quotation line items. Close G-QUO-04.
- **Depends On:** TASK-015
- **Estimated Complexity:** Low
- **Estimated Time:** 4 hours
- **Risk:** LOW — additive trigger; existing invoice creation logic reused
- **Feature Flag:** None
- **Verification:** Accepting a quotation automatically creates an invoice. Invoice line items match quotation. Client notified of new invoice.

---

**TASK-035**
- **Title:** Add estimated delivery date to order
- **Description:** Add `estimatedDelivery: Date` field to OrderModel (additive, nullable). Display in client portal order detail, dashboard, and notifications. Employees set it when starting the project. Close G-ORD-04.
- **Depends On:** Nothing
- **Estimated Complexity:** Low
- **Estimated Time:** 4 hours
- **Risk:** LOW
- **Feature Flag:** None
- **Verification:** Field visible in client dashboard and order detail. Employee can set/update it. Null state shows graceful "TBD" text.

---

### PAYMENTS + LEGAL PHASE (Tasks 036–050)

---

**TASK-036**
- **Title:** ZATCA Phase 2 e-invoice XML generation
- **Description:** Generate ZATCA-compliant XML invoices for all new invoices. Include: TaxTotal, LegalMonetaryTotal, InvoiceLine elements per ZATCA UBL schema. QR encode the invoice hash + seller TRN + timestamp. Store ZATCA XML on InvoiceModel.
- **Depends On:** TASK-016 (finance routes split)
- **Estimated Complexity:** High
- **Estimated Time:** 2 weeks
- **Risk:** HIGH — legal mandate; incorrect format = non-compliance
- **Feature Flag:** `FEATURE_ZATCA_EINVOICING`
- **Verification:** Generated XML passes ZATCA validator tool. QR code decodes to correct values. Applied to new invoices only (not retroactive).

---

**TASK-037**
- **Title:** ZATCA API integration (reporting phase)
- **Description:** Submit generated ZATCA XML invoices to ZATCA API (`/invoices/reporting/single` endpoint). Handle responses, store `zatcaSubmissionId` and `zatcaStatus` on invoice. Retry on failure.
- **Depends On:** TASK-036
- **Estimated Complexity:** High
- **Estimated Time:** 1 week
- **Risk:** HIGH — requires ZATCA API credentials + approved certificates
- **Feature Flag:** `FEATURE_ZATCA_EINVOICING`
- **Verification:** Invoices submitted to ZATCA successfully. Submission status tracked. Failed submissions retried.

---

**TASK-038**
- **Title:** Moyasar payment integration (Mada, STCPAY, SADAD, Visa/MC)
- **Description:** Integrate Moyasar SDK. Add `POST /api/payments/moyasar/create` and `POST /api/payments/moyasar/callback`. Support: Mada debit cards, STCPAY, SADAD, Visa/MC. Link to order checkout and wallet top-up flows. Close G-PAY-02.
- **Depends On:** TASK-016
- **Estimated Complexity:** High
- **Estimated Time:** 2–3 weeks
- **Risk:** HIGH — payment processing; requires Moyasar merchant account + test environment
- **Feature Flag:** `FEATURE_MOYASAR_PAYMENTS`
- **Verification:** End-to-end payment in Moyasar test environment. All 4 payment methods work. Webhook verifies payment and updates order.

---

**TASK-039**
- **Title:** Stripe integration
- **Description:** Integrate Stripe SDK. Add `POST /api/payments/stripe/create-intent` and webhook handler. Support: international Visa/MC, recurring subscriptions. Close G-PAY-03, G-PAY-04.
- **Depends On:** TASK-016
- **Estimated Complexity:** Medium
- **Estimated Time:** 1 week
- **Risk:** MEDIUM — requires Stripe merchant account
- **Feature Flag:** `FEATURE_STRIPE_PAYMENTS`
- **Verification:** Stripe test payment successful. Subscription billing scheduled. Webhook delivers payment confirmation.

---

**TASK-040**
- **Title:** Payment failure recovery / dunning emails
- **Description:** Add cron job that detects failed recurring payments. Send 3-step dunning sequence: Day 1 (failed notice + retry link), Day 3 (reminder), Day 7 (final warning + subscription suspension). Close G-PAY-06.
- **Depends On:** TASK-039, TASK-012
- **Estimated Complexity:** Medium
- **Estimated Time:** 2 days
- **Risk:** LOW
- **Feature Flag:** None
- **Verification:** Failed payment triggers Day 1 email within 1 hour. Day 3 and Day 7 emails fire correctly. Re-payment stops sequence.

---

**TASK-041**
- **Title:** Refund workflow
- **Description:** Add `RefundRequest` model. Build refund request UI for clients (`POST /api/orders/:id/refund-request`). Admin reviews and approves/rejects. On approval, trigger PayPal/Moyasar/Stripe refund API. Close G-PAY-05.
- **Depends On:** TASK-038, TASK-039
- **Estimated Complexity:** Medium
- **Estimated Time:** 2 days
- **Risk:** MEDIUM — touches payment gateway APIs
- **Feature Flag:** `FEATURE_REFUND_WORKFLOW`
- **Verification:** Client can request refund. Admin sees request in queue. Approved refund triggers gateway API. Wallet credited if applicable.

---

**TASK-042**
- **Title:** SLA tracking per order type
- **Description:** Add `slaDeadline: Date` and `slaStatus: String` to OrderModel. Configure SLA per service type in admin settings. Cron job fires alert when SLA is 24h from breach. Admin sees SLA status in Kanban. Close G-ORD-01, G-ADM-02.
- **Depends On:** TASK-016
- **Estimated Complexity:** Medium
- **Estimated Time:** 2 days
- **Risk:** LOW
- **Feature Flag:** None
- **Verification:** SLA deadline set on order creation. Alert fires 24h before deadline. Admin sees breach status in real time.

---

**TASK-043**
- **Title:** WhatsApp Business API integration
- **Description:** Integrate Meta WhatsApp Business Cloud API (or Twilio WhatsApp). Send approved templates for: order confirmation, payment received, delivery notification, review request. Close G-NOT-03 (Critical).
- **Depends On:** TASK-033 (existing WhatsApp pattern)
- **Estimated Complexity:** High
- **Estimated Time:** 2 weeks
- **Risk:** HIGH — requires Meta Business account approval (2–8 week timeline); build with wa.me fallback
- **Feature Flag:** `FEATURE_WHATSAPP_API`
- **Verification:** Template messages deliver to Saudi phone numbers. Opt-out stored. wa.me fallback works when flag is off.

---

**TASK-044**
- **Title:** Lead source attribution / UTM tracking
- **Description:** Capture UTM parameters from public consultation forms and registration URL. Store `utmSource`, `utmMedium`, `utmCampaign` on `CrmLeadModel` and `UserModel.acquisitionSource`. Close G-CRM-04.
- **Depends On:** Nothing
- **Estimated Complexity:** Medium
- **Estimated Time:** 1 day
- **Risk:** LOW
- **Feature Flag:** None
- **Verification:** Registration from UTM-tagged URL stores UTM params. Admin can filter leads by UTM source.

---

**TASK-045**
- **Title:** Automated lead scoring
- **Description:** Add `score: Number` field to `CrmLeadModel`. Implement configurable scoring rules in admin settings: source type (website = +10, referral = +20), interest level (High = +30), company size, activity frequency. Recompute on every activity. Close G-CRM-01.
- **Depends On:** TASK-044
- **Estimated Complexity:** Medium
- **Estimated Time:** 2 days
- **Risk:** LOW
- **Feature Flag:** `FEATURE_LEAD_SCORING`
- **Verification:** Score updates on lead activity. Admin can configure scoring rules. Leads sortable by score.

---

**TASK-046**
- **Title:** Customer Timeline (CRM V2 foundation)
- **Description:** Create `customer_timeline_events` collection. Build aggregation that pulls orders, quotations, invoices, meetings, support tickets, CRM activities, and reviews into a chronological timeline per client. Implement `GET /api/crm/v2/timeline/:clientId`.
- **Depends On:** TASK-017
- **Estimated Complexity:** High
- **Estimated Time:** 1 week
- **Risk:** LOW — read-only aggregation; no existing data modified
- **Feature Flag:** `FEATURE_CRM_V2`
- **Verification:** Timeline shows all interaction types in correct chronological order. 10 clients tested.

---

**TASK-047**
- **Title:** Pipeline revenue forecast
- **Description:** Add `probability: Number` (0–100) and `dealValue: Number` to `CrmLeadModel`. Build `GET /api/crm/stats/revenue-forecast` that computes weighted pipeline value (probability × dealValue by stage). Display in sales dashboard. Close G-CRM-07.
- **Depends On:** TASK-045
- **Estimated Complexity:** Medium
- **Estimated Time:** 2 days
- **Risk:** LOW
- **Feature Flag:** `FEATURE_CRM_V2`
- **Verification:** Forecast computes correctly. Stage probability defaults configurable. Visual chart in dashboard.

---

**TASK-048**
- **Title:** Duplicate lead detection
- **Description:** On CRM lead creation, check for existing leads with matching email or phone number (fuzzy). If match found, show duplicate warning with link to existing lead. Close G-CRM-03.
- **Depends On:** Nothing
- **Estimated Complexity:** Low
- **Estimated Time:** 1 day
- **Risk:** LOW
- **Feature Flag:** None
- **Verification:** Creating lead with existing email shows warning. Creating with unique email proceeds normally.

---

**TASK-049**
- **Title:** Quotation expiry notification
- **Description:** Daily cron checks `QuotationModel.validUntil` for quotations expiring in 48h. Sends client email notification + in-app alert. Close G-QUO-03.
- **Depends On:** TASK-012
- **Estimated Complexity:** Low
- **Estimated Time:** 4 hours
- **Risk:** LOW
- **Feature Flag:** None
- **Verification:** Expiry email sent 48h before `validUntil`. In-app notification created.

---

**TASK-050**
- **Title:** Real-time operations dashboard
- **Description:** Build admin live order monitor at `/admin/operations/live`. WebSocket-fed board showing orders currently in each Kanban stage. Highlights orders at risk of SLA breach. Close G-ADM-01.
- **Depends On:** TASK-042
- **Estimated Complexity:** Medium
- **Estimated Time:** 2 days
- **Risk:** LOW
- **Feature Flag:** `FEATURE_LIVE_OPS_DASHBOARD`
- **Verification:** Board updates in real time when order status changes. SLA-at-risk orders highlighted correctly.

---

### EMPLOYEE & INTERNAL TOOLS PHASE (Tasks 051–065)

---

**TASK-051**
- **Title:** HR QR Attendance system
- **Description:** Generate daily HMAC-signed QR code (60-second validity, auto-regenerate every 30s). Employee scans QR on office entrance tablet/kiosk → clock-in logged to `attendance_logs_qr`. Implement `GET /api/hr/attendance/qr-session` and `POST /api/hr/attendance/qr-checkin`.
- **Depends On:** TASK-016
- **Estimated Complexity:** High
- **Estimated Time:** 1 week
- **Risk:** MEDIUM — HMAC signing must be verified server-side; time window must account for clock drift
- **Feature Flag:** `FEATURE_QR_ATTENDANCE`
- **Verification:** Valid QR scan logs attendance. Expired QR (> 60s) rejected. Replay attack (same code twice) rejected.

---

**TASK-052**
- **Title:** Employee Digital Identity Card with QR
- **Description:** Generate HMAC-signed QR code per employee linking to their profile. Build `/employee/my-id` page showing digital ID card. QR code points to `GET /api/hr/employee/:id/identity/verify` which confirms identity.
- **Depends On:** TASK-051
- **Estimated Complexity:** Medium
- **Estimated Time:** 2 days
- **Risk:** LOW
- **Feature Flag:** `FEATURE_EMPLOYEE_IDENTITY_QR`
- **Verification:** QR scan reveals employee name, role, photo. Tampered QR rejected by verify endpoint.

---

**TASK-053**
- **Title:** Apple Wallet PKPass for employee cards
- **Description:** Implement PKPass generation using Apple Wallet pass design (employee name, photo, role, ID number, QR code). Sign with Apple Wallet certificate. Serve from `GET /api/hr/employee/:id/wallet-pass`. Requires Apple Developer certificate (separate from Distribution cert).
- **Depends On:** TASK-052
- **Estimated Complexity:** High
- **Estimated Time:** 1 week
- **Risk:** HIGH — requires valid Apple Wallet certificate; PKPass signing is complex
- **Feature Flag:** `FEATURE_EMPLOYEE_WALLET_CARDS`
- **Verification:** PKPass file downloads correctly. Adds to Apple Wallet on iOS. QR code scannable from Wallet.

---

**TASK-054**
- **Title:** Internal Chat for employees
- **Description:** Extend `server/ws.ts` with employee-to-employee chat rooms. Create `employee_chat_rooms` and `employee_chat_messages` collections. Build `/employee/chat` page with conversation list and message thread. Real-time via WebSocket.
- **Depends On:** TASK-015
- **Estimated Complexity:** High
- **Estimated Time:** 1 week
- **Risk:** MEDIUM — real-time; must not interfere with existing client support chat
- **Feature Flag:** `FEATURE_EMPLOYEE_CHAT`
- **Verification:** Employee sends message → recipient receives in < 1 second. Message history persists. Online/offline status shown.

---

**TASK-055**
- **Title:** Employee Dashboard V2
- **Description:** Build `/employee/dashboard-v2` with personal KPIs (tasks completed this week, meetings today, open tickets, current project count), today's task list, announcements feed, and upcoming meetings. Replace EmployeeHub.tsx as default landing page (behind feature flag).
- **Depends On:** TASK-026 (announcement model from Operations)
- **Estimated Complexity:** High
- **Estimated Time:** 1 week
- **Risk:** LOW
- **Feature Flag:** `FEATURE_EMPLOYEE_DASHBOARD_V2`
- **Verification:** All sections show real data. Dashboard loads in < 2 seconds. All 11 employee roles see correct data for their role.

---

**TASK-056**
- **Title:** Knowledge Base system
- **Description:** Create `knowledge_articles` and `knowledge_categories` collections. Build admin article editor at `/admin/knowledge`. Build employee reader at `/employee/knowledge`. Add full-text search with Arabic support. Close G-EMP-06, G-INT-02.
- **Depends On:** Nothing
- **Estimated Complexity:** Medium
- **Estimated Time:** 1 week
- **Risk:** LOW
- **Feature Flag:** `FEATURE_KNOWLEDGE_BASE`
- **Verification:** Article created in admin appears in employee view. Arabic full-text search returns relevant results.

---

**TASK-057**
- **Title:** SOP Management system
- **Description:** Create `sops` and `sop_acknowledgements` collections. Build SOP builder in admin (step-by-step editor). Employee reads and acknowledges SOPs. New employee auto-assigned SOPs by role. New employees must acknowledge before fully onboarded.
- **Depends On:** TASK-056
- **Estimated Complexity:** Medium
- **Estimated Time:** 1 week
- **Risk:** LOW
- **Feature Flag:** `FEATURE_SOP_MANAGEMENT`
- **Verification:** SOP created and published. Employee sees pending acknowledgement. Acknowledgement recorded with timestamp.

---

**TASK-058**
- **Title:** Internal Announcements system
- **Description:** Create `internal_announcements` collection. Admin/manager broadcasts announcement to all employees or specific roles. Announcement appears in Employee Dashboard V2 feed and sends in-app notification. Close G-INT-01.
- **Depends On:** TASK-054
- **Estimated Complexity:** Low
- **Estimated Time:** 1 day
- **Risk:** LOW
- **Feature Flag:** `FEATURE_INTERNAL_ANNOUNCEMENTS`
- **Verification:** Announcement posted by manager appears for targeted roles within 5 seconds. Read status tracked.

---

**TASK-059**
- **Title:** Company Calendar
- **Description:** Create `company_calendar_events` collection. Build shared calendar view at `/admin/operations/calendar` and `/employee/calendar`. Events types: team, company, project-linked, personal. Import QMeet meetings automatically.
- **Depends On:** Nothing
- **Estimated Complexity:** Medium
- **Estimated Time:** 2 days
- **Risk:** LOW
- **Feature Flag:** `FEATURE_COMPANY_CALENDAR`
- **Verification:** New event appears in all attendees' calendars. QMeet meetings auto-imported. Employee sees personal + team + company events.

---

**TASK-060**
- **Title:** Time Tracking per task/project
- **Description:** Add start/stop timer per task in ProjectWorkspace (employee view). Create `project_time_logs` collection. Show daily/weekly time summary per employee and per project. Close G-EMP-01.
- **Depends On:** TASK-016
- **Estimated Complexity:** Medium
- **Estimated Time:** 3 days
- **Risk:** LOW
- **Feature Flag:** `FEATURE_TIME_TRACKING`
- **Verification:** Timer starts and stops correctly. Time logged to correct project and task. Weekly summary accurate.

---

**TASK-061**
- **Title:** Resource capacity view
- **Description:** Build `/admin/projects/capacity` — calendar grid showing each employee's assigned project load (hours/week) vs. available capacity. Highlights over-allocated employees. Close G-EMP-02.
- **Depends On:** TASK-060
- **Estimated Complexity:** Medium
- **Estimated Time:** 2 days
- **Risk:** LOW
- **Feature Flag:** `FEATURE_RESOURCE_CAPACITY`
- **Verification:** Over-allocated employees highlighted. Manager can see team availability at a glance.

---

**TASK-062**
- **Title:** Milestone tracking with client approval gates
- **Description:** Create `project_milestones` collection with `requiresClientApproval` flag. Employee marks milestone complete → client receives notification and approval request. Client approval/rejection stored. Close G-PM-01.
- **Depends On:** TASK-027
- **Estimated Complexity:** Medium
- **Estimated Time:** 2 days
- **Risk:** LOW
- **Feature Flag:** `FEATURE_MILESTONE_TRACKING`
- **Verification:** Milestone completion triggers client approval request. Approval/rejection stored with timestamp. Employee notified of client decision.

---

**TASK-063**
- **Title:** Meeting Center — structured meeting records
- **Description:** Create `meeting_records` collection linked to `QMeetModel`. Build meeting notes editor before/during/after QMeet. Action items linkable to project tasks. Build `/admin/operations/meetings` view.
- **Depends On:** Nothing
- **Estimated Complexity:** Medium
- **Estimated Time:** 2 days
- **Risk:** LOW
- **Feature Flag:** `FEATURE_MEETING_CENTER`
- **Verification:** Meeting record created before QMeet. Notes editable during and after meeting. Action items appear in project task list.

---

**TASK-064**
- **Title:** Document Center — version-controlled project documents
- **Description:** Create `document_library` collection with version tracking. Build `/admin/operations/documents` and `/project/:id/documents` views. File metadata tracks who uploaded, when, and which version.
- **Depends On:** TASK-007 (MIME validation)
- **Estimated Complexity:** Medium
- **Estimated Time:** 2 days
- **Risk:** LOW
- **Feature Flag:** `FEATURE_DOCUMENT_CENTER`
- **Verification:** Document uploaded with metadata. New version increments version number. Previous versions accessible.

---

**TASK-065**
- **Title:** Leave management self-service
- **Description:** Create `leave_requests` collection. Employee submits leave request via `/employee/leaves`. Manager receives notification and approves/rejects. Balance tracking uses existing `UserModel.vacationBalance`. Close G-INT-03.
- **Depends On:** TASK-058
- **Estimated Complexity:** Medium
- **Estimated Time:** 2 days
- **Risk:** LOW
- **Feature Flag:** `FEATURE_LEAVE_MANAGEMENT`
- **Verification:** Leave request appears in manager's approval queue. Approved request deducts from vacation balance. Employee receives decision notification.

---

### ANALYTICS + INTELLIGENCE PHASE (Tasks 066–080)

---

**TASK-066**
- **Title:** Company KPI Dashboard
- **Description:** Build `/admin/analytics/kpis` showing: MRR, ARR, CAC (avg), LTV (avg), NPS (avg), churn rate (monthly), active projects, delivery rate on time, SLA compliance %. Live data from existing collections. Close G-ADM-05.
- **Depends On:** TASK-020
- **Estimated Complexity:** Medium
- **Estimated Time:** 3 days
- **Risk:** MEDIUM — aggregation performance on large collections; requires indexes (TASK-018)
- **Feature Flag:** `FEATURE_ANALYTICS_V2`
- **Verification:** All KPIs compute correctly against test data. Dashboard loads in < 3 seconds.

---

**TASK-067**
- **Title:** Executive Dashboard
- **Description:** Build `/admin/executive` — single-screen view of all 23 department KPIs. Shows: revenue run rate, open orders, active projects, team headcount, open support tickets, NPS, pipeline value, and company health score. Data aggregated from all department APIs.
- **Depends On:** TASK-066
- **Estimated Complexity:** High
- **Estimated Time:** 1 week
- **Risk:** MEDIUM — aggregation across many collections
- **Feature Flag:** `FEATURE_EXECUTIVE_DASHBOARD`
- **Verification:** All KPIs load. Page loads in < 3 seconds. Only admin role can access.

---

**TASK-068**
- **Title:** Conversion funnel analytics
- **Description:** Create `analytics_events` collection. Capture events: `page_view`, `consultation_booked`, `registration_completed`, `first_order_placed`, `first_payment_made`, `project_completed`, `review_submitted`. Build funnel visualisation at `/admin/analytics/funnel`. Close G-ANL-02, G-ADM-07.
- **Depends On:** TASK-020
- **Estimated Complexity:** Medium
- **Estimated Time:** 3 days
- **Risk:** LOW — additive event collection
- **Feature Flag:** `FEATURE_ANALYTICS_V2`
- **Verification:** Funnel shows correct drop-off at each stage. Events fire correctly on user actions.

---

**TASK-069**
- **Title:** Client health score
- **Description:** Compute composite health score per client: login frequency (30%), payment history (30%), open ticket volume (20%), NPS (20%). Store in `client_health_scores`. Surface in CRM view and admin customer list. Close G-ADM-06.
- **Depends On:** TASK-046
- **Estimated Complexity:** Medium
- **Estimated Time:** 2 days
- **Risk:** LOW
- **Feature Flag:** `FEATURE_CLIENT_HEALTH_SCORE`
- **Verification:** Score computed for all active clients. At-risk clients (score < 40) highlighted in CRM.

---

**TASK-070**
- **Title:** Behavioral / product analytics event tracking
- **Description:** Add lightweight client-side event tracking (page view, button click, feature used). Send to `POST /api/analytics/event`. No third-party service — stored in `analytics_events` collection. Close G-ANL-01.
- **Depends On:** TASK-068
- **Estimated Complexity:** Medium
- **Estimated Time:** 2 days
- **Risk:** LOW — additive; does not modify existing components significantly
- **Feature Flag:** `FEATURE_PRODUCT_ANALYTICS`
- **Verification:** Events captured in collection. Page view events fire on navigation. No performance impact.

---

**TASK-071**
- **Title:** Dynamic sitemap from MongoDB
- **Description:** Replace static `client/public/sitemap.xml` (14 URLs) with a server-generated `GET /sitemap.xml` route that pulls: news articles, system templates, job listings, partner profiles, case studies. Close G-SEO-01.
- **Depends On:** Nothing
- **Estimated Complexity:** Low
- **Estimated Time:** 1 day
- **Risk:** LOW
- **Feature Flag:** None
- **Verification:** Sitemap includes all news articles and job posts. Updates automatically when content is published. Google Search Console validates sitemap.

---

**TASK-072**
- **Title:** JSON-LD structured data for public pages
- **Description:** Add `Organization` schema to homepage, `Service` schema to service pages, `FAQPage` schema to FAQ, `JobPosting` schema to job listings, `Article` schema to news/blog posts. Close G-SEO-03, G-SEO-04.
- **Depends On:** Nothing
- **Estimated Complexity:** Medium
- **Estimated Time:** 2 days
- **Risk:** LOW — additive `<script type="application/ld+json">` tags
- **Feature Flag:** None
- **Verification:** Google Rich Results Test validates schema on all pages. No JavaScript errors.

---

**TASK-073**
- **Title:** SSR for public pages
- **Description:** Implement server-side rendering for: `/`, `/about`, `/prices`, `/systems`, `/news`, `/news/:id`, `/jobs`, `/partners`. Close SEO-001 (critical SEO issue).
- **Depends On:** TASK-017
- **Estimated Complexity:** High
- **Estimated Time:** 1 week
- **Risk:** HIGH — large change to rendering pipeline; must not break client-side navigation
- **Feature Flag:** `FEATURE_SSR_PUBLIC_PAGES`
- **Verification:** Googlebot renders pages without JavaScript. LCP < 2.5s on homepage. Lighthouse SEO > 95.

---

**TASK-074**
- **Title:** Proposal Builder
- **Description:** Build visual proposal creation tool at `/admin/sales/proposal-builder`. Admins create section templates (intro, features, timeline, pricing). From a quotation, auto-generate a branded proposal PDF. Store `ProposalTemplate` and `Proposal` models.
- **Depends On:** TASK-016
- **Estimated Complexity:** High
- **Estimated Time:** 1 week
- **Risk:** MEDIUM — PDF generation must be tested across Arabic/English content
- **Feature Flag:** `FEATURE_PROPOSAL_BUILDER`
- **Verification:** Proposal generated from template. PDF renders correctly in Arabic RTL. Client receives proposal via email.

---

**TASK-075**
- **Title:** Contract Builder
- **Description:** Build contract template engine at `/admin/sales/contract-builder`. Templates with variable substitution (client name, project scope, payment terms). E-signature flow (typed name + timestamp + IP stored). Store `ContractTemplate` and `Contract` models.
- **Depends On:** TASK-074, TASK-028
- **Estimated Complexity:** High
- **Estimated Time:** 1 week
- **Risk:** MEDIUM — legal weight; requires legal review of contract templates
- **Feature Flag:** `FEATURE_CONTRACT_BUILDER`
- **Verification:** Contract generated from template with correct variable substitution. E-signature stored with audit trail. PDF download works.

---

### ADVANCED FEATURES PHASE (Tasks 076–100)

---

**TASK-076**
- **Title:** Events Platform — physical event management
- **Description:** Create `events`, `event_tickets`, `event_registrations` collections. Build `/admin/events` CRUD for physical events (venue, capacity, schedule). Build public event page `/events/:id`. Send registration confirmation email.
- **Depends On:** TASK-012
- **Estimated Complexity:** High
- **Estimated Time:** 1 week
- **Risk:** LOW
- **Feature Flag:** `FEATURE_EVENTS_PLATFORM`
- **Verification:** Event created in admin. Public page accessible. Registration stores correctly. Confirmation email sent.

---

**TASK-077**
- **Title:** QR event check-in and secure tickets
- **Description:** Generate single-use SHA-256 ticket QR codes per registered attendee. Build check-in station interface at `/admin/events/:id/check-in` (tablet/kiosk optimised). Scan QR → verify → mark used → reject replay. Close event attendance tracking.
- **Depends On:** TASK-076
- **Estimated Complexity:** High
- **Estimated Time:** 1 week
- **Risk:** HIGH — replay attacks must be prevented
- **Feature Flag:** `FEATURE_EVENT_CHECKIN_QR`
- **Verification:** Valid ticket scanned → admitted. Second scan of same ticket → rejected. Fake QR → rejected. Check-in count accurate.

---

**TASK-078**
- **Title:** Media Library
- **Description:** Create `media_library` collection. Build organised file browser at `/admin/media` with categories, tags, file type filtering. Track which pages/proposals use each asset. Usage check before allowing deletion.
- **Depends On:** TASK-007
- **Estimated Complexity:** Medium
- **Estimated Time:** 3 days
- **Risk:** LOW
- **Feature Flag:** `FEATURE_MEDIA_LIBRARY`
- **Verification:** All existing uploads importable to library. Category and tag filtering works. Delete blocked when file is in use.

---

**TASK-079**
- **Title:** Brand Center UI
- **Description:** Build `/admin/brand` with: logo library (all variants), color palette (with hex/RGB + accessibility score), typography system (font stack, sizes, usage rules), asset download portal. Content editable by admin/designer.
- **Depends On:** TASK-078
- **Estimated Complexity:** Medium
- **Estimated Time:** 3 days
- **Risk:** LOW
- **Feature Flag:** `FEATURE_BRAND_CENTER`
- **Verification:** Logo library shows all variants. Colors show accessibility contrast scores. All assets downloadable.

---

**TASK-080**
- **Title:** RBAC V2 — declarative permission engine
- **Description:** Implement `rbac_permissions` collection (role, resource, action, scope, conditions). Build permission check middleware that reads from collection. Admin RBAC editor at `/admin/system/rbac`. Migrate hardcoded permission checks to declarative rules. Close RBAC_DESIGN.md design.
- **Depends On:** TASK-017 (all routes must be in domain files first)
- **Estimated Complexity:** Very High
- **Estimated Time:** 2 weeks
- **Risk:** CRITICAL — auth bypass if implemented incorrectly; must be staged rollout per domain
- **Feature Flag:** `FEATURE_RBAC_V2`
- **Verification:** All 11 roles verified against their expected permissions. No role can access another's resources. Hardcoded checks removed and declarative rules equivalent.

---

**TASK-081**
- **Title:** Audit Log V2 — structured audit trail
- **Description:** Create `audit_log_v2` collection. Middleware logs every state-changing API call: actor, role, resource, resourceId, action, scope, result, timestamp, IP. Build admin view at `/admin/system/audit-log-v2` with filtering.
- **Depends On:** TASK-080
- **Estimated Complexity:** Medium
- **Estimated Time:** 3 days
- **Risk:** LOW — additive logging
- **Feature Flag:** `FEATURE_AUDIT_LOG_V2`
- **Verification:** Every POST/PATCH/DELETE request creates an audit log entry. Financial audit entries immutable. Admin can filter by actor, resource, date range.

---

**TASK-082**
- **Title:** Vitest test harness + domain unit tests
- **Description:** Install Vitest. Configure `vitest.config.ts`. Add test for every exported function in: `server/domains/crm/domain.ts`, `server/domains/email/domain.ts`, `server/domains/mail/domain.ts`. Target: > 70% coverage on domain layer. Close TECH-006, TECH-011.
- **Depends On:** TASK-017 (stable domain structure)
- **Estimated Complexity:** High
- **Estimated Time:** 1 week
- **Risk:** LOW
- **Feature Flag:** None
- **Verification:** `npm test` passes with zero failures. Coverage report shows > 70% on domain files. CI fails on test failure.

---

**TASK-083**
- **Title:** Performance review system
- **Description:** Create `performance_reviews` collection. HR creates quarterly review forms per employee. Supports self-assessment + manager assessment. Goals for next period. Build `/admin/hr/performance` and `/employee/my-reviews`.
- **Depends On:** TASK-055
- **Estimated Complexity:** Medium
- **Estimated Time:** 3 days
- **Risk:** LOW
- **Feature Flag:** `FEATURE_PERFORMANCE_REVIEWS`
- **Verification:** Review created and sent to employee. Employee completes self-assessment. Manager completes assessment. Both stored.

---

**TASK-084**
- **Title:** WhatsApp Broadcast Manager
- **Description:** Build `/admin/whatsapp/broadcasts`. Admin selects an approved template and a client segment (from Segment Manager), schedules a broadcast. Each client receives a personalised wa.me link or WhatsApp API message. Message logged to Customer Timeline.
- **Depends On:** TASK-046, TASK-043
- **Estimated Complexity:** Medium
- **Estimated Time:** 3 days
- **Risk:** MEDIUM — rate limits on WhatsApp API; opt-out compliance required
- **Feature Flag:** `FEATURE_WHATSAPP_BROADCASTS`
- **Verification:** Broadcast sends to all segment members. Each message personalised with {name}. Opt-outs not messaged. All messages logged.

---

**TASK-085**
- **Title:** Investor Presentation Center
- **Description:** Build `/admin/investors/presentations`. Admins create presentation decks with live financial KPI embeds (revenue, growth %, active clients). Investor-facing view at `/investor/presentations`. Access controlled per investor.
- **Depends On:** TASK-066
- **Estimated Complexity:** High
- **Estimated Time:** 1 week
- **Risk:** LOW
- **Feature Flag:** `FEATURE_INVESTOR_CENTER`
- **Verification:** Presentation created with live KPI data. Investor can view only presentations shared with them. Financial data current as of page load.

---

**TASK-086**
- **Title:** Investor Data Room
- **Description:** Build `/admin/investors/data-room` for document upload (financials, term sheets, board minutes). Build `/investor/data-room` client view with access control per investor per document. All downloads logged.
- **Depends On:** TASK-081
- **Estimated Complexity:** Medium
- **Estimated Time:** 3 days
- **Risk:** MEDIUM — sensitive documents require strict access control
- **Feature Flag:** `FEATURE_INVESTOR_CENTER`
- **Verification:** Documents accessible only to authorised investors. Download events logged in audit trail.

---

**TASK-087**
- **Title:** AI Proposal Generation
- **Description:** Add `/api/ai/generate-proposal` endpoint. Accepts order data (sector, features, budget, timeline). Returns structured proposal text using GPT-4o with the Proposal Builder template format. Integrates into Proposal Builder as "AI Draft" button.
- **Depends On:** TASK-074
- **Estimated Complexity:** Medium
- **Estimated Time:** 2 days
- **Risk:** LOW — uses existing AI infrastructure
- **Feature Flag:** `FEATURE_AI_PROPOSAL_GEN`
- **Verification:** Generated proposal matches sector and feature context. Arabic output is correct. Editor allows post-generation editing.

---

**TASK-088**
- **Title:** AI Meeting Summariser
- **Description:** After QMeet session ends, trigger `/api/ai/summarise-meeting` which processes session notes and participant comments to generate an Arabic summary with action items. Store on `QMeetModel.aiSummary`. Display in Meeting Center.
- **Depends On:** TASK-063
- **Estimated Complexity:** Medium
- **Estimated Time:** 2 days
- **Risk:** LOW
- **Feature Flag:** `FEATURE_AI_MEETING_SUMMARY`
- **Verification:** Summary generated within 5 minutes of meeting end. Action items extracted correctly. Summary reviewable and editable.

---

**TASK-089**
- **Title:** Company Assets registry
- **Description:** Create `company_assets` and `asset_maintenance_logs` collections. Build `/admin/assets` CRUD. Employee can see `/employee/my-assets` (assigned items). Each physical asset has a QR code sticker linking to its record.
- **Depends On:** TASK-052
- **Estimated Complexity:** Medium
- **Estimated Time:** 3 days
- **Risk:** LOW
- **Feature Flag:** `FEATURE_ASSET_TRACKING`
- **Verification:** Asset created, assigned, and tracked. Maintenance log records service dates. Employee views only assigned assets.

---

**TASK-090**
- **Title:** GDPR data export and right-to-erasure
- **Description:** Build `POST /api/admin/users/:id/data-export` that compiles all user data (profile, orders, invoices, tickets, chat history) as a downloadable ZIP. Build erasure flow with admin approval before permanent anonymisation. Close G-ENT-05.
- **Depends On:** TASK-081
- **Estimated Complexity:** Medium
- **Estimated Time:** 3 days
- **Risk:** MEDIUM — erasure is irreversible; requires admin approval gate
- **Feature Flag:** None
- **Verification:** Export ZIP contains all user data. Erasure anonymises all PII. Audit log records erasure event.

---

**TASK-091**
- **Title:** Expense tracking and approval workflow
- **Description:** Create `company_expenses` collection. Build employee expense submission UI (`/employee/expenses`). Manager approval flow. Links to payroll for reimbursement. Close G-EMP-08.
- **Depends On:** TASK-065
- **Estimated Complexity:** Medium
- **Estimated Time:** 2 days
- **Risk:** LOW
- **Feature Flag:** `FEATURE_EXPENSE_TRACKING`
- **Verification:** Expense submitted with receipt. Manager approves/rejects. Approved expenses visible in payroll summary.

---

**TASK-092**
- **Title:** Mandatory 2FA for admin role
- **Description:** On login for `admin` role, if `totpEnabled` is false, force TOTP enrollment before granting access. If TOTP is enabled, require TOTP code on every login. TOTP infrastructure already exists in `server/auth.ts`. Close G-ENT-06.
- **Depends On:** Nothing
- **Estimated Complexity:** Low
- **Estimated Time:** 4 hours
- **Risk:** LOW — TOTP already implemented; just enforcing it for admin
- **Feature Flag:** None (security requirement, not a feature)
- **Verification:** Admin without TOTP is redirected to enrollment. Admin with TOTP must enter code. Non-admin roles unaffected.

---

**TASK-093**
- **Title:** SEO Dashboard
- **Description:** Build `/admin/seo` with: keyword tracking (target keyword, current position, search volume), Lighthouse scores per public page, Core Web Vitals baseline. Manual keyword entry; Lighthouse scores via periodic cron + Lighthouse CI.
- **Depends On:** TASK-071, TASK-072
- **Estimated Complexity:** Medium
- **Estimated Time:** 3 days
- **Risk:** LOW
- **Feature Flag:** `FEATURE_SEO_DASHBOARD`
- **Verification:** Keywords tracked and sortable. Lighthouse scores showing for all public pages. Historical trend visible.

---

**TASK-094**
- **Title:** iOS App Store compliance and resubmission
- **Description:** Revoke compromised Apple Distribution cert (TASK immediately). Generate new cert. Fix iOS WebRTC for QMeet. Audit IAP compliance per APPLE_REVIEW.md (APPLE-004, APPLE-005). Update Codemagic build. Resubmit to App Store.
- **Depends On:** TASK-001, TASK-053 (new Apple cert for Wallet)
- **Estimated Complexity:** High
- **Estimated Time:** 2 weeks
- **Risk:** HIGH — App Store review is external; rejection can extend timeline
- **Feature Flag:** None
- **Verification:** App approved by Apple. QMeet works on iOS. IAP flows comply with Apple guidelines.

---

**TASK-095**
- **Title:** Native push notifications (Capacitor)
- **Description:** Wire Capacitor PushNotifications plugin to the existing VAPID push system. On mobile, send notifications through APNs (iOS) and FCM (Android) instead of web push. Test deep-linking to correct in-app page from notification tap.
- **Depends On:** TASK-094
- **Estimated Complexity:** Medium
- **Estimated Time:** 3 days
- **Risk:** MEDIUM — APNs requires correct entitlements and provisioning
- **Feature Flag:** None
- **Verification:** Push notification received on iOS and Android. Tap opens correct page in app.

---

**TASK-096**
- **Title:** Milestone-based payment model
- **Description:** Add `milestoneId: ObjectId` (nullable) to `InvoiceModel`. Build milestone payment schedule UI — when a milestone is marked complete (TASK-062), optionally trigger invoice generation for that milestone. Close Sprint 004 payment design.
- **Depends On:** TASK-062, TASK-036
- **Estimated Complexity:** Medium
- **Estimated Time:** 2 days
- **Risk:** LOW — additive field; existing flat invoices continue to work
- **Feature Flag:** `FEATURE_MILESTONE_PAYMENTS`
- **Verification:** Invoice generated for milestone. Invoice references milestone name. Client payment clears milestone.

---

**TASK-097**
- **Title:** Notification preferences
- **Description:** Add `notificationPreferences: Object` to UserModel. Build preferences UI in profile settings. Before firing each notification type, check user's preference. Close G-NOT-01.
- **Depends On:** Nothing
- **Estimated Complexity:** Low
- **Estimated Time:** 1 day
- **Risk:** LOW
- **Feature Flag:** None
- **Verification:** User disables order notifications → no notification on order status change. Re-enable → notifications resume.

---

**TASK-098**
- **Title:** OKR tracking in Executive Management
- **Description:** Create `executive_okrs` collection (objective, key results[], owners[], progress, period). Build `/admin/executive/okr` with objective tree view. Progress updates visible from all connected department KPIs.
- **Depends On:** TASK-067
- **Estimated Complexity:** Medium
- **Estimated Time:** 3 days
- **Risk:** LOW
- **Feature Flag:** `FEATURE_EXECUTIVE_DASHBOARD`
- **Verification:** OKR tree shows objective → key results hierarchy. Progress updates correctly from linked KPI data.

---

**TASK-099**
- **Title:** Automated order status report to clients
- **Description:** Weekly cron (Sunday 8AM) sends each client with an active project a summary email: project phase, this week's progress, next week's planned work, upcoming milestones. Uses existing `WeeklyReportEmail` in email domain. Close G-EMP-05.
- **Depends On:** TASK-012, TASK-062
- **Estimated Complexity:** Low
- **Estimated Time:** 1 day
- **Risk:** LOW
- **Feature Flag:** None
- **Verification:** Weekly email sent to clients with active projects. Correct project data in email. Opt-out preference respected.

---

**TASK-100**
- **Title:** QiroxOS V1 Integration Test + Go-Live
- **Description:** End-to-end integration test suite covering all critical user journeys: client registration → order → payment → project → delivery → review. Employee order creation → quotation → project management. Admin finance → KPI dashboard. All 20 Go-Live checklist items verified. Staging → production promotion.
- **Depends On:** TASK-001 through TASK-099 (all complete)
- **Estimated Complexity:** Very High
- **Estimated Time:** 1 week
- **Risk:** HIGH — comprehensive integration test; any blocking issue requires resolution before go-live
- **Feature Flag:** None
- **Verification:** All 20 Go-Live checklist items checked. Zero CRITICAL or HIGH security issues. Lighthouse > 80. Response times < 300ms p95. QiroxOS V1 live.

---

## Document Footer

**Total planned implementation tasks:** 100  
**Estimated total remaining effort:** 29 weeks from Sprint 007 start  
**Definition of complete:** Section 20 above  
**Next action:** Begin Sprint 007 (Foundation Hardening — TASK-001 through TASK-020)

*This document supersedes EXECUTION_PLAN.md and all prior sprint execution plans. Update this document at the start of each sprint to reflect completed tasks.*
