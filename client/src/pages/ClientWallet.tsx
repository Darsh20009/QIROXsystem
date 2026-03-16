import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import SARIcon from "@/components/SARIcon";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import {
  Loader2, Wallet, TrendingUp, TrendingDown, AlertCircle, ArrowUpRight, ArrowDownLeft,
  Clock, CreditCard, Eye, EyeOff, Copy, Share2, Lock, Plus, Building2,
  CheckCircle2, XCircle, RefreshCw, Send, ChevronDown, ChevronUp, ShieldCheck, Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface BankSettings {
  bankName: string;
  beneficiaryName: string;
  iban: string;
  accountNumber: string;
  swiftCode?: string;
  notes?: string;
}

interface WalletTx {
  id: string;
  type: "debit" | "credit";
  amount: number;
  description: string;
  note: string;
  createdAt: string;
}
interface WalletData {
  transactions: WalletTx[];
  totalDebit: number;
  totalCredit: number;
  outstanding: number;
}
interface CardData {
  cardNumber: string | null;
  cardActive: boolean;
  hasPin: boolean;
  holderName: string;
  balance: number;
}
interface TopupRequest {
  id: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  bankName: string;
  bankRef: string;
  note: string;
  createdAt: string;
  rejectionReason?: string;
}

function fmt(n: number) {
  return n.toLocaleString("ar-SA", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function fmtCard(num: string) {
  return num.match(/.{1,4}/g)?.join(" ") || num;
}

function QiroxPayCard({ card, showNumber, onToggle }: {
  card: CardData;
  showNumber: boolean;
  onToggle: () => void;
}) {
  const maskedNum = card.cardNumber
    ? card.cardNumber.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, showNumber ? "$1 $2 $3 $4" : "$1 **** **** $4")
    : "•••• •••• •••• ••••";

  return (
    <div
      className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden select-none"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
        boxShadow: "0 20px 60px rgba(6,182,212,0.25), 0 8px 24px rgba(0,0,0,0.5)",
        aspectRatio: "1.586",
        minHeight: 200,
      }}
      data-testid="qirox-pay-card"
    >
      {/* Chip glow effect */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #06b6d4, transparent)", transform: "translate(30%, -30%)" }} />
      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #3b82f6, transparent)", transform: "translate(-30%, 30%)" }} />

      <div className="relative z-10 p-6 h-full flex flex-col justify-between">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-cyan-400 font-black text-xl tracking-widest">QIROX</span>
              <span className="text-white font-black text-xl tracking-widest">PAY</span>
            </div>
            <p className="text-white/40 text-[9px] tracking-wider uppercase">Virtual Payment Card</p>
          </div>
          {/* Chip */}
          <div className="w-10 h-7 rounded bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center opacity-90">
            <div className="w-8 h-5 rounded border border-yellow-600/30 grid grid-cols-2 gap-px p-0.5">
              {[...Array(4)].map((_, i) => <div key={i} className="bg-yellow-600/30 rounded-sm" />)}
            </div>
          </div>
        </div>

        {/* Middle: card number */}
        <div>
          <div className="flex items-center gap-3">
            <p className="text-white font-mono text-lg tracking-widest font-bold flex-1"
              data-testid="card-number-display">{maskedNum}</p>
            <button onClick={onToggle} className="text-white/40 hover:text-white/70 transition-colors" data-testid="toggle-card-number">
              {showNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-white/40 text-[9px] uppercase tracking-wider mb-0.5">Card Holder</p>
            <p className="text-white font-semibold text-sm tracking-wide">{card.holderName}</p>
          </div>
          <div className="text-right">
            <p className="text-white/40 text-[9px] uppercase tracking-wider mb-0.5">Expires</p>
            <p className="text-white font-semibold text-sm">12/99</p>
          </div>
          <div className="text-right">
            <p className="text-white/40 text-[9px] uppercase tracking-wider mb-0.5">Balance</p>
            <p className="text-cyan-400 font-black text-base flex items-center gap-1">{fmt(card.balance)} <SARIcon size={11} className="opacity-40" /></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientWallet() {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const [showNumber, setShowNumber] = useState(false);
  const [activeTab, setActiveTab] = useState<"card" | "transactions" | "topup">("card");

  // Modals
  const [pinModal, setPinModal] = useState(false);
  const [topupModal, setTopupModal] = useState(false);
  const [paypalTopupModal, setPaypalTopupModal] = useState(false);
  const [shareModal, setShareModal] = useState(false);
  const [payOtpModal, setPayOtpModal] = useState(false);

  // PayPal topup
  const [paypalAmount, setPaypalAmount] = useState("");
  const [paypalLoading, setPaypalLoading] = useState(false);

  // Forms
  const [pinForm, setPinForm] = useState({ currentPin: "", newPin: "", confirmPin: "" });
  const [topupForm, setTopupForm] = useState({ amount: "", bankName: "", bankRef: "", note: "" });
  const [shareForm, setShareForm] = useState({ cardNumber: "", amount: "", description: "" });
  const [shareStep, setShareStep] = useState<"form" | "otp">("form");
  const [shareOtp, setShareOtp] = useState("");
  const [shareResult, setShareResult] = useState<{ ownerName: string; maskedEmail: string } | null>(null);

  // Handle PayPal wallet return/cancel
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isReturn = params.get("paypal_wallet_return") === "1";
    const isCancel = params.get("paypal_wallet_cancel") === "1";
    const token = params.get("token");

    if (isReturn && token) {
      window.history.replaceState({}, "", "/client-wallet");
      const pendingSar = sessionStorage.getItem("paypal_wallet_sar");
      sessionStorage.removeItem("paypal_wallet_sar");
      if (!pendingSar) {
        toast({ title: "لم يُعثر على مبلغ الشحن", variant: "destructive" });
        return;
      }
      (async () => {
        try {
          const r = await fetch(`/api/wallet/topup-paypal/capture/${token}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ sarAmount: Number(pendingSar) }),
          });
          const data = await r.json();
          if (!r.ok) throw new Error(data.error || "فشل تأكيد الدفع");
          queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
          queryClient.invalidateQueries({ queryKey: ["/api/wallet/card"] });
          queryClient.invalidateQueries({ queryKey: ["/api/wallet/topup-requests"] });
          toast({ title: `✅ تم شحن محفظتك بـ ${Number(pendingSar).toLocaleString()} ريال عبر PayPal!` });
          setActiveTab("topup");
        } catch (e: any) {
          toast({ title: e.message || "فشل تأكيد دفع PayPal", variant: "destructive" });
        }
      })();
    } else if (isCancel) {
      window.history.replaceState({}, "", "/client-wallet");
      toast({ title: "تم إلغاء عملية الشحن عبر PayPal", variant: "destructive" });
    }
  }, []);

  async function handlePaypalTopup() {
    const amount = Number(paypalAmount);
    if (!amount || amount < 1) {
      toast({ title: "أدخل مبلغاً صحيحاً (الحد الأدنى 1 ريال)", variant: "destructive" });
      return;
    }
    setPaypalLoading(true);
    try {
      const r = await fetch("/api/wallet/topup-paypal/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "فشل إنشاء طلب PayPal");
      const approveUrl = data.approveUrl || data.links?.find((l: any) => l.rel === "approve" || l.rel === "payer-action")?.href;
      if (!approveUrl) throw new Error("لم يُعثر على رابط PayPal");
      sessionStorage.setItem("paypal_wallet_sar", String(amount));
      window.location.href = approveUrl;
    } catch (e: any) {
      setPaypalLoading(false);
      toast({ title: e.message || "خطأ في PayPal", variant: "destructive" });
    }
  }

  const { data: walletData, isLoading: loadingWallet } = useQuery<WalletData>({ queryKey: ["/api/wallet"] });
  const { data: cardData, isLoading: loadingCard } = useQuery<CardData>({ queryKey: ["/api/wallet/card"] });
  const { data: topupHistory, isLoading: loadingTopup } = useQuery<TopupRequest[]>({ queryKey: ["/api/wallet/topup-requests"] });
  const { data: bankSettings } = useQuery<BankSettings>({ queryKey: ["/api/bank-settings"] });

  const txs = walletData?.transactions || [];

  // Init card
  const initCardMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/wallet/card/init"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/card"] });
      toast({ title: "تم إنشاء بطاقة Qirox Pay بنجاح!" });
    },
    onError: () => toast({ title: L ? "فشل إنشاء البطاقة" : "Failed to create card", variant: "destructive" }),
  });

  // Set payment password
  const setPinMutation = useMutation({
    mutationFn: async () => {
      if (pinForm.newPin !== pinForm.confirmPin) throw new Error("كلمتا المرور غير متطابقتين");
      if (pinForm.newPin.length < 4) throw new Error("كلمة المرور يجب أن تكون 4 أحرف على الأقل");
      await apiRequest("POST", "/api/wallet/card/set-pin", {
        pin: pinForm.newPin,
        currentPin: pinForm.currentPin || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/card"] });
      setPinModal(false);
      setPinForm({ currentPin: "", newPin: "", confirmPin: "" });
      toast({ title: "تم تعيين كلمة مرور الدفع بنجاح" });
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  // Topup request
  const topupMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/wallet/topup-request", {
        amount: Number(topupForm.amount),
        bankName: topupForm.bankName,
        bankRef: topupForm.bankRef,
        note: topupForm.note,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/topup-requests"] });
      setTopupModal(false);
      setTopupForm({ amount: "", bankName: "", bankRef: "", note: "" });
      toast({ title: "تم إرسال طلب الشحن بنجاح", description: "سيتم مراجعته خلال 24 ساعة" });
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  // Request OTP for external payment
  const requestOtpMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/wallet/card/request-otp", {
        cardNumber: shareForm.cardNumber.replace(/\s/g, ""),
        amount: Number(shareForm.amount),
        description: shareForm.description,
      });
      return r.json();
    },
    onSuccess: (data) => {
      setShareResult(data);
      setShareStep("otp");
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  // Verify OTP for external payment
  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/wallet/card/verify-otp", {
        cardNumber: shareForm.cardNumber.replace(/\s/g, ""),
        otp: shareOtp,
        amount: Number(shareForm.amount),
        description: shareForm.description,
      });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/card"] });
      setPayOtpModal(false);
      setShareStep("form");
      setShareForm({ cardNumber: "", amount: "", description: "" });
      setShareOtp("");
      setShareResult(null);
      toast({ title: "تمت عملية الدفع بنجاح!" });
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  function copyCardNumber() {
    if (!cardData?.cardNumber) return;
    navigator.clipboard.writeText(fmtCard(cardData.cardNumber));
    toast({ title: L ? "تم نسخ رقم البطاقة" : "Card number copied" });
  }

  const tabs = [
    { id: "card", label: L ? "بطاقتي" : "My Card" },
    { id: "transactions", label: L ? "المعاملات" : "Transactions" },
    { id: "topup", label: L ? "طلبات الشحن" : "Top-up Requests" },
  ] as const;

  return (
    <div className="min-h-screen bg-[#f8f8f8] dark:bg-gray-950" dir={dir}>
      <PageGraphics variant="dashboard" />

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-black/[0.06] dark:border-white/[0.08] px-6 py-5 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <SidebarTrigger className="text-black/40 dark:text-white/40" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#0f172a,#1e3a5f)" }}>
              <CreditCard className="w-4.5 h-4.5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-black dark:text-white">Qirox Pay</h1>
              <p className="text-xs text-black/40 dark:text-white/40">محفظتك الإلكترونية الآمنة</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Tabs */}
        <div className="flex gap-1 bg-black/[0.04] dark:bg-white/[0.05] rounded-xl p-1">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              data-testid={`tab-${tab.id}`}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id
                ? "bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm"
                : "text-black/40 dark:text-white/40 hover:text-black/60"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* === CARD TAB === */}
        {activeTab === "card" && (
          <div className="space-y-5">
            {loadingCard ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" />
              </div>
            ) : !cardData?.cardNumber ? (
              /* No card yet */
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-10 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#0f172a,#1e3a5f)" }}>
                  <CreditCard className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-black dark:text-white">احصل على بطاقة Qirox Pay</h2>
                  <p className="text-sm text-black/40 dark:text-white/40 mt-1">بطاقة دفع إلكترونية آمنة خاصة بك داخل منظومة كيروكس</p>
                </div>
                <Button onClick={() => initCardMutation.mutate()} disabled={initCardMutation.isPending}
                  className="gap-2 text-white" style={{ background: "linear-gradient(135deg,#0f172a,#1e3a5f)" }}
                  data-testid="button-init-card">
                  {initCardMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4 text-cyan-400" />}
                  إنشاء بطاقتي الآن
                </Button>
              </div>
            ) : (
              <>
                {/* Card Visual */}
                <QiroxPayCard card={cardData} showNumber={showNumber} onToggle={() => setShowNumber(v => !v)} />

                {/* Quick Actions */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { icon: Copy, label: "نسخ الرقم", action: copyCardNumber, testId: "button-copy-card" },
                    { icon: Plus, label: "شحن الرصيد", action: () => setTopupModal(true), testId: "button-topup" },
                    { icon: Lock, label: cardData.hasPin ? "تغيير كلمة المرور" : "تعيين كلمة المرور", action: () => setPinModal(true), testId: "button-set-pin" },
                    { icon: Send, label: "دفع ببطاقة", action: () => { setPayOtpModal(true); setShareStep("form"); }, testId: "button-pay-with-card" },
                  ].map(({ icon: Icon, label, action, testId }) => (
                    <button key={label} onClick={action} data-testid={testId}
                      className="bg-white dark:bg-gray-900 rounded-xl border border-black/[0.06] dark:border-white/[0.08] p-3 flex flex-col items-center gap-1.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg,#0f172a,#1e3a5f)" }}>
                        <Icon className="w-4 h-4 text-cyan-400" />
                      </div>
                      <span className="text-[10px] font-semibold text-black/60 dark:text-white/60 text-center">{label}</span>
                    </button>
                  ))}
                </div>

                {/* PIN activation notice */}
                {!cardData.hasPin && (
                  <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-300/60 dark:border-amber-700/40 p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-amber-800 dark:text-amber-300">{L ? "البطاقة تحتاج تفعيل" : "Card Needs Activation"}</p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                        لاستخدام البطاقة في الدفع أو السماح للآخرين بالدفع منها، يجب تعيين كلمة مرور الدفع أولاً.
                      </p>
                      <button
                        onClick={() => setPinModal(true)}
                        className="mt-2 text-xs font-bold text-amber-700 dark:text-amber-300 underline"
                        data-testid="button-activate-card"
                      >
                        اضغط هنا لتعيين كلمة المرور وتفعيل البطاقة ←
                      </button>
                    </div>
                  </div>
                )}

                {/* Card Info */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden">
                  <div className="px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.08]">
                    <h3 className="text-sm font-bold text-black dark:text-white">تفاصيل البطاقة</h3>
                  </div>
                  <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                    {[
                      { label: L ? "رقم البطاقة" : "Card Number", value: fmtCard(cardData.cardNumber!), mono: true },
                      { label: L ? "اسم حامل البطاقة" : "Holder Name", value: cardData.holderName },
                      { label: L ? "تاريخ الانتهاء" : "Expiry Date", value: "12/99" },
                      { label: "كلمة مرور الدفع", value: cardData.hasPin ? "••••••••  (مُفعَّلة ✓)" : "⚠ غير مُعيَّنة — البطاقة غير مفعّلة" },
                      { label: "حالة البطاقة", value: (cardData.cardActive && cardData.hasPin) ? "نشطة ومفعّلة ✓" : cardData.cardActive ? "البطاقة موجودة — تحتاج تعيين كلمة المرور" : "غير نشطة" },
                    ].map(({ label, value, mono }) => (
                      <div key={label} className="px-5 py-3 flex items-center justify-between">
                        <span className="text-xs text-black/40 dark:text-white/40">{label}</span>
                        <span className={`text-xs font-semibold text-black dark:text-white ${mono ? "font-mono tracking-wider" : ""}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* How to share */}
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/10 dark:to-blue-900/10 rounded-2xl border border-cyan-200/50 dark:border-cyan-800/30 p-5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-cyan-900 dark:text-cyan-300">كيف يعمل الدفع الخارجي؟</p>
                      <p className="text-xs text-cyan-700 dark:text-cyan-400 mt-1 leading-relaxed">
                        يمكنك مشاركة رقم بطاقتك مع أي شخص ليدفع بها داخل منظومة Qirox.
                        عند محاولة الدفع، ستصلك رسالة بريد إلكتروني تحتوي على رمز OTP يجب أن تشاركه مع الدافع.
                        هذا يضمن أنك توافق على كل عملية دفع.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* === TRANSACTIONS TAB === */}
        {activeTab === "transactions" && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: TrendingDown, label: "إجمالي المستحق", value: walletData?.totalDebit || 0, color: "rose" },
                { icon: TrendingUp, label: "إجمالي المدفوع", value: walletData?.totalCredit || 0, color: "emerald" },
                { icon: AlertCircle, label: "رصيد Qirox Pay", value: cardData?.balance || 0, color: "cyan" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-4 text-center">
                  <div className={`w-8 h-8 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center mx-auto mb-2`}>
                    <Icon className={`w-4 h-4 text-${color}-500`} />
                  </div>
                  <p className="text-[10px] text-black/40 dark:text-white/40 mb-1">{label}</p>
                  <p className="text-sm font-black text-black dark:text-white flex items-center gap-1">{fmt(value)} <SARIcon size={11} className="opacity-40" /></p>
                </div>
              ))}
            </div>

            {/* Transaction List */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden">
              <div className="px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.08]">
                <h2 className="text-sm font-bold text-black dark:text-white">سجل المعاملات ({txs.length})</h2>
              </div>
              {loadingWallet ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-5 h-5 animate-spin text-black/20" />
                </div>
              ) : txs.length === 0 ? (
                <div className="py-16 text-center">
                  <Wallet className="w-10 h-10 text-black/10 dark:text-white/10 mx-auto mb-3" />
                  <p className="text-sm font-medium text-black/30 dark:text-white/30">لا توجد معاملات بعد</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[480px]">
                  <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                    {txs.map((tx) => (
                      <div key={tx.id} className="px-5 py-4 flex items-center gap-4" data-testid={`wallet-tx-${tx.id}`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === 'credit' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}`}>
                          {tx.type === 'credit'
                            ? <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                            : <ArrowUpRight className="w-4 h-4 text-rose-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-black dark:text-white truncate">{tx.description}</p>
                          {tx.note && <p className="text-xs text-black/40 dark:text-white/40 mt-0.5 truncate">{tx.note}</p>}
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3 text-black/20 dark:text-white/20" />
                            <p className="text-[11px] text-black/30 dark:text-white/30">
                              {new Date(tx.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}
                            </p>
                          </div>
                        </div>
                        <div className="text-left flex-shrink-0">
                          <p className={`text-base font-black ${tx.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {tx.type === 'credit' ? '+' : '-'}{fmt(tx.amount)}
                          </p>
                          <SARIcon size={9} className="opacity-30 mt-0.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        )}

        {/* === TOPUP TAB === */}
        {activeTab === "topup" && (
          <div className="space-y-4">
            {/* PayPal instant topup */}
            <button
              onClick={() => setPaypalTopupModal(true)}
              data-testid="button-paypal-topup"
              className="w-full rounded-2xl border-2 border-[#FFC439]/60 bg-gradient-to-br from-[#FFC439]/10 to-[#FFC439]/5 hover:from-[#FFC439]/20 hover:to-[#FFC439]/10 transition-all p-4 flex items-center gap-4 text-right"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FFC439] flex items-center justify-center flex-shrink-0 shadow-sm">
                <Zap className="w-6 h-6 text-[#003087]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black text-[#003087] dark:text-[#FFC439]">شحن فوري عبر PayPal</p>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full">فوري</span>
                </div>
                <p className="text-xs text-black/50 dark:text-white/40 mt-0.5">ادفع ببطاقتك أو حسابك في PayPal — يُضاف الرصيد تلقائياً</p>
              </div>
              <img src="https://www.paypalobjects.com/webstatic/en_US/i/buttons/PP_logo_h_100x26.png" alt="PayPal" className="h-5 flex-shrink-0 opacity-80" />
            </button>

            {/* Bank transfer topup */}
            <Button onClick={() => setTopupModal(true)} className="w-full gap-2 text-white py-6"
              style={{ background: "linear-gradient(135deg,#0f172a,#1e3a5f)" }}
              data-testid="button-new-topup">
              <Building2 className="w-4 h-4 text-cyan-400" />
              شحن بتحويل بنكي (يحتاج موافقة)
            </Button>

            {loadingTopup ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-black/20" />
              </div>
            ) : (topupHistory || []).length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] py-16 text-center">
                <Building2 className="w-10 h-10 text-black/10 dark:text-white/10 mx-auto mb-3" />
                <p className="text-sm font-medium text-black/30 dark:text-white/30">لا يوجد طلبات شحن</p>
                <p className="text-xs text-black/20 dark:text-white/20 mt-1">أرسل طلباً لشحن رصيد محفظتك</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden">
                <div className="px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.08]">
                  <h2 className="text-sm font-bold text-black dark:text-white">طلبات الشحن</h2>
                </div>
                <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {(topupHistory || []).map(req => (
                    <div key={req.id} className="px-5 py-4" data-testid={`topup-req-${req.id}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${req.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-900/20' : req.status === 'rejected' ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                          {req.status === 'approved' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            : req.status === 'rejected' ? <XCircle className="w-4 h-4 text-rose-500" />
                              : <RefreshCw className="w-4 h-4 text-amber-500" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-black dark:text-white flex items-center gap-1">{fmt(req.amount)} <SARIcon size={11} className="opacity-70" /></p>
                          <p className="text-xs text-black/40 dark:text-white/40">{req.bankName || "تحويل بنكي"} · {req.bankRef || "—"}</p>
                        </div>
                        <Badge className={`text-[10px] border-0 ${req.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : req.status === 'rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                          {req.status === 'approved' ? 'مُعتمد' : req.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                        </Badge>
                      </div>
                      {req.rejectionReason && (
                        <p className="text-xs text-rose-600 dark:text-rose-400 mr-11">السبب: {req.rejectionReason}</p>
                      )}
                      <p className="text-[11px] text-black/25 dark:text-white/25 mr-11">
                        {new Date(req.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* === Payment Password Modal === */}
      <Dialog open={pinModal} onOpenChange={setPinModal}>
        <DialogContent className="max-w-sm" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-500" />
              {cardData?.hasPin ? "تغيير كلمة مرور الدفع" : "تعيين كلمة مرور الدفع"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-cyan-50 dark:bg-cyan-900/10 rounded-xl border border-cyan-200/50 dark:border-cyan-800/30 p-3">
              <p className="text-xs text-cyan-700 dark:text-cyan-400 leading-relaxed">
                كلمة مرور الدفع تُستخدم لتأكيد عمليات الدفع ببطاقتك. اختر كلمة مرور قوية (4–32 حرفاً).
              </p>
            </div>
            {cardData?.hasPin && (
              <div>
                <Label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-2 block">كلمة المرور الحالية</Label>
                <Input type="password" placeholder="أدخل كلمة المرور الحالية" value={pinForm.currentPin}
                  onChange={e => setPinForm(f => ({ ...f, currentPin: e.target.value }))} data-testid="input-current-pin" />
              </div>
            )}
            <div>
              <Label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-2 block">كلمة المرور الجديدة</Label>
              <Input type="password" placeholder="أدخل كلمة مرور جديدة (4 أحرف على الأقل)" value={pinForm.newPin}
                onChange={e => setPinForm(f => ({ ...f, newPin: e.target.value }))} data-testid="input-new-pin" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-2 block">تأكيد كلمة المرور</Label>
              <Input type="password" placeholder="أعد كتابة كلمة المرور" value={pinForm.confirmPin}
                onChange={e => setPinForm(f => ({ ...f, confirmPin: e.target.value }))} data-testid="input-confirm-pin" />
              {pinForm.confirmPin && pinForm.newPin !== pinForm.confirmPin && (
                <p className="text-xs text-red-500 mt-1">كلمتا المرور غير متطابقتين</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setPinModal(false); setPinForm({ currentPin: "", newPin: "", confirmPin: "" }); }} className="text-xs">إلغاء</Button>
            <Button
              onClick={() => setPinMutation.mutate()}
              disabled={
                setPinMutation.isPending ||
                !pinForm.newPin ||
                pinForm.newPin.length < 4 ||
                !pinForm.confirmPin ||
                pinForm.newPin !== pinForm.confirmPin ||
                (cardData.hasPin && !pinForm.currentPin)
              }
              className="text-xs text-white gap-1.5" style={{ background: "linear-gradient(135deg,#0f172a,#1e3a5f)" }}
              data-testid="button-confirm-pin">
              {setPinMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5 text-cyan-400" />}
              حفظ كلمة المرور
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === PayPal Topup Modal === */}
      <Dialog open={paypalTopupModal} onOpenChange={v => { setPaypalTopupModal(v); if (!v) setPaypalAmount(""); }}>
        <DialogContent className="max-w-sm" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#FFC439]" />
              شحن المحفظة عبر PayPal
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-xl bg-[#FFC439]/10 border border-[#FFC439]/30 p-4 flex items-start gap-3">
              <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" alt="PayPal" className="h-5 rounded mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#003087] dark:text-[#FFC439]">دفع آمن وفوري</p>
                <p className="text-xs text-black/50 dark:text-white/40 mt-0.5 leading-relaxed">
                  ادفع ببطاقتك الائتمانية أو حسابك في PayPal — يُضاف الرصيد تلقائياً فور اكتمال الدفع.
                </p>
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-2 flex items-center gap-1">
                المبلغ (<SARIcon size={10} className="opacity-60" />) <span className="text-red-400">*</span>
              </Label>
              <Input
                type="number" min="1" placeholder="مثال: 200"
                value={paypalAmount}
                onChange={e => setPaypalAmount(e.target.value)}
                data-testid="input-paypal-amount"
              />
              {paypalAmount && Number(paypalAmount) > 0 && (
                <p className="text-[11px] text-black/40 dark:text-white/30 mt-1.5 flex items-center gap-1">
                  سيُخصم من PayPal: <span className="font-bold text-[#003087] dark:text-[#FFC439]">${(Number(paypalAmount) / 3.75).toFixed(2)}</span> (سعر صرف ثابت: 1$ = 3.75 ريال)
                </p>
              )}
            </div>
            <div className="rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] p-3 space-y-1.5">
              {[
                "سيتم تحويلك لصفحة PayPal الآمنة",
                "بعد الدفع ستعود للمحفظة تلقائياً",
                "يُضاف الرصيد فوراً بدون انتظار",
              ].map((txt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <p className="text-xs text-black/50 dark:text-white/40">{txt}</p>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setPaypalTopupModal(false); setPaypalAmount(""); }} className="text-xs">إلغاء</Button>
            <Button
              onClick={handlePaypalTopup}
              disabled={paypalLoading || !paypalAmount || Number(paypalAmount) < 1}
              data-testid="button-confirm-paypal-topup"
              className="text-xs text-[#003087] font-bold gap-1.5 bg-[#FFC439] hover:bg-[#f0b429] border-0"
            >
              {paypalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              {paypalLoading ? "جاري التحويل..." : "ادفع عبر PayPal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === Topup Modal === */}
      <Dialog open={topupModal} onOpenChange={setTopupModal}>
        <DialogContent className="max-w-sm" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-500" />
              طلب شحن رصيد
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/10 dark:to-blue-900/10 rounded-xl border border-cyan-200/40 dark:border-cyan-800/30 p-4 text-sm">
              <p className="font-bold text-cyan-900 dark:text-cyan-300 mb-2">بيانات الحساب البنكي:</p>
              <div className="space-y-1.5 text-cyan-700 dark:text-cyan-400 text-xs">
                {bankSettings?.bankName && <p>🏦 البنك: {bankSettings.bankName}</p>}
                {bankSettings?.beneficiaryName && <p>👤 اسم المستفيد: {bankSettings.beneficiaryName}</p>}
                {bankSettings?.iban && (
                  <div className="flex items-center gap-2">
                    <p dir="ltr" className="font-mono tracking-wide">📋 IBAN: {bankSettings.iban}</p>
                    <button onClick={() => { navigator.clipboard.writeText(bankSettings.iban); toast({ title: "تم نسخ الـ IBAN" }); }}
                      className="text-cyan-500 hover:text-cyan-700 transition-colors" title="نسخ">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {bankSettings?.accountNumber && <p>🔢 رقم الحساب: {bankSettings.accountNumber}</p>}
                {bankSettings?.swiftCode && <p>🌐 SWIFT: {bankSettings.swiftCode}</p>}
                {bankSettings?.notes && <p className="text-cyan-600/70 dark:text-cyan-400/70 mt-1 border-t border-cyan-200/30 pt-1">{bankSettings.notes}</p>}
                {!bankSettings?.iban && !bankSettings?.bankName && (
                  <p className="text-black/40 dark:text-white/40">جارٍ تحميل بيانات الحساب...</p>
                )}
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-2 flex items-center gap-1">المبلغ (<SARIcon size={10} className="opacity-60" />) <span className="text-red-400">*</span></Label>
              <Input type="number" min="1" placeholder="مثال: 500" value={topupForm.amount}
                onChange={e => setTopupForm(f => ({ ...f, amount: e.target.value }))} data-testid="input-topup-amount" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-2 block">اسم البنك <span className="text-red-400">*</span></Label>
              <Input placeholder="مثال: بنك الراجحي" value={topupForm.bankName}
                onChange={e => setTopupForm(f => ({ ...f, bankName: e.target.value }))} data-testid="input-topup-bank" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-2 block">رقم الحوالة / المرجع <span className="text-red-400">*</span></Label>
              <Input placeholder="رقم العملية أو المرجع البنكي" value={topupForm.bankRef}
                onChange={e => setTopupForm(f => ({ ...f, bankRef: e.target.value }))} data-testid="input-topup-ref" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-2 block">ملاحظة (اختياري)</Label>
              <Textarea placeholder="أي تفاصيل إضافية..." value={topupForm.note} rows={2}
                onChange={e => setTopupForm(f => ({ ...f, note: e.target.value }))} data-testid="input-topup-note" className="resize-none" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTopupModal(false)} className="text-xs">إلغاء</Button>
            <Button onClick={() => topupMutation.mutate()}
              disabled={topupMutation.isPending || !topupForm.amount || !topupForm.bankName || !topupForm.bankRef}
              className="text-xs text-white gap-1.5" style={{ background: "linear-gradient(135deg,#0f172a,#1e3a5f)" }}
              data-testid="button-confirm-topup">
              {topupMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-cyan-400" />}
              إرسال الطلب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === Pay with another's card (OTP) Modal === */}
      <Dialog open={payOtpModal} onOpenChange={v => { setPayOtpModal(v); if (!v) { setShareStep("form"); setShareResult(null); setShareOtp(""); } }}>
        <DialogContent className="max-w-sm" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-cyan-500" />
              {shareStep === "form" ? "الدفع ببطاقة Qirox Pay" : "إدخال رمز OTP"}
            </DialogTitle>
          </DialogHeader>

          {shareStep === "form" ? (
            <div className="space-y-4 py-2">
              <p className="text-xs text-black/50 dark:text-white/50">أدخل رقم بطاقة Qirox Pay للشخص الذي سيدفع من رصيده</p>
              <div>
                <Label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-2 block">رقم البطاقة (16 رقم)</Label>
                <Input placeholder="4747 XXXX XXXX XXXX" value={shareForm.cardNumber}
                  onChange={e => setShareForm(f => ({ ...f, cardNumber: e.target.value }))} data-testid="input-share-card-number" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-2 flex items-center gap-1">المبلغ (<SARIcon size={10} className="opacity-60" />)</Label>
                <Input type="number" min="1" placeholder="المبلغ المطلوب" value={shareForm.amount}
                  onChange={e => setShareForm(f => ({ ...f, amount: e.target.value }))} data-testid="input-share-amount" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-2 block">وصف العملية</Label>
                <Input placeholder="مثال: دفع قسط مشروع" value={shareForm.description}
                  onChange={e => setShareForm(f => ({ ...f, description: e.target.value }))} data-testid="input-share-description" />
              </div>
              <DialogFooter className="gap-2 pt-2">
                <Button variant="outline" onClick={() => setPayOtpModal(false)} className="text-xs">إلغاء</Button>
                <Button onClick={() => requestOtpMutation.mutate()}
                  disabled={requestOtpMutation.isPending || !shareForm.cardNumber || !shareForm.amount}
                  className="text-xs text-white gap-1.5" style={{ background: "linear-gradient(135deg,#0f172a,#1e3a5f)" }}
                  data-testid="button-request-otp">
                  {requestOtpMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-cyan-400" />}
                  طلب OTP
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {shareResult && (
                <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800/30 p-4">
                  <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">تم إرسال رمز OTP!</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    تم إرسال رمز التأكيد إلى بريد صاحب البطاقة ({shareResult.maskedEmail}).
                    اطلب منه مشاركة الرمز معك.
                  </p>
                </div>
              )}
              <div>
                <Label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-2 block">رمز OTP (6 أرقام)</Label>
                <Input type="text" inputMode="numeric" maxLength={6} placeholder="XXXXXX"
                  className="text-center text-2xl font-mono tracking-widest"
                  value={shareOtp} onChange={e => setShareOtp(e.target.value)} data-testid="input-otp-verify" />
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => { setShareStep("form"); setShareResult(null); }} className="text-xs">رجوع</Button>
                <Button onClick={() => verifyOtpMutation.mutate()}
                  disabled={verifyOtpMutation.isPending || shareOtp.length !== 6}
                  className="text-xs text-white gap-1.5" style={{ background: "linear-gradient(135deg,#0f172a,#1e3a5f)" }}
                  data-testid="button-verify-otp">
                  {verifyOtpMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                  تأكيد الدفع
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
