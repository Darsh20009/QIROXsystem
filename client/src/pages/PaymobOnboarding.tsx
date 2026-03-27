import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { ImageUpload } from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, FileText, CreditCard, IdCard, Globe2, ShieldCheck,
  CheckCircle2, ChevronRight, ChevronLeft, Download, Pen,
  AlertCircle, ExternalLink, Info, Percent, Star, ArrowLeft,
  Zap, Check
} from "lucide-react";
import paymobLogo from "@assets/download_1774503289938.png";
import qiroxLogo from "@assets/qirox_without_background_1771716363944.png";

const STEPS = [
  { icon: Building2, key: "business" },
  { icon: CreditCard, key: "banking" },
  { icon: IdCard, key: "identity" },
  { icon: Globe2, key: "paymob" },
  { icon: ShieldCheck, key: "policy" },
];

const FEE_TABLE = [
  { method: "رسوم الإعداد",                         methodEn: "Setup Fees",                        fee: "مجانًا",           feeEn: "Free",              free: true },
  { method: "مدى و STC Pay",                        methodEn: "Mada & STC Pay",                    fee: "1% + 1 SAR",       feeEn: "1% + 1 SAR",        free: false },
  { method: "الكروت المحلية (فيزا - ماستركارد)",   methodEn: "Local Cards (Visa - Mastercard)",   fee: "2.7% + 1 SAR",     feeEn: "2.7% + 1 SAR",     free: false },
  { method: "كروت دولية",                           methodEn: "International Cards",               fee: "3.7% + 1 SAR",     feeEn: "3.7% + 1 SAR",     free: false },
  { method: "Apple Pay",                             methodEn: "Apple Pay",                         fee: "حسب نوع الكارت",  feeEn: "Based on card type", free: false },
];

