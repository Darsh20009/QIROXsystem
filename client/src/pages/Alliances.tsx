import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { useSEO } from "@/hooks/use-seo";
import { ExternalLink, ArrowLeft, Heart, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiPaypal, SiGithub } from "react-icons/si";

const qiroxLogo = "/qirox-icon-nobg.png";
const shadjLogo = "/logo-shadj.png";
const paymobLogo = "/logo-paymob.png";
const storageLogo = "/logo-storagex.png";
const moonshotLogo = "/logo-moonshot.png";

function useOnceInView(margin = "0px 0px -20% 0px") {
  const ref = useRef<HTMLElement>(null);
  const [triggered, setTriggered] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const inView = useInView(ref as any, { margin: margin as any, once: false });

  useEffect(() => {
    const onScroll = () => setHasScrolled(true);
    window.addEventListener("scroll", onScroll, { passive: true, once: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (inView && !triggered && hasScrolled) setTriggered(true);
  }, [inView, triggered, hasScrolled]);

  // For sections visible on load without scroll, show content immediately (no reveal)
  useEffect(() => {
    if (inView && !triggered && !hasScrolled) {
      const t = setTimeout(() => setTriggered(true), 300);
      return () => clearTimeout(t);
    }
  }, [inView]);

  return [ref, triggered, inView] as const;
}

/* ── SVG Decorative backgrounds per alliance ─────────────────────────── */
function GridBg({ color = "white", opacity = 0.04 }: { color?: string; opacity?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg width="100%" height="100%" className="absolute inset-0">
        <defs>
          <pattern id={`grid-${color}`} width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke={color} strokeWidth="0.5" opacity={opacity} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${color})`} />
      </svg>
    </div>
  );
}

function FloatingOrbs({ colors }: { colors: string[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {colors.map((c, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl opacity-20"
          style={{
            background: c,
            width: `${200 + i * 80}px`,
            height: `${200 + i * 80}px`,
            top: `${[10, 60, 30][i % 3]}%`,
            left: `${[5, 70, 40][i % 3]}%`,
          }}
          animate={{
            x: [0, 30 * (i % 2 === 0 ? 1 : -1), 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8 + i * 2, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ── Cinematic wipe transition overlay ───────────────────────────────── */
function AllianceReveal({
  active,
  accentColor,
  name,
  qiroxLogo: ql,
  partnerLogo,
  partnerName,
  isImgLogo,
  imgBg,
}: {
  active: boolean;
  accentColor: string;
  name: string;
  qiroxLogo: string;
  partnerLogo: React.ReactNode;
  partnerName: string;
  isImgLogo?: boolean;
  imgBg?: string;
}) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Colored wipe bar */}
          <motion.div
            className="absolute inset-0"
            style={{ background: accentColor }}
            initial={{ x: "-100%" }}
            animate={{ x: ["-100%", "0%", "0%", "100%"] }}
            transition={{ duration: 0.55, times: [0, 0.25, 0.65, 1], ease: [0.76, 0, 0.24, 1] }}
          />
          {/* Content inside wipe */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-6 text-center px-8"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.85, 1, 1, 0.95] }}
            transition={{ duration: 0.55, times: [0, 0.2, 0.65, 1] }}
          >
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center overflow-hidden border border-white/20">
                <img src={ql} alt="QIROX" className="w-12 h-12 object-contain" />
              </div>
              <Heart className="w-8 h-8 text-white fill-white" />
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden border border-white/20"
                style={{ background: imgBg || "rgba(255,255,255,0.15)" }}
              >
                {partnerLogo}
              </div>
            </div>
            <p className="text-white/60 text-sm font-semibold uppercase tracking-[4px]">QIROX × {partnerName}</p>
            <h2 className="text-white text-3xl md:text-5xl font-black tracking-tight">{name}</h2>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Alliance Section ─────────────────────────────────────────────────── */
interface Alliance {
  id: string;
  nameAr: string;
  nameEn: string;
  partnerNameAr: string;
  partnerNameEn: string;
  sectionBg: string;
  accentColor: string;
  textColor: string;
  mutedColor: string;
  orbColors: string[];
  typeAr: string;
  typeEn: string;
  tagBg: string;
  descAr: string;
  descEn: string;
  thankAr: string;
  thankEn: string;
  url: string;
  ctaAr: string;
  ctaEn: string;
  partnerLogoNode: React.ReactNode;
  partnerLogoImg?: string;
  partnerLogoBg?: string;
  num: string;
}

function AllianceSectionBlock({ alliance, lang }: { alliance: Alliance; lang: string }) {
  const [ref, triggered, inView] = useOnceInView("0px 0px -15% 0px");
  const [showReveal, setShowReveal] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    if (triggered && !contentVisible) {
      setShowReveal(true);
      const t1 = setTimeout(() => setShowReveal(false), 550);
      const t2 = setTimeout(() => setContentVisible(true), 300);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [triggered]);

  const L = lang === "ar";

  return (
    <>
      <AllianceReveal
        active={showReveal}
        accentColor={alliance.accentColor}
        name={L ? alliance.nameAr : alliance.nameEn}
        qiroxLogo={qiroxLogo}
        partnerLogo={alliance.partnerLogoNode}
        partnerName={L ? alliance.partnerNameAr : alliance.partnerNameEn}
        imgBg={alliance.partnerLogoBg}
      />

      <section
        ref={ref as any}
        id={alliance.id}
        className="relative min-h-screen flex flex-col justify-center overflow-hidden"
        style={{ background: alliance.sectionBg }}
        data-testid={`alliance-section-${alliance.id}`}
      >
        <GridBg color={alliance.accentColor} opacity={0.06} />
        <FloatingOrbs colors={alliance.orbColors} />

        {/* Giant number watermark */}
        <div
          className="absolute select-none pointer-events-none font-black"
          style={{
            fontSize: "clamp(200px, 35vw, 420px)",
            color: alliance.accentColor,
            opacity: 0.04,
            bottom: "-60px",
            right: L ? "auto" : "-20px",
            left: L ? "-20px" : "auto",
            lineHeight: 1,
            letterSpacing: "-0.05em",
          }}
        >
          {alliance.num}
        </div>

        <div className="container mx-auto px-6 md:px-12 relative z-10 py-24">

          {/* Type badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={contentVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-16"
          >
            <span
              className="text-[11px] font-bold tracking-[4px] uppercase px-4 py-2 rounded-full border"
              style={{ color: alliance.accentColor, borderColor: `${alliance.accentColor}40`, background: `${alliance.accentColor}12` }}
            >
              {L ? alliance.typeAr : alliance.typeEn}
            </span>
          </motion.div>

          {/* Logos row — the star of the show */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={contentVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="flex items-center justify-center gap-6 md:gap-12 mb-16"
          >
            {/* QIROX side */}
            <div className="flex flex-col items-center gap-4">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div
                  className="w-28 h-28 md:w-40 md:h-40 rounded-3xl flex items-center justify-center overflow-hidden border-2"
                  style={{ background: "rgba(255,255,255,0.08)", borderColor: `${alliance.accentColor}30` }}
                >
                  <img src={qiroxLogo} alt="QIROX" className="w-20 h-20 md:w-28 md:h-28 object-contain" />
                </div>
                {/* Glow */}
                <div
                  className="absolute inset-0 rounded-3xl blur-2xl opacity-20 pointer-events-none"
                  style={{ background: alliance.accentColor }}
                />
              </motion.div>
              <span className="text-sm font-black tracking-widest uppercase" style={{ color: alliance.mutedColor }}>QIROX</span>
            </div>

            {/* Center: Heart + thank you */}
            <div className="flex flex-col items-center gap-3 flex-shrink-0">
              {/* Animated heart */}
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <Heart
                  className="w-10 h-10 md:w-14 md:h-14"
                  style={{ color: alliance.accentColor, fill: alliance.accentColor }}
                />
                {/* Pulse rings */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2"
                  style={{ borderColor: alliance.accentColor }}
                  animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </motion.div>

              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-[3px]" style={{ color: `${alliance.accentColor}80` }}>
                  {L ? "شكراً لهم" : "Thank you"}
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="h-px w-6" style={{ background: `${alliance.accentColor}40` }} />
                  <Sparkles className="w-3 h-3" style={{ color: alliance.accentColor }} />
                  <div className="h-px w-6" style={{ background: `${alliance.accentColor}40` }} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[3px]" style={{ color: `${alliance.accentColor}80` }}>
                  {L ? "وشكراً لكيروكس" : "& QIROX"}
                </span>
              </div>

              <div className="text-xl font-black" style={{ color: `${alliance.accentColor}50` }}>×</div>
            </div>

            {/* Partner side */}
            <div className="flex flex-col items-center gap-4">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div
                  className="w-28 h-28 md:w-40 md:h-40 rounded-3xl flex items-center justify-center overflow-hidden border-2"
                  style={{
                    background: alliance.partnerLogoBg || "rgba(255,255,255,0.92)",
                    borderColor: `${alliance.accentColor}30`,
                  }}
                >
                  {alliance.partnerLogoNode}
                </div>
                <div
                  className="absolute inset-0 rounded-3xl blur-2xl opacity-20 pointer-events-none"
                  style={{ background: alliance.accentColor }}
                />
              </motion.div>
              <span className="text-sm font-black tracking-widest uppercase" style={{ color: alliance.mutedColor }}>
                {L ? alliance.partnerNameAr : alliance.partnerNameEn}
              </span>
            </div>
          </motion.div>

          {/* Alliance name — BIG */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={contentVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-center mb-8"
          >
            <h2
              className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-3"
              style={{ color: alliance.textColor }}
            >
              {L ? alliance.nameAr : alliance.nameEn}
            </h2>
            {/* Decorative line */}
            <motion.div
              className="h-0.5 mx-auto rounded-full"
              style={{ background: `linear-gradient(to right, transparent, ${alliance.accentColor}, transparent)` }}
              initial={{ width: 0 }}
              animate={contentVisible ? { width: "180px" } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
            />
          </motion.div>

          {/* Description + Thank you */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={contentVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="max-w-2xl mx-auto text-center mb-10 space-y-4"
          >
            <p className="text-base md:text-lg leading-relaxed" style={{ color: alliance.mutedColor }}>
              {L ? alliance.descAr : alliance.descEn}
            </p>
            {/* Thank you block */}
            <div
              className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl border mt-2"
              style={{ borderColor: `${alliance.accentColor}25`, background: `${alliance.accentColor}08` }}
            >
              <Heart className="w-4 h-4 flex-shrink-0" style={{ color: alliance.accentColor, fill: alliance.accentColor }} />
              <p className="text-sm font-medium" style={{ color: `${alliance.accentColor}cc` }}>
                {L ? alliance.thankAr : alliance.thankEn}
              </p>
              <Heart className="w-4 h-4 flex-shrink-0" style={{ color: alliance.accentColor, fill: alliance.accentColor }} />
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={contentVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex justify-center"
          >
            <a href={alliance.url} target="_blank" rel="noopener noreferrer" data-testid={`cta-${alliance.id}`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl font-bold text-sm transition-all"
                style={{
                  background: alliance.accentColor,
                  color: alliance.sectionBg,
                }}
              >
                {L ? alliance.ctaAr : alliance.ctaEn}
                <ExternalLink className="w-4 h-4" />
              </motion.button>
            </a>
          </motion.div>
        </div>

        {/* Bottom divider */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `${alliance.accentColor}20` }} />
      </section>
    </>
  );
}

/* ── Alliance Data ────────────────────────────────────────────────────── */
function buildAlliances(): Alliance[] {
  return [
    {
      id: "shadj",
      num: "01",
      nameAr: "تحالف السوشيل ميديا",
      nameEn: "Social Media Alliance",
      partnerNameAr: "شدج",
      partnerNameEn: "Shadj",
      sectionBg: "#0f0c29",
      accentColor: "#6366f1",
      textColor: "#f8fafc",
      mutedColor: "#94a3b8",
      orbColors: ["#6366f1", "#8b5cf6", "#4f46e5"],
      typeAr: "شراكة استراتيجية • سوشيل ميديا",
      typeEn: "Strategic Alliance • Social Media",
      tagBg: "#6366f110",
      descAr: "شدج هي شريكنا الإبداعي الحصري في عالم السوشيل بوسترز. نحن نبني الأنظمة وهم يصنعون الإبداع البصري — معاً نقدم للعميل تجربة رقمية متكاملة من الكود حتى التصميم.",
      descEn: "Shadj is our exclusive creative partner in social poster design. We build the systems, they craft the visual creativity — together we deliver a complete digital experience from code to design.",
      thankAr: "شكراً لفريق شدج على الإبداع اللا محدود، وشكراً لكيروكس على الثقة والبنية التقنية المتينة.",
      thankEn: "Thank you Shadj for limitless creativity, and thank you QIROX for the trust and solid tech backbone.",
      url: "https://shadj-graphics.space",
      ctaAr: "اطلب خدماتهم",
      ctaEn: "Order Their Services",
      partnerLogoNode: <img src={shadjLogo} alt="Shadj" className="w-full h-full object-cover" />,
      partnerLogoBg: "#1a237e",
    },
    {
      id: "paymob",
      num: "02",
      nameAr: "تحالف الدفع الإقليمي",
      nameEn: "Regional Payment Alliance",
      partnerNameAr: "باي موب",
      partnerNameEn: "PayMob",
      sectionBg: "#0a1628",
      accentColor: "#3b82f6",
      textColor: "#f8fafc",
      mutedColor: "#94a3b8",
      orbColors: ["#3b82f6", "#2563eb", "#1d4ed8"],
      typeAr: "شريك دفع إقليمي • العالم العربي",
      typeEn: "Regional Payment Partner • Arab World",
      tagBg: "#3b82f610",
      descAr: "تكامل PayMob يمنح عملاء كيروكس بوابة دفع محلية احترافية تدعم البطاقات البنكية، المحافظ الرقمية، والدفع عند الاستلام — محلياً وإقليمياً بثقة وأمان.",
      descEn: "PayMob integration gives QIROX clients a professional local payment gateway supporting bank cards, digital wallets, and COD — locally and regionally with trust and security.",
      thankAr: "شكراً لـ PayMob على البنية التحتية المالية الموثوقة، وشكراً لكيروكس على دمجها في منتجاتنا.",
      thankEn: "Thank you PayMob for reliable financial infrastructure, and QIROX for seamlessly integrating it into our products.",
      url: "https://paymob.com",
      ctaAr: "زيارة الموقع",
      ctaEn: "Visit Website",
      partnerLogoNode: <img src={paymobLogo} alt="PayMob" className="w-full h-full object-cover" />,
      partnerLogoBg: "#1565C0",
    },
    {
      id: "storagex",
      num: "03",
      nameAr: "تحالف التخزين والإيفاء",
      nameEn: "Storage & Fulfillment Alliance",
      partnerNameAr: "ستورج ستيشن",
      partnerNameEn: "Storage Station",
      sectionBg: "#0d0d0d",
      accentColor: "#f59e0b",
      textColor: "#fafafa",
      mutedColor: "#a3a3a3",
      orbColors: ["#f59e0b", "#d97706", "#b45309"],
      typeAr: "شريك لوجستي • تخزين وإيفاء",
      typeEn: "Logistics Partner • Storage & Fulfillment",
      tagBg: "#f59e0b10",
      descAr: "Storage Station هي شريكنا في عالم التجارة الإلكترونية، توفر حلول التخزين والإيفاء للمتاجر التي نبنيها. نحن نصمم المتجر وهم يؤمّنون إيصال المنتج للعميل.",
      descEn: "Storage Station is our e-commerce logistics partner, providing storage and fulfillment solutions for stores we build. We design the store, they ensure the product reaches the customer.",
      thankAr: "شكراً لـ Storage Station على الشراكة اللوجستية المتكاملة، وشكراً لكيروكس على الدعم التقني المستمر.",
      thankEn: "Thank you Storage Station for the complete logistics partnership, and QIROX for the continuous technical support.",
      url: "https://storagestation.net/en",
      ctaAr: "زيارة الموقع",
      ctaEn: "Visit Website",
      partnerLogoNode: <img src={storageLogo} alt="Storage Station" className="w-4/5 object-contain" />,
      partnerLogoBg: "rgba(255,255,255,0.95)",
    },
    {
      id: "paypal",
      num: "04",
      nameAr: "تحالف الدفع العالمي",
      nameEn: "Global Payment Alliance",
      partnerNameAr: "باي بال",
      partnerNameEn: "PayPal",
      sectionBg: "#001233",
      accentColor: "#009cde",
      textColor: "#f0f9ff",
      mutedColor: "#7dd3fc",
      orbColors: ["#009cde", "#003087", "#0070ba"],
      typeAr: "شريك دفع عالمي",
      typeEn: "Global Payment Partner",
      tagBg: "#009cde10",
      descAr: "تكامل رسمي مع منصة PayPal يتيح لعملاء كيروكس قبول المدفوعات من 200+ دولة بأعلى معايير الأمان. الدفع الفوري، حماية المشتري، وثقة عالمية مضمونة.",
      descEn: "Official PayPal integration allows QIROX clients to accept payments from 200+ countries with the highest security standards. Instant payments, buyer protection, and guaranteed global trust.",
      thankAr: "شكراً لـ PayPal على الثقة العالمية، وشكراً لكيروكس على توفير هذا التكامل لعملائها.",
      thankEn: "Thank you PayPal for global trust, and QIROX for providing this integration to our clients.",
      url: "https://paypal.com",
      ctaAr: "زيارة الموقع",
      ctaEn: "Visit Website",
      partnerLogoNode: <SiPaypal size={56} color="#009cde" />,
      partnerLogoBg: "rgba(0,18,51,0.9)",
    },
    {
      id: "github",
      num: "05",
      nameAr: "تحالف منصة الكود",
      nameEn: "Code Platform Alliance",
      partnerNameAr: "جت هب",
      partnerNameEn: "GitHub",
      sectionBg: "#0d1117",
      accentColor: "#e6edf3",
      textColor: "#e6edf3",
      mutedColor: "#8b949e",
      orbColors: ["#30363d", "#21262d", "#161b22"],
      typeAr: "منصة التطوير الرسمية",
      typeEn: "Official Development Platform",
      tagBg: "#e6edf310",
      descAr: "جميع مشاريع كيروكس ومنتجاتها تعيش على GitHub. نظام التحكم بالإصدار، CI/CD، وإدارة فريق التطوير — كل ذلك مدعوم بأقوى منصة تطوير في العالم.",
      descEn: "All QIROX projects and products live on GitHub. Version control, CI/CD, and dev team management — all powered by the world's strongest development platform.",
      thankAr: "شكراً لـ GitHub على المنصة التي مكّنت آلاف المطورين، وشكراً لكيروكس على كل commit يبني مستقبل عملائنا.",
      thankEn: "Thank you GitHub for the platform that empowered thousands of developers, and QIROX for every commit that builds our clients' future.",
      url: "https://github.com",
      ctaAr: "زيارة الموقع",
      ctaEn: "Visit Website",
      partnerLogoNode: <SiGithub size={56} color="#e6edf3" />,
      partnerLogoBg: "rgba(22,27,34,0.9)",
    },
    {
      id: "moonshot",
      num: "06",
      nameAr: "تحالف الذكاء الاصطناعي",
      nameEn: "Artificial Intelligence Alliance",
      partnerNameAr: "موون شوت AI",
      partnerNameEn: "Moonshot AI",
      sectionBg: "#05010f",
      accentColor: "#a855f7",
      textColor: "#faf5ff",
      mutedColor: "#c4b5fd",
      orbColors: ["#a855f7", "#7c3aed", "#4c1d95"],
      typeAr: "شريك الذكاء الاصطناعي المتقدم",
      typeEn: "Advanced AI Partner",
      tagBg: "#a855f710",
      descAr: "Moonshot AI (Kimi) تشغّل المحرك الذكي داخل منصة كيروكس. معالجة النصوص، الأسئلة الطويلة، ومساعد QIROX AI — كل ذلك مدعوم بأحد أقوى النماذج اللغوية في العالم.",
      descEn: "Moonshot AI (Kimi) powers the intelligence engine inside the QIROX platform. Text processing, long context understanding, and the QIROX AI assistant — all powered by one of the world's most advanced language models.",
      thankAr: "شكراً لـ Moonshot AI على الذكاء الذي يجعل مساعدنا يفهم ويجيب، وشكراً لكيروكس على دمج هذا الذكاء في خدمة عملائها.",
      thankEn: "Thank you Moonshot AI for the intelligence that makes our assistant understand and respond, and QIROX for embedding this AI in service of our clients.",
      url: "https://www.moonshot.cn",
      ctaAr: "زيارة الموقع",
      ctaEn: "Visit Website",
      partnerLogoNode: <img src={moonshotLogo} alt="Moonshot AI" className="w-4/5 object-contain" />,
      partnerLogoBg: "rgba(0,0,0,0.9)",
    },
  ];
}

/* ── Hero ─────────────────────────────────────────────────────────────── */
function Hero({ lang }: { lang: string }) {
  const L = lang === "ar";
  return (
    <section className="relative min-h-[70vh] flex flex-col items-center justify-center overflow-hidden bg-white dark:bg-gray-950 pt-28 pb-16" data-testid="section-alliances-hero">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.025] dark:opacity-[0.03]"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, black 1px, transparent 0)", backgroundSize: "40px 40px" }} />

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-10 bg-indigo-500 dark:opacity-20" />

      <motion.div initial="hidden" animate="visible" className="relative z-10 text-center px-4">
        <motion.div
          variants={{ hidden: { opacity: 0, y: -10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.03] dark:bg-white/[0.03] mb-6"
        >
          <Zap className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
          <span className="text-black/40 dark:text-white/40 text-xs tracking-widest uppercase font-medium">
            {L ? "تحالفات استراتيجية" : "Strategic Alliances"}
          </span>
        </motion.div>

        <motion.h1
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.1 } } }}
          className="text-5xl md:text-7xl font-black tracking-tight text-black dark:text-white mb-4"
        >
          {L ? <><span>تحالفات</span> <span className="text-gray-300 dark:text-gray-600">كيروكس</span></> : <><span className="text-gray-300 dark:text-gray-600">QIROX</span> <span>Alliances</span></>}
        </motion.h1>

        <motion.p
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.6, delay: 0.25 } } }}
          className="text-black/40 dark:text-white/40 text-lg max-w-lg mx-auto mb-10"
        >
          {L ? "٦ تحالفات استراتيجية تدعم منظومة كيروكس وتمنح عملاءنا قوة تنافسية حقيقية." : "6 strategic alliances powering the QIROX ecosystem and giving our clients a real competitive edge."}
        </motion.p>

        {/* Stats */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.35 } } }}
          className="flex flex-wrap justify-center gap-10"
        >
          {[
            { v: "6", l: { ar: "شركاء", en: "Partners" } },
            { v: "3", l: { ar: "قارات", en: "Continents" } },
            { v: "50+", l: { ar: "مشروع", en: "Projects" } },
          ].map(s => (
            <div key={s.v} className="text-center">
              <p className="text-3xl font-black text-black dark:text-white">{s.v}</p>
              <p className="text-xs text-black/35 dark:text-white/35 mt-0.5">{L ? s.l.ar : s.l.en}</p>
            </div>
          ))}
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { delay: 1 } } }}
          className="mt-14 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-black/20 dark:text-white/20 tracking-widest uppercase">
            {L ? "اسكرول للاستكشاف" : "Scroll to explore"}
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-px h-10 bg-gradient-to-b from-black/20 dark:from-white/20 to-transparent"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ── Main Page ────────────────────────────────────────────────────────── */
export default function Alliances() {
  const { lang, dir } = useI18n();

  useSEO({
    title: lang === "ar"
      ? "تحالفات كيروكس — شركاؤنا الاستراتيجيون في التقنية والابتكار"
      : "QIROX Alliances — Our Strategic Technology & Innovation Partners",
    description: lang === "ar"
      ? "تعرّف على تحالفات كيروكس الاستراتيجية: شدج، PayMob، Storage Station، PayPal، GitHub، وMoonshot AI."
      : "Meet QIROX strategic alliances: Shadj, PayMob, Storage Station, PayPal, GitHub, and Moonshot AI.",
    canonical: "/alliances",
  });

  const alliances = buildAlliances();

  return (
    <div className="min-h-screen flex flex-col" dir={dir}>
      <Navigation />
      <Hero lang={lang} />

      {alliances.map((a) => (
        <AllianceSectionBlock key={a.id} alliance={a} lang={lang} />
      ))}

      {/* Final CTA */}
      <section className="py-24 bg-black" data-testid="section-cta">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              {lang === "ar" ? "مهتم بالتحالف مع كيروكس؟" : "Interested in Allying with QIROX?"}
            </h2>
            <p className="text-white/50 mb-8 max-w-md mx-auto">
              {lang === "ar"
                ? "نرحب بالشركاء الذين يشاركوننا رؤية بناء منظومة تقنية متكاملة للسوق العربي."
                : "We welcome partners who share our vision of a complete tech ecosystem for the Arab market."}
            </p>
            <Link href="/contact">
              <Button size="lg" className="h-14 px-10 rounded-xl bg-white text-black hover:bg-white/90 font-bold gap-2" data-testid="cta-contact">
                {lang === "ar" ? "تواصل معنا" : "Get in Touch"}
                {lang === "ar" ? <ArrowLeft className="w-5 h-5" /> : <ExternalLink className="w-5 h-5" />}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
