import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { createRequire } from "module";
import * as fs from "fs";
import * as path from "path";

/* CJS modules loaded via createRequire to avoid ESM default-import issues */
const _require = createRequire(import.meta.url);
const fontkit   = _require("@pdf-lib/fontkit");
const reshaper  = _require("arabic-reshaper");

interface QuotationData {
  quotationNumber: string;
  title?: string;
  clientName: string;
  clientEmail?: string;
  totalAmount: number;
  vatRate?: number;
  vatAmount?: number;
  amount?: number;
  validUntil?: string;
  items?: { name: string; qty: number; unitPrice: number; total: number }[];
  notes?: string;
  createdAt?: string;
}

/* ── helpers ── */
function loadArabicFont(): Buffer | null {
  try {
    const p = path.resolve(process.cwd(), "public/fonts/arabic.ttf");
    return fs.existsSync(p) ? fs.readFileSync(p) : null;
  } catch { return null; }
}

function loadLogo(): Buffer | null {
  try {
    const paths = [
      path.resolve(process.cwd(), "attached_assets/qirox_1771715726312.png"),
      path.resolve(process.cwd(), "client/public/logo.png"),
      path.resolve(process.cwd(), "public/logo.png"),
    ];
    for (const p of paths) if (fs.existsSync(p)) return fs.readFileSync(p);
    return null;
  } catch { return null; }
}

/** Returns true if the string contains Arabic characters */
const hasArabic = (t: string) => /[\u0600-\u06FF]/.test(t);

/**
 * Reshape Arabic text for proper letter-joining and reverse it so
 * pdf-lib (which draws LTR) renders it visually right-to-left.
 */
function shapeArabic(text: string): string {
  try {
    const shaped = reshaper.convertArabic(text);
    return [...shaped].reverse().join("");
  } catch {
    return [...text].reverse().join("");
  }
}

