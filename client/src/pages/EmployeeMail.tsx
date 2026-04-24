import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Mail, Send, Inbox, Trash2, RefreshCw, Loader2,
  ChevronLeft, Search, X, Pencil, Folder, Paperclip,
  Reply, AlertCircle, ImageIcon
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
  data: string; // base64
  preview?: string;
}

function formatDate(date: string | null): string {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
  if (diffHours < 24) return d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
  if (diffHours < 24 * 7) return d.toLocaleDateString("ar-SA", { weekday: "short" });
  return d.toLocaleDateString("ar-SA", { day: "numeric", month: "short" });
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

export default function EmployeeMail() {
  const { L } = useI18n();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState("INBOX");
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [composing, setComposing] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [search, setSearch] = useState("");
  const [sendingMail, setSendingMail] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Fetch accounts (this URL is correct)
  const { data: accounts = [], isLoading: accountsLoading, isError: accountsError } = useQuery<MailAccount[]>({
    queryKey: ["/api/mail/accounts"],
  });

  // Fetch folders with correct URL
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

  // Fetch messages with correct URL
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

  // Auto-select first account
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId((accounts[0] as MailAccount).id);
    }
  }, [accounts]);

  const selectedAccount = accounts.find((a: MailAccount) => a.id === selectedAccountId);

  const markSeenMutation = useMutation({
    mutationFn: async ({ uid, folder }: { uid: number; folder: string }) => {
      const res = await fetch(`/api/mail/seen/${selectedAccountId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, folder }),
      });
      if (!res.ok) throw new Error("mark seen failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/mail/inbox", selectedAccountId, selectedFolder] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (uid: number) => {
      const res = await fetch(`/api/mail/message/${selectedAccountId}/${uid}?folder=${encodeURIComponent(selectedFolder)}`, {
        method: "DELETE",
        credentials: "include",
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
    if (!msg.seen) {
      markSeenMutation.mutate({ uid: msg.uid, folder: selectedFolder });
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const newAttachments: AttachmentFile[] = [];
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: L ? "الملف أكبر من 10MB" : "File exceeds 10MB", variant: "destructive" });
        continue;
      }
      const data = await fileToBase64(file);
      const preview = file.type.startsWith("image/") ? `data:${file.type};base64,${data}` : undefined;
      newAttachments.push({ name: file.name, type: file.type, size: file.size, data, preview });
    }
    setAttachments(prev => [...prev, ...newAttachments]);
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
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: selectedAccountId,
          to: composeTo,
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
      setComposing(false);
      setComposeTo(""); setComposeSubject(""); setComposeBody(""); setAttachments([]);
      qc.invalidateQueries({ queryKey: ["/api/mail/inbox", selectedAccountId, "Sent"] });
    } catch (err: any) {
      toast({ title: L ? "خطأ في الإرسال" : "Send failed", description: err.message, variant: "destructive" });
    } finally {
      setSendingMail(false);
    }
  }

  function startReply(msg: EmailMessage) {
    const fromEmail = msg.from.match(/<(.+)>/)?.[1] || msg.from;
    setComposeTo(fromEmail);
    setComposeSubject(`Re: ${msg.subject}`);
    setComposeBody(`\n\n---\n${L ? "من:" : "From:"} ${msg.from}\n${L ? "التاريخ:" : "Date:"} ${msg.date ? new Date(msg.date).toLocaleString(L ? "ar-SA" : "en-US") : ""}\n\n${msg.text || ""}`);
    setAttachments([]);
    setComposing(true);
  }

  const filteredMessages = messages.filter((m: EmailMessage) =>
    !search ||
    (m.subject || "").toLowerCase().includes(search.toLowerCase()) ||
    (m.from || "").toLowerCase().includes(search.toLowerCase()) ||
    (m.snippet || "").toLowerCase().includes(search.toLowerCase())
  );

  const folderLabels: Record<string, string> = {
    INBOX: L ? "الوارد" : "Inbox",
    Sent: L ? "المُرسَل" : "Sent",
    Drafts: L ? "المسودات" : "Drafts",
    Trash: L ? "المحذوفات" : "Trash",
    Junk: L ? "السبام" : "Junk",
    Spam: L ? "السبام" : "Spam",
  };

  const unreadCount = messages.filter((m: EmailMessage) => !m.seen).length;

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-black text-black dark:text-white" dir={L ? "rtl" : "ltr"}>
      {/* ── Sidebar: accounts + folders ── */}
      <div className={`w-52 flex flex-col bg-[#0f172a] text-white shrink-0 ${L ? "border-l" : "border-r"} border-white/[0.07]`}>
        {/* Header */}
        <div className="px-4 py-4 border-b border-white/[0.08] flex items-center gap-2.5">
          <img src={qiroxLogo} alt="QIROX" className="h-5 w-auto invert" />
          <div>
            <div className="text-[11px] font-bold text-white/70">{L ? "البريد المؤسسي" : "Corporate Mail"}</div>
            {unreadCount > 0 && (
              <div className="text-[10px] text-white/40">{unreadCount} {L ? "غير مقروء" : "unread"}</div>
            )}
          </div>
        </div>

        {/* Compose */}
        <div className="px-3 py-2.5">
          <Button
            onClick={() => { setComposing(true); setSelectedEmail(null); setComposeTo(""); setComposeSubject(""); setComposeBody(""); setAttachments([]); }}
            className="w-full bg-white text-black hover:bg-white/90 text-[11px] font-bold gap-1.5 h-8 rounded-lg"
            data-testid="button-compose"
          >
            <Pencil className="w-3 h-3" />
            {L ? "رسالة جديدة" : "Compose"}
          </Button>
        </div>

        {/* Accounts */}
        <div className="flex-1 overflow-y-auto">
          {accountsLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-white/30" /></div>
          ) : accountsError ? (
            <div className="px-3 py-4 text-center text-white/30 text-[10px]">
              <AlertCircle className="w-4 h-4 mx-auto mb-1" />
              {L ? "لا يمكن تحميل الحسابات" : "Cannot load accounts"}
            </div>
          ) : accounts.length === 0 ? (
            <div className="px-3 py-4 text-center text-white/30 text-[10px]">{L ? "لا توجد حسابات مخصصة لك" : "No accounts assigned to you"}</div>
          ) : (
            <>
              {(accounts as MailAccount[]).map(account => (
                <button
                  key={account.id}
                  onClick={() => { setSelectedAccountId(account.id); setSelectedEmail(null); setComposing(false); setSelectedFolder("INBOX"); }}
                  className={`w-full px-3 py-2.5 border-b border-white/[0.05] transition-colors text-start ${selectedAccountId === account.id ? "bg-white/[0.1]" : "hover:bg-white/[0.05]"}`}
                  data-testid={`button-account-${account.id}`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/70 shrink-0">
                      {(account.displayName || account.emailAddress)[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-white truncate">{account.displayName || account.emailAddress.split("@")[0]}</div>
                      <div className="text-[9px] text-white/40 truncate">{account.emailAddress}</div>
                    </div>
                  </div>
                  {account.isShared && (
                    <span className="text-[8px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded font-medium">{L ? "مشترك" : "Shared"}</span>
                  )}
                </button>
              ))}

              {/* Folders */}
              {selectedAccountId && (
                <div className="pt-2 pb-2 border-t border-white/[0.08] mt-1">
                  <div className="px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white/25">{L ? "المجلدات" : "Folders"}</div>
                  {folders.map((folder: string) => (
                    <button
                      key={folder}
                      onClick={() => { setSelectedFolder(folder); setSelectedEmail(null); setComposing(false); }}
                      className={`w-full px-3 py-1.5 flex items-center gap-2 transition-colors text-[11px] ${selectedFolder === folder ? "bg-white/[0.08] text-white" : "text-white/45 hover:bg-white/[0.04] hover:text-white/70"}`}
                      data-testid={`button-folder-${folder}`}
                    >
                      <Folder className="w-3 h-3 shrink-0 opacity-50" />
                      <span className="truncate">{folderLabels[folder] || folder}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Message list ── */}
      <div className={`w-72 flex flex-col shrink-0 ${L ? "border-l" : "border-r"} border-black/[0.07] dark:border-white/[0.07]`}>
        <div className="px-3 py-3 border-b border-black/[0.07] dark:border-white/[0.07] flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold truncate">
              {selectedAccount ? (selectedAccount.displayName || selectedAccount.emailAddress) : (L ? "اختر حساباً" : "Select account")}
            </div>
            <div className="text-[10px] text-black/40 dark:text-white/40 truncate">{selectedFolder ? (folderLabels[selectedFolder] || selectedFolder) : ""}</div>
          </div>
          <Button variant="ghost" size="icon" className="w-7 h-7 shrink-0" onClick={() => refetchMessages()} data-testid="button-refresh-mail" title={L ? "تحديث" : "Refresh"}>
            <RefreshCw className={`w-3.5 h-3.5 ${messagesLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Search */}
        <div className="px-2 py-2 border-b border-black/[0.05] dark:border-white/[0.05]">
          <div className={`relative flex items-center`}>
            <Search className={`absolute ${L ? "right-2.5" : "left-2.5"} w-3.5 h-3.5 text-black/25 dark:text-white/25 pointer-events-none`} />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={L ? "بحث في الرسائل..." : "Search emails..."}
              className={`${L ? "pr-8 pl-2" : "pl-8 pr-2"} text-xs h-8 border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03]`}
              data-testid="input-mail-search"
            />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messagesLoading && (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-black/25 dark:text-white/25">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-xs">{L ? "جاري جلب الرسائل..." : "Fetching emails..."}</span>
            </div>
          )}
          {messagesError && !messagesLoading && (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-black/30 dark:text-white/30 px-4 text-center">
              <AlertCircle className="w-6 h-6" />
              <span className="text-xs">{L ? "تعذّر الاتصال بالخادم البريدي. سيتم عرض الرسائل المخزنة." : "Cannot connect to mail server. Showing cached messages."}</span>
            </div>
          )}
          {!messagesLoading && !selectedAccountId && (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-black/25 dark:text-white/25 text-center px-4">
              <Mail className="w-8 h-8" />
              <span className="text-xs">{L ? "اختر حساباً بريدياً" : "Select an email account"}</span>
            </div>
          )}
          {!messagesLoading && selectedAccountId && filteredMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-black/25 dark:text-white/25">
              <Inbox className="w-8 h-8" />
              <span className="text-xs">{L ? "لا توجد رسائل" : "No messages"}</span>
            </div>
          )}
          {(filteredMessages as EmailMessage[]).map((msg: EmailMessage) => (
            <button
              key={msg.uid}
              onClick={() => handleOpenEmail(msg)}
              className={`w-full text-start p-3 border-b border-black/[0.05] dark:border-white/[0.05] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors ${selectedEmail?.uid === msg.uid ? "bg-black/[0.05] dark:bg-white/[0.05]" : ""}`}
              data-testid={`email-item-${msg.uid}`}
            >
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className={`text-xs truncate flex-1 ${!msg.seen ? "font-bold text-black dark:text-white" : "text-black/55 dark:text-white/55"}`}>
                  {(msg.from || "").split("<")[0].trim() || msg.from}
                </span>
                <span className="text-[10px] text-black/30 dark:text-white/30 shrink-0">{formatDate(msg.date)}</span>
              </div>
              <div className={`text-[11px] truncate mb-0.5 ${!msg.seen ? "font-semibold text-black dark:text-white" : "text-black/65 dark:text-white/65"}`}>
                {msg.subject || (L ? "(بدون موضوع)" : "(No subject)")}
              </div>
              <div className="text-[10px] truncate text-black/35 dark:text-white/35">{msg.snippet}</div>
              {!msg.seen && (
                <span className="inline-block mt-1 w-1.5 h-1.5 rounded-full bg-[#0f172a] dark:bg-white" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Email viewer / Composer ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {composing ? (
          /* ── Compose ── */
          <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-black/[0.07] dark:border-white/[0.07] flex items-center gap-3">
              <button
                onClick={() => { setComposing(false); setComposeTo(""); setComposeSubject(""); setComposeBody(""); setAttachments([]); }}
                className="p-1.5 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition"
              >
                <X className="w-4 h-4" />
              </button>
              <h2 className="font-bold text-sm flex-1">{L ? "رسالة جديدة" : "New Message"}</h2>
              <div className="text-[11px] text-black/40 dark:text-white/40 font-mono">
                {selectedAccount?.emailAddress}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto w-full px-6 py-5 space-y-4">
                {/* QIROX brand preview strip */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06]">
                  <img src={qiroxLogo} alt="QIROX" className="h-5 w-auto dark:invert" />
                  <div className="text-[10px] text-black/45 dark:text-white/45">
                    {L ? "الرسالة ستُرسَل بتصميم QIROX الاحترافي مع لوجو الشركة" : "Email will be sent with QIROX branded template & logo"}
                  </div>
                </div>

                {/* To */}
                <div>
                  <label className="text-xs font-semibold text-black/50 dark:text-white/50 block mb-1.5">{L ? "إلى:" : "To:"}</label>
                  <Input
                    value={composeTo}
                    onChange={e => setComposeTo(e.target.value)}
                    placeholder="example@domain.com"
                    dir="ltr"
                    className="border-black/10 dark:border-white/10 h-9 text-sm"
                    data-testid="input-compose-to"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="text-xs font-semibold text-black/50 dark:text-white/50 block mb-1.5">{L ? "الموضوع:" : "Subject:"}</label>
                  <Input
                    value={composeSubject}
                    onChange={e => setComposeSubject(e.target.value)}
                    placeholder={L ? "موضوع الرسالة" : "Email subject"}
                    className="border-black/10 dark:border-white/10 h-9 text-sm"
                    data-testid="input-compose-subject"
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="text-xs font-semibold text-black/50 dark:text-white/50 block mb-1.5">{L ? "نص الرسالة:" : "Message:"}</label>
                  <textarea
                    value={composeBody}
                    onChange={e => setComposeBody(e.target.value)}
                    placeholder={L ? "اكتب رسالتك هنا..." : "Write your message here..."}
                    className="w-full min-h-[200px] resize-none text-sm border border-black/10 dark:border-white/10 rounded-xl px-3 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
                    data-testid="textarea-compose-body"
                  />
                </div>

                {/* Attachments preview */}
                {attachments.length > 0 && (
                  <div>
                    <label className="text-xs font-semibold text-black/50 dark:text-white/50 block mb-1.5">{L ? "المرفقات:" : "Attachments:"}</label>
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((att, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] group">
                          {att.preview ? (
                            <img src={att.preview} alt={att.name} className="w-8 h-8 rounded object-cover" />
                          ) : (
                            <Paperclip className="w-4 h-4 text-black/40 dark:text-white/40" />
                          )}
                          <div className="min-w-0">
                            <div className="text-[11px] font-medium truncate max-w-[120px]">{att.name}</div>
                            <div className="text-[10px] text-black/35 dark:text-white/35">{formatBytes(att.size)}</div>
                          </div>
                          <button
                            onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                            className="opacity-0 group-hover:opacity-100 transition p-0.5 rounded hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-black/[0.07] dark:border-white/[0.07]">
                  <input
                    type="file"
                    ref={fileRef}
                    multiple
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-black/10 dark:border-white/10 h-9 text-xs rounded-lg"
                    onClick={() => fileRef.current?.click()}
                    data-testid="button-attach-file"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    {L ? "إرفاق" : "Attach"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-black/10 dark:border-white/10 h-9 text-xs rounded-lg"
                    onClick={() => { if (fileRef.current) { fileRef.current.accept = "image/*"; fileRef.current.click(); fileRef.current.accept = "image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"; }}}
                    data-testid="button-attach-image"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    {L ? "صورة" : "Image"}
                  </Button>
                  <div className="flex-1" />
                  <Button
                    onClick={handleSend}
                    disabled={sendingMail || !composeTo || !composeSubject || !composeBody}
                    className="bg-black text-white hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/85 gap-2 h-9 px-5 rounded-lg text-xs font-bold"
                    data-testid="button-send-email"
                  >
                    {sendingMail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    {sendingMail ? (L ? "جارٍ الإرسال..." : "Sending...") : (L ? "إرسال" : "Send")}
                  </Button>
                </div>
              </div>
            </div>
          </div>

        ) : selectedEmail ? (
          /* ── Email Viewer ── */
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-3 border-b border-black/[0.07] dark:border-white/[0.07] flex items-start gap-3">
              <button
                onClick={() => setSelectedEmail(null)}
                className="p-1.5 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition mt-0.5 shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-sm md:text-base leading-snug mb-1.5">{selectedEmail.subject || (L ? "(بدون موضوع)" : "(No subject)")}</h2>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-black/45 dark:text-white/45">
                  <span><span className="font-semibold">{L ? "من:" : "From:"}</span> {selectedEmail.from}</span>
                  <span><span className="font-semibold">{L ? "إلى:" : "To:"}</span> {selectedEmail.to}</span>
                  {selectedEmail.date && (
                    <span>{new Date(selectedEmail.date).toLocaleString(L ? "ar-SA" : "en-US")}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 h-8 text-xs text-black/55 dark:text-white/55 hover:text-black dark:hover:text-white"
                  onClick={() => startReply(selectedEmail)}
                  data-testid="button-reply-email"
                >
                  <Reply className="w-3.5 h-3.5" />
                  {L ? "رد" : "Reply"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-black/35 dark:text-white/35 hover:text-red-500 dark:hover:text-red-400"
                  onClick={() => deleteMutation.mutate(selectedEmail.uid)}
                  disabled={deleteMutation.isPending}
                  data-testid="button-delete-email"
                >
                  {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-6 py-6">
                {selectedEmail.html ? (
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                    style={{ direction: "ltr" }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm text-black/75 dark:text-white/75 font-sans leading-relaxed">{selectedEmail.text || (L ? "لا يوجد محتوى" : "No content")}</pre>
                )}
              </div>
            </div>
          </div>

        ) : (
          /* ── Empty state ── */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-black/15 dark:text-white/15">
            <div className="w-24 h-24 rounded-3xl bg-black/[0.03] dark:bg-white/[0.04] flex items-center justify-center">
              <Mail className="w-12 h-12" />
            </div>
            <div className="text-center">
              <div className="font-bold text-base text-black/25 dark:text-white/25 mb-1">
                {L ? "اختر رسالة لعرضها" : "Select a message to view"}
              </div>
              <div className="text-sm text-black/20 dark:text-white/20">
                {L ? "أو أنشئ رسالة جديدة" : "Or compose a new message"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
