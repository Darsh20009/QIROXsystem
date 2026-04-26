import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useState, useRef, useEffect } from "react";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  Check, Zap, Star, Crown, Infinity as InfinityIcon, Globe, Sparkles,
  UtensilsCrossed, ShoppingBag, Building2, GraduationCap, Heart, Home,
  Smartphone, Shield, BarChart3, Bell, Layers, Rocket, MessageSquare,
  Copy, X, Send, Loader2, ChevronRight, ChevronDown, Phone, Mail,
  User, Calendar, CalendarRange, CalendarDays, Bot, CheckCircle2,
  ArrowRight, ExternalLink, Tag, Palette, Lock, TrendingUp, Database,
  Server, LayoutDashboard, Dumbbell, Store, Users, MessageCircle,
  Minus, Plus, ScanLine, ClipboardList, ReceiptText, Printer, Truck,
  CreditCard, Award, Apple, PlayCircle, Gift, Clock, ChevronLeft,
} from "lucide-react";
import { Input } from "@/components/ui/input";

/* ─── Pricing Data ────────────────────────────────────────────────────── */
const PRICES = {
  restaurant: { lite: { sm: 399, yr: 699, life: 3999 }, pro: { sm: 599, yr: 999, life: 5999 }, infinity: { sm: 899, yr: 1499, life: 8999 } },
  ecommerce:  { lite: { sm: 399, yr: 699, life: 3999 }, pro: { sm: 599, yr: 999, life: 5999 }, infinity: { sm: 899, yr: 1499, life: 8999 } },
};
function multiYearPrice(annual: number, years: number) {
  let total = 0;
  for (let i = 0; i < years; i++) total += annual * Math.max(1 - i * 0.05, 0.6);
  return Math.round(total);
}
function multiYearDiscount(years: number) { return Math.min((years - 1) * 5, 40); }

/* ─── Features ────────────────────────────────────────────────────────── */
const RESTAURANT_FEATURES = {
  lite: [
    { icon: Globe,           ar: "موقع العميل الاحترافي" },
    { icon: LayoutDashboard, ar: "نظام إدارة الطاولات" },
    { icon: ScanLine,        ar: "نظام نقاط البيع (POS)" },
    { icon: Printer,         ar: "نظام طباعة الفواتير والطلبات" },
    { icon: Truck,           ar: "نظام تتبع الطلبات" },
    { icon: Layers,          ar: "الميزات الأساسية للنظام" },
  ],
  pro: [
    { icon: Zap,            ar: "كل مميزات لايت ✦" },
    { icon: BarChart3,      ar: "نظام المحاسبة المتكاملة" },
    { icon: Award,          ar: "نظام الولاء والنقاط" },
    { icon: Apple,          ar: "إضافة لـ Apple Wallet" },
    { icon: Users,          ar: "إدارة العملاء المتكاملة" },
    { icon: Star,           ar: "نظام التقييمات والمراجعات" },
    { icon: Layers,         ar: "نظام الـ Integrations" },
    { icon: CreditCard,     ar: "بوابة دفع إلكترونية مجانية" },
    { icon: Smartphone,     ar: "تطبيق PWA (ويب تطبيق)" },
    { icon: Bell,           ar: "إشعارات فورية (Push)" },
    { icon: Mail,           ar: "1,000 رسالة بريدية شهرياً" },
    { icon: CheckCircle2,   ar: "5 تعديلات ما بعد التسليم" },
  ],
  infinity: [
    { icon: Star,           ar: "كل مميزات برو ✦✦" },
    { icon: PlayCircle,     ar: "تطبيق Google Play (سنوي/مدى الحياة)" },
    { icon: Apple,          ar: "تطبيق App Store (سنوي/مدى الحياة)" },
    { icon: Mail,           ar: "5 بريد باسم المطعم/الكافيه" },
    { icon: MessageCircle,  ar: "10,000 رسالة بريدية شهرياً" },
    { icon: Building2,      ar: "توافق نظام الحضور والإدارة المؤسسية" },
    { icon: Rocket,         ar: "20 تطوير/ميزة ما بعد التسليم" },
  ],
};
const ECOMMERCE_FEATURES = {
  lite: [
    { icon: Globe,           ar: "موقع متجر إلكتروني احترافي" },
    { icon: ShoppingBag,     ar: "نظام إدارة المنتجات والمخزون" },
    { icon: ReceiptText,     ar: "سلة التسوق وإدارة الطلبات" },
    { icon: Printer,         ar: "نظام طباعة الفواتير" },
    { icon: Truck,           ar: "نظام تتبع وشحن الطلبات" },
    { icon: Layers,          ar: "الميزات الأساسية للمتجر" },
  ],
  pro: [
    { icon: Zap,            ar: "كل مميزات لايت ✦" },
    { icon: BarChart3,      ar: "نظام المحاسبة والتقارير" },
    { icon: Award,          ar: "نظام الولاء والكوبونات" },
    { icon: Apple,          ar: "إضافة لـ Apple Wallet" },
    { icon: Users,          ar: "إدارة العملاء المتكاملة" },
    { icon: Star,           ar: "نظام التقييمات والمراجعات" },
    { icon: Layers,         ar: "نظام الـ Integrations" },
    { icon: CreditCard,     ar: "بوابة دفع إلكترونية مجانية" },
    { icon: Smartphone,     ar: "تطبيق PWA (ويب تطبيق)" },
    { icon: Bell,           ar: "إشعارات للطلبات الجديدة" },
    { icon: Mail,           ar: "1,000 رسالة بريدية شهرياً" },
    { icon: CheckCircle2,   ar: "5 تعديلات ما بعد التسليم" },
  ],
  infinity: [
    { icon: Star,           ar: "كل مميزات برو ✦✦" },
    { icon: PlayCircle,     ar: "تطبيق Google Play (سنوي/مدى الحياة)" },
    { icon: Apple,          ar: "تطبيق App Store (سنوي/مدى الحياة)" },
    { icon: Mail,           ar: "5 بريد باسم المتجر" },
    { icon: MessageCircle,  ar: "10,000 رسالة بريدية شهرياً" },
    { icon: Database,       ar: "نظام مخزون متكامل متقدم" },
    { icon: Rocket,         ar: "20 تطوير/ميزة ما بعد التسليم" },
  ],
};

