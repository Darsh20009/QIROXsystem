# Definition of Done — QIROX Engineering Standard

**Version:** 1.0  
**Effective from:** Migration 010  
**Owner:** CTO

---

## Purpose

Every migration is considered **Done** only when ALL items in this checklist
are verified. Partial completion is not Done. A migration that fails any item
must be remediated before it can be marked complete.

---

## Mandatory Checklist

### Build & Type Safety

- [ ] **Build passes** — `npm run build` exits 0 with no errors.
- [ ] **TypeScript passes** — `npx tsc --noEmit --skipLibCheck` exits 0 with no new errors.
  - Zero tolerance for new `any` casts introduced without a `// TECH-XXX` comment.
- [ ] **No new ESLint violations** — `npx eslint` produces no new errors or warnings compared to the baseline.

### Architecture

- [ ] **No dynamic imports inside domain layer** — `import()` is prohibited in `domain.ts`, `service.ts`, `repository.ts`, `mapper.ts`, and `validation.ts`. Dynamic loading goes in `infrastructure/` adapters only.
- [ ] **No direct database calls from services** — All DB access goes through `repository.ts`.
- [ ] **No HTTP request/response objects inside services or domain** — Express `req`/`res` stays in `controller.ts` and `routes.ts` only.
- [ ] **No inline business rules in controllers** — Business logic lives in `domain.ts`.
- [ ] **No duplicate business logic introduced** — If logic already exists in another domain or utility, import it; do not copy it.

### Zero Downtime

- [ ] **Rollback documented** — The migration document states exactly how to revert (which file to restore or which import to change). Rollback must be a single-file or single-import operation.
- [ ] **No breaking API changes** — Existing endpoint paths, methods, and response shapes are unchanged. New behavior goes behind new endpoints or feature flags.
- [ ] **No breaking DB schema changes** — Collections, field names, and types are unchanged. Only additive fields allowed.
- [ ] **No hidden breaking changes** — The change does not silently alter behavior for existing consumers (e.g. changed defaults, removed fallbacks, altered error shapes).
- [ ] **Expected downtime: ZERO** — Production must remain fully operational throughout.

### Documentation

- [ ] **Technical Debt updated** — Any new workaround, temporary solution, or deferred work has a TECH-ID in `docs/tech-debt-register.md`.
- [ ] **ADR updated if applicable** — Any new architectural decision has an ADR in `docs/adr/`. Existing ADRs are updated when a decision changes.
- [ ] **Domain README updated** — The affected domain's `README.md` reflects the current state of responsibilities, boundaries, and public API.
- [ ] **Verification report provided** — The migration closes with a structured report covering: files created, files modified, APIs verified, rollback strategy, risks, tech debt remaining.

### Quality

- [ ] **No production behavior modified** — Existing users experience zero change in functionality.
- [ ] **No new features introduced** — Architecture migrations are pure refactoring. Feature flags are required for any new capability.
- [ ] **App starts cleanly after changes** — Workflow restarts with no new errors in logs.
- [ ] **Module imports cleanly** — New domain modules are verified with `tsx --eval "import('./domain/index.js').then(() => console.log('OK'))"`.

---

## Verification Report Template

Every migration must end with this report:

```
### 1. Files Created
### 2. Files Modified
### 3. APIs Verified
### 4. Rollback Strategy
### 5. Risks
### 6. Technical Debt Remaining
### Expected Downtime: ZERO
```

---

## Escalation

If a checklist item cannot be completed without violating another rule (e.g.
rollback is not possible without an API change), the conflict must be escalated
to the CTO before the migration proceeds. Do not ship a migration with known
DoD violations.
