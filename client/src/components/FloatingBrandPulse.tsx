import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Headphones, Link2 } from "lucide-react";
import qiroxLogoPath from "@assets/QIROX_LOGO_1771674917456.png";
import { useUser } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { SiInstagram, SiWhatsapp, SiX, SiSnapchat, SiTiktok, SiYoutube, SiLinkedin } from "react-icons/si";

interface PublicSettings {
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  snapchat?: string;
  tiktok?: string;
  youtube?: string;
  whatsapp?: string;
  linktree?: string;
}

interface SocialSlide {
  key: string;
  label: string;
  icon: React.ElementType;
  url: string;
  bg: string;
  ring: string;
  iconColor: string;
  textColor: string;
}

function buildSlides(s: PublicSettings): SocialSlide[] {
  const all: (SocialSlide | null)[] = [
    s.instagram ? {
      key: "instagram", label: "تابعنا على انستقرام",
      icon: SiInstagram,
      url: s.instagram,
      bg: "linear-gradient(135deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)",
      ring: "rgba(220,39,67,0.4)", iconColor: "#fff", textColor: "#fff",
    } : null,
    s.whatsapp ? {
      key: "whatsapp", label: "تواصل عبر واتساب",
      icon: SiWhatsapp,
      url: s.whatsapp,
      bg: "linear-gradient(135deg,#128C7E 0%,#25D366 100%)",
      ring: "rgba(37,211,102,0.45)", iconColor: "#fff", textColor: "#fff",
    } : null,
    s.tiktok ? {
      key: "tiktok", label: "شاهدنا على تيك توك",
      icon: SiTiktok,
      url: s.tiktok,
      bg: "linear-gradient(135deg,#010101 0%,#1a1a2e 100%)",
      ring: "rgba(254,44,85,0.5)", iconColor: "#fe2c55", textColor: "#fff",
    } : null,
    s.snapchat ? {
      key: "snapchat", label: "تابعنا على سناب شات",
      icon: SiSnapchat,
      url: s.snapchat,
      bg: "linear-gradient(135deg,#FFFC00 0%,#FFD700 100%)",
      ring: "rgba(255,252,0,0.5)", iconColor: "#000", textColor: "#000",
    } : null,
    s.twitter ? {
      key: "twitter", label: "تابعنا على X",
      icon: SiX,
      url: s.twitter,
      bg: "linear-gradient(135deg,#000 0%,#1a1a1a 100%)",
      ring: "rgba(255,255,255,0.2)", iconColor: "#fff", textColor: "#fff",
    } : null,
    s.linkedin ? {
      key: "linkedin", label: "تواصل عبر لينكد إن",
      icon: SiLinkedin,
      url: s.linkedin,
      bg: "linear-gradient(135deg,#0077B5 0%,#00a0dc 100%)",
      ring: "rgba(0,119,181,0.5)", iconColor: "#fff", textColor: "#fff",
    } : null,
    s.linktree ? {
      key: "linktree", label: "روابطنا على لينك تري",
      icon: Link2,
      url: s.linktree,
      bg: "linear-gradient(135deg,#25a244 0%,#43e97b 100%)",
      ring: "rgba(67,233,123,0.4)", iconColor: "#fff", textColor: "#fff",
    } : null,
    s.youtube ? {
      key: "youtube", label: "قناتنا على يوتيوب",
      icon: SiYoutube,
      url: s.youtube,
      bg: "linear-gradient(135deg,#FF0000 0%,#cc0000 100%)",
      ring: "rgba(255,0,0,0.4)", iconColor: "#fff", textColor: "#fff",
    } : null,
  ];
  return all.filter(Boolean) as SocialSlide[];
}

type Phase = "hidden" | "logo" | "social";

