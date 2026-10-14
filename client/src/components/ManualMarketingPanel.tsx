import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Link2, LoaderCircle, MessageCircle, Phone, Send, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  inferManualMarketingCountryCode,
  generateManualMarketingMessage,
  formatManualMarketingPrice,
  isManualMarketingSector,
  MANUAL_MARKETING_SECTORS,
  MANUAL_MARKETING_TIERS,
  manualMarketingAnnualPrices,
  normalizeManualMarketingPhone,
  type ManualMarketingSector,
} from "@shared/manual-marketing";
import {
  COUNTRY_NAMES_AR,
  COUNTRY_NAMES_EN,
  countryToFlag,
  getCurrencyForCountry,
  getSupportedCountryCodes,
} from "@/hooks/use-currency";
import { COUNTRIES } from "@/components/CountryPhoneInput";
import type { ManualMarketingLanguage } from "@shared/manual-marketing";

const regionNamesAr = new Intl.DisplayNames(["ar"], { type: "region" });
const regionNamesEn = new Intl.DisplayNames(["en"], { type: "region" });
const supportedCountryCodes = new Set(getSupportedCountryCodes());
const marketingCountryCodes = getSupportedCountryCodes().sort((a, b) =>
  getArabicCountryName(a).localeCompare(getArabicCountryName(b), "ar"),
);

function getArabicCountryName(code: string): string {
  return COUNTRY_NAMES_AR[code] || regionNamesAr.of(code) || code;
}

function getCountryName(code: string, language: ManualMarketingLanguage): string {
  return language === "en"
    ? COUNTRY_NAMES_EN[code] || regionNamesEn.of(code) || code
    : getArabicCountryName(code);
}

