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
import { useI18n } from "@/lib/i18n";
import qiroxLogoPath from "@assets/QIROX_LOGO_1771674917456.png";

export default function Login() {
  const [location] = useLocation();
  const { t } = useI18n();
  const isRegister = location === "/register" || location === "/employee/register-secret";
  const isEmployeeRegister = location === "/employee/register-secret";

  const { mutate: login, isPending: isLoginPending, error: loginError } = useLogin();
  const { mutate: register, isPending: isRegisterPending, error: registerError } = useRegister();

  const isPending = isLoginPending || isRegisterPending;
  const error = loginError || registerError;

  const registerSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(6),
    email: z.string().email(),
    fullName: z.string().min(1),
    confirmPassword: z.string(),
    whatsappNumber: z.string().optional(),
    country: z.string().optional(),
    businessType: z.string().optional(),
    role: z.string().optional(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

  const loginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
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

  const inputClasses = "h-12 bg-black/[0.02] border-black/[0.08] focus:border-black/20 text-black placeholder:text-black/25 rounded-xl";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #000 1px, transparent 0)", backgroundSize: "32px 32px" }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-10">
          <Link href="/">
            <div className="inline-flex items-center gap-2.5 cursor-pointer group">
              <img src={qiroxLogoPath} alt="QIROX" className="h-10 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        </div>

        <div className="bg-white border border-black/[0.06] rounded-2xl overflow-hidden shadow-sm">
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold font-heading text-black mb-2">
                {isRegister ? (isEmployeeRegister ? t("login.employee.title") : t("login.register.title")) : t("login.title")}
              </h1>
              <p className="text-sm text-black/40">
                {isRegister
                  ? (isEmployeeRegister ? t("login.employee.subtitle") : t("login.register.subtitle"))
                  : t("login.subtitle")}
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 text-red-600">
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
                      <FormLabel className="text-black/50 text-sm">{t("login.username")}</FormLabel>
                      <FormControl>
                        <Input placeholder="user123" {...field} className={inputClasses} data-testid="input-username" />
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
                          <FormLabel className="text-black/50 text-sm">{t("login.fullName")}</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} className={inputClasses} data-testid="input-fullName" />
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
                          <FormLabel className="text-black/50 text-sm">{t("login.email")}</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="name@example.com" {...field} className={inputClasses} data-testid="input-email" />
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
                            <FormLabel className="text-black/50 text-sm">{t("login.role")}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className={inputClasses}>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="employee_manager">Manager</SelectItem>
                                <SelectItem value="employee_sales">Sales Manager</SelectItem>
                                <SelectItem value="employee_sales_exec">Sales</SelectItem>
                                <SelectItem value="employee_dev">Developer</SelectItem>
                                <SelectItem value="employee_design">Designer</SelectItem>
                                <SelectItem value="employee_support">Support</SelectItem>
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
                          <FormLabel className="text-black/50 text-sm">{t("login.whatsapp")}</FormLabel>
                          <FormControl>
                            <Input placeholder="+966" {...field} className={inputClasses} data-testid="input-whatsapp" />
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
                              <FormLabel className="text-black/50 text-sm">{t("login.country")}</FormLabel>
                              <FormControl>
                                <Input placeholder="Saudi Arabia" {...field} className={inputClasses} data-testid="input-country" />
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
                              <FormLabel className="text-black/50 text-sm">{t("login.businessType")}</FormLabel>
                              <FormControl>
                                <Input placeholder="Commercial" {...field} className={inputClasses} data-testid="input-businessType" />
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
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-black/50 text-sm">{t("login.password")}</FormLabel>
                        {!isRegister && (
                          <Link href="/forgot-password" className="text-[11px] text-black/35 hover:text-black/60 transition-colors" data-testid="link-forgot-password">
                            نسيت كلمة المرور؟
                          </Link>
                        )}
                      </div>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} className={inputClasses} data-testid="input-password" />
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
                        <FormLabel className="text-black/50 text-sm">{t("login.confirmPassword")}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} className={inputClasses} data-testid="input-confirmPassword" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button type="submit" className="w-full h-12 premium-btn rounded-xl font-semibold mt-6" disabled={isPending} data-testid="button-submit-login">
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t("login.processing")}
                    </>
                  ) : (
                    isRegister ? t("login.submitRegister") : t("login.submit")
                  )}
                </Button>
              </form>
            </Form>
          </div>
          <div className="py-5 text-center border-t border-black/[0.04] bg-black/[0.01]">
            <span className="text-sm text-black/40">
              {isRegister ? t("login.hasAccount") : t("login.noAccount")}{" "}
              <Link href={isRegister ? "/login" : "/register"} className="text-black font-bold hover:underline">
                {isRegister ? t("login.signIn") : t("login.createAccount")}
              </Link>
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
