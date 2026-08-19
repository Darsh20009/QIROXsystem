---
name: Finance Adjustments & Payroll Fix
description: FinanceAdjustmentModel for manual control, payroll now included in finance costs calculation.
---

## Rule
Payroll (PayrollRecordModel, status=paid, netSalary field) MUST be included in finance summary costs — it was missing before and caused profit to appear inflated.

**Why:** The original `/api/admin/finance/summary` only summed OrderExpenseModel + OperationalExpenseModel but ignored payroll records, leading to understated costs and overstated profit.

**How to apply:**
- The summary now queries PayrollRecordModel for paid records and adds netSalary sum to totalCosts.
- FinanceAdjustmentModel (server/models/finance.ts) handles manual debit/credit adjustments.
  - direction=credit → signedAmount positive → adds to revenue
  - direction=debit → signedAmount negative → adds to cost
  - isVoided=false filter applied in summary query
- Summary response now includes: adjustedRevenue, totalPayrollCosts, totalAdjustments, costBreakdown (projectExpenses, operationalExpenses, payroll, adjustments)
- Endpoints: GET/POST /api/admin/finance/adjustments, PATCH /:id/void, DELETE /:id (admin only)
- AdminFinance.tsx has a new "تعديلات يدوية" tab with full CRUD UI.
