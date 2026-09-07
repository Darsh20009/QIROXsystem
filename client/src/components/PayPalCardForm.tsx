import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { Loader2, CreditCard, AlertCircle, CheckCircle, Lock, Info } from "lucide-react";

const SAR_TO_USD = 3.75;

interface PayPalCardFormProps {
  amount: number;
  currency?: string;
  onPaymentSuccess?: (data: any) => void;
  onPaymentError?: (error: any) => void;
}

export interface PayPalCardFormHandle {
  submit: () => Promise<void>;
  isReady: boolean;
}

const PayPalCardForm = forwardRef<PayPalCardFormHandle, PayPalCardFormProps>(
  function PayPalCardForm({ amount, currency = "USD", onPaymentSuccess, onPaymentError }, ref) {
    const [status, setStatus] = useState<"loading" | "ready" | "processing" | "success" | "error" | "unavailable">("loading");
    const [errorMsg, setErrorMsg] = useState("");
    const cardFieldsRef = useRef<any>(null);
    const mountedRef = useRef(false);

    useImperativeHandle(ref, () => ({
      submit: async () => {
        if (!cardFieldsRef.current) throw new Error("نموذج البطاقة غير جاهز");
        setStatus("processing");
        try {
          await cardFieldsRef.current.submit({});
        } catch (e: any) {
          setStatus("error");
          const msg = e?.message || "فشل الدفع بالبطاقة";
          setErrorMsg(msg);
          onPaymentError?.(e);
          throw e;
        }
      },
      isReady: status === "ready",
    }), [status]);

    useEffect(() => {
      if (mountedRef.current) return;
      mountedRef.current = true;

      const init = async () => {
        try {
          const idRes = await fetch("/paypal/client-id");
          if (!idRes.ok) {
            setStatus("unavailable");
            return;
          }
          const { clientId } = await idRes.json();
          if (!clientId) { setStatus("unavailable"); return; }

          const scriptId = "paypal-sdk-card-fields";
          // PayPal JS SDK does not support SAR — always load with USD (server converts SAR→USD)
          const sdkCurrency = currency === "SAR" ? "USD" : currency;
          const loadScript = (): Promise<void> =>
            new Promise((resolve, reject) => {
              const existing = document.getElementById(scriptId);
              if (existing) { resolve(); return; }
              const s = document.createElement("script");
              s.id = scriptId;
              s.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&components=card-fields,buttons&currency=${sdkCurrency}`;
              s.async = true;
              s.onload = () => resolve();
              s.onerror = () => reject(new Error("فشل تحميل PayPal"));
              document.body.appendChild(s);
            });

          await loadScript();

          const paypal = (window as any).paypal;
          if (!paypal?.CardFields) {
            setStatus("unavailable");
            return;
          }

          const cf = paypal.CardFields({
            createOrder: async () => {
              const r = await fetch("/paypal/order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: amount.toFixed(2), currency, intent: "CAPTURE" }),
              });
              if (!r.ok) throw new Error("فشل إنشاء طلب الدفع");
              const order = await r.json();
              return order.id;
            },
            onApprove: async (data: any) => {
              try {
                const r = await fetch(`/paypal/order/${data.orderID}/capture`, { method: "POST" });
                const captured = await r.json();
                setStatus("success");
                onPaymentSuccess?.(captured);
              } catch (e) {
                setStatus("error");
                setErrorMsg("فشل تأكيد الدفع");
                onPaymentError?.(e);
              }
            },
            onError: (err: any) => {
              setStatus("error");
              setErrorMsg(err?.message || "خطأ في معالجة البطاقة");
              onPaymentError?.(err);
            },
          });

          if (!cf.isEligible()) {
            setStatus("unavailable");
            return;
          }

          cardFieldsRef.current = cf;

          const numberEl = document.getElementById("paypal-card-number");
          const expiryEl = document.getElementById("paypal-card-expiry");
          const cvvEl = document.getElementById("paypal-card-cvv");

          if (!numberEl || !expiryEl || !cvvEl) {
            setStatus("unavailable");
            return;
          }

          await cf.NumberField({
            style: { input: { "font-size": "14px", "font-family": "Cairo, sans-serif", color: "#111827", "font-weight": "600" }, ":focus": { color: "#0e7490" } },
            placeholder: "•••• •••• •••• ••••",
          }).render("#paypal-card-number");

          await cf.ExpiryField({
            style: { input: { "font-size": "14px", "font-family": "Cairo, sans-serif", color: "#111827", "font-weight": "600" }, ":focus": { color: "#0e7490" } },
            placeholder: "MM/YY",
          }).render("#paypal-card-expiry");

          await cf.CVVField({
            style: { input: { "font-size": "14px", "font-family": "Cairo, sans-serif", color: "#111827", "font-weight": "600" }, ":focus": { color: "#0e7490" } },
            placeholder: "CVV",
          }).render("#paypal-card-cvv");

          setStatus("ready");
        } catch (e: any) {
          setStatus("unavailable");
        }
      };

      init();
    }, []);

    if (status === "success") {
      return (
        <div className="flex items-center justify-center gap-2 py-6 text-emerald-600" data-testid="paypal-card-success">
          <CheckCircle className="w-5 h-5" />
          <span className="font-bold text-sm">تمّت عملية الدفع بالبطاقة بنجاح</span>
        </div>
      );
    }

    if (status === "unavailable") {
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center" data-testid="paypal-card-unavailable">
          <p className="text-xs text-amber-700 font-medium">الدفع بالبطاقة غير متاح حالياً في هذه المنطقة أو الحساب</p>
          <p className="text-xs text-amber-500 mt-1">يمكنك استخدام التحويل البنكي بدلاً من ذلك</p>
        </div>
      );
    }

    const usdEquiv = currency === "SAR" ? (amount / SAR_TO_USD).toFixed(2) : null;

    return (
      <div className="space-y-3" data-testid="paypal-card-form">
        {usdEquiv && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2" data-testid="paypal-currency-note">
            <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <p className="text-[11px] text-amber-700 leading-snug">
              سيتم الخصم بالدولار الأمريكي: <span className="font-black">${usdEquiv}</span> (ما يعادل {amount.toLocaleString()} ر.س بسعر الصرف الثابت)
            </p>
          </div>
        )}
        {status === "loading" && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="w-4 h-4 animate-spin text-black/30" />
            <span className="text-xs text-black/40">جاري تهيئة نموذج البطاقة...</span>
          </div>
        )}

        <div className={status === "loading" ? "opacity-0 pointer-events-none" : ""}>
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-black/50 uppercase tracking-wider mb-1.5">رقم البطاقة</label>
              <div
                id="paypal-card-number"
                className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-3 flex items-center transition-all focus-within:ring-2 focus-within:ring-cyan-300 focus-within:border-cyan-400"
                data-testid="paypal-card-number-field"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-black/50 uppercase tracking-wider mb-1.5">تاريخ الانتهاء</label>
                <div
                  id="paypal-card-expiry"
                  className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-3 flex items-center transition-all focus-within:ring-2 focus-within:ring-cyan-300 focus-within:border-cyan-400"
                  data-testid="paypal-card-expiry-field"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-black/50 uppercase tracking-wider mb-1.5">CVV</label>
                <div
                  id="paypal-card-cvv"
                  className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-3 flex items-center transition-all focus-within:ring-2 focus-within:ring-cyan-300 focus-within:border-cyan-400"
                  data-testid="paypal-card-cvv-field"
                />
              </div>
            </div>
          </div>

          {status === "error" && (
            <div className="flex items-center gap-2 mt-3 text-red-500 bg-red-50 rounded-xl p-3" data-testid="paypal-card-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="text-xs font-medium">{errorMsg || "خطأ في البطاقة، تحقق من البيانات وأعد المحاولة"}</span>
            </div>
          )}

          {status === "processing" && (
            <div className="flex items-center gap-2 mt-3 text-cyan-600 bg-cyan-50 rounded-xl p-3">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span className="text-xs font-medium">جاري معالجة البطاقة...</span>
            </div>
          )}

          <div className="flex items-center justify-center gap-1.5 mt-3">
            <Lock className="w-3 h-3 text-black/20" />
            <span className="text-[10px] text-black/30">مدفوعات مؤمّنة بـ PayPal</span>
          </div>
        </div>
      </div>
    );
  }
);

export default PayPalCardForm;
