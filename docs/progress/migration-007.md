# Migration 007 — CRM Domain Migration

**Status:** Complete  
**Date:** 2026-07-10  
**Type:** Domain extraction — 1 existing file modified (import only)  
**Risk:** Minimal — legacy file preserved, rollback is one line

---

## Objective

Extract the CRM module from `server/crm.ts` (monolithic route handler) into
a fully-layered domain under `server/domains/crm/` following the enterprise
architecture: routes → controller → service → domain → repository → mapper.
All 7 endpoints, 6 business rules, and 8 database queries are preserved
with 100% behavioral identity.

---

## Files Created

| File | Layer | Responsibility |
|---|---|---|
| `server/domains/crm/types.ts` | Contracts | All domain types, enums, input/output shapes |
| `server/domains/crm/domain.ts` | Business rules | Auth predicates, input resolution, import parsing |
| `server/domains/crm/repository.ts` | Data access | All Mongoose queries — 8 operations |
| `server/domains/crm/mapper.ts` | Translation | Mongoose doc → response (pass-through strategy) |
| `server/domains/crm/service.ts` | Orchestration | Use-case coordination, error typing |
| `server/domains/crm/controller.ts` | HTTP | req → service → res, error → status code |
| `server/domains/crm/validation.ts` | Placeholder | Stub schemas for Migration 008+ |
| `server/domains/crm/routes.ts` | Routing | Express mount, auth guard, handler wiring |
| `server/domains/crm/index.ts` | Barrel | Public API — exports `registerCrmRoutes` |

## Files Modified

| File | Change |
|---|---|
| `server/index.ts` | Line 16: `import { registerCrmRoutes } from "./crm"` → `"./domains/crm"` |

---

## Endpoints Migrated

| Method | Path | Handler | Status |
|---|---|---|---|
| GET | `/api/crm/leads` | `controller.listLeads` | ✅ Migrated |
| GET | `/api/crm/stats` | `controller.getStats` | ✅ Migrated |
| POST | `/api/crm/leads/import` | `controller.importLeads` | ✅ Migrated |
| POST | `/api/crm/leads` | `controller.createLead` | ✅ Migrated |
| PATCH | `/api/crm/leads/:id` | `controller.updateLead` | ✅ Migrated |
| DELETE | `/api/crm/leads/:id` | `controller.deleteLead` | ✅ Migrated |
| POST | `/api/crm/leads/:id/activity` | `controller.addActivity` | ✅ Migrated |

---

## Business Rules Extracted

All rules live exclusively in `server/domains/crm/domain.ts`:

| # | Rule | Location |
|---|---|---|
| BR-01 | CRM access: roles `admin`, `manager`, `sales`, `sales_manager`, `marketing` | `hasCrmAccess()` |
| BR-02 | Delete access: roles `admin`, `manager`, `sales_manager` only | `canDeleteLead()` |
| BR-03 | Create lead defaults: `value→Number\|0`, `currency→SAR`, `tags→[]`, `assignedTo→user._id`, `assignedToName→fullName\|username` | `resolveCreateLeadInput()` |
| BR-04 | Import row mapping: English + Arabic column aliases; skip rows with no name | `parseImportRow()` |
| BR-05 | Import deduplication: skip rows whose phone already exists in DB | `service.importLeads()` (DB check via repository) |
| BR-06 | Activity defaults: `type→"note"` when absent/invalid; `content` required | `resolveAddActivityInput()` |

---

## Database Queries Extracted

All queries live exclusively in `server/domains/crm/repository.ts`:

| # | Function | Mongoose Operation |
|---|---|---|
| Q-01 | `findLeads(filters)` | `CrmLeadModel.find(query).sort({ updatedAt: -1 }).lean()` |
| Q-02 | `countLeads()` | `CrmLeadModel.countDocuments()` |
| Q-03 | `aggregateByStage()` | `CrmLeadModel.aggregate([$group by stage])` |
| Q-04 | `aggregateTotalValue()` | `CrmLeadModel.aggregate([$group total])` |
| Q-05 | `findLeadByPhone(phone)` | `CrmLeadModel.findOne({ phone }).lean()` |
| Q-06 | `createLead(input)` | `CrmLeadModel.create(input)` |
| Q-07 | `updateLead(id, body)` | `CrmLeadModel.findByIdAndUpdate(id, {...body, updatedAt}, {new:true})` |
| Q-08 | `deleteLead(id)` | `CrmLeadModel.findByIdAndDelete(id)` |
| Q-09 | `addActivityToLead(id, input)` | `CrmLeadModel.findByIdAndUpdate(id, {$push, $set lastContactedAt}, {new:true})` |

