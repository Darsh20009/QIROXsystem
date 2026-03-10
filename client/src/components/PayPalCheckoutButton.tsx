import { useEffect, useRef, useState } from "react";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

const SAR_TO_USD = 3.75;

interface PayPalCheckoutButtonProps {
  amount: number;
  currency?: string;
  onPaymentSuccess?: (data: any) => void;
  onPaymentError?: (error: any) => void;
  disabled?: boolean;
}

export default function PayPalCheckoutButton({
  amount,
  currency = "SAR",
  onPaymentSuccess,
  onPaymentError,
  disabled = false,
}: PayPalCheckoutButtonProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "processing" | "success" | "error" | "unavailable">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);
  const buttonsRef = useRef<any>(null);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const init = async () => {
      try {
        const idRes = await fetch("/paypal/client-id");
        if (!idRes.ok) { setStatus("unavailable"); return; }
        const { clientId } = await idRes.json();
        if (!clientId) { setStatus("unavailable"); return; }

        const sdkCurrency = currency === "SAR" ? "USD" : currency;
        const scriptId = "paypal-sdk-card-fields";

        const loadScript = (): Promise<void> =>
          new Promise((resolve, reject) => {
            const existing = document.getElementById(scriptId);
            if (existing) {
              if ((window as any).paypal) { resolve(); return; }
              existing.addEventListener("load", () => resolve());
              existing.addEventListener("error", () => reject(new Error("فشل تحميل PayPal")));
              return;
            }
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
        if (!paypal?.Buttons) { setStatus("unavailable"); return; }

        const usdAmount = currency === "SAR" ? (amount / SAR_TO_USD).toFixed(2) : amount.toFixed(2);

        const buttons = paypal.Buttons({
          style: {
            layout: "vertical",
            color: "gold",
            shape: "rect",
            label: "pay",
            height: 48,
          },
          createOrder: async () => {
            const r = await fetch("/paypal/order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ amount: usdAmount, currency: "USD", intent: "CAPTURE" }),
            });
            if (!r.ok) throw new Error("فشل إنشاء طلب الدفع");
            const order = await r.json();
            return order.id;
          },
          onApprove: async (data: any) => {
            setStatus("processing");
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
            setErrorMsg(err?.message || "خطأ في معالجة الدفع عبر PayPal");
            onPaymentError?.(err);
          },
          onCancel: () => {
            setStatus("ready");
          },
        });

        if (!buttons.isEligible()) { setStatus("unavailable"); return; }

        buttonsRef.current = buttons;

        if (containerRef.current) {
          await buttons.render(containerRef.current);
          setStatus("ready");
        }
      } catch (e: any) {
        setStatus("unavailable");
      }
    };

    init();
  }, []);

  if (status === "success") {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-emerald-600 bg-emerald-50 rounded-xl" data-testid="paypal-btn-success">
        <CheckCircle className="w-5 h-5" />
        <span className="font-bold text-sm">تمّ الدفع عبر PayPal بنجاح ✓</span>
      </div>
    );
  }

  if (status === "unavailable") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center" data-testid="paypal-btn-unavailable">
        <p className="text-xs text-amber-700 font-medium">PayPal غير متاح في هذه المنطقة حالياً</p>
        <p className="text-xs text-amber-500 mt-1">يمكنك استخدام التحويل البنكي بدلاً من ذلك</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center space-y-2" data-testid="paypal-btn-error">
        <div className="flex items-center justify-center gap-2 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-xs font-medium">{errorMsg || "خطأ في الدفع عبر PayPal"}</span>
        </div>
      </div>
    );
  }

  const usdEquiv = currency === "SAR" ? (amount / SAR_TO_USD).toFixed(2) : null;

  return (
    <div className="space-y-3" data-testid="paypal-checkout-button">
      {usdEquiv && (
        <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2">
          <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" alt="PayPal" className="h-4 rounded" />
          <p className="text-[11px] text-blue-700 leading-snug">
            سيتم الخصم <span className="font-black">${usdEquiv}</span> (يعادل {amount.toLocaleString()} ر.س — سعر صرف ثابت)
          </p>
        </div>
      )}

      {(status === "loading" || status === "processing") && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          <span className="text-xs text-black/50">
            {status === "processing" ? "جاري معالجة الدفع..." : "جاري تحميل PayPal..."}
          </span>
        </div>
      )}

      <div
        ref={containerRef}
        className={`w-full ${disabled ? "pointer-events-none opacity-50" : ""} ${status === "loading" || status === "processing" ? "hidden" : ""}`}
        data-testid="paypal-buttons-container"
      />
    </div>
  );
}
