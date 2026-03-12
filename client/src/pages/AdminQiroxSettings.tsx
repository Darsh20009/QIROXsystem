import { useState, useEffect } from "react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Building2, Globe, Phone, Mail, MapPin, Instagram, Youtube,
  Loader2, Save, DollarSign, BarChart3, Users, Settings2,
  Linkedin, Twitter, Plus, Trash2, CheckCircle2, AlertCircle, Smartphone, AppWindow, Link2
} from "lucide-react";
import { SiWhatsapp, SiGoogleplay, SiApple } from "react-icons/si";

type Settings = {
  companyName: string; companyNameAr: string; domain: string;
  tagline: string; taglineAr: string; description: string;
  logoUrl: string; faviconUrl: string;
  contactEmail: string; contactPhone: string; whatsapp: string;
  address: string; city: string; country: string;
  instagram: string; twitter: string; linkedin: string;
  snapchat: string; youtube: string; tiktok: string; linktree: string;
  taxNumber: string; commercialReg: string;
  foundedYear: number; teamSize: number;
  systemValuation: number; currency: string;
  profitDistribution: { roleType: string; percentage: number; label: string }[];
};

const EMPTY: Settings = {
  companyName: "QIROX Studio", companyNameAr: "كيروكس ستوديو",
  domain: "qiroxstudio.online", tagline: "مصنع الأنظمة", taglineAr: "مصنع الأنظمة الرقمية",
  description: "", logoUrl: "", faviconUrl: "",
  contactEmail: "info@qiroxstudio.online", contactPhone: "", whatsapp: "",
  address: "", city: "", country: "المملكة العربية السعودية",
  instagram: "", twitter: "", linkedin: "", snapchat: "", youtube: "", tiktok: "", linktree: "",
  taxNumber: "", commercialReg: "", foundedYear: 2024, teamSize: 1,
  systemValuation: 0, currency: "SAR",
  profitDistribution: [],
};

type StoreConfig = {
  playStoreUrl: string; playStoreEnabled: boolean;
  appStoreUrl: string;  appStoreEnabled: boolean;
  msStoreUrl: string;   msStoreEnabled: boolean;
};

const EMPTY_STORE: StoreConfig = {
  playStoreUrl: "", playStoreEnabled: false,
  appStoreUrl: "",  appStoreEnabled: false,
  msStoreUrl: "",   msStoreEnabled: false,
};

type Section = "company" | "contact" | "social" | "financial" | "distribution" | "appdownload";

