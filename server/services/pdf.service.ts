/**
 * Canonical PDF service.
 *
 * All finance documents enter through this module. Keeping the public API in
 * one place means downloads and email attachments cannot silently drift apart.
 * The renderer remains pdf-lib based because it is already part of the
 * production bundle and does not require a Chromium binary at runtime.
 */
export {
  generateInvoicePdf,
  generateQuotationPdf,
  generateReceiptPdf,
} from "../pdf";

export type {
  InvoiceData,
  QuotationData,
  ReceiptData,
} from "../pdf";