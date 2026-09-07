import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Wifi, Heart, MessageCircle, Sparkles, Send, ArrowUpRight, Star, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { useSEO } from "@/hooks/use-seo";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

/* ── Types ── */
type Dialect = "sa" | "eg" | "kw" | "sy" | "ma";
type CMsg = {
  id: string;
  name: string;
  avatar: string;
  dialect: Dialect;
  message: string;
  time: string;
  likes: number;
  isUser?: boolean;
  typing?: boolean;
};

/* ── Seed messages ── */
const SEED_MSGS: CMsg[] = [
  { id: "s1",  name: "محمد العتيبي",   avatar: "م", dialect: "sa", message: "والله كيروكس غيّروا طريقة شغلنا كلياً 🔥 الموقع اللي سوّوه لنا طلع أحسن من توقعاتي", time: "11:04", likes: 14 },
  { id: "s2",  name: "أحمد مصطفى",    avatar: "أ", dialect: "eg", message: "بجد التيم بتاعهم محترفين أوي، وسرعة التسليم ده مش طبيعي 😍", time: "11:08", likes: 9 },
  { id: "s3",  name: "فاطمة الكندي",  avatar: "ف", dialect: "kw", message: "أنا من نص سنة مع كيروكس والله ما ندمت، الدعم الفني ما يقصّر ابد", time: "11:15", likes: 22 },
  { id: "s4",  name: "ليلى الشامية",  avatar: "ل", dialect: "sy", message: "شو هالتصاميم هدول؟ كثير حلوين! كيف كانت تجربتكم مع التطبيق؟", time: "11:19", likes: 5 },
  { id: "s5",  name: "سعد الدوسري",  avatar: "س", dialect: "sa", message: "سوّيت معهم تطبيق الجوال وبالله الكلام ما يوصفه، يا من هو! شغل من الدرجة الأولى 💯", time: "11:23", likes: 31 },
  { id: "s6",  name: "نور الإسكندراني", avatar: "ن", dialect: "eg", message: "في حد جرب نظام الـ ERP بتاعهم؟ بفكر أتعامل معاهم لشركتي", time: "11:27", likes: 7 },
  { id: "s7",  name: "خالد الزهراني", avatar: "خ", dialect: "sa", message: "تسعيرهم معقول ومحترم، وما يطوّلون في التسليم زي شركات ثانية عرفتها", time: "11:31", likes: 18 },
  { id: "s8",  name: "ريم المطيري",   avatar: "ر", dialect: "kw", message: "أنا طلبت منهم متجر إلكتروني وخلصوه في وقت قياسي، والتصميم يجنن! 😭", time: "11:35", likes: 26 },
  { id: "s9",  name: "يوسف بنعلي",   avatar: "ي", dialect: "ma", message: "واش كيروكس كيخدموا دول برّا السعودية؟ أنا فمغرب بغيت خدماتهم", time: "11:38", likes: 11 },
  { id: "s10", name: "عبدالله القرني", avatar: "ع", dialect: "sa", message: "شركة محترمة وأمينة، عطوني كل حقوق الكود بعد التسليم، ما قصّروا", time: "11:42", likes: 35 },
  { id: "s11", name: "دانية السبيعي", avatar: "د", dialect: "sa", message: "البوسترات الجديدة تجنن 😍 متى تنشرون على الإنستا؟", time: "11:46", likes: 12 },
  { id: "s12", name: "كريم حسام",     avatar: "ك", dialect: "eg", message: "أنا عميل قديم ومحدش يندم على كيروكس والله الحق", time: "11:49", likes: 19 },
];

const LIVE_MSGS: Omit<CMsg, "id">[] = [
  { name: "نواف العجمي",   avatar: "ن", dialect: "kw", message: "كم المدة اللي يحتاجونها لبناء موقع متكامل؟ 🤔", time: "", likes: 2 },
  { name: "سارة حمزاوي",  avatar: "س", dialect: "sy", message: "هالتصاميم شغل ايدين فنانة والله، كيروكس دايماً يبدعوا", time: "", likes: 15 },
  { name: "منصور الغامدي", avatar: "م", dialect: "sa", message: "جرّبت ٣ شركات قبل كيروكس وما حد يقارن 🤦‍♂️ ندمت إني ما بدأت بيهم", time: "", likes: 20 },
  { name: "هالة محمود",   avatar: "ه", dialect: "eg", message: "بقولكم إيه، التيم ده بيستاهل كل مديح، خدمة ممتازة", time: "", likes: 9 },
  { name: "طارق العمري",  avatar: "ط", dialect: "sa", message: "ما شاء الله التصاميم احترافية، كيروكس شغلهم يتكلم عن نفسه", time: "", likes: 12 },
  { name: "جهاد الحسيني", avatar: "ج", dialect: "sy", message: "كيف يمكن التواصل معهم لطلب عرض سعر؟", time: "", likes: 4 },
  { name: "أسماء رضا",    avatar: "أ", dialect: "eg", message: "ربنا يوفقهم، شغلهم بيأكل الدنيا 👏", time: "", likes: 8 },
  { name: "بدر العنزي",   avatar: "ب", dialect: "sa", message: "شوفوا شغلهم الجديد، الله يبارك! كل يوم أحلى من اللي قبله", time: "", likes: 17 },
];

