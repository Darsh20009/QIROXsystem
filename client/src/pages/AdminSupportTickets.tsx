import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, LifeBuoy, CheckCircle, Send, Download } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface Ticket {
  id: string;
  userId: { fullName: string; email: string; username: string } | null;
  subject: string;
  category: string;
  body: string;
  priority: string;
  status: string;
  adminReply?: string;
  repliedAt?: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-700", in_review: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700", closed: "bg-gray-100 text-gray-500",
};
const STATUS_LABELS: Record<string, string> = {
  open: "مفتوحة", in_review: "قيد المراجعة", resolved: "تم الحل", closed: "مغلقة",
};
const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-500", medium: "bg-yellow-100 text-yellow-700", high: "bg-red-100 text-red-700",
};
const PRIORITY_LABELS: Record<string, string> = { low: "منخفض", medium: "متوسط", high: "عالي" };
const CAT_LABELS: Record<string, string> = {
  technical: "مشكلة تقنية", billing: "مالية", general: "استفسار عام", complaint: "شكوى",
};

export default function AdminSupportTickets() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [replyMap, setReplyMap] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/support-tickets"],
    queryFn: async () => {
      const r = await fetch("/api/support-tickets");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    refetchInterval: 30000,
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, status, adminReply }: { id: string; status: string; adminReply?: string }) =>
      apiRequest("PATCH", `/api/admin/support-tickets/${id}`, { status, adminReply }).then(r => r.json()),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/support-tickets"] });
      setReplyMap(p => { const n = { ...p }; delete n[vars.id]; return n; });
      toast({ title: "تم تحديث التذكرة" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const filtered = (tickets || []).filter(t => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (search && !t.subject.includes(search) && !t.userId?.fullName.includes(search)) return false;
    return true;
  });

  const exportExcel = () => {
    if (!tickets) return;
    const ws = XLSX.utils.json_to_sheet(tickets.map(t => ({
      التاريخ: new Date(t.createdAt).toLocaleString("ar-SA"),
      العميل: t.userId?.fullName || "-",
      البريد: t.userId?.email || "-",
      الموضوع: t.subject,
      التصنيف: CAT_LABELS[t.category],
      الأولوية: PRIORITY_LABELS[t.priority],
      الحالة: STATUS_LABELS[t.status],
      "رد الأدمن": t.adminReply || "-",
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "تذاكر الدعم");
    XLSX.writeFile(wb, "support-tickets.xlsx");
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center">
            <LifeBuoy className="w-5 h-5 text-white dark:text-black" />
          </div>
          <div>
            <h1 className="text-xl font-black text-black dark:text-white">إدارة تذاكر الدعم</h1>
            <p className="text-xs text-black/35 dark:text-white/35">{(tickets || []).length} تذكرة — {(tickets || []).filter(t => t.status === "open").length} مفتوحة</p>
          </div>
        </div>
        <Button onClick={exportExcel} variant="outline" size="sm" className="gap-2 dark:text-white dark:border-white/10">
          <Download className="w-4 h-4" />
          تصدير
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)}
          className="max-w-xs border-black/10 dark:border-white/10 dark:bg-gray-900 dark:text-white" />
        <div className="flex gap-2">
          {["all", "open", "in_review", "resolved", "closed"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? "bg-black dark:bg-white text-white dark:text-black" : "bg-black/[0.04] dark:bg-white/[0.04] text-black/50 dark:text-white/50"}`}>
              {s === "all" ? "الكل" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-black/20 dark:text-white/20" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-black/30 dark:text-white/30 py-16">لا توجد تذاكر</p>
      ) : (
        <div className="space-y-4">
          {filtered.map(ticket => (
            <Card key={ticket.id} className="border-black/[0.06] dark:border-white/[0.06] shadow-none rounded-2xl dark:bg-gray-900">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-black text-sm text-black dark:text-white">{ticket.subject}</span>
                      <Badge className={`text-[10px] px-2 py-0 ${STATUS_COLORS[ticket.status]}`}>{STATUS_LABELS[ticket.status]}</Badge>
                      <Badge className={`text-[10px] px-2 py-0 ${PRIORITY_COLORS[ticket.priority]}`}>{PRIORITY_LABELS[ticket.priority]}</Badge>
                      <span className="text-[10px] text-black/30 dark:text-white/30">{CAT_LABELS[ticket.category]}</span>
                    </div>
                    <p className="text-xs text-black/40 dark:text-white/40">{ticket.userId?.fullName} — {ticket.userId?.email}</p>
                  </div>
                  <span className="text-[11px] text-black/25 dark:text-white/25 shrink-0">
                    {new Date(ticket.createdAt).toLocaleDateString("ar-SA")}
                  </span>
                </div>

                <p className="text-sm text-black/60 dark:text-white/60 mb-3 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl p-3">{ticket.body}</p>

                {ticket.adminReply && (
                  <div className="mb-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-xs font-bold text-green-700 dark:text-green-400">ردك على التذكرة</span>
                    </div>
                    <p className="text-sm text-green-800 dark:text-green-300">{ticket.adminReply}</p>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <Select defaultValue={ticket.status} onValueChange={v => replyMutation.mutate({ id: ticket.id, status: v })}>
                    <SelectTrigger className="w-36 h-8 text-xs border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">مفتوحة</SelectItem>
                      <SelectItem value="in_review">قيد المراجعة</SelectItem>
                      <SelectItem value="resolved">تم الحل</SelectItem>
                      <SelectItem value="closed">مغلقة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-3 flex gap-2">
                  <Textarea
                    placeholder="اكتب ردك على التذكرة..."
                    value={replyMap[ticket.id] || ""}
                    onChange={e => setReplyMap(p => ({ ...p, [ticket.id]: e.target.value }))}
                    rows={2}
                    className="text-sm border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                    data-testid={`textarea-reply-${ticket.id}`}
                  />
                  <Button
                    size="sm"
                    className="bg-black dark:bg-white text-white dark:text-black self-end gap-1"
                    onClick={() => replyMutation.mutate({ id: ticket.id, status: "resolved", adminReply: replyMap[ticket.id] })}
                    disabled={!replyMap[ticket.id]?.trim() || replyMutation.isPending}
                    data-testid={`button-reply-${ticket.id}`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    رد
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
