import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin, useRegister } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { api } from "@shared/routes";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Login() {
  const [location] = useLocation();
  const isRegister = location === "/register" || location === "/employee/register-secret";
  const isEmployeeRegister = location === "/employee/register-secret";
  
  const { mutate: login, isPending: isLoginPending, error: loginError } = useLogin();
  const { mutate: register, isPending: isRegisterPending, error: registerError } = useRegister();

  const isPending = isLoginPending || isRegisterPending;
  const error = loginError || registerError;

  const schema = isRegister 
    ? api.auth.register.input.extend({
        confirmPassword: z.string(),
        whatsappNumber: z.string().optional(),
        country: z.string().optional(),
        businessType: z.string().optional(),
        role: z.string().optional(),
      }).refine((data) => data.password === data.confirmPassword, {
        message: "كلمات المرور غير متطابقة",
        path: ["confirmPassword"],
      })
    : z.object({
        username: z.string().min(1, "اسم المستخدم مطلوب"),
        password: z.string().min(1, "كلمة المرور مطلوبة"),
      });

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-96 bg-primary skew-y-3 transform -translate-y-24 z-0"></div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
           <Link href="/">
             <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-2xl cursor-pointer hover:bg-white/20 transition-colors">
                <img src="/logo.png" alt="Qirox" className="w-10 h-10 object-contain filter invert" />
                <span className="text-3xl font-bold font-heading text-white">Qirox</span>
             </div>
           </Link>
        </div>

        <Card className="border-0 shadow-2xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primary to-secondary"></div>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold font-heading text-primary">
              {isRegister ? (isEmployeeRegister ? "تسجيل موظف جديد" : "إنشاء حساب جديد") : "تسجيل الدخول"}
            </CardTitle>
            <CardDescription>
              {isRegister 
                ? (isEmployeeRegister ? "أكمل بياناتك كموظف للانضمام للمنصة" : "أدخل بياناتك لإنشاء حساب والبدء في استخدام المنصة")
                : "مرحباً بك مجدداً، أدخل بياناتك للمتابعة"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 text-red-800">
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
                      <FormLabel>اسم المستخدم</FormLabel>
                      <FormControl>
                        <Input placeholder="user123" {...field} className="h-11 bg-slate-50 focus:bg-white transition-colors" />
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
                          <FormLabel>الاسم الكامل</FormLabel>
                          <FormControl>
                            <Input placeholder="محمد أحمد" {...field} className="h-11 bg-slate-50 focus:bg-white transition-colors" />
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
                          <FormLabel>البريد الإلكتروني</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="name@example.com" {...field} className="h-11 bg-slate-50 focus:bg-white transition-colors" />
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
                            <FormLabel>الدور الوظيفي</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11 bg-slate-50">
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
                          <FormLabel>رقم الواتساب</FormLabel>
                          <FormControl>
                            <Input placeholder="+966" {...field} className="h-11 bg-slate-50 focus:bg-white transition-colors" />
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
                              <FormLabel>الدولة</FormLabel>
                              <FormControl>
                                <Input placeholder="السعودية" {...field} className="h-11 bg-slate-50 focus:bg-white transition-colors" />
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
                              <FormLabel>نوع النشاط</FormLabel>
                              <FormControl>
                                <Input placeholder="تجاري" {...field} className="h-11 bg-slate-50 focus:bg-white transition-colors" />
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
                      <FormLabel>كلمة المرور</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} className="h-11 bg-slate-50 focus:bg-white transition-colors" />
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
                        <FormLabel>تأكيد كلمة المرور</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} className="h-11 bg-slate-50 focus:bg-white transition-colors" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button type="submit" className="w-full h-12 text-lg mt-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" disabled={isPending}>
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
          </CardContent>
          <CardFooter className="flex justify-center pb-8 bg-slate-50/50">
            <div className="text-sm text-slate-500">
              {isRegister ? "لديك حساب بالفعل؟" : "ليس لديك حساب؟"}{" "}
              <Link href={isRegister ? "/login" : "/register"} className="text-primary font-bold hover:underline">
                {isRegister ? "سجل دخولك" : "أنشئ حساباً جديداً"}
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
