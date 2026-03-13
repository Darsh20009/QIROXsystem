// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Star, Gift, TrendingUp, ArrowDown, ArrowUp, Clock, CheckCircle } from "lucide-react";

const TX_ICONS: Record<string, any> = { earned: ArrowUp, redeemed: ArrowDown, adjusted: Clock, expired: Clock };
const TX_COLORS: Record<string, string> = { earned: "text-green-600", redeemed: "text-red-500", adjusted: "text-blue-600", expired: "text-black/30" };
const TX_LABELS: Record<string, string> = { earned: "نقاط مكتسبة", redeemed: "نقاط مستردة", adjusted: "تعديل", expired: "منتهية" };

export default function ClientLoyalty() {
  const { toast } = useToast();
  const [redeemDialog, setRedeemDialog] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState("");

  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/loyalty/my"] });

  const redeemMutation = useMutation({
    mutationFn: (pts: number) => apiRequest("POST", "/api/loyalty/redeem", { points: pts }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty/my"] });
      setRedeemDialog(false); setRedeemPoints("");
      toast({ title: `تم استرداد ${redeemPoints} نقطة بخصم ${res.discount} ريال بنجاح!` });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="text-center py-16 text-black/30 font-sans">جاري التحميل...</div>;

  const account = data?.account || { points: 0, totalEarned: 0, totalRedeemed: 0 };
  const transactions = data?.transactions || [];
  const config = data?.config || { pointsPerSAR: 1, minRedeemPoints: 100, sarPerPoint: 0.1, isEnabled: true };
  const discountValue = redeemPoints ? (Number(redeemPoints) * config.sarPerPoint).toFixed(2) : "0";

  return (
    <div className="p-6 space-y-6 font-sans max-w-2xl mx-auto" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-black">نقاط الولاء</h1>
        <p className="text-black/50 text-sm">اكسب نقاطاً مع كل طلب واستردّها كخصومات</p>
      </div>

      {!config.isEnabled && (
        <Card className="border-black/10 bg-black/5"><CardContent className="p-4 text-center text-black/40 text-sm">برنامج الولاء غير متاح حالياً</CardContent></Card>
      )}

      <Card className="border-black/10 bg-gradient-to-br from-amber-50 to-orange-50" data-testid="card-loyalty-balance">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                <Star className="w-8 h-8 text-amber-500 fill-amber-400" />
              </div>
            </div>
            <div className="text-4xl font-bold text-amber-600 mb-1">{(account.points || 0).toLocaleString()}</div>
            <div className="text-black/50 text-sm mb-4">نقطة متاحة</div>
            <div className="text-xs text-black/40 mb-4">
              تساوي <strong className="text-black/60">{(account.points * config.sarPerPoint).toFixed(2)} ريال</strong> خصم على طلبك القادم
            </div>
            {config.isEnabled && account.points >= config.minRedeemPoints && (
              <Button onClick={() => setRedeemDialog(true)} className="bg-amber-500 hover:bg-amber-600 text-white gap-2" data-testid="button-open-redeem">
                <Gift className="w-4 h-4" /> استرداد النقاط
              </Button>
            )}
            {config.isEnabled && account.points < config.minRedeemPoints && (
              <div className="text-xs text-black/40 bg-black/5 rounded-full px-4 py-2 inline-block">
                تحتاج {config.minRedeemPoints - account.points} نقطة إضافية للاسترداد
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-black/10">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <div className="text-xl font-bold text-green-600">{(account.totalEarned || 0).toLocaleString()}</div>
            <div className="text-xs text-black/40">إجمالي المكتسبة</div>
          </CardContent>
        </Card>
        <Card className="border-black/10">
          <CardContent className="p-4 text-center">
            <Gift className="w-5 h-5 text-purple-500 mx-auto mb-1" />
            <div className="text-xl font-bold text-purple-600">{(account.totalRedeemed || 0).toLocaleString()}</div>
            <div className="text-xs text-black/40">إجمالي المستردة</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-black/10">
        <CardHeader><CardTitle className="text-sm">كيف تكسب النقاط؟</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex items-center gap-3 p-3 bg-black/5 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div>
                <div className="font-medium">إتمام الطلبات</div>
                <div className="text-xs text-black/40">احصل على {config.pointsPerSAR} نقطة لكل ريال تدفعه</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
              <Star className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div>
                <div className="font-medium">استرداد النقاط</div>
                <div className="text-xs text-black/40">استرد {config.minRedeemPoints} نقطة كحد أدنى · كل نقطة = {config.sarPerPoint} ريال خصم</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {transactions.length > 0 && (
        <Card className="border-black/10">
          <CardHeader><CardTitle className="text-sm">سجل المعاملات</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {transactions.map((tx: any) => {
              const Icon = TX_ICONS[tx.type] || Clock;
              return (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-black/5 last:border-0" data-testid={`tx-${tx.id}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full bg-black/5 flex items-center justify-center ${TX_COLORS[tx.type]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{TX_LABELS[tx.type] || "معاملة"}</div>
                      {tx.reason && <div className="text-xs text-black/40">{tx.reason}</div>}
                      <div className="text-xs text-black/30">{new Date(tx.createdAt).toLocaleDateString("ar-SA")}</div>
                    </div>
                  </div>
                  <div className={`font-bold ${tx.points > 0 ? "text-green-600" : "text-red-500"}`}>
                    {tx.points > 0 ? "+" : ""}{tx.points.toLocaleString()} نقطة
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Dialog open={redeemDialog} onOpenChange={setRedeemDialog}>
        <DialogContent className="sm:max-w-sm font-sans" dir="rtl">
          <DialogHeader><DialogTitle>استرداد النقاط</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="text-center bg-amber-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-amber-600">{(account.points || 0).toLocaleString()}</div>
              <div className="text-xs text-black/40">نقطة متاحة</div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">عدد النقاط للاسترداد</label>
              <Input type="number" value={redeemPoints} onChange={e => setRedeemPoints(e.target.value)} placeholder={`الحد الأدنى: ${config.minRedeemPoints}`} max={account.points} className="border-black/20" data-testid="input-redeem-points" />
            </div>
            {redeemPoints && Number(redeemPoints) >= config.minRedeemPoints && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                <div className="text-sm text-green-700">ستحصل على خصم</div>
                <div className="text-2xl font-bold text-green-600">{discountValue} ريال</div>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setRedeemDialog(false)} className="flex-1">إلغاء</Button>
              <Button onClick={() => redeemMutation.mutate(Number(redeemPoints))} disabled={redeemMutation.isPending || !redeemPoints || Number(redeemPoints) < config.minRedeemPoints || Number(redeemPoints) > account.points} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white" data-testid="button-confirm-redeem">
                {redeemMutation.isPending ? "جاري المعالجة..." : "استرداد"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
