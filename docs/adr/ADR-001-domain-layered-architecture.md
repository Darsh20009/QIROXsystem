# ADR-001 — Domain Layered Architecture

**Status:** Accepted  
**Date:** Migration 008  
**Deciders:** CTO, Engineering

---

## Context

The QIROX platform server started as a set of monolithic route files
(`server/routes.ts`, `server/email.ts`, `server/crm.ts`, etc.). As the system
grew to 30+ features, concerns became entangled: database queries appeared inside
route handlers, business rules were scattered across files, and there was no
consistent structure for new features.

The platform is in production. Any restructuring must happen without downtime
and without breaking existing API contracts.

## Decision

Adopt a layered domain architecture for all new and migrated server-side modules.
Each domain lives in `server/domains/<name>/` and contains exactly these files:

| File | Responsibility |
|---|---|
| `types.ts` | Shared TypeScript interfaces and DTOs. No logic. |
| `domain.ts` | Pure business rules. No I/O. No HTTP. No DB. |
| `repository.ts` | Database access only. No business rules. |
| `service.ts` | Orchestration. Calls domain + repository + infrastructure. |
| `controller.ts` | HTTP boundary. Translates req/res ↔ service. |
| `mapper.ts` | DTO ↔ entity conversion. |
| `validation.ts` | Zod schema definitions (stubs until Migration 010+). |
| `routes.ts` | Route registration. |
| `index.ts` | Public barrel export. |
| `README.md` | Domain documentation. |
| `infrastructure/` | Adapters for external systems, legacy code, third-party APIs. |

**Dependency direction** (strictly one-way):

```
routes → controller → service → domain
                   → repository
                   → infrastructure
                   → mapper
```

No layer may import from a layer above it in this graph.

## Consequences

**Positive:**
- Clear ownership of each concern; easy to locate bugs.
- `domain.ts` functions are pure and unit-testable without mocking Express or Mongoose.
- Rollback of any migration is a single import change — legacy code stays intact until verification.
- New engineers can onboard faster with consistent structure.

**Negative:**
- More files per feature (9 files minimum per domain).
- Initial migration effort is high; legacy code runs in parallel during transition.
- Pass-through mappers add a layer with no immediate benefit (addressed in TECH-003).

## Rollback Considerations

This is an architectural pattern, not a single change. Individual domain migrations
are rolled back by restoring the import in `server/index.ts` to point at the legacy
file. The domain directory can be deleted without affecting the running system.

## Target

This pattern applies to all domains. Legacy files (`server/email.ts`, `server/crm.ts`,
etc.) remain operational until each domain reaches production quality and is
QA-approved.
