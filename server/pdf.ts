import { PDFDocument, PDFString, PDFName, rgb, StandardFonts, degrees } from "pdf-lib";
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
  projectDescription?: string;
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
  items?: { name: string; description?: string; qty: number; unitPrice: number; total: number }[];
  notes?: string;
  createdAt?: string;
  status?: string;
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
  projectDescription?: string;
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
  paidAt?: string;
  orderTitle?: string;
  status?: string;
  items?: { name: string; description?: string; qty: number; unitPrice: number; total: number }[];
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

export interface EmployeeWorkContractPdfData {
  contractNumber: string;
  employerName: string;
  employerLegalName?: string;
  employerCommercialReg?: string;
  employeeName: string;
  employeeNationalId?: string;
  employeeRole: string;
  jobTitle: string;
  salaryDescription: string;
  startDate: Date | string;
  contractType: "fixed" | "indefinite";
  endDate?: Date | string | null;
  workLocation: string;
  weeklyHours: number;
  probationDays: number;
  jurisdiction?: string;
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

function loadFinanceAsset(fileName: string): Buffer {
  const candidates = [
    path.resolve(process.cwd(), "client/public", fileName),
    path.resolve(process.cwd(), "dist/public", fileName),
    path.resolve(process.cwd(), "public", fileName),
    path.resolve(moduleDir, "../client/public", fileName),
    path.resolve(moduleDir, "public", fileName),
  ];
  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) return fs.readFileSync(filePath);
    } catch (error: any) {
      console.error(`[PDF] Could not read finance asset ${fileName} at ${filePath}:`, error?.message || error);
    }
  }
  throw new Error(`[PDF] Required finance artwork is missing: ${fileName}. Checked ${candidates.join(", ")}`);
}

async function embedFinanceAssets(pdfDoc: PDFDocument) {
  const [header, bankLogo, approval, footer, watermark] = await Promise.all([
    "finance-document-header.png",
    "finance-bank-logo.png",
    "finance-document-approval.png",
    "finance-document-footer.png",
    "qirox-icon-watermark.png",
  ].map(async (fileName) => pdfDoc.embedPng(loadFinanceAsset(fileName))));
  return { header, bankLogo, approval, footer, watermark };
}

const ARABIC_CHAR_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const hasArabic = (t: string) => ARABIC_CHAR_RE.test(t);
const hasLatinOrNumber = (t: string) => /[A-Za-z0-9]/.test(t);
const TERMS_PATH = "/terms";

function formatPdfDate(value?: string | Date | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const parts = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Riyadh",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}/${values.month}/${values.day}`;
}

function isArabicChar(char: string): boolean {
  return ARABIC_CHAR_RE.test(char);
}

function splitMixedText(text: string): Array<{ text: string; arabic: boolean }> {
  const runs: Array<{ text: string; arabic: boolean }> = [];
  let current = "";
  let currentDirection: boolean | null = null;

  for (const char of text) {
    const arabic = isArabicChar(char);
    const latinOrNumber = /[A-Za-z0-9]/.test(char);
    const strongDirection = arabic ? true : latinOrNumber ? false : currentDirection;

    // Spaces and punctuation stay with the current script run. This keeps
    // Arabic words together instead of reversing them one word at a time.
    if (strongDirection !== null && currentDirection !== null && strongDirection !== currentDirection) {
      const trimmed = current.trim();
      if (trimmed) runs.push({ text: trimmed, arabic: currentDirection });
      current = "";
    }
    current += char;
    if (strongDirection !== null) currentDirection = strongDirection;
  }

  const trimmed = current.trim();
  if (trimmed) runs.push({ text: trimmed, arabic: !!currentDirection });
  return runs;
}

function measureMixedText(
  text: string,
  size: number,
  latinFont: any,
  arabicFont: any,
): number {
  const runs = splitMixedText(text);
  const separatorWidth = arabicFont.widthOfTextAtSize(" ", size);
  return runs.reduce((width, run, index) => {
    const visual = run.arabic ? prepareArabic(run.text) : run.text;
    // The embedded document font is used for mixed-script runs so punctuation,
    // currency symbols, Latin text, and Arabic all share a complete glyph set.
    return width + arabicFont.widthOfTextAtSize(visual, size) + (index > 0 ? separatorWidth : 0);
  }, 0);
}

function drawMixedText(
  page: any,
  text: string,
  rightX: number,
  y: number,
  size: number,
  color: any,
  arabicFont: any,
): void {
  const visualRuns = [...splitMixedText(text)].reverse();
  const separatorWidth = arabicFont.widthOfTextAtSize(" ", size);
  const totalWidth = visualRuns.reduce((width, run) => {
    const visual = run.arabic ? prepareArabic(run.text) : run.text;
    return width + arabicFont.widthOfTextAtSize(visual, size);
  }, 0) + Math.max(0, visualRuns.length - 1) * separatorWidth;
  let x = rightX - totalWidth;

  visualRuns.forEach((run, index) => {
    const visual = run.arabic ? prepareArabic(run.text) : run.text;
    const width = arabicFont.widthOfTextAtSize(visual, size);
    page.drawText(visual, { x, y, size, color, font: arabicFont });
    x += width;
    if (index < visualRuns.length - 1) x += separatorWidth;
  });
}

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
      return measureMixedText(value, size, latinFont, arabicFont);
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

function drawPdfBrandWatermark(page: any, width: number, height: number, artwork: any) {
  const imageWidth = width * 0.64;
  const imageHeight = imageWidth * (artwork.height / artwork.width);
  page.drawImage(artwork, {
    x: -38,
    y: height * 0.27,
    width: imageWidth,
    height: imageHeight,
    opacity: 0.035,
    rotate: degrees(-15),
  });
}

function drawPdfBrandSeal(
  page: any,
  centerX: number,
  centerY: number,
  diameter: number,
  boldFont: any,
  regularFont: any,
) {
  const blue = rgb(0.1, 0.28, 0.58);
  const radius = diameter / 2;
  page.drawEllipse({
    x: centerX,
    y: centerY,
    xScale: radius,
    yScale: radius,
    color: rgb(1, 1, 1),
    borderColor: blue,
    borderWidth: 1.5,
  });
  page.drawEllipse({
    x: centerX,
    y: centerY,
    xScale: radius - 4,
    yScale: radius - 4,
    borderColor: blue,
    borderWidth: 0.6,
  });
  const qSize = diameter * 0.37;
  page.drawText("Q", {
    x: centerX - boldFont.widthOfTextAtSize("Q", qSize) / 2,
    y: centerY - qSize * 0.42,
    size: qSize,
    font: boldFont,
    color: blue,
  });
  const brand = "QIROX STUDIO";
  const brandSize = Math.max(5, diameter * 0.075);
  page.drawText(brand, {
    x: centerX - boldFont.widthOfTextAtSize(brand, brandSize) / 2,
    y: centerY + radius * 0.48,
    size: brandSize,
    font: boldFont,
    color: blue,
  });
  const tagline = "BUILD / SHIP / HUMAN";
  const taglineSize = Math.max(4, diameter * 0.052);
  page.drawText(tagline, {
    x: centerX - regularFont.widthOfTextAtSize(tagline, taglineSize) / 2,
    y: centerY - radius * 0.62,
    size: taglineSize,
    font: regularFont,
    color: blue,
  });
}

