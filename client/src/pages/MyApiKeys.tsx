import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Key, Plus, Copy, Check, Trash2, Power, PowerOff, Eye, EyeOff,
  ShieldCheck, Clock, Activity, Loader2, X, AlertTriangle,
  Terminal, Zap, Lock,
} from "lucide-react";


type ApiKey = {
  id: string;
  name: string;
  projectName: string;
  keyPrefix: string;
  scopes: string[];
  isActive: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  requestCount: number;
  allowedOrigins: string[];
  createdAt: string;
};

const ALL_SCOPES = [
  { id: "orders",    label: "الطلبات",   icon: "📦", desc: "قراءة الطلبات والحالات" },
  { id: "projects",  label: "المشاريع", icon: "🗂️", desc: "بيانات المشاريع والتقدم" },
  { id: "invoices",  label: "الفواتير",  icon: "🧾", desc: "الفواتير والمدفوعات" },
  { id: "stats",     label: "الإحصائيات",icon: "📊", desc: "الإيرادات والتقارير" },
  { id: "wallet",    label: "المحفظة",  icon: "💳", desc: "رصيد المحفظة والحركات" },
  { id: "customers", label: "العملاء",  icon: "👥", desc: "بيانات عملاء المشروع" },
];

function ScopeChip({ scope }: { scope: string }) {
  const s = ALL_SCOPES.find(x => x.id === scope);
  return (
    <span className="inline-flex items-center gap-1 bg-black/[0.05] dark:bg-white/[0.08] text-black/60 dark:text-white/60 text-[10px] font-medium px-2 py-0.5 rounded-full border border-black/[0.06] dark:border-white/[0.06]">
      {s?.icon} {s?.label || scope}
    </span>
  );
}

