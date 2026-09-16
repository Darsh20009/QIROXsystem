import { PDFDocument, PDFString, PDFName, rgb, StandardFonts } from "pdf-lib";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import * as fs from "fs";
import * as path from "path";

/* fontkit is CJS — load via createRequire.
   import.meta.url is shimmed at bundle time (see script/build.ts banner). */
const _require = createRequire(import.meta.url);
const fontkit  = _require("@pdf-lib/fontkit");
const moduleDir = path.dirname(fileURLToPath(import.meta.url));

export interface QuotationData {
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
  discountPercent?: number;
  discountAmount?: number;
  validUntil?: string;
  items?: { name: string; qty: number; unitPrice: number; total: number }[];
  notes?: string;
  createdAt?: string;
  paymentTerms?: string;
  termsAndConditions?: string;
  bankName?: string;
  beneficiaryName?: string;
  iban?: string;
  accountNumber?: string;
  language?: "ar" | "en";
}

export interface InvoiceData {
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
  discountPercent?: number;
  discountAmount?: number;
  bankName?: string;
  beneficiaryName?: string;
  iban?: string;
  accountNumber?: string;
  language?: "ar" | "en";
}

export interface ReceiptData {
  receiptNumber: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  invoiceNumber?: string;
  amount: number;
  amountInWords?: string;
  paymentMethod: string;
  paymentRef?: string;
  description?: string;
  receivedBy?: string;
  notes?: string;
  createdAt?: string;
  bankName?: string;
  beneficiaryName?: string;
  iban?: string;
  accountNumber?: string;
}

function loadArabicFont(): { bytes: Buffer; filePath: string } | null {
  const candidates = [
    path.resolve(process.cwd(), "public/fonts/arabic.ttf"),
    path.resolve(process.cwd(), "client/public/fonts/arabic.ttf"),
    path.resolve(process.cwd(), "dist/public/fonts/arabic.ttf"),
    path.resolve(moduleDir, "../public/fonts/arabic.ttf"),
    path.resolve(moduleDir, "public/fonts/arabic.ttf"),
    path.resolve(moduleDir, "fonts/arabic.ttf"),
  ];

  for (const filePath of candidates) {
    try {
      if (!fs.existsSync(filePath)) continue;
      const bytes = fs.readFileSync(filePath);
      if (!bytes.length) {
        console.error("[PDF] Arabic font file is empty:", filePath);
        continue;
      }
      console.info("[PDF] Arabic font loaded:", filePath, `${bytes.length} bytes`);
      return { bytes, filePath };
    } catch (err: any) {
      console.error("[PDF] Arabic font read failed:", filePath, err?.message || err);
    }
  }

  console.error("[PDF] Arabic font not found. Checked:", candidates.join(", "));
  return null;
}

async function embedArabicFont(pdfDoc: PDFDocument, documentType: string): Promise<any> {
  const loaded = loadArabicFont();
  if (!loaded) {
    throw new Error(`[PDF] Arabic font unavailable for ${documentType}`);
  }

  try {
    const font = await pdfDoc.embedFont(loaded.bytes);
    console.info(`[PDF] Arabic font embedded for ${documentType}:`, loaded.filePath);
    return font;
  } catch (err: any) {
    console.error(
      `[PDF] Arabic font embed failed for ${documentType}:`,
      loaded.filePath,
      err?.message || err,
    );
    throw new Error(`[PDF] Arabic font embed failed for ${documentType}: ${err?.message || err}`);
  }
}

function loadLogo(): Buffer | null {
  try {
    const paths = [
      path.resolve(process.cwd(), "public/qirox-logo-full.png"),
      path.resolve(process.cwd(), "public/qirox-icon.png"),
      path.resolve(process.cwd(), "client/public/qirox-logo-full.png"),
      path.resolve(process.cwd(), "client/public/qirox-logo-nobg.png"),
      path.resolve(process.cwd(), "client/public/qirox-icon.png"),
      path.resolve(process.cwd(), "attached_assets/qirox_1771715726312.png"),
      path.resolve(process.cwd(), "public/logo.png"),
    ];
    for (const p of paths) if (fs.existsSync(p)) return fs.readFileSync(p);
    return null;
  } catch { return null; }
}

const hasArabic = (t: string) => /[\u0600-\u06FF]/.test(t);
const TERMS_PATH = "/terms";

function getTermsUrl(): string {
  const baseUrl = (process.env.EMAIL_SITE_URL || "https://qiroxstudio.online").replace(/\/+$/, "");
  return `${baseUrl}${TERMS_PATH}`;
}

