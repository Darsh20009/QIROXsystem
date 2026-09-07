import { useState } from "react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useQuery, useMutation } from "@tanstack/react-query";
import SARIcon from "@/components/SARIcon";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/hooks/use-auth";
import {
  TrendingUp, DollarSign, Users, Plus, Loader2, CheckCircle2,
  XCircle, Eye, Edit2, Search, Wallet, Percent, FileText,
  UserCheck, Clock, AlertCircle
} from "lucide-react";

type InvestorProfile = {
  id: string; _id?: string;
  userId: { _id: string; fullName: string; username: string; email: string; profilePhotoUrl?: string; jobTitle?: string; role: string };
  stakePercentage: number; totalInvested: number; isVerified: boolean; isActive: boolean;
  notes: string; joinedAt: string;
};

type Payment = {
  id: string; amount: number; currency: string; paymentMethod: string;
  proofUrl: string; signatureText: string; description: string;
  status: "pending" | "approved" | "rejected"; adminNote: string;
  createdAt: string; userId: { fullName: string; username: string };
};

type DistributionLine = {
  _id: string; investorId: string; investorName: string; ownershipPercentage: number;
  dueAmount: number; paidAmount: number; remainingAmount: number;
};
type Distribution = {
  id?: string; _id?: string; period: string; currency: string; netProfit: number;
  distributionPercentage: number; distributableAmount: number;
  status: "draft" | "approved" | "partial_paid" | "paid" | "cancelled";
  investorLines: DistributionLine[];
};

type AllUsersResp = { users: { id: string; _id?: string; fullName: string; username: string; email: string; role: string }[] };

