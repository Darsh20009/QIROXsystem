import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, LifeBuoy, Plus, MessageSquare, Clock, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

interface Ticket {
  id: string;
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

export default function SupportTickets() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", category: "general", body: "", priority: "medium" });

  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/support-tickets"],
    queryFn: async () => {
      const r = await fetch("/api/support-tickets");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/support-tickets", form).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support-tickets"] });
      setOpen(false);
      setForm({ subject: "", category: "general", body: "", priority: "medium" });
      toast({ title: "تم إرسال التذكرة بنجاح" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  return (
    <div className="space-y-6 relative overflow-hidden" dir="rtl">
      <PageGraphics variant="dashboard" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center">
            <LifeBuoy className="w-5 h-5 text-white dark:text-black" />
          </div>
          <div>
            <h1 className="text-xl font-black text-black dark:text-white">الدعم الفني</h1>
            <p className="text-xs text-black/35 dark:text-white/35">أرسل استفساراتك ومشاكلك للفريق</p>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black dark:bg-white text-white dark:text-black gap-2" data-testid="button-new-ticket">
              <Plus className="w-4 h-4" />
              تذكرة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md dark:bg-gray-900" dir="rtl">
            <DialogHeader>
              <DialogTitle className="dark:text-white">فتح تذكرة دعم فني</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-black/50 dark:text-white/50 mb-1 block">الموضوع</label>
                <Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  placeholder="وصف مختصر للمشكلة" className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                  data-testid="input-ticket-subject" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-black/50 dark:text-white/50 mb-1 block">التصنيف</label>
                  <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                    <SelectTrigger className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">مشكلة تقنية</SelectItem>
                      <SelectItem value="billing">مالية</SelectItem>
                      <SelectItem value="general">استفسار عام</SelectItem>
                      <SelectItem value="complaint">شكوى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-black/50 dark:text-white/50 mb-1 block">الأولوية</label>
                  <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                    <SelectTrigger className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفض</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="high">عالي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-black/50 dark:text-white/50 mb-1 block">تفاصيل المشكلة</label>
                <Textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                  placeholder="اشرح مشكلتك بالتفصيل..." rows={4}
                  className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                  data-testid="input-ticket-body" />
              </div>
              <Button onClick={() => createMutation.mutate()} disabled={!form.subject || !form.body || createMutation.isPending}
                className="w-full bg-black dark:bg-white text-white dark:text-black" data-testid="button-submit-ticket">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "إرسال التذكرة"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-black/20 dark:text-white/20" /></div>
      ) : (tickets || []).length === 0 ? (
        <div className="text-center py-16">
          <LifeBuoy className="w-12 h-12 text-black/10 dark:text-white/10 mx-auto mb-3" />
          <p className="text-black/30 dark:text-white/30">لا يوجد تذاكر دعم بعد</p>
          <p className="text-xs text-black/20 dark:text-white/20 mt-1">أنشئ تذكرة جديدة إذا واجهت أي مشكلة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(tickets || []).map(ticket => (
            <Card key={ticket.id} className="border-black/[0.06] dark:border-white/[0.06] shadow-none rounded-2xl dark:bg-gray-900">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-sm text-black dark:text-white">{ticket.subject}</h3>
                      <Badge className={`text-[10px] px-2 py-0 ${STATUS_COLORS[ticket.status]}`}>
                        {STATUS_LABELS[ticket.status]}
                      </Badge>
                      <Badge className={`text-[10px] px-2 py-0 ${PRIORITY_COLORS[ticket.priority]}`}>
                        {PRIORITY_LABELS[ticket.priority]}
                      </Badge>
                    </div>
                    <p className="text-xs text-black/40 dark:text-white/40 mb-1">{CAT_LABELS[ticket.category]}</p>
                    <p className="text-sm text-black/60 dark:text-white/60 line-clamp-2">{ticket.body}</p>
                    {ticket.adminReply && (
                      <div className="mt-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-xs font-bold text-green-700 dark:text-green-400">رد الفريق</span>
                        </div>
                        <p className="text-sm text-green-800 dark:text-green-300">{ticket.adminReply}</p>
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] text-black/25 dark:text-white/25 shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(ticket.createdAt).toLocaleDateString("ar-SA")}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
