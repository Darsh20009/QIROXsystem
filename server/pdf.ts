import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { createRequire } from "module";
import * as fs from "fs";
import * as path from "path";

/* fontkit is CJS — load via createRequire.
   In CJS builds (production/Render), import.meta.url is undefined, so we fall
   back to __filename which is always available in CJS. */
const _require = createRequire((globalThis as any).__filename ?? import.meta.url);
const fontkit  = _require("@pdf-lib/fontkit");

interface QuotationData {
  quotationNumber: string;
  title?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientCity?: string;
  clientTaxNumber?: string;
  clientOrganization?: string;
  clientCommercialReg?: string;
  totalAmount: number;
  vatRate?: number;
  vatAmount?: number;
  amount?: number;
  validUntil?: string;
  items?: { name: string; qty: number; unitPrice: number; total: number }[];
  notes?: string;
  createdAt?: string;
}

interface InvoiceData {
  invoiceNumber: string;
  title?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientCity?: string;
  clientTaxNumber?: string;
  clientOrganization?: string;
  clientCommercialReg?: string;
  totalAmount: number;
  vatRate?: number;
  vatAmount?: number;
  amount?: number;
  dueDate?: string;
  status?: string;
  items?: { name: string; qty: number; unitPrice: number; total: number }[];
  notes?: string;
  createdAt?: string;
}

function loadArabicFont(): Buffer | null {
  try {
    const p = path.resolve(process.cwd(), "public/fonts/arabic.ttf");
    return fs.existsSync(p) ? fs.readFileSync(p) : null;
  } catch { return null; }
}

function loadLogo(): Buffer | null {
  try {
    const paths = [
      path.resolve(process.cwd(), "public/qirox-logo-full.png"),
      path.resolve(process.cwd(), "public/qirox-icon.png"),
      path.resolve(process.cwd(), "attached_assets/qirox_1771715726312.png"),
      path.resolve(process.cwd(), "public/logo.png"),
    ];
    for (const p of paths) if (fs.existsSync(p)) return fs.readFileSync(p);
    return null;
  } catch { return null; }
}

const hasArabic = (t: string) => /[\u0600-\u06FF]/.test(t);

/**
 * Prepare Arabic text for LTR drawing in pdf-lib.
 * Reverses the WORD ORDER so that visual RTL reading is correct
 * (e.g. "محمد الدباني" → "الدباني محمد" drawn LTR reads RTL correctly).
 * fontkit's OpenType GSUB handles per-letter shaping (connections).
 */
function rtlWords(text: string): string {
  return text.split(" ").reverse().join(" ");
}

