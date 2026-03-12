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
  Mail, Plus, Trash2, Loader2, ExternalLink, X,
  Copy, Check, Key, Server, Globe, Inbox,
  CheckCircle2, PauseCircle, AlertCircle, MonitorSmartphone
} from "lucide-react";

type Mailbox = {
  id: string;
  emailAddress: string;
  displayName: string;
  quota: number;
  status: "active" | "suspended" | "deleted";
  mailcowSynced: boolean;
  mailcowError: string;
  createdAt: string;
};

type WebmailData = { url: string };

const MAX_MAILBOXES = 3;

function CopyBtn({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1 text-xs text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 transition-colors rounded px-1.5 py-0.5 hover:bg-black/5 dark:hover:bg-white/5" data-testid={`copy-${value}`}>
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
      {label && <span>{copied ? "تم النسخ" : label}</span>}
    </button>
  );
}

function InfoRow({ icon: Icon, label, value, extra }: { icon: any; label: string; value: string; extra?: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900/50 rounded-xl border border-black/[0.05] dark:border-white/[0.05]">
      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-black/40 dark:text-white/40 mb-0.5">{label}</p>
        <div className="flex items-center gap-1 flex-wrap">
          <code className="text-sm font-mono text-black dark:text-white">{value}</code>
          <CopyBtn value={value} />
        </div>
        {extra && <p className="text-[11px] text-black/30 dark:text-white/30 mt-0.5">{extra}</p>}
      </div>
    </div>
  );
}

