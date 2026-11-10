import { useEffect, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Loader2, Mail, MessageCircle, Phone, RefreshCw, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCustomer } from "@/contexts/CustomerContext";
import { customerStorage } from "@/lib/customer-storage";
import { brand } from "@/lib/brand";
import { useTranslation } from "react-i18next";

type PublicConfig = {
  businessName?: string;
  logoUrl?: string;
  primaryColor?: string;
  heroImageUrl?: string;
};

type AccessMode = "login" | "register";
type PendingAction = "send" | "verify" | null;

function toWesternDigits(value: string) {
  return value.replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, digit => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}

function normalizeSaudiPhone(value: string) {
  let digits = toWesternDigits(value).replace(/\D/g, "");
  if (digits.startsWith("966")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 9);
}

function safePrimaryColor(value?: string) {
  if (value && /^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(value)) return value;
  return brand.colors.primary.hex;
}

async function requestJson<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    credentials: "include",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const candidate = String(payload.message || payload.error || "");
    const message = candidate.length > 0 && candidate.length <= 180 &&
      !/dev.?otp|otp\s*[:=]\s*\d{4,}|verification code.{0,20}\d{4,}|stack|password|token|secret/i.test(candidate)
      ? candidate
      : "Could not complete this request. Please try again.";
    throw new Error(message);
  }
  return payload as T;
}

