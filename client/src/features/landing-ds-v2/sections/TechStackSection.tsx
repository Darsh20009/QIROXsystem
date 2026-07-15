import { useI18n } from "@/lib/i18n";
import { Code2, Database, CreditCard, Smartphone, Globe } from "lucide-react";

export default function TechStackSection() {
  const { t, lang } = useI18n();
  const L = lang === "ar";

  const features = [
    { icon: Code2, title: "React + TypeScript", desc: L ? "واجهات مستخدم سريعة وقوية ومعتمدة" : "Fast, robust, and typed user interfaces" },
    { icon: Database, title: "Node.js + MongoDB", desc: L ? "بنية خلفية قابلة للتوسع والأداء العالي" : "Scalable and high-performance backend architecture" },
    { icon: CreditCard, title: L ? "بوابات دفع محلية" : "Local Gateways", desc: L ? "مدى، STC Pay، أبل باي، تمارا، تابي" : "Mada, STC Pay, Apple Pay, Tamara, Tabby" },
    { icon: Smartphone, title: "PWA-Ready", desc: L ? "تجربة تطبيق جوال أصلية سريعة الاستجابة" : "Fast, responsive native mobile app experience" },
    { icon: Globe, title: L ? "RTL & ثنائية اللغة" : "RTL & Bilingual", desc: L ? "دعم أصيل للغة العربية من مستوى البنية" : "Native Arabic support built from the ground up" },
  ];

  return (
    <section className="py-24 md:py-32 bg-ds-surface-inverse text-ds-surface-inverse-foreground border-y border-ds-navy-900 relative overflow-hidden">
      {/* Texture/Noise overlay for a premium engineered look */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      
      <div className="max-w-ds-container-xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-ds-sm font-semibold tracking-wide text-ds-blue-400 uppercase mb-4 block">
              {t("dsv2.tech.badge")}
            </span>
            <h2 className="font-heading text-ds-4xl md:text-ds-5xl tracking-tight mb-6 text-ds-white">
              {t("dsv2.tech.title")}
            </h2>
            <p className="text-ds-lg text-ds-gray-400 leading-relaxed mb-6">
              {t("dsv2.tech.subtitle")}
            </p>
            <p className="text-ds-base text-ds-gray-500 leading-relaxed max-w-lg">
              {t("dsv2.tech.desc")}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="bg-ds-surface-1/5 border border-ds-white/10 rounded-ds-lg p-6 flex flex-col hover:bg-ds-white/10 transition-colors duration-ds-base shadow-ds-lg">
                  <div className="w-10 h-10 rounded-ds-md bg-ds-blue-500/10 flex items-center justify-center mb-5 border border-ds-blue-400/20">
                    <Icon size={20} strokeWidth={1.75} className="text-ds-blue-400" />
                  </div>
                  <h4 className="font-heading text-ds-lg font-semibold mb-2 text-ds-white tracking-wide">{feat.title}</h4>
                  <p className="text-ds-sm text-ds-gray-400 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
