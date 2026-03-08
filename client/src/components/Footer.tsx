import { Link } from "wouter";
import qiroxLogoPath from "@assets/QIROX_LOGO_1771674917456.png";
import { ArrowUpRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { SiGoogleplay, SiApple, SiInstagram, SiX, SiLinkedin, SiTiktok, SiSnapchat, SiYoutube, SiWhatsapp } from "react-icons/si";
import { AppWindow } from "lucide-react";

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
  contactPhone?: string;
  contactEmail?: string;
};

export default function Footer() {
  const { t, lang } = useI18n();
  const { data: user } = useUser();

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
    { key: "linkedin",   icon: <SiLinkedin className="w-4 h-4" />,   url: publicSettings?.linkedin,   label: "LinkedIn" },
    { key: "tiktok",     icon: <SiTiktok className="w-4 h-4" />,     url: publicSettings?.tiktok,     label: "TikTok" },
    { key: "snapchat",   icon: <SiSnapchat className="w-4 h-4" />,   url: publicSettings?.snapchat,   label: "Snapchat" },
    { key: "youtube",    icon: <SiYoutube className="w-4 h-4" />,    url: publicSettings?.youtube,    label: "YouTube" },
    { key: "whatsapp",   icon: <SiWhatsapp className="w-4 h-4" />,   url: publicSettings?.whatsapp ? `https://wa.me/${publicSettings.whatsapp.replace(/\D/g, "")}` : undefined, label: "WhatsApp" },
  ].filter(s => !!s.url);

  const STORES = [
    {
      key: "playStore",
      icon: <SiGoogleplay className="w-5 h-5 text-white" />,
      iconBg: "bg-[#01875f]",
      label: lang === "ar" ? "احصل عليه من" : "Get it on",
      name: "Google Play",
      url: downloads?.playStore.url || "",
      enabled: downloads?.playStore.enabled ?? false,
    },
    {
      key: "appStore",
      icon: <SiApple className="w-5 h-5 text-white" />,
      iconBg: "bg-black dark:bg-white",
      label: lang === "ar" ? "حمّل من" : "Download on the",
      name: "App Store",
      url: downloads?.appStore.url || "",
      enabled: downloads?.appStore.enabled ?? false,
    },
    {
      key: "msStore",
      icon: <AppWindow className="w-5 h-5 text-white" />,
      iconBg: "bg-[#0078d4]",
      label: lang === "ar" ? "احصل عليه من" : "Get it from",
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
            <div className="flex items-center gap-2.5 mb-6">
              <img src={qiroxLogoPath} alt="QIROX" className="h-8 w-auto object-contain dark:invert" />
            </div>
            <p className="text-black/40 dark:text-white/40 text-[15px] leading-[1.8] max-w-sm mb-8">
              {t("footer.description")}
            </p>
            <div className="flex items-center gap-4">
              <span className="text-[11px] tracking-[3px] uppercase text-black/30 dark:text-white/30 font-medium">الرياض</span>
              <span className="w-1 h-1 rounded-full bg-black/10 dark:bg-white/10" />
              <span className="text-[11px] tracking-[3px] uppercase text-black/30 dark:text-white/30 font-medium">القاهرة</span>
            </div>
          </div>

          <div className="md:col-span-2 md:col-start-7">
            <h4 className="text-[11px] font-semibold text-black/40 dark:text-white/40 uppercase tracking-[3px] mb-7">{t("footer.quickLinks")}</h4>
            <ul className="space-y-4">
              {[
                { href: "/systems", label: t("nav.portfolio") },
                { href: "/prices", label: t("nav.prices") },
                { href: "/about", label: t("nav.about") },
                { href: "/jobs", label: lang === "ar" ? "التوظيف" : "Careers" },
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
                { href: "/news", label: lang === "ar" ? "الأخبار" : "News" },
                { href: "/jobs", label: lang === "ar" ? "التوظيف" : "Careers" },
                { href: "/join", label: t("nav.startProject") },
                ...(user ? [{ href: "/clients-group", label: lang === "ar" ? "مجموعة العملاء" : "Client Group" }] : []),
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

        {/* App Download Strip — shown above the copyright bar */}
        {STORES.length > 0 && (
          <>
            <div className="h-[1px] bg-black/[0.06] dark:bg-white/[0.06] mb-8" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <p className="text-[11px] tracking-[2px] uppercase text-black/25 dark:text-white/25 font-medium flex-shrink-0">
                {lang === "ar" ? "حمّل تطبيق كيروكس" : "Download Qirox App"}
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
                        {lang === "ar" ? "قريباً" : "Soon"}
                      </span>
                    </div>
                  )
                ))}
              </div>
            </div>
          </>
        )}

        {SOCIAL_LINKS.length > 0 && (
          <>
            <div className="h-[1px] bg-black/[0.06] dark:bg-white/[0.06] mb-8" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <p className="text-[11px] tracking-[2px] uppercase text-black/25 dark:text-white/25 font-medium flex-shrink-0">
                {lang === "ar" ? "تابعنا" : "Follow Us"}
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