export function FloatingBrandPulse() {
  const { data: user } = useUser();
  const isClient = user?.role === "client";

  const { data: settings } = useQuery<PublicSettings>({
    queryKey: ["/api/public/settings"],
    staleTime: 60_000,
  });

  const slides = settings ? buildSlides(settings) : [];

  const [phase, setPhase] = useState<Phase>("hidden");
  const [slideIdx, setSlideIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (slides.length === 0) return;

    function clear() {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
    }

    function runCycle() {
      clear();
      setPhase("hidden");

      timerRef.current = setTimeout(() => {
        setPhase("logo");

        timerRef.current = setTimeout(() => {
          setSlideIdx(0);
          setPhase("social");

          let idx = 0;
          function nextSlide() {
            idx++;
            if (idx < slides.length) {
              setSlideIdx(idx);
              slideTimerRef.current = setTimeout(nextSlide, 2400);
            } else {
              timerRef.current = setTimeout(() => {
                setPhase("hidden");
                timerRef.current = setTimeout(runCycle, 2800);
              }, 2400);
            }
          }
          slideTimerRef.current = setTimeout(nextSlide, 2400);

        }, 3600);
      }, 2000);
    }

    const boot = setTimeout(runCycle, 1500);
    return () => {
      clearTimeout(boot);
      clear();
    };
  }, [slides.length]);

  const currentSlide = slides[slideIdx];

  function handleContactClick() {
    if (isClient) window.dispatchEvent(new Event("open-cs-chat"));
  }

  return (
    <div className="fixed bottom-20 md:bottom-8 right-4 md:right-6 z-[90] flex flex-col items-end gap-3 pointer-events-none max-w-[calc(100vw-2rem)]">
      <AnimatePresence mode="wait">

        {/* ── Logo / Brand Phase ── */}
        {phase === "logo" && (
          <motion.div
            key="logo"
            initial={{ opacity: 0, scale: 0.65, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.75, y: 14, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="pointer-events-auto"
          >
            <Link href="/">
              <div className="relative group cursor-pointer">
                <motion.div
                  className="absolute -inset-1.5 rounded-3xl"
                  style={{ background: "radial-gradient(circle, rgba(0,0,0,0.08) 0%, transparent 70%)" }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="relative flex items-center gap-3 bg-white dark:bg-gray-900 border border-black/[0.07] dark:border-white/[0.07] shadow-xl shadow-black/[0.08] rounded-2xl px-4 py-3">
                  <img src={qiroxLogoPath} alt="QIROX" className="h-7 w-auto object-contain dark:invert" />
                  <div className="w-px h-5 bg-black/[0.08] dark:bg-white/[0.08]" />
                  <div>
                    <p className="text-[11px] font-bold text-black/35 dark:text-white/35 whitespace-nowrap leading-tight">وكالة رقمية متكاملة</p>
                    <p className="text-[9px] text-black/20 dark:text-white/20 font-medium leading-tight">Digital Agency</p>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* ── Social Slides Phase ── */}
        {phase === "social" && currentSlide && (
          <motion.div
            key={`social-${currentSlide.key}`}
            initial={{ opacity: 0, scale: 0.6, y: 30, rotateX: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: -20, rotateX: -10, filter: "blur(3px)" }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="pointer-events-auto"
            style={{ perspective: "600px" }}
          >
            <a
              href={currentSlide.url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative group cursor-pointer block"
              style={{ textDecoration: "none" }}
            >
              {/* Pulsing ring */}
              <motion.div
                className="absolute -inset-1.5 rounded-2xl"
                style={{ background: currentSlide.ring }}
                animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Card */}
              <div
                className="relative flex items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl overflow-hidden"
                style={{ background: currentSlide.bg, minWidth: "180px" }}
              >
                {/* Shine overlay */}
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  style={{ background: "linear-gradient(120deg, rgba(255,255,255,0.18) 0%, transparent 60%)" }}
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Icon with pulse */}
                <div className="relative flex-shrink-0">
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ background: "rgba(255,255,255,0.2)" }}
                    animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                  />
                  <motion.div
                    animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    className="relative z-10"
                  >
                    <currentSlide.icon size={22} color={currentSlide.iconColor} />
                  </motion.div>
                </div>

                {/* Text */}
                <div className="relative z-10 flex-1 text-right">
                  <motion.p
                    className="text-[12px] font-black leading-tight whitespace-nowrap tracking-wide"
                    style={{ color: currentSlide.textColor }}
                    animate={{ opacity: [0.85, 1, 0.85] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  >
                    {currentSlide.label}
                  </motion.p>
                  <p
                    className="text-[9px] font-medium leading-tight mt-0.5 opacity-60"
                    style={{ color: currentSlide.textColor }}
                  >
                    اضغط للانتقال ←
                  </p>
                </div>
              </div>
            </a>
          </motion.div>
        )}

        {/* ── Client Support Phase (after social cycle, only for logged-in clients) ── */}
        {phase === "hidden" && isClient && (
          <motion.div
            key="client-support"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none"
          />
        )}

      </AnimatePresence>

      {/* ── Persistent client support button (always visible for clients) ── */}
      {isClient && (
        <button
          onClick={handleContactClick}
          className="pointer-events-auto relative group cursor-pointer"
          data-testid="btn-floating-support"
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-black dark:bg-white"
            animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative w-11 h-11 bg-black dark:bg-white rounded-full flex items-center justify-center shadow-xl shadow-black/20 group-hover:scale-110 transition-transform duration-200">
            <Headphones className="w-5 h-5 text-white dark:text-black" />
          </div>
        </button>
      )}
    </div>
  );
}
