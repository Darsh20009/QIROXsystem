import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wrench, Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type ModificationRequest } from "@shared/schema";
import { useState } from "react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "قيد الانتظار", color: "bg-amber-100 text-amber-700" },
  in_review: { label: "قيد المراجعة", color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "قيد التنفيذ", color: "bg-indigo-100 text-indigo-700" },
  completed: { label: "مكتمل", color: "bg-green-100 text-green-700" },
  rejected: { label: "مرفوض", color: "bg-red-100 text-red-600" },
};

const priorityMap: Record<string, { label: string; color: string }> = {
  low: { label: "منخفض", color: "bg-gray-100 text-gray-600" },
  medium: { label: "متوسط", color: "bg-blue-100 text-blue-600" },
  high: { label: "عالي", color: "bg-amber-100 text-amber-600" },
  urgent: { label: "عاجل", color: "bg-red-100 text-red-600" },
};

export default function AdminModRequests() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<ModificationRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: requests, isLoading } = useQuery<ModificationRequest[]>({
    queryKey: ["/api/modification-requests"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ModificationRequest> }) => {
      const res = await apiRequest("PATCH", `/api/modification-requests/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modification-requests"] });
      toast({ title: "تم تحديث الطلب بنجاح" });
      setSelected(null);
    },
    onError: () => toast({ title: "خطأ في تحديث الطلب", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/modification-requests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modification-requests"] });
      toast({ title: "تم حذف الطلب" });
    },
    onError: () => toast({ title: "خطأ في حذف الطلب", variant: "destructive" }),
  });

  const openDetail = (req: ModificationRequest) => {
    setSelected(req);
    setEditStatus(req.status);
    setAdminNotes(req.adminNotes || "");
  };

  const handleSave = () => {
    if (!selected) return;
    updateMutation.mutate({
      id: selected.id,
      updates: { status: editStatus as any, adminNotes },
    });
  };

  const handleQuickStatus = (id: string, status: string) => {
    updateMutation.mutate({ id, updates: { status: status as any } });
  };

  const filtered = filterStatus === "all" ? requests : requests?.filter(r => r.status === filterStatus);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin w-8 h-8 text-black/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative overflow-hidden">
      <PageGraphics variant="dashboard" />
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-black flex items-center gap-3">
          <Wrench className="w-7 h-7 text-black/40" />
          طلبات التعديل
        </h1>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44" data-testid="select-mod-filter">
            <SelectValue placeholder="تصفية حسب الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الطلبات</SelectItem>
            {Object.entries(statusMap).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(statusMap).map(([key, val]) => (
          <div key={key} className="border border-black/[0.06] bg-white rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-black/[0.02]" onClick={() => setFilterStatus(key)}>
            <div className={`w-2 h-2 rounded-full ${key === "pending" ? "bg-amber-400" : key === "in_review" ? "bg-blue-400" : key === "in_progress" ? "bg-indigo-400" : key === "completed" ? "bg-green-500" : "bg-red-400"}`} />
            <div>
              <p className="text-lg font-bold text-black">{requests?.filter(r => r.status === key).length || 0}</p>
              <p className="text-xs text-black/40">{val.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border border-black/[0.06] bg-white rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.06]">
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">الطلب</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">الأولوية</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">الحالة</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">التاريخ</th>
                <th className="text-left p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered?.map((req) => {
                const st = statusMap[req.status] || statusMap["pending"];
                const pr = priorityMap[req.priority] || priorityMap["medium"];
                return (
                  <tr key={req.id} className="border-b border-black/[0.03] hover:bg-black/[0.02] transition-colors" data-testid={`row-mod-${req.id}`}>
                    <td className="p-4">
                      <p className="font-semibold text-black text-sm">{req.title}</p>
                      <p className="text-xs text-black/40 mt-0.5 line-clamp-1">{req.description}</p>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${pr.color}`}>
                        {pr.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-black/40">
                      {req.createdAt ? new Date(req.createdAt).toLocaleDateString("ar-SA") : "—"}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="text-black/60" onClick={() => openDetail(req)} data-testid={`button-view-mod-${req.id}`}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {req.status === "pending" && (
                          <>
                            <Button size="sm" variant="ghost" className="text-green-600 h-8 text-xs px-2" onClick={() => handleQuickStatus(req.id, "in_review")} data-testid={`button-review-mod-${req.id}`}>
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              مراجعة
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-500 h-8 text-xs px-2" onClick={() => handleQuickStatus(req.id, "rejected")} data-testid={`button-reject-mod-${req.id}`}>
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              رفض
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(!filtered || filtered.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-black/30">
                    <Wrench className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p>لا توجد طلبات تعديل {filterStatus !== "all" && `بحالة "${statusMap[filterStatus]?.label}"`}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="bg-white border-black/[0.06] text-black max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-black">تفاصيل طلب التعديل</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-4">
              <div className="border border-black/[0.06] rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-black">{selected.title}</h3>
                <p className="text-sm text-black/60">{selected.description}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${priorityMap[selected.priority]?.color}`}>
                    {priorityMap[selected.priority]?.label}
                  </span>
                  {selected.projectId && (
                    <span className="text-xs text-black/40">مشروع: #{selected.projectId.slice(-6)}</span>
                  )}
                  {selected.createdAt && (
                    <span className="text-xs text-black/30 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(selected.createdAt).toLocaleDateString("ar-SA")}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black/60 mb-1.5">تغيير الحالة</label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger data-testid="select-mod-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusMap).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black/60 mb-1.5">ملاحظات الأدمن (تُرسل للعميل)</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="اكتب ردك أو ملاحظاتك هنا..."
                  rows={3}
                  data-testid="input-admin-notes"
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSave} className="flex-1 premium-btn" disabled={updateMutation.isPending} data-testid="button-save-mod">
                  {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  حفظ التغييرات
                </Button>
                <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => { deleteMutation.mutate(selected.id); setSelected(null); }} disabled={deleteMutation.isPending}>
                  حذف
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
