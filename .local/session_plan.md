# Qirox 8.1 — Session Plan

## Objective
Implement requested features in ordered groups.

## Group A — Financial Features
### A1: Convert Quotation → Invoice (already exists but improve UX)
### A2: AdminFinance — add net profit card per period, improve analytics with revenue vs expenses chart
### A3: AdminFinance — project payments tab: show ALL projects with payment progress bars
### A4: AdminFinance — expenses: show cost breakdown per project + total net profit after all deductions

## Group B — Customers & Projects
### B1: AdminProjectData — add Delete Project button
### B2: AdminCustomers — add address, tax number (رقم ضريبي), company name fields to client profile
### B3: AdminCustomers — filter clients by assigned sales rep
### B4: Sales/Clients scoping — clients see only their data, sales reps see only their clients

## Group C — Sales Reports
### C1: AdminSalesReports — add period filter (daily/weekly/monthly/quarterly/semiannual/annual)
### C2: AdminSalesReports — revenue chart per period with real data from invoices

## Group D — Pricing Page
### D1: Update /pricing page design inspired by qiroxstudio.online/systems

## Execution Order (by priority & dependency):
1. B1 (delete project) — small, high value
2. B2 (client fields) — schema + UI
3. A2/A3/A4 (finance improvements) — UI only, backend exists
4. C1 (sales reports period filter) — frontend + backend endpoint
5. D1 (pricing page) — after reading current page

## Key Files
- client/src/pages/AdminFinance.tsx (547 lines) ✓ read
- client/src/pages/AdminQuotations.tsx (826 lines) ✓ read  
- client/src/pages/AdminCustomers.tsx (512 lines) ✓ read
- client/src/pages/AdminSalesReports.tsx (252 lines) ✓ read
- client/src/pages/AdminProjectData.tsx — need to read
- server/routes.ts — need to find project delete endpoint
- shared/schema.ts — need to check user fields