const LIFETIME_PERKS = [
  { icon: Globe,    ar: "نطاق مجاني لمدة 3 سنوات" },
  { icon: Shield,   ar: "دعم تقني مستمر 3 سنوات من التسليم" },
  { icon: Server,   ar: "استضافة على خوادم كيروكس مدى الحياة" },
  { icon: Clock,    ar: "متابعة شخصية بعد 3 سنوات بـ 100 ريال/سنة فقط" },
];

const OTHER_SECTORS = [
  { key: "education",    icon: GraduationCap, ar: "تعليم وأكاديميات" },
  { key: "healthcare",   icon: Heart,         ar: "صحة وعيادات" },
  { key: "realestate",   icon: Home,          ar: "عقارات" },
  { key: "corporate",    icon: Building2,     ar: "شركات ومؤسسات" },
  { key: "fitness",      icon: Dumbbell,      ar: "لياقة وجيم" },
  { key: "beauty",       icon: Sparkles,      ar: "تجميل وصالونات" },
  { key: "events",       icon: Calendar,      ar: "فعاليات ومناسبات" },
  { key: "other",        icon: Globe,         ar: "قطاع آخر" },
];

const DURATION_OPTS = [
  { key: "sixmonth", ar: "6 أشهر", icon: CalendarRange },
  { key: "annual",   ar: "سنة", icon: CalendarDays },
  { key: "2y",       ar: "سنتان", icon: CalendarDays },
  { key: "3y",       ar: "3 سنوات", icon: CalendarDays },
  { key: "5y",       ar: "5 سنوات", icon: CalendarDays },
  { key: "lifetime", ar: "مدى الحياة", icon: InfinityIcon },
];

/* ─── Helpers ─────────────────────────────────────────────────────────── */
function fmt(n: number) { return n.toLocaleString("ar-SA"); }

type Period = "sixmonth" | "annual" | "multiyear" | "lifetime";
type Sector = "restaurant" | "ecommerce" | "other";
type Tier   = "lite" | "pro" | "infinity";

/* ─── Plan Card ───────────────────────────────────────────────────────── */
const TIER_STYLES: Record<Tier, { bg: string; border: string; headerBg: string; textColor: string; badgeBg: string; btnBg: string; glow: string; tag: string }> = {
  lite: {
    bg: "bg-white dark:bg-[#0f172a]", border: "border-gray-200 dark:border-slate-700/50",
    headerBg: "bg-gray-50 dark:bg-[#111827]", textColor: "text-gray-900 dark:text-white",
    badgeBg: "bg-gray-100 dark:bg-slate-800", btnBg: "bg-gray-900 hover:bg-black text-white dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900",
    glow: "", tag: "انطلق بثقة",
  },
  pro: {
    bg: "bg-[#1a3a6e]", border: "border-blue-400/20",
    headerBg: "from-[#1e40af] to-[#1a3a6e]", textColor: "text-white",
    badgeBg: "bg-white/10", btnBg: "bg-white hover:bg-blue-50 text-blue-900",
    glow: "shadow-[0_0_60px_rgba(59,130,246,0.18)]", tag: "النظام الأذكى",
  },
  infinity: {
    bg: "bg-[#09090f]", border: "border-amber-500/15",
    headerBg: "from-[#0f0f18] to-[#09090f]", textColor: "text-white",
    badgeBg: "bg-white/[0.07]", btnBg: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white",
    glow: "shadow-[0_0_60px_rgba(245,158,11,0.12)]", tag: "بلا حدود",
  },
};

