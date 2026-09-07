import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { SiInstagram, SiX, SiWhatsapp } from "react-icons/si";
import { Linkedin } from "lucide-react";

export default function FooterV2() {
  const { t, lang } = useI18n();
  const L = lang === "ar";
  
  return (
    <footer className="bg-background pt-20 pb-10 border-t border-border">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <Link href="/" className="inline-block mb-6">
              <img src="/qirox-icon-nobg.png" alt="QIROX" className="h-10 w-auto" />
            </Link>
            <p className="text-muted-foreground max-w-sm leading-relaxed mb-6">
              {t("v2.hero.subtitle")}
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-brand hover:text-white transition-colors">
                <SiWhatsapp className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-brand hover:text-white transition-colors">
                <SiX className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-brand hover:text-white transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-brand hover:text-white transition-colors">
                <SiInstagram className="w-4 h-4" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-foreground">{L ? "روابط سريعة" : "Quick Links"}</h4>
            <ul className="space-y-4">
              <li><Link href="/systems" className="text-muted-foreground hover:text-brand transition-colors">{t("nav.portfolio")}</Link></li>
              <li><Link href="/prices" className="text-muted-foreground hover:text-brand transition-colors">{t("nav.prices")}</Link></li>
              <li><Link href="/about" className="text-muted-foreground hover:text-brand transition-colors">{t("nav.about")}</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-brand transition-colors">{t("nav.contact")}</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-foreground">{L ? "السياسات" : "Legal"}</h4>
            <ul className="space-y-4">
              <li><Link href="/privacy" className="text-muted-foreground hover:text-brand transition-colors">{t("footer.privacy")}</Link></li>
              <li><Link href="/terms" className="text-muted-foreground hover:text-brand transition-colors">{t("footer.terms")}</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} QIROX Systems Factory. {t("footer.rights")}.
          </p>
          <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground/50">
            Build Systems. Stay Human.
          </p>
        </div>
      </div>
    </footer>
  );
}
