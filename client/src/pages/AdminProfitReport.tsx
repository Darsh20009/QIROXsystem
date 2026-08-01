import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import SARIcon from "@/components/SARIcon";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import {
  Loader2, TrendingUp, TrendingDown, Wallet, ArrowDown,
  ChevronDown, ChevronUp, Search, Percent, Plus, Trash2,
  CheckCircle2, Building2, BarChart3, Minus, SlidersHorizontal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

// ── Expense categories ───────────────────────────────────────────────────────
const CATEGORIES: Record<string, string> = {
  hosting: "استضافة", domain: "دومين", freelancer: "مستقل",
  license: "ترخيص", ads: "إعلانات", design: "تصميم",
  salary: "راتب", commission: "عمولة", other: "أخرى",
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) { return Math.abs(n).toLocaleString("ar-SA"); }
function SARBadge({ n, positive }: { n: number; positive?: boolean }) {
  const color = positive === undefined
    ? "text-black dark:text-white"
    : n >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500";
  return (
    <span className={`font-black flex items-center gap-0.5 ${color}`}>
      {n < 0 ? "-" : ""}{fmt(n)} <SARIcon size={11} />
    </span>
  );
}

// ── P&L Row ──────────────────────────────────────────────────────────────────
function PLRow({ label, value, sub, positive, dimmed, arrow }: {
  label: string; value: number; sub?: string;
  positive?: boolean; dimmed?: boolean; arrow?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-2 ${dimmed ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-2 min-w-0">
        {arrow && <ArrowDown className="w-3 h-3 text-black/20 dark:text-white/20 flex-shrink-0" />}
        <div className="min-w-0">
          <p className="text-xs font-semibold text-black/60 dark:text-white/60 truncate">{label}</p>
          {sub && <p className="text-[10px] text-black/30 dark:text-white/30">{sub}</p>}
        </div>
      </div>
      <SARBadge n={value} positive={positive} />
    </div>
  );
}

// ── Margin Input ─────────────────────────────────────────────────────────────
function MarginInput({ orderId, initial, onSaved }: { orderId: string; initial: number; onSaved: (v: number) => void }) {
  const [val, setVal] = useState(String(initial || ""));
  const [editing, setEditing] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const save = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("PATCH", `/api/admin/orders/${orderId}/margin`, { marginPct: Number(val) || 0 });
      return r.json();
    },
    onSuccess: () => {
      onSaved(Number(val) || 0);
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["/api/admin/profit-report"] });
      toast({ title: "✅ تم حفظ هامش الربح" });
    },
    onError: () => toast({ title: "خطأ في الحفظ", variant: "destructive" }),
  });

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-black/[0.08] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20 transition-colors group"
        title="تعديل هامش الربح"
      >
        <Percent className="w-3 h-3 text-black/30 dark:text-white/30" />
        <span className="text-sm font-black text-black dark:text-white">{initial || 0}%</span>
        <SlidersHorizontal className="w-2.5 h-2.5 text-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number" min={0} max={100} step={1}
        value={val}
        onChange={e => setVal(e.target.value)}
        className="w-16 h-7 text-xs text-center border-black/20 font-bold"
        autoFocus
        onKeyDown={e => { if (e.key === "Enter") save.mutate(); if (e.key === "Escape") setEditing(false); }}
      />
      <span className="text-xs text-black/40">%</span>
      <Button size="sm" className="h-7 px-2 text-xs bg-black text-white hover:bg-black/80"
        onClick={() => save.mutate()} disabled={save.isPending}>
        {save.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "حفظ"}
      </Button>
      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setEditing(false)}>✕</Button>
    </div>
  );
}

