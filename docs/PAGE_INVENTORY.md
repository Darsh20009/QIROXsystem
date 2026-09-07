# PAGE_INVENTORY.md — QIROX Complete Page Inventory

> **Mode:** Blueprint only. No code modified.
> **Date:** 2026-07-08
> **Total pages found:** 154 `.tsx` + 2 `.ts` data files = 156 files in `client/src/pages/`

---

## Legend

| Field | Description |
|---|---|
| Role | Target user role |
| UX Issues | Known UX problems |
| SEO Issues | SEO/crawlability problems |
| Perf Issues | Performance concerns |
| A11y Issues | Accessibility concerns |
| Recommendation | Action to take |

---

## 1. Public Pages (Marketing)

| Page | File | Role | Purpose | UX Issues | SEO Issues | Perf Issues | A11y Issues | Recommendation |
|---|---|---|---|---|---|---|---|---|
| Home | `Home.tsx` | Public | Landing page, hero, features, CTA | No skeleton on load | Static HTML tags only; body content JS-rendered | Heavy Framer Motion animations | ARIA labels on CTA buttons not audited | Add prerender; audit a11y |
| About | `About.tsx` | Public | Company story, team, certifications | Unknown | useSEO applied | Unknown | Unknown | Audit a11y |
| Prices | `Prices.tsx` | Public | Pricing plans, comparison | No plan comparison UX | useSEO applied; no structured Offer schema | Unknown | Unknown | Add Offer JSON-LD |
| Systems | `Systems.tsx` | Public | System/template catalog | No filter/search state | useSEO; individual system pages not indexed | Renders all systems — no pagination | Unknown | Add pagination; per-system meta |
| News | `News.tsx` | Public | Blog / news list | No infinite scroll | useSEO; individual articles not indexed | All articles rendered | Unknown | Add Article JSON-LD; paginate |
| Partners | `Partners.tsx` | Public | Partner logos & descriptions | Unknown | useSEO applied | Unknown | Alt text on logos? | Audit image alt text |
| Jobs | `Jobs.tsx` | Public | Job listings | No filter by type/location | useSEO applied; no JobPosting schema | Unknown | Unknown | Add JobPosting JSON-LD |
| JoinUs | `JoinUs.tsx` | Public | Team application form | Form feedback not audited | useSEO applied | Unknown | Form labels not audited | Audit form a11y |
| Contact | `Contact.tsx` | Public | Contact form, map, channels | Success/error state not audited | useSEO applied | Unknown | Form a11y not audited | Audit form a11y |
| Terms | `Terms.tsx` | Public | Terms of service | Long page no anchors | No SEO tags audited | Unknown | Unknown | Add heading anchors |
| Privacy | `Privacy.tsx` | Public | Privacy policy | Long page no anchors | No SEO tags audited | Unknown | Unknown | Add heading anchors |
| Alliances | `Alliances.tsx` | Public | Strategic alliances display | Unknown | No SEO audit | Unknown | Unknown | Add meta tags |
| Demos | `Demos.tsx` | Public | Product demos showcase | Unknown | No SEO audit | Unknown | Unknown | Audit |
| TemplateDetail | `TemplateDetail.tsx` | Public | Individual system template | No breadcrumb | No per-template meta tags | Unknown | Unknown | Add dynamic meta + breadcrumb |
| ServiceDetail | `ServiceDetail.tsx` | Public | Individual service page | No breadcrumb | No per-service meta tags | Unknown | Unknown | Add dynamic meta + breadcrumb |
| SectorGuide | `SectorGuide.tsx` | Public | Industry sector guide | Unknown | No SEO audit | Unknown | Unknown | Audit + add meta |
| OurTools | `OurTools.tsx` | Public | Tools/utilities listing | Unknown | No SEO audit | Unknown | Unknown | Audit |
| Community | `Community.tsx` | Public | Community page | Unknown | No SEO audit | Unknown | Unknown | Audit |

---

## 2. Authentication Pages

