# RBAC_DESIGN.md — QIROX Enterprise Role-Based Access Control Design

> **Mode:** Blueprint only. Design only. No code implemented.
> **Date:** 2026-07-08

---

## 1. Design Objectives

1. **Centralized** — all permission logic in one place, not scattered across 710 route handlers
2. **Declarative** — permissions described in data, not in code
3. **Extensible** — custom roles and custom permissions creatable at runtime without code changes
4. **Auditable** — every permission check is logged with actor, resource, action, and result
5. **Hierarchical** — roles inherit from parent roles (admin inherits all)
6. **Scoped** — permissions can be scoped to a resource instance (e.g., manage only your own project)

---

## 2. Core Concepts

```
Subject (User)
  └── has Role(s)
        └── Role has Permissions
              └── Permission = { resource, action, scope? }

Resource: the entity being acted on (order, invoice, user, etc.)
Action:   what is being done (read, create, update, delete, approve, etc.)
Scope:    optional constraint (own | team | all)
```

---

## 3. Role Hierarchy

```
SUPER_ADMIN (future — platform-level)
  └── admin
        ├── manager
        │     ├── accountant
        │     ├── sales
        │     ├── developer
        │     ├── designer
        │     └── support
        │
        ├── merchant (external — independent branch)
        ├── client  (external — independent branch)
        ├── supplier (external — independent branch)
        └── investor (external — independent branch)
```

**Inheritance rules:**
- `admin` inherits all permissions of all roles below it
- `manager` inherits all employee role permissions
- External roles (client, merchant, supplier, investor) are isolated — no inheritance from internal roles

---

## 4. System Roles (Current 11)

| Role ID | Display Name | Arabic | Type | Description |
|---|---|---|---|---|
| `admin` | Administrator | مدير النظام | Internal | Full platform access |
| `manager` | Manager | مدير | Internal | Team + operational management |
| `accountant` | Accountant | محاسب | Internal | Finance, invoices, payroll |
| `sales` | Sales | مبيعات | Internal | CRM, leads, quotations |
| `developer` | Developer | مطور | Internal | Sandbox, deployment, API keys |
| `designer` | Designer | مصمم | Internal | Design tools, AI, templates |
| `support` | Support | دعم | Internal | Tickets, SLA, client communication |
| `client` | Client | عميل | External | Client portal access |
| `merchant` | Merchant | تاجر | External | Store management |
| `supplier` | Supplier | مورد | External | Supplier portal |
| `investor` | Investor | مستثمر | External | Investor dashboard |

---

## 5. Resource & Action Definitions

### Resources
```
auth            user_management       project         task
order           invoice               installment     wallet
payroll         attendance            crm_lead        crm_contact
support_ticket  contract              shipment        product
news            job                   partner         ai_session
sandbox         deployment            qmeet           email_campaign
notification    api_key               system_setting  role_management
analytics       activity_log          push_broadcast  pixel_setting
```

### Actions
```
read            create          update          delete
approve         reject          assign          export
broadcast       import          archive         restore
execute         configure       audit_view
```

---

## 6. Permission Matrix

> Legend: ✅ Full | 🔒 Own only | 👥 Team scope | ❌ None | 📖 Read only

