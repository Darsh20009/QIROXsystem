import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { Menu, X, LogOut, ArrowLeft, ArrowRight, Globe, Moon, Sun, ShoppingCart, Package, Trash2, ChevronRight } from "lucide-react";
import SARIcon from "@/components/SARIcon";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useQuery } from "@tanstack/react-query";
import RegisterModal from "@/components/RegisterModal";
import { useCurrency, getCountryCode } from "@/hooks/use-currency";

const COUNTRY_AR: Record<string, string> = {
  SA: "السعودية", AE: "الإمارات", KW: "الكويت", QA: "قطر", BH: "البحرين",
  OM: "عُمان", EG: "مصر", JO: "الأردن", IQ: "العراق", LY: "ليبيا",
  SD: "السودان", TN: "تونس", DZ: "الجزائر", MA: "المغرب",
  US: "الولايات المتحدة", GB: "المملكة المتحدة", DE: "ألمانيا", FR: "فرنسا", TR: "تركيا",
  YE: "اليمن", SY: "سوريا", LB: "لبنان",
};
const COUNTRY_EN: Record<string, string> = {
  SA: "Saudi Arabia", AE: "UAE", KW: "Kuwait", QA: "Qatar", BH: "Bahrain",
  OM: "Oman", EG: "Egypt", JO: "Jordan", IQ: "Iraq", LY: "Libya",
  SD: "Sudan", TN: "Tunisia", DZ: "Algeria", MA: "Morocco",
  US: "United States", GB: "United Kingdom", DE: "Germany", FR: "France", TR: "Turkey",
  YE: "Yemen", SY: "Syria", LB: "Lebanon",
};
const SEO_MAP: Record<string, { ar: { title: string; desc: string; kw: string }; en: { title: string; desc: string; kw: string } }> = {
  SA: {
    ar: { title: "QIROX | مصنع الأنظمة الرقمية — السعودية", desc: "قيروكس — شريكك التقني في السعودية. نبني مواقع وتطبيقات وأنظمة إدارة احترافية للشركات السعودية.", kw: "تطوير تطبيقات السعودية,مواقع الرياض,برمجة السعودية,QIROX Saudi" },
    en: { title: "QIROX | Digital Systems Factory — Saudi Arabia", desc: "QIROX — your tech partner in Saudi Arabia. Professional websites, apps & management systems for Saudi businesses.", kw: "app development Saudi Arabia,web design Riyadh,software company Saudi,QIROX" },
  },
  EG: {
    ar: { title: "QIROX | مصنع الأنظمة الرقمية — مصر", desc: "قيروكس — شريكك التقني في مصر. نبني مواقع وتطبيقات وأنظمة إدارة للشركات المصرية بأسعار مناسبة.", kw: "تطوير تطبيقات مصر,مواقع إلكترونية القاهرة,برمجة مصر,QIROX Egypt" },
    en: { title: "QIROX | Digital Systems Factory — Egypt", desc: "QIROX — your tech partner in Egypt. Websites, apps & systems for Egyptian businesses.", kw: "app development Egypt,web design Cairo,software company Egypt,QIROX" },
  },
  AE: {
    ar: { title: "QIROX | مصنع الأنظمة الرقمية — الإمارات", desc: "قيروكس — شريكك التقني في الإمارات. مواقع وتطبيقات وأنظمة إدارة للشركات الإماراتية.", kw: "تطوير تطبيقات الإمارات,مواقع دبي,برمجة الإمارات,QIROX UAE" },
    en: { title: "QIROX | Digital Systems Factory — UAE", desc: "QIROX — your tech partner in UAE. Websites, apps & management systems for Emirati businesses.", kw: "app development UAE,web design Dubai,software company UAE,QIROX" },
  },
  KW: {
    ar: { title: "QIROX | مصنع الأنظمة الرقمية — الكويت", desc: "قيروكس — شريكك التقني في الكويت. نبني مواقع وتطبيقات وأنظمة إدارة للشركات الكويتية.", kw: "تطوير تطبيقات الكويت,مواقع الكويت,برمجة الكويت,QIROX Kuwait" },
    en: { title: "QIROX | Digital Systems Factory — Kuwait", desc: "QIROX — your tech partner in Kuwait. Websites, apps & systems for Kuwaiti businesses.", kw: "app development Kuwait,web design Kuwait,QIROX Kuwait" },
  },
  QA: {
    ar: { title: "QIROX | مصنع الأنظمة الرقمية — قطر", desc: "قيروكس — شريكك التقني في قطر. مواقع وتطبيقات وأنظمة إدارة للشركات القطرية.", kw: "تطوير تطبيقات قطر,مواقع الدوحة,برمجة قطر,QIROX Qatar" },
    en: { title: "QIROX | Digital Systems Factory — Qatar", desc: "QIROX — your tech partner in Qatar. Websites, apps & systems for Qatari businesses.", kw: "app development Qatar,web design Doha,QIROX Qatar" },
  },
};

