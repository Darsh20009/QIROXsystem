import { useState, useRef, useEffect, useCallback } from "react";
import SARIcon from "@/components/SARIcon";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import {
  FileText, Image, Layers, Scissors, RotateCw, Type, Upload,
  Link2, Globe, Key, Hash, Shuffle, Code2, Loader2, Download,
  Copy, Check, Trash2, Eye, ExternalLink, Zap, ArrowRightLeft, Lock,
  AlignLeft, Replace, AlignJustify, Percent, Activity, Ruler, Calendar,
  BookOpen, Binary, Tag, Pipette, Palette, Paintbrush, QrCode, Timer,
  Hourglass, Receipt, StickyNote, ShieldCheck, Mail, Minimize2, Maximize2,
  Moon, Radio, Keyboard, Calculator, Clock, Code, FileCode, ArrowLeft,
  Sun, Languages, Regex, GitBranch, Filter, ChevronDown, Play, Pause,
  Square, Volume2, Globe2, Printer, Plus, Minus, RefreshCw, Wand2,
  Layers3, SquareDashed, FlipVertical, MoveHorizontal
} from "lucide-react";

// ─── All 62 Tool Definitions ─────────────────────────────────────────────────
export const ALL_TOOLS = [
  // PDF Tools
  { id: "img-to-pdf",     cat: "pdf",         icon: Image,          label: "صور → PDF",              desc: "حوّل صورة أو مجموعة صور إلى ملف PDF",         color: "from-blue-500 to-cyan-500",       badge: "" },
  { id: "pdf-merge",      cat: "pdf",         icon: Layers,         label: "دمج PDF",                 desc: "ادمج أكثر من ملف PDF في ملف واحد",             color: "from-purple-500 to-pink-500",     badge: "" },
  { id: "pdf-split",      cat: "pdf",         icon: Scissors,       label: "تقسيم PDF",               desc: "استخرج صفحات محددة من ملف PDF",                color: "from-orange-500 to-red-500",      badge: "" },
  { id: "pdf-rotate",     cat: "pdf",         icon: RotateCw,       label: "تدوير PDF",               desc: "دوّر صفحات PDF بالزاوية التي تريدها",           color: "from-green-500 to-teal-500",      badge: "" },
  { id: "pdf-watermark",  cat: "pdf",         icon: Type,           label: "ختم مائي PDF",            desc: "أضف ختماً مائياً على جميع صفحات PDF",           color: "from-amber-500 to-yellow-500",    badge: "" },
  { id: "docx-to-pdf",    cat: "pdf",         icon: FileText,       label: "Word → PDF",              desc: "حوّل ملف Word إلى PDF بجودة عالية",             color: "from-indigo-500 to-blue-500",     badge: "" },
  // Tech Tools
  { id: "html-publish",   cat: "tech",        icon: Globe,          label: "نشر HTML",                desc: "انشر صفحة HTML واحصل على رابط مباشر",          color: "from-cyan-500 to-blue-600",       badge: "مميز" },
  { id: "url-shorten",    cat: "tech",        icon: Link2,          label: "اختصار الروابط",          desc: "قصّر أي رابط طويل واحصل على رابط قصير",        color: "from-pink-500 to-rose-500",       badge: "" },
  { id: "base64",         cat: "tech",        icon: ArrowRightLeft, label: "محول Base64",             desc: "حوّل النصوص من وإلى تشفير Base64",             color: "from-violet-500 to-purple-600",   badge: "" },
  { id: "password-gen",   cat: "tech",        icon: Key,            label: "منشئ كلمات المرور",       desc: "أنشئ كلمات مرور قوية وعشوائية",                color: "from-red-500 to-orange-500",      badge: "" },
  { id: "uuid-gen",       cat: "tech",        icon: Shuffle,        label: "منشئ UUID",               desc: "أنشئ UUID فريداً بنقرة واحدة",                 color: "from-teal-500 to-green-500",      badge: "" },
  { id: "json-csv",       cat: "tech",        icon: Hash,           label: "JSON ↔ CSV",              desc: "حوّل بياناتك بين JSON و CSV",                  color: "from-amber-500 to-orange-600",    badge: "" },
  // Text Tools
  { id: "word-counter",   cat: "text",        icon: AlignLeft,      label: "عداد الكلمات",            desc: "عدّ الكلمات والأحرف والأسطر في نصك",          color: "from-sky-500 to-blue-500",        badge: "" },
  { id: "case-converter", cat: "text",        icon: Type,           label: "محوّل الحالة",            desc: "حوّل النص بين UPPER وlower وTitle وغيرها",    color: "from-fuchsia-500 to-purple-500",  badge: "" },
  { id: "text-diff",      cat: "text",        icon: GitBranch,      label: "مقارنة النصوص",           desc: "قارن نصين واعرض الفروقات بين السطور",          color: "from-rose-500 to-pink-500",       badge: "" },
  { id: "text-reverser",  cat: "text",        icon: FlipVertical,   label: "عاكس النص",               desc: "اعكس ترتيب الحروف أو الكلمات في نصك",         color: "from-orange-500 to-amber-500",    badge: "" },
  { id: "line-sorter",    cat: "text",        icon: AlignJustify,   label: "مرتب الأسطر",             desc: "رتب الأسطر أبجدياً أو عكسياً أو عشوائياً",    color: "from-lime-500 to-green-500",      badge: "" },
  { id: "remove-dupes",   cat: "text",        icon: Filter,         label: "إزالة المكررات",          desc: "احذف الأسطر المتكررة في نصك تلقائياً",        color: "from-teal-500 to-cyan-500",       badge: "" },
  { id: "find-replace",   cat: "text",        icon: Replace,        label: "إيجاد واستبدال",          desc: "ابحث عن نص واستبدله في محتواك",               color: "from-violet-500 to-indigo-500",   badge: "" },
  { id: "lorem-ipsum",    cat: "text",        icon: FileCode,       label: "نص تجريبي",               desc: "اٍنشئ نصوص Lorem ipsum بضغطة واحدة",           color: "from-gray-500 to-slate-600",      badge: "" },
  // Math/Numbers
  { id: "calc-percentage",cat: "math",        icon: Percent,        label: "حاسبة النسبة",            desc: "احسب النسب المئوية والزيادات والخصومات",       color: "from-blue-600 to-indigo-600",     badge: "" },
  { id: "calc-bmi",       cat: "math",        icon: Activity,       label: "حاسبة BMI",               desc: "احسب مؤشر كتلة جسمك وصنفّ وزنك",             color: "from-green-600 to-emerald-500",   badge: "" },
  { id: "unit-converter", cat: "math",        icon: Ruler,          label: "محوّل الوحدات",           desc: "حوّل بين الأوزان والأطوال والحرارة والمساحة",  color: "from-amber-600 to-orange-500",    badge: "" },
  { id: "calc-age",       cat: "math",        icon: Calendar,       label: "حاسبة العمر",             desc: "احسب عمرك بالسنوات والأشهر والأيام",           color: "from-rose-500 to-red-600",        badge: "" },
  { id: "roman-numerals", cat: "math",        icon: BookOpen,       label: "الأرقام الرومانية",       desc: "حوّل الأرقام إلى رومانية والعكس",              color: "from-amber-700 to-yellow-600",    badge: "" },
  { id: "binary-hex",     cat: "math",        icon: Binary,         label: "محوّل الأنظمة العددية",   desc: "حوّل بين الثنائي والثماني والعشري والسادس عشر", color: "from-slate-600 to-gray-700",      badge: "" },
  { id: "calc-discount",  cat: "math",        icon: Tag,            label: "حاسبة الخصم",             desc: "احسب السعر بعد الخصم ومقدار التوفير",          color: "from-pink-600 to-rose-500",       badge: "" },
  { id: "arabic-num-words", cat: "math",      icon: Languages,      label: "الأرقام بالكلمات",        desc: "حوّل الأرقام إلى كلمات عربية",                color: "from-emerald-600 to-teal-600",    badge: "" },
  // Design & Colors
  { id: "color-converter",cat: "design",      icon: Pipette,        label: "محوّل الألوان",           desc: "حوّل بين HEX وRGB وHSL بسهولة",               color: "from-pink-500 to-fuchsia-500",    badge: "" },
  { id: "gradient-gen",   cat: "design",      icon: Palette,        label: "منشئ التدرج",             desc: "صمّم تدرجات CSS ملونة واحصل على كودها",        color: "from-purple-500 to-pink-500",     badge: "" },
  { id: "qr-gen",         cat: "design",      icon: QrCode,         label: "منشئ QR Code",            desc: "حوّل أي نص أو رابط إلى رمز QR",               color: "from-gray-700 to-gray-900",       badge: "" },
  { id: "shadow-gen",     cat: "design",      icon: Layers3,        label: "منشئ الظل CSS",           desc: "صمّم ظلالاً جميلة للعناصر واحصل على الكود",   color: "from-slate-500 to-blue-600",      badge: "" },
  { id: "border-radius",  cat: "design",      icon: SquareDashed,   label: "منشئ الحواف المدورة",     desc: "صمّم حواف مدورة باحترافية واحصل على CSS",      color: "from-cyan-600 to-teal-600",       badge: "" },
  { id: "color-palette",  cat: "design",      icon: Paintbrush,     label: "لوحة الألوان",            desc: "أنشئ لوحة ألوان متناسقة من لون أساسي",         color: "from-orange-500 to-amber-500",    badge: "" },
  { id: "contrast-checker",cat: "design",     icon: Sun,            label: "مدقق التباين",            desc: "تحقق من تباين الألوان ومعايير WCAG",           color: "from-yellow-600 to-amber-600",    badge: "" },
  // Dev Tools
  { id: "img-base64",     cat: "dev",         icon: Image,          label: "صورة → Base64",           desc: "حوّل الصور إلى Base64 والعكس",                 color: "from-blue-500 to-violet-500",     badge: "" },
  { id: "jwt-decoder",    cat: "dev",         icon: Key,            label: "فكّ تشفير JWT",           desc: "فكّ تشفير رموز JWT واعرض البيانات",            color: "from-orange-600 to-red-600",      badge: "" },
  { id: "json-format",    cat: "dev",         icon: Code,           label: "منسّق JSON",              desc: "نسّق وتحقق من صحة JSON بسهولة",               color: "from-green-500 to-emerald-600",   badge: "" },
  { id: "regex-tester",   cat: "dev",         icon: Code2,          label: "مختبر Regex",             desc: "اختبر التعابير النمطية في نصوصك",              color: "from-red-500 to-rose-600",        badge: "" },
  { id: "timestamp",      cat: "dev",         icon: Clock,          label: "محوّل Unix Timestamp",    desc: "حوّل بين التواريخ وUNIX timestamps",           color: "from-teal-600 to-cyan-600",       badge: "" },
  { id: "url-encode",     cat: "dev",         icon: Link2,          label: "ترميز URL",               desc: "رمّز أو فكّ ترميز URLs والنصوص",               color: "from-violet-600 to-purple-600",   badge: "" },
  { id: "html-entities",  cat: "dev",         icon: FileCode,       label: "HTML Entities",           desc: "رمّز أو فكّ ترميز HTML Entities",              color: "from-pink-600 to-fuchsia-600",    badge: "" },
  { id: "markdown-html",  cat: "dev",         icon: FileText,       label: "Markdown → HTML",         desc: "حوّل Markdown إلى HTML مع معاينة مباشرة",      color: "from-sky-600 to-blue-600",        badge: "" },
  { id: "hash-gen",       cat: "dev",         icon: Hash,           label: "منشئ الهاش",              desc: "احسب SHA-256 وSHA-512 لأي نص",                 color: "from-gray-600 to-slate-700",      badge: "" },
  // Productivity
  { id: "pomodoro",       cat: "productivity",icon: Timer,          label: "مؤقت بومودورو",           desc: "ركّز عملك مع مؤقت 25 دقيقة + 5 دقائق راحة",   color: "from-red-500 to-orange-500",      badge: "" },
  { id: "countdown",      cat: "productivity",icon: Hourglass,      label: "العد التنازلي",           desc: "حدد موعداً واحسب الوقت المتبقي",              color: "from-violet-500 to-indigo-500",   badge: "" },
  { id: "world-clock",    cat: "productivity",icon: Globe2,         label: "ساعة العالم",             desc: "اعرض الوقت الحالي في كبرى مدن العالم",         color: "from-blue-500 to-cyan-500",       badge: "" },
  { id: "invoice-gen",    cat: "productivity",icon: Receipt,        label: "منشئ الفاتورة",           desc: "أنشئ فاتورة احترافية وطبعها أو حفظها",         color: "from-emerald-500 to-green-600",   badge: "" },
  { id: "notes",          cat: "productivity",icon: StickyNote,     label: "مفكرتي السريعة",          desc: "دوّن ملاحظاتك وتُحفظ تلقائياً",               color: "from-yellow-500 to-amber-500",    badge: "" },
  { id: "password-strength",cat: "productivity",icon: ShieldCheck,  label: "محلل قوة المرور",         desc: "حلّل قوة كلمة مرورك واعرف كيف تقويها",         color: "from-indigo-500 to-blue-600",     badge: "" },
  { id: "email-validator",cat: "productivity",icon: Mail,           label: "مدقق البريد",             desc: "تحقق من صحة عنوان البريد الإلكتروني",          color: "from-sky-500 to-blue-500",        badge: "" },
  { id: "hashtag-gen",    cat: "productivity",icon: Hash,           label: "منشئ الهاشتاقات",         desc: "اٍنشئ هاشتاقات احترافية لمنشوراتك",           color: "from-pink-500 to-rose-500",       badge: "" },
  // Images
  { id: "img-compress",   cat: "images",      icon: Minimize2,      label: "ضغط الصور",               desc: "قلّل حجم صورك دون فقدان الجودة",               color: "from-orange-500 to-red-500",      badge: "" },
  { id: "img-grayscale",  cat: "images",      icon: MoveHorizontal, label: "الأبيض والأسود",           desc: "حوّل صورة ملونة إلى تدرج رمادي",              color: "from-gray-500 to-slate-600",      badge: "" },
  { id: "img-resize",     cat: "images",      icon: Maximize2,      label: "تغيير حجم الصور",         desc: "غيّر أبعاد صورتك بدقة مع الحفاظ على النسبة",  color: "from-teal-500 to-green-500",      badge: "" },
  // Arabic Tools
  { id: "tashkeel-remover",cat: "arabic",     icon: Languages,      label: "إزالة التشكيل",           desc: "احذف الحركات والتشكيل من النص العربي",         color: "from-emerald-600 to-green-700",   badge: "" },
  { id: "hijri-date",     cat: "arabic",      icon: Moon,           label: "التقويم الهجري",          desc: "حوّل بين التاريخ الميلادي والهجري",            color: "from-indigo-600 to-violet-600",   badge: "" },
  { id: "text-to-morse",  cat: "arabic",      icon: Radio,          label: "نص إلى مورس",             desc: "حوّل النصوص إلى وفك ترميز مورس",              color: "from-amber-600 to-orange-600",    badge: "" },
  { id: "typing-test",    cat: "arabic",      icon: Keyboard,       label: "اختبار سرعة الطباعة",     desc: "اختبر سرعتك ودقتك في الكتابة",                color: "from-blue-600 to-cyan-600",       badge: "" },
  { id: "css-minify",     cat: "arabic",      icon: Code2,          label: "ضغط CSS",                 desc: "اضغط كود CSS وقلل حجمه تلقائياً",              color: "from-pink-600 to-purple-600",     badge: "" },
  { id: "svg-to-png",     cat: "arabic",      icon: Wand2,          label: "SVG → PNG",               desc: "حوّل ملفات SVG إلى صور PNG",                  color: "from-violet-500 to-fuchsia-600",  badge: "" },
  { id: "number-base",    cat: "arabic",      icon: Calculator,     label: "محوّل الأرقام",            desc: "حوّل الأرقام بين الأنظمة المختلفة",            color: "from-rose-600 to-red-600",        badge: "" },
];

export const CATEGORIES = [
  { id: "pdf",          label: "📄 أدوات PDF",            color: "from-blue-500 to-cyan-500"    },
  { id: "tech",         label: "⚡ خدمات تقنية",           color: "from-pink-500 to-rose-500"    },
  { id: "text",         label: "📝 أدوات النصوص",          color: "from-violet-500 to-purple-500" },
  { id: "math",         label: "🔢 الأعداد والرياضيات",    color: "from-green-500 to-emerald-500"  },
  { id: "design",       label: "🎨 التصميم والألوان",      color: "from-orange-500 to-amber-500" },
  { id: "dev",          label: "💻 أدوات المطورين",        color: "from-slate-500 to-gray-600"   },
  { id: "productivity", label: "⏰ الإنتاجية",             color: "from-teal-500 to-cyan-500"    },
  { id: "images",       label: "🖼️ معالجة الصور",          color: "from-red-500 to-orange-500"   },
  { id: "arabic",       label: "🌙 أدوات عربية وأخرى",     color: "from-indigo-500 to-blue-600"  },
];

