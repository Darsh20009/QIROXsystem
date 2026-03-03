// @ts-nocheck
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2, ShoppingCart, Trash2, Plus, Minus, Globe, Mail, Server,
  Cpu, Gift, Code2, Package, Database, Cloud, CheckCircle2, ArrowLeft,
  ShoppingBag, Tag, Phone, ChevronLeft, Sparkles, Shield, Clock3,
  Upload, FileText, MapPin, Home, BanknoteIcon, Copy, ClipboardCheck,
  CheckCircle, X, ChevronRight, FileImage, Building2, Wallet,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import type { Cart, CartItem } from "@shared/schema";
import { useUser } from "@/hooks/use-auth";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

/* ─── Bank info ──────────────────────────────────────────────────── */
const BANK = {
  bankName: "بنك الراجحي",
  beneficiaryName: "شركة قيروكس للتقنية",
  iban: "SA0380205098017222121010",
};

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

const PHYSICAL_TYPES = ["product", "gift", "device"];

/* ─── Add-on data ────────────────────────────────────────────────── */
const mongoTiers = [
  { id: "M0",  name: "M0 Free",        price: 0,   ram: "مشترك", storage: "512 MB", note: "تطوير فقط" },
  { id: "M2",  name: "M2 Shared",      price: 9,   ram: "مشترك", storage: "2 GB",   note: "مشاريع صغيرة" },
  { id: "M5",  name: "M5 Shared",      price: 25,  ram: "مشترك", storage: "5 GB",   note: "مشاريع متوسطة" },
  { id: "M10", name: "M10 Dedicated",  price: 57,  ram: "2 GB",  storage: "10 GB",  note: "إنتاج — موصى به" },
  { id: "M20", name: "M20 Dedicated",  price: 140, ram: "4 GB",  storage: "20 GB",  note: "مشاريع متقدمة" },
  { id: "M30", name: "M30 Dedicated",  price: 410, ram: "8 GB",  storage: "40 GB",  note: "حجم تجاري" },
];
const awsTiers = [
  { id: "t3.micro",  name: "t3.micro",  price: 8,   cpu: "2 vCPU", ram: "1 GB", note: "اختبار" },
  { id: "t3.small",  name: "t3.small",  price: 17,  cpu: "2 vCPU", ram: "2 GB", note: "تطبيقات خفيفة" },
  { id: "t3.medium", name: "t3.medium", price: 33,  cpu: "2 vCPU", ram: "4 GB", note: "مواقع متوسطة" },
  { id: "t3.large",  name: "t3.large",  price: 66,  cpu: "2 vCPU", ram: "8 GB", note: "متقدم — موصى به" },
  { id: "m5.large",  name: "m5.large",  price: 96,  cpu: "2 vCPU", ram: "8 GB", note: "أداء محسّن" },
  { id: "c5.xlarge", name: "c5.xlarge", price: 170, cpu: "4 vCPU", ram: "8 GB", note: "حسابي مكثف" },
];
const domainExtensions = [
  { ext: ".com", price: 45 }, { ext: ".sa", price: 150 }, { ext: ".net", price: 55 },
  { ext: ".org", price: 50 }, { ext: ".store", price: 120 }, { ext: ".io", price: 250 },
];
const emailPlans = [
  { id: "basic",      name: "أساسي",   price: 35,  users: 1,  storage: "15 GB" },
  { id: "business",   name: "أعمال",   price: 99,  users: 5,  storage: "50 GB" },
  { id: "enterprise", name: "مؤسسي",   price: 249, users: 25, storage: "250 GB" },
];

const VAT_RATE = 0.15;

/* ─── Uploaded file type ─────────────────────────────────────────── */
interface UpFile { url: string; filename: string; size: number; }

