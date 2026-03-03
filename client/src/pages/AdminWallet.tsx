import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wallet, TrendingUp, TrendingDown, AlertCircle, ArrowUpRight, ArrowDownLeft, Plus, Trash2, Users, Clock, ChevronLeft } from "lucide-react";
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

function fmt(n: number) {
  return n.toLocaleString("ar-SA", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function AdminWallet() {
  const { toast } = useToast();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ type: "debit", amount: "", description: "", note: "" });

  const { data: clients, isLoading: loadingClients } = useQuery<Client[]>({ queryKey: ["/api/admin/wallet/clients"] });

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
      const r = await apiRequest("POST", "/api/admin/wallet/transaction", {
        userId: selectedClient!.id,
        type: form.type,
        amount: Number(form.amount),
        description: form.description,
        note: form.note,
      });
      if (!r.ok) throw new Error("فشل إضافة المعاملة");
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
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/wallet/transaction/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wallet", selectedClient?.id] });
      setDeleteId(null);
      toast({ title: "تم الحذف" });
    },
  });

  const txs = walletData?.transactions || [];

  return (
    <><div className="min-h-screen bg-[#f8f8f8] dark:bg-gray-950" dir="rtl">
      <PageGraphics variant="dashboard" />
        <div className="bg-white dark:bg-gray-900 border-b border-black/[0.06] dark:border-white/[0.08] px-6 py-5 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto flex items-center gap-4">
            <SidebarTrigger className="text-black/40 dark:text-white/40" />
            {selectedClient && (
              <button onClick={() => setSelectedClient(null)} className="flex items-center gap-1.5 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors text-sm">
                <ChevronLeft className="w-4 h-4" />
                العملاء
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-black dark:bg-white flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white dark:text-black" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-black dark:text-white">
                  {selectedClient ? `محفظة: ${selectedClient.fullName || selectedClient.username}` : "محافظ العملاء"}
                </h1>
                <p className="text-xs text-black/40 dark:text-white/40">
                  {selectedClient ? selectedClient.email : "إدارة المدفوعات والمستحقات"}
                </p>
              </div>
            </div>
            {selectedClient && (
              <Button onClick={() => setAddOpen(true)} size="sm" className="mr-auto bg-black text-white hover:bg-black/80 text-xs gap-2" data-testid="button-add-transaction">
                <Plus className="w-3.5 h-3.5" />إضافة معاملة
              </Button>
            )}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6">
          {!selectedClient ? (
            /* Client List */
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden">
              <div className="px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center gap-2">
                <Users className="w-4 h-4 text-black/40 dark:text-white/40" />
                <h2 className="text-sm font-bold text-black dark:text-white">اختر عميلاً</h2>
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
          ) : (
            /* Client Wallet Detail */
            <div className="space-y-5">
              {loadingWallet ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" />
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-4 text-center">
                      <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mx-auto mb-2">
                        <TrendingDown className="w-4 h-4 text-rose-500" />
                      </div>
                      <p className="text-[10px] text-black/40 dark:text-white/40 mb-1">إجمالي المستحق</p>
                      <p className="text-lg font-black text-black dark:text-white">{fmt(walletData?.totalDebit || 0)} <span className="text-xs font-medium text-black/40">ر.س</span></p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-4 text-center">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                      </div>
                      <p className="text-[10px] text-black/40 dark:text-white/40 mb-1">إجمالي المدفوع</p>
                      <p className="text-lg font-black text-black dark:text-white">{fmt(walletData?.totalCredit || 0)} <span className="text-xs font-medium text-black/40">ر.س</span></p>
                    </div>
                    <div className={`rounded-2xl border p-4 text-center ${(walletData?.outstanding || 0) > 0 ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30" : "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30"}`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2 ${(walletData?.outstanding || 0) > 0 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-emerald-100 dark:bg-emerald-900/30"}`}>
                        <AlertCircle className={`w-4 h-4 ${(walletData?.outstanding || 0) > 0 ? "text-amber-500" : "text-emerald-500"}`} />
                      </div>
                      <p className="text-[10px] text-black/40 dark:text-white/40 mb-1">الرصيد المتبقي</p>
                      <p className={`text-lg font-black ${(walletData?.outstanding || 0) > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {fmt(Math.abs(walletData?.outstanding || 0))} <span className="text-xs font-medium opacity-60">ر.س</span>
                      </p>
                      {(walletData?.outstanding || 0) === 0 && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">مسدد بالكامل</p>}
                      {(walletData?.outstanding || 0) < 0 && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">رصيد دائن</p>}
                    </div>
                  </div>

                  {/* Transactions */}
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
                                {tx.type === 'credit'
                                  ? <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                                  : <ArrowUpRight className="w-4 h-4 text-rose-500" />}
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
                                  {tx.addedBy && <p className="text-[11px] text-black/30 dark:text-white/30">· أُضيف بواسطة {tx.addedBy.fullName}</p>}
                                </div>
                              </div>
                              <div className="text-left flex-shrink-0 ml-2">
                                <p className={`text-base font-black ${tx.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                  {tx.type === 'credit' ? '+' : '-'}{fmt(tx.amount)}
                                </p>
                                <p className="text-[10px] text-black/30 dark:text-white/30 text-left">ر.س</p>
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
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">إضافة معاملة جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-2 block">نوع المعاملة</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger data-testid="select-tx-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit">مستحق (مبلغ على العميل)</SelectItem>
                  <SelectItem value="credit">دفعة (مبلغ دفعه العميل)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-2 block">المبلغ (ر.س)</Label>
              <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} data-testid="input-tx-amount" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-2 block">الوصف <span className="text-red-400">*</span></Label>
              <Input placeholder="مثال: دفعة أولى - باقة الاحترافية" value={form.description}
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
              className="bg-black text-white hover:bg-black/80 text-xs gap-2" data-testid="button-confirm-add">
              {addMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              إضافة
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
    </>
  );
}
