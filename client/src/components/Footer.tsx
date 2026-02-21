import { Link } from "wouter";
import qiroxLogoPath from "@assets/QIROX_LOGO_1771674917456.png";
import { ArrowUpRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative bg-[#07070A] pt-24 pb-10 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.12), transparent)" }} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5 mb-6">
              <img src={qiroxLogoPath} alt="QIROX" className="h-8 w-auto object-contain" />
            </div>
            <p className="text-white/30 text-[15px] leading-[1.8] max-w-sm mb-8">
              مصنع الأنظمة الرقمية — نبني بنية تحتية رقمية متكاملة للشركات والمؤسسات في السعودية ومصر.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-[11px] tracking-[3px] uppercase text-[#00D4FF]/40 font-medium">الرياض</span>
              <span className="w-1 h-1 rounded-full bg-white/10" />
              <span className="text-[11px] tracking-[3px] uppercase text-[#00D4FF]/40 font-medium">القاهرة</span>
            </div>
          </div>

          <div className="md:col-span-2 md:col-start-7">
            <h4 className="text-[11px] font-semibold text-white/40 uppercase tracking-[3px] mb-7">المنصة</h4>
            <ul className="space-y-4">
              {[
                { href: "/portfolio", label: "الأنظمة" },
                { href: "/prices", label: "الباقات" },
                { href: "/about", label: "عن المنصة" },
                { href: "/services", label: "الخدمات" },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/25 hover:text-[#00D4FF] transition-colors text-sm flex items-center gap-1 group" data-testid={`footer-link-${link.href.replace('/', '')}`}>
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[11px] font-semibold text-white/40 uppercase tracking-[3px] mb-7">الشركة</h4>
            <ul className="space-y-4">
              {[
                { href: "/contact", label: "تواصل معنا" },
                { href: "/jobs", label: "الوظائف" },
                { href: "/news", label: "الأخبار" },
                { href: "/join", label: "انضم لنا" },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/25 hover:text-[#00D4FF] transition-colors text-sm flex items-center gap-1 group" data-testid={`footer-link-${link.href.replace('/', '')}`}>
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[11px] font-semibold text-white/40 uppercase tracking-[3px] mb-7">قانوني</h4>
            <ul className="space-y-4">
              {[
                { href: "/privacy", label: "الخصوصية" },
                { href: "/terms", label: "الشروط" },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/25 hover:text-[#00D4FF] transition-colors text-sm flex items-center gap-1 group" data-testid={`footer-link-${link.href.replace('/', '')}`}>
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="h-[1px] bg-white/[0.06] mb-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/15 text-xs">
            © {new Date().getFullYear()} QIROX Systems Factory. جميع الحقوق محفوظة.
          </p>
          <p className="text-white/10 text-[10px] tracking-[2px] uppercase">
            Build Systems. Stay Human.
          </p>
        </div>
      </div>
    </footer>
  );
}