const dialectColors: Record<Dialect, string> = {
  sa: "from-green-500 to-emerald-600",
  eg: "from-red-500 to-rose-600",
  kw: "from-blue-500 to-indigo-600",
  sy: "from-amber-500 to-orange-600",
  ma: "from-pink-500 to-fuchsia-600",
};

const dialectLabels: Record<Dialect, string> = {
  sa: "🇸🇦 سعودي",
  eg: "🇪🇬 مصري",
  kw: "🇰🇼 خليجي",
  sy: "🇸🇾 شامي",
  ma: "🇲🇦 مغربي",
};

const STATS = [
  { label: "عضو نشط", labelEn: "Active Members", value: "١٢٤٧+", icon: Users, color: "text-purple-400" },
  { label: "رسالة يومياً", labelEn: "Daily Messages", value: "٣٤٠+", icon: MessageCircle, color: "text-blue-400" },
  { label: "تقييم المجتمع", labelEn: "Community Rating", value: "٤.٩ ⭐", icon: Star, color: "text-amber-400" },
  { label: "نمو شهري", labelEn: "Monthly Growth", value: "+٢٣٪", icon: TrendingUp, color: "text-green-400" },
];

function getTime() {
  const d = new Date();
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function Community() {
  const { lang } = useI18n();
  const ar = lang === "ar";

  useSEO({
    title: ar ? "مجتمع كيروكس 🌟 — تجارب العملاء والنقاشات | Qirox Community" : "Qirox Community 🌟 — Client Experiences & Discussions",
    description: ar
      ? "انضم لمجتمع كيروكس استوديو النشط! شارك تجربتك، اسأل، وتفاعل مع مئات العملاء السعوديين والعرب. مجتمع حي ونشط كل يوم."
      : "Join the active Qirox Studio community! Share your experience, ask questions, and interact with hundreds of Arab clients.",
    keywords: "مجتمع كيروكس, تجارب عملاء كيروكس, Qirox community, كيروكس استوديو تقييمات",
    canonical: "/community",
  });

  const [msgs, setMsgs] = useState<CMsg[]>(SEED_MSGS);
  const [joined, setJoined] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Dialect | "all">("all");
  const scrollRef = useRef<HTMLDivElement>(null);
  const liveIndex = useRef(0);

  /* Auto-add live messages */
  useEffect(() => {
    const iv = setInterval(() => {
      if (liveIndex.current < LIVE_MSGS.length) {
        const msg = LIVE_MSGS[liveIndex.current];
        const typingId = `typing-${liveIndex.current}`;
        setMsgs(prev => [...prev, { ...msg, id: typingId, time: "", likes: 0, typing: true }]);
        setTimeout(() => {
          const finalId = `live-${liveIndex.current}`;
          setMsgs(prev =>
            prev.filter(m => m.id !== typingId).concat({ ...msg, id: finalId, time: getTime(), likes: msg.likes })
          );
          liveIndex.current += 1;
        }, 1400);
      }
    }, 6000);
    return () => clearInterval(iv);
  }, []);

  /* Auto scroll */
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
    setMsgs(prev => prev.map(m => m.id === id
      ? { ...m, likes: likedIds.has(id) ? m.likes - 1 : m.likes + 1 }
      : m
    ));
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
      (data.replies || []).forEach((r: any, i: number) => {
        const typingId = `typing-ai-${Date.now()}-${i}`;
        const finalId = `ai-${Date.now()}-${i}`;
        setTimeout(() => {
          setMsgs(prev => [...prev, { id: typingId, name: r.name || "عضو", avatar: (r.name || "ع")[0], dialect: r.dialect || "sa", message: "", time: "", likes: 0, typing: true }]);
          setTimeout(() => {
            setMsgs(prev => prev.filter(m => m.id !== typingId).concat({
              id: finalId, name: r.name, avatar: (r.name || "ع")[0], dialect: r.dialect || "sa",
              message: r.message, time: getTime(), likes: Math.floor(Math.random() * 6),
            }));
          }, 1200);
        }, i * 2000);
      });
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const displayMsgs = filter === "all" ? msgs : msgs.filter(m => m.typing || m.isUser || m.dialect === filter);

  return (
    <div className="min-h-screen bg-[#08080c] text-white">
      <Navigation />

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-purple-600/8 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-indigo-600/6 rounded-full blur-[80px]" />
        </div>
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <span className="inline-flex items-center gap-2 bg-white/[0.05] border border-white/10 rounded-full px-4 py-1.5 text-xs font-semibold text-white/50 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {ar ? "١٢٤٧+ عضو نشط الآن" : "1,247+ Members Active Now"}
            </span>
            <h1 className="text-4xl md:text-6xl font-black leading-tight mb-5">
              {ar ? (
                <><span className="text-white">مجتمع </span><span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">كيروكس 🌟</span></>
              ) : (
                <><span className="text-white">Qirox </span><span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">Community 🌟</span></>
              )}
            </h1>
            <p className="text-white/45 text-lg max-w-2xl mx-auto leading-relaxed mb-8">
              {ar
                ? "مكان واحد تلتقي فيه مع مئات العملاء العرب. شارك تجربتك، اسأل، وتعلّم من الآخرين."
                : "One place where hundreds of Arab clients meet. Share your experience, ask, and learn from others."}
            </p>
            {!joined && (
              <button
                onClick={() => setJoined(true)}
                data-testid="btn-hero-join"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold px-8 py-3.5 rounded-2xl transition-all active:scale-95 shadow-lg shadow-purple-500/20"
              >
                <Sparkles className="w-5 h-5" />
                {ar ? "انضم للمجتمع مجاناً" : "Join Community Free"}
              </button>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="container mx-auto max-w-5xl px-4 mb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 text-center"
            >
              <s.icon className={`w-5 h-5 mx-auto mb-2 ${s.color}`} />
              <p className="text-white font-black text-xl mb-0.5">{s.value}</p>
              <p className="text-white/35 text-[11px]">{ar ? s.label : s.labelEn}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Main Chat ── */}
      <section className="container mx-auto max-w-5xl px-4 pb-24">
        <div className="flex flex-col lg:flex-row gap-5">

          {/* Chat area */}
          <div className="flex-1 min-w-0 flex flex-col bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden" style={{ minHeight: 600 }}>

            {/* Chat header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
              <div className="flex items-center gap-3" dir={ar ? "rtl" : "ltr"}>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{ar ? "مجتمع كيروكس استوديو 🌟" : "Qirox Studio Community 🌟"}</p>
                  <p className="text-white/35 text-[10px]">{ar ? "رسائل حية من عملاء حقيقيين" : "Live messages from real clients"}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-green-400" />
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-[10px] font-bold">{ar ? "مباشر" : "Live"}</span>
              </div>
            </div>

            {/* Join banner */}
            {!joined && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mx-4 mt-4 p-4 rounded-xl bg-gradient-to-r from-purple-500/15 to-indigo-500/15 border border-purple-500/20 text-center shrink-0"
                dir={ar ? "rtl" : "ltr"}
              >
                <p className="text-white font-bold text-sm mb-1">{ar ? "شارك بتجربتك! 💬" : "Share your experience! 💬"}</p>
                <p className="text-white/40 text-[11px] mb-3">{ar ? "انضم وابدأ المشاركة مع الأعضاء" : "Join and start participating with members"}</p>
                <button onClick={() => setJoined(true)} data-testid="btn-chat-join"
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-bold py-2 px-6 rounded-xl transition-all active:scale-95">
                  ✨ {ar ? "انضم الآن" : "Join Now"}
                </button>
              </motion.div>
            )}

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ minHeight: 0 }}>
              <AnimatePresence initial={false}>
                {displayMsgs.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-2.5 ${msg.isUser ? "flex-row-reverse" : "flex-row"}`}
                    dir="rtl"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[12px] font-bold ${
                      msg.typing ? "bg-white/10 text-white/50" : `bg-gradient-to-br ${dialectColors[msg.dialect]} text-white`
                    }`}>
                      {msg.avatar}
                    </div>
                    <div className={`flex-1 flex flex-col ${msg.isUser ? "items-end" : "items-start"}`}>
                      {!msg.typing && (
                        <div className={`flex items-center gap-2 mb-1 ${msg.isUser ? "flex-row-reverse" : ""}`}>
                          <span className="text-white/65 text-[11px] font-semibold">{msg.name}</span>
                          {!msg.isUser && <span className="text-[9px] text-white/25">{dialectLabels[msg.dialect]}</span>}
                          {msg.time && <span className="text-white/20 text-[9px]">{msg.time}</span>}
                        </div>
                      )}
                      <div className={`rounded-2xl px-4 py-2.5 max-w-[80%] ${
                        msg.isUser
                          ? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-tr-none"
                          : msg.typing ? "bg-white/[0.07]" : "bg-white/[0.06] text-white rounded-tl-none"
                      }`}>
                        {msg.typing ? (
                          <div className="flex gap-1 items-center h-4">
                            {[0, 1, 2].map(i => (
                              <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-white/40"
                                animate={{ y: [0, -4, 0] }} transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }} />
                            ))}
                          </div>
                        ) : (
                          <p className="text-[13px] leading-relaxed">{msg.message}</p>
                        )}
                      </div>
                      {!msg.typing && !msg.isUser && (
                        <button onClick={() => toggleLike(msg.id)}
                          className="flex items-center gap-1 mt-1 text-white/30 hover:text-rose-400 transition-colors text-[10px]">
                          <Heart className={`w-3 h-3 ${likedIds.has(msg.id) ? "fill-rose-400 text-rose-400" : ""}`} />
                          {msg.likes + (likedIds.has(msg.id) ? 1 : 0)}
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Input */}
            <AnimatePresence>
              {joined && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="px-4 pb-4 pt-3 border-t border-white/[0.07]" dir={ar ? "rtl" : "ltr"}>
                  <div className="flex gap-2 items-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-[12px] font-bold shrink-0">✨</div>
                    <input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && send()}
                      placeholder={ar ? "شارك تجربتك أو اسأل المجتمع... 💬" : "Share your experience or ask... 💬"}
                      className="flex-1 bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-white text-[13px] placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-colors"
                      data-testid="input-community-msg"
                      disabled={loading}
                    />
                    <button onClick={send} disabled={!input.trim() || loading} data-testid="btn-send-community"
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shrink-0">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="lg:w-64 shrink-0 flex flex-col gap-4">
            {/* Dialect filter */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4">
              <p className="text-white/50 text-[11px] font-bold uppercase tracking-widest mb-3">{ar ? "فلترة حسب اللهجة" : "Filter by Dialect"}</p>
              <div className="space-y-1.5">
                {([["all", ar ? "🌍 الكل" : "🌍 All"], ["sa", "🇸🇦 سعودي"], ["eg", "🇪🇬 مصري"], ["kw", "🇰🇼 خليجي"], ["sy", "🇸🇾 شامي"], ["ma", "🇲🇦 مغربي"]] as [string, string][]).map(([val, label]) => (
                  <button key={val} onClick={() => setFilter(val as Dialect | "all")}
                    className={`w-full text-right px-3 py-2 rounded-xl text-[12px] font-semibold transition-colors ${filter === val ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Featured members */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4">
              <p className="text-white/50 text-[11px] font-bold uppercase tracking-widest mb-3">{ar ? "أعضاء مميزون ⭐" : "Top Members ⭐"}</p>
              <div className="space-y-3">
                {SEED_MSGS.slice(0, 5).map(m => (
                  <div key={m.id} className="flex items-center gap-2.5" dir="rtl">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${dialectColors[m.dialect]} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
                      {m.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/70 text-[11px] font-semibold truncate">{m.name}</p>
                      <p className="text-white/30 text-[9px]">{dialectLabels[m.dialect]}</p>
                    </div>
                    <Heart className="w-3 h-3 text-rose-400 shrink-0" />
                    <span className="text-white/30 text-[10px] shrink-0">{m.likes}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA card */}
            <div className="bg-gradient-to-br from-purple-500/15 to-indigo-500/10 border border-purple-500/20 rounded-2xl p-4 text-center">
              <Sparkles className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <p className="text-white font-bold text-sm mb-1">{ar ? "ابدأ مشروعك 🚀" : "Start Your Project 🚀"}</p>
              <p className="text-white/40 text-[11px] mb-3">{ar ? "انضم لعائلة عملاء كيروكس" : "Join the Qirox client family"}</p>
              <Link href="/join" data-testid="btn-community-start-project">
                <span className="inline-flex items-center gap-1.5 bg-white text-black font-bold text-[12px] px-4 py-2 rounded-xl hover:bg-white/90 transition-colors">
                  {ar ? "ابدأ الآن" : "Get Started"} <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>

            {/* Posters link */}
            <Link href="/posters" data-testid="link-community-to-posters">
              <div className="group bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.07] hover:border-white/[0.12] rounded-2xl p-4 cursor-pointer transition-all">
                <div className="flex items-center justify-between" dir={ar ? "rtl" : "ltr"}>
                  <div>
                    <p className="text-white/70 group-hover:text-white font-bold text-sm transition-colors">{ar ? "🎨 معرض البوسترات" : "🎨 Posters Gallery"}</p>
                    <p className="text-white/30 text-[11px]">{ar ? "شاهد أعمالنا الإبداعية" : "View our creative work"}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