export default function QiroxCustomerAccess({ compact = false, initialMode = "login", onAuthenticated }: { compact?: boolean; initialMode?: AccessMode; onAuthenticated?: () => void } = {}) {
  const { i18n } = useTranslation();
  const isArabic = i18n.language?.toLowerCase().startsWith("ar") ?? true;
  const [, setLocation] = useLocation();
  const { setCustomer } = useCustomer();
  const { toast } = useToast();
  const [mode, setMode] = useState<AccessMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [pending, setPending] = useState<PendingAction>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const { data: publicConfig, isError: configError, refetch: retryPublicConfig } = useQuery<PublicConfig>({
    queryKey: ["/api/saas/public-config"],
    retry: false,
    queryFn: () => requestJson<PublicConfig>("/api/saas/public-config"),
  });

  const text = (ar: string, en: string) => isArabic ? ar : en;
  const accent = safePrimaryColor(publicConfig?.primaryColor);
  const businessName = publicConfig?.businessName || (isArabic ? brand.nameAr : brand.nameEn);
  const logo = publicConfig?.logoUrl || brand.logoCustomer || brand.logoAssetCustomer;
  const heroImage = publicConfig?.heroImageUrl;
  const BackIcon = isArabic ? ArrowRight : ArrowLeft;

  useEffect(() => {
    if (expiresAt === null) {
      setRemainingSeconds(0);
      return;
    }
    const updateRemaining = () => setRemainingSeconds(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  const startOver = () => {
    setChallengeId(null);
    setExpiresAt(null);
    setCode("");
    setErrorMessage("");
  };

  const validateDetails = () => {
    const cleanPhone = normalizeSaudiPhone(phone);
    if (cleanPhone.length !== 9 || !cleanPhone.startsWith("5")) {
      setErrorMessage(text("أدخل رقم جوال سعودي يبدأ بـ 5 ويتكون من 9 أرقام.", "Enter a Saudi mobile number: 9 digits starting with 5."));
      return null;
    }
    if (mode === "register" && name.trim().length < 2) {
      setErrorMessage(text("أدخل الاسم بحرفين على الأقل.", "Enter a name with at least 2 characters."));
      return null;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage(text("تحقق من صيغة البريد الإلكتروني.", "Enter a valid email address."));
      return null;
    }
    return cleanPhone;
  };

  const sendCode = async (event?: FormEvent) => {
    event?.preventDefault();
    const cleanPhone = validateDetails();
    if (!cleanPhone) return;
    setPending("send");
    setErrorMessage("");
    try {
      const result = await requestJson<{ challengeId?: string; expiresIn?: number }>("/api/saas/customer/send-code", {
        phone: cleanPhone,
        name: mode === "register" ? name.trim() : "",
        email: email.trim(),
      });
      if (!result.challengeId) throw new Error(text("تعذر بدء التحقق. أعد المحاولة.", "Could not start verification. Please try again."));
      const duration = Number.isFinite(result.expiresIn) && Number(result.expiresIn) > 0 ? Number(result.expiresIn) : 300;
      setPhone(cleanPhone);
      setChallengeId(result.challengeId);
      setExpiresAt(Date.now() + duration * 1000);
      setCode("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : text("تعذر إرسال رمز WhatsApp. أعد المحاولة.", "Could not send the WhatsApp code. Please retry."));
    } finally {
      setPending(null);
    }
  };

  const verifyCode = async (event: FormEvent) => {
    event.preventDefault();
    if (!challengeId || remainingSeconds <= 0) {
      setErrorMessage(text("انتهت صلاحية الرمز. أرسل رمزاً جديداً للمتابعة.", "This code has expired. Request a new code to continue."));
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setErrorMessage(text("أدخل الرمز المكوّن من 6 أرقام.", "Enter the 6-digit code."));
      return;
    }
    setPending("verify");
    setErrorMessage("");
    try {
      const result = await requestJson<{ customer?: Record<string, unknown> } & Record<string, unknown>>(
        "/api/saas/customer/verify-code",
        {
          phone,
          challengeId,
          code,
          name: mode === "register" ? name.trim() : "",
          email: email.trim(),
        },
      );
      const rawCustomer = (result.customer || result) as Record<string, unknown>;
      const customer = Object.fromEntries(
        Object.entries(rawCustomer).filter(([key]) => !/^(?:devOtp|otp|token|accessToken|refreshToken|challengeId)$/i.test(key)),
      );
      if (!customer || typeof customer !== "object" || !customer.id || !customer.phone) {
        throw new Error(text("تعذر تأكيد جلسة العميل. أعد المحاولة.", "Customer session could not be confirmed. Please retry."));
      }

      // Keep the template's established customer cache/context behavior; the API's session cookie remains authoritative.
      setCustomer(customer as Parameters<typeof setCustomer>[0]);
      customerStorage.clearGuestInfo();
      customerStorage.setGuestMode(false);
      toast({
        title: text("مرحباً بك!", "Welcome!"),
        description: result.emailStatus === "failed"
          ? text("تم تسجيل دخولك، لكن تعذر إرسال رسالة البريد. راجع إدارة النظام.", "You are signed in, but the email could not be sent. Contact the system administrator.")
          : text(`أهلاً ${String(customer.name || name || "")}`, `Hello ${String(customer.name || name || "")}`),
      });
      if (onAuthenticated) onAuthenticated();
      else setLocation("/");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : text("تعذر التحقق من الرمز. أعد المحاولة.", "Could not verify the code. Please retry."));
    } finally {
      setPending(null);
    }
  };

  const timeLabel = `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className={`relative flex ${compact ? "min-h-0" : "min-h-[100dvh]"} items-center justify-center overflow-hidden bg-gradient-to-br from-background via-primary/[0.07] to-background p-4 sm:p-6`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 overflow-hidden">
        {heroImage && <img src={heroImage} alt="" className="h-full w-full object-cover opacity-20" />}
        <div className="absolute inset-0 bg-gradient-to-b from-background/35 via-background/70 to-background" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div
            className="mb-4 flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-[24px] border border-border/70 bg-card p-2 shadow-lg"
            style={{ boxShadow: `0 12px 34px -18px ${accent}88` }}
          >
            {logo ? <img src={logo} alt={businessName} className="h-full w-full object-contain" /> : <MessageCircle className="h-8 w-8" style={{ color: accent }} />}
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">{text("دخول آمن للعملاء", "CUSTOMER ACCESS")}</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl">{businessName}</h1>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            {text("سجّل الدخول أو أنشئ حساباً جديداً باستخدام رمز تحقق عبر WhatsApp.", "Sign in or create an account with a one-time WhatsApp verification code.")}
          </p>
          {configError && (
            <div role="status" className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{text("تعذّر تحميل بعض تفاصيل النشاط.", "Some business details could not be loaded.")}</span>
              <button type="button" onClick={() => void retryPublicConfig()} className="font-semibold underline underline-offset-2">
                {text("إعادة المحاولة", "Retry")}
              </button>
            </div>
          )}
        </div>

        <Card className="overflow-hidden border-border/70 bg-card/95 shadow-2xl shadow-primary/10 backdrop-blur-sm">
          <CardHeader className="space-y-4 pb-4">
            <div className="flex items-center justify-between gap-3">
              {challengeId ? (
                <button type="button" onClick={startOver} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground">
                  <BackIcon className="h-4 w-4" />{text("تغيير البيانات", "Change details")}
                </button>
              ) : <span className="text-xs font-medium text-muted-foreground">{text("متابعة آمنة", "Secure sign-in")}</span>}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[10px] font-semibold text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />{text("جلسة محمية", "Protected session")}
              </span>
            </div>
            <div>
              <CardTitle className="text-xl font-bold">{challengeId ? text("تحقق من رقمك", "Verify your number") : text("مرحباً بك", "Welcome")}</CardTitle>
              <CardDescription className="mt-1.5 leading-5">
                {challengeId
                  ? text(`أرسلنا رمزاً إلى WhatsApp على +966 ${phone}.`, `A code was sent on WhatsApp to +966 ${phone}.`)
                  : text("استخدم رقم جوالك السعودي للمتابعة.", "Use your Saudi mobile number to continue.")}
              </CardDescription>
            </div>
            {!challengeId && (
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/70 p-1" role="tablist" aria-label={text("نوع الحساب", "Account type")}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "login"}
                  onClick={() => { setMode("login"); setErrorMessage(""); }}
                  className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${mode === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >{text("تسجيل الدخول", "Sign in")}</button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "register"}
                  onClick={() => { setMode("register"); setErrorMessage(""); }}
                  className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${mode === "register" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >{text("حساب جديد", "Create account")}</button>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {!challengeId ? (
              <form onSubmit={sendCode} className="space-y-4">
                {mode === "register" && (
                  <div className="space-y-2">
                    <Label htmlFor="qirox-customer-name" className="flex items-center gap-2 text-sm font-semibold"><UserRound className="h-4 w-4 text-muted-foreground" />{text("الاسم", "Name")}</Label>
                    <Input
                      id="qirox-customer-name"
                      autoComplete="name"
                      value={name}
                      onChange={event => setName(event.target.value)}
                      placeholder={text("اسمك الكامل", "Your full name")}
                      minLength={2}
                      required
                      className="h-11 rounded-xl bg-background"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="qirox-customer-phone" className="flex items-center gap-2 text-sm font-semibold"><Phone className="h-4 w-4 text-muted-foreground" />{text("رقم الجوال السعودي", "Saudi mobile number")}</Label>
                  <div className="flex h-11 overflow-hidden rounded-xl border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                    <span dir="ltr" className="flex shrink-0 items-center border-r border-input px-3 font-mono text-sm text-muted-foreground">+966</span>
                    <Input
                      id="qirox-customer-phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      dir="ltr"
                      value={phone}
                      onChange={event => { setPhone(normalizeSaudiPhone(event.target.value)); setErrorMessage(""); }}
                      placeholder="5xxxxxxxx"
                      maxLength={9}
                      required
                      className="h-full rounded-none border-0 bg-transparent text-left font-mono tracking-wider shadow-none focus-visible:ring-0"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">{text("أدخل 9 أرقام تبدأ بـ 5.", "Enter 9 digits starting with 5.")}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qirox-customer-email" className="flex items-center gap-2 text-sm font-semibold"><Mail className="h-4 w-4 text-muted-foreground" />{text("البريد الإلكتروني (اختياري)", "Email (optional)")}</Label>
                  <Input
                    id="qirox-customer-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    dir="ltr"
                    value={email}
                    onChange={event => { setEmail(event.target.value); setErrorMessage(""); }}
                    placeholder="name@example.com"
                    className="h-11 rounded-xl bg-background text-left"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={pending !== null}
                  className="h-12 w-full rounded-xl text-base font-bold text-primary-foreground shadow-md transition-transform hover:-translate-y-0.5"
                  style={{ backgroundColor: accent }}
                >
                  {pending === "send" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageCircle className="mr-2 h-4 w-4" />}
                  {pending === "send" ? text("جارٍ إرسال الرمز…", "Sending code…") : text("إرسال رمز WhatsApp", "Send WhatsApp code")}
                </Button>
              </form>
            ) : (
              <form onSubmit={verifyCode} className="space-y-4">
                <div className="rounded-xl border border-primary/15 bg-primary/[0.045] p-3.5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><MessageCircle className="h-4 w-4" /></span>
                    <p className="text-xs leading-5 text-muted-foreground">{text("افتح محادثة WhatsApp وأدخل رمز التحقق المكوّن من 6 أرقام. لا تشارك الرمز مع أي شخص.", "Open WhatsApp and enter the 6-digit verification code. Never share the code with anyone.")}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qirox-customer-code" className="text-sm font-semibold">{text("رمز التحقق", "Verification code")}</Label>
                  <Input
                    id="qirox-customer-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    dir="ltr"
                    value={code}
                    onChange={event => { setCode(toWesternDigits(event.target.value).replace(/\D/g, "").slice(0, 6)); setErrorMessage(""); }}
                    placeholder="••••••"
                    maxLength={6}
                    required
                    className="h-14 rounded-xl bg-background text-center font-mono text-2xl tracking-[0.55em]"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{remainingSeconds > 0 ? text(`ينتهي خلال ${timeLabel}`, `Expires in ${timeLabel}`) : text("انتهت صلاحية الرمز", "Code expired")}</span>
                  {remainingSeconds > 0 && <span>{text("صالحة لمدة 5 دقائق", "Valid for 5 minutes")}</span>}
                </div>
                <Button type="submit" disabled={pending !== null || remainingSeconds <= 0 || code.length !== 6} className="h-12 w-full rounded-xl text-base font-bold text-primary-foreground shadow-md" style={{ backgroundColor: accent }}>
                  {pending === "verify" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  {pending === "verify" ? text("جارٍ التحقق…", "Verifying…") : text("تأكيد وتسجيل الدخول", "Verify and sign in")}
                </Button>
                <Button type="button" variant="outline" onClick={() => void sendCode()} disabled={pending !== null} className="h-11 w-full rounded-xl">
                  {pending === "send" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  {pending === "send" ? text("جارٍ إرسال رمز جديد…", "Sending a new code…") : text("إعادة إرسال الرمز", "Resend code")}
                </Button>
              </form>
            )}

            {errorMessage && (
              <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">
                <span className="leading-5">{errorMessage}</span>
                {pending === null && !challengeId && <button type="button" onClick={() => void sendCode()} className="shrink-0 font-semibold underline underline-offset-2">{text("إعادة المحاولة", "Retry")}</button>}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 border-t border-border/70 pt-4 text-[11px] leading-5 text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: accent }} />
              <span>{text("رمز مؤقت للتحقق فقط. لا نطلب كلمة مرور.", "One-time verification only. We never ask for a password.")}</span>
            </div>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-[10px] tracking-wide text-muted-foreground/75">{text("بالاستمرار، سيتم إنشاء جلسة عميل آمنة لهذا المتصفح.", "Continuing creates a secure customer session in this browser.")}</p>
      </div>
    </main>
  );
}