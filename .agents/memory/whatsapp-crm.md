---
name: WhatsApp CRM page
description: WhatsApp CRM panel at /employee/whatsapp-crm — wa.me links only (no API), with message templates and client list.
---

## What was built
- Page: `client/src/pages/EmployeeWhatsappCRM.tsx`
- Route: `/employee/whatsapp-crm` registered in `client/src/App.tsx`
- Nav ID: `whatsapp_crm` added to `ALL_NAV` in `EmployeeLayout.tsx`
- Added to roles: admin, manager, sales, sales_manager, marketing in `ROLE_ITEMS`
- Also added to `ALL_SYSTEM_PAGES` in `AdminEmployees.tsx` for per-employee permission control

## Technical approach
- Uses wa.me links (not WhatsApp Business API) — WhatsApp Web iframe embedding is browser-blocked
- Phone normalization: Saudi 05xxx → 9665xxx, Egypt 01xxx → 201xxx
- 6 built-in message templates (editable in-place), custom message mode
- {name} variable replaced with client's fullName at send time
- Sent timestamp logged per-client in local state (resets on page reload)

**Why wa.me and not iframe:** WhatsApp Web sends `X-Frame-Options: SAMEORIGIN` — no browser allows embedding it in an iframe from another origin. This is a browser-enforced security restriction, not a code issue.
