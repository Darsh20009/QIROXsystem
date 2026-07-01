import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowUpRight, X, Send, Users, Wifi, Heart, MessageCircle, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useSEO } from "@/hooks/use-seo";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

/* ── Posters data ── */
const POSTERS = [
  {
    id: 1,
    src: "/posters/poster1.png",
    alt: "ميزانيتك لا توقف فكرتك - كيروكس استوديو",
    titleAr: "ميزانيتك لا توقف فكرتك",
    titleEn: "Your Budget Doesn't Stop Your Vision",
    storyAr: "نصمّم حلولاً تقنية تناسب احتياجاتك وميزانيتك. مهما كانت إمكانياتك، عندنا الحل المناسب لك.",
    storyEn: "We design technology solutions that fit your needs and budget. Whatever your resources, we have the right solution for you.",
    tag: "#كيروكس_استوديو",
    gradient: "from-slate-800 to-slate-600",
    accent: "#6366f1",
  },
  {
    id: 2,
    src: "/posters/poster2.png",
    alt: "أنت تتخيل ونحن نحولها إلى تقنية - كيروكس",
    titleAr: "أنت تتخيل ونحن نحوّلها إلى تقنية",
    titleEn: "You Imagine, We Build the Technology",
    storyAr: "فكرتك هي نقطة البداية، ونحن نحوّلها إلى موقع، تطبيق، أو نظام مخصص يخدم أعمالك.",
    storyEn: "Your idea is the starting point — we turn it into a website, app, or custom system that powers your business.",
    tag: "#Qirox_Studio",
    gradient: "from-gray-900 to-gray-700",
    accent: "#8b5cf6",
  },
  {
    id: 3,
    src: "/posters/poster3.png",
    alt: "خدمات تقنية متكاملة لنمو أعمالك - كيروكس",
    titleAr: "خدمات تقنية متكاملة لنمو أعمالك",
    titleEn: "Integrated Tech Services for Business Growth",
    storyAr: "من الموقع الإلكتروني إلى التطبيق وحتى النظام الإداري — كيروكس شريكك الرقمي الكامل.",
    storyEn: "From website to app to management system — Qirox is your complete digital partner.",
    tag: "#تقنية_سعودية",
    gradient: "from-zinc-800 to-zinc-600",
    accent: "#f59e0b",
  },
  {
    id: 4,
    src: "/posters/poster4.png",
    alt: "مواقع تطبيقات وأنظمة تحت سقف واحد - كيروكس",
    titleAr: "مواقع، تطبيقات، وأنظمة تحت سقف واحد",
    titleEn: "Websites, Apps & Systems Under One Roof",
    storyAr: "لا تحتاج لأكثر من جهة. كيروكس توفر لك كل الحلول الرقمية من مكان واحد بفريق متكامل.",
    storyEn: "You don't need more than one partner. Qirox provides all digital solutions in one place with a complete team.",
    tag: "#شركة_برمجة_الرياض",
    gradient: "from-neutral-700 to-neutral-500",
    accent: "#10b981",
  },
  {
    id: 5,
    src: "/posters/poster5.png",
    alt: "نظام إداري احترافي للشركات - كيروكس",
    titleAr: "نظام إداري احترافي لشركتك",
    titleEn: "Professional Management System for Your Company",
    storyAr: "نظام ERP مخصص يتتبع موظفيك ومشاريعك ومبيعاتك من لوحة تحكم واحدة ذكية.",
    storyEn: "A custom ERP system that tracks your employees, projects, and sales from one smart dashboard.",
    tag: "#نظام_ERP",
    gradient: "from-stone-800 to-stone-600",
    accent: "#f97316",
  },
  {
    id: 6,
    src: "/posters/poster6.png",
    alt: "متجر إلكتروني احترافي - كيروكس",
    titleAr: "متجرك الإلكتروني يستحق الأفضل",
    titleEn: "Your Online Store Deserves the Best",
    storyAr: "متاجر إلكترونية سريعة، آمنة، وجذابة — مبنية بتقنيات حديثة ومتوافقة مع السوق السعودي.",
    storyEn: "Fast, secure, and attractive online stores — built with modern tech and aligned with the Saudi market.",
    tag: "#تجارة_إلكترونية",
    gradient: "from-emerald-900 to-teal-800",
    accent: "#14b8a6",
  },
  {
    id: 7,
    src: "/posters/poster7.png",
    alt: "تطبيق جوال احترافي - كيروكس استوديو",
    titleAr: "تطبيق جوال يُرتقى بتجربة عملائك",
    titleEn: "A Mobile App That Elevates Your Customer Experience",
    storyAr: "نبني تطبيقات iOS وAndroid بتصميم عربي أصيل وأداء عالمي، مع دعم فني مستمر بعد الإطلاق.",
    storyEn: "We build iOS and Android apps with authentic Arabic design and world-class performance, with ongoing support after launch.",
    tag: "#تطبيقات_جوال",
    gradient: "from-violet-900 to-purple-800",
    accent: "#a78bfa",
  },
  {
    id: 8,
    src: "/posters/poster8.png",
    alt: "مش كل ERP معقد - كيروكس",
    titleAr: "مش كل ERP معقد — التعقيد في الاختيار الغلط",
    titleEn: "Not Every ERP is Complicated — the Complexity is in Choosing Wrong",
    storyAr: "اختر الأنسب لبيزنسك. كيروكس تقدم أنظمة ERP مرنة وسهلة الاستخدام مصمّمة خصيصاً للسوق العربي.",
    storyEn: "Choose what fits your business. Qirox offers flexible, easy-to-use ERP systems designed specifically for the Arab market.",
    tag: "#نظام_إداري",
    gradient: "from-slate-700 to-indigo-900",
    accent: "#6366f1",
  },
  {
    id: 9,
    src: "/posters/poster9.png",
    alt: "تطبيقات ذكية تصمم لتخدم أعمالك - كيروكس",
    titleAr: "تطبيقات ذكية تُصمَّم لتخدم أعمالك",
    titleEn: "Smart Applications Designed to Power Your Business",
    storyAr: "تطبيقات جوال احترافية للـ iOS وAndroid، مصمّمة بتجربة مستخدم عربية أولاً وبتقنيات عالمية.",
    storyEn: "Professional iOS and Android apps, designed with Arabic-first UX and world-class technology.",
    tag: "#تطبيقات_جوال",
    gradient: "from-blue-900 to-slate-800",
    accent: "#0ea5e9",
  },
];

