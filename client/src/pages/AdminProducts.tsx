import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Loader2, Plus, Pencil, Trash2, Package, Search, Star, Image as ImageIcon,
  Sparkles, Truck, Globe, MapPin, Clock, ExternalLink, Info
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import type { QiroxProduct } from "@shared/schema";
import { motion } from "framer-motion";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

interface ShippingCompany {
  id: string;
  name: string;
  nameAr: string;
  logo: string;
  color: string;
  basePrice: number;
  outsideCityPrice: number;
  estimatedDays: string;
  outsideCityDays: string;
  trackingUrlTemplate: string;
  regions: string[];
  isActive: boolean;
}

interface ShippingProvider {
  companyId: string;
  nameAr: string;
  customPrice: number | "";
  customOutsideCityPrice: number | "";
  isActive: boolean;
}

const categoryLabels: Record<string, { label: string; color: string }> = {
  device:   { label: "جهاز / معدات",      color: "bg-blue-50 text-blue-700 border-blue-200" },
  hosting:  { label: "استضافة",           color: "bg-purple-50 text-purple-700 border-purple-200" },
  domain:   { label: "دومين",             color: "bg-green-50 text-green-700 border-green-200" },
  email:    { label: "بريد إلكتروني",     color: "bg-orange-50 text-orange-700 border-orange-200" },
  gift:     { label: "هدية",              color: "bg-pink-50 text-pink-700 border-pink-200" },
  software: { label: "برمجيات",           color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  other:    { label: "أخرى",              color: "bg-gray-50 text-gray-600 border-gray-200" },
};

const emptyForm = {
  name: "", nameAr: "", description: "", descriptionAr: "",
  category: "device" as const, price: "", currency: "SAR",
  images: [""], serviceSlug: "", badge: "", isActive: true,
  featured: false, specs: "", stock: "-1", displayOrder: "0",
  linkedPlanSlug: "", requiresShipping: false,
  shippingProviders: [] as ShippingProvider[],
};

export default function AdminProducts() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const { data: products, isLoading } = useQuery<QiroxProduct[]>({
    queryKey: ["/api/admin/products"],
  });

  const { data: shippingCompanies } = useQuery<ShippingCompany[]>({
    queryKey: ["/api/admin/shipping-companies"],
  });

  const { data: pricingPlans } = useQuery<any[]>({ queryKey: ["/api/pricing"] });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/products", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      setDialogOpen(false);
      setForm({ ...emptyForm });
      toast({ title: "تم إضافة المنتج بنجاح" });
    },
    onError: () => toast({ title: "خطأ في الإضافة", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/products/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      setDialogOpen(false);
      setEditingId(null);
      toast({ title: "تم التحديث" });
    },
    onError: () => toast({ title: "خطأ في التحديث", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      toast({ title: "تم الحذف" });
    },
  });

  const openCreate = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (p: QiroxProduct) => {
    const providers: ShippingProvider[] = ((p as any).shippingProviders || []).map((sp: any) => ({
      companyId: sp.companyId,
      nameAr: sp.nameAr || "",
      customPrice: sp.customPrice ?? "",
      customOutsideCityPrice: sp.customOutsideCityPrice ?? "",
      isActive: sp.isActive ?? true,
    }));
    setForm({
      name: p.name, nameAr: p.nameAr, description: p.description || "",
      descriptionAr: p.descriptionAr || "", category: p.category as any, price: String(p.price),
      currency: p.currency, images: p.images?.length ? p.images : [""],
      serviceSlug: p.serviceSlug || "", badge: p.badge || "", isActive: p.isActive,
      featured: p.featured, specs: p.specs ? JSON.stringify(p.specs, null, 2) : "",
      stock: String(p.stock), displayOrder: String(p.displayOrder),
      linkedPlanSlug: (p as any).linkedPlanSlug || "",
      requiresShipping: (p as any).requiresShipping ?? false,
      shippingProviders: providers,
    });
    setEditingId(p.id);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    let specsObj: any = undefined;
    if (form.specs.trim()) {
      try { specsObj = JSON.parse(form.specs); } catch { specsObj = { notes: form.specs }; }
    }
    const cleanedProviders = form.shippingProviders.map(sp => ({
      ...sp,
      customPrice: sp.customPrice === "" ? undefined : Number(sp.customPrice),
      customOutsideCityPrice: sp.customOutsideCityPrice === "" ? undefined : Number(sp.customOutsideCityPrice),
    }));
    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      displayOrder: Number(form.displayOrder),
      images: form.images.filter(Boolean),
      specs: specsObj,
      shippingProviders: cleanedProviders,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const toggleShippingProvider = (company: ShippingCompany) => {
    setForm(f => {
      const existing = f.shippingProviders.find(sp => sp.companyId === company.id);
      if (existing) {
        return { ...f, shippingProviders: f.shippingProviders.filter(sp => sp.companyId !== company.id) };
      } else {
        return {
          ...f,
          shippingProviders: [...f.shippingProviders, {
            companyId: company.id,
            nameAr: company.nameAr,
            customPrice: "",
            customOutsideCityPrice: "",
            isActive: true,
          }],
        };
      }
    });
  };

  const updateProviderField = (companyId: string, field: keyof ShippingProvider, value: any) => {
    setForm(f => ({
      ...f,
      shippingProviders: f.shippingProviders.map(sp =>
        sp.companyId === companyId ? { ...sp, [field]: value } : sp
      ),
    }));
  };

  const filtered = products?.filter(p => {
    const matchSearch = !search || p.nameAr.includes(search) || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || p.category === filterCat;
    return matchSearch && matchCat;
  }) || [];

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 relative overflow-hidden">
      <PageGraphics variant="dashboard" />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-black dark:text-white flex items-center gap-3">
          <Package className="w-7 h-7 text-black/40 dark:text-white/40" />
          المنتجات والأجهزة
        </h1>
        <Button className="premium-btn gap-2" onClick={openCreate} data-testid="button-add-product">
          <Plus className="w-4 h-4" />
          إضافة منتج
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(categoryLabels).slice(0, 4).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setFilterCat(filterCat === key ? "all" : key)}
            className={`border rounded-xl p-3 flex items-center gap-3 text-right transition-all w-full ${filterCat === key ? 'border-black/20 dark:border-white/20 bg-black/[0.02] dark:bg-white/[0.04]' : 'border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-[#111] hover:bg-black/[0.01]'}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${val.color}`}>
              {products?.filter(p => p.category === key).length || 0}
            </div>
            <span className="text-xs text-black/60 dark:text-white/60 font-medium">{val.label}</span>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/25" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث في المنتجات..."
            className="pr-9 h-9 text-sm"
            data-testid="input-search-products"
          />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-40 h-9 text-xs" data-testid="select-filter-cat">
            <SelectValue placeholder="الفئة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الفئات</SelectItem>
            {Object.entries(categoryLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin w-8 h-8 text-black/20" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p, i) => {
            const cat = categoryLabels[p.category] || categoryLabels.other;
            const shipCount = ((p as any).shippingProviders || []).filter((sp: any) => sp.isActive).length;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white dark:bg-[#111] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl overflow-hidden hover:shadow-md transition-all group"
                data-testid={`product-card-${p.id}`}
              >
                <div className="relative h-44 bg-black/[0.02] dark:bg-white/[0.03] flex items-center justify-center overflow-hidden">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.nameAr} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-black/20 dark:text-white/20">
                      <ImageIcon className="w-10 h-10" />
                      <span className="text-xs">لا توجد صورة</span>
                    </div>
                  )}
                  {p.featured && (
                    <div className="absolute top-2 right-2 bg-black text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="w-2.5 h-2.5" /> مميز
                    </div>
                  )}
                  {p.badge && (
                    <div className="absolute top-2 left-2 bg-white/90 text-black text-[9px] font-bold px-2 py-0.5 rounded-full border border-black/10">
                      {p.badge}
                    </div>
                  )}
                  {(p as any).linkedPlanSlug && (
                    <div className="absolute bottom-2 left-2 bg-cyan-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />باقة
                    </div>
                  )}
                  {shipCount > 0 && (
                    <div className="absolute bottom-2 right-2 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Truck className="w-2.5 h-2.5" />{shipCount} شركة شحن
                    </div>
                  )}
                  {!p.isActive && (
                    <div className="absolute inset-0 bg-white/70 dark:bg-black/70 flex items-center justify-center">
                      <span className="text-xs text-black/40 dark:text-white/40 font-medium border border-black/20 dark:border-white/20 px-3 py-1 rounded-full bg-white dark:bg-[#111]">غير نشط</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-black dark:text-white truncate">{p.nameAr}</h3>
                      <p className="text-[10px] text-black/35 dark:text-white/35 truncate">{p.name}</p>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${cat.color}`}>{cat.label}</span>
                  </div>
                  {p.descriptionAr && <p className="text-[11px] text-black/40 dark:text-white/40 line-clamp-2 mb-3">{p.descriptionAr}</p>}
                  {p.specs && Object.keys(p.specs).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {Object.entries(p.specs).slice(0, 3).map(([k, v]) => (
                        <span key={k} className="text-[9px] bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.06] px-1.5 py-0.5 rounded text-black/50 dark:text-white/50">
                          {k}: {String(v)}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-black text-black dark:text-white">
                      {p.price.toLocaleString()} <span className="text-xs font-normal text-black/40 dark:text-white/40">{p.currency}</span>
                    </p>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="w-8 h-8 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white" onClick={() => openEdit(p)} data-testid={`button-edit-${p.id}`}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 text-red-400 hover:text-red-600"
                        onClick={() => { if (confirm("هل أنت متأكد من الحذف؟")) deleteMutation.mutate(p.id); }}
                        data-testid={`button-delete-${p.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && !isLoading && (
            <div className="col-span-full py-20 flex flex-col items-center text-black/30 dark:text-white/30">
              <Package className="w-12 h-12 mb-3 text-black/10 dark:text-white/10" />
              <p className="text-sm">لا توجد منتجات</p>
              <Button variant="ghost" className="mt-4 text-xs" onClick={openCreate}>إضافة أول منتج</Button>
            </div>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(v) => !v && setDialogOpen(false)}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-bold text-lg">{editingId ? "تعديل المنتج" : "إضافة منتج جديد"}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="info" className="mt-2">
            <TabsList className="w-full grid grid-cols-3 h-9 mb-4">
              <TabsTrigger value="info" className="text-xs gap-1.5"><Package className="w-3.5 h-3.5" />المعلومات</TabsTrigger>
              <TabsTrigger value="shipping" className="text-xs gap-1.5">
                <Truck className="w-3.5 h-3.5" />الشحن
                {form.shippingProviders.length > 0 && (
                  <span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full mr-1">{form.shippingProviders.length}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="advanced" className="text-xs gap-1.5"><Sparkles className="w-3.5 h-3.5" />متقدم</TabsTrigger>
            </TabsList>

            {/* ── TAB: INFO ── */}
            <TabsContent value="info" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-black/50 dark:text-white/50 mb-1 block">الاسم بالعربي *</label>
                  <Input value={form.nameAr} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))} placeholder="جهاز لاب توب..." data-testid="input-product-name-ar" />
                </div>
                <div>
                  <label className="text-xs font-medium text-black/50 dark:text-white/50 mb-1 block">الاسم بالإنجليزي *</label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Laptop..." data-testid="input-product-name" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-black/50 dark:text-white/50 mb-1 block">الوصف (عربي)</label>
                  <Textarea value={form.descriptionAr} onChange={e => setForm(f => ({ ...f, descriptionAr: e.target.value }))} placeholder="وصف المنتج..." rows={2} className="resize-none text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-black/50 dark:text-white/50 mb-1 block">الفئة *</label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as any }))}>
                    <SelectTrigger data-testid="select-product-category"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-black/50 dark:text-white/50 mb-1 block">السعر (ر.س) *</label>
                  <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0" data-testid="input-product-price" />
                </div>
                <div>
                  <label className="text-xs font-medium text-black/50 dark:text-white/50 mb-1 block">بادج</label>
                  <Input value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} placeholder="الأكثر مبيعاً" data-testid="input-product-badge" />
                </div>
                <div>
                  <label className="text-xs font-medium text-black/50 dark:text-white/50 mb-1 block">المخزون (-1 = غير محدود)</label>
                  <Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} data-testid="input-product-stock" />
                </div>
                <div className="col-span-2">
                  <ImageUpload
                    label="صور المنتج"
                    multiple
                    value={form.images.filter(Boolean)}
                    onChange={(urls) => setForm(f => ({ ...f, images: urls }))}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-black/[0.02] dark:bg-white/[0.03] rounded-xl border border-black/[0.06] dark:border-white/[0.06]">
                  <span className="text-xs font-medium text-black/60 dark:text-white/60">نشط</span>
                  <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} data-testid="switch-product-active" />
                </div>
                <div className="flex items-center justify-between p-3 bg-black/[0.02] dark:bg-white/[0.03] rounded-xl border border-black/[0.06] dark:border-white/[0.06]">
                  <span className="text-xs font-medium text-black/60 dark:text-white/60">مميز</span>
                  <Switch checked={form.featured} onCheckedChange={v => setForm(f => ({ ...f, featured: v }))} data-testid="switch-product-featured" />
                </div>
              </div>
            </TabsContent>

            {/* ── TAB: SHIPPING ── */}
            <TabsContent value="shipping" className="space-y-4">
              {/* Requires shipping toggle */}
              <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200/60 dark:border-amber-700/30">
                <div>
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    هذا المنتج يحتاج شحن
                  </p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-500 mt-0.5">سيُطلب من العميل عنوان توصيل عند الطلب</p>
                </div>
                <Switch checked={form.requiresShipping} onCheckedChange={v => setForm(f => ({ ...f, requiresShipping: v }))} data-testid="switch-requires-shipping" />
              </div>

              {/* Shipping companies list */}
              {!shippingCompanies || shippingCompanies.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-black/[0.08] dark:border-white/[0.08] rounded-2xl">
                  <Truck className="w-10 h-10 mx-auto mb-3 text-black/15 dark:text-white/15" />
                  <p className="text-sm text-black/40 dark:text-white/40 mb-1">لا توجد شركات شحن</p>
                  <p className="text-xs text-black/25 dark:text-white/25">اذهب إلى صفحة شركات الشحن لإضافتها أولاً</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-black/40 dark:text-white/40 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    اختر شركات الشحن المتاحة لهذا المنتج (يمكنك تخصيص الأسعار)
                  </p>
                  {shippingCompanies.map(company => {
                    const linked = form.shippingProviders.find(sp => sp.companyId === company.id);
                    const isLinked = !!linked;
                    return (
                      <motion.div
                        key={company.id}
                        layout
                        className={`border rounded-2xl overflow-hidden transition-all ${isLinked ? "border-black/15 dark:border-white/15 shadow-sm" : "border-black/[0.06] dark:border-white/[0.06]"}`}
                        data-testid={`shipping-provider-${company.id}`}
                      >
                        {/* Color strip */}
                        <div className="h-1" style={{ backgroundColor: isLinked ? company.color : "transparent" }} />

                        <div className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="text-xl w-9 h-9 flex items-center justify-center bg-black/[0.02] dark:bg-white/[0.04] rounded-xl border border-black/[0.05] dark:border-white/[0.05]">
                              {company.logo}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-black dark:text-white">{company.nameAr}</p>
                              <p className="text-[10px] text-black/35 dark:text-white/35">{company.name}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right hidden sm:block">
                                <div className="flex items-center gap-2 text-[10px] text-black/40 dark:text-white/40">
                                  <MapPin className="w-3 h-3 text-blue-400" />
                                  <span>{company.basePrice} ر.س</span>
                                  <span className="text-black/20 dark:text-white/20">|</span>
                                  <Globe className="w-3 h-3 text-amber-400" />
                                  <span>{company.outsideCityPrice} ر.س</span>
                                </div>
                                <p className="text-[9px] text-black/25 dark:text-white/25 flex items-center gap-1 mt-0.5 justify-end">
                                  <Clock className="w-2.5 h-2.5" />{company.estimatedDays}
                                </p>
                              </div>
                              <Switch
                                checked={isLinked && (linked?.isActive ?? true)}
                                onCheckedChange={() => toggleShippingProvider(company)}
                                data-testid={`switch-provider-${company.id}`}
                              />
                            </div>
                          </div>

                          {/* Custom pricing - shown when linked */}
                          {isLinked && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="mt-3 grid grid-cols-2 gap-2 pt-3 border-t border-black/[0.05] dark:border-white/[0.05]"
                            >
                              <div>
                                <label className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1 block">
                                  <MapPin className="w-2.5 h-2.5" /> سعر مخصص داخل الرياض (ر.س)
                                </label>
                                <Input
                                  type="number"
                                  value={linked.customPrice}
                                  onChange={e => updateProviderField(company.id, "customPrice", e.target.value)}
                                  placeholder={`افتراضي: ${company.basePrice}`}
                                  className="h-8 text-xs"
                                  data-testid={`input-custom-price-${company.id}`}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1 block">
                                  <Globe className="w-2.5 h-2.5" /> سعر مخصص خارج الرياض (ر.س)
                                </label>
                                <Input
                                  type="number"
                                  value={linked.customOutsideCityPrice}
                                  onChange={e => updateProviderField(company.id, "customOutsideCityPrice", e.target.value)}
                                  placeholder={`افتراضي: ${company.outsideCityPrice}`}
                                  className="h-8 text-xs"
                                  data-testid={`input-custom-outside-price-${company.id}`}
                                />
                              </div>
                              {company.trackingUrlTemplate && (
                                <div className="col-span-2 flex items-center gap-1.5 text-[9px] text-black/30 dark:text-white/30 bg-black/[0.02] dark:bg-white/[0.03] rounded-lg px-2 py-1.5">
                                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                  تتبع: {company.trackingUrlTemplate.replace("{code}", "XXXX")}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Summary */}
              {form.shippingProviders.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200/60 dark:border-green-700/30">
                  <p className="text-[11px] font-bold text-green-700 dark:text-green-400 w-full flex items-center gap-1.5 mb-1">
                    <Truck className="w-3.5 h-3.5" /> شركات الشحن المرتبطة:
                  </p>
                  {form.shippingProviders.map(sp => {
                    const c = shippingCompanies?.find(x => x.id === sp.companyId);
                    return (
                      <span key={sp.companyId} className="text-[10px] bg-white dark:bg-[#222] border border-green-200 dark:border-green-700/40 px-2 py-0.5 rounded-full text-green-700 dark:text-green-400 font-medium flex items-center gap-1">
                        {c?.logo} {sp.nameAr}
                      </span>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* ── TAB: ADVANCED ── */}
            <TabsContent value="advanced" className="space-y-4">
              <div>
                <label className="text-xs font-medium text-black/50 dark:text-white/50 mb-1 block">خاص بالخدمة (slug)</label>
                <Input value={form.serviceSlug} onChange={e => setForm(f => ({ ...f, serviceSlug: e.target.value }))} placeholder="ecommerce-store" data-testid="input-product-service-slug" />
              </div>
              <div>
                <label className="text-xs font-medium text-black/50 dark:text-white/50 mb-1 flex items-center gap-1.5 block">
                  <Sparkles className="w-3 h-3 text-cyan-500" /> ربط بباقة نظام (اختياري)
                </label>
                <Select value={form.linkedPlanSlug || "none"} onValueChange={v => setForm(f => ({ ...f, linkedPlanSlug: v === "none" ? "" : v }))}>
                  <SelectTrigger data-testid="select-linked-plan"><SelectValue placeholder="لا توجد باقة مرتبطة" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">لا توجد باقة مرتبطة</SelectItem>
                    {pricingPlans?.map((plan: any) => (
                      <SelectItem key={plan.id || plan._id} value={plan.slug || plan.nameAr || String(plan.id || plan._id)}>
                        {plan.nameAr || plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.linkedPlanSlug && (
                  <p className="text-[10px] text-cyan-600 mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />سيظهر للعميل أن هذا المنتج يشمل باقة نظام
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-black/50 dark:text-white/50 mb-1 block">المواصفات (JSON)</label>
                <Textarea
                  value={form.specs}
                  onChange={e => setForm(f => ({ ...f, specs: e.target.value }))}
                  placeholder='{"RAM": "16GB", "Storage": "512GB SSD"}'
                  rows={3}
                  className="resize-none text-xs font-mono"
                  data-testid="input-product-specs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-black/50 dark:text-white/50 mb-1 block">ترتيب العرض</label>
                <Input type="number" value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: e.target.value }))} data-testid="input-product-order" />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 mt-2 border-t border-black/[0.06] dark:border-white/[0.06] pt-4">
            <Button className="flex-1 premium-btn" onClick={handleSubmit} disabled={isPending || !form.nameAr || !form.name || !form.price} data-testid="button-submit-product">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Plus className="w-4 h-4 ml-2" />}
              {editingId ? "حفظ التعديلات" : "إضافة المنتج"}
            </Button>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
