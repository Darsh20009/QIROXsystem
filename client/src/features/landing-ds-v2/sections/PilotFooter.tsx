import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { Link } from "wouter";
import { MapPin, Linkedin } from "lucide-react";
import { SiInstagram, SiX, SiTiktok, SiSnapchat, SiYoutube, SiWhatsapp, SiLinktree } from "react-icons/si";

type PublicSettings = {
  instagram?: string; twitter?: string; linkedin?: string; snapchat?: string;
  youtube?: string; tiktok?: string; whatsapp?: string; linktree?: string;
};

export default function PilotFooter() {
  const { t, lang } = useI18n();
  const L = lang === "ar";

  const { data: publicSettings } = useQuery<PublicSettings>({
    queryKey: ["/api/public/settings"],
    staleTime: 10 * 60 * 1000,
  });

  const SOCIAL_LINKS = [
    { key: "instagram", icon: <SiInstagram className="w-4 h-4" />, url: publicSettings?.instagram, label: "Instagram" },
    { key: "twitter",   icon: <SiX className="w-4 h-4" />,          url: publicSettings?.twitter,   label: "X / Twitter" },
    { key: "linkedin",  icon: <Linkedin className="w-4 h-4" strokeWidth={1.75} />, url: publicSettings?.linkedin, label: "LinkedIn" },
    { key: "tiktok",    icon: <SiTiktok className="w-4 h-4" />,     url: publicSettings?.tiktok,    label: "TikTok" },
    { key: "snapchat",  icon: <SiSnapchat className="w-4 h-4" />,   url: publicSettings?.snapchat,  label: "Snapchat" },
    { key: "youtube",   icon: <SiYoutube className="w-4 h-4" />,    url: publicSettings?.youtube,   label: "YouTube" },
    { key: "whatsapp",  icon: <SiWhatsapp className="w-4 h-4" />,   url: publicSettings?.whatsapp ? `https://wa.me/${publicSettings.whatsapp.replace(/\D/g, "")}` : undefined, label: "WhatsApp" },
    { key: "linktree",  icon: <SiLinktree className="w-4 h-4" />,   url: publicSettings?.linktree,  label: "Linktree" },
  ].filter(s => !!s.url);

  return (
    <footer className="bg-ds-surface-0 border-t border-ds-border-hairline pt-20 pb-10">
      <div className="max-w-ds-container-xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <Link href="/" className="inline-block mb-6 outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring rounded-ds-sm">
              <img src="/qirox-logo-nobg.png" alt="QIROX" className="h-8 w-auto object-contain dark:invert" />
            </Link>
            <p className="text-ds-sm text-ds-muted-foreground leading-relaxed max-w-sm mb-6">
              {t("dsv2.footer.description")}
            </p>
            <div className="flex items-center gap-2">
              <MapPin size={14} strokeWidth={1.75} className="text-ds-muted-foreground" />
              <span className="text-ds-xs tracking-wide uppercase text-ds-muted-foreground font-semibold">{L ? "الرياض، السعودية" : "Riyadh, Saudi Arabia"}</span>
            </div>
          </div>
          
          <div>
            <h4 className="text-ds-xs font-semibold uppercase tracking-widest text-ds-foreground mb-6">
              {t("dsv2.footer.legal")}
            </h4>
            <ul className="space-y-4">
              <li>
                <Link href="/privacy" className="text-ds-sm text-ds-muted-foreground hover:text-ds-foreground transition-colors">
                  {t("dsv2.footer.privacy")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-ds-sm text-ds-muted-foreground hover:text-ds-foreground transition-colors">
                  {t("dsv2.footer.terms")}
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-ds-xs font-semibold uppercase tracking-widest text-ds-foreground mb-6">
              {t("dsv2.footer.contact")}
            </h4>
            <div className="flex flex-wrap gap-3">
              {SOCIAL_LINKS.map(s => (
                <a 
                  key={s.key} 
                  href={s.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label={s.label}
                  className="w-10 h-10 rounded-ds-sm bg-ds-surface-1 border border-ds-border-hairline flex items-center justify-center text-ds-muted-foreground hover:text-ds-foreground hover:border-ds-border-emphasis hover:bg-ds-surface-2 transition-all duration-ds-fast shadow-sm"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-ds-border-hairline flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-ds-xs text-ds-muted-foreground font-medium">
            © {new Date().getFullYear()} QIROX Systems Factory. {t("dsv2.footer.rights")}.
          </p>
          <p className="text-[10px] tracking-[2px] text-ds-gray-400 uppercase font-bold">
            Build Systems. Stay Human.
          </p>
        </div>
      </div>
    </footer>
  );
}