// ── Add Expense Modal ─────────────────────────────────────────────────────────
function AddExpenseRow({ orderId, onAdded }: { orderId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState("other");
  const [desc, setDesc] = useState("");
  const [amt, setAmt] = useState("");
  const { toast } = useToast();

  const add = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", `/api/admin/orders/${orderId}/expenses`, {
        category: cat, description: desc, amount: Number(amt),
      });
      return r.json();
    },
    onSuccess: () => { setOpen(false); setDesc(""); setAmt(""); onAdded(); toast({ title: "✅ تم إضافة المصروف" }); },
    onError: () => toast({ title: "خطأ في الإضافة", variant: "destructive" }),
  });

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-[10px] text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors pt-1">
        <Plus className="w-3 h-3" /> إضافة مصروف تشغيلي
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 pt-2 flex-wrap">
      <select value={cat} onChange={e => setCat(e.target.value)}
        className="text-[10px] h-7 px-2 border border-black/10 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white">
        {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="الوصف"
        className="h-7 text-xs flex-1 min-w-[120px] border-black/10" />
      <Input value={amt} onChange={e => setAmt(e.target.value)} placeholder="المبلغ" type="number"
        className="h-7 text-xs w-24 border-black/10" />
      <Button size="sm" className="h-7 px-3 text-xs bg-black text-white"
        onClick={() => add.mutate()} disabled={add.isPending || !desc || !amt}>
        {add.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "إضافة"}
      </Button>
      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setOpen(false)}>إلغاء</Button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminProfitReport() {
  const { lang } = useI18n();
  const L = lang === "ar";
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [localMargins, setLocalMargins] = useState<Record<string, number>>({});

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/profit-report"],
    queryFn: async () => {
      const r = await fetch("/api/admin/profit-report", { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    refetchInterval: 60000,
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const r = await apiRequest("DELETE", `/api/admin/expenses/${id}`);
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/profit-report"] }); toast({ title: "✅ تم حذف المصروف" }); },
  });

  const orders: any[] = data?.orders || [];
  const totals = data?.totals || { revenue: 0, foundingCost: 0, grossProfit: 0, opsExpenses: 0, netBalance: 0 };
  const addonStats = data?.addonStats || { revenue: 0, cost: 0, profit: 0, count: 0 };

  const filtered = orders.filter(o =>
    !search
    || o.businessName?.toLowerCase().includes(search.toLowerCase())
    || o.client?.fullName?.toLowerCase().includes(search.toLowerCase())
    || o.orderId?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Summary cards ──────────────────────────────────────────────────────────
  const summaryCards = [
    { label: "إجمالي قيمة المشاريع", value: totals.revenue,             icon: TrendingUp,  bg: "bg-black dark:bg-white",  text: "text-white dark:text-black", subText: "text-white/60 dark:text-black/60" },
    { label: "تم تحصيله",            value: totals.totalCollected,      icon: CheckCircle2, bg: "bg-emerald-50 dark:bg-emerald-900/15 border-emerald-200", text: "text-emerald-700 dark:text-emerald-300", subText: "text-emerald-600/60 dark:text-emerald-400/60" },
    { label: "متبقي للتحصيل",        value: totals.remainingToCollect,  icon: Wallet,       bg: totals.remainingToCollect > 0 ? "bg-amber-50 dark:bg-amber-900/15 border-amber-200" : "bg-white dark:bg-gray-900 border-black/[0.07] dark:border-white/[0.07]", text: totals.remainingToCollect > 0 ? "text-amber-700 dark:text-amber-300" : "text-black dark:text-white", subText: "text-black/30 dark:text-white/30" },
    { label: "تكلفة التأسيس",        value: totals.foundingCost,        icon: Minus,        bg: "bg-white dark:bg-gray-900 border-black/[0.07] dark:border-white/[0.07]", text: "text-black dark:text-white", subText: "text-black/40 dark:text-white/40" },
    { label: "مصاريف تشغيلية",       value: totals.opsExpenses,         icon: TrendingDown, bg: "bg-white dark:bg-gray-900 border-black/[0.07] dark:border-white/[0.07]", text: "text-black dark:text-white", subText: "text-black/40 dark:text-white/40" },
    { label: "الرصيد الصافي",        value: totals.netBalance,          icon: BarChart3,    bg: totals.netBalance >= 0 ? "bg-emerald-50 dark:bg-emerald-900/15 border-emerald-200" : "bg-red-50 dark:bg-red-900/15 border-red-200", text: totals.netBalance >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-600", subText: "text-black/30 dark:text-white/30" },
  ];

  return (
    <div className="relative overflow-hidden space-y-5" dir="rtl">
      <PageGraphics variant="dashboard" />

      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-black dark:text-white flex items-center gap-2.5">
          <div className="w-9 h-9 bg-black dark:bg-white rounded-xl flex items-center justify-center">
            <TrendingUp className="w-4.5 h-4.5 text-white dark:text-black" />
          </div>
          تقرير التكاليف والأرباح
        </h1>
        <p className="text-xs text-black/35 dark:text-white/30 mt-0.5 mr-11">
          حدد هامش ربح كل مشروع — النظام يحسب التكلفة والرصيد تلقائياً
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-black/20" /></div>
      ) : (
        <>
          {/* ── Summary Row ── */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {summaryCards.map((c, i) => {
              const Icon = c.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <div className={`rounded-2xl border p-4 ${c.bg} ${i === 0 ? "" : "border-black/[0.07] dark:border-white/[0.07]"}`}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Icon className={`w-3.5 h-3.5 ${c.subText}`} />
                      <p className={`text-[10px] font-bold ${c.subText}`}>{c.label}</p>
                    </div>
                    <p className={`text-xl font-black ${c.text} flex items-center gap-1`}>
                      {fmt(c.value)} <SARIcon size={12} />
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ── Visual P&L Bar ── */}
          {totals.revenue > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.07] rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-black/25 dark:text-white/25 mb-3">توزيع الإيراد</p>
              <div className="h-5 bg-black/[0.04] dark:bg-white/[0.06] rounded-full overflow-hidden flex">
                {totals.foundingCost > 0 && (
                  <div className="h-full bg-black/[0.15] dark:bg-white/[0.15] transition-all flex items-center justify-center"
                    style={{ width: `${(totals.foundingCost / totals.revenue) * 100}%` }}>
                    <span className="text-[8px] text-white dark:text-black font-bold px-1 truncate">تكلفة تأسيس</span>
                  </div>
                )}
                {totals.opsExpenses > 0 && (
                  <div className="h-full bg-black/[0.08] dark:bg-white/[0.08] transition-all"
                    style={{ width: `${(totals.opsExpenses / totals.revenue) * 100}%` }} />
                )}
                <div className="h-full bg-emerald-400/40 flex-1 transition-all" />
              </div>
              <div className="flex gap-4 mt-2 text-[10px] text-black/40 dark:text-white/40">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-black/[0.15] dark:bg-white/[0.15] inline-block" />تكلفة تأسيس {totals.revenue > 0 ? ((totals.foundingCost/totals.revenue)*100).toFixed(0) : 0}%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-black/[0.08] dark:bg-white/[0.08] inline-block" />مصاريف تشغيل {totals.revenue > 0 ? ((totals.opsExpenses/totals.revenue)*100).toFixed(0) : 0}%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400/40 inline-block" />رصيد صافي {totals.revenue > 0 ? ((totals.netBalance/totals.revenue)*100).toFixed(0) : 0}%</span>
              </div>
            </div>
          )}

          {/* ── Add-on Profit ── */}
          {addonStats.count > 0 && (
            <div className="bg-black dark:bg-white text-white dark:text-black rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider opacity-60">أرباح المميزات الإضافية</p>
                <p className="text-[10px] opacity-40 mt-0.5">{addonStats.count} اشتراك نشط</p>
              </div>
              <div className="flex gap-5">
                {[["إيراد", addonStats.revenue], ["تكلفة", addonStats.cost], ["ربح", addonStats.profit]].map(([lbl, val]) => (
                  <div key={lbl as string}>
                    <p className="text-[10px] opacity-50">{lbl as string}</p>
                    <p className="text-lg font-black flex items-center gap-1">{(val as number).toLocaleString()} <SARIcon size={12} className="opacity-60" /></p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Projects Table ── */}
          <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.07] rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="flex items-center gap-3 p-4 border-b border-black/[0.05] dark:border-white/[0.05]">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/25" />
                <Input placeholder="بحث بالاسم أو رقم الطلب..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="h-8 text-xs pr-9 border-black/[0.08]" />
              </div>
              <p className="text-[10px] text-black/30 dark:text-white/30 hidden md:block">
                {filtered.length} مشروع
              </p>
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <BarChart3 className="w-10 h-10 text-black/10 mx-auto mb-3" />
                <p className="text-sm text-black/30">لا توجد مشاريع بعد</p>
                <p className="text-xs text-black/20 mt-1">ستظهر المشاريع المعتمدة هنا</p>
              </div>
            ) : (
              <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                {filtered.map((order: any) => {
                  const isOpen = expanded === order.orderId;
                  const margin = localMargins[order.orderId] ?? order.marginPct ?? 0;
                  const revenue = order.revenue || 0;
                  const foundingCost = margin > 0 ? Math.round(revenue * (1 - margin / 100)) : order.foundingCost || 0;
                  const grossProfit = revenue - foundingCost;
                  const opsExp = order.opsExpenses || 0;
                  const netBalance = grossProfit - opsExp;

                  return (
                    <div key={order.orderId}>
                      {/* ── Row summary ── */}
                      <div className="px-4 py-4">
                        {/* Top: name + status + margin setter */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Building2 className="w-3.5 h-3.5 text-black/25 dark:text-white/25 flex-shrink-0" />
                              <p className="text-sm font-bold text-black dark:text-white truncate">
                                {order.businessName || order.client?.fullName || "—"}
                              </p>
                              {order.serviceType && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-black/40 dark:text-white/40">
                                  {order.serviceType}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-black/25 dark:text-white/25 mr-5.5 mt-0.5">
                              #{order.orderId?.slice(-8)} · {new Date(order.orderCreatedAt).toLocaleDateString("ar-SA")}
                            </p>
                          </div>

                          {/* Margin input */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] text-black/30 dark:text-white/30 hidden sm:block">هامش الربح</span>
                            <MarginInput
                              orderId={order.orderId}
                              initial={margin}
                              onSaved={v => setLocalMargins(p => ({ ...p, [order.orderId]: v }))}
                            />
                            <button onClick={() => setOpen(isOpen ? "" : order.orderId)}
                              className="p-1 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] rounded-lg transition-colors">
                              {isOpen ? <ChevronUp className="w-4 h-4 text-black/25 dark:text-white/25" /> : <ChevronDown className="w-4 h-4 text-black/25 dark:text-white/25" />}
                            </button>
                          </div>
                        </div>

                        {/* Payment Collection Status */}
                        <div className="mr-5 mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Project value */}
                            <div className="flex items-center gap-1 bg-black/[0.03] dark:bg-white/[0.04] rounded-lg px-2 py-1">
                              <span className="text-[10px] text-black/40 dark:text-white/40">قيمة المشروع</span>
                              <span className="text-[11px] font-black text-black dark:text-white flex items-center gap-0.5">
                                {fmt(order.projectValue ?? revenue)} <SARIcon size={9} />
                              </span>
                            </div>
                            {/* Collected */}
                            {(order.totalCollected > 0 || order.receiptsCount > 0) && (
                              <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-500/20 rounded-lg px-2 py-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">تم التحصيل</span>
                                <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-0.5">
                                  {fmt(order.totalCollected)} <SARIcon size={9} />
                                </span>
                              </div>
                            )}
                            {/* Remaining */}
                            {order.remainingToCollect > 0 && (
                              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-500/20 rounded-lg px-2 py-1">
                                <Wallet className="w-3 h-3 text-amber-500 flex-shrink-0" />
                                <span className="text-[10px] text-amber-600 dark:text-amber-400">متبقي للتحصيل</span>
                                <span className="text-[11px] font-black text-amber-700 dark:text-amber-300 flex items-center gap-0.5">
                                  {fmt(order.remainingToCollect)} <SARIcon size={9} />
                                </span>
                              </div>
                            )}
                            {order.remainingToCollect === 0 && order.totalCollected >= (order.projectValue ?? revenue) && (order.projectValue ?? revenue) > 0 && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> مكتمل التحصيل
                              </span>
                            )}
                          </div>

                          {/* Collection progress bar */}
                          {(order.projectValue ?? revenue) > 0 && (
                            <div className="mt-2 h-1.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-400 rounded-full transition-all"
                                style={{ width: `${Math.min(((order.totalCollected ?? 0) / (order.projectValue ?? revenue)) * 100, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>

                        {/* 3-Level P&L */}
                        <div className="mr-5 space-y-2">
                          {/* Revenue (project value) */}
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold text-black/50 dark:text-white/50">قيمة المشروع</p>
                            <SARBadge n={order.projectValue ?? revenue} />
                          </div>

                          {/* Level 1: Founding Cost */}
                          {foundingCost > 0 && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Minus className="w-3 h-3 text-black/20 dark:text-white/20" />
                                <p className="text-[11px] text-black/40 dark:text-white/40">تكلفة التأسيس ({margin}%)</p>
                              </div>
                              <span className="text-[11px] font-bold text-black/50 dark:text-white/50 flex items-center gap-0.5">
                                {fmt(foundingCost)} <SARIcon size={9} />
                              </span>
                            </div>
                          )}

                          {/* Gross Profit divider */}
                          <div className="border-t border-black/[0.06] dark:border-white/[0.06] pt-2 flex items-center justify-between">
                            <p className="text-[11px] font-bold text-black/60 dark:text-white/60">الربح الإجمالي</p>
                            <SARBadge n={grossProfit} positive />
                          </div>

                          {/* Level 2: Ops Expenses */}
                          {opsExp > 0 && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Minus className="w-3 h-3 text-black/20 dark:text-white/20" />
                                <p className="text-[11px] text-black/40 dark:text-white/40">مصاريف تشغيلية ({order.expenseCount} بند)</p>
                              </div>
                              <span className="text-[11px] font-bold text-black/50 dark:text-white/50 flex items-center gap-0.5">
                                {fmt(opsExp)} <SARIcon size={9} />
                              </span>
                            </div>
                          )}

                          {/* Remaining to collect (as a note) */}
                          {order.remainingToCollect > 0 && (
                            <div className="flex items-center justify-between opacity-60">
                              <div className="flex items-center gap-1.5">
                                <Plus className="w-3 h-3 text-amber-500" />
                                <p className="text-[11px] text-amber-600 dark:text-amber-400">متبقي يُضاف بعد التحصيل</p>
                              </div>
                              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                                +{fmt(order.remainingToCollect)} <SARIcon size={9} />
                              </span>
                            </div>
                          )}

                          {/* Net Balance — highlighted */}
                          <div className={`border-t pt-2 flex items-center justify-between rounded-xl px-2 -mx-2 ${
                            netBalance >= 0
                              ? "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-900/10"
                              : "border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-900/10"
                          }`}>
                            <div className="flex items-center gap-1.5 py-1.5">
                              {netBalance >= 0
                                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                              <p className={`text-[12px] font-black ${netBalance >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-600"}`}>
                                الرصيد الصافي
                              </p>
                            </div>
                            <span className={`text-base font-black flex items-center gap-1 ${netBalance >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-600"}`}>
                              {netBalance < 0 ? "-" : ""}{fmt(netBalance)} <SARIcon size={13} />
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ── Expanded: expense details ── */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-black/[0.04] dark:border-white/[0.04] bg-black/[0.01] dark:bg-white/[0.01] px-6 py-4 space-y-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-black/25 dark:text-white/25 mb-3">
                                المصاريف التشغيلية
                              </p>

                              {order.expenses?.length === 0 ? (
                                <p className="text-xs text-black/25 dark:text-white/20 italic">لا توجد مصاريف تشغيلية بعد</p>
                              ) : (
                                order.expenses?.map((e: any) => (
                                  <div key={e.id || e._id} className="flex items-center gap-3">
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-black/40 dark:text-white/40 font-medium">
                                      {CATEGORIES[e.category] || "أخرى"}
                                    </span>
                                    <p className="text-xs text-black/50 dark:text-white/40 flex-1 truncate">{e.description}</p>
                                    <p className="text-xs font-bold text-black dark:text-white flex items-center gap-1">
                                      {Number(e.amount).toLocaleString()} <SARIcon size={10} />
                                    </p>
                                    <button
                                      onClick={() => deleteExpense.mutate(e.id || e._id)}
                                      className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-400 hover:text-red-600"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))
                              )}

                              <AddExpenseRow
                                orderId={order.orderId}
                                onAdded={() => qc.invalidateQueries({ queryKey: ["/api/admin/profit-report"] })}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );

                  function setOpen(v: string) { setExpanded(v || null); }
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
