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

const TIER_LABELS: Record<string, string> = { lite: "لايت", pro: "برو", infinite: "إنفنيت" };
const PERIOD_LABELS: Record<string, string> = { monthly: "شهري", sixmonth: "نصف سنوي", annual: "سنوي" };
const ADDON_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "قيد المراجعة", color: "bg-amber-100 text-amber-700" },
  active: { label: "نشط", color: "bg-green-100 text-green-700" },
  expired: { label: "منتهي", color: "bg-gray-100 text-gray-500" },
  rejected: { label: "مرفوض", color: "bg-red-100 text-red-600" },
};

export default function AdminModConfig() {
  const { toast } = useToast();

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
      toast({ title: editingPlan ? "تم تحديث الإعداد" : "تم إضافة الإعداد" });
      setEditingPlan(null);
    },
    onError: (err: any) => toast({ title: "خطأ", description: err?.message, variant: "destructive" }),
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
      toast({ title: editingPrice ? "تم التحديث" : "تم الإضافة" });
      setEditingPrice(null);
    },
    onError: (err: any) => toast({ title: "خطأ", description: err?.message, variant: "destructive" }),
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
      toast({ title: "تم التحديث" });
    },
    onError: (err: any) => toast({ title: "خطأ", description: err?.message, variant: "destructive" }),
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
    <div className="p-6 space-y-6 max-w-6xl mx-auto" dir="rtl">
      <PageGraphics variant="dashboard" />
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
          <Settings2 className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-black dark:text-white">إعدادات حصص التعديل</h1>
          <p className="text-xs text-black/50 dark:text-white/50">تحكم في عدد التعديلات المسموح بها لكل خطة وفترة</p>
        </div>
      </div>

      <Tabs defaultValue="plans" dir="rtl">
        <TabsList className="mb-4">
          <TabsTrigger value="plans">حصص الخطط</TabsTrigger>
          <TabsTrigger value="lifetime">مدى الحياة — أسعار التعديلات</TabsTrigger>
          <TabsTrigger value="addons">
            طلبات الإضافة
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
              <CardTitle className="text-base font-bold">حصص التعديل حسب الخطة والفترة</CardTitle>
              <Button size="sm" onClick={openNewPlan} className="gap-1 text-xs h-8" data-testid="button-add-plan-config">
                <Plus className="w-3.5 h-3.5" /> إضافة إعداد
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
                        <TableHead className="text-right">الفئة</TableHead>
                        <TableHead className="text-right">الفترة</TableHead>
                        <TableHead className="text-right">التعديلات/الشهر</TableHead>
                        <TableHead className="text-right">أشهر الحصة</TableHead>
                        <TableHead className="text-right">ملاحظات</TableHead>
                        <TableHead className="text-right">مفعّل</TableHead>
                        <TableHead className="text-right">إجراءات</TableHead>
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
                              <span className="text-sm">{cfg.quotaMonths} {cfg.quotaMonths === 1 ? "شهر" : "أشهر"}</span>
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
                    <div className="py-10 text-center text-sm text-black/40 dark:text-white/30">لا توجد إعدادات بعد</div>
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
                <CardTitle className="text-base font-bold">أنواع التعديلات — باقة مدى الحياة</CardTitle>
                <p className="text-xs text-black/40 dark:text-white/30 mt-0.5">كل تعديل يُسعَّر حسب نوعه (الحد الأقصى 50 ريال)</p>
              </div>
              <Button size="sm" onClick={openNewPrice} className="gap-1 text-xs h-8" data-testid="button-add-mod-type">
                <Plus className="w-3.5 h-3.5" /> إضافة نوع
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loadingPrices ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-black/30" /></div>
              ) : typePrices.length === 0 ? (
                <div className="py-10 text-center text-sm text-black/40 dark:text-white/30">لا توجد أنواع تعديل بعد، أضف أول نوع</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الاسم</TableHead>
                        <TableHead className="text-right">الوصف</TableHead>
                        <TableHead className="text-right">السعر (ريال)</TableHead>
                        <TableHead className="text-right">مفعّل</TableHead>
                        <TableHead className="text-right">إجراءات</TableHead>
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
              <CardTitle className="text-base font-bold">طلبات شراء تعديلات غير محدودة (1000 ريال/شهر)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingAddons ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-black/30" /></div>
              ) : addons.length === 0 ? (
                <div className="py-10 text-center text-sm text-black/40 dark:text-white/30">لا توجد طلبات بعد</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">العميل</TableHead>
                        <TableHead className="text-right">الطلب</TableHead>
                        <TableHead className="text-right">المبلغ</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">صلاحية</TableHead>
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
                                <span>{new Date(a.validFrom).toLocaleDateString("ar-SA")} → {new Date(a.validUntil).toLocaleDateString("ar-SA")}</span>
                              ) : "—"}
                            </TableCell>
                            <TableCell>
                              {a.status === 'pending' && (
                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { setAddonDialogOpen(a); setAddonNotes(""); }} data-testid={`button-review-addon-${a.id}`}>
                                  <ShieldCheck className="w-3.5 h-3.5" /> مراجعة
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
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-black">{editingPlan ? "تعديل الإعداد" : "إضافة إعداد جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">فئة الباقة</label>
              <select
                value={planForm.planTier}
                onChange={e => setPlanForm(f => ({ ...f, planTier: e.target.value }))}
                className="w-full border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-transparent"
                data-testid="select-plan-tier"
              >
                <option value="lite">لايت</option>
                <option value="pro">برو</option>
                <option value="infinite">إنفنيت</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">فترة الباقة</label>
              <select
                value={planForm.planPeriod}
                onChange={e => setPlanForm(f => ({ ...f, planPeriod: e.target.value }))}
                className="w-full border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-transparent"
                data-testid="select-plan-period"
              >
                <option value="monthly">شهري</option>
                <option value="sixmonth">نصف سنوي</option>
                <option value="annual">سنوي</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">التعديلات المسموح بها في الشهر</label>
              <Input type="number" min={1} value={planForm.modificationsPerPeriod} onChange={e => setPlanForm(f => ({ ...f, modificationsPerPeriod: Number(e.target.value) }))} data-testid="input-mods-per-period" />
            </div>
            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">مدة الحصة (بالأشهر)</label>
              <Input type="number" min={1} value={planForm.quotaMonths} onChange={e => setPlanForm(f => ({ ...f, quotaMonths: Number(e.target.value) }))} data-testid="input-quota-months" />
            </div>
            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">ملاحظات (اختياري)</label>
              <Input value={planForm.notes} onChange={e => setPlanForm(f => ({ ...f, notes: e.target.value }))} data-testid="input-plan-notes" />
            </div>
            <Button className="w-full bg-black text-white hover:bg-black/80 font-bold text-sm" onClick={() => savePlanMutation.mutate(planForm)} disabled={savePlanMutation.isPending} data-testid="button-save-plan-config">
              {savePlanMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              {editingPlan ? "حفظ التعديلات" : "إضافة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mod Type Price Dialog */}
      <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-black">{editingPrice ? "تعديل نوع التعديل" : "إضافة نوع تعديل"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">الاسم بالعربية *</label>
              <Input value={priceForm.nameAr} onChange={e => setPriceForm(f => ({ ...f, nameAr: e.target.value }))} placeholder="مثال: تعديل نصي" data-testid="input-mod-type-name-ar" />
            </div>
            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">الاسم بالإنجليزية</label>
              <Input value={priceForm.name} onChange={e => setPriceForm(f => ({ ...f, name: e.target.value }))} placeholder="Text Edit" data-testid="input-mod-type-name" />
            </div>
            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">الوصف (اختياري)</label>
              <Input value={priceForm.description} onChange={e => setPriceForm(f => ({ ...f, description: e.target.value }))} data-testid="input-mod-type-desc" />
            </div>
            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">السعر (ريال) — الحد الأقصى 50</label>
              <Input type="number" min={1} max={50} value={priceForm.price} onChange={e => setPriceForm(f => ({ ...f, price: Math.min(50, Number(e.target.value)) }))} data-testid="input-mod-type-price" />
              <p className="text-[10px] text-black/40 dark:text-white/30 mt-1">الحد الأقصى المسموح به: 50 ريال</p>
            </div>
            <Button className="w-full bg-black text-white hover:bg-black/80 font-bold text-sm" onClick={() => savePriceMutation.mutate(priceForm)} disabled={savePriceMutation.isPending || !priceForm.nameAr.trim()} data-testid="button-save-mod-type">
              {savePriceMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              {editingPrice ? "حفظ التعديلات" : "إضافة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Addon Review Dialog */}
      <Dialog open={!!addonDialogOpen} onOpenChange={() => setAddonDialogOpen(null)}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-black">مراجعة طلب الإضافة</DialogTitle>
          </DialogHeader>
          {addonDialogOpen && (
            <div className="space-y-4 mt-2">
              <div className="bg-black/[0.03] dark:bg-white/[0.04] rounded-xl p-4 space-y-2">
                <p className="text-sm font-bold">{addonDialogOpen.client?.fullName || addonDialogOpen.client?.username}</p>
                <p className="text-xs text-black/50 dark:text-white/40">{addonDialogOpen.client?.email}</p>
                <p className="text-xs">الطلب: <strong>{addonDialogOpen.order?.businessName || addonDialogOpen.order?.serviceType}</strong></p>
                <p className="text-xs">الخطة: <strong>{TIER_LABELS[addonDialogOpen.order?.planTier]} — {PERIOD_LABELS[addonDialogOpen.order?.planPeriod]}</strong></p>
                <p className="text-xs">المبلغ: <strong className="text-green-600">1,000 ريال</strong></p>
                {addonDialogOpen.paymentProofUrl && (
                  <a href={addonDialogOpen.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">عرض إثبات الدفع</a>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">ملاحظات للعميل</label>
                <Input value={addonNotes} onChange={e => setAddonNotes(e.target.value)} placeholder="اختياري..." data-testid="input-addon-notes" />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold gap-1.5 text-xs" onClick={() => approveAddonMutation.mutate({ id: addonDialogOpen.id, status: 'active', adminNotes: addonNotes })} disabled={approveAddonMutation.isPending} data-testid="button-approve-addon">
                  <CheckCircle2 className="w-4 h-4" /> قبول وتفعيل
                </Button>
                <Button variant="outline" className="flex-1 text-red-500 border-red-200 hover:bg-red-50 font-bold gap-1.5 text-xs" onClick={() => approveAddonMutation.mutate({ id: addonDialogOpen.id, status: 'rejected', adminNotes: addonNotes })} disabled={approveAddonMutation.isPending} data-testid="button-reject-addon">
                  <XCircle className="w-4 h-4" /> رفض
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
