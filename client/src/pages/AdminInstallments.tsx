// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, CheckCircle, XCircle, Lock, Unlock, Eye, AlertTriangle, Banknote, RefreshCw } from "lucide-react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

const PERIOD_LABELS = { monthly: "شهرية", sixmonth: "نصف سنوية", annual: "سنوية", lifetime: "مدى الحياة", any: "أي فترة" };
const TIER_LABELS = { lite: "Lite", pro: "Pro", infinite: "Infinite", lifetime: "Lifetime", any: "أي باقة" };
const STATUS_COLOR = { pending: "bg-yellow-100 text-yellow-700", approved: "bg-blue-100 text-blue-700", active: "bg-green-100 text-green-700", completed: "bg-teal-100 text-teal-700", rejected: "bg-red-100 text-red-700", suspended: "bg-orange-100 text-orange-700", cancelled: "bg-gray-100 text-gray-600" };
const STATUS_LABEL = { pending: "بانتظار الموافقة", approved: "موافق عليه", active: "نشط", completed: "مكتمل", rejected: "مرفوض", suspended: "موقوف (مقفل)", cancelled: "ملغي" };
const PAYMENT_STATUS = { pending: "بانتظار الدفع", paid: "مدفوع", late: "متأخر", penalized: "مع غرامة", waived: "معفو عنه" };
const PAYMENT_COLOR = { pending: "bg-gray-100 text-gray-600", paid: "bg-green-100 text-green-700", late: "bg-red-100 text-red-700", penalized: "bg-orange-100 text-orange-700", waived: "bg-purple-100 text-purple-700" };

function serviceFeeByPeriod(period: string) {
  if (period === "monthly") return 25;
  if (period === "sixmonth") return 50;
  return 100;
}

