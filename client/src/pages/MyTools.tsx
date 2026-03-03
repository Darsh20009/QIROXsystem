import { useState, useRef } from "react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Image, Layers, Scissors, RotateCw, Type, Upload,
  Link2, Globe, Key, Hash, Shuffle, Code2, Loader2, Download,
  Copy, Check, Trash2, Eye, ExternalLink, Plus, ChevronDown,
  ChevronUp, Zap, Star, ArrowRightLeft, Lock
} from "lucide-react";

type Tab = "pdf" | "tech";

type ToolId =
  | "img-to-pdf" | "pdf-merge" | "pdf-split" | "pdf-rotate" | "pdf-watermark" | "docx-to-pdf"
  | "html-publish" | "url-shorten" | "base64" | "password-gen" | "uuid-gen" | "json-csv";

const PDF_TOOLS = [
  { id: "img-to-pdf" as ToolId, icon: Image, label: "صور → PDF", desc: "حوّل صورة أو مجموعة صور إلى ملف PDF واحد", color: "from-blue-500 to-cyan-500" },
  { id: "pdf-merge" as ToolId, icon: Layers, label: "دمج PDF", desc: "ادمج أكثر من ملف PDF في ملف واحد مرتب", color: "from-purple-500 to-pink-500" },
  { id: "pdf-split" as ToolId, icon: Scissors, label: "تقسيم PDF", desc: "استخرج صفحات محددة من ملف PDF", color: "from-orange-500 to-red-500" },
  { id: "pdf-rotate" as ToolId, icon: RotateCw, label: "تدوير PDF", desc: "دوّر صفحات PDF بالزاوية التي تريدها", color: "from-green-500 to-teal-500" },
  { id: "pdf-watermark" as ToolId, icon: Type, label: "ختم مائي", desc: "أضف نصاً أو ختماً مائياً على جميع صفحات PDF", color: "from-amber-500 to-yellow-500" },
  { id: "docx-to-pdf" as ToolId, icon: FileText, label: "Word → PDF", desc: "حوّل ملف Word (.docx) إلى PDF عالي الجودة", color: "from-indigo-500 to-blue-500" },
];

const TECH_TOOLS = [
  { id: "html-publish" as ToolId, icon: Globe, label: "نشر HTML", desc: "انشر صفحة HTML واحصل على رابط مباشر على الإنترنت", color: "from-cyan-500 to-blue-600", badge: "مميز" },
  { id: "url-shorten" as ToolId, icon: Link2, label: "اختصار الروابط", desc: "قصّر أي رابط طويل واحصل على رابط قصير قابل للمشاركة", color: "from-pink-500 to-rose-500" },
  { id: "base64" as ToolId, icon: ArrowRightLeft, label: "محول Base64", desc: "حوّل النصوص والبيانات من وإلى تشفير Base64", color: "from-violet-500 to-purple-600" },
  { id: "password-gen" as ToolId, icon: Key, label: "منشئ كلمات المرور", desc: "أنشئ كلمات مرور قوية وعشوائية بمعاييرك", color: "from-red-500 to-orange-500" },
  { id: "uuid-gen" as ToolId, icon: Shuffle, label: "منشئ UUID", desc: "أنشئ UUID فريداً أو مجموعة منها بنقرة واحدة", color: "from-teal-500 to-green-500" },
  { id: "json-csv" as ToolId, icon: Hash, label: "JSON ↔ CSV", desc: "حوّل بياناتك بين JSON و CSV بسهولة تامة", color: "from-amber-500 to-orange-600" },
];

// ─── Utility helpers ────────────────────────────────────────────────────────
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

async function pdfLib() {
  return await import("pdf-lib");
}

