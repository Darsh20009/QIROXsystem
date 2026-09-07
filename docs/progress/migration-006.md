# Migration 006 — Validation Foundation

**Status:** Complete  
**Date:** 2026-07-10  
**Type:** Additive — no existing files modified  
**Risk:** Zero — no runtime behavior changed

---

## Objective

Create a reusable, provider-agnostic validation platform covering all layers
of request and response validation. This prepares the platform for schema-driven
validation middleware without coupling any existing code to a specific library.

---

## Files Created

| File | Purpose |
|---|---|
| `server/validation/types.ts` | Core types: `ValidationResult<T>`, `FieldError`, `ValidationContext`, helpers |
| `server/validation/contracts.ts` | Interfaces: `ISchema`, `IValidator`, `IValidationEngine`, `ISchemaProvider`, `IValidationMiddlewareFactory` |
| `server/validation/errors.ts` | Error codes, categories, HTTP status mapping, `toApiValidationError()` |
| `server/validation/helpers.ts` | Pure predicates & normalisers: email, URL, UUID, ObjectId, Saudi phone, Arabic text |
| `server/validation/rules.ts` | Declarative rule descriptor types, union `Rule`, `RuleSet`, `FieldRuleMap`, `rules` builder |
| `server/validation/request.ts` | Request validation strategy design: `RequestValidationConfig`, pipeline, extractor map |
| `server/validation/response.ts` | Response validation strategy design: `ResponseValidationConfig`, `IResponseValidator`, `ResponseSchemaViolation` |
| `server/validation/index.ts` | Barrel export — single import point for all validation types |

---

## Validation Contracts

### Core Result Type

```typescript
type ValidationResult<T> =
  | { success: true;  data: T;              warnings?: FieldError[] }
  | { success: false; errors: FieldError[]; }

interface FieldError {
  field:     string;          // dot-path: "user.email", "items[0].qty"
  rule:      string;          // matches ValidationErrorCode
  message:   string;
  severity?: "error" | "warning";
  received?: unknown;         // omitted for sensitive fields
  expected?: string;          // hint: "ISO 8601 date", "1–120 chars"
}
```

### Provider Interface

```typescript
interface IValidator<TInput, TOutput> {
  schema:       ISchema<TInput, TOutput>;
  validate(input, context?):      ValidationResult<TOutput>;
  validateAsync(input, context?): Promise<ValidationResult<TOutput>>;
}

interface IValidationEngine {
  compile<I, O>(schema: ISchema<I, O>): IValidator<I, O>;
  validate<I, O>(schema, input, context?): ValidationResult<O>;
}
```

### Declarative Rules

```typescript
// Build rules as plain data — no library required:
const createUserRules: FieldRuleMap = {
  email:    { field: "email",    rules: [rules.required(), rules.email()] },
  password: { field: "password", rules: [rules.required(), rules.minLength(8)] },
  phone:    { field: "phone",    rules: [rules.phone("SA")], optional: true },
};
```

---

## Validation Error Codes

32 typed codes across 9 categories:

| Category | Codes |
|---|---|
| Presence | `required`, `notNull`, `notEmpty` |
| Type | `invalidString`, `invalidNumber`, `invalidBoolean`, `invalidArray`, `invalidObject`, `invalidDate` |
| Constraint | `minLength`, `maxLength`, `min`, `max`, `integer`, `positive`, `nonNegative`, `minItems`, `maxItems` |
| Format | `pattern`, `invalidEmail`, `invalidUrl`, `invalidUuid`, `invalidObjectId`, `invalidPhone` |
| Membership | `invalidEnum`, `notAllowed` |
| Structure | `unknownField`, `unionMismatch` |
| Cross-field | `fieldsMismatch`, `conditionalRequired` |
| Business | `alreadyExists`, `notFound`, `normalised` |
| Custom | `custom` |

---

## Validation Strategy

