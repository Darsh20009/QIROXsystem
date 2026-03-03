import { useQuery } from "@tanstack/react-query";
import { Loader2, Wallet, TrendingUp, TrendingDown, AlertCircle, ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

interface WalletTx {
  id: string;
  type: "debit" | "credit";
  amount: number;
  description: string;
  note: string;
  orderId?: { serviceType: string; planTier: string };
  createdAt: string;
}
interface WalletData {
  transactions: WalletTx[];
  totalDebit: number;
  totalCredit: number;
  outstanding: number;
}

function fmt(n: number) {
  return n.toLocaleString("ar-SA", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function ClientWallet() {
  const { data, isLoading } = useQuery<WalletData>({ queryKey: ["/api/wallet"] });

  const txs = data?.transactions || [];
  const totalDebit = data?.totalDebit || 0;
  const totalCredit = data?.totalCredit || 0;
  const outstanding = data?.outstanding || 0;

  return (
    <div className="min-h-screen bg-[#f8f8f8] dark:bg-gray-950" dir="rtl">
      <PageGraphics variant="dashboard" />
        <div className="bg-white dark:bg-gray-900 border-b border-black/[0.06] dark:border-white/[0.08] px-6 py-5 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto flex items-center gap-4">
            <SidebarTrigger className="text-black/40 dark:text-white/40" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-black dark:bg-white flex items-center justify-center">
                <Wallet className="w-4.5 h-4.5 text-white dark:text-black" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-black dark:text-white">محفظتي الإلكترونية</h1>
                <p className="text-xs text-black/40 dark:text-white/40">سجل المدفوعات والمستحقات</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-4 text-center">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mx-auto mb-2">
                    <TrendingDown className="w-4 h-4 text-rose-500" />
                  </div>
                  <p className="text-[10px] text-black/40 dark:text-white/40 mb-1">إجمالي المستحق</p>
                  <p className="text-base font-black text-black dark:text-white" data-testid="text-total-debit">{fmt(totalDebit)} <span className="text-xs font-medium text-black/40">ر.س</span></p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-4 text-center">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-[10px] text-black/40 dark:text-white/40 mb-1">إجمالي المدفوع</p>
                  <p className="text-base font-black text-black dark:text-white" data-testid="text-total-credit">{fmt(totalCredit)} <span className="text-xs font-medium text-black/40">ر.س</span></p>
                </div>
                <div className={`rounded-2xl border p-4 text-center ${outstanding > 0 ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30" : "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30"}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2 ${outstanding > 0 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-emerald-100 dark:bg-emerald-900/30"}`}>
                    <AlertCircle className={`w-4 h-4 ${outstanding > 0 ? "text-amber-500" : "text-emerald-500"}`} />
                  </div>
                  <p className="text-[10px] text-black/40 dark:text-white/40 mb-1">الرصيد المتبقي</p>
                  <p className={`text-base font-black ${outstanding > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`} data-testid="text-outstanding">
                    {fmt(Math.abs(outstanding))} <span className="text-xs font-medium opacity-60">ر.س</span>
                  </p>
                  {outstanding === 0 && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">مسدد بالكامل</p>}
                  {outstanding < 0 && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">رصيد دائن</p>}
                </div>
              </div>

              {/* Outstanding Banner */}
              {outstanding > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-amber-800 dark:text-amber-300">لديك مبلغ مستحق السداد</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">يرجى التواصل مع الفريق لتسوية المبلغ المتبقي: <strong>{fmt(outstanding)} ر.س</strong></p>
                  </div>
                </div>
              )}

              {/* Transactions */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden">
                <div className="px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.08]">
                  <h2 className="text-sm font-bold text-black dark:text-white">سجل المعاملات</h2>
                </div>

                {txs.length === 0 ? (
                  <div className="py-16 text-center">
                    <Wallet className="w-10 h-10 text-black/10 dark:text-white/10 mx-auto mb-3" />
                    <p className="text-sm font-medium text-black/30 dark:text-white/30">لا توجد معاملات بعد</p>
                    <p className="text-xs text-black/20 dark:text-white/20 mt-1">ستظهر هنا جميع مدفوعاتك ومستحقاتك</p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[480px]">
                    <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                      {txs.map((tx) => (
                        <div key={tx.id} className="px-5 py-4 flex items-center gap-4" data-testid={`wallet-tx-${tx.id}`}>
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === 'credit' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}`}>
                            {tx.type === 'credit'
                              ? <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                              : <ArrowUpRight className="w-4 h-4 text-rose-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-black dark:text-white truncate">{tx.description}</p>
                            {tx.note && <p className="text-xs text-black/40 dark:text-white/40 mt-0.5 truncate">{tx.note}</p>}
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3 text-black/20 dark:text-white/20" />
                              <p className="text-[11px] text-black/30 dark:text-white/30">
                                {new Date(tx.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}
                              </p>
                            </div>
                          </div>
                          <div className="text-left flex-shrink-0">
                            <p className={`text-base font-black ${tx.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {tx.type === 'credit' ? '+' : '-'}{fmt(tx.amount)}
                            </p>
                            <p className="text-[10px] text-black/30 dark:text-white/30 text-left">ر.س</p>
                          </div>
                          <Badge className={`text-[10px] px-2 py-0.5 border-0 ${tx.type === 'credit' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                            {tx.type === 'credit' ? 'دفعة' : 'مستحق'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </>
          )}
        </div>
      </div>
  );
}