| Page | File | Role | Purpose | UX Issues | SEO Issues | Perf Issues | A11y Issues | Recommendation |
|---|---|---|---|---|---|---|---|---|
| Login | `Login.tsx` | All | Username/password login, OAuth | No "show password" toggle audited | Should be noindex | Unknown | Focus management not audited | noindex meta; audit a11y |
| ForgotPassword | `ForgotPassword.tsx` | All | Password reset request | No success state audited | noindex | Unknown | Unknown | Audit flow |
| VerifyEmail | `VerifyEmail.tsx` | All | Email OTP verification | Expiry handling not audited | noindex | Unknown | Unknown | Handle expiry gracefully |
| PhoneVerify | `PhoneVerify.tsx` | All | SMS/phone OTP | No resend cooldown audited | noindex | Unknown | Unknown | Add resend timer |
| TwoFactorSetup | `TwoFactorSetup.tsx` | Employee/Admin | TOTP setup | QR code a11y not audited | noindex | Unknown | QR alt text needed | Add text backup code |
| QiroxAuthenticator | `QiroxAuthenticator.tsx` | All | Proprietary auth app | Unknown | noindex | Unknown | Unknown | Audit |
| InternalGate | `InternalGate.tsx` | Employee | Internal login gate | Unknown | noindex | Unknown | Unknown | Audit |

---

## 3. Admin Pages (68 pages)

> All admin pages: Role = Admin (some accessible to Manager/Accountant). All should be `noindex`. None have confirmed SEO issues since they're authenticated.

