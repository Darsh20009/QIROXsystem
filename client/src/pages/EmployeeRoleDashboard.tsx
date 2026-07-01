import { useUser } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { Link } from "wouter";
import {
  Package, CheckCircle2, Clock, AlertCircle, Loader2,
  DollarSign, TrendingUp, Wrench, Code2, ShieldCheck, BarChart3,
  Palette, Upload, FileText, Users, Activity, Banknote, Target,
  ChevronRight, Star, Zap, Globe, Wand2, Video, Calendar,
  ShoppingCart, Phone, MessageCircle, Megaphone, Building2,
  Newspaper, ShoppingBag, PlusCircle, FileCheck, LayoutDashboard,
  ClipboardList, CalendarDays, Cpu, ArrowRight, Sparkles,
  Receipt, BarChart2, UserCheck, Headphones, BookOpen,
  CloudUpload, TrendingDown, RefreshCw,
} from "lucide-react";

function fade(delay = 0) {
  return { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, delay } };
}

/* ── Shared: Stat Card ── */
function StatCard({
  label, value, icon: Icon, accent = "bg-black/[0.05] dark:bg-white/[0.07]", textAccent = "text-black dark:text-white", delay = 0
}: {
  label: string; value: number | string; icon: React.ElementType;
  accent?: string; textAccent?: string; delay?: number;
}) {
  return (
    <motion.div {...fade(delay)}>
      <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
          <Icon className={`w-5 h-5 ${textAccent}`} />
        </div>
        <div>
          <p className="text-xl font-black text-black dark:text-white leading-none">{value}</p>
          <p className="text-[11px] text-black/40 dark:text-white/40 mt-0.5">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Shared: Action Card ── */
function ActionCard({ icon: Icon, label, desc, href, delay = 0, accent = "" }: {
  icon: React.ElementType; label: string; desc: string; href: string; delay?: number; accent?: string;
}) {
  return (
    <motion.div {...fade(delay)}>
      <Link href={href}>
        <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group h-full">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${accent || "bg-black/[0.04] dark:bg-white/[0.06]"}`}>
            <Icon className="w-5 h-5 text-black dark:text-white" />
          </div>
          <p className="font-bold text-sm text-black dark:text-white leading-tight">{label}</p>
          <p className="text-[11px] text-black/35 dark:text-white/35 mt-0.5">{desc}</p>
        </div>
      </Link>
    </motion.div>
  );
}

/* ── Shared: Hero Header ── */
function RoleHero({
  icon: Icon, titleAr, titleEn, subtitleAr, subtitleEn, gradient, L
}: {
  icon: React.ElementType; titleAr: string; titleEn: string;
  subtitleAr: string; subtitleEn: string; gradient: string; L: boolean;
}) {
  return (
    <motion.div {...fade(0)} className={`${gradient} rounded-3xl p-6 text-white relative overflow-hidden mb-5`}>
      <div className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "22px 22px" }} />
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-12 translate-x-12 pointer-events-none" />
      <div className="relative z-10 flex items-center gap-4">
        <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black leading-tight">{L ? titleAr : titleEn}</h1>
          <p className="text-white/50 text-sm mt-0.5">{L ? subtitleAr : subtitleEn}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Scrolling Posts Banner ── */
const ALL_POSTS = [
  { src: "/post-1.png",  text: "مصنع الأنظمة الرقمية — نبني أنظمة احترافية لكل قطاع" },
  { src: "/post-2.png",  text: "شريكك الموثوق في رحلة التحول الرقمي" },
  { src: "/post-3.png",  text: "من فكرة بسيطة إلى نظام متكامل — مع كيروكس" },
  { src: "/post-4.png",  text: "تصاميم عصرية وأداء سريع لكل مشروع" },
  { src: "/post-5.png",  text: "كيروكس — حيث تلتقي التكنولوجيا بنمو الأعمال" },
  { src: "/post-6.png",  text: "خدمة متكاملة من التصميم حتى الإطلاق" },
];

function QiroxPostsBanner() {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-6 mb-2">
      <div className="flex items-center gap-2.5 mb-3 px-1">
        <img src="/qirox-icon-nobg.png" alt="Q" className="w-5 h-5 object-contain opacity-60 dark:invert" />
        <span className="text-[11px] font-black text-black/35 dark:text-white/30 tracking-[0.15em] uppercase">Qirox · Social Feed</span>
        <div className="flex-1 h-px bg-black/[0.06] dark:bg-white/[0.06]" />
      </div>
      <div className="overflow-hidden rounded-2xl" style={{ maskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)" }}>
        <div className="flex gap-3 qirox-scroll-strip">
          {[...ALL_POSTS, ...ALL_POSTS].map((p, i) => (
            <div key={i} className="flex-shrink-0 flex items-center gap-3 bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.07] rounded-2xl p-2.5" style={{ width: 240 }}>
              <div className="w-14 h-14 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
                <img src={p.src} alt="" className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 dark:text-white/85 leading-snug line-clamp-3">{p.text}</p>
                <p className="text-[10px] text-black/30 dark:text-white/25 mt-1 font-medium">@qirox.sa</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ── QI AGENT Promo Card ── */
function QiAgentPromo({ L }: { L: boolean }) {
  return (
    <motion.div {...fade(0.3)}>
      <Link href="/employee/studio">
        <div className="bg-gradient-to-br from-[#0c0815] to-[#150d2e] border border-violet-500/20 rounded-2xl p-5 cursor-pointer hover:border-violet-500/40 transition-all group relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, violet 1px, transparent 0)", backgroundSize: "24px 24px" }} />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform overflow-hidden">
              <img src="/qirox-icon-nobg.png" alt="QIROX" className="w-8 h-8 object-contain" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-black text-white">QIROX Studio AI</p>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/20">QIROX AI</span>
              </div>
              <p className="text-xs text-white/40">{L ? "مساعد إبداعي متطور — رؤية الصور · توليد التصاميم · الكود" : "Advanced creative AI — Vision · Design · Code"}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-violet-400/60 group-hover:text-violet-400 transition-colors" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ── My Tools Card ── */
function MyToolsCard({ L }: { L: boolean }) {
  return (
    <motion.div {...fade(0.35)}>
      <Link href="/my-tools">
        <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all group flex items-center gap-4">
          <div className="w-11 h-11 bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Wand2 className="w-5 h-5 text-black dark:text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-black dark:text-white text-sm">{L ? "أدواتي ومميزاتي ⚡" : "My Tools & Features ⚡"}</p>
            <p className="text-[11px] text-black/35 dark:text-white/35">{L ? "أدوات PDF والتقنية والاختصارات" : "PDF, technical tools and shortcuts"}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-black/20 dark:text-white/20" />
        </div>
      </Link>
    </motion.div>
  );
}

/* ── My Finance Card ── */
function MyFinanceCard({ L }: { L: boolean }) {
  return (
    <motion.div {...fade(0.38)}>
      <Link href="/employee/my-finance">
        <div className="bg-gradient-to-l from-amber-50 to-orange-50 dark:from-amber-900/15 dark:to-orange-900/15 border border-amber-200/60 dark:border-amber-700/30 rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all group flex items-center gap-4">
          <div className="w-11 h-11 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
            <Banknote className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-black dark:text-white text-sm">{L ? "حقي المالي 💰" : "My Financials 💰"}</p>
            <p className="text-[11px] text-black/35 dark:text-white/35">{L ? "راتبي وكشف الرواتب الشهري" : "My salary and monthly payroll"}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400/60 dark:text-amber-500/40" />
        </div>
      </Link>
    </motion.div>
  );
}

/* ── Upcoming Meetings Widget ── */
function UpcomingMeetingsWidget() {
  const { lang } = useI18n();
  const L = lang === "ar";
  const { data: meetings } = useQuery<any[]>({ queryKey: ["/api/qmeet/meetings"] });
  const now = new Date();
  const upcoming = meetings?.filter((m: any) => new Date(m.scheduledAt) > now).slice(0, 3) || [];
  if (!upcoming.length) return null;
  return (
    <motion.div {...fade(0.25)}>
      <div className="flex items-center gap-2 mb-2.5 px-1">
        <Video className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
        <span className="text-[11px] font-black text-black/35 dark:text-white/30 uppercase tracking-wider">{L ? "الاجتماعات القادمة" : "Upcoming Meetings"}</span>
      </div>
      <div className="space-y-2">
        {upcoming.map((m: any) => (
          <div key={m._id || m.id} className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl flex items-center justify-center flex-shrink-0">
              <Video className="w-3.5 h-3.5 text-black/50 dark:text-white/50" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-black dark:text-white truncate">{m.title}</p>
              <p className="text-[10px] text-black/35 dark:text-white/35">{new Date(m.scheduledAt).toLocaleDateString(L ? "ar" : "en", { weekday: "short", hour: "2-digit", minute: "2-digit" })}</p>
            </div>
            <Link href="/admin/qmeet"><Button size="sm" variant="outline" className="text-[11px] px-2.5 h-7 border-black/10 dark:border-white/10">{L ? "دخول" : "Join"}</Button></Link>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─────────────────────── DEVELOPER DASHBOARD ─────────────────────── */
function DeveloperDashboard() {
  const { lang } = useI18n();
  const L = lang === "ar";
  const { data: modRequests } = useQuery<any[]>({ queryKey: ["/api/modification-requests"] });

  const pending = modRequests?.filter(m => ["pending", "in_review"].includes(m.status)) || [];
  const inProgress = modRequests?.filter(m => m.status === "in_progress") || [];
  const done = modRequests?.filter(m => m.status === "completed") || [];

  const actions = [
    { icon: Sparkles,    label: L ? "Studio AI"         : "Studio AI",         desc: L ? "مساعد إبداعي متطور — QIROX AI"   : "Advanced creative AI — QIROX AI",      href: "/employee/studio",             accent: "bg-gradient-to-br from-violet-500/20 to-purple-600/20" },
    { icon: Code2,       label: L ? "System Builder"     : "System Builder",     desc: L ? "بيئة تطوير السحابة"             : "Cloud IDE",                         href: "/employee/system-builder",     accent: "" },
    { icon: Globe,       label: L ? "دليل القطاعات"      : "Sector Guide",       desc: L ? "10 قطاعات تقنية"               : "10 technical sectors",              href: "/employee/sector-guide",       accent: "" },
    { icon: CloudUpload, label: L ? "نشر المشاريع"        : "Deployment Cloud",   desc: L ? "نشر وإدارة المشاريع"           : "Deploy & manage projects",          href: "/employee/deployment-cloud",   accent: "" },
    { icon: Wrench,      label: L ? "طلبات التعديل"      : "Mod Requests",       desc: L ? "المهام المُعيّنة لك"           : "Your assigned tasks",               href: "/admin/mod-requests",          accent: "" },
    { icon: ShieldCheck, label: L ? "قائمة مهامي"        : "My Checklist",       desc: L ? "المهام اليومية التقنية"        : "Daily technical tasks",             href: "/employee/checklist",          accent: "" },
  ];

  return (
    <div className="space-y-5 p-5">
      <RoleHero
        icon={Code2}
        titleAr="لوحة المطوّر" titleEn="Developer Dashboard"
        subtitleAr="مهامك التقنية وطلبات التعديل المعيّنة لك"
        subtitleEn="Your technical tasks and assigned modification requests"
        gradient="bg-gradient-to-br from-blue-700 to-indigo-900"
        L={L}
      />

      <div className="grid grid-cols-3 gap-3">
        <StatCard label={L ? "انتظار المراجعة" : "Awaiting Review"} value={pending.length} icon={Clock} delay={0.05} />
        <StatCard label={L ? "قيد التنفيذ" : "In Progress"}          value={inProgress.length} icon={Activity} delay={0.08} />
        <StatCard label={L ? "مكتملة" : "Completed"}                 value={done.length} icon={CheckCircle2} delay={0.11} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {actions.map((a, i) => <ActionCard key={i} {...a} delay={0.1 + i * 0.04} />)}
      </div>

      <QiAgentPromo L={L} />

      {[...pending, ...inProgress].length > 0 && (
        <motion.div {...fade(0.3)}>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-[11px] font-black text-black/35 dark:text-white/30 uppercase tracking-wider flex items-center gap-2">
              <Wrench className="w-3.5 h-3.5" />{L ? "طلبات التعديل المعلّقة" : "Pending Mod Requests"}
            </h2>
            <Link href="/admin/mod-requests">
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-black/40 h-7">{L ? "عرض الكل" : "View All"} <ChevronRight className="w-3 h-3" /></Button>
            </Link>
          </div>
          <div className="space-y-2">
            {[...pending, ...inProgress].slice(0, 5).map((mod: any) => (
              <div key={mod.id} className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/[0.05] dark:bg-white/[0.07] font-bold text-black/60 dark:text-white/60">#{mod.id?.toString().slice(-5)}</span>
                    <Badge variant="outline" className="text-[9px] h-4 border-black/10 dark:border-white/10">{mod.status}</Badge>
                  </div>
                  <p className="font-semibold text-black dark:text-white text-sm">{mod.title || (L ? "طلب تعديل" : "Modification Request")}</p>
                </div>
                <Link href="/admin/mod-requests"><Button size="sm" variant="outline" className="text-xs border-black/10 dark:border-white/10">{L ? "فتح" : "Open"}</Button></Link>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <UpcomingMeetingsWidget />
      <MyFinanceCard L={L} />
      <QiroxPostsBanner />
      <MyToolsCard L={L} />
    </div>
  );
}

/* ─────────────────────── DESIGNER DASHBOARD ─────────────────────── */
function DesignerDashboard() {
  const { lang } = useI18n();
  const L = lang === "ar";
  const { data: modRequests } = useQuery<any[]>({ queryKey: ["/api/modification-requests"] });

  const myTasks = modRequests?.filter(m => ["pending", "in_review", "in_progress"].includes(m.status)) || [];
  const done = modRequests?.filter(m => m.status === "completed") || [];

  const actions = [
    { icon: Palette,    label: L ? "أدوات التصميم"   : "Design Tools",   desc: L ? "قوالب وأدوات مرئية"  : "Templates & visual tools",  href: "/sales/marketing",           accent: "" },
    { icon: Globe,      label: L ? "دليل القطاعات"    : "Sector Guide",   desc: L ? "10 قطاعات تقنية"     : "10 technical sectors",     href: "/employee/sector-guide",     accent: "" },
    { icon: Wrench,     label: L ? "طلبات التعديل"    : "Mod Requests",   desc: L ? "المهام المُعيّنة لك" : "Your assigned tasks",       href: "/admin/mod-requests",        accent: "" },
    { icon: Upload,     label: L ? "رفع التصاميم"     : "Upload Designs", desc: L ? "رفع المواد الإبداعية" : "Upload creative materials", href: "/admin/mod-requests",        accent: "" },
    { icon: ShieldCheck,label: L ? "قائمة مهامي"      : "My Checklist",   desc: L ? "المهام اليومية"      : "Daily tasks",               href: "/employee/checklist",        accent: "" },
    { icon: Wand2,      label: L ? "أدواتي"           : "My Tools",       desc: L ? "اختصارات وأدوات PDF" : "PDF & shortcut tools",      href: "/my-tools",                  accent: "" },
  ];

  return (
    <div className="space-y-5 p-5">
      <RoleHero
        icon={Palette}
        titleAr="لوحة المصمم" titleEn="Designer Dashboard"
        subtitleAr="مهامك التصميمية وطلبات التعديل"
        subtitleEn="Your design tasks and modification requests"
        gradient="bg-gradient-to-br from-purple-700 to-pink-800"
        L={L}
      />

      <div className="grid grid-cols-2 gap-3">
        <StatCard label={L ? "مهام نشطة" : "Active Tasks"}  value={myTasks.length} icon={Activity} delay={0.05} />
        <StatCard label={L ? "مكتملة"    : "Completed"}      value={done.length}    icon={CheckCircle2} delay={0.08} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {actions.map((a, i) => <ActionCard key={i} {...a} delay={0.1 + i * 0.04} />)}
      </div>

      {myTasks.length > 0 && (
        <motion.div {...fade(0.3)}>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-[11px] font-black text-black/35 dark:text-white/30 uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-3.5 h-3.5" />{L ? "مهامي التصميمية" : "My Design Tasks"}
            </h2>
            <Link href="/admin/mod-requests"><Button variant="ghost" size="sm" className="text-xs gap-1 text-black/40 h-7">{L ? "الكل" : "All"} <ChevronRight className="w-3 h-3" /></Button></Link>
          </div>
          <div className="space-y-2">
            {myTasks.slice(0, 5).map((mod: any) => (
              <div key={mod.id} className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-black dark:text-white">{mod.title || (L ? "مهمة تصميمية" : "Design Task")}</p>
                  <Badge variant="outline" className="text-[9px] mt-1 h-4 border-black/10 dark:border-white/10">{mod.status}</Badge>
                </div>
                <Link href="/admin/mod-requests"><Button size="sm" variant="outline" className="text-xs border-black/10 dark:border-white/10">{L ? "فتح" : "Open"}</Button></Link>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <UpcomingMeetingsWidget />
      <MyFinanceCard L={L} />
      <QiroxPostsBanner />
      <MyToolsCard L={L} />
    </div>
  );
}

/* ─────────────────────── SALES DASHBOARD ─────────────────────── */
function SalesDashboard() {
  const { lang } = useI18n();
  const L = lang === "ar";
  const { data: orders } = useQuery<any[]>({ queryKey: ["/api/admin/orders"] });
  const { data: customers } = useQuery<any[]>({ queryKey: ["/api/admin/customers"] });
  const { data: quotations } = useQuery<any[]>({ queryKey: ["/api/quotations"] });
  const { data: user } = useUser();
  const role = (user as any)?.role;

  const now = new Date();
  const pending = orders?.filter(o => o.status === "pending").length || 0;
  const thisMonth = orders?.filter((o: any) => {
    if (["cancelled", "rejected"].includes(o.status)) return false;
    const d = new Date(o.createdAt || o.appliedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length || 0;
  const pendingQuotes = quotations?.filter((q: any) => q.status === "draft" || q.status === "sent").length || 0;

  const actions = [
    { icon: PlusCircle,  label: L ? "عميل وطلب جديد"    : "New Client & Order",    desc: L ? "تسجيل عميل وإنشاء طلب"       : "Register a client and order",   href: "/employee/new-order",        accent: "" },
    { icon: Users,       label: L ? "إدارة العملاء"      : "Manage Clients",        desc: L ? "قاعدة بيانات العملاء"        : "Client database & follow-ups",  href: "/admin/customers",           accent: "" },
    { icon: FileCheck,   label: L ? "عروض الأسعار"       : "Quotations",            desc: L ? "إنشاء ومتابعة العروض"        : "Create and track quotes",       href: "/admin/quotations",          accent: "" },
    { icon: Package,     label: L ? "متابعة المشاريع"    : "Track Projects",        desc: L ? "حالة المشاريع والمراحل"      : "Project statuses & stages",     href: "/admin/orders",              accent: "" },
    { icon: Megaphone,   label: L ? "أدوات التسويق"      : "Marketing Tools",       desc: L ? "مواد تسويقية وبوسترات"       : "Marketing materials & posters", href: "/sales/marketing",           accent: "" },
    ...(role === "sales_manager" ? [
      { icon: Star, label: L ? "الاشتراكات" : "Subscriptions", desc: L ? "اشتراكات العملاء النشطة" : "Active client subscriptions", href: "/employee/subscriptions", accent: "" },
      { icon: ShoppingCart, label: L ? "عربات مهجورة" : "Abandoned Carts", desc: L ? "عملاء لم يكملوا الطلب" : "Clients who didn't complete", href: "/employee/abandoned-carts", accent: "" },
      { icon: BarChart3, label: L ? "التقارير" : "Reports", desc: L ? "تحليلات المبيعات" : "Sales analytics", href: "/admin/analytics", accent: "" },
    ] : []),
  ];

  return (
    <div className="space-y-5 p-5">
      <RoleHero
        icon={Target}
        titleAr={role === "sales_manager" ? "لوحة مدير المبيعات" : "لوحة المبيعات"}
        titleEn={role === "sales_manager" ? "Sales Manager Dashboard" : "Sales Dashboard"}
        subtitleAr="متابعة الطلبات والعملاء والإيرادات"
        subtitleEn="Track orders, clients, and revenue"
        gradient="bg-gradient-to-br from-emerald-700 to-teal-900"
        L={L}
      />

      <div className="grid grid-cols-3 gap-3">
        <StatCard label={L ? "طلبات جديدة"  : "New Orders"}    value={pending}      icon={Package}    delay={0.05} />
        <StatCard label={L ? "طلبات الشهر"  : "This Month"}    value={thisMonth}    icon={TrendingUp} delay={0.08} />
        <StatCard label={L ? "إجمالي العملاء" : "Total Clients"} value={customers?.length || 0} icon={Users} delay={0.11} />
      </div>

      {pendingQuotes > 0 && (
        <motion.div {...fade(0.12)}>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-500/20 rounded-2xl px-4 py-3 flex items-center gap-3">
            <FileCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              {L ? `لديك ${pendingQuotes} عروض أسعار معلّقة` : `You have ${pendingQuotes} pending quotations`}
            </p>
            <Link href="/admin/quotations" className="mr-auto">
              <Button size="sm" variant="outline" className="text-xs h-7 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300">{L ? "راجع" : "Review"}</Button>
            </Link>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {actions.map((a, i) => <ActionCard key={i} {...a} delay={0.1 + i * 0.04} />)}
      </div>

      <UpcomingMeetingsWidget />
      <MyFinanceCard L={L} />
      <QiroxPostsBanner />
      <MyToolsCard L={L} />
    </div>
  );
}

/* ─────────────────────── SUPPORT DASHBOARD ─────────────────────── */
function SupportDashboard() {
  const { lang } = useI18n();
  const L = lang === "ar";
  const { data: tickets, isLoading } = useQuery<any[]>({ queryKey: ["/api/support-tickets"] });

  const open = tickets?.filter(t => t.status === "open").length || 0;
  const inProgress = tickets?.filter(t => t.status === "in_progress").length || 0;
  const closed = tickets?.filter(t => ["closed", "resolved"].includes(t.status)).length || 0;

  return (
    <div className="space-y-5 p-5">
      <RoleHero
        icon={Headphones}
        titleAr="لوحة الدعم الفني" titleEn="Support Dashboard"
        subtitleAr="تذاكر الدعم والمساعدة الفنية للعملاء"
        subtitleEn="Support tickets and technical client assistance"
        gradient="bg-gradient-to-br from-orange-600 to-red-800"
        L={L}
      />

      <div className="grid grid-cols-4 gap-3">
        <StatCard label={L ? "إجمالي"         : "Total"}       value={tickets?.length || 0} icon={MessageCircle} delay={0.05} />
        <StatCard label={L ? "مفتوحة"          : "Open"}        value={open}                 icon={AlertCircle}   delay={0.07} />
        <StatCard label={L ? "قيد المعالجة"   : "In Progress"} value={inProgress}           icon={Clock}         delay={0.09} />
        <StatCard label={L ? "مغلقة"           : "Closed"}      value={closed}               icon={CheckCircle2}  delay={0.11} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ActionCard icon={Headphones} label={L ? "تذاكر الدعم" : "Support Tickets"} desc={L ? "إدارة جميع تذاكر الدعم" : "Manage all support tickets"} href="/admin/contact-messages" delay={0.12} />
        <ActionCard icon={Users}      label={L ? "إدارة العملاء" : "Manage Clients"} desc={L ? "بيانات العملاء والحسابات" : "Client data and accounts"} href="/admin/customers"        delay={0.14} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin w-6 h-6 text-black/20 dark:text-white/20" /></div>
      ) : tickets && tickets.length > 0 && (
        <motion.div {...fade(0.25)}>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-[11px] font-black text-black/35 dark:text-white/30 uppercase tracking-wider flex items-center gap-2">
              <MessageCircle className="w-3.5 h-3.5" />{L ? "آخر التذاكر" : "Recent Tickets"}
            </h2>
            <Link href="/admin/contact-messages"><Button variant="ghost" size="sm" className="text-xs gap-1 text-black/40 h-7">{L ? "الكل" : "All"} <ChevronRight className="w-3 h-3" /></Button></Link>
          </div>
          <div className="space-y-2">
            {tickets.slice(0, 8).map((ticket: any, i) => {
              const statusMap: Record<string, string> = { open: L ? "مفتوحة" : "Open", in_progress: L ? "جاري" : "In Progress", closed: L ? "مغلقة" : "Closed", resolved: L ? "محلولة" : "Resolved" };
              return (
                <div key={ticket._id || i} className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-black dark:text-white truncate">{ticket.subject || ticket.title || (L ? "تذكرة دعم" : "Support Ticket")}</p>
                    <p className="text-[10px] text-black/35 dark:text-white/35">{ticket.clientName || ticket.email || ""}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-black/10 dark:border-white/10 shrink-0">{statusMap[ticket.status] || ticket.status}</Badge>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      <MyFinanceCard L={L} />
      <QiroxPostsBanner />
      <MyToolsCard L={L} />
    </div>
  );
}

/* ─────────────────────── ACCOUNTANT DASHBOARD ─────────────────────── */
function AccountantDashboard() {
  const { lang } = useI18n();
  const L = lang === "ar";
  const { data: orders } = useQuery<any[]>({ queryKey: ["/api/admin/orders"] });

  const now = new Date();
  const thisMonthOrders = orders?.filter((o: any) => {
    const d = new Date(o.createdAt || o.appliedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length || 0;

  const actions = [
    { icon: DollarSign, label: L ? "إدارة المالية"  : "Finance",        desc: L ? "المعاملات والتقارير"   : "Transactions & reports",   href: "/admin/finance",     accent: "" },
    { icon: FileText,   label: L ? "الفواتير"        : "Invoices",       desc: L ? "إنشاء ومتابعة الفواتير" : "Create & track invoices", href: "/admin/invoices",    accent: "" },
    { icon: Receipt,    label: L ? "الوصولات"        : "Receipts",       desc: L ? "سجل الوصولات الصادرة"  : "Issued receipts log",      href: "/admin/receipts",    accent: "" },
    { icon: Banknote,   label: L ? "الرواتب"         : "Payroll",        desc: L ? "رواتب الموظفين"        : "Employee salaries",        href: "/admin/payroll",     accent: "" },
    { icon: BarChart3,  label: L ? "التقارير المالية": "Financial Reports",desc: L ? "تحليلات وإحصاءات"  : "Analytics & statistics",   href: "/admin/analytics",   accent: "" },
    { icon: Wand2,      label: L ? "أدواتي"          : "My Tools",       desc: L ? "أدوات PDF والحسابات"  : "PDF & calculation tools",  href: "/my-tools",          accent: "" },
  ];

  return (
    <div className="space-y-5 p-5">
      <RoleHero
        icon={DollarSign}
        titleAr="لوحة المحاسب" titleEn="Accountant Dashboard"
        subtitleAr="المالية والفواتير والرواتب والتقارير"
        subtitleEn="Finance, invoices, payroll, and reports"
        gradient="bg-gradient-to-br from-amber-600 to-yellow-800"
        L={L}
      />

      <div className="grid grid-cols-2 gap-3">
        <StatCard label={L ? "طلبات هذا الشهر" : "Orders This Month"} value={thisMonthOrders}    icon={TrendingUp}  delay={0.05} />
        <StatCard label={L ? "إجمالي المشاريع"  : "Total Projects"}    value={orders?.length || 0} icon={Package}     delay={0.08} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {actions.map((a, i) => <ActionCard key={i} {...a} delay={0.1 + i * 0.04} />)}
      </div>

      <QiroxPostsBanner />
      <MyToolsCard L={L} />
    </div>
  );
}

/* ─────────────────────── HR DASHBOARD ─────────────────────── */
function HRDashboard() {
  const { lang } = useI18n();
  const L = lang === "ar";
  const { data: employees } = useQuery<any[]>({ queryKey: ["/api/admin/employees"] });

  const active = employees?.filter((e: any) => e.status !== "inactive").length || 0;

  const actions = [
    { icon: Building2,    label: L ? "الموظفون"          : "Employees",        desc: L ? "إدارة فريق العمل"       : "Manage the work team",     href: "/admin/employees",   accent: "" },
    { icon: Banknote,     label: L ? "الرواتب"           : "Payroll",          desc: L ? "مسير الرواتب والمدفوعات"  : "Payroll management",     href: "/admin/payroll",     accent: "" },
    { icon: CalendarDays, label: L ? "الحضور والانصراف"  : "Attendance",       desc: L ? "سجلات الحضور اليومي"    : "Daily attendance records",  href: "/admin/attendance",  accent: "" },
    { icon: UserCheck,    label: L ? "التوظيف"           : "Recruitment",      desc: L ? "مراجعة الطلبات الجديدة"  : "Review new applications", href: "/admin/employees",   accent: "" },
    { icon: BarChart3,    label: L ? "التقارير"          : "Reports",          desc: L ? "تقارير الأداء والكفاءة"  : "Performance & efficiency", href: "/admin/analytics",   accent: "" },
    { icon: Wand2,        label: L ? "أدواتي"            : "My Tools",         desc: L ? "أدوات PDF والاختصارات"   : "PDF & shortcut tools",     href: "/my-tools",          accent: "" },
  ];

  return (
    <div className="space-y-5 p-5">
      <RoleHero
        icon={Building2}
        titleAr="لوحة الموارد البشرية" titleEn="HR Dashboard"
        subtitleAr="إدارة الفريق والحضور والرواتب"
        subtitleEn="Team management, attendance, and payroll"
        gradient="bg-gradient-to-br from-rose-600 to-pink-900"
        L={L}
      />

      <div className="grid grid-cols-2 gap-3">
        <StatCard label={L ? "الموظفون النشطون" : "Active Employees"}   value={active}               icon={UserCheck}  delay={0.05} />
        <StatCard label={L ? "إجمالي الفريق"    : "Total Team"}         value={employees?.length || 0} icon={Users}    delay={0.08} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {actions.map((a, i) => <ActionCard key={i} {...a} delay={0.1 + i * 0.04} />)}
      </div>

      <MyFinanceCard L={L} />
      <QiroxPostsBanner />
      <MyToolsCard L={L} />
    </div>
  );
}

/* ─────────────────────── MARKETING DASHBOARD ─────────────────────── */
function MarketingDashboard() {
  const { lang } = useI18n();
  const L = lang === "ar";
  const { data: customers } = useQuery<any[]>({ queryKey: ["/api/admin/customers"] });
  const { data: orders } = useQuery<any[]>({ queryKey: ["/api/admin/orders"] });

  const now = new Date();
  const newClientsThisMonth = customers?.filter((c: any) => {
    const d = new Date(c.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length || 0;

  const actions = [
    { icon: Megaphone,  label: L ? "أدوات التسويق"   : "Marketing Tools",  desc: L ? "تصميم ونشر المواد"    : "Design & publish materials",  href: "/sales/marketing",    accent: "" },
    { icon: PlusCircle, label: L ? "عميل وطلب جديد"  : "New Client & Order",desc: L ? "إضافة عميل ومشروع"   : "Add client and project",       href: "/employee/new-order", accent: "" },
    { icon: Users,      label: L ? "إدارة العملاء"   : "Manage Clients",    desc: L ? "متابعة العملاء"       : "Client follow-ups",           href: "/admin/customers",    accent: "" },
    { icon: FileCheck,  label: L ? "عروض الأسعار"    : "Quotations",        desc: L ? "إنشاء ومتابعة العروض" : "Create and track quotes",      href: "/admin/quotations",   accent: "" },
    { icon: Newspaper,  label: L ? "الأخبار"         : "News & Blog",       desc: L ? "تحديث الأخبار"        : "Update news and blog",         href: "/admin/news",         accent: "" },
    { icon: BarChart2,  label: L ? "التحليلات"       : "Analytics",         desc: L ? "إحصاءات ونتائج"       : "Stats and results",           href: "/admin/analytics",    accent: "" },
  ];

  return (
    <div className="space-y-5 p-5">
      <RoleHero
        icon={Megaphone}
        titleAr="لوحة التسويق" titleEn="Marketing Dashboard"
        subtitleAr="المواد التسويقية وتحليلات العملاء"
        subtitleEn="Marketing materials and client analytics"
        gradient="bg-gradient-to-br from-pink-600 to-rose-800"
        L={L}
      />

      <div className="grid grid-cols-2 gap-3">
        <StatCard label={L ? "عملاء جدد هذا الشهر" : "New Clients This Month"} value={newClientsThisMonth}   icon={TrendingUp} delay={0.05} />
        <StatCard label={L ? "إجمالي العملاء"       : "Total Clients"}          value={customers?.length || 0} icon={Users}      delay={0.08} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {actions.map((a, i) => <ActionCard key={i} {...a} delay={0.1 + i * 0.04} />)}
      </div>

      <MyFinanceCard L={L} />
      <QiroxPostsBanner />
      <MyToolsCard L={L} />
    </div>
  );
}

/* ─────────────────────── CONTENT DASHBOARD ─────────────────────── */
function ContentDashboard() {
  const { lang } = useI18n();
  const L = lang === "ar";
  const { data: products } = useQuery<any[]>({ queryKey: ["/api/admin/products"] });

  const actions = [
    { icon: ShoppingBag, label: L ? "المنتجات"       : "Products",      desc: L ? "إدارة قائمة المنتجات" : "Manage product catalog",   href: "/admin/products",     accent: "" },
    { icon: Newspaper,   label: L ? "الأخبار"        : "News & Blog",   desc: L ? "المقالات والأخبار"    : "Articles and news posts",  href: "/admin/news",         accent: "" },
    { icon: Megaphone,   label: L ? "أدوات التسويق" : "Marketing",      desc: L ? "مواد التسويق"         : "Marketing materials",       href: "/sales/marketing",    accent: "" },
    { icon: Wand2,       label: L ? "أدواتي"         : "My Tools",      desc: L ? "أدوات PDF والمحتوى"   : "PDF & content tools",       href: "/my-tools",           accent: "" },
  ];

  return (
    <div className="space-y-5 p-5">
      <RoleHero
        icon={Newspaper}
        titleAr="لوحة إدارة المحتوى" titleEn="Content Dashboard"
        subtitleAr="المنتجات والأخبار والمواد التسويقية"
        subtitleEn="Products, news, and marketing materials"
        gradient="bg-gradient-to-br from-indigo-700 to-purple-900"
        L={L}
      />

      <StatCard label={L ? "إجمالي المنتجات" : "Total Products"} value={products?.length || 0} icon={ShoppingBag} delay={0.05} />

      <div className="grid grid-cols-2 gap-3">
        {actions.map((a, i) => <ActionCard key={i} {...a} delay={0.1 + i * 0.04} />)}
      </div>

      <MyFinanceCard L={L} />
      <QiroxPostsBanner />
      <MyToolsCard L={L} />
    </div>
  );
}

/* ─────────────────────── DELIVERY DASHBOARD ─────────────────────── */
function DeliveryDashboard() {
  const { lang } = useI18n();
  const L = lang === "ar";

  return (
    <div className="space-y-5 p-5">
      <RoleHero
        icon={Package}
        titleAr="لوحة التوصيل" titleEn="Delivery Dashboard"
        subtitleAr="متابعة الطلبيات والتوصيلات"
        subtitleEn="Track deliveries and orders"
        gradient="bg-gradient-to-br from-stone-700 to-gray-900"
        L={L}
      />
      <QiAgentPromo L={L} />
      <MyFinanceCard L={L} />
      <QiroxPostsBanner />
      <MyToolsCard L={L} />
    </div>
  );
}

/* ─────────────────────── ADMIN / MANAGER DASHBOARD ─────────────────────── */
function AdminManagerDashboard() {
  const { lang } = useI18n();
  const L = lang === "ar";
  const { data: user } = useUser();
  const role = (user as any)?.role;
  const { data: orders } = useQuery<any[]>({ queryKey: ["/api/admin/orders"] });
  const { data: customers } = useQuery<any[]>({ queryKey: ["/api/admin/customers"] });
  const { data: employees } = useQuery<any[]>({ queryKey: ["/api/admin/employees"] });

  const now = new Date();
  const active = orders?.filter(o => !["completed", "cancelled", "rejected"].includes(o.status)).length || 0;
  const thisMonth = orders?.filter((o: any) => {
    const d = new Date(o.createdAt || o.appliedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length || 0;

  const shortcuts = [
    { icon: Package,       label: L ? "المشاريع"     : "Projects",     href: "/admin/orders",         accent: "bg-blue-50 dark:bg-blue-900/20" },
    { icon: Users,         label: L ? "العملاء"      : "Clients",      href: "/admin/customers",      accent: "bg-emerald-50 dark:bg-emerald-900/20" },
    { icon: DollarSign,    label: L ? "المالية"      : "Finance",      href: "/admin/finance",        accent: "bg-amber-50 dark:bg-amber-900/20" },
    { icon: Building2,     label: L ? "الفريق"       : "Team",         href: "/admin/employees",      accent: "bg-purple-50 dark:bg-purple-900/20" },
    { icon: BarChart3,     label: L ? "التقارير"     : "Reports",      href: "/admin/analytics",      accent: "bg-rose-50 dark:bg-rose-900/20" },
    { icon: ClipboardList, label: L ? "كانبان"       : "Kanban",       href: "/admin/kanban",         accent: "bg-indigo-50 dark:bg-indigo-900/20" },
    { icon: FileCheck,     label: L ? "عروض"         : "Quotations",   href: "/admin/quotations",     accent: "bg-teal-50 dark:bg-teal-900/20" },
    { icon: CalendarDays,  label: L ? "الحضور"       : "Attendance",   href: "/admin/attendance",     accent: "bg-orange-50 dark:bg-orange-900/20" },
    { icon: Sparkles,      label: L ? "Studio AI"    : "Studio AI",    href: "/employee/studio",      accent: "bg-violet-50 dark:bg-violet-900/20" },
    { icon: Code2,         label: L ? "System Builder": "Builder",      href: "/employee/system-builder", accent: "bg-slate-50 dark:bg-slate-900/20" },
    { icon: CloudUpload,   label: L ? "النشر"        : "Deployment",   href: "/employee/deployment-cloud", accent: "bg-sky-50 dark:bg-sky-900/20" },
    { icon: Video,         label: L ? "الاجتماعات"  : "Meetings",     href: "/admin/qmeet",          accent: "bg-violet-50 dark:bg-violet-900/20" },
  ];

  return (
    <div className="space-y-5 p-5">
      <RoleHero
        icon={LayoutDashboard}
        titleAr={role === "admin" ? "لوحة مدير النظام" : "لوحة الإدارة"}
        titleEn={role === "admin" ? "System Admin Dashboard" : "Manager Dashboard"}
        subtitleAr="نظرة شاملة على المنصة والفريق والأداء"
        subtitleEn="Complete platform, team, and performance overview"
        gradient="bg-gradient-to-br from-slate-800 to-gray-950"
        L={L}
      />

      <div className="grid grid-cols-4 gap-3">
        <StatCard label={L ? "مشاريع نشطة"    : "Active Projects"} value={active}               icon={Activity}    delay={0.05} />
        <StatCard label={L ? "طلبات الشهر"    : "This Month"}      value={thisMonth}            icon={TrendingUp}  delay={0.07} />
        <StatCard label={L ? "إجمالي العملاء" : "Total Clients"}   value={customers?.length || 0} icon={Users}     delay={0.09} />
        <StatCard label={L ? "أعضاء الفريق"  : "Team Members"}    value={employees?.length || 0} icon={Building2} delay={0.11} />
      </div>

      <QiAgentPromo L={L} />

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {shortcuts.map(({ icon: Icon, label, href, accent }, i) => (
          <motion.div key={i} {...fade(0.1 + i * 0.03)}>
            <Link href={href}>
              <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 transition-transform ${accent}`}>
                  <Icon className="w-5 h-5 text-black dark:text-white" />
                </div>
                <p className="text-xs font-bold text-black dark:text-white leading-tight">{label}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <motion.div {...fade(0.35)}>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-[11px] font-black text-black/35 dark:text-white/30 uppercase tracking-wider flex items-center gap-2">
            <Package className="w-3.5 h-3.5" />{L ? "آخر المشاريع" : "Recent Projects"}
          </h2>
          <Link href="/admin/orders"><Button variant="ghost" size="sm" className="text-xs gap-1 text-black/40 h-7">{L ? "الكل" : "All"} <ChevronRight className="w-3 h-3" /></Button></Link>
        </div>
        <div className="space-y-2">
          {orders?.slice(0, 6).map((o: any) => (
            <div key={o._id || o.id} className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-black dark:text-white">{o.projectType || o.sector || (L ? "مشروع" : "Project")}</p>
                <p className="text-[11px] text-black/35 dark:text-white/35">{o.clientName || ""}</p>
              </div>
              <Badge variant="outline" className="text-[10px] border-black/10 dark:border-white/10">{o.status}</Badge>
            </div>
          )) || <p className="text-center text-black/30 dark:text-white/30 text-sm py-6">{L ? "لا توجد مشاريع" : "No projects"}</p>}
        </div>
      </motion.div>

      <UpcomingMeetingsWidget />
      <QiroxPostsBanner />
      <MyToolsCard L={L} />
    </div>
  );
}

/* ─────────────────────── MAIN EXPORT ─────────────────────── */
export default function EmployeeRoleDashboard() {
  const { data: user } = useUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin w-8 h-8 text-black/30 dark:text-white/30" />
      </div>
    );
  }

  const role = (user as any).role as string;

  const roleMap: Record<string, JSX.Element> = {
    merchant:      <DeliveryDashboard />,
    developer:     <DeveloperDashboard />,
    designer:      <DesignerDashboard />,
    accountant:    <AccountantDashboard />,
    sales:         <SalesDashboard />,
    sales_manager: <SalesDashboard />,
    support:       <SupportDashboard />,
    marketing:     <MarketingDashboard />,
    hr:            <HRDashboard />,
    content:       <ContentDashboard />,
    admin:         <AdminManagerDashboard />,
    manager:       <AdminManagerDashboard />,
  };

  return roleMap[role] ?? <AdminManagerDashboard />;
}
