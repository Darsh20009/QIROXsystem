import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/UserAvatar";
import {
  Plus, Send, Users, Settings, Trash2, Crown, UserPlus, UserMinus,
  ArrowRight, MessageSquare, Search, Check, Loader2, MoreVertical,
  LogOut, Edit2
} from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

const ROLE_LABELS: Record<string, string> = {
  admin: "مدير", manager: "مدير عام", developer: "مطور", designer: "مصمم",
  support: "دعم", sales: "مبيعات", sales_manager: "مدير مبيعات", accountant: "محاسب", merchant: "تاجر",
};
const ROLE_COLORS: Record<string, string> = {
  admin: "bg-black text-white", manager: "bg-slate-700 text-white", developer: "bg-violet-600 text-white",
  designer: "bg-pink-600 text-white", support: "bg-emerald-600 text-white", sales: "bg-orange-600 text-white",
  sales_manager: "bg-red-600 text-white", accountant: "bg-teal-600 text-white",
};

function timeAgo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (diff < 60) return "الآن";
  if (diff < 3600) return `${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} س`;
  return new Date(d).toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
}
function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}

const EMOJI_OPTIONS = ["💬", "🚀", "🔥", "💡", "🎯", "🛠️", "📊", "🎨", "💻", "📢", "⚡", "🌟", "🏆", "🤝", "📋"];