/* ─── Component ──────────────────────────────────────────────────── */
export default function Cart() {
  const { data: user } = useUser();
  const { toast } = useToast();

  /* add-on dialog states */
  const [coupon, setCoupon] = useState("");
  const [addOnDialog, setAddOnDialog] = useState<null | 'db' | 'aws' | 'domain' | 'email'>(null);
  const [selectedDb, setSelectedDb] = useState<typeof mongoTiers[0] | null>(null);
  const [selectedAws, setSelectedAws] = useState<typeof awsTiers[0] | null>(null);
  const [domainName, setDomainName] = useState("");
  const [domainExt, setDomainExt] = useState(".com");
  const [selectedEmail, setSelectedEmail] = useState<typeof emailPlans[0] | null>(null);

  /* pre-checkout dialog states */
  const [preCheckoutOpen, setPreCheckoutOpen] = useState(false);
  const [preCheckoutStep, setPreCheckoutStep] = useState(1);
  const [projectNotes, setProjectNotes] = useState("");
  const [docsFiles, setDocsFiles] = useState<UpFile[]>([]);
  const [shipping, setShipping] = useState({ name: "", phone: "", city: "", address: "" });
  const docsInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setShipping(prev => ({
        ...prev,
        name: prev.name || (user as any).fullName || "",
        phone: prev.phone || (user as any).phone || (user as any).whatsappNumber || "",
      }));
    }
  }, [user]);

  /* wallet payment states */
  const [useWallet, setUseWallet] = useState(false);
  const [walletAmount, setWalletAmount] = useState(0);

  /* success screen states */
  const [checkoutDone, setCheckoutDone] = useState(false);
  const [savedItems, setSavedItems] = useState<CartItem[]>([]);
  const [savedTotal, setSavedTotal] = useState(0);
  const [savedOrderId, setSavedOrderId] = useState("");
  const [savedWalletUsed, setSavedWalletUsed] = useState(0);
  const [copiedIban, setCopiedIban] = useState(false);
  const [proofFile, setProofFile] = useState<UpFile | null>(null);
  const proofInputRef = useRef<HTMLInputElement>(null);

  const { data: cart, isLoading } = useQuery<Cart>({ queryKey: ["/api/cart"] });
  const { data: walletData } = useQuery<{ totalDebit: number; totalCredit: number; outstanding: number }>({
    queryKey: ["/api/wallet"],
    enabled: !!user,
  });

  const items: CartItem[] = cart?.items || [];
  const hasPhysical = items.some(i => PHYSICAL_TYPES.includes(i.type));
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = cart?.discountAmount || 0;
  const afterDiscount = subtotal - discount;
  const vat = afterDiscount * VAT_RATE;
  const total = afterDiscount + vat;
  const fmt = (n: number) => n.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /* wallet balance = available credit balance (totalCredit - totalDebit, if positive) */
  const walletBalance = walletData ? Math.max(0, walletData.totalCredit - walletData.totalDebit) : 0;
  const maxWalletUsable = Math.min(walletBalance, total);
  const effectiveWalletAmount = useWallet ? Math.min(walletAmount, maxWalletUsable) : 0;
  const remainingAfterWallet = Math.max(0, total - effectiveWalletAmount);
  const fullyPaidByWallet = useWallet && effectiveWalletAmount >= total - 0.01;

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
      const walletUsed = effectiveWalletAmount;
      const notes = [
        projectNotes ? `الفكرة: ${projectNotes}` : "",
        hasPhysical && shipping.name ? `الشحن: ${shipping.name} — ${shipping.phone} — ${shipping.city} — ${shipping.address}` : "",
        walletUsed > 0 ? `دفع بالمحفظة: ${walletUsed.toLocaleString()} ر.س` : "",
      ].filter(Boolean).join(" | ") || `طلب من السلة — ${items.length} عنصر`;

      const paymentMethod = fullyPaidByWallet ? "wallet" : walletUsed > 0 ? "mixed" : "bank_transfer";

      const r = await apiRequest("POST", "/api/orders", {
        projectType: items.find(i => i.type === "service")?.name || "خدمة رقمية",
        sector: "general",
        totalAmount: Math.round(total),
        items: itemNames,
        paymentMethod,
        notes,
        files: docsFiles.length ? { documents: docsFiles.map(f => f.url) } : undefined,
        shippingAddress: hasPhysical && shipping.name ? shipping : undefined,
        walletAmountUsed: walletUsed > 0 ? walletUsed : undefined,
      });
      const orderData = await r.json();
      const orderId = orderData.id || orderData._id;

      if (walletUsed > 0) {
        const walletRes = await apiRequest("POST", "/api/wallet/pay", {
          amount: walletUsed,
          orderId,
          description: `دفع طلب رقم ${orderId} من المحفظة الإلكترونية`,
        });
        if (!walletRes.ok) {
          const err = await walletRes.json();
          throw new Error(err.error || "فشل الدفع بالمحفظة");
        }
      }

      return { ...orderData, walletUsed };
    },
    onSuccess: async (data) => {
      setSavedItems([...items]);
      setSavedTotal(total);
      setSavedOrderId(data.id || data._id || "");
      setSavedWalletUsed(data.walletUsed || 0);
      await clearMutation.mutateAsync();
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      setPreCheckoutOpen(false);
      setCheckoutDone(true);
    },
    onError: (e: any) => toast({ title: e.message || "فشل إرسال الطلب، يرجى المحاولة مرة أخرى", variant: "destructive" }),
  });

  const uploadProofMutation = useMutation({
    mutationFn: async ({ orderId, proofUrl }: { orderId: string; proofUrl: string }) =>
      apiRequest("PATCH", `/api/orders/${orderId}`, { paymentProofUrl: proofUrl }),
    onSuccess: () => toast({ title: "✓ تم رفع إيصال التحويل بنجاح" }),
    onError: () => toast({ title: "فشل رفع الإيصال", variant: "destructive" }),
  });

  /* ─── File upload helpers ─── */
  const uploadFile = async (file: File): Promise<UpFile | null> => {
    const fd = new FormData(); fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (data.url) return { url: data.url, filename: file.name, size: file.size };
    } catch {}
    toast({ title: "فشل رفع الملف", variant: "destructive" });
    return null;
  };

  const handleDocsUpload = async (file: File) => {
    const f = await uploadFile(file);
    if (f) setDocsFiles(prev => [...prev, f]);
  };

  const handleProofUpload = async (file: File) => {
    const f = await uploadFile(file);
    if (f) {
      setProofFile(f);
      if (savedOrderId) uploadProofMutation.mutate({ orderId: savedOrderId, proofUrl: f.url });
    }
  };

  const totalSteps = hasPhysical ? 2 : 1;
  const canNextStep = () => {
    if (preCheckoutStep === 1) return true;
    if (preCheckoutStep === 2) return shipping.name.trim() && shipping.phone.trim() && shipping.city.trim();
    return true;
  };

  /* ─── Auth guard ─── */
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

  /* ─── Checkout Done Screen ─── */
  if (checkoutDone) return (
    <div className="min-h-screen bg-[#f8f8f8] relative overflow-x-hidden" dir="rtl">
      <div className="max-w-xl mx-auto px-4 pt-10 pb-28 space-y-5">

        {/* Success hero */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
          <div className="relative inline-block mb-5">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
              className="absolute -inset-3 bg-green-400/20 rounded-full blur-xl" />
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/30 relative z-10">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-black mb-2">تم استلام طلبك!</h2>
          {savedOrderId && (
            <p className="text-black/40 text-sm">رقم الطلب: <span className="font-mono font-black text-black">{savedOrderId}</span></p>
          )}
        </motion.div>

        {/* Total card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-black rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
          <p className="text-white/40 text-xs uppercase tracking-wider mb-1 relative z-10">إجمالي الطلب</p>
          <p className="text-white font-black text-4xl relative z-10">
            {fmt(savedTotal)} <span className="text-xl font-normal text-white/50">ر.س</span>
          </p>
          <p className="text-white/30 text-xs mt-1 relative z-10">شامل ضريبة القيمة المضافة 15%</p>
        </motion.div>

        {/* Order summary */}
        {savedItems.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white border border-black/[0.07] rounded-3xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-black/[0.05]">
              <p className="text-xs font-black text-black/40 uppercase tracking-widest">ملخص الطلب</p>
            </div>
            <div className="divide-y divide-black/[0.04]">
              {savedItems.map((item, i) => (
                <div key={i} className="px-5 py-3 flex justify-between items-center">
                  <span className="text-sm text-black/60 truncate max-w-[60%]">{item.nameAr || item.name}</span>
                  <span className="font-bold text-sm text-black flex-shrink-0">
                    {item.price === 0 ? "مجاني" : `${(item.price * item.qty).toLocaleString()} ر.س`}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Wallet paid badge (if partially or fully paid by wallet) */}
        {savedWalletUsed > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-black text-emerald-800 text-sm">تم الدفع من المحفظة الإلكترونية</p>
                <p className="text-emerald-600 text-xs mt-0.5">
                  مبلغ <span className="font-black">{savedWalletUsed.toLocaleString()} ر.س</span> تم خصمه من رصيدك
                  {savedWalletUsed >= savedTotal - 0.01 ? " — تم سداد الطلب بالكامل ✓" : ""}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Bank transfer card — shown only if remaining amount > 0 */}
        {savedWalletUsed < savedTotal - 0.01 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="relative rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 p-6 text-white relative">
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
              <div className="flex items-center justify-between mb-5 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                    <BanknoteIcon className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-black text-white">بيانات التحويل البنكي</p>
                </div>
                {savedWalletUsed > 0 && (
                  <div className="bg-white/15 rounded-xl px-3 py-1.5 text-right">
                    <p className="text-white/60 text-[10px]">المتبقي للتحويل</p>
                    <p className="text-white font-black text-sm">{(savedTotal - savedWalletUsed).toLocaleString()} ر.س</p>
                  </div>
                )}
              </div>
              <div className="space-y-3 relative z-10">
                {[
                  { label: "البنك",     value: BANK.bankName },
                  { label: "المستفيد", value: BANK.beneficiaryName },
                ].map(r => (
                  <div key={r.label} className="bg-white/10 rounded-2xl px-4 py-3 flex justify-between items-center">
                    <span className="text-white/55 text-xs">{r.label}</span>
                    <span className="text-white font-bold text-sm">{r.value}</span>
                  </div>
                ))}
                <div className="bg-white/10 rounded-2xl px-4 py-3 flex items-center justify-between gap-2">
                  <span className="text-white/55 text-xs shrink-0">IBAN</span>
                  <span className="text-white font-mono font-bold text-sm truncate" dir="ltr">{BANK.iban}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(BANK.iban); setCopiedIban(true); setTimeout(() => setCopiedIban(false), 2500); }}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${copiedIban ? "bg-green-400 text-white" : "bg-white/20 hover:bg-white/30 text-white"}`}
                    data-testid="button-copy-iban">
                    {copiedIban ? <ClipboardCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              {savedOrderId && (
                <div className="mt-4 bg-amber-400/20 border border-amber-300/30 rounded-2xl p-3 relative z-10">
                  <p className="text-amber-200 text-xs leading-relaxed">
                    ⚠️ اكتب رقم طلبك <span className="font-mono font-bold">{savedOrderId}</span> في خانة الملاحظات عند التحويل
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Upload receipt — only shown if bank transfer is needed */}
        {savedWalletUsed < savedTotal - 0.01 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white border border-black/[0.07] rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Upload className="w-4 h-4 text-white" />
              </div>
              <p className="font-black text-black">ارفع إيصال التحويل</p>
              <span className="text-xs text-black/35 mr-auto">اختياري الآن</span>
            </div>
            {!proofFile ? (
              <div
                onClick={() => proofInputRef.current?.click()}
                className="border-2 border-dashed border-black/10 rounded-2xl p-8 text-center cursor-pointer hover:border-black/25 transition-all group"
                data-testid="upload-proof">
                <Upload className="w-10 h-10 mx-auto mb-3 text-black/20 group-hover:text-black/40 transition-colors" />
                <p className="text-sm text-black/40">اضغط لرفع صورة الإيصال</p>
                <p className="text-xs text-black/25 mt-1">PNG، JPG أو PDF</p>
                <input ref={proofInputRef} type="file" className="hidden" accept="image/*,.pdf"
                  onChange={e => { if (e.target.files?.[0]) handleProofUpload(e.target.files[0]); }} />
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 bg-green-50 border border-green-200/50 rounded-2xl px-4 py-4">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-green-700 font-semibold">تم رفع الإيصال بنجاح</p>
                  <p className="text-xs text-green-600/60 truncate">{proofFile.filename}</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-center pt-2">
          <Link href="/dashboard">
            <Button className="premium-btn px-10 h-12 rounded-xl font-bold" data-testid="button-go-dashboard">
              العودة للوحة التحكم
            </Button>
          </Link>
        </motion.div>
      </div>
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
            <Link href="/prices">
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
            <Link href="/prices">
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
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${colorCls}`}>
                        {item.imageUrl
                          ? <img src={item.imageUrl} alt={item.nameAr || item.name} className="w-full h-full object-cover rounded-xl" />
                          : <Icon className="w-5 h-5" />}
                      </div>
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
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {!isService && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => item.id && item.qty > 1 && updateQtyMutation.mutate({ itemId: item.id, qty: item.qty - 1 })}
                              disabled={item.qty <= 1 || updateQtyMutation.isPending}
                              className="w-7 h-7 rounded-lg border border-black/[0.08] flex items-center justify-center hover:bg-black/[0.04] transition-colors disabled:opacity-30"
                              data-testid={`button-qty-minus-${item.id}`}>
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-black w-5 text-center">{item.qty}</span>
                            <button
                              onClick={() => item.id && updateQtyMutation.mutate({ itemId: item.id, qty: item.qty + 1 })}
                              disabled={updateQtyMutation.isPending}
                              className="w-7 h-7 rounded-lg border border-black/[0.08] flex items-center justify-center hover:bg-black/[0.04] transition-colors"
                              data-testid={`button-qty-plus-${item.id}`}>
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
                          data-testid={`button-remove-${item.id}`}>
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
                  { key: 'db',     icon: Database, label: "MongoDB Atlas",  sub: "من $0/شهر",     color: "text-green-600 bg-green-50" },
                  { key: 'aws',    icon: Cloud,    label: "Amazon EC2",     sub: "من $8/شهر",     color: "text-orange-500 bg-orange-50" },
                  { key: 'domain', icon: Globe,    label: "تسجيل دومين",   sub: "من 45 ر.س/سنة", color: "text-blue-600 bg-blue-50" },
                  { key: 'email',  icon: Mail,     label: "بريد أعمال",    sub: "من 35 ر.س/شهر", color: "text-violet-600 bg-violet-50" },
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

            {/* Guarantees */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Shield,       label: "دفع آمن",              sub: "معاملات مشفّرة" },
                { icon: Clock3,       label: "استجابة خلال 24 ساعة", sub: "نتواصل معك فوراً" },
                { icon: CheckCircle2, label: "ضمان الجودة",          sub: "نتيجة مضمونة" },
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
            <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden sticky top-[72px] shadow-sm">
              <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-black px-5 py-5 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "16px 16px" }} />
                <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl" />
                <div className="relative z-10">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">ملخص الطلب</p>
                  <p className="text-3xl font-black text-white">{fmt(total)} <span className="text-sm font-normal text-white/40">ر.س</span></p>
                  <p className="text-[10px] text-white/25 mt-0.5">شامل ضريبة القيمة المضافة 15%</p>
                </div>
              </div>

              <div className="px-5 py-4 space-y-3">
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
                  className="w-full bg-gradient-to-l from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-black h-13 rounded-xl text-sm mt-2 gap-2 shadow-lg shadow-cyan-600/20 transition-all"
                  disabled={items.length === 0}
                  onClick={() => { setPreCheckoutStep(1); setPreCheckoutOpen(true); }}
                  data-testid="button-checkout">
                  <Sparkles className="w-4 h-4" />
                  إتمام الطلب الآن
                </Button>

                <div className="flex items-center justify-center gap-3 pt-1">
                  {[{ icon: Shield, label: "دفع آمن" }, { icon: Clock3, label: "24 ساعة" }, { icon: CheckCircle2, label: "ضمان" }].map(t => {
                    const Icon = t.icon;
                    return (
                      <div key={t.label} className="flex items-center gap-1 text-[10px] text-black/30">
                        <Icon className="w-2.5 h-2.5" /> {t.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ Pre-Checkout Dialog ═══════ */}
      <Dialog open={preCheckoutOpen} onOpenChange={open => { if (!checkoutMutation.isPending) setPreCheckoutOpen(open); }}>
        <DialogContent className="max-w-lg max-h-[92vh] p-0 overflow-hidden" dir="rtl">

          {/* Gradient Header */}
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black px-6 pt-6 pb-5 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "18px 18px" }} />
            <div className="absolute -top-8 -left-8 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center border border-white/20">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-black text-white text-base">إتمام الطلب</p>
                  <p className="text-white/50 text-xs">
                    {preCheckoutStep === 1 ? "تفاصيل المشروع والملفات" : "بيانات الشحن"}
                  </p>
                </div>
                <button onClick={() => setPreCheckoutOpen(false)} className="mr-auto w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white/60 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step Indicators */}
              {totalSteps > 1 ? (
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2 flex-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-all ${i + 1 <= preCheckoutStep
                        ? "bg-cyan-400 border-cyan-400 text-gray-900"
                        : "bg-white/10 border-white/20 text-white/40"}`}>
                        {i + 1 < preCheckoutStep ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                      </div>
                      {i < totalSteps - 1 && (
                        <div className={`flex-1 h-0.5 rounded-full transition-all ${i + 1 < preCheckoutStep ? "bg-cyan-400" : "bg-white/10"}`} />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  {[{ icon: FileText, label: "التفاصيل" }, { icon: BanknoteIcon, label: "الدفع" }].map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center">
                            <Icon className="w-2.5 h-2.5 text-gray-900" />
                          </div>
                          <span className="text-[11px] text-white/70 font-medium">{s.label}</span>
                        </div>
                        {i === 0 && <ChevronLeft className="w-3 h-3 text-white/30" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Content area */}
          <DialogHeader className="sr-only"><DialogTitle>إتمام الطلب</DialogTitle></DialogHeader>

          <ScrollArea className="max-h-[55vh]">
            <div className="space-y-4 p-5 pb-2">

              {/* Step 1: Project idea + documents */}
              {preCheckoutStep === 1 && (
                <>
                  <div>
                    <Label className="text-xs font-bold text-black/50 uppercase tracking-wider mb-2 block">
                      فكرة المشروع ومتطلباتك
                    </Label>
                    <Textarea
                      value={projectNotes}
                      onChange={e => setProjectNotes(e.target.value)}
                      placeholder="اكتب نبذة عن مشروعك، ما الذي تحتاجه بالضبط، أي تفاصيل تساعدنا في تنفيذ طلبك بأفضل شكل..."
                      className="h-28 resize-none rounded-xl text-sm"
                      data-testid="textarea-project-notes"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-black/50 uppercase tracking-wider mb-2 block">
                      الوثائق والملفات <span className="text-black/30 font-normal">(اختياري)</span>
                    </Label>
                    <p className="text-xs text-black/35 mb-3">شعار، هوية بصرية، مراجع تصميم، أي ملفات تساعدنا</p>

                    {docsFiles.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {docsFiles.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 bg-black/[0.03] border border-black/[0.06] rounded-xl px-3 py-2.5">
                            <FileText className="w-4 h-4 text-black/30 shrink-0" />
                            <span className="text-xs text-black/60 flex-1 truncate">{f.filename}</span>
                            <button onClick={() => setDocsFiles(prev => prev.filter((_, j) => j !== i))}
                              className="w-6 h-6 rounded-lg hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-black/25 transition-all">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => docsInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-cyan-400 hover:bg-cyan-50/50 transition-all group relative overflow-hidden"
                      data-testid="button-upload-docs">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/0 to-blue-50/0 group-hover:from-cyan-50/60 group-hover:to-blue-50/30 transition-all" />
                      <div className="relative z-10">
                        <div className="w-12 h-12 bg-gray-100 group-hover:bg-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-all">
                          <Upload className="w-6 h-6 text-gray-400 group-hover:text-cyan-500 transition-colors" />
                        </div>
                        <p className="text-sm font-bold text-gray-500 group-hover:text-cyan-600 transition-colors">اسحب الملفات هنا أو اضغط للرفع</p>
                        <p className="text-[11px] text-gray-400 mt-1">PNG، JPG، PDF، AI، SVG — حتى 10 ملفات</p>
                      </div>
                      <input ref={docsInputRef} type="file" className="hidden" multiple accept="image/*,.pdf,.ai,.svg,.eps"
                        onChange={async e => {
                          if (e.target.files) {
                            for (const file of Array.from(e.target.files)) await handleDocsUpload(file);
                          }
                        }} />
                    </button>
                  </div>

                  {/* ── Wallet payment section ── */}
                  {walletBalance > 0 && (
                    <div className={`rounded-2xl border-2 transition-all overflow-hidden ${useWallet ? "border-emerald-400 bg-emerald-50/50" : "border-black/[0.07] bg-white"}`}>
                      <button
                        className="w-full flex items-center gap-3 p-4"
                        onClick={() => {
                          const next = !useWallet;
                          setUseWallet(next);
                          if (next) setWalletAmount(Math.min(walletBalance, total));
                        }}
                        data-testid="toggle-use-wallet">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${useWallet ? "bg-emerald-500" : "bg-black/[0.06]"}`}>
                          <Wallet className={`w-5 h-5 ${useWallet ? "text-white" : "text-black/40"}`} />
                        </div>
                        <div className="flex-1 text-right">
                          <p className={`font-bold text-sm ${useWallet ? "text-emerald-800" : "text-black"}`}>الدفع من المحفظة الإلكترونية</p>
                          <p className={`text-xs mt-0.5 ${useWallet ? "text-emerald-600" : "text-black/40"}`}>
                            رصيدك المتاح: <span className="font-black">{walletBalance.toLocaleString()} ر.س</span>
                          </p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${useWallet ? "border-emerald-500 bg-emerald-500" : "border-black/20"}`}>
                          {useWallet && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                      </button>

                      <AnimatePresence>
                        {useWallet && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden">
                            <div className="px-4 pb-4 space-y-3">
                              <div>
                                <Label className="text-xs font-bold text-emerald-700/70 uppercase tracking-wider mb-1.5 block">
                                  المبلغ المراد استخدامه من المحفظة
                                </Label>
                                <div className="flex items-center gap-3">
                                  <input
                                    type="number"
                                    value={walletAmount}
                                    min={0}
                                    max={maxWalletUsable}
                                    step={0.01}
                                    onChange={e => setWalletAmount(Math.min(Number(e.target.value), maxWalletUsable))}
                                    className="flex-1 h-10 rounded-xl border border-emerald-200 bg-white px-3 text-sm font-mono text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                    data-testid="input-wallet-amount"
                                  />
                                  <span className="text-sm text-emerald-700 font-bold shrink-0">ر.س</span>
                                  <button
                                    onClick={() => setWalletAmount(maxWalletUsable)}
                                    className="text-xs font-bold text-emerald-600 bg-emerald-100 hover:bg-emerald-200 px-3 py-2 rounded-xl transition-all shrink-0"
                                    data-testid="button-use-all-wallet">
                                    كل الرصيد
                                  </button>
                                </div>
                              </div>

                              {effectiveWalletAmount > 0 && (
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="bg-emerald-100 rounded-xl p-3 text-center">
                                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-0.5">من المحفظة</p>
                                    <p className="text-emerald-800 font-black text-base">{effectiveWalletAmount.toLocaleString()} <span className="text-xs font-normal">ر.س</span></p>
                                  </div>
                                  <div className={`rounded-xl p-3 text-center ${fullyPaidByWallet ? "bg-green-100" : "bg-amber-50"}`}>
                                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${fullyPaidByWallet ? "text-green-600" : "text-amber-600"}`}>
                                      {fullyPaidByWallet ? "مسدّد بالكامل" : "يتبقى بنكي"}
                                    </p>
                                    <p className={`font-black text-base ${fullyPaidByWallet ? "text-green-700" : "text-amber-700"}`}>
                                      {fullyPaidByWallet ? "✓ صفر" : `${remainingAfterWallet.toLocaleString()} ر.س`}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </>
              )}

              {/* Step 2: Shipping (only if physical products) */}
              {preCheckoutStep === 2 && (
                <>
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-200/50 rounded-xl px-4 py-3 mb-2">
                    <Package className="w-4 h-4 text-blue-600 shrink-0" />
                    <p className="text-xs text-blue-700">يوجد في طلبك منتجات فيزيائية تحتاج إلى عنوان شحن</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-bold text-black/50 uppercase tracking-wider mb-1.5 block">اسم المستلم *</Label>
                      <Input value={shipping.name} onChange={e => setShipping(p => ({ ...p, name: e.target.value }))}
                        placeholder="الاسم الكامل" className="h-11 rounded-xl text-sm" data-testid="input-shipping-name" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-black/50 uppercase tracking-wider mb-1.5 block">رقم الجوال *</Label>
                      <Input value={shipping.phone} onChange={e => setShipping(p => ({ ...p, phone: e.target.value }))}
                        placeholder="05xxxxxxxx" className="h-11 rounded-xl text-sm" data-testid="input-shipping-phone" />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-black/50 uppercase tracking-wider mb-1.5 block">المدينة *</Label>
                    <Input value={shipping.city} onChange={e => setShipping(p => ({ ...p, city: e.target.value }))}
                      placeholder="الرياض، جدة، الدمام..." className="h-11 rounded-xl text-sm" data-testid="input-shipping-city" />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-black/50 uppercase tracking-wider mb-1.5 block">العنوان التفصيلي</Label>
                    <Textarea value={shipping.address} onChange={e => setShipping(p => ({ ...p, address: e.target.value }))}
                      placeholder="الحي، الشارع، رقم المبنى..." className="h-20 resize-none rounded-xl text-sm" data-testid="textarea-shipping-address" />
                  </div>
                </>
              )}
            </div>
          </ScrollArea>

          {/* Dialog footer */}
          <div className="px-5 pb-5 pt-3 border-t border-black/[0.06] space-y-3">
            {/* Trust line */}
            <div className="flex items-center justify-center gap-4 text-[10px] text-black/30">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> دفع آمن</span>
              <span className="flex items-center gap-1"><Clock3 className="w-3 h-3" /> رد خلال 24 ساعة</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> ضمان الجودة</span>
            </div>
            <div className="flex gap-3">
              {preCheckoutStep > 1 && (
                <Button variant="outline" className="gap-2 rounded-xl h-12 px-4" onClick={() => setPreCheckoutStep(s => s - 1)}
                  data-testid="button-prev-step">
                  <ChevronRight className="w-4 h-4" />
                  السابق
                </Button>
              )}
              {preCheckoutStep < totalSteps ? (
                <Button className="flex-1 bg-gradient-to-l from-gray-900 to-black text-white font-black h-12 rounded-xl gap-2 shadow-lg"
                  onClick={() => setPreCheckoutStep(s => s + 1)}
                  data-testid="button-next-step">
                  التالي — بيانات الشحن
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  className="flex-1 bg-gradient-to-l from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-black h-12 rounded-xl gap-2 shadow-lg shadow-cyan-600/20 transition-all"
                  onClick={() => checkoutMutation.mutate()}
                  disabled={checkoutMutation.isPending}
                  data-testid="button-confirm-checkout">
                  {checkoutMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> جاري إرسال الطلب...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> تأكيد الطلب والحصول على بيانات الدفع</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
