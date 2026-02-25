import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ShoppingCart, Trash2, Plus, Minus, Globe, Mail, Server, Cpu, Gift, Code2, Package, Database, Cloud, CheckCircle2, ArrowLeft, ShoppingBag, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Link } from "wouter";
import type { Cart, CartItem } from "@shared/schema";
import { useUser } from "@/hooks/use-auth";

const typeIcons: Record<string, any> = {
  service: Code2, product: Cpu, domain: Globe, email: Mail, hosting: Server, gift: Gift,
};
const typeLabels: Record<string, string> = {
  service: "خدمة", product: "منتج", domain: "دومين", email: "بريد إلكتروني", hosting: "استضافة", gift: "هدية",
};
const typeColors: Record<string, string> = {
  service: "bg-indigo-50 text-indigo-700 border-indigo-200",
  product: "bg-blue-50 text-blue-700 border-blue-200",
  domain: "bg-green-50 text-green-700 border-green-200",
  email: "bg-orange-50 text-orange-700 border-orange-200",
  hosting: "bg-purple-50 text-purple-700 border-purple-200",
  gift: "bg-pink-50 text-pink-700 border-pink-200",
};

const mongoTiers = [
  { id: "M0", name: "M0 Free", price: 0, ram: "مشترك", storage: "512 MB", note: "تطوير فقط" },
  { id: "M2", name: "M2 Shared", price: 9, ram: "مشترك", storage: "2 GB", note: "مشاريع صغيرة" },
  { id: "M5", name: "M5 Shared", price: 25, ram: "مشترك", storage: "5 GB", note: "مشاريع متوسطة" },
  { id: "M10", name: "M10 Dedicated", price: 57, ram: "2 GB", storage: "10 GB", note: "إنتاج - موصى به" },
  { id: "M20", name: "M20 Dedicated", price: 140, ram: "4 GB", storage: "20 GB", note: "مشاريع متقدمة" },
  { id: "M30", name: "M30 Dedicated", price: 410, ram: "8 GB", storage: "40 GB", note: "حجم تجاري كبير" },
];

