// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Send, Sparkles, RotateCcw, Loader2, Mail, Package,
  Zap, MessageSquare, Star, Globe, Lightbulb, BookOpen,
  TrendingUp, Bot, ArrowLeft, BarChart2, Wallet, ShoppingCart,
  FileText, Users, Clock, CheckCircle2, XCircle, AlertCircle,
  ChevronRight, Briefcase, Bell, Search, CreditCard,
} from "lucide-react";

function uid() { return Math.random().toString(36).slice(2, 10); }

const STATUS_AR: Record<string, string> = {
  pending: "معلق", active: "نشط", completed: "مكتمل",
  cancelled: "ملغى", on_hold: "موقوف", todo: "قيد الانتظار",
  open: "مفتوح", closed: "مغلق",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "text-amber-300 bg-amber-500/15", active: "text-blue-300 bg-blue-500/15",
  completed: "text-emerald-300 bg-emerald-500/15", cancelled: "text-red-300 bg-red-500/15",
  on_hold: "text-orange-300 bg-orange-500/15", todo: "text-slate-300 bg-slate-500/15",
  open: "text-amber-300 bg-amber-500/15", closed: "text-slate-300 bg-slate-500/15",
};
const ROLE_AR: Record<string, string> = {
  admin: "مدير", manager: "مدير", developer: "مطور",
  designer: "مصمم", support: "دعم", sales: "مبيعات",
  sales_manager: "مدير مبيعات", accountant: "محاسب",
  merchant: "تاجر", client: "عميل",
};

interface Msg {
  id: string;
  role: "user" | "ai";
  text: string;
  suggestions?: string[];
  action?: string;
  data?: any;
  displayType?: string;
  allTools?: { name: string; success: boolean; displayType?: string; data?: any }[];
  timestamp: Date;
}

function renderText(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code class=\"bg-white/10 px-1 rounded text-xs font-mono\">$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href=\"$2\" class=\"underline text-cyan-300 hover:text-cyan-100\" target=\"_blank\">$1 ↗</a>")
    .replace(/\n/g, "<br/>");
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400/80"
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }} />
      ))}
    </div>
  );
}

const ROLE_CFG = {
  admin:           { label: "مدير", icon: "👑", gradient: "from-violet-500 to-indigo-600" },
  manager:         { label: "مدير", icon: "👑", gradient: "from-violet-500 to-indigo-600" },
  developer:       { label: "مطور", icon: "💻", gradient: "from-blue-500 to-cyan-600" },
  designer:        { label: "مصمم", icon: "🎨", gradient: "from-pink-500 to-rose-600" },
  support:         { label: "دعم", icon: "🎧", gradient: "from-teal-500 to-cyan-600" },
  sales:           { label: "مبيعات", icon: "📊", gradient: "from-green-500 to-emerald-600" },
  sales_manager:   { label: "مدير مبيعات", icon: "🏆", gradient: "from-amber-500 to-orange-600" },
  accountant:      { label: "محاسب", icon: "💰", gradient: "from-slate-500 to-gray-600" },
  merchant:        { label: "تاجر", icon: "🏪", gradient: "from-indigo-500 to-blue-600" },
  client:          { label: "عميل", icon: "⭐", gradient: "from-emerald-500 to-teal-600" },
  guest:           { label: "زائر", icon: "👋", gradient: "from-slate-500 to-slate-600" },
};