/* ── main export ── */
export async function generateQuotationPdf(q: QuotationData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  /* fonts */
  const arabicFontBytes = loadArabicFont();
  let arabicFont: any = null;
  if (arabicFontBytes) {
    try {
      arabicFont = await pdfDoc.embedFont(arabicFontBytes);
    } catch (err: any) {
      console.error("[PDF] Arabic font embed failed:", err?.message);
    }
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

  /* colours */
  const BLACK = rgb(0,   0,   0);
  const GRAY  = rgb(0.5, 0.5, 0.5);
  const LGRAY = rgb(0.94,0.94,0.94);
  const DGRAY = rgb(0.2, 0.2, 0.2);
  const WHITE = rgb(1,   1,   1);

  /* font aliases */
  const latinBold = helveticaBold;
  const latinReg  = helvetica;

  /* ── drawing helpers ── */

  /** Draw Latin / mixed text left-aligned. */
  const drawL = (
    txt: string, x: number, y: number, size: number,
    color = BLACK, font = latinReg
  ) => {
    if (!txt) return;
    try { page.drawText(txt, { x, y, size, color, font }); }
    catch { /* ignore unencodeable chars */ }
  };

  /**
   * Draw Arabic (or mixed Arabic/Latin) text.
   * The text is reshaped and reversed, then drawn so its RIGHT edge
   * lands at `rightX`. Pass the Amiri font; falls back to latinReg.
   */
  const drawAR = (
    txt: string, rightX: number, y: number, size: number,
    color = BLACK
  ) => {
    if (!txt) return;
    const font = arabicFont || latinReg;
    const shaped = hasArabic(txt) ? shapeArabic(txt) : txt;
    try {
      const tw = font.widthOfTextAtSize(shaped, size);
      page.drawText(shaped, { x: rightX - tw, y, size, color, font });
    } catch { /* ignore */ }
  };

  /**
   * Draw text that may be Latin or Arabic.
   * If it contains Arabic chars → drawAR (right-aligned to rightX).
   * Otherwise → drawL (left-aligned at leftX).
   */
  const drawSmart = (
    txt: string,
    leftX: number, rightX: number, y: number,
    size: number, color = BLACK,
    latinFont = latinReg
  ) => {
    if (!txt) return;
    if (hasArabic(txt)) drawAR(txt, rightX, y, size, color);
    else drawL(txt, leftX, y, size, color, latinFont);
  };

  const drawRect = (x: number, y: number, w: number, h: number, color = LGRAY) =>
    page.drawRectangle({ x, y, width: w, height: h, color });

  const drawLine = (x1: number, y1: number, x2: number, y2: number, thick = 0.5, color = LGRAY) =>
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: thick, color });

  /* ── layout ── */
  const MARGIN = 30;
  const pageW  = width - MARGIN * 2;   // usable width
  let curY = height - 40;

  /* ── Header bar ── */
  const headerH = 64;
  drawRect(0, curY - 14, width, headerH, BLACK);

  if (logoImage) {
    const logoNatW: number = logoImage.width;
    const logoNatH: number = logoImage.height;
    const maxW = 90, maxH = 44;
    const scale = Math.min(maxW / logoNatW, maxH / logoNatH);
    const lw = logoNatW * scale;
    const lh = logoNatH * scale;
    page.drawImage(logoImage, {
      x: 28, y: curY - 14 + (headerH - lh) / 2,
      width: lw, height: lh,
    });
    drawL("qiroxstudio.online", 28 + lw + 8, curY + 16, 8, rgb(0.55, 0.55, 0.55), latinReg);
  } else {
    drawL("QIROX",           30,  curY + 20, 28, WHITE, latinBold);
    drawL("STUDIO",          110, curY + 22, 11, rgb(0.6, 0.6, 0.6), latinReg);
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

  /* ── Client info box ── */
  const boxRight = width - MARGIN;
  drawRect(MARGIN, curY - 46, pageW, 54, rgb(0.97, 0.97, 0.97));
  drawL("Prepared for:", MARGIN + 10, curY - 10, 7, GRAY, latinReg);
  /* client name: Arabic → right-aligned; Latin → left-aligned */
  drawSmart(q.clientName || "—", MARGIN + 10, boxRight - 10, curY - 24, 11, BLACK, latinBold);
  if (q.clientEmail) {
    drawL(q.clientEmail, MARGIN + 10, curY - 37, 8, GRAY, latinReg);
  }
  curY -= 68;

  /* ── Items table ── */
  const items = q.items || [];
  const tableX = MARGIN;
  const tableW = pageW;
  const colWidths = [tableW * 0.45, tableW * 0.15, tableW * 0.2, tableW * 0.2];
  const cols = [
    tableX,
    tableX + colWidths[0],
    tableX + colWidths[0] + colWidths[1],
    tableX + colWidths[0] + colWidths[1] + colWidths[2],
  ];

  /* Header row */
  drawRect(tableX, curY - 20, tableW, 24, BLACK);

  /* "البند" right-aligned in col-0; other headers left-aligned */
  const hdrArabic = "البند";
  const hdrLatin  = "Item";
  drawL(hdrLatin, cols[0] + 6, curY - 12, 8, WHITE, latinBold);
  drawAR(hdrArabic, cols[0] + colWidths[0] - 6, curY - 12, 8, WHITE);
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
    /* item name: Arabic → right-aligned inside col-0; Latin → left-aligned */
    drawSmart(nameDisplay, cols[0] + 6, cols[1] - 6, curY - 12, 8, DGRAY);
    drawL(String(item.qty),                       cols[1] + 6,  curY - 12, 8, DGRAY, latinReg);
    drawL(item.unitPrice.toLocaleString("en-SA"), cols[2] + 6,  curY - 12, 8, DGRAY, latinReg);
    drawL(item.total.toLocaleString("en-SA"),     cols[3] + 6,  curY - 12, 8, DGRAY, latinReg);
    curY -= rowH;
  });

  drawLine(tableX, curY, tableX + tableW, curY, 0.5, LGRAY);
  curY -= 14;

  /* ── Totals ── */
  const totalsX = width - 220;
  const totalsW = 190;

  const addTotalRow = (label: string, value: string, bold = false, bgColor?: any) => {
    if (bgColor) drawRect(totalsX, curY - 16, totalsW, 22, bgColor);
    const lf = bold ? latinBold : latinReg;
    const col = bold ? BLACK : GRAY;
    drawL(label, totalsX + 6, curY - 8, 8, col, lf);
    drawL(value, totalsX + totalsW - 6 - latinReg.widthOfTextAtSize(value, 8), curY - 8, 8, col, lf);
    curY -= 20;
  };

  const subtotal = q.amount ?? (q.totalAmount - (q.vatAmount ?? 0));
  addTotalRow("Subtotal (SAR)", subtotal.toLocaleString("en-SA", { minimumFractionDigits: 2 }));
  addTotalRow(`VAT ${q.vatRate ?? 15}%`, (q.vatAmount ?? 0).toLocaleString("en-SA", { minimumFractionDigits: 2 }));
  addTotalRow("Total (SAR)", q.totalAmount.toLocaleString("en-SA", { minimumFractionDigits: 2 }), true, BLACK);

  /* overwrite total row text in white */
  const totalY  = curY + 20;
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
  drawL("QIROX Studio",        MARGIN,           footerY + 6, 8, GRAY, latinBold);
  drawL("qiroxstudio.online",  width / 2 - 40,   footerY + 6, 8, GRAY, latinReg);
  drawL("© 2026",              width - 70,        footerY + 6, 8, GRAY, latinReg);

  return pdfDoc.save();
}
