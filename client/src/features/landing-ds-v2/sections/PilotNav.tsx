import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { key: "dsv2.nav.home",       href: "/" },
  { key: "dsv2.nav.about",      href: "/about" },
  { key: "dsv2.nav.plans",      href: "/prices" },
  { key: "dsv2.nav.devices",    href: "/systems" },
  { key: "dsv2.nav.consulting", href: "/consulting" },
  { key: "dsv2.nav.contact",    href: "/contact" },
] as const;

const SOCIAL = [
  { label: "X", href: "https://x.com/qiroxstudio" },
  { label: "LinkedIn", href: "https://linkedin.com/company/qirox" },
  { label: "Instagram", href: "https://instagram.com/qiroxstudio" },
];

export default function PilotNav() {
  const { t, lang, setLang } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const ar = lang === "ar";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <header
        dir={ar ? "rtl" : "ltr"}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ease-out
          h-[72px] md:h-[80px] lg:h-[88px]
          ${scrolled
            ? "bg-white/90 backdrop-blur-xl shadow-[0_1px_24px_rgba(0,0,0,0.08)] border-b border-black/5"
            : "bg-transparent"
          }`}
      >
        <div className="max-w-7xl mx-auto h-full px-5 lg:px-8 flex items-center justify-between gap-6">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
            <img
              src="/qirox-logo-nobg.png"
              alt="QIROX"
              className="h-7 lg:h-8 w-auto object-contain"
              loading="eager"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Primary navigation">
            {NAV_LINKS.map(({ key, href }) => (
              <Link
                key={key}
                href={href}
                className="px-3.5 py-2 text-[13.5px] font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-black/5 transition-all duration-150"
              >
                {t(key)}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setLang(ar ? "en" : "ar")}
              className="px-3 py-1.5 text-[13px] font-semibold text-gray-500 hover:text-gray-800 rounded-md hover:bg-black/5 transition-all duration-150 tracking-wide"
              aria-label="Switch language"
            >
              {ar ? "EN" : "عربي"}
            </button>
            <Link
              href="/login"
              className="px-4 py-2 text-[13.5px] font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {t("dsv2.nav.login")}
            </Link>
            <a
              href="#contact"
              className="px-5 py-2.5 text-[13.5px] font-semibold text-white bg-[#0F172A] hover:bg-[#1e293b] rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {t("dsv2.nav.startProject")}
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden p-2 text-gray-700 rounded-lg hover:bg-black/5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
          >
            <Menu size={22} strokeWidth={1.75} />
          </button>
        </div>
      </header>

      {/* Mobile fullscreen drawer */}
      <div
        dir={ar ? "rtl" : "ltr"}
        className={`lg:hidden fixed inset-0 z-50 transition-all duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        aria-hidden={!open}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />

        {/* Drawer panel */}
        <div
          className={`absolute inset-y-0 ${ar ? "left-0" : "right-0"} w-[85vw] max-w-sm bg-white/95 backdrop-blur-2xl shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            open
              ? "translate-x-0"
              : ar ? "-translate-x-full" : "translate-x-full"
          }`}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-black/8">
            <img src="/qirox-logo-nobg.png" alt="QIROX" className="h-7 w-auto object-contain" />
            <button
              onClick={() => setOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-800 hover:bg-black/5 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <X size={20} strokeWidth={1.75} />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 overflow-y-auto py-4 px-4" aria-label="Mobile navigation">
            <div className="flex flex-col gap-0.5">
              {NAV_LINKS.map(({ key, href }) => (
                <Link
                  key={key}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3.5 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-black/5 rounded-xl transition-colors"
                >
                  {t(key)}
                </Link>
              ))}
            </div>
          </nav>

          {/* Bottom actions */}
          <div className="px-5 pb-8 pt-4 border-t border-black/8 flex flex-col gap-3">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="block w-full py-3 text-center text-[14px] font-medium text-gray-600 hover:text-gray-900 hover:bg-black/5 rounded-xl transition-colors"
            >
              {t("dsv2.nav.login")}
            </Link>
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              className="block w-full py-3.5 text-center text-[14px] font-semibold text-white bg-[#0F172A] hover:bg-[#1e293b] rounded-xl transition-all shadow-sm"
            >
              {t("dsv2.nav.startProject")}
            </a>
            <button
              onClick={() => { setLang(ar ? "en" : "ar"); setOpen(false); }}
              className="block w-full py-3 text-center text-[13px] font-semibold text-gray-400 hover:text-gray-600 transition-colors tracking-wider"
            >
              {ar ? "Switch to English" : "التبديل إلى العربية"}
            </button>
            {/* Social links */}
            <div className="flex items-center justify-center gap-6 pt-2">
              {SOCIAL.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] font-semibold text-gray-400 hover:text-gray-700 transition-colors tracking-wide"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