export async function generateQuotationPdf(q: QuotationData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  /* fonts */
  const arabicFontBytes = loadArabicFont();
  let arabicFont: any = null;
  if (arabicFontBytes) {
    try { arabicFont = await pdfDoc.embedFont(arabicFontBytes); }
    catch (err: any) { console.error("[PDF] Arabic font embed failed:", err?.message); }
  }
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica     = await pdfDoc.embedFont(StandardFonts.Helvetica);

  /* logo */
  const logoBytes = loadLogo();
  let logoImage: any = null;
  if (logoBytes) {
    try { logoImage = await pdfDoc.embedPng(logoBytes); } catch { /* no logo */ }
  }

  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();

  const BLACK = rgb(0,    0,    0);
  const GRAY  = rgb(0.5,  0.5,  0.5);
  const LGRAY = rgb(0.94, 0.94, 0.94);
  const DGRAY = rgb(0.2,  0.2,  0.2);
  const WHITE = rgb(1,    1,    1);

  const latinBold = helveticaBold;
  const latinReg  = helvetica;

  /* ── Drawing helpers ── */

  /** Draw Latin/number text left-aligned from (x, y). */
  const drawL = (
    txt: string, x: number, y: number, size: number,
    color = BLACK, font = latinReg
  ) => {
    if (!txt) return;
    try { page.drawText(txt, { x, y, size, color, font }); } catch { /* skip */ }
  };

  /**
   * Draw Arabic text, right-aligned so its RIGHT EDGE touches rightX.
   * Word order is reversed for visual RTL; fontkit GSUB shapes letters.
   */
  const drawAR = (
    txt: string, rightX: number, y: number, size: number,
    color = BLACK
  ) => {
    if (!txt || !arabicFont) return;
    const visual = rtlWords(txt);
    try {
      const tw = arabicFont.widthOfTextAtSize(visual, size);
      page.drawText(visual, { x: rightX - tw, y, size, color, font: arabicFont });
    } catch (err: any) {
      console.error("[PDF] drawAR failed:", err?.message);
    }
  };

  /**
   * Smart: if text has Arabic chars → drawAR (right-aligned to rightX);
   * otherwise → drawL (left-aligned from leftX).
   */
  const drawSmart = (
    txt: string,
    leftX: number, rightX: number, y: number,
    size: number, color = BLACK, latinFont = latinReg
  ) => {
    if (!txt) return;
    if (hasArabic(txt)) drawAR(txt, rightX, y, size, color);
    else drawL(txt, leftX, y, size, color, latinFont);
  };

  const drawRect = (x: number, y: number, w: number, h: number, color = LGRAY) =>
    page.drawRectangle({ x, y, width: w, height: h, color });

  const drawLine = (x1: number, y1: number, x2: number, y2: number, thick = 0.5, color = LGRAY) =>
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: thick, color });

  /* ── Layout ── */
  const MARGIN = 30;
  const pageW  = width - MARGIN * 2;
  let curY = height - 40;

  /* ── Header bar ── */
  const headerH = 64;
  drawRect(0, curY - 14, width, headerH, BLACK);

  if (logoImage) {
    const scale = Math.min(90 / logoImage.width, 44 / logoImage.height);
    const lw = logoImage.width * scale;
    const lh = logoImage.height * scale;
    page.drawImage(logoImage, {
      x: 28, y: curY - 14 + (headerH - lh) / 2, width: lw, height: lh,
    });
    drawL("qiroxstudio.online", 28 + lw + 8, curY + 16, 8, rgb(0.55, 0.55, 0.55), latinReg);
  } else {
    drawL("QIROX",              30,  curY + 20, 28, WHITE, latinBold);
    drawL("STUDIO",             110, curY + 22, 11, rgb(0.6, 0.6, 0.6), latinReg);
    drawL("qiroxstudio.online", width - 175, curY + 22, 9, rgb(0.6, 0.6, 0.6), latinReg);
  }
  drawL("QUOTATION", width - 100, curY + 8, 7, GRAY, latinReg);
  curY -= 70;

  /* ── Quotation number & date ── */
  drawL(`#${q.quotationNumber}`, MARGIN, curY, 16, BLACK, latinBold);
  const dateStr = q.createdAt
    ? new Date(q.createdAt).toLocaleDateString("en-SA")
    : new Date().toLocaleDateString("en-SA");
  drawL(`Date: ${dateStr}`, width - 150, curY, 9, GRAY, latinReg);
  if (q.validUntil) {
    drawL(
      `Valid until: ${new Date(q.validUntil).toLocaleDateString("en-SA")}`,
      width - 150, curY - 14, 9, GRAY, latinReg
    );
  }
  curY -= 30;

  /* ── Title ── */
  if (q.title) {
    drawSmart(q.title, MARGIN, width - MARGIN, curY, 11, DGRAY, latinBold);
    curY -= 22;
  }

  /* ── Client info box (richer for legal/tax compliance) ── */
  const boxRight = width - MARGIN;
  const hasOrg = !!q.clientOrganization;
  const hasTax = !!q.clientTaxNumber;
  const hasAddr = !!(q.clientAddress || q.clientCity);
  const extraRows = (hasOrg ? 1 : 0) + (hasTax ? 1 : 0) + (hasAddr ? 1 : 0);
  const boxH = 46 + extraRows * 11;
  drawRect(MARGIN, curY - boxH + 8, pageW, boxH, rgb(0.97, 0.97, 0.97));
  drawL("Prepared for:", MARGIN + 10, curY - 10, 7, GRAY, latinReg);
  drawSmart(q.clientName || "—", MARGIN + 10, boxRight - 10, curY - 24, 11, BLACK, latinBold);
  let cy = curY - 37;
  if (q.clientEmail) { drawL(q.clientEmail, MARGIN + 10, cy, 8, GRAY, latinReg); cy -= 11; }
  if (q.clientPhone) { drawL(q.clientPhone, MARGIN + 200, curY - 37, 8, GRAY, latinReg); }
  if (hasOrg) { drawSmart(`Org / المنشأة: ${q.clientOrganization}`, MARGIN + 10, boxRight - 10, cy, 8, DGRAY); cy -= 11; }
  if (hasTax) { drawL(`VAT/Tax #: ${q.clientTaxNumber}`, MARGIN + 10, cy, 8, DGRAY, latinReg); if (q.clientCommercialReg) drawL(`CR: ${q.clientCommercialReg}`, MARGIN + 220, cy, 8, DGRAY, latinReg); cy -= 11; }
  if (hasAddr) { drawSmart(`${q.clientAddress || ""}${q.clientCity ? ", " + q.clientCity : ""}`, MARGIN + 10, boxRight - 10, cy, 8, DGRAY); cy -= 11; }
  curY -= boxH + 14;

  /* ── Items table ── */
  const items = q.items || [];
  const tableX   = MARGIN;
  const tableW   = pageW;
  const colWidths = [tableW * 0.45, tableW * 0.15, tableW * 0.2, tableW * 0.2];
  const cols = [
    tableX,
    tableX + colWidths[0],
    tableX + colWidths[0] + colWidths[1],
    tableX + colWidths[0] + colWidths[1] + colWidths[2],
  ];

  /* Header row */
  drawRect(tableX, curY - 20, tableW, 24, BLACK);
  drawL("Item",       cols[0] + 6,              curY - 12, 8, WHITE, latinBold);
  drawAR("البند",    cols[0] + colWidths[0] - 6, curY - 12, 8, WHITE);
  drawL("Qty",        cols[1] + 6, curY - 12, 8, WHITE, latinBold);
  drawL("Unit Price", cols[2] + 6, curY - 12, 8, WHITE, latinBold);
  drawL("Total",      cols[3] + 6, curY - 12, 8, WHITE, latinBold);
  curY -= 26;

  /* Data rows */
  items.forEach((item, idx) => {
    const rowH  = 22;
    const rowBg = idx % 2 === 0 ? WHITE : rgb(0.97, 0.97, 0.97);
    drawRect(tableX, curY - rowH + 4, tableW, rowH, rowBg);

    const name = item.name || "—";
    const nameDisplay = name.length > 45 ? name.substring(0, 45) + "…" : name;
    drawSmart(nameDisplay, cols[0] + 6, cols[1] - 6, curY - 12, 8, DGRAY);
    drawL(String(item.qty),                       cols[1] + 6, curY - 12, 8, DGRAY, latinReg);
    drawL(item.unitPrice.toLocaleString("en-SA"), cols[2] + 6, curY - 12, 8, DGRAY, latinReg);
    drawL(item.total.toLocaleString("en-SA"),     cols[3] + 6, curY - 12, 8, DGRAY, latinReg);
    curY -= rowH;
  });

  drawLine(tableX, curY, tableX + tableW, curY, 0.5, LGRAY);
  curY -= 14;

  /* ── Totals ── */
  const totalsX = width - 220;
  const totalsW = 190;

  const addTotalRow = (label: string, value: string, bold = false, bgColor?: any) => {
    if (bgColor) drawRect(totalsX, curY - 16, totalsW, 22, bgColor);
    const f = bold ? latinBold : latinReg;
    const c = bold ? BLACK : GRAY;
    drawL(label, totalsX + 6, curY - 8, 8, c, f);
    drawL(value, totalsX + totalsW - 6 - latinReg.widthOfTextAtSize(value, 8), curY - 8, 8, c, f);
    curY -= 20;
  };

  const subtotal = q.amount ?? (q.totalAmount - (q.vatAmount ?? 0));
  addTotalRow("Subtotal (SAR)", subtotal.toLocaleString("en-SA", { minimumFractionDigits: 2 }));
  addTotalRow(`VAT ${q.vatRate ?? 15}%`, (q.vatAmount ?? 0).toLocaleString("en-SA", { minimumFractionDigits: 2 }));
  addTotalRow("Total (SAR)", q.totalAmount.toLocaleString("en-SA", { minimumFractionDigits: 2 }), true, BLACK);

  /* re-draw total row text in white */
  const totalY   = curY + 20;
  const totalStr = q.totalAmount.toLocaleString("en-SA", { minimumFractionDigits: 2 });
  drawL("Total (SAR)", totalsX + 6, totalY - 8, 8, WHITE, latinBold);
  drawL(totalStr, totalsX + totalsW - 6 - latinBold.widthOfTextAtSize(totalStr, 8), totalY - 8, 8, WHITE, latinBold);
  curY -= 20;

  /* ── Notes ── */
  if (q.notes) {
    curY -= 10;
    const notesBoxW = tableW * 0.8;
    drawRect(tableX, curY - 36, notesBoxW, 44, rgb(0.97, 0.97, 0.97));
    drawL("Notes:", tableX + 8, curY - 10, 7, GRAY, latinReg);
    const noteText = q.notes.length > 120 ? q.notes.substring(0, 120) + "…" : q.notes;
    drawSmart(noteText, tableX + 8, tableX + notesBoxW - 8, curY - 24, 8, DGRAY);
    curY -= 54;
  }

  /* ── Footer ── */
  const footerY = 30;
  drawLine(MARGIN, footerY + 18, width - MARGIN, footerY + 18, 0.5, LGRAY);
  drawL("QIROX Studio",       MARGIN,          footerY + 6, 8, GRAY, latinBold);
  drawL("qiroxstudio.online", width / 2 - 40,  footerY + 6, 8, GRAY, latinReg);
  drawL("© 2026",             width - 70,      footerY + 6, 8, GRAY, latinReg);

  return pdfDoc.save();
}