/* ── Fake community seed messages ── */
type CMsg = { id: string; name: string; avatar: string; dialect: "sa" | "eg" | "kw" | "sy" | "ma"; message: string; time: string; likes: number; isUser?: boolean; typing?: boolean };

const SEED_MSGS: CMsg[] = [
  { id: "s1", name: "محمد العتيبي", avatar: "م", dialect: "sa", message: "والله كيروكس غيّروا طريقة شغلنا كلياً 🔥 الموقع اللي سوّوه لنا طلع أحسن من توقعاتي", time: "12:04", likes: 14 },
  { id: "s2", name: "أحمد مصطفى", avatar: "أ", dialect: "eg", message: "بجد التيم بتاعهم محترفين أوي، وسرعة التسليم ده مش طبيعي 😍", time: "12:08", likes: 9 },
  { id: "s3", name: "فاطمة الكندي", avatar: "ف", dialect: "kw", message: "أنا من نص سنة مع كيروكس والله ما ندمت، الدعم الفني ما يقصّر ابد", time: "12:15", likes: 22 },
  { id: "s4", name: "ليلى الشامية", avatar: "ل", dialect: "sy", message: "شو هالتصاميم هدول؟ كثير حلوين! كيف كانت تجربتكم مع التطبيق؟", time: "12:19", likes: 5 },
  { id: "s5", name: "سعد الدوسري", avatar: "س", dialect: "sa", message: "سوّيت معهم تطبيق الجوال وبالله الكلام ما يوصفه، يا من هو! شغل من الدرجة الأولى 💯", time: "12:23", likes: 31 },
  { id: "s6", name: "نور الإسكندراني", avatar: "ن", dialect: "eg", message: "في حد جرب نظام الـ ERP بتاعهم؟ بفكر أتعامل معاهم لشركتي", time: "12:27", likes: 7 },
  { id: "s7", name: "خالد الزهراني", avatar: "خ", dialect: "sa", message: "تسعيرهم معقول ومحترم، وما يطوّلون في التسليم زي شركات ثانية عرفتها", time: "12:31", likes: 18 },
  { id: "s8", name: "ريم المطيري", avatar: "ر", dialect: "kw", message: "أنا طلبت منهم متجر إلكتروني وخلصوه في وقت قياسي، والتصميم يجنن! 😭", time: "12:35", likes: 26 },
  { id: "s9", name: "يوسف بنعلي", avatar: "ي", dialect: "ma", message: "واش كيروكس كيخدموا دول برّا السعودية؟ أنا فمغرب بغيت خدماتهم", time: "12:38", likes: 11 },
  { id: "s10", name: "عبدالله القرني", avatar: "ع", dialect: "sa", message: "شركة محترمة وأمينة، عطوني كل حقوق الكود بعد التسليم، ما قصّروا", time: "12:42", likes: 35 },
];

