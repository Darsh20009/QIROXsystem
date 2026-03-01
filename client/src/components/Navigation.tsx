import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { Menu, X, LogOut, ArrowLeft, Globe, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import qiroxLogoPath from "@assets/QIROX_LOGO_1771674917456.png";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

export default function Navigation() {
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { t, lang, setLang } = useI18n();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/services", label: t("nav.services") },
    { href: "/portfolio", label: t("nav.portfolio") },
    { href: "/prices", label: t("nav.prices") },
    { href: "/about", label: t("nav.about") },
    { href: "/contact", label: t("nav.contact") },
  ];

  const adminLinks = user ? [
    { href: "/dashboard", label: t("nav.dashboard") },
  ] : [];

  const allLinks = [...navLinks, ...adminLinks];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "py-2" : "py-4"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className={`mx-auto transition-all duration-500 rounded-2xl px-6 ${
            scrolled
              ? "bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.06] shadow-lg max-w-5xl"
              : "bg-transparent max-w-6xl"
          }`}>
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center gap-2 group shrink-0" data-testid="link-logo">
                <img src={qiroxLogoPath} alt="QIROX" className="h-8 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity dark:brightness-[2]" />
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
                  title={theme === "dark" ? "وضع نهاري" : "وضع ليلي"}
                >
                  {theme === "dark" ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4" />}
                </button>
                {user ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06]">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold bg-black dark:bg-white text-white dark:text-black">
                        {user.fullName[0]}
                      </div>
                      <span className="text-sm text-black/60 dark:text-white/60">{user.fullName.split(' ')[0]}</span>
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
                      <Button size="sm" className="premium-btn rounded-xl px-5 text-sm font-semibold" data-testid="button-register-nav">
                        {t("nav.startProject")}
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
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
            <div className="flex flex-col h-full pt-20 px-6 overflow-y-auto">
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
