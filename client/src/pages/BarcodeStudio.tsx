import { useState, useRef, useCallback, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import JsBarcode from "jsbarcode";
import {
  Download, Copy, Check, Trash2, RefreshCw, Settings2,
  QrCode, Barcode, Palette, Type, Maximize2, ChevronRight,
  Infinity as InfinityIcon, Layers, Sparkles, Grid3X3, ZoomIn, ZoomOut,
  Image, FileText, SlidersHorizontal, Eye, EyeOff, RotateCcw,
} from "lucide-react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

const BARCODE_TYPES = [
  { value: "CODE128", label: "Code 128", desc: "الأكثر شيوعاً — يدعم كل الأحرف", example: "QIROX-2026" },
  { value: "CODE39", label: "Code 39", desc: "أحرف كبيرة وأرقام وبعض الرموز", example: "QIROX2026" },
  { value: "EAN13", label: "EAN-13", desc: "باركود المنتجات العالمي — 13 رقم", example: "5901234123457" },
  { value: "EAN8", label: "EAN-8", desc: "نسخة مختصرة — 8 أرقام", example: "96385074" },
  { value: "UPC", label: "UPC-A", desc: "باركود المنتجات الأمريكي — 12 رقم", example: "042100005264" },
  { value: "ITF14", label: "ITF-14", desc: "للتخزين والشحن — 14 رقم", example: "00012345678905" },
  { value: "MSI", label: "MSI Plessey", desc: "للمستودعات والمخزون", example: "12345678" },
  { value: "pharmacode", label: "Pharmacode", desc: "القطاع الصيدلاني — 3 إلى 131130", example: "1234" },
];

const QR_ERROR_LEVELS = ["L", "M", "Q", "H"] as const;
const QR_SHAPES = ["squares", "dots"] as const;

type Tab = "barcode" | "qr" | "gallery";
type QRErrorLevel = typeof QR_ERROR_LEVELS[number];

interface GalleryItem {
  id: string;
  type: "barcode" | "qr";
  label: string;
  value: string;
  dataUrl: string;
  createdAt: Date;
}

export default function BarcodeStudio() {
  const { lang, dir } = useI18n();
  const { toast } = useToast();
  const svgRef = useRef<SVGSVGElement>(null);
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);
  const qrRef = useRef<SVGSVGElement>(null);

  const [activeTab, setActiveTab] = useState<Tab>("barcode");
  const [copied, setCopied] = useState(false);

  // ── Barcode state ─────────────────────────────────────────────
  const [barcodeType, setBarcodeType] = useState("CODE128");
  const [barcodeValue, setBarcodeValue] = useState("QIROX-2026");
  const [barFg, setBarFg] = useState("#000000");
  const [barBg, setBarBg] = useState("#ffffff");
  const [barWidth, setBarWidth] = useState(2);
  const [barHeight, setBarHeight] = useState(100);
  const [barMargin, setBarMargin] = useState(10);
  const [barFontSize, setBarFontSize] = useState(20);
  const [barDisplayValue, setBarDisplayValue] = useState(true);
  const [barTextAlign, setBarTextAlign] = useState<"left"|"center"|"right">("center");
  const [barTextPos, setBarTextPos] = useState<"bottom"|"top">("bottom");
  const [barcodeError, setBarcodeError] = useState("");
  const [barcodeDataUrl, setBarcodeDataUrl] = useState("");

  // ── QR state ──────────────────────────────────────────────────
  const [qrValue, setQrValue] = useState("https://qiroxstudio.online");
  const [qrFg, setQrFg] = useState("#000000");
  const [qrBg, setQrBg] = useState("#ffffff");
  const [qrSize, setQrSize] = useState(256);
  const [qrLevel, setQrLevel] = useState<QRErrorLevel>("M");
  const [qrMargin, setQrMargin] = useState(4);
  const [qrLogoText, setQrLogoText] = useState("");

  // ── Gallery ───────────────────────────────────────────────────
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  // ── Render barcode ─────────────────────────────────────────────
  const renderBarcode = useCallback(() => {
    if (!barcodeCanvasRef.current || !barcodeValue.trim()) return;
    try {
      setBarcodeError("");
      JsBarcode(barcodeCanvasRef.current, barcodeValue, {
        format: barcodeType,
        lineColor: barFg,
        background: barBg,
        width: barWidth,
        height: barHeight,
        margin: barMargin,
        fontSize: barFontSize,
        displayValue: barDisplayValue,
        textAlign: barTextAlign,
        textPosition: barTextPos,
        font: "Arial",
        valid: (valid: boolean) => {
          if (!valid) setBarcodeError("القيمة غير متوافقة مع نوع الباركود");
        },
      });
      setBarcodeDataUrl(barcodeCanvasRef.current.toDataURL("image/png"));
    } catch (e: any) {
      setBarcodeError(e?.message || "خطأ في التوليد");
    }
  }, [barcodeType, barcodeValue, barFg, barBg, barWidth, barHeight, barMargin, barFontSize, barDisplayValue, barTextAlign, barTextPos]);

  useEffect(() => {
    renderBarcode();
  }, [renderBarcode]);

  // ── Download barcode as PNG ────────────────────────────────────
  const downloadBarcodePng = () => {
    if (!barcodeCanvasRef.current || barcodeError) return;
    const link = document.createElement("a");
    link.download = `barcode-${barcodeType}-${Date.now()}.png`;
    link.href = barcodeCanvasRef.current.toDataURL("image/png");
    link.click();
  };

  // ── Download QR as PNG ────────────────────────────────────────
  const downloadQrPng = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const img = new window.Image();
    img.onload = () => {
      canvas.width = qrSize;
      canvas.height = qrSize;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = qrBg;
      ctx.fillRect(0, 0, qrSize, qrSize);
      ctx.drawImage(img, 0, 0);
      const link = document.createElement("a");
      link.download = `qr-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  // ── Download QR as SVG ────────────────────────────────────────
  const downloadQrSvg = () => {
    if (!qrRef.current) return;
    const svgData = new XMLSerializer().serializeToString(qrRef.current);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.download = `qr-${Date.now()}.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  // ── Save to gallery ────────────────────────────────────────────
  const saveToGallery = (type: "barcode" | "qr") => {
    let dataUrl = "";
    let label = "";
    let value = "";
    if (type === "barcode") {
      if (!barcodeCanvasRef.current || barcodeError) return;
      dataUrl = barcodeCanvasRef.current.toDataURL("image/png");
      label = `${barcodeType} — ${barcodeValue}`;
      value = barcodeValue;
    } else {
      if (!qrRef.current) return;
      const svgData = new XMLSerializer().serializeToString(qrRef.current);
      dataUrl = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
      label = `QR — ${qrValue.slice(0, 30)}`;
      value = qrValue;
    }
    const item: GalleryItem = {
      id: `${Date.now()}`,
      type,
      label,
      value,
      dataUrl,
      createdAt: new Date(),
    };
    setGallery(prev => [item, ...prev]);
    toast({ title: "تم الحفظ في المعرض ✅" });
    setActiveTab("gallery");
  };

  const deleteFromGallery = (id: string) => {
    setGallery(prev => prev.filter(g => g.id !== id));
  };

  const copyValue = async (val: string) => {
    await navigator.clipboard.writeText(val).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedType = BARCODE_TYPES.find(t => t.value === barcodeType);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <PageGraphics variant="full-dark" />
      <Navigation />

      {/* Hero */}
      <div className="bg-black pt-24 pb-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="max-w-5xl mx-auto relative z-10" dir={dir}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
              <Barcode className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5">
              <InfinityIcon className="w-3.5 h-3.5 text-white/40" />
              <span className="text-white/40 text-xs font-bold">مدى الحياة — تصاميم غير محدودة</span>
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-3">Barcode Studio</h1>
          <p className="text-white/40 text-base max-w-xl">توليد باركودات وQR بتصاميم كاملة الحرية — Code128, EAN, QR, UPC وأكثر. تحميل PNG وSVG.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 flex gap-1 pt-4">
          {([
            { key: "barcode", label: "باركود خطي", icon: Barcode },
            { key: "qr", label: "QR Code", icon: QrCode },
            { key: "gallery", label: `المعرض (${gallery.length})`, icon: Grid3X3 },
          ] as { key: Tab; label: string; icon: any }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-bold rounded-t-xl transition-all ${
                activeTab === tab.key
                  ? "bg-black text-white"
                  : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
              }`}
              data-testid={`tab-${tab.key}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* ── Barcode Tab ─────────────────────────────────────────────── */}
        {activeTab === "barcode" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Controls */}
            <div className="space-y-5" dir={dir}>
              {/* Barcode type */}
              <div>
                <label className="text-xs font-bold text-black/50 dark:text-white/50 mb-2 block">نوع الباركود</label>
                <Select value={barcodeType} onValueChange={val => { setBarcodeType(val); setBarcodeValue(BARCODE_TYPES.find(t => t.value === val)?.example || ""); }}>
                  <SelectTrigger className="h-11 rounded-xl border-black/10 dark:border-white/10" data-testid="select-barcode-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BARCODE_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        <div>
                          <span className="font-bold">{t.label}</span>
                          <span className="text-black/40 dark:text-white/40 text-xs mr-2">{t.desc}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedType && (
                  <p className="text-[11px] text-black/35 dark:text-white/35 mt-1.5">{selectedType.desc}</p>
                )}
              </div>

              {/* Value */}
              <div>
                <label className="text-xs font-bold text-black/50 dark:text-white/50 mb-2 block">القيمة / النص</label>
                <div className="flex gap-2">
                  <Input
                    value={barcodeValue}
                    onChange={e => setBarcodeValue(e.target.value)}
                    placeholder={selectedType?.example}
                    className="h-11 rounded-xl border-black/10 dark:border-white/10 font-mono"
                    dir="ltr"
                    data-testid="input-barcode-value"
                  />
                  <Button size="icon" variant="outline" className="h-11 w-11 rounded-xl shrink-0" onClick={() => copyValue(barcodeValue)}>
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                {barcodeError && (
                  <p className="text-[11px] text-red-600 mt-1.5 font-medium">{barcodeError}</p>
                )}
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-black/50 dark:text-white/50 mb-2 block flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" /> لون الباركود</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={barFg} onChange={e => setBarFg(e.target.value)} className="w-11 h-11 rounded-xl border border-black/10 dark:border-white/10 cursor-pointer p-0.5 bg-transparent" data-testid="color-bar-fg" />
                    <Input value={barFg} onChange={e => setBarFg(e.target.value)} className="h-11 rounded-xl border-black/10 dark:border-white/10 font-mono text-xs flex-1" dir="ltr" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-black/50 dark:text-white/50 mb-2 block">لون الخلفية</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={barBg} onChange={e => setBarBg(e.target.value)} className="w-11 h-11 rounded-xl border border-black/10 dark:border-white/10 cursor-pointer p-0.5 bg-transparent" data-testid="color-bar-bg" />
                    <Input value={barBg} onChange={e => setBarBg(e.target.value)} className="h-11 rounded-xl border-black/10 dark:border-white/10 font-mono text-xs flex-1" dir="ltr" />
                  </div>
                </div>
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-black/50 dark:text-white/50 mb-2 block">العرض: <span className="text-black dark:text-white">{barWidth}</span></label>
                  <input type="range" min={1} max={5} step={0.5} value={barWidth} onChange={e => setBarWidth(Number(e.target.value))} className="w-full accent-black dark:accent-white" data-testid="slider-bar-width" />
                </div>
                <div>
                  <label className="text-xs font-bold text-black/50 dark:text-white/50 mb-2 block">الارتفاع: <span className="text-black dark:text-white">{barHeight}px</span></label>
                  <input type="range" min={40} max={250} step={5} value={barHeight} onChange={e => setBarHeight(Number(e.target.value))} className="w-full accent-black dark:accent-white" data-testid="slider-bar-height" />
                </div>
                <div>
                  <label className="text-xs font-bold text-black/50 dark:text-white/50 mb-2 block">الهامش: <span className="text-black dark:text-white">{barMargin}px</span></label>
                  <input type="range" min={0} max={40} step={2} value={barMargin} onChange={e => setBarMargin(Number(e.target.value))} className="w-full accent-black dark:accent-white" />
                </div>
                <div>
                  <label className="text-xs font-bold text-black/50 dark:text-white/50 mb-2 block">حجم النص: <span className="text-black dark:text-white">{barFontSize}px</span></label>
                  <input type="range" min={8} max={40} step={1} value={barFontSize} onChange={e => setBarFontSize(Number(e.target.value))} className="w-full accent-black dark:accent-white" />
                </div>
              </div>

              {/* Text options */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-black/50 dark:text-white/50 mb-2 block">عرض النص</label>
                  <button onClick={() => setBarDisplayValue(!barDisplayValue)} className={`w-full h-10 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${barDisplayValue ? "bg-black text-white border-black" : "border-black/10 dark:border-white/10 text-black/50 dark:text-white/50"}`} data-testid="toggle-display-value">
                    {barDisplayValue ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {barDisplayValue ? "مرئي" : "مخفي"}
                  </button>
                </div>
                <div>
                  <label className="text-xs font-bold text-black/50 dark:text-white/50 mb-2 block">محاذاة النص</label>
                  <Select value={barTextAlign} onValueChange={(v: any) => setBarTextAlign(v)}>
                    <SelectTrigger className="h-10 rounded-xl border-black/10 dark:border-white/10 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">يسار</SelectItem>
                      <SelectItem value="center">وسط</SelectItem>
                      <SelectItem value="right">يمين</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-bold text-black/50 dark:text-white/50 mb-2 block">موضع النص</label>
                  <Select value={barTextPos} onValueChange={(v: any) => setBarTextPos(v)}>
                    <SelectTrigger className="h-10 rounded-xl border-black/10 dark:border-white/10 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom">أسفل</SelectItem>
                      <SelectItem value="top">أعلى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quick presets */}
              <div>
                <label className="text-xs font-bold text-black/50 dark:text-white/50 mb-2 block">ألوان سريعة</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { fg: "#000000", bg: "#ffffff", label: "كلاسيك" },
                    { fg: "#1a1a2e", bg: "#e8f4fd", label: "أزرق" },
                    { fg: "#ffffff", bg: "#000000", label: "عكسي" },
                    { fg: "#2d5016", bg: "#f0fff0", label: "أخضر" },
                    { fg: "#7c3aed", bg: "#faf5ff", label: "بنفسجي" },
                    { fg: "#c2410c", bg: "#fff7ed", label: "برتقالي" },
                  ].map(p => (
                    <button key={p.label} onClick={() => { setBarFg(p.fg); setBarBg(p.bg); }}
                      className="px-3 py-1.5 rounded-full text-xs font-bold border border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 transition-all"
                      style={{ background: p.bg, color: p.fg }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-black/[0.07] dark:border-white/[0.07] p-6 flex flex-col items-center justify-center min-h-[260px]" style={{ background: barBg }}>
                {barcodeError ? (
                  <div className="text-center">
                    <p className="text-red-500 text-sm font-bold mb-2">⚠️ {barcodeError}</p>
                    <p className="text-xs text-black/40">تحقق من نوع الباركود والقيمة المدخلة</p>
                  </div>
                ) : (
                  <canvas ref={barcodeCanvasRef} className="max-w-full" data-testid="canvas-barcode" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button onClick={downloadBarcodePng} disabled={!!barcodeError || !barcodeValue.trim()} className="h-11 rounded-xl bg-black text-white hover:bg-black/80 font-bold gap-2 text-sm" data-testid="button-download-barcode-png">
                  <Download className="w-4 h-4" /> تحميل PNG
                </Button>
                <Button onClick={() => saveToGallery("barcode")} disabled={!!barcodeError || !barcodeValue.trim()} variant="outline" className="h-11 rounded-xl border-black/10 dark:border-white/10 font-bold gap-2 text-sm" data-testid="button-save-barcode">
                  <Grid3X3 className="w-4 h-4" /> حفظ في المعرض
                </Button>
              </div>

              {/* Reset */}
              <button onClick={() => { setBarcodeValue(selectedType?.example || "QIROX-2026"); setBarFg("#000000"); setBarBg("#ffffff"); setBarWidth(2); setBarHeight(100); setBarMargin(10); setBarFontSize(20); setBarDisplayValue(true); }}
                className="w-full text-xs text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white flex items-center justify-center gap-1.5 py-2 transition-colors">
                <RotateCcw className="w-3.5 h-3.5" /> إعادة ضبط التصميم
              </button>
            </div>
          </div>
        )}

        {/* ── QR Tab ──────────────────────────────────────────────────── */}
        {activeTab === "qr" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Controls */}
            <div className="space-y-5" dir={dir}>
              {/* Value */}
              <div>
                <label className="text-xs font-bold text-black/50 dark:text-white/50 mb-2 block">المحتوى (رابط، نص، رقم جوال...)</label>
                <Textarea
                  value={qrValue}
                  onChange={e => setQrValue(e.target.value)}
                  placeholder="https://qiroxstudio.online"
                  rows={3}
                  className="rounded-xl border-black/10 dark:border-white/10 font-mono text-sm resize-none"
                  dir="ltr"
                  data-testid="textarea-qr-value"
                />
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-black/50 dark:text-white/50 mb-2 block flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" /> لون QR</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={qrFg} onChange={e => setQrFg(e.target.value)} className="w-11 h-11 rounded-xl border border-black/10 dark:border-white/10 cursor-pointer p-0.5 bg-transparent" data-testid="color-qr-fg" />
                    <Input value={qrFg} onChange={e => setQrFg(e.target.value)} className="h-11 rounded-xl border-black/10 dark:border-white/10 font-mono text-xs flex-1" dir="ltr" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-black/50 dark:text-white/50 mb-2 block">لون الخلفية</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={qrBg} onChange={e => setQrBg(e.target.value)} className="w-11 h-11 rounded-xl border border-black/10 dark:border-white/10 cursor-pointer p-0.5 bg-transparent" data-testid="color-qr-bg" />
                    <Input value={qrBg} onChange={e => setQrBg(e.target.value)} className="h-11 rounded-xl border-black/10 dark:border-white/10 font-mono text-xs flex-1" dir="ltr" />
                  </div>
                </div>
              </div>

              {/* Size + Margin */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-black/50 dark:text-white/50 mb-2 block">الحجم: <span className="text-black dark:text-white">{qrSize}px</span></label>
                  <input type="range" min={128} max={512} step={16} value={qrSize} onChange={e => setQrSize(Number(e.target.value))} className="w-full accent-black dark:accent-white" data-testid="slider-qr-size" />
                </div>
                <div>
                  <label className="text-xs font-bold text-black/50 dark:text-white/50 mb-2 block">الهامش: <span className="text-black dark:text-white">{qrMargin}</span></label>
                  <input type="range" min={0} max={10} step={1} value={qrMargin} onChange={e => setQrMargin(Number(e.target.value))} className="w-full accent-black dark:accent-white" />
                </div>
              </div>

              {/* Error correction */}
              <div>
                <label className="text-xs font-bold text-black/50 dark:text-white/50 mb-2 block">مستوى تصحيح الخطأ</label>
                <div className="grid grid-cols-4 gap-2">
                  {QR_ERROR_LEVELS.map(lv => (
                    <button key={lv} onClick={() => setQrLevel(lv)}
                      className={`h-10 rounded-xl text-xs font-bold border transition-all ${qrLevel === lv ? "bg-black text-white border-black" : "border-black/10 dark:border-white/10 text-black/50 dark:text-white/50 hover:border-black/30 dark:hover:border-white/30"}`}
                      data-testid={`qr-level-${lv}`}>
                      {lv}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-black/30 dark:text-white/30 mt-1.5">
                  {qrLevel === "L" ? "7% تصحيح — أصغر حجم" : qrLevel === "M" ? "15% تصحيح — مناسب عموماً" : qrLevel === "Q" ? "25% تصحيح — جيد مع لوغو" : "30% تصحيح — الأفضل مع لوغو"}
                </p>
              </div>

              {/* Quick presets */}
              <div>
                <label className="text-xs font-bold text-black/50 dark:text-white/50 mb-2 block">ألوان سريعة</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { fg: "#000000", bg: "#ffffff", label: "كلاسيك" },
                    { fg: "#1e3a5f", bg: "#e8f4fd", label: "أزرق" },
                    { fg: "#ffffff", bg: "#1a1a1a", label: "داكن" },
                    { fg: "#7c3aed", bg: "#faf5ff", label: "بنفسجي" },
                    { fg: "#065f46", bg: "#ecfdf5", label: "أخضر" },
                    { fg: "#c2410c", bg: "#fff7ed", label: "برتقالي" },
                    { fg: "#be123c", bg: "#fff1f2", label: "أحمر" },
                    { fg: "#1d4ed8", bg: "#eff6ff", label: "إنديغو" },
                  ].map(p => (
                    <button key={p.label} onClick={() => { setQrFg(p.fg); setQrBg(p.bg); }}
                      className="px-3 py-1.5 rounded-full text-xs font-bold border border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 transition-all"
                      style={{ background: p.bg, color: p.fg }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template shortcuts */}
              <div>
                <label className="text-xs font-bold text-black/50 dark:text-white/50 mb-2 block">قوالب سريعة</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "رابط موقع", value: "https://qiroxstudio.online" },
                    { label: "واتساب", value: "https://wa.me/966XXXXXXXXX" },
                    { label: "بريد إلكتروني", value: "mailto:info@qiroxstudio.online" },
                    { label: "رقم جوال", value: "tel:+966XXXXXXXXX" },
                    { label: "نص حر", value: "نص مخصص هنا" },
                    { label: "موقع جغرافي", value: "geo:24.7136,46.6753" },
                  ].map(t => (
                    <button key={t.label} onClick={() => setQrValue(t.value)}
                      className="h-9 px-3 rounded-xl border border-black/[0.07] dark:border-white/[0.07] text-xs font-bold text-black/60 dark:text-white/60 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] hover:text-black dark:hover:text-white transition-all text-right"
                      dir={dir}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-black/[0.07] dark:border-white/[0.07] p-8 flex items-center justify-center" style={{ background: qrBg }}>
                {qrValue.trim() ? (
                  <QRCodeSVG
                    ref={qrRef as any}
                    value={qrValue}
                    size={Math.min(qrSize, 280)}
                    fgColor={qrFg}
                    bgColor={qrBg}
                    level={qrLevel}
                    marginSize={qrMargin}
                    data-testid="svg-qr"
                  />
                ) : (
                  <div className="text-center py-10">
                    <QrCode className="w-12 h-12 text-black/10 dark:text-white/10 mx-auto mb-3" />
                    <p className="text-sm text-black/30 dark:text-white/30">أدخل محتوى لتوليد QR</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button onClick={downloadQrPng} disabled={!qrValue.trim()} className="h-11 rounded-xl bg-black text-white hover:bg-black/80 font-bold gap-1.5 text-xs" data-testid="button-download-qr-png">
                  <Download className="w-3.5 h-3.5" /> PNG
                </Button>
                <Button onClick={downloadQrSvg} disabled={!qrValue.trim()} variant="outline" className="h-11 rounded-xl border-black/10 dark:border-white/10 font-bold gap-1.5 text-xs" data-testid="button-download-qr-svg">
                  <FileText className="w-3.5 h-3.5" /> SVG
                </Button>
                <Button onClick={() => saveToGallery("qr")} disabled={!qrValue.trim()} variant="outline" className="h-11 rounded-xl border-black/10 dark:border-white/10 font-bold gap-1.5 text-xs" data-testid="button-save-qr">
                  <Grid3X3 className="w-3.5 h-3.5" /> معرض
                </Button>
              </div>

              <button onClick={() => { setQrValue("https://qiroxstudio.online"); setQrFg("#000000"); setQrBg("#ffffff"); setQrSize(256); setQrLevel("M"); setQrMargin(4); }}
                className="w-full text-xs text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white flex items-center justify-center gap-1.5 py-2 transition-colors">
                <RotateCcw className="w-3.5 h-3.5" /> إعادة ضبط
              </button>
            </div>
          </div>
        )}

        {/* ── Gallery Tab ──────────────────────────────────────────────── */}
        {activeTab === "gallery" && (
          <div dir={dir}>
            {gallery.length === 0 ? (
              <div className="text-center py-24">
                <div className="w-20 h-20 rounded-3xl bg-black/[0.03] dark:bg-white/[0.03] flex items-center justify-center mx-auto mb-5">
                  <Grid3X3 className="w-8 h-8 text-black/15 dark:text-white/15" />
                </div>
                <p className="text-base font-bold text-black/30 dark:text-white/30 mb-2">المعرض فارغ</p>
                <p className="text-sm text-black/20 dark:text-white/20">أنشئ باركود أو QR واحفظه هنا</p>
                <div className="flex gap-3 justify-center mt-6">
                  <Button onClick={() => setActiveTab("barcode")} variant="outline" className="rounded-xl h-10 px-5 text-sm border-black/10 dark:border-white/10 gap-2">
                    <Barcode className="w-4 h-4" /> باركود خطي
                  </Button>
                  <Button onClick={() => setActiveTab("qr")} variant="outline" className="rounded-xl h-10 px-5 text-sm border-black/10 dark:border-white/10 gap-2">
                    <QrCode className="w-4 h-4" /> QR Code
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm font-bold text-black/50 dark:text-white/50">{gallery.length} عنصر محفوظ</p>
                  <Button onClick={() => setGallery([])} variant="outline" size="sm" className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 gap-1.5 text-xs">
                    <Trash2 className="w-3.5 h-3.5" /> مسح الكل
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {gallery.map(item => (
                    <div key={item.id} className="rounded-2xl border border-black/[0.07] dark:border-white/[0.07] overflow-hidden group hover:shadow-lg transition-all" data-testid={`gallery-item-${item.id}`}>
                      <div className="bg-white dark:bg-gray-900 p-4 flex items-center justify-center min-h-[120px]">
                        <img src={item.dataUrl} alt={item.label} className="max-h-24 max-w-full object-contain" />
                      </div>
                      <div className="p-3 border-t border-black/[0.05] dark:border-white/[0.05] bg-black/[0.01] dark:bg-white/[0.01]">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${item.type === "qr" ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"}`}>
                            {item.type === "qr" ? "QR" : "BARCODE"}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-black/60 dark:text-white/60 truncate mb-2">{item.label}</p>
                        <div className="flex gap-1.5">
                          <a href={item.dataUrl} download={`${item.type}-${item.id}.png`}
                            className="flex-1 h-7 rounded-lg bg-black text-white text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-black/80 transition-colors">
                            <Download className="w-3 h-3" /> تحميل
                          </a>
                          <button onClick={() => deleteFromGallery(item.id)}
                            className="h-7 w-7 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors" data-testid={`delete-gallery-${item.id}`}>
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
