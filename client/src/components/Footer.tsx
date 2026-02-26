import { Link } from "wouter";
import qiroxLogoPath from "@assets/QIROX_LOGO_1771674917456.png";
import { ArrowUpRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="relative bg-[#fafafa] dark:bg-gray-950 pt-24 pb-10 overflow-hidden border-t border-black/[0.06] dark:border-white/[0.06]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5 mb-6">
              <img src={qiroxLogoPath} alt="QIROX" className="h-8 w-auto object-contain dark:brightness-[2]" />
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
                { href: "/portfolio", label: t("nav.portfolio") },
                { href: "/prices", label: t("nav.prices") },
                { href: "/about", label: t("nav.about") },
                { href: "/services", label: t("nav.services") },
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
                { href: "/jobs", label: t("nav.portfolio") },
                { href: "/news", label: t("nav.home") },
                { href: "/join", label: t("nav.startProject") },
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
