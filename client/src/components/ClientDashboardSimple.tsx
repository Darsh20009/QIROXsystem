import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import SARIcon from "@/components/SARIcon";
import {
  Clock, CheckCircle2, AlertCircle, Activity, Plus,
  MessageSquare, Upload, FileText, ChevronRight,
  Package, Sparkles, Loader2, ArrowUpRight,
  Headphones, Check, CreditCard,
  RefreshCw, ShoppingBag, Rocket, ClipboardList,
  ArrowRight, CircleDot, Circle, CheckCircle, PlayCircle,
  Star, ChevronLeft, X
} from "lucide-react";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "صباح الخير";
  if (h < 17) return "مساء الخير";
  return "مساء النور";
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  pending:     { label: "قيد المراجعة",  color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200", icon: Clock },
  approved:    { label: "تمت الموافقة",  color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200",  icon: CheckCircle2 },
  in_progress: { label: "قيد التنفيذ",  color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200", icon: Activity },
  completed:   { label: "مكتمل ✓",       color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200", icon: CheckCircle2 },
  rejected:    { label: "مرفوض",         color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200",   icon: AlertCircle },
  cancelled:   { label: "ملغي",          color: "text-gray-500",   bg: "bg-gray-50",   border: "border-gray-200",  icon: AlertCircle },
};

const PROJECT_PHASES = [
  { label: "التخطيط",  min: 0  },
  { label: "التصميم",  min: 25 },
  { label: "التطوير",  min: 50 },
  { label: "الاختبار", min: 75 },
  { label: "التسليم",  min: 100 },
];

function getPhaseLabel(progress: number) {
  if (progress >= 100) return PROJECT_PHASES[4].label;
  const phase = [...PROJECT_PHASES].reverse().find(p => progress >= p.min);
  return phase?.label || "التخطيط";
}

/* ── Social Media Posts Data ── */
const SOCIAL_POSTS = [
  { src: "/post-1.png",  caption: "تقنية مصممة خصيصًا ونتائج حقيقية",         tag: "نتائج حقيقية" },
  { src: "/post-2.png",  caption: "شريكك الموثوق في التحول الرقمي",             tag: "تحول رقمي" },
  { src: "/post-3.png",  caption: "فريق واحد ورؤية واحدة وإمكانيات بلا حدود", tag: "من نحن" },
  { src: "/post-4.png",  caption: "كيروكس — حيث تلتقي التكنولوجيا بنمو الأعمال", tag: "تكنولوجيا" },
  { src: "/post-5.png",  caption: "نصنع تجارب ذكية للأعمال الحديثة",           tag: "تجارب ذكية" },
  { src: "/post-6.png",  caption: "استثمر في نظام يبني نمو مشروعك",            tag: "استثمار" },
  { src: "/post-7.png",  caption: "الإدارة الذكية تبدأ من نظام ذكي",           tag: "إدارة ذكية" },
  { src: "/post-8.png",  caption: "التحول الرقمي صار ضرورة لا خيار",           tag: "رقمنة" },
  { src: "/post-9.png",  caption: "الحل الصحيح يبدأ بمفتاح يفهم أعمالك",     tag: "حلول مخصصة" },
  { src: "/post-10.png", caption: "خسارة الوقت تبدأ من الإدارة التقليدية",    tag: "توفير الوقت" },
  { src: "/post-11.png", caption: "لما تكون بياناتك مرتبة قراراتك تصير أسرع", tag: "بيانات منظمة" },
];

/* ── Social Posts Section ── */
const PLATFORM_COLORS = [
  { from: "#f43f5e", to: "#fb923c" }, // instagram warm
  { from: "#8b5cf6", to: "#6366f1" }, // purple
  { from: "#0ea5e9", to: "#06b6d4" }, // twitter/sky
  { from: "#22c55e", to: "#10b981" }, // green
  { from: "#f59e0b", to: "#f97316" }, // amber
  { from: "#ec4899", to: "#a855f7" }, // pink-purple
];

function SocialPostsSection() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setActive(prev => (prev + 1) % SOCIAL_POSTS.length);
    }, 3500);
    return () => clearInterval(t);
  }, [paused]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const card = el.querySelector(`[data-strip="${active}"]`) as HTMLElement;
    if (card) card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [active]);

  const col = PLATFORM_COLORS[active % PLATFORM_COLORS.length];

  return (
    <div className="mt-6 select-none" data-testid="social-posts-section">

      {/* ── Branded Header ── */}
      <div className="relative mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar ring */}
          <div className="relative">
            <div className="absolute -inset-0.5 rounded-full blur-sm opacity-80 transition-all duration-700"
              style={{ background: `linear-gradient(135deg, ${col.from}, ${col.to})` }} />
            <div className="relative w-10 h-10 rounded-full bg-black dark:bg-white p-1.5 flex items-center justify-center shadow-lg">
              <img src="/qirox-icon.png" alt="Q" className="w-full h-full object-contain dark:invert" />
            </div>
          </div>
          <div>
            <p className="font-black text-sm text-gray-900 dark:text-white leading-tight">من حساباتنا</p>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 leading-tight">@qirox.sa · @qiroxStudiosa</p>
          </div>
        </div>
        <a href="https://www.instagram.com/qirox.sa" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[11px] font-bold text-white px-3 py-1.5 rounded-full transition-all hover:scale-105 hover:shadow-lg shadow-md"
          style={{ background: `linear-gradient(135deg, ${col.from}, ${col.to})` }}
          data-testid="btn-follow-instagram"
        >
          <span>تابعنا</span>
          <ArrowUpRight className="w-3 h-3" />
        </a>
      </div>

      {/* ── Main Mosaic Grid ── */}
      <div className="relative">
        {/* SVG Connection Lines Background */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" aria-hidden="true" style={{ overflow: "visible" }}>
          <defs>
            <marker id="dot-marker" markerWidth="4" markerHeight="4" refX="2" refY="2">
              <circle cx="2" cy="2" r="1.5" fill={col.from} />
            </marker>
            <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={col.from} stopOpacity="0.6" />
              <stop offset="100%" stopColor={col.to} stopOpacity="0.1" />
            </linearGradient>
          </defs>
          {/* Diagonal connector lines */}
          <motion.line x1="33%" y1="0" x2="0" y2="50%" stroke="url(#line-grad)" strokeWidth="1"
            strokeDasharray="4 6" markerEnd="url(#dot-marker)"
            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.5 }}
            transition={{ duration: 1.2, ease: "easeInOut" }} />
          <motion.line x1="66%" y1="0" x2="100%" y2="50%" stroke="url(#line-grad)" strokeWidth="1"
            strokeDasharray="4 6" markerEnd="url(#dot-marker)"
            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.5 }}
            transition={{ duration: 1.2, delay: 0.2, ease: "easeInOut" }} />
          <motion.line x1="50%" y1="0" x2="50%" y2="100%" stroke="url(#line-grad)" strokeWidth="0.5"
            strokeDasharray="3 8"
            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.3 }}
            transition={{ duration: 1.5, delay: 0.4, ease: "easeInOut" }} />
        </svg>

        {/* Magazine Mosaic — Row 1: 1 large + 2 small */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          {/* Large card (spans 2 cols) */}
          <motion.button
            className="col-span-2 relative rounded-2xl overflow-hidden group cursor-pointer"
            style={{ aspectRatio: "16/10" }}
            onClick={() => { setPaused(true); setActive(0); }}
            onMouseEnter={() => { setPaused(true); setHovered(0); }}
            onMouseLeave={() => { setPaused(false); setHovered(null); }}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            data-testid="post-main-0"
          >
            <img src={SOCIAL_POSTS[0].src} alt={SOCIAL_POSTS[0].caption} className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            {/* Corner dot active indicator */}
            {active === 0 && (
              <motion.div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full shadow-glow"
                style={{ background: col.from }} layoutId="active-dot"
                transition={{ type: "spring", stiffness: 400, damping: 25 }} />
            )}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <span className="inline-block text-[9px] font-bold text-white/70 uppercase tracking-widest mb-1 px-2 py-0.5 rounded-full border border-white/20 backdrop-blur-sm">
                {SOCIAL_POSTS[0].tag}
              </span>
              <p className="text-white text-xs font-black leading-snug line-clamp-2">{SOCIAL_POSTS[0].caption}</p>
            </div>
            {/* Gradient border on hover */}
            <div className="absolute inset-0 rounded-2xl ring-0 group-hover:ring-2 transition-all duration-300"
              style={{ boxShadow: hovered === 0 ? `0 0 0 2px ${col.from}` : "none" }} />
          </motion.button>

          {/* 2 small cards stacked */}
          <div className="flex flex-col gap-2">
            {[1, 2].map((i) => (
              <motion.button
                key={i}
                className="relative rounded-xl overflow-hidden group cursor-pointer flex-1"
                onClick={() => { setPaused(true); setActive(i); }}
                onMouseEnter={() => { setPaused(true); setHovered(i); }}
                onMouseLeave={() => { setPaused(false); setHovered(null); }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                data-testid={`post-sm-${i}`}
              >
                <img src={SOCIAL_POSTS[i].src} alt={SOCIAL_POSTS[i].caption} className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                {active === i && (
                  <motion.div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                    style={{ background: col.from }} layoutId="active-dot"
                    transition={{ type: "spring", stiffness: 400, damping: 25 }} />
                )}
                <div className="absolute bottom-0 left-0 right-0 px-2 pb-2">
                  <p className="text-white text-[9px] font-bold line-clamp-2 leading-tight opacity-0 group-hover:opacity-100 transition-opacity duration-200">{SOCIAL_POSTS[i].caption}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Row 2: 3 equal cards */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          {[3, 4, 5].map((i) => (
            <motion.button
              key={i}
              className="relative rounded-xl overflow-hidden group cursor-pointer"
              style={{ aspectRatio: "3/4" }}
              onClick={() => { setPaused(true); setActive(i); }}
              onMouseEnter={() => { setPaused(true); setHovered(i); }}
              onMouseLeave={() => { setPaused(false); setHovered(null); }}
              whileHover={{ scale: 1.03, zIndex: 10 }} whileTap={{ scale: 0.97 }}
              data-testid={`post-mid-${i}`}
            >
              <img src={SOCIAL_POSTS[i].src} alt={SOCIAL_POSTS[i].caption}
                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              {/* Tag chip */}
              <div className="absolute top-2 right-2">
                <motion.span
                  className="text-[8px] font-black px-1.5 py-0.5 rounded-full text-white"
                  style={{ background: `linear-gradient(135deg, ${PLATFORM_COLORS[i % PLATFORM_COLORS.length].from}, ${PLATFORM_COLORS[i % PLATFORM_COLORS.length].to})` }}
                  animate={{ opacity: active === i ? 1 : 0.7 }}
                >
                  {SOCIAL_POSTS[i].tag}
                </motion.span>
              </div>
              {active === i && (
                <motion.div className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{ boxShadow: `inset 0 0 0 2.5px ${col.from}` }}
                  layoutId="active-border"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }} />
              )}
              <div className="absolute bottom-0 left-0 right-0 px-2 pb-2">
                <p className="text-white text-[8px] font-bold line-clamp-3 leading-snug">{SOCIAL_POSTS[i].caption}</p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Row 3: 2 medium + 1 small side */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 grid grid-cols-2 gap-2">
            {[6, 7].map((i) => (
              <motion.button
                key={i}
                className="relative rounded-xl overflow-hidden group cursor-pointer"
                style={{ aspectRatio: "1/1" }}
                onClick={() => { setPaused(true); setActive(i); }}
                onMouseEnter={() => { setPaused(true); setHovered(i); }}
                onMouseLeave={() => { setPaused(false); setHovered(null); }}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                data-testid={`post-bot-${i}`}
              >
                <img src={SOCIAL_POSTS[i].src} alt={SOCIAL_POSTS[i].caption}
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                {active === i && (
                  <motion.div className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{ boxShadow: `inset 0 0 0 2px ${col.from}` }} layoutId="active-border"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                )}
                <div className="absolute bottom-0 left-0 right-0 px-2 pb-2">
                  <p className="text-white text-[8px] font-bold line-clamp-2 leading-tight">{SOCIAL_POSTS[i].caption}</p>
                </div>
              </motion.button>
            ))}
          </div>
          {/* Tall card */}
          <motion.button
            className="relative rounded-xl overflow-hidden group cursor-pointer"
            onClick={() => { setPaused(true); setActive(8); }}
            onMouseEnter={() => { setPaused(true); setHovered(8); }}
            onMouseLeave={() => { setPaused(false); setHovered(null); }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            data-testid="post-tall-8"
          >
            <img src={SOCIAL_POSTS[8].src} alt={SOCIAL_POSTS[8].caption}
              className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            {active === 8 && (
              <motion.div className="absolute inset-0 rounded-xl pointer-events-none"
                style={{ boxShadow: `inset 0 0 0 2px ${col.from}` }} layoutId="active-border"
                transition={{ type: "spring", stiffness: 300, damping: 30 }} />
            )}
            <div className="absolute bottom-0 left-0 right-0 px-2 pb-3">
              <span className="inline-block text-[8px] font-black px-1.5 py-0.5 rounded-full text-white mb-1"
                style={{ background: `linear-gradient(135deg, ${col.from}, ${col.to})` }}>
                {SOCIAL_POSTS[8].tag}
              </span>
              <p className="text-white text-[9px] font-bold leading-snug line-clamp-3">{SOCIAL_POSTS[8].caption}</p>
            </div>
          </motion.button>
        </div>
      </div>

      {/* ── Active Post Caption Card ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="mt-3 rounded-2xl overflow-hidden relative"
          style={{ background: `linear-gradient(135deg, ${col.from}18, ${col.to}10)` }}
        >
          <div className="flex items-center gap-3 p-3">
            <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 border border-white/20 dark:border-white/10">
              <img src={SOCIAL_POSTS[active].src} alt="" className="w-full h-full object-cover object-top" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black text-gray-900 dark:text-white leading-snug line-clamp-2">{SOCIAL_POSTS[active].caption}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full"
                  style={{ background: `linear-gradient(135deg, ${col.from}, ${col.to})` }}>
                  {SOCIAL_POSTS[active].tag}
                </span>
                <span className="text-[9px] text-gray-400 dark:text-slate-500">@qirox.sa</span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <span className="text-[9px] font-bold text-gray-400 dark:text-slate-500 tabular-nums">{active + 1}/{SOCIAL_POSTS.length}</span>
              <div className="w-16 h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${col.from}, ${col.to})` }}
                  animate={{ width: `${((active + 1) / SOCIAL_POSTS.length) * 100}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }} />
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Horizontal Strip Carousel ── */}
      <div className="mt-3 -mx-1">
        <div ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-1 px-1 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {SOCIAL_POSTS.map((post, i) => (
            <motion.button
              key={i}
              data-strip={i}
              onClick={() => { setPaused(true); setActive(i); }}
              className={`relative flex-shrink-0 rounded-xl overflow-hidden snap-center transition-all duration-300`}
              style={{
                width: active === i ? 72 : 52,
                height: 72,
                boxShadow: active === i ? `0 0 0 2.5px ${col.from}, 0 4px 16px ${col.from}40` : "none",
              }}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
              data-testid={`strip-${i}`}
            >
              <img src={post.src} alt={post.caption} className="w-full h-full object-cover object-top" />
              {active === i && (
                <div className="absolute inset-0 bg-black/30" />
              )}
              {active === i && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div className="w-2.5 h-2.5 rounded-full bg-white shadow-lg"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }} />
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Social Platform Links ── */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { href: "https://www.instagram.com/qirox.sa", label: "إنستغرام", handle: "@qirox.sa", emoji: "📸", from: "#f43f5e", to: "#fb923c" },
          { href: "https://x.com/qiroxStudiosa", label: "تويتر / X", handle: "@qiroxStudiosa", emoji: "𝕏", from: "#0ea5e9", to: "#6366f1" },
          { href: "https://www.tiktok.com/@qirox.sa", label: "تيك توك", handle: "@qirox.sa", emoji: "🎵", from: "#1a1a1a", to: "#6366f1" },
        ].map(({ href, label, handle, emoji, from, to }) => (
          <a key={href} href={href} target="_blank" rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 py-2.5 px-2 rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 hover:scale-[1.03] hover:shadow-md transition-all duration-200 group"
            data-testid={`link-social-${label}`}
          >
            <span className="text-lg leading-none">{emoji}</span>
            <span className="text-[9px] font-black text-gray-700 dark:text-gray-200">{label}</span>
            <span className="text-[8px] text-gray-400 dark:text-slate-500 truncate w-full text-center">{handle}</span>
          </a>
        ))}
      </div>

    </div>
  );
}

/* ── Journey Guide ── */
type JourneyState =
  | "no_order"
  | "pending_no_proof"
  | "pending_with_proof"
  | "needs_details"
  | "in_progress"
  | "completed";

function getJourneyState(orders: any[], projects: any[]): { state: JourneyState; order?: any; project?: any } {
  if (orders.length === 0) return { state: "no_order" };

  const activeProject = projects.find(p => p.status !== "completed" && p.status !== "closed");
  if (activeProject) {
    if (Number(activeProject.progress || 0) >= 100) return { state: "completed", project: activeProject };
    return { state: "in_progress", project: activeProject };
  }

  const latestOrder = orders[0];
  if (latestOrder.status === "approved") {
    const hasDetails = latestOrder.businessName && latestOrder.sector;
    if (!hasDetails) return { state: "needs_details", order: latestOrder };
    return { state: "in_progress", order: latestOrder };
  }

  if (latestOrder.status === "pending") {
    const needsProof = (latestOrder.paymentMethod === "bank_transfer" || latestOrder.paymentMethod === "bank") && !latestOrder.paymentProofUrl;
    if (needsProof) return { state: "pending_no_proof", order: latestOrder };
    return { state: "pending_with_proof", order: latestOrder };
  }

  return { state: "no_order" };
}

interface JourneyStep {
  id: number;
  label: string;
  desc: string;
  done: boolean;
  active: boolean;
}

function getJourneySteps(state: JourneyState): JourneyStep[] {
  const steps = [
    { id: 1, label: "اختر الباقة وادفع", desc: "اختر الباقة المناسبة وأكمل الدفع" },
    { id: 2, label: "تأكيد الدفع", desc: "يراجع الفريق دفعتك ويوافق على الطلب" },
    { id: 3, label: "تفاصيل مشروعك", desc: "أخبرنا عن فكرة مشروعك بالتفصيل" },
    { id: 4, label: "التنفيذ", desc: "يبدأ الفريق في بناء مشروعك" },
    { id: 5, label: "التسليم 🎉", desc: "مشروعك جاهز وتحت تصرفك!" },
  ];

  const doneMap: Record<JourneyState, number> = {
    no_order: 0,
    pending_no_proof: 0,
    pending_with_proof: 1,
    needs_details: 2,
    in_progress: 3,
    completed: 5,
  };

  const activeMap: Record<JourneyState, number> = {
    no_order: 1,
    pending_no_proof: 1,
    pending_with_proof: 2,
    needs_details: 3,
    in_progress: 4,
    completed: 5,
  };

  const doneCount = doneMap[state];
  const activeId = activeMap[state];

  return steps.map(s => ({
    ...s,
    done: s.id <= doneCount,
    active: s.id === activeId && state !== "completed",
  }));
}

function JourneyCard({ state, order, project, onUploadProof }: {
  state: JourneyState; order?: any; project?: any;
  onUploadProof: (orderId: string, file: File) => void;
}) {
  const proofRef = useRef<HTMLInputElement>(null);
  const steps = getJourneySteps(state);

  const cards: Record<JourneyState, { title: string; desc: string; color: string; bg: string; cta?: { label: string; href?: string; action?: () => void; icon: any } }> = {
    no_order: {
      title: "ابدأ فكرتك الخاصة",
      desc: "اختر الباقة المناسبة وسيبدأ فريقنا في تحويل فكرتك إلى واقع",
      color: "text-violet-700", bg: "bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200",
      cta: { label: "تصفح الباقات", href: "/prices", icon: Sparkles }
    },
    pending_no_proof: {
      title: "⚡ مطلوب: ارفع إيصال التحويل",
      desc: `طلبك رقم #${order?.id?.slice(-6) || "—"} بانتظار سند التحويل البنكي`,
      color: "text-amber-800", bg: "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300",
      cta: { label: "ارفع الإيصال الآن", action: () => proofRef.current?.click(), icon: Upload }
    },
    pending_with_proof: {
      title: "⏳ جاري مراجعة دفعتك",
      desc: "رفعت الإيصال بنجاح — فريقنا يراجعه وسيؤكد خلال ساعات",
      color: "text-blue-700", bg: "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200",
    },
    needs_details: {
      title: "✅ تمت الموافقة! أكمل تفاصيل مشروعك",
      desc: "طلبك مقبول — أخبرنا عن مشروعك حتى يبدأ الفريق في العمل",
      color: "text-emerald-800", bg: "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-300",
      cta: { label: "إكمال تفاصيل المشروع", href: `/order-setup/${order?.id}`, icon: ClipboardList }
    },
    in_progress: {
      title: "🔧 مشروعك قيد التنفيذ",
      desc: project ? `المرحلة الحالية: ${getPhaseLabel(Number(project?.progress || 0))} — ${Number(project?.progress || 0)}% مكتمل` : "فريقنا يعمل على مشروعك",
      color: "text-indigo-700", bg: "bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200",
      cta: { label: "تواصل مع الفريق", href: "/cs-chat", icon: MessageSquare }
    },
    completed: {
      title: "🎉 مشروعك مكتمل!",
      desc: "مبروك! مشروعك جاهز ومُسلَّم",
      color: "text-green-700", bg: "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300",
      cta: { label: "عرض المشروع", href: project?.liveUrl, icon: ArrowUpRight }
    },
  };

  const card = cards[state];

  return (
    <div className={`rounded-2xl border-2 p-5 ${card.bg}`} data-testid="journey-card">
      <input
        ref={proofRef} type="file" accept="image/*,.pdf" className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f && order?.id) onUploadProof(order.id, f);
        }}
      />

      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className={`font-black text-base ${card.color}`}>{card.title}</p>
          <p className="text-sm text-gray-600 mt-0.5">{card.desc}</p>
        </div>
        {card.cta && (
          card.cta.href ? (
            <Link href={card.cta.href}>
              <Button size="sm" className="shrink-0 gap-1.5 rounded-xl font-bold" data-testid="journey-cta">
                <card.cta.icon className="w-3.5 h-3.5" />
                {card.cta.label}
              </Button>
            </Link>
          ) : (
            <Button size="sm" onClick={card.cta.action} className="shrink-0 gap-1.5 rounded-xl font-bold bg-amber-600 hover:bg-amber-700" data-testid="journey-cta">
              <card.cta.icon className="w-3.5 h-3.5" />
              {card.cta.label}
            </Button>
          )
        )}
      </div>

      {/* Steps */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-center shrink-0">
            <div className="flex flex-col items-center gap-1" title={step.desc}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                step.done ? "bg-green-500 text-white" :
                step.active ? "bg-black text-white ring-2 ring-black ring-offset-1" :
                "bg-gray-100 text-gray-400"
              }`}>
                {step.done ? <Check className="w-3.5 h-3.5" /> :
                 step.active ? <CircleDot className="w-3.5 h-3.5" /> :
                 <span className="text-[10px] font-bold">{step.id}</span>}
              </div>
              <span className={`text-[9px] font-bold whitespace-nowrap ${step.active ? "text-black" : step.done ? "text-green-600" : "text-gray-400"}`}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`w-6 h-0.5 mx-0.5 mb-3 rounded-full ${step.done ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface Props {
  user: any;
}

export default function ClientDashboardSimple({ user }: Props) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"projects" | "orders">("projects");
  const [reviewModal, setReviewModal] = useState<{ orderId: string; serviceTitle: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const { data: orders = [], isLoading: ordersLoading } = useQuery<any[]>({
    queryKey: ["/api/orders"],
  });
  const { data: projects = [], isLoading: projectsLoading } = useQuery<any[]>({
    queryKey: ["/api/projects"],
  });
  const { data: walletData } = useQuery<any>({ queryKey: ["/api/wallet"] });

  const uploadProof = useMutation({
    mutationFn: async ({ orderId, file }: { orderId: string; file: File }) => {
      const fd = new FormData(); fd.append("file", file);
      const up = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      if (!up.ok) throw new Error("فشل رفع الملف");
      const { url } = await up.json();
      const res = await apiRequest("PATCH", `/api/orders/${orderId}/proof`, { paymentProofUrl: url });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "✅ تم رفع سند التحويل — سيراجعه الفريق قريباً" });
    },
    onError: () => toast({ title: "فشل رفع السند، حاول مجدداً", variant: "destructive" }),
  });

  const submitReview = useMutation({
    mutationFn: () => apiRequest("POST", `/api/orders/${reviewModal?.orderId}/review`, {
      rating: reviewRating,
      comment: reviewComment,
      isPublic: true,
    }),
    onSuccess: () => {
      setReviewModal(null); setReviewRating(5); setReviewComment("");
      toast({ title: "✅ شكراً لتقييمك! سيساعد الآخرين في اختيار كيروكس." });
    },
    onError: (e: any) => toast({ title: "لم يتم إرسال التقييم", description: "ربما قيّمت هذا الطلب مسبقاً", variant: "destructive" }),
  });

  const activeProjects = (projects as any[]).filter((p: any) => p.status !== "completed" && p.status !== "closed");
  const walletBalance = walletData ? Math.max(0, (walletData.totalCredit || 0) - (walletData.totalDebit || 0)) : 0;
  const firstName = (user.fullName || user.username || "").split(" ")[0];

  const { state: journeyState, order: journeyOrder, project: journeyProject } = getJourneyState(orders as any[], projects as any[]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir="rtl">

      {/* ── Hero Banner — Video Background ── */}
      <div className="bg-black relative overflow-hidden" style={{ minHeight: 220 }}>
        {/* Brand video background */}
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.35 }}
          src="/qirox-brand.mp4"
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-black/60" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/[0.04] rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-50 dark:from-gray-950 to-transparent z-10" />

        <div className="max-w-2xl mx-auto px-4 pt-8 pb-16 relative z-10">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-4">
              <img src="/qirox-icon.png" alt="Qirox" className="w-8 h-8 object-contain drop-shadow-lg" />
              <span className="text-white/50 text-xs font-bold tracking-widest uppercase">Qirox · Dashboard</span>
            </div>

            <p className="text-white/50 text-sm mb-1">{getGreeting()}،</p>
            <h1 className="text-3xl font-black text-white mb-4 drop-shadow-lg" data-testid="text-client-greeting">{firstName}</h1>

            <div className="flex items-center gap-3 flex-wrap">
              <Link href="/prices">
                <Button size="sm" className="bg-white text-black hover:bg-white/90 rounded-full h-10 px-5 font-bold gap-2 shadow-xl border-0" data-testid="button-new-order">
                  <Plus className="w-4 h-4" /> طلب جديد
                </Button>
              </Link>
              <Link href="/cs-chat">
                <Button size="sm" variant="outline" className="rounded-full h-10 px-4 border-white/30 text-white/80 bg-white/[0.1] hover:bg-white/[0.2] hover:text-white gap-2 backdrop-blur-sm">
                  <MessageSquare className="w-3.5 h-3.5" /> تواصل معنا
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-20">

        {/* ── Journey Guide Card ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
          {!ordersLoading && !projectsLoading && (
            <JourneyCard
              state={journeyState}
              order={journeyOrder}
              project={journeyProject}
              onUploadProof={(orderId, file) => uploadProof.mutate({ orderId, file })}
            />
          )}
        </motion.div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: "طلباتي", value: (orders as any[]).length, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-500/10", icon: FileText },
            { label: "مشاريع نشطة", value: activeProjects.length, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-500/10", icon: Activity },
            { label: "رصيد المحفظة", value: walletBalance > 0 ? `${walletBalance.toLocaleString()} ر.س` : "0", color: "text-green-600", bg: "bg-green-50 dark:bg-green-500/10", icon: CreditCard },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] p-4 text-center">
                <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-xl font-black text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 font-medium mt-0.5">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Social Media Posts ── */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <SocialPostsSection />
        </motion.div>

        {/* ── Tabs: Projects / Orders ── */}
        <div className="mt-6">
          <div className="flex bg-gray-100 dark:bg-white/[0.05] rounded-2xl p-1 mb-4">
            <button
              onClick={() => setActiveTab("projects")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "projects" ? "bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-white" : "text-gray-400 dark:text-slate-500"}`}
              data-testid="tab-projects"
            >
              مشاريعي
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "orders" ? "bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-white" : "text-gray-400 dark:text-slate-500"}`}
              data-testid="tab-orders"
            >
              طلباتي ({(orders as any[]).length})
            </button>
          </div>

          {/* ── PROJECTS TAB ── */}
          {activeTab === "projects" && (
            <AnimatePresence mode="wait">
              <motion.div key="projects" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {projectsLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
                ) : activeProjects.length === 0 ? (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] p-10 text-center">
                    <div className="w-14 h-14 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Package className="w-7 h-7 text-gray-300 dark:text-slate-600" />
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white mb-1">لا توجد مشاريع نشطة</p>
                    <p className="text-sm text-gray-400 dark:text-slate-500 mb-5">
                      {(orders as any[]).length > 0 ? "طلبك قيد المعالجة — سيظهر مشروعك هنا بعد موافقة الفريق" : "ابدأ بطلب جديد وسيبدأ فريقنا في التنفيذ"}
                    </p>
                    {(orders as any[]).length === 0 && (
                      <Link href="/prices">
                        <Button className="gap-2 rounded-xl font-bold" data-testid="button-start-project">
                          <Sparkles className="w-4 h-4" /> ابدأ فكرتك الخاصة
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeProjects.map((project: any) => {
                      const progress = Number(project.progress || 0);
                      const phaseLabel = getPhaseLabel(progress);
                      return (
                        <motion.div
                          key={project.id || project._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] overflow-hidden"
                          data-testid={`card-project-${project.id}`}
                        >
                          {/* Progress bar at top */}
                          <div className="h-1.5 bg-gray-100 dark:bg-gray-800">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700"
                              style={{ width: `${Math.max(3, progress)}%` }}
                            />
                          </div>

                          <div className="p-5">
                            <div className="flex items-start justify-between gap-3 mb-4">
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-gray-900 dark:text-white text-base truncate">
                                  {project.name || project.projectType || project.businessName || "مشروعي"}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                                  {project.sector || ""}
                                </p>
                              </div>
                              <div className="shrink-0 text-left">
                                <span className="text-2xl font-black text-blue-600">{progress}%</span>
                                <p className="text-[10px] text-gray-400 dark:text-slate-500 text-center">{phaseLabel}</p>
                              </div>
                            </div>

                            {/* Phases visual */}
                            <div className="flex items-center gap-1 mb-4">
                              {PROJECT_PHASES.filter(p => p.min < 100).map((phase, i) => {
                                const done = progress > phase.min + 24;
                                const active = progress >= phase.min && progress <= phase.min + 24;
                                return (
                                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <div className={`w-full h-1.5 rounded-full transition-all ${done ? "bg-blue-500" : active ? "bg-blue-300" : "bg-gray-100 dark:bg-gray-800"}`} />
                                    <span className={`text-[9px] font-bold ${done || active ? "text-blue-500" : "text-gray-300 dark:text-slate-600"}`}>{phase.label}</span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Notes from team */}
                            {project.adminNotes && (
                              <div className="bg-blue-50 dark:bg-blue-500/[0.08] border border-blue-100 dark:border-blue-500/20 rounded-xl px-4 py-3 mb-4">
                                <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">آخر تحديث من الفريق</p>
                                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">{project.adminNotes}</p>
                              </div>
                            )}

                            {/* Delivery links */}
                            {project.liveUrl && (
                              <div className="flex gap-2 mb-4">
                                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl text-xs font-bold text-green-700 dark:text-green-400 hover:bg-green-100 transition-colors"
                                  data-testid={`link-live-${project.id}`}
                                >
                                  <ArrowUpRight className="w-3 h-3" /> رابط المشروع
                                </a>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Link href={`/projects/${project.id || project._id}`} className="flex-1">
                                <button className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-white/[0.04] hover:bg-gray-100 dark:hover:bg-white/[0.07] rounded-xl transition-all"
                                  data-testid={`button-view-project-${project.id}`}
                                >
                                  <span className="text-sm font-bold text-gray-700 dark:text-slate-300">تفاصيل المشروع</span>
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                </button>
                              </Link>
                              <Link href="/cs-chat">
                                <button className="px-3 py-2.5 bg-gray-50 dark:bg-white/[0.04] hover:bg-gray-100 rounded-xl transition-all" title="تواصل مع الفريق">
                                  <MessageSquare className="w-4 h-4 text-gray-400" />
                                </button>
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {/* ── ORDERS TAB ── */}
          {activeTab === "orders" && (
            <AnimatePresence mode="wait">
              <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {ordersLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
                ) : (orders as any[]).length === 0 ? (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] p-10 text-center">
                    <ShoppingBag className="w-12 h-12 text-gray-200 dark:text-slate-700 mx-auto mb-3" />
                    <p className="font-bold text-gray-900 dark:text-white mb-1">لا توجد طلبات بعد</p>
                    <p className="text-sm text-gray-400 dark:text-slate-500">ابدأ بتصفح باقاتنا</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(orders as any[]).map((order: any) => {
                      const st = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                      const Icon = st.icon;
                      const needsProof = (order.paymentMethod === "bank_transfer" || order.paymentMethod === "bank") && !order.paymentProofUrl && order.status === "pending";
                      const needsDetails = order.status === "approved" && !order.businessName;
                      return (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`bg-white dark:bg-gray-900 rounded-2xl border ${needsProof ? "border-amber-200 dark:border-amber-500/30" : needsDetails ? "border-green-300 dark:border-green-500/30" : "border-black/[0.06] dark:border-white/[0.07]"} p-4`}
                          data-testid={`card-order-${order.id}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${st.bg} border ${st.border}`}>
                              <Icon className={`w-4 h-4 ${st.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className="font-bold text-gray-900 dark:text-white text-sm truncate">
                                  {order.businessName || order.projectType || "طلب #" + (order.id?.slice(-6) || "")}
                                </p>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${st.bg} ${st.color} border ${st.border}`}>
                                  {st.label}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 dark:text-slate-500">
                                {Number(order.totalAmount || 0).toLocaleString()} ر.س
                                {order.createdAt && ` · ${new Date(order.createdAt).toLocaleDateString("ar-SA")}`}
                              </p>

                              {needsProof && (
                                <div className="mt-2">
                                  <input type="file" accept="image/*,.pdf" className="hidden" id={`proof-input-${order.id}`}
                                    onChange={async e => {
                                      const f = e.target.files?.[0];
                                      if (!f) return;
                                      uploadProof.mutate({ orderId: order.id, file: f });
                                    }}
                                  />
                                  <label htmlFor={`proof-input-${order.id}`}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-amber-600 transition-colors w-fit"
                                    data-testid={`button-upload-proof-order-${order.id}`}
                                  >
                                    <Upload className="w-3 h-3" /> ارفع إيصال التحويل
                                  </label>
                                </div>
                              )}

                              {needsDetails && (
                                <Link href={`/order-setup/${order.id}`}>
                                  <div className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-emerald-600 transition-colors w-fit"
                                    data-testid={`button-fill-details-${order.id}`}
                                  >
                                    <ClipboardList className="w-3 h-3" /> أكمل تفاصيل مشروعك
                                  </div>
                                </Link>
                              )}

                              {order.paymentProofUrl && order.status === "pending" && (
                                <p className="mt-1.5 text-[11px] text-green-600 font-medium flex items-center gap-1">
                                  <Check className="w-3 h-3" /> تم رفع الإيصال — بانتظار التحقق
                                </p>
                              )}

                              {order.status === "completed" && (
                                <button
                                  onClick={() => { setReviewModal({ orderId: order.id, serviceTitle: order.businessName || order.projectType || "الخدمة" }); setReviewRating(5); setReviewComment(""); }}
                                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-xl border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors w-fit"
                                  data-testid={`button-review-order-${order.id}`}
                                >
                                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> قيّم مشروعك
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* ── Quick Links ── */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {[
            { label: "تواصل مع الدعم",  desc: "نرد خلال دقائق",   href: "/cs-chat",         icon: Headphones, color: "text-blue-600",   bg: "bg-blue-50 dark:bg-blue-500/[0.08]",   border: "border-blue-100 dark:border-blue-500/20" },
            { label: "طلب تعديل",        desc: "على مشروعك الحالي", href: "/support",          icon: RefreshCw,  color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-500/[0.08]", border: "border-violet-100 dark:border-violet-500/20" },
            { label: "فواتيري",          desc: "سجل المدفوعات",    href: "/client/invoices",  icon: FileText,   color: "text-gray-600",   bg: "bg-gray-50 dark:bg-white/[0.04]",        border: "border-gray-100 dark:border-white/[0.07]" },
            { label: "محفظتي",           desc: "رصيدي الحالي",     href: "/wallet",           icon: CreditCard, color: "text-green-600",  bg: "bg-green-50 dark:bg-green-500/[0.08]",   border: "border-green-100 dark:border-green-500/20" },
          ].map((link, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
              <Link href={link.href}>
                <div className={`bg-white dark:bg-gray-900 rounded-2xl border ${link.border} p-4 cursor-pointer hover:shadow-sm transition-all`}
                  data-testid={`quicklink-${link.label}`}
                >
                  <div className={`w-9 h-9 ${link.bg} rounded-xl flex items-center justify-center mb-3`}>
                    <link.icon className={`w-4 h-4 ${link.color}`} />
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{link.label}</p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">{link.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* ── Brand Trust Section ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="mt-6 bg-black rounded-2xl p-5 text-white relative overflow-hidden"
          data-testid="brand-trust-section"
        >
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <img src="/qirox-icon.png" alt="Qirox" className="w-6 h-6 object-contain" />
              <span className="text-white/50 text-xs font-bold tracking-wider">QIROX</span>
            </div>
            <p className="text-white font-black text-lg mb-1">شريكك الموثوق في التحول الرقمي</p>
            <p className="text-white/40 text-xs mb-4">Your Complete Technology Partner</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "مشروع منجز", value: "50+" },
                { label: "قطاع مخدوم", value: "10+" },
                { label: "عميل راضٍ", value: "95%" },
              ].map((s, i) => (
                <div key={i} className="bg-white/[0.06] rounded-xl py-2 px-1">
                  <p className="text-white font-black text-lg">{s.value}</p>
                  <p className="text-white/40 text-[10px] font-medium">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 text-white/30 text-xs">
              <span>@qirox.sa</span>
              <span>·</span>
              <span>@qiroxStudiosa</span>
            </div>
          </div>
        </motion.div>

      </div>

      {/* ── Review Modal ── */}
      <AnimatePresence>
        {reviewModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setReviewModal(null)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-black text-gray-900 dark:text-white text-lg">قيّم مشروعك</h3>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{reviewModal.serviceTitle}</p>
                </div>
                <button onClick={() => setReviewModal(null)} className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="flex justify-center gap-2 mb-3">
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setReviewRating(s)} data-testid={`star-${s}`}>
                    <Star className={`w-9 h-9 transition-all ${s <= reviewRating ? "fill-amber-400 text-amber-400 scale-110" : "text-gray-200 dark:text-slate-600"}`} />
                  </button>
                ))}
              </div>
              <p className="text-center text-sm font-bold text-gray-700 dark:text-slate-300 mb-4">
                {reviewRating === 5 ? "ممتاز! 🌟" : reviewRating === 4 ? "جيد جداً 👍" : reviewRating === 3 ? "جيد 👌" : reviewRating === 2 ? "مقبول 🤔" : "ضعيف 😞"}
              </p>

              <Textarea
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                placeholder="شاركنا رأيك في الخدمة والتجربة... (اختياري)"
                className="mb-4 bg-gray-50 dark:bg-white/5 border-black/10 dark:border-white/10 rounded-xl resize-none text-sm"
                rows={3}
                data-testid="input-review-comment"
              />

              <Button
                onClick={() => submitReview.mutate()}
                disabled={submitReview.isPending}
                className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-white font-bold rounded-xl h-11 border-0 hover:from-amber-500 hover:to-amber-600"
                data-testid="button-submit-review"
              >
                {submitReview.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "إرسال التقييم"}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