// ─── Utilities ───────────────────────────────────────────────────────────────
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
async function pdfLib() { return await import("pdf-lib"); }
function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [ok, setOk] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1800); };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] transition-colors text-black/60 dark:text-white/60" data-testid="btn-copy">
      {ok ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
      {ok ? "تم النسخ!" : (label || "نسخ")}
    </button>
  );
}
function ResultBox({ value, label }: { value: string; label?: string }) {
  return value ? (
    <div className="mt-3">
      {label && <p className="text-xs text-black/40 dark:text-white/40 mb-1">{label}</p>}
      <div className="flex gap-2 items-start">
        <div className="flex-1 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.07] rounded-xl p-3 font-mono text-sm text-black dark:text-white break-all">{value}</div>
        <CopyBtn text={value} />
      </div>
    </div>
  ) : null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── EXISTING TOOL PANELS ───────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function ImgToPdfPanel() {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const handle = async () => {
    if (!files.length) return;
    setLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const dataUrl = await new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = e => resolve(e.target?.result as string); r.onerror = reject; r.readAsDataURL(file); });
        const img = new window.Image();
        await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = dataUrl; });
        if (i > 0) pdf.addPage();
        const [w, h] = [210, 297];
        const ratio = Math.min(w / img.width, h / img.height);
        const [iw, ih] = [img.width * ratio, img.height * ratio];
        pdf.addImage(dataUrl, file.type.includes("png") ? "PNG" : "JPEG", (w - iw) / 2, (h - ih) / 2, iw, ih);
      }
      pdf.save("images-to-pdf.pdf");
      toast({ title: "✅ تم إنشاء PDF بنجاح" });
    } catch { toast({ title: "خطأ في التحويل", variant: "destructive" }); }
    setLoading(false);
  };
  return (
    <div className="space-y-4">
      <input ref={ref} type="file" multiple accept="image/*" className="hidden" onChange={e => setFiles(Array.from(e.target.files || []))} />
      <div onClick={() => ref.current?.click()} className="border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl p-10 text-center cursor-pointer hover:border-cyan-400 hover:bg-cyan-50/30 dark:hover:bg-cyan-900/10 transition-all" data-testid="dropzone-img-pdf">
        <Image className="w-10 h-10 text-black/20 dark:text-white/20 mx-auto mb-3" />
        <p className="text-sm font-medium text-black/50 dark:text-white/50">اضغط لاختيار صور (PNG، JPEG)</p>
      </div>
      {files.length > 0 && <div className="space-y-2">{files.map((f, i) => <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] text-sm"><Image className="w-4 h-4 text-blue-500 shrink-0" /><span className="flex-1 truncate text-black dark:text-white">{f.name}</span><button onClick={() => setFiles(p => p.filter((_, j) => j !== i))} className="text-black/30 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></div>)}</div>}
      <Button onClick={handle} disabled={!files.length || loading} className="w-full gap-2 bg-gradient-to-l from-blue-500 to-cyan-500 text-white" data-testid="btn-img-to-pdf">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {loading ? "جارٍ التحويل..." : `تحويل ${files.length || ""} صورة إلى PDF`}
      </Button>
    </div>
  );
}

