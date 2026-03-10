// @ts-nocheck
import { useState } from "react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard, Search, CheckCircle2, XCircle, Clock, AlertTriangle,
  ArrowRight, Loader2, User, Calendar, RefreshCw, ChevronDown, ChevronUp,
  Zap, Crown, Star, Package, Shield
} from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

const PERIOD_OPTIONS = [
  { value: "monthly", label: "شهري", days: 30, color: "blue" },
  { value: "6months", label: "نصف سنوي", days: 180, color: "purple" },
  { value: "annual", label: "سنوي", days: 365, color: "emerald" },
  { value: "renewal", label: "تجديد (30 يوم)", days: 30, color: "amber" },
];

const STATUS_MAP = {
  active:    { label: "نشط",      icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200" },
  expired:   { label: "منتهي",    icon: XCircle,      color: "text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200" },
  suspended: { label: "موقوف",    icon: AlertTriangle,color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200" },
  none:      { label: "لا يوجد",  icon: Clock,        color: "text-black/40 bg-black/[0.03] dark:bg-white/[0.03] border-black/10" },
};

const TIER_ICONS = { lite: Zap, pro: Star, infinite: Crown, custom: Package };
const TIER_LABELS = { lite: "لايت", pro: "برو", infinite: "إنفينت", custom: "مخصص" };

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function formatDate(d: string | Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
}

function daysLeft(expiresAt: string | Date | null): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function EmployeeSubscriptions() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showActivatePanel, setShowActivatePanel] = useState(false);

  const { data: clients = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/employee/clients-subscriptions", search],
    queryFn: async () => {
      const url = search.trim().length >= 2
        ? `/api/employee/clients-subscriptions?q=${encodeURIComponent(search.trim())}`
        : "/api/employee/clients-subscriptions";
      const r = await fetch(url, { credentials: "include" });
      return r.json();
    },
    staleTime: 15_000,
  });

  const activateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/employee/activate-subscription", data),
    onSuccess: () => {
      toast({ title: "تم تفعيل الاشتراك بنجاح" });
      setSelectedClient(null);
      setShowActivatePanel(false);
      queryClient.invalidateQueries({ queryKey: ["/api/employee/clients-subscriptions"] });
      refetch();
    },
    onError: (err: any) => toast({ title: err.message || "حدث خطأ", variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ clientId, status }: { clientId: string; status: string }) =>
      apiRequest("PATCH", `/api/employee/subscription/${clientId}`, { status }),
    onSuccess: () => {
      toast({ title: "تم تحديث حالة الاشتراك" });
      queryClient.invalidateQueries({ queryKey: ["/api/employee/clients-subscriptions"] });
      refetch();
    },
    onError: (err: any) => toast({ title: err.message || "حدث خطأ", variant: "destructive" }),
  });

  const filteredClients = clients.filter((c: any) => {
    if (statusFilter === "all") return true;
    return c.subscriptionStatus === statusFilter;
  });

  const counts = {
    all: clients.length,
    active: clients.filter((c: any) => c.subscriptionStatus === "active").length,
    expired: clients.filter((c: any) => c.subscriptionStatus === "expired").length,
    none: clients.filter((c: any) => c.subscriptionStatus === "none").length,
    suspended: clients.filter((c: any) => c.subscriptionStatus === "suspended").length,
  };

  function handleActivate() {
    if (!selectedClient) return;
    activateMutation.mutate({ clientId: selectedClient.id, period: selectedPeriod, startDate });
  }

  const previewPeriod = PERIOD_OPTIONS.find(p => p.value === selectedPeriod);
  const previewExpiry = previewPeriod ? addDays(new Date(startDate), previewPeriod.days) : null;

  return (
    <div className="relative overflow-hidden min-h-screen bg-black/[0.02] dark:bg-black p-4 md:p-8" dir="rtl">
      <PageGraphics variant="dashboard" />
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <button className="w-9 h-9 rounded-xl bg-white dark:bg-gray-900 border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center hover:bg-black/5 transition-colors">
              <ArrowRight className="w-4 h-4 text-black/50 dark:text-white/50" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-black font-heading text-black dark:text-white">اشتراكات العملاء</h1>
            <p className="text-black/40 dark:text-white/40 text-sm">تفعيل وإدارة اشتراكات العملاء</p>
          </div>
          <button
            onClick={() => { setShowActivatePanel(v => !v); setSelectedClient(null); }}
            className="mr-auto flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-black/80 dark:hover:bg-white/80 transition-colors"
            data-testid="btn-new-subscription"
          >
            <CreditCard className="w-4 h-4" />
            تفعيل اشتراك
          </button>
        </div>

        {/* Activate Subscription Panel */}
        <AnimatePresence>
          {showActivatePanel && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white dark:bg-gray-900 border border-black/[0.08] dark:border-white/[0.08] rounded-3xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-black text-black dark:text-white">تفعيل اشتراك جديد</p>
                    <p className="text-xs text-black/40 dark:text-white/40">اختر العميل والفترة ثم فعّل</p>
                  </div>
                </div>
                <button onClick={() => setShowActivatePanel(false)} className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-black/40 dark:text-white/40" />
                </button>
              </div>

              {/* Client Selection */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-black/50 dark:text-white/50 mb-2">اختر العميل</label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 dark:text-white/30" />
                  <input
                    type="text"
                    placeholder="ابحث بالاسم أو الإيميل..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] rounded-xl pr-10 pl-4 py-2.5 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
                    data-testid="input-client-search"
                  />
                </div>
                {selectedClient ? (
                  <div className="mt-2 flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                      {(selectedClient.fullName || selectedClient.username || "?")[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">{selectedClient.fullName || selectedClient.username}</p>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-500">{selectedClient.email}</p>
                    </div>
                    <button onClick={() => setSelectedClient(null)} className="text-emerald-600 dark:text-emerald-400 hover:text-red-500 transition-colors">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : search.trim().length >= 2 && clients.length > 0 ? (
                  <div className="mt-2 border border-black/[0.06] dark:border-white/[0.06] rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-lg max-h-48 overflow-y-auto">
                    {clients.slice(0, 8).map((c: any) => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedClient(c); setSearch(""); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] text-right transition-colors border-b border-black/[0.04] dark:border-white/[0.04] last:border-0"
                        data-testid={`client-option-${c.id}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-black/[0.06] dark:bg-white/[0.08] flex items-center justify-center text-xs font-bold text-black/60 dark:text-white/60 flex-shrink-0">
                          {(c.fullName || c.username || "?")[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-black dark:text-white text-sm truncate">{c.fullName || c.username}</p>
                          <p className="text-[11px] text-black/40 dark:text-white/40 truncate">{c.email}</p>
                        </div>
                        {c.subscriptionStatus === "active" && (
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full font-bold flex-shrink-0">نشط</span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Period Selection */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-black/50 dark:text-white/50 mb-2">فترة الاشتراك</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PERIOD_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedPeriod(opt.value)}
                      className={`rounded-xl border p-3 text-center transition-all ${selectedPeriod === opt.value ? "border-black dark:border-white bg-black dark:bg-white" : "border-black/[0.07] dark:border-white/[0.07] bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04]"}`}
                      data-testid={`period-${opt.value}`}
                    >
                      <p className={`text-xs font-black ${selectedPeriod === opt.value ? "text-white dark:text-black" : "text-black dark:text-white"}`}>{opt.label}</p>
                      <p className={`text-[10px] mt-0.5 ${selectedPeriod === opt.value ? "text-white/60 dark:text-black/60" : "text-black/35 dark:text-white/35"}`}>{opt.days} يوم</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Date */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-black/50 dark:text-white/50 mb-2">تاريخ البداية</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
                  data-testid="input-start-date"
                />
                {previewExpiry && (
                  <p className="text-xs text-black/40 dark:text-white/40 mt-1.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    ينتهي في: <span className="font-bold text-black/70 dark:text-white/60">{formatDate(previewExpiry)}</span>
                  </p>
                )}
              </div>

              <Button
                onClick={handleActivate}
                disabled={!selectedClient || activateMutation.isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-11"
                data-testid="btn-activate-confirm"
              >
                {activateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Shield className="w-4 h-4 ml-2" />}
                تفعيل الاشتراك
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { key: "all", label: "الكل", color: "text-black dark:text-white" },
            { key: "active", label: "نشطة", color: "text-emerald-600 dark:text-emerald-400" },
            { key: "expired", label: "منتهية", color: "text-red-500" },
            { key: "none", label: "بلا اشتراك", color: "text-black/40 dark:text-white/40" },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`rounded-2xl border p-4 text-center transition-all ${statusFilter === key ? "border-black dark:border-white bg-black dark:bg-white" : "border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"}`}
              data-testid={`filter-${key}`}
            >
              <p className={`text-xl font-black ${statusFilter === key ? "text-white dark:text-black" : color}`}>{(counts as any)[key]}</p>
              <p className={`text-[10px] mt-0.5 ${statusFilter === key ? "text-white/60 dark:text-black/60" : "text-black/40 dark:text-white/40"}`}>{label}</p>
            </button>
          ))}
        </div>

        {/* Search (when panel is closed) */}
        {!showActivatePanel && (
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 dark:text-white/30" />
            <input
              type="text"
              placeholder="ابحث عن عميل..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl pr-12 pl-4 py-3 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 shadow-sm"
              data-testid="input-main-search"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute left-4 top-1/2 -translate-y-1/2">
                <XCircle className="w-4 h-4 text-black/30 dark:text-white/30" />
              </button>
            )}
          </div>
        )}

        {/* Client List */}
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" /></div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-16 text-black/30 dark:text-white/30">
            <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">لا يوجد عملاء</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClients.map((client: any) => {
              const st = STATUS_MAP[client.subscriptionStatus as keyof typeof STATUS_MAP] || STATUS_MAP.none;
              const StIcon = st.icon;
              const days = daysLeft(client.subscriptionExpiresAt);
              const TierIcon = TIER_ICONS[client.planTier as keyof typeof TIER_ICONS];
              const isExpiringSoon = days !== null && days > 0 && days <= 14;
              const isExpired = days !== null && days <= 0;

              return (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4"
                  data-testid={`row-client-${client.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-black/[0.05] dark:bg-white/[0.07] flex items-center justify-center font-black text-sm text-black/60 dark:text-white/60 flex-shrink-0">
                        {(client.fullName || client.username || "?")[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-black dark:text-white text-sm">{client.fullName || client.username}</p>
                          {TierIcon && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-black/40 dark:text-white/40 bg-black/[0.04] dark:bg-white/[0.05] px-2 py-0.5 rounded-full">
                              <TierIcon className="w-2.5 h-2.5" />
                              {TIER_LABELS[client.planTier as keyof typeof TIER_LABELS]}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-black/40 dark:text-white/40 mt-0.5 truncate">{client.email}</p>
                        {client.phone && <p className="text-[11px] text-black/30 dark:text-white/30">{client.phone}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${st.color}`}>
                        <StIcon className="w-3 h-3" />
                        {st.label}
                      </span>
                      {client.subscriptionStatus === "active" && days !== null && (
                        <span className={`text-[10px] font-bold ${isExpiringSoon ? "text-amber-600" : "text-black/30 dark:text-white/30"}`}>
                          {days > 0 ? `${days} يوم متبقي` : "منتهي"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Subscription details */}
                  {(client.subscriptionStartDate || client.subscriptionExpiresAt) && (
                    <div className="mt-3 pt-3 border-t border-black/[0.04] dark:border-white/[0.04] grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] text-black/30 dark:text-white/30 mb-0.5">بداية الاشتراك</p>
                        <p className="text-xs font-semibold text-black/70 dark:text-white/60">{formatDate(client.subscriptionStartDate)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-black/30 dark:text-white/30 mb-0.5">نهاية الاشتراك</p>
                        <p className={`text-xs font-semibold ${isExpired ? "text-red-500" : isExpiringSoon ? "text-amber-600" : "text-black/70 dark:text-white/60"}`}>
                          {formatDate(client.subscriptionExpiresAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedClient(client);
                        setShowActivatePanel(true);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="text-xs h-8 bg-black dark:bg-white text-white dark:text-black hover:bg-black/80 dark:hover:bg-white/80 rounded-xl gap-1.5 font-bold"
                      data-testid={`btn-activate-${client.id}`}
                    >
                      <Shield className="w-3 h-3" />
                      تفعيل / تجديد
                    </Button>

                    {client.subscriptionStatus === "active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => statusMutation.mutate({ clientId: client.id, status: "suspended" })}
                        disabled={statusMutation.isPending}
                        className="text-xs h-8 border-amber-200 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl gap-1.5"
                        data-testid={`btn-suspend-${client.id}`}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        إيقاف
                      </Button>
                    )}

                    {(client.subscriptionStatus === "suspended" || client.subscriptionStatus === "expired") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => statusMutation.mutate({ clientId: client.id, status: "active" })}
                        disabled={statusMutation.isPending}
                        className="text-xs h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl gap-1.5"
                        data-testid={`btn-reactivate-${client.id}`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        إعادة تفعيل
                      </Button>
                    )}

                    {client.subscriptionStatus !== "none" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => statusMutation.mutate({ clientId: client.id, status: "none" })}
                        disabled={statusMutation.isPending}
                        className="text-xs h-8 border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl gap-1.5"
                        data-testid={`btn-reset-${client.id}`}
                      >
                        <XCircle className="w-3 h-3" />
                        إلغاء
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
