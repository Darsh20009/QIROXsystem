import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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
  Gift, Code2, Truck, MapPin, ExternalLink,
  X, Phone, User, Home, MessageSquare, ChevronLeft, ChevronRight,
  Zap, Shield, Sparkles, Check, Monitor,
  Tag, Info
} from "lucide-react";

const categoryConfig: Record<string, { label: string; icon: any; color: string; bg: string; dark: string; accent: string }> = {
  device:   { label: "أجهزة",         icon: Cpu,     color: "text-blue-600",    bg: "bg-blue-50",    dark: "bg-gradient-to-br from-blue-600 to-indigo-600",    accent: "#2563eb" },
  hosting:  { label: "استضافة",        icon: Server,  color: "text-purple-600",  bg: "bg-purple-50",  dark: "bg-gradient-to-br from-purple-600 to-violet-700",  accent: "#9333ea" },
  domain:   { label: "دومين",          icon: Globe,   color: "text-emerald-600", bg: "bg-emerald-50", dark: "bg-gradient-to-br from-emerald-500 to-teal-600",   accent: "#059669" },
  email:    { label: "بريد احترافي",   icon: Mail,    color: "text-orange-600",  bg: "bg-orange-50",  dark: "bg-gradient-to-br from-orange-500 to-red-500",     accent: "#ea580c" },
  gift:     { label: "هدايا",          icon: Gift,    color: "text-pink-600",    bg: "bg-pink-50",    dark: "bg-gradient-to-br from-pink-500 to-rose-600",      accent: "#ec4899" },
  software: { label: "برمجيات",        icon: Code2,   color: "text-indigo-600",  bg: "bg-indigo-50",  dark: "bg-gradient-to-br from-indigo-600 to-blue-700",    accent: "#4f46e5" },
  system:   { label: "أنظمة",          icon: Monitor, color: "text-teal-600",    bg: "bg-teal-50",    dark: "bg-gradient-to-br from-teal-500 to-cyan-600",      accent: "#0d9488" },
  other:    { label: "أخرى",           icon: Package, color: "text-gray-600",    bg: "bg-gray-50",    dark: "bg-gradient-to-br from-gray-600 to-gray-700",      accent: "#4b5563" },
};

const PHYSICAL_CATS = ["device", "gift"];

const SAUDI_CITIES = [
  "الرياض", "جدة", "مكة المكرمة", "المدينة المنورة", "الدمام", "الخبر", "الظهران",
  "الطائف", "أبها", "تبوك", "بريدة", "القصيم", "حائل", "نجران", "جازان",
  "ينبع", "الجبيل", "الخفجي", "الأحساء", "القطيف", "عرعر", "سكاكا",
];

const emptyShipping = { recipientName: "", phone: "", city: "", district: "", address: "", notes: "" };

