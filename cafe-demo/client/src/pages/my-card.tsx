import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Coffee, Gift, QrCode, ChevronRight, TrendingUp,
  ArrowDownRight, ArrowUpRight, Clock, Star, Crown, Award, Medal
} from "lucide-react";
import { useCustomer } from "@/contexts/CustomerContext";
import { useLocation } from "wouter";
import { CustomerLayout } from "@/components/layouts/CustomerLayout";
import SarIcon from "@/components/sar-icon";
import QRCodeLib from "qrcode";
import { useTranslate } from "@/lib/useTranslate";
import { useTranslation } from "react-i18next";

function getTierConfig(tier: string, tc: (ar: string, en: string) => string) {
  const configs = {
    bronze:   { label: tc("برونزي", "Bronze"),   color: "from-amber-600 to-amber-800",  badge: "bg-amber-600",  icon: Medal,  min: 0,    max: 499 },
    silver:   { label: tc("فضي", "Silver"),      color: "from-slate-400 to-slate-600",  badge: "bg-slate-500",  icon: Star,   min: 500,  max: 1999 },
    gold:     { label: tc("ذهبي", "Gold"),       color: "from-yellow-400 to-amber-600", badge: "bg-yellow-500", icon: Crown,  min: 2000, max: 4999 },
    platinum: { label: tc("بلاتيني", "Platinum"), color: "from-gray-300 to-gray-500",   badge: "bg-gray-400",   icon: Award,  min: 5000, max: Infinity },
  };
  return configs[tier as keyof typeof configs] || configs.bronze;
}

function getNextTier(tier: string): string | null {
  const order = ["bronze", "silver", "gold", "platinum"];
  const idx = order.indexOf(tier);
  return idx < order.length - 1 ? order[idx + 1] : null;
}