| Page | File | Purpose | UX Issues | Perf Issues | Recommendation |
|---|---|---|---|---|---|
| Analytics | `AdminAnalytics.tsx` | KPI dashboard | No loading skeletons audited | Heavy aggregation queries, no caching | Add skeleton + cache |
| Activity Log | `AdminActivityLog.tsx` | Audit trail | No filter by user/action | Unbounded results possible | Add pagination + filters |
| Attendance | `AdminAttendance.tsx` | Employee check-in/out | Date range picker UX not audited | Full collection query possible | Add pagination |
| Bank Settings | `AdminBankSettings.tsx` | Bank account config | Unknown | Unknown | Audit |
| Connection Settings | `AdminConnectionSettings.tsx` | Live DB/SMTP switching | Live switching without confirmation dialog | Regex URI risk on DB switch | Add confirmation dialog |
| Consultation | `AdminConsultation.tsx` | Expert booking management | Unknown | Unknown | Audit |
| Contact Messages | `AdminContactMessages.tsx` | Inbound CRM | No bulk delete | Unknown | Add bulk actions |
| Contracts | `AdminContracts.tsx` | Legal agreements | E-signature flow not audited | Unknown | Audit e-signature |
| Countries | `AdminCountries.tsx` | Regional settings | Unknown | Unknown | Audit |
| Cron Jobs | `AdminCronJobs.tsx` | Scheduled tasks | No failure history shown | Unknown | Add failure log |
| Customers | `AdminCustomers.tsx` | Client management | No bulk operations | Large user list — pagination needed | Add virtual scrolling |
| Data Requests | `AdminDataRequests.tsx` | GDPR compliance | Manual export process | Unknown | Automate export |
| Discount Codes | `AdminDiscountCodes.tsx` | Promotions | No usage stats | Unknown | Add usage analytics |
| Email Guide | `AdminEmailGuide.tsx` | Email documentation | Static content | Unknown | Keep |
| Email Marketing | `AdminEmailMarketing.tsx` | Campaign management | No delivery tracking | Unknown | Add tracking |
| Employees | `AdminEmployees.tsx` | HR portal | Role assignment UX not audited | Large employee list | Add virtual scrolling |
| Extra Addons | `AdminExtraAddons.tsx` | Module management | Unknown | Unknown | Audit |
| Finance | `AdminFinance.tsx` | General ledger | No double-entry validation UX | Heavy aggregation | Add validation + caching |
| Gamification | `AdminGamification.tsx` | Points/rewards | Unknown | Unknown | Audit |
| Installments | `AdminInstallments.tsx` | Payment plans | Penalty calculation not shown | Unknown | Add penalty preview |
| Investors | `AdminInvestors.tsx` | Stakeholder portal | Unknown | Unknown | Audit |
| Invoices | `AdminInvoices.tsx` | Billing | PDF download not cached | PDF regen on every request | Cache PDFs |
| Jobs | `AdminJobs.tsx` | Recruitment | No applicant pipeline view | Unknown | Add Kanban view |
| Kanban | `AdminKanban.tsx` | Internal tasks | No WS real-time updates | Unknown | Add WS |
| Loyalty | `AdminLoyalty.tsx` | Points config | Unknown | Unknown | Audit |
| Mail Accounts | `AdminMailAccounts.tsx` | Email identity management | Credentials stored in DB | Unknown | Audit security |
| Mod Config/Requests | `AdminModConfig/Requests.tsx` | Customization management | Unknown | Unknown | Audit |
| MongoDB Atlas | `AdminMongoAtlas.tsx` | DB admin | Direct Atlas API access | Unknown | Add access restrictions |
| News | `AdminNews.tsx` | Content management | No rich text editor audited | Unknown | Audit editor |
| Orders | `AdminOrders.tsx` | Commerce hub | No bulk status update | Large order list | Add virtual scroll + bulk |
| Partners | `AdminPartners.tsx` | Partner management | Unknown | Unknown | Audit |
| Payroll | `AdminPayroll.tsx` | Salary processing | Manual process | Unknown | Add automation |
| Phone Verifications | `AdminPhoneVerifications.tsx` | OTP log | Unknown | Unknown | Audit |
| Products | `AdminProducts.tsx` | Catalog | No inventory tracking UI | Unknown | Add inventory |
| Profit Report | `AdminProfitReport.tsx` | Financial analysis | No date range caching | Heavy aggregation | Cache + date filter |
| Project Data/Features | `AdminProjectData/Features.tsx` | Project config | Unknown | Unknown | Audit |
| Promotions | `AdminPromotions.tsx` | Marketing banners | Unknown | Unknown | Audit |
| Push Notifications | `AdminPushNotifications.tsx` | Broadcast push | No delivery confirmation | Unknown | Add tracking |
| QIROX Settings | `AdminQiroxSettings.tsx` | Platform config | Too many settings on one page | Unknown | Paginate settings |
| QMeet | `AdminQMeet/Detail.tsx` | Video meeting mgmt | Unknown | Unknown | Audit |
| Quotations | `AdminQuotations.tsx` | B2B quotes | PDF not cached | PDF regen | Cache PDFs |
| Receipts | `AdminReceipts.tsx` | Transaction log | Unknown | Unknown | Audit |
| Referrals | `AdminReferrals.tsx` | Referral network | Unknown | Unknown | Audit |
| Reviews | `AdminReviews.tsx` | Moderation | No bulk approve/reject | Unknown | Add bulk actions |
| Roles | `AdminRoles.tsx` | RBAC management | Changes take effect immediately | Unknown | Add confirmation + audit log |
| Sales Reports | `AdminSalesReports.tsx` | Revenue analysis | Unknown | Unknown | Cache |
| Services | `AdminServices.tsx` | Service catalog | Unknown | Unknown | Audit |
| Shipments/Shipping | `AdminShipments/Shipping.tsx` | Logistics | Unknown | Unknown | Audit |
| SLA | `AdminSLA.tsx` | Service level | Breach alerting not audited | Unknown | Audit |
| Subscription Plans | `AdminSubscriptionPlans.tsx` | Plan management | Plan change notification missing | Unknown | Add notification |
| Suppliers | `AdminSuppliers.tsx` | Vendor management | Unknown | Unknown | Audit |
| Support Tickets | `AdminSupportTickets.tsx` | Customer support | No assignment automation | Unknown | Add auto-assign |
| Switch Reminders | `AdminSwitchReminders.tsx` | Product upsell | Unknown | Unknown | Audit |
| System Dashboards/Map | `AdminSystemDashboards/Map.tsx` | System overview | Unknown | Unknown | Audit |
| Templates | `AdminTemplates.tsx` | Template catalog | Unknown | Unknown | Audit |
| Wallet | `AdminWallet.tsx` | Wallet management | Unknown | No atomic queries | Audit atomicity |
| Abandoned Carts | `AdminAbandonedCarts.tsx` | Recovery | Unknown | Unknown | Audit |
| Addon Subscriptions | `AdminAddonSubscriptions.tsx` | Module billing | Unknown | Unknown | Audit |
| AI Sessions | `AdminAISessions.tsx` | AI usage log | No cost tracking shown | Unknown | Add cost tracking |
| App Publish | `AdminAppPublish.tsx` | Store publishing | iOS cert in repo | Unknown | Fix security first |
| QuickStart | `QuickStart.tsx` | Platform guide | Unknown | Unknown | Audit |

