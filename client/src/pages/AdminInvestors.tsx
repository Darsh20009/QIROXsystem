import { useState } from "react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
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

type AllUsersResp = { users: { id: string; _id?: string; fullName: string; username: string; email: string; role: string }[] };

const STATUS_CONFIG = {
  pending: { label: "بانتظار المراجعة", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  approved: { label: "موافق", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  rejected: { label: "مرفوض", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

type Tab = "investors" | "payments";

export default function AdminInvestors() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("investors");
  const [addOpen, setAddOpen] = useState(false);
  const [editInvestor, setEditInvestor] = useState<InvestorProfile | null>(null);
  const [viewPayments, setViewPayments] = useState<InvestorProfile | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newStake, setNewStake] = useState("0");
  const [newNotes, setNewNotes] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const { data: investors = [], isLoading } = useQuery<InvestorProfile[]>({ queryKey: ["/api/admin/investors"] });

  const { data: payments = [], isLoading: payLoading } = useQuery<Payment[]>({
    queryKey: ["/api/admin/investment-payments", paymentFilter],
    queryFn: async () => {
      const p = paymentFilter !== "all" ? `?status=${paymentFilter}` : "";
      const r = await fetch(`/api/admin/investment-payments${p}`);
      return r.json();
    },
  });

  const { data: allUsersResp } = useQuery<AllUsersResp>({
    queryKey: ["/api/admin/all-users"],
    queryFn: async () => {
      const r = await fetch("/api/admin/all-users?limit=200");
      return r.json();
    },
    enabled: addOpen,
  });

  const addInvestorMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/investors", { userId: selectedUserId, stakePercentage: parseFloat(newStake), notes: newNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/investors"] });
      setAddOpen(false); setSelectedUserId(""); setNewStake("0"); setNewNotes("");
      toast({ title: "✅ تم إنشاء ملف المستثمر وتعيين الدور" });
    },
    onError: (e: any) => toast({ title: e?.message || "فشل الإنشاء", variant: "destructive" }),
  });

  const updateInvestorMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/admin/investors/${editInvestor?.id || editInvestor?._id}`, {
      stakePercentage: parseFloat(newStake), notes: newNotes, isVerified: editInvestor?.isVerified, isActive: editInvestor?.isActive
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/investors"] });
      setEditInvestor(null);
      toast({ title: "✅ تم تحديث ملف المستثمر" });
    },
    onError: () => toast({ title: "فشل التحديث", variant: "destructive" }),
  });

  const approvePaymentMutation = useMutation({
    mutationFn: ({ id, status, adminNote }: { id: string; status: string; adminNote?: string }) =>
      apiRequest("PATCH", `/api/admin/investment-payments/${id}`, { status, adminNote: adminNote || "" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/investment-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/investors"] });
      toast({ title: "✅ تم تحديث حالة الدفعة" });
    },
    onError: () => toast({ title: "فشل التحديث", variant: "destructive" }),
  });

  const totalInvested = investors.reduce((s, i) => s + i.totalInvested, 0);
  const totalStake = investors.reduce((s, i) => s + i.stakePercentage, 0);
  const pendingPayments = payments.filter(p => p.status === "pending").length;

  const filteredUsers = (allUsersResp?.users || []).filter(u =>
    u.fullName.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())
  );
  const existingUserIds = new Set(investors.map(i => i.userId?._id));

  return (
    <div className="relative overflow-hidden min-h-screen bg-white dark:bg-gray-950 p-6" dir="rtl">
      <PageGraphics variant="dashboard" />
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="relative bg-gradient-to-bl from-amber-500/10 via-yellow-500/5 to-transparent border border-black/[0.07] dark:border-white/[0.07] rounded-3xl p-7 overflow-hidden">
          <div className="absolute -top-10 -left-10 w-48 h-48 bg-gradient-to-br from-amber-500/20 to-yellow-500/10 rounded-full blur-3xl" />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-black dark:text-white">إدارة المستثمرين</h1>
                <p className="text-black/40 dark:text-white/40 text-sm">تتبع حصص الاستثمار والمدفوعات</p>
              </div>
            </div>
            <Button onClick={() => setAddOpen(true)} className="gap-2 bg-gradient-to-l from-amber-500 to-yellow-400 text-white shadow-lg shadow-amber-500/20" data-testid="btn-add-investor">
              <Plus className="w-4 h-4" /> إضافة مستثمر
            </Button>
          </div>

          {/* Stats */}
          <div className="relative mt-5 grid grid-cols-4 gap-3">
            {[
              { label: "المستثمرون", value: investors.length, icon: Users, color: "text-amber-500" },
              { label: "إجمالي الاستثمارات", value: `${totalInvested.toLocaleString("ar-SA")} ر.س`, icon: Wallet, color: "text-green-500" },
              { label: "مجموع الحصص", value: `${totalStake}%`, icon: Percent, color: "text-blue-500" },
              { label: "دفعات معلقة", value: pendingPayments, icon: AlertCircle, color: "text-red-500" },
            ].map(stat => (
              <div key={stat.label} className="bg-white/50 dark:bg-gray-900/50 border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-4">
                <stat.icon className={`w-4 h-4 ${stat.color} mb-1.5`} />
                <p className="text-xl font-black text-black dark:text-white">{stat.value}</p>
                <p className="text-xs text-black/40 dark:text-white/40">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-black/[0.06] dark:border-white/[0.06]">
          {([
            { id: "investors" as Tab, label: "المستثمرون", icon: Users },
            { id: "payments" as Tab, label: "الدفعات", icon: DollarSign },
          ]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${tab === t.id ? "border-amber-500 text-amber-600 dark:text-amber-400" : "border-transparent text-black/40 dark:text-white/40"}`}
              data-testid={`tab-${t.id}`}>
              <t.icon className="w-4 h-4" />{t.label}
              {t.id === "payments" && pendingPayments > 0 && <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center">{pendingPayments}</span>}
            </button>
          ))}
        </div>

        {/* Investors List */}
        {tab === "investors" && (
          <div className="space-y-3">
            {isLoading ? <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" /></div> : (
              investors.length === 0
                ? <div className="text-center py-16 text-sm text-black/30 dark:text-white/30"><TrendingUp className="w-10 h-10 mx-auto mb-3 text-black/10 dark:text-white/10" />لا يوجد مستثمرون — اضغط "إضافة مستثمر"</div>
                : investors.map(inv => (
                  <motion.div key={inv.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-5 rounded-2xl border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900"
                    data-testid={`investor-${inv.id}`}>
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 shrink-0 flex items-center justify-center">
                      {inv.userId?.profilePhotoUrl ? <img src={inv.userId.profilePhotoUrl} className="w-full h-full object-cover" alt="" /> : <span className="text-xl">{inv.userId?.fullName?.[0]?.toUpperCase()}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-black dark:text-white">{inv.userId?.fullName}</span>
                        {inv.isVerified && <Badge className="text-[10px] px-2 py-0 border-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">✓ موثق</Badge>}
                        {!inv.isActive && <Badge className="text-[10px] px-2 py-0 border-0 bg-red-100 text-red-700">غير نشط</Badge>}
                      </div>
                      <p className="text-xs text-black/30 dark:text-white/30">{inv.userId?.email}</p>
                      {inv.userId?.jobTitle && <p className="text-xs text-cyan-600 dark:text-cyan-400">{inv.userId.jobTitle}</p>}
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{inv.stakePercentage}%</p>
                      <p className="text-xs text-black/30 dark:text-white/30">حصة</p>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-bold text-green-600 dark:text-green-400">{inv.totalInvested.toLocaleString("ar-SA")}</p>
                      <p className="text-xs text-black/30 dark:text-white/30">ر.س مستثمر</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => { setEditInvestor(inv); setNewStake(String(inv.stakePercentage)); setNewNotes(inv.notes || ""); }} data-testid={`btn-edit-${inv.id}`}>
                      <Edit2 className="w-3.5 h-3.5" /> تعديل
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
                  {s === "all" ? "الكل" : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label}
                </button>
              ))}
            </div>
            {payLoading ? <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" /></div> : (
              payments.length === 0
                ? <div className="text-center py-16 text-sm text-black/30 dark:text-white/30"><DollarSign className="w-10 h-10 mx-auto mb-3 text-black/10 dark:text-white/10" />لا توجد دفعات</div>
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
                          <p className="text-xs text-black/30 dark:text-white/30 mt-0.5">{new Date(p.createdAt).toLocaleDateString("ar-SA")} · {p.paymentMethod}</p>
                          {p.description && <p className="text-xs text-black/40 dark:text-white/40 mt-0.5 italic">"{p.description}"</p>}
                        </div>
                        <div className="text-left">
                          <p className="text-xl font-black text-green-600 dark:text-green-400">{p.amount.toLocaleString("ar-SA")} {p.currency}</p>
                          {p.proofUrl && <a href={p.proofUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 underline flex items-center gap-1"><Eye className="w-3 h-3" /> عرض الإيصال</a>}
                        </div>
                      </div>
                      {p.signatureText && <p className="text-xs text-black/40 dark:text-white/40">التوقيع النصي: {p.signatureText}</p>}
                      {p.status === "pending" && (
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" className="gap-1.5 bg-green-500 hover:bg-green-600 text-white" onClick={() => approvePaymentMutation.mutate({ id: p.id, status: "approved" })} disabled={approvePaymentMutation.isPending} data-testid={`btn-approve-${p.id}`}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> موافقة
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1.5 text-red-500 border-red-200 hover:bg-red-50" onClick={() => approvePaymentMutation.mutate({ id: p.id, status: "rejected" })} disabled={approvePaymentMutation.isPending} data-testid={`btn-reject-${p.id}`}>
                            <XCircle className="w-3.5 h-3.5" /> رفض
                          </Button>
                        </div>
                      )}
                      {p.adminNote && <p className="text-xs text-black/40 dark:text-white/40 border-t border-black/[0.05] dark:border-white/[0.05] pt-2">ملاحظة الأدمن: {p.adminNote}</p>}
                    </div>
                  );
                })
            )}
          </div>
        )}
      </div>

      {/* Add Investor Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle className="text-right font-black flex items-center gap-2"><UserCheck className="w-5 h-5 text-amber-500" />إضافة مستثمر جديد</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">بحث واختيار المستخدم</label>
              <Input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="ابحث بالاسم أو البريد..." data-testid="input-user-search" />
              <div className="mt-2 max-h-48 overflow-y-auto space-y-1 rounded-xl border border-black/[0.07] dark:border-white/[0.07] p-1">
                {filteredUsers.filter(u => !existingUserIds.has(String(u.id || u._id || ""))).slice(0, 10).map(u => (
                  <button key={u.id || u._id} onClick={() => setSelectedUserId(String(u.id || u._id || ""))}
                    className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-all ${selectedUserId === (u.id || u._id) ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" : "hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"}`}
                    data-testid={`select-user-${u.id || u._id}`}>
                    <span className="font-medium">{u.fullName}</span> <span className="text-xs text-black/40 dark:text-white/40">({u.role}) — {u.email}</span>
                  </button>
                ))}
                {filteredUsers.filter(u => !existingUserIds.has(String(u.id || u._id || ""))).length === 0 && <p className="text-center text-sm py-3 text-black/30 dark:text-white/30">لا توجد نتائج</p>}
              </div>
            </div>
            <div>
              <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">نسبة الحصة %</label>
              <Input type="number" min={0} max={100} value={newStake} onChange={e => setNewStake(e.target.value)} data-testid="input-new-stake" />
            </div>
            <div>
              <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">ملاحظات</label>
              <Input value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="ملاحظات للأدمن..." data-testid="input-notes" />
            </div>
            <Button className="w-full gap-2 bg-gradient-to-l from-amber-500 to-yellow-400 text-white" onClick={() => addInvestorMutation.mutate()} disabled={!selectedUserId || addInvestorMutation.isPending} data-testid="btn-confirm-add-investor">
              {addInvestorMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} إضافة المستثمر
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Investor Dialog */}
      <Dialog open={!!editInvestor} onOpenChange={v => !v && setEditInvestor(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle className="text-right font-black flex items-center gap-2"><Edit2 className="w-5 h-5 text-amber-500" />تعديل: {editInvestor?.userId?.fullName}</DialogTitle></DialogHeader>
          {editInvestor && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">نسبة الحصة %</label>
                <Input type="number" min={0} max={100} value={newStake} onChange={e => setNewStake(e.target.value)} data-testid="input-edit-stake" />
              </div>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={editInvestor.isVerified} onChange={e => setEditInvestor(prev => prev ? { ...prev, isVerified: e.target.checked } : prev)} data-testid="check-verified" />
                  <span className="text-black dark:text-white">موثق</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={editInvestor.isActive} onChange={e => setEditInvestor(prev => prev ? { ...prev, isActive: e.target.checked } : prev)} data-testid="check-active" />
                  <span className="text-black dark:text-white">نشط</span>
                </label>
              </div>
              <div>
                <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">ملاحظات</label>
                <Input value={newNotes} onChange={e => setNewNotes(e.target.value)} data-testid="input-edit-notes" />
              </div>
              <Button className="w-full gap-2 bg-gradient-to-l from-amber-500 to-yellow-400 text-white" onClick={() => updateInvestorMutation.mutate()} disabled={updateInvestorMutation.isPending} data-testid="btn-confirm-edit">
                {updateInvestorMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} حفظ التعديلات
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