export default function GroupChat() {
  const { user } = useUser();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const params = useParams<{ id?: string }>();
  const activeGroupId = params.id;

  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: "", description: "", icon: "💬" });
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uid = String((user as any)?._id || user?.id || "");
  const isAdmin = (user as any)?.role === "admin" || (user as any)?.role === "manager";

  const { data: groups = [], isLoading: groupsLoading } = useQuery<any[]>({ queryKey: ["/api/groups"] });
  const { data: messages = [], isLoading: msgsLoading } = useQuery<any[]>({
    queryKey: ["/api/groups", activeGroupId, "messages"],
    queryFn: async () => {
      if (!activeGroupId) return [];
      const r = await fetch(`/api/groups/${activeGroupId}/messages`);
      if (!r.ok) return [];
      return r.json();
    },
    enabled: !!activeGroupId,
    refetchInterval: false,
  });

  const activeGroup = groups.find((g: any) => g.id === activeGroupId || String(g._id) === activeGroupId);
  const amGroupAdmin = activeGroup?.adminIds?.some((a: any) => String(a._id || a) === uid);

  const { data: allStaff = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/employees"],
    enabled: createOpen || addMemberOpen,
  });

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (activeGroupId) inputRef.current?.focus(); }, [activeGroupId]);

  useWebSocket((evt: any) => {
    if (evt.type === "group_message" && evt.groupId === activeGroupId) {
      qc.invalidateQueries({ queryKey: ["/api/groups", activeGroupId, "messages"] });
    }
    if (evt.type === "group_message" || evt.type === "group_added") {
      qc.invalidateQueries({ queryKey: ["/api/groups"] });
    }
  });

  const createGroup = useMutation({
    mutationFn: () => apiRequest("POST", "/api/groups", { ...newGroup, memberIds: selectedMembers }),
    onSuccess: (d: any) => {
      qc.invalidateQueries({ queryKey: ["/api/groups"] });
      setCreateOpen(false);
      setNewGroup({ name: "", description: "", icon: "💬" });
      setSelectedMembers([]);
      toast({ title: "تم إنشاء المجموعة" });
      if (d?.id || d?._id) navigate(`/groups/${d.id || d._id}`);
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const sendMsg = useMutation({
    mutationFn: () => apiRequest("POST", `/api/groups/${activeGroupId}/messages`, { body: msg.trim() }),
    onSuccess: () => {
      setMsg("");
      qc.invalidateQueries({ queryKey: ["/api/groups", activeGroupId, "messages"] });
      qc.invalidateQueries({ queryKey: ["/api/groups"] });
    },
    onError: (e: any) => toast({ title: "خطأ في الإرسال", description: e.message, variant: "destructive" }),
  });

  const deleteMsg = useMutation({
    mutationFn: (msgId: string) => apiRequest("DELETE", `/api/groups/${activeGroupId}/messages/${msgId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/groups", activeGroupId, "messages"] }),
  });

  const addMembers = useMutation({
    mutationFn: () => apiRequest("POST", `/api/groups/${activeGroupId}/members`, { userIds: selectedMembers }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/groups"] });
      setAddMemberOpen(false);
      setSelectedMembers([]);
      toast({ title: "تمت إضافة الأعضاء" });
    },
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => apiRequest("DELETE", `/api/groups/${activeGroupId}/members/${userId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/groups"] }); toast({ title: "تم الإزالة" }); },
  });

  const promoteAdmin = useMutation({
    mutationFn: ({ userId, action }: { userId: string; action: string }) =>
      apiRequest("PATCH", `/api/groups/${activeGroupId}/admins/${userId}`, { action }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/groups"] }),
  });

  const leaveGroup = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/groups/${activeGroupId}/members/${uid}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/groups"] }); navigate("/groups"); toast({ title: "غادرت المجموعة" }); },
  });

  const deleteGroup = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/groups/${activeGroupId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/groups"] }); navigate("/groups"); toast({ title: "تم حذف المجموعة" }); },
  });

  const filteredGroups = groups.filter((g: any) => !search || g.name?.includes(search));
  const existingMemberIds = new Set((activeGroup?.memberIds || []).map((m: any) => String(m._id || m)));
  const availableStaff = (allStaff as any[]).filter((s: any) => !existingMemberIds.has(String(s.id || s._id)));

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey && msg.trim()) { e.preventDefault(); sendMsg.mutate(); }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white dark:bg-gray-950 overflow-hidden" dir="rtl">

      {/* ── Sidebar ─────────────────────────────────── */}
      <div className={`flex flex-col border-l border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-950 ${activeGroupId ? "hidden md:flex w-72" : "flex w-full md:w-72"}`}>
        <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-base font-bold text-black dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4" /> مجموعات الفريق
            </h1>
            <Button size="sm" onClick={() => { setCreateOpen(true); setSelectedMembers([]); }} className="h-7 px-2 gap-1 text-xs" data-testid="button-create-group">
              <Plus className="w-3 h-3" /> جديدة
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-black/30 dark:text-white/30" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." className="pr-8 h-8 text-sm" />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {groupsLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-black/20 dark:text-white/20" /></div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 text-black/10 dark:text-white/10" />
              <p className="text-sm text-black/40 dark:text-white/40">لا توجد مجموعات</p>
              <p className="text-xs text-black/25 dark:text-white/25 mt-1">ابدأ بإنشاء مجموعتك الأولى</p>
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              {filteredGroups.map((g: any) => {
                const gid = g.id || String(g._id);
                const isActive = gid === activeGroupId;
                return (
                  <button
                    key={gid}
                    onClick={() => navigate(`/groups/${gid}`)}
                    data-testid={`group-item-${gid}`}
                    className={`w-full text-right flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${isActive ? "bg-black dark:bg-white text-white dark:text-black" : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${isActive ? "bg-white/20 dark:bg-black/20" : "bg-black/[0.04] dark:bg-white/[0.04]"}`}>
                      {g.icon || "💬"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold text-sm truncate ${isActive ? "text-white dark:text-black" : "text-black dark:text-white"}`}>{g.name}</span>
                        {g.lastMessageAt && (
                          <span className={`text-[10px] shrink-0 mr-1 ${isActive ? "text-white/60 dark:text-black/60" : "text-black/30 dark:text-white/30"}`}>{timeAgo(g.lastMessageAt)}</span>
                        )}
                      </div>
                      <p className={`text-xs truncate ${isActive ? "text-white/70 dark:text-black/70" : "text-black/40 dark:text-white/40"}`}>
                        {g.lastMessage || `${g.memberIds?.length || 0} عضو`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ── Chat Area ───────────────────────────────── */}
      {activeGroupId && activeGroup ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-950">
            <Button variant="ghost" size="sm" className="md:hidden h-7 w-7 p-0" onClick={() => navigate("/groups")}>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <div className="w-10 h-10 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center text-xl shrink-0">
              {activeGroup.icon || "💬"}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-sm text-black dark:text-white truncate">{activeGroup.name}</h2>
              <p className="text-xs text-black/40 dark:text-white/40">{activeGroup.memberIds?.length || 0} عضو</p>
            </div>
            <div className="flex items-center gap-1">
              {amGroupAdmin && (
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setAddMemberOpen(true)} data-testid="button-add-member">
                  <UserPlus className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSettingsOpen(true)} data-testid="button-group-settings">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-3">
            {msgsLoading ? (
              <div className="flex items-center justify-center h-40"><Loader2 className="w-5 h-5 animate-spin text-black/20 dark:text-white/20" /></div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <MessageSquare className="w-10 h-10 mb-3 text-black/10 dark:text-white/10" />
                <p className="text-sm text-black/40 dark:text-white/40">لا توجد رسائل بعد</p>
                <p className="text-xs text-black/25 dark:text-white/25 mt-1">كن أول من يكتب!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(messages as any[]).map((m: any, i: number) => {
                  const isMe = String(m.fromUserId?._id || m.fromUserId) === uid;
                  const sender = m.fromUserId;
                  const showAvatar = !isMe && (i === 0 || String((messages[i - 1] as any).fromUserId?._id || (messages[i - 1] as any).fromUserId) !== String(sender?._id || sender));
                  const msgId = m.id || String(m._id);
                  return (
                    <div key={msgId} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                      {!isMe && (
                        <div className="w-7 h-7 shrink-0 mb-1">
                          {showAvatar && (
                            <UserAvatar profilePhotoUrl={sender?.profilePhotoUrl} avatarConfig={sender?.avatarConfig} name={sender?.fullName || sender?.username || "؟"} role={sender?.role} size="sm" />
                          )}
                        </div>
                      )}
                      <div className={`group max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                        {showAvatar && !isMe && (
                          <span className="text-[10px] text-black/40 dark:text-white/40 px-1">
                            {sender?.fullName || sender?.username}
                            {sender?.role && <span className={`mr-1 px-1 rounded text-[9px] ${ROLE_COLORS[sender.role] || "bg-gray-100 text-gray-600"}`}>{ROLE_LABELS[sender.role] || sender.role}</span>}
                          </span>
                        )}
                        <div className={`relative px-3 py-2 rounded-2xl text-sm leading-relaxed ${isMe ? "bg-black dark:bg-white text-white dark:text-black rounded-tl-sm" : "bg-black/[0.05] dark:bg-white/[0.05] text-black dark:text-white rounded-tr-sm"}`}>
                          {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            <span className={`text-[10px] ${isMe ? "text-white/50 dark:text-black/50" : "text-black/30 dark:text-white/30"}`}>{formatTime(m.createdAt)}</span>
                          </div>
                          {isMe && (
                            <button
                              onClick={() => deleteMsg.mutate(msgId)}
                              className="absolute -top-2 -left-2 w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center hidden group-hover:flex text-[10px]"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="px-4 py-3 border-t border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-950">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={msg}
                onChange={e => setMsg(e.target.value)}
                onKeyDown={handleKey}
                placeholder="اكتب رسالتك..."
                className="flex-1 h-10 text-sm"
                data-testid="input-group-message"
              />
              <Button
                onClick={() => sendMsg.mutate()}
                disabled={!msg.trim() || sendMsg.isPending}
                className="h-10 w-10 p-0"
                data-testid="button-send-group-message"
              >
                {sendMsg.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      ) : !activeGroupId ? (
        <div className="hidden md:flex flex-1 items-center justify-center flex-col text-center p-8">
          <PageGraphics variant="dashboard" />
          <div className="relative">
            <div className="w-20 h-20 bg-black/[0.04] dark:bg-white/[0.04] rounded-3xl flex items-center justify-center mb-4 mx-auto">
              <MessageSquare className="w-10 h-10 text-black/20 dark:text-white/20" />
            </div>
            <h2 className="text-xl font-bold text-black dark:text-white mb-2">مجموعات الفريق</h2>
            <p className="text-sm text-black/40 dark:text-white/40 max-w-xs">اختر مجموعة من القائمة أو أنشئ مجموعة جديدة للتواصل مع فريق العمل</p>
            <Button onClick={() => setCreateOpen(true)} className="mt-4 gap-2">
              <Plus className="w-4 h-4" /> إنشاء مجموعة جديدة
            </Button>
          </div>
        </div>
      ) : null}

      {/* ── Create Group Dialog ──────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> إنشاء مجموعة جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">أيقونة المجموعة</label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map(e => (
                  <button key={e} onClick={() => setNewGroup(g => ({ ...g, icon: e }))}
                    className={`w-9 h-9 text-xl rounded-lg border-2 transition-all ${newGroup.icon === e ? "border-black dark:border-white scale-110" : "border-transparent hover:border-black/20"}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">اسم المجموعة *</label>
              <Input value={newGroup.name} onChange={e => setNewGroup(g => ({ ...g, name: e.target.value }))} placeholder="مثال: فريق التطوير" data-testid="input-group-name" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">الوصف (اختياري)</label>
              <Input value={newGroup.description} onChange={e => setNewGroup(g => ({ ...g, description: e.target.value }))} placeholder="وصف قصير للمجموعة" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">إضافة أعضاء</label>
              <Input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="بحث عن موظف..." className="mb-2" />
              <ScrollArea className="h-36 border rounded-lg p-1">
                {(allStaff as any[]).filter((s: any) => String(s.id || s._id) !== uid && (!memberSearch || (s.fullName || s.username)?.includes(memberSearch))).map((s: any) => {
                  const sid = String(s.id || s._id);
                  const sel = selectedMembers.includes(sid);
                  return (
                    <button key={sid} onClick={() => setSelectedMembers(p => sel ? p.filter(id => id !== sid) : [...p, sid])}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${sel ? "bg-black dark:bg-white border-black dark:border-white" : "border-black/20 dark:border-white/20"}`}>
                        {sel && <Check className={`w-3 h-3 ${sel ? "text-white dark:text-black" : ""}`} />}
                      </div>
                      <UserAvatar profilePhotoUrl={s.profilePhotoUrl} avatarConfig={s.avatarConfig} name={s.fullName || s.username} role={s.role} size="sm" />
                      <span className="text-sm truncate">{s.fullName || s.username}</span>
                      {s.role && <Badge className={`text-[9px] shrink-0 ${ROLE_COLORS[s.role] || ""}`}>{ROLE_LABELS[s.role] || s.role}</Badge>}
                    </button>
                  );
                })}
              </ScrollArea>
              {selectedMembers.length > 0 && <p className="text-xs text-black/40 dark:text-white/40 mt-1">تم اختيار {selectedMembers.length} عضو</p>}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>إلغاء</Button>
            <Button onClick={() => createGroup.mutate()} disabled={!newGroup.name.trim() || createGroup.isPending} data-testid="button-confirm-create-group">
              {createGroup.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : null}
              إنشاء المجموعة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Group Settings Dialog ────────────────────── */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">{activeGroup?.icon}</span>
              {activeGroup?.name}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 px-1">
              {activeGroup?.description && <p className="text-sm text-black/50 dark:text-white/50">{activeGroup.description}</p>}
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Users className="w-4 h-4" /> الأعضاء ({activeGroup?.memberIds?.length || 0})</h3>
                <div className="space-y-1">
                  {(activeGroup?.memberIds || []).map((m: any) => {
                    const memberId = String(m._id || m);
                    const isGroupAdmin = activeGroup?.adminIds?.some((a: any) => String(a._id || a) === memberId);
                    const isSelf = memberId === uid;
                    return (
                      <div key={memberId} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                        <UserAvatar profilePhotoUrl={m.profilePhotoUrl} avatarConfig={m.avatarConfig} name={m.fullName || m.username || "؟"} role={m.role} size="sm" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block">{m.fullName || m.username || "عضو"}</span>
                          {m.role && <span className="text-[10px] text-black/40 dark:text-white/40">{ROLE_LABELS[m.role] || m.role}</span>}
                        </div>
                        {isGroupAdmin && <Crown className="w-3.5 h-3.5 text-yellow-500 shrink-0" title="مشرف المجموعة" />}
                        {amGroupAdmin && !isSelf && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]" onClick={() => promoteAdmin.mutate({ userId: memberId, action: isGroupAdmin ? "demote" : "promote" })}>
                              {isGroupAdmin ? <Crown className="w-3 h-3 text-yellow-500" /> : <Crown className="w-3 h-3 text-black/30 dark:text-white/30" />}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 px-1.5 text-red-500" onClick={() => { if (confirm("إزالة العضو؟")) removeMember.mutate(memberId); }}>
                              <UserMinus className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="border-t pt-3 space-y-2">
                {amGroupAdmin && (
                  <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => { setSettingsOpen(false); setAddMemberOpen(true); }}>
                    <UserPlus className="w-4 h-4" /> إضافة أعضاء
                  </Button>
                )}
                <Button variant="outline" size="sm" className="w-full gap-2 text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => { if (confirm("مغادرة المجموعة؟")) leaveGroup.mutate(); }}>
                  <LogOut className="w-4 h-4" /> مغادرة المجموعة
                </Button>
                {amGroupAdmin && (
                  <Button variant="outline" size="sm" className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50" onClick={() => { if (confirm("حذف المجموعة نهائياً؟")) deleteGroup.mutate(); }}>
                    <Trash2 className="w-4 h-4" /> حذف المجموعة
                  </Button>
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* ── Add Member Dialog ────────────────────────── */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader><DialogTitle>إضافة أعضاء جدد</DialogTitle></DialogHeader>
          <Input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="بحث عن موظف..." className="mb-2" />
          <ScrollArea className="h-48 border rounded-lg p-1">
            {availableStaff.filter((s: any) => !memberSearch || (s.fullName || s.username)?.includes(memberSearch)).map((s: any) => {
              const sid = String(s.id || s._id);
              const sel = selectedMembers.includes(sid);
              return (
                <button key={sid} onClick={() => setSelectedMembers(p => sel ? p.filter(id => id !== sid) : [...p, sid])}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${sel ? "bg-black dark:bg-white border-black dark:border-white" : "border-black/20 dark:border-white/20"}`}>
                    {sel && <Check className="w-3 h-3 text-white dark:text-black" />}
                  </div>
                  <span className="text-sm">{s.fullName || s.username}</span>
                  {s.role && <span className={`text-[9px] px-1.5 py-0.5 rounded shrink-0 ${ROLE_COLORS[s.role] || "bg-gray-100 text-gray-600"}`}>{ROLE_LABELS[s.role] || s.role}</span>}
                </button>
              );
            })}
          </ScrollArea>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setAddMemberOpen(false); setSelectedMembers([]); }}>إلغاء</Button>
            <Button onClick={() => addMembers.mutate()} disabled={selectedMembers.length === 0 || addMembers.isPending}>
              إضافة ({selectedMembers.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
