import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import type { SectorTemplate } from "@shared/schema";
import {
  ArrowRight, Play, Globe, Download, BookOpen,
  Loader2, ChevronLeft, ExternalLink, Package,
  CheckCircle2, Zap, Star, FileText, Video,
  Monitor, Smartphone, Tablet, RefreshCw,
  UtensilsCrossed, Users, ShieldCheck, Truck,
  LayoutDashboard, ChefHat, CreditCard, QrCode,
  BarChart3, Calendar, Heart, Gift, Share2,
  Settings, Eye, Lock, User, Coffee, Utensils,
  MapPin, Bell, ClipboardList, Layers, Copy,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

const TIER_META: Record<string, { label: string; color: string; bg: string; border: string; desc: string }> = {
  lite:     { label: "لايت",    color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200",   desc: "الباقة الأساسية — كل ما تحتاجه للبداية" },
  pro:      { label: "برو",     color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200", desc: "الباقة الاحترافية — للمشاريع المتوسطة والكبيرة" },
  infinite: { label: "إنفينيت", color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200",  desc: "الباقة الكاملة — بلا حدود لأكبر المشاريع" },
  custom:   { label: "مخصص",   color: "text-gray-700",   bg: "bg-gray-50",   border: "border-gray-200",   desc: "باقة مخصصة حسب احتياجك" },
};

function getVideoEmbed(url: string): string | null {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
  const vmMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}`;
  return null;
}

// ── Cafe Pages Data ─────────────────────────────────────────────────────────
interface CafePage {
  path: string;
  titleAr: string;
  descAr: string;
  icon: any;
  badge: string;
  badgeColor: string;
  category: "customer" | "employee" | "manager" | "driver" | "admin";
}

const CAFE_PUBLIC_PAGES: CafePage[] = [
  { path: "/welcome",          titleAr: "صفحة الترحيب الرئيسية",       descAr: "أول صفحة يراها العميل — تعرض شعار الكافيه وصورة جذابة وزر 'ابدأ الطلب' للانتقال للقائمة.",  icon: Coffee,        badge: "عملاء", badgeColor: "bg-orange-100 text-orange-700" , category: "customer" },
  { path: "/menu",             titleAr: "قائمة المنتجات الكاملة",       descAr: "صفحة التسوق الأساسية — عرض فئات المنتجات (مشروبات ساخنة، باردة، حلويات...) مع بحث وتخصيص وإضافة للسلة.", icon: Utensils,      badge: "عملاء", badgeColor: "bg-orange-100 text-orange-700", category: "customer" },
  { path: "/menu-view",        titleAr: "عرض بصري للقائمة",            descAr: "تصميم كتالوج بصري جذاب مع عروض منزلقة — مثالي للعرض على الشاشات الكبيرة والعروض التقديمية.",       icon: Layers,        badge: "عملاء", badgeColor: "bg-orange-100 text-orange-700", category: "customer" },
  { path: "/order-status",     titleAr: "شاشة حالة الطلبات المباشرة",  descAr: "شاشة تُعلَّق في منطقة الانتظار — تظهر الطلبات قيد التحضير والمكتملة وتُحدَّث فورياً.",          icon: ClipboardList, badge: "شاشة عامة", badgeColor: "bg-slate-100 text-slate-700", category: "customer" },
  { path: "/customer-display", titleAr: "شاشة العملاء أمام الكاشير",  descAr: "تُوصَل بشاشة ثانية أمام العميل في نقطة البيع — تعرض تفاصيل الطلب الحالي والمجموع.",             icon: Monitor,       badge: "شاشة عامة", badgeColor: "bg-slate-100 text-slate-700", category: "customer" },
  { path: "/table-reservation", titleAr: "حجز الطاولات مسبقاً",       descAr: "اختيار التاريخ والوقت وعدد الأشخاص وإدخال بيانات التواصل — بدون الحاجة للاتصال بالكافيه.",      icon: Calendar,      badge: "عملاء", badgeColor: "bg-orange-100 text-orange-700", category: "customer" },
  { path: "/guide",            titleAr: "دليل استخدام النظام",          descAr: "شرح مصوّر لكل خطوات الطلب والدفع — مرجع تعليمي للعملاء الجدد.",                                 icon: BookOpen,      badge: "عملاء", badgeColor: "bg-orange-100 text-orange-700", category: "customer" },
  { path: "/notifications",    titleAr: "صفحة الإشعارات العامة",       descAr: "عروض جديدة وتحديثات الطلبات ورسائل النظام — متاحة لجميع المستخدمين.",                             icon: Bell,          badge: "عملاء", badgeColor: "bg-orange-100 text-orange-700", category: "customer" },
];

const CAFE_AUTH_PAGES: CafePage[] = [
  { path: "/auth",             titleAr: "تسجيل الدخول / إنشاء حساب",  descAr: "التحقق برقم الجوال — نقطة دخول العملاء لجميع الصفحات المحمية.",   icon: User,          badge: "حماية", badgeColor: "bg-blue-100 text-blue-700", category: "customer" },
  { path: "/customer-login",   titleAr: "دخول بديل للعملاء",           descAr: "تسجيل دخول باسم المستخدم وكلمة المرور للعملاء ذوي الحسابات القديمة.", icon: Lock,         badge: "حماية", badgeColor: "bg-blue-100 text-blue-700", category: "customer" },
  { path: "/forgot-password",  titleAr: "استعادة كلمة المرور",          descAr: "إدخال رقم الجوال المسجّل لاستعادة كلمة المرور.",                       icon: ShieldCheck,   badge: "حماية", badgeColor: "bg-blue-100 text-blue-700", category: "customer" },
];

const CAFE_EMPLOYEE_PAGES: CafePage[] = [
  { path: "/employee/login",   titleAr: "تسجيل دخول الموظف",           descAr: "دخول الموظف لنظام الشيفتات والطلبات.",                               icon: User,          badge: "موظف", badgeColor: "bg-emerald-100 text-emerald-700", category: "employee" },
  { path: "/employee/gateway", titleAr: "بوابة اختيار المستخدم",        descAr: "فصل طريق الموظف عن المدير — يوجّه كلاً منهما لصفحته المناسبة.",      icon: Layers,        badge: "موظف", badgeColor: "bg-emerald-100 text-emerald-700", category: "employee" },
  { path: "/employee/activate", titleAr: "تفعيل حساب موظف جديد",       descAr: "يُستخدم مرة واحدة فقط عند انضمام موظف جديد — ينشئ كلمة مرور خاصة.", icon: ShieldCheck,   badge: "موظف", badgeColor: "bg-emerald-100 text-emerald-700", category: "employee" },
];

const CAFE_MANAGER_PAGES: CafePage[] = [
  { path: "/manager",          titleAr: "تسجيل دخول المدير",           descAr: "نقطة الدخول الرئيسية للمديرين وأصحاب المطاعم بصلاحيات أعلى.",       icon: Lock,          badge: "مدير", badgeColor: "bg-violet-100 text-violet-700", category: "manager" },
  { path: "/manager/forgot-password", titleAr: "استعادة كلمة مرور المدير", descAr: "إجراء آمن لاستعادة كلمة مرور حساب المدير.",                      icon: ShieldCheck,   badge: "مدير", badgeColor: "bg-violet-100 text-violet-700", category: "manager" },
];

const CAFE_DRIVER_PAGES: CafePage[] = [
  { path: "/driver/login",     titleAr: "تسجيل دخول السائق",           descAr: "نقطة الدخول الخاصة بسائقي التوصيل.",                                 icon: Truck,         badge: "سائق", badgeColor: "bg-sky-100 text-sky-700", category: "driver" },
];

interface PortalCredential {
  role: string;
  username: string;
  password: string;
  access: string;
  icon: any;
  color: string;
  bg: string;
}

const CAFE_PORTALS: PortalCredential[] = [
  { role: "عميل التجربة",    username: "512345678",  password: "demo1234",    access: "السلة، الدفع، تتبع الطلبات، بطاقة الولاء",          icon: User,          color: "text-orange-700", bg: "bg-orange-50" },
  { role: "كاشير",           username: "cashier",    password: "cashier123",  access: "الكاشير، الطلبات، الطاولات، الولاء، الحضور",        icon: CreditCard,    color: "text-emerald-700", bg: "bg-emerald-50" },
  { role: "باريستا",         username: "barista",    password: "barista123",  access: "المطبخ، الطلبات، الحضور",                           icon: Coffee,        color: "text-amber-700", bg: "bg-amber-50" },
  { role: "مدير فرع",        username: "manager",    password: "manager123",  access: "لوحة التحكم، المخزون، المحاسبة، الموظفين، التقارير", icon: LayoutDashboard, color: "text-violet-700", bg: "bg-violet-50" },
  { role: "مدير QIROX",      username: "qirox2026",  password: "qirox2026",   access: "نفس صلاحيات المدير",                                icon: Settings,      color: "text-slate-700",  bg: "bg-slate-50" },
  { role: "مسؤول النظام",    username: "qadmin",     password: "admin123",    access: "جميع الصفحات + إعدادات الفروع والنظام",              icon: ShieldCheck,   color: "text-red-700", bg: "bg-red-50" },
];

// ── Browser Frame ─────────────────────────────────────────────────────────
function BrowserFrame({ url, label, page }: { url: string; label: string; page?: CafePage }) {
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const Icon = page?.icon || Globe;

  const mockBars = [
    { w: "60%", h: "h-3" }, { w: "40%", h: "h-3" }, { w: "75%", h: "h-3" },
    { w: "50%", h: "h-2" }, { w: "65%", h: "h-2" }, { w: "30%", h: "h-2" },
  ];

  return (
    <div className="bg-[#1e1e1e] rounded-2xl overflow-hidden shadow-2xl border border-white/[0.06]">
      {/* Browser chrome */}
      <div className="bg-[#2d2d2d] px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 bg-[#1a1a1a] rounded-lg px-3 py-1.5 flex items-center gap-2 min-w-0">
          <div className="w-3 h-3 rounded-full bg-green-400/80 flex-shrink-0" />
          <span className="text-white/50 text-xs font-mono truncate" dir="ltr">{url}</span>
        </div>
        <div className="flex items-center gap-1 bg-[#1a1a1a] rounded-lg p-1">
          {(["desktop", "tablet", "mobile"] as const).map(v => (
            <button key={v} onClick={() => setViewport(v)}
              className={`p-1 rounded-md transition-colors ${viewport === v ? "bg-white/15 text-white" : "text-white/30 hover:text-white/60"}`}>
              {v === "desktop" && <Monitor className="w-3.5 h-3.5" />}
              {v === "tablet" && <Tablet className="w-3.5 h-3.5" />}
              {v === "mobile" && <Smartphone className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white/70 transition-colors">
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Preview area */}
      <div className="relative overflow-hidden flex justify-center bg-[#f0f0f0]" style={{ height: "460px" }}>
        <div
          className="relative overflow-hidden transition-all duration-500 bg-white"
          style={{
            width: viewport === "desktop" ? "100%" : viewport === "tablet" ? "768px" : "390px",
            height: "100%",
          }}
        >
          {/* Fake page skeleton UI */}
          <div className="w-full h-full flex flex-col">
            {/* Fake nav bar */}
            <div className="bg-[#1a1a1a] h-12 flex items-center gap-3 px-5 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-amber-600/80 flex items-center justify-center">
                <Coffee className="w-4 h-4 text-white" />
              </div>
              <div className="w-24 h-2.5 bg-white/20 rounded-full" />
              <div className="flex gap-3 mr-auto">
                {[1,2,3].map(n => <div key={n} className="w-12 h-2 bg-white/10 rounded-full" />)}
              </div>
            </div>

            {/* Fake hero */}
            <div className="h-44 bg-gradient-to-br from-amber-900 to-amber-700 relative overflow-hidden flex-shrink-0">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "16px 16px" }} />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-2">
                  <div className="h-5 w-40 bg-white/30 rounded-full mx-auto" />
                  <div className="h-3 w-56 bg-white/15 rounded-full mx-auto" />
                </div>
                <div className="h-9 w-36 bg-white/25 rounded-xl mt-1" />
              </div>
            </div>

            {/* Fake content area */}
            <div className="flex-1 p-5 space-y-4 overflow-hidden">
              {/* Fake category row */}
              <div className="flex gap-2">
                {["☕ مشروبات", "🥐 حلويات", "🥗 سناندويش", "❄️ باردة"].map(c => (
                  <div key={c} className="px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-[10px] text-gray-500 font-medium whitespace-nowrap">{c}</div>
                ))}
              </div>
              {/* Fake product grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1,2,3,4,5,6].map(n => (
                  <div key={n} className="rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
                    <div className="h-20 bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-amber-200/70" />
                    </div>
                    <div className="p-2 space-y-1.5">
                      {mockBars.slice(0,2).map((b, i) => (
                        <div key={i} className={`${b.h} rounded-full bg-gray-200`} style={{ width: b.w }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Overlay with open button */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col items-center justify-end pb-10 gap-4">
            <div className="text-center px-6">
              <p className="text-white font-black text-lg mb-1">{label}</p>
              <p className="text-white/50 text-xs">{page?.descAr?.slice(0, 70)}...</p>
            </div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="btn-open-preview"
              className="flex items-center gap-2 bg-white text-black font-bold text-sm px-6 py-3 rounded-2xl hover:bg-white/90 transition-all shadow-xl hover:scale-105 active:scale-95"
            >
              <ExternalLink className="w-4 h-4" />
              فتح الصفحة الحقيقية
            </a>
            <p className="text-white/20 text-[10px] font-mono" dir="ltr">{url}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page Card ─────────────────────────────────────────────────────────────
function PageCard({ page, baseUrl, index, onPreview }: {
  page: CafePage;
  baseUrl: string;
  index: number;
  onPreview: (page: CafePage) => void;
}) {
  const Icon = page.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
      data-testid={`card-page-${index}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center flex-shrink-0 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
          <Icon className="w-5 h-5 text-black/40 dark:text-white/40 group-hover:text-orange-600 transition-colors" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-sm font-bold text-black dark:text-white">{page.titleAr}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${page.badgeColor}`}>{page.badge}</span>
          </div>
          <p className="text-xs text-black/50 dark:text-white/50 leading-relaxed">{page.descAr}</p>
          <div className="flex items-center gap-2 mt-2">
            <code className="text-[10px] text-black/30 dark:text-white/30 font-mono bg-black/[0.04] dark:bg-white/[0.04] px-2 py-0.5 rounded-md truncate block max-w-[200px]" dir="ltr">{page.path}</code>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button
            onClick={() => onPreview(page)}
            className="w-8 h-8 rounded-xl border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-all group/btn"
            title="معاينة"
            data-testid={`btn-preview-page-${index}`}
          >
            <Eye className="w-3.5 h-3.5 text-black/30 group-hover/btn:text-orange-600" />
          </button>
          <a
            href={`${baseUrl}${page.path}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-xl border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center hover:bg-black/[0.04] transition-all"
            title="فتح في تبويب جديد"
            data-testid={`btn-open-page-${index}`}
          >
            <ExternalLink className="w-3.5 h-3.5 text-black/30" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// ── Stat Badge ─────────────────────────────────────────────────────────────
function StatBadge({ value, label, icon: Icon }: { value: string | number; label: string; icon: any }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 text-center min-w-[100px]">
      <Icon className="w-4 h-4 text-white/50 mx-auto mb-1" />
      <p className="text-white font-black text-lg leading-none">{value}</p>
      <p className="text-white/40 text-[10px] mt-1">{label}</p>
    </div>
  );
}

// ── Feature Highlight Card ─────────────────────────────────────────────────
function FeatureHighlight({ icon: Icon, title, desc, color }: { icon: any; title: string; desc: string; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="font-bold text-sm text-black dark:text-white mb-1">{title}</p>
        <p className="text-xs text-black/50 dark:text-white/50 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function TemplateDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { lang, dir } = useI18n();
  const L = lang === "ar";

  const [activePreviewPage, setActivePreviewPage] = useState<CafePage | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activePortalTab, setActivePortalTab] = useState<"public" | "auth" | "employee" | "manager" | "driver">("public");

  const { data: template, isLoading, isError } = useQuery<SectorTemplate>({
    queryKey: ["/api/templates/slug", slug],
    queryFn: () => fetch(`/api/templates/slug/${slug}`).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    enabled: !!slug,
  });

  const isRestaurant = template?.category === "restaurant" || template?.category === "food" || template?.slug === "cafe-restaurant";
  const baseUrl = template?.demoUrl?.replace(/\/$/, "") || (isRestaurant ? "https://cafe.qiroxstudio.online" : "");
  const color = template?.heroColor || (isRestaurant ? "#b45309" : "#0f172a");
  const tier = template?.tier ? TIER_META[template.tier] : null;
  const videoEmbed = template?.howToUseVideoUrl ? getVideoEmbed(template.howToUseVideoUrl) : null;
  const isDirectVideo = template?.howToUseVideoUrl && !videoEmbed && !template.howToUseVideoUrl.includes("youtube") && !template.howToUseVideoUrl.includes("vimeo");

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const ALL_PORTAL_PAGES: Record<string, { pages: CafePage[]; label: string; loginPath: string }> = {
    public:   { pages: CAFE_PUBLIC_PAGES,   label: "صفحات عامة",          loginPath: "" },
    auth:     { pages: CAFE_AUTH_PAGES,     label: "تسجيل الدخول",        loginPath: "/auth" },
    employee: { pages: CAFE_EMPLOYEE_PAGES, label: "بوابة الموظفين",      loginPath: "/employee/login" },
    manager:  { pages: CAFE_MANAGER_PAGES,  label: "بوابة المديرين",      loginPath: "/manager" },
    driver:   { pages: CAFE_DRIVER_PAGES,   label: "بوابة السائقين",      loginPath: "/driver/login" },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] dark:bg-gray-950" dir={dir}>
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-black/20 dark:text-white/20" />
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !template) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] dark:bg-gray-950" dir={dir}>
        <Navigation />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Globe className="w-16 h-16 text-black/10 dark:text-white/10" />
          <p className="text-black/40 dark:text-white/40 font-bold text-xl">النموذج غير موجود</p>
          <Link href="/demos">
            <Button variant="outline" className="gap-2">
              <ChevronLeft className="w-4 h-4" /> العودة للنماذج
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f4f2] dark:bg-gray-950" dir={dir}>
      <Navigation />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden pt-24 pb-20" style={{ backgroundColor: color }}>
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        {/* Diagonal overlay */}
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${color}00 40%, #00000066 100%)` }} />
        {/* Glow blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: color, filter: "brightness(1.8) blur(80px)" }} />

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-10">
            <Link href="/demos">
              <button className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm font-medium" data-testid="btn-back-to-demos">
                <ChevronLeft className="w-4 h-4" /> النماذج
              </button>
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-white/70 text-sm font-medium">{L ? template.nameAr : (template.name || template.nameAr)}</span>
          </div>

          <div className="flex flex-col lg:flex-row items-start gap-10">
            <div className="flex-1">
              {/* Status pill */}
              {template.status === "active" && (
                <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-1.5 bg-green-400/20 border border-green-400/30 text-green-300 text-xs font-bold px-3 py-1 rounded-full mb-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  متاح الآن — تجربة حية
                </motion.span>
              )}

              <motion.h1
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight"
              >
                {L ? template.nameAr : (template.name || template.nameAr)}
              </motion.h1>

              {isRestaurant && (
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  className="text-white/40 text-base mb-3 font-medium">Cafe & Restaurant Management System</motion.p>
              )}

              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="text-white/60 text-base leading-relaxed mb-8 max-w-xl">
                {template.descriptionAr || template.description}
              </motion.p>

              {/* Tier */}
              {tier && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${tier.bg} ${tier.border} mb-6`}>
                  <Package className={`w-4 h-4 ${tier.color}`} />
                  <span className={`text-sm font-black ${tier.color}`}>باقة {tier.label}</span>
                  <span className="text-xs text-black/50 hidden sm:inline">{tier.desc}</span>
                </motion.div>
              )}

              {/* CTA Buttons */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="flex flex-wrap items-center gap-3">
                {template.demoUrl && template.status === "active" && (
                  <a href={template.demoUrl} target="_blank" rel="noopener noreferrer" data-testid="btn-open-demo">
                    <Button className="h-12 px-7 rounded-2xl font-bold gap-2 bg-white text-black hover:bg-white/90 text-sm">
                      <Globe className="w-4 h-4" /> فتح الديمو الحي
                      <ExternalLink className="w-3.5 h-3.5 opacity-40" />
                    </Button>
                  </a>
                )}
                <Link href={`/order?template=${template.slug}`}>
                  <Button variant="outline" className="h-12 px-7 rounded-2xl font-bold gap-2 border-white/20 text-white hover:bg-white/10 text-sm" data-testid="btn-order-template">
                    <ArrowRight className="w-4 h-4" /> ابدأ مشروعك
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* Stats */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
              className="flex flex-row lg:flex-col gap-3 flex-wrap lg:flex-nowrap">
              {isRestaurant && (
                <>
                  <StatBadge value="75+" label="صفحة متاحة" icon={Layers} />
                  <StatBadge value="6" label="بوابات دخول" icon={Lock} />
                  <StatBadge value="فورية" label="تحديثات مباشرة" icon={Zap} />
                </>
              )}
              {!isRestaurant && template.featuresAr && (
                <StatBadge value={template.featuresAr.length} label="ميزة مدمجة" icon={Zap} />
              )}
              {template.estimatedDuration && (
                <StatBadge value={template.estimatedDuration} label="مدة التسليم" icon={Star} />
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Restaurant-specific Enhanced Content ────────────────── */}
      {isRestaurant && (
        <div className="max-w-6xl mx-auto px-6 py-14 space-y-16">

          {/* ── System Capabilities Row ──────────────────────────── */}
          <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="text-center mb-10">
              <p className="text-xs font-bold text-black/30 dark:text-white/30 uppercase tracking-widest mb-2">ما يقدمه هذا النظام</p>
              <h2 className="text-3xl font-black text-black dark:text-white">نظام متكامل من الطلب حتى التوصيل</h2>
              <p className="text-black/40 dark:text-white/40 mt-2 text-sm max-w-xl mx-auto">كل ما يحتاجه الكافيه والمطعم في منظومة واحدة — من إدارة القائمة والطلبات حتى المحاسبة والمخزون والموظفين.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FeatureHighlight icon={UtensilsCrossed} title="إدارة القائمة والطلبات" desc="قائمة رقمية تفاعلية مع تخصيص المنتجات والإضافات وإدارة الطلبات في الوقت الفعلي." color="bg-orange-500" />
              <FeatureHighlight icon={QrCode} title="نظام الطاولات وQR" desc="يمسح العميل رمز QR على الطاولة فيطلب مباشرة بدون الحاجة لنادل — تحديث فوري للمطبخ." color="bg-amber-500" />
              <FeatureHighlight icon={CreditCard} title="دفع متعدد القنوات" desc="بطاقة، نقداً، Apple Pay، بطاقة الولاء — مع دعم نظام Geidea وفوترة ZATCA." color="bg-emerald-600" />
              <FeatureHighlight icon={ChefHat} title="شاشة المطبخ KDS" desc="عرض الطلبات للمطبخ بالترتيب مع تنبيه صوتي وتحديث الحالة بضغطة واحدة." color="bg-red-500" />
              <FeatureHighlight icon={Heart} title="برنامج الولاء والنقاط" desc="مستويات عضوية (برونزي، فضي، ذهبي، بلاتيني) مع بطاقة رقمية وبرنامج إحالة." color="bg-pink-500" />
              <FeatureHighlight icon={BarChart3} title="تقارير وتحليلات ذكية" desc="لوحة تحكم تنفيذية بمؤشرات الأداء والمخزون والحضور وتقارير قابلة للتصدير." color="bg-violet-600" />
              <FeatureHighlight icon={Truck} title="إدارة التوصيل والسائقين" desc="تتبع طلبات التوصيل بالخريطة — تعيين السائقين وتتبع موقعهم في الوقت الفعلي." color="bg-sky-500" />
              <FeatureHighlight icon={Calendar} title="حجز الطاولات المسبق" desc="العميل يحجز الطاولة بالتاريخ والوقت والعدد — بدون اتصال هاتفي." color="bg-teal-500" />
              <FeatureHighlight icon={Users} title="إدارة الموظفين والرواتب" desc="شيفتات، حضور، إجازات، رواتب تلقائية — دارة كاملة للموارد البشرية." color="bg-indigo-500" />
            </div>
          </motion.section>

          {/* ── Live Interactive Browser ──────────────────────────── */}
          <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color }}>
                <Globe className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-black dark:text-white">استعرض النظام مباشرة</h2>
                <p className="text-xs text-black/40 dark:text-white/40">جرّب كل صفحة من داخل هذه الصفحة — اضغط أي صفحة في القائمة أدناه</p>
              </div>
            </div>

            {/* Page pill tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
              {CAFE_PUBLIC_PAGES.slice(0, 6).map(pg => (
                <button
                  key={pg.path}
                  onClick={() => setActivePreviewPage(pg)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all border ${
                    activePreviewPage?.path === pg.path
                      ? "border-transparent text-white shadow-sm"
                      : "border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-gray-900 text-black/60 dark:text-white/60 hover:border-orange-300 hover:text-orange-700"
                  }`}
                  style={activePreviewPage?.path === pg.path ? { backgroundColor: color } : {}}
                  data-testid={`tab-preview-${pg.path.replace(/\//g, "-")}`}
                >
                  <pg.icon className="w-3.5 h-3.5" />
                  {pg.titleAr}
                </button>
              ))}
            </div>

            <BrowserFrame
              url={activePreviewPage ? `${baseUrl}${activePreviewPage.path}` : baseUrl}
              label={activePreviewPage?.titleAr || "الصفحة الرئيسية"}
              page={activePreviewPage ?? undefined}
            />

            {activePreviewPage && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="mt-4 bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-5 flex items-start gap-4"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + "20" }}>
                  <activePreviewPage.icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-black text-black dark:text-white">{activePreviewPage.titleAr}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activePreviewPage.badgeColor}`}>{activePreviewPage.badge}</span>
                  </div>
                  <p className="text-sm text-black/60 dark:text-white/60 leading-relaxed">{activePreviewPage.descAr}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <code className="text-xs text-black/30 font-mono bg-black/[0.04] px-2 py-1 rounded-lg" dir="ltr">{baseUrl}{activePreviewPage.path}</code>
                    <a href={`${baseUrl}${activePreviewPage.path}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-bold hover:opacity-70 transition-opacity" style={{ color }}>
                      <ExternalLink className="w-3 h-3" /> فتح
                    </a>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.section>

          {/* ── Pages Showcase ────────────────────────────────────── */}
          <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            {/* Tab navigation */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-black text-black dark:text-white">دليل صفحات النظام الكامل</h2>
                <p className="text-xs text-black/40 dark:text-white/40">تصفح جميع الصفحات حسب البوابة</p>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {(Object.entries(ALL_PORTAL_PAGES) as Array<[typeof activePortalTab, typeof ALL_PORTAL_PAGES[string]]>).map(([key, meta]) => (
                  <button
                    key={key}
                    onClick={() => setActivePortalTab(key)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                      activePortalTab === key
                        ? "border-transparent text-white shadow-sm"
                        : "border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-gray-900 text-black/60 dark:text-white/60 hover:border-black/20"
                    }`}
                    style={activePortalTab === key ? { backgroundColor: color } : {}}
                    data-testid={`tab-portal-${key}`}
                  >
                    {meta.label}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activePortalTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {ALL_PORTAL_PAGES[activePortalTab].pages.map((page, i) => (
                  <PageCard
                    key={page.path}
                    page={page}
                    baseUrl={baseUrl}
                    index={i}
                    onPreview={(pg) => {
                      setActivePreviewPage(pg);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          </motion.section>

          {/* ── Portals Access & Credentials ─────────────────────── */}
          <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color }}>
                <ShieldCheck className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-black dark:text-white">بيانات الدخول التجريبية</h2>
                <p className="text-xs text-black/40 dark:text-white/40">استخدم هذه البيانات لاستعراض كل البوابات بصلاحياتها المختلفة</p>
              </div>
            </div>

            <div className="space-y-3">
              {CAFE_PORTALS.map((portal, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`${portal.bg} border border-black/[0.06] rounded-2xl p-4`}
                  data-testid={`portal-credential-${i}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Role */}
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-black/[0.06] flex items-center justify-center flex-shrink-0">
                        <portal.icon className={`w-5 h-5 ${portal.color}`} />
                      </div>
                      <p className={`font-black text-sm ${portal.color}`}>{portal.role}</p>
                    </div>

                    {/* Credentials */}
                    <div className="flex flex-wrap gap-3 flex-1">
                      {/* Username */}
                      <div className="bg-white rounded-xl px-3 py-2 flex items-center gap-2 border border-black/[0.06] min-w-[140px]">
                        <div className="text-[10px] text-black/30 font-bold whitespace-nowrap">اسم المستخدم</div>
                        <code className="text-xs font-mono font-bold text-black/80" dir="ltr">{portal.username}</code>
                        <button
                          onClick={() => copyToClipboard(portal.username, `user-${i}`)}
                          className="text-black/20 hover:text-black/60 transition-colors mr-auto"
                          data-testid={`btn-copy-user-${i}`}
                        >
                          {copiedField === `user-${i}` ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {/* Password */}
                      <div className="bg-white rounded-xl px-3 py-2 flex items-center gap-2 border border-black/[0.06] min-w-[140px]">
                        <div className="text-[10px] text-black/30 font-bold whitespace-nowrap">كلمة المرور</div>
                        <code className="text-xs font-mono font-bold text-black/80" dir="ltr">{portal.password}</code>
                        <button
                          onClick={() => copyToClipboard(portal.password, `pass-${i}`)}
                          className="text-black/20 hover:text-black/60 transition-colors mr-auto"
                          data-testid={`btn-copy-pass-${i}`}
                        >
                          {copiedField === `pass-${i}` ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Access info */}
                    <div className="hidden lg:block text-xs text-black/40 max-w-[200px] leading-relaxed">{portal.access}</div>
                  </div>

                  {/* Access info mobile */}
                  <p className="text-xs text-black/40 mt-2 leading-relaxed lg:hidden">{portal.access}</p>
                </motion.div>
              ))}
            </div>

            {/* Portal links */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "بوابة العملاء", path: "/auth", icon: User, color: "bg-orange-500" },
                { label: "بوابة الموظفين", path: "/employee/login", icon: Users, color: "bg-emerald-600" },
                { label: "بوابة المديرين", path: "/manager", icon: LayoutDashboard, color: "bg-violet-600" },
                { label: "بوابة السائقين", path: "/driver/login", icon: Truck, color: "bg-sky-500" },
              ].map((p, i) => (
                <a
                  key={i}
                  href={`${baseUrl}${p.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-3 hover:shadow-md hover:-translate-y-0.5 transition-all group"
                  data-testid={`btn-portal-link-${i}`}
                >
                  <div className={`w-9 h-9 rounded-xl ${p.color} flex items-center justify-center flex-shrink-0`}>
                    <p.icon className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-black dark:text-white leading-none mb-0.5">{p.label}</p>
                    <code className="text-[10px] text-black/30 font-mono truncate block" dir="ltr">{p.path}</code>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-black/20 group-hover:text-black/50 mr-auto flex-shrink-0 transition-colors" />
                </a>
              ))}
            </div>
          </motion.section>

        </div>
      )}

      {/* ── Generic Content (for all templates) ─────────────────── */}
      <div className="max-w-6xl mx-auto px-6 pb-14 space-y-10">

        {/* Demo Video */}
        {(videoEmbed || isDirectVideo) && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color }}>
                <Video className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-black dark:text-white">فيديو تعريفي</h2>
                <p className="text-xs text-black/40 dark:text-white/40">شاهد النظام في العمل</p>
              </div>
            </div>
            <div className="rounded-3xl overflow-hidden border border-black/[0.06] dark:border-white/[0.06] shadow-xl bg-black aspect-video">
              {videoEmbed ? (
                <iframe src={videoEmbed} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" data-testid="iframe-demo-video" />
              ) : (
                <video src={template.howToUseVideoUrl} controls className="w-full h-full" data-testid="video-demo" />
              )}
            </div>
          </motion.section>
        )}

        {/* How to Use */}
        {template.howToUseAr && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color }}>
                <BookOpen className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-black dark:text-white">طريقة الاستخدام</h2>
                <p className="text-xs text-black/40 dark:text-white/40">دليل استخدام النظام خطوة بخطوة</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-3xl p-6">
              <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-black/70 dark:text-white/70 whitespace-pre-line">
                {template.howToUseAr}
              </div>
            </div>
          </motion.section>
        )}

        {/* Tier */}
        {tier && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className={`border-2 ${tier.border} ${tier.bg} rounded-3xl p-6 flex items-center gap-5`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-white shadow-sm border ${tier.border}`}>
                <Package className={`w-8 h-8 ${tier.color}`} />
              </div>
              <div>
                <p className={`text-2xl font-black ${tier.color}`}>باقة {tier.label}</p>
                <p className="text-sm text-black/50 mt-1">{tier.desc}</p>
                <Link href="/pricing">
                  <button className={`mt-2 text-xs font-bold ${tier.color} flex items-center gap-1 hover:underline`} data-testid="btn-view-pricing">
                    عرض الأسعار والمقارنة <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>
            </div>
          </motion.section>
        )}

        {/* Demo Website (generic non-restaurant) */}
        {!isRestaurant && template.demoUrl && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color }}>
                <Globe className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-black dark:text-white">موقع الديمو</h2>
                <p className="text-xs text-black/40 dark:text-white/40">جرّب النظام مباشرة</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-3xl p-6">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-black dark:text-white">رابط الديمو الحي</p>
                    <p className="text-xs text-black/40 dark:text-white/40 truncate">{template.demoUrl}</p>
                  </div>
                </div>
                <a href={template.demoUrl} target="_blank" rel="noopener noreferrer" data-testid="btn-open-demo-link">
                  <Button className="h-10 px-5 rounded-xl gap-2 font-bold" style={{ backgroundColor: color }}>
                    <Play className="w-3.5 h-3.5" /> فتح الديمو <ExternalLink className="w-3 h-3 opacity-70" />
                  </Button>
                </a>
              </div>
              <div className="rounded-2xl overflow-hidden border border-black/[0.06] dark:border-white/[0.06] h-64 bg-gray-50 dark:bg-gray-800">
                <iframe src={template.demoUrl} className="w-full h-full" sandbox="allow-scripts allow-same-origin allow-forms" data-testid="iframe-demo-preview" title="demo preview" />
              </div>
            </div>
          </motion.section>
        )}

        {/* Files */}
        {template.templateFiles && template.templateFiles.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color }}>
                <Download className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-black dark:text-white">الملفات والموارد</h2>
                <p className="text-xs text-black/40 dark:text-white/40">{template.templateFiles.length} ملف متاح للتحميل</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-3xl overflow-hidden divide-y divide-black/[0.05] dark:divide-white/[0.05]">
              {template.templateFiles.map((file, i) => (
                <div key={i} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors" data-testid={`file-item-${i}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-black/40 dark:text-white/40" />
                    </div>
                    <p className="text-sm font-bold text-black dark:text-white truncate">{L ? file.nameAr : (file.name || file.nameAr)}</p>
                  </div>
                  {file.url && (
                    <a href={file.url} target="_blank" rel="noopener noreferrer" download data-testid={`btn-download-file-${i}`}>
                      <Button variant="outline" size="sm" className="h-8 px-3 rounded-xl gap-1.5 text-xs font-bold flex-shrink-0">
                        <Download className="w-3.5 h-3.5" /> تحميل
                      </Button>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Features */}
        {template.featuresAr && template.featuresAr.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color }}>
                <Zap className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-black dark:text-white">مميزات النظام</h2>
                <p className="text-xs text-black/40 dark:text-white/40">{template.featuresAr.length} ميزة مدمجة</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-3xl p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {template.featuresAr.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 py-1" data-testid={`feature-item-${i}`}>
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-black/70 dark:text-white/70">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* Feature Details */}
        {template.featuresDetails && template.featuresDetails.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color }}>
                <BookOpen className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-black dark:text-white">دليل المميزات التفصيلي</h2>
                <p className="text-xs text-black/40 dark:text-white/40">شرح كامل لكل ميزة في النظام</p>
              </div>
            </div>
            <div className="space-y-3">
              {template.featuresDetails.map((fd, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{fd.icon || "✨"}</span>
                    <div>
                      <p className="font-bold text-sm text-black dark:text-white">{fd.titleAr}</p>
                      {fd.descAr && (
                        <p className="text-xs text-black/50 dark:text-white/50 mt-1 leading-relaxed">{fd.descAr}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="relative rounded-3xl p-10 text-center overflow-hidden" style={{ backgroundColor: color }}>
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: "white" }} />
          <div className="relative z-10">
            <Star className="w-10 h-10 text-white/50 mx-auto mb-4" />
            <h3 className="text-3xl font-black text-white mb-3">أعجبك هذا النظام؟</h3>
            <p className="text-white/50 text-sm mb-8 max-w-md mx-auto">ابدأ مشروعك الآن وسيتولى فريقنا تهيئة النظام وتخصيصه لكافيهك أو مطعمك خلال أيام.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/order?template=${template.slug}`}>
                <Button className="h-12 px-9 rounded-2xl bg-white text-black hover:bg-white/90 font-bold text-sm gap-2" data-testid="btn-start-order-cta">
                  <ArrowRight className="w-5 h-5" /> ابدأ مشروعك الآن
                </Button>
              </Link>
              <Link href="/demos">
                <Button variant="outline" className="h-12 px-9 rounded-2xl border-white/20 text-white hover:bg-white/10 font-bold text-sm">
                  استعرض نماذج أخرى
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

      </div>

      <Footer />
    </div>
  );
}
