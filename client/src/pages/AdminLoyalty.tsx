// @ts-nocheck
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Star, Gift, Settings, Plus, Minus, Search, TrendingUp, Users } from "lucide-react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

export default function AdminLoyalty() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"accounts" | "config">("accounts");
  const [search, setSearch] = useState("");
  const [adjustDialog, setAdjustDialog] = useState<any>(null);
  const [adjustForm, setAdjustForm] = useState({ points: "", reason: "", type: "adjusted" });
  const [config, setConfig] = useState<any>(null);

  const { data: accounts = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/loyalty/accounts"] });
  const { data: configData, isLoading: configLoading } = useQuery<any>({ queryKey: ["/api/admin/loyalty/config"] });

  useEffect(() => { if (configData && !config) setConfig(configData); }, [configData]);

  const adjustMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/loyalty/adjust", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/loyalty/accounts"] }); setAdjustDialog(null); setAdjustForm({ points: "", reason: "", type: "adjusted" }); toast({ title: "تم تعديل النقاط" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const saveConfigMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", "/api/admin/loyalty/config", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/loyalty/config"] }); toast({ title: "تم حفظ الإعدادات" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const filtered = accounts.filter(a => !search || a.client?.fullName?.includes(search) || a.client?.email?.includes(search));
  const totalPoints = accounts.reduce((s: number, a: any) => s + (a.points || 0), 0);
  const totalEarned = accounts.reduce((s: number, a: any) => s + (a.totalEarned || 0), 0);

  const currentConfig = config || configData || { pointsPerSAR: 1, minRedeemPoints: 100, sarPerPoint: 0.1, isEnabled: true, expiryDays: 365 };

  return (
    <div className="p-6 space-y-6 font-sans" dir="rtl">
      <PageGraphics />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">نظام نقاط الولاء</h1>
          <p className="text-black/50 text-sm">إدارة نقاط العملاء ومكافآت الولاء</p>
        </div>
        <div className="flex gap-2">
          <Button variant={activeTab === "accounts" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("accounts")} className={activeTab === "accounts" ? "bg-black text-white" : "border-black/20"} data-testid="button-tab-accounts">
            حسابات العملاء
          </Button>
          <Button variant={activeTab === "config" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("config")} className={activeTab === "config" ? "bg-black text-white" : "border-black/20"} data-testid="button-tab-config">
            <Settings className="w-3.5 h-3.5 ml-1" /> الإعدادات
          </Button>
        </div>
      </div>

      {activeTab === "accounts" && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-black/10"><CardContent className="p-4 text-center"><Star className="w-6 h-6 text-amber-500 mx-auto mb-1" /><div className="text-2xl font-bold">{totalPoints.toLocaleString()}</div><div className="text-xs text-black/50">إجمالي النقاط النشطة</div></CardContent></Card>
            <Card className="border-black/10"><CardContent className="p-4 text-center"><TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-1" /><div className="text-2xl font-bold text-green-600">{totalEarned.toLocaleString()}</div><div className="text-xs text-black/50">إجمالي النقاط المكتسبة</div></CardContent></Card>
            <Card className="border-black/10"><CardContent className="p-4 text-center"><Users className="w-6 h-6 text-blue-500 mx-auto mb-1" /><div className="text-2xl font-bold text-blue-600">{accounts.length}</div><div className="text-xs text-black/50">عملاء في البرنامج</div></CardContent></Card>
          </div>

          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو البريد..." className="pr-9 border-black/20" data-testid="input-search-loyalty" />
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-black/30">جاري التحميل...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-black/30"><Gift className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>لا يوجد عملاء في برنامج الولاء</p></div>
          ) : (
            <div className="space-y-3">
              {filtered.map((account: any, idx: number) => (
                <Card key={account.id} className="border-black/10 hover:border-black/20 transition-all" data-testid={`card-loyalty-${account.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-sm">
                          {account.client?.fullName?.[0] || "؟"}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{account.client?.fullName || "عميل"}</div>
                          <div className="text-xs text-black/40">{account.client?.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-lg font-bold text-amber-600">{(account.points || 0).toLocaleString()}</div>
                          <div className="text-xs text-black/40">النقاط الحالية</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-green-600">+{(account.totalEarned || 0).toLocaleString()}</div>
                          <div className="text-xs text-black/40">مكتسبة</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-red-500">-{(account.totalRedeemed || 0).toLocaleString()}</div>
                          <div className="text-xs text-black/40">مستردة</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-black/30">{account.txCount || 0} معاملة</div>
                        </div>
                        <Button size="sm" variant="outline" className="border-black/20" onClick={() => setAdjustDialog(account)} data-testid={`button-adjust-loyalty-${account.id}`}>
                          <Settings className="w-3.5 h-3.5 ml-1" /> تعديل
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "config" && (
        <div className="max-w-lg space-y-5">
          <Card className="border-black/10">
            <CardHeader><CardTitle className="text-base">إعدادات برنامج الولاء</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">تفعيل البرنامج</div>
                  <div className="text-xs text-black/40">يسمح للعملاء بكسب واسترداد النقاط</div>
                </div>
                <Switch checked={!!currentConfig.isEnabled} onCheckedChange={v => setConfig((c: any) => ({ ...currentConfig, ...c, isEnabled: v }))} data-testid="switch-loyalty-enabled" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">نقاط لكل ريال</label>
                  <Input type="number" step="0.1" value={currentConfig.pointsPerSAR} onChange={e => setConfig((c: any) => ({ ...currentConfig, ...c, pointsPerSAR: Number(e.target.value) }))} className="border-black/20" data-testid="input-points-per-sar" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">قيمة النقطة (ريال)</label>
                  <Input type="number" step="0.01" value={currentConfig.sarPerPoint} onChange={e => setConfig((c: any) => ({ ...currentConfig, ...c, sarPerPoint: Number(e.target.value) }))} className="border-black/20" data-testid="input-sar-per-point" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">حد الاسترداد الأدنى</label>
                  <Input type="number" value={currentConfig.minRedeemPoints} onChange={e => setConfig((c: any) => ({ ...currentConfig, ...c, minRedeemPoints: Number(e.target.value) }))} className="border-black/20" data-testid="input-min-redeem" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">انتهاء الصلاحية (يوم)</label>
                  <Input type="number" value={currentConfig.expiryDays} onChange={e => setConfig((c: any) => ({ ...currentConfig, ...c, expiryDays: Number(e.target.value) }))} className="border-black/20" data-testid="input-expiry-days" />
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                <strong>مثال:</strong> عميل يدفع 1000 ريال = {currentConfig.pointsPerSAR * 1000} نقطة = {(currentConfig.pointsPerSAR * 1000 * currentConfig.sarPerPoint).toFixed(2)} ريال خصم
              </div>
              <Button onClick={() => saveConfigMutation.mutate(currentConfig)} disabled={saveConfigMutation.isPending} className="w-full bg-black text-white hover:bg-black/80" data-testid="button-save-config">
                {saveConfigMutation.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={!!adjustDialog} onOpenChange={() => setAdjustDialog(null)}>
        <DialogContent className="sm:max-w-sm font-sans" dir="rtl">
          <DialogHeader><DialogTitle>تعديل نقاط {adjustDialog?.client?.fullName}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="text-center py-3 bg-amber-50 rounded-xl">
              <div className="text-2xl font-bold text-amber-600">{(adjustDialog?.points || 0).toLocaleString()}</div>
              <div className="text-xs text-black/40">الرصيد الحالي</div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">نوع التعديل</label>
              <Select value={adjustForm.type} onValueChange={v => setAdjustForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="border-black/20" data-testid="select-adjust-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="adjusted">تعديل يدوي</SelectItem>
                  <SelectItem value="earned">إضافة نقاط</SelectItem>
                  <SelectItem value="redeemed">خصم نقاط</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">عدد النقاط (سالب للخصم)</label>
              <Input type="number" value={adjustForm.points} onChange={e => setAdjustForm(f => ({ ...f, points: e.target.value }))} placeholder="مثال: 50 أو -50" className="border-black/20" data-testid="input-adjust-points" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">السبب</label>
              <Input value={adjustForm.reason} onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value }))} placeholder="سبب التعديل..." className="border-black/20" data-testid="input-adjust-reason" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAdjustDialog(null)}>إلغاء</Button>
              <Button onClick={() => adjustMutation.mutate({ clientId: adjustDialog.clientId || adjustDialog.id, points: Number(adjustForm.points), reason: adjustForm.reason, type: adjustForm.type })} disabled={adjustMutation.isPending || !adjustForm.points} className="bg-black text-white hover:bg-black/80" data-testid="button-save-adjust">
                {adjustMutation.isPending ? "جاري الحفظ..." : "تعديل"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
