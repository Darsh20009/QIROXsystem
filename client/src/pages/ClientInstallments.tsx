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
import { Banknote, CheckCircle, AlertTriangle, Lock, Clock, ChevronDown, ChevronUp, CreditCard, Info } from "lucide-react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

const PERIOD_LABELS = { monthly: "شهرية", sixmonth: "نصف سنوية", annual: "سنوية", lifetime: "مدى الحياة", any: "أي فترة" };
const TIER_LABELS = { lite: "Lite", pro: "Pro", infinite: "Infinite", lifetime: "Lifetime", any: "أي باقة" };
const STATUS_COLOR = { pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", approved: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", completed: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400", rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", suspended: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", cancelled: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" };
const STATUS_LABEL = { pending: "بانتظار الموافقة", approved: "تمت الموافقة — ادفع القسط الأول", active: "نشط", completed: "مكتمل", rejected: "مرفوض", suspended: "موقوف — يرجى السداد", cancelled: "ملغي" };
const PAYMENT_COLOR = { pending: "border-gray-200 dark:border-gray-700", paid: "border-green-300 bg-green-50 dark:bg-green-900/20", late: "border-red-300 bg-red-50 dark:bg-red-900/20", penalized: "border-orange-300 bg-orange-50 dark:bg-orange-900/20", waived: "border-purple-200 bg-purple-50" };
const PAYMENT_ICON = { pending: <Clock className="w-4 h-4 text-gray-400" />, paid: <CheckCircle className="w-4 h-4 text-green-500" />, late: <AlertTriangle className="w-4 h-4 text-red-500" />, penalized: <AlertTriangle className="w-4 h-4 text-orange-500" />, waived: <CheckCircle className="w-4 h-4 text-purple-500" /> };

