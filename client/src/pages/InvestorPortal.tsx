import { useState, useRef, useEffect } from "react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import {
  TrendingUp, DollarSign, Wallet, Percent, Shield, FileText,
  Loader2, CheckCircle2, Clock, XCircle, Upload, Pen, X,
  BarChart3, Users, Star, Lock
} from "lucide-react";

type InvestorData = {
  profile: { id: string; stakePercentage: number; totalInvested: number; isVerified: boolean; isActive: boolean; notes: string; joinedAt: string; userId: { fullName: string; email: string; profilePhotoUrl?: string } };
  settings: { companyName: string; companyNameAr: string; systemValuation: number; currency: string; profitDistribution: { roleType: string; percentage: number; label: string }[] };
  allInvestors: { id: string; stakePercentage: number; userId: { fullName: string; profilePhotoUrl?: string; jobTitle?: string } }[];
  totalStake: number;
  myValue: number;
};

type Payment = {
  id: string; amount: number; currency: string; paymentMethod: string;
  proofUrl: string; description: string; status: "pending" | "approved" | "rejected";
  adminNote: string; createdAt: string;
};

const STATUS_CONFIG = {
  pending: { label: "بانتظار المراجعة", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  approved: { label: "موافق", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  rejected: { label: "مرفوض", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "تحويل بنكي" },
  { value: "cash", label: "نقداً" },
  { value: "crypto", label: "عملة رقمية" },
  { value: "other", label: "أخرى" },
];

function SignaturePad({ onChange }: { onChange: (data: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current; if (!canvas) return;
    e.preventDefault();
    drawing.current = true; setEmpty(false);
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current; if (!canvas) return;
    e.preventDefault();
    const ctx = canvas.getContext("2d")!;
    ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#06b6d4";
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y); ctx.stroke();
  };

  const endDraw = () => {
    drawing.current = false;
    if (canvasRef.current) onChange(canvasRef.current.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setEmpty(true); onChange("");
  };

  return (
    <div className="relative">
      <canvas ref={canvasRef} width={400} height={140}
        className="w-full h-36 border-2 border-dashed border-black/20 dark:border-white/20 rounded-xl bg-white dark:bg-gray-950 cursor-crosshair touch-none"
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
        data-testid="canvas-signature"
      />
      {empty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-sm text-black/30 dark:text-white/30 flex items-center gap-2"><Pen className="w-4 h-4" />ارسم توقيعك هنا</span>
        </div>
      )}
      {!empty && (
        <button onClick={clear} className="absolute top-2 left-2 p-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-500 hover:bg-red-200 transition-colors" data-testid="btn-clear-sig">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

type Tab = "overview" | "payments" | "submit";

export default function InvestorPortal() {
  const { toast } = useToast();
  const { data: currentUser } = useUser();
  const [tab, setTab] = useState<Tab>("overview");

  // Submit payment form
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank_transfer");
  const [description, setDescription] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [signatureData, setSignatureData] = useState("");
  const [signatureText, setSignatureText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error } = useQuery<InvestorData>({ queryKey: ["/api/investor/profile"] });
  const { data: payments = [], isLoading: payLoading } = useQuery<Payment[]>({ queryKey: ["/api/investor/payments"] });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("amount", amount);
      formData.append("paymentMethod", method);
      formData.append("description", description);
      formData.append("signatureData", signatureData);
      formData.append("signatureText", signatureText);
      if (proofFile) formData.append("proof", proofFile);
      const r = await fetch("/api/investor/payments", { method: "POST", body: formData, credentials: "include" });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || "فشل الإرسال"); }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investor/payments"] });
      setAmount(""); setMethod("bank_transfer"); setDescription(""); setProofFile(null); setSignatureData(""); setSignatureText("");
      setTab("payments");
      toast({ title: "✅ تم إرسال الدفعة — في انتظار موافقة الأدمن" });
    },
    onError: (e: any) => toast({ title: e.message || "فشل الإرسال", variant: "destructive" }),
  });

  if (isLoading) return <div className="flex justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" /></div>;

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-center" dir="rtl">
        <div className="w-20 h-20 rounded-3xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <Lock className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-xl font-black text-black dark:text-white">بوابة المستثمرين</h2>
        <p className="text-sm text-black/40 dark:text-white/40 max-w-xs">لا يوجد لديك ملف مستثمر حتى الآن. تواصل مع الإدارة لتفعيل وصولك.</p>
      </div>
    );
  }

  const { profile, settings, allInvestors, totalStake, myValue } = data;
  const profitShare = settings.profitDistribution.find(d => d.roleType === "investor");
  const pendingPayments = payments.filter(p => p.status === "pending").length;

  return (
    <div className="relative overflow-hidden min-h-screen bg-white dark:bg-gray-950 p-6" dir="rtl">
      <PageGraphics variant="dashboard" />
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Hero Card */}
        <div className="relative bg-gradient-to-bl from-amber-500/15 via-yellow-400/8 to-transparent border border-black/[0.07] dark:border-white/[0.07] rounded-3xl p-7 overflow-hidden">
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-gradient-to-br from-amber-500/20 to-yellow-400/10 rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-orange-400/10 to-transparent rounded-full blur-2xl" />
          <div className="relative flex items-start gap-5 flex-wrap">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 shrink-0">
                {profile.userId?.profilePhotoUrl ? <img src={profile.userId.profilePhotoUrl} className="w-full h-full object-cover" alt="" /> : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-black text-amber-600">{profile.userId?.fullName?.[0]}</div>
                )}
              </div>
              {profile.isVerified && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white" /></div>}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-black dark:text-white">{profile.userId?.fullName}</h1>
                <Badge className="text-xs px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 gap-1"><Star className="w-3 h-3" /> مستثمر</Badge>
                {profile.isVerified && <Badge className="text-xs px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">✓ موثق</Badge>}
              </div>
              <p className="text-sm text-black/40 dark:text-white/40 mt-1">انضم منذ {new Date(profile.joinedAt).toLocaleDateString("ar-SA")}</p>
            </div>
            <div className="text-center bg-white/60 dark:bg-black/20 rounded-2xl px-6 py-3">
              <p className="text-4xl font-black text-amber-600 dark:text-amber-400">{profile.stakePercentage}%</p>
              <p className="text-xs text-black/40 dark:text-white/40 mt-1">حصتك من النظام</p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="relative mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "قيمة حصتك", value: `${myValue.toLocaleString("ar-SA")} ${settings.currency}`, icon: TrendingUp, color: "text-amber-500" },
              { label: "إجمالي مستثمراتك", value: `${profile.totalInvested.toLocaleString("ar-SA")} ${settings.currency}`, icon: Wallet, color: "text-green-500" },
              { label: "تقييم النظام", value: `${(settings.systemValuation || 0).toLocaleString("ar-SA")} ${settings.currency}`, icon: BarChart3, color: "text-blue-500" },
              { label: "عدد المستثمرين", value: allInvestors.length, icon: Users, color: "text-purple-500" },
            ].map(m => (
              <div key={m.label} className="bg-white/70 dark:bg-gray-900/70 backdrop-blur border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-4">
                <m.icon className={`w-4 h-4 ${m.color} mb-2`} />
                <p className="font-black text-black dark:text-white text-base">{m.value}</p>
                <p className="text-xs text-black/40 dark:text-white/40">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Stake Bar */}
          {allInvestors.length > 0 && (
            <div className="relative mt-5">
              <p className="text-xs text-black/40 dark:text-white/40 mb-2 flex justify-between">
                <span>توزيع الحصص بين المستثمرين</span>
                <span>الإجمالي: {totalStake}%</span>
              </p>
              <div className="h-4 rounded-full overflow-hidden flex bg-black/5 dark:bg-white/5">
                {allInvestors.map((inv, i) => {
                  const colors = ["bg-amber-400", "bg-yellow-400", "bg-orange-400", "bg-red-400", "bg-pink-400"];
                  const isMe = inv.userId?.fullName === profile.userId?.fullName;
                  return (
                    <div key={inv.id} className={`${colors[i % colors.length]} h-full transition-all ${isMe ? "ring-2 ring-white" : ""}`}
                      style={{ width: `${inv.stakePercentage}%` }} title={`${inv.userId?.fullName}: ${inv.stakePercentage}%`} />
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {allInvestors.map((inv, i) => {
                  const colors = ["bg-amber-400", "bg-yellow-400", "bg-orange-400", "bg-red-400", "bg-pink-400"];
                  const isMe = inv.userId?.fullName === profile.userId?.fullName;
                  return (
                    <span key={inv.id} className={`flex items-center gap-1 text-xs ${isMe ? "font-bold text-black dark:text-white" : "text-black/40 dark:text-white/40"}`}>
                      <span className={`w-2.5 h-2.5 rounded-sm ${colors[i % colors.length]}`} />
                      {inv.userId?.fullName}: {inv.stakePercentage}% {isMe && "(أنت)"}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Profit Share */}
          {profitShare && settings.systemValuation > 0 && (
            <div className="relative mt-5 p-4 rounded-2xl bg-green-50/80 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-700 dark:text-green-400 font-semibold mb-1">نسبة الأرباح المخصصة للمستثمرين: {profitShare.percentage}%</p>
              <p className="text-xl font-black text-green-700 dark:text-green-400">
                حصتك من الأرباح: {((settings.systemValuation * profitShare.percentage / 100) * profile.stakePercentage / 100).toLocaleString("ar-SA")} {settings.currency}
              </p>
              <p className="text-xs text-black/30 dark:text-white/30 mt-1">بناءً على حصة {profile.stakePercentage}% × أرباح المستثمرين {profitShare.percentage}% من التقييم الكلي</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-black/[0.06] dark:border-white/[0.06]">
          {([
            { id: "overview" as Tab, label: "نظرة عامة", icon: BarChart3 },
            { id: "payments" as Tab, label: "سجل الدفعات", icon: DollarSign },
            { id: "submit" as Tab, label: "إرسال دفعة جديدة", icon: Upload },
          ]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${tab === t.id ? "border-amber-500 text-amber-600 dark:text-amber-400" : "border-transparent text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70"}`}
              data-testid={`tab-${t.id}`}>
              <t.icon className="w-4 h-4" />{t.label}
              {t.id === "payments" && pendingPayments > 0 && <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center">{pendingPayments}</span>}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === "overview" && (
          <div className="space-y-4">
            {/* Other Investors */}
            <div className="border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-5 bg-white dark:bg-gray-900">
              <h3 className="font-bold text-black dark:text-white mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-amber-500" /> فريق المستثمرين</h3>
              <div className="space-y-3">
                {allInvestors.map((inv, i) => {
                  const isMe = inv.userId?.fullName === profile.userId?.fullName;
                  return (
                    <div key={inv.id} className={`flex items-center gap-3 p-3 rounded-xl ${isMe ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800" : "bg-black/[0.02] dark:bg-white/[0.02]"}`} data-testid={`investor-item-${i}`}>
                      <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 shrink-0 flex items-center justify-center">
                        {inv.userId?.profilePhotoUrl ? <img src={inv.userId.profilePhotoUrl} className="w-full h-full object-cover" alt="" /> : <span className="text-base font-bold">{inv.userId?.fullName?.[0]}</span>}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-black dark:text-white">{inv.userId?.fullName} {isMe && "(أنت)"}</p>
                        {inv.userId?.jobTitle && <p className="text-xs text-black/40 dark:text-white/40">{inv.userId.jobTitle}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-black text-amber-600 dark:text-amber-400">{inv.stakePercentage}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Company Info */}
            {settings.companyNameAr && (
              <div className="border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-5 bg-white dark:bg-gray-900">
                <h3 className="font-bold text-black dark:text-white mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-blue-500" /> بيانات الشركة</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02]">
                    <p className="text-xs text-black/40 dark:text-white/40">اسم الشركة</p>
                    <p className="font-semibold text-black dark:text-white">{settings.companyNameAr}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02]">
                    <p className="text-xs text-black/40 dark:text-white/40">التقييم الكلي</p>
                    <p className="font-semibold text-black dark:text-white">{settings.systemValuation.toLocaleString("ar-SA")} {settings.currency}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {tab === "payments" && (
          <div className="space-y-3">
            {payLoading ? <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" /></div> : (
              payments.length === 0
                ? <div className="text-center py-16 text-sm text-black/30 dark:text-white/30"><DollarSign className="w-10 h-10 mx-auto mb-3 text-black/10 dark:text-white/10" />لا توجد دفعات — أرسل أول دفعة استثمارية</div>
                : payments.map(p => {
                  const cfg = STATUS_CONFIG[p.status];
                  return (
                    <div key={p.id} className="p-5 rounded-2xl border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900 flex items-start gap-4" data-testid={`payment-${p.id}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}><cfg.icon className="w-5 h-5" /></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xl font-black text-black dark:text-white">{p.amount.toLocaleString("ar-SA")} {p.currency}</span>
                          <Badge className={`text-[10px] px-2 py-0 border-0 ${cfg.color}`}>{cfg.label}</Badge>
                        </div>
                        <p className="text-xs text-black/30 dark:text-white/30 mt-0.5">{new Date(p.createdAt).toLocaleDateString("ar-SA")} · {PAYMENT_METHODS.find(m => m.value === p.paymentMethod)?.label || p.paymentMethod}</p>
                        {p.description && <p className="text-xs text-black/40 dark:text-white/40 mt-1 italic">"{p.description}"</p>}
                        {p.proofUrl && <a href={p.proofUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 underline mt-1 inline-block">عرض الإيصال</a>}
                        {p.adminNote && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 border-t border-black/[0.05] dark:border-white/[0.05] pt-1">ملاحظة: {p.adminNote}</p>}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        )}

        {/* Submit Tab */}
        {tab === "submit" && (
          <div className="border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-6 bg-white dark:bg-gray-900 space-y-5">
            <h3 className="font-bold text-black dark:text-white flex items-center gap-2"><Upload className="w-4 h-4 text-amber-500" /> إرسال دفعة استثمارية جديدة</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">المبلغ (ر.س)</label>
                <Input type="number" min={1} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="text-xl font-bold h-12" data-testid="input-amount" />
              </div>
              <div>
                <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">طريقة الدفع</label>
                <select value={method} onChange={e => setMethod(e.target.value)}
                  className="w-full h-12 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent text-sm text-black dark:text-white"
                  data-testid="select-method">
                  {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">وصف أو ملاحظة</label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="اكتب وصفاً للدفعة..." data-testid="input-description" />
            </div>

            {/* Proof Upload */}
            <div>
              <label className="text-xs text-black/40 dark:text-white/40 mb-1.5 block">إيصال الدفع (صورة أو PDF)</label>
              <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={e => setProofFile(e.target.files?.[0] || null)} className="hidden" data-testid="input-proof-file" />
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" className="gap-2" onClick={() => fileRef.current?.click()} data-testid="btn-upload-proof">
                  <Upload className="w-4 h-4" />{proofFile ? "تغيير الملف" : "رفع الإيصال"}
                </Button>
                {proofFile && <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" />{proofFile.name}</span>}
              </div>
            </div>

            {/* Signature */}
            <div>
              <label className="text-xs text-black/40 dark:text-white/40 mb-1.5 block font-semibold flex items-center gap-1.5"><Pen className="w-3.5 h-3.5" />التوقيع الإلكتروني</label>
              <SignaturePad onChange={setSignatureData} />
              <div className="mt-3">
                <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">الاسم مكتوباً (كنسخة احتياطية)</label>
                <Input value={signatureText} onChange={e => setSignatureText(e.target.value)} placeholder="اكتب اسمك الكامل..." data-testid="input-sig-text" />
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
              <Lock className="w-4 h-4 mt-0.5 shrink-0" />
              <p>بالإرسال تؤكد صحة المعلومات المدخلة. الدفعة ستُراجع وتُوافق عليها من قبل الإدارة قبل احتسابها.</p>
            </div>

            <Button
              onClick={() => submitMutation.mutate()}
              disabled={!amount || parseFloat(amount) <= 0 || submitMutation.isPending || (!signatureData && !signatureText)}
              className="w-full gap-2 bg-gradient-to-l from-amber-500 to-yellow-400 text-white h-12 text-base font-bold shadow-lg shadow-amber-500/20"
              data-testid="btn-submit-payment"
            >
              {submitMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <DollarSign className="w-5 h-5" />}
              {submitMutation.isPending ? "جارٍ الإرسال..." : "إرسال الدفعة"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
