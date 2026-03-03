import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useState } from "react";
import type { QiroxProduct } from "@shared/schema";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import {
  Search, ShoppingCart, Star, Package, Cpu, Globe, Mail, Server,
  Gift, Code2, CheckCircle, Truck, Clock, MapPin, ExternalLink,
  X, Phone, User, Home, MessageSquare, ChevronLeft, ArrowLeft,
  Zap, Shield, Sparkles, Check, Monitor
} from "lucide-react";

const categoryConfig: Record<string, { label: string; icon: any; color: string; bg: string; dark: string }> = {
  device:   { label: "أجهزة",         icon: Cpu,     color: "text-blue-600",   bg: "bg-blue-50",   dark: "bg-gradient-to-br from-blue-600 to-indigo-600" },
  hosting:  { label: "استضافة",        icon: Server,  color: "text-purple-600", bg: "bg-purple-50", dark: "bg-gradient-to-br from-purple-600 to-violet-700" },
  domain:   { label: "دومين",          icon: Globe,   color: "text-emerald-600",bg: "bg-emerald-50",dark: "bg-gradient-to-br from-emerald-500 to-teal-600" },
  email:    { label: "بريد احترافي",   icon: Mail,    color: "text-orange-600", bg: "bg-orange-50", dark: "bg-gradient-to-br from-orange-500 to-red-500" },
  gift:     { label: "هدايا",          icon: Gift,    color: "text-pink-600",   bg: "bg-pink-50",   dark: "bg-gradient-to-br from-pink-500 to-rose-600" },
  software: { label: "برمجيات",        icon: Code2,   color: "text-indigo-600",  bg: "bg-indigo-50",  dark: "bg-gradient-to-br from-indigo-600 to-blue-700" },
  system:   { label: "أنظمة",          icon: Monitor, color: "text-teal-600",    bg: "bg-teal-50",   dark: "bg-gradient-to-br from-teal-500 to-cyan-600" },
  other:    { label: "أخرى",           icon: Package, color: "text-gray-600",    bg: "bg-gray-50",   dark: "bg-gradient-to-br from-gray-600 to-gray-700" },
};

const PHYSICAL_CATS = ["device", "gift"];

const emptyShipping = { recipientName: "", phone: "", city: "", address: "", notes: "" };