---

## Controller Inventory

| Handler | Method | Path | Service Call | Success Code |
|---|---|---|---|---|
| `listLeads` | GET | `/api/crm/leads` | `service.listLeads(filters)` | 200 |
| `getStats` | GET | `/api/crm/stats` | `service.getStats()` | 200 |
| `importLeads` | POST | `/api/crm/leads/import` | `service.importLeads(rows, user)` | 200 |
| `createLead` | POST | `/api/crm/leads` | `service.createLead(body, user)` | 201 |
| `updateLead` | PATCH | `/api/crm/leads/:id` | `service.updateLead(id, body)` | 200 |
| `deleteLead` | DELETE | `/api/crm/leads/:id` | `service.deleteLead(id, user)` | 200 `{ok:true}` |
| `addActivity` | POST | `/api/crm/leads/:id/activity` | `service.addActivity(id, body, user)` | 200 |

---

## Domain Dependency Diagram

```
server/index.ts
    └── server/domains/crm/index.ts       (barrel)
            └── routes.ts                 (Express routing + auth guard)
                    └── controller.ts     (req → service → res)
                            └── service.ts (orchestration)
                                ├── domain.ts     (business rules — pure)
                                ├── repository.ts (Mongoose queries)
                                └── mapper.ts     (response shaping)

server/models/crm.ts                      (unchanged — CrmLeadModel)
```

---

## Mapper Strategy

The `CrmLeadModel` uses a Mongoose `toJSON` transform that adds `id` from `_id`
and maps `activities[].id`. The list endpoint uses `.lean()` which bypasses this
transform. To preserve 100% response identity:

- `toLeadListResponse()` — pass-through (lean results, no transform)
- `toLeadResponse()` — pass-through (Mongoose doc, toJSON applies on `res.json()`)
- `toStatsResponse()` — explicit mapping (aggregation result → CrmStats shape)

Future migration (008+) will replace pass-throughs with explicit DTO construction.

---

## Compatibility Strategy

- Legacy `server/crm.ts` is **untouched and still present** on disk.
- The only change is the import path in `server/index.ts` (1 line).
- The new `registerCrmRoutes()` function is a drop-in replacement — identical
  function signature, identical route surface, identical response shapes.
- The `CrmLeadModel` and `server/models/crm.ts` are completely unchanged.
- No collection names changed. No indexes changed. No schema changes.

---

## Rollback Strategy

Revert the single changed line in `server/index.ts`:

```diff
- import { registerCrmRoutes } from "./domains/crm";
+ import { registerCrmRoutes } from "./crm";
```

The entire `server/domains/crm/` directory can then be deleted at any time.
No database migration needed. No client changes needed.

---

## Verification

### Behavioral identity checks

| Check | Result |
|---|---|
| `GET /api/crm/leads` — lean array, same filter logic | ✅ Identical |
| `GET /api/crm/stats` — `{total, stages, totalValue}` shape | ✅ Identical |
| `POST /api/crm/leads` — 201 + Mongoose doc, same defaults | ✅ Identical |
| `PATCH /api/crm/leads/:id` — 404 on missing, `{new:true}` | ✅ Identical |
| `POST /api/crm/leads/import` — Arabic aliases, dedup by phone | ✅ Identical |
| `DELETE /api/crm/leads/:id` — 403 role check, `{ok:true}` | ✅ Identical |
| `POST /api/crm/leads/:id/activity` — $push + lastContactedAt | ✅ Identical |
| Auth guard — 401 unauthenticated, 403 wrong role | ✅ Identical |

### Application health

| Check | Result |
|---|---|
| No runtime behavior changed | ✅ |
| No APIs changed | ✅ |
| No database queries changed | ✅ |
| No business logic changed | ✅ |
| No production code modified (beyond import path) | ✅ |
| Application starts successfully | ✅ All services connected, port 5000 |
| CRM behaves exactly as before | ✅ |
| No regressions detected | ✅ |

---

## Infrastructure Built So Far

| Migration | Layer | Status |
|---|---|---|
| 002 | Shared Utilities (`server/utils.ts`) | ✅ Complete |
| 003 | Error System (`server/errors/`) | ✅ Complete |
| 004 | Logging Foundation (`server/logger/`) | ✅ Complete |
| 005 | Configuration Foundation (`server/config/`) | ✅ Complete |
| 006 | Validation Foundation (`server/validation/`) | ✅ Complete |
| 007 | CRM Domain (`server/domains/crm/`) | ✅ Complete |