function countryToFlag(cc: unknown): string {
  const code = typeof cc === "string" && cc.length >= 2 ? cc : "SA";
  return [...code.toUpperCase().slice(0, 2)].map(c => String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0))).join("");
}

function NavCartDropdown({ onClose }: { onClose: () => void }) {
  const { data: cartData } = useQuery<any>({ queryKey: ["/api/cart"] });
  const items = cartData?.items ?? [];
  const subtotal = cartData?.subtotal ?? items.reduce((s: number, it: any) => s + Number(it.price ?? 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
      className="absolute top-full mt-3 left-0 w-80 bg-ds-surface-0 border border-ds-border-hairline rounded-ds-2xl shadow-ds-xl overflow-hidden z-[200]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ds-border-hairline">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-ds-primary rounded-ds-md flex items-center justify-center">
            <ShoppingCart className="w-3 h-3 text-ds-primary-foreground" />
          </div>
          <span className="text-ds-sm font-bold text-ds-foreground">عربة التسوق</span>
          {items.length > 0 && (
            <span className="text-[10px] font-black bg-ds-primary text-ds-primary-foreground px-1.5 py-0.5 rounded-ds-full">{items.length}</span>
          )}
        </div>
        <button onClick={onClose} className="p-1 rounded-ds-md hover:bg-ds-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring">
          <X className="w-3.5 h-3.5 text-ds-muted-foreground" />
        </button>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="py-10 text-center">
          <div className="w-12 h-12 bg-ds-surface-2 rounded-ds-2xl flex items-center justify-center mx-auto mb-3">
            <ShoppingCart className="w-6 h-6 text-ds-muted-foreground opacity-50" />
          </div>
          <p className="text-ds-sm font-medium text-ds-muted-foreground">السلة فارغة</p>
          <Link href="/prices" onClick={onClose} className="mt-3 inline-block text-[11px] px-4 py-1.5 bg-ds-primary text-ds-primary-foreground rounded-ds-xl font-bold hover:opacity-80 transition-all outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring">
            تصفح الخدمات
          </Link>
        </div>
      ) : (
        <>
          <div className="max-h-52 overflow-y-auto divide-y divide-ds-border-hairline">
            {items.map((item: any, i: number) => (
              <motion.div
                key={item.id ?? i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-ds-muted transition-colors"
              >
                <div className="w-8 h-8 bg-ds-surface-2 rounded-ds-xl flex items-center justify-center flex-shrink-0">
                  <Package className="w-3.5 h-3.5 text-ds-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-ds-xs font-bold text-ds-foreground truncate">{item.serviceName || item.name || "خدمة"}</p>
                  {item.billingPeriod && (
                    <p className="text-[10px] text-ds-muted-foreground">{item.billingPeriod}</p>
                  )}
                </div>
                <p className="text-ds-xs font-black text-ds-foreground flex-shrink-0 flex items-center gap-0.5">
                  {item.price != null ? Number(item.price).toLocaleString() : "—"}
                  <SARIcon size={9} className="opacity-30" />
                </p>
              </motion.div>
            ))}
          </div>

          {/* Footer total + CTA */}
          <div className="border-t border-ds-border-hairline px-4 py-3 bg-ds-surface-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] text-ds-muted-foreground font-medium">الإجمالي</span>
              <span className="text-ds-base font-black text-ds-foreground flex items-center gap-1">
                {Number(subtotal).toLocaleString()}
                <SARIcon size={11} className="opacity-30" />
              </span>
            </div>
            <Link href="/cart" onClick={onClose} className="w-full flex items-center justify-center gap-2 bg-ds-primary text-ds-primary-foreground text-ds-sm font-bold py-2.5 rounded-ds-xl hover:opacity-80 transition-all outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring" data-testid="button-nav-go-to-cart">
              <ShoppingCart className="w-4 h-4" />
              إكمال الطلب
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </Link>
          </div>
        </>
      )}
    </motion.div>
  );
}