function ImageCarousel({ images, productName, height = 320 }: { images: string[]; productName: string; height?: number }) {
  const [current, setCurrent] = useState(0);
  const imgs = images.filter(Boolean);
  if (imgs.length === 0) return null;

  return (
    <div className="relative" style={{ height }} dir="ltr">
      <AnimatePresence mode="wait">
        <motion.img
          key={current}
          src={imgs[current]}
          alt={productName}
          className="w-full h-full object-contain"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        />
      </AnimatePresence>
      {imgs.length > 1 && (
        <>
          <button
            onClick={() => setCurrent(i => (i - 1 + imgs.length) % imgs.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-md flex items-center justify-center hover:scale-110 transition-transform z-10"
            data-testid="carousel-prev"
          >
            <ChevronRight className="w-4 h-4 text-black dark:text-white" />
          </button>
          <button
            onClick={() => setCurrent(i => (i + 1) % imgs.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-md flex items-center justify-center hover:scale-110 transition-transform z-10"
            data-testid="carousel-next"
          >
            <ChevronLeft className="w-4 h-4 text-black dark:text-white" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {imgs.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all ${i === current ? "w-4 h-2 bg-black dark:bg-white" : "w-2 h-2 bg-black/25 dark:bg-white/25"}`}
                data-testid={`carousel-dot-${i}`}
              />
            ))}
          </div>
        </>
      )}
      {imgs.length > 1 && (
        <div className="flex gap-2 mt-2 px-2 overflow-x-auto pb-1">
          {imgs.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === current ? "border-black dark:border-white" : "border-transparent opacity-50 hover:opacity-80"}`}
              data-testid={`carousel-thumb-${i}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ShippingForm({ user, form, setForm }: {
  user: any;
  form: typeof emptyShipping;
  setForm: (f: typeof emptyShipping | ((prev: typeof emptyShipping) => typeof emptyShipping)) => void;
}) {
  return (
    <div className="space-y-3" dir="rtl">
      <div>
        <Label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 flex items-center gap-1.5">
          <User className="w-3 h-3" /> اسم المستلم <span className="text-red-500">*</span>
        </Label>
        <Input value={form.recipientName} onChange={e => setForm(f => ({ ...f, recipientName: e.target.value }))}
          placeholder="الاسم الكامل" className="h-11 rounded-xl border-black/[0.08] dark:border-white/[0.1] text-sm" data-testid="input-recipient-name" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 flex items-center gap-1.5">
            <Phone className="w-3 h-3" /> رقم الجوال <span className="text-red-500">*</span>
          </Label>
          <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="05xxxxxxxx" className="h-11 rounded-xl border-black/[0.08] dark:border-white/[0.1] text-sm" dir="ltr" data-testid="input-shipping-phone" />
        </div>
        <div>
          <Label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 flex items-center gap-1.5">
            <MapPin className="w-3 h-3" /> المدينة <span className="text-red-500">*</span>
          </Label>
          <Select value={form.city} onValueChange={v => setForm(f => ({ ...f, city: v }))}>
            <SelectTrigger className="h-11 rounded-xl border-black/[0.08] dark:border-white/[0.1] text-sm" data-testid="select-shipping-city">
              <SelectValue placeholder="اختر المدينة" />
            </SelectTrigger>
            <SelectContent>
              {SAUDI_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 flex items-center gap-1.5">
          <Home className="w-3 h-3" /> الحي (اختياري)
        </Label>
        <Input value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
          placeholder="اسم الحي..." className="h-11 rounded-xl border-black/[0.08] dark:border-white/[0.1] text-sm" data-testid="input-shipping-district" />
      </div>
      <div>
        <Label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 flex items-center gap-1.5">
          <Home className="w-3 h-3" /> العنوان التفصيلي <span className="text-red-500">*</span>
        </Label>
        <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
          placeholder="الشارع، رقم المبنى..." className="h-11 rounded-xl border-black/[0.08] dark:border-white/[0.1] text-sm" data-testid="input-shipping-address" />
      </div>
      <div>
        <Label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 flex items-center gap-1.5">
          <MessageSquare className="w-3 h-3" /> ملاحظات إضافية (اختياري)
        </Label>
        <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="أي تعليمات خاصة للتوصيل..." className="rounded-xl border-black/[0.08] dark:border-white/[0.1] text-sm resize-none h-14" data-testid="input-shipping-notes" />
      </div>
    </div>
  );
}

function ProductDetailSheet({ product: p, user, onClose, onAddToCart, isPending }: {
  product: QiroxProduct;
  user: any;
  onClose: () => void;
  onAddToCart: (shipping?: typeof emptyShipping | null, notes?: string) => void;
  isPending: boolean;
}) {
  const cfg = categoryConfig[p.category] || categoryConfig.other;
  const Icon = cfg.icon;
  const isPhysical = PHYSICAL_CATS.includes(p.category);
  const [shippingForm, setShippingForm] = useState<typeof emptyShipping>({
    recipientName: user?.fullName || "",
    phone: user?.phone || "",
    city: "",
    district: "",
    address: "",
    notes: "",
  });
  const [digitalNotes, setDigitalNotes] = useState("");
  const [shippingError, setShippingError] = useState("");

  function handleBuy() {
    if (isPhysical) {
      if (!shippingForm.recipientName.trim()) { setShippingError("يرجى إدخال اسم المستلم"); return; }
      if (!shippingForm.phone.trim()) { setShippingError("يرجى إدخال رقم الجوال"); return; }
      if (!shippingForm.city) { setShippingError("يرجى اختيار المدينة"); return; }
      if (!shippingForm.address.trim()) { setShippingError("يرجى إدخال العنوان التفصيلي"); return; }
      setShippingError("");
      onAddToCart(shippingForm);
    } else {
      onAddToCart(null, digitalNotes);
    }
  }

  const imgs = (p.images || []).filter(Boolean);

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-black/[0.06] dark:border-white/[0.06] shrink-0">
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center hover:bg-black/[0.08] dark:hover:bg-white/[0.1] transition-colors" data-testid="button-close-product-sheet">
          <X className="w-4 h-4" />
        </button>
        <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
          <Icon className="w-3 h-3" />{cfg.label}
        </span>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* Images */}
        <div className="bg-white dark:bg-gray-900 p-4">
          {imgs.length > 0 ? (
            <ImageCarousel images={imgs} productName={p.nameAr} height={280} />
          ) : (
            <div className={`w-full h-56 ${cfg.dark} rounded-2xl flex items-center justify-center`}>
              <Icon className="w-16 h-16 text-white/50" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-5 space-y-4">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {p.badge && (
              <span className="text-xs font-black bg-black text-white px-3 py-1 rounded-full flex items-center gap-1">
                <Tag className="w-3 h-3" />{p.badge}
              </span>
            )}
            {p.featured && (
              <span className="text-xs font-black bg-amber-400 text-white px-3 py-1 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" />مميز
              </span>
            )}
            {isPhysical && (
              <span className="text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-3 py-1 rounded-full flex items-center gap-1">
                <Truck className="w-3 h-3" />شحن مجاني داخل المملكة
              </span>
            )}
          </div>

          <div>
            <h2 className="font-black text-2xl text-black dark:text-white mb-1 leading-tight">{p.nameAr}</h2>
            <p className="text-sm text-black/40 dark:text-white/40">{p.name}</p>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-black dark:text-white">{p.price.toLocaleString()}</span>
            <span className="text-sm text-black/40 dark:text-white/40">{p.currency}</span>
          </div>

          {p.stock !== -1 && p.stock > 0 && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">متوفر في المخزون ({p.stock} وحدة)</p>
          )}
          {p.stock === -1 && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">متوفر</p>}
          {p.stock === 0 && <p className="text-xs text-red-500 font-bold">نفد المخزون</p>}

          {p.descriptionAr && (
            <div className="bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl p-4">
              <p className="text-sm text-black/65 dark:text-white/65 leading-relaxed">{p.descriptionAr}</p>
            </div>
          )}

          {/* Specs */}
          {p.specs && Object.keys(p.specs).length > 0 && (
            <div>
              <h3 className="text-xs font-black text-black/60 dark:text-white/60 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />المواصفات
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(p.specs).map(([k, v]) => (
                  <div key={k} className="bg-black/[0.03] dark:bg-white/[0.04] rounded-xl px-3 py-2.5">
                    <p className="text-[10px] text-black/40 dark:text-white/40 mb-0.5">{k}</p>
                    <p className="text-xs font-bold text-black dark:text-white">{String(v)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Linked plan */}
          {(p as any).linkedPlanSlug && (
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200 dark:border-cyan-800 rounded-2xl p-4">
              <p className="text-xs font-black text-cyan-700 dark:text-cyan-300 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />يأتي مع باقة نظام
              </p>
              <p className="text-sm text-cyan-900 dark:text-cyan-100">{(p as any).linkedPlanSlug}</p>
            </div>
          )}

          <div className="border-t border-black/[0.05] dark:border-white/[0.05] pt-4">
            {isPhysical ? (
              <div>
                <h3 className="font-black text-sm text-black dark:text-white mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-black/40 dark:text-white/40" />
                  بيانات التوصيل
                  {user && <span className="text-[10px] font-normal bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">تم تعبئة البيانات تلقائياً</span>}
                </h3>
                <ShippingForm user={user} form={shippingForm} setForm={setShippingForm} />
                {shippingError && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><X className="w-3 h-3" />{shippingError}</p>}
              </div>
            ) : (
              <div>
                <h3 className="font-black text-sm text-black dark:text-white mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-black/40 dark:text-white/40" />
                  ملاحظات (اختياري)
                </h3>
                <Textarea value={digitalNotes} onChange={e => setDigitalNotes(e.target.value)}
                  placeholder="أي تفاصيل إضافية..." className="rounded-xl border-black/[0.08] dark:border-white/[0.1] text-sm resize-none h-20" data-testid="input-product-notes" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="shrink-0 p-4 border-t border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-950 space-y-2">
        {p.stock !== 0 && user ? (
          <Button
            onClick={handleBuy}
            disabled={isPending}
            className="w-full h-12 rounded-2xl font-black text-sm gap-2 bg-black dark:bg-white text-white dark:text-black hover:opacity-85 shadow-lg"
            data-testid="button-buy-now"
          >
            {isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
            أضف للسلة
          </Button>
        ) : p.stock === 0 ? (
          <div className="w-full h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-center">
            <span className="text-sm font-bold text-red-500">نفد المخزون</span>
          </div>
        ) : (
          <Link href="/login">
            <Button className="w-full h-12 rounded-2xl font-bold text-sm bg-black dark:bg-white text-white dark:text-black" data-testid="button-login-to-buy">
              سجّل دخولك للشراء
            </Button>
          </Link>
        )}
        <div className="flex items-center justify-center gap-6 pt-1">
          {[{ icon: Shield, label: "ضمان عام" }, { icon: Truck, label: "توصيل سريع" }, { icon: Zap, label: "دعم 24/7" }].map(({ icon: Ic, label }) => (
            <div key={label} className="flex items-center gap-1 text-[10px] text-black/40 dark:text-white/40">
              <Ic className="w-3 h-3" />{label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product: p, index, user, addedIds, onOpen, isFeat }: {
  product: QiroxProduct; index: number; user: any; addedIds: Set<string>; onOpen: () => void; isFeat?: boolean;
}) {
  const cfg = categoryConfig[p.category] || categoryConfig.other;
  const Icon = cfg.icon;
  const isAdded = addedIds.has(p.id);
  const isPhysical = PHYSICAL_CATS.includes(p.category);
  const imgs = (p.images || []).filter(Boolean);
  const [imgIdx, setImgIdx] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className={`bg-white dark:bg-gray-900 border rounded-2xl overflow-hidden transition-all duration-300 group flex flex-col cursor-pointer hover:shadow-xl hover:-translate-y-0.5 ${isFeat ? "border-black/[0.1] dark:border-white/[0.1] shadow-md" : "border-black/[0.06] dark:border-white/[0.06]"}`}
      onClick={onOpen}
      data-testid={`device-card-${p.id}`}
    >
      {/* Image zone */}
      <div className="relative overflow-hidden bg-black/[0.02] dark:bg-white/[0.02]" style={{ height: isFeat ? 220 : 185 }} dir="ltr">
        {imgs.length > 0 ? (
          <>
            <img src={imgs[imgIdx]} alt={p.nameAr} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            {imgs.length > 1 && (
              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 p-2 bg-gradient-to-t from-black/20 to-transparent">
                {imgs.map((_, i) => (
                  <button key={i} onClick={e => { e.stopPropagation(); setImgIdx(i); }}
                    className={`rounded-full transition-all ${i === imgIdx ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"}`}
                    data-testid={`card-dot-${p.id}-${i}`} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${cfg.dark}`}>
            <Icon className="w-14 h-14 text-white/50" />
          </div>
        )}

        {/* Top badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          {p.badge && <span className="text-[10px] font-black bg-black text-white px-2.5 py-1 rounded-full shadow">{p.badge}</span>}
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
            <span className="flex items-center gap-1 text-[9px] font-bold bg-white/90 dark:bg-black/80 text-black/60 dark:text-white/60 px-2 py-1 rounded-full border border-black/[0.06] backdrop-blur-sm">
              <Truck className="w-2.5 h-2.5" />شحن
            </span>
          </div>
        )}
        {!p.isActive && (
          <div className="absolute inset-0 bg-white/70 dark:bg-black/70 flex items-center justify-center">
            <span className="text-xs text-black/40 dark:text-white/40 font-medium border border-black/20 dark:border-white/20 px-3 py-1 rounded-full bg-white dark:bg-gray-900">غير نشط</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-black text-sm text-black dark:text-white mb-0.5 leading-tight line-clamp-2">{p.nameAr}</h3>
        {p.descriptionAr && <p className="text-[11px] text-black/40 dark:text-white/40 line-clamp-2 mb-2.5 leading-relaxed">{p.descriptionAr}</p>}

        {p.specs && Object.keys(p.specs).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {Object.entries(p.specs).slice(0, 3).map(([k, v]) => (
              <span key={k} className="text-[9px] bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.05] px-2 py-0.5 rounded-full text-black/50 dark:text-white/50 font-medium">
                {k}: {String(v)}
              </span>
            ))}
          </div>
        )}

        {(p as any).linkedPlanSlug && (
          <div className="flex items-center gap-1 mb-2.5">
            <Sparkles className="w-3 h-3 text-cyan-500" />
            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">يشمل باقة نظام</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-black/[0.05] dark:border-white/[0.05]">
          <div>
            <p className="text-lg font-black text-black dark:text-white leading-tight">{p.price.toLocaleString()}</p>
            <p className="text-[10px] text-black/35 dark:text-white/35">
              {p.currency}{p.stock === -1 ? " — متوفر" : p.stock === 0 ? " — نفد المخزون" : ` — ${p.stock} وحدة`}
            </p>
          </div>
          {p.stock !== 0 ? (
            <Button
              size="sm"
              onClick={e => { e.stopPropagation(); onOpen(); }}
              className={`rounded-xl text-xs h-9 px-4 font-bold transition-all ${isAdded ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-black dark:bg-white text-white dark:text-black hover:opacity-80"}`}
              data-testid={`button-add-to-cart-${p.id}`}
            >
              {isAdded ? <><Check className="w-3.5 h-3.5 ml-1" />أُضيف</> : <><ShoppingCart className="w-3.5 h-3.5 ml-1" />اشتر الآن</>}
            </Button>
          ) : (
            <span className="text-[10px] text-red-500 font-bold bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-xl">نفد المخزون</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Devices() {
  const { data: user } = useUser();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<QiroxProduct | null>(null);

  const { data: products, isLoading } = useQuery<QiroxProduct[]>({ queryKey: ["/api/products"] });
  const { data: myShipments } = useQuery<any[]>({ queryKey: ["/api/shipments/my"], enabled: !!user });

  const addToCartMutation = useMutation({
    mutationFn: async ({ product, shipping, notes }: { product: QiroxProduct; shipping?: typeof emptyShipping | null; notes?: string }) => {
      const isPhysical = PHYSICAL_CATS.includes(product.category);
      const type = product.category === "domain" ? "domain" : product.category === "email" ? "email" : product.category === "hosting" ? "hosting" : product.category === "gift" ? "gift" : "product";
      const res = await apiRequest("POST", "/api/cart/items", {
        type,
        refId: product.id,
        name: product.name,
        nameAr: product.nameAr,
        price: product.price,
        qty: 1,
        imageUrl: product.images?.[0],
        config: {
          ...product.specs,
          ...(isPhysical && shipping ? { shipping } : {}),
          ...(notes ? { notes } : {}),
        },
      });
      return res.json();
    },
    onSuccess: (_, { product }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      setAddedIds(prev => new Set([...prev, product.id]));
      setSelectedProduct(null);
      toast({ title: `✓ تمت إضافة "${product.nameAr}" للسلة` });
      setTimeout(() => setAddedIds(prev => { const s = new Set(prev); s.delete(product.id); return s; }), 3000);
    },
    onError: () => toast({ title: "يجب تسجيل الدخول أولاً", variant: "destructive" }),
  });

  const filtered = products?.filter(p => {
    const matchSearch = !search || p.nameAr?.includes(search) || p.name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || p.category === filterCat;
    return matchSearch && matchCat && p.isActive;
  }) || [];

  const featured = filtered.filter(p => p.featured);
  const regular = filtered.filter(p => !p.featured);

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    processing: "bg-blue-50 text-blue-700 border-blue-200",
    shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
    out_for_delivery: "bg-orange-50 text-orange-700 border-orange-200",
    delivered: "bg-green-50 text-green-700 border-green-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };
  const statusLabels: Record<string, string> = {
    pending: "قيد الانتظار", processing: "قيد التجهيز", shipped: "تم الشحن",
    out_for_delivery: "في الطريق", delivered: "تم التوصيل", cancelled: "ملغي", returned: "مُرتجع",
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5] dark:bg-gray-950" dir="rtl">
      <Navigation />

      {/* ── Hero ── */}
      <section className="pt-0 pb-0 relative overflow-hidden">
        <div className="relative bg-black min-h-[48vh] flex items-end">
          <PageGraphics variant="full-dark" />
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "24px 24px" }} />
          {[
            { w: 400, h: 400, top: "-10%", right: "-5%", from: "from-blue-500/20", to: "to-indigo-600/10", dur: 9 },
            { w: 280, h: 280, top: "30%", left: "-5%", from: "from-purple-500/15", to: "to-violet-600/8", dur: 12 },
          ].map((o, i) => (
            <motion.div key={i} className={`absolute rounded-full bg-gradient-to-br ${o.from} ${o.to} blur-3xl pointer-events-none`}
              style={{ width: o.w, height: o.h, top: o.top, ...(o.right ? { right: o.right } : { left: o.left }) }}
              animate={{ y: [0, -20, 0], scale: [1, 1.07, 1] }}
              transition={{ duration: o.dur, repeat: Infinity, ease: "easeInOut" }} />
          ))}
          <div className="container mx-auto px-4 relative z-10 pt-36 pb-14">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 border border-white/15 rounded-full px-5 py-2 mb-6 bg-white/5 backdrop-blur-sm">
                <Package className="w-3.5 h-3.5 text-white/50" />
                <span className="text-xs font-medium text-white/50">متجر QIROX</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-white mb-4 leading-[1.05] tracking-tight">
                الأجهزة<br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">والإضافات</span>
              </h1>
              <p className="text-white/45 text-lg max-w-xl">كل ما تحتاجه لإطلاق مشروعك الرقمي — أجهزة، استضافة، دومين، بريد احترافي، وأكثر</p>
            </motion.div>
          </div>
          <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#f5f5f5] dark:from-gray-950 to-transparent" />
        </div>
      </section>

      {/* ── Search & Filters ── */}
      <section className="pt-8 pb-6 container mx-auto px-4">
        <div className="max-w-lg mx-auto mb-6">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/25 dark:text-white/25" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن منتج..."
              className="pr-11 h-12 rounded-2xl border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-gray-900 shadow-sm text-sm" data-testid="input-product-search" />
          </div>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex flex-wrap justify-center gap-2">
          {[{ key: "all", label: "الكل", icon: Package }].concat(
            Object.entries(categoryConfig).map(([k, v]) => ({ key: k, label: v.label, icon: v.icon }))
          ).map(cat => {
            const Icon = cat.icon;
            const count = cat.key === "all" ? products?.length : products?.filter(p => p.category === cat.key && p.isActive).length;
            if (cat.key !== "all" && (count ?? 0) === 0) return null;
            const isActive = filterCat === cat.key;
            return (
              <button key={cat.key} onClick={() => setFilterCat(cat.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all border ${isActive ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-lg" : "bg-white dark:bg-gray-900 text-black/55 dark:text-white/55 border-black/[0.08] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20"}`}
                data-testid={`filter-cat-${cat.key}`}>
                <Icon className="w-3.5 h-3.5" />{cat.label}
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
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-5">
                  <Star className="w-4 h-4 text-amber-500" />
                  <h2 className="text-sm font-black text-black/60 dark:text-white/60 uppercase tracking-wider">المنتجات المميزة</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {featured.map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} user={user} addedIds={addedIds}
                      onOpen={() => setSelectedProduct(p)} isFeat />
                  ))}
                </div>
              </div>
            )}
            {regular.length > 0 && (
              <div>
                {featured.length > 0 && (
                  <div className="flex items-center gap-2 mb-5">
                    <Package className="w-4 h-4 text-black/40 dark:text-white/40" />
                    <h2 className="text-sm font-black text-black/60 dark:text-white/60 uppercase tracking-wider">جميع المنتجات</h2>
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {regular.map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} user={user} addedIds={addedIds}
                      onOpen={() => setSelectedProduct(p)} />
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
              {myShipments.map((s: any) => (
                <div key={s.id || s._id}
                  className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4 flex items-center justify-between gap-4"
                  data-testid={`shipment-${s.id || s._id}`}>
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
                      className="flex items-center gap-1 text-xs font-medium text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white border border-black/[0.1] dark:border-white/[0.1] rounded-xl px-3 py-1.5 shrink-0"
                      data-testid={`link-track-${s.id || s._id}`}>
                      <ExternalLink className="w-3 h-3" />تتبع
                    </a>
                  )}
                </div>
              ))}
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

      {/* Product Detail Sheet */}
      <Sheet open={!!selectedProduct} onOpenChange={v => !v && setSelectedProduct(null)}>
        <SheetContent side="left" className="w-full sm:max-w-lg p-0 overflow-hidden border-0" dir="rtl">
          {selectedProduct && (
            <ProductDetailSheet
              product={selectedProduct}
              user={user}
              onClose={() => setSelectedProduct(null)}
              onAddToCart={(shipping, notes) => {
                if (!user) { toast({ title: "يجب تسجيل الدخول أولاً", variant: "destructive" }); return; }
                addToCartMutation.mutate({ product: selectedProduct, shipping: shipping ?? undefined, notes });
              }}
              isPending={addToCartMutation.isPending}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