const POLICY_TEXT = `١. التزامات مقدم الخدمة

١.١ يلتزم مقدم الخدمة بتقديم الخدمة بكفاءة وفاعلية وفقاً للتعليمات الصادرة من الجهات الرقابية.

١.٢ بعد إتمام عملية الدفع فإن ذمة مقدم الخدمة تبرأ في مواجهة عميل التاجر ولا يحق لعميل التاجر أو من يوكله إلغاء تلك العملية.

١.٣ يلتزم مقدم الخدمة بتزويد التاجر بتقارير عمليات الدفع على المنصة الإلكترونية الخاصة بالتاجر.

١.٤ يلتزم مقدم الخدمة بإخطار التاجر بأية تحديثات أو تغييرات قبل إجرائها بـ٢٤ ساعة على الأقل.

٢. التزامات التاجر

٢.١ يقر التاجر بأن البيانات المقدمة لمقدم الخدمة لإبرام هذه الاتفاقية هي بيانات صحيحة، ويلتزم بالمحافظة على تحديث البيانات الشخصية الخاصة به.

٢.٢ يلتزم التاجر باتخاذ الإجراءات المعقولة لحماية أمان الحساب والنظام والجهاز المستخدم للدخول على المنصة الإلكترونية.

٢.٣ يلتزم التاجر باستخدام تقارير عمليات الدفع فقط للغرض الذي تم توفيرها من أجله وهو متابعة عمليات الدفع والتسوية.

٢.٤ يلتزم التاجر باستخدام الخدمات وفقا لشروط وأحكام مقدم الخدمة وإرشاداته وسياساته الصادرة والمعدلة من وقت لآخر.

٣. رسوم الخدمة

تُطبَّق الرسوم وفقاً لجدول الرسوم المعتمد بحسب وسيلة الدفع المستخدمة. رسوم الإعداد مجانية. تُخصم الرسوم من المبالغ المحولة قبل التسوية.

٤. الامتثال لنظام حماية البيانات الشخصية

٤.١ يقر الطرفان بالامتثال الكامل لنظام حماية البيانات الشخصية المعمول به في المملكة العربية السعودية.

٤.٢ يتعهد الطرفان بوضع سجل لأنشطة معالجة البيانات وفق نظام حماية البيانات الشخصية.

٤.٣ يتعهد الطرفان باتخاذ كافة التدابير التنظيمية والتقنية اللازمة لضمان حماية البيانات الشخصية.

٥. التزامات الأمن السيبراني

٥.١ يلتزم التاجر بالامتثال لمعايير الأمن السيبراني والحفاظ على ضوابط أمنية فعالة.

٥.٢ يلتزم التاجر بتنفيذ ضوابط صارمة للتأكد من أن الأشخاص المصرح لهم فقط هم من يمكنهم الدخول إلى المنصة.

٥.٣ يلتزم التاجر بتطوير وصيانة خطة استجابة للحوادث السيبرانية.

٥.٤ يلتزم التاجر بضمان سرية وسلامة وتوافر المعلومات والبيانات من خلال التشفير والنسخ الاحتياطي المنتظم.

٦. السرية وخصوصية وأمان المعلومات

٦.١ يتعهد الطرف المتلقي باستخدام المعلومات السرية فقط فيما يتعلق بخدمات موضوع هذه الاتفاقية.

٦.٢ لا يجوز الكشف عن أي معلومات سرية لأي شخص خارج منظومة الأعمال دون موافقة كتابية.

٦.٣ تظل أحكام السرية سارية لمدة عامين (٢) من تاريخ إنهاء أو انتهاء هذه الاتفاقية.

٧. مدة الاتفاقية

تبدأ هذه الاتفاقية من تاريخ إبرامها وتتجدد تلقائيًا لمدد متتالية كل منها سنة واحدة ميلادية ما لم يقدم أي من الطرفين إخطارًا كتابيًا بالإنهاء قبل ثلاثين (٣٠) يومًا تقويميًا.

٨. الإنهاء

يجوز لمقدم الخدمة إنهاء هذه الاتفاقية بأثر فوري عند مخالفة التاجر للشروط المنصوص عليها، أو عند طلب الجهات التنظيمية والرقابية في المملكة العربية السعودية ذلك.

٩. التعديلات

يجوز لمقدم الخدمة تعديل هذه الاتفاقية في أي وقت على أن يخطر التاجر بذلك كتابةً قبل التعديل بخمسة عشر (١٥) يومًا تقويميًا على الأقل.

١٠. الضمانات والمسؤولية

يوافق التاجر على تحمل الضرر وتعويض مقدم الخدمة عن أي مطالب أو ادعاءات ناشئة عن إخلال التاجر لشروط وأحكام هذه الاتفاقية.

١١. القانون الحاكم والاختصاص القضائي

تخضع هذه الاتفاقية للأنظمة واللوائح المعمول بها في المملكة العربية السعودية. أي خلاف بين الطرفين يُحل وديًا أولاً، وإن لم يُحل وديًا يُفصل فيه من قبل الجهات القضائية المختصة في المملكة العربية السعودية.

للتواصل والاستفسارات: support@paymob.com`;

interface FormData {
  docType: "freelance" | "commercial";
  docNumber: string;
  docFileUrl: string;
  ibanCertUrl: string;
  vatNumber: string;
  nationalId: string;
  nationalIdFront: string;
  nationalIdBack: string;
  paymobRegistered: boolean;
  policyAccepted: boolean;
  signatureName: string;
}