export default function MyCardPage() {
  const { customer } = useCustomer();
  const [, setLocation] = useLocation();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [showQr, setShowQr] = useState(false);
  const tc = useTranslate();
  const { i18n } = useTranslation();
  const dir = i18n.language === 'en' ? 'ltr' : 'rtl';

  const { data: loyaltyCards = [], isLoading: loadingCards } = useQuery<any[]>({
    queryKey: ["/api/customer/loyalty-cards"],
    enabled: !!customer,
  });

  const { data: transactions = [], isLoading: loadingTx } = useQuery<any[]>({
    queryKey: ["/api/customer/loyalty-transactions"],
    enabled: !!customer,
  });

  const { data: settings } = useQuery<any>({
    queryKey: ["/api/public/loyalty-settings"],
  });

  const card = loyaltyCards[0];
  const points = card?.points ?? 0;
  const stamps = card?.stamps ?? 0;
  const freeCupsEarned = card?.freeCupsEarned ?? 0;
  const freeCupsRedeemed = card?.freeCupsRedeemed ?? 0;
  const availableCups = Math.max(0, freeCupsEarned - freeCupsRedeemed);
  const tier = card?.tier ?? "bronze";
  const tierCfg = getTierConfig(tier, tc);
  const TierIcon = tierCfg.icon;
  const nextTier = getNextTier(tier);
  const nextTierCfg = nextTier ? getTierConfig(nextTier, tc) : null;
  const pointsValueInSar = settings?.pointsValueInSar ?? 0.05;
  const pointsForFreeDrink = settings?.pointsForFreeDrink ?? 500;
  const sarValue = (points * pointsValueInSar).toFixed(2);
  const progressToNext = nextTierCfg ? Math.min(100, Math.round(((points - tierCfg.min) / (nextTierCfg.min - tierCfg.min)) * 100)) : 100;

  useEffect(() => {
    const qrData = card?.qrToken || card?.cardNumber;
    if (!qrData) return;
    QRCodeLib.toDataURL(qrData, {
      width: 220, margin: 2,
      color: { dark: "#1a3a2a", light: "#ffffff" }
    }).then(setQrCodeUrl).catch(console.error);
  }, [card?.qrToken, card?.cardNumber]);

  if (!customer) {
    return (
      <CustomerLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8" dir={dir}>
          <Coffee className="w-16 h-16 text-primary opacity-40" />
          <p className="text-lg font-bold text-center">{tc("يجب تسجيل الدخول لعرض بطاقة الولاء", "Please log in to view your loyalty card")}</p>
          <Button onClick={() => setLocation("/auth")} data-testid="button-login">{tc("تسجيل الدخول", "Log In")}</Button>
        </div>
      </CustomerLayout>
    );
  }

  if (loadingCards) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center min-h-[60vh]" dir={dir}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">{tc("جاري تحميل بطاقتك...", "Loading your card...")}</p>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="container max-w-lg mx-auto px-4 py-6 pb-28 space-y-5" dir={dir}>

        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")} data-testid="button-back">
            <ChevronRight className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-black text-primary">{tc("بطاقة كوبي", "QOPY Card")}</h1>
        </div>

        {/* Main Card */}
        <div className={`relative rounded-3xl bg-gradient-to-br ${tierCfg.color} text-white shadow-2xl overflow-hidden`} data-testid="loyalty-card">
          <div className="absolute -top-12 -left-12 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-white/5 rounded-full" />

          <div className="relative z-10 p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs opacity-70 mb-0.5">{tc("بطاقة كوبي", "QOPY Card")}</p>
                <p className="font-black text-xl">{customer?.name || tc("عميل", "Customer")}</p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${tierCfg.badge} bg-opacity-80`}>
                <TierIcon className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">{tierCfg.label}</span>
              </div>
            </div>

            <div className="text-center py-2">
              <p className="text-xs opacity-70 mb-1">{tc("رصيد النقاط", "Points Balance")}</p>
              <p className="text-5xl font-black" data-testid="text-points">{points.toLocaleString()}</p>
              <p className="text-sm opacity-70 mt-1">= {sarValue} {tc("ريال قيمة خصم", "SAR discount value")}</p>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] opacity-60 mb-0.5">{tc("رقم البطاقة", "Card Number")}</p>
                <p className="font-mono text-sm tracking-widest opacity-90" data-testid="text-card-number">
                  {card?.cardNumber?.replace(/(.{4})/g, '$1 ')?.trim() || "**** **** ****"}
                </p>
              </div>
              {qrCodeUrl && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 border-none text-white gap-1.5 text-xs"
                  onClick={() => setShowQr(true)}
                  data-testid="button-show-qr"
                >
                  <QrCode className="w-4 h-4" />
                  {tc("رمز QR", "QR Code")}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stamps Card */}
        <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-4" data-testid="stamps-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coffee className="w-5 h-5 text-primary" />
              <span className="font-bold">{tc("طوابع المشروبات", "Drink Stamps")}</span>
            </div>
            {availableCups > 0 && (
              <Badge className="bg-green-500 text-white" data-testid="badge-free-cups">
                {availableCups} {tc("مجاني متاح", "free available")}
              </Badge>
            )}
          </div>

          <div className="flex gap-2 justify-center">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors ${
                  i < stamps
                    ? "bg-primary border-primary text-white"
                    : "border-muted-foreground/30 text-muted-foreground/30"
                }`}
                data-testid={`stamp-${i}`}
              >
                <Coffee className="w-5 h-5" />
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            {stamps === 0
              ? tc("ابدأ بجمع الطوابع مع كل طلب", "Start collecting stamps with each order")
              : stamps >= 6
              ? tc("🎉 تهانينا! لديك مشروب مجاني", "🎉 Congratulations! You have a free drink")
              : tc(`${6 - stamps} طوابع للحصول على مشروب مجاني`, `${6 - stamps} stamps until a free drink`)}
          </p>
        </div>

        {/* Tier Progress */}
        {nextTierCfg && (
          <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-3" data-testid="tier-progress">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="font-bold">{tc(`التقدم نحو ${nextTierCfg.label}`, `Progress to ${nextTierCfg.label}`)}</span>
            </div>
            <div className="space-y-2">
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${tierCfg.color} transition-all`}
                  style={{ width: `${progressToNext}%` }}
                  data-testid="tier-progress-bar"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{tierCfg.label}</span>
                <span>{progressToNext}%</span>
                <span>{nextTierCfg.label}</span>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {tc(
                  `تحتاج ${Math.max(0, nextTierCfg.min - points).toLocaleString()} نقطة للوصول إلى ${nextTierCfg.label}`,
                  `You need ${Math.max(0, nextTierCfg.min - points).toLocaleString()} more points to reach ${nextTierCfg.label}`
                )}
              </p>
            </div>
          </div>
        )}

        {/* How to earn */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-5 h-5 text-amber-600" />
            <span className="font-bold text-amber-900 dark:text-amber-200">{tc("كيفية كسب النقاط", "How to Earn Points")}</span>
          </div>
          <div className="space-y-2 text-sm text-amber-800 dark:text-amber-300">
            <p>• {settings?.pointsEarnedPerSar ?? 1} {tc("نقطة لكل ريال تنفقه", "point per SAR spent")}</p>
            <p>• {tc("طابع مجاني مع كل طلب", "Free stamp with every order")}</p>
            <p>• {tc("6 طوابع = مشروب مجاني", "6 stamps = free drink")}</p>
            <p>• {Math.round(1 / (settings?.pointsValueInSar ?? 0.05))} {tc("نقطة = ريال واحد خصم", "points = 1 SAR discount")}</p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="space-y-3" data-testid="transactions-section">
          <h3 className="font-bold text-lg">{tc("آخر العمليات", "Recent Transactions")}</h3>
          {loadingTx ? (
            <div className="text-center py-8 text-muted-foreground text-sm">{tc("جاري التحميل...", "Loading...")}</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Clock className="w-10 h-10 mx-auto text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground">{tc("لا توجد عمليات سابقة", "No transactions yet")}</p>
            </div>
          ) : (
            transactions.slice(0, 10).map((tx: any, i: number) => {
              const isEarn = tx.type === 'earn' || tx.type === 'transfer_in';
              const isRedeem = tx.type === 'redeem' || tx.type === 'transfer_out';
              return (
                <div
                  key={tx.id || i}
                  className="flex items-center justify-between bg-card rounded-xl border px-4 py-3"
                  data-testid={`transaction-${i}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      isEarn ? "bg-green-100 text-green-600 dark:bg-green-900/30" :
                      isRedeem ? "bg-red-100 text-red-600 dark:bg-red-900/30" :
                      "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                    }`}>
                      {isEarn ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {tx.descriptionAr || (isEarn ? tc("كسب نقاط", "Points Earned") : isRedeem ? tc("استرداد نقاط", "Points Redeemed") : tc("عملية", "Transaction"))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString(i18n.language === 'en' ? 'en-US' : "ar-SA") : ""}
                      </p>
                    </div>
                  </div>
                  {(tx.points !== undefined && tx.points !== 0) && (
                    <span className={`font-bold text-sm ${isEarn ? "text-green-600" : "text-red-600"}`}>
                      {isEarn ? "+" : "-"}{Math.abs(tx.points)}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQr} onOpenChange={setShowQr}>
        <DialogContent className="max-w-xs text-center" dir={dir} data-testid="dialog-qr">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5" />
              {tc("رمز بطاقتك", "Your Card QR")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-4 gap-4">
            <p className="text-sm text-muted-foreground">{tc("اعرض هذا الرمز للكاشير لكسب النقاط والطوابع", "Show this code to the cashier to earn points and stamps")}</p>
            {qrCodeUrl && (
              <div className="bg-white p-3 rounded-2xl shadow-lg">
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" data-testid="img-qr" />
              </div>
            )}
            <p className="font-mono text-xs text-muted-foreground" data-testid="text-card-num-qr">
              {card?.cardNumber || ""}
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowQr(false)} className="w-full" data-testid="button-close-qr">
            {tc("إغلاق", "Close")}
          </Button>
        </DialogContent>
      </Dialog>
    </CustomerLayout>
  );
}