---

## 4. Client Portal Pages

| Page | File | Purpose | UX Issues | Perf Issues | Recommendation |
|---|---|---|---|---|---|
| Client Onboarding | `ClientOnboarding.tsx` | First-time setup | No progress persistence | Unknown | Save progress to DB |
| Client Profile | `ClientProfile.tsx` | Account settings | Photo upload stored locally | Unknown | Migrate to object storage |
| Client Invoices | `ClientInvoices.tsx` | Invoice view/download | PDF regen on every download | PDF not cached | Cache PDFs |
| Client Installments | `ClientInstallments.tsx` | Payment plan view | Payment status confusing | Unknown | Improve status labels |
| Client Wallet | `ClientWallet.tsx` | Wallet + top-up | PayPal IAP risk (iOS) | Unknown | Add payment flags |
| Client Loyalty | `ClientLoyalty.tsx` | Points & rewards | No redemption flow audited | Unknown | Audit redemption |
| Client Referral | `ClientReferral.tsx` | Referral sharing | Share link UX not audited | Unknown | Audit share flow |
| Client Contracts | `ClientContracts.tsx` | Contract view/sign | E-signature legality | Unknown | Audit legal compliance |
| Client QMeet | `ClientQMeet.tsx` | Video meetings | WebRTC iOS not tested | Unknown | Test on iOS |
| Client Help | `ClientHelp.tsx` | Support center | Unknown | Unknown | Audit |
| Client Shipments | `ClientShipments.tsx` | Order tracking | Real-time not implemented | Unknown | Add WS updates |
| Client Quotations | `ClientQuotations.tsx` | Quotes view | Unknown | Unknown | Audit |
| Client Data Requests | `ClientDataRequests.tsx` | GDPR export request | Export not automated | Unknown | Automate |
| Cart | `Cart.tsx` | Shopping cart | No saved cart across devices | Unknown | Persist cart to DB |
| CartWizardPage | `CartWizardPage.tsx` | Multi-step checkout | Step completion not saved | Unknown | Save wizard state |
| Checkout | `Checkout.tsx` | Payment | Multiple payment methods complex | Unknown | Simplify flow |
| Track Order | `TrackOrder.tsx` | Order status | No real-time updates | Unknown | Add WS |
| Payment History | `PaymentHistory.tsx` | Transaction log | Unknown | Unknown | Audit |
| My API Keys | `MyApiKeys.tsx` | External API access | Unknown | Unknown | Audit |
| Investor Portal | `InvestorPortal.tsx` | Investor dashboard | Unknown | Unknown | Audit |
| Supplier Dashboard | `SupplierDashboard.tsx` | Vendor portal | Unknown | Unknown | Audit |

---

## 5. Employee Pages

