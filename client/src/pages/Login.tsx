import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin, useRegister } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

export default function Login() {
  const [location] = useLocation();
  const isRegister = location === "/register" || location === "/employee/register-secret";
  const isEmployeeRegister = location === "/employee/register-secret";

  const { mutate: login, isPending: isLoginPending, error: loginError } = useLogin();
  const { mutate: register, isPending: isRegisterPending, error: registerError } = useRegister();

  const isPending = isLoginPending || isRegisterPending;
  const error = loginError || registerError;

  const registerSchema = z.object({
    username: z.string().min(1, "اسم المستخدم مطلوب"),
    password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
    email: z.string().email("البريد الإلكتروني غير صالح"),
    fullName: z.string().min(1, "الاسم الكامل مطلوب"),
    confirmPassword: z.string(),
    whatsappNumber: z.string().optional(),
    country: z.string().optional(),
    businessType: z.string().optional(),
    role: z.string().optional(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "كلمات المرور غير متطابقة",
    path: ["confirmPassword"],
  });

  const loginSchema = z.object({
    username: z.string().min(1, "اسم المستخدم مطلوب"),
    password: z.string().min(1, "كلمة المرور مطلوبة"),
  });

  const schema = isRegister ? registerSchema : loginSchema;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      fullName: "",
      confirmPassword: "",
      whatsappNumber: "",
      country: "",
      businessType: "",
      role: isEmployeeRegister ? "employee_manager" : "client",
    },
  });

  const onSubmit = (data: any) => {
    if (isRegister) {
      const { confirmPassword, ...userData } = data;
      register(userData);
    } else {
      login(data);
    }
  };

  const inputClasses = "h-12 bg-white/5 border-white/10 focus:border-[#00D4FF]/50 text-white placeholder:text-white/20 rounded-xl";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      <div className="absolute inset-0 dot-grid opacity-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-10">
          <Link href="/">
            <div className="inline-flex items-center gap-2.5 cursor-pointer group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:shadow-[0_0_20px_rgba(0,212,255,0.3)]" style={{ background: "linear-gradient(135deg, #00D4FF, #0099CC)" }}>
                <span className="text-lg font-black text-[#0A0A0F] font-heading">Q</span>
              </div>
              <span className="text-2xl font-black font-heading text-white tracking-tight">QIROX</span>
            </div>
          </Link>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #00D4FF, transparent)" }} />
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold font-heading text-white mb-2">
                {isRegister ? (isEmployeeRegister ? "تسجيل موظف جديد" : "إنشاء حساب جديد") : "تسجيل الدخول"}
              </h1>
              <p className="text-sm text-white/30">
                {isRegister
                  ? (isEmployeeRegister ? "أكمل بياناتك كموظف للانضمام للمنصة" : "أدخل بياناتك لإنشاء حساب والبدء")
                  : "مرحباً بك مجدداً، أدخل بياناتك للمتابعة"}
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/20 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/50 text-sm">اسم المستخدم</FormLabel>
                      <FormControl>
                        <Input placeholder="user123" {...field} className={inputClasses} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isRegister && (
                  <>
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/50 text-sm">الاسم الكامل</FormLabel>
                          <FormControl>
                            <Input placeholder="محمد أحمد" {...field} className={inputClasses} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/50 text-sm">البريد الإلكتروني</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="name@example.com" {...field} className={inputClasses} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {isEmployeeRegister && (
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white/50 text-sm">الدور الوظيفي</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className={inputClasses}>
                                  <SelectValue placeholder="اختر الدور" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="admin">مدير</SelectItem>
                                <SelectItem value="employee_manager">محاسب</SelectItem>
                                <SelectItem value="employee_sales">مدير مبيعات</SelectItem>
                                <SelectItem value="employee_sales_exec">مبيعات</SelectItem>
                                <SelectItem value="employee_dev">مبرمج</SelectItem>
                                <SelectItem value="employee_design">مصمم</SelectItem>
                                <SelectItem value="employee_support">دعم</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={form.control}
                      name="whatsappNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/50 text-sm">رقم الواتساب</FormLabel>
                          <FormControl>
                            <Input placeholder="+966" {...field} className={inputClasses} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {!isEmployeeRegister && (
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white/50 text-sm">الدولة</FormLabel>
                              <FormControl>
                                <Input placeholder="السعودية" {...field} className={inputClasses} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="businessType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white/50 text-sm">نوع النشاط</FormLabel>
                              <FormControl>
                                <Input placeholder="تجاري" {...field} className={inputClasses} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </>
                )}

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/50 text-sm">كلمة المرور</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} className={inputClasses} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isRegister && (
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/50 text-sm">تأكيد كلمة المرور</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} className={inputClasses} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button type="submit" className="w-full h-12 premium-btn rounded-xl font-semibold mt-6" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      جاري المعالجة...
                    </>
                  ) : (
                    isRegister ? "إنشاء الحساب" : "دخول"
                  )}
                </Button>
              </form>
            </Form>
          </div>
          <div className="py-5 text-center border-t border-white/5 bg-white/[0.02]">
            <span className="text-sm text-white/30">
              {isRegister ? "لديك حساب بالفعل؟" : "ليس لديك حساب؟"}{" "}
              <Link href={isRegister ? "/login" : "/register"} className="text-[#00D4FF] font-bold hover:underline">
                {isRegister ? "سجل دخولك" : "أنشئ حساباً جديداً"}
              </Link>
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
