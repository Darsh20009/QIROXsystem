import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { QiroxIcon } from "@/components/qirox-brand";
import {
  Sparkles, X, Send, Loader2, Minimize2, ArrowUpRight,
  ExternalLink, Eye, QrCode, Globe, CheckCircle2,
  ShoppingBag, Users, BarChart3, Briefcase, Wallet,
  PhoneCall, ScanFace, Fingerprint, ShieldCheck, Trash2, Hash,
} from "lucide-react";

type ToolArtifact = {
  name: string;
  displayType?: string;
  data?: any;
};

type Msg = {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  artifacts?: ToolArtifact[];
};

const SESSION_KEY = "qirox_companion_session";

function pageContext(path: string, L: boolean): { hint: string; quick: string[] } {
  if (path === "/" || path === "") return {
    hint: L ? "نحن في الواجهة الرئيسية" : "On the homepage",
    quick: L ? ["ما هي QIROX؟", "أريد باقة لمشروعي", "كم تكلف الميزات الإضافية؟"]
              : ["What is QIROX?", "I need a package", "Show extra add-ons pricing"],
  };
  if (path.startsWith("/prices")) return {
    hint: L ? "العميل يتصفح الأسعار" : "Browsing pricing",
    quick: L ? ["أيش الفرق بين الباقات؟", "أنا صاحب مطعم، أيش أنسب لي؟", "أبي AI لمشروعي"]
              : ["Compare packages", "Best for a restaurant?", "Add AI to my project"],
  };
  if (path.startsWith("/order") || path.startsWith("/cart")) return {
    hint: L ? "العميل في طلب جديد — ساعده يكمل بسرعة" : "User is placing an order — help them finish",
    quick: L ? ["كيف أرفع إيصال التحويل؟", "أي طرق الدفع متاحة؟", "متى يبدأ العمل بعد الدفع؟"]
              : ["How to upload receipt?", "Payment methods?", "When does work start?"],
  };
  if (path.startsWith("/auth") || path.startsWith("/login") || path.startsWith("/signup") || path.startsWith("/register")) return {
    hint: L ? "تسجيل/إنشاء حساب — رحب وساعد" : "Auth flow — welcome and help",
    quick: L ? ["كيف أنشئ حسابي؟", "نسيت كلمة المرور", "هل التسجيل مجاني؟"]
              : ["How to register?", "Forgot password", "Is signup free?"],
  };
  if (path.startsWith("/dashboard")) return {
    hint: L ? "العميل في لوحته" : "Client dashboard",
    quick: L ? ["أين مشاريعي؟", "كيف أدفع فاتورة؟", "أبي أضيف ميزة لمشروعي"]
              : ["Where are my projects?", "Pay an invoice", "Add a feature"],
  };
  if (path.startsWith("/admin") || path.startsWith("/employee")) return {
    hint: L ? "لوحة الإدارة/الموظف" : "Admin/Employee panel",
    quick: L ? ["أرني إحصائيات النظام", "اعمل عرض سعر لعميل", "أرسل إشعار لكل العملاء"]
              : ["Show system stats", "Create a quotation", "Send notification to all clients"],
  };
  return {
    hint: `${L ? "الصفحة الحالية" : "Current page"}: ${path}`,
    quick: L ? ["كيف تساعدني؟", "أبي أتواصل مع موظف", "أبي أعرف عن QIROX"]
              : ["How can you help?", "Talk to a human", "About QIROX"],
  };
}

