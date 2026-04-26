import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Mail, Send, Inbox, Trash2, RefreshCw, Loader2,
  ChevronLeft, ChevronRight, Search, X, Pencil, Paperclip,
  Reply, AlertCircle, Star, Archive, Tag, Settings,
  MailOpen, SendHorizonal, FileText, ShieldAlert,
  Copy, Check, MonitorSmartphone, Smartphone, ExternalLink,
} from "lucide-react";
import qiroxLogo from "@assets/qirox_without_background_1771716363944.png";

interface MailAccount {
  id: string;
  emailAddress: string;
  displayName: string;
  jobTitle: string;
  isShared: boolean;
  sharedWith: string[];
}

interface EmailMessage {
  uid: number;
  subject: string;
  from: string;
  to: string;
  date: string | null;
  seen: boolean;
  html: string;
  text: string;
  snippet: string;
  folder: string;
}

interface AttachmentFile {
  name: string;
  type: string;
  size: number;
  data: string;
  preview?: string;
}

const ACCOUNT_COLORS = [
  "bg-violet-600", "bg-blue-600", "bg-emerald-600",
  "bg-rose-600", "bg-amber-600", "bg-cyan-600", "bg-indigo-600",
];

function getAccountColor(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = (hash * 31 + email.charCodeAt(i)) & 0xffffffff;
  return ACCOUNT_COLORS[Math.abs(hash) % ACCOUNT_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatDate(date: string | null, ar = true): string {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
  if (diffHours < 24) return d.toLocaleTimeString(ar ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" });
  if (diffHours < 24 * 7) return d.toLocaleDateString(ar ? "ar-SA" : "en-US", { weekday: "short" });
  return d.toLocaleDateString(ar ? "ar-SA" : "en-US", { day: "numeric", month: "short" });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

const FOLDER_ICONS: Record<string, any> = {
  INBOX: Inbox,
  Sent: SendHorizonal,
  Drafts: FileText,
  Trash: Trash2,
  Junk: ShieldAlert,
  Spam: ShieldAlert,
  Archive: Archive,
};

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }
  return (
    <button onClick={copy} className="ml-1 p-1 rounded hover:bg-white/[0.08] transition shrink-0" title="نسخ">
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-white/30 hover:text-white/60" />}
    </button>
  );
}

function OutlookSetupModal({ account, onClose, L }: { account: MailAccount; onClose: () => void; L: boolean }) {
  const [tab, setTab] = useState<"desktop" | "mobile">("desktop");

  const settings = {
    email: account.emailAddress,
    imapServer: "server222.web-hosting.com",
    imapPort: "993",
    imapSecurity: "SSL / TLS",
    smtpServer: "server222.web-hosting.com",
    smtpPort: "465",
    smtpSecurity: "SSL / TLS",
  };

  function Row({ label, value }: { label: string; value: string }) {
    return (
      <div className="flex items-center justify-between gap-4 py-2.5 border-b border-white/[0.07] last:border-0">
        <span className="text-[11px] text-white/45 w-24 shrink-0">{label}</span>
        <span className="text-[12px] font-mono font-semibold text-white flex-1 text-start" dir="ltr">{value}</span>
        <CopyBtn value={value} />
      </div>
    );
  }

  function Step({ n, text }: { n: number; text: string }) {
    return (
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-[10px] font-black text-violet-400 shrink-0 mt-0.5">{n}</div>
        <p className="text-[12px] text-white/70 leading-relaxed flex-1">{text}</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir={L ? "rtl" : "ltr"}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#111827] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden border border-white/[0.08] max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#0078D4]/20 border border-[#0078D4]/30 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
              <rect x="1" y="6" width="14" height="12" rx="1.5" fill="#0078D4" />
              <rect x="9" y="3" width="14" height="12" rx="1.5" fill="#0F6CBD" opacity="0.85" />
              <text x="3.5" y="14.5" fontSize="7" fontWeight="bold" fill="white">O</text>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-black text-white">{L ? "إعداد Outlook" : "Outlook Setup"}</h3>
            <p className="text-[10px] text-white/35 font-mono truncate" dir="ltr">{account.emailAddress}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.07] transition">
            <X className="w-4 h-4 text-white/40" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-5 pt-3 gap-2 shrink-0">
          <button
            onClick={() => setTab("desktop")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${tab === "desktop" ? "bg-violet-600 text-white" : "text-white/40 hover:text-white/70 hover:bg-white/[0.05]"}`}
            data-testid="tab-outlook-desktop"
          >
            <MonitorSmartphone className="w-3.5 h-3.5" />
            {L ? "ويندوز / ماك" : "Desktop"}
          </button>
          <button
            onClick={() => setTab("mobile")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${tab === "mobile" ? "bg-violet-600 text-white" : "text-white/40 hover:text-white/70 hover:bg-white/[0.05]"}`}
            data-testid="tab-outlook-mobile"
          >
            <Smartphone className="w-3.5 h-3.5" />
            {L ? "موبايل" : "Mobile"}
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Server settings card */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
            <div className="px-4 py-2 bg-white/[0.04] border-b border-white/[0.06]">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/35">{L ? "إعدادات الوارد — IMAP" : "Incoming — IMAP"}</p>
            </div>
            <div className="px-4">
              <Row label={L ? "الخادم" : "Server"} value={settings.imapServer} />
              <Row label={L ? "المنفذ" : "Port"} value={settings.imapPort} />
              <Row label={L ? "الأمان" : "Security"} value={settings.imapSecurity} />
              <Row label={L ? "اسم المستخدم" : "Username"} value={settings.email} />
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
            <div className="px-4 py-2 bg-white/[0.04] border-b border-white/[0.06]">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/35">{L ? "إعدادات الصادر — SMTP" : "Outgoing — SMTP"}</p>
            </div>
            <div className="px-4">
              <Row label={L ? "الخادم" : "Server"} value={settings.smtpServer} />
              <Row label={L ? "المنفذ" : "Port"} value={settings.smtpPort} />
              <Row label={L ? "الأمان" : "Security"} value={settings.smtpSecurity} />
              <Row label={L ? "اسم المستخدم" : "Username"} value={settings.email} />
            </div>
          </div>

          <div className="rounded-xl bg-amber-950/20 border border-amber-800/30 px-4 py-3 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-300/80 leading-relaxed">
              {L
                ? "كلمة المرور: استخدم كلمة مرور البريد الخاصة بك من cPanel. تأكد أن المصادقة مفعّلة للوارد والصادر."
                : "Password: Use your cPanel email password. Ensure authentication is enabled for both incoming and outgoing."}
            </p>
          </div>

          {/* Steps */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-3">
              {L
                ? (tab === "desktop" ? "خطوات الإعداد — Outlook ويندوز" : "خطوات الإعداد — Outlook موبايل")
                : (tab === "desktop" ? "Setup Steps — Outlook Desktop" : "Setup Steps — Outlook Mobile")}
            </p>
            <div className="space-y-3">
              {tab === "desktop" ? (
                <>
                  <Step n={1} text={L ? 'افتح Outlook → اضغط "ملف" من الشريط العلوي → "إضافة حساب"' : 'Open Outlook → click "File" in the top ribbon → "Add Account"'} />
                  <Step n={2} text={L ? `أدخل عنوان البريد: ${settings.email} → اضغط "خيارات متقدمة" → فعّل "إعداد الحساب يدوياً" → اضغط اتصال` : `Enter email: ${settings.email} → click "Advanced options" → enable "Let me set up my account manually" → Connect`} />
                  <Step n={3} text={L ? 'اختر نوع الحساب: "IMAP"' : 'Choose account type: "IMAP"'} />
                  <Step n={4} text={L ? `في "إعدادات الوارد": أدخل الخادم ${settings.imapServer}، المنفذ ${settings.imapPort}، الأمان SSL/TLS` : `Under "Incoming mail": server ${settings.imapServer}, port ${settings.imapPort}, encryption SSL/TLS`} />
                  <Step n={5} text={L ? `في "إعدادات الصادر": أدخل الخادم ${settings.smtpServer}، المنفذ ${settings.smtpPort}، الأمان SSL/TLS` : `Under "Outgoing mail": server ${settings.smtpServer}, port ${settings.smtpPort}, encryption SSL/TLS`} />
                  <Step n={6} text={L ? 'اضغط "التالي" → أدخل كلمة المرور → اضغط "تسجيل الدخول" → "تم"' : 'Click "Next" → enter your password → "Sign in" → "Done"'} />
                </>
              ) : (
                <>
                  <Step n={1} text={L ? 'افتح تطبيق Outlook على هاتفك → اضغط على أيقونة ملفك الشخصي (أعلى اليسار)' : 'Open the Outlook app on your phone → tap your profile icon (top left)'} />
                  <Step n={2} text={L ? 'اضغط على أيقونة + لإضافة حساب جديد → "إضافة حساب بريد إلكتروني"' : 'Tap the + icon to add account → "Add Email Account"'} />
                  <Step n={3} text={L ? `أدخل عنوان البريد: ${settings.email} → اضغط "متابعة"` : `Enter email: ${settings.email} → tap "Continue"`} />
                  <Step n={4} text={L ? 'إذا لم يتعرف التطبيق تلقائياً → اضغط "إعداد يدوي" → اختر "IMAP"' : 'If not auto-detected → tap "Set Up Manually" → choose "IMAP"'} />
                  <Step n={5} text={L ? `في إعدادات الخادم: أدخل بيانات IMAP وSMTP الموضحة أعلاه` : `In server settings: enter the IMAP and SMTP details shown above`} />
                  <Step n={6} text={L ? 'أدخل كلمة المرور → اضغط "تسجيل الدخول" → منح الصلاحيات إذا طُلب' : 'Enter your password → tap "Sign In" → grant permissions if prompted'} />
                </>
              )}
            </div>
          </div>

          {/* Download link */}
          <a
            href={tab === "desktop" ? "https://www.microsoft.com/en-us/microsoft-365/outlook/outlook-for-windows" : "https://apps.apple.com/app/microsoft-outlook/id951937596"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.07] hover:bg-white/[0.04] transition text-[11px] text-white/40 hover:text-white/60"
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            {tab === "desktop"
              ? (L ? "تحميل Outlook لـ Windows / Mac" : "Download Outlook for Windows / Mac")
              : (L ? "تحميل Outlook من App Store / Google Play" : "Download Outlook from App Store / Google Play")}
          </a>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeMail() {
  const { L } = useI18n();
  const { toast } = useToast();
  const qc = useQueryClient();
  const dir = L ? "rtl" : "ltr";

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState("INBOX");
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [composing, setComposing] = useState(false);
  const [outlookSetupAccount, setOutlookSetupAccount] = useState<MailAccount | null>(null);
  const [composeTo, setComposeTo] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [search, setSearch] = useState("");
  const [sendingMail, setSendingMail] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<MailAccount[]>({
    queryKey: ["/api/mail/accounts"],
  });

  const { data: folders = ["INBOX", "Sent", "Drafts", "Trash"] } = useQuery<string[]>({
    queryKey: ["/api/mail/folders", selectedAccountId],
    queryFn: async () => {
      if (!selectedAccountId) return ["INBOX", "Sent", "Drafts", "Trash"];
      const res = await fetch(`/api/mail/folders/${selectedAccountId}`, { credentials: "include" });
      if (!res.ok) return ["INBOX", "Sent", "Drafts", "Trash"];
      return res.json();
    },
    enabled: !!selectedAccountId,
  });

  const { data: messages = [], isLoading: messagesLoading, isError: messagesError, refetch: refetchMessages } = useQuery<EmailMessage[]>({
    queryKey: ["/api/mail/inbox", selectedAccountId, selectedFolder],
    queryFn: async () => {
      if (!selectedAccountId) return [];
      const res = await fetch(`/api/mail/inbox/${selectedAccountId}?folder=${encodeURIComponent(selectedFolder)}`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    enabled: !!selectedAccountId,
    staleTime: 60_000,
    retry: 1,
  });

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId((accounts[0] as MailAccount).id);
    }
  }, [accounts]);

  const selectedAccount = accounts.find((a: MailAccount) => a.id === selectedAccountId);

  const markSeenMutation = useMutation({
    mutationFn: async ({ uid, folder }: { uid: number; folder: string }) => {
      const res = await fetch(`/api/mail/seen/${selectedAccountId}`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, folder }),
      });
      if (!res.ok) throw new Error("mark seen failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/mail/inbox", selectedAccountId, selectedFolder] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (uid: number) => {
      const res = await fetch(`/api/mail/message/${selectedAccountId}/${uid}?folder=${encodeURIComponent(selectedFolder)}`, {
        method: "DELETE", credentials: "include",
      });
      if (!res.ok) throw new Error("delete failed");
      return res.json();
    },
    onSuccess: () => {
      setSelectedEmail(null);
      qc.invalidateQueries({ queryKey: ["/api/mail/inbox", selectedAccountId, selectedFolder] });
      toast({ title: L ? "تم الحذف" : "Deleted" });
    },
  });

  function handleOpenEmail(msg: EmailMessage) {
    setSelectedEmail(msg);
    setComposing(false);
    if (!msg.seen) markSeenMutation.mutate({ uid: msg.uid, folder: selectedFolder });
  }

  function openCompose(to = "", subject = "", body = "") {
    setComposeTo(to); setComposeSubject(subject); setComposeBody(body);
    setComposeCc(""); setShowCc(false); setAttachments([]);
    setComposing(true); setSelectedEmail(null);
  }

  function startReply(msg: EmailMessage) {
    const fromEmail = msg.from.match(/<(.+)>/)?.[1] || msg.from;
    const quoteHeader = `\n\n—— ${L ? "الرسالة الأصلية" : "Original Message"} ——\n${L ? "من:" : "From:"} ${msg.from}\n${L ? "التاريخ:" : "Date:"} ${msg.date ? new Date(msg.date).toLocaleString(L ? "ar-SA" : "en-US") : ""}\n\n${msg.text || ""}`;
    openCompose(fromEmail, `Re: ${msg.subject}`, quoteHeader);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const next: AttachmentFile[] = [];
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: L ? "الملف أكبر من 10MB" : "File exceeds 10MB", variant: "destructive" });
        continue;
      }
      const data = await fileToBase64(file);
      const preview = file.type.startsWith("image/") ? `data:${file.type};base64,${data}` : undefined;
      next.push({ name: file.name, type: file.type, size: file.size, data, preview });
    }
    setAttachments(prev => [...prev, ...next]);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSend() {
    if (!selectedAccountId || !composeTo || !composeSubject || !composeBody) {
      toast({ title: L ? "يرجى ملء جميع الحقول المطلوبة" : "Fill all required fields", variant: "destructive" });
      return;
    }
    setSendingMail(true);
    try {
      const res = await fetch("/api/mail/send", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: selectedAccountId,
          to: composeTo,
          cc: composeCc || undefined,
          subject: composeSubject,
          body: composeBody,
          attachments: attachments.map(a => ({ filename: a.name, content: a.data, contentType: a.type, encoding: "base64" })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      toast({ title: L ? "تم الإرسال بنجاح ✓" : "Email sent successfully ✓" });
      openCompose();
      setComposing(false);
      qc.invalidateQueries({ queryKey: ["/api/mail/inbox", selectedAccountId, "Sent"] });
    } catch (err: any) {
      toast({ title: L ? "فشل الإرسال" : "Send failed", description: err.message, variant: "destructive" });
    } finally {
      setSendingMail(false);
    }
  }

  const filteredMessages = messages.filter((m: EmailMessage) =>
    !search ||
    (m.subject || "").toLowerCase().includes(search.toLowerCase()) ||
    (m.from || "").toLowerCase().includes(search.toLowerCase()) ||
    (m.snippet || "").toLowerCase().includes(search.toLowerCase())
  );

  const folderLabel = (f: string) => {
    const map: Record<string, [string, string]> = {
      INBOX: ["الوارد", "Inbox"], Sent: ["المُرسَل", "Sent"], Drafts: ["المسودات", "Drafts"],
      Trash: ["المحذوفات", "Trash"], Junk: ["البريد المزعج", "Junk"], Spam: ["السبام", "Spam"],
    };
    return map[f]?.[L ? 0 : 1] ?? f;
  };

  const unreadCount = messages.filter((m: EmailMessage) => !m.seen).length;
  const ChevronBack = L ? ChevronRight : ChevronLeft;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f5f7] dark:bg-[#0d0d0f]" dir={dir}>
      {/* Outlook Setup Modal */}
      {outlookSetupAccount && (
        <OutlookSetupModal
          account={outlookSetupAccount}
          onClose={() => setOutlookSetupAccount(null)}
          L={L}
        />
      )}

      {/* ═══════════════ LEFT RAIL — Accounts & Folders ═══════════════ */}
      <aside className={`w-56 flex flex-col bg-[#111827] shrink-0 ${L ? "border-l border-white/[0.06]" : "border-r border-white/[0.06]"}`}>

        {/* Brand */}
        <div className="px-4 py-4 flex items-center gap-3">
          <img src={qiroxLogo} alt="QIROX" className="h-5 w-auto brightness-0 invert" />
          <div>
            <p className="text-[11px] font-black tracking-widest text-white/50 uppercase">{L ? "البريد" : "Mail"}</p>
          </div>
        </div>

        {/* Compose */}
        <div className="px-3 pb-3">
          <button
            onClick={() => openCompose()}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all text-white text-[12px] font-bold shadow-lg shadow-indigo-900/30"
            data-testid="button-compose"
          >
            <Pencil className="w-3.5 h-3.5 shrink-0" />
            {L ? "رسالة جديدة" : "Compose"}
          </button>
        </div>

        {/* Accounts */}
        <div className="px-2.5 pb-1">
          <p className="px-2 pb-1 text-[9px] font-black uppercase tracking-widest text-white/25">{L ? "الحسابات" : "Accounts"}</p>
          {accountsLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-white/20" /></div>
          ) : (accounts as MailAccount[]).map(account => (
            <button
              key={account.id}
              onClick={() => { setSelectedAccountId(account.id); setSelectedEmail(null); setComposing(false); setSelectedFolder("INBOX"); }}
              className={`group w-full px-2.5 py-2 rounded-xl mb-0.5 flex items-center gap-2.5 transition-all text-start ${selectedAccountId === account.id ? "bg-white/[0.1] ring-1 ring-white/[0.12]" : "hover:bg-white/[0.05]"}`}
              data-testid={`button-account-${account.id}`}
            >
              <div className={`w-7 h-7 rounded-lg ${getAccountColor(account.emailAddress)} flex items-center justify-center text-[10px] font-black text-white shrink-0`}>
                {getInitials(account.displayName || account.emailAddress.split("@")[0])}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-white truncate leading-tight">{account.displayName || account.emailAddress.split("@")[0]}</p>
                <p className="text-[9px] text-white/35 truncate leading-tight">{account.emailAddress}</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); setOutlookSetupAccount(account); }}
                className={`p-1 rounded-lg hover:bg-white/[0.12] transition shrink-0 ${selectedAccountId === account.id ? "opacity-60 hover:opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                title={L ? "إعداد في Outlook" : "Outlook Setup"}
                data-testid={`button-outlook-setup-${account.id}`}
              >
                <Settings className="w-3 h-3 text-white/50" />
              </button>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-white/[0.07] my-2" />

        {/* Folders */}
        {selectedAccountId && (
          <div className="px-2.5 flex-1 overflow-y-auto">
            <p className="px-2 pb-1 text-[9px] font-black uppercase tracking-widest text-white/25">{L ? "المجلدات" : "Folders"}</p>
            {folders.map((folder: string) => {
              const FolderIcon = FOLDER_ICONS[folder] ?? Tag;
              const isActive = selectedFolder === folder;
              return (
                <button
                  key={folder}
                  onClick={() => { setSelectedFolder(folder); setSelectedEmail(null); setComposing(false); }}
                  className={`w-full px-2.5 py-2 rounded-xl mb-0.5 flex items-center gap-2.5 transition-all text-[11px] ${isActive ? "bg-white/[0.09] text-white font-semibold" : "text-white/45 hover:bg-white/[0.04] hover:text-white/70"}`}
                  data-testid={`button-folder-${folder}`}
                >
                  <FolderIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-violet-400" : "opacity-40"}`} />
                  <span className="truncate flex-1 text-start">{folderLabel(folder)}</span>
                  {folder === "INBOX" && unreadCount > 0 && (
                    <span className="text-[9px] bg-violet-600 text-white rounded-full px-1.5 py-0 font-bold min-w-[18px] text-center">{unreadCount}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Bottom spacer */}
        <div className="h-4" />
      </aside>

      {/* ═══════════════ MESSAGE LIST ═══════════════ */}
      <div className={`w-[300px] shrink-0 flex flex-col bg-white dark:bg-[#16181d] ${L ? "border-l" : "border-r"} border-black/[0.06] dark:border-white/[0.06]`}>

        {/* List header */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-black text-black dark:text-white">{folderLabel(selectedFolder)}</h2>
              {selectedAccount && (
                <p className="text-[10px] text-black/40 dark:text-white/40 truncate mt-0.5">{selectedAccount.emailAddress}</p>
              )}
            </div>
            <button
              onClick={() => refetchMessages()}
              className="p-1.5 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition"
              data-testid="button-refresh-mail"
              title={L ? "تحديث" : "Refresh"}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-black/40 dark:text-white/40 ${messagesLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className={`absolute top-1/2 -translate-y-1/2 ${L ? "right-3" : "left-3"} w-3.5 h-3.5 text-black/25 dark:text-white/25 pointer-events-none`} />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={L ? "بحث..." : "Search..."}
              className={`${L ? "pr-9 pl-3" : "pl-9 pr-3"} h-8 text-xs rounded-xl bg-black/[0.04] dark:bg-white/[0.05] border-transparent focus:border-black/10 dark:focus:border-white/10`}
              data-testid="input-mail-search"
            />
            {search && (
              <button onClick={() => setSearch("")} className={`absolute top-1/2 -translate-y-1/2 ${L ? "left-3" : "right-3"}`}>
                <X className="w-3 h-3 text-black/30 dark:text-white/30" />
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messagesLoading && (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-black/20 dark:text-white/20">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p className="text-xs">{L ? "جاري التحميل..." : "Loading..."}</p>
            </div>
          )}

          {!messagesLoading && messagesError && (
            <div className="mx-3 mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-[11px] text-red-600 dark:text-red-400">{L ? "تعذّر الاتصال بالخادم البريدي. يتم عرض الرسائل المخزنة." : "Cannot connect to mail server. Showing cached messages."}</p>
              </div>
            </div>
          )}

          {!messagesLoading && !selectedAccountId && (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-black/20 dark:text-white/20 px-4 text-center">
              <Mail className="w-8 h-8" />
              <p className="text-xs">{L ? "اختر حساباً بريدياً" : "Select an email account"}</p>
            </div>
          )}

          {!messagesLoading && selectedAccountId && filteredMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-black/20 dark:text-white/20">
              <MailOpen className="w-8 h-8" />
              <p className="text-xs">{L ? "لا توجد رسائل" : "No messages"}</p>
            </div>
          )}

          {(filteredMessages as EmailMessage[]).map((msg: EmailMessage) => {
            const senderName = (msg.from || "").split("<")[0].trim() || msg.from;
            const isActive = selectedEmail?.uid === msg.uid;
            return (
              <button
                key={msg.uid}
                onClick={() => handleOpenEmail(msg)}
                className={`w-full text-start px-3 py-3 border-b border-black/[0.04] dark:border-white/[0.04] transition-colors group ${isActive ? "bg-violet-50 dark:bg-violet-950/20" : "hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"}`}
                data-testid={`email-item-${msg.uid}`}
              >
                <div className="flex items-start gap-2.5">
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full ${getAccountColor(msg.from)} flex items-center justify-center text-[11px] font-black text-white shrink-0 mt-0.5`}>
                    {getInitials(senderName)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={`text-[12px] truncate ${!msg.seen ? "font-black text-black dark:text-white" : "font-medium text-black/60 dark:text-white/60"}`}>
                        {senderName}
                      </span>
                      <span className="text-[10px] text-black/30 dark:text-white/30 shrink-0">{formatDate(msg.date, L)}</span>
                    </div>
                    <p className={`text-[11px] truncate mb-0.5 ${!msg.seen ? "font-semibold text-black dark:text-white" : "text-black/55 dark:text-white/55"}`}>
                      {msg.subject || (L ? "(بدون موضوع)" : "(No subject)")}
                    </p>
                    <p className="text-[10px] truncate text-black/30 dark:text-white/35">{msg.snippet}</p>
                  </div>

                  {/* Unread dot */}
                  {!msg.seen && (
                    <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0 mt-1" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════ MAIN PANE ═══════════════ */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">

        {composing ? (
          /* ── COMPOSE ── */
          <div className="flex flex-col h-full bg-white dark:bg-[#16181d]">

            {/* Compose toolbar */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.06]">
              <button
                onClick={() => setComposing(false)}
                className="p-1.5 rounded-lg hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition"
              >
                <X className="w-4 h-4 text-black/50 dark:text-white/50" />
              </button>
              <h2 className="font-black text-sm flex-1">{L ? "رسالة جديدة" : "New Message"}</h2>
              <div className="flex items-center gap-1.5 text-[11px] text-black/35 dark:text-white/35 font-mono">
                <div className={`w-2 h-2 rounded-full ${selectedAccount ? "bg-emerald-500" : "bg-black/20"}`} />
                {selectedAccount?.emailAddress}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto w-full px-6 py-5 space-y-4">

                {/* QIROX brand banner */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 border border-violet-100 dark:border-violet-900/30">
                  <img src={qiroxLogo} alt="QIROX" className="h-5 w-auto dark:invert" />
                  <p className="text-[11px] text-violet-600/70 dark:text-violet-400/70 flex-1">
                    {L ? "ستُرسَل الرسالة بتصميم QIROX الاحترافي مع لوجو الشركة" : "Email will be sent with QIROX branded template & company logo"}
                  </p>
                </div>

                {/* To */}
                <div className="rounded-2xl border border-black/[0.08] dark:border-white/[0.08] overflow-hidden">
                  <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-black/[0.06] dark:border-white/[0.06]`}>
                    <span className="text-xs font-bold text-black/40 dark:text-white/40 w-8 shrink-0 text-start">{L ? "إلى" : "To"}</span>
                    <input
                      value={composeTo}
                      onChange={e => setComposeTo(e.target.value)}
                      placeholder="example@domain.com"
                      dir="ltr"
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-black/25 dark:placeholder:text-white/25"
                      data-testid="input-compose-to"
                    />
                    <button
                      onClick={() => setShowCc(!showCc)}
                      className="text-[10px] text-black/30 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60 font-semibold transition px-1"
                    >
                      {showCc ? (L ? "إخفاء CC" : "Hide CC") : "CC"}
                    </button>
                  </div>

                  {showCc && (
                    <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-black/[0.06] dark:border-white/[0.06]`}>
                      <span className="text-xs font-bold text-black/40 dark:text-white/40 w-8 shrink-0">CC</span>
                      <input
                        value={composeCc}
                        onChange={e => setComposeCc(e.target.value)}
                        placeholder="cc@domain.com"
                        dir="ltr"
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-black/25 dark:placeholder:text-white/25"
                        data-testid="input-compose-cc"
                      />
                    </div>
                  )}

                  <div className={`flex items-center gap-3 px-4 py-2.5`}>
                    <span className="text-xs font-bold text-black/40 dark:text-white/40 w-8 shrink-0 text-start">{L ? "الموضوع" : "Subject"}</span>
                    <input
                      value={composeSubject}
                      onChange={e => setComposeSubject(e.target.value)}
                      placeholder={L ? "موضوع الرسالة..." : "Email subject..."}
                      className="flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-black/25 dark:placeholder:text-white/25"
                      data-testid="input-compose-subject"
                    />
                  </div>
                </div>

                {/* Body */}
                <textarea
                  value={composeBody}
                  onChange={e => setComposeBody(e.target.value)}
                  placeholder={L ? "اكتب رسالتك هنا..." : "Write your message here..."}
                  className="w-full min-h-[220px] resize-none text-sm rounded-2xl border border-black/[0.08] dark:border-white/[0.08] px-4 py-3.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-violet-500/20 placeholder:text-black/20 dark:placeholder:text-white/20 leading-relaxed"
                  data-testid="textarea-compose-body"
                />

                {/* Attachments */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((att, idx) => (
                      <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] group">
                        {att.preview ? (
                          <img src={att.preview} alt={att.name} className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                            <Paperclip className="w-3.5 h-3.5 text-violet-500" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold truncate max-w-[120px]">{att.name}</p>
                          <p className="text-[10px] text-black/35 dark:text-white/35">{formatBytes(att.size)}</p>
                        </div>
                        <button
                          onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                          className="opacity-0 group-hover:opacity-100 transition p-0.5 rounded text-black/40 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Toolbar */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="file"
                    ref={fileRef}
                    multiple
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-black/50 dark:text-white/50 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] transition"
                    data-testid="button-attach-file"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    {L ? "إرفاق" : "Attach"}
                  </button>

                  <div className="flex-1" />

                  <button
                    onClick={() => setComposing(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-black/50 dark:text-white/50 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition"
                  >
                    {L ? "إلغاء" : "Cancel"}
                  </button>

                  <button
                    onClick={handleSend}
                    disabled={sendingMail || !composeTo || !composeSubject || !composeBody}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black shadow-lg shadow-indigo-900/20 transition-all"
                    data-testid="button-send-email"
                  >
                    {sendingMail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    {sendingMail ? (L ? "جارٍ الإرسال..." : "Sending...") : (L ? "إرسال" : "Send")}
                  </button>
                </div>
              </div>
            </div>
          </div>

        ) : selectedEmail ? (
          /* ── EMAIL VIEWER ── */
          <div className="flex flex-col h-full bg-white dark:bg-[#16181d]">

            {/* Viewer toolbar */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.06]">
              <button
                onClick={() => setSelectedEmail(null)}
                className="p-1.5 rounded-lg hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition"
              >
                <ChevronBack className="w-4 h-4 text-black/50 dark:text-white/50" />
              </button>

              <div className="flex-1" />

              <button
                onClick={() => startReply(selectedEmail)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-black/60 dark:text-white/60 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] transition"
                data-testid="button-reply-email"
              >
                <Reply className="w-3.5 h-3.5" />
                {L ? "رد" : "Reply"}
              </button>

              <button
                onClick={() => deleteMutation.mutate(selectedEmail.uid)}
                disabled={deleteMutation.isPending}
                className="p-2 rounded-xl text-black/35 dark:text-white/35 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition"
                data-testid="button-delete-email"
              >
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Email content */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-8 py-8">

                {/* Subject */}
                <h1 className="text-xl font-black text-black dark:text-white mb-5 leading-snug">
                  {selectedEmail.subject || (L ? "(بدون موضوع)" : "(No subject)")}
                </h1>

                {/* Sender card */}
                <div className="flex items-start gap-3 mb-6 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06]">
                  <div className={`w-10 h-10 rounded-full ${getAccountColor(selectedEmail.from)} flex items-center justify-center text-[13px] font-black text-white shrink-0`}>
                    {getInitials((selectedEmail.from || "").split("<")[0].trim() || selectedEmail.from)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-black dark:text-white truncate">
                      {(selectedEmail.from || "").split("<")[0].trim() || selectedEmail.from}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                      <p className="text-[11px] text-black/40 dark:text-white/40 font-mono truncate" dir="ltr">
                        {selectedEmail.from.match(/<(.+)>/)?.[1] || selectedEmail.from}
                      </p>
                      <p className="text-[11px] text-black/35 dark:text-white/35">
                        {selectedEmail.date ? new Date(selectedEmail.date).toLocaleString(L ? "ar-SA" : "en-US", { dateStyle: "medium", timeStyle: "short" }) : ""}
                      </p>
                    </div>
                    {selectedEmail.to && (
                      <p className="text-[11px] text-black/35 dark:text-white/35 mt-0.5">
                        {L ? "إلى:" : "To:"} {selectedEmail.to}
                      </p>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden">
                  <div className="p-6">
                    {selectedEmail.html ? (
                      <div
                        className="prose prose-sm max-w-none dark:prose-invert prose-a:text-violet-600"
                        dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                        style={{ direction: "ltr" }}
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm text-black/75 dark:text-white/75 font-sans leading-relaxed">
                        {selectedEmail.text || (L ? "لا يوجد محتوى" : "No content")}
                      </pre>
                    )}
                  </div>
                </div>

                {/* Reply CTA */}
                <div className="mt-5">
                  <button
                    onClick={() => startReply(selectedEmail)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] text-sm font-semibold text-black/55 dark:text-white/55 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition"
                  >
                    <Reply className="w-4 h-4" />
                    {L ? "الرد على هذه الرسالة" : "Reply to this message"}
                  </button>
                </div>
              </div>
            </div>
          </div>

        ) : (
          /* ── EMPTY STATE ── */
          <div className="flex-1 flex flex-col items-center justify-center gap-5 bg-[#f5f5f7] dark:bg-[#0d0d0f]">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/20 dark:to-indigo-900/20 flex items-center justify-center shadow-xl shadow-indigo-900/5">
              <Mail className="w-9 h-9 text-violet-500" />
            </div>
            <div className="text-center">
              <p className="font-black text-base text-black/25 dark:text-white/25 mb-1">
                {L ? "اختر رسالة لعرضها" : "Select a message to view"}
              </p>
              <p className="text-sm text-black/20 dark:text-white/20">
                {L ? "أو أنشئ رسالة جديدة" : "Or compose a new message"}
              </p>
            </div>
            <button
              onClick={() => openCompose()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-900/20 transition-all"
            >
              <Pencil className="w-4 h-4" />
              {L ? "رسالة جديدة" : "Compose"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
