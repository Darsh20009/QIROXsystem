# ADR-004 — Pass-Through Mapper Pattern for Initial Domain Migrations

**Status:** Accepted (Temporary)  
**Date:** Migration 008  
**Deciders:** Engineering  
**Review date:** Migration 013

---

## Context

Each domain includes a `mapper.ts` file responsible for converting between
Mongoose documents and typed DTO objects. Implementing full DTO conversion
immediately would require:

1. Defining explicit response DTO types for every field.
2. Handling the `toJSON` / `lean()` duality of Mongoose.
3. Ensuring the resulting wire format is byte-identical to the legacy API response.

During the initial domain migration phase, the primary goal is structural
extraction (isolating concerns) not response re-shaping. Changing the response
format simultaneously would violate ADR-002 (Zero Downtime — no hidden breaking
changes) and expand migration risk.

## Decision

During initial domain migrations (008–009), `mapper.ts` files implement
**pass-through mappers**: they accept `unknown` (raw Mongoose output) and return
it unchanged, relying on the existing Mongoose `toJSON` transform for
serialisation.

```typescript
// Pass-through — preserves existing API contract exactly
export function toLeadResponse(doc: unknown): unknown {
  return doc;
}
```

This is acknowledged as temporary technical debt (TECH-003) and does not mean
the mapper layer is permanently inert.

## Consequences

**Positive:**
- API response shape is guaranteed identical to legacy (zero hidden breaking changes).
- Migration scope is narrower and lower risk.
- The mapper layer is architecturally present and ready for real implementation.

**Negative:**
- Mapper functions do no useful work in this phase.
- Type safety ends at `unknown` — consumers rely on Mongoose's implicit serialisation.
- Regressions in field naming or shape are harder to catch without explicit mapping.

## Rollback Considerations

Pass-through mappers have zero behavioral impact. Removing them (replacing with
direct document returns) would not change any observable behavior. Adding real
DTO conversion must be done carefully to avoid changing the wire format —
comprehensive API response tests should exist before this migration.

## Target

Replace pass-through mappers with typed DTO conversion in Migration 013.
Prerequisite: API response snapshot tests must be in place first (TECH-006).
