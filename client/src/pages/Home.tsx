import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import InstallPrompt from "@/components/InstallPrompt";
import SARIcon from "@/components/SARIcon";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useTemplates } from "@/hooks/use-templates";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Partner } from "@shared/schema";

import { SiApple, SiGoogleplay, SiInstagram, SiX, SiLinkedin, SiTiktok, SiSnapchat, SiYoutube, SiWhatsapp } from "react-icons/si";
import qahwaCupLogo from "@assets/Elegant_Coffee_Culture_Design_1757428233689_1771717217775.png";
import genMZLogo from "@assets/Screenshot_2025-12-24_203835_1771717230405.png";
import beFluentLogo from "@assets/Screenshot_2026-01-25_182548_1771717248784.png";
import tuwaiqLogo from "@assets/Screenshot_2026-02-20_030415_1771717262310.png";
import blackRoseLogo from "@assets/Screenshot_2026-01-28_010045_1771717287296.png";
import qodratakLogo from "@assets/Screenshot_2026-01-28_125929_1771717287296.png";
import subwayLogo from "@assets/Screenshot_2026-01-28_130014_1771717301779.png";
import maestroLogo from "@assets/Screenshot_2026-01-28_130058_1771717301779.png";
import instapayLogo from "@assets/Screenshot_2026-01-27_123515_1771717312922.png";
import {
  ArrowLeft, Globe, ArrowUpRight,
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee, Layers,
  Sparkles, Shield, Zap,
  UtensilsCrossed, Store, Building2, ChevronLeft, ChevronRight,
  Headphones, Palette,
  QrCode, MonitorSmartphone, Star, Award,
  Package, ShoppingBag, CreditCard, BarChart3,
  Smartphone, Check,
  Utensils, Bell, Clock, Wifi, Receipt, Truck,
  Tag, Filter, RefreshCw, TrendingUp,
  Lock, Cloud, Cpu, Globe2, MessageSquare,
  Copy, X, Flame, Timer, ChevronDown, AppWindow, Download,
  Share2, PlusSquare
} from "lucide-react";
import { AnimatePresence } from "framer-motion";

const sectorIcons: Record<string, any> = {
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee, Globe
};

const staticPartners = [
  { name: "QahwaCup", nameAr: "قهوة كوب", logo: qahwaCupLogo },
  { name: "Gen M&Z", nameAr: "Gen M&Z", logo: genMZLogo },
  { name: "Be Fluent", nameAr: "Be Fluent", logo: beFluentLogo },
  { name: "جمعية طويق", nameAr: "جمعية طويق", logo: tuwaiqLogo },
  { name: "Black Rose Cafe", nameAr: "بلاك روز كافيه", logo: blackRoseLogo },
  { name: "Qodratak", nameAr: "قدراتك", logo: qodratakLogo },
  { name: "Subway", nameAr: "صبواي", logo: subwayLogo },
  { name: "Maestro", nameAr: "مايسترو", logo: maestroLogo },
  { name: "InstaPay", nameAr: "إنستاباي", logo: instapayLogo },
];

const isMobileDevice = typeof navigator !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const fadeUp = isMobileDevice
  ? { hidden: { opacity: 1, y: 0 }, visible: () => ({ opacity: 1, y: 0, transition: { duration: 0 } }) }
  : {
      hidden: { opacity: 0, y: 30 },
      visible: (i: number) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }
      })
    };

const stagger = isMobileDevice
  ? { hidden: { opacity: 1 }, visible: { opacity: 1, transition: { staggerChildren: 0 } } }
  : { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };

const mobileMotionProps = isMobileDevice ? { initial: { opacity: 1 }, animate: { opacity: 1 } } : {};

