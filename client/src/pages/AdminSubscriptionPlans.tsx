import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Pencil, Trash2, Loader2, Crown, Clock, CheckCircle2, AlertCircle,
  Users, CreditCard, Layers, ChevronRight, RefreshCcw, Star
} from "lucide-react";
import { motion } from "framer-motion";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

interface SegmentPricing {
  id: string;
  segmentKey: string;
  segmentNameAr: string;
  monthlyPrice: number;
  sixMonthPrice: number;
  annualPrice: number;
  renewalPrice: number;
  isActive: boolean;
  sortOrder: number;
  notes: string;
}

interface ClientSubscription {
  id: string;
  fullName: string;
  email: string;
  subscriptionSegmentNameAr: string;
  subscriptionPeriod: string;
  subscriptionStartDate: string;
  subscriptionExpiresAt: string;
  subscriptionStatus: string;
}

interface SubServiceRequest {
  id: string;
  clientId: string;
  projectId?: string;
  projectLabel?: string;
  serviceType: string;
  notes: string;
  status: string;
  adminNotes: string;
  createdAt: string;
}

const periodLabels: Record<string, string> = {
  monthly: "شهري",
  "6months": "6 أشهر",
  annual: "سنوي",
  renewal: "تجديد سنوي",
};

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  active: { label: "نشط", color: "text-green-700", bg: "bg-green-50 border-green-200", icon: CheckCircle2 },
  expired: { label: "منتهي", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: AlertCircle },
  none: { label: "بدون اشتراك", color: "text-gray-500", bg: "bg-gray-50 border-gray-200", icon: Clock },
  pending: { label: "قيد المراجعة", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Clock },
  reviewing: { label: "جاري المراجعة", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: RefreshCcw },
  approved: { label: "مقبول", color: "text-green-700", bg: "bg-green-50 border-green-200", icon: CheckCircle2 },
  rejected: { label: "مرفوض", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: AlertCircle },
};

const emptySegment: Partial<SegmentPricing> = {
  segmentKey: "",
  segmentNameAr: "",
  monthlyPrice: 0,
  sixMonthPrice: 0,
  annualPrice: 0,
  renewalPrice: 0,
  isActive: true,
  sortOrder: 0,
  notes: "",
};

