import { Link } from "wouter";
const qiroxLogoPath = "/qirox-icon.png";
import { ArrowUpRight, Globe, RotateCcw } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { SiGoogleplay, SiApple, SiInstagram, SiX, SiTiktok, SiSnapchat, SiYoutube, SiWhatsapp, SiLinktree } from "react-icons/si";
import { Linkedin, AppWindow } from "lucide-react";
import {
  useCurrency, setManualCountry, clearManualCountry, getManualCountry,
  getCurrencyForCountry, countryToFlag,
  COUNTRY_NAMES_AR, COUNTRY_NAMES_EN,
} from "@/hooks/use-currency";

type AppDownloads = {
  playStore:   { url: string; enabled: boolean };
  appStore:    { url: string; enabled: boolean };
  msStore:     { url: string; enabled: boolean };
  huaweiStore: { url: string; enabled: boolean };
};

type PublicSettings = {
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  snapchat?: string;
  youtube?: string;
  tiktok?: string;
  whatsapp?: string;
  linktree?: string;
  contactPhone?: string;
  contactEmail?: string;
};

/* ─── Supported countries list (ordered by priority) ─── */
const SUPPORTED_COUNTRIES: { code: string; region: "gulf" | "arab" | "europe" | "asia" | "americas" | "africa" | "oceania" }[] = [
  /* الخليج العربي */
  { code: "SA", region: "gulf" }, { code: "AE", region: "gulf" }, { code: "KW", region: "gulf" },
  { code: "QA", region: "gulf" }, { code: "BH", region: "gulf" }, { code: "OM", region: "gulf" },
  /* المنطقة العربية */
  { code: "EG", region: "arab" }, { code: "JO", region: "arab" }, { code: "IQ", region: "arab" },
  { code: "MA", region: "arab" }, { code: "TN", region: "arab" }, { code: "DZ", region: "arab" },
  { code: "LY", region: "arab" }, { code: "SD", region: "arab" }, { code: "LB", region: "arab" },
  { code: "SY", region: "arab" }, { code: "YE", region: "arab" }, { code: "PS", region: "arab" },
  /* أوروبا */
  { code: "GB", region: "europe" }, { code: "DE", region: "europe" }, { code: "FR", region: "europe" },
  { code: "IT", region: "europe" }, { code: "ES", region: "europe" }, { code: "NL", region: "europe" },
  { code: "PT", region: "europe" }, { code: "BE", region: "europe" }, { code: "CH", region: "europe" },
  { code: "AT", region: "europe" }, { code: "GR", region: "europe" }, { code: "SE", region: "europe" },
  { code: "NO", region: "europe" }, { code: "DK", region: "europe" }, { code: "FI", region: "europe" },
  { code: "PL", region: "europe" }, { code: "CZ", region: "europe" }, { code: "HU", region: "europe" },
  { code: "RO", region: "europe" }, { code: "IE", region: "europe" }, { code: "TR", region: "europe" },
  { code: "RU", region: "europe" }, { code: "UA", region: "europe" },
  /* آسيا */
  { code: "IN", region: "asia" }, { code: "PK", region: "asia" }, { code: "BD", region: "asia" },
  { code: "JP", region: "asia" }, { code: "CN", region: "asia" }, { code: "KR", region: "asia" },
  { code: "SG", region: "asia" }, { code: "MY", region: "asia" }, { code: "TH", region: "asia" },
  { code: "PH", region: "asia" }, { code: "ID", region: "asia" }, { code: "VN", region: "asia" },
  /* أمريكا */
  { code: "US", region: "americas" }, { code: "CA", region: "americas" }, { code: "BR", region: "americas" },
  { code: "MX", region: "americas" }, { code: "AR", region: "americas" },
  /* أفريقيا */
  { code: "ZA", region: "africa" }, { code: "NG", region: "africa" }, { code: "KE", region: "africa" },
  { code: "GH", region: "africa" }, { code: "ET", region: "africa" },
  /* أوقيانوسيا */
  { code: "AU", region: "oceania" }, { code: "NZ", region: "oceania" },
];

const REGION_LABEL_AR: Record<string, string> = {
  gulf: "الخليج", arab: "العالم العربي", europe: "أوروبا",
  asia: "آسيا", americas: "الأمريكتان", africa: "أفريقيا", oceania: "أوقيانوسيا",
};
const REGION_LABEL_EN: Record<string, string> = {
  gulf: "Gulf", arab: "Arab World", europe: "Europe",
  asia: "Asia", americas: "Americas", africa: "Africa", oceania: "Oceania",
};