function PdfMergePanel() {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const handle = async () => {
    if (files.length < 2) { toast({ title: "أضف ملفين على الأقل", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const { PDFDocument } = await pdfLib();
      const merged = await PDFDocument.create();
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = await merged.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(p => merged.addPage(p));
      }
      const out = await merged.save();
      downloadBlob(new Blob([out], { type: "application/pdf" }), "merged.pdf");
      toast({ title: "✅ تم الدمج بنجاح" });
    } catch { toast({ title: "خطأ في الدمج", variant: "destructive" }); }
    setLoading(false);
  };
  return (
    <div className="space-y-4">
      <input ref={ref} type="file" multiple accept=".pdf" className="hidden" onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
      <div onClick={() => ref.current?.click()} className="border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl p-10 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 dark:hover:bg-purple-900/10 transition-all" data-testid="dropzone-merge">
        <Layers className="w-10 h-10 text-black/20 dark:text-white/20 mx-auto mb-3" />
        <p className="text-sm font-medium text-black/50 dark:text-white/50">اضغط لإضافة ملفات PDF</p>
      </div>
      {files.length > 0 && <div className="space-y-2">{files.map((f, i) => <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] text-sm"><span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 text-xs flex items-center justify-center font-bold shrink-0">{i+1}</span><span className="flex-1 truncate text-black dark:text-white">{f.name}</span><button onClick={() => setFiles(p => p.filter((_, j) => j !== i))} className="text-black/30 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></div>)}</div>}
      <Button onClick={handle} disabled={files.length < 2 || loading} className="w-full gap-2 bg-gradient-to-l from-purple-500 to-pink-500 text-white" data-testid="btn-pdf-merge">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {loading ? "جارٍ الدمج..." : `دمج ${files.length} ملفات`}
      </Button>
    </div>
  );
}

function PdfSplitPanel() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState("");
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const handle = async () => {
    if (!file || !pages.trim()) return;
    setLoading(true);
    try {
      const { PDFDocument } = await pdfLib();
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const total = pdf.getPageCount();
      const indices: number[] = [];
      pages.split(",").forEach(part => {
        const t = part.trim();
        if (t.includes("-")) { const [s, e] = t.split("-").map(n => parseInt(n.trim()) - 1); for (let i = s; i <= Math.min(e, total - 1); i++) if (i >= 0) indices.push(i); }
        else { const n = parseInt(t) - 1; if (n >= 0 && n < total) indices.push(n); }
      });
      if (!indices.length) { toast({ title: "أرقام الصفحات غير صحيحة", variant: "destructive" }); setLoading(false); return; }
      const out = await PDFDocument.create();
      const copied = await out.copyPages(pdf, indices);
      copied.forEach(p => out.addPage(p));
      downloadBlob(new Blob([await out.save()], { type: "application/pdf" }), "split.pdf");
      toast({ title: `✅ تم استخراج ${indices.length} صفحات` });
    } catch { toast({ title: "خطأ في التقسيم", variant: "destructive" }); }
    setLoading(false);
  };
  return (
    <div className="space-y-4">
      <input ref={ref} type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
      <div onClick={() => ref.current?.click()} className="border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl p-8 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 dark:hover:bg-orange-900/10 transition-all" data-testid="dropzone-split">
        {file ? <p className="text-sm font-medium text-black dark:text-white">{file.name}</p> : <><Scissors className="w-10 h-10 text-black/20 dark:text-white/20 mx-auto mb-3" /><p className="text-sm font-medium text-black/50 dark:text-white/50">اضغط لاختيار ملف PDF</p></>}
      </div>
      <div><label className="text-xs text-black/40 dark:text-white/40 mb-1 block">أرقام الصفحات (مثال: 1,3,5-8)</label><Input value={pages} onChange={e => setPages(e.target.value)} placeholder="1, 3, 5-8" data-testid="input-split-pages" /></div>
      <Button onClick={handle} disabled={!file || !pages.trim() || loading} className="w-full gap-2 bg-gradient-to-l from-orange-500 to-red-500 text-white" data-testid="btn-pdf-split">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {loading ? "جارٍ التقسيم..." : "استخراج الصفحات"}
      </Button>
    </div>
  );
}

function PdfRotatePanel() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [angle, setAngle] = useState<90|180|270>(90);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const handle = async () => {
    if (!file) return; setLoading(true);
    try {
      const { PDFDocument, degrees } = await pdfLib();
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      pdf.getPages().forEach(p => p.setRotation(degrees(angle)));
      downloadBlob(new Blob([await pdf.save()], { type: "application/pdf" }), "rotated.pdf");
      toast({ title: `✅ تم التدوير ${angle}°` });
    } catch { toast({ title: "خطأ في التدوير", variant: "destructive" }); }
    setLoading(false);
  };
  return (
    <div className="space-y-4">
      <input ref={ref} type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
      <div onClick={() => ref.current?.click()} className="border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl p-8 text-center cursor-pointer hover:border-green-400 hover:bg-green-50/30 dark:hover:bg-green-900/10 transition-all" data-testid="dropzone-rotate">
        {file ? <p className="text-sm font-medium text-black dark:text-white">{file.name}</p> : <><RotateCw className="w-10 h-10 text-black/20 dark:text-white/20 mx-auto mb-3" /><p className="text-sm font-medium text-black/50 dark:text-white/50">اضغط لاختيار ملف PDF</p></>}
      </div>
      <div className="flex gap-3">{([90,180,270] as const).map(a => <button key={a} onClick={() => setAngle(a)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${angle===a?"bg-green-500 text-white border-green-500":"border-black/10 dark:border-white/10 text-black/50 dark:text-white/50"}`} data-testid={`btn-angle-${a}`}>{a}°</button>)}</div>
      <Button onClick={handle} disabled={!file||loading} className="w-full gap-2 bg-gradient-to-l from-green-500 to-teal-500 text-white" data-testid="btn-pdf-rotate">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {loading ? "جارٍ التدوير..." : "تدوير وتنزيل"}
      </Button>
    </div>
  );
}

function PdfWatermarkPanel() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(0.25);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const handle = async () => {
    if (!file || !text.trim()) return; setLoading(true);
    try {
      const { PDFDocument, rgb, StandardFonts, degrees } = await pdfLib();
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const font = await pdf.embedFont(StandardFonts.HelveticaBold);
      pdf.getPages().forEach(page => {
        const { width, height } = page.getSize();
        const fontSize = Math.min(width, height) * 0.08;
        page.drawText(text, { x: (width - font.widthOfTextAtSize(text, fontSize)) / 2, y: (height - fontSize) / 2, size: fontSize, font, color: rgb(0.5, 0.5, 0.5), opacity, rotate: degrees(45) });
      });
      downloadBlob(new Blob([await pdf.save()], { type: "application/pdf" }), "watermarked.pdf");
      toast({ title: "✅ تم إضافة الختم المائي" });
    } catch { toast({ title: "خطأ في إضافة الختم", variant: "destructive" }); }
    setLoading(false);
  };
  return (
    <div className="space-y-4">
      <input ref={ref} type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
      <div onClick={() => ref.current?.click()} className="border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl p-8 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 dark:hover:bg-amber-900/10 transition-all" data-testid="dropzone-watermark">
        {file ? <p className="text-sm font-medium text-black dark:text-white">{file.name}</p> : <><Type className="w-10 h-10 text-black/20 dark:text-white/20 mx-auto mb-3" /><p className="text-sm font-medium text-black/50 dark:text-white/50">اضغط لاختيار ملف PDF</p></>}
      </div>
      <Input value={text} onChange={e => setText(e.target.value)} placeholder="نص الختم المائي" data-testid="input-watermark-text" />
      <div><label className="text-xs text-black/40 dark:text-white/40 mb-2 block">الشفافية: {Math.round(opacity*100)}%</label><input type="range" min={5} max={80} value={Math.round(opacity*100)} onChange={e => setOpacity(+e.target.value/100)} className="w-full accent-amber-500" /></div>
      <Button onClick={handle} disabled={!file||!text.trim()||loading} className="w-full gap-2 bg-gradient-to-l from-amber-500 to-yellow-500 text-white" data-testid="btn-pdf-watermark">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {loading ? "جارٍ الإضافة..." : "إضافة الختم وتنزيل"}
      </Button>
    </div>
  );
}

function DocxToPdfPanel() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const handle = async () => {
    if (!file) return; setLoading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/tools/docx-to-html", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const { html } = await res.json();
      const w = window.open("", "_blank");
      if (w) { w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>Word Doc</title><style>body{font-family:Arial,sans-serif;padding:40px;max-width:800px;margin:0 auto;line-height:1.6;}</style></head><body>${html}<script>window.onload=()=>{window.print();}<\/script></body></html>`); w.document.close(); toast({ title: "✅ افتح نافذة الطباعة لحفظ PDF" }); }
    } catch { toast({ title: "خطأ في التحويل", variant: "destructive" }); }
    setLoading(false);
  };
  return (
    <div className="space-y-4">
      <input ref={ref} type="file" accept=".docx" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-400">يتم تحويل الملف لـ HTML ثم يُفتح بنافذة طباعة — اختر «حفظ كـ PDF»</div>
      <div onClick={() => ref.current?.click()} className="border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl p-10 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all" data-testid="dropzone-docx">
        {file ? <><FileText className="w-8 h-8 text-indigo-500 mx-auto mb-2" /><p className="text-sm font-medium text-black dark:text-white">{file.name}</p></> : <><FileText className="w-10 h-10 text-black/20 dark:text-white/20 mx-auto mb-3" /><p className="text-sm font-medium text-black/50 dark:text-white/50">اضغط لاختيار ملف Word (.docx)</p></>}
      </div>
      <Button onClick={handle} disabled={!file||loading} className="w-full gap-2 bg-gradient-to-l from-indigo-500 to-blue-500 text-white" data-testid="btn-docx-pdf">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
        {loading ? "جارٍ التحويل..." : "تحويل وعرض للطباعة"}
      </Button>
    </div>
  );
}

function HtmlPublishPanel() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [html, setHtml] = useState("");
  const [copied, setCopied] = useState<string|null>(null);
  const { data: pages = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/tools/html-publish"] });
  const publishMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/tools/html-publish", { title: title || "صفحتي", content: html }),
    onSuccess: (data: any) => { queryClient.invalidateQueries({ queryKey: ["/api/tools/html-publish"] }); setTitle(""); setHtml(""); toast({ title: "✅ تم النشر!", description: data.url }); },
    onError: () => toast({ title: "فشل النشر", variant: "destructive" }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/tools/html-publish/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/tools/html-publish"] }); toast({ title: "تم الحذف" }); },
  });
  const copy = (text: string, id: string) => { navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(null), 2000); };
  return (
    <div className="space-y-5">
      <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="عنوان الصفحة (اختياري)" data-testid="input-html-title" />
      <Textarea value={html} onChange={e => setHtml(e.target.value)} placeholder={"<!DOCTYPE html>\n<html>\n<head><title>صفحتي</title></head>\n<body>\n  <h1>مرحباً!</h1>\n</body>\n</html>"} rows={8} className="font-mono text-xs" data-testid="textarea-html-content" />
      <Button onClick={() => publishMutation.mutate()} disabled={!html.trim()||publishMutation.isPending} className="w-full gap-2 bg-gradient-to-l from-cyan-500 to-blue-600 text-white" data-testid="btn-html-publish">
        {publishMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
        {publishMutation.isPending ? "جارٍ النشر..." : "نشر الصفحة"}
      </Button>
      {pages.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
          <p className="text-xs font-semibold text-black/40 dark:text-white/40">صفحاتك المنشورة</p>
          {pages.map((p: any) => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-black/[0.07] dark:border-white/[0.07]">
              <Globe className="w-4 h-4 text-cyan-500 shrink-0" />
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-black dark:text-white truncate">{p.title}</p><p className="text-[10px] text-black/30 dark:text-white/30">{p.views} مشاهدة</p></div>
              <button onClick={() => copy(p.url, p.id)} className="p-1.5 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-black/40 dark:text-white/40">{copied===p.id?<Check className="w-3.5 h-3.5 text-green-500"/>:<Copy className="w-3.5 h-3.5"/>}</button>
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-black/40 dark:text-white/40"><ExternalLink className="w-3.5 h-3.5" /></a>
              <button onClick={() => deleteMutation.mutate(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-black/30 dark:text-white/30 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UrlShortenPanel() {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [urlTitle, setUrlTitle] = useState("");
  const [copied, setCopied] = useState<string|null>(null);
  const { data: links = [] } = useQuery<any[]>({ queryKey: ["/api/tools/url-shorten"] });
  const shortenMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/tools/url-shorten", { originalUrl: url, title: urlTitle }),
    onSuccess: (data: any) => { queryClient.invalidateQueries({ queryKey: ["/api/tools/url-shorten"] }); setUrl(""); setUrlTitle(""); toast({ title: "✅ تم الاختصار!", description: data.url }); },
    onError: (e: any) => toast({ title: e?.message || "خطأ", variant: "destructive" }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/tools/url-shorten/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/tools/url-shorten"] }); toast({ title: "تم الحذف" }); },
  });
  const copy = (text: string, id: string) => { navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(null), 2000); };
  return (
    <div className="space-y-4">
      <Input value={urlTitle} onChange={e => setUrlTitle(e.target.value)} placeholder="عنوان الرابط (اختياري)" data-testid="input-url-title" />
      <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/very/long/url" type="url" data-testid="input-url" />
      <Button onClick={() => shortenMutation.mutate()} disabled={!url.trim()||shortenMutation.isPending} className="w-full gap-2 bg-gradient-to-l from-pink-500 to-rose-500 text-white" data-testid="btn-shorten">
        {shortenMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
        {shortenMutation.isPending ? "جارٍ الاختصار..." : "اختصار الرابط"}
      </Button>
      {links.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
          <p className="text-xs font-semibold text-black/40 dark:text-white/40">روابطك المختصرة</p>
          {links.map((l: any) => (
            <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl border border-black/[0.07] dark:border-white/[0.07]">
              <Link2 className="w-4 h-4 text-pink-500 shrink-0" />
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-black dark:text-white">{l.title||"رابط"}</p><p className="text-[10px] text-black/30 dark:text-white/30 truncate">{l.shortUrl} · {l.clicks||0} نقرة</p></div>
              <button onClick={() => copy(l.shortUrl, l.id)} className="p-1.5 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-black/40 dark:text-white/40">{copied===l.id?<Check className="w-3.5 h-3.5 text-green-500"/>:<Copy className="w-3.5 h-3.5"/>}</button>
              <button onClick={() => deleteMutation.mutate(l.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-black/30 dark:text-white/30 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Base64Panel() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"encode"|"decode">("encode");
  const result = (() => { try { return mode === "encode" ? btoa(unescape(encodeURIComponent(input))) : decodeURIComponent(escape(atob(input))); } catch { return "⚠️ خطأ في التحويل"; } })();
  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl">{(["encode","decode"] as const).map(m => <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode===m?"bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm":"text-black/40 dark:text-white/40"}`} data-testid={`btn-base64-${m}`}>{m==="encode"?"تشفير (Encode)":"فك تشفير (Decode)"}</button>)}</div>
      <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder={mode==="encode"?"أدخل النص هنا...":"أدخل Base64 هنا..."} rows={4} data-testid="textarea-base64" />
      <ResultBox value={result} label="النتيجة:" />
    </div>
  );
}

function PasswordGenPanel() {
  const [length, setLength] = useState(16);
  const [opts, setOpts] = useState({ upper: true, lower: true, numbers: true, symbols: true });
  const [password, setPassword] = useState("");
  const [count, setCount] = useState(1);
  const generate = () => {
    const chars = [opts.upper?"ABCDEFGHIJKLMNOPQRSTUVWXYZ":"", opts.lower?"abcdefghijklmnopqrstuvwxyz":"", opts.numbers?"0123456789":"", opts.symbols?"!@#$%^&*()-_=+[]{}|;:,.<>?":""].join("");
    if (!chars) return;
    setPassword(Array.from({ length: count }, () => Array.from(crypto.getRandomValues(new Uint8Array(length))).map(b => chars[b % chars.length]).join("")).join("\n"));
  };
  return (
    <div className="space-y-4">
      <div><label className="text-xs text-black/40 dark:text-white/40 mb-2 block">الطول: {length} حرف</label><input type="range" min={8} max={64} value={length} onChange={e => setLength(+e.target.value)} className="w-full accent-red-500" /></div>
      <div className="grid grid-cols-2 gap-2">{Object.entries(opts).map(([k, v]) => <label key={k} className="flex items-center gap-2 p-2.5 rounded-xl border border-black/[0.07] dark:border-white/[0.07] cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"><input type="checkbox" checked={v} onChange={e => setOpts(o => ({...o,[k]:e.target.checked}))} className="accent-red-500" /><span className="text-sm text-black dark:text-white">{k==="upper"?"أحرف كبيرة":k==="lower"?"أحرف صغيرة":k==="numbers"?"أرقام":"رموز خاصة"}</span></label>)}</div>
      <div><label className="text-xs text-black/40 dark:text-white/40 mb-2 block">العدد: {count} كلمة مرور</label><input type="range" min={1} max={10} value={count} onChange={e => setCount(+e.target.value)} className="w-full accent-orange-500" /></div>
      <Button onClick={generate} className="w-full gap-2 bg-gradient-to-l from-red-500 to-orange-500 text-white" data-testid="btn-gen-password"><Key className="w-4 h-4" />توليد كلمة المرور</Button>
      {password && <div className="mt-3"><div className="flex items-start gap-2"><div className="flex-1 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.07] rounded-xl p-3 font-mono text-sm text-black dark:text-white break-all whitespace-pre-wrap">{password}</div><CopyBtn text={password} /></div></div>}
    </div>
  );
}

function UuidGenPanel() {
  const [uuids, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState(5);
  const generate = () => setUuids(Array.from({ length: count }, () => crypto.randomUUID()));
  return (
    <div className="space-y-4">
      <div><label className="text-xs text-black/40 dark:text-white/40 mb-2 block">العدد: {count}</label><input type="range" min={1} max={20} value={count} onChange={e => setCount(+e.target.value)} className="w-full accent-teal-500" /></div>
      <Button onClick={generate} className="w-full gap-2 bg-gradient-to-l from-teal-500 to-green-500 text-white" data-testid="btn-gen-uuid"><Shuffle className="w-4 h-4" />توليد {count} UUID</Button>
      {uuids.length > 0 && <div className="space-y-2"><div className="flex items-center justify-between"><p className="text-xs text-black/40 dark:text-white/40">النتائج</p><CopyBtn text={uuids.join("\n")} label="نسخ الكل" /></div>{uuids.map((u,i) => <div key={i} className="flex items-center gap-2"><div className="flex-1 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.07] rounded-lg p-2.5 font-mono text-xs text-black dark:text-white">{u}</div><CopyBtn text={u} /></div>)}</div>}
    </div>
  );
}

function JsonCsvPanel() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"json-to-csv"|"csv-to-json">("json-to-csv");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const convert = () => {
    setError(""); setResult("");
    try {
      if (mode === "json-to-csv") {
        const data = JSON.parse(input);
        const arr = Array.isArray(data) ? data : [data];
        const keys = Object.keys(arr[0] || {});
        setResult([keys.join(","), ...arr.map(r => keys.map(k => JSON.stringify(r[k] ?? "")).join(","))].join("\n"));
      } else {
        const lines = input.trim().split("\n");
        const keys = lines[0].split(",");
        setResult(JSON.stringify(lines.slice(1).map(line => { const vals = line.split(","); return Object.fromEntries(keys.map((k, i) => [k.trim(), vals[i]?.replace(/^"|"$/g,"").trim()])); }), null, 2));
      }
    } catch { setError("خطأ في التحويل — تحقق من صحة البيانات"); }
  };
  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl">{(["json-to-csv","csv-to-json"] as const).map(m => <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode===m?"bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm":"text-black/40 dark:text-white/40"}`}>{m==="json-to-csv"?"JSON → CSV":"CSV → JSON"}</button>)}</div>
      <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder={mode==="json-to-csv"?'[{"name":"أحمد","age":25}]':"name,age\nأحمد,25"} rows={6} className="font-mono text-xs" />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <Button onClick={convert} disabled={!input.trim()} className="w-full gap-2 bg-gradient-to-l from-amber-500 to-orange-600 text-white"><Hash className="w-4 h-4" />تحويل</Button>
      {result && <div className="flex items-start gap-2"><div className="flex-1 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.07] rounded-xl p-3 font-mono text-xs text-black dark:text-white max-h-48 overflow-auto">{result}</div><CopyBtn text={result} /></div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── NEW 50 TOOL PANELS ─────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// TEXT TOOLS

function WordCounterPanel() {
  const [text, setText] = useState("");
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const charsNoSpace = text.replace(/\s/g, "").length;
  const lines = text ? text.split("\n").length : 0;
  const sentences = text.trim() ? text.split(/[.!?؟]\s+/).filter(Boolean).length : 0;
  const readingTime = Math.max(1, Math.ceil(words / 200));
  return (
    <div className="space-y-4">
      <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="أدخل نصك هنا..." rows={6} data-testid="textarea-word-counter" />
      <div className="grid grid-cols-3 gap-3">
        {[["الكلمات",words,"text-blue-500"],["الأحرف",chars,"text-purple-500"],["بدون فراغ",charsNoSpace,"text-green-500"],["الأسطر",lines,"text-orange-500"],["الجمل",sentences,"text-pink-500"],["دقائق قراءة",readingTime,"text-cyan-500"]].map(([l,v,c]) => (
          <div key={String(l)} className="text-center p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06]">
            <p className={`text-2xl font-black ${c}`}>{v}</p>
            <p className="text-[11px] text-black/40 dark:text-white/40 mt-0.5">{l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CaseConverterPanel() {
  const [input, setInput] = useState("");
  const convert = (fn: (s: string) => string) => setInput(fn(input));
  const toTitle = (s: string) => s.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
  const toCamel = (s: string) => s.replace(/(?:^\w|[A-Z]|\b\w|\s+\w)/g, (m, i) => i === 0 ? m.toLowerCase() : m.toUpperCase()).replace(/\s+/g, "");
  const toSnake = (s: string) => s.toLowerCase().replace(/\s+/g, "_");
  const toKebab = (s: string) => s.toLowerCase().replace(/\s+/g, "-");
  const btns = [["UPPERCASE","bg-blue-500 text-white",() => convert(s => s.toUpperCase())],["lowercase","bg-purple-500 text-white",() => convert(s => s.toLowerCase())],["Title Case","bg-green-500 text-white",() => convert(toTitle)],["Sentence case","bg-orange-500 text-white",() => convert(s => s.charAt(0).toUpperCase()+s.slice(1).toLowerCase())],["camelCase","bg-pink-500 text-white",() => convert(toCamel)],["snake_case","bg-cyan-500 text-white",() => convert(toSnake)],["kebab-case","bg-amber-500 text-white",() => convert(toKebab)]];
  return (
    <div className="space-y-4">
      <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder="أدخل النص هنا..." rows={5} data-testid="textarea-case" />
      <div className="flex flex-wrap gap-2">{btns.map(([l,c,fn]) => <button key={String(l)} onClick={fn as any} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${c} hover:opacity-90 transition-opacity`} data-testid={`btn-case-${String(l).replace(/\s/g,"-")}`}>{l as string}</button>)}</div>
      {input && <div className="flex items-start gap-2"><div className="flex-1 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.07] rounded-xl p-3 text-sm text-black dark:text-white">{input}</div><CopyBtn text={input} /></div>}
    </div>
  );
}

function TextDiffPanel() {
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const diff = (() => {
    const a = text1.split("\n"), b = text2.split("\n");
    const result: {type:"same"|"add"|"del", line:string}[] = [];
    const max = Math.max(a.length, b.length);
    for (let i = 0; i < max; i++) {
      if (a[i] === b[i]) result.push({type:"same", line: a[i]||""});
      else { if (a[i] !== undefined) result.push({type:"del", line: a[i]}); if (b[i] !== undefined) result.push({type:"add", line: b[i]}); }
    }
    return result;
  })();
  const adds = diff.filter(d => d.type === "add").length;
  const dels = diff.filter(d => d.type === "del").length;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-black/40 dark:text-white/40 mb-1 block">النص الأول</label><Textarea value={text1} onChange={e => setText1(e.target.value)} placeholder="النص الأصلي..." rows={5} /></div>
        <div><label className="text-xs text-black/40 dark:text-white/40 mb-1 block">النص الثاني</label><Textarea value={text2} onChange={e => setText2(e.target.value)} placeholder="النص الجديد..." rows={5} /></div>
      </div>
      {(text1 || text2) && (
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-xs"><span className="flex items-center gap-1 text-green-600 dark:text-green-400"><Plus className="w-3 h-3" />{adds} سطر مضاف</span><span className="flex items-center gap-1 text-red-500"><Minus className="w-3 h-3" />{dels} سطر محذوف</span></div>
          <div className="border border-black/[0.07] dark:border-white/[0.07] rounded-xl overflow-hidden max-h-56 overflow-y-auto">
            {diff.map((d, i) => (
              <div key={i} className={`px-3 py-1 text-xs font-mono ${d.type==="add"?"bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400":d.type==="del"?"bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400":"text-black/60 dark:text-white/60"}`}>
                {d.type==="add"?"+ ":d.type==="del"?"- ":"  "}{d.line || " "}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TextReverserPanel() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"chars"|"words"|"lines">("chars");
  const result = (() => {
    if (!input) return "";
    if (mode === "chars") return input.split("").reverse().join("");
    if (mode === "words") return input.split(/\s+/).reverse().join(" ");
    return input.split("\n").reverse().join("\n");
  })();
  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl">{(["chars","words","lines"] as const).map(m => <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${mode===m?"bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm":"text-black/40 dark:text-white/40"}`}>{m==="chars"?"عكس الأحرف":m==="words"?"عكس الكلمات":"عكس الأسطر"}</button>)}</div>
      <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder="أدخل النص هنا..." rows={4} data-testid="textarea-reverser" />
      <ResultBox value={result} label="النص المعكوس:" />
    </div>
  );
}

function LineSorterPanel() {
  const [input, setInput] = useState("");
  const sort = (fn: (a: string[]) => string[]) => { const lines = input.split("\n"); setInput(fn(lines).join("\n")); };
  return (
    <div className="space-y-4">
      <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder="أدخل الأسطر هنا (كل سطر منفصل)..." rows={6} data-testid="textarea-sort" />
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => sort(l => [...l].sort())} className="py-2.5 rounded-xl text-xs font-semibold bg-lime-500 text-white hover:opacity-90 transition-opacity">أ → ي</button>
        <button onClick={() => sort(l => [...l].sort().reverse())} className="py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 text-white hover:opacity-90 transition-opacity">ي → أ</button>
        <button onClick={() => sort(l => [...l].reverse())} className="py-2.5 rounded-xl text-xs font-semibold bg-teal-500 text-white hover:opacity-90 transition-opacity">عكس الترتيب</button>
        <button onClick={() => sort(l => [...l].sort((a,b) => a.length - b.length))} className="py-2.5 rounded-xl text-xs font-semibold bg-cyan-500 text-white hover:opacity-90 transition-opacity">الأقصر أولاً</button>
        <button onClick={() => sort(l => [...l].sort((a,b) => b.length - a.length))} className="py-2.5 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:opacity-90 transition-opacity">الأطول أولاً</button>
        <button onClick={() => sort(l => l.map(v => ({v, r: Math.random()})).sort((a,b) => a.r-b.r).map(o => o.v))} className="py-2.5 rounded-xl text-xs font-semibold bg-violet-500 text-white hover:opacity-90 transition-opacity">ترتيب عشوائي</button>
      </div>
      {input && <CopyBtn text={input} label="نسخ النتيجة" />}
    </div>
  );
}

function RemoveDupesPanel() {
  const [input, setInput] = useState("");
  const [caseSens, setCaseSens] = useState(true);
  const [trimLines, setTrimLines] = useState(true);
  const result = (() => {
    if (!input) return { text: "", removed: 0 };
    const lines = input.split("\n");
    const seen = new Set<string>();
    const out: string[] = [];
    for (const line of lines) {
      const key = (trimLines ? line.trim() : line);
      const cmpKey = caseSens ? key : key.toLowerCase();
      if (!seen.has(cmpKey)) { seen.add(cmpKey); out.push(line); }
    }
    return { text: out.join("\n"), removed: lines.length - out.length };
  })();
  return (
    <div className="space-y-4">
      <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder="أدخل النص (كل سطر منفصل)..." rows={6} data-testid="textarea-dupes" />
      <div className="flex gap-4">{[["caseSens","مراعاة الحالة",caseSens,setCaseSens],["trim","تجاهل المسافات",trimLines,setTrimLines]].map(([k,l,v,fn]) => <label key={String(k)} className="flex items-center gap-2 cursor-pointer text-sm text-black dark:text-white"><input type="checkbox" checked={v as boolean} onChange={e => (fn as any)(e.target.checked)} className="accent-teal-500" />{l as string}</label>)}</div>
      {result.removed > 0 && <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-400">تم حذف <strong>{result.removed}</strong> سطر مكرر</div>}
      {result.text && <div className="flex items-start gap-2"><div className="flex-1 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.07] rounded-xl p-3 text-sm font-mono text-black dark:text-white max-h-48 overflow-auto whitespace-pre-wrap">{result.text}</div><CopyBtn text={result.text} /></div>}
    </div>
  );
}

function FindReplacePanel() {
  const [text, setText] = useState("");
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [caseSens, setCaseSens] = useState(false);
  const [replaceAll, setReplaceAll] = useState(true);
  const count = (() => { if (!find || !text) return 0; try { const flags = caseSens ? "g" : "gi"; return (text.match(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"), flags)) || []).length; } catch { return 0; } })();
  const doReplace = () => {
    if (!find) return;
    try {
      const flags = `${replaceAll?"g":""}${caseSens?"":"i"}`;
      setText(text.replace(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"), flags), replace));
    } catch {}
  };
  return (
    <div className="space-y-4">
      <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="أدخل النص هنا..." rows={5} data-testid="textarea-findreplace" />
      <div className="grid grid-cols-2 gap-3"><Input value={find} onChange={e => setFind(e.target.value)} placeholder="البحث عن..." data-testid="input-find" /><Input value={replace} onChange={e => setReplace(e.target.value)} placeholder="استبدال بـ..." data-testid="input-replace" /></div>
      <div className="flex items-center gap-4 flex-wrap">
        {[["caseSens","مراعاة الحالة",caseSens,setCaseSens],["replaceAll","استبدال الكل",replaceAll,setReplaceAll]].map(([k,l,v,fn]) => <label key={String(k)} className="flex items-center gap-2 cursor-pointer text-sm text-black dark:text-white"><input type="checkbox" checked={v as boolean} onChange={e => (fn as any)(e.target.checked)} className="accent-violet-500" />{l as string}</label>)}
        {find && text && <span className="text-xs text-black/40 dark:text-white/40">{count} نتيجة</span>}
      </div>
      <Button onClick={doReplace} disabled={!find||!text} className="w-full gap-2 bg-gradient-to-l from-violet-500 to-indigo-500 text-white" data-testid="btn-replace"><Replace className="w-4 h-4" />{replaceAll?"استبدال الكل":"استبدال الأول"}</Button>
    </div>
  );
}

function LoremIpsumPanel() {
  const [paragraphs, setParagraphs] = useState(3);
  const [lang, setLang] = useState<"latin"|"arabic">("latin");
  const [result, setResult] = useState("");
  const latinWords = ["lorem","ipsum","dolor","sit","amet","consectetur","adipiscing","elit","sed","do","eiusmod","tempor","incididunt","ut","labore","dolore","magna","aliqua","enim","ad","minim","veniam","quis","nostrud","exercitation","ullamco","laboris","nisi","aliquip","commodo","consequat","duis","aute","irure","in","reprehenderit","voluptate","velit","esse","cillum","eu","fugiat","nulla","pariatur","excepteur","sint","occaecat","cupidatat","non","proident","culpa","qui","officia","deserunt","mollit","anim","est","laborum"];
  const arabicWords = ["في","على","من","إلى","كان","وقد","حتى","هذا","أن","كل","مع","هو","هي","لكن","قبل","بعد","عند","بين","نحن","لقد","الذي","التي","وهو","وهي","وقد","ولكن","إذا","حين","عندما","ثم","أيضاً","مثل","أول","آخر","تحت","فوق","خلف","أمام","حول","خلال","بينما","رغم","لأن","مما","مهما","كيف","لماذا","متى","أين","هناك","هكذا","جميع","بعض","كثير","قليل","مختلف","جديد","قديم","كبير","صغير","طويل","قصير"];
  const generate = () => {
    const words = lang === "latin" ? latinWords : arabicWords;
    const rand = (arr: string[], n: number) => Array.from({length:n}, () => arr[Math.floor(Math.random()*arr.length)]).join(" ");
    setResult(Array.from({length: paragraphs}, () => rand(words, 40+Math.floor(Math.random()*30))).join("\n\n"));
  };
  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl">{(["latin","arabic"] as const).map(m => <button key={m} onClick={() => setLang(m)} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${lang===m?"bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm":"text-black/40 dark:text-white/40"}`}>{m==="latin"?"Latin":"عربي"}</button>)}</div>
      <div><label className="text-xs text-black/40 dark:text-white/40 mb-2 block">عدد الفقرات: {paragraphs}</label><input type="range" min={1} max={10} value={paragraphs} onChange={e => setParagraphs(+e.target.value)} className="w-full accent-gray-500" /></div>
      <Button onClick={generate} className="w-full gap-2 bg-gradient-to-l from-gray-500 to-slate-600 text-white" data-testid="btn-lorem"><FileCode className="w-4 h-4" />توليد النص</Button>
      {result && <div className="flex items-start gap-2"><div className="flex-1 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.07] rounded-xl p-3 text-sm text-black dark:text-white max-h-56 overflow-auto leading-relaxed whitespace-pre-wrap">{result}</div><CopyBtn text={result} /></div>}
    </div>
  );
}

// MATH TOOLS

function CalcPercentagePanel() {
  const [mode, setMode] = useState(0);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const result = (() => {
    const x = parseFloat(a), y = parseFloat(b);
    if (isNaN(x) || isNaN(y)) return "";
    if (mode === 0) return `${((x/100)*y).toFixed(2)} — ${x}% من ${y}`;
    if (mode === 1) return `${((x/y)*100).toFixed(2)}% — ${x} هو ${((x/y)*100).toFixed(2)}% من ${y}`;
    if (mode === 2) return `${(y*(1+x/100)).toFixed(2)} — ${y} بعد زيادة ${x}%`;
    return `${(y*(1-x/100)).toFixed(2)} — ${y} بعد خصم ${x}%`;
  })();
  const modes = ["X% من Y","X هو كم % من Y","زيادة %","خصم %"];
  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">{modes.map((m,i) => <button key={i} onClick={() => setMode(i)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${mode===i?"bg-blue-600 text-white border-blue-600":"border-black/10 dark:border-white/10 text-black/50 dark:text-white/50"}`}>{m}</button>)}</div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-black/40 dark:text-white/40 mb-1 block">{mode===1?"القيمة X":"النسبة %"}</label><Input type="number" value={a} onChange={e => setA(e.target.value)} placeholder="0" /></div>
        <div><label className="text-xs text-black/40 dark:text-white/40 mb-1 block">القيمة Y</label><Input type="number" value={b} onChange={e => setB(e.target.value)} placeholder="0" /></div>
      </div>
      {result && <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-center"><p className="text-2xl font-black text-blue-600 dark:text-blue-400">{result.split("—")[0]}</p><p className="text-xs text-blue-500/70 mt-1">{result.split("—")[1]}</p></div>}
    </div>
  );
}

function CalcBmiPanel() {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const bmi = (() => {
    const w = parseFloat(weight), h = parseFloat(height) / 100;
    if (!w || !h) return null;
    const b = w / (h * h);
    const cat = b < 18.5 ? {l:"نقص في الوزن",c:"text-blue-500",bg:"bg-blue-50 dark:bg-blue-900/20"} : b < 25 ? {l:"وزن طبيعي",c:"text-green-500",bg:"bg-green-50 dark:bg-green-900/20"} : b < 30 ? {l:"زيادة في الوزن",c:"text-orange-500",bg:"bg-orange-50 dark:bg-orange-900/20"} : {l:"سمنة",c:"text-red-500",bg:"bg-red-50 dark:bg-red-900/20"};
    return { val: b.toFixed(1), ...cat };
  })();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-black/40 dark:text-white/40 mb-1 block">الوزن (كيلوغرام)</label><Input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="70" /></div>
        <div><label className="text-xs text-black/40 dark:text-white/40 mb-1 block">الطول (سنتيمتر)</label><Input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="175" /></div>
      </div>
      {bmi && (
        <div className={`p-5 rounded-2xl border ${bmi.bg}`}>
          <div className="text-center">
            <p className={`text-5xl font-black ${bmi.c}`}>{bmi.val}</p>
            <p className={`text-lg font-bold ${bmi.c} mt-2`}>{bmi.l}</p>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-1 text-xs text-center">
            {[["نقص","<18.5","text-blue-500"],["طبيعي","18.5-24.9","text-green-500"],["زيادة","25-29.9","text-orange-500"],["سمنة","≥30","text-red-500"]].map(([l,r,c]) => <div key={String(l)} className="p-2 rounded-lg bg-white/50 dark:bg-black/20"><p className={`font-bold ${c}`}>{r}</p><p className="text-black/40 dark:text-white/40">{l}</p></div>)}
          </div>
        </div>
      )}
    </div>
  );
}

function UnitConverterPanel() {
  const [cat, setCat] = useState("length");
  const [val, setVal] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const UNITS: Record<string, {label:string; units:{k:string;l:string;base:number}[]}> = {
    length: { label: "الطول", units: [{k:"m",l:"متر",base:1},{k:"km",l:"كيلومتر",base:1000},{k:"cm",l:"سنتيمتر",base:0.01},{k:"mm",l:"مليمتر",base:0.001},{k:"inch",l:"إنش",base:0.0254},{k:"ft",l:"قدم",base:0.3048},{k:"mi",l:"ميل",base:1609.344}] },
    weight: { label: "الوزن", units: [{k:"kg",l:"كيلوغرام",base:1},{k:"g",l:"غرام",base:0.001},{k:"lb",l:"رطل",base:0.453592},{k:"oz",l:"أونصة",base:0.028349},{k:"ton",l:"طن",base:1000}] },
    temp: { label: "الحرارة", units: [{k:"c",l:"مئوية °C",base:1},{k:"f",l:"فهرنهايت °F",base:1},{k:"k",l:"كلفن K",base:1}] },
    area: { label: "المساحة", units: [{k:"m2",l:"م²",base:1},{k:"km2",l:"كم²",base:1e6},{k:"cm2",l:"سم²",base:0.0001},{k:"acre",l:"فدان",base:4046.86},{k:"ha",l:"هكتار",base:10000}] },
    speed: { label: "السرعة", units: [{k:"ms",l:"م/ث",base:1},{k:"kmh",l:"كم/س",base:0.277778},{k:"mph",l:"ميل/س",base:0.44704},{k:"knot",l:"عقدة",base:0.514444}] },
  };
  const cats = Object.keys(UNITS);
  const units = UNITS[cat].units;
  const result = (() => {
    const v = parseFloat(val);
    if (isNaN(v) || !from || !to) return "";
    const f = units.find(u => u.k === from), t = units.find(u => u.k === to);
    if (!f || !t) return "";
    if (cat === "temp") {
      let inC = from==="c"?v:from==="f"?(v-32)/1.8:v-273.15;
      const r = to==="c"?inC:to==="f"?inC*1.8+32:inC+273.15;
      return r.toFixed(4);
    }
    return ((v * f.base) / t.base).toFixed(6).replace(/\.?0+$/, "");
  })();
  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 flex-wrap">{cats.map(c => <button key={c} onClick={() => {setCat(c);setFrom("");setTo("");}} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${cat===c?"bg-amber-600 text-white border-amber-600":"border-black/10 dark:border-white/10 text-black/50 dark:text-white/50"}`}>{UNITS[c].label}</button>)}</div>
      <Input type="number" value={val} onChange={e => setVal(e.target.value)} placeholder="أدخل القيمة..." />
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-black/40 dark:text-white/40 mb-1 block">من</label><select value={from} onChange={e => setFrom(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-gray-900 text-sm text-black dark:text-white"><option value="">اختر وحدة</option>{units.map(u => <option key={u.k} value={u.k}>{u.l}</option>)}</select></div>
        <div><label className="text-xs text-black/40 dark:text-white/40 mb-1 block">إلى</label><select value={to} onChange={e => setTo(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-gray-900 text-sm text-black dark:text-white"><option value="">اختر وحدة</option>{units.map(u => <option key={u.k} value={u.k}>{u.l}</option>)}</select></div>
      </div>
      {result && <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-center"><p className="text-3xl font-black text-amber-600 dark:text-amber-400">{result}</p><p className="text-xs text-amber-500/70 mt-1">{val} {units.find(u=>u.k===from)?.l} = {result} {units.find(u=>u.k===to)?.l}</p></div>}
    </div>
  );
}

function CalcAgePanel() {
  const [dob, setDob] = useState("");
  const age = (() => {
    if (!dob) return null;
    const birth = new Date(dob), now = new Date();
    if (birth > now) return null;
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();
    if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (months < 0) { years--; months += 12; }
    const totalDays = Math.floor((now.getTime() - birth.getTime()) / 86400000);
    const nextBirthday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
    if (nextBirthday <= now) nextBirthday.setFullYear(now.getFullYear() + 1);
    const daysToNext = Math.ceil((nextBirthday.getTime() - now.getTime()) / 86400000);
    return { years, months, days, totalDays, daysToNext };
  })();
  return (
    <div className="space-y-4">
      <div><label className="text-xs text-black/40 dark:text-white/40 mb-1 block">تاريخ الميلاد</label><Input type="date" value={dob} onChange={e => setDob(e.target.value)} max={new Date().toISOString().split("T")[0]} data-testid="input-dob" /></div>
      {age && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[["السنوات",age.years,"text-rose-500"],["الأشهر",age.months,"text-orange-500"],["الأيام",age.days,"text-amber-500"]].map(([l,v,c]) => <div key={String(l)} className="text-center p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06]"><p className={`text-3xl font-black ${c}`}>{v}</p><p className="text-xs text-black/40 dark:text-white/40 mt-1">{l}</p></div>)}
          </div>
          <div className="p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] text-sm text-black dark:text-white text-center">إجمالي الأيام: <strong>{age.totalDays.toLocaleString("ar")}</strong> يوم · عيد الميلاد القادم بعد <strong>{age.daysToNext}</strong> يوم</div>
        </div>
      )}
    </div>
  );
}

function RomanNumeralsPanel() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"to-roman"|"to-arabic">("to-roman");
  const toRoman = (n: number): string => {
    if (n < 1 || n > 3999) return "⚠️ أدخل رقماً بين 1 و 3999";
    const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
    const syms = ["M","CM","D","CD","C","XC","L","XL","X","IX","V","IV","I"];
    let result = "";
    vals.forEach((v,i) => { while(n >= v) { result += syms[i]; n -= v; } });
    return result;
  };
  const fromRoman = (s: string): string => {
    const map: Record<string,number> = {I:1,V:5,X:10,L:50,C:100,D:500,M:1000};
    let result = 0;
    const clean = s.toUpperCase().trim();
    for (let i = 0; i < clean.length; i++) {
      const cur = map[clean[i]], next = map[clean[i+1]];
      if (!cur) return "⚠️ رمز غير صحيح";
      if (next && cur < next) result -= cur; else result += cur;
    }
    return result > 0 ? String(result) : "⚠️ غير صحيح";
  };
  const result = (() => {
    if (!input.trim()) return "";
    if (mode === "to-roman") { const n = parseInt(input); return isNaN(n) ? "⚠️ أدخل رقماً صحيحاً" : toRoman(n); }
    return fromRoman(input);
  })();
  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl">{(["to-roman","to-arabic"] as const).map(m => <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode===m?"bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm":"text-black/40 dark:text-white/40"}`}>{m==="to-roman"?"رقم → روماني":"روماني → رقم"}</button>)}</div>
      <Input value={input} onChange={e => setInput(e.target.value)} placeholder={mode==="to-roman"?"أدخل رقماً (1-3999)":"أدخل رقماً رومانياً (مثال: XLII)"} data-testid="input-roman" />
      {result && <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-center"><p className="text-4xl font-black text-amber-700 dark:text-amber-400 font-serif">{result}</p></div>}
    </div>
  );
}

function BinaryHexPanel() {
  const [val, setVal] = useState("");
  const [base, setBase] = useState(10);
  const decimal = (() => { try { const n = parseInt(val.trim(), base); return isNaN(n) ? null : n; } catch { return null; } })();
  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">{[{b:2,l:"ثنائي (Binary)"},{b:8,l:"ثماني (Octal)"},{b:10,l:"عشري (Decimal)"},{b:16,l:"سادس عشر (Hex)"}].map(({b,l}) => <button key={b} onClick={() => setBase(b)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${base===b?"bg-slate-600 text-white border-slate-600":"border-black/10 dark:border-white/10 text-black/50 dark:text-white/50"}`}>{l}</button>)}</div>
      <Input value={val} onChange={e => setVal(e.target.value)} placeholder={`أدخل رقماً ${base===2?"ثنائياً":base===8?"ثمانياً":base===16?"سادس عشر":"عشرياً"}...`} className="font-mono" data-testid="input-binary" />
      {decimal !== null && (
        <div className="space-y-2">
          {[{l:"ثنائي (Binary)",v:decimal.toString(2),c:"text-blue-500"},{l:"ثماني (Octal)",v:decimal.toString(8),c:"text-green-500"},{l:"عشري (Decimal)",v:decimal.toString(10),c:"text-amber-500"},{l:"سادس عشر (Hex)",v:decimal.toString(16).toUpperCase(),c:"text-purple-500"}].map(({l,v,c}) => (
            <div key={l} className="flex items-center gap-3 p-3 rounded-xl border border-black/[0.07] dark:border-white/[0.07]">
              <p className="text-xs text-black/40 dark:text-white/40 w-32 shrink-0">{l}</p>
              <p className={`flex-1 font-mono font-bold ${c}`}>{v}</p>
              <CopyBtn text={v} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CalcDiscountPanel() {
  const [original, setOriginal] = useState("");
  const [discount, setDiscount] = useState("");
  const result = (() => {
    const o = parseFloat(original), d = parseFloat(discount);
    if (isNaN(o) || isNaN(d) || d < 0 || d > 100) return null;
    const savings = (o * d) / 100;
    const final = o - savings;
    return { final, savings, pct: d };
  })();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-black/40 dark:text-white/40 mb-1 flex items-center gap-1">السعر الأصلي (<SARIcon size={10} className="opacity-70" />)</label><Input type="number" value={original} onChange={e => setOriginal(e.target.value)} placeholder="100" /></div>
        <div><label className="text-xs text-black/40 dark:text-white/40 mb-1 block">نسبة الخصم %</label><Input type="number" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="20" min={0} max={100} /></div>
      </div>
      {result && (
        <div className="grid grid-cols-3 gap-3">
          {[
            {l:"السعر النهائي", v:`${result.final.toFixed(2)}`, sar:true, c:"text-green-500", bg:"bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"},
            {l:"توفيرك", v:`${result.savings.toFixed(2)}`, sar:true, c:"text-red-500", bg:"bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"},
            {l:"الخصم", v:`${result.pct}%`, sar:false, c:"text-blue-500", bg:"bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"}
          ].map(({l,v,sar,c,bg}) => <div key={l} className={`p-4 rounded-2xl border text-center ${bg}`}><p className={`text-xl font-black ${c} flex items-center justify-center gap-1`}>{v}{sar && <SARIcon size={14} className="opacity-60" />}</p><p className="text-xs text-black/40 dark:text-white/40 mt-1">{l}</p></div>)}
        </div>
      )}
    </div>
  );
}

function ArabicNumWordsPanel() {
  const [num, setNum] = useState("");
  const toWords = (n: number): string => {
    if (n === 0) return "صفر";
    if (n < 0) return "سالب " + toWords(-n);
    const ones = ["","واحد","اثنان","ثلاثة","أربعة","خمسة","ستة","سبعة","ثمانية","تسعة","عشرة","أحد عشر","اثنا عشر","ثلاثة عشر","أربعة عشر","خمسة عشر","ستة عشر","سبعة عشر","ثمانية عشر","تسعة عشر"];
    const tens = ["","عشرة","عشرون","ثلاثون","أربعون","خمسون","ستون","سبعون","ثمانون","تسعون"];
    if (n < 20) return ones[n];
    if (n < 100) { const t = Math.floor(n/10), o = n%10; return o ? ones[o]+" و"+tens[t] : tens[t]; }
    if (n < 1000) { const h = Math.floor(n/100), r = n%100; const hStr = h===1?"مئة":h===2?"مئتان":ones[h]+" مئة"; return r ? hStr+" و"+toWords(r) : hStr; }
    if (n < 1000000) { const k = Math.floor(n/1000), r = n%1000; const kStr = k===1?"ألف":k===2?"ألفان":ones[k]+" آلاف"; return r ? kStr+" و"+toWords(r) : kStr; }
    if (n < 1000000000) { const m = Math.floor(n/1000000), r = n%1000000; return (m===1?"مليون":m===2?"مليونان":ones[m]+" ملايين")+(r?" و"+toWords(r):""); }
    return n.toLocaleString("ar");
  };
  const result = (() => { const n = parseFloat(num.replace(/,/g,"")); if (isNaN(n) || n > 999999999) return ""; return toWords(Math.floor(n)); })();
  return (
    <div className="space-y-4">
      <Input type="number" value={num} onChange={e => setNum(e.target.value)} placeholder="أدخل رقماً (حتى 999,999,999)" data-testid="input-num-words" />
      {result && <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-center"><p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 leading-relaxed">{result}</p><CopyBtn text={result} /></div>}
    </div>
  );
}

// DESIGN TOOLS

function ColorConverterPanel() {
  const [hex, setHex] = useState("#3b82f6");
  const hexToRgb = (h: string) => { const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h); return r ? {r:parseInt(r[1],16),g:parseInt(r[2],16),b:parseInt(r[3],16)} : null; };
  const rgbToHsl = ({r,g,b}: {r:number;g:number;b:number}) => {
    r/=255;g/=255;b/=255;
    const max=Math.max(r,g,b),min=Math.min(r,g,b);let h=0,s=0,l=(max+min)/2;
    if(max!==min){const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case r:h=((g-b)/d+(g<b?6:0))/6;break;case g:h=((b-r)/d+2)/6;break;case b:h=((r-g)/d+4)/6;break;}}
    return {h:Math.round(h*360),s:Math.round(s*100),l:Math.round(l*100)};
  };
  const rgb = hexToRgb(hex);
  const hsl = rgb ? rgbToHsl(rgb) : null;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input type="color" value={hex} onChange={e => setHex(e.target.value)} className="w-16 h-16 rounded-2xl cursor-pointer border-2 border-black/10 dark:border-white/10" data-testid="input-color-picker" />
        <div className="flex-1"><Input value={hex} onChange={e => setHex(e.target.value)} placeholder="#3b82f6" className="font-mono" data-testid="input-hex" /></div>
      </div>
      <div className="w-full h-20 rounded-2xl border border-black/10 dark:border-white/10" style={{background:hex}} />
      {rgb && hsl && (
        <div className="space-y-2">
          {[["HEX",hex],["RGB",`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`],["HSL",`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`],["RGBA",`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`]].map(([l,v]) => (
            <div key={l} className="flex items-center gap-3 p-3 rounded-xl border border-black/[0.07] dark:border-white/[0.07]">
              <span className="text-xs font-bold text-black/40 dark:text-white/40 w-12 shrink-0">{l}</span>
              <span className="flex-1 font-mono text-sm text-black dark:text-white">{v}</span>
              <CopyBtn text={v} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GradientGenPanel() {
  const [c1, setC1] = useState("#6366f1");
  const [c2, setC2] = useState("#06b6d4");
  const [c3, setC3] = useState("");
  const [angle, setAngle] = useState(135);
  const [type, setType] = useState<"linear"|"radial">("linear");
  const colors = [c1, c2, ...(c3 ? [c3] : [])].join(", ");
  const css = type === "linear" ? `linear-gradient(${angle}deg, ${colors})` : `radial-gradient(circle, ${colors})`;
  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl">{(["linear","radial"] as const).map(m => <button key={m} onClick={() => setType(m)} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${type===m?"bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm":"text-black/40 dark:text-white/40"}`}>{m==="linear"?"خطي (Linear)":"دائري (Radial)"}</button>)}</div>
      <div className="flex gap-3 items-end">
        {[["اللون 1",c1,setC1],["اللون 2",c2,setC2],["لون 3 (اختياري)",c3,setC3]].map(([l,v,fn]) => <div key={String(l)} className="flex-1"><label className="text-xs text-black/40 dark:text-white/40 mb-1 block">{l as string}</label><input type="color" value={(v as string)||"#ffffff"} onChange={e => (fn as any)(e.target.value === "#ffffff" && !v ? "" : e.target.value)} className="w-full h-10 rounded-lg cursor-pointer border border-black/10 dark:border-white/10" /></div>)}
      </div>
      {type === "linear" && <div><label className="text-xs text-black/40 dark:text-white/40 mb-2 block">الزاوية: {angle}°</label><input type="range" min={0} max={360} value={angle} onChange={e => setAngle(+e.target.value)} className="w-full accent-purple-500" /></div>}
      <div className="w-full h-24 rounded-2xl border border-black/10 dark:border-white/10" style={{background:css}} />
      <div className="flex items-center gap-2"><div className="flex-1 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.07] rounded-xl p-3 font-mono text-xs text-black dark:text-white break-all">{css}</div><CopyBtn text={css} /></div>
    </div>
  );
}

function QrGenPanel() {
  const [text, setText] = useState("");
  const [size, setSize] = useState(200);
  const containerRef = useRef<HTMLDivElement>(null);
  const download = () => {
    const canvas = containerRef.current?.querySelector("canvas");
    if (!canvas) return;
    canvas.toBlob(b => b && downloadBlob(b, "qrcode.png"));
  };
  return (
    <div className="space-y-4">
      <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="أدخل نصاً أو رابطاً..." rows={3} data-testid="textarea-qr" />
      <div><label className="text-xs text-black/40 dark:text-white/40 mb-2 block">الحجم: {size}px</label><input type="range" min={100} max={400} step={50} value={size} onChange={e => setSize(+e.target.value)} className="w-full accent-gray-700" /></div>
      {text.trim() && (
        <div className="flex flex-col items-center gap-4">
          <div ref={containerRef} className="p-4 bg-white rounded-2xl border border-black/10 shadow-sm">
            <QRCodeCanvas value={text} size={size} />
          </div>
          <Button onClick={download} className="gap-2 bg-gray-800 dark:bg-gray-700 text-white" data-testid="btn-download-qr"><Download className="w-4 h-4" />تنزيل PNG</Button>
        </div>
      )}
    </div>
  );
}

function ShadowGenPanel() {
  const [ox, setOx] = useState(4);
  const [oy, setOy] = useState(4);
  const [blur, setBlur] = useState(10);
  const [spread, setSpread] = useState(0);
  const [color, setColor] = useState("#000000");
  const [op, setOp] = useState(20);
  const [inset, setInset] = useState(false);
  const hex2rgba = (h: string, a: number) => { const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h); return r?`rgba(${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)},${a/100})`:`rgba(0,0,0,${a/100})`; };
  const css = `${inset?"inset ":""}${ox}px ${oy}px ${blur}px ${spread}px ${hex2rgba(color,op)}`;
  const sliders = [["X offset",ox,setOx,-50,50],["Y offset",oy,setOy,-50,50],["Blur",blur,setBlur,0,100],["Spread",spread,setSpread,-50,50],["شفافية %",op,setOp,0,100]];
  return (
    <div className="space-y-4">
      <div className="space-y-3">{sliders.map(([l,v,fn,mn,mx]) => <div key={String(l)}><div className="flex justify-between text-xs text-black/40 dark:text-white/40 mb-1"><span>{l as string}</span><span>{v as number}px</span></div><input type="range" min={mn as number} max={mx as number} value={v as number} onChange={e => (fn as any)(+e.target.value)} className="w-full accent-blue-500" /></div>)}</div>
      <div className="flex items-center gap-4"><div className="flex items-center gap-2"><input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer" /><span className="text-sm text-black dark:text-white">اللون</span></div><label className="flex items-center gap-2 text-sm text-black dark:text-white cursor-pointer"><input type="checkbox" checked={inset} onChange={e => setInset(e.target.checked)} className="accent-blue-500" />داخلي (inset)</label></div>
      <div className="flex items-center justify-center p-8 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-black/[0.07] dark:border-white/[0.07]">
        <div className="w-28 h-28 rounded-2xl bg-white dark:bg-gray-700" style={{boxShadow:css}} />
      </div>
      <div className="flex items-center gap-2"><div className="flex-1 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.07] rounded-xl p-3 font-mono text-xs text-black dark:text-white">box-shadow: {css};</div><CopyBtn text={`box-shadow: ${css};`} /></div>
    </div>
  );
}

function BorderRadiusPanel() {
  const [linked, setLinked] = useState(true);
  const [tl, setTl] = useState(12);
  const [tr, setTr] = useState(12);
  const [br, setBr] = useState(12);
  const [bl, setBl] = useState(12);
  const setAll = (v: number) => { setTl(v); setTr(v); setBr(v); setBl(v); };
  const css = linked ? `${tl}px` : `${tl}px ${tr}px ${br}px ${bl}px`;
  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm text-black dark:text-white cursor-pointer"><input type="checkbox" checked={linked} onChange={e => setLinked(e.target.checked)} className="accent-cyan-500" />ربط جميع الزوايا</label>
      {linked ? (
        <div><div className="flex justify-between text-xs text-black/40 dark:text-white/40 mb-1"><span>نصف القطر</span><span>{tl}px</span></div><input type="range" min={0} max={100} value={tl} onChange={e => setAll(+e.target.value)} className="w-full accent-cyan-500" /></div>
      ) : (
        <div className="grid grid-cols-2 gap-3">{[["أعلى يسار",tl,setTl],["أعلى يمين",tr,setTr],["أسفل يمين",br,setBr],["أسفل يسار",bl,setBl]].map(([l,v,fn]) => <div key={String(l)}><div className="flex justify-between text-xs text-black/40 dark:text-white/40 mb-1"><span>{l as string}</span><span>{v as number}px</span></div><input type="range" min={0} max={100} value={v as number} onChange={e => (fn as any)(+e.target.value)} className="w-full accent-cyan-500" /></div>)}</div>
      )}
      <div className="flex items-center justify-center p-8 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-black/[0.07] dark:border-white/[0.07]">
        <div className="w-32 h-32 bg-gradient-to-br from-cyan-400 to-blue-600" style={{borderRadius:css}} />
      </div>
      <div className="flex items-center gap-2"><div className="flex-1 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.07] rounded-xl p-3 font-mono text-xs text-black dark:text-white">border-radius: {css};</div><CopyBtn text={`border-radius: ${css};`} /></div>
    </div>
  );
}

function ColorPalettePanel() {
  const [base, setBase] = useState("#3b82f6");
  const hexToHsl = (h: string) => {
    const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
    if(!r) return {h:0,s:50,l:50};
    let R=parseInt(r[1],16)/255, G=parseInt(r[2],16)/255, B=parseInt(r[3],16)/255;
    const max=Math.max(R,G,B),min=Math.min(R,G,B);let H=0,S=0,L=(max+min)/2;
    if(max!==min){const d=max-min;S=L>0.5?d/(2-max-min):d/(max+min);switch(max){case R:H=((G-B)/d+(G<B?6:0))/6;break;case G:H=((B-R)/d+2)/6;break;case B:H=((R-G)/d+4)/6;break;}}
    return {h:Math.round(H*360),s:Math.round(S*100),l:Math.round(L*100)};
  };
  const hslToHex = (h:number,s:number,l:number) => {
    s/=100;l/=100;const a=s*Math.min(l,1-l);const f=(n:number)=>{const k=(n+h/30)%12;const c=l-a*Math.max(Math.min(k-3,9-k,1),-1);return Math.round(255*c).toString(16).padStart(2,"0");};
    return `#${f(0)}${f(8)}${f(4)}`;
  };
  const hsl = hexToHsl(base);
  const palette = [90,75,60,45,30,15].map(l => ({hex:hslToHex(hsl.h,hsl.s,l),l}));
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4"><input type="color" value={base} onChange={e => setBase(e.target.value)} className="w-16 h-16 rounded-2xl cursor-pointer border-2 border-black/10 dark:border-white/10" /><div className="flex-1"><Input value={base} onChange={e => setBase(e.target.value)} placeholder="#3b82f6" className="font-mono" /></div></div>
      <div className="grid grid-cols-6 gap-2">
        {palette.map(({hex,l}) => (
          <div key={l} className="group cursor-pointer" onClick={() => navigator.clipboard.writeText(hex)}>
            <div className="w-full aspect-square rounded-xl border border-black/10 dark:border-white/10 hover:scale-105 transition-transform" style={{background:hex}} />
            <p className="text-[10px] text-center font-mono mt-1 text-black/40 dark:text-white/40">{hex}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-black/30 dark:text-white/30 text-center">اضغط على أي لون لنسخه</p>
    </div>
  );
}

function ContrastCheckerPanel() {
  const [fg, setFg] = useState("#000000");
  const [bg, setBg] = useState("#ffffff");
  const getLum = (h: string) => {
    const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
    if(!r) return 0;
    const [R,G,B] = [parseInt(r[1],16),parseInt(r[2],16),parseInt(r[3],16)].map(c => { const n=c/255; return n<=0.03928?n/12.92:Math.pow((n+0.055)/1.055,2.4); });
    return 0.2126*R + 0.7152*G + 0.0722*B;
  };
  const contrast = (() => { const l1=getLum(fg), l2=getLum(bg); const [hi,lo]=[Math.max(l1,l2),Math.min(l1,l2)]; return (hi+0.05)/(lo+0.05); })();
  const ratio = contrast.toFixed(2);
  const aaLg = contrast >= 3, aaSmall = contrast >= 4.5, aaaLg = contrast >= 4.5, aaaSmall = contrast >= 7;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-black/40 dark:text-white/40 mb-1 block">لون النص</label><div className="flex items-center gap-2"><input type="color" value={fg} onChange={e => setFg(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border border-black/10 dark:border-white/10" /><Input value={fg} onChange={e => setFg(e.target.value)} className="font-mono text-xs" /></div></div>
        <div><label className="text-xs text-black/40 dark:text-white/40 mb-1 block">لون الخلفية</label><div className="flex items-center gap-2"><input type="color" value={bg} onChange={e => setBg(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border border-black/10 dark:border-white/10" /><Input value={bg} onChange={e => setBg(e.target.value)} className="font-mono text-xs" /></div></div>
      </div>
      <div className="p-6 rounded-2xl flex items-center justify-center border border-black/10 dark:border-white/10" style={{background:bg}}><p className="text-xl font-bold" style={{color:fg}}>نموذج نص للمعاينة — Sample Text Preview</p></div>
      <div className="text-center p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06]">
        <p className="text-4xl font-black text-black dark:text-white">{ratio}:1</p>
        <p className="text-sm text-black/40 dark:text-white/40 mt-1">نسبة التباين</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[["AA نص كبير",aaLg],["AA نص صغير",aaSmall],["AAA نص كبير",aaaLg],["AAA نص صغير",aaaSmall]].map(([l,pass]) => <div key={String(l)} className={`p-3 rounded-xl border text-center text-sm font-semibold ${pass?"bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400":"bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-500"}`}>{l as string}: {pass?"✓ ناجح":"✗ فاشل"}</div>)}
      </div>
    </div>
  );
}

// DEV TOOLS

function ImgBase64Panel() {
  const [mode, setMode] = useState<"to-b64"|"from-b64">("to-b64");
  const [file, setFile] = useState<File|null>(null);
  const [b64, setB64] = useState("");
  const [result, setResult] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const convert = () => {
    if (mode === "to-b64" && file) {
      const r = new FileReader();
      r.onload = e => setResult(e.target?.result as string);
      r.readAsDataURL(file);
    }
  };
  useEffect(() => { if (file) convert(); }, [file]);
  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl">{(["to-b64","from-b64"] as const).map(m => <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode===m?"bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm":"text-black/40 dark:text-white/40"}`}>{m==="to-b64"?"صورة → Base64":"Base64 → صورة"}</button>)}</div>
      {mode === "to-b64" ? (
        <>
          <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files?.[0]||null)} />
          <div onClick={() => ref.current?.click()} className="border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400 transition-all" data-testid="dropzone-img-b64">
            {file ? <><Image className="w-8 h-8 text-blue-500 mx-auto mb-2" /><p className="text-sm text-black dark:text-white">{file.name}</p></> : <><Image className="w-10 h-10 text-black/20 dark:text-white/20 mx-auto mb-3" /><p className="text-sm text-black/50 dark:text-white/50">اضغط لاختيار صورة</p></>}
          </div>
          {result && <div className="space-y-2"><p className="text-xs text-black/40 dark:text-white/40">النتيجة ({(result.length/1024).toFixed(1)} KB)</p><div className="flex gap-2 items-start"><div className="flex-1 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.07] rounded-xl p-3 font-mono text-[10px] text-black dark:text-white max-h-24 overflow-auto break-all">{result}</div><CopyBtn text={result} /></div></div>}
        </>
      ) : (
        <>
          <Textarea value={b64} onChange={e => setB64(e.target.value)} placeholder="الصق Base64 هنا (data:image/png;base64,...)" rows={4} className="font-mono text-xs" />
          {b64.startsWith("data:image") && <div className="flex justify-center"><img src={b64} alt="decoded" className="max-h-48 rounded-2xl border border-black/10 dark:border-white/10 object-contain" /></div>}
        </>
      )}
    </div>
  );
}

function JwtDecoderPanel() {
  const [token, setToken] = useState("");
  const decoded = (() => {
    if (!token.trim()) return null;
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return { error: "JWT غير صحيح — يجب أن يحتوي على 3 أجزاء" };
      const decode = (s: string) => JSON.parse(atob(s.replace(/-/g,"+").replace(/_/g,"/")));
      const header = decode(parts[0]);
      const payload = decode(parts[1]);
      const exp = payload.exp ? new Date(payload.exp * 1000) : null;
      const isExpired = exp ? exp < new Date() : false;
      return { header, payload, exp, isExpired };
    } catch { return { error: "فشل في فك التشفير" }; }
  })();
  return (
    <div className="space-y-4">
      <Textarea value={token} onChange={e => setToken(e.target.value)} placeholder="الصق JWT token هنا..." rows={3} className="font-mono text-xs" data-testid="textarea-jwt" />
      {decoded && !("error" in decoded) && (
        <div className="space-y-3">
          {decoded.exp && <div className={`p-3 rounded-xl text-sm ${decoded.isExpired?"bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800":"bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800"}`}>{decoded.isExpired?"⚠️ Token منتهي الصلاحية":"✅ Token صالح"} · تنتهي: {decoded.exp.toLocaleString("ar")}</div>}
          {[["Header",decoded.header],["Payload",decoded.payload]].map(([l,v]) => (
            <div key={String(l)}><p className="text-xs font-semibold text-black/40 dark:text-white/40 mb-1">{l as string}</p><div className="flex items-start gap-2"><pre className="flex-1 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.07] rounded-xl p-3 text-xs font-mono text-black dark:text-white overflow-auto max-h-40">{JSON.stringify(v, null, 2)}</pre><CopyBtn text={JSON.stringify(v, null, 2)} /></div></div>
          ))}
        </div>
      )}
      {decoded && "error" in decoded && <p className="text-sm text-red-500">{decoded.error}</p>}
    </div>
  );
}

function JsonFormatPanel() {
  const [input, setInput] = useState("");
  const [spaces, setSpaces] = useState(2);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const format = (minify: boolean) => {
    setError("");
    try { const p = JSON.parse(input); setResult(minify ? JSON.stringify(p) : JSON.stringify(p, null, spaces)); }
    catch (e: any) { setError("خطأ: " + e.message); setResult(""); }
  };
  return (
    <div className="space-y-4">
      <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder='{"name":"أحمد","age":25,"city":"الرياض"}' rows={5} className="font-mono text-xs" data-testid="textarea-json" />
      <div className="flex gap-2 items-center">
        <Button onClick={() => format(false)} disabled={!input} className="flex-1 gap-2 bg-gradient-to-l from-green-500 to-emerald-600 text-white" data-testid="btn-format-json"><Code className="w-4 h-4" />تنسيق</Button>
        <Button onClick={() => format(true)} disabled={!input} className="flex-1 gap-2 bg-black/80 dark:bg-white/80 text-white dark:text-black" data-testid="btn-minify-json"><Minimize2 className="w-4 h-4" />ضغط</Button>
        <select value={spaces} onChange={e => setSpaces(+e.target.value)} className="h-9 px-2 rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-gray-900 text-sm text-black dark:text-white"><option value={2}>2 مسافات</option><option value={4}>4 مسافات</option></select>
      </div>
      {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-200 dark:border-red-800">{error}</p>}
      {result && <div className="flex items-start gap-2"><pre className="flex-1 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.07] rounded-xl p-3 font-mono text-xs text-black dark:text-white overflow-auto max-h-56">{result}</pre><CopyBtn text={result} /></div>}
    </div>
  );
}

function RegexTesterPanel() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState("");
  const matches = (() => {
    if (!pattern || !text) return [];
    try { const re = new RegExp(pattern, flags); const ms: {match:string;index:number;groups:string[]|null}[] = []; let m; re.lastIndex=0; while((m=re.exec(text))!==null){ms.push({match:m[0],index:m.index,groups:m.slice(1)||null}); if(!flags.includes("g"))break;} return ms; }
    catch { return []; }
  })();
  const highlighted = (() => {
    if (!pattern || !text || !matches.length) return null;
    try {
      const re = new RegExp(pattern, flags.includes("g")?flags:flags+"g");
      const parts: {text:string;match:boolean}[] = [];
      let last = 0;
      text.replace(re, (m, ...args) => {
        const idx = args[args.length-2];
        if (idx > last) parts.push({text:text.slice(last,idx),match:false});
        parts.push({text:m,match:true});
        last = idx + m.length;
        return m;
      });
      if (last < text.length) parts.push({text:text.slice(last),match:false});
      return parts;
    } catch { return null; }
  })();
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1"><label className="text-xs text-black/40 dark:text-white/40 mb-1 block">التعبير النمطي (Regex)</label><Input value={pattern} onChange={e => setPattern(e.target.value)} placeholder="e.g. \d+" className="font-mono" data-testid="input-regex" /></div>
        <div><label className="text-xs text-black/40 dark:text-white/40 mb-1 block">Flags</label><Input value={flags} onChange={e => setFlags(e.target.value)} className="w-20 font-mono" placeholder="gi" /></div>
      </div>
      <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="النص الذي تريد البحث فيه..." rows={4} data-testid="textarea-regex" />
      {highlighted && (
        <div className="border border-black/[0.07] dark:border-white/[0.07] rounded-xl p-3 text-sm font-mono leading-relaxed max-h-32 overflow-auto">
          {highlighted.map((p,i) => p.match ? <mark key={i} className="bg-yellow-300 dark:bg-yellow-600 text-black px-0.5 rounded">{p.text}</mark> : <span key={i} className="text-black dark:text-white">{p.text}</span>)}
        </div>
      )}
      <div className="flex items-center gap-3 text-sm"><span className={`font-bold ${matches.length>0?"text-green-500":"text-black/40 dark:text-white/40"}`}>{matches.length} تطابق</span></div>
      {matches.length > 0 && (
        <div className="space-y-1 max-h-40 overflow-auto">{matches.map((m,i) => <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-xs font-mono"><span className="text-yellow-600 dark:text-yellow-400">#{i+1}</span><span className="flex-1 text-black dark:text-white">{m.match}</span><span className="text-black/30 dark:text-white/30">pos:{m.index}</span></div>)}</div>
      )}
    </div>
  );
}

function TimestampPanel() {
  const [mode, setMode] = useState<"to-date"|"to-ts">("to-date");
  const [ts, setTs] = useState(String(Math.floor(Date.now()/1000)));
  const [date, setDate] = useState(new Date().toISOString().slice(0,16));
  const result = (() => {
    if (mode === "to-date") {
      const n = parseInt(ts);
      if (isNaN(n)) return null;
      const d = new Date(n < 1e10 ? n*1000 : n);
      return { local: d.toLocaleString("ar-SA"), utc: d.toUTCString(), iso: d.toISOString() };
    } else {
      const d = new Date(date);
      return { sec: Math.floor(d.getTime()/1000), ms: d.getTime() };
    }
  })();
  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl">{(["to-date","to-ts"] as const).map(m => <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode===m?"bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm":"text-black/40 dark:text-white/40"}`}>{m==="to-date"?"Timestamp → تاريخ":"تاريخ → Timestamp"}</button>)}</div>
      {mode==="to-date" ? <Input value={ts} onChange={e => setTs(e.target.value)} placeholder="Unix timestamp..." className="font-mono" data-testid="input-timestamp" /> : <Input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} />}
      {result && (
        <div className="space-y-2">
          {Object.entries(result).map(([k,v]) => <div key={k} className="flex items-center gap-3 p-3 rounded-xl border border-black/[0.07] dark:border-white/[0.07]"><span className="text-xs text-black/40 dark:text-white/40 w-20 shrink-0 font-mono">{k}</span><span className="flex-1 font-mono text-sm text-black dark:text-white">{String(v)}</span><CopyBtn text={String(v)} /></div>)}
        </div>
      )}
      <button onClick={() => { setMode("to-date"); setTs(String(Math.floor(Date.now()/1000))); }} className="text-xs text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 transition-colors">↻ استخدام الوقت الحالي</button>
    </div>
  );
}

function UrlEncodePanel() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"encode"|"decode">("encode");
  const result = (() => { try { return mode==="encode" ? encodeURIComponent(input) : decodeURIComponent(input); } catch { return "⚠️ خطأ في التحويل"; } })();
  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl">{(["encode","decode"] as const).map(m => <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode===m?"bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm":"text-black/40 dark:text-white/40"}`}>{m==="encode"?"ترميز (Encode)":"فك ترميز (Decode)"}</button>)}</div>
      <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder={mode==="encode"?"الصق نص أو URL هنا...":"الصق URL مُرمَّز هنا..."} rows={4} className="font-mono text-xs" data-testid="textarea-url" />
      <ResultBox value={result} label="النتيجة:" />
    </div>
  );
}

function HtmlEntitiesPanel() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"encode"|"decode">("encode");
  const entities: Record<string,string> = {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};
  const reverse: Record<string,string> = Object.fromEntries(Object.entries(entities).map(([k,v]) => [v,k]));
  const result = mode==="encode" ? input.replace(/[&<>"']/g, c => entities[c]||c) : input.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, e => reverse[e]||e);
  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl">{(["encode","decode"] as const).map(m => <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode===m?"bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm":"text-black/40 dark:text-white/40"}`}>{m==="encode"?"ترميز HTML":"فك ترميز HTML"}</button>)}</div>
      <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder={mode==="encode"?'<h1>مرحبا "العالم"</h1>':"&lt;h1&gt;مرحبا &quot;العالم&quot;&lt;/h1&gt;"} rows={4} className="font-mono text-xs" data-testid="textarea-entities" />
      <ResultBox value={result} label="النتيجة:" />
    </div>
  );
}

function MarkdownHtmlPanel() {
  const [md, setMd] = useState("# مرحباً\n\n**نص عريض** و *نص مائل*\n\n- بند 1\n- بند 2\n\n[رابط](https://qirox.tech)");
  const toHtml = (s: string) => s
    .replace(/^### (.+)$/gm,"<h3>$1</h3>").replace(/^## (.+)$/gm,"<h2>$1</h2>").replace(/^# (.+)$/gm,"<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>")
    .replace(/`(.+?)`/g,"<code>$1</code>").replace(/\[(.+?)\]\((.+?)\)/g,'<a href="$2">$1</a>')
    .replace(/^- (.+)$/gm,"<li>$1</li>").replace(/(<li>.*<\/li>)/s,"<ul>$1</ul>")
    .replace(/\n\n/g,"</p><p>").replace(/^(?!<[h|u|l])/gm,"").replace(/\n/g,"<br/>");
  const html = toHtml(md);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-black/40 dark:text-white/40 mb-1 block">Markdown</label><Textarea value={md} onChange={e => setMd(e.target.value)} rows={10} className="font-mono text-xs" data-testid="textarea-md" /></div>
        <div><label className="text-xs text-black/40 dark:text-white/40 mb-1 block">معاينة HTML</label><div className="border border-black/[0.07] dark:border-white/[0.07] rounded-xl p-3 h-full bg-white dark:bg-gray-900 text-sm text-black dark:text-white prose prose-sm dark:prose-invert max-h-64 overflow-auto" dangerouslySetInnerHTML={{__html:html}} /></div>
      </div>
      <div className="flex gap-2"><CopyBtn text={html} label="نسخ HTML" /><CopyBtn text={md} label="نسخ Markdown" /></div>
    </div>
  );
}

function HashGenPanel() {
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState<{algo:string;hash:string}[]>([]);
  const [loading, setLoading] = useState(false);
  const generate = async () => {
    if (!input) return; setLoading(true);
    const buf = new TextEncoder().encode(input);
    const results: {algo:string;hash:string}[] = [];
    for (const algo of ["SHA-256","SHA-512","SHA-1"]) {
      try {
        const hashBuf = await crypto.subtle.digest(algo, buf);
        const hex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2,"0")).join("");
        results.push({algo, hash:hex});
      } catch {}
    }
    setHashes(results); setLoading(false);
  };
  return (
    <div className="space-y-4">
      <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder="أدخل النص هنا..." rows={4} data-testid="textarea-hash" />
      <Button onClick={generate} disabled={!input||loading} className="w-full gap-2 bg-gradient-to-l from-gray-600 to-slate-700 text-white" data-testid="btn-hash">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hash className="w-4 h-4" />}
        {loading ? "جارٍ الحساب..." : "حساب الهاش"}
      </Button>
      {hashes.length > 0 && <div className="space-y-2">{hashes.map(({algo,hash}) => <div key={algo} className="space-y-1"><p className="text-xs font-bold text-black/40 dark:text-white/40">{algo}</p><div className="flex items-start gap-2"><div className="flex-1 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.07] rounded-lg p-2 font-mono text-xs text-black dark:text-white break-all">{hash}</div><CopyBtn text={hash} /></div></div>)}</div>}
    </div>
  );
}

// PRODUCTIVITY TOOLS

function PomodoroPanel() {
  const [mode, setMode] = useState<"work"|"break">("work");
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(25*60);
  const WORK=25*60, BREAK=5*60;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds(s => { if(s<=1){setRunning(false);setMode(m => m==="work"?"break":"work");return m==="work"?BREAK:WORK;}return s-1;}), 1000);
    return () => clearInterval(id);
  }, [running, mode]);
  useEffect(() => { setSeconds(mode==="work"?WORK:BREAK); setRunning(false); }, [mode]);
  const mins = Math.floor(seconds/60).toString().padStart(2,"0");
  const secs = (seconds%60).toString().padStart(2,"0");
  const progress = mode==="work" ? (1-seconds/WORK)*100 : (1-seconds/BREAK)*100;
  return (
    <div className="space-y-6 text-center">
      <div className="flex gap-2 p-1 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl">{(["work","break"] as const).map(m => <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode===m?"bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm":"text-black/40 dark:text-white/40"}`}>{m==="work"?"🍅 عمل (25 دق)":"☕ راحة (5 دق)"}</button>)}</div>
      <div className="relative w-48 h-48 mx-auto">
        <svg className="w-48 h-48 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" className="text-black/10 dark:text-white/10" />
          <circle cx="50" cy="50" r="45" fill="none" stroke={mode==="work"?"#ef4444":"#22c55e"} strokeWidth="4" strokeDasharray={`${2*Math.PI*45}`} strokeDashoffset={`${2*Math.PI*45*(1-progress/100)}`} strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-5xl font-black text-black dark:text-white font-mono">{mins}:{secs}</p>
          <p className="text-xs text-black/40 dark:text-white/40 mt-1">{mode==="work"?"وقت العمل":"وقت الراحة"}</p>
        </div>
      </div>
      <div className="flex gap-3 justify-center">
        <button onClick={() => setRunning(r => !r)} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${mode==="work"?"bg-red-500 hover:bg-red-600":"bg-green-500 hover:bg-green-600"} text-white`} data-testid="btn-pomodoro-toggle">{running?<Pause className="w-6 h-6"/>:<Play className="w-6 h-6"/>}</button>
        <button onClick={() => {setRunning(false);setSeconds(mode==="work"?WORK:BREAK);}} className="w-14 h-14 rounded-full flex items-center justify-center bg-black/[0.05] dark:bg-white/[0.05] hover:bg-black/10 dark:hover:bg-white/10 transition-all" data-testid="btn-pomodoro-reset"><Square className="w-5 h-5 text-black/60 dark:text-white/60"/></button>
      </div>
    </div>
  );
}

function CountdownPanel() {
  const [target, setTarget] = useState("");
  const [diff, setDiff] = useState<{d:number;h:number;m:number;s:number}|null>(null);
  useEffect(() => {
    if (!target) return;
    const calc = () => {
      const ms = new Date(target).getTime() - Date.now();
      if (ms <= 0) { setDiff({d:0,h:0,m:0,s:0}); return; }
      const s = Math.floor(ms/1000), m = Math.floor(s/60), h = Math.floor(m/60), d = Math.floor(h/24);
      setDiff({d, h:h%24, m:m%60, s:s%60});
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [target]);
  return (
    <div className="space-y-6">
      <div><label className="text-xs text-black/40 dark:text-white/40 mb-1 block">الموعد المستهدف</label><Input type="datetime-local" value={target} onChange={e => setTarget(e.target.value)} data-testid="input-countdown" /></div>
      {diff && (
        <div className="grid grid-cols-4 gap-3">
          {[["أيام",diff.d,"text-violet-500"],["ساعات",diff.h,"text-blue-500"],["دقائق",diff.m,"text-green-500"],["ثواني",diff.s,"text-orange-500"]].map(([l,v,c]) => <div key={String(l)} className="text-center p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06]"><p className={`text-4xl font-black font-mono ${c}`}>{String(v).padStart(2,"0")}</p><p className="text-xs text-black/40 dark:text-white/40 mt-1">{l}</p></div>)}
        </div>
      )}
    </div>
  );
}

function WorldClockPanel() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  const cities = [
    {name:"الرياض",tz:"Asia/Riyadh",flag:"🇸🇦"},{name:"القاهرة",tz:"Africa/Cairo",flag:"🇪🇬"},{name:"دبي",tz:"Asia/Dubai",flag:"🇦🇪"},
    {name:"لندن",tz:"Europe/London",flag:"🇬🇧"},{name:"نيويورك",tz:"America/New_York",flag:"🇺🇸"},{name:"طوكيو",tz:"Asia/Tokyo",flag:"🇯🇵"},
    {name:"باريس",tz:"Europe/Paris",flag:"🇫🇷"},{name:"سنغافورة",tz:"Asia/Singapore",flag:"🇸🇬"},
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {cities.map(({name,tz,flag}) => {
        const time = now.toLocaleTimeString("en-US",{timeZone:tz,hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false});
        const date = now.toLocaleDateString("ar-SA",{timeZone:tz,weekday:"short",month:"short",day:"numeric"});
        return (
          <div key={tz} className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06]">
            <div className="flex items-center gap-2 mb-1"><span className="text-xl">{flag}</span><span className="text-sm font-semibold text-black dark:text-white">{name}</span></div>
            <p className="text-2xl font-black text-black dark:text-white font-mono">{time}</p>
            <p className="text-xs text-black/40 dark:text-white/40 mt-0.5">{date}</p>
          </div>
        );
      })}
    </div>
  );
}

function InvoiceGenPanel() {
  const { toast } = useToast();
  const [inv, setInv] = useState({ client: "", company: "", number: `INV-${Date.now().toString().slice(-6)}`, date: new Date().toISOString().split("T")[0] });
  const [items, setItems] = useState([{desc:"",qty:1,price:0}]);
  const total = items.reduce((s,i) => s + i.qty * i.price, 0);
  const addItem = () => setItems(i => [...i, {desc:"",qty:1,price:0}]);
  const remItem = (idx: number) => setItems(i => i.filter((_,j) => j!==idx));
  const print = () => {
    const html = `<html dir="rtl"><head><meta charset="UTF-8"><title>فاتورة ${inv.number}</title><style>body{font-family:Arial,sans-serif;padding:40px;direction:rtl}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:right}th{background:#f5f5f5}.total{font-size:1.2em;font-weight:bold}</style></head><body><h1>فاتورة</h1><p>رقم الفاتورة: ${inv.number} | التاريخ: ${inv.date}</p><p>من: ${inv.company} | إلى: ${inv.client}</p><table><tr><th>البيان</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr>${items.map(i=>`<tr><td>${i.desc}</td><td>${i.qty}</td><td>${i.price} ر.س</td><td>${(i.qty*i.price).toFixed(2)} ر.س</td></tr>`).join("")}<tr class="total"><td colspan="3">الإجمالي</td><td>${total.toFixed(2)} ر.س</td></tr></table><script>window.onload=()=>window.print()<\/script></body></html>`;
    const w = window.open("","_blank"); if(w){w.document.write(html);w.document.close();}
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[["اسم العميل",inv.client,(v:string)=>setInv(i=>({...i,client:v}))],["اسم الشركة",inv.company,(v:string)=>setInv(i=>({...i,company:v}))]].map(([l,v,fn]) => <div key={String(l)}><label className="text-xs text-black/40 dark:text-white/40 mb-1 block">{l as string}</label><Input value={v as string} onChange={e=>(fn as any)(e.target.value)} placeholder={String(l)+" ..."} /></div>)}
        {[["رقم الفاتورة",inv.number,(v:string)=>setInv(i=>({...i,number:v}))],["التاريخ",inv.date,(v:string)=>setInv(i=>({...i,date:v}))]].map(([l,v,fn]) => <div key={String(l)}><label className="text-xs text-black/40 dark:text-white/40 mb-1 block">{l as string}</label><Input type={l==="التاريخ"?"date":"text"} value={v as string} onChange={e=>(fn as any)(e.target.value)} /></div>)}
      </div>
      <div className="space-y-2">
        {items.map((item,i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center">
            <Input className="col-span-6" value={item.desc} onChange={e=>setItems(it=>it.map((x,j)=>j===i?{...x,desc:e.target.value}:x))} placeholder="البيان" />
            <Input type="number" className="col-span-2" value={item.qty} onChange={e=>setItems(it=>it.map((x,j)=>j===i?{...x,qty:+e.target.value}:x))} min={1} />
            <Input type="number" className="col-span-3" value={item.price} onChange={e=>setItems(it=>it.map((x,j)=>j===i?{...x,price:+e.target.value}:x))} placeholder="السعر" />
            <button onClick={()=>remItem(i)} className="col-span-1 text-red-400 hover:text-red-600 flex justify-center"><Trash2 className="w-4 h-4"/></button>
          </div>
        ))}
        <button onClick={addItem} className="flex items-center gap-2 text-xs text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 transition-colors"><Plus className="w-3 h-3"/>إضافة بند</button>
      </div>
      <div className="p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] text-sm space-y-1">
        <div className="flex justify-between text-black/60 dark:text-white/60"><span>المجموع</span><span className="flex items-center gap-1">{total.toFixed(2)} <SARIcon size={11} className="opacity-70" /></span></div>
        <div className="flex justify-between font-bold text-black dark:text-white text-base pt-1 border-t border-black/[0.07] dark:border-white/[0.07]"><span>الإجمالي</span><span className="flex items-center gap-1">{total.toFixed(2)} <SARIcon size={13} className="opacity-60" /></span></div>
      </div>
      <Button onClick={print} className="w-full gap-2 bg-gradient-to-l from-emerald-500 to-green-600 text-white" data-testid="btn-print-invoice"><Printer className="w-4 h-4"/>طباعة / حفظ PDF</Button>
    </div>
  );
}

function NotesPanel() {
  const STORAGE_KEY = "qirox-quick-notes";
  const load = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]"); } catch { return []; } };
  const [notes, setNotes] = useState<{id:string;title:string;content:string;date:string}[]>(load);
  const [active, setActive] = useState<string|null>(null);
  const save = (updated: typeof notes) => { setNotes(updated); localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); };
  const addNote = () => { const n = {id:crypto.randomUUID(),title:"ملاحظة جديدة",content:"",date:new Date().toLocaleString("ar-SA")}; save([n,...notes]); setActive(n.id); };
  const curr = notes.find(n => n.id === active);
  return (
    <div className="flex gap-3" style={{height:"360px"}}>
      <div className="w-44 shrink-0 space-y-2 overflow-y-auto">
        <button onClick={addNote} className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-black text-xs font-bold transition-colors" data-testid="btn-add-note"><Plus className="w-3.5 h-3.5"/>ملاحظة جديدة</button>
        {notes.map(n => <button key={n.id} onClick={() => setActive(n.id)} className={`w-full text-right p-2.5 rounded-xl text-xs transition-colors ${active===n.id?"bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700":"bg-black/[0.03] dark:bg-white/[0.03] hover:bg-black/[0.06] dark:hover:bg-white/[0.06]"}`}><p className="font-semibold text-black dark:text-white truncate">{n.title}</p><p className="text-black/30 dark:text-white/30 mt-0.5 truncate">{n.date}</p></button>)}
      </div>
      <div className="flex-1 flex flex-col gap-2">
        {curr ? (
          <>
            <div className="flex items-center gap-2">
              <Input value={curr.title} onChange={e => save(notes.map(n=>n.id===curr.id?{...n,title:e.target.value}:n))} className="flex-1 font-semibold" />
              <button onClick={() => {save(notes.filter(n=>n.id!==active));setActive(notes.filter(n=>n.id!==active)[0]?.id||null);}} className="p-2 text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4"/></button>
            </div>
            <Textarea value={curr.content} onChange={e => save(notes.map(n=>n.id===curr.id?{...n,content:e.target.value,date:new Date().toLocaleString("ar-SA")}:n))} placeholder="اكتب ملاحظتك هنا..." className="flex-1 resize-none text-sm" />
          </>
        ) : <div className="flex-1 flex items-center justify-center text-black/30 dark:text-white/30 text-sm">اختر ملاحظة أو أنشئ واحدة جديدة</div>}
      </div>
    </div>
  );
}

function PasswordStrengthPanel() {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const strength = (() => {
    if (!pw) return null;
    let score = 0;
    const checks = [
      { label: "8 أحرف على الأقل", ok: pw.length >= 8 },
      { label: "12 حرف أو أكثر", ok: pw.length >= 12 },
      { label: "أحرف كبيرة (A-Z)", ok: /[A-Z]/.test(pw) },
      { label: "أحرف صغيرة (a-z)", ok: /[a-z]/.test(pw) },
      { label: "أرقام (0-9)", ok: /[0-9]/.test(pw) },
      { label: "رموز خاصة (!@#...)", ok: /[^a-zA-Z0-9]/.test(pw) },
      { label: "لا يوجد نمط متكرر", ok: !/(.)\1{2,}/.test(pw) },
    ];
    score = checks.filter(c => c.ok).length;
    const level = score<=2?"ضعيف جداً":score<=3?"ضعيف":score<=4?"متوسط":score<=5?"جيد":"قوي جداً";
    const color = score<=2?"bg-red-500":score<=3?"bg-orange-500":score<=4?"bg-yellow-500":score<=5?"bg-blue-500":"bg-green-500";
    const textColor = score<=2?"text-red-500":score<=3?"text-orange-500":score<=4?"text-yellow-500":score<=5?"text-blue-500":"text-green-500";
    return { score, checks, level, color, textColor, pct: Math.round((score/7)*100) };
  })();
  return (
    <div className="space-y-4">
      <div className="relative">
        <Input type={show?"text":"password"} value={pw} onChange={e => setPw(e.target.value)} placeholder="أدخل كلمة المرور..." data-testid="input-pw-strength" />
        <button onClick={() => setShow(s=>!s)} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40">{show?<Eye className="w-4 h-4"/>:<Lock className="w-4 h-4"/>}</button>
      </div>
      {strength && (
        <>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm"><span className="text-black/60 dark:text-white/60">قوة كلمة المرور</span><span className={`font-bold ${strength.textColor}`}>{strength.level}</span></div>
            <div className="h-2.5 bg-black/[0.06] dark:bg-white/[0.06] rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${strength.color}`} style={{width:`${strength.pct}%`}} /></div>
          </div>
          <div className="space-y-1.5">{strength.checks.map(c => <div key={c.label} className={`flex items-center gap-2 text-xs ${c.ok?"text-green-600 dark:text-green-400":"text-black/40 dark:text-white/40"}`}><span>{c.ok?"✓":"○"}</span><span>{c.label}</span></div>)}</div>
        </>
      )}
    </div>
  );
}

function EmailValidatorPanel() {
  const [email, setEmail] = useState("");
  const validate = (e: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const hasAt = e.includes("@");
    const parts = e.split("@");
    const localPart = parts[0];
    const domain = parts[1] || "";
    const hasDot = domain.includes(".");
    const validTld = /\.[a-z]{2,}$/i.test(domain);
    const noSpaces = !/\s/.test(e);
    const valid = re.test(e);
    return {
      valid, hasAt, hasDot, validTld, noSpaces,
      localPart: localPart.length >= 1,
      domainLength: domain.length >= 4,
    };
  };
  const result = email ? validate(email) : null;
  return (
    <div className="space-y-4">
      <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="example@domain.com" type="email" data-testid="input-email-validate" />
      {result && (
        <>
          <div className={`p-4 rounded-2xl text-center border ${result.valid?"bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800":"bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"}`}>
            <p className={`text-2xl font-black ${result.valid?"text-green-600 dark:text-green-400":"text-red-500"}`}>{result.valid?"✓ بريد صحيح":"✗ بريد غير صحيح"}</p>
          </div>
          <div className="space-y-1.5">{[["يحتوي على @",result.hasAt],["يحتوي على نقطة في الدومين",result.hasDot],["امتداد صحيح (.com, .sa...)",result.validTld],["لا يحتوي على مسافات",result.noSpaces],["الجزء المحلي غير فارغ",result.localPart],["طول الدومين كافٍ",result.domainLength]].map(([l,ok]) => <div key={String(l)} className={`flex items-center gap-2 text-xs ${ok?"text-green-600 dark:text-green-400":"text-red-500"}`}><span>{ok?"✓":"✗"}</span><span>{l as string}</span></div>)}</div>
        </>
      )}
    </div>
  );
}

function HashtagGenPanel() {
  const [topic, setTopic] = useState("");
  const [lang, setLang] = useState<"ar"|"en">("ar");
  const [tags, setTags] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const generate = () => {
    const arPrefixes = ["#", "#تصميم_", "#اعمال_", "#تقنية_", "#سوشيال_", "#محتوى_", "#قيروكس_"];
    const enPrefixes = ["#", "#design_", "#digital_", "#tech_", "#social_", "#content_", "#brand_"];
    const base = topic.trim().replace(/\s+/g,"_");
    const prefixes = lang==="ar" ? arPrefixes : enPrefixes;
    const suffix = lang==="ar" ? ["السعودية","العرب","مصر","الخليج","كيروكس"] : ["ksa","uae","global","digital","2025"];
    const generated = [
      `#${base}`,
      ...prefixes.slice(1).map(p => `${p}${base}`),
      ...suffix.map(s => `#${base}_${s}`),
      `#${base.toUpperCase()}`,
    ].slice(0,20);
    setTags(generated);
  };
  const all = tags.join(" ");
  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl">{(["ar","en"] as const).map(m => <button key={m} onClick={() => setLang(m)} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${lang===m?"bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm":"text-black/40 dark:text-white/40"}`}>{m==="ar"?"عربي":"English"}</button>)}</div>
      <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="الموضوع (مثال: تصميم جرافيك)" onKeyDown={e => e.key==="Enter"&&generate()} data-testid="input-hashtag-topic" />
      <Button onClick={generate} disabled={!topic.trim()} className="w-full gap-2 bg-gradient-to-l from-pink-500 to-rose-500 text-white" data-testid="btn-gen-hashtags"><Hash className="w-4 h-4"/>توليد الهاشتاقات</Button>
      {tags.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">{tags.map(t => <span key={t} onClick={() => navigator.clipboard.writeText(t)} className="px-2.5 py-1 rounded-lg bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity border border-pink-200 dark:border-pink-800">{t}</span>)}</div>
          <div className="flex gap-2"><CopyBtn text={all} label="نسخ الكل" /></div>
        </div>
      )}
    </div>
  );
}

// IMAGE TOOLS

function ImgCompressPanel() {
  const { toast } = useToast();
  const [file, setFile] = useState<File|null>(null);
  const [quality, setQuality] = useState(70);
  const [preview, setPreview] = useState("");
  const [origSize, setOrigSize] = useState(0);
  const [newSize, setNewSize] = useState(0);
  const ref = useRef<HTMLInputElement>(null);
  const compress = (f: File, q: number) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width; canvas.height = img.height;
        canvas.getContext("2d")!.drawImage(img, 0, 0);
        canvas.toBlob(blob => {
          if (!blob) return;
          setNewSize(blob.size);
          setPreview(URL.createObjectURL(blob));
        }, "image/jpeg", q/100);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(f);
  };
  useEffect(() => { if (file) { setOrigSize(file.size); compress(file, quality); } }, [file, quality]);
  const download = () => { if (preview) { const a = document.createElement("a"); a.href=preview; a.download="compressed.jpg"; a.click(); } };
  return (
    <div className="space-y-4">
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files?.[0]||null)} />
      <div onClick={() => ref.current?.click()} className="border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl p-8 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 dark:hover:bg-orange-900/10 transition-all" data-testid="dropzone-compress">
        {file ? <><Image className="w-8 h-8 text-orange-500 mx-auto mb-2"/><p className="text-sm font-medium text-black dark:text-white">{file.name}</p></> : <><Minimize2 className="w-10 h-10 text-black/20 dark:text-white/20 mx-auto mb-3"/><p className="text-sm font-medium text-black/50 dark:text-white/50">اضغط لاختيار صورة</p></>}
      </div>
      {file && <div><label className="text-xs text-black/40 dark:text-white/40 mb-2 block">الجودة: {quality}%</label><input type="range" min={10} max={100} value={quality} onChange={e => setQuality(+e.target.value)} className="w-full accent-orange-500" /></div>}
      {preview && (
        <div className="space-y-3">
          <div className="flex gap-3"><div className="flex-1 p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] text-center"><p className="text-xs text-black/40 dark:text-white/40">الأصل</p><p className="font-bold text-black dark:text-white">{(origSize/1024).toFixed(1)} KB</p></div><div className="flex-1 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-center"><p className="text-xs text-green-600 dark:text-green-400">بعد الضغط</p><p className="font-bold text-green-600 dark:text-green-400">{(newSize/1024).toFixed(1)} KB</p></div><div className="flex-1 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-center"><p className="text-xs text-blue-500">التوفير</p><p className="font-bold text-blue-600 dark:text-blue-400">{origSize>0?Math.round((1-newSize/origSize)*100):0}%</p></div></div>
          <img src={preview} alt="preview" className="w-full max-h-40 object-contain rounded-xl border border-black/10 dark:border-white/10" />
          <Button onClick={download} className="w-full gap-2 bg-gradient-to-l from-orange-500 to-red-500 text-white" data-testid="btn-download-compressed"><Download className="w-4 h-4"/>تنزيل الصورة المضغوطة</Button>
        </div>
      )}
    </div>
  );
}

function ImgGrayscalePanel() {
  const { toast } = useToast();
  const [preview, setPreview] = useState("");
  const [original, setOriginal] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const convert = (f: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const src = e.target?.result as string;
      setOriginal(src);
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0,0,canvas.width,canvas.height);
        for (let i=0;i<data.data.length;i+=4){const g=0.299*data.data[i]+0.587*data.data[i+1]+0.114*data.data[i+2];data.data[i]=data.data[i+1]=data.data[i+2]=g;}
        ctx.putImageData(data,0,0);
        setPreview(canvas.toDataURL());
      };
      img.src = src;
    };
    reader.readAsDataURL(f);
  };
  return (
    <div className="space-y-4">
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && convert(e.target.files[0])} />
      <div onClick={() => ref.current?.click()} className="border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl p-8 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50/30 dark:hover:bg-gray-900/10 transition-all" data-testid="dropzone-grayscale">
        <MoveHorizontal className="w-10 h-10 text-black/20 dark:text-white/20 mx-auto mb-3"/>
        <p className="text-sm font-medium text-black/50 dark:text-white/50">اضغط لاختيار صورة</p>
      </div>
      {preview && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-xs text-black/40 dark:text-white/40 mb-1">الأصل</p><img src={original} alt="original" className="w-full h-32 object-cover rounded-xl border border-black/10 dark:border-white/10" /></div>
            <div><p className="text-xs text-black/40 dark:text-white/40 mb-1">بعد التحويل</p><img src={preview} alt="grayscale" className="w-full h-32 object-cover rounded-xl border border-black/10 dark:border-white/10" /></div>
          </div>
          <a href={preview} download="grayscale.png"><Button className="w-full gap-2 bg-gradient-to-l from-gray-500 to-slate-600 text-white" data-testid="btn-download-gray"><Download className="w-4 h-4"/>تنزيل الصورة</Button></a>
        </div>
      )}
    </div>
  );
}

function ImgResizePanel() {
  const { toast } = useToast();
  const [file, setFile] = useState<File|null>(null);
  const [origW, setOrigW] = useState(0);
  const [origH, setOrigH] = useState(0);
  const [w, setW] = useState("");
  const [h, setH] = useState("");
  const [locked, setLocked] = useState(true);
  const ref = useRef<HTMLInputElement>(null);
  const loadImg = (f: File) => {
    setFile(f);
    const img = new window.Image();
    img.onload = () => { setOrigW(img.width); setOrigH(img.height); setW(String(img.width)); setH(String(img.height)); };
    img.src = URL.createObjectURL(f);
  };
  const onW = (val: string) => { setW(val); if(locked && origW && origH) setH(String(Math.round((+val/origW)*origH))); };
  const onH = (val: string) => { setH(val); if(locked && origW && origH) setW(String(Math.round((+val/origH)*origW))); };
  const resize = () => {
    if (!file) return;
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = +w; canvas.height = +h;
      canvas.getContext("2d")!.drawImage(img,0,0,+w,+h);
      canvas.toBlob(b => { if(b){const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`resized_${w}x${h}.png`;a.click(); toast({title:"✅ تم تغيير الحجم"});} });
    };
    img.src = URL.createObjectURL(file);
  };
  return (
    <div className="space-y-4">
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && loadImg(e.target.files[0])} />
      <div onClick={() => ref.current?.click()} className="border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl p-8 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 dark:hover:bg-teal-900/10 transition-all" data-testid="dropzone-resize">
        {file ? <><Maximize2 className="w-8 h-8 text-teal-500 mx-auto mb-2"/><p className="text-sm font-medium text-black dark:text-white">{file.name} ({origW}×{origH}px)</p></> : <><Maximize2 className="w-10 h-10 text-black/20 dark:text-white/20 mx-auto mb-3"/><p className="text-sm font-medium text-black/50 dark:text-white/50">اضغط لاختيار صورة</p></>}
      </div>
      {file && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1"><label className="text-xs text-black/40 dark:text-white/40 mb-1 block">العرض (px)</label><Input type="number" value={w} onChange={e => onW(e.target.value)} /></div>
            <button onClick={() => setLocked(l=>!l)} className={`p-2 rounded-lg border mt-5 transition-colors ${locked?"bg-teal-500 text-white border-teal-500":"border-black/10 dark:border-white/10 text-black/40 dark:text-white/40"}`}><Lock className="w-4 h-4"/></button>
            <div className="flex-1"><label className="text-xs text-black/40 dark:text-white/40 mb-1 block">الارتفاع (px)</label><Input type="number" value={h} onChange={e => onH(e.target.value)} /></div>
          </div>
          <Button onClick={resize} className="w-full gap-2 bg-gradient-to-l from-teal-500 to-green-500 text-white" data-testid="btn-resize"><Download className="w-4 h-4"/>تغيير الحجم وتنزيل</Button>
        </>
      )}
    </div>
  );
}

// ARABIC TOOLS

function TashkeelRemoverPanel() {
  const [input, setInput] = useState("");
  const remove = (s: string) => s.replace(/[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g,"");
  const result = remove(input);
  const removed = input.length - result.length;
  return (
    <div className="space-y-4">
      <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder="أَدْخِلْ نَصّاً مُشَكَّلاً هُنَا..." rows={5} dir="rtl" data-testid="textarea-tashkeel" />
      {input && <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-600 dark:text-amber-400 text-center">تم إزالة {removed} حركة تشكيل</div>}
      <ResultBox value={result} label="النص بدون تشكيل:" />
    </div>
  );
}

function HijriDatePanel() {
  const [greg, setGreg] = useState(new Date().toISOString().split("T")[0]);
  const toHijri = (d: string) => {
    try {
      const date = new Date(d);
      return new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {year:"numeric",month:"long",day:"numeric"}).format(date);
    } catch { return "غير متوفر"; }
  };
  const toGregorian = (d: string) => {
    return new Intl.DateTimeFormat("ar-SA", {year:"numeric",month:"long",day:"numeric",weekday:"long"}).format(new Date(d));
  };
  const hijri = toHijri(greg);
  const greg_ar = toGregorian(greg);
  return (
    <div className="space-y-4">
      <div><label className="text-xs text-black/40 dark:text-white/40 mb-1 block">التاريخ الميلادي</label><Input type="date" value={greg} onChange={e => setGreg(e.target.value)} data-testid="input-greg" /></div>
      <div className="space-y-3">
        <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-center">
          <p className="text-xs text-indigo-500 mb-2">التاريخ الهجري</p>
          <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300">{hijri}</p>
        </div>
        <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] text-center">
          <p className="text-xs text-black/40 dark:text-white/40 mb-1">التاريخ الميلادي بالعربية</p>
          <p className="text-lg font-bold text-black dark:text-white">{greg_ar}</p>
        </div>
      </div>
    </div>
  );
}

function TextToMorsePanel() {
  const MORSE: Record<string,string> = {A:".-",B:"-...",C:"-.-.",D:"-..",E:".",F:"..-.",G:"--.",H:"....",I:"..",J:".---",K:"-.-",L:".-..",M:"--",N:"-.",O:"---",P:".--.",Q:"--.-",R:".-.",S:"...",T:"-",U:"..-",V:"...-",W:".--",X:"-..-",Y:"-.--",Z:"--.."," ":"/"};
  const REVERSE = Object.fromEntries(Object.entries(MORSE).map(([k,v])=>[v,k]));
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"to"|"from">("to");
  const result = (() => {
    if (!input) return "";
    if (mode === "to") return input.toUpperCase().split("").map(c => MORSE[c]||c).join(" ");
    return input.split(" ").map(c => REVERSE[c]||c).join("").toLowerCase();
  })();
  const playMorse = async () => {
    const ctx = new AudioContext();
    const dit=0.1, dah=dit*3, gap=dit, letterGap=dit*3, wordGap=dit*7;
    let t = ctx.currentTime;
    const beep = (dur: number) => {
      const o=ctx.createOscillator(), g=ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value=800; o.start(t); o.stop(t+dur);
      t+=dur+gap;
    };
    const morseStr = mode==="to" ? result : input;
    for (const char of morseStr.split(" ")) {
      if (char === "/") { t += wordGap; continue; }
      for (const sym of char) { sym==="."?beep(dit):sym==="-"?beep(dah):undefined; }
      t += letterGap;
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl">{(["to","from"] as const).map(m => <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode===m?"bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm":"text-black/40 dark:text-white/40"}`}>{m==="to"?"نص → مورس":"مورس → نص"}</button>)}</div>
      <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder={mode==="to"?"HELLO WORLD":".... . .-.. .-.. --- / .-- --- .-. .-.. -.."} rows={4} className="font-mono" data-testid="textarea-morse" />
      {result && (
        <div className="space-y-2">
          <div className="flex items-start gap-2"><div className="flex-1 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.07] rounded-xl p-3 font-mono text-sm text-black dark:text-white break-all">{result}</div><CopyBtn text={result} /></div>
          {mode==="to" && <button onClick={playMorse} className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 hover:opacity-80 transition-opacity"><Volume2 className="w-4 h-4"/>تشغيل صوت المورس</button>}
        </div>
      )}
    </div>
  );
}

function TypingTestPanel() {
  const texts = ["The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.","سرعة الكتابة تعتمد على الممارسة المستمرة والتدريب اليومي على لوحة المفاتيح.","Innovation is the ability to see change as an opportunity and not a threat."];
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [start, setStart] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef<HTMLTextAreaElement>(null);
  const target = texts[idx];
  useEffect(() => {
    if (!started || finished) return;
    const id = setInterval(() => setElapsed(Date.now()-start), 100);
    return () => clearInterval(id);
  }, [started, finished]);
  useEffect(() => { if (typed.length >= target.length) setFinished(true); }, [typed, target]);
  const wpm = elapsed > 0 ? Math.round((typed.split(/\s+/).length / (elapsed/60000))) : 0;
  const accuracy = typed.length > 0 ? Math.round((typed.split("").filter((c,i) => c===target[i]).length / typed.length)*100) : 100;
  const reset = () => { setTyped(""); setStarted(false); setFinished(false); setElapsed(0); ref.current?.focus(); };
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        {texts.map((_,i) => <button key={i} onClick={() => {setIdx(i);reset();}} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${idx===i?"bg-blue-600 text-white border-blue-600":"border-black/10 dark:border-white/10 text-black/50 dark:text-white/50"}`}>نص {i+1}</button>)}
        <button onClick={reset} className="p-1.5 rounded-lg border border-black/10 dark:border-white/10 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"><RefreshCw className="w-4 h-4"/></button>
      </div>
      <div className="p-4 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.07] text-sm leading-relaxed font-mono" dir="auto">
        {target.split("").map((char,i) => <span key={i} className={i<typed.length?(typed[i]===char?"text-green-500":"text-red-500 underline"):i===typed.length?"bg-blue-500/20 text-black dark:text-white":"text-black/40 dark:text-white/40"}>{char}</span>)}
      </div>
      {!finished ? (
        <Textarea ref={ref} value={typed} onChange={e => { if(!started){setStarted(true);setStart(Date.now());} setTyped(e.target.value); }} placeholder="ابدأ الكتابة هنا..." rows={3} className="font-mono" dir="auto" data-testid="textarea-typing" />
      ) : (
        <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-center space-y-2">
          <p className="text-green-600 dark:text-green-400 font-bold text-lg">أحسنت! 🎉</p>
          <div className="flex justify-center gap-6 text-sm"><span className="text-black dark:text-white"><strong className="text-2xl font-black text-blue-500">{wpm}</strong> WPM</span><span className="text-black dark:text-white"><strong className="text-2xl font-black text-green-500">{accuracy}%</strong> دقة</span><span className="text-black dark:text-white"><strong className="text-2xl font-black text-orange-500">{(elapsed/1000).toFixed(1)}</strong> ثانية</span></div>
          <button onClick={reset} className="mt-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-black/10 dark:border-white/10 text-sm text-black dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors">محاولة مجدداً</button>
        </div>
      )}
      {started && !finished && (
        <div className="flex gap-4 text-sm text-black/60 dark:text-white/60">
          <span>WPM: <strong className="text-black dark:text-white">{wpm}</strong></span>
          <span>دقة: <strong className="text-black dark:text-white">{accuracy}%</strong></span>
          <span>الوقت: <strong className="text-black dark:text-white">{(elapsed/1000).toFixed(1)}s</strong></span>
        </div>
      )}
    </div>
  );
}

function CssMinifyPanel() {
  const [input, setInput] = useState("");
  const minify = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g,"").replace(/\s+/g," ").replace(/\s*{\s*/g,"{").replace(/\s*}\s*/g,"}").replace(/\s*:\s*/g,":").replace(/\s*;\s*/g,";").replace(/;\s*}/g,"}").trim();
  const result = input ? minify(input) : "";
  const saved = input.length > 0 ? Math.round((1-result.length/input.length)*100) : 0;
  return (
    <div className="space-y-4">
      <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder=".container {\n  display: flex;\n  flex-direction: column;\n  /* comment */\n  padding: 20px;\n}" rows={7} className="font-mono text-xs" data-testid="textarea-css" />
      {result && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-black/40 dark:text-white/40"><span>تم تقليل الحجم {saved}%</span><span>{input.length} → {result.length} حرف</span></div>
          <div className="flex items-start gap-2"><div className="flex-1 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.07] rounded-xl p-3 font-mono text-xs text-black dark:text-white break-all max-h-32 overflow-auto">{result}</div><CopyBtn text={result} /></div>
        </div>
      )}
    </div>
  );
}

function SvgToPngPanel() {
  const { toast } = useToast();
  const [svg, setSvg] = useState('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">\n  <circle cx="100" cy="100" r="80" fill="#6366f1"/>\n  <text x="100" y="115" text-anchor="middle" fill="white" font-size="40">Q</text>\n</svg>');
  const [scale, setScale] = useState(2);
  const convert = () => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, "image/svg+xml");
      const svgEl = doc.querySelector("svg");
      if (!svgEl) { toast({title:"SVG غير صحيح",variant:"destructive"}); return; }
      const w = parseFloat(svgEl.getAttribute("width")||"100") * scale;
      const h = parseFloat(svgEl.getAttribute("height")||"100") * scale;
      const img = new window.Image();
      const blob = new Blob([svg], {type:"image/svg+xml"});
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img,0,0,w,h);
        canvas.toBlob(b => { if(b){const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="image.png";a.click();toast({title:"✅ تم التحويل"});} });
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch { toast({title:"خطأ في التحويل",variant:"destructive"}); }
  };
  return (
    <div className="space-y-4">
      <Textarea value={svg} onChange={e => setSvg(e.target.value)} rows={7} className="font-mono text-xs" data-testid="textarea-svg" />
      <div><label className="text-xs text-black/40 dark:text-white/40 mb-2 block">مقياس الإخراج: {scale}x</label><input type="range" min={1} max={4} step={0.5} value={scale} onChange={e => setScale(+e.target.value)} className="w-full accent-violet-500" /></div>
      {svg.includes("<svg") && <div className="flex justify-center p-4 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl border border-black/[0.07] dark:border-white/[0.07]"><div dangerouslySetInnerHTML={{__html:svg}} className="max-w-full max-h-40 overflow-hidden" /></div>}
      <Button onClick={convert} className="w-full gap-2 bg-gradient-to-l from-violet-500 to-fuchsia-600 text-white" data-testid="btn-svg-to-png"><Download className="w-4 h-4"/>تحويل وتنزيل PNG</Button>
    </div>
  );
}

function NumberBasePanel() {
  const [input, setInput] = useState("");
  const [fromBase, setFromBase] = useState(10);
  const [toBase, setToBase] = useState(2);
  const result = (() => {
    if (!input.trim()) return "";
    try {
      const decimal = parseInt(input.trim(), fromBase);
      if (isNaN(decimal)) return "⚠️ رقم غير صحيح لهذا النظام";
      return decimal.toString(toBase).toUpperCase();
    } catch { return "⚠️ خطأ في التحويل"; }
  })();
  const bases = [{v:2,l:"ثنائي (2)"},{v:8,l:"ثماني (8)"},{v:10,l:"عشري (10)"},{v:16,l:"سادس عشر (16)"},{v:32,l:"(32)"},{v:36,l:"(36)"}];
  return (
    <div className="space-y-4">
      <Input value={input} onChange={e => setInput(e.target.value)} placeholder="أدخل الرقم..." className="font-mono text-lg" data-testid="input-numbase" />
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-black/40 dark:text-white/40 mb-1 block">من النظام</label><select value={fromBase} onChange={e => setFromBase(+e.target.value)} className="w-full h-9 px-3 rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-gray-900 text-sm text-black dark:text-white">{bases.map(b=><option key={b.v} value={b.v}>{b.l}</option>)}</select></div>
        <div><label className="text-xs text-black/40 dark:text-white/40 mb-1 block">إلى النظام</label><select value={toBase} onChange={e => setToBase(+e.target.value)} className="w-full h-9 px-3 rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-gray-900 text-sm text-black dark:text-white">{bases.map(b=><option key={b.v} value={b.v}>{b.l}</option>)}</select></div>
      </div>
      {result && <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-center"><p className="text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">{result}</p><div className="flex justify-center mt-2"><CopyBtn text={result} /></div></div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Panel Resolver ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function ToolPanel({ id }: { id: string }) {
  const map: Record<string, JSX.Element> = {
    "img-to-pdf":     <ImgToPdfPanel />,
    "pdf-merge":      <PdfMergePanel />,
    "pdf-split":      <PdfSplitPanel />,
    "pdf-rotate":     <PdfRotatePanel />,
    "pdf-watermark":  <PdfWatermarkPanel />,
    "docx-to-pdf":    <DocxToPdfPanel />,
    "html-publish":   <HtmlPublishPanel />,
    "url-shorten":    <UrlShortenPanel />,
    "base64":         <Base64Panel />,
    "password-gen":   <PasswordGenPanel />,
    "uuid-gen":       <UuidGenPanel />,
    "json-csv":       <JsonCsvPanel />,
    "word-counter":   <WordCounterPanel />,
    "case-converter": <CaseConverterPanel />,
    "text-diff":      <TextDiffPanel />,
    "text-reverser":  <TextReverserPanel />,
    "line-sorter":    <LineSorterPanel />,
    "remove-dupes":   <RemoveDupesPanel />,
    "find-replace":   <FindReplacePanel />,
    "lorem-ipsum":    <LoremIpsumPanel />,
    "calc-percentage":<CalcPercentagePanel />,
    "calc-bmi":       <CalcBmiPanel />,
    "unit-converter": <UnitConverterPanel />,
    "calc-age":       <CalcAgePanel />,
    "roman-numerals": <RomanNumeralsPanel />,
    "binary-hex":     <BinaryHexPanel />,
    "calc-discount":  <CalcDiscountPanel />,
    "arabic-num-words":<ArabicNumWordsPanel />,
    "color-converter":<ColorConverterPanel />,
    "gradient-gen":   <GradientGenPanel />,
    "qr-gen":         <QrGenPanel />,
    "shadow-gen":     <ShadowGenPanel />,
    "border-radius":  <BorderRadiusPanel />,
    "color-palette":  <ColorPalettePanel />,
    "contrast-checker":<ContrastCheckerPanel />,
    "img-base64":     <ImgBase64Panel />,
    "jwt-decoder":    <JwtDecoderPanel />,
    "json-format":    <JsonFormatPanel />,
    "regex-tester":   <RegexTesterPanel />,
    "timestamp":      <TimestampPanel />,
    "url-encode":     <UrlEncodePanel />,
    "html-entities":  <HtmlEntitiesPanel />,
    "markdown-html":  <MarkdownHtmlPanel />,
    "hash-gen":       <HashGenPanel />,
    "pomodoro":       <PomodoroPanel />,
    "countdown":      <CountdownPanel />,
    "world-clock":    <WorldClockPanel />,
    "invoice-gen":    <InvoiceGenPanel />,
    "notes":          <NotesPanel />,
    "password-strength":<PasswordStrengthPanel />,
    "email-validator":<EmailValidatorPanel />,
    "hashtag-gen":    <HashtagGenPanel />,
    "img-compress":   <ImgCompressPanel />,
    "img-grayscale":  <ImgGrayscalePanel />,
    "img-resize":     <ImgResizePanel />,
    "tashkeel-remover":<TashkeelRemoverPanel />,
    "hijri-date":     <HijriDatePanel />,
    "text-to-morse":  <TextToMorsePanel />,
    "typing-test":    <TypingTestPanel />,
    "css-minify":     <CssMinifyPanel />,
    "svg-to-png":     <SvgToPngPanel />,
    "number-base":    <NumberBasePanel />,
  };
  return map[id] || <div className="text-center py-8 text-black/40 dark:text-white/40">الأداة غير متوفرة</div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Main ToolPage Component ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export default function ToolPage() {
  const [, params] = useRoute("/my-tools/:toolId");
  const [, navigate] = useLocation();
  const toolId = params?.toolId;
  const tool = ALL_TOOLS.find(t => t.id === toolId);

  if (!tool) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" dir="rtl">
        <p className="text-xl font-bold text-black dark:text-white">الأداة غير موجودة</p>
        <Button onClick={() => navigate("/my-tools")} className="gap-2"><ArrowLeft className="w-4 h-4"/>العودة للأدوات</Button>
      </div>
    );
  }

  const ToolIcon = tool.icon;
  const cat = CATEGORIES.find(c => c.id === tool.cat);

  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-950" dir="rtl">
      {/* Background glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-5 dark:opacity-10 pointer-events-none`} />

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate("/my-tools")}
          className="flex items-center gap-2 text-sm text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors group"
          data-testid="btn-back-to-tools"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          العودة إلى جميع الأدوات
        </button>

        {/* Tool Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-10 dark:opacity-15 rounded-3xl blur-2xl -z-10`} />
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-black/[0.07] dark:border-white/[0.07] rounded-3xl p-7">
            <div className="flex items-center gap-5">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-lg shrink-0`}>
                <ToolIcon className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-black text-black dark:text-white">{tool.label}</h1>
                  {tool.badge && <Badge className={`text-[10px] px-2 py-0 bg-gradient-to-l ${tool.color} text-white border-0`}>{tool.badge}</Badge>}
                </div>
                <p className="text-sm text-black/50 dark:text-white/50 mt-1">{tool.desc}</p>
                {cat && <span className="inline-block mt-2 text-[11px] text-black/30 dark:text-white/30 bg-black/[0.04] dark:bg-white/[0.04] px-2 py-0.5 rounded-lg">{cat.label}</span>}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tool Panel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-6"
        >
          <ToolPanel id={tool.id} />
        </motion.div>
      </div>
    </div>
  );
}