function addPdfLink(
  pdfDoc: PDFDocument,
  page: any,
  x: number,
  y: number,
  width: number,
  height: number,
  url: string,
) {
  const linkRef = pdfDoc.context.register(pdfDoc.context.obj({
    Type: "Annot",
    Subtype: "Link",
    Rect: [x, y, x + width, y + height],
    Border: [0, 0, 0],
    A: {
      Type: "Action",
      S: "URI",
      URI: PDFString.of(url),
    },
  }));
  page.node.set(PDFName.of("Annots"), pdfDoc.context.obj([linkRef]));
}

function drawTermsLink(
  pdfDoc: PDFDocument,
  page: any,
  label: string,
  x: number,
  y: number,
  size: number,
  font: any,
  arabicFont: any,
  color: any,
) {
  const isArabic = hasArabic(label);
  if (isArabic && !arabicFont) {
    throw new Error("[PDF] Cannot draw Arabic terms link without an Arabic font");
  }
  const visual = isArabic ? prepareArabic(label) : label;
  const textWidth = (isArabic ? arabicFont : font).widthOfTextAtSize(visual, size);
  if (isArabic) {
    page.drawText(visual, { x, y, size, color, font: arabicFont });
  } else {
    page.drawText(label, { x, y, size, color, font });
  }
  addPdfLink(pdfDoc, page, x, y - 2, textWidth, size + 4, getTermsUrl());
}

const PDF_LABELS = {
  ar: {
    quotation: "عرض سعر",
    invoice: "فاتورة ضريبية",
    date: "التاريخ",
    validUntil: "صالح حتى",
    due: "تاريخ الاستحقاق",
    preparedFor: "مقدم إلى:",
    billedTo: "فاتورة إلى:",
    organization: "المنشأة",
    tax: "الرقم الضريبي",
    commercialReg: "السجل التجاري",
    item: "البند",
    quantity: "الكمية",
    unitPrice: "سعر الوحدة",
    total: "الإجمالي",
    subtotal: "المجموع الفرعي",
    discount: "الخصم",
    vat: "ضريبة القيمة المضافة",
    notes: "ملاحظات:",
    paymentTerms: "شروط الدفع:",
    terms: "الشروط والأحكام:",
    bankDetails: "بيانات التحويل البنكي:",
    paid: "مدفوعة",
    unpaid: "غير مدفوعة",
    cancelled: "ملغاة",
    sar: "ر.س",
  },
  en: {
    quotation: "QUOTATION",
    invoice: "TAX INVOICE",
    date: "Date",
    validUntil: "Valid until",
    due: "Due",
    preparedFor: "Prepared for:",
    billedTo: "Billed to:",
    organization: "Organization",
    tax: "VAT/Tax #",
    commercialReg: "CR",
    item: "Item",
    quantity: "Qty",
    unitPrice: "Unit Price",
    total: "Total",
    subtotal: "Subtotal (SAR)",
    discount: "Discount (SAR)",
    vat: "VAT",
    notes: "Notes:",
    paymentTerms: "Payment terms:",
    terms: "Terms:",
    bankDetails: "Bank details:",
    paid: "PAID",
    unpaid: "UNPAID",
    cancelled: "CANCELLED",
    sar: "SAR",
  },
} as const;

/* Load arabic-reshaper (CJS) for proper presentation-form shaping */
let _arabicReshaper: any = null;
try { _arabicReshaper = _require("arabic-reshaper"); } catch { /* optional */ }

/**
 * Prepare Arabic text for pdf-lib.
 *
 * arabic-reshaper converts logical Arabic characters to Unicode presentation
 * forms (FBxx range) with the correct initial/medial/final/isolated glyphs.
 * Do not reverse the shaped string: the PDF renderer handles the resulting
 * presentation-form order, and reversing it produces text such as
 * "رعس ضرع" instead of "عرض سعر".
 */
function prepareArabic(text: string): string {
  try {
    return _arabicReshaper
      ? _arabicReshaper.convertArabic(text)
      : text;
  } catch {
    return text;
  }
}

