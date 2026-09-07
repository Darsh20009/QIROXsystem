import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock3, Loader2, RefreshCw, Search, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";

const PERIODS = [
  { value: "monthly", ar: "شهري", en: "Monthly" },
  { value: "6months", ar: "6 أشهر", en: "6 months" },
  { value: "annual", ar: "سنوي", en: "Annual" },
  { value: "lifetime", ar: "دائم", en: "Lifetime" },
];

function formatDate(value: string | null | undefined, locale: string) {
  return value ? new Date(value).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" }) : "—";
}

export default function AdminProjectRenewals() {
  const { lang, dir } = useI18n();
  const { toast } = useToast();
  const L = lang === "ar";
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [periods, setPeriods] = useState<Record<string, string>>({});

  const { data: requests = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/project-subscription-renewals", statusFilter],
    queryFn: async () => {
      const response = await fetch(`/api/admin/project-subscription-renewals?status=${statusFilter}`, { credentials: "include" });
      if (!response.ok) throw new Error(L ? "تعذر تحميل الطلبات" : "Could not load requests");
      return response.json();
    },
  });

  const processMutation = useMutation({
    mutationFn: async ({ id, status, period }: { id: string; status: "approved" | "rejected"; period?: string }) =>
      apiRequest("PATCH", `/api/admin/project-subscription-renewals/${id}`, { status, period }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/project-subscription-renewals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: L ? "تم تحديث طلب التجديد" : "Renewal request updated" });
    },
    onError: (error: any) => toast({ title: error?.message || (L ? "تعذر معالجة الطلب" : "Could not process request"), variant: "destructive" }),
  });

  const statusLabels: Record<string, { label: string; icon: any }> = {
    pending: { label: L ? "قيد المراجعة" : "Pending", icon: Clock3 },
    approved: { label: L ? "تمت الموافقة" : "Approved", icon: CheckCircle2 },
    rejected: { label: L ? "مرفوض" : "Rejected", icon: XCircle },
  };

  const normalizedSearch = searchQuery.trim().toLocaleLowerCase();
  const filteredRequests = requests.filter((request: any) => {
    if (!normalizedSearch) return true;
    const statusLabel = statusLabels[request.status]?.label || request.status || "";
    const searchableText = [
      request.client?.fullName,
      request.client?.username,
      request.client?.email,
      request.project?.name,
      request.project?.title,
      request.project?.businessName,
      request.project?.slug,
      request.project?.id,
      request.project?._id,
      request.subscription?.period,
      request.status,
      statusLabel,
    ].filter(Boolean).join(" ").toLocaleLowerCase();
    return searchableText.includes(normalizedSearch);
  });

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto" dir={dir}>
      <div>
        <h1 className="text-xl font-black text-black dark:text-white flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          {L ? "طلبات تجديد اشتراكات المشاريع" : "Project Subscription Renewals"}
        </h1>
        <p className="text-xs text-black/40 dark:text-white/40 mt-1">
          {L ? "راجع طلبات العملاء وفعّل فترة تجديد جديدة دون تعديل الاشتراك الأصلي" : "Review client requests and activate a new renewal period without changing the original subscription"}
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {Object.entries(statusLabels).map(([value, config]) => {
          const StatusIcon = config.icon;
          return (
            <Button
              key={value}
              size="sm"
              variant={statusFilter === value ? "default" : "outline"}
              onClick={() => setStatusFilter(value)}
              className="rounded-xl gap-1.5"
              data-testid={`filter-project-renewals-${value}`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {config.label}
            </Button>
          );
        })}
      </div>

      <div className="relative">
        <Search className={`pointer-events-none absolute ${L ? "right-3" : "left-3"} top-1/2 h-4 w-4 -translate-y-1/2 text-black/30 dark:text-white/30`} />
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={L ? "ابحث باسم العميل أو المشروع أو البريد..." : "Search by client, project, or email..."}
          aria-label={L ? "البحث في اشتراكات المشاريع" : "Search project subscriptions"}
          dir={dir}
          className={`h-10 w-full rounded-xl border border-black/[0.08] bg-white text-sm text-black outline-none transition-colors placeholder:text-black/30 focus:border-black/20 dark:border-white/[0.1] dark:bg-gray-900 dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/20 ${L ? "pr-10 pl-10 text-right" : "pl-10 pr-10 text-left"}`}
          data-testid="project-subscriptions-search"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            aria-label={L ? "مسح البحث" : "Clear search"}
            className={`absolute ${L ? "left-2" : "right-2"} top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-black/30 hover:bg-black/[0.05] hover:text-black/60 dark:text-white/30 dark:hover:bg-white/[0.08] dark:hover:text-white/70`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-black/30 dark:text-white/30" /></div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-black/[0.07] dark:border-white/[0.07] p-12 text-center text-sm text-black/35 dark:text-white/35">
          {L ? "لا توجد طلبات تجديد" : "No renewal requests"}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-2xl border border-black/[0.07] dark:border-white/[0.07] p-12 text-center text-sm text-black/35 dark:text-white/35">
          {L ? "لا توجد اشتراكات مطابقة للبحث" : "No subscriptions match your search"}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request: any) => {
            const requestId = request.id || request._id;
            const clientName = request.client?.fullName || request.client?.username || "—";
            const defaultPeriod = request.subscription?.period || "annual";
            const selectedPeriod = periods[requestId] || defaultPeriod;
            const status = statusLabels[request.status] || statusLabels.pending;
            const StatusIcon = status.icon;
            return (
              <div key={requestId} className="rounded-2xl border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900 p-4 space-y-3" data-testid={`project-renewal-${requestId}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm text-black dark:text-white">{clientName}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-black/60 dark:text-white/60 flex items-center gap-1">
                        <StatusIcon className="w-3 h-3" /> {status.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-black/40 dark:text-white/40 mt-1">
                      {request.client?.email || "—"} · {L ? "تاريخ الطلب" : "Requested"}: {formatDate(request.requestedAt, L ? "ar-SA" : "en-US")}
                    </p>
                  </div>
                  <p className="text-[11px] text-black/45 dark:text-white/45">
                    {L ? "حالة المشروع" : "Project status"}: {request.project?.status || "—"}
                  </p>
                </div>

                {request.status === "pending" && (
                  <div className="flex items-center gap-2 flex-wrap border-t border-black/[0.05] dark:border-white/[0.05] pt-3">
                    <select
                      value={selectedPeriod}
                      onChange={(event) => setPeriods((current) => ({ ...current, [requestId]: event.target.value }))}
                      className="h-9 rounded-xl border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-gray-900 px-3 text-xs"
                      aria-label={L ? "فترة التجديد" : "Renewal period"}
                      data-testid={`select-renewal-period-${requestId}`}
                    >
                      {PERIODS.map((period) => <option key={period.value} value={period.value}>{L ? period.ar : period.en}</option>)}
                    </select>
                    <Button
                      size="sm"
                      onClick={() => processMutation.mutate({ id: requestId, status: "approved", period: selectedPeriod })}
                      disabled={processMutation.isPending}
                      className="rounded-xl bg-black text-white hover:bg-black/80 gap-1.5"
                      data-testid={`button-approve-project-renewal-${requestId}`}
                    >
                      {processMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      {L ? "موافقة وتفعيل" : "Approve & Activate"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => processMutation.mutate({ id: requestId, status: "rejected" })}
                      disabled={processMutation.isPending}
                      className="rounded-xl gap-1.5"
                      data-testid={`button-reject-project-renewal-${requestId}`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      {L ? "رفض" : "Reject"}
                    </Button>
                  </div>
                )}
                {request.status === "approved" && request.renewalStartedAt && (
                  <p className="text-[11px] text-black/45 dark:text-white/45">
                    {L ? "فترة التجديد:" : "Renewal period:"} {formatDate(request.renewalStartedAt, L ? "ar-SA" : "en-US")} → {formatDate(request.renewalExpiresAt, L ? "ar-SA" : "en-US")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}