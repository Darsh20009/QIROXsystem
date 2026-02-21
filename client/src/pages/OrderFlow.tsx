import { useState } from "react";
import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useUser } from "@/hooks/use-auth";
import { useService } from "@/hooks/use-services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, CheckCircle, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function OrderFlow() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const serviceId = searchParams.get("service") || "";

  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: service, isLoading: isServiceLoading } = useService(serviceId);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    projectType: "",
    sector: "",
    competitors: "",
    visualStyle: "",
    favoriteExamples: "",
    requiredFunctions: "",
    requiredSystems: "",
    siteLanguage: "ar",
    whatsappIntegration: false,
    socialIntegration: false,
    hasLogo: false,
    needsLogoDesign: false,
    hasHosting: false,
    hasDomain: false,
    logoUrl: "",
    brandIdentityUrl: "",
    filesUrl: "",
    contentUrl: "",
    imagesUrl: "",
    videoUrl: "",
    accessCredentials: "",
    paymentMethod: "bank_transfer",
    paymentProofUrl: ""
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/orders", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "تم استلام طلبك بنجاح",
        description: "سيتم التواصل معك قريباً لتأكيد التفاصيل.",
      });
      setLocation("/dashboard");
    },
    onError: () => {
      toast({
        title: "حدث خطأ",
        description: "لم نتمكن من إرسال طلبك، حاول مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  if (isUserLoading || isServiceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]">
        <Loader2 className="w-10 h-10 animate-spin text-[#00D4FF]" />
      </div>
    );
  }

  if (!user) {
    setLocation(`/login`);
    return null;
  }

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0A0A0F]">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center" dir="rtl">
            <p className="text-white/40 text-lg mb-4">الخدمة غير موجودة</p>
            <Button onClick={() => setLocation("/services")} className="premium-btn" data-testid="button-back-services">
              العودة للخدمات
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = () => {
    createOrderMutation.mutate({
      serviceId: service.id,
      ...formData,
      status: "pending",
      isDepositPaid: false,
      totalAmount: service.priceMin
    });
  };

  const stepLabels = ["نوع المشروع", "المتطلبات", "المستندات", "الدفع", "تأكيد"];

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0F]">
      <Navigation />

      <div className="flex-1 container mx-auto px-4 py-8 pt-32 max-w-3xl" dir="rtl">
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -z-10"></div>
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 border ${
                  step >= s
                    ? "bg-[#00D4FF] text-[#0A0A0F] border-[#00D4FF] scale-110"
                    : "bg-white/5 text-white/30 border-white/10"
                }`}
                data-testid={`step-indicator-${s}`}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-[10px] md:text-sm text-white/30 font-medium px-1">
            {stepLabels.map((label, i) => (
              <span key={i} className={step === i + 1 ? "text-[#00D4FF]" : ""}>{label}</span>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#00D4FF] to-[#0099CC]" style={{ width: `${(step / 5) * 100}%`, transition: "width 0.3s" }} />
          <div className="p-6 md:p-8 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">
              {step === 1 && "نوع المشروع والقطاع"}
              {step === 2 && "المتطلبات الفنية والنمط"}
              {step === 3 && "رفع المستندات"}
              {step === 4 && "اختر طريقة الدفع"}
              {step === 5 && "ملخص الطلب"}
            </h2>
            <p className="text-sm text-white/30 mt-1">
              الخدمة: <span className="text-[#00D4FF]">{service.title}</span>
            </p>
          </div>

          <div className="p-6 md:p-8">
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm mb-2 block text-white/60">نوع المشروع</Label>
                    <Input
                      placeholder="مثال: تطبيق توصيل"
                      className="bg-white/5 border-white/10 text-white"
                      value={formData.projectType}
                      onChange={e => setFormData({ ...formData, projectType: e.target.value })}
                      data-testid="input-projectType"
                    />
                  </div>
                  <div>
                    <Label className="text-sm mb-2 block text-white/60">القطاع</Label>
                    <Input
                      placeholder="مثال: قطاع التجزئة"
                      className="bg-white/5 border-white/10 text-white"
                      value={formData.sector}
                      onChange={e => setFormData({ ...formData, sector: e.target.value })}
                      data-testid="input-sector"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm mb-2 block text-white/60">المنافسين</Label>
                  <Input
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="اذكر أهم المنافسين..."
                    value={formData.competitors}
                    onChange={e => setFormData({ ...formData, competitors: e.target.value })}
                    data-testid="input-competitors"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm mb-2 block text-white/60">النمط البصري</Label>
                    <Input
                      placeholder="مودرن، كلاسيك..."
                      className="bg-white/5 border-white/10 text-white"
                      value={formData.visualStyle}
                      onChange={e => setFormData({ ...formData, visualStyle: e.target.value })}
                      data-testid="input-visualStyle"
                    />
                  </div>
                  <div>
                    <Label className="text-sm mb-2 block text-white/60">لغة الموقع</Label>
                    <Input
                      placeholder="عربي، إنجليزي..."
                      className="bg-white/5 border-white/10 text-white"
                      value={formData.siteLanguage}
                      onChange={e => setFormData({ ...formData, siteLanguage: e.target.value })}
                      data-testid="input-siteLanguage"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm mb-2 block text-white/60">الوظائف المطلوبة</Label>
                  <Textarea
                    className="h-24 resize-none bg-white/5 border-white/10 text-white"
                    placeholder="اشرح الوظائف التي تريدها..."
                    value={formData.requiredFunctions}
                    onChange={e => setFormData({ ...formData, requiredFunctions: e.target.value })}
                    data-testid="input-requiredFunctions"
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { id: 'whatsapp', label: 'ربط واتس', field: 'whatsappIntegration' },
                    { id: 'social', label: 'ربط سوشيال', field: 'socialIntegration' },
                    { id: 'hosting', label: 'لديه استضافة', field: 'hasHosting' },
                    { id: 'domain', label: 'لديه دومين', field: 'hasDomain' },
                  ].map(item => (
                    <div key={item.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={item.id}
                        checked={(formData as any)[item.field]}
                        onChange={e => setFormData({ ...formData, [item.field]: e.target.checked })}
                        className="accent-[#00D4FF]"
                        data-testid={`checkbox-${item.id}`}
                      />
                      <Label htmlFor={item.id} className="text-xs cursor-pointer text-white/50">{item.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <p className="text-sm text-white/30 mb-4">يمكنك رفع روابط المستندات هنا (أو تركها فارغة للمناقشة لاحقاً)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'اللوجو', field: 'logoUrl' },
                    { label: 'الهوية التجارية', field: 'brandIdentityUrl' },
                    { label: 'المحتوى النصي', field: 'contentUrl' },
                    { label: 'بيانات الدخول (اختياري)', field: 'accessCredentials' },
                  ].map(item => (
                    <div key={item.field}>
                      <Label className="text-sm mb-1 block text-white/60">{item.label}</Label>
                      <Input
                        placeholder="رابط الملف..."
                        className="bg-white/5 border-white/10 text-white"
                        value={(formData as any)[item.field]}
                        onChange={e => setFormData({ ...formData, [item.field]: e.target.value })}
                        data-testid={`input-${item.field}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <RadioGroup value={formData.paymentMethod} onValueChange={val => setFormData({ ...formData, paymentMethod: val })}>
                  <div className="flex flex-col space-y-2 border border-white/10 p-4 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                    <div className="flex items-center space-x-reverse space-x-3">
                      <RadioGroupItem value="bank_transfer" id="bank" data-testid="radio-bank" />
                      <Label htmlFor="bank" className="flex-1 cursor-pointer font-medium text-white">تحويل بنكي (50% مقدم)</Label>
                    </div>
                    {formData.paymentMethod === 'bank_transfer' && (
                      <div className="mt-4 p-4 bg-[#00D4FF]/5 rounded-lg border border-[#00D4FF]/20 text-xs text-white/60">
                        <p className="font-bold text-[#00D4FF] mb-2">بيانات الحساب البنكي:</p>
                        <p className="font-mono">IBAN: SA0380205098017222121010</p>
                        <p className="mt-1">بنك الراجحي السعودي (بشرط المحول غير راجحي)</p>
                        <div className="mt-3">
                          <Label className="mb-1 block text-white/50">رابط إيصال التحويل</Label>
                          <Input
                            placeholder="رابط صورة الإيصال..."
                            className="bg-white/5 border-white/10 text-white"
                            value={formData.paymentProofUrl}
                            onChange={e => setFormData({ ...formData, paymentProofUrl: e.target.value })}
                            data-testid="input-paymentProof"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-reverse space-x-3 border border-white/10 p-4 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                    <RadioGroupItem value="paypal" id="paypal" data-testid="radio-paypal" />
                    <Label htmlFor="paypal" className="flex-1 cursor-pointer font-medium text-white">PayPal (دفع كامل)</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div className="bg-white/5 p-6 rounded-xl space-y-4 border border-white/10">
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-white/40">الخدمة</span>
                    <span className="font-bold text-[#00D4FF]">{service.title}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-white/40">نوع المشروع</span>
                    <span className="font-bold text-white">{formData.projectType || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-white/40">طريقة الدفع</span>
                    <span className="font-bold text-white">
                      {formData.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : 'PayPal'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-white/40">السعر المبدئي</span>
                    <span className="font-bold text-[#00D4FF]">{service.priceMin?.toLocaleString()} ر.س</span>
                  </div>
                  <div className="pt-2">
                    <span className="text-white/40 block mb-2">الوظائف المطلوبة</span>
                    <p className="text-xs text-white/60 bg-white/5 p-3 rounded-lg border border-white/10">
                      {formData.requiredFunctions || "لا توجد تفاصيل إضافية"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
              {step > 1 ? (
                <Button variant="outline" onClick={handleBack} className="min-w-[100px] border-white/10 text-white/60" data-testid="button-prev-step">
                  <ArrowRight className="ml-2 w-4 h-4" />
                  السابق
                </Button>
              ) : <div></div>}

              {step < 5 ? (
                <Button onClick={handleNext} className="premium-btn min-w-[100px]" data-testid="button-next-step">
                  التالي
                  <ArrowLeft className="mr-2 w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={createOrderMutation.isPending}
                  className="min-w-[100px] font-bold"
                  style={{ background: "linear-gradient(135deg, #00D4FF, #0099CC)", color: "#0A0A0F" }}
                  data-testid="button-confirm-order"
                >
                  {createOrderMutation.isPending ? <Loader2 className="animate-spin" /> : (
                    <>
                      <CheckCircle className="w-4 h-4 ml-2" />
                      تأكيد الطلب
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
