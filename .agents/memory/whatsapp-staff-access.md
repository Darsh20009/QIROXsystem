---
name: WhatsApp staff access
description: Role boundary between WhatsApp connection administration and employee CRM usage.
---

WhatsApp API connection, QR pairing, chat controls, and configuration are restricted to administrators and managers. All staff roles can use the operational WhatsApp CRM to contact clients.

**Why:** QR pairing and API configuration can change the connected business account and expose operational controls. Employees need messaging capability but not connection administration.

**How to apply:** Keep `/admin/whatsapp` and its `/api/admin/whatsapp/*` routes restricted to `admin` and `manager`. Give staff the `/employee/whatsapp-crm` path and only contact-directory data needed for their CRM work.