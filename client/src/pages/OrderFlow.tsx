import { useState } from "react";
import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import { useUser } from "@/hooks/use-auth";
import { useService } from "@/hooks/use-services";
import { useCreateOrder } from "@/hooks/use-orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OrderFlow() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const serviceId = parseInt(searchParams.get("service") || "0");
  
  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: service, isLoading: isServiceLoading } = useService(serviceId);
  const { mutate: createOrder, isPending: isCreating } = useCreateOrder();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    requirements: {
      projectType: "",
      sector: "",
      competitors: "",
      visualStyle: "",
      likedExamples: "",
      requiredFunctions: "",
      requiredSystems: "",
      siteLanguage: "ar",
      whatsappIntegration: false,
      socialIntegration: false,
      hasLogo: false,
      wantsLogoDesign: false,
      hasHosting: false,
      hasDomain: false,
      documents: {
        logo: "",
        brandIdentity: "",
        files: "",
        textContent: "",
        images: "",
        videos: "",
        loginCredentials: ""
      }
    },
    paymentMethod: "bank_transfer",
    paymentProofUrl: ""
  });

  if (isUserLoading || isServiceLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  if (!user) {
    setLocation(`/login`);
    return null;
  }

  if (!service) {
    return <div className="text-center p-20">الخدمة غير موجودة</div>;
  }

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = () => {
    createOrder({
      serviceId: service.id,
      userId: user.id,
      requirements: formData.requirements,
      paymentMethod: formData.paymentMethod,
      paymentProofUrl: formData.paymentProofUrl,
      totalAmount: service.priceMin // Using min price as base placeholder
    }, {
      onSuccess: () => {
        toast({
          title: "تم استلام طلبك بنجاح",
          description: "سيتم التواصل معك قريباً لتأكيد التفاصيل.",
        });
        setLocation("/dashboard");
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navigation />
      
      <div className="flex-1 container mx-auto px-4 py-8 pt-32 max-w-3xl">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10"></div>
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                step >= s ? "bg-primary text-white scale-110" : "bg-slate-200 text-slate-500"
              }`}>
                {s}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] md:text-sm text-slate-600 font-medium px-1">
             <span>نوع المشروع</span>
             <span>المتطلبات</span>
             <span>المستندات</span>
             <span>الدفع</span>
             <span>تأكيد</span>
          </div>
        </div>

        <Card className="shadow-xl border-0 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primary to-secondary"></div>
          <CardHeader>
            <CardTitle className="text-2xl font-heading text-primary">
               {step === 1 && "نوع المشروع والقطاع"}
               {step === 2 && "المتطلبات الفنية والنمط"}
               {step === 3 && "رفع المستندات"}
               {step === 4 && "اختر طريقة الدفع"}
               {step === 5 && "ملخص الطلب"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <Label className="text-base mb-2 block">نوع المشروع</Label>
                      <Input 
                        placeholder="مثال: تطبيق توصيل"
                        className="bg-slate-50"
                        value={formData.requirements.projectType}
                        onChange={e => setFormData({...formData, requirements: {...formData.requirements, projectType: e.target.value}})}
                      />
                   </div>
                   <div>
                      <Label className="text-base mb-2 block">القطاع</Label>
                      <Input 
                        placeholder="مثال: قطاع التجزئة"
                        className="bg-slate-50"
                        value={formData.requirements.sector}
                        onChange={e => setFormData({...formData, requirements: {...formData.requirements, sector: e.target.value}})}
                      />
                   </div>
                </div>
                <div>
                   <Label className="text-base mb-2 block">المنافسين</Label>
                   <Input 
                     className="bg-slate-50" 
                     placeholder="اذكر أهم المنافسين..."
                     value={formData.requirements.competitors}
                     onChange={e => setFormData({...formData, requirements: {...formData.requirements, competitors: e.target.value}})}
                   />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <Label className="text-base mb-2 block">النمط البصري</Label>
                      <Input 
                        placeholder="مودرن، كلاسيك..."
                        className="bg-slate-50"
                        value={formData.requirements.visualStyle}
                        onChange={e => setFormData({...formData, requirements: {...formData.requirements, visualStyle: e.target.value}})}
                      />
                   </div>
                   <div>
                      <Label className="text-base mb-2 block">لغة الموقع</Label>
                      <Input 
                        placeholder="عربي، إنجليزي..."
                        className="bg-slate-50"
                        value={formData.requirements.siteLanguage}
                        onChange={e => setFormData({...formData, requirements: {...formData.requirements, siteLanguage: e.target.value}})}
                      />
                   </div>
                </div>
                <div>
                   <Label className="text-base mb-2 block">الوظائف المطلوبة</Label>
                   <Textarea 
                     className="h-24 resize-none bg-slate-50" 
                     placeholder="اشرح الوظائف التي تريدها..."
                     value={formData.requirements.requiredFunctions}
                     onChange={e => setFormData({...formData, requirements: {...formData.requirements, requiredFunctions: e.target.value}})}
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
                        checked={(formData.requirements as any)[item.field]}
                        onChange={e => setFormData({...formData, requirements: {...formData.requirements, [item.field]: e.target.checked}})}
                      />
                      <Label htmlFor={item.id} className="text-xs cursor-pointer">{item.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <p className="text-sm text-slate-500 mb-4">يمكنك رفع روابط المستندات هنا (أو تركها فارغة للمناقشة لاحقاً)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'اللوجو', field: 'logo' },
                    { label: 'الهوية التجارية', field: 'brandIdentity' },
                    { label: 'المحتوى النصي', field: 'textContent' },
                    { label: 'بيانات الدخول (اختياري)', field: 'loginCredentials' },
                  ].map(item => (
                    <div key={item.field}>
                      <Label className="text-sm mb-1 block">{item.label}</Label>
                      <Input 
                        placeholder="رابط الملف..."
                        className="bg-slate-50"
                        value={(formData.requirements.documents as any)[item.field]}
                        onChange={e => setFormData({...formData, requirements: {
                          ...formData.requirements, 
                          documents: { ...formData.requirements.documents, [item.field]: e.target.value }
                        }})}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <RadioGroup value={formData.paymentMethod} onValueChange={val => setFormData({...formData, paymentMethod: val})}>
                  <div className="flex flex-col space-y-2 border p-4 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-reverse space-x-3">
                      <RadioGroupItem value="bank_transfer" id="bank" />
                      <Label htmlFor="bank" className="flex-1 cursor-pointer font-medium">تحويل بنكي (50% مقدم)</Label>
                    </div>
                    {formData.paymentMethod === 'bank_transfer' && (
                      <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20 text-xs">
                        <p className="font-bold text-primary mb-2">بيانات الحساب البنكي:</p>
                        <p className="font-mono">IBAN: SA0380205098017222121010</p>
                        <p className="mt-1">بنك الراجحي السعودي (بشرط المحول غير راجحي)</p>
                        <div className="mt-3">
                          <Label className="mb-1 block">رابط إيصال التحويل</Label>
                          <Input 
                            placeholder="رابط صورة الإيصال..."
                            className="bg-white"
                            value={formData.paymentProofUrl}
                            onChange={e => setFormData({...formData, paymentProofUrl: e.target.value})}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-reverse space-x-3 border p-4 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <RadioGroupItem value="paypal" id="paypal" />
                    <Label htmlFor="paypal" className="flex-1 cursor-pointer font-medium">PayPal (دفع كامل)</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-xl space-y-4 border border-slate-100">
                   <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">الخدمة</span>
                      <span className="font-bold text-primary">{service.title}</span>
                   </div>
                   <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">نوع المشروع</span>
                      <span className="font-bold">{formData.requirements.projectType || "-"}</span>
                   </div>
                   <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">طريقة الدفع</span>
                      <span className="font-bold">
                        {formData.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : 'PayPal'}
                      </span>
                   </div>
                   <div className="pt-2">
                      <span className="text-slate-500 block mb-2">الوظائف المطلوبة</span>
                      <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border">
                         {formData.requirements.requiredFunctions || "لا توجد تفاصيل إضافية"}
                      </p>
                   </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
              {step > 1 ? (
                <Button variant="outline" onClick={handleBack} className="min-w-[100px]">
                  <ArrowRight className="ml-2 w-4 h-4" />
                  السابق
                </Button>
              ) : <div></div>}
              
              {step < 5 ? (
                <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 min-w-[100px]">
                  التالي
                  <ArrowLeft className="mr-2 w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isCreating} className="bg-secondary hover:bg-secondary/90 text-primary font-bold min-w-[100px]">
                  {isCreating ? <Loader2 className="animate-spin" /> : "تأكيد الطلب"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
