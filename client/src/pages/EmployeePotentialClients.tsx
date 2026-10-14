import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  CheckCircle2,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MANUAL_MARKETING_SECTORS } from "@shared/manual-marketing";

type LeadStatus = "sent" | "excluded" | "converted";
type Prospect = {
  id: string;
  normalizedPhone: string;
  sector: string;
  countryCode: string;
  businessName?: string;
  leadStatus: LeadStatus;
  exclusionSource?: "manual" | "recipient_opt_out" | null;
  sentAt: string;
  lastReplyAt?: string | null;
  lastReplyPreview?: string;
  lastReplyContactName?: string;
  convertedClientId?: string | null;
};

const PAGE_SIZE = 100;
const STATUS_LABELS: Record<LeadStatus, string> = {
  sent: "تم الإرسال",
  excluded: "مستبعد",
  converted: "عميل فعلي",
};

export default function EmployeePotentialClients() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [leads, setLeads] = useState<Prospect[]>([]);
  const sectorLabels = useMemo(
    () => new Map<string, string>(MANUAL_MARKETING_SECTORS.map((sector): [string, string] => [sector.key, sector.label])),
    [],
  );

  useEffect(() => {
    setPage(0);
    setLeads([]);
  }, [search, statusFilter]);

  const query = useQuery({
    queryKey: ["/api/whatsapp/crm/manual-marketing/leads", search, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        skip: String(page * PAGE_SIZE),
      });
      if (search.trim()) params.set("q", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      const response = await fetch(`/api/whatsapp/crm/manual-marketing/leads?${params}`, {
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "تعذر تحميل العملاء المحتملين");
      return data as { leads: Prospect[]; total: number; hasMore: boolean };
    },
  });

  useEffect(() => {
    if (!query.data) return;
    setLeads((current) => {
      if (page === 0) return query.data!.leads;
      const known = new Set(current.map((lead) => lead.id));
      return [...current, ...query.data!.leads.filter((lead) => !known.has(lead.id))];
    });
  }, [query.data, page]);

  const statusMutation = useMutation({
    mutationFn: async ({ id, leadStatus }: { id: string; leadStatus: "sent" | "excluded" }) => {
      const response = await fetch(`/api/whatsapp/crm/manual-marketing/leads/${id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadStatus }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "تعذر تغيير الحالة");
      return data as Prospect;
    },
    onSuccess: (updated) => {
      setLeads((current) => current.map((lead) => lead.id === updated.id ? { ...lead, ...updated } : lead));
      void queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/crm/manual-marketing/leads"] });
      toast({ title: `تم تحديث حالة ${updated.businessName || "العميل المحتمل"}` });
    },
    onError: (error: Error) => toast({ title: "تعذر تغيير الحالة", description: error.message, variant: "destructive" }),
  });

  const convertMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/whatsapp/crm/manual-marketing/leads/${id}/convert`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 409 && data.requiresNewClient) return data;
      if (!response.ok) throw new Error(data.error || "تعذر تحويل العميل المحتمل");
      return data;
    },
    onSuccess: (result, id) => {
      if (result.requiresNewClient && result.createClientUrl) {
        window.location.assign(result.createClientUrl);
        return;
      }
      setLeads((current) => current.map((lead) =>
        lead.id === id ? { ...lead, leadStatus: "converted", convertedClientId: result.client?.id } : lead,
      ));
      void queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/crm/manual-marketing/leads"] });
      toast({ title: "تم ربط العميل المحتمل بحساب العميل الفعلي" });
    },
    onError: (error: Error) => toast({ title: "تعذر تحويل العميل", description: error.message, variant: "destructive" }),
  });

  const total = query.data?.total ?? leads.length;
  const hasMore = query.data?.hasMore ?? false;

  return (
    <div className="relative mx-auto max-w-[1400px] space-y-5 p-4 md:p-6" dir="rtl">
      <PageGraphics variant="dashboard" />
      <Card className="relative overflow-hidden border-emerald-200/70 p-5 dark:border-emerald-900/40">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black">العملاء المحتملون</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                كل رقم أُرسلت إليه رسالة تسويق يدوي، من أي قطاع، مع الرد والحالة.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}>
            <RefreshCw className={`ml-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />
            تحديث
          </Button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pr-9"
              placeholder="ابحث بالرقم أو اسم النشاط أو القطاع أو الرد"
              aria-label="ابحث عن عميل محتمل"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="تصفية حسب الحالة"
          >
            <option value="all">كل الحالات</option>
            <option value="sent">تم الإرسال</option>
            <option value="excluded">مستبعد</option>
            <option value="converted">عميل فعلي</option>
          </select>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          {total.toLocaleString("ar-SA")} سجل
        </div>
      </Card>

      {query.isLoading && leads.length === 0 ? (
        <div className="flex min-h-48 items-center justify-center text-muted-foreground">
          <Loader2 className="ml-2 h-5 w-5 animate-spin" />
          جارٍ تحميل القائمة...
        </div>
      ) : query.isError ? (
        <Card className="p-6 text-center">
          <p className="font-bold text-destructive">{(query.error as Error).message}</p>
          <Button className="mt-4" variant="outline" onClick={() => void query.refetch()}>إعادة المحاولة</Button>
        </Card>
      ) : leads.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          <Users className="mx-auto mb-3 h-9 w-9 opacity-35" />
          <p className="font-bold">لا توجد سجلات مطابقة</p>
          <p className="mt-1 text-sm">تُضاف الأرقام تلقائيًا بعد نجاح إرسال التسويق اليدوي.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => {
            const isBusy = statusMutation.isPending && statusMutation.variables?.id === lead.id;
            const converting = convertMutation.isPending && convertMutation.variables === lead.id;
            const optOutLocked = lead.exclusionSource === "recipient_opt_out";
            return (
              <Card key={lead.id} className="p-4 md:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-black">{lead.businessName || lead.lastReplyContactName || "نشاط بدون اسم"}</h2>
                      <Badge variant={lead.leadStatus === "converted" ? "default" : lead.leadStatus === "excluded" ? "destructive" : "secondary"}>
                        {STATUS_LABELS[lead.leadStatus]}
                      </Badge>
                      <Badge variant="outline">{sectorLabels.get(lead.sector) || lead.sector}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span dir="ltr" className="font-mono">+{lead.normalizedPhone}</span>
                      <span>{lead.countryCode}</span>
                      <span>أُرسلت: {lead.sentAt ? new Date(lead.sentAt).toLocaleString("ar-SA") : "—"}</span>
                    </div>
                    {lead.lastReplyPreview && (
                      <div className="rounded-lg bg-muted/60 p-3 text-sm">
                        <p className="mb-1 flex items-center gap-1.5 font-bold">
                          <MessageCircle className="h-4 w-4" />
                          {lead.lastReplyContactName || "رد العميل"}
                          {lead.lastReplyAt && <span className="font-normal text-muted-foreground">· {new Date(lead.lastReplyAt).toLocaleString("ar-SA")}</span>}
                        </p>
                        <p className="whitespace-pre-wrap break-words text-muted-foreground">{lead.lastReplyPreview}</p>
                      </div>
                    )}
                    {optOutLocked && (
                      <p className="text-xs font-semibold text-destructive">
                        طلب العميل إيقاف الرسائل؛ سيبقى مستبعدًا احترامًا لطلبه.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {lead.leadStatus !== "converted" ? (
                      <select
                        value={lead.leadStatus}
                        disabled={isBusy || optOutLocked}
                        onChange={(event) => statusMutation.mutate({
                          id: lead.id,
                          leadStatus: event.target.value as "sent" | "excluded",
                        })}
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm disabled:opacity-50"
                        aria-label={`تغيير حالة ${lead.businessName || lead.normalizedPhone}`}
                      >
                        <option value="sent">تم الإرسال</option>
                        <option value="excluded">مستبعد</option>
                      </select>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        مرتبط بحساب عميل
                      </span>
                    )}
                    <a
                      href={`https://wa.me/${lead.normalizedPhone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border px-3 text-sm font-semibold hover:bg-muted"
                    >
                      <MessageCircle className="h-4 w-4" />
                      واتساب
                    </a>
                    {lead.leadStatus !== "converted" && (
                      <Button
                        size="sm"
                        disabled={converting}
                        onClick={() => convertMutation.mutate(lead.id)}
                      >
                        {converting
                          ? <Loader2 className="ml-1.5 h-4 w-4 animate-spin" />
                          : lead.leadStatus === "excluded"
                            ? <Ban className="ml-1.5 h-4 w-4" />
                            : <UserRoundCheck className="ml-1.5 h-4 w-4" />}
                        تحويل لعميل فعلي
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" disabled={query.isFetching} onClick={() => setPage((current) => current + 1)}>
                {query.isFetching && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                تحميل المزيد
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