function ShippingDialog({ product, onClose, onConfirm }: { product: QiroxProduct; onClose: () => void; onConfirm: (shipping: typeof emptyShipping) => void }) {
  const [form, setForm] = useState({ ...emptyShipping });
  const [error, setError] = useState("");
  const cfg = categoryConfig[product.category] || categoryConfig.other;

  function submit() {
    if (!form.recipientName.trim()) { setError("يرجى إدخال اسم المستلم"); return; }
    if (!form.phone.trim()) { setError("يرجى إدخال رقم الجوال"); return; }
    if (!form.city.trim()) { setError("يرجى إدخال المدينة"); return; }
    if (!form.address.trim()) { setError("يرجى إدخال العنوان"); return; }
    setError("");
    onConfirm(form);
  }

  return (
    <div className="flex flex-col" dir="rtl">
      {/* Header */}
      <div className={`p-6 pb-5 ${cfg.dark} relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "18px 18px" }} />
        <button onClick={onClose} className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 z-10">
          <X className="w-4 h-4 text-white" />
        </button>
        <div className="relative z-10 flex items-center gap-3">
          {product.images?.[0]
            ? <img src={product.images[0]} className="w-14 h-14 rounded-2xl object-cover border-2 border-white/30" alt={product.nameAr} />
            : <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center"><cfg.icon className="w-7 h-7 text-white" /></div>
          }
          <div>
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">تفاصيل التوصيل</p>
            <p className="text-white font-black text-base leading-tight">{product.nameAr}</p>
            <p className="text-white/60 text-sm font-bold">{product.price.toLocaleString()} {product.currency}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="p-6 space-y-3">
        <p className="text-black/40 text-xs mb-4 leading-relaxed">يرجى إدخال بيانات التوصيل بدقة لضمان وصول طلبك في الموعد المحدد</p>

        <div>
          <Label className="text-xs font-bold text-black/60 mb-1 flex items-center gap-1.5">
            <User className="w-3 h-3" /> اسم المستلم <span className="text-red-500">*</span>
          </Label>
          <Input value={form.recipientName} onChange={e => setForm(f => ({ ...f, recipientName: e.target.value }))}
            placeholder="الاسم الكامل" className="h-11 rounded-xl border-black/[0.08] text-sm" data-testid="input-recipient-name" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-bold text-black/60 mb-1 flex items-center gap-1.5">
              <Phone className="w-3 h-3" /> رقم الجوال <span className="text-red-500">*</span>
            </Label>
            <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="05xxxxxxxx" className="h-11 rounded-xl border-black/[0.08] text-sm" dir="ltr" data-testid="input-shipping-phone" />
          </div>
          <div>
            <Label className="text-xs font-bold text-black/60 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> المدينة <span className="text-red-500">*</span>
            </Label>
            <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
              placeholder="الرياض، جدة..." className="h-11 rounded-xl border-black/[0.08] text-sm" data-testid="input-shipping-city" />
          </div>
        </div>

        <div>
          <Label className="text-xs font-bold text-black/60 mb-1 flex items-center gap-1.5">
            <Home className="w-3 h-3" /> العنوان التفصيلي <span className="text-red-500">*</span>
          </Label>
          <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            placeholder="الحي، الشارع، رقم المبنى..." className="h-11 rounded-xl border-black/[0.08] text-sm" data-testid="input-shipping-address" />
        </div>

        <div>
          <Label className="text-xs font-bold text-black/60 mb-1 flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3" /> ملاحظات إضافية (اختياري)
          </Label>
          <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="أي تعليمات خاصة للتوصيل..." className="rounded-xl border-black/[0.08] text-sm resize-none h-14" data-testid="input-shipping-notes" />
        </div>

        {error && <p className="text-red-500 text-xs flex items-center gap-1"><X className="w-3 h-3" />{error}</p>}

        <Button onClick={submit} className={`w-full h-12 rounded-2xl font-bold text-sm gap-2 ${cfg.dark} text-white hover:opacity-90 shadow-lg`} data-testid="button-confirm-shipping">
          <ShoppingCart className="w-4 h-4" /> أضف للسلة وتأكيد
        </Button>
      </div>
    </div>
  );
}

function DigitalDialog({ product, onClose, onConfirm }: { product: QiroxProduct; onClose: () => void; onConfirm: (data: { notes: string }) => void }) {
  const [notes, setNotes] = useState("");
  const cfg = categoryConfig[product.category] || categoryConfig.other;
  return (
    <div className="flex flex-col" dir="rtl">
      <div className={`p-6 pb-5 ${cfg.dark} relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "18px 18px" }} />
        <button onClick={onClose} className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 z-10">
          <X className="w-4 h-4 text-white" />
        </button>
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center"><cfg.icon className="w-7 h-7 text-white" /></div>
          <div>
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">{cfg.label}</p>
            <p className="text-white font-black text-base leading-tight">{product.nameAr}</p>
            <p className="text-white/60 text-sm font-bold">{product.price.toLocaleString()} {product.currency}</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <p className="text-black/40 text-xs mb-4 leading-relaxed">
          {product.category === "domain" ? "سيتم تسجيل الدومين باسمك وربطه باستضافتك خلال 24 ساعة." : product.category === "hosting" ? "سيتم إعداد الاستضافة وإرسال بيانات الاتصال إليك على البريد الإلكتروني." : product.category === "email" ? "سيتم إعداد البريد الاحترافي وإرسال الإعدادات." : "سيتم تسليم المنتج الرقمي إليك بعد الدفع."}
        </p>
        <div>
          <Label className="text-xs font-bold text-black/60 mb-1 flex items-center gap-1.5"><MessageSquare className="w-3 h-3" /> ملاحظات إضافية (اختياري)</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="أي تفاصيل إضافية..." className="rounded-xl border-black/[0.08] text-sm resize-none h-20 mb-4" data-testid="input-digital-notes" />
        </div>
        <Button onClick={() => onConfirm({ notes })} className={`w-full h-12 rounded-2xl font-bold text-sm gap-2 ${cfg.dark} text-white hover:opacity-90 shadow-lg`} data-testid="button-confirm-digital">
          <ShoppingCart className="w-4 h-4" /> أضف للسلة
        </Button>
      </div>
    </div>
  );
}

