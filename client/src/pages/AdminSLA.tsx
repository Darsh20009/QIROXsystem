
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Clock, AlertTriangle, CheckCircle, Plus, Settings, Trash2, ShieldAlert, Timer } from "lucide-react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

function getPriorityMap(L: boolean): Record<string, { label: string; color: string }> { return {
  low: { label: L ? "منخفضة" : "Low", color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border-black/10 dark:border-white/10" },
  medium: { label: L ? "متوسطة" : "Medium", color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border-black/10 dark:border-white/10" },
  high: { label: L ? "عالية" : "High", color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border-black/10 dark:border-white/10" },
  critical: { label: L ? "حرجة" : "Critical", color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border-black/10 dark:border-white/10" },
};
}

function HoursBar({ hoursElapsed, slaHours = 48, L = true }: { hoursElapsed: number; slaHours?: number; L?: boolean }) {
  const pct = Math.min(100, Math.round((hoursElapsed / slaHours) * 100));
  const color = pct >= 100 ? "bg-black dark:bg-white" : pct >= 80 ? "bg-black/[0.08] dark:bg-white/[0.1]" : pct >= 50 ? "bg-black/[0.08] dark:bg-white/[0.1]" : "bg-black dark:bg-white";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-black/40">
        <span>{hoursElapsed}{L ? "س" : "h"} {L ? "مضت" : "elapsed"}</span>
        <span>{slaHours}{L ? "س" : "h"} SLA</span>
      </div>
      <div className="h-2 bg-black/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AdminSLA() {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const PRIORITY_MAP = getPriorityMap(L);
  const [activeTab, setActiveTab] = useState<"dashboard" | "config">("dashboard");
  const [configDialog, setConfigDialog] = useState(false);
  const [form, setForm] = useState({ name: "", responseHours: "24", resolutionHours: "72", priority: "medium", isDefault: false });

  const { data: slaData, isLoading } = useQuery<any>({ queryKey: ["/api/admin/sla/dashboard"], refetchInterval: 60000 });
  const { data: configs = [], isLoading: configsLoading } = useQuery<any[]>({ queryKey: ["/api/admin/sla/config"] });

  const createConfigMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/sla/config", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/sla/config"] }); setConfigDialog(false); setForm({ name: "", responseHours: "24", resolutionHours: "72", priority: "medium", isDefault: false }); toast({ title: L ? "تم إنشاء الإعداد" : "Config created" }); },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const deleteConfigMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/sla/config/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/sla/config"] }); toast({ title: L ? "تم الحذف" : "Deleted" }); },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const stats = slaData?.stats || { total: 0, overdueCount: 0, atRiskCount: 0, onTrackCount: 0 };

  return (
    <div className="p-6 space-y-6 font-sans" dir={dir}>
      <PageGraphics />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">{L ? "SLA وتتبع الأداء" : "SLA & Performance Tracking"}</h1>
          <p className="text-black/50 text-sm">{L ? "مراقبة اتفاقيات مستوى الخدمة وأوقات الاستجابة" : "Monitor service level agreements and response times"}</p>
        </div>
        <div className="flex gap-2">
          <Button variant={activeTab === "dashboard" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("dashboard")} className={activeTab === "dashboard" ? "bg-black text-white" : "border-black/20"} data-testid="button-tab-dashboard">
            {L ? "لوحة المتابعة" : "Dashboard"}
          </Button>
          <Button variant={activeTab === "config" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("config")} className={activeTab === "config" ? "bg-black text-white" : "border-black/20"} data-testid="button-tab-config">
            <Settings className="w-3.5 h-3.5 ml-1" /> {L ? "الإعدادات" : "Settings"}
          </Button>
        </div>
      </div>

      {activeTab === "dashboard" && (
        <>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: L ? "الطلبات النشطة" : "Active Requests", value: stats.total, color: "text-black", bg: "bg-black/5", icon: Timer },
              { label: L ? "متأخرة (SLA منتهي)" : "Overdue (SLA expired)", value: stats.overdueCount, color: "text-black dark:text-white", bg: "bg-black/[0.04] dark:bg-white/[0.06]", icon: ShieldAlert },
              { label: L ? "في خطر (< 12 ساعة)" : "At Risk (< 12h)", value: stats.atRiskCount, color: "text-black dark:text-white", bg: "bg-black/[0.04] dark:bg-white/[0.06]", icon: AlertTriangle },
              { label: L ? "في الوقت المناسب" : "On Track", value: stats.onTrackCount, color: "text-black dark:text-white", bg: "bg-black/[0.04] dark:bg-white/[0.06]", icon: CheckCircle },
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
            <div className="text-center py-12 text-black/30">{L ? "جاري التحميل..." : "Loading..."}</div>
          ) : (
            <div className="space-y-4">
              {slaData?.overdue?.length > 0 && (
                <div>
                  <h2 className="font-semibold text-sm text-black dark:text-white mb-3 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> {L ? "طلبات متأخرة" : "Overdue Requests"} ({slaData.overdue.length})</h2>
                  <div className="space-y-3">
                    {slaData.overdue.map((order: any) => (
                      <Card key={order.id} className="border-black/10 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.06]" data-testid={`card-sla-overdue-${order.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold text-sm">{order.serviceTitle || order.title || (L ? "طلب" : "Request")}</div>
                                <Badge className="bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border border-black/10 dark:border-white/10 text-xs">{L ? `متأخر بـ ${Math.abs(order.hoursRemaining)} ساعة` : `${Math.abs(order.hoursRemaining)}h overdue`}</Badge>
                              </div>
                              <div className="text-xs text-black/40 mt-0.5">{order.client?.fullName} · {order.client?.email}</div>
                              <div className="mt-2"><HoursBar hoursElapsed={order.hoursElapsed} L={L} /></div>
                            </div>
                            <div className="text-right text-xs text-black/40">
                              <div>{new Date(order.createdAt).toLocaleDateString(L ? "ar-SA" : "en-US")}</div>
                              <div className="font-medium text-black dark:text-white">{L ? "تجاوز الـ SLA" : "SLA breached"}</div>
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
                  <h2 className="font-semibold text-sm text-black dark:text-white mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {L ? "في خطر" : "At Risk"} ({slaData.atRisk.length})</h2>
                  <div className="space-y-3">
                    {slaData.atRisk.map((order: any) => (
                      <Card key={order.id} className="border-black/10 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.06]" data-testid={`card-sla-atrisk-${order.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold text-sm">{order.serviceTitle || order.title || (L ? "طلب" : "Request")}</div>
                                <Badge className="bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border border-black/10 dark:border-white/10 text-xs">{L ? `متبقي ${order.hoursRemaining} ساعة` : `${order.hoursRemaining}h remaining`}</Badge>
                              </div>
                              <div className="text-xs text-black/40 mt-0.5">{order.client?.fullName} · {order.client?.email}</div>
                              <div className="mt-2"><HoursBar hoursElapsed={order.hoursElapsed} L={L} /></div>
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
                  <h2 className="font-semibold text-sm text-black dark:text-white mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {L ? "في الوقت المناسب" : "On Track"} ({slaData.onTrack.length})</h2>
                  <div className="space-y-2">
                    {slaData.onTrack.slice(0, 10).map((order: any) => (
                      <Card key={order.id} className="border-black/10" data-testid={`card-sla-ontrack-${order.id}`}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{order.serviceTitle || order.title || (L ? "طلب" : "Request")}</div>
                              <div className="text-xs text-black/40">{order.client?.fullName}</div>
                              <div className="mt-2"><HoursBar hoursElapsed={order.hoursElapsed} L={L} /></div>
                            </div>
                            <div className="text-xs text-black dark:text-white font-medium">{L ? `${order.hoursRemaining} ساعة متبقية` : `${order.hoursRemaining}h remaining`}</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {slaData.onTrack.length > 10 && <p className="text-xs text-black/30 text-center">+{slaData.onTrack.length - 10} {L ? "طلبات أخرى" : "more requests"}</p>}
                  </div>
                </div>
              )}

              {!slaData?.orders?.length && (
                <div className="text-center py-16 text-black/30"><Clock className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>{L ? "لا توجد طلبات نشطة" : "No active requests"}</p></div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === "config" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold">{L ? "إعدادات SLA" : "SLA Settings"}</h2>
            <Button onClick={() => setConfigDialog(true)} className="bg-black text-white hover:bg-black/80 gap-2" size="sm" data-testid="button-add-sla-config">
              <Plus className="w-4 h-4" /> {L ? "إضافة إعداد" : "Add Config"}
            </Button>
          </div>
          {configsLoading ? (
            <div className="text-center py-8 text-black/30">{L ? "جاري التحميل..." : "Loading..."}</div>
          ) : configs.length === 0 ? (
            <div className="text-center py-12 text-black/30"><Settings className="w-10 h-10 mx-auto mb-2 opacity-20" /><p>{L ? "لا توجد إعدادات SLA بعد" : "No SLA configs yet"}</p></div>
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
                            <span>{L ? "استجابة" : "Response"}: {c.responseHours}{L ? "س" : "h"}</span>
                            <span>·</span>
                            <span>{L ? "حل" : "Resolution"}: {c.resolutionHours}{L ? "س" : "h"}</span>
                            {c.isDefault && <Badge className="bg-black/10 text-black/60 text-xs">{L ? "افتراضي" : "Default"}</Badge>}
                          </div>
                        </div>
                        <Badge className={`${(PRIORITY_MAP[c.priority] || PRIORITY_MAP.medium).color} border text-xs`}>{(PRIORITY_MAP[c.priority] || PRIORITY_MAP.medium).label}</Badge>
                      </div>
                      <Button size="sm" variant="outline" className="border-black/10 dark:border-white/10 text-black dark:text-white" onClick={() => { if (confirm(L ? "حذف هذا الإعداد؟" : "Delete this config?")) deleteConfigMutation.mutate(c.id); }} data-testid={`button-delete-sla-${c.id}`}>
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
        <DialogContent className="sm:max-w-md font-sans" dir={dir}>
          <DialogHeader><DialogTitle>{L ? "إضافة إعداد SLA" : "Add SLA Config"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">{L ? "اسم الإعداد" : "Config Name"}</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={L ? "مثال: طلبات عاجلة" : "e.g. Urgent Requests"} className="border-black/20" data-testid="input-sla-name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">{L ? "وقت الاستجابة (ساعة)" : "Response Time (hours)"}</label>
                <Input type="number" value={form.responseHours} onChange={e => setForm(f => ({ ...f, responseHours: e.target.value }))} className="border-black/20" data-testid="input-response-hours" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{L ? "وقت الحل (ساعة)" : "Resolution Time (hours)"}</label>
                <Input type="number" value={form.resolutionHours} onChange={e => setForm(f => ({ ...f, resolutionHours: e.target.value }))} className="border-black/20" data-testid="input-resolution-hours" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{L ? "الأولوية" : "Priority"}</label>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger className="border-black/20" data-testid="select-priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{L ? "منخفضة" : "Low"}</SelectItem>
                  <SelectItem value="medium">{L ? "متوسطة" : "Medium"}</SelectItem>
                  <SelectItem value="high">{L ? "عالية" : "High"}</SelectItem>
                  <SelectItem value="critical">{L ? "حرجة" : "Critical"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setConfigDialog(false)}>{L ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={() => createConfigMutation.mutate({ ...form, responseHours: Number(form.responseHours), resolutionHours: Number(form.resolutionHours) })} disabled={createConfigMutation.isPending || !form.name} className="bg-black text-white hover:bg-black/80" data-testid="button-save-sla-config">
                {createConfigMutation.isPending ? (L ? "جاري الحفظ..." : "Saving...") : (L ? "إضافة" : "Add")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
