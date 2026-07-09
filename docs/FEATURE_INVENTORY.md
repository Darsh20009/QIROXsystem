# FEATURE_INVENTORY.md — QIROX Complete Feature Inventory

> **Mode:** Blueprint only. No code modified.
> **Date:** 2026-07-08

---

## Legend

| Field | Values |
|---|---|
| Status | ✅ Live / ⚠️ Partial / ❌ Broken / 🔧 Config needed |
| Keep? | Yes / Review / Deprecate |
| Action | Keep As-Is / Refactor / Rewrite |
| Complexity | Low / Medium / High |

---

## 1. Authentication & Identity

| Feature | Status | Dependencies | Technical Debt | Priority | Keep? | Action | Complexity |
|---|---|---|---|---|---|---|---|
| Username/password login | ✅ | Passport.js, bcrypt, session | Hardcoded secret fallback (SEC-CRIT-001) | P0 | Yes | Refactor | Low |
| Session management | ✅ | express-session, connect-mongo | No startup guard on SESSION_SECRET | P0 | Yes | Refactor | Low |
| Registration | ✅ | UserModel, email OTP | No password complexity enforcement | P1 | Yes | Refactor | Low |
| Email verification | ✅ | OtpModel, sendEmail | OTP stored in DB without expiry index | P1 | Yes | Refactor | Low |
| Password reset | ✅ | OtpModel, sendEmail | No reset token expiry guarantee | P1 | Yes | Refactor | Low |
| Google OAuth | ⚠️ | passport-google-oauth20 | GOOGLE_CLIENT_ID/SECRET not set | P2 | Yes | Config needed | Low |
| GitHub OAuth | ⚠️ | passport-github2 | GITHUB_CLIENT_ID/SECRET not set | P2 | Yes | Config needed | Low |
| Apple Sign-In | ⚠️ | Custom Apple callback | iOS only, not fully audited | P2 | Yes | Audit | Medium |
| 2FA (TOTP) | ✅ | speakeasy | Not enforced for admin/accountant | P1 | Yes | Refactor | Medium |
| WebAuthn / Passkey | ✅ | @simplewebauthn | Not audited end-to-end | P2 | Yes | Audit | Medium |
| Biometric (Face ID) | ✅ | FaceRecognitionModal | Not audited, mobile-only | P2 | Review | Audit | High |
| QR Login | ✅ | QrLoginScanner | Not audited | P3 | Review | Audit | Medium |
| Quick PIN | ✅ | QuickPinButton | Security not audited | P2 | Review | Audit | Medium |
| Phone verification | ✅ | PhoneVerify, SMS OTP | SMS provider not audited | P2 | Yes | Refactor | Medium |
| QIROX Authenticator | ✅ | QiroxAuthenticator | Proprietary TOTP app | P3 | Yes | Keep | Low |

---

## 2. Admin Panel