const LIVE_MSGS: Omit<CMsg, "id">[] = [
  { name: "دانية السبيعي", avatar: "د", dialect: "sa", message: "تووو 😍 البوستر الجديد يجنن، متى تنشرون على الإنستا؟", time: "", likes: 3 },
  { name: "كريم حسام", avatar: "ك", dialect: "eg", message: "أنا عميل قديم ومحدش يندم على كيروكس والله الحق", time: "", likes: 8 },
  { name: "نواف العجمي", avatar: "ن", dialect: "kw", message: "كم المدة اللي يحتاجونها لبناء موقع متكامل؟ 🤔", time: "", likes: 2 },
  { name: "سارة حمزاوي", avatar: "س", dialect: "sy", message: "هالتصاميم شغل ايدين فنانة والله، كيروكس دايماً يبدعوا", time: "", likes: 15 },
  { name: "منصور الغامدي", avatar: "م", dialect: "sa", message: "جرّبت ٣ شركات قبل كيروكس وما حد يقارن 🤦‍♂️ ندمت إني ما بدأت بيهم", time: "", likes: 20 },
  { name: "هالة محمود", avatar: "ه", dialect: "eg", message: "بقولكم إيه، التيم ده بيستاهل كل مديح، خدمة ممتازة", time: "", likes: 9 },
  { name: "طارق العمري", avatar: "ط", dialect: "sa", message: "ما شاء الله التصاميم احترافية، كيروكس شغلهم يتكلم عن نفسه", time: "", likes: 12 },
  { name: "جهاد الحسيني", avatar: "ج", dialect: "sy", message: "كيف يمكن التواصل معهم لطلب عرض سعر؟", time: "", likes: 4 },
];

function getTime() {
  const d = new Date();
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const dialectColors: Record<string, string> = {
  sa: "from-green-500 to-emerald-600",
  eg: "from-red-500 to-rose-600",
  kw: "from-blue-500 to-indigo-600",
  sy: "from-amber-500 to-orange-600",
  ma: "from-pink-500 to-fuchsia-600",
};

/* ── Lightbox ── */
function LightboxModal({ poster, onClose, onPrev, onNext }: {
  poster: typeof POSTERS[0];
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const { lang } = useI18n();
  const ar = lang === "ar";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") ar ? onNext() : onPrev();
      if (e.key === "ArrowRight") ar ? onPrev() : onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext, ar]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative max-w-lg w-full"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose} data-testid="btn-close-lightbox"
          className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10">
          <X className="w-5 h-5" />
        </button>
        {/* Prev / Next */}
        <button onClick={onPrev} data-testid="btn-prev-poster"
          className="absolute left-[-56px] top-[40%] -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors hidden md:flex">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button onClick={onNext} data-testid="btn-next-poster"
          className="absolute right-[-56px] top-[40%] -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors hidden md:flex">
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Poster image */}
        <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
          <img src={poster.src} alt={poster.alt} className="w-full h-auto block" />
        </div>

        {/* Description below */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-4 bg-white/[0.05] border border-white/10 rounded-2xl p-5 backdrop-blur-md"
          dir={ar ? "rtl" : "ltr"}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-white/40 text-[10px] font-bold tracking-widest">{poster.tag}</span>
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/20 text-[10px]">{poster.id} / {POSTERS.length}</span>
          </div>
          <h3 className="text-white font-black text-lg leading-snug mb-2">
            {ar ? poster.titleAr : poster.titleEn}
          </h3>
          <p className="text-white/60 text-sm leading-relaxed">
            {ar ? poster.storyAr : poster.storyEn}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: poster.accent }} />
            <span className="text-white/30 text-xs">{ar ? "كيروكس استوديو — شريكك الرقمي" : "Qirox Studio — Your Digital Partner"}</span>
          </div>
          {/* Mobile prev/next */}
          <div className="flex gap-3 mt-4 md:hidden">
            <button onClick={onPrev} className="flex-1 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors gap-2 text-sm">
              <ChevronLeft className="w-4 h-4" /> {ar ? "السابق" : "Prev"}
            </button>
            <button onClick={onNext} className="flex-1 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors gap-2 text-sm">
              {ar ? "التالي" : "Next"} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/* ── Community Panel ── */