function drawFinanceHeader(
  page: any,
  artwork: any,
  primaryTitle: string,
  secondaryTitle: string,
  replaceArtworkTitle: boolean,
  arabicFont: any,
  latinBold: any,
  latinReg: any,
) {
  const { width, height } = page.getSize();
  const headerHeight = (width * artwork.height) / artwork.width;
  page.drawImage(artwork, { x: 0, y: height - headerHeight, width, height: headerHeight });
  if (!replaceArtworkTitle) return headerHeight;

  const coverWidth = width * 0.36;
  const coverX = width - coverWidth;
  page.drawRectangle({
    x: coverX,
    y: height - headerHeight,
    width: coverWidth,
    height: headerHeight,
    color: rgb(0.067, 0.071, 0.078),
  });

  const primaryIsArabic = hasArabic(primaryTitle);
  const primaryFont = primaryIsArabic ? arabicFont : latinBold;
  const primaryVisual = primaryIsArabic ? prepareArabic(primaryTitle) : primaryTitle;
  const primarySize = primaryIsArabic ? 13 : 11;
  if (primaryFont && primaryVisual) {
    const textWidth = primaryFont.widthOfTextAtSize(primaryVisual, primarySize);
    page.drawText(primaryVisual, {
      x: width - 19 - textWidth,
      y: height - headerHeight * 0.49,
      size: primarySize,
      font: primaryFont,
      color: rgb(1, 1, 1),
    });
  }

  const secondaryIsArabic = hasArabic(secondaryTitle);
  const secondaryFont = secondaryIsArabic ? arabicFont : latinReg;
  const secondaryVisual = secondaryIsArabic ? prepareArabic(secondaryTitle) : secondaryTitle;
  const secondarySize = secondaryIsArabic ? 7 : 7;
  if (secondaryFont && secondaryVisual) {
    const textWidth = secondaryFont.widthOfTextAtSize(secondaryVisual, secondarySize);
    page.drawText(secondaryVisual, {
      x: width - 19 - textWidth,
      y: height - headerHeight * 0.77,
      size: secondarySize,
      font: secondaryFont,
      color: rgb(0.72, 0.73, 0.75),
    });
  }
  return headerHeight;
}

function drawFinanceApprovalArt(page: any, artwork: any, y: number, scale = 1) {
  const { width } = page.getSize();
  const naturalWidth = width * (362 / 900);
  const imageWidth = naturalWidth * scale;
  const imageHeight = imageWidth * (artwork.height / artwork.width);
  page.drawImage(artwork, {
    x: width * (400 / 900) + (naturalWidth - imageWidth) / 2,
    y,
    width: imageWidth,
    height: imageHeight,
  });
}

function drawPdfBankBuildingIcon(page: any, x: number, y: number, color: any) {
  const line = (x1: number, y1: number, x2: number, y2: number) =>
    page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness: 0.8,
      color,
    });
  line(x, y + 1, x + 14, y + 1);
  line(x + 1, y + 2, x + 1, y + 9);
  line(x + 13, y + 2, x + 13, y + 9);
  line(x, y + 10, x + 7, y + 15);
  line(x + 7, y + 15, x + 14, y + 10);
  line(x + 2, y + 9, x + 12, y + 9);
  [3, 6, 9, 12].forEach((offset) => line(x + offset, y + 2, x + offset, y + 8));
}

function drawPdfCopyIcon(page: any, x: number, y: number, color: any) {
  page.drawRectangle({
    x: x + 3,
    y: y + 2,
    width: 7,
    height: 9,
    borderColor: color,
    borderWidth: 0.65,
  });
  page.drawRectangle({
    x,
    y,
    width: 7,
    height: 9,
    borderColor: color,
    borderWidth: 0.65,
  });
}

function drawPdfInfoIcon(page: any, x: number, y: number, font: any, color: any) {
  page.drawEllipse({
    x: x + 5,
    y: y + 5,
    xScale: 5,
    yScale: 5,
    borderColor: color,
    borderWidth: 0.65,
  });
  page.drawText("i", { x: x + 3.5, y: y + 1.6, size: 6, font, color });
}

function drawFinanceFooterArt(page: any, artwork: any) {
  const { width } = page.getSize();
  const height = (width * artwork.height) / artwork.width;
  page.drawImage(artwork, { x: 0, y: 0, width, height });
}