export default function MyApiKeys() {
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<(ApiKey & { rawKey?: string }) | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Create form state
  const [form, setForm] = useState({
    name: "", projectName: "",
    scopes: ["orders", "projects", "invoices", "stats"] as string[],
    expiresAt: "",
    allowedOrigins: "",
  });

  const { data: keys = [], isLoading } = useQuery<ApiKey[]>({ queryKey: ["/api/my-api-keys"] });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/my-api-keys", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-api-keys"] });
      setShowCreate(false);
      setNewKey(data);
      setForm({ name: "", projectName: "", scopes: ["orders", "projects", "invoices", "stats"], expiresAt: "", allowedOrigins: "" });
    },
    onError: (err: any) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/my-api-keys/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/my-api-keys"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/my-api-keys/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-api-keys"] });
      setDeleteTarget(null);
      toast({ title: "تم إلغاء المفتاح" });
    },
  });

  const copyKey = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleScope = (s: string) => {
    setForm(f => ({
      ...f,
      scopes: f.scopes.includes(s) ? f.scopes.filter(x => x !== s) : [...f.scopes, s],
    }));
  };

  const handleCreate = () => {
    if (!form.name.trim()) { toast({ title: "اسم المفتاح مطلوب", variant: "destructive" }); return; }
    if (form.scopes.length === 0) { toast({ title: "يجب اختيار صلاحية واحدة", variant: "destructive" }); return; }
    createMutation.mutate({
      ...form,
      allowedOrigins: form.allowedOrigins.split(",").map(s => s.trim()).filter(Boolean),
      expiresAt: form.expiresAt || null,
    });
  };

  const baseUrl = window.location.origin;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-black rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="absolute top-0 left-0 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <Key className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">مفاتيح API</h1>
              <p className="text-white/40 text-sm">اربط مشاريعك الخارجية بنظام Qirox بأمان</p>
            </div>
          </div>
          <Button onClick={() => setShowCreate(true)} data-testid="btn-create-key"
            className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl gap-2 h-10">
            <Plus className="w-4 h-4" /> مفتاح جديد
          </Button>
        </div>

        {/* Stats row */}
        <div className="relative z-10 grid grid-cols-3 gap-3 mt-5">
          {[
            { val: keys.length, label: "إجمالي المفاتيح", color: "text-white" },
            { val: keys.filter(k => k.isActive).length, label: "نشط", color: "text-green-400" },
            { val: keys.reduce((s, k) => s + k.requestCount, 0).toLocaleString("ar"), label: "طلب API كلي", color: "text-violet-400" },
          ].map(({ val, label, color }) => (
            <div key={label} className="bg-white/5 rounded-2xl px-4 py-2.5 text-center">
              <p className={`text-xl font-black ${color}`}>{val}</p>
              <p className="text-white/30 text-[10px]">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* API Docs Quick Reference */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="w-4 h-4 text-violet-500" />
          <p className="font-bold text-sm text-black dark:text-white">كيفية الاستخدام</p>
        </div>
        <div className="bg-black rounded-xl p-3 font-mono text-xs text-green-400 overflow-x-auto">
          <p className="text-white/30 mb-1"># أضف المفتاح في رأس الطلب</p>
          <p>Authorization: Bearer qrx_live_xxxxxxxxxx...</p>
          <p className="text-white/30 mt-2 mb-1"># مثال: جلب الطلبات</p>
          <p>GET {baseUrl}/api/v1/orders</p>
          <p className="text-white/30 mt-2 mb-1"># المسارات المتاحة</p>
          {["/api/v1/me", "/api/v1/orders", "/api/v1/projects", "/api/v1/invoices", "/api/v1/stats", "/api/v1/wallet", "/api/v1/customers"].map(p => (
            <p key={p} className="text-blue-400">GET {baseUrl}{p}</p>
          ))}
        </div>
      </motion.div>

      {/* Keys List */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-black/20 dark:text-white/20" /></div>
      ) : keys.length === 0 ? (
        <div className="text-center py-20 border border-black/[0.06] dark:border-white/[0.06] rounded-3xl">
          <Key className="w-12 h-12 mx-auto mb-3 text-black/10 dark:text-white/10" />
          <p className="text-black/40 dark:text-white/40 font-medium">لا توجد مفاتيح API بعد</p>
          <p className="text-black/25 dark:text-white/25 text-sm mt-1">أنشئ مفتاحك الأول لربط مشاريعك بنظام Qirox</p>
          <Button onClick={() => setShowCreate(true)} className="mt-4 rounded-xl gap-2 bg-black hover:bg-black/80 text-white dark:bg-white dark:text-black" data-testid="btn-create-first-key">
            <Plus className="w-4 h-4" /> أنشئ مفتاحاً الآن
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
                      <p className="font-bold text-black dark:text-white text-sm">{key.name}</p>
                      {key.projectName && <span className="text-[10px] bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded-full">{key.projectName}</span>}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${key.isActive ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800" : "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"}`}>
                        {key.isActive ? "نشط" : "معطّل"}
                      </span>
                    </div>
                    {/* Key prefix */}
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-xs text-black/40 dark:text-white/40 font-mono bg-black/[0.04] dark:bg-white/[0.04] px-2 py-0.5 rounded-lg">{key.keyPrefix}</code>
                    </div>
                    {/* Scopes */}
                    <div className="flex flex-wrap gap-1">
                      {key.scopes.map(s => <ScopeChip key={s} scope={s} />)}
                    </div>
                    {/* Meta */}
                    <div className="flex flex-wrap gap-3 text-[10px] text-black/30 dark:text-white/30 mt-2">
                      <span className="flex items-center gap-1"><Activity className="w-3 h-3" />{key.requestCount.toLocaleString("ar")} طلب</span>
                      {key.lastUsedAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />آخر استخدام: {new Date(key.lastUsedAt).toLocaleDateString("ar-SA")}</span>}
                      {key.expiresAt && <span className="flex items-center gap-1"><Lock className="w-3 h-3" />ينتهي: {new Date(key.expiresAt).toLocaleDateString("ar-SA")}</span>}
                    </div>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => toggleMutation.mutate({ id: key.id, isActive: !key.isActive })}
                    data-testid={`btn-toggle-key-${key.id}`}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors border ${key.isActive ? "border-green-200 bg-green-50 hover:bg-green-100 text-green-600 dark:border-green-800 dark:bg-green-950/20 dark:hover:bg-green-950/40 dark:text-green-400" : "border-black/[0.08] bg-black/[0.03] hover:bg-black/[0.06] text-black/30 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white/30"}`}
                    title={key.isActive ? "تعطيل" : "تفعيل"}
                  >
                    {key.isActive ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(key.id)}
                    data-testid={`btn-delete-key-${key.id}`}
                    className="w-8 h-8 rounded-xl flex items-center justify-center border border-black/[0.08] bg-black/[0.03] hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-black/25 transition-colors dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:bg-red-950/20 dark:text-white/25"
                  >
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
        <DialogContent className="max-w-lg rounded-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right font-black text-lg flex items-center gap-2">
              <Key className="w-5 h-5 text-violet-500" /> إنشاء مفتاح API جديد
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-black/40 dark:text-white/40 mb-1.5 block">اسم المفتاح *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: مفتاح متجر Shopify" className="rounded-xl" data-testid="input-key-name" />
            </div>
            <div>
              <label className="text-xs font-bold text-black/40 dark:text-white/40 mb-1.5 block">اسم المشروع (اختياري)</label>
              <Input value={form.projectName} onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))} placeholder="مثال: متجري الإلكتروني" className="rounded-xl" data-testid="input-project-name" />
            </div>

            {/* Scopes */}
            <div>
              <label className="text-xs font-bold text-black/40 dark:text-white/40 mb-2 block">الصلاحيات *</label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_SCOPES.map(s => (
                  <button key={s.id} onClick={() => toggleScope(s.id)} data-testid={`scope-${s.id}`}
                    className={`flex items-center gap-2 rounded-xl p-2.5 border text-right transition-all ${form.scopes.includes(s.id) ? "border-violet-300 bg-violet-50 dark:border-violet-700 dark:bg-violet-950/30" : "border-black/[0.08] bg-black/[0.02] dark:border-white/[0.08] dark:bg-white/[0.02]"}`}>
                    <span className="text-base">{s.icon}</span>
                    <div>
                      <p className={`text-xs font-bold ${form.scopes.includes(s.id) ? "text-violet-700 dark:text-violet-300" : "text-black/60 dark:text-white/60"}`}>{s.label}</p>
                      <p className="text-[10px] text-black/30 dark:text-white/30 leading-tight">{s.desc}</p>
                    </div>
                    {form.scopes.includes(s.id) && <Check className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 mr-auto" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-black/40 dark:text-white/40 mb-1.5 block">تاريخ الانتهاء (اختياري)</label>
                <Input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} className="rounded-xl" dir="ltr" data-testid="input-expires" />
              </div>
              <div>
                <label className="text-xs font-bold text-black/40 dark:text-white/40 mb-1.5 block">النطاقات المسموحة</label>
                <Input value={form.allowedOrigins} onChange={e => setForm(f => ({ ...f, allowedOrigins: e.target.value }))} placeholder="example.com,shop.com" className="rounded-xl" dir="ltr" data-testid="input-origins" />
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-3 flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-amber-700 dark:text-amber-400 text-xs">المفتاح يُعرض مرة واحدة فقط عند الإنشاء. احفظه في مكان آمن فوراً.</p>
            </div>

            <Button onClick={handleCreate} disabled={createMutation.isPending} data-testid="btn-confirm-create"
              className="w-full h-11 rounded-2xl bg-black hover:bg-black/80 dark:bg-white dark:text-black gap-2 font-bold">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              إنشاء المفتاح
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Key Reveal Dialog */}
      <Dialog open={!!newKey} onOpenChange={() => setNewKey(null)}>
        <DialogContent className="max-w-md rounded-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right font-black text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" /> مفتاحك الجديد جاهز!
            </DialogTitle>
          </DialogHeader>
          {newKey && (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-3 flex gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-amber-700 dark:text-amber-400 text-xs font-semibold">انسخ المفتاح الآن — لن يُعرض مجدداً أبداً بعد إغلاق هذه النافذة.</p>
              </div>
              <div className="bg-black rounded-2xl p-4">
                <p className="text-[10px] text-white/30 mb-2 font-mono">API KEY</p>
                <p className="font-mono text-green-400 text-sm break-all leading-relaxed" data-testid="text-raw-key">{newKey.rawKey}</p>
              </div>
              <Button onClick={() => copyKey(newKey.rawKey || "")} data-testid="btn-copy-key"
                className={`w-full h-11 rounded-2xl gap-2 font-bold transition-all ${copied ? "bg-green-600 hover:bg-green-600 text-white" : "bg-black hover:bg-black/80 dark:bg-white dark:text-black text-white"}`}>
                {copied ? <><Check className="w-4 h-4" /> تم النسخ!</> : <><Copy className="w-4 h-4" /> انسخ المفتاح</>}
              </Button>
              <p className="text-center text-xs text-black/30 dark:text-white/30">أضفه في رأس الطلب: <code className="bg-black/[0.06] dark:bg-white/[0.06] px-1.5 py-0.5 rounded">Authorization: Bearer YOUR_KEY</code></p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm rounded-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right font-black text-lg text-red-600">تأكيد الحذف</DialogTitle>
          </DialogHeader>
          <p className="text-black/60 dark:text-white/60 text-sm">سيُحذف المفتاح نهائياً ولن تتمكن من استخدامه للوصول للـ API. هذا الإجراء لا يمكن التراجع عنه.</p>
          <div className="flex gap-2 mt-2">
            <Button onClick={() => deleteMutation.mutate(deleteTarget!)} disabled={deleteMutation.isPending}
              className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white gap-2" data-testid="btn-confirm-delete">
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              حذف المفتاح
            </Button>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl">إلغاء</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