| Feature | Status | Dependencies | Technical Debt | Priority | Keep? | Action | Complexity |
|---|---|---|---|---|---|---|---|
| Admin dashboard / analytics | ✅ | AdminAnalytics, MongoDB aggregation | No caching on heavy aggregations | P1 | Yes | Refactor | Medium |
| User management | ✅ | UserModel, AdminEmployees | Role changes not logged to ActivityLog | P1 | Yes | Refactor | Low |
| Employee HR portal | ✅ | EmployeeProfileModel | No audit trail on record edits | P1 | Yes | Refactor | Medium |
| Payroll management | ✅ | PayrollRecordModel, AdminPayroll | No soft delete on payroll records | P1 | Yes | Refactor | Medium |
| Finance / journal | ✅ | AdminFinance | No double-entry validation | P1 | Yes | Refactor | High |
| Invoice management | ✅ | InvoiceModel | No PDF generation status tracking | P1 | Yes | Refactor | Medium |
| Order management | ✅ | OrderModel | 710 routes, no rate limiting | P0 | Yes | Refactor | Medium |
| Subscription plans | ✅ | PricingPlanModel | Plan changes don't notify clients | P2 | Yes | Refactor | Low |
| Contracts | ✅ | ContractModel | E-signature not audited | P2 | Yes | Refactor | High |
| CRM (contacts/leads) | ✅ | EmployeeCRM, LeadModel | No pipeline automation | P2 | Yes | Refactor | Medium |
| Support tickets / SLA | ✅ | SupportTicketModel | SLA breach auto-escalation not audited | P2 | Yes | Refactor | Medium |
| Email marketing | ✅ | EmailCampaignModel, email-marketing.ts | No delivery/open tracking | P2 | Yes | Refactor | Medium |
| Push notifications | ⚠️ | web-push, VAPID | VAPID keys not set | P1 | Yes | Config needed | Low |
| Cron jobs | ✅ | CronJobModel, node-cron | No failure alerting | P2 | Yes | Refactor | Medium |
| System settings (live) | ✅ | QiroxSystemSettingsModel | Live DB switching via regex (ARCH-004) | P1 | Yes | Refactor | High |
| MongoDB Atlas admin | ✅ | atlas.ts | Direct Atlas API exposure to admin UI | P2 | Review | Audit | Medium |
| Connection settings | ✅ | connection-manager.ts | URI regex manipulation (ARCH-004) | P1 | Yes | Refactor | Medium |
| Activity log | ✅ | ActivityLogModel | Not all actions logged | P2 | Yes | Refactor | Low |
| Pixel tracking | ✅ | PixelTracking component | IDs in DB, public API exposes them | P2 | Yes | Keep | Low |
| Discount codes | ✅ | DiscountCodeModel | No usage cap enforcement audited | P2 | Yes | Refactor | Low |
| Gamification | ✅ | AdminGamification | Points economy not audited | P3 | Review | Audit | Medium |
| Roles (RBAC) | ✅ | AdminRoles | Not centralized (per-route manual) | P0 | Yes | Rewrite | High |
| App publishing | ✅ | AdminAppPublish | iOS cert in repo (APPLE-001) | P0 | Yes | Fix security | High |
| QMeet admin | ✅ | QMeetingModel | Separate DB management | P2 | Yes | Refactor | Medium |
| Referrals | ✅ | ReferralModel | Fraud prevention not audited | P2 | Yes | Audit | Medium |
| Reviews | ✅ | ReviewModel | Moderation workflow not audited | P3 | Review | Audit | Low |
| Data requests (GDPR) | ✅ | DataRequestModel | Partial — export not automated | P2 | Yes | Refactor | Medium |

---

## 3. Client Portal

| Feature | Status | Dependencies | Technical Debt | Priority | Keep? | Action | Complexity |
|---|---|---|---|---|---|---|---|
| Client onboarding | ✅ | ClientOnboarding | No progress tracking in DB | P1 | Yes | Refactor | Medium |
| Order creation / tracking | ✅ | OrderModel | Multiple payment methods, complex flow | P1 | Yes | Refactor | Medium |
| Invoice viewing / download | ✅ | InvoiceModel, pdf.ts | PDF generation not cached | P2 | Yes | Refactor | Low |
| Installment plans | ✅ | InstallmentModel | Late penalty automation not fully tested | P2 | Yes | Audit | Medium |
| Internal wallet | ✅ | WalletModel | No MongoDB transaction isolation (atomic) | P1 | Yes | Refactor | High |
| PayPal wallet top-up | ⚠️ | paypal.ts | IAP compliance risk on iOS (APPLE-005) | P1 | Review | Audit | Medium |
| Loyalty points | ✅ | LoyaltyModel | Points expiry not implemented | P3 | Yes | Refactor | Low |
| Referral program | ✅ | ReferralModel | Fraud prevention not audited | P2 | Yes | Audit | Medium |
| Contract signing | ✅ | ContractModel | E-signature legality not confirmed | P2 | Yes | Audit | High |
| Support tickets | ✅ | SupportTicketModel | File attachments stored locally | P1 | Yes | Refactor | Low |
| SLA tracking | ✅ | SLAModel | Breach notification not audited | P2 | Yes | Audit | Medium |
| Shipment tracking | ✅ | ShipmentModel | 3rd party carrier integration not audited | P3 | Review | Audit | Medium |
| Profile management | ✅ | UserModel | Photo stored locally | P2 | Yes | Refactor | Low |
| QMeet (video meetings) | ✅ | QMeet routes | WebRTC on iOS not tested | P1 | Yes | Audit | High |
| Client group chat | ✅ | ClientsGroup | WebSocket not audited | P2 | Yes | Audit | Medium |
| Quotations | ✅ | QuotationModel | PDF not cached | P3 | Yes | Refactor | Low |
| E-commerce store | ✅ | ProductModel, CartModel | Inventory management not audited | P2 | Yes | Refactor | High |

---

## 4. Employee Portal