function PlanCard({ tier, period, years, sector, onCustom, whatsapp }: {
  tier: Tier; period: Period; years: number; sector: "restaurant"|"ecommerce";
  onCustom: ()=>void; whatsapp: string;
}) {
  const st = TIER_STYLES[tier];
  const prices = PRICES[sector][tier];
  const features = sector === "restaurant" ? RESTAURANT_FEATURES[tier] : ECOMMERCE_FEATURES[tier];
  const isPro = tier === "pro";
  const isInfinity = tier === "infinity";
  const isLifetime = period === "lifetime";

  let price = 0, label = "", sublabel = "";
  if (period === "sixmonth") { price = prices.sm; label = "6 أشهر"; sublabel = `${fmt(prices.sm * 2)} / السنة`; }
  else if (period === "annual") { price = prices.yr; label = "سنة"; sublabel = "دفعة واحدة"; }
  else if (period === "multiyear") {
    price = multiYearPrice(prices.yr, years);
    const disc = multiYearDiscount(years);
    label = `${years} سنوات`;
    sublabel = disc > 0 ? `خصم ${disc}% على السنوات الإضافية` : "";
  }
  else { price = prices.life; label = "مدى الحياة"; sublabel = "دفعة واحدة للأبد"; }

  const icons = { lite: Zap, pro: Star, infinity: InfinityIcon };
  const TIcon = icons[tier];

  const tierNames = { lite: "لايت", pro: "برو", infinity: "إنفينتي" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className={`relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${st.bg} ${st.border} ${st.glow}`}
      data-testid={`card-plan-${tier}`}
    >
      {isPro && <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"/>}
      {isInfinity && <div className="absolute inset-0 pointer-events-none">{[[10,15],[88,25],[45,55],[72,10],[25,80],[93,60]].map(([x,y],i)=><div key={i} className="absolute w-1 h-1 rounded-full bg-amber-500/20" style={{left:`${x}%`,top:`${y}%`}}/>)}</div>}

      {/* Header */}
      <div className={`px-5 pt-5 pb-4 bg-gradient-to-br ${isPro || isInfinity ? st.headerBg : st.headerBg} relative`}>
        {isPro && <div className="absolute -top-px inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent"/>}
        <div className="flex items-center justify-between mb-3">
          <div className={`w-9 h-9 rounded-xl ${st.badgeBg} flex items-center justify-center`}>
            <TIcon className={`w-4.5 h-4.5 ${isInfinity ? "text-amber-400" : isPro ? "text-blue-200" : "text-gray-500 dark:text-slate-400"}`}/>
          </div>
          {isPro && <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-white/15 text-white"><Crown className="w-3 h-3"/> الأكثر طلباً</span>}
          {isInfinity && <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20"><InfinityIcon className="w-3 h-3"/> الباقة الشاملة</span>}
        </div>
        <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${isPro ? "text-blue-300/40" : isInfinity ? "text-amber-400/30" : "text-gray-400 dark:text-slate-500"}`}>QIROX SYSTEMS</p>
        <h3 className={`text-xl font-black ${st.textColor}`}>{tierNames[tier]}</h3>
        <p className={`text-[11px] mt-0.5 font-bold tracking-wider ${isPro ? "text-blue-300/50" : isInfinity ? "text-amber-400/50" : "text-gray-400"}`}>— {st.tag}</p>
      </div>

      {/* Price */}
      <div className={`px-5 py-4 ${isPro ? "bg-white/[0.04] border-t border-white/10" : isInfinity ? "bg-white/[0.02] border-t border-white/[0.06]" : "bg-gray-50 dark:bg-[#111827] border-t border-gray-100 dark:border-slate-800"}`}>
        <AnimatePresence mode="wait">
          <motion.div key={`${tier}-${period}-${years}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
            <div className="flex items-end gap-1.5 flex-wrap">
              <span className={`text-3xl font-black tracking-tight ${st.textColor}`}>{fmt(price)}</span>
              <span className={`text-sm font-bold mb-1 ${isPro || isInfinity ? "text-white/40" : "text-gray-400"}`}>ريال</span>
              <span className={`text-xs mb-1 ${isPro || isInfinity ? "text-white/30" : "text-gray-400"}`}>/ {label}</span>
            </div>
            {sublabel && <p className={`text-[11px] mt-0.5 ${isPro ? "text-blue-300/40" : isInfinity ? "text-amber-400/30" : "text-gray-400"}`}>{sublabel}</p>}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Features */}
      <div className={`flex-1 px-5 py-4 ${isInfinity ? "bg-[#09090f]" : isPro ? "bg-[#1a3a6e]" : "bg-white dark:bg-[#0f172a]"}`}>
        <p className={`text-[9px] font-black uppercase tracking-[0.18em] mb-3 ${isPro ? "text-white/20" : isInfinity ? "text-amber-400/25" : "text-gray-400 dark:text-slate-500"}`}>يشمل النظام</p>
        {/* Lifetime extra banner */}
        {isLifetime && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-3 ${isPro ? "bg-white/10 border border-white/20" : isInfinity ? "bg-amber-500/10 border border-amber-500/20" : "bg-black/[0.04] border border-black/[0.08] dark:bg-white/[0.04] dark:border-white/[0.08]"}`}>
            <InfinityIcon className={`w-4 h-4 shrink-0 ${isInfinity ? "text-amber-400" : isPro ? "text-blue-200" : "text-gray-600 dark:text-white"}`}/>
            <span className={`text-[11px] font-black ${isInfinity ? "text-amber-300" : isPro ? "text-white" : "text-gray-700 dark:text-white"}`}>كل الميزات مفتوحة — مدى الحياة</span>
          </div>
        )}
        <div className="space-y-2">
          {features.map(({ icon: Icon, ar }, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${isPro ? "bg-white/10" : isInfinity ? "bg-white/[0.07]" : "bg-gray-100 dark:bg-slate-800"}`}>
                <Icon className={`w-3 h-3 ${isInfinity ? "text-amber-400" : isPro ? "text-blue-200" : "text-gray-500 dark:text-slate-400"}`}/>
              </div>
              <span className={`text-[11px] leading-snug ${isInfinity ? "text-slate-300" : isPro ? "text-blue-100" : "text-gray-600 dark:text-slate-300"}`}>{ar}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className={`px-5 pb-5 pt-3 ${isInfinity ? "bg-[#09090f]" : isPro ? "bg-[#1a3a6e]" : "bg-white dark:bg-[#0f172a]"}`}>
        <a
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`مرحباً، أريد الاشتراك في باقة ${tierNames[tier]} لـ ${period === "sixmonth" ? "6 أشهر" : period === "annual" ? "سنة" : period === "multiyear" ? `${years} سنوات` : "مدى الحياة"} بسعر ${fmt(price)} ريال`)}`}
          target="_blank" rel="noopener noreferrer"
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all ${st.btnBg}`}
          data-testid={`button-subscribe-${tier}`}
        >
          <MessageSquare className="w-4 h-4"/>
          ابدأ الآن عبر واتساب
        </a>
      </div>
    </motion.div>
  );
}