// ─── Tool Panels ─────────────────────────────────────────────────────────────

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
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const img = new window.Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve(); img.onerror = reject; img.src = dataUrl;
        });
        if (i > 0) pdf.addPage();
        const pageW = 210, pageH = 297;
        const ratio = Math.min(pageW / img.width, pageH / img.height);
        const w = img.width * ratio, h = img.height * ratio;
        const x = (pageW - w) / 2, y = (pageH - h) / 2;
        const fmt = file.type.includes("png") ? "PNG" : "JPEG";
        pdf.addImage(dataUrl, fmt, x, y, w, h);
      }
      pdf.save("images-to-pdf.pdf");
      toast({ title: "✅ تم إنشاء PDF بنجاح" });
    } catch (e) {
      toast({ title: "خطأ في التحويل", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <input ref={ref} type="file" multiple accept="image/*" className="hidden"
        onChange={e => setFiles(Array.from(e.target.files || []))} />
      <div
        onClick={() => ref.current?.click()}
        className="border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl p-10 text-center cursor-pointer hover:border-cyan-400 hover:bg-cyan-50/30 dark:hover:bg-cyan-900/10 transition-all"
        data-testid="dropzone-img-pdf"
      >
        <Image className="w-10 h-10 text-black/20 dark:text-white/20 mx-auto mb-3" />
        <p className="text-sm font-medium text-black/50 dark:text-white/50">اضغط لاختيار صور (PNG، JPEG، WebP)</p>
        <p className="text-xs text-black/30 dark:text-white/30 mt-1">يمكنك اختيار أكثر من صورة</p>
      </div>
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] text-sm">
              <Image className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="flex-1 truncate text-black dark:text-white">{f.name}</span>
              <span className="text-black/30 dark:text-white/30 text-xs">{(f.size / 1024).toFixed(0)} KB</span>
              <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-black/30 hover:text-red-500 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
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
      toast({ title: "✅ تم دمج الملفات بنجاح" });
    } catch (e) {
      toast({ title: "خطأ في الدمج — تأكد أن الملفات ليست محمية", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <input ref={ref} type="file" multiple accept=".pdf" className="hidden"
        onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
      <div onClick={() => ref.current?.click()}
        className="border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl p-10 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 dark:hover:bg-purple-900/10 transition-all" data-testid="dropzone-merge">
        <Layers className="w-10 h-10 text-black/20 dark:text-white/20 mx-auto mb-3" />
        <p className="text-sm font-medium text-black/50 dark:text-white/50">اضغط لإضافة ملفات PDF</p>
        <p className="text-xs text-black/30 dark:text-white/30 mt-1">ستُرتَّب بنفس ترتيب الإضافة</p>
      </div>
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] text-sm">
              <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 text-xs flex items-center justify-center font-bold shrink-0">{i + 1}</span>
              <span className="flex-1 truncate text-black dark:text-white">{f.name}</span>
              <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-black/30 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}
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
      // Parse page ranges like "1,3,5-8"
      const indices: number[] = [];
      pages.split(",").forEach(part => {
        const trimmed = part.trim();
        if (trimmed.includes("-")) {
          const [start, end] = trimmed.split("-").map(n => parseInt(n.trim()) - 1);
          for (let i = start; i <= Math.min(end, total - 1); i++) if (i >= 0) indices.push(i);
        } else {
          const n = parseInt(trimmed) - 1;
          if (n >= 0 && n < total) indices.push(n);
        }
      });
      if (!indices.length) { toast({ title: "أرقام الصفحات غير صحيحة", variant: "destructive" }); setLoading(false); return; }
      const out = await PDFDocument.create();
      const copied = await out.copyPages(pdf, indices);
      copied.forEach(p => out.addPage(p));
      const saved = await out.save();
      downloadBlob(new Blob([saved], { type: "application/pdf" }), "split.pdf");
      toast({ title: `✅ تم استخراج ${indices.length} صفحات بنجاح` });
    } catch (e) {
      toast({ title: "خطأ في التقسيم", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <input ref={ref} type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
      <div onClick={() => ref.current?.click()}
        className="border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl p-8 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 dark:hover:bg-orange-900/10 transition-all" data-testid="dropzone-split">
        {file
          ? <p className="text-sm font-medium text-black dark:text-white">{file.name}</p>
          : <><Scissors className="w-10 h-10 text-black/20 dark:text-white/20 mx-auto mb-3" /><p className="text-sm font-medium text-black/50 dark:text-white/50">اضغط لاختيار ملف PDF</p></>
        }
      </div>
      <div>
        <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">أرقام الصفحات (مثال: 1,3,5-8)</label>
        <Input value={pages} onChange={e => setPages(e.target.value)} placeholder="1, 3, 5-8" data-testid="input-split-pages" />
      </div>
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
  const [angle, setAngle] = useState<90 | 180 | 270>(90);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const handle = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const { PDFDocument, degrees } = await pdfLib();
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      pdf.getPages().forEach(p => p.setRotation(degrees(angle)));
      const out = await pdf.save();
      downloadBlob(new Blob([out], { type: "application/pdf" }), "rotated.pdf");
      toast({ title: `✅ تم التدوير ${angle}° بنجاح` });
    } catch (e) {
      toast({ title: "خطأ في التدوير", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <input ref={ref} type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
      <div onClick={() => ref.current?.click()}
        className="border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl p-8 text-center cursor-pointer hover:border-green-400 hover:bg-green-50/30 dark:hover:bg-green-900/10 transition-all" data-testid="dropzone-rotate">
        {file ? <p className="text-sm font-medium text-black dark:text-white">{file.name}</p>
          : <><RotateCw className="w-10 h-10 text-black/20 dark:text-white/20 mx-auto mb-3" /><p className="text-sm font-medium text-black/50 dark:text-white/50">اضغط لاختيار ملف PDF</p></>}
      </div>
      <div className="flex gap-3">
        {([90, 180, 270] as const).map(a => (
          <button key={a} onClick={() => setAngle(a)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${angle === a ? "bg-green-500 text-white border-green-500" : "border-black/10 dark:border-white/10 text-black/50 dark:text-white/50"}`}
            data-testid={`btn-angle-${a}`}>
            {a}°
          </button>
        ))}
      </div>
      <Button onClick={handle} disabled={!file || loading} className="w-full gap-2 bg-gradient-to-l from-green-500 to-teal-500 text-white" data-testid="btn-pdf-rotate">
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
    if (!file || !text.trim()) return;
    setLoading(true);
    try {
      const { PDFDocument, rgb, StandardFonts, degrees } = await pdfLib();
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const font = await pdf.embedFont(StandardFonts.HelveticaBold);
      pdf.getPages().forEach(page => {
        const { width, height } = page.getSize();
        const fontSize = Math.min(width, height) * 0.08;
        const textW = font.widthOfTextAtSize(text, fontSize);
        page.drawText(text, {
          x: (width - textW) / 2,
          y: (height - fontSize) / 2,
          size: fontSize,
          font,
          color: rgb(0.5, 0.5, 0.5),
          opacity,
          rotate: degrees(45),
        });
      });
      const out = await pdf.save();
      downloadBlob(new Blob([out], { type: "application/pdf" }), "watermarked.pdf");
      toast({ title: "✅ تم إضافة الختم المائي بنجاح" });
    } catch (e) {
      toast({ title: "خطأ في إضافة الختم", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <input ref={ref} type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
      <div onClick={() => ref.current?.click()}
        className="border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl p-8 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 dark:hover:bg-amber-900/10 transition-all" data-testid="dropzone-watermark">
        {file ? <p className="text-sm font-medium text-black dark:text-white">{file.name}</p>
          : <><Type className="w-10 h-10 text-black/20 dark:text-white/20 mx-auto mb-3" /><p className="text-sm font-medium text-black/50 dark:text-white/50">اضغط لاختيار ملف PDF</p></>}
      </div>
      <Input value={text} onChange={e => setText(e.target.value)} placeholder="نص الختم المائي" data-testid="input-watermark-text" />
      <div>
        <label className="text-xs text-black/40 dark:text-white/40 mb-2 block">الشفافية: {Math.round(opacity * 100)}%</label>
        <input type="range" min={5} max={80} value={Math.round(opacity * 100)}
          onChange={e => setOpacity(parseInt(e.target.value) / 100)}
          className="w-full accent-amber-500" data-testid="range-opacity" />
      </div>
      <Button onClick={handle} disabled={!file || !text.trim() || loading} className="w-full gap-2 bg-gradient-to-l from-amber-500 to-yellow-500 text-white" data-testid="btn-pdf-watermark">
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
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/tools/docx-to-html", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const { html } = await res.json();
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>Word Document</title><style>body{font-family:Arial,sans-serif;padding:40px;max-width:800px;margin:0 auto;line-height:1.6;}</style></head><body>${html}<script>window.onload=()=>{window.print();}<\/script></body></html>`);
        printWindow.document.close();
        toast({ title: "✅ افتح نافذة الطباعة لحفظ PDF", description: "اختر حفظ كـ PDF من نافذة الطباعة" });
      }
    } catch {
      toast({ title: "خطأ في التحويل — تأكد أن الملف .docx صحيح", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <input ref={ref} type="file" accept=".docx" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-400">
        يتم تحويل الملف لـ HTML ثم يُفتح بنافذة طباعة — اختر «حفظ كـ PDF» من قائمة الطابعات
      </div>
      <div onClick={() => ref.current?.click()}
        className="border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl p-10 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all" data-testid="dropzone-docx">
        {file ? <><FileText className="w-8 h-8 text-indigo-500 mx-auto mb-2" /><p className="text-sm font-medium text-black dark:text-white">{file.name}</p></>
          : <><FileText className="w-10 h-10 text-black/20 dark:text-white/20 mx-auto mb-3" /><p className="text-sm font-medium text-black/50 dark:text-white/50">اضغط لاختيار ملف Word (.docx)</p></>}
      </div>
      <Button onClick={handle} disabled={!file || loading} className="w-full gap-2 bg-gradient-to-l from-indigo-500 to-blue-500 text-white" data-testid="btn-docx-pdf">
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
  const [copied, setCopied] = useState<string | null>(null);

  const { data: pages = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/tools/html-publish"] });

  const publishMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/tools/html-publish", { title: title || "صفحتي", content: html }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tools/html-publish"] });
      setTitle(""); setHtml("");
      toast({ title: "✅ تم النشر!", description: data.url });
    },
    onError: () => toast({ title: "فشل النشر", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/tools/html-publish/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/tools/html-publish"] }); toast({ title: "تم الحذف" }); },
  });

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-5">
      <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="عنوان الصفحة (اختياري)" data-testid="input-html-title" />
      <Textarea
        value={html}
        onChange={e => setHtml(e.target.value)}
        placeholder={"<!DOCTYPE html>\n<html>\n<head><title>صفحتي</title></head>\n<body>\n  <h1>مرحباً!</h1>\n</body>\n</html>"}
        rows={8}
        className="font-mono text-xs"
        data-testid="textarea-html-content"
      />
      <Button onClick={() => publishMutation.mutate()} disabled={!html.trim() || publishMutation.isPending} className="w-full gap-2 bg-gradient-to-l from-cyan-500 to-blue-600 text-white" data-testid="btn-html-publish">
        {publishMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
        {publishMutation.isPending ? "جارٍ النشر..." : "نشر الصفحة"}
      </Button>

      {/* Published pages list */}
      {pages.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
          <p className="text-xs font-semibold text-black/40 dark:text-white/40 uppercase tracking-wide">صفحاتك المنشورة</p>
          {pages.map((p: any) => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900" data-testid={`html-page-${p.id}`}>
              <Globe className="w-4 h-4 text-cyan-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-black dark:text-white truncate">{p.title}</p>
                <p className="text-[10px] text-black/30 dark:text-white/30">{p.views} مشاهدة</p>
              </div>
              <button onClick={() => copy(p.url, p.id)} className="p-1.5 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors text-black/40 dark:text-white/40" data-testid={`copy-html-${p.id}`}>
                {copied === p.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors text-black/40 dark:text-white/40" data-testid={`open-html-${p.id}`}>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button onClick={() => deleteMutation.mutate(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-black/30 dark:text-white/30 hover:text-red-500 transition-colors" data-testid={`del-html-${p.id}`}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
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
  const [copied, setCopied] = useState<string | null>(null);

  const { data: links = [] } = useQuery<any[]>({ queryKey: ["/api/tools/url-shorten"] });

  const shortenMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/tools/url-shorten", { originalUrl: url, title: urlTitle }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tools/url-shorten"] });
      setUrl(""); setUrlTitle("");
      toast({ title: "✅ تم الاختصار!", description: data.url });
    },
    onError: (e: any) => toast({ title: e?.message || "خطأ في الاختصار", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/tools/url-shorten/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/tools/url-shorten"] }); toast({ title: "تم الحذف" }); },
  });

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      <Input value={urlTitle} onChange={e => setUrlTitle(e.target.value)} placeholder="وصف الرابط (اختياري)" data-testid="input-url-title" />
      <div className="flex gap-2">
        <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/very-long-url..." className="flex-1" data-testid="input-url-original" />
        <Button onClick={() => shortenMutation.mutate()} disabled={!url.trim() || shortenMutation.isPending} className="gap-2 bg-gradient-to-l from-pink-500 to-rose-500 text-white shrink-0" data-testid="btn-url-shorten">
          {shortenMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          اختصر
        </Button>
      </div>

      {links.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
          <p className="text-xs font-semibold text-black/40 dark:text-white/40 uppercase tracking-wide">روابطك المختصرة</p>
          {links.map((l: any) => (
            <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900" data-testid={`url-link-${l.id}`}>
              <Link2 className="w-4 h-4 text-pink-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-black dark:text-white truncate">{l.title || l.originalUrl}</p>
                <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">{l.url}</p>
                <p className="text-[10px] text-black/30 dark:text-white/30">{l.clicks} نقرة</p>
              </div>
              <button onClick={() => copy(l.url, l.id)} className="p-1.5 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-black/40 dark:text-white/40" data-testid={`copy-url-${l.id}`}>
                {copied === l.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-black/40 dark:text-white/40"><ExternalLink className="w-3.5 h-3.5" /></a>
              <button onClick={() => deleteMutation.mutate(l.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-black/30 dark:text-white/30 hover:text-red-500 transition-colors" data-testid={`del-url-${l.id}`}><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Base64Panel() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const convert = () => {
    try {
      if (mode === "encode") {
        setOutput(btoa(unescape(encodeURIComponent(input))));
      } else {
        setOutput(decodeURIComponent(escape(atob(input))));
      }
    } catch {
      toast({ title: "بيانات غير صالحة للفك", variant: "destructive" });
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["encode", "decode"] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); setOutput(""); }}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${mode === m ? "bg-violet-500 text-white border-violet-500" : "border-black/10 dark:border-white/10 text-black/50 dark:text-white/50"}`}
            data-testid={`btn-base64-${m}`}>
            {m === "encode" ? "تشفير → Base64" : "فك تشفير Base64"}
          </button>
        ))}
      </div>
      <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder={mode === "encode" ? "اكتب النص هنا..." : "الصق Base64 هنا..."} rows={4} data-testid="textarea-base64-input" />
      <Button onClick={convert} disabled={!input.trim()} className="w-full gap-2 bg-gradient-to-l from-violet-500 to-purple-600 text-white" data-testid="btn-base64-convert">
        <ArrowRightLeft className="w-4 h-4" />
        {mode === "encode" ? "تشفير" : "فك تشفير"}
      </Button>
      {output && (
        <div className="relative">
          <Textarea value={output} readOnly rows={4} className="font-mono text-xs" data-testid="textarea-base64-output" />
          <button onClick={copy} className="absolute top-2 left-2 p-1.5 rounded-lg bg-white dark:bg-gray-800 border border-black/10 dark:border-white/10 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors" data-testid="btn-copy-base64">
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />}
          </button>
        </div>
      )}
    </div>
  );
}

function PasswordGenPanel() {
  const [length, setLength] = useState(16);
  const [opts, setOpts] = useState({ upper: true, lower: true, numbers: true, symbols: true });
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generate = () => {
    const sets: string[] = [];
    if (opts.upper) sets.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    if (opts.lower) sets.push("abcdefghijklmnopqrstuvwxyz");
    if (opts.numbers) sets.push("0123456789");
    if (opts.symbols) sets.push("!@#$%^&*()_+-=[]{}|;:,.<>?");
    if (!sets.length) { toast({ title: "اختر نوعاً واحداً على الأقل", variant: "destructive" }); return; }
    const chars = sets.join("");
    const arr = new Uint8Array(length);
    crypto.getRandomValues(arr);
    setPassword(Array.from(arr).map(n => chars[n % chars.length]).join(""));
  };

  const strength = password.length >= 20 && opts.symbols && opts.numbers ? "قوية جداً" : password.length >= 12 ? "قوية" : "متوسطة";
  const strengthColor = strength === "قوية جداً" ? "text-green-500" : strength === "قوية" ? "text-blue-500" : "text-amber-500";

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-black/40 dark:text-white/40 mb-2 block">الطول: {length} حرف</label>
        <input type="range" min={8} max={64} value={length} onChange={e => setLength(parseInt(e.target.value))} className="w-full accent-red-500" data-testid="range-password-length" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {([
          { key: "upper", label: "أحرف كبيرة A-Z" },
          { key: "lower", label: "أحرف صغيرة a-z" },
          { key: "numbers", label: "أرقام 0-9" },
          { key: "symbols", label: "رموز !@#$" },
        ] as const).map(o => (
          <label key={o.key} className="flex items-center gap-2 cursor-pointer" data-testid={`check-${o.key}`}>
            <input type="checkbox" checked={opts[o.key]} onChange={e => setOpts(p => ({ ...p, [o.key]: e.target.checked }))} className="accent-red-500" />
            <span className="text-sm text-black/60 dark:text-white/60">{o.label}</span>
          </label>
        ))}
      </div>
      <Button onClick={generate} className="w-full gap-2 bg-gradient-to-l from-red-500 to-orange-500 text-white" data-testid="btn-gen-password">
        <Key className="w-4 h-4" /> إنشاء كلمة مرور
      </Button>
      {password && (
        <div className="space-y-2">
          <div className="relative flex items-center gap-2 p-4 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.07]">
            <Lock className="w-4 h-4 text-black/30 dark:text-white/30 shrink-0" />
            <p className="flex-1 font-mono text-sm text-black dark:text-white break-all" data-testid="text-password">{password}</p>
            <button onClick={() => { navigator.clipboard.writeText(password); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="p-1.5 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05]" data-testid="btn-copy-password">
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />}
            </button>
          </div>
          <p className={`text-xs text-center font-medium ${strengthColor}`}>القوة: {strength}</p>
        </div>
      )}
    </div>
  );
}

function UuidGenPanel() {
  const [count, setCount] = useState(1);
  const [uuids, setUuids] = useState<string[]>([]);
  const [copied, setCopied] = useState<number | null>(null);

  const generate = () => {
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
      result.push(`${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`);
    }
    setUuids(result);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-black/40 dark:text-white/40 mb-2 block">العدد: {count}</label>
        <input type="range" min={1} max={20} value={count} onChange={e => setCount(parseInt(e.target.value))} className="w-full accent-teal-500" data-testid="range-uuid-count" />
      </div>
      <Button onClick={generate} className="w-full gap-2 bg-gradient-to-l from-teal-500 to-green-500 text-white" data-testid="btn-gen-uuid">
        <Shuffle className="w-4 h-4" /> إنشاء {count} UUID
      </Button>
      {uuids.length > 0 && (
        <div className="space-y-2">
          {uuids.map((u, i) => (
            <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.07]" data-testid={`uuid-${i}`}>
              <span className="flex-1 font-mono text-xs text-black dark:text-white">{u}</span>
              <button onClick={() => { navigator.clipboard.writeText(u); setCopied(i); setTimeout(() => setCopied(null), 2000); }}
                className="p-1.5 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] shrink-0" data-testid={`copy-uuid-${i}`}>
                {copied === i ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />}
              </button>
            </div>
          ))}
          <button onClick={() => { navigator.clipboard.writeText(uuids.join("\n")); }}
            className="w-full py-2 text-xs text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white border border-dashed border-black/10 dark:border-white/10 rounded-xl transition-colors" data-testid="btn-copy-all-uuids">
            نسخ الكل
          </button>
        </div>
      )}
    </div>
  );
}

function JsonCsvPanel() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"json-to-csv" | "csv-to-json">("json-to-csv");
  const { toast } = useToast();

  const convert = () => {
    try {
      if (mode === "json-to-csv") {
        const data = JSON.parse(input);
        const arr = Array.isArray(data) ? data : [data];
        if (!arr.length) { setOutput(""); return; }
        const keys = Object.keys(arr[0]);
        const header = keys.join(",");
        const rows = arr.map(row => keys.map(k => {
          const val = String(row[k] ?? "");
          return val.includes(",") || val.includes("\n") ? `"${val.replace(/"/g, '""')}"` : val;
        }).join(","));
        setOutput([header, ...rows].join("\n"));
      } else {
        const lines = input.trim().split("\n");
        const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
        const result = lines.slice(1).map(line => {
          const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
          return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
        });
        setOutput(JSON.stringify(result, null, 2));
      }
    } catch {
      toast({ title: "البيانات غير صحيحة", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["json-to-csv", "csv-to-json"] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); setOutput(""); }}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${mode === m ? "bg-amber-500 text-white border-amber-500" : "border-black/10 dark:border-white/10 text-black/50 dark:text-white/50"}`}
            data-testid={`btn-mode-${m}`}>
            {m === "json-to-csv" ? "JSON → CSV" : "CSV → JSON"}
          </button>
        ))}
      </div>
      <Textarea value={input} onChange={e => setInput(e.target.value)}
        placeholder={mode === "json-to-csv" ? '[{"name":"أحمد","age":25}]' : "name,age\nأحمد,25"}
        rows={6} className="font-mono text-xs" data-testid="textarea-json-input" />
      <Button onClick={convert} disabled={!input.trim()} className="w-full gap-2 bg-gradient-to-l from-amber-500 to-orange-600 text-white" data-testid="btn-convert-json">
        <ArrowRightLeft className="w-4 h-4" /> تحويل
      </Button>
      {output && (
        <div className="relative">
          <Textarea value={output} readOnly rows={6} className="font-mono text-xs" data-testid="textarea-json-output" />
          <div className="absolute top-2 left-2 flex gap-1">
            <button onClick={() => navigator.clipboard.writeText(output)}
              className="p-1.5 rounded-lg bg-white dark:bg-gray-800 border border-black/10 dark:border-white/10" data-testid="btn-copy-output">
              <Copy className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
            </button>
            <button onClick={() => {
              const blob = new Blob([output], { type: mode === "json-to-csv" ? "text/csv" : "application/json" });
              downloadBlob(blob, mode === "json-to-csv" ? "data.csv" : "data.json");
            }} className="p-1.5 rounded-lg bg-white dark:bg-gray-800 border border-black/10 dark:border-white/10" data-testid="btn-download-output">
              <Download className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tool Panel Resolver ───────────────────────────────────────────────────
function ToolPanel({ id }: { id: ToolId }) {
  switch (id) {
    case "img-to-pdf":    return <ImgToPdfPanel />;
    case "pdf-merge":     return <PdfMergePanel />;
    case "pdf-split":     return <PdfSplitPanel />;
    case "pdf-rotate":    return <PdfRotatePanel />;
    case "pdf-watermark": return <PdfWatermarkPanel />;
    case "docx-to-pdf":   return <DocxToPdfPanel />;
    case "html-publish":  return <HtmlPublishPanel />;
    case "url-shorten":   return <UrlShortenPanel />;
    case "base64":        return <Base64Panel />;
    case "password-gen":  return <PasswordGenPanel />;
    case "uuid-gen":      return <UuidGenPanel />;
    case "json-csv":      return <JsonCsvPanel />;
  }
}

// ─── Tool Card ──────────────────────────────────────────────────────────────
function ToolCard({ tool, isOpen, onToggle }: {
  tool: typeof PDF_TOOLS[0] & { badge?: string };
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      layout
      className={`border rounded-2xl overflow-hidden transition-colors ${isOpen ? "border-black/15 dark:border-white/15 shadow-md" : "border-black/[0.07] dark:border-white/[0.07]"}`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors text-right"
        data-testid={`tool-card-${tool.id}`}
      >
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center shrink-0 shadow-sm`}>
          <tool.icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-black dark:text-white">{tool.label}</span>
            {tool.badge && <Badge className="text-[10px] px-2 py-0 bg-gradient-to-l from-cyan-500 to-blue-600 text-white border-0">{tool.badge}</Badge>}
          </div>
          <p className="text-xs text-black/40 dark:text-white/40 mt-0.5">{tool.desc}</p>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-black/30 dark:text-white/30 shrink-0" /> : <ChevronDown className="w-4 h-4 text-black/30 dark:text-white/30 shrink-0" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 border-t border-black/[0.05] dark:border-white/[0.05]">
              <ToolPanel id={tool.id as ToolId} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function MyTools() {
  const [tab, setTab] = useState<Tab>("pdf");
  const [openTool, setOpenTool] = useState<ToolId | null>(null);

  const toggleTool = (id: ToolId) => setOpenTool(prev => prev === id ? null : id);

  const currentTools = tab === "pdf" ? PDF_TOOLS : TECH_TOOLS;

  return (
    <div className="relative overflow-hidden min-h-screen bg-white dark:bg-gray-950 p-6" dir="rtl">
      <PageGraphics variant="dashboard" />

      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 dark:from-cyan-500/5 dark:to-blue-600/5 rounded-3xl blur-2xl -z-10" />
          <div className="bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-900/80 dark:to-gray-900/60 backdrop-blur-sm border border-black/[0.07] dark:border-white/[0.07] rounded-3xl p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-black dark:text-white tracking-tight">أدواتي ومميزاتي</h1>
                <p className="text-black/40 dark:text-white/40 text-sm mt-1">مجموعة أدوات تقنية احترافية في مكان واحد</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              {[
                { label: "أدوات PDF", value: PDF_TOOLS.length, color: "text-blue-500" },
                { label: "خدمات تقنية", value: TECH_TOOLS.length, color: "text-cyan-500" },
                { label: "مجاناً 100%", value: "✓", color: "text-green-500" },
              ].map((s) => (
                <div key={s.label} className="text-center p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02]">
                  <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-[11px] text-black/40 dark:text-white/40 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-black/[0.03] dark:bg-white/[0.03] rounded-2xl border border-black/[0.06] dark:border-white/[0.06]">
          {([
            { id: "pdf" as Tab, label: "📄 أدوات PDF والمستندات", desc: `${PDF_TOOLS.length} أداة` },
            { id: "tech" as Tab, label: "⚡ الخدمات التقنية", desc: `${TECH_TOOLS.length} خدمة` },
          ]).map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setOpenTool(null); }}
              className={`flex-1 flex flex-col items-center py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                tab === t.id
                  ? "bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm"
                  : "text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60"
              }`}
              data-testid={`tab-tools-${t.id}`}
            >
              <span>{t.label}</span>
              <span className="text-[10px] opacity-60 mt-0.5">{t.desc}</span>
            </button>
          ))}
        </div>

        {/* Tool Cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {currentTools.map(tool => (
              <ToolCard
                key={tool.id}
                tool={tool as any}
                isOpen={openTool === tool.id}
                onToggle={() => toggleTool(tool.id)}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Footer hint */}
        <div className="flex items-center justify-center gap-2 text-xs text-black/25 dark:text-white/25 pb-4">
          <Star className="w-3 h-3" />
          <span>جميع أدوات PDF تعمل محلياً على جهازك بدون رفع ملفاتك للسيرفر</span>
          <Star className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}
