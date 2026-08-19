import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Store, Plus, Search, Globe, Edit3, Trash2, Rocket, PauseCircle,
  ExternalLink, Copy, Check, ChevronRight, Loader2, ShoppingBag,
  Utensils, Shirt, Cpu, Sparkles, ShoppingCart, Pill, BookOpen,
  Users, Clock, Activity, CheckCircle2, XCircle, Settings, RefreshCw,
  Wand2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Template definitions ────────────────────────────────────────────────────
const TEMPLATES = [
  {
    slug: "ecommerce",
    nameAr: "متجر عام",
    nameEn: "General Store",
    icon: ShoppingBag,
    color: "#000",
    bg: "bg-black",
    desc: "متجر إلكتروني شامل لجميع أنواع المنتجات مع نظام دفع متكامل",
    features: ["٢٨ صفحة", "٧ طرق دفع", "مخزون", "POS"],
    demo: "https://e-commerce.qiroxstudio.online",
  },
  {
    slug: "restaurant",
    nameAr: "مطعم وكافيه",
    nameEn: "Restaurant & Café",
    icon: Utensils,
    color: "#1a0500",
    bg: "bg-[#1a0500]",
    desc: "نظام طلبات متكامل للمطاعم والكافيهات مع منيو رقمي",
    features: ["منيو رقمي", "طلبات أونلاين", "تتبع الطلبات", "POS"],
    demo: null,
  },
  {
    slug: "fashion",
    nameAr: "متجر أزياء",
    nameEn: "Fashion Store",
    icon: Shirt,
    color: "#0f0520",
    bg: "bg-[#0f0520]",
    desc: "متجر الأزياء والملابس مع مقاسات وألوان متعددة",
    features: ["مقاسات", "ألوان", "عروض", "برنامج ولاء"],
    demo: null,
  },
  {
    slug: "electronics",
    nameAr: "إلكترونيات",
    nameEn: "Electronics",
    icon: Cpu,
    color: "#00100a",
    bg: "bg-[#00100a]",
    desc: "متجر الأجهزة الإلكترونية مع مواصفات تقنية تفصيلية",
    features: ["مواصفات تقنية", "مقارنة", "ضمان", "تسليم سريع"],
    demo: null,
  },
  {
    slug: "beauty",
    nameAr: "تجميل وعناية",
    nameEn: "Beauty & Care",
    icon: Sparkles,
    color: "#1a0010",
    bg: "bg-[#1a0010]",
    desc: "متجر مستحضرات التجميل والعناية الشخصية مع حجوزات",
    features: ["حجوزات", "مواعيد", "عروض خاصة", "ولاء"],
    demo: null,
  },
  {
    slug: "grocery",
    nameAr: "بقالة وسوبرماركت",
    nameEn: "Grocery & Supermarket",
    icon: ShoppingCart,
    color: "#001a00",
    bg: "bg-[#001a00]",
    desc: "سوبرماركت متكامل مع توصيل وتتبع الطلبات",
    features: ["توصيل سريع", "عروض يومية", "اشتراك شهري", "مخزون"],
    demo: null,
  },
  {
    slug: "pharmacy",
    nameAr: "صيدلية",
    nameEn: "Pharmacy",
    icon: Pill,
    color: "#00001a",
    bg: "bg-[#00001a]",
    desc: "صيدلية إلكترونية مع وصفات طبية وتذكير بالدواء",
    features: ["وصفات طبية", "تتبع دواء", "تذكير", "توصيل"],
    demo: null,
  },
  {
    slug: "bookstore",
    nameAr: "مكتبة",
    nameEn: "Bookstore & Stationery",
    icon: BookOpen,
    color: "#0a0a00",
    bg: "bg-[#0a0a00]",
    desc: "مكتبة إلكترونية مع كتب رقمية وورقية وقرطاسية",
    features: ["كتب رقمية", "PDF", "اشتراك", "تصفح حر"],
    demo: null,
  },
];

const PLANS = [
  { slug: "lite", label: "لايت", price: "٦٩٩ ر.س" },
  { slug: "pro", label: "برو", price: "١٢٤٩ ر.س" },
  { slug: "infinite", label: "إنفينيت", price: "١٦٩٩ ر.س" },
];