export default function Home() {
  const { data: templates } = useTemplates();
  const { t, lang, dir } = useI18n();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  const { data: discountCodes } = useQuery<any[]>({
    queryKey: ["/api/discount-codes/public"],
  });

  const { data: publicSettings } = useQuery<{ instagram?: string; twitter?: string; linkedin?: string; snapchat?: string; youtube?: string; tiktok?: string; whatsapp?: string }>({
    queryKey: ["/api/public/settings"],
    staleTime: 10 * 60 * 1000,
  });

  const { data: appDownloads } = useQuery<{
    playStore: { url: string; enabled: boolean };
    appStore:  { url: string; enabled: boolean };
    msStore:   { url: string; enabled: boolean };
  }>({
    queryKey: ["/api/app-downloads"],
    staleTime: 10 * 60 * 1000,
  });

  const SOCIAL_ITEMS = [
    { key: "instagram", icon: <SiInstagram className="w-5 h-5" />, url: publicSettings?.instagram, label: "Instagram" },
    { key: "twitter",   icon: <SiX className="w-5 h-5" />,          url: publicSettings?.twitter,   label: "X / Twitter" },
    { key: "linkedin",  icon: <SiLinkedin className="w-5 h-5" />,  url: publicSettings?.linkedin,  label: "LinkedIn" },
    { key: "tiktok",    icon: <SiTiktok className="w-5 h-5" />,    url: publicSettings?.tiktok,    label: "TikTok" },
    { key: "snapchat",  icon: <SiSnapchat className="w-5 h-5" />,  url: publicSettings?.snapchat,  label: "Snapchat" },
    { key: "youtube",   icon: <SiYoutube className="w-5 h-5" />,   url: publicSettings?.youtube,   label: "YouTube" },
    { key: "whatsapp",  icon: <SiWhatsapp className="w-5 h-5" />,  url: publicSettings?.whatsapp ? `https://wa.me/${publicSettings.whatsapp.replace(/\D/g, "")}` : undefined, label: "WhatsApp" },
  ].filter(s => !!s.url);

  const [activeCarouselIdx, setActiveCarouselIdx] = useState(0);

  const currentCode = discountCodes && discountCodes.length > 0
    ? discountCodes[bannerIdx % discountCodes.length]
    : null;

  useEffect(() => {
    if (!currentCode?.expiresAt) { setTimeLeft(null); return; }
    const calc = () => {
      const diff = new Date(currentCode.expiresAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setTimeLeft({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    };
    calc();
    const iv = setInterval(calc, 1000);
    return () => clearInterval(iv);
  }, [currentCode]);

  function copyCode(code: string) {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const scrollCarousel = useCallback((direction: "left" | "right") => {
    if (!carouselRef.current) return;
    const el = carouselRef.current;
    const card = el.querySelector("[data-carousel-card]") as HTMLElement | null;
    const step = card ? card.offsetWidth + 20 : 300;
    const scrollAmount = direction === "right" ? step : -step;
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const handleScroll = () => {
      const card = el.querySelector("[data-carousel-card]") as HTMLElement | null;
      const step = card ? card.offsetWidth + 20 : 300;
      const idx = Math.round(Math.abs(el.scrollLeft) / step);
      setActiveCarouselIdx(idx);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const cafeFeatures = lang === "ar" ? [
    { icon: QrCode,           title: "قائمة QR تفاعلية",  desc: "يطلب العميل من هاتفه مباشرة بدون تماس" },
    { icon: MonitorSmartphone, title: "شاشة المطبخ KDS",   desc: "الطلبات تصل للمطبخ فورياً وتلقائياً" },
    { icon: Receipt,           title: "نقطة بيع POS",       desc: "كاشير ذكي متكامل مع الفواتير الضريبية" },
    { icon: Star,              title: "برنامج الولاء",       desc: "نقاط ومكافآت تعيد العملاء مراراً" },
    { icon: Truck,             title: "تتبع التوصيل",        desc: "العميل يتابع طلبه لحظة بلحظة" },
    { icon: Bell,              title: "إشعارات فورية",       desc: "تنبيهات مباشرة للعملاء والموظفين" },
    { icon: BarChart3,         title: "تقارير المبيعات",     desc: "تحليلات يومية لأفضل المنتجات" },
    { icon: Wifi,              title: "طلب عبر واتساب",      desc: "استقبال الطلبات من واتساب مباشرة" },
  ] : [
    { icon: QrCode,           title: "Interactive QR Menu",   desc: "Customers order from their phone without contact" },
    { icon: MonitorSmartphone, title: "Kitchen Display KDS",   desc: "Orders reach the kitchen instantly and automatically" },
    { icon: Receipt,           title: "POS System",            desc: "Smart cashier integrated with tax invoices" },
    { icon: Star,              title: "Loyalty Program",       desc: "Points & rewards that bring customers back" },
    { icon: Truck,             title: "Delivery Tracking",     desc: "Customers track their order in real time" },
    { icon: Bell,              title: "Instant Notifications", desc: "Direct alerts for customers and staff" },
    { icon: BarChart3,         title: "Sales Reports",         desc: "Daily analytics for top products" },
    { icon: Wifi,              title: "WhatsApp Orders",       desc: "Receive orders directly via WhatsApp" },
  ];

  const storeFeatures = lang === "ar" ? [
    { icon: ShoppingBag, title: "متجر احترافي",       desc: "واجهة فاخرة تعكس هوية علامتك" },
    { icon: Package,     title: "إدارة المنتجات",      desc: "ألوان، مقاسات، SKU، صور متعددة" },
    { icon: CreditCard,  title: "Apple Pay & STC Pay", desc: "دفع إلكتروني سريع وآمن" },
    { icon: Filter,      title: "فلترة ذكية",          desc: "العميل يجد ما يريد بسهولة تامة" },
    { icon: Tag,         title: "كوبونات وعروض",        desc: "خصومات مخصصة تزيد المبيعات" },
    { icon: TrendingUp,  title: "تقارير تفصيلية",      desc: "أفضل المنتجات والفئات العمرية" },
    { icon: RefreshCw,   title: "مخزون ذكي",           desc: "تنبيه تلقائي عند نفاد المخزون" },
    { icon: Truck,       title: "شركات الشحن",          desc: "ربط مع أرامكس، DHL، سمسا وغيرها" },
  ] : [
    { icon: ShoppingBag, title: "Professional Store",  desc: "Luxurious interface that reflects your brand identity" },
    { icon: Package,     title: "Product Management",  desc: "Colors, sizes, SKU, multiple images" },
    { icon: CreditCard,  title: "Apple Pay & STC Pay", desc: "Fast and secure online payment" },
    { icon: Filter,      title: "Smart Filters",       desc: "Customers find what they need easily" },
    { icon: Tag,         title: "Coupons & Offers",    desc: "Custom discounts that boost sales" },
    { icon: TrendingUp,  title: "Detailed Reports",    desc: "Top products and customer analytics" },
    { icon: RefreshCw,   title: "Smart Inventory",     desc: "Automatic alerts when stock runs low" },
    { icon: Truck,       title: "Shipping Companies",  desc: "Integrated with Aramex, DHL, SMSA and more" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <Navigation />

      {/* ── Creative Discount Banner ── */}
      <AnimatePresence>
        {currentCode && !bannerDismissed && (
          <motion.div
            key={bannerIdx}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="w-full relative overflow-hidden z-40"
            style={{ background: currentCode.bannerColor || "#111" }}
            data-testid="discount-banner"
          >
            {/* Animated shimmer overlay */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
              style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)" }}
            />

            {/* Ticker / Marquee strip for multiple codes */}
            {discountCodes && discountCodes.length > 1 && (
              <div className="overflow-hidden border-b border-white/10 py-1">
                <motion.div
                  className="flex items-center gap-6 whitespace-nowrap"
                  animate={{ x: ["0%", "-50%"] }}
                  transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                >
                  {[...discountCodes, ...discountCodes].map((c: any, i: number) => (
                    <span key={i} className="flex items-center gap-2 text-[10px] font-bold text-white/60 px-3">
                      <Tag className="w-2.5 h-2.5 text-white/40" />
                      <span className="font-black tracking-widest text-white">{c.code}</span>
                      <span>—</span>
                      <span className="flex items-center gap-0.5">{c.bannerTextAr || c.descriptionAr || <><span>خصم {c.value}</span>{c.type === "percentage" ? "%" : <SARIcon size={9} className="opacity-70" />}</>}</span>
                    </span>
                  ))}
                </motion.div>
              </div>
            )}

            {/* Main banner content */}
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4" dir="rtl">

              {/* Flame + discount badge */}
              <motion.div
                animate={{ scale: [1, 1.08, 1], rotate: [-2, 2, -2] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="flex-shrink-0 hidden sm:flex items-center justify-center w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-sm"
              >
                <Flame className="w-6 h-6 text-orange-300" />
              </motion.div>

              {/* Discount value big badge */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <span className="text-2xl sm:text-3xl font-black text-white drop-shadow-lg leading-none">
                    {currentCode.value}{currentCode.type === "percentage" ? "%" : <SARIcon size={18} className="opacity-90 mr-0.5" />}
                  </span>
                  <span className="block text-[9px] font-bold text-white/60 uppercase tracking-widest mt-0.5">
                    {lang === "ar" ? (currentCode.type === "percentage" ? "خصم" : "توفير") : (currentCode.type === "percentage" ? "OFF" : "SAVE")}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px h-10 bg-white/20 flex-shrink-0 hidden sm:block" />

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-xs sm:text-sm leading-tight truncate">
                  {currentCode.bannerTextAr || currentCode.descriptionAr || "عرض حصري لعملاء QIROX Studio"}
                </p>
                {currentCode.minOrderAmount > 0 && (
                  <p className="text-white/50 text-[10px] mt-0.5 flex items-center gap-1">{lang === "ar" ? <>عند طلب بقيمة {currentCode.minOrderAmount} <SARIcon size={9} className="opacity-60" /> أو أكثر</> : `On orders of ${currentCode.minOrderAmount} SAR or more`}</p>
                )}
              </div>

              {/* Code pill — click to copy */}
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => copyCode(currentCode.code)}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.18] hover:bg-white/[0.28] border border-white/25 backdrop-blur-sm transition-all cursor-pointer"
                data-testid="button-copy-code"
                title="انسخ الكود"
              >
                <span className="text-white font-black tracking-widest text-xs sm:text-sm">{currentCode.code}</span>
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                    </motion.div>
                  ) : (
                    <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Copy className="w-3.5 h-3.5 text-white/60" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Countdown */}
              {timeLeft && (
                <div className="flex-shrink-0 hidden md:flex items-center gap-1.5 bg-white/[0.12] border border-white/20 rounded-xl px-3 py-2">
                  <Timer className="w-3 h-3 text-white/50 flex-shrink-0" />
                  {(lang === "ar"
                    ? [{ v: timeLeft.d, l: "ي" }, { v: timeLeft.h, l: "س" }, { v: timeLeft.m, l: "د" }, { v: timeLeft.s, l: "ث" }]
                    : [{ v: timeLeft.d, l: "d" }, { v: timeLeft.h, l: "h" }, { v: timeLeft.m, l: "m" }, { v: timeLeft.s, l: "s" }]
                  ).map(({ v, l }, i) => (
                    <span key={i} className="flex items-center gap-0.5 text-white font-black text-xs tabular-nums">
                      <motion.span
                        key={v}
                        initial={{ y: -6, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >{String(v).padStart(2, "0")}</motion.span>
                      <span className="text-white/40 text-[9px]">{l}</span>
                      {i < 3 && <span className="text-white/30 text-[9px] mx-0.5">:</span>}
                    </span>
                  ))}
                </div>
              )}

              {/* Navigation dots (multiple codes) */}
              {discountCodes && discountCodes.length > 1 && (
                <div className="flex-shrink-0 flex items-center gap-1">
                  {discountCodes.map((_: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => setBannerIdx(i)}
                      className={`rounded-full transition-all duration-300 ${i === bannerIdx % discountCodes.length ? "w-4 h-2 bg-white" : "w-2 h-2 bg-white/30 hover:bg-white/50"}`}
                    />
                  ))}
                </div>
              )}

              {/* Dismiss */}
              <button
                onClick={() => setBannerDismissed(true)}
                className="flex-shrink-0 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                data-testid="button-dismiss-banner"
              >
                <X className="w-3.5 h-3.5 text-white/60" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO */}
      <section className="relative overflow-hidden w-full min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center pt-20 sm:pt-28 pb-12 sm:pb-16" data-testid="section-hero">
        <PageGraphics variant="hero-light" />
        <div className="absolute inset-0 bg-white dark:bg-gray-950" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #000 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="absolute top-40 left-1/4 w-96 h-96 rounded-full bg-black/[0.015] hidden md:block blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-72 h-72 rounded-full bg-black/[0.01] hidden md:block blur-3xl" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-black/40 dark:text-white/40 text-xs tracking-wider">{lang === "ar" ? "منصة الأنظمة الرقمية المتكاملة" : "Integrated Digital Systems Platform"}</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h1 dir="ltr" className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black font-heading text-black dark:text-white leading-[1.1] mb-2 tracking-tight">
                Build Systems.
              </h1>
              <h1
                dir="ltr"
                className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black font-heading leading-[1.1] mb-10 tracking-tight text-gray-300 dark:text-gray-700"
              >
                .Stay Human
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg sm:text-xl text-black/40 dark:text-white/40 mb-10 max-w-2xl mx-auto leading-relaxed"
              dir={dir}
            >
              {t("home.hero.subtitleFull")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
            >
              <Link href="/contact">
                <Button
                  size="lg"
                  className="h-11 sm:h-14 px-7 sm:px-10 text-sm sm:text-base w-full sm:w-auto rounded-full gap-2 font-bold bg-black text-white hover:bg-gray-900 no-default-hover-elevate no-default-active-elevate shadow-lg shadow-black/10"
                  data-testid="button-start-project"
                >
                  {t("home.startProject")}
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </Link>
              <Link href="/prices">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-11 sm:h-14 px-7 sm:px-10 text-sm sm:text-base w-full sm:w-auto border-black/10 text-black/60 rounded-full font-semibold bg-transparent hover:bg-black/[0.03] dark:text-white/60 dark:border-white/10"
                  data-testid="button-explore-solutions"
                >
                  {lang === "ar" ? "عرض الأسعار" : "View Pricing"}
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02]"
              data-testid="promo-banner"
            >
              <span className="text-[11px] font-bold tracking-wider text-black dark:text-white bg-black/[0.06] dark:bg-white/[0.06] px-2.5 py-0.5 rounded-full">{t("home.promo.new")}</span>
              <span className="text-black/40 dark:text-white/40 text-sm" dir={dir}>{t("home.promo.text")}</span>
              <ArrowLeft className="w-3.5 h-3.5 text-black/20 dark:text-white/20" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-6 relative z-10" data-testid="section-stats">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="border border-black/[0.06] dark:border-white/[0.06] rounded-2xl overflow-hidden bg-white dark:bg-gray-900/50"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-black/[0.06] dark:divide-white/[0.06] rtl:divide-x-reverse divide-y md:divide-y-0">
              {[
                { value: `${templates?.length || 8}+`, label: t("home.stats.readySystems") },
                { value: "6+", label: t("home.stats.sectorsCount") },
                { value: "5", label: "باقات متنوعة" },
                { value: "2", label: t("home.stats.locations") },
              ].map((stat, idx) => (
                <div key={idx} className="px-3 py-5 sm:px-6 sm:py-8 text-center" data-testid={`stat-card-${idx}`}>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-black mb-1 sm:mb-2 font-heading text-black dark:text-white">
                    {stat.value}
                  </div>
                  <div className="text-black/35 dark:text-white/35 text-xs sm:text-sm" dir={dir}>{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* SERVICES GRID */}
      <section className="py-20 md:py-28 relative" data-testid="section-services">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <div className="text-center mb-16" dir={dir}>
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] mb-5">
                <Zap className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
                <span className="text-black/40 dark:text-white/40 text-xs tracking-wider uppercase">{t("home.services.badge")}</span>
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold font-heading text-black dark:text-white mb-4">
                {t("home.services.title")}{" "}
                <span className="text-gray-400 dark:text-gray-500">{t("home.services.titleHighlight")}</span>
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-black/35 dark:text-white/35 max-w-xl mx-auto text-base">
                {t("home.services.subtitle")}
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
              {[
                {
                  icon: UtensilsCrossed,
                  title: t("home.services.restaurants.title"),
                  desc: t("home.services.restaurants.desc"),
                  features: [t("home.services.restaurants.f1"), t("home.services.restaurants.f2"), t("home.services.restaurants.f3"), t("home.services.restaurants.f4")],
                  badge: lang === "ar" ? "🍽️ مطاعم وكافيهات"     : "🍽️ Restaurants & Cafes",
                  accent: "hover:shadow-orange-500/10"
                },
                {
                  icon: Store,
                  title: t("home.services.stores.title"),
                  desc: t("home.services.stores.desc"),
                  features: [t("home.services.stores.f1"), t("home.services.stores.f2"), t("home.services.stores.f3"), t("home.services.stores.f4")],
                  badge: lang === "ar" ? "🛍️ متاجر إلكترونية"    : "🛍️ E-Commerce Stores",
                  accent: "hover:shadow-blue-500/10"
                },
                {
                  icon: GraduationCap,
                  title: t("home.services.education.title"),
                  desc: t("home.services.education.desc"),
                  features: [t("home.services.education.f1"), t("home.services.education.f2"), t("home.services.education.f3"), t("home.services.education.f4")],
                  badge: lang === "ar" ? "📚 تعليم وأكاديميات"    : "📚 Education & Academies",
                  accent: "hover:shadow-violet-500/10"
                },
                {
                  icon: Building2,
                  title: t("home.services.enterprise.title"),
                  desc: t("home.services.enterprise.desc"),
                  features: [t("home.services.enterprise.f1"), t("home.services.enterprise.f2"), t("home.services.enterprise.f3"), t("home.services.enterprise.f4")],
                  badge: lang === "ar" ? "🏢 شركات ومؤسسات"      : "🏢 Corporates & Enterprises",
                  accent: "hover:shadow-gray-500/10"
                },
              ].map((path, idx) => (
                <motion.div key={idx} variants={fadeUp} custom={idx}>
                  <div
                    className={`rounded-[24px] border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-5 sm:p-8 md:p-10 h-full group transition-all duration-300 hover:border-black/[0.1] dark:hover:border-white/[0.1] hover:shadow-xl ${path.accent}`}
                    data-testid={`service-path-${idx}`}
                    dir={dir}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <span className="text-xs px-3 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.04] text-black/40 dark:text-white/40 font-medium">
                        {path.badge}
                      </span>
                      <Link href="/systems">
                        <ArrowUpRight className="w-5 h-5 text-black/10 dark:text-white/10 group-hover:text-black/40 dark:group-hover:text-white/40 transition-all duration-300 cursor-pointer" />
                      </Link>
                    </div>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-black/[0.04] dark:bg-white/[0.04] transition-all duration-300 mb-5">
                      <path.icon className="w-6 h-6 text-black/40 dark:text-white/40" />
                    </div>
                    <h3 className="text-xl font-bold font-heading text-black dark:text-white mb-3">{path.title}</h3>
                    <p className="text-sm text-black/40 dark:text-white/40 leading-relaxed mb-6">{path.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {path.features.map((f, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-3.5 py-1.5 rounded-full border border-black/[0.06] dark:border-white/[0.06] text-black/40 dark:text-white/40 bg-black/[0.02] dark:bg-white/[0.02]"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CAFE SYSTEM DEEP DIVE */}
      <section className="py-20 md:py-28 bg-black relative overflow-hidden" data-testid="section-cafe">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-16" dir={dir}>
              <div>
                <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] mb-5">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-white/50" />
                  <span className="text-white/50 text-xs tracking-wider uppercase">{lang === "ar" ? "نظام الكافيهات والمطاعم" : "Restaurants & Cafes System"}</span>
                </motion.div>
                <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold font-heading text-white mb-4">
                  {lang === "ar" ? <>كل ما يحتاجه<br /><span className="text-white/30">مطعمك أو كافيهك</span></> : <>Everything your<br /><span className="text-white/30">restaurant or cafe needs</span></>}
                </motion.h2>
                <motion.p variants={fadeUp} custom={2} className="text-white/40 max-w-lg text-base leading-relaxed">
                  {lang === "ar" ? "من القائمة الرقمية إلى شاشة المطبخ إلى تقارير المبيعات — منظومة متكاملة تعمل بانسجام تام" : "From digital menu to kitchen display to sales reports — a complete integrated system"}
                </motion.p>
              </div>
              <motion.div variants={fadeUp} custom={3}>
                <Link href="/order">
                  <Button className="h-12 px-8 rounded-full bg-white text-black hover:bg-gray-100 font-bold gap-2" data-testid="button-cafe-cta">
                    {lang === "ar" ? "ابدأ مشروعك" : "Start Your Project"}
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
              </motion.div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {cafeFeatures.map((feature, idx) => (
                <motion.div key={idx} variants={fadeUp} custom={idx}>
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 h-full group hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300" data-testid={`cafe-feature-${idx}`}>
                    <div className="w-11 h-11 rounded-xl bg-white/[0.07] flex items-center justify-center mb-4 group-hover:bg-white/[0.1] transition-colors">
                      <feature.icon className="w-5 h-5 text-white/60" />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-xs text-white/35 leading-relaxed">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* STORE / E-COMMERCE DEEP DIVE */}
      <section className="py-20 md:py-28 bg-[#fafafa] dark:bg-gray-900/30 relative" data-testid="section-store">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-16" dir={dir}>
              <div>
                <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900/60 mb-5">
                  <ShoppingBag className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
                  <span className="text-black/40 dark:text-white/40 text-xs tracking-wider uppercase">{lang === "ar" ? "نظام المتاجر الإلكترونية" : "E-Commerce Store System"}</span>
                </motion.div>
                <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold font-heading text-black dark:text-white mb-4">
                  {lang === "ar" ? <>متجرك الاحترافي<br /><span className="text-gray-400 dark:text-gray-500">بكل ما تحتاج</span></> : <>Your professional store<br /><span className="text-gray-400 dark:text-gray-500">with everything you need</span></>}
                </motion.h2>
                <motion.p variants={fadeUp} custom={2} className="text-black/40 dark:text-white/40 max-w-lg text-base leading-relaxed">
                  {lang === "ar" ? "من إدارة المنتجات والمخزون إلى Apple Pay وتقارير المبيعات — كل شيء في مكان واحد" : "From product management to Apple Pay and sales reports — everything in one place"}
                </motion.p>
              </div>
              <motion.div variants={fadeUp} custom={3}>
                <Link href="/order">
                  <Button className="h-12 px-8 rounded-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-900 font-bold gap-2" data-testid="button-store-cta">
                    {lang === "ar" ? "أنشئ متجرك" : "Create Your Store"}
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
              </motion.div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {storeFeatures.map((feature, idx) => (
                <motion.div key={idx} variants={fadeUp} custom={idx}>
                  <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900/60 p-6 h-full group hover:shadow-xl hover:shadow-black/[0.05] hover:border-black/[0.1] dark:hover:border-white/[0.1] transition-all duration-300" data-testid={`store-feature-${idx}`}>
                    <div className="w-11 h-11 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center mb-4 group-hover:bg-black/[0.07] dark:group-hover:bg-white/[0.07] transition-colors">
                      <feature.icon className="w-5 h-5 text-black/40 dark:text-white/40" />
                    </div>
                    <h3 className="text-sm font-bold text-black dark:text-white mb-2">{feature.title}</h3>
                    <p className="text-xs text-black/35 dark:text-white/35 leading-relaxed">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* MOBILE APP SECTION — App Store + Play Store */}
      <section className="py-20 md:py-28 relative overflow-hidden" data-testid="section-mobile-app">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <div className="max-w-5xl mx-auto">
              <div className="rounded-[24px] sm:rounded-[32px] bg-gradient-to-br from-gray-950 via-gray-900 to-black p-6 sm:p-10 md:p-16 relative overflow-hidden border border-white/[0.05]">
                <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/[0.02] -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-white/[0.015] translate-y-1/2 -translate-x-1/4" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
                  <div dir={dir}>
                    <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] mb-6">
                      <Smartphone className="w-3.5 h-3.5 text-white/50" />
                      <span className="text-white/50 text-xs tracking-wider uppercase">{lang === "ar" ? "تطبيقات الجوال" : "Mobile Apps"}</span>
                    </motion.div>
                    <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold font-heading text-white mb-4">
                      {lang === "ar"
                        ? <>وصول عملاءك<br /><span className="text-white/40">من App Store وPlay Store</span></>
                        : <>Your customers on<br /><span className="text-white/40">App Store & Play Store</span></>}
                    </motion.h2>
                    <motion.p variants={fadeUp} custom={2} className="text-white/40 text-base leading-relaxed mb-8">
                      {lang === "ar"
                        ? "احصل على تطبيق جوال احترافي منشور على متجر Apple و Google Play بأسلوب يعكس هوية علامتك التجارية"
                        : "Get a professional mobile app published on Apple and Google Play that reflects your brand identity"}
                    </motion.p>

                    <motion.div variants={fadeUp} custom={3} className="space-y-3 mb-8">
                      {(lang === "ar" ? [
                        "تطبيق iOS و Android بنفس الكود",
                        "نشر على App Store و Google Play",
                        "إشعارات فورية Push Notifications",
                        "يعمل بدون إنترنت (Offline Mode)",
                      ] : [
                        "iOS & Android from one codebase",
                        "Published on App Store & Google Play",
                        "Push Notifications",
                        "Works offline (Offline Mode)",
                      ]).map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-white/60">
                          <div className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-white/70" />
                          </div>
                          {item}
                        </div>
                      ))}
                    </motion.div>

                    <motion.div variants={fadeUp} custom={4} className="space-y-6">
                      <Link href="/prices">
                        <Button className="h-12 px-8 rounded-full bg-white text-black hover:bg-gray-100 font-bold gap-2" data-testid="button-mobile-app-cta">
                          {lang === "ar" ? <span className="flex items-center gap-1">يُضاف بـ 1,000 <SARIcon size={13} className="opacity-70" /> فقط</span> : "Add for only 1,000 SAR"}
                          <ArrowLeft className="w-4 h-4" />
                        </Button>
                      </Link>
                    </motion.div>
                  </div>

                  <motion.div variants={fadeUp} custom={2} className="grid grid-cols-2 gap-4">
                    {/* Apple App Store — creative card */}
                    <div className="rounded-2xl border border-white/[0.1] bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-5 group hover:from-white/[0.11] hover:border-white/[0.18] transition-all duration-300 relative overflow-hidden" data-testid="mobile-feature-0">
                      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/[0.04] blur-xl pointer-events-none" />
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.07)] group-hover:shadow-[0_0_28px_rgba(255,255,255,0.13)] transition-all">
                          <SiApple className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-[10px] font-bold text-white/40 bg-white/[0.07] border border-white/[0.08] px-2 py-0.5 rounded-full">iOS</span>
                      </div>
                      <p className="text-sm font-bold text-white mb-1">App Store</p>
                      <p className="text-[11px] text-white/35 leading-relaxed">{lang === "ar" ? "نشر على متجر Apple الرسمي" : "Published on Apple's official store"}</p>
                    </div>

                    {/* Google Play Store — creative card */}
                    <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#01875f]/10 via-[#4285f4]/8 to-[#fbbc04]/8 p-5 group hover:from-[#01875f]/16 hover:via-[#4285f4]/14 hover:to-[#fbbc04]/12 hover:border-white/[0.14] transition-all duration-300 relative overflow-hidden" data-testid="mobile-feature-1">
                      <div className="absolute -bottom-5 -left-5 w-20 h-20 rounded-full bg-[#4285f4]/10 blur-xl pointer-events-none" />
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(66,133,244,0.12)] group-hover:shadow-[0_0_28px_rgba(66,133,244,0.22)] transition-all">
                          <SiGoogleplay className="w-5 h-5 text-[#4285f4]" />
                        </div>
                        <span className="text-[10px] font-bold text-white/40 bg-white/[0.07] border border-white/[0.08] px-2 py-0.5 rounded-full">Android</span>
                      </div>
                      <p className="text-sm font-bold text-white mb-1">Play Store</p>
                      <p className="text-[11px] text-white/35 leading-relaxed">{lang === "ar" ? "نشر على Google Play الرسمي" : "Published on Google Play"}</p>
                    </div>

                    {/* Push Notifications */}
                    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 group hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300" data-testid="mobile-feature-2">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl bg-white/[0.07] flex items-center justify-center">
                          <Bell className="w-4 h-4 text-white/60" />
                        </div>
                        <span className="text-[10px] font-bold text-white/30 bg-white/[0.05] px-2 py-0.5 rounded-full">Push</span>
                      </div>
                      <p className="text-xs font-bold text-white mb-1">{lang === "ar" ? "إشعارات ذكية" : "Smart Notifications"}</p>
                      <p className="text-[11px] text-white/30 leading-relaxed">{lang === "ar" ? "تواصل مع عملائك لحظياً" : "Reach your customers instantly"}</p>
                    </div>

                    {/* Native Experience */}
                    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 group hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300" data-testid="mobile-feature-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl bg-white/[0.07] flex items-center justify-center">
                          <Smartphone className="w-4 h-4 text-white/60" />
                        </div>
                        <span className="text-[10px] font-bold text-white/30 bg-white/[0.05] px-2 py-0.5 rounded-full">Native</span>
                      </div>
                      <p className="text-xs font-bold text-white mb-1">{lang === "ar" ? "تجربة أصلية" : "Native Experience"}</p>
                      <p className="text-[11px] text-white/30 leading-relaxed">{lang === "ar" ? "سرعة وسلاسة مثل التطبيقات الأصلية" : "Speed and smoothness like native apps"}</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* APP DOWNLOADS SECTION */}
      <section className="py-20 md:py-28 relative bg-[#fafafa] dark:bg-gray-900/30" data-testid="section-downloads">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <div className="text-center mb-14" dir={dir}>
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.04] mb-5">
                <Download className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
                <span className="text-black/40 dark:text-white/40 text-xs tracking-wider uppercase">{lang === "ar" ? "تحميل الأنظمة" : "Download Our Apps"}</span>
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold font-heading text-black dark:text-white mb-4">
                {lang === "ar" ? <>حمّل نظامك<br /><span className="text-black/30 dark:text-white/30">على جميع الأجهزة</span></> : <>Download Your System<br /><span className="text-black/30 dark:text-white/30">on All Devices</span></>}
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-black/40 dark:text-white/40 text-base max-w-xl mx-auto leading-relaxed">
                {lang === "ar"
                  ? "أنظمة QIROX متاحة على متجر آبل، جوجل بلاي، ومتجر مايكروسوفت. حمّل تطبيقك الآن أو انتظر الإطلاق قريباً."
                  : "QIROX systems are available on App Store, Google Play, and Microsoft Store. Download your app now or wait for the upcoming launch."}
              </motion.p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                {
                  key: "appStore",
                  icon: <SiApple className="w-8 h-8" />,
                  iconColor: "text-white",
                  iconBg: "bg-black dark:bg-white/10",
                  gradientFrom: "from-gray-900",
                  gradientTo: "to-gray-700",
                  platform: lang === "ar" ? "آبل" : "Apple",
                  name: "App Store",
                  desc: lang === "ar" ? "لأجهزة iPhone و iPad" : "For iPhone & iPad",
                  badge: "iOS",
                  badgeColor: "bg-white/10 text-white/60",
                  available: appDownloads?.appStore.enabled && !!appDownloads?.appStore.url,
                  url: appDownloads?.appStore.url,
                  dark: true,
                },
                {
                  key: "playStore",
                  icon: <SiGoogleplay className="w-7 h-7" />,
                  iconColor: "text-white",
                  iconBg: "bg-[#01875f]",
                  gradientFrom: "from-[#0d2d1c]",
                  gradientTo: "to-[#0a4a2a]",
                  platform: lang === "ar" ? "جوجل" : "Google",
                  name: "Play Store",
                  desc: lang === "ar" ? "لأجهزة Android" : "For Android devices",
                  badge: "Android",
                  badgeColor: "bg-[#01875f]/20 text-[#4ade80]",
                  available: appDownloads?.playStore.enabled && !!appDownloads?.playStore.url,
                  url: appDownloads?.playStore.url,
                  dark: true,
                },
                {
                  key: "msStore",
                  icon: <AppWindow className="w-7 h-7" />,
                  iconColor: "text-white",
                  iconBg: "bg-[#0078d4]",
                  gradientFrom: "from-[#0a1929]",
                  gradientTo: "to-[#0c2a4a]",
                  platform: lang === "ar" ? "مايكروسوفت" : "Microsoft",
                  name: "Microsoft Store",
                  desc: lang === "ar" ? "لأجهزة Windows" : "For Windows devices",
                  badge: "Windows",
                  badgeColor: "bg-[#0078d4]/20 text-[#60a5fa]",
                  available: appDownloads?.msStore.enabled && !!appDownloads?.msStore.url,
                  url: appDownloads?.msStore.url,
                  dark: true,
                },
              ].map((store, i) => (
                <motion.div key={store.key} variants={fadeUp} custom={i + 3}>
                  <div
                    className={`rounded-3xl bg-gradient-to-br ${store.gradientFrom} ${store.gradientTo} border border-white/[0.07] p-7 flex flex-col h-full relative overflow-hidden group`}
                    data-testid={`download-card-${store.key}`}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.02] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-14 h-14 rounded-2xl ${store.iconBg} flex items-center justify-center shadow-lg`}>
                        <span className={store.iconColor}>{store.icon}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/[0.08] ${store.badgeColor}`}>
                        {store.badge}
                      </span>
                    </div>

                    <div className="flex-1" dir={dir}>
                      <p className="text-[11px] text-white/40 uppercase tracking-widest mb-1">{store.platform}</p>
                      <h3 className="text-lg font-bold text-white mb-1">{store.name}</h3>
                      <p className="text-[13px] text-white/40 mb-6">{store.desc}</p>
                    </div>

                    {store.available ? (
                      <a
                        href={store.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid={`button-download-${store.key}`}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 text-white text-sm font-bold transition-all duration-200 group-hover:shadow-lg"
                      >
                        <Download className="w-4 h-4" />
                        {lang === "ar" ? "تحميل الآن" : "Download Now"}
                      </a>
                    ) : store.key === "appStore" ? (
                      <div className="rounded-xl bg-white/[0.06] border border-white/[0.08] p-4 space-y-3" dir={lang === "ar" ? "rtl" : "ltr"} data-testid="ios-install-guide">
                        <p className="text-[11px] text-white/50 font-semibold uppercase tracking-wider">
                          {lang === "ar" ? "ثبّت كتطبيق على iPhone" : "Install as iPhone App"}
                        </p>

                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-black flex items-center justify-center">1</span>
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <Share2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                            <span className="text-[12px] text-white/80 leading-snug">
                              {lang === "ar"
                                ? <>اضغط زر <strong className="text-blue-300">المشاركة</strong> ⬆ في الشريط السفلي</>
                                : <>Tap the <strong className="text-blue-300">Share</strong> ⬆ button at the bottom</>}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 text-green-300 text-[11px] font-black flex items-center justify-center">2</span>
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <PlusSquare className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-[12px] text-white/80 leading-snug">
                              {lang === "ar"
                                ? <>اختر <strong className="text-green-300">إضافة إلى الشاشة الرئيسية</strong></>
                                : <>Select <strong className="text-green-300">Add to Home Screen</strong></>}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-300 text-[11px] font-black flex items-center justify-center">3</span>
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <Bell className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                            <span className="text-[12px] text-white/80 leading-snug">
                              {lang === "ar"
                                ? <>اضغط <strong className="text-yellow-300">إضافة</strong> — ستصلك جميع الإشعارات!</>
                                : <>Tap <strong className="text-yellow-300">Add</strong> — you'll receive all notifications!</>}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-white/[0.07] flex items-center gap-2">
                          <Bell className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                          <p className="text-[11px] text-white/40 leading-snug">
                            {lang === "ar"
                              ? "ستصلك إشعارات العقود والفواتير والتحديثات فوراً"
                              : "Get instant contract, invoice & update notifications"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] cursor-default">
                        <Clock className="w-3.5 h-3.5 text-white/25" />
                        <span className="text-white/30 text-sm font-medium">{lang === "ar" ? "قريباً يتوفر" : "Coming Soon"}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* SYSTEMS CAROUSEL */}
      <section className="py-20 md:py-28 relative bg-[#fafafa] dark:bg-gray-900/30" data-testid="section-carousel">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-3" dir={dir}>
                <motion.div variants={fadeUp} custom={0}>
                  <span className="text-black/40 dark:text-white/40 text-sm font-semibold mb-3 block">{t("home.carousel.label")}</span>
                  <h2 className="text-3xl md:text-4xl font-bold font-heading text-black dark:text-white mb-4 leading-tight">
                    {t("home.carousel.title")}{" "}
                    <span className="text-gray-400 dark:text-gray-500">{t("home.carousel.titleHighlight")}</span>
                  </h2>
                  <p className="text-black/40 dark:text-white/40 text-sm leading-relaxed mb-8">
                    {t("home.carousel.desc")}
                  </p>
                  <div className="flex gap-2">
                    {templates?.slice(0, 5).map((_, idx) => (
                      <div
                        key={idx}
                        className={`rounded-full transition-all duration-300 ${
                          idx === activeCarouselIdx
                            ? "w-6 h-2 bg-black dark:bg-white"
                            : "w-2 h-2 bg-black/10 dark:bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                </motion.div>
              </div>

              <div className="lg:col-span-9 relative min-w-0">
                <div className="flex items-center gap-3 mb-4 justify-end">
                  <button
                    onClick={() => scrollCarousel("right")}
                    className="w-10 h-10 rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white hover:border-black/20 dark:hover:border-white/20 transition-all"
                    data-testid="button-carousel-prev"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => scrollCarousel("left")}
                    className="w-10 h-10 rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white hover:border-black/20 dark:hover:border-white/20 transition-all"
                    data-testid="button-carousel-next"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>

                <div
                  ref={carouselRef}
                  dir={dir}
                  className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {templates?.map((template, idx) => {
                    const Icon = sectorIcons[template.icon || "Globe"] || Globe;
                    return (
                      <Link key={template.id} href="/systems" className="flex-shrink-0 block w-[260px] sm:w-[300px] snap-start" data-carousel-card>
                        <div
                          className="w-full h-full bg-white dark:bg-gray-900/60 rounded-[24px] p-6 sm:p-8 cursor-pointer group border border-black/[0.04] dark:border-white/[0.04] hover:border-black/[0.08] dark:hover:border-white/[0.08] transition-all hover:shadow-xl hover:shadow-black/[0.04]"
                          data-testid={`carousel-card-${template.slug}`}
                        >
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-black/[0.04] dark:bg-white/[0.04] mb-6">
                            <Icon className="w-5 h-5 text-black/40 dark:text-white/40" />
                          </div>
                          <h3 className="text-lg font-bold text-black dark:text-white mb-2" dir={dir}>{lang === "ar" ? template.nameAr : (template.name || template.nameAr)}</h3>
                          <p className="text-sm text-black/40 dark:text-white/40 leading-relaxed mb-6 line-clamp-3" dir={dir}>
                            {lang === "ar" ? template.descriptionAr : (template.description || template.descriptionAr)}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs px-3 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.04] text-black/40 dark:text-white/40 font-medium max-w-[130px] truncate block">
                              {template.category}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center group-hover:bg-black dark:group-hover:bg-white group-hover:text-white transition-colors">
                              <ArrowUpRight className="w-4 h-4 text-black/30 dark:text-white/30 group-hover:text-white dark:group-hover:text-black transition-colors" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* WHY QIROX */}
      <section className="py-20 md:py-28 relative" data-testid="section-why">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <div className="text-center mb-16" dir={dir}>
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] dark:border-white/[0.06] bg-[#fafafa] dark:bg-gray-900/60 mb-5">
                <Sparkles className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
                <span className="text-black/40 dark:text-white/40 text-xs tracking-wider uppercase">{t("home.why.badge")}</span>
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold font-heading text-black dark:text-white mb-4">
                {t("home.why.title")}{" "}
                <span className="text-gray-400 dark:text-gray-500">QIROX</span>
                {lang === "ar" ? "؟" : "?"}
              </motion.h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto mb-10">
              {[
                { icon: Layers, title: t("home.why.scalable.title"), desc: t("home.why.scalable.desc"), accent: "from-blue-500/5 to-cyan-500/5" },
                { icon: Palette, title: t("home.why.design.title"), desc: t("home.why.design.desc"), accent: "from-violet-500/5 to-purple-500/5" },
                { icon: Headphones, title: t("home.why.support.title"), desc: t("home.why.support.desc"), accent: "from-emerald-500/5 to-green-500/5" },
                { icon: Shield, title: t("home.why.security.title"), desc: t("home.why.security.desc"), accent: "from-orange-500/5 to-amber-500/5" },
              ].map((item, idx) => (
                <motion.div key={idx} variants={fadeUp} custom={idx}>
                  <div
                    className={`rounded-[24px] border border-black/[0.06] dark:border-white/[0.06] bg-gradient-to-br ${item.accent} p-5 sm:p-8 h-full transition-all duration-300 hover:shadow-xl hover:shadow-black/[0.04] hover:border-black/[0.1] dark:hover:border-white/[0.1]`}
                    data-testid={`why-card-${idx}`}
                    dir={dir}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-black/[0.04] dark:bg-white/[0.04]">
                      <item.icon className="w-5 h-5 text-black/40 dark:text-white/40" />
                    </div>
                    <h3 className="text-base font-bold font-heading text-black dark:text-white mb-3">{item.title}</h3>
                    <p className="text-sm text-black/35 dark:text-white/35 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div variants={fadeUp} custom={4} className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
              {[
                { icon: Cloud, title: "استضافة سحابية آمنة", desc: "AWS / DigitalOcean — بمعدل uptime 99.9%" },
                { icon: Lock, title: "حماية متقدمة للبيانات", desc: "SSL، تشفير كامل، نسخ احتياطي يومي" },
                { icon: Globe2, title: "متعدد اللغات RTL/LTR", desc: "يدعم العربية والإنجليزية بشكل كامل" },
              ].map((item, i) => (
                <div key={i} className="rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-[#fafafa] dark:bg-gray-900/40 p-6 flex items-start gap-4" data-testid={`trust-feature-${i}`}>
                  <div className="w-10 h-10 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-black/40 dark:text-white/40" />
                  </div>
                  <div dir={dir}>
                    <p className="text-sm font-bold text-black dark:text-white mb-1">{item.title}</p>
                    <p className="text-xs text-black/35 dark:text-white/35 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PATHFINDER */}
      <section className="py-20 md:py-28 relative bg-[#fafafa] dark:bg-gray-900/30" data-testid="section-pathfinder">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            custom={0}
            className="rounded-[24px] border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900/50 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-6 sm:p-10 md:p-14 flex flex-col justify-center" dir={dir}>
                <span className="text-black/40 dark:text-white/40 text-sm font-semibold mb-3">{t("home.pathfinder.label")}</span>
                <h2 className="text-3xl md:text-4xl font-bold font-heading text-black dark:text-white mb-4 leading-tight">
                  {t("home.pathfinder.title")}
                </h2>
                <p className="text-black/40 dark:text-white/40 text-base leading-relaxed mb-8 max-w-md">
                  {t("home.pathfinder.desc")}
                </p>
                <div>
                  <Link href="/contact">
                    <Button
                      size="lg"
                      className="h-13 px-8 text-base rounded-full gap-2 font-semibold bg-black text-white hover:bg-gray-900"
                      data-testid="button-pathfinder-cta"
                    >
                      {t("home.pathfinder.cta")}
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="p-6 sm:p-10 md:p-14 border-t md:border-t-0 md:border-r border-black/[0.06] dark:border-white/[0.06] rtl:md:border-r-0 rtl:md:border-l rtl:border-black/[0.06] dark:rtl:border-white/[0.06]" dir={dir}>
                <h3 className="text-black/40 dark:text-white/40 text-sm font-semibold mb-8 tracking-wider uppercase">{t("home.pathfinder.quickLinks")}</h3>
                <div className="space-y-1">
                  {[
                    { href: "/systems", labelKey: "home.pathfinder.systems" as const },
                    { href: "/prices", labelKey: "home.pathfinder.packages" as const },
                    { href: "/about", labelKey: "home.pathfinder.aboutPlatform" as const },
                    { href: "/contact", labelKey: "home.pathfinder.contact" as const },
                  ].map((link) => (
                    <Link key={link.href} href={link.href}>
                      <div
                        className="flex items-center justify-between py-4 px-4 rounded-xl text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-all cursor-pointer group"
                        data-testid={`pathfinder-link-${link.href.replace("/", "")}`}
                      >
                        <span className="text-base font-medium">{t(link.labelKey)}</span>
                        <ArrowLeft className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PARTNERS MARQUEE */}
      <PartnersMarquee lang={lang} dir={dir} />

      {/* INTEGRATION PARTNERS */}
      <IntegrationPartnersMarquee lang={lang} dir={dir} />

      {/* FINAL CTA */}
      <section className="py-20 md:py-28 relative" data-testid="section-spotlight">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <div className="rounded-[24px] sm:rounded-[32px] p-7 sm:p-12 md:p-20 text-center relative overflow-hidden bg-black">
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
              <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-white/[0.01] -translate-y-1/2" />
              <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-white/[0.015] translate-y-1/2" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] mb-8">
                  <Sparkles className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-white/40 text-xs tracking-wider">ابدأ رحلتك الرقمية اليوم</span>
                </div>

                <h2 className="text-3xl md:text-6xl font-bold font-heading text-white mb-6" dir={dir}>
                  {t("home.spotlight.title")}
                </h2>
                <p className="text-white/50 text-lg max-w-2xl mx-auto mb-10" dir={dir}>
                  {t("home.spotlight.desc")}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/contact">
                    <Button
                      size="lg"
                      className="h-14 px-10 text-base rounded-full gap-2 font-bold bg-white text-black hover:bg-gray-100 shadow-xl shadow-white/10"
                      data-testid="button-cta-start"
                    >
                      {t("home.spotlight.cta")}
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/prices">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-14 px-10 text-base border-white/15 text-white/70 rounded-full font-semibold bg-transparent hover:bg-white/10"
                      data-testid="button-cta-prices"
                    >
                      {t("home.spotlight.prices")}
                    </Button>
                  </Link>
                </div>

                <div className="mt-14 flex flex-wrap items-center justify-center gap-6 text-sm text-white/20">
                  <span>www.qiroxstudio.online</span>
                  <span className="w-1 h-1 rounded-full bg-white/10" />
                  <span>{t("home.spotlight.riyadh")}</span>
                  <span className="w-1 h-1 rounded-full bg-white/10" />
                  <span>{t("home.spotlight.cairo")}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {SOCIAL_ITEMS.length > 0 && (
        <section className="py-16 relative" data-testid="section-social">
          <div className="container mx-auto px-4 text-center">
            <p className="text-[10px] tracking-[0.3em] uppercase text-black/25 dark:text-white/25 font-semibold mb-8" dir={dir}>
              {lang === "ar" ? "تابعنا على منصات التواصل" : "Follow Us"}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {SOCIAL_ITEMS.map(s => (
                <a
                  key={s.key}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  data-testid={`home-social-${s.key}`}
                  className="w-12 h-12 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black dark:hover:bg-white border border-black/[0.07] dark:border-white/[0.07] flex items-center justify-center text-black/35 dark:text-white/35 hover:text-white dark:hover:text-black transition-all duration-200 hover:scale-105"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <InstallPrompt />
      <Footer />
    </div>
  );
}

function IntegrationPartnersMarquee({ lang, dir }: { lang: string; dir: string }) {
  const L = lang === "ar";

  const categories = [
    {
      key: "bigtech",
      label: L ? "تقنية" : "Big Tech",
      color: "bg-blue-600",
      companies: [
        { name: "Microsoft", domain: "microsoft.com" },
        { name: "Google", domain: "google.com" },
        { name: "Apple", domain: "apple.com" },
        { name: "Amazon", domain: "amazon.com" },
        { name: "Meta", domain: "meta.com" },
        { name: "IBM", domain: "ibm.com" },
        { name: "Oracle", domain: "oracle.com" },
        { name: "Salesforce", domain: "salesforce.com" },
        { name: "SAP", domain: "sap.com" },
        { name: "Adobe", domain: "adobe.com" },
        { name: "ServiceNow", domain: "servicenow.com" },
        { name: "Cisco", domain: "cisco.com" },
      ],
    },
    {
      key: "ai",
      label: L ? "ذكاء اصطناعي" : "AI",
      color: "bg-emerald-500",
      companies: [
        { name: "NVIDIA", domain: "nvidia.com" },
        { name: "OpenAI", domain: "openai.com" },
        { name: "Anthropic", domain: "anthropic.com" },
        { name: "Mistral AI", domain: "mistral.ai" },
        { name: "Hugging Face", domain: "huggingface.co" },
        { name: "Cohere", domain: "cohere.com" },
        { name: "Stability AI", domain: "stability.ai" },
        { name: "Perplexity", domain: "perplexity.ai" },
        { name: "DeepMind", domain: "deepmind.com" },
        { name: "xAI", domain: "x.ai" },
      ],
    },
    {
      key: "cloud",
      label: L ? "السحابة" : "Cloud",
      color: "bg-sky-500",
      companies: [
        { name: "AWS", domain: "aws.amazon.com" },
        { name: "Azure", domain: "azure.microsoft.com" },
        { name: "Google Cloud", domain: "cloud.google.com" },
        { name: "Cloudflare", domain: "cloudflare.com" },
        { name: "DigitalOcean", domain: "digitalocean.com" },
        { name: "Alibaba Cloud", domain: "alibabacloud.com" },
        { name: "Vultr", domain: "vultr.com" },
        { name: "Supabase", domain: "supabase.com" },
        { name: "Vercel", domain: "vercel.com" },
        { name: "Netlify", domain: "netlify.com" },
        { name: "Render", domain: "render.com" },
        { name: "Railway", domain: "railway.app" },
        { name: "Hetzner", domain: "hetzner.com" },
      ],
    },
    {
      key: "payment",
      label: L ? "الدفع" : "Payment",
      color: "bg-violet-500",
      companies: [
        { name: "Stripe", domain: "stripe.com" },
        { name: "PayPal", domain: "paypal.com" },
        { name: "Visa", domain: "visa.com" },
        { name: "Mastercard", domain: "mastercard.com" },
        { name: "Apple Pay", domain: "apple.com" },
        { name: "Google Pay", domain: "pay.google.com" },
        { name: "Adyen", domain: "adyen.com" },
        { name: "Worldpay", domain: "worldpay.com" },
        { name: "Square", domain: "squareup.com" },
        { name: "Checkout.com", domain: "checkout.com" },
        { name: "Klarna", domain: "klarna.com" },
        { name: "Tabby", domain: "tabby.ai" },
        { name: "Tamara", domain: "tamara.co" },
        { name: "HyperPay", domain: "hyperpay.com" },
        { name: "OPay", domain: "opayweb.com" },
        { name: "KNET", domain: "knet.com.kw" },
        { name: "Benefit", domain: "benefit.bh" },
        { name: "Fawry", domain: "fawry.com" },
        { name: "Ziina", domain: "ziina.com" },
      ],
    },
    {
      key: "devtools",
      label: L ? "أدوات التطوير" : "Dev Tools",
      color: "bg-gray-600",
      companies: [
        { name: "GitHub", domain: "github.com" },
        { name: "GitLab", domain: "gitlab.com" },
        { name: "Jira", domain: "atlassian.com" },
        { name: "Figma", domain: "figma.com" },
        { name: "Notion", domain: "notion.so" },
        { name: "Slack", domain: "slack.com" },
        { name: "Docker", domain: "docker.com" },
        { name: "Kubernetes", domain: "kubernetes.io" },
        { name: "HashiCorp", domain: "hashicorp.com" },
        { name: "CircleCI", domain: "circleci.com" },
        { name: "Bitbucket", domain: "bitbucket.org" },
        { name: "Linear", domain: "linear.app" },
      ],
    },
    {
      key: "monitoring",
      label: L ? "المراقبة" : "Monitoring",
      color: "bg-orange-400",
      companies: [
        { name: "New Relic", domain: "newrelic.com" },
        { name: "Datadog", domain: "datadoghq.com" },
        { name: "Grafana", domain: "grafana.com" },
        { name: "Splunk", domain: "splunk.com" },
        { name: "PagerDuty", domain: "pagerduty.com" },
        { name: "Elastic", domain: "elastic.co" },
        { name: "Dynatrace", domain: "dynatrace.com" },
        { name: "Sentry", domain: "sentry.io" },
        { name: "Prometheus", domain: "prometheus.io" },
        { name: "Zabbix", domain: "zabbix.com" },
      ],
    },
    {
      key: "database",
      label: L ? "قواعد البيانات" : "Databases",
      color: "bg-cyan-600",
      companies: [
        { name: "MongoDB", domain: "mongodb.com" },
        { name: "Redis", domain: "redis.io" },
        { name: "PostgreSQL", domain: "postgresql.org" },
        { name: "Neo4j", domain: "neo4j.com" },
        { name: "Snowflake", domain: "snowflake.com" },
        { name: "Databricks", domain: "databricks.com" },
        { name: "Confluent", domain: "confluent.io" },
        { name: "PlanetScale", domain: "planetscale.com" },
        { name: "CockroachDB", domain: "cockroachlabs.com" },
        { name: "Neon", domain: "neon.tech" },
        { name: "Cassandra", domain: "cassandra.apache.org" },
      ],
    },
    {
      key: "communication",
      label: L ? "التواصل" : "Communication",
      color: "bg-green-500",
      companies: [
        { name: "Twilio", domain: "twilio.com" },
        { name: "SendGrid", domain: "sendgrid.com" },
        { name: "Mailchimp", domain: "mailchimp.com" },
        { name: "Vonage", domain: "vonage.com" },
        { name: "OneSignal", domain: "onesignal.com" },
        { name: "Pusher", domain: "pusher.com" },
        { name: "Firebase", domain: "firebase.google.com" },
        { name: "Intercom", domain: "intercom.com" },
        { name: "Zendesk", domain: "zendesk.com" },
        { name: "Freshdesk", domain: "freshdesk.com" },
        { name: "Brevo", domain: "brevo.com" },
        { name: "Resend", domain: "resend.com" },
      ],
    },
    {
      key: "ecommerce",
      label: L ? "التجارة الإلكترونية" : "E-Commerce",
      color: "bg-rose-500",
      companies: [
        { name: "Shopify", domain: "shopify.com" },
        { name: "WooCommerce", domain: "woocommerce.com" },
        { name: "Magento", domain: "magento.com" },
        { name: "BigCommerce", domain: "bigcommerce.com" },
        { name: "Salla", domain: "salla.com" },
        { name: "Zid", domain: "zid.sa" },
        { name: "Wix", domain: "wix.com" },
        { name: "Squarespace", domain: "squarespace.com" },
        { name: "PrestaShop", domain: "prestashop.com" },
        { name: "Noon", domain: "noon.com" },
      ],
    },
    {
      key: "erp",
      label: "ERP",
      color: "bg-indigo-500",
      companies: [
        { name: "SAP ERP", domain: "sap.com" },
        { name: "Oracle ERP", domain: "oracle.com" },
        { name: "Microsoft D365", domain: "microsoft.com" },
        { name: "NetSuite", domain: "netsuite.com" },
        { name: "Odoo", domain: "odoo.com" },
        { name: "Epicor", domain: "epicor.com" },
        { name: "Infor", domain: "infor.com" },
        { name: "Acumatica", domain: "acumatica.com" },
        { name: "IFS", domain: "ifs.com" },
        { name: "Unit4", domain: "unit4.com" },
        { name: "Ramco", domain: "ramco.com" },
      ],
    },
    {
      key: "accounting",
      label: L ? "المحاسبة" : "Accounting",
      color: "bg-teal-500",
      companies: [
        { name: "QuickBooks", domain: "quickbooks.intuit.com" },
        { name: "Xero", domain: "xero.com" },
        { name: "Sage", domain: "sage.com" },
        { name: "FreshBooks", domain: "freshbooks.com" },
        { name: "Wave", domain: "waveapps.com" },
        { name: "Zoho Books", domain: "zoho.com" },
        { name: "Tally", domain: "tallysolutions.com" },
        { name: "KashFlow", domain: "kashflow.com" },
        { name: "MenaITech", domain: "menaitech.com" },
      ],
    },
    {
      key: "hr",
      label: "HR",
      color: "bg-pink-500",
      companies: [
        { name: "Workday", domain: "workday.com" },
        { name: "SAP SuccessFactors", domain: "successfactors.com" },
        { name: "BambooHR", domain: "bamboohr.com" },
        { name: "ADP", domain: "adp.com" },
        { name: "Gusto", domain: "gusto.com" },
        { name: "Rippling", domain: "rippling.com" },
        { name: "Oracle HCM", domain: "oracle.com" },
        { name: "Zoho People", domain: "zoho.com" },
        { name: "HiBob", domain: "hibob.com" },
        { name: "Factorial", domain: "factorialhr.com" },
      ],
    },
    {
      key: "food",
      label: L ? "الطعام" : "Food",
      color: "bg-orange-500",
      companies: [
        { name: "Talabat", domain: "talabat.com" },
        { name: "Wolt", domain: "wolt.com" },
        { name: "Uber Eats", domain: "ubereats.com" },
        { name: "DoorDash", domain: "doordash.com" },
        { name: "Glovo", domain: "glovoapp.com" },
        { name: "Zomato", domain: "zomato.com" },
        { name: "Deliveroo", domain: "deliveroo.com" },
        { name: "HungerStation", domain: "hungerstation.com" },
        { name: "Jahez", domain: "jahez.net" },
        { name: "Cari", domain: "cari.com.sa" },
        { name: "Grab", domain: "grab.com" },
      ],
    },
    {
      key: "delivery",
      label: L ? "التوصيل" : "Delivery",
      color: "bg-blue-500",
      companies: [
        { name: "FedEx", domain: "fedex.com" },
        { name: "DHL", domain: "dhl.com" },
        { name: "UPS", domain: "ups.com" },
        { name: "Aramex", domain: "aramex.com" },
        { name: "SMSA", domain: "smsaexpress.com" },
        { name: "Naqel", domain: "naqel.com.sa" },
        { name: "iMile", domain: "imile.me" },
        { name: "Fetchr", domain: "fetchr.us" },
        { name: "Lalamove", domain: "lalamove.com" },
        { name: "Bosta", domain: "bosta.co" },
        { name: "J&T Express", domain: "jtexpress.com" },
      ],
    },
    {
      key: "hardware",
      label: L ? "الأجهزة" : "Hardware",
      color: "bg-slate-500",
      companies: [
        { name: "Ingenico", domain: "ingenico.com" },
        { name: "Verifone", domain: "verifone.com" },
        { name: "NCR", domain: "ncr.com" },
        { name: "Sunmi", domain: "sunmi.com" },
        { name: "PAX", domain: "pax.com" },
        { name: "Posiflex", domain: "posiflex.com" },
        { name: "Elo Touch", domain: "elotouch.com" },
        { name: "Zebra", domain: "zebra.com" },
        { name: "Honeywell", domain: "honeywell.com" },
        { name: "Telpo", domain: "telpo.com" },
        { name: "Datalogic", domain: "datalogic.com" },
      ],
    },
    {
      key: "reservations",
      label: L ? "الحجوزات" : "Reservations",
      color: "bg-amber-500",
      companies: [
        { name: "OpenTable", domain: "opentable.com" },
        { name: "Booking.com", domain: "booking.com" },
        { name: "Airbnb", domain: "airbnb.com" },
        { name: "Expedia", domain: "expedia.com" },
        { name: "TripAdvisor", domain: "tripadvisor.com" },
        { name: "Resy", domain: "resy.com" },
        { name: "Quandoo", domain: "quandoo.com" },
        { name: "SevenRooms", domain: "sevenrooms.com" },
        { name: "Google Reserve", domain: "google.com" },
      ],
    },
    {
      key: "security",
      label: L ? "الأمان" : "Security",
      color: "bg-red-500",
      companies: [
        { name: "CrowdStrike", domain: "crowdstrike.com" },
        { name: "Palo Alto", domain: "paloaltonetworks.com" },
        { name: "Cisco Security", domain: "cisco.com" },
        { name: "Fortinet", domain: "fortinet.com" },
        { name: "Check Point", domain: "checkpoint.com" },
        { name: "Sophos", domain: "sophos.com" },
        { name: "SentinelOne", domain: "sentinelone.com" },
        { name: "Trend Micro", domain: "trendmicro.com" },
        { name: "Cloudflare", domain: "cloudflare.com" },
        { name: "Varonis", domain: "varonis.com" },
      ],
    },
  ];

  return (
    <section className="py-14 md:py-20 border-t border-black/[0.04] dark:border-white/[0.04] overflow-hidden" data-testid="section-integration-partners">
      {/* Header */}
      <div className="container mx-auto px-4 mb-10 text-center">
        <p className="text-[10px] tracking-[0.3em] uppercase text-black/25 dark:text-white/25 font-semibold mb-2" dir={dir}>
          {L ? "شركاء التكامل" : "Integration Partners"}
        </p>
        <p className="text-sm text-black/35 dark:text-white/30" dir={dir}>
          {L
            ? "منظومة متكاملة من الشركاء في الدفع والتوصيل والمحاسبة وأكثر"
            : "A complete ecosystem of partners across payments, delivery, accounting, and more"}
        </p>
      </div>

      {/* Scrolling strips */}
      <div className="space-y-1.5">
        {categories.map((cat, idx) => {
          const speedClasses = [
            "animate-marquee-slow",
            "animate-marquee-fast-reverse",
            "animate-marquee",
            "animate-marquee-reverse",
            "animate-marquee-slow-reverse",
            "animate-marquee-fast",
          ];
          const animClass = speedClasses[idx % speedClasses.length];
          const doubled = [...cat.companies, ...cat.companies, ...cat.companies];

          return (
            <div
              key={cat.key}
              className="group/strip relative flex items-center"
              data-testid={`integration-strip-${cat.key}`}
            >
              {/* Category label — fixed side badge */}
              <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center pointer-events-none" style={{ width: "9rem" }}>
                <div className="w-full h-full bg-gradient-to-l from-white dark:from-gray-950 via-white/95 dark:via-gray-950/95 to-transparent flex items-center justify-end pr-4">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[9px] font-black uppercase tracking-widest text-black/40 dark:text-white/35 whitespace-nowrap`}>{cat.label}</span>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${cat.color}`} />
                  </div>
                </div>
              </div>

              {/* Left fade mask */}
              <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-r from-white dark:from-gray-950 to-transparent z-10 pointer-events-none" />

              {/* Scrolling chips track */}
              <div className="overflow-hidden w-full py-1.5">
                <div className={`strip-inner flex ${animClass} group-hover/strip:[animation-play-state:paused]`} style={{ width: "max-content" }}>
                  {doubled.map((company, ci) => (
                    <a
                      key={`${company.name}-${ci}`}
                      href={`https://${company.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 mx-1.5 px-3 py-1.5 rounded-full border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-white/[0.04] hover:border-black/20 dark:hover:border-white/20 hover:bg-white dark:hover:bg-white/[0.08] hover:shadow-sm transition-all duration-200 group shrink-0"
                      data-testid={`integration-chip-${cat.key}-${ci}`}
                    >
                      <img
                        src={`https://logo.clearbit.com/${company.domain}`}
                        alt={company.name}
                        className="h-3.5 w-3.5 object-contain rounded-sm opacity-50 group-hover:opacity-90 transition-opacity shrink-0"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                      <span className="text-[10px] font-semibold text-black/40 dark:text-white/35 group-hover:text-black/80 dark:group-hover:text-white/80 transition-colors whitespace-nowrap leading-none">
                        {company.name}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom hint */}
      <div className="container mx-auto px-4 mt-8 text-center">
        <p className="text-[9px] tracking-[0.25em] uppercase text-black/15 dark:text-white/15" dir={dir}>
          {L ? "مرر فوق الشريط لإيقاف التمرير" : "Hover over any strip to pause"}
        </p>
      </div>
    </section>
  );
}

function PartnersMarquee({ lang, dir }: { lang: string; dir: string }) {
  const { data: apiPartners } = useQuery<Partner[]>({ queryKey: ["/api/partners"] });

  const allLogos = useMemo(() => {
    const fromApi = (apiPartners || []).map(p => ({
      name: lang === "ar" ? (p.nameAr || p.name) : p.name,
      logo: p.logoUrl,
      url: p.websiteUrl,
    }));
    const fromStatic = staticPartners.map(p => ({
      name: lang === "ar" ? p.nameAr : p.name,
      logo: p.logo,
      url: undefined as string | undefined,
    }));
    const apiNames = new Set(fromApi.map(p => p.name));
    const merged = [...fromApi, ...fromStatic.filter(s => !apiNames.has(s.name))];
    return merged;
  }, [apiPartners, lang]);

  if (allLogos.length === 0) return null;

  const doubled = [...allLogos, ...allLogos];

  return (
    <section className="py-16 md:py-20 relative overflow-hidden" data-testid="section-partners">
      <div className="container mx-auto px-4 mb-10 text-center">
        <p className="text-[10px] tracking-[0.3em] uppercase text-black/25 dark:text-white/25 font-semibold" dir={dir}>
          {lang === "ar" ? "يثقون بنا" : "Trusted By"}
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-r from-white dark:from-gray-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-l from-white dark:from-gray-950 to-transparent z-10 pointer-events-none" />

        <div className="flex animate-marquee hover:[animation-play-state:paused]" style={{ width: "max-content" }}>
          {doubled.map((partner, i) => (
            <div
              key={`${partner.name}-${i}`}
              className="flex-shrink-0 mx-6 md:mx-10 flex items-center justify-center group"
              data-testid={`partner-logo-${i}`}
            >
              {partner.url ? (
                <a href={partner.url} target="_blank" rel="noopener noreferrer" className="block">
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="h-10 md:h-12 w-auto object-contain grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-90 transition-all duration-500"
                    loading="lazy"
                  />
                </a>
              ) : (
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="h-10 md:h-12 w-auto object-contain grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-90 transition-all duration-500"
                  loading="lazy"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
