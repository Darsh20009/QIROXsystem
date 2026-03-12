import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import {
  Mail, Plus, Trash2, Loader2, Search, X, ChevronDown,
  Server, Copy, Check, AlertCircle, CheckCircle2, PauseCircle,
  RefreshCw, Users, Inbox, Key, Globe
} from "lucide-react";

type Mailbox = {
  id: string;
  ownerUserId: string;
  ownerName: string;
  emailAddress: string;
  displayName: string;
  quota: number;
  status: "active" | "suspended" | "deleted";
  mailcowSynced: boolean;
  mailcowError: string;
  notes: string;
  createdAt: string;
};

type Employee = {
  id: string;
  name: string;
  email: string;
  role: string;
};

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors" data-testid={`copy-${value}`}>
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-black/30 dark:text-white/30" />}
    </button>
  );
}

export default function AdminMailboxes() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ownerUserId: "", emailLocalPart: "", displayName: "", password: "", quota: 3072, notes: "" });
  const [showPass, setShowPass] = useState(false);

  const { data: mailboxes = [], isLoading } = useQuery<Mailbox[]>({ queryKey: ["/api/admin/mailboxes"] });
  const { data: employees = [] } = useQuery<Employee[]>({ queryKey: ["/api/admin/users"] });

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/mailboxes", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mailboxes"] });
      setForm({ ownerUserId: "", emailLocalPart: "", displayName: "", password: "", quota: 3072, notes: "" });
      setShowForm(false);
      toast({ title: "✅ تم إنشاء الصندوق بنجاح" });
    },
    onError: async (err: any) => {
      const msg = await err?.response?.json?.().then((d: any) => d?.error).catch(() => null);
      toast({ title: msg || "فشل الإنشاء", variant: "destructive" });
    },
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiRequest("PATCH", `/api/admin/mailboxes/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mailboxes"] });
      toast({ title: "✅ تم تحديث الحالة" });
    },
    onError: () => toast({ title: "فشل التحديث", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/mailboxes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mailboxes"] });
      toast({ title: "✅ تم حذف الصندوق" });
    },
    onError: () => toast({ title: "فشل الحذف", variant: "destructive" }),
  });

  const filtered = mailboxes.filter(m =>
    m.emailAddress.includes(search.toLowerCase()) ||
    m.ownerName.toLowerCase().includes(search.toLowerCase()) ||
    m.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const staffList = (employees as any[]).filter((e: any) => ["admin", "manager", "developer", "designer", "sales", "support", "content", "hr"].includes(e.role));

  const active = mailboxes.filter(m => m.status === "active").length;
  const suspended = mailboxes.filter(m => m.status === "suspended").length;
  const synced = mailboxes.filter(m => m.mailcowSynced).length;

  return (
    <div className="relative overflow-hidden min-h-screen bg-white dark:bg-gray-950 p-6" dir="rtl">
      <PageGraphics variant="dashboard" />
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="relative bg-gradient-to-bl from-orange-500/10 via-red-500/5 to-transparent border border-black/[0.07] dark:border-white/[0.07] rounded-3xl p-7 overflow-hidden">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-gradient-to-br from-orange-500/20 to-red-500/10 rounded-full blur-3xl" />
          <div className="relative flex items-center gap-4 flex-wrap">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Mail className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-black text-black dark:text-white">إدارة صناديق البريد</h1>
              <p className="text-black/40 dark:text-white/40 text-sm">إنشاء وإدارة بريدات الموظفين على qiroxstudio.online</p>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              data-testid="btn-new-mailbox"
              className="gap-2 bg-gradient-to-l from-orange-500 to-red-500 text-white px-5 h-11 rounded-2xl shadow-lg shadow-orange-500/20 font-bold"
            >
              <Plus className="w-4 h-4" />
              صندوق جديد
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "إجمالي الصناديق", value: mailboxes.length, icon: Inbox, color: "text-blue-500", bg: "from-blue-500/10 to-cyan-500/5" },
            { label: "نشطة", value: active, icon: CheckCircle2, color: "text-green-500", bg: "from-green-500/10 to-emerald-500/5" },
            { label: "موقوفة", value: suspended, icon: PauseCircle, color: "text-amber-500", bg: "from-amber-500/10 to-yellow-500/5" },
            { label: "مزامنة Mailcow", value: synced, icon: RefreshCw, color: "text-purple-500", bg: "from-purple-500/10 to-violet-500/5" },
          ].map((s, i) => (
            <div key={i} className={`bg-gradient-to-br ${s.bg} border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4`}>
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-xs text-black/40 dark:text-white/40">{s.label}</span>
              </div>
              <p className="text-2xl font-black text-black dark:text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Create Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-gradient-to-br from-orange-50/80 to-red-50/40 dark:from-orange-900/10 dark:to-red-900/5 border border-orange-200 dark:border-orange-800/40 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-orange-500" />
                  <span className="font-bold text-black dark:text-white">إنشاء صندوق بريد جديد</span>
                </div>
                <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                  <X className="w-4 h-4 text-black/40 dark:text-white/40" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-xs">الموظف المالك *</label>
                  <select
                    value={form.ownerUserId}
                    onChange={e => { const emp = staffList.find((s: any) => s.id === e.target.value); setForm(f => ({ ...f, ownerUserId: e.target.value, displayName: emp?.name || f.displayName })); }}
                    data-testid="select-mailbox-owner"
                    className="w-full h-10 px-3 rounded-xl border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-gray-900 text-black dark:text-white text-sm"
                  >
                    <option value="">اختر موظفاً...</option>
                    {staffList.map((e: any) => (
                      <option key={e.id} value={e.id}>{e.name} ({e.email})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-xs">الجزء المحلي من البريد * (قبل @qiroxstudio.online)</label>
                  <div className="flex items-center gap-1">
                    <Input
                      value={form.emailLocalPart}
                      onChange={e => setForm(f => ({ ...f, emailLocalPart: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, "") }))}
                      placeholder="john.doe"
                      dir="ltr"
                      data-testid="input-email-local"
                      className="rounded-xl font-mono"
                    />
                    <span className="text-xs text-black/40 dark:text-white/40 whitespace-nowrap">@qiroxstudio.online</span>
                  </div>
                </div>
                <div>
                  <label className="label-xs">الاسم المعروض</label>
                  <Input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} placeholder="مثال: محمد أحمد" data-testid="input-display-name" className="rounded-xl" />
                </div>
                <div>
                  <label className="label-xs">كلمة المرور *</label>
                  <div className="relative">
                    <Input type={showPass ? "text" : "password"} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="كلمة مرور قوية..." dir="ltr" data-testid="input-mailbox-password" className="rounded-xl font-mono pl-10" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60">
                      <Key className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label-xs">الحصة التخزينية (MB)</label>
                  <Input type="number" value={form.quota} onChange={e => setForm(f => ({ ...f, quota: +e.target.value }))} data-testid="input-quota" className="rounded-xl" />
                </div>
                <div>
                  <label className="label-xs">ملاحظات</label>
                  <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="ملاحظات اختيارية..." data-testid="input-notes" className="rounded-xl" />
                </div>
              </div>
              {form.emailLocalPart && (
                <p className="text-xs text-black/50 dark:text-white/50 font-mono bg-black/[0.04] dark:bg-white/[0.04] rounded-lg px-3 py-2">
                  البريد الكامل: <strong className="text-orange-600 dark:text-orange-400">{form.emailLocalPart}@qiroxstudio.online</strong>
                </p>
              )}
              <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" onClick={() => setShowForm(false)} data-testid="btn-cancel-mailbox" className="rounded-xl">إلغاء</Button>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={!form.ownerUserId || !form.emailLocalPart || !form.password || createMutation.isPending}
                  data-testid="btn-create-mailbox"
                  className="gap-2 bg-gradient-to-l from-orange-500 to-red-500 text-white rounded-xl"
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {createMutation.isPending ? "جارٍ الإنشاء..." : "إنشاء الصندوق"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 dark:text-white/30" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="البحث بالبريد أو الاسم..." data-testid="input-search-mailboxes" className="pr-10 rounded-2xl" />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center">
              <Mail className="w-8 h-8 text-black/20 dark:text-white/20" />
            </div>
            <p className="text-black/40 dark:text-white/40 font-medium">{search ? "لا توجد نتائج" : "لا توجد صناديق بعد"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(box => (
              <motion.div key={box.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900/60 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-5"
                data-testid={`mailbox-row-${box.id}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="font-bold text-black dark:text-white text-sm font-mono truncate" data-testid={`text-email-${box.id}`}>{box.emailAddress}</p>
                        <CopyBtn value={box.emailAddress} />
                      </div>
                      <p className="text-xs text-black/40 dark:text-white/40">{box.displayName} — {box.ownerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`rounded-full text-xs font-medium px-2.5 ${
                      box.status === "active" ? "border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
                      : box.status === "suspended" ? "border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20"
                      : "border-black/10 text-black/40"
                    }`} data-testid={`badge-status-${box.id}`}>
                      {box.status === "active" ? "نشط" : box.status === "suspended" ? "موقوف" : "محذوف"}
                    </Badge>
                    <Badge variant="outline" className={`rounded-full text-xs px-2.5 ${
                      box.mailcowSynced ? "border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                      : "border-black/10 text-black/30"
                    }`}>
                      {box.mailcowSynced ? "✓ Mailcow" : "⚠ غير مزامن"}
                    </Badge>
                    <span className="text-xs text-black/30 dark:text-white/30">{box.quota} MB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {box.status === "active" && (
                      <Button size="sm" variant="outline" onClick={() => patchMutation.mutate({ id: box.id, status: "suspended" })} data-testid={`btn-suspend-${box.id}`} className="rounded-xl text-xs gap-1.5 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                        <PauseCircle className="w-3.5 h-3.5" /> تعليق
                      </Button>
                    )}
                    {box.status === "suspended" && (
                      <Button size="sm" variant="outline" onClick={() => patchMutation.mutate({ id: box.id, status: "active" })} data-testid={`btn-activate-${box.id}`} className="rounded-xl text-xs gap-1.5 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20">
                        <CheckCircle2 className="w-3.5 h-3.5" /> تفعيل
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => { if (confirm(`حذف ${box.emailAddress}؟`)) deleteMutation.mutate(box.id); }} data-testid={`btn-delete-${box.id}`} className="rounded-xl text-xs gap-1.5 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Trash2 className="w-3.5 h-3.5" /> حذف
                    </Button>
                  </div>
                </div>
                {box.mailcowError && !box.mailcowSynced && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-xl px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="font-mono truncate">{box.mailcowError}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* IMAP / SMTP Info Card */}
        <div className="bg-gradient-to-br from-blue-50/60 to-cyan-50/30 dark:from-blue-900/10 dark:to-cyan-900/5 border border-blue-200 dark:border-blue-800/40 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-blue-500" />
            <span className="font-bold text-black dark:text-white text-sm">إعدادات الاتصال العامة (IMAP / SMTP)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "IMAP Server", value: "mail.qiroxstudio.online", extra: "Port: 993 (SSL)" },
              { label: "SMTP Server", value: "mail.qiroxstudio.online", extra: "Port: 587 (STARTTLS) / 465 (SSL)" },
              { label: "POP3 Server", value: "mail.qiroxstudio.online", extra: "Port: 995 (SSL)" },
              { label: "Webmail", value: "https://mail.qiroxstudio.online", extra: "SOGo / Roundcube" },
            ].map((row, i) => (
              <div key={i} className="bg-white dark:bg-gray-900/60 rounded-xl p-3 flex items-center gap-3 border border-black/[0.05] dark:border-white/[0.05]">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-black/40 dark:text-white/40 mb-0.5">{row.label}</p>
                  <div className="flex items-center gap-1">
                    <code className="text-sm font-mono text-black dark:text-white">{row.value}</code>
                    <CopyBtn value={row.value} />
                  </div>
                  <p className="text-xs text-black/30 dark:text-white/30">{row.extra}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
      <style>{`.label-xs { display: block; font-size: 11px; color: rgba(0,0,0,0.4); margin-bottom: 4px; font-weight: 500; }.dark .label-xs { color: rgba(255,255,255,0.4); }`}</style>
    </div>
  );
}
