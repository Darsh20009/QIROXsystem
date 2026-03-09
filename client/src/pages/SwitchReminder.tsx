import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle2, Bell, ArrowLeft, Sparkles, Shield, Clock, Zap, Star, Phone, User, Building2, Calendar, FileText, ChevronRight } from "lucide-react";
import { Link } from "wouter";

const schema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  phone: z.string().min(9, "رقم الجوال مطلوب"),
  email: z.string().email("بريد إلكتروني غير صحيح").or(z.literal("")).optional(),
  currentProvider: z.string().min(2, "اسم الشركة أو المتجر الحالي مطلوب"),
  serviceType: z.string().optional(),
  subscriptionEndDate: z.string().min(1, "تاريخ انتهاء الاشتراك مطلوب"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const SERVICE_TYPES = [
  { value: "website", label: "موقع إلكتروني" },
  { value: "ecommerce", label: "متجر إلكتروني" },
  { value: "app", label: "تطبيق جوال" },
  { value: "erp", label: "نظام ERP / إدارة" },
  { value: "pos", label: "نظام نقطة بيع" },
  { value: "crm", label: "نظام CRM" },
  { value: "design", label: "تصميم وهوية بصرية" },
  { value: "marketing", label: "تسويق رقمي" },
  { value: "hosting", label: "استضافة ودومين" },
  { value: "other", label: "أخرى" },
];

const BENEFITS = [
  { icon: "🚀", title: "أنظمة أسرع وأكثر تطوراً", desc: "تقنيات حديثة تناسب نموك" },
  { icon: "💰", title: "أسعار تنافسية وشفافة", desc: "بدون رسوم خفية أو مفاجآت" },
  { icon: "🛡️", title: "دعم فني على مدار الساعة", desc: "فريق متخصص دائماً معك" },
  { icon: "⚡", title: "تحويل سلس بدون توقف", desc: "ننقل بياناتك ونضمن الاستمرارية" },
];

export default function SwitchReminder() {
  const { data: user } = useUser();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: (user as any)?.fullName || "",
      phone: (user as any)?.phone || "",
      email: (user as any)?.email || "",
      currentProvider: "",
      serviceType: "",
      subscriptionEndDate: "",
      notes: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/switch-reminder", data);
      return res.json();
    },
    onSuccess: () => setSubmitted(true),
    onError: (err: any) => {
      toast({ title: "خطأ", description: err.message || "حدث خطأ، حاول مرة أخرى", variant: "destructive" });
    },
  });

  // Min date = today (allow today's subscription end date)
  const today = new Date();
  const minDate = today.toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950" dir="rtl">
      {/* Hero */}
      <div className="relative bg-black overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="absolute top-0 left-0 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6 text-sm text-white/70">
              <Bell className="w-4 h-4 text-violet-400" />
              خدمة التذكير الذكي
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
              اشتراكك ينتهي قريباً؟
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                نحن هنا قبل أن يفوت الأوان
              </span>
            </h1>
            <p className="text-white/50 text-lg max-w-2xl mx-auto leading-relaxed mb-8">
              سجّل موعد انتهاء اشتراكك مع أي شركة أو متجر، وسيتواصل معك فريق Qirox Studio قبل الموعد ليعرض عليك مميزاتنا — اتخذ قرارك بهدوء وبمعلومات كاملة.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {BENEFITS.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center"
                >
                  <div className="text-2xl mb-2">{b.icon}</div>
                  <p className="text-white text-xs font-bold leading-snug">{b.title}</p>
                  <p className="text-white/30 text-[10px] mt-1">{b.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Form / Success */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-black text-black dark:text-white mb-3">تم التسجيل بنجاح! 🎉</h2>
              <p className="text-black/50 dark:text-white/50 text-base max-w-md mx-auto leading-relaxed mb-2">
                شكراً لثقتك. سيتواصل معك فريق Qirox Studio قبل انتهاء اشتراكك الحالي لعرض مميزاتنا وخياراتنا المتاحة.
              </p>
              <p className="text-black/30 dark:text-white/30 text-sm mb-8">
                سنتواصل معك عبر رقم الجوال أو البريد الإلكتروني الذي أدخلته.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/">
                  <Button className="bg-black hover:bg-black/80 text-white rounded-xl gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    العودة للرئيسية
                  </Button>
                </Link>
                <Button variant="outline" onClick={() => { setSubmitted(false); form.reset(); }} className="rounded-xl gap-2">
                  <Bell className="w-4 h-4" />
                  تسجيل اشتراك آخر
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-black dark:text-white mb-2">سجّل موعد اشتراكك</h2>
                <p className="text-black/50 dark:text-white/50 text-sm">سيصلك تواصل منا قبل انتهاء اشتراكك الحالي</p>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-3xl p-6 shadow-lg shadow-black/[0.04]">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((d) => submitMutation.mutate(d))} className="space-y-5">

                    {/* Name & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black dark:text-white font-semibold text-sm flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-black/40 dark:text-white/40" /> الاسم الكامل *
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="محمد العمري" data-testid="input-name" className="rounded-xl h-11 border-black/[0.1] dark:border-white/[0.1]" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black dark:text-white font-semibold text-sm flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-black/40 dark:text-white/40" /> رقم الجوال *
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="+966 5X XXX XXXX" data-testid="input-phone" className="rounded-xl h-11 border-black/[0.1] dark:border-white/[0.1]" dir="ltr" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    {/* Email */}
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black dark:text-white font-semibold text-sm flex items-center gap-1.5">
                          البريد الإلكتروني <span className="text-black/30 dark:text-white/30 font-normal text-xs">(اختياري)</span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="example@email.com" data-testid="input-email" className="rounded-xl h-11 border-black/[0.1] dark:border-white/[0.1]" dir="ltr" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Divider */}
                    <div className="border-t border-black/[0.06] dark:border-white/[0.06]" />

                    {/* Current Provider */}
                    <FormField control={form.control} name="currentProvider" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black dark:text-white font-semibold text-sm flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-black/40 dark:text-white/40" /> اسم الشركة / المتجر الحالي *
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="مثال: شركة X، متجر Y" data-testid="input-provider" className="rounded-xl h-11 border-black/[0.1] dark:border-white/[0.1]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Service Type & End Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="serviceType" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black dark:text-white font-semibold text-sm flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-black/40 dark:text-white/40" /> نوع الخدمة
                          </FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="rounded-xl h-11 border-black/[0.1] dark:border-white/[0.1]" data-testid="select-service-type">
                                <SelectValue placeholder="اختر نوع الخدمة" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SERVICE_TYPES.map(s => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="subscriptionEndDate" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black dark:text-white font-semibold text-sm flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-black/40 dark:text-white/40" /> تاريخ انتهاء الاشتراك *
                          </FormLabel>
                          <FormControl>
                            <Input {...field} type="date" min={minDate} data-testid="input-end-date" className="rounded-xl h-11 border-black/[0.1] dark:border-white/[0.1]" dir="ltr" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    {/* Notes */}
                    <FormField control={form.control} name="notes" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black dark:text-white font-semibold text-sm flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-black/40 dark:text-white/40" /> ملاحظات <span className="text-black/30 dark:text-white/30 font-normal text-xs">(اختياري)</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="أي معلومات إضافية تودّ مشاركتها معنا..." rows={3} data-testid="input-notes" className="rounded-xl border-black/[0.1] dark:border-white/[0.1] resize-none" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Info banner */}
                    <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/50 rounded-2xl p-4 flex gap-3">
                      <Shield className="w-5 h-5 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-violet-800 dark:text-violet-300 text-sm font-semibold">بياناتك آمنة معنا</p>
                        <p className="text-violet-600/70 dark:text-violet-400/70 text-xs mt-0.5 leading-relaxed">
                          لن تُستخدم بياناتك إلا للتواصل معك بشأن عرضنا. لا مشاركة مع أطراف ثالثة.
                        </p>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={submitMutation.isPending}
                      data-testid="btn-submit-switch-reminder"
                      className="w-full h-12 rounded-2xl bg-black hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90 text-white font-bold text-base gap-2 transition-all"
                    >
                      {submitMutation.isPending ? (
                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جارٍ الإرسال...</>
                      ) : (
                        <><Bell className="w-4 h-4" /> سجّل تذكيري</>
                      )}
                    </Button>
                  </form>
                </Form>
              </div>

              {/* Social proof */}
              <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                {[
                  { icon: <Star className="w-5 h-5 text-amber-500 mx-auto mb-1" />, val: "4.9/5", label: "تقييم العملاء" },
                  { icon: <Sparkles className="w-5 h-5 text-violet-500 mx-auto mb-1" />, val: "+200", label: "عميل موثوق" },
                  { icon: <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />, val: "24 ساعة", label: "وقت الاستجابة" },
                ].map((s, i) => (
                  <div key={i} className="bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl p-4 border border-black/[0.05] dark:border-white/[0.05]">
                    {s.icon}
                    <p className="text-black dark:text-white font-black text-lg">{s.val}</p>
                    <p className="text-black/40 dark:text-white/40 text-[11px]">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