| Resource | admin | manager | accountant | sales | developer | designer | support | client | merchant | supplier | investor |
|---|---|---|---|---|---|---|---|---|---|---|---|
| user_management | ✅ | 👥 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| role_management | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| system_setting | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| analytics | ✅ | 📖 | 📖 | 🔒 | ❌ | ❌ | ❌ | ❌ | 🔒 | ❌ | 🔒 |
| activity_log | ✅ | 📖 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| order | ✅ | ✅ | 📖 | ✅ | ❌ | ❌ | 📖 | 🔒 | 🔒 | ❌ | ❌ |
| invoice | ✅ | ✅ | ✅ | 📖 | ❌ | ❌ | ❌ | 🔒📖 | 🔒📖 | ❌ | 📖 |
| payroll | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| attendance | ✅ | ✅ | 📖 | 🔒 | 🔒 | 🔒 | 🔒 | ❌ | ❌ | ❌ | ❌ |
| project | ✅ | ✅ | ❌ | 👥 | 👥 | 👥 | 👥 | 🔒📖 | ❌ | ❌ | ❌ |
| task | ✅ | ✅ | ❌ | 🔒 | 🔒 | 🔒 | 🔒 | ❌ | ❌ | ❌ | ❌ |
| crm_lead | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | 📖 | ❌ | ❌ | ❌ | ❌ |
| crm_contact | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| support_ticket | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | 🔒 | 🔒 | 🔒 | 🔒 |
| contract | ✅ | ✅ | 📖 | 📖 | ❌ | ❌ | ❌ | 🔒📖 | 🔒📖 | 🔒📖 | 🔒📖 |
| wallet | ✅ | 📖 | ✅ | ❌ | ❌ | ❌ | ❌ | 🔒 | 🔒 | ❌ | ❌ |
| installment | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | 🔒📖 | ❌ | ❌ | ❌ |
| product | ✅ | ✅ | 📖 | 📖 | ❌ | ✅ | ❌ | 📖 | ✅ | ❌ | ❌ |
| shipment | ✅ | ✅ | 📖 | 📖 | ❌ | ❌ | ✅ | 🔒📖 | 🔒 | 🔒 | ❌ |
| ai_session | ✅ | 🔒 | ❌ | 🔒 | 🔒 | 🔒 | ❌ | ❌ | ❌ | ❌ | ❌ |
| sandbox | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| deployment | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| qmeet | ✅ | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | ❌ | ❌ | ❌ |
| email_campaign | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| push_broadcast | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| news | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 📖 | 📖 | 📖 | 📖 |
| job | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | 📖 | 📖 | 📖 | 📖 |
| api_key | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | 🔒 | ❌ | ❌ | ❌ |
| pixel_setting | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 7. Custom Permissions Design

Future support for runtime-defined permissions without code changes:

```typescript
// Data model for custom permissions (design — not implemented)
interface CustomPermission {
  id: string;
  name: string;           // "manage_invoices"
  nameAr: string;         // "إدارة الفواتير"
  resource: string;       // "invoice"
  actions: string[];      // ["read", "create", "update"]
  scope: "own" | "team" | "all";
  description: string;
}

interface CustomRole {
  id: string;
  name: string;
  parentRole?: string;    // inherits from
  permissions: string[];  // CustomPermission IDs
  createdBy: string;
}

// Applied at route level via:
// requirePermission("invoice", "create")
// requirePermission("order", "approve", "own")
```

---

## 8. Middleware Design

```typescript
// middleware/require-role.ts (design — not implemented)
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHENTICATED" } });
    }
    if (!roles.includes(req.user.role)) {
      auditLog(req, "PERMISSION_DENIED", { required: roles, actual: req.user.role });
      return res.status(403).json({ success: false, error: { code: "FORBIDDEN" } });
    }
    next();
  };
}

// Usage in routes:
// router.get("/admin/users", requireRole("admin", "manager"), handler);
// router.post("/admin/payroll", requireRole("admin", "accountant"), handler);
```

---

## 9. Permission Audit Log Design

Every permission check (pass or fail) should be logged:

```typescript
interface PermissionAuditEntry {
  timestamp: Date;
  userId: string;
  userRole: string;
  action: string;           // HTTP method + path
  resource: string;
  resourceId?: string;
  result: "granted" | "denied";
  ipAddress: string;
  userAgent: string;
}
```

Retention: 90 days. Query by userId, resource, date range.

---

## 10. Session Permission Caching

To avoid DB lookups on every request:
- User role is embedded in the session (already done via Passport.js serialize)
- Custom permissions (future) should be cached in session with a `permissionsVersion` field
- When an admin changes a user's role, invalidate their session via `invalidateUserCache()` (already exists in `server/auth.ts`)

---

## 11. 2FA Enforcement Plan

| Role | 2FA Required | Enforcement |
|---|---|---|
| admin | **Yes — mandatory** | Block all routes until 2FA verified |
| accountant | **Yes — mandatory** | Block financial routes until 2FA verified |
| manager | Recommended | Prompt but not block |
| All others | Optional | User-controlled |

Implementation: Add `req.user.twoFactorVerified` flag to session. Clear on logout. Require it on all admin/accountant routes via middleware.