function NavCartButton() {
  const { data: user } = useUser();
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: cartData } = useQuery<any>({
    queryKey: ["/api/cart"],
    enabled: user?.role === "client",
    refetchInterval: 20000,
  });

  const cartCount = cartData?.items?.length ?? 0;
  const prevCount = useRef(cartCount);

  useEffect(() => {
    if (cartCount > prevCount.current) {
      setBump(true);
      setTimeout(() => setBump(false), 600);
    }
    prevCount.current = cartCount;
  }, [cartCount]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user || user.role !== "client") return null;

  return (
    <div ref={ref} className="relative">
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.button
            key="cart-btn"
            initial={{ opacity: 0, scale: 0.6, x: 10 }}
            animate={{
              opacity: 1,
              scale: bump ? [1, 1.18, 0.94, 1.06, 1] : 1,
              x: 0,
            }}
            exit={{ opacity: 0, scale: 0.6, x: 10 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            onClick={() => setOpen(o => !o)}
            className={`relative flex items-center gap-2 px-3 py-1.5 rounded-ds-xl cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring
              ${open
                ? "bg-ds-primary text-ds-primary-foreground shadow-ds-md"
                : "bg-ds-surface-2 hover:bg-ds-primary text-ds-muted-foreground hover:text-ds-primary-foreground border border-ds-border-hairline"
              } transition-all duration-ds-base`}
            data-testid="button-nav-cart"
          >
            {/* Pulse ring when new item added */}
            {bump && (
              <motion.span
                className="absolute inset-0 rounded-ds-xl bg-ds-primary/20"
                animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
                transition={{ duration: 0.5 }}
              />
            )}
            <ShoppingCart className="w-4 h-4 relative z-10" />
            <span className="text-ds-xs font-black relative z-10">{cartCount}</span>
            {/* Red badge dot */}
            <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[7px] font-black rounded-ds-full flex items-center justify-center leading-none border-2 border-ds-surface-0 z-20">
              {cartCount > 9 ? "9+" : cartCount}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && <NavCartDropdown onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

export default function NavigationDSV2() {
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const [isOpen, setIsOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { t, lang, dir, setLang } = useI18n();
  const { theme, toggle } = useTheme();
  const currency = useCurrency();
  const countryCode = currency.countryCode || "SA";
  const countryName = lang === "ar" ? (COUNTRY_AR[countryCode] || COUNTRY_AR["SA"]) : (COUNTRY_EN[countryCode] || COUNTRY_EN["SA"]);
  const countryFlag = countryToFlag(countryCode);

  /* ── Country-aware SEO ── */
  useEffect(() => {
    const seo = SEO_MAP[countryCode] || SEO_MAP["SA"];
    const l = lang as "ar" | "en";
    const title = seo[l].title;
    const desc  = seo[l].desc;
    const kw    = seo[l].kw;

    document.title = title;

    const setMeta = (selector: string, attr: string, val: string) => {
      let el = document.querySelector<HTMLMetaElement>(selector);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr.split("=")[0].replace("[","").replace('"',''), attr.split('"')[1] || ""); document.head.appendChild(el); }
      el.content = val;
    };
    const ensure = (name: string | null, prop: string | null, content: string) => {
      let el: HTMLMetaElement | null = name
        ? document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
        : document.querySelector<HTMLMetaElement>(`meta[property="${prop}"]`);
      if (!el) {
        el = document.createElement("meta");
        if (name) el.setAttribute("name", name);
        else if (prop) el.setAttribute("property", prop);
        document.head.appendChild(el);
      }
      el.content = content;
    };
    ensure("description", null, desc);
    ensure("keywords", null, kw);
    ensure(null, "og:title", title);
    ensure(null, "og:description", desc);
    ensure(null, "og:locale", lang === "ar" ? "ar_SA" : "en_US");
  }, [countryCode, lang]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: lang === "ar" ? "الرئيسية" : "Home" },
    { href: "/about", label: lang === "ar" ? "من نحن" : "About" },
    { href: "/prices", label: lang === "ar" ? "الباقات" : "Plans" },
    { href: "/devices", label: lang === "ar" ? "الأجهزة" : "Devices" },
    { href: "/consultation", label: lang === "ar" ? "الاستشارات" : "Consultations" },
    { href: "/contact", label: lang === "ar" ? "تواصل معنا" : "Contact Us" },
    { href: "/support", label: lang === "ar" ? "الدعم" : "Support" },
  ];

  const adminLinks = user ? [
    { href: "/dashboard", label: t("nav.dashboard") },
  ] : [];

  const allLinks = [...navLinks, ...adminLinks];

  const darkHeroRoutes: string[] = [];
  const isOnDarkHero = darkHeroRoutes.includes(location) && !scrolled;

  return (
    <>
      {/* Status bar background — covers the notch/camera area on mobile */}
      <div
        className="fixed top-0 left-0 right-0 bg-ds-background z-[52] pointer-events-none"
        style={{ height: "env(safe-area-inset-top, 0px)" }}
      />
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ paddingTop: "env(safe-area-inset-top, 0px)", top: 0 }}
        className={`fixed left-0 right-0 z-ds-sticky transition-all duration-ds-slow ${
          scrolled ? "py-2" : "py-4"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className={`mx-auto transition-all duration-ds-slow rounded-ds-2xl px-6 ${
            scrolled
              ? "ds-surface-glass max-w-5xl"
              : "bg-transparent border border-transparent max-w-6xl"
          }`}>
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center group shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring rounded-ds-xl" data-testid="link-logo">
                <div className="relative transition-all duration-ds-base group-hover:scale-105 group-hover:opacity-80 px-3 py-1.5">
                  <img
                    src="/qirox-logo-nobg.png"
                    alt="QIROX"
                    className="h-10 w-auto object-contain dark:invert"
                  />
                </div>
              </Link>

              <div className="hidden lg:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring rounded-ds-xl">
                    <div className={`relative px-4 py-2 rounded-ds-xl text-ds-sm font-medium transition-all cursor-pointer ${
                      location === link.href
                        ? isOnDarkHero ? "text-white" : "text-ds-foreground"
                        : isOnDarkHero
                          ? "text-white/50 hover:text-white/85"
                          : "text-ds-muted-foreground hover:text-ds-foreground"
                    }`} data-testid={`nav-link-${link.href.replace('/', '') || 'home'}`}>
                      {location === link.href && (
                        <motion.div
                          layoutId="nav-active"
                          className={`absolute inset-0 rounded-ds-xl ${isOnDarkHero ? "bg-white/[0.08]" : "bg-ds-surface-2"}`}
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10">{link.label}</span>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="hidden md:flex items-center gap-2">
                {adminLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring rounded-ds-xl">
                    <div className={`relative px-4 py-2 rounded-ds-xl text-ds-sm font-medium transition-all cursor-pointer ${
                      location === link.href
                        ? isOnDarkHero ? "text-white" : "text-ds-foreground"
                        : isOnDarkHero
                          ? "text-white/50 hover:text-white/85"
                          : "text-ds-muted-foreground hover:text-ds-foreground"
                    }`} data-testid={`nav-link-admin-${link.href.replace('/', '')}`}>
                      <span className="relative z-10">{link.label}</span>
                    </div>
                  </Link>
                ))}

                {/* Creative Cart Button — only for clients */}
                <NavCartButton />

                {/* Country Indicator */}
                <div className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-ds-xl border text-ds-xs font-semibold select-none ${
                  isOnDarkHero
                    ? "border-white/10 text-white/60 bg-white/[0.05]"
                    : "border-ds-border-hairline text-ds-muted-foreground bg-ds-surface-1"
                }`} data-testid="badge-country-indicator">
                  <span className="text-ds-base leading-none">{countryFlag}</span>
                  <span className="hidden xl:inline">{lang === "ar" ? `QIROX معك في ${countryName}` : `QIROX in ${countryName}`}</span>
                </div>

                <button
                  onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                  className={`p-2 rounded-ds-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring ${isOnDarkHero ? "text-white/40 hover:text-white/75 hover:bg-white/[0.08]" : "text-ds-muted-foreground hover:text-ds-foreground hover:bg-ds-muted"}`}
                  data-testid="button-lang-toggle-nav"
                  title={lang === "ar" ? "English" : "عربي"}
                >
                  <Globe className="w-4 h-4" />
                </button>
                <button
                  onClick={toggle}
                  className={`p-2 rounded-ds-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring ${isOnDarkHero ? "text-white/40 hover:text-white/75 hover:bg-white/[0.08]" : "text-ds-muted-foreground hover:text-ds-foreground hover:bg-ds-muted"}`}
                  data-testid="button-theme-toggle-nav"
                  title={lang === "ar" ? (theme === "dark" ? "وضع نهاري" : "وضع ليلي") : (theme === "dark" ? "Light mode" : "Dark mode")}
                >
                  {theme === "dark" ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className={`w-4 h-4 ${isOnDarkHero ? "text-white/40" : ""}`} />}
                </button>
                {user ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-ds-md bg-ds-surface-1 border border-ds-border-hairline">
                      <div className="w-6 h-6 rounded-ds-sm flex items-center justify-center text-ds-xs font-bold bg-ds-primary text-ds-primary-foreground">
                        {(user.fullName || user.username || "?")[0]}
                      </div>
                      <span className="text-ds-sm text-ds-muted-foreground">{(user.fullName || user.username || "")?.split(' ')[0]}</span>
                    </div>
                    <button
                      onClick={() => logout()}
                      className="p-2 rounded-ds-md text-ds-muted-foreground hover:text-ds-foreground hover:bg-ds-muted transition-all outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring"
                      data-testid="button-logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Link href="/login" className="outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring rounded-ds-xl inline-block" data-testid="button-login-nav">
                      <button className="ds-btn ds-btn-ghost px-4 py-2 text-ds-sm font-medium text-ds-muted-foreground hover:text-ds-foreground" tabIndex={-1}>
                        {t("nav.login")}
                      </button>
                    </Link>
                    <button
                      onClick={() => setRegisterOpen(true)}
                      className="ds-btn ds-btn-primary rounded-ds-xl px-5 py-2 text-ds-sm font-semibold gap-1.5 shadow-ds-sm hover:shadow-ds-md outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring"
                      data-testid="button-register-nav"
                    >
                      {t("nav.startProject")}
                      {dir === "rtl" ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 rounded-ds-xl text-ds-muted-foreground hover:text-ds-foreground hover:bg-ds-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring"
                data-testid="button-mobile-menu"
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="md:hidden fixed inset-0 z-ds-overlay bg-ds-background"
          >
            <div
              className="flex flex-col h-full px-6 overflow-y-auto"
              style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 5rem)" }}
            >
              <div className="space-y-1 flex-1">
                {allLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={link.href} onClick={() => setIsOpen(false)} className="outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring rounded-ds-xl block">
                      <div className={`block px-5 py-4 rounded-ds-xl text-ds-lg font-bold transition-all ${
                        location === link.href
                          ? "text-ds-foreground bg-ds-surface-2"
                          : "text-ds-muted-foreground hover:text-ds-foreground hover:bg-ds-surface-1"
                      }`}>
                        {link.label}
                      </div>
                    </Link>
                  </motion.div>
                ))}
                {/* Mobile cart link */}
                {user?.role === "client" && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: allLinks.length * 0.05 }}>
                    <Link href="/cart" onClick={() => setIsOpen(false)} className="outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring rounded-ds-xl block">
                      <div className="flex items-center gap-3 px-5 py-4 rounded-ds-xl text-ds-lg font-bold text-ds-muted-foreground hover:text-ds-foreground hover:bg-ds-surface-1 transition-all">
                        <ShoppingCart className="w-5 h-5" />
                        عربة التسوق
                      </div>
                    </Link>
                  </motion.div>
                )}
              </div>

              <div className="pb-8 space-y-3">
                <div className="h-px bg-ds-border-hairline mb-4" />
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                    className="text-center py-2 px-4 rounded-ds-md text-ds-muted-foreground text-ds-sm hover:text-ds-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring"
                    data-testid="button-lang-toggle-mobile"
                  >
                    {lang === "ar" ? "English" : "عربي"}
                  </button>
                  <button
                    onClick={toggle}
                    className="p-2 rounded-ds-md text-ds-muted-foreground hover:bg-ds-muted outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring"
                    data-testid="button-theme-toggle-mobile"
                  >
                    {theme === "dark" ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4" />}
                  </button>
                </div>
                {user ? (
                  <button
                    className="w-full flex items-center justify-center gap-2 border border-ds-border-emphasis text-ds-muted-foreground hover:bg-ds-muted hover:text-ds-foreground rounded-ds-xl h-12 font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring"
                    onClick={() => { logout(); setIsOpen(false); }}
                  >
                    <LogOut className="w-4 h-4" />
                    {t("admin.logout")}
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/login" onClick={() => setIsOpen(false)} className="flex items-center justify-center w-full border border-ds-border-emphasis text-ds-muted-foreground hover:bg-ds-muted hover:text-ds-foreground rounded-ds-xl h-12 font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring">
                      {t("nav.login")}
                    </Link>
                    <button
                      onClick={() => { setIsOpen(false); setRegisterOpen(true); }}
                      className="w-full ds-btn ds-btn-primary rounded-ds-xl h-12 font-semibold shadow-ds-sm hover:shadow-ds-md outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring"
                      data-testid="button-register-nav-mobile"
                    >
                      {t("nav.startProject")}
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-6 left-6 p-2 rounded-ds-xl text-ds-muted-foreground hover:bg-ds-muted hover:text-ds-foreground outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Registration Modal */}
      <RegisterModal open={registerOpen} onOpenChange={setRegisterOpen} />
    </>
  );
}
