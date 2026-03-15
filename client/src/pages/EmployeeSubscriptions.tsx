// @ts-nocheck
import { useState } from "react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard, Search, CheckCircle2, XCircle, Clock, AlertTriangle,
  ArrowRight, Loader2, User, Calendar, RefreshCw, ChevronDown, ChevronUp,
  Zap, Crown, Star, Package, Shield, Rocket, WifiOff, Timer, Settings2
} from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";

const PERIOD_OPTIONS = [
  { value: "monthly",  label: "شهري",          days: 30  },
  { value: "6months",  label: "نصف سنوي",       days: 180 },
  { value: "annual",   label: "سنوي",           days: 365 },
  { value: "renewal",  label: "تجديد (30 يوم)", days: 30  },
];

const STATUS_MAP = {
  active:    { label: "نشط",     icon: CheckCircle2,  color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200" },
  expired:   { label: "منتهي",   icon: XCircle,       color: "text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200" },
  suspended: { label: "موقوف",   icon: AlertTriangle, color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200" },
  none:      { label: "لا يوجد", icon: Clock,         color: "text-black/40 bg-black/[0.03] dark:bg-white/[0.03] border-black/10" },
};

const ADDON_STATUS_MAP = {
  active:    { label: "نشط",   color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20" },
  expired:   { label: "منتهي", color: "text-red-500 bg-red-50 border-red-200 dark:bg-red-900/20" },
  exhausted: { label: "نفذ",   color: "text-orange-500 bg-orange-50 border-orange-200 dark:bg-orange-900/20" },
  cancelled: { label: "ملغي",  color: "text-gray-500 bg-gray-50 border-gray-200 dark:bg-gray-900/20" },
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

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl">
      <p className="text-[10px] text-black/40 dark:text-white/40 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-black dark:text-white truncate">{value}</p>
    </div>
  );
}

export default function EmployeeSubscriptions() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [liveFilter, setLiveFilter] = useState("all");
  const [showActivatePanel, setShowActivatePanel] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activateSearch, setActivateSearch] = useState("");

  const { data: clients = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/employee/clients-subscriptions", search, liveFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search.trim().length >= 2) params.set("q", search.trim());
      if (liveFilter !== "all") params.set("liveFilter", liveFilter);
      const r = await fetch(`/api/employee/clients-subscriptions?${params}`, { credentials: "include" });
      return r.json();
    },
    staleTime: 15_000,
  });

  const activateSearchClients = useQuery<any[]>({
    queryKey: ["/api/employee/clients-subscriptions", activateSearch],
    queryFn: async () => {
      if (activateSearch.trim().length < 2) return [];
      const r = await fetch(`/api/employee/clients-subscriptions?q=${encodeURIComponent(activateSearch.trim())}`, { credentials: "include" });
      return r.json();
    },
    enabled: activateSearch.trim().length >= 2,
    staleTime: 10_000,
  });

  const activateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/employee/activate-subscription", data),
    onSuccess: () => {
      toast({ title: "تم تفعيل الاشتراك بنجاح" });
      setSelectedClient(null);
      setShowActivatePanel(false);
      setActivateSearch("");
      queryClient.invalidateQueries({ queryKey: ["/api/employee/clients-subscriptions"] });
    },
    onError: (err: any) => toast({ title: err.message || "حدث خطأ", variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ clientId, status }: { clientId: string; status: string }) =>
      apiRequest("PATCH", `/api/employee/subscription/${clientId}`, { status }),
    onSuccess: () => {
      toast({ title: "تم تحديث حالة الاشتراك" });
      queryClient.invalidateQueries({ queryKey: ["/api/employee/clients-subscriptions"] });
    },
    onError: (err: any) => toast({ title: err.message || "حدث خطأ", variant: "destructive" }),
  });

  const goLiveMutation = useMutation({
    mutationFn: (clientId: string) =>
      apiRequest("PATCH", `/api/employee/subscription/${clientId}/go-live`, {}),
    onSuccess: () => {
      toast({ title: "🚀 تم تفعيل Live!", description: "بدأ العد التنازلي للباقة" });
      queryClient.invalidateQueries({ queryKey: ["/api/employee/clients-subscriptions"] });
    },
    onError: (err: any) => toast({ title: err.message || "حدث خطأ", variant: "destructive" }),
  });

  const unliveMutation = useMutation({
    mutationFn: (clientId: string) =>
      apiRequest("PATCH", `/api/employee/subscription/${clientId}/unlive`, {}),
    onSuccess: () => {
      toast({ title: "تم إلغاء وضع Live" });
      queryClient.invalidateQueries({ queryKey: ["/api/employee/clients-subscriptions"] });
    },
  });

  const filteredClients = clients.filter((c: any) => {
    if (statusFilter !== "all" && c.subscriptionStatus !== statusFilter) return false;
    return true;
  });

  const counts = {
    all:       clients.length,
    active:    clients.filter((c: any) => c.subscriptionStatus === "active").length,
    expired:   clients.filter((c: any) => c.subscriptionStatus === "expired").length,
    none:      clients.filter((c: any) => c.subscriptionStatus === "none").length,
    suspended: clients.filter((c: any) => c.subscriptionStatus === "suspended").length,
    live:      clients.filter((c: any) => c.isProjectLive).length,
    notlive:   clients.filter((c: any) => !c.isProjectLive).length,
  };

  const previewPeriod = PERIOD_OPTIONS.find(p => p.value === selectedPeriod);
  const previewExpiry = previewPeriod ? addDays(new Date(startDate), previewPeriod.days) : null;

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  return (
    <div className="relative overflow-hidden min-h-screen bg-black/[0.02] dark:bg-black p-4 md:p-8" dir="rtl">
      <PageGraphics variant="dashboard" />
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/dashboard">
            <button className="w-9 h-9 rounded-xl bg-white dark:bg-gray-900 border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center hover:bg-black/5 transition-colors">
              <ArrowRight className="w-4 h-4 text-black/50 dark:text-white/50" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-black font-heading text-black dark:text-white">اشتراكات العملاء</h1>
            <p className="text-black/40 dark:text-white/40 text-sm">تفعيل وإدارة الاشتراكات والمميزات الجانبية</p>
          </div>
          <button
            onClick={() => { setShowActivatePanel(v => !v); setSelectedClient(null); }}
            className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-black/80 dark:hover:bg-white/80 transition-colors"
            data-testid="btn-new-subscription"
          >
            <CreditCard className="w-4 h-4" />
            تفعيل اشتراك
          </button>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Rocket,       label: "مشاريع Live",   value: counts.live,    color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40" },
            { icon: WifiOff,      label: "غير Live",       value: counts.notlive, color: "text-gray-500",    bg: "bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700" },
            { icon: CheckCircle2, label: "اشتراك نشط",    value: counts.active,  color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/40" },
            { icon: XCircle,      label: "اشتراك منتهي",  value: counts.expired, color: "text-red-500",     bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40" },
          ].map(s => (
            <div key={s.label} className={`flex items-center gap-3 p-3 rounded-2xl border ${s.bg}`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <div>
                <p className="text-[11px] text-black/40 dark:text-white/40">{s.label}</p>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Activate Panel ── */}
        <AnimatePresence>
          {showActivatePanel && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
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

              {/* Client Search */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-black/50 dark:text-white/50 mb-2">اختر العميل</label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 dark:text-white/30" />
                  <input
                    type="text"
                    placeholder="ابحث بالاسم أو الإيميل..."
                    value={activateSearch}
                    onChange={e => setActivateSearch(e.target.value)}
                    className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] rounded-xl pr-10 pl-4 py-2.5 text-sm focus:outline-none"
                    data-testid="input-client-search"
                  />
                </div>
                {selectedClient ? (
                  <div className="mt-2 flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {(selectedClient.fullName || "?")[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">{selectedClient.fullName}</p>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-500">{selectedClient.email}</p>
                    </div>
                    <button onClick={() => { setSelectedClient(null); setActivateSearch(""); }} className="text-emerald-600 hover:text-red-500 transition-colors">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : activateSearch.trim().length >= 2 && (activateSearchClients.data?.length ?? 0) > 0 ? (
                  <div className="mt-2 border border-black/[0.06] dark:border-white/[0.06] rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-lg max-h-48 overflow-y-auto">
                    {(activateSearchClients.data || []).slice(0, 8).map((c: any) => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedClient(c); setActivateSearch(""); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] text-right transition-colors border-b border-black/[0.04] dark:border-white/[0.04] last:border-0"
                        data-testid={`client-option-${c.id}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-black/[0.06] dark:bg-white/[0.08] flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {(c.fullName || "?")[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-black dark:text-white truncate">{c.fullName}</p>
                          <p className="text-[11px] text-black/40 dark:text-white/40 truncate">{c.email}</p>
                        </div>
                        {c.subscriptionStatus === "active" && (
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full font-bold">نشط</span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Period */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-black/50 dark:text-white/50 mb-2">فترة الاشتراك</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PERIOD_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedPeriod(opt.value)}
                      className={`rounded-xl border p-3 text-center transition-all ${selectedPeriod === opt.value ? "border-black dark:border-white bg-black dark:bg-white" : "border-black/[0.07] dark:border-white/[0.07] hover:bg-black/[0.03]"}`}
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
                  className="bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  data-testid="input-start-date"
                />
                {previewExpiry && (
                  <p className="text-xs text-black/40 dark:text-white/40 mt-1.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    ينتهي في: <span className="font-bold text-black/70 dark:text-white/60 mr-1">{formatDate(previewExpiry)}</span>
                  </p>
                )}
              </div>

              <Button
                onClick={() => activateMutation.mutate({ clientId: selectedClient?.id, period: selectedPeriod, startDate })}
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

        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-black/30 dark:text-white/30" />
            <input
              type="text"
              placeholder="بحث عن عميل..."
              className="w-full pr-10 pl-4 py-2 bg-white dark:bg-gray-900 border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-sm focus:outline-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
              data-testid="input-list-search"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-1 bg-white dark:bg-gray-900 border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-1">
            {[
              { val: "all",       label: `الكل (${counts.all})` },
              { val: "active",    label: `نشط (${counts.active})` },
              { val: "expired",   label: `منتهي (${counts.expired})` },
              { val: "none",      label: `لا يوجد (${counts.none})` },
              { val: "suspended", label: `موقوف (${counts.suspended})` },
            ].map(f => (
              <button
                key={f.val}
                onClick={() => setStatusFilter(f.val)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all ${statusFilter === f.val ? "bg-black dark:bg-white text-white dark:text-black" : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"}`}
                data-testid={`filter-status-${f.val}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Live Filter */}
          <div className="flex gap-1 bg-white dark:bg-gray-900 border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-1">
            {[
              { val: "all",     label: "الكل" },
              { val: "live",    label: "🟢 Live" },
              { val: "notlive", label: "⚪ غير Live" },
            ].map(f => (
              <button
                key={f.val}
                onClick={() => setLiveFilter(f.val)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all ${liveFilter === f.val ? "bg-black dark:bg-white text-white dark:text-black" : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"}`}
                data-testid={`filter-live-${f.val}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button onClick={() => refetch()} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-gray-900 border border-black/[0.08] dark:border-white/[0.08] hover:bg-black/[0.03] transition-colors" data-testid="btn-refresh">
            <RefreshCw className="w-4 h-4 text-black/40 dark:text-white/40" />
          </button>
        </div>

        {/* ── Client List ── */}
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-black/20 dark:text-white/20" /></div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-16 text-black/30 dark:text-white/30">
            <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">لا يوجد عملاء</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClients.map((client: any) => {
              const days = daysLeft(client.subscriptionExpiresAt);
              const st = STATUS_MAP[client.subscriptionStatus as keyof typeof STATUS_MAP] || STATUS_MAP.none;
              const StatusIcon = st.icon;
              const TierIcon = TIER_ICONS[client.planTier as keyof typeof TIER_ICONS] || Package;
              const isExpanded = expandedIds.has(client.id);
              const urgentDays = days !== null && days <= 7 && days >= 0;
              const overdueAddon = client.addonSubs?.some((a: any) => a.status === "exhausted" || a.status === "expired");

              return (
                <motion.div
                  key={client.id}
                  layout
                  className={`bg-white dark:bg-gray-900 border rounded-2xl overflow-hidden shadow-sm transition-colors ${urgentDays || overdueAddon ? "border-orange-200 dark:border-orange-800/40" : "border-black/[0.06] dark:border-white/[0.06]"}`}
                  data-testid={`card-client-${client.id}`}
                >
                  {/* Main Row */}
                  <div className="p-4 flex items-center gap-3 flex-wrap">
                    <div className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center font-black text-sm text-black/50 dark:text-white/50 flex-shrink-0">
                      {(client.fullName || "?")[0]}
                    </div>

                    <div className="flex-1 min-w-[140px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm text-black dark:text-white">{client.fullName}</p>
                        {client.planTier && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-black/[0.05] dark:bg-white/[0.05] text-black/50 dark:text-white/50">
                            <TierIcon className="w-3 h-3" />
                            {TIER_LABELS[client.planTier as keyof typeof TIER_LABELS] || client.planTier}
                          </span>
                        )}
                        {client.isProjectLive ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                            Live
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700">
                            <WifiOff className="w-2.5 h-2.5" />
                            غير Live
                          </span>
                        )}
                        {overdueAddon && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 border border-orange-200">
                            ⚠ ميزة تحتاج تجديد
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-black/40 dark:text-white/40 mt-0.5 truncate">{client.email}</p>
                    </div>

                    {/* Countdown Display */}
                    <div className="text-center w-20 flex-shrink-0">
                      {client.isProjectLive && client.subscriptionExpiresAt ? (
                        days === null ? (
                          <p className="text-xs text-black/30">—</p>
                        ) : days < 0 ? (
                          <>
                            <p className="text-base font-black text-red-500">منتهي</p>
                            <p className="text-[10px] text-red-400">{Math.abs(days)} يوم مضى</p>
                          </>
                        ) : (
                          <>
                            <p className={`text-2xl font-black leading-none ${days <= 7 ? "text-orange-500" : days <= 30 ? "text-amber-500" : "text-emerald-600"}`}>{days}</p>
                            <p className="text-[10px] text-black/40 dark:text-white/40 mt-0.5">يوم متبقي</p>
                          </>
                        )
                      ) : (
                        <>
                          <Timer className="w-5 h-5 mx-auto text-black/20 dark:text-white/20" />
                          <p className="text-[10px] text-black/30 dark:text-white/30 mt-0.5">لم يبدأ</p>
                        </>
                      )}
                    </div>

                    {/* Status Badge */}
                    <span className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${st.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {st.label}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {!client.isProjectLive ? (
                        <Button
                          size="sm"
                          onClick={() => goLiveMutation.mutate(client.id)}
                          disabled={goLiveMutation.isPending}
                          className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1 font-bold"
                          data-testid={`btn-golive-${client.id}`}
                        >
                          <Rocket className="w-3 h-3" />
                          Go Live
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => unliveMutation.mutate(client.id)}
                          disabled={unliveMutation.isPending}
                          className="text-xs h-8 border-gray-200 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl gap-1"
                          data-testid={`btn-unlive-${client.id}`}
                        >
                          <WifiOff className="w-3 h-3" />
                          إلغاء Live
                        </Button>
                      )}

                      {client.subscriptionStatus === "active" && (
                        <Button size="sm" variant="outline"
                          onClick={() => statusMutation.mutate({ clientId: client.id, status: "suspended" })}
                          disabled={statusMutation.isPending}
                          className="text-xs h-8 border-amber-200 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl gap-1"
                          data-testid={`btn-suspend-${client.id}`}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          إيقاف
                        </Button>
                      )}

                      {(client.subscriptionStatus === "suspended" || client.subscriptionStatus === "expired") && (
                        <Button size="sm" variant="outline"
                          onClick={() => statusMutation.mutate({ clientId: client.id, status: "active" })}
                          disabled={statusMutation.isPending}
                          className="text-xs h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl gap-1"
                          data-testid={`btn-reactivate-${client.id}`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          إعادة تفعيل
                        </Button>
                      )}

                      {client.subscriptionStatus !== "none" && (
                        <Button size="sm" variant="outline"
                          onClick={() => statusMutation.mutate({ clientId: client.id, status: "none" })}
                          disabled={statusMutation.isPending}
                          className="text-xs h-8 border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl gap-1"
                          data-testid={`btn-reset-${client.id}`}
                        >
                          <XCircle className="w-3 h-3" />
                          إلغاء
                        </Button>
                      )}

                      <button
                        onClick={() => toggleExpand(client.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-black/[0.03] dark:bg-white/[0.03] hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition-colors"
                        data-testid={`btn-expand-${client.id}`}
                      >
                        {isExpanded
                          ? <ChevronUp className="w-4 h-4 text-black/40 dark:text-white/40" />
                          : <ChevronDown className="w-4 h-4 text-black/40 dark:text-white/40" />}
                      </button>
                    </div>
                  </div>

                  {/* ── Expanded Detail ── */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-black/[0.05] dark:border-white/[0.05]"
                      >
                        <div className="p-4 space-y-4">

                          {/* Subscription Details Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <InfoCell label="الباقة" value={TIER_LABELS[client.planTier as keyof typeof TIER_LABELS] || client.planTier || "—"} />
                            <InfoCell label="الفترة" value={PERIOD_OPTIONS.find(p => p.value === client.subscriptionPeriod)?.label || client.subscriptionPeriod || "—"} />
                            <InfoCell label="بداية الاشتراك" value={formatDate(client.subscriptionStartDate)} />
                            <InfoCell label="انتهاء الاشتراك" value={formatDate(client.subscriptionExpiresAt)} />
                            {client.isProjectLive && <InfoCell label="تاريخ Live" value={formatDate(client.projectLiveAt)} />}
                            {client.phone && <InfoCell label="الهاتف" value={client.phone} />}
                          </div>

                          {/* Addon Subscriptions */}
                          <div>
                            <p className="text-xs font-bold text-black/50 dark:text-white/50 mb-2 flex items-center gap-1.5">
                              <Settings2 className="w-3.5 h-3.5" />
                              المميزات الجانبية
                              {client.addonSubs?.length > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-black/[0.06] dark:bg-white/[0.06] rounded-full">{client.addonSubs.length}</span>
                              )}
                            </p>

                            {(!client.addonSubs || client.addonSubs.length === 0) ? (
                              <p className="text-xs text-black/25 dark:text-white/25 text-center py-3 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl">
                                لا توجد مميزات جانبية مضافة
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {client.addonSubs.map((addon: any) => {
                                  const pct = addon.quotaTotal > 0
                                    ? Math.min(100, Math.round((addon.quotaUsed / addon.quotaTotal) * 100))
                                    : 0;
                                  const addonSt = ADDON_STATUS_MAP[addon.status as keyof typeof ADDON_STATUS_MAP] || ADDON_STATUS_MAP.cancelled;
                                  const needsRenewal = addon.status === "exhausted" || addon.status === "expired";
                                  return (
                                    <div key={addon.id} className={`p-3 rounded-xl border ${addonSt.color}`}>
                                      <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-semibold text-sm text-black dark:text-white">{addon.addonNameAr}</span>
                                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${addonSt.color}`}>{addonSt.label}</span>
                                          {needsRenewal && (
                                            <span className="text-[10px] font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full border border-orange-200">
                                              ⚠ يحتاج تجديد
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[10px] text-black/40 dark:text-white/40">
                                          {addon.expiresAt
                                            ? `ينتهي: ${formatDate(addon.expiresAt)}`
                                            : addon.billingType === "one_time" ? "مرة واحدة" : ""}
                                        </p>
                                      </div>
                                      {addon.quotaTotal > 0 && (
                                        <div className="mt-2">
                                          <div className="flex justify-between text-[10px] text-black/40 dark:text-white/40 mb-1">
                                            <span>استُهلك: {addon.quotaUsed} / {addon.quotaTotal}</span>
                                            <span>{pct}%</span>
                                          </div>
                                          <div className="w-full h-1.5 bg-black/[0.06] dark:bg-white/[0.06] rounded-full overflow-hidden">
                                            <div
                                              className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-orange-400" : "bg-emerald-500"}`}
                                              style={{ width: `${pct}%` }}
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