function getStatusConfig(L: boolean) { return {
  pending: { label: L ? "بانتظار المراجعة" : "Under Review", color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white dark:bg-black dark:bg-white dark:text-black/70 dark:text-white/70", icon: Clock },
  approved: { label: L ? "موافق" : "Approved", color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white dark:bg-black dark:bg-white dark:text-black/70 dark:text-white/70", icon: CheckCircle2 },
  rejected: { label: L ? "مرفوض" : "Rejected", color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white dark:bg-black dark:bg-white dark:text-black/70 dark:text-white/70", icon: XCircle },
};
}

type Tab = "investors" | "payments" | "distributions";

export default function AdminInvestors() {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const { data: currentUser } = useUser();
  const L = lang === "ar";
  const STATUS_CONFIG = getStatusConfig(L);
  const [tab, setTab] = useState<Tab>("investors");
  const [addOpen, setAddOpen] = useState(false);
  const [editInvestor, setEditInvestor] = useState<InvestorProfile | null>(null);
  const [viewPayments, setViewPayments] = useState<InvestorProfile | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newStake, setNewStake] = useState("0");
  const [newNotes, setNewNotes] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [distributionMonth, setDistributionMonth] = useState(new Date().toISOString().slice(0, 7));
  const [distributionPercentage, setDistributionPercentage] = useState("100");
  const [distributionNotes, setDistributionNotes] = useState("");
  const [paymentTarget, setPaymentTarget] = useState<{ distributionId: string; line: DistributionLine } | null>(null);
  const [distributionPayment, setDistributionPayment] = useState({ amount: "", reference: "", notes: "" });
  const isAdmin = (currentUser as any)?.role === "admin";

  const { data: investors = [], isLoading } = useQuery<InvestorProfile[]>({ queryKey: ["/api/admin/investors"] });

  const { data: payments = [], isLoading: payLoading } = useQuery<Payment[]>({
    queryKey: ["/api/admin/investment-payments", paymentFilter],
    queryFn: async () => {
      const p = paymentFilter !== "all" ? `?status=${paymentFilter}` : "";
      const r = await fetch(`/api/admin/investment-payments${p}`, { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
  });

  const { data: allUsersResp } = useQuery<AllUsersResp>({
    queryKey: ["/api/admin/all-users"],
    queryFn: async () => {
      const r = await fetch("/api/admin/all-users?limit=200", { credentials: "include" });
      if (!r.ok) return { users: [], total: 0 };
      return r.json();
    },
    enabled: addOpen,
  });

  const { data: distributions = [], isLoading: distributionsLoading } = useQuery<Distribution[]>({
    queryKey: ["/api/admin/investor-distributions"],
    queryFn: async () => {
      const r = await fetch("/api/admin/investor-distributions", { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    enabled: tab === "distributions",
  });

  const { data: distributionPreview, isLoading: previewLoading, error: previewError } = useQuery<any>({
    queryKey: ["/api/admin/investor-distributions/preview", distributionMonth, distributionPercentage],
    queryFn: async () => {
      const params = new URLSearchParams({ period: distributionMonth, distributionPercentage });
      const r = await fetch(`/api/admin/investor-distributions/preview?${params}`, { credentials: "include" });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || "Failed");
      return body;
    },
    enabled: tab === "distributions" && /^\d{4}-(0[1-9]|1[0-2])$/.test(distributionMonth),
  });

  const addInvestorMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/investors", { userId: selectedUserId, stakePercentage: parseFloat(newStake), notes: newNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/investors"] });
      setAddOpen(false); setSelectedUserId(""); setNewStake("0"); setNewNotes("");
      toast({ title: L ? "✅ تم إنشاء ملف المستثمر وتعيين الدور" : "✅ Investor profile created and role assigned" });
    },
    onError: (e: any) => toast({ title: e?.message || (L ? "فشل الإنشاء" : "Creation failed"), variant: "destructive" }),
  });

  const updateInvestorMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/admin/investors/${editInvestor?.id || editInvestor?._id}`, {
      stakePercentage: parseFloat(newStake), notes: newNotes, isVerified: editInvestor?.isVerified, isActive: editInvestor?.isActive
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/investors"] });
      setEditInvestor(null);
      toast({ title: L ? "✅ تم تحديث ملف المستثمر" : "✅ Investor profile updated" });
    },
    onError: () => toast({ title: L ? "فشل التحديث" : "Update failed", variant: "destructive" }),
  });

  const approvePaymentMutation = useMutation({
    mutationFn: ({ id, status, adminNote }: { id: string; status: string; adminNote?: string }) =>
      apiRequest("PATCH", `/api/admin/investment-payments/${id}`, { status, adminNote: adminNote || "" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/investment-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/investors"] });
      toast({ title: L ? "✅ تم تحديث حالة الدفعة" : "✅ Payment status updated" });
    },
    onError: () => toast({ title: L ? "فشل التحديث" : "Update failed", variant: "destructive" }),
  });

  const createDistributionMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/investor-distributions", {
      period: distributionMonth,
      distributionPercentage: Number(distributionPercentage),
      notes: distributionNotes,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/investor-distributions"] });
      setDistributionNotes("");
      toast({ title: L ? "تم إنشاء مسودة توزيع الأرباح" : "Distribution draft created" });
    },
    onError: (e: any) => toast({ title: e?.message || (L ? "فشل إنشاء المسودة" : "Failed"), variant: "destructive" }),
  });

  const approveDistributionMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/admin/investor-distributions/${id}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/investor-distributions"] });
      toast({ title: L ? "تم اعتماد التوزيع وأصبح جاهزاً للصرف" : "Distribution approved for payment" });
    },
    onError: (e: any) => toast({ title: e?.message || (L ? "فشل الاعتماد" : "Approval failed"), variant: "destructive" }),
  });

  const cancelDistributionMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/admin/investor-distributions/${id}/cancel`, { reason: "إلغاء من لوحة المستثمرين" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/investor-distributions"] });
      toast({ title: L ? "تم إلغاء التوزيع" : "Distribution cancelled" });
    },
    onError: (e: any) => toast({ title: e?.message || (L ? "لا يمكن الإلغاء" : "Cancellation failed"), variant: "destructive" }),
  });

  const payDistributionMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/admin/investor-distributions/${paymentTarget?.distributionId}/payments`, {
      lineId: paymentTarget?.line._id,
      amount: Number(distributionPayment.amount),
      reference: distributionPayment.reference,
      notes: distributionPayment.notes,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/investor-distributions"] });
      setPaymentTarget(null);
      setDistributionPayment({ amount: "", reference: "", notes: "" });
      toast({ title: L ? "تم تسجيل دفعة المستثمر" : "Investor payment recorded" });
    },
    onError: (e: any) => toast({ title: e?.message || (L ? "فشل تسجيل الدفعة" : "Payment failed"), variant: "destructive" }),
  });

  const totalInvested = investors.reduce((s, i) => s + i.totalInvested, 0);
  const totalStake = investors.reduce((s, i) => s + i.stakePercentage, 0);
  const pendingPayments = payments.filter(p => p.status === "pending").length;

  const filteredUsers = (allUsersResp?.users || []).filter(u =>
    (u.fullName || "").toLowerCase().includes(userSearch.toLowerCase()) || (u.email || "").toLowerCase().includes(userSearch.toLowerCase())
  );
  const existingUserIds = new Set(investors.map(i => i.userId?._id));

  return (
    <div className="relative overflow-hidden min-h-screen bg-white dark:bg-gray-950 p-6" dir={dir}>
      <PageGraphics variant="dashboard" />
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="relative bg-gradient-to-bl from-black dark:from-white via-black dark:via-white to-transparent border border-black/[0.07] dark:border-white/[0.07] rounded-3xl p-7 overflow-hidden">
          <div className="absolute -top-10 -left-10 w-48 h-48 bg-gradient-to-br from-black dark:from-white to-black dark:to-white rounded-full blur-3xl" />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-black dark:from-white to-black/[0.08] dark:to-white/[0.1] flex items-center justify-center shadow-lg shadow-amber-500/30">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-black dark:text-white">{L ? "إدارة المستثمرين" : "Investor Management"}</h1>
                <p className="text-black/40 dark:text-white/40 text-sm">{L ? "تتبع حصص الاستثمار والمدفوعات" : "Track investment stakes and payments"}</p>
              </div>
            </div>
            <Button onClick={() => setAddOpen(true)} className="gap-2 bg-gradient-to-l from-black dark:from-white to-black/[0.08] dark:to-white/[0.1] text-white shadow-lg shadow-amber-500/20" data-testid="btn-add-investor">
              <Plus className="w-4 h-4" /> {L ? "إضافة مستثمر" : "Add Investor"}
            </Button>
          </div>

          {/* Stats */}
          <div className="relative mt-5 grid grid-cols-4 gap-3">
            {[
              { label: L ? "المستثمرون" : "Investors", value: investors.length, icon: Users, color: "text-black dark:text-white" },
              { label: L ? "إجمالي الاستثمارات" : "Total Invested", value: totalInvested.toLocaleString(L ? "ar-SA" : "en-US"), hasSAR: true, icon: Wallet, color: "text-black dark:text-white" },
              { label: L ? "مجموع الحصص" : "Total Stakes", value: `${totalStake}%`, icon: Percent, color: "text-black dark:text-white" },
              { label: L ? "دفعات معلقة" : "Pending Payments", value: pendingPayments, icon: AlertCircle, color: "text-black dark:text-white" },
            ].map(stat => (
              <div key={stat.label} className="bg-white/50 dark:bg-gray-900/50 border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-4">
                <stat.icon className={`w-4 h-4 ${stat.color} mb-1.5`} />
                <p className="text-xl font-black text-black dark:text-white flex items-center gap-1">{stat.value}{(stat as any).hasSAR && <SARIcon size={14} className="opacity-60" />}</p>
                <p className="text-xs text-black/40 dark:text-white/40">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-black/[0.06] dark:border-white/[0.06]">
          {([
            { id: "investors" as Tab, label: L ? "المستثمرون" : "Investors", icon: Users },
            { id: "payments" as Tab, label: L ? "الدفعات" : "Payments", icon: DollarSign },
            { id: "distributions" as Tab, label: L ? "توزيع الأرباح" : "Profit Distributions", icon: TrendingUp },
          ]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${tab === t.id ? "border-black dark:border-white text-black dark:text-white dark:text-black/70 dark:text-white/70" : "border-transparent text-black/40 dark:text-white/40"}`}
              data-testid={`tab-${t.id}`}>
              <t.icon className="w-4 h-4" />{t.label}
              {t.id === "payments" && pendingPayments > 0 && <span className="w-4 h-4 rounded-full bg-black dark:bg-white text-white text-[9px] flex items-center justify-center">{pendingPayments}</span>}
            </button>
          ))}
        </div>

        {/* Investors List */}
        {tab === "investors" && (
          <div className="space-y-3">
            {isLoading ? <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" /></div> : (
              investors.length === 0
                ? <div className="text-center py-16 text-sm text-black/30 dark:text-white/30"><TrendingUp className="w-10 h-10 mx-auto mb-3 text-black/10 dark:text-white/10" />{L ? 'لا يوجد مستثمرون — اضغط "إضافة مستثمر"' : 'No investors — click "Add Investor"'}</div>
                : investors.map(inv => (
                  <motion.div key={inv.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-5 rounded-2xl border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900"
                    data-testid={`investor-${inv.id}`}>
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-black/[0.04] dark:from-white/[0.06] to-black/[0.04] dark:to-white/[0.06] dark:from-black dark:from-white dark:to-black dark:to-white shrink-0 flex items-center justify-center">
                      {inv.userId?.profilePhotoUrl ? <img src={inv.userId.profilePhotoUrl} className="w-full h-full object-cover" alt="" /> : <span className="text-xl">{inv.userId?.fullName?.[0]?.toUpperCase()}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-black dark:text-white">{inv.userId?.fullName}</span>
                        {inv.isVerified && <Badge className="text-[10px] px-2 py-0 border-0 bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white dark:bg-black dark:bg-white dark:text-black/70 dark:text-white/70">{L ? "✓ موثق" : "✓ Verified"}</Badge>}
                        {!inv.isActive && <Badge className="text-[10px] px-2 py-0 border-0 bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white">{L ? "غير نشط" : "Inactive"}</Badge>}
                      </div>
                      <p className="text-xs text-black/30 dark:text-white/30">{inv.userId?.email}</p>
                      {inv.userId?.jobTitle && <p className="text-xs text-black dark:text-white dark:text-black/70 dark:text-white/70">{inv.userId.jobTitle}</p>}
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-black dark:text-white dark:text-black/70 dark:text-white/70">{inv.stakePercentage}%</p>
                      <p className="text-xs text-black/30 dark:text-white/30">{L ? "حصة" : "Stake"}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-bold text-black dark:text-white dark:text-black/70 dark:text-white/70">{inv.totalInvested.toLocaleString(L ? "ar-SA" : "en-US")}</p>
                      <p className="text-xs text-black/30 dark:text-white/30 flex items-center gap-0.5"><SARIcon size={9} className="opacity-60" /> {L ? "مستثمر" : "invested"}</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => { setEditInvestor(inv); setNewStake(String(inv.stakePercentage)); setNewNotes(inv.notes || ""); }} data-testid={`btn-edit-${inv.id}`}>
                      <Edit2 className="w-3.5 h-3.5" /> {L ? "تعديل" : "Edit"}
                    </Button>
                  </motion.div>
                ))
            )}
          </div>
        )}

        {/* Payments */}
        {tab === "payments" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              {["all", "pending", "approved", "rejected"].map(s => (
                <button key={s} onClick={() => setPaymentFilter(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${paymentFilter === s ? "bg-black dark:bg-white text-white dark:text-black border-transparent" : "border-black/10 dark:border-white/10 text-black/50 dark:text-white/50"}`}
                  data-testid={`filter-${s}`}>
                  {s === "all" ? (L ? "الكل" : "All") : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label}
                </button>
              ))}
            </div>
            {payLoading ? <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" /></div> : (
              payments.length === 0
                ? <div className="text-center py-16 text-sm text-black/30 dark:text-white/30"><DollarSign className="w-10 h-10 mx-auto mb-3 text-black/10 dark:text-white/10" />{L ? "لا توجد دفعات" : "No payments"}</div>
                : payments.map(p => {
                  const cfg = STATUS_CONFIG[p.status];
                  return (
                    <div key={p.id} className="p-5 rounded-2xl border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900 space-y-3" data-testid={`payment-${p.id}`}>
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-black dark:text-white">{p.userId?.fullName}</span>
                            <Badge className={`text-[10px] px-2 py-0 border-0 ${cfg.color}`}><cfg.icon className="w-3 h-3 ml-1" />{cfg.label}</Badge>
                          </div>
                          <p className="text-xs text-black/30 dark:text-white/30 mt-0.5">{new Date(p.createdAt).toLocaleDateString(L ? "ar-SA" : "en-US")} · {p.paymentMethod}</p>
                          {p.description && <p className="text-xs text-black/40 dark:text-white/40 mt-0.5 italic">"{p.description}"</p>}
                        </div>
                        <div className="text-left">
                          <p className="text-xl font-black text-black dark:text-white dark:text-black/70 dark:text-white/70">{p.amount.toLocaleString(L ? "ar-SA" : "en-US")} {p.currency}</p>
                          {p.proofUrl && <a href={p.proofUrl} target="_blank" rel="noreferrer" className="text-xs text-black dark:text-white underline flex items-center gap-1"><Eye className="w-3 h-3" /> {L ? "عرض الإيصال" : "View Receipt"}</a>}
                        </div>
                      </div>
                      {p.signatureText && <p className="text-xs text-black/40 dark:text-white/40">{L ? "التوقيع النصي:" : "Text Signature:"} {p.signatureText}</p>}
                      {p.status === "pending" && (
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" className="gap-1.5 bg-black dark:bg-white hover:bg-black dark:bg-white text-white" onClick={() => approvePaymentMutation.mutate({ id: p.id, status: "approved" })} disabled={approvePaymentMutation.isPending} data-testid={`btn-approve-${p.id}`}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> {L ? "موافقة" : "Approve"}
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1.5 text-black dark:text-white border-black/10 dark:border-white/10 hover:bg-black/[0.04] dark:bg-white/[0.06]" onClick={() => approvePaymentMutation.mutate({ id: p.id, status: "rejected" })} disabled={approvePaymentMutation.isPending} data-testid={`btn-reject-${p.id}`}>
                            <XCircle className="w-3.5 h-3.5" /> {L ? "رفض" : "Reject"}
                          </Button>
                        </div>
                      )}
                      {p.adminNote && <p className="text-xs text-black/40 dark:text-white/40 border-t border-black/[0.05] dark:border-white/[0.05] pt-2">{L ? "ملاحظة الأدمن:" : "Admin note:"} {p.adminNote}</p>}
                    </div>
                  );
                })
            )}
          </div>
        )}

        {/* Monthly profit distributions */}
        {tab === "distributions" && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900 p-5 space-y-4">
              <div>
                <h3 className="font-bold text-black dark:text-white">{L ? "تجهيز توزيع شهري" : "Prepare Monthly Distribution"}</h3>
                <p className="text-xs text-black/40 dark:text-white/40 mt-1">{L ? "تُحفظ أرقام الشهر ونسب الملكية داخل المسودة قبل الاعتماد." : "The month's figures and ownership snapshots are stored in the draft."}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">{L ? "الشهر" : "Month"}</label>
                  <Input type="month" value={distributionMonth} onChange={e => setDistributionMonth(e.target.value)} data-testid="input-distribution-month" />
                </div>
                <div>
                  <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">{L ? "نسبة التوزيع %" : "Distribution %"}</label>
                  <Input type="number" min={0} max={100} value={distributionPercentage} onChange={e => setDistributionPercentage(e.target.value)} data-testid="input-distribution-percentage" />
                </div>
                <div>
                  <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">{L ? "ملاحظة" : "Note"}</label>
                  <Input value={distributionNotes} onChange={e => setDistributionNotes(e.target.value)} placeholder={L ? "اختياري" : "Optional"} data-testid="input-distribution-notes" />
                </div>
              </div>
              {previewLoading ? <div className="py-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-black/30 dark:text-white/30" /></div> : previewError ? (
                <p className="text-sm text-red-600">{(previewError as Error).message}</p>
              ) : distributionPreview && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {[
                    [L ? "الإيراد" : "Revenue", distributionPreview.revenue],
                    [L ? "التكاليف" : "Costs", distributionPreview.totalCosts],
                    [L ? "التعديلات" : "Adjustments", distributionPreview.adjustments],
                    [L ? "صافي الربح" : "Net profit", distributionPreview.netProfit],
                    [L ? "قابل للتوزيع" : "Distributable", distributionPreview.distributableAmount],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-xl bg-black/[0.03] dark:bg-white/[0.04] p-3">
                      <p className="text-[11px] text-black/40 dark:text-white/40">{label}</p>
                      <p className="font-black text-black dark:text-white">{Number(value || 0).toLocaleString(L ? "ar-SA" : "en-US")} <SARIcon size={11} className="inline opacity-60" /></p>
                    </div>
                  ))}
                </div>
              )}
              <Button
                onClick={() => createDistributionMutation.mutate()}
                disabled={!distributionPreview?.eligible || createDistributionMutation.isPending}
                className="gap-2 bg-black dark:bg-white text-white dark:text-black"
                data-testid="btn-create-distribution"
              >
                {createDistributionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {L ? "إنشاء مسودة الشهر" : "Create Monthly Draft"}
              </Button>
            </div>

            {distributionsLoading ? <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" /></div> :
              distributions.length === 0 ? <div className="text-center py-16 text-sm text-black/30 dark:text-white/30"><TrendingUp className="w-10 h-10 mx-auto mb-3 text-black/10 dark:text-white/10" />{L ? "لا توجد توزيعات شهرية بعد" : "No monthly distributions yet"}</div> :
              distributions.map((distribution) => {
                const id = String(distribution.id || distribution._id);
                const paid = distribution.investorLines.reduce((sum, line) => sum + (line.paidAmount || 0), 0);
                const statusLabel = distribution.status === "draft" ? (L ? "مسودة" : "Draft") :
                  distribution.status === "approved" ? (L ? "معتمد" : "Approved") :
                  distribution.status === "partial_paid" ? (L ? "صرف جزئي" : "Partially paid") :
                  distribution.status === "paid" ? (L ? "صُرف بالكامل" : "Paid") : (L ? "ملغى" : "Cancelled");
                return (
                  <div key={id} className="rounded-2xl border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900 p-5 space-y-4" data-testid={`distribution-${id}`}>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-black text-black dark:text-white">{distribution.period}</p>
                        <p className="text-xs text-black/40 dark:text-white/40">{L ? "صافي الربح" : "Net profit"}: {distribution.netProfit.toLocaleString(L ? "ar-SA" : "en-US")} {distribution.currency} · {L ? "الموزع" : "Distributed"}: {distribution.distributableAmount.toLocaleString(L ? "ar-SA" : "en-US")} {distribution.currency}</p>
                      </div>
                      <Badge className="border-0">{statusLabel}</Badge>
                    </div>
                    <div className="space-y-2">
                      {distribution.investorLines.map(line => (
                        <div key={line._id} className="flex items-center gap-3 rounded-xl bg-black/[0.025] dark:bg-white/[0.03] p-3 flex-wrap">
                          <div className="flex-1 min-w-[150px]"><p className="text-sm font-semibold text-black dark:text-white">{line.investorName}</p><p className="text-xs text-black/40 dark:text-white/40">{line.ownershipPercentage}%</p></div>
                          <p className="text-sm font-bold text-black dark:text-white">{line.dueAmount.toLocaleString(L ? "ar-SA" : "en-US")} {distribution.currency}</p>
                          <p className="text-xs text-black/40 dark:text-white/40">{L ? "متبقي" : "Remaining"}: {line.remainingAmount.toLocaleString(L ? "ar-SA" : "en-US")}</p>
                          {isAdmin && ["approved", "partial_paid"].includes(distribution.status) && line.remainingAmount > 0 && (
                            <Button size="sm" variant="outline" onClick={() => { setPaymentTarget({ distributionId: id, line }); setDistributionPayment({ amount: String(line.remainingAmount), reference: "", notes: "" }); }} data-testid={`btn-pay-distribution-${line._id}`}>
                              <Wallet className="w-3.5 h-3.5 ml-1" />{L ? "تسجيل صرف" : "Record payment"}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap border-t border-black/[0.06] dark:border-white/[0.06] pt-3">
                      {isAdmin && distribution.status === "draft" && <Button size="sm" onClick={() => approveDistributionMutation.mutate(id)} disabled={approveDistributionMutation.isPending} className="bg-black dark:bg-white text-white dark:text-black"><CheckCircle2 className="w-3.5 h-3.5 ml-1" />{L ? "اعتماد" : "Approve"}</Button>}
                      {isAdmin && ["draft", "approved"].includes(distribution.status) && <Button size="sm" variant="outline" onClick={() => cancelDistributionMutation.mutate(id)} disabled={cancelDistributionMutation.isPending}><XCircle className="w-3.5 h-3.5 ml-1" />{L ? "إلغاء" : "Cancel"}</Button>}
                      <span className="text-xs text-black/40 dark:text-white/40 mr-auto">{L ? "إجمالي المصروف" : "Paid"}: {paid.toLocaleString(L ? "ar-SA" : "en-US")} {distribution.currency}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Add Investor Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md" dir={dir}>
          <DialogHeader><DialogTitle className="text-right font-black flex items-center gap-2"><UserCheck className="w-5 h-5 text-black dark:text-white" />{L ? "إضافة مستثمر جديد" : "Add New Investor"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">{L ? "بحث واختيار المستخدم" : "Search & Select User"}</label>
              <Input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder={L ? "ابحث بالاسم أو البريد..." : "Search by name or email..."} data-testid="input-user-search" />
              <div className="mt-2 max-h-48 overflow-y-auto space-y-1 rounded-xl border border-black/[0.07] dark:border-white/[0.07] p-1">
                {filteredUsers.filter(u => !existingUserIds.has(String(u.id || u._id || ""))).slice(0, 10).map(u => (
                  <button key={u.id || u._id} onClick={() => setSelectedUserId(String(u.id || u._id || ""))}
                    className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-all ${selectedUserId === (u.id || u._id) ? "bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white text-black dark:text-white dark:text-black/70 dark:text-white/70" : "hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"}`}
                    data-testid={`select-user-${u.id || u._id}`}>
                    <span className="font-medium">{u.fullName}</span> <span className="text-xs text-black/40 dark:text-white/40">({u.role}) — {u.email}</span>
                  </button>
                ))}
                {filteredUsers.filter(u => !existingUserIds.has(String(u.id || u._id || ""))).length === 0 && <p className="text-center text-sm py-3 text-black/30 dark:text-white/30">{L ? "لا توجد نتائج" : "No results"}</p>}
              </div>
            </div>
            <div>
              <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">{L ? "نسبة الحصة %" : "Stake %"}</label>
              <Input type="number" min={0} max={100} value={newStake} onChange={e => setNewStake(e.target.value)} data-testid="input-new-stake" />
            </div>
            <div>
              <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">{L ? "ملاحظات" : "Notes"}</label>
              <Input value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder={L ? "ملاحظات للأدمن..." : "Admin notes..."} data-testid="input-notes" />
            </div>
            <Button className="w-full gap-2 bg-gradient-to-l from-black dark:from-white to-black/[0.08] dark:to-white/[0.1] text-white" onClick={() => addInvestorMutation.mutate()} disabled={!selectedUserId || addInvestorMutation.isPending} data-testid="btn-confirm-add-investor">
              {addInvestorMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} {L ? "إضافة المستثمر" : "Add Investor"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Investor Dialog */}
      <Dialog open={!!editInvestor} onOpenChange={v => !v && setEditInvestor(null)}>
        <DialogContent className="max-w-md" dir={dir}>
          <DialogHeader><DialogTitle className="text-right font-black flex items-center gap-2"><Edit2 className="w-5 h-5 text-black dark:text-white" />{L ? "تعديل:" : "Edit:"} {editInvestor?.userId?.fullName}</DialogTitle></DialogHeader>
          {editInvestor && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">{L ? "نسبة الحصة %" : "Stake %"}</label>
                <Input type="number" min={0} max={100} value={newStake} onChange={e => setNewStake(e.target.value)} data-testid="input-edit-stake" />
              </div>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={editInvestor.isVerified} onChange={e => setEditInvestor(prev => prev ? { ...prev, isVerified: e.target.checked } : prev)} data-testid="check-verified" />
                  <span className="text-black dark:text-white">{L ? "موثق" : "Verified"}</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={editInvestor.isActive} onChange={e => setEditInvestor(prev => prev ? { ...prev, isActive: e.target.checked } : prev)} data-testid="check-active" />
                  <span className="text-black dark:text-white">{L ? "نشط" : "Active"}</span>
                </label>
              </div>
              <div>
                <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">{L ? "ملاحظات" : "Notes"}</label>
                <Input value={newNotes} onChange={e => setNewNotes(e.target.value)} data-testid="input-edit-notes" />
              </div>
              <Button className="w-full gap-2 bg-gradient-to-l from-black dark:from-white to-black/[0.08] dark:to-white/[0.1] text-white" onClick={() => updateInvestorMutation.mutate()} disabled={updateInvestorMutation.isPending} data-testid="btn-confirm-edit">
                {updateInvestorMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} {L ? "حفظ التعديلات" : "Save Changes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!paymentTarget} onOpenChange={v => !v && setPaymentTarget(null)}>
        <DialogContent className="max-w-md" dir={dir}>
          <DialogHeader><DialogTitle className="text-right font-black flex items-center gap-2"><Wallet className="w-5 h-5" />{L ? "تسجيل دفعة أرباح" : "Record profit payment"}</DialogTitle></DialogHeader>
          {paymentTarget && <div className="space-y-4">
            <p className="text-sm text-black/50 dark:text-white/50">{paymentTarget.line.investorName} · {L ? "المتبقي" : "Remaining"} {paymentTarget.line.remainingAmount.toLocaleString(L ? "ar-SA" : "en-US")}</p>
            <Input type="number" min={0.01} max={paymentTarget.line.remainingAmount} value={distributionPayment.amount} onChange={e => setDistributionPayment(p => ({ ...p, amount: e.target.value }))} placeholder={L ? "المبلغ" : "Amount"} data-testid="input-distribution-payment" />
            <Input value={distributionPayment.reference} onChange={e => setDistributionPayment(p => ({ ...p, reference: e.target.value }))} placeholder={L ? "مرجع التحويل (اختياري)" : "Transfer reference (optional)"} data-testid="input-distribution-payment-reference" />
            <Input value={distributionPayment.notes} onChange={e => setDistributionPayment(p => ({ ...p, notes: e.target.value }))} placeholder={L ? "ملاحظة (اختياري)" : "Note (optional)"} />
            <Button className="w-full bg-black dark:bg-white text-white dark:text-black" onClick={() => payDistributionMutation.mutate()} disabled={!Number(distributionPayment.amount) || Number(distributionPayment.amount) > paymentTarget.line.remainingAmount || payDistributionMutation.isPending} data-testid="btn-confirm-distribution-payment">
              {payDistributionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 ml-1" />}{L ? "حفظ الدفعة" : "Save payment"}
            </Button>
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