| Page | File | Purpose | Key Issues | Recommendation |
|---|---|---|---|---|
| Employee Welcome | `EmployeeWelcome.tsx` | Onboarding welcome | Unknown | Audit |
| Employee Hub | `EmployeeHub.tsx` | Main dashboard | Role-specific logic not audited | Refactor per-role |
| Employee Role Dashboard | `EmployeeRoleDashboard.tsx` | Role-specific view | 11 roles, complex branching | Split per-role |
| Employee CRM | `EmployeeCRM.tsx` | Lead/contact management | No pipeline automation | Add automation |
| Employee Leads Data | `EmployeeLeadsData.tsx` | Lead database | Unbounded query possible | Add pagination |
| Employee Mail | `EmployeeMail.tsx` | IMAP reader | Credential security | Audit security |
| Employee WhatsApp CRM | `EmployeeWhatsappCRM.tsx` | WA templates | wa.me only, no API | Document limitation |
| Employee My Finance | `EmployeeMyFinance.tsx` | Salary/payments | Read-only, no dispute flow | Add dispute button |
| Employee New Order | `EmployeeNewOrder.tsx` | Order entry | Unknown | Audit |
| Employee Profile | `EmployeeProfile.tsx` | Account settings | Photo stored locally | Migrate storage |
| Employee Subscriptions | `EmployeeSubscriptions.tsx` | Subscription view | Unknown | Audit |
| Employee Demos | `EmployeeDemos.tsx` | Demo management | Local file storage | Migrate storage |
| Employee Changelog | `EmployeeChangelog.tsx` | Release notes | Unknown | Audit |
| Customers | `Customers.tsx` | Customer list | Unknown | Audit |
| CS Chat | `CSChat.tsx` | Live support chat | Assignment not audited | Audit |
| Inbox | `Inbox.tsx` | Internal messages | Real-time not audited | Audit WS |
| Groups | `ClientsGroup.tsx` | Team messaging | Encryption missing | Document |
| Segments | `Segments.tsx` | Market segmentation | Unknown | Audit |
| Sales Marketing | `SalesMarketing.tsx` | Marketing tools | Unknown | Audit |
| Consultation | `Consultation.tsx` | Booking management | Unknown | Audit |

---

## 6. Developer / Technical Pages

| Page | File | Purpose | Key Issues | Recommendation |
|---|---|---|---|---|
| System Builder IDE | `SystemBuilderIDE.tsx` | Monaco code editor | exec() injection risk | Audit security |
| System Builder | `SystemBuilder.tsx` | UI-based builder | Unknown | Audit |
| Deployment Cloud | `DeploymentCloud.tsx` | GitHub deploy | GitHub token security | Audit token storage |
| Dev Portal | `DevPortal.tsx` | Developer tools | Unknown | Audit |
| Dev Checklist | `DevChecklist.tsx` | Task checklist | Unknown | Keep |
| Barcode Studio | `BarcodeStudio.tsx` | QR/barcode generator | Client-side only | Keep |
| Posters | `Posters.tsx` | Poster generator | Canvas-based | Keep |
| Qirox Studio | `QiroxStudio.tsx` | AI chat studio | SSE cleanup, any types | Refactor |
| Meeting Room | `MeetingRoom.tsx` | WebRTC room | iOS not tested | Test on iOS |
| QMeet Join by Code | `QMeetJoinByCode.tsx` | Join via code | Unknown | Audit |

---

## 7. Miscellaneous / Utility Pages

| Page | File | Purpose | Notes |
|---|---|---|---|
| not-found | `not-found.tsx` | 404 page | Confirm exists and styled |
| Invoice Print | `InvoicePrint.tsx` | Print-optimized invoice | Unknown |
| Quotation Print | `QuotationPrint.tsx` | Print-optimized quote | Unknown |
| Receipt Print | `ReceiptPrint.tsx` | Print-optimized receipt | Unknown |
| Push Approval | `PushApproval.tsx` | Push notification consent | Unknown |
| Embed Dashboard | `EmbedDashboard.tsx` | Embeddable widget | Unknown |
| Paymob Onboarding | `PaymobOnboarding.tsx` | Payment config | Not integrated |
| Order Flow | `OrderFlow.tsx` | Multi-step order | Unknown |
| Tool Page | `ToolPage.tsx` | Generic tool container | Unknown |
| My Tools | `MyTools.tsx` | User tools listing | Unknown |
| Lead Call Rating | `LeadCallRating.tsx` | Call quality rating | Unknown |
| Project Details | `ProjectDetails.tsx` | Project info view | Unknown |
| Project Details Setup | `ProjectDetailsSetup.tsx` | Project configuration | Unknown |
| Project Workspace | `ProjectWorkspace.tsx` | Full project view | Large component |
| EcommerceStore | `EcommerceStore.tsx` | Store frontend | Inventory not audited |
| cafe-pages-data | `cafe-pages-data.ts` | Static data file | Not a page |
| ecommerce-pages-data | `ecommerce-pages-data.ts` | Static data file | Not a page |
