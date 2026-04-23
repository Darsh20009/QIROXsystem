import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Mail, Send, Inbox, Trash2, RefreshCw, Loader2,
  ChevronLeft, Search, X, Pencil, Star, Eye, EyeOff,
  Folder, AlertCircle
} from "lucide-react";

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

function formatDate(date: string | null): string {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 24) {
    return d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffHours < 24 * 7) {
    return d.toLocaleDateString("ar-SA", { weekday: "short" });
  }
  return d.toLocaleDateString("ar-SA", { day: "numeric", month: "short" });
}

export default function EmployeeMail() {
  const { L } = useI18n();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useUser();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState("INBOX");
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [composing, setComposing] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [search, setSearch] = useState("");
  const [sendingMail, setSendingMail] = useState(false);

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<MailAccount[]>({
    queryKey: ["/api/mail/accounts"],
  });

  const { data: folders = ["INBOX", "Sent", "Drafts", "Trash"] } = useQuery<string[]>({
    queryKey: ["/api/mail/folders", selectedAccountId],
    enabled: !!selectedAccountId,
  });

  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery<EmailMessage[]>({
    queryKey: ["/api/mail/inbox", selectedAccountId, selectedFolder],
    enabled: !!selectedAccountId,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts]);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  const markSeenMutation = useMutation({
    mutationFn: async ({ uid, folder }: { uid: number; folder: string }) => {
      return apiRequest("POST", `/api/mail/seen/${selectedAccountId}`, { uid, folder });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/mail/inbox", selectedAccountId, selectedFolder] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (uid: number) => {
      return apiRequest("DELETE", `/api/mail/message/${selectedAccountId}/${uid}?folder=${selectedFolder}`);
    },
    onSuccess: () => {
      setSelectedEmail(null);
      qc.invalidateQueries({ queryKey: ["/api/mail/inbox", selectedAccountId, selectedFolder] });
      toast({ title: L ? "تم الحذف" : "Deleted" });
    },
  });

  async function handleOpenEmail(msg: EmailMessage) {
    setSelectedEmail(msg);
    setComposing(false);
    if (!msg.seen) {
      markSeenMutation.mutate({ uid: msg.uid, folder: selectedFolder });
    }
  }

  async function handleSend() {
    if (!selectedAccountId || !composeTo || !composeSubject || !composeBody) {
      toast({ title: L ? "يرجى ملء جميع الحقول" : "Fill all fields", variant: "destructive" });
      return;
    }
    setSendingMail(true);
    try {
      await apiRequest("POST", "/api/mail/send", {
        accountId: selectedAccountId,
        to: composeTo,
        subject: composeSubject,
        body: composeBody,
      });
      toast({ title: L ? "تم الإرسال بنجاح" : "Email sent successfully" });
      setComposing(false);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
    } catch (err: any) {
      toast({ title: L ? "خطأ في الإرسال" : "Send failed", description: err.message, variant: "destructive" });
    } finally {
      setSendingMail(false);
    }
  }

  const filteredMessages = messages.filter(m =>
    !search ||
    m.subject.toLowerCase().includes(search.toLowerCase()) ||
    m.from.toLowerCase().includes(search.toLowerCase()) ||
    m.snippet.toLowerCase().includes(search.toLowerCase())
  );

  const folderLabels: Record<string, string> = {
    INBOX: L ? "الوارد" : "Inbox",
    Sent: L ? "المرسل" : "Sent",
    Drafts: L ? "المسودات" : "Drafts",
    Trash: L ? "المحذوفات" : "Trash",
    Junk: L ? "السبام" : "Junk",
    Spam: L ? "السبام" : "Spam",
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-black" dir={L ? "rtl" : "ltr"}>
      {/* Left sidebar: accounts + folders */}
      <div className="w-56 border-l border-black/10 dark:border-white/10 flex flex-col bg-black text-white shrink-0">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-4 h-4 text-white/60" />
            <span className="text-xs font-bold tracking-wider text-white/80">{L ? "الصندوق البريدي" : "Mailbox"}</span>
          </div>
        </div>

        {/* Compose button */}
        <div className="p-3">
          <Button
            onClick={() => { setComposing(true); setSelectedEmail(null); }}
            className="w-full bg-white text-black hover:bg-white/90 text-xs font-bold gap-1.5"
            data-testid="button-compose"
          >
            <Pencil className="w-3 h-3" />
            {L ? "إنشاء رسالة" : "Compose"}
          </Button>
        </div>

        {/* Account selector */}
        {accountsLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-4 h-4 animate-spin text-white/40" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {accounts.map(account => (
              <button
                key={account.id}
                onClick={() => { setSelectedAccountId(account.id); setSelectedEmail(null); setComposing(false); setSelectedFolder("INBOX"); }}
                className={`w-full text-right px-3 py-2.5 border-b border-white/[0.06] transition-colors ${selectedAccountId === account.id ? "bg-white/10" : "hover:bg-white/5"}`}
                data-testid={`button-account-${account.id}`}
              >
                <div className="text-[11px] font-bold text-white truncate">{account.displayName || account.emailAddress.split("@")[0]}</div>
                <div className="text-[10px] text-white/45 truncate">{account.emailAddress}</div>
                {account.isShared && (
                  <Badge className="mt-0.5 text-[8px] bg-white/10 text-white/60 border-0 px-1 py-0">{L ? "مشترك" : "Shared"}</Badge>
                )}
              </button>
            ))}
            {accounts.length === 0 && (
              <div className="p-4 text-center text-white/30 text-xs">{L ? "لا توجد حسابات" : "No accounts"}</div>
            )}

            {/* Folder list */}
            {selectedAccountId && (
              <div className="mt-2 border-t border-white/10 pt-2">
                {folders.map(folder => (
                  <button
                    key={folder}
                    onClick={() => { setSelectedFolder(folder); setSelectedEmail(null); setComposing(false); }}
                    className={`w-full text-right px-3 py-2 flex items-center gap-2 transition-colors text-xs ${selectedFolder === folder ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5"}`}
                    data-testid={`button-folder-${folder}`}
                  >
                    <Folder className="w-3 h-3 shrink-0" />
                    <span className="truncate">{folderLabels[folder] || folder}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Middle: message list */}
      <div className="w-72 border-l border-black/10 dark:border-white/10 flex flex-col shrink-0">
        {/* Header */}
        <div className="p-3 border-b border-black/10 dark:border-white/10 flex items-center gap-2">
          <span className="font-bold text-sm flex-1 truncate">
            {selectedAccount ? (selectedAccount.displayName || selectedAccount.emailAddress) : (L ? "اختر حساباً" : "Select account")}
          </span>
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => refetchMessages()} data-testid="button-refresh-mail">
            <RefreshCw className={`w-3.5 h-3.5 ${messagesLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Search */}
        <div className="p-2 border-b border-black/10 dark:border-white/10">
          <div className="relative">
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/30 dark:text-white/30" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={L ? "بحث في الرسائل..." : "Search emails..."}
              className="pr-8 text-xs h-8 border-black/10 dark:border-white/10"
              data-testid="input-mail-search"
            />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messagesLoading && (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-black/30 dark:text-white/30">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-xs">{L ? "جاري التحميل..." : "Loading..."}</span>
            </div>
          )}
          {!messagesLoading && !selectedAccountId && (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-black/30 dark:text-white/30">
              <Mail className="w-8 h-8" />
              <span className="text-xs text-center">{L ? "اختر حساباً بريدياً من القائمة" : "Select an account"}</span>
            </div>
          )}
          {!messagesLoading && selectedAccountId && filteredMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-black/30 dark:text-white/30">
              <Inbox className="w-8 h-8" />
              <span className="text-xs">{L ? "لا توجد رسائل" : "No messages"}</span>
            </div>
          )}
          {filteredMessages.map(msg => (
            <button
              key={msg.uid}
              onClick={() => handleOpenEmail(msg)}
              className={`w-full text-right p-3 border-b border-black/[0.06] dark:border-white/[0.06] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors ${selectedEmail?.uid === msg.uid ? "bg-black/[0.05] dark:bg-white/[0.05]" : ""}`}
              data-testid={`email-item-${msg.uid}`}
            >
              <div className="flex items-start justify-between gap-1 mb-0.5">
                <span className={`text-xs truncate flex-1 ${!msg.seen ? "font-bold text-black dark:text-white" : "text-black/60 dark:text-white/60"}`}>
                  {msg.from.split("<")[0].trim() || msg.from}
                </span>
                <span className="text-[10px] text-black/30 dark:text-white/30 shrink-0">{formatDate(msg.date)}</span>
              </div>
              <div className={`text-xs truncate mb-0.5 ${!msg.seen ? "font-semibold text-black dark:text-white" : "text-black/70 dark:text-white/70"}`}>
                {msg.subject}
              </div>
              <div className="text-[11px] truncate text-black/40 dark:text-white/40">{msg.snippet}</div>
              {!msg.seen && (
                <div className="mt-1 w-2 h-2 rounded-full bg-black dark:bg-white inline-block" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Right: email viewer / composer */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {composing ? (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-center gap-3">
              <button onClick={() => setComposing(false)} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5">
                <X className="w-4 h-4" />
              </button>
              <h2 className="font-bold text-sm">{L ? "إنشاء رسالة جديدة" : "New Message"}</h2>
              <div className="ml-auto text-xs text-black/40 dark:text-white/40">
                {L ? "من:" : "From:"} <span className="font-mono">{selectedAccount?.emailAddress}</span>
              </div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-4 max-w-2xl mx-auto w-full">
              <div>
                <label className="text-xs font-medium text-black/50 dark:text-white/50 block mb-1">{L ? "إلى:" : "To:"}</label>
                <Input
                  value={composeTo}
                  onChange={e => setComposeTo(e.target.value)}
                  placeholder="example@email.com"
                  dir="ltr"
                  className="border-black/10 dark:border-white/10"
                  data-testid="input-compose-to"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-black/50 dark:text-white/50 block mb-1">{L ? "الموضوع:" : "Subject:"}</label>
                <Input
                  value={composeSubject}
                  onChange={e => setComposeSubject(e.target.value)}
                  placeholder={L ? "موضوع الرسالة" : "Email subject"}
                  className="border-black/10 dark:border-white/10"
                  data-testid="input-compose-subject"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-black/50 dark:text-white/50 block mb-1">{L ? "نص الرسالة:" : "Message:"}</label>
                <Textarea
                  value={composeBody}
                  onChange={e => setComposeBody(e.target.value)}
                  placeholder={L ? "اكتب رسالتك هنا..." : "Write your message here..."}
                  className="border-black/10 dark:border-white/10 min-h-[240px] resize-none"
                  data-testid="textarea-compose-body"
                />
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-black/10 dark:border-white/10">
                <div className="text-xs text-black/40 dark:text-white/40 flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {L ? "سيتم إرسال الرسالة بتصميم QIROX الاحترافي" : "Email will be sent with QIROX branded design"}
                </div>
                <Button
                  onClick={handleSend}
                  disabled={sendingMail || !composeTo || !composeSubject || !composeBody}
                  className="mr-auto bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black gap-2"
                  data-testid="button-send-email"
                >
                  {sendingMail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {L ? "إرسال" : "Send"}
                </Button>
              </div>
            </div>
          </div>
        ) : selectedEmail ? (
          <div className="flex flex-col h-full">
            {/* Email header */}
            <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-start gap-3">
              <button onClick={() => setSelectedEmail(null)} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 mt-0.5">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-base leading-snug mb-1">{selectedEmail.subject}</h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-black/50 dark:text-white/50">
                  <span><span className="font-medium">{L ? "من:" : "From:"}</span> {selectedEmail.from}</span>
                  <span><span className="font-medium">{L ? "إلى:" : "To:"}</span> {selectedEmail.to}</span>
                  {selectedEmail.date && (
                    <span>{new Date(selectedEmail.date).toLocaleString(L ? "ar-SA" : "en-US")}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-black/40 dark:text-white/40 hover:text-red-500"
                  onClick={() => deleteMutation.mutate(selectedEmail.uid)}
                  disabled={deleteMutation.isPending}
                  data-testid="button-delete-email"
                >
                  {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1.5 h-8"
                  onClick={() => { setComposeTo(selectedEmail.from.match(/<(.+)>/)?.[1] || selectedEmail.from); setComposeSubject(`Re: ${selectedEmail.subject}`); setComposing(true); }}
                  data-testid="button-reply-email"
                >
                  <Send className="w-3.5 h-3.5" />
                  {L ? "رد" : "Reply"}
                </Button>
              </div>
            </div>
            {/* Email body */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedEmail.html ? (
                <div
                  className="prose prose-sm max-w-none dark:prose-invert text-black dark:text-white"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                />
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-black/80 dark:text-white/80 font-sans">{selectedEmail.text}</pre>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-black/20 dark:text-white/20">
            <div className="w-20 h-20 rounded-full bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center">
              <Mail className="w-10 h-10" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg text-black/30 dark:text-white/30">
                {L ? "اختر رسالة لعرضها" : "Select a message to view"}
              </div>
              <div className="text-sm mt-1">
                {L ? "أو أنشئ رسالة جديدة من القائمة" : "Or compose a new message"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