function wrapPdfText(
  text: string,
  maxWidth: number,
  size: number,
  latinFont: any,
  arabicFont: any,
): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const measure = (value: string) => {
    if (hasArabic(value)) {
      if (!arabicFont) {
        throw new Error("[PDF] Cannot measure Arabic text without an Arabic font");
      }
      return arabicFont.widthOfTextAtSize(prepareArabic(value), size);
    }
    return latinFont.widthOfTextAtSize(value, size);
  };

  const lines: string[] = [];
  let current = "";
  for (const word of normalized.split(" ")) {
    const candidate = current ? `${current} ${word}` : word;
    if (!current || measure(candidate) <= maxWidth) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
    if (measure(current) <= maxWidth) continue;

    // Break a single long identifier or unspaced Arabic string safely.
    let part = "";
    for (const char of [...current]) {
      const next = part + char;
      if (part && measure(next) > maxWidth) {
        lines.push(part);
        part = char;
      } else {
        part = next;
      }
    }
    current = part;
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateQuotationPdf(q: QuotationData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  /* fonts */
  const arabicFont = await embedArabicFont(pdfDoc, "quotation");
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
  const labels = PDF_LABELS[q.language === "en" ? "en" : "ar"];
  // Keep numeric values in Latin digits. The Arabic font can render Arabic
  // labels, but Helvetica and mixed RTL text do not handle Arabic-Indic
  // digits consistently.
  const locale = "en-SA";

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
   * The reshaper supplies presentation forms before pdf-lib draws the text.
   */
  const drawAR = (
    txt: string, rightX: number, y: number, size: number,
    color = BLACK
  ) => {
    if (!txt) return;
    if (!arabicFont) throw new Error("[PDF] Cannot draw Arabic text without an Arabic font");
    const visual = prepareArabic(txt);
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

  const drawSmartWrapped = (
    txt: string,
    leftX: number, rightX: number, y: number,
    size: number, color = BLACK, latinFont = latinReg,
    lineHeight = size * 1.35,
  ) => {
    const lines = wrapPdfText(txt, rightX - leftX, size, latinFont, arabicFont);
    lines.forEach((line, index) =>
      drawSmart(line, leftX, rightX, y - index * lineHeight, size, color, latinFont)
    );
    return lines.length;
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
   drawSmart(labels.quotation, width - 160, width - 30, curY + 8, 7, GRAY, latinReg);
  curY -= 70;

  /* ── Quotation number & date ── */
  drawL(`#${q.quotationNumber}`, MARGIN, curY, 16, BLACK, latinBold);
   const dateStr = q.createdAt
     ? new Date(q.createdAt).toLocaleDateString(locale)
     : new Date().toLocaleDateString(locale);
   drawSmart(`${labels.date}: ${dateStr}`, width - 150, width - MARGIN, curY, 9, GRAY, latinReg);
  if (q.validUntil) {
     drawSmart(
       `${labels.validUntil}: ${new Date(q.validUntil).toLocaleDateString(locale)}`,
       width - 150, width - MARGIN, curY - 14, 9, GRAY, latinReg
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
   drawSmart(labels.preparedFor, MARGIN + 10, boxRight - 10, curY - 10, 7, GRAY, latinReg);
  drawSmart(q.clientName || "—", MARGIN + 10, boxRight - 10, curY - 24, 11, BLACK, latinBold);
  let cy = curY - 37;
  if (q.clientEmail) { drawL(q.clientEmail, MARGIN + 10, cy, 8, GRAY, latinReg); cy -= 11; }
  if (q.clientPhone) { drawL(q.clientPhone, MARGIN + 200, curY - 37, 8, GRAY, latinReg); }
   if (hasOrg) { drawSmart(`${labels.organization}: ${q.clientOrganization}`, MARGIN + 10, boxRight - 10, cy, 8, DGRAY, latinReg); cy -= 11; }
   if (hasTax) {
     drawSmart(`${labels.tax}: ${q.clientTaxNumber}`, MARGIN + 10, boxRight - 10, cy, 8, DGRAY, latinReg);
     if (q.clientCommercialReg) drawSmart(`${labels.commercialReg}: ${q.clientCommercialReg}`, MARGIN + 220, boxRight - 10, cy - 11, 8, DGRAY, latinReg);
     cy -= 11;
   }
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
   drawSmart(labels.item, cols[0] + 6, cols[1] - 6, curY - 12, 8, WHITE, latinBold);
   drawSmart(labels.quantity, cols[1] + 6, cols[2] - 6, curY - 12, 8, WHITE, latinBold);
   drawSmart(labels.unitPrice, cols[2] + 6, cols[3] - 6, curY - 12, 8, WHITE, latinBold);
   drawSmart(labels.total, cols[3] + 6, tableX + tableW - 6, curY - 12, 8, WHITE, latinBold);
  curY -= 26;

  /* Data rows */
   items.forEach((item, idx) => {
    const rowBg = idx % 2 === 0 ? WHITE : rgb(0.97, 0.97, 0.97);

    const name = item.name || "—";
     const nameLines = wrapPdfText(name, cols[1] - cols[0] - 12, 8, latinReg, arabicFont);
     const rowH = Math.max(22, Math.min(nameLines.length, 3) * 10 + 8);
     drawRect(tableX, curY - rowH + 4, tableW, rowH, rowBg);
     nameLines.slice(0, 3).forEach((line, lineIndex) => {
       drawSmart(line, cols[0] + 6, cols[1] - 6, curY - 12 - lineIndex * 10, 8, DGRAY);
     });
    drawL(String(item.qty),                       cols[1] + 6, curY - 12, 8, DGRAY, latinReg);
    drawL(Number(item.unitPrice || 0).toLocaleString("en-SA"), cols[2] + 6, curY - 12, 8, DGRAY, latinReg);
    drawL(Number(item.total || 0).toLocaleString("en-SA"),     cols[3] + 6, curY - 12, 8, DGRAY, latinReg);
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
     drawSmart(label, totalsX + 6, totalsX + totalsW - 6, curY - 8, 8, c, f);
    drawL(value, totalsX + totalsW - 6 - latinReg.widthOfTextAtSize(value, 8), curY - 8, 8, c, f);
    curY -= 20;
  };

   const subtotal = q.amount ?? (q.totalAmount - (q.vatAmount ?? 0));
   addTotalRow(labels.subtotal, subtotal.toLocaleString("en-SA", { minimumFractionDigits: 2 }));
   if (Number((q as any).discountAmount || 0) > 0) {
     addTotalRow(labels.discount, `-${Number((q as any).discountAmount).toLocaleString("en-SA", { minimumFractionDigits: 2 })}`);
   }
   addTotalRow(`${labels.vat} ${q.vatRate ?? 15}%`, (q.vatAmount ?? 0).toLocaleString("en-SA", { minimumFractionDigits: 2 }));
   addTotalRow(labels.total, q.totalAmount.toLocaleString("en-SA", { minimumFractionDigits: 2 }), true, BLACK);

  /* re-draw total row text in white */
  const totalY   = curY + 20;
  const totalStr = q.totalAmount.toLocaleString("en-SA", { minimumFractionDigits: 2 });
   drawSmart(labels.total, totalsX + 6, totalsX + totalsW - 6, totalY - 8, 8, WHITE, latinBold);
   drawL(totalStr, totalsX + totalsW - 6 - latinBold.widthOfTextAtSize(totalStr, 8), totalY - 8, 8, WHITE, latinBold);
  curY -= 20;

   /* ── Notes and payment terms ── */
  if (q.notes) {
    curY -= 10;
    const notesBoxW = tableW * 0.8;
     const noteLines = wrapPdfText(q.notes, notesBoxW - 16, 8, latinReg, arabicFont);
     const notesBoxH = 32 + Math.max(1, noteLines.length) * 11;
     drawRect(tableX, curY - notesBoxH + 8, notesBoxW, notesBoxH, rgb(0.97, 0.97, 0.97));
     drawSmart(labels.notes, tableX + 8, tableX + notesBoxW - 8, curY - 10, 7, GRAY, latinReg);
     noteLines.forEach((line, index) => {
       drawSmart(line, tableX + 8, tableX + notesBoxW - 8, curY - 24 - index * 11, 8, DGRAY);
     });
     curY -= notesBoxH + 10;
  }
   if (q.paymentTerms || q.termsAndConditions) {
     curY -= 8;
     const text = [q.paymentTerms && `${labels.paymentTerms} ${q.paymentTerms}`, q.termsAndConditions && `${labels.terms} ${q.termsAndConditions}`]
       .filter(Boolean).join(" | ");
     const termLines = wrapPdfText(text, tableW, 7, latinReg, arabicFont);
     termLines.forEach((line, index) => {
       drawSmart(line, tableX, tableX + tableW, curY - 10 - index * 10, 7, GRAY);
     });
     curY -= 20 + Math.max(0, termLines.length - 1) * 10;
   }
   if (q.bankName || q.beneficiaryName || q.iban || q.accountNumber) {
     curY -= 8;
     const bankText = [q.bankName, q.beneficiaryName, q.iban && `IBAN: ${q.iban}`, q.accountNumber && `Account: ${q.accountNumber}`]
       .filter(Boolean).join(" · ");
     const bankLines = wrapPdfText(bankText, tableW - 16, 7, latinReg, arabicFont);
     const bankBoxH = 38 + Math.max(1, bankLines.length) * 10;
     drawRect(tableX, curY - bankBoxH + 8, tableW, bankBoxH, rgb(0.97, 0.97, 0.97));
     drawSmart(labels.bankDetails, tableX + 8, tableX + tableW - 8, curY - 12, 7, GRAY, latinBold);
     bankLines.forEach((line, index) => {
       drawSmart(line, tableX + 8, tableX + tableW - 8, curY - 28 - index * 10, 7, DGRAY);
     });
     curY -= bankBoxH + 10;
   }

  /* ── Footer ── */
  const footerY = 30;
  drawLine(MARGIN, footerY + 18, width - MARGIN, footerY + 18, 0.5, LGRAY);
  drawL("QIROX Studio",       MARGIN,          footerY + 6, 8, GRAY, latinBold);
  drawL("qiroxstudio.online", width / 2 - 40,  footerY + 6, 8, GRAY, latinReg);
  drawL("© 2026",             width - 70,      footerY + 6, 8, GRAY, latinReg);
   const quotationTermsLabel = q.language === "en" ? "Terms & Conditions" : "الشروط والأحكام";
    const quotationTermsWidth = hasArabic(quotationTermsLabel)
      ? arabicFont.widthOfTextAtSize(prepareArabic(quotationTermsLabel), 7)
      : latinReg.widthOfTextAtSize(quotationTermsLabel, 7);
   drawTermsLink(
     pdfDoc,
     page,
     quotationTermsLabel,
     (width - quotationTermsWidth) / 2,
     footerY - 8,
     7,
     latinReg,
     arabicFont,
     GRAY,
   );

  return pdfDoc.save();
}

/* ────────────────────────────────────────────────────────────────────
 * generateInvoicePdf — formal invoice PDF (mirrors quotation layout
 * but says INVOICE and shows status / due date)
 * ──────────────────────────────────────────────────────────────────── */
export async function generateInvoicePdf(inv: InvoiceData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const arabicFont = await embedArabicFont(pdfDoc, "invoice");
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
  const labels = PDF_LABELS[inv.language === "en" ? "en" : "ar"];
  // Keep numeric values in Latin digits; Arabic labels are rendered by the
  // embedded Arabic font while dates and amounts remain stable in mixed text.
  const locale = "en-SA";

  const drawL = (t: string, x: number, y: number, s: number, c = BLACK, f = latinReg) => {
    if (!t) return; try { page.drawText(t, { x, y, size: s, color: c, font: f }); } catch {}
  };
  const drawAR = (t: string, rightX: number, y: number, s: number, c = BLACK) => {
    if (!t) return;
    if (!arabicFont) throw new Error("[PDF] Cannot draw Arabic text without an Arabic font");
    const visual = prepareArabic(t);
    try { const tw = arabicFont.widthOfTextAtSize(visual, s); page.drawText(visual, { x: rightX - tw, y, size: s, color: c, font: arabicFont }); } catch {}
  };
  const drawSmart = (t: string, leftX: number, rightX: number, y: number, s: number, c = BLACK, lf = latinReg) => {
    if (!t) return;
    if (hasArabic(t)) drawAR(t, rightX, y, s, c); else drawL(t, leftX, y, s, c, lf);
  };
  const drawSmartWrapped = (
    t: string, leftX: number, rightX: number, y: number, s: number,
    c = BLACK, lf = latinReg, lineHeight = s * 1.35,
  ) => {
    const lines = wrapPdfText(t, rightX - leftX, s, lf, arabicFont);
    lines.forEach((line, index) =>
      drawSmart(line, leftX, rightX, y - index * lineHeight, s, c, lf)
    );
    return lines.length;
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
   drawSmart(labels.invoice, width - 150, width - 30, curY + 22, 9, WHITE, latinBold);
  curY -= 70;

  /* Number + date + status */
  drawL(`#${inv.invoiceNumber}`, MARGIN, curY, 16, BLACK, latinBold);
   const dateStr = inv.createdAt ? new Date(inv.createdAt).toLocaleDateString(locale) : new Date().toLocaleDateString(locale);
   drawSmart(`${labels.date}: ${dateStr}`, width - 160, width - MARGIN, curY, 9, GRAY, latinReg);
   if (inv.dueDate) drawSmart(`${labels.due}: ${new Date(inv.dueDate).toLocaleDateString(locale)}`, width - 160, width - MARGIN, curY - 14, 9, GRAY, latinReg);
  if (inv.status) {
    const stColor = inv.status === "paid" ? GREEN : inv.status === "cancelled" ? RED : DGRAY;
     const stLabel = inv.status === "paid" ? labels.paid : inv.status === "cancelled" ? labels.cancelled : labels.unpaid;
     drawSmart(stLabel, width - 160, width - MARGIN, curY - 28, 9, stColor, latinBold);
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
   drawSmart(labels.billedTo, MARGIN + 10, boxRight - 10, curY - 10, 7, GRAY, latinReg);
  drawSmart(inv.clientName || "—", MARGIN + 10, boxRight - 10, curY - 24, 11, BLACK, latinBold);
  let cy = curY - 37;
  if (inv.clientEmail) drawL(inv.clientEmail, MARGIN + 10, cy, 8, GRAY, latinReg);
  if (inv.clientPhone) drawL(inv.clientPhone, MARGIN + 200, cy, 8, GRAY, latinReg);
  cy -= 11;
   if (hasOrg) { drawSmart(`${labels.organization}: ${inv.clientOrganization}`, MARGIN + 10, boxRight - 10, cy, 8, DGRAY, latinReg); cy -= 11; }
   if (hasTax) {
     drawSmart(`${labels.tax}: ${inv.clientTaxNumber}`, MARGIN + 10, boxRight - 10, cy, 8, DGRAY, latinReg);
     if (inv.clientCommercialReg) drawSmart(`${labels.commercialReg}: ${inv.clientCommercialReg}`, MARGIN + 220, boxRight - 10, cy - 11, 8, DGRAY, latinReg);
     cy -= 11;
   }
  if (hasAddr) { drawSmart(`${inv.clientAddress || ""}${inv.clientCity ? ", " + inv.clientCity : ""}`, MARGIN + 10, boxRight - 10, cy, 8, DGRAY); cy -= 11; }
  curY -= boxH + 14;

  /* Items table */
  const items = inv.items || [];
  const tableX = MARGIN;
  const tableW = pageW;
  const colWidths = [tableW * 0.45, tableW * 0.15, tableW * 0.2, tableW * 0.2];
  const cols = [tableX, tableX + colWidths[0], tableX + colWidths[0] + colWidths[1], tableX + colWidths[0] + colWidths[1] + colWidths[2]];

  drawRect(tableX, curY - 20, tableW, 24, BLACK);
   drawSmart(labels.item, cols[0] + 6, cols[1] - 6, curY - 12, 8, WHITE, latinBold);
   drawSmart(labels.quantity, cols[1] + 6, cols[2] - 6, curY - 12, 8, WHITE, latinBold);
   drawSmart(labels.unitPrice, cols[2] + 6, cols[3] - 6, curY - 12, 8, WHITE, latinBold);
   drawSmart(labels.total, cols[3] + 6, tableX + tableW - 6, curY - 12, 8, WHITE, latinBold);
  curY -= 26;

  items.forEach((item, idx) => {
    const rowBg = idx % 2 === 0 ? WHITE : rgb(0.97, 0.97, 0.97);
    const name = item.name || "—";
     const nameLines = wrapPdfText(name, cols[1] - cols[0] - 12, 8, latinReg, arabicFont);
     const rowH = Math.max(22, Math.min(nameLines.length, 3) * 10 + 8);
     drawRect(tableX, curY - rowH + 4, tableW, rowH, rowBg);
     nameLines.slice(0, 3).forEach((line, lineIndex) => {
       drawSmart(line, cols[0] + 6, cols[1] - 6, curY - 12 - lineIndex * 10, 8, DGRAY);
     });
    drawL(String(item.qty), cols[1] + 6, curY - 12, 8, DGRAY, latinReg);
    drawL(Number(item.unitPrice || 0).toLocaleString("en-SA"), cols[2] + 6, curY - 12, 8, DGRAY, latinReg);
    drawL(Number(item.total || 0).toLocaleString("en-SA"), cols[3] + 6, curY - 12, 8, DGRAY, latinReg);
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
     drawSmart(label, totalsX + 6, totalsX + totalsW - 6, curY - 8, 8, c, f);
    drawL(value, totalsX + totalsW - 6 - f.widthOfTextAtSize(value, 8), curY - 8, 8, c, f);
    curY -= 20;
  };
   addRow(labels.subtotal, subtotal.toLocaleString("en-SA", { minimumFractionDigits: 2 }));
   if (Number(inv.discountAmount || 0) > 0) {
     addRow(labels.discount, `-${Number(inv.discountAmount).toLocaleString("en-SA", { minimumFractionDigits: 2 })}`);
   }
   addRow(`${labels.vat} ${inv.vatRate ?? 15}%`, (inv.vatAmount ?? 0).toLocaleString("en-SA", { minimumFractionDigits: 2 }));
   addRow(labels.total, inv.totalAmount.toLocaleString("en-SA", { minimumFractionDigits: 2 }), true, BLACK);

  /* Notes */
  if (inv.notes) {
    curY -= 10;
    const notesBoxW = tableW * 0.8;
     const noteLines = wrapPdfText(inv.notes, notesBoxW - 16, 8, latinReg, arabicFont);
     const notesBoxH = 32 + Math.max(1, Math.min(noteLines.length, 8)) * 11;
     drawRect(tableX, curY - notesBoxH + 8, notesBoxW, notesBoxH, rgb(0.97, 0.97, 0.97));
     drawSmart(labels.notes, tableX + 8, tableX + notesBoxW - 8, curY - 10, 7, GRAY, latinReg);
     noteLines.slice(0, 8).forEach((line, index) => {
       drawSmart(line, tableX + 8, tableX + notesBoxW - 8, curY - 24 - index * 11, 8, DGRAY);
     });
     curY -= notesBoxH + 10;
  }
   if (inv.bankName || inv.beneficiaryName || inv.iban || inv.accountNumber) {
     curY -= 8;
     const bankText = [inv.bankName, inv.beneficiaryName, inv.iban && `IBAN: ${inv.iban}`, inv.accountNumber && `Account: ${inv.accountNumber}`]
       .filter(Boolean).join(" · ");
     const bankLines = wrapPdfText(bankText, tableW - 16, 7, latinReg, arabicFont);
     const bankBoxH = 38 + Math.max(1, Math.min(bankLines.length, 8)) * 10;
     drawRect(tableX, curY - bankBoxH + 8, tableW, bankBoxH, rgb(0.97, 0.97, 0.97));
     drawSmart(labels.bankDetails, tableX + 8, tableX + tableW - 8, curY - 12, 7, GRAY, latinBold);
     bankLines.slice(0, 8).forEach((line, index) => {
       drawSmart(line, tableX + 8, tableX + tableW - 8, curY - 28 - index * 10, 7, DGRAY);
     });
     curY -= bankBoxH + 10;
   }

  /* Footer */
  const footerY = 30;
  drawLine(MARGIN, footerY + 18, width - MARGIN, footerY + 18, 0.5, LGRAY);
  drawL("QIROX Studio", MARGIN, footerY + 6, 8, GRAY, latinBold);
  drawL("qiroxstudio.online", width / 2 - 40, footerY + 6, 8, GRAY, latinReg);
  drawL("© 2026", width - 70, footerY + 6, 8, GRAY, latinReg);
   const invoiceTermsLabel = inv.language === "en" ? "Terms & Conditions" : "الشروط والأحكام";
    const invoiceTermsWidth = hasArabic(invoiceTermsLabel)
      ? arabicFont.widthOfTextAtSize(prepareArabic(invoiceTermsLabel), 7)
      : latinReg.widthOfTextAtSize(invoiceTermsLabel, 7);
   drawTermsLink(
     pdfDoc,
     page,
     invoiceTermsLabel,
     (width - invoiceTermsWidth) / 2,
     footerY - 8,
     7,
     latinReg,
     arabicFont,
     GRAY,
   );

  return pdfDoc.save();
}

/**
 * Render a receipt voucher through the same server-side document pipeline.
 * Receipt vouchers intentionally stay compact and fit on one A4 page.
 */
export async function generateReceiptPdf(receipt: ReceiptData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const arabicFont = await embedArabicFont(pdfDoc, "receipt");
  const latinBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const latinReg = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const logoBytes = loadLogo();
  let logoImage: any = null;
  if (logoBytes) { try { logoImage = await pdfDoc.embedPng(logoBytes); } catch {} }

  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();
  const MARGIN = 34;
  const BLACK = rgb(0, 0, 0);
  const WHITE = rgb(1, 1, 1);
  const GRAY = rgb(0.48, 0.48, 0.48);
  const DGRAY = rgb(0.2, 0.2, 0.2);
  const LGRAY = rgb(0.94, 0.94, 0.94);
  const PALE = rgb(0.975, 0.975, 0.975);

  const drawL = (text: string, x: number, y: number, size: number, color = BLACK, font = latinReg) => {
    if (!text) return;
    try { page.drawText(text, { x, y, size, color, font }); } catch {}
  };
  const drawAR = (text: string, rightX: number, y: number, size: number, color = BLACK) => {
    if (!text) return;
    if (!arabicFont) throw new Error("[PDF] Cannot draw Arabic text without an Arabic font");
    try {
      const visual = prepareArabic(text);
      const textWidth = arabicFont.widthOfTextAtSize(visual, size);
      page.drawText(visual, { x: rightX - textWidth, y, size, color, font: arabicFont });
    } catch {}
  };
  const drawSmart = (text: string, leftX: number, rightX: number, y: number, size: number, color = BLACK, font = latinReg) => {
    if (!text) return;
    if (hasArabic(text)) drawAR(text, rightX, y, size, color);
    else drawL(text, leftX, y, size, color, font);
  };
  const rect = (x: number, y: number, w: number, h: number, color = LGRAY) =>
    page.drawRectangle({ x, y, width: w, height: h, color });
  const line = (x1: number, y1: number, x2: number, y2: number, thickness = 0.5, color = LGRAY) =>
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color });
  const date = receipt.createdAt
    ? new Date(receipt.createdAt).toLocaleDateString("ar-SA")
    : new Date().toLocaleDateString("ar-SA");
  const methodLabels: Record<string, string> = {
    bank_transfer: "تحويل بنكي", cash: "نقداً", paypal: "PayPal",
    stc_pay: "STC Pay", apple_pay: "Apple Pay", other: "أخرى",
  };

  let curY = height - 42;
  const headerH = 72;
  rect(0, curY - 16, width, headerH, BLACK);
  if (logoImage) {
    const scale = Math.min(90 / logoImage.width, 44 / logoImage.height);
    const lw = logoImage.width * scale;
    const lh = logoImage.height * scale;
    page.drawImage(logoImage, { x: 30, y: curY - 16 + (headerH - lh) / 2, width: lw, height: lh });
    drawL("qiroxstudio.online", 30 + lw + 8, curY + 18, 8, rgb(0.6, 0.6, 0.6));
  } else {
    drawL("QIROX", 30, curY + 20, 26, WHITE, latinBold);
    drawL("STUDIO", 108, curY + 22, 10, rgb(0.62, 0.62, 0.62));
  }
  drawL("RECEIPT VOUCHER", width - 150, curY + 20, 8, WHITE, latinBold);
  drawAR("سند قبض", width - 34, curY + 4, 10, WHITE);
  curY -= 86;

  drawL(`#${receipt.receiptNumber}`, MARGIN, curY, 16, BLACK, latinBold);
  drawL(`Date: ${date}`, width - 170, curY, 9, GRAY);
  if (receipt.invoiceNumber) drawL(`Invoice: ${receipt.invoiceNumber}`, width - 170, curY - 14, 9, GRAY);
  curY -= 36;

  const clientBoxH = receipt.clientEmail || receipt.clientPhone ? 66 : 50;
  rect(MARGIN, curY - clientBoxH + 8, width - MARGIN * 2, clientBoxH, PALE);
  drawL("Received from:", MARGIN + 12, curY - 12, 8, GRAY);
  drawSmart(receipt.clientName || "—", MARGIN + 12, width - MARGIN - 12, curY - 27, 12, BLACK, latinBold);
  if (receipt.clientEmail) drawL(receipt.clientEmail, MARGIN + 12, curY - 44, 8, GRAY);
  if (receipt.clientPhone) drawL(receipt.clientPhone, MARGIN + 230, curY - 44, 8, GRAY);
  curY -= clientBoxH + 18;

  rect(MARGIN, curY - 86, width - MARGIN * 2, 94, PALE);
  drawL("AMOUNT RECEIVED", MARGIN + 16, curY - 22, 8, GRAY, latinBold);
  const amountText = Number(receipt.amount || 0).toLocaleString("en-SA", { minimumFractionDigits: 2 });
  drawL(`${amountText} SAR`, MARGIN + 16, curY - 52, 25, BLACK, latinBold);
  if (receipt.amountInWords) drawSmart(receipt.amountInWords, MARGIN + 220, width - MARGIN - 16, curY - 50, 8, DGRAY);
  curY -= 112;

  const rows: Array<[string, string]> = [
    ["Payment method", methodLabels[receipt.paymentMethod] || receipt.paymentMethod || "—"],
  ];
  if (receipt.paymentRef) rows.push(["Transaction reference", receipt.paymentRef]);
  if (receipt.description) rows.push(["Description", receipt.description]);
  if (receipt.receivedBy) rows.push(["Received by", receipt.receivedBy]);
  if (receipt.bankName) rows.push(["Bank", receipt.bankName]);
  if (receipt.beneficiaryName) rows.push(["Beneficiary", receipt.beneficiaryName]);
  if (receipt.iban) rows.push(["IBAN", receipt.iban]);

  const rowH = 24;
  rows.forEach(([label, value], index) => {
    const y = curY - rowH * index;
    if (index % 2 === 0) rect(MARGIN, y - 7, width - MARGIN * 2, rowH, rgb(0.985, 0.985, 0.985));
    drawL(label, MARGIN + 10, y + 1, 8, GRAY);
    drawSmart(value, MARGIN + 170, width - MARGIN - 10, y + 1, 8, DGRAY);
  });
  curY -= rows.length * rowH + 18;

  if (receipt.notes) {
    rect(MARGIN, curY - 48, width - MARGIN * 2, 56, PALE);
    drawL("Notes:", MARGIN + 10, curY - 17, 8, GRAY);
    drawSmart(receipt.notes.slice(0, 180), MARGIN + 10, width - MARGIN - 10, curY - 34, 8, DGRAY);
    curY -= 70;
  }

  line(MARGIN, 58, width - MARGIN, 58);
  drawL("QIROX Studio", MARGIN, 42, 8, GRAY, latinBold);
  drawL("qiroxstudio.online", width / 2 - 40, 42, 8, GRAY);
  drawL("Electronic receipt", width - 118, 42, 8, GRAY);

  return pdfDoc.save();
}
