import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { Menu, X } from "lucide-react";

export default function PilotNav() {
  const { t, lang, setLang } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const L = lang === "ar";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-ds-sticky transition-all duration-ds-slow ease-ds-standard ${
        scrolled ? "py-3" : "py-5"
      }`}
    >
      <div className="max-w-ds-container-xl mx-auto px-6">
        <nav
          className={`flex items-center justify-between px-6 py-3 rounded-ds-full transition-all duration-ds-slow ${
            scrolled ? "ds-surface-glass" : "bg-transparent border border-transparent"
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring rounded-ds-sm">
            <img src="/qirox-logo-nobg.png" alt="QIROX" className="h-7 w-auto object-contain dark:invert" />
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-ds-sm font-medium text-ds-muted-foreground hover:text-ds-foreground transition-colors">
              {t("dsv2.nav.services")}
            </a>
            <a href="#portfolio" className="text-ds-sm font-medium text-ds-muted-foreground hover:text-ds-foreground transition-colors">
              {t("dsv2.nav.portfolio")}
            </a>
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => setLang(L ? "en" : "ar")}
              className="text-ds-sm font-medium text-ds-muted-foreground hover:text-ds-foreground transition-colors duration-ds-fast ease-ds-standard px-2 py-1 rounded-ds-sm"
            >
              {L ? "EN" : "عربي"}
            </button>
            <Link href="/login" className="text-ds-sm font-medium text-ds-muted-foreground hover:text-ds-foreground transition-colors">
              {t("dsv2.nav.login")}
            </Link>
            <a href="#contact" className="ds-btn ds-btn-primary px-5 py-2 text-ds-sm shadow-ds-sm hover:shadow-ds-md transition-all">
              {t("dsv2.nav.startProject")}
            </a>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2 text-ds-foreground rounded-ds-sm outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} strokeWidth={1.75} /> : <Menu size={20} strokeWidth={1.75} />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 ds-surface-glass rounded-ds-xl p-4 flex flex-col gap-4 ds-anim-fade-in shadow-ds-lg">
            <a href="#services" onClick={() => setMobileMenuOpen(false)} className="text-ds-base font-medium px-4 py-2 hover:bg-ds-muted rounded-ds-md transition-colors">
              {t("dsv2.nav.services")}
            </a>
            <a href="#portfolio" onClick={() => setMobileMenuOpen(false)} className="text-ds-base font-medium px-4 py-2 hover:bg-ds-muted rounded-ds-md transition-colors">
              {t("dsv2.nav.portfolio")}
            </a>
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-ds-base font-medium px-4 py-2 hover:bg-ds-muted rounded-ds-md transition-colors">
              {t("dsv2.nav.login")}
            </Link>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="ds-btn ds-btn-primary w-full py-3 mt-2 justify-center">
              {t("dsv2.nav.startProject")}
            </a>
            <button
              onClick={() => {
                setLang(L ? "en" : "ar");
                setMobileMenuOpen(false);
              }}
              className="text-ds-base font-medium text-center py-2 mt-2 border-t border-ds-border-hairline text-ds-muted-foreground hover:text-ds-foreground"
            >
              {L ? "English" : "العربية"}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
