import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="relative bg-[#07070A] pt-20 pb-10 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.15), transparent)" }} />
      <div className="absolute inset-0 dot-grid opacity-10" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #00D4FF, #0099CC)" }}>
                <span className="text-sm font-black text-[#0A0A0F] font-heading">Q</span>
              </div>
              <span className="font-heading font-black text-lg text-white tracking-tight">QIROX</span>
            </div>
            <p className="text-white/25 text-sm leading-relaxed max-w-md">
              منصة توليد وإدارة الأنظمة الرقمية. نبني بنية تحتية رقمية متكاملة للشركات والمؤسسات في السعودية ومصر.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white/30 uppercase tracking-[3px] mb-6">روابط</h4>
            <ul className="space-y-3">
              {[
                { href: "/", label: "الرئيسية" },
                { href: "/portfolio", label: "الأنظمة" },
                { href: "/prices", label: "الباقات" },
                { href: "/about", label: "عن المنصة" },
                { href: "/contact", label: "تواصل معنا" },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/20 hover:text-[#00D4FF] transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white/30 uppercase tracking-[3px] mb-6">تواصل</h4>
            <ul className="space-y-3 text-white/20 text-sm">
              <li>info@qirox.tech</li>
              <li>السعودية | مصر</li>
            </ul>
          </div>
        </div>

        <div className="h-[1px] bg-white/5 mb-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/15 text-xs">
            © {new Date().getFullYear()} QIROX Systems Factory. جميع الحقوق محفوظة.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-white/15 hover:text-white/40 transition-colors text-xs">سياسة الخصوصية</Link>
            <Link href="/terms" className="text-white/15 hover:text-white/40 transition-colors text-xs">الشروط والأحكام</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
