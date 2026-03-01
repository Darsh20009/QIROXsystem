import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2, ShoppingCart, Trash2, Plus, Minus, Globe, Mail, Server,
  Cpu, Gift, Code2, Package, Database, Cloud, CheckCircle2, ArrowLeft,
  ShoppingBag, Tag, Phone, ChevronLeft, Sparkles, Shield, Clock3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Link } from "wouter";
import type { Cart, CartItem } from "@shared/schema";
import { useUser } from "@/hooks/use-auth";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

/* ─── Type meta ─────────────────────────────────────────────────── */
const typeIcons: Record<string, any> = {
  service: Code2, product: Cpu, domain: Globe, email: Mail, hosting: Server, gift: Gift,
};
const typeLabels: Record<string, string> = {
  service: "خدمة برمجية", product: "منتج", domain: "دومين", email: "بريد أعمال", hosting: "استضافة", gift: "هدية",
};
const typeColors: Record<string, string> = {
  service: "bg-violet-50 text-violet-600 border-violet-200",
  product: "bg-blue-50 text-blue-600 border-blue-200",
  domain: "bg-emerald-50 text-emerald-600 border-emerald-200",
  email: "bg-amber-50 text-amber-600 border-amber-200",
  hosting: "bg-indigo-50 text-indigo-600 border-indigo-200",
  gift: "bg-pink-50 text-pink-600 border-pink-200",
};

/* ─── Add-on data ────────────────────────────────────────────────── */
const mongoTiers = [
  { id: "M0", name: "M0 Free", price: 0, ram: "مشترك", storage: "512 MB", note: "تطوير فقط" },
  { id: "M2", name: "M2 Shared", price: 9, ram: "مشترك", storage: "2 GB", note: "مشاريع صغيرة" },
  { id: "M5", name: "M5 Shared", price: 25, ram: "مشترك", storage: "5 GB", note: "مشاريع متوسطة" },
  { id: "M10", name: "M10 Dedicated", price: 57, ram: "2 GB", storage: "10 GB", note: "إنتاج — موصى به" },
  { id: "M20", name: "M20 Dedicated", price: 140, ram: "4 GB", storage: "20 GB", note: "مشاريع متقدمة" },
  { id: "M30", name: "M30 Dedicated", price: 410, ram: "8 GB", storage: "40 GB", note: "حجم تجاري" },
];
const awsTiers = [
  { id: "t3.micro", name: "t3.micro", price: 8, cpu: "2 vCPU", ram: "1 GB", note: "اختبار" },
  { id: "t3.small", name: "t3.small", price: 17, cpu: "2 vCPU", ram: "2 GB", note: "تطبيقات خفيفة" },
  { id: "t3.medium", name: "t3.medium", price: 33, cpu: "2 vCPU", ram: "4 GB", note: "مواقع متوسطة" },
  { id: "t3.large", name: "t3.large", price: 66, cpu: "2 vCPU", ram: "8 GB", note: "متقدم — موصى به" },
  { id: "m5.large", name: "m5.large", price: 96, cpu: "2 vCPU", ram: "8 GB", note: "أداء محسّن" },
  { id: "c5.xlarge", name: "c5.xlarge", price: 170, cpu: "4 vCPU", ram: "8 GB", note: "حسابي مكثف" },
];
const domainExtensions = [
  { ext: ".com", price: 45 }, { ext: ".sa", price: 150 }, { ext: ".net", price: 55 },
  { ext: ".org", price: 50 }, { ext: ".store", price: 120 }, { ext: ".io", price: 250 },
];
const emailPlans = [
  { id: "basic", name: "أساسي", price: 35, users: 1, storage: "15 GB" },
  { id: "business", name: "أعمال", price: 99, users: 5, storage: "50 GB" },
  { id: "enterprise", name: "مؤسسي", price: 249, users: 25, storage: "250 GB" },
];

const VAT_RATE = 0.15;