/* ── Rich artifact renderers ── */
function OrdersTable({ data, L }: { data: any; L: boolean }) {
  const orders = data?.orders || [];
  if (!orders.length) return <p className="text-[11px] text-black/50">{L ? "لا توجد طلبات" : "No orders found"}</p>;
  const statusLabel: Record<string, { ar: string; color: string }> = {
    pending: { ar: "معلّق", color: "bg-amber-100 text-amber-700" },
    active: { ar: "نشط", color: "bg-blue-100 text-blue-700" },
    completed: { ar: "مكتمل", color: "bg-emerald-100 text-emerald-700" },
    cancelled: { ar: "ملغي", color: "bg-red-100 text-red-700" },
    on_hold: { ar: "موقوف", color: "bg-gray-100 text-gray-600" },
  };
  return (
    <div className="rounded-xl border border-black/10 overflow-hidden bg-white">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-black/[0.04] border-b border-black/10">
        <ShoppingBag className="w-3 h-3 text-black/60" />
        <span className="text-[10px] font-bold text-black/60">{L ? `الطلبات (${data.count})` : `Orders (${data.count})`}</span>
      </div>
      <div className="divide-y divide-black/5 max-h-48 overflow-y-auto">
        {orders.map((o: any, i: number) => {
          const s = statusLabel[o.status] || { ar: o.status, color: "bg-gray-100 text-gray-600" };
          return (
            <div key={i} className="px-3 py-2 flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold truncate">{o.service}</p>
                <p className="text-[10px] text-black/50 truncate">{o.client}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {o.amount > 0 && <span className="text-[10px] font-mono font-bold">{o.amount.toLocaleString("ar")}</span>}
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${s.color}`}>{L ? s.ar : o.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ClientsTable({ data, L }: { data: any; L: boolean }) {
  const clients = data?.clients || [];
  if (!clients.length) return <p className="text-[11px] text-black/50">{L ? "لا يوجد عملاء" : "No clients"}</p>;
  return (
    <div className="rounded-xl border border-black/10 overflow-hidden bg-white">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-black/[0.04] border-b border-black/10">
        <Users className="w-3 h-3 text-black/60" />
        <span className="text-[10px] font-bold text-black/60">{L ? `العملاء (${data.count})` : `Clients (${data.count})`}</span>
      </div>
      <div className="divide-y divide-black/5 max-h-48 overflow-y-auto">
        {clients.map((c: any, i: number) => (
          <div key={i} className="px-3 py-2 flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold truncate">{c.name}</p>
              <p className="text-[10px] text-black/50 truncate" dir="ltr">{c.email}</p>
            </div>
            {c.phone && <p className="text-[10px] text-black/50 shrink-0 font-mono" dir="ltr">{c.phone}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsCard({ data, L }: { data: any; L: boolean }) {
  const stats = [
    { label: L ? "العملاء" : "Clients", value: data.totalClients, color: "text-blue-600" },
    { label: L ? "الطلبات" : "Orders", value: data.totalOrders, color: "text-purple-600" },
    { label: L ? "نشطة" : "Active", value: data.activeOrders, color: "text-emerald-600" },
    { label: L ? "الإيرادات" : "Revenue", value: `${(data.monthRevenue || 0).toLocaleString("ar")} ر.س`, color: "text-amber-600" },
  ];
  return (
    <div className="rounded-xl border border-black/10 overflow-hidden bg-white">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-black/[0.04] border-b border-black/10">
        <BarChart3 className="w-3 h-3 text-black/60" />
        <span className="text-[10px] font-bold text-black/60">{L ? "إحصائيات المنصة" : "Platform Analytics"}</span>
      </div>
      <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-black/5">
        {stats.map((s, i) => (
          <div key={i} className="px-3 py-2.5 text-center">
            <p className={`text-base font-black ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-black/50 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectsTable({ data, L }: { data: any; L: boolean }) {
  const projects = data?.projects || [];
  if (!projects.length) return <p className="text-[11px] text-black/50">{L ? "لا توجد مشاريع" : "No projects"}</p>;
  return (
    <div className="rounded-xl border border-black/10 overflow-hidden bg-white">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-black/[0.04] border-b border-black/10">
        <Briefcase className="w-3 h-3 text-black/60" />
        <span className="text-[10px] font-bold text-black/60">{L ? `المشاريع (${data.count})` : `Projects (${data.count})`}</span>
      </div>
      <div className="divide-y divide-black/5 max-h-48 overflow-y-auto">
        {projects.map((p: any, i: number) => (
          <div key={i} className="px-3 py-2">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-[11px] font-bold truncate flex-1">{p.name}</p>
              <span className="text-[10px] font-bold text-black/60 shrink-0">{p.progress || 0}%</span>
            </div>
            <div className="w-full bg-black/10 rounded-full h-1">
              <div className="bg-black rounded-full h-1 transition-all" style={{ width: `${p.progress || 0}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WalletCard({ data, L }: { data: any; L: boolean }) {
  return (
    <div className="rounded-xl border border-black/10 overflow-hidden bg-white">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-black/[0.04] border-b border-black/10">
        <Wallet className="w-3 h-3 text-black/60" />
        <span className="text-[10px] font-bold text-black/60">{L ? "محفظة Qirox Pay" : "Qirox Pay Wallet"}</span>
      </div>
      <div className="px-3 py-3 text-center border-b border-black/5">
        <p className="text-2xl font-black text-black">{(data.balance || 0).toLocaleString("ar-SA")} <span className="text-sm font-medium text-black/50">ر.س</span></p>
        <p className="text-[10px] text-black/50 mt-0.5">{data.name}</p>
      </div>
      {data.recent?.length > 0 && (
        <div className="divide-y divide-black/5 max-h-32 overflow-y-auto">
          {data.recent.map((t: any, i: number) => (
            <div key={i} className="px-3 py-1.5 flex items-center justify-between gap-2">
              <p className="text-[10px] truncate flex-1">{t.service}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-mono font-bold">{(t.amount || 0).toLocaleString("ar")}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${t.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>{t.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmployeesTable({ data, L }: { data: any; L: boolean }) {
  const employees = data?.employees || [];
  if (!employees.length) return <p className="text-[11px] text-black/50">{L ? "لا يوجد موظفون" : "No employees"}</p>;
  const roleLabel: Record<string, string> = {
    developer: "مطور", designer: "مصمم", support: "دعم", sales: "مبيعات",
    sales_manager: "مدير مبيعات", accountant: "محاسب", merchant: "تاجر", manager: "مدير", admin: "أدمن",
  };
  return (
    <div className="rounded-xl border border-black/10 overflow-hidden bg-white">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-black/[0.04] border-b border-black/10">
        <Users className="w-3 h-3 text-black/60" />
        <span className="text-[10px] font-bold text-black/60">{L ? `الموظفون (${data.count})` : `Employees (${data.count})`}</span>
      </div>
      <div className="divide-y divide-black/5 max-h-48 overflow-y-auto">
        {employees.map((e: any, i: number) => (
          <div key={i} className="px-3 py-2 flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold truncate flex-1">{e.name}</p>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/5 text-black/60 shrink-0">
              {L ? (roleLabel[e.role] || e.role) : e.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConsultationSubmitted({ data, L }: { data: any; L: boolean }) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3">
      <div className="flex items-center gap-2 mb-1.5">
        <PhoneCall className="w-4 h-4 text-emerald-600" />
        <span className="text-[11px] font-bold text-emerald-800">{L ? "تم إرسال طلب التواصل ✓" : "Consultation request sent ✓"}</span>
      </div>
      <p className="text-[10px] text-emerald-700">{data.clientName} — {data.clientPhone}</p>
      <p className="text-[10px] text-emerald-600 mt-0.5">{data.topic}</p>
    </div>
  );
}

function WebResults({ data, L }: { data: any; L: boolean }) {
  const results = String(data?.results || "").trim();
  if (!results) return null;
  return (
    <div className="rounded-xl border border-black/10 bg-white overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-black/[0.04] border-b border-black/10">
        <Globe className="w-3 h-3 text-black/60" />
        <span className="text-[10px] font-bold text-black/60">{L ? "نتائج البحث" : "Web Results"}</span>
      </div>
      <div className="px-3 py-2 text-[10px] text-black/70 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">{results}</div>
    </div>
  );
}

function FaceBiometricsList({ data, L }: { data: any; L: boolean }) {
  const users: any[] = data?.users || [];
  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-sky-100 border-b border-sky-200">
        <div className="flex items-center gap-1.5">
          <ScanFace className="w-3.5 h-3.5 text-sky-600" />
          <span className="text-[11px] font-bold text-sky-800">{L ? `بصمات الوجه المسجّلة (${data?.total || 0})` : `Registered Face IDs (${data?.total || 0})`}</span>
        </div>
      </div>
      <div className="divide-y divide-sky-100 max-h-48 overflow-y-auto">
        {users.length === 0 ? (
          <p className="px-3 py-3 text-[10px] text-sky-600 text-center">{L ? "لا توجد بصمات مسجّلة" : "No face IDs registered"}</p>
        ) : users.map((u: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between gap-2 px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-full bg-sky-200"><ScanFace className="w-3 h-3 text-sky-700" /></div>
              <div>
                <p className="text-[11px] font-semibold text-sky-900 leading-tight">{u.name}</p>
                <p className="text-[9px] text-sky-500 leading-tight">{u.email} · {u.role}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] bg-sky-200 text-sky-700 px-1.5 py-0.5 rounded-full font-bold">{u.anglesCount} {L ? "زوايا" : "angles"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FaceBiometricUser({ data, L }: { data: any; L: boolean }) {
  return (
    <div className={`rounded-xl border px-3 py-3 ${data?.registered ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
      <div className="flex items-center gap-2 mb-1">
        <ScanFace className={`w-4 h-4 ${data?.registered ? "text-emerald-600" : "text-red-500"}`} />
        <span className={`text-[11px] font-bold ${data?.registered ? "text-emerald-800" : "text-red-700"}`}>
          {data?.registered ? (L ? "بصمة الوجه مسجّلة ✓" : "Face ID registered ✓") : (L ? "لم تُسجَّل بصمة الوجه" : "No face ID registered")}
        </span>
      </div>
      {data?.user && <p className="text-[10px] text-gray-600">{data.user.name} · {data.user.email}</p>}
      {data?.anglesCount > 0 && <p className="text-[10px] text-emerald-600 mt-0.5">{L ? `${data.anglesCount} زوايا محفوظة` : `${data.anglesCount} angles stored`}</p>}
    </div>
  );
}

function FaceBiometricDeleted({ data, L }: { data: any; L: boolean }) {
  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-3 flex items-center gap-2">
      <Trash2 className="w-4 h-4 text-orange-600 flex-shrink-0" />
      <div>
        <p className="text-[11px] font-bold text-orange-800">{L ? "تم حذف بصمة الوجه ✓" : "Face ID deleted ✓"}</p>
        <p className="text-[10px] text-orange-600">{data?.userName}</p>
      </div>
    </div>
  );
}

function BiometricStats({ data, L }: { data: any; L: boolean }) {
  const items = [
    { icon: <ScanFace className="w-4 h-4 text-sky-600" />, label: L ? "بصمة الوجه" : "Face ID", value: data?.faceRecognition || 0, color: "sky" },
    { icon: <Fingerprint className="w-4 h-4 text-violet-600" />, label: L ? "بصمة الإصبع" : "Fingerprint", value: data?.webAuthn || 0, color: "violet" },
    { icon: <Hash className="w-4 h-4 text-orange-600" />, label: L ? "الرمز السريع" : "Quick PIN", value: data?.quickPin || 0, color: "orange" },
  ];
  return (
    <div className="rounded-xl border border-black/10 bg-white overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-black/[0.04] border-b border-black/10">
        <ShieldCheck className="w-3.5 h-3.5 text-black/60" />
        <span className="text-[10px] font-bold text-black/60">{L ? "إحصائيات البيومترية" : "Biometric Stats"}</span>
        <span className="text-[9px] text-black/40 mr-auto">{L ? `${data?.totalUsers || 0} مستخدم` : `${data?.totalUsers || 0} users`}</span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-black/10">
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1 py-3">
            {item.icon}
            <span className="text-lg font-black text-black/80">{item.value}</span>
            <span className="text-[9px] text-black/50 text-center leading-tight">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArtifactRenderer({ artifact, i, k, L, setLocation }: { artifact: ToolArtifact; i: number; k: number; L: boolean; setLocation: (p: string) => void }) {
  const { displayType: dt, data, name } = artifact;

  if (dt === "navigate") {
    const path = data?.path || "/";
    const label = data?.label || path;
    const auto = data?.autoOpen !== false;
    return (
      <button
        onClick={() => setLocation(path)}
        className="w-full flex items-center justify-between gap-2 bg-black text-white hover:bg-black/85 transition rounded-xl px-3 py-2.5 text-xs font-bold group"
        data-testid={`artifact-navigate-${i}-${k}`}
      >
        <span className="flex items-center gap-2">
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>{auto ? (L ? "تم فتح: " : "Opened: ") : (L ? "افتح: " : "Open: ")}{label}</span>
        </span>
        <span className="text-[10px] opacity-60 font-mono">{path}</span>
      </button>
    );
  }

  if (dt === "page_preview") {
    const path = data?.path || "/";
    const title = data?.title || path;
    const height = Math.min(600, Math.max(220, Number(data?.height) || 360));
    return (
      <div className="rounded-xl overflow-hidden border border-black/10 bg-white" data-testid={`artifact-preview-${i}-${k}`}>
        <div className="flex items-center justify-between bg-black/[0.03] px-3 py-1.5 border-b border-black/10">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-black/70">
            <Eye className="w-3 h-3" /><span>{title}</span>
          </div>
          <button onClick={() => setLocation(path)} className="flex items-center gap-1 text-[10px] text-black/55 hover:text-black">
            <ExternalLink className="w-2.5 h-2.5" />{L ? "فتح" : "Open"}
          </button>
        </div>
        <iframe src={path} title={title} style={{ height: `${height}px` }} className="w-full bg-white"
          sandbox="allow-same-origin allow-scripts allow-forms" />
      </div>
    );
  }

  if (dt === "qr_code") {
    const url = data?.imageUrl;
    if (!url) return null;
    return (
      <div className="rounded-xl border border-black/10 bg-white p-3 flex items-center gap-3" data-testid={`artifact-qr-${i}-${k}`}>
        <img src={url} alt={data?.label || "QR"} className="w-24 h-24 rounded-lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-[10px] font-bold text-black/70 mb-1"><QrCode className="w-3 h-3" />{L ? "رمز QR" : "QR Code"}</div>
          {data?.label && <p className="text-[11px] font-medium text-black truncate">{data.label}</p>}
          <p className="text-[10px] text-black/50 truncate" dir="ltr">{data?.source}</p>
        </div>
      </div>
    );
  }

  if (dt === "pages_list" && Array.isArray(data?.pages)) {
    return (
      <div className="rounded-xl border border-black/10 bg-white p-2 grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto" data-testid={`artifact-pages-${i}-${k}`}>
        {data.pages.slice(0, 24).map((p: any, idx: number) => (
          <button key={idx} onClick={() => setLocation(p.path)}
            className="flex flex-col items-start text-left p-1.5 rounded-lg bg-black/[0.03] hover:bg-black hover:text-white transition group">
            <span className="text-[11px] font-bold leading-tight truncate w-full">{p.title}</span>
            <span className="text-[9px] opacity-50 group-hover:opacity-70 font-mono truncate w-full" dir="ltr">{p.path}</span>
          </button>
        ))}
      </div>
    );
  }

  if (dt === "action_success") {
    return (
      <div className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-2 py-1 inline-flex items-center gap-1 font-bold">
        <CheckCircle2 className="w-3 h-3" /> {name}
      </div>
    );
  }

  if (dt === "orders_table") return <OrdersTable data={data} L={L} />;
  if (dt === "clients_table") return <ClientsTable data={data} L={L} />;
  if (dt === "analytics_card") return <AnalyticsCard data={data} L={L} />;
  if (dt === "projects_table") return <ProjectsTable data={data} L={L} />;
  if (dt === "wallet_card") return <WalletCard data={data} L={L} />;
  if (dt === "employees_table") return <EmployeesTable data={data} L={L} />;
  if (dt === "consultation_submitted") return <ConsultationSubmitted data={data} L={L} />;
  if (dt === "web_results") return <WebResults data={data} L={L} />;
  if (dt === "face_biometrics_list") return <FaceBiometricsList data={data} L={L} />;
  if (dt === "face_biometric_user") return <FaceBiometricUser data={data} L={L} />;
  if (dt === "face_biometric_deleted") return <FaceBiometricDeleted data={data} L={L} />;
  if (dt === "biometric_stats") return <BiometricStats data={data} L={L} />;

  if (dt === "generated_image") {
    const url = data?.imageUrl;
    if (!url) return null;
    return (
      <div className="rounded-xl border border-black/10 overflow-hidden" data-testid={`artifact-image-${i}-${k}`}>
        <img
          src={url}
          alt={data?.label || "Generated image"}
          className="w-full max-h-80 object-cover"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <div className="p-2 bg-black/[0.02] border-t border-black/[0.06]">
          <p className="text-[10px] font-semibold text-black/60 truncate">{data?.label}</p>
          {data?.style && <p className="text-[9px] text-black/35 truncate">{L ? "الأسلوب: " : "Style: "}{data.style}</p>}
          <a href={url} download target="_blank" rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold text-black/50 hover:text-black transition-colors">
            ↓ {L ? "تحميل الصورة" : "Download image"}
          </a>
        </div>
      </div>
    );
  }

  return null;
}

export default function QiroxCompanion() {
  const [location, setLocation] = useLocation();
  const { data: user } = useUser();
  const { lang, dir } = useI18n();
  const L = lang === "ar";

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hidden = useMemo(() => {
    const skip = ["/ai-studio", "/ai/", "/employee-role", "/admin/system-map"];
    return skip.some(p => location.startsWith(p));
  }, [location]);

  const ctx = useMemo(() => pageContext(location, L), [location, L]);

  const [sessionId] = useState(() => {
    try {
      const existing = localStorage.getItem(SESSION_KEY);
      if (existing) return existing;
      const id = `qc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(SESSION_KEY, id);
      return id;
    } catch { return `qc_${Date.now()}`; }
  });

  useEffect(() => {
    if (open && msgs.length === 0) {
      const greet = user
        ? (L ? `أهلاً ${user.fullName?.split(" ")[0] || ""} 👋 أنا QIROX Agent — مساعدك الذكي. كيف أقدر أخدمك؟`
              : `Hi ${user.fullName?.split(" ")[0] || ""}! I'm QIROX Agent — your AI assistant. How can I help?`)
        : (L ? "أهلاً بك في QIROX 👋 أنا QIROX Agent — مساعدك الذكي. أساعدك تختار الباقة المناسبة أو أجاوبك عن أي استفسار."
              : "Welcome to QIROX! I'm QIROX Agent — your AI assistant. I'll help you find the right plan or answer any question.");
      setMsgs([{ role: "assistant", content: greet, suggestions: ctx.quick }]);
    }
  }, [open]); // eslint-disable-line

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    setMsgs(m => [...m, { role: "user", content: t }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/ai/message", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `${t}\n\n[${ctx.hint}]`,
          sessionId,
          userId: user?.id,
          userName: user?.fullName,
          userRole: user?.role || "visitor",
        }),
      });
      const data = await res.json();
      const reply = data.reply || data.message || data.content || (L ? "..." : "...");
      const suggestions: string[] = Array.isArray(data.suggestions) ? data.suggestions : [];

      const artifacts: ToolArtifact[] = Array.isArray(data.allTools)
        ? data.allTools
            .filter((t: any) => t.success && t.displayType && t.data)
            .map((t: any) => ({ name: t.name, displayType: t.displayType, data: t.data }))
        : [];

      // Auto-navigate if AI fired navigate_to with autoOpen
      const autoNav = artifacts.find(a => a.displayType === "navigate" && a.data?.autoOpen !== false && a.data?.path);
      if (autoNav) setTimeout(() => setLocation(autoNav.data.path), 700);

      // Legacy NAVIGATE action fallback
      if (data.action === "NAVIGATE" && data?.data?.url && !autoNav) {
        artifacts.push({ name: "navigate_to", displayType: "navigate", data: { path: data.data.url, label: data.data.label, autoOpen: false } });
      }

      setMsgs(m => [...m, { role: "assistant", content: reply, suggestions, artifacts }]);
    } catch {
      setMsgs(m => [...m, { role: "assistant", content: L ? "تعذّر الاتصال بالمساعد. حاول مرة أخرى." : "Connection failed. Try again." }]);
    } finally {
      setBusy(false);
    }
  }

  if (hidden) return null;

  return (
    <>
      {!open && (
        <button
          onClick={() => { setOpen(true); setMinimized(false); }}
          className="fixed z-[60] bottom-20 sm:bottom-6 left-4 sm:left-6 group"
          data-testid="button-open-companion"
          aria-label={L ? "فتح المساعد الذكي" : "Open AI assistant"}
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-white/30 blur-xl group-hover:bg-white/50 transition" />
            <div className="relative w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-2xl border-2 border-black hover:scale-105 transition-transform">
              <QiroxIcon className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-black rounded-full border-2 border-white animate-pulse" />
            </div>
          </div>
        </button>
      )}

      {open && (
        <div
          dir={dir}
          className={`fixed z-[60] bottom-20 sm:bottom-6 left-4 sm:left-6 w-[calc(100vw-2rem)] sm:w-[400px] bg-white border border-black/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all ${
            minimized ? "h-14" : "h-[min(580px,calc(100vh-7rem))]"
          }`}
          data-testid="panel-companion"
        >
          {/* Header */}
          <div className="bg-black text-white px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <QiroxIcon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate flex items-center gap-1.5">
                QIROX Agent <Sparkles className="w-3 h-3 opacity-60" />
              </p>
              <p className="text-[10px] text-white/50 truncate">{ctx.hint}</p>
            </div>
            <button onClick={() => setMinimized(m => !m)} className="p-1.5 hover:bg-white/10 rounded-lg transition" data-testid="button-minimize-companion" aria-label="minimize">
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition" data-testid="button-close-companion" aria-label="close">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {!minimized && (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-black/[0.015]">
                {msgs.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[94%] ${m.role === "user" ? "bg-black text-white" : "bg-white border border-black/10 text-black"} rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words space-y-2`}
                      data-testid={`msg-${m.role}-${i}`}
                    >
                      {m.content && <div>{m.content}</div>}

                      {m.artifacts && m.artifacts.length > 0 && (
                        <div className="space-y-2 mt-1">
                          {m.artifacts.map((a, k) => (
                            <ArtifactRenderer key={k} artifact={a} i={i} k={k} L={L} setLocation={setLocation} />
                          ))}
                        </div>
                      )}

                      {m.suggestions && m.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-black/10">
                          {m.suggestions.slice(0, 4).map((s, j) => (
                            <button
                              key={j}
                              onClick={() => send(s)}
                              className="text-[11px] bg-black/[0.04] hover:bg-black hover:text-white border border-black/10 hover:border-black px-2 py-1 rounded-lg font-medium transition"
                              data-testid={`button-suggestion-${i}-${j}`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {busy && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-black/10 rounded-2xl px-3.5 py-2 text-sm flex items-center gap-2 text-black/40">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {L ? "يفكر..." : "Thinking..."}
                    </div>
                  </div>
                )}
              </div>

              <form
                onSubmit={(e) => { e.preventDefault(); send(input); }}
                className="border-t border-black/10 p-2.5 flex items-end gap-2 bg-white shrink-0"
              >
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
                  }}
                  placeholder={L ? "اكتب سؤالك أو أمرك..." : "Ask anything or give a command..."}
                  rows={1}
                  className="flex-1 resize-none bg-black/[0.04] border border-black/10 focus:border-black focus:bg-white outline-none rounded-xl px-3 py-2 text-sm leading-relaxed max-h-24"
                  data-testid="input-companion"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || busy}
                  className="w-10 h-10 rounded-xl bg-black text-white disabled:bg-black/20 disabled:text-white/50 hover:bg-black/85 transition flex items-center justify-center shrink-0"
                  data-testid="button-send-companion"
                  aria-label="send"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>

              <div className="text-[9px] text-black/30 text-center pb-1.5 bg-white">
                Qirox AI · {L ? "آمن وسريع" : "secure & fast"}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
