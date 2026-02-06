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
    requirements: "",
    budget: "",
    timeline: "",
    paymentMethod: "bank_transfer"
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
      requirements: {
        description: formData.requirements,
        budget: formData.budget,
        timeline: formData.timeline
      },
      paymentMethod: formData.paymentMethod,
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
            {[1, 2, 3].map((s) => (
              <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                step >= s ? "bg-primary text-white scale-110" : "bg-slate-200 text-slate-500"
              }`}>
                {s}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-slate-600 font-medium px-1">
             <span>تفاصيل المشروع</span>
             <span>طريقة الدفع</span>
             <span>مراجعة وتأكيد</span>
          </div>
        </div>

        <Card className="shadow-xl border-0 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primary to-secondary"></div>
          <CardHeader>
            <CardTitle className="text-2xl font-heading text-primary">
               {step === 1 && "أخبرنا عن مشروعك"}
               {step === 2 && "اختر طريقة الدفع"}
               {step === 3 && "ملخص الطلب"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                   <Label className="text-base mb-2 block">تفاصيل ومتطلبات المشروع</Label>
                   <Textarea 
                     className="h-32 resize-none bg-slate-50" 
                     placeholder="اشرح فكرتك بالتفصيل..."
                     value={formData.requirements}
                     onChange={e => setFormData({...formData, requirements: e.target.value})}
                   />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <Label className="text-base mb-2 block">الميزانية المقترحة (ر.س)</Label>
                      <Input 
                        type="number" 
                        placeholder="5000"
                        className="bg-slate-50"
                        value={formData.budget}
                        onChange={e => setFormData({...formData, budget: e.target.value})}
                      />
                   </div>
                   <div>
                      <Label className="text-base mb-2 block">المدة الزمنية المتوقعة</Label>
                      <Input 
                        placeholder="مثال: شهرين"
                        className="bg-slate-50"
                        value={formData.timeline}
                        onChange={e => setFormData({...formData, timeline: e.target.value})}
                      />
                   </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <RadioGroup value={formData.paymentMethod} onValueChange={val => setFormData({...formData, paymentMethod: val})}>
                  <div className="flex items-center space-x-reverse space-x-3 border p-4 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <RadioGroupItem value="bank_transfer" id="bank" />
                    <Label htmlFor="bank" className="flex-1 cursor-pointer font-medium">تحويل بنكي</Label>
                  </div>
                  <div className="flex items-center space-x-reverse space-x-3 border p-4 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex-1 cursor-pointer font-medium">بطاقة مدى / فيزا (قريباً)</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-xl space-y-4 border border-slate-100">
                   <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">الخدمة</span>
                      <span className="font-bold text-primary">{service.title}</span>
                   </div>
                   <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">الميزانية المقترحة</span>
                      <span className="font-bold">{formData.budget || "-"} ر.س</span>
                   </div>
                   <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">طريقة الدفع</span>
                      <span className="font-bold">
                        {formData.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : 'بطاقة ائتمانية'}
                      </span>
                   </div>
                   <div className="pt-2">
                      <span className="text-slate-500 block mb-2">التفاصيل</span>
                      <p className="text-sm text-slate-700 bg-white p-3 rounded-lg border">
                         {formData.requirements || "لا توجد تفاصيل إضافية"}
                      </p>
                   </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
              {step > 1 ? (
                <Button variant="outline" onClick={handleBack} className="min-w-[120px]">
                  <ArrowRight className="ml-2 w-4 h-4" />
                  السابق
                </Button>
              ) : <div></div>}
              
              {step < 3 ? (
                <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 min-w-[120px]">
                  التالي
                  <ArrowLeft className="mr-2 w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isCreating} className="bg-secondary hover:bg-secondary/90 text-primary font-bold min-w-[120px]">
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
