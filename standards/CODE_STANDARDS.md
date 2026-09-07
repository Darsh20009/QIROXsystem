# CODE_STANDARDS.md — QIROX Engineering Code Standards

> **Source of truth:** docs/ directory  
> **Scope:** All code in client/, server/, shared/  
> **Status:** Enforcement-ready — no production code modified

---

## Purpose

Define the universal code quality rules that apply to every file in the QIROX codebase regardless of layer (frontend, backend, shared). These standards are derived exclusively from the audit findings in docs/ARCHITECTURE.md, docs/SECURITY.md, and docs/API_STANDARDS.md.

---

## Rules

### R-CODE-001 — No `@ts-nocheck`
TypeScript strict mode must be enforced. `@ts-nocheck` is forbidden in all new files and must be removed from existing files during each phase of the refactor per docs/EXECUTION_PLAN.md Phase 1.

### R-CODE-002 — No `any` Types Without Explicit Justification
`any` is forbidden except in narrowly scoped adapter layers. Every `any` must have an inline comment explaining why it cannot be typed. All AI tool executor arguments in server/ai.ts must be typed via Zod schemas (see docs/SECURITY.md SEC-HIGH-001).

### R-CODE-003 — No Silent Error Swallowing
`.catch(() => {})` is forbidden. Every caught error must be logged at minimum. See docs/ARCHITECTURE.md ISSUE-ARCH-003 and docs/SECURITY.md SEC-MED-003.

### R-CODE-004 — No `console.log` in Production Code
`console.log`, `console.warn`, `console.error` are forbidden in production paths. Use the structured logger (`server/logger.ts`) on the backend. Remove all 29 instances in client/ per docs/SECURITY.md SEC-MED-005 and docs/UI_RULES.md UI-007.

### R-CODE-005 — No Hardcoded Secrets or Fallback Credentials
Hardcoded strings used as security credentials are forbidden. The `SESSION_SECRET` fallback (`"qirox_super_secret_key_2024"`) must be removed. See docs/SECURITY.md SEC-CRIT-001.

### R-CODE-006 — File Size Limits
Per docs/PROJECT_STRUCTURE.md Section 4:
- Any single route file: < 400 lines
- Any single model file: < 150 lines
- Any single page component: < 500 lines
- Any single service file: < 600 lines

### R-CODE-007 — One Responsibility Per File
No file may combine unrelated domains. `server/routes.ts` (16,975 lines, all domains) and `server/models.ts` (2,339 lines, 40+ models) are the primary violations — both must be split per the migration plan in docs/EXECUTION_PLAN.md Phase 1.

### R-CODE-008 — Environment Variables Must Be Validated at Startup
All required environment variables must be checked at server startup with a hard error if missing. Runtime discovery of missing env vars is forbidden. See docs/SECURITY.md SEC-MED-002.

### R-CODE-009 — No `exec()` for User-Influenced Commands
`exec()` with user-controlled input is forbidden. Use `execFile()` with explicit argument arrays. Validate and allowlist all command inputs. See docs/SECURITY.md SEC-CRIT-002.

### R-CODE-010 — Brand Name Casing
- UI display: `QIROX` (all caps)
- Technical identifiers (package names, CSS classes, URLs): `qirox` (all lowercase)
- Never: `Qirox` in UI context

---

## Allowed

- TypeScript `unknown` as a safer alternative to `any`
- `console.log` in development-only code blocks gated by `NODE_ENV !== 'production'`
- `execFile()` with validated, allowlisted arguments
- Structured error logging via `server/logger.ts`
- `// TODO:` comments with a linked issue reference

---

## Forbidden

- `@ts-nocheck` — anywhere
- `any` — without inline justification comment
- `.catch(() => {})` — silent swallowing
- `console.log` — in production-path code
- `exec(userControlledInput)` — RCE risk
- Hardcoded fallback credentials — session secrets, API keys, passwords
- Files exceeding size limits without documented justification

---

## Examples

### Forbidden
```typescript
// FORBIDDEN: silent error swallowing
ClientApiKeyModel.findByIdAndUpdate(id, update).exec().catch(() => {});

// FORBIDDEN: any type without justification
async function processToolArgs(args: any) { ... }

// FORBIDDEN: hardcoded secret fallback
secret: process.env.SESSION_SECRET || "qirox_super_secret_key_2024"
```

### Allowed
```typescript
// ALLOWED: logged error
ClientApiKeyModel.findByIdAndUpdate(id, update).exec()
  .catch((e) => logger.error('API key update failed', { error: e.message }));

// ALLOWED: typed tool args
const toolArgsSchema = z.object({ invoiceId: z.string(), amount: z.number() });
async function processToolArgs(args: z.infer<typeof toolArgsSchema>) { ... }

// ALLOWED: startup guard
if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is required. Set it in environment variables.');
}
```

---

## Checklist

Before any PR / code submission:
- [ ] No `@ts-nocheck` added
- [ ] No untyped `any` without comment
- [ ] No `.catch(() => {})` patterns
- [ ] No `console.log` in production paths
- [ ] No hardcoded secrets or fallback credentials
- [ ] File stays within size limits
- [ ] All new env vars documented in `.env.example`
- [ ] Brand name casing correct

---

## Common Mistakes

| Mistake | Fix |
|---|---|
| Adding `@ts-nocheck` to skip type errors | Fix the type errors |
| Using `any` because the type is complex | Use `unknown` + type guards, or define a Zod schema |
| `.catch(() => {})` to suppress linter warning | `.catch((e) => logger.error(..., e))` |
| Logging debug info with `console.log` | Use logger with `debug` level, gated by NODE_ENV |
| Checking env vars inside route handlers | Check all required vars in startup validation block |

---

## Future Scalability Considerations

- When team grows beyond 5 engineers, enforce these rules via ESLint plugins (no-any, no-console) in CI/CD
- Consider adding `eslint-plugin-no-secrets` to catch accidentally committed credentials
- TypeScript strict mode (`"strict": true` in tsconfig.json) should be enforced via compilation in CI before merge
- File size limits should be enforced via a custom linting rule or a pre-commit hook script