### Provider-agnostic design
All production code depends on `IValidator<TInput, TOutput>`, never on `ZodSchema` or any other library type. The `IValidationEngine` interface is the single seam — swapping Zod for another library only changes the engine implementation.

### Declarative rules → compiled schemas
`FieldRuleMap` stores rules as plain data objects. The `ZodSchemaCompiler` (Migration 007+) reads these descriptors and chains the equivalent Zod methods, enabling OpenAPI generation from the same source.

### Context-aware validation
`ValidationContext` carries `method`, `path`, `userId`, `userRole`, `locale`, and `strict` flag. Validators receive this at runtime for conditional rules (e.g. a field required only in PATCH but not POST).

---

## Error Mapping Strategy

```typescript
// FieldError[] → wire format
const apiError = toApiValidationError(errors);
// → { type: "validation_error", status: 422, message: "3 fields failed", errors: [...] }

// HTTP status selection:
// alreadyExists → 409,  notFound → 404,  notAllowed → 403,  all others → 422
```

`received` and `expected` fields are stripped from the wire format by design — clients receive only `field`, `rule`, `message`, `category`, `severity`.

---

## Request Validation Strategy (Design)

```
Request arrives
      ↓
Extract target (body / query / params / headers)
      ↓
Run PipelineStep[].run(input, context)
      ↓
  success?  →  attach to req.validated.{target}
  failure?  →  collect FieldError[]
      ↓
Any errors?  →  toApiValidationError() → res.status(422).json(...)
No errors?   →  next() — handler reads from req.validated
```

Implementation deferred to Migration 007+.

---

## Response Validation Strategy (Design)

- **Development/test only** — `shouldRun()` always returns `false` in production.
- Intercepts `res.json()` before the response is sent.
- On failure: `"log"` (warn to console), `"warn"` (set header), or `"throw"` (500 in tests).
- `ResponseSchemaViolation` error class carries the `FieldError[]` for test assertions.

Implementation deferred to Migration 007+.

---

## Validation Helpers

| Helper | Validates |
|---|---|
| `isValidEmail` / `normaliseEmail` | RFC 5322 email |
| `isValidUrl` | Absolute HTTP/HTTPS URL |
| `isValidUuid` | UUID v1–v5 |
| `isValidObjectId` | 24-char MongoDB ObjectId hex |
| `isValidE164Phone` | International E.164 phone |
| `isValidSaudiPhone` / `normaliseSaudiPhone` | SA local (05XX) + international (+9665XX) |
| `containsArabic` / `isArabicOnly` | Arabic Unicode block U+0600–U+06FF |
| `isValidIsoDate` / `isValidDate` | ISO 8601 string / Date instance |
| `isPlainObject` / `isNonEmptyArray` | Object / array structure checks |
| `findDuplicates` | Returns duplicate items in an array |

---

## Compatibility Strategy

- Entirely additive — zero existing files modified
- No schema library dependency introduced (`zod` is already in the project; this module does not import it)
- All existing `req.body` casts and manual checks in routes remain untouched
- Helpers are pure functions — safe to call anywhere, no side effects

---

## Rollback Strategy

Delete `server/validation/` entirely — nothing imports from it yet.  
No runtime hooks, no middleware registered, no database changes.

---

## Verification

| Check | Result |
|---|---|
| No runtime behavior changed | ✅ |
| No APIs changed | ✅ |
| No database queries changed | ✅ |
| No business logic changed | ✅ |
| No production code modified | ✅ |
| Application starts successfully | ✅ All routes returning 200s/304s |

---

## Infrastructure Built So Far

| Migration | Layer | Status |
|---|---|---|
| 002 | Shared Utilities (`server/utils.ts`) | ✅ Complete |
| 003 | Error System (`server/errors/`) | ✅ Complete |
| 004 | Logging Foundation (`server/logger/`) | ✅ Complete |
| 005 | Configuration Foundation (`server/config/`) | ✅ Complete |
| 006 | Validation Foundation (`server/validation/`) | ✅ Complete |
