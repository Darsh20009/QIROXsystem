import { useState } from "react";
import { Link } from "wouter";
import { ArrowUpRight, Globe, RotateCcw, Check } from "lucide-react";
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
  instagram?: string; twitter?: string; linkedin?: string; snapchat?: string;
  youtube?: string; tiktok?: string; whatsapp?: string; linktree?: string;
};

/* ─── Regions ─── */
type Region = "gulf" | "arab" | "europe" | "asia" | "americas" | "africa";

const REGIONS: { id: Region; emoji: string; labelAr: string; labelEn: string }[] = [
  { id: "gulf",     emoji: "🛢️", labelAr: "الخليج",       labelEn: "Gulf" },
  { id: "arab",     emoji: "🌙", labelAr: "العالم العربي", labelEn: "Arab World" },
  { id: "europe",   emoji: "🏰", labelAr: "أوروبا",        labelEn: "Europe" },
  { id: "asia",     emoji: "🎋", labelAr: "آسيا",           labelEn: "Asia" },
  { id: "americas", emoji: "🗽", labelAr: "الأمريكتان",   labelEn: "Americas" },
  { id: "africa",   emoji: "🌍", labelAr: "أفريقيا",       labelEn: "Africa" },
];

/* Egypt appears in BOTH arab + africa since it is geographically in NE Africa */
const REGION_COUNTRIES: Record<Region, string[]> = {
  gulf:     ["SA","AE","KW","QA","BH","OM"],
  arab:     ["EG","JO","IQ","MA","TN","DZ","LY","SD","LB","SY","YE","PS"],
  europe:   ["GB","DE","FR","IT","ES","NL","PT","BE","CH","AT","GR","SE","NO","DK","FI","PL","CZ","HU","RO","IE","TR","RU","UA"],
  asia:     ["IN","PK","BD","JP","CN","KR","SG","MY","TH","PH","ID","VN"],
  americas: ["US","CA","BR","MX","AR"],
  africa:   ["EG","ZA","NG","KE","GH","ET","MA","TN"],
};

/* ─── Country Card ─── */
function CountryCard({ code, isActive, lang }: { code: string; isActive: boolean; lang: string }) {
  const def = getCurrencyForCountry(code);
  const L = lang === "ar";
  const name = L ? (COUNTRY_NAMES_AR[code] || code) : (COUNTRY_NAMES_EN[code] || code);

  return (
    <button
      onClick={() => setManualCountry(code)}
      title={name}
      data-testid={`footer-country-${code}`}
      className={`relative flex flex-col items-center gap-1 p-2.5 rounded-ds-xl border transition-all duration-ds-fast min-w-[66px] w-[66px] sm:w-auto sm:min-w-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring ${
        isActive
          ? "bg-ds-foreground border-ds-foreground shadow-ds-md"
          : "bg-ds-surface-0 border-ds-border-hairline hover:border-ds-border-emphasis hover:bg-ds-surface-1"
      }`}
    >
      {isActive && (
        <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-ds-full bg-ds-background flex items-center justify-center">
          <Check className="w-2 h-2 text-ds-foreground" strokeWidth={3} />
        </span>
      )}
      <span className="text-ds-xl leading-none">{countryToFlag(code)}</span>
      <span className={`text-[10px] font-semibold leading-tight text-center max-w-[60px] truncate ${
        isActive ? "text-ds-background" : "text-ds-muted-foreground"
      }`}>
        {name}
      </span>
    </button>
  );
}