const EMPTY: FormData = {
  docType: "commercial",
  docNumber: "",
  docFileUrl: "",
  ibanCertUrl: "",
  vatNumber: "",
  nationalId: "",
  nationalIdFront: "",
  nationalIdBack: "",
  paymobRegistered: false,
  policyAccepted: false,
  signatureName: "",
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export default function PaymobOnboarding() {
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [done, setDone] = useState(false);
  const policyRef = useRef<HTMLDivElement>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/paymob-onboarding", form);
      return res.json();
    },
    onSuccess: () => setDone(true),
    onError: () => toast({ title: L ? "حدث خطأ، يرجى المحاولة مرة أخرى" : "An error occurred, please try again", variant: "destructive" }),
  });

  const set = (key: keyof FormData, val: any) => setForm(f => ({ ...f, [key]: val }));

  const stepTitles = L
    ? ["بيانات الكيان التجاري", "البيانات البنكية", "الهوية الوطنية", "التسجيل في Paymob", "الاتفاقية والسياسة"]
    : ["Business Entity", "Banking Details", "National Identity", "Paymob Registration", "Agreement & Policy"];

  const stepDescriptions = L
    ? ["أدخل بيانات نشاطك التجاري", "أدخل بيانات حسابك البنكي", "ارفع وثيقة هويتك الوطنية", "أكمل التسجيل في بوابة Paymob", "راجع السياسة ووقّع رقمياً"]
    : ["Enter your business details", "Add your banking information", "Upload your national identity", "Complete Paymob registration", "Review policy and sign digitally"];

  const canNext = () => {
    if (step === 0) return form.docType && form.docNumber.trim() && form.docFileUrl;
    if (step === 1) return !!form.ibanCertUrl;
    if (step === 2) return form.nationalId.trim() && form.nationalIdFront;
    if (step === 3) return true;
    if (step === 4) return form.policyAccepted && form.signatureName.trim();
    return false;
  };

  const handleNext = () => {
    if (step < 4) setStep(s => s + 1);
    else mutation.mutate();
  };

  const downloadPolicy = () => {
    const a = document.createElement("a");
    a.href = "/paymob-policy.txt";
    a.download = "paymob-policy.txt";
    a.click();
  };

  if (done) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950" dir={dir}>
        <Navigation />
        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-md w-full text-center"
          >
            <div className="w-24 h-24 rounded-full bg-green-50 dark:bg-green-500/10 border-2 border-green-200 dark:border-green-500/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-black dark:text-white mb-3">
              {L ? "تم إرسال طلبك بنجاح!" : "Your request has been submitted!"}
            </h1>
            <p className="text-black/40 dark:text-white/40 mb-8 leading-relaxed">
              {L
                ? "سيقوم فريق Qirox بمراجعة بياناتك والتواصل معك في أقرب وقت لإتمام تفعيل بوابة Paymob على نظامك."
                : "The Qirox team will review your data and contact you shortly to activate your Paymob gateway."}
            </p>
            <div className="flex items-center justify-center gap-3 p-4 bg-black/[0.02] dark:bg-white/[0.03] rounded-2xl border border-black/[0.06] dark:border-white/[0.06] mb-6">
              <img src={qiroxLogo} alt="Qirox" className="h-6 object-contain dark:invert dark:brightness-[2]" />
              <span className="text-black/20 dark:text-white/20">×</span>
              <img src={paymobLogo} alt="Paymob" className="h-6 object-contain" />
            </div>
            <Link href="/">
              <Button className="bg-black hover:bg-black/80 dark:bg-white dark:hover:bg-white/90 dark:text-black text-white rounded-xl h-11 px-6 font-bold">
                <ArrowLeft className="w-4 h-4 ml-2" />
                {L ? "العودة للرئيسية" : "Back to Home"}
              </Button>
            </Link>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950" dir={dir}>
      <Navigation />

      {/* Hero section */}
      <section className="pt-28 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #000 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 dark:from-blue-950/20 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <img src={qiroxLogo} alt="Qirox" className="h-8 object-contain dark:invert dark:brightness-[2]" />
              <span className="text-black/20 dark:text-white/20 text-xl font-thin">×</span>
              <img src={paymobLogo} alt="Paymob" className="h-7 object-contain" />
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] mb-5">
              <Zap className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
              <span className="text-black/40 dark:text-white/40 text-xs tracking-wider uppercase">
                {L ? "تفعيل بوابة الدفع" : "Payment Gateway Activation"}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-heading text-black dark:text-white mb-3 tracking-tight">
              {L ? "تكامل Paymob مع نظامك" : "Paymob Integration"}
            </h1>
            <p className="text-black/40 dark:text-white/40 text-sm leading-relaxed max-w-lg mx-auto">
              {L
                ? "أكمل الخطوات التالية لتفعيل بوابة الدفع الإلكتروني في نظامك بشكل رسمي."
                : "Complete the following steps to officially activate the electronic payment gateway in your system."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main wizard */}
      <section className="pb-24 flex-1">
        <div className="container mx-auto px-4 max-w-3xl">

          {/* Step indicators */}
          <div className="flex items-center justify-between mb-8 relative">
            <div className="absolute top-5 left-0 right-0 h-px bg-black/[0.06] dark:bg-white/[0.06] z-0" />
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <div key={i} className="flex flex-col items-center gap-2 z-10 relative" data-testid={`step-indicator-${i}`}>
                  <button
                    onClick={() => i < step && setStep(i)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isDone
                        ? "bg-black dark:bg-white border-black dark:border-white text-white dark:text-black cursor-pointer"
                        : isActive
                        ? "bg-blue-50 dark:bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400"
                        : "bg-white dark:bg-gray-950 border-black/[0.1] dark:border-white/[0.1] text-black/20 dark:text-white/20"
                    }`}
                  >
                    {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                  </button>
                  <span className={`text-[10px] font-medium hidden sm:block text-center max-w-[80px] leading-tight ${
                    isActive ? "text-blue-600 dark:text-blue-400" : isDone ? "text-black/30 dark:text-white/30" : "text-black/20 dark:text-white/20"
                  }`}>
                    {stepTitles[i]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-black/[0.04] dark:bg-white/[0.04] rounded-full mb-8 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500"
              style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
            />
          </div>

          {/* Step card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-3xl overflow-hidden shadow-sm dark:shadow-xl dark:shadow-black/20"
            >
              {/* Step header */}
              <div className="flex items-center gap-3 px-6 sm:px-8 py-5 border-b border-black/[0.05] dark:border-white/[0.05] bg-black/[0.01] dark:bg-white/[0.01]">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center shrink-0">
                  {(() => { const Icon = STEPS[step].icon; return <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />; })()}
                </div>
                <div>
                  <p className="text-[10px] text-black/30 dark:text-white/30 uppercase tracking-widest font-semibold">
                    {L ? `الخطوة ${step + 1} من ${STEPS.length}` : `Step ${step + 1} of ${STEPS.length}`}
                  </p>
                  <h2 className="text-lg font-bold font-heading text-black dark:text-white">{stepTitles[step]}</h2>
                </div>
                <p className="hidden sm:block text-black/35 dark:text-white/35 text-sm mr-auto">{stepDescriptions[step]}</p>
              </div>

              <div className="px-6 sm:px-8 py-7 space-y-6">

                {/* ── Step 0: Business Entity ── */}
                {step === 0 && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-black/60 dark:text-white/60 mb-3">
                        {L ? "نوع الوثيقة *" : "Document Type *"}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { val: "commercial", label: L ? "سجل تجاري" : "Commercial Registration", icon: Building2 },
                          { val: "freelance",  label: L ? "وثيقة العمل الحر" : "Freelance Document",        icon: FileText },
                        ].map(({ val, label, icon: Icon }) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => set("docType", val)}
                            data-testid={`btn-doc-type-${val}`}
                            className={`p-4 rounded-2xl border-2 text-right transition-all flex items-center gap-3 ${
                              form.docType === val
                                ? "border-black dark:border-white bg-black/[0.03] dark:bg-white/[0.04]"
                                : "border-black/[0.07] dark:border-white/[0.07] bg-transparent hover:border-black/20 dark:hover:border-white/20"
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${form.docType === val ? "bg-black/[0.06] dark:bg-white/[0.08]" : "bg-black/[0.03] dark:bg-white/[0.03]"}`}>
                              <Icon className={`w-4 h-4 ${form.docType === val ? "text-black dark:text-white" : "text-black/30 dark:text-white/30"}`} />
                            </div>
                            <span className={`text-sm font-semibold ${form.docType === val ? "text-black dark:text-white" : "text-black/40 dark:text-white/40"}`}>
                              {label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-black/60 dark:text-white/60 mb-2">
                        {form.docType === "commercial"
                          ? (L ? "رقم السجل التجاري *" : "Commercial Registration Number *")
                          : (L ? "رقم وثيقة العمل الحر *" : "Freelance Document Number *")}
                      </label>
                      <Input
                        value={form.docNumber}
                        onChange={e => set("docNumber", e.target.value)}
                        placeholder={form.docType === "commercial" ? "1010XXXXXXX" : "700XXXXXXX"}
                        className="h-12 rounded-xl border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] text-black dark:text-white placeholder:text-black/25 dark:placeholder:text-white/25"
                        dir="ltr"
                        data-testid="input-doc-number"
                      />
                    </div>

                    <div>
                      <ImageUpload
                        label={form.docType === "commercial"
                          ? (L ? "صورة السجل التجاري *" : "Commercial Registration Image *")
                          : (L ? "صورة وثيقة العمل الحر *" : "Freelance Document Image *")}
                        value={form.docFileUrl}
                        onChange={url => set("docFileUrl", url)}
                        accept="image/*,.pdf"
                      />
                      {!form.docFileUrl && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {L ? "يجب رفع صورة واضحة للوثيقة" : "A clear image of the document is required"}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Step 1: Banking ── */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 rounded-2xl">
                      <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-black/60 dark:text-white/50 leading-relaxed">
                        {L
                          ? "شهادة الآيبان هي وثيقة رسمية من البنك تُثبت صحة حسابك البنكي. يمكن الحصول عليها من تطبيق البنك أو من الفرع."
                          : "An IBAN certificate is an official bank document proving your bank account. It can be obtained from your banking app or branch."}
                      </p>
                    </div>

                    <div>
                      <ImageUpload
                        label={L ? "شهادة الآيبان (IBAN) *" : "IBAN Certificate *"}
                        value={form.ibanCertUrl}
                        onChange={url => set("ibanCertUrl", url)}
                        accept="image/*,.pdf"
                      />
                      {!form.ibanCertUrl && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {L ? "شهادة الآيبان مطلوبة" : "IBAN certificate is required"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-black/60 dark:text-white/60 mb-2">
                        {L ? "الرقم الضريبي (اختياري)" : "VAT Number (Optional)"}
                      </label>
                      <Input
                        value={form.vatNumber}
                        onChange={e => set("vatNumber", e.target.value)}
                        placeholder="300XXXXXXXXXXX"
                        className="h-12 rounded-xl border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] text-black dark:text-white placeholder:text-black/25 dark:placeholder:text-white/25"
                        dir="ltr"
                        data-testid="input-vat"
                      />
                      <p className="text-xs text-black/30 dark:text-white/30 mt-1.5">
                        {L ? "ادخل الرقم الضريبي إذا كنت مسجلاً في هيئة الزكاة والضريبة" : "Enter if registered with ZATCA"}
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Step 2: National ID ── */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-black/60 dark:text-white/60 mb-2">
                        {L ? "رقم الهوية الوطنية *" : "National ID Number *"}
                      </label>
                      <Input
                        value={form.nationalId}
                        onChange={e => set("nationalId", e.target.value)}
                        placeholder="1XXXXXXXXX"
                        maxLength={10}
                        className="h-12 rounded-xl border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] text-black dark:text-white placeholder:text-black/25 dark:placeholder:text-white/25 text-lg tracking-wider"
                        dir="ltr"
                        data-testid="input-national-id"
                      />
                    </div>

                    <div>
                      <ImageUpload
                        label={L ? "صورة الهوية — الوجه الأمامي *" : "ID Photo — Front Face *"}
                        value={form.nationalIdFront}
                        onChange={url => set("nationalIdFront", url)}
                        accept="image/*"
                      />
                      {!form.nationalIdFront && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {L ? "صورة الوجه الأمامي للهوية مطلوبة" : "Front face of ID is required"}
                        </p>
                      )}
                    </div>

                    <div>
                      <ImageUpload
                        label={L ? "صورة الهوية — الوجه الخلفي (اختياري)" : "ID Photo — Back Face (Optional)"}
                        value={form.nationalIdBack}
                        onChange={url => set("nationalIdBack", url)}
                        accept="image/*"
                      />
                    </div>

                    <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 rounded-2xl">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-black/50 dark:text-white/50">
                        {L
                          ? "تأكد من أن الصورة واضحة وجميع البيانات مقروءة. سيتم التحقق من الهوية بشكل آمن وسري."
                          : "Ensure the image is clear and all data is readable. Identity will be verified securely and confidentially."}
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Step 3: Paymob Registration ── */}
                {step === 3 && (
                  <div className="space-y-5">
                    <div className="p-5 bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/15 rounded-2xl">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-black dark:text-white mb-1">
                            {L ? "تعليمات مهمة قبل التسجيل" : "Important instructions before registration"}
                          </p>
                          <p className="text-sm text-black/50 dark:text-white/50 leading-relaxed">
                            {L
                              ? "استخدم رقم الجوال المرتبط بحسابك الحالي في Qirox عند التسجيل في منصة Paymob. هذا يضمن ربط حسابك بشكل صحيح."
                              : "Use the mobile number linked to your current Qirox account when registering on Paymob. This ensures your account is correctly linked."}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl overflow-hidden border border-black/[0.07] dark:border-white/[0.07] bg-black/[0.01] dark:bg-white/[0.01] relative" style={{ height: 520 }}>
                      <div className="absolute top-0 left-0 right-0 z-10 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm px-4 py-2.5 flex items-center gap-2 border-b border-black/[0.06] dark:border-white/[0.06]">
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                        <div className="w-2 h-2 rounded-full bg-yellow-400" />
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-xs text-black/30 dark:text-white/30 mx-auto">ksa.paymob.com</span>
                        <a
                          href="https://ksa.paymob.com/portal2/en/register?accept_sales_owner=Amira_nabil"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-black/30 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <iframe
                        src="https://ksa.paymob.com/portal2/en/register?accept_sales_owner=Amira_nabil"
                        className="w-full h-full border-0"
                        style={{ paddingTop: 40 }}
                        title="Paymob Registration"
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                      />
                    </div>

                    <div className="flex items-center gap-2 p-4 bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl border border-black/[0.05] dark:border-white/[0.05]">
                      <Globe2 className="w-4 h-4 text-black/30 dark:text-white/30 shrink-0" />
                      <p className="text-xs text-black/40 dark:text-white/40">
                        {L ? "إذا لم تعمل الصفحة داخل المتصفح، " : "If the page doesn't load in the browser, "}
                        <a
                          href="https://ksa.paymob.com/portal2/en/register?accept_sales_owner=Amira_nabil"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 underline hover:text-blue-500 dark:hover:text-blue-300"
                        >
                          {L ? "افتحها في نافذة جديدة" : "open it in a new window"}
                        </a>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl border border-black/[0.05] dark:border-white/[0.05]">
                      <input
                        type="checkbox"
                        id="paymob-registered"
                        checked={form.paymobRegistered}
                        onChange={e => set("paymobRegistered", e.target.checked)}
                        className="w-4 h-4 rounded accent-blue-500"
                        data-testid="checkbox-paymob-registered"
                      />
                      <label htmlFor="paymob-registered" className="text-sm text-black/60 dark:text-white/60 cursor-pointer">
                        {L ? "أؤكد أنني أكملت التسجيل في منصة Paymob" : "I confirm that I have completed registration on Paymob"}
                      </label>
                    </div>
                  </div>
                )}

                {/* ── Step 4: Policy & Agreement ── */}
                {step === 4 && (
                  <div className="space-y-6">
                    {/* Fee Table */}
                    <div>
                      <h3 className="text-base font-bold font-heading text-black dark:text-white mb-4 flex items-center gap-2">
                        <Percent className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        {L ? "جدول رسوم بوابة الدفع" : "Payment Gateway Fee Table"}
                      </h3>
                      <div className="rounded-2xl overflow-hidden border border-black/[0.07] dark:border-white/[0.07]">
                        <div className="bg-blue-50 dark:bg-blue-600/10 border-b border-blue-100 dark:border-blue-500/15 px-5 py-3 text-center">
                          <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{L ? "جدول الرسوم" : "Fee Schedule"}</p>
                        </div>
                        {FEE_TABLE.map((row, i) => (
                          <div
                            key={i}
                            className={`flex items-center justify-between px-5 py-3.5 border-b border-black/[0.04] dark:border-white/[0.04] last:border-b-0 ${i % 2 === 0 ? "bg-black/[0.01] dark:bg-white/[0.01]" : "bg-transparent"}`}
                          >
                            <span className="text-sm text-black/60 dark:text-white/60 font-medium">{L ? row.method : row.methodEn}</span>
                            <span className={`text-sm font-bold ${row.free ? "text-green-600 dark:text-green-400" : "text-black dark:text-white"}`}>
                              {L ? row.fee : row.feeEn}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Policy Text */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-bold font-heading text-black dark:text-white flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          {L ? "اتفاقية الخدمة" : "Service Agreement"}
                        </h3>
                        <button
                          onClick={downloadPolicy}
                          className="flex items-center gap-1.5 text-xs text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
                          data-testid="btn-download-policy"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {L ? "تحميل" : "Download"}
                        </button>
                      </div>
                      <div
                        ref={policyRef}
                        className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-5 h-56 overflow-y-auto text-sm text-black/50 dark:text-white/40 leading-relaxed whitespace-pre-line scroll-smooth"
                        dir="rtl"
                        data-testid="policy-text"
                      >
                        {POLICY_TEXT}
                      </div>
                    </div>

                    {/* Checkbox + Signature */}
                    <div className="p-5 bg-blue-50 dark:bg-blue-500/[0.05] border border-blue-100 dark:border-blue-500/10 rounded-2xl space-y-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="policy-accept"
                          checked={form.policyAccepted}
                          onChange={e => set("policyAccepted", e.target.checked)}
                          className="w-4 h-4 rounded accent-blue-500 mt-0.5"
                          data-testid="checkbox-policy"
                        />
                        <label htmlFor="policy-accept" className="text-sm text-black/60 dark:text-white/60 cursor-pointer leading-relaxed">
                          {L
                            ? "أقر بأنني قرأت وفهمت واتفقت على جميع شروط وأحكام اتفاقية الخدمة مع Paymob بما فيها جدول الرسوم المبين أعلاه."
                            : "I acknowledge that I have read, understood, and agreed to all terms and conditions of the service agreement with Paymob including the fee schedule above."}
                        </label>
                      </div>

                      {form.policyAccepted && (
                        <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.06]">
                          <label className="block text-sm font-semibold text-black/60 dark:text-white/60 mb-2">
                            <Pen className="w-3.5 h-3.5 inline mr-1.5" />
                            {L ? "التوقيع الرقمي — اكتب اسمك الكامل *" : "Digital Signature — Write your full name *"}
                          </label>
                          <Input
                            value={form.signatureName}
                            onChange={e => set("signatureName", e.target.value)}
                            placeholder={L ? "اسمك الكامل بالعربية أو الإنجليزية" : "Your full name in Arabic or English"}
                            className="h-12 rounded-xl border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-gray-900 text-black dark:text-white placeholder:text-black/25 dark:placeholder:text-white/25 font-semibold"
                            data-testid="input-signature"
                          />
                          {form.signatureName && (
                            <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between">
                              <span className="text-black/30 dark:text-white/30 text-xs">{L ? "التوقيع الرقمي المعتمد:" : "Approved digital signature:"}</span>
                              <span className="text-black dark:text-white font-bold text-base" style={{ fontFamily: "Georgia, serif" }}>
                                {form.signatureName}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* Bottom navigation */}
              <div className="flex items-center gap-3 px-6 sm:px-8 py-5 border-t border-black/[0.05] dark:border-white/[0.05] bg-black/[0.01] dark:bg-white/[0.01]">
                {step > 0 && (
                  <button
                    onClick={() => setStep(s => s - 1)}
                    className="flex items-center gap-2 text-sm text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors font-medium h-11 px-4 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                  >
                    {L ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    {L ? "السابق" : "Back"}
                  </button>
                )}
                <div className="flex-1" />
                {step < 4 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!canNext()}
                    className="bg-black hover:bg-black/80 dark:bg-white dark:hover:bg-white/90 dark:text-black text-white disabled:opacity-30 h-11 px-7 rounded-xl font-bold gap-2"
                    data-testid="btn-next"
                  >
                    {L ? "التالي" : "Next"}
                    {L ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={!canNext() || mutation.isPending}
                    className="bg-black hover:bg-black/80 dark:bg-white dark:hover:bg-white/90 dark:text-black text-white disabled:opacity-30 h-11 px-7 rounded-xl font-bold gap-2"
                    data-testid="btn-submit"
                  >
                    <Star className="w-4 h-4" />
                    {mutation.isPending ? (L ? "جاري الإرسال..." : "Submitting...") : (L ? "إرسال الطلب" : "Submit Request")}
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Required fields note */}
          <p className="text-center text-xs text-black/25 dark:text-white/25 mt-4">
            <span className="text-red-500">*</span> {L ? "الحقول المطلوبة" : "Required fields"}
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
