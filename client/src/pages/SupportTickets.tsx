import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, LifeBuoy, Plus, Clock, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useI18n } from "@/lib/i18n";

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

export default function SupportTickets() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { lang, dir } = useI18n();
  const L = lang === "ar";

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", category: "general", body: "", priority: "medium" });

  const STATUS_LABELS: Record<string, string> = {
    open: L ? "مفتوحة" : "Open",
    in_review: L ? "قيد المراجعة" : "In Review",
    resolved: L ? "تم الحل" : "Resolved",
    closed: L ? "مغلقة" : "Closed",
  };
  const PRIORITY_COLORS: Record<string, string> = {
    low: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  const PRIORITY_LABELS: Record<string, string> = {
    low: L ? "منخفض" : "Low", medium: L ? "متوسط" : "Medium", high: L ? "عالٍ" : "High",
  };
  const CAT_LABELS: Record<string, string> = {
    technical: L ? "مشكلة تقنية" : "Technical Issue",
    billing: L ? "مالية" : "Billing",
    general: L ? "استفسار عام" : "General Inquiry",
    complaint: L ? "شكوى" : "Complaint",
  };

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
      toast({ title: L ? "تم إرسال التذكرة بنجاح" : "Ticket submitted successfully" });
    },
    onError: () => toast({ title: L ? "حدث خطأ" : "An error occurred", variant: "destructive" }),
  });

  return (
    <div className="space-y-6 relative overflow-hidden" dir={dir}>
      <PageGraphics variant="dashboard" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center">
            <LifeBuoy className="w-5 h-5 text-white dark:text-black" />
          </div>
          <div>
            <h1 className="text-xl font-black text-black dark:text-white">
              {L ? "الدعم الفني" : "Technical Support"}
            </h1>
            <p className="text-xs text-black/35 dark:text-white/35">
              {L ? "أرسل استفساراتك ومشاكلك للفريق" : "Send your inquiries and issues to the team"}
            </p>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black dark:bg-white text-white dark:text-black gap-2" data-testid="button-new-ticket">
              <Plus className="w-4 h-4" />
              {L ? "تذكرة جديدة" : "New Ticket"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md dark:bg-gray-900" dir={dir}>
            <DialogHeader>
              <DialogTitle className="dark:text-white">
                {L ? "فتح تذكرة دعم فني" : "Open Support Ticket"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-black/50 dark:text-white/50 mb-1 block">
                  {L ? "الموضوع" : "Subject"}
                </label>
                <Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  placeholder={L ? "وصف مختصر للمشكلة" : "Brief description of the issue"}
                  className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                  data-testid="input-ticket-subject" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-black/50 dark:text-white/50 mb-1 block">
                    {L ? "التصنيف" : "Category"}
                  </label>
                  <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                    <SelectTrigger className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">{L ? "مشكلة تقنية" : "Technical Issue"}</SelectItem>
                      <SelectItem value="billing">{L ? "مالية" : "Billing"}</SelectItem>
                      <SelectItem value="general">{L ? "استفسار عام" : "General Inquiry"}</SelectItem>
                      <SelectItem value="complaint">{L ? "شكوى" : "Complaint"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-black/50 dark:text-white/50 mb-1 block">
                    {L ? "الأولوية" : "Priority"}
                  </label>
                  <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                    <SelectTrigger className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{L ? "منخفض" : "Low"}</SelectItem>
                      <SelectItem value="medium">{L ? "متوسط" : "Medium"}</SelectItem>
                      <SelectItem value="high">{L ? "عالٍ" : "High"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-black/50 dark:text-white/50 mb-1 block">
                  {L ? "تفاصيل المشكلة" : "Issue Details"}
                </label>
                <Textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                  placeholder={L ? "اشرح مشكلتك بالتفصيل..." : "Describe your issue in detail..."}
                  rows={4} className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                  data-testid="input-ticket-body" />
              </div>
              <Button onClick={() => createMutation.mutate()}
                disabled={!form.subject || !form.body || createMutation.isPending}
                className="w-full bg-black dark:bg-white text-white dark:text-black"
                data-testid="button-submit-ticket">
                {createMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : L ? "إرسال التذكرة" : "Submit Ticket"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-black/20 dark:text-white/20" />
        </div>
      ) : (tickets || []).length === 0 ? (
        <div className="text-center py-16">
          <LifeBuoy className="w-12 h-12 text-black/10 dark:text-white/10 mx-auto mb-3" />
          <p className="text-black/30 dark:text-white/30">
            {L ? "لا يوجد تذاكر دعم بعد" : "No support tickets yet"}
          </p>
          <p className="text-xs text-black/20 dark:text-white/20 mt-1">
            {L ? "أنشئ تذكرة جديدة إذا واجهت أي مشكلة" : "Create a new ticket if you encounter any issue"}
          </p>
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
                          <span className="text-xs font-bold text-green-700 dark:text-green-400">
                            {L ? "رد الفريق" : "Team Reply"}
                          </span>
                        </div>
                        <p className="text-sm text-green-800 dark:text-green-300">{ticket.adminReply}</p>
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] text-black/25 dark:text-white/25 shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(ticket.createdAt).toLocaleDateString(L ? "ar-SA" : "en-US")}
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