export default function ManualMarketingPanel() {
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [sector, setSector] = useState<ManualMarketingSector>("restaurant");
  const [countryCode, setCountryCode] = useState("SA");
  const [language, setLanguage] = useState<ManualMarketingLanguage>("ar");
  const [countryDetectedFromPhone, setCountryDetectedFromPhone] = useState(false);
  const [includePlanLink, setIncludePlanLink] = useState(true);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [lastSentFingerprint, setLastSentFingerprint] = useState("");
  const [knownLead, setKnownLead] = useState<any>(null);
  const [checkingLead, setCheckingLead] = useState(false);
  const [leadLookupError, setLeadLookupError] = useState("");
  const [confirmRepeat, setConfirmRepeat] = useState(false);
  const [whatsappConnected, setWhatsappConnected] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    const checkConnection = async () => {
      try {
        const response = await fetch("/api/whatsapp/crm/connection-status", { credentials: "include" });
        if (!response.ok) throw new Error("تعذر التحقق من اتصال واتساب");
        const data = await response.json();
        if (active) setWhatsappConnected(data.connected === true);
      } catch {
        if (active) setWhatsappConnected(null);
      }
    };
    void checkConnection();
    const timer = window.setInterval(checkConnection, 15000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const currencyDefinition = getCurrencyForCountry(countryCode);
  const currencyLocaleParts = currencyDefinition.locale.split("-");
  const currencyRegion = currencyLocaleParts[currencyLocaleParts.length - 1] || "SA";
  const marketingCurrency = useMemo(
    () => ({
      code: currencyDefinition.code,
      symbol: currencyDefinition.symbolShort,
      locale: `${language}-${currencyRegion}`,
      sarRate: currencyDefinition.rate,
    }),
    [currencyDefinition, currencyRegion, language],
  );
  const countryName = getCountryName(countryCode, language);
  const generatedMessage = useMemo(
    () => generateManualMarketingMessage(sector, {
      businessName,
      includePlanLink,
      countryName,
      currency: marketingCurrency,
      language,
    }),
    [sector, businessName, includePlanLink, countryName, marketingCurrency, language],
  );
  const [message, setMessage] = useState(generatedMessage);

  useEffect(() => setMessage(generatedMessage), [generatedMessage]);

  const callingCode = COUNTRIES.find((country) => country.code === countryCode)?.dial.replace(/\D/g, "") || "966";
  const normalizedPhone = normalizeManualMarketingPhone(phone, callingCode);
  const prices = manualMarketingAnnualPrices(sector);
  const fingerprint = `${normalizedPhone || phone}|${sector}|${countryCode}|${language}|${message.trim()}`;
  const alreadySent = Boolean(fingerprint && fingerprint === lastSentFingerprint && !confirmRepeat);
  const selectedSector = MANUAL_MARKETING_SECTORS.find((item) => item.key === sector)!;

  useEffect(() => {
    setKnownLead(null);
    setLeadLookupError("");
    setConfirmRepeat(false);
    if (!normalizedPhone) {
      setCheckingLead(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setCheckingLead(true);
      try {
        const response = await fetch(
          `/api/whatsapp/crm/manual-marketing/leads/lookup?phone=${encodeURIComponent(normalizedPhone)}`,
          { credentials: "include", signal: controller.signal },
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "تعذر فحص سجل الرقم");
        setKnownLead(data.lead || null);
      } catch (error: any) {
        if (!controller.signal.aborted) setLeadLookupError(error.message || "تعذر فحص سجل الرقم");
      } finally {
        if (!controller.signal.aborted) setCheckingLead(false);
      }
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [normalizedPhone]);

  async function sendManualMarketingMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!normalizedPhone) {
      toast({ title: "أدخل رقم واتساب صالحًا", variant: "destructive" });
      return;
    }
    if (!isManualMarketingSector(sector)) {
      toast({ title: "اختر قطاعًا من القائمة", variant: "destructive" });
      return;
    }
    if (!consentConfirmed) {
      toast({ title: "أكد موافقة العميل قبل الإرسال", variant: "destructive" });
      return;
    }
    if (knownLead?.leadStatus === "excluded" || knownLead?.leadStatus === "converted") {
      toast({ title: knownLead.leadStatus === "excluded" ? "هذا الرقم مستبعد من التواصل" : "هذا الرقم مرتبط بعميل فعلي", variant: "destructive" });
      return;
    }
    if (knownLead?.leadStatus === "sent" && !confirmRepeat) {
      toast({ title: "سبق إرسال رسالة لهذا الرقم", description: "أكد إرسال المتابعة أولًا إذا كان التواصل الجديد مقصودًا.", variant: "destructive" });
      return;
    }
    if (!message.trim() || message.trim().length > 2000) {
      toast({ title: "الرسالة مطلوبة ويجب ألا تتجاوز 2000 حرف", variant: "destructive" });
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/whatsapp/crm/manual-marketing/send", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: normalizedPhone,
          businessName,
          sector,
          countryCode,
          language,
          message: message.trim(),
          consentConfirmed: true,
          confirmRepeat,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "تعذر إرسال الرسالة");
      setLastSentFingerprint(fingerprint);
      setKnownLead((current: any) => ({
        ...(current || {}),
        id: data.leadId || current?.id,
        normalizedPhone,
        sector,
        countryCode,
        language,
        businessName,
        leadStatus: "sent",
        sentAt: new Date().toISOString(),
        exclusionSource: null,
      }));
      setConfirmRepeat(false);
      setConsentConfirmed(false);
      toast(data.warning
        ? {
            title: "تم إرسال النص",
            description: data.warning,
          }
        : {
            title: "تم إرسال الرسالة مع شعار QIROX",
            description: `أُرسلت من حساب QIROX إلى +${normalizedPhone}. ستُوجّه الردود إلى مسؤول المتابعة.`,
          });
    } catch (error: any) {
      if (/غير متصل|not connected/i.test(error.message || "")) setWhatsappConnected(false);
      toast({ title: "تعذر إرسال الرسالة", description: error.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section
      id="manual-marketing"
      className="rounded-2xl border border-emerald-200/70 dark:border-emerald-800/40 bg-white dark:bg-gray-900 overflow-hidden"
      dir="rtl"
    >
      <div className="px-5 py-4 bg-gradient-to-l from-emerald-50 to-white dark:from-emerald-950/30 dark:to-gray-900 border-b border-emerald-100 dark:border-emerald-900/40">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-black dark:text-white">التسويق اليدوي</h2>
            <p className="mt-1 text-xs leading-relaxed text-black/55 dark:text-white/55">
              جهّز رسالة مناسبة للقطاع، راجعها وعدّلها، ثم أرسلها يدويًا من حساب QIROX المتصل.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={sendManualMarketingMessage} className="p-4 md:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="manual-marketing-phone" className="text-xs font-bold text-black/70 dark:text-white/70">رقم العميل المحتمل</label>
            <div className="relative">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 dark:text-white/30" />
              <input
                id="manual-marketing-phone"
                value={phone}
                onChange={(event) => {
                  const nextPhone = event.target.value;
                  setPhone(nextPhone);
                  setConsentConfirmed(false);
                  const detectedCountry = inferManualMarketingCountryCode(
                    nextPhone,
                    COUNTRIES,
                    supportedCountryCodes,
                    countryCode,
                  );
                  if (detectedCountry) {
                    setCountryCode(detectedCountry);
                    setCountryDetectedFromPhone(true);
                  } else if (!nextPhone.trim()) {
                    setCountryDetectedFromPhone(false);
                  }
                }}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="رقم محلي أو دولي مثل +966..."
                required
                className="w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-950 pr-10 pl-3 text-sm font-mono outline-none focus:border-emerald-500"
                dir="ltr"
              />
            </div>
            {phone && !normalizedPhone && (
              <span className="block text-[10px] text-red-500">تحقق من الرقم؛ يجب أن يحتوي على 9 إلى 15 رقمًا.</span>
            )}
            {countryDetectedFromPhone && (
              <span className="block text-[10px] text-emerald-700 dark:text-emerald-300">
                تم استنتاج {getArabicCountryName(countryCode)} من مفتاح الرقم.
              </span>
            )}
            {checkingLead && (
              <span className="block text-[10px] text-black/50 dark:text-white/50">
                جارٍ التحقق من سجل هذا الرقم...
              </span>
            )}
            {leadLookupError && !checkingLead && (
              <span className="block text-[10px] text-amber-700 dark:text-amber-300">
                تعذّر تحميل سجل الرقم؛ سيعيد النظام التحقق قبل الإرسال.
              </span>
            )}
            {knownLead?.leadStatus === "sent" && (
              <div className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
                <p className="font-bold">
                  سبق إرسال رسالة إلى هذا الرقم
                  {knownLead.sentAt && ` بتاريخ ${new Date(knownLead.sentAt).toLocaleDateString("ar-SA")}`}.
                  {" "}الحالة الحالية: {knownLead.businessName || knownLead.lastReplyContactName || `+${knownLead.normalizedPhone}`}.
                </p>
                <label className="flex cursor-pointer items-start gap-2 leading-relaxed">
                  <input
                    type="checkbox"
                    checked={confirmRepeat}
                    onChange={(event) => setConfirmRepeat(event.target.checked)}
                    className="mt-0.5 accent-amber-600"
                  />
                  <span>أؤكد أن هذه متابعة مقصودة، وأوافق على إرسال رسالة أخرى لهذا الرقم.</span>
                </label>
              </div>
            )}
            {knownLead?.leadStatus === "excluded" && (
              <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs leading-relaxed text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                هذا الرقم مسجل كمستبعد من التواصل، ولن يُرسل إليه. {knownLead.exclusionSource === "recipient_opt_out" ? "العميل طلب إيقاف الرسائل." : "يمكن مراجعة حالته من صفحة العملاء المحتملين إذا عاد العميل وطلب التواصل."}
              </div>
            )}
            {knownLead?.leadStatus === "converted" && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                هذا الرقم مرتبط بعميل فعلي؛ أوقف التسويق اليدوي لهذا الرقم.
              </div>
            )}
          </div>

          <label className="space-y-1.5">
            <span className="text-xs font-bold text-black/70 dark:text-white/70">القطاع</span>
            <select
              value={sector}
              onChange={(event) => {
                if (isManualMarketingSector(event.target.value)) setSector(event.target.value);
                setConsentConfirmed(false);
              }}
              className="w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-950 px-3 text-sm outline-none focus:border-emerald-500"
            >
              {MANUAL_MARKETING_SECTORS.map((item) => (
                <option key={item.key} value={item.key}>{item.label}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-bold text-black/70 dark:text-white/70">اسم المقهى/الشركة (اختياري، يظهر في إشعار الرد)</span>
            <input
              value={businessName}
              onChange={(event) => { setBusinessName(event.target.value); setConsentConfirmed(false); }}
              maxLength={80}
              placeholder="مثال: مقهى..."
              className="w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-950 px-3 text-sm outline-none focus:border-emerald-500"
            />
            <span className="block text-[10px] text-black/40 dark:text-white/40">
              سيظهر اسم جهة الاتصال كما هو في واتساب، مع اسم المقهى/الشركة، عند تحويل الرد.
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="space-y-1.5">
            <span className="text-xs font-bold text-black/70 dark:text-white/70">بلد العميل لتحديد العملة والأسعار</span>
            <select
              value={countryCode}
              onChange={(event) => {
                setCountryCode(event.target.value);
                setCountryDetectedFromPhone(false);
                setConsentConfirmed(false);
              }}
              className="w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-950 px-3 text-sm outline-none focus:border-emerald-500"
            >
              {marketingCountryCodes.map((code) => {
                const currency = getCurrencyForCountry(code);
                return (
                  <option key={code} value={code}>
                    {countryToFlag(code)} {getArabicCountryName(code)} · {currency.code}
                  </option>
                );
              })}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-bold text-black/70 dark:text-white/70">لغة الرسالة</span>
            <select
              value={language}
              onChange={(event) => {
                setLanguage(event.target.value as ManualMarketingLanguage);
                setConsentConfirmed(false);
              }}
              className="w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-950 px-3 text-sm outline-none focus:border-emerald-500"
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
          <label className="inline-flex items-center gap-2 cursor-pointer text-black/70 dark:text-white/70">
            <input
              type="checkbox"
              checked={includePlanLink}
              onChange={(event) => setIncludePlanLink(event.target.checked)}
              className="accent-emerald-600"
            />
            <Link2 className="w-3.5 h-3.5 text-emerald-600" />
            إرفاق رابط الباقات
          </label>
          <span className="text-black/40 dark:text-white/40">
            {whatsappConnected === null
              ? "جارٍ التحقق من اتصال واتساب..."
              : whatsappConnected
                ? "حساب واتساب QIROX متصل وجاهز للإرسال"
                : "حساب واتساب QIROX غير متصل؛ اطلب من المسؤول إعادة توصيله"}
          </span>
        </div>

        <div className="rounded-xl bg-black/[0.025] dark:bg-white/[0.035] border border-black/[0.06] dark:border-white/[0.06] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-xs font-black text-black/70 dark:text-white/70">أسعار القطاع السنوية بعملة العميل</span>
            <span className="text-[10px] text-black/40 dark:text-white/40">
              {selectedSector.label} · {countryName} · {marketingCurrency.code}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {MANUAL_MARKETING_TIERS.map(({ key, label }) => (
              <div key={key} className="rounded-lg bg-white dark:bg-gray-900 border border-black/[0.05] dark:border-white/[0.05] px-3 py-2 flex items-center justify-between">
                <span className="text-xs font-bold text-black/65 dark:text-white/65">{label}</span>
                <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                  {formatManualMarketingPrice(prices[key].amount, marketingCurrency, language)}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-black/40 dark:text-white/40">
            المبالغ محوّلة من السعر الأساسي بالريال وفق سعر التحويل المستخدم في الموقع.
          </p>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-bold text-black/70 dark:text-white/70">معاينة الرسالة — يمكنك تعديلها قبل الإرسال</span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={11}
            maxLength={2000}
            required
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-950 p-3 text-sm leading-7 outline-none focus:border-emerald-500 resize-y"
            dir="auto"
          />
          <span className="block text-left text-[10px] text-black/35 dark:text-white/35" dir="ltr">{message.length}/2000</span>
        </label>

        <div className="flex items-center gap-3 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.025] dark:bg-white/[0.035] p-3">
          <div className="flex h-14 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black">
            <img src="/qirox-logo-full.png" alt="شعار QIROX المرفق" className="h-full w-full object-contain" />
          </div>
          <div className="text-xs leading-relaxed">
            <p className="font-bold text-black/75 dark:text-white/75">سيُرفق شعار QIROX تلقائيًا مع الرسالة.</p>
            <p className="mt-0.5 text-[10px] text-black/45 dark:text-white/45">
              إذا تجاوز النص 900 حرف، سيصل النص ثم صورة الشعار لتفادي حدّ التعليق في واتساب.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="flex items-start gap-2 text-xs leading-relaxed text-black/65 dark:text-white/65 cursor-pointer">
            <input
              type="checkbox"
              checked={consentConfirmed}
              onChange={(event) => setConsentConfirmed(event.target.checked)}
              className="mt-0.5 accent-emerald-600"
            />
            <span>أؤكد أن العميل وافق على استلام رسالة واتساب تسويقية، وسأحترم طلبه بإيقاف التواصل.</span>
          </label>
          <button
            type="submit"
            disabled={isSending || checkingLead || !normalizedPhone || !consentConfirmed || !message.trim() || alreadySent || whatsappConnected === false || knownLead?.leadStatus === "excluded" || knownLead?.leadStatus === "converted" || (knownLead?.leadStatus === "sent" && !confirmRepeat)}
            title={
              whatsappConnected === false ? "حساب واتساب QIROX غير متصل"
              : knownLead?.leadStatus === "excluded" ? "هذا الرقم مستبعد من التواصل"
              : knownLead?.leadStatus === "converted" ? "هذا الرقم مرتبط بعميل فعلي"
              : knownLead?.leadStatus === "sent" && !confirmRepeat ? "أكد المتابعة بعد الإرسال السابق"
              : undefined
            }
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isSending ? <LoaderCircle className="w-4 h-4 animate-spin" /> : alreadySent ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            {isSending ? "جارٍ الإرسال..." : knownLead?.leadStatus === "sent" && !confirmRepeat ? "تأكيد المتابعة مطلوب" : alreadySent ? "تم إرسال هذه الرسالة" : "إرسال يدوي"}
          </button>
        </div>
        <p className="text-[10px] text-black/40 dark:text-white/40 flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5" />
          عند الرد على هذه الرسالة، سيصل الرد إلى 0532441566، ولن يرد المساعد الآلي على محادثة الحملة.
        </p>
      </form>
    </section>
  );
}
