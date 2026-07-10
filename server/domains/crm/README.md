# CRM Domain

## Purpose

Encapsulates all CRM (Customer Relationship Management) lead pipeline logic
within a clean, layered architecture. Provides typed CRUD operations for leads,
pipeline statistics, bulk import, and activity logging.

## Responsibilities

- Lead CRUD: create, read (with filters), update, delete.
- Pipeline statistics: per-stage counts and value aggregations.
- Bulk lead import from CSV/spreadsheet row arrays (with duplicate detection).
- Activity logging per lead (calls, emails, WhatsApp, meetings, notes, tasks).
- Role-based access control: only CRM roles may access any endpoint.

**Out of scope:**
- Email sending (use the email domain).
- Invoice or payment management.
- CRM marketing campaigns.

## Boundaries

| Allowed | Prohibited |
|---|---|
| Read/write `CrmLeadModel` collection | Access to any other Mongoose model |
| Import from `./types`, `./domain`, `./repository`, `./mapper` | Import from `server/email.ts` or other domains |
| Role checking via `domain.hasCrmAccess` | Business logic in `controller.ts` |

## Layer Responsibilities

```
types.ts       — Shared interfaces. No logic.
domain.ts      — Pure functions: role rules, input defaults, import row parsing.
repository.ts  — DB queries only: CrmLeadModel.*
service.ts     — Orchestration: domain + repository + mapper.
controller.ts  — HTTP boundary: req/res → service → res.json()
mapper.ts      — Response shaping (pass-through; see TECH-003)
validation.ts  — Zod schema stubs (wired in Migration 008+)
routes.ts      — Route registration with requireCRM guard
index.ts       — Public barrel export
```

## Dependencies

| Dependency | Reason |
|---|---|
| `server/models.ts` (CrmLeadModel) | Lead CRUD and activity logging |

## Public API

```typescript
import { registerCrmRoutes } from "../domains/crm";
```

### HTTP Surface (unchanged from legacy)

| Method | Path | Description |
|---|---|---|
| GET | `/api/crm/leads` | List leads with optional filters |
| GET | `/api/crm/stats` | Pipeline statistics |
| POST | `/api/crm/leads/import` | Bulk import |
| POST | `/api/crm/leads` | Create lead |
| PATCH | `/api/crm/leads/:id` | Update lead |
| DELETE | `/api/crm/leads/:id` | Delete lead (restricted roles) |
| POST | `/api/crm/leads/:id/activity` | Add activity |

### Access roles
`admin`, `manager`, `sales`, `sales_manager`, `marketing`
Delete restricted to: `admin`, `manager`, `sales_manager`

## Future Planned Migrations

| Migration | Target |
|---|---|
| Migration 010 | Wire Zod validation schemas |
| Migration 013 | Replace pass-through mapper with typed DTOs (resolves TECH-003) |

## Tech Debt Tracked

- **TECH-003** — Mapper is a pass-through; no typed DTO conversion yet
- **TECH-006** — No unit tests for domain layer (pure functions, fully testable)
