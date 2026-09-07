# ROADMAP.md — QIROX Development Roadmap

> **Mode:** Audit only. Document only. No new features.
> **Date:** 2026-07-08
> **Source:** `ROADMAP.md` in repository root (Arabic content), audit findings.

---

## 1. Strategic Objective

Transform QIROX from a comprehensive SaaS platform into a full digital ecosystem — the first and smartest choice for every startup and SME in the Arab and Gulf market.

---

## 2. Current Platform Capabilities (V3 Baseline)

| Area | Status |
|---|---|
| Public website (143+ pages) | ✅ Live |
| Client portal | ✅ Live |
| Employee portal | ✅ Live |
| Admin panel | ✅ Live |
| Project management (Kanban) | ✅ Live |
| Finance / payroll / attendance | ✅ Live |
| CRM (contacts, leads, pipeline) | ✅ Live |
| WhatsApp CRM (wa.me templates) | ✅ Live |
| Wallet / loyalty / referrals | ✅ Live |
| Installment plans | ✅ Live |
| Shipments / order tracking | ✅ Live |
| Contracts / SLA | ✅ Live |
| AI Studio (GPT-4o / Kimi) | ✅ Live |
| System / website builder | ✅ Live |
| E-commerce store + barcode | ✅ Live |
| Subscriptions | ✅ Live |
| Push notifications (VAPID) | ✅ (config needed) |
| Group messaging | ✅ Live |
| Cash register / POS | ✅ Live |
| API Keys (external integration) | ✅ Live |
| QMeet (WebRTC video) | ✅ Live |
| DeploymentCloud (GitHub OAuth) | ✅ Live |
| Sandbox IDE (Monaco) | ✅ Live |
| Email marketing | ✅ Live |
| Pixel tracking (Meta/TikTok/Snap/GA4/GTM) | ✅ Live |
| iOS app (Capacitor) | ✅ Built |
| Android TWA | ✅ Built |
| PayPal payments | ✅ Live |
| Bank transfer payments | ✅ Live |

---

## 3. V4 Foundation Work (Current Phase — Pre-Feature)

Before any new feature work, the following foundation issues must be resolved.

See individual docs for full details:

| Area | Document | Priority Items |
|---|---|---|
| Security hardening | `SECURITY.md` | SEC-CRIT-001, SEC-CRIT-002, SEC-HIGH-001 through 006 |
| Architecture refactor | `ARCHITECTURE.md` | ARCH-001 (routes.ts split), ARCH-002 (models split) |
| Database indexing | `DATABASE.md` | DB-001 through DB-009 |
| API standardization | `API_STANDARDS.md` | API-001 (validation), API-002 (rate limiting) |
| iOS App Store compliance | `APPLE_REVIEW.md` | APPLE-001, APPLE-002, APPLE-005 |
| SEO foundation | `SEO_ENGINEERING.md` | SEO-001 (SSR), SEO-003 (lang tags) |

---

## 4. V4 Feature Phases (From ROADMAP.md)

### Phase 1 — Solid Foundation & High Performance
*Estimated: 4-6 weeks (per source roadmap)*

- UX improvements and faster interfaces
- Performance optimization
- Core Web Vitals improvement
- Advanced SEO implementation

### Phase 2 — Ecosystem Expansion
*Estimated: Per source roadmap*

- Partner ecosystem (agencies, freelancers)
- Advanced analytics dashboard
- Enhanced AI Studio capabilities
- Multi-tenant improvements

### Phase 3 — Market Dominance
*Estimated: Per source roadmap*

- Marketplace for system templates
- Mobile app enhancement
- Advanced integrations (accounting software, ERPs)
- White-label capabilities

### Phase 4 — Regional Leadership
*Estimated: Per source roadmap*

- International expansion beyond GCC
- Enterprise tier
- Advanced compliance (ZATCA, VAT integration for KSA)

---

## 5. Issue Priority Queue (Ordered by Impact)

> All from the current audit. No new features — foundation first.

| # | Issue | Severity | Document |
|---|---|---|---|
| 1 | Hardcoded session secret | CRITICAL | SECURITY.md SEC-CRIT-001 |
| 2 | Command injection in sandbox | CRITICAL | SECURITY.md SEC-CRIT-002 |
| 3 | Distribution private key in repo | CRITICAL | APPLE_REVIEW.md APPLE-001 |
| 4 | Apple IAP compliance | CRITICAL | APPLE_REVIEW.md APPLE-005 |
| 5 | SPA with no SSR (SEO) | CRITICAL | SEO_ENGINEERING.md SEO-001 |
| 6 | routes.ts monolith (16,975 lines) | CRITICAL | ARCHITECTURE.md ARCH-001 |
| 7 | NoSQL injection via AI tools | HIGH | SECURITY.md SEC-HIGH-001 |
| 8 | Missing rate limiting | HIGH | SECURITY.md SEC-HIGH-004 |
| 9 | Missing CSRF protection | HIGH | SECURITY.md SEC-HIGH-005 |
| 10 | File upload MIME validation | HIGH | SECURITY.md SEC-HIGH-006 |
| 11 | Missing auth guard audit | HIGH | PERMISSIONS.md PERM-001 |
| 12 | Local disk uploads (no CDN) | HIGH | ARCHITECTURE.md ARCH-006 |
| 13 | models.ts monolith (2,339 lines) | HIGH | ARCHITECTURE.md ARCH-002 |
| 14 | Missing database indexes | HIGH | DATABASE.md DB-002 |
| 15 | Missing startup env validation | MEDIUM | SECURITY.md SEC-MED-002 |
