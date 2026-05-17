
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import {
  Building2, FileText, CreditCard, ShieldCheck, Target, Calendar,
  Sparkles, MapPin, Phone, Mail,
  ExternalLink, Search, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Clock, Package, FolderOpen,
  Pen, AlertCircle, Star, Image as ImageIcon,
  Loader2, Layers, TrendingUp, Copy, Check, Video, Send,
  Server, Code2, Database, KeyRound, Globe, Lock, Link2, Terminal, Trash2
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

/* ─── Short order ID ─────────────────────────────────── */
function shortId(id: string): string {
  return `#${String(id).slice(-6).toUpperCase()}`;
}

/* ─── Copy button ─────────────────────────────────────── */
function CopyId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.06] text-xs font-black text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-all"
      title={id}
      data-testid={`btn-copy-id-${id}`}
    >
      {copied ? <Check className="w-3 h-3 text-black dark:text-white" /> : <Copy className="w-3 h-3" />}
      {shortId(id)}
    </button>
  );
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending:    { label: "بانتظار المراجعة", color: "text-black dark:text-white dark:text-black/70 dark:text-white/70",   bg: "bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white",    icon: Clock },
  approved:   { label: "مقبول",            color: "text-black dark:text-white dark:text-black/70 dark:text-white/70",bg: "bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white", icon: CheckCircle2 },
  rejected:   { label: "مرفوض",            color: "text-black dark:text-white dark:text-black/70 dark:text-white/70",        bg: "bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white",         icon: XCircle },
  in_progress:{ label: "قيد التنفيذ",      color: "text-black dark:text-white dark:text-black/70 dark:text-white/70",      bg: "bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white",       icon: TrendingUp },
  completed:  { label: "مكتمل",            color: "text-gray-600 dark:text-gray-300",      bg: "bg-gray-100 dark:bg-white/[0.06]",     icon: CheckCircle2 },
};

/* ─── File link component ─────────────────────────────── */
function FileLink({ url, label }: { url: string; label: string }) {
  if (!url || typeof url !== "string") return null;
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white border border-black/10 dark:border-white/10 dark:border-black dark:border-white rounded-xl text-xs font-bold text-black dark:text-white dark:text-black/70 dark:text-white/70 hover:bg-black/[0.04] dark:bg-white/[0.06] dark:hover:bg-black dark:bg-white transition-all"
    >
      {isImage ? <ImageIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
      {label}
      <ExternalLink className="w-3 h-3 opacity-50" />
    </a>
  );
}

/* ─── Section wrapper ─────────────────────────────────── */
const COLOR_MAP: Record<string, string> = {
  blue:   "bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white text-black dark:text-white dark:text-black/70 dark:text-white/70 border-black/10 dark:border-white/10 dark:border-black dark:border-white",
  rose:   "bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white text-black dark:text-white dark:text-black/70 dark:text-white/70 border-black/10 dark:border-white/10 dark:border-black dark:border-white",
  violet: "bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white text-black dark:text-white dark:text-black/70 dark:text-white/70 border-black/10 dark:border-white/10 dark:border-black dark:border-white",
  indigo: "bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white text-black dark:text-white dark:text-black/70 dark:text-white/70 border-black/10 dark:border-white/10 dark:border-black dark:border-white",
  teal:   "bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white text-black dark:text-white dark:text-black/70 dark:text-white/70 border-black/10 dark:border-white/10 dark:border-black dark:border-white",
  green:  "bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white text-black dark:text-white dark:text-black/70 dark:text-white/70 border-black/10 dark:border-white/10 dark:border-black dark:border-white",
  cyan:   "bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white text-black dark:text-white dark:text-black/70 dark:text-white/70 border-black/10 dark:border-white/10 dark:border-black dark:border-white",
  amber:  "bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white text-black dark:text-white dark:text-black/70 dark:text-white/70 border-black/10 dark:border-white/10 dark:border-black dark:border-white",
};

function Section({ icon: Icon, title, color = "blue", children }: any) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 rounded-xl flex items-center justify-center border shrink-0 ${COLOR_MAP[color] || COLOR_MAP.blue}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-xs font-black uppercase tracking-[0.12em] text-gray-500 dark:text-slate-400">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: any }) {
  if (value === undefined || value === null || value === "") return null;
  const displayVal = typeof value === "boolean" ? (value ? "✓ نعم" : "✗ لا") : String(value);
  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-50 dark:border-white/[0.03] last:border-0 gap-3">
      <span className="text-xs text-gray-400 dark:text-slate-500 shrink-0">{label}</span>
      <span className="text-xs font-semibold text-gray-800 dark:text-white text-left break-all">{displayVal}</span>
    </div>
  );
}

