/**
 * ClientMyStore — /my-store
 * Client-facing store management page. Shows their store status, preview, and config.
 */
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Store, ExternalLink, Globe, Clock, CheckCircle2, PauseCircle,
  XCircle, Rocket, Copy, Check, ShoppingBag, Utensils, Shirt,
  Cpu, Sparkles, ShoppingCart, Pill, BookOpen, ChevronRight,
  Loader2, MessageSquare, Package, ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const TEMPLATE_INFO: Record<string, { nameAr: string; icon: any; bg: string }> = {
  ecommerce:   { nameAr: "متجر إلكتروني",       icon: ShoppingBag, bg: "bg-black" },
  restaurant:  { nameAr: "مطعم وكافيه",         icon: Utensils,    bg: "bg-[#1a0500]" },
  fashion:     { nameAr: "متجر أزياء",           icon: Shirt,       bg: "bg-[#0f0520]" },
  electronics: { nameAr: "إلكترونيات",           icon: Cpu,         bg: "bg-[#00100a]" },
  beauty:      { nameAr: "تجميل وعناية",         icon: Sparkles,    bg: "bg-[#1a0010]" },
  grocery:     { nameAr: "بقالة وسوبرماركت",     icon: ShoppingCart,bg: "bg-[#001a00]" },
  pharmacy:    { nameAr: "صيدلية",               icon: Pill,        bg: "bg-[#00001a]" },
  bookstore:   { nameAr: "مكتبة",                icon: BookOpen,    bg: "bg-[#0a0a00]" },
};

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  lite:     { label: "لايت",     color: "text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300" },
  pro:      { label: "برو",      color: "text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400" },
  infinite: { label: "إنفينيت", color: "text-purple-700 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400" },
};