/* ─── Countries Switcher ─── */
function CountrySwitcher({ lang }: { lang: string }) {
  const currency = useCurrency();
  const [activeRegion, setActiveRegion] = useState<Region>("gulf");
  const L = lang === "ar";
  const isManual = !!getManualCountry();

  const countries = REGION_COUNTRIES[activeRegion];

  return (
    <div>
      {/* ── Region Tabs (horizontal scroll on mobile) ── */}
      <div className="overflow-x-auto pb-1 mb-4 scrollbar-none -mx-1">
        <div className="flex gap-1.5 px-1 min-w-max">
          {REGIONS.map(r => (
            <button
              key={r.id}
              onClick={() => setActiveRegion(r.id)}
              data-testid={`footer-region-${r.id}`}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-ds-xl text-ds-xs font-semibold whitespace-nowrap transition-all duration-ds-fast border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring ${
                activeRegion === r.id
                  ? "bg-ds-foreground text-ds-background border-ds-foreground"
                  : "bg-transparent text-ds-muted-foreground border-ds-border-hairline hover:bg-ds-surface-2 hover:text-ds-foreground"
              }`}
            >
              <span>{r.emoji}</span>
              <span>{L ? r.labelAr : r.labelEn}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Country Grid (horizontal scroll on mobile, wrap on desktop) ── */}
      <div className="overflow-x-auto pb-2 scrollbar-none -mx-1">
        <div className="flex flex-nowrap sm:flex-wrap gap-2 px-1 min-w-max sm:min-w-0">
          {countries.map(code => (
            <CountryCard
              key={code}
              code={code}
              isActive={currency.countryCode === code}
              lang={lang}
            />
          ))}
        </div>
      </div>

      {/* ── Current + Reset ── */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-ds-border-hairline">
        <div className="flex items-center gap-2">
          <span className="text-ds-base">{countryToFlag(currency.countryCode || "SA")}</span>
          <div>
            <p className="text-ds-xs font-semibold text-ds-muted-foreground">
              {L
                ? `الموقع يعمل بـ ${COUNTRY_NAMES_AR[currency.countryCode] || currency.countryCode}`
                : `Showing ${COUNTRY_NAMES_EN[currency.countryCode] || currency.countryCode}`
              }
            </p>
          </div>
        </div>
        {isManual && (
          <button
            onClick={clearManualCountry}
            className="flex items-center gap-1.5 text-[10px] font-semibold text-ds-muted-foreground hover:text-ds-foreground transition-colors bg-ds-surface-1 hover:bg-ds-surface-2 px-3 py-2 rounded-ds-xl border border-ds-border-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring"
            data-testid="btn-reset-country"
          >
            <RotateCcw className="w-3 h-3" strokeWidth={1.75} />
            {L ? "كشف تلقائي" : "Auto-detect"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Footer ─── */
export default function FooterDSV2() {
  const { t, lang } = useI18n();
  const { data: user } = useUser();
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
    { key: "instagram", icon: <SiInstagram className="w-4 h-4" />, url: publicSettings?.instagram, label: "Instagram" },
    { key: "twitter",   icon: <SiX className="w-4 h-4" />,          url: publicSettings?.twitter,   label: "X / Twitter" },
    { key: "linkedin",  icon: <Linkedin className="w-4 h-4" strokeWidth={1.75} />,     url: publicSettings?.linkedin,  label: "LinkedIn" },
    { key: "tiktok",    icon: <SiTiktok className="w-4 h-4" />,     url: publicSettings?.tiktok,    label: "TikTok" },
    { key: "snapchat",  icon: <SiSnapchat className="w-4 h-4" />,   url: publicSettings?.snapchat,  label: "Snapchat" },
    { key: "youtube",   icon: <SiYoutube className="w-4 h-4" />,    url: publicSettings?.youtube,   label: "YouTube" },
    { key: "whatsapp",  icon: <SiWhatsapp className="w-4 h-4" />,   url: publicSettings?.whatsapp ? `https://wa.me/${publicSettings.whatsapp.replace(/\D/g, "")}` : undefined, label: "WhatsApp" },
    { key: "linktree",  icon: <SiLinktree className="w-4 h-4" />,   url: publicSettings?.linktree,  label: "Linktree" },
  ].filter(s => !!s.url);

  const STORES = [
    { key: "playStore", icon: <SiGoogleplay className="w-5 h-5 text-white" />, iconBg: "bg-[#01875f]", label: L ? "احصل عليه من" : "Get it on", name: "Google Play", url: downloads?.playStore.url || "", enabled: downloads?.playStore.enabled ?? false },
    { key: "appStore",  icon: <SiApple className="w-5 h-5 text-white" />,       iconBg: "bg-black",     label: L ? "حمّل من" : "Download on the", name: "App Store",    url: downloads?.appStore.url || "",  enabled: downloads?.appStore.enabled ?? false },
    { key: "msStore",   icon: <AppWindow className="w-5 h-5 text-white" strokeWidth={1.75} />,     iconBg: "bg-[#0078d4]", label: L ? "احصل عليه من" : "Get it from",  name: "Microsoft Store", url: downloads?.msStore.url || "", enabled: downloads?.msStore.enabled ?? false },
  ].filter(s => s.url);

  return (
    <footer className="relative bg-ds-surface-0 pt-24 pb-10 overflow-hidden border-t border-ds-border-hairline">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative z-[var(--ds-z-base)]">

        {/* ── Top grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-y-10 md:gap-x-12 md:gap-y-0 mb-16 md:mb-20">
          <div className="col-span-1 md:col-span-5">
            <div className="mb-6">
              <Link href="/" className="hover:opacity-80 transition-opacity inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring rounded-ds-sm">
                <img src="/qirox-logo-nobg.png" alt="QIROX" className="h-9 w-auto object-contain dark:invert" />
              </Link>
            </div>
            <p className="text-ds-muted-foreground text-ds-sm leading-relaxed max-w-sm mb-8">
              {t("footer.description")}
            </p>
            <div className="space-y-2">
              <p className="text-ds-xs text-ds-muted-foreground font-semibold flex items-center gap-1.5">
                <span>🇸🇦</span>
                {L ? "شركة سعودية الأصل" : "Saudi-founded company"}
              </p>
              <div className="flex items-center gap-4">
                <span className="text-[11px] tracking-[3px] uppercase text-ds-muted-foreground/70 font-medium flex items-center gap-1">🏙️ {L ? "الرياض" : "Riyadh"}</span>
                <span className="w-1 h-1 rounded-full bg-black/10 dark:bg-white/10" />
                <span className="text-[11px] tracking-[3px] uppercase text-ds-muted-foreground/70 font-medium flex items-center gap-1">🏙️ {L ? "القاهرة" : "Cairo"}</span>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 md:col-start-7">
            <h4 className="text-[11px] font-semibold text-ds-foreground uppercase tracking-[3px] mb-7">{t("footer.quickLinks")}</h4>
            <ul className="space-y-4">
              {[
                { href: "/systems",  label: t("nav.portfolio") },
                { href: "/prices",   label: t("nav.prices") },
                { href: "/about",    label: t("nav.about") },
                { href: "/jobs",     label: L ? "التوظيف" : "Careers" },
                { href: "/contact",  label: t("nav.contact") },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-ds-muted-foreground hover:text-ds-foreground transition-colors text-ds-sm flex items-center gap-1 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring rounded-ds-sm" data-testid={`footer-link-${link.href.replace('/', '')}`}>
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={1.75} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1 md:col-span-2">
            <h4 className="text-[11px] font-semibold text-ds-foreground uppercase tracking-[3px] mb-7">{t("nav.contact")}</h4>
            <ul className="space-y-4">
              {[
                { href: "/contact", label: t("nav.contact") },
                { href: "/news",    label: L ? "الأخبار" : "News" },
                { href: "/jobs",    label: L ? "التوظيف" : "Careers" },
                { href: "/join",    label: t("nav.startProject") },
                ...(user ? [{ href: "/clients-group", label: L ? "مجموعة العملاء" : "Client Group" }] : []),
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-ds-muted-foreground hover:text-ds-foreground transition-colors text-ds-sm flex items-center gap-1 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring rounded-ds-sm" data-testid={`footer-link-${link.href.replace('/', '').replace('-', '')}`}>
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={1.75} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1 md:col-span-2">
            <h4 className="text-[11px] font-semibold text-ds-foreground uppercase tracking-[3px] mb-7">{t("footer.legal")}</h4>
            <ul className="space-y-4">
              {[
                { href: "/privacy", label: t("footer.privacy") },
                { href: "/terms",   label: t("footer.terms") },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-ds-muted-foreground hover:text-ds-foreground transition-colors text-ds-sm flex items-center gap-1 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring rounded-ds-sm" data-testid={`footer-link-${link.href.replace('/', '')}`}>
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={1.75} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Supported Countries ── */}
        <div className="h-px bg-ds-border-hairline mb-8" />
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded-ds-xl bg-ds-surface-1 flex items-center justify-center flex-shrink-0">
              <Globe className="w-3.5 h-3.5 text-ds-muted-foreground" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[11px] tracking-[2px] uppercase text-ds-muted-foreground font-bold">
                {L ? "الدول المدعومة" : "Supported Countries"}
              </p>
              <p className="text-[10px] text-ds-muted-foreground/60 mt-0.5">
                {L ? "اضغط على أي دولة لتبديل العملة واللغة تلقائياً" : "Tap any country to switch currency & language"}
              </p>
            </div>
          </div>
          <CountrySwitcher lang={lang} />
        </div>

        {/* ── App Download Strip ── */}
        {STORES.length > 0 && (
          <>
            <div className="h-px bg-ds-border-hairline mb-8" />
            <div className="flex flex-row items-center justify-between gap-4 mb-8">
              <p className="text-[11px] tracking-[2px] uppercase text-ds-muted-foreground font-medium flex-shrink-0">
                {L ? "حمّل تطبيق كيروكس" : "Download Qirox App"}
              </p>
              <div className="flex flex-wrap gap-2">
                {STORES.map(store => (
                  store.enabled ? (
                    <a key={store.key} href={store.url} target="_blank" rel="noopener noreferrer" data-testid={`footer-download-${store.key}`}
                      className="flex items-center gap-2.5 bg-ds-foreground hover:opacity-90 border border-ds-foreground text-ds-background rounded-ds-xl px-3 py-2 transition-all duration-ds-fast shadow-ds-sm group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring">
                      <span className={`${store.iconBg} w-7 h-7 rounded-ds-lg flex items-center justify-center flex-shrink-0`}>{store.icon}</span>
                      <div className="leading-tight">
                        <p className="text-[9px] text-ds-background/70 group-hover:text-ds-background/90 transition-colors">{store.label}</p>
                        <p className="text-[11px] font-bold text-ds-background whitespace-nowrap">{store.name}</p>
                      </div>
                    </a>
                  ) : (
                    <div key={store.key} data-testid={`footer-coming-soon-${store.key}`}
                      className="relative flex items-center gap-2.5 bg-ds-surface-1 border border-ds-border-hairline rounded-ds-xl px-3 py-2 cursor-default overflow-hidden">
                      <span className="w-7 h-7 rounded-ds-lg bg-ds-surface-2 flex items-center justify-center flex-shrink-0 text-ds-muted-foreground">{store.icon}</span>
                      <div className="leading-tight">
                        <p className="text-[9px] text-ds-muted-foreground/70">{store.label}</p>
                        <p className="text-[11px] font-bold text-ds-muted-foreground whitespace-nowrap">{store.name}</p>
                      </div>
                      <span className="absolute top-1 left-1 text-[8px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-ds-md leading-none">
                        {L ? "قريباً" : "Soon"}
                      </span>
                    </div>
                  )
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── WhatsApp Channel ── */}
        <div className="h-px bg-ds-border-hairline mb-8" />
        <div className="mb-8">
          <a href="https://whatsapp.com/channel/0029VbCzt1a17En1ClfrWt2i" target="_blank" rel="noopener noreferrer" data-testid="footer-whatsapp-channel"
            className="group flex flex-row items-center justify-between gap-4 bg-[#f0fdf4] dark:bg-[#0d2b1a] border border-[#25D366]/20 hover:border-[#25D366]/50 rounded-ds-2xl px-6 py-5 transition-all duration-ds-base shadow-ds-sm hover:shadow-ds-md hover:shadow-[#25D366]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-ds-xl bg-[#25D366] flex items-center justify-center shadow-ds-sm shadow-[#25D366]/30 shrink-0">
                <SiWhatsapp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-ds-foreground text-ds-sm leading-snug">
                  {L ? "📢 انضم لقناة QIROX على واتساب" : "📢 Join QIROX WhatsApp Channel"}
                </p>
                <p className="text-ds-xs text-ds-muted-foreground mt-0.5">
                  {L ? "عروض حصرية · آخر المشاريع · خصومات العملاء" : "Exclusive offers · Latest projects · Client discounts"}
                </p>
              </div>
            </div>
            <span className="shrink-0 text-ds-xs font-bold bg-[#25D366] text-white px-4 py-2 rounded-ds-xl group-hover:bg-[#1faf55] transition-colors">
              {L ? "انضم الآن" : "Join Now"}
            </span>
          </a>
        </div>

        {/* ── Social Links ── */}
        {SOCIAL_LINKS.length > 0 && (
          <>
            <div className="h-px bg-ds-border-hairline mb-8" />
            <div className="flex flex-row items-center justify-between gap-4 mb-8">
              <p className="text-[11px] tracking-[2px] uppercase text-ds-muted-foreground font-medium flex-shrink-0">
                {L ? "تابعنا" : "Follow Us"}
              </p>
              <div className="flex flex-wrap gap-2">
                {SOCIAL_LINKS.map(s => (
                  <a key={s.key} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} data-testid={`footer-social-${s.key}`}
                    className="w-9 h-9 rounded-ds-xl bg-ds-surface-1 hover:bg-ds-surface-2 border border-ds-border-hairline hover:border-ds-border-emphasis flex items-center justify-center text-ds-muted-foreground hover:text-ds-foreground transition-all duration-ds-fast shadow-ds-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring">
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Copyright ── */}
        <div className="h-px bg-ds-border-hairline mb-8" />
        <div className="flex flex-row justify-between items-center gap-4">
          <p className="text-ds-muted-foreground text-ds-xs font-medium">
            © {new Date().getFullYear()} QIROX Systems Factory. {t("footer.rights")}.
          </p>
          <p className="text-ds-gray-400 text-[10px] tracking-[2px] uppercase font-bold">
            Build Systems. Stay Human.
          </p>
        </div>
      </div>
    </footer>
  );
}