| Feature | Status | Dependencies | Technical Debt | Priority | Keep? | Action | Complexity |
|---|---|---|---|---|---|---|---|
| Employee dashboard | ✅ | EmployeeRoleDashboard | Role-specific dashboards not uniform | P2 | Yes | Refactor | Medium |
| Project management (Kanban) | ✅ | ProjectModel, TaskModel | No WS real-time on task updates | P2 | Yes | Refactor | Medium |
| Project workspace | ✅ | ProjectWorkspace | Large component, not audited | P2 | Yes | Audit | Medium |
| Attendance (GPS/IP) | ✅ | AttendanceModel | GPS accuracy not validated | P2 | Yes | Audit | Medium |
| Time tracking | ✅ | TimeTracker component | No conflict detection | P3 | Yes | Refactor | Low |
| CRM (leads/contacts) | ✅ | LeadModel, EmployeeCRM | No pipeline stage automation | P2 | Yes | Refactor | Medium |
| WhatsApp CRM | ✅ | wa.me links | iframe blocked (wa.me only) | P2 | Yes | Keep | Low |
| IMAP mail | ✅ | mail-imap.ts | Credentials stored in DB (encrypted?) | P1 | Yes | Audit | Medium |
| Group messaging | ✅ | GroupModel, MessageModel | WebSocket delivery not confirmed | P2 | Yes | Audit | Medium |
| AI Studio (chat) | ✅ | ai.ts, QiroxStudio | 30+ `any` types, injection risk | P0 | Yes | Refactor | High |
| Document AI Composer | ✅ | DocumentAiComposer | SSE cleanup not audited | P2 | Yes | Audit | Medium |
| Employee finance | ✅ | EmployeeMyFinance | Salary view only | P3 | Yes | Keep | Low |
| New order entry | ✅ | EmployeeNewOrder | Manual, no automation | P3 | Yes | Keep | Low |
| Demos management | ✅ | EmployeeDemos | Local file storage | P3 | Yes | Refactor | Low |
| DeploymentCloud | ✅ | deployment-cloud.ts | GitHub OAuth token in UserModel | P2 | Yes | Audit | Medium |
| Sales/marketing tools | ✅ | SalesMarketing | Not fully audited | P3 | Review | Audit | Medium |
| Barcode studio | ✅ | BarcodeStudio | Client-side generation | P3 | Yes | Keep | Low |
| Posters | ✅ | Posters | Canvas-based image generation | P3 | Yes | Keep | Low |
| Dev checklist | ✅ | DevChecklist | Internal tool | P3 | Yes | Keep | Low |

---

## 5. AI Features

| Feature | Status | Dependencies | Technical Debt | Priority | Keep? | Action | Complexity |
|---|---|---|---|---|---|---|---|
| AI chat (streaming SSE) | ✅ | OpenAI / Kimi, ai.ts | 30+ `any` types, SSE cleanup | P0 | Yes | Refactor | High |
| AI tool executor (DB ops) | ✅ | All Mongoose models | NoSQL injection risk (SEC-HIGH-001) | P0 | Yes | Rewrite | High |
| Image generation | ✅ | Flux API, Arabic→EN translation | No content moderation | P2 | Yes | Refactor | Medium |
| Video generation | ✅ | External video API proxy | No content moderation | P3 | Yes | Refactor | Medium |
| Document composer | ✅ | GPT-4o | Prompt injection not mitigated | P2 | Yes | Refactor | Medium |
| QMeet AI summary | ✅ | OpenAI, Arabic prompts | No token limit handling | P2 | Yes | Refactor | Low |
| AI session history | ✅ | AISessionModel | No pagination on history queries | P2 | Yes | Refactor | Low |

---

## 6. Communication

| Feature | Status | Dependencies | Technical Debt | Priority | Keep? | Action | Complexity |
|---|---|---|---|---|---|---|---|
| QMeet (WebRTC video) | ✅ | qmeet.ts, separate DB | iOS WebRTC not tested | P1 | Yes | Audit | High |
| Internal WebSocket hub | ✅ | ws.ts | No reconnect handling on client | P1 | Yes | Refactor | Medium |
| IMAP mail reader | ✅ | mail-imap.ts | Credentials security not audited | P1 | Yes | Audit | Medium |
| Email sending (cPanel SMTP) | ✅ | email.ts, nodemailer | No retry / bounce handling | P1 | Yes | Refactor | Medium |
| Email marketing campaigns | ✅ | email-marketing.ts | No open/click tracking | P2 | Yes | Refactor | Medium |
| WhatsApp CRM (wa.me) | ✅ | wa.me links | Template-only, no API integration | P3 | Review | Keep | Low |
| Push notifications (VAPID) | ⚠️ | web-push | VAPID keys not set | P1 | Yes | Config needed | Low |
| In-app notifications | ✅ | NotificationModel, WS | No read receipts | P2 | Yes | Refactor | Low |
| Group chat | ✅ | GroupModel, MessageModel | No encryption | P2 | Yes | Refactor | Medium |
| CS Chat | ✅ | CsSessionModel | Live agent assignment not audited | P2 | Yes | Audit | Medium |