function CommunityPanel({ ar }: { ar: boolean }) {
  const [msgs, setMsgs] = useState<CMsg[]>(SEED_MSGS.slice(0, 5));
  const [joined, setJoined] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [memberCount] = useState(1247 + Math.floor(Math.random() * 50));
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const liveIndex = useRef(0);

  /* Auto-add live fake messages */
  useEffect(() => {
    const interval = setInterval(() => {
      if (liveIndex.current < LIVE_MSGS.length) {
        const msg = LIVE_MSGS[liveIndex.current];
        const id = `live-${liveIndex.current}`;
        /* typing indicator */
        setMsgs(prev => [...prev, { ...msg, id: `typing-${id}`, time: "", likes: 0, typing: true }]);
        setTimeout(() => {
          setMsgs(prev =>
            prev
              .filter(m => m.id !== `typing-${id}`)
              .concat({ ...msg, id, time: getTime(), likes: msg.likes })
          );
          liveIndex.current += 1;
        }, 1400);
      }
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  /* Auto-scroll */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  const toggleLike = (id: string) => {
    setLikedIds(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
    setMsgs(prev => prev.map(m => m.id === id ? { ...m, likes: likedIds.has(id) ? m.likes - 1 : m.likes + 1 } : m));
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg: CMsg = {
      id: `user-${Date.now()}`,
      name: ar ? "أنت" : "You",
      avatar: "✨",
      dialect: "sa",
      message: text,
      time: getTime(),
      likes: 0,
      isUser: true,
    };
    setMsgs(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/community/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: text }),
      });
      const data = await res.json();
      const replies: CMsg[] = (data.replies || []).map((r: any, i: number) => ({
        id: `ai-${Date.now()}-${i}`,
        name: r.name || "عضو",
        avatar: (r.name || "ع")[0],
        dialect: r.dialect || "sa",
        message: r.message,
        time: getTime(),
        likes: Math.floor(Math.random() * 8),
      }));

      /* stagger replies */
      replies.forEach((reply, i) => {
        const typingId = `typing-ai-${i}`;
        setTimeout(() => {
          setMsgs(prev => [...prev, { ...reply, id: typingId, typing: true }]);
          setTimeout(() => {
            setMsgs(prev => prev.filter(m => m.id !== typingId).concat(reply));
          }, 1200);
        }, i * 2200);
      });
    } catch {
      /* fallback silent */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5" dir={ar ? "rtl" : "ltr"}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white text-[13px] font-bold leading-tight">
              {ar ? "مجتمع كيروكس 🌟" : "Qirox Community 🌟"}
            </p>
            <p className="text-white/40 text-[10px]">{memberCount.toLocaleString()} {ar ? "عضو نشط" : "active members"}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3 h-3 text-green-400" />
          <span className="text-green-400 text-[10px] font-semibold">{ar ? "مباشر" : "Live"}</span>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        </div>
      </div>

      {/* Join banner (before joining) */}
      {!joined && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-3 mt-3 p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/20 text-center shrink-0"
          dir={ar ? "rtl" : "ltr"}
        >
          <Sparkles className="w-5 h-5 text-purple-300 mx-auto mb-1" />
          <p className="text-white text-[12px] font-bold mb-1">
            {ar ? "انضم للمجتمع وشارك تجربتك!" : "Join & Share Your Experience!"}
          </p>
          <p className="text-white/40 text-[10px] mb-2">
            {ar ? "مئات العملاء ينتظرون رأيك 👋" : "Hundreds of clients await your feedback 👋"}
          </p>
          <button
            onClick={() => setJoined(true)}
            data-testid="btn-join-community"
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-[12px] font-bold py-2 rounded-lg transition-all active:scale-95"
          >
            {ar ? "✨ انضم الآن" : "✨ Join Now"}
          </button>
        </motion.div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin"
        style={{ minHeight: 0 }}
      >
        <AnimatePresence initial={false}>
          {msgs.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-2.5 ${msg.isUser ? "flex-row-reverse" : "flex-row"}`}
              dir="rtl"
            >
              {/* Avatar */}
              {msg.typing ? (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-[11px]">
                  {msg.avatar}
                </div>
              ) : (
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${dialectColors[msg.dialect]} flex items-center justify-center shrink-0 text-white text-[12px] font-bold`}>
                  {msg.avatar}
                </div>
              )}

              <div className={`flex-1 ${msg.isUser ? "items-end" : "items-start"} flex flex-col`}>
                {!msg.typing && (
                  <div className={`flex items-center gap-1.5 mb-1 ${msg.isUser ? "flex-row-reverse" : "flex-row"}`}>
                    <span className="text-white/70 text-[10px] font-semibold">{msg.name}</span>
                    {msg.time && <span className="text-white/25 text-[9px]">{msg.time}</span>}
                  </div>
                )}

                <div className={`rounded-2xl px-3 py-2 max-w-[85%] ${
                  msg.isUser
                    ? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-tr-none"
                    : msg.typing
                    ? "bg-white/10"
                    : "bg-white/[0.07] text-white rounded-tl-none"
                }`}>
                  {msg.typing ? (
                    <div className="flex gap-1 items-center h-4">
                      {[0, 1, 2].map(i => (
                        <motion.span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-white/50"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12px] leading-relaxed">{msg.message}</p>
                  )}
                </div>

                {!msg.typing && !msg.isUser && (
                  <button
                    onClick={() => toggleLike(msg.id)}
                    className="flex items-center gap-1 mt-1 text-white/30 hover:text-rose-400 transition-colors text-[10px]"
                  >
                    <Heart className={`w-3 h-3 ${likedIds.has(msg.id) ? "fill-rose-400 text-rose-400" : ""}`} />
                    {(msg.likes + (likedIds.has(msg.id) ? 1 : 0))}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input (only after joining) */}
      <AnimatePresence>
        {joined && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-3 pb-3 pt-2 border-t border-white/10 shrink-0"
            dir={ar ? "rtl" : "ltr"}
          >
            <div className="flex gap-2 items-center">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                ✨
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && send()}
                  placeholder={ar ? "شارك تجربتك أو اسأل... 💬" : "Share your experience... 💬"}
                  className="flex-1 bg-white/[0.07] border border-white/10 rounded-xl px-3 py-2 text-white text-[12px] placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-colors"
                  data-testid="input-community-message"
                  disabled={loading}
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || loading}
                  data-testid="btn-send-community"
                  className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats bar */}
      <div className="flex items-center justify-around py-2 border-t border-white/5 text-white/25 text-[10px] shrink-0">
        <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-rose-400" />{ar ? "٣٤٨ إعجاب" : "348 likes"}</span>
        <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3 text-blue-400" />{ar ? "١٢٠ رسالة" : "120 msgs"}</span>
        <span className="flex items-center gap-1"><Users className="w-3 h-3 text-green-400" />{ar ? "نشط الآن" : "Active now"}</span>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function Posters() {
  const { lang, dir } = useI18n();
  const ar = lang === "ar";
  const [activePoster, setActivePoster] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  useSEO({
    title: ar
      ? "بوسترات كيروكس استوديو — معرض أعمالنا الإبداعية | Qirox Studio"
      : "Qirox Studio Posters Gallery — Creative Work | كيروكس استوديو",
    description: ar
      ? "استعرض أحدث بوسترات وتصاميم كيروكس استوديو على السوشيل ميديا. شركة برمجة سعودية متخصصة في بناء المواقع والتطبيقات والأنظمة في الرياض."
      : "Browse the latest Qirox Studio social media posters and designs. Saudi software company specialized in websites, apps, and systems in Riyadh.",
    keywords: "كيروكس استوديو بوسترات, Qirox Studio posters, تصاميم كيروكس, شركة برمجة الرياض",
    canonical: "/posters",
    ogImage: "https://qiroxstudio.online/posters/poster1.png",
    ogType: "website",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "ImageGallery",
        "name": ar ? "معرض بوسترات كيروكس استوديو" : "Qirox Studio Poster Gallery",
        "url": "https://qiroxstudio.online/posters",
        "publisher": { "@type": "Organization", "name": "Qirox Studio" },
        "image": POSTERS.map(p => ({
          "@type": "ImageObject",
          "url": `https://qiroxstudio.online${p.src}`,
          "name": ar ? p.titleAr : p.titleEn,
          "description": ar ? p.storyAr : p.storyEn,
        })),
      },
    ],
  });

  const openPoster = (id: number) => setActivePoster(id);
  const closePoster = () => setActivePoster(null);
  const prevPoster = () => setActivePoster(p => p === null ? null : p === 1 ? POSTERS.length : p - 1);
  const nextPoster = () => setActivePoster(p => p === null ? null : p === POSTERS.length ? 1 : p + 1);
  const activePosterData = POSTERS.find(p => p.id === activePoster);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" dir={dir}>
      <Navigation />

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-12 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {POSTERS.slice(0, 4).map((p, i) => (
            <motion.div
              key={p.id}
              animate={{ y: [0, -14, 0], rotate: [0, 1, 0] }}
              transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut", delay: i * 1.2 }}
              className="absolute opacity-[0.05]"
              style={{
                top: `${8 + i * 18}%`,
                left: i % 2 === 0 ? `${3 + i * 5}%` : undefined,
                right: i % 2 !== 0 ? `${3 + i * 5}%` : undefined,
                width: 180,
              }}
            >
              <img src={p.src} alt="" className="w-full rounded-xl" />
            </motion.div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a]" />
        </div>

        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/10 rounded-full px-4 py-1.5 text-xs font-semibold text-white/60 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              {ar ? "معرض بوستراتنا" : "Our Creative Gallery"}
            </span>
            <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
              {ar ? (
                <><span className="text-white">أعمالنا على </span><span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">السوشيل ميديا</span></>
              ) : (
                <><span className="text-white">Our </span><span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Social Media</span><span className="text-white"> Work</span></>
              )}
            </h1>
            <p className="text-white/50 text-lg max-w-xl mx-auto leading-relaxed">
              {ar ? "كل بوستر يحمل قصة. انقر على أي بوستر لتعرف القصة كاملة." : "Every poster tells a story. Click any poster to read the full story."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Main content: Masonry + Community ── */}
      <section className="container mx-auto max-w-7xl px-4 pb-24">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Masonry Grid */}
          <div className="flex-1 min-w-0">
            <div className="columns-1 sm:columns-2 gap-4 space-y-4">
              {POSTERS.map((poster, i) => (
                <motion.div
                  key={poster.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.07 }}
                  className="break-inside-avoid"
                >
                  <div
                    className="relative group cursor-pointer rounded-2xl overflow-hidden shadow-2xl"
                    onMouseEnter={() => setHovered(poster.id)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => openPoster(poster.id)}
                    data-testid={`card-poster-${poster.id}`}
                  >
                    <img
                      src={poster.src}
                      alt={poster.alt}
                      className="w-full h-auto block transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: hovered === poster.id ? 1 : 0 }}
                      transition={{ duration: 0.25 }}
                      className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end p-5"
                      dir={ar ? "rtl" : "ltr"}
                    >
                      <span className="text-white/50 text-[10px] font-bold tracking-widest mb-1">{poster.tag}</span>
                      <h3 className="text-white font-bold text-base leading-snug mb-2">
                        {ar ? poster.titleAr : poster.titleEn}
                      </h3>
                      <p className="text-white/65 text-xs leading-relaxed line-clamp-2">
                        {ar ? poster.storyAr : poster.storyEn}
                      </p>
                      <div className="mt-3 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: poster.accent }} />
                        <span className="text-white/40 text-[10px]">
                          {ar ? "انقر لقراءة القصة كاملة" : "Click to read full story"}
                        </span>
                      </div>
                    </motion.div>

                    <div className="absolute top-3 left-3 w-8 h-8 rounded-xl bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <ArrowUpRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Community Panel */}
          <div className="lg:w-[340px] shrink-0">
            <motion.div
              initial={{ opacity: 0, x: ar ? -30 : 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="lg:sticky lg:top-24"
              style={{ height: "calc(100vh - 120px)", minHeight: 500, maxHeight: 700 }}
            >
              <CommunityPanel ar={ar} />
            </motion.div>
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-20 text-center"
        >
          <div className="inline-block bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 rounded-3xl px-10 py-10">
            <p className="text-white/40 text-xs tracking-widest uppercase mb-4">
              {ar ? "هل أعجبتك أعمالنا؟" : "Liked our work?"}
            </p>
            <h2 className="text-white text-2xl font-black mb-3">
              {ar ? "ابدأ مشروعك معنا اليوم" : "Start Your Project With Us Today"}
            </h2>
            <p className="text-white/40 text-sm mb-6">
              {ar ? "تواصل مع فريقنا وسنبني لك نظامك الرقمي المثالي." : "Reach out and we'll build your perfect digital system."}
            </p>
            <Link href="/join"
              className="inline-flex items-center gap-2 bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors"
              data-testid="btn-start-project">
              {ar ? "ابدأ الآن" : "Get Started"}
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />

      {/* Lightbox */}
      <AnimatePresence>
        {activePosterData && (
          <LightboxModal
            poster={activePosterData}
            onClose={closePoster}
            onPrev={prevPoster}
            onNext={nextPoster}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