/* ────────────────────────────────────────────────────────────────────
 * generateInvoicePdf — formal invoice PDF (mirrors quotation layout
 * but says INVOICE and shows status / due date)
 * ──────────────────────────────────────────────────────────────────── */
export async function generateInvoicePdf(inv: InvoiceData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const arabicFontBytes = loadArabicFont();
  let arabicFont: any = null;
  if (arabicFontBytes) {
    try { arabicFont = await pdfDoc.embedFont(arabicFontBytes); } catch {}
  }
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica     = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const logoBytes = loadLogo();
  let logoImage: any = null;
  if (logoBytes) { try { logoImage = await pdfDoc.embedPng(logoBytes); } catch {} }

  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();

  const BLACK = rgb(0, 0, 0);
  const GRAY  = rgb(0.5, 0.5, 0.5);
  const LGRAY = rgb(0.94, 0.94, 0.94);
  const DGRAY = rgb(0.2, 0.2, 0.2);
  const WHITE = rgb(1, 1, 1);
  const GREEN = rgb(0.13, 0.55, 0.27);
  const RED   = rgb(0.72, 0.12, 0.12);

  const latinBold = helveticaBold;
  const latinReg  = helvetica;

  const drawL = (t: string, x: number, y: number, s: number, c = BLACK, f = latinReg) => {
    if (!t) return; try { page.drawText(t, { x, y, size: s, color: c, font: f }); } catch {}
  };
  const drawAR = (t: string, rightX: number, y: number, s: number, c = BLACK) => {
    if (!t || !arabicFont) return;
    const visual = rtlWords(t);
    try { const tw = arabicFont.widthOfTextAtSize(visual, s); page.drawText(visual, { x: rightX - tw, y, size: s, color: c, font: arabicFont }); } catch {}
  };
  const drawSmart = (t: string, leftX: number, rightX: number, y: number, s: number, c = BLACK, lf = latinReg) => {
    if (!t) return;
    if (hasArabic(t)) drawAR(t, rightX, y, s, c); else drawL(t, leftX, y, s, c, lf);
  };
  const drawRect = (x: number, y: number, w: number, h: number, c = LGRAY) =>
    page.drawRectangle({ x, y, width: w, height: h, color: c });
  const drawLine = (x1: number, y1: number, x2: number, y2: number, th = 0.5, c = LGRAY) =>
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: th, color: c });

  const MARGIN = 30;
  const pageW = width - MARGIN * 2;
  let curY = height - 40;

  /* Header */
  const headerH = 64;
  drawRect(0, curY - 14, width, headerH, BLACK);
  if (logoImage) {
    const scale = Math.min(90 / logoImage.width, 44 / logoImage.height);
    const lw = logoImage.width * scale; const lh = logoImage.height * scale;
    page.drawImage(logoImage, { x: 28, y: curY - 14 + (headerH - lh) / 2, width: lw, height: lh });
    drawL("qiroxstudio.online", 28 + lw + 8, curY + 16, 8, rgb(0.55, 0.55, 0.55), latinReg);
  } else {
    drawL("QIROX", 30, curY + 20, 28, WHITE, latinBold);
    drawL("STUDIO", 110, curY + 22, 11, rgb(0.6, 0.6, 0.6), latinReg);
  }
  drawL("TAX INVOICE", width - 110, curY + 22, 9, WHITE, latinBold);
  drawAR("فاتورة ضريبية", width - 30, curY + 8, 9, WHITE);
  curY -= 70;

  /* Number + date + status */
  drawL(`#${inv.invoiceNumber}`, MARGIN, curY, 16, BLACK, latinBold);
  const dateStr = inv.createdAt ? new Date(inv.createdAt).toLocaleDateString("en-SA") : new Date().toLocaleDateString("en-SA");
  drawL(`Date: ${dateStr}`, width - 160, curY, 9, GRAY, latinReg);
  if (inv.dueDate) drawL(`Due: ${new Date(inv.dueDate).toLocaleDateString("en-SA")}`, width - 160, curY - 14, 9, GRAY, latinReg);
  if (inv.status) {
    const stColor = inv.status === "paid" ? GREEN : inv.status === "cancelled" ? RED : DGRAY;
    const stLabel = inv.status === "paid" ? "PAID" : inv.status === "cancelled" ? "CANCELLED" : "UNPAID";
    drawL(stLabel, width - 160, curY - 28, 9, stColor, latinBold);
  }
  curY -= 30;

  if (inv.title) { drawSmart(inv.title, MARGIN, width - MARGIN, curY, 11, DGRAY, latinBold); curY -= 22; }

  /* Client box (rich) */
  const boxRight = width - MARGIN;
  const hasOrg = !!inv.clientOrganization;
  const hasTax = !!inv.clientTaxNumber;
  const hasAddr = !!(inv.clientAddress || inv.clientCity);
  const extraRows = (hasOrg ? 1 : 0) + (hasTax ? 1 : 0) + (hasAddr ? 1 : 0);
  const boxH = 46 + extraRows * 11;
  drawRect(MARGIN, curY - boxH + 8, pageW, boxH, rgb(0.97, 0.97, 0.97));
  drawL("Billed to / فاتورة إلى:", MARGIN + 10, curY - 10, 7, GRAY, latinReg);
  drawSmart(inv.clientName || "—", MARGIN + 10, boxRight - 10, curY - 24, 11, BLACK, latinBold);
  let cy = curY - 37;
  if (inv.clientEmail) drawL(inv.clientEmail, MARGIN + 10, cy, 8, GRAY, latinReg);
  if (inv.clientPhone) drawL(inv.clientPhone, MARGIN + 200, cy, 8, GRAY, latinReg);
  cy -= 11;
  if (hasOrg) { drawSmart(`Org / المنشأة: ${inv.clientOrganization}`, MARGIN + 10, boxRight - 10, cy, 8, DGRAY); cy -= 11; }
  if (hasTax) { drawL(`VAT/Tax #: ${inv.clientTaxNumber}`, MARGIN + 10, cy, 8, DGRAY, latinReg); if (inv.clientCommercialReg) drawL(`CR: ${inv.clientCommercialReg}`, MARGIN + 220, cy, 8, DGRAY, latinReg); cy -= 11; }
  if (hasAddr) { drawSmart(`${inv.clientAddress || ""}${inv.clientCity ? ", " + inv.clientCity : ""}`, MARGIN + 10, boxRight - 10, cy, 8, DGRAY); cy -= 11; }
  curY -= boxH + 14;

  /* Items table */
  const items = inv.items || [];
  const tableX = MARGIN;
  const tableW = pageW;
  const colWidths = [tableW * 0.45, tableW * 0.15, tableW * 0.2, tableW * 0.2];
  const cols = [tableX, tableX + colWidths[0], tableX + colWidths[0] + colWidths[1], tableX + colWidths[0] + colWidths[1] + colWidths[2]];

  drawRect(tableX, curY - 20, tableW, 24, BLACK);
  drawL("Item",       cols[0] + 6,                  curY - 12, 8, WHITE, latinBold);
  drawAR("البند",    cols[0] + colWidths[0] - 6,    curY - 12, 8, WHITE);
  drawL("Qty",        cols[1] + 6, curY - 12, 8, WHITE, latinBold);
  drawL("Unit Price", cols[2] + 6, curY - 12, 8, WHITE, latinBold);
  drawL("Total",      cols[3] + 6, curY - 12, 8, WHITE, latinBold);
  curY -= 26;

  items.forEach((item, idx) => {
    const rowH = 22;
    const rowBg = idx % 2 === 0 ? WHITE : rgb(0.97, 0.97, 0.97);
    drawRect(tableX, curY - rowH + 4, tableW, rowH, rowBg);
    const name = item.name || "—";
    const nameDisplay = name.length > 45 ? name.substring(0, 45) + "…" : name;
    drawSmart(nameDisplay, cols[0] + 6, cols[1] - 6, curY - 12, 8, DGRAY);
    drawL(String(item.qty), cols[1] + 6, curY - 12, 8, DGRAY, latinReg);
    drawL(item.unitPrice.toLocaleString("en-SA"), cols[2] + 6, curY - 12, 8, DGRAY, latinReg);
    drawL(item.total.toLocaleString("en-SA"), cols[3] + 6, curY - 12, 8, DGRAY, latinReg);
    curY -= rowH;
  });

  drawLine(tableX, curY, tableX + tableW, curY, 0.5, LGRAY);
  curY -= 14;

  /* Totals */
  const totalsX = width - 220;
  const totalsW = 190;
  const subtotal = inv.amount ?? (inv.totalAmount - (inv.vatAmount ?? 0));
  const addRow = (label: string, value: string, bold = false, bg?: any) => {
    if (bg) drawRect(totalsX, curY - 16, totalsW, 22, bg);
    const f = bold ? latinBold : latinReg;
    const c = bold ? (bg ? WHITE : BLACK) : GRAY;
    drawL(label, totalsX + 6, curY - 8, 8, c, f);
    drawL(value, totalsX + totalsW - 6 - f.widthOfTextAtSize(value, 8), curY - 8, 8, c, f);
    curY -= 20;
  };
  addRow("Subtotal (SAR)", subtotal.toLocaleString("en-SA", { minimumFractionDigits: 2 }));
  addRow(`VAT ${inv.vatRate ?? 15}%`, (inv.vatAmount ?? 0).toLocaleString("en-SA", { minimumFractionDigits: 2 }));
  addRow("TOTAL (SAR)", inv.totalAmount.toLocaleString("en-SA", { minimumFractionDigits: 2 }), true, BLACK);

  /* Notes */
  if (inv.notes) {
    curY -= 10;
    const notesBoxW = tableW * 0.8;
    drawRect(tableX, curY - 36, notesBoxW, 44, rgb(0.97, 0.97, 0.97));
    drawL("Notes:", tableX + 8, curY - 10, 7, GRAY, latinReg);
    const noteText = inv.notes.length > 120 ? inv.notes.substring(0, 120) + "…" : inv.notes;
    drawSmart(noteText, tableX + 8, tableX + notesBoxW - 8, curY - 24, 8, DGRAY);
    curY -= 54;
  }

  /* Footer */
  const footerY = 30;
  drawLine(MARGIN, footerY + 18, width - MARGIN, footerY + 18, 0.5, LGRAY);
  drawL("QIROX Studio", MARGIN, footerY + 6, 8, GRAY, latinBold);
  drawL("qiroxstudio.online", width / 2 - 40, footerY + 6, 8, GRAY, latinReg);
  drawL("© 2026", width - 70, footerY + 6, 8, GRAY, latinReg);

  return pdfDoc.save();
}
