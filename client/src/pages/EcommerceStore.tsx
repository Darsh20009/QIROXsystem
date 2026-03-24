import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, ExternalLink, Globe, Shield, CreditCard, Package,
  Users, BarChart3, Tag, Truck, Monitor, Store, ChevronDown, ChevronRight,
  ShoppingCart, MapPin, Bell, Star, Smartphone, Copy, Check, Eye, EyeOff,
  Receipt, LayoutDashboard, Banknote, Building2, Settings, RefreshCw,
  Maximize2, Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const STORE_URL = "https://e-commerce.qiroxstudio.online";

const QUICK_LINKS = [
  { label: "الواجهة الرئيسية", path: "/", icon: Store, color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" },
  { label: "المنتجات", path: "/products", icon: ShoppingBag, color: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400" },
  { label: "سلة التسوق", path: "/cart", icon: ShoppingCart, color: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" },
  { label: "لوحة الإدارة", path: "/admin", icon: LayoutDashboard, color: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" },
  { label: "الكاشير POS", path: "/pos", icon: Monitor, color: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400" },
  { label: "الطلبات", path: "/orders", icon: Package, color: "bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400" },
  { label: "الموظفين", path: "/admin/staff", icon: Users, color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400" },
  { label: "المخزون", path: "/admin/inventory", icon: Truck, color: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400" },
  { label: "البانرات", path: "/admin/banners", icon: Tag, color: "bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400" },
  { label: "الفروع", path: "/admin/branches", icon: Building2, color: "bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400" },
  { label: "الفواتير", path: "/profile/invoices", icon: Receipt, color: "bg-lime-50 text-lime-600 dark:bg-lime-900/20 dark:text-lime-400" },
  { label: "الإعدادات", path: "/admin/roles", icon: Settings, color: "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
];

const ADMIN_INFO = {
  phone: "567891011",
  password: "123456",
  email: "qiroxsystem@gmail.com",
};

const TEST_CARDS = [
  { label: "مدى (ناجحة — بدون 3DS)", number: "4988 4588 1234 5670", badge: "success", badgeLabel: "نجاح" },
  { label: "فيزا (ناجحة + 3DS)", number: "4111 1111 1111 1111", badge: "success3ds", badgeLabel: "3DS", otp: "123456" },
  { label: "ماستر (ناجحة + 3DS)", number: "5200 8282 8282 8210", badge: "success3ds", badgeLabel: "3DS", otp: "123456" },
  { label: "فيزا (مرفوضة)", number: "4000 0000 0000 0002", badge: "fail", badgeLabel: "مرفوضة" },
  { label: "فيزا (رصيد غير كافٍ)", number: "4000 0000 0000 9995", badge: "fail", badgeLabel: "رصيد ناقص" },
];

const STORE_FEATURES = [
  { icon: ShoppingBag, label: "٢٨ صفحة", desc: "واجهة متكاملة للعملاء والإدارة" },
  { icon: CreditCard, label: "٧ طرق دفع", desc: "بطاقة، STC Pay، Apple Pay، تمارة، تابي، محفظة، تحويل" },
  { icon: Bell, label: "٣ طبقات إشعارات", desc: "داخل التطبيق، Web Push، وقاعدة البيانات" },
  { icon: Star, label: "نظام ولاء", desc: "برونز / فضي / ذهبي مع نقاط ومحفظة رقمية" },
  { icon: BarChart3, label: "تقارير متقدمة", desc: "إحصائيات المبيعات والمخزون والصندوق" },
  { icon: Smartphone, label: "PWA", desc: "يعمل كتطبيق أصلي على الجوال" },
  { icon: Globe, label: "ثنائي اللغة", desc: "عربي وإنجليزي مع تبديل فوري RTL/LTR" },
  { icon: Shield, label: "RBAC", desc: "أدوار وصلاحيات مخصصة لكل موظف" },
];

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast({ title: "تم النسخ" });
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={copy}
      className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-black/8 dark:hover:bg-white/8 transition-colors text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white flex-shrink-0"
      data-testid={`copy-${text}`}
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function EcommerceStore() {
  const [activeTab, setActiveTab] = useState<"overview" | "embed">("overview");
  const [currentPath, setCurrentPath] = useState("/");
  const [showPassword, setShowPassword] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const iframeSrc = `${STORE_URL}${currentPath}`;

  function openPath(path: string) {
    setCurrentPath(path);
    setActiveTab("embed");
    setIframeKey(k => k + 1);
  }

  function reloadIframe() {
    setIframeKey(k => k + 1);
  }

  const BADGE_COLORS: Record<string, string> = {
    success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    success3ds: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    fail: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="h-full flex flex-col gap-0" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-950 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
            <Store className="w-4.5 h-4.5 text-white dark:text-black" />
          </div>
          <div>
            <h1 className="text-base font-black text-black dark:text-white leading-tight">متجر Qirox</h1>
            <p className="text-[11px] text-black/40 dark:text-white/40 leading-tight">نظام متجر إلكتروني متكامل</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] font-semibold text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
            data-testid="link-open-store"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            فتح في تبويب جديد
          </a>
          <div className="flex bg-black/[0.04] dark:bg-white/[0.04] rounded-xl p-0.5 gap-0.5">
            {(["overview", "embed"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  activeTab === tab
                    ? "bg-black dark:bg-white text-white dark:text-black shadow-sm"
                    : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
                }`}
                data-testid={`tab-${tab}`}
              >
                {tab === "overview" ? "نظرة عامة" : "معاينة المتجر"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "overview" ? (
          <motion.div
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 overflow-y-auto p-4 space-y-5"
          >
            {/* Feature Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {STORE_FEATURES.map(f => (
                <Card key={f.label} className="border border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl">
                  <CardContent className="p-3 flex flex-col gap-1.5">
                    <div className="w-8 h-8 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center">
                      <f.icon className="w-4 h-4 text-black/50 dark:text-white/40" />
                    </div>
                    <p className="text-xs font-black text-black dark:text-white leading-tight">{f.label}</p>
                    <p className="text-[10px] text-black/40 dark:text-white/35 leading-snug">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Links */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-black/30 dark:text-white/30 mb-2.5 px-0.5">الصفحات الرئيسية</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {QUICK_LINKS.map(link => (
                  <button
                    key={link.path}
                    onClick={() => openPath(link.path)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-black/[0.06] dark:border-white/[0.06] hover:border-black/20 dark:hover:border-white/20 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all group text-center"
                    data-testid={`link-${link.path}`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${link.color}`}>
                      <link.icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-black/60 dark:text-white/55 leading-tight group-hover:text-black dark:group-hover:text-white transition-colors">{link.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Admin Credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card className="border border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl">
                <CardContent className="p-4 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-black/30 dark:text-white/30">بيانات المدير</p>
                  <div className="space-y-2.5">
                    {[
                      { label: "رقم الجوال", value: ADMIN_INFO.phone },
                      { label: "البريد الإلكتروني", value: ADMIN_INFO.email },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between gap-2 bg-black/[0.025] dark:bg-white/[0.04] rounded-xl px-3 py-2">
                        <span className="text-[10px] text-black/40 dark:text-white/40 flex-shrink-0">{row.label}</span>
                        <span className="text-xs font-mono font-bold text-black dark:text-white flex-1 text-left" dir="ltr">{row.value}</span>
                        <CopyBtn text={row.value} />
                      </div>
                    ))}
                    <div className="flex items-center justify-between gap-2 bg-black/[0.025] dark:bg-white/[0.04] rounded-xl px-3 py-2">
                      <span className="text-[10px] text-black/40 dark:text-white/40 flex-shrink-0">كلمة المرور</span>
                      <span className="text-xs font-mono font-bold text-black dark:text-white flex-1 text-left" dir="ltr">
                        {showPassword ? ADMIN_INFO.password : "••••••"}
                      </span>
                      <button
                        onClick={() => setShowPassword(v => !v)}
                        className="w-6 h-6 flex items-center justify-center text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors flex-shrink-0"
                        data-testid="toggle-password"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <CopyBtn text={ADMIN_INFO.password} />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full bg-black dark:bg-white text-white dark:text-black text-xs rounded-xl gap-1.5"
                    onClick={() => openPath("/login")}
                    data-testid="btn-goto-login"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                    الدخول للوحة الإدارة
                  </Button>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card className="border border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-black/30 dark:text-white/30">بطاقات الاختبار</p>
                    <button
                      onClick={() => setShowCards(v => !v)}
                      className="text-[10px] font-bold text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1"
                      data-testid="toggle-cards"
                    >
                      <ChevronDown className={`w-3 h-3 transition-transform ${showCards ? "rotate-180" : ""}`} />
                      {showCards ? "إخفاء" : "عرض"}
                    </button>
                  </div>

                  <AnimatePresence>
                    {showCards && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-2"
                      >
                        {TEST_CARDS.map(card => (
                          <div key={card.number} className="bg-black/[0.025] dark:bg-white/[0.04] rounded-xl p-2.5 space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[9px] text-black/40 dark:text-white/40 leading-tight">{card.label}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${BADGE_COLORS[card.badge]}`}>
                                {card.badgeLabel}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-mono font-bold text-black dark:text-white flex-1" dir="ltr">{card.number}</span>
                              <CopyBtn text={card.number.replace(/\s/g, "")} />
                            </div>
                            {card.otp && (
                              <p className="text-[9px] text-black/40 dark:text-white/40">OTP: <span className="font-mono font-bold text-black dark:text-white">{card.otp}</span></p>
                            )}
                          </div>
                        ))}
                        <p className="text-[9px] text-black/35 dark:text-white/30 pt-1 leading-relaxed">
                          تاريخ الانتهاء: أي تاريخ مستقبلي مثل 12/28 • CVV: أي ٣ أرقام مثل 123
                          <br />
                          STC Pay OTP: 1234 • Apple Pay: انقر "ادفع" فقط
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!showCards && (
                    <div className="space-y-1.5">
                      {[
                        { label: "بطاقة بنكية / STC Pay / Apple Pay", color: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" },
                        { label: "تمارة / تابي (تقسيط)", color: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" },
                        { label: "محفظة Qirox / تحويل بنكي", color: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400" },
                      ].map(m => (
                        <div key={m.label} className={`text-[10px] font-semibold px-2.5 py-1.5 rounded-lg ${m.color}`}>{m.label}</div>
                      ))}
                    </div>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs rounded-xl gap-1.5 border-black/10 dark:border-white/10"
                    onClick={() => openPath("/checkout")}
                    data-testid="btn-goto-checkout"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    تجربة الدفع
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Routes table */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-black/30 dark:text-white/30 mb-2.5 px-0.5">جميع الروابط</p>
              <div className="rounded-2xl border border-black/[0.07] dark:border-white/[0.07] overflow-hidden">
                {[
                  { path: "/", label: "الرئيسية", access: "الجميع" },
                  { path: "/products", label: "المنتجات", access: "الجميع" },
                  { path: "/cart", label: "السلة", access: "الجميع" },
                  { path: "/checkout", label: "إتمام الطلب", access: "الجميع" },
                  { path: "/login", label: "تسجيل الدخول", access: "زوار" },
                  { path: "/register", label: "إنشاء حساب", access: "زوار" },
                  { path: "/forgot-password", label: "استعادة كلمة المرور", access: "الجميع" },
                  { path: "/orders", label: "طلباتي", access: "عملاء" },
                  { path: "/profile", label: "الملف الشخصي", access: "عملاء" },
                  { path: "/profile/invoices", label: "الفواتير الشخصية", access: "عملاء" },
                  { path: "/admin", label: "لوحة الإدارة", access: "مدير" },
                  { path: "/admin/branches", label: "الفروع", access: "مدير" },
                  { path: "/admin/staff", label: "الموظفين", access: "مدير" },
                  { path: "/admin/banners", label: "البانرات", access: "مدير" },
                  { path: "/admin/audit-logs", label: "سجل التدقيق", access: "مدير" },
                  { path: "/admin/roles", label: "الأدوار", access: "مدير" },
                  { path: "/admin/inventory", label: "المخزون", access: "مدير" },
                  { path: "/pos", label: "الكاشير POS", access: "موظف" },
                  { path: "/cash-drawer", label: "الصندوق", access: "موظف" },
                  { path: "/cash-report", label: "تقرير الصندوق", access: "موظف" },
                  { path: "/terms", label: "الشروط والأحكام", access: "الجميع" },
                ].map((row, i) => (
                  <button
                    key={row.path}
                    onClick={() => openPath(row.path)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-right hover:bg-black/[0.025] dark:hover:bg-white/[0.025] transition-colors group ${
                      i !== 0 ? "border-t border-black/[0.05] dark:border-white/[0.05]" : ""
                    }`}
                    data-testid={`route-${row.path}`}
                  >
                    <span className="text-[10px] font-mono text-black/35 dark:text-white/30 w-32 flex-shrink-0 text-left" dir="ltr">{row.path}</span>
                    <span className="text-xs font-semibold text-black/70 dark:text-white/65 flex-1">{row.label}</span>
                    <span className="text-[9px] bg-black/[0.04] dark:bg-white/[0.05] text-black/40 dark:text-white/35 px-2 py-0.5 rounded-full flex-shrink-0">{row.access}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-black/20 dark:text-white/20 group-hover:text-black/50 dark:group-hover:text-white/50 transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="embed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* iframe toolbar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] flex-shrink-0">
              <div className="flex-1 flex items-center gap-2 bg-white dark:bg-gray-900 border border-black/[0.08] dark:border-white/[0.08] rounded-lg px-3 py-1.5 min-w-0">
                <Globe className="w-3 h-3 text-black/30 dark:text-white/30 flex-shrink-0" />
                <span className="text-[11px] font-mono text-black/60 dark:text-white/60 truncate" dir="ltr">
                  {STORE_URL}{currentPath}
                </span>
              </div>
              <button
                onClick={reloadIframe}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-black/8 dark:hover:bg-white/8 transition-colors text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white flex-shrink-0"
                title="إعادة تحميل"
                data-testid="btn-reload-iframe"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsFullscreen(v => !v)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-black/8 dark:hover:bg-white/8 transition-colors text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white flex-shrink-0"
                title="ملء الشاشة"
                data-testid="btn-fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <a
                href={`${STORE_URL}${currentPath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-black/8 dark:hover:bg-white/8 transition-colors text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white flex-shrink-0"
                title="فتح في تبويب جديد"
                data-testid="btn-open-new-tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Quick nav pills */}
            <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto border-b border-black/[0.05] dark:border-white/[0.05] flex-shrink-0 scrollbar-hide">
              {QUICK_LINKS.slice(0, 8).map(link => (
                <button
                  key={link.path}
                  onClick={() => { setCurrentPath(link.path); setIframeKey(k => k + 1); }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                    currentPath === link.path
                      ? "bg-black dark:bg-white text-white dark:text-black"
                      : "bg-black/[0.04] dark:bg-white/[0.04] text-black/55 dark:text-white/50 hover:bg-black/8 dark:hover:bg-white/8"
                  }`}
                  data-testid={`pill-${link.path}`}
                >
                  <link.icon className="w-3 h-3" />
                  {link.label}
                </button>
              ))}
            </div>

            {/* iframe */}
            <div className={`flex-1 relative ${isFullscreen ? "fixed inset-0 z-50 bg-white dark:bg-gray-950 flex flex-col" : ""}`}>
              {isFullscreen && (
                <div className="flex items-center gap-2 px-3 py-2 border-b border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-950 flex-shrink-0">
                  <Globe className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
                  <span className="text-xs font-mono text-black/50 dark:text-white/50 flex-1 truncate" dir="ltr">{STORE_URL}{currentPath}</span>
                  <button
                    onClick={() => setIsFullscreen(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-black/8 dark:hover:bg-white/8 transition-colors text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
                    data-testid="btn-exit-fullscreen"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <iframe
                key={iframeKey}
                src={iframeSrc}
                className={`w-full border-0 ${isFullscreen ? "flex-1 h-full" : "h-full"}`}
                style={{ minHeight: isFullscreen ? "calc(100vh - 40px)" : "500px" }}
                title="متجر Qirox"
                allow="payment; camera; microphone"
                data-testid="iframe-store"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