export default function EmployeeMailboxes() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ emailLocalPart: "", displayName: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [webmailOpen, setWebmailOpen] = useState(false);
  const [selectedBox, setSelectedBox] = useState<string | null>(null);

  const { data: mailboxes = [], isLoading } = useQuery<Mailbox[]>({ queryKey: ["/api/employee/mailboxes"] });
  const { data: webmailData } = useQuery<WebmailData>({ queryKey: ["/api/employee/mailboxes/webmail-url"] });

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/employee/mailboxes", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/mailboxes"] });
      setForm({ emailLocalPart: "", displayName: "", password: "" });
      setShowForm(false);
      toast({ title: "✅ تم إنشاء صندوق البريد بنجاح" });
    },
    onError: async (err: any) => {
      const msg = await err?.response?.json?.().then((d: any) => d?.error).catch(() => null);
      toast({ title: msg || "فشل إنشاء الصندوق", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/employee/mailboxes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/mailboxes"] });
      toast({ title: "✅ تم حذف الصندوق" });
    },
    onError: () => toast({ title: "فشل الحذف", variant: "destructive" }),
  });

  const activeBoxes = mailboxes.filter(m => m.status !== "deleted");
  const remaining = Math.max(0, MAX_MAILBOXES - activeBoxes.length);
  const canCreate = remaining > 0;
  const webmailUrl = webmailData?.url || "";

  return (
    <div className="relative overflow-hidden min-h-screen bg-white dark:bg-gray-950 p-6" dir="rtl">
      <PageGraphics variant="dashboard" />
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="relative bg-gradient-to-bl from-blue-600/10 via-cyan-500/5 to-transparent border border-black/[0.07] dark:border-white/[0.07] rounded-3xl p-7 overflow-hidden">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-full blur-3xl" />
          <div className="relative flex items-center gap-4 flex-wrap">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Mail className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-black text-black dark:text-white">صناديق البريد الخاصة بي</h1>
              <p className="text-black/40 dark:text-white/40 text-sm">إدارة بريداتك على qiroxstudio.online</p>
            </div>
            <div className="flex items-center gap-2">
              {webmailUrl && (
                <Button
                  onClick={() => setWebmailOpen(!webmailOpen)}
                  variant="outline"
                  data-testid="btn-open-webmail"
                  className="gap-2 rounded-2xl border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold"
                >
                  <MonitorSmartphone className="w-4 h-4" />
                  {webmailOpen ? "إغلاق Webmail" : "فتح Webmail"}
                </Button>
              )}
              {canCreate && (
                <Button onClick={() => setShowForm(!showForm)} data-testid="btn-new-mailbox"
                  className="gap-2 bg-gradient-to-l from-blue-600 to-cyan-500 text-white px-5 h-11 rounded-2xl shadow-lg shadow-blue-500/20 font-bold">
                  <Plus className="w-4 h-4" />
                  بريد جديد
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Quota indicator */}
        <div className="flex items-center gap-3 bg-black/[0.03] dark:bg-white/[0.03] rounded-2xl p-4 border border-black/[0.06] dark:border-white/[0.06]">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                i < activeBoxes.length
                  ? "bg-blue-500 text-white"
                  : "bg-black/[0.06] dark:bg-white/[0.06] text-black/20 dark:text-white/20"
              }`}>
                {i < activeBoxes.length ? <Check className="w-4 h-4" /> : i + 1}
              </div>
            ))}
          </div>
          <div>
            <p className="text-sm font-bold text-black dark:text-white">
              {activeBoxes.length} / {MAX_MAILBOXES} بريدات مستخدمة
            </p>
            <p className="text-xs text-black/40 dark:text-white/40">
              {remaining > 0 ? `متبقي ${remaining} بريد${remaining > 1 ? "ات" : ""}` : "وصلت للحد الأقصى"}
            </p>
          </div>
          {!canCreate && (
            <div className="mr-auto flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-3.5 h-3.5" />
              تواصل مع الأدمن لرفع الحد
            </div>
          )}
        </div>

        {/* Webmail iframe */}
        <AnimatePresence>
          {webmailOpen && webmailUrl && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="border border-black/[0.07] dark:border-white/[0.07] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-black/[0.03] dark:bg-white/[0.03] border-b border-black/[0.05] dark:border-white/[0.05]">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-black dark:text-white">Webmail — SOGo</span>
                </div>
                <div className="flex items-center gap-2">
                  <a href={webmailUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" data-testid="btn-open-webmail-external">
                    <ExternalLink className="w-4 h-4 text-black/40 dark:text-white/40" />
                  </a>
                  <button onClick={() => setWebmailOpen(false)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                    <X className="w-4 h-4 text-black/40 dark:text-white/40" />
                  </button>
                </div>
              </div>
              <iframe
                src={webmailUrl}
                className="w-full border-0"
                style={{ height: "600px" }}
                title="Webmail"
                data-testid="iframe-webmail"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-gradient-to-br from-blue-50/80 to-cyan-50/40 dark:from-blue-900/10 dark:to-cyan-900/5 border border-blue-200 dark:border-blue-800/40 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-500" />
                  <span className="font-bold text-black dark:text-white">إنشاء صندوق بريد جديد</span>
                </div>
                <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                  <X className="w-4 h-4 text-black/40 dark:text-white/40" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label-xs">الجزء المحلي من البريد * (قبل @qiroxstudio.online)</label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={form.emailLocalPart}
                      onChange={e => setForm(f => ({ ...f, emailLocalPart: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, "") }))}
                      placeholder="your.name"
                      dir="ltr"
                      data-testid="input-email-local"
                      className="rounded-xl font-mono flex-1"
                    />
                    <span className="text-sm text-black/40 dark:text-white/40 whitespace-nowrap font-mono">@qiroxstudio.online</span>
                  </div>
                  {form.emailLocalPart && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-mono mt-1">{form.emailLocalPart}@qiroxstudio.online</p>
                  )}
                </div>
                <div>
                  <label className="label-xs">الاسم المعروض</label>
                  <Input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} placeholder="اسمك الكامل" data-testid="input-display-name" className="rounded-xl" />
                </div>
                <div>
                  <label className="label-xs">كلمة المرور *</label>
                  <div className="relative">
                    <Input
                      type={showPass ? "text" : "password"}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="كلمة مرور قوية..."
                      dir="ltr"
                      data-testid="input-password"
                      className="rounded-xl font-mono pl-10"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30">
                      <Key className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" onClick={() => setShowForm(false)} data-testid="btn-cancel" className="rounded-xl">إلغاء</Button>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={!form.emailLocalPart || !form.password || createMutation.isPending}
                  data-testid="btn-create"
                  className="gap-2 bg-gradient-to-l from-blue-600 to-cyan-500 text-white rounded-xl"
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {createMutation.isPending ? "جارٍ الإنشاء..." : "إنشاء الصندوق"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mailboxes List */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" /></div>
        ) : activeBoxes.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center">
              <Inbox className="w-8 h-8 text-black/20 dark:text-white/20" />
            </div>
            <div>
              <p className="font-bold text-black dark:text-white">لا توجد صناديق بريد بعد</p>
              <p className="text-sm text-black/40 dark:text-white/40 mt-1">اضغط "بريد جديد" لإنشاء أول صندوق</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {activeBoxes.map(box => (
              <motion.div key={box.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900/60 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl overflow-hidden"
                data-testid={`mailbox-card-${box.id}`}
              >
                {/* Card Header */}
                <div className="p-5 flex items-center gap-4 flex-wrap">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-black dark:text-white font-mono text-sm" data-testid={`text-email-${box.id}`}>{box.emailAddress}</p>
                      <CopyBtn value={box.emailAddress} />
                    </div>
                    <p className="text-xs text-black/40 dark:text-white/40">{box.displayName} — {box.quota} MB</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`rounded-full text-xs px-2.5 ${
                      box.status === "active" ? "border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
                      : "border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20"
                    }`} data-testid={`badge-${box.id}`}>
                      {box.status === "active" ? "✓ نشط" : "⏸ موقوف"}
                    </Badge>
                    {webmailUrl && box.status === "active" && (
                      <Button size="sm" variant="outline" onClick={() => { setSelectedBox(box.id); setWebmailOpen(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        data-testid={`btn-webmail-${box.id}`}
                        className="rounded-xl text-xs gap-1.5 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        <MonitorSmartphone className="w-3.5 h-3.5" /> فتح الويب ميل
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => { if (confirm(`حذف ${box.emailAddress}؟`)) deleteMutation.mutate(box.id); }}
                      data-testid={`btn-delete-${box.id}`}
                      className="rounded-xl text-xs gap-1.5 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Trash2 className="w-3.5 h-3.5" /> حذف
                    </Button>
                  </div>
                </div>

                {/* Connection Settings */}
                <div className="px-5 pb-5">
                  <div className="border-t border-black/[0.05] dark:border-white/[0.05] pt-4">
                    <p className="text-xs font-semibold text-black/40 dark:text-white/40 mb-3 uppercase tracking-wide">إعدادات الاتصال</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <InfoRow icon={Server} label="IMAP" value="mail.qiroxstudio.online" extra="Port 993 — SSL/TLS" />
                      <InfoRow icon={Server} label="SMTP" value="mail.qiroxstudio.online" extra="Port 587 STARTTLS / 465 SSL" />
                      <InfoRow icon={Server} label="POP3" value="mail.qiroxstudio.online" extra="Port 995 — SSL/TLS" />
                      <InfoRow icon={Key} label="اسم المستخدم" value={box.emailAddress} extra="البريد الكامل كاسم مستخدم" />
                    </div>
                  </div>
                </div>

                {/* Sync warning */}
                {!box.mailcowSynced && (
                  <div className="mx-5 mb-4 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-xl px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>الصندوق لم يُزامن مع Mailcow بعد — تواصل مع الأدمن</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* No webmail configured notice */}
        {!webmailUrl && (
          <div className="flex items-center gap-3 text-sm text-black/40 dark:text-white/40 bg-black/[0.03] dark:bg-white/[0.03] rounded-2xl p-4 border border-black/[0.06] dark:border-white/[0.06]">
            <Globe className="w-4 h-4 flex-shrink-0" />
            <span>خدمة Webmail غير مفعّلة حالياً — تواصل مع الأدمن لإعداد Mailcow</span>
          </div>
        )}

      </div>
      <style>{`.label-xs { display: block; font-size: 11px; color: rgba(0,0,0,0.4); margin-bottom: 4px; font-weight: 500; }.dark .label-xs { color: rgba(255,255,255,0.4); }`}</style>
    </div>
  );
}
