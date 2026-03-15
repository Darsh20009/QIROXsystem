import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2, Globe, Zap, Layers, Check, ChevronRight, ChevronLeft,
  Loader2, MessageCircle, CreditCard, CalendarCheck, ArrowRight,
  LayoutDashboard, ClipboardList, Sparkles
} from "lucide-react";

const LANGUAGES = [
  { v: "ar", label: "عربي", flag: "🇸🇦" },
  { v: "en", label: "English", flag: "🇺🇸" },
  { v: "both", label: "ثنائي", flag: "🌐" },
];

const INTEGRATIONS = [
  { key: "whatsappIntegration", label: "واتساب", icon: MessageCircle, color: "green" },
  { key: "needsPayment", label: "نظام دفع", icon: CreditCard, color: "blue" },
  { key: "needsBooking", label: "حجز مواعيد", icon: CalendarCheck, color: "violet" },
];

const SECTIONS = [
  { label: "بيانات النشاط", icon: Building2 },
  { label: "اللغة", icon: Globe },
  { label: "التكاملات", icon: Zap },
  { label: "الألوان والملاحظات", icon: Layers },
];

export default function ProjectDetailsSetup() {
  const [, params] = useRoute("/order-setup/:orderId");
  const orderId = params?.orderId || "";
  const { data: user } = useUser();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [section, setSection] = useState(0);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    businessName: (user as any)?.businessName || (user as any)?.fullName || "",
    phone: (user as any)?.phone || "",
    sector: "",
    targetAudience: "",
    siteLanguage: "ar",
    whatsappIntegration: false,
    needsPayment: false,
    needsBooking: false,
    brandColor: "",
    requiredFunctions: "",
  });

  const { data: sectorTemplates = [] } = useQuery<any[]>({
    queryKey: ["/api/templates"],
    staleTime: 5 * 60 * 1000,
  });

  const sectors = (sectorTemplates as any[])
    .filter((t: any) => t.slug)
    .map((t: any) => ({ value: t.slug, label: t.nameAr || t.name, icon: t.icon || "🏢" }));

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/orders/${orderId}/details`, form),
    onSuccess: () => {
      setSaved(true);
      toast({ title: "✅ تم حفظ تفاصيل مشروعك!" });
      setTimeout(() => navigate("/dashboard"), 1500);
    },
    onError: () => toast({ title: "فشل الحفظ، حاول مجدداً", variant: "destructive" }),
  });

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const canNext0 = !!form.businessName && !!form.sector;
  const canNext1 = !!form.siteLanguage;
  const isLast = section === 3;

  if (saved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center p-4" dir="rtl">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Check className="w-12 h-12 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-black mb-2">تم الحفظ!</h2>
          <p className="text-black/50 text-sm">جارٍ التوجيه للوحة التحكم...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50/30" dir="rtl">
      {/* Hero header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-5 pt-safe-top pb-8">
        <div className="max-w-xl mx-auto pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-lg leading-tight">تفاصيل مشروعك</h1>
              <p className="text-white/60 text-xs">ساعدنا نسلّم مشروعك بدقة وسرعة</p>
            </div>
          </div>

          {/* Section progress */}
          <div className="flex items-center gap-2">
            {SECTIONS.map((s, i) => (
              <div key={i} className={`flex items-center gap-1.5 ${i < SECTIONS.length - 1 ? "flex-1" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  i < section ? "bg-white" : i === section ? "bg-white scale-110 shadow-lg" : "bg-white/20"
                }`}>
                  {i < section
                    ? <Check className="w-4 h-4 text-violet-600" />
                    : <s.icon className={`w-3.5 h-3.5 ${i === section ? "text-violet-600" : "text-white/50"}`} />
                  }
                </div>
                {i < SECTIONS.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded-full transition-all ${i < section ? "bg-white/60" : "bg-white/20"}`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-white/50 text-xs mt-2">{SECTIONS[section].label} — خطوة {section + 1} من {SECTIONS.length}</p>
        </div>
      </div>

      {/* Form content */}
      <div className="max-w-xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">

          {/* Section 0: Business Info */}
          {section === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
              <div className="bg-white rounded-3xl border border-black/[0.06] p-5 shadow-sm">
                <h2 className="font-black text-black mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-violet-600" /> بيانات النشاط
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-bold text-black/40 uppercase tracking-wider mb-1.5 block">اسم النشاط / المشروع *</Label>
                      <Input value={form.businessName} onChange={e => set("businessName", e.target.value)}
                        placeholder="مثال: مطعم الأصالة" className="h-11 rounded-xl" data-testid="setup-input-name" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-black/40 uppercase tracking-wider mb-1.5 block">رقم الجوال</Label>
                      <Input value={form.phone} onChange={e => set("phone", e.target.value)}
                        placeholder="05xxxxxxxx" className="h-11 rounded-xl" data-testid="setup-input-phone" />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-black/40 uppercase tracking-wider mb-2 block">القطاع *</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {sectors.length > 0 ? sectors.map((s: any) => (
                        <button key={s.value} onClick={() => set("sector", s.value)}
                          data-testid={`setup-sector-${s.value}`}
                          className={`border-2 rounded-2xl p-3 text-center transition-all ${form.sector === s.value ? "border-violet-500 bg-violet-50 shadow-sm" : "border-black/[0.07] hover:border-black/20"}`}>
                          <div className="text-2xl mb-1">{s.icon}</div>
                          <div className="text-[10px] font-bold text-black/60 leading-tight">{s.label}</div>
                        </button>
                      )) : (
                        <div className="col-span-full">
                          <Input value={form.sector} onChange={e => set("sector", e.target.value)}
                            placeholder="اكتب القطاع..." className="h-11 rounded-xl" data-testid="setup-input-sector" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-black/40 uppercase tracking-wider mb-1.5 block">الجمهور المستهدف</Label>
                    <Input value={form.targetAudience} onChange={e => set("targetAudience", e.target.value)}
                      placeholder="مثال: شباب 18-35 سنة، عائلات..." className="h-11 rounded-xl" data-testid="setup-input-audience" />
                  </div>
                </div>
              </div>

              <Button onClick={() => setSection(1)} disabled={!canNext0}
                className="w-full h-12 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold gap-2" data-testid="setup-btn-next-0">
                التالي <ChevronLeft className="w-4 h-4" />
              </Button>
              <button onClick={() => navigate("/dashboard")} className="w-full text-center text-xs text-black/30 hover:text-black/50 py-2 transition-colors">
                سأكملها لاحقاً من لوحة التحكم ←
              </button>
            </motion.div>
          )}

          {/* Section 1: Language */}
          {section === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
              <div className="bg-white rounded-3xl border border-black/[0.06] p-5 shadow-sm">
                <h2 className="font-black text-black mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-violet-600" /> لغة الموقع / النظام
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {LANGUAGES.map(lang => (
                    <button key={lang.v} onClick={() => set("siteLanguage", lang.v)}
                      data-testid={`setup-lang-${lang.v}`}
                      className={`border-2 rounded-2xl py-5 px-2 text-center transition-all ${form.siteLanguage === lang.v ? "border-violet-500 bg-violet-50 shadow-md" : "border-black/[0.07] hover:border-black/20"}`}>
                      <div className="text-3xl mb-2">{lang.flag}</div>
                      <div className="text-xs font-bold text-black/70">{lang.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setSection(0)} className="h-12 px-5 rounded-2xl" data-testid="setup-btn-back-1">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button onClick={() => setSection(2)} disabled={!canNext1}
                  className="flex-1 h-12 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold gap-2" data-testid="setup-btn-next-1">
                  التالي <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
              <button onClick={() => navigate("/dashboard")} className="w-full text-center text-xs text-black/30 hover:text-black/50 py-2 transition-colors">
                سأكملها لاحقاً من لوحة التحكم ←
              </button>
            </motion.div>
          )}

          {/* Section 2: Integrations */}
          {section === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
              <div className="bg-white rounded-3xl border border-black/[0.06] p-5 shadow-sm">
                <h2 className="font-black text-black mb-1 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-violet-600" /> التكاملات المطلوبة
                </h2>
                <p className="text-xs text-black/40 mb-4">اختر الأنظمة التي تحتاجها (يمكن تعديلها لاحقاً)</p>
                <div className="space-y-3">
                  {INTEGRATIONS.map(({ key, label, icon: Icon, color }) => {
                    const active = (form as any)[key];
                    return (
                      <button key={key} onClick={() => set(key, !active)}
                        data-testid={`setup-integration-${key}`}
                        className={`w-full text-right rounded-2xl p-4 border-2 flex items-center gap-3 transition-all ${active ? `border-${color}-400 bg-${color}-50` : "border-black/[0.07] hover:border-black/20"}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${active ? `bg-${color}-100` : "bg-black/[0.04]"}`}>
                          <Icon className={`w-5 h-5 ${active ? `text-${color}-600` : "text-black/30"}`} />
                        </div>
                        <div className="flex-1">
                          <p className={`font-bold text-sm ${active ? "text-black" : "text-black/60"}`}>{label}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${active ? `border-${color}-500 bg-${color}-500` : "border-black/[0.15]"}`}>
                          {active && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setSection(1)} className="h-12 px-5 rounded-2xl" data-testid="setup-btn-back-2">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button onClick={() => setSection(3)}
                  className="flex-1 h-12 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold gap-2" data-testid="setup-btn-next-2">
                  التالي <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
              <button onClick={() => navigate("/dashboard")} className="w-full text-center text-xs text-black/30 hover:text-black/50 py-2 transition-colors">
                سأكملها لاحقاً من لوحة التحكم ←
              </button>
            </motion.div>
          )}

          {/* Section 3: Colors & Notes */}
          {section === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
              <div className="bg-white rounded-3xl border border-black/[0.06] p-5 shadow-sm">
                <h2 className="font-black text-black mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-violet-600" /> الألوان والملاحظات
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-bold text-black/40 uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> ألوان البراند المفضّلة
                    </Label>
                    <Input value={form.brandColor} onChange={e => set("brandColor", e.target.value)}
                      placeholder="مثال: أزرق وذهبي، أخضر داكن..." className="h-11 rounded-xl" data-testid="setup-input-color" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-black/40 uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" /> ملاحظات ومتطلبات إضافية
                    </Label>
                    <Textarea value={form.requiredFunctions} onChange={e => set("requiredFunctions", e.target.value)}
                      placeholder="أي تفاصيل إضافية، ميزات خاصة، أو أي شيء تريدنا معرفته..."
                      rows={5} className="rounded-xl resize-none" data-testid="setup-input-notes" />
                  </div>
                </div>
              </div>

              {/* Summary card */}
              <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold text-violet-700 mb-2">ملخص ما ستُرسله:</p>
                {[
                  { label: "النشاط", val: form.businessName },
                  { label: "القطاع", val: form.sector },
                  { label: "اللغة", val: LANGUAGES.find(l => l.v === form.siteLanguage)?.label },
                  { label: "التكاملات", val: INTEGRATIONS.filter(i => (form as any)[i.key]).map(i => i.label).join("، ") || "لا يوجد" },
                ].map(r => r.val && (
                  <div key={r.label} className="flex items-start gap-2 text-xs">
                    <span className="text-violet-500 font-bold shrink-0 w-16">{r.label}:</span>
                    <span className="text-violet-800 font-medium">{r.val}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setSection(2)} className="h-12 px-5 rounded-2xl" data-testid="setup-btn-back-3">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
                  className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black gap-2" data-testid="setup-btn-save">
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> حفظ التفاصيل والانطلاق</>}
                </Button>
              </div>
              <button onClick={() => navigate("/dashboard")} className="w-full text-center text-xs text-black/30 hover:text-black/50 py-2 transition-colors" data-testid="setup-btn-skip">
                سأكملها لاحقاً من لوحة التحكم ←
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