const awsTiers = [
  { id: "t3.micro", name: "t3.micro", price: 8, cpu: "2 vCPU", ram: "1 GB", note: "اختبار" },
  { id: "t3.small", name: "t3.small", price: 17, cpu: "2 vCPU", ram: "2 GB", note: "تطبيقات خفيفة" },
  { id: "t3.medium", name: "t3.medium", price: 33, cpu: "2 vCPU", ram: "4 GB", note: "مواقع متوسطة" },
  { id: "t3.large", name: "t3.large", price: 66, cpu: "2 vCPU", ram: "8 GB", note: "تطبيقات متقدمة - موصى به" },
  { id: "m5.large", name: "m5.large", price: 96, cpu: "2 vCPU", ram: "8 GB", note: "أداء محسّن" },
  { id: "c5.xlarge", name: "c5.xlarge", price: 170, cpu: "4 vCPU", ram: "8 GB", note: "تطبيقات حسابية مكثفة" },
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

  const { data: cart, isLoading } = useQuery<Cart>({ queryKey: ["/api/cart"] });

  const removeMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await apiRequest("DELETE", `/api/cart/items/${itemId}`);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/cart"] }),
    onError: () => toast({ title: "خطأ في الحذف", variant: "destructive" }),
  });

  const updateQtyMutation = useMutation({
    mutationFn: async ({ itemId, qty }: { itemId: string; qty: number }) => {
      const res = await apiRequest("PATCH", `/api/cart/items/${itemId}`, { qty });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/cart"] }),
  });

  const addItemMutation = useMutation({
    mutationFn: async (item: Partial<CartItem>) => {
      const res = await apiRequest("POST", "/api/cart/items", item);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      setAddOnDialog(null);
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => { await apiRequest("DELETE", "/api/cart"); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({ title: "تم إفراغ السلة" });
    },
  });

  const couponMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/cart/coupon", { couponCode: coupon, discount: 50 });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({ title: "تم تطبيق الكوبون!" });
    },
    onError: () => toast({ title: "كوبون غير صالح", variant: "destructive" }),
  });

  const addDbToCart = () => {
    if (!selectedDb) return;
    addItemMutation.mutate({
      type: 'hosting',
      name: `MongoDB Atlas ${selectedDb.name}`,
      nameAr: `قاعدة بيانات ${selectedDb.name}`,
      price: selectedDb.price,
      qty: 1,
      config: { dbType: 'mongodb_atlas', tier: selectedDb.id, ram: selectedDb.ram, storage: selectedDb.storage },
    });
  };

  const addAwsToCart = () => {
    if (!selectedAws) return;
    addItemMutation.mutate({
      type: 'hosting',
      name: `AWS EC2 ${selectedAws.name}`,
      nameAr: `خادم AWS ${selectedAws.name}`,
      price: selectedAws.price,
      qty: 1,
      config: { hostingType: 'aws_ec2', tier: selectedAws.id, cpu: selectedAws.cpu, ram: selectedAws.ram },
    });
  };

  const addDomainToCart = () => {
    if (!domainName.trim()) return;
    const ext = domainExtensions.find(d => d.ext === domainExt);
    addItemMutation.mutate({
      type: 'domain',
      name: `Domain: ${domainName}${domainExt}`,
      nameAr: `دومين: ${domainName}${domainExt}`,
      price: ext?.price || 45,
      qty: 1,
      config: { domain: `${domainName}${domainExt}`, extension: domainExt },
    });
  };

  const addEmailToCart = () => {
    if (!selectedEmail) return;
    addItemMutation.mutate({
      type: 'email',
      name: `Business Email ${selectedEmail.name}`,
      nameAr: `بريد أعمال ${selectedEmail.name}`,
      price: selectedEmail.price,
      qty: 1,
      config: { emailPlan: selectedEmail.id, users: selectedEmail.users, storage: selectedEmail.storage },
    });
  };

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = cart?.discountAmount || 0;
  const afterDiscount = subtotal - discount;
  const vat = afterDiscount * VAT_RATE;
  const total = afterDiscount + vat;

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f8f8]">
      <div className="text-center">
        <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-black/15" />
        <h2 className="text-xl font-bold text-black mb-2">سجل دخولك أولاً</h2>
        <p className="text-black/40 text-sm mb-6">يجب تسجيل الدخول لعرض سلة التسوق</p>
        <Link href="/login"><Button className="premium-btn">تسجيل الدخول</Button></Link>
      </div>
    </div>
  );

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin w-8 h-8 text-black/20" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Header */}
      <div className="bg-white border-b border-black/[0.06] px-6 py-5 sticky top-0 z-30">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/services">
              <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-black flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-black/40" />
                سلة التسوق
              </h1>
              <p className="text-[11px] text-black/35">{items.length} عنصر</p>
            </div>
          </div>
          {items.length > 0 && (
            <Button variant="ghost" className="text-red-400 hover:text-red-600 text-xs" onClick={() => clearMutation.mutate()} disabled={clearMutation.isPending} data-testid="button-clear-cart">
              <Trash2 className="w-3.5 h-3.5 ml-1" />
              إفراغ السلة
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 flex flex-col items-center text-center border border-black/[0.06]">
              <div className="w-20 h-20 bg-black/[0.03] rounded-3xl flex items-center justify-center mb-6">
                <ShoppingCart className="w-10 h-10 text-black/15" />
              </div>
              <h3 className="text-lg font-bold text-black mb-2">السلة فارغة</h3>
              <p className="text-black/35 text-sm mb-8 max-w-xs">لم تضف أي خدمات أو منتجات بعد. تصفح خدماتنا وأجهزتنا المتاحة</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/services">
                  <Button className="premium-btn gap-2" data-testid="button-browse-services">
                    <Code2 className="w-4 h-4" />
                    تصفح الخدمات
                  </Button>
                </Link>
                <Link href="/devices">
                  <Button variant="outline" className="gap-2 rounded-xl" data-testid="button-browse-devices">
                    <Package className="w-4 h-4" />
                    تصفح الأجهزة
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {items.map((item, i) => {
                const Icon = typeIcons[item.type] || Package;
                const colorCls = typeColors[item.type] || typeColors.product;
                return (
                  <motion.div
                    key={item.id || i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-white border border-black/[0.06] rounded-2xl p-5 flex items-start gap-4"
                    data-testid={`cart-item-${item.id}`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border ${colorCls}`}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.nameAr || item.name} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-sm text-black">{item.nameAr || item.name}</p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${colorCls}`}>{typeLabels[item.type]}</span>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-7 h-7 text-red-400 hover:text-red-600 flex-shrink-0"
                          onClick={() => item.id && removeMutation.mutate(item.id)}
                          disabled={removeMutation.isPending}
                          data-testid={`button-remove-${item.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      {item.config && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Object.entries(item.config).map(([k, v]) => (
                            <span key={k} className="text-[9px] bg-black/[0.03] border border-black/[0.05] px-1.5 py-0.5 rounded text-black/40">
                              {k}: {String(v)}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => item.id && item.qty > 1 && updateQtyMutation.mutate({ itemId: item.id, qty: item.qty - 1 })}
                            className="w-7 h-7 rounded-lg border border-black/[0.08] flex items-center justify-center hover:bg-black/[0.04] transition-colors disabled:opacity-40"
                            disabled={item.qty <= 1 || updateQtyMutation.isPending}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                          <button
                            onClick={() => item.id && updateQtyMutation.mutate({ itemId: item.id, qty: item.qty + 1 })}
                            className="w-7 h-7 rounded-lg border border-black/[0.08] flex items-center justify-center hover:bg-black/[0.04] transition-colors"
                            disabled={updateQtyMutation.isPending}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-base font-black text-black">
                          {(item.price * item.qty).toLocaleString()} <span className="text-xs font-normal text-black/35">ر.س</span>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}

          {/* Add-ons section */}
          <div className="bg-white border border-black/[0.06] rounded-2xl p-5">
            <h3 className="font-bold text-sm text-black mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-black/40" />
              إضافات البنية التحتية
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'db', icon: Database, label: "MongoDB Atlas", sublabel: "قاعدة بيانات سحابية", color: "bg-green-50 text-green-700" },
                { key: 'aws', icon: Cloud, label: "Amazon AWS", sublabel: "خادم EC2 مخصص", color: "bg-orange-50 text-orange-700" },
                { key: 'domain', icon: Globe, label: "تسجيل دومين", sublabel: "نطاق احترافي", color: "bg-blue-50 text-blue-700" },
                { key: 'email', icon: Mail, label: "بريد أعمال", sublabel: "بريد احترافي", color: "bg-purple-50 text-purple-700" },
              ].map(addon => {
                const Icon = addon.icon;
                return (
                  <button
                    key={addon.key}
                    onClick={() => setAddOnDialog(addon.key as any)}
                    className={`flex items-center gap-3 p-3 rounded-xl border border-black/[0.06] hover:border-black/20 hover:shadow-sm transition-all text-right`}
                    data-testid={`button-addon-${addon.key}`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${addon.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-black">{addon.label}</p>
                      <p className="text-[10px] text-black/35">{addon.sublabel}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <div className="bg-white border border-black/[0.06] rounded-2xl p-5 sticky top-24">
            <h3 className="font-bold text-sm text-black mb-4">ملخص الطلب</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-black/50">
                <span>المجموع الفرعي</span>
                <span>{subtotal.toLocaleString()} ر.س</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>خصم الكوبون</span>
                  <span>- {discount.toLocaleString()} ر.س</span>
                </div>
              )}
              <div className="flex justify-between text-black/50">
                <span>ضريبة القيمة المضافة (15%)</span>
                <span>{vat.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س</span>
              </div>
              <div className="h-px bg-black/[0.06]" />
              <div className="flex justify-between font-bold text-black text-base">
                <span>الإجمالي</span>
                <span>{total.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ر.س</span>
              </div>
            </div>

            {/* Coupon */}
            {!cart?.couponCode && (
              <div className="mt-4 flex gap-2">
                <Input
                  value={coupon}
                  onChange={e => setCoupon(e.target.value)}
                  placeholder="كوبون خصم..."
                  className="h-9 text-xs flex-1"
                  data-testid="input-coupon"
                />
                <Button size="sm" variant="outline" onClick={() => couponMutation.mutate()} disabled={!coupon || couponMutation.isPending} className="text-xs" data-testid="button-apply-coupon">
                  <Tag className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
            {cart?.couponCode && (
              <div className="mt-3 flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-xl border border-green-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                كوبون "{cart.couponCode}" مطبّق
              </div>
            )}

            <Button
              className="w-full premium-btn mt-5 h-12 text-sm font-bold rounded-2xl"
              disabled={items.length === 0}
              onClick={() => toast({ title: "سيتم إنهاء الطلب قريباً", description: "سنتواصل معك لإكمال عملية الدفع" })}
              data-testid="button-checkout"
            >
              <ShoppingBag className="w-4 h-4 ml-2" />
              إتمام الطلب
            </Button>

            <p className="text-[10px] text-black/30 text-center mt-3">
              بالمتابعة أنت توافق على شروط الخدمة
            </p>

            <div className="mt-4 flex justify-center gap-4">
              {["✓ دفع آمن", "✓ دعم فوري", "✓ ضمان الجودة"].map(v => (
                <span key={v} className="text-[10px] text-black/30">{v}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MongoDB Atlas Dialog */}
      <Dialog open={addOnDialog === 'db'} onOpenChange={() => setAddOnDialog(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold">
              <Database className="w-5 h-5 text-green-600" />
              MongoDB Atlas — اختر الخطة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {mongoTiers.map(tier => (
              <button
                key={tier.id}
                onClick={() => setSelectedDb(tier)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-right ${selectedDb?.id === tier.id ? 'border-black bg-black/[0.02]' : 'border-black/[0.08] hover:border-black/20'}`}
                data-testid={`db-tier-${tier.id}`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-black">{tier.name}</p>
                    {tier.note.includes('موصى') && <span className="text-[9px] bg-black text-white px-1.5 py-0.5 rounded-full">موصى به</span>}
                  </div>
                  <p className="text-[11px] text-black/40 mt-0.5">RAM: {tier.ram} · تخزين: {tier.storage} · {tier.note}</p>
                </div>
                <div className="text-right flex-shrink-0 mr-3">
                  <p className="font-black text-black">{tier.price === 0 ? "مجاني" : `$${tier.price}/شهر`}</p>
                </div>
              </button>
            ))}
          </div>
          <Button className="w-full premium-btn mt-4" onClick={addDbToCart} disabled={!selectedDb || addItemMutation.isPending} data-testid="button-add-db">
            {addItemMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Plus className="w-4 h-4 ml-2" />}
            إضافة للسلة {selectedDb ? `— ${selectedDb.name}` : ""}
          </Button>
        </DialogContent>
      </Dialog>

      {/* AWS EC2 Dialog */}
      <Dialog open={addOnDialog === 'aws'} onOpenChange={() => setAddOnDialog(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold">
              <Cloud className="w-5 h-5 text-orange-500" />
              Amazon AWS EC2 — اختر الخادم
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {awsTiers.map(tier => (
              <button
                key={tier.id}
                onClick={() => setSelectedAws(tier)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-right ${selectedAws?.id === tier.id ? 'border-black bg-black/[0.02]' : 'border-black/[0.08] hover:border-black/20'}`}
                data-testid={`aws-tier-${tier.id}`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-black font-mono">{tier.name}</p>
                    {tier.note.includes('موصى') && <span className="text-[9px] bg-black text-white px-1.5 py-0.5 rounded-full">موصى به</span>}
                  </div>
                  <p className="text-[11px] text-black/40 mt-0.5">{tier.cpu} · RAM: {tier.ram} · {tier.note}</p>
                </div>
                <div className="text-right flex-shrink-0 mr-3">
                  <p className="font-black text-black">${tier.price}/شهر</p>
                </div>
              </button>
            ))}
          </div>
          <Button className="w-full premium-btn mt-4" onClick={addAwsToCart} disabled={!selectedAws || addItemMutation.isPending} data-testid="button-add-aws">
            {addItemMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Plus className="w-4 h-4 ml-2" />}
            إضافة للسلة {selectedAws ? `— ${selectedAws.name}` : ""}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Domain Dialog */}
      <Dialog open={addOnDialog === 'domain'} onOpenChange={() => setAddOnDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold">
              <Globe className="w-5 h-5 text-blue-600" />
              تسجيل دومين
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="flex gap-2">
              <Input value={domainName} onChange={e => setDomainName(e.target.value.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase())} placeholder="اسم-موقعك" className="flex-1 text-sm" data-testid="input-domain-name" />
              <Select value={domainExt} onValueChange={setDomainExt}>
                <SelectTrigger className="w-28" data-testid="select-domain-ext"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {domainExtensions.map(d => <SelectItem key={d.ext} value={d.ext}>{d.ext} — {d.price} ر.س</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {domainName && <p className="text-sm font-mono text-black/60 bg-black/[0.03] px-3 py-2 rounded-lg">{domainName}{domainExt}</p>}
            <div className="grid grid-cols-3 gap-2">
              {domainExtensions.map(d => (
                <button key={d.ext} onClick={() => setDomainExt(d.ext)} className={`p-2.5 rounded-xl border text-center transition-all ${domainExt === d.ext ? 'border-black bg-black/[0.02]' : 'border-black/[0.08] hover:border-black/20'}`}>
                  <p className="font-bold text-sm text-black">{d.ext}</p>
                  <p className="text-[10px] text-black/40">{d.price} ر.س/سنة</p>
                </button>
              ))}
            </div>
            <Button className="w-full premium-btn" onClick={addDomainToCart} disabled={!domainName || addItemMutation.isPending} data-testid="button-add-domain">
              {addItemMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Globe className="w-4 h-4 ml-2" />}
              إضافة الدومين
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={addOnDialog === 'email'} onOpenChange={() => setAddOnDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold">
              <Mail className="w-5 h-5 text-purple-600" />
              بريد الأعمال
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {emailPlans.map(plan => (
              <button
                key={plan.id}
                onClick={() => setSelectedEmail(plan)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-right ${selectedEmail?.id === plan.id ? 'border-black bg-black/[0.02]' : 'border-black/[0.08] hover:border-black/20'}`}
                data-testid={`email-plan-${plan.id}`}
              >
                <div>
                  <p className="font-bold text-sm text-black">{plan.name}</p>
                  <p className="text-[11px] text-black/40">{plan.users} مستخدم · {plan.storage}</p>
                </div>
                <p className="font-black text-black">{plan.price} ر.س/شهر</p>
              </button>
            ))}
            <Button className="w-full premium-btn" onClick={addEmailToCart} disabled={!selectedEmail || addItemMutation.isPending} data-testid="button-add-email">
              {addItemMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Mail className="w-4 h-4 ml-2" />}
              إضافة البريد {selectedEmail ? `— ${selectedEmail.name}` : ""}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