export default function AdminInstallments() {
  const { data: user } = useUser();
  const { toast } = useToast();
  const isAdmin = user && ["admin", "manager"].includes(user.role);

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [viewApp, setViewApp] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(null);

  const [offerForm, setOfferForm] = useState({
    title: "", titleAr: "", description: "", descriptionAr: "",
    planTier: "any", planPeriod: "any", planSegment: "",
    installmentCount: 4, serviceFee: 100, penaltyAmount: 50, gracePeriodDays: 7,
  });

  const { data: offers = [], isLoading: loadingOffers } = useQuery({ queryKey: ["/api/admin/installment/offers"] });
  const { data: applications = [], isLoading: loadingApps } = useQuery({ queryKey: ["/api/admin/installment/applications"] });
  const { data: appDetail } = useQuery({
    queryKey: ["/api/admin/installment/applications", viewApp],
    enabled: !!viewApp,
    queryFn: () => apiRequest("GET", `/api/admin/installment/applications/${viewApp}`).then(r => r.json()),
  });

  const createOffer = useMutation({
    mutationFn: (data) => apiRequest("POST", "/api/admin/installment/offers", data).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/installment/offers"] }); setShowOfferModal(false); toast({ title: "تم إنشاء العرض" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const updateOffer = useMutation({
    mutationFn: ({ id, data }) => apiRequest("PUT", `/api/admin/installment/offers/${id}`, data).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/installment/offers"] }); setShowOfferModal(false); setEditingOffer(null); toast({ title: "تم تحديث العرض" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const toggleOffer = useMutation({
    mutationFn: (id) => apiRequest("PATCH", `/api/admin/installment/offers/${id}/toggle`).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/installment/offers"] }),
  });

  const deleteOffer = useMutation({
    mutationFn: (id) => apiRequest("DELETE", `/api/admin/installment/offers/${id}`).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/installment/offers"] }); toast({ title: "تم حذف العرض" }); },
  });

  const approveApp = useMutation({
    mutationFn: ({ id, notes }) => apiRequest("PATCH", `/api/admin/installment/applications/${id}/approve`, { adminNotes: notes }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/installment/applications"] }); toast({ title: "تمت الموافقة على الطلب" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const rejectApp = useMutation({
    mutationFn: ({ id, reason }) => apiRequest("PATCH", `/api/admin/installment/applications/${id}/reject`, { rejectionReason: reason }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/installment/applications"] }); setShowRejectModal(null); setRejectReason(""); toast({ title: "تم رفض الطلب" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const lockApp = useMutation({
    mutationFn: (id) => apiRequest("PATCH", `/api/admin/installment/applications/${id}/lock`).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/installment/applications"] }); toast({ title: "تم تعليق خدمة العميل" }); },
  });

  const unlockApp = useMutation({
    mutationFn: (id) => apiRequest("PATCH", `/api/admin/installment/applications/${id}/unlock`).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/installment/applications"] }); toast({ title: "تم رفع التعليق" }); },
  });

  const checkLate = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/installment/check-late").then(r => r.json()),
    onSuccess: (data) => toast({ title: `فحص التأخيرات: قُفل ${data.locked}، غرامات ${data.penalized}` }),
  });

  function openCreate() {
    setEditingOffer(null);
    setOfferForm({ title: "", titleAr: "", description: "", descriptionAr: "", planTier: "any", planPeriod: "any", planSegment: "", installmentCount: 4, serviceFee: 100, penaltyAmount: 50, gracePeriodDays: 7 });
    setShowOfferModal(true);
  }

  function openEdit(offer) {
    setEditingOffer(offer);
    setOfferForm({ title: offer.title, titleAr: offer.titleAr, description: offer.description || "", descriptionAr: offer.descriptionAr || "", planTier: offer.planTier, planPeriod: offer.planPeriod, planSegment: offer.planSegment || "", installmentCount: offer.installmentCount, serviceFee: offer.serviceFee, penaltyAmount: offer.penaltyAmount, gracePeriodDays: offer.gracePeriodDays });
    setShowOfferModal(true);
  }

  function handleSaveOffer() {
    if (!offerForm.title || !offerForm.titleAr) return toast({ title: "أدخل العنوان", variant: "destructive" });
    if (editingOffer) updateOffer.mutate({ id: editingOffer.id, data: offerForm });
    else createOffer.mutate(offerForm);
  }

  const pendingApps = applications.filter(a => a.status === "pending");
  const activeApps = applications.filter(a => ["active", "approved", "suspended"].includes(a.status));
  const closedApps = applications.filter(a => ["completed", "rejected", "cancelled"].includes(a.status));

  return (
    <div className="relative overflow-hidden min-h-screen bg-white dark:bg-gray-950 p-4 md:p-6" dir="rtl">
      <PageGraphics variant="dashboard" />
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="relative bg-gradient-to-bl from-emerald-600/10 via-teal-500/5 to-transparent border border-black/[0.07] dark:border-white/[0.07] rounded-3xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-black text-black dark:text-white">قسط عبر كيروكس</h1>
              <p className="text-sm text-black/40 dark:text-white/30 mt-0.5">إدارة عروض وطلبات التقسيط للباقات</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {isAdmin && (
                <Button size="sm" variant="outline" onClick={() => checkLate.mutate()} disabled={checkLate.isPending} data-testid="button-check-late" className="text-xs">
                  <RefreshCw className="w-3.5 h-3.5 ml-1" /> فحص التأخيرات
                </Button>
              )}
              {isAdmin && (
                <Button size="sm" onClick={openCreate} data-testid="button-create-offer" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                  <Plus className="w-3.5 h-3.5 ml-1" /> عرض تقسيط جديد
                </Button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            {[
              { label: "الطلبات المعلقة", value: pendingApps.length, color: "text-yellow-600" },
              { label: "نشطة", value: activeApps.length, color: "text-green-600" },
              { label: "مكتملة", value: closedApps.filter(a => a.status === "completed").length, color: "text-teal-600" },
              { label: "العروض النشطة", value: offers.filter(o => o.isActive).length, color: "text-blue-600" },
            ].map((s, i) => (
              <div key={i} className="bg-white/60 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-3 text-center">
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-black/40 dark:text-white/30 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <Tabs defaultValue="applications">
          <TabsList className="mb-4">
            <TabsTrigger value="applications">الطلبات {applications.length > 0 && <span className="mr-1 text-xs bg-black/10 dark:bg-white/10 rounded-full px-1.5">{applications.length}</span>}</TabsTrigger>
            <TabsTrigger value="offers">العروض {offers.length > 0 && <span className="mr-1 text-xs bg-black/10 dark:bg-white/10 rounded-full px-1.5">{offers.length}</span>}</TabsTrigger>
          </TabsList>

          {/* Applications Tab */}
          <TabsContent value="applications">
            {loadingApps ? (
              <div className="text-center py-10 text-black/30">جاري التحميل...</div>
            ) : applications.length === 0 ? (
              <div className="text-center py-14 text-black/30 dark:text-white/20">
                <Banknote className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p>لا توجد طلبات تقسيط بعد</p>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map(app => (
                  <div key={app.id} data-testid={`card-app-${app.id}`} className="bg-white dark:bg-gray-900 border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-black dark:text-white">{app.clientId?.fullName || "عميل"}</span>
                        <span className="text-xs text-black/40">{app.clientId?.email}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${STATUS_COLOR[app.status] || "bg-gray-100 text-gray-600"}`}>{STATUS_LABEL[app.status] || app.status}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-black/50 dark:text-white/40">
                        <span>باقة: <b className="text-black/70 dark:text-white/60">{TIER_LABELS[app.planTier] || app.planTier}</b></span>
                        <span>فترة: <b className="text-black/70 dark:text-white/60">{PERIOD_LABELS[app.planPeriod] || app.planPeriod}</b></span>
                        <span>الإجمالي: <b className="text-emerald-600">{app.grandTotal?.toFixed(2)} ريال</b></span>
                        <span>{app.paidInstallments || 0}/{app.installmentCount} أقساط</span>
                        <span>{app.installmentAmount?.toFixed(0)} ريال/قسط</span>
                      </div>
                      {app.clientNotes && <p className="text-xs text-black/40 mt-1 truncate">ملاحظة: {app.clientNotes}</p>}
                    </div>
                    <div className="flex gap-2 flex-wrap shrink-0">
                      <Button size="sm" variant="ghost" className="text-xs h-7 px-2" onClick={() => setViewApp(app.id)} data-testid={`button-view-${app.id}`}>
                        <Eye className="w-3 h-3 ml-1" /> عرض
                      </Button>
                      {isAdmin && app.status === "pending" && (
                        <>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-7 px-2" onClick={() => approveApp.mutate({ id: app.id, notes: "" })} disabled={approveApp.isPending} data-testid={`button-approve-${app.id}`}>
                            <CheckCircle className="w-3 h-3 ml-1" /> موافقة
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 text-xs h-7 px-2 border-red-200" onClick={() => setShowRejectModal(app.id)} data-testid={`button-reject-${app.id}`}>
                            <XCircle className="w-3 h-3 ml-1" /> رفض
                          </Button>
                        </>
                      )}
                      {isAdmin && app.status === "active" && (
                        <Button size="sm" variant="outline" className="text-orange-600 text-xs h-7 px-2 border-orange-200" onClick={() => lockApp.mutate(app.id)} disabled={lockApp.isPending} data-testid={`button-lock-${app.id}`}>
                          <Lock className="w-3 h-3 ml-1" /> تعليق
                        </Button>
                      )}
                      {isAdmin && app.status === "suspended" && (
                        <Button size="sm" variant="outline" className="text-green-600 text-xs h-7 px-2 border-green-200" onClick={() => unlockApp.mutate(app.id)} disabled={unlockApp.isPending} data-testid={`button-unlock-${app.id}`}>
                          <Unlock className="w-3 h-3 ml-1" /> رفع التعليق
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Offers Tab */}
          <TabsContent value="offers">
            {loadingOffers ? (
              <div className="text-center py-10 text-black/30">جاري التحميل...</div>
            ) : offers.length === 0 ? (
              <div className="text-center py-14 text-black/30 dark:text-white/20">
                <Plus className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p>لا توجد عروض تقسيط بعد</p>
                {isAdmin && <Button size="sm" onClick={openCreate} className="mt-3 bg-emerald-600 text-white text-xs">إنشاء أول عرض</Button>}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {offers.map(offer => (
                  <div key={offer.id} data-testid={`card-offer-${offer.id}`} className="bg-white dark:bg-gray-900 border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-sm text-black dark:text-white">{offer.titleAr}</h3>
                        <p className="text-xs text-black/40">{offer.title}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold shrink-0 ${offer.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {offer.isActive ? "نشط" : "معطل"}
                      </span>
                    </div>
                    <div className="text-xs text-black/50 dark:text-white/40 space-y-1">
                      <div className="flex justify-between"><span>الباقة</span><span className="font-medium text-black/70 dark:text-white/60">{TIER_LABELS[offer.planTier]}</span></div>
                      <div className="flex justify-between"><span>الفترة</span><span className="font-medium text-black/70 dark:text-white/60">{PERIOD_LABELS[offer.planPeriod]}</span></div>
                      <div className="flex justify-between"><span>عدد الأقساط</span><span className="font-bold text-black dark:text-white">{offer.installmentCount} أقساط</span></div>
                      <div className="flex justify-between"><span>رسوم الخدمة</span><span className="font-bold text-emerald-600">{offer.serviceFee} ريال</span></div>
                      <div className="flex justify-between"><span>غرامة التأخير</span><span className="font-medium text-orange-600">{offer.penaltyAmount} ريال</span></div>
                      <div className="flex justify-between"><span>مهلة السماح</span><span className="font-medium">{offer.gracePeriodDays} أيام</span></div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2 pt-1 border-t border-black/[0.05] dark:border-white/[0.05]">
                        <Button size="sm" variant="ghost" className="flex-1 text-xs h-7" onClick={() => openEdit(offer)} data-testid={`button-edit-offer-${offer.id}`}>
                          <Edit className="w-3 h-3 ml-1" /> تعديل
                        </Button>
                        <Button size="sm" variant="ghost" className={`flex-1 text-xs h-7 ${offer.isActive ? "text-orange-600" : "text-green-600"}`} onClick={() => toggleOffer.mutate(offer.id)} data-testid={`button-toggle-offer-${offer.id}`}>
                          {offer.isActive ? <><ToggleRight className="w-3 h-3 ml-1" /> تعطيل</> : <><ToggleLeft className="w-3 h-3 ml-1" /> تفعيل</>}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500 text-xs h-7 px-2" onClick={() => { if (confirm("حذف هذا العرض؟")) deleteOffer.mutate(offer.id); }} data-testid={`button-delete-offer-${offer.id}`}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Offer Modal */}
      <Dialog open={showOfferModal} onOpenChange={setShowOfferModal}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingOffer ? "تعديل عرض التقسيط" : "إنشاء عرض تقسيط جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-black/60 dark:text-white/50 mb-1 block">العنوان بالعربية *</label>
                <Input value={offerForm.titleAr} onChange={e => setOfferForm(f => ({ ...f, titleAr: e.target.value }))} placeholder="مثال: تقسيط الباقة السنوية" data-testid="input-title-ar" />
              </div>
              <div>
                <label className="text-xs font-bold text-black/60 dark:text-white/50 mb-1 block">العنوان بالإنجليزية *</label>
                <Input value={offerForm.title} onChange={e => setOfferForm(f => ({ ...f, title: e.target.value }))} placeholder="Annual Plan Installment" data-testid="input-title" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-black/60 dark:text-white/50 mb-1 block">الباقة المستهدفة</label>
                <Select value={offerForm.planTier} onValueChange={v => setOfferForm(f => ({ ...f, planTier: v }))}>
                  <SelectTrigger data-testid="select-plan-tier"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(TIER_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-bold text-black/60 dark:text-white/50 mb-1 block">فترة الدفع</label>
                <Select value={offerForm.planPeriod} onValueChange={v => setOfferForm(f => ({ ...f, planPeriod: v, serviceFee: serviceFeeByPeriod(v) }))}>
                  <SelectTrigger data-testid="select-plan-period"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(PERIOD_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-black/60 dark:text-white/50 mb-1 block">عدد الأقساط (2-8)</label>
                <Input type="number" min={2} max={8} value={offerForm.installmentCount} onChange={e => setOfferForm(f => ({ ...f, installmentCount: parseInt(e.target.value) }))} data-testid="input-installment-count" />
              </div>
              <div>
                <label className="text-xs font-bold text-black/60 dark:text-white/50 mb-1 block">رسوم الخدمة (ريال)</label>
                <Input type="number" min={0} value={offerForm.serviceFee} onChange={e => setOfferForm(f => ({ ...f, serviceFee: parseFloat(e.target.value) }))} data-testid="input-service-fee" />
              </div>
              <div>
                <label className="text-xs font-bold text-black/60 dark:text-white/50 mb-1 block">غرامة التأخير (ريال)</label>
                <Input type="number" min={0} value={offerForm.penaltyAmount} onChange={e => setOfferForm(f => ({ ...f, penaltyAmount: parseFloat(e.target.value) }))} data-testid="input-penalty" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/50 mb-1 block">مهلة السماح قبل الغرامة (أيام)</label>
              <Input type="number" min={1} max={30} value={offerForm.gracePeriodDays} onChange={e => setOfferForm(f => ({ ...f, gracePeriodDays: parseInt(e.target.value) }))} data-testid="input-grace-days" />
            </div>

            {/* Fee info box */}
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-xs text-emerald-700 dark:text-emerald-400">
              <p className="font-bold mb-1">رسوم الخدمة الموصى بها:</p>
              <p>• شهرية: 25 ريال &nbsp;|&nbsp; نصف سنوية: 50 ريال &nbsp;|&nbsp; سنوية/مدى الحياة: 100 ريال</p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSaveOffer} disabled={createOffer.isPending || updateOffer.isPending} data-testid="button-save-offer">
                {editingOffer ? "حفظ التعديلات" : "إنشاء العرض"}
              </Button>
              <Button variant="outline" onClick={() => setShowOfferModal(false)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={!!showRejectModal} onOpenChange={() => { setShowRejectModal(null); setRejectReason(""); }}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader><DialogTitle>رفض طلب التقسيط</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="سبب الرفض (اختياري)" rows={3} data-testid="textarea-reject-reason" />
            <div className="flex gap-2">
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => rejectApp.mutate({ id: showRejectModal, reason: rejectReason })} disabled={rejectApp.isPending} data-testid="button-confirm-reject">
                رفض الطلب
              </Button>
              <Button variant="outline" onClick={() => setShowRejectModal(null)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Application Detail Modal */}
      <Dialog open={!!viewApp} onOpenChange={() => setViewApp(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>تفاصيل طلب التقسيط</DialogTitle></DialogHeader>
          {appDetail ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-black/40 text-xs">العميل</p><p className="font-bold">{appDetail.application?.clientId?.fullName}</p></div>
                <div><p className="text-black/40 text-xs">الحالة</p><span className={`text-xs px-2 py-0.5 rounded-full font-bold ${STATUS_COLOR[appDetail.application?.status]}`}>{STATUS_LABEL[appDetail.application?.status]}</span></div>
                <div><p className="text-black/40 text-xs">قيمة الباقة</p><p className="font-bold">{appDetail.application?.totalAmount?.toFixed(2)} ريال</p></div>
                <div><p className="text-black/40 text-xs">رسوم الخدمة</p><p className="font-bold text-emerald-600">{appDetail.application?.serviceFee?.toFixed(2)} ريال</p></div>
                <div><p className="text-black/40 text-xs">الإجمالي</p><p className="font-black text-lg">{appDetail.application?.grandTotal?.toFixed(2)} ريال</p></div>
                <div><p className="text-black/40 text-xs">القسط الواحد</p><p className="font-bold">{appDetail.application?.installmentAmount?.toFixed(2)} ريال</p></div>
              </div>
              {appDetail.application?.clientNotes && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-sm">
                  <p className="text-xs text-black/40 mb-1">ملاحظة العميل</p>
                  <p>{appDetail.application.clientNotes}</p>
                </div>
              )}
              <div>
                <h3 className="font-bold text-sm mb-2">جدول الأقساط</h3>
                <div className="space-y-2">
                  {appDetail.payments?.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-2 text-sm">
                      <span className="font-medium text-black/60">القسط {p.installmentNumber}</span>
                      <span className="text-xs text-black/40">{new Date(p.dueDate).toLocaleDateString("ar-SA")}</span>
                      <span className="font-bold">{p.totalDue?.toFixed(2)} ريال{p.penalty > 0 && <span className="text-red-500 text-xs mr-1">(+{p.penalty} غرامة)</span>}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${PAYMENT_COLOR[p.status]}`}>{PAYMENT_STATUS[p.status]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : <div className="text-center py-8 text-black/30">جاري التحميل...</div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
