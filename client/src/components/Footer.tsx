import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-[#111111] text-white pt-16 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <span className="font-heading font-black text-2xl text-white tracking-tight mb-4 block">QIROX</span>
            <p className="text-white/40 text-base leading-relaxed max-w-md">
              منصة توليد وإدارة الأنظمة الرقمية. نبني بنية تحتية رقمية متكاملة للشركات والمؤسسات في السعودية ومصر.
            </p>
          </div>

          <div>
            <h4 className="font-heading font-bold text-sm mb-6 text-white/60 uppercase tracking-widest">روابط</h4>
            <ul className="space-y-3">
              <li><Link href="/" className="text-white/40 hover:text-white transition-colors text-sm">الرئيسية</Link></li>
              <li><Link href="/portfolio" className="text-white/40 hover:text-white transition-colors text-sm">الأنظمة</Link></li>
              <li><Link href="/prices" className="text-white/40 hover:text-white transition-colors text-sm">الباقات</Link></li>
              <li><Link href="/about" className="text-white/40 hover:text-white transition-colors text-sm">عن المنصة</Link></li>
              <li><Link href="/contact" className="text-white/40 hover:text-white transition-colors text-sm">تواصل معنا</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-sm mb-6 text-white/60 uppercase tracking-widest">تواصل</h4>
            <ul className="space-y-3 text-white/40 text-sm">
              <li>info@qirox.tech</li>
              <li>السعودية | مصر</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} QIROX Systems Factory. جميع الحقوق محفوظة.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-white/30 hover:text-white/60 transition-colors text-xs">سياسة الخصوصية</Link>
            <Link href="/terms" className="text-white/30 hover:text-white/60 transition-colors text-xs">الشروط والأحكام</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