export async function generateQuotationPdf(q: QuotationData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const financeArtwork = await embedFinanceAssets(pdfDoc);

  /* fonts */
  const arabicFont = await embedArabicFont(pdfDoc, "quotation");
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica     = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();
  drawPdfBrandWatermark(page, width, height, financeArtwork.watermark);

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
    if (hasArabic(txt)) {
      if (hasLatinOrNumber(txt)) {
        drawMixedText(page, txt, rightX, y, size, color, arabicFont);
      } else {
        drawAR(txt, rightX, y, size, color);
      }
    }
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
  const headerH = drawFinanceHeader(
    page,
    financeArtwork.header,
    q.language === "en" ? "QUOTATION" : "عرض سعر",
    q.language === "en" ? "QUOTATION" : "QUOTATION",
    false,
    arabicFont,
    latinBold,
    latinReg,
  );
  curY = height - headerH - 20;

  /* ── Document metadata and client details ── */
  const metaTop = curY;
  const dividerX = MARGIN + pageW / 2;
  const leftMetaRight = dividerX - 12;
  const recipientLeft = dividerX + 14;
  const recipientRight = width - MARGIN;
  const quotationNumberText = `#${q.quotationNumber}`;
  const quotationStatusWidth = q.status ? 48 : 0;
  const quotationNumberLimit = leftMetaRight - MARGIN - (quotationStatusWidth ? quotationStatusWidth + 8 : 0);
  const quotationNumberBaseWidth = latinBold.widthOfTextAtSize(quotationNumberText, 16);
  const quotationNumberSize = Math.max(
    9,
    Math.min(16, 16 * Math.min(1, quotationNumberLimit / quotationNumberBaseWidth)),
  );
  const quotationNumberWidth = latinBold.widthOfTextAtSize(quotationNumberText, quotationNumberSize);
  drawL(quotationNumberText, MARGIN, metaTop, quotationNumberSize, BLACK, latinBold);
  if (q.status) {
    const statusDetails: Record<string, { label: string; color: any }> = {
      draft: { label: q.language === "en" ? "Draft" : "مسودة", color: rgb(0.5, 0.5, 0.5) },
      sent: { label: q.language === "en" ? "Sent" : "مُرسل", color: rgb(0.11, 0.3, 0.68) },
      accepted: { label: q.language === "en" ? "Accepted" : "مقبول", color: rgb(0.13, 0.55, 0.27) },
      rejected: { label: q.language === "en" ? "Rejected" : "مرفوض", color: rgb(0.72, 0.12, 0.12) },
      expired: { label: q.language === "en" ? "Expired" : "منتهي الصلاحية", color: rgb(0.76, 0.3, 0.05) },
    };
    const status = statusDetails[q.status];
    if (status) {
      const statusX = MARGIN + quotationNumberWidth + 8;
      drawRect(statusX, metaTop - 3, 48, 17, rgb(0.94, 0.94, 0.93));
      drawSmart(status.label, statusX + 3, statusX + 45, metaTop + 2, 6.5, status.color, latinBold);
    }
  }
  drawLine(dividerX, metaTop + 5, dividerX, metaTop - 67, 0.45, rgb(0.88, 0.88, 0.87));
  const dateRows: Array<[string, string]> = [
    [labels.date, formatPdfDate(q.createdAt)],
    ...(q.validUntil ? [[labels.validUntil, formatPdfDate(q.validUntil)] as [string, string]] : []),
  ];
  dateRows.forEach(([label, value], index) => {
    const y = metaTop - 23 - index * 15;
    drawRect(MARGIN + 1, y + 1, 6, 6, rgb(0.68, 0.69, 0.7));
    drawL(value, MARGIN + 13, y, 7.5, DGRAY, latinReg);
    drawSmart(label, MARGIN + 70, leftMetaRight, y, 7, GRAY, latinReg);
  });

  drawSmart(labels.preparedFor, recipientLeft, recipientRight, metaTop, 7, GRAY, latinReg);
  drawSmart(q.clientName || "—", recipientLeft, recipientRight, metaTop - 17, 11, BLACK, latinBold);
  let recipientY = metaTop - 31;
  const recipientDetails = [
    q.clientEmail,
    q.clientPhone,
    q.clientOrganization && `${labels.organization}: ${q.clientOrganization}`,
    q.clientTaxNumber && `${labels.tax}: ${q.clientTaxNumber}`,
    q.clientCommercialReg && `${labels.commercialReg}: ${q.clientCommercialReg}`,
    [q.clientAddress, q.clientCity].filter(Boolean).join(", "),
  ].filter((detail): detail is string => Boolean(detail));
  recipientDetails.forEach((detail) => {
    drawSmart(detail, recipientLeft, recipientRight, recipientY, 7, DGRAY, latinReg);
    recipientY -= 10;
  });
  curY = metaTop - Math.max(75, 40 + recipientDetails.length * 10) - 7;

  /* ── Project panel ── */
  const projectTitle = q.title?.trim();
  const projectDescription = q.projectDescription?.trim();
  if (projectTitle || projectDescription) {
    const projectLines = projectDescription
      ? wrapPdfText(projectDescription, pageW - 24, 7, latinReg, arabicFont).slice(0, 4)
      : [];
    const projectHeight = Math.max(58, 35 + projectLines.length * 9);
    drawRect(MARGIN, curY - projectHeight, pageW, projectHeight, rgb(0.96, 0.96, 0.95));
    drawSmart(q.language === "en" ? "Project" : "المشروع", MARGIN + 12, width - MARGIN - 12, curY - 15, 7, GRAY, latinReg);
    if (projectTitle) drawSmart(projectTitle, MARGIN + 12, width - MARGIN - 12, curY - 31, 10, DGRAY, latinBold);
    projectLines.forEach((line, index) => {
      drawSmart(line, MARGIN + 12, width - MARGIN - 12, curY - 44 - index * 9, 7, GRAY, latinReg);
    });
    curY -= projectHeight + 27;
  }

  /* ── Items table ── */
  const items = q.items || [];
  const tableX   = MARGIN;
  const tableW   = pageW;
   const colWidths = [tableW * 0.19, tableW * 0.19, tableW * 0.13, tableW * 0.42, tableW * 0.07];
   const cols = [
     tableX,
     tableX + colWidths[0],
     tableX + colWidths[0] + colWidths[1],
     tableX + colWidths[0] + colWidths[1] + colWidths[2],
     tableX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
   ];

  /* Header row */
  drawRect(tableX, curY - 20, tableW, 24, BLACK);
   drawSmart(labels.total, cols[0] + 6, cols[1] - 6, curY - 12, 8, WHITE, latinBold);
   drawSmart(labels.unitPrice, cols[1] + 6, cols[2] - 6, curY - 12, 8, WHITE, latinBold);
   drawSmart(labels.quantity, cols[2] + 6, cols[3] - 6, curY - 12, 8, WHITE, latinBold);
   drawSmart(labels.item, cols[3] + 6, cols[4] - 6, curY - 12, 8, WHITE, latinBold);
   drawSmart("#", cols[4] + 6, tableX + tableW - 6, curY - 12, 8, WHITE, latinBold);
  curY -= 26;

  /* Data rows */
   items.forEach((item, idx) => {
    const rowBg = idx % 2 === 0 ? WHITE : rgb(0.97, 0.97, 0.97);

     const name = item.name || "—";
      const description = typeof item.description === "string" ? item.description.trim() : "";
      const nameLines = wrapPdfText(name, cols[4] - cols[3] - 12, 8, latinReg, arabicFont).slice(0, 2);
      const descriptionLines = description
         ? wrapPdfText(description, cols[4] - cols[3] - 12, 7, latinReg, arabicFont).slice(0, 4)
        : [];
      const rowH = Math.max(34, (nameLines.length * 11) + (descriptionLines.length * 10) + 18);
     drawRect(tableX, curY - rowH + 4, tableW, rowH, rowBg);
     nameLines.slice(0, 3).forEach((line, lineIndex) => {
        drawSmart(line, cols[3] + 6, cols[4] - 6, curY - 12 - lineIndex * 10, 8, DGRAY);
     });
      descriptionLines.forEach((line, lineIndex) => {
        drawSmart(
          line,
          cols[3] + 6,
          cols[4] - 6,
          curY - 12 - nameLines.length * 10 - lineIndex * 9,
          7,
          GRAY,
        );
      });
    drawL(Number(item.total || 0).toLocaleString("en-SA"),     cols[0] + 6, curY - 12, 8, DGRAY, latinReg);
    drawL(Number(item.unitPrice || 0).toLocaleString("en-SA"), cols[1] + 6, curY - 12, 8, DGRAY, latinReg);
    drawL(String(item.qty),                       cols[2] + 6, curY - 12, 8, DGRAY, latinReg);
    drawL(String(idx + 1),                         cols[4] + 6, curY - 12, 8, DGRAY, latinReg);
    curY -= rowH;
  });

  drawLine(tableX, curY, tableX + tableW, curY, 0.5, LGRAY);
  curY -= 14;

  /* ── Totals ── */
   const totalsW = pageW / 2 - 6;
   const totalsX = width - MARGIN - totalsW;
   const totalsHeroW = totalsX - MARGIN - 12;
  const quotationTotalText = q.totalAmount.toLocaleString("en-SA", { minimumFractionDigits: 2 });
    drawRect(MARGIN, curY - 92, totalsHeroW, 94, rgb(0.98, 0.976, 0.961));
   drawSmart(labels.total, MARGIN + 10, MARGIN + totalsHeroW - 10, curY - 19, 8, GRAY, latinBold);
  drawL(
    quotationTotalText,
    MARGIN + (totalsHeroW - latinBold.widthOfTextAtSize(quotationTotalText, 20)) / 2,
     curY - 56,
    20,
    BLACK,
    latinBold,
  );
   drawL("SAR", MARGIN + (totalsHeroW - latinReg.widthOfTextAtSize("SAR", 7)) / 2, curY - 75, 7, GRAY, latinReg);

  const addTotalRow = (label: string, value: string, bold = false, bgColor?: any) => {
    if (bgColor) drawRect(totalsX, curY - 16, totalsW, 22, bgColor);
    const f = bold ? latinBold : latinReg;
    const c = bold ? BLACK : GRAY;
     drawSmart(label, totalsX + 6, totalsX + totalsW - 74, curY - 8, 8, c, f);
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
    drawSmart(labels.total, totalsX + 6, totalsX + totalsW - 74, totalY - 8, 8, WHITE, latinBold);
   drawL(totalStr, totalsX + totalsW - 6 - latinBold.widthOfTextAtSize(totalStr, 8), totalY - 8, 8, WHITE, latinBold);
  curY -= 20;

  /* ── Bank details and terms panels ── */
  const terms = [
    q.notes && `${labels.notes.replace(/:$/, "")}: ${q.notes}`,
    q.paymentTerms && `${labels.paymentTerms} ${q.paymentTerms}`,
    q.termsAndConditions,
  ].filter((value): value is string => Boolean(value?.trim()));
  const infoGap = 12;
  const bankWidth = (pageW - infoGap) * 0.53;
  const termsWidth = pageW - infoGap - bankWidth;
  const termsLines = terms.flatMap((term) => wrapPdfText(term, termsWidth - 22, 7, latinReg, arabicFont));
  const bankRowsCount = 3 + Number(Boolean(q.accountNumber));
  const infoPanelHeight = Math.max(104 + Math.max(0, bankRowsCount - 3) * 14, 38 + termsLines.length * 10);
  const infoPanelTop = curY - 8;
  const bankX = tableX;
  const termsX = tableX + bankWidth + infoGap;
  drawRect(bankX, infoPanelTop - infoPanelHeight, bankWidth, infoPanelHeight, rgb(0.96, 0.96, 0.95));
  drawRect(termsX, infoPanelTop - infoPanelHeight, termsWidth, infoPanelHeight, rgb(0.96, 0.96, 0.95));

  drawRect(bankX, infoPanelTop - 43, bankWidth, 43, rgb(0.94, 0.94, 0.93));
  drawRect(bankX + 9, infoPanelTop - 36, 26, 26, rgb(0.89, 0.89, 0.88));
  drawPdfBankBuildingIcon(page, bankX + 15, infoPanelTop - 32, GRAY);
  const isRajhiBank = /al\s?rajhi|الراجحي/i.test(q.bankName || "");
  const bankTitleRight = isRajhiBank ? bankX + bankWidth - 118 : bankX + bankWidth - 10;
  drawSmart(labels.bankDetails.replace(/:$/, ""), bankX + 43, bankTitleRight, infoPanelTop - 25, 8, DGRAY, latinBold);
  if (isRajhiBank) {
    const logoWidth = 94;
    page.drawImage(financeArtwork.bankLogo, {
      x: bankX + bankWidth - 104,
      y: infoPanelTop - 36,
      width: logoWidth,
      height: logoWidth * (financeArtwork.bankLogo.height / financeArtwork.bankLogo.width),
    });
  }

  const bankRows: Array<[string, string]> = [
    ["اسم الحساب", q.beneficiaryName || "—"],
    ["رقم الآيبان (IBAN)", q.iban || "—"],
    ["اسم البنك", q.bankName || "—"],
  ];
  if (q.accountNumber) bankRows.push(["رقم الحساب", q.accountNumber]);
  bankRows.forEach(([label, value], index) => {
    const y = infoPanelTop - 50 - index * 12;
    drawSmart(label, bankX + 10, bankX + 92, y, 6.5, GRAY, latinReg);
    if (index === 1) {
      drawPdfCopyIcon(page, bankX + 96, y - 1, GRAY);
      drawSmart(value, bankX + 110, bankX + bankWidth - 10, y, 7, DGRAY, latinReg);
    } else {
      drawSmart(value, bankX + 96, bankX + bankWidth - 10, y, 7, DGRAY, latinReg);
    }
    if (index < bankRows.length - 1) {
      drawLine(bankX + 96, y - 3, bankX + bankWidth - 8, y - 3, 0.35, rgb(0.86, 0.86, 0.85));
    }
  });
  const transferNoteY = infoPanelTop - infoPanelHeight + 12;
  drawRect(bankX + 8, infoPanelTop - infoPanelHeight + 6, bankWidth - 16, 20, rgb(0.92, 0.92, 0.91));
  drawPdfInfoIcon(page, bankX + bankWidth - 20, transferNoteY - 1, latinBold, GRAY);
  drawSmart(
    "عند التحويل يرجى إرسال صورة الإشعار مع رقم العرض عبر الواتساب أو البريد الإلكتروني.",
    bankX + 10,
    bankX + bankWidth - 28,
    transferNoteY,
    6,
    GRAY,
    latinReg,
  );

  drawSmart(q.language === "en" ? "Terms & Conditions" : "الشروط والأحكام", termsX + 10, termsX + termsWidth - 10, infoPanelTop - 17, 8, DGRAY, latinBold);
  termsLines.forEach((line, index) => {
    drawSmart(`• ${line}`, termsX + 10, termsX + termsWidth - 10, infoPanelTop - 34 - index * 10, 7, GRAY, latinReg);
  });
  curY = infoPanelTop - infoPanelHeight - 10;

  /* ── Footer ── */
  const approvalBottom = Math.max(78, Math.min(curY - 126, 84));
  drawFinanceApprovalArt(page, financeArtwork.approval, approvalBottom);
  drawFinanceFooterArt(page, financeArtwork.footer);

  return pdfDoc.save();
}

/* ────────────────────────────────────────────────────────────────────
 * generateInvoicePdf — formal invoice PDF (mirrors quotation layout
 * but says INVOICE and shows status / due date)
 * ──────────────────────────────────────────────────────────────────── */
export async function generateInvoicePdf(inv: InvoiceData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const financeArtwork = await embedFinanceAssets(pdfDoc);

  const arabicFont = await embedArabicFont(pdfDoc, "invoice");
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica     = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();
  drawPdfBrandWatermark(page, width, height, financeArtwork.watermark);

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
    if (hasArabic(t)) {
      if (hasLatinOrNumber(t)) {
        drawMixedText(page, t, rightX, y, s, c, arabicFont);
      } else {
        drawAR(t, rightX, y, s, c);
      }
    } else {
      drawL(t, leftX, y, s, c, lf);
    }
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
  const headerH = drawFinanceHeader(
    page,
    financeArtwork.header,
    inv.language === "en" ? "TAX INVOICE" : "فاتورة ضريبية",
    "INVOICE",
    true,
    arabicFont,
    latinBold,
    latinReg,
  );
  curY = height - headerH - 20;

  /* Document metadata and client details */
  const metaTop = curY;
  const dividerX = MARGIN + pageW / 2;
  const leftMetaRight = dividerX - 12;
  const recipientLeft = dividerX + 14;
  const recipientRight = width - MARGIN;

  const invoiceNumberText = `#${inv.invoiceNumber}`;
  const invoiceStatusWidth = inv.status ? 58 : 0;
  const invoiceNumberLimit = leftMetaRight - MARGIN - (invoiceStatusWidth ? invoiceStatusWidth + 8 : 0);
  const invoiceNumberBaseWidth = latinBold.widthOfTextAtSize(invoiceNumberText, 16);
  const invoiceNumberSize = Math.max(
    9,
    Math.min(16, 16 * Math.min(1, invoiceNumberLimit / invoiceNumberBaseWidth)),
  );
  const invoiceNumberWidth = latinBold.widthOfTextAtSize(invoiceNumberText, invoiceNumberSize);
  drawL(invoiceNumberText, MARGIN, metaTop, invoiceNumberSize, BLACK, latinBold);
  if (inv.status) {
    const stColor = inv.status === "paid" ? GREEN : inv.status === "cancelled" ? RED : DGRAY;
    const stLabel = inv.status === "paid" ? labels.paid : inv.status === "cancelled" ? labels.cancelled : labels.unpaid;
    const statusX = MARGIN + invoiceNumberWidth + 8;
    drawRect(statusX, metaTop - 3, 58, 17, rgb(0.94, 0.94, 0.93));
    drawSmart(stLabel, statusX + 3, statusX + 55, metaTop + 2, 6.5, stColor, latinBold);
  }
  drawLine(dividerX, metaTop + 5, dividerX, metaTop - 67, 0.45, rgb(0.88, 0.88, 0.87));
  const invoiceDateRows: Array<[string, string]> = [
    [labels.date, formatPdfDate(inv.createdAt)],
    ...(inv.dueDate ? [[labels.due, formatPdfDate(inv.dueDate)] as [string, string]] : []),
    ...(inv.paidAt
      ? [[inv.language === "en" ? "Payment date" : "تاريخ السداد", formatPdfDate(inv.paidAt)] as [string, string]]
      : []),
  ];
  invoiceDateRows.forEach(([label, value], index) => {
    const y = metaTop - 23 - index * 15;
    drawRect(MARGIN + 1, y + 1, 6, 6, rgb(0.68, 0.69, 0.7));
    drawL(value, MARGIN + 13, y, 7.5, DGRAY, latinReg);
    drawSmart(label, MARGIN + 70, leftMetaRight, y, 7, GRAY, latinReg);
  });

  drawSmart(labels.billedTo, recipientLeft, recipientRight, metaTop, 7, GRAY, latinReg);
  drawSmart(inv.clientName || "—", recipientLeft, recipientRight, metaTop - 17, 11, BLACK, latinBold);
  let recipientY = metaTop - 31;
  const recipientDetails = [
    inv.clientEmail,
    inv.clientPhone,
    inv.clientOrganization && `${labels.organization}: ${inv.clientOrganization}`,
    inv.clientTaxNumber && `${labels.tax}: ${inv.clientTaxNumber}`,
    inv.clientCommercialReg && `${labels.commercialReg}: ${inv.clientCommercialReg}`,
    [inv.clientAddress, inv.clientCity].filter(Boolean).join(", "),
  ].filter((detail): detail is string => Boolean(detail));
  recipientDetails.forEach((detail) => {
    drawSmart(detail, recipientLeft, recipientRight, recipientY, 7, DGRAY, latinReg);
    recipientY -= 10;
  });
  curY = metaTop - Math.max(75, 40 + recipientDetails.length * 10) - 7;

  /* Linked order / project panel */
  const projectTitle = inv.orderTitle || inv.title?.trim();
  const projectDescription = inv.orderTitle && inv.title !== inv.orderTitle
    ? inv.title?.trim()
    : inv.projectDescription?.trim();
  if (projectTitle || projectDescription) {
    const projectLines = projectDescription
      ? wrapPdfText(projectDescription, pageW - 24, 7, latinReg, arabicFont).slice(0, 4)
      : [];
    const projectHeight = Math.max(58, 35 + projectLines.length * 9);
    drawRect(MARGIN, curY - projectHeight, pageW, projectHeight, rgb(0.96, 0.96, 0.95));
    const projectLabel = inv.orderTitle
      ? (inv.language === "en" ? "Linked order" : "مرتبطة بالطلب")
      : (inv.language === "en" ? "Project" : "المشروع");
    drawSmart(projectLabel, MARGIN + 12, width - MARGIN - 12, curY - 15, 7, GRAY, latinReg);
    if (projectTitle) drawSmart(projectTitle, MARGIN + 12, width - MARGIN - 12, curY - 31, 10, DGRAY, latinBold);
    projectLines.forEach((line, index) => {
      drawSmart(line, MARGIN + 12, width - MARGIN - 12, curY - 44 - index * 9, 7, GRAY, latinReg);
    });
    curY -= projectHeight + 27;
  }

  /* Items table */
  const items = inv.items || [];
  const tableX = MARGIN;
  const tableW = pageW;
   const colWidths = [tableW * 0.19, tableW * 0.19, tableW * 0.13, tableW * 0.42, tableW * 0.07];
   const cols = [
     tableX,
     tableX + colWidths[0],
     tableX + colWidths[0] + colWidths[1],
     tableX + colWidths[0] + colWidths[1] + colWidths[2],
     tableX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
   ];

  drawRect(tableX, curY - 20, tableW, 24, BLACK);
   drawSmart(labels.total, cols[0] + 6, cols[1] - 6, curY - 12, 8, WHITE, latinBold);
   drawSmart(labels.unitPrice, cols[1] + 6, cols[2] - 6, curY - 12, 8, WHITE, latinBold);
   drawSmart(labels.quantity, cols[2] + 6, cols[3] - 6, curY - 12, 8, WHITE, latinBold);
   drawSmart(labels.item, cols[3] + 6, cols[4] - 6, curY - 12, 8, WHITE, latinBold);
   drawSmart("#", cols[4] + 6, tableX + tableW - 6, curY - 12, 8, WHITE, latinBold);
  curY -= 26;

  items.forEach((item, idx) => {
    const rowBg = idx % 2 === 0 ? WHITE : rgb(0.97, 0.97, 0.97);
     const name = item.name || "—";
      const description = typeof item.description === "string" ? item.description.trim() : "";
       const nameLines = wrapPdfText(name, cols[4] - cols[3] - 12, 8, latinReg, arabicFont).slice(0, 2);
      const descriptionLines = description
         ? wrapPdfText(description, cols[4] - cols[3] - 12, 7, latinReg, arabicFont).slice(0, 4)
        : [];
      const rowH = Math.max(34, (nameLines.length * 11) + (descriptionLines.length * 10) + 18);
     drawRect(tableX, curY - rowH + 4, tableW, rowH, rowBg);
     nameLines.slice(0, 3).forEach((line, lineIndex) => {
        drawSmart(line, cols[3] + 6, cols[4] - 6, curY - 12 - lineIndex * 10, 8, DGRAY);
     });
      descriptionLines.forEach((line, lineIndex) => {
        drawSmart(
          line,
          cols[3] + 6,
          cols[4] - 6,
          curY - 12 - nameLines.length * 10 - lineIndex * 9,
          7,
          GRAY,
        );
      });
    drawL(Number(item.total || 0).toLocaleString("en-SA"), cols[0] + 6, curY - 12, 8, DGRAY, latinReg);
    drawL(Number(item.unitPrice || 0).toLocaleString("en-SA"), cols[1] + 6, curY - 12, 8, DGRAY, latinReg);
    drawL(String(item.qty), cols[2] + 6, curY - 12, 8, DGRAY, latinReg);
    drawL(String(idx + 1), cols[4] + 6, curY - 12, 8, DGRAY, latinReg);
    curY -= rowH;
  });

  drawLine(tableX, curY, tableX + tableW, curY, 0.5, LGRAY);
  curY -= 14;

  /* Totals */
  const totalsW = pageW / 2 - 6;
  const totalsX = width - MARGIN - totalsW;
  const totalsHeroW = totalsX - MARGIN - 12;
  const invoiceTotalText = inv.totalAmount.toLocaleString("en-SA", { minimumFractionDigits: 2 });
  drawRect(MARGIN, curY - 92, totalsHeroW, 94, rgb(0.98, 0.976, 0.961));
  drawSmart(labels.total, MARGIN + 10, MARGIN + totalsHeroW - 10, curY - 19, 8, GRAY, latinBold);
  drawL(
    invoiceTotalText,
    MARGIN + (totalsHeroW - latinBold.widthOfTextAtSize(invoiceTotalText, 20)) / 2,
    curY - 56,
    20,
    BLACK,
    latinBold,
  );
  drawL("SAR", MARGIN + (totalsHeroW - latinReg.widthOfTextAtSize("SAR", 7)) / 2, curY - 75, 7, GRAY, latinReg);
  const subtotal = inv.amount ?? (inv.totalAmount - (inv.vatAmount ?? 0));
  const addRow = (label: string, value: string, bold = false, bg?: any) => {
    if (bg) drawRect(totalsX, curY - 16, totalsW, 22, bg);
    const f = bold ? latinBold : latinReg;
    const c = bold ? (bg ? WHITE : BLACK) : GRAY;
     drawSmart(label, totalsX + 6, totalsX + totalsW - 74, curY - 8, 8, c, f);
    drawL(value, totalsX + totalsW - 6 - f.widthOfTextAtSize(value, 8), curY - 8, 8, c, f);
    curY -= 20;
  };
   addRow(labels.subtotal, subtotal.toLocaleString("en-SA", { minimumFractionDigits: 2 }));
   if (Number(inv.discountAmount || 0) > 0) {
     addRow(labels.discount, `-${Number(inv.discountAmount).toLocaleString("en-SA", { minimumFractionDigits: 2 })}`);
   }
   addRow(`${labels.vat} ${inv.vatRate ?? 15}%`, (inv.vatAmount ?? 0).toLocaleString("en-SA", { minimumFractionDigits: 2 }));
   addRow(labels.total, inv.totalAmount.toLocaleString("en-SA", { minimumFractionDigits: 2 }), true, BLACK);

  /* Notes and bank details use the same two-card composition as quotations. */
  const infoGap = 12;
  const bankWidth = (pageW - infoGap) * 0.53;
  const notesWidth = pageW - infoGap - bankWidth;
  const noteLines = inv.notes
    ? wrapPdfText(inv.notes, notesWidth - 22, 7, latinReg, arabicFont)
    : [];
  const bankRowsCount = 3 + Number(Boolean(inv.accountNumber));
  const infoPanelHeight = Math.max(104 + Math.max(0, bankRowsCount - 3) * 14, 38 + noteLines.length * 10);
  const infoPanelTop = curY - 8;
  const bankX = tableX;
  const notesX = tableX + bankWidth + infoGap;
  drawRect(bankX, infoPanelTop - infoPanelHeight, bankWidth, infoPanelHeight, rgb(0.96, 0.96, 0.95));
  drawRect(notesX, infoPanelTop - infoPanelHeight, notesWidth, infoPanelHeight, rgb(0.96, 0.96, 0.95));

  drawRect(bankX, infoPanelTop - 43, bankWidth, 43, rgb(0.94, 0.94, 0.93));
  drawRect(bankX + 9, infoPanelTop - 36, 26, 26, rgb(0.89, 0.89, 0.88));
  drawPdfBankBuildingIcon(page, bankX + 15, infoPanelTop - 32, GRAY);
  const isRajhiBank = /al\s?rajhi|الراجحي/i.test(inv.bankName || "");
  const bankTitleRight = isRajhiBank ? bankX + bankWidth - 118 : bankX + bankWidth - 10;
  drawSmart(labels.bankDetails.replace(/:$/, ""), bankX + 43, bankTitleRight, infoPanelTop - 25, 8, DGRAY, latinBold);
  if (isRajhiBank) {
    const logoWidth = 94;
    page.drawImage(financeArtwork.bankLogo, {
      x: bankX + bankWidth - 104,
      y: infoPanelTop - 36,
      width: logoWidth,
      height: logoWidth * (financeArtwork.bankLogo.height / financeArtwork.bankLogo.width),
    });
  }
  const bankRows: Array<[string, string]> = [
    ["اسم الحساب", inv.beneficiaryName || "—"],
    ["رقم الآيبان (IBAN)", inv.iban || "—"],
    ["اسم البنك", inv.bankName || "—"],
  ];
  if (inv.accountNumber) bankRows.push(["رقم الحساب", inv.accountNumber]);
  bankRows.forEach(([label, value], index) => {
    const y = infoPanelTop - 50 - index * 12;
    drawSmart(label, bankX + 10, bankX + 92, y, 6.5, GRAY, latinReg);
    if (index === 1) {
      drawPdfCopyIcon(page, bankX + 96, y - 1, GRAY);
      drawSmart(value, bankX + 110, bankX + bankWidth - 10, y, 7, DGRAY, latinReg);
    } else {
      drawSmart(value, bankX + 96, bankX + bankWidth - 10, y, 7, DGRAY, latinReg);
    }
    if (index < bankRows.length - 1) {
      drawLine(bankX + 96, y - 3, bankX + bankWidth - 8, y - 3, 0.35, rgb(0.86, 0.86, 0.85));
    }
  });
  const transferNoteY = infoPanelTop - infoPanelHeight + 12;
  drawRect(bankX + 8, infoPanelTop - infoPanelHeight + 6, bankWidth - 16, 20, rgb(0.92, 0.92, 0.91));
  drawPdfInfoIcon(page, bankX + bankWidth - 20, transferNoteY - 1, latinBold, GRAY);
  drawSmart("عند التحويل يرجى إرسال صورة الإشعار مع رقم الفاتورة عبر الواتساب أو البريد الإلكتروني.", bankX + 10, bankX + bankWidth - 28, transferNoteY, 6, GRAY, latinReg);

  drawSmart(inv.language === "en" ? "Notes" : "ملاحظات", notesX + 10, notesX + notesWidth - 10, infoPanelTop - 17, 8, DGRAY, latinBold);
  noteLines.forEach((line, index) => {
    drawSmart(`• ${line}`, notesX + 10, notesX + notesWidth - 10, infoPanelTop - 34 - index * 10, 7, GRAY, latinReg);
  });
  curY = infoPanelTop - infoPanelHeight - 10;

  /* Footer */
  const approvalBottom = Math.max(78, Math.min(curY - 126, 84));
  drawFinanceApprovalArt(page, financeArtwork.approval, approvalBottom);
  drawFinanceFooterArt(page, financeArtwork.footer);

  return pdfDoc.save();
}

/**
 * Render a receipt voucher through the same server-side document pipeline.
 * Receipt vouchers intentionally stay compact and fit on one A4 page.
 */
export async function generateReceiptPdf(receipt: ReceiptData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const financeArtwork = await embedFinanceAssets(pdfDoc);

  const arabicFont = await embedArabicFont(pdfDoc, "receipt");
  const latinBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const latinReg = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();
  drawPdfBrandWatermark(page, width, height, financeArtwork.watermark);
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
    if (hasArabic(text)) {
      if (hasLatinOrNumber(text)) {
        drawMixedText(page, text, rightX, y, size, color, arabicFont);
      } else {
        drawAR(text, rightX, y, size, color);
      }
    } else {
      drawL(text, leftX, y, size, color, font);
    }
  };
  const rect = (x: number, y: number, w: number, h: number, color = LGRAY) =>
    page.drawRectangle({ x, y, width: w, height: h, color });
  const line = (x1: number, y1: number, x2: number, y2: number, thickness = 0.5, color = LGRAY) =>
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color });
  const date = formatPdfDate(receipt.createdAt);
  const methodLabels: Record<string, string> = {
    bank_transfer: "تحويل بنكي", cash: "نقداً", paypal: "PayPal",
    stc_pay: "STC Pay", apple_pay: "Apple Pay", other: "أخرى",
  };

  const headerH = drawFinanceHeader(
    page,
    financeArtwork.header,
    "سند قبض",
    "RECEIPT VOUCHER",
    true,
    arabicFont,
    latinBold,
    latinReg,
  );
  let curY = height - headerH - 20;

  const pageW = width - MARGIN * 2;
  const metaTop = curY;
  const dividerX = MARGIN + pageW / 2;
  const leftMetaRight = dividerX - 12;
  const recipientLeft = dividerX + 14;
  const recipientRight = width - MARGIN;
  drawL(`#${receipt.receiptNumber}`, MARGIN, metaTop, 16, BLACK, latinBold);
  line(dividerX, metaTop + 5, dividerX, metaTop - 52, 0.45, rgb(0.88, 0.88, 0.87));
  line(MARGIN + 1, metaTop - 21, MARGIN + 7, metaTop - 21, 1, rgb(0.68, 0.69, 0.7));
  drawL(date, MARGIN + 13, metaTop - 23, 7.5, DGRAY);
  drawSmart("التاريخ", MARGIN + 70, leftMetaRight, metaTop - 23, 7, GRAY);
  if (receipt.invoiceNumber) {
    drawSmart(`رقم الفاتورة: ${receipt.invoiceNumber}`, MARGIN + 10, leftMetaRight, metaTop - 39, 7, GRAY);
  }
  drawSmart("استُلم من", recipientLeft, recipientRight, metaTop, 7, GRAY);
  drawSmart(receipt.clientName || "—", recipientLeft, recipientRight, metaTop - 17, 11, BLACK, latinBold);
  let recipientY = metaTop - 31;
  [receipt.clientEmail, receipt.clientPhone].filter(Boolean).forEach((detail) => {
    drawSmart(detail!, recipientLeft, recipientRight, recipientY, 7, DGRAY);
    recipientY -= 10;
  });
  curY = metaTop - 76;

  const purposeDescription = receipt.invoiceNumber
    ? `مرتبط بالفاتورة ${receipt.invoiceNumber}`
    : "";
  if (receipt.description || purposeDescription) {
    const titleLines = receipt.description
      ? wrapPdfText(receipt.description, pageW - 24, 9, latinReg, arabicFont)
      : [];
    const purposeLines = purposeDescription
      ? wrapPdfText(purposeDescription, pageW - 24, 7, latinReg, arabicFont)
      : [];
    const panelHeight = Math.max(48, 34 + titleLines.length * 11 + purposeLines.length * 9);
    rect(MARGIN, curY - panelHeight, pageW, panelHeight, PALE);
    drawSmart("الغرض / الوصف", MARGIN + 12, width - MARGIN - 12, curY - 15, 7, GRAY);
    titleLines.forEach((lineText, index) => {
      drawSmart(lineText, MARGIN + 12, width - MARGIN - 12, curY - 31 - index * 11, 9, DGRAY, latinBold);
    });
    purposeLines.forEach((lineText, index) => {
      drawSmart(lineText, MARGIN + 12, width - MARGIN - 12, curY - 35 - titleLines.length * 11 - index * 9, 7, GRAY);
    });
    curY -= panelHeight + 14;
  }

  const amountWordsLines = receipt.amountInWords
    ? wrapPdfText(receipt.amountInWords, pageW - 32, 8, latinReg, arabicFont)
    : [];
  const amountBoxHeight = Math.max(114, 82 + amountWordsLines.length * 10);
  rect(MARGIN, curY - amountBoxHeight, pageW, amountBoxHeight, PALE);
  drawSmart("المبلغ المستلم", MARGIN + 16, width - MARGIN - 16, curY - 20, 8, GRAY, latinBold);
  const amountText = Number(receipt.amount || 0).toLocaleString("en-SA", { minimumFractionDigits: 2 });
  const amountDisplay = `${amountText} SAR`;
  drawL(amountDisplay, MARGIN + (pageW - latinBold.widthOfTextAtSize(amountDisplay, 25)) / 2, curY - 58, 25, BLACK, latinBold);
  if (amountWordsLines.length) {
    const wordsTop = curY - 78;
    line(MARGIN + 16, wordsTop + 8, width - MARGIN - 16, wordsTop + 8, 0.4, rgb(0.86, 0.86, 0.85));
    amountWordsLines.forEach((lineText, index) => {
      drawSmart(lineText, MARGIN + 16, width - MARGIN - 16, wordsTop - 8 - index * 10, 8, DGRAY);
    });
  }
  curY -= amountBoxHeight + 14;

  const detailRows: Array<[string, string]> = [
    ["طريقة الدفع", methodLabels[receipt.paymentMethod] || receipt.paymentMethod || "—"],
    ["رقم مرجع الدفع", receipt.paymentRef || "—"],
    ["المستلِم", receipt.receivedBy || "QIROX Studio"],
    ["رقم السند", receipt.receiptNumber || "—"],
  ];
  const detailBoxHeight = 68;
  rect(MARGIN, curY - detailBoxHeight, pageW, detailBoxHeight, rgb(0.98, 0.98, 0.98));
  line(MARGIN + pageW / 2, curY - detailBoxHeight + 6, MARGIN + pageW / 2, curY - 6, 0.4, rgb(0.88, 0.88, 0.87));
  line(MARGIN + 8, curY - 34, width - MARGIN - 8, curY - 34, 0.4, rgb(0.88, 0.88, 0.87));
  detailRows.forEach(([label, value], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const cellX = MARGIN + column * (pageW / 2);
    const cellRight = cellX + pageW / 2 - 10;
    const y = curY - 18 - row * 34;
    drawSmart(label, cellX + 10, cellRight, y, 7, GRAY);
    drawSmart(value, cellX + 10, cellRight, y - 12, 8, DGRAY, latinBold);
  });
  curY -= detailBoxHeight + 14;

  if (receipt.paymentMethod === "bank_transfer") {
    const bankRows: Array<[string, string]> = [
      ["اسم المستفيد", receipt.beneficiaryName || "—"],
      ["رقم الآيبان", receipt.iban || "—"],
      ["اسم البنك", receipt.bankName || "—"],
    ];
    if (receipt.accountNumber) bankRows.push(["رقم الحساب", receipt.accountNumber]);
    const bankHeight = Math.max(124, 82 + bankRows.length * 14);
    rect(MARGIN, curY - bankHeight, pageW, bankHeight, PALE);
    rect(MARGIN, curY - 48, pageW, 48, rgb(0.94, 0.94, 0.93));
    rect(MARGIN + 10, curY - 38, 28, 28, rgb(0.89, 0.89, 0.88));
    drawPdfBankBuildingIcon(page, MARGIN + 17, curY - 34, GRAY);
    const isRajhiBank = /al\s?rajhi|الراجحي/i.test(receipt.bankName || "");
    const bankTitleRight = isRajhiBank ? width - MARGIN - 128 : width - MARGIN - 12;
    drawSmart("بيانات التحويل البنكي", MARGIN + 48, bankTitleRight, curY - 28, 8, DGRAY, latinBold);
    if (isRajhiBank) {
      const logoWidth = 96;
      page.drawImage(financeArtwork.bankLogo, {
        x: width - MARGIN - 12 - logoWidth,
        y: curY - 39,
        width: logoWidth,
        height: logoWidth * (financeArtwork.bankLogo.height / financeArtwork.bankLogo.width),
      });
    }
    bankRows.forEach(([label, value], index) => {
      const y = curY - 62 - index * 14;
      drawSmart(label, MARGIN + 12, MARGIN + 112, y, 7, GRAY);
      if (index === 1) {
        drawPdfCopyIcon(page, MARGIN + 118, y - 1, GRAY);
        drawSmart(value, MARGIN + 132, width - MARGIN - 12, y, 8, DGRAY);
      } else {
        drawSmart(value, MARGIN + 118, width - MARGIN - 12, y, 8, DGRAY);
      }
      if (index < bankRows.length - 1) {
        line(MARGIN + 118, y - 4, width - MARGIN - 10, y - 4, 0.35, rgb(0.86, 0.86, 0.85));
      }
    });
    const transferNoteY = curY - bankHeight + 16;
    rect(MARGIN + 8, curY - bankHeight + 7, pageW - 16, 22, rgb(0.92, 0.92, 0.91));
    drawPdfInfoIcon(page, width - MARGIN - 20, transferNoteY - 1, latinBold, GRAY);
    drawSmart(
      "عند التحويل يرجى إرسال صورة الإشعار مع رقم الفاتورة أو الإيصال عبر الواتساب أو البريد الإلكتروني.",
      MARGIN + 12,
      width - MARGIN - 28,
      transferNoteY,
      6,
      GRAY,
    );
    curY -= bankHeight + 14;
  }

  if (receipt.notes) {
    const noteLines = wrapPdfText(receipt.notes, pageW - 24, 7, latinReg, arabicFont);
    const notesHeight = Math.max(42, 24 + noteLines.length * 10);
    rect(MARGIN, curY - notesHeight, pageW, notesHeight, PALE);
    drawSmart("ملاحظات", MARGIN + 12, width - MARGIN - 12, curY - 15, 7, GRAY);
    noteLines.forEach((lineText, index) => {
      drawSmart(lineText, MARGIN + 12, width - MARGIN - 12, curY - 29 - index * 9, 7, DGRAY);
    });
    curY -= notesHeight + 12;
  }

  const footerHeight = width * (financeArtwork.footer.height / financeArtwork.footer.width);
  const safeApprovalBottom = footerHeight + 8;
  const naturalApprovalHeight =
    width * (362 / 900) * (financeArtwork.approval.height / financeArtwork.approval.width);
  const availableApprovalHeight = Math.max(0, curY + 4 - safeApprovalBottom);
  const receiptApprovalScale = Math.max(
    0.68,
    Math.min(1, availableApprovalHeight / naturalApprovalHeight),
  );
  const scaledApprovalHeight = naturalApprovalHeight * receiptApprovalScale;
  const receiptApprovalY = Math.max(
    safeApprovalBottom,
    Math.min(84, curY + 4 - scaledApprovalHeight),
  );
  drawSmart("توقيع الدافع", MARGIN + 8, MARGIN + 180, receiptApprovalY + 76, 7, GRAY);
  drawSmart(receipt.clientName || "—", MARGIN + 8, MARGIN + 180, receiptApprovalY + 61, 8, DGRAY, latinBold);
  drawFinanceApprovalArt(page, financeArtwork.approval, receiptApprovalY, receiptApprovalScale);
  drawFinanceFooterArt(page, financeArtwork.footer);

  return pdfDoc.save();
}

