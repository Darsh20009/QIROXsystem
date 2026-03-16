import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import SARIcon from "@/components/SARIcon";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Settings2, Plus, Pencil, Trash2, Loader2, CheckCircle2, XCircle, Clock,
  Infinity, ShieldCheck, AlertCircle,
} from "lucide-react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useI18n } from "@/lib/i18n";

function getTierLabels(L: boolean): Record<string, string> { return L ? { lite: "لايت", pro: "برو", infinite: "إنفنيت" } : { lite: "Lite", pro: "Pro", infinite: "Infinite" }; }
function getPeriodLabels(L: boolean): Record<string, string> { return L ? { monthly: "شهري", sixmonth: "نصف سنوي", annual: "سنوي" } : { monthly: "Monthly", sixmonth: "Semi-annual", annual: "Annual" }; }
function getAddonStatusMap(L: boolean): Record<string, { label: string; color: string }> { return {
  pending: { label: L ? "قيد المراجعة" : "Under Review", color: "bg-amber-100 text-amber-700" },
  active: { label: L ? "نشط" : "Active", color: "bg-green-100 text-green-700" },
  expired: { label: L ? "منتهي" : "Expired", color: "bg-gray-100 text-gray-500" },
  rejected: { label: L ? "مرفوض" : "Rejected", color: "bg-red-100 text-red-600" },
};
}

