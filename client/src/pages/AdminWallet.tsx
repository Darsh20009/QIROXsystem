import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import SARIcon from "@/components/SARIcon";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Wallet, TrendingUp, TrendingDown, AlertCircle, ArrowUpRight, ArrowDownLeft,
  Plus, Trash2, Users, Clock, ChevronLeft, CreditCard, CheckCircle2, XCircle, RefreshCw, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

interface Client { id: string; fullName: string; username: string; email: string; }
interface WalletTx { id: string; type: "debit" | "credit"; amount: number; description: string; note: string; addedBy?: { fullName: string }; createdAt: string; }
interface WalletData { transactions: WalletTx[]; totalDebit: number; totalCredit: number; outstanding: number; }
interface TopupRequest {
  id: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  bankName: string;
  bankRef: string;
  note: string;
  createdAt: string;
  rejectionReason?: string;
  userId: { fullName: string; email: string; username: string };
}

function fmt(n: number) {
  return n.toLocaleString("ar-SA", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function AdminWallet() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"clients" | "topups">("clients");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ type: "credit", amount: "", description: "", note: "" });
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: clients, isLoading: loadingClients } = useQuery<Client[]>({ queryKey: ["/api/admin/wallet/clients"] });
  const { data: topupRequests, isLoading: loadingTopups } = useQuery<TopupRequest[]>({ queryKey: ["/api/admin/wallet/topup-requests"] });

  const { data: walletData, isLoading: loadingWallet } = useQuery<WalletData>({
    queryKey: ["/api/admin/wallet", selectedClient?.id],
    queryFn: async () => {
      const r = await fetch(`/api/admin/wallet/${selectedClient!.id}`, { credentials: "include" });
      return r.json();
    },
    enabled: !!selectedClient,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/wallet/transaction", {
        userId: selectedClient!.id, type: form.type,
        amount: Number(form.amount), description: form.description, note: form.note,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wallet", selectedClient?.id] });
      setAddOpen(false);
      setForm({ type: "debit", amount: "", description: "", note: "" });
      toast({ title: "تمت الإضافة بنجاح" });
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/admin/wallet/transaction/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wallet", selectedClient?.id] });
      setDeleteId(null);
      toast({ title: "تم الحذف" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/admin/wallet/topup-approve/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wallet/topup-requests"] });
      toast({ title: "تم اعتماد طلب الشحن وإضافة الرصيد" });
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await apiRequest("POST", `/api/admin/wallet/topup-reject/${id}`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wallet/topup-requests"] });
      setRejectId(null);
      setRejectReason("");
      toast({ title: "تم رفض الطلب" });
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const txs = walletData?.transactions || [];
  const pendingTopups = (topupRequests || []).filter(r => r.status === 'pending');

  return (
    <><div className="min-h-screen bg-[#f8f8f8] dark:bg-gray-950" dir="rtl">
      <PageGraphics variant="dashboard" />
      <div className="bg-white dark:bg-gray-900 border-b border-black/[0.06] dark:border-white/[0.08] px-6 py-5 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <SidebarTrigger className="text-black/40 dark:text-white/40" />
          {selectedClient && (
            <button onClick={() => setSelectedClient(null)} className="flex items-center gap-1.5 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors text-sm">
              <ChevronLeft className="w-4 h-4" />العملاء
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#0f172a,#1e3a5f)" }}>
              <Wallet className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-black dark:text-white">
                {selectedClient ? `محفظة: ${selectedClient.fullName || selectedClient.username}` : "إدارة المحافظ"}
              </h1>
              <p className="text-xs text-black/40 dark:text-white/40">
                {selectedClient ? selectedClient.email : "Qirox Pay — إدارة المدفوعات والشحن"}
              </p>
            </div>
          </div>
          {selectedClient && (
            <div className="mr-auto flex gap-2">
              <Button onClick={() => { setForm(f => ({ ...f, type: "credit" })); setAddOpen(true); }} size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5" data-testid="button-add-credit">
                <Plus className="w-3.5 h-3.5" />شحن المحفظة
              </Button>
              <Button onClick={() => { setForm(f => ({ ...f, type: "debit" })); setAddOpen(true); }} size="sm"
                variant="outline" className="text-rose-600 border-rose-200 hover:border-rose-300 hover:bg-rose-50 text-xs gap-1.5" data-testid="button-add-debit">
                <TrendingDown className="w-3.5 h-3.5" />إضافة مستحق
              </Button>
            </div>
          )}
          {!selectedClient && pendingTopups.length > 0 && (
            <Badge className="mr-auto bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
              {pendingTopups.length} طلب شحن معلّق
            </Badge>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {!selectedClient ? (
          <div className="space-y-5">
            {/* Tabs */}
            <div className="flex gap-1 bg-black/[0.04] dark:bg-white/[0.05] rounded-xl p-1 max-w-sm">
              {([
                { id: "clients", label: "محافظ العملاء" },
                { id: "topups", label: `طلبات الشحن${pendingTopups.length ? ` (${pendingTopups.length})` : ''}` },
              ] as const).map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  data-testid={`admin-tab-${tab.id}`}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === tab.id ? "bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm" : "text-black/40 dark:text-white/40"}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Client List */}
            {activeTab === "clients" && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden">
                <div className="px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center gap-2">
                  <Users className="w-4 h-4 text-black/40 dark:text-white/40" />
                  <h2 className="text-sm font-bold text-black dark:text-white">اختر عميلاً لإدارة محفظته</h2>
                </div>
                {loadingClients ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-5 h-5 animate-spin text-black/20 dark:text-white/20" />
                  </div>
                ) : (
                  <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                    {(clients || []).map(c => (
                      <button key={c.id} onClick={() => setSelectedClient(c)} data-testid={`client-row-${c.id}`}
                        className="w-full px-5 py-4 flex items-center gap-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors text-right">
                        <div className="w-9 h-9 rounded-xl bg-black/[0.05] dark:bg-white/[0.07] flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-black text-black/40 dark:text-white/40">{(c.fullName || c.username)[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-black dark:text-white truncate">{c.fullName || c.username}</p>
                          <p className="text-xs text-black/40 dark:text-white/40 truncate">{c.email}</p>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-black/20 dark:text-white/20 rotate-180" />
                      </button>
                    ))}
                    {(clients || []).length === 0 && (
                      <div className="py-16 text-center">
                        <p className="text-sm text-black/30 dark:text-white/30">لا يوجد عملاء</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Topup Requests */}
            {activeTab === "topups" && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden">
                <div className="px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-black/40 dark:text-white/40" />
                  <h2 className="text-sm font-bold text-black dark:text-white">طلبات شحن المحافظ</h2>
                </div>
                {loadingTopups ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-5 h-5 animate-spin text-black/20 dark:text-white/20" />
                  </div>
                ) : (topupRequests || []).length === 0 ? (
                  <div className="py-16 text-center">
                    <CreditCard className="w-10 h-10 text-black/10 dark:text-white/10 mx-auto mb-3" />
                    <p className="text-sm text-black/30 dark:text-white/30">لا توجد طلبات شحن</p>
                  </div>
                ) : (
                  <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                    {(topupRequests || []).map(req => (
                      <div key={req.id} className="px-5 py-5" data-testid={`topup-admin-${req.id}`}>
                        <div className="flex items-start gap-4">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${req.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-900/20' : req.status === 'rejected' ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                            {req.status === 'approved' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              : req.status === 'rejected' ? <XCircle className="w-4 h-4 text-rose-500" />
                                : <RefreshCw className="w-4 h-4 text-amber-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="text-sm font-bold text-black dark:text-white flex items-center gap-1">{fmt(req.amount)} <SARIcon size={11} className="opacity-70" /></p>
                              <Badge className={`text-[10px] border-0 flex-shrink-0 ${req.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : req.status === 'rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                {req.status === 'approved' ? 'مُعتمد' : req.status === 'rejected' ? 'مرفوض' : 'معلّق'}
                              </Badge>
                            </div>
                            <p className="text-xs text-black/60 dark:text-white/60 mb-0.5">
                              {req.userId?.fullName || "—"} · {req.userId?.email || "—"}
                            </p>
                            <p className="text-xs text-black/40 dark:text-white/40 mb-0.5">
                              {req.bankName || "—"} · مرجع: {req.bankRef || "—"}
                            </p>
                            {req.note && <p className="text-xs text-black/30 dark:text-white/30 mb-1">{req.note}</p>}
                            {req.rejectionReason && <p className="text-xs text-rose-600 dark:text-rose-400">سبب الرفض: {req.rejectionReason}</p>}
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3 text-black/20 dark:text-white/20" />
                              <p className="text-[11px] text-black/30 dark:text-white/30">
                                {new Date(req.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}
                              </p>
                            </div>
                          </div>
                        </div>
                        {req.status === 'pending' && (
                          <div className="flex gap-2 mt-3 mr-13">
                            <Button size="sm" onClick={() => approveMutation.mutate(req.id)}
                              disabled={approveMutation.isPending}
                              className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                              data-testid={`button-approve-topup-${req.id}`}>
                              {approveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                              اعتماد وشحن
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { setRejectId(req.id); setRejectReason(""); }}
                              className="text-xs gap-1.5 text-rose-600 hover:text-rose-700 border-rose-200 hover:border-rose-300"
                              data-testid={`button-reject-topup-${req.id}`}>
                              <XCircle className="w-3 h-3" />
                              رفض
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Client Wallet Detail */
          <div className="space-y-5">
            {loadingWallet ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-4 text-center">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mx-auto mb-2">
                      <TrendingDown className="w-4 h-4 text-rose-500" />
                    </div>
                    <p className="text-[10px] text-black/40 dark:text-white/40 mb-1">إجمالي المستحق</p>
                    <p className="text-lg font-black text-black dark:text-white flex items-center justify-center gap-1">{fmt(walletData?.totalDebit || 0)} <SARIcon size={12} className="opacity-40" /></p>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-4 text-center">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-[10px] text-black/40 dark:text-white/40 mb-1">إجمالي المدفوع</p>
                    <p className="text-lg font-black text-black dark:text-white flex items-center justify-center gap-1">{fmt(walletData?.totalCredit || 0)} <SARIcon size={12} className="opacity-40" /></p>
                  </div>
                  <div className={`rounded-2xl border p-4 text-center ${(walletData?.outstanding || 0) > 0 ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30" : "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30"}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2 ${(walletData?.outstanding || 0) > 0 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-emerald-100 dark:bg-emerald-900/30"}`}>
                      <AlertCircle className={`w-4 h-4 ${(walletData?.outstanding || 0) > 0 ? "text-amber-500" : "text-emerald-500"}`} />
                    </div>
                    <p className="text-[10px] text-black/40 dark:text-white/40 mb-1">الرصيد المتبقي</p>
                    <p className={`text-lg font-black ${(walletData?.outstanding || 0) > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      <span className="flex items-center justify-center gap-1">{fmt(Math.abs(walletData?.outstanding || 0))} <SARIcon size={12} className="opacity-60" /></span>
                    </p>
                    {(walletData?.outstanding || 0) === 0 && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">مسدد بالكامل</p>}
                    {(walletData?.outstanding || 0) < 0 && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">رصيد دائن</p>}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden">
                  <div className="px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.08]">
                    <h2 className="text-sm font-bold text-black dark:text-white">سجل المعاملات ({txs.length})</h2>
                  </div>
                  {txs.length === 0 ? (
                    <div className="py-16 text-center">
                      <Wallet className="w-10 h-10 text-black/10 dark:text-white/10 mx-auto mb-3" />
                      <p className="text-sm font-medium text-black/30 dark:text-white/30">لا توجد معاملات بعد</p>
                      <Button onClick={() => setAddOpen(true)} size="sm" variant="outline" className="mt-4 text-xs gap-1.5">
                        <Plus className="w-3.5 h-3.5" />إضافة معاملة
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-[500px]">
                      <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                        {txs.map(tx => (
                          <div key={tx.id} className="px-5 py-4 flex items-center gap-4" data-testid={`admin-tx-${tx.id}`}>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === 'credit' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}`}>
                              {tx.type === 'credit' ? <ArrowDownLeft className="w-4 h-4 text-emerald-500" /> : <ArrowUpRight className="w-4 h-4 text-rose-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-black dark:text-white truncate">{tx.description}</p>
                              {tx.note && <p className="text-xs text-black/40 dark:text-white/40 mt-0.5">{tx.note}</p>}
                              <div className="flex items-center gap-3 mt-1">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-black/20 dark:text-white/20" />
                                  <p className="text-[11px] text-black/30 dark:text-white/30">
                                    {new Date(tx.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
                                  </p>
                                </div>
                                {tx.addedBy && <p className="text-[11px] text-black/30 dark:text-white/30">· {tx.addedBy.fullName}</p>}
                              </div>
                            </div>
                            <div className="text-left flex-shrink-0 ml-2">
                              <p className={`text-base font-black ${tx.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {tx.type === 'credit' ? '+' : '-'}{fmt(tx.amount)}
                              </p>
                              <SARIcon size={9} className="opacity-30 mt-0.5" />
                            </div>
                            <Badge className={`text-[10px] px-2 py-0.5 border-0 flex-shrink-0 ${tx.type === 'credit' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                              {tx.type === 'credit' ? 'دفعة' : 'مستحق'}
                            </Badge>
                            <button onClick={() => setDeleteId(tx.id)} data-testid={`delete-tx-${tx.id}`}
                              className="w-7 h-7 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-colors group flex-shrink-0">
                              <Trash2 className="w-3.5 h-3.5 text-black/20 dark:text-white/20 group-hover:text-red-500 transition-colors" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Add Transaction Dialog */}
    <Dialog open={addOpen} onOpenChange={o => { setAddOpen(o); if (!o) setForm({ type: "credit", amount: "", description: "", note: "" }); }}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            {form.type === "credit"
              ? <><span className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center"><Plus className="w-4 h-4 text-emerald-600" /></span> شحن محفظة العميل</>
              : <><span className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center"><TrendingDown className="w-4 h-4 text-rose-600" /></span> إضافة مستحق على العميل</>
            }
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Type Switcher */}
          <div className="flex gap-2 p-1 bg-black/[0.04] rounded-xl">
            <button type="button" onClick={() => setForm(f => ({ ...f, type: "credit" }))}
              data-testid="btn-type-credit"
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${form.type === "credit" ? "bg-emerald-600 text-white shadow" : "text-black/40 hover:text-black/70"}`}>
              <Plus className="w-3.5 h-3.5" /> شحن المحفظة (إضافة رصيد)
            </button>
            <button type="button" onClick={() => setForm(f => ({ ...f, type: "debit" }))}
              data-testid="btn-type-debit"
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${form.type === "debit" ? "bg-rose-600 text-white shadow" : "text-black/40 hover:text-black/70"}`}>
              <TrendingDown className="w-3.5 h-3.5" /> إضافة مستحق
            </button>
          </div>
          <p className="text-[11px] text-black/40 dark:text-white/40 bg-black/[0.02] rounded-lg px-3 py-2">
            {form.type === "credit"
              ? "✅ سيُضاف الرصيد مباشرة لمحفظة العميل ويستطيع استخدامه في الدفع"
              : "⚠️ سيُسجَّل مبلغ مستحق على العميل (فاتورة/التزام مالي)"}
          </p>
          <div>
            <Label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-2 flex items-center gap-1">المبلغ (<SARIcon size={10} className="opacity-60" />) <span className="text-red-400">*</span></Label>
            <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} data-testid="input-tx-amount"
              className={form.type === "credit" ? "border-emerald-300 focus:border-emerald-500" : "border-rose-300 focus:border-rose-500"} dir="ltr" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-2 block">الوصف <span className="text-red-400">*</span></Label>
            <Input
              placeholder={form.type === "credit" ? "مثال: شحن محفظة بتحويل بنكي" : "مثال: رسوم اشتراك - باقة الاحترافية"}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} data-testid="input-tx-description" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-2 block">ملاحظة (اختياري)</Label>
            <Textarea placeholder="أي تفاصيل إضافية..." value={form.note} rows={2}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))} data-testid="input-tx-note" className="resize-none" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setAddOpen(false)} className="text-xs">إلغاء</Button>
          <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.amount || !form.description}
            className={`text-white text-xs gap-2 ${form.type === "credit" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}
            data-testid="button-confirm-add">
            {addMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : form.type === "credit" ? <Plus className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {form.type === "credit" ? "شحن المحفظة" : "تسجيل المستحق"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Delete Confirm */}
    <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-right">حذف المعاملة</AlertDialogTitle>
          <AlertDialogDescription className="text-right">هل أنت متأكد من حذف هذه المعاملة؟ لا يمكن التراجع.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction onClick={() => deleteMutation.mutate(deleteId!)} className="bg-red-600 hover:bg-red-700 text-white">
            {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "حذف"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Reject reason dialog */}
    <Dialog open={!!rejectId} onOpenChange={o => { if (!o) { setRejectId(null); setRejectReason(""); } }}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">رفض طلب الشحن</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <Label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-2 block">سبب الرفض (اختياري)</Label>
          <Textarea placeholder="مثال: المبلغ غير متطابق مع الحوالة..." value={rejectReason} rows={3}
            onChange={e => setRejectReason(e.target.value)} className="resize-none" data-testid="input-reject-reason" />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { setRejectId(null); setRejectReason(""); }} className="text-xs">إلغاء</Button>
          <Button onClick={() => rejectMutation.mutate({ id: rejectId!, reason: rejectReason })}
            disabled={rejectMutation.isPending}
            className="bg-red-600 hover:bg-red-700 text-white text-xs" data-testid="button-confirm-reject">
            {rejectMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "تأكيد الرفض"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