/* ─── Component ──────────────────────────────────────────────────── */
export default function Cart() {
  const { data: user } = useUser();
  const { toast } = useToast();
  const [coupon, setCoupon] = useState("");
  const [addOnDialog, setAddOnDialog] = useState<null | 'db' | 'aws' | 'domain' | 'email'>(null);
  const [selectedDb, setSelectedDb] = useState<typeof mongoTiers[0] | null>(null);
  const [selectedAws, setSelectedAws] = useState<typeof awsTiers[0] | null>(null);
  const [domainName, setDomainName] = useState("");
  const [domainExt, setDomainExt] = useState(".com");
  const [selectedEmail, setSelectedEmail] = useState<typeof emailPlans[0] | null>(null);
  const [checkoutDone, setCheckoutDone] = useState(false);

  const { data: cart, isLoading } = useQuery<Cart>({ queryKey: ["/api/cart"] });

  const removeMutation = useMutation({
    mutationFn: async (itemId: string) => { const r = await apiRequest("DELETE", `/api/cart/items/${itemId}`); return r.json(); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/cart"] }),
    onError: () => toast({ title: "خطأ في الحذف", variant: "destructive" }),
  });

  const updateQtyMutation = useMutation({
    mutationFn: async ({ itemId, qty }: { itemId: string; qty: number }) => {
      const r = await apiRequest("PATCH", `/api/cart/items/${itemId}`, { qty }); return r.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/cart"] }),
  });

  const addItemMutation = useMutation({
    mutationFn: async (item: Partial<CartItem>) => {
      const r = await apiRequest("POST", "/api/cart/items", item); return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      setAddOnDialog(null);
      setSelectedDb(null); setSelectedAws(null); setSelectedEmail(null); setDomainName("");
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => { await apiRequest("DELETE", "/api/cart"); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/cart"] }); },
  });

  const couponMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/cart/coupon", { couponCode: coupon, discount: 50 }); return r.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/cart"] }); toast({ title: "✓ تم تطبيق الكوبون بنجاح" }); },
    onError: () => toast({ title: "كوبون غير صالح", variant: "destructive" }),
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const itemNames = items.map(i => i.nameAr || i.name);
      const filesPayload: Record<string, string[]> = {};
      items.forEach(item => {
        const cfg = (item as any).config || {};
        if (cfg.logoUrl)    { filesPayload.logo    = [...(filesPayload.logo    || []), cfg.logoUrl]; }
        if (cfg.licenseUrl) { filesPayload.license = [...(filesPayload.license || []), cfg.licenseUrl]; }
      });
      const r = await apiRequest("POST", "/api/orders", {
        projectType: items.find(i => i.type === "service")?.name || "خدمة رقمية",
        sector: "general",
        totalAmount: Math.round(total),
        items: itemNames,
        files: Object.keys(filesPayload).length > 0 ? filesPayload : undefined,
        paymentMethod: "bank_transfer",
        notes: `طلب من السلة — ${items.length} عنصر`,
      });
      return r.json();
    },
    onSuccess: async () => {
      await clearMutation.mutateAsync();
      setCheckoutDone(true);
    },
    onError: () => toast({ title: "فشل إرسال الطلب، يرجى المحاولة مرة أخرى", variant: "destructive" }),
  });

  const items = cart?.items || [];
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = cart?.discountAmount || 0;
  const afterDiscount = subtotal - discount;
  const vat = afterDiscount * VAT_RATE;
  const total = afterDiscount + vat;

  const fmt = (n: number) => n.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /* ─── Not logged in ─── */
  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f8f8] p-6">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto mb-6">
          <ShoppingCart className="w-9 h-9 text-white" />
        </div>
        <h2 className="text-xl font-black text-black mb-2">سجّل دخولك أولاً</h2>
        <p className="text-black/40 text-sm mb-8">للوصول إلى سلة التسوق يجب أن تكون مسجلاً</p>
        <Link href="/login"><Button className="premium-btn px-8" data-testid="button-login-redirect">تسجيل الدخول</Button></Link>
      </div>
    </div>
  );

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f8f8]">
      <Loader2 className="animate-spin w-8 h-8 text-black/20" />
    </div>
  );

  /* ─── Checkout Done State ─── */
  if (checkoutDone) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f8f8] p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
        <div className="w-24 h-24 bg-black rounded-3xl flex items-center justify-center mx-auto mb-6 relative">
          <CheckCircle2 className="w-12 h-12 text-white" />
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">✓</span>
          </div>
        </div>
        <h2 className="text-2xl font-black text-black mb-3">تم استلام طلبك!</h2>
        <p className="text-black/50 text-sm mb-2 leading-relaxed">
          شكراً لك — سيتواصل معك فريقنا خلال <span className="text-black font-bold">24 ساعة</span> لإتمام عملية الدفع والبدء في تنفيذ مشروعك.
        </p>
        <div className="bg-white border border-black/[0.07] rounded-2xl p-5 mt-6 mb-8 text-right space-y-3">
          <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-3">ملخص الطلب</p>
          {items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-black/60">{item.nameAr || item.name}</span>
              <span className="font-bold text-black">{(item.price * item.qty).toLocaleString()} ر.س</span>
            </div>
          ))}
          <div className="h-px bg-black/[0.06] my-2" />
          <div className="flex justify-between">
            <span className="font-bold text-black">الإجمالي شامل الضريبة</span>
            <span className="font-black text-black">{fmt(total)} ر.س</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 rounded-2xl px-5 py-3 mb-6">
          <Phone className="w-4 h-4 text-green-600" />
          <span className="text-sm font-bold text-green-700">سيتصل بك فريقنا على رقمك المسجّل</span>
        </div>
        <Link href="/dashboard">
          <Button className="premium-btn px-8" data-testid="button-go-dashboard">العودة للوحة التحكم</Button>
        </Link>
      </motion.div>
    </div>
  );

  /* ─── Main Cart ─── */
  return (
    <div className="min-h-screen bg-[#f8f8f8] relative" dir="rtl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none"><PageGraphics variant="minimal" /></div>
      {/* Sticky Header */}
      <div className="bg-white border-b border-black/[0.06] sticky top-0 z-30">
        <div className="max-w-[1100px] mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/services">
              <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl" data-testid="button-back">
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-base font-black text-black flex items-center gap-2">
                سلة التسوق
                {items.length > 0 && (
                  <span className="w-5 h-5 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">{items.length}</span>
                )}
              </h1>
              <p className="text-[10px] text-black/35 mt-0.5">راجع طلبك قبل الإتمام</p>
            </div>
          </div>
          {items.length > 0 && (
            <Button variant="ghost" className="text-red-400 hover:text-red-600 text-xs gap-1.5 h-8" onClick={() => clearMutation.mutate()} disabled={clearMutation.isPending} data-testid="button-clear-cart">
              <Trash2 className="w-3.5 h-3.5" />
              إفراغ السلة
            </Button>
          )}
        </div>
      </div>

      {/* Empty Cart */}
      {items.length === 0 ? (
        <div className="max-w-[500px] mx-auto px-4 py-20 text-center">
          <div className="w-24 h-24 bg-white border border-black/[0.07] rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-11 h-11 text-black/15" />
          </div>
          <h3 className="text-xl font-black text-black mb-2">السلة فارغة</h3>
          <p className="text-black/40 text-sm mb-10 leading-relaxed">لم تضف أي خدمات بعد. تصفح خدماتنا واختر ما يناسب مشروعك</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/services">
              <Button className="premium-btn gap-2 px-6" data-testid="button-browse-services">
                <Code2 className="w-4 h-4" />
                تصفح الخدمات
              </Button>
            </Link>
            <Link href="/devices">
              <Button variant="outline" className="gap-2 rounded-xl px-6" data-testid="button-browse-devices">
                <Package className="w-4 h-4" />
                الأجهزة والمنتجات
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-[1100px] mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">

          {/* ── Left: Items + Add-ons ── */}
          <div className="space-y-4">

            {/* Cart Items */}
            <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-black/[0.05] flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-black/30" />
                <span className="text-sm font-bold text-black">عناصر الطلب</span>
              </div>
              <AnimatePresence>
                {items.map((item, i) => {
                  const Icon = typeIcons[item.type] || Package;
                  const colorCls = typeColors[item.type] || typeColors.product;
                  const isService = item.type === 'service';
                  return (
                    <motion.div
                      key={item.id || i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                      transition={{ delay: i * 0.04 }}
                      className={`px-5 py-4 flex items-center gap-4 ${i < items.length - 1 ? 'border-b border-black/[0.04]' : ''}`}
                      data-testid={`cart-item-${item.id}`}
                    >
                      {/* Icon */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${colorCls}`}>
                        {item.imageUrl
                          ? <img src={item.imageUrl} alt={item.nameAr || item.name} className="w-full h-full object-cover rounded-xl" />
                          : <Icon className="w-5 h-5" />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-black leading-tight">{item.nameAr || item.name}</p>
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border mt-1 ${colorCls}`}>{typeLabels[item.type] || item.type}</span>
                        {item.config && Object.keys(item.config).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {Object.entries(item.config).slice(0, 3).map(([k, v]) => (
                              <span key={k} className="text-[9px] bg-black/[0.03] border border-black/[0.05] px-1.5 py-0.5 rounded text-black/40 font-mono">
                                {String(v)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Qty + Price + Remove */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {!isService && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => item.id && item.qty > 1 && updateQtyMutation.mutate({ itemId: item.id, qty: item.qty - 1 })}
                              disabled={item.qty <= 1 || updateQtyMutation.isPending}
                              className="w-7 h-7 rounded-lg border border-black/[0.08] flex items-center justify-center hover:bg-black/[0.04] transition-colors disabled:opacity-30"
                              data-testid={`button-qty-minus-${item.id}`}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-black w-5 text-center">{item.qty}</span>
                            <button
                              onClick={() => item.id && updateQtyMutation.mutate({ itemId: item.id, qty: item.qty + 1 })}
                              disabled={updateQtyMutation.isPending}
                              className="w-7 h-7 rounded-lg border border-black/[0.08] flex items-center justify-center hover:bg-black/[0.04] transition-colors"
                              data-testid={`button-qty-plus-${item.id}`}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <div className="text-right min-w-[80px]">
                          <p className="font-black text-sm text-black">
                            {item.price === 0 ? "مجاني" : `${(item.price * item.qty).toLocaleString()} ر.س`}
                          </p>
                          {item.price > 0 && item.qty > 1 && (
                            <p className="text-[10px] text-black/35">{item.price.toLocaleString()} × {item.qty}</p>
                          )}
                        </div>
                        <button
                          onClick={() => item.id && removeMutation.mutate(item.id)}
                          disabled={removeMutation.isPending}
                          className="w-8 h-8 flex items-center justify-center rounded-xl text-black/20 hover:text-red-500 hover:bg-red-50 transition-all"
                          data-testid={`button-remove-${item.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* ── Add-ons ── */}
            <div className="bg-white border border-black/[0.07] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-black/30" />
                <span className="text-sm font-bold text-black">أضف لطلبك</span>
                <span className="text-[10px] text-black/35 mr-auto">بنية تحتية متكاملة</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'db', icon: Database, label: "MongoDB Atlas", sub: "من $0/شهر", color: "text-green-600 bg-green-50" },
                  { key: 'aws', icon: Cloud, label: "Amazon EC2", sub: "من $8/شهر", color: "text-orange-500 bg-orange-50" },
                  { key: 'domain', icon: Globe, label: "تسجيل دومين", sub: "من 45 ر.س/سنة", color: "text-blue-600 bg-blue-50" },
                  { key: 'email', icon: Mail, label: "بريد أعمال", sub: "من 35 ر.س/شهر", color: "text-violet-600 bg-violet-50" },
                ].map(a => {
                  const Icon = a.icon;
                  return (
                    <button key={a.key} onClick={() => setAddOnDialog(a.key as any)}
                      className="flex items-center gap-3 p-3.5 rounded-xl border border-black/[0.07] hover:border-black/20 hover:shadow-sm transition-all text-right bg-white"
                      data-testid={`button-addon-${a.key}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${a.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-black">{a.label}</p>
                        <p className="text-[10px] text-black/40 mt-0.5">{a.sub}</p>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-black/20 mr-auto flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Guarantees row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Shield, label: "دفع آمن", sub: "معاملات مشفّرة" },
                { icon: Clock3, label: "استجابة خلال 24 ساعة", sub: "نتواصل معك فوراً" },
                { icon: CheckCircle2, label: "ضمان الجودة", sub: "نتيجة مضمونة" },
              ].map(g => {
                const Icon = g.icon;
                return (
                  <div key={g.label} className="bg-white border border-black/[0.07] rounded-2xl p-4 text-center">
                    <Icon className="w-5 h-5 text-black/25 mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-black/50">{g.label}</p>
                    <p className="text-[9px] text-black/25 mt-0.5">{g.sub}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Right: Order Summary ── */}
          <div className="space-y-4">
            <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden sticky top-[72px]">

              {/* Summary header */}
              <div className="bg-black px-5 py-4">
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">ملخص الطلب</p>
                <p className="text-2xl font-black text-white">{fmt(total)} <span className="text-sm font-normal text-white/50">ر.س</span></p>
                <p className="text-[10px] text-white/30 mt-0.5">شامل ضريبة القيمة المضافة 15%</p>
              </div>

              <div className="px-5 py-4 space-y-3">
                {/* Line items */}
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-black/50 truncate max-w-[160px]">{item.nameAr || item.name}</span>
                      <span className="font-bold text-black flex-shrink-0 mr-2">
                        {item.price === 0 ? "مجاني" : `${(item.price * item.qty).toLocaleString()} ر.س`}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="h-px bg-black/[0.05]" />

                {/* Subtotal / discount / VAT */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-black/40">
                    <span>المجموع الجزئي</span>
                    <span>{subtotal.toLocaleString()} ر.س</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>خصم الكوبون</span>
                      <span>- {discount.toLocaleString()} ر.س</span>
                    </div>
                  )}
                  <div className="flex justify-between text-black/40">
                    <span>ضريبة القيمة المضافة (15%)</span>
                    <span>{fmt(vat)} ر.س</span>
                  </div>
                  <div className="h-px bg-black/[0.05]" />
                  <div className="flex justify-between font-black text-black text-sm pt-0.5">
                    <span>الإجمالي</span>
                    <span>{fmt(total)} ر.س</span>
                  </div>
                </div>

                {/* Coupon */}
                {!cart?.couponCode ? (
                  <div className="flex gap-2 pt-1">
                    <Input
                      value={coupon}
                      onChange={e => setCoupon(e.target.value)}
                      placeholder="كوبون الخصم"
                      className="h-9 text-xs flex-1"
                      data-testid="input-coupon"
                    />
                    <Button size="sm" variant="outline" onClick={() => couponMutation.mutate()} disabled={!coupon || couponMutation.isPending} className="h-9 px-3" data-testid="button-apply-coupon">
                      {couponMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Tag className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-xl border border-green-200">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    كوبون «{cart.couponCode}» مطبّق — خصم {discount.toLocaleString()} ر.س
                  </div>
                )}

                {/* Checkout button */}
                <Button
                  className="w-full bg-black hover:bg-black/85 text-white font-black h-12 rounded-xl text-sm mt-2 gap-2"
                  disabled={items.length === 0 || checkoutMutation.isPending}
                  onClick={() => checkoutMutation.mutate()}
                  data-testid="button-checkout"
                >
                  {checkoutMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                  {checkoutMutation.isPending ? "جاري إرسال الطلب..." : "إتمام الطلب والتواصل"}
                </Button>

                <p className="text-[10px] text-black/25 text-center pt-1 leading-relaxed">
                  لن يُطلب منك الدفع الآن — سيتواصل فريقنا لإتمام الطلب
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ Add-on Dialogs ═══════ */}

      {/* MongoDB */}
      <Dialog open={addOnDialog === 'db'} onOpenChange={() => setAddOnDialog(null)}>
        <DialogContent className="max-w-md max-h-[88vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                <Database className="w-4 h-4 text-green-600" />
              </div>
              MongoDB Atlas
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[55vh]">
            <div className="space-y-2 px-1">
              {mongoTiers.map(t => (
                <button key={t.id} onClick={() => setSelectedDb(t)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-right ${selectedDb?.id === t.id ? 'border-black bg-black text-white' : 'border-black/[0.08] hover:border-black/20 bg-white'}`}
                  data-testid={`db-tier-${t.id}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`font-bold text-sm font-mono ${selectedDb?.id === t.id ? 'text-white' : 'text-black'}`}>{t.name}</p>
                      {t.note.includes('موصى') && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${selectedDb?.id === t.id ? 'bg-white text-black' : 'bg-black text-white'}`}>موصى به</span>}
                    </div>
                    <p className={`text-[11px] mt-0.5 ${selectedDb?.id === t.id ? 'text-white/60' : 'text-black/40'}`}>{t.storage} · {t.note}</p>
                  </div>
                  <p className={`font-black text-sm flex-shrink-0 mr-4 ${selectedDb?.id === t.id ? 'text-white' : 'text-black'}`}>{t.price === 0 ? "مجاني" : `$${t.price}/شهر`}</p>
                </button>
              ))}
            </div>
          </ScrollArea>
          <Button className="w-full bg-black text-white h-11 font-bold rounded-xl" onClick={() => { if (!selectedDb) return; addItemMutation.mutate({ type: 'hosting', name: `MongoDB Atlas ${selectedDb.name}`, nameAr: `قاعدة بيانات ${selectedDb.name}`, price: selectedDb.price, qty: 1, config: { dbType: 'mongodb_atlas', tier: selectedDb.id, storage: selectedDb.storage } }); }} disabled={!selectedDb || addItemMutation.isPending} data-testid="button-add-db">
            {addItemMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
            {selectedDb ? `إضافة ${selectedDb.name} — ${selectedDb.price === 0 ? "مجاني" : `$${selectedDb.price}/شهر`}` : "اختر خطة أولاً"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* AWS */}
      <Dialog open={addOnDialog === 'aws'} onOpenChange={() => setAddOnDialog(null)}>
        <DialogContent className="max-w-md max-h-[88vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                <Cloud className="w-4 h-4 text-orange-500" />
              </div>
              Amazon AWS EC2
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[55vh]">
            <div className="space-y-2 px-1">
              {awsTiers.map(t => (
                <button key={t.id} onClick={() => setSelectedAws(t)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-right ${selectedAws?.id === t.id ? 'border-black bg-black text-white' : 'border-black/[0.08] hover:border-black/20 bg-white'}`}
                  data-testid={`aws-tier-${t.id}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`font-bold text-sm font-mono ${selectedAws?.id === t.id ? 'text-white' : 'text-black'}`}>{t.name}</p>
                      {t.note.includes('موصى') && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${selectedAws?.id === t.id ? 'bg-white text-black' : 'bg-black text-white'}`}>موصى به</span>}
                    </div>
                    <p className={`text-[11px] mt-0.5 ${selectedAws?.id === t.id ? 'text-white/60' : 'text-black/40'}`}>{t.cpu} · RAM {t.ram} · {t.note}</p>
                  </div>
                  <p className={`font-black text-sm flex-shrink-0 mr-4 ${selectedAws?.id === t.id ? 'text-white' : 'text-black'}`}>${t.price}/شهر</p>
                </button>
              ))}
            </div>
          </ScrollArea>
          <Button className="w-full bg-black text-white h-11 font-bold rounded-xl" onClick={() => { if (!selectedAws) return; addItemMutation.mutate({ type: 'hosting', name: `AWS EC2 ${selectedAws.name}`, nameAr: `خادم AWS ${selectedAws.name}`, price: selectedAws.price, qty: 1, config: { hostingType: 'aws_ec2', tier: selectedAws.id, cpu: selectedAws.cpu, ram: selectedAws.ram } }); }} disabled={!selectedAws || addItemMutation.isPending} data-testid="button-add-aws">
            {addItemMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
            {selectedAws ? `إضافة ${selectedAws.name} — $${selectedAws.price}/شهر` : "اختر خادماً أولاً"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Domain */}
      <Dialog open={addOnDialog === 'domain'} onOpenChange={() => setAddOnDialog(null)}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                <Globe className="w-4 h-4 text-blue-600" />
              </div>
              تسجيل دومين
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={domainName}
                onChange={e => setDomainName(e.target.value.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase())}
                placeholder="اسم-موقعك"
                className="flex-1 text-sm font-mono"
                dir="ltr"
                data-testid="input-domain-name"
              />
              <Select value={domainExt} onValueChange={setDomainExt}>
                <SelectTrigger className="w-28" data-testid="select-domain-ext"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {domainExtensions.map(d => <SelectItem key={d.ext} value={d.ext}>{d.ext} — {d.price} ر.س</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {domainName && (
              <div className="bg-black rounded-xl px-4 py-3 text-center">
                <p className="font-mono text-white font-bold">{domainName}{domainExt}</p>
                <p className="text-[10px] text-white/40 mt-1">{domainExtensions.find(d => d.ext === domainExt)?.price || 45} ر.س / سنة</p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              {domainExtensions.map(d => (
                <button key={d.ext} onClick={() => setDomainExt(d.ext)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${domainExt === d.ext ? 'border-black bg-black text-white' : 'border-black/[0.08] hover:border-black/20'}`}
                  data-testid={`domain-ext-${d.ext.replace('.', '')}`}>
                  <p className={`font-bold text-sm ${domainExt === d.ext ? 'text-white' : 'text-black'}`}>{d.ext}</p>
                  <p className={`text-[9px] ${domainExt === d.ext ? 'text-white/50' : 'text-black/35'}`}>{d.price} ر.س</p>
                </button>
              ))}
            </div>
            <Button className="w-full bg-black text-white h-11 font-bold rounded-xl" onClick={() => { if (!domainName.trim()) return; const ext = domainExtensions.find(d => d.ext === domainExt); addItemMutation.mutate({ type: 'domain', name: `Domain: ${domainName}${domainExt}`, nameAr: `دومين: ${domainName}${domainExt}`, price: ext?.price || 45, qty: 1, config: { domain: `${domainName}${domainExt}`, extension: domainExt } }); }} disabled={!domainName.trim() || addItemMutation.isPending} data-testid="button-add-domain">
              {addItemMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Globe className="w-4 h-4 ml-2" />}
              {domainName ? `إضافة ${domainName}${domainExt}` : "أدخل اسم الدومين"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email */}
      <Dialog open={addOnDialog === 'email'} onOpenChange={() => setAddOnDialog(null)}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center">
                <Mail className="w-4 h-4 text-violet-600" />
              </div>
              بريد الأعمال
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {emailPlans.map(p => (
              <button key={p.id} onClick={() => setSelectedEmail(p)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-right ${selectedEmail?.id === p.id ? 'border-black bg-black text-white' : 'border-black/[0.08] hover:border-black/20 bg-white'}`}
                data-testid={`email-plan-${p.id}`}>
                <div>
                  <p className={`font-bold text-sm ${selectedEmail?.id === p.id ? 'text-white' : 'text-black'}`}>{p.name}</p>
                  <p className={`text-[11px] mt-0.5 ${selectedEmail?.id === p.id ? 'text-white/60' : 'text-black/40'}`}>{p.users} مستخدم · {p.storage}</p>
                </div>
                <p className={`font-black text-sm flex-shrink-0 mr-4 ${selectedEmail?.id === p.id ? 'text-white' : 'text-black'}`}>{p.price} ر.س/شهر</p>
              </button>
            ))}
            <Button className="w-full bg-black text-white h-11 font-bold rounded-xl" onClick={() => { if (!selectedEmail) return; addItemMutation.mutate({ type: 'email', name: `Business Email ${selectedEmail.name}`, nameAr: `بريد أعمال ${selectedEmail.name}`, price: selectedEmail.price, qty: 1, config: { emailPlan: selectedEmail.id, users: selectedEmail.users, storage: selectedEmail.storage } }); }} disabled={!selectedEmail || addItemMutation.isPending} data-testid="button-add-email">
              {addItemMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Mail className="w-4 h-4 ml-2" />}
              {selectedEmail ? `إضافة ${selectedEmail.name} — ${selectedEmail.price} ر.س/شهر` : "اختر خطة أولاً"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