/* ─── Custom Plan Card ────────────────────────────────────────────────── */
function CustomCard({ onOpen }: { onOpen: ()=>void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      className="relative flex flex-col rounded-2xl border border-dashed border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-[#0d0d18] overflow-hidden group hover:border-gray-400 dark:hover:border-slate-500 transition-all hover:shadow-xl"
      data-testid="card-custom-plan"
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
          <Sparkles className="w-8 h-8 text-white"/>
        </div>
        <div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">على تخصيص</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">اكتب كل متطلباتك ومميزاتك التي تحتاجها، وسنقدم لك عرضاً مناسباً</p>
        </div>
        <div className="w-full space-y-2 text-start">
          {["اختر المدة التي تناسبك","صف احتياجاتك بمساعدة الذكاء الاصطناعي","احصل على رقم تذكرة ومتابعة"].map((t,i)=>(
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                <span className="text-[9px] font-black text-violet-600 dark:text-violet-400">{i+1}</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-slate-400">{t}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-violet-600 dark:text-violet-400 font-black flex items-center gap-1">
          <Bot className="w-3 h-3"/> مع مساعدة الذكاء الاصطناعي
        </p>
      </div>
      <div className="px-6 pb-6">
        <button onClick={onOpen} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white text-sm font-black transition-all shadow-lg shadow-purple-500/20" data-testid="button-open-custom">
          <Sparkles className="w-4 h-4"/> صمّم باقتك الخاصة
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Lifetime Perks Banner ───────────────────────────────────────────── */
function LifetimePerks() {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-2xl bg-gradient-to-r from-[#09090f] via-[#0f0f1a] to-[#09090f] border border-amber-500/15 p-6">
      <div className="flex items-center gap-2 mb-4">
        <InfinityIcon className="w-5 h-5 text-amber-400"/>
        <h4 className="font-black text-white">مميزات خاصة بباقة مدى الحياة</h4>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {LIFETIME_PERKS.map(({ icon: Icon, ar }, i) => (
          <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-amber-500/10">
            <Icon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"/>
            <span className="text-xs text-slate-300 leading-snug">{ar}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Custom Ticket Modal ─────────────────────────────────────────────── */
interface ChatMsg { role: "user"|"assistant"; content: string; }
function CustomModal({ onClose, sector, sectorLabel, initialDuration }: {
  onClose: ()=>void; sector: string; sectorLabel: string; initialDuration?: string;
}) {
  const { toast } = useToast();
  const { user } = useUser();
  const [step, setStep] = useState<"chat"|"contact"|"success">("chat");
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([
    { role: "assistant", content: `مرحباً! أنا مساعد كيروكس 🤝\nسأساعدك على صياغة احتياجاتك بشكل دقيق حتى يتمكن فريقنا من تقديم أفضل عرض سعر لك.\n\nأخبرني: ما نوع نشاطك؟ وما أبرز الميزات التي تحتاجها في نظامك؟` },
  ]);
  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [requirements, setRequirements] = useState("");
  const [contactName, setContactName] = useState((user as any)?.fullName || "");
  const [contactPhone, setContactPhone] = useState((user as any)?.phone || "");
  const [contactEmail, setContactEmail] = useState((user as any)?.email || "");
  const [duration, setDuration] = useState(initialDuration || "annual");
  const [submitting, setSubmitting] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  const [whatsapp, setWhatsapp] = useState("966500000000");
  const chatRef = useRef<HTMLDivElement>(null);

  useQuery<any>({
    queryKey: ["/api/public/settings"],
    staleTime: 60_000,
    select: (d: any) => { if (d?.whatsapp) setWhatsapp(d.whatsapp.replace(/\D/g,"")); return d; },
  });

  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }); }, [chatHistory]);

  async function sendAiMsg() {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    const updated: ChatMsg[] = [...chatHistory, { role: "user", content: userMsg }];
    setChatHistory(updated);
    setAiLoading(true);
    try {
      const r = await fetch("/api/price-request/ai-help", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history: updated.slice(0, -1) }),
      });
      const d = await r.json();
      setChatHistory(prev => [...prev, { role: "assistant", content: d.reply || "..." }]);
    } catch {
      setChatHistory(prev => [...prev, { role: "assistant", content: "عذراً، حدث خطأ. اكتب احتياجاتك مباشرة في الحقل أدناه." }]);
    }
    setAiLoading(false);
  }

  function useAsRequirements(content: string) {
    setRequirements(content);
    toast({ title: "تم نقل الوصف ✓", description: "يمكنك تعديله قبل الإرسال" });
  }

  async function handleSubmit() {
    if (!contactName || !contactPhone || !requirements) {
      toast({ title: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" }); return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/price-request", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sector, sectorLabel, duration, requirements, contactName, contactPhone, contactEmail }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "فشل الإرسال");
      setTicketNumber(d.ticketNumber);
      setStep("success");
    } catch (e: any) {
      toast({ title: "فشل الإرسال", description: e.message, variant: "destructive" });
    }
    setSubmitting(false);
  }

  const durLabels: Record<string,string> = { sixmonth:"6 أشهر", annual:"سنة", "2y":"سنتان", "3y":"3 سنوات", "5y":"5 سنوات", lifetime:"مدى الحياة" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}/>
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0d0d18] rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.05] shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white"/>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-black text-black dark:text-white">باقة مخصصة — {sectorLabel}</h3>
            <p className="text-[10px] text-black/40 dark:text-white/40">اكتب احتياجاتك واحصل على عرض سعر</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05]">
            <X className="w-4 h-4 text-black/40 dark:text-white/40"/>
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 px-5 py-2 shrink-0 border-b border-black/[0.05] dark:border-white/[0.04]">
          {["chat","contact","success"].map((s,i)=>(
            <div key={s} className="flex items-center gap-1.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${step===s||( s==="success"&&step==="success")?"bg-violet-600 text-white":step==="success"||( i===0&&step!=="chat")||(i===1&&step==="success")?"bg-emerald-500 text-white":"bg-black/[0.06] dark:bg-white/[0.06] text-black/40 dark:text-white/40"}`}>
                {(i===0&&step!=="chat")||(i===1&&step==="success")?<Check className="w-3 h-3"/>:i+1}
              </div>
              <span className={`text-[10px] font-semibold ${step===s?"text-violet-600":"text-black/30 dark:text-white/30"}`}>{["صياغة الاحتياجات","بياناتك","التأكيد"][i]}</span>
              {i<2&&<ChevronLeft className="w-3 h-3 text-black/20 dark:text-white/20"/>}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col">

          {/* ── Step 1: Chat ── */}
          {step === "chat" && (
            <div className="flex flex-col h-full">
              <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role==="user"?"justify-start":"justify-end"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${msg.role==="user"?"bg-black/[0.04] dark:bg-white/[0.05]":"bg-violet-600 text-white"}`}>
                      <p className={`text-xs leading-relaxed whitespace-pre-wrap ${msg.role==="user"?"text-black dark:text-white":"text-white"}`}>{msg.content}</p>
                      {msg.role==="assistant"&&<button onClick={()=>useAsRequirements(msg.content)} className="mt-1.5 text-[9px] text-white/60 hover:text-white flex items-center gap-1"><ClipboardList className="w-3 h-3"/>استخدم كوصف</button>}
                    </div>
                  </div>
                ))}
                {aiLoading && <div className="flex justify-end"><div className="bg-violet-600 rounded-2xl px-4 py-3"><div className="flex gap-1">{[0,1,2].map(i=><div key={i} className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}</div></div></div>}
              </div>
              <div className="border-t border-black/[0.06] dark:border-white/[0.05] p-3 flex gap-2 shrink-0">
                <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendAiMsg()} placeholder="اكتب احتياجاتك..." className="flex-1 bg-black/[0.03] dark:bg-white/[0.04] rounded-xl px-3 py-2 text-sm outline-none placeholder:text-black/25 dark:placeholder:text-white/25 text-black dark:text-white" data-testid="input-ai-chat"/>
                <button onClick={sendAiMsg} disabled={!input.trim()||aiLoading} className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 flex items-center justify-center transition" data-testid="button-send-ai">
                  {aiLoading?<Loader2 className="w-4 h-4 text-white animate-spin"/>:<Send className="w-4 h-4 text-white"/>}
                </button>
              </div>
              {/* Requirements textarea */}
              <div className="p-3 pt-0 shrink-0">
                <label className="text-[10px] font-black uppercase tracking-wider text-black/30 dark:text-white/30 mb-1.5 block">الوصف النهائي لمتطلباتك *</label>
                <textarea value={requirements} onChange={e=>setRequirements(e.target.value)} rows={3} placeholder="اكتب أو انقل الوصف هنا..." className="w-full bg-black/[0.03] dark:bg-white/[0.04] rounded-xl px-3 py-2 text-sm outline-none resize-none placeholder:text-black/20 dark:placeholder:text-white/20 text-black dark:text-white border border-black/[0.06] dark:border-white/[0.05]" data-testid="textarea-requirements"/>
                <button onClick={()=>requirements&&setStep("contact")} disabled={!requirements.trim()} className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-black transition" data-testid="button-next-contact">
                  التالي: بياناتك <ArrowRight className="w-4 h-4"/>
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Contact ── */}
          {step === "contact" && (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/20">
                <p className="text-[10px] font-black text-violet-600 dark:text-violet-400 mb-1">الوصف المدخل:</p>
                <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed line-clamp-3">{requirements}</p>
                <button onClick={()=>setStep("chat")} className="text-[10px] text-violet-500 mt-1 hover:underline">تعديل الوصف</button>
              </div>

              <div>
                <label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-wider mb-1.5 block">مدة المشروع</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {DURATION_OPTS.map(({key,ar,icon:Icon})=>(
                    <button key={key} onClick={()=>setDuration(key)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${duration===key?"bg-violet-600 text-white":"bg-black/[0.03] dark:bg-white/[0.04] text-black/50 dark:text-white/50 hover:bg-black/[0.06] dark:hover:bg-white/[0.07]"}`} data-testid={`button-duration-${key}`}>
                      <Icon className="w-3 h-3"/>{ar}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-wider mb-1.5 block">الاسم *</label>
                  <div className="relative">
                    <User className="absolute top-1/2 -translate-y-1/2 right-3 w-3.5 h-3.5 text-black/25 dark:text-white/25 pointer-events-none"/>
                    <Input value={contactName} onChange={e=>setContactName(e.target.value)} className="pr-9 h-9 text-sm" placeholder="اسمك الكريم" data-testid="input-contact-name"/>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-wider mb-1.5 block">رقم الهاتف / واتساب *</label>
                  <div className="relative">
                    <Phone className="absolute top-1/2 -translate-y-1/2 right-3 w-3.5 h-3.5 text-black/25 dark:text-white/25 pointer-events-none"/>
                    <Input value={contactPhone} onChange={e=>setContactPhone(e.target.value)} className="pr-9 h-9 text-sm" placeholder="+966 5XX XXX XXX" dir="ltr" data-testid="input-contact-phone"/>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-wider mb-1.5 block">البريد الإلكتروني (اختياري)</label>
                  <div className="relative">
                    <Mail className="absolute top-1/2 -translate-y-1/2 right-3 w-3.5 h-3.5 text-black/25 dark:text-white/25 pointer-events-none"/>
                    <Input value={contactEmail} onChange={e=>setContactEmail(e.target.value)} className="pr-9 h-9 text-sm" placeholder="email@example.com" dir="ltr" data-testid="input-contact-email"/>
                  </div>
                </div>
              </div>

              <button onClick={handleSubmit} disabled={submitting||!contactName||!contactPhone} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 disabled:opacity-40 text-white text-sm font-black transition" data-testid="button-submit-ticket">
                {submitting?<Loader2 className="w-4 h-4 animate-spin"/>:<Send className="w-4 h-4"/>}
                {submitting?"جارٍ الإرسال...":"أرسل طلب السعر"}
              </button>
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {step === "success" && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500"/>
              </div>
              <div>
                <h3 className="text-xl font-black text-black dark:text-white mb-1">تم استلام طلبك!</h3>
                <p className="text-sm text-black/50 dark:text-white/50">رقم تذكرتك</p>
                <div className="flex items-center gap-2 justify-center mt-2">
                  <span className="text-2xl font-black text-violet-600 dark:text-violet-400 font-mono">{ticketNumber}</span>
                  <button onClick={()=>{navigator.clipboard.writeText(ticketNumber);toast({title:"تم النسخ ✓"});}} className="p-1.5 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"><Copy className="w-4 h-4 text-black/40 dark:text-white/40"/></button>
                </div>
              </div>
              <div className="w-full p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/20 text-sm text-emerald-700 dark:text-emerald-300 space-y-1">
                <p>✓ تم إشعار فريق كيروكس</p>
                <p>✓ ستصلك رسالة تأكيد قريباً</p>
                {user && <p>✓ يمكنك متابعة الطلب من حسابك</p>}
              </div>
              <a
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`مرحباً، لدي طلب سعر برقم التذكرة ${ticketNumber} — ${sectorLabel}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] hover:bg-[#20c05c] text-white text-sm font-black transition"
                data-testid="button-whatsapp-ticket"
              >
                <MessageSquare className="w-4 h-4"/>
                تواصل واتساب برقم التذكرة
              </a>
              <button onClick={onClose} className="text-sm text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white transition">إغلاق</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────── */
export default function Prices() {
  const { L } = useI18n();
  const { user } = useUser();
  const [sector, setSector] = useState<Sector>("restaurant");
  const [period, setPeriod] = useState<Period>("annual");
  const [years, setYears] = useState(2);
  const [otherSector, setOtherSector] = useState("education");
  const [otherDuration, setOtherDuration] = useState("annual");
  const [customOpen, setCustomOpen] = useState(false);
  const [customSector, setCustomSector] = useState("restaurant");
  const [customSectorLabel, setCustomSectorLabel] = useState("مطاعم ومقاهي");
  const [customDuration, setCustomDuration] = useState("annual");

  const { data: settings } = useQuery<any>({ queryKey: ["/api/public/settings"], staleTime: 60_000 });
  const whatsapp = (settings?.whatsapp || settings?.contactPhone || "").replace(/\D/g, "") || "966500000000";

  const SECTORS_DATA = [
    { key: "restaurant" as Sector, icon: UtensilsCrossed, ar: "مطاعم ومقاهي", en: "Restaurants", color: "from-orange-500 to-amber-500" },
    { key: "ecommerce"  as Sector, icon: ShoppingBag,     ar: "متاجر إلكترونية", en: "E-Commerce", color: "from-blue-500 to-cyan-500" },
    { key: "other"      as Sector, icon: Building2,        ar: "قطاعات أخرى", en: "Other Sectors", color: "from-violet-500 to-purple-600" },
  ];

  function openCustom(sec: string, label: string, dur?: string) {
    setCustomSector(sec); setCustomSectorLabel(label);
    setCustomDuration(dur || period === "multiyear" ? `${years}y` : period);
    setCustomOpen(true);
  }

  const PERIODS_LIST = [
    { key: "sixmonth" as Period, ar: "6 أشهر", icon: CalendarRange },
    { key: "annual"   as Period, ar: "سنة", icon: CalendarDays },
    { key: "multiyear"as Period, ar: "سنوات+", icon: CalendarDays, extra: true },
    { key: "lifetime" as Period, ar: "مدى الحياة", icon: InfinityIcon },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#05050c]" dir="rtl">
      <Navigation/>

      {/* ── Hero ── */}
      <section className="pt-24 pb-8 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-black/30 dark:text-white/30 mb-4">
            <Tag className="w-3 h-3"/> الباقات والأسعار
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-black dark:text-white mb-3 leading-tight">
            اختر الباقة المناسبة<br/>
            <span className="bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent">لنشاطك التجاري</span>
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-base max-w-lg mx-auto">
            أسعار شفافة بدون رسوم مخفية — باقات مرنة تناسب كل قطاع
          </p>
        </motion.div>
      </section>

      {/* ── Sector Tabs ── */}
      <section className="px-4 pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 p-1.5 bg-black/[0.04] dark:bg-white/[0.04] rounded-2xl">
            {SECTORS_DATA.map(s => {
              const Icon = s.icon;
              const active = sector === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setSector(s.key)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-4 rounded-xl transition-all ${active ? "bg-white dark:bg-[#1a1a2e] shadow-md" : "hover:bg-white/50 dark:hover:bg-white/[0.04]"}`}
                  data-testid={`button-sector-${s.key}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${active ? `bg-gradient-to-br ${s.color}` : "bg-black/[0.06] dark:bg-white/[0.06]"}`}>
                    <Icon className={`w-4 h-4 ${active ? "text-white" : "text-black/40 dark:text-white/40"}`}/>
                  </div>
                  <span className={`text-[11px] font-black ${active ? "text-black dark:text-white" : "text-black/35 dark:text-white/35"}`}>{s.ar}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Pricing Content ── */}
      <section className="px-4 pb-16">
        <div className="max-w-6xl mx-auto">

          {/* Restaurant / Ecommerce */}
          {(sector === "restaurant" || sector === "ecommerce") && (
            <>
              {/* Period switcher */}
              <div className="flex flex-col items-center mb-8 gap-3">
                <div className="flex gap-1.5 p-1 bg-black/[0.04] dark:bg-white/[0.04] rounded-xl">
                  {PERIODS_LIST.map(p => {
                    const Icon = p.icon;
                    const active = period === p.key;
                    return (
                      <button key={p.key} onClick={() => setPeriod(p.key)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black transition-all ${active ? "bg-white dark:bg-[#1a1a2e] text-black dark:text-white shadow-sm" : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"}`}
                        data-testid={`button-period-${p.key}`}
                      >
                        <Icon className="w-3.5 h-3.5"/>{p.ar}
                      </button>
                    );
                  })}
                </div>

                {/* Multi-year picker */}
                {period === "multiyear" && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/20">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">عدد السنوات:</span>
                    <button onClick={() => setYears(y => Math.max(2, y - 1))} className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 transition"><Minus className="w-3 h-3"/></button>
                    <span className="text-lg font-black text-blue-700 dark:text-blue-300 w-6 text-center">{years}</span>
                    <button onClick={() => setYears(y => Math.min(10, y + 1))} className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 transition"><Plus className="w-3 h-3"/></button>
                    <span className="text-xs font-bold text-blue-500 dark:text-blue-400">خصم {multiYearDiscount(years)}% على السنوات الإضافية</span>
                  </motion.div>
                )}
              </div>

              {/* Plan cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <PlanCard tier="lite"     period={period} years={years} sector={sector as "restaurant"|"ecommerce"} onCustom={() => openCustom(sector, SECTORS_DATA.find(s=>s.key===sector)?.ar||sector)} whatsapp={whatsapp}/>
                <PlanCard tier="pro"      period={period} years={years} sector={sector as "restaurant"|"ecommerce"} onCustom={() => openCustom(sector, SECTORS_DATA.find(s=>s.key===sector)?.ar||sector)} whatsapp={whatsapp}/>
                <PlanCard tier="infinity" period={period} years={years} sector={sector as "restaurant"|"ecommerce"} onCustom={() => openCustom(sector, SECTORS_DATA.find(s=>s.key===sector)?.ar||sector)} whatsapp={whatsapp}/>
                <CustomCard onOpen={() => openCustom(sector, SECTORS_DATA.find(s=>s.key===sector)?.ar||sector, period==="multiyear"?`${years}y`:period)}/>
              </div>

              {/* Lifetime perks */}
              {period === "lifetime" && <LifetimePerks/>}

              {/* Multi-year note */}
              {period === "multiyear" && (
                <div className="mt-6 text-center text-xs text-black/30 dark:text-white/30">
                  السنة الثانية وما بعدها تأخذ خصم 5% إضافي لكل سنة — الخصم الأقصى 40%
                </div>
              )}

              {/* Lifetime note */}
              {period !== "lifetime" && (
                <div className="mt-6 text-center">
                  <p className="text-xs text-black/30 dark:text-white/30">
                    جميع باقات مدى الحياة تشمل نطاقاً مجانياً لمدة 3 سنوات + دعم تقني 3 سنوات + استضافة على خوادم كيروكس مدى الحياة
                  </p>
                </div>
              )}
            </>
          )}

          {/* Other Sectors */}
          {sector === "other" && (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-black dark:text-white mb-2">قطاعات أخرى</h2>
                <p className="text-sm text-black/40 dark:text-white/40">اختر قطاعك، حدد المدة، وسنعدّ لك عرضاً مخصصاً</p>
              </div>

              {/* Sub-sector grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                {OTHER_SECTORS.map(s => {
                  const Icon = s.icon;
                  const active = otherSector === s.key;
                  return (
                    <button key={s.key} onClick={() => setOtherSector(s.key)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${active ? "border-violet-400 bg-violet-50 dark:bg-violet-900/10" : "border-black/[0.06] dark:border-white/[0.06] hover:border-violet-200 dark:hover:border-violet-800"}`}
                      data-testid={`button-other-sector-${s.key}`}
                    >
                      <Icon className={`w-5 h-5 ${active ? "text-violet-600 dark:text-violet-400" : "text-black/30 dark:text-white/30"}`}/>
                      <span className={`text-[10px] font-bold text-center ${active ? "text-violet-700 dark:text-violet-300" : "text-black/40 dark:text-white/40"}`}>{s.ar}</span>
                    </button>
                  );
                })}
              </div>

              {/* Duration */}
              <div className="mb-6">
                <p className="text-[10px] font-black uppercase tracking-wider text-black/30 dark:text-white/30 mb-2">المدة المطلوبة</p>
                <div className="grid grid-cols-3 gap-2">
                  {DURATION_OPTS.map(({ key, ar, icon: Icon }) => {
                    const active = otherDuration === key;
                    return (
                      <button key={key} onClick={() => setOtherDuration(key)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${active ? "border-violet-400 bg-violet-50 dark:bg-violet-900/10 text-violet-700 dark:text-violet-300" : "border-black/[0.06] dark:border-white/[0.06] text-black/40 dark:text-white/40 hover:border-violet-200"}`}
                        data-testid={`button-other-duration-${key}`}
                      >
                        <Icon className="w-3.5 h-3.5"/>{ar}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => openCustom(otherSector, OTHER_SECTORS.find(s=>s.key===otherSector)?.ar||otherSector, otherDuration)}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white text-base font-black transition shadow-lg shadow-purple-500/20"
                data-testid="button-other-custom-open"
              >
                <Sparkles className="w-5 h-5"/>
                احصل على عرض سعر مخصص
              </button>

              <div className="mt-4 text-center text-xs text-black/30 dark:text-white/30">
                جميع باقات مدى الحياة تشمل نطاقاً مجانياً 3 سنوات + دعم 3 سنوات + استضافة دائمة على خوادم كيروكس
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Custom Modal */}
      {customOpen && (
        <CustomModal
          onClose={() => setCustomOpen(false)}
          sector={customSector}
          sectorLabel={customSectorLabel}
          initialDuration={customDuration}
        />
      )}

      <Footer/>
    </div>
  );
}
