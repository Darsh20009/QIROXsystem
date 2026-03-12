import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { Menu, X, LogOut, ArrowLeft, ArrowRight, Globe, Moon, Sun, ShoppingCart, Package, Trash2, ChevronRight } from "lucide-react";
import SARIcon from "@/components/SARIcon";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import qiroxLogoPath from "@assets/QIROX_LOGO_1771674917456.png";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useQuery } from "@tanstack/react-query";

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
      className="absolute top-full mt-3 left-0 w-80 bg-white dark:bg-gray-900 border border-black/[0.07] dark:border-white/[0.07] rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden z-[200]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.05] dark:border-white/[0.05]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-black dark:bg-white rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-3 h-3 text-white dark:text-black" />
          </div>
          <span className="text-sm font-bold text-black dark:text-white">عربة التسوق</span>
          {items.length > 0 && (
            <span className="text-[10px] font-black bg-black dark:bg-white text-white dark:text-black px-1.5 py-0.5 rounded-full">{items.length}</span>
          )}
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors">
          <X className="w-3.5 h-3.5 text-black/30 dark:text-white/30" />
        </button>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="py-10 text-center">
          <div className="w-12 h-12 bg-black/[0.03] dark:bg-white/[0.05] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ShoppingCart className="w-6 h-6 text-black/20 dark:text-white/20" />
          </div>
          <p className="text-sm font-medium text-black/30 dark:text-white/30">السلة فارغة</p>
          <Link href="/prices" onClick={onClose}>
            <button className="mt-3 text-[11px] px-4 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-80 transition-all">
              تصفح الخدمات
            </button>
          </Link>
        </div>
      ) : (
        <>
          <div className="max-h-52 overflow-y-auto divide-y divide-black/[0.04] dark:divide-white/[0.04]">
            {items.map((item: any, i: number) => (
              <motion.div
                key={item.id ?? i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-8 h-8 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-black dark:text-white truncate">{item.serviceName || item.name || "خدمة"}</p>
                  {item.billingPeriod && (
                    <p className="text-[10px] text-black/30 dark:text-white/30">{item.billingPeriod}</p>
                  )}
                </div>
                <p className="text-xs font-black text-black dark:text-white flex-shrink-0 flex items-center gap-0.5">
                  {item.price != null ? Number(item.price).toLocaleString() : "—"}
                  <SARIcon size={9} className="opacity-30" />
                </p>
              </motion.div>
            ))}
          </div>

          {/* Footer total + CTA */}
          <div className="border-t border-black/[0.05] dark:border-white/[0.05] px-4 py-3 bg-black/[0.01] dark:bg-white/[0.01]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] text-black/40 dark:text-white/40 font-medium">الإجمالي</span>
              <span className="text-base font-black text-black dark:text-white flex items-center gap-1">
                {Number(subtotal).toLocaleString()}
                <SARIcon size={11} className="opacity-30" />
              </span>
            </div>
            <Link href="/cart" onClick={onClose}>
              <button className="w-full flex items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black text-sm font-bold py-2.5 rounded-xl hover:opacity-80 transition-all" data-testid="button-nav-go-to-cart">
                <ShoppingCart className="w-4 h-4" />
                إكمال الطلب
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
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
            className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer group
              ${open
                ? "bg-black dark:bg-white text-white dark:text-black shadow-lg shadow-black/20"
                : "bg-black/[0.05] dark:bg-white/[0.06] hover:bg-black dark:hover:bg-white text-black/70 dark:text-white/70 hover:text-white dark:hover:text-black border border-black/[0.07] dark:border-white/[0.07]"
              } transition-all duration-200`}
            data-testid="button-nav-cart"
          >
            {/* Pulse ring when new item added */}
            {bump && (
              <motion.span
                className="absolute inset-0 rounded-xl bg-black/20 dark:bg-white/20"
                animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
                transition={{ duration: 0.5 }}
              />
            )}
            <ShoppingCart className="w-4 h-4 relative z-10" />
            <span className="text-xs font-black relative z-10">{cartCount}</span>
            {/* Red badge dot */}
            <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[7px] font-black rounded-full flex items-center justify-center leading-none border-2 border-white dark:border-gray-950 z-20">
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

export default function Navigation() {
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { t, lang, dir, setLang } = useI18n();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/devices", label: lang === "ar" ? "الأجهزة" : "Devices" },
    { href: "/prices", label: t("nav.prices") },
    { href: "/demos", label: lang === "ar" ? "النماذج" : "Demos" },
    { href: "/consultation", label: lang === "ar" ? "احجز استشارة" : "Book Consultation" },
    { href: "/about", label: t("nav.about") },
    { href: "/partners", label: t("nav.partners") },
    { href: "/contact", label: t("nav.contact") },
  ];

  const adminLinks = user ? [
    { href: "/dashboard", label: t("nav.dashboard") },
  ] : [];

  const allLinks = [...navLinks, ...adminLinks];

  return (
    <>
      {/* Status bar background — covers the notch/camera area on mobile */}
      <div
        className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-950 z-[52] pointer-events-none"
        style={{ height: "env(safe-area-inset-top, 0px)" }}
      />
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "py-2" : "py-4"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className={`mx-auto transition-all duration-500 rounded-2xl px-6 ${
            scrolled
              ? "bg-white dark:bg-gray-900 md:bg-white/90 md:dark:bg-gray-900/90 md:backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.06] shadow-lg max-w-5xl"
              : "bg-transparent max-w-6xl"
          }`}>
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center gap-2 group shrink-0" data-testid="link-logo">
                <img src={qiroxLogoPath} alt="QIROX" className="h-8 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity dark:invert" />
              </Link>

              <div className="hidden lg:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <div className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      location === link.href
                        ? "text-black dark:text-white"
                        : "text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70"
                    }`} data-testid={`nav-link-${link.href.replace('/', '') || 'home'}`}>
                      {location === link.href && (
                        <motion.div
                          layoutId="nav-active"
                          className="absolute inset-0 rounded-xl bg-black/[0.05] dark:bg-white/[0.05]"
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
                  <Link key={link.href} href={link.href}>
                    <div className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      location === link.href
                        ? "text-black dark:text-white"
                        : "text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70"
                    }`} data-testid={`nav-link-admin-${link.href.replace('/', '')}`}>
                      <span className="relative z-10">{link.label}</span>
                    </div>
                  </Link>
                ))}

                {/* Creative Cart Button — only for clients */}
                <NavCartButton />

                <button
                  onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                  className="p-2 rounded-lg text-black/30 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-all"
                  data-testid="button-lang-toggle-nav"
                  title={lang === "ar" ? "English" : "عربي"}
                >
                  <Globe className="w-4 h-4" />
                </button>
                <button
                  onClick={toggle}
                  className="p-2 rounded-lg text-black/30 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-all"
                  data-testid="button-theme-toggle-nav"
                  title={lang === "ar" ? (theme === "dark" ? "وضع نهاري" : "وضع ليلي") : (theme === "dark" ? "Light mode" : "Dark mode")}
                >
                  {theme === "dark" ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4" />}
                </button>
                {user ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06]">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold bg-black dark:bg-white text-white dark:text-black">
                        {(user.fullName || user.username || "?")[0]}
                      </div>
                      <span className="text-sm text-black/60 dark:text-white/60">{(user.fullName || user.username || "")?.split(' ')[0]}</span>
                    </div>
                    <button
                      onClick={() => logout()}
                      className="p-2 rounded-lg text-black/30 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-all"
                      data-testid="button-logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="ghost" size="sm" className="text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.04] font-medium rounded-xl" data-testid="button-login-nav">
                        {t("nav.login")}
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button size="sm" className="premium-btn rounded-xl px-5 text-sm font-semibold gap-1.5" data-testid="button-register-nav">
                        {t("nav.startProject")}
                        {dir === "rtl" ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 rounded-xl text-black/70 dark:text-white/70 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
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
            className="md:hidden fixed inset-0 z-[60] bg-white dark:bg-gray-950"
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
                    <Link href={link.href} onClick={() => setIsOpen(false)}>
                      <div className={`block px-5 py-4 rounded-xl text-lg font-bold transition-all ${
                        location === link.href
                          ? "text-black dark:text-white bg-black/[0.05] dark:bg-white/[0.05]"
                          : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                      }`}>
                        {link.label}
                      </div>
                    </Link>
                  </motion.div>
                ))}
                {/* Mobile cart link */}
                {user?.role === "client" && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: allLinks.length * 0.05 }}>
                    <Link href="/cart" onClick={() => setIsOpen(false)}>
                      <div className="flex items-center gap-3 px-5 py-4 rounded-xl text-lg font-bold text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-all">
                        <ShoppingCart className="w-5 h-5" />
                        عربة التسوق
                      </div>
                    </Link>
                  </motion.div>
                )}
              </div>

              <div className="pb-8 space-y-3">
                <div className="h-px bg-black/[0.06] dark:bg-white/[0.06] mb-4" />
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                    className="text-center py-2 text-black/40 dark:text-white/40 text-sm hover:text-black/60 dark:hover:text-white/60 transition-colors"
                    data-testid="button-lang-toggle-mobile"
                  >
                    {lang === "ar" ? "English" : "عربي"}
                  </button>
                  <button
                    onClick={toggle}
                    className="p-2 rounded-lg text-black/40 dark:text-white/40 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                    data-testid="button-theme-toggle-mobile"
                  >
                    {theme === "dark" ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4" />}
                  </button>
                </div>
                {user ? (
                  <Button
                    variant="outline"
                    className="w-full justify-center gap-2 border-black/[0.08] dark:border-white/[0.08] text-black/60 dark:text-white/60 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] rounded-xl h-12"
                    onClick={() => { logout(); setIsOpen(false); }}
                  >
                    <LogOut className="w-4 h-4" />
                    {t("admin.logout")}
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full border-black/[0.08] dark:border-white/[0.08] text-black/60 dark:text-white/60 rounded-xl h-12">{t("nav.login")}</Button>
                    </Link>
                    <Link href="/register" onClick={() => setIsOpen(false)}>
                      <Button className="w-full premium-btn rounded-xl h-12">{t("nav.startProject")}</Button>
                    </Link>
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-6 left-6 p-2 rounded-xl text-black/50 dark:text-white/50 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