export default function AdminModConfig() {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const TIER_LABELS = getTierLabels(L);
  const PERIOD_LABELS = getPeriodLabels(L);
  const ADDON_STATUS_MAP = getAddonStatusMap(L);

  const { data: planConfigs = [], isLoading: loadingPlans } = useQuery<any[]>({
    queryKey: ["/api/admin/mod-plan-configs"],
  });
  const { data: typePrices = [], isLoading: loadingPrices } = useQuery<any[]>({
    queryKey: ["/api/admin/mod-type-prices"],
  });
  const { data: addons = [], isLoading: loadingAddons } = useQuery<any[]>({
    queryKey: ["/api/admin/mod-quota-addons"],
  });

  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [editingPrice, setEditingPrice] = useState<any>(null);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [addonDialogOpen, setAddonDialogOpen] = useState<any>(null);

  const [planForm, setPlanForm] = useState({ planTier: "lite", planPeriod: "monthly", modificationsPerPeriod: 5, quotaMonths: 1, notes: "" });
  const [priceForm, setPriceForm] = useState({ nameAr: "", name: "", description: "", price: 10 });
  const [addonNotes, setAddonNotes] = useState("");

  const savePlanMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingPlan) {
        const r = await apiRequest("PATCH", `/api/admin/mod-plan-configs/${editingPlan.id}`, data);
        return r.json();
      }
      const r = await apiRequest("POST", "/api/admin/mod-plan-configs", data);
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mod-plan-configs"] });
      setPlanDialogOpen(false);
      toast({ title: editingPlan ? (L ? "تم تحديث الإعداد" : "Config updated") : (L ? "تم إضافة الإعداد" : "Config added") });
      setEditingPlan(null);
    },
    onError: (err: any) => toast({ title: L ? "خطأ" : "Error", description: err?.message, variant: "destructive" }),
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/mod-plan-configs/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/mod-plan-configs"] }); toast({ title: "تم الحذف" }); },
  });

  const togglePlanMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/admin/mod-plan-configs/${id}`, { isActive }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/mod-plan-configs"] }),
  });

  const savePriceMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingPrice) {
        const r = await apiRequest("PATCH", `/api/admin/mod-type-prices/${editingPrice.id}`, data);
        return r.json();
      }
      const r = await apiRequest("POST", "/api/admin/mod-type-prices", data);
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mod-type-prices"] });
      setPriceDialogOpen(false);
      toast({ title: editingPrice ? (L ? "تم التحديث" : "Updated") : (L ? "تم الإضافة" : "Added") });
      setEditingPrice(null);
    },
    onError: (err: any) => toast({ title: L ? "خطأ" : "Error", description: err?.message, variant: "destructive" }),
  });

  const deletePriceMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/mod-type-prices/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/mod-type-prices"] }); toast({ title: "تم الحذف" }); },
  });

  const togglePriceMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/admin/mod-type-prices/${id}`, { isActive }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/mod-type-prices"] }),
  });

  const approveAddonMutation = useMutation({
    mutationFn: ({ id, status, adminNotes }: { id: string; status: string; adminNotes: string }) =>
      apiRequest("PATCH", `/api/admin/mod-quota-addons/${id}`, { status, adminNotes }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mod-quota-addons"] });
      setAddonDialogOpen(null);
      toast({ title: L ? "تم التحديث" : "Updated" });
    },
    onError: (err: any) => toast({ title: L ? "خطأ" : "Error", description: err?.message, variant: "destructive" }),
  });

  function openNewPlan() {
    setEditingPlan(null);
    setPlanForm({ planTier: "lite", planPeriod: "monthly", modificationsPerPeriod: 5, quotaMonths: 1, notes: "" });
    setPlanDialogOpen(true);
  }

  function openEditPlan(cfg: any) {
    setEditingPlan(cfg);
    setPlanForm({
      planTier: cfg.planTier, planPeriod: cfg.planPeriod,
      modificationsPerPeriod: cfg.modificationsPerPeriod, quotaMonths: cfg.quotaMonths, notes: cfg.notes || "",
    });
    setPlanDialogOpen(true);
  }

  function openNewPrice() {
    setEditingPrice(null);
    setPriceForm({ nameAr: "", name: "", description: "", price: 10 });
    setPriceDialogOpen(true);
  }

  function openEditPrice(tp: any) {
    setEditingPrice(tp);
    setPriceForm({ nameAr: tp.nameAr, name: tp.name || "", description: tp.description || "", price: tp.price });
    setPriceDialogOpen(true);
  }

  const tiers = ["lite", "pro", "infinite"];
  const periods = ["monthly", "sixmonth", "annual"];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto" dir={dir}>
      <PageGraphics variant="dashboard" />
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
          <Settings2 className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-black dark:text-white">{L ? "إعدادات حصص التعديل" : "Modification Quota Settings"}</h1>
          <p className="text-xs text-black/50 dark:text-white/50">{L ? "تحكم في عدد التعديلات المسموح بها لكل خطة وفترة" : "Control the number of modifications allowed per plan and period"}</p>
        </div>
      </div>

      <Tabs defaultValue="plans" dir={dir}>
        <TabsList className="mb-4">
          <TabsTrigger value="plans">{L ? "حصص الخطط" : "Plan Quotas"}</TabsTrigger>
          <TabsTrigger value="lifetime">{L ? "مدى الحياة — أسعار التعديلات" : "Lifetime — Modification Prices"}</TabsTrigger>
          <TabsTrigger value="addons">
            {L ? "طلبات الإضافة" : "Addon Requests"}
            {addons.filter((a: any) => a.status === 'pending').length > 0 && (
              <span className="mr-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {addons.filter((a: any) => a.status === 'pending').length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Plan configs ── */}
        <TabsContent value="plans">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold">{L ? "حصص التعديل حسب الخطة والفترة" : "Modification Quotas by Plan & Period"}</CardTitle>
              <Button size="sm" onClick={openNewPlan} className="gap-1 text-xs h-8" data-testid="button-add-plan-config">
                <Plus className="w-3.5 h-3.5" /> {L ? "إضافة إعداد" : "Add Config"}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loadingPlans ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-black/30" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">{L ? "الفئة" : "Plan"}</TableHead>
                        <TableHead className="text-right">{L ? "الفترة" : "Period"}</TableHead>
                        <TableHead className="text-right">{L ? "التعديلات/الشهر" : "Mods/Month"}</TableHead>
                        <TableHead className="text-right">{L ? "أشهر الحصة" : "Quota Months"}</TableHead>
                        <TableHead className="text-right">{L ? "ملاحظات" : "Notes"}</TableHead>
                        <TableHead className="text-right">{L ? "مفعّل" : "Active"}</TableHead>
                        <TableHead className="text-right">{L ? "إجراءات" : "Actions"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tiers.map(tier => periods.map(period => {
                        const cfg = planConfigs.find((c: any) => c.planTier === tier && c.planPeriod === period);
                        if (!cfg) return null;
                        return (
                          <TableRow key={cfg.id} data-testid={`row-plan-${tier}-${period}`}>
                            <TableCell>
                              <Badge variant="outline" className="font-bold">{TIER_LABELS[tier]}</Badge>
                            </TableCell>
                            <TableCell className="text-sm font-medium">{PERIOD_LABELS[period]}</TableCell>
                            <TableCell>
                              <span className="font-bold text-violet-700 dark:text-violet-400">{cfg.modificationsPerPeriod}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{cfg.quotaMonths} {L ? (cfg.quotaMonths === 1 ? "شهر" : "أشهر") : "mo"}</span>
                            </TableCell>
                            <TableCell className="text-xs text-black/50 dark:text-white/40 max-w-[120px] truncate">{cfg.notes || "—"}</TableCell>
                            <TableCell>
                              <Switch
                                checked={cfg.isActive}
                                onCheckedChange={(v) => togglePlanMutation.mutate({ id: cfg.id, isActive: v })}
                                data-testid={`toggle-plan-${cfg.id}`}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditPlan(cfg)} data-testid={`button-edit-plan-${cfg.id}`}>
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => deletePlanMutation.mutate(cfg.id)} data-testid={`button-delete-plan-${cfg.id}`}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }))}
                    </TableBody>
                  </Table>
                  {planConfigs.length === 0 && (
                    <div className="py-10 text-center text-sm text-black/40 dark:text-white/30">{L ? "لا توجد إعدادات بعد" : "No configs yet"}</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Lifetime modification type prices ── */}
        <TabsContent value="lifetime">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold">{L ? "أنواع التعديلات — باقة مدى الحياة" : "Modification Types — Lifetime Plan"}</CardTitle>
                <p className="text-xs text-black/40 dark:text-white/30 mt-0.5">{L ? "كل تعديل يُسعَّر حسب نوعه (الحد الأقصى 50 ريال)" : "Each modification is priced by type (max 50 SAR)"}</p>
              </div>
              <Button size="sm" onClick={openNewPrice} className="gap-1 text-xs h-8" data-testid="button-add-mod-type">
                <Plus className="w-3.5 h-3.5" /> {L ? "إضافة نوع" : "Add Type"}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loadingPrices ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-black/30" /></div>
              ) : typePrices.length === 0 ? (
                <div className="py-10 text-center text-sm text-black/40 dark:text-white/30">{L ? "لا توجد أنواع تعديل بعد، أضف أول نوع" : "No modification types yet, add the first one"}</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">{L ? "الاسم" : "Name"}</TableHead>
                        <TableHead className="text-right">{L ? "الوصف" : "Description"}</TableHead>
                        <TableHead className="text-right">{L ? "السعر (ريال)" : "Price (SAR)"}</TableHead>
                        <TableHead className="text-right">{L ? "مفعّل" : "Active"}</TableHead>
                        <TableHead className="text-right">{L ? "إجراءات" : "Actions"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {typePrices.map((tp: any) => (
                        <TableRow key={tp.id} data-testid={`row-mod-type-${tp.id}`}>
                          <TableCell className="font-bold text-sm">{tp.nameAr}</TableCell>
                          <TableCell className="text-xs text-black/50 dark:text-white/40 max-w-[160px] truncate">{tp.description || "—"}</TableCell>
                          <TableCell>
                            <span className="font-black text-green-600 dark:text-green-400 flex items-center gap-1">{tp.price} <SARIcon size={11} className="opacity-60" /></span>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={tp.isActive}
                              onCheckedChange={(v) => togglePriceMutation.mutate({ id: tp.id, isActive: v })}
                              data-testid={`toggle-mod-type-${tp.id}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditPrice(tp)} data-testid={`button-edit-mod-type-${tp.id}`}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => deletePriceMutation.mutate(tp.id)} data-testid={`button-delete-mod-type-${tp.id}`}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 3: Addon purchase requests ── */}
        <TabsContent value="addons">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">{L ? "طلبات شراء تعديلات غير محدودة (1000 ريال/شهر)" : "Unlimited Modifications Purchase Requests (1,000 SAR/month)"}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingAddons ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-black/30" /></div>
              ) : addons.length === 0 ? (
                <div className="py-10 text-center text-sm text-black/40 dark:text-white/30">{L ? "لا توجد طلبات بعد" : "No requests yet"}</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">{L ? "العميل" : "Client"}</TableHead>
                        <TableHead className="text-right">{L ? "الطلب" : "Order"}</TableHead>
                        <TableHead className="text-right">{L ? "المبلغ" : "Amount"}</TableHead>
                        <TableHead className="text-right">{L ? "الحالة" : "Status"}</TableHead>
                        <TableHead className="text-right">{L ? "صلاحية" : "Validity"}</TableHead>
                        <TableHead className="text-right">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {addons.map((a: any) => {
                        const statusInfo = ADDON_STATUS_MAP[a.status] || { label: a.status, color: "bg-gray-100 text-gray-600" };
                        return (
                          <TableRow key={a.id} data-testid={`row-addon-${a.id}`}>
                            <TableCell>
                              <p className="font-bold text-sm">{a.client?.fullName || a.client?.username || "—"}</p>
                              <p className="text-xs text-black/40 dark:text-white/30">{a.client?.email}</p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{a.order?.businessName || a.order?.serviceType || "—"}</p>
                              <p className="text-xs text-black/40 dark:text-white/30">{TIER_LABELS[a.order?.planTier] || ""} — {PERIOD_LABELS[a.order?.planPeriod] || ""}</p>
                            </TableCell>
                            <TableCell className="font-bold text-green-600 flex items-center gap-1">1,000 <SARIcon size={11} className="opacity-60" /></TableCell>
                            <TableCell>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
                            </TableCell>
                            <TableCell className="text-xs">
                              {a.validFrom ? (
                                <span>{new Date(a.validFrom).toLocaleDateString(L ? "ar-SA" : "en-US")} → {new Date(a.validUntil).toLocaleDateString(L ? "ar-SA" : "en-US")}</span>
                              ) : "—"}
                            </TableCell>
                            <TableCell>
                              {a.status === 'pending' && (
                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { setAddonDialogOpen(a); setAddonNotes(""); }} data-testid={`button-review-addon-${a.id}`}>
                                  <ShieldCheck className="w-3.5 h-3.5" /> {L ? "مراجعة" : "Review"}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Plan Config Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="sm:max-w-md" dir={dir}>
          <DialogHeader>
            <DialogTitle className="font-black">{editingPlan ? (L ? "تعديل الإعداد" : "Edit Config") : (L ? "إضافة إعداد جديد" : "Add New Config")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">{L ? "فئة الباقة" : "Plan Tier"}</label>
              <select
                value={planForm.planTier}
                onChange={e => setPlanForm(f => ({ ...f, planTier: e.target.value }))}
                className="w-full border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-transparent"
                data-testid="select-plan-tier"
              >
                <option value="lite">{L ? "لايت" : "Lite"}</option>
                <option value="pro">{L ? "برو" : "Pro"}</option>
                <option value="infinite">{L ? "إنفنيت" : "Infinite"}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">{L ? "فترة الباقة" : "Plan Period"}</label>
              <select
                value={planForm.planPeriod}
                onChange={e => setPlanForm(f => ({ ...f, planPeriod: e.target.value }))}
                className="w-full border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-transparent"
                data-testid="select-plan-period"
              >
                <option value="monthly">{L ? "شهري" : "Monthly"}</option>
                <option value="sixmonth">{L ? "نصف سنوي" : "Semi-annual"}</option>
                <option value="annual">{L ? "سنوي" : "Annual"}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">{L ? "التعديلات المسموح بها في الشهر" : "Allowed Modifications per Month"}</label>
              <Input type="number" min={1} value={planForm.modificationsPerPeriod} onChange={e => setPlanForm(f => ({ ...f, modificationsPerPeriod: Number(e.target.value) }))} data-testid="input-mods-per-period" />
            </div>
            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">{L ? "مدة الحصة (بالأشهر)" : "Quota Duration (months)"}</label>
              <Input type="number" min={1} value={planForm.quotaMonths} onChange={e => setPlanForm(f => ({ ...f, quotaMonths: Number(e.target.value) }))} data-testid="input-quota-months" />
            </div>
            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">{L ? "ملاحظات (اختياري)" : "Notes (optional)"}</label>
              <Input value={planForm.notes} onChange={e => setPlanForm(f => ({ ...f, notes: e.target.value }))} data-testid="input-plan-notes" />
            </div>
            <Button className="w-full bg-black text-white hover:bg-black/80 font-bold text-sm" onClick={() => savePlanMutation.mutate(planForm)} disabled={savePlanMutation.isPending} data-testid="button-save-plan-config">
              {savePlanMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              {editingPlan ? (L ? "حفظ التعديلات" : "Save Changes") : (L ? "إضافة" : "Add")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mod Type Price Dialog */}
      <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
        <DialogContent className="sm:max-w-md" dir={dir}>
          <DialogHeader>
            <DialogTitle className="font-black">{editingPrice ? (L ? "تعديل نوع التعديل" : "Edit Modification Type") : (L ? "إضافة نوع تعديل" : "Add Modification Type")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">{L ? "الاسم بالعربية *" : "Arabic Name *"}</label>
              <Input value={priceForm.nameAr} onChange={e => setPriceForm(f => ({ ...f, nameAr: e.target.value }))} placeholder={L ? "مثال: تعديل نصي" : "e.g.: Text Edit"} data-testid="input-mod-type-name-ar" />
            </div>
            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">{L ? "الاسم بالإنجليزية" : "English Name"}</label>
              <Input value={priceForm.name} onChange={e => setPriceForm(f => ({ ...f, name: e.target.value }))} placeholder="Text Edit" data-testid="input-mod-type-name" />
            </div>
            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">{L ? "الوصف (اختياري)" : "Description (optional)"}</label>
              <Input value={priceForm.description} onChange={e => setPriceForm(f => ({ ...f, description: e.target.value }))} data-testid="input-mod-type-desc" />
            </div>
            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">{L ? "السعر (ريال) — الحد الأقصى 50" : "Price (SAR) — Max 50"}</label>
              <Input type="number" min={1} max={50} value={priceForm.price} onChange={e => setPriceForm(f => ({ ...f, price: Math.min(50, Number(e.target.value)) }))} data-testid="input-mod-type-price" />
              <p className="text-[10px] text-black/40 dark:text-white/30 mt-1">{L ? "الحد الأقصى المسموح به: 50 ريال" : "Maximum allowed: 50 SAR"}</p>
            </div>
            <Button className="w-full bg-black text-white hover:bg-black/80 font-bold text-sm" onClick={() => savePriceMutation.mutate(priceForm)} disabled={savePriceMutation.isPending || !priceForm.nameAr.trim()} data-testid="button-save-mod-type">
              {savePriceMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              {editingPrice ? (L ? "حفظ التعديلات" : "Save Changes") : (L ? "إضافة" : "Add")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Addon Review Dialog */}
      <Dialog open={!!addonDialogOpen} onOpenChange={() => setAddonDialogOpen(null)}>
        <DialogContent className="sm:max-w-md" dir={dir}>
          <DialogHeader>
            <DialogTitle className="font-black">{L ? "مراجعة طلب الإضافة" : "Review Addon Request"}</DialogTitle>
          </DialogHeader>
          {addonDialogOpen && (
            <div className="space-y-4 mt-2">
              <div className="bg-black/[0.03] dark:bg-white/[0.04] rounded-xl p-4 space-y-2">
                <p className="text-sm font-bold">{addonDialogOpen.client?.fullName || addonDialogOpen.client?.username}</p>
                <p className="text-xs text-black/50 dark:text-white/40">{addonDialogOpen.client?.email}</p>
                <p className="text-xs">{L ? "الطلب:" : "Order:"} <strong>{addonDialogOpen.order?.businessName || addonDialogOpen.order?.serviceType}</strong></p>
                <p className="text-xs">{L ? "الخطة:" : "Plan:"} <strong>{TIER_LABELS[addonDialogOpen.order?.planTier]} — {PERIOD_LABELS[addonDialogOpen.order?.planPeriod]}</strong></p>
                <p className="text-xs">{L ? "المبلغ:" : "Amount:"} <strong className="text-green-600">1,000 {L ? "ريال" : "SAR"}</strong></p>
                {addonDialogOpen.paymentProofUrl && (
                  <a href={addonDialogOpen.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">{L ? "عرض إثبات الدفع" : "View Payment Proof"}</a>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">{L ? "ملاحظات للعميل" : "Notes for Client"}</label>
                <Input value={addonNotes} onChange={e => setAddonNotes(e.target.value)} placeholder={L ? "اختياري..." : "Optional..."} data-testid="input-addon-notes" />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold gap-1.5 text-xs" onClick={() => approveAddonMutation.mutate({ id: addonDialogOpen.id, status: 'active', adminNotes: addonNotes })} disabled={approveAddonMutation.isPending} data-testid="button-approve-addon">
                  <CheckCircle2 className="w-4 h-4" /> {L ? "قبول وتفعيل" : "Accept & Activate"}
                </Button>
                <Button variant="outline" className="flex-1 text-red-500 border-red-200 hover:bg-red-50 font-bold gap-1.5 text-xs" onClick={() => approveAddonMutation.mutate({ id: addonDialogOpen.id, status: 'rejected', adminNotes: addonNotes })} disabled={approveAddonMutation.isPending} data-testid="button-reject-addon">
                  <XCircle className="w-4 h-4" /> {L ? "رفض" : "Reject"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