/**
 * Editable-data employment-contract draft. It uses the shared Arabic PDF
 * pipeline and intentionally does not claim legal validity or replace Qiwa
 * registration / qualified Saudi legal review.
 */
export async function generateEmployeeWorkContractPdf(
  data: EmployeeWorkContractPdfData,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const arabicFont = await embedArabicFont(pdfDoc, "employee-work-contract");
  const latinReg = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const latinBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const logoBytes = loadLogo();
  if (!logoBytes) throw new Error("[PDF] QIROX logo is missing for the employee contract");
  const logo = await pdfDoc.embedPng(logoBytes);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 46;
  const green = rgb(0.04, 0.42, 0.31);
  const dark = rgb(0.10, 0.13, 0.12);
  const muted = rgb(0.38, 0.42, 0.40);
  const pale = rgb(0.93, 0.97, 0.95);
  const pageRecords: Array<{ page: any; index: number }> = [];
  let page: any;
  let y = 0;

  const addPage = () => {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    pageRecords.push({ page, index: pageRecords.length + 1 });
    page.drawRectangle({ x: 0, y: pageHeight - 9, width: pageWidth, height: 9, color: green });
    const logoHeight = 38;
    const logoWidth = logoHeight * (logo.width / logo.height);
    page.drawImage(logo, {
      x: margin,
      y: pageHeight - 62,
      width: logoWidth,
      height: logoHeight,
    });
    drawMixedText(page, "QIROX Studio", pageWidth - margin, pageHeight - 39, 10, dark, arabicFont);
    drawMixedText(page, "مسودة عقد عمل — للمراجعة قبل الاعتماد", pageWidth - margin, pageHeight - 57, 8, muted, arabicFont);
    page.drawLine({
      start: { x: margin, y: pageHeight - 75 },
      end: { x: pageWidth - margin, y: pageHeight - 75 },
      thickness: 0.8,
      color: rgb(0.86, 0.90, 0.87),
    });
    y = pageHeight - 104;
  };

  const ensureSpace = (height: number) => {
    if (y - height < 66) addPage();
  };

  const drawHeading = (text: string) => {
    ensureSpace(30);
    page.drawRectangle({
      x: margin,
      y: y - 8,
      width: pageWidth - margin * 2,
      height: 22,
      color: pale,
    });
    drawMixedText(page, text, pageWidth - margin - 9, y, 10, green, arabicFont);
    y -= 29;
  };

  const drawParagraph = (text: string, size = 9, color = dark) => {
    const lines = wrapPdfText(text, pageWidth - margin * 2 - 10, size, latinReg, arabicFont);
    for (const lineText of lines) {
      ensureSpace(size + 7);
      drawMixedText(page, lineText, pageWidth - margin - 5, y, size, color, arabicFont);
      y -= size + 6;
    }
    y -= 3;
  };

  addPage();
  drawHeading("بيانات العقد والأطراف");
  drawParagraph(`رقم المسودة: ${data.contractNumber}`);
  drawParagraph(`العلامة التجارية: ${data.employerName}.`);
  drawParagraph(`الاسم النظامي لصاحب العمل: ${data.employerLegalName || "[يستكمل قبل التوقيع]"}.`);
  drawParagraph(`رقم السجل التجاري/الترخيص: ${data.employerCommercialReg || "[يستكمل قبل التوقيع]"}.`);
  drawParagraph(`الموظف: ${data.employeeName}${data.employeeNationalId ? ` — رقم الهوية/الإقامة: ${data.employeeNationalId}` : " — رقم الهوية/الإقامة: [يستكمل قبل التوقيع]"}`);
  drawParagraph(`المسمى الوظيفي: ${data.jobTitle} — الدور في النظام: ${data.employeeRole}`);
  drawParagraph(`الاختصاص النظامي المقصود: ${data.jurisdiction || "المملكة العربية السعودية"}. يخضع التطبيق للأحكام والأنظمة السارية بعد المراجعة النظامية.`);

  drawHeading("مدة العمل ومكانه");
  drawParagraph(`نوع العقد: ${data.contractType === "fixed" ? "محدد المدة" : "غير محدد المدة"}.`);
  drawParagraph(`تاريخ بداية العمل: ${formatPdfDate(data.startDate)}.`);
  if (data.contractType === "fixed") {
    drawParagraph(`تاريخ نهاية العقد: ${formatPdfDate(data.endDate)}.`);
  }
  drawParagraph(`مقر/مكان العمل: ${data.workLocation}.`);
  drawParagraph(`ساعات العمل الأسبوعية المتفق عليها في هذه المسودة: ${data.weeklyHours} ساعة، مع مراعاة النظام واللوائح ذات الصلة.`);
  drawParagraph(`فترة التجربة المقترحة في هذه المسودة: ${data.probationDays} يومًا، وتحتاج مراجعة واعتمادًا نظاميًا قبل التوقيع.`);

  drawHeading("الأجر والمهام");
  drawParagraph(`الأجر/طريقة الاحتساب: ${data.salaryDescription}.`);
  drawParagraph(`يؤدي الموظف مهام المسمى الوظيفي الموضح أعلاه والمهام المرتبطة به التي تُسند إليه. وتُحدد الصلاحيات داخل أنظمة QIROX حسب الدور الوظيفي المعتمد.`);

  drawHeading("التزامات وحماية مصالح الشركة");
  drawParagraph("السرية: يلتزم الموظف بحماية المعلومات والبيانات والملفات التي يطلع عليها بحكم عمله، بما فيها بيانات QIROX والعملاء، وعدم استخدامها خارج أغراض العمل أو إفشائها دون تصريح، مع مراعاة ما يوجبه النظام.");
  drawParagraph("مخرجات العمل: تكون مخرجات العمل التي ينشئها الموظف ضمن مهامه وباستخدام موارد الشركة ولصالحها مملوكة لصاحب العمل في الحدود التي يسمح بها النظام. ولا يشمل ذلك الحقوق السابقة للموظف أو حقوق الغير غير المنقولة.");
  drawParagraph("التسليم عند انتهاء العلاقة: يعيد الموظف العهد والأجهزة والملفات ووسائل الوصول التابعة للشركة، ويسلم الأعمال والبيانات ذات الصلة، وتُغلق صلاحياته وفق الإجراءات المعتمدة مع الاحتفاظ بالسجلات اللازمة.");
  drawParagraph("الأجر والإجازات وساعات العمل وإنهاء العلاقة: تُطبّق وفق الأنظمة السعودية السارية والعقد المعتمد وأي لوائح داخلية لا تتعارض معها.");

  drawHeading("المراجعة والإقرار");
  drawParagraph("هذه الوثيقة مسودة داخلية مولدة من بيانات النظام، وليست عقدًا نافذًا بمجرد إرسالها. يجب استكمال بيانات المنشأة والموظف، ومراجعتها من مختص قانوني في المملكة العربية السعودية، ثم استيفاء التوقيع والتوثيق النظامي قبل الاعتماد.", 8, muted);
  ensureSpace(74);
  drawParagraph("توقيع صاحب العمل: ____________________                 توقيع الموظف: ____________________", 9);
  drawParagraph("التاريخ: ______________________________                 التاريخ: ______________________________", 9);

  pageRecords.forEach(({ page: footerPage, index }) => {
    drawMixedText(footerPage, "وثيقة مسودة — لا تعتمد قبل المراجعة واستكمال التوقيعات", pageWidth - margin, 34, 7, muted, arabicFont);
    drawMixedText(footerPage, `QIROX Studio · ${index}`, margin + 78, 34, 7, muted, arabicFont);
  });

  return pdfDoc.save();
}