export default function AdminQiroxSettings() {
  const { toast } = useToast();
  const [section, setSection] = useState<Section>("company");
  const [form, setForm] = useState<Settings>(EMPTY);
  const [dirty, setDirty] = useState(false);

  const { data, isLoading } = useQuery<Settings>({ queryKey: ["/api/admin/qirox-settings"] });

  useEffect(() => {
    if (data) { setForm({ ...EMPTY, ...data }); setDirty(false); }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("PUT", "/api/admin/qirox-settings", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/qirox-settings"] });
      setDirty(false);
      toast({ title: "✅ تم حفظ الإعدادات بنجاح" });
    },
    onError: () => toast({ title: "فشل الحفظ", variant: "destructive" }),
  });

  // Store Config (app downloads)
  const [store, setStore] = useState<StoreConfig>(EMPTY_STORE);
  const [storeDirty, setStoreDirty] = useState(false);
  const { data: storeData } = useQuery<any>({ queryKey: ["/api/admin/store-publish-config"] });
  useEffect(() => {
    if (storeData) {
      setStore({
        playStoreUrl: storeData.playStoreUrl || "",
        playStoreEnabled: storeData.playStoreEnabled ?? false,
        appStoreUrl: storeData.appStoreUrl || "",
        appStoreEnabled: storeData.appStoreEnabled ?? false,
        msStoreUrl: storeData.msStoreUrl || "",
        msStoreEnabled: storeData.msStoreEnabled ?? false,
      });
      setStoreDirty(false);
    }
  }, [storeData]);
  const setS = (k: keyof StoreConfig, v: any) => { setStore(s => ({ ...s, [k]: v })); setStoreDirty(true); };
  const saveStoreMutation = useMutation({
    mutationFn: () => apiRequest("PUT", "/api/admin/store-publish-config", store),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/store-publish-config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/app-downloads"] });
      setStoreDirty(false);
      toast({ title: "✅ تم حفظ روابط التحميل بنجاح" });
    },
    onError: () => toast({ title: "فشل الحفظ", variant: "destructive" }),
  });

  const set = (k: keyof Settings, v: any) => { setForm(f => ({ ...f, [k]: v })); setDirty(true); };

  const addDist = () => {
    setForm(f => ({ ...f, profitDistribution: [...f.profitDistribution, { roleType: "investor", percentage: 0, label: "مستثمرون" }] }));
    setDirty(true);
  };
  const removeDist = (i: number) => { setForm(f => ({ ...f, profitDistribution: f.profitDistribution.filter((_, j) => j !== i) })); setDirty(true); };
  const setDist = (i: number, k: string, v: any) => {
    setForm(f => {
      const arr = [...f.profitDistribution]; arr[i] = { ...arr[i], [k]: v }; return { ...f, profitDistribution: arr };
    }); setDirty(true);
  };

  const totalDist = form.profitDistribution.reduce((s, d) => s + (d.percentage || 0), 0);

  const SECTIONS: { id: Section; label: string; icon: any; color: string }[] = [
    { id: "company", label: "معلومات الشركة", icon: Building2, color: "text-blue-500" },
    { id: "contact", label: "التواصل والعنوان", icon: Phone, color: "text-green-500" },
    { id: "social", label: "السوشيال ميديا", icon: Globe, color: "text-purple-500" },
    { id: "financial", label: "التقييم المالي", icon: DollarSign, color: "text-amber-500" },
    { id: "distribution", label: "توزيع الأرباح", icon: BarChart3, color: "text-cyan-500" },
    { id: "appdownload", label: "تحميل التطبيق", icon: Smartphone, color: "text-violet-500" },
  ];

  if (isLoading) return <div className="flex justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" /></div>;

  return (
    <div className="relative overflow-hidden min-h-screen bg-white dark:bg-gray-950 p-6" dir="rtl">
      <PageGraphics variant="dashboard" />
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="relative bg-gradient-to-bl from-blue-600/10 via-cyan-500/5 to-transparent border border-black/[0.07] dark:border-white/[0.07] rounded-3xl p-7 overflow-hidden">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-8 right-8 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-full blur-2xl" />
          <div className="relative flex items-center gap-4 flex-wrap">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Settings2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-black dark:text-white">إعدادات نظام كيروكس</h1>
              <p className="text-black/40 dark:text-white/40 text-sm">إدارة بيانات الشركة، التواصل، التقييم المالي وتوزيع الأرباح</p>
            </div>
            {dirty && (
              <div className="mr-auto flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">يوجد تغييرات غير محفوظة</span>
              </div>
            )}
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-2 flex-wrap">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                section === s.id
                  ? "bg-black dark:bg-white text-white dark:text-black border-transparent"
                  : "border-black/[0.07] dark:border-white/[0.07] text-black/50 dark:text-white/50 hover:border-black/15 dark:hover:border-white/15"
              }`}
              data-testid={`section-${s.id}`}
            >
              <s.icon className={`w-4 h-4 ${section === s.id ? "text-current" : s.color}`} />
              {s.label}
            </button>
          ))}
        </div>

        {/* Section Content */}
        <motion.div key={section} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

          {/* Company Info */}
          {section === "company" && (
            <div className="border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-6 space-y-5 bg-white dark:bg-gray-900">
              <h3 className="font-bold text-black dark:text-white flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-500" /> معلومات الشركة</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-xs">اسم الشركة (EN)</label><Input value={form.companyName} onChange={e => set("companyName", e.target.value)} data-testid="input-company-name" /></div>
                <div><label className="label-xs">اسم الشركة (AR)</label><Input value={form.companyNameAr} onChange={e => set("companyNameAr", e.target.value)} data-testid="input-company-name-ar" /></div>
                <div><label className="label-xs">الدومين</label><Input value={form.domain} onChange={e => set("domain", e.target.value)} dir="ltr" data-testid="input-domain" /></div>
                <div><label className="label-xs">الشعار القصير (EN)</label><Input value={form.tagline} onChange={e => set("tagline", e.target.value)} data-testid="input-tagline" /></div>
                <div><label className="label-xs">الشعار القصير (AR)</label><Input value={form.taglineAr} onChange={e => set("taglineAr", e.target.value)} data-testid="input-tagline-ar" /></div>
                <div><label className="label-xs">سنة التأسيس</label><Input type="number" value={form.foundedYear} onChange={e => set("foundedYear", parseInt(e.target.value))} data-testid="input-founded-year" /></div>
                <div><label className="label-xs">حجم الفريق</label><Input type="number" value={form.teamSize} onChange={e => set("teamSize", parseInt(e.target.value))} data-testid="input-team-size" /></div>
              </div>
              <div><label className="label-xs">رابط الشعار (URL)</label><Input value={form.logoUrl} onChange={e => set("logoUrl", e.target.value)} dir="ltr" data-testid="input-logo-url" /></div>
              <div><label className="label-xs">وصف الشركة</label><Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={4} data-testid="textarea-description" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-xs">الرقم الضريبي</label><Input value={form.taxNumber} onChange={e => set("taxNumber", e.target.value)} data-testid="input-tax" /></div>
                <div><label className="label-xs">السجل التجاري</label><Input value={form.commercialReg} onChange={e => set("commercialReg", e.target.value)} data-testid="input-commercial-reg" /></div>
              </div>
            </div>
          )}

          {/* Contact */}
          {section === "contact" && (
            <div className="border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-6 space-y-5 bg-white dark:bg-gray-900">
              <h3 className="font-bold text-black dark:text-white flex items-center gap-2"><Phone className="w-4 h-4 text-green-500" /> بيانات التواصل والعنوان</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-xs">البريد الإلكتروني</label><Input type="email" value={form.contactEmail} onChange={e => set("contactEmail", e.target.value)} dir="ltr" data-testid="input-email" /></div>
                <div><label className="label-xs">رقم الهاتف</label><Input value={form.contactPhone} onChange={e => set("contactPhone", e.target.value)} data-testid="input-phone" /></div>
                <div><label className="label-xs">واتساب</label><Input value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} data-testid="input-whatsapp" /></div>
                <div><label className="label-xs">المدينة</label><Input value={form.city} onChange={e => set("city", e.target.value)} data-testid="input-city" /></div>
                <div><label className="label-xs">الدولة</label><Input value={form.country} onChange={e => set("country", e.target.value)} data-testid="input-country" /></div>
              </div>
              <div><label className="label-xs">العنوان التفصيلي</label><Input value={form.address} onChange={e => set("address", e.target.value)} data-testid="input-address" /></div>
            </div>
          )}

          {/* Social */}
          {section === "social" && (
            <div className="border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-6 space-y-5 bg-white dark:bg-gray-900">
              <h3 className="font-bold text-black dark:text-white flex items-center gap-2"><Globe className="w-4 h-4 text-purple-500" /> منصات التواصل الاجتماعي</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { k: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-500" },
                  { k: "twitter", label: "X (Twitter)", icon: Twitter, color: "text-black dark:text-white" },
                  { k: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-700" },
                  { k: "youtube", label: "YouTube", icon: Youtube, color: "text-red-600" },
                  { k: "snapchat", label: "Snapchat", icon: Globe, color: "text-yellow-500" },
                  { k: "tiktok", label: "TikTok", icon: Globe, color: "text-black dark:text-white" },
                  { k: "whatsapp", label: "WhatsApp", icon: SiWhatsapp, color: "text-[#25D366]" },
                  { k: "linktree", label: "Linktree", icon: Link2, color: "text-green-500" },
                ].map(({ k, label, icon: Icon, color }) => (
                  <div key={k}>
                    <label className="flex items-center gap-1.5 text-xs text-black/40 dark:text-white/40 mb-1"><Icon className={`w-3.5 h-3.5 ${color}`} />{label}</label>
                    <Input value={(form as any)[k]} onChange={e => set(k as keyof Settings, e.target.value)} dir="ltr" placeholder="https://..." data-testid={`input-${k}`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial */}
          {section === "financial" && (
            <div className="border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-6 space-y-5 bg-white dark:bg-gray-900">
              <h3 className="font-bold text-black dark:text-white flex items-center gap-2"><DollarSign className="w-4 h-4 text-amber-500" /> التقييم المالي للنظام</h3>
              <div className="bg-gradient-to-l from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
                <p className="text-xs text-amber-700 dark:text-amber-400 mb-3 font-medium">القيمة الإجمالية لنظام كيروكس (بالعملة المحددة)</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="label-xs">قيمة النظام</label>
                    <Input type="number" value={form.systemValuation} onChange={e => set("systemValuation", parseFloat(e.target.value) || 0)} className="text-xl font-black h-12" data-testid="input-valuation" />
                  </div>
                  <div className="w-28">
                    <label className="label-xs">العملة</label>
                    <Input value={form.currency} onChange={e => set("currency", e.target.value)} data-testid="input-currency" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-black text-amber-600 dark:text-amber-400">
                  {form.systemValuation.toLocaleString("ar-SA")} {form.currency}
                </div>
              </div>
            </div>
          )}

          {/* Profit Distribution */}
          {section === "distribution" && (
            <div className="border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-6 space-y-5 bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-black dark:text-white flex items-center gap-2"><BarChart3 className="w-4 h-4 text-cyan-500" /> قواعد توزيع الأرباح</h3>
                <Button variant="outline" size="sm" className="gap-2" onClick={addDist} data-testid="btn-add-dist"><Plus className="w-3.5 h-3.5" /> إضافة قاعدة</Button>
              </div>

              {/* Total indicator */}
              <div className={`flex items-center gap-3 p-3 rounded-xl ${totalDist === 100 ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"} border`}>
                {totalDist === 100 ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
                <span className="text-sm font-medium text-black dark:text-white">الإجمالي: {totalDist}% {totalDist !== 100 && "(يجب أن يكون 100%)"}</span>
                <div className="flex-1 h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                  <div className={`h-full rounded-full ${totalDist === 100 ? "bg-green-500" : "bg-amber-500"}`} style={{ width: `${Math.min(totalDist, 100)}%` }} />
                </div>
              </div>

              {/* Distribution rows */}
              <div className="space-y-3">
                {form.profitDistribution.map((d, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_80px_36px] gap-3 items-end" data-testid={`dist-row-${i}`}>
                    <div><label className="label-xs">الوصف</label><Input value={d.label} onChange={e => setDist(i, "label", e.target.value)} placeholder="مثال: مستثمرون" /></div>
                    <div><label className="label-xs">نوع الدور</label>
                      <select value={d.roleType} onChange={e => setDist(i, "roleType", e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent text-sm text-black dark:text-white">
                        {["investor", "admin", "manager", "developer", "accountant", "client", "other"].map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div><label className="label-xs">النسبة %</label><Input type="number" min={0} max={100} value={d.percentage} onChange={e => setDist(i, "percentage", parseFloat(e.target.value) || 0)} /></div>
                    <button onClick={() => removeDist(i)} className="h-10 w-9 flex items-center justify-center rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-black/30 hover:text-red-500 transition-colors border border-black/10 dark:border-white/10" data-testid={`del-dist-${i}`}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
                {form.profitDistribution.length === 0 && (
                  <p className="text-center py-8 text-sm text-black/30 dark:text-white/30">لا توجد قواعد — اضغط "إضافة قاعدة"</p>
                )}
              </div>

              {/* Visual breakdown */}
              {form.profitDistribution.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-black/40 dark:text-white/40 uppercase tracking-wide">التوزيع البصري</p>
                  <div className="h-6 rounded-xl overflow-hidden flex">
                    {form.profitDistribution.map((d, i) => {
                      const colors = ["bg-cyan-500", "bg-blue-500", "bg-purple-500", "bg-pink-500", "bg-amber-500", "bg-green-500"];
                      return <div key={i} className={`${colors[i % colors.length]} h-full transition-all`} style={{ width: `${d.percentage}%` }} title={`${d.label}: ${d.percentage}%`} />;
                    })}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.profitDistribution.map((d, i) => {
                      const colors = ["bg-cyan-500", "bg-blue-500", "bg-purple-500", "bg-pink-500", "bg-amber-500", "bg-green-500"];
                      return <div key={i} className="flex items-center gap-1.5 text-xs text-black/50 dark:text-white/50"><span className={`w-3 h-3 rounded-sm ${colors[i % colors.length]}`} />{d.label}: {d.percentage}%</div>;
                    })}
                  </div>
                  {form.systemValuation > 0 && (
                    <div className="mt-2 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] space-y-1">
                      <p className="text-xs font-semibold text-black/40 dark:text-white/40">الأرباح المتوقعة (بناءً على تقييم {form.systemValuation.toLocaleString("ar-SA")} {form.currency}):</p>
                      {form.profitDistribution.map((d, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-black/60 dark:text-white/60">{d.label}</span>
                          <span className="font-medium text-black dark:text-white">{((form.systemValuation * d.percentage) / 100).toLocaleString("ar-SA")} {form.currency}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {/* App Downloads */}
          {section === "appdownload" && (
            <div className="border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-6 space-y-6 bg-white dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-violet-500" />
                <h3 className="font-bold text-black dark:text-white">روابط تحميل التطبيق</h3>
              </div>
              <p className="text-xs text-black/40 dark:text-white/40">
                هذه الروابط ستظهر في الفوتر للزوار. إذا أضفت رابطاً وفعّلت النشر، يظهر زر التحميل. إذا أضفت الرابط فقط بدون تفعيل، يظهر كـ "قريباً".
              </p>

              {[
                {
                  key: "playStore" as const,
                  label: "Google Play (Android)",
                  urlKey: "playStoreUrl" as const,
                  enabledKey: "playStoreEnabled" as const,
                  icon: <SiGoogleplay className="w-5 h-5 text-white" />,
                  iconBg: "bg-[#01875f]",
                  placeholder: "https://play.google.com/store/apps/details?id=...",
                },
                {
                  key: "appStore" as const,
                  label: "App Store (iOS / Apple)",
                  urlKey: "appStoreUrl" as const,
                  enabledKey: "appStoreEnabled" as const,
                  icon: <SiApple className="w-5 h-5 text-white" />,
                  iconBg: "bg-black",
                  placeholder: "https://apps.apple.com/app/...",
                },
                {
                  key: "msStore" as const,
                  label: "Microsoft Store (Windows)",
                  urlKey: "msStoreUrl" as const,
                  enabledKey: "msStoreEnabled" as const,
                  icon: <AppWindow className="w-5 h-5 text-white" />,
                  iconBg: "bg-[#0078d4]",
                  placeholder: "https://apps.microsoft.com/store/detail/...",
                },
              ].map(p => (
                <div key={p.key} className="border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className={`w-9 h-9 ${p.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      {p.icon}
                    </span>
                    <span className="font-semibold text-sm text-black dark:text-white">{p.label}</span>
                    {store[p.enabledKey] && store[p.urlKey] && (
                      <span className="mr-auto text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded-full font-medium">نشط — يظهر في الرئيسية والفوتر</span>
                    )}
                    {!store[p.enabledKey] && store[p.urlKey] && (
                      <span className="mr-auto text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full font-medium">قريباً — يظهر معطّلاً</span>
                    )}
                    {!store[p.urlKey] && (
                      <span className="mr-auto text-[10px] bg-black/[0.04] dark:bg-white/[0.04] text-black/30 dark:text-white/30 border border-black/[0.08] dark:border-white/[0.08] px-2 py-0.5 rounded-full font-medium">مخفي — لا رابط</span>
                    )}
                  </div>
                  <div>
                    <label className="label-xs">رابط الصفحة في المتجر</label>
                    <Input
                      value={store[p.urlKey]}
                      onChange={e => setS(p.urlKey, e.target.value)}
                      placeholder={p.placeholder}
                      dir="ltr"
                      data-testid={`input-${p.key}-url`}
                      className="rounded-xl"
                    />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer select-none" data-testid={`toggle-${p.key}-enabled`}>
                    <div
                      onClick={() => setS(p.enabledKey, !store[p.enabledKey])}
                      className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${store[p.enabledKey] ? "bg-green-500" : "bg-black/15 dark:bg-white/15"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${store[p.enabledKey] ? "right-0.5" : "left-0.5"}`} />
                    </div>
                    <span className="text-sm text-black/60 dark:text-white/60">
                      {store[p.enabledKey] ? "مفعّل — زر التحميل يعمل" : "قريباً — زر معطّل بشارة \"قريباً\""}
                    </span>
                  </label>
                </div>
              ))}

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => saveStoreMutation.mutate()}
                  disabled={!storeDirty || saveStoreMutation.isPending}
                  data-testid="btn-save-store"
                  className="gap-2 bg-gradient-to-l from-violet-600 to-purple-500 text-white px-8 h-12 text-base font-bold rounded-2xl shadow-lg shadow-violet-500/20"
                >
                  {saveStoreMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {saveStoreMutation.isPending ? "جارٍ الحفظ..." : "حفظ روابط التحميل"}
                </Button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Save Button — only for non-appdownload sections */}
        {section !== "appdownload" && (
        <div className="flex justify-end pb-8">
          <Button onClick={() => saveMutation.mutate()} disabled={!dirty || saveMutation.isPending} className="gap-2 bg-gradient-to-l from-blue-600 to-cyan-500 text-white px-8 h-12 text-base font-bold rounded-2xl shadow-lg shadow-blue-500/20" data-testid="btn-save-settings">
            {saveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saveMutation.isPending ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
          </Button>
        </div>
        )}
      </div>

      <style>{`.label-xs { display: block; font-size: 11px; color: rgba(0,0,0,0.4); margin-bottom: 4px; font-weight: 500; }.dark .label-xs { color: rgba(255,255,255,0.4); }`}</style>
    </div>
  );
}
