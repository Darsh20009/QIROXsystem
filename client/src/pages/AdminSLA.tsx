// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Clock, AlertTriangle, CheckCircle, Plus, Settings, Trash2, ShieldAlert, Timer } from "lucide-react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  low: { label: "منخفضة", color: "bg-blue-100 text-blue-700 border-blue-200" },
  medium: { label: "متوسطة", color: "bg-amber-100 text-amber-700 border-amber-200" },
  high: { label: "عالية", color: "bg-orange-100 text-orange-700 border-orange-200" },
  critical: { label: "حرجة", color: "bg-red-100 text-red-700 border-red-200" },
};

function HoursBar({ hoursElapsed, slaHours = 48 }: { hoursElapsed: number; slaHours?: number }) {
  const pct = Math.min(100, Math.round((hoursElapsed / slaHours) * 100));
  const color = pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-orange-400" : pct >= 50 ? "bg-amber-400" : "bg-green-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-black/40">
        <span>{hoursElapsed}س مضت</span>
        <span>{slaHours}س SLA</span>
      </div>
      <div className="h-2 bg-black/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AdminSLA() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"dashboard" | "config">("dashboard");
  const [configDialog, setConfigDialog] = useState(false);
  const [form, setForm] = useState({ name: "", responseHours: "24", resolutionHours: "72", priority: "medium", isDefault: false });

  const { data: slaData, isLoading } = useQuery<any>({ queryKey: ["/api/admin/sla/dashboard"], refetchInterval: 60000 });
  const { data: configs = [], isLoading: configsLoading } = useQuery<any[]>({ queryKey: ["/api/admin/sla/config"] });

  const createConfigMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/sla/config", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/sla/config"] }); setConfigDialog(false); setForm({ name: "", responseHours: "24", resolutionHours: "72", priority: "medium", isDefault: false }); toast({ title: "تم إنشاء الإعداد" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const deleteConfigMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/sla/config/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/sla/config"] }); toast({ title: "تم الحذف" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const stats = slaData?.stats || { total: 0, overdueCount: 0, atRiskCount: 0, onTrackCount: 0 };

  return (
    <div className="p-6 space-y-6 font-sans" dir="rtl">
      <PageGraphics />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">SLA وتتبع الأداء</h1>
          <p className="text-black/50 text-sm">مراقبة اتفاقيات مستوى الخدمة وأوقات الاستجابة</p>
        </div>
        <div className="flex gap-2">
          <Button variant={activeTab === "dashboard" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("dashboard")} className={activeTab === "dashboard" ? "bg-black text-white" : "border-black/20"} data-testid="button-tab-dashboard">
            لوحة المتابعة
          </Button>
          <Button variant={activeTab === "config" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("config")} className={activeTab === "config" ? "bg-black text-white" : "border-black/20"} data-testid="button-tab-config">
            <Settings className="w-3.5 h-3.5 ml-1" /> الإعدادات
          </Button>
        </div>
      </div>

      {activeTab === "dashboard" && (
        <>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "الطلبات النشطة", value: stats.total, color: "text-black", bg: "bg-black/5", icon: Timer },
              { label: "متأخرة (SLA منتهي)", value: stats.overdueCount, color: "text-red-600", bg: "bg-red-50", icon: ShieldAlert },
              { label: "في خطر (< 12 ساعة)", value: stats.atRiskCount, color: "text-orange-600", bg: "bg-orange-50", icon: AlertTriangle },
              { label: "في الوقت المناسب", value: stats.onTrackCount, color: "text-green-600", bg: "bg-green-50", icon: CheckCircle },
            ].map((s, i) => (
              <Card key={i} className={`border-black/10 ${s.bg}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-black/50 mt-0.5">{s.label}</div>
                    </div>
                    <s.icon className={`w-8 h-8 ${s.color} opacity-30`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-black/30">جاري التحميل...</div>
          ) : (
            <div className="space-y-4">
              {slaData?.overdue?.length > 0 && (
                <div>
                  <h2 className="font-semibold text-sm text-red-600 mb-3 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> طلبات متأخرة ({slaData.overdue.length})</h2>
                  <div className="space-y-3">
                    {slaData.overdue.map((order: any) => (
                      <Card key={order.id} className="border-red-200 bg-red-50/50" data-testid={`card-sla-overdue-${order.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold text-sm">{order.serviceTitle || order.title || "طلب"}</div>
                                <Badge className="bg-red-100 text-red-700 border border-red-200 text-xs">متأخر بـ {Math.abs(order.hoursRemaining)} ساعة</Badge>
                              </div>
                              <div className="text-xs text-black/40 mt-0.5">{order.client?.fullName} · {order.client?.email}</div>
                              <div className="mt-2"><HoursBar hoursElapsed={order.hoursElapsed} /></div>
                            </div>
                            <div className="text-right text-xs text-black/40">
                              <div>{new Date(order.createdAt).toLocaleDateString("ar-SA")}</div>
                              <div className="font-medium text-red-500">تجاوز الـ SLA</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {slaData?.atRisk?.length > 0 && (
                <div>
                  <h2 className="font-semibold text-sm text-orange-600 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> في خطر ({slaData.atRisk.length})</h2>
                  <div className="space-y-3">
                    {slaData.atRisk.map((order: any) => (
                      <Card key={order.id} className="border-orange-200 bg-orange-50/30" data-testid={`card-sla-atrisk-${order.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold text-sm">{order.serviceTitle || order.title || "طلب"}</div>
                                <Badge className="bg-orange-100 text-orange-700 border border-orange-200 text-xs">متبقي {order.hoursRemaining} ساعة</Badge>
                              </div>
                              <div className="text-xs text-black/40 mt-0.5">{order.client?.fullName} · {order.client?.email}</div>
                              <div className="mt-2"><HoursBar hoursElapsed={order.hoursElapsed} /></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {slaData?.onTrack?.length > 0 && (
                <div>
                  <h2 className="font-semibold text-sm text-green-600 mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> في الوقت المناسب ({slaData.onTrack.length})</h2>
                  <div className="space-y-2">
                    {slaData.onTrack.slice(0, 10).map((order: any) => (
                      <Card key={order.id} className="border-black/10" data-testid={`card-sla-ontrack-${order.id}`}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{order.serviceTitle || order.title || "طلب"}</div>
                              <div className="text-xs text-black/40">{order.client?.fullName}</div>
                              <div className="mt-2"><HoursBar hoursElapsed={order.hoursElapsed} /></div>
                            </div>
                            <div className="text-xs text-green-600 font-medium">{order.hoursRemaining} ساعة متبقية</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {slaData.onTrack.length > 10 && <p className="text-xs text-black/30 text-center">+{slaData.onTrack.length - 10} طلبات أخرى</p>}
                  </div>
                </div>
              )}

              {!slaData?.orders?.length && (
                <div className="text-center py-16 text-black/30"><Clock className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>لا توجد طلبات نشطة</p></div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === "config" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold">إعدادات SLA</h2>
            <Button onClick={() => setConfigDialog(true)} className="bg-black text-white hover:bg-black/80 gap-2" size="sm" data-testid="button-add-sla-config">
              <Plus className="w-4 h-4" /> إضافة إعداد
            </Button>
          </div>
          {configsLoading ? (
            <div className="text-center py-8 text-black/30">جاري التحميل...</div>
          ) : configs.length === 0 ? (
            <div className="text-center py-12 text-black/30"><Settings className="w-10 h-10 mx-auto mb-2 opacity-20" /><p>لا توجد إعدادات SLA بعد</p></div>
          ) : (
            <div className="space-y-3">
              {configs.map((c: any) => (
                <Card key={c.id} className="border-black/10" data-testid={`card-sla-config-${c.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-semibold text-sm">{c.name}</div>
                          <div className="flex gap-2 mt-1 text-xs text-black/40">
                            <span>استجابة: {c.responseHours}س</span>
                            <span>·</span>
                            <span>حل: {c.resolutionHours}س</span>
                            {c.isDefault && <Badge className="bg-black/10 text-black/60 text-xs">افتراضي</Badge>}
                          </div>
                        </div>
                        <Badge className={`${(PRIORITY_MAP[c.priority] || PRIORITY_MAP.medium).color} border text-xs`}>{(PRIORITY_MAP[c.priority] || PRIORITY_MAP.medium).label}</Badge>
                      </div>
                      <Button size="sm" variant="outline" className="border-red-200 text-red-500" onClick={() => { if (confirm("حذف هذا الإعداد؟")) deleteConfigMutation.mutate(c.id); }} data-testid={`button-delete-sla-${c.id}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={configDialog} onOpenChange={setConfigDialog}>
        <DialogContent className="sm:max-w-md font-sans" dir="rtl">
          <DialogHeader><DialogTitle>إضافة إعداد SLA</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">اسم الإعداد</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: طلبات عاجلة" className="border-black/20" data-testid="input-sla-name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">وقت الاستجابة (ساعة)</label>
                <Input type="number" value={form.responseHours} onChange={e => setForm(f => ({ ...f, responseHours: e.target.value }))} className="border-black/20" data-testid="input-response-hours" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">وقت الحل (ساعة)</label>
                <Input type="number" value={form.resolutionHours} onChange={e => setForm(f => ({ ...f, resolutionHours: e.target.value }))} className="border-black/20" data-testid="input-resolution-hours" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">الأولوية</label>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger className="border-black/20" data-testid="select-priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">منخفضة</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                  <SelectItem value="critical">حرجة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setConfigDialog(false)}>إلغاء</Button>
              <Button onClick={() => createConfigMutation.mutate({ ...form, responseHours: Number(form.responseHours), resolutionHours: Number(form.resolutionHours) })} disabled={createConfigMutation.isPending || !form.name} className="bg-black text-white hover:bg-black/80" data-testid="button-save-sla-config">
                {createConfigMutation.isPending ? "جاري الحفظ..." : "إضافة"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