const QUICK_ACTIONS: Record<string, { label: string; icon: any; msg: string }[]> = {
  admin: [
    { label: "إحصاءات النظام", icon: BarChart2, msg: "أعطني إحصاءات النظام الكاملة" },
    { label: "الطلبات المعلّقة", icon: Clock, msg: "أظهر لي الطلبات المعلّقة" },
    { label: "قائمة العملاء", icon: Users, msg: "أظهر لي آخر العملاء المنضمين" },
    { label: "إشعار للجميع", icon: Bell, msg: "أرسل إشعاراً لجميع العملاء" },
  ],
  manager: [
    { label: "إحصاءات النظام", icon: BarChart2, msg: "أعطني إحصاءات النظام الكاملة" },
    { label: "الطلبات المعلّقة", icon: Clock, msg: "أظهر لي الطلبات المعلّقة" },
    { label: "قائمة الموظفين", icon: Briefcase, msg: "أظهر لي قائمة الموظفين" },
    { label: "إشعار للعملاء", icon: Bell, msg: "أرسل إشعاراً لجميع العملاء" },
  ],
  developer: [
    { label: "مهامي", icon: Clock, msg: "أظهر لي الطلبات النشطة المعينة لي" },
    { label: "المشاريع", icon: BookOpen, msg: "أظهر لي المشاريع الحالية" },
    { label: "إنشاء مهمة", icon: Zap, msg: "أريد إنشاء مهمة جديدة في مشروع" },
    { label: "الطلبات الجديدة", icon: Package, msg: "أظهر لي الطلبات الجديدة" },
  ],
  designer: [
    { label: "مهامي", icon: Clock, msg: "أظهر لي الطلبات النشطة" },
    { label: "المشاريع", icon: BookOpen, msg: "أظهر لي المشاريع الحالية" },
    { label: "إنشاء مهمة", icon: Zap, msg: "أريد إنشاء مهمة جديدة" },
    { label: "طلبات التصميم", icon: Package, msg: "أظهر الطلبات النشطة" },
  ],
  support: [
    { label: "طلبات الدعم", icon: Clock, msg: "أظهر الطلبات المعلّقة التي تحتاج دعماً" },
    { label: "عملاء جدد", icon: Users, msg: "أظهر آخر العملاء المنضمين" },
    { label: "تغيير حالة طلب", icon: Zap, msg: "أريد تغيير حالة طلب" },
    { label: "إرسال إشعار", icon: Bell, msg: "أريد إرسال إشعار لعميل" },
  ],
  sales: [
    { label: "العملاء الجدد", icon: Users, msg: "أظهر آخر العملاء" },
    { label: "طلبات معلّقة", icon: Clock, msg: "أظهر الطلبات المعلّقة" },
    { label: "بحث عميل", icon: Search, msg: "ابحث عن عميل" },
    { label: "إرسال دعم", icon: Mail, msg: "أريد إرسال تذكرة دعم" },
  ],
  sales_manager: [
    { label: "إحصاءات المبيعات", icon: BarChart2, msg: "أعطني إحصاءات النظام" },
    { label: "العملاء", icon: Users, msg: "أظهر قائمة العملاء" },
    { label: "الطلبات", icon: Package, msg: "أظهر آخر الطلبات" },
    { label: "إشعار عملاء", icon: Bell, msg: "أرسل إشعاراً للعملاء" },
  ],
  accountant: [
    { label: "الإحصاءات المالية", icon: BarChart2, msg: "أعطني الإحصاءات المالية للنظام" },
    { label: "الطلبات المكتملة", icon: CheckCircle2, msg: "أظهر الطلبات المكتملة هذا الشهر" },
    { label: "المشاريع", icon: BookOpen, msg: "أظهر قائمة المشاريع" },
    { label: "العملاء", icon: Users, msg: "أظهر قائمة العملاء" },
  ],
  merchant: [
    { label: "الطلبات", icon: Package, msg: "أظهر الطلبات الحالية" },
    { label: "المشاريع", icon: BookOpen, msg: "أظهر المشاريع" },
    { label: "العملاء", icon: Users, msg: "أظهر العملاء" },
    { label: "الإحصاءات", icon: BarChart2, msg: "أعطني الإحصاءات" },
  ],
  client: [
    { label: "طلباتي", icon: Package, msg: "أظهر لي طلباتي" },
    { label: "مشاريعي", icon: BookOpen, msg: "أظهر مشاريعي النشطة" },
    { label: "رصيد محفظتي", icon: CreditCard, msg: "ما رصيد محفظتي؟" },
    { label: "تواصل مع الدعم", icon: MessageSquare, msg: "أريد إرسال تذكرة دعم" },
  ],
  guest: [
    { label: "استكشف الباقات", icon: Package, msg: "أخبرني عن الباقات المتاحة" },
    { label: "أنسب باقة لي", icon: Star, msg: "أنسب باقة لمشروعي" },
    { label: "كيف تعمل المنصة؟", icon: Globe, msg: "كيف تعمل منصة QIROX؟" },
    { label: "طلب مخصص", icon: Zap, msg: "أريد طلباً مخصصاً" },
  ],
};