/* ─── Collect all files from order ────────────────────── */
function collectFiles(order: any): Array<{ url: string; label: string }> {
  const files: Array<{ url: string; label: string }> = [];
  const w = order.wizardData || {};
  const add = (url: string, label: string) => { if (url && typeof url === "string") files.push({ url, label }); };

  // From wizardData
  add(w.logoFile,     "شعار المنشأة");
  add(w.brandFile,    "الهوية البصرية");
  add(w.legalDocFile, "وثيقة النشاط");
  add(w.ibanCertFile, "شهادة الإيبان");
  add(w.idPhotoFile,  "صورة الهوية");

  // Extra files from wizardData
  if (Array.isArray(w.extraFiles)) {
    w.extraFiles.forEach((f: string, i: number) => add(f, `ملف إضافي ${i + 1}`));
  }

  // From root-level order fields
  add(order.logoUrl,          "شعار المنشأة");
  add(order.brandIdentityUrl, "الهوية البصرية");
  add(order.filesUrl,         "ملفات المشروع");
  add(order.contentUrl,       "المحتوى");
  add(order.paymentProofUrl,  "إثبات الدفع");

  // From order.files (can be object or array)
  if (order.files) {
    if (Array.isArray(order.files)) {
      order.files.forEach((f: any, i: number) => {
        const url = typeof f === "string" ? f : f?.url || f?.path || "";
        const name = typeof f === "string" ? `ملف ${i + 1}` : f?.name || f?.label || `ملف ${i + 1}`;
        add(url, name);
      });
    } else if (typeof order.files === "object") {
      Object.entries(order.files).forEach(([key, val]: [string, any]) => {
        const url = typeof val === "string" ? val : val?.url || "";
        add(url, key);
      });
    }
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  return files.filter(f => { if (seen.has(f.url)) return false; seen.add(f.url); return true; });
}

/* ─── Day-of-week from Arabic day name ───────────────── */
const DAY_NAME_TO_DOW: Record<string, number> = {
  "الأحد": 0, "الاثنين": 1, "الثلاثاء": 2, "الأربعاء": 3,
  "الخميس": 4, "الجمعة": 5, "السبت": 6,
};
function isPreferredDate(dateStr: string, preferredDays: string[]): boolean {
  if (!preferredDays?.length || !dateStr) return true;
  const dow = new Date(dateStr).getDay();
  return preferredDays.some(d => DAY_NAME_TO_DOW[d] === dow);
}

/* ─── Order card ─────────────────────────────────────── */
function OrderCard({ order: initialOrder }: { order: any }) {
  const [order, setOrder] = useState(initialOrder);
  const [expanded, setExpanded] = useState(false);
  const [meetDate, setMeetDate]   = useState("");
  const [meetTime, setMeetTime]   = useState("");
  const [meetLink, setMeetLink]   = useState("");
  const [showMeetForm, setShowMeetForm] = useState(false);
  const [specs, setSpecs] = useState<any>(null);
  const [specsLoading, setSpecsLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: currentUser } = useUser();
  const isAdmin = currentUser && ["admin"].includes((currentUser as any).role);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("DELETE", `/api/admin/orders/${order._id || order.id}`);
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "تم حذف المشروع بنجاح" });
      setConfirmDelete(false);
    },
    onError: (e: any) => toast({ title: "فشل الحذف", description: e.message, variant: "destructive" }),
  });

  useEffect(() => {
    if (expanded && !specs && !specsLoading) {
      const ordId = order._id || order.id;
      setSpecsLoading(true);
      fetch(`/api/admin/orders/${ordId}/specs`, { credentials: "include" })
        .then(r => r.ok ? r.json() : {})
        .then(data => { setSpecs(data || {}); setSpecsLoading(false); })
        .catch(() => { setSpecs({}); setSpecsLoading(false); });
    }
  }, [expanded]);

  const w = order.wizardData || {};
  const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
  const StatusIcon = status.icon;

  const scheduleMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/admin/orders/${order._id || order.id}/schedule-meeting`, {
      date: meetDate, time: meetTime, meetingLink: meetLink,
    }),
    onSuccess: async (res) => {
      const data = await res.json();
      if (data.scheduledMeeting) {
        setOrder((prev: any) => ({ ...prev, scheduledMeeting: data.scheduledMeeting }));
      }
      setShowMeetForm(false);
      qc.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "تم تأكيد الاجتماع وإرسال الإشعار للعميل ✅" });
    },
    onError: () => toast({ title: "فشل تأكيد الاجتماع", variant: "destructive" }),
  });

  const planLabel =
    order.planTier === "infinite" ? "إنفينتي" :
    order.planTier === "pro"      ? "برو" :
    order.planTier === "lite"     ? "لايت" :
    order.planTier || order.serviceType || "";

  const allFiles = collectFiles(order);

  // Aggregate contact info from wizardData + root-level + client user
  const phone   = w.whatsapp || order.client?.phone || "";
  const email   = w.email || order.client?.email || "";
  const name    = w.businessName || order.businessName || order.client?.fullName || "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl overflow-hidden shadow-sm"
    >
      {/* ── Header ── */}
      <div className="p-4 sm:p-5 flex items-center gap-4">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-black dark:from-white to-black dark:to-white flex items-center justify-center text-white font-black text-base shrink-0 shadow-md shadow-blue-500/20">
          {name.charAt(0) || "?"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-black text-gray-900 dark:text-white text-sm sm:text-base truncate">{name}</p>
            <CopyId id={order._id || order.id} />
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {planLabel && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white border border-black/10 dark:border-white/10 dark:border-black dark:border-white rounded-full text-[10px] font-black text-black dark:text-white dark:text-black/70 dark:text-white/70">
                <Star className="w-2.5 h-2.5" />
                {planLabel}
              </span>
            )}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${status.bg} ${status.color}`}>
              <StatusIcon className="w-2.5 h-2.5" />
              {status.label}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-slate-500">
              {new Date(order.createdAt).toLocaleDateString("ar-SA")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isAdmin && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-9 h-9 rounded-xl border border-red-100 dark:border-red-900/30 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
              title="حذف المشروع"
              data-testid={`btn-delete-order-${order._id}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-9 h-9 rounded-xl border border-black/[0.06] dark:border-white/[0.07] flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all"
            data-testid={`btn-expand-${order._id}`}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المشروع</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف مشروع <span className="font-bold">{name}</span>؟ سيتم حذف جميع الفواتير والإشعارات المرتبطة به ولا يمكن التراجع.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid={`btn-confirm-delete-order-${order._id}`}
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "حذف نهائياً"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Collapsed summary bar ── */}
      {!expanded && (
        <div className="px-4 sm:px-5 pb-4 flex flex-wrap gap-x-4 gap-y-1.5">
          {phone && (
            <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
              <Phone className="w-3 h-3" /> {phone}
            </span>
          )}
          {email && (
            <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
              <Mail className="w-3 h-3" /> {email}
            </span>
          )}
          {w.selectedFeatures?.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
              <Sparkles className="w-3 h-3" /> {w.selectedFeatures.length} مميزة
            </span>
          )}
          {allFiles.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-black dark:text-white dark:text-black/70 dark:text-white/70">
              <FileText className="w-3 h-3" /> {allFiles.length} ملف
            </span>
          )}
          {w.paymobRegistered && (
            <span className="flex items-center gap-1.5 text-xs text-black dark:text-white dark:text-black/70 dark:text-white/70">
              <CheckCircle2 className="w-3 h-3" /> Paymob مسجّل
            </span>
          )}
          {w.paymobPolicyAccepted && (
            <span className="flex items-center gap-1.5 text-xs text-black dark:text-white dark:text-black/70 dark:text-white/70">
              <Pen className="w-3 h-3" /> الاتفاقية موقّعة
            </span>
          )}
        </div>
      )}

      {/* ── Expanded detail ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-black/[0.04] dark:border-white/[0.04] p-4 sm:p-5 space-y-6">

              {/* ── معلومات المنشأة ── */}
              <Section icon={Building2} title="معلومات المنشأة" color="blue">
                <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl px-4 py-1">
                  <InfoRow label="اسم النشاط"       value={name !== "—" ? name : undefined} />
                  <InfoRow label="الواتساب"          value={phone} />
                  <InfoRow label="البريد"            value={email} />
                  <InfoRow label="حجم الفريق"        value={w.teamSize} />
                  <InfoRow label="انستغرام"          value={w.instagram} />
                  <InfoRow label="تويتر / X"         value={w.twitter} />
                  <InfoRow label="سناب شات"          value={w.snapchat} />
                  <InfoRow label="مسؤول الاستلام"    value={w.recipientName ? `${w.recipientName} — ${w.recipientPhone || ""}` : undefined} />
                  <InfoRow label="العميل المسجّل"    value={order.client?.fullName} />
                </div>
                {w.projectIdea && (
                  <div className="mt-3 p-3 bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white border border-black/10 dark:border-white/10 dark:border-black dark:border-white rounded-xl">
                    <p className="text-[10px] font-black text-black dark:text-white dark:text-black/70 dark:text-white/70 uppercase tracking-widest mb-1.5">فكرة المشروع</p>
                    <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{w.projectIdea}</p>
                  </div>
                )}
                {order.notes && (
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.04] rounded-xl">
                    <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">ملاحظات الطلب</p>
                    <p className="text-sm text-gray-600 dark:text-slate-400 whitespace-pre-wrap">{order.notes}</p>
                  </div>
                )}
              </Section>

              {/* ── الملفات ── */}
              {allFiles.length > 0 && (
                <Section icon={FolderOpen} title={`الملفات المرفوعة (${allFiles.length})`} color="violet">
                  <div className="flex flex-wrap gap-2">
                    {allFiles.map((f, i) => (
                      <FileLink key={i} url={f.url} label={f.label} />
                    ))}
                  </div>
                </Section>
              )}

              {/* ── بيانات الوثائق ── */}
              {(w.legalDocNumber || w.legalDocType || w.idNumber || w.taxNumber || w.commercialReg || w.expectedCustomers) && (
                <Section icon={ShieldCheck} title="بيانات الوثائق والنشاط" color="rose">
                  <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl px-4 py-1">
                    <InfoRow label="نوع الوثيقة"          value={w.legalDocType === "commercial" ? "سجل تجاري" : w.legalDocType === "freelance" ? "وثيقة عمل حر" : w.legalDocType} />
                    <InfoRow label="رقم الوثيقة"          value={w.legalDocNumber} />
                    <InfoRow label="الرقم الضريبي"        value={w.taxNumber} />
                    <InfoRow label="رقم الهوية"           value={w.idNumber} />
                    <InfoRow label="السجل التجاري"        value={w.commercialReg} />
                    <InfoRow label="خيار الشعار"          value={w.logoChoice === "upload" ? "مرفوع" : w.logoChoice === "design" ? "طلب تصميم" : w.logoChoice === "none" ? "لاحقاً" : w.logoChoice} />
                    <InfoRow label="خيار الهوية البصرية"  value={w.brandChoice === "upload" ? "مرفوعة" : w.brandChoice === "create" ? "طلب إنشاء" : w.brandChoice === "none" ? "لاحقاً" : w.brandChoice} />
                    <InfoRow label="العملاء المتوقعون"    value={w.expectedCustomers} />
                  </div>
                </Section>
              )}

              {/* ── بيانات Paymob ── */}
              <Section icon={CreditCard} title="بيانات تسجيل Paymob" color="indigo">
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl border ${w.paymobRegistered ? "bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white border-black/10 dark:border-white/10 dark:border-black dark:border-white" : "bg-gray-50 dark:bg-white/[0.02] border-gray-100 dark:border-white/[0.04]"}`}>
                    <div className="flex items-center gap-2">
                      {w.paymobRegistered
                        ? <CheckCircle2 className="w-4 h-4 text-black dark:text-white shrink-0" />
                        : <XCircle className="w-4 h-4 text-gray-300 dark:text-slate-600 shrink-0" />}
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">التسجيل</p>
                        <p className={`text-sm font-black mt-0.5 ${w.paymobRegistered ? "text-black dark:text-white dark:text-black/70 dark:text-white/70" : "text-gray-400 dark:text-slate-500"}`}>
                          {w.paymobRegistered ? "مكتمل ✓" : "لم يتم بعد"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl border ${w.paymobPolicyAccepted ? "bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white border-black/10 dark:border-white/10 dark:border-black dark:border-white" : "bg-gray-50 dark:bg-white/[0.02] border-gray-100 dark:border-white/[0.04]"}`}>
                    <div className="flex items-center gap-2">
                      {w.paymobPolicyAccepted
                        ? <CheckCircle2 className="w-4 h-4 text-black dark:text-white shrink-0" />
                        : <XCircle className="w-4 h-4 text-gray-300 dark:text-slate-600 shrink-0" />}
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">الاتفاقية</p>
                        <p className={`text-sm font-black mt-0.5 ${w.paymobPolicyAccepted ? "text-black dark:text-white dark:text-black/70 dark:text-white/70" : "text-gray-400 dark:text-slate-500"}`}>
                          {w.paymobPolicyAccepted ? "موافق ✓" : "لم يوافق بعد"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {w.paymobSignatureName && (
                  <div className="mt-3 p-3 bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white/[0.06] border border-black/10 dark:border-white/10 dark:border-black dark:border-white rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Pen className="w-3.5 h-3.5 text-black dark:text-white" />
                      <span className="text-[10px] font-black text-black dark:text-white dark:text-black/70 dark:text-white/70 uppercase tracking-widest">التوقيع الرقمي</span>
                    </div>
                    <span className="text-gray-800 dark:text-white font-bold text-base" style={{ fontFamily: "Georgia, serif" }}>
                      {w.paymobSignatureName}
                    </span>
                  </div>
                )}
              </Section>

              {/* ── المميزات ── */}
              {w.selectedFeatures?.length > 0 && (
                <Section icon={Sparkles} title={`المميزات المختارة (${w.selectedFeatures.length})`} color="amber">
                  <div className="flex flex-wrap gap-2">
                    {w.selectedFeatures.map((f: string, i: number) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white border border-black/10 dark:border-white/10 dark:border-black dark:border-white rounded-lg text-xs font-bold text-black dark:text-white dark:text-black/70 dark:text-white/70">
                        <Sparkles className="w-2.5 h-2.5" />
                        {f}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* ── المعلومات التنافسية ── */}
              {(w.competitorUrl || w.technicalFeatures?.length > 0 || w.projectTechIdeas || w.technicalLevel || w.hadPrevSite !== undefined) && (
                <Section icon={Target} title="المعلومات التنافسية والتقنية" color="green">
                  <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl px-4 py-1">
                    <InfoRow label="موقع منافس"           value={w.competitorUrl} />
                    <InfoRow label="سبق وامتلك موقع؟"    value={w.hadPrevSite} />
                    <InfoRow label="ملاحظات الموقع السابق" value={w.prevSiteFeedback} />
                    <InfoRow label="المستوى التقني"       value={w.technicalLevel === "high" ? "خلفية تقنية" : w.technicalLevel === "low" ? "أعمال فقط" : w.technicalLevel} />
                    <InfoRow label="تفاصيل تقنية"         value={w.technicalDetails} />
                    <InfoRow label="فريق مبرمجين؟"        value={w.hasDevTeam} />
                    <InfoRow label="تفاصيل الفريق"        value={w.devTeamDetails} />
                  </div>
                  {w.technicalFeatures?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {w.technicalFeatures.map((f: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white border border-black/10 dark:border-white/10 dark:border-black dark:border-white rounded-full text-[10px] font-bold text-black dark:text-white dark:text-black/70 dark:text-white/70">{f}</span>
                      ))}
                    </div>
                  )}
                  {w.projectTechIdeas && (
                    <div className="mt-3 p-3 bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white border border-black/10 dark:border-white/10 dark:border-black dark:border-white rounded-xl">
                      <p className="text-[10px] font-black text-black dark:text-white dark:text-black/70 dark:text-white/70 uppercase tracking-widest mb-1">الأفكار التقنية</p>
                      <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{w.projectTechIdeas}</p>
                    </div>
                  )}
                </Section>
              )}

              {/* ── جدولة الاجتماع ── */}
              {(w.preferredTimes?.length > 0 || w.preferredDays?.length > 0 || order.scheduledMeeting?.date) && (
                <Section icon={Calendar} title="جدولة الاجتماع" color="cyan">

                  {/* Confirmed meeting badge */}
                  {order.scheduledMeeting?.date && (
                    <div className="mb-4 p-4 bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white border border-black/10 dark:border-white/10 dark:border-black dark:border-white rounded-2xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-black dark:text-white dark:text-black/70 dark:text-white/70" />
                          <span className="text-xs font-black text-black dark:text-white dark:text-black/70 dark:text-white/70 uppercase tracking-widest">اجتماع مؤكّد</span>
                        </div>
                        <button
                          onClick={() => {
                            setMeetDate(order.scheduledMeeting.date);
                            setMeetTime(order.scheduledMeeting.time);
                            setMeetLink(order.scheduledMeeting.meetingLink || "");
                            setShowMeetForm(true);
                          }}
                          className="text-[10px] text-black dark:text-white dark:text-black/70 dark:text-white/70 hover:text-black dark:text-white dark:hover:text-black/70 dark:text-white/70 font-bold transition-colors"
                        >
                          تعديل الموعد
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 bg-white dark:bg-white/[0.06] rounded-xl">
                          <p className="text-[10px] text-gray-400 dark:text-slate-500">التاريخ</p>
                          <p className="text-sm font-black text-gray-900 dark:text-white mt-0.5">
                            {new Date(order.scheduledMeeting.date).toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                          </p>
                        </div>
                        <div className="p-2.5 bg-white dark:bg-white/[0.06] rounded-xl">
                          <p className="text-[10px] text-gray-400 dark:text-slate-500">الوقت</p>
                          <p className="text-sm font-black text-gray-900 dark:text-white mt-0.5">{order.scheduledMeeting.time}</p>
                        </div>
                      </div>
                      {order.scheduledMeeting.meetingLink && (
                        <a
                          href={order.scheduledMeeting.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 flex items-center gap-2 px-3 py-2 bg-white dark:bg-white/[0.06] rounded-xl text-xs font-bold text-black dark:text-white dark:text-black/70 dark:text-white/70 hover:bg-black/[0.04] dark:bg-white/[0.06] dark:hover:bg-black dark:bg-white transition-all"
                        >
                          <Video className="w-3.5 h-3.5" />
                          رابط الاجتماع
                          <ExternalLink className="w-3 h-3 opacity-50 mr-auto" />
                        </a>
                      )}
                      <p className="mt-2 text-[10px] text-gray-400 dark:text-slate-500">
                        أُكِّد بواسطة {order.scheduledMeeting.confirmedBy} — {new Date(order.scheduledMeeting.confirmedAt).toLocaleString("ar-SA")}
                      </p>
                    </div>
                  )}

                  {/* Preferred slots from client */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {w.preferredDays?.length > 0 && (
                      <div className="p-3 bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white/[0.07] border border-black/10 dark:border-white/10 dark:border-black dark:border-white rounded-xl">
                        <p className="text-[10px] font-black text-black dark:text-white dark:text-black/70 dark:text-white/70 uppercase tracking-widest mb-2">الأيام المفضّلة للعميل</p>
                        <div className="flex flex-wrap gap-1">
                          {w.preferredDays.map((d: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-white dark:bg-white/[0.08] rounded-lg text-xs font-bold text-gray-700 dark:text-white">{d}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {w.preferredTimes?.length > 0 && (
                      <div className="p-3 bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white/[0.07] border border-black/10 dark:border-white/10 dark:border-black dark:border-white rounded-xl">
                        <p className="text-[10px] font-black text-black dark:text-white dark:text-black/70 dark:text-white/70 uppercase tracking-widest mb-2">الأوقات المفضّلة للعميل</p>
                        <div className="flex flex-wrap gap-1">
                          {w.preferredTimes.map((t: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-white dark:bg-white/[0.08] rounded-lg text-xs font-bold text-gray-700 dark:text-white">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Schedule button / form */}
                  {!showMeetForm && !order.scheduledMeeting?.date && (w.preferredTimes?.length > 0 || w.preferredDays?.length > 0) && (
                    <button
                      onClick={() => setShowMeetForm(true)}
                      className="w-full h-10 rounded-xl bg-black dark:bg-white hover:bg-black dark:bg-white text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-600/20"
                      data-testid={`btn-schedule-${order._id}`}
                    >
                      <Calendar className="w-4 h-4" />
                      تحديد موعد الاجتماع
                    </button>
                  )}

                  {showMeetForm && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-2xl space-y-3"
                    >
                      <p className="text-xs font-black text-gray-700 dark:text-white mb-1">اختر موعد الاجتماع</p>

                      {/* Date picker */}
                      <div>
                        <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5">التاريخ *</label>
                        <input
                          type="date"
                          value={meetDate}
                          onChange={e => setMeetDate(e.target.value)}
                          min={new Date().toISOString().slice(0, 10)}
                          className={`w-full h-10 px-3 rounded-xl border text-sm bg-white dark:bg-white/[0.05] text-gray-900 dark:text-white focus:outline-none transition-all ${
                            meetDate && w.preferredDays?.length && !isPreferredDate(meetDate, w.preferredDays)
                              ? "border-black/15 dark:border-white/15 dark:border-black dark:border-white"
                              : "border-gray-200 dark:border-slate-700/60"
                          }`}
                          data-testid={`input-date-${order._id}`}
                        />
                        {meetDate && w.preferredDays?.length && !isPreferredDate(meetDate, w.preferredDays) && (
                          <p className="text-[10px] text-black dark:text-white dark:text-black/70 dark:text-white/70 mt-1 flex items-center gap-1">
                            <span>⚠</span> هذا اليوم ليس من الأيام المفضّلة للعميل
                          </p>
                        )}
                      </div>

                      {/* Time select */}
                      <div>
                        <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5">الوقت *</label>
                        {w.preferredTimes?.length > 0 ? (
                          <select
                            value={meetTime}
                            onChange={e => setMeetTime(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-slate-700/60 bg-white dark:bg-white/[0.05] text-sm text-gray-900 dark:text-white focus:outline-none"
                            data-testid={`select-time-${order._id}`}
                          >
                            <option value="">-- اختر الوقت --</option>
                            {w.preferredTimes.map((t: string, i: number) => (
                              <option key={i} value={t}>{t}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="time"
                            value={meetTime}
                            onChange={e => setMeetTime(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-slate-700/60 bg-white dark:bg-white/[0.05] text-sm text-gray-900 dark:text-white focus:outline-none"
                            data-testid={`input-time-${order._id}`}
                          />
                        )}
                      </div>

                      {/* Meeting link (optional) */}
                      <div>
                        <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5">رابط الاجتماع (اختياري)</label>
                        <div className="relative">
                          <Video className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-slate-600 pointer-events-none" />
                          <input
                            type="url"
                            value={meetLink}
                            onChange={e => setMeetLink(e.target.value)}
                            placeholder="https://meet.google.com/..."
                            className="w-full h-10 pr-10 pl-3 rounded-xl border border-gray-200 dark:border-slate-700/60 bg-white dark:bg-white/[0.05] text-sm text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-slate-600 focus:outline-none"
                            data-testid={`input-link-${order._id}`}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => scheduleMutation.mutate()}
                          disabled={!meetDate || !meetTime || scheduleMutation.isPending}
                          className="flex-1 h-10 rounded-xl bg-black dark:bg-white hover:bg-black dark:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
                          data-testid={`btn-confirm-meeting-${order._id}`}
                        >
                          {scheduleMutation.isPending
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Send className="w-4 h-4" />
                          }
                          تأكيد وإشعار العميل
                        </button>
                        <button
                          onClick={() => setShowMeetForm(false)}
                          className="h-10 px-4 rounded-xl border border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-slate-400 font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all"
                        >
                          إلغاء
                        </button>
                      </div>
                    </motion.div>
                  )}
                </Section>
              )}

              {/* ── عنوان التوصيل ── */}
              {(w.address?.name || order.shippingAddress?.name) && (
                <Section icon={MapPin} title="عنوان التوصيل" color="amber">
                  <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl px-4 py-1">
                    {[
                      ["المستلم", w.address?.name || order.shippingAddress?.name],
                      ["الجوال",  w.address?.phone || order.shippingAddress?.phone],
                      ["المدينة", w.address?.city  || order.shippingAddress?.city],
                      ["الحي",    w.address?.district],
                      ["الشارع",  w.address?.street],
                      ["العنوان", order.shippingAddress?.address],
                    ].map(([label, val], i) => <InfoRow key={i} label={label as string} value={val} />)}
                  </div>
                </Section>
              )}

              {/* ── التفاصيل التقنية (specs) ── */}
              {specsLoading && (
                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500 py-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  جارٍ تحميل التفاصيل التقنية...
                </div>
              )}
              {specs && (specs.techStack || specs.framework || specs.language || specs.database || specs.hosting || specs.githubRepoUrl || specs.serverIp || specs.databaseUri || specs.deploymentUsername || specs.deploymentPassword || specs.customDomain || specs.productionUrl || specs.stagingUrl || specs.projectConcept || specs.mainFeatures || specs.variables || specs.referenceLinks || specs.colorPalette || specs.estimatedHours || specs.deadline || specs.notes || specs.teamNotes) && (
                <Section icon={Server} title="التفاصيل التقنية (داخلي)" color="rose">
                  {/* Stack */}
                  {(specs.techStack || specs.framework || specs.language || specs.database || specs.hosting) && (
                    <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl px-4 py-1 mb-3">
                      <div className="flex items-center gap-1.5 py-2 border-b border-gray-100 dark:border-white/[0.04]">
                        <Code2 className="w-3 h-3 text-gray-400 dark:text-slate-500 shrink-0" />
                        <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Stack</span>
                      </div>
                      <InfoRow label="التقنيات"   value={specs.techStack} />
                      <InfoRow label="الإطار"      value={specs.framework} />
                      <InfoRow label="اللغة"       value={specs.language} />
                      <InfoRow label="قاعدة البيانات" value={specs.database} />
                      <InfoRow label="الاستضافة"  value={specs.hosting} />
                    </div>
                  )}
                  {/* Infrastructure */}
                  {(specs.githubRepoUrl || specs.serverIp || specs.customDomain || specs.productionUrl || specs.stagingUrl) && (
                    <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl px-4 py-1 mb-3">
                      <div className="flex items-center gap-1.5 py-2 border-b border-gray-100 dark:border-white/[0.04]">
                        <Globe className="w-3 h-3 text-gray-400 dark:text-slate-500 shrink-0" />
                        <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Infrastructure</span>
                      </div>
                      <InfoRow label="رابط GitHub"       value={specs.githubRepoUrl} />
                      <InfoRow label="IP الخادم"         value={specs.serverIp} />
                      <InfoRow label="الدومين"           value={specs.customDomain} />
                      <InfoRow label="رابط الإنتاج"      value={specs.productionUrl} />
                      <InfoRow label="رابط التجربة"      value={specs.stagingUrl} />
                      <InfoRow label="SSL"                value={specs.sslEnabled !== undefined ? (specs.sslEnabled ? "مفعّل" : "غير مفعّل") : undefined} />
                      <InfoRow label="CDN"                value={specs.cdnEnabled !== undefined ? (specs.cdnEnabled ? "مفعّل" : "غير مفعّل") : undefined} />
                    </div>
                  )}
                  {/* Credentials */}
                  {(specs.databaseUri || specs.deploymentUsername || specs.deploymentPassword) && (
                    <div className="bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white/[0.05] border border-black/10 dark:border-white/10 dark:border-black dark:border-white rounded-xl px-4 py-1 mb-3">
                      <div className="flex items-center gap-1.5 py-2 border-b border-black/10 dark:border-white/10 dark:border-black dark:border-white">
                        <KeyRound className="w-3 h-3 text-black/70 dark:text-white/70 shrink-0" />
                        <span className="text-[10px] font-black text-black/70 dark:text-white/70 uppercase tracking-widest">Credentials (سري)</span>
                      </div>
                      <InfoRow label="URI قاعدة البيانات" value={specs.databaseUri} />
                      <InfoRow label="اسم المستخدم"        value={specs.deploymentUsername} />
                      <InfoRow label="كلمة المرور"          value={specs.deploymentPassword} />
                    </div>
                  )}
                  {/* Env vars */}
                  {specs.variables && (
                    <div className="bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.04] rounded-xl p-3 mb-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Terminal className="w-3 h-3 text-gray-400 dark:text-slate-500 shrink-0" />
                        <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">متغيرات البيئة</span>
                      </div>
                      <pre className="text-[11px] text-gray-700 dark:text-slate-300 whitespace-pre-wrap break-all font-mono leading-relaxed">{specs.variables}</pre>
                    </div>
                  )}
                  {/* Concept */}
                  {(specs.projectConcept || specs.targetAudience || specs.mainFeatures || specs.referenceLinks || specs.colorPalette) && (
                    <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl px-4 py-1 mb-3">
                      <InfoRow label="فكرة المشروع"       value={specs.projectConcept} />
                      <InfoRow label="الجمهور المستهدف"   value={specs.targetAudience} />
                      <InfoRow label="المميزات الرئيسية"  value={specs.mainFeatures} />
                      <InfoRow label="روابط مرجعية"       value={specs.referenceLinks} />
                      <InfoRow label="لوحة الألوان"       value={specs.colorPalette} />
                    </div>
                  )}
                  {/* Timeline */}
                  {(specs.estimatedHours || specs.startDate || specs.deadline) && (
                    <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl px-4 py-1 mb-3">
                      <InfoRow label="الساعات المقدّرة"   value={specs.estimatedHours ? `${specs.estimatedHours} ساعة` : undefined} />
                      <InfoRow label="تاريخ البدء"        value={specs.startDate ? new Date(specs.startDate).toLocaleDateString("ar-SA") : undefined} />
                      <InfoRow label="الموعد النهائي"     value={specs.deadline ? new Date(specs.deadline).toLocaleDateString("ar-SA") : undefined} />
                    </div>
                  )}
                  {/* Notes */}
                  {specs.notes && (
                    <div className="p-3 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.04] rounded-xl mb-2">
                      <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">ملاحظات</p>
                      <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{specs.notes}</p>
                    </div>
                  )}
                  {specs.teamNotes && (
                    <div className="p-3 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.04] rounded-xl">
                      <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">ملاحظات الفريق</p>
                      <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{specs.teamNotes}</p>
                    </div>
                  )}
                </Section>
              )}

              {/* ── معلومات الطلب ── */}
              <Section icon={Package} title="تفاصيل الطلب" color="teal">
                <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl px-4 py-1">
                  <InfoRow label="رقم الطلب (كامل)"   value={order._id || order.id} />
                  <InfoRow label="الباقة"              value={planLabel} />
                  <InfoRow label="الإجمالي"            value={order.totalAmount ? `${Number(order.totalAmount).toLocaleString("ar-SA")} ر.س` : undefined} />
                  <InfoRow label="طريقة الدفع"         value={order.paymentMethod} />
                  <InfoRow label="حالة الدفع"          value={order.paymentStatus} />
                  <InfoRow label="تاريخ الطلب"         value={new Date(order.createdAt).toLocaleString("ar-SA")} />
                </div>
              </Section>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Main page ────────────────────────────────────────── */
export default function AdminProjectData() {
  const { dir } = useI18n();
  const { data: user } = useUser();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPaymob, setFilterPaymob] = useState("all");

  const { data: orders = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/orders"],
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-black/70 dark:text-white/70" />
      </div>
    );
  }

  const role = (user as any)?.role;
  const username = (user as any)?.username;
  if (!["admin", "employee", "manager", "developer", "designer", "support", "accountant", "sales", "sales_manager"].includes(role) && username !== "qadmin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950" dir={dir}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-black/70 dark:text-white/70 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-slate-400 font-bold">غير مصرح بالوصول</p>
        </div>
      </div>
    );
  }

  // Include ALL orders (with or without wizardData) — but sort by most data first
  const filtered = orders.filter((o: any) => {
    const w = o.wizardData || {};
    const q = search.toLowerCase();
    const matchSearch = !search ||
      (w.businessName || o.businessName || "").toLowerCase().includes(q) ||
      (w.whatsapp || o.client?.phone || "").includes(q) ||
      (w.email || o.client?.email || "").toLowerCase().includes(q) ||
      (o.client?.fullName || "").toLowerCase().includes(q) ||
      String(o._id || o.id || "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    const matchPaymob =
      filterPaymob === "all" ||
      (filterPaymob === "registered" && w.paymobRegistered) ||
      (filterPaymob === "policy"     && w.paymobPolicyAccepted) ||
      (filterPaymob === "none"       && !w.paymobRegistered);
    return matchSearch && matchStatus && matchPaymob;
  });

  // Stats
  const totalWithWizard   = orders.filter((o: any) => o.wizardData && Object.keys(o.wizardData).length > 0).length;
  const totalPaymob       = orders.filter((o: any) => o.wizardData?.paymobRegistered).length;
  const totalPolicy       = orders.filter((o: any) => o.wizardData?.paymobPolicyAccepted).length;
  const totalFiles        = orders.reduce((acc: number, o: any) => acc + collectFiles(o).length, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={dir}>
      <div className="h-1 bg-gradient-to-r from-black dark:from-white via-black dark:via-white to-black dark:to-white" />

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-black/[0.05] dark:border-white/[0.05] sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-black dark:from-white to-black dark:to-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-gray-900 dark:text-white text-base sm:text-lg">بيانات المشاريع</h1>
              <p className="text-xs text-gray-400 dark:text-slate-500">{filtered.length} طلب</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/admin/orders")}
            className="text-xs text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition-colors font-bold"
          >
            كل الطلبات →
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Layers,       label: "بيانات مكتملة",       val: totalWithWizard, color: "blue" },
            { icon: CreditCard,   label: "مسجّلون في Paymob",   val: totalPaymob,      color: "indigo" },
            { icon: Pen,          label: "وقّعوا الاتفاقية",     val: totalPolicy,      color: "teal" },
            { icon: FileText,     label: "ملفات مرفوعة",         val: totalFiles,       color: "violet" },
          ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${COLOR_MAP[s.color]}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{s.val}</p>
              <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-slate-600 pointer-events-none" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو الجوال أو البريد..."
              className="pr-10 h-10 rounded-xl text-sm"
              data-testid="input-search"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="h-10 px-3 rounded-xl border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-slate-300 focus:outline-none"
            data-testid="select-status"
          >
            <option value="all">كل الحالات</option>
            <option value="pending">بانتظار المراجعة</option>
            <option value="approved">مقبول</option>
            <option value="in_progress">قيد التنفيذ</option>
            <option value="completed">مكتمل</option>
            <option value="rejected">مرفوض</option>
          </select>
          <select
            value={filterPaymob}
            onChange={e => setFilterPaymob(e.target.value)}
            className="h-10 px-3 rounded-xl border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-slate-300 focus:outline-none"
            data-testid="select-paymob"
          >
            <option value="all">كل Paymob</option>
            <option value="registered">مسجّل في Paymob</option>
            <option value="policy">وقّع الاتفاقية</option>
            <option value="none">لم يسجّل بعد</option>
          </select>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-black/70 dark:text-white/70" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="w-12 h-12 text-gray-200 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-gray-400 dark:text-slate-500 font-bold">
              {search || filterStatus !== "all" || filterPaymob !== "all" ? "لا توجد نتائج تطابق البحث" : "لا توجد طلبات"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order: any) => (
              <OrderCard key={order._id || order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