function statusInfo(status: string) {
  switch (status) {
    case "active":    return { label: "نشط", dot: "bg-emerald-500", badge: "text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400" };
    case "draft":     return { label: "مسودة", dot: "bg-gray-400", badge: "text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300" };
    case "suspended": return { label: "موقوف", dot: "bg-amber-500", badge: "text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400" };
    case "cancelled": return { label: "ملغي", dot: "bg-red-500", badge: "text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400" };
    default:          return { label: status, dot: "bg-gray-400", badge: "text-gray-600 bg-gray-100" };
  }
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="w-6 h-6 rounded-md flex items-center justify-center text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ── Store Form Dialog ────────────────────────────────────────────────────────
function StoreDialog({
  open, onClose, store, clients,
}: {
  open: boolean;
  onClose: () => void;
  store?: any;
  clients: any[];
}) {
  const { toast } = useToast();
  const isEdit = !!store;
  const [form, setForm] = useState({
    clientId: store?.clientId?.id || store?.clientId || "",
    templateSlug: store?.templateSlug || "ecommerce",
    storeNameAr: store?.storeNameAr || "",
    storeNameEn: store?.storeNameEn || "",
    description: store?.description || "",
    subdomain: store?.subdomain || "",
    customDomain: store?.customDomain || "",
    planSlug: store?.planSlug || "lite",
    adminEmail: store?.adminEmail || "",
    adminPhone: store?.adminPhone || "",
    adminNotes: store?.adminNotes || "",
  });

  const [generatingName, setGeneratingName] = useState(false);

  const mut = useMutation({
    mutationFn: async () => {
      const r = isEdit
        ? await apiRequest("PUT", `/api/admin/client-stores/${store.id}`, form)
        : await apiRequest("POST", "/api/admin/client-stores", form);
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/client-stores"] });
      toast({ title: isEdit ? "تم التحديث" : "تم إنشاء المتجر" });
      onClose();
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const selectedTemplate = TEMPLATES.find(t => t.slug === form.templateSlug);

  // Generate AI store name
  const generateName = async () => {
    setGeneratingName(true);
    try {
      const r = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `اقترح اسماً تجارياً لمتجر من نوع "${selectedTemplate?.nameAr}". أعطني اسماً واحداً فقط باللغة العربية، قصيراً وجذاباً ومناسباً للسوق السعودي. بدون شرح.`
          }]
        }),
      });
      if (r.ok) {
        const data = await r.json();
        const name = data.content || data.choices?.[0]?.message?.content || "";
        if (name.trim()) setForm(f => ({ ...f, storeNameAr: name.trim() }));
      }
    } catch { }
    setGeneratingName(false);
  };

  const selectedClient = clients.find(c => c.id === form.clientId || c._id === form.clientId);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-black text-black dark:text-white">
            {isEdit ? "تعديل المتجر" : "إنشاء متجر جديد"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Client Selector */}
          {!isEdit && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest">العميل</label>
              <Select value={form.clientId} onValueChange={v => setForm(f => ({ ...f, clientId: v }))}>
                <SelectTrigger className="rounded-xl border-black/10 dark:border-white/10">
                  <SelectValue placeholder="اختر عميلاً..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id || c._id} value={c.id || c._id}>
                      {c.fullName || c.username} {c.email ? `— ${c.email}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Template Picker */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest">القالب</label>
            <div className="grid grid-cols-4 gap-2">
              {TEMPLATES.map(t => {
                const Icon = t.icon;
                const active = form.templateSlug === t.slug;
                return (
                  <button
                    key={t.slug}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, templateSlug: t.slug }))}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                      active
                        ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black"
                        : "border-black/[0.07] dark:border-white/[0.07] hover:border-black/20 dark:hover:border-white/20"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[9px] font-bold leading-tight">{t.nameAr}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Store Names */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest">اسم المتجر (عربي)</label>
                <button
                  type="button"
                  onClick={generateName}
                  disabled={generatingName}
                  className="flex items-center gap-1 text-[10px] font-semibold text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
                >
                  {generatingName ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  AI
                </button>
              </div>
              <Input
                value={form.storeNameAr}
                onChange={e => setForm(f => ({ ...f, storeNameAr: e.target.value }))}
                placeholder="مثال: متجر النخبة"
                className="rounded-xl"
                dir="rtl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest">اسم المتجر (إنجليزي)</label>
              <Input
                value={form.storeNameEn}
                onChange={e => setForm(f => ({ ...f, storeNameEn: e.target.value }))}
                placeholder="e.g. Elite Store"
                className="rounded-xl"
                dir="ltr"
              />
            </div>
          </div>

          {/* Plan */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest">الباقة</label>
            <div className="grid grid-cols-3 gap-2">
              {PLANS.map(p => (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, planSlug: p.slug }))}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    form.planSlug === p.slug
                      ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black"
                      : "border-black/[0.07] dark:border-white/[0.07] hover:border-black/20"
                  }`}
                >
                  <p className="text-xs font-black">{p.label}</p>
                  <p className={`text-[10px] ${form.planSlug === p.slug ? "opacity-70" : "text-black/40 dark:text-white/40"}`}>{p.price}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Domain Config */}
          <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.07] dark:border-white/[0.07] space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-black/30 dark:text-white/30">إعدادات النطاق</p>
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-black/50 dark:text-white/50">النطاق الفرعي</label>
              <div className="flex items-center gap-0 rounded-xl border border-black/10 dark:border-white/10 overflow-hidden bg-white dark:bg-gray-900">
                <Input
                  value={form.subdomain}
                  onChange={e => setForm(f => ({ ...f, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                  placeholder="myshop"
                  className="rounded-none border-0 border-r border-black/10 dark:border-white/10 flex-1 text-sm"
                  dir="ltr"
                />
                <span className="px-3 text-[11px] text-black/40 dark:text-white/40 font-mono">.stores.qiroxstudio.online</span>
              </div>
              {form.subdomain && (
                <div className="flex items-center gap-2 mt-1 px-1">
                  <Globe className="w-3 h-3 text-black/30 dark:text-white/30" />
                  <span className="text-[11px] text-black/50 dark:text-white/50 font-mono" dir="ltr">
                    {form.subdomain}.stores.qiroxstudio.online
                  </span>
                  <CopyBtn text={`${form.subdomain}.stores.qiroxstudio.online`} />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-black/50 dark:text-white/50">نطاق مخصص (اختياري)</label>
              <Input
                value={form.customDomain}
                onChange={e => setForm(f => ({ ...f, customDomain: e.target.value }))}
                placeholder="shop.mybrand.com"
                className="rounded-xl"
                dir="ltr"
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest">بريد المدير</label>
              <Input value={form.adminEmail} onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))} placeholder="admin@store.com" className="rounded-xl" dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest">رقم المدير</label>
              <Input value={form.adminPhone} onChange={e => setForm(f => ({ ...f, adminPhone: e.target.value }))} placeholder="05XXXXXXXX" className="rounded-xl" dir="ltr" />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest">ملاحظات إدارية</label>
            <Textarea value={form.adminNotes} onChange={e => setForm(f => ({ ...f, adminNotes: e.target.value }))} placeholder="ملاحظات داخلية..." rows={2} className="rounded-xl resize-none text-sm" />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            className="flex-1 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl gap-2"
            onClick={() => mut.mutate()}
            disabled={mut.isPending || (!isEdit && !form.clientId)}
          >
            {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEdit ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
            {isEdit ? "حفظ التعديلات" : "إنشاء المتجر"}
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={onClose}>إلغاء</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function AdminClientStores() {
  const { toast } = useToast();
  const { dir } = useI18n();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"stores" | "templates">("stores");
  const [createOpen, setCreateOpen] = useState(false);
  const [editStore, setEditStore] = useState<any>(null);

  const { data: stores = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/client-stores"],
    queryFn: async () => {
      const r = await fetch("/api/admin/client-stores", { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
  });

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/client-stores/clients"],
    queryFn: async () => {
      const r = await fetch("/api/admin/client-stores/clients", { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
  });

  const publishMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await apiRequest("POST", `/api/admin/client-stores/${id}/publish`, {});
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/client-stores"] }); toast({ title: "✅ تم النشر! أُرسل إشعار للعميل" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const suspendMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await apiRequest("POST", `/api/admin/client-stores/${id}/suspend`, {});
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/client-stores"] }); toast({ title: "المتجر موقوف" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await apiRequest("DELETE", `/api/admin/client-stores/${id}`, {});
      if (!r.ok) throw new Error("فشل الحذف");
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/client-stores"] }); toast({ title: "تم الحذف" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    let list = stores;
    if (statusFilter !== "all") list = list.filter(s => s.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        (s.storeNameAr || "").toLowerCase().includes(q) ||
        (s.storeNameEn || "").toLowerCase().includes(q) ||
        (s.clientId?.fullName || "").toLowerCase().includes(q) ||
        (s.subdomain || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [stores, statusFilter, search]);

  const stats = useMemo(() => ({
    total: stores.length,
    active: stores.filter(s => s.status === "active").length,
    draft: stores.filter(s => s.status === "draft").length,
    suspended: stores.filter(s => s.status === "suspended").length,
  }), [stores]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto" dir={dir}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black dark:bg-white flex items-center justify-center">
            <Store className="w-5 h-5 text-white dark:text-black" />
          </div>
          <div>
            <h1 className="text-lg font-black text-black dark:text-white">متاجر العملاء</h1>
            <p className="text-xs text-black/35 dark:text-white/35">إدارة ونشر متاجر العملاء — QIROX Stores</p>
          </div>
        </div>
        <Button
          className="bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl gap-2 h-9 text-sm"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-4 h-4" />
          متجر جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "إجمالي المتاجر", val: stats.total, icon: Store, color: "text-black dark:text-white" },
          { label: "نشطة", val: stats.active, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "مسودة", val: stats.draft, icon: Clock, color: "text-gray-500" },
          { label: "موقوفة", val: stats.suspended, icon: PauseCircle, color: "text-amber-600 dark:text-amber-400" },
        ].map(s => (
          <Card key={s.label} className="border-black/[0.06] dark:border-white/[0.06] shadow-none rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-8 h-8 ${s.color}`} />
              <div>
                <p className="text-xl font-black text-black dark:text-white">{s.val}</p>
                <p className="text-[10px] text-black/40 dark:text-white/40">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-black/[0.04] dark:bg-white/[0.04] rounded-xl p-0.5 gap-0.5 w-fit">
        {(["stores", "templates"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab
                ? "bg-black dark:bg-white text-white dark:text-black shadow-sm"
                : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
            }`}
          >
            {tab === "stores" ? "المتاجر" : "القوالب المتاحة (٨)"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "stores" ? (
          <motion.div key="stores" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 dark:text-white/30" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="بحث بالاسم أو العميل أو النطاق..."
                  className="pr-9 rounded-xl border-black/10 dark:border-white/10 h-9 text-sm"
                />
              </div>
              <div className="flex gap-1.5">
                {["all", "active", "draft", "suspended"].map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                      statusFilter === s
                        ? "bg-black dark:bg-white text-white dark:text-black"
                        : "bg-black/[0.04] dark:bg-white/[0.04] text-black/50 dark:text-white/50 hover:bg-black/8 dark:hover:bg-white/8"
                    }`}
                  >
                    {s === "all" ? "الكل" : statusInfo(s).label}
                  </button>
                ))}
              </div>
            </div>

            {/* Store List */}
            {isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-black/20" /></div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center">
                  <Store className="w-8 h-8 text-black/20 dark:text-white/20" />
                </div>
                <div>
                  <p className="font-bold text-black/60 dark:text-white/50">
                    {stores.length === 0 ? "لا توجد متاجر بعد" : "لا توجد نتائج"}
                  </p>
                  <p className="text-sm text-black/30 dark:text-white/25 mt-1">
                    {stores.length === 0 ? "أنشئ أول متجر لعميل الآن" : "جرب كلمة بحث مختلفة"}
                  </p>
                </div>
                {stores.length === 0 && (
                  <Button className="bg-black dark:bg-white text-white dark:text-black rounded-xl gap-2" onClick={() => setCreateOpen(true)}>
                    <Plus className="w-4 h-4" /> إنشاء أول متجر
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-black/[0.07] dark:border-white/[0.07] overflow-hidden">
                {filtered.map((store, i) => {
                  const template = TEMPLATES.find(t => t.slug === store.templateSlug);
                  const si = statusInfo(store.status);
                  const Icon = template?.icon || Store;
                  const clientName = store.clientId?.fullName || store.clientId?.username || "—";
                  const storeUrl = store.subdomain
                    ? `https://${store.subdomain}.stores.qiroxstudio.online`
                    : store.customDomain ? `https://${store.customDomain}` : null;

                  return (
                    <div key={store.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors ${i !== 0 ? "border-t border-black/[0.05] dark:border-white/[0.05]" : ""}`}>
                      {/* Template icon */}
                      <div className={`w-10 h-10 rounded-xl ${template?.bg || "bg-black"} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-black dark:text-white truncate">
                            {store.storeNameAr || store.storeNameEn || "بدون اسم"}
                          </p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${si.badge}`}>
                            {si.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] text-black/40 dark:text-white/35 flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" /> {clientName}
                          </span>
                          <span className="text-[10px] text-black/35 dark:text-white/30">{template?.nameAr}</span>
                          {store.subdomain && (
                            <span className="text-[10px] font-mono text-black/30 dark:text-white/25 flex items-center gap-1">
                              <Globe className="w-2.5 h-2.5" /> {store.subdomain}.stores.qiroxstudio.online
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {storeUrl && (
                          <a href={storeUrl} target="_blank" rel="noopener noreferrer"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => setEditStore(store)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {store.status === "draft" || store.status === "suspended" ? (
                          <Button
                            size="sm"
                            className="h-7 px-3 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold rounded-lg gap-1"
                            onClick={() => publishMut.mutate(store.id)}
                            disabled={publishMut.isPending}
                          >
                            <Rocket className="w-3 h-3" /> نشر
                          </Button>
                        ) : store.status === "active" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-3 text-[10px] font-bold rounded-lg gap-1 border-amber-200 text-amber-700 hover:bg-amber-50"
                            onClick={() => suspendMut.mutate(store.id)}
                            disabled={suspendMut.isPending}
                          >
                            <PauseCircle className="w-3 h-3" /> إيقاف
                          </Button>
                        ) : null}
                        <button
                          onClick={() => { if (confirm("حذف هذا المتجر نهائياً؟")) deleteMut.mutate(store.id); }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400/50 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="templates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {TEMPLATES.map(t => {
                const Icon = t.icon;
                const usedCount = stores.filter(s => s.templateSlug === t.slug).length;
                return (
                  <Card key={t.slug} className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl overflow-hidden group hover:border-black/20 dark:hover:border-white/20 transition-all">
                    {/* Template header */}
                    <div className={`${t.bg} p-6 flex flex-col items-center gap-3`}>
                      <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-center">
                        <p className="font-black text-white text-sm">{t.nameAr}</p>
                        <p className="text-white/60 text-[10px]">{t.nameEn}</p>
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <p className="text-xs text-black/50 dark:text-white/45 leading-relaxed">{t.desc}</p>
                      <div className="flex flex-wrap gap-1">
                        {t.features.map(f => (
                          <span key={f} className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-black/50 dark:text-white/45">{f}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-black/30 dark:text-white/25">{usedCount} متجر نشط</span>
                        <div className="flex gap-1.5">
                          {t.demo && (
                            <a href={t.demo} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[10px] font-bold text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors">
                              <ExternalLink className="w-3 h-3" /> عرض
                            </a>
                          )}
                          <button
                            onClick={() => { setActiveTab("stores"); setCreateOpen(true); }}
                            className="flex items-center gap-1 text-[10px] font-bold text-black dark:text-white"
                          >
                            <Plus className="w-3 h-3" /> إنشاء
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Dialog */}
      {createOpen && (
        <StoreDialog open={createOpen} onClose={() => setCreateOpen(false)} clients={clients} />
      )}
      {/* Edit Dialog */}
      {editStore && (
        <StoreDialog open={!!editStore} onClose={() => setEditStore(null)} store={editStore} clients={clients} />
      )}
    </div>
  );
}
