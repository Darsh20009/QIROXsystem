/**
 * AdminWhatsApp — QIROX WhatsApp CRM
 * - Connect WhatsApp Web via QR
 * - View & reply to conversations
 * - AI auto-responder settings
 * - Admin command panel
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Wifi, WifiOff, QrCode, MessageSquare, Settings, Send,
  Bot, User, Phone, RefreshCw, Plus, X, Zap, ChevronLeft, Check,
  BrainCircuit, Smartphone
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

// ── Types ─────────────────────────────────────────────────────────────────────
interface WAStatus { status: "disconnected"|"qr"|"connecting"|"connected"; qr: string|null; phoneNumber: string|null; }
interface WAChat { _id: string; chatId: string; name: string; phoneNumber: string; lastMessage: string; lastMessageAt: string; unreadCount: number; aiEnabled: boolean; }
interface WAMessage { _id: string; chatId: string; fromMe: boolean; senderName?: string; body: string; timestamp: string; aiGenerated?: boolean; mediaType?: string; }
interface WASettings { adminNumbers: string[]; aiEnabled: boolean; aiDelaySeconds: number; systemPromptExtra: string; connectedPhone?: string; }

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtTime = (ts: string) => {
  const d = new Date(ts);
  return d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
};
const fmtDate = (ts: string) => {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return fmtTime(ts);
  return d.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
};

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminWhatsApp() {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const qc = useQueryClient();

  const [waStatus, setWaStatus] = useState<WAStatus>({ status: "disconnected", qr: null, phoneNumber: null });
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newAdminNum, setNewAdminNum] = useState("");
  const [settings, setSettings] = useState<WASettings>({ adminNumbers: [], aiEnabled: true, aiDelaySeconds: 60, systemPromptExtra: "" });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sseRef = useRef<EventSource | null>(null);

  // ── SSE connection ──────────────────────────────────────────────────────
  const connectSSE = useCallback(() => {
    if (sseRef.current) sseRef.current.close();
    const es = new EventSource("/api/admin/whatsapp/events", { withCredentials: true });
    es.onmessage = (e) => {
      try {
        const evt = JSON.parse(e.data);
        if (evt.type === "status") {
          setWaStatus({ status: evt.status, qr: evt.qr, phoneNumber: evt.phoneNumber });
        } else if (evt.type === "message" || evt.type === "chat_update") {
          qc.invalidateQueries({ queryKey: ["/api/admin/whatsapp/chats"] });
          if (evt.chatId === selectedChatId) {
            qc.invalidateQueries({ queryKey: ["/api/admin/whatsapp/messages", selectedChatId] });
          }
        }
      } catch {}
    };
    es.onerror = () => { setTimeout(connectSSE, 5000); };
    sseRef.current = es;
  }, [qc, selectedChatId]);

  useEffect(() => {
    // Load initial status
    fetch("/api/admin/whatsapp/status", { credentials: "include" })
      .then(r => r.json()).then(setWaStatus).catch(() => {});
    connectSSE();
    return () => { sseRef.current?.close(); };
  }, []);

  // When selectedChatId changes, reconnect SSE so new messages update the view
  useEffect(() => {
    if (sseRef.current) sseRef.current.close();
    connectSSE();
  }, [selectedChatId]);

  // ── QR polling fallback (every 2s while connecting/qr — in case SSE events are buffered) ──
  useEffect(() => {
    const needsQR = waStatus.status === "connecting" || waStatus.status === "qr";
    if (!needsQR) return;
    // Poll immediately then every 2s
    const poll = () => {
      fetch("/api/admin/whatsapp/qr-image", { credentials: "include" })
        .then(r => r.json())
        .then((d: { status: string; qr: string | null }) => {
          if (d.qr && d.qr !== waStatus.qr) {
            setWaStatus(prev => ({ ...prev, status: d.status as any, qr: d.qr }));
          } else if (d.status && d.status !== waStatus.status && !d.qr) {
            setWaStatus(prev => ({ ...prev, status: d.status as any }));
          }
        })
        .catch(() => {});
    };
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [waStatus.status]);

  // ── Data queries ────────────────────────────────────────────────────────
  const { data: chats = [], isLoading: chatsLoading } = useQuery<WAChat[]>({
    queryKey: ["/api/admin/whatsapp/chats"],
    queryFn: () => fetch("/api/admin/whatsapp/chats", { credentials: "include" }).then(r => r.json()),
    enabled: waStatus.status === "connected",
    refetchInterval: 5000,
  });

  const { data: messages = [], isLoading: msgsLoading } = useQuery<WAMessage[]>({
    queryKey: ["/api/admin/whatsapp/messages", selectedChatId],
    queryFn: () => fetch(`/api/admin/whatsapp/chats/${encodeURIComponent(selectedChatId!)}/messages`, { credentials: "include" }).then(r => r.json()),
    enabled: !!selectedChatId && waStatus.status === "connected",
    refetchInterval: 3000,
  });

  const { data: settingsData } = useQuery<WASettings>({
    queryKey: ["/api/admin/whatsapp/settings"],
    queryFn: () => fetch("/api/admin/whatsapp/settings", { credentials: "include" }).then(r => r.json()),
    onSuccess: (d) => setSettings(d || settings),
  } as any);
  useEffect(() => { if (settingsData) setSettings(settingsData); }, [settingsData]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Mutations ───────────────────────────────────────────────────────────
  const connectMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/whatsapp/connect").then(r => r.json()),
    onSuccess: () => toast({ title: L ? "جاري الاتصال..." : "Connecting..." }),
    onError: () => toast({ title: L ? "فشل الاتصال" : "Connection failed", variant: "destructive" }),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/whatsapp/disconnect").then(r => r.json()),
    onSuccess: () => { setWaStatus({ status: "disconnected", qr: null, phoneNumber: null }); toast({ title: L ? "تم قطع الاتصال" : "Disconnected" }); },
  });

  const sendMutation = useMutation({
    mutationFn: (text: string) => apiRequest("POST", `/api/admin/whatsapp/chats/${encodeURIComponent(selectedChatId!)}/send`, { text }).then(r => r.json()),
    onSuccess: () => {
      setReplyText("");
      qc.invalidateQueries({ queryKey: ["/api/admin/whatsapp/messages", selectedChatId] });
      qc.invalidateQueries({ queryKey: ["/api/admin/whatsapp/chats"] });
    },
    onError: (e: any) => toast({ title: e.message || "فشل الإرسال", variant: "destructive" }),
  });

  const aiToggleMutation = useMutation({
    mutationFn: ({ chatId, enabled }: { chatId: string; enabled: boolean }) =>
      apiRequest("POST", `/api/admin/whatsapp/chats/${encodeURIComponent(chatId)}/ai-toggle`, { enabled }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/whatsapp/chats"] }),
  });

  const saveSettingsMutation = useMutation({
    mutationFn: (data: Partial<WASettings>) => apiRequest("PATCH", "/api/admin/whatsapp/settings", data).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/whatsapp/settings"] }); toast({ title: L ? "✅ تم حفظ الإعدادات" : "✅ Settings saved" }); setSettingsOpen(false); },
  });

  const selectedChat = chats.find(c => c.chatId === selectedChatId);

  // ── Status colors ───────────────────────────────────────────────────────
  const statusColor = {
    connected:    "bg-green-500",
    connecting:   "bg-yellow-400 animate-pulse",
    qr:           "bg-blue-500 animate-pulse",
    disconnected: "bg-gray-400",
  }[waStatus.status];

  const statusLabel = {
    connected:    L ? `متصل • ${waStatus.phoneNumber || ""}` : `Connected • ${waStatus.phoneNumber || ""}`,
    connecting:   L ? "جاري الاتصال..." : "Connecting...",
    qr:           L ? "في انتظار مسح الباركود" : "Waiting for QR scan",
    disconnected: L ? "غير متصل" : "Disconnected",
  }[waStatus.status];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-50 dark:bg-gray-950 rounded-2xl overflow-hidden border border-black/[0.06] dark:border-white/[0.06]" dir={dir}>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-900 border-b border-black/[0.06] dark:border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2.5">
          {/* WhatsApp logo */}
          <div className="w-8 h-8 rounded-xl bg-[#25D366] flex items-center justify-center shadow-sm">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-black dark:text-white">{L ? "واتساب CRM" : "WhatsApp CRM"}</h1>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${statusColor}`} />
              <span className="text-[10px] text-black/50 dark:text-white/50">{statusLabel}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setSettingsOpen(true)}>
            <Settings className="w-4 h-4 text-black/40 dark:text-white/40" />
          </Button>
          {waStatus.status === "connected" ? (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-black/10" onClick={() => disconnectMutation.mutate()} disabled={disconnectMutation.isPending}>
              {disconnectMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <WifiOff className="w-3 h-3" />}
              {L ? "قطع" : "Disconnect"}
            </Button>
          ) : (
            <Button size="sm" className="h-7 text-xs gap-1 bg-[#25D366] hover:bg-[#22c55e] text-white" onClick={() => connectMutation.mutate()} disabled={connectMutation.isPending || waStatus.status === "connecting" || waStatus.status === "qr"}>
              {connectMutation.isPending || waStatus.status === "connecting" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3" />}
              {L ? "اتصال" : "Connect"}
            </Button>
          )}
        </div>
      </div>

      {/* ── QR screen ── */}
      {(waStatus.status === "qr" || waStatus.status === "connecting") && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8">
          <div className="w-14 h-14 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center">
            <QrCode className="w-7 h-7 text-[#25D366]" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-black dark:text-white mb-1">{L ? "ربط واتساب" : "Link WhatsApp"}</h2>
            <p className="text-sm text-black/50 dark:text-white/50 max-w-xs">{L ? "افتح واتساب على هاتفك ← الإعدادات ← الأجهزة المرتبطة ← ربط جهاز" : "Open WhatsApp → Settings → Linked Devices → Link a Device"}</p>
          </div>
          {waStatus.qr ? (
            <div className="p-4 bg-white rounded-2xl shadow-xl border border-black/[0.06]">
              <QRCodeCanvas value={waStatus.qr} size={220} level="M" includeMargin={false} bgColor="#ffffff" fgColor="#000000" />
            </div>
          ) : (
            <div className="w-[220px] h-[220px] rounded-xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-black/20 dark:text-white/20" />
            </div>
          )}
          <p className="text-[11px] text-black/30 dark:text-white/30 text-center">{L ? "الباركود ينتهي بعد دقيقتين — سيتجدد تلقائياً" : "QR expires after 2 minutes and refreshes automatically"}</p>
        </div>
      )}

      {/* ── Disconnected screen ── */}
      {waStatus.status === "disconnected" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-9 h-9 fill-gray-400"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </div>
          <div className="text-center">
            <p className="font-bold text-black dark:text-white mb-1">{L ? "واتساب غير متصل" : "WhatsApp not connected"}</p>
            <p className="text-sm text-black/40 dark:text-white/40">{L ? "اضغط اتصال لربط الواتساب بالنظام" : "Click Connect to link WhatsApp to the system"}</p>
          </div>
          <Button className="gap-2 bg-[#25D366] hover:bg-[#22c55e] text-white" onClick={() => connectMutation.mutate()} disabled={connectMutation.isPending}>
            {connectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
            {L ? "ربط واتساب الآن" : "Connect WhatsApp Now"}
          </Button>
        </div>
      )}

      {/* ── Connected: chat UI ── */}
      {waStatus.status === "connected" && (
        <div className="flex flex-1 overflow-hidden">

          {/* Left: chat list */}
          <div className="w-72 shrink-0 border-l border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-black/[0.04] dark:border-white/[0.04]">
              <p className="text-[11px] font-bold text-black/40 dark:text-white/40 uppercase tracking-wider">{L ? "المحادثات" : "Conversations"} {chats.length > 0 && `(${chats.length})`}</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {chatsLoading && (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-black/20" /></div>
              )}
              {!chatsLoading && chats.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <MessageSquare className="w-8 h-8 text-black/10 dark:text-white/10" />
                  <p className="text-xs text-black/30 dark:text-white/30">{L ? "لا توجد محادثات بعد" : "No conversations yet"}</p>
                </div>
              )}
              {chats.map(chat => (
                <div
                  key={chat.chatId}
                  onClick={() => setSelectedChatId(chat.chatId)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer border-b border-black/[0.03] dark:border-white/[0.03] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors ${selectedChatId === chat.chatId ? "bg-[#25D366]/8 border-r-2 border-r-[#25D366]" : ""}`}
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center shrink-0">
                    <span className="text-white text-sm font-bold">{(chat.name || chat.phoneNumber || "?")[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-black dark:text-white truncate">{chat.name || chat.phoneNumber}</p>
                      <p className="text-[9px] text-black/30 dark:text-white/30 shrink-0">{fmtDate(chat.lastMessageAt)}</p>
                    </div>
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <p className="text-[10px] text-black/40 dark:text-white/40 truncate">{chat.lastMessage}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        {!chat.aiEnabled && <Bot className="w-2.5 h-2.5 text-black/20 dark:text-white/20" />}
                        {(chat.unreadCount || 0) > 0 && (
                          <span className="w-4 h-4 rounded-full bg-[#25D366] text-white text-[8px] font-bold flex items-center justify-center">{chat.unreadCount > 9 ? "9+" : chat.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: chat view */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {!selectedChatId ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
                <MessageSquare className="w-12 h-12 text-black/10 dark:text-white/10" />
                <p className="text-sm text-black/30 dark:text-white/30">{L ? "اختر محادثة للبدء" : "Select a conversation to start"}</p>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-900 border-b border-black/[0.06] dark:border-white/[0.06] shrink-0">
                  <div className="flex items-center gap-2.5">
                    <button onClick={() => setSelectedChatId(null)} className="lg:hidden p-1 rounded-lg hover:bg-black/[0.04]">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{(selectedChat?.name || selectedChat?.phoneNumber || "?")[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-black dark:text-white">{selectedChat?.name || selectedChat?.phoneNumber}</p>
                      <p className="text-[10px] text-black/40 dark:text-white/40 flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5" />
                        {/* Show phone only if it looks like a real number, not a LID */}
                        {selectedChat?.phoneNumber?.startsWith("+") || /^\d{7,}$/.test(selectedChat?.phoneNumber || "")
                          ? selectedChat?.phoneNumber
                          : (selectedChat?.name || L ? "واتساب" : "WhatsApp")}
                      </p>
                    </div>
                  </div>
                  {/* AI toggle for this chat */}
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="w-3.5 h-3.5 text-black/30 dark:text-white/30" />
                    <span className="text-[10px] text-black/40 dark:text-white/40">{L ? "الذكاء الاصطناعي" : "AI"}</span>
                    <Switch
                      checked={selectedChat?.aiEnabled !== false}
                      onCheckedChange={(v) => aiToggleMutation.mutate({ chatId: selectedChatId, enabled: v })}
                      className="scale-75"
                    />
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2" style={{ background: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\"), linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%)" }}>
                  {msgsLoading && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-black/20" /></div>}
                  {messages.map(msg => (
                    <div key={msg._id} className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[72%] rounded-2xl px-3 py-2 shadow-sm ${msg.fromMe
                        ? "bg-[#dcf8c6] dark:bg-[#005c4b] rounded-br-sm"
                        : "bg-white dark:bg-gray-800 rounded-bl-sm"
                      }`}>
                        {!msg.fromMe && msg.senderName && (
                          <p className="text-[9px] font-bold text-[#25D366] mb-0.5">{msg.senderName}</p>
                        )}
                        <p className="text-[13px] text-black dark:text-white leading-snug whitespace-pre-wrap">{msg.body}</p>
                        <div className="flex items-center gap-1 justify-end mt-0.5">
                          {msg.aiGenerated && <Bot className="w-2.5 h-2.5 text-[#25D366]" title="AI generated" />}
                          <span className="text-[9px] text-black/30 dark:text-white/30">{fmtTime(msg.timestamp)}</span>
                          {msg.fromMe && <Check className="w-2.5 h-2.5 text-[#25D366]" />}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Composer */}
                <div className="px-3 py-2.5 bg-white dark:bg-gray-900 border-t border-black/[0.06] dark:border-white/[0.06] shrink-0">
                  {selectedChat?.aiEnabled === false && (
                    <div className="flex items-center gap-1.5 mb-2 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200">
                      <Bot className="w-3 h-3 text-amber-500" />
                      <p className="text-[10px] text-amber-700">{L ? "الذكاء الاصطناعي متوقف — أنت في وضع الرد البشري" : "AI off — you're in manual reply mode"}</p>
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <Textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (replyText.trim()) sendMutation.mutate(replyText);
                        }
                      }}
                      placeholder={L ? "اكتب رسالة... (Enter للإرسال)" : "Type a message... (Enter to send)"}
                      rows={1}
                      className="flex-1 resize-none text-sm border-black/10 dark:border-white/10 rounded-xl min-h-[38px] max-h-[120px]"
                    />
                    <Button
                      size="icon"
                      onClick={() => { if (replyText.trim()) sendMutation.mutate(replyText); }}
                      disabled={sendMutation.isPending || !replyText.trim()}
                      className="bg-[#25D366] hover:bg-[#22c55e] text-white rounded-xl w-10 h-10 shrink-0"
                    >
                      {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-[9px] text-black/20 dark:text-white/20 mt-1 text-center">{L ? "الرد اليدوي يوقف الذكاء الاصطناعي مؤقتاً لمدة 30 دقيقة" : "Manual reply pauses AI for 30 minutes"}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Settings Dialog ── */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-gray-900" dir={dir}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-black dark:text-white">
              <Settings className="w-5 h-5 text-[#25D366]" />
              {L ? "إعدادات واتساب CRM" : "WhatsApp CRM Settings"}
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="ai">
            <TabsList className="w-full">
              <TabsTrigger value="ai" className="flex-1">{L ? "الذكاء الاصطناعي" : "AI"}</TabsTrigger>
              <TabsTrigger value="admin" className="flex-1">{L ? "أرقام الأدمن" : "Admin Numbers"}</TabsTrigger>
            </TabsList>

            {/* AI settings */}
            <TabsContent value="ai" className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-3 rounded-xl border border-black/[0.07] dark:border-white/[0.07]">
                <div>
                  <p className="text-sm font-bold text-black dark:text-white">{L ? "الرد التلقائي بالذكاء الاصطناعي" : "AI Auto-Reply"}</p>
                  <p className="text-[11px] text-black/40 dark:text-white/40">{L ? "يرد على العملاء إذا لم يتم الرد خلال المدة المحددة" : "Replies to clients if no response within the set time"}</p>
                </div>
                <Switch checked={settings.aiEnabled} onCheckedChange={v => setSettings(s => ({ ...s, aiEnabled: v }))} />
              </div>

              <div>
                <label className="text-xs font-medium text-black/50 dark:text-white/40 mb-1 block">
                  {settings.aiDelaySeconds === 0
                    ? (L ? "⚡ رد فوري — بمجرد وصول الرسالة" : "⚡ Instant reply — as soon as message arrives")
                    : (L ? `وقت الانتظار قبل الرد التلقائي (${settings.aiDelaySeconds} ثانية)` : `Auto-reply delay (${settings.aiDelaySeconds}s)`)}
                </label>
                <input type="range" min={0} max={300} step={10} value={settings.aiDelaySeconds}
                  onChange={e => setSettings(s => ({ ...s, aiDelaySeconds: Number(e.target.value) }))}
                  className="w-full accent-[#25D366]" />
                <div className="flex justify-between text-[9px] text-black/30 dark:text-white/30 mt-0.5">
                  <span>{L ? "⚡ فوري" : "⚡ Instant"}</span><span>{L ? "دقيقة" : "1 min"}</span><span>5 {L ? "دقائق" : "min"}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-black/50 dark:text-white/40 mb-1 block">{L ? "معلومات إضافية للذكاء الاصطناعي (اختياري)" : "Extra AI context (optional)"}</label>
                <Textarea
                  value={settings.systemPromptExtra}
                  onChange={e => setSettings(s => ({ ...s, systemPromptExtra: e.target.value }))}
                  placeholder={L ? "مثال: عروض الشهر الحالي، باقات خاصة، ملاحظات..." : "e.g. Current month offers, special packages, notes..."}
                  rows={3}
                  className="text-sm border-black/10 dark:border-white/10"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#25D366]/5 border border-[#25D366]/20">
                <p className="text-[11px] text-black/60 dark:text-white/60 font-medium mb-1 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-[#25D366]" />{L ? "سلوك الذكاء الاصطناعي:" : "AI behavior:"}
                </p>
                <ul className="text-[10px] text-black/40 dark:text-white/40 space-y-0.5 list-disc list-inside">
                  <li>{L ? "يرد بنفس لهجة المستخدم (سعودي، مصري، خليجي...)" : "Responds in the same dialect (Saudi, Egyptian, Gulf...)"}</li>
                  <li>{L ? "لا يرد بالصينية أبداً" : "Never responds in Chinese"}</li>
                  <li>{L ? "أسلوب ودود وحيوي — غير رسمي" : "Warm and casual — non-formal"}</li>
                  <li>{L ? "الرد اليدوي يوقفه مؤقتاً 30 دقيقة" : "Manual reply pauses it for 30 min"}</li>
                </ul>
              </div>
            </TabsContent>

            {/* Admin numbers */}
            <TabsContent value="admin" className="space-y-3 mt-4">
              <p className="text-[11px] text-black/40 dark:text-white/40">{L ? "الأرقام في هذه القائمة تستطيع إرسال أوامر للنظام عبر واتساب (إنشاء كودات، إرسال بريد، تقارير...)" : "Numbers in this list can send system commands via WhatsApp"}</p>

              <div className="flex gap-2">
                <Input
                  value={newAdminNum}
                  onChange={e => setNewAdminNum(e.target.value)}
                  placeholder="+966501234567"
                  dir="ltr"
                  className="text-sm border-black/10 dark:border-white/10"
                />
                <Button size="sm" variant="outline" className="shrink-0 border-black/10 gap-1"
                  onClick={() => {
                    const n = newAdminNum.trim();
                    if (n && !settings.adminNumbers.includes(n)) {
                      setSettings(s => ({ ...s, adminNumbers: [...s.adminNumbers, n] }));
                      setNewAdminNum("");
                    }
                  }}>
                  <Plus className="w-3.5 h-3.5" />{L ? "إضافة" : "Add"}
                </Button>
              </div>

              <div className="space-y-1.5">
                {settings.adminNumbers.map((num, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05]">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-3.5 h-3.5 text-[#25D366]" />
                      <span className="text-sm font-mono text-black dark:text-white">{num}</span>
                    </div>
                    <button onClick={() => setSettings(s => ({ ...s, adminNumbers: s.adminNumbers.filter((_, j) => j !== i) }))}>
                      <X className="w-3.5 h-3.5 text-black/30 hover:text-red-500" />
                    </button>
                  </div>
                ))}
                {settings.adminNumbers.length === 0 && (
                  <p className="text-[11px] text-black/25 dark:text-white/25 text-center py-3">{L ? "لا توجد أرقام مضافة" : "No admin numbers added"}</p>
                )}
              </div>

              <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05]">
                <p className="text-[10px] text-black/40 dark:text-white/40 font-medium mb-1">{L ? "أوامر متاحة للأدمن:" : "Available admin commands:"}</p>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    [L ? "أرسل رابط الباقات" : "أرسل رابط الباقات", "send_link"],
                    [L ? "أنشئ كود خصم 20%" : "أنشئ كود خصم 20%", "create_promo"],
                    [L ? "أرسل تقرير" : "أرسل تقرير", "send_report"],
                    [L ? "أوقف الذكاء الاصطناعي" : "أوقف الذكاء الاصطناعي", "toggle_ai"],
                  ].map(([label]) => (
                    <div key={label} className="text-[9px] text-black/40 dark:text-white/40 bg-black/[0.02] dark:bg-white/[0.02] rounded px-2 py-1">{label}</div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Button
            className="w-full mt-2 gap-2 bg-[#25D366] hover:bg-[#22c55e] text-white"
            onClick={() => saveSettingsMutation.mutate(settings)}
            disabled={saveSettingsMutation.isPending}
          >
            {saveSettingsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {L ? "حفظ الإعدادات" : "Save Settings"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
