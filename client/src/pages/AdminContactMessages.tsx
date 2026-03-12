import { useState } from "react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, MailOpen, Send, Trash2, Download, CheckCircle, Archive } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel } from "@/lib/excel";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  status: string;
  adminReply?: string;
  repliedAt?: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  read: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  replied: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  archived: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};
const STATUS_LABELS: Record<string, string> = {
  new: "جديدة", read: "مقروءة", replied: "تم الرد", archived: "مؤرشفة",
};

export default function AdminContactMessages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [replyMap, setReplyMap] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: messages, isLoading, isError, refetch } = useQuery<ContactMessage[]>({
    queryKey: ["/api/admin/contact-messages"],
    queryFn: async () => {
      const r = await fetch("/api/admin/contact-messages");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    refetchInterval: 30000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: { id: string; read?: boolean; status?: string; adminReply?: string }) =>
      apiRequest("PATCH", `/api/admin/contact-messages/${id}`, body).then(r => r.json()),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contact-messages"] });
      if (vars.adminReply) {
        setReplyMap(p => { const n = { ...p }; delete n[vars.id]; return n; });
        toast({ title: "تم إرسال الرد" });
      }
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/contact-messages/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contact-messages"] });
      toast({ title: "تم حذف الرسالة" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const filtered = (messages || []).filter(m => {
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    if (search && !m.name.includes(search) && !m.email.includes(search) && !m.subject.includes(search)) return false;
    return true;
  });

  const unreadCount = (messages || []).filter(m => !m.read).length;

  const exportExcel = () => {
    if (!messages) return;
    exportToExcel("contact-messages.xlsx", [{
      name: "رسائل التواصل",
      data: messages.map(m => ({
        التاريخ: new Date(m.createdAt).toLocaleString("ar-SA"),
        الاسم: m.name,
        البريد: m.email,
        الموضوع: m.subject || "—",
        الرسالة: m.message,
        الحالة: STATUS_LABELS[m.status] || m.status,
        الرد: m.adminReply || "—",
      })),
    }]);
  };

  const handleExpand = (msg: ContactMessage) => {
    if (expandedId === msg.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(msg.id);
    if (!msg.read) {
      updateMutation.mutate({ id: msg.id, read: true });
    }
  };

  return (
    <div className="relative overflow-hidden space-y-6" dir="rtl">
      <PageGraphics variant="dashboard" />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center">
            <Mail className="w-5 h-5 text-white dark:text-black" />
          </div>
          <div>
            <h1 className="text-xl font-black text-black dark:text-white" data-testid="text-page-title">رسائل التواصل</h1>
            <p className="text-xs text-black/35 dark:text-white/35">
              {(messages || []).length} رسالة — {unreadCount} غير مقروءة
            </p>
          </div>
        </div>
        <Button onClick={exportExcel} variant="outline" size="sm" className="gap-2 dark:text-white dark:border-white/10" data-testid="button-export">
          <Download className="w-4 h-4" />
          تصدير
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="بحث بالاسم أو البريد أو الموضوع..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs border-black/10 dark:border-white/10 dark:bg-gray-900 dark:text-white"
          data-testid="input-search"
        />
        <div className="flex gap-2">
          {["all", "new", "read", "replied", "archived"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? "bg-black dark:bg-white text-white dark:text-black" : "bg-black/[0.04] dark:bg-white/[0.04] text-black/50 dark:text-white/50"}`}
              data-testid={`button-filter-${s}`}>
              {s === "all" ? "الكل" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-black/20 dark:text-white/20" /></div>
      ) : isError ? (
        <div className="text-center py-16">
          <p className="text-black/40 dark:text-white/40 mb-3">حدث خطأ في تحميل الرسائل</p>
          <Button variant="outline" onClick={() => refetch()} className="dark:text-white dark:border-white/10" data-testid="button-retry">إعادة المحاولة</Button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-black/30 dark:text-white/30 py-16">لا توجد رسائل</p>
      ) : (
        <div className="space-y-4">
          {filtered.map(msg => (
            <Card
              key={msg.id}
              className={`border-black/[0.06] dark:border-white/[0.06] shadow-none rounded-2xl dark:bg-gray-900 cursor-pointer transition-all ${!msg.read ? "border-r-4 border-r-blue-500" : ""}`}
              data-testid={`card-message-${msg.id}`}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-3" onClick={() => handleExpand(msg)}>
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5">
                      {msg.read ? (
                        <MailOpen className="w-4 h-4 text-black/30 dark:text-white/30" />
                      ) : (
                        <Mail className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-black text-sm text-black dark:text-white" data-testid={`text-sender-${msg.id}`}>{msg.name}</span>
                        <Badge className={`text-[10px] px-2 py-0 ${STATUS_COLORS[msg.status]}`}>{STATUS_LABELS[msg.status] || msg.status}</Badge>
                      </div>
                      <p className="text-xs text-black/40 dark:text-white/40">{msg.email}</p>
                      {msg.subject && <p className="text-xs text-black/50 dark:text-white/50 font-semibold mt-0.5">{msg.subject}</p>}
                    </div>
                  </div>
                  <span className="text-[11px] text-black/25 dark:text-white/25 shrink-0">
                    {new Date(msg.createdAt).toLocaleDateString("ar-SA")}
                  </span>
                </div>

                {expandedId === msg.id && (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm text-black/60 dark:text-white/60 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl p-3 whitespace-pre-wrap">{msg.message}</p>

                    {msg.adminReply && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-xs font-bold text-green-700 dark:text-green-400">الرد</span>
                          {msg.repliedAt && <span className="text-[10px] text-green-500">{new Date(msg.repliedAt).toLocaleDateString("ar-SA")}</span>}
                        </div>
                        <p className="text-sm text-green-800 dark:text-green-300">{msg.adminReply}</p>
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm" variant="outline"
                        className="gap-1 text-xs dark:text-white dark:border-white/10"
                        onClick={() => updateMutation.mutate({ id: msg.id, status: "archived" })}
                        data-testid={`button-archive-${msg.id}`}
                      >
                        <Archive className="w-3.5 h-3.5" />
                        أرشفة
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        className="gap-1 text-xs text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                        onClick={() => { if (confirm("هل أنت متأكد من حذف هذه الرسالة؟")) deleteMutation.mutate(msg.id); }}
                        data-testid={`button-delete-${msg.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        حذف
                      </Button>
                    </div>

                    {msg.status !== "replied" && (
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="اكتب ردك على الرسالة..."
                          value={replyMap[msg.id] || ""}
                          onChange={e => setReplyMap(p => ({ ...p, [msg.id]: e.target.value }))}
                          rows={2}
                          className="text-sm border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                          data-testid={`textarea-reply-${msg.id}`}
                        />
                        <Button
                          size="sm"
                          className="bg-black dark:bg-white text-white dark:text-black self-end gap-1"
                          onClick={() => updateMutation.mutate({ id: msg.id, adminReply: replyMap[msg.id] })}
                          disabled={!replyMap[msg.id]?.trim() || updateMutation.isPending}
                          data-testid={`button-reply-${msg.id}`}
                        >
                          <Send className="w-3.5 h-3.5" />
                          رد
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}