---

## 7. Payments & Finance

| Feature | Status | Dependencies | Technical Debt | Priority | Keep? | Action | Complexity |
|---|---|---|---|---|---|---|---|
| Bank transfer (manual) | ✅ | OrderModel, file upload | Files stored locally | P1 | Yes | Refactor | Low |
| PayPal (SDK v2) | ✅ | @paypal/paypal-server-sdk | IAP risk on iOS | P1 | Yes | Audit | Medium |
| Internal wallet | ✅ | WalletModel | No atomic transaction isolation | P1 | Yes | Refactor | High |
| Installment plans | ✅ | InstallmentModel | Late payment penalty cron not tested | P2 | Yes | Audit | Medium |
| Invoice generation (PDF) | ✅ | pdf-lib, InvoiceModel | Not cached, generated on every request | P2 | Yes | Refactor | Medium |
| Receipt vouchers | ✅ | ReceiptVoucherModel | Not audited | P3 | Yes | Audit | Low |
| Profit reports | ✅ | AdminProfitReport | No caching on aggregations | P2 | Yes | Refactor | Medium |
| Payroll | ✅ | PayrollRecordModel | Manual process, no automation | P2 | Yes | Refactor | High |
| Journal entries | ✅ | AdminFinance | No double-entry enforcement | P2 | Review | Rewrite | High |
| Paymob onboarding | ⚠️ | PaymobOnboarding | Config only, not integrated | P3 | Review | Audit | High |

---

## 8. Developer / Sandbox Features

| Feature | Status | Dependencies | Technical Debt | Priority | Keep? | Action | Complexity |
|---|---|---|---|---|---|---|---|
| Sandbox IDE (Monaco) | ✅ | Monaco Editor, sandbox-routes.ts | exec() injection risk (SEC-CRIT-002) | P0 | Yes | Refactor | High |
| Sandbox process runner | ✅ | sandbox-runner.ts, spawn | Zombie process risk | P2 | Yes | Refactor | Medium |
| System builder (UI-based) | ✅ | SystemBuilder | Not audited | P3 | Yes | Audit | High |
| DeploymentCloud | ✅ | deployment-cloud.ts | GitHub token in UserModel | P2 | Yes | Audit | Medium |
| External API keys | ✅ | ClientApiKeyModel | Usage tracking silent failure | P2 | Yes | Refactor | Low |
| My API Keys | ✅ | MyApiKeys | Rate limiting on key auth not audited | P2 | Yes | Audit | Medium |
| HTML publish tool | ✅ | tools/html-publish | Stored locally | P3 | Review | Audit | Low |
| URL shortener | ✅ | tools/url-shorten | No analytics | P3 | Review | Keep | Low |

---

## 9. Infrastructure Features

| Feature | Status | Dependencies | Technical Debt | Priority | Keep? | Action | Complexity |
|---|---|---|---|---|---|---|---|
| Connection manager (live DB switch) | ✅ | connection-manager.ts | Regex URI manipulation (ARCH-004) | P1 | Yes | Refactor | High |
| cPanel integration | ✅ | cpanel.ts | Admin API exposed directly | P2 | Yes | Audit | Medium |
| MongoDB Atlas API | ✅ | atlas.ts | Admin API in UI | P2 | Review | Audit | Medium |
| SEO (static index.html) | ✅ | index.html | No SSR, dynamic pages unindexed | P1 | Yes | Upgrade | High |
| Sitemap | ✅ | /sitemap.xml (static + server) | Dynamic content not in sitemap | P1 | Yes | Refactor | Low |
| robots.txt | ✅ | client/public/ | Coverage not audited | P2 | Yes | Audit | Low |
| Service worker / PWA | ✅ | capacitor-init.ts | Cache strategy not audited | P2 | Yes | Audit | Medium |
| Analytics pixels | ✅ | PixelTracking | IDs from DB, works correctly | P2 | Yes | Keep | Low |
| SMTP2GO fallback | ⚠️ | SMTP2GO_API_KEY | Not set, email may fail | P1 | Yes | Config needed | Low |