export default function AdminSubscriptionPlans() {
  const { toast } = useToast();
  const [segmentDialog, setSegmentDialog] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Partial<SegmentPricing>>(emptySegment);
  const [isEditMode, setIsEditMode] = useState(false);
  const [subDialog, setSubDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientSubscription | null>(null);
  const [subForm, setSubForm] = useState({ segmentId: "", segmentNameAr: "", period: "monthly", startDate: "", expiresAt: "" });
  const [reqDialog, setReqDialog] = useState(false);
  const [selectedReq, setSelectedReq] = useState<SubServiceRequest | null>(null);
  const [reqStatus, setReqStatus] = useState("");
  const [reqAdminNotes, setReqAdminNotes] = useState("");

  const { data: segments, isLoading: loadingSegments } = useQuery<SegmentPricing[]>({
    queryKey: ["/api/admin/segment-pricing"],
  });

  const { data: subscriptions, isLoading: loadingSubs } = useQuery<ClientSubscription[]>({
    queryKey: ["/api/admin/subscriptions"],
  });

  const { data: subRequests, isLoading: loadingReqs } = useQuery<SubServiceRequest[]>({
    queryKey: ["/api/admin/sub-service-requests"],
  });

  const createSegment = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/segment-pricing", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/segment-pricing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/segment-pricing"] });
      setSegmentDialog(false);
      toast({ title: "تم إضافة القطاع بنجاح" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const updateSegment = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PUT", `/api/admin/segment-pricing/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/segment-pricing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/segment-pricing"] });
      setSegmentDialog(false);
      toast({ title: "تم تحديث القطاع بنجاح" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const deleteSegment = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/segment-pricing/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/segment-pricing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/segment-pricing"] });
      toast({ title: "تم حذف القطاع" });
    },
  });

  const setSubscription = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) =>
      apiRequest("POST", `/api/admin/users/${userId}/subscription`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
      setSubDialog(false);
      toast({ title: "تم تعيين الاشتراك بنجاح" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const updateRequest = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PATCH", `/api/admin/sub-service-requests/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sub-service-requests"] });
      setReqDialog(false);
      toast({ title: "تم تحديث الطلب" });
    },
  });

  const handleSaveSegment = () => {
    const data = {
      ...editingSegment,
      monthlyPrice: Number(editingSegment.monthlyPrice || 0),
      sixMonthPrice: Number(editingSegment.sixMonthPrice || 0),
      annualPrice: Number(editingSegment.annualPrice || 0),
      renewalPrice: Number(editingSegment.renewalPrice || 0),
      sortOrder: Number(editingSegment.sortOrder || 0),
    };
    if (isEditMode && editingSegment.id) {
      updateSegment.mutate({ id: editingSegment.id, data });
    } else {
      createSegment.mutate(data);
    }
  };

  const handleSetSub = () => {
    if (!selectedClient) return;
    setSubscription.mutate({ userId: selectedClient.id, data: subForm });
  };

  const openSubDialog = (client: ClientSubscription) => {
    setSelectedClient(client);
    const today = new Date().toISOString().split("T")[0];
    setSubForm({
      segmentId: "",
      segmentNameAr: client.subscriptionSegmentNameAr || "",
      period: client.subscriptionPeriod || "monthly",
      startDate: today,
      expiresAt: "",
    });
    setSubDialog(true);
  };

  const openReqDialog = (req: SubServiceRequest) => {
    setSelectedReq(req);
    setReqStatus(req.status);
    setReqAdminNotes(req.adminNotes || "");
    setReqDialog(true);
  };

  const openNewSegment = () => {
    setEditingSegment({ ...emptySegment });
    setIsEditMode(false);
    setSegmentDialog(true);
  };

  const openEditSegment = (seg: SegmentPricing) => {
    setEditingSegment({ ...seg });
    setIsEditMode(true);
    setSegmentDialog(true);
  };

  const pendingReqs = subRequests?.filter(r => r.status === "pending").length || 0;

  return (
    <div className="min-h-screen bg-[#f8f8f8] relative overflow-hidden" dir="rtl">
      <PageGraphics variant="dashboard" />
      <div className="bg-white border-b border-black/[0.06]">
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-black font-heading">إدارة الاشتراكات والأسعار</h1>
                <p className="text-xs text-black/40 mt-0.5">تحكم في أسعار القطاعات وإدارة اشتراكات العملاء</p>
              </div>
            </div>
            {pendingReqs > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-bold text-amber-700">{pendingReqs} طلب جديد بانتظار المراجعة</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <Tabs defaultValue="pricing">
          <TabsList className="mb-8 bg-white border border-black/[0.06] rounded-2xl p-1 gap-1 h-12">
            <TabsTrigger value="pricing" className="rounded-xl font-bold text-xs data-[state=active]:bg-black data-[state=active]:text-white h-9 px-5 gap-2">
              <CreditCard className="w-3.5 h-3.5" /> أسعار القطاعات
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="rounded-xl font-bold text-xs data-[state=active]:bg-black data-[state=active]:text-white h-9 px-5 gap-2">
              <Users className="w-3.5 h-3.5" /> اشتراكات العملاء
            </TabsTrigger>
            <TabsTrigger value="requests" className="rounded-xl font-bold text-xs data-[state=active]:bg-black data-[state=active]:text-white h-9 px-5 relative gap-2">
              <Layers className="w-3.5 h-3.5" /> طلبات الخدمات الفرعية
              {pendingReqs > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {pendingReqs}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ─── PRICING TAB ─── */}
          <TabsContent value="pricing">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-black flex items-center gap-2">
                <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5 text-white" />
                </div>
                قطاعات الأسعار
              </h2>
              <Button onClick={openNewSegment} className="bg-black text-white hover:bg-black/80 rounded-xl h-9 px-5 text-xs gap-2 font-bold" data-testid="button-add-segment">
                <Plus className="w-3.5 h-3.5" /> إضافة قطاع
              </Button>
            </div>

            {loadingSegments ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-black/20" />
              </div>
            ) : !segments || segments.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-black/[0.06] p-16 text-center">
                <CreditCard className="w-10 h-10 text-black/10 mx-auto mb-4" />
                <h3 className="font-bold text-black/40 mb-2">لا توجد قطاعات بعد</h3>
                <p className="text-xs text-black/30 mb-6">أضف قطاع وحدد الأسعار المناسبة لكل فترة</p>
                <Button onClick={openNewSegment} className="bg-black text-white hover:bg-black/80 rounded-xl h-9 px-5 text-xs gap-2">
                  <Plus className="w-3.5 h-3.5" /> إضافة أول قطاع
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {segments.map((seg, i) => (
                  <motion.div key={seg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                    <div className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden hover:shadow-lg transition-all duration-300 group" data-testid={`segment-card-${seg.id}`}>
                      <div className="bg-black px-5 py-4 flex items-center justify-between">
                        <div>
                          <h3 className="font-black text-white text-sm">{seg.segmentNameAr}</h3>
                          <p className="text-white/40 text-[10px] mt-0.5">{seg.segmentKey}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!seg.isActive && (
                            <Badge className="bg-white/10 text-white/60 border-0 text-[10px]">غير نشط</Badge>
                          )}
                          <button onClick={() => openEditSegment(seg)} className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors" data-testid={`button-edit-segment-${seg.id}`}>
                            <Pencil className="w-3.5 h-3.5 text-white" />
                          </button>
                          <button onClick={() => { if (confirm("حذف هذا القطاع؟")) deleteSegment.mutate(seg.id); }} className="w-7 h-7 bg-white/10 hover:bg-red-500/20 rounded-lg flex items-center justify-center transition-colors" data-testid={`button-delete-segment-${seg.id}`}>
                            <Trash2 className="w-3.5 h-3.5 text-white" />
                          </button>
                        </div>
                      </div>
                      <div className="p-5 grid grid-cols-2 gap-3">
                        {[
                          { label: "شهري", value: seg.monthlyPrice, accent: false },
                          { label: "6 أشهر", value: seg.sixMonthPrice, accent: false },
                          { label: "سنوي", value: seg.annualPrice, accent: true },
                          { label: "تجديد سنوي", value: seg.renewalPrice, accent: false },
                        ].map(({ label, value, accent }) => (
                          <div key={label} className={`rounded-xl p-3 text-center ${accent ? "bg-black" : "bg-black/[0.03]"}`}>
                            <p className={`text-[10px] mb-1 ${accent ? "text-white/50" : "text-black/40"}`}>{label}</p>
                            <p className={`text-lg font-black ${accent ? "text-white" : "text-black"}`}>{value.toLocaleString()}</p>
                            <p className={`text-[9px] ${accent ? "text-white/40" : "text-black/30"}`}>ر.س شامل الضريبة</p>
                          </div>
                        ))}
                      </div>
                      {seg.notes && (
                        <div className="px-5 pb-4">
                          <p className="text-[10px] text-black/40 bg-black/[0.02] rounded-lg p-2">{seg.notes}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ─── SUBSCRIPTIONS TAB ─── */}
          <TabsContent value="subscriptions">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-black flex items-center gap-2">
                <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-white" />
                </div>
                اشتراكات العملاء النشطة
              </h2>
            </div>

            {loadingSubs ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-black/20" />
              </div>
            ) : !subscriptions || subscriptions.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-black/[0.06] p-16 text-center">
                <Users className="w-10 h-10 text-black/10 mx-auto mb-4" />
                <h3 className="font-bold text-black/40 mb-2">لا توجد اشتراكات نشطة</h3>
                <p className="text-xs text-black/30">اشتراكات العملاء ستظهر هنا فور تعيينها</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-black/[0.06] bg-black/[0.02]">
                      <th className="text-right text-[11px] font-bold text-black/40 px-6 py-3">العميل</th>
                      <th className="text-right text-[11px] font-bold text-black/40 px-4 py-3">القطاع</th>
                      <th className="text-right text-[11px] font-bold text-black/40 px-4 py-3">الفترة</th>
                      <th className="text-right text-[11px] font-bold text-black/40 px-4 py-3">تاريخ الانتهاء</th>
                      <th className="text-right text-[11px] font-bold text-black/40 px-4 py-3">الحالة</th>
                      <th className="text-right text-[11px] font-bold text-black/40 px-4 py-3">إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub, i) => {
                      const st = statusConfig[sub.subscriptionStatus] || statusConfig.none;
                      const StatusIcon = st.icon;
                      const expiresAt = sub.subscriptionExpiresAt ? new Date(sub.subscriptionExpiresAt) : null;
                      const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / 86400000) : null;
                      return (
                        <tr key={sub.id} className={`border-b border-black/[0.04] hover:bg-black/[0.01] transition-colors ${i % 2 === 0 ? "" : "bg-black/[0.01]"}`}>
                          <td className="px-6 py-4">
                            <p className="font-bold text-sm text-black">{sub.fullName}</p>
                            <p className="text-[10px] text-black/40">{sub.email}</p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm text-black/70">{sub.subscriptionSegmentNameAr || "—"}</p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm text-black/70">{periodLabels[sub.subscriptionPeriod] || "—"}</p>
                          </td>
                          <td className="px-4 py-4">
                            {expiresAt ? (
                              <div>
                                <p className="text-sm text-black/70">{expiresAt.toLocaleDateString("ar-SA")}</p>
                                {daysLeft !== null && (
                                  <p className={`text-[10px] font-bold ${daysLeft <= 7 ? "text-red-600" : daysLeft <= 30 ? "text-amber-600" : "text-green-600"}`}>
                                    {daysLeft > 0 ? `متبقي ${daysLeft} يوم` : "منتهي"}
                                  </p>
                                )}
                              </div>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-4">
                            <Badge className={`text-[10px] border gap-1 ${st.bg} ${st.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {st.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <Button size="sm" variant="outline" onClick={() => openSubDialog(sub)} className="h-7 px-3 text-[11px] rounded-lg border-black/[0.08] gap-1" data-testid={`button-set-sub-${sub.id}`}>
                              <RefreshCcw className="w-3 h-3" /> تجديد
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* ─── SUB-SERVICE REQUESTS TAB ─── */}
          <TabsContent value="requests">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-black flex items-center gap-2">
                <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center">
                  <Layers className="w-3.5 h-3.5 text-white" />
                </div>
                طلبات الخدمات الفرعية
              </h2>
            </div>

            {loadingReqs ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-black/20" />
              </div>
            ) : !subRequests || subRequests.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-black/[0.06] p-16 text-center">
                <Layers className="w-10 h-10 text-black/10 mx-auto mb-4" />
                <h3 className="font-bold text-black/40 mb-2">لا توجد طلبات بعد</h3>
                <p className="text-xs text-black/30">طلبات العملاء للخدمات الفرعية ستظهر هنا</p>
              </div>
            ) : (
              <div className="space-y-3">
                {subRequests.map((req, i) => {
                  const st = statusConfig[req.status] || statusConfig.pending;
                  const StatusIcon = st.icon;
                  return (
                    <motion.div key={req.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <div className="bg-white rounded-2xl border border-black/[0.06] p-5 flex items-center gap-4 hover:shadow-md transition-all" data-testid={`req-card-${req.id}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${st.bg} border ${st.bg}`}>
                          <StatusIcon className={`w-4.5 h-4.5 ${st.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-sm text-black">{req.serviceType}</p>
                            {req.projectLabel && (
                              <Badge className="bg-black/[0.04] text-black/50 border-0 text-[10px]">مشروع: {req.projectLabel}</Badge>
                            )}
                            <Badge className={`text-[10px] border ${st.bg} ${st.color}`}>
                              {st.label}
                            </Badge>
                          </div>
                          {req.notes && <p className="text-[11px] text-black/40 mt-1 truncate">{req.notes}</p>}
                          <p className="text-[10px] text-black/30 mt-1">
                            {new Date(req.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => openReqDialog(req)} className="h-8 px-3 text-[11px] rounded-xl border-black/[0.08] gap-1 flex-shrink-0" data-testid={`button-review-req-${req.id}`}>
                          <ChevronRight className="w-3 h-3" /> مراجعة
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ─── SEGMENT DIALOG ─── */}
      <Dialog open={segmentDialog} onOpenChange={setSegmentDialog}>
        <DialogContent className="max-w-lg rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-black text-lg">{isEditMode ? "تعديل القطاع" : "إضافة قطاع جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-black/60 mb-1 block">مفتاح القطاع (بالإنجليزية)</label>
                <Input
                  value={editingSegment.segmentKey || ""}
                  onChange={e => setEditingSegment(p => ({ ...p, segmentKey: e.target.value }))}
                  placeholder="restaurants"
                  className="rounded-xl h-9 text-sm border-black/[0.08]"
                  data-testid="input-segment-key"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-black/60 mb-1 block">اسم القطاع (بالعربية)</label>
                <Input
                  value={editingSegment.segmentNameAr || ""}
                  onChange={e => setEditingSegment(p => ({ ...p, segmentNameAr: e.target.value }))}
                  placeholder="المطاعم والكافيهات"
                  className="rounded-xl h-9 text-sm border-black/[0.08]"
                  data-testid="input-segment-name-ar"
                />
              </div>
            </div>

            <div className="bg-black/[0.02] rounded-2xl p-4 space-y-3">
              <p className="text-xs font-black text-black/50 mb-3 flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5" /> أسعار الاشتراك (شامل الضريبة)
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "شهري (ر.س)", key: "monthlyPrice" as keyof SegmentPricing },
                  { label: "6 أشهر (ر.س)", key: "sixMonthPrice" as keyof SegmentPricing },
                  { label: "سنوي (ر.س)", key: "annualPrice" as keyof SegmentPricing },
                  { label: "تجديد سنوي (ر.س)", key: "renewalPrice" as keyof SegmentPricing },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="text-[11px] font-bold text-black/50 mb-1 block">{label}</label>
                    <Input
                      type="number"
                      value={(editingSegment as any)[key] || ""}
                      onChange={e => setEditingSegment(p => ({ ...p, [key]: e.target.value }))}
                      className="rounded-xl h-9 text-sm border-black/[0.08]"
                      data-testid={`input-${key}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-black/60 mb-1 block">ملاحظات (اختياري)</label>
              <Textarea
                value={editingSegment.notes || ""}
                onChange={e => setEditingSegment(p => ({ ...p, notes: e.target.value }))}
                className="rounded-xl text-sm border-black/[0.08] resize-none"
                rows={2}
                data-testid="input-segment-notes"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-black/60">مرتبة العرض</label>
              <Input
                type="number"
                value={editingSegment.sortOrder ?? 0}
                onChange={e => setEditingSegment(p => ({ ...p, sortOrder: Number(e.target.value) }))}
                className="rounded-xl h-9 text-sm border-black/[0.08] w-24"
                data-testid="input-sort-order"
              />
              <label className="flex items-center gap-2 cursor-pointer mr-auto">
                <input
                  type="checkbox"
                  checked={editingSegment.isActive ?? true}
                  onChange={e => setEditingSegment(p => ({ ...p, isActive: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-xs font-bold text-black/60">نشط</span>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSaveSegment} disabled={createSegment.isPending || updateSegment.isPending} className="flex-1 bg-black text-white hover:bg-black/80 rounded-xl h-10 text-sm font-bold" data-testid="button-save-segment">
                {(createSegment.isPending || updateSegment.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditMode ? "حفظ التعديلات" : "إضافة القطاع"}
              </Button>
              <Button onClick={() => setSegmentDialog(false)} variant="outline" className="rounded-xl h-10 px-4 border-black/[0.08]">إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── SET SUBSCRIPTION DIALOG ─── */}
      <Dialog open={subDialog} onOpenChange={setSubDialog}>
        <DialogContent className="max-w-md rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-black text-lg">تعيين اشتراك للعميل</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4 mt-2">
              <div className="bg-black rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white font-black text-sm">
                  {selectedClient.fullName?.charAt(0) || "U"}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{selectedClient.fullName}</p>
                  <p className="text-white/40 text-[11px]">{selectedClient.email}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-black/60 mb-1 block">القطاع</label>
                <Select value={subForm.segmentId} onValueChange={v => {
                  const seg = segments?.find(s => s.id === v);
                  setSubForm(p => ({ ...p, segmentId: v, segmentNameAr: seg?.segmentNameAr || "" }));
                }}>
                  <SelectTrigger className="rounded-xl h-9 text-sm border-black/[0.08]">
                    <SelectValue placeholder="اختر القطاع" />
                  </SelectTrigger>
                  <SelectContent>
                    {segments?.map(seg => (
                      <SelectItem key={seg.id} value={seg.id}>{seg.segmentNameAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-bold text-black/60 mb-1 block">فترة الاشتراك</label>
                <Select value={subForm.period} onValueChange={v => setSubForm(p => ({ ...p, period: v }))}>
                  <SelectTrigger className="rounded-xl h-9 text-sm border-black/[0.08]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">شهري (30 يوم)</SelectItem>
                    <SelectItem value="6months">6 أشهر (180 يوم)</SelectItem>
                    <SelectItem value="annual">سنوي (365 يوم)</SelectItem>
                    <SelectItem value="renewal">تجديد سنوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-black/60 mb-1 block">تاريخ البدء</label>
                  <Input type="date" value={subForm.startDate} onChange={e => setSubForm(p => ({ ...p, startDate: e.target.value }))} className="rounded-xl h-9 text-sm border-black/[0.08]" />
                </div>
                <div>
                  <label className="text-xs font-bold text-black/60 mb-1 block">تاريخ الانتهاء</label>
                  <Input type="date" value={subForm.expiresAt} onChange={e => setSubForm(p => ({ ...p, expiresAt: e.target.value }))} className="rounded-xl h-9 text-sm border-black/[0.08]" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={handleSetSub} disabled={setSubscription.isPending || !subForm.segmentId || !subForm.expiresAt} className="flex-1 bg-black text-white hover:bg-black/80 rounded-xl h-10 text-sm font-bold">
                  {setSubscription.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "تعيين الاشتراك"}
                </Button>
                <Button onClick={() => setSubDialog(false)} variant="outline" className="rounded-xl h-10 px-4 border-black/[0.08]">إلغاء</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── REQUEST REVIEW DIALOG ─── */}
      <Dialog open={reqDialog} onOpenChange={setReqDialog}>
        <DialogContent className="max-w-md rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-black text-lg">مراجعة طلب الخدمة الفرعية</DialogTitle>
          </DialogHeader>
          {selectedReq && (
            <div className="space-y-4 mt-2">
              <div className="bg-black/[0.03] rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-black/50">نوع الخدمة:</p>
                  <p className="text-sm font-bold text-black">{selectedReq.serviceType}</p>
                </div>
                {selectedReq.projectLabel && (
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-black/50">المشروع:</p>
                    <p className="text-sm text-black/70">{selectedReq.projectLabel}</p>
                  </div>
                )}
                {selectedReq.notes && (
                  <div>
                    <p className="text-xs font-bold text-black/50 mb-1">ملاحظات العميل:</p>
                    <p className="text-xs text-black/60 bg-white rounded-lg p-2">{selectedReq.notes}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-black/60 mb-1 block">الحالة</label>
                <Select value={reqStatus} onValueChange={setReqStatus}>
                  <SelectTrigger className="rounded-xl h-9 text-sm border-black/[0.08]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">قيد المراجعة</SelectItem>
                    <SelectItem value="reviewing">جاري المراجعة</SelectItem>
                    <SelectItem value="approved">مقبول</SelectItem>
                    <SelectItem value="rejected">مرفوض</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-bold text-black/60 mb-1 block">ملاحظات الإدارة (اختياري)</label>
                <Textarea value={reqAdminNotes} onChange={e => setReqAdminNotes(e.target.value)} className="rounded-xl text-sm border-black/[0.08] resize-none" rows={3} placeholder="أضف ملاحظاتك هنا..." />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => updateRequest.mutate({ id: selectedReq.id, data: { status: reqStatus, adminNotes: reqAdminNotes } })}
                  disabled={updateRequest.isPending}
                  className="flex-1 bg-black text-white hover:bg-black/80 rounded-xl h-10 text-sm font-bold"
                >
                  {updateRequest.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "حفظ"}
                </Button>
                <Button onClick={() => setReqDialog(false)} variant="outline" className="rounded-xl h-10 px-4 border-black/[0.08]">إلغاء</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
