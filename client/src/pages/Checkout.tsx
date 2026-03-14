import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SARIcon from "@/components/SARIcon";
import PayPalCheckoutButton from "@/components/PayPalCheckoutButton";
import {
  MapPin, CreditCard, CheckCircle2, ArrowRight, ArrowLeft,
  Wallet, Building2, Loader2, Tag, X, Check, ChevronDown,
  Copy, Phone, User, Navigation as NavIcon, Clock, Calendar,
  AlertCircle, Upload, FileText, Lock, Eye, EyeOff, Sparkles,
  Package, ShoppingBag, Truck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SAUDI_CITIES = [
  "الرياض", "جدة", "مكة المكرمة", "المدينة المنورة", "الدمام", "الخبر",
  "الطائف", "تبوك", "أبها", "نجران", "جازان", "بريدة", "حائل",
  "ينبع", "القطيف", "الجبيل", "حفر الباطن", "عرعر", "سكاكا", "بيشة",
  "خميس مشيط", "الأحساء", "المجمعة", "الزلفي", "عنيزة"
];

type Step = 1 | 2 | 3;
type PayMethod = "wallet" | "card" | "bank" | "paypal";

interface AddressData {
  recipientName: string;
  recipientPhone: string;
  city: string;
  district: string;
  street: string;
  nationalAddressId: string;
  lat?: number;
  lng?: number;
}

interface UpFile { url: string; filename: string; }

const STEP_LABELS = [
  { id: 1, label: "عنوان الاستلام", icon: MapPin },
  { id: 2, label: "طريقة الدفع",   icon: CreditCard },
  { id: 3, label: "تأكيد الطلب",   icon: CheckCircle2 },
];

function StepBar({ step }: { step: Step }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8 select-none">
      {STEP_LABELS.map((s, i) => {
        const done = step > s.id;
        const active = step === s.id;
        const Icon = s.icon;
        return (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                done ? "bg-green-500 border-green-500 text-white"
                  : active ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-black/10 text-black/30"
              }`}>
                {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-[10px] font-bold whitespace-nowrap ${active ? "text-blue-600" : done ? "text-green-600" : "text-black/30"}`}>{s.label}</span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={`w-16 h-0.5 mb-4 mx-1 rounded-full ${done ? "bg-green-400" : "bg-black/10"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function CardVisual({ cardNumber, name }: { cardNumber: string; name: string }) {
  const masked = cardNumber ? `**** **** **** ${cardNumber.slice(-4)}` : "**** **** **** ****";
  return (
    <div className="relative rounded-2xl overflow-hidden text-white p-5 select-none" style={{
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
    }}>
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #60a5fa, transparent)", transform: "translate(30%, -30%)" }} />
      <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #818cf8, transparent)", transform: "translate(-30%, 30%)" }} />
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6">
          <span className="font-black text-lg tracking-widest">QIROX</span>
          <CreditCard className="w-8 h-8 opacity-70" />
        </div>
        <p className="font-mono text-xl tracking-[4px] mb-4 opacity-90">{masked}</p>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[9px] opacity-50 uppercase tracking-wider mb-0.5">حامل البطاقة</p>
            <p className="text-sm font-bold opacity-90 truncate max-w-[160px]">{name}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] opacity-50 uppercase tracking-wider mb-0.5">نوع البطاقة</p>
            <p className="text-xs font-bold opacity-80">Debit</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Checkout() {
  const [, navigate] = useLocation();
  const { data: user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const proofRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(1);

  const [addr, setAddr] = useState<AddressData>({
    recipientName: "", recipientPhone: "", city: "", district: "", street: "", nationalAddressId: ""
  });
  const [geoLoading, setGeoLoading] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const [payMethod, setPayMethod] = useState<PayMethod>("bank");
  const [walletPin, setWalletPin] = useState("");
  const [showWalletPin, setShowWalletPin] = useState(false);
  const [walletUse, setWalletUse] = useState(0);
  const [cardPin, setCardPin] = useState("");
  const [showCardPin, setShowCardPin] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [proofFile, setProofFile] = useState<UpFile | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [paypalDone, setPaypalDone] = useState(false);
  const [copiedIban, setCopiedIban] = useState(false);

  const [orderId, setOrderId] = useState("");
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderPayMethod, setOrderPayMethod] = useState<PayMethod>("bank");

  const [selectedShippingCompanyId, setSelectedShippingCompanyId] = useState<string>("");

  const { data: cart } = useQuery<any>({ queryKey: ["/api/cart"] });
  const { data: walletData } = useQuery<any>({ queryKey: ["/api/wallet"], enabled: !!user });
  const { data: cardData } = useQuery<any>({ queryKey: ["/api/wallet/card"], enabled: !!user });
  const { data: bankSettings } = useQuery<any>({ queryKey: ["/api/bank-settings"] });
  const { data: shippingCompanies } = useQuery<any[]>({ queryKey: ["/api/shipping-companies"] });

  const wizardData = (() => { try { const s = sessionStorage.getItem("qiroxWizardData"); return s ? JSON.parse(s) : null; } catch { return null; } })();

  const walletBalance = walletData ? Math.max(0, walletData.totalCredit - walletData.totalDebit) : 0;
  const cartItems: any[] = cart?.items || [];
  const hasWizardData = !!wizardData && cartItems.length === 0;
  const items: any[] = hasWizardData
    ? [{ name: wizardData.planTier, nameAr: `باقة ${wizardData.planTier}`, price: wizardData.grandTotal || wizardData.planPrice || 0, qty: 1, type: "plan" }]
    : cartItems;
  const discount = cart?.discountAmount || 0;
  const subtotal = hasWizardData ? (wizardData.grandTotal || 0) : items.reduce((s: number, i: any) => s + (i.price || 0) * (i.qty || 1), 0);

  const hasPhysicalItems = !hasWizardData && items.some((i: any) => i.type === "product" || i.type === "gift");
  const activeShippingCos: any[] = shippingCompanies || [];
  const selectedShippingCo = activeShippingCos.find(c => (c._id || c.id) === selectedShippingCompanyId) || null;
  const shippingFee = hasPhysicalItems && selectedShippingCo
    ? (selectedShippingCo.basePrice || 0)
    : 0;

  const total = Math.max(0, subtotal - (hasWizardData ? 0 : discount) + shippingFee);

  const BANK = bankSettings || { bankName: "بنك الراجحي", beneficiaryName: "QIROX Studio", iban: "SA0380205098017222121010" };

  useEffect(() => {
    if (user) {
      setAddr(prev => ({
        ...prev,
        recipientName: prev.recipientName || (user as any).fullName || "",
        recipientPhone: prev.recipientPhone || (user as any).phone || (user as any).whatsappNumber || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    if (walletBalance > 0 && walletBalance >= total) setPayMethod("wallet");
    else if (cardData?.cardActive) setPayMethod("card");
    else setPayMethod("bank");
  }, [walletBalance, cardData, total]);

  const handleGeolocate = async () => {
    if (!navigator.geolocation) { toast({ title: "المتصفح لا يدعم الموقع الجغرافي", variant: "destructive" }); return; }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      setAddr(prev => ({ ...prev, lat, lng }));
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`);
        const data = await res.json();
        const address = data.address || {};
        setAddr(prev => ({
          ...prev, lat, lng,
          city: prev.city || address.city || address.town || address.county || "",
          district: prev.district || address.suburb || address.neighbourhood || "",
          street: prev.street || address.road || address.street || "",
        }));
      } catch { /* ignore, coordinates still set */ }
      setGeoLoading(false);
    }, () => { toast({ title: "تعذّر الحصول على موقعك", variant: "destructive" }); setGeoLoading(false); });
  };

  const couponMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/cart/apply-coupon", { couponCode: couponCode.toUpperCase().trim() }).then(r => r.json()),
    onSuccess: () => { setCouponApplied(true); queryClient.invalidateQueries({ queryKey: ["/api/cart"] }); toast({ title: "✅ تم تطبيق كوبون الخصم" }); },
    onError: (e: any) => toast({ title: e?.message || "كود خصم غير صالح", variant: "destructive" }),
  });

  const handleProofUpload = async (file: File) => {
    setUploadingProof(true);
    const fd = new FormData(); fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (data.url) setProofFile({ url: data.url, filename: file.name });
      else throw new Error("فشل الرفع");
    } catch { toast({ title: "فشل رفع الملف", variant: "destructive" }); }
    setUploadingProof(false);
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      const effWallet = payMethod === "wallet" ? Math.min(walletUse || total, walletBalance) : 0;
      const fullyWallet = payMethod === "wallet" && effWallet >= total - 0.01;
      const method = fullyWallet ? "wallet" : payMethod === "paypal" ? "paypal" : payMethod === "card" ? "wallet" : "bank_transfer";
      const addressLine = `الشحن: ${addr.recipientName} — ${addr.recipientPhone} — ${addr.city} — ${addr.district} — ${addr.street}`;
      const meetingLine = wizardData?.meetingSlots?.length
        ? `موعد الاجتماع: ${wizardData.meetingSlots.join(" / ")} — أيام: ${wizardData.meetingDays?.join(" / ") || ""}`
        : "";
      const notes = [addressLine, meetingLine].filter(Boolean).join(" | ");
      const orderItems = hasWizardData
        ? [{ type: "plan", name: wizardData.planTier, nameAr: `باقة ${wizardData.planTier}`, price: wizardData.grandTotal || wizardData.planPrice || 0, qty: 1 },
           ...(wizardData.selectedAddons || []).map((id: string) => ({ type: "addon", name: id, nameAr: id, price: 0, qty: 1 }))]
        : items.map((i: any) => ({ id: i._id || i.id, type: i.type, name: i.name, nameAr: i.nameAr, price: i.price, qty: i.qty, config: i.config, imageUrl: i.imageUrl }));
      const r = await apiRequest("POST", "/api/orders", {
        projectType: hasWizardData ? (wizardData.formData?.sector || wizardData.planTier) : (items[0]?.nameAr || items[0]?.name || "طلب من السلة"),
        sector: hasWizardData ? (wizardData.formData?.sector || "general") : "general",
        businessName: hasWizardData ? (wizardData.businessName || wizardData.formData?.businessName || (user as any)?.businessName || "") : ((user as any)?.businessName || (user as any)?.fullName || ""),
        phone: addr.recipientPhone || (user as any)?.phone || "",
        totalAmount: parseFloat(total.toFixed(2)),
        items: orderItems,
        paymentMethod: method,
        notes,
        files: hasWizardData ? wizardData.uploadedFiles : undefined,
        shippingAddress: { name: addr.recipientName, phone: addr.recipientPhone, city: addr.city, address: `${addr.district} ${addr.street}`.trim(), nationalAddressId: addr.nationalAddressId },
        ...(hasPhysicalItems && selectedShippingCo ? {
          shippingCompanyId: selectedShippingCompanyId,
          shippingCompanyName: selectedShippingCo.nameAr || selectedShippingCo.name,
          shippingFee: parseFloat(shippingFee.toFixed(2)),
        } : {}),
        walletAmountUsed: effWallet > 0 ? parseFloat(effWallet.toFixed(2)) : undefined,
        walletPayPin: (payMethod === "wallet" || payMethod === "card") && walletPin ? walletPin : cardPin || undefined,
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.message || err.error || "فشل إرسال الطلب");
      }
      return r.json();
    },
    onSuccess: async (data) => {
      setOrderId(data.id || data._id || "");
      setOrderTotal(total);
      setOrderPayMethod(payMethod);
      try {
        if (!hasWizardData) await apiRequest("DELETE", "/api/cart");
        sessionStorage.removeItem("qiroxWizardData");
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
        queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      } catch { /* ok */ }
      setStep(3);
    },
    onError: (e: any) => toast({ title: e?.message || "فشل إرسال الطلب", variant: "destructive" }),
  });

  const proofMutation = useMutation({
    mutationFn: () => proofFile ? apiRequest("PATCH", `/api/orders/${orderId}/proof`, { paymentProofUrl: proofFile.url }).then(r => r.json()) : Promise.reject("لا يوجد ملف"),
    onSuccess: () => { toast({ title: "✅ تم رفع الإيصال بنجاح. سيتم التحقق خلال 24 ساعة" }); queryClient.invalidateQueries({ queryKey: ["/api/orders"] }); },
    onError: () => toast({ title: "فشل رفع الإيصال", variant: "destructive" }),
  });

  const canProceedStep1 = !!(addr.recipientName.trim() && addr.recipientPhone.trim() && addr.city)
    && (!hasPhysicalItems || !!selectedShippingCompanyId);
  const canProceedStep2 = (payMethod === "bank") || (payMethod === "paypal" && paypalDone) ||
    (payMethod === "wallet") || (payMethod === "card" && !!cardPin);

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-black/40">يجب تسجيل الدخول أولاً</p>
    </div>
  );

  if (items.length === 0 && !wizardData && step < 3) return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
        <ShoppingBag className="w-16 h-16 text-black/15" />
        <h2 className="text-2xl font-black text-black/40">السلة فارغة</h2>
        <p className="text-black/30 text-sm">أضف منتجات إلى سلة التسوق أولاً</p>
        <Button onClick={() => navigate("/prices")} className="gap-2"><Package className="w-4 h-4" /> تصفح الباقات</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50" dir="rtl">
      <Navigation />
      <div className="flex-1 w-full max-w-2xl mx-auto px-4 py-8">
        {step < 3 && <StepBar step={step} />}

        <AnimatePresence mode="wait">
          {/* ─── STEP 1: ADDRESS ─── */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
              <div className="bg-white rounded-3xl shadow-sm border border-black/[0.06] p-6 space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 mb-3">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-black text-black">عنوان الاستلام</h2>
                  <p className="text-black/40 text-sm mt-1">أدخل بيانات المستلم والعنوان</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-black/50 flex items-center gap-1"><User className="w-3 h-3" /> اسم المستلم *</Label>
                    <Input value={addr.recipientName} onChange={e => setAddr(p => ({ ...p, recipientName: e.target.value }))}
                      placeholder="الاسم الكامل" className="rounded-xl" data-testid="input-recipient-name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-black/50 flex items-center gap-1"><Phone className="w-3 h-3" /> رقم الجوال *</Label>
                    <Input value={addr.recipientPhone} onChange={e => setAddr(p => ({ ...p, recipientPhone: e.target.value }))}
                      placeholder="05xxxxxxxx" dir="ltr" className="rounded-xl" data-testid="input-recipient-phone" />
                  </div>
                </div>

                <div className="space-y-1.5 relative">
                  <Label className="text-xs font-bold text-black/50">المدينة *</Label>
                  <button
                    onClick={() => setCityOpen(o => !o)}
                    className="w-full flex items-center justify-between px-4 py-2.5 border border-black/10 rounded-xl bg-white hover:bg-gray-50 transition-all text-sm"
                    data-testid="button-city-select"
                  >
                    <span className={addr.city ? "text-black" : "text-black/30"}>{addr.city || "اختر المدينة"}</span>
                    <ChevronDown className={`w-4 h-4 text-black/30 transition-transform ${cityOpen ? "rotate-180" : ""}`} />
                  </button>
                  {cityOpen && (
                    <div className="absolute z-20 right-0 left-0 top-full mt-1 bg-white border border-black/10 rounded-2xl shadow-xl overflow-auto max-h-48">
                      {SAUDI_CITIES.map(c => (
                        <button key={c} onClick={() => { setAddr(p => ({ ...p, city: c })); setCityOpen(false); }}
                          className={`w-full text-right px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${addr.city === c ? "font-bold text-blue-600" : "text-black"}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-black/50">الحي / المنطقة</Label>
                    <Input value={addr.district} onChange={e => setAddr(p => ({ ...p, district: e.target.value }))}
                      placeholder="حي النخيل" className="rounded-xl" data-testid="input-district" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-black/50">الشارع والرقم</Label>
                    <Input value={addr.street} onChange={e => setAddr(p => ({ ...p, street: e.target.value }))}
                      placeholder="شارع الملك فهد" className="rounded-xl" data-testid="input-street" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-black/50 flex items-center gap-1.5">
                    <span>العنوان الوطني</span>
                    <span className="text-[10px] text-black/25 font-normal">(اختياري — 12 رمزاً من أبشر)</span>
                  </Label>
                  <Input value={addr.nationalAddressId} onChange={e => setAddr(p => ({ ...p, nationalAddressId: e.target.value.toUpperCase().slice(0, 12) }))}
                    placeholder="مثال: RIAD123456" dir="ltr" maxLength={12}
                    className="rounded-xl font-mono tracking-widest" data-testid="input-national-address" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-black/50 flex items-center gap-1"><NavIcon className="w-3 h-3" /> اختر موقعك على الخريطة</Label>
                    <Button size="sm" variant="outline" onClick={handleGeolocate} disabled={geoLoading}
                      className="text-xs h-7 gap-1.5 rounded-lg" data-testid="button-geolocate">
                      {geoLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <NavIcon className="w-3 h-3" />}
                      موقعي الحالي
                    </Button>
                  </div>
                  {addr.lat && addr.lng ? (
                    <div className="rounded-2xl overflow-hidden border border-black/[0.06]">
                      <iframe
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${addr.lng - 0.005},${addr.lat - 0.005},${addr.lng + 0.005},${addr.lat + 0.005}&layer=mapnik&marker=${addr.lat},${addr.lng}`}
                        width="100%" height="200" style={{ border: 0 }} loading="lazy"
                        title="خريطة الموقع"
                      />
                    </div>
                  ) : (
                    <div className="h-20 flex items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-black/10">
                      <p className="text-xs text-black/25">اضغط "موقعي الحالي" لعرض الخريطة</p>
                    </div>
                  )}
                </div>

                {/* ── Shipping Company Selector ── */}
                {hasPhysicalItems && (
                  <div className="bg-white rounded-3xl border border-black/[0.06] overflow-hidden">
                    <div className="px-5 py-4 bg-gray-50 border-b border-black/[0.05] flex items-center gap-2">
                      <Truck className="w-4 h-4 text-black/40" />
                      <span className="text-xs font-black text-black/40 uppercase tracking-wider">طريقة التوصيل</span>
                      {!selectedShippingCompanyId && (
                        <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">مطلوب</span>
                      )}
                    </div>
                    {activeShippingCos.length === 0 ? (
                      <div className="px-5 py-6 text-center">
                        <Truck className="w-8 h-8 mx-auto text-black/15 mb-2" />
                        <p className="text-sm text-black/40">لا توجد شركات شحن متاحة حالياً</p>
                        <p className="text-xs text-black/25 mt-1">يرجى التواصل مع الدعم لترتيب التوصيل</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-black/[0.04]">
                        {activeShippingCos.map(co => {
                          const coId = co._id || co.id;
                          const isSelected = selectedShippingCompanyId === coId;
                          return (
                            <button key={coId} onClick={() => setSelectedShippingCompanyId(coId)}
                              data-testid={`shipping-company-${coId}`}
                              className={`w-full text-right px-5 py-4 flex items-center gap-3 transition-all ${
                                isSelected
                                  ? "bg-blue-50 border-r-4 border-blue-500"
                                  : "hover:bg-gray-50"
                              }`}>
                              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 border ${isSelected ? "border-blue-200 bg-blue-100" : "border-black/[0.06] bg-gray-50"}`}>
                                {co.logo || "🚚"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`font-bold text-sm ${isSelected ? "text-blue-700" : "text-black"}`}>{co.nameAr || co.name}</p>
                                <p className="text-[11px] text-black/40 mt-0.5 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />{co.estimatedDays || "2-4 أيام عمل"}
                                </p>
                              </div>
                              <div className="text-left shrink-0">
                                {(co.basePrice || 0) === 0 ? (
                                  <p className="font-black text-emerald-600 text-sm">مجاني</p>
                                ) : (
                                  <p className={`font-black text-sm flex items-center gap-1 ${isSelected ? "text-blue-700" : "text-black"}`}>
                                    {(co.basePrice || 0).toLocaleString()} <SARIcon size={10} className="opacity-60" />
                                  </p>
                                )}
                                {isSelected && <Check className="w-4 h-4 text-blue-500 mr-auto mt-0.5" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  className="w-full h-13 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-base gap-2 shadow-lg shadow-blue-600/20"
                  data-testid="button-next-payment"
                >
                  التالي: طريقة الدفع
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 2: PAYMENT ─── */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
              <div className="space-y-4">

                {/* Order Summary */}
                <div className="bg-white rounded-3xl shadow-sm border border-black/[0.06] overflow-hidden">
                  <div className="px-5 py-4 bg-gray-50 border-b border-black/[0.05] flex items-center gap-2">
                    <Package className="w-4 h-4 text-black/40" />
                    <span className="text-xs font-black text-black/40 uppercase tracking-wider">ملخص الطلب</span>
                  </div>
                  <div className="divide-y divide-black/[0.04]">
                    {items.map((item: any, i: number) => (
                      <div key={i} className="px-5 py-3 flex items-center gap-3">
                        {item.imageUrl && <img src={item.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-black truncate">{item.nameAr || item.name}</p>
                          {item.qty > 1 && <p className="text-xs text-black/30">× {item.qty}</p>}
                        </div>
                        <p className="text-sm font-bold text-black shrink-0 flex items-center gap-1">
                          {((item.price || 0) * (item.qty || 1)).toLocaleString()} <SARIcon size={10} className="opacity-50" />
                        </p>
                      </div>
                    ))}
                    {discount > 0 && (
                      <div className="px-5 py-3 flex justify-between items-center">
                        <span className="text-sm text-green-600 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> كوبون خصم</span>
                        <span className="text-sm font-bold text-green-600 flex items-center gap-1">
                          -{discount.toLocaleString()} <SARIcon size={10} />
                        </span>
                      </div>
                    )}
                    {hasPhysicalItems && selectedShippingCo && (
                      <div className="px-5 py-3 flex justify-between items-center">
                        <span className="text-sm text-black/60 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5" />
                          رسوم الشحن — {selectedShippingCo.nameAr || selectedShippingCo.name}
                        </span>
                        <span className="text-sm font-bold text-black flex items-center gap-1">
                          {shippingFee === 0
                            ? <span className="text-emerald-600">مجاني</span>
                            : <>{shippingFee.toLocaleString()} <SARIcon size={10} /></>
                          }
                        </span>
                      </div>
                    )}
                    <div className="px-5 py-4 flex justify-between items-center bg-gray-50">
                      <span className="font-black text-black">الإجمالي</span>
                      <span className="font-black text-xl text-black flex items-center gap-1.5">
                        {total.toLocaleString()} <SARIcon size={13} className="opacity-70" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Coupon Code */}
                {!couponApplied && !discount && (
                  <div className="bg-white rounded-2xl border border-black/[0.06] p-4">
                    <Label className="text-xs font-bold text-black/50 flex items-center gap-1.5 mb-2"><Tag className="w-3.5 h-3.5" /> كوبون الخصم</Label>
                    <div className="flex gap-2">
                      <Input value={couponCode} onChange={e => setCouponCode(e.target.value)}
                        placeholder="أدخل الكود هنا" dir="ltr"
                        className="rounded-xl flex-1 uppercase" data-testid="input-coupon" />
                      <Button size="sm" variant="outline" onClick={() => couponMutation.mutate()}
                        disabled={!couponCode.trim() || couponMutation.isPending}
                        className="rounded-xl px-4" data-testid="button-apply-coupon">
                        {couponMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "تطبيق"}
                      </Button>
                    </div>
                  </div>
                )}
                {(couponApplied || discount > 0) && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-sm text-green-700">
                    <Check className="w-4 h-4 shrink-0" />
                    كوبون «{cart?.couponCode}» مطبّق — وفّرت {discount.toLocaleString()} ر.س
                  </div>
                )}

                {/* Payment Methods */}
                <div className="bg-white rounded-3xl shadow-sm border border-black/[0.06] overflow-hidden">
                  <div className="px-5 py-4 bg-gray-50 border-b border-black/[0.05]">
                    <span className="text-xs font-black text-black/40 uppercase tracking-wider">اختر طريقة الدفع</span>
                  </div>
                  <div className="p-4 space-y-3">

                    {/* Wallet */}
                    {walletBalance > 0 && (
                      <button
                        onClick={() => setPayMethod("wallet")}
                        className={`w-full text-right rounded-2xl p-4 border-2 transition-all ${payMethod === "wallet" ? "border-blue-600 bg-blue-50" : "border-black/[0.07] hover:border-black/20"}`}
                        data-testid="button-pay-wallet"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${payMethod === "wallet" ? "bg-blue-600" : "bg-black/[0.05]"}`}>
                            <Wallet className={`w-5 h-5 ${payMethod === "wallet" ? "text-white" : "text-black/40"}`} />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-sm text-black">الدفع من الرصيد</p>
                            <p className="text-xs text-black/40">رصيدك: {walletBalance.toLocaleString()} ر.س</p>
                          </div>
                          {payMethod === "wallet" && <Check className="w-5 h-5 text-blue-600 shrink-0" />}
                        </div>
                        {payMethod === "wallet" && walletBalance < total && (
                          <div className="mt-3 pt-3 border-t border-blue-100">
                            <p className="text-xs text-orange-600 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              رصيدك غير كافٍ. سيتم خصم {walletBalance.toLocaleString()} ر.س والباقي {(total - walletBalance).toLocaleString()} ر.س بطريقة أخرى
                            </p>
                          </div>
                        )}
                        {payMethod === "wallet" && (
                          <div className="mt-3 pt-3 border-t border-blue-100 space-y-2">
                            <Label className="text-xs font-bold text-black/50 flex items-center gap-1"><Lock className="w-3 h-3" /> رمز المحفظة</Label>
                            <div className="relative">
                              <Input
                                type={showWalletPin ? "text" : "password"}
                                value={walletPin}
                                onChange={e => setWalletPin(e.target.value)}
                                placeholder="أدخل رمز المحفظة"
                                className="rounded-xl pr-10"
                                data-testid="input-wallet-pin"
                              />
                              <button onClick={() => setShowWalletPin(p => !p)} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60">
                                {showWalletPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        )}
                      </button>
                    )}

                    {/* Qirox Card */}
                    {cardData?.cardActive && (
                      <button
                        onClick={() => setPayMethod("card")}
                        className={`w-full text-right rounded-2xl p-4 border-2 transition-all ${payMethod === "card" ? "border-blue-600 bg-blue-50" : "border-black/[0.07] hover:border-black/20"}`}
                        data-testid="button-pay-card"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${payMethod === "card" ? "bg-blue-600" : "bg-black/[0.05]"}`}>
                            <CreditCard className={`w-5 h-5 ${payMethod === "card" ? "text-white" : "text-black/40"}`} />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-sm text-black">بطاقة Qirox</p>
                            <p className="text-xs text-black/40">بطاقتك الرقمية</p>
                          </div>
                          {payMethod === "card" && <Check className="w-5 h-5 text-blue-600 shrink-0" />}
                        </div>
                        {payMethod === "card" && (
                          <div className="mt-4 space-y-3" onClick={e => e.stopPropagation()}>
                            <CardVisual cardNumber={cardData.cardNumber || ""} name={(user as any)?.fullName || ""} />
                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold text-black/50 flex items-center gap-1"><Lock className="w-3 h-3" /> الرقم السري للبطاقة</Label>
                              <div className="relative">
                                <Input
                                  type={showCardPin ? "text" : "password"}
                                  value={cardPin}
                                  onChange={e => setCardPin(e.target.value)}
                                  placeholder="أدخل الرقم السري"
                                  className="rounded-xl pr-10"
                                  data-testid="input-card-pin"
                                />
                                <button onClick={() => setShowCardPin(p => !p)} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60">
                                  {showCardPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </button>
                    )}

                    {/* Bank Transfer */}
                    <button
                      onClick={() => setPayMethod("bank")}
                      className={`w-full text-right rounded-2xl p-4 border-2 transition-all ${payMethod === "bank" ? "border-blue-600 bg-blue-50" : "border-black/[0.07] hover:border-black/20"}`}
                      data-testid="button-pay-bank"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${payMethod === "bank" ? "bg-blue-600" : "bg-black/[0.05]"}`}>
                          <Building2 className={`w-5 h-5 ${payMethod === "bank" ? "text-white" : "text-black/40"}`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm text-black">تحويل بنكي</p>
                          <p className="text-xs text-black/40">{BANK.bankName}</p>
                        </div>
                        {payMethod === "bank" && <Check className="w-5 h-5 text-blue-600 shrink-0" />}
                      </div>
                      {payMethod === "bank" && (
                        <div className="mt-4 pt-4 border-t border-blue-100 space-y-3" onClick={e => e.stopPropagation()}>
                          <div className="bg-white rounded-xl border border-blue-200 p-3 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-black/40">البنك</span>
                              <span className="text-xs font-bold text-black">{BANK.bankName}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-black/40">المستفيد</span>
                              <span className="text-xs font-bold text-black">{BANK.beneficiaryName}</span>
                            </div>
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-xs text-black/40 shrink-0">IBAN</span>
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-mono font-bold text-black truncate" dir="ltr">{BANK.iban}</span>
                                <button
                                  onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(BANK.iban || ""); setCopiedIban(true); setTimeout(() => setCopiedIban(false), 2000); }}
                                  className="shrink-0 p-1.5 rounded-lg bg-black/[0.05] hover:bg-black/10 transition-colors"
                                  data-testid="button-copy-iban"
                                >
                                  {copiedIban ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-black/40" />}
                                </button>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-black/40">المبلغ</span>
                              <span className="text-sm font-black text-black flex items-center gap-1">{total.toLocaleString()} <SARIcon size={10} /></span>
                            </div>
                          </div>
                        </div>
                      )}
                    </button>

                    {/* PayPal */}
                    <button
                      onClick={() => setPayMethod("paypal")}
                      className={`w-full text-right rounded-2xl p-4 border-2 transition-all ${payMethod === "paypal" ? "border-blue-600 bg-blue-50" : "border-black/[0.07] hover:border-black/20"}`}
                      data-testid="button-pay-paypal"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${payMethod === "paypal" ? "bg-blue-600" : "bg-black/[0.05]"}`}>
                          <span className={`text-base font-black ${payMethod === "paypal" ? "text-white" : "text-black/40"}`}>P</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm text-black">PayPal</p>
                          <p className="text-xs text-black/40">دفع آمن عبر PayPal</p>
                        </div>
                        {payMethod === "paypal" && <Check className="w-5 h-5 text-blue-600 shrink-0" />}
                      </div>
                      {payMethod === "paypal" && (
                        <div className="mt-4 pt-4 border-t border-blue-100" onClick={e => e.stopPropagation()}>
                          <PayPalCheckoutButton
                            amount={total}
                            items={items.map((i: any) => ({ name: i.name || i.nameAr, unit_amount: { currency_code: "USD", value: (i.price / 3.75).toFixed(2) }, quantity: String(i.qty || 1) }))}
                            description={`QIROX Order — ${items.length} items`}
                            metadata={{ shipping: addr, walletUsed: 0 }}
                            onApprove={() => setPaypalDone(true)}
                          />
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 rounded-2xl gap-2" data-testid="button-back-address">
                    <ArrowRight className="w-4 h-4" /> السابق
                  </Button>
                  <Button
                    onClick={() => submitMutation.mutate()}
                    disabled={!canProceedStep2 || submitMutation.isPending}
                    className="flex-[2] h-12 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black gap-2 shadow-lg shadow-green-600/20"
                    data-testid="button-confirm-order"
                  >
                    {submitMutation.isPending
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الإرسال...</>
                      : <><Sparkles className="w-4 h-4" /> تأكيد الطلب</>}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 3: CONFIRMATION ─── */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
              {orderPayMethod === "bank" ? (
                /* Waiting for bank transfer confirmation */
                <div className="bg-white rounded-3xl shadow-sm border border-black/[0.06] p-8 text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-50 border-4 border-amber-100">
                    <Clock className="w-10 h-10 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-black mb-2">في انتظار تأكيد التحويل</h2>
                    <p className="text-black/50 text-sm">تم إنشاء طلبك. حوّل المبلغ ثم ارفع إيصال التحويل</p>
                    {orderId && (
                      <div className="mt-3 inline-flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2">
                        <span className="text-xs text-black/40">رقم الطلب</span>
                        <span className="text-sm font-mono font-black text-black">#{orderId.slice(-8).toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-right space-y-2">
                    <p className="text-sm font-bold text-amber-800">تعليمات التحويل:</p>
                    <div className="space-y-1 text-xs text-amber-700">
                      <p>1. حوّل مبلغ <strong>{orderTotal.toLocaleString()} ر.س</strong> إلى حساب {BANK.bankName}</p>
                      <p>2. IBAN: <span dir="ltr" className="font-mono">{BANK.iban}</span></p>
                      <p>3. ارفع إيصال التحويل هنا للتحقق السريع</p>
                    </div>
                  </div>
                  {/* Upload receipt */}
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-black/60">ارفع إيصال التحويل (اختياري — لتسريع التحقق)</p>
                    {!proofFile ? (
                      <div
                        onClick={() => proofRef.current?.click()}
                        className="border-2 border-dashed border-black/10 rounded-2xl p-6 cursor-pointer hover:border-black/25 hover:bg-gray-50 transition-all text-center"
                        data-testid="upload-proof"
                      >
                        <Upload className="w-6 h-6 text-black/20 mx-auto mb-2" />
                        <p className="text-sm text-black/30">{uploadingProof ? "جارٍ الرفع..." : "اضغط لرفع الإيصال"}</p>
                        <input ref={proofRef} type="file" className="hidden" accept="image/*,application/pdf"
                          onChange={e => { if (e.target.files?.[0]) handleProofUpload(e.target.files[0]); }} />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
                        <FileText className="w-5 h-5 text-green-600 shrink-0" />
                        <span className="text-sm text-green-700 flex-1 truncate">{proofFile.filename}</span>
                        <button onClick={() => setProofFile(null)} className="text-green-400 hover:text-green-700"><X className="w-4 h-4" /></button>
                      </div>
                    )}
                    {proofFile && (
                      <Button onClick={() => proofMutation.mutate()} disabled={proofMutation.isPending || proofMutation.isSuccess}
                        className="w-full h-11 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold gap-2" data-testid="button-submit-proof">
                        {proofMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : proofMutation.isSuccess ? <><Check className="w-4 h-4" /> تم رفع الإيصال</> : <><Upload className="w-4 h-4" /> إرسال الإيصال</>}
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => navigate("/orders")} className="flex-1 rounded-2xl h-11 gap-1.5 text-sm" data-testid="button-track-order">
                      <Calendar className="w-4 h-4" /> تتبع الطلب
                    </Button>
                    <Button onClick={() => navigate("/dashboard")} className="flex-1 rounded-2xl h-11 gap-1.5 text-sm bg-black text-white hover:bg-black/80" data-testid="button-dashboard">
                      لوحة التحكم
                    </Button>
                  </div>
                </div>
              ) : (
                /* Success */
                <div className="bg-white rounded-3xl shadow-sm border border-black/[0.06] p-8 text-center space-y-6">
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12 }}
                    className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-50 border-4 border-green-100"
                  >
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-black text-black mb-2">🎉 تم الدفع بنجاح!</h2>
                    <p className="text-black/50 text-sm">سيتواصل معك فريق QIROX قريباً</p>
                    {orderId && (
                      <div className="mt-3 inline-flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2">
                        <span className="text-xs text-black/40">رقم الطلب</span>
                        <span className="text-sm font-mono font-black text-black">#{orderId.slice(-8).toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                    <p className="text-sm text-blue-700">سيتم إرسال تأكيد الدفع على بريدك الإلكتروني. ستتلقى تحديثات تلقائية عبر الإشعارات.</p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => navigate("/orders")} className="flex-1 rounded-2xl h-11 gap-1.5 text-sm" data-testid="button-track-order">
                      <Calendar className="w-4 h-4" /> تتبع الطلب
                    </Button>
                    <Button onClick={() => navigate("/dashboard")} className="flex-1 rounded-2xl h-11 gap-1.5 text-sm bg-black text-white hover:bg-black/80" data-testid="button-go-dashboard">
                      لوحة التحكم
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
}
