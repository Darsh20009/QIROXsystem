# Remove VAT From Application

## What & Why
The 15% VAT (ضريبة القيمة المضافة) needs to be completely removed from both the frontend and backend. Currently it is applied in the cart/checkout flow and displayed in invoices.

## Done looks like
- Cart page no longer calculates or displays VAT — totals reflect the price after discount only
- Invoice pages no longer show VAT amounts or VAT-related labels
- Backend order creation no longer applies the 15% VAT multiplier to totals
- All Arabic text references to "ضريبة القيمة المضافة" and "شامل ضريبة" are removed

## Out of scope
- Tax reporting or tax configuration systems
- Any other pricing logic changes beyond VAT removal

## Tasks
1. Remove VAT calculation and display from the Cart page (VAT_RATE constant, vat variable, VAT line item, and all "شامل ضريبة" labels).
2. Remove VAT calculation from the backend order creation logic in routes.ts (the VAT_RATE multiplier on serverTotal).
3. Remove VAT display from the AdminInvoices page (vatAmount references and VAT labels).
4. Search for and remove any other VAT/ضريبة references across the codebase.

## Relevant files
- `client/src/pages/Cart.tsx:83,162-163,453,848,878-879,1124`
- `server/routes.ts:1081-1088`
- `client/src/pages/AdminInvoices.tsx:23,235,426`
