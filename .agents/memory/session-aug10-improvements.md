---
name: Session Aug10 Improvements
description: Comprehensive list of improvements made in Aug 10, 2026 session — SEO, CS Chat, iPad layout, support system, admin stats
---

## EmployeeLayout iPad breakpoint fix
Changed ALL `lg:` (1024px) to `md:` (768px) in the layout shell — sidebar, drawer, main margin, mobile top bar, content padding, bottom nav, MobileMyTasks strip. This makes iPad (768-1023px) show the sidebar instead of the mobile navigation, satisfying Apple Guideline 4.

**Why:** Apple rejected the app because iPad showed a crowded mobile-style nav at 768-1023px. `lg` was too conservative.

**How to apply:** Any new EmployeeLayout structural changes should use `md:` breakpoints, not `lg:`.

## CS Chat agent assignment fix
Changed `role: 'support'` to `role: { $in: ['support', 'admin', 'manager'] }` in POST /api/cs/sessions agent lookup.

**Why:** If no support-role user existed, sessions waited forever even if admin/manager were available.

## CS Chat waiting session broadcast
When a client sends a message to a waiting session (no agent assigned), the server now broadcasts to all support/admin/manager agents via WebSocket + push notification with link `/cs-chat`.

**Fixed:** notification link was `/employee/cs-chat` (non-existent route) — changed to `/cs-chat`.

## CS Chat in employee nav
Added `cs_chat` entry to ALL_NAV and to ROLE_ITEMS for admin, manager, and support roles. Also added to MOBILE_ROLE_ITEMS for support.

## Admin stats — today's revenue
Added `todayRevenue` and `todayOrders` to `/api/admin/stats` response. Dashboard statItems now shows "إيرادات اليوم" as a prominent emerald card.

## Support tickets — paginated API
Changed GET /api/support-tickets to return `{ tickets, total, page, pages }` with optional `?status=` and `?search=` query params. Both AdminSupportTickets and SupportTickets handle backward compat (flat array or paginated object).

## AdminSupportTickets reply bug fix
Reply button was hardcoding `status: "resolved"` on every reply. Fixed to use `ticket.status` (current status) — so replying doesn't auto-close the ticket.

## SupportTickets client polling
Added `refetchInterval: 30000` so client sees admin replies without manual reload.

## Support ticket 404 fix
Added `if (!ticket) return res.status(404)` before logging/notifications in PATCH /api/admin/support-tickets/:id.

## Public contact details — dynamic
- PublicSupport.tsx: fetches `/api/public/settings` for WhatsApp number and email, no more hardcoded values
- Contact.tsx: uses `publicSettings?.contactEmail` with fallback instead of hardcoded `info@qirox.online`
- Both files are the ground-truth source for these values

## Push broadcast security
Changed POST /api/admin/push/broadcast from "any non-client" to "admin/manager only".

## CS Chat client photo
Added `profilePhotoUrl avatarConfig` to `populateSession` UserModel select, so agent session list can show client avatars.

## WebSocket exponential backoff
useInboxSocket.ts reconnect now uses `min(3000 * 2^attempt, 30000)` instead of fixed 3000ms.

## Contact form validation fix
Server /api/contact now trims before checking required fields (prevents whitespace-only bypass). Phone is optional (removed from required check).

## Navigation + Footer — Support link
Added `/support` link to NavigationLegacy.tsx, NavigationDSV2.tsx, and FooterLegacy.tsx.

## Client dashboard improvements
- Added "متجري" (My Store) quick action card linking to `/my-store` — 6 cards total
- Client wallet section: "يوجد رصيد مستحق" now has a "Pay Now" button linking to `/wallet`
- Dashboard workflow guide: changed `md:grid-cols-5` to `sm:grid-cols-3 lg:grid-cols-5` (iPad fix)
- min-w-[400px] timeline block changed to `min-w-[min(400px,100%)]`

## ClientMyStore — breadcrumb
Added `StoreBreadcrumb` component showing "الرئيسية → متجري" navigation at top of both empty and existing store views.

## ClientStores "clients without stores" filter
Fixed server GET /api/admin/client-stores/clients to actually filter `{ _id: { $nin: existingClientIds } }` — previously it gathered existingClientIds but never used them.

## Employee dashboard localization
Pending orders banner now uses `lang` variable for Arabic/English text.

## Mohammed Al-Dabbani CEO profile
New complete profile page at /mohammed-aldabbani with:
- Person + ProfilePage + FAQPage JSON-LD schemas
- Saudi nationality, CEO + Co-Founder role
- Real photo from attached_assets/
- Bilingual biography + FAQ
- Linked in Organization schema as founder[0]
- Sitemap priority 0.95, weekly changefreq
