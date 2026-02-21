import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Loader2, Handshake, ArrowLeft, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Partner } from "@shared/schema";

import qahwaCupLogo from "@assets/Elegant_Coffee_Culture_Design_1757428233689_1771717217775.png";
import genMZLogo from "@assets/Screenshot_2025-12-24_203835_1771717230405.png";
import beFluentLogo from "@assets/Screenshot_2026-01-25_182548_1771717248784.png";
import tuwaiqLogo from "@assets/Screenshot_2026-02-20_030415_1771717262310.png";
import blackRoseLogo from "@assets/Screenshot_2026-01-28_010045_1771717287296.png";
import qodratakLogo from "@assets/Screenshot_2026-01-28_125929_1771717287296.png";
import subwayLogo from "@assets/Screenshot_2026-01-28_130014_1771717301779.png";
import maestroLogo from "@assets/Screenshot_2026-01-28_130058_1771717301779.png";
import instapayLogo from "@assets/Screenshot_2026-01-27_123515_1771717312922.png";

const staticPartners = [
  { name: "QahwaCup", nameAr: "قهوة كوب", logo: qahwaCupLogo },
  { name: "Gen M&Z", nameAr: "Gen M&Z", logo: genMZLogo },
  { name: "Be Fluent", nameAr: "Be Fluent", logo: beFluentLogo },
  { name: "جمعية طويق", nameAr: "جمعية طويق", logo: tuwaiqLogo },
  { name: "Black Rose Cafe", nameAr: "بلاك روز كافيه", logo: blackRoseLogo },
  { name: "Qodratak", nameAr: "قدراتك", logo: qodratakLogo },
  { name: "Subway", nameAr: "صبواي", logo: subwayLogo },
  { name: "Maestro", nameAr: "مايسترو", logo: maestroLogo },
  { name: "InstaPay", nameAr: "إنستاباي", logo: instapayLogo },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }
  })
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

export default function Partners() {
  const { data: dbPartners } = useQuery<Partner[]>({
    queryKey: ["/api/partners"],
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0F]">
      <Navigation />

      <section className="pt-36 pb-16 relative overflow-hidden" data-testid="section-partners-hero">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0A0A0F] to-transparent" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] mb-6">
              <Handshake className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span className="text-white/40 text-xs tracking-wider uppercase">Partners</span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl font-black font-heading text-white mb-6 tracking-tight" dir="rtl">
              شركاؤنا <span style={{ background: "linear-gradient(90deg, #00D4FF, #0099CC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>في النجاح</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-white/30 text-lg max-w-2xl mx-auto" dir="rtl">
              نفتخر بثقة عملائنا وشركائنا الذين اختاروا QIROX لبناء أنظمتهم الرقمية
            </motion.p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 container mx-auto px-4" data-testid="section-partners-grid">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          {staticPartners.map((partner, idx) => (
            <motion.div
              key={partner.name}
              variants={fadeUp}
              custom={idx}
              className="group"
              data-testid={`partner-card-${idx}`}
            >
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 flex flex-col items-center justify-center aspect-square transition-all duration-300 group-hover:border-[#00D4FF]/20 group-hover:bg-white/[0.04]">
                <div className="w-24 h-24 md:w-32 md:h-32 flex items-center justify-center mb-4 rounded-xl overflow-hidden">
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="max-w-full max-h-full object-contain"
                    loading="lazy"
                  />
                </div>
                <h3 className="text-sm font-bold text-white text-center">{partner.name}</h3>
                <p className="text-xs text-white/30 text-center mt-1" dir="rtl">{partner.nameAr}</p>
              </div>
            </motion.div>
          ))}

          {dbPartners?.map((partner, idx) => (
            <motion.div
              key={partner.id}
              variants={fadeUp}
              custom={staticPartners.length + idx}
              className="group"
              data-testid={`partner-db-card-${partner.id}`}
            >
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 flex flex-col items-center justify-center aspect-square transition-all duration-300 group-hover:border-[#00D4FF]/20 group-hover:bg-white/[0.04]">
                <div className="w-24 h-24 md:w-32 md:h-32 flex items-center justify-center mb-4 rounded-xl overflow-hidden">
                  <img
                    src={partner.logoUrl}
                    alt={partner.name}
                    className="max-w-full max-h-full object-contain"
                    loading="lazy"
                  />
                </div>
                <h3 className="text-sm font-bold text-white text-center">{partner.name}</h3>
                {partner.nameAr && <p className="text-xs text-white/30 text-center mt-1" dir="rtl">{partner.nameAr}</p>}
                {partner.websiteUrl && (
                  <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" className="mt-2 text-[#00D4FF]/50 hover:text-[#00D4FF] transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="py-20" data-testid="section-partners-cta">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-10 md:p-14 text-center"
          >
            <h2 className="text-2xl md:text-3xl font-bold font-heading text-white mb-4" dir="rtl">
              كن شريكنا القادم
            </h2>
            <p className="text-white/40 text-base mb-8 max-w-lg mx-auto" dir="rtl">
              انضم لعائلة QIROX وابدأ رحلة التحول الرقمي مع مصنع الأنظمة الأول
            </p>
            <Link href="/contact">
              <Button
                size="lg"
                className="h-14 px-10 text-base rounded-md gap-2 font-semibold"
                style={{ background: "linear-gradient(135deg, #00D4FF, #0099CC)", color: "#0A0A0F", border: "1px solid #00D4FF" }}
                data-testid="button-become-partner"
              >
                تواصل معنا
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
