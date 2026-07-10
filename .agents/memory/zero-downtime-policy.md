---
name: Zero Downtime Policy
description: CTO directive — non-negotiable rules governing all changes to the Qirox platform. Production must never stop.
---

# Zero Downtime Policy (CTO Directive)

## The Rule
Production must never stop. The system is live. Every change must be additive and backward-compatible.

## Non-Negotiable Constraints
1. Never delete existing code.
2. Never rename existing APIs — create V2 endpoints instead.
3. Never remove existing pages.
4. Never modify MongoDB collections destructively — additive fields only, no renames, no removals.
5. Never break existing frontend behavior.
6. Never stop the production website.
7. Every migration must be additive.

## Feature Flag Convention
Major new features ship behind flags until QA-approved:
- `CRM_V2`, `EMPLOYEE_DASHBOARD_V2`, `CLIENT_DASHBOARD_V2`, `EVENTS_V2`, `APPLE_WALLET_V2`, `AI_PLATFORM_V2`, `SEO_PLATFORM_V2`
- Old implementation stays active until new one is approved for production.

## Migration Documentation Requirement
Every migration must include: Purpose, Risk, Rollback Strategy, Verification Checklist, Expected Downtime (always ZERO).

**Why:** The platform is in production use. Breaking changes cause real user impact. All development must be safe-to-deploy at any point.

**How to apply:** Before writing any code that touches existing APIs, routes, DB schemas, or UI pages — ask: "Is this additive? Does the old path still work?" If not, restructure as a V2 or flag-gated addition.
