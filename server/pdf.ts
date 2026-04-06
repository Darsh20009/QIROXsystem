import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as fontkitModule from "@pdf-lib/fontkit";
import * as fs from "fs";
import * as path from "path";

/* @pdf-lib/fontkit is a CJS module with no default export — grab the module object */
const fontkit = (fontkitModule as any).default ?? fontkitModule;

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

function loadArabicFont(): Buffer | null {
  try {
    const fontPath = path.resolve(process.cwd(), "public/fonts/arabic.ttf");
    if (fs.existsSync(fontPath)) return fs.readFileSync(fontPath);
    return null;
  } catch {
    return null;
  }
}


function loadLogo(): Buffer | null {
  try {
    /* prefer transparent RGBA PNG for use on dark backgrounds */
    const paths = [
      path.resolve(process.cwd(), "attached_assets/qirox_1771715726312.png"),
      path.resolve(process.cwd(), "client/public/logo.png"),
      path.resolve(process.cwd(), "public/logo.png"),
    ];
    for (const p of paths) {
      if (fs.existsSync(p)) return fs.readFileSync(p);
    }
    return null;
  } catch {
    return null;
  }
}

export async function generateQuotationPdf(q: QuotationData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  /* register fontkit once for custom fonts */
  pdfDoc.registerFontkit(fontkit);

  const arabicFontBytes = loadArabicFont();
  let arabicFont: any = null;
  if (arabicFontBytes) {
    try {
      arabicFont = await pdfDoc.embedFont(arabicFontBytes);
    } catch {
      arabicFont = null;
    }
  }

  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  /* embed logo image */
  const logoBytes = loadLogo();
  let logoImage: any = null;
  if (logoBytes) {
    try {
      logoImage = await pdfDoc.embedPng(logoBytes);
    } catch {
      logoImage = null;
    }
  }

  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();

  const BLACK   = rgb(0, 0, 0);
  const GRAY    = rgb(0.5, 0.5, 0.5);
  const LGRAY   = rgb(0.94, 0.94, 0.94);
  const DGRAY   = rgb(0.2, 0.2, 0.2);
  const WHITE   = rgb(1, 1, 1);

  const textFont  = arabicFont || helvetica;
  const boldFont  = arabicFont || helveticaBold;
  const latinFont = helveticaBold;
  const latinReg  = helvetica;

  const drawText = (txt: string, x: number, y: number, size: number, color = BLACK, font = textFont) => {
    if (!txt) return;
    page.drawText(txt, { x, y, size, color, font });
  };

  const drawRect = (x: number, y: number, w: number, h: number, color = LGRAY) => {
    page.drawRectangle({ x, y, width: w, height: h, color });
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number, thickness = 0.5, color = LGRAY) => {
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color });
  };

  let curY = height - 40;

  /* ── Header bar ── */
  const headerH = 64;
  drawRect(0, curY - 14, width, headerH, BLACK);

  if (logoImage) {
    /* fit logo into 90×44 box in header, maintain aspect ratio */
    const logoNatW: number = logoImage.width;
    const logoNatH: number = logoImage.height;
    const maxW = 90, maxH = 44;
    const scale = Math.min(maxW / logoNatW, maxH / logoNatH);
    const lw = logoNatW * scale;
    const lh = logoNatH * scale;
    page.drawImage(logoImage, {
      x: 28,
      y: curY - 14 + (headerH - lh) / 2,
      width: lw,
      height: lh,
    });
    /* small domain label to the right of logo */
    drawText("qiroxstudio.online", 28 + lw + 8, curY + 16, 8, rgb(0.55, 0.55, 0.55), latinReg);
  } else {
    /* text fallback */
    drawText("QIROX", 30, curY + 20, 28, WHITE, latinFont);
    drawText("STUDIO", 110, curY + 22, 11, rgb(0.6, 0.6, 0.6), latinReg);
    drawText("qiroxstudio.online", width - 175, curY + 22, 9, rgb(0.6, 0.6, 0.6), latinReg);
  }
  drawText("QUOTATION", width - 100, curY + 8, 7, rgb(0.5, 0.5, 0.5), latinReg);
  curY -= 70;

  /* ── Quotation number & date ── */
  drawText(`#${q.quotationNumber}`, 30, curY, 16, BLACK, latinFont);
  const dateStr = q.createdAt
    ? new Date(q.createdAt).toLocaleDateString("en-SA")
    : new Date().toLocaleDateString("en-SA");
  drawText(`Date: ${dateStr}`, width - 150, curY, 9, GRAY, latinReg);
  if (q.validUntil) {
    drawText(`Valid until: ${new Date(q.validUntil).toLocaleDateString("en-SA")}`, width - 150, curY - 14, 9, GRAY, latinReg);
  }
  curY -= 30;

  /* ── Title ── */
  if (q.title) {
    drawText(q.title, 30, curY, 11, DGRAY, textFont);
    curY -= 22;
  }

  /* ── Client info box ── */
  drawRect(30, curY - 46, width - 60, 54, rgb(0.97, 0.97, 0.97));
  drawText("Prepared for:", 40, curY - 10, 7, GRAY, latinReg);
  drawText(q.clientName || "—", 40, curY - 24, 11, BLACK, boldFont);
  if (q.clientEmail) {
    drawText(q.clientEmail, 40, curY - 37, 8, GRAY, latinReg);
  }
  curY -= 68;

  /* ── Items table ── */
  const items = q.items || [];
  const tableX = 30;
  const tableW = width - 60;
  const colWidths = [tableW * 0.45, tableW * 0.15, tableW * 0.2, tableW * 0.2];
  const cols = [tableX, tableX + colWidths[0], tableX + colWidths[0] + colWidths[1], tableX + colWidths[0] + colWidths[1] + colWidths[2]];

  /* Header row */
  drawRect(tableX, curY - 20, tableW, 24, BLACK);
  const headers = ["Item / البند", "Qty", "Unit Price", "Total"];
  headers.forEach((h, i) => {
    drawText(h, cols[i] + 6, curY - 12, 8, WHITE, latinFont);
  });
  curY -= 26;

  /* Data rows */
  items.forEach((item, idx) => {
    const rowH = 22;
    const rowBg = idx % 2 === 0 ? WHITE : rgb(0.97, 0.97, 0.97);
    drawRect(tableX, curY - rowH + 4, tableW, rowH, rowBg);

    const name = item.name || "—";
    drawText(name.length > 45 ? name.substring(0, 45) + "…" : name, cols[0] + 6, curY - 12, 8, DGRAY, textFont);
    drawText(String(item.qty), cols[1] + 6, curY - 12, 8, DGRAY, latinReg);
    drawText(item.unitPrice.toLocaleString("en-SA"), cols[2] + 6, curY - 12, 8, DGRAY, latinReg);
    drawText(item.total.toLocaleString("en-SA"), cols[3] + 6, curY - 12, 8, DGRAY, latinReg);
    curY -= rowH;
  });

  drawLine(tableX, curY, tableX + tableW, curY, 0.5, LGRAY);
  curY -= 14;

  /* ── Totals ── */
  const totalsX = width - 220;
  const totalsW = 190;

  const addTotalRow = (label: string, value: string, bold = false, bg?: any) => {
    if (bg) drawRect(totalsX, curY - 16, totalsW, 22, bg);
    drawText(label, totalsX + 6, curY - 8, 8, bold ? BLACK : GRAY, bold ? boldFont : latinReg);
    drawText(value, totalsX + totalsW - 6 - latinReg.widthOfTextAtSize(value, 8), curY - 8, 8, bold ? BLACK : GRAY, bold ? latinFont : latinReg);
    curY -= 20;
  };

  const subtotal = q.amount ?? (q.totalAmount - (q.vatAmount ?? 0));
  addTotalRow("Subtotal (SAR)", subtotal.toLocaleString("en-SA", { minimumFractionDigits: 2 }));
  addTotalRow(`VAT ${q.vatRate ?? 15}%`, (q.vatAmount ?? 0).toLocaleString("en-SA", { minimumFractionDigits: 2 }));
  addTotalRow("Total (SAR)", q.totalAmount.toLocaleString("en-SA", { minimumFractionDigits: 2 }), true, BLACK);

  /* Fix last total row text to white */
  const totalY = curY + 20;
  page.drawText(`Total (SAR)`, { x: totalsX + 6, y: totalY - 8, size: 8, color: WHITE, font: boldFont });
  const totalStr = q.totalAmount.toLocaleString("en-SA", { minimumFractionDigits: 2 });
  page.drawText(totalStr, {
    x: totalsX + totalsW - 6 - boldFont.widthOfTextAtSize(totalStr, 8),
    y: totalY - 8,
    size: 8,
    color: WHITE,
    font: latinFont,
  });

  curY -= 20;

  /* ── Notes ── */
  if (q.notes) {
    curY -= 10;
    drawRect(tableX, curY - 36, tableW * 0.8, 44, rgb(0.97, 0.97, 0.97));
    drawText("Notes:", tableX + 8, curY - 10, 7, GRAY, latinReg);
    const noteText = q.notes.length > 120 ? q.notes.substring(0, 120) + "…" : q.notes;
    drawText(noteText, tableX + 8, curY - 24, 8, DGRAY, textFont);
    curY -= 54;
  }

  /* ── Footer ── */
  const footerY = 30;
  drawLine(30, footerY + 18, width - 30, footerY + 18, 0.5, LGRAY);
  drawText("QIROX Studio", 30, footerY + 6, 8, GRAY, latinFont);
  drawText("qiroxstudio.online", width / 2 - 40, footerY + 6, 8, GRAY, latinReg);
  drawText("© 2026", width - 70, footerY + 6, 8, GRAY, latinReg);

  return pdfDoc.save();
}
