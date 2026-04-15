import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Key, Plus, Copy, Check, Trash2, Power, PowerOff,
  ShieldCheck, Clock, Activity, Loader2, AlertTriangle,
  Terminal, Zap, Lock, Webhook, Code2, Globe,
  ExternalLink, Send, MonitorSmartphone, LayoutDashboard,
  CheckCircle2, XCircle, Radio,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type ApiKey = {
  id: string; name: string; projectName: string; keyPrefix: string;
  scopes: string[]; isActive: boolean; expiresAt: string | null;
  lastUsedAt: string | null; requestCount: number;
  allowedOrigins: string[]; createdAt: string;
};

type WebhookDoc = {
  id: string; label: string; url: string; events: string[];
  secret: string; isActive: boolean; lastDeliveredAt: string | null;
  lastError: string | null; deliveryCount: number; failCount: number;
};

type EmbedToken = {
  id: string; label: string; tokenPrefix: string;
  allowedOrigins: string[]; isActive: boolean;
  lastUsedAt: string | null; useCount: number;
  expiresAt: string | null; createdAt: string;
};

// ── Constants ────────────────────────────────────────────────────────────────
const ALL_SCOPES_DATA = [
  { id: "orders",        icon: "📦", ar: "الطلبات",        en: "Orders",        arD: "قراءة الطلبات والحالات",                enD: "Read orders and statuses" },
  { id: "projects",      icon: "🗂️", ar: "المشاريع",       en: "Projects",      arD: "بيانات المشاريع والتقدم",               enD: "Project data and progress" },
  { id: "invoices",      icon: "🧾", ar: "الفواتير",       en: "Invoices",      arD: "الفواتير والمدفوعات",                   enD: "Invoices and payments" },
  { id: "stats",         icon: "📊", ar: "الإحصائيات",    en: "Statistics",    arD: "الإيرادات والتقارير",                   enD: "Revenue and reports" },
  { id: "wallet",        icon: "💳", ar: "المحفظة",        en: "Wallet",        arD: "رصيد المحفظة والحركات",                 enD: "Wallet balance and transactions" },
  { id: "customers",     icon: "👥", ar: "العملاء",        en: "Customers",     arD: "بيانات عملاء المشروع",                  enD: "Project customer data" },
  { id: "subscriptions", icon: "⚡", ar: "الاشتراكات",    en: "Subscriptions", arD: "حالة الاشتراك والتجديد",                enD: "Subscription status and renewal" },
  { id: "support",       icon: "🎧", ar: "الدعم",          en: "Support",       arD: "تذاكر خدمة العملاء",                   enD: "Customer support tickets" },
  { id: "files",         icon: "📁", ar: "الملفات",        en: "Files",         arD: "رفع وتنزيل ملفات المشروع",              enD: "Upload and download project files" },
  { id: "notifications", icon: "🔔", ar: "الإشعارات",     en: "Notifications", arD: "إرسال واستقبال الإشعارات",              enD: "Send and receive notifications" },
];

const WEBHOOK_EVENTS_DATA = [
  { id: "order.created",       icon: "📦", ar: "طلب جديد",           en: "New Order" },
  { id: "order.updated",       icon: "🔄", ar: "تحديث طلب",          en: "Order Updated" },
  { id: "order.completed",     icon: "✅", ar: "اكتمال طلب",         en: "Order Completed" },
  { id: "order.cancelled",     icon: "❌", ar: "إلغاء طلب",          en: "Order Cancelled" },
  { id: "project.updated",     icon: "🗂️", ar: "تحديث مشروع",       en: "Project Updated" },
  { id: "invoice.created",     icon: "🧾", ar: "فاتورة جديدة",       en: "Invoice Created" },
  { id: "invoice.paid",        icon: "💰", ar: "دفع فاتورة",         en: "Invoice Paid" },
  { id: "wallet.topup",        icon: "💳", ar: "شحن محفظة",          en: "Wallet Top-up" },
  { id: "support.message",     icon: "🎧", ar: "رسالة دعم",          en: "Support Message" },
  { id: "subscription.renewed",icon: "⚡", ar: "تجديد اشتراك",       en: "Subscription Renewed" },
  { id: "subscription.expired",icon: "⏰", ar: "انتهاء اشتراك",      en: "Subscription Expired" },
];

// ── Small helpers ─────────────────────────────────────────────────────────────
function ScopeChip({ scope, L }: { scope: string; L: boolean }) {
  const s = ALL_SCOPES_DATA.find(x => x.id === scope);
  return (
    <span className="inline-flex items-center gap-1 bg-black/[0.05] dark:bg-white/[0.08] text-black/60 dark:text-white/60 text-[10px] font-medium px-2 py-0.5 rounded-full border border-black/[0.06] dark:border-white/[0.06]">
      {s?.icon} {s ? (L ? s.ar : s.en) : scope}
    </span>
  );
}