export default function Devices() {
  const { data: user } = useUser();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [dialogProduct, setDialogProduct] = useState<QiroxProduct | null>(null);

  const { data: products, isLoading } = useQuery<QiroxProduct[]>({ queryKey: ["/api/products"] });
  const { data: myShipments } = useQuery<any[]>({ queryKey: ["/api/shipments/my"], enabled: !!user });

  const addToCartMutation = useMutation({
    mutationFn: async ({ product, extra }: { product: QiroxProduct; extra?: any }) => {
      const res = await apiRequest("POST", "/api/cart/items", {
        type: product.category === "domain" ? "domain" : product.category === "email" ? "email" : product.category === "hosting" ? "hosting" : product.category === "gift" ? "gift" : "product",
        refId: product.id,
        name: product.name,
        nameAr: product.nameAr,
        price: product.price,
        qty: 1,
        imageUrl: product.images?.[0],
        config: { ...product.specs, ...(extra || {}) },
      });
      return res.json();
    },
    onSuccess: (_, { product }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      setAddedIds(prev => new Set([...prev, product.id]));
      setDialogProduct(null);
      toast({ title: `✓ تمت إضافة "${product.nameAr}" للسلة` });
      setTimeout(() => setAddedIds(prev => { const s = new Set(prev); s.delete(product.id); return s; }), 3000);
    },
    onError: () => toast({ title: "يجب تسجيل الدخول أولاً", variant: "destructive" }),
  });

  function handleAddClick(p: QiroxProduct) {
    if (!user) { toast({ title: "يجب تسجيل الدخول أولاً", variant: "destructive" }); return; }
    setDialogProduct(p);
  }

  function handleShippingConfirm(shipping: typeof emptyShipping) {
    if (!dialogProduct) return;
    addToCartMutation.mutate({ product: dialogProduct, extra: { shipping } });
  }

  function handleDigitalConfirm(data: { notes: string }) {
    if (!dialogProduct) return;
    addToCartMutation.mutate({ product: dialogProduct, extra: { notes: data.notes } });
  }

  const filtered = products?.filter(p => {
    const matchSearch = !search || p.nameAr?.includes(search) || p.name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || p.category === filterCat;
    return matchSearch && matchCat;
  }) || [];

  const featured = filtered.filter(p => p.featured);
  const regular = filtered.filter(p => !p.featured);
  const isPhysical = dialogProduct ? PHYSICAL_CATS.includes(dialogProduct.category) : false;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950" dir="rtl">
      <Navigation />

      {/* ── Hero ── */}
      <section className="pt-0 pb-0 relative overflow-hidden">
        <div className="relative bg-black min-h-[52vh] flex items-end">
          <PageGraphics variant="full-dark" />
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "24px 24px" }} />

          {/* Floating orbs */}
          {[
            { w: 400, h: 400, top: "-10%", right: "-5%", from: "from-blue-500/20", to: "to-indigo-600/10", dur: 9 },
            { w: 280, h: 280, top: "30%",  left: "-5%",  from: "from-purple-500/15", to: "to-violet-600/8",dur: 12 },
          ].map((o, i) => (
            <motion.div key={i} className={`absolute rounded-full bg-gradient-to-br ${o.from} ${o.to} blur-3xl pointer-events-none`}
              style={{ width: o.w, height: o.h, top: o.top, ...(o.right ? { right: o.right } : { left: o.left }) }}
              animate={{ y: [0, -20, 0], scale: [1, 1.07, 1] }}
              transition={{ duration: o.dur, repeat: Infinity, ease: "easeInOut" }} />
          ))}

          <div className="container mx-auto px-4 relative z-10 pt-36 pb-16">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 border border-white/15 rounded-full px-5 py-2 mb-6 bg-white/5 backdrop-blur-sm">
                <Package className="w-3.5 h-3.5 text-white/50" />
                <span className="text-xs font-medium text-white/50">متجر QIROX</span>
              </motion.div>

              <h1 className="text-5xl md:text-7xl font-black text-white mb-4 leading-[1.05] tracking-tight">
                الأجهزة<br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">والإضافات</span>
              </h1>
              <p className="text-white/45 text-lg max-w-xl mb-0">
                كل ما تحتاجه لإطلاق مشروعك الرقمي — أجهزة، استضافة، دومين، بريد احترافي، وأكثر
              </p>
            </motion.div>
          </div>
          <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white dark:from-gray-950 to-transparent" />
        </div>
      </section>

      {/* ── Search & Filters ── */}
      <section className="pt-10 pb-6 container mx-auto px-4">
        <div className="max-w-lg mx-auto mb-6">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/25 dark:text-white/25" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن منتج..."
              className="pr-11 h-12 rounded-2xl border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-gray-900 shadow-sm text-sm" data-testid="input-product-search" />
          </div>
        </div>

        {/* Category filters */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex flex-wrap justify-center gap-2">
          {[{ key: "all", label: "الكل", icon: Package }].concat(
            Object.entries(categoryConfig).map(([k, v]) => ({ key: k, label: v.label, icon: v.icon }))
          ).map(cat => {
            const Icon = cat.icon;
            const count = cat.key === "all" ? products?.length : products?.filter(p => p.category === cat.key).length;
            if (cat.key !== "all" && (count ?? 0) === 0) return null;
            const isActive = filterCat === cat.key;
            return (
              <button key={cat.key} onClick={() => setFilterCat(cat.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all border ${isActive ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-lg" : "bg-white dark:bg-gray-900 text-black/55 dark:text-white/55 border-black/[0.08] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20"}`}
                data-testid={`filter-cat-${cat.key}`}>
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
                {count !== undefined && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 dark:bg-black/20" : "bg-black/[0.05] dark:bg-white/[0.05]"}`}>{count}</span>
                )}
              </button>
            );
          })}
        </motion.div>
      </section>

      {/* ── Products ── */}
      <section className="pb-24 container mx-auto px-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-10 h-10 border-4 border-black/10 dark:border-white/10 border-t-black dark:border-t-white rounded-full animate-spin" />
            <p className="text-xs text-black/30 dark:text-white/30">جاري التحميل...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <Package className="w-16 h-16 mx-auto mb-4 text-black/10 dark:text-white/10" />
            <p className="text-black/30 dark:text-white/30 text-sm">لا توجد منتجات في هذه الفئة</p>
          </div>
        ) : (
          <>
            {featured.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <Star className="w-4 h-4 text-amber-500" />
                  <h2 className="text-sm font-black text-black/60 dark:text-white/60 uppercase tracking-wider">المنتجات المميزة</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featured.map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} user={user} addedIds={addedIds} onAdd={() => handleAddClick(p)} isPending={addToCartMutation.isPending} featured />
                  ))}
                </div>
              </div>
            )}
            {regular.length > 0 && (
              <div>
                {featured.length > 0 && (
                  <div className="flex items-center gap-2 mb-6">
                    <Package className="w-4 h-4 text-black/40 dark:text-white/40" />
                    <h2 className="text-sm font-black text-black/60 dark:text-white/60 uppercase tracking-wider">جميع المنتجات</h2>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {regular.map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} user={user} addedIds={addedIds} onAdd={() => handleAddClick(p)} isPending={addToCartMutation.isPending} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* My Shipments */}
        {user && myShipments && myShipments.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-16">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-4 h-4 text-black/40 dark:text-white/40" />
              <h2 className="text-base font-black text-black/70 dark:text-white/70">طلباتي ومتابعة الشحن</h2>
            </div>
            <div className="space-y-3">
              {myShipments.map((s: any) => {
                const statusColors: Record<string, string> = {
                  pending: "bg-yellow-50 text-yellow-700 border-yellow-200", processing: "bg-blue-50 text-blue-700 border-blue-200",
                  shipped: "bg-indigo-50 text-indigo-700 border-indigo-200", out_for_delivery: "bg-orange-50 text-orange-700 border-orange-200",
                  delivered: "bg-green-50 text-green-700 border-green-200", cancelled: "bg-red-50 text-red-700 border-red-200",
                };
                const statusLabels: Record<string, string> = {
                  pending: "قيد الانتظار", processing: "قيد التجهيز", shipped: "تم الشحن",
                  out_for_delivery: "في الطريق", delivered: "تم التوصيل", cancelled: "ملغي", returned: "مُرتجع",
                };
                return (
                  <div key={s.id || s._id} className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4 flex items-center justify-between gap-4" data-testid={`shipment-${s.id || s._id}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-sm text-black dark:text-white">{s.productName}</span>
                        <Badge className={`text-xs border ${statusColors[s.status] || "bg-gray-50 text-gray-600 border-gray-200"}`}>{statusLabels[s.status] || s.status}</Badge>
                      </div>
                      {s.trackingNumber && <p className="text-xs text-black/40 dark:text-white/40 flex items-center gap-1 mt-1"><Package className="w-3 h-3" />رقم التتبع: <span className="font-mono">{s.trackingNumber}</span></p>}
                      {s.shippingAddress?.city && <p className="text-xs text-black/40 dark:text-white/40 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{s.shippingAddress.city}</p>}
                    </div>
                    {s.courierUrl && (
                      <a href={s.courierUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-medium text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white border border-black/[0.1] dark:border-white/[0.1] rounded-xl px-3 py-1.5 shrink-0" data-testid={`link-track-${s.id || s._id}`}>
                        <ExternalLink className="w-3 h-3" />تتبع
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Why buy from us */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-16 rounded-3xl bg-black dark:bg-white/[0.03] overflow-hidden">
          <div className="p-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <p className="text-white/40 text-[11px] uppercase tracking-[3px] mb-2">لماذا تشتري من QIROX؟</p>
              <h3 className="text-2xl font-black text-white mb-4">نوفّر — نُركّب — ندعم</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Shield, label: "ضمان عام كامل" },
                  { icon: Truck, label: "توصيل سريع" },
                  { icon: Zap, label: "تركيب مجاني" },
                  { icon: Sparkles, label: "دعم فني متواصل" },
                ].map(({ icon: Ic, label }) => (
                  <div key={label} className="flex items-center gap-2 text-sm text-white/65">
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Ic className="w-3.5 h-3.5 text-white/60" />
                    </div>
                    {label}
                  </div>
                ))}
              </div>
            </div>
            {!user && (
              <Link href="/login">
                <Button className="bg-white text-black hover:bg-white/90 font-bold px-8 h-12 rounded-2xl shrink-0 gap-2">
                  سجّل دخولك للشراء <ChevronLeft className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
        </motion.div>
      </section>

      <Footer />

      {/* ── Dialog ── */}
      <Dialog open={!!dialogProduct} onOpenChange={v => !v && setDialogProduct(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
          {dialogProduct && (
            isPhysical
              ? <ShippingDialog product={dialogProduct} onClose={() => setDialogProduct(null)} onConfirm={handleShippingConfirm} />
              : <DigitalDialog product={dialogProduct} onClose={() => setDialogProduct(null)} onConfirm={handleDigitalConfirm} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductCard({ product: p, index, user, addedIds, onAdd, isPending, featured: isFeat }: {
  product: QiroxProduct; index: number; user: any; addedIds: Set<string>; onAdd: () => void; isPending: boolean; featured?: boolean;
}) {
  const cfg = categoryConfig[p.category] || categoryConfig.other;
  const Icon = cfg.icon;
  const isAdded = addedIds.has(p.id);
  const isPhysical = PHYSICAL_CATS.includes(p.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className={`bg-white dark:bg-gray-900 border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col ${isFeat ? "border-black/[0.1] dark:border-white/[0.1] shadow-md" : "border-black/[0.06] dark:border-white/[0.06] hover:shadow-md"}`}
      data-testid={`device-card-${p.id}`}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: isFeat ? 200 : 160 }}>
        {p.images?.[0] ? (
          <img src={p.images[0]} alt={p.nameAr} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${cfg.dark}`}>
            <Icon className="w-12 h-12 text-white/60" />
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          {p.badge && (
            <span className="text-[10px] font-black bg-black text-white px-2.5 py-1 rounded-full shadow">{p.badge}</span>
          )}
          {isFeat && (
            <span className="text-[10px] font-black bg-amber-400 text-white px-2.5 py-1 rounded-full flex items-center gap-1">
              <Star className="w-2.5 h-2.5" />مميز
            </span>
          )}
        </div>
        <div className="absolute top-3 left-3">
          <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
            <Icon className="w-2.5 h-2.5" />{cfg.label}
          </span>
        </div>
        {isPhysical && (
          <div className="absolute bottom-3 right-3">
            <span className="flex items-center gap-1 text-[9px] font-bold bg-white/90 dark:bg-black/80 text-black/60 dark:text-white/60 px-2 py-1 rounded-full border border-black/[0.06]">
              <Truck className="w-2.5 h-2.5" />يتطلب شحن
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-black text-sm text-black dark:text-white mb-1 leading-tight">{p.nameAr}</h3>
        {p.descriptionAr && <p className="text-[11px] text-black/40 dark:text-white/40 line-clamp-2 mb-2.5 leading-relaxed">{p.descriptionAr}</p>}
        {p.specs && Object.keys(p.specs).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {Object.entries(p.specs).slice(0, 4).map(([k, v]) => (
              <span key={k} className="text-[9px] bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.05] px-2 py-0.5 rounded-full text-black/50 dark:text-white/50 font-medium">
                {k}: {String(v)}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-black/[0.05] dark:border-white/[0.05]">
          <div>
            <p className="text-xl font-black text-black dark:text-white leading-tight">{p.price.toLocaleString()}</p>
            <p className="text-[10px] text-black/35 dark:text-white/35">{p.currency} {p.stock === -1 ? "— متوفر" : p.stock === 0 ? "— نفد المخزون" : `— ${p.stock} وحدة`}</p>
          </div>
          {p.stock !== 0 && (
            user ? (
              <Button size="sm" onClick={onAdd} disabled={isPending || isAdded}
                className={`rounded-xl text-xs h-9 px-4 transition-all font-bold ${isAdded ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-black dark:bg-white text-white dark:text-black hover:opacity-80"}`}
                data-testid={`button-add-to-cart-${p.id}`}>
                {isAdded ? <><Check className="w-3.5 h-3.5 ml-1" />أُضيف</> : <><ShoppingCart className="w-3.5 h-3.5 ml-1" />أضف للسلة</>}
              </Button>
            ) : (
              <Link href="/login">
                <Button size="sm" variant="outline" className="rounded-xl text-xs h-9 px-4 font-bold">دخول</Button>
              </Link>
            )
          )}
          {p.stock === 0 && (
            <span className="text-[10px] text-red-500 font-bold bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-xl">نفد المخزون</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