function CountrySwitcher({ lang }: { lang: string }) {
  const currency = useCurrency();
  const L = lang === "ar";

  const regions = Array.from(new Set(SUPPORTED_COUNTRIES.map(c => c.region)));

  return (
    <div className="space-y-5">
      {regions.map(region => {
        const countries = SUPPORTED_COUNTRIES.filter(c => c.region === region);
        return (
          <div key={region}>
            <p className="text-[10px] font-semibold text-black/25 dark:text-white/25 uppercase tracking-[2px] mb-2.5">
              {L ? REGION_LABEL_AR[region] : REGION_LABEL_EN[region]}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {countries.map(({ code }) => {
                const def = getCurrencyForCountry(code);
                const isActive = currency.countryCode === code;
                const nameAr = COUNTRY_NAMES_AR[code] || code;
                const nameEn = COUNTRY_NAMES_EN[code] || code;
                return (
                  <button
                    key={code}
                    onClick={() => setManualCountry(code)}
                    title={L ? `${nameAr} · ${def.symbolShort}` : `${nameEn} · ${def.symbolShort}`}
                    data-testid={`footer-country-${code}`}
                    className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-sm"
                        : "bg-black/[0.03] dark:bg-white/[0.04] border-black/[0.07] dark:border-white/[0.07] text-black/45 dark:text-white/45 hover:bg-black/[0.07] dark:hover:bg-white/[0.08] hover:text-black dark:hover:text-white hover:border-black/20 dark:hover:border-white/20"
                    }`}
                  >
                    <span className="text-sm leading-none">{countryToFlag(code)}</span>
                    <span className="hidden sm:inline">{L ? nameAr : nameEn}</span>
                    <span className={`text-[10px] font-mono ${isActive ? "opacity-70" : "opacity-40 group-hover:opacity-70"}`}>
                      {def.symbolShort}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Footer() {
  const { t, lang } = useI18n();
  const { data: user } = useUser();
  const currency = useCurrency();
  const L = lang === "ar";

  const { data: downloads } = useQuery<AppDownloads>({
    queryKey: ["/api/app-downloads"],
    staleTime: 5 * 60 * 1000,
  });

  const { data: publicSettings } = useQuery<PublicSettings>({
    queryKey: ["/api/public/settings"],
    staleTime: 10 * 60 * 1000,
  });

  const SOCIAL_LINKS = [
    { key: "instagram",  icon: <SiInstagram className="w-4 h-4" />,  url: publicSettings?.instagram,  label: "Instagram" },
    { key: "twitter",    icon: <SiX className="w-4 h-4" />,           url: publicSettings?.twitter,    label: "X / Twitter" },
    { key: "linkedin",   icon: <Linkedin className="w-4 h-4" />,      url: publicSettings?.linkedin,   label: "LinkedIn" },
    { key: "tiktok",     icon: <SiTiktok className="w-4 h-4" />,      url: publicSettings?.tiktok,     label: "TikTok" },
    { key: "snapchat",   icon: <SiSnapchat className="w-4 h-4" />,    url: publicSettings?.snapchat,   label: "Snapchat" },
    { key: "youtube",    icon: <SiYoutube className="w-4 h-4" />,     url: publicSettings?.youtube,    label: "YouTube" },
    { key: "whatsapp",   icon: <SiWhatsapp className="w-4 h-4" />,    url: publicSettings?.whatsapp ? `https://wa.me/${publicSettings.whatsapp.replace(/\D/g, "")}` : undefined, label: "WhatsApp" },
    { key: "linktree",   icon: <SiLinktree className="w-4 h-4" />,    url: publicSettings?.linktree,   label: "Linktree" },
  ].filter(s => !!s.url);

  const STORES = [
    {
      key: "playStore",
      icon: <SiGoogleplay className="w-5 h-5 text-white" />,
      iconBg: "bg-[#01875f]",
      label: L ? "احصل عليه من" : "Get it on",
      name: "Google Play",
      url: downloads?.playStore.url || "",
      enabled: downloads?.playStore.enabled ?? false,
    },
    {
      key: "appStore",
      icon: <SiApple className="w-5 h-5 text-white" />,
      iconBg: "bg-black dark:bg-white",
      label: L ? "حمّل من" : "Download on the",
      name: "App Store",
      url: downloads?.appStore.url || "",
      enabled: downloads?.appStore.enabled ?? false,
    },
    {
      key: "msStore",
      icon: <AppWindow className="w-5 h-5 text-white" />,
      iconBg: "bg-[#0078d4]",
      label: L ? "احصل عليه من" : "Get it from",
      name: "Microsoft Store",
      url: downloads?.msStore.url || "",
      enabled: downloads?.msStore.enabled ?? false,
    },
  ].filter(s => s.url);

  return (
    <footer className="relative bg-[#fafafa] dark:bg-gray-950 pt-24 pb-10 overflow-hidden border-t border-black/[0.06] dark:border-white/[0.06]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
          <div className="md:col-span-5">
            <div className="mb-6">
              <Link href="/" className="hover:opacity-80 transition-opacity inline-block">
                <img src="/qirox-logo-nobg.png" alt="QIROX" className="h-9 w-auto object-contain dark:invert" />
              </Link>
            </div>
            <p className="text-black/40 dark:text-white/40 text-[15px] leading-[1.8] max-w-sm mb-8">
              {t("footer.description")}
            </p>
            <div className="space-y-2">
              <p className="text-[11px] text-black/45 dark:text-white/45 font-semibold flex items-center gap-1.5">
                <span>🇸🇦</span>
                {L ? "شركة سعودية الأصل" : "Saudi-founded company"}
              </p>
              <div className="flex items-center gap-4">
                <span className="text-[11px] tracking-[3px] uppercase text-black/30 dark:text-white/30 font-medium flex items-center gap-1">🏙️ {L ? "الرياض" : "Riyadh"}</span>
                <span className="w-1 h-1 rounded-full bg-black/10 dark:bg-white/10" />
                <span className="text-[11px] tracking-[3px] uppercase text-black/30 dark:text-white/30 font-medium flex items-center gap-1">🏙️ {L ? "القاهرة" : "Cairo"}</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 md:col-start-7">
            <h4 className="text-[11px] font-semibold text-black/40 dark:text-white/40 uppercase tracking-[3px] mb-7">{t("footer.quickLinks")}</h4>
            <ul className="space-y-4">
              {[
                { href: "/systems", label: t("nav.portfolio") },
                { href: "/prices", label: t("nav.prices") },
                { href: "/about", label: t("nav.about") },
                { href: "/jobs", label: L ? "التوظيف" : "Careers" },
                { href: "/contact", label: t("nav.contact") },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-black/35 dark:text-white/35 hover:text-black dark:hover:text-white transition-colors text-sm flex items-center gap-1 group" data-testid={`footer-link-${link.href.replace('/', '')}`}>
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[11px] font-semibold text-black/40 dark:text-white/40 uppercase tracking-[3px] mb-7">{t("nav.contact")}</h4>
            <ul className="space-y-4">
              {[
                { href: "/contact", label: t("nav.contact") },
                { href: "/news", label: L ? "الأخبار" : "News" },
                { href: "/jobs", label: L ? "التوظيف" : "Careers" },
                { href: "/join", label: t("nav.startProject") },
                ...(user ? [{ href: "/clients-group", label: L ? "مجموعة العملاء" : "Client Group" }] : []),
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-black/35 dark:text-white/35 hover:text-black dark:hover:text-white transition-colors text-sm flex items-center gap-1 group" data-testid={`footer-link-${link.href.replace('/', '').replace('-', '')}`}>
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[11px] font-semibold text-black/40 dark:text-white/40 uppercase tracking-[3px] mb-7">{t("footer.legal")}</h4>
            <ul className="space-y-4">
              {[
                { href: "/privacy", label: t("footer.privacy") },
                { href: "/terms", label: t("footer.terms") },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-black/35 dark:text-white/35 hover:text-black dark:hover:text-white transition-colors text-sm flex items-center gap-1 group" data-testid={`footer-link-${link.href.replace('/', '')}`}>
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Supported Countries Section ── */}
        <div className="h-[1px] bg-black/[0.06] dark:bg-white/[0.06] mb-8" />
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-black/[0.05] dark:bg-white/[0.06] flex items-center justify-center">
                <Globe className="w-3.5 h-3.5 text-black/50 dark:text-white/50" />
              </div>
              <div>
                <p className="text-[11px] tracking-[2px] uppercase text-black/40 dark:text-white/40 font-semibold">
                  {L ? "الدول المدعومة" : "Supported Countries"}
                </p>
                <p className="text-[10px] text-black/25 dark:text-white/25 mt-0.5">
                  {L
                    ? `الموقع يعمل الآن بـ ${COUNTRY_NAMES_AR[currency.countryCode] || currency.countryCode} · ${currency.symbol} — اضغط لتغيير الدولة`
                    : `Currently showing ${COUNTRY_NAMES_EN[currency.countryCode] || currency.countryCode} · ${currency.symbol} — click to switch`
                  }
                </p>
              </div>
            </div>
            {getManualCountry() && (
              <button
                onClick={clearManualCountry}
                className="flex items-center gap-1.5 text-[10px] font-semibold text-black/30 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60 transition-colors"
                data-testid="btn-reset-country"
              >
                <RotateCcw className="w-3 h-3" />
                {L ? "إعادة الكشف التلقائي" : "Reset to auto-detect"}
              </button>
            )}
          </div>
          <CountrySwitcher lang={lang} />
        </div>

        {/* App Download Strip */}
        {STORES.length > 0 && (
          <>
            <div className="h-[1px] bg-black/[0.06] dark:bg-white/[0.06] mb-8" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <p className="text-[11px] tracking-[2px] uppercase text-black/25 dark:text-white/25 font-medium flex-shrink-0">
                {L ? "حمّل تطبيق كيروكس" : "Download Qirox App"}
              </p>
              <div className="flex flex-wrap gap-2">
                {STORES.map(store => (
                  store.enabled ? (
                    <a
                      key={store.key}
                      href={store.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`footer-download-${store.key}`}
                      className="flex items-center gap-2.5 bg-black dark:bg-white/10 hover:bg-black/80 dark:hover:bg-white/20 border border-white/5 text-white rounded-xl px-3 py-2 transition-all duration-200 group"
                    >
                      <span className={`${store.iconBg} w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0`}>
                        {store.icon}
                      </span>
                      <div className="leading-tight">
                        <p className="text-[9px] text-white/40 group-hover:text-white/60 transition-colors">{store.label}</p>
                        <p className="text-[11px] font-bold text-white whitespace-nowrap">{store.name}</p>
                      </div>
                    </a>
                  ) : (
                    <div
                      key={store.key}
                      data-testid={`footer-coming-soon-${store.key}`}
                      className="relative flex items-center gap-2.5 bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.07] dark:border-white/[0.07] rounded-xl px-3 py-2 cursor-default overflow-hidden"
                    >
                      <span className="w-7 h-7 rounded-lg bg-black/[0.06] dark:bg-white/[0.06] flex items-center justify-center flex-shrink-0 text-black/20 dark:text-white/20">
                        {store.icon}
                      </span>
                      <div className="leading-tight">
                        <p className="text-[9px] text-black/25 dark:text-white/25">{store.label}</p>
                        <p className="text-[11px] font-bold text-black/40 dark:text-white/40 whitespace-nowrap">{store.name}</p>
                      </div>
                      <span className="absolute top-1 left-1 text-[8px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md leading-none">
                        {L ? "قريباً" : "Soon"}
                      </span>
                    </div>
                  )
                ))}
              </div>
            </div>
          </>
        )}

        {/* WhatsApp Channel Banner */}
        <div className="h-[1px] bg-black/[0.06] dark:bg-white/[0.06] mb-8" />
        <div className="mb-8">
          <a
            href="https://whatsapp.com/channel/0029VbCzt1a17En1ClfrWt2i"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="footer-whatsapp-channel"
            className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#f0fdf4] dark:bg-[#0d2b1a] border border-[#25D366]/20 hover:border-[#25D366]/50 rounded-2xl px-6 py-5 transition-all duration-300 hover:shadow-lg hover:shadow-[#25D366]/10"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#25D366] flex items-center justify-center shadow-md shadow-[#25D366]/30 shrink-0">
                <SiWhatsapp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-black dark:text-white text-sm leading-snug">
                  {L ? "📢 انضم لقناة QIROX على واتساب" : "📢 Join QIROX WhatsApp Channel"}
                </p>
                <p className="text-xs text-black/45 dark:text-white/45 mt-0.5">
                  {L ? "عروض حصرية · آخر المشاريع · خصومات العملاء" : "Exclusive offers · Latest projects · Client discounts"}
                </p>
              </div>
            </div>
            <span className="shrink-0 text-xs font-bold bg-[#25D366] text-white px-4 py-2 rounded-xl group-hover:bg-[#1faf55] transition-colors">
              {L ? "انضم الآن" : "Join Now"}
            </span>
          </a>
        </div>

        {SOCIAL_LINKS.length > 0 && (
          <>
            <div className="h-[1px] bg-black/[0.06] dark:bg-white/[0.06] mb-8" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <p className="text-[11px] tracking-[2px] uppercase text-black/25 dark:text-white/25 font-medium flex-shrink-0">
                {L ? "تابعنا" : "Follow Us"}
              </p>
              <div className="flex flex-wrap gap-2">
                {SOCIAL_LINKS.map(s => (
                  <a
                    key={s.key}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    data-testid={`footer-social-${s.key}`}
                    className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black dark:hover:bg-white border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-center text-black/40 dark:text-white/40 hover:text-white dark:hover:text-black transition-all duration-200"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="h-[1px] bg-black/[0.06] dark:bg-white/[0.06] mb-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-black/25 dark:text-white/25 text-xs">
            © {new Date().getFullYear()} QIROX Systems Factory. {t("footer.rights")}.
          </p>
          <p className="text-black/15 dark:text-white/15 text-[10px] tracking-[2px] uppercase">
            Build Systems. Stay Human.
          </p>
        </div>
      </div>
    </footer>
  );
}