/* ─────── Tool Result Cards ─────── */

function OrdersTable({ data, onNavigate }: { data: any; onNavigate: (url: string) => void }) {
  if (!data?.orders?.length) return <EmptyResult label="لا توجد طلبات" />;
  return (
    <div className="w-full mt-1.5 rounded-xl overflow-hidden" style={{ background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.18)" }}>
      <div className="px-3 py-2 flex items-center justify-between border-b border-white/[0.06]">
        <span className="text-[10px] font-black text-cyan-300 flex items-center gap-1"><Package className="w-3 h-3" /> {data.count} طلب</span>
        <button onClick={() => onNavigate("/admin/orders")} className="text-[9px] text-white/30 hover:text-cyan-300 transition-colors">عرض الكل ←</button>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {data.orders.map((o: any) => (
          <div key={o.id} className="px-3 py-2 flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-white/85 truncate">{o.service}</div>
              <div className="text-[9px] text-white/35 mt-0.5">{o.client} · {o.amount ? `${Number(o.amount).toLocaleString()} ريال` : ""}</div>
            </div>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${STATUS_COLOR[o.status] || "text-slate-300 bg-slate-500/15"}`}>
              {STATUS_AR[o.status] || o.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClientsTable({ data, onNavigate }: { data: any; onNavigate: (url: string) => void }) {
  if (!data?.clients?.length) return <EmptyResult label="لا يوجد عملاء" />;
  return (
    <div className="w-full mt-1.5 rounded-xl overflow-hidden" style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.18)" }}>
      <div className="px-3 py-2 flex items-center justify-between border-b border-white/[0.06]">
        <span className="text-[10px] font-black text-violet-300 flex items-center gap-1"><Users className="w-3 h-3" /> {data.count} عميل</span>
        <button onClick={() => onNavigate("/admin/users")} className="text-[9px] text-white/30 hover:text-violet-300 transition-colors">عرض الكل ←</button>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {data.clients.map((c: any) => (
          <div key={c.id} className="px-3 py-2 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px]"
              style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.3),rgba(14,165,233,0.3))" }}>
              {(c.name || "؟")[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-white/85 truncate">{c.name}</div>
              <div className="text-[9px] text-white/35 mt-0.5">{c.email || c.phone || ""}</div>
            </div>
            {c.wallet > 0 && (
              <span className="text-[9px] text-emerald-300 font-semibold flex-shrink-0">{Number(c.wallet).toLocaleString()} ﷼</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsCard({ data }: { data: any }) {
  if (!data) return null;
  const items = [
    { label: "العملاء", value: data.totalClients, color: "text-violet-300" },
    { label: "طلبات مفتوحة", value: data.openOrders ?? data.pendingOrders ?? data.activeOrders, color: "text-orange-300" },
    { label: "الإيرادات (الشهر)", value: data.monthRevenue ? `${Number(data.monthRevenue).toLocaleString()} ﷼` : "0 ﷼", color: "text-emerald-300" },
    { label: "عملاء جدد", value: data.newClients, color: "text-cyan-300" },
  ];
  return (
    <div className="w-full mt-1.5 rounded-xl overflow-hidden" style={{ background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.22)" }}>
      <div className="px-3 py-2 border-b border-white/[0.06]">
        <span className="text-[10px] font-black text-violet-300 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> إحصاءات النظام</span>
      </div>
      <div className="px-3 py-2 grid grid-cols-2 gap-2">
        {items.map((item, i) => (
          <div key={i} className="text-center py-1">
            <div className={`text-[16px] font-black ${item.color}`}>{item.value ?? "—"}</div>
            <div className="text-[9px] text-white/40">{item.label}</div>
          </div>
        ))}
      </div>
      {data.totalOrders && (
        <div className="px-3 py-1.5 border-t border-white/[0.06] grid grid-cols-3 gap-1 text-center">
          <div><div className="text-[11px] font-bold text-amber-300">{data.pendingOrders}</div><div className="text-[8px] text-white/30">معلّق</div></div>
          <div><div className="text-[11px] font-bold text-blue-300">{data.activeOrders}</div><div className="text-[8px] text-white/30">نشط</div></div>
          <div><div className="text-[11px] font-bold text-emerald-300">{data.completedOrders}</div><div className="text-[8px] text-white/30">مكتمل</div></div>
        </div>
      )}
    </div>
  );
}

function EmployeesTable({ data }: { data: any }) {
  if (!data?.employees?.length) return <EmptyResult label="لا يوجد موظفون" />;
  return (
    <div className="w-full mt-1.5 rounded-xl overflow-hidden" style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.18)" }}>
      <div className="px-3 py-2 border-b border-white/[0.06]">
        <span className="text-[10px] font-black text-blue-300 flex items-center gap-1"><Briefcase className="w-3 h-3" /> {data.count} موظف</span>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {data.employees.map((e: any) => (
          <div key={e.id} className="px-3 py-2 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] bg-blue-500/20">
              {(e.name || "؟")[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-white/85 truncate">{e.name}</div>
              <div className="text-[9px] text-white/35">{ROLE_AR[e.role] || e.role}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WalletCard({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="w-full mt-1.5 rounded-xl overflow-hidden" style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.22)" }}>
      <div className="px-3 py-3 text-center border-b border-white/[0.06]">
        <div className="text-[10px] text-white/40 mb-1 flex items-center justify-center gap-1"><Wallet className="w-3 h-3" /> رصيد محفظتك</div>
        <div className="text-[26px] font-black text-emerald-300">{Number(data.balance || 0).toLocaleString()} <span className="text-[14px]">ريال</span></div>
      </div>
      {data.recent?.length > 0 && (
        <div className="divide-y divide-white/[0.04]">
          {data.recent.map((tx: any, i: number) => (
            <div key={i} className="px-3 py-2 flex items-center justify-between">
              <div className="text-[10px] text-white/60 truncate">{tx.service}</div>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] px-1 py-0.5 rounded-full ${STATUS_COLOR[tx.status] || "text-slate-300 bg-slate-500/15"}`}>{STATUS_AR[tx.status] || tx.status}</span>
                <span className="text-[10px] font-bold text-white/70">{Number(tx.amount).toLocaleString()} ﷼</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectsTable({ data, onNavigate }: { data: any; onNavigate: (url: string) => void }) {
  if (!data?.projects?.length) return <EmptyResult label="لا توجد مشاريع" />;
  return (
    <div className="w-full mt-1.5 rounded-xl overflow-hidden" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.18)" }}>
      <div className="px-3 py-2 flex items-center justify-between border-b border-white/[0.06]">
        <span className="text-[10px] font-black text-amber-300 flex items-center gap-1"><BookOpen className="w-3 h-3" /> {data.count} مشروع</span>
        <button onClick={() => onNavigate("/projects")} className="text-[9px] text-white/30 hover:text-amber-300 transition-colors">عرض الكل ←</button>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {data.projects.map((p: any) => (
          <div key={p.id} className="px-3 py-2 flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-white/85 truncate">{p.name}</div>
              {p.description && <div className="text-[9px] text-white/35 mt-0.5 truncate">{p.description}</div>}
            </div>
            <div className="flex-shrink-0 text-center">
              <div className="text-[10px] font-black text-amber-300">{p.progress || 0}%</div>
              <div className="w-12 h-1 bg-white/10 rounded-full mt-0.5">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${p.progress || 0}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionSuccess({ data, toolName }: { data: any; toolName?: string }) {
  const msgs: Record<string, string> = {
    update_order_status: `✅ تم تغيير حالة الطلب من "${STATUS_AR[data?.prevStatus] || data?.prevStatus}" إلى "${STATUS_AR[data?.newStatus] || data?.newStatus}"`,
    send_notification: `✅ تم إرسال الإشعار لـ ${data?.sent ?? 1} ${data?.target === "all" ? "مستخدم" : ""}`,
    cancel_my_order: "✅ تم إلغاء طلبك بنجاح",
    create_task: `✅ تم إنشاء المهمة "${data?.title}" في مشروع "${data?.project}"`,
    send_support_ticket: `✅ تم إرسال تذكرة الدعم "${data?.subject}"`,
  };
  const msg = msgs[toolName || ""] || "✅ تم تنفيذ العملية بنجاح";
  return (
    <div className="w-full mt-1.5 rounded-xl px-3 py-2.5 flex items-center gap-2"
      style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}>
      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
      <span className="text-[11px] text-emerald-300 font-semibold">{msg}</span>
    </div>
  );
}

function EmptyResult({ label }: { label: string }) {
  return (
    <div className="w-full mt-1.5 rounded-xl px-3 py-2.5 flex items-center gap-2"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <AlertCircle className="w-4 h-4 text-white/30 flex-shrink-0" />
      <span className="text-[11px] text-white/40">{label}</span>
    </div>
  );
}

/* ─── ToolResultCard dispatcher ─── */
function ToolResultCard({ displayType, toolName, data, onNavigate }: {
  displayType?: string; toolName?: string; data: any; onNavigate: (url: string) => void;
}) {
  if (!displayType || !data) return null;
  if (displayType === "orders_table") return <OrdersTable data={data} onNavigate={onNavigate} />;
  if (displayType === "clients_table") return <ClientsTable data={data} onNavigate={onNavigate} />;
  if (displayType === "analytics_card") return <AnalyticsCard data={data} />;
  if (displayType === "employees_table") return <EmployeesTable data={data} />;
  if (displayType === "wallet_card") return <WalletCard data={data} />;
  if (displayType === "projects_table") return <ProjectsTable data={data} onNavigate={onNavigate} />;
  if (displayType === "action_success") return <ActionSuccess data={data} toolName={toolName} />;
  return null;
}

/* ─── Navigate card ─── */
function NavigateCard({ url, label, onNavigate }: { url: string; label: string; onNavigate: (url: string) => void }) {
  return (
    <button onClick={() => onNavigate(url)}
      className="w-full mt-1.5 flex items-center gap-2 px-3 py-2.5 rounded-xl text-right transition-all hover:scale-[1.01]"
      style={{ background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.3)" }}
      data-testid="button-ai-navigate">
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold text-cyan-300">انتقل إلى: {label}</div>
        <div className="text-[9px] text-white/35 font-mono mt-0.5">{url}</div>
      </div>
      <ArrowLeft className="w-4 h-4 text-cyan-400 flex-shrink-0" />
    </button>
  );
}

/* ══════════════════════════════════════════════════════════
   AIPanel — main component
══════════════════════════════════════════════════════════ */
export function AIPanel({ className = "" }: { className?: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => uid());
  const [location, navigate] = useLocation();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  const { data: user } = useQuery<any>({ queryKey: ["/api/user"], retry: false });
  const role = user?.role || "guest";
  const cfg = ROLE_CFG[role] || ROLE_CFG.guest;
  const quickActions = QUICK_ACTIONS[role] || QUICK_ACTIONS.guest;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const welcomes: Record<string, string> = {
        admin: `مرحباً${user?.fullName ? ` ${user.fullName}` : ""}! 👑 أنا **QIROX AI** العامل.\n\nيمكنني **تنفيذ عمليات فعلية** على النظام:\n• عرض الطلبات والعملاء والإحصاءات\n• تغيير حالات الطلبات مباشرة\n• إرسال إشعارات للمستخدمين\n• إنشاء مهام في المشاريع\n\nماذا تريد أن أفعل؟`,
        manager: `مرحباً${user?.fullName ? ` ${user.fullName}` : ""}! 👑 أنا **QIROX AI** العامل. يمكنني إدارة الطلبات وإرسال الإشعارات وعرض التحليلات مباشرة. ماذا تريد؟`,
        developer: `أهلاً${user?.fullName ? ` ${user.fullName}` : ""}! 💻 أنا **QIROX AI**. يمكنني عرض الطلبات والمشاريع المعينة لك، وإنشاء مهام، وتغيير حالات الطلبات. ماذا تحتاج؟`,
        client: `مرحباً${user?.fullName ? ` ${user.fullName}` : ""}! ⭐ أنا **QIROX AI**، مساعدك الشخصي.\n\nيمكنني:\n• عرض طلباتك ومشاريعك ورصيدك\n• إلغاء طلب معلّق\n• إرسال تذكرة دعم\n\nكيف أساعدك؟`,
        guest: `مرحباً! أنا **QIROX AI**.\n\nيمكنني مساعدتك في اختيار الباقة المناسبة أو الإجابة على أسئلتك.`,
      };
      addAiMsg(welcomes[role] || welcomes.guest);
    }
  }, [role, user]);

  function addAiMsg(text: string, suggestions?: string[], action?: string, data?: any, displayType?: string, toolName?: string, allTools?: any[]) {
    setMsgs(prev => [...prev, { id: uid(), role: "ai", text, suggestions, action, data, displayType, allTools, timestamp: new Date() }]);
  }

  function handleNavigate(url: string) { navigate(url); }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    setMsgs(prev => [...prev, { id: uid(), role: "user", text: text.trim(), timestamp: new Date() }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          sessionId,
          context: { role, page: location, name: user?.fullName || user?.username },
        }),
      });
      const data = await res.json();

      if (data.action === "NAVIGATE" && data.data?.url) {
        addAiMsg(data.reply || "سأنقلك الآن...", data.suggestions, "NAVIGATE", data.data);
        setLoading(false);
        setTimeout(() => handleNavigate(data.data.url), 900);
        return;
      }

      addAiMsg(
        data.reply || "عذراً، حدث خطأ.",
        data.suggestions,
        data.action,
        data.toolData,
        data.displayType,
        data.toolName,
        data.allTools,
      );
    } catch {
      addAiMsg("⚠️ حدث خطأ في الاتصال. تحقق من الإنترنت وحاول مجدداً.");
    } finally {
      setLoading(false);
    }
  }, [loading, sessionId, role, location, user]);

  function resetChat() {
    setMsgs([]);
    initialized.current = false;
    fetch(`/api/ai/session/${sessionId}`, { method: "DELETE" }).catch(() => {});
    setTimeout(() => {
      initialized.current = false;
      addAiMsg("تم تجديد المحادثة. كيف أقدر أساعدك؟");
    }, 50);
  }

  return (
    <div
      className={`flex flex-col rounded-2xl overflow-hidden ${className}`}
      style={{
        background: "linear-gradient(160deg, #080e1a 0%, #0c1525 60%, #080d1a 100%)",
        border: "1px solid rgba(14,165,233,0.18)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
      dir="rtl"
    >
      {/* ── Header ── */}
      <div className={`relative flex items-center gap-2.5 px-4 py-3 flex-shrink-0 bg-gradient-to-l ${cfg.gradient}`}>
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.2) 0%, transparent 60%)" }} />
        <div className="relative w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="relative flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-black text-white text-sm tracking-tight">QIROX AI</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white font-bold">
              {cfg.icon} {cfg.label}
            </span>
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-black/20 text-white/70 font-semibold">⚡ عامل</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <motion.div className="w-1.5 h-1.5 rounded-full bg-green-300"
              animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
            <span className="text-[10px] text-white/60">متصل بالنظام · يمكنه التنفيذ الفعلي</span>
          </div>
        </div>
        <button onClick={resetChat}
          className="relative p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
          title="محادثة جديدة" data-testid="button-ai-reset">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Quick actions ── */}
      <AnimatePresence>
        {msgs.length === 0 && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="px-3 pt-3 grid grid-cols-2 gap-2 flex-shrink-0">
            {quickActions.map((qa, i) => {
              const Icon = qa.icon;
              return (
                <motion.button key={i}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => sendMessage(qa.msg)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-right text-[11px] font-semibold text-white/75 hover:text-white transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  data-testid={`button-ai-quick-${i}`}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,rgba(14,165,233,0.25),rgba(124,58,237,0.25))" }}>
                    <Icon className="w-3 h-3 text-cyan-400" />
                  </div>
                  <span className="leading-tight">{qa.label}</span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin scrollbar-thumb-white/10 min-h-0">
        <AnimatePresence initial={false}>
          {msgs.map(msg => (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}
            >
              {msg.role === "ai" && (
                <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5"
                  style={{ background: "linear-gradient(135deg,#0ea5e9,#7c3aed)" }}>
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              )}

              <div className={`max-w-[86%] flex flex-col gap-1.5 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`px-3 py-2 rounded-2xl text-[12.5px] leading-relaxed ${msg.role === "user" ? "text-white rounded-tr-sm" : "text-white/90 rounded-tl-sm"}`}
                  style={msg.role === "user"
                    ? { background: "linear-gradient(135deg,#0ea5e9,#2563eb)" }
                    : { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}
                  dangerouslySetInnerHTML={{ __html: renderText(msg.text) }}
                />

                {/* Tool result cards */}
                {msg.action === "TOOL_RESULT" && msg.displayType && (
                  <ToolResultCard
                    displayType={msg.displayType}
                    toolName={msg.allTools?.[0]?.name}
                    data={msg.data}
                    onNavigate={handleNavigate}
                  />
                )}

                {/* Multiple tool results */}
                {msg.action === "TOOL_RESULT" && msg.allTools && msg.allTools.length > 1 && msg.allTools.slice(1).map((t, idx) => (
                  t.displayType && t.data ? (
                    <ToolResultCard key={idx} displayType={t.displayType} toolName={t.name} data={t.data} onNavigate={handleNavigate} />
                  ) : null
                ))}

                {/* Navigate card */}
                {msg.action === "NAVIGATE" && msg.data?.url && (
                  <NavigateCard url={msg.data.url} label={msg.data.label} onNavigate={handleNavigate} />
                )}

                {/* Suggestions */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-0.5">
                    {msg.suggestions.map((s, i) => (
                      <button key={i} onClick={() => sendMessage(s)}
                        className="text-[11px] px-2.5 py-1 rounded-full text-cyan-300 hover:text-white font-semibold transition-all hover:scale-[1.03]"
                        style={{ background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.25)" }}
                        data-testid={`button-ai-suggestion-${i}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5 text-xs"
                  style={{ background: "rgba(255,255,255,0.1)" }}>
                  {cfg.icon}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#0ea5e9,#7c3aed)" }}>
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <div className="px-3 py-1 rounded-2xl rounded-tl-sm" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}>
              <TypingDots />
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="flex-shrink-0 p-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="اسأل أو اطلب تنفيذ أي شيء..."
            disabled={loading}
            className="flex-1 bg-transparent text-white text-[12.5px] outline-none placeholder:text-white/25 min-w-0"
            data-testid="input-ai-message"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
            style={{ background: "linear-gradient(135deg,#0ea5e9,#7c3aed)" }}
            data-testid="button-ai-send">
            {loading
              ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              : <Send className="w-3.5 h-3.5 text-white" style={{ transform: "scaleX(-1)" }} />}
          </motion.button>
        </div>
        <p className="text-center text-[9px] text-white/20 mt-1">QIROX AI · عامل ذكي · متصل بقاعدة البيانات</p>
      </div>
    </div>
  );
}

export default AIPanel;
