# ADR-003 — Infrastructure Adapter Pattern for Legacy Dependencies

**Status:** Accepted  
**Date:** Migration 009-QF (Quality Foundation)  
**Deciders:** CTO, Engineering

---

## Context

During Migration 009 (Email Domain extraction), 14 transactional email templates
with complex custom HTML layouts were not fully migrated into `domain.ts` template
builders. The initial implementation used dynamic `import()` inside `service.ts`
to call the legacy `server/email.ts` functions:

```typescript
// PROHIBITED — dynamic import inside domain layer
const legacy = await import("../../email");
return legacy.sendQMeetInviteEmail(to, name, data);
```

This pattern was identified as a domain architecture violation because:
1. Dynamic imports obscure dependencies and prevent static analysis.
2. They introduce asynchronous module loading into otherwise synchronous orchestration.
3. The dependency on legacy code is invisible — it doesn't appear in the import graph.
4. It cannot be mocked cleanly in unit tests.

## Decision

Dynamic imports inside any domain layer file (`domain.ts`, `service.ts`,
`repository.ts`, `mapper.ts`, `controller.ts`) are **prohibited**.

When a domain needs to depend on a legacy module or external system that is not
yet fully migrated, the dependency is wrapped in an **Infrastructure Adapter**
located in `server/domains/<name>/infrastructure/`.

The adapter:
- Uses **static imports** from the legacy module.
- Re-exports each function with an explicit, typed signature.
- Carries a `TECH-XXX` reference to the tech debt item tracking its removal.
- Is the **only place** in the domain that knows about the legacy module.

Example:

```typescript
// server/domains/email/infrastructure/legacy-email-adapter.ts
import { sendQMeetInviteEmail as _sendQMeetInviteEmail } from "../../../email";

/** TECH-001 — QMeet invite template not yet migrated to domain.ts */
export async function sendQMeetInviteEmail(...): Promise<boolean> {
  return _sendQMeetInviteEmail(...);
}
```

The service layer then imports from the adapter:

```typescript
// server/domains/email/service.ts
import * as LegacyEmailAdapter from "./infrastructure/legacy-email-adapter";

export async function sendQMeetInviteEmail(...): Promise<boolean> {
  return LegacyEmailAdapter.sendQMeetInviteEmail(...);
}
```

## Consequences

**Positive:**
- Dependency on legacy code is explicit and visible in the import graph.
- The adapter is the single target for deletion when migration is complete.
- Each adapter function documents which TECH-ID it is tracked under.
- Unit tests can mock the adapter module cleanly.

**Negative:**
- One extra indirection level (adapter → legacy).
- Adapter functions are boilerplate wrappers with no logic.

## Rollback Considerations

If the adapter itself causes issues, individual functions can be replaced with
direct service implementations. The adapter can be deleted when TECH-001 is
resolved (all 14 templates migrated into `domain.ts`).

## Target removal

TECH-001 and TECH-002 — planned for Migration 011.
When both are resolved, `server/domains/email/infrastructure/` can be deleted
and `server/email.ts` (or the remaining imports from it) can be removed.