function EventChip({ event, L }: { event: string; L: boolean }) {
  const e = WEBHOOK_EVENTS_DATA.find(x => x.id === event);
  return (
    <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 text-[10px] font-medium px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
      {e?.icon} {e ? (L ? e.ar : e.en) : event}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function MyApiKeys() {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";

  const [tab, setTab] = useState<"keys" | "webhooks" | "embed">("keys");

  const tabs = [
    { id: "keys",     icon: Key,             label: L ? "مفاتيح API" : "API Keys" },
    { id: "webhooks", icon: Webhook,          label: L ? "Webhooks" : "Webhooks" },
    { id: "embed",    icon: LayoutDashboard,  label: L ? "تضمين اللوحة" : "Embed Dashboard" },
  ] as const;

  return (
    <div className="space-y-5" dir={dir}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-black rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="absolute top-0 left-0 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <Code2 className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">{L ? "مركز المطوّرين" : "Developer Center"}</h1>
            <p className="text-white/40 text-sm">{L ? "مفاتيح API، Webhooks، وتضمين لوحة تحكمك في مواقعك" : "API Keys, Webhooks, and embed your dashboard in your sites"}</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-1.5">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              data-testid={`tab-${t.id}`}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${
                tab === t.id
                  ? "bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm border border-black/[0.06] dark:border-white/[0.06]"
                  : "text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60"
              }`}>
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === "keys"     && <ApiKeysTab key="keys"     L={L} dir={dir} toast={toast} />}
        {tab === "webhooks" && <WebhooksTab key="webhooks" L={L} dir={dir} toast={toast} />}
        {tab === "embed"    && <EmbedTab   key="embed"    L={L} dir={dir} toast={toast} />}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: API KEYS
// ══════════════════════════════════════════════════════════════════════════════
function ApiKeysTab({ L, dir, toast }: { L: boolean; dir: string; toast: any }) {
  const ALL_SCOPES = ALL_SCOPES_DATA.map(s => ({ ...s, label: L ? s.ar : s.en, desc: L ? s.arD : s.enD }));

  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey]       = useState<(ApiKey & { rawKey?: string }) | null>(null);
  const [copied, setCopied]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", projectName: "", scopes: ["orders","projects","invoices","stats"] as string[], expiresAt: "", allowedOrigins: "" });

  const { data: keys = [], isLoading } = useQuery<ApiKey[]>({ queryKey: ["/api/my-api-keys"] });

  const createMutation = useMutation({
    mutationFn: async (data: any) => (await apiRequest("POST", "/api/my-api-keys", data)).json(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-api-keys"] });
      setShowCreate(false); setNewKey(data);
      setForm({ name: "", projectName: "", scopes: ["orders","projects","invoices","stats"], expiresAt: "", allowedOrigins: "" });
    },
    onError: (err: any) => toast({ title: L ? "خطأ" : "Error", description: err.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => (await apiRequest("PATCH", `/api/my-api-keys/${id}`, { isActive })).json(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/my-api-keys"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/my-api-keys/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/my-api-keys"] }); setDeleteTarget(null); toast({ title: L ? "تم إلغاء المفتاح" : "API Key deleted" }); },
  });

  const copyKey = (text: string) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const toggleScope = (s: string) => setForm(f => ({ ...f, scopes: f.scopes.includes(s) ? f.scopes.filter(x => x !== s) : [...f.scopes, s] }));

  const baseUrl = window.location.origin;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      {/* Quick guide */}
      <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="w-4 h-4 text-violet-500" />
          <p className="font-bold text-sm">{L ? "كيفية الاستخدام" : "Usage Guide"}</p>
        </div>
        <div className="bg-black rounded-xl p-3 font-mono text-xs text-green-400 overflow-x-auto space-y-1">
          <p className="text-white/30">{L ? "# أضف المفتاح في رأس الطلب" : "# Add the key in the request header"}</p>
          <p>Authorization: Bearer qrx_live_xxxxxxxxxx...</p>
          <p className="text-white/30 mt-2">{L ? "# المسارات المتاحة (GET)" : "# Available endpoints (GET)"}</p>
          {["/api/v1/me","/api/v1/orders","/api/v1/projects","/api/v1/invoices","/api/v1/stats","/api/v1/wallet","/api/v1/customers"].map(p => (
            <p key={p} className="text-blue-400">{baseUrl}{p}</p>
          ))}
        </div>
      </div>

      {/* Stats + create */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-3">
          {[
            { val: keys.length, label: L ? "إجمالي" : "Total", color: "text-black dark:text-white" },
            { val: keys.filter(k => k.isActive).length, label: L ? "نشط" : "Active", color: "text-green-600 dark:text-green-400" },
            { val: keys.reduce((s, k) => s + k.requestCount, 0).toLocaleString(), label: L ? "طلب API" : "API Calls", color: "text-violet-600 dark:text-violet-400" },
          ].map(({ val, label, color }) => (
            <div key={label} className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-3 py-2 text-center">
              <p className={`text-base font-black ${color}`}>{val}</p>
              <p className="text-black/30 dark:text-white/30 text-[10px]">{label}</p>
            </div>
          ))}
        </div>
        <Button onClick={() => setShowCreate(true)} data-testid="btn-create-key"
          className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl gap-2 h-9 text-sm">
          <Plus className="w-4 h-4" /> {L ? "مفتاح جديد" : "New Key"}
        </Button>
      </div>

      {/* Keys list */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-black/20 dark:text-white/20" /></div>
      ) : keys.length === 0 ? (
        <div className="text-center py-16 border border-black/[0.06] dark:border-white/[0.06] rounded-3xl">
          <Key className="w-10 h-10 mx-auto mb-3 text-black/10 dark:text-white/10" />
          <p className="text-black/40 dark:text-white/40 font-medium text-sm">{L ? "لا توجد مفاتيح API بعد" : "No API keys yet"}</p>
          <Button onClick={() => setShowCreate(true)} className="mt-4 rounded-xl gap-2 bg-black hover:bg-black/80 text-white dark:bg-white dark:text-black text-sm" data-testid="btn-create-first-key">
            <Plus className="w-4 h-4" /> {L ? "أنشئ مفتاحاً الآن" : "Create Now"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((key, i) => (
            <motion.div key={key.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              data-testid={`card-api-key-${key.id}`}
              className={`bg-white dark:bg-gray-900 border rounded-2xl p-4 transition-all ${key.isActive ? "border-black/[0.07] dark:border-white/[0.07]" : "border-black/[0.04] dark:border-white/[0.04] opacity-60"}`}>
              <div className="flex items-start gap-3 justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${key.isActive ? "bg-violet-100 dark:bg-violet-950/40" : "bg-black/[0.04] dark:bg-white/[0.04]"}`}>
                    <Key className={`w-4 h-4 ${key.isActive ? "text-violet-600 dark:text-violet-400" : "text-black/20 dark:text-white/20"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-sm">{key.name}</p>
                      {key.projectName && <span className="text-[10px] bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded-full">{key.projectName}</span>}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${key.isActive ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800" : "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"}`}>
                        {key.isActive ? (L ? "نشط" : "Active") : (L ? "معطّل" : "Disabled")}
                      </span>
                    </div>
                    <code className="text-xs text-black/40 dark:text-white/40 font-mono bg-black/[0.04] dark:bg-white/[0.04] px-2 py-0.5 rounded-lg block w-fit mb-2">{key.keyPrefix}</code>
                    <div className="flex flex-wrap gap-1 mb-2">{key.scopes.map(s => <ScopeChip key={s} scope={s} L={L} />)}</div>
                    <div className="flex flex-wrap gap-3 text-[10px] text-black/30 dark:text-white/30">
                      <span className="flex items-center gap-1"><Activity className="w-3 h-3" />{key.requestCount.toLocaleString()} {L ? "طلب" : "calls"}</span>
                      {key.lastUsedAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(key.lastUsedAt).toLocaleDateString(L ? "ar-SA" : "en-US")}</span>}
                      {key.expiresAt && <span className="flex items-center gap-1"><Lock className="w-3 h-3" />{new Date(key.expiresAt).toLocaleDateString(L ? "ar-SA" : "en-US")}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => toggleMutation.mutate({ id: key.id, isActive: !key.isActive })} data-testid={`btn-toggle-key-${key.id}`}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors border ${key.isActive ? "border-green-200 bg-green-50 hover:bg-green-100 text-green-600 dark:border-green-800 dark:bg-green-950/20 dark:text-green-400" : "border-black/[0.08] bg-black/[0.03] hover:bg-black/[0.06] text-black/30 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white/30"}`}>
                    {key.isActive ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => setDeleteTarget(key.id)} data-testid={`btn-delete-key-${key.id}`}
                    className="w-8 h-8 rounded-xl flex items-center justify-center border border-black/[0.08] bg-black/[0.03] hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-black/25 transition-colors dark:border-white/[0.08] dark:bg-white/[0.03]">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg rounded-3xl" dir={dir}>
          <DialogHeader>
            <DialogTitle className="font-black text-lg flex items-center gap-2">
              <Key className="w-5 h-5 text-violet-500" /> {L ? "إنشاء مفتاح API جديد" : "Create New API Key"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-black/40 dark:text-white/40 mb-1.5 block">{L ? "اسم المفتاح *" : "Key Name *"}</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={L ? "مثال: مفتاح متجري" : "e.g. My Store Key"} className="rounded-xl" data-testid="input-key-name" />
              </div>
              <div>
                <label className="text-xs font-bold text-black/40 dark:text-white/40 mb-1.5 block">{L ? "اسم المشروع (اختياري)" : "Project Name (optional)"}</label>
                <Input value={form.projectName} onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))} placeholder={L ? "متجري الإلكتروني" : "My Online Store"} className="rounded-xl" data-testid="input-project-name" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-black/40 dark:text-white/40 mb-2 block">{L ? "الصلاحيات *" : "Scopes *"}</label>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {ALL_SCOPES.map(s => (
                  <button key={s.id} onClick={() => toggleScope(s.id)} data-testid={`scope-${s.id}`}
                    className={`flex items-center gap-2 rounded-xl p-2.5 border text-right transition-all ${form.scopes.includes(s.id) ? "border-violet-300 bg-violet-50 dark:border-violet-700 dark:bg-violet-950/30" : "border-black/[0.08] bg-black/[0.02] dark:border-white/[0.08] dark:bg-white/[0.02]"}`}>
                    <span className="text-base">{s.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold ${form.scopes.includes(s.id) ? "text-violet-700 dark:text-violet-300" : "text-black/60 dark:text-white/60"}`}>{s.label}</p>
                      <p className="text-[10px] text-black/30 dark:text-white/30 leading-tight truncate">{s.desc}</p>
                    </div>
                    {form.scopes.includes(s.id) && <Check className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-black/40 dark:text-white/40 mb-1.5 block">{L ? "تاريخ الانتهاء (اختياري)" : "Expiry Date (optional)"}</label>
                <Input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} className="rounded-xl" dir="ltr" data-testid="input-expires" />
              </div>
              <div>
                <label className="text-xs font-bold text-black/40 dark:text-white/40 mb-1.5 block">{L ? "النطاقات المسموحة" : "Allowed Origins"}</label>
                <Input value={form.allowedOrigins} onChange={e => setForm(f => ({ ...f, allowedOrigins: e.target.value }))} placeholder="example.com, shop.com" className="rounded-xl" dir="ltr" data-testid="input-origins" />
              </div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-3 flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-amber-700 dark:text-amber-400 text-xs">{L ? "المفتاح يُعرض مرة واحدة فقط عند الإنشاء. احفظه فوراً." : "The key is shown only once upon creation. Save it immediately."}</p>
            </div>
            <Button onClick={() => {
              if (!form.name.trim()) { toast({ title: L ? "اسم المفتاح مطلوب" : "Key name required", variant: "destructive" }); return; }
              if (!form.scopes.length) { toast({ title: L ? "اختر صلاحية واحدة" : "Select at least one scope", variant: "destructive" }); return; }
              createMutation.mutate({ ...form, allowedOrigins: form.allowedOrigins.split(",").map(s => s.trim()).filter(Boolean), expiresAt: form.expiresAt || null });
            }} disabled={createMutation.isPending} data-testid="btn-confirm-create"
              className="w-full h-11 rounded-2xl bg-black hover:bg-black/80 dark:bg-white dark:text-black gap-2 font-bold">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {L ? "إنشاء المفتاح" : "Create Key"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Key Reveal */}
      <Dialog open={!!newKey} onOpenChange={() => setNewKey(null)}>
        <DialogContent className="max-w-md rounded-3xl" dir={dir}>
          <DialogHeader>
            <DialogTitle className="font-black text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" /> {L ? "مفتاحك الجديد جاهز!" : "Your New Key is Ready!"}
            </DialogTitle>
          </DialogHeader>
          {newKey && (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-3 flex gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-amber-700 dark:text-amber-400 text-xs font-semibold">{L ? "انسخ المفتاح الآن — لن يُعرض مجدداً." : "Copy the key now — it will never be shown again."}</p>
              </div>
              <div className="bg-black rounded-2xl p-4">
                <p className="text-[10px] text-white/30 mb-2 font-mono">API KEY</p>
                <p className="font-mono text-green-400 text-sm break-all leading-relaxed" data-testid="text-raw-key">{newKey.rawKey}</p>
              </div>
              <Button onClick={() => copyKey(newKey.rawKey || "")} data-testid="btn-copy-key"
                className={`w-full h-11 rounded-2xl gap-2 font-bold ${copied ? "bg-green-600 hover:bg-green-600 text-white" : "bg-black hover:bg-black/80 dark:bg-white dark:text-black text-white"}`}>
                {copied ? <><Check className="w-4 h-4" /> {L ? "تم النسخ!" : "Copied!"}</> : <><Copy className="w-4 h-4" /> {L ? "انسخ المفتاح" : "Copy Key"}</>}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm rounded-3xl" dir={dir}>
          <DialogHeader>
            <DialogTitle className="font-black text-lg text-red-600">{L ? "تأكيد الحذف" : "Confirm Deletion"}</DialogTitle>
          </DialogHeader>
          <p className="text-black/60 dark:text-white/60 text-sm">{L ? "سيُحذف المفتاح نهائياً." : "The key will be permanently deleted."}</p>
          <div className="flex gap-2 mt-2">
            <Button onClick={() => deleteMutation.mutate(deleteTarget!)} disabled={deleteMutation.isPending}
              className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white gap-2" data-testid="btn-confirm-delete">
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {L ? "حذف" : "Delete"}
            </Button>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl">{L ? "إلغاء" : "Cancel"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: WEBHOOKS
// ══════════════════════════════════════════════════════════════════════════════
function WebhooksTab({ L, dir, toast }: { L: boolean; dir: string; toast: any }) {
  const EVENTS = WEBHOOK_EVENTS_DATA.map(e => ({ ...e, label: L ? e.ar : e.en }));

  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  const [form, setForm] = useState({ label: "", url: "", events: ["order.created"] as string[], secret: "" });

  const { data: hooks = [], isLoading } = useQuery<WebhookDoc[]>({ queryKey: ["/api/my-webhooks"] });

  const createMutation = useMutation({
    mutationFn: async (data: any) => (await apiRequest("POST", "/api/my-webhooks", data)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-webhooks"] });
      setShowCreate(false);
      setForm({ label: "", url: "", events: ["order.created"], secret: "" });
      toast({ title: L ? "تم إنشاء الـ Webhook" : "Webhook created" });
    },
    onError: (err: any) => toast({ title: L ? "خطأ" : "Error", description: err.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => (await apiRequest("PATCH", `/api/my-webhooks/${id}`, { isActive })).json(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/my-webhooks"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/my-webhooks/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/my-webhooks"] }); setDeleteTarget(null); toast({ title: L ? "تم حذف الـ Webhook" : "Webhook deleted" }); },
  });

  const testWebhook = async (id: string) => {
    setTesting(id);
    try {
      const res = await apiRequest("POST", `/api/my-webhooks/${id}/test`);
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/my-webhooks"] });
      toast({ title: data.success ? (L ? "✅ الاختبار نجح!" : "✅ Test successful!") : (L ? "❌ الاختبار فشل" : "❌ Test failed"), description: data.success ? `HTTP ${data.status}` : data.error });
    } catch (e: any) {
      toast({ title: L ? "خطأ في الاتصال" : "Connection error", description: e.message, variant: "destructive" });
    } finally {
      setTesting(null);
    }
  };

  const toggleEvent = (e: string) => setForm(f => ({ ...f, events: f.events.includes(e) ? f.events.filter(x => x !== e) : [...f.events, e] }));

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      {/* Info banner */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex gap-3">
        <Radio className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-1">{L ? "ما هي Webhooks؟" : "What are Webhooks?"}</p>
          <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">{L ? "Webhooks تُرسل إشعاراً تلقائياً لنظامك عند حدوث أحداث معينة في Qirox — مثل إنشاء طلب جديد أو دفع فاتورة. نظامك يستقبلها فوراً دون الحاجة لـ polling." : "Webhooks send an automatic notification to your system when specific events occur in Qirox — like a new order or invoice payment. Your system receives them instantly without polling."}</p>
        </div>
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="font-bold text-sm">{hooks.length} {L ? "Webhook مُسجّل" : "Webhooks registered"}</p>
        <Button onClick={() => setShowCreate(true)} data-testid="btn-create-webhook"
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl gap-2 h-9 text-sm">
          <Plus className="w-4 h-4" /> {L ? "Webhook جديد" : "New Webhook"}
        </Button>
      </div>

      {/* Hooks list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-black/20 dark:text-white/20" /></div>
      ) : hooks.length === 0 ? (
        <div className="text-center py-14 border border-black/[0.06] dark:border-white/[0.06] rounded-3xl">
          <Webhook className="w-10 h-10 mx-auto mb-3 text-black/10 dark:text-white/10" />
          <p className="text-black/40 dark:text-white/40 font-medium text-sm">{L ? "لا توجد Webhooks بعد" : "No Webhooks yet"}</p>
          <Button onClick={() => setShowCreate(true)} className="mt-4 rounded-xl gap-2 bg-black hover:bg-black/80 text-white dark:bg-white dark:text-black text-sm" data-testid="btn-create-first-webhook">
            <Plus className="w-4 h-4" /> {L ? "أنشئ Webhook الآن" : "Create Now"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {hooks.map((hook, i) => (
            <motion.div key={hook.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              data-testid={`card-webhook-${hook.id}`}
              className={`bg-white dark:bg-gray-900 border rounded-2xl p-4 transition-all ${hook.isActive ? "border-black/[0.07] dark:border-white/[0.07]" : "border-black/[0.04] dark:border-white/[0.04] opacity-60"}`}>
              <div className="flex items-start gap-3 justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${hook.isActive ? "bg-blue-100 dark:bg-blue-950/40" : "bg-black/[0.04] dark:bg-white/[0.04]"}`}>
                    <Webhook className={`w-4 h-4 ${hook.isActive ? "text-blue-600 dark:text-blue-400" : "text-black/20 dark:text-white/20"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-sm">{hook.label}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${hook.isActive ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800" : "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400"}`}>
                        {hook.isActive ? (L ? "نشط" : "Active") : (L ? "معطّل" : "Disabled")}
                      </span>
                    </div>
                    <code className="text-xs text-black/40 dark:text-white/40 font-mono bg-black/[0.04] dark:bg-white/[0.04] px-2 py-0.5 rounded-lg block w-fit mb-2 truncate max-w-full">{hook.url}</code>
                    <div className="flex flex-wrap gap-1 mb-2">{hook.events.map(e => <EventChip key={e} event={e} L={L} />)}</div>
                    <div className="flex flex-wrap gap-3 text-[10px] text-black/30 dark:text-white/30">
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" />{hook.deliveryCount} {L ? "ناجح" : "delivered"}</span>
                      {hook.failCount > 0 && <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-500" />{hook.failCount} {L ? "فشل" : "failed"}</span>}
                      {hook.lastDeliveredAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(hook.lastDeliveredAt).toLocaleDateString(L ? "ar-SA" : "en-US")}</span>}
                      {hook.lastError && <span className="text-red-400 truncate max-w-32">{hook.lastError}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => testWebhook(hook.id)} data-testid={`btn-test-webhook-${hook.id}`} disabled={testing === hook.id}
                    className="w-8 h-8 rounded-xl flex items-center justify-center border border-black/[0.08] bg-black/[0.03] hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 text-black/25 transition-colors dark:border-white/[0.08] dark:bg-white/[0.03] disabled:opacity-50"
                    title={L ? "اختبر الـ Webhook" : "Test Webhook"}>
                    {testing === hook.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => toggleMutation.mutate({ id: hook.id, isActive: !hook.isActive })} data-testid={`btn-toggle-webhook-${hook.id}`}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors border ${hook.isActive ? "border-green-200 bg-green-50 hover:bg-green-100 text-green-600 dark:border-green-800 dark:bg-green-950/20 dark:text-green-400" : "border-black/[0.08] bg-black/[0.03] hover:bg-black/[0.06] text-black/30 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white/30"}`}>
                    {hook.isActive ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => setDeleteTarget(hook.id)} data-testid={`btn-delete-webhook-${hook.id}`}
                    className="w-8 h-8 rounded-xl flex items-center justify-center border border-black/[0.08] bg-black/[0.03] hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-black/25 transition-colors dark:border-white/[0.08] dark:bg-white/[0.03]">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg rounded-3xl" dir={dir}>
          <DialogHeader>
            <DialogTitle className="font-black text-lg flex items-center gap-2">
              <Webhook className="w-5 h-5 text-blue-500" /> {L ? "إنشاء Webhook جديد" : "Create New Webhook"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-black/40 dark:text-white/40 mb-1.5 block">{L ? "الاسم *" : "Label *"}</label>
              <Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder={L ? "مثال: Webhook نظام المخزون" : "e.g. Inventory System Webhook"} className="rounded-xl" data-testid="input-webhook-label" />
            </div>
            <div>
              <label className="text-xs font-bold text-black/40 dark:text-white/40 mb-1.5 block">{L ? "رابط الاستقبال (URL) *" : "Endpoint URL *"}</label>
              <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://my-system.com/webhook/qirox" className="rounded-xl font-mono text-sm" dir="ltr" data-testid="input-webhook-url" />
            </div>
            <div>
              <label className="text-xs font-bold text-black/40 dark:text-white/40 mb-2 block">{L ? "الأحداث *" : "Events *"}</label>
              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                {EVENTS.map(e => (
                  <button key={e.id} onClick={() => toggleEvent(e.id)} data-testid={`event-${e.id}`}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 border text-right text-xs transition-all ${form.events.includes(e.id) ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300" : "border-black/[0.08] bg-black/[0.02] dark:border-white/[0.08] text-black/60 dark:text-white/60"}`}>
                    <span>{e.icon}</span>
                    <span className="font-medium flex-1">{e.label}</span>
                    {form.events.includes(e.id) && <Check className="w-3 h-3 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-black/40 dark:text-white/40 mb-1.5 block">{L ? "Secret للتوقيع (اختياري)" : "Signing Secret (optional)"}</label>
              <Input value={form.secret} onChange={e => setForm(f => ({ ...f, secret: e.target.value }))} placeholder={L ? "للتحقق من هوية الطلبات الواردة" : "For verifying incoming requests"} className="rounded-xl font-mono text-sm" dir="ltr" data-testid="input-webhook-secret" />
              <p className="text-[10px] text-black/30 dark:text-white/30 mt-1">{L ? "سنرسل رأس X-Qirox-Signature مع كل طلب لو أدخلت Secret" : "We'll send X-Qirox-Signature header with each request if you enter a secret"}</p>
            </div>
            <Button onClick={() => {
              if (!form.label.trim()) { toast({ title: L ? "الاسم مطلوب" : "Label required", variant: "destructive" }); return; }
              if (!form.url.trim() || !form.url.startsWith("http")) { toast({ title: L ? "رابط URL صحيح مطلوب" : "Valid URL required", variant: "destructive" }); return; }
              if (!form.events.length) { toast({ title: L ? "اختر حدثاً واحداً" : "Select at least one event", variant: "destructive" }); return; }
              createMutation.mutate(form);
            }} disabled={createMutation.isPending} data-testid="btn-confirm-create-webhook"
              className="w-full h-11 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white gap-2 font-bold">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Webhook className="w-4 h-4" />}
              {L ? "إنشاء الـ Webhook" : "Create Webhook"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm rounded-3xl" dir={dir}>
          <DialogHeader><DialogTitle className="font-black text-lg text-red-600">{L ? "تأكيد الحذف" : "Confirm Deletion"}</DialogTitle></DialogHeader>
          <p className="text-black/60 dark:text-white/60 text-sm">{L ? "سيُحذف الـ Webhook نهائياً." : "The webhook will be permanently deleted."}</p>
          <div className="flex gap-2 mt-2">
            <Button onClick={() => deleteMutation.mutate(deleteTarget!)} disabled={deleteMutation.isPending} className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white gap-2" data-testid="btn-confirm-delete-webhook">
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} {L ? "حذف" : "Delete"}
            </Button>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl">{L ? "إلغاء" : "Cancel"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: EMBED DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function EmbedTab({ L, dir, toast }: { L: boolean; dir: string; toast: any }) {
  const [showCreate, setShowCreate] = useState(false);
  const [newToken, setNewToken] = useState<(EmbedToken & { rawToken?: string }) | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({ label: "", allowedOrigins: "", expiresAt: "" });

  const { data: tokens = [], isLoading } = useQuery<EmbedToken[]>({ queryKey: ["/api/my-embed-tokens"] });

  const createMutation = useMutation({
    mutationFn: async (data: any) => (await apiRequest("POST", "/api/my-embed-tokens", data)).json(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-embed-tokens"] });
      setShowCreate(false); setNewToken(data);
      setForm({ label: "", allowedOrigins: "", expiresAt: "" });
    },
    onError: (err: any) => toast({ title: L ? "خطأ" : "Error", description: err.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => (await apiRequest("PATCH", `/api/my-embed-tokens/${id}`, { isActive })).json(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/my-embed-tokens"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/my-embed-tokens/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/my-embed-tokens"] }); setDeleteTarget(null); toast({ title: L ? "تم حذف الرمز" : "Embed token deleted" }); },
  });

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const baseUrl = window.location.origin;
  const getIframeCode = (token: string) =>
    `<iframe\n  src="${baseUrl}/embed?token=${token}"\n  width="100%"\n  height="700"\n  frameborder="0"\n  allow="clipboard-write"\n  style="border-radius:16px;border:none;"\n></iframe>`;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      {/* Explainer */}
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20 border border-violet-200 dark:border-violet-800 rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center flex-shrink-0">
            <MonitorSmartphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-black text-violet-900 dark:text-violet-200 mb-1">{L ? "لوحة تحكم Qirox في موقعك" : "Qirox Dashboard in Your Website"}</h3>
            <p className="text-sm text-violet-700 dark:text-violet-400 leading-relaxed">{L ? "ضع لوحة تحكمك الكاملة داخل موقعك بسطر كود واحد. عملاؤك يتابعون طلباتهم ومشاريعهم وفواتيرهم مباشرةً في موقعك دون الدخول لـ Qirox." : "Embed your complete control panel inside your website with a single line of code. Your clients track their orders, projects, and invoices directly on your site."}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {[L ? "🔐 مصادقة آمنة" : "🔐 Secure auth", L ? "📱 متجاوب" : "📱 Responsive", L ? "🌙 دعم الوضع الداكن" : "🌙 Dark mode", L ? "🌐 عربي + إنجليزي" : "🌐 AR + EN"].map(f => (
                <span key={f} className="text-[11px] bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-2.5 py-1 rounded-full font-medium">{f}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { step: "1", icon: Key, color: "text-violet-600", bg: "bg-violet-100 dark:bg-violet-950/40", title: L ? "أنشئ رمز تضمين" : "Create Embed Token", desc: L ? "رمز آمن خاص بموقعك" : "Secure token for your site" },
          { step: "2", icon: Code2, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-950/40", title: L ? "انسخ كود الـ Iframe" : "Copy Iframe Code", desc: L ? "سطر HTML واحد فقط" : "Just one HTML line" },
          { step: "3", icon: Globe, color: "text-green-600", bg: "bg-green-100 dark:bg-green-950/40", title: L ? "الصقه في موقعك" : "Paste in Your Site", desc: L ? "اللوحة تظهر فوراً" : "Dashboard appears instantly" },
        ].map(({ step, icon: Icon, color, bg, title, desc }) => (
          <div key={step} className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-3 text-center">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-[10px] text-black/30 dark:text-white/30 font-bold mb-0.5">{L ? `الخطوة ${step}` : `Step ${step}`}</p>
            <p className="text-xs font-bold text-black dark:text-white">{title}</p>
            <p className="text-[10px] text-black/40 dark:text-white/40 mt-0.5">{desc}</p>
          </div>
        ))}
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="font-bold text-sm">{tokens.length} {L ? "رمز تضمين" : "embed tokens"}</p>
        <Button onClick={() => setShowCreate(true)} data-testid="btn-create-embed-token"
          className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl gap-2 h-9 text-sm">
          <Plus className="w-4 h-4" /> {L ? "رمز جديد" : "New Token"}
        </Button>
      </div>

      {/* Tokens list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-black/20 dark:text-white/20" /></div>
      ) : tokens.length === 0 ? (
        <div className="text-center py-14 border border-black/[0.06] dark:border-white/[0.06] rounded-3xl">
          <LayoutDashboard className="w-10 h-10 mx-auto mb-3 text-black/10 dark:text-white/10" />
          <p className="text-black/40 dark:text-white/40 font-medium text-sm">{L ? "لا توجد رموز تضمين بعد" : "No embed tokens yet"}</p>
          <Button onClick={() => setShowCreate(true)} className="mt-4 rounded-xl gap-2 bg-black hover:bg-black/80 text-white dark:bg-white dark:text-black text-sm" data-testid="btn-create-first-embed-token">
            <Plus className="w-4 h-4" /> {L ? "أنشئ رمز التضمين الأول" : "Create First Token"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tokens.map((token, i) => (
            <motion.div key={token.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              data-testid={`card-embed-token-${token.id}`}
              className={`bg-white dark:bg-gray-900 border rounded-2xl p-4 transition-all ${token.isActive ? "border-black/[0.07] dark:border-white/[0.07]" : "border-black/[0.04] dark:border-white/[0.04] opacity-60"}`}>
              <div className="flex items-start gap-3 justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${token.isActive ? "bg-violet-100 dark:bg-violet-950/40" : "bg-black/[0.04] dark:bg-white/[0.04]"}`}>
                    <LayoutDashboard className={`w-4 h-4 ${token.isActive ? "text-violet-600 dark:text-violet-400" : "text-black/20 dark:text-white/20"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-sm">{token.label}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${token.isActive ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                        {token.isActive ? (L ? "نشط" : "Active") : (L ? "معطّل" : "Disabled")}
                      </span>
                    </div>
                    <code className="text-xs text-black/40 dark:text-white/40 font-mono bg-black/[0.04] dark:bg-white/[0.04] px-2 py-0.5 rounded-lg block w-fit mb-2">{token.tokenPrefix}</code>
                    {token.allowedOrigins.length > 0 && (
                      <p className="text-[10px] text-black/30 dark:text-white/30 mb-1">{L ? "النطاقات:" : "Origins:"} {token.allowedOrigins.join(", ")}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-[10px] text-black/30 dark:text-white/30">
                      <span className="flex items-center gap-1"><Activity className="w-3 h-3" />{token.useCount} {L ? "استخدام" : "uses"}</span>
                      {token.lastUsedAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(token.lastUsedAt).toLocaleDateString(L ? "ar-SA" : "en-US")}</span>}
                      {token.expiresAt && <span className="flex items-center gap-1"><Lock className="w-3 h-3" />{new Date(token.expiresAt).toLocaleDateString(L ? "ar-SA" : "en-US")}</span>}
                    </div>
                    {/* Iframe preview link */}
                    <a href={`${baseUrl}/embed?tokenId=${token.id}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-violet-600 dark:text-violet-400 hover:underline mt-2 font-medium">
                      <ExternalLink className="w-3 h-3" /> {L ? "معاينة اللوحة" : "Preview Dashboard"}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => toggleMutation.mutate({ id: token.id, isActive: !token.isActive })} data-testid={`btn-toggle-embed-${token.id}`}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors border ${token.isActive ? "border-green-200 bg-green-50 hover:bg-green-100 text-green-600 dark:border-green-800 dark:bg-green-950/20 dark:text-green-400" : "border-black/[0.08] bg-black/[0.03] hover:bg-black/[0.06] text-black/30"}`}>
                    {token.isActive ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => setDeleteTarget(token.id)} data-testid={`btn-delete-embed-${token.id}`}
                    className="w-8 h-8 rounded-xl flex items-center justify-center border border-black/[0.08] bg-black/[0.03] hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-black/25 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Token Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md rounded-3xl" dir={dir}>
          <DialogHeader>
            <DialogTitle className="font-black text-lg flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-violet-500" /> {L ? "إنشاء رمز تضمين جديد" : "Create New Embed Token"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-black/40 dark:text-white/40 mb-1.5 block">{L ? "اسم الرمز" : "Token Label"}</label>
              <Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder={L ? "مثال: موقع شركتي الرئيسي" : "e.g. Main Company Website"} className="rounded-xl" data-testid="input-embed-label" />
            </div>
            <div>
              <label className="text-xs font-bold text-black/40 dark:text-white/40 mb-1.5 block">{L ? "النطاقات المسموحة (اختياري)" : "Allowed Origins (optional)"}</label>
              <Input value={form.allowedOrigins} onChange={e => setForm(f => ({ ...f, allowedOrigins: e.target.value }))} placeholder="mycompany.com, app.mycompany.com" className="rounded-xl" dir="ltr" data-testid="input-embed-origins" />
              <p className="text-[10px] text-black/30 dark:text-white/30 mt-1">{L ? "اتركه فارغاً للسماح لأي نطاق" : "Leave empty to allow any origin"}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-black/40 dark:text-white/40 mb-1.5 block">{L ? "تاريخ الانتهاء (اختياري)" : "Expiry Date (optional)"}</label>
              <Input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} className="rounded-xl" dir="ltr" data-testid="input-embed-expires" />
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-3 flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-amber-700 dark:text-amber-400 text-xs">{L ? "الرمز يُعرض مرة واحدة فقط. احفظه في متغيرات البيئة في موقعك." : "The token is shown once only. Save it in your site's environment variables."}</p>
            </div>
            <Button onClick={() => createMutation.mutate({ label: form.label || undefined, allowedOrigins: form.allowedOrigins.split(",").map(s => s.trim()).filter(Boolean), expiresAt: form.expiresAt || null })}
              disabled={createMutation.isPending} data-testid="btn-confirm-create-embed"
              className="w-full h-11 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white gap-2 font-bold">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LayoutDashboard className="w-4 h-4" />}
              {L ? "إنشاء رمز التضمين" : "Create Embed Token"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Token Reveal + iframe code */}
      <Dialog open={!!newToken} onOpenChange={() => setNewToken(null)}>
        <DialogContent className="max-w-lg rounded-3xl" dir={dir}>
          <DialogHeader>
            <DialogTitle className="font-black text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" /> {L ? "رمز التضمين جاهز!" : "Embed Token Ready!"}
            </DialogTitle>
          </DialogHeader>
          {newToken && (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-3 flex gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-amber-700 dark:text-amber-400 text-xs font-semibold">{L ? "انسخ الرمز الآن — لن يُعرض مجدداً. استخدمه في الكود أدناه." : "Copy the token now — it won't be shown again. Use it in the code below."}</p>
              </div>

              {/* Raw token */}
              <div>
                <p className="text-xs font-bold text-black/40 dark:text-white/40 mb-1.5">{L ? "الرمز السري" : "Secret Token"}</p>
                <div className="bg-black rounded-xl p-3 flex items-center gap-2">
                  <code className="text-green-400 font-mono text-xs flex-1 break-all" data-testid="text-raw-embed-token">{newToken.rawToken}</code>
                  <button onClick={() => copyText(newToken.rawToken!, "raw")} className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/60">
                    {copiedId === "raw" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Iframe code */}
              <div>
                <p className="text-xs font-bold text-black/40 dark:text-white/40 mb-1.5">{L ? "كود الـ Iframe — الصقه في موقعك" : "Iframe Code — Paste in your site"}</p>
                <div className="bg-black rounded-xl p-3 relative">
                  <pre className="text-blue-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap" data-testid="text-iframe-code">{getIframeCode(newToken.rawToken || "")}</pre>
                  <button onClick={() => copyText(getIframeCode(newToken.rawToken || ""), "iframe")}
                    className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/60">
                    {copiedId === "iframe" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <Button onClick={() => setNewToken(null)} className="w-full h-10 rounded-xl bg-black hover:bg-black/80 dark:bg-white dark:text-black text-white font-bold">
                {L ? "تم — أغلق" : "Done — Close"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm rounded-3xl" dir={dir}>
          <DialogHeader><DialogTitle className="font-black text-lg text-red-600">{L ? "تأكيد الحذف" : "Confirm Deletion"}</DialogTitle></DialogHeader>
          <p className="text-black/60 dark:text-white/60 text-sm">{L ? "سيُبطل هذا الرمز نهائياً ولن يعمل الـ iframe بعد ذلك." : "This token will be permanently revoked and the iframe will stop working."}</p>
          <div className="flex gap-2 mt-2">
            <Button onClick={() => deleteMutation.mutate(deleteTarget!)} disabled={deleteMutation.isPending} className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white gap-2" data-testid="btn-confirm-delete-embed">
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} {L ? "إلغاء الرمز" : "Revoke"}
            </Button>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl">{L ? "إلغاء" : "Cancel"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