export default function ClientInstallments() {
  const { data: user } = useUser();
  const { toast } = useToast();

  const [expandedApp, setExpandedApp] = useState(null);
  const [payingPayment, setPayingPayment] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [applyForm, setApplyForm] = useState({ totalAmount: "", clientNotes: "" });

  const { data: myApps = [], isLoading: loadingApps } = useQuery({ queryKey: ["/api/installment/my"] });
  const { data: offers = [], isLoading: loadingOffers } = useQuery({ queryKey: ["/api/installment/offers"] });

  // Wallet balance
  const { data: walletData } = useQuery({ queryKey: ["/api/wallet"] });
  const balance = walletData ? ((walletData as any).totalCredit || 0) - ((walletData as any).totalDebit || 0) : 0;

  const payInstallment = useMutation({
    mutationFn: ({ paymentId, walletPin }) => apiRequest("POST", `/api/installment/pay/${paymentId}`, { walletPin }).then(r => r.json()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/installment/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      setPayingPayment(null);
      setPinInput("");
      toast({ title: `تم دفع القسط بنجاح — ${data.paidAmount?.toFixed(2)} ريال` });
    },
    onError: (e: any) => toast({ title: "فشل الدفع", description: e.message, variant: "destructive" }),
  });

  const applyInstallment = useMutation({
    mutationFn: (data) => apiRequest("POST", "/api/installment/apply", data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/installment/my"] });
      setShowApplyModal(false);
      setApplyForm({ totalAmount: "", clientNotes: "" });
      setSelectedOffer(null);
      toast({ title: "تم إرسال طلب التقسيط", description: "سيتم مراجعته من قبل الإدارة قريباً" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  function handlePay() {
    if (!payingPayment) return;
    payInstallment.mutate({ paymentId: payingPayment.id, walletPin: pinInput || undefined });
  }

  function handleApply() {
    if (!selectedOffer || !applyForm.totalAmount) return toast({ title: "أدخل قيمة الباقة", variant: "destructive" });
    applyInstallment.mutate({
      offerId: selectedOffer.id,
      planTier: selectedOffer.planTier,
      planPeriod: selectedOffer.planPeriod,
      planSegment: selectedOffer.planSegment || "",
      totalAmount: parseFloat(applyForm.totalAmount),
      clientNotes: applyForm.clientNotes,
    });
  }

  const hasActiveApp = myApps.some(a => ["pending", "approved", "active", "suspended"].includes(a.status));

  return (
    <div className="relative overflow-hidden min-h-screen bg-white dark:bg-gray-950 p-4 md:p-6" dir="rtl">
      <PageGraphics variant="dashboard" />
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="relative bg-gradient-to-bl from-emerald-600/10 via-teal-500/5 to-transparent border border-black/[0.07] dark:border-white/[0.07] rounded-3xl p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-black text-black dark:text-white flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-600" /> قسط عبر كيروكس
              </h1>
              <p className="text-sm text-black/40 dark:text-white/30 mt-0.5">قسّط باقتك على عدة دفعات من محفظتك</p>
            </div>
            {!hasActiveApp && offers.length > 0 && (
              <Button onClick={() => setShowApplyModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm" data-testid="button-apply-installment">
                <Banknote className="w-4 h-4 ml-1" /> تقدم بطلب تقسيط
              </Button>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-4 bg-white/60 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-3">
            <div className="flex items-start gap-2 text-xs text-black/50 dark:text-white/40">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div className="space-y-1">
                <p>• التقسيط متاح للباقات فقط، حتى <b>8 أقساط شهرية</b></p>
                <p>• تضاف رسوم خدمة نظام التقسيط (25-100 ريال حسب الفترة)</p>
                <p>• يجب دفع القسط الأول لتفعيل الباقة</p>
                <p>• التأخر في السداد يؤدي إلى تعليق الخدمة فوراً</p>
                <p>• التأخر أكثر من أسبوع يضيف غرامة تأخير للقسط</p>
              </div>
            </div>
          </div>

          {/* Wallet Balance */}
          <div className="mt-3 flex items-center gap-2 text-sm">
            <CreditCard className="w-4 h-4 text-blue-500" />
            <span className="text-black/50 dark:text-white/40">رصيد المحفظة:</span>
            <span className={`font-black ${balance > 0 ? "text-green-600" : "text-red-500"}`}>{balance.toFixed(2)} ريال</span>
          </div>
        </div>

        {/* My Applications */}
        {loadingApps ? (
          <div className="text-center py-10 text-black/30">جاري التحميل...</div>
        ) : myApps.length === 0 ? (
          <div className="text-center py-14 text-black/30 dark:text-white/20">
            <Banknote className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="font-medium">لا توجد طلبات تقسيط بعد</p>
            {offers.length > 0 && <p className="text-xs mt-1">اضغط "تقدم بطلب تقسيط" لبدء طلبك</p>}
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-sm font-black text-black dark:text-white">طلباتي</h2>
            {myApps.map(app => (
              <div key={app.id} data-testid={`card-myapp-${app.id}`} className="bg-white dark:bg-gray-900 border border-black/[0.07] dark:border-white/[0.07] rounded-2xl overflow-hidden">
                {/* App Header */}
                <div className="p-4 flex items-center justify-between cursor-pointer select-none" onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${STATUS_COLOR[app.status]}`}>{STATUS_LABEL[app.status] || app.status}</span>
                      {app.status === "suspended" && <Lock className="w-3.5 h-3.5 text-orange-500" />}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-black/50 dark:text-white/40">
                      <span>باقة <b className="text-black/70 dark:text-white/60">{TIER_LABELS[app.planTier]}</b></span>
                      <span>{PERIOD_LABELS[app.planPeriod]}</span>
                      <span className="font-bold text-emerald-600">{app.grandTotal?.toFixed(2)} ريال إجمالاً</span>
                      <span>{app.paidInstallments || 0}/{app.installmentCount} أقساط مدفوعة</span>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${((app.paidInstallments || 0) / app.installmentCount) * 100}%` }} />
                    </div>
                  </div>
                  {expandedApp === app.id ? <ChevronUp className="w-4 h-4 text-black/30 shrink-0 ml-2" /> : <ChevronDown className="w-4 h-4 text-black/30 shrink-0 ml-2" />}
                </div>

                {/* Payments Schedule */}
                {expandedApp === app.id && (
                  <div className="border-t border-black/[0.06] dark:border-white/[0.06] p-4 space-y-2">
                    {app.status === "suspended" && (
                      <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl p-3 text-xs text-orange-700 dark:text-orange-400 flex items-start gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">خدمتك موقوفة بسبب تأخر السداد</p>
                          <p>ادفع القسط المتأخر لاستعادة خدمتك فوراً</p>
                        </div>
                      </div>
                    )}
                    {app.status === "approved" && (
                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-400 flex items-start gap-2 mb-3">
                        <Info className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">تمت الموافقة على طلبك!</p>
                          <p>ادفع القسط الأول لتفعيل باقتك</p>
                        </div>
                      </div>
                    )}
                    <p className="text-xs font-bold text-black/50 dark:text-white/40 mb-2">جدول الأقساط</p>
                    {app.payments?.map((p: any) => (
                      <div key={p.id} className={`border rounded-xl p-3 flex items-center justify-between gap-2 ${PAYMENT_COLOR[p.status]}`}>
                        <div className="flex items-center gap-2">
                          {PAYMENT_ICON[p.status]}
                          <div>
                            <p className="text-xs font-bold text-black dark:text-white">القسط {p.installmentNumber}</p>
                            <p className="text-xs text-black/40">{new Date(p.dueDate).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-black text-black dark:text-white">{p.totalDue?.toFixed(2)} ريال</p>
                          {p.penalty > 0 && <p className="text-xs text-red-500">+{p.penalty} غرامة</p>}
                        </div>
                        {["pending", "late", "penalized"].includes(p.status) && ["approved", "active", "suspended"].includes(app.status) && (
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-2 shrink-0" onClick={() => { setPayingPayment(p); setPinInput(""); }} data-testid={`button-pay-${p.id}`}>
                            دفع
                          </Button>
                        )}
                        {p.status === "paid" && p.paidAt && (
                          <p className="text-xs text-green-600 shrink-0">{new Date(p.paidAt).toLocaleDateString("ar-SA")}</p>
                        )}
                      </div>
                    ))}

                    {app.status === "rejected" && app.rejectionReason && (
                      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-xl p-3 text-xs text-red-700 mt-2">
                        <p className="font-bold">سبب الرفض:</p>
                        <p>{app.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Available Offers */}
        {!hasActiveApp && offers.length > 0 && (
          <div>
            <h2 className="text-sm font-black text-black dark:text-white mb-3">عروض التقسيط المتاحة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {offers.map(offer => (
                <div key={offer.id} data-testid={`card-offer-${offer.id}`} className="bg-white dark:bg-gray-900 border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-4">
                  <h3 className="font-bold text-black dark:text-white">{offer.titleAr}</h3>
                  {offer.descriptionAr && <p className="text-xs text-black/40 mt-1">{offer.descriptionAr}</p>}
                  <div className="mt-3 space-y-1 text-xs text-black/50 dark:text-white/40">
                    <div className="flex justify-between"><span>الباقة</span><span className="font-medium">{TIER_LABELS[offer.planTier]}</span></div>
                    <div className="flex justify-between"><span>الفترة</span><span className="font-medium">{PERIOD_LABELS[offer.planPeriod]}</span></div>
                    <div className="flex justify-between"><span>عدد الأقساط</span><span className="font-bold text-black dark:text-white">{offer.installmentCount} أقساط</span></div>
                    <div className="flex justify-between"><span>رسوم الخدمة</span><span className="font-bold text-emerald-600">{offer.serviceFee} ريال</span></div>
                  </div>
                  <Button size="sm" className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs" onClick={() => { setSelectedOffer(offer); setShowApplyModal(true); }} data-testid={`button-select-offer-${offer.id}`}>
                    اختر هذا العرض
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pay Modal */}
      <Dialog open={!!payingPayment} onOpenChange={() => { setPayingPayment(null); setPinInput(""); }}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader><DialogTitle>دفع القسط</DialogTitle></DialogHeader>
          {payingPayment && (
            <div className="space-y-4 pt-2">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-center">
                <p className="text-xs text-emerald-700 dark:text-emerald-400">المبلغ المستحق</p>
                <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{payingPayment.totalDue?.toFixed(2)}</p>
                <p className="text-sm text-emerald-600">ريال سعودي</p>
                {payingPayment.penalty > 0 && <p className="text-xs text-orange-500 mt-1">يشمل غرامة تأخير: {payingPayment.penalty} ريال</p>}
              </div>
              <div className="flex justify-between text-sm px-1">
                <span className="text-black/50 dark:text-white/40">رصيد محفظتك</span>
                <span className={`font-bold ${balance >= payingPayment.totalDue ? "text-green-600" : "text-red-500"}`}>{balance.toFixed(2)} ريال</span>
              </div>
              {balance < payingPayment.totalDue && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-xl p-3 text-xs text-red-600">
                  رصيد المحفظة غير كافٍ. يرجى شحن المحفظة أولاً.
                </div>
              )}
              {user?.walletPin && (
                <div>
                  <label className="text-xs font-bold text-black/60 dark:text-white/50 mb-1 block">رقم PIN المحفظة</label>
                  <Input type="password" inputMode="numeric" maxLength={6} value={pinInput} onChange={e => setPinInput(e.target.value)} placeholder="أدخل رقم PIN" data-testid="input-wallet-pin" />
                </div>
              )}
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handlePay} disabled={payInstallment.isPending || balance < payingPayment.totalDue} data-testid="button-confirm-pay">
                {payInstallment.isPending ? "جاري الدفع..." : "تأكيد الدفع من المحفظة"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Apply Modal */}
      <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle>طلب التقسيط عبر كيروكس</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Offer Select */}
            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/50 mb-1 block">اختر عرض التقسيط *</label>
              <Select value={selectedOffer?.id || ""} onValueChange={v => setSelectedOffer(offers.find(o => o.id === v))}>
                <SelectTrigger data-testid="select-offer">
                  <SelectValue placeholder="اختر عرضاً..." />
                </SelectTrigger>
                <SelectContent>
                  {offers.map(o => <SelectItem key={o.id} value={o.id}>{o.titleAr} — {o.installmentCount} أقساط (+{o.serviceFee} ريال)</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {selectedOffer && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-xs space-y-1 text-black/60 dark:text-white/50">
                <div className="flex justify-between"><span>الباقة</span><span className="font-medium">{TIER_LABELS[selectedOffer.planTier]} — {PERIOD_LABELS[selectedOffer.planPeriod]}</span></div>
                <div className="flex justify-between"><span>عدد الأقساط</span><span className="font-bold text-black dark:text-white">{selectedOffer.installmentCount}</span></div>
                <div className="flex justify-between"><span>رسوم الخدمة</span><span className="font-bold text-emerald-600">{selectedOffer.serviceFee} ريال</span></div>
                <div className="flex justify-between"><span>غرامة التأخير</span><span className="text-orange-600">{selectedOffer.penaltyAmount} ريال</span></div>
                <div className="flex justify-between"><span>مهلة السماح</span><span>{selectedOffer.gracePeriodDays} أيام</span></div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/50 mb-1 block">قيمة الباقة (ريال) *</label>
              <Input type="number" min={1} value={applyForm.totalAmount} onChange={e => setApplyForm(f => ({ ...f, totalAmount: e.target.value }))} placeholder="أدخل سعر الباقة" data-testid="input-total-amount" />
            </div>

            {selectedOffer && applyForm.totalAmount && !isNaN(parseFloat(applyForm.totalAmount)) && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-sm">
                <div className="flex justify-between text-xs text-emerald-700 dark:text-emerald-400 mb-1">
                  <span>قيمة الباقة</span><span>{parseFloat(applyForm.totalAmount).toFixed(2)} ريال</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-700 dark:text-emerald-400 mb-1">
                  <span>رسوم الخدمة</span><span>+{selectedOffer.serviceFee} ريال</span>
                </div>
                <div className="flex justify-between font-black text-emerald-700 dark:text-emerald-300 border-t border-emerald-200 dark:border-emerald-700 pt-1 mt-1">
                  <span>الإجمالي</span><span>{(parseFloat(applyForm.totalAmount) + selectedOffer.serviceFee).toFixed(2)} ريال</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  <span>القسط الواحد</span>
                  <span className="font-bold">{Math.ceil((parseFloat(applyForm.totalAmount) + selectedOffer.serviceFee) / selectedOffer.installmentCount).toFixed(2)} ريال</span>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/50 mb-1 block">ملاحظات (اختياري)</label>
              <Textarea value={applyForm.clientNotes} onChange={e => setApplyForm(f => ({ ...f, clientNotes: e.target.value }))} placeholder="أي ملاحظات إضافية..." rows={2} data-testid="textarea-client-notes" />
            </div>

            <div className="text-xs text-black/40 dark:text-white/30 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
              بتقديم هذا الطلب أوافق على الشروط: دفع الأقساط في مواعيدها، وأن التأخر يؤدي لتعليق الخدمة، والتأخر أكثر من {selectedOffer?.gracePeriodDays || 7} أيام يضيف غرامة تأخير.
            </div>

            <div className="flex gap-2">
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleApply} disabled={applyInstallment.isPending} data-testid="button-confirm-apply">
                {applyInstallment.isPending ? "جاري الإرسال..." : "تقديم الطلب"}
              </Button>
              <Button variant="outline" onClick={() => setShowApplyModal(false)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
