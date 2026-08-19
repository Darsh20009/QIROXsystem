---
name: PDF & Print Fix
description: How quotation/invoice/contract PDFs are generated — browser print replaces broken server PDF.
---

# PDF Print Architecture

## Why browser print (not server PDF)
- `server/pdf.ts` uses `pdf-lib` + manual `rtlWords()` word-reversal for Arabic
- This caused reversed/mirrored Arabic text in downloads ("يظهر كالعبري")
- Fix: `handleDownloadPDF` in QuotationPrint.tsx + InvoicePrint.tsx now calls `window.print()` hiding `.no-print` elements — browser handles RTL perfectly

## Print pages
- `/admin/quotation-print/:id` → `QuotationPrint.tsx` — full HTML print view
- `/admin/invoice-print/:id` → `InvoicePrint.tsx` — full HTML print view
- `/admin/contract-print/:id` → `ContractPrint.tsx` (NEW) — professional contract print view
- Client variants exist at `/client/quotation-print/:id`, `/client/invoice-print/:id`

## Contract print view (`ContractPrint.tsx`)
- Fetches from `/api/admin/contracts` (all), then finds by id
- Shows: parties, financial summary, full contract terms (paragraphs), signature section with OTP badge
- Print button in both AdminContracts list row AND view dialog

## Server PDF still used for
- Email attachments (`send-email` route) — still calls `generateQuotationPdf`/`generateInvoicePdf` from `server/pdf.ts`
- These may still have mild RTL issues but are secondary (email attachment preview)

**Why:** Browser Intl/Bidi handles Arabic/RTL rendering correctly; pdf-lib has no bidi support.
