---
name: Nav Items Coverage
description: ALL_NAV in EmployeeLayout.tsx now covers all admin pages; ROLE_ITEMS updated for admin/manager.
---

## Rule
EmployeeLayout.tsx ALL_NAV was substantially expanded. When adding new admin pages, always add them to BOTH ALL_NAV AND the relevant ROLE_ITEMS arrays.

**Why:** Many pages existed as routes but were invisible from the sidebar because they weren't in ALL_NAV.

**How to apply:**
- ALL_NAV now has ~70 entries grouped by: main, finance, hr, tools, config, personal.
- ROLE_ITEMS["admin"] and ROLE_ITEMS["manager"] are the largest and cover almost everything.
- Accountant gets full finance access (wallet, installments, profit_report, sales_reports, bank_settings).
- Config-only pages (roles, sys_features, mod_config, api_keys, cron_jobs, atlas_db) are admin-only.
- When adding a new page: add to ALL_NAV first, then add its id to every role that should see it.
