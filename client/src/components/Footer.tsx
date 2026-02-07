import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-primary text-white pt-16 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                 <img src="/logo.png" alt="Qirox Logo" className="w-8 h-8 object-contain filter invert opacity-90" />
              </div>
              <span className="font-heading font-bold text-2xl text-white">Qirox</span>
            </div>
            <p className="text-slate-300 text-lg leading-relaxed max-w-md">
              نحن نبني الأنظمة الرقمية التي تمكّن الشركات والمؤسسات من النمو. حلول تقنية متكاملة، تصميم احترافي، ودعم مستمر.
            </p>
          </div>

          <div>
            <h4 className="font-heading font-bold text-lg mb-6 text-secondary">روابط سريعة</h4>
            <ul className="space-y-4">
              <li><Link href="/" className="text-slate-300 hover:text-white transition-colors">الرئيسية</Link></li>
              <li><Link href="/services" className="text-slate-300 hover:text-white transition-colors">خدماتنا</Link></li>
              <li><Link href="/about" className="text-slate-300 hover:text-white transition-colors">عن الشركة</Link></li>
              <li><Link href="/contact" className="text-slate-300 hover:text-white transition-colors">اتصل بنا</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-lg mb-6 text-secondary">تواصل معنا</h4>
            <ul className="space-y-4 text-slate-300">
              <li className="flex items-center gap-3">
                <span>info@qirox.tech</span>
              </li>
              <li className="flex items-center gap-3">
                <span>السعودية | مصر</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} Qirox. جميع الحقوق محفوظة.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">سياسة الخصوصية</a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">الشروط والأحكام</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
