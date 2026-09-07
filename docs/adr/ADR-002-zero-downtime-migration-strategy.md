# ADR-002 — Zero Downtime Migration Strategy

**Status:** Accepted  
**Date:** Migration 009 (formalised from CTO Directive)  
**Deciders:** CTO

---

## Context

The QIROX platform is in active production use. The system requires continuous
architectural improvement (reducing technical debt, extracting domains) while
serving real users. Any migration that causes downtime, data loss, or API breakage
is unacceptable.

## Decision

All migrations must follow these non-negotiable rules:

### Additive-only changes
1. **Never delete existing code** until the replacement is verified in production.
2. **Never rename existing APIs.** New behavior goes behind V2 endpoints or Feature Flags.
3. **Never remove existing pages or routes.**
4. **Never modify MongoDB collections in a breaking way.** Only additive fields; no renames, no removals, no destructive migrations.
5. **Never break existing frontend behavior.**

### Parallel running
- Legacy code stays fully operational while the new domain is built.
- The new domain is wired only after QA approval.
- Switching is done by changing one import; rollback is done by reverting it.

### Feature flags
Major new features are gated behind named feature flags until QA-approved:
`CRM_V2`, `EMPLOYEE_DASHBOARD_V2`, `CLIENT_DASHBOARD_V2`, etc.

### Migration documentation
Every migration must declare:
- Purpose
- Risk
- Rollback Strategy
- Verification Checklist
- Expected Downtime (**always ZERO**)

## Consequences

**Positive:**
- Production is always in a known-good state.
- Migrations can be paused or rolled back at any point.
- Risk is bounded — the blast radius of any single migration is limited to import changes.

**Negative:**
- Temporary code duplication is unavoidable (tracked in tech debt register).
- Migration timelines are longer; legacy code must be maintained in parallel.
- Engineers must be disciplined about not touching legacy files during migration.

## Rollback Considerations

By definition, this ADR *is* the rollback strategy. If any migration violates it,
the migration itself is the rollback target. Restore via checkpoint.

## Target

Permanent policy. No sunset date.