function statusInfo(status: string) {
  switch (status) {
    case "active":    return { label: "نشط",    icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/15 border-emerald-200 dark:border-emerald-500/20" };
    case "draft":     return { label: "قيد الإعداد", icon: Clock,       color: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-900/15 border-amber-200 dark:border-amber-500/20" };
    case "suspended": return { label: "موقوف",  icon: PauseCircle, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/15 border-orange-200 dark:border-orange-500/20" };
    case "cancelled": return { label: "ملغي",   icon: XCircle,     color: "text-red-600",    bg: "bg-red-50 dark:bg-red-900/15 border-red-200 dark:border-red-500/20" };
    default:          return { label: status,   icon: Clock,       color: "text-gray-500",   bg: "bg-gray-50 border-gray-200" };
  }
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 text-[10px] font-semibold text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

const TEMPLATE_LIVE_URL: Record<string, string | null> = {
  ecommerce:   "https://e-commerce.qiroxstudio.online",
  restaurant:  null, fashion: null, electronics: null,
  beauty: null, grocery: null, pharmacy: null, bookstore: null,
};

function StoreBreadcrumb() {
  return (
    <div className="flex items-center gap-2 text-xs text-black/35 dark:text-white/30 mb-4 px-1" dir="rtl">
      <Link href="/dashboard" className="hover:text-black dark:hover:text-white transition-colors">الرئيسية</Link>
      <ChevronRight className="w-3 h-3 rotate-180" />
      <span className="text-black/60 dark:text-white/50 font-medium">متجري</span>
    </div>
  );
}

export default function ClientMyStore() {
  const { toast } = useToast();

  const { data: store, isLoading, error } = useQuery<any>({
    queryKey: ["/api/client/my-store"],
    queryFn: async () => {
      const r = await fetch("/api/client/my-store", { credentials: "include" });
      if (r.status === 404) return null;
      if (!r.ok) throw new Error("خطأ في تحميل بيانات المتجر");
      return r.json();
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-black/20" />
      </div>
    );
  }

  // ── No store yet ────────────────────────────────────────────────────────────
  if (!store) {
    return (
      <div className="p-6 max-w-lg mx-auto" dir="rtl">
        <StoreBreadcrumb />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 rounded-3xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center mx-auto mb-6">
            <Store className="w-9 h-9 text-black/20 dark:text-white/20" />
          </div>
          <h2 className="text-2xl font-black text-black dark:text-white mb-3">ليس لديك متجر بعد</h2>
          <p className="text-black/40 dark:text-white/35 text-sm leading-relaxed mb-8">
            QIROX Stores تتيح لك إنشاء متجرك الإلكتروني الخاص بشكل احترافي.
            <br />تواصل مع فريقنا لإعداد متجرك من ٨ قوالب متكاملة.
          </p>

          <div className="flex flex-col gap-3">
            <Link href="/cs-chat">
              <Button className="w-full bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl gap-2 h-12">
                <MessageSquare className="w-4 h-4" />
                تواصل مع الدعم الفني
              </Button>
            </Link>
            <Link href="/client/orders">
              <Button variant="outline" className="w-full rounded-xl gap-2 h-11 border-black/10 dark:border-white/10">
                <Package className="w-4 h-4" />
                طلباتي
              </Button>
            </Link>
          </div>

          {/* Features teaser */}
          <div className="mt-10 grid grid-cols-2 gap-3 text-right">
            {[
              { label: "٨ قوالب احترافية", desc: "تجميل، مطاعم، إلكترونيات..." },
              { label: "نطاق فرعي مجاني", desc: "slug.stores.qiroxstudio.online" },
              { label: "لوحة تحكم كاملة", desc: "إدارة المنتجات والطلبات" },
              { label: "دعم ٢٤/٧", desc: "فريق كيروكس بجانبك دائماً" },
            ].map((f, i) => (
              <div key={i} className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.05]">
                <p className="text-[12px] font-bold text-black dark:text-white">{f.label}</p>
                <p className="text-[10px] text-black/35 dark:text-white/30 mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Has store ───────────────────────────────────────────────────────────────
  const si = statusInfo(store.status);
  const StatusIcon = si.icon;
  const tmpl = TEMPLATE_INFO[store.templateSlug] || { nameAr: store.templateSlug, icon: Store, bg: "bg-black" };
  const TemplateIcon = tmpl.icon;
  const plan = PLAN_LABELS[store.planSlug] || { label: store.planSlug, color: "text-gray-600 bg-gray-100" };
  const storeUrl = store.subdomain ? `/s/${store.subdomain}` : null;
  const liveDomain = store.subdomain ? `${store.subdomain}.stores.qiroxstudio.online` : store.customDomain || null;
  const liveUrl = TEMPLATE_LIVE_URL[store.templateSlug];

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto space-y-4" dir="rtl">
      <StoreBreadcrumb />
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-xl ${tmpl.bg} flex items-center justify-center`}>
          <TemplateIcon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-black text-black dark:text-white truncate">
            {store.storeNameAr || store.storeNameEn || "متجري"}
          </h1>
          <p className="text-[11px] text-black/35 dark:text-white/30">{tmpl.nameAr}</p>
        </div>
      </div>

      {/* Status card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border p-4 flex items-start gap-3 ${si.bg}`}
      >
        <StatusIcon className={`w-5 h-5 ${si.color} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm font-bold ${si.color}`}>
              {store.status === "active"    ? "متجرك نشط ✅"          :
               store.status === "draft"     ? "متجرك قيد الإعداد"     :
               store.status === "suspended" ? "المتجر موقوف مؤقتاً"  :
               "المتجر ملغي"}
            </p>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${plan.color}`}>{plan.label}</span>
          </div>
          <p className={`text-[11px] mt-0.5 ${si.color} opacity-70`}>
            {store.status === "active"    ? "يمكنك الوصول إليه الآن عبر الرابط أدناه" :
             store.status === "draft"     ? "سيتم إشعارك عند الإطلاق الرسمي" :
             store.status === "suspended" ? "تواصل مع الدعم لمعرفة السبب" :
             "تواصل مع الدعم لمزيد من التفاصيل"}
          </p>
        </div>
      </motion.div>

      {/* Domain card */}
      {liveDomain && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="rounded-2xl border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900 p-4"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-black/25 dark:text-white/25 mb-3">رابط متجرك</p>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-black/30 dark:text-white/30 flex-shrink-0" />
            <span className="text-[12px] font-mono text-black/70 dark:text-white/60 flex-1 truncate" dir="ltr">
              {liveDomain}
            </span>
            <CopyBtn text={`https://${liveDomain}`} />
          </div>
        </motion.div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        {store.status === "active" && storeUrl && (
          <Link href={storeUrl}>
            <Button className="w-full bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl gap-2 h-11">
              <Rocket className="w-4 h-4" />
              فتح متجري
            </Button>
          </Link>
        )}
        {store.status === "active" && liveUrl && (
          <a href={liveUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full rounded-xl gap-2 h-11 border-black/10 dark:border-white/10">
              <ExternalLink className="w-4 h-4" />
              معاينة مباشرة
            </Button>
          </a>
        )}
        {(store.status !== "active" || !storeUrl) && (
          <Link href="/cs-chat">
            <Button variant="outline" className="w-full rounded-xl gap-2 h-11 border-black/10 dark:border-white/10 col-span-2">
              <MessageSquare className="w-4 h-4" />
              تواصل مع الدعم
            </Button>
          </Link>
        )}
      </div>

      {/* Store details */}
      {store.description && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900 p-4"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-black/25 dark:text-white/25 mb-2">عن المتجر</p>
          <p className="text-sm text-black/60 dark:text-white/50 leading-relaxed">{store.description}</p>
        </motion.div>
      )}

      {/* Contact admin */}
      <div className="pt-4 border-t border-black/[0.05] dark:border-white/[0.05]">
        <Link href="/cs-chat">
          <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-black/30 dark:text-white/30" />
              <span className="text-sm text-black/50 dark:text-white/40">تحتاج مساعدة؟ تواصل مع الدعم</span>
            </div>
            <ChevronRight className="w-4 h-4 text-black/20 dark:text-white/15 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </Link>
      </div>
    </div>
  );
}
