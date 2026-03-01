import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, MessageSquare, Send, Users, Search, Mail, X } from "lucide-react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

function timeAgo(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "الآن";
  if (diff < 3600) return `${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} س`;
  return d.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
}

function roleLabel(role: string) {
  const map: Record<string, string> = { admin: "مدير", manager: "مدير عام", developer: "مطور", designer: "مصمم", support: "دعم", client: "عميل", sales: "مبيعات" };
  return map[role] || role;
}

function Avatar({ name, role }: { name: string; role?: string }) {
  const colors: Record<string, string> = { admin: "bg-black text-white", manager: "bg-gray-800 text-white", developer: "bg-violet-600 text-white", designer: "bg-pink-600 text-white", client: "bg-blue-600 text-white", support: "bg-green-600 text-white" };
  const cls = colors[role || ""] || "bg-gray-500 text-white";
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${cls}`}>
      {(name || "?")[0].toUpperCase()}
    </div>
  );
}

export default function Inbox() {
  const { data: user } = useUser();
  const { toast } = useToast();
  const [activeContact, setActiveContact] = useState<any>(null);
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");
  const [newContactId, setNewContactId] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeToName, setComposeToName] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch all messages (for contacts list)
  const { data: allMessages = [], isLoading: loadingMsgs } = useQuery<any[]>({ queryKey: ["/api/inbox"] });

  // Fetch thread when contact is selected
  const { data: thread = [], isLoading: loadingThread } = useQuery<any[]>({
    queryKey: ["/api/inbox/thread", activeContact?.id],
    queryFn: async () => {
      if (!activeContact?.id) return [];
      const r = await fetch(`/api/inbox/thread/${activeContact.id}`);
      return r.json();
    },
    enabled: !!activeContact?.id,
    refetchInterval: 5000,
  });

  // Fetch available contacts (admin/employees can see all clients)
  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const r = await fetch("/api/admin/users");
      if (!r.ok) return [];
      return r.json();
    },
    enabled: !!user && user.role !== "client",
  });

  // Build contacts from all messages
  const contacts = (() => {
    const map = new Map<string, any>();
    for (const msg of allMessages) {
      const other = String(msg.fromUserId?.id || msg.fromUserId) === String((user as any)?.id)
        ? msg.toUserId
        : msg.fromUserId;
      if (!other || String(other?.id || other) === String((user as any)?.id)) continue;
      const oid = String(other?.id || other);
      if (!map.has(oid)) {
        map.set(oid, {
          id: oid,
          fullName: other?.fullName || other?.username || "مستخدم",
          role: other?.role || "client",
          lastMsg: msg.body,
          lastAt: msg.createdAt,
          unread: 0,
        });
      }
    }
    // Count unread
    for (const msg of allMessages) {
      if (!msg.read && String(msg.toUserId?.id || msg.toUserId) === String((user as any)?.id)) {
        const fid = String(msg.fromUserId?.id || msg.fromUserId);
        const c = map.get(fid);
        if (c) c.unread++;
      }
    }
    return [...map.values()].sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
  })();

  const filteredContacts = contacts.filter(c =>
    c.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const { data: emailRecipients = [] } = useQuery<any[]>({
    queryKey: ["/api/employee/email-recipients"],
    queryFn: async () => {
      const r = await fetch("/api/employee/email-recipients");
      if (!r.ok) return [];
      return r.json();
    },
    enabled: !!user && (user as any).role !== "client",
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!messageText.trim() || !activeContact?.id) return;
      const r = await apiRequest("POST", "/api/inbox", { toUserId: activeContact.id, body: messageText.trim() });
      return r.json();
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/inbox"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inbox/thread", activeContact?.id] });
    },
    onError: () => toast({ title: "تعذّر إرسال الرسالة", variant: "destructive" }),
  });

  const emailMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/employee/send-email", {
        to: composeTo,
        toName: composeToName || composeTo,
        subject: composeSubject,
        body: composeBody,
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || "فشل الإرسال"); }
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "تم إرسال البريد بنجاح ✓" });
      setComposeOpen(false);
      setComposeTo(""); setComposeToName(""); setComposeSubject(""); setComposeBody("");
    },
    onError: (e: any) => toast({ title: e.message || "فشل إرسال البريد", variant: "destructive" }),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  const me = user as any;

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f8f8]">
      <p className="text-black/40 text-sm">يجب تسجيل الدخول</p>
    </div>
  );

  return (
    <div className="h-screen bg-[#f8f8f8] flex flex-col relative" dir="rtl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none"><PageGraphics variant="dashboard" /></div>
      {/* Compose Email Dialog */}
      {me?.role !== "client" && (
        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogContent className="bg-white border-black/[0.06] text-black max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-black flex items-center gap-2">
                <Mail className="w-5 h-5 text-black/30" />
                إنشاء بريد إلكتروني
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-black/50 mb-1.5">إلى (البريد)</label>
                  <div className="flex gap-1">
                    <Input
                      value={composeTo}
                      onChange={e => setComposeTo(e.target.value)}
                      placeholder="name@example.com"
                      className="h-9 text-sm"
                      data-testid="input-compose-to"
                    />
                  </div>
                  {emailRecipients.length > 0 && (
                    <select
                      onChange={e => {
                        const r = emailRecipients.find((x: any) => x.email === e.target.value);
                        if (r) { setComposeTo(r.email); setComposeToName(r.name); }
                      }}
                      className="mt-1 w-full h-8 text-xs border border-black/[0.08] rounded-lg px-2 bg-white text-black/60"
                    >
                      <option value="">اختر من قائمة المستخدمين...</option>
                      {emailRecipients.map((r: any) => (
                        <option key={r.id} value={r.email}>{r.name} — {r.email}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-black/50 mb-1.5">اسم المستلم</label>
                  <Input
                    value={composeToName}
                    onChange={e => setComposeToName(e.target.value)}
                    placeholder="الاسم الكامل"
                    className="h-9 text-sm"
                    data-testid="input-compose-toname"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-black/50 mb-1.5">الموضوع</label>
                <Input
                  value={composeSubject}
                  onChange={e => setComposeSubject(e.target.value)}
                  placeholder="موضوع الرسالة..."
                  className="h-9 text-sm"
                  data-testid="input-compose-subject"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-black/50 mb-1.5">المحتوى</label>
                <Textarea
                  value={composeBody}
                  onChange={e => setComposeBody(e.target.value)}
                  placeholder="اكتب محتوى الرسالة هنا..."
                  rows={6}
                  className="text-sm resize-none"
                  data-testid="input-compose-body"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <Button
                  className="flex-1 premium-btn"
                  onClick={() => emailMutation.mutate()}
                  disabled={emailMutation.isPending || !composeTo || !composeSubject || !composeBody}
                  data-testid="button-send-compose"
                >
                  {emailMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  إرسال البريد
                </Button>
                <Button variant="outline" onClick={() => setComposeOpen(false)}>إلغاء</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Page Header */}
      <div className="bg-white border-b border-black/[0.06] px-5 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-black text-black text-sm">صندوق الرسائل</h1>
            <p className="text-[10px] text-black/35">تواصل مباشر مع الفريق</p>
          </div>
        </div>
        {me?.role !== "client" && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs border-black/[0.1] hover:bg-black/[0.03]"
            onClick={() => setComposeOpen(true)}
            data-testid="button-compose-email"
          >
            <Mail className="w-3.5 h-3.5" />
            إنشاء بريد
          </Button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Contacts Sidebar */}
        <div className="w-[260px] border-l border-black/[0.06] bg-white flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-black/[0.05]">
            <div className="relative">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/25" />
              <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="h-8 text-xs pr-8 bg-black/[0.03] border-transparent" />
            </div>
          </div>

          {/* New Message for non-clients */}
          {me?.role !== "client" && employees.length > 0 && (
            <div className="p-3 border-b border-black/[0.05]">
              <select
                value={newContactId}
                onChange={e => {
                  const u = employees.find((emp: any) => emp.id === e.target.value);
                  if (u) { setActiveContact({ id: u.id, fullName: u.fullName || u.username, role: u.role }); setNewContactId(""); }
                }}
                className="w-full h-8 text-xs border border-black/[0.08] rounded-lg px-2 bg-white text-black/60"
              >
                <option value="">+ رسالة جديدة</option>
                {employees.filter((e: any) => e.id !== me.id).map((e: any) => (
                  <option key={e.id} value={e.id}>{e.fullName || e.username} ({roleLabel(e.role)})</option>
                ))}
              </select>
            </div>
          )}

          <ScrollArea className="flex-1">
            {loadingMsgs ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-black/20" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="py-10 text-center px-4">
                <Users className="w-8 h-8 text-black/10 mx-auto mb-2" />
                <p className="text-xs text-black/30">لا توجد محادثات بعد</p>
              </div>
            ) : (
              <div>
                {filteredContacts.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setActiveContact(c)}
                    className={`w-full flex items-center gap-3 px-3 py-3 text-right transition-colors hover:bg-black/[0.02] border-b border-black/[0.04] ${activeContact?.id === c.id ? 'bg-black/[0.04]' : ''}`}
                    data-testid={`contact-${c.id}`}
                  >
                    <Avatar name={c.fullName} role={c.role} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-black truncate">{c.fullName}</p>
                        <span className="text-[9px] text-black/30 flex-shrink-0">{timeAgo(c.lastAt)}</span>
                      </div>
                      <p className="text-[10px] text-black/40 truncate mt-0.5">{c.lastMsg}</p>
                    </div>
                    {c.unread > 0 && (
                      <span className="w-4 h-4 bg-black text-white text-[9px] font-bold rounded-full flex items-center justify-center flex-shrink-0">{c.unread}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!activeContact ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-black/[0.04] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-7 h-7 text-black/15" />
                </div>
                <p className="text-sm font-bold text-black/30">اختر محادثة للبدء</p>
                <p className="text-xs text-black/20 mt-1">أو ابدأ محادثة جديدة</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-black/[0.06] px-5 py-3.5 flex items-center gap-3 flex-shrink-0">
                <Avatar name={activeContact.fullName} role={activeContact.role} />
                <div>
                  <p className="text-sm font-bold text-black">{activeContact.fullName}</p>
                  <p className="text-[10px] text-black/40">{roleLabel(activeContact.role)}</p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 px-5 py-4">
                {loadingThread ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-5 h-5 animate-spin text-black/20" />
                  </div>
                ) : thread.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-xs text-black/30">ابدأ المحادثة</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {thread.map((msg: any) => {
                      const isMe = String(msg.fromUserId?.id || msg.fromUserId) === String(me?.id);
                      return (
                        <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                          {!isMe && <Avatar name={activeContact.fullName} role={activeContact.role} />}
                          <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-black text-white rounded-tr-sm' : 'bg-white border border-black/[0.07] text-black rounded-tl-sm'}`}>
                            <p>{msg.body}</p>
                            <p className={`text-[9px] mt-1 ${isMe ? 'text-white/40' : 'text-black/30'} text-left`}>{timeAgo(msg.createdAt)}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="bg-white border-t border-black/[0.06] p-4 flex-shrink-0">
                <form
                  onSubmit={e => { e.preventDefault(); sendMutation.mutate(); }}
                  className="flex items-center gap-2"
                >
                  <Input
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    placeholder="اكتب رسالتك..."
                    className="flex-1 h-10 text-sm bg-black/[0.03] border-transparent focus:bg-white focus:border-black/20"
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMutation.mutate(); } }}
                    data-testid="input-message"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="w-10 h-10 bg-black text-white rounded-xl hover:bg-black/80 flex-shrink-0"
                    disabled={!messageText.trim() || sendMutation.isPending}
                    data-testid="button-send-message"
                  >
                    {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
