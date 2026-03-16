// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
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
    const { lang, dir } = useI18n();
    const L = lang === "ar";
    const PERIOD_LABELS: Record<string,string> = { monthly: L ? "شهرية" : "Monthly", sixmonth: L ? "نصف سنوية" : "Semi-Annual", annual: L ? "سنوية" : "Annual", lifetime: L ? "مدى الحياة" : "Lifetime", any: L ? "أي فترة" : "Any Period" };
    const TIER_LABELS: Record<string,string> = { lite: "Lite", pro: "Pro", infinite: "Infinite", lifetime: "Lifetime", any: L ? "أي باقة" : "Any Plan" };
    const STATUS_COLOR: Record<string,string> = { pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", approved: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", completed: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400", rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", suspended: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", cancelled: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" };
    const STATUS_LABEL: Record<string,string> = { pending: L ? "بانتظار الموافقة" : "Pending Approval", approved: L ? "تمت الموافقة — ادفع القسط الأول" : "Approved — Pay First Installment", active: L ? "نشط" : "Active", completed: L ? "مكتمل" : "Completed", rejected: L ? "مرفوض" : "Rejected", suspended: L ? "موقوف — يرجى السداد" : "Suspended — Please Pay", cancelled: L ? "ملغي" : "Cancelled" };
    const PAYMENT_COLOR: Record<string,string> = { pending: "border-gray-200 dark:border-gray-700", paid: "border-green-300 bg-green-50 dark:bg-green-900/20", late: "border-red-300 bg-red-50 dark:bg-red-900/20", penalized: "border-orange-300 bg-orange-50 dark:bg-orange-900/20", waived: "border-purple-200 bg-purple-50" };
    const PAYMENT_ICON: Record<string,any> = { pending: <Clock className="w-4 h-4 text-gray-400" />, paid: <CheckCircle className="w-4 h-4 text-green-500" />, late: <AlertTriangle className="w-4 h-4 text-red-500" />, penalized: <AlertTriangle className="w-4 h-4 text-orange-500" />, waived: <CheckCircle className="w-4 h-4 text-purple-500" /> };

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
      toast({ title: L ? `تم دفع القسط بنجاح — ${data.paidAmount?.toFixed(2)} ريال` : `Installment paid — ${data.paidAmount?.toFixed(2)} SAR` });
    },
    onError: (e: any) => toast({ title: L ? "فشل الدفع" : "Payment Failed", description: e.message, variant: "destructive" }),
  });

  const applyInstallment = useMutation({
    mutationFn: (data) => apiRequest("POST", "/api/installment/apply", data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/installment/my"] });
      setShowApplyModal(false);
      setApplyForm({ totalAmount: "", clientNotes: "" });
      setSelectedOffer(null);
      toast({ title: L ? "تم إرسال طلب التقسيط" : "Installment Request Sent", description: L ? "سيتم مراجعته من قبل الإدارة قريباً" : "It will be reviewed by the admin shortly" });
    },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  function handlePay() {
    if (!payingPayment) return;
    payInstallment.mutate({ paymentId: payingPayment.id, walletPin: pinInput || undefined });
  }

  function handleApply() {
    if (!selectedOffer || !applyForm.totalAmount) return toast({ title: L ? "أدخل قيمة الباقة" : "Enter plan value", variant: "destructive" });
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
    <div className="relative overflow-hidden min-h-screen bg-white dark:bg-gray-950 p-4 md:p-6" dir={dir}>
      <PageGraphics variant="dashboard" />
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="relative bg-gradient-to-bl from-emerald-600/10 via-teal-500/5 to-transparent border border-black/[0.07] dark:border-white/[0.07] rounded-3xl p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-black text-black dark:text-white flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-600" /> {L ? "قسط عبر كيروكس" : "Installments via Qirox"}
              </h1>
              <p className="text-sm text-black/40 dark:text-white/30 mt-0.5">{L ? "قسّط باقتك على عدة دفعات من محفظتك" : "Split your plan into multiple payments from your wallet"}</p>
            </div>
            {!hasActiveApp && offers.length > 0 && (
              <Button onClick={() => setShowApplyModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm" data-testid="button-apply-installment">
                <Banknote className="w-4 h-4 ml-1" /> {L ? "تقدم بطلب تقسيط" : "Apply for Installment"}
              </Button>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-4 bg-white/60 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-3">
            <div className="flex items-start gap-2 text-xs text-black/50 dark:text-white/40">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div className="space-y-1">
                <p>• {L ? <>التقسيط متاح للباقات فقط، حتى <b>8 أقساط شهرية</b></> : <>Installments available for plans only, up to <b>8 monthly payments</b></>}</p>
                <p>• {L ? "تضاف رسوم خدمة نظام التقسيط (25-100 ريال حسب الفترة)" : "Service fee added (25-100 SAR depending on period)"}</p>
                <p>• {L ? "يجب دفع القسط الأول لتفعيل الباقة" : "First installment must be paid to activate the plan"}</p>
                <p>• {L ? "التأخر في السداد يؤدي إلى تعليق الخدمة فوراً" : "Late payment leads to immediate service suspension"}</p>
                <p>• {L ? "التأخر أكثر من أسبوع يضيف غرامة تأخير للقسط" : "More than a week late adds a late fee to the installment"}</p>
              </div>
            </div>
          </div>

          {/* Wallet Balance */}
          <div className="mt-3 flex items-center gap-2 text-sm">
            <CreditCard className="w-4 h-4 text-blue-500" />
            <span className="text-black/50 dark:text-white/40">{L ? "رصيد المحفظة:" : "Wallet Balance:"}</span>
            <span className={`font-black ${balance > 0 ? "text-green-600" : "text-red-500"}`}>{balance.toFixed(2)} {L ? "ريال" : "SAR"}</span>
          </div>
        </div>

        {/* My Applications */}
        {loadingApps ? (
          <div className="text-center py-10 text-black/30 dark:text-white/20">{L ? "جاري التحميل..." : "Loading..."}</div>
        ) : myApps.length === 0 ? (
          <div className="text-center py-14 text-black/30 dark:text-white/20">
            <Banknote className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="font-medium">{L ? "لا توجد طلبات تقسيط بعد" : "No installment requests yet"}</p>
            {offers.length > 0 && <p className="text-xs mt-1">{L ? 'اضغط "تقدم بطلب تقسيط" لبدء طلبك' : 'Click "Apply for Installment" to get started'}</p>}
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-sm font-black text-black dark:text-white">{L ? "طلباتي" : "My Applications"}</h2>
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
                      <span>{L ? "باقة" : "Plan"} <b className="text-black/70 dark:text-white/60">{TIER_LABELS[app.planTier]}</b></span>
                      <span>{PERIOD_LABELS[app.planPeriod]}</span>
                      <span className="font-bold text-emerald-600">{app.grandTotal?.toFixed(2)} ريال إجمالاً</span>
                      <span>{app.paidInstallments || 0}/{app.installmentCount} {L ? "أقساط مدفوعة" : "installments paid"}</span>
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
                          <p className="font-bold">{L ? "خدمتك موقوفة بسبب تأخر السداد" : "Your service is suspended due to late payment"}</p>
                          <p>{L ? "ادفع القسط المتأخر لاستعادة خدمتك فوراً" : "Pay the overdue installment to restore your service immediately"}</p>
                        </div>
                      </div>
                    )}
                    {app.status === "approved" && (
                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-400 flex items-start gap-2 mb-3">
                        <Info className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">{L ? "تمت الموافقة على طلبك!" : "Your request has been approved!"}</p>
                          <p>{L ? "ادفع القسط الأول لتفعيل باقتك" : "Pay the first installment to activate your plan"}</p>
                        </div>
                      </div>
                    )}
                    <p className="text-xs font-bold text-black/50 dark:text-white/40 mb-2">{L ? "جدول الأقساط" : "Payment Schedule"}</p>
                    {app.payments?.map((p: any) => (
                      <div key={p.id} className={`border rounded-xl p-3 flex items-center justify-between gap-2 ${PAYMENT_COLOR[p.status]}`}>
                        <div className="flex items-center gap-2">
                          {PAYMENT_ICON[p.status]}
                          <div>
                            <p className="text-xs font-bold text-black dark:text-white">{L ? "القسط" : "Installment"} {p.installmentNumber}</p>
                            <p className="text-xs text-black/40">{new Date(p.dueDate).toLocaleDateString(L ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-black text-black dark:text-white">{p.totalDue?.toFixed(2)} ريال</p>
                          {p.penalty > 0 && <p className="text-xs text-red-500">+{p.penalty} {L ? "غرامة" : "penalty"}</p>}
                        </div>
                        {["pending", "late", "penalized"].includes(p.status) && ["approved", "active", "suspended"].includes(app.status) && (
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-2 shrink-0" onClick={() => { setPayingPayment(p); setPinInput(""); }} data-testid={`button-pay-${p.id}`}>
                            {L ? "دفع" : "Pay"}
                          </Button>
                        )}
                        {p.status === "paid" && p.paidAt && (
                          <p className="text-xs text-green-600 shrink-0">{new Date(p.paidAt).toLocaleDateString(L ? "ar-SA" : "en-US")}</p>
                        )}
                      </div>
                    ))}

                    {app.status === "rejected" && app.rejectionReason && (
                      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-xl p-3 text-xs text-red-700 mt-2">
                        <p className="font-bold">{L ? "سبب الرفض:" : "Rejection Reason:"}</p>
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
            <h2 className="text-sm font-black text-black dark:text-white mb-3">{L ? "عروض التقسيط المتاحة" : "Available Installment Offers"}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {offers.map(offer => (
                <div key={offer.id} data-testid={`card-offer-${offer.id}`} className="bg-white dark:bg-gray-900 border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-4">
                  <h3 className="font-bold text-black dark:text-white">{offer.titleAr}</h3>
                  {offer.descriptionAr && <p className="text-xs text-black/40 mt-1">{offer.descriptionAr}</p>}
                  <div className="mt-3 space-y-1 text-xs text-black/50 dark:text-white/40">
                    <div className="flex justify-between"><span>{L ? "الباقة" : "Plan"}</span><span className="font-medium">{TIER_LABELS[offer.planTier]}</span></div>
                    <div className="flex justify-between"><span>{L ? "الفترة" : "Period"}</span><span className="font-medium">{PERIOD_LABELS[offer.planPeriod]}</span></div>
                    <div className="flex justify-between"><span>{L ? "عدد الأقساط" : "Installments"}</span><span className="font-bold text-black dark:text-white">{offer.installmentCount} {L ? "أقساط" : "payments"}</span></div>
                    <div className="flex justify-between"><span>{L ? "رسوم الخدمة" : "Service Fee"}</span><span className="font-bold text-emerald-600">{offer.serviceFee} {L ? "ريال" : "SAR"}</span></div>
                  </div>
                  <Button size="sm" className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs" onClick={() => { setSelectedOffer(offer); setShowApplyModal(true); }} data-testid={`button-select-offer-${offer.id}`}>
                    {L ? "اختر هذا العرض" : "Select This Offer"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pay Modal */}
      <Dialog open={!!payingPayment} onOpenChange={() => { setPayingPayment(null); setPinInput(""); }}>
        <DialogContent className="max-w-sm" dir={dir}>
          <DialogHeader><DialogTitle>{L ? "دفع القسط" : "Pay Installment"}</DialogTitle></DialogHeader>
          {payingPayment && (
            <div className="space-y-4 pt-2">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-center">
                <p className="text-xs text-emerald-700 dark:text-emerald-400">{L ? "المبلغ المستحق" : "Amount Due"}</p>
                <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{payingPayment.totalDue?.toFixed(2)}</p>
                <p className="text-sm text-emerald-600">{L ? "ريال سعودي" : "Saudi Riyal"}</p>
                {payingPayment.penalty > 0 && <p className="text-xs text-orange-500 mt-1">{L ? `يشمل غرامة تأخير: ${payingPayment.penalty} ريال` : `Includes late fee: ${payingPayment.penalty} SAR`}</p>}
              </div>
              <div className="flex justify-between text-sm px-1">
                <span className="text-black/50 dark:text-white/40">{L ? "رصيد محفظتك" : "Your Wallet Balance"}</span>
                <span className={`font-bold ${balance >= payingPayment.totalDue ? "text-green-600" : "text-red-500"}`}>{balance.toFixed(2)} ريال</span>
              </div>
              {balance < payingPayment.totalDue && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-xl p-3 text-xs text-red-600">
                  {L ? "رصيد المحفظة غير كافٍ. يرجى شحن المحفظة أولاً." : "Insufficient wallet balance. Please top up your wallet first."}
                </div>
              )}
              {user?.walletPin && (
                <div>
                  <label className="text-xs font-bold text-black/60 dark:text-white/50 mb-1 block">{L ? "رقم PIN المحفظة" : "Wallet PIN"}</label>
                  <Input type="password" inputMode="numeric" maxLength={6} value={pinInput} onChange={e => setPinInput(e.target.value)} placeholder={L ? "أدخل رقم PIN" : "Enter PIN"} data-testid="input-wallet-pin" />
                </div>
              )}
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handlePay} disabled={payInstallment.isPending || balance < payingPayment.totalDue} data-testid="button-confirm-pay">
                {payInstallment.isPending ? (L ? "جاري الدفع..." : "Processing...") : (L ? "تأكيد الدفع من المحفظة" : "Confirm Wallet Payment")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Apply Modal */}
      <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
        <DialogContent className="max-w-lg" dir={dir}>
          <DialogHeader><DialogTitle>{L ? "طلب التقسيط عبر كيروكس" : "Installment Request via Qirox"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Offer Select */}
            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/50 mb-1 block">{L ? "اختر عرض التقسيط *" : "Select Installment Offer *"}</label>
              <Select value={selectedOffer?.id || ""} onValueChange={v => setSelectedOffer(offers.find(o => o.id === v))}>
                <SelectTrigger data-testid="select-offer">
                  <SelectValue placeholder={L ? "اختر عرضاً..." : "Select an offer..."} />
                </SelectTrigger>
                <SelectContent>
                  {offers.map(o => <SelectItem key={o.id} value={o.id}>{o.titleAr} — {o.installmentCount} {L ? "أقساط" : "payments"} (+{o.serviceFee} {L ? "ريال" : "SAR"})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {selectedOffer && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-xs space-y-1 text-black/60 dark:text-white/50">
                <div className="flex justify-between"><span>الباقة</span><span className="font-medium">{TIER_LABELS[selectedOffer.planTier]} — {PERIOD_LABELS[selectedOffer.planPeriod]}</span></div>
                <div className="flex justify-between"><span>{L ? "عدد الأقساط" : "Installments"}</span><span className="font-bold text-black dark:text-white">{selectedOffer.installmentCount}</span></div>
                <div className="flex justify-between"><span>{L ? "رسوم الخدمة" : "Service Fee"}</span><span className="font-bold text-emerald-600">{selectedOffer.serviceFee} {L ? "ريال" : "SAR"}</span></div>
                <div className="flex justify-between"><span>{L ? "غرامة التأخير" : "Late Fee"}</span><span className="text-orange-600">{selectedOffer.penaltyAmount} {L ? "ريال" : "SAR"}</span></div>
                <div className="flex justify-between"><span>{L ? "مهلة السماح" : "Grace Period"}</span><span>{selectedOffer.gracePeriodDays} {L ? "أيام" : "days"}</span></div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/50 mb-1 block">{L ? "قيمة الباقة (ريال) *" : "Plan Value (SAR) *"}</label>
              <Input type="number" min={1} value={applyForm.totalAmount} onChange={e => setApplyForm(f => ({ ...f, totalAmount: e.target.value }))} placeholder={L ? "أدخل سعر الباقة" : "Enter plan price"} data-testid="input-total-amount" />
            </div>

            {selectedOffer && applyForm.totalAmount && !isNaN(parseFloat(applyForm.totalAmount)) && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-sm">
                <div className="flex justify-between text-xs text-emerald-700 dark:text-emerald-400 mb-1">
                  <span>{L ? "قيمة الباقة" : "Plan Value"}</span><span>{parseFloat(applyForm.totalAmount).toFixed(2)} {L ? "ريال" : "SAR"}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-700 dark:text-emerald-400 mb-1">
                  <span>{L ? "رسوم الخدمة" : "Service Fee"}</span><span>+{selectedOffer.serviceFee} {L ? "ريال" : "SAR"}</span>
                </div>
                <div className="flex justify-between font-black text-emerald-700 dark:text-emerald-300 border-t border-emerald-200 dark:border-emerald-700 pt-1 mt-1">
                  <span>{L ? "الإجمالي" : "Total"}</span><span>{(parseFloat(applyForm.totalAmount) + selectedOffer.serviceFee).toFixed(2)} {L ? "ريال" : "SAR"}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  <span>{L ? "القسط الواحد" : "Per Installment"}</span>
                  <span className="font-bold">{Math.ceil((parseFloat(applyForm.totalAmount) + selectedOffer.serviceFee) / selectedOffer.installmentCount).toFixed(2)} {L ? "ريال" : "SAR"}</span>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/50 mb-1 block">{L ? "ملاحظات (اختياري)" : "Notes (optional)"}</label>
              <Textarea value={applyForm.clientNotes} onChange={e => setApplyForm(f => ({ ...f, clientNotes: e.target.value }))} placeholder={L ? "أي ملاحظات إضافية..." : "Any additional notes..."} rows={2} data-testid="textarea-client-notes" />
            </div>

            <div className="text-xs text-black/40 dark:text-white/30 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
              {L ? `بتقديم هذا الطلب أوافق على الشروط: دفع الأقساط في مواعيدها، وأن التأخر يؤدي لتعليق الخدمة، والتأخر أكثر من ${selectedOffer?.gracePeriodDays || 7} أيام يضيف غرامة تأخير.` : `By submitting this request I agree to the terms: pay installments on time, late payment suspends service, and more than ${selectedOffer?.gracePeriodDays || 7} days late adds a penalty fee.`}
            </div>

            <div className="flex gap-2">
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleApply} disabled={applyInstallment.isPending} data-testid="button-confirm-apply">
                {applyInstallment.isPending ? (L ? "جاري الإرسال..." : "Sending...") : (L ? "تقديم الطلب" : "Submit Request")}
              </Button>
              <Button variant="outline" onClick={() => setShowApplyModal(false)}>{L ? "إلغاء" : "Cancel"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